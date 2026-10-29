# Картинки книги квестів: на полотні глав (images у chapters/*.json5) і вставки {image:…} в описах → docs/img/quests/… + docs/data/qimages.json.
# Джерела — як у extract_icons: kubejs/assets (картинки ATM: atm:textures/questpics/…) → jar модів → клієнтський jar Minecraft.
# Дрібні (≤ 64 px, піксельна графіка) — PNG як є; великі — WebP, довша сторона ≤ 512 px (вага сайту для GitHub Pages).
# Запуск з atm11_guide після extract_quests.py:  python3 -I tools/extract_quest_images.py [--force]   (частинами по ~140 с; повторний запуск продовжує)
import os, sys, re, io, json, glob, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import DATA, DOCS, RAW, jload, jsave
from extract_icons import sources
from PIL import Image

OUT = os.path.join(DOCS, 'img', 'quests'); MAP = os.path.join(DATA, 'qimages.json'); MISS = os.path.join(RAW, 'qimages_missing.txt')
IMG_TAG = re.compile(r'\{image:([a-z0-9_.-]+:[a-z0-9_/.-]+)')

def refs():
    out = set()
    for f in glob.glob(os.path.join(DATA, 'quests', '*.json')):
        d = jload(f, {}) or {}
        out.update(i['src'] for i in d.get('img', []) if i.get('src'))
        for q in d.get('quests', []): out.update(IMG_TAG.findall(q.get('desc') or ''))
    return sorted(out)

def asset_path(ref):
    """atm:textures/questpics/x.png → assets/atm/textures/questpics/x.png;  ae2:item/x → assets/ae2/textures/item/x.png"""
    ns, p = ref.split(':', 1)
    if not p.startswith('textures/'): p = 'textures/' + p
    if not p.endswith('.png'): p += '.png'
    return f'assets/{ns}/{p}'

def main():
    force = '--force' in sys.argv
    src = sources(); db = {} if force else (jload(MAP, {}) or {})
    miss = set() if force else set(open(MISS, encoding='utf-8').read().split()) if os.path.exists(MISS) else set()
    todo = [r for r in refs() if r not in db and r not in miss]
    t0 = time.time(); left = 0
    for n, ref in enumerate(todo):
        if time.time() - t0 > 140: left = len(todo) - n; break
        b = src.read(asset_path(ref))
        if b is None: miss.add(ref); continue
        try: im = Image.open(io.BytesIO(b)).convert('RGBA')
        except Exception: miss.add(ref); continue
        if im.height > im.width * 1.5 and im.height % im.width == 0: im = im.crop((0, 0, im.width, im.width))   # анімація — перший кадр
        ns, p = ref.split(':', 1); p = re.sub(r'\.png$', '', p)
        w, h = im.size
        if max(w, h) <= 64:
            rel = f'img/quests/{ns}/{p}.png'; os.makedirs(os.path.dirname(os.path.join(DOCS, rel)), exist_ok=True); im.save(os.path.join(DOCS, rel), optimize=True)
        else:
            k = min(1.0, 512 / max(w, h)); im = im.resize((max(1, int(w * k)), max(1, int(h * k))), Image.LANCZOS)
            rel = f'img/quests/{ns}/{p}.webp'; os.makedirs(os.path.dirname(os.path.join(DOCS, rel)), exist_ok=True); im.save(os.path.join(DOCS, rel), 'WEBP', quality=82, method=4)
        db[ref] = [rel, w, h]
    jsave(MAP, dict(sorted(db.items())), compact=True)
    open(MISS, 'w', encoding='utf-8').write('\n'.join(sorted(miss)) + ('\n' if miss else ''))
    print('картинок', len(db), '| немає в збірці', len(miss), *(['| не встигли', left, '— запустіть ще раз'] if left else []))

if __name__ == '__main__': main()
