# Індекси бекенду збірки для «сита» (сесія S) — ПОВНИЙ розбір, не вибірка:
#   raw/registry_index.json  моди (з neoforge.mods.toml усіх jar і вкладених jarjar), предмети, блоки, рідини
#   raw/tags_index.json      теги item/block/fluid (розв'язані, з replace і вкладеними #тегами) + джерела
#   raw/recipes_index.json   рецепти: ванільний jar, NeoForge, усі jar модів (+ jarjar), kubejs/data, kubejs/dynamic_data (як read_dynamic_data.js);
#                            умови NeoForge → active true / false / null (умова мода, яку не обчислити з файлів) + why; вимкнене KubeJS — з raw/kubejs_index.json
#   raw/config_index.json    minecraft/config *.toml / *.json / *.json5 → {файл: {ключ.шлях: значення}}
#   raw/lang_index.json      en_us усіх jar (ключ → текст)
#   raw/recipes_report.md    підсумок, звірка з logs/kubejs/server.log (Found N (skipped M)), нерозібране
# Запуск з atm11_guide:  python3 -I tools/extract_recipes.py  → потім tools/extract_kubejs.py (KubeJS накладає remove / додані рецепти)
import os, sys, re, json, glob, zipfile, io, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MC, MODS, RAW, ROOT, tomli, json5, jload, jsave, CLIENT_JARS
from extract_game_names import registry_ids

def pack_ver(uid):
    d = jload(os.path.join(ROOT, 'mmc-pack.json'), {}) or {}
    return next((c.get('version') for c in d.get('components', []) if c.get('uid') == uid), '')

def neoforge_jar():
    v = pack_ver('net.neoforged'); n = f'neoforge-{v}-universal.jar'
    for p in (os.environ.get('ATM11_NEOFORGE_JAR'),
              os.path.join(os.environ.get('APPDATA', ''), 'PrismLauncher', 'libraries', 'net', 'neoforged', 'neoforge', v, n) if os.environ.get('APPDATA') else None,
              os.path.join(os.path.expanduser('~'), 'mnt', v, n)):
        if p and os.path.exists(p): return p

class Zip:
    def __init__(self, label, z): self.label, self.z = label, z; self.names = z.namelist()
    def read(self, n): return self.z.read(n)
class Dir:
    def __init__(self, label, root, files): self.label, self.root = label, root; self.names = files
    def read(self, n): return open(os.path.join(self.root, n), 'rb').read()

def sources(rep):
    """Джерела даних у порядку завантаження (пізніше перекриває раніше): vanilla → neoforge → моди (+ jarjar) → kubejs/data → kubejs/dynamic_data."""
    out = []
    cj = next((p for p in CLIENT_JARS() if os.path.exists(p)), None)
    if cj: out.append(Zip('minecraft', zipfile.ZipFile(cj)))
    else: rep.append('⚠ клієнтського jar Minecraft немає — ванільних рецептів і тегів в індексі немає (common.CLIENT_JARS)')
    nf = neoforge_jar()
    if nf: out.append(Zip('neoforge', zipfile.ZipFile(nf)))
    else: rep.append('⚠ jar NeoForge (universal) не знайдено — теги c: лише з модів')
    for j in sorted(glob.glob(os.path.join(MODS, '*.jar'))):
        try: z = zipfile.ZipFile(j)
        except Exception as e: rep.append(f'⚠ не відкрився {os.path.basename(j)}: {e}'); continue
        out.append(Zip(os.path.basename(j), z))
        for n in z.namelist():
            if n.startswith('META-INF/jarjar/') and n.endswith('.jar'):
                try: out.append(Zip(os.path.basename(j) + '!' + os.path.basename(n), zipfile.ZipFile(io.BytesIO(z.read(n)))))
                except Exception as e: rep.append(f'⚠ вкладений {n} у {os.path.basename(j)}: {e}')
    kd = os.path.join(MC, 'kubejs', 'data')
    if os.path.isdir(kd):
        fs = [os.path.relpath(os.path.join(r, f), os.path.join(MC, 'kubejs')).replace(os.sep, '/') for r, _, ff in os.walk(kd) for f in ff]
        out.append(Dir('kubejs/data', os.path.join(MC, 'kubejs'), fs))
    return out

def mod_ids(src):
    if 'META-INF/neoforge.mods.toml' not in src.names: return []
    try: t = tomli.loads(src.read('META-INF/neoforge.mods.toml').decode('utf-8', 'replace'))
    except Exception: return []
    return [m['modId'] for m in t.get('mods', []) if isinstance(m, dict) and m.get('modId')]

def dynamic_data(loaded, rep):
    """kubejs/dynamic_data/index.json — read_dynamic_data.js підключає файл, якщо перша тека — завантажений мод або atm."""
    base = os.path.join(MC, 'kubejs', 'dynamic_data')
    try: idx = json5.load(open(os.path.join(base, 'index.json'), encoding='utf-8')).get('index', [])
    except Exception as e: rep.append(f'⚠ dynamic_data/index.json: {e}'); return None, []
    files, off, gone = [], [], []
    for f in idx:
        mod = f.split('/', 1)[0]
        if not os.path.exists(os.path.join(base, f)): gone.append(f); continue      # JsonIO.readJson → null: скрипт пропускає
        (files if (mod == 'atm' or mod in loaded) else off).append(f)
    if gone: rep.append(f'інфо: kubejs/dynamic_data/index.json називає файли, яких немає (скрипт їх пропускає): {len(gone)} — {", ".join(gone[:6])}')
    d = Dir('kubejs/dynamic_data', base, files)
    d.map = {'data/' + f: f for f in files}      # data/<мод>/<шлях> ← <мод>/<шлях>
    d.names = list(d.map); d.read = lambda n, b=base, m=d.map: open(os.path.join(b, m[n]), 'rb').read()
    return d, off

RX_ID = re.compile(r'^#?[a-z0-9_.-]+:[a-z0-9_/.-]+$')
RX_RECIPE = re.compile(r'data/([^/]+)/(recipes?)/(.+)\.json$')
RX_TAG = re.compile(r'data/([^/]+)/tags/(item|block|fluid)s?/(.+)\.json$')
SKIPK = {'type', 'neoforge:conditions', 'conditions', 'fabric:load_conditions', 'bookshelf:load_conditions', 'group', 'category', 'recipe_type', 'sound', 'texture', 'advancement'}
PRIMARY = {'result', 'results', 'output', 'outputs', 'result_item'}
OUTK = re.compile(r'result|output|product|byproduct|secondar|^outs?$|drops?$', re.I)

def registry(srcs, rep, en):
    items, blocks, fluids = set(), set(), set()
    for s in srcs:
        for n in s.names:
            m = re.match(r'assets/([^/]+)/(items|blockstates)/(.+)\.json$', n)
            if m: (items if m[2] == 'items' else blocks).add(f'{m[1]}:{m[3]}'); continue
            if n.endswith('/lang/en_us.json'):
                try: d = json.loads(s.read(n).decode('utf-8-sig', 'replace'))
                except Exception: continue
                if isinstance(d, dict): en.update(d)
                for k in d:
                    mm = re.match(r'fluid(?:_type)?\.([a-z0-9_.-]+)\.([a-z0-9_/.-]+)$', k)
                    if mm: fluids.add(f'{mm[1]}:{mm[2]}')
    fluids |= {'minecraft:water', 'minecraft:lava', 'minecraft:empty'}
    return items, blocks, fluids

def pick_items(jar_items, game):
    """Реєстр предметів для сита (K6): знімок реєстру гри, якщо він є, інакше — моделі предметів у jar. Замір K6: за файлами jar
    «існували» 2 070 предметів, яких гра не реєструє (мод вимикає їх конфігом), і бракувало 317 зареєстрованих кодом — умова
    neoforge:registered і вміст тегів виходили не такими, як у грі (1 799 рецептів). → (предмети, 'game' | 'jar')"""
    return (set(game), 'game') if game else (set(jar_items), 'jar')

def tag_values(d):
    for v in d.get('values', []):
        if isinstance(v, str): yield v, True
        elif isinstance(v, dict) and isinstance(v.get('id'), str): yield v['id'], v.get('required', True)

def tags(srcs, exist, rep):
    """Визначення тегів по черзі джерел (replace: true скидає попередні) → розв'язані списки."""
    defs, srcmap, bad = collections.defaultdict(list), collections.defaultdict(list), 0
    for s in srcs:
        for n in s.names:
            m = RX_TAG.match(n)
            if not m: continue
            try: d = json.loads(s.read(n).decode('utf-8-sig'))
            except Exception: bad += 1; continue
            key = (m[2], f'{m[1]}:{m[3]}')
            if d.get('replace'): defs[key] = []; srcmap[key] = []
            defs[key] += list(tag_values(d)); srcmap[key].append(s.label)
    if bad: rep.append(f'⚠ тегів, що не читаються як JSON: {bad}')
    memo, missing = {}, collections.Counter()
    def res(reg, tid, stack=()):
        if (reg, tid) in memo: return memo[(reg, tid)]
        if (reg, tid) in stack: return set()
        out = set()
        for v, req in defs.get((reg, tid), []):
            if v.startswith('#'): out |= res(reg, v[1:], stack + ((reg, tid),))
            elif v in exist[reg]: out.add(v)
            elif req: missing[reg] += 1
        memo[(reg, tid)] = out; return out
    resolved = {r: {} for r in ('item', 'block', 'fluid')}
    for (reg, tid) in list(defs): resolved[reg][tid] = sorted(res(reg, tid))
    if missing: rep.append(f'інфо: у тегах обов\'язкові записи неіснуючих предметів/блоків/рідин: {dict(missing)} (гра пише попередження)')
    return resolved, {f'{r}:{t}': v for (r, t), v in srcmap.items()}

def ingredients(d, items, fluids):
    """Усі ID предметів / рідин / тегів рецепта: входи й виходи (виходи — під ключами result/output/…). Інші ID (сутності, ритуали) — x."""
    ins, outs, other = set(), set(), set()
    def walk(o, key, isout):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in SKIPK: continue
                if k == 'tag' and isinstance(v, str): (outs if isout else ins).add('#' + v.lstrip('#')); continue
                walk(v, k, isout or bool(OUTK.search(k)))
        elif isinstance(o, list):
            for x in o: walk(x, key, isout)
        elif isinstance(o, str) and RX_ID.match(o):
            if o.startswith('#') or o in items or o in fluids: (outs if isout else ins).add(o)
            else: other.add(o); (unk.add(o) if key in ('item', 'id', 'items', 'fluid', 'result') else None)
    unk = set(); walk(d, '', False)
    prim = set()                                   # головні виходи (верхні ключі result/output…) — за ними KubeJS шукає remove({output})
    for k in PRIMARY & set(d):
        def w(o):
            if isinstance(o, dict):
                for kk, v in o.items():
                    if kk == 'tag' and isinstance(v, str): prim.add('#' + v.lstrip('#'))
                    elif kk not in SKIPK: w(v)
            elif isinstance(o, list):
                for y in o: w(y)
            elif isinstance(o, str) and RX_ID.match(o) and (o.startswith('#') or o in items or o in fluids): prim.add(o)
        w(d[k])
    return sorted(ins), sorted(outs), sorted(other - ins - outs), sorted(unk), sorted(prim)

class Ctx:
    def __init__(self, loaded, items, blocks, fluids, tagsr): self.loaded, self.items, self.blocks, self.fluids, self.tags = loaded, items, blocks, fluids, tagsr

_FLAGS = {}
def mod_flags(m):
    """Стан, за яким мод обчислює свою умову рецепта (G6d): sophisticatedcore — enabledItems конфігу; mysticalagriculture — cropInfo.json, який пише гра."""
    if m not in _FLAGS:
        f = {}
        try:
            if m == 'sophisticatedcore':
                for x in tomli.loads(open(os.path.join(MC, 'config', 'sophisticatedcore-common.toml'), encoding='utf-8').read()).get('enabledItems', []):
                    k, _, v = x.rpartition('|'); f[k] = v.strip().lower() == 'true'
            elif m == 'mysticalagriculture':
                d = json.load(open(os.path.join(MC, 'kubejs', 'server_scripts', 'mods', 'mysticalagriculture', 'cropInfo.json'), encoding='utf-8'))
                f = {**{x: False for x in d.get('disabled', [])}, **{x: True for x in d.get('enabled', [])}}
        except Exception: f = {}
        _FLAGS[m] = f
    return _FLAGS[m]

def cond(c, ctx):
    """Умова NeoForge → (True | False | None, пояснення)."""
    if not isinstance(c, dict): return None, f'умова не об\'єкт: {c!r}'[:80]
    t = c.get('type', '')
    if t in ('neoforge:true',): return True, ''
    if t in ('neoforge:false', 'neoforge:never'): return False, t
    if t == 'neoforge:mod_loaded': return (c.get('modid') in ctx.loaded), f"мод {c.get('modid')} {'є' if c.get('modid') in ctx.loaded else 'відсутній'}"
    if t == 'neoforge:not':
        v, w = cond(c.get('value'), ctx); return (None if v is None else not v), f'не ({w})'
    if t in ('neoforge:and', 'neoforge:or'):
        rs = [cond(x, ctx) for x in c.get('values', [])]; vs = [r[0] for r in rs]; ws = '; '.join(r[1] for r in rs)
        if t == 'neoforge:and': v = False if False in vs else (None if None in vs else True)
        else: v = True if True in vs else (None if None in vs else False)
        return v, ws
    if t == 'neoforge:registered':
        reg, val = c.get('registry', 'minecraft:item'), c.get('value')
        pool = {'minecraft:item': ctx.items, 'minecraft:block': ctx.blocks, 'minecraft:fluid': ctx.fluids}.get(reg)
        if pool is None: return None, f'реєстр {reg}'
        return (val in pool), f"{val} {'зареєстровано' if val in pool else 'не зареєстровано'}"
    if t == 'neoforge:tag_empty':
        tid = c.get('tag', '').lstrip('#'); e = not ctx.tags['item'].get(tid)
        return e, f"тег {tid} {'порожній' if e else 'не порожній'}"
    if t == 'sophisticatedcore:item_enabled':                           # G6d: умову обчислює config/sophisticatedcore-common.toml (enabledItems "id|true/false")
        v = mod_flags('sophisticatedcore').get(c.get('itemRegistryName'))
        if v is not None: return v, f"{c.get('itemRegistryName')} {'увімкнено' if v else 'вимкнено'} (sophisticatedcore-common.toml enabledItems)"
    if t == 'mysticalagriculture:crop_enabled':                         # G6d: увімкнені культури гра пише в kubejs/server_scripts/mods/mysticalagriculture/cropInfo.json
        v = mod_flags('mysticalagriculture').get((c.get('crop') or '').split(':')[-1])
        if v is not None: return v, f"культура {c.get('crop')} {'увімкнена' if v else 'вимкнена'} (cropInfo.json)"
    if t.split(':')[0] in ctx.loaded or t.split(':')[0] in ('productivelib', 'cucumber'):
        return None, f'умова мода {t} (обчислює мод під час гри)'
    return False, f'умова {t} — мода немає'

def conds(d, ctx):
    cs = d.get('neoforge:conditions')
    if not cs: return True, ''
    rs = [cond(c, ctx) for c in (cs if isinstance(cs, list) else [cs])]; vs = [r[0] for r in rs]
    v = False if False in vs else (None if None in vs else True)
    return v, '; '.join(r[1] for r in rs if r[1] and (r[0] is not True or v is not True))

NOT_MODS = {'minecraft', 'c', 'neoforge', 'forge', 'kubejs', 'atm'}

def recipes(srcs, ctx, rep):
    idx, dup, plural, bad = {}, collections.Counter(), collections.Counter(), []
    for s in srcs:
        for n in s.names:
            m = RX_RECIPE.match(n)
            if not m: continue
            if m[2] == 'recipes': plural[s.label] += 1; continue           # 1.21+: тека recipe/; recipes/ гра не читає
            rid = f'{m[1]}:{m[3]}'
            try: d = json.loads(s.read(n).decode('utf-8-sig'))
            except Exception as e: bad.append(f'{s.label}:{n}: {str(e)[:60]}'); continue
            if not isinstance(d, dict): bad.append(f'{s.label}:{n}: не об\'єкт'); continue
            if rid in idx: dup[rid] += 1
            t = d.get('type') or ''; t = t if ':' in t else 'minecraft:' + t if t else ''
            a, why = conds(d, ctx)
            ins, outs, other, unk, prim = ingredients(d, ctx.items, ctx.fluids)
            tns = t.split(':')[0]
            if a is not False:
                if not t: a, why = False, 'без type'
                elif tns not in ctx.loaded and tns != 'minecraft': a, why = False, f'тип {t} — мода {tns} немає'
                else:
                    gone = sorted({u.split(':')[0] for u in unk} - ctx.loaded - NOT_MODS)
                    if gone: a, why = False, f'предмети модів, яких немає: {", ".join(gone)} (рецепт не завантажиться)'
            mods = sorted({x.lstrip('#').split(':')[0] for x in ins + outs if not x.startswith('#')} - NOT_MODS | ({tns} - NOT_MODS if tns else set()))
            e = {'t': t, 'src': s.label, 'p': n, 'in': ins, 'out': outs, 'm': mods, 'a': a}
            if why: e['why'] = why
            if other: e['x'] = other[:12]
            if prim != outs: e['po'] = prim
            idx[rid] = e
    if plural: rep.append(f'інфо: файлів у застарілій теці recipes/ (1.20; гра 1.21+ їх не читає, в індекс не взято): {sum(plural.values())} у {len(plural)} jar')
    if bad: rep += [f'⚠ рецептів, що не читаються: {len(bad)}'] + [f'  - {b}' for b in bad[:20]]
    if dup: rep.append(f'інфо: ID рецепта в кількох джерелах (діє останнє за порядком): {len(dup)} — напр. {", ".join(list(dup)[:5])}')
    return idx

CFG_SKIP = {'ftbquests', 'thaumaturge/aspect_index.json'}       # квести (extract_quests.py) і велика таблиця даних — не налаштування

def configs(rep):
    out, skipped = {}, collections.Counter()
    base = os.path.join(MC, 'config')
    for r, dd, ff in os.walk(base):
        dd[:] = [x for x in dd if os.path.relpath(os.path.join(r, x), base).replace(os.sep, '/') not in CFG_SKIP]
        for f in ff:
            if os.path.relpath(os.path.join(r, f), base).replace(os.sep, '/') in CFG_SKIP: skipped['дані, не конфіг'] += 1; continue
            p = os.path.join(r, f); rel = os.path.relpath(p, MC).replace(os.sep, '/'); ext = f.rsplit('.', 1)[-1].lower()
            try:
                if ext == 'toml': d = tomli.loads(open(p, encoding='utf-8-sig').read())
                elif ext in ('json', 'json5', 'jsonc'): d = json5.loads(open(p, encoding='utf-8-sig').read())
                else: skipped[ext] += 1; continue
            except Exception as e: skipped[f'{ext} (помилка розбору)'] += 1; rep.append(f'  - конфіг не розібрано: {rel}: {str(e)[:70]}'); continue
            flat = {}
            def walk(o, pre):
                if isinstance(o, dict) and o:
                    for k, v in o.items(): walk(v, f'{pre}.{k}' if pre else str(k))
                else: flat[pre or '.'] = o
            walk(d, ''); out[rel] = flat
    rep.append(f'конфігів розібрано: {len(out)}; інші формати (не ключ=значення, в індекс не взято): {dict(skipped)}')
    return out

def kjs_log():
    p = os.path.join(MC, 'logs', 'kubejs', 'server.log')
    if not os.path.exists(p): return {}
    s = open(p, encoding='utf-8', errors='replace').read(); r = {}
    m = re.findall(r'Found ([\d,]+) recipes \(skipped ([\d,]+)\)', s)
    if m: r['found'], r['skipped'] = (int(x.replace(',', '')) for x in m[-1])
    m = re.findall(r'Added (\d+) recipes, removed (\d+) recipes, modified (\d+) recipes', s)
    if m: r['added'], r['removed'], r['modified'] = (int(x) for x in m[-1])
    return r

def apply_kjs(idx, rep, k=None):
    """Накласти KubeJS з raw/kubejs_index.json: remove → a: false (kjs_off, a0 — як було), replaceInput/Output → kjs_mod, додані рецепти (src: kubejs). Ідемпотентно."""
    k = k if k is not None else jload(os.path.join(RAW, 'kubejs_index.json'))
    if not k: rep.append('інфо: raw/kubejs_index.json ще немає — KubeJS не накладено (запустіть tools/extract_kubejs.py)'); return
    for rid in [r for r, e in idx.items() if e.get('src') == 'kubejs']:
        if idx[rid].get('orig'): idx[rid] = idx[rid]['orig']             # рецепт jar, який перекрив KubeJS з тим самим id
        else: del idx[rid]
    for e in idx.values():
        if 'kjs_off' in e:
            e['a'] = e.pop('a0', e['a']); e.pop('kjs_off'); w = e.pop('why0', None); e.pop('why', None)
            if w: e['why'] = w
        e.pop('kjs_mod', None)
    off = 0
    for rid, by in (k.get('removed_ids') or {}).items():
        e = idx.get(rid)
        if e:
            e['a0'] = e['a']; e['a'] = False; e['kjs_off'] = by; off += 1
            if e.get('why'): e['why0'] = e['why']
            e['why'] = f'вимкнено KubeJS: {by}'
    for rid, by in (k.get('modified_ids') or {}).items():
        if rid in idx: idx[rid]['kjs_mod'] = by
    for r in k.get('recipes', []):
        e = {'t': r['type'], 'src': 'kubejs', 'p': r['at'], 'in': r['in'], 'out': r['out'], 'm': r['mods'], 'a': r['active']}
        if r.get('why'): e['why'] = r['why']
        rid = r['key']
        if rid in idx: e['orig'] = idx[rid]
        idx[rid] = e
    rep.append(f"KubeJS: вимкнено рецептів {off}, змінено {len(k.get('modified_ids') or {})}, додано {len(k.get('recipes', []))}")

def main():
    rep = []
    srcs = sources(rep)
    loaded = set()
    for s in srcs: loaded |= set(mod_ids(s))
    loaded |= {'minecraft', 'neoforge'}
    ml = os.path.join(MC, 'logs', 'modlist.txt')
    if os.path.exists(ml):
        ids = {c[2].strip() for c in (l.split('|') for l in open(ml, encoding='utf-8', errors='replace')) if len(c) > 3 and re.fullmatch(r'[a-z][a-z0-9_]+', c[2].strip())}
        if ids:
            diff = sorted(ids - loaded); diff2 = sorted(loaded - ids)
            rep.append(f'звірка з logs/modlist.txt (останній запуск гри): там {len(ids)} модів; лише там: {diff[:15]}; лише в jar: {diff2[:15]}')
            loaded |= ids
    dd, off = dynamic_data(loaded, rep)
    if dd: srcs.append(dd)
    if off: rep.append(f'kubejs/dynamic_data: не підключено (мода немає) {len(off)} файлів — напр. {", ".join(off[:4])}')
    en = {}; jar_items, blocks, fluids = registry(srcs, rep, en)
    items, items_src = pick_items(jar_items, registry_ids(jload(os.path.join(RAW, 'game_item_names.json'), None)))
    if items_src == 'game': rep.append(f'реєстр предметів — знімок гри raw/game_item_names.json: {len(items)}; за моделями в jar було б {len(jar_items)} (лише в jar, гра не реєструє: {len(jar_items - items)}; лише в грі, зареєстровано кодом: {len(items - jar_items)})')
    else: rep.append('⚠ знімка реєстру гри (raw/game_item_names.json) немає — предмети за моделями в jar: умова neoforge:registered і теги можуть відрізнятись від гри (tools/extract_game_names.py після запуску гри з компаньйоном)')
    tagsr, tsrc = tags(srcs, {'item': items, 'block': blocks, 'fluid': fluids}, rep)
    ctx = Ctx(loaded, items, blocks, fluids, tagsr)
    idx = recipes(srcs, ctx, rep)
    apply_kjs(idx, rep)
    jsave(os.path.join(RAW, 'registry_index.json'), {'mods': sorted(loaded), 'items': sorted(items), 'items_src': items_src, 'blocks': sorted(blocks), 'fluids': sorted(fluids),
          'sources': [s.label for s in srcs]}, compact=True)
    jsave(os.path.join(RAW, 'tags_index.json'), {'item': tagsr['item'], 'block': tagsr['block'], 'fluid': tagsr['fluid'], 'src': tsrc}, compact=True)
    jsave(os.path.join(RAW, 'recipes_index.json'), idx, compact=True)
    jsave(os.path.join(RAW, 'config_index.json'), configs(rep), compact=True)
    jsave(os.path.join(RAW, 'lang_index.json'), en, compact=True)
    a = collections.Counter('так' if e['a'] is True else 'ні' if e['a'] is False else 'невідомо' for e in idx.values())
    why = collections.Counter(re.sub(r'(мод|тип|предмети модів, яких немає:|тег|умова мода|вимкнено KubeJS:) \S+.*', r'\1 …', e.get('why', '')) for e in idx.values() if e['a'] is not True)
    kl = kjs_log(); n_base = sum(1 for e in idx.values() if e.get('src') != 'kubejs' or e.get('orig'))
    head = ['# Індекс рецептів збірки (tools/extract_recipes.py)', '',
            f'Джерел: {len(srcs)} (vanilla, NeoForge, jar модів і вкладені jarjar, kubejs/data, kubejs/dynamic_data); модів завантажено: {len(loaded)}; предметів: {len(items)}, блоків: {len(blocks)}, рідин: {len(fluids)}; тегів предметів: {len(tagsr["item"])}',
            f'Рецептів: {len(idx)} — активні {a["так"]}, неактивні {a["ні"]}, невідомо (умова мода) {a["невідомо"]}', '',
            '## Звірка з грою (logs/kubejs/server.log)', '',
            f'- гра: знайдено {kl.get("found", "?")} + пропущено умовами {kl.get("skipped", "?")} = {kl.get("found", 0) + kl.get("skipped", 0)}; індекс (без доданого KubeJS): {n_base} — різниця: рецепти, які моди генерують кодом (напр. насіння Mystical Agriculture), в jar їх немає',
            f'- KubeJS у грі: додано {kl.get("added", "?")}, вимкнено {kl.get("removed", "?")}, змінено {kl.get("modified", "?")} (звірка — у raw/kubejs_report.md)', '',
            '## Чому неактивні / невідомо', ''] + [f'- {v} — {k or "?"}' for k, v in why.most_common(25)] + ['', '## Примітки', ''] + [f'- {x}' for x in rep]
    open(os.path.join(RAW, 'recipes_report.md'), 'w', encoding='utf-8').write('\n'.join(head) + '\n')
    print('\n'.join(head[2:10]))

if __name__ == '__main__': main()
