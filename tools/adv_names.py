# Українські назви досягнень для умов виконання віх (done_by.advancements) — щоб сайт показував «Кам'яна доба», а не minecraft:story/mine_stone.
# Назва: display.title з data/<ns>/advancement(s)/<шлях>.json у jar мода (ключ перекладу або рядок) → uk/en з ua_work/review/effective.tsv;
# ванільні — ключ advancements.<шлях через крапки>.title. Кеш — raw/adv_names.json (jar перечитуються лише для нових ID).
# Досягнення без display (службові, приховані в грі) → {'hidden': True}.
# Використання: from adv_names import adv_names; adv_names(['minecraft:story/mine_stone', …]) → {id: {'uk': …, 'en': …}}
import os, sys, glob, json, zipfile, csv
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MODS, UA, RAW

def _tsv():
    m = {}
    with open(os.path.join(UA, 'review', 'effective.tsv'), encoding='utf-8') as f:
        for row in csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
            if len(row) >= 5: m[row[0]] = (row[3], row[4])
    return m

def _title_keys(ids):
    """id → ключ перекладу (або {'text': …}) з jar модів."""
    want = {}
    for i in ids:
        ns, path = i.split(':', 1)
        for d in ('advancement', 'advancements'): want[f'data/{ns}/{d}/{path}.json'] = i
    out = {}
    for j in sorted(glob.glob(os.path.join(MODS, '*.jar'))):
        try: z = zipfile.ZipFile(j)
        except Exception: continue
        for n in set(z.namelist()) & want.keys():
            try: t = json.loads(z.read(n)).get('display', {}).get('title')
            except Exception: continue
            if isinstance(t, dict): out[want[n]] = t.get('translate') or {'text': t.get('text', '')}
            elif isinstance(t, str): out[want[n]] = {'text': t}
            else: out[want[n]] = {'hidden': True}                           # без display — службове (напр. відкриття сторінок книги)
    return out

def adv_names(ids):
    cp = os.path.join(RAW, 'adv_names.json')
    try: cache = json.load(open(cp, encoding='utf-8'))
    except Exception: cache = {}
    new = [i for i in ids if i not in cache]
    if new:
        tsv = _tsv(); keys = _title_keys(new)
        for i in new:
            ns, path = i.split(':', 1)
            k = keys.get(i) or (f"advancements.{path.replace('/', '.')}.title" if ns == 'minecraft' else None)
            if isinstance(k, dict) and k.get('hidden'): cache[i] = {'hidden': True}
            elif isinstance(k, dict): cache[i] = {'uk': k['text'], 'en': k['text']}
            elif k and k in tsv: cache[i] = {'en': tsv[k][0], 'uk': tsv[k][1] or tsv[k][0]}
            else: cache[i] = {}
        json.dump(cache, open(cp, 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    return {i: cache[i] for i in ids if cache.get(i)}

if __name__ == '__main__':
    for k, v in adv_names(sys.argv[1:]).items(): print(k, '=', v)
