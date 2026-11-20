# Спільне для інструментів atm11_guide. Запуск з atm11_guide: python3 -I tools/<скрипт>.py
import os, sys, json, re, glob
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '_vendor'))          # tomli, json5 — чистий Python, без pip
import tomli, json5  # noqa: E402
G = os.path.dirname(HERE)                                   # atm11_guide

def _instance_dir():
    """Тека збірки (All the Mods 11 - ATM11): змінна ATM11_ROOT → atm11.json путівника («instance») → батьківська тека (старе розташування в теці збірки)."""
    if os.environ.get('ATM11_ROOT'): return os.environ['ATM11_ROOT']
    try:
        with open(os.path.join(G, 'atm11.json'), encoding='utf-8-sig') as f: inst = json.load(f).get('instance')
        if inst and os.path.isdir(inst): return inst
    except (OSError, ValueError): pass
    return os.path.dirname(G)

ROOT = _instance_dir()                                      # тека збірки, де minecraft/ і ua_work/ (путівник живе окремо — C:\Users\Yurec\OneDrive\Projects\atm11_guide)
if not os.path.isdir(os.path.join(os.environ.get('ATM11_MC') or os.path.join(ROOT, 'minecraft'), 'mods')):
    print(f'!! Тека збірки не знайдена: {ROOT} — вкажіть шлях у atm11_guide/atm11.json («instance») або змінною ATM11_ROOT', file=sys.stderr)
MC = os.environ.get('ATM11_MC') or os.path.join(ROOT, 'minecraft')
MODS = os.path.join(MC, 'mods')
QUESTS = os.path.join(MC, 'config', 'ftbquests', 'quests')
PACK = os.path.join(MC, 'resourcepacks', 'ATM11-UA')        # наш український ресурспак (джерело uk-назв)
UA = os.path.join(ROOT, 'ua_work')
RAW = os.path.join(G, 'raw')                                # автоматично витягнуте (не редагувати)
CONTENT = os.path.join(G, 'content')                        # ручний вміст (редагувати тут)
DOCS = os.path.join(G, 'docs')                              # сайт (GitHub Pages: гілка / тека docs)
DATA = os.path.join(DOCS, 'data')                           # згенеровані JSON для сайту

def jload(p, default=None):
    if not os.path.exists(p): return default
    with open(p, encoding='utf-8-sig') as f: return json.load(f)

def jsave(p, obj, compact=False):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8', newline='\n') as f:
        if compact: json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
        else: json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write('\n')

def strip_fmt(s):
    """Коди форматування FTB/Minecraft (&a, §l, &#RRGGBB) і зайві пробіли. \\& і \\§ — екранування FTB: буквальні «&» і «§»."""
    s = (s or '').replace('\\&', '\x00A').replace('\\§', '\x00S')
    s = re.sub(r'&#[0-9a-fA-F]{6}', '', s)
    s = re.sub(r'[&§][0-9a-fk-orzA-FK-ORZ]', '', s)                 # &z — «веселка» FTB Quests
    return re.sub(r'\s+', ' ', s.replace('\x00A', '&').replace('\x00S', '§')).strip()

def mc_version():
    """Версія Minecraft збірки з mmc-pack.json (Prism)."""
    d = jload(os.path.join(ROOT, 'mmc-pack.json'), {}) or {}
    return next((c.get('version') for c in d.get('components', []) if c.get('uid') == 'net.minecraft'), '26.1.2')

def CLIENT_JARS():
    """Кандидати клієнтського jar Minecraft (текстури ванільних предметів): змінна ATM11_CLIENT_JAR, Prism у %APPDATA%, тека сесії Claude (~/mnt/<версія>)."""
    v = mc_version(); name = f'minecraft-{v}-client.jar'
    return [p for p in (os.environ.get('ATM11_CLIENT_JAR'),
            os.path.join(os.environ.get('APPDATA', ''), 'PrismLauncher', 'libraries', 'com', 'mojang', 'minecraft', v, name) if os.environ.get('APPDATA') else None,
            os.path.join(os.path.expanduser('~'), 'mnt', v, name)) if p]

RX_ITEM_ID = re.compile(r'^[a-z0-9_.-]+:[a-z0-9_/.-]+$')
def quest_item_ids(data_dir=None):
    """K25: ID предметів, які показує вкладка «Квести» з іконкою — ОДНЕ правило для extract_icons.py (що малювати) і build_chapters.py
    (qicons.json): іконка квесту, іконки завдань, варіанти фільтрів, предмети нагород, рядки таблиць нагород (без відсутніх модів),
    іконки глав і квестів інших глав (ext). Раніше предмети нагород сюди не входили — 501 нагорода без іконки."""
    data_dir = data_dir or DATA
    ids = set(); ok = lambda x: isinstance(x, str) and RX_ITEM_ID.match(x)
    for f in glob.glob(os.path.join(data_dir, 'quests', '*.json')):
        d = jload(f, {}) or {}
        for q in d.get('quests', []):
            tasks = q.get('tasks', [])
            ids.update(x for x in [q.get('icon')] + [t.get('icon') for t in tasks] + [o.get('id') for t in tasks for o in t.get('opts') or []]
                       + [r.get('item') for r in q.get('rw', []) if r.get('t') == 'item'] + [r.get('icon') for r in q.get('rw', [])] if ok(x))
        ids.update(v['icon'] for v in (d.get('ext') or {}).values() if ok(v.get('icon')))
    for t in (jload(os.path.join(data_dir, 'reward_tables.json'), {}) or {}).values():
        ids.update(x['item'] for x in t.get('items', []) if ok(x.get('item')) and not x.get('miss'))
    ids.update(c['icon'] for c in (jload(os.path.join(data_dir, 'chapters.json'), {}) or {}).get('chapters', []) if ok(c.get('icon')))
    return ids
