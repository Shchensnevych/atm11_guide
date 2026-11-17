# Перевірка знімка назв з гри (K5): extract_game_names.normalize (що беремо з файла гри) і build_names.apply_game (як назва з гри
# лягає поверх назв з перекладу). Запуск з atm11_guide: python3 -I tools/check_game_names.py
# Правила — за формою запису (назви немає / назва-шаблон / збіг / розбіжність), не за модом чи предметом.
import os, sys, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import extract_game_names as E, build_names as B

GOOD = {'v': 1, 'ts': 1, 'lang': 'uk_ua', 'total': 6, 'count': 4, 'untranslated': 1, 'errors': 1,
        'names': {'a:red_cable': ' Червоний  кабель ', 'a:amulet': '§6Амулет: вогню', 'a:stick': 'Палиця', 'minecraft:potion': 'Зілля без ефекту', 'Bad Id': 'x', 'a:num': 5},
        'base': {'minecraft:potion': ['Зілля', 'item.minecraft.potion'], 'a:red_cable': ['Кабель', 'block.a.cable'], 'a:broken': 'x'},
        'no_name': ['a:raw'], 'failed': ['a:boom']}
CASES = []
def case(got, want, why): CASES.append((got, want, why))

n, why = E.normalize(GOOD)
case(why, None, 'добрий файл приймається')
case(n and n['names'], {'a:amulet': 'Амулет: вогню', 'a:red_cable': 'Червоний кабель', 'a:stick': 'Палиця', 'minecraft:potion': 'Зілля без ефекту'}, 'назви: коди кольору й зайві пробіли прибрано, не-id і не-рядки відкинуто, за абеткою')
case(n and list(n['names']), sorted(n['names']) if n else None, 'порядок сталий (без шуму в git)')
case(n and n['base'], {'a:red_cable': ['Кабель', 'block.a.cable'], 'minecraft:potion': ['Зілля', 'item.minecraft.potion']}, 'base: лише пари [переклад, ключ]')
case(n and (n['lang'], n['total'], n['no_name'], n['failed']), ('uk_ua', 6, ['a:raw'], ['a:boom']), 'службові поля збережено')
case(n and 'ts' in n, False, 'часу запису в знімку немає (інакше файл змінюється щозапуску гри)')
case(E.normalize({**GOOD, 'lang': 'en_us'})[0], None, 'інша мова гри — не беремо')
case(E.normalize({**GOOD, 'lang': ''})[0], None, 'мову не визначено — не беремо')
case(E.normalize({**GOOD, 'names': {}})[0], None, 'порожній перелік — не беремо')
case(E.normalize([1, 2])[0], None, 'не об\'єкт — не беремо')
case(E.normalize({**GOOD, 'total': 100000})[0], None, 'обхід неповний (назв значно менше, ніж предметів) — не беремо')

k = E.keep_lost({'names': {'a:x': 'Ікс'}, 'no_name': ['a:lost', 'a:never'], 'count': 1, 'untranslated': 2}, {'names': {'a:lost': 'Порошок', 'a:gone': 'Зник', 'a:x': 'Старе'}})
case((k['names'], k['no_name'], k['count'], k['untranslated']), ({'a:lost': 'Порошок', 'a:x': 'Ікс'}, ['a:never'], 2, 1), 'гра цього разу показала ключем, а назва була — лишається; предмета вже немає — зникає; нова назва виграє')
case(E.keep_lost({'names': {'a:x': 'Ікс'}, 'no_name': ['a:n'], 'count': 1, 'untranslated': 1}, None)['names'], {'a:x': 'Ікс'}, 'першого знімка нема з чим зливати')
items = {'a:template_trim': ['Ковальський шаблон', 'Smithing Template'], 'a:stick': ['Палиця', 'Stick'], 'a:amulet': ['Амулет: %s', 'Amulet: %s'],
         'a:sulfur_x': ['Сірка %s', 'Sulfur %s'], 'a:sulfur_y': ['Сірка %s', 'Sulfur %s'], 'a:tpl_block': ['%s', '', 'b'], 'minecraft:potion': ['Зілля', 'Potion'],
         'a:block_only': ['Блок', 'Block', 'b'], 'a:not_in_game': ['Привид', 'Ghost']}
game = {'lang': 'uk_ua', 'names': {'a:sulfur_x': 'Сірка [Ікс]', 'a:sulfur_y': 'Сірка [Ігрек]', 'a:red_cable': 'Червоний кабель', 'a:amulet': 'Амулет: вогню', 'a:tpl_block': 'Верстак', 'a:stick': 'Палиця', 'a:template_trim': 'Орнамент «Берег»',
                                    'minecraft:potion': 'Зілля без ефекту', 'a:block_only': 'Блок'}, 'base': {'minecraft:potion': ['Зілля', 'item.minecraft.potion']}}
before = copy.deepcopy(items)
st = B.apply_game(items, game)
case(items.get('a:red_cable'), ['Червоний кабель'], 'назви в перекладі немає → назва з гри')
case(items['a:amulet'], ['Амулет', 'Amulet'], 'шаблон лише в одного предмета → назва без підстановки (типовий екземпляр дає випадковий варіант), англійська так само')
case((items['a:sulfur_x'], items['a:sulfur_y']), (['Сірка [Ікс]'], ['Сірка [Ігрек]']), 'той самий шаблон у кількох предметів → назва з гри; англійський шаблон не лишається')
case(items['a:tpl_block'], ['Верстак', '', 'b'], 'назва — сам шаблон «%s» → назва з гри, позначка блока лишається')
case(items['a:stick'], before['a:stick'], 'збіг — запис без змін (англійська назва лишається)')
case(items['a:block_only'], before['a:block_only'], 'збіг у блока — без змін')
case(items['a:not_in_game'], before['a:not_in_game'], 'предмета немає в знімку — без змін')
case(items['minecraft:potion'], before['minecraft:potion'], 'розбіжність, переклад ключа предмета в грі = база → лишається назва предмета, не стану екземпляра')
case(items['a:template_trim'], ['Орнамент «Берег»'], 'розбіжність без base (гра показує переклад свого ключа) → назва з гри')
case((st['added'], st['template'], st['kind'], st['same'], len(st['differs'])), (1, 3, 1, 2, 2), 'лічильники: додано / шаблонів / збіглося / розбіжностей')
case(sorted(st['differs']), [('a:template_trim', 'Ковальський шаблон', 'Орнамент «Берег»', 'game'), ('minecraft:potion', 'Зілля', 'Зілля без ефекту', 'base')], 'розбіжності — переліком для звіту, з рішенням')
for args, want, why in (((None, 'Гра', None), ('Гра', 'added'), 'pick: назви немає'), (('Те', 'Те', None), ('Те', 'same'), 'pick: збіг'),
                        (('Амулет: %s', 'Амулет: вогню', 'Амулет: %s'), ('Амулет', 'kind'), 'pick: шаблон одного предмета'), (('Сірка %s', 'Сірка [Ікс]', None, {'Сірка %s'}), ('Сірка [Ікс]', 'template'), 'pick: спільний шаблон'),
                        (('Човен (%s) зі сховищем: %s', 'Човен () зі сховищем:', None), ('Човен зі сховищем', 'kind'), 'pick: шаблон з дужками'),
                        (('Зілля', 'Пляшка води', 'Зілля'), ('Зілля', 'base'), 'pick: стан екземпляра'), (('Шаблон', 'Орнамент', None), ('Орнамент', 'game'), 'pick: не той ключ'),
                        (('Назва', None, None), ('Назва', 'none'), 'pick: гра назви не дала')):
    case(B.pick(*args), want, why)
it2 = copy.deepcopy(before)
case((B.apply_game(it2, None), it2), ({}, before), 'знімка немає — назви як були')

QGOOD = {'v': 1, 'ts': 1, 'lang': 'uk_ua', 'quests_total': 2, 'errors': 0, 'tasks': {'00000000000000B2': ' Зілля  стрибучості ', '00000000000000A1': '§eКамʼяна доба', 'bad': 'x', '00000000000000C3': ''},
         'rewards': {'00000000000000D4': '3x Діамант'}, 'tables': {'00000000000000E5': ['Рядок 1', 5, ' Рядок  3 '], 'zz': ['x']}}
q, why = E.normalize_quests(QGOOD)
case(why, None, 'добрий файл заголовків квестів приймається')
case(q and q['tasks'], {'00000000000000A1': 'Камʼяна доба', '00000000000000B2': 'Зілля стрибучості'}, 'завдання: лише коди квестів, без кодів кольору, порожні відкинуто, сталий порядок')
case(q and list(q['tasks']), ['00000000000000A1', '00000000000000B2'], 'порядок завдань сталий')
case(q and q['rewards'], {'00000000000000D4': '3x Діамант'}, 'нагороди — як показує гра')
case(q and q['tables'], {'00000000000000E5': ['Рядок 1', '', 'Рядок 3']}, 'таблиці: рядки за порядком, нерядок — порожньо (порядок рядків не зсувається)')
case(q and 'ts' in q, False, 'часу запису в знімку квестів немає')
case(E.normalize_quests({**QGOOD, 'lang': 'en_us'})[0], None, 'заголовки квестів іншою мовою — не беремо')
case(E.normalize_quests({**QGOOD, 'tasks': {}})[0], None, 'заголовків завдань немає — не беремо')
case(E.normalize_quests({'names': {}})[0], None, 'чужий файл — не беремо')

case(E.registry_ids(n), {'a:amulet', 'a:red_cable', 'a:stick', 'minecraft:potion', 'a:raw', 'a:boom', 'minecraft:air'}, 'реєстр гри: предмети з назвою, без назви, ті, що не прочитались, і порожній предмет, який обхід пропускає')
case(E.registry_ids(None), None, 'знімка немає — реєстру гри немає (а не порожній реєстр)')
case(E.registry_ids({'names': {}}), None, 'знімок без назв — не реєстр')

# K7: реєстр і назви рідин — той самий формат файла гри й ті самі правила, що для предметів
FGOOD = {'v': 1, 'ts': 1, 'lang': 'uk_ua', 'total': 7, 'count': 4, 'untranslated': 1, 'errors': 1, 'alt': 1,
         'names': {'minecraft:water': 'Вода', 'minecraft:flowing_water': 'Вода', 'x:molten': ' Розплав ', 'x:xp': '§aДосвід'}, 'base': {}, 'no_name': ['x:raw'], 'failed': ['x:boom']}
f, why = E.normalize(FGOOD, 'рідин')
case(why, None, 'добрий файл рідин приймається')
case(f and f['names'], {'minecraft:flowing_water': 'Вода', 'minecraft:water': 'Вода', 'x:molten': 'Розплав', 'x:xp': 'Досвід'}, 'назви рідин: та сама чистка, що й для предметів')
case(E.registry_ids(f, E.EMPTY_FLUID), {'minecraft:water', 'minecraft:flowing_water', 'x:molten', 'x:xp', 'x:raw', 'x:boom', 'minecraft:empty'}, 'реєстр рідин гри: з назвою, без назви, не прочитані й порожня рідина (не порожній предмет)')
case('рідин' in (E.normalize({**FGOOD, 'total': 100000}, 'рідин')[1] or ''), True, 'неповний обхід рідин — відмова з поясненням про рідини')
tsv = {'x:molten': ['Розплавлене', 'Molten'], 'x:xp': ['Досвід', 'Experience'], 'x:raw': ['Сирець', 'Raw'], 'x:type_only': ['Тип', 'Type']}
case(B.fluid_names(tsv, f), {'minecraft:water': ['Вода'], 'minecraft:flowing_water': ['Вода'], 'x:molten': ['Розплав'], 'x:xp': ['Досвід', 'Experience'], 'x:raw': ['Сирець', 'Raw']},
     'назви рідин: реєстр — знімок гри; назви немає → з гри, розбіжність → з гри, збіг → як є; гра показує ключем, а переклад є → з перекладу; ключ перекладу без рідини в грі — не рідина')
case(B.fluid_names(tsv, None), tsv, 'знімка рідин немає — назви з ключів перекладу, як є')
fl = {'minecraft:water': ['Вода'], 'minecraft:flowing_water': ['Вода'], 'x:oxygen': ['Кисень'], 'a:acid': ['Кислота', 'Acid'], 'x:molten': ['Розплав']}
case(B.fluid_tag_names({'c:molten': ['x:molten'], 'c:water': ['minecraft:flowing_water', 'minecraft:water'], 'minecraft:water': ['x:oxygen', 'a:acid', 'minecraft:water', 'minecraft:flowing_water'],
                        'c:empty': [], 'c:half': ['x:molten', 'x:nameless']}, fl),
     {'c:molten': ['Розплав'], 'c:water': ['Вода'], 'minecraft:water': ['Вода', 'Кисень', 'Кислота']},
     'назви груп рідин: одна назва на всі рідини групи (джерело й течія — одна); різні — ванільна першою, далі за абеткою; порожню групу й групу з рідиною без назви не називаємо')
case(B.fluid_tag_names(None, fl), {}, 'індексу тегів немає — груп рідин не називаємо')

# K19: знімок зачарувань з гри — перевірка (extract_game_names.normalize_enchantments) і база (build_enchantments.build)
import build_enchantments as BE
EGOOD = {'v': 1, 'ts': 5, 'lang': 'uk_ua', 'fingerprint': 'fp1', 'mods': 3, 'items_total': 10, 'total': 3, 'errors': 0,
         'enchantments': [
             {'id': 'b:sharp', 'name': ' §bГострота ', 'desc': 'Більше  шкоди', 'max_level': 5, 'supported': {'tag': 'c:weapons'}, 'primary': {'tag': 'c:swords'}, 'exclusive': ['a:smite', 'Bad'], 'tags': ['minecraft:in_enchanting_table', 'minecraft:tradeable']},
             {'id': 'a:smite', 'name': 'Кара', 'max_level': 5, 'supported': {'items': ['a:sword', 'a:axe', 'Bad']}, 'exclusive': ['b:sharp'], 'tags': ['minecraft:treasure', 'minecraft:curse']},
             {'id': 'a:noname', 'name': '', 'supported': {'tag': 'c:weapons'}}, {'id': 'Bad Id', 'name': 'x', 'supported': {'tag': 'c:weapons'}}],
         'tag_sets': {'c:weapons': ['a:sword', 'a:axe', 'a:sword'], 'c:swords': ['a:sword'], 'Bad': ['a:x']},
         'code_check': {'state': 'done', 'fingerprint': 'fp1', 'checks': 30, 'items': 10, 'adds_n': 1, 'removes_n': 1, 'adds': [['b:sharp', 'a:book']], 'removes': [['b:sharp', 'a:axe'], ['Bad', 'a:axe']]}}
en, why = E.normalize_enchantments({**EGOOD, 'total': 2})
case(why, None, 'добрий файл зачарувань приймається')
case(en and [x['id'] for x in en['enchantments']], ['a:smite', 'b:sharp'], 'зачарування — за id, без назви й не-id — відкинуто')
case(en and en['enchantments'][1]['name'], 'Гострота', 'назва: коди кольору й пробіли прибрано')
case(en and en['enchantments'][1]['exclusive'], ['a:smite'], 'несумісні — лише id')
case(en and en['tag_sets'], {'c:swords': ['a:sword'], 'c:weapons': ['a:axe', 'a:sword']}, 'склад тегів — без повторів, за абеткою, без не-id')
case(en and en['code_check']['removes'], [['b:sharp', 'a:axe']], 'поправки коду — лише пари id')
case(en and 'ts' in en, False, 'часу запису в знімку немає')
case(E.normalize_enchantments(EGOOD)[0], None, 'прочитано менше зачарувань, ніж у реєстрі, — не беремо')
case(E.normalize_enchantments({**EGOOD, 'total': 4, 'errors': 2})[1], None, 'зачарування, що не прочиталось у грі (errors), не відкидає знімок')
case(E.normalize_enchantments({**EGOOD, 'lang': 'en_us'})[0], None, 'інша мова гри — не беремо')
case(E.normalize_enchantments({**EGOOD, 'total': 2, 'code_check': {'state': 'done', 'fingerprint': 'старий'}})[0]['code_check'], {'state': 'pending'}, 'перевірка кодом іншого відбитка збірки — не про цю збірку')
pend, _ = E.normalize_enchantments({**EGOOD, 'total': 2, 'code_check': {'state': 'pending', 'fingerprint': 'fp1'}})
case(E.keep_code_check(copy.deepcopy(pend), en)['code_check'], en['code_check'], 'перевірка ще йде — лишається попередня того самого відбитка')
case(E.keep_code_check(copy.deepcopy(pend), {**en, 'fingerprint': 'інший'})['code_check'], {'state': 'pending'}, '…але не іншого відбитка')
rep = []
r = BE.build(rep.append, False, en, {'items': {'a:sword': 1, 'a:axe': 1}})
case(r, {'enchantments': 2, 'code': 'done'}, 'база зачарувань будується зі знімка')
w0 = []
BE.build(w0.append, False, {'enchantments': []}, {})
case(bool(w0) and 'game_enchantments' in w0[0], True, 'знімка немає — попередження, база не змінюється')
import json as _json
_tmp = {}
_orig = BE.jsave
BE.jsave = lambda p, d, compact=False: _tmp.update(d=d)
BE.build([].append, True, en, {'items': {'a:sword': 1, 'a:axe': 1}})
BE.jsave = _orig
sh = next(x for x in _tmp['d']['enchantments'] if x['id'] == 'b:sharp')
case((sh.get('table'), sh.get('tradeable'), sh.get('treasure'), sh.get('code_adds'), sh.get('code_removes')), (True, True, None, ['a:book'], ['a:axe']), 'ознаки з тегів зачарування й поправки коду — у записі зачарування')
sm = next(x for x in _tmp['d']['enchantments'] if x['id'] == 'a:smite')
case((sm.get('treasure'), sm.get('curse'), sm['supported']), (True, True, {'items': ['a:axe', 'a:sword']}), 'скарб / прокляття; перелік предметів')

bad = [(why, got, want) for got, want, why in CASES if got != want]
for why, got, want in bad: print(f'❌ {why}: {got!r} ≠ {want!r}')
print(f'Знімок назв з гри: {len(CASES) - len(bad)} з {len(CASES)}')
sys.exit(1 if bad else 0)
