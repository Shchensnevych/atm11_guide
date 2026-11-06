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
