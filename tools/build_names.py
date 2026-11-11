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

# K5: назви, які гра складає кодом (у файлах перекладу їх немає), — зі знімка гри raw/game_item_names.json
# (tools/extract_game_names.py ← клієнтський скрипт компаньйона). За формою запису, без правил під моди.
RX_TPL = re.compile(r'%(\d+\$)?[sd]')

def strip_tpl(s):
    """Назва-шаблон без місць підстановки: «Амулет: %s» → «Амулет», «Човен (%s) зі сховищем: %s» → «Човен зі сховищем»."""
    s = re.sub(r'\(\s*\)|\[\s*\]', ' ', RX_TPL.sub(' ', s or ''))
    return re.sub(r'\s+', ' ', s).strip(' :—-')

def shared_templates(names):
    """Тексти назв-шаблонів, якими названо кілька предметів: там підставлене гра бере із самого предмета."""
    c = {}
    for n in names:
        if n and RX_TPL.search(n): c[n] = c.get(n, 0) + 1
    return {n for n, k in c.items() if k > 1}

def pick(cur, g, base, shared=()):
    """Яку назву предмета брати: cur — з перекладу (або None), g — показує гра (типовий екземпляр), base — переклад ключа предмета
    в грі, коли він відрізняється від g (або None). → (назва, рішення). Одне правило для names.json і для назв у квестах.
    Розбіжність (замір K5 по всіх 36 692 предметах — 164): base збігається з перекладом → лишається назва предмета (гра показує
    стан типового екземпляра: «Пляшка води», «…: Приклад», «[не налаштовано]»); інакше → назва з гри (у перекладі назва з не того
    ключа: «Ковальський шаблон» замість «Орнамент обладунків «Берег»»).
    Назва-шаблон «…: %s» (381): той самий текст шаблона в кількох предметів (shared) → підставлене визначає сам предмет → назва
    з гри («Алхімічна сірка [Ієсній]»); шаблон лише в одного предмета → підставлене залежить від властивостей екземпляра, а типовий
    екземпляр дає заглушку чи випадковий варіант («Модель даних: BROKEN», «Шарм: Свиня») → назва без підстановки («Шарм»)."""
    if not g: return cur, 'none'
    if not cur: return g, 'added'
    if cur == g: return cur, 'same'
    if RX_TPL.search(cur): return (g, 'template') if cur in shared or not strip_tpl(cur) else (strip_tpl(cur), 'kind')
    return (cur, 'base') if base == cur else (g, 'game')

def apply_game(items, game):
    """Назви з гри поверх назв з перекладу (правило — pick). Повертає лічильники й перелік розбіжностей для tools/audit_names.py."""
    if not game or not game.get('names'): return {}
    st = {'added': 0, 'template': 0, 'kind': 0, 'same': 0, 'differs': []}
    base = game.get('base') or {}
    shared = shared_templates(v[0] for v in items.values())
    for iid, g in game['names'].items():
        cur = items.get(iid)
        name, how = pick(cur[0] if cur else None, g, (base.get(iid) or [None])[0], shared)
        if how in st: st[how] += 1
        else: st['differs'].append((iid, cur[0], g, how))
        if how == 'added': items[iid] = [g]
        elif how in ('template', 'kind', 'game'):                    # англійська назва: з не того ключа — не лишається, шаблон — без підстановки
            en = cur[1] if how != 'game' and len(cur) > 1 and cur[1] != 'b' else ''
            en = '' if how == 'template' and RX_TPL.search(en) else strip_tpl(en) if how == 'kind' else en
            en = '' if en == name else en
            items[iid] = [name, en, 'b'] if len(cur) > 1 and cur[-1] == 'b' else ([name, en] if en else [name])
    return st

def _pair(uk, en):
    uk, en = strip_fmt(uk), strip_fmt(en)
    uk = uk or en
    return [uk] if not en or en == uk else [uk, en]

def build(warn, write=True, game=None, stats=None, out=None):
    """game — знімок назв з гри (типово raw/game_item_names.json); stats / out — словники, куди покласти лічильники apply_game і самі назви (для audit_names)."""
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
    if stats is not None: stats['tsv'] = {k: v[0] for k, v in items.items()}
    st = apply_game(items, game if game is not None else jload(os.path.join(RAW, 'game_item_names.json'), None))
    if stats is not None: stats.update(st)
    for bid, v in bauto.items():                      # ключ мови → переклад; текст без ключа — як у грі
        nm = v.get('name') if isinstance(v, dict) else None
        if not nm: continue
        if nm in bfound: books[bid] = bfound[nm]
        elif not re.fullmatch(r'[a-z0-9_.]+', nm): books[bid] = [strip_fmt(nm)]   # ключ без перекладу — пропускаємо (міст напише «Посібник <мод>»)
    res = {'items': dict(sorted(items.items())), 'entities': dict(sorted(ents.items())), 'keys': dict(sorted(keys.items())), 'books': dict(sorted(books.items())), 'dims': dict(sorted(dims.items())), 'biomes': dict(sorted(biomes.items())), 'tags': dict(sorted(tags.items()))}
    if out is not None: out.update(res)
    if write: jsave(os.path.join(DATA, 'names.json'), res, compact=True)
    return {k: len(v) for k, v in res.items()}
