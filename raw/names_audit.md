# Назви предметів: гра проти бази путівника (tools/audit_names.py, K5)

Знімок: мова uk_ua, предметів у реєстрі гри 36692, з назвою 36632, гра показує ключем перекладу 58, помилок читання 1.

| Що | Скільки |
|---|---|
| назва з гри = назва з перекладу | 33522 |
| назви в перекладі немає → узято з гри | 2565 |
| назва-шаблон у перекладі → узято з гри (шаблон спільний для кількох предметів) | 325 |
| назва-шаблон лише в одного предмета → назва без підстановки | 56 |
| гра й переклад розходяться | 164: лишено назву предмета 107, узято з гри 57 |
| предметів реєстру гри без назви в базі | 46 |
| назв-шаблонів лишилось | 1 |
| предметів з бази рецептів без назви | 1329 з 27015 |

У базі, але не в реєстрі гри (блоки без предмета, старі ключі перекладу): 3286.

## Розбіжність: назва екземпляра ≠ назва предмета — 107
Переклад ключа предмета в грі збігається з базою; гра показує іншу назву типового екземпляра (напр. зілля без ефекту). За модами: silentgear 43, iceandfire 36, refinedflowanalytics 15, minecraft 4, occultism 3, energizedpower 2, ae2 1, enderio 1, ftbquests 1, thaumaturge 1

| Предмет | У базі (переклад) | Показує гра | Переклад ключа предмета в грі | Ключ |
|---|---|---|---|---|
| `ae2:color_applicator` | Аплікатор кольорів | Аплікатор кольорів - Порожньо | Аплікатор кольорів | `item.ae2.color_applicator` |
| `enderio:loot_capacitor` | Конденсатор здобичі | Несправний конденсатор | Конденсатор здобичі | `item.enderio.loot_capacitor` |
| `energizedpower:machine_configurator` | Конфігуратор машин | Конфігуратор машин [не налаштовано] | Конфігуратор машин | `item.energizedpower.machine_configurator` |
| `energizedpower:teleporter_matrix` | Матриця телепортера | Матриця телепортера [не прив'язано] | Матриця телепортера | `item.energizedpower.teleporter_matrix` |
| `ftbquests:custom_icon` | Спеціальна іконка | Текстура: minecraft:textures/misc/unknown_pack.png | Спеціальна іконка | `item.ftbquests.custom_icon` |
| `iceandfire:dragonarmor_copper_body` | Мідні драконячі обладунки: тіло | Мідні драконячі обладунки | Мідні драконячі обладунки: тіло | `item.iceandfire.dragonarmor_copper_body` |
| `iceandfire:dragonarmor_copper_head` | Мідні драконячі обладунки: голова | Мідні драконячі обладунки | Мідні драконячі обладунки: голова | `item.iceandfire.dragonarmor_copper_head` |
| `iceandfire:dragonarmor_copper_neck` | Мідні драконячі обладунки: шия | Мідні драконячі обладунки | Мідні драконячі обладунки: шия | `item.iceandfire.dragonarmor_copper_neck` |
| `iceandfire:dragonarmor_copper_tail` | Мідні драконячі обладунки: хвіст | Мідні драконячі обладунки | Мідні драконячі обладунки: хвіст | `item.iceandfire.dragonarmor_copper_tail` |
| `iceandfire:dragonarmor_diamond_body` | Діамантові драконячі обладунки: тіло | Діамантові драконячі обладунки | Діамантові драконячі обладунки: тіло | `item.iceandfire.dragonarmor_diamond_body` |
| `iceandfire:dragonarmor_diamond_head` | Діамантові драконячі обладунки: голова | Діамантові драконячі обладунки | Діамантові драконячі обладунки: голова | `item.iceandfire.dragonarmor_diamond_head` |
| `iceandfire:dragonarmor_diamond_neck` | Діамантові драконячі обладунки: шия | Діамантові драконячі обладунки | Діамантові драконячі обладунки: шия | `item.iceandfire.dragonarmor_diamond_neck` |
| `iceandfire:dragonarmor_diamond_tail` | Діамантові драконячі обладунки: хвіст | Діамантові драконячі обладунки | Діамантові драконячі обладунки: хвіст | `item.iceandfire.dragonarmor_diamond_tail` |
| `iceandfire:dragonarmor_dragon_steel_fire_body` | Вогняні драконесталеві драконячі обладунки: тіло | Вогняні драконесталеві драконячі обладунки | Вогняні драконесталеві драконячі обладунки: тіло | `item.iceandfire.dragonarmor_dragon_steel_fire_body` |
| `iceandfire:dragonarmor_dragon_steel_fire_head` | Вогняні драконесталеві драконячі обладунки: голова | Вогняні драконесталеві драконячі обладунки | Вогняні драконесталеві драконячі обладунки: голова | `item.iceandfire.dragonarmor_dragon_steel_fire_head` |
| `iceandfire:dragonarmor_dragon_steel_fire_neck` | Вогняні драконесталеві драконячі обладунки: шия | Вогняні драконесталеві драконячі обладунки | Вогняні драконесталеві драконячі обладунки: шия | `item.iceandfire.dragonarmor_dragon_steel_fire_neck` |
| `iceandfire:dragonarmor_dragon_steel_fire_tail` | Вогняні драконесталеві драконячі обладунки: хвіст | Вогняні драконесталеві драконячі обладунки | Вогняні драконесталеві драконячі обладунки: хвіст | `item.iceandfire.dragonarmor_dragon_steel_fire_tail` |
| `iceandfire:dragonarmor_dragon_steel_ice_body` | Крижані драконесталеві драконячі обладунки: тіло | Крижані драконесталеві драконячі обладунки | Крижані драконесталеві драконячі обладунки: тіло | `item.iceandfire.dragonarmor_dragon_steel_ice_body` |
| `iceandfire:dragonarmor_dragon_steel_ice_head` | Крижані драконесталеві драконячі обладунки: голова | Крижані драконесталеві драконячі обладунки | Крижані драконесталеві драконячі обладунки: голова | `item.iceandfire.dragonarmor_dragon_steel_ice_head` |
| `iceandfire:dragonarmor_dragon_steel_ice_neck` | Крижані драконесталеві драконячі обладунки: шия | Крижані драконесталеві драконячі обладунки | Крижані драконесталеві драконячі обладунки: шия | `item.iceandfire.dragonarmor_dragon_steel_ice_neck` |
| `iceandfire:dragonarmor_dragon_steel_ice_tail` | Крижані драконесталеві драконячі обладунки: хвіст | Крижані драконесталеві драконячі обладунки | Крижані драконесталеві драконячі обладунки: хвіст | `item.iceandfire.dragonarmor_dragon_steel_ice_tail` |
| `iceandfire:dragonarmor_dragon_steel_lightning_body` | Громові драконесталеві драконячі обладунки: тіло | Громові драконесталеві драконячі обладунки | Громові драконесталеві драконячі обладунки: тіло | `item.iceandfire.dragonarmor_dragon_steel_lightning_body` |
| `iceandfire:dragonarmor_dragon_steel_lightning_head` | Громові драконесталеві драконячі обладунки: голова | Громові драконесталеві драконячі обладунки | Громові драконесталеві драконячі обладунки: голова | `item.iceandfire.dragonarmor_dragon_steel_lightning_head` |
| `iceandfire:dragonarmor_dragon_steel_lightning_neck` | Громові драконесталеві драконячі обладунки: шия | Громові драконесталеві драконячі обладунки | Громові драконесталеві драконячі обладунки: шия | `item.iceandfire.dragonarmor_dragon_steel_lightning_neck` |
| `iceandfire:dragonarmor_dragon_steel_lightning_tail` | Громові драконесталеві драконячі обладунки: хвіст | Громові драконесталеві драконячі обладунки | Громові драконесталеві драконячі обладунки: хвіст | `item.iceandfire.dragonarmor_dragon_steel_lightning_tail` |
| `iceandfire:dragonarmor_gold_body` | Золоті драконячі обладунки: тіло | Золоті драконячі обладунки | Золоті драконячі обладунки: тіло | `item.iceandfire.dragonarmor_gold_body` |
| `iceandfire:dragonarmor_gold_head` | Золоті драконячі обладунки: голова | Золоті драконячі обладунки | Золоті драконячі обладунки: голова | `item.iceandfire.dragonarmor_gold_head` |
| `iceandfire:dragonarmor_gold_neck` | Золоті драконячі обладунки: шия | Золоті драконячі обладунки | Золоті драконячі обладунки: шия | `item.iceandfire.dragonarmor_gold_neck` |
| `iceandfire:dragonarmor_gold_tail` | Золоті драконячі обладунки: хвіст | Золоті драконячі обладунки | Золоті драконячі обладунки: хвіст | `item.iceandfire.dragonarmor_gold_tail` |
| `iceandfire:dragonarmor_iron_body` | Залізні драконячі обладунки: тіло | Залізні драконячі обладунки | Залізні драконячі обладунки: тіло | `item.iceandfire.dragonarmor_iron_body` |
| `iceandfire:dragonarmor_iron_head` | Залізні драконячі обладунки: голова | Залізні драконячі обладунки | Залізні драконячі обладунки: голова | `item.iceandfire.dragonarmor_iron_head` |
| `iceandfire:dragonarmor_iron_neck` | Залізні драконячі обладунки: шия | Залізні драконячі обладунки | Залізні драконячі обладунки: шия | `item.iceandfire.dragonarmor_iron_neck` |
| `iceandfire:dragonarmor_iron_tail` | Залізні драконячі обладунки: хвіст | Залізні драконячі обладунки | Залізні драконячі обладунки: хвіст | `item.iceandfire.dragonarmor_iron_tail` |
| `iceandfire:dragonarmor_netherite_body` | Незеритові драконячі обладунки: тіло | Незеритові драконячі обладунки | Незеритові драконячі обладунки: тіло | `item.iceandfire.dragonarmor_netherite_body` |
| `iceandfire:dragonarmor_netherite_head` | Незеритові драконячі обладунки: голова | Незеритові драконячі обладунки | Незеритові драконячі обладунки: голова | `item.iceandfire.dragonarmor_netherite_head` |
| `iceandfire:dragonarmor_netherite_neck` | Незеритові драконячі обладунки: шия | Незеритові драконячі обладунки | Незеритові драконячі обладунки: шия | `item.iceandfire.dragonarmor_netherite_neck` |
| `iceandfire:dragonarmor_netherite_tail` | Незеритові драконячі обладунки: хвіст | Незеритові драконячі обладунки | Незеритові драконячі обладунки: хвіст | `item.iceandfire.dragonarmor_netherite_tail` |
| `iceandfire:dragonarmor_silver_body` | Срібні драконячі обладунки: тіло | Срібні драконячі обладунки | Срібні драконячі обладунки: тіло | `item.iceandfire.dragonarmor_silver_body` |
| `iceandfire:dragonarmor_silver_head` | Срібні драконячі обладунки: голова | Срібні драконячі обладунки | Срібні драконячі обладунки: голова | `item.iceandfire.dragonarmor_silver_head` |
| `iceandfire:dragonarmor_silver_neck` | Срібні драконячі обладунки: шия | Срібні драконячі обладунки | Срібні драконячі обладунки: шия | `item.iceandfire.dragonarmor_silver_neck` |
| `iceandfire:dragonarmor_silver_tail` | Срібні драконячі обладунки: хвіст | Срібні драконячі обладунки | Срібні драконячі обладунки: хвіст | `item.iceandfire.dragonarmor_silver_tail` |
| `minecraft:lingering_potion` | Осідальне зілля | Осідальна пляшка води | Осідальне зілля | `item.minecraft.lingering_potion` |
| `minecraft:potion` | Зілля | Пляшка води | Зілля | `item.minecraft.potion` |
| `minecraft:splash_potion` | Вибухове зілля | Вибухова пляшка води | Вибухове зілля | `item.minecraft.splash_potion` |
| `minecraft:tipped_arrow` | Оброблена стріла | Стріла отруєння | Оброблена стріла | `item.minecraft.tipped_arrow` |
| `occultism:fragile_soul_gem` | Крихкий самоцвіт душ | Крихкий порожній самоцвіт душ | Крихкий самоцвіт душ | `item.occultism.fragile_soul_gem` |
| `occultism:soul_gem` | Самоцвіт душ | Порожній самоцвіт душ | Самоцвіт душ | `item.occultism.soul_gem` |
| `occultism:trinity_gem` | Самоцвіт триєдності | Порожній самоцвіт триєдності | Самоцвіт триєдності | `item.occultism.trinity_gem` |
| `refinedflowanalytics:black_flow_detector` | Чорний детектор потоку | Чорний Детектор потоку | Чорний детектор потоку | `block.refinedflowanalytics.black_flow_detector` |
| `refinedflowanalytics:blue_flow_detector` | Синій детектор потоку | Синій Детектор потоку | Синій детектор потоку | `block.refinedflowanalytics.blue_flow_detector` |
| `refinedflowanalytics:brown_flow_detector` | Коричневий детектор потоку | Коричневий Детектор потоку | Коричневий детектор потоку | `block.refinedflowanalytics.brown_flow_detector` |
| `refinedflowanalytics:cyan_flow_detector` | Бірюзовий детектор потоку | Бірюзовий Детектор потоку | Бірюзовий детектор потоку | `block.refinedflowanalytics.cyan_flow_detector` |
| `refinedflowanalytics:gray_flow_detector` | Сірий детектор потоку | Сірий Детектор потоку | Сірий детектор потоку | `block.refinedflowanalytics.gray_flow_detector` |
| `refinedflowanalytics:green_flow_detector` | Зелений детектор потоку | Зелений Детектор потоку | Зелений детектор потоку | `block.refinedflowanalytics.green_flow_detector` |
| `refinedflowanalytics:light_gray_flow_detector` | Світло-сірий детектор потоку | Світло-сірий Детектор потоку | Світло-сірий детектор потоку | `block.refinedflowanalytics.light_gray_flow_detector` |
| `refinedflowanalytics:lime_flow_detector` | Лаймовий детектор потоку | Лаймовий Детектор потоку | Лаймовий детектор потоку | `block.refinedflowanalytics.lime_flow_detector` |
| `refinedflowanalytics:magenta_flow_detector` | Пурпуровий детектор потоку | Пурпуровий Детектор потоку | Пурпуровий детектор потоку | `block.refinedflowanalytics.magenta_flow_detector` |
| `refinedflowanalytics:orange_flow_detector` | Помаранчевий детектор потоку | Помаранчевий Детектор потоку | Помаранчевий детектор потоку | `block.refinedflowanalytics.orange_flow_detector` |
| `refinedflowanalytics:pink_flow_detector` | Рожевий детектор потоку | Рожевий Детектор потоку | Рожевий детектор потоку | `block.refinedflowanalytics.pink_flow_detector` |
| `refinedflowanalytics:purple_flow_detector` | Фіолетовий детектор потоку | Фіолетовий Детектор потоку | Фіолетовий детектор потоку | `block.refinedflowanalytics.purple_flow_detector` |
| `refinedflowanalytics:red_flow_detector` | Червоний детектор потоку | Червоний Детектор потоку | Червоний детектор потоку | `block.refinedflowanalytics.red_flow_detector` |
| `refinedflowanalytics:white_flow_detector` | Білий детектор потоку | Білий Детектор потоку | Білий детектор потоку | `block.refinedflowanalytics.white_flow_detector` |
| `refinedflowanalytics:yellow_flow_detector` | Жовтий детектор потоку | Жовтий Детектор потоку | Жовтий детектор потоку | `block.refinedflowanalytics.yellow_flow_detector` |
| `silentgear:arrow_heads` | Наконечники стріл | Наконечники стріл: Приклад | Наконечники стріл | `item.silentgear.arrow_heads` |
| `silentgear:axe_head` | Лезо сокири | Лезо сокири: Приклад | Лезо сокири | `item.silentgear.axe_head` |
| `silentgear:binding` | Обмотка | Обмотка: Приклад | Обмотка | `item.silentgear.binding` |
| `silentgear:boot_plates` | Пластини черевиків | Пластини черевиків: Приклад | Пластини черевиків | `item.silentgear.boot_plates` |
| `silentgear:bow_limbs` | Плечі лука | Плечі лука: Приклад | Плечі лука | `item.silentgear.bow_limbs` |
| `silentgear:bracelet_band` | Обідок браслета | Обідок браслета: Приклад | Обідок браслета | `item.silentgear.bracelet_band` |
| `silentgear:chestplate_plates` | Пластини нагрудника | Пластини нагрудника: Приклад | Пластини нагрудника | `item.silentgear.chestplate_plates` |
| `silentgear:coating` | Покриття | Покриття: Приклад | Покриття | `item.silentgear.coating` |
| `silentgear:cord` | Тятива | Тятива: Приклад | Тятива | `item.silentgear.cord` |
| `silentgear:crossbow_limbs` | Плечі арбалета | Плечі арбалета: Приклад | Плечі арбалета | `item.silentgear.crossbow_limbs` |
| `silentgear:dagger_blade` | Лезо кинджала | Лезо кинджала: Приклад | Лезо кинджала | `item.silentgear.dagger_blade` |
| `silentgear:elytra_wings` | Крила елітр | Крила елітр: Приклад | Крила елітр | `item.silentgear.elytra_wings` |
| `silentgear:excavator_head` | Голова екскаватора | Голова екскаватора: Приклад | Голова екскаватора | `item.silentgear.excavator_head` |
| `silentgear:fishing_reel_and_hook` | Котушка й гачок | Котушка й гачок: Приклад | Котушка й гачок | `item.silentgear.fishing_reel_and_hook` |
| `silentgear:fletching` | Оперення | Оперення: Приклад | Оперення | `item.silentgear.fletching` |
| `silentgear:grip` | Руків'я | Руків'я: Приклад | Руків'я | `item.silentgear.grip` |
| `silentgear:hammer_head` | Голова молота | Голова молота: Приклад | Голова молота | `item.silentgear.hammer_head` |
| `silentgear:helmet_plates` | Пластини шолома | Пластини шолома: Приклад | Пластини шолома | `item.silentgear.helmet_plates` |
| `silentgear:hoe_head` | Лезо мотики | Лезо мотики: Приклад | Лезо мотики | `item.silentgear.hoe_head` |
| `silentgear:katana_blade` | Лезо катани | Лезо катани: Приклад | Лезо катани | `item.silentgear.katana_blade` |
| `silentgear:knife_blade` | Лезо ножа | Лезо ножа: Приклад | Лезо ножа | `item.silentgear.knife_blade` |
| `silentgear:legging_plates` | Пластини поножів | Пластини поножів: Приклад | Пластини поножів | `item.silentgear.legging_plates` |
| `silentgear:lining` | Підкладка | Підкладка: Приклад | Підкладка | `item.silentgear.lining` |
| `silentgear:mace_core` | Осердя булави | Осердя булави: Приклад | Осердя булави | `item.silentgear.mace_core` |
| `silentgear:machete_blade` | Лезо мачете | Лезо мачете: Приклад | Лезо мачете | `item.silentgear.machete_blade` |
| `silentgear:mattock_head` | Голова кайла-мотики | Голова кайла-мотики: Приклад | Голова кайла-мотики | `item.silentgear.mattock_head` |
| `silentgear:necklace_chain` | Ланцюжок намиста | Ланцюжок намиста: Приклад | Ланцюжок намиста | `item.silentgear.necklace_chain` |
| `silentgear:paxel_head` | Голова пекселя | Голова пекселя: Приклад | Голова пекселя | `item.silentgear.paxel_head` |
| `silentgear:pickaxe_head` | Голова кайла | Голова кайла: Приклад | Голова кайла | `item.silentgear.pickaxe_head` |
| `silentgear:prospector_hammer_head` | Голова молота розвідника | Голова молота розвідника: Приклад | Голова молота розвідника | `item.silentgear.prospector_hammer_head` |
| `silentgear:ring_shank` | Обідок персня | Обідок персня: Приклад | Обідок персня | `item.silentgear.ring_shank` |
| `silentgear:rod` | Руків'я інструмента | Руків'я інструмента: Приклад | Руків'я інструмента | `item.silentgear.rod` |
| `silentgear:saw_blade` | Полотно пилки | Полотно пилки: Приклад | Полотно пилки | `item.silentgear.saw_blade` |
| `silentgear:setting` | Оправа прикраси | Оправа прикраси: Приклад | Оправа прикраси | `item.silentgear.setting` |
| `silentgear:shear_blades` | Леза ножиць | Леза ножиць: Приклад | Леза ножиць | `item.silentgear.shear_blades` |
| `silentgear:shield_plate` | Пластина щита | Пластина щита: Приклад | Пластина щита | `item.silentgear.shield_plate` |
| `silentgear:shovel_head` | Лопать лопати | Лопать лопати: Приклад | Лопать лопати | `item.silentgear.shovel_head` |
| `silentgear:sickle_blade` | Лезо серпа | Лезо серпа: Приклад | Лезо серпа | `item.silentgear.sickle_blade` |
| `silentgear:slingshot_limbs` | Плечі рогатки | Плечі рогатки: Приклад | Плечі рогатки | `item.silentgear.slingshot_limbs` |
| `silentgear:spearhead` | Вістря списа | Вістря списа: Приклад | Вістря списа | `item.silentgear.spearhead` |
| `silentgear:sword_blade` | Лезо меча | Лезо меча: Приклад | Лезо меча | `item.silentgear.sword_blade` |
| `silentgear:tip` | Наконечник | Наконечник: Приклад | Наконечник | `item.silentgear.tip` |
| `silentgear:trident_prongs` | Зубці тризуба | Зубці тризубця: Приклад | Зубці тризуба | `item.silentgear.trident_prongs` |
| `thaumaturge:wand` | Жезл | Дерев'яний жезл із залізними ковпачками | Жезл | `item.thaumaturge.wand` |

## Розбіжність: ключ предмета в грі перекладено інакше, ніж у базі — 0
У базі назва з іншого ключа, ніж той, яким предмет називає гра. За модами: 


## Розбіжність: гра показує переклад свого ключа, у базі — інше — 57
Назва в грі — простий переклад ключа предмета, але в базі інший текст (застарілий переклад або не той ключ). За модами: iceandfire 28, minecraft 27, occultism 1, oritech 1

| Предмет | У базі (переклад) | Показує гра | Переклад ключа предмета в грі | Ключ |
|---|---|---|---|---|
| `iceandfire:tide_blue_boots` | Чоботи з луски синього левіафана | Чоботи морського вартового |  | `` |
| `iceandfire:tide_blue_chestplate` | Нагрудник з луски синього левіафана | Нагрудник морського вартового |  | `` |
| `iceandfire:tide_blue_helmet` | Шолом з луски синього левіафана | Шолом морського вартового |  | `` |
| `iceandfire:tide_blue_leggings` | Наголінники з луски синього левіафана | Наголінники морського вартового |  | `` |
| `iceandfire:tide_bronze_boots` | Чоботи з луски бронзового левіафана | Чоботи морського вартового |  | `` |
| `iceandfire:tide_bronze_chestplate` | Нагрудник з луски бронзового левіафана | Нагрудник морського вартового |  | `` |
| `iceandfire:tide_bronze_helmet` | Шолом з луски бронзового левіафана | Шолом морського вартового |  | `` |
| `iceandfire:tide_bronze_leggings` | Наголінники з луски бронзового левіафана | Наголінники морського вартового |  | `` |
| `iceandfire:tide_deepblue_boots` | Чоботи з луски темно-синього левіафана | Чоботи морського вартового |  | `` |
| `iceandfire:tide_deepblue_chestplate` | Нагрудник з луски темно-синього левіафана | Нагрудник морського вартового |  | `` |
| `iceandfire:tide_deepblue_helmet` | Шолом з луски темно-синього левіафана | Шолом морського вартового |  | `` |
| `iceandfire:tide_deepblue_leggings` | Наголінники з луски темно-синього левіафана | Наголінники морського вартового |  | `` |
| `iceandfire:tide_green_boots` | Чоботи з луски зеленого левіафана | Чоботи морського вартового |  | `` |
| `iceandfire:tide_green_chestplate` | Нагрудник з луски зеленого левіафана | Нагрудник морського вартового |  | `` |
| `iceandfire:tide_green_helmet` | Шолом з луски зеленого левіафана | Шолом морського вартового |  | `` |
| `iceandfire:tide_green_leggings` | Наголінники з луски зеленого левіафана | Наголінники морського вартового |  | `` |
| `iceandfire:tide_purple_boots` | Чоботи з луски фіолетового левіафана | Чоботи морського вартового |  | `` |
| `iceandfire:tide_purple_chestplate` | Нагрудник з луски фіолетового левіафана | Нагрудник морського вартового |  | `` |
| `iceandfire:tide_purple_helmet` | Шолом з луски фіолетового левіафана | Шолом морського вартового |  | `` |
| `iceandfire:tide_purple_leggings` | Наголінники з луски фіолетового левіафана | Наголінники морського вартового |  | `` |
| `iceandfire:tide_red_boots` | Чоботи з луски червоного левіафана | Чоботи морського вартового |  | `` |
| `iceandfire:tide_red_chestplate` | Нагрудник з луски червоного левіафана | Нагрудник морського вартового |  | `` |
| `iceandfire:tide_red_helmet` | Шолом з луски червоного левіафана | Шолом морського вартового |  | `` |
| `iceandfire:tide_red_leggings` | Наголінники з луски червоного левіафана | Наголінники морського вартового |  | `` |
| `iceandfire:tide_teal_boots` | Чоботи з луски бірюзового левіафана | Чоботи морського вартового |  | `` |
| `iceandfire:tide_teal_chestplate` | Нагрудник з луски бірюзового левіафана | Нагрудник морського вартового |  | `` |
| `iceandfire:tide_teal_helmet` | Шолом з луски бірюзового левіафана | Шолом морського вартового |  | `` |
| `iceandfire:tide_teal_leggings` | Наголінники з луски бірюзового левіафана | Наголінники морського вартового |  | `` |
| `minecraft:bolt_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Блискавка» |  | `` |
| `minecraft:coast_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Берег» |  | `` |
| `minecraft:creeper_banner_pattern` | Візерунок стяга | Візерунок стяга «Емблема кріпера» |  | `` |
| `minecraft:dune_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Дюна» |  | `` |
| `minecraft:eye_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Око» |  | `` |
| `minecraft:flow_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Плин» |  | `` |
| `minecraft:flow_banner_pattern` | Візерунок стяга | Візерунок стяга «Плин» |  | `` |
| `minecraft:flower_banner_pattern` | Візерунок стяга | Візерунок стяга «Емблема квітки» |  | `` |
| `minecraft:globe_banner_pattern` | Візерунок стяга | Візерунок стяга «Глобус» |  | `` |
| `minecraft:guster_banner_pattern` | Візерунок стяга | Візерунок стяга «Порив» |  | `` |
| `minecraft:host_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Господар» |  | `` |
| `minecraft:mojang_banner_pattern` | Візерунок стяга | Візерунок стяга «Річ» |  | `` |
| `minecraft:netherite_upgrade_smithing_template` | Ковальський шаблон | Незеритове покращення |  | `` |
| `minecraft:piglin_banner_pattern` | Візерунок стяга | Візерунок стяга «Рило» |  | `` |
| `minecraft:raiser_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Вирощувач» |  | `` |
| `minecraft:rib_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Ребра» |  | `` |
| `minecraft:sentry_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Варта» |  | `` |
| `minecraft:shaper_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Скульптор» |  | `` |
| `minecraft:silence_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Тиша» |  | `` |
| `minecraft:skull_banner_pattern` | Візерунок стяга | Візерунок стяга «Емблема черепа» |  | `` |
| `minecraft:snout_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Рило» |  | `` |
| `minecraft:spire_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Вежа» |  | `` |
| `minecraft:tide_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Хвилі» |  | `` |
| `minecraft:vex_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Бісик» |  | `` |
| `minecraft:ward_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Боронитель» |  | `` |
| `minecraft:wayfinder_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Шляхошукач» |  | `` |
| `minecraft:wild_armor_trim_smithing_template` | Ковальський шаблон | Орнамент обладунків «Дикість» |  | `` |
| `occultism:otherworld_sapling_natural` | Нестабільний потойбічний паросток | Паросток дуба |  | `` |
| `oritech:copper_reinforced_plating` | Машинне покриття | Посилене міддю покриття |  | `` |

## Без назви в базі (реєстр гри) — 46
За модами: potionsmaster 20, forbidden_arcanus 5, modonomicon 5, tinymultiblocklib 4, occultism 3, productivebees 2, aether_ii 1, evilcraft 1, integratedtunnels 1, mffs 1, power_armor 1, sophisticatedstorage 1

- `aether_ii:music_block`
- `evilcraft:invisible_redstone`
- `forbidden_arcanus:desk`
- `forbidden_arcanus:forbiddenomicon`
- `forbidden_arcanus:omega_arcoin`
- `forbidden_arcanus:research_desk`
- `forbidden_arcanus:wand_desk`
- `integratedtunnels:dummy_pickaxe`
- `mffs:redstone_torch_off`
- `modonomicon:leaflet`
- `modonomicon:modonomicon_blue`
- `modonomicon:modonomicon_green`
- `modonomicon:modonomicon_purple`
- `modonomicon:modonomicon_red`
- `occultism:advancement_icon`
- `occultism:dictionary_of_spirits_icon`
- `occultism:entity_wormhole_portal`
- `potionsmaster:calcinated_coal_oresight_powder`
- `potionsmaster:calcinated_copper_oresight_powder`
- `potionsmaster:calcinated_diamond_oresight_powder`
- `potionsmaster:calcinated_emerald_oresight_powder`
- `potionsmaster:calcinated_gold_oresight_powder`
- `potionsmaster:calcinated_iron_oresight_powder`
- `potionsmaster:calcinated_lapis_oresight_powder`
- `potionsmaster:calcinated_netherite_oresight_powder`
- `potionsmaster:calcinated_quartz_oresight_powder`
- `potionsmaster:calcinated_redstone_oresight_powder`
- `potionsmaster:coal_oresight_powder`
- `potionsmaster:copper_oresight_powder`
- `potionsmaster:diamond_oresight_powder`
- `potionsmaster:emerald_oresight_powder`
- `potionsmaster:gold_oresight_powder`
- `potionsmaster:iron_oresight_powder`
- `potionsmaster:lapis_oresight_powder`
- `potionsmaster:netherite_oresight_powder`
- `potionsmaster:quartz_oresight_powder`
- `potionsmaster:redstone_oresight_powder`
- `power_armor:creative_battery`
- `productivebees:adv_breed_all_bees`
- `productivebees:adv_breed_bee`
- `sophisticatedstorage:inaccessible_slot`
- `theurgy:salt_icon`
- `tinymultiblocklib:diamond_structure`
- `tinymultiblocklib:ghost_block_item`
- `tinymultiblocklib:simple_multiblock`
- `tinymultiblocklib:test_block`

## Назви-шаблони, що лишились — 1
За модами: silentgear 1

- `silentgear:custom_gem` — %s

## Без назви в базі (база рецептів) — 1329
За модами: productivebees 460, biomeswevegone 101, pamhc2crops 96, ftbmaterials 79, pamhc2trees 49, simplefarming 41, biomesoplenty 40, betterendforge 35, thermal 33, botania 27, betternether 26, tropicraft 25

- `actuallyadditions:black_quartz`
- `actuallyadditions:canola_seeds`
- `actuallyadditions:coffee_seeds`
- `actuallyadditions:flax_seeds`
- `actuallyadditions:rice_seeds`
- `ad_astra:cheese`
- `ad_astra:cheese_block`
- `advanced_ae:quantum_infusion_source`
- `appflux:charged_redstone`
- `appflux:charged_redstone_block`
- `appflux:energy_processor`
- `appflux:printed_energy_processor`
- `appflux:redstone_crystal`
- `ars_nouveau:air_essence`
- `ars_nouveau:earth_essence`
- `ars_nouveau:fire_essence`
- `ars_nouveau:source_gem`
- `ars_nouveau:source_jar`
- `ars_nouveau:sourceberry_bush`
- `ars_nouveau:water_essence`
- `astralsorcery:aquamarine`
- `astralsorcery:aquamarine_shale`
- `astralsorcery:marble_raw`
- `astralsorcery:rock_crystal`
- `astralsorcery:rock_crystal_ore`
- `astralsorcery:starmetal_ingot`
- `avaritia:neutron_nugget`
- `avaritia:neutronium_nugget`
- `betterendforge:amber_moss`
- `betterendforge:amber_root_seed`
- `betterendforge:blossom_berry_seed`
- `betterendforge:blue_vine_seed`
- `betterendforge:bolux_mushroom`
- `betterendforge:bulb_vine_seed`
- `betterendforge:cave_moss`
- `betterendforge:chorus_mushroom_raw`
- `betterendforge:chorus_mushroom_seed`
- `betterendforge:chorus_nylium`
- `betterendforge:crystal_moss`
- `betterendforge:dragon_tree_sapling`
- `betterendforge:end_lily_seed`
- `betterendforge:end_lotus_seed`
- `betterendforge:end_moss`
- `betterendforge:end_mycelium`
- `betterendforge:glowing_pillar_seed`
- `betterendforge:helix_tree_sapling`
- `betterendforge:hydralux_sapling`
- `betterendforge:jungle_moss`
- `betterendforge:lacugrove_sapling`
- `betterendforge:lanceleaf_seed`
- `betterendforge:lucernia_sapling`
- `betterendforge:lumecorn_seed`
- `betterendforge:mossy_dragon_bone`
- `betterendforge:mossy_glowshroom_sapling`
- `betterendforge:mossy_obsidian`
- `betterendforge:pink_moss`
- `betterendforge:pythadendron_sapling`
- `betterendforge:shadow_berry`
- `betterendforge:shadow_grass`
- `betterendforge:small_amaranita_mushroom`
- `betterendforge:small_jellyshroom`
- `betterendforge:tenanea_sapling`
- `betterendforge:umbrella_tree_sapling`
- `betternether:agave`
- `betternether:anchor_tree_sapling`
- `betternether:black_apple_seed`
- `betternether:ceiling_mushrooms`
- `betternether:eye_seed`
- `betternether:farmland`
- `betternether:giant_mold_sapling`
- `betternether:golden_lumabus_seed`
- `betternether:ink_bush_seed`
- `betternether:jellyfish_mushroom_sapling`
- `betternether:lumabus_seed`
- `betternether:magma_flower`
- `betternether:mushroom_fir_sapling`
- `betternether:mushroom_grass`
- `betternether:nether_sakura_sapling`
- `betternether:netherrack_moss`
- `betternether:orange_mushroom`
- `betternether:rubeus_sapling`
- `betternether:sepia_mushroom_grass`
- `betternether:soul_lily_sapling`
- `betternether:stalagnate_seed`
- `betternether:swampland_grass`
- `betternether:wall_mushroom_brown`
- `betternether:wall_mushroom_red`
- `betternether:whispering_gourd_vine`
- `betternether:willow_sapling`
- `bigreactors:anglesite_crystal`
- `bigreactors:benitoite_crystal`
- `bigreactors:cyanite_ingot`
- `bigreactors:yellorium_ingot`
- `biomesoplenty:blue_hydrangea`
- `biomesoplenty:burning_blossom`
- `biomesoplenty:dead_planks`
- `biomesoplenty:dead_sapling`
- `biomesoplenty:fir_planks`
- `biomesoplenty:fir_sapling`
- `biomesoplenty:flowering_oak_sapling`
- `biomesoplenty:glowflower`
- `biomesoplenty:glowshroom`
- `biomesoplenty:goldenrod`
- `biomesoplenty:hellbark_planks`
- `biomesoplenty:hellbark_sapling`
- `biomesoplenty:icy_iris`
- `biomesoplenty:jacaranda_planks`
- `biomesoplenty:jacaranda_sapling`
- `biomesoplenty:lavender`
- `biomesoplenty:magic_planks`
- `biomesoplenty:magic_sapling`
- `biomesoplenty:mahogany_planks`
- `biomesoplenty:mahogany_sapling`
- `biomesoplenty:orange_cosmos`
- `biomesoplenty:origin_grass_block`
- `biomesoplenty:origin_sapling`
- `biomesoplenty:palm_planks`
- `biomesoplenty:palm_sapling`
- `biomesoplenty:pink_daffodil`
- `biomesoplenty:pink_hibiscus`
- `biomesoplenty:purple_wildflowers`
- `biomesoplenty:rainbow_birch_sapling`
- `biomesoplenty:redwood_planks`
- `biomesoplenty:redwood_sapling`
- `biomesoplenty:rose`
- `biomesoplenty:tall_lavender`
- `biomesoplenty:toadstool`
- `biomesoplenty:umbran_planks`
- `biomesoplenty:umbran_sapling`
- `biomesoplenty:violet`
- `biomesoplenty:willow_planks`
- `biomesoplenty:willow_sapling`
- `biomesoplenty:wilted_lily`
- `biomeswevegone:allium_flower_bush`
- `biomeswevegone:alpine_bellflower`
- `biomeswevegone:amaranth`
- `biomeswevegone:angelica`
- `biomeswevegone:araucaria_sapling`
- `biomeswevegone:aspen_sapling`
- `biomeswevegone:baobab_sapling`
- `biomeswevegone:begonia`
- `biomeswevegone:bistort`
- `biomeswevegone:black_rose`
- `biomeswevegone:blue_enchanted_sapling`
- `biomeswevegone:blue_sage`
- `biomeswevegone:blue_spruce_sapling`
- `biomeswevegone:brown_birch_sapling`
- `biomeswevegone:brown_oak_sapling`
- `biomeswevegone:brown_zelkova_sapling`
- `biomeswevegone:california_poppy`
- `biomeswevegone:cika_sapling`
- `biomeswevegone:crocus`
- `biomeswevegone:cyan_amaranth`
- `biomeswevegone:cyan_rose`
- `biomeswevegone:cyan_tulip`
- `biomeswevegone:cypress_sapling`
- `biomeswevegone:daffodil`
- `biomeswevegone:delphinium`
- `biomeswevegone:ebony_sapling`
- `biomeswevegone:fairy_slipper`
- `biomeswevegone:fir_sapling`
- `biomeswevegone:firecracker_flower_bush`
- `biomeswevegone:flowering_indigo_jacaranda_bush`
- `biomeswevegone:flowering_jacaranda_bush`
- `biomeswevegone:foxglove`
- `biomeswevegone:golden_spined_cactus`
- `biomeswevegone:green_enchanted_sapling`
- `biomeswevegone:green_mushroom`
- `biomeswevegone:green_tulip`
- `biomeswevegone:guzmania`
- `biomeswevegone:holly_sapling`
- `biomeswevegone:hydrangea_bush`
- `biomeswevegone:hydrangea_hedge`
- `biomeswevegone:incan_lily`
- `biomeswevegone:indigo_jacaranda_sapling`
- `biomeswevegone:iris`
- `biomeswevegone:jacaranda_sapling`
- `biomeswevegone:japanese_orchid`
- `biomeswevegone:kovan_flower`
- `biomeswevegone:lazarus_bellflower`
- `biomeswevegone:lollipop_flower`
- `biomeswevegone:magenta_amaranth`
- `biomeswevegone:magenta_tulip`
- `biomeswevegone:maple_sapling`
- `biomeswevegone:orange_amaranth`
- `biomeswevegone:orange_birch_sapling`
- `biomeswevegone:orange_daisy`
- `biomeswevegone:orange_oak_sapling`
- `biomeswevegone:orange_spruce_sapling`
- `biomeswevegone:orchard_sapling`
- `biomeswevegone:osiria_rose`
- `biomeswevegone:palm_sapling`
- `biomeswevegone:palo_verde_sapling`
- `biomeswevegone:peach_leather_flower`
- `biomeswevegone:pine_sapling`
- `biomeswevegone:pink_allium`
- `biomeswevegone:pink_allium_flower_bush`
- `biomeswevegone:pink_anemone`
- `biomeswevegone:pink_daffodil`
- `biomeswevegone:prairie_grass`
- `biomeswevegone:protea_flower`
- `biomeswevegone:purple_amaranth`
- `biomeswevegone:purple_sage`
- `biomeswevegone:purple_tulip`
- `biomeswevegone:rainbow_eucalyptus_sapling`
- `biomeswevegone:red_birch_sapling`
- `biomeswevegone:red_maple_sapling`
- `biomeswevegone:red_oak_sapling`
- `biomeswevegone:red_spruce_sapling`
- `biomeswevegone:redwood_sapling`
- `biomeswevegone:richea`
- `biomeswevegone:rose`
- `biomeswevegone:silver_maple_sapling`
- `biomeswevegone:silver_vase_flower`
- `biomeswevegone:skyris_sapling`
- `biomeswevegone:snowdrops`
- `biomeswevegone:tall_allium`
- `biomeswevegone:tall_pink_allium`
- `biomeswevegone:violet_leather_flower`
- `biomeswevegone:weeping_milkcap`
- `biomeswevegone:white_anemone`
- `biomeswevegone:white_mangrove_sapling`
- `biomeswevegone:white_sage`
- `biomeswevegone:willow_sapling`
- `biomeswevegone:winter_cyclamen`
- `biomeswevegone:winter_rose`
- `biomeswevegone:winter_scilla`
- `biomeswevegone:witch_hazel_sapling`
- `biomeswevegone:wood_blewit`
- `biomeswevegone:yellow_birch_sapling`
- `biomeswevegone:yellow_daffodil`
- `biomeswevegone:yellow_spruce_sapling`
- `biomeswevegone:yellow_tulip`
- `biomeswevegone:zelkova_sapling`
- `botania:black_mystical_flower`
- `botania:blue_mystical_flower`
- `botania:brown_mystical_flower`
- `botania:cyan_mystical_flower`
- `botania:elementium_ingot`
- `botania:gaia_ingot`
- `botania:gray_mystical_flower`
- `botania:green_mystical_flower`
- `botania:life_essence`
- `botania:light_blue_mystical_flower`
- `botania:light_gray_mystical_flower`
- `botania:lime_mystical_flower`
- `botania:magenta_mystical_flower`
- `botania:mana_diamond`
- `botania:mana_pearl`
- `botania:manasteel_ingot`
- `botania:orange_mystical_flower`
- `botania:pink_mystical_flower`
- `botania:pixie_dust`
- `botania:purple_mystical_flower`
- `botania:red_mystical_flower`
- `botania:rune_greed`
- `botania:rune_mana`
- `botania:terrasteel_block`
- `botania:terrasteel_ingot`
- `botania:white_mystical_flower`
- `botania:yellow_mystical_flower`
- `botanicadds:gaiasteel_ingot`
- `botanicadds:gaiasteel_nugget`
- `buzzier_bees:buttercup`
- `buzzier_bees:pink_clover`
- `buzzier_bees:white_clover`
- `byg:emeraldite_shards`
- `byg:pendorite_scraps`
- `chemlib:actinium`
- `chemlib:argon`
- `chemlib:barium`
- `chemlib:boron`
- `chemlib:calcium`
- `chemlib:carbon`
- `chemlib:chromium`
- `chemlib:cobalt`
- `chemlib:helium`
- `chemlib:iron`
- `chemlib:krypton`
- `chemlib:lithium`
- `chemlib:manganese`
- `chemlib:neodymium`
- `chemlib:neon`
- `chemlib:nickel`
- `chemlib:oxygen`
- `chemlib:plutonium`
- `chemlib:protactinium`
- `chemlib:radon`
- `chemlib:tellurium`
- `chemlib:uranium`
- `chemlib:xenon`
- `chemlib:zinc`
- `cinderscapes:bramble_berries`
- `cinderscapes:umbral_nylium`
- `cobblemon:black_apricorn`
- `cobblemon:blue_apricorn`
- `cobblemon:green_apricorn`
- `cobblemon:pink_apricorn`
- `cobblemon:red_apricorn`
- `cobblemon:white_apricorn`
… ще 1029

