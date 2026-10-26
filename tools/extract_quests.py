# Квести FTB → docs/data/chapters.json (групи, глави, міжглавні зв'язки, моди глави) і docs/data/quests/<глава>.json (квести).
# Тексти — українські (lang/uk_ua; немає — en). Назви предметів завдань — з ua_work/review/effective.tsv (те, що бачить гравець).
import os, sys, glob, csv, collections, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import QUESTS, UA, DATA, RAW, json5, jsave, jload, strip_fmt
csv.field_size_limit(10 ** 9)

def l5(p):
    if not os.path.exists(p): return {}
    t = open(p, encoding='utf-8-sig').read()
    try:   # швидкий шлях: ключі без лапок і кінцеві коми → JSON (json5 на чистому Python у ~20 разів повільніший)
        t1 = re.sub(r'(^|[{,])(\s*)([A-Za-z0-9_]+)\s*:', lambda m: m.group(1) + m.group(2) + '"' + m.group(3) + '":', t, flags=re.M)
        return json.loads(re.sub(r',(\s*[}\]])', r'\1', t1))
    except Exception:
        return json5.loads(t)

def names_map():
    """item/block/entity key → (en, uk) з effective.tsv (екрановані \\n \\t)."""
    p = os.path.join(UA, 'review', 'effective.tsv'); M = {}
    if not os.path.exists(p): return M
    for r in csv.reader(open(p, encoding='utf-8'), delimiter='\t'):
        if len(r) > 4 and r[0].split('.')[0] in ('item', 'block', 'entity', 'fluid'): M[r[0]] = (r[3], r[4] or r[3])
    return M

def item_name(iid, M):
    if not isinstance(iid, str) or ':' not in iid: return None
    ns, path = iid.split(':', 1)
    for pre in ('item', 'block', 'entity', 'fluid'):
        k = f'{pre}.{ns}.{path.replace("/", ".")}'
        if k in M: return M[k][1]
    return None

def text(L, Len, key):
    v = L.get(key, Len.get(key))
    if isinstance(v, list): v = '\n'.join(v)
    return v

def main():
    M = names_map()
    have = {m['id'] for m in (jload(os.path.join(RAW, 'mods_auto.json'), []) or [])}   # моди, що є в збірці
    groups_order = [g['id'] for g in l5(os.path.join(QUESTS, 'chapter_groups.json5')).get('chapter_groups', [])]
    uk, en = os.path.join(QUESTS, 'lang', 'uk_ua'), os.path.join(QUESTS, 'lang', 'en_us')
    G_uk, G_en = l5(os.path.join(uk, 'chapter_group.json5')), l5(os.path.join(en, 'chapter_group.json5'))
    C_uk, C_en = l5(os.path.join(uk, 'chapter.json5')), l5(os.path.join(en, 'chapter.json5'))
    chapters, qowner = [], {}
    raw = {}
    for f in sorted(glob.glob(os.path.join(QUESTS, 'chapters', '*.json5'))):
        c = l5(f); raw[c['filename']] = c
        for q in c.get('quests', []): qowner[q['id']] = c['filename']
    os.makedirs(os.path.join(DATA, 'quests'), exist_ok=True)
    cross = collections.Counter()
    for fn, c in raw.items():
        Lu, Le = l5(os.path.join(uk, 'chapters', fn + '.json5')), l5(os.path.join(en, 'chapters', fn + '.json5'))
        cid = c['id']; quests = []; modc = collections.Counter(); missc = collections.Counter()
        for q in c.get('quests', []):
            qid = q['id']; tasks = []; qmiss = set()
            for t in q.get('tasks', []):
                iid = (t.get('item') or {}).get('id') if isinstance(t.get('item'), dict) else t.get('item')
                ent = t.get('entity'); dim = t.get('dimension')
                obj = iid or ent or dim
                if isinstance(obj, str) and ':' in obj: modc[obj.split(':')[0]] += 1
                mi = ((t.get('item') or {}).get('components') or {}).get('ftbquests:missing_item') if isinstance(t.get('item'), dict) else None
                ns = re.sub(r'^\d+x\s*', '', mi).split(':')[0] if isinstance(mi, str) and ':' in mi else None
                if ns and ns not in have: missc[ns] += 1; qmiss.add(ns)   # заглушка: предмета мода немає в збірці
                tasks.append({k: v for k, v in {'type': t.get('type'), 'item': iid, 'count': (t.get('item') or {}).get('count') if isinstance(t.get('item'), dict) else t.get('count'),
                              'entity': ent, 'dim': dim, 'name': strip_fmt(text(Lu, Le, f'task.{t["id"]}.title') or '') or item_name(iid or ent, M)}.items() if v not in (None, '', 1)})
            title = strip_fmt(text(Lu, Le, f'quest.{qid}.title') or '') or (tasks[0].get('name') if tasks else '') or ''
            deps = q.get('dependencies', [])
            for d in deps:
                if qowner.get(d) and qowner[d] != fn: cross[(qowner[d], fn)] += 1
            quests.append({k: v for k, v in {
                'id': qid, 'x': q.get('x'), 'y': q.get('y'), 'title': title,
                'sub': strip_fmt(text(Lu, Le, f'quest.{qid}.quest_subtitle') or ''),
                'desc': text(Lu, Le, f'quest.{qid}.quest_desc') or '',   # з кодами &x — сайт їх розфарбовує
                'deps': deps, 'tasks': tasks, 'shape': q.get('shape'), 'size': q.get('size'),
                'optional': q.get('optional'), 'icon': (q.get('icon') or {}).get('id') if isinstance(q.get('icon'), dict) else q.get('icon'),
                'rewards': len(q.get('rewards', [])),
                'missing': sorted(qmiss),   # квест-заглушка: потрібні предмети модів, яких немає в збірці
            }.items() if v not in (None, '', [], 0, False)})
        jsave(os.path.join(DATA, 'quests', fn + '.json'), {'chapter': fn, 'quests': quests}, compact=True)
        ic = c.get('icon'); ic = ic.get('id') if isinstance(ic, dict) else ic
        chapters.append({k: v for k, v in {
            'id': cid, 'file': fn, 'group': c.get('group', ''), 'order': c.get('order_index', 0),
            'title': strip_fmt(text(C_uk, C_en, f'chapter.{cid}.title') or fn),
            'sub': strip_fmt(text(C_uk, C_en, f'chapter.{cid}.chapter_subtitle') or ''),
            'icon': ic, 'quests': len(quests), 'hidden': c.get('always_invisible'),
            'mods': [m for m, _ in modc.most_common(8) if m not in ('minecraft', 'allthetweaks')],
            'missing': [m for m, _ in missc.most_common(4)],   # моди, яких немає в збірці (квести-заглушки ftbquests:missing_item)
        }.items() if v not in (None, '', [], False)})
    groups = [{'id': g, 'title': strip_fmt(G_uk.get(f'chapter_group.{g}.title') or G_en.get(f'chapter_group.{g}.title') or g), 'order': i}
              for i, g in enumerate(groups_order)]
    links = [{'from': a, 'to': b, 'n': n} for (a, b), n in sorted(cross.items())]
    jsave(os.path.join(DATA, 'chapters.json'), {'groups': groups, 'chapters': sorted(chapters, key=lambda c: (groups_order.index(c.get('group')) if c.get('group') in groups_order else 99, c.get('order', 0))), 'links': links})
    print('груп', len(groups), '| глав', len(chapters), '| квестів', sum(c['quests'] for c in chapters), '| міжглавних зв\'язків', len(links),
          '| квестів без назви', sum(1 for fn in raw for q in jload_q(fn) if not q.get('title')))
def jload_q(fn):
    import json
    return json.load(open(os.path.join(DATA, 'quests', fn + '.json'), encoding='utf-8'))['quests']
if __name__ == '__main__': main()
