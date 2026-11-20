# Іконки предметів і блоків для сайту: ID з content/ (поля icons / icon) → docs/img/items/<ns>/<path>.png (64 px) + raw/icons_auto.json.
# Предмет (item/generated, шари layer0..n) — піксельна копія з відтінками; блок (елементи моделі) — ізометричний кубик (верх, північ, захід),
# рослини-хрестики й «особливі» моделі (скрині тощо) — плоска текстура (kind: approx). Анімовані текстури — перший кадр.
# Запуск з atm11_guide:  python3 -I tools/extract_icons.py [ns:id ...]      — без аргументів: усі ID з content/
#                        python3 -I tools/extract_icons.py --quests [--redo RX] — іконки квестів (docs/data/quests/*.json), відсутні → raw/icons_missing_quests.txt; --redo — перемалювати ID за regex
#                        python3 -I tools/extract_icons.py --find <regex>   — пошук ID предметів у збірці (напр. --find "occultism:.*chalk")
# Предмети з власними «завантажувачами» моделей (Sophisticated*, Geckolib…) — ручні заміни в content/icons_override.json:
#   {"id": {"item": "інший:id"} | {"cube": {"top": tex, "side": tex, "front"?: tex}} | {"models": [моделі з elements]} | {"texture": tex}, "tints"?: [ARGB]}
#   | {"boxes": {"texture": tex, "cubes": [{"from": [x,y,z], "to": [x,y,z], "uv": [u, v]}]}}   — коробки з текстури істоти (box UV у пікселях)
#   | {"bucket": "#RRGGBB"} — відро рідини (KubeJS-рідини без моделі; колір — зі startup-скрипта)
#   "fit": true (для models / boxes) — вписати модель у всю іконку (дрібні труби, черепи)
# Моделі Geckolib (.geo.json) малюються автоматично (усі кубики, без поворотів, вписано в 16³).
# Джерела (перше знайдене перемагає): minecraft/kubejs/assets → jar модів → клієнтський jar Minecraft (common.CLIENT_JARS).
import os, sys, glob, zipfile, json, io, re, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import MODS, MC, UA, RAW, DOCS, CONTENT, CLIENT_JARS, jload, jsave, quest_item_ids
from PIL import Image, ImageDraw

OUT = os.path.join(DOCS, 'img', 'items'); S = 128; FINAL = 64          # малюємо 128 px → зменшуємо до 64 (згладжені краї)
GRASS, FOLIAGE = (124, 189, 107), (89, 174, 48)
FLAT_PARENTS = ('item/generated', 'item/handheld', 'builtin/generated', 'item/handheld_rod', 'item/handheld_mace')

class Src:
    """Індекс ресурсів assets/*/(items|models|textures)/ з тек і jar."""
    def __init__(self): self.idx = {}
    def _want(self, n): return n.startswith('assets/') and ('/models/' in n or '/textures/' in n or '/items/' in n or n.endswith('.geo.json'))
    def add_zip(self, p):
        try: z = zipfile.ZipFile(p)
        except Exception: return
        for n in z.namelist():
            if self._want(n) and n not in self.idx: self.idx[n] = z
    def add_dir(self, root):
        for d, _, fs in os.walk(os.path.join(root, 'assets')):
            for f in fs:
                full = os.path.join(d, f); rel = os.path.relpath(full, root).replace(os.sep, '/')
                if self._want(rel) and rel not in self.idx: self.idx[rel] = full
    def read(self, p):
        s = self.idx.get(p)
        if s is None: return None
        try: return s.read(p) if isinstance(s, zipfile.ZipFile) else open(s, 'rb').read()
        except Exception: return None
    def json(self, p):
        b = self.read(p)
        if b is None: return None
        try: return json.loads(b.decode('utf-8-sig'))
        except Exception: return None

def rl(s):
    s = str(s); ns, _, p = s.partition(':')
    return (ns, p) if p else ('minecraft', ns)

def norm(s): ns, p = rl(s); return f'{ns}:{p}'

def color(v):
    if isinstance(v, int): return ((v >> 16) & 255, (v >> 8) & 255, v & 255)
    if isinstance(v, list) and len(v) >= 3: return tuple(int(x * 255) if isinstance(x, float) else int(x) for x in v[:3])
    return None

def tint_of(t):
    """Відтінок шару з визначення предмета (items/*.json → tints[])."""
    if not isinstance(t, dict): return None
    k = str(t.get('type', '')).replace('minecraft:', '')
    if k == 'grass': return GRASS
    if k == 'foliage': return FOLIAGE
    return color(t.get('value', t.get('color', t.get('default'))))       # constant: value; модові (productivetrees:tree…): color; решта — default

def pick(m):
    """Вузол визначення предмета → (id моделі, tints). Беремо найпростішу гілку: fallback / перший випадок."""
    if not isinstance(m, dict): return None
    k = str(m.get('type', '')).replace('minecraft:', '')
    if k == 'model': return m.get('model'), m.get('tints') or []
    if k == 'special': return m.get('base'), []
    for key in ('fallback', 'on_false', 'on_true', 'model'):
        r = pick(m.get(key)) if isinstance(m.get(key), dict) else None
        if r and r[0]: return r
    for key in ('models', 'cases', 'entries'):
        for c in m.get(key) or []:
            r = pick(c.get('model', c) if isinstance(c, dict) and 'model' in c and isinstance(c['model'], dict) else c)
            if r and r[0]: return r
    return None

def model(src, ref):
    """Ланцюжок батьків моделі → (textures, elements, chain)."""
    tex, els, chain = {}, None, []
    for _ in range(20):
        if not ref: break
        ns, p = rl(ref); chain.append(f'{p}' if ns == 'minecraft' else f'{ns}:{p}')
        d = src.json(f'assets/{ns}/models/{p}.json')
        if d is None: break
        for k, v in (d.get('textures') or {}).items(): tex.setdefault(k, v)
        if els is None and d.get('elements'): els = d['elements']
        ref = d.get('parent')
    return tex, els, chain

def tex_ref(tex, name):
    t = tex.get(name.lstrip('#'))
    for _ in range(10):
        if not isinstance(t, str) or not t.startswith('#'): break
        t = tex.get(t[1:])
    return t if isinstance(t, str) else None

def texture(src, ref, crop=True):
    if not ref: return None
    ns, p = rl(ref); b = src.read(f'assets/{ns}/textures/{p}.png')
    if b is None: return None
    try: im = Image.open(io.BytesIO(b)).convert('RGBA')
    except Exception: return None
    if crop and im.height > im.width: im = im.crop((0, 0, im.width, im.width))      # анімація — перший кадр
    return im

def tinted(im, c):
    if not c: return im
    r, g, b, a = im.split()
    r = r.point(lambda x: x * c[0] // 255); g = g.point(lambda x: x * c[1] // 255); b = b.point(lambda x: x * c[2] // 255)
    return Image.merge('RGBA', (r, g, b, a))

def flat(layers):
    base = None
    for im in layers:
        if im is None: continue
        im = im.resize((FINAL, FINAL), Image.NEAREST if im.width <= FINAL else Image.LANCZOS)
        base = im if base is None else Image.alpha_composite(base, im)
    return base

def proj(x, y, z):            # світ 0..16 → екран S×S; модель повернута на 180°, видно верх, північ (ліворуч) і захід (праворуч)
    x, z = 16 - x, 16 - z
    return (S / 2 + (x - z) * S / 32, (x + z) * S / 64 + (16 - y) * S / 32)

FACE = {   # P(a, b) у світі для грані елемента [x0,y0,z0]–[x1,y1,z1]; a — уздовж u текстури, b — уздовж v
    'up':    lambda f, t, a, b: (f[0] + a * (t[0] - f[0]), t[1], f[2] + b * (t[2] - f[2])),
    'north': lambda f, t, a, b: (t[0] - a * (t[0] - f[0]), t[1] - b * (t[1] - f[1]), f[2]),
    'west':  lambda f, t, a, b: (f[0], t[1] - b * (t[1] - f[1]), f[2] + a * (t[2] - f[2])),
}
DEF_UV = {'up': lambda f, t: [f[0], f[2], t[0], t[2]], 'north': lambda f, t: [16 - t[0], 16 - t[1], 16 - f[0], 16 - f[1]],
          'west': lambda f, t: [f[2], 16 - t[1], t[2], 16 - f[1]]}
SHADE = {'up': 1.0, 'north': 0.8, 'west': 0.62}

def iso(src, parts, tints):
    """parts: [(textures, elements)] — одна модель або кілька (ручна заміна з icons_override.json)."""
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); dr = ImageDraw.Draw(im, 'RGBA'); drawn = 0
    boxes = [(tex, e) for tex, els in parts for e in (els or []) if isinstance(e, dict) and not (e.get('rotation') or {}).get('angle')]
    # спершу дальні (більші x, z, нижчі y — глядач з боку −x, −z, згори)
    boxes.sort(key=lambda p: (p[1]['from'][0] + p[1]['to'][0]) + (p[1]['from'][2] + p[1]['to'][2]) - (p[1]['from'][1] + p[1]['to'][1]), reverse=True)
    for tex, e in boxes:
        f, t = e['from'], e['to']
        for side in ('north', 'west', 'up'):
            fc = (e.get('faces') or {}).get(side)
            if not fc: continue
            img = texture(src, tex_ref(tex, fc.get('texture', '')), crop=not fc.get('px'))
            if img is None: continue
            if 'tintindex' in fc:
                name = tex_ref(tex, fc.get('texture', '')) or ''; ti = fc.get('tintindex') or 0
                img = tinted(img, tints[ti] if ti < len(tints) and tints[ti] else (FOLIAGE if 'leaves' in name or 'vine' in name else GRASS if re.search(r'grass|fern|lily', name) else None))
            u0, v0, u1, v1 = fc.get('uv') or DEF_UV[side](f, t); k = 1 if fc.get('px') else img.width / 16; sh = SHADE[side]   # px — uv у пікселях текстури
            if u1 == u0 or v1 == v0: continue
            px = img.load()
            for j in range(int(min(v0, v1) * k), int(max(v0, v1) * k)):
                for i in range(int(min(u0, u1) * k), int(max(u0, u1) * k)):
                    r, g, b, a = px[min(i, img.width - 1), min(j, img.height - 1)]
                    if a == 0: continue
                    q = []
                    for di, dj in ((0, 0), (1, 0), (1, 1), (0, 1)):
                        aa = ((i + di) / k - u0) / (u1 - u0); bb = ((j + dj) / k - v0) / (v1 - v0)
                        q.append(proj(*FACE[side](f, t, aa, bb)))
                    dr.polygon(q, fill=(int(r * sh), int(g * sh), int(b * sh), a)); drawn += 1
    return im.resize((FINAL, FINAL), Image.LANCZOS) if drawn else None

def box_faces(u, v, w, hh, d):
    """Розгортка «коробки» (entity / Bedrock box UV) → пікселі граней up, north, west."""
    return {'up': [u + d, v, u + d + w, v + d], 'north': [u + d, v + d, u + d + w, v + d + hh], 'west': [u + d + w, v + d, u + 2 * d + w, v + d + hh]}

def boxes_elements(cubes):
    """[{from, to, uv:[u, v]} | {from, to, faces:{side:[u0, v0, u1, v1]}}] (пікселі) → елементи моделі для iso()."""
    out = []
    for c in cubes:
        f, t = c['from'], c['to']; w, hh, d = (abs(t[i] - f[i]) for i in range(3))
        fc = c.get('faces') or box_faces(c['uv'][0], c['uv'][1], w * c.get('k', 1), hh * c.get('k', 1), d * c.get('k', 1))
        out.append({'from': f, 'to': t, 'faces': {sd: {'texture': '#t', 'uv': fc[sd], 'px': True} for sd in ('up', 'north', 'west') if sd in fc}})
    return out

def geckolib(src, ns, name):
    """Geckolib (.geo.json, формат Bedrock) → елементи, вписані в куб 16³; текстура — textures/**/<name>.png."""
    geo = next((n for n in src.idx if n.startswith(f'assets/{ns}/geckolib/') and n.endswith(f'/{name}.geo.json')), None)
    texs = [n for n in src.idx if n.startswith(f'assets/{ns}/textures/') and n.endswith(f'/{name}.png') and '/gui/' not in n and '/colored/' not in n]
    if not geo or not texs: return None
    d = src.json(geo); g = (d or {}).get('minecraft:geometry', [{}])[0]; cubes = []
    for b in g.get('bones', []):
        for c in b.get('cubes', []):
            (x, y, z), (w, hh, dd) = c['origin'], c['size']
            fr, to = [-(x + w), y, z], [-x, y + hh, z + dd]                  # Bedrock → Java: дзеркало по x
            uv = c.get('uv')
            if isinstance(uv, dict):                                         # у дзеркалі схід ↔ захід
                m = {'up': uv.get('up'), 'north': uv.get('north'), 'west': uv.get('east')}
                faces = {sd: [f['uv'][0], f['uv'][1], f['uv'][0] + f['uv_size'][0], f['uv'][1] + f['uv_size'][1]] for sd, f in m.items() if f}
                cubes.append({'from': fr, 'to': to, 'faces': faces})
            elif isinstance(uv, list): cubes.append({'from': fr, 'to': to, 'uv': uv})
    if not cubes: return None
    lo = [min(c['from'][i] for c in cubes) for i in range(3)]; hi = [max(c['to'][i] for c in cubes) for i in range(3)]
    sc = 15 / max(hi[i] - lo[i] for i in range(3)); off = [(16 - (hi[i] - lo[i]) * sc) / 2 for i in range(3)]; off[1] = 0
    for c in cubes:
        if 'uv' in c: c['faces'] = box_faces(c['uv'][0], c['uv'][1], *(c['to'][i] - c['from'][i] for i in range(3)))
        c['from'] = [(c['from'][i] - lo[i]) * sc + off[i] for i in range(3)]; c['to'] = [(c['to'][i] - lo[i]) * sc + off[i] for i in range(3)]
    tex = texs[0].split('/textures/', 1)[1][:-4]
    return [({'t': f'{ns}:{tex}'}, boxes_elements(cubes))]

def fit16(parts):
    """Вписати всі елементи в куб 16³ (дрібні моделі — труби, черепи — на всю іконку)."""
    els = [e for _, es in parts for e in es or []]
    if not els: return parts
    lo = [min(e['from'][i] for e in els) for i in range(3)]; hi = [max(e['to'][i] for e in els) for i in range(3)]
    sc = 15 / max(max(hi[i] - lo[i] for i in range(3)), 1e-6); off = [(16 - (hi[i] - lo[i]) * sc) / 2 for i in range(3)]; off[1] = 0
    out = []
    for tex, es in parts:
        ne = []
        for e in es or []:
            q = dict(e); f, t = e['from'], e['to']; faces = {}
            for sd, fc in (e.get('faces') or {}).items():                     # явний uv, щоб масштаб не зсунув текстуру
                fc = dict(fc)
                if 'uv' not in fc and sd in DEF_UV: fc['uv'] = DEF_UV[sd](f, t)
                faces[sd] = fc
            q['faces'] = faces; q['from'] = [(f[i] - lo[i]) * sc + off[i] for i in range(3)]; q['to'] = [(t[i] - lo[i]) * sc + off[i] for i in range(3)]
            ne.append(q)
        out.append((tex, ne))
    return out

CUBE = [{'from': [0, 0, 0], 'to': [16, 16, 16], 'faces': {'up': {'texture': '#top'}, 'north': {'texture': '#front'}, 'west': {'texture': '#side'}}}]

def ftbtex(src, iid):
    """Текстура з квестів FTB (ftbtex:<ns>/<шлях>): перший кадр анімації, неквадратна — вписана в квадрат."""
    ns, p = iid.split(':', 1)[1].split('/', 1)
    b = src.read(f'assets/{ns}/{p}.png')
    if b is None: return None, 'немає текстури'
    try: im = Image.open(io.BytesIO(b)).convert('RGBA')
    except Exception: return None, 'не читається'
    if im.height > im.width and im.height % im.width == 0: im = im.crop((0, 0, im.width, im.width))
    side = max(im.size); sq = Image.new('RGBA', (side, side)); sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return sq.resize((FINAL, FINAL), Image.NEAREST if side <= FINAL else Image.LANCZOS), 'item'

def avg_color(im):
    px = [p for p in im.getdata() if p[3] > 0]
    return tuple(sum(p[i] for p in px) // len(px) for i in range(3)) if px else (150, 150, 160)

def bucket(src, fill):
    """Відро з рідиною: ванільне відро + «рідина» (пікселі, якими відро з водою відрізняється від порожнього) кольору fill."""
    b0, b1 = texture(src, 'minecraft:item/bucket'), texture(src, 'minecraft:item/water_bucket')
    if b0 is None or b1 is None: return None
    out = b0.copy(); px0, px1, po = b0.load(), b1.load(), out.load()
    for y in range(b0.height):
        for x in range(b0.width):
            if px0[x, y] != px1[x, y] and px1[x, y][3]:
                l = sum(px1[x, y][:3]) / (3 * 255) + 0.35                       # світлота з водяного відра → відтінок рідини
                po[x, y] = tuple(min(255, int(c * l)) for c in fill) + (255,)
    return flat([out])

def fluid_fill(src, d):
    """Колір рідини для neoforge:fluid_container: текстура рідини мода (…_still / fluid_source), інакше сірий."""
    fl = str(((d or {}).get('model') or {}).get('fluid') or '')
    ns, name = rl(fl) if fl else ('', '')
    base = re.sub(r'_(source|still|fluid)$', '', name)
    for cand in (f'{ns}:block/{base}_still', f'{ns}:block/fluid/{base}_still', f'{ns}:fluid/{base}_still', f'{ns}:block/{name}', f'{ns}:block/fluid_source'):
        im = texture(src, cand) if ns else None
        if im is not None: return avg_color(im)
    return (150, 150, 160)

def render(src, iid, ov=None):
    if iid.startswith('ftbtex:'): return ftbtex(src, iid)
    o = (ov or {}).get(iid)
    if o and o.get('bucket'):                                  # ручна заміна: відро рідини KubeJS з кольором зі скрипта
        im = bucket(src, color(int(o['bucket'].lstrip('#'), 16)))
        return (im, 'item') if im else (None, 'немає текстур відра')
    if o:                                                     # ручна заміна: content/icons_override.json
        tints = [color(t) for t in o.get('tints', [])]
        if o.get('item'): return render(src, o['item'])
        if o.get('cube'):
            c = o['cube']; im = iso(src, [({'top': c['top'], 'side': c['side'], 'front': c.get('front', c['side'])}, CUBE)], tints)
            return (im, 'block') if im else (None, 'заміна: немає текстур куба')
        if o.get('models'):
            parts = [model(src, m)[:2] for m in o['models']]
            im = iso(src, fit16(parts) if o.get('fit') else parts, tints)
            return (im, 'block') if im else (None, 'заміна: моделі без елементів')
        if o.get('boxes'):                                    # коробки з текстури істоти (скрині, черепи): uv — пікселі розгортки
            parts = [({'t': o['boxes']['texture']}, boxes_elements(o['boxes']['cubes']))]
            im = iso(src, fit16(parts) if o.get('fit') else parts, tints)
            return (im, 'block') if im else (None, 'заміна: немає текстури коробок')
        if o.get('texture'):
            im = flat([tinted(texture(src, o['texture']), tints[0] if tints else None)])
            return (im, 'item') if im else (None, 'заміна: немає текстури')
    ns, p = rl(iid); d = src.json(f'assets/{ns}/items/{p}.json'); tints = []
    mref = None
    if d is not None:
        r = pick(d.get('model')); mref, raw = (r or (None, []))
        tints = [tint_of(t) for t in raw]
    if not mref:
        for cand in (f'{ns}:item/{p}', f'{ns}:block/{p}'):
            if src.json(f'assets/{rl(cand)[0]}/models/{rl(cand)[1]}.json') is not None: mref = cand; break
    if d is not None and 'geckolib' in json.dumps(d.get('model')):              # моделі Geckolib (машини Oritech, Theurgy…)
        parts = geckolib(src, ns, p)
        if parts:
            im = iso(src, parts, [])
            if im: return im, 'block'
    if d is not None and str((d.get('model') or {}).get('type', '')).endswith('fluid_container'):   # відра рідин модів (NeoForge)
        im = bucket(src, fluid_fill(src, d))
        if im: return im, 'item'
    if not mref:                                                # предмет без моделі у файлах — пробуємо однойменну текстуру
        for cand in (f'{ns}:item/{p}', f'{ns}:block/{p}'):
            im = texture(src, cand)
            if im is not None: return flat([im]), 'approx'
        return None, 'немає моделі'
    tex, els, chain = model(src, mref)
    if any(c.endswith(fp) for c in chain for fp in FLAT_PARENTS) or (not els and 'layer0' in tex):
        layers = []
        for i in range(8):
            if f'layer{i}' not in tex: break
            layers.append(tinted(texture(src, tex_ref(tex, f'layer{i}')), tints[i] if i < len(tints) else None))
        im = flat(layers)
        if im is None:
            im = next((flat([t]) for c in (f'{ns}:item/{p}', f'{ns}:block/{p}') if (t := texture(src, c)) is not None), None)
        return (im, 'item') if im else (None, 'немає текстури шару')
    if els:
        im = iso(src, [(tex, els)], tints)
        if im: return im, 'block'
    for k in ('cross', 'plant', 'all', 'side', 'texture', 'particle'):        # хрестики, «особливі» моделі — плоска текстура
        im = texture(src, tex_ref(tex, k))
        if im: return flat([im]), 'approx'
    return None, 'не вдалося намалювати (' + (chain[-1] if chain else '?') + ')'

def names():
    out = {}; p = os.path.join(UA, 'review', 'effective.tsv')
    if not os.path.exists(p): return out
    for line in open(p, encoding='utf-8'):
        c = line.rstrip('\n').split('\t')
        if len(c) >= 5 and (c[0].startswith('item.') or c[0].startswith('block.')):
            kind, ns, *rest = c[0].split('.')
            if len(rest) == 1: out.setdefault(f'{ns}:{rest[0]}', {'uk': c[4], 'en': c[3]})
    return out

def wanted():
    ids = set()
    def walk(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in ('icons', 'icon') and isinstance(v, (list, str)):
                    for x in ([v] if isinstance(v, str) else v):
                        if isinstance(x, str) and re.match(r'^[a-z0-9_.-]+:[a-z0-9_/.-]+$', x): ids.add(x)
                elif k == 'done_by' and isinstance(v, dict):
                    for x in (v.get('items') or []):
                        if isinstance(x, str) and re.match(r'^[a-z0-9_.-]+:[a-z0-9_/.-]+$', x): ids.add(x)
                else: walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
    for f in glob.glob(os.path.join(CONTENT, '**', '*.json'), recursive=True): walk(jload(f, {}))
    for f in glob.glob(os.path.join(DOCS, 'data', 'progress', '*.json')):
        ids.update(x for x in (((jload(f, {}) or {}).get('items') or {}).get('names') or {}) if re.match(r'^[a-z0-9_.-]+:[a-z0-9_/.-]+$', str(x)))
    return ids

def quest_ids():
    """ID іконок вкладки «Квести» (після extract_quests.py) — одне правило з build_chapters.py: common.quest_item_ids (K25: з предметами нагород)."""
    return quest_item_ids(os.path.join(DOCS, 'data'))

def sources():
    src = Src(); src.add_dir(os.path.join(MC, 'kubejs'))
    for j in sorted(glob.glob(os.path.join(MODS, '*.jar'))): src.add_zip(j)
    cj = next((p for p in CLIENT_JARS() if os.path.exists(p)), None)
    if cj: src.add_zip(cj)
    else: print('!! клієнтський jar Minecraft не знайдено — ванільних іконок не буде (див. common.CLIENT_JARS)')
    return src

def main():
    args = sys.argv[1:]; src = sources()
    if args[:1] == ['--find']:
        rx = re.compile(args[1] if len(args) > 1 else '.'); nm = names()
        for n in sorted(src.idx):
            m = re.match(r'assets/([^/]+)/items/(.+)\.json$', n)
            if m and rx.search(f'{m[1]}:{m[2]}'): print(f'{m[1]}:{m[2]}', '—', nm.get(f'{m[1]}:{m[2]}', {}).get('uk', ''))
        return
    qmode = args[:1] == ['--quests']
    ids = sorted(quest_ids() if qmode else (set(norm(a) for a in args) or wanted())); nm = names()
    db = jload(os.path.join(RAW, 'icons_auto.json'), {}) or {}; miss = []
    ov = {k: v for k, v in (jload(os.path.join(CONTENT, 'icons_override.json'), {}) or {}).items() if not k.startswith('_')}
    mpath = os.path.join(RAW, 'icons_missing_quests.txt' if qmode else 'icons_missing.txt')
    todo = ids
    if qmode and '--force' not in args:   # квести: лише нові ID (наявні PNG і відомі відсутні — пропускаємо); частинами по ~140 с
        known = {l.split('\t')[0]: l for l in open(mpath, encoding='utf-8').read().splitlines()} if os.path.exists(mpath) else {}
        miss = [known[i] for i in ids if i in known]
        redo = re.compile(args[args.index('--redo') + 1]) if '--redo' in args else None      # --redo RX: перемалювати ці ID (після зміни правил)
        if redo: miss = [m for m in miss if not redo.search(m.split('\t')[0])]; known = {k: v for k, v in known.items() if not redo.search(k)}
        todo = [i for i in ids if i not in known and (bool(redo and redo.search(i)) or not (i in db and os.path.exists(os.path.join(DOCS, db[i]['img']))))]
    t0 = time.time(); left = 0
    for n, iid in enumerate(todo):
        if qmode and time.time() - t0 > 140: left = len(todo) - n; break
        im, kind = render(src, iid, ov); ns, p = rl(iid)
        if im is None: miss.append(f'{iid}\t{kind}'); db.pop(iid, None); continue
        out = os.path.join(OUT, ns, p + '.png'); os.makedirs(os.path.dirname(out), exist_ok=True); im.save(out, optimize=True)
        db[iid] = {'img': f'img/items/{ns}/{p}.png', 'kind': kind, **nm.get(iid, {'uk': '', 'en': p.split('/')[-1].replace('_', ' ')})}
    jsave(os.path.join(RAW, 'icons_auto.json'), dict(sorted(db.items())))
    open(mpath, 'w', encoding='utf-8').write('\n'.join(sorted(set(miss))) + ('\n' if miss else ''))
    print('іконок', len(ids) - len(miss) - left, 'з', len(ids), '| блоків', sum(1 for i in ids if db.get(i, {}).get('kind') == 'block'),
          '| наближених', sum(1 for i in ids if db.get(i, {}).get('kind') == 'approx'), '| немає', len(miss))
    if left: print(f'!! не встигли: {left} — запустіть ще раз (продовжить з місця зупинки)')
    for m in miss[:15]: print('  !!', m)
if __name__ == '__main__': main()
