# Зводить raw/ + content/ → docs/data/*.json і перевіряє посилання. Запуск з atm11_guide: python3 -I tools/build_data.py [--check]
# Вихід: mods.json (усі моди: авто + ручне), keys.json (build_keys.py), classes.json, stages.json, roadmap.json, branches.json, meta.json; звіт — raw/build_report.txt
import os, sys, glob, re, datetime, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RAW, CONTENT, DATA, UA, jload, jsave
import build_keys

PERF = re.compile(r'sodium|ferrite|modernfix|immediatelyfast|fastsuite|fastfurnace|fastbench|spark|imfast|flickerfix|maxhealthfix|attributefix|netherportalfix|crash|bcc|clumps|getittogether', re.I)
LIB = re.compile(r'\b(lib|library|api|core|codelib|framework|config)\b|lib$|^lib|corelib|configlib', re.I)

def auto_class(m):
    """Чернетка для модів без ручного опису (позначається auto: true). Ручне в content/mods/*.json завжди перемагає."""
    c = m.get('counts', {}); n = c.get('item', 0) + c.get('block', 0)
    blob = f"{m['id']} {m.get('name', '')} {m.get('desc_en', '')}"
    if m.get('kind') == 'library-jar': return ['library'], 'library'
    if PERF.search(m['id']) or PERF.search(m.get('name', '')): return ['perf'], 'perf'
    if n <= 2 and LIB.search(blob): return ['library'], 'library'
    if n <= 2: return ['qol'], 'qol'
    return [], 'content'

FEAT_IDS = ('dimension', 'boss', 'dungeon', 'biome', 'ores', 'mobs')

def auto_features(m):
    """Піктограми можливостей з raw (extract_mods → world). Ручне content.features повністю замінює автоматичне."""
    w = m.get('world') or {}; f = []
    if w.get('dims'): f.append('dimension')
    if w.get('bosses'): f.append('boss')
    if w.get('structures', 0) >= 1: f.append('dungeon')
    if w.get('biomes', 0) >= 2: f.append('biome')
    if w.get('ores', 0) >= 1: f.append('ores')
    if w.get('eggs', 0) >= 2: f.append('mobs')                     # лише яйця виклику (кількість entity у lang дає хибні: снаряди, машини)
    return f

def uk_dim_names():
    """Українські назви вимірів з нашого перекладу (ua_work/review/effective.tsv: key, ns, src, en, uk)."""
    p = os.path.join(UA, 'review', 'effective.tsv'); out = {}
    if os.path.exists(p):
        for line in open(p, encoding='utf-8'):
            if 'dimension' in line.split('\t', 1)[0]:
                c = line.rstrip('\n').split('\t')
                if len(c) >= 5: out[c[0]] = c[4]
    return out

def icon_ids(*objs):
    """Усі ID предметів із полів icons / icon / done_by.items (як у tools/extract_icons.py)."""
    out = set()
    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in ('icons', 'icon') and isinstance(v, (list, str)):
                    out.update(x for x in ([v] if isinstance(v, str) else v) if isinstance(x, str) and re.match(r'^[a-z0-9_.-]+:[a-z0-9_/.-]+$', x))
                elif k == 'done_by' and isinstance(v, dict):
                    out.update(x for x in (v.get('items') or []) if isinstance(x, str) and re.match(r'^[a-z0-9_.-]+:[a-z0-9_/.-]+$', x))
                else: walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    for o in objs: walk(o)
    return out

def load_curated():
    cur = {}
    for f in sorted(glob.glob(os.path.join(CONTENT, 'mods', '*.json'))):
        d = jload(f, {})
        for k, v in d.items():
            if k.startswith('_'): continue
            if k in cur: print('!! мод описано двічі:', k, os.path.basename(f))
            cur[k] = dict(v, _file=os.path.basename(f))
    return cur

def main():
    rep = []; warn = lambda s: (rep.append('!! ' + s))
    auto = jload(os.path.join(RAW, 'mods_auto.json'), [])
    classes = jload(os.path.join(CONTENT, 'classes.json'))
    cls_ids = {c['id'] for c in classes['classes']}; role_ids = {r['id'] for r in classes['roles']}
    cur = load_curated(); ids = {m['id'] for m in auto}
    stages = jload(os.path.join(CONTENT, 'stages.json'), {'stages': []})
    st_ids = {s['id'] for s in stages['stages']}
    mods = []; ukd = uk_dim_names()
    for m in auto:
        c = cur.get(m['id'], {})
        ac, ar = auto_class(m)
        out = {k: v for k, v in m.items() if k not in ('primary', 'world')}
        w = m.get('world') or {}
        out['features'] = c.get('features', auto_features(m))
        dims = c.get('dims', [{'id': d['id'], 'name': ukd.get(d.get('key') or '', d['name'])} for d in w.get('dims', [])])
        if dims: out['dims'] = dims
        if w.get('bosses'): out['bosses'] = w['bosses']
        for f in out['features']:
            if f not in FEAT_IDS: warn(f"{m['id']}: невідома можливість {f}")
        out['cls'] = c.get('cls') or ac
        out['role'] = c.get('role') or ar
        out['auto'] = not bool(c)
        for k in ('uk', 'what', 'synergy', 'tips', 'spoiler', 'stage', 'parent', 'chapter', 'book', 'branch', 'links', 'aka', 'icons', 'verify'):
            if k in c: out[k] = c[k]
        if c and out['role'] in ('content', 'addon') and 'features' not in c: warn(f"{m['id']}: features не задано явно (автовизначення неточне — див. GUIDE_HANDOFF §3)")
        for x in out['cls']:
            if x not in cls_ids: warn(f"{m['id']}: невідомий клас {x}")
        if out['role'] not in role_ids: warn(f"{m['id']}: невідома роль {out['role']}")
        for s in (out.get('stage') or []):
            if s not in st_ids: warn(f"{m['id']}: невідомий етап {s}")
        for sy in out.get('synergy', []):
            if sy.get('mod') not in ids: warn(f"{m['id']}: синергія з невідомим модом {sy.get('mod')}")
        if out.get('parent') and out['parent'] not in ids: warn(f"{m['id']}: невідомий батьківський мод {out['parent']}")
        mods.append(out)
    for k in cur:
        if k not in ids: warn(f'content: мода {k} немає в збірці ({cur[k]["_file"]})')
    # дорожня карта: вузли посилаються на моди, етапи й умови виконання (done_by)
    road = jload(os.path.join(CONTENT, 'roadmap.json'), {'lanes': [], 'nodes': [], 'edges': []})
    nid = {n['id'] for n in road.get('nodes', [])}
    idb = jload(os.path.join(RAW, 'icons_auto.json'), {}) or {}; items = {}
    qmap = {}; qinfo = {}
    for qf in sorted(glob.glob(os.path.join(DATA, 'quests', '*.json'))):
        fn = os.path.splitext(os.path.basename(qf))[0]
        if fn == 'index': continue
        for q in jload(qf, {}).get('quests', []): qmap[q['id']] = (fn, q.get('title', q['id']))
    for n in road.get('nodes', []):
        if n.get('stage') not in st_ids: warn(f"roadmap {n['id']}: невідомий етап {n.get('stage')}")
        for mm in n.get('mods', []):
            if mm not in ids: warn(f"roadmap {n['id']}: невідомий мод {mm}")
        db = n.get('done_by')
        if not isinstance(db, dict) or not any(db.get(k) for k in ('quests', 'advancements', 'items')):
            warn(f"roadmap {n['id']}: немає умов виконання done_by (quests / advancements / items)")
        else:
            for k in db:
                if k not in ('quests', 'advancements', 'items'): warn(f"roadmap {n['id']}: невідомий ключ done_by.{k}")
            for qid in (db.get('quests') or []):
                if qid not in qmap: warn(f"roadmap {n['id']}: невідомий квест done_by {qid}")
                else: qinfo[qid] = {'title': qmap[qid][1], 'chapter': qmap[qid][0]}
            for aid in (db.get('advancements') or []):
                ns = aid.split(':', 1)[0] if ':' in aid else ''
                if not ns or (ns != 'minecraft' and ns not in ids) or ':recipes/' in aid:
                    warn(f"roadmap {n['id']}: підозріле досягнення done_by {aid}")
            for iid in (db.get('items') or []):
                if iid not in idb: warn(f"roadmap {n['id']}: невідомий предмет done_by {iid}")
    if qinfo: road['quest_info'] = qinfo
    gids = {g['id'] for g in road.get('groups', [])}
    sord = {x['id']: i for i, x in enumerate(stages['stages'])}; nst = {n['id']: n.get('stage') for n in road.get('nodes', [])}
    for n in road.get('nodes', []):
        if n.get('group') and n['group'] not in gids: warn(f"roadmap {n['id']}: невідоме сузір'я {n['group']}")
        if n.get('lane') not in cls_ids: warn(f"roadmap {n['id']}: невідомий клас {n.get('lane')}")
    for g in road.get('groups', []):
        for mm in g.get('mods', []):
            if mm not in ids: warn(f"roadmap група {g['id']}: невідомий мод {mm}")
    for e in road.get('edges', []):
        for x in (e.get('from'), e.get('to')):
            if x not in nid: warn(f'roadmap: ребро на невідомий вузол {x}')
        if e.get('kind') not in ('req', 'syn', 'opt'): warn(f"roadmap: ребро {e.get('from')}→{e.get('to')}: невідомий тип {e.get('kind')}")
        if e.get('from') in nst and e.get('to') in nst and sord.get(nst[e['from']], 0) > sord.get(nst[e['to']], 0):
            warn(f"roadmap: ребро {e['from']}→{e['to']} іде вгору (з пізнішого етапу в ранній)")
    branches = []
    for f in sorted(glob.glob(os.path.join(CONTENT, 'branches', '*.json'))):
        b = jload(f); b.setdefault('id', os.path.splitext(os.path.basename(f))[0]); branches.append(b)
        for mm in b.get('mods', []):
            if mm not in ids: warn(f"branch {b['id']}: невідомий мод {mm}")
    # іконки предметів (tools/extract_icons.py → raw/icons_auto.json) → docs/data/items.json: лише ті, що згадано в content/
    for i in sorted(icon_ids(road, branches, cur)):
        if i in idb: items[i] = idb[i]
        else: warn(f'іконки {i} немає — запустіть tools/extract_icons.py')
    ks = build_keys.build(warn, '--check' not in sys.argv, ids)       # вкладка «Клавіші» → docs/data/keys.json
    stat = collections.Counter('curated' if not m['auto'] else ('auto:' + m['role']) for m in mods)
    meta = {'built': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), 'mods': len(mods), 'curated': stat['curated'],
            'content_mods': sum(1 for m in mods if m['role'] in ('content', 'addon'))}
    if '--check' not in sys.argv:
        jsave(os.path.join(DATA, 'mods.json'), mods, compact=True)
        jsave(os.path.join(DATA, 'classes.json'), classes)
        jsave(os.path.join(DATA, 'stages.json'), stages)
        jsave(os.path.join(DATA, 'roadmap.json'), road)
        jsave(os.path.join(DATA, 'branches.json'), branches)
        jsave(os.path.join(DATA, 'meta.json'), meta)
        jsave(os.path.join(DATA, 'items.json'), items)
    open(os.path.join(RAW, 'build_report.txt'), 'w', encoding='utf-8').write('\n'.join(rep) + '\n')
    print('модів', len(mods), dict(stat), '| етапів', len(st_ids), '| вузлів карти', len(nid), '| гілок', len(branches), '| іконок', len(items), '| з можливостями', sum(1 for m in mods if m['features']),
          f"| клавіш {ks['keys']} (конфліктів {ks['conflicts']}, можливих {ks['maybe']}, важливих непризначених {ks['imp_unbound']})", '| попереджень', len(rep))
    for r in rep[:15]: print('  ', r)
if __name__ == '__main__': main()
