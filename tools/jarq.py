# Запити до jar модів збірки (звірка фактів для довідника). Запуск з atm11_guide:
#   python3 -I tools/jarq.py items <ns> [RX]     — предмети мода (assets/<ns>/items)
#   python3 -I tools/jarq.py lang <ns> [RX]      — рядки en_us.json (ключ або текст за RX): підказки, описи, назви
#   python3 -I tools/jarq.py recipes <ns> [RX]   — рецепти з data/<ns>/recipe(s) (--full — повний JSON)
#   python3 -I tools/jarq.py files <ns> [RX]     — файли в jar, шлях яких містить <ns>
#   python3 -I tools/jarq.py uses <id> [<id>…]   — інгредієнти рецептів, що дають цей предмет (KubeJS НЕ враховано — див. minecraft/kubejs/server_scripts)
import os, sys, zipfile, glob, re, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MODS

def jars():
    for j in sorted(glob.glob(os.path.join(MODS, '*.jar'))):
        try: yield j, zipfile.ZipFile(j)
        except Exception: continue

def uses(want):
    found = {}
    for _, z in jars():
        for n in z.namelist():
            if not re.match(r'data/[^/]+/recipes?/.+\.json$', n): continue
            try: d = json.loads(z.read(n))
            except Exception: continue
            r = d.get('result') or d.get('output') or {}
            rid = (r.get('id') or r.get('item')) if isinstance(r, dict) else r
            if isinstance(rid, str) and rid in want:
                ing = set(re.findall(r'"(#?[a-z0-9_.-]+:[a-z0-9_/.-]+)"', json.dumps(d.get('key') or d.get('ingredients') or d.get('inputs') or d))) - {rid, d.get('type')}
                found.setdefault(rid, []).append(f"[{str(d.get('type', '')).split(':')[-1]}] " + ', '.join(sorted(ing)))
    for w in want:
        for x in found.get(w, ['— рецепта в jar немає (KubeJS / особливий тип)'])[:2]: print(w, '→', x)

def main():
    a = sys.argv[1:]
    if not a: print(__doc__ or open(__file__, encoding='utf-8').read().split('\nimport')[0]); return
    cmd = a[0]
    if cmd == 'uses': return uses(a[1:])
    ns = a[1]; rx = re.compile(a[2] if len(a) > 2 and not a[2].startswith('--') else '.'); full = '--full' in a
    for j, z in jars():
        names = z.namelist()
        if cmd == 'files':
            for n in names:
                if ns in n and rx.search(n): print(os.path.basename(j), n)
        elif cmd == 'lang':
            p = f'assets/{ns}/lang/en_us.json'
            if p in names:
                d = json.loads(z.read(p).decode('utf-8', 'replace'))
                for k, v in d.items():
                    if rx.search(k) or rx.search(str(v)): print(k, '=', v)
        elif cmd == 'items':
            for n in names:
                m = re.match(rf'assets/{re.escape(ns)}/items/(.+)\.json$', n)
                if m and rx.search(m[1]): print(m[1])
        elif cmd == 'recipes':
            for n in names:
                m = re.match(rf'data/{re.escape(ns)}/recipes?/(.+)\.json$', n)
                if m and rx.search(m[1]):
                    s = z.read(n).decode('utf-8', 'replace'); print('##', m[1], s if full else re.sub(r'\s+', ' ', s)[:400])
if __name__ == '__main__': main()
