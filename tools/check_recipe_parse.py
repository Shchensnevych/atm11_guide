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
# K6: складені інгредієнти NeoForge (difference / intersection / compound) — раніше слот зникав з рецепта (скриня в лійці)
TAGS = {'c:wool': ['x:white_wool', 'x:black_wool'], 'c:dyed/black': ['x:black_wool', 'x:black_bed'], 'c:a': ['x:1', 'x:2', 'minecraft:z'], 'c:b': ['x:1', 'minecraft:z', 'x:3'], 'c:c': ['x:7']}
CASES += [
    (I({'neoforge:ingredient_type': 'neoforge:difference', 'base': '#c:chests/wooden', 'subtracted': '#c:chests/trapped'}), [('#c:chests/wooden', 1, 1.0)], 'інгредієнт-різниця: основа (base)'),
    (I({'neoforge:ingredient_type': 'neoforge:intersection', 'children': ['#c:wool', '#c:dyed/black']}, TAGS), [('x:black_wool', 0, 1.0)], 'інгредієнт-перетин: спільний предмет груп'),
    (I({'neoforge:ingredient_type': 'neoforge:intersection', 'children': ['#c:a', '#c:b']}, TAGS), [('minecraft:z', 0, 1.0)], 'інгредієнт-перетин із кількома спільними предметами — один з них (ванільний першим), а не вся перша група'),
    (I({'neoforge:ingredient_type': 'neoforge:intersection', 'children': ['#c:a', '#c:c']}, TAGS), [('#c:a', 1, 1.0)], 'інгредієнт-перетин без спільних предметів у відомих тегах — перша група'),
    (I({'neoforge:ingredient_type': 'neoforge:intersection', 'children': ['#c:wool', '#c:dyed/black']}), [('#c:wool', 1, 1.0)], 'інгредієнт-перетин без відомих тегів — перша група'),
    (I({'neoforge:ingredient_type': 'neoforge:compound', 'children': ['#c:a', 'x:9'], 'count': 2}), [('#c:a', 1, 2.0)], 'складений інгредієнт (будь-що з переліку) — перший, кількість зовні'),
]
# K6: що таке запис за реєстрами (предмет гри / рідина / інше) і рідини за структурою запису {…, amount}
K = B.Kinds({'x:ingot', 'x:both'}, {'c:ingots'}, {'x:water', 'x:both'}, {'c:acid'}, True)
F = lambda d: B.parse_fluids(d, K)
CASES += [
    ([K.of(x) for x in ('x:ingot', '#c:ingots', 'x:water', '#c:acid', 'x:bee', '#c:unknown', 'x:both')], ['item', 'item', 'fluid', 'fluid', 'other', 'item', 'item'], 'вид запису: предмет / рідина / інше; невідомий тег лишається тегом предметів'),
    (B.Kinds({'x:ingot'}, set(), {'x:water'}, set(), False).of('x:coded'), 'item', 'без знімка реєстру гри невідомий id лишається предметом (предмети, зареєстровані кодом)'),
    (F({'fluid': {'amount': 1000, 'ingredient': 'x:water'}, 'input': 'x:ingot'}), [('x:water', 1000, 'input')], 'рідина-вхід: {amount, ingredient}'),
    (F({'solvent': {'amount': 10, 'ingredient': {'tag': 'c:acid'}}}), [('#c:acid', 10, 'input')], 'рідина-вхід: тег рідин усередині'),
    (F({'fluidOutputs': [{'amount': 100, 'id': 'x:water'}], 'result': {'id': 'x:both', 'amount': 5}}), [('x:water', 100, 'output'), ('x:both', 5, 'output')], 'рідини-виходи; запис із кількістю в мВ — рідина, навіть якщо є й такий предмет'),
    (F({'ingredient': {'id': 'x:ingot', 'amount': 3}}), [], 'предмет із полем amount — не рідина'),
    (B.split_kinds([('x:ingot', 0, 1.0, 'input', 0), ('x:water', 0, 1.0, 'input', 1), ('x:bee', 0, 1.0, 'input', 2), ('#c:acid', 1, 2.0, 'input', 3)], [('x:water', 1.0, 1.0, 1), ('x:ingot', 1.0, 1.0, 0)], [('x:water', 250, 'input')], K),
     ([('x:ingot', 0, 1.0, 'input', 0)], [('x:ingot', 1.0, 1.0, 1)], [('x:water', 250, 'input'), ('#c:acid', 0, 'input'), ('x:water', 0, 'output')], {'in': ['x:bee']}),
     'рідини й не-предмети не лишаються серед предметів: рідина — до рідин (0 мВ = кількість невідома; відома не дублюється), інше — окремо; головним стає перший вихід-предмет'),
]
# K6: рецепт у формі datapack розбирається однаково, звідки б не прийшов (jar чи KubeJS) — з кількостями й сіткою
def PR(t, d): r = B.parse_raw(t, d, I); return [(x[0], x[2]) for x in r[0]], [(x[0], x[1]) for x in r[1]]
K2 = B.Kinds({'x:plank', 'x:table', 'x:block', 'x:essence'}, {'c:planks'}, set(), set(), True)
CASES += [
    (PR('minecraft:crafting_shaped', {'pattern': ['XX', 'XX'], 'key': {'X': '#c:planks'}, 'result': 'x:table'}), ([('#c:planks', 1.0)] * 4, [('x:table', 1.0)]), 'сітка 2×2: чотири слоти, а не один вид'),
    (PR('minecraft:crafting_shapeless', {'ingredients': ['9x x:essence'], 'result': '2x x:block'}), ([('x:essence', 9.0)], [('x:block', 2.0)]), 'без форми: кількість у рядку «9x …», вихід «2x …»'),
    (B.complete({'pattern': ['XX', 'XX'], 'key': {'X': '#c:planks'}, 'result': 'x:table'}, [('#c:planks', 1, 1.0, 'input', s) for s in (0, 1, 3, 4)], [('x:table', 1.0, 1.0, 1)], ['#c:planks'], ['x:table'], K2)[0],
     [('#c:planks', 1, 1.0, 'input', s) for s in (0, 1, 3, 4)], 'розібраний рецепт не замінюється переліком id з індексу'),
    (B.complete(None, [], [], ['x:plank', '#c:planks'], ['x:table'], K2)[:2], ([('x:plank', 0, 1.0, 'input', 0), ('#c:planks', 1, 1.0, 'input', 1)], [('x:table', 1.0, 1.0, 1)]), 'запису рецепта немає — входи й виходи з індексу сита (кількість невідома → 1)'),
]
# K6: умови й реєстр — предмет є в грі чи ні, вирішує реєстр гри (знімок), а не файли моделей у jar
import extract_recipes as E
JAR = {'x:planks', 'x:door'}                      # моделі в jar є для обох
ctx = lambda items: E.Ctx({'x'}, items, set(), set(), {'item': {}})
REG = {'neoforge:conditions': [{'type': 'neoforge:registered', 'value': 'x:door'}]}
CASES += [
    (E.pick_registry(JAR, {'x:planks', 'x:coded'}), ({'x:planks', 'x:coded'}, 'game'), 'реєстр предметів: є знімок гри — він і є реєстром (предмет лише з jar зникає, зареєстрований кодом з\'являється)'),
    (E.pick_registry(JAR, None), (JAR, 'jar'), 'реєстр предметів: знімка немає — за файлами jar, як раніше'),
    (E.conds(REG, ctx(E.pick_registry(JAR, {'x:planks'})[0]))[0], False, 'умова registered: предмета немає в реєстрі гри — рецепт неактивний'),
    (E.conds(REG, ctx(E.pick_registry(JAR, None)[0]))[0], True, 'умова registered без знімка — за jar'),
    # K7: реєстр рідин — так само зі знімка гри: рідина, якої немає серед ключів перекладу в jar, — рідина; ключ перекладу без рідини в грі — ні
    (E.pick_registry({'x:water', 'x:type_only'}, {'x:water', 'x:molten'}), ({'x:water', 'x:molten'}, 'game'), 'реєстр рідин: є знімок гри — він і є реєстром'),
    ([B.Kinds({'x:ingot'}, set(), E.pick_registry({'x:water', 'x:type_only'}, {'x:water', 'x:molten'})[0], set(), True).of(x) for x in ('x:molten', 'x:type_only')], ['fluid', 'other'], 'вид запису за реєстром рідин гри'),
    (B.parse_fluids({'result': {'id': 'x:molten', 'amount': 90}}, B.Kinds(set(), set(), {'x:molten'}, set(), True)), [('x:molten', 90, 'output')], 'рідина-вихід з реєстру гри — з кількістю'),
]
bad = [(why, got, want) for got, want, why in CASES if got != want]
for why, got, want in bad: print(f'❌ {why}: {got} ≠ {want}')
print(f'Розбір записів рецептів: {len(CASES) - len(bad)} з {len(CASES)}')
sys.exit(1 if bad else 0)
