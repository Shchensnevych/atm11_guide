# Глобальний пошук по путівнику (G7): docs/data/search.json — компактний індекс для поля пошуку в шапці сайту.
# Записи — масиви [вид, назва, підпис, адреса, додатковий текст для збігу]; вид: m — мод, n — віха, b — гілка, c — глава,
# q — квест, i — предмет, k — клавіша. Назви — українською з бази (mods / roadmap / branches / chapters / quests / items /
# keys), без власних текстів. Сайт вантажить файл ліниво (лише коли гравець почав пошук) і шукає тим самим стемером,
# що core/rag.js; працює без моста (GitHub Pages). Міст компаньйона має власний пошук (kb-text) — цей файл йому не потрібен.
import os, re, glob
from common import DATA, jload, jsave

KEY_SPECIAL = {'left.alt': 'Лівий Alt', 'right.alt': 'Правий Alt', 'left.control': 'Лівий Ctrl', 'right.control': 'Правий Ctrl',
               'left.shift': 'Лівий Shift', 'right.shift': 'Правий Shift', 'space': 'Пробіл', 'tab': 'Tab', 'enter': 'Enter',
               'escape': 'Esc', 'backspace': 'Backspace', 'delete': 'Del', 'insert': 'Ins', 'home': 'Home', 'end': 'End',
               'page.up': 'PgUp', 'page.down': 'PgDn', 'grave.accent': '`', 'caps.lock': 'CapsLock', 'up': '↑', 'down': '↓', 'left': '←', 'right': '→'}
KEY_MOUSE = {'left': 'ЛКМ', 'right': 'ПКМ', 'middle': 'СКМ', '4': 'Миша 4', '5': 'Миша 5'}


def key_pretty(bind, mod=''):
    """Клавіша як на сайті (core/keys-model.js pretty, спрощено): key.keyboard.left.alt → «Лівий Alt»."""
    m = re.match(r'^key\.(keyboard|mouse)\.(.+)$', bind or '')
    if not m or bind == 'key.keyboard.unknown': return ''
    k = m.group(2)
    if m.group(1) == 'mouse': s = KEY_MOUSE.get(k, f'Миша {k}')
    elif k.startswith('keypad.'): s = 'Num ' + k[7:].replace('.', ' ')
    elif re.match(r'^f\d+$', k): s = k.upper()
    else: s = KEY_SPECIAL.get(k, k.upper() if len(k) == 1 else k.replace('.', ' '))
    pre = {'CONTROL': 'Ctrl+', 'SHIFT': 'Shift+', 'ALT': 'Alt+'}.get((mod or '').upper(), '')
    return pre + s


def short(t, n=140):
    t = re.sub(r'\s+', ' ', re.sub(r'&[0-9a-fk-or]|&#[0-9A-Fa-f]{6}', '', str(t or ''))).strip()
    return t[:n]


def build(warn, write, mods, road, branches, items, stages, classes):
    out = []
    mod_name = {m['id']: m['name'] for m in mods}
    st_title = {s['id']: s['title'] for s in stages}
    cls_title = {c['id']: c['title'] for c in classes}
    # моди: назва, класи; додатково — id, опис українською, назви ключових можливостей
    for m in mods:
        sub = ' · '.join(cls_title.get(c, c) for c in (m.get('cls') or [])[:2])
        extra = ' '.join([m['id'], short(m.get('uk'), 160), ' '.join(short(w, 60) for w in (m.get('what') or [])[:3] if isinstance(w, str))])
        out.append(['m', m['name'], sub, f"#/mod/{m['id']}", extra])
    # віхи дорожньої карти
    for n in road.get('nodes', []):
        sub = st_title.get(n.get('stage'), n.get('stage', ''))
        extra = ' '.join([short(n.get('text'), 160), ' '.join(mod_name.get(x, x) for x in n.get('mods', []))])
        out.append(['n', n['title'], sub, f"#/roadmap?node={n['id']}", extra])
    # гілки
    for b in branches:
        extra = ' '.join([short(b.get('summary'), 160), ' '.join(mod_name.get(x, x) for x in b.get('mods', []))])
        out.append(['b', b['title'], 'гілка', f"#/branch/{b['id']}", extra])
    # глави й квести (без службових: arr / inv — як isService у core/quests-model.js)
    ch = jload(os.path.join(DATA, 'chapters.json'), {'chapters': []})
    for c in ch.get('chapters', []):
        out.append(['c', c['title'], 'глава квестів', f"#/chapter/{c['file']}", ' '.join(mod_name.get(x, x) for x in c.get('mods', []))])
        qd = jload(os.path.join(DATA, 'quests', f"{c['file']}.json"), None)
        if not qd: continue
        for q in qd.get('quests', []):
            t = short(q.get('title'), 90)
            if not t or q.get('arr') or q.get('inv'): continue
            tasks = ' '.join(short(x.get('name'), 40) for x in (q.get('tasks') or [])[:3] if isinstance(x, dict) and x.get('name'))
            out.append(['q', t, '', f"#/chapter/{c['file']}/{q['id']}", tasks])   # підпис (назву глави) сайт бере з chapters.json за адресою
    # предмети (іконки путівника: uk / en з перекладу гри); адреса — сторінка мода простору імен, якщо такий мод є
    for iid, it in items.items():
        if not isinstance(it, dict) or not it.get('uk'): continue
        ns = iid.split(':')[0]
        href = f'#/mod/{ns}' if ns in mod_name else ''
        if not href: continue
        out.append(['i', it['uk'], mod_name.get(ns, ns), href, ' '.join([it.get('en', ''), iid])])
    # клавіші (назва дії з перекладу гри, поточна прив'язка з options.txt)
    kd = jload(os.path.join(DATA, 'keys.json'), {'keys': []})
    for k in kd.get('keys', []):
        name = short(k.get('name'), 90)
        if not name: continue
        combo = key_pretty(k.get('bind'), k.get('m'))
        sub = ' · '.join(x for x in [combo or 'не призначено', mod_name.get(k.get('mod') or k.get('ns'), k.get('mod') or k.get('ns') or '')] if x)
        out.append(['k', name, sub, f"#/keys?q={name}", ' '.join([k.get('en', ''), k.get('id', '')])])
    kinds = {}
    for e in out: kinds[e[0]] = kinds.get(e[0], 0) + 1
    if write:
        jsave(os.path.join(DATA, 'search.json'), {'v': 1, 'kinds': kinds, 'rows': out}, compact=True)
    return {'rows': len(out), 'kinds': kinds}
