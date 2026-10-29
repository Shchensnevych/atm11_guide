# Спільне для інструментів atm11_guide. Запуск з atm11_guide: python3 -I tools/<скрипт>.py
import os, sys, json, re
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
