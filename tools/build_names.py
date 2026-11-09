# Назви з перекладу для моста ATM11-Companion (C2): ua_work/review/effective.tsv → docs/data/names.json.
# Міст бере назви предметів, блоків, істот, клавіш і книг ЛИШЕ звідси (GUIDE_HANDOFF §2а: знання — з docs/data).
# Формат: {"items": {"ns:id": [uk, en?, "b"?]}, "entities": {...: [uk, en?]}, "keys": {"key.x": [uk, en?]}, "books": {"ns:book": [uk, en?]}, "dims": {"ns:вимір": [uk, en?]}, "biomes": {"ns:біом": [uk, en?]}, "tags": {"ns:шлях/тегу": [uk, en?]}}
#   en пропущено, якщо збігається з uk; "b" — є лише ключ block.* (без item.*).
import os, re
from common import UA, DATA, RAW, jload, jsave, strip_fmt

RX_ITEM = re.compile(r'^(item|block)\.([a-z0-9_.-]+?)\.([a-z0-9_/-]+)$')
RX_ITEM_NS = re.compile(r'^([a-z0-9_-]+)\.(item|block)\.([a-z0-9_/-]+)$')
RX_PARTTYPE = re.compile(r'^parttype\.([a-z0-9_-]+)\.([a-z0-9_/-]+)$')
RX_ENT = re.compile(r'^entity\.([a-z0-9_-]+)\.([a-z0-9_/-]+)$')
RX_DIM = re.compile(r'^dimension\.([a-z0-9_-]+)\.([a-z0-9_/-]+)$')
RX_BIOME = re.compile(r'^biome\.([a-z0-9_-]+)\.([a-z0-9_/-]+)$')
RX_TAG = re.compile(r'^tag\.item\.([a-z0-9_-]+)\.([a-z0-9_.-]+)$')   # tag.item.c.rods.wooden → c:rods/wooden (назва групи предметів)
RX_BOOK = re.compile(r'^book\.([a-z0-9_-]+)\.([a-z0-9_-]+)\.name$')

# Назви-шаблони, які гра заповнює назвою блока з тим самим шляхом (C5e; «переклад гри — істинне джерело назв»).
# Crafting on a Stick: lang `item.crafting_on_a_stick.crafting_table` = "%s", а клас предмета (jar: item/CoasItem.class)
# будує назву як Component.translatable(ключ, block.getName()) — блок ванільний (Blocks.CRAFTING_TABLE…) → у грі «Верстак».
TPL_ARG_BLOCK = {'crafting_on_a_stick': 'minecraft'}
RX_TPL_ONLY = re.compile(r'^%(1\$)?s$')

def _resolve_templates(items):
    n = 0
    for iid, v in items.items():
        ns, _, path = iid.partition(':')
        src_ns = TPL_ARG_BLOCK.get(ns)
        if not src_ns or not RX_TPL_ONLY.match(v[0] or ''): continue
        src = items.get(f'{src_ns}:{path}')
        if not src or RX_TPL_ONLY.match(src[0] or ''): continue
        items[iid] = [x for x in src[:2] if x] or v
        n += 1
    return n

def _pair(uk, en):
    uk, en = strip_fmt(uk), strip_fmt(en)
    uk = uk or en
    return [uk] if not en or en == uk else [uk, en]

def build(warn, write=True):
    p = os.path.join(UA, 'review', 'effective.tsv')
    if not os.path.exists(p):
        warn('names: немає ua_work/review/effective.tsv — docs/data/names.json не оновлено')
        return {'items': 0, 'entities': 0, 'keys': 0, 'books': 0, 'dims': 0, 'biomes': 0, 'tags': 0}
    items, ents, keys, books, dims, biomes, tags = {}, {}, {}, {}, {}, {}, {}
    # Назви книг-посібників: raw/books_auto.json (tools/extract_books.py — book.json → name: ключ мови або текст)
    bauto = jload(os.path.join(RAW, 'books_auto.json'), {}) or {}
    bkeys = {v['name']: bid for bid, v in bauto.items() if isinstance(v, dict) and v.get('name')}
    bfound = {}
    with open(p, encoding='utf-8') as f:
        next(f, None)
        for line in f:
            c = line.rstrip('\n').split('\t')
            if len(c) < 5 or not (c[3] or c[4]): continue
            k = c[0]
            if k in bkeys: bfound[k] = _pair(c[4], c[3])
            m = RX_ITEM.match(k)
            if m and '.' not in m.group(3) and '.' not in m.group(2):   # R1b: «item.ae2wtlib.magnet_card.desc» — опис, не предмет
                iid = f'{m.group(2)}:{m.group(3)}'
                old = items.get(iid)
                if old is None or (m.group(1) == 'item' and old[-1] == 'b'):
                    v = _pair(c[4], c[3])
                    if m.group(1) == 'block': v.append('b') if len(v) == 2 else v.extend(['', 'b'])
                    items[iid] = v
                continue
            m = RX_ITEM_NS.match(k)
            if m and m.group(1) == c[1] and '.' not in m.group(3):
                iid = f'{m.group(1)}:{m.group(3)}'
                old = items.get(iid)
                if old is None or (m.group(2) == 'item' and old[-1] == 'b'):
                    v = _pair(c[4], c[3])
                    if m.group(2) == 'block': v.append('b') if len(v) == 2 else v.extend(['', 'b'])
                    items[iid] = v
                continue
            m = RX_PARTTYPE.match(k)
            if m and m.group(1) == c[1] and '.' not in m.group(2):
                iid = f'{m.group(1)}:part_{m.group(2)}'
                if iid not in items:
                    items[iid] = _pair(c[4], c[3])
                continue
            if k == 'reward.apotheosis.gem' and 'apotheosis:gem' not in items:
                uk_g = re.sub(r'\s*\(%(\d+\$)?s\)', '', strip_fmt(c[4])).strip()
                en_g = re.sub(r'\s*\(%(\d+\$)?s\)', '', strip_fmt(c[3])).strip()
                if uk_g or en_g: items['apotheosis:gem'] = _pair(uk_g, en_g)
                continue
            m = RX_ENT.match(k)
            if m: ents[f'{m.group(1)}:{m.group(2)}'] = _pair(c[4], c[3]); continue
            m = RX_DIM.match(k)
            if m: dims[f'{m.group(1)}:{m.group(2)}'] = _pair(c[4], c[3]); continue
            m = RX_BIOME.match(k)
            if m: biomes[f'{m.group(1)}:{m.group(2)}'] = _pair(c[4], c[3]); continue
            m = RX_TAG.match(k)
            if m: tags[f'{m.group(1)}:{m.group(2).replace(".", "/")}'] = _pair(c[4], c[3]); continue
            m = RX_BOOK.match(k)
            if m: books[f'{m.group(1)}:{m.group(2)}'] = _pair(c[4], c[3]); continue
            if k.startswith('key.') and not k.startswith('key.categories.'): keys[k] = _pair(c[4], c[3])
    _resolve_templates(items)
    for bid, v in bauto.items():                      # ключ мови → переклад; текст без ключа — як у грі
        nm = v.get('name') if isinstance(v, dict) else None
        if not nm: continue
        if nm in bfound: books[bid] = bfound[nm]
        elif not re.fullmatch(r'[a-z0-9_.]+', nm): books[bid] = [strip_fmt(nm)]   # ключ без перекладу — пропускаємо (міст напише «Посібник <мод>»)
    out = {'items': dict(sorted(items.items())), 'entities': dict(sorted(ents.items())), 'keys': dict(sorted(keys.items())), 'books': dict(sorted(books.items())), 'dims': dict(sorted(dims.items())), 'biomes': dict(sorted(biomes.items())), 'tags': dict(sorted(tags.items()))}
    if write: jsave(os.path.join(DATA, 'names.json'), out, compact=True)
    return {k: len(v) for k, v in out.items()}
