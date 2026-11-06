# Витягує з усіх jar у minecraft/mods метадані модів → raw/mods_auto.json і логотипи → docs/img/mods/<id>.png (64 px).
# Нічого не перекладає й не класифікує: класи, етапи, описи українською — у content/mods/*.json (вручну).
import os, sys, glob, zipfile, json, re, io, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # -I не додає теку скрипта
from common import MODS, RAW, DOCS, PACK, tomli, jsave
SKIP_DEPS = {'minecraft', 'neoforge', 'java', 'forge'}
try:
    from PIL import Image
except Exception:
    Image = None

def lang_counts(z, ns):
    n = f'assets/{ns}/lang/en_us.json'
    if n not in z.namelist(): return {}
    try: d = json.loads(z.read(n).decode('utf-8-sig'))
    except Exception: return {}
    c = collections.Counter()
    for k in d:
        p = k.split('.')[0]
        if p in ('item', 'block', 'entity', 'effect', 'enchantment', 'biome', 'fluid', 'advancements') and len(k.split('.')) == 3: c[p] += 1
    return dict(c)

def world(z, names, ns, en):
    """Що мод додає у світ (для піктограм features): виміри з назвами, структури, біоми, руди, істоти (яйця виклику), боси (тег c:bosses)."""
    def ids(folder):
        rx = re.compile(rf'data/{re.escape(ns)}/{folder}/(.+)\.json$')
        return sorted({m[1] for n in names for m in [rx.match(n)] if m})
    dims = []
    for d in ids('dimension'):
        leaf = d.split('/')[-1]
        key = next((k for k in en if 'dimension' in k and (k.endswith('.' + leaf) or k.endswith('.' + leaf + '.name'))), None)
        dims.append({'id': f'{ns}:{d}', 'key': key, 'name': en.get(key) if key else leaf.replace('_', ' ').title()})
    bosses = []
    for n in names:
        if re.match(r'data/(c|forge|neoforge)/tags/entity_types?/bosses\.json$', n):
            try: bosses += [v if isinstance(v, str) else v.get('id', '') for v in json.loads(z.read(n).decode('utf-8-sig')).get('values', [])]
            except Exception: pass
    return {'dims': dims, 'structures': len(ids('worldgen/structure')), 'biomes': len(ids('worldgen/biome')),
            'ores': sum(1 for x in ids('worldgen/placed_feature') if re.search(r'(^|[/_])ores?([/_]|$)|_ore', x)),
            'eggs': len({m[1] for n in names for m in [re.match(rf'assets/{re.escape(ns)}/(?:items|models/item)/(.*spawn_egg.*)\.json$', n)] if m}),   # яйця виклику (файли предметів) — надійна ознака істот
            'entities': sum(1 for k in en if k.startswith(f'entity.{ns}.') and k.count('.') == 2),
            'bosses': sorted({b for b in bosses if b.startswith(ns + ':')})}

COMMON_NS = {'minecraft', 'c', 'forge', 'neoforge', 'curios', 'accessories', 'ftbquests'}

def merge_world(a, b):
    return {k: (a[k] + b[k]) if isinstance(a[k], (int, list)) else a[k] for k in a}

def lang_en(z, ns):
    n = f'assets/{ns}/lang/en_us.json'
    if n not in z.namelist(): return {}
    try: return json.loads(z.read(n).decode('utf-8-sig'))
    except Exception: return {}

def uk_count(ns):
    p = os.path.join(PACK, 'assets', ns, 'lang', 'uk_ua.json')
    if not os.path.exists(p): return 0
    try: return len(json.load(open(p, encoding='utf-8')))
    except Exception: return 0

LOGO_FALLBACK = (r'^logo\.png$', r'^[\w.-]*logo[\w.-]*\.png$', r'^[\w.-]*icon\.png$', r'^assets/{ns}/(icon|logo)\.png$')   # G7: без logoFile у mods.toml

def logo_path(z, path, mid):
    """logoFile з mods.toml; G7: інакше — логотип у корені jar (logo.png, *_logo.png, jei-icon.png) або assets/<мод>/icon.png."""
    names = z.namelist()
    if path and path in names: return path
    for rx in LOGO_FALLBACK:
        r = re.compile(rx.replace('{ns}', re.escape(mid)), re.I)
        hit = sorted(n for n in names if r.match(n))
        if hit: return hit[0]
    return None

def logo(z, path, mid):
    path = logo_path(z, path, mid)
    if not path or not Image: return None
    try:
        im = Image.open(io.BytesIO(z.read(path))).convert('RGBA')
        im.thumbnail((64, 64), Image.NEAREST if max(im.size) <= 64 else Image.LANCZOS)
        out = os.path.join(DOCS, 'img', 'mods', f'{mid}.png'); os.makedirs(os.path.dirname(out), exist_ok=True)
        im.save(out, optimize=True); return f'img/mods/{mid}.png'
    except Exception:
        return None

def main():
    mods, nolang = [], []
    for jar in sorted(glob.glob(os.path.join(MODS, '*.jar'))):
        z = zipfile.ZipFile(jar); names = set(z.namelist())
        tn = 'META-INF/neoforge.mods.toml' if 'META-INF/neoforge.mods.toml' in names else None
        if not tn:
            mods.append({'id': os.path.basename(jar).split('-')[0].lower(), 'name': os.path.basename(jar)[:-4], 'jar': os.path.basename(jar), 'kind': 'library-jar'}); continue
        t = tomli.loads(z.read(tn).decode('utf-8', 'replace'))
        mf = z.read('META-INF/MANIFEST.MF').decode('utf-8', 'replace') if 'META-INF/MANIFEST.MF' in names else ''
        iv = re.search(r'Implementation-Version:\s*(\S+)', mf)
        books = sorted({n.split('/')[3] for n in names if re.match(r'(assets|data)/[^/]+/patchouli_books/[^/]+/', n)})
        gm = any('/guides/' in n or n.startswith('assets/') and '/ae2guide/' in n for n in names)
        mod_ids = {m.get('modId') for m in t.get('mods', [])}
        extra_ns = sorted({n.split('/')[1] for n in names if n.startswith('data/') and n.count('/') > 2} - mod_ids - COMMON_NS)   # дані під чужим ns (напр. t_and_t → towns_and_towers)
        for i, m in enumerate(t.get('mods', [])):
            mid = m.get('modId'); ver = str(m.get('version', ''))
            if '${' in ver: ver = iv.group(1) if iv else ''
            dd = t.get('dependencies', {})
            deps = dd.get(mid, []) if isinstance(dd, dict) else dd   # деякі моди пишуть [[dependencies]] без ключа modId
            if isinstance(deps, dict): deps = [deps]
            req = sorted({d.get('modId') for d in deps if d.get('type', 'required' if d.get('mandatory', True) else 'optional') == 'required'} - SKIP_DEPS - {None})
            opt = sorted({d.get('modId') for d in deps if d.get('type') == 'optional'} - SKIP_DEPS - {None})
            lc = lang_counts(z, mid)
            wld = world(z, names, mid, lang_en(z, mid))
            if i == 0:
                for ns in extra_ns: wld = merge_world(wld, world(z, names, ns, lang_en(z, ns)))
            mods.append({
                'id': mid, 'name': m.get('displayName', mid), 'version': ver, 'jar': os.path.basename(jar),
                'primary': i == 0, 'authors': str(m.get('authors', '') or t.get('authors', '')).strip(),
                'url': m.get('displayURL', '') or t.get('displayURL', ''), 'desc_en': (m.get('description') or '').strip(),
                'deps': req, 'deps_opt': opt, 'counts': lc, 'uk_keys': uk_count(mid),
                'books': books, 'guideme': gm,
                'logo': logo(z, m.get('logoFile') or t.get('logoFile'), mid),
                'world': wld,
            })
    by = collections.Counter(m['id'] for m in mods)
    jsave(os.path.join(RAW, 'mods_auto.json'), sorted(mods, key=lambda m: m['id']))
    w = [m for m in mods if m.get('world')]
    print('виміри:', sum(len(m['world']['dims']) for m in w), '| структури у', sum(1 for m in w if m['world']['structures']), 'модах | біоми у',
          sum(1 for m in w if m['world']['biomes']), '| руди у', sum(1 for m in w if m['world']['ores']), '| істоти у', sum(1 for m in w if m['world']['eggs'] >= 2),
          '| боси (c:bosses):', sum(len(m['world']['bosses']) for m in w))
    print('модів', len(mods), '| jar', len(glob.glob(os.path.join(MODS, '*.jar'))), '| з логотипом', sum(1 for m in mods if m.get('logo')),
          '| дублікати id', [k for k, v in by.items() if v > 1][:5])
if __name__ == '__main__': main()
