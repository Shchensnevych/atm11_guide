# Назви з перекладу (ua_work/review/effective.tsv) для тексту довідника. Запуск з atm11_guide:
#   python3 -I tools/uknames.py ns:id [ns:id …]   — українська назва предмета/блока/рідини (+ англійська)
#   python3 -I tools/uknames.py -k <regex>        — усі рядки, ключ яких збігається з regex (напр. '^conduit\.enderio\.')
import os, sys, csv, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import UA

def load():
    m = {}
    with open(os.path.join(UA, 'review', 'effective.tsv'), encoding='utf-8') as f:
        for row in csv.reader(f, delimiter='\t', quoting=csv.QUOTE_NONE):
            if len(row) >= 5: m[row[0]] = (row[3], row[4])
    return m

def main():
    a = sys.argv[1:]
    if not a: print(open(__file__, encoding='utf-8').read().split('\nimport')[0]); return
    m = load()
    if a[0] == '-k':
        rx = re.compile(a[1])
        for k, v in m.items():
            if rx.search(k): print(k, '|', v[0], '|', v[1])
        return
    for x in a:
        ns, path = x.split(':', 1)
        for pre in ('item', 'block', 'fluid', 'entity'):
            k = f'{pre}.{ns}.{path}'
            if k in m: print(x, '=', m[k][1], ' (', m[k][0], ')'); break
        else: print(x, '= ???')

if __name__ == '__main__': main()
