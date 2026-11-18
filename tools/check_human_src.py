# Перевірка «Джерела» людською мовою (K21, §4 Б12): tools/human_src.py на вигаданих модах і назвах (кожен вид: предмет,
# тег, рідина, біом, рецепт → вихід, шаблон, сусіди в переліку, налаштування, скрипт збірки, дані, код мода; невідоме —
# лишається й рахується) і по справжніх даних (docs/data: id / шляхів майже не лишається). Запуск з atm11_guide:
# python3 -I tools/check_human_src.py
import os, sys, json, sqlite3, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from human_src import Humanizer

NAMES = {'items': {'zz:gizmo': ['Ґаджет', 'Gizmo'], 'zz:rod': ['Жезл', 'Rod']}, 'tags': {'c:ingots/zinc': ['Цинкові злитки'], 'c:ores': ['Руди']},
         'fluids': {'qq:goo': ['Слиз']}, 'fluid_tags': {'c:goo': ['Слиз']}, 'biomes': {'qq:mire': ['Трясовина', 'Mire']}, 'dims': {}, 'entities': {}}
MODS = [{'id': 'zz', 'name': 'Zed Mod'}, {'id': 'qq', 'name': 'Queue Mod'}, {'id': 'zzcompat', 'name': 'Zed Compat'}]
db = os.path.join(tempfile.mkdtemp(), 'r.db')
c = sqlite3.connect(db)
c.executescript("CREATE TABLE recipe_outputs (recipe_id TEXT, item_id TEXT, is_primary INTEGER); CREATE TABLE recipe_fluids (recipe_id TEXT, fluid_id TEXT, io_type TEXT);"
                "INSERT INTO recipe_outputs VALUES ('zz:machine/gizmo_from_rod', 'zz:gizmo', 1); INSERT INTO recipe_fluids VALUES ('qq:melt/goo', 'qq:goo', 'output');")
c.commit(); c.close()
H = Humanizer(NAMES, MODS, db)
CASES = [
    ('рецепт zz:machine/gizmo_from_rod — zz:rod', 'рецепт «Ґаджет» — «Жезл»', 'id рецепта — назва його виходу; предмет — назва'),
    ('рецепт qq:melt/goo', 'рецепт «Слиз»', 'рецепт, що дає рідину, — назва рідини'),
    ('тег c:ingots/zinc; #c:goo', 'тег «Цинкові злитки»; «Слиз»', 'групи предметів і рідин'),
    ('біом qq:mire', 'біом «Трясовина»', 'біом'),
    ('рецепти zz:machine/*', 'рецепти Zed Mod', 'шаблон без назви групи — мод'),
    ('руди за тегом c:ores/*', 'руди за тегом «Руди»', 'шаблон — назва групи-префікса'),
    ('рецепти zz:machine/gizmo_from_rod, rod_from_gizmo (3)', 'рецепти «Ґаджет» та ін.', 'сусіди в переліку — «та ін.»'),
    ('config/zz-common.toml: someKey', 'налаштування Zed Mod', 'файл налаштувань мода; ключ без пояснення — прибрано'),
    ('config/zz-server.toml: запас до 2 000 FE', 'налаштування Zed Mod: запас до 2 000 FE', 'пояснення з числом лишається (його перевіряє сито)'),
    ('KubeJS server_scripts/mods/zz/recipes.js, mods/qq/x.js', 'скрипт збірки (KubeJS)', 'скрипти збірки — одним словом'),
    ('класи com/author/zzcompat/handlers/ZedHandler, OtherOne', 'код мода Zed Compat', 'клас / пакет — код мода з шляху'),
    ('qq data_maps/fluid/coolant.json', 'дані Queue Mod', 'мод словом перед шляхом'),
    ('квести «Ґаджет», «Жезл»', 'квести «Ґаджет», «Жезл»', 'людський текст не змінюється'),
    ('тег unknownmod:thing', 'тег unknownmod:thing', 'невідоме — лишається як є'),
]
bad = [(src, got, want, why) for src, want, why in CASES for got in [H.text(src)] if got != want]
for src, got, want, why in bad: print(f'✗ {why}: «{src}» → «{got}» (очікувалось «{want}»)')
assert H.residual and 'unknownmod:thing' in H.residual, 'невідоме рахується'

# справжні дані: id / шляхів у «Джерелі» майже не лишається (поріг — 5 % рядків), предмети з назвою — завжди назвою
D = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'docs', 'data')
real = []
if os.path.exists(os.path.join(D, 'names.json')):
    mods = json.load(open(os.path.join(D, 'mods.json'), encoding='utf-8'))
    road = json.load(open(os.path.join(D, 'roadmap.json'), encoding='utf-8'))
    br = json.load(open(os.path.join(D, 'branches.json'), encoding='utf-8'))
    srcs = [x['src'] for m in mods for k in ('synergy', 'synergy_in') for x in m.get(k, []) if isinstance(x, dict) and x.get('src')] \
        + [e['src'] for e in road.get('edges', []) if e.get('src')] + [s['src'] for b in br for s in b.get('steps', []) if s.get('src')]
    items = json.load(open(os.path.join(D, 'names.json'), encoding='utf-8')).get('items', {})
    import re
    left = [s for s in srcs if re.search(r'\b[a-z0-9_.-]+:[a-z0-9_/.*-]+', s)]
    named = [t for s in srcs for t in re.findall(r'\b[a-z0-9_.-]+:[a-z0-9_/.-]+[a-z0-9_]', s) if t in items]
    print(f'   справжні дані: рядків «Джерело» {len(srcs)}, з id ще {len(left)} ({100 * len(left) / max(1, len(srcs)):.1f} %), предметів з назвою id-ом — {len(named)}')
    if len(left) > 0.05 * len(srcs): real.append(f'id лишилось у {len(left)} рядках: {left[:3]}')
    if named: real.append(f'предмети з назвою лишились id-ом: {named[:5]}')
print(f'   Перевірка «Джерела»: {len(CASES) - len(bad)} з {len(CASES)}')
assert not bad and not real, '; '.join(real)
