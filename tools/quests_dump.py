# Огляд глави квестів для написання content/chapters/<глава>.json (огляди й дописи) — читає docs/data, нічого не змінює.
# Запуск з atm11_guide:  python3 -I tools/quests_dump.py <глава> [N]   — квести в порядку проходження: завдання, нагороди, перші N символів опису (типово 160)
#                        python3 -I tools/quests_dump.py --silent <глава>…  — «німі» квести (без опису): завдання, підзаголовок, попередники, нагороди
import os, sys, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import DATA

def load(fn): return json.load(open(os.path.join(DATA, 'quests', fn + '.json'), encoding='utf-8'))
plain = lambda s: re.sub(r'\s+', ' ', re.sub(r'&#[0-9a-fA-F]{6}|[&§][0-9a-fk-or]', '', (s or '').replace('\\n', ' '))).strip()
tasks = lambda q: '; '.join(f"{x.get('name') or ''} [{x.get('item') or x.get('entity') or x.get('dim') or x.get('structure') or x['type']}]" + (f"×{x['count']}" if x.get('count') else '') for x in q.get('tasks', []))
rewards = lambda q: ', '.join(f"{x.get('name') or x.get('item')}×{x.get('n')}" if x['t'] == 'item' else f"{x['t']}:{x.get('table') or x.get('n')}" for x in q.get('rw', []))

def order(qs):
    by = {q['id']: q for q in qs}; dep = {}
    def depth(i, seen=()):
        if i in dep: return dep[i]
        ds = [x for x in by.get(i, {}).get('deps', []) if x in by and x not in seen]
        dep[i] = 1 + max((depth(x, seen + (i,)) for x in ds), default=-1); return dep[i]
    for q in qs: depth(q['id'])
    return sorted(qs, key=lambda q: (dep[q['id']], q.get('y', 0), q.get('x', 0))), dep

def main():
    a = sys.argv[1:]
    if a[:1] == ['--silent']:
        for fn in a[1:]:
            d = load(fn); by = {q['id']: q for q in d['quests']}
            sil = [q for q in d['quests'] if not q.get('desc') and not q.get('arr') and not q.get('inv')]
            print(f'=== {fn}: {len(sil)}')
            for q in sil:
                print(f"{q['id']} «{q.get('title')}»{' (' + q['sub'] + ')' if q.get('sub') else ''} | T: {tasks(q)} | ← {', '.join(by[x].get('title', x) if x in by else x for x in q.get('deps', []))} | R: {rewards(q)}")
        return
    fn = a[0]; n = int(a[1]) if len(a) > 1 else 160
    qs, dep = order([q for q in load(fn)['quests'] if not q.get('arr') and not q.get('inv')])
    for q in qs:
        print(f"[{dep[q['id']]}] {q['id']} «{q.get('title')}»{' (' + q['sub'] + ')' if q.get('sub') else ''}{' OPT' if q.get('optional') else ''}\n   T: {tasks(q)}\n   R: {rewards(q)}\n   D: {plain(q.get('desc'))[:n]}")

if __name__ == '__main__': main()
