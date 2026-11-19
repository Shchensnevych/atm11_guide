# Прогрес гравця із сейву Minecraft → docs/data/progress.json + docs/data/progress/<slug>.json + progress/index.json.
# Запуск з atm11_guide: py -I tools/extract_progress.py [--world <назва>]
import os, sys, glob, gzip, struct, json, re, datetime, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MC, QUESTS, DATA, json5, jload, jsave

SAVES = os.path.join(MC, 'saves')
PROG_DIR = os.path.join(DATA, 'progress')

TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
    'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
    'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
    'ю': 'yu', 'я': 'ya', 'ы': 'y', 'э': 'e', 'ъ': '', 'ё': 'yo', "'": '', '’': '', '`': ''
}

GAME_MODES = {
    0: ('survival', 'Виживання'),
    1: ('creative', 'Творчість'),
    2: ('adventure', 'Пригода'),
    3: ('spectator', 'Спостерігач'),
}

def slugify(s):
    out = []
    for ch in (s or '').lower():
        if ch in TRANSLIT:
            out.append(TRANSLIT[ch])
        elif 'a' <= ch <= 'z' or '0' <= ch <= '9':
            out.append(ch)
        else:
            out.append('_')
    res = re.sub(r'_+', '_', ''.join(out)).strip('_')
    return res or 'world'

def read_nbt(path):
    """Читає стиснутий (gzip) або звичайний файл NBT без сторонніх бібліотек."""
    if not os.path.exists(path):
        return {}
    raw = open(path, 'rb').read()
    data = gzip.decompress(raw) if raw[:2] == b'\x1f\x8b' else raw
    pos = 0
    def u8():
        nonlocal pos; v = data[pos]; pos += 1; return v
    def i8():
        nonlocal pos; v, = struct.unpack_from('>b', data, pos); pos += 1; return v
    def i16():
        nonlocal pos; v, = struct.unpack_from('>h', data, pos); pos += 2; return v
    def u16():
        nonlocal pos; v, = struct.unpack_from('>H', data, pos); pos += 2; return v
    def i32():
        nonlocal pos; v, = struct.unpack_from('>i', data, pos); pos += 4; return v
    def i64():
        nonlocal pos; v, = struct.unpack_from('>q', data, pos); pos += 8; return v
    def f32():
        nonlocal pos; v, = struct.unpack_from('>f', data, pos); pos += 4; return v
    def f64():
        nonlocal pos; v, = struct.unpack_from('>d', data, pos); pos += 8; return v
    def string():
        nonlocal pos; n = u16(); s = data[pos:pos + n].decode('utf-8', errors='replace'); pos += n; return s
    def payload(tag):
        nonlocal pos
        if tag == 1: return i8()
        if tag == 2: return i16()
        if tag == 3: return i32()
        if tag == 4: return i64()
        if tag == 5: return f32()
        if tag == 6: return f64()
        if tag == 7:
            n = i32(); pos += n; return None
        if tag == 8: return string()
        if tag == 9:
            et = u8(); n = i32()
            return [payload(et) for _ in range(max(0, n))]
        if tag == 10:
            out = {}
            while pos < len(data):
                t = u8()
                if t == 0: break
                k = string()
                out[k] = payload(t)
            return out
        if tag == 11:
            n = i32(); v = list(struct.unpack_from(f'>{n}i', data, pos)); pos += 4 * n; return v
        if tag == 12:
            n = i32(); v = list(struct.unpack_from(f'>{n}q', data, pos)); pos += 8 * n; return v
        raise ValueError(f'Невідомий тег NBT {tag} на позиції {pos}')
    if not data or u8() != 10:
        return {}
    _ = string()
    return payload(10)

def l5(p):
    if not os.path.exists(p): return {}
    t = open(p, encoding='utf-8-sig').read()
    try:
        t1 = re.sub(r'(^|[{,])(\s*)([A-Za-z0-9_]+)\s*:', lambda m: m.group(1) + m.group(2) + '"' + m.group(3) + '":', t, flags=re.M)
        return json.loads(re.sub(r',(\s*[}\]])', r'\1', t1))
    except Exception:
        return json5.loads(t)

def to_hex_id(dec_str):
    val = int(dec_str)
    if val < 0:
        val += (1 << 64)
    return f'{val:016X}'

def fmt_ts(ts):
    if not ts: return ''
    return datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')

def strip_mc_codes(s):
    if not isinstance(s, str) or not s: return ''
    s = re.sub(r'§[0-9a-fk-or]', '', s, flags=re.I)
    s = re.sub(r'&#[0-9a-fA-F]{6}', '', s)
    return s.replace('\\&', '&').strip()

def is_tpl(s):
    return isinstance(s, str) and bool(re.search(r'%(\d+\$)?s', s))

def untemplate(s):
    s = re.sub(r'%(\d+\$)?[sd]', ' ', str(s or ''))
    s = re.sub(r'\s*[:—–-]\s*$', '', s)
    s = re.sub(r'^\s*[:—–-]\s*', '', s)
    s = re.sub(r'\(\s*\)', '', s)
    return re.sub(r'\s{2,}', ' ', s).strip()

BACKPACK_STORAGE_FILES = (
    'dimensions/minecraft/overworld/data/sophisticatedbackpacks/backpack_storage.dat',
    'data/sophisticatedbackpacks/backpack_storage.dat',
    'data/sophisticatedbackpacks.dat',
    'data/sophisticatedcore/sophisticatedbackpacks.dat',
)

CURIOS_SLOT_UK = {
    'back': 'Спина',
    'belt': 'Пояс',
    'body': 'Тіло',
    'bracelet': 'Браслет',
    'charm': 'Амулет',
    'curio': 'Аксесуар',
    'hands': 'Руки',
    'head': 'Голова',
    'necklace': 'Намисто',
    'ring': 'Перстень',
    'feet': 'Ступні',
    'heart_amulet': 'Амулет сердець',
    'crafting_on_a_stick': 'Створення на паличці',
    'adv_pattern_encoder': 'Кодувальник шаблонів',
    'deep_learner': 'Глибинний учень',
    'refinedstorage_curios_integration': 'Refined Storage',
    'poppet': 'Лялька',
    'sentient_armour_socket': 'Гніздо живої броні',
}

def uuid_key(v):
    if v is None:
        return ''
    if isinstance(v, list) and len(v) == 4 and all(isinstance(n, int) for n in v):
        hx = ''.join(f'{(n & 0xFFFFFFFF):08x}' for n in v)
        return f'{hx[:8]}-{hx[8:12]}-{hx[12:16]}-{hx[16:20]}-{hx[20:]}'
    return str(v).strip().lower()

def custom_name_of(stack):
    if not isinstance(stack, dict):
        return ''
    comp = stack.get('components')
    if not isinstance(comp, dict):
        return ''
    v = comp.get('minecraft:custom_name')
    def text_of(x, depth=0):
        if x is None or depth > 4:
            return ''
        if isinstance(x, str):
            t = x.strip()
            if t[:1] in '{["':
                try:
                    return text_of(json.loads(t), depth + 1)
                except Exception:
                    pass
            return t
        if isinstance(x, list):
            return ''.join(text_of(e, depth + 1) for e in x)
        if isinstance(x, dict):
            base = x.get('text') if isinstance(x.get('text'), str) else ''
            extra = ''.join(text_of(e, depth + 1) for e in x.get('extra', [])) if isinstance(x.get('extra'), list) else ''
            return base + extra
        return ''
    return strip_mc_codes(text_of(v))[:80]

def load_names_dict():
    """Українські назви предметів, книг і вимірів з docs/data/names.json та mods.json (як у services/ua-dictionary.js)."""
    nd = jload(os.path.join(DATA, 'names.json'), {}) or {}
    mods = jload(os.path.join(DATA, 'mods.json'), []) or []
    mod_names = {m['id']: m.get('name') or m['id'] for m in mods if isinstance(m, dict) and m.get('id')}
    items = nd.get('items') or {}
    books = {k: strip_mc_codes(v[0]) for k, v in (nd.get('books') or {}).items() if isinstance(v, list) and v}
    dims = {k: strip_mc_codes(v[0]) for k, v in (nd.get('dims') or {}).items() if isinstance(v, list) and v}
    for m in mods:
        for d in (m.get('dims') or []) if isinstance(m, dict) else []:
            if d.get('id') and d.get('name') and d['id'] not in dims:
                dims[d['id']] = d['name']
    return items, dims, mod_names, books

def resolve_item_uk(iid, names_items, mod_names, components=None, books=None):
    if not iid or iid == 'minecraft:air': return ''
    if isinstance(components, dict):
        book = components.get('patchouli:book') or components.get('modonomicon:book_id') or components.get('guideme:guide_id')
        if isinstance(book, str) and book:
            if books and book in books and books[book]:
                return books[book]
            bns = book.split(':', 1)[0]
            return f"Посібник {mod_names.get(bns, bns)} ({book})"
    hit = names_items.get(iid)
    if isinstance(hit, list) and hit:
        uk = strip_mc_codes(hit[0] if len(hit) > 0 else '')
        en = strip_mc_codes(hit[1] if len(hit) > 1 else uk)
        if uk and not is_tpl(uk): return uk
        if en and not is_tpl(en): return en
        part = untemplate(uk) or untemplate(en)
        if re.match(r"^[A-ZА-ЯІЇЄҐ][A-Za-zА-Яа-яІіЇїЄєҐґ'ʼ]", part):
            return part
    if ':' in iid:
        ns, p = iid.split(':', 1)
        return f"{p.replace('_', ' ')} ({mod_names.get(ns, ns)})"
    return iid

# K23 (з гри 11-19; те саме правило, що в мосту — ATM11-Companion services/watcher/saves.js і сайт core/nbt-slots.js): що
# лежить усередині предмета — за формою даних, будь-який компонент, углиб до NEST_MAX_DEPTH. Перелік-уміст: обгортки зі слотом
# {slot/Slot, item/Stack} — будь-де (кількість — з обгортки, якщо вона там є); голі предмети — лише в полі-вмісті (container /
# contents / inventory / items / stacks); фільтри й службові копії — ні. Додаткові слоти модів — з будь-якого вкладення гравця.
SKIP_NESTED_KEY = re.compile(r'filter|ghost|preview|display|template|cache|backup|cosmetic|^(last|old|prev|render|sync)', re.I)
SKIP_ATTACHMENT_KEY = re.compile(r'^(last|old|prev|cosmetic|backup|cache|ghost|render|sync)', re.I)
CONTENTS_KEY = re.compile(r'container|contents|inventory|items|stacks', re.I)
NEST_MAX_DEPTH = 4
NEST_BUDGET = 400

def is_nbt_stack(o, allow_no_count=False):
    if not isinstance(o, dict): return False
    iid = o.get('id')
    if not isinstance(iid, str) or ':' not in iid or iid == 'minecraft:air': return False
    c = o.get('count', o.get('Count'))
    if c is None: return bool(allow_no_count)
    try: return float(c) >= 1
    except (TypeError, ValueError): return False

def nested_stacks(stack):
    """Що лежить усередині предмета: [(stack, slot, count, comp)]."""
    comp = stack.get('components') if isinstance(stack, dict) else None
    out = []
    if not isinstance(comp, dict): return out
    def visit(v, comp_key, key, d):
        if not isinstance(v, (dict, list)) or d > 4: return
        if isinstance(v, list):
            found = 0
            for idx, e in enumerate(v):
                if not isinstance(e, dict): continue
                wrapped = 'slot' in e or 'Slot' in e
                hit = None
                for fld in ('item', 'Item', 'stack', 'Stack'):
                    st = e.get(fld)
                    if is_nbt_stack(st, wrapped):
                        hit = (st, int(e.get('slot', e.get('Slot', idx)) or 0), int(e.get('count', e.get('Count', st.get('count', st.get('Count', 1)))) or 1), comp_key)
                        break
                if hit is None and CONTENTS_KEY.search(key) and is_nbt_stack(e):
                    hit = (e, idx, int(e.get('count', e.get('Count', 1)) or 1), comp_key)
                if hit: out.append(hit); found += 1
            if not found:
                for e in v: visit(e, comp_key, key, d + 1)
            return
        if is_nbt_stack(v): return
        for k, x in v.items():
            if not SKIP_NESTED_KEY.search(k): visit(x, comp_key, k, d + 1)
    for k, v in comp.items():
        if not SKIP_NESTED_KEY.search(k): visit(v, k, k, 0)
    return out

def attachment_stacks(val, base_key):
    """Предмети у вкладенні гравця (міст K16 extractAttachmentStacks): [(stack, slot_key)]."""
    out = []
    if not isinstance(val, (dict, list)): return out
    if is_nbt_stack(val): return [(val, base_key)]
    def push_arr(arr):
        for idx, e in enumerate(arr):
            w = isinstance(e, dict) and ('slot' in e or 'Slot' in e)
            st = e if is_nbt_stack(e) else (e.get('item') if isinstance(e, dict) and is_nbt_stack(e.get('item'), w) else (e.get('Stack') if isinstance(e, dict) and is_nbt_stack(e.get('Stack'), w) else None))
            if st: out.append((st, f'{base_key}#{idx}'))
    if isinstance(val, list): push_arr(val); return out
    for k, x in val.items():
        if not isinstance(x, (dict, list)) or SKIP_ATTACHMENT_KEY.search(k): continue
        if is_nbt_stack(x): out.append((x, f'{base_key}:{k}')); continue
        if isinstance(x, list): push_arr(x)
    return out

def extract_structured_slots(pnbt, wdir, names_items, mod_names, books, inv_counts):
    slots = {
        'mainHand': None, 'offHand': None, 'hotbar': [], 'inventory': [],
        'armor': [], 'curios': [], 'curiosTypes': [],
        'toolbelt': [], 'toolbeltTools': [], 'modSlots': [], 'backpacks': [], 'enderChest': [],
    }
    bp_map = {}
    for bp_rel in BACKPACK_STORAGE_FILES:
        bp_path = os.path.join(wdir, bp_rel)
        if os.path.exists(bp_path):
            bp_nbt = read_nbt(bp_path)
            cl = (bp_nbt.get('data') or {}).get('backpackContents') or bp_nbt.get('backpackContents') or {}
            if isinstance(cl, list):
                for entry in cl:
                    if isinstance(entry, dict) and entry.get('contents'):
                        k = uuid_key(entry.get('uuid'))
                        if k: bp_map[k] = entry['contents']
            elif isinstance(cl, dict):
                for raw_id, contents in cl.items():
                    k = uuid_key(raw_id)
                    if k and isinstance(contents, dict): bp_map[k] = contents

    def fmt_stack(raw_stack, slot_label, slot_kind):
        if not isinstance(raw_stack, dict): return None
        iid = raw_stack.get('id')
        if not isinstance(iid, str) or not iid or iid == 'minecraft:air': return None
        cnt = int(raw_stack.get('count', raw_stack.get('Count', 1)) or 0)
        if cnt <= 0: return None
        comp = raw_stack.get('components') if isinstance(raw_stack.get('components'), dict) else None
        uk = resolve_item_uk(iid, names_items, mod_names, comp, books)
        cname = custom_name_of(raw_stack)
        ns = iid.split(':', 1)[0] if ':' in iid else 'minecraft'
        out = {
            'id': iid,
            'uk': uk,
            'count': cnt,
            'slot': raw_stack.get('Slot'),
            'slotLabel': slot_label,
            'slotKind': slot_kind,
            'ns': ns,
            'modName': 'Minecraft' if ns == 'minecraft' else mod_names.get(ns, ns),
        }
        if cname and cname != uk:
            out['customName'] = cname
        if comp:
            dmg = int(comp.get('minecraft:damage') or 0)
            max_dmg = int(comp.get('minecraft:max_damage') or 0)
            if max_dmg > 0:
                out['durabilityPct'] = max(0, min(100, round(((max_dmg - dmg) / max_dmg) * 100)))
        return out

    def extract_nested(raw_item, title, out_arr, where='', key_where='', depth=1, budget=None, parent_key=''):
        """K23: углиб, ланцюжком «A → B»; ключ вкладеного — ключ батька + « → назва» (як міст і живий знімок)."""
        if budget is None: budget = [NEST_BUDGET]
        if not isinstance(raw_item, dict): return
        comp = raw_item.get('components')
        if not isinstance(comp, dict): return
        s_uuid = uuid_key(comp.get('sophisticatedcore:storage_uuid') or comp.get('storage_uuid'))
        bp_cap = int(comp.get('sophisticatedcore:number_of_inventory_slots') or 0)
        key = s_uuid or parent_key or f'{key_where or where}|{title}'
        def tag(f_item, bp_slot=None, bp_kind='container'):
            f_item['bpTitle'] = title
            f_item['bpKey'] = key
            f_item['bpKind'] = bp_kind
            if bp_cap: f_item['bpCapacity'] = bp_cap
            if bp_slot is not None: f_item['bpSlot'] = bp_slot
            if where: f_item['bpWhere'] = where
            inv_counts[f_item['id']] += f_item['count']
            return f_item
        def take(st, slot, count, kind, label):
            if budget[0] <= 0: return
            f = fmt_stack(st, label, 'backpack')
            if not f: return
            if count and int(count) > 0: f['count'] = int(count)
            budget[0] -= 1
            out_arr.append(tag(f, slot, kind))
            st_comp = st.get('components') if isinstance(st.get('components'), dict) else {}
            own = bool(nested_stacks(st)) or bool(uuid_key(st_comp.get('sophisticatedcore:storage_uuid') or st_comp.get('storage_uuid')))
            if not own: return
            if depth >= NEST_MAX_DEPTH or budget[0] <= 0:
                f['more'] = True
                return
            name = custom_name_of(st) or f['uk']
            extract_nested(st, f'{title} → {name}', out_arr, where, key_where, depth + 1, budget, f'{key} → {name}')
        for st, slot, count, comp_key in nested_stacks(raw_item):
            take(st, slot, count, 'bundle' if comp_key == 'minecraft:bundle_contents' else 'container', f'Усередині «{title}»')
        if s_uuid and s_uuid in bp_map:
            bp_c = bp_map[s_uuid]
            stks = (bp_c.get('inventory') or {}).get('stacks') or bp_c.get('Items') or []
            if isinstance(stks, list):
                for idx, st in enumerate(stks):
                    if isinstance(st, dict):
                        take(st, int(st.get('Slot', idx)) if st.get('Slot') is not None else idx, int(st.get('count', st.get('Count', 1)) or 1), 'backpack', f'Рюкзак «{title}»')

    sel = int(pnbt.get('SelectedItemSlot', 0) or 0)
    armor_names = {100: ('feet', 'Черевики'), 101: ('legs', 'Наголінники'), 102: ('chest', 'Нагрудник'), 103: ('head', 'Шолом')}
    for raw_item in (pnbt.get('Inventory') or []):
        if not isinstance(raw_item, dict): continue
        sl = int(raw_item.get('Slot', -1))
        kind, label = 'inventory', f'Інвентар (слот {sl})'
        if 0 <= sl <= 8:
            kind = 'mainHand' if sl == sel else 'hotbar'
            label = f'Головна рука (слот {sl + 1})' if sl == sel else f'Гаряча панель (слот {sl + 1})'
        elif sl == -106:
            kind, label = 'offHand', 'Друга рука (Offhand)'
        elif sl in armor_names:
            kind, label = 'armor', f'Броня ({armor_names[sl][1]})'
        f = fmt_stack(raw_item, label, kind)
        if not f: continue
        if sl in armor_names: f['armorSlot'] = armor_names[sl][0]
        if sl == sel:
            slots['mainHand'] = f
            slots['hotbar'].append(f)
        elif kind == 'hotbar':
            slots['hotbar'].append(f)
        elif kind == 'offHand':
            slots['offHand'] = f
        elif kind == 'armor':
            slots['armor'].append(f)
        else:
            slots['inventory'].append(f)
        extract_nested(raw_item, custom_name_of(raw_item) or f['uk'], slots['backpacks'], label)

    eq = pnbt.get('equipment')
    eq_uk = {'feet': 'Черевики', 'legs': 'Наголінники', 'chest': 'Нагрудник', 'head': 'Шолом'}
    if isinstance(eq, dict):
        for eq_slot, eq_stack in eq.items():
            if not isinstance(eq_stack, dict): continue
            if eq_slot == 'mainhand' and not slots['mainHand']:
                slots['mainHand'] = fmt_stack(eq_stack, 'Головна рука', 'mainHand')
            elif eq_slot == 'offhand' and not slots['offHand']:
                slots['offHand'] = fmt_stack(eq_stack, 'Друга рука (Offhand)', 'offHand')
            elif eq_slot in eq_uk:
                arm = fmt_stack(eq_stack, f'Броня ({eq_uk[eq_slot]})', 'armor')
                if arm:
                    arm['armorSlot'] = eq_slot
                    slots['armor'].append(arm)

    att = pnbt.get('neoforge:attachments') or {}
    cur_list = (att.get('curios:inventory') or {}).get('Curios') or []
    if isinstance(cur_list, list):
        for cur_entry in cur_list:
            if not isinstance(cur_entry, dict): continue
            for slot_id, slot_data in cur_entry.items():
                if not isinstance(slot_data, dict): continue
                id_name = slot_data.get('Identifier') or slot_id
                slot_uk = CURIOS_SLOT_UK.get(id_name, id_name)
                size = int((slot_data.get('Stacks') or {}).get('Size') or slot_data.get('Size') or 0)
                if size > 0:
                    slots['curiosTypes'].append({'id': id_name, 'uk': slot_uk, 'size': size})
                items = (slot_data.get('Stacks') or {}).get('Items') or []
                if isinstance(items, list):
                    for c_idx, c_item in enumerate(items):
                        f = fmt_stack(c_item, f'Curios: {slot_uk}', 'curios')
                        if f:
                            f['curiosSlot'] = id_name
                            f['curiosSlotUk'] = slot_uk
                            f['curiosIndex'] = int(c_item.get('Slot', c_idx)) if isinstance(c_item, dict) else c_idx
                            slots['curios'].append(f)
                            extract_nested(c_item, custom_name_of(c_item) or f['uk'], slots['backpacks'], f'Curios: {slot_uk}')

    # K23: додаткові слоти модів — з будь-якого вкладення гравця (міст K16), не за назвою мода; уміст — тим самим обходом
    for att_key, att_val in att.items():
        if att_key == 'curios:inventory': continue
        for st, slot_key in attachment_stacks(att_val, att_key):
            f = fmt_stack(st, 'Додатковий слот', 'mod_slot')
            if not f: continue
            f['slotKey'] = slot_key
            slots['modSlots'].append(f)
            extract_nested(st, custom_name_of(st) or f['uk'], slots['backpacks'], 'Додатковий слот', slot_key)

    for e_item in (pnbt.get('EnderItems') or []):
        f = fmt_stack(e_item, 'Ендер-скриня', 'enderChest')
        if f:
            slots['enderChest'].append(f)
            extract_nested(e_item, f"Усередині Ендер-скрині ({custom_name_of(e_item) or f['uk']})", slots['enderChest'], 'Ендер-скриня')
    return slots

def load_quest_catalog():
    """Каталог квестів і завдань з docs/data/chapters.json, docs/data/quests/*.json та config/ftbquests."""
    chs = jload(os.path.join(DATA, 'chapters.json'), {'chapters': []}).get('chapters', [])
    ch_meta = {c['file']: {'title': c.get('title', c['file']), 'hidden': bool(c.get('hidden')), 'quests': c.get('quests', 0)} for c in chs}
    q_meta = {}
    for f in sorted(glob.glob(os.path.join(DATA, 'quests', '*.json'))):
        d = jload(f, {})
        fn = d.get('chapter') or os.path.splitext(os.path.basename(f))[0]
        hid = ch_meta.get(fn, {}).get('hidden', False)
        for q in d.get('quests', []):
            q_meta[q['id']] = {'chapter': fn, 'title': q.get('title', ''), 'hidden': hid, 'optional': bool(q.get('optional'))}
    t_meta = {}
    for f in sorted(glob.glob(os.path.join(QUESTS, 'chapters', '*.json5'))):
        c = l5(f)
        fn = c.get('filename') or os.path.splitext(os.path.basename(f))[0]
        for q in c.get('quests', []):
            qid = q.get('id')
            for t in q.get('tasks', []):
                if t.get('id'):
                    t_meta[t['id']] = {'chapter': fn, 'quest': qid}
    return ch_meta, q_meta, t_meta

def collect_nbt_items(obj, counts):
    """Рекурсивно збирає предмети (id + count) зі структур інвентарю NBT (Inventory, EnderItems, Curios, Toolbelt, контейнери)."""
    if isinstance(obj, dict):
        iid = obj.get('id')
        cnt = obj.get('count', obj.get('Count', 1))
        if isinstance(iid, str) and ':' in iid and iid != 'minecraft:air' and isinstance(cnt, int) and cnt > 0:
            if any(k in obj for k in ('Slot', 'count', 'Count', 'components')):
                counts[iid] += cnt
        for k, v in obj.items():
            if k in ('Inventory', 'EnderItems', 'Items', 'stacks', 'Curios', 'Stacks', 'Cosmetics', 'equipment', 'components', 'minecraft:container', 'neoforge:attachments', 'curios:inventory', 'toolbelt:belt'):
                collect_nbt_items(v, counts)
    elif isinstance(obj, list):
        for x in obj:
            collect_nbt_items(x, counts)

def find_player_uuid(wdir):
    """Знаходить UUID активного гравця у світі за найновішим файлом даних."""
    cands = []
    for sub, ext in (('players/data', '.dat'), ('playerdata', '.dat'), ('ftbquests', '.json5'), ('players/advancements', '.json'), ('players/stats', '.json')):
        p = os.path.join(wdir, sub)
        if not os.path.isdir(p): continue
        for f in os.listdir(p):
            if f.endswith(ext) and not f.endswith('_old'):
                u = f[:-len(ext)]
                if re.match(r'^[0-9a-fA-F-]{32,36}$', u):
                    cands.append((os.path.getmtime(os.path.join(p, f)), u))
    if not cands:
        return None
    cands.sort(reverse=True)
    return cands[0][1]

def extract_world(wdir, slug, ch_meta, q_meta, t_meta, now_str, names_items=None, names_dims=None, mod_names=None, names_books=None):
    names_items = names_items or {}
    names_dims = names_dims or {}
    mod_names = mod_names or {}
    names_books = names_books or {}
    folder = os.path.basename(wdir)
    ld_path = os.path.join(wdir, 'level.dat')
    ld = read_nbt(ld_path).get('Data', {})
    world_name = ld.get('LevelName') or folder
    gt = ld.get('GameType', 0)
    if ld.get('hardcore') == 1:
        mode, mode_uk = 'hardcore', 'Хардкор'
    else:
        mode, mode_uk = GAME_MODES.get(gt, ('survival', 'Виживання'))
    uuid = find_player_uuid(wdir)
    mtimes = [os.path.getmtime(ld_path)] if os.path.exists(ld_path) else []
    if ld.get('LastPlayed'):
        mtimes.append(ld['LastPlayed'] / 1000.0)

    # 1. Дані гравця (.dat NBT)
    inv_counts = collections.Counter()
    p_info = {'uuid': uuid or ''}
    slots_data = None
    if uuid:
        pdat = os.path.join(wdir, 'players', 'data', f'{uuid}.dat')
        if not os.path.exists(pdat):
            pdat = os.path.join(wdir, 'playerdata', f'{uuid}.dat')
        if os.path.exists(pdat):
            mtimes.append(os.path.getmtime(pdat))
            pnbt = read_nbt(pdat)
            for k in ('Inventory', 'EnderItems', 'equipment', 'neoforge:attachments'):
                if k in pnbt:
                    collect_nbt_items(pnbt[k], inv_counts)
            slots_data = extract_structured_slots(pnbt, wdir, names_items, mod_names, names_books, inv_counts)
            if pnbt.get('playerGameType') == 1 and mode != 'creative':
                mode, mode_uk = 'creative', 'Творчість'
            p_info['xp_level'] = int(pnbt.get('XpLevel', 0))
            p_info['selected_slot'] = int(pnbt.get('SelectedItemSlot', 0) or 0)
            p_info['health'] = round(float(pnbt.get('Health', 20) or 20), 1)
            p_info['food_level'] = int(pnbt.get('foodLevel', 20) or 20)
            pos_raw = pnbt.get('Pos')
            if isinstance(pos_raw, list) and len(pos_raw) >= 3:
                p_info['pos'] = [int(float(v)) for v in pos_raw[:3]]
            dim_id = pnbt.get('Dimension', 'minecraft:overworld')
            p_info['dimension'] = dim_id
            if dim_id in names_dims:
                p_info['dimension_uk'] = names_dims[dim_id]
            att = pnbt.get('neoforge:attachments') or {}
            if isinstance(att.get('apotheosis:world_tier'), dict):
                p_info['world_tier'] = att['apotheosis:world_tier'].get('tier', 'haven')
            if isinstance(att.get('solcarrot:food'), dict):
                fl = att['solcarrot:food'].get('foodList')
                if isinstance(fl, list):
                    p_info['unique_foods'] = len(fl)

    # 2. Квести FTB (ftbquests/<uuid>.json5)
    q_done, q_started, t_done = set(), set(), {}
    rewards_claimed = 0
    if uuid:
        fq_path = os.path.join(wdir, 'ftbquests', f'{uuid}.json5')
        if os.path.exists(fq_path):
            mtimes.append(os.path.getmtime(fq_path))
            fq = l5(fq_path)
            raw_name = fq.get('name', '')
            if raw_name:
                p_info['name'] = raw_name.split('#')[0]
            rewards_claimed = len(fq.get('claimed_rewards') or {})
            for dec_id, val in (fq.get('task_progress') or {}).items():
                hid = to_hex_id(dec_id)
                if hid in t_meta:
                    t_done[hid] = int(val)
            for dec_id in (fq.get('completed') or {}):
                hid = to_hex_id(dec_id)
                if hid in q_meta:
                    q_done.add(hid)
                elif hid in t_meta:
                    t_done.setdefault(hid, 1)
            for dec_id in (fq.get('started') or {}):
                hid = to_hex_id(dec_id)
                if hid in q_meta and hid not in q_done:
                    q_started.add(hid)
                elif hid in t_meta:
                    qid = t_meta[hid]['quest']
                    if qid in q_meta and qid not in q_done:
                        q_started.add(qid)

    by_chapter = {}
    for qid in sorted(q_done):
        ch = q_meta[qid]['chapter']
        by_chapter.setdefault(ch, {'done': [], 'started': []})['done'].append(qid)
    for qid in sorted(q_started):
        ch = q_meta[qid]['chapter']
        by_chapter.setdefault(ch, {'done': [], 'started': []})['started'].append(qid)

    q_done_vis = sorted(qid for qid in q_done if not q_meta[qid]['hidden'])

    # 3. Досягнення (players/advancements/<uuid>.json)
    adv_done = []
    if uuid:
        adv_path = os.path.join(wdir, 'players', 'advancements', f'{uuid}.json')
        if os.path.exists(adv_path):
            mtimes.append(os.path.getmtime(adv_path))
            ad = jload(adv_path, {}) or {}
            for k, v in ad.items():
                if isinstance(v, dict) and v.get('done') is True and not re.search(r':recipes?/', k):
                    adv_done.append(k)
    adv_done.sort()

    # 4. Статистика (players/stats/<uuid>.json)
    crafted, picked_up, used, mined, dropped = {}, {}, {}, {}, {}
    play_ticks = int(ld.get('Time') or 0)
    if uuid:
        st_path = os.path.join(wdir, 'players', 'stats', f'{uuid}.json')
        if os.path.exists(st_path):
            mtimes.append(os.path.getmtime(st_path))
            st = (jload(st_path, {}) or {}).get('stats') or {}
            crafted = {k: v for k, v in (st.get('minecraft:crafted') or {}).items() if k != 'minecraft:air' and v > 0}
            picked_up = {k: v for k, v in (st.get('minecraft:picked_up') or {}).items() if k != 'minecraft:air' and v > 0}
            used = {k: v for k, v in (st.get('minecraft:used') or {}).items() if k != 'minecraft:air' and v > 0}
            mined = {k: v for k, v in (st.get('minecraft:mined') or {}).items() if k != 'minecraft:air' and v > 0}
            dropped = {k: v for k, v in (st.get('minecraft:dropped') or {}).items() if k != 'minecraft:air' and v > 0}
            pt = (st.get('minecraft:custom') or {}).get('minecraft:play_time')
            if isinstance(pt, int):
                play_ticks = pt

    obtained = sorted(set(crafted) | set(picked_up) | set(used) | set(mined) | set(dropped) | set(inv_counts))
    all_item_ids = sorted(set(obtained) | set(crafted) | set(inv_counts))
    item_names = {iid: resolve_item_uk(iid, names_items, mod_names, None, names_books) for iid in all_item_ids} if names_items else {}
    last_ts = int(max(mtimes)) if mtimes else 0

    res = {
        'slug': slug,
        'world': world_name,
        'folder': folder,
        'mode': mode,
        'mode_uk': mode_uk,
        'game_type': gt,
        'last_played': fmt_ts(last_ts),
        'last_played_ts': last_ts,
        'updated': now_str,
        'play_hours': round(play_ticks / 72000.0, 2),
        'player': p_info,
        'quests': {
            'done': sorted(q_done),
            'done_visible': q_done_vis,
            'started': sorted(q_started),
            'tasks_done': sorted(t_done.keys()),
            'rewards_claimed': rewards_claimed,
            'by_chapter': by_chapter,
        },
        'advancements': {
            'done': adv_done,
        },
        'items': {
            'obtained': obtained,
            'crafted': dict(sorted(crafted.items())),
            'inventory': dict(sorted(inv_counts.items())),
            'names': item_names,
        },
    }
    if slots_data:
        res['slots'] = slots_data
    return res

def main():
    want_world = None
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] in ('--world', '-w') and i + 1 < len(args):
            want_world = args[i + 1]
            i += 2
        elif args[i].startswith('--world='):
            want_world = args[i].split('=', 1)[1]
            i += 1
        else:
            i += 1

    ch_meta, q_meta, t_meta = load_quest_catalog()
    names_items, names_dims, mod_names, names_books = load_names_dict()
    now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    os.makedirs(PROG_DIR, exist_ok=True)

    world_dirs = []
    if os.path.isdir(SAVES):
        for name in sorted(os.listdir(SAVES)):
            p = os.path.join(SAVES, name)
            if os.path.isdir(p) and os.path.exists(os.path.join(p, 'level.dat')):
                world_dirs.append(p)

    used_slugs = set()
    extracted = []
    for wdir in world_dirs:
        base_slug = slugify(os.path.basename(wdir))
        slug = base_slug
        n = 2
        while slug in used_slugs:
            slug = f'{base_slug}_{n}'; n += 1
        used_slugs.add(slug)
        wdata = extract_world(wdir, slug, ch_meta, q_meta, t_meta, now_str, names_items, names_dims, mod_names, names_books)
        extracted.append(wdata)

    # Сортуємо світи: спершу не-творчі (виживання/пригода), усередині — за часом останньої гри (найновіші зверху)
    extracted.sort(key=lambda w: (w['mode'] == 'creative', -w['last_played_ts']))

    # Вибір світу за замовчуванням
    chosen = None
    if want_world:
        q = want_world.strip().lower()
        for w in extracted:
            if q in (w['folder'].lower(), w['world'].lower(), w['slug'].lower()):
                chosen = w; break
        if not chosen:
            for w in extracted:
                if q in w['folder'].lower() or q in w['world'].lower() or q in w['slug'].lower():
                    chosen = w; break
        if not chosen:
            avail = ', '.join(f"«{w['world']}» ({w['slug']})" for w in extracted) or 'немає'
            print(f"!! Світ «{want_world}» не знайдено в minecraft/saves/. Наявні: {avail}", file=sys.stderr)
            sys.exit(1)
    else:
        # За замовчуванням — світ, у який грали останнім, але творчі світи (GameType = 1) пропускаємо
        non_creative = [w for w in extracted if w['mode'] != 'creative']
        chosen = non_creative[0] if non_creative else (extracted[0] if extracted else None)

    worlds_summary = []
    for w in extracted:
        jsave(os.path.join(PROG_DIR, f"{w['slug']}.json"), w)
        worlds_summary.append({
            'slug': w['slug'],
            'world': w['world'],
            'folder': w['folder'],
            'mode': w['mode'],
            'mode_uk': w['mode_uk'],
            'last_played': w['last_played'],
            'last_played_ts': w['last_played_ts'],
            'updated': w['updated'],
            'play_hours': w['play_hours'],
            'quests_done': len(w['quests']['done']),
            'quests_visible_done': len(w['quests']['done_visible']),
            'quests_started': len(w['quests']['started']),
            'advancements_done': len(w['advancements']['done']),
            'items_obtained': len(w['items']['obtained']),
        })

    default_slug = chosen['slug'] if chosen else ''
    index_obj = {
        'default': default_slug,
        'updated': now_str,
        'worlds': worlds_summary,
    }
    jsave(os.path.join(PROG_DIR, 'index.json'), index_obj)

    if chosen:
        main_prog = dict(chosen, default=default_slug, worlds=worlds_summary)
    else:
        main_prog = {
            'slug': '', 'world': '', 'folder': '', 'mode': 'survival', 'mode_uk': 'Виживання',
            'game_type': 0, 'last_played': '', 'last_played_ts': 0, 'updated': now_str, 'play_hours': 0,
            'player': {}, 'quests': {'done': [], 'done_visible': [], 'started': [], 'tasks_done': [], 'rewards_claimed': 0, 'by_chapter': {}},
            'advancements': {'done': []}, 'items': {'obtained': [], 'crafted': {}, 'inventory': {}},
            'default': '', 'worlds': [],
        }
    jsave(os.path.join(DATA, 'progress.json'), main_prog)

    if chosen:
        print(f"світів {len(extracted)} | вибрано «{chosen['world']}» ({chosen['slug']}, {chosen['mode_uk']}, гра: {chosen['last_played']}) "
              f"| квестів виконано {len(chosen['quests']['done'])} (у видимих главах {len(chosen['quests']['done_visible'])}, розпочато {len(chosen['quests']['started'])}) "
              f"| досягнень {len(chosen['advancements']['done'])} | предметів {len(chosen['items']['obtained'])}")
        for ch_file, ch_q in sorted(chosen['quests']['by_chapter'].items()):
            ct = ch_meta.get(ch_file, {})
            hid_tag = ' [прихована]' if ct.get('hidden') else ''
            d_titles = [f"{qid} ({q_meta[qid]['title']})" for qid in ch_q['done']]
            s_titles = [f"{qid} ({q_meta[qid]['title']})" for qid in ch_q['started']]
            print(f"  глава {ch_file} «{ct.get('title', ch_file)}»{hid_tag}: виконано {len(ch_q['done'])}/{ct.get('quests', '?')}"
                  + (f" — {', '.join(d_titles)}" if d_titles else '')
                  + (f" | розпочато {len(ch_q['started'])}: {', '.join(s_titles)}" if s_titles else ''))
    else:
        print('світів 0 — створено порожній progress.json')

if __name__ == '__main__':
    main()
