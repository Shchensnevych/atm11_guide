# Блоки, що трапляються в генерації світу (C6b, для ATM11-Companion: ознака «моє» — сховище з блока, якого світ сам не ставить).
# Джерела — дані збірки, без списків під окремі моди:
#   шаблони структур  data/<ns>/structure(s)/**/*.nbt  у jar модів, клієнтському jar Minecraft і kubejs/data
#                     (палітра — рядки NBT «Name», а також «final_state» блоків-пазлів — на їхньому місці лишається блок);
#   JSON генерації    data/<ns>/worldgen/**/*.json  (фічі, процесори структур — поля «Name»).
# Блоки, які ставить код (ванільні шахти, фортеці, данжі-«кімнати монстрів»), сюди не потрапляють — ванільні скрині й
# бочки все одно є в шаблонах (села, кораблі, бастіони…), а здобич нерозкритих сховищ компаньйон не читає взагалі.
# Без клієнтського jar Minecraft список неповний (немає ванільних структур) → файл не пишеться, попередження «!!» (common.CLIENT_JARS, GUIDE §4).
# Входить у «Оновити все» (start.bat → 4, кнопка «📦 Оновити дані путівника» компаньйона): з кешем — секунди.
# Результат: raw/worldgen_blocks_auto.json → build_data.py → docs/data/worldgen_blocks.json. Кеш за jar — raw/tmp/worldgen_cache.json
# (повторний запуск бере лише змінені jar; довгий перший прогін можна переривати — продовжить з кешу).
# Використання: python3 -I tools/extract_worldgen.py [--budget СЕКУНД]
import os, sys, re, json, gzip, zipfile, glob, time, datetime
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # -I не додає теку скрипта
from common import MODS, MC, RAW, jsave, jload, CLIENT_JARS

NBT_RX = re.compile(r'^data/[a-z0-9_.-]+/structures?/.+\.nbt$')
JSON_RX = re.compile(r'^data/[a-z0-9_.-]+/worldgen/.+\.json$')
ID_RX = re.compile(r'^[a-z0-9_.-]+:[a-z0-9_/.-]+$')
JSON_NAME_RX = re.compile(r'"Name"\s*:\s*"([a-z0-9_.-]+:[a-z0-9_/.-]+)"')
# TAG_String (8) з іменем «Name» / «final_state»: 08 00 04 'Name' | 08 00 0B 'final_state', далі u16 довжина + UTF-8
NBT_KEYS = (b'\x08\x00\x04Name', b'\x08\x00\x0bfinal_state')
CACHE = os.path.join(RAW, 'tmp', 'worldgen_cache.json')

def nbt_names(raw):
    try:
        data = gzip.decompress(raw)
    except Exception:
        data = raw
    out = set()
    for key in NBT_KEYS:
        i = data.find(key)
        while i >= 0:
            j = i + len(key)
            if j + 2 <= len(data):
                n = int.from_bytes(data[j:j + 2], 'big')
                s = data[j + 2:j + 2 + n].decode('utf-8', 'ignore').split('[', 1)[0].split('{', 1)[0].strip()
                if ID_RX.match(s): out.add(s)
            i = data.find(key, j)
    return out

def scan_zip(path):
    blocks, nt, nj = set(), 0, 0
    with zipfile.ZipFile(path) as z:
        for n in z.namelist():
            if NBT_RX.match(n):
                nt += 1
                try: blocks |= nbt_names(z.read(n))
                except Exception: pass
            elif JSON_RX.match(n):
                nj += 1
                try: blocks.update(JSON_NAME_RX.findall(z.read(n).decode('utf-8', 'ignore')))
                except Exception: pass
    return blocks, nt, nj

def scan_dir(root):
    blocks, nt, nj = set(), 0, 0
    for dp, _, fs in os.walk(root):
        for f in fs:
            p = os.path.join(dp, f); rel = 'data/' + os.path.relpath(p, root).replace('\\', '/')
            if NBT_RX.match(rel):
                nt += 1
                try: blocks |= nbt_names(open(p, 'rb').read())
                except Exception: pass
            elif JSON_RX.match(rel):
                nj += 1
                try: blocks.update(JSON_NAME_RX.findall(open(p, encoding='utf-8', errors='ignore').read()))
                except Exception: pass
    return blocks, nt, nj

def main():
    budget = float(sys.argv[sys.argv.index('--budget') + 1]) if '--budget' in sys.argv else 1e9
    t0 = time.time()
    vanilla = next((p for p in CLIENT_JARS() if os.path.isfile(p)), None)
    jars = sorted(glob.glob(os.path.join(MODS, '*.jar'))) + ([vanilla] if vanilla else [])
    cache = jload(CACHE, {}) or {}
    done = 0; pending = 0
    for j in jars:
        try: st = os.stat(j)
        except OSError: continue
        key = os.path.basename(j); sig = f'{st.st_size}:{int(st.st_mtime)}'
        if cache.get(key, {}).get('sig') == sig: continue
        if time.time() - t0 > budget: pending += 1; continue
        try: b, nt, nj = scan_zip(j)
        except zipfile.BadZipFile: b, nt, nj = set(), 0, 0
        cache[key] = {'sig': sig, 'blocks': sorted(b), 'nbt': nt, 'json': nj}
        done += 1
    live = {os.path.basename(j) for j in jars}
    cache = {k: v for k, v in cache.items() if k in live}
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    jsave(CACHE, cache, compact=True)
    if pending:
        print(f'проскановано jar {done}, лишилось {pending} — запусти ще раз (кеш raw/tmp/worldgen_cache.json)'); return
    kb, knt, knj = scan_dir(os.path.join(MC, 'kubejs', 'data')) if os.path.isdir(os.path.join(MC, 'kubejs', 'data')) else (set(), 0, 0)
    blocks = set(kb)
    for v in cache.values(): blocks.update(v['blocks'])
    blocks -= {'minecraft:air', 'minecraft:cave_air', 'minecraft:void_air', 'minecraft:structure_void', 'minecraft:jigsaw'}
    nt = sum(v['nbt'] for v in cache.values()) + knt
    nj = sum(v['json'] for v in cache.values()) + knj
    if not vanilla:
        print('!! Клієнтський jar Minecraft не знайдено (common.CLIENT_JARS) — без ванільних структур список хибний, файл не записано.')
        print(f'   (модів {len(jars)}, шаблонів {nt}, json {nj}, блоків {len(blocks)})'); return   # не помилка ланцюжка «Оновити все»
    out = {'generated': datetime.datetime.now().strftime('%Y-%m-%d %H:%M'), 'jars': len(jars), 'templates': nt, 'worldgen_json': nj,
           'vanilla': os.path.basename(vanilla), 'count': len(blocks), 'blocks': sorted(blocks)}
    jsave(os.path.join(RAW, 'worldgen_blocks_auto.json'), out, compact=True)
    print(f'jar {len(jars)} (нових {done}) | шаблонів структур {nt} | json генерації {nj} | блоків {len(blocks)} | {time.time() - t0:.0f} с')

if __name__ == '__main__': main()
