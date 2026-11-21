# tools/build_recipes_db.py — ⚡ Створення SQLite-графу рецептів ATM11 (сесія R1).
# Запуск: py -I tools/build_recipes_db.py
# Читає перевірені індекси (raw/recipes_index.json, raw/kubejs_index.json, raw/tags_index.json, raw/registry_index.json),
# оригінальні JSON-файли з JAR-пакетів та KubeJS, звіряє ситом із логами гри, і будує:
#   • atm11_guide/raw/recipes.db
#   • копію в ATM11-Companion/data/recipes.db
import os, sys, json, sqlite3, zipfile, io, re, time, shutil, collections, hashlib

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MC, MODS, RAW, CLIENT_JARS, jload
from extract_recipes import neoforge_jar, SKIPK, OUTK

HERE = os.path.dirname(os.path.abspath(__file__))
GUIDE_ROOT = os.path.dirname(HERE)
COMPANION_ROOT = os.path.abspath(os.path.join(GUIDE_ROOT, '..', 'ATM11-Companion'))
DB_OUT_RAW = os.path.join(RAW, 'recipes.db')
DB_OUT_COMPANION = os.path.join(COMPANION_ROOT, 'data', 'recipes.db')

CJ = next((p for p in CLIENT_JARS() if os.path.exists(p)), None)
NF = neoforge_jar()

def get_zip_or_dir(src, mod_jars):
    """Повертає відкритий ZipFile або None для вказаного джерела."""
    if src == 'minecraft' and CJ:
        return zipfile.ZipFile(CJ)
    if src == 'neoforge' and NF:
        return zipfile.ZipFile(NF)
    if src and src.endswith('.jar'):
        p = os.path.join(MODS, src)
        if os.path.exists(p):
            return zipfile.ZipFile(p)
    if src and '!' in src:
        out_j, in_j = src.split('!', 1)
        p = os.path.join(MODS, out_j)
        if os.path.exists(p):
            try:
                with zipfile.ZipFile(p) as z:
                    for n in z.namelist():
                        if n.endswith(in_j):
                            return zipfile.ZipFile(io.BytesIO(z.read(n)))
            except Exception:
                pass
    return None

def categorize(t):
    """Визначає категорію рецепта та прапорець in_world."""
    if t in ('minecraft:crafting_shaped', 'minecraft:crafting_shapeless'):
        return 'crafting_table', 0
    if t in ('minecraft:smelting', 'minecraft:blasting', 'minecraft:smoking'):
        return 'furnace', 0
    if t == 'minecraft:stonecutting':
        return 'stonecutter', 0
    if t in ('minecraft:smithing_transform', 'minecraft:smithing_trim'):
        return 'smithing_table', 0
    if t == 'minecraft:campfire_cooking':
        return 'campfire', 1
    if 'ritual' in t or 'awakening' in t or 'infusion' in t or 'altar' in t:
        return 'in_world_ritual', 1
    if 'transform' in t or 'transmutation' in t or 'in_world' in t or 'explosion' in t or 'goo' in t:
        return 'in_world_action', 1
    if 'crushing' in t or 'pulveriz' in t or 'mill' in t or 'centrifuge' in t or 'squeezer' in t or 'sawmill' in t:
        return 'machine_processing', 0
    if 'energiz' in t or 'inscriber' in t or 'assembler' in t or 'forge' in t or 'alloy' in t or 'collision' in t:
        return 'machine_processing', 0
    if 'theurgy' in t or 'alchem' in t or 'ferment' in t or 'brew' in t:
        return 'alchemical', 0
    if 'melt' in t or 'cast' in t:
        return 'foundry_casting', 0
    if 'crop' in t or 'tree' in t or 'beehive' in t or 'hive' in t:
        return 'farming', 0
    return 'machine_processing', 0

RX_REF = re.compile(r'^#?[a-z0-9_.-]+:[a-z0-9_./-]+$')   # ns:шлях або #ns:шлях — усе інше в базу не йде
WRAPPERS = ('ingredient', 'content', 'result', 'stack', 'itemStack', 'output')   # обгортка: сам запис — усередині (кількість / шанс — зовні)

def _clean_ref(s):
    """Рядок запису → (id або #тег, кількість): «3x ns:id», «ns:id[компоненти]»."""
    s = str(s).strip(); count = 1.0
    m = re.match(r'^(\d+)x\s+(.+)$', s)
    if m: count, s = float(m.group(1)), m.group(2)
    s = re.sub(r'\[.*$', '', s).strip()
    if s and ':' not in s: s = ('#minecraft:' + s[1:]) if s.startswith('#') else 'minecraft:' + s   # без простору імен — ванільний (як у грі)
    return s, count

def _num(v, default=1.0):
    try: return float(v)
    except (TypeError, ValueError): return default

def _common_item(kids, tags):
    """Предмет, спільний для всіх частин перетину (тег → його предмети з tags, предмет → він сам): спільних кілька — один із них
    (ванільний першим, далі за id — стало), бо назви для «перетину груп» немає; спільних немає / тег невідомий — None."""
    sets = []
    for kid in kids:
        if not kid: return None
        ref, is_tag, _ = kid[0]
        if is_tag and (not tags or ref[1:] not in tags): return None
        sets.append(set(tags[ref[1:]]) if is_tag else {ref})
    common = set.intersection(*sets) if sets else set()
    return min(common, key=lambda i: (not i.startswith('minecraft:'), i)) if common else None

CHOICE_NS = 'choice'   # простір імен груп «на вибір» серед тегів бази (item_tags): `choice:<відбиток складу>`

class Choices:
    """Слоти «на вибір» (K8): у грі в такий слот підходить будь-який предмет із переліку варіантів. Слот стає входом-групою
    `#choice:<відбиток>` — як тег: склад групи (лише предмети гри) пишеться в item_tags, тож міст працює з нею так само, як з
    тегом гри (будь-який предмет групи, представник, запаси). items — реєстр предметів гри (None — не відомий: варіанти не
    відсіюються), tags — тег → предмети. groups — зібрані групи: id → предмети в порядку рецепта."""
    def __init__(self, items=None, tags=None):
        self.items, self.tags, self.groups = items, tags or {}, {}

    @staticmethod
    def gid(members):
        return CHOICE_NS + ':' + hashlib.sha1('\n'.join(sorted(members)).encode('utf-8')).hexdigest()[:12]

    def one(self, variants):
        """Варіанти слота [(ref, is_tag, count)] → один вхід (ref, is_tag, count): група, якщо предметів гри серед варіантів
        кілька; єдиний предмет гри — він сам; склад невідомий (тег поза індексом) або предметів гри немає — перший варіант."""
        members = []
        for ref, is_tag, _ in variants:
            if is_tag and ref[1:] not in self.tags: return variants[0]
            for m in (self.tags[ref[1:]] if is_tag else [ref]):
                if (self.items is None or m in self.items) and m not in members: members.append(m)
        count = variants[0][2]
        if len(members) > 1:
            g = self.gid(members); self.groups[g] = members
            return ('#' + g, 1, count)
        return (members[0], 0, count) if members else variants[0]

def _one_of(variants, choices):
    """Слот з варіантами (по одному запису на варіант) → один вхід: різних варіантів немає — він сам; є облік груп (choices) —
    група або єдиний предмет гри (Choices.one); без обліку — перший варіант."""
    seen = []
    for v in variants:
        if v and not any(v[0] == s[0] for s in seen): seen.append(v)
    if len(seen) < 2: return seen
    return [choices.one(seen)] if choices else seen[:1]

def parse_ingredient_entry(ing, tags=None, choices=None, kinds=None):
    """Розбирає запис інгредієнта (слота) -> list of (item_or_tag, is_tag, count).
    Запис — рядок, об'єкт будь-якої вкладеності (поле item / id / items / value / block / fluid, tag або обгортка WRAPPERS;
    кількість обгортки count або amount множиться на внутрішню) або список — це варіанти «на вибір» (як у грі: список у місці
    інгредієнта — будь-який із них), так само список у полі items / value і «будь-що з переліку» (children). Варіанти → один
    вхід-група (choices, K8), без обліку груп — перший варіант. Перелік різних входів рецепта розбирає той, хто його знає
    (parse_raw), по одному; виняток — список під полем item / id (поле одного предмета): це перелік записів, кожен — окремий вхід.
    Складені інгредієнти NeoForge (K6): різниця — основа (base); перетин (children) — спільний предмет груп, якщо
    tags (тег → предмети) його показує, інакше перша частина.
    K29 (Д6): якщо запис має neoforge:ingredient_type без стандартних ключів і сам тип збігається з предметом або тегом
    предметів у реєстрі (kinds) — береться він (напр. enderio:conduit, apotheosis:gem, base_tier_wooden_storage)."""
    if not ing:
        return []
    if isinstance(ing, str):
        ref, count = _clean_ref(ing)
        return [(ref, 1 if ref.startswith('#') else 0, count)] if RX_REF.match(ref) else []
    if isinstance(ing, list):
        return _one_of([v for x in ing for v in parse_ingredient_entry(x, tags, choices, kinds)], choices)
    if isinstance(ing, dict):
        count = _num(ing['count'] if 'count' in ing else ing.get('amount', 1.0))
        scaled = lambda sub: [(ref, is_tag, c * count) for ref, is_tag, c in sub]
        for key in ('item', 'id', 'items', 'value', 'block', 'fluid'):
            if key in ing:
                v = ing[key]
                if key in ('item', 'id') and isinstance(v, list):   # список під полем одного предмета — перелік записів (не варіанти): кожен окремо
                    sub = [e for x in v for e in parse_ingredient_entry(x, tags, choices, kinds)]
                else: sub = parse_ingredient_entry(v, tags, choices, kinds)
                if sub: return scaled(sub)
        if 'base' in ing:
            sub = parse_ingredient_entry(ing['base'], tags, choices, kinds)
            if sub: return scaled(sub[:1])
        if isinstance(ing.get('children'), list):
            kids = [parse_ingredient_entry(x, tags, choices, kinds) for x in ing['children']]
            if str(ing.get('neoforge:ingredient_type', '')).endswith(':intersection'):   # перетин груп
                one = _common_item(kids, tags)
                sub = [(one, 0, 1.0)] if one else next((k for k in kids if k), [])
            else: sub = _one_of([k[0] for k in kids if k], choices)   # «будь-що з переліку»
            if sub: return scaled(sub[:1])
        if 'tag' in ing and isinstance(ing['tag'], str):
            t = ing['tag'] if ing['tag'].startswith('#') else '#' + ing['tag']
            return [(t, 1, count)] if RX_REF.match(t) else []
        for key in WRAPPERS:
            if key in ing:
                sub = parse_ingredient_entry(ing[key], tags, choices, kinds)
                if sub: return scaled(sub)
        ct = ing.get('neoforge:ingredient_type')
        if isinstance(ct, str) and kinds is not None and RX_REF.match(ct):
            if ct in kinds.items: return [(ct, 0, count)]
            if ct in kinds.item_tags: return [('#' + ct, 1, count)]
    return []

def parse_output_entry(out):
    """Розбирає результат рецепта -> list of (item_id, count, chance, is_primary). Форми запису — як в інгредієнта."""
    if not out:
        return []
    if isinstance(out, str):
        ref, count = _clean_ref(out)
        return [(ref, count, 1.0, 1)] if RX_REF.match(ref) else []   # вихід-тег («будь-що з групи») лишається як є
    if isinstance(out, list):
        res = []
        for i, x in enumerate(out):
            for item_id, count, chance, _ in parse_output_entry(x):
                res.append((item_id, count, chance, 1 if i == 0 else 0))
        return res
    if isinstance(out, dict):
        count = _num(out.get('count', 1.0)); chance = _num(out.get('chance', 1.0))
        if chance > 1.0: chance = min(1.0, chance / 10000.0)   # імовірність понад 1 — запис у десятитисячних (10000 = завжди)
        for key in ('id', 'item', 'items') + WRAPPERS:
            if key in out:
                v = out[key]
                if key == 'items' and isinstance(v, list): v = v[:1]
                sub = parse_output_entry(v)
                if sub: return [(item_id, c * count, ch * chance if chance != 1.0 else ch, prim) for item_id, c, ch, prim in sub]
        if 'tag' in out and isinstance(out['tag'], str):
            t = out['tag'] if out['tag'].startswith('#') else '#' + out['tag']
            return [(t, count, chance, 1)] if RX_REF.match(t) else []
    return []

class Kinds:
    """Що таке запис рецепта за реєстрами (K6): предмет гри, рідина чи інше (істота, блок без предмета, службовий id).
    strict — реєстр предметів узято з гри (знімок): тоді id поза ним — не предмет. Без знімка невідомий id лишається предметом
    (за файлами jar не видно предметів, які мод реєструє кодом). Тег, якого немає серед тегів рідин, — тег предметів."""
    def __init__(self, items, item_tags, fluids, fluid_tags, strict):
        self.items, self.item_tags, self.fluids, self.fluid_tags, self.strict = items, item_tags, fluids, fluid_tags, strict
    def is_fluid(self, ref):
        return (ref[1:] in self.fluid_tags) if ref.startswith('#') else (ref in self.fluids)
    def of(self, ref):
        if ref.startswith('#'): return 'fluid' if ref[1:] not in self.item_tags and ref[1:] in self.fluid_tags else 'item'
        if ref in self.items: return 'item'
        if ref in self.fluids: return 'fluid'
        return 'other' if self.strict else 'item'

FLUID_REF_KEYS = ('ingredient', 'id', 'fluid', 'tag')

def _fluid_ref(o, kinds):
    """Рідина запису з кількістю: рядок, тег або вкладений об'єкт / список (перший) → id або #тег рідини, інакше None."""
    if isinstance(o, str):
        ref, _ = _clean_ref(o)
        return ref if RX_REF.match(ref) and kinds.is_fluid(ref) else None
    if isinstance(o, list): return next((r for r in (_fluid_ref(x, kinds) for x in o) if r), None)
    if isinstance(o, dict):
        for k in FLUID_REF_KEYS:
            if k in o:
                r = _fluid_ref(('#' + o[k].lstrip('#')) if k == 'tag' and isinstance(o[k], str) else o[k], kinds)
                if r: return r
    return None

def parse_fluids(d, kinds):
    """Рідини рецепта за структурою запису -> list of (fluid_id або #тег, amount_mb, io_type): будь-де в рецепті об'єкт з полем
    amount, чий id / ingredient / fluid / tag — рідина за реєстром. Вихід — якщо запис лежить під ключем виходу (OUTK сита)."""
    res = []
    def walk(o, isout):
        if isinstance(o, dict):
            if 'amount' in o:
                ref = _fluid_ref({k: o[k] for k in FLUID_REF_KEYS if k in o}, kinds)
                if ref: res.append((ref, int(_num(o['amount'], 0)), 'output' if isout else 'input')); return
            for k, v in o.items():
                if k not in SKIPK: walk(v, isout or bool(OUTK.search(k)))
        elif isinstance(o, list):
            for x in o: walk(x, isout)
    walk(d, False)
    return res

def split_kinds(ings, outs, fls, kinds):
    """Серед предметів рецепта лишаються лише предмети: рідина йде до рідин (0 мВ — кількість у записі не вказано; уже відома
    рідина того ж напрямку не дублюється), інше (істоти, блоки без предмета) — окремим переліком. Головним виходом стає перший
    вихід-предмет. -> (ings, outs, fls, other: {'in': […], 'out': […]})"""
    fls = list(fls); have = {(f, io) for f, _, io in fls}; other = {}
    def route(ref, io):
        kind = kinds.of(ref)
        if kind == 'item': return True
        if kind == 'fluid':
            if (ref, io) not in have: fls.append((ref, 0, io)); have.add((ref, io))
        else: other.setdefault('in' if io == 'input' else 'out', []).append(ref)
        return False
    ings = [x for x in ings if route(x[0], 'input')]
    outs = [x for x in outs if route(x[0], 'output')]
    if outs and not any(x[3] for x in outs): outs[0] = outs[0][:3] + (1,)
    return ings, outs, fls, other

def parse_raw(rtype, raw_d, ingr=parse_ingredient_entry, slot_resolver=None):
    """Запис рецепта у формі datapack (JSON з jar, kubejs/data, kubejs/dynamic_data або відтворений з виклику KubeJS) →
    (входи, виходи, такти, FE, структура, жертва, додаткове). ingr — розбір інгредієнта (з тегами / групами / kinds);
    slot_resolver(slot_seq, raw_slot) — K29: розкриття нестандартного слота зі знімка гри за індексом непустого слота."""
    dur_ticks = 0; energy_fe = 0; structure_id = None; sacrifice_entity = None; extra_data = {}
    parsed_ings = []; parsed_outs = []
    unparsed = 0

    def take_slot(raw_slot, slot_seq, role='input', slot_pos=None, single=False, force_one=False):
        nonlocal unparsed
        parsed = ingr(raw_slot)
        if not parsed and slot_resolver is not None and raw_slot:
            got = slot_resolver(slot_seq, raw_slot)
            if got: parsed = [got] if isinstance(got, tuple) else list(got)
        if parsed:
            seq = parsed[:1] if single else parsed
            for it, ist, cnt in seq:
                parsed_ings.append((it, ist, 1.0 if force_one else cnt, role, slot_pos))
            return True
        if raw_slot:
            unparsed += 1
        return False

    def parse_shaped(d):
        pat = d.get('pattern', [])
        key_map = d.get('key', {})
        if isinstance(pat, list) and isinstance(key_map, dict):
            seq = 0
            for r_idx, row in enumerate(pat):
                if not isinstance(row, str): continue
                for c_idx, ch in enumerate(row):
                    slot = r_idx * 3 + c_idx
                    if ch != ' ' and ch in key_map:
                        take_slot(key_map[ch], seq, 'input', slot, single=True, force_one=True)
                        seq += 1

    if raw_d and isinstance(raw_d, dict):
        # 1. Minecraft Shaped
        if rtype == 'minecraft:crafting_shaped':
            parse_shaped(raw_d)
            parsed_outs = parse_output_entry(raw_d.get('result'))

        # 2. Minecraft Shapeless
        elif rtype == 'minecraft:crafting_shapeless':
            ings = raw_d.get('ingredients', [])
            for slot, ing in enumerate(ings):
                take_slot(ing, slot, 'input', slot, single=True)
            parsed_outs = parse_output_entry(raw_d.get('result'))

        # 3. Occultism Ritual
        elif rtype == 'occultism:ritual':
            structure_id = raw_d.get('pentacle_id')
            dur_ticks = int(raw_d.get('duration', 120)) * 20
            sac = raw_d.get('entity_to_sacrifice')
            if isinstance(sac, dict):
                sacrifice_entity = sac.get('tag') or sac.get('entity')
            elif isinstance(sac, str):
                sacrifice_entity = sac

            # предмет активації (ним клацають по золотій чаші) витрачається: усі класи ритуалів Occultism у finish
            # викликають activationItem.shrink(1) (K8, байт-код; ритуал Tier 5 робить стабілізатор Tier 5 із самого Tier 4)
            act_item = raw_d.get('activation_item')
            if act_item:
                for it, ist, c in ingr(act_item):
                    parsed_ings.append((it, ist, c, 'activation', None))

            for ing in raw_d.get('ingredients', []):
                for it, ist, c in ingr(ing):
                    parsed_ings.append((it, ist, c, 'pedestal', None))

            parsed_outs = parse_output_entry(raw_d.get('result'))
            if 'entity_to_summon' in raw_d:
                extra_data['entity_to_summon'] = raw_d['entity_to_summon']

        # 4. Powah Energizing
        elif rtype == 'powah:energizing':
            energy_fe = int(raw_d.get('energy', 0))
            for slot, ing in enumerate(raw_d.get('ingredients', [])):
                take_slot(ing, slot, 'input', slot)
            parsed_outs = parse_output_entry(raw_d.get('result'))

        # 5. AE2 Inscriber
        elif rtype == 'ae2:inscriber':
            ings = raw_d.get('ingredients', {})
            if isinstance(ings, dict):
                for pos in ('top', 'middle', 'bottom'):
                    if pos in ings:
                        for it, ist, c in ingr(ings[pos]):
                            parsed_ings.append((it, ist, c, pos, None))
            parsed_outs = parse_output_entry(raw_d.get('result'))
            extra_data['mode'] = raw_d.get('mode', 'press')

        # 6. Mystical Agriculture Awakening / Infusion
        elif 'awakening' in rtype or 'infusion' in rtype:
            if 'input' in raw_d:
                for it, ist, c in ingr(raw_d['input']):
                    parsed_ings.append((it, ist, c, 'center_altar', None))
            for ing in raw_d.get('ingredients', []):
                for it, ist, c in ingr(ing):
                    parsed_ings.append((it, ist, c, 'pedestal', None))
            for ess in raw_d.get('essences', []):
                for it, ist, c in ingr(ess):
                    parsed_ings.append((it, ist, c, 'essence_vessel', None))
            parsed_outs = parse_output_entry(raw_d.get('result'))

        # 7. Oritech Machines
        elif rtype.startswith('oritech:'):
            dur_ticks = int(raw_d.get('time', 100))
            for slot, ing in enumerate(raw_d.get('itemInputs', [])):
                take_slot(ing, slot, 'input', slot)
            for res in raw_d.get('itemResults', []):
                parsed_outs.extend(parse_output_entry(res))

        # 8. Ender IO SAG Milling / Alloy Smelting / Painting / Soul Binding / Slicing
        elif rtype.startswith('enderio:'):
            energy_fe = int(raw_d.get('energy', 0))
            dur_ticks = int(raw_d.get('time', 0))
            many = raw_d.get('inputs')   # input — один інгредієнт; inputs — перелік входів (кожен запис — окремий вхід)
            for slot, ing in enumerate([raw_d['input']] if raw_d.get('input') else many if isinstance(many, list) else [many] if many else []):
                take_slot(ing, slot, 'input', None)
            if 'outputs' in raw_d:
                for out in (raw_d['outputs'] if isinstance(raw_d['outputs'], list) else [raw_d['outputs']]):
                    parsed_outs.extend(parse_output_entry(out))
            elif 'output' in raw_d:
                parsed_outs.extend(parse_output_entry(raw_d['output']))

        # 9. Generic Fallback
        else:
            dur_ticks = int(raw_d.get('cookingtime') or raw_d.get('time') or raw_d.get('duration') or 0)
            energy_fe = int(raw_d.get('energy') or raw_d.get('energy_fe') or raw_d.get('input_energy') or 0)
            if isinstance(raw_d.get('pattern'), list) and isinstance(raw_d.get('key'), dict):
                # K29: будь-який сітковий рецепт мода (апгрейди рюкзаків/скринь, rolling, arcane_workbench, shaped_gear…)
                parse_shaped(raw_d)
                if parsed_ings: parsed_ings += field_entries(raw_d, {'pattern', 'key'}, ingr)
            else:
                found_in_key = False
                for k in ('ingredient', 'ingredients', 'input', 'inputs', 'itemInputs', 'input_item', 'input_items', 'inputItems', 'materials', 'additives'):
                    if k in raw_d:
                        found_in_key = True
                        val = raw_d[k]
                        # список — перелік входів; виняток — поля одного інгредієнта (ingredient / input_item): там список — варіанти «на вибір» (K8)
                        vals = val if isinstance(val, list) and k not in ('ingredient', 'input_item') else [val]
                        for slot, ing in enumerate(vals):
                            take_slot(ing, slot, 'input', slot)
                        if parsed_ings: parsed_ings += field_entries(raw_d, k, ingr)   # K9: входи окремим полем — на перевірку в complete
                        break
                if not found_in_key and 'base' in raw_d and 'addition' in raw_d:
                    # K29: ковальські рецепти за формою (smithing_transform, sized_upgrade_recipe, smithing_upgrade…)
                    seq = 0
                    for k in ('template', 'base', 'addition'):
                        if k in raw_d and raw_d[k]:
                            take_slot(raw_d[k], seq, 'input', seq)
                            seq += 1
                    if parsed_ings: parsed_ings += field_entries(raw_d, {'template', 'base', 'addition'}, ingr)
            for k in ('result', 'results', 'output', 'outputs', 'itemResults', 'output_item', 'output_items', 'itemOutput', 'guaranteed_outputs', 'tag_result'):
                if k in raw_d:
                    parsed_outs.extend(parse_output_entry(raw_d[k]))
                    if k == 'guaranteed_outputs' and 'chance_outputs' in raw_d:
                        for item_id, cnt, ch, _ in parse_output_entry(raw_d['chance_outputs']):
                            parsed_outs.append((item_id, cnt, ch, 0))
                    break

    if unparsed > 0:
        extra_data['unparsed_slots'] = unparsed
    return parsed_ings, parsed_outs, dur_ticks, energy_fe, structure_id, sacrifice_entity, extra_data

FIELD = 'field'   # роль запису, знайденого поза відомим полем входів (parse_raw → complete): ще не перевірений вхід

def field_entries(raw_d, used, ingr):
    """Записи у формі інгредієнта з решти полів верхнього рівня рецепта (K9) — для рецептів, які розбирає загальна гілка parse_raw
    (used — ключ або множина ключів, які вона вже розібрала): перелік (кожен запис — окремий вхід), {id}, {ingredient} тощо.
    Рядки верхнього рівня бере complete. Типи з власною гілкою розбору свої поля знають самі — туди це не заходить."""
    used_s = {used} if isinstance(used, str) else set(used or ())
    res = []
    for k, v in raw_d.items():
        if k in used_s or k in SKIPK or OUTK.search(k) or not isinstance(v, (list, dict)): continue
        for entry in (v if isinstance(v, list) else [v]):
            res += [(ref, is_tag, cnt, FIELD, None) for ref, is_tag, cnt in ingr(entry)]
    return res

def check_fields(ings, outs, known_in, known_out, fls, kinds):
    """Записи з роллю FIELD → входи, якщо це справді вхід: предмет гри або тег предметів, який сито знає як вхід цього рецепта;
    не вихід цього ж рецепта (поле-опис: значок, зразок), не рідина рецепта (запис з amount) і не повтор уже розібраного."""
    have = {i for i, _, _, role, _ in ings if role != FIELD}
    bad = {o[0] for o in outs} | set(known_out or ()) | {f for f, _, _ in fls}
    known_in = set(known_in or ()); res = []
    for ref, is_tag, cnt, role, slot in ings:
        if role == FIELD:
            ok = (ref[1:] in kinds.item_tags) if ref.startswith('#') else (ref in kinds.items)
            if not ok or ref not in known_in or ref in bad or ref in have: continue
            role = 'input'   # той самий предмет двічі в полі — два входи (пахощі ритуалу)
        res.append((ref, is_tag, cnt, role, slot))
    return res

def complete(raw_d, ings, outs, known_in, known_out, kinds):
    """Доповнити розібране тим, що знає індекс сита (known_in / known_out — id входів і виходів), і розкласти за видами.
    Вхід окремим полем рецепта, який сито знає як вхід, — теж інгредієнт: запис у формі інгредієнта (FIELD — check_fields, K9)
    або рядок верхнього рівня (K32: якщо рядок — #тег, лише відомий тег предметів чи рідин, щоб теги біомів / ґрунтів не
    потрапляли у входи-предмети); запису немає або розбір порожній — входи / виходи з індексу (кількість невідома → 1; у
    строгому режимі невідомі #теги сирого індексу, як теги істот, ідуть у `other`, а не в інгредієнти).
    -> (ings, outs, fluids, other) — див. split_kinds."""
    ings, outs = list(ings), list(outs)
    is_d = isinstance(raw_d, dict)
    fls = parse_fluids(raw_d, kinds) if is_d else []
    ings = check_fields(ings, outs, known_in, known_out, fls, kinds)
    known_tag = lambda v: (not v.startswith('#')) or (v[1:] in kinds.item_tags) or (v[1:] in kinds.fluid_tags)
    if ings and is_d and known_in:
        known = {i for i, _, _, _, _ in ings}
        for v in raw_d.values():
            if isinstance(v, str) and v in known_in and v not in known and known_tag(v):
                ings.append((v, 1 if v.startswith('#') else 0, 1.0, 'input', None)); known.add(v)
    fb_other = []
    if not ings and known_in:
        fb_in = []
        for v in known_in:
            if not kinds.strict or known_tag(v): fb_in.append(v)
            else: fb_other.append(v)
        ings = [(ing, 1 if ing.startswith('#') else 0, 1.0, 'input', slot) for slot, ing in enumerate(fb_in)]
    if not outs and known_out:
        outs = [(out_id, 1.0, 1.0, 1 if i == 0 else 0) for i, out_id in enumerate(known_out)]
    ings, outs, fls, other = split_kinds(ings, outs, fls, kinds)
    if fb_other:
        other.setdefault('in', []).extend(fb_other)
    return ings, outs, fls, other

def init_schema(db):
    """Створює схему бази даних SQLite (K32 Д1: без items_meta і recipes_fts — міст бере назви з names.json)."""
    cur = db.cursor()
    cur.execute("PRAGMA journal_mode = MEMORY;")
    cur.execute("PRAGMA synchronous = OFF;")
    cur.execute("PRAGMA foreign_keys = OFF;")

    cur.executescript("""
    DROP TABLE IF EXISTS recipes;
    DROP TABLE IF EXISTS recipe_ingredients;
    DROP TABLE IF EXISTS recipe_outputs;
    DROP TABLE IF EXISTS recipe_fluids;
    DROP TABLE IF EXISTS item_tags;
    DROP TABLE IF EXISTS items_meta;
    DROP TABLE IF EXISTS recipes_fts;

    CREATE TABLE recipes (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        mod_id TEXT NOT NULL,
        duration_ticks INTEGER DEFAULT 0,
        energy_fe INTEGER DEFAULT 0,
        in_world INTEGER DEFAULT 0,
        structure_id TEXT,
        sacrifice_entity TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        why_inactive TEXT,
        source_file TEXT,
        extra_json TEXT
    );

    CREATE TABLE recipe_ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT NOT NULL,
        item_or_tag TEXT NOT NULL,
        is_tag INTEGER NOT NULL DEFAULT 0,
        count REAL NOT NULL DEFAULT 1.0,
        role TEXT NOT NULL DEFAULT 'input',
        slot_idx INTEGER
    );

    CREATE TABLE recipe_outputs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        count REAL NOT NULL DEFAULT 1.0,
        chance REAL NOT NULL DEFAULT 1.0,
        is_primary INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE recipe_fluids (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id TEXT NOT NULL,
        fluid_id TEXT NOT NULL,
        amount_mb INTEGER NOT NULL,
        io_type TEXT NOT NULL
    );

    CREATE TABLE item_tags (
        tag_id TEXT NOT NULL,
        item_id TEXT NOT NULL,
        PRIMARY KEY (tag_id, item_id)
    );
    """)
    db.commit()

def create_indices(db):
    """Створює швидкі індекси після вставки даних."""
    cur = db.cursor()
    cur.executescript("""
    CREATE INDEX idx_rec_mod ON recipes(mod_id);
    CREATE INDEX idx_rec_type ON recipes(type);
    CREATE INDEX idx_rec_cat ON recipes(category);
    CREATE INDEX idx_rec_active ON recipes(active);

    CREATE INDEX idx_ing_item ON recipe_ingredients(item_or_tag);
    CREATE INDEX idx_ing_rec ON recipe_ingredients(recipe_id);

    CREATE INDEX idx_out_item ON recipe_outputs(item_id);
    CREATE INDEX idx_out_rec ON recipe_outputs(recipe_id);

    CREATE INDEX idx_tag_id ON item_tags(tag_id);
    CREATE INDEX idx_tag_item ON item_tags(item_id);

    CREATE INDEX idx_fluid_rec ON recipe_fluids(recipe_id);
    """)
    db.commit()

def main():
    t0 = time.time()
    print("⚡ [1/4] Ініціалізація та завантаження індексів 'Сита'...")
    recs_idx = jload(os.path.join(RAW, 'recipes_index.json'), {}) or {}
    kjs_idx = jload(os.path.join(RAW, 'kubejs_index.json'), {}) or {}
    tags_idx = jload(os.path.join(RAW, 'tags_index.json'), {}) or {}
    reg_idx = jload(os.path.join(RAW, 'registry_index.json'), {}) or {}
    item_tags = tags_idx.get('item', {})
    kinds = Kinds(set(reg_idx.get('items', [])), set(item_tags), set(reg_idx.get('fluids', [])), set(tags_idx.get('fluid', {})), reg_idx.get('items_src') == 'game')
    if not kinds.strict: print("⚠ реєстр предметів — не з гри (немає знімка raw/game_item_names.json): записи поза реєстром лишаються предметами")
    choices = Choices(kinds.items if kinds.strict else None, item_tags)
    ingr = lambda x: parse_ingredient_entry(x, item_tags, choices, kinds)
    game_ri = jload(os.path.join(RAW, 'game_recipe_ingredients.json'), None) or {}
    game_sets = game_ri.get('sets') if isinstance(game_ri.get('sets'), list) else []
    game_recs = game_ri.get('recipes') if isinstance(game_ri.get('recipes'), dict) else {}
    game_stat = {'slots': 0, 'recipes': set()}
    def make_resolver(rid):
        pairs = game_recs.get(rid)
        if not pairs or not game_sets: return None
        by_slot = {int(s): game_sets[int(i)] for s, i in pairs if isinstance(s, int) and isinstance(i, int) and 0 <= i < len(game_sets) and game_sets[i]}
        if not by_slot: return None
        def _res(seq, raw_slot):
            ms = by_slot.get(seq)
            if not ms: return None
            cnt = _num(raw_slot['count'] if 'count' in raw_slot else raw_slot.get('amount', 1.0)) if isinstance(raw_slot, dict) else 1.0
            game_stat['slots'] += 1; game_stat['recipes'].add(rid)
            return choices.one([(m, 0, cnt) for m in ms])
        return _res
    if game_recs: print(f"🧩 Знімок нестандартних інгредієнтів гри: {len(game_recs)} рецептів, {len(game_sets)} множин")
    else: print("ℹ знімка raw/game_recipe_ingredients.json немає — нестандартні слоти лише за статичним правилом")

    os.makedirs(os.path.dirname(DB_OUT_RAW), exist_ok=True)
    if os.path.exists(DB_OUT_RAW):
        try: os.remove(DB_OUT_RAW)
        except Exception: pass

    db = sqlite3.connect(DB_OUT_RAW)
    init_schema(db)

    print(f"📦 Завантажено {len(recs_idx)} рецептів з індексу сита.")

    # Групуємо рецепти за джерелом (src) для читання JSON
    by_src = collections.defaultdict(list)
    for rid, r in recs_idx.items():
        by_src[r.get('src')].append((rid, r))

    kjs_json = {kr.get('key') or kr.get('id'): kr['json'] for kr in kjs_idx.get('recipes', []) if isinstance(kr.get('json'), dict)}

    rec_rows = []
    ing_rows = []
    out_rows = []
    fluid_rows = []

    print("🔍 [2/4] Читання та парсинг рецептів (JARs + KubeJS Data)...")
    parsed_count = 0
    mod_jars = set(os.listdir(MODS)) if os.path.isdir(MODS) else set()

    for src, items in by_src.items():
        z = None
        kd_dir = None
        dyn_dir = None
        if src == 'kubejs/data':
            kd_dir = os.path.join(MC, 'kubejs')
        elif src == 'kubejs/dynamic_data':
            dyn_dir = os.path.join(MC, 'kubejs', 'dynamic_data')
        else:
            try:
                z = get_zip_or_dir(src, mod_jars)
            except Exception:
                z = None

        namelist = set(z.namelist()) if z else set()

        for rid, meta in items:
            p = meta.get('p')
            raw_d = kjs_json.get(rid) if src == 'kubejs' else None   # рецепт KubeJS — запис із пісочниці (форма datapack)
            if z and p and p in namelist:
                try:
                    raw_d = json.loads(z.read(p).decode('utf-8-sig'))
                except Exception:
                    pass
            elif kd_dir and p:
                fp = os.path.join(kd_dir, p)
                if os.path.exists(fp):
                    try:
                        raw_d = json.load(open(fp, encoding='utf-8-sig'))
                    except Exception:
                        pass
            elif dyn_dir and p:
                rel = p[5:] if p.startswith('data/') else p
                fp = os.path.join(dyn_dir, rel)
                if os.path.exists(fp):
                    try:
                        raw_d = json.load(open(fp, encoding='utf-8-sig'))
                    except Exception:
                        pass

            # Базові поля з індексу сита
            rtype = meta.get('t') or (raw_d.get('type') if raw_d else '') or 'unknown'
            mod_id = rtype.split(':')[0] if ':' in rtype else (rid.split(':')[0] if ':' in rid else 'unknown')
            category, in_world = categorize(rtype)
            active = 1 if meta.get('a') is True else 0
            why_inactive = meta.get('why') or ''

            parsed_ings, parsed_outs, dur_ticks, energy_fe, structure_id, sacrifice_entity, extra_data = parse_raw(rtype, raw_d, ingr, make_resolver(rid))
            parsed_ings, parsed_outs, parsed_fls, other = complete(raw_d, parsed_ings, parsed_outs, meta.get('in'), meta.get('out'), kinds)
            if other: extra_data['other'] = other

            extra_json_str = json.dumps(extra_data) if extra_data else None

            rec_rows.append((rid, rtype, category, mod_id, dur_ticks, energy_fe, in_world, structure_id, sacrifice_entity, active, why_inactive, src or '', extra_json_str))

            for it_tag, is_tag, cnt, role, slot in parsed_ings:
                ing_rows.append((rid, it_tag, is_tag, cnt, role, slot))

            for out_id, cnt, chance, is_prim in parsed_outs:
                out_rows.append((rid, out_id, cnt, chance, is_prim))

            for fid, amt, io_type in parsed_fls:
                fluid_rows.append((rid, fid, amt, io_type))

            parsed_count += 1

        if z:
            try: z.close()
            except Exception: pass

    # Додаємо рецепти, специфічні для KubeJS (що додалися скриптами)
    kjs_recipes = kjs_idx.get('recipes', [])
    print(f"🔧 Додавання {len(kjs_recipes)} рецептів KubeJS...")
    existing_rids = {r[0] for r in rec_rows}

    for kr in kjs_recipes:
        rid = kr.get('key') or kr.get('id')
        if not rid or rid in existing_rids:
            continue
        rtype = kr.get('type') or 'kubejs:custom'
        mod_id = rtype.split(':')[0] if ':' in rtype else 'kubejs'
        cat, in_world = categorize(rtype)
        act = 1 if kr.get('active') else 0
        why = kr.get('why') or ''
        raw_k = kr.get('json') if isinstance(kr.get('json'), dict) else None   # виклик KubeJS у формі datapack (пісочниця) — з кількостями й сіткою
        k_ings, k_outs, dur_ticks, energy_fe, structure_id, sacrifice_entity, extra_data = parse_raw(rtype, raw_k, ingr, make_resolver(rid))
        k_ings, k_outs, k_fls, other = complete(raw_k, k_ings, k_outs, kr.get('in'), kr.get('out'), kinds)
        if other: extra_data['other'] = other
        rec_rows.append((rid, rtype, cat, mod_id, dur_ticks, energy_fe, in_world, structure_id, sacrifice_entity, act, why, kr.get('at', 'kubejs'), json.dumps(extra_data) if extra_data else None))
        for it_tag, is_tag, cnt, role, slot in k_ings: ing_rows.append((rid, it_tag, is_tag, cnt, role, slot))
        for out_id, cnt, chance, is_prim in k_outs: out_rows.append((rid, out_id, cnt, chance, is_prim))
        for fid, amt, io_type in k_fls: fluid_rows.append((rid, fid, amt, io_type))

    if game_stat['slots']: print(f"🧩 Знімком гри розкрито нестандартних слотів: {game_stat['slots']} у {len(game_stat['recipes'])} рецептах")
    print(f"💾 [3/4] Запис у базу: {len(rec_rows)} рецептів, {len(ing_rows)} інгредієнтів, {len(out_rows)} виходів, {len(fluid_rows)} рідин...")
    cur = db.cursor()
    cur.executemany("INSERT INTO recipes VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", rec_rows)
    cur.executemany("INSERT INTO recipe_ingredients (recipe_id, item_or_tag, is_tag, count, role, slot_idx) VALUES (?,?,?,?,?,?)", ing_rows)
    cur.executemany("INSERT INTO recipe_outputs (recipe_id, item_id, count, chance, is_primary) VALUES (?,?,?,?,?)", out_rows)
    cur.executemany("INSERT INTO recipe_fluids (recipe_id, fluid_id, amount_mb, io_type) VALUES (?,?,?,?)", fluid_rows)
    db.commit()

    # Запис тегів (item_tags)
    print("🏷️  [4/4] Запис тегів предметів та індексів...")
    item_tags_data = tags_idx.get('item', {})
    tag_rows = []
    for tag_name, items in item_tags_data.items():
        clean_tag = tag_name.lstrip('#')
        for item_id in items:
            tag_rows.append((clean_tag, item_id))
    for gid, members in choices.groups.items():   # K8: групи «на вибір» — поруч із тегами гри, у власному просторі імен
        tag_rows.extend((gid, item_id) for item_id in members)
    print(f"   груп «на вибір»: {len(choices.groups)}")
    cur.executemany("INSERT OR IGNORE INTO item_tags VALUES (?,?)", tag_rows)
    db.commit()

    print("⚡ Створення індексів швидкодії...")
    create_indices(db)
    db.close()

    # Копіюємо в Companion/data/recipes.db
    os.makedirs(os.path.dirname(DB_OUT_COMPANION), exist_ok=True)
    shutil.copyfile(DB_OUT_RAW, DB_OUT_COMPANION)

    raw_size_mb = os.path.getsize(DB_OUT_RAW) / (1024 * 1024)
    print(f"✅ Базу успішно створено за {time.time()-t0:.2f}с!")
    print(f"📊 Розмір: {raw_size_mb:.2f} МБ")
    print(f"📁 Шлях raw: {DB_OUT_RAW}")
    print(f"📁 Шлях companion: {DB_OUT_COMPANION}")

if __name__ == '__main__':
    main()
