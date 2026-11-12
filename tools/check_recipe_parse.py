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
    (I(['a:b', {'id': 'c:d'}]), [('a:b', 0, 1.0)], 'список у місці інгредієнта — варіанти одного слота; без обліку груп — перший'),
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
# K8: слот «на вибір» (у грі підходить будь-який із переліку) — одна група з усіма варіантами, а не перший варіант і не кожен
# варіант окремим обов'язковим входом. Група — лише з предметів гри; id групи не залежить від порядку варіантів.
REGC = {'x:coal', 'x:charcoal', 'x:a', 'x:b', 'x:1', 'x:2', 'minecraft:z', 'x:t'}
def IC(ing):
    c = B.Choices(REGC, TAGS); return B.parse_ingredient_entry(ing, TAGS, c), c.groups
def PC(t, d):
    c = B.Choices(REGC, TAGS); r = B.parse_raw(t, d, lambda x: B.parse_ingredient_entry(x, TAGS, c)); return [(x[0], x[2]) for x in r[0]]
G = lambda *m: B.Choices.gid(m)
GC, GAB = G('x:coal', 'x:charcoal'), G('x:a', 'x:b')
CASES += [
    (IC(['x:coal', 'x:charcoal']), ([('#' + GC, 1, 1.0)], {GC: ['x:coal', 'x:charcoal']}), 'варіанти на вибір — одна група з усіма варіантами'),
    (IC(['x:charcoal', 'x:coal'])[0], [('#' + GC, 1, 1.0)], 'та сама група за будь-якого порядку варіантів'),
    (IC({'items': ['x:a', 'x:b'], 'count': 2}), ([('#' + GAB, 1, 2.0)], {GAB: ['x:a', 'x:b']}), 'варіанти в полі items з кількістю'),
    (IC({'neoforge:ingredient_type': 'neoforge:compound', 'children': ['#c:a', 'x:b']}), ([('#' + G('x:1', 'x:2', 'minecraft:z', 'x:b'), 1, 1.0)], {G('x:1', 'x:2', 'minecraft:z', 'x:b'): ['x:1', 'x:2', 'minecraft:z', 'x:b']}), 'складений інгредієнт: група з предметів тегу й окремого предмета'),
    (IC(['x:coal', 'x:ghost']), ([('x:coal', 0, 1.0)], {}), 'варіант поза реєстром гри відкидається: лишився один — це просто предмет'),
    (IC(['x:ghost', 'x:coal']), ([('x:coal', 0, 1.0)], {}), 'перший варіант поза реєстром — береться той, що є в грі'),
    (IC(['#c:unknown', 'x:coal']), ([('#c:unknown', 1, 1.0)], {}), 'серед варіантів невідомий тег — склад групи невідомий: перший варіант, як раніше'),
    (IC(['x:coal', 'x:coal']), ([('x:coal', 0, 1.0)], {}), 'однакові варіанти — не вибір'),
    (PC('minecraft:crafting_shapeless', {'ingredients': ['x:a', ['x:coal', 'x:charcoal']], 'result': 'x:t'}), [('x:a', 1.0), ('#' + GC, 1.0)], 'без форми: слот з варіантами — один вхід-група'),
    (PC('minecraft:crafting_shaped', {'pattern': ['CC'], 'key': {'C': ['x:coal', 'x:charcoal']}, 'result': 'x:t'}), [('#' + GC, 1.0)] * 2, 'сітка: слот з варіантами — група в кожному слоті'),
    (PC('occultism:ritual', {'ingredients': [['x:coal', 'x:charcoal'], ['x:coal', 'x:charcoal'], 'x:a'], 'result': {'id': 'x:t'}}), [('#' + GC, 1.0), ('#' + GC, 1.0), ('x:a', 1.0)], 'ритуал: два слоти «на вибір» — дві групи, а не чотири обов\'язкові входи'),
    (PC('x:compound_part', {'ingredients': [['x:a', 'x:b'], ['x:a', 'x:b']], 'result': {'id': 'x:t'}}), [('#' + GAB, 1.0)] * 2, 'рецепт мода (загальний розбір): слоти «на вибір»'),
    (PC('x:smelting', {'ingredient': ['x:a', 'x:b'], 'result': {'id': 'x:t'}}), [('#' + GAB, 1.0)], 'поле ingredient (один інгредієнт) зі списком — варіанти, а не два входи'),
    (PC('x:alchemy', {'input': ['x:a', 'x:b'], 'output': {'id': 'x:t'}}), [('x:a', 1.0), ('x:b', 1.0)], 'поле input зі списком — перелік входів (як було)'),
    (PC('enderio:alloy_smelting', {'inputs': [{'count': 1, 'ingredient': ['x:coal', 'x:charcoal']}, {'count': 2, 'ingredient': '#c:a'}], 'output': {'id': 'x:t'}}), [('#' + GC, 1.0), ('#c:a', 2.0)], 'перелік входів (inputs): кожен запис — окремий вхід, варіанти всередині — група'),
    (PC('enderio:slicing', {'inputs': ['x:a', 'x:b', 'x:a'], 'output': {'id': 'x:t'}}), [('x:a', 1.0), ('x:b', 1.0), ('x:a', 1.0)], 'перелік входів рядками — усі входи, не варіанти'),
    (B.Kinds(REGC, set(TAGS), set(), set(), True).of('#' + GC), 'item', 'група варіантів — вхід-предмет'),
    (IC({'item': [{'content': {'ingredient': {'items': 'x:a'}, 'count': 2}}, {'content': {'ingredient': {'tag': 'c:a'}, 'count': 4}}]}), ([('x:a', 0, 2.0), ('#c:a', 1, 4.0)], {}), 'список під полем item — перелік входів, а не варіанти'),
]
# K8: предмет активації ритуалу Occultism витрачається (усі класи ритуалів у finish викликають activationItem.shrink(1) —
# байт-код occultism, raw/tmp/k8/jdis.py): роль activation, а не «невитратний каталізатор»
RIT = B.parse_raw('occultism:ritual', {'activation_item': 'x:t4', 'ingredients': ['x:a'], 'result': {'id': 'x:t5'}}, I)[0]
CASES += [([(x[0], x[3]) for x in RIT], [('x:t4', 'activation'), ('x:a', 'pedestal')], 'ритуал: предмет активації — витратний вхід (роль activation)')]
# K9: входи окремим полем рецепта, записані не рядком (перелік, {id}, {ingredient}), — у рецептах загальної гілки розбору; вхід —
# лише предмет гри / тег предметів, який сито знає як вхід; вихід цього ж рецепта, рідина, не-предмети й повтори — ні
K9 = B.Kinds({'x:a', 'x:b', 'x:c', 'x:jar', 'x:f', 'x:dummy', 'x:out', 'x:ore', 'x:ore2', 'x:blood'}, {'c:dust'}, {'x:blood'}, set(), True)
def CF(extra, known, t='x:machine', base=None):
    raw = {'type': t, **(base or {'ingredients': ['x:a']}), 'result': {'id': 'x:out'}, **extra}
    r = B.parse_raw(t, raw, I)
    return [(i, c) for i, _, c, _, _ in B.complete(raw, r[0], r[1], ['x:a'] + known, ['x:out'], K9)[0]]
CASES += [
    (CF({'incenses': ['x:b', {'item': 'x:c', 'count': 3}]}, ['x:b', 'x:c']), [('x:a', 1.0), ('x:b', 1.0), ('x:c', 3.0)], 'вхід окремим полем: перелік — кожен запис окремий вхід (не варіанти), з кількістю'),
    (CF({'incenses': ['x:b', 'x:b']}, ['x:b']), [('x:a', 1.0), ('x:b', 1.0), ('x:b', 1.0)], 'той самий предмет двічі в переліку — два входи'),
    (CF({'extraIngredient': {'id': 'x:jar'}}, ['x:jar']), [('x:a', 1.0), ('x:jar', 1.0)], 'вхід окремим полем: {id}'),
    (CF({'fuel': {'ingredient': '#c:dust', 'count': 2}}, ['#c:dust']), [('x:a', 1.0), ('#c:dust', 2.0)], 'вхід окремим полем: {ingredient} з кількістю, тег предметів'),
    (CF({'fuel': {'ingredient': 'x:f'}}, ['x:f'], base={'ingredient': 'x:a'}), [('x:a', 1.0), ('x:f', 1.0)], 'те саме, коли основний вхід — поле ingredient'),
    (CF({'ritual_dummy': {'id': 'x:dummy'}}, ['x:dummy'], t='occultism:ritual'), [('x:a', 1.0)], 'тип з власною гілкою розбору знає свої поля сам: мітка ритуалу — не вхід'),
    (CF({'entity_to_sacrifice': {'tag': 'c:bats'}}, ['#c:bats']), [('x:a', 1.0)], 'тег не предметів (істоти) — не вхід'),
    (CF({'unknown': {'id': 'x:b'}}, []), [('x:a', 1.0)], 'предмет, якого сито не знає як вхід цього рецепта, — не вхід'),
    (CF({'icon': {'id': 'x:out'}}, ['x:out']), [('x:a', 1.0)], 'предмет, що є виходом цього ж рецепта, з окремого поля — не вхід'),
    (CF({'again': {'id': 'x:a'}}, []), [('x:a', 1.0)], 'уже розібраний вхід не дублюється'),
    (CF({'fluid': {'ingredient': 'x:blood', 'amount': 100}}, ['x:blood']), [('x:a', 1.0)], 'рідина з кількістю в мВ лишається рідиною, навіть якщо є й такий предмет'),
    (CF({'layers': [{'fill': 'x:ore', 'radius': 4, 'weighted': [{'entry': 'x:ore2', 'weight': 5}]}]}, ['x:ore', 'x:ore2']), [('x:a', 1.0)], 'службова вкладена структура без форми інгредієнта — не вхід'),
    (CF({'mainhand': 'x:b'}, ['x:b']), [('x:a', 1.0), ('x:b', 1.0)], 'рядок верхнього рівня — вхід, як і раніше'),
    (CF({'soil': {'id': 'x:b'}}, ['x:b'], base={'seed': 'x:a'}), [('x:a', 1.0), ('x:b', 1.0)], 'відомого поля входів немає — входи з індексу сита, як і раніше'),
    (bool(E.OUTK.search('tertiary')), True, 'третій вихід (tertiary) — вихід, як і secondary'),
]
bad = [(why, got, want) for got, want, why in CASES if got != want]
for why, got, want in bad: print(f'❌ {why}: {got} ≠ {want}')
print(f'Розбір записів рецептів: {len(CASES) - len(bad)} з {len(CASES)}')
sys.exit(1 if bad else 0)
