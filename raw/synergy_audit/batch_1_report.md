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
