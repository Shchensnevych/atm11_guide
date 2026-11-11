# Перевірка розбору записів рецептів (build_recipes_db.parse_ingredient_entry / parse_output_entry) на формах, які трапляються в збірці.
# Запуск з atm11_guide: python3 -I tools/check_recipe_parse.py   (потрібна тека збірки — atm11.json або ATM11_ROOT)
# Кожна форма — за структурою запису, не за модом: вкладений об'єкт у item / id, поле items, обгортки, кількість обгортки, шанс.
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_recipes_db as B
I, O = B.parse_ingredient_entry, B.parse_output_entry
CASES = [
    (O({'neoforge:ingredient_type': 'x:component', 'components': {'x:kind': 'x:breeze'}, 'items': 'x:comb'}), [('x:comb', 1.0, 1.0, 1)], 'вихід: поле items'),
    (O({'item': {'count': 1, 'id': 'x:dust'}, 'chance': 0.5}), [('x:dust', 1.0, 0.5, 1)], 'вихід: об\'єкт у полі item, шанс зовні'),
    (O({'item': {'id': 'minecraft:gravel'}}), [('minecraft:gravel', 1.0, 1.0, 1)], 'вихід: об\'єкт у полі item'),
    (O({'id': 'minecraft:stick', 'count': 4}), [('minecraft:stick', 4.0, 1.0, 1)], 'вихід: id і кількість'),
    (O('3x minecraft:stick[x=1]'), [('minecraft:stick', 3.0, 1.0, 1)], 'вихід: рядок з кількістю й компонентами'),
    (O([{'id': 'a:b'}, {'result': {'id': 'c:d', 'count': 2}}]), [('a:b', 1.0, 1.0, 1), ('c:d', 2.0, 1.0, 0)], 'виходи: список, обгортка result'),
    (O({'content': {'id': 'a:b'}, 'chance': 10000}), [('a:b', 1.0, 1.0, 1)], 'вихід: шанс у десятитисячних'),
    (O('#c:pollens'), [('#c:pollens', 1.0, 1.0, 1)], 'вихід-тег лишається'),
    (O({'id': {'bad': 1}}), [], 'вихід: нерозбірливе — нічого, а не рядок з об\'єкта'),
    (I({'item': [{'content': {'type': 'x:sized', 'count': 3, 'ingredient': {'items': 'x:egg', 'components': {}}}, 'chance': 10000}]}), [('x:egg', 0, 3.0)], 'інгредієнт: список обгорток content → ingredient → items'),
    (I({'tag': 'c:ingots/iron', 'count': 2}), [('#c:ingots/iron', 1, 2.0)], 'інгредієнт: тег і кількість'),
    (I({'ingredient': '#c:ingots/steel', 'count': 3}), [('#c:ingots/steel', 1, 3.0)], 'інгредієнт: кількість обгортки'),
    (I({'ingredient': {'tag': 'c:dusts'}, 'count': 5}), [('#c:dusts', 1, 5.0)], 'інгредієнт: кількість обгортки, тег усередині'),
    (I({'items': ['a:b', 'c:d']}), [('a:b', 0, 1.0)], 'інгредієнт: варіанти на вибір — перший'),
    (I({'value': ['#c:ingots/copper', '#c:dusts/copper'], 'count': 8}), [('#c:ingots/copper', 1, 8.0)], 'інгредієнт: варіанти в полі value з кількістю'),
    (I('#logs'), [('#minecraft:logs', 1, 1.0)], 'тег без простору імен — ванільний'),
    (I({'item': 'stick'}), [('minecraft:stick', 0, 1.0)], 'предмет без простору імен — ванільний'),
    (I(['a:b', {'id': 'c:d'}]), [('a:b', 0, 1.0), ('c:d', 0, 1.0)], 'список інгредієнтів'),
    (I("{'id': 'x:y'}"), [], 'рядок з об\'єкта — не id'),
]
bad = [(why, got, want) for got, want, why in CASES if got != want]
for why, got, want in bad: print(f'❌ {why}: {got} ≠ {want}')
print(f'Розбір записів рецептів: {len(CASES) - len(bad)} з {len(CASES)}')
sys.exit(1 if bad else 0)
