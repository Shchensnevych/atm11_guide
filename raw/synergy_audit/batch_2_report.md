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