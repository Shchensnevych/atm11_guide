# KubeJS збірки — повний розбір (tools/extract_kubejs.py)

Пісочниця виконує всі скрипти як гра; цифри нижче — звірка з logs/kubejs/server.log останнього запуску гри.

| | гра | індекс |
|---|---|---|
| додано рецептів | 652 | 626 (активних 597) |
| вимкнено (remove) | 137 | 137 |
| змінено (replaceInput/Output) | 7 | 7 (+ forEachRecipe) |

Розбіжність «додано» — це рецепти, які скрипти будують з JSON рецептів гри або з Java-реєстрів (розділ «Нерозв'язане»): пісочниця їх не відтворює; вони не вигадуються — їх просто немає в індексі.

## Скрипти: startup 17, server 153; не виконано 0


## Неактивні рецепти KubeJS (мода / типу немає) — 29

- `cataclysm:blasting/ancient_metal_nugget_from_blasting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/end_stone_pillar_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/polished_end_stone_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/obsidian_bricks_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/stone_tile_wall_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/chiseled_purpur_block_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/obsidian_brick_wall_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/polished_end_stone_stairs_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/obsidian_brick_stairs_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/stone_tile_slab_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/purpur_wall_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/chiseled_stone_brick_pillar_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/chiseled_end_stone_bricks_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/frosted_stone_brick_wall_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/stone_tile_stairs_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/quartz_brick_wall_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/obsidian_brick_slab_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/polished_end_stone_slab_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:blasting/black_steel_nugget_from_blasting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/frosted_stone_brick_stairs_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/chiseled_obsidian_bricks_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/frosted_stone_brick_slab_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/stone_tiles_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `cataclysm:stonecutting/stone_pillar_from_stonecutting` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `pastel:mod_integration/ae2/blasting/pure_fluix` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `pastel:mod_integration/ae2/blasting/pure_certus_quartz` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `mysticalagriculture:essence/enderio/copper_alloy_ingot` server_scripts/tweaks/disable_loot_table.js:5 — тип  — мода  немає
- `mysticalagriculture:essence/appliedenergistics2/engineering_press` server_scripts/tweaks/recipes_fix.js:29 — тип crafting_shaped — мода crafting_shaped немає
- `mysticalagriculture:essence/appliedenergistics2/logic_press` server_scripts/tweaks/recipes_fix.js:58 — тип crafting_shaped — мода crafting_shaped немає

## ID поза реєстром предметів (assets) в активних рецептах — 93 (інформативно: ритуали / пентаклі Occultism, предмети, які мод реєструє кодом — есенції MA тощо; гра пише «0 failed», тобто рецепти завантажились)

- `kjs:mods/bbl_strainers/meshes.js#L8` server_scripts/mods/bbl_strainers/meshes.js:8 — ID поза реєстром assets: minecraft:enchantments
- `allthemods:crystalline_infusion/crystalline_wand` server_scripts/mods/geore/crystalline_wand.js:139 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `allthemods:crystalline_infusion/perfect_crystalline_wand` server_scripts/mods/geore/crystalline_wand.js:166 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `kjs:mods/mysticalagriculture/experience_droplet.js#L8` server_scripts/mods/mysticalagriculture/experience_droplet.js:8 — ID поза реєстром assets: justdirethings:xp_fluid_source
- `kjs:mods/mysticalagriculture/experience_droplet.js#L16` server_scripts/mods/mysticalagriculture/experience_droplet.js:16 — ID поза реєстром assets: justdirethings:xp_fluid_source
- `kubejs:mysticalagriculture/allthemodium_essence_crafting` server_scripts/mods/mysticalagriculture/fusion_crafting.js:8 — ID поза реєстром assets: mysticalagriculture:allthemodium_essence
- `kubejs:mysticalagriculture/vibranium_essence_crafting` server_scripts/mods/mysticalagriculture/fusion_crafting.js:8 — ID поза реєстром assets: mysticalagriculture:vibranium_essence
- `kubejs:mysticalagriculture/unobtainium_essence_crafting` server_scripts/mods/mysticalagriculture/fusion_crafting.js:8 — ID поза реєстром assets: mysticalagriculture:unobtainium_essence
- `kubejs:mysticalagriculture/darkstone_essence_crafting` server_scripts/mods/mysticalagriculture/fusion_crafting.js:8 — ID поза реєстром assets: mysticalagriculture:darkstone_essence
- `kubejs:mysticalagriculture/azure_silver_essence_crafting` server_scripts/mods/mysticalagriculture/fusion_crafting.js:8 — ID поза реєстром assets: mysticalagriculture:azure_silver_essence
- `kubejs:mysticalagriculture/crimson_iron_essence_crafting` server_scripts/mods/mysticalagriculture/fusion_crafting.js:8 — ID поза реєстром assets: mysticalagriculture:crimson_iron_essence
- `kubejs:mysticalagriculture/entro_essence_crafting` server_scripts/mods/mysticalagriculture/fusion_crafting.js:8 — ID поза реєстром assets: mysticalagriculture:entro_essence
- `allthemods:essence/regions_unexplored/alpha_log` server_scripts/mods/mysticalagriculture/recipes.js:113 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/ashen_log` server_scripts/mods/mysticalagriculture/recipes.js:118 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/bamboo_log` server_scripts/mods/mysticalagriculture/recipes.js:123 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/silver_birch_log` server_scripts/mods/mysticalagriculture/recipes.js:128 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/small_oak_log` server_scripts/mods/mysticalagriculture/recipes.js:133 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/baobab_log` server_scripts/mods/mysticalagriculture/recipes.js:138 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/blackwood_log` server_scripts/mods/mysticalagriculture/recipes.js:143 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/brimwood_log` server_scripts/mods/mysticalagriculture/recipes.js:148 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/cobalt_log` server_scripts/mods/mysticalagriculture/recipes.js:153 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/cypress_log` server_scripts/mods/mysticalagriculture/recipes.js:158 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/dead_log` server_scripts/mods/mysticalagriculture/recipes.js:163 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/eucalyptus_log` server_scripts/mods/mysticalagriculture/recipes.js:168 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/joshua_log` server_scripts/mods/mysticalagriculture/recipes.js:173 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/kapok_log` server_scripts/mods/mysticalagriculture/recipes.js:178 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/larch_log` server_scripts/mods/mysticalagriculture/recipes.js:183 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/magnolia_log` server_scripts/mods/mysticalagriculture/recipes.js:188 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/maple_log` server_scripts/mods/mysticalagriculture/recipes.js:193 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/mauve_log` server_scripts/mods/mysticalagriculture/recipes.js:198 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence, regions_unexplored:mauve_log
- `allthemods:essence/regions_unexplored/palm_log` server_scripts/mods/mysticalagriculture/recipes.js:203 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/pine_log` server_scripts/mods/mysticalagriculture/recipes.js:208 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/redwood_log` server_scripts/mods/mysticalagriculture/recipes.js:213 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/socotra_log` server_scripts/mods/mysticalagriculture/recipes.js:218 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `allthemods:essence/regions_unexplored/willow_log` server_scripts/mods/mysticalagriculture/recipes.js:223 — ID поза реєстром assets: mysticalagriculture:unexplored_wood_essence
- `mysticalagriculture:infusion/entro_seeds` server_scripts/mods/mysticalagriculture/recipes.js:265 — ID поза реєстром assets: mysticalagriculture:entro_seeds
- `occultism:copper_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:iron_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:tin_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:gold_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:nickel_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:coal_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:zinc_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:lead_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:silver_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:redstone_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:lapis_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:osmium_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:quartz_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:aluminum_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:uraninite_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:platinum_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:diamond_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:emerald_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:ancient_debris_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:allthemodium_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:vibranium_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:unobtainium_catalyst` server_scripts/mods/neovitae/meteor.js:183 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:copper_transumtation` server_scripts/mods/neovitae/meteor.js:304 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion
- `occultism:iron_transumtation` server_scripts/mods/neovitae/meteor.js:304 — ID поза реєстром assets: occultism:craft, occultism:crystalline_infusion

## remove без збігів — 99 (рецепта немає в індексі: мод генерує його кодом, мода немає, або рецепт уже неактивний)

- server_scripts/mods/alltheores/recipes.js:16: `{"id":"alltheores:processing/fluorite/dust/from_ore"}`
- server_scripts/mods/integrateddynamics/squeezer.js:84: `{"output":"minecraft:lapis_lazuli","type":"integrateddynamics:mechanical_squeezer"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:aluminum_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:copper_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:iron_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:zinc_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:silver_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:lead_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:tin_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:nickel_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:uranium_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:gold_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:osmium_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:iridium_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:platinum_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:nether_quartz_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:fluorite_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:peridot_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:ruby_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:sapphire_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:sulfur_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:saltpeter_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:wood_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:silicon_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:steel_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:bronze_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:brass_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:spirited_crystal_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:niotic_crystal_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:blazing_crystal_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:energized_steel_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:certus_quartz_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:fluix_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:soularium_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:conductive_alloy_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:copper_alloy_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:end_steel_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:redstone_alloy_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:vibrant_alloy_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:dark_steel_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:pulsating_alloy_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:energetic_alloy_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:refined_glowstone_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:refined_obsidian_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:constantan_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:cyanite_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:graphite_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:compressed_iron_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:electrum_seeds"}`
- server_scripts/mods/mysticalagriculture/compatibility.js:100: `{"output":"mysticalagriculture:invar_seeds"}`
- server_scripts/mods/mysticalagriculture/recipes.js:5: `{"id":"mysticalagriculture:essence/common/niter"}` — в індексі: культура mysticalagriculture:saltpeter увімкнена (cropInfo.json); не (тег c:dusts/niter порожній)
- server_scripts/mods/oritech/recipes.js:8: `{"id":"minecraft:crafting/core3alt"}`
- server_scripts/mods/oritech/recipes.js:9: `{"id":"minecraft:crafting/core3"}`
- server_scripts/mods/oritech/recipes.js:14: `{"id":"oritech:crafting/extender"}`
- server_scripts/mods/oritech/recipes.js:15: `{"id":"minecraft:crafting/extender"}`
- server_scripts/mods/powah/energizing.js:34: `{"id":"powah:energizing/charged_certus_quartz_crystal"}`
- server_scripts/mods/powah/energizing.js:34: `{"id":"powah:energizing/uraninite_from_uranium_block"}`
- server_scripts/mods/xycraft/recipes.js:5: `"xycraft_machines:compat/mek/processing/aluminum/dust/from_dirty_dust"`
- server_scripts/unification/gears.js:5: `{"id":"modern_industrialization:materials/aluminum/craft/gear"}`
- server_scripts/unification/gears.js:6: `{"id":"modern_industrialization:materials/tin/craft/gear"}`
- server_scripts/unification/gears.js:7: `{"id":"modern_industrialization:materials/steel/craft/gear"}`
- server_scripts/unification/gears.js:8: `{"id":"modern_industrialization:materials/invar/craft/gear"}`
- server_scripts/unification/gears.js:9: `{"id":"modern_industrialization:materials/bronze/craft/gear"}`
- server_scripts/unification/gears.js:10: `{"id":"modern_industrialization:materials/iron/craft/gear"}`
- server_scripts/unification/gears.js:11: `{"id":"modern_industrialization:materials/copper/craft/gear"}`
- server_scripts/unification/gears.js:12: `{"id":"modern_industrialization:materials/gold/craft/gear"}`
- server_scripts/unification/gears.js:25: `{"id":"industrialforegoing:iron_gear"}`
- server_scripts/unification/gears.js:26: `{"id":"industrialforegoing:gold_gear"}`
- server_scripts/unification/gears.js:27: `{"id":"industrialforegoing:diamond_gear"}`
- server_scripts/unification/gears.js:31: `{"id":"pneumaticcraft:compressed_iron_gear"}`
- server_scripts/unification/ingots.js:9: `{"id":"silentgear:bronze_ingot"}`
- server_scripts/unification/ingots.js:10: `{"id":"mysticalagriculture:essence/extremereactors2/yellorium_ingot"}` — в індексі: мод bigreactors відсутній; культура mysticalagriculture:yellorium вимкнена (cropInfo.json)
- server_scripts/unification/ingots.js:11: `{"id":"modern_industrialization:materials/bronze_dust"}`
- server_scripts/unification/ingots.js:14: `{"id":"deeperdarker:coal_from_smelting_gloomslate_coal_ore"}`
- server_scripts/unification/ingots.js:15: `{"id":"deeperdarker:coal_from_blasting_gloomslate_coal_ore"}`
- server_scripts/unification/ingots.js:16: `{"id":"deeperdarker:iron_ingot_from_smelting_gloomslate_iron_ore"}`
- server_scripts/unification/ingots.js:17: `{"id":"deeperdarker:iron_ingot_from_blasting_gloomslate_iron_ore"}`
- server_scripts/unification/ingots.js:18: `{"id":"deeperdarker:copper_ingot_from_smelting_gloomslate_copper_ore"}`
- server_scripts/unification/ingots.js:19: `{"id":"deeperdarker:copper_ingot_from_blasting_gloomslate_copper_ore"}`
- server_scripts/unification/ingots.js:20: `{"id":"deeperdarker:gold_ingot_from_smelting_gloomslate_gold_ore"}`
- server_scripts/unification/ingots.js:21: `{"id":"deeperdarker:gold_ingot_from_blasting_gloomslate_gold_ore"}`
- server_scripts/unification/ingots.js:22: `{"id":"deeperdarker:redstone_from_smelting_gloomslate_redstone_ore"}`
- server_scripts/unification/ingots.js:23: `{"id":"deeperdarker:redstone_from_blasting_gloomslate_redstone_ore"}`
- server_scripts/unification/ingots.js:24: `{"id":"deeperdarker:emerald_from_smelting_gloomslate_emerald_ore"}`
- server_scripts/unification/ingots.js:25: `{"id":"deeperdarker:emerald_from_blasting_gloomslate_emerald_ore"}`
- server_scripts/unification/ingots.js:26: `{"id":"deeperdarker:lapis_lazuli_from_smelting_gloomslate_lapis_ore"}`
- server_scripts/unification/ingots.js:27: `{"id":"deeperdarker:lapis_lazuli_from_blasting_gloomslate_lapis_ore"}`
- server_scripts/unification/ingots.js:28: `{"id":"deeperdarker:diamond_from_smelting_gloomslate_diamond_ore"}`
- server_scripts/unification/ingots.js:29: `{"id":"deeperdarker:diamond_from_blasting_gloomslate_diamond_ore"}`
- server_scripts/unification/ingots.js:30: `{"id":"mekanism:processing/lead/ingot/from_ore_smelting"}`
- server_scripts/unification/ingots.js:31: `{"id":"mekanism:processing/lead/ingot/from_ore_blasting"}`
- server_scripts/unification/ingots.js:32: `{"id":"mekanism:processing/osmium/ingot/from_ore_smelting"}`
- server_scripts/unification/ingots.js:33: `{"id":"mekanism:processing/osmium/ingot/from_ore_blasting"}`
- server_scripts/unification/ingots.js:34: `{"id":"mekanism:processing/tin/ingot/from_ore_smelting"}`
- server_scripts/unification/ingots.js:35: `{"id":"mekanism:processing/tin/ingot/from_ore_blasting"}`
- server_scripts/unification/ingots.js:36: `{"id":"immersiveengineering:smelting/ingot_uranium"}`
- server_scripts/unification/ingots.js:37: `{"id":"bigreactors:blasting/yellorium_from_ore"}`
- server_scripts/unification/tools.js:132: `{"id":"the_bumblezone:honey_crystal_shield"}`
- server_scripts/unification/tools.js:133: `{"id":"twilightforest:equipment/knightmetal_shield"}`

## Platform.isLoaded = false — код під цими умовами неактивний (131 місць у 96 файлах)

- server_scripts/modpack/atm_alloys.js: 53:ars_nouveau, 133:ars_nouveau, 171:industrialforegoing
- server_scripts/modpack/atm_star.js: 5:create
- server_scripts/modpack/atm_star_creative.js: 5:megacells, 26:ars_nouveau, 38:ars_nouveau, 127:mekanism, 160:mekanism, 242:pneumaticcraft, 284:create
- server_scripts/modpack/att_items.js: 11:cataclysm, 37:mekanism, 76:industrialforegoing, 104:bigreactors, 130:mekanism, 153:stevescarts, 174:pneumaticcraft
- server_scripts/modpack/runic_multis/controllers.js: 1:modern_industrialization
- server_scripts/modpack/runic_multis/recipes/auto_forge.js: 1:modern_industrialization
- server_scripts/modpack/runic_multis/recipes/runic_crucible.js: 1:modern_industrialization
- server_scripts/modpack/runic_multis/recipes/runic_enchanter.js: 1:modern_industrialization
- server_scripts/modpack/runic_multis/recipes/star_altar.js: 1:modern_industrialization
- server_scripts/mods/actuallyadditions/crusher.js: 3:actuallyadditions
- server_scripts/mods/actuallyadditions/fluid_fues.js: 3:actuallyadditions
- server_scripts/mods/actuallyadditions/recipes.js: 1:actuallyadditions
- server_scripts/mods/additional_lights/recipes.js: 2:additional_lights
- server_scripts/mods/ae2/meteoric_infusion.js: 24:appflux
- server_scripts/mods/ae2/recipes.js: 16:megacells, 93:megacells, 120:megacells, 128:appflux
- server_scripts/mods/alltheores/recipes.js: 54:almostunified
- server_scripts/mods/bibliocraft/recipes.js: 3:bibliocraft
- server_scripts/mods/bigreactors/recipes.js: 3:bigreactors
- server_scripts/mods/draconicevolution/recipes.js: 3:draconicevolution
- server_scripts/mods/dyenamics/recipes.js: 32:modern_industrialization
- server_scripts/mods/dysoncubeproject/recipes.js: 3:dysoncubeproject
- server_scripts/mods/enderio/sag_milling.js: 29:irons_spellbooks, 33:actuallyadditions, 45:xycraft_world
- server_scripts/mods/entangled/recipes.js: 3:entangled
- server_scripts/mods/eternal_starlight/datapacks.js: 4:eternal_starlight
- server_scripts/mods/eternal_starlight/recipes.js: 4:eternal_starlight
- server_scripts/mods/extendedae/infinity_cell_recipes.js: 18:megacells
- server_scripts/mods/handcrafted/recipes.js: 3:handcrafted
- server_scripts/mods/hostilenetworks/recipes.js: 12:endermanoverhaul
- server_scripts/mods/hyperbox/hyperbox.js: 1:hyperbox
- server_scripts/mods/hyperbox/recipes.js: 4:hyperbox
- server_scripts/mods/immersiveengineering/compatibility.js: 3:immersiveengineering
- server_scripts/mods/immersiveengineering/crusher.js: 3:immersiveengineering
- server_scripts/mods/industrialforegoing/dissolution_chamber.js: 3:industrialforegoing
- server_scripts/mods/industrialforegoing/laser_drill.js: 3:industrialforegoing
- server_scripts/mods/industrialforegoingsouls/recipes.js: 3:industrialforegoingsouls
- server_scripts/mods/integrateddynamics/basin.js: 44:xycraft_machines
- server_scripts/mods/integrateddynamics/squeezer.js: 51:actuallyadditions, 86:xycraft_world
- server_scripts/mods/irons_spellbooks/recipes.js: 3:irons_spellbooks
- server_scripts/mods/megacells/recipes.js: 3:megacells
- server_scripts/mods/mekanism/compatibility.js: 10:mekanism
- server_scripts/mods/mekanism/ore_processing.js: 4:mekanism
- server_scripts/mods/mekanism/rebalance/gear.js: 3:mekanism
- server_scripts/mods/mekanism/rebalance/items.js: 3:mekanism
- server_scripts/mods/mekanism/rebalance/units.js: 3:mekanism
- server_scripts/mods/mekanism/recipes.js: 3:mekanism
- server_scripts/mods/mekmm/recipes.js: 3:mekmm
- server_scripts/mods/mifa/recipes.js: 3:mifa
- server_scripts/mods/minecolonies/recipes.js: 2:minecolonies
- server_scripts/mods/minecolonies/tags.js: 222:minecolonies
- server_scripts/mods/minecraft/recipes.js: 58:ars_nouveau
- server_scripts/mods/modern_industrialization/ae_compat.js: 3:modern_industrialization
- server_scripts/mods/modern_industrialization/aluminum.js: 3:modern_industrialization
- server_scripts/mods/modern_industrialization/cobble_gen.js: 3:modern_industrialization
- server_scripts/mods/modern_industrialization/distillation.js: 3:modern_industrialization
- server_scripts/mods/modern_industrialization/electric_blast_furnace.js: 3:modern_industrialization
- server_scripts/mods/modern_industrialization/quarry.js: 3:modern_industrialization
- server_scripts/mods/modern_industrialization/replicator.js: 3:modern_industrialization
- server_scripts/mods/modern_industrialization/vacuum_freezer.js: 4:modern_industrialization
- server_scripts/mods/modularbees/recipes.js: 3:modularbees
- server_scripts/mods/mysticalagriculture/crops.js: 59:immersiveengineering
- server_scripts/mods/mysticalagriculture/fusion_crafting.js: 15:xycraft_world, 25:megacells, 29:actuallyadditions
- server_scripts/mods/mysticalagriculture/recipes.js: 7:industrialforegoing, 229:xycraft_world
- server_scripts/mods/pamhc2foodcore/salt.js: 6:pamhc2foodcore
- server_scripts/mods/pneumaticcraft/recipes.js: 1:pneumaticcraft
- server_scripts/mods/powah/energizing.js: 83:appflux
- server_scripts/mods/reliquary/recipes.js: 5:naturesaura
- server_scripts/mods/rftoolsbase/recipes.js: 3:rftoolsbase
- server_scripts/mods/silentgear/recipes.js: 66:pneumaticcraft, 109:everythingcopper, 200:aether, 248:mekanismtools
- server_scripts/mods/supplementaries/recipes.js: 3:supplementaries
- server_scripts/mods/the_bumblezone/recipes.js: 3:the_bumblezone
- server_scripts/mods/the_bumblezone/tags.js: 4:the_bumblezone
- server_scripts/mods/theurgy/incubation.js: 34:irons_spellbooks
- server_scripts/mods/tiab/recipes.js: 3:tiab
- server_scripts/mods/xycraft/extractor.js: 3:xycraft_machines
- server_scripts/mods/xycraft/tags.js: 4:xycraft_world
- server_scripts/tweaks/clearing_recipes.js: 32:draconicevolution
- server_scripts/tweaks/recipes.js: 23:mekanismtools, 84:sushigocrafting
- server_scripts/tweaks/tags.js: 289:eternal_starlight
- server_scripts/unification/coke.js: 5:immersiveengineering
- server_scripts/unification/creosote.js: 5:modern_industrialization, 91:immersiveengineering, 121:modern_industrialization
- server_scripts/unification/crops.js: 673:merrymaking, 761:herbsandharvest
- server_scripts/unification/gears.js: 28:almostunified, 33:pneumaticcraft
- server_scripts/unification/sawing.js: 42:deeperdarker
- server_scripts/unification/tools.js: 8:mekanismtools, 120:mekanismtools, 136:the_bumblezone, 145:twilightforest
- startup_scripts/custom_additions.js: 51:eternal_starlight, 124:dysoncubeproject
- startup_scripts/extendedae/infinity_cells.js: 124:xycraft_world
- startup_scripts/immersiveengineering/chemthrower.js: 1:immersiveengineering
- startup_scripts/incompatible_versions.js: 3:kubejstweaks
- startup_scripts/mekanism/compatibility.js: 17:mekanism
- startup_scripts/modern_industrialization/atm_stuff.js: 3:modern_industrialization
- startup_scripts/modern_industrialization/multiblocks/auto_forge.js: 2:modern_industrialization
- startup_scripts/modern_industrialization/multiblocks/casing.js: 1:modern_industrialization
- startup_scripts/modern_industrialization/multiblocks/runic_crucible.js: 1:modern_industrialization
- startup_scripts/modern_industrialization/multiblocks/runic_enchanter.js: 1:modern_industrialization
- startup_scripts/modern_industrialization/multiblocks/runic_star_altar.js: 1:modern_industrialization
- startup_scripts/theurgy/sulfur_additions.js: 59:irons_spellbooks

## Події гри (поведінка під час гри; не рецепти — лише перелік) — 16

- NativeEvents.onEvent startup_scripts/aliases.js:4 net.neoforged.neoforge.registries.RegisterEvent
- ItemEvents.modification startup_scripts/farmersdelight/compatibility.js:15 
- StartupEvents.postInit startup_scripts/update_checker.js:5 
- NativeEvents.onEvent server_scripts/banlist_script.js:41 
- ServerEvents.loaded server_scripts/announcements/announcements.js:17 
- PlayerEvents.loggedIn server_scripts/announcements/announcements.js:35 
- ServerEvents.basicPublicCommand server_scripts/announcements/announcements.js:71 dismiss_announcements
- PlayerEvents.chat server_scripts/atm11_companion.js:210 
- ServerEvents.basicPublicCommand server_scripts/atm11_companion.js:226 ai
- EntityEvents.death server_scripts/atm11_companion.js:236 
- EntityEvents.afterHurt server_scripts/atm11_companion.js:270 
- PlayerEvents.advancement server_scripts/atm11_companion.js:301 
- PlayerEvents.tick server_scripts/atm11_companion.js:317 
- ServerEvents.registry server_scripts/custom_additions.js:1 forbidden_arcanus:molten_material_type
- PlayerEvents.tick server_scripts/fluid_bug.js:3 
- PlayerEvents.loggedIn server_scripts/tweaks/fix_death_bug.js:1 

## Нерозв'язане (Java API / дані гри — пісочниця не відтворює; що від них залежить, в індексі немає) — 4 файлів

- server_scripts/dynamic_data/read_dynamic_data.js: JsonIO…
- server_scripts/mods/mysticalagriculture/crops.js: Java…
- server_scripts/unification/sawing.js: Java…, recipes…
- server_scripts/unification/tools.js: JsonIO…

  (dynamic_data/read_dynamic_data.js — Gson API; ці файли розбирає extract_recipes.py так само, як скрипт: перша тека = мод, лише якщо мод є)

## Помилки виконання — 1

- server_scripts/dynamic_data/read_dynamic_data.js:26: TypeError: toAdd.add(com.google.gson.JsonElement) is not a function

## Теги (ServerEvents.tags): операцій 981; реєстр KubeJS (startup): 101; generateData: 1056

