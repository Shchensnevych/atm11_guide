# Запити до індексів сита (сесія S) — для написання й звірки вмісту G4–G6. Запуск з atm11_guide:
#   python3 -I tools/idxq.py check <ref> [<ref>…]   — розв'язати ref так само, як audit_fidelity (рівень, пояснення, моди)
#   python3 -I tools/idxq.py rec <RX> [N]          — рецепти, id яких збігається з RX (a — активність, тип, джерело, входи, виходи)
#   python3 -I tools/idxq.py uses <ns:id | #тег>    — рецепти, де предмет / тег на вході чи виході
#   python3 -I tools/idxq.py pair <мод> <мод>      — рецепти, що поєднують два моди (предмети, теги модів, тип машини)
#   python3 -I tools/idxq.py kjs <файл від kubejs/> — що робить скрипт (рецепти, remove, теги, події) і хибні умови isLoaded
#   python3 -I tools/idxq.py cfg <RX файлу> [<RX ключа>] — значення конфігів;  tag <ns:path> — склад тега;  lang <RX> — рядки en_us
import sys, json, re, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from refcheck import Refs
R = Refs(); a = sys.argv[1:]
if not a: print(open(__file__, encoding='utf-8').read().split('\nimport')[0]); sys.exit()
cmd = a[0]
def show(k, e): print(f"{k} a={e['a']} [{e['t']}] {e['src'][:40]} {e.get('p','')[:70]} in={e['in'][:6]} out={e['out'][:4]} {e.get('why','')[:80]}")
if cmd == 'rec':
    rx = re.compile(a[1]); n = 0
    for k, e in R.R.items():
        if rx.search(k): show(k, e); n += 1
        if n > int(a[2] if len(a) > 2 else 30): break
elif cmd == 'pair':
    x, y = a[1], a[2]
    for k, e in R.R.items():
        ms = {i.lstrip('#').split(':')[0] for i in e['in'] + e['out']} | {e['t'].split(':')[0]}
        if x in ms and y in ms: show(k, e)
elif cmd == 'uses':   # рецепти, де предмет / тег на вході або виході
    w = a[1]
    for k, e in R.R.items():
        if w in e['in'] or w in e['out']: show(k, e)
elif cmd == 'kjs':
    for kind, x in R.kat.get(a[1], []): print(kind, json.dumps(x, ensure_ascii=False)[:260])
    print('false:', R.kfalse.get(a[1]))
elif cmd == 'cfg':
    for f, d in R.C.items():
        if re.search(a[1], f):
            for k, v in d.items():
                if re.search(a[2] if len(a) > 2 else '.', k, re.I): print(f, k, '=', json.dumps(v, ensure_ascii=False)[:200])
elif cmd == 'tag':
    t = a[1]; print(R.T['item'].get(t), R.ktags.get('item:' + t))
elif cmd == 'lang':
    rx = re.compile(a[1])
    for k, v in R.lang().items():
        if rx.search(k): print(k, '=', v[:200])
elif cmd == 'check':
    for r in a[1:]: print(r, '→', R.check(r))
