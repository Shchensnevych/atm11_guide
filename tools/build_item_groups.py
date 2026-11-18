# K20 (§4 Б24): групи предметів для зведення інвентарю й пошуку «де моя їжа?» → docs/data/item_groups.json.
# Джерела — лише дані гри: знімок ознак raw/game_item_traits.json (tools/extract_game_names.py ← companion_item_traits.json
# клієнтського скрипта компаньйона: компоненти за замовчуванням, чи предмет є блоком, назви вкладок творчого інвентаря),
# теги гри (raw/tags_index.json) і база рецептів (raw/recipes.db — чи предмет є входом активного рецепта). Жодних слів з id,
# назв модів чи предметів: правило — за формою даних, перше, що підходить:
#   container — має вміст за замовчуванням (container / bundle_contents) або тег скринь Шалкера (c:shulker_boxes), але не зброя
#               й не інструмент (зброя з набоями теж має вміст);
#   food      — їжа (food) або споживне, яке їдять / п'ють (consumable з видом EAT / DRINK);
#   material  — (раніше за блок; не інструмент і не зброя — вудка має тег c:rods/fishing) у тегу спільних родин матеріалів (c:ingots, c:dusts, c:strings, c:seeds …): нитка, насіння,
#               редстоун — предмети-блоки, які ставлять у світ, але гравець їх збирає як матеріал;
#   block     — предмет-блок (BlockItem);
#   wear      — вдягається гравцем (equippable у слот голови / тіла / ніг / ступнів) або тег броні / аксесуарів;
#   tool / weapon — з компонентами інструмента, зброї, щита чи зносу (tool / weapon / blocks_attacks / kinetic_weapon /
#               piercing_weapon / max_damage) або в тегах інструментів / зброї (вудка — без зносу); інструмент і зброю розрізняють теги гри (у кирки й меча обидва компоненти):
#               тег видобутку (кайла, сокири, лопати, мотики, ножиці, вудка, щітка) — інструмент (сокира теж); тег зброї
#               (меч, лук, арбалет, тризуб, булава, спис) або щит — зброя; без тегів — зброя, якщо є weapon, інакше інструмент;
#   book      — книга за тегами гри (полиця, пюпітр, c:books);
#   material  — вхід активного рецепта (матеріал для крафту);
#   other     — інше.
# Назви груп — короткі підписи компаньйона + назви ванільних вкладок творчого інвентаря мовою гри (щоб гравець і Whisper
# знаходили групу й словами гри). Знімка немає — база не змінюється.
import os, sys, sqlite3, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import RAW, DATA, jload, jsave

SRC = os.path.join(RAW, 'game_item_traits.json')
OUT = os.path.join(DATA, 'item_groups.json')
DB = os.path.join(RAW, 'recipes.db')
TAGS = os.path.join(RAW, 'tags_index.json')

# (id, підпис, ванільні вкладки творчого інвентаря, чиї назви — теж назви групи). Порядок — порядок у зведенні.
GROUPS = [
    ('container', 'контейнери й сумки', []),
    ('wear', 'броня й прикраси', []),
    ('tool', 'інструменти', ['minecraft:tools_and_utilities']),
    ('weapon', 'зброя', ['minecraft:combat']),
    ('food', 'їжа й питво', ['minecraft:food_and_drinks']),
    ('book', 'книги', []),
    ('material', 'матеріали', ['minecraft:ingredients']),
    ('block', 'блоки', ['minecraft:building_blocks']),
    ('other', 'інше', []),
]
DEFAULT = 'block'          # предмет реєстру, якого немає в жодному переліку, — блок (блоків найбільше; перелік не пишемо)
EAT_KINDS = {'EAT', 'DRINK'}
WEAR_SLOTS = {'HEAD', 'CHEST', 'LEGS', 'FEET'}   # друга рука — не вдягання (щит — зброя)
CONTAINER_HAS = ('minecraft:container', 'minecraft:bundle_contents')
MATERIAL_TAGS = ('c:ingots', 'c:nuggets', 'c:gems', 'c:dusts', 'c:raw_materials', 'c:rods', 'c:strings', 'c:seeds', 'c:crops', 'c:dyes',
                 'c:slime_balls', 'c:ender_pearls', 'c:gunpowders', 'c:leathers', 'c:bones', 'c:feathers')   # родина: сам тег або «тег/…»
# K20 (з гри 11-17: «інструменти — це не зброя»): родини тегів, що розрізняють інструмент і зброю (сам тег або «тег/…»)
MINING_TAGS = ('minecraft:enchantable/mining', 'minecraft:enchantable/mining_loot', 'minecraft:pickaxes', 'minecraft:axes', 'minecraft:shovels', 'minecraft:hoes',
               'minecraft:enchantable/fishing', 'c:tools/mining_tool', 'c:tools/shear', 'c:tools/fishing_rod', 'c:tools/brush', 'c:tools/wrench', 'c:tools/igniter')
WEAPON_TAGS = ('minecraft:enchantable/weapon', 'minecraft:enchantable/sharp_weapon', 'minecraft:enchantable/melee_weapon', 'minecraft:swords',
               'minecraft:enchantable/bow', 'minecraft:enchantable/crossbow', 'minecraft:enchantable/trident', 'minecraft:enchantable/mace',
               'c:tools/melee_weapon', 'c:tools/ranged_weapon', 'c:tools/bow', 'c:tools/crossbow', 'c:tools/spear', 'c:tools/trident', 'c:tools/shield')
WEAPON_HAS = ('minecraft:weapon', 'minecraft:blocks_attacks', 'minecraft:kinetic_weapon', 'minecraft:piercing_weapon')
TOOL_HAS = ('minecraft:tool', 'minecraft:weapon', 'minecraft:blocks_attacks', 'minecraft:kinetic_weapon', 'minecraft:piercing_weapon', 'minecraft:max_damage')
CONTAINER_TAGS = ('c:shulker_boxes',)
# ВИНЯТОК із закону універсальності (рішення користувача 2026-11-17, K20): `curios:` / `accessories:` — простори імен API слотів
# аксесуарів (угода двох бібліотек, якою користуються всі моди з аксесуарами). Ванільного компонента вдягання в аксесуарів немає,
# спільного тегу `c:` теж — без цих префіксів амулети, каблучки й пояси стали б «іншим». Нових назв модів сюди не додавати.
WEAR_TAG_PREFIX = ('curios:', 'accessories:', 'c:armors')
WEAR_TAGS = ('minecraft:head_armor', 'minecraft:chest_armor', 'minecraft:leg_armor', 'minecraft:foot_armor', 'minecraft:enchantable/armor')
BOOK_TAGS = ('minecraft:bookshelf_books', 'minecraft:lectern_books', 'c:books')

def item_tags(tags_index):
    inv = collections.defaultdict(set)
    for tag, ids in ((tags_index or {}).get('item') or {}).items():
        for i in ids or []: inv[i].add(tag)
    return inv

def recipe_inputs(db_path):
    """id предметів, що є входом хоча б одного активного рецепта (тег / група «на вибір» — усі її предмети)."""
    if not os.path.exists(db_path): return None
    db = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
    try:
        members = collections.defaultdict(set)
        for t, i in db.execute('select tag_id, item_id from item_tags'): members[t].add(i)
        out = set()
        for it, is_tag in db.execute("select ri.item_or_tag, ri.is_tag from recipe_ingredients ri join recipes r on r.id = ri.recipe_id where r.active = 1 and ri.role != 'output'"):
            if is_tag: out.update(members.get(it.lstrip('#'), ()))
            else: out.add(it)
        return out
    finally: db.close()

def classify(snap, tags_of, inputs):
    """Знімок ознак → {id: група} для всіх предметів реєстру (items — не-блоки, решта реєстру — блоки)."""
    has = {k: set(v) for k, v in (snap.get('has') or {}).items()}
    by = snap.get('by') or {}
    eat = set().union(*[set(v) for k, v in (by.get('minecraft:consumable') or {}).items() if k in EAT_KINDS] or [set()])
    wear_slot = set().union(*[set(v) for k, v in (by.get('minecraft:equippable') or {}).items() if k in WEAR_SLOTS] or [set()])
    non_block = set(snap.get('items') or [])
    def group(i, block):
        tg = tags_of.get(i, ())
        fam = lambda tags: any(t in tags or any(t.startswith(x + '/') for x in tags) for t in tg)
        tool = any(i in has.get(c, ()) for c in TOOL_HAS) or fam(MINING_TAGS) or fam(WEAPON_TAGS)
        if not tool and (any(i in has.get(c, ()) for c in CONTAINER_HAS) or any(t in tg for t in CONTAINER_TAGS)): return 'container'
        if i in has.get('minecraft:food', ()) or i in eat: return 'food'
        if not tool and any(t in MATERIAL_TAGS or t.split('/', 1)[0] in MATERIAL_TAGS for t in tg): return 'material'
        if block: return 'block'
        if i in wear_slot or any(t in WEAR_TAGS or t.startswith(WEAR_TAG_PREFIX) for t in tg): return 'wear'
        if tool:
            if fam(MINING_TAGS): return 'tool'
            if fam(WEAPON_TAGS) or i in has.get('minecraft:blocks_attacks', ()): return 'weapon'
            return 'weapon' if any(i in has.get(c, ()) for c in WEAPON_HAS) else 'tool'
        if any(t in BOOK_TAGS for t in tg): return 'book'
        if inputs is not None and i in inputs: return 'material'
        return 'other'
    return group, non_block

def build(warn, write=True, snap=None, tags_index=None, inputs=None, registry=None):
    snap = snap if snap is not None else jload(SRC, None)
    if not isinstance(snap, dict) or not isinstance(snap.get('items'), list) or not isinstance(snap.get('has'), dict):
        warn('групи предметів: немає raw/game_item_traits.json — зайдіть у світ з компаньйоном і запустіть tools/extract_game_names.py (docs/data/item_groups.json не змінено)')
        return {'items': 0, 'groups': {}}
    tags_of = item_tags(tags_index if tags_index is not None else jload(TAGS, {}))
    if inputs is None:
        inputs = recipe_inputs(DB)
        if inputs is None: warn('групи предметів: немає raw/recipes.db — групи «матеріали» немає (усе таке — «інше»)')
    if registry is None:
        import extract_game_names as EG   # реєстр гри — одне правило зі знімка назв (K6)
        registry = (EG.registry_ids(jload(EG.OUT, None)) or set()) - {EG.EMPTY_ITEM}
    group, non_block = classify(snap, tags_of, inputs)
    ids = sorted(set(registry) | non_block)
    lists = collections.defaultdict(list)
    for i in ids:
        g = group(i, i not in non_block)
        if g != DEFAULT: lists[g].append(i)
    tabs = snap.get('tabs') or {}
    groups = [{'id': g, 'label': label, 'tabs': [tabs[t] for t in tab_ids if tabs.get(t)]} for g, label, tab_ids in GROUPS]
    counts = {g: len(lists.get(g, ())) for g, _, _ in GROUPS if g != DEFAULT}
    counts[DEFAULT] = len(ids) - sum(counts.values())
    data = {'fingerprint': snap.get('fingerprint', ''), 'default': DEFAULT, 'groups': groups, 'counts': counts,
            'items': {g: lists[g] for g, _, _ in GROUPS if lists.get(g)}}
    if write: jsave(OUT, data, compact=True)
    return {'items': len(ids), 'groups': counts}

if __name__ == '__main__':
    rep = []
    r = build(rep.append)
    print(f"предметів {r['items']}, групи: {r['groups']}")
    for x in rep: print('!!', x)
