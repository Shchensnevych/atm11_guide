# K19 (§4 Б25): зачарування збірки → docs/data/enchantments.json. Джерело — лише знімок гри raw/game_enchantments.json
# (tools/extract_game_names.py ← companion_enchantments.json клієнтського скрипта компаньйона): назва мовою гри, опис, на що
# накладається (тег гри — склад у tag_sets — або перелік), основні предмети, несумісні, теги зачарування, поправки коду модів
# (гра приймає / забороняє всупереч тегам — перевірено грою по всіх предметах). Нічого не вигадуємо й не рахуємо з jar:
# знімка немає — база не змінюється. max_level — базовий (з даних зачарування; моди можуть рахувати фактичну межу кодом).
import os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RAW, DATA, jload, jsave

SRC = os.path.join(RAW, 'game_enchantments.json')
OUT = os.path.join(DATA, 'enchantments.json')
FLAGS = {'treasure': 'minecraft:treasure', 'curse': 'minecraft:curse', 'table': 'minecraft:in_enchanting_table', 'tradeable': 'minecraft:tradeable'}

def build(warn, write=True, snap=None, names=None):
    snap = snap if snap is not None else jload(SRC, None)
    if not isinstance(snap, dict) or not snap.get('enchantments'):
        warn('зачарування: немає raw/game_enchantments.json — зайдіть у світ з компаньйоном і запустіть tools/extract_game_names.py (docs/data/enchantments.json не змінено)')
        return {'enchantments': 0, 'code': ''}
    tag_sets = snap.get('tag_sets') or {}
    ids = {e['id'] for e in snap['enchantments']}
    known_items = set(((names if names is not None else jload(os.path.join(DATA, 'names.json'), {})) or {}).get('items') or {})
    cc = snap.get('code_check') or {}
    adds, removes = {}, {}
    if cc.get('state') == 'done':
        for a, b in cc.get('adds') or []: adds.setdefault(a, []).append(b)
        for a, b in cc.get('removes') or []: removes.setdefault(a, []).append(b)
    out, unknown = [], set()
    for e in snap['enchantments']:
        r = {k: e[k] for k in ('id', 'name', 'desc', 'max_level', 'weight', 'anvil_cost', 'slots', 'supported', 'primary', 'exclusive', 'exclusive_tag') if k in e}
        for s in (e.get('supported'), e.get('primary')):
            if isinstance(s, dict) and s.get('tag') and s['tag'] not in tag_sets: warn(f"зачарування {e['id']}: тег {s['tag']} без складу в знімку")
        for x in e.get('exclusive') or []:
            if x not in ids: warn(f"зачарування {e['id']}: несумісне {x} — такого зачарування в знімку немає")
        tags = e.get('tags') or []
        for f, t in FLAGS.items():
            if t in tags: r[f] = True
        r['tags'] = tags
        if adds.get(e['id']): r['code_adds'] = sorted(adds[e['id']])
        if removes.get(e['id']): r['code_removes'] = sorted(removes[e['id']])
        out.append(r)
    for v in tag_sets.values(): unknown.update(x for x in v if known_items and x not in known_items)
    if unknown: warn(f'зачарування: предметів у тегах, яких немає в names.json, — {len(unknown)} (напр. {", ".join(sorted(unknown)[:3])})')
    code = cc.get('state') or 'pending'
    if code != 'done': warn('зачарування: перевірка кодом модів ще не завершена в грі — «на що накладається» лише за тегами (поправок коду немає)')
    data = {'fingerprint': snap.get('fingerprint', ''), 'code_check': {k: cc.get(k) for k in ('state', 'checks', 'adds_n', 'removes_n') if k in cc},
            'enchantments': out, 'tag_sets': tag_sets}
    if write: jsave(OUT, data, compact=True)
    return {'enchantments': len(out), 'code': code}

if __name__ == '__main__':
    rep = []
    r = build(rep.append)
    print(f"зачарувань {r['enchantments']}, перевірка кодом: {r['code']}")
    for x in rep: print('!!', x)
