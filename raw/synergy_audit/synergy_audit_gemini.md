# Незалежний аудит усіх 165 синергій модів All the Mods 11 (Minecraft 26.1.2)

**Дата аудиту:** 06 листопада 2026  
**Методологія:** Повний паралельний машинний та семантичний аудит синергій 5 дослідницькими субагентами (модель Gemini 3.8 Flash). Кожна синергія перевірена на фізичних файлах збірки:
- JAR-архіви модифікацій у теці `mods/`
- Скрипти KubeJS у `kubejs/server_scripts/`, `startup_scripts/`, `dynamic_data/`
- Конфігурації модів `config/`
- Квести FTB Quests `config/ftbquests/`
- База українських назв `names.json` (збірки перекладу)

---

## 📊 Підсумкова статистика по всій збірці (165 синергій)

| Метрика | Кількість | Відсоток | Опис |
|---|:---:|:---:|---|
| **Всього перевірено** | **165** | 100% | Усі синергії з `atm11_guide/docs/data/mods.json` |
| ✅ **Повністю точно** | **136** | **82.4%** | Реальні механіки, точні посилання `ref`, правильна термінологія |
| ⚠️ **Дрібні зауваження** | **27** | **16.4%** | Розбіжність з офіційними назвами `names.json`, стилістика перекладу, уточнення шляхів KubeJS |
| ❌ **Критичні помилки** | **2** | **1.2%** | Неіснуючі в 1.21.1 або неправильно атрибутовані моди |
| ⚑ **Рекомендовано позначку «в грі»** | **9** | **5.5%** | Залежить від рантаймових тегів NBT, клієнтських налаштувань або динамічної генерації |

---

## 🚨 КРИТИЧНІ ПОМИЛКИ (Вимагають виправлення в базі даних)

1. **`enderio` ➔ `refinedstorage` (Батч 2, #5)**
   - **Опис у базі:** «Ізольовані та щільні рідинні кабелі Ender IO передають рідини...» / посилання на `enderio:rs_conduit`.
   - **Реальність у збірці:** У версії Ender IO 9.0.6-alpha для 1.21.1 інтеграція з Refined Storage відсутня! Предмета `enderio:rs_conduit` немає в коді мода, як і модуля RS-провідників. Ця синергія є застарілою спадщиною старих версій Minecraft (1.12/1.20) і в ATM11 не працює.
   - **Рекомендація:** Вилучити синергію або замінити на актуальні провідники Ender IO (AE2 ME Conduits або Item/Fluid/Energy).

2. **`inworldrecipes` ➔ `occultism` (Батч 3, #10)**
   - **Опис у базі:** Описує жезли (wands) та руди GeOre у зв'язку з InWorldRecipes.
   - **Реальність у збірці:** Мод `inworldrecipes` не має власних жезлів! Усі жезли та рецепти дроблення є кастомними KubeJS-елементами для мода `geore` та окультизму.
   - **Рекомендація:** Перенести синергію на пару `geore` ➔ `occultism` (`modpack/geore.js`).

---

## ⚑ СИНЕРГІЇ, ЯКІ РЕКОМЕНДОВАНО ПОЗНАЧИТИ «ПЕРЕВІРИТИ В ГРІ»

1. **`forbidden_arcanus` ➔ `allthemodium` (#22, Батч 2):** Кузня Гефеста в 1.21.1 змінила структуру есенцій: ключ `souls` замінено на `ectoplasm` (Soul/Ectoplasm). Рецепт розбирається парсером, але спавн душ потребує підтвердження в грі.
2. **`forbidden_arcanus` ➔ `productivebees` (#23, Батч 2):** Аналогічно, душі від бджіл для Кузні Гефеста в 1.21.1.
3. **`cobblegengalore` ➔ `allthemodium` (#20, Батч 3):** Генератор вимагає Лаву Душ (`allthemodium:soul_lava`) як рідкий блок над генератором. Потребує перевірки встановлення в світі.
4. **`potionsmaster` ➔ `allthemodium` (#14, Батч 4):** Порошки та зілля генеруються в коді мода динамічно за тегами `c:ores` / `c:ingots`. У статичних JSON-файлах рецептів немає, тому сито/парсер їх не бачить, хоча в грі вони є.
5. **`silentgear` ➔ `apotheosis` (#17, Батч 5):** Модульні інструменти Silent Gear із кастомними NBT можуть некоректно взаємодіяти з афіксами Apotheosis (ковані самоцвіти). Потрібна візуальна перевірка в грі.
6. **`undergarden` ➔ `allthemodium` (#28, Батч 5):** Руйнування твердого каменя Dregrock кирками з Allthemodium.
7. **`jade` ➔ `jei` (#15, Батч 3) & `moreoverlays` ➔ `jei` (#21, Батч 3):** Візуальний оверлей та гарячі клавіші (клієнтські механіки).
8. **`occultism` ➔ `evilcraft` (#28, Батч 3):** Специфічна взаємодія сутностей душ та кров'яних вівтарів.

---

## 📝 ОСНОВНІ ТЕРМІНОЛОГІЧНІ УТОЧНЕННЯ (За словником `names.json`)
- **Блакитне vs Лазурне:** У `names.json` метал перекладено як *«Злиток блакитного срібла/електруму»* (`azure_silver` / `azure_electrum`), а не «лазурне».
- **Кристалічний вівтар насичення:** У `names.json` блок називається *«Вівтар насичення»* (`evilcraft:sanguinary_pedestal`), слово «Кристалічний» є зайвим нашаруванням.
- **Вівтар світла:** *«Вівтар освітлення»* (`astralsorcery` / `forbidden_arcanus`).
- **Троянда візера:** В офіційному перекладі — *«Нев'януча троянда»* (`reliquary:witherless_rose`) та *«Висушена душа»* (`withering_soul`).

---

# Повні звіти субагентів по батчах



---

# Звіт аудиту синергій модів All the Mods 11 (Minecraft 26.1.2) — Батч 1 (33 синергії)

Було проведено поглиблену перевірку всіх 33 синергій з файлу `batch_1.json` шляхом прямого аналізу файлів збірки: jar-архівів модів, рецептів KubeJS (`server_scripts`), конфігурацій (`config/`), квестів FTB Quests та офіційної локалізаційної бази `names.json`.

---

## Загальна статистика батчу 1
- **Всього перевірено:** 33 синергії
- ✅ **Точно (повна відповідність ref, назв та механік):** 28
- ⚠️ **Дрібні зауваження (термінологія за `names.json`, неповний опис або неточний тег):** 5
- ❌ **Грубі помилки / фейкові синергії:** 0

*Висновок:* Усі заявлені зв'язки в батчі є реальними та підтвердженими кодом або рецептами збірки. Жодної вигаданої механіки чи неіснуючих рецептів не виявлено.

---

## Детальний перелік та аналіз усіх 33 синергій

| № | Пара (`from -> to`) | Статус | Аналіз та зауваження |
|---|---|:---:|---|
| 1 | `ae2importexportcard` -> `ae2wtlib` | ✅ Точно | Клас `com/ultramega/ae2importexportcard/compat/ae2wtlib/Ae2WtlibUtil.class` підтверджено в jar. Він безпосередньо звертається до `de/mari_023/ae2wtlib/api/terminal/WTMenuHost`, забезпечуючи роботу карток у бездротових терміналах. |
| 2 | `aether_ii` -> `agritechevolved` | ⚠️ Дрібні зауваження | **Підтверджено:** обидва рецепти вирощування існують у jar AgriTech Evolved.<br>⚠️ **Зауваження до тексту:**<br>1) «Садівники» -> у `names.json` блок зветься **«Садильник»** (`agritechevolved:*_planter`).<br>2) «папороть Етеру» -> за `names.json` предмет `aether_ii:aether_fern` перекладено як **«Етерна папороть»**. |
| 3 | `agritechevolved` -> `mysticalagriculture` | ✅ Точно | **Ідеальне підтвердження:** у jar рівно **142** json-рецепти культур Mystical Agriculture (`planter/crop/mysticalagriculture/*`). Рецепт `nether_star_seeds.json` вимагає основу `mysticalagradditions:nether_star_crux` у слоті ґрунту. Тег `agritechevolved:ma_tier1_soils` присутній. |
| 4 | `agritechevolved` -> `croptopia` | ✅ Точно | Підтверджено: у jar присутні 58 рецептів для насіння та культур Croptopia (зокрема `artichoke_seed.json`). |
| 5 | `allthecompressed` -> `cobblegengalore` | ✅ Точно | Підтверджено: рецепт нескінченного кругляка `cobblegengalore:blockgen/cobblestone` та стиснення `allthecompressed:compress/cobblestone_1x` існують. Термін «генератор блоків» відповідає `names.json`. |
| 6 | `allthemodium` -> `silentgear` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/allthemodium/recipes.js` (L6) прописані ковальські рецепти пластин Silent для всіх трьох металів; матеріал зареєстровано в `kubejs/dynamic_data/silentgear/silentgear_materials/allthemodium.json`. |
| 7 | `allthemodium` -> `mysticalcustomization` | ✅ Точно | Підтверджено: конфіг `config/mysticalcustomization/crops/allthemodium.json` має рівень `magical` та crux `kubejs:magical_soil` («Чарівний ґрунт»). У `fusion_crafting.js` функція `essenceCircle` створює рецепти крафту есенцій у самородки. |
| 8 | `allthemodium` -> `productivebees` | ✅ Точно | Підтверджено: рецепти центрифуги для стільників ATM-металів у jar PB; у `recipes.js` (L6) рецепт `productivelib:upgrade_productivity_4` («Покращення: продуктивність омега») використовує `#c:nuggets/unobtainium`; квест `6EFFF0DC80C1C8A3` націлений на стільник усемодію. |
| 9 | `alltheores` -> `allthemodium` | ✅ Точно | Підтверджено: у jar AllTheModium є 17 біом-модифікаторів для виміру «Вимір видобутку» (`allthemodium:mining`), що генерують руди AllTheOres. Назва виміру в `names.json` збігається. |
| 10 | `alltheores` -> `enderio` | ✅ Точно | Підтверджено: у jar AllTheOres містяться рецепти типу `enderio:alloy_smelting` для латуні, бронзи, сталі, інвару, електруму, константану, люмію, сигналію та ендерію. |
| 11 | `alltheores` -> `theurgy` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/theurgy/incubation.js` рецепт інкубації видає `alltheores:salt_dust` («Сольовий пил») та `alltheores:sulfur_dust` («Сірчаний пил»). |
| 12 | `allthetweaks` -> `allthecompressed` | ✅ Точно | Підтверджено: рецепт `allthemods:allthetweaks/dimensional_seed` у `att_items.js` містить саме зазначені блоки: незерак 6x, ґрунт 6x, обсидіан 5x, камінь Енду 5x, смарагдовий 4x, діамантовий 4x. |
| 13 | `allthetweaks` -> `mysticalagradditions` | ✅ Точно | Підтверджено: рецепт `allthemods:allthetweaks/creative_essence` у `att_items.js` створює творчу есенцію з блоків інсанію, блоків інсанієвих самоцвітів та майстерського кристала наповнення. Назви за `names.json` точні. |
| 14 | `apotheosis` -> `apothic_enchanting` | ⚠️ Дрібні зауваження | **Підтверджено:** клас `ApothicEnchantingCompat` у jar; рецепт `raven_enchanting_table.json`; модифікатори рівнів світу (`tier_augments/*/max_eterna.json`) зменшують штраф до максимальної Етерни з -70 (Haven) до -25 (Summit), тобто підвищують ліміт.<br>⚠️ **Зауваження до тексту:** у базі `names.json` предмет `apotheosis:god_fused_pearl` має офіційну назву **«Богозлита перлина»** (замість описового «боготворена злита перлина»). |
| 15 | `apotheosis` -> `apothic_spawners` | ✅ Точно | Підтверджено: клас `ApothicSpawnersCompat` у jar; рецепти модифікаторів спавнера (зокрема `spawner_modifiers/burning.json`) використовують руни спавнера Apotheosis. |
| 16 | `apothic_enchanting` -> `allthetweaks` | ✅ Точно | Підтверджено: у `mini_portals.js` міні-портали використовують `sightshelf_t2` («Пеклополиця майстерного погляду»), `endshelf`, `draconic_endshelf`, `soul_touched_sculkshelf` та `infused_breath`. Назви точні. |
| 17 | `apothic_enchanting` -> `enchdesc` | ✅ Точно | Підтверджено: у jar Apothic Enchanting є ключі `enchantment.apothic_enchanting.*.desc` для всіх 24 чар, які зчитує мод Enchantment Descriptions у підказках. |
| 18 | `apothic_spawners` -> `apothic_enchanting` | ✅ Точно | Підтверджено: рецепт `infused_spawner_rune.json` є рецептом типу `apothic_enchanting:infusion` (потребує 70 eterna, 50 arcana, 30 quanta). Квести `77A8E8122870BBCE` (окультний повідець Енду) та `503AC506720FC59E` (просякнена руна породжувача) підтверджені. Чари «Захоплення» (Capturing) наявні. |
| 19 | `appliedsticks` -> `constructionstick` | ✅ Точно | Підтверджено: клас `AppliedSticksContainerRegistrar` реєструє обробник `HandlerAE2` у `ContainerManager` мода Construction Stick, забезпечуючи взяття блоків з ME. |
| 20 | `aquaculture` -> `mysticalcustomization` | ✅ Точно | **Ідеальне підтвердження:** у файлі `config/mysticalcustomization/configure-mobsoultypes.json` під ключем `mysticalagriculture:fish` у список `entities.add` додано рівно **28** видів риб з Aquaculture. Назва «Банка для душ» точна. |
| 21 | `arsmagicalegacy` -> `integrateddynamics` | ✅ Точно | Підтверджено: у `recipes_fix.js` (L185-339) для версії arsmagicalegacy 1.7.0 додано 10 рецептів для витискача та механічного витискача. Усі 5 назв квітів («Пустельна нова», «Церуцвіт», «Аум», «Корінь тарми», «Пробудоцвіт») на 100% збігаються з `names.json`. |
| 22 | `artifacts` -> `curios` | ✅ Точно | Підтверджено: класи `CuriosCompat` у jar мода Artifacts та теги слотів Curios (`belt.json` тощо). |
| 23 | `artifacts` -> `lootr` | ✅ Точно | Підтверджено: клас `LootrCompat.class` у jar Artifacts. Таблиці луту підхоплюються індивідуальними скринями Lootr. (Дрібниця: бракує крапки в кінці речення). |
| 24 | `bhc` -> `curios` | ⚠️ Дрібні зауваження | **Механіка вірна:** амулети відкривають сховище контейнерів сердець і одягаються в Curios.<br>⚠️ **Помилка в `ref`:** зазначено `tag:curios:necklace`, проте Baubley Heart Canisters не використовує слот намиста! Мод створює власний слот і тег **`curios:heart_amulet`** (`data/bhc/curios/slots/heart_amulet.json`, `data/curios/tags/item/heart_amulet.json`). Рекомендується виправити `ref` на `tag:curios:heart_amulet`. |
| 25 | `charginggadgets` -> `ironjetpacks` | ✅ Точно | Підтверджено: у конфігу `config/ironjetpacks/jetpacks/wood.json` значення `capacity = 20000` FE. Квест `637981B64BBE0D92` у розділі «Поради та хитрощі» спрямований на зарядну станцію Charging Gadgets. |
| 26 | `charginggadgets` -> `buildinggadgets2` | ✅ Точно | Підтверджено: у `config/buildinggadgets2-common.toml` зазначено `power.building_gadget.maxPower = 500000` та `baseCost = 50`. Числа в описі абсолютно точні. |
| 27 | `charginggadgets` -> `mininggadgets` | ✅ Точно | Підтверджено: у `config/mininggadgets-common.toml` зазначено `power.mining_gadget.maxPower = 1000000` та `baseCost = 200`. Числа в описі абсолютно точні. |
| 28 | `chisel` -> `framedblocks` | ✅ Точно | Підтверджено: jar Chisel містить файл `data/framedblocks/tags/block/frameable.json`, де перелічено всі різьблені блоки мода. (Дрібниця: бракує крапки в кінці речення). |
| 29 | `cobblegengalore` -> `ae2` | ⚠️ Дрібні зауваження | **Підтверджено:** рецепт `cobblegengalore:blockgen/ae2/skystone.json` робить `ae2:sky_dust` з модифікатором `ae2:sky_stone_block`.<br>⚠️ **Зауваження до тексту:** за базою `names.json` предмет `ae2:sky_dust` називається **«Пил небесного каменю»** (а не «небесний пил»). |
| 30 | `cobblegengalore` -> `allthemodium` | ⚠️ Дрібні зауваження (⚑) | **Підтверджено:** рецепт `cobblegengalore:blockgen/atm/ancient_stone.json` існує і видає стародавній камінь.<br>⚠️ **Неповний опис:** у рецепті вказано не тільки синій лід та окиснену мідь (як блок-модифікатор), а рідку **«Лаву душ» (`allthemodium:soul_lava`)** замість звичайної лави. Без лави душ генератор камінь не виробить. Рекомендується доповнити текст: «генератор із лавою душ, синім льодом та окисненою міддю».<br>⚑ **Перевірити в грі:** коректність взаємодії рідкої лави душ у блоці генератора в рантаймі. |
| 31 | `crafting_on_a_stick` -> `curios` | ✅ Точно (⚑) | Підтверджено: клас `CuriosIntegration.class` у jar; у файлі налаштувань `options.txt` зафіксовано призначення клавіші `key_crafting_on_a_stick.key.open_curios:key.keyboard.v`.<br>⚑ **Перевірити в грі:** можливий конфлікт клавіші V із FTB Ultimine або іншими модами. |
| 32 | `croptopia` -> `farmingforblockheads` | ✅ Точно | Підтверджено: файл `data/croptopia/farmingforblockheads_compat/croptopia_seeds.json` у jar Croptopia реєструє продаж усього насіння мода за смарагди на «Ринку». |
| 33 | `croptopia` -> `cookingforblockheads` | ✅ Точно | Підтверджено: рецепт `data/cookingforblockheads/recipe/croptopia/toast.json` робить `croptopia:toast` з хліба в тостері. Назви «Тостер» та «Тост» відповідають `names.json`. |

---

## Резюме та рекомендації для оновлення батчу:
1. **Виправити машинний ref для #24 (`bhc -> curios`):** замінити `tag:curios:necklace` на `tag:curios:heart_amulet`.
2. **Уточнити українські назви за `names.json`:**
   - #2: «садильники» та «етерна папороть».
   - #14: «Богозлита перлина».
   - #29: «пил небесного каменю».
3. **Уточнити рецептурну умову для #30 (`cobblegengalore -> allthemodium`):** вказати обов'язкову рідку «Лаву душ» (`allthemodium:soul_lava`).
4. **Позначки «⚑ перевірити в грі»:**
   - #30 (поведінка лави душ у Cobblegen Galore);
   - #31 (перекриття клавіші V відкриття верстата).


---

# Звіт аудиту Батчу 2 (33 синергії) збірки All the Mods 11

**Аудитор:** Реサーチ-субагент  
**Джерела перевірки:**
- Файл батчу: `batch_2.json`
- База локалізацій: `names.json`
- Тека гри ATM11: `D:/Games/instances/All the Mods 11 - ATM11/minecraft` (конфіги, JAR-файли модів, скрипти KubeJS, квести FTB Quests).

---

## 1. Загальна статистика

- **Всього синергій:** 33
- ✅ **Точно (повністю підтверджено без зауважень):** 24
- ⚠️ **Дрібні зауваження (термінологічні розбіжності з `names.json` / потрібна позначка ⚑):** 8
  - З них потребують позначки **⚑ перевірити в грі**: 2 (синергії №22 та №23 через зміну ключа есенції `souls` → `ectoplasm` у Forbidden Arcanus 1.21.1).
- ❌ **Критичні помилки (вигадані предмети / неіснуючі механіки):** 1 (синергія №5 — `enderio:rs_conduit`).

---

## 2. Таблиця аудиту всіх 33 синергій

| № | Пара (`from` → `to`) | Статус | ⚑ | Аналіз, перевірка `ref` та зауваження |
|---|----------------------|:------:|:-:|---------------------------------------|
| 1 | `crystalix` → `jade` | ✅ Точно | — | `config/crystalix/crystalix-client.toml` підтверджує `jade_mode = "WAND"`. У JAR присутній `CXJadePlugin.class`. Назви предметів («Скло Crystalix», «Жезл Crystalix») збігаються з `names.json`. |
| 2 | `crystalix` → `framedblocks` | ✅ Точно | — | У JAR `crystalix-4.1.0+26.1.2.jar` наявний `CrystalixGlassCamoContainer.class`. Скло накладається як камуфляж на каркасні блоки FramedBlocks. |
| 3 | `dyenamics` → `occultism` | ⚠️ Дрібне | — | Рецепт у `kubejs/server_scripts/mods/dyenamics/recipes.js` підтверджено: безформний крафт `occultism:otherflower` + барвник → 4 барвники. <br>⚠️ **Зауваження до назви:** У `names.json` предмет `occultism:otherflower` перекладено як **«Іншоквітка»** (у тексті — «Потойбічна квітка»). |
| 4 | `enderio` → `mysticalagriculture` | ✅ Точно | — | Квести `2E37997A065A29F1`, `19FFD64154AFC89D`, `2C2EF4EBB3C9EAE3` у главі `mystical_agriculture.json5` підтверджені. Рецепт `data/mysticalagriculture/recipe/essence/enderio/end_steel_ingot.json` крафтить злитки напряму на верстаку з есенції (8 есенцій → 2 злитки сталі Енду). Термінологія повністю відповідає `names.json`. |
| 5 | `enderio` → `refinedstorage` | ❌ Помилка | — | ❌ **Критична помилка:** У версії Ender IO 9.0.6-alpha для Minecraft 1.21.1 провідники Refined Storage повністю відсутні. У грі та моді немає ні предмета, ні рецепта `enderio:rs_conduit` (наявні лише energy, item, fluid та redstone). Адона чи рецепта в KubeJS для RS-провідників у збірці немає. Синергія вигадана/застаріла (тягнеться з 1.12/1.20). |
| 6 | `enderio_endergy` → `enderio` | ⚠️ Дрібне | — | Рецепти в `enderio_endergy-9.0.1-alpha.jar` (`crude_energy_conduit.json` тощо) використовують `enderio:conduit_binder` і видають компонентний предмет `enderio:conduit`. Конденсатори працюють у машинах Ender IO. <br>⚠️ **Зауваження до назви:** У `names.json` предмет `enderio:conduit_binder` перекладено як **«Зв'язувальний елемент провідників»** (у тексті — «сполучна речовина провідника»). |
| 7 | `energizedpower` → `geore` | ✅ Точно | — | Скрипт `kubejs/server_scripts/mods/energizedpower/recipes.js` містить функцію `crystal_growth_chamber` рівно для **29 руд** GeOre (від coal/iron до allthemodium, vibranium, unobtainium). Назва блоку «Камера вирощування кристалів» збігається з `names.json`. |
| 8 | `energizedpower` → `mffs` | ✅ Точно | — | `kubejs/server_scripts/mods/mffs/recipes.js` видаляє рецепти сталі MFFS (`mffs:steel_ingot`, `mffs:steel_compound`). Рецепт `mffs:focus_matrix` вимагає `#c:ingots/steel`, яку виробляє `energizedpower:alloy_furnace`. Назви «Піч для сплавів» та «Фокусувальна матриця» точні. |
| 9 | `energizedpower` → `refinedtypes` | ⚠️ Дрібне | — | `kubejs/server_scripts/mods/refined_storage/refined_types.js` повністю перебудовує рецепти дисків та частин зберігання Refined Types на компоненти Energized Power (`advanced_circuit`, `battery_6`, дроти тощо). <br>⚠️ **Зауваження до назви:** `energizedpower:advanced_circuit` у `names.json` перекладено як **«Покращена схема»** (у тексті — «Удосконалені схеми»). |
| 10 | `energymeter` → `powah` | ✅ Точно | — | Числа в конфігу `config/powah.json5` (`devices.cables.transfer_rates`) точно підтверджені: `starter` = 500 FE/t, `nitro` = 1 000 000 FE/t. Назви кабелів збігаються. |
| 11 | `energymeter` → `pipez` | ⚠️ Дрібне | — | Числа в `config/pipez-server.toml` підтверджені: `no_upgrade` = 256 FE/t, `ultimate` = 131 072 FE/t. <br>⚠️ **Зауваження до назв:** У `names.json` `pipez:ultimate_upgrade` — це **«Найвище покращення труби»** (у тексті — «остаточним»), а труба — **«Труба для енергії»** (у тексті — «енергетичної труби»). |
| 12 | `evilcraft` → `apothic_enchanting` | ✅ Точно | — | Квести `5A8F4CA0F09F4842` («Знімаємо чари і прокляття») та `6884E25641A1020C` («Бібліотека чар») підтверджені. Назви «Очищувач», «Блук», «Бібліотека чар» повністю відповідають `names.json`. |
| 13 | `evilcraft` → `powah` | ✅ Точно | — | Блок `evilcraft:eternal_water` («Блок вічної води») є нескінченним джерелом рідини. У `Powah-7.0.4-alpha.jar` файл `data/powah/data_maps/fluid/fluid_coolant.json` містить тег `#c:water` з температурою 0 (охолоджувач). |
| 14 | `evilcraft` → `hostilenetworks` | ✅ Точно | — | У JAR HNN файл `data/hostilenetworks/hostilenetworks/data_models/enderman.json` містить у `fabricator_drops` 4 штуки `evilcraft:ender_tear`. Назва «Сльоза Енду» точна. |
| 15 | `evilcraft` → `curios` | ✅ Точно | — | `kubejs/server_scripts/mods/curios/tags.js` додає `evilcraft:vengeance_ring` до `curios:ring`, а `invigorating_pendant` та `primed_pendant` — до `curios:charm`. Назви («Перстень помсти», «Підбадьорливий кулон», «Заряджений кулон») точно відповідають `names.json`. |
| 16 | `evilcraftcompat` → `evilcraft` | ✅ Точно | — | `evilcraftcompat` оголошено як окремий саб-мод у `META-INF/neoforge.mods.toml` всередині `evilcraft-26.1.2-neoforge-1.2.107.jar`. Він реєструє класи інтеграції JEI, Jade (`BoxOfEternalClosureDataProvider`) та CommonCapabilities. |
| 17 | `explorerscompass` → `alltheores` | ⚠️ Дрібне | — | У `kubejs/server_scripts/mods/explorerscompass/recipes.js` рецепт компаса дослідника перевизначено: 4 `alltheores:enderium_gear`, 4 незеритові злитки та компас відновлення. <br>⚠️ **Зауваження до назви:** У `names.json` предмет перекладено як **«Ендеріюмова шестерня»** (у тексті — «ендерієвих»). |
| 18 | `extendedae` → `advanced_ae` | ✅ Точно | — | JAR AAE містить рецепти `eaeadvpatpro.json`, `eaequantumaccel.json` тощо. ExtendedAE містить клас завантажувача сумісності `com/glodblock/github/extendedae/xmod/aae/AAELoader.class`. |
| 19 | `extendedae` → `productivebees` | ✅ Точно | — | У JAR Productive Bees файл `data/productivebees/productivebees/bee_data/ae2/entro.json` має умовою завантаження `extendedae`, а квіткою (`flowerBlock`) призначено `extendedae:entro_block` («Блок ентро»). Назва сутності в `names.json` — «Ентро-бджола». |
| 20 | `farmingforblockheads` → `productivetrees` | ✅ Точно | — | У JAR Productive Trees файл `data/productivetrees/farmingforblockheads_compat/productivetrees_seeds.json` додає понад 100 видів саджанців дерев до ринку Farming for Blockheads за смарагди. |
| 21 | `farmingforblockheads` → `silentgear` | ✅ Точно | — | `kubejs/server_scripts/mods/silentgear/recipes.js` (рядки 5–25) додає `silentgear:fluffy_seeds` («Пухнасте насіння») та `silentgear:flax_seeds` («Насіння льону») до ринку Farming for Blockheads. Назви точно відповідають `names.json`. |
| 22 | `forbidden_arcanus` → `allthemodium` | ⚠️ Дрібне | ⚑ ТАК | Рецепти в `kubejs/dynamic_data/.../eternal_stella.json` (3 рівень, `allthemodium_ingot` у центрі), `alloy_sword.json` (4 рівень), а також скрипт `hephaestus_forge.js` (розмноження реліквій) підтверджено. Квест `5A6FF0D4BA894306` на місці. <br>⚠️ **Критичний нюанс / ⚑ перевірити в грі:** У версії Forbidden Arcanus 2.8.0-beta.2 (1.21.1) enum `EssenceType` містить есенцію `ECTOPLASM`, а не `SOULS` (як було в 1.20). У файлах збірки ключ задано як `"souls"`. Оскільки текст сам зазначає «чи працюють, перевірити в JEI», тут **обов'язково потрібна позначка ⚑**. |
| 23 | `forbidden_arcanus` → `productivebees` | ⚠️ Дрібне | ⚑ ТАК | `kubejs/dynamic_data/productivebees/forbidden_arcanus/hephaestus_forge/ritual/stellarite_bee.json` перевизначає ритуал: 5 рівень, яйце незеритової бджоли, 4 Вічні Стелли, 2 блоки вібранію, 2 шматки стелариту. <br>⚠️ **Зауваження:** 1) Потрібна позначка **⚑ перевірити в грі** (есенція також задана як `"souls": 4` замість `ectoplasm`). 2) У `ref` вказано `jarfile:`, хоча реальний файл модифікації лежить у `file:kubejs/dynamic_data/...`. |
| 24 | `framedblocks` → `jade` | ✅ Точно | — | У `config/framedblocks-client.toml` параметр `renderCamoInJade = true`. У JAR FramedBlocks наявний `FramedBlockComponentProvider.class`. |
| 25 | `ftbchunks` → `ftbteams` | ✅ Точно | — | `ftbchunks` прямо залежить від `ftbteams` (`neoforge.mods.toml`), завантажені чанки прив'язані до команди FTB Teams. |
| 26 | `ftbessentials` → `ftbranks` | ✅ Точно | — | У JAR `ftb-essentials` присутній клас `dev/ftb/mods/ftbessentials/integration/FTBRanksIntegration.class`, ліміти й кулдауни читаються з рангів. |
| 27 | `ftbquests` → `ftbteams` | ✅ Точно | — | `ftbquests` прямо залежить від `ftbteams` (`neoforge.mods.toml`), прогрес квестів ділиться між союзниками команди. |
| 28 | `ftbquests` → `ftbfiltersystem` | ✅ Точно | — | Квести `30BD1DF4FC9295C6` та `2655C88A18B11FD3` у `aether_2.json5` використовують предмет `ftbfiltersystem:smart_filter` з виразами `or(item(...))` для зарахування будь-якого інструмента групи. |
| 29 | `gateways` → `apotheosis` | ✅ Точно | — | Рецепти рівневих брам (`frontier`, `ascent`, `summit`, `pinnacle`) підтверджено в JAR Apotheosis. `pinnacle` крафтиться з пилу самоцвітів (`apotheosis:gem_dust`) та реагентів. Квести `22E57BF23B9BA2C5` та `6B5B01C612951BAF` у главі `apotheosis_gear.json5` ведуть до нескінченної брами загарбників (`apotheosis:endless_invader`). |
| 30 | `generatorgalore` → `productivebees` | ✅ Точно | — | У `config/generatorgalore/generator/honey.json` вказано: `generationRate = 64`, `fuelTag = "c:honey"`. Квест `68972BA647FDCF8F` у `generators.json5` має назву «Медовий генератор». |
| 31 | `generatorgalore` → `hostilenetworks` | ✅ Точно | — | У `config/generatorgalore/generator/netherstar.json` вказано: `generationRate = 4092`. Модель `data_models/wither.json` у HNN виробляє `minecraft:nether_star`. Квест `1843C79133DFB024` у `generators.json5` підтверджено. |
| 32 | `geore` → `occultism` | ✅ Точно | — | У `kubejs/server_scripts/mods/neovitae/meteor.js` зареєстровано ритуали для каталізаторів метеоритів (`occultism:*_catalyst`) та трансмутації уламків (`occultism:*_transumtation`). У JAR Occultism наявні рецепти кристалізації `data/occultism/recipe/crystallize/geore_*.json`. |
| 33 | `geore` → `oritech` | ⚠️ Дрібне | — | У JAR Oritech присутні рівно **29 рецептів** `data/oritech/recipe/compat/geore/assembler/budding_*.json`. Склад крафту: 2 уламки GeOre + 1 `oritech:enderic_compound` + 1 `oritech:overcharged_crystal`. <br>⚠️ **Зауваження до назви:** У `names.json` предмет `oritech:enderic_compound` перекладено як **«Ендерова сполука»** (у тексті — «ендерного складу»). |

---

## 3. Резюме важливих зауважень та рекомендації щодо виправлень

1. **Критична помилка (№5 `enderio` → `refinedstorage`):**
   - Видалити синергію або замінити її. У версії Ender IO 9.0.6-alpha для 1.21.1 немає жодних кондуїтів Refined Storage (немає коду, класів, адонів чи рецептів).
2. **Позначка «⚑ перевірити в грі» (№22 та №23 `forbidden_arcanus`):**
   - У KubeJS-скриптах та dynamic data ATM11 для ритуалів Кузні Гефеста використано старий ключ `"souls"`, тоді як у Forbidden Arcanus 2.8.0-beta.2 для 1.21.1 поле серіалізації зветься `"ectoplasm"`. Необхідно перевірити в грі в JEI, чи валідуються ці ритуали, чи не скидається вимога есенції на 0.
3. **Термінологічні узгодження з `names.json`:**
   - №3: `occultism:otherflower` → **«Іншоквітка»** (замість «Потойбічна квітка»).
   - №6: `enderio:conduit_binder` → **«Зв'язувальний елемент провідників»** (замість «сполучна речовина провідника»).
   - №9: `energizedpower:advanced_circuit` → **«Покращена схема»** (замість «удосконалені схеми»).
   - №11: `pipez:ultimate_upgrade` → **«Найвище покращення труби»** (замість «остаточне»), `pipez:energy_pipe` → **«Труба для енергії»**.
   - №17: `alltheores:enderium_gear` → **«Ендеріюмова шестерня»** (замість «ендерієва»).
   - №33: `oritech:enderic_compound` → **«Ендерова сполука»** (замість «ендерний склад»).

---

# Звіт аудиту синергій модів All the Mods 11 (Minecraft 26.1.2) — Батч 3 (33 синергії)

Було проведено ретельну перевірку всіх 33 синергій з файлу `batch_3.json` із зіставленням проти бази перекладів `names.json` та файлів гри (рецепти, KubeJS-скрипти, конфігурації, FTB Quests, класи JAR-модів).

---

## 📊 Загальна статистика Батчу 3

- **Всього синергій:** 33
- **✅ Точно (без суттєвих зауважень):** 26 (78.8%)
- **⚠️ Дрібні зауваження (термінологія, формулювання, контекст):** 6 (18.2%)
- **❌ Помилки (невірна атрибуція пари / серйозна неточність):** 1 (3.0%)
- **⚑ Рекомендовано перевірити в грі (рантайм/візуал/клієнтські механіки):** 4 синергії (№15, №20, №21, №31)

---

## 📋 Детальна таблиця аудиту всіх 33 синергій

| № | Пара (`from` → `to`) | Статус | Аналіз, підтвердження ref та зауваження |
|---|---|:---:|---|
| 1 | `geore` → `inworldrecipes` | ✅ Точно | **Ref підтверджено:** `kubejs/server_scripts/mods/geore/crystalline_wand.js` (L34) реєструє рецепти типу `inworldrecipes:world_recipe` для зняття блоків `geore:budding_*` жезлом `kubejs:crystalline_wand` (шанс 50%) та `kubejs:perfected_crystalline_wand` (шанс 100%).<br>• *Дрібне:* у полі `to_name` варто виправити `inworldrecipes` на `"In World Recipes"`. |
| 2 | `hostilenetworks` → `apothic_enchanting` | ✅ Точно | **Ref підтверджено:** `kubejs/dynamic_data/hostilenetworks/data_models/warden.json` у секції `fabricator_drops` містить `apothic_enchanting:warden_tendril`.<br>• Переклад точний: `minecraft:warden` = «Боронитель», `warden_tendril` = «Вусик боронителя» (повний збіг з `names.json`). |
| 3 | `iceandfire` → `allthemodium` | ✅ Точно | **Ref підтверджено:** У `kubejs/dynamic_data/iceandfire/recipe/dragonforge/` є 3 рецепти (`allthemodium-vibranium.json`, `allthemodium-unobtainium.json`, `vibranium-unobtainium.json`) з `cookTime: 1000`. У `fire.json` додано біом `allthemodium:crimson_forest`.<br>• Числа й назви (усемодій, вібраній, унобтаній, Інший світ) 100% точні. |
| 4 | `iceandfire` → `occultism` | ✅ Точно | **Ref підтверджено:** У `kubejs/server_scripts/unification/tools.js` (L66-120) при завантажених обох модах срібні інструменти та обладунки Ice and Fire (`iceandfire:silver_*`, `iceandfire:armor_silver_metal_*`) використовуються у ритуалах Окультизму з прив'язаним джином (`occultism:craft_djinni`) для створення просякненого спорядження (`occultism:infused_*`). |
| 5 | `iceandfire` → `productivebees` | ✅ Точно | **Ref підтверджено:** JAR Productive Bees містить рецепти кузні дракона (`data/iceandfire/recipe/dragonforge/*_dragonsteel_bee.json`) з кров'ю дракона, рецепти центрифуги для драконесталевих стільників, а квести `1C0F4D1610530FEC`, `019CC48531E7759B`, `3EB6CBA0B1374BDD` наявні в главі `productive_bees.json5`. |
| 6 | `integrateddynamics` → `mysticalagriculture` | ✅ Точно | **Ref підтверджено:** `cropInfo.json` містить `"menril"`, що активує культуру в KubeJS. У JAR Mystical Agriculture присутні рецепти крафту з есенції колод (`menril_log.json`), ягід (`menril_berries.json`) та саджанців (`menril_sapling.json`). |
| 7 | `integrateddynamics` → `productivebees` | ⚠️ Дрібне | **Ref підтверджено:** У JAR Productive Bees є `recipe/centrifuge/integrateddynamics/honeycomb_menril.json`.<br>• *Зауваження:* речення починається з малої літери («менрілові бджоли...»). За `names.json` вихід центрифуги — «Шматок кристалізованого менрілу» (`crystalized_menril_chunk`, шанс 10%) та 50 mB рідкої менрілової смоли (`menril_resin`). Рекомендовано: *«Менрілові бджоли дають стільники, які в центрифузі переробляються на шматки кристалізованого менрілу та менрілову смолу.»* |
| 8 | `integratedterminals` → `integratedcrafting` | ✅ Точно | **Ref підтверджено:** У JAR `integratedterminals` присутній пакет `org/cyclops/integratedterminals/modcompat/integratedcrafting/`, зокрема клас `CraftingJobFinishedToastListener.class` та `TerminalCraftingPlanCraftingJobDependencyGraph.class`. Термінал створення замовляє та візуалізує автокрафт. |
| 9 | `inworldrecipes` → `ae2` | ✅ Точно | **Ref підтверджено:** У `kubejs/server_scripts/mods/geore/crystalline_wand.js` (L29, L34) блок `ae2:flawless_budding_quartz` додано до списку цілей для жезла через In World Recipes.<br>• *Уточнення термінології:* за `names.json` назва блоку — «Бездоганний родючий істинний кварц» (варто додати слово «істинний»). |
| 10 | `inworldrecipes` → `occultism` | ❌ Помилка | **Ref:** `recipe:allthemods:crystalline_infusion/crystalline_wand`.<br>• **Аналіз помилки:**<br>1) **Невірна атрибуція пари:** Мод `inworldrecipes` взагалі не містить предметів чи жезлів і не бере участі в ритуалі Окультизму. Жезли `kubejs:crystalline_wand` та `kubejs:perfected_crystalline_wand` створені авторами збірки (KubeJS) для збору руд GeOre. Ритуал накреслюється в Occultism з використанням предметів збірки, GeOre, Construction Wand тощо.<br>2) **Незрозумілий контекст:** Фраза *«Обидва жезли робляться ритуалами Occultism»* відірвана від назв предметів (гравець не знає, про які жезли йдеться).<br>• *Рекомендація:* Перенести або перейменувати зв'язок на `geore` → `occultism` (або `kubejs` → `occultism`) та чітко вказати назву: *«Недосконалий та досконалий кристалічні резонансні жезли створюються через ритуал Окультизму "Crystalline Infusion".»* |
| 11 | `ironfurnaces` → `generatorgalore` | ⚠️ Дрібне | **Ref підтверджено:** Квести `49F08DE190AAD0D8` (Фабрика), `20EC8001A05CE2C8` (Приймач тепла), `07753C5D94312A50` (Генератор) та `618F1434757C8E69` (Мідний генератор) містяться у спільній главі `generators.json5`.<br>• *Зауваження до перекладу:* В українському тексті написано *«бездротовий **передавач** тепла»*, тоді як за `names.json` предмет `ironfurnaces:heater` перекладається як **«Бездротовий приймач тепла»** (Wireless Heat Receiver). Потрібно замінити «передавач» на «приймач». |
| 12 | `ironfurnaces` → `allthemodium` | ✅ Точно | **Ref підтверджено:** У JAR Iron Furnaces є вбудована інтеграція під ATM-метали: `allthemodium_furnace.json`, `vibranium_furnace.json`, `unobtainium_furnace.json` та покращення до них за тегами `c:ingots/allthemodium` тощо. Квест `3A4C17878FC8315B` підтверджено. |
| 13 | `ironjetpacks` → `curios` | ✅ Точно | **Ref підтверджено:** У JAR Iron Jetpacks є клас `CuriosCompat.class` і тег `data/curios/tags/item/back.json` з `ironjetpacks:jetpack`. Дозволяє надягати ранець у слот спини Curios. |
| 14 | `irons_jewelry` → `curios` | ✅ Точно | **Ref підтверджено:** Теги `curios:ring` та `curios:necklace` зареєстровані в JAR мода, а атрибути та бонуси коштовностей нараховуються через Curios API (`AttributeBonusType.class`). |
| 15 | `jade` → `jei` | ✅ Точно <br>*(⚑ перевірити в грі)* | **Ref підтверджено:** У JAR Jade наявний клас `snownee/jade/compat/JEICompat.class`.<br>• *Позначка:* ⚑ Рекомендовано перевірити в грі роботу гарячих клавіш (R/U при наведенні на блок у світі для відкриття вікна рецептів у JEI). |
| 16 | `jearchaeology` → `allthemodium` | ✅ Точно | **Ref підтверджено:** `config/jearchaeology-common.toml` має `atm_compat = true`. У JAR AllTheModium таблиці луту археології `data/allthemodium/loot_table/arch.json` та `arch2.json` містять ковальські шаблони усемодію та вібранію. Квести `71E4FD61787DE299` та `226B8B60AF864FEF` підтверджені. |
| 17 | `justdirethings` → `quarryplus` | ✅ Точно | **Ref підтверджено:** У `kubejs/server_scripts/mods/quarryplus/recipes.js` (L10) кар'єр `quarryplus:quarry` крафтиться з `justdirethings:eclipsealloy_pickaxe` (кайло зі сплаву затемнення) та `justdirethings:blockbreakert2` (покращений руйнівник блоків). |
| 18 | `justdirethings` → `allthemodium` | ✅ Точно | **Ref підтверджено:** У `kubejs/server_scripts/mods/justdirethings/recipes.js` видалено стандартний рецепт `upgrade_orexray` і додано новий з використанням `#c:ingots/unobtainium`. Переклад «Покращення: X-Ray руди» відповідає `names.json`. |
| 19 | `logisticsnetworks` → `ae2` | ✅ Точно | **Ref підтверджено:** У JAR мода присутній рецепт `data/logisticsnetworks/recipe/network_upgrade_ae2.json` (потребує шини, кабелі та картки прискорення AE2) та пакет `me/almana/logisticsnetworks/integration/ae2/` для доступу до МЕ-мережі й автокрафту. |
| 20 | `lootr` → `allthemodium` | ✅ Точно <br>*(⚑ перевірити в грі)* | **Ref підтверджено:** AllTheModium містить повноцінну інтеграцію з Lootr (`net/allthemods/allthemodium/compat/lootr/`), де через `ClayConversionProvider`, `SoulSandConversionProvider` і теги `clays.json`/`soul_sands.json` підозрілі блоки конвертуються в персональні Lootr-блоки.<br>• *Позначка:* ⚑ Рекомендовано перевірити в грі коректність поведінки щітки (brushable mixin) для кожного гравця в мультиплеєрі. |
| 21 | `luminax` → `framedblocks` | ✅ Точно <br>*(⚑ перевірити в грі)* | **Ref підтверджено:** У JAR Luminax є клас `dev/satherov/luminax/compat/framedblocks/LuminaxCamoContainer.class`.<br>• *Позначка:* ⚑ Перевірити в грі рендеринг та збереження світіння блоків Luminax у каркасних блоках FramedBlocks. |
| 22 | `mahoutsukai` → `apothic_enchanting` | ✅ Точно | **Ref підтверджено:** Квести `03DCDFB32CD4BD85` (Калібурн) та `012912FDAFCD1C66` (Покращення Калібурна) вимагають меч з чарами Smite («Небесна кара») та 6 зірок Незеру для підняття стелі шкоди. Квест `6884E25641A1020C` (Бібліотека чар) підтверджує зберігання та комбінування високорівневих книг Apothic Enchanting. |
| 23 | `mahoutsukai` → `easy_villagers` | ✅ Точно | **Ref підтверджено:** `config/mahoutsukai-server.toml` задає `MORGAN_ADULT_INCREASE = 0.1` та `MORGAN_CHILD_INCREASE = 0.5`. Квест `777BB82B56038ED3` підтверджує механіку вбивства селян. Блок `easy_villagers:breeder` («Розмножувач» за `names.json`) забезпечує компактне розведення селян. |
| 24 | `matc` → `mysticalagriculture` | ✅ Точно | **Ref підтверджено:** Мод MATC (Mystical Agriculture Tiered Crystals) додає проміжні кристали наповнення (прудентієвий, терцієвий, імперієвий, супремієвий) з рецептами в звичайному верстаку (`matc:imperium_essence`, `matc:imperium_crystal`). |
| 25 | `mffs` → `powah` | ⚠️ Дрібне | **Ref підтверджено:** `mffs-common.toml` встановлює `feCostPerFortron = 600`. Конфіг `powah.json5` встановлює генерацію нітро-реактора на рівні `500000` FE/t.<br>• *Зауваження до термінології:* За `names.json` блок `mffs:coercion_deriver` називається **«Примусовий деривататор»** (Coercion Deriver), а не «Деривататор примусу». |
| 26 | `mininggadgets` → `allthemodium` | ✅ Точно | **Ref підтверджено:** `kubejs/server_scripts/mods/mininggadgets/recipes.js` (L6) замінює рецепт `mininggadgets:upgrade_empty`, додаючи самородки усемодію (`#c:nuggets/allthemodium`).<br>• *Дрібне:* за `names.json` предмет називається «Порожній модуль покращення». |
| 27 | `moredragoneggs` → `productivebees` | ⚠️ Дрібне | **Ref підтверджено:** Рецепт `productivebees:dragon_egg_hive` створює вулик із `minecraft:dragon_egg` + `minecraft:beehive`.<br>• *Зауваження:* У `why` не пояснено роль мода `moredragoneggs`. Мод робить яйце дракона поновлюваним (випадає при кожному повторному вбивстві Ендер-дракона), завдяки чому яйця можна вільно витрачати на вулики Productive Bees. Без цього пояснення здається, що синергія стосується ванільного Minecraft. |
| 28 | `moredragoneggs` → `theurgy` | ✅ Точно | **Ref підтверджено:** У Theurgy є рецепти розрідження яйця на сірку (`liquefaction/alchemical_sulfur_dragon_egg_from_dragon_egg.json`), прожарювання на сіль істот та інкубації нового яйця дракона (`incubation/dragon_egg.json`). Текст чітко згадує використання повторних яєць. |
| 29 | `moredragoneggs` → `forbidden_arcanus` | ⚠️ Дрібне | **Ref підтверджено:** Рецепт `forbidden_arcanus:arcane_dragon_egg` з яйця дракона та золотої луски.<br>• *Зауваження:* 1) За `names.json` предмет називається **«Містичне яйце дракона»** (Arcane Dragon Egg), а не «чарівне яйце». 2) Варто підкреслити контекст поновлюваності яйця від More Dragon Eggs. |
| 30 | `moredragoneggs` → `allthetweaks` | ⚠️ Дрібне | **Ref підтверджено:** `kubejs/server_scripts/modpack/mini_portals.js` (L28) містить рецепт `allthetweaks:mini_exit`.<br>• *Зауваження:* Рецепт вимагає **аж 4 яйця дракона** (`minecraft:dragon_egg`), тому без More Dragon Eggs скрафтити його у звичайному виживанні неможливо! Варто прямо вказати число: *«Потребує 4 яйця дракона...»*. За `names.json` предмет зветься **«Мініатюрний вихідний портал»**. |
| 31 | `moreoverlays` → `jei` | ✅ Точно <br>*(⚑ перевірити в грі)* | **Ref підтверджено:** `at/ridgo8/moreoverlays/itemsearch/GuiRenderer.class` викликає JEI API; `config/moreoverlays.toml` містить параметр `search_enabled = true` (*«double click the JEI search bar for item searching»*).<br>• *Позначка:* ⚑ Перевірити подвійний клік по пошуковому рядку JEI та затемнення невідповідних предметів у скринях у грі. |
| 32 | `mysticalagradditions` → `hostilenetworks` | ✅ Точно | **Ref підтверджено:** `kubejs/server_scripts/mods/mysticalagriculture/recipes.js` додає рецепт «Висушеної душі» (`mysticalagradditions:withering_soul`), де використовується `hostilenetworks:prediction` з моделлю `hostilenetworks:wither`.<br>• Переклади («Передбачення Візера», «Висушена душа», «Нев'януча троянда») 100% узгоджені з `names.json`. |
| 33 | `mysticalagradditions` → `productivebees` | ✅ Точно | **Ref підтверджено:** Той самий рецепт `allthemods:mysticalagradditions/withering_soul` вимагає стільники висушеної бджоли `productivebees:configurable_comb` (`bee_type="productivebees:withered"`). Повний збіг. |

---

## 🔍 Головні висновки та рекомендовані виправлення

1. **Критична помилка атрибуції (Синергія №10):**
   - Пара `inworldrecipes -> occultism` є помилковою, оскільки `inworldrecipes` не додає жезлів і не фігурує в ритуалах Окультизму. Жезли належать до кастомних предметів KubeJS (`kubejs:crystalline_wand` та `kubejs:perfected_crystalline_wand`), створених авторами для збору GeOre-блоків. Цю синергію слід переприв'язати до `geore -> occultism` та конкретизувати назву жезлів.

2. **Виправлення термінології за `names.json`:**
   - **№11 (`ironfurnaces`):** змінити «бездротовий передавач тепла» ➔ **«бездротовий приймач тепла»** (`ironfurnaces:heater` / Wireless Heat Receiver).
   - **№25 (`mffs`):** замінити «Деривататор примусу» ➔ **«Примусовий деривататор»** (`mffs:coercion_deriver`).
   - **№29 (`forbidden_arcanus`):** змінити «чарівне яйце дракона» ➔ **«Містичне яйце дракона»** (`forbidden_arcanus:arcane_dragon_egg`).
   - **№30 (`allthetweaks`):** за `names.json` назва блоку — **«Мініатюрний вихідний портал»**, і варто додати число **4 яйця дракона** у вимогах рецепта.
   - **№7 (`integrateddynamics`):** виправити малу літеру та уточнити вихід центрифуги — **«шматки кристалізованого менрілу та менрілова смола»**.

3. **Смислове уточнення синергій More Dragon Eggs (№27, №29, №30):**
   - Обов'язково пояснити гравцеві, чому саме More Dragon Eggs створює синергію: *«Завдяки More Dragon Eggs яйця дракона стають нескінченно поновлюваними при повторних викликах боса, що дозволяє витрачати їх як витратний матеріал на крафти...»*.

4. **Кандидати на тестування у клієнті (⚑):**
   - №15 (`jade -> jei`): хоткеї пошуку рецептів на блоці у світі.
   - №20 (`lootr -> allthemodium`): мультиплеєрне щіткування підозрілої глини/піску душ.
   - №21 (`luminax -> framedblocks`): коректність рендерингу світіння камуфляжу.
   - №31 (`moreoverlays -> jei`): інтерактивний пошук подвійним кліком по рядку JEI.


---

# Звіт аудиту синергій модів All the Mods 11 (Батч 4: 33 синергії)

Проведено детальну верифікацію всіх 33 синергій Батчу 4 (`batch_4.json`) на основі фактичних файлів збірки ATM11 (Minecraft 1.21.1 / NeoForge 26.1.2): скриптів KubeJS (`server_scripts`, `startup_scripts`, `dynamic_data`), файлів конфігурацій, jar-файлів модів, квестів FTB Quests та словника назв `names.json`.

---

## 📊 Загальна статистика Батчу 4
- **Всього синергій:** 33
- **✅ Точно (бездоганно підтверджено):** 28
- **⚠️ Дрібні зауваження:** 5 (стилістичні/граматичні неточності в укр. тексті, уточнення шляхів до файлів скриптів KubeJS або рантаймова природа реєстрації рецептів)
- **❌ Помилок (вигадані/неіснуючі механіки):** 0

---

## 📋 Детальний аудит кожної синергії (1–33)

| № | Пара (`from` -> `to`) | Статус | Аналіз, перевірка референсів та зауваження |
|---|---|:---:|---|
| 1 | `mysticalagradditions` -> `allthecompressed` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/mysticalagriculture/compatibility.js` (рядки 26, 103–111, 128) збірка видаляє стандартний рецепт інфузії насіння нітро-кристала та замінює його на рецепт з `allthecompressed:nitro_crystal_block_1x` та `mysticalagradditions:insanium_essence`. Назви в `names.json` збігаються («Блок нітро-кристала 1x», «Інсанієва есенція»). |
| 2 | `mysticalagradditions` -> `matc` | ✅ Точно | Підтверджено: у `matc-1.8.0.jar` (`data/matc/recipe/insanium_essence.json`) визначено рецепт верстака: 4 супремієві есенції навколо `#matc:infusion_crystals/supremium` дають `mysticalagradditions:insanium_essence`. Назви предметів відповідають `names.json`. |
| 3 | `mysticalagradditions` -> `agritechevolved` | ✅ Точно | Підтверджено: у `agritechevolved-2.2.0.5+neoforge-mc26.1.2.jar` (`data/agritechevolved/recipe/planter/crop/mysticalagriculture/`) рецепти для `nether_star_seeds`, `nitro_crystal_seeds`, `dragon_egg_seeds` вимагають відповідні Crux-блоки (`mysticalagradditions:*_crux`) у слоті `soils`. «Покращений садильник» (`agritechevolved:advanced_planter`) дозволяє вирощувати їх в одному блоці без підкладання блоку знизу у світі. |
| 4 | `mysticalagriculture` -> `mysticalagradditions` | ⚠️ Дрібне | **Механіка підтверджена:** Mystical Agradditions додає інсанієвий тир (рівень 6) та насіння, які потребують блоків Crux під ріллею. Квест `202B1F54D3F06DAB` відповідає «Інсанієва есенція» у главі MA.<br>⚠️ **Граматичне зауваження:** у фразі *«інсанієву есенцію й рілля»* слово «рілля» стоїть у називному відмінку замість знахідного. Потрібно: *«інсанієву есенцію й ріллю»*. |
| 5 | `mysticalagriculture` -> `allthecompressed` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/mysticalagriculture/compatibility.js` (рядки 22–50, 109–144) насіння сталі, сплавів Powah та Ender IO вимагають у вівтарі переливання блоки `allthecompressed:<resource>_block_1x`. |
| 6 | `mysticalagriculture` -> `integrateddynamics` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/mysticalagriculture/experience_droplet.js` (рядки 8–24) для витискача й механічного витискача ID додано рецепт: `mysticalagriculture:experience_droplet` -> 250 mB `justdirethings:xp_fluid_source`. |
| 7 | `mysticalautomation` -> `mysticalagriculture` | ✅ Точно | Підтверджено: у `MysticalAutomation-26.1.2-2.0.7.jar` (`data/mysticalautomation/recipe/farmer/`) автофермер (`mysticalautomation:farmer`) приймає насіння MA та ріллю відповідного рівня всередині свого інтерфейсу. |
| 8 | `mysticalautomation` -> `mysticalagradditions` | ✅ Точно | Підтверджено: рецепт `data/mysticalautomation/recipe/farmer/inferium_seeds_tier_6.json` використовує `mysticalagradditions:insanium_farmland` як `soil` і дає 4 інферієві есенції (найвищий вихід). |
| 9 | `mysticalcustomization` -> `agritechevolved` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/mysticalagriculture/mysticalcustomization_agritech.js` додано рецепти для садильників Agritech, де для культур AllTheModium, Vibranium та Unobtainium обов'язковим ґрунтом вказано `kubejs:magical_soil` («Чарівний ґрунт»). |
| 10 | `neovitae` -> `geore` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/neovitae/meteor.js` (рядки 35–154) масив `georeMeteor` містить рівно 22 руди (від міді до унобтанію) з витратою сутності від 500 000 до 5 000 000 EV. Каталізатори робляться ритуалом Occultism на пентаклі `crystalline_infusion` з уламків GeOre. У `config/geore-common.toml` підтверджено `generateAllthemodiumGeore = false`. |
| 11 | `neovitae` -> `ae2` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/neovitae/meteor.js` (рядки 4–33) рецепт `neovitae:meteor/ae2` за кристал істинного кварцу та 500 000 EV генерує метеорит із `ae2:sky_stone_block`, `ae2:fluix_block`, `ae2:quartz_block` та `ae2:flawless_budding_quartz` (бездоганний родючий істинний кварц). |
| 12 | `nullscape` -> `justdirethings` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/tweaks/tags.js` (подія `worldgen/biome`) біоми `nullscape:crystal_peaks`, `nullscape:shadowlands` та `nullscape:void_barrens` додані до тегу `justdirethings:unstable_portal_fluid_viable`. |
| 13 | `occultism` -> `forbidden_arcanus` | ✅ Точно | Підтверджено: у `kubejs/data/occultism/recipe/ritual/misc_unbreakable.json` ритуал на пентаклі «Контакт Ронази» (`occultism:contact_eldritch_spirit`) використовує `forbidden_arcanus:eternal_stella` для предметів з тегу `#atm:unbreakable`. Рецепти перетирання містичного кристала на пил, кристалізації з руди та добування духом-шахтарем підтверджено в Occultism. |
| 14 | `occultism` -> `neovitae` | ✅ Точно | Підтверджено: мультиблок `crystalline_infusion.json` складається з ритуальних каменів Neo Vitae (головний, повітря, вогонь, вода, tenebrae). У `kubejs/server_scripts/mods/geore/crystalline_wand.js` рецепт `allthemods:crystalline_infusion/perfect_crystalline_wand` створює покращений жезл на цьому пентаклі з використанням `neovitae:teleposer`. |
| 15 | `occultism` -> `ae2` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/ae2/recipes.js` зарядний пристрій AE2 приймає `occultism:divination_rod` і встановлює NBT/компонент `occultism:divination_linked_block` = `ae2:mysterious_cube` («Таємничий куб»). |
| 16 | `occultism` -> `theurgy` | ✅ Точно | Підтверджено: `kubejs/startup_scripts/theurgy/sulfur_additions.js` реєструє сірку з `occultism:iesnium_ingot`, а `kubejs/server_scripts/mods/theurgy/incubation.js` (рядок 31) додає рецепт інкубації ієснієвого злитка. |
| 17 | `occultism` -> `refinedtypes` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/refined_storage/refined_types.js` стандартні рецепти для нескінченних дисків і блоків видалені; єдиний спосіб їх створення — ритуал `meteoricInfusion` на пентаклі «Метеоричне насичення» (`occultism:meteoric_infusion`). |
| 18 | `oritech` -> `energizedpower` | ✅ Точно | Підтверджено: `kubejs/server_scripts/mods/oritech/recipes.js` видаляє власний рецепт сталі Oritech (`allthemods.remove({ id: "oritech:steel_ingot" })`), мотор `oritech:motor` вимагає тег `#c:ingots/steel`, а піч для сплавів Energized Power має рецепт `energizedpower:alloy_furnace/steel_ingot`. |
| 19 | `oritech` -> `alltheores` | ✅ Точно | Підтверджено: у `oritech-2.0.0-exp11.jar` тека `data/oritech/recipe/compat/ato/deepdrill/` містить рецепти видобувача для aluminum, iridium, lead, osmium, silver, tin, zinc, які дають необроблені руди AllTheOres. Назва машини за `names.json` — «Видобувач корінних порід». |
| 20 | `oritech` -> `powah` | ⚠️ Дрібне | **Механіка підтверджена:** у `oritech-2.0.0-exp11.jar` (`data/oritech/recipe/compat/powah/energizing/`) сфера заряджання робить `fluxite` (з аметисту), `energite_ingot` (з нікелю + флюкситу), `plutonium_dust` (з кристала ураніту).<br>⚠️ **Граматичне зауваження:** у фразі *«і флюксита»* закінчення має бути -у (*«і флюкситу»*, іменник чоловічого роду, назва речовини/матеріалу). |
| 21 | `potionsmaster` -> `allthemodium` | ⚠️ Дрібне | **Механіка підтверджена:** у `potionsmaster-26.1.2.100-2.0.0.jar` присутні моделі та предмети для Allthemodium, Vibranium (а також Unobtainium) звичайних і кальцинованих порошків.<br>⚠️ **Зауваження та ⚑:** Рецепти для зілля рудобачення в PotionsMaster генеруються повністю динамічно в рантаймі (`DynamicRecipeProvider.class`), а не статичними JSON-файлами. Рекомендується додати позначку **«⚑ перевірити в грі»**, а також додати згадку про унобтаній (*«усемодію, вібранію й унобтанію»*). |
| 22 | `powah` -> `mysticalagriculture` | ✅ Точно | Підтверджено: у главі квестів «Mystical Agriculture» квести `31EC6244E4A3CBD6` (електросталь) та `31A370550BD592B6` (нітро-кристал) відповідають насінню Powah; рецепт `mysticalagradditions:essence/nitro_crystal` дійсно крафтить 12 нітро-кристалів з 8 есенцій та 1 зірки Незеру на верстаку. |
| 23 | `powah` -> `allthemodium` | ⚠️ Дрібне | **Механіка підтверджена:** рецепт у сфері заряджання `kubejs:energizing/vibranium_allthemodium_alloy_ingot` вимагає злитки усемодію й вібранію, 2 серця піґліча та блок нітро-кристала 1x. Блок сплаву також має альтернативний крафт у драконячій кузні Ice and Fire (`kubejs/dynamic_data/iceandfire/recipe/dragonforge/allthemodium-vibranium.json`).<br>⚠️ **Неточність у ref:** рецепт визначено у `server_scripts/modpack/atm_alloys.js` (рядки 92–104), а не в `server_scripts/mods/powah/energizing.js`. |
| 24 | `powah` -> `ae2` | ✅ Точно | Підтверджено: у `kubejs/server_scripts/mods/powah/energizing.js` функція `bulk_energizing` (рядки 73–80) генерує рецепти заряджання кристалів істинного кварцу в сфері для партій від 1 до 6 штук (`1x_` ... `6x_charged_certus_quartz_crystal`). |
| 25 | `powah` -> `allthecompressed` | ⚠️ Дрібне | **Механіка підтверджена:** стиснені блоки нітро-кристала використовуються у сфері для сплаву ATM.<br>⚠️ **Зауваження до ref та опису:** 1) Рецепти розташовані у `server_scripts/modpack/atm_alloys.js`, а не `server_scripts/mods/powah/energizing.js`. 2) У циклі (рядки 117–130) блоки нітро-кристала потрібні від 1x до 9x включно (для блоку 7x потрібен `nitro_crystal_block_9x`, а не 8x). |
| 26 | `powah` -> `ironjetpacks` | ✅ Точно | Підтверджено: у `config/powah.json5` швидкість передачі `player_transmitters.charging_rates.starter` дорівнює 500 FE/t; дерев'яний ранець у `config/ironjetpacks/jetpacks/wood.json` має місткість `capacity: 20000`; квест `677365A816994C8B` відповідає «Зарядний маяк (Початковий)». |
| 27 | `productivebees` -> `mysticalagriculture` | ✅ Точно | Підтверджено: у `productivebees-26.1.2-15.3.0.jar` є бджоли та рецепти центрифуги для всіх есенцій від інферію до пробудженого супремію та уламків процвітання. Квест `32B01BD789F0B037` вимагає яйце виклику Awakened Supremium Bee. |
| 28 | `productivebees` -> `powah` | ✅ Точно | Підтверджено: у `productivebees` присутні бджоли та рецепти центрифуги для сот `honeycomb_uraninite`, `honeycomb_energized_steel`, `honeycomb_blazing_crystal`, `honeycomb_niotic_crystal`, `honeycomb_spirited_crystal`, `honeycomb_nitro_crystal`. |
| 29 | `productivebees` -> `ae2` | ✅ Точно | Підтверджено: рецепт `productivebees:centrifuge/ae2/honeycomb_fluix` вихід: `ae2:fluix_crystal` (шанс 20%), `ae2:fluix_dust` (5%) та віск. |
| 30 | `productivebees` -> `productivetrees` | ✅ Точно | Підтверджено: у `config/productivetrees-server.toml` параметр `pollenChanceFromSieve = 2` (2%); покращення `productivelib:upgrade_pollen_sieve` крафтиться на основі покращення бджіл за наявності Productive Bees; квест `5577F49A93ADB19C` очолює гілку селекції дерев. |
| 31 | `productivebees` -> `productivemetalworks` | ✅ Точно | Підтверджено: у `productivemetalworks-26.1.2-1.17.1.jar` (`data/productivemetalworks/recipe/casting/pbees/`) ливарня перетворює незеритову бджолу на усемодієву, усемодієву на вібранієву, а вібранієву на унобтанієву шляхом заливання розплавленого μεταлу. Квест `6EFFF0DC80C1C8A3` — «Усемодієва бджола». |
| 32 | `productivefarming` -> `productivebees` | ✅ Точно | Підтверджено: квест `06B197EB778C17AC` («Мутації») є кореневим вузлом ланцюжка мутацій культур і в нагороду видає `productivebees:sturdy_bee_cage` («Міцна клітка для бджіл»). |
| 33 | `productivefarming` -> `agritechevolved` | ✅ Точно | Підтверджено: у `productivefarming-26.1.2-0.13.0.jar` (`data/productivefarming/recipe/agritech_evolved/`) є повноцінна інтеграція з десятками рецептів садильника для культур Productive Farming (включаючи `agave.json`). |

---

## 💡 Резюме рекомендованих виправлень для Батчу 4

1. **Синергія #4 (`mysticalagriculture -> mysticalagradditions`):**
   - Виправити закінчення: замінити *«інсанієву есенцію й рілля»* на *«інсанієву есенцію й ріллю»*.
2. **Синергія #20 (`oritech -> powah`):**
   - Виправити закінчення: замінити *«й флюксита»* на *«і флюкситу»*.
3. **Синергія #21 (`potionsmaster -> allthemodium`):**
   - Додати позначку **«⚑ перевірити в грі»** через динамічну реєстрацію рецептів зілля в коді Java (`DynamicRecipeProvider`), а також згадати унобтаній: *«порошки (і кальциновані порошки) усемодію, вібранію та унобтанію»*.
4. **Синергії #23 та #25 (`powah -> allthemodium`, `powah -> allthecompressed`):**
   - У полях `ref` та `src` замінити шлях до файлу: замість `server_scripts/mods/powah/energizing.js` вказати фактичний файл `server_scripts/modpack/atm_alloys.js`.
   - У синергії #25 уточнити діапазон блоків: *«(1x…9x)»* замість *«(1x…8x)»*.


---

# Звіт з аудиту синергій: Батч 5 (33 синергії)
**Збірка:** All the Mods 11 (Minecraft 26.1.2 / NeoForge)  
**Перевірені джерела:** файли KubeJS (`kubejs/server_scripts`, `startup_scripts`, `dynamic_data`), jar-файли модифікацій у `mods/`, конфіги `config/`, квести FTB Quests `config/ftbquests/` та база локалізації `names.json`.

---

## 📊 Загальна статистика Батчу 5

- **Всього синергій:** 33
- **✅ Точно (повністю підтверджено):** 30 (91%)
- **⚠️ Дрібні зауваження (термінологія / уточнення ref):** 3 (9%)
  - *№1 (`productivemetalworks -> silentgear`):* «лазурне» vs офіційне «блакитне» у `names.json` (`Злиток блакитного срібла/електруму`).
  - *№8 (`railcraft -> alltheores`):* у `ref` вказано `c:gears/iron`, але прокатні верстати та електротяг беруть `c:gears/bronze` та `c:gears/steel` (також з AllTheOres).
  - *№12 (`reliquary -> mysticalagriculture`):* кальки перекладу: `witherless_rose` у базі — «Нев'януча троянда», `withering_soul` — «Висушена душа».
- **❌ Грубих помилок (вигаданих механік чи відсутніх рецептів):** 0 (0%)
- **⚑ Позначка «перевірити в грі»:** рекомендовано для 2 синергій (№17 `silentgear -> apotheosis`, №28 `undergarden -> allthemodium`).

---

## 📋 Детальна таблиця аудиту всіх 33 синергій

| № | Пара (`from -> to`) | Статус | Аналіз, підтвердження ref та зауваження |
|---|---|:---:|---|
| 1 | `productivemetalworks` -> `silentgear` | ⚠️ | **Підтверджено:** рецепти лиття металів Silent Gear та форм спорядження містяться в аддоні `sgearmetalworks` під простором `productivemetalworks` (`casting/ingots/silentgear/azure_electrum.json`, `casting/axe_cast.json`).<br>⚠️ *Зауваження до перекладу:* у `names.json` метал перекладено як «блакитне срібло» / «блакитний електрум» (`Злиток блакитного срібла`), а не «лазурне». |
| 2 | `productivemetalworks` -> `alltheores` | ✅ | **Підтверджено:** `data/productivemetalworks/recipe/alloying/molten_steel.json` сплавляє рідкий вуглець (`#c:molten_carbon`) і залізо (`#c:molten_iron`) у сталь, з якої відливають злитки й шестерні AllTheOres (`casting/ingots/alltheores/steel.json`, `casting/gears/alltheores/steel.json`). |
| 3 | `productivetrees` -> `agritechevolved` | ✅ | **Підтверджено:** у jar `productivetrees` рівно 163 JSON-рецепти типу `agritechevolved:tree` у теці `data/productivetrees/recipe/agritech_evolved/` — рівно на всі 163 паростки дерев мода. |
| 4 | `productivetrees` -> `mysticalcustomization` | ✅ | **Підтверджено:** `kubejs/server_scripts/mods/mysticalagriculture/recipes.js` (L18-29) містить крафт `kubejs:magical_soil`, де інгредієнтом «I» є `productivetrees:moonlight_magic_crepe_myrtle_sapling`. Конфіг `config/mysticalcustomization/crops/allthemodium.json` вказує `crux: "kubejs:magical_soil"`. Переклад «Паросток лагерстремії «Місячна магія»» у `names.json` збігається дослівно. |
| 5 | `quarryplus` -> `allthemodium` | ✅ | **Підтверджено:** `kubejs/server_scripts/mods/quarryplus/recipes.js` (L10-18) перезаписує рецепт `quarryplus:quarry`: по кутах 4 `allthemodium:allthemodium_ingot` (A), а знизу по центру — `allthemodium:unobtainium_pickaxe` (C). |
| 6 | `quarryplus` -> `productivebees` | ✅ | **Підтверджено:** у тому ж рецепті кар'єра (L15) компонентом «D» (2 шт.) є `productivelib:upgrade_productivity_4`. Цей предмет має назву «Покращення: продуктивність омега». Бібліотека Productive Lib запакована в jar Productive Bees (`META-INF/jarjar/productivelib-26.1.2-0.4.9.jar`), а крафт самого покращення змінено в `mods/productivebees/recipes.js`. |
| 7 | `railcraft` -> `mffs` | ✅ | **Підтверджено:** `data/railcraft/recipe/blast_furnace/blasting_iron_ingot.json` дає сталь; `kubejs/server_scripts/mods/mffs/recipes.js` видаляє нативні рецепти сталі MFFS (`mffs:steel_ingot`, `mffs:steel_compound`), а рецепт `mffs:focus_matrix` приймає тег `#c:ingots/steel`. |
| 8 | `railcraft` -> `alltheores` | ⚠️ | **Підтверджено:** `kubejs/server_scripts/unification/gears.js` видаляє всі нативні шестерні Railcraft (`railcraft:*_gear`).<br>⚠️ *Уточнення ref:* у `ref` вказано `c:gears/iron`, проте рецепти машин Railcraft використовують інші шестерні: `manual_rolling_machine` потребує `#c:gears/bronze`, а `powered_rolling_machine` та `electric_locomotive` — `#c:gears/steel`. Вони уніфіковані на шестерні AllTheOres. |
| 9 | `refinedsticks` -> `constructionstick` | ✅ | **Підтверджено:** у jar `refinedsticks` класи `RefinedSticksContainerRegistrar.class` та `HandlerRS.class` реєструють провайдер сумісності для `constructionstick`, дозволяючи паличкам будівельника тягнути блоки безпосередньо з мережі RS. |
| 10 | `refinedstorage` -> `mysticalagriculture` | ✅ | **Підтверджено:** у `cropInfo.json` (L77) увімкнено культуру `quartz_enriched_iron`. Вона активує рецепт `data/mysticalagriculture/recipe/essence/refinedstorage/quartz_enriched_iron_ingot.json`, що крафтить 8 шт. `refinedstorage:quartz_enriched_iron`. |
| 11 | `refinedtypes` -> `thaumaturge` | ✅ | **Підтверджено:** у `refined-types-26.1.2-1.0.2.jar` є повна підтримка есенції Thaumaturge (`EssentiaStorageDiskItem`, `EssentiaGridResource` тощо). Рецепти частин накопичувача (наприклад, `1024k_essentia_storage_part.json`) вимагають `thaumaturge:ingot_thaumium`. |
| 12 | `reliquary` -> `mysticalagriculture` | ⚠️ | **Підтверджено:** `awakened_essence_crafting.js` (L36-47) видаляє крафт `reliquary:fertile_lily_pad` і додає його на вівтар пробудження (латаття, вібранієва пластина, 3 есенції родючості та по 40 есенцій 4 стихій). Рецепт `withering_soul` вимагає троянду Reliquary.<br>⚠️ *Зауваження до перекладу:* у `names.json` `reliquary:witherless_rose` перекладено як «Нев'януча троянда» (у тексті — «троянда без візера»), а `mysticalagradditions:withering_soul` — «Висушена душа» (у тексті — «душа візера»). |
| 13 | `reliquary` -> `hostilenetworks` | ✅ | **Підтверджено:** дата-моделі Hostile Neural Networks (`blaze.json`, `creeper.json`, `enderman.json`, `wither_skeleton.json`, `witch.json`) мають у `fabricator_drops` трофеї Reliquary (`molten_core`, `catalyzing_gland`, `nebulous_heart`, `withered_rib`, `witch_hat`). *(Примітка: у базі `withered_rib` — «Сухе ребро», `witch_hat` — «Капелюшок відьми»).* |
| 14 | `selling_bin` -> `starcatcher` | ✅ | **Підтверджено:** jar Starcatcher постачає дата-мапу `compat/selling_bin_fishes/data/selling_bin/data_maps/item/selling_bin_value.json`, де прописані ціни в смарагдах на всі категорії риб мода. |
| 15 | `sgearmetalworks` -> `silentgear` | ✅ | **Підтверджено:** рецепти `sgearmetalworks:casting/*_cast` (наприклад, `axe_cast.json`, `arrow_cast.json`) відливають ливарні форми зі сталі (`#c:molten_steel`), використовуючи відповідні деталі Silent Gear як зразок. |
| 16 | `sgearmetalworks` -> `productivemetalworks` | ✅ | **Підтверджено:** `sgearmetalworks` додає для ливарні Productive Metalworks сплави та метали Silent Gear: `data/productivemetalworks/recipe/alloying/molten_azure_electrum.json`, `molten_blaze_gold.json` тощо. |
| 17 | `silentgear` -> `apotheosis` | ✅ *(⚑)* | **Підтверджено:** `kubejs/dynamic_data/apotheosis/data_maps/item/loot_category_overrides.json` призначає булаві, сокирі та спису Silent Gear категорію `apotheosis:melee_weapon`, а щиту — `apotheosis:shield`.<br>⚑ *Рекомендовано перевірити в грі:* коректність збереження NBT модульних деталей Silent Gear при накладанні та реролі афіксів ковадлом Apotheosis. |
| 18 | `silentgems` -> `alltheores` | ✅ | **Підтверджено:** біомний модифікатор `kubejs/dynamic_data/atm/neoforge/biome_modifier/remove_silentgems_ores.json` видаляє генерацію `ruby_ore`, `peridot_ore`, `sapphire_ore` та `silver_ore` Silent's Gems на користь руд AllTheOres. Інші руди самоцвітів та хаосу залишено. |
| 19 | `sophisticatedstorageinmotion` -> `sophisticatedstorage` | ✅ | **Підтверджено:** серія рецептів типу `sophisticatedstorageinmotion:moving_storage_tier_upgrade_shaped_recipe` та `moving_storage_from_storage` оновлює та перетворює вагонетки й човни зі скринями/діжками Sophisticated Storage, зберігаючи інвентар та покращення. |
| 20 | `strainers` -> `allthemodium` | ✅ | **Підтверджено:** `kubejs/server_scripts/mods/bbl_strainers/meshes.js` створює рецепт `kubejs:allthemodium_mesh` з `allthemodium:allthemodium_ingot` та `strainers:netherite_mesh`, додаючи її до найвищого тиру `strainers:tier_12_meshes`. |
| 21 | `thaumaturge` -> `appliedthaumaturge` | ✅ | **Підтверджено:** jar `appliedthaumaturge` містить повний набір ME-інтеграції: комірки `essentia_cell_1k`...`64k`, шини імпорту/експорту/зберігання есенції, термінали, а також блоки `arcane_assembler` та `infusion_provider` (з рецептами інфузії для автокрафту). |
| 22 | `thaumaturge` -> `ae2` | ✅ | **Підтверджено:** `wireless_arcane_terminal` та `vis_relay_interface`. У дослідженні `research.appliedthaumaturge.wireless_arcane_terminal.stage_1` дослівно зазначено: *"I link it in a Wireless Access Point and charge it in an AE2 Charger"*. |
| 23 | `theurgy` -> `theurgy_kubejs` | ✅ | **Підтверджено:** завдяки `theurgy_kubejs` у `startup_scripts/theurgy/sulfur_additions.js` реєструються кастомні сірки (ієсній, містичний кристал, руна, стеларит, борт, уламок процвітання), а в `server_scripts/mods/theurgy/incubation.js` створюються рецепти їх інкубації. |
| 24 | `theurgy` -> `allthemodium` | ✅ | **Підтверджено:** `theurgy:alchemical_sulfur_allthemodium` належить до тегу `#theurgy:alchemical_sulfurs/precious`, використовується в крафті `sulfur_attuned_divination_rod_precious`, інкубується назад у злиток Allthemodium. Квест `7878F190BC8ADC82` («Жезл ворожіння: коштовні матеріали») перевірено. |
| 25 | `theurgy` -> `mysticalagriculture` | ✅ | **Підтверджено:** `kubejs/server_scripts/mods/theurgy/incubation.js` (L36-38) додає інкубацію `mysticalagriculture:prosperity_shard` з `kubejs:prosperity_sulfur`. Назва в базі збігається («Уламок процвітання»). |
| 26 | `theurgy` -> `forbidden_arcanus` | ✅ | **Підтверджено:** у `incubation.js` (L23-27) прописана інкубація `forbidden_arcanus:arcane_crystal`, `rune` та `stellarite_piece`. Назви в базі («Містичний кристал», «Руна», «Шматок стелариту») збігаються. |
| 27 | `theurgy_kubejs` -> `forbidden_arcanus` | ✅ | **Підтверджено:** саме `theurgy_kubejs` дозволяє реєструвати кастомні сірки матеріалів Forbidden Arcanus (`arcane_sulfur`, `runic_sulfur`, `stellarite_sulfur`) для розмноження в інкубаторі. |
| 28 | `undergarden` -> `allthemodium` | ✅ *(⚑)* | **Підтверджено:** у `data/minecraft/tags/block/incorrect_for_netherite_tool.json` мод Undergarden додає `#undergarden:needs_forgotten_tool` (куди входять `dreadrock` та `dreadrock_rogdorium_ore`). Водночас `incorrect_for_allthemodium_tool` не містить цього тегу, завдяки чому кайло Allthemodium здатне ламати жахокамінь.<br>⚑ *Рекомендовано перевірити в грі:* переконатися на живому клієнті, що кайло Allthemodium справді дропає жахокамінь/руду та не викликає затримки копання через високу міцність блоку. |
| 29 | `universalgrid` -> `refinedstorage_quartz_arsenal` | ✅ | **Підтверджено:** рецепт `universalgrid:wireless_universal_grid` безпосередньо вимагає `refinedstorage_quartz_arsenal:wireless_crafting_grid` як центральний крафтовий інгредієнт ("C"). |
| 30 | `waystones` -> `ftbchunks` | ✅ | **Підтверджено:** у `kubejs/server_scripts/tweaks/tags.js` (L6) міститься правило: `allthemods.add("ftbchunks:interact_whitelist", ["@waystones"])`, що дозволяє взаємодію з усіма дороговказами в запривачених чанках. |
| 31 | `waystones` -> `occultism` | ✅ | **Підтверджено:** скрипт `kubejs/server_scripts/mods/geore/crystalline_wand.js` визначає ритуал `occultism:crystalline_infusion`, де `waystones:warp_stone` («Мандрівний камінь») є інгредієнтом для створення `kubejs:perfected_crystalline_wand` («Досконалий кристалічний резонансний жезл»). |
| 32 | `waystones` -> `journeymap` | ✅ | **Підтверджено:** `config/waystones-common.toml` має секцію `[journeyMap]` з `enabled = true`. У jar Waystones клас `net/blay09/mods/waystones/compat/JourneyMapIntegration.class` створює шляхові точки для активованих дороговказів. |
| 33 | `witchery` -> `curios` | ✅ | **Підтверджено:** jar `witchery` має теги `data/curios/tags/item/{back,belt,charm,necklace,poppet,ring}.json` та реєструє відповідні слоти Curios (`poppet`, `ring`) для магічних предметів мода. |

---

## 💡 Рекомендації до фінального оновлення Батчу 5

1. **Синергія 1 (`productivemetalworks -> silentgear`):** змінити «лазурне срібло й електрум» на «блакитне срібло й електрум» відповідно до офіційної локалізації.
2. **Синергія 8 (`railcraft -> alltheores`):** уточнити в `ref`, що замість `c:gears/iron` машини беруть `c:gears/bronze` (ручний верстат) та `c:gears/steel` (механічний верстат і локомотив).
3. **Синергія 12 (`reliquary -> mysticalagriculture`):** замінити «троянда без візера» на «Нев'януча троянда», а «душа візера» на «Висушена душа».
4. **Позначка «⚑ перевірити в грі»:** додати до синергій **№17** (Silent Gear + Apotheosis) та **№28** (Undergarden Dreadrock + Allthemodium Pickaxe).
