# Клавіші гри й модів: minecraft/options.txt (поточні прив'язки) + назви з ua_work/review/effective.tsv → raw/keys_auto.json + звіт raw/keys_report.txt
# Запуск з atm11_guide: python3 -I tools/extract_keys.py   (після зміни клавіш у грі — перезапустити, далі build_data.py)
import os, sys, json, re, glob, zipfile, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MC, MODS, UA, RAW, jsave

MOD_NAMES = {'CONTROL': 'Ctrl', 'CONTROL_OR_COMMAND': 'Ctrl', 'SHIFT': 'Shift', 'ALT': 'Alt'}
SPECIAL = {'left.shift': 'Лівий Shift', 'right.shift': 'Правий Shift', 'left.control': 'Лівий Ctrl', 'right.control': 'Правий Ctrl',
           'left.alt': 'Лівий Alt', 'right.alt': 'Правий Alt', 'grave.accent': '`', 'left.bracket': '[', 'right.bracket': ']',
           'backslash': '\\', 'semicolon': ';', 'apostrophe': "'", 'comma': ',', 'period': '.', 'slash': '/', 'minus': '-', 'equal': '=',
           'space': 'Пробіл', 'tab': 'Tab', 'escape': 'Esc', 'enter': 'Enter', 'backspace': 'Backspace', 'delete': 'Delete', 'insert': 'Insert',
           'home': 'Home', 'end': 'End', 'page.up': 'PgUp', 'page.down': 'PgDn', 'up': '↑', 'down': '↓', 'left': '←', 'right': '→',
           'caps.lock': 'Caps Lock', 'left.win': 'Win', 'menu': 'Menu', 'print.screen': 'PrtSc', 'pause': 'Pause', 'scroll.lock': 'Scroll Lock'}
MOUSE = {'left': 'ЛКМ', 'right': 'ПКМ', 'middle': 'СКМ'}

def pretty(b):
    """key.keyboard.left.shift → «Лівий Shift»; key.mouse.4 → «Миша 4»; keypad → «Num …»."""
    if b == 'key.keyboard.unknown': return ''
    m = re.match(r'key\.(keyboard|mouse)\.(.+)$', b)
    if not m: return b
    kind, k = m.groups()
    if kind == 'mouse': return MOUSE.get(k, f'Миша {k}')
    if k.startswith('keypad.'): return 'Num ' + k[7:].replace('.', ' ')
    if re.fullmatch(r'f\d+', k): return k.upper()
    return SPECIAL.get(k, k.upper() if len(k) == 1 else k.replace('.', ' ').title())

def names():
    """key → (ns, en, uk) з нашого перекладу; плюс категорії key.categories.*"""
    out = {}
    p = os.path.join(UA, 'review', 'effective.tsv')
    for line in open(p, encoding='utf-8'):
        c = line.rstrip('\n').split('\t')
        if len(c) >= 5 and (c[0].startswith('key') or '.key' in c[0] or 'keybind' in c[0].lower()): out[c[0]] = (c[1], c[3], c[4])
    return out

def jar_owner(keys):
    """Ключі, яких немає в effective.tsv: шукаємо в en_us.json jar-ів (простір імен = тека assets/<ns>)."""
    found = {}
    for j in sorted(glob.glob(os.path.join(MODS, '*.jar'))):
        try: z = zipfile.ZipFile(j)
        except Exception: continue
        for n in z.namelist():
            m = re.match(r'assets/([^/]+)/lang/en_us\.json$', n)
            if not m: continue
            try: d = json.loads(z.read(n).decode('utf-8', 'replace'))
            except Exception: continue
            for k in keys:
                if k in d and k not in found: found[k] = (m[1], d[k], '')
    return found

def main():
    opt = os.path.join(MC, 'options.txt'); nm = names(); rows = []
    for line in open(opt, encoding='utf-8'):
        if not line.startswith('key_'): continue
        tk, _, val = line.rstrip('\n')[4:].partition(':')
        parts = val.split(':'); b = parts[0]; mod = parts[1] if len(parts) > 1 else ''
        rows.append({'id': tk, 'bind': b, 'mod': mod})
    miss = [r['id'] for r in rows if r['id'] not in nm]
    extra = jar_owner(set(miss)) if miss else {}
    for r in rows:
        ns, en, uk = nm.get(r['id']) or extra.get(r['id']) or ('', '', '')
        r.update(ns=ns or 'minecraft', en=en, uk=uk, key=pretty(r['bind']),
                 combo=((MOD_NAMES.get(r['mod'], r['mod']) + '+') if r['mod'] and r['mod'] != 'NONE' else '') + pretty(r['bind']))
    jsave(os.path.join(RAW, 'keys_auto.json'), rows)
    # звіт: конфлікти (однакова клавіша + модифікатор) і непризначені
    by = collections.defaultdict(list)
    for r in rows:
        if r['key']: by[(r['bind'], r['mod'])].append(r)
    conf = {k: v for k, v in by.items() if len(v) > 1}
    unb = [r for r in rows if not r['key']]
    rep = [f'клавіш {len(rows)} | призначено {len(rows) - len(unb)} | не призначено {len(unb)} | однакових сполучень {len(conf)} (у {sum(len(v) for v in conf.values())} діях)', '', '== Однакові сполучення (конфлікт лише якщо діють в одному контексті: гра / GUI) ==']
    for (b, m), v in sorted(conf.items(), key=lambda kv: -len(kv[1])):
        rep.append(f"{v[0]['combo']}: " + ' | '.join(f"{x['ns']}: {x['uk'] or x['en'] or x['id']}" for x in v))
    rep += ['', '== Не призначено =='] + [f"{r['ns']}: {r['uk'] or r['en'] or r['id']}  [{r['id']}]" for r in sorted(unb, key=lambda r: (r['ns'], r['id']))]
    open(os.path.join(RAW, 'keys_report.txt'), 'w', encoding='utf-8').write('\n'.join(rep) + '\n')
    print(rep[0]); print('без назви:', sum(1 for r in rows if not (r['uk'] or r['en'])))
if __name__ == '__main__': main()
