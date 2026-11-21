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
# K29 (Д6): універсальні форми JSON + знімок нестандартних інгредієнтів гри + нерозібрані слоти
K29 = B.Kinds({'x:conduit', 'x:gem', 'x:orb1', 'x:orb2', 'x:chest', 'x:barrel', 'x:plank1', 'x:plank2', 'x:stone', 'x:ingot', 'x:out', 'x:a', 'x:b', 'x:oil', 'x:boot', 'x:tpl', 'x:dust', 'minecraft:stick'},
              {'x:wood_box', 'c:ingots', 'minecraft:saplings'}, {'minecraft:water', 'minecraft:lava'}, set(), True)
def P29(t, d, gslots=None):
    c = B.Choices(K29.items, {'x:wood_box': ['x:chest', 'x:barrel'], 'c:ingots': ['x:ingot'], 'minecraft:saplings': ['minecraft:stick']})
    ing = lambda x: B.parse_ingredient_entry(x, c.tags, c, K29)
    res = (lambda seq, _raw: c.one([(m, 0, 1.0) for m in gslots[seq]]) if gslots and seq in gslots else None) if gslots is not None else None
    r = B.parse_raw(t, d, ing, res)
    return [(x[0], x[2]) for x in r[0]], [(x[0], x[1], x[2], x[3]) for x in r[1]], r[6], c.groups
CASES += [
    # itemStack, block, fluid, amount (не-рідина)
    (I({'color': -1, 'itemStack': {'id': 'x:oil'}, 'order': 0}), [('x:oil', 0, 1.0)], 'обгортка itemStack у слоті'),
    (I({'block': 'x:stone'}), [('x:stone', 0, 1.0)], 'ключ block у слоті'),
    (I({'fluid': {'id': 'minecraft:water'}}), [('minecraft:water', 0, 1.0)], 'ключ fluid без amount у слоті'),
    (I({'amount': 3, 'ingredient': 'x:a'}), [('x:a', 0, 3.0)], 'кількість у полі amount для предметного інгредієнта'),
    (I({'count': 2, 'amount': 9, 'ingredient': 'x:a'}), [('x:a', 0, 2.0)], 'count має пріоритет над amount'),
    # статичний fallback neoforge:ingredient_type ∈ items / ∈ item_tags
    (B.parse_ingredient_entry({'neoforge:ingredient_type': 'x:conduit', 'conduit_type': 'x:redstone'}, {}, None, K29), [('x:conduit', 0, 1.0)], 'custom type, що є предметом реєстру → цей предмет'),
    (B.parse_ingredient_entry({'neoforge:ingredient_type': 'x:wood_box'}, {}, None, K29), [('#x:wood_box', 1, 1.0)], 'custom type, що є тегом предметів → цей тег'),
    # знімок гри (slot_resolver) для нерозібраного custom-слота в сітці й без форми
    (P29('minecraft:crafting_shaped', {'pattern': ['S S', 'SOS'], 'key': {'S': 'x:stone', 'O': {'neoforge:ingredient_type': 'x:orb_tier', 'tier': 2}}, 'result': 'x:out'}, {3: ['x:orb1', 'x:orb2']})[0],
     [('x:stone', 1.0), ('x:stone', 1.0), ('x:stone', 1.0), ('#' + B.Choices.gid(['x:orb1', 'x:orb2']), 1.0), ('x:stone', 1.0)], 'знімок гри підставляє custom-слот за індексом непустої клітинки сітки → група #choice'),
    (P29('minecraft:crafting_shapeless', {'ingredients': ['x:stone', {'neoforge:ingredient_type': 'x:unknown_part'}], 'result': 'x:out'}, {1: ['x:a']})[0],
     [('x:stone', 1.0), ('x:a', 1.0)], 'знімок гри з 1 предметом → просто цей предмет'),
    # нерозібраний слот без знімка → чесний лічильник unparsed_slots у extra_data
    (P29('x:salvaging', {'input': {'neoforge:ingredient_type': 'x:affix', 'rarity': 'x:mythic'}, 'outputs': [{'stack': {'id': 'x:out'}}]})[2],
     {'unparsed_slots': 1}, 'нерозібраний custom-слот без знімка → unparsed_slots в extra_data'),
    # сітка pattern+key поза crafting_shaped (апгрейди рюкзаків/скринь, rolling, arcane_workbench)
    (P29('mod:tier_upgrade', {'pattern': ['III', 'ICI', 'III'], 'key': {'I': 'x:ingot', 'C': 'x:chest'}, 'result': {'id': 'x:out'}})[0],
     [('x:ingot', 1.0)] * 4 + [('x:chest', 1.0)] + [('x:ingot', 1.0)] * 4, 'сітка pattern+key будь-якого типу рецепта зберігає всі 9 клітинок'),
    # ковальський рецепт base + addition + template із кількістю
    (P29('mod:sized_upgrade', {'template': 'x:tpl', 'base': 'x:boot', 'addition': {'count': 4, 'ingredient': '#c:ingots'}, 'result': {'id': 'x:out'}})[0],
     [('x:tpl', 1.0), ('x:boot', 1.0), ('#c:ingots', 4.0)], 'ковальський рецепт base+addition+template зберігає кількість addition'),
    # загальні ключі входів (materials, input_items з amount, input_item без minecraft:, additives) і виходів
    (P29('mod:construct', {'materials': [{'count': 3, 'ingredient': 'x:plank1'}, {'count': 2, 'ingredient': 'x:ingot'}], 'result': {'id': 'x:out'}})[0],
     [('x:plank1', 3.0), ('x:ingot', 2.0)], 'поле materials зберігає кількості'),
    (P29('mod:assembler', {'input_items': [{'amount': 3, 'ingredient': 'x:a'}, {'amount': 64, 'ingredient': 'x:b'}], 'itemOutput': {'id': 'x:out', 'count': 64}})[:2],
     ([('x:a', 3.0), ('x:b', 64.0)], [('x:out', 64.0, 1.0, 1)]), 'input_items з amount і вихід itemOutput з count'),
    (P29('mod:squeeze', {'input_item': '#saplings', 'output_items': [{'item': {'id': 'x:a', 'count': 2}}, {'item': {'id': 'x:b'}, 'chance': 0.5}]})[:2],
     ([('#minecraft:saplings', 1.0)], [('x:a', 2.0, 1.0, 1), ('x:b', 1.0, 0.5, 0)]), 'input_item без minecraft: і output_items із count/chance'),
    (P29('enderio:alloy_smelting', {'inputs': [{'count': 2, 'ingredient': 'x:a'}], 'output': {'id': 'x:out', 'count': 4}})[:2],
     ([('x:a', 2.0)], [('x:out', 4.0, 1.0, 1)]), 'Ender IO з полем output в однині зберігає count'),
    (P29('mod:athanor', {'ingredients': ['x:a'], 'guaranteed_outputs': [{'id': 'x:out', 'count': 2}], 'chance_outputs': [{'item': {'id': 'x:dust'}, 'chance': 0.5}]})[1],
     [('x:out', 2.0, 1.0, 1), ('x:dust', 1.0, 0.5, 0)], 'guaranteed_outputs + chance_outputs разом'),
    (O({'tag': 'c:ores/alexandrite', 'count': 2}), [('#c:ores/alexandrite', 2.0, 1.0, 1)], 'вихід-тег у словнику {tag} (tag_result)'),
]
# K32 (Д1, Д2): чиста схема без items_meta / recipes_fts, накладання KubeJS-тегів і відсіювання не-предметних тегів у complete()
import sqlite3
_memdb = sqlite3.connect(':memory:')
B.init_schema(_memdb)
_tables = sorted(r[0] for r in _memdb.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"))
_memdb.close()

K32 = B.Kinds({'x:seed', 'x:dust', 'x:chalk'}, {'c:tools/hammer'}, {'minecraft:water'}, {'c:molten'}, True)
_c32_top = B.complete(
    {'type': 'x:grow', 'ingredient': 'x:seed', 'soilType': '#x:flowers', 'biomes': '#c:is_overworld', 'tool': '#c:tools/hammer', 'result': 'x:seed'},
    [('x:seed', 0, 1.0, 'input', 0)], [('x:seed', 1.0, 1.0, 1)],
    ['x:seed', '#x:flowers', '#c:is_overworld', '#c:tools/hammer'], ['x:seed'], K32,
)
_c32_fb = B.complete(
    {'type': 'x:ritual', 'ritual_events': [{'items': ['x:chalk']}, {'entities': ['#minecraft:villager']}]},
    [], [], ['x:chalk', '#c:molten', '#minecraft:villager'], [], K32,
)
_c32_direct = B.complete(
    {'type': 'x:alch', 'input': ['x:seed', '#c:dusts/hellforged'], 'output': 'x:dust'},
    [('x:seed', 0, 1.0, 'input', 0), ('#c:dusts/hellforged', 1, 1.0, 'input', 1)], [('x:dust', 1.0, 1.0, 1)],
    ['x:seed', '#c:dusts/hellforged'], ['x:dust'], K32,
)
CASES += [
    (_tables, ['item_tags', 'recipe_fluids', 'recipe_ingredients', 'recipe_outputs', 'recipes'], 'Д1: схема recipes.db містить лише 5 робочих таблиць (без items_meta і recipes_fts)'),
    ([x[0] for x in _c32_top[0]], ['x:seed', '#c:tools/hammer'], 'Д2: complete() не підхоплює не-предметні теги з рядків верхнього рівня (ґрунт / біом), але лишає відомий item-тег'),
    (([x[0] for x in _c32_fb[0]], [f[0] for f in _c32_fb[2]], _c32_fb[3]),
     (['x:chalk'], ['#c:molten'], {'in': ['#minecraft:villager']}), 'Д2: fallback complete() лишає предмет і тег рідини, а не-предметний тег істоти переносить в other'),
    ([x[0] for x in _c32_direct[0]], ['x:seed', '#c:dusts/hellforged'], 'Д2: прямий вхід із parse_raw з порожнім item-тегом мода чесно лишається в інгредієнтах'),
]
if hasattr(E, 'apply_kjs_tags') and hasattr(E, 'tag_empty_refs'):
    _td = {'item': {'c:salt': ['x:s1'], 'c:unb': ['x:a', 'x:b', 'x:c'], 'c:mod': []}, 'block': {'b:t': ['x:b1']}, 'fluid': {'c:f': []}, 'src': {'item:c:salt': ['m.jar']}}
    _ex = {'item': {'x:s1', 'x:a', 'x:b', 'x:c', 'x:d', 'm:i1', 'm:i2'}, 'block': {'x:b1', 'm:b1'}, 'fluid': {'x:fl1'}}
    _kjs1 = {'tags': [
        {'reg': 'item', 'kind': 'add', 'tag': 'c:niter', 'vals': ['#c:salt', 'x:ghost']},
        {'reg': 'item', 'kind': 'add', 'tag': 'c:unb', 'vals': ['x:d']},
        {'reg': 'item', 'kind': 'remove', 'tag': 'c:unb', 'vals': ['x:b']},
        {'reg': 'item', 'kind': 'add', 'tag': 'c:by_mod', 'vals': ['@m']},
        {'reg': 'item', 'kind': 'removeAll', 'tag': 'c:salt', 'vals': []},
        {'reg': 'fluid', 'kind': 'add', 'tag': 'c:f', 'vals': ['x:fl1', 'x:no_fl']},
        {'reg': 'block', 'kind': 'add', 'tag': 'b:t', 'vals': ['@m']},
    ]}
    _fl1 = E.apply_kjs_tags(_td, _ex, [], _kjs1)
    _snap1 = (dict(_td['item']), dict(_td['block']), dict(_td['fluid']), dict(_td.get('kjs_orig', {})))
    _fl2 = E.apply_kjs_tags(_td, _ex, [], _kjs1)   # повторний виклик — 100% ідемпотентний
    _snap2 = (dict(_td['item']), dict(_td['block']), dict(_td['fluid']), dict(_td.get('kjs_orig', {})))
    _kjs2 = {'tags': [{'reg': 'item', 'kind': 'add', 'tag': 'c:only2', 'vals': ['x:d']}]}
    _fl3 = E.apply_kjs_tags(_td, _ex, [], _kjs2)   # новий набір операцій — старі правки відкотились із kjs_orig
    CASES += [
        (_snap1[0].get('c:niter'), ['x:s1'], 'Д2: KubeJS add з #вкладеним тегом і фільтром реєстру (x:ghost відкинуто)'),
        (_snap1[0].get('c:unb'), ['x:a', 'x:c', 'x:d'], 'Д2: KubeJS add + remove на існуючому тезі'),
        (_snap1[0].get('c:by_mod'), ['m:i1', 'm:i2'], 'Д2: KubeJS @мод розкривається за реєстром'),
        (_snap1[0].get('c:salt'), [], 'Д2: KubeJS removeAll очищує тег'),
        (_snap1[2].get('c:f'), ['x:fl1'], 'Д2: KubeJS тег рідин фільтрується за реєстром рідин'),
        (_snap1[1].get('b:t'), ['m:b1', 'x:b1'], 'Д2: KubeJS тег блоків з @мод'),
        (sorted(_fl1), ['c:by_mod', 'c:niter', 'c:salt'], 'Д2: flipped повертає теги, що перейшли порожній ↔ непорожній'),
        (_snap2, _snap1, 'Д2: apply_kjs_tags ідемпотентний при повторному виклику'),
        ((_td['item'].get('c:niter'), _td['item'].get('c:salt'), _td['item'].get('c:unb'), _td['item'].get('c:only2')),
         (None, ['x:s1'], ['x:a', 'x:b', 'x:c'], ['x:d']), 'Д2: apply_kjs_tags відкочує попередній KubeJS із kjs_orig перед новим накладанням'),
        (sorted(E.tag_empty_refs({'neoforge:conditions': [{'type': 'neoforge:and', 'values': [{'type': 'neoforge:not', 'value': {'type': 'neoforge:tag_empty', 'tag': 'c:dusts/niter'}}, {'type': 'neoforge:tag_empty', 'tag': '#c:other'}]}]})),
         ['c:dusts/niter', 'c:other'], 'Д2: tag_empty_refs знаходить усі теги вкладених умов neoforge:tag_empty'),
    ]
    # K32 (додаток): поширення KubeJS-додавань угору в батьківські jar-теги (транзитивно, без циклів, із повагою до remove/removeAll)
    _tdp = {
        'item': {'c:ch': ['x:a'], 'c:par': ['x:a'], 'c:grand': [], 'c:excl': ['x:a'], 'c:clr': ['x:a'], 'c:cyc1': [], 'c:cyc2': []},
        'block': {}, 'fluid': {}, 'src': {},
        'parents': {'item': {'c:ch': ['c:par', 'c:excl', 'c:clr'], 'c:par': ['c:grand'], 'c:cyc1': ['c:cyc2'], 'c:cyc2': ['c:cyc1']}, 'block': {}, 'fluid': {}},
    }
    _exp = {'item': {'x:a', 'x:b', 'x:c'}, 'block': set(), 'fluid': set()}
    _kjsp = {'tags': [
        {'reg': 'item', 'kind': 'add', 'tag': 'c:ch', 'vals': ['x:b', 'x:c']},
        {'reg': 'item', 'kind': 'remove', 'tag': 'c:excl', 'vals': ['x:b']},
        {'reg': 'item', 'kind': 'removeAll', 'tag': 'c:clr', 'vals': []},
        {'reg': 'item', 'kind': 'add', 'tag': 'c:cyc1', 'vals': ['x:b']},
    ]}
    _flp = E.apply_kjs_tags(_tdp, _exp, [], _kjsp)
    _snapp1 = dict(_tdp['item'])
    E.apply_kjs_tags(_tdp, _exp, [], _kjsp)   # ідемпотентність з parents
    _snapp2 = dict(_tdp['item'])
    E.apply_kjs_tags(_tdp, _exp, [], {'tags': []})   # відкат усіх батьків із kjs_orig
    CASES += [
        (_snapp1.get('c:par'), ['x:a', 'x:b', 'x:c'], 'Д2: батьківський jar-тег отримує предмети, додані KubeJS у дочірній тег'),
        (_snapp1.get('c:grand'), ['x:b', 'x:c'], 'Д2: транзитивне поширення KubeJS-додавань на 2 рівні вгору (grand ← par ← ch)'),
        (_snapp1.get('c:excl'), ['x:a', 'x:c'], 'Д2: явний remove на батьківському тезі захищає предмет від повторного додавання з дитини'),
        (_snapp1.get('c:clr'), [], 'Д2: removeAll на батьківському тезі не відновлює старі jar-зв\'язки з дітьми'),
        ((_snapp1.get('c:cyc1'), _snapp1.get('c:cyc2')), (['x:b'], ['x:b']), 'Д2: цикл батьківських тегів не зациклює поширення'),
        ('c:grand' in _flp, True, 'Д2: flipped фіксує батьківський тег, що перестав бути порожнім через дочірній'),
        (_snapp2, _snapp1, 'Д2: поширення на батьківські теги ідемпотентне'),
        ((_tdp['item'].get('c:par'), _tdp['item'].get('c:grand'), _tdp['item'].get('c:excl')), (['x:a'], [], ['x:a']), 'Д2: відкат із kjs_orig чисто повертає і батьківські теги'),
    ]
else:
    CASES += [(False, True, 'Д2: extract_recipes.apply_kjs_tags і tag_empty_refs ще не реалізовано')]
bad = [(why, got, want) for got, want, why in CASES if got != want]
for why, got, want in bad: print(f'❌ {why}: {got} ≠ {want}')
print(f'Розбір записів рецептів: {len(CASES) - len(bad)} з {len(CASES)}')
sys.exit(1 if bad else 0)
