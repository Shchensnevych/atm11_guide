# Кросмодові рецепти — кандидати в синергії (tools/crossmod.py)

Активні рецепти збірки (jar + дані + KubeJS, після вимкненого KubeJS), у яких беруть участь предмети або машина ≥2 модів. Спільні теги (c:…, minecraft:…) не рахуються — лише предмети й теги конкретних модів.
Як користуватися: для мода знайти партнера → відкрити рецепт (`jarq.py recipes <ns> <шлях>` або raw/recipes_index.json) → якщо поєднання справді корисне гравцю — synergy з `ref: ["recipe:<id>"]`. Уніфікація руд / пилу (переробка «чужої» руди в машині) — зазвичай не синергія.

Пар модів: 222, модів: 95.

## advanced_ae — Advanced AE (3 партнерів)

- **ae2** (52): `recipe:advanced_ae:advanced_io_bus` [crafting_shaped] advanced_ae:import_export_bus_part, advanced_ae:quantum_processor, advanced_ae:stock_export_bus_part … → advanced_ae:advanced_io_bus_part · `recipe:advanced_ae:advpartenc` [crafting_shaped] ae2:charged_certus_quartz_crystal, ae2:engineering_processor, minecraft:redstone → advanced_ae:adv_pattern_encoder
- **extendedae** (10): `recipe:advanced_ae:eaeadvpatpro` [crafting_shaped] ae2:logic_processor, extendedae:ex_pattern_provider, minecraft:ender_pearl … → advanced_ae:adv_pattern_provider · `recipe:advanced_ae:eaelargeappupgrade` [crystal_assembler] #ae2:glass_cable, #c:ingots, ae2:capacity_card … → advanced_ae:adv_pattern_provider_capacity_upgrade
- **ae2wtlib** (5): `recipe:advanced_ae:wt_combine_access` [combine] advanced_ae:wireless_quantum_crafter_terminal, ae2wtlib:wireless_pattern_access_terminal →  · `recipe:advanced_ae:wt_combine_crafting` [combine] advanced_ae:wireless_quantum_crafter_terminal, ae2:wireless_crafting_terminal → 

## ae2 — Applied Energistics 2 (21 партнерів)

- **extendedae** (70): `recipe:advanced_ae:eaeadvpatpro` [crafting_shaped] ae2:logic_processor, extendedae:ex_pattern_provider, minecraft:ender_pearl … → advanced_ae:adv_pattern_provider · `recipe:advanced_ae:eaelargeappupgrade` [crystal_assembler] #ae2:glass_cable, #c:ingots, ae2:capacity_card … → advanced_ae:adv_pattern_provider_capacity_upgrade
- **advanced_ae** (52): `recipe:advanced_ae:advanced_io_bus` [crafting_shaped] advanced_ae:import_export_bus_part, advanced_ae:quantum_processor, advanced_ae:stock_export_bus_part … → advanced_ae:advanced_io_bus_part · `recipe:advanced_ae:advpartenc` [crafting_shaped] ae2:charged_certus_quartz_crystal, ae2:engineering_processor, minecraft:redstone → advanced_ae:adv_pattern_encoder
- **appliedthaumaturge** (49): `recipe:appliedthaumaturge:arcane_workbench/arcane_inscriber` [arcane_workbench_shapeless] ae2:engineering_processor, ae2:pattern_encoding_terminal, appliedthaumaturge:arcane_inscriber … → appliedthaumaturge:arcane_inscriber · `recipe:appliedthaumaturge:arcane_workbench/arcane_terminal` [arcane_workbench_shapeless] ae2:calculation_processor, ae2:terminal, appliedthaumaturge:arcane_terminal … → appliedthaumaturge:arcane_terminal
- **thaumaturge** (23): `recipe:appliedthaumaturge:arcane_workbench/arcane_inscriber` [arcane_workbench_shapeless] ae2:engineering_processor, ae2:pattern_encoding_terminal, appliedthaumaturge:arcane_inscriber … → appliedthaumaturge:arcane_inscriber · `recipe:appliedthaumaturge:arcane_workbench/arcane_terminal` [arcane_workbench_shapeless] ae2:calculation_processor, ae2:terminal, appliedthaumaturge:arcane_terminal … → appliedthaumaturge:arcane_terminal
- **ae2wtlib** (13): `recipe:advanced_ae:wt_combine_crafting` [combine] advanced_ae:wireless_quantum_crafter_terminal, ae2:wireless_crafting_terminal →  · `recipe:extendedae:u_terminal/xc` [combine] ae2:wireless_crafting_terminal, extendedae:wireless_ex_pat → 
- **mysticalagriculture** (8): `recipe:mysticalagriculture:essence/appliedenergistics2/calculation_press` [crafting_shaped] ae2:certus_quartz_crystal, mysticalagriculture:certus_quartz_essence → ae2:calculation_processor_press · `recipe:mysticalagriculture:essence/appliedenergistics2/certus_quartz` [crafting_shaped] mysticalagriculture:certus_quartz_essence → ae2:certus_quartz_crystal
- **oritech** (8): `recipe:oritech:compat/ae2/charger/fluxite` [charger] #c:gems/amethyst → oritech:fluxite · `recipe:oritech:compat/ae2/fragment_forge/certus_dust` [fragment_forge] #c:gems/certus_quartz → ae2:certus_quartz_dust
- **allthecompressed** (6): `recipe:allthecompressed:compress/certus_quartz_block_1x` [crafting_shaped] ae2:quartz_block → allthecompressed:certus_quartz_block_1x · `recipe:allthecompressed:compress/fluix_block_1x` [crafting_shaped] ae2:fluix_block → allthecompressed:fluix_block_1x
- **powah** (6): `recipe:kubejs:energizing/1x_charged_certus_quartz_crystal` [energizing] #c:gems/certus_quartz → ae2:charged_certus_quartz_crystal · `recipe:kubejs:energizing/2x_charged_certus_quartz_crystal` [energizing] #c:gems/certus_quartz → ae2:charged_certus_quartz_crystal
- **merequester** (4): `recipe:merequester:requester` [crafting_shaped] #ae2:interface, #c:ingots/copper, #c:ingots/iron … → merequester:requester · `recipe:merequester:requester_terminal` [crafting_shapeless] #ae2:illuminated_panel, ae2:logic_processor, merequester:requester → merequester:requester_terminal
- **enderio** (4): `recipe:kjs:mods/enderio/sag_milling.js#L6` [sag_milling] #ae2:all_certus_quartz → ae2:certus_quartz_dust · `recipe:kjs:mods/enderio/sag_milling.js#L6.2` [sag_milling] ae2:fluix_crystal → ae2:fluix_dust
- **ae2importexportcard** (3): `recipe:ae2importexportcard:block_picker_card` [crafting_shaped] ae2:advanced_card, ae2:calculation_processor, ae2:engineering_processor … → ae2importexportcard:block_picker_card · `recipe:ae2importexportcard:export_card` [crafting_shaped] ae2:advanced_card, ae2:calculation_processor, ae2:engineering_processor … → ae2importexportcard:export_card
- **productivebees** (2): `recipe:productivebees:centrifuge/ae2/honeycomb_fluix` [centrifuge] productivebees:configurable_honeycomb → ae2:fluix_crystal, ae2:fluix_dust · `recipe:productivebees:centrifuge/ae2/honeycomb_spatial` [centrifuge] productivebees:configurable_honeycomb → ae2:certus_quartz_crystal, ae2:certus_quartz_dust
- **inworldrecipes** (2): `recipe:kjs:mods/geore/crystalline_wand.js#L34.23` [world_recipe] ae2:flawless_budding_quartz → minecraft:air, ae2:flawless_budding_quartz · `recipe:kjs:mods/geore/crystalline_wand.js#L86.23` [world_recipe] ae2:flawless_budding_quartz → minecraft:air, ae2:flawless_budding_quartz
- **ae2netanalyser** (1): `recipe:ae2netanalyser:analyser` [crafting_shaped] #c:ingots/copper, #c:ingots/iron, ae2:logic_processor … → ae2netanalyser:network_analyser
- **cobblegengalore** (1): `recipe:cobblegengalore:blockgen/ae2/skystone` [blockgen] ae2:sky_stone_block, minecraft:lava, minecraft:water → ae2:sky_dust
- **logisticsnetworks** (1): `recipe:logisticsnetworks:network_upgrade_ae2` [crafting_shaped] #ae2:covered_cable, #ae2:covered_dense_cable, #ae2:glass_cable … → logisticsnetworks:network_upgrade
- **neovitae** (1): `recipe:neovitae:meteor/ae2` [meteor] #c:gems/certus_quartz, ae2:fluix_block, ae2:sky_stone_block … → 
- **aeinfinitybooster** (1): `recipe:allthemods:aeinfinitybooster/infinity_card` [crafting_shaped] alltheores:lumium_gear, ae2:wireless_booster, alltheores:enderium_gear … → aeinfinitybooster:infinity_card
- **alltheores** (1): `recipe:allthemods:aeinfinitybooster/infinity_card` [crafting_shaped] alltheores:lumium_gear, ae2:wireless_booster, alltheores:enderium_gear … → aeinfinitybooster:infinity_card
- **occultism** (1): `recipe:allthemods:ae2/charger/meteorite_divination_rod` [charger] occultism:divination_rod → ae2:mysterious_cube, occultism:divination_rod

## ae2importexportcard — AE2 Import Export Card (1 партнерів)

- **ae2** (3): `recipe:ae2importexportcard:block_picker_card` [crafting_shaped] ae2:advanced_card, ae2:calculation_processor, ae2:engineering_processor … → ae2importexportcard:block_picker_card · `recipe:ae2importexportcard:export_card` [crafting_shaped] ae2:advanced_card, ae2:calculation_processor, ae2:engineering_processor … → ae2importexportcard:export_card

## ae2netanalyser — AE2NetworkAnalyzer (1 партнерів)

- **ae2** (1): `recipe:ae2netanalyser:analyser` [crafting_shaped] #c:ingots/copper, #c:ingots/iron, ae2:logic_processor … → ae2netanalyser:network_analyser

## ae2wtlib — AE2WTLib (5 партнерів)

- **ae2** (13): `recipe:advanced_ae:wt_combine_crafting` [combine] advanced_ae:wireless_quantum_crafter_terminal, ae2:wireless_crafting_terminal →  · `recipe:extendedae:u_terminal/xc` [combine] ae2:wireless_crafting_terminal, extendedae:wireless_ex_pat → 
- **appliedthaumaturge** (9): `recipe:appliedthaumaturge:wireless_universal_terminal/combine_appliedthaumaturge_arcane_appliedthaumaturge_essentia` [combine] appliedthaumaturge:wireless_arcane_terminal, appliedthaumaturge:wireless_essentia_terminal →  · `recipe:appliedthaumaturge:wireless_universal_terminal/combine_appliedthaumaturge_arcane_crafting` [combine] ae2:wireless_crafting_terminal, appliedthaumaturge:wireless_arcane_terminal → 
- **advanced_ae** (5): `recipe:advanced_ae:wt_combine_access` [combine] advanced_ae:wireless_quantum_crafter_terminal, ae2wtlib:wireless_pattern_access_terminal →  · `recipe:advanced_ae:wt_combine_crafting` [combine] advanced_ae:wireless_quantum_crafter_terminal, ae2:wireless_crafting_terminal → 
- **extendedae** (4): `recipe:extendedae:u_terminal/upgrade` [upgrade] extendedae:wireless_ex_pat →  · `recipe:extendedae:u_terminal/xa` [combine] ae2wtlib:wireless_pattern_access_terminal, extendedae:wireless_ex_pat → 
- **merequester** (4): `recipe:merequester:wireless/combine_access` [combine] ae2wtlib:wireless_pattern_access_terminal, merequester:wireless_requester_terminal →  · `recipe:merequester:wireless/combine_crafting` [combine] ae2:wireless_crafting_terminal, merequester:wireless_requester_terminal → 

## aeinfinitybooster — AEInfinityBooster (2 партнерів)

- **ae2** (1): `recipe:allthemods:aeinfinitybooster/infinity_card` [crafting_shaped] alltheores:lumium_gear, ae2:wireless_booster, alltheores:enderium_gear … → aeinfinitybooster:infinity_card
- **alltheores** (1): `recipe:allthemods:aeinfinitybooster/infinity_card` [crafting_shaped] alltheores:lumium_gear, ae2:wireless_booster, alltheores:enderium_gear … → aeinfinitybooster:infinity_card

## aether_ii — The Aether II (1 партнерів)

- **agritechevolved** (31): `recipe:agritechevolved:planter/crop/aether_ii/aechor_cutting` [crop] #agritechevolved:dirt_soils, #agritechevolved:farmland_soils, aether_ii:aechor_cutting → aether_ii:aechor_cutting · `recipe:agritechevolved:planter/crop/aether_ii/aether_fern` [crop] #agritechevolved:farmland_soils, aether_ii:aether_fern → aether_ii:aether_fern

## agritechevolved — Agritech: Evolved (13 партнерів)

- **productivetrees** (163): `recipe:productivetrees:agritech_evolved/alder` [tree] #agritechevolved:tree_soils, productivetrees:alder_sapling → minecraft:stick, productivetrees:alder_log · `recipe:productivetrees:agritech_evolved/allspice` [tree] #agritechevolved:tree_soils, productivetrees:allspice_sapling → minecraft:stick, productivetrees:allspice
- **productivefarming** (159): `recipe:productivefarming:agritech_evolved/agave` [crop] #agritechevolved:farmland_soils, productivefarming:agave → productivefarming:agave · `recipe:productivefarming:agritech_evolved/akebia` [crop] #agritechevolved:farmland_soils, productivefarming:akebia → productivefarming:akebia
- **mysticalagriculture** (142): `recipe:agritechevolved:planter/crop/mysticalagriculture/air_seeds` [crop] #agritechevolved:ma_tier1_soils, mysticalagriculture:air_seeds → mysticalagriculture:air_essence, mysticalagriculture:air_seeds · `recipe:agritechevolved:planter/crop/mysticalagriculture/aluminum_seeds` [crop] #agritechevolved:ma_tier2_soils, mysticalagriculture:aluminum_seeds → mysticalagriculture:aluminum_essence, mysticalagriculture:aluminum_seeds
- **croptopia** (85): `recipe:agritechevolved:planter/crop/croptopia/artichoke_seed` [crop] #agritechevolved:farmland_soils, croptopia:artichoke_seed → croptopia:artichoke, croptopia:artichoke_seed · `recipe:agritechevolved:planter/crop/croptopia/asparagus_seed` [crop] #agritechevolved:farmland_soils, croptopia:asparagus_seed → croptopia:asparagus, croptopia:asparagus_seed
- **regions_unexplored** (78): `recipe:agritechevolved:planter/crop/regions_unexplored/alpha_dandelion` [crop] #agritechevolved:tree_soils, regions_unexplored:alpha_dandelion → regions_unexplored:alpha_dandelion · `recipe:agritechevolved:planter/crop/regions_unexplored/alpha_rose` [crop] #agritechevolved:tree_soils, regions_unexplored:alpha_rose → regions_unexplored:alpha_rose
- **aether_ii** (31): `recipe:agritechevolved:planter/crop/aether_ii/aechor_cutting` [crop] #agritechevolved:dirt_soils, #agritechevolved:farmland_soils, aether_ii:aechor_cutting → aether_ii:aechor_cutting · `recipe:agritechevolved:planter/crop/aether_ii/aether_fern` [crop] #agritechevolved:farmland_soils, aether_ii:aether_fern → aether_ii:aether_fern
- **silentgems** (21): `recipe:agritechevolved:planter/crop/silentgems/alexandrite_glowrose` [crop] #agritechevolved:tree_soils, silentgems:alexandrite_glowrose → silentgems:alexandrite_glowrose · `recipe:agritechevolved:planter/crop/silentgems/ammolite_glowrose` [crop] #agritechevolved:tree_soils, silentgems:ammolite_glowrose → silentgems:ammolite_glowrose
- **mysticalagradditions** (6): `recipe:agritechevolved:planter/crop/mysticalagriculture/awakened_draconium_seeds` [crop] mysticalagradditions:awakened_draconium_crux, mysticalagriculture:awakened_draconium_seeds → mysticalagriculture:awakened_draconium_essence, mysticalagriculture:fertilized_essence · `recipe:agritechevolved:planter/crop/mysticalagriculture/dragon_egg_seeds` [crop] mysticalagradditions:dragon_egg_crux, mysticalagriculture:dragon_egg_seeds → mysticalagriculture:dragon_egg_essence, mysticalagriculture:fertilized_essence
- **forbidden_arcanus** (3): `recipe:agritechevolved:planter/crop/forbidden_arcanus/yellow_orchid` [crop] #agritechevolved:dirt_soils, #agritechevolved:farmland_soils, forbidden_arcanus:yellow_orchid → forbidden_arcanus:yellow_orchid · `recipe:agritechevolved:planter/tree/forbidden_arcanus/aurum_sapling` [tree] #agritechevolved:tree_soils, forbidden_arcanus:aurum_sapling → forbidden_arcanus:aurum_log, forbidden_arcanus:aurum_sapling
- **silentgear** (3): `recipe:agritechevolved:planter/crop/silentgear/flax_seeds` [crop] #agritechevolved:farmland_soils, silentgear:flax_seeds → silentgear:flax_fiber, silentgear:flax_flowers · `recipe:agritechevolved:planter/crop/silentgear/fluffy_seeds` [crop] #agritechevolved:farmland_soils, silentgear:fluffy_seeds → silentgear:fluffy_puff, silentgear:fluffy_seeds
- **occultism** (2): `recipe:agritechevolved:planter/crop/occultism/datura_seeds` [crop] #agritechevolved:farmland_soils, occultism:datura_seeds → occultism:datura, occultism:datura_seeds · `recipe:agritechevolved:planter/tree/occultism/otherworld_sapling` [tree] #agritechevolved:tree_soils, occultism:otherworld_sapling → minecraft:stick, occultism:otherworld_log
- **evilcraft** (1): `recipe:agritechevolved:planter/tree/evilcraft/undead_sapling` [tree] #agritechevolved:tree_soils, evilcraft:undead_sapling → evilcraft:undead_log, minecraft:dead_bush
- **integrateddynamics** (1): `recipe:agritechevolved:planter/tree/integrateddynamics/menril_sapling` [tree] #agritechevolved:tree_soils, integrateddynamics:menril_sapling → integrateddynamics:crystalized_menril_chunk, integrateddynamics:menril_berries

## allthecompressed — AllTheCompressed (12 партнерів)

- **alltheores** (72): `recipe:allthecompressed:compress/aluminum_block_1x` [crafting_shaped] alltheores:aluminum_block → allthecompressed:aluminum_block_1x · `recipe:allthecompressed:compress/brass_block_1x` [crafting_shaped] alltheores:brass_block → allthecompressed:brass_block_1x
- **powah** (34): `recipe:allthecompressed:compress/blazing_crystal_block_1x` [crafting_shaped] powah:blazing_crystal_block → allthecompressed:blazing_crystal_block_1x · `recipe:allthecompressed:compress/energized_steel_block_1x` [crafting_shaped] powah:energized_steel_block → allthecompressed:energized_steel_block_1x
- **allthemodium** (27): `recipe:allthecompressed:compress/allthemodium_block_1x` [crafting_shaped] allthemodium:allthemodium_block → allthecompressed:allthemodium_block_1x · `recipe:allthecompressed:compress/ancient_log_0_1x` [crafting_shaped] allthemodium:ancient_log_0 → allthecompressed:ancient_log_0_1x
- **mysticalagriculture** (22): `recipe:kjs:mods/mysticalagriculture/compatibility.js#L128` [infusion] mysticalagriculture:prosperity_seed_base, allthecompressed:steel_block_1x, mysticalagriculture:imperium_essence → mysticalagriculture:steel_seeds · `recipe:kjs:mods/mysticalagriculture/compatibility.js#L128.2` [infusion] mysticalagriculture:prosperity_seed_base, allthecompressed:bronze_block_1x, mysticalagriculture:tertium_essence → mysticalagriculture:bronze_seeds
- **enderio** (16): `recipe:allthecompressed:compress/conductive_alloy_block_1x` [crafting_shaped] enderio:conductive_alloy_block → allthecompressed:conductive_alloy_block_1x · `recipe:allthecompressed:compress/dark_steel_block_1x` [crafting_shaped] enderio:dark_steel_block → allthecompressed:dark_steel_block_1x
- **allthetweaks** (7): `recipe:allthecompressed:compress/atm_star_block_1x` [crafting_shaped] allthetweaks:atm_star_block → allthecompressed:atm_star_block_1x · `recipe:allthecompressed:compress/ender_pearl_block_1x` [crafting_shaped] allthetweaks:ender_pearl_block → allthecompressed:ender_pearl_block_1x
- **ae2** (6): `recipe:allthecompressed:compress/certus_quartz_block_1x` [crafting_shaped] ae2:quartz_block → allthecompressed:certus_quartz_block_1x · `recipe:allthecompressed:compress/fluix_block_1x` [crafting_shaped] ae2:fluix_block → allthecompressed:fluix_block_1x
- **extendedae** (4): `recipe:allthecompressed:compress/entro_block_1x` [crafting_shaped] extendedae:entro_block → allthecompressed:entro_block_1x · `recipe:allthecompressed:compress/silicon_block_1x` [crafting_shaped] extendedae:silicon_block → allthecompressed:silicon_block_1x
- **forbidden_arcanus** (2): `recipe:allthecompressed:compress/darkstone_1x` [crafting_shaped] forbidden_arcanus:darkstone → allthecompressed:darkstone_1x · `recipe:allthecompressed:decompress/darkstone_1x` [crafting_shapeless] allthecompressed:darkstone_1x → forbidden_arcanus:darkstone
- **productivebees** (2): `recipe:allthecompressed:compress/wax_block_1x` [crafting_shaped] productivebees:wax_block → allthecompressed:wax_block_1x · `recipe:allthecompressed:decompress/wax_block_1x` [crafting_shapeless] allthecompressed:wax_block_1x → productivebees:wax_block
- **mysticalagradditions** (2): `recipe:kjs:mods/mysticalagriculture/compatibility.js#L128.4` [infusion] mysticalagriculture:prosperity_seed_base, allthecompressed:nitro_crystal_block_1x, mysticalagradditions:insanium_essence → mysticalagriculture:nitro_crystal_seeds · `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **productivetrees** (1): `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil

## allthemodium — AllTheModium (22 партнерів)

- **allthecompressed** (27): `recipe:allthecompressed:compress/allthemodium_block_1x` [crafting_shaped] allthemodium:allthemodium_block → allthecompressed:allthemodium_block_1x · `recipe:allthecompressed:compress/ancient_log_0_1x` [crafting_shaped] allthemodium:ancient_log_0 → allthecompressed:ancient_log_0_1x
- **productivemetalworks** (20): `recipe:productivemetalworks:casting/atm/allthemodium_block` [block_casting]  → allthemodium:allthemodium_block · `recipe:productivemetalworks:casting/atm/allthemodium_gear` [item_casting] productivemetalworks:gear_cast → allthemodium:allthemodium_gear
- **alltheores** (17): `recipe:allthemodium:allthemodium_dust_from_ingot_hammering` [crafting_shapeless] #alltheores:ore_hammers, #c:ingots/allthemodium → allthemodium:allthemodium_dust · `recipe:allthemodium:allthemodium_dust_from_ore_crushing` [crafting_shapeless] #alltheores:ore_hammers, #c:raw_materials/allthemodium → allthemodium:allthemodium_dust
- **enderio** (9): `recipe:kubejs:sag_milling/raw_unobtainium` [sag_milling] #c:raw_materials/unobtainium → allthemodium:unobtainium_dust · `recipe:kubejs:sag_milling/unobtainium_ore` [sag_milling] #c:ores/unobtainium → allthemodium:raw_unobtainium, minecraft:cobblestone
- **mysticalagriculture** (5): `recipe:allthemods:mysticalagriculture/awakening/fertile_lily_pad` [awakening] mysticalagriculture:air_essence, mysticalagriculture:earth_essence, mysticalagriculture:water_essence … → reliquary:fertile_lily_pad · `recipe:kubejs:mysticalagriculture/allthemodium_essence_crafting` [crafting_shaped] mysticalagriculture:allthemodium_essence → allthemodium:allthemodium_nugget
- **powah** (4): `recipe:kubejs:energizing/vibranium_allthemodium_alloy_ingot` [energizing] #c:ingots/allthemodium, allthemodium:piglich_heart, allthecompressed:nitro_crystal_block_1x … → allthemodium:vibranium_allthemodium_alloy_ingot · `recipe:kubejs:energizing/vibranium_allthemodium_block` [energizing] #c:storage_blocks/allthemodium, allthemodium:piglich_heart_block, allthecompressed:nitro_crystal_block_2x … → allthemodium:vibranium_allthemodium_block
- **productivebees** (3): `recipe:productivebees:centrifuge/atm/honeycomb_allthemodium` [centrifuge] productivebees:configurable_honeycomb → allthemodium:allthemodium_nugget, productivebees:wax · `recipe:productivebees:centrifuge/atm/honeycomb_unobtainium` [centrifuge] productivebees:configurable_honeycomb → allthemodium:unobtainium_nugget, productivebees:wax
- **iceandfire** (3): `recipe:iceandfire:dragonforge/allthemodium-unobtainium` [dragonforge] allthemodium:molten_allthemodium_bucket, allthemodium:molten_unobtainium_bucket → allthemodium:unobtainium_allthemodium_block · `recipe:iceandfire:dragonforge/allthemodium-vibranium` [dragonforge] allthemodium:molten_allthemodium_bucket, allthemodium:molten_vibranium_bucket → allthemodium:vibranium_allthemodium_block
- **ironjetpacks** (3): `recipe:allthemods:ironjetpacks_creative_cell` [crafting_shaped] #c:storage_blocks/redstone, allthemodium:unobtainium_block, powah:battery_nitro → ironjetpacks:cell · `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster
- **allthetweaks** (2): `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack · `recipe:kjs:modpack/atm_star_creative.js#L273` [crafting_shaped] allthetweaks:atm_star_shard, allthemodium:unobtainium_gear, railcraft:charge_motor … → railcraft:creative_locomotive
- **mysticalagradditions** (2): `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack · `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **cobblegengalore** (1): `recipe:cobblegengalore:blockgen/atm/ancient_stone` [blockgen] minecraft:blue_ice, minecraft:oxidized_copper → allthemodium:ancient_stone
- **occultism** (1): `recipe:occultism:ritual/misc_miner_ancient_eldritch` [ritual] allthemodium:piglich_heart, allthemodium:unobtainium_pickaxe, occultism:iesnium_pickaxe … → occultism:miner_ancient_eldritch
- **ironfurnaces** (1): `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster
- **railcraft** (1): `recipe:kjs:modpack/atm_star_creative.js#L273` [crafting_shaped] allthetweaks:atm_star_shard, allthemodium:unobtainium_gear, railcraft:charge_motor … → railcraft:creative_locomotive
- **bblcore** (1): `recipe:kjs:mods/bbl_strainers/meshes.js#L8` [shaped_component_copy] minecraft:enchantments, allthemodium:allthemodium_ingot, strainers:netherite_mesh → kubejs:allthemodium_mesh
- **strainers** (1): `recipe:kjs:mods/bbl_strainers/meshes.js#L8` [shaped_component_copy] minecraft:enchantments, allthemodium:allthemodium_ingot, strainers:netherite_mesh → kubejs:allthemodium_mesh
- **reliquary** (1): `recipe:allthemods:mysticalagriculture/awakening/fertile_lily_pad` [awakening] mysticalagriculture:air_essence, mysticalagriculture:earth_essence, mysticalagriculture:water_essence … → reliquary:fertile_lily_pad
- **productivetrees** (1): `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **justdirethings** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry
- **productivelib** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry
- **quarryplus** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry

## alltheores — AllTheOres (16 партнерів)

- **productivemetalworks** (126): `recipe:productivemetalworks:casting/gears/alltheores/aluminum` [item_casting] #c:molten_aluminum, productivemetalworks:gear_cast → alltheores:aluminum_gear · `recipe:productivemetalworks:casting/gears/alltheores/brass` [item_casting] #c:molten_brass, productivemetalworks:gear_cast → alltheores:brass_gear
- **oritech** (90): `recipe:oritech:compat/ato/deepdrill/aluminum` [bedrock_extractor] oritech:aluminum_resource_node → alltheores:raw_aluminum · `recipe:oritech:compat/ato/deepdrill/iridium` [bedrock_extractor] oritech:iridium_resource_node → alltheores:raw_iridium
- **allthecompressed** (72): `recipe:allthecompressed:compress/aluminum_block_1x` [crafting_shaped] alltheores:aluminum_block → allthecompressed:aluminum_block_1x · `recipe:allthecompressed:compress/brass_block_1x` [crafting_shaped] alltheores:brass_block → allthecompressed:brass_block_1x
- **enderio** (60): `recipe:alltheores:alloy_smelting/brass_ingot` [alloy_smelting] #c:ingots/copper, #c:ingots/zinc → alltheores:brass_ingot · `recipe:alltheores:alloy_smelting/bronze_ingot` [alloy_smelting] #c:ingots/copper, #c:ingots/tin → alltheores:bronze_ingot
- **energizedpower** (57): `recipe:alltheores:energized_power/pulverizer/aluminum/ingot` [pulverizer] #c:ingots/aluminum → alltheores:aluminum_dust · `recipe:alltheores:energized_power/pulverizer/aluminum/ore` [pulverizer] #c:ores/aluminum → alltheores:aluminum_dust
- **allthemodium** (17): `recipe:allthemodium:allthemodium_dust_from_ingot_hammering` [crafting_shapeless] #alltheores:ore_hammers, #c:ingots/allthemodium → allthemodium:allthemodium_dust · `recipe:allthemodium:allthemodium_dust_from_ore_crushing` [crafting_shapeless] #alltheores:ore_hammers, #c:raw_materials/allthemodium → allthemodium:allthemodium_dust
- **silentgear** (6): `recipe:alltheores:processing/ore_hammer/azure_electrum_dust_from_ingot` [crafting_shapeless] #c:ingots/azure_electrum, #alltheores:ore_hammers → silentgear:azure_electrum_dust · `recipe:alltheores:processing/ore_hammer/azure_silver_dust_from_ingot` [crafting_shapeless] #c:ingots/azure_silver, #alltheores:ore_hammers → silentgear:azure_silver_dust
- **integrateddynamics** (6): `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.6` [mechanical_squeezer] #c:ores/cinnabar → alltheores:cinnabar · `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.7` [mechanical_squeezer] #c:ores/fluorite → alltheores:fluorite
- **theurgy** (2): `recipe:kjs:mods/theurgy/incubation.js#L17.7` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:salt_sulfur → alltheores:salt_dust · `recipe:kjs:mods/theurgy/incubation.js#L17.8` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:sulfur_sulfur → alltheores:sulfur_dust
- **ae2** (1): `recipe:allthemods:aeinfinitybooster/infinity_card` [crafting_shaped] alltheores:lumium_gear, ae2:wireless_booster, alltheores:enderium_gear … → aeinfinitybooster:infinity_card
- **aeinfinitybooster** (1): `recipe:allthemods:aeinfinitybooster/infinity_card` [crafting_shaped] alltheores:lumium_gear, ae2:wireless_booster, alltheores:enderium_gear … → aeinfinitybooster:infinity_card
- **neovitae** (1): `recipe:alltheores:processing/ore_hammer/hellforged_dust_from_ingot` [crafting_shapeless] #c:ingots/hellforged, #alltheores:ore_hammers → neovitae:hellforged_dust
- **occultism** (1): `recipe:alltheores:processing/ore_hammer/iesnium_dust_from_ingot` [crafting_shapeless] #c:ingots/iesnium, #alltheores:ore_hammers → occultism:iesnium_dust
- **buildinggadgets2** (1): `recipe:kjs:mods/buildinggadgets2/recipes.js#L6` [crafting_shaped] #c:ingots/iron, #c:dusts/redstone, minecraft:lapis_lazuli … → buildinggadgets2:gadget_building
- **explorerscompass** (1): `recipe:kjs:mods/explorerscompass/recipes.js#L6` [crafting_shaped] alltheores:enderium_gear, minecraft:netherite_ingot, minecraft:recovery_compass → explorerscompass:explorerscompass
- **mysticalagriculture** (1): `recipe:mysticalagriculture:infusion/steel_seeds` [infusion] mysticalagriculture:prosperity_seed_base, alltheores:steel_ingot, mysticalagriculture:imperium_essence → mysticalagriculture:steel_seeds

## allthetweaks — AllTheTweaks (10 партнерів)

- **allthecompressed** (7): `recipe:allthecompressed:compress/atm_star_block_1x` [crafting_shaped] allthetweaks:atm_star_block → allthecompressed:atm_star_block_1x · `recipe:allthecompressed:compress/ender_pearl_block_1x` [crafting_shaped] allthetweaks:ender_pearl_block → allthecompressed:ender_pearl_block_1x
- **apothic_enchanting** (3): `recipe:allthemods:allthetweaks/mini_nether` [crafting_shaped] minecraft:obsidian, minecraft:nether_star, apothic_enchanting:sightshelf_t2 … → allthetweaks:mini_nether · `recipe:allthemods:allthetweaks/mini_end` [crafting_shaped] apothic_enchanting:endshelf, minecraft:ender_eye, apothic_enchanting:draconic_endshelf → allthetweaks:mini_end
- **productivebees** (2): `recipe:productivebees:centrifuge/atm/honeycomb_patrick` [centrifuge] productivebees:configurable_honeycomb → allthetweaks:patrick_star, productivebees:wax · `recipe:productivebees:centrifuge/atm/honeycomb_starry` [centrifuge] productivebees:configurable_honeycomb → allthetweaks:atm_star_shard, mysticalagradditions:nether_star_shard
- **mysticalagradditions** (2): `recipe:productivebees:centrifuge/atm/honeycomb_starry` [centrifuge] productivebees:configurable_honeycomb → allthetweaks:atm_star_shard, mysticalagradditions:nether_star_shard · `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack
- **powah** (2): `recipe:allthemods:energizing/integrateddynamics_energy_battery_creative` [energizing] integrateddynamics:energy_battery, allthetweaks:atm_star → integrateddynamics:energy_battery_creative · `recipe:allthemods:energizing/powah_creative_energy_cell` [energizing] powah:energy_cell_nitro, allthetweaks:atm_star → powah:energy_cell_creative
- **allthemodium** (2): `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack · `recipe:kjs:modpack/atm_star_creative.js#L273` [crafting_shaped] allthetweaks:atm_star_shard, allthemodium:unobtainium_gear, railcraft:charge_motor … → railcraft:creative_locomotive
- **evilcraft** (1): `recipe:kjs:modpack/atm_star_creative.js#L66` [crafting_shaped] allthetweaks:atm_star, evilcraft:promise_tier_3, evilcraft:flesh_rejuvenated … → evilcraft:creative_blood_drop
- **integrateddynamics** (1): `recipe:allthemods:energizing/integrateddynamics_energy_battery_creative` [energizing] integrateddynamics:energy_battery, allthetweaks:atm_star → integrateddynamics:energy_battery_creative
- **ironjetpacks** (1): `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack
- **railcraft** (1): `recipe:kjs:modpack/atm_star_creative.js#L273` [crafting_shaped] allthetweaks:atm_star_shard, allthemodium:unobtainium_gear, railcraft:charge_motor … → railcraft:creative_locomotive

## apotheosis — Apotheosis (3 партнерів)

- **apothic_spawners** (26): `recipe:apotheosis:spawner_modifiers/burning` [spawner_modifier] apotheosis:burning_spawner_rune →  · `recipe:apotheosis:spawner_modifiers/echoing` [spawner_modifier] apotheosis:echoing_spawner_rune → 
- **apothic_enchanting** (7): `recipe:apotheosis:god_fused_pearl` [infusion] apotheosis:godforged_pearl → apotheosis:god_fused_pearl · `recipe:apotheosis:infused_spawner_rune` [infusion] apotheosis:spawner_rune → apotheosis:infused_spawner_rune
- **gateways** (3): `recipe:apotheosis:gateways/tiered/ascent` [crafting_shaped] #c:ender_pearls, #c:ingots/gold, apotheosis:gem_dust … → gateways:gate_pearl · `recipe:apotheosis:gateways/tiered/pinnacle` [crafting_shaped] apotheosis:gem_dust, apotheosis:godforged_pearl, apotheosis:sigil_of_malice … → gateways:gate_pearl

## apothic_enchanting — Apothic Enchanting (3 партнерів)

- **apotheosis** (7): `recipe:apotheosis:god_fused_pearl` [infusion] apotheosis:godforged_pearl → apotheosis:god_fused_pearl · `recipe:apotheosis:infused_spawner_rune` [infusion] apotheosis:spawner_rune → apotheosis:infused_spawner_rune
- **allthetweaks** (3): `recipe:allthemods:allthetweaks/mini_nether` [crafting_shaped] minecraft:obsidian, minecraft:nether_star, apothic_enchanting:sightshelf_t2 … → allthetweaks:mini_nether · `recipe:allthemods:allthetweaks/mini_end` [crafting_shaped] apothic_enchanting:endshelf, minecraft:ender_eye, apothic_enchanting:draconic_endshelf → allthetweaks:mini_end
- **gateways** (1): `recipe:apotheosis:gateways/tiered/pinnacle` [crafting_shaped] apotheosis:gem_dust, apotheosis:godforged_pearl, apotheosis:sigil_of_malice … → gateways:gate_pearl

## apothic_spawners — Apothic Spawners (1 партнерів)

- **apotheosis** (26): `recipe:apotheosis:spawner_modifiers/burning` [spawner_modifier] apotheosis:burning_spawner_rune →  · `recipe:apotheosis:spawner_modifiers/echoing` [spawner_modifier] apotheosis:echoing_spawner_rune → 

## appliedthaumaturge — Applied Thaumaturge (3 партнерів)

- **ae2** (49): `recipe:appliedthaumaturge:arcane_workbench/arcane_inscriber` [arcane_workbench_shapeless] ae2:engineering_processor, ae2:pattern_encoding_terminal, appliedthaumaturge:arcane_inscriber … → appliedthaumaturge:arcane_inscriber · `recipe:appliedthaumaturge:arcane_workbench/arcane_terminal` [arcane_workbench_shapeless] ae2:calculation_processor, ae2:terminal, appliedthaumaturge:arcane_terminal … → appliedthaumaturge:arcane_terminal
- **thaumaturge** (25): `recipe:appliedthaumaturge:arcane_workbench/arcane_inscriber` [arcane_workbench_shapeless] ae2:engineering_processor, ae2:pattern_encoding_terminal, appliedthaumaturge:arcane_inscriber … → appliedthaumaturge:arcane_inscriber · `recipe:appliedthaumaturge:arcane_workbench/arcane_terminal` [arcane_workbench_shapeless] ae2:calculation_processor, ae2:terminal, appliedthaumaturge:arcane_terminal … → appliedthaumaturge:arcane_terminal
- **ae2wtlib** (9): `recipe:appliedthaumaturge:wireless_universal_terminal/combine_appliedthaumaturge_arcane_appliedthaumaturge_essentia` [combine] appliedthaumaturge:wireless_arcane_terminal, appliedthaumaturge:wireless_essentia_terminal →  · `recipe:appliedthaumaturge:wireless_universal_terminal/combine_appliedthaumaturge_arcane_crafting` [combine] ae2:wireless_crafting_terminal, appliedthaumaturge:wireless_arcane_terminal → 

## arsmagicalegacy — Ars Magica: Legacy (1 партнерів)

- **integrateddynamics** (10): `recipe:arsmagicalegacy:compat/integrateddynamics/mechanical_squeezer/aum` [mechanical_squeezer] arsmagicalegacy:aum → minecraft:pink_dye · `recipe:arsmagicalegacy:compat/integrateddynamics/mechanical_squeezer/cerublossom` [mechanical_squeezer] arsmagicalegacy:cerublossom → minecraft:blue_dye

## bblcore — BBL Core (2 партнерів)

- **strainers** (74): `recipe:strainers:copper_mesh` [shaped_component_copy] #c:ingots/copper, strainers:flint_mesh → strainers:copper_mesh · `recipe:strainers:diamond_mesh` [shaped_component_copy] #c:gems/diamond, strainers:gold_mesh → strainers:diamond_mesh
- **allthemodium** (1): `recipe:kjs:mods/bbl_strainers/meshes.js#L8` [shaped_component_copy] minecraft:enchantments, allthemodium:allthemodium_ingot, strainers:netherite_mesh → kubejs:allthemodium_mesh

## buildinggadgets2 — Building Gadgets 2 (1 партнерів)

- **alltheores** (1): `recipe:kjs:mods/buildinggadgets2/recipes.js#L6` [crafting_shaped] #c:ingots/iron, #c:dusts/redstone, minecraft:lapis_lazuli … → buildinggadgets2:gadget_building

## cabletiers — Cable Tiers (4 партнерів)

- **refinedstorage** (398): `recipe:cabletiers:elite_autocrafter` [crafting_shaped] minecraft:iron_block, refinedstorage:advanced_processor, refinedstorage:autocrafter → cabletiers:elite_autocrafter · `recipe:cabletiers:elite_constructor` [crafting_shaped] minecraft:iron_block, refinedstorage:advanced_processor, refinedstorage:constructor → cabletiers:elite_constructor
- **energizedpower** (1): `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part
- **occultism** (1): `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part
- **refinedtypes** (1): `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part

## chisel — Chisel (1 партнерів)

- **mysticalagriculture** (2): `recipe:mysticalagriculture:essence/chisel/limestone` [crafting_shaped] mysticalagriculture:limestone_essence → chisel:limestone_raw · `recipe:mysticalagriculture:essence/chisel/marble` [crafting_shaped] mysticalagriculture:marble_essence → chisel:marble_raw

## cobblegengalore — Cobblegen Galore (2 партнерів)

- **ae2** (1): `recipe:cobblegengalore:blockgen/ae2/skystone` [blockgen] ae2:sky_stone_block, minecraft:lava, minecraft:water → ae2:sky_dust
- **allthemodium** (1): `recipe:cobblegengalore:blockgen/atm/ancient_stone` [blockgen] minecraft:blue_ice, minecraft:oxidized_copper → allthemodium:ancient_stone

## constructionstick — Construction Sticks (1 партнерів)

- **occultism** (1): `recipe:allthemods:crystalline_infusion/crystalline_wand` [ritual] constructionstick:iron_stick, kubejs:allthemodium_catalyst, occultism:spirit_attuned_crystal … → kubejs:crystalline_wand

## cookingforblockheads — Cooking for Blockheads (1 партнерів)

- **croptopia** (1): `recipe:cookingforblockheads:croptopia/toast` [toaster] minecraft:bread → croptopia:toast

## croptopia — Croptopia (2 партнерів)

- **agritechevolved** (85): `recipe:agritechevolved:planter/crop/croptopia/artichoke_seed` [crop] #agritechevolved:farmland_soils, croptopia:artichoke_seed → croptopia:artichoke, croptopia:artichoke_seed · `recipe:agritechevolved:planter/crop/croptopia/asparagus_seed` [crop] #agritechevolved:farmland_soils, croptopia:asparagus_seed → croptopia:asparagus, croptopia:asparagus_seed
- **cookingforblockheads** (1): `recipe:cookingforblockheads:croptopia/toast` [toaster] minecraft:bread → croptopia:toast

## cucumber — Cucumber Library (1 партнерів)

- **mysticalagriculture** (108): `recipe:mysticalagriculture:soulium_dagger` [shaped_transfer_damage] minecraft:golden_sword, mysticalagriculture:soulium_dust, mysticalagriculture:soulium_ingot → mysticalagriculture:soulium_dagger · `recipe:mysticalagriculture:essence/common/aluminum_ingot` [shaped_tag] mysticalagriculture:aluminum_essence → #c:ingots/aluminum

## dyenamics — Dyenamics (1 партнерів)

- **occultism** (18): `recipe:allthemods:crafting/otherflower_to_honey_dye` [crafting_shapeless] occultism:otherflower, dyenamics:honey_dye → dyenamics:honey_dye · `recipe:allthemods:crafting/otherflower_to_mint_dye` [crafting_shapeless] occultism:otherflower, dyenamics:mint_dye → dyenamics:mint_dye

## enderio — Ender IO (10 партнерів)

- **alltheores** (60): `recipe:alltheores:alloy_smelting/brass_ingot` [alloy_smelting] #c:ingots/copper, #c:ingots/zinc → alltheores:brass_ingot · `recipe:alltheores:alloy_smelting/bronze_ingot` [alloy_smelting] #c:ingots/copper, #c:ingots/tin → alltheores:bronze_ingot
- **allthecompressed** (16): `recipe:allthecompressed:compress/conductive_alloy_block_1x` [crafting_shaped] enderio:conductive_alloy_block → allthecompressed:conductive_alloy_block_1x · `recipe:allthecompressed:compress/dark_steel_block_1x` [crafting_shaped] enderio:dark_steel_block → allthecompressed:dark_steel_block_1x
- **enderio_endergy** (15): `recipe:enderio_endergy:basic_capacitor` [crafting_shaped] #c:ingots/copper, #c:nuggets/gold, enderio_endergy:grainy_capacitor → enderio:basic_capacitor · `recipe:enderio_endergy:crude_energy_conduit` [crafting_shaped] enderio:conduit_binder, enderio_endergy:crude_steel_ingot → enderio:conduit
- **mysticalagriculture** (10): `recipe:mysticalagriculture:essence/enderio/conductive_alloy_ingot` [crafting_shaped] mysticalagriculture:conductive_alloy_essence → enderio:conductive_alloy_ingot · `recipe:mysticalagriculture:essence/enderio/dark_steel_ingot` [crafting_shaped] mysticalagriculture:dark_steel_essence → enderio:dark_steel_ingot
- **silentgear** (10): `recipe:kubejs:sag_milling/raw_crimson_iron` [sag_milling] #c:raw_materials/crimson_iron → silentgear:crimson_iron_dust · `recipe:kubejs:sag_milling/crimson_iron_ore` [sag_milling] #c:ores/crimson_iron → silentgear:raw_crimson_iron, minecraft:cobblestone
- **allthemodium** (9): `recipe:kubejs:sag_milling/raw_unobtainium` [sag_milling] #c:raw_materials/unobtainium → allthemodium:unobtainium_dust · `recipe:kubejs:sag_milling/unobtainium_ore` [sag_milling] #c:ores/unobtainium → allthemodium:raw_unobtainium, minecraft:cobblestone
- **oritech** (5): `recipe:oritech:compat/enderio/crafting/fluid_pipe` [crafting_shaped] #c:ingots/copper, enderio:conduit_binder → oritech:fluid_pipe · `recipe:oritech:compat/enderio/fragment_forge/dust/lapis` [fragment_forge] #c:gems/lapis → enderio:powdered_lapis_lazuli
- **ae2** (4): `recipe:kjs:mods/enderio/sag_milling.js#L6` [sag_milling] #ae2:all_certus_quartz → ae2:certus_quartz_dust · `recipe:kjs:mods/enderio/sag_milling.js#L6.2` [sag_milling] ae2:fluix_crystal → ae2:fluix_dust
- **powah** (3): `recipe:kjs:mods/enderio/sag_milling.js#L6.5` [sag_milling] #c:ores/uraninite_poor → powah:uraninite_raw · `recipe:kjs:mods/enderio/sag_milling.js#L6.6` [sag_milling] #c:ores/uraninite_regular → powah:uraninite_raw
- **refinedstorage** (1): `recipe:enderio:rs_conduit` [crafting_shaped] #refinedstorage:cables, enderio:conduit_binder → enderio:conduit

## enderio_endergy — Ender IO - Endergy (1 партнерів)

- **enderio** (15): `recipe:enderio_endergy:basic_capacitor` [crafting_shaped] #c:ingots/copper, #c:nuggets/gold, enderio_endergy:grainy_capacitor → enderio:basic_capacitor · `recipe:enderio_endergy:crude_energy_conduit` [crafting_shaped] enderio:conduit_binder, enderio_endergy:crude_steel_ingot → enderio:conduit

## energizedpower — Energized Power (8 партнерів)

- **alltheores** (57): `recipe:alltheores:energized_power/pulverizer/aluminum/ingot` [pulverizer] #c:ingots/aluminum → alltheores:aluminum_dust · `recipe:alltheores:energized_power/pulverizer/aluminum/ore` [pulverizer] #c:ores/aluminum → alltheores:aluminum_dust
- **geore** (30): `recipe:allthemods:energizedpower/crystal_growing/iron_shard` [crystal_growth_chamber] #geore:geore_shards/iron → geore:iron_shard · `recipe:allthemods:energizedpower/crystal_growing/gold_shard` [crystal_growth_chamber] #geore:geore_shards/gold → geore:gold_shard
- **refinedtypes** (28): `recipe:kjs:mods/refined_storage/refined_types.js#L5` [crafting_shaped] refinedstorage:quartz_enriched_copper, energizedpower:advanced_circuit, refinedstorage:quartz_enriched_iron … → refinedtypes:64k_energy_storage_part · `recipe:kjs:mods/refined_storage/refined_types.js#L18` [crafting_shaped] refinedstorage:construction_core, refinedstorage:interface, refinedstorage:advanced_processor … → refinedtypes:network_energizer
- **refinedstorage** (27): `recipe:kjs:mods/refined_storage/refined_types.js#L5` [crafting_shaped] refinedstorage:quartz_enriched_copper, energizedpower:advanced_circuit, refinedstorage:quartz_enriched_iron … → refinedtypes:64k_energy_storage_part · `recipe:kjs:mods/refined_storage/refined_types.js#L18` [crafting_shaped] refinedstorage:construction_core, refinedstorage:interface, refinedstorage:advanced_processor … → refinedtypes:network_energizer
- **occultism** (4): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand · `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part
- **neovitae** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand
- **waystones** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand
- **cabletiers** (1): `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part

## evilcraft — EvilCraft (4 партнерів)

- **integrateddynamics** (14): `recipe:integrateddynamics:drying_basin/convenience/evilcraft_hardened_blood` [drying_basin] evilcraft:blood → evilcraft:hardened_blood · `recipe:integrateddynamics:drying_basin/convenience/evilcraft_red_sand` [drying_basin] evilcraft:blood, minecraft:sand → minecraft:red_sand
- **agritechevolved** (1): `recipe:agritechevolved:planter/tree/evilcraft/undead_sapling` [tree] #agritechevolved:tree_soils, evilcraft:undead_sapling → evilcraft:undead_log, minecraft:dead_bush
- **productivebees** (1): `recipe:productivebees:centrifuge/evilcraft/honeycomb_bloody` [centrifuge] evilcraft:blood, productivebees:configurable_honeycomb → productivebees:wax
- **allthetweaks** (1): `recipe:kjs:modpack/atm_star_creative.js#L66` [crafting_shaped] allthetweaks:atm_star, evilcraft:promise_tier_3, evilcraft:flesh_rejuvenated … → evilcraft:creative_blood_drop

## explorerscompass — Explorer's Compass (1 партнерів)

- **alltheores** (1): `recipe:kjs:mods/explorerscompass/recipes.js#L6` [crafting_shaped] alltheores:enderium_gear, minecraft:netherite_ingot, minecraft:recovery_compass → explorerscompass:explorerscompass

## extendedae — ExtendedAE (6 партнерів)

- **ae2** (70): `recipe:advanced_ae:eaeadvpatpro` [crafting_shaped] ae2:logic_processor, extendedae:ex_pattern_provider, minecraft:ender_pearl … → advanced_ae:adv_pattern_provider · `recipe:advanced_ae:eaelargeappupgrade` [crystal_assembler] #ae2:glass_cable, #c:ingots, ae2:capacity_card … → advanced_ae:adv_pattern_provider_capacity_upgrade
- **advanced_ae** (10): `recipe:advanced_ae:eaeadvpatpro` [crafting_shaped] ae2:logic_processor, extendedae:ex_pattern_provider, minecraft:ender_pearl … → advanced_ae:adv_pattern_provider · `recipe:advanced_ae:eaelargeappupgrade` [crystal_assembler] #ae2:glass_cable, #c:ingots, ae2:capacity_card … → advanced_ae:adv_pattern_provider_capacity_upgrade
- **ae2wtlib** (4): `recipe:extendedae:u_terminal/upgrade` [upgrade] extendedae:wireless_ex_pat →  · `recipe:extendedae:u_terminal/xa` [combine] ae2wtlib:wireless_pattern_access_terminal, extendedae:wireless_ex_pat → 
- **allthecompressed** (4): `recipe:allthecompressed:compress/entro_block_1x` [crafting_shaped] extendedae:entro_block → allthecompressed:entro_block_1x · `recipe:allthecompressed:compress/silicon_block_1x` [crafting_shaped] extendedae:silicon_block → allthecompressed:silicon_block_1x
- **oritech** (2): `recipe:oritech:compat/extendedae/fragment_forge/entro_dust` [fragment_forge] #c:gems/entro → extendedae:entro_dust · `recipe:oritech:compat/extendedae/pulverizer/entro_dust` [pulverizer] #c:gems/entro → extendedae:entro_dust
- **mysticalagriculture** (2): `recipe:kubejs:mysticalagriculture/entro_essence_crafting` [crafting_shaped] mysticalagriculture:entro_essence → extendedae:entro_crystal · `recipe:mysticalagriculture:infusion/entro_seeds` [infusion] mysticalagriculture:prosperity_seed_base, extendedae:entro_crystal, mysticalagriculture:supremium_essence → mysticalagriculture:entro_seeds

## extradisks — Extra Disks (1 партнерів)

- **refinedstorage** (73): `recipe:extradisks:advanced_machine_casing` [crafting_shaped] refinedstorage:advanced_processor, refinedstorage:construction_core, refinedstorage:destruction_core … → extradisks:advanced_machine_casing · `recipe:extradisks:advanced_storage_housing` [crafting_shaped] #c:glass_blocks, refinedstorage:advanced_processor, refinedstorage:improved_processor … → extradisks:advanced_storage_housing

## farmingforblockheads — Farming for Blockheads (1 партнерів)

- **silentgear** (2): `recipe:kjs:mods/silentgear/recipes.js#L5` [market]  → silentgear:fluffy_seeds · `recipe:kjs:mods/silentgear/recipes.js#L15` [market]  → silentgear:flax_seeds

## forbidden_arcanus — Forbidden Arcanus (7 партнерів)

- **occultism** (23): `recipe:occultism:ritual/misc_unbreakable` [ritual] #atm:unbreakable, #c:evokers, #c:ingots/iesnium … → occultism:repair_icon · `recipe:occultism:copper_catalyst` [ritual] geore:copper_shard, occultism:book_of_binding_bound_foliot, occultism:spirit_attuned_crystal … → kubejs:copper_catalyst
- **geore** (22): `recipe:occultism:copper_catalyst` [ritual] geore:copper_shard, occultism:book_of_binding_bound_foliot, occultism:spirit_attuned_crystal … → kubejs:copper_catalyst · `recipe:occultism:iron_catalyst` [ritual] geore:iron_shard, occultism:book_of_binding_bound_foliot, occultism:spirit_attuned_crystal … → kubejs:iron_catalyst
- **theurgy** (5): `recipe:kjs:mods/theurgy/incubation.js#L17` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:arcane_sulfur → forbidden_arcanus:arcane_crystal · `recipe:kjs:mods/theurgy/incubation.js#L17.2` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:runic_sulfur → forbidden_arcanus:rune
- **agritechevolved** (3): `recipe:agritechevolved:planter/crop/forbidden_arcanus/yellow_orchid` [crop] #agritechevolved:dirt_soils, #agritechevolved:farmland_soils, forbidden_arcanus:yellow_orchid → forbidden_arcanus:yellow_orchid · `recipe:agritechevolved:planter/tree/forbidden_arcanus/aurum_sapling` [tree] #agritechevolved:tree_soils, forbidden_arcanus:aurum_sapling → forbidden_arcanus:aurum_log, forbidden_arcanus:aurum_sapling
- **allthecompressed** (2): `recipe:allthecompressed:compress/darkstone_1x` [crafting_shaped] forbidden_arcanus:darkstone → allthecompressed:darkstone_1x · `recipe:allthecompressed:decompress/darkstone_1x` [crafting_shapeless] allthecompressed:darkstone_1x → forbidden_arcanus:darkstone
- **integrateddynamics** (2): `recipe:kjs:mods/integrateddynamics/squeezer.js#L8` [mechanical_squeezer] #c:ores/arcane_crystal → forbidden_arcanus:arcane_crystal · `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.2` [mechanical_squeezer] #c:ores/runic → forbidden_arcanus:rune
- **mysticalagriculture** (1): `recipe:kubejs:mysticalagriculture/darkstone_essence_crafting` [crafting_shaped] mysticalagriculture:darkstone_essence → forbidden_arcanus:darkstone

## functionalstorage — Functional Storage (1 партнерів)

- **utilitarian** (2): `recipe:kjs:mods/functionalstorage/compacting_recipe.js#L4` [custom_compacting] minecraft:charcoal, utilitarian:tiny_charcoal →  · `recipe:kjs:mods/functionalstorage/compacting_recipe.js#L4.2` [custom_compacting] minecraft:coal, utilitarian:tiny_coal → 

## gateways — Gateways To Eternity (2 партнерів)

- **apotheosis** (3): `recipe:apotheosis:gateways/tiered/ascent` [crafting_shaped] #c:ender_pearls, #c:ingots/gold, apotheosis:gem_dust … → gateways:gate_pearl · `recipe:apotheosis:gateways/tiered/pinnacle` [crafting_shaped] apotheosis:gem_dust, apotheosis:godforged_pearl, apotheosis:sigil_of_malice … → gateways:gate_pearl
- **apothic_enchanting** (1): `recipe:apotheosis:gateways/tiered/pinnacle` [crafting_shaped] apotheosis:gem_dust, apotheosis:godforged_pearl, apotheosis:sigil_of_malice … → gateways:gate_pearl

## geore — GeOre (9 партнерів)

- **occultism** (74): `recipe:occultism:crystallize/geore_allthemodium` [crystallize] #geore:storage_blocks/geore_allthemodium → #geore:geore_shards/allthemodium · `recipe:occultism:crystallize/geore_aluminum` [crystallize] #geore:storage_blocks/geore_aluminum → #geore:geore_shards/aluminum
- **inworldrecipes** (44): `recipe:kjs:mods/geore/crystalline_wand.js#L34` [world_recipe] geore:budding_copper → minecraft:air, geore:budding_copper · `recipe:kjs:mods/geore/crystalline_wand.js#L86` [world_recipe] geore:budding_copper → minecraft:air, geore:budding_copper
- **oritech** (32): `recipe:oritech:compat/geore/assembler/budding_allthemodium` [assembler] geore:allthemodium_shard, oritech:enderic_compound, oritech:overcharged_crystal → geore:budding_allthemodium · `recipe:oritech:compat/geore/assembler/budding_aluminum` [assembler] geore:aluminum_shard, oritech:enderic_compound, oritech:overcharged_crystal → geore:budding_aluminum
- **energizedpower** (30): `recipe:allthemods:energizedpower/crystal_growing/iron_shard` [crystal_growth_chamber] #geore:geore_shards/iron → geore:iron_shard · `recipe:allthemods:energizedpower/crystal_growing/gold_shard` [crystal_growth_chamber] #geore:geore_shards/gold → geore:gold_shard
- **neovitae** (23): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand · `recipe:kjs:mods/neovitae/meteor.js#L127` [meteor] kubejs:copper_catalyst, geore:copper_block, minecraft:smooth_basalt … → 
- **forbidden_arcanus** (22): `recipe:occultism:copper_catalyst` [ritual] geore:copper_shard, occultism:book_of_binding_bound_foliot, occultism:spirit_attuned_crystal … → kubejs:copper_catalyst · `recipe:occultism:iron_catalyst` [ritual] geore:iron_shard, occultism:book_of_binding_bound_foliot, occultism:spirit_attuned_crystal … → kubejs:iron_catalyst
- **productivemetalworks** (6): `recipe:productivemetalworks:melting/geore/ruby_block` [item_melting] geore:ruby_block → sgearmetalworks:molten_ruby · `recipe:productivemetalworks:melting/geore/ruby_shard` [item_melting] geore:ruby_shard → sgearmetalworks:molten_ruby
- **sgearmetalworks** (6): `recipe:productivemetalworks:melting/geore/ruby_block` [item_melting] geore:ruby_block → sgearmetalworks:molten_ruby · `recipe:productivemetalworks:melting/geore/ruby_shard` [item_melting] geore:ruby_shard → sgearmetalworks:molten_ruby
- **waystones** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand

## guideme — GuideME (1 партнерів)

- **logisticsnetworks** (1): `recipe:logisticsnetworks:guide` [guide] logisticsnetworks:wrench, minecraft:paper → guideme:guide

## hostilenetworks — Hostile Neural Networks (3 партнерів)

- **mysticalagradditions** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul
- **productivebees** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul
- **reliquary** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul

## iceandfire — Ice And Fire Community Edition (2 партнерів)

- **occultism** (9): `recipe:occultism:ritual/craft_infused_axe` [ritual] occultism:book_of_binding_bound_djinni, iceandfire:silver_axe, occultism:soul_gem … → occultism:infused_axe · `recipe:occultism:ritual/craft_infused_boots` [ritual] occultism:book_of_binding_bound_djinni, iceandfire:armor_silver_metal_boots, occultism:soul_gem … → occultism:infused_boots
- **allthemodium** (3): `recipe:iceandfire:dragonforge/allthemodium-unobtainium` [dragonforge] allthemodium:molten_allthemodium_bucket, allthemodium:molten_unobtainium_bucket → allthemodium:unobtainium_allthemodium_block · `recipe:iceandfire:dragonforge/allthemodium-vibranium` [dragonforge] allthemodium:molten_allthemodium_bucket, allthemodium:molten_vibranium_bucket → allthemodium:vibranium_allthemodium_block

## integratedcrafting — IntegratedCrafting (1 партнерів)

- **integrateddynamics** (4): `recipe:integratedcrafting:crafting/part_crafting_writer` [crafting_shaped] integrateddynamics:variable_transformer_output, minecraft:crafting_table → integratedcrafting:part_crafting_writer · `recipe:integratedcrafting:crafting/part_interface_crafting` [crafting_shaped] #c:ingots/iron, integrateddynamics:crystalized_menril_block, integrateddynamics:variable_transformer_input … → integratedcrafting:part_interface_crafting

## integrateddynamics — IntegratedDynamics (15 партнерів)

- **integratedtunnels** (17): `recipe:integratedtunnels:crafting/part_exporter_energy` [crafting_shapeless] integrateddynamics:variable_transformer_output, integratedtunnels:part_interface_energy → integratedtunnels:part_exporter_energy · `recipe:integratedtunnels:crafting/part_exporter_fluid` [crafting_shapeless] integrateddynamics:variable_transformer_output, integratedtunnels:part_interface_fluid → integratedtunnels:part_exporter_fluid
- **evilcraft** (14): `recipe:integrateddynamics:drying_basin/convenience/evilcraft_hardened_blood` [drying_basin] evilcraft:blood → evilcraft:hardened_blood · `recipe:integrateddynamics:drying_basin/convenience/evilcraft_red_sand` [drying_basin] evilcraft:blood, minecraft:sand → minecraft:red_sand
- **arsmagicalegacy** (10): `recipe:arsmagicalegacy:compat/integrateddynamics/mechanical_squeezer/aum` [mechanical_squeezer] arsmagicalegacy:aum → minecraft:pink_dye · `recipe:arsmagicalegacy:compat/integrateddynamics/mechanical_squeezer/cerublossom` [mechanical_squeezer] arsmagicalegacy:cerublossom → minecraft:blue_dye
- **mysticalagriculture** (7): `recipe:mysticalagriculture:essence/integrateddynamics/menril_berries` [crafting_shaped] mysticalagriculture:menril_essence → integrateddynamics:menril_berries · `recipe:mysticalagriculture:essence/integrateddynamics/menril_log` [crafting_shaped] mysticalagriculture:menril_essence → integrateddynamics:menril_log
- **integratedterminals** (7): `recipe:integratedterminals:crafting/part_terminal_crafting_job` [crafting_shaped] #c:dusts/glowstone, integrateddynamics:part_display_panel, integratedterminals:menril_glass … → integratedterminals:part_terminal_crafting_job · `recipe:integratedterminals:crafting/part_terminal_storage` [crafting_shaped] #c:dusts/glowstone, integrateddynamics:part_display_panel, integrateddynamics:variable_transformer_input … → integratedterminals:part_terminal_storage
- **alltheores** (6): `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.6` [mechanical_squeezer] #c:ores/cinnabar → alltheores:cinnabar · `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.7` [mechanical_squeezer] #c:ores/fluorite → alltheores:fluorite
- **integratedcrafting** (4): `recipe:integratedcrafting:crafting/part_crafting_writer` [crafting_shaped] integrateddynamics:variable_transformer_output, minecraft:crafting_table → integratedcrafting:part_crafting_writer · `recipe:integratedcrafting:crafting/part_interface_crafting` [crafting_shaped] #c:ingots/iron, integrateddynamics:crystalized_menril_block, integrateddynamics:variable_transformer_input … → integratedcrafting:part_interface_crafting
- **powah** (4): `recipe:allthemods:energizing/integrateddynamics_energy_battery_creative` [energizing] integrateddynamics:energy_battery, allthetweaks:atm_star → integrateddynamics:energy_battery_creative · `recipe:kjs:mods/integrateddynamics/squeezer.js#L34` [mechanical_squeezer] #c:ores/uraninite_poor → powah:uraninite_raw
- **productivebees** (2): `recipe:productivebees:centrifuge/integrateddynamics/honeycomb_ender_liquid_chorus` [centrifuge] integrateddynamics:liquid_chorus, productivebees:configurable_honeycomb → minecraft:ender_pearl, productivebees:wax · `recipe:productivebees:centrifuge/integrateddynamics/honeycomb_menril` [centrifuge] integrateddynamics:menril_resin, productivebees:configurable_honeycomb → integrateddynamics:crystalized_menril_chunk, productivebees:wax
- **forbidden_arcanus** (2): `recipe:kjs:mods/integrateddynamics/squeezer.js#L8` [mechanical_squeezer] #c:ores/arcane_crystal → forbidden_arcanus:arcane_crystal · `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.2` [mechanical_squeezer] #c:ores/runic → forbidden_arcanus:rune
- **justdirethings** (2): `recipe:kjs:mods/mysticalagriculture/experience_droplet.js#L8` [squeezer] mysticalagriculture:experience_droplet → justdirethings:xp_fluid_source · `recipe:kjs:mods/mysticalagriculture/experience_droplet.js#L16` [mechanical_squeezer] mysticalagriculture:experience_droplet → justdirethings:xp_fluid_source
- **agritechevolved** (1): `recipe:agritechevolved:planter/tree/integrateddynamics/menril_sapling` [tree] #agritechevolved:tree_soils, integrateddynamics:menril_sapling → integrateddynamics:crystalized_menril_chunk, integrateddynamics:menril_berries
- **allthetweaks** (1): `recipe:allthemods:energizing/integrateddynamics_energy_battery_creative` [energizing] integrateddynamics:energy_battery, allthetweaks:atm_star → integrateddynamics:energy_battery_creative
- **silentgear** (1): `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.5` [mechanical_squeezer] #c:ores/bort → silentgear:bort
- **theurgy** (1): `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.12` [mechanical_squeezer] #c:ores/sal_ammoniac → theurgy:sal_ammoniac_crystal

## integratedterminals — IntegratedTerminals (1 партнерів)

- **integrateddynamics** (7): `recipe:integratedterminals:crafting/part_terminal_crafting_job` [crafting_shaped] #c:dusts/glowstone, integrateddynamics:part_display_panel, integratedterminals:menril_glass … → integratedterminals:part_terminal_crafting_job · `recipe:integratedterminals:crafting/part_terminal_storage` [crafting_shaped] #c:dusts/glowstone, integrateddynamics:part_display_panel, integrateddynamics:variable_transformer_input … → integratedterminals:part_terminal_storage

## integratedtunnels — IntegratedTunnels (1 партнерів)

- **integrateddynamics** (17): `recipe:integratedtunnels:crafting/part_exporter_energy` [crafting_shapeless] integrateddynamics:variable_transformer_output, integratedtunnels:part_interface_energy → integratedtunnels:part_exporter_energy · `recipe:integratedtunnels:crafting/part_exporter_fluid` [crafting_shapeless] integrateddynamics:variable_transformer_output, integratedtunnels:part_interface_fluid → integratedtunnels:part_exporter_fluid

## interdimensionalwirelesstransmitter — Interdimensional Wireless Transmitter (1 партнерів)

- **refinedstorage** (17): `recipe:interdimensionalwirelesstransmitter:interdimensional_wireless_transmitter` [crafting_shaped] minecraft:elytra, minecraft:nether_star, refinedstorage:wireless_transmitter → interdimensionalwirelesstransmitter:interdimensional_wireless_transmitter · `recipe:interdimensionalwirelesstransmitter:coloring/black_interdimensional_wireless_transmitter` [recoloring] #interdimensionalwirelesstransmitter:interdimensional_wireless_transmitters → interdimensionalwirelesstransmitter:black_interdimensional_wireless_transmitter

## inworldrecipes — In World Recipes (2 партнерів)

- **geore** (44): `recipe:kjs:mods/geore/crystalline_wand.js#L34` [world_recipe] geore:budding_copper → minecraft:air, geore:budding_copper · `recipe:kjs:mods/geore/crystalline_wand.js#L86` [world_recipe] geore:budding_copper → minecraft:air, geore:budding_copper
- **ae2** (2): `recipe:kjs:mods/geore/crystalline_wand.js#L34.23` [world_recipe] ae2:flawless_budding_quartz → minecraft:air, ae2:flawless_budding_quartz · `recipe:kjs:mods/geore/crystalline_wand.js#L86.23` [world_recipe] ae2:flawless_budding_quartz → minecraft:air, ae2:flawless_budding_quartz

## ironfurnaces — Iron Furnaces (3 партнерів)

- **allthemodium** (1): `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster
- **ironjetpacks** (1): `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster
- **powah** (1): `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster

## ironjetpacks — Iron Jetpacks (5 партнерів)

- **allthemodium** (3): `recipe:allthemods:ironjetpacks_creative_cell` [crafting_shaped] #c:storage_blocks/redstone, allthemodium:unobtainium_block, powah:battery_nitro → ironjetpacks:cell · `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster
- **powah** (2): `recipe:allthemods:ironjetpacks_creative_cell` [crafting_shaped] #c:storage_blocks/redstone, allthemodium:unobtainium_block, powah:battery_nitro → ironjetpacks:cell · `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster
- **ironfurnaces** (1): `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster
- **allthetweaks** (1): `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack
- **mysticalagradditions** (1): `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack

## justdirethings — Just Dire Things (6 партнерів)

- **integrateddynamics** (2): `recipe:kjs:mods/mysticalagriculture/experience_droplet.js#L8` [squeezer] mysticalagriculture:experience_droplet → justdirethings:xp_fluid_source · `recipe:kjs:mods/mysticalagriculture/experience_droplet.js#L16` [mechanical_squeezer] mysticalagriculture:experience_droplet → justdirethings:xp_fluid_source
- **mysticalagriculture** (2): `recipe:kjs:mods/mysticalagriculture/experience_droplet.js#L8` [squeezer] mysticalagriculture:experience_droplet → justdirethings:xp_fluid_source · `recipe:kjs:mods/mysticalagriculture/experience_droplet.js#L16` [mechanical_squeezer] mysticalagriculture:experience_droplet → justdirethings:xp_fluid_source
- **patchouli** (1): `recipe:justdirethings:my_book_recipe_shapeless` [crafting_shapeless] justdirethings:gooblock_tier1, minecraft:book → patchouli:guide_book
- **allthemodium** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry
- **productivelib** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry
- **quarryplus** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry

## laserio — LaserIO (1 партнерів)

- **patchouli** (1): `recipe:laserio:my_book_recipe_shapeless` [crafting_shapeless] laserio:logic_chip, minecraft:book → patchouli:guide_book, laserio:laseriobook

## logisticsnetworks — LogisticsNetworks (3 партнерів)

- **guideme** (1): `recipe:logisticsnetworks:guide` [guide] logisticsnetworks:wrench, minecraft:paper → guideme:guide
- **ae2** (1): `recipe:logisticsnetworks:network_upgrade_ae2` [crafting_shaped] #ae2:covered_cable, #ae2:covered_dense_cable, #ae2:glass_cable … → logisticsnetworks:network_upgrade
- **refinedstorage** (1): `recipe:logisticsnetworks:network_upgrade_refinedstorage` [crafting_shaped] #refinedstorage:cables, minecraft:clay, refinedstorage:interface … → logisticsnetworks:network_upgrade

## matc — Mystical Agriculture Tiered Crystals (2 партнерів)

- **mysticalagriculture** (11): `recipe:matc:imperium_crystal` [crafting_shaped] matc:tertium_crystal, mysticalagriculture:imperium_essence, mysticalagriculture:prosperity_shard → matc:imperium_crystal · `recipe:matc:imperium_essence` [crafting_shaped] #matc:infusion_crystals/tertium, mysticalagriculture:tertium_essence → mysticalagriculture:imperium_essence
- **mysticalagradditions** (2): `recipe:matc:insanium_essence` [crafting_shaped] #matc:infusion_crystals/supremium, mysticalagriculture:supremium_essence → mysticalagradditions:insanium_essence · `recipe:matc:master_infusion_crystal` [crafting_shaped] matc:supremium_crystal, mysticalagradditions:insanium_essence, mysticalagriculture:prosperity_shard → mysticalagriculture:master_infusion_crystal

## merequester — ME Requester (2 партнерів)

- **ae2** (4): `recipe:merequester:requester` [crafting_shaped] #ae2:interface, #c:ingots/copper, #c:ingots/iron … → merequester:requester · `recipe:merequester:requester_terminal` [crafting_shapeless] #ae2:illuminated_panel, ae2:logic_processor, merequester:requester → merequester:requester_terminal
- **ae2wtlib** (4): `recipe:merequester:wireless/combine_access` [combine] ae2wtlib:wireless_pattern_access_terminal, merequester:wireless_requester_terminal →  · `recipe:merequester:wireless/combine_crafting` [combine] ae2:wireless_crafting_terminal, merequester:wireless_requester_terminal → 

## mffs — Modular Force Field System (1 партнерів)

- **patchouli** (1): `recipe:patchouli:guide_book` [crafting_shapeless] minecraft:book, minecraft:iron_ingot → mffs:handbook, patchouli:guide_book

## modularrouters — Modular Routers (1 партнерів)

- **patchouli** (1): `recipe:modularrouters:guide_book` [crafting_shapeless] modularrouters:blank_module, minecraft:book → patchouli:guide_book, modularrouters:book

## mysticalagradditions — Mystical Agradditions (13 партнерів)

- **mysticalagriculture** (36): `recipe:mysticalagradditions:awakened_supremium_paxel` [awakening] mysticalagradditions:supremium_paxel, mysticalagriculture:air_essence, mysticalagriculture:awakened_supremium_gemstone … → mysticalagradditions:awakened_supremium_paxel · `recipe:mysticalagradditions:imperium_apple` [crafting_shaped] minecraft:golden_apple, mysticalagriculture:imperium_essence → mysticalagradditions:imperium_apple
- **agritechevolved** (6): `recipe:agritechevolved:planter/crop/mysticalagriculture/awakened_draconium_seeds` [crop] mysticalagradditions:awakened_draconium_crux, mysticalagriculture:awakened_draconium_seeds → mysticalagriculture:awakened_draconium_essence, mysticalagriculture:fertilized_essence · `recipe:agritechevolved:planter/crop/mysticalagriculture/dragon_egg_seeds` [crop] mysticalagradditions:dragon_egg_crux, mysticalagriculture:dragon_egg_seeds → mysticalagriculture:dragon_egg_essence, mysticalagriculture:fertilized_essence
- **productivebees** (3): `recipe:productivebees:centrifuge/atm/honeycomb_starry` [centrifuge] productivebees:configurable_honeycomb → allthetweaks:atm_star_shard, mysticalagradditions:nether_star_shard · `recipe:productivebees:centrifuge/mysticalagriculture/honeycomb_insanium` [centrifuge] productivebees:configurable_honeycomb → mysticalagradditions:insanium_essence, productivebees:wax
- **matc** (2): `recipe:matc:insanium_essence` [crafting_shaped] #matc:infusion_crystals/supremium, mysticalagriculture:supremium_essence → mysticalagradditions:insanium_essence · `recipe:matc:master_infusion_crystal` [crafting_shaped] matc:supremium_crystal, mysticalagradditions:insanium_essence, mysticalagriculture:prosperity_shard → mysticalagriculture:master_infusion_crystal
- **allthetweaks** (2): `recipe:productivebees:centrifuge/atm/honeycomb_starry` [centrifuge] productivebees:configurable_honeycomb → allthetweaks:atm_star_shard, mysticalagradditions:nether_star_shard · `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack
- **allthemodium** (2): `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack · `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **allthecompressed** (2): `recipe:kjs:mods/mysticalagriculture/compatibility.js#L128.4` [infusion] mysticalagriculture:prosperity_seed_base, allthecompressed:nitro_crystal_block_1x, mysticalagradditions:insanium_essence → mysticalagriculture:nitro_crystal_seeds · `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **powah** (1): `recipe:mysticalagradditions:nitro_crystal_crux` [crafting_shaped] #c:storage_blocks/diamond, mysticalagradditions:insanium_essence, powah:capacitor_nitro … → mysticalagradditions:nitro_crystal_crux
- **mysticalautomation** (1): `recipe:mysticalautomation:farmer/inferium_seeds_tier_6` [farmer] mysticalagradditions:insanium_farmland, mysticalagriculture:inferium_seeds → mysticalagriculture:inferium_essence
- **ironjetpacks** (1): `recipe:allthemods:ironjetpacks_creative_jetpack` [crafting_shaped] mysticalagradditions:creative_essence, allthemodium:vibranium_allthemodium_block, ironjetpacks:capacitor … → ironjetpacks:jetpack
- **productivetrees** (1): `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **hostilenetworks** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul
- **reliquary** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul

## mysticalagriculture — Mystical Agriculture (24 партнерів)

- **agritechevolved** (142): `recipe:agritechevolved:planter/crop/mysticalagriculture/air_seeds` [crop] #agritechevolved:ma_tier1_soils, mysticalagriculture:air_seeds → mysticalagriculture:air_essence, mysticalagriculture:air_seeds · `recipe:agritechevolved:planter/crop/mysticalagriculture/aluminum_seeds` [crop] #agritechevolved:ma_tier2_soils, mysticalagriculture:aluminum_seeds → mysticalagriculture:aluminum_essence, mysticalagriculture:aluminum_seeds
- **cucumber** (108): `recipe:mysticalagriculture:soulium_dagger` [shaped_transfer_damage] minecraft:golden_sword, mysticalagriculture:soulium_dust, mysticalagriculture:soulium_ingot → mysticalagriculture:soulium_dagger · `recipe:mysticalagriculture:essence/common/aluminum_ingot` [shaped_tag] mysticalagriculture:aluminum_essence → #c:ingots/aluminum
- **mysticalagradditions** (36): `recipe:mysticalagradditions:awakened_supremium_paxel` [awakening] mysticalagradditions:supremium_paxel, mysticalagriculture:air_essence, mysticalagriculture:awakened_supremium_gemstone … → mysticalagradditions:awakened_supremium_paxel · `recipe:mysticalagradditions:imperium_apple` [crafting_shaped] minecraft:golden_apple, mysticalagriculture:imperium_essence → mysticalagradditions:imperium_apple
- **regions_unexplored** (23): `recipe:allthemods:essence/regions_unexplored/alpha_log` [crafting_shaped] mysticalagriculture:unexplored_wood_essence → regions_unexplored:alpha_log · `recipe:allthemods:essence/regions_unexplored/ashen_log` [crafting_shaped] mysticalagriculture:unexplored_wood_essence → regions_unexplored:ashen_log
- **allthecompressed** (22): `recipe:kjs:mods/mysticalagriculture/compatibility.js#L128` [infusion] mysticalagriculture:prosperity_seed_base, allthecompressed:steel_block_1x, mysticalagriculture:imperium_essence → mysticalagriculture:steel_seeds · `recipe:kjs:mods/mysticalagriculture/compatibility.js#L128.2` [infusion] mysticalagriculture:prosperity_seed_base, allthecompressed:bronze_block_1x, mysticalagriculture:tertium_essence → mysticalagriculture:bronze_seeds
- **matc** (11): `recipe:matc:imperium_crystal` [crafting_shaped] matc:tertium_crystal, mysticalagriculture:imperium_essence, mysticalagriculture:prosperity_shard → matc:imperium_crystal · `recipe:matc:imperium_essence` [crafting_shaped] #matc:infusion_crystals/tertium, mysticalagriculture:tertium_essence → mysticalagriculture:imperium_essence
- **enderio** (10): `recipe:mysticalagriculture:essence/enderio/conductive_alloy_ingot` [crafting_shaped] mysticalagriculture:conductive_alloy_essence → enderio:conductive_alloy_ingot · `recipe:mysticalagriculture:essence/enderio/dark_steel_ingot` [crafting_shaped] mysticalagriculture:dark_steel_essence → enderio:dark_steel_ingot
- **ae2** (8): `recipe:mysticalagriculture:essence/appliedenergistics2/calculation_press` [crafting_shaped] ae2:certus_quartz_crystal, mysticalagriculture:certus_quartz_essence → ae2:calculation_processor_press · `recipe:mysticalagriculture:essence/appliedenergistics2/certus_quartz` [crafting_shaped] mysticalagriculture:certus_quartz_essence → ae2:certus_quartz_crystal
- **mysticalautomation** (8): `recipe:mysticalautomation:farmer/inferium_seeds_tier_0` [farmer] minecraft:farmland, mysticalagriculture:inferium_seeds → mysticalagriculture:inferium_essence · `recipe:mysticalautomation:farmer/inferium_seeds_tier_1` [farmer] mysticalagriculture:inferium_farmland, mysticalagriculture:inferium_seeds → mysticalagriculture:inferium_essence
- **productivebees** (8): `recipe:productivebees:centrifuge/mysticalagriculture/honeycomb_awakened_supremium` [centrifuge] productivebees:configurable_honeycomb → mysticalagriculture:awakened_supremium_essence, productivebees:wax · `recipe:productivebees:centrifuge/mysticalagriculture/honeycomb_imperium` [centrifuge] productivebees:configurable_honeycomb → mysticalagriculture:imperium_essence, productivebees:wax
- **integrateddynamics** (7): `recipe:mysticalagriculture:essence/integrateddynamics/menril_berries` [crafting_shaped] mysticalagriculture:menril_essence → integrateddynamics:menril_berries · `recipe:mysticalagriculture:essence/integrateddynamics/menril_log` [crafting_shaped] mysticalagriculture:menril_essence → integrateddynamics:menril_log
- **powah** (6): `recipe:mysticalagradditions:essence/nitro_crystal` [crafting_shaped] minecraft:nether_star, mysticalagriculture:nitro_crystal_essence → powah:crystal_nitro · `recipe:mysticalagriculture:essence/powah/blazing_crystal` [crafting_shaped] mysticalagriculture:blazing_crystal_essence → powah:crystal_blazing
- **allthemodium** (5): `recipe:allthemods:mysticalagriculture/awakening/fertile_lily_pad` [awakening] mysticalagriculture:air_essence, mysticalagriculture:earth_essence, mysticalagriculture:water_essence … → reliquary:fertile_lily_pad · `recipe:kubejs:mysticalagriculture/allthemodium_essence_crafting` [crafting_shaped] mysticalagriculture:allthemodium_essence → allthemodium:allthemodium_nugget
- **chisel** (2): `recipe:mysticalagriculture:essence/chisel/limestone` [crafting_shaped] mysticalagriculture:limestone_essence → chisel:limestone_raw · `recipe:mysticalagriculture:essence/chisel/marble` [crafting_shaped] mysticalagriculture:marble_essence → chisel:marble_raw
- **justdirethings** (2): `recipe:kjs:mods/mysticalagriculture/experience_droplet.js#L8` [squeezer] mysticalagriculture:experience_droplet → justdirethings:xp_fluid_source · `recipe:kjs:mods/mysticalagriculture/experience_droplet.js#L16` [mechanical_squeezer] mysticalagriculture:experience_droplet → justdirethings:xp_fluid_source
- **silentgear** (2): `recipe:kubejs:mysticalagriculture/azure_silver_essence_crafting` [crafting_shaped] mysticalagriculture:azure_silver_essence → silentgear:azure_silver_ingot · `recipe:kubejs:mysticalagriculture/crimson_iron_essence_crafting` [crafting_shaped] mysticalagriculture:crimson_iron_essence → silentgear:crimson_iron_ingot
- **extendedae** (2): `recipe:kubejs:mysticalagriculture/entro_essence_crafting` [crafting_shaped] mysticalagriculture:entro_essence → extendedae:entro_crystal · `recipe:mysticalagriculture:infusion/entro_seeds` [infusion] mysticalagriculture:prosperity_seed_base, extendedae:entro_crystal, mysticalagriculture:supremium_essence → mysticalagriculture:entro_seeds
- **theurgy** (2): `recipe:kjs:mods/theurgy/incubation.js#L17.6` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:prosperity_sulfur → mysticalagriculture:prosperity_shard · `recipe:kjs:mods/theurgy/liquefaction.js#L81.6` [liquefaction] kubejs:prosperity_sulfur, mysticalagriculture:prosperity_shard, theurgy:sal_ammoniac → 
- **patchouli** (1): `recipe:mysticalagriculture:guide_book` [crafting_shapeless] minecraft:book, mysticalagriculture:inferium_essence → patchouli:guide_book
- **refinedstorage** (1): `recipe:mysticalagriculture:essence/refinedstorage/quartz_enriched_iron_ingot` [crafting_shaped] mysticalagriculture:quartz_enriched_iron_essence → refinedstorage:quartz_enriched_iron
- **reliquary** (1): `recipe:allthemods:mysticalagriculture/awakening/fertile_lily_pad` [awakening] mysticalagriculture:air_essence, mysticalagriculture:earth_essence, mysticalagriculture:water_essence … → reliquary:fertile_lily_pad
- **forbidden_arcanus** (1): `recipe:kubejs:mysticalagriculture/darkstone_essence_crafting` [crafting_shaped] mysticalagriculture:darkstone_essence → forbidden_arcanus:darkstone
- **productivetrees** (1): `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **alltheores** (1): `recipe:mysticalagriculture:infusion/steel_seeds` [infusion] mysticalagriculture:prosperity_seed_base, alltheores:steel_ingot, mysticalagriculture:imperium_essence → mysticalagriculture:steel_seeds

## mysticalautomation — Mystical Automation (2 партнерів)

- **mysticalagriculture** (8): `recipe:mysticalautomation:farmer/inferium_seeds_tier_0` [farmer] minecraft:farmland, mysticalagriculture:inferium_seeds → mysticalagriculture:inferium_essence · `recipe:mysticalautomation:farmer/inferium_seeds_tier_1` [farmer] mysticalagriculture:inferium_farmland, mysticalagriculture:inferium_seeds → mysticalagriculture:inferium_essence
- **mysticalagradditions** (1): `recipe:mysticalautomation:farmer/inferium_seeds_tier_6` [farmer] mysticalagradditions:insanium_farmland, mysticalagriculture:inferium_seeds → mysticalagriculture:inferium_essence

## neovitae — Neo Vitae (7 партнерів)

- **geore** (23): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand · `recipe:kjs:mods/neovitae/meteor.js#L127` [meteor] kubejs:copper_catalyst, geore:copper_block, minecraft:smooth_basalt … → 
- **ae2** (1): `recipe:neovitae:meteor/ae2` [meteor] #c:gems/certus_quartz, ae2:fluix_block, ae2:sky_stone_block … → 
- **witchery** (1): `recipe:witchery:ritual/rite_of_bloodbinding` [ritual] #witchery:nether_star, neovitae:blood_pearl, neovitae:weak_blood_shard … → 
- **alltheores** (1): `recipe:alltheores:processing/ore_hammer/hellforged_dust_from_ingot` [crafting_shapeless] #c:ingots/hellforged, #alltheores:ore_hammers → neovitae:hellforged_dust
- **energizedpower** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand
- **occultism** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand
- **waystones** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand

## occultism — Occultism (16 партнерів)

- **geore** (74): `recipe:occultism:crystallize/geore_allthemodium` [crystallize] #geore:storage_blocks/geore_allthemodium → #geore:geore_shards/allthemodium · `recipe:occultism:crystallize/geore_aluminum` [crystallize] #geore:storage_blocks/geore_aluminum → #geore:geore_shards/aluminum
- **forbidden_arcanus** (23): `recipe:occultism:ritual/misc_unbreakable` [ritual] #atm:unbreakable, #c:evokers, #c:ingots/iesnium … → occultism:repair_icon · `recipe:occultism:copper_catalyst` [ritual] geore:copper_shard, occultism:book_of_binding_bound_foliot, occultism:spirit_attuned_crystal … → kubejs:copper_catalyst
- **dyenamics** (18): `recipe:allthemods:crafting/otherflower_to_honey_dye` [crafting_shapeless] occultism:otherflower, dyenamics:honey_dye → dyenamics:honey_dye · `recipe:allthemods:crafting/otherflower_to_mint_dye` [crafting_shapeless] occultism:otherflower, dyenamics:mint_dye → dyenamics:mint_dye
- **iceandfire** (9): `recipe:occultism:ritual/craft_infused_axe` [ritual] occultism:book_of_binding_bound_djinni, iceandfire:silver_axe, occultism:soul_gem … → occultism:infused_axe · `recipe:occultism:ritual/craft_infused_boots` [ritual] occultism:book_of_binding_bound_djinni, iceandfire:armor_silver_metal_boots, occultism:soul_gem … → occultism:infused_boots
- **energizedpower** (4): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand · `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part
- **refinedtypes** (3): `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part · `recipe:allthemods:meteoric_infusion/inf_disk` [ritual] refinedstorage:storage_housing, refinedtypes:infinite_energy_storage_part, energizedpower:superconductor … → refinedtypes:infinite_energy_storage_disk
- **agritechevolved** (2): `recipe:agritechevolved:planter/crop/occultism/datura_seeds` [crop] #agritechevolved:farmland_soils, occultism:datura_seeds → occultism:datura, occultism:datura_seeds · `recipe:agritechevolved:planter/tree/occultism/otherworld_sapling` [tree] #agritechevolved:tree_soils, occultism:otherworld_sapling → minecraft:stick, occultism:otherworld_log
- **refinedstorage** (2): `recipe:allthemods:meteoric_infusion/inf_disk` [ritual] refinedstorage:storage_housing, refinedtypes:infinite_energy_storage_part, energizedpower:superconductor … → refinedtypes:infinite_energy_storage_disk · `recipe:allthemods:meteoric_infusion/inf_block` [ritual] refinedstorage:machine_casing, refinedtypes:infinite_energy_storage_part, energizedpower:superconductor … → refinedtypes:infinite_energy_storage_block
- **allthemodium** (1): `recipe:occultism:ritual/misc_miner_ancient_eldritch` [ritual] allthemodium:piglich_heart, allthemodium:unobtainium_pickaxe, occultism:iesnium_pickaxe … → occultism:miner_ancient_eldritch
- **ae2** (1): `recipe:allthemods:ae2/charger/meteorite_divination_rod` [charger] occultism:divination_rod → ae2:mysterious_cube, occultism:divination_rod
- **alltheores** (1): `recipe:alltheores:processing/ore_hammer/iesnium_dust_from_ingot` [crafting_shapeless] #c:ingots/iesnium, #alltheores:ore_hammers → occultism:iesnium_dust
- **constructionstick** (1): `recipe:allthemods:crystalline_infusion/crystalline_wand` [ritual] constructionstick:iron_stick, kubejs:allthemodium_catalyst, occultism:spirit_attuned_crystal … → kubejs:crystalline_wand
- **neovitae** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand
- **waystones** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand
- **cabletiers** (1): `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part
- **theurgy** (1): `recipe:kjs:mods/theurgy/incubation.js#L17.5` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:iesnium_sulfur → occultism:iesnium_ingot

## oritech — Oritech (7 партнерів)

- **alltheores** (90): `recipe:oritech:compat/ato/deepdrill/aluminum` [bedrock_extractor] oritech:aluminum_resource_node → alltheores:raw_aluminum · `recipe:oritech:compat/ato/deepdrill/iridium` [bedrock_extractor] oritech:iridium_resource_node → alltheores:raw_iridium
- **geore** (32): `recipe:oritech:compat/geore/assembler/budding_allthemodium` [assembler] geore:allthemodium_shard, oritech:enderic_compound, oritech:overcharged_crystal → geore:budding_allthemodium · `recipe:oritech:compat/geore/assembler/budding_aluminum` [assembler] geore:aluminum_shard, oritech:enderic_compound, oritech:overcharged_crystal → geore:budding_aluminum
- **ae2** (8): `recipe:oritech:compat/ae2/charger/fluxite` [charger] #c:gems/amethyst → oritech:fluxite · `recipe:oritech:compat/ae2/fragment_forge/certus_dust` [fragment_forge] #c:gems/certus_quartz → ae2:certus_quartz_dust
- **enderio** (5): `recipe:oritech:compat/enderio/crafting/fluid_pipe` [crafting_shaped] #c:ingots/copper, enderio:conduit_binder → oritech:fluid_pipe · `recipe:oritech:compat/enderio/fragment_forge/dust/lapis` [fragment_forge] #c:gems/lapis → enderio:powdered_lapis_lazuli
- **productivemetalworks** (5): `recipe:oritech:compat/productivemetalworks/melting/copper_gem` [item_melting] oritech:copper_gem → productivemetalworks:molten_copper · `recipe:oritech:compat/productivemetalworks/melting/gold_gem` [item_melting] oritech:gold_gem → productivemetalworks:molten_gold
- **powah** (3): `recipe:oritech:compat/powah/energizing/energite` [energizing] #c:ingots/nickel, oritech:fluxite → oritech:energite_ingot · `recipe:oritech:compat/powah/energizing/fluxite` [energizing] #c:gems/amethyst → oritech:fluxite
- **extendedae** (2): `recipe:oritech:compat/extendedae/fragment_forge/entro_dust` [fragment_forge] #c:gems/entro → extendedae:entro_dust · `recipe:oritech:compat/extendedae/pulverizer/entro_dust` [pulverizer] #c:gems/entro → extendedae:entro_dust

## patchouli — Patchouli (6 партнерів)

- **productivebees** (2): `recipe:productivebees:guide_book` [crafting_shapeless] minecraft:book, productivebees:bee_cage → patchouli:guide_book · `recipe:productivebees:guide_book_sturdy` [crafting_shapeless] minecraft:book, productivebees:sturdy_bee_cage → patchouli:guide_book
- **mysticalagriculture** (1): `recipe:mysticalagriculture:guide_book` [crafting_shapeless] minecraft:book, mysticalagriculture:inferium_essence → patchouli:guide_book
- **justdirethings** (1): `recipe:justdirethings:my_book_recipe_shapeless` [crafting_shapeless] justdirethings:gooblock_tier1, minecraft:book → patchouli:guide_book
- **laserio** (1): `recipe:laserio:my_book_recipe_shapeless` [crafting_shapeless] laserio:logic_chip, minecraft:book → patchouli:guide_book, laserio:laseriobook
- **mffs** (1): `recipe:patchouli:guide_book` [crafting_shapeless] minecraft:book, minecraft:iron_ingot → mffs:handbook, patchouli:guide_book
- **modularrouters** (1): `recipe:modularrouters:guide_book` [crafting_shapeless] modularrouters:blank_module, minecraft:book → patchouli:guide_book, modularrouters:book

## powah — Powah (12 партнерів)

- **allthecompressed** (34): `recipe:allthecompressed:compress/blazing_crystal_block_1x` [crafting_shaped] powah:blazing_crystal_block → allthecompressed:blazing_crystal_block_1x · `recipe:allthecompressed:compress/energized_steel_block_1x` [crafting_shaped] powah:energized_steel_block → allthecompressed:energized_steel_block_1x
- **mysticalagriculture** (6): `recipe:mysticalagradditions:essence/nitro_crystal` [crafting_shaped] minecraft:nether_star, mysticalagriculture:nitro_crystal_essence → powah:crystal_nitro · `recipe:mysticalagriculture:essence/powah/blazing_crystal` [crafting_shaped] mysticalagriculture:blazing_crystal_essence → powah:crystal_blazing
- **productivebees** (6): `recipe:productivebees:centrifuge/powah/honeycomb_blazing_crystal` [centrifuge] productivebees:configurable_honeycomb → powah:crystal_blazing, productivebees:wax · `recipe:productivebees:centrifuge/powah/honeycomb_energized_steel` [centrifuge] productivebees:configurable_honeycomb → powah:steel_energized, productivebees:wax
- **ae2** (6): `recipe:kubejs:energizing/1x_charged_certus_quartz_crystal` [energizing] #c:gems/certus_quartz → ae2:charged_certus_quartz_crystal · `recipe:kubejs:energizing/2x_charged_certus_quartz_crystal` [energizing] #c:gems/certus_quartz → ae2:charged_certus_quartz_crystal
- **allthemodium** (4): `recipe:kubejs:energizing/vibranium_allthemodium_alloy_ingot` [energizing] #c:ingots/allthemodium, allthemodium:piglich_heart, allthecompressed:nitro_crystal_block_1x … → allthemodium:vibranium_allthemodium_alloy_ingot · `recipe:kubejs:energizing/vibranium_allthemodium_block` [energizing] #c:storage_blocks/allthemodium, allthemodium:piglich_heart_block, allthecompressed:nitro_crystal_block_2x … → allthemodium:vibranium_allthemodium_block
- **integrateddynamics** (4): `recipe:allthemods:energizing/integrateddynamics_energy_battery_creative` [energizing] integrateddynamics:energy_battery, allthetweaks:atm_star → integrateddynamics:energy_battery_creative · `recipe:kjs:mods/integrateddynamics/squeezer.js#L34` [mechanical_squeezer] #c:ores/uraninite_poor → powah:uraninite_raw
- **oritech** (3): `recipe:oritech:compat/powah/energizing/energite` [energizing] #c:ingots/nickel, oritech:fluxite → oritech:energite_ingot · `recipe:oritech:compat/powah/energizing/fluxite` [energizing] #c:gems/amethyst → oritech:fluxite
- **enderio** (3): `recipe:kjs:mods/enderio/sag_milling.js#L6.5` [sag_milling] #c:ores/uraninite_poor → powah:uraninite_raw · `recipe:kjs:mods/enderio/sag_milling.js#L6.6` [sag_milling] #c:ores/uraninite_regular → powah:uraninite_raw
- **allthetweaks** (2): `recipe:allthemods:energizing/integrateddynamics_energy_battery_creative` [energizing] integrateddynamics:energy_battery, allthetweaks:atm_star → integrateddynamics:energy_battery_creative · `recipe:allthemods:energizing/powah_creative_energy_cell` [energizing] powah:energy_cell_nitro, allthetweaks:atm_star → powah:energy_cell_creative
- **ironjetpacks** (2): `recipe:allthemods:ironjetpacks_creative_cell` [crafting_shaped] #c:storage_blocks/redstone, allthemodium:unobtainium_block, powah:battery_nitro → ironjetpacks:cell · `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster
- **mysticalagradditions** (1): `recipe:mysticalagradditions:nitro_crystal_crux` [crafting_shaped] #c:storage_blocks/diamond, mysticalagradditions:insanium_essence, powah:capacitor_nitro … → mysticalagradditions:nitro_crystal_crux
- **ironfurnaces** (1): `recipe:allthemods:ironjetpacks_creative_thruster` [crafting_shaped] allthemodium:unobtainium_block, powah:nitro_crystal_block, ironjetpacks:cell … → ironjetpacks:thruster

## productivebees — Productive Bees (16 партнерів)

- **regions_unexplored** (44): `recipe:productivebees:expansion_boxes/expansion_box_regions_unexplored_baobab` [crafting_shaped] #c:honeycombs, regions_unexplored:baobab_planks → productivebees:expansion_box_regions_unexplored_baobab · `recipe:productivebees:expansion_boxes/expansion_box_regions_unexplored_blackwood` [crafting_shaped] #c:honeycombs, regions_unexplored:blackwood_planks → productivebees:expansion_box_regions_unexplored_blackwood
- **mysticalagriculture** (8): `recipe:productivebees:centrifuge/mysticalagriculture/honeycomb_awakened_supremium` [centrifuge] productivebees:configurable_honeycomb → mysticalagriculture:awakened_supremium_essence, productivebees:wax · `recipe:productivebees:centrifuge/mysticalagriculture/honeycomb_imperium` [centrifuge] productivebees:configurable_honeycomb → mysticalagriculture:imperium_essence, productivebees:wax
- **powah** (6): `recipe:productivebees:centrifuge/powah/honeycomb_blazing_crystal` [centrifuge] productivebees:configurable_honeycomb → powah:crystal_blazing, productivebees:wax · `recipe:productivebees:centrifuge/powah/honeycomb_energized_steel` [centrifuge] productivebees:configurable_honeycomb → powah:steel_energized, productivebees:wax
- **productivemetalworks** (5): `recipe:productivemetalworks:casting/pbees/wax` [item_casting] #c:wax → productivebees:wax · `recipe:productivemetalworks:casting/pbees/wax_block` [block_casting] #c:wax → productivebees:wax_block
- **productivelib** (3): `recipe:productivebees:breeding_chamber` [crafting_shaped] #c:ingots/iron, minecraft:rose_bush, productivelib:upgrade_child → productivebees:breeding_chamber · `recipe:productivebees:heated_centrifuge` [crafting_shaped] #c:ingots/iron, #c:storage_blocks/copper, productivebees:inactive_dragon_egg … → productivebees:heated_centrifuge
- **allthemodium** (3): `recipe:productivebees:centrifuge/atm/honeycomb_allthemodium` [centrifuge] productivebees:configurable_honeycomb → allthemodium:allthemodium_nugget, productivebees:wax · `recipe:productivebees:centrifuge/atm/honeycomb_unobtainium` [centrifuge] productivebees:configurable_honeycomb → allthemodium:unobtainium_nugget, productivebees:wax
- **mysticalagradditions** (3): `recipe:productivebees:centrifuge/atm/honeycomb_starry` [centrifuge] productivebees:configurable_honeycomb → allthetweaks:atm_star_shard, mysticalagradditions:nether_star_shard · `recipe:productivebees:centrifuge/mysticalagriculture/honeycomb_insanium` [centrifuge] productivebees:configurable_honeycomb → mysticalagradditions:insanium_essence, productivebees:wax
- **allthecompressed** (2): `recipe:allthecompressed:compress/wax_block_1x` [crafting_shaped] productivebees:wax_block → allthecompressed:wax_block_1x · `recipe:allthecompressed:decompress/wax_block_1x` [crafting_shapeless] allthecompressed:wax_block_1x → productivebees:wax_block
- **patchouli** (2): `recipe:productivebees:guide_book` [crafting_shapeless] minecraft:book, productivebees:bee_cage → patchouli:guide_book · `recipe:productivebees:guide_book_sturdy` [crafting_shapeless] minecraft:book, productivebees:sturdy_bee_cage → patchouli:guide_book
- **ae2** (2): `recipe:productivebees:centrifuge/ae2/honeycomb_fluix` [centrifuge] productivebees:configurable_honeycomb → ae2:fluix_crystal, ae2:fluix_dust · `recipe:productivebees:centrifuge/ae2/honeycomb_spatial` [centrifuge] productivebees:configurable_honeycomb → ae2:certus_quartz_crystal, ae2:certus_quartz_dust
- **allthetweaks** (2): `recipe:productivebees:centrifuge/atm/honeycomb_patrick` [centrifuge] productivebees:configurable_honeycomb → allthetweaks:patrick_star, productivebees:wax · `recipe:productivebees:centrifuge/atm/honeycomb_starry` [centrifuge] productivebees:configurable_honeycomb → allthetweaks:atm_star_shard, mysticalagradditions:nether_star_shard
- **integrateddynamics** (2): `recipe:productivebees:centrifuge/integrateddynamics/honeycomb_ender_liquid_chorus` [centrifuge] integrateddynamics:liquid_chorus, productivebees:configurable_honeycomb → minecraft:ender_pearl, productivebees:wax · `recipe:productivebees:centrifuge/integrateddynamics/honeycomb_menril` [centrifuge] integrateddynamics:menril_resin, productivebees:configurable_honeycomb → integrateddynamics:crystalized_menril_chunk, productivebees:wax
- **evilcraft** (1): `recipe:productivebees:centrifuge/evilcraft/honeycomb_bloody` [centrifuge] evilcraft:blood, productivebees:configurable_honeycomb → productivebees:wax
- **refinedstorage** (1): `recipe:productivebees:centrifuge/refinedstorage/honeycomb_quartz_enriched_iron` [centrifuge] productivebees:configurable_honeycomb → productivebees:wax, refinedstorage:quartz_enriched_iron
- **hostilenetworks** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul
- **reliquary** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul

## productivefarming — Productive Farming (1 партнерів)

- **agritechevolved** (159): `recipe:productivefarming:agritech_evolved/agave` [crop] #agritechevolved:farmland_soils, productivefarming:agave → productivefarming:agave · `recipe:productivefarming:agritech_evolved/akebia` [crop] #agritechevolved:farmland_soils, productivefarming:akebia → productivefarming:akebia

## productivelib —  (5 партнерів)

- **productivebees** (3): `recipe:productivebees:breeding_chamber` [crafting_shaped] #c:ingots/iron, minecraft:rose_bush, productivelib:upgrade_child → productivebees:breeding_chamber · `recipe:productivebees:heated_centrifuge` [crafting_shaped] #c:ingots/iron, #c:storage_blocks/copper, productivebees:inactive_dragon_egg … → productivebees:heated_centrifuge
- **productivemetalworks** (2): `recipe:productivemetalworks:casting/misc/upgrade_stability` [item_casting] #c:molten_ender, productivelib:upgrade_base → productivelib:upgrade_stability · `recipe:productivemetalworks:crafting/upgrade_time` [crafting_shaped] minecraft:clock, productivelib:upgrade_base, productivemetalworks:fire_brick → productivelib:upgrade_time
- **allthemodium** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry
- **justdirethings** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry
- **quarryplus** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry

## productivemetalworks — Productive Metalworks (9 партнерів)

- **sgearmetalworks** (178): `recipe:productivemetalworks:alloying/molten_azure_electrum` [fluid_alloying] #c:molten_azure_silver, #c:molten_ender, #c:molten_gold → sgearmetalworks:molten_azure_electrum · `recipe:productivemetalworks:alloying/molten_blaze_gold` [fluid_alloying] #c:molten_blaze, #c:molten_gold → sgearmetalworks:molten_blaze_gold
- **alltheores** (126): `recipe:productivemetalworks:casting/gears/alltheores/aluminum` [item_casting] #c:molten_aluminum, productivemetalworks:gear_cast → alltheores:aluminum_gear · `recipe:productivemetalworks:casting/gears/alltheores/brass` [item_casting] #c:molten_brass, productivemetalworks:gear_cast → alltheores:brass_gear
- **silentgear** (88): `recipe:productivemetalworks:casting/ingots/silentgear/azure_electrum` [item_casting] #c:molten_azure_electrum, productivemetalworks:ingot_cast → silentgear:azure_electrum_ingot · `recipe:productivemetalworks:casting/ingots/silentgear/azure_silver` [item_casting] #c:molten_azure_silver, productivemetalworks:ingot_cast → silentgear:azure_silver_ingot
- **silentgems** (42): `recipe:productivemetalworks:casting/gems/alexandrite` [item_casting] #c:molten_alexandrite, productivemetalworks:gem_cast → silentgems:alexandrite · `recipe:productivemetalworks:casting/gems/ammolite` [item_casting] #c:molten_ammolite, productivemetalworks:gem_cast → silentgems:ammolite
- **allthemodium** (20): `recipe:productivemetalworks:casting/atm/allthemodium_block` [block_casting]  → allthemodium:allthemodium_block · `recipe:productivemetalworks:casting/atm/allthemodium_gear` [item_casting] productivemetalworks:gear_cast → allthemodium:allthemodium_gear
- **geore** (6): `recipe:productivemetalworks:melting/geore/ruby_block` [item_melting] geore:ruby_block → sgearmetalworks:molten_ruby · `recipe:productivemetalworks:melting/geore/ruby_shard` [item_melting] geore:ruby_shard → sgearmetalworks:molten_ruby
- **oritech** (5): `recipe:oritech:compat/productivemetalworks/melting/copper_gem` [item_melting] oritech:copper_gem → productivemetalworks:molten_copper · `recipe:oritech:compat/productivemetalworks/melting/gold_gem` [item_melting] oritech:gold_gem → productivemetalworks:molten_gold
- **productivebees** (5): `recipe:productivemetalworks:casting/pbees/wax` [item_casting] #c:wax → productivebees:wax · `recipe:productivemetalworks:casting/pbees/wax_block` [block_casting] #c:wax → productivebees:wax_block
- **productivelib** (2): `recipe:productivemetalworks:casting/misc/upgrade_stability` [item_casting] #c:molten_ender, productivelib:upgrade_base → productivelib:upgrade_stability · `recipe:productivemetalworks:crafting/upgrade_time` [crafting_shaped] minecraft:clock, productivelib:upgrade_base, productivemetalworks:fire_brick → productivelib:upgrade_time

## productivetrees — Productive Trees (5 партнерів)

- **agritechevolved** (163): `recipe:productivetrees:agritech_evolved/alder` [tree] #agritechevolved:tree_soils, productivetrees:alder_sapling → minecraft:stick, productivetrees:alder_log · `recipe:productivetrees:agritech_evolved/allspice` [tree] #agritechevolved:tree_soils, productivetrees:allspice_sapling → minecraft:stick, productivetrees:allspice
- **allthecompressed** (1): `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **allthemodium** (1): `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **mysticalagradditions** (1): `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil
- **mysticalagriculture** (1): `recipe:allthemods:kjs/magical_soil` [crafting_shaped] mysticalagradditions:insanium_block, allthecompressed:nether_star_block_2x, allthecompressed:dirt_3x … → kubejs:magical_soil

## quarryplus — QuarryPlus (3 партнерів)

- **allthemodium** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry
- **justdirethings** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry
- **productivelib** (1): `recipe:kjs:mods/quarryplus/recipes.js#L10` [crafting_shaped] allthemodium:allthemodium_ingot, justdirethings:eclipsealloy_pickaxe, allthemodium:unobtainium_pickaxe … → quarryplus:quarry

## railcraft — Railcraft Reborn (2 партнерів)

- **allthemodium** (1): `recipe:kjs:modpack/atm_star_creative.js#L273` [crafting_shaped] allthetweaks:atm_star_shard, allthemodium:unobtainium_gear, railcraft:charge_motor … → railcraft:creative_locomotive
- **allthetweaks** (1): `recipe:kjs:modpack/atm_star_creative.js#L273` [crafting_shaped] allthetweaks:atm_star_shard, allthemodium:unobtainium_gear, railcraft:charge_motor … → railcraft:creative_locomotive

## refinedflowanalytics — Refined Flow Analytics (1 партнерів)

- **refinedstorage** (35): `recipe:refinedflowanalytics:flow_detector` [crafting_shapeless] refinedstorage:advanced_processor, refinedstorage:detector → refinedflowanalytics:flow_detector · `recipe:refinedflowanalytics:flow_grid` [crafting_shaped] #c:glass_blocks, refinedstorage:advanced_processor, refinedstorage:detector … → refinedflowanalytics:flow_grid

## refinedfluidsubstitution — Refined Fluid Substitution (1 партнерів)

- **refinedstorage** (1): `recipe:refinedfluidsubstitution:fluid_substitution_pattern` [crafting_shaped] minecraft:bucket, refinedstorage:pattern → refinedfluidsubstitution:fluid_substitution_pattern

## refinedstorage — Refined Storage (16 партнерів)

- **cabletiers** (398): `recipe:cabletiers:elite_autocrafter` [crafting_shaped] minecraft:iron_block, refinedstorage:advanced_processor, refinedstorage:autocrafter → cabletiers:elite_autocrafter · `recipe:cabletiers:elite_constructor` [crafting_shaped] minecraft:iron_block, refinedstorage:advanced_processor, refinedstorage:constructor → cabletiers:elite_constructor
- **extradisks** (73): `recipe:extradisks:advanced_machine_casing` [crafting_shaped] refinedstorage:advanced_processor, refinedstorage:construction_core, refinedstorage:destruction_core … → extradisks:advanced_machine_casing · `recipe:extradisks:advanced_storage_housing` [crafting_shaped] #c:glass_blocks, refinedstorage:advanced_processor, refinedstorage:improved_processor … → extradisks:advanced_storage_housing
- **refinedtypes** (66): `recipe:refinedtypes:1024k_essentia_storage_block` [crafting_shaped] #c:dusts/redstone, refinedstorage:machine_casing, refinedtypes:1024k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_block · `recipe:refinedtypes:1024k_essentia_storage_block_upgrade` [storage_container_upgrade] refinedtypes:1024k_essentia_storage_part, refinedtypes:256k_essentia_storage_block, refinedtypes:64k_essentia_storage_block → refinedtypes:1024k_essentia_storage_block
- **refinedflowanalytics** (35): `recipe:refinedflowanalytics:flow_detector` [crafting_shapeless] refinedstorage:advanced_processor, refinedstorage:detector → refinedflowanalytics:flow_detector · `recipe:refinedflowanalytics:flow_grid` [crafting_shaped] #c:glass_blocks, refinedstorage:advanced_processor, refinedstorage:detector … → refinedflowanalytics:flow_grid
- **energizedpower** (27): `recipe:kjs:mods/refined_storage/refined_types.js#L5` [crafting_shaped] refinedstorage:quartz_enriched_copper, energizedpower:advanced_circuit, refinedstorage:quartz_enriched_iron … → refinedtypes:64k_energy_storage_part · `recipe:kjs:mods/refined_storage/refined_types.js#L18` [crafting_shaped] refinedstorage:construction_core, refinedstorage:interface, refinedstorage:advanced_processor … → refinedtypes:network_energizer
- **interdimensionalwirelesstransmitter** (17): `recipe:interdimensionalwirelesstransmitter:interdimensional_wireless_transmitter` [crafting_shaped] minecraft:elytra, minecraft:nether_star, refinedstorage:wireless_transmitter → interdimensionalwirelesstransmitter:interdimensional_wireless_transmitter · `recipe:interdimensionalwirelesstransmitter:coloring/black_interdimensional_wireless_transmitter` [recoloring] #interdimensionalwirelesstransmitter:interdimensional_wireless_transmitters → interdimensionalwirelesstransmitter:black_interdimensional_wireless_transmitter
- **thaumaturge** (16): `recipe:refinedtypes:1024k_essentia_storage_block` [crafting_shaped] #c:dusts/redstone, refinedstorage:machine_casing, refinedtypes:1024k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_block · `recipe:refinedtypes:1024k_essentia_storage_part` [crafting_shaped] minecraft:gold_block, refinedstorage:improved_processor, refinedtypes:256k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_part
- **stepcrafter** (6): `recipe:stepcrafter:slot_upgrade` [crafting_shaped] minecraft:chest, refinedstorage:quartz_enriched_iron, refinedstorage:upgrade → stepcrafter:slot_upgrade · `recipe:stepcrafter:step_crafter` [crafting_shaped] refinedstorage:advanced_processor, refinedstorage:autocrafter, refinedstorage:construction_core … → stepcrafter:step_crafter
- **refinedstorage_quartz_arsenal** (2): `recipe:refinedstorage_quartz_arsenal:wireless_crafting_grid` [crafting_shaped] #c:ender_pearls, #refinedstorage:crafting_grids, refinedstorage:advanced_processor … → refinedstorage_quartz_arsenal:wireless_crafting_grid · `recipe:universalgrid:wireless_universal_grid` [crafting_shaped] minecraft:diamond, refinedstorage:quartz_enriched_iron, refinedstorage:wireless_autocrafting_monitor … → universalgrid:wireless_universal_grid
- **occultism** (2): `recipe:allthemods:meteoric_infusion/inf_disk` [ritual] refinedstorage:storage_housing, refinedtypes:infinite_energy_storage_part, energizedpower:superconductor … → refinedtypes:infinite_energy_storage_disk · `recipe:allthemods:meteoric_infusion/inf_block` [ritual] refinedstorage:machine_casing, refinedtypes:infinite_energy_storage_part, energizedpower:superconductor … → refinedtypes:infinite_energy_storage_block
- **mysticalagriculture** (1): `recipe:mysticalagriculture:essence/refinedstorage/quartz_enriched_iron_ingot` [crafting_shaped] mysticalagriculture:quartz_enriched_iron_essence → refinedstorage:quartz_enriched_iron
- **enderio** (1): `recipe:enderio:rs_conduit` [crafting_shaped] #refinedstorage:cables, enderio:conduit_binder → enderio:conduit
- **logisticsnetworks** (1): `recipe:logisticsnetworks:network_upgrade_refinedstorage` [crafting_shaped] #refinedstorage:cables, minecraft:clay, refinedstorage:interface … → logisticsnetworks:network_upgrade
- **productivebees** (1): `recipe:productivebees:centrifuge/refinedstorage/honeycomb_quartz_enriched_iron` [centrifuge] productivebees:configurable_honeycomb → productivebees:wax, refinedstorage:quartz_enriched_iron
- **refinedfluidsubstitution** (1): `recipe:refinedfluidsubstitution:fluid_substitution_pattern` [crafting_shaped] minecraft:bucket, refinedstorage:pattern → refinedfluidsubstitution:fluid_substitution_pattern
- **universalgrid** (1): `recipe:universalgrid:wireless_universal_grid` [crafting_shaped] minecraft:diamond, refinedstorage:quartz_enriched_iron, refinedstorage:wireless_autocrafting_monitor … → universalgrid:wireless_universal_grid

## refinedstorage_quartz_arsenal — Refined Storage - Quartz Arsenal (2 партнерів)

- **refinedstorage** (2): `recipe:refinedstorage_quartz_arsenal:wireless_crafting_grid` [crafting_shaped] #c:ender_pearls, #refinedstorage:crafting_grids, refinedstorage:advanced_processor … → refinedstorage_quartz_arsenal:wireless_crafting_grid · `recipe:universalgrid:wireless_universal_grid` [crafting_shaped] minecraft:diamond, refinedstorage:quartz_enriched_iron, refinedstorage:wireless_autocrafting_monitor … → universalgrid:wireless_universal_grid
- **universalgrid** (1): `recipe:universalgrid:wireless_universal_grid` [crafting_shaped] minecraft:diamond, refinedstorage:quartz_enriched_iron, refinedstorage:wireless_autocrafting_monitor … → universalgrid:wireless_universal_grid

## refinedtypes — Refined Types (5 партнерів)

- **refinedstorage** (66): `recipe:refinedtypes:1024k_essentia_storage_block` [crafting_shaped] #c:dusts/redstone, refinedstorage:machine_casing, refinedtypes:1024k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_block · `recipe:refinedtypes:1024k_essentia_storage_block_upgrade` [storage_container_upgrade] refinedtypes:1024k_essentia_storage_part, refinedtypes:256k_essentia_storage_block, refinedtypes:64k_essentia_storage_block → refinedtypes:1024k_essentia_storage_block
- **energizedpower** (28): `recipe:kjs:mods/refined_storage/refined_types.js#L5` [crafting_shaped] refinedstorage:quartz_enriched_copper, energizedpower:advanced_circuit, refinedstorage:quartz_enriched_iron … → refinedtypes:64k_energy_storage_part · `recipe:kjs:mods/refined_storage/refined_types.js#L18` [crafting_shaped] refinedstorage:construction_core, refinedstorage:interface, refinedstorage:advanced_processor … → refinedtypes:network_energizer
- **thaumaturge** (17): `recipe:refinedtypes:1024k_essentia_storage_block` [crafting_shaped] #c:dusts/redstone, refinedstorage:machine_casing, refinedtypes:1024k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_block · `recipe:refinedtypes:1024k_essentia_storage_part` [crafting_shaped] minecraft:gold_block, refinedstorage:improved_processor, refinedtypes:256k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_part
- **occultism** (3): `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part · `recipe:allthemods:meteoric_infusion/inf_disk` [ritual] refinedstorage:storage_housing, refinedtypes:infinite_energy_storage_part, energizedpower:superconductor … → refinedtypes:infinite_energy_storage_disk
- **cabletiers** (1): `recipe:allthemods:meteoric_infusion/inf_part` [ritual] energizedpower:elite_upgrade_module, refinedtypes:8388608k_energy_storage_part, cabletiers:mega_interface … → refinedtypes:infinite_energy_storage_part

## regions_unexplored — Regions Unexplored (3 партнерів)

- **agritechevolved** (78): `recipe:agritechevolved:planter/crop/regions_unexplored/alpha_dandelion` [crop] #agritechevolved:tree_soils, regions_unexplored:alpha_dandelion → regions_unexplored:alpha_dandelion · `recipe:agritechevolved:planter/crop/regions_unexplored/alpha_rose` [crop] #agritechevolved:tree_soils, regions_unexplored:alpha_rose → regions_unexplored:alpha_rose
- **productivebees** (44): `recipe:productivebees:expansion_boxes/expansion_box_regions_unexplored_baobab` [crafting_shaped] #c:honeycombs, regions_unexplored:baobab_planks → productivebees:expansion_box_regions_unexplored_baobab · `recipe:productivebees:expansion_boxes/expansion_box_regions_unexplored_blackwood` [crafting_shaped] #c:honeycombs, regions_unexplored:blackwood_planks → productivebees:expansion_box_regions_unexplored_blackwood
- **mysticalagriculture** (23): `recipe:allthemods:essence/regions_unexplored/alpha_log` [crafting_shaped] mysticalagriculture:unexplored_wood_essence → regions_unexplored:alpha_log · `recipe:allthemods:essence/regions_unexplored/ashen_log` [crafting_shaped] mysticalagriculture:unexplored_wood_essence → regions_unexplored:ashen_log

## reliquary — Reliquary Reincarnations (5 партнерів)

- **allthemodium** (1): `recipe:allthemods:mysticalagriculture/awakening/fertile_lily_pad` [awakening] mysticalagriculture:air_essence, mysticalagriculture:earth_essence, mysticalagriculture:water_essence … → reliquary:fertile_lily_pad
- **mysticalagriculture** (1): `recipe:allthemods:mysticalagriculture/awakening/fertile_lily_pad` [awakening] mysticalagriculture:air_essence, mysticalagriculture:earth_essence, mysticalagriculture:water_essence … → reliquary:fertile_lily_pad
- **hostilenetworks** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul
- **mysticalagradditions** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul
- **productivebees** (1): `recipe:allthemods:mysticalagradditions/withering_soul` [crafting_shaped] productivebees:configurable_comb, hostilenetworks:prediction, reliquary:witherless_rose … → mysticalagradditions:withering_soul

## routers — BBL Routers (1 партнерів)

- **thaumaturge** (5): `recipe:routers:essentia_upgrade_1` [crafting_shaped] #c:ingots/iron, thaumaturge:ingot_thaumium, thaumaturge:nugget_thaumium → routers:essentia_upgrade_1 · `recipe:routers:essentia_upgrade_2` [crafting_shaped] #c:ingots/gold, routers:essentia_upgrade_1, thaumaturge:nugget_thaumium → routers:essentia_upgrade_2

## sgearmetalworks — Silent Gear Metalworks (3 партнерів)

- **productivemetalworks** (178): `recipe:productivemetalworks:alloying/molten_azure_electrum` [fluid_alloying] #c:molten_azure_silver, #c:molten_ender, #c:molten_gold → sgearmetalworks:molten_azure_electrum · `recipe:productivemetalworks:alloying/molten_blaze_gold` [fluid_alloying] #c:molten_blaze, #c:molten_gold → sgearmetalworks:molten_blaze_gold
- **silentgear** (103): `recipe:sgearmetalworks:casting/arrow_cast` [item_casting] #c:molten_steel, silentgear:arrow_heads → sgearmetalworks:arrow_cast · `recipe:sgearmetalworks:casting/axe_cast` [item_casting] #c:molten_steel, silentgear:axe_head → sgearmetalworks:axe_cast
- **geore** (6): `recipe:productivemetalworks:melting/geore/ruby_block` [item_melting] geore:ruby_block → sgearmetalworks:molten_ruby · `recipe:productivemetalworks:melting/geore/ruby_shard` [item_melting] geore:ruby_shard → sgearmetalworks:molten_ruby

## silentgear — Silent Gear (9 партнерів)

- **sgearmetalworks** (103): `recipe:sgearmetalworks:casting/arrow_cast` [item_casting] #c:molten_steel, silentgear:arrow_heads → sgearmetalworks:arrow_cast · `recipe:sgearmetalworks:casting/axe_cast` [item_casting] #c:molten_steel, silentgear:axe_head → sgearmetalworks:axe_cast
- **productivemetalworks** (88): `recipe:productivemetalworks:casting/ingots/silentgear/azure_electrum` [item_casting] #c:molten_azure_electrum, productivemetalworks:ingot_cast → silentgear:azure_electrum_ingot · `recipe:productivemetalworks:casting/ingots/silentgear/azure_silver` [item_casting] #c:molten_azure_silver, productivemetalworks:ingot_cast → silentgear:azure_silver_ingot
- **enderio** (10): `recipe:kubejs:sag_milling/raw_crimson_iron` [sag_milling] #c:raw_materials/crimson_iron → silentgear:crimson_iron_dust · `recipe:kubejs:sag_milling/crimson_iron_ore` [sag_milling] #c:ores/crimson_iron → silentgear:raw_crimson_iron, minecraft:cobblestone
- **alltheores** (6): `recipe:alltheores:processing/ore_hammer/azure_electrum_dust_from_ingot` [crafting_shapeless] #c:ingots/azure_electrum, #alltheores:ore_hammers → silentgear:azure_electrum_dust · `recipe:alltheores:processing/ore_hammer/azure_silver_dust_from_ingot` [crafting_shapeless] #c:ingots/azure_silver, #alltheores:ore_hammers → silentgear:azure_silver_dust
- **agritechevolved** (3): `recipe:agritechevolved:planter/crop/silentgear/flax_seeds` [crop] #agritechevolved:farmland_soils, silentgear:flax_seeds → silentgear:flax_fiber, silentgear:flax_flowers · `recipe:agritechevolved:planter/crop/silentgear/fluffy_seeds` [crop] #agritechevolved:farmland_soils, silentgear:fluffy_seeds → silentgear:fluffy_puff, silentgear:fluffy_seeds
- **mysticalagriculture** (2): `recipe:kubejs:mysticalagriculture/azure_silver_essence_crafting` [crafting_shaped] mysticalagriculture:azure_silver_essence → silentgear:azure_silver_ingot · `recipe:kubejs:mysticalagriculture/crimson_iron_essence_crafting` [crafting_shaped] mysticalagriculture:crimson_iron_essence → silentgear:crimson_iron_ingot
- **farmingforblockheads** (2): `recipe:kjs:mods/silentgear/recipes.js#L5` [market]  → silentgear:fluffy_seeds · `recipe:kjs:mods/silentgear/recipes.js#L15` [market]  → silentgear:flax_seeds
- **integrateddynamics** (1): `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.5` [mechanical_squeezer] #c:ores/bort → silentgear:bort
- **theurgy** (1): `recipe:kjs:mods/theurgy/incubation.js#L17.4` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:bort_sulfur → silentgear:bort

## silentgems — Silent's Gems (2 партнерів)

- **productivemetalworks** (42): `recipe:productivemetalworks:casting/gems/alexandrite` [item_casting] #c:molten_alexandrite, productivemetalworks:gem_cast → silentgems:alexandrite · `recipe:productivemetalworks:casting/gems/ammolite` [item_casting] #c:molten_ammolite, productivemetalworks:gem_cast → silentgems:ammolite
- **agritechevolved** (21): `recipe:agritechevolved:planter/crop/silentgems/alexandrite_glowrose` [crop] #agritechevolved:tree_soils, silentgems:alexandrite_glowrose → silentgems:alexandrite_glowrose · `recipe:agritechevolved:planter/crop/silentgems/ammolite_glowrose` [crop] #agritechevolved:tree_soils, silentgems:ammolite_glowrose → silentgems:ammolite_glowrose

## sophisticatedbackpacks — Sophisticated Backpacks (2 партнерів)

- **sophisticatedstorage** (64): `recipe:sophisticatedstorage:backpack_advanced_alchemy_upgrade_from_storage_advanced_alchemy_upgrade` [crafting_shaped] #c:leathers, #c:strings, sophisticatedstorage:advanced_alchemy_upgrade → sophisticatedbackpacks:advanced_alchemy_upgrade · `recipe:sophisticatedstorage:backpack_advanced_compacting_upgrade_from_storage_advanced_compacting_upgrade` [crafting_shaped] #c:leathers, #c:strings, sophisticatedstorage:advanced_compacting_upgrade → sophisticatedbackpacks:advanced_compacting_upgrade
- **sophisticatedcore** (22): `recipe:sophisticatedbackpacks:advanced_alchemy_upgrade` [upgrade_next_tier] #c:dusts/redstone, #c:gems/diamond, #c:ingots/gold … → sophisticatedbackpacks:advanced_alchemy_upgrade · `recipe:sophisticatedbackpacks:advanced_compacting_upgrade` [upgrade_next_tier] #c:dusts/redstone, #c:gems/diamond, #c:ingots/gold … → sophisticatedbackpacks:advanced_compacting_upgrade

## sophisticatedcore — Sophisticated Core (2 партнерів)

- **sophisticatedbackpacks** (22): `recipe:sophisticatedbackpacks:advanced_alchemy_upgrade` [upgrade_next_tier] #c:dusts/redstone, #c:gems/diamond, #c:ingots/gold … → sophisticatedbackpacks:advanced_alchemy_upgrade · `recipe:sophisticatedbackpacks:advanced_compacting_upgrade` [upgrade_next_tier] #c:dusts/redstone, #c:gems/diamond, #c:ingots/gold … → sophisticatedbackpacks:advanced_compacting_upgrade
- **sophisticatedstorage** (14): `recipe:sophisticatedstorage:advanced_alchemy_upgrade` [upgrade_next_tier] #c:dusts/redstone, #c:gems/diamond, #c:ingots/gold … → sophisticatedstorage:advanced_alchemy_upgrade · `recipe:sophisticatedstorage:advanced_compacting_upgrade` [upgrade_next_tier] #c:dusts/redstone, #c:gems/diamond, #c:ingots/gold … → sophisticatedstorage:advanced_compacting_upgrade

## sophisticatedstorage — Sophisticated Storage (3 партнерів)

- **sophisticatedstorageinmotion** (106): `recipe:sophisticatedstorageinmotion:acacia_storage_boat` [moving_storage_from_storage] #sophisticatedstorage:all_storage, minecraft:acacia_boat → sophisticatedstorageinmotion:storage_boat · `recipe:sophisticatedstorageinmotion:acacia_storage_boat_from_vanilla` [crafting_shapeless] minecraft:acacia_chest_boat, minecraft:redstone_torch → sophisticatedstorage:chest, sophisticatedstorageinmotion:storage_boat
- **sophisticatedbackpacks** (64): `recipe:sophisticatedstorage:backpack_advanced_alchemy_upgrade_from_storage_advanced_alchemy_upgrade` [crafting_shaped] #c:leathers, #c:strings, sophisticatedstorage:advanced_alchemy_upgrade → sophisticatedbackpacks:advanced_alchemy_upgrade · `recipe:sophisticatedstorage:backpack_advanced_compacting_upgrade_from_storage_advanced_compacting_upgrade` [crafting_shaped] #c:leathers, #c:strings, sophisticatedstorage:advanced_compacting_upgrade → sophisticatedbackpacks:advanced_compacting_upgrade
- **sophisticatedcore** (14): `recipe:sophisticatedstorage:advanced_alchemy_upgrade` [upgrade_next_tier] #c:dusts/redstone, #c:gems/diamond, #c:ingots/gold … → sophisticatedstorage:advanced_alchemy_upgrade · `recipe:sophisticatedstorage:advanced_compacting_upgrade` [upgrade_next_tier] #c:dusts/redstone, #c:gems/diamond, #c:ingots/gold … → sophisticatedstorage:advanced_compacting_upgrade

## sophisticatedstorageinmotion — Sophisticated Storage In Motion (1 партнерів)

- **sophisticatedstorage** (106): `recipe:sophisticatedstorageinmotion:acacia_storage_boat` [moving_storage_from_storage] #sophisticatedstorage:all_storage, minecraft:acacia_boat → sophisticatedstorageinmotion:storage_boat · `recipe:sophisticatedstorageinmotion:acacia_storage_boat_from_vanilla` [crafting_shapeless] minecraft:acacia_chest_boat, minecraft:redstone_torch → sophisticatedstorage:chest, sophisticatedstorageinmotion:storage_boat

## stepcrafter — Step Crafter (1 партнерів)

- **refinedstorage** (6): `recipe:stepcrafter:slot_upgrade` [crafting_shaped] minecraft:chest, refinedstorage:quartz_enriched_iron, refinedstorage:upgrade → stepcrafter:slot_upgrade · `recipe:stepcrafter:step_crafter` [crafting_shaped] refinedstorage:advanced_processor, refinedstorage:autocrafter, refinedstorage:construction_core … → stepcrafter:step_crafter

## strainers — BBL Strainers (2 партнерів)

- **bblcore** (74): `recipe:strainers:copper_mesh` [shaped_component_copy] #c:ingots/copper, strainers:flint_mesh → strainers:copper_mesh · `recipe:strainers:diamond_mesh` [shaped_component_copy] #c:gems/diamond, strainers:gold_mesh → strainers:diamond_mesh
- **allthemodium** (1): `recipe:kjs:mods/bbl_strainers/meshes.js#L8` [shaped_component_copy] minecraft:enchantments, allthemodium:allthemodium_ingot, strainers:netherite_mesh → kubejs:allthemodium_mesh

## thaumaturge — Thaumaturge (6 партнерів)

- **appliedthaumaturge** (25): `recipe:appliedthaumaturge:arcane_workbench/arcane_inscriber` [arcane_workbench_shapeless] ae2:engineering_processor, ae2:pattern_encoding_terminal, appliedthaumaturge:arcane_inscriber … → appliedthaumaturge:arcane_inscriber · `recipe:appliedthaumaturge:arcane_workbench/arcane_terminal` [arcane_workbench_shapeless] ae2:calculation_processor, ae2:terminal, appliedthaumaturge:arcane_terminal … → appliedthaumaturge:arcane_terminal
- **ae2** (23): `recipe:appliedthaumaturge:arcane_workbench/arcane_inscriber` [arcane_workbench_shapeless] ae2:engineering_processor, ae2:pattern_encoding_terminal, appliedthaumaturge:arcane_inscriber … → appliedthaumaturge:arcane_inscriber · `recipe:appliedthaumaturge:arcane_workbench/arcane_terminal` [arcane_workbench_shapeless] ae2:calculation_processor, ae2:terminal, appliedthaumaturge:arcane_terminal … → appliedthaumaturge:arcane_terminal
- **refinedtypes** (17): `recipe:refinedtypes:1024k_essentia_storage_block` [crafting_shaped] #c:dusts/redstone, refinedstorage:machine_casing, refinedtypes:1024k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_block · `recipe:refinedtypes:1024k_essentia_storage_part` [crafting_shaped] minecraft:gold_block, refinedstorage:improved_processor, refinedtypes:256k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_part
- **refinedstorage** (16): `recipe:refinedtypes:1024k_essentia_storage_block` [crafting_shaped] #c:dusts/redstone, refinedstorage:machine_casing, refinedtypes:1024k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_block · `recipe:refinedtypes:1024k_essentia_storage_part` [crafting_shaped] minecraft:gold_block, refinedstorage:improved_processor, refinedtypes:256k_essentia_storage_part … → refinedtypes:1024k_essentia_storage_part
- **routers** (5): `recipe:routers:essentia_upgrade_1` [crafting_shaped] #c:ingots/iron, thaumaturge:ingot_thaumium, thaumaturge:nugget_thaumium → routers:essentia_upgrade_1 · `recipe:routers:essentia_upgrade_2` [crafting_shaped] #c:ingots/gold, routers:essentia_upgrade_1, thaumaturge:nugget_thaumium → routers:essentia_upgrade_2
- **witchery** (2): `recipe:witchery:ritual/blocks_below_amber` [ritual] minecraft:blaze_powder, minecraft:ender_pearl, thaumaturge:amber … →  · `recipe:witchery:ritual/blocks_below_cinnabar` [ritual] minecraft:blaze_powder, minecraft:ender_pearl, thaumaturge:ore_cinnabar … → 

## theurgy — Theurgy (6 партнерів)

- **forbidden_arcanus** (5): `recipe:kjs:mods/theurgy/incubation.js#L17` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:arcane_sulfur → forbidden_arcanus:arcane_crystal · `recipe:kjs:mods/theurgy/incubation.js#L17.2` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:runic_sulfur → forbidden_arcanus:rune
- **mysticalagriculture** (2): `recipe:kjs:mods/theurgy/incubation.js#L17.6` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:prosperity_sulfur → mysticalagriculture:prosperity_shard · `recipe:kjs:mods/theurgy/liquefaction.js#L81.6` [liquefaction] kubejs:prosperity_sulfur, mysticalagriculture:prosperity_shard, theurgy:sal_ammoniac → 
- **alltheores** (2): `recipe:kjs:mods/theurgy/incubation.js#L17.7` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:salt_sulfur → alltheores:salt_dust · `recipe:kjs:mods/theurgy/incubation.js#L17.8` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:sulfur_sulfur → alltheores:sulfur_dust
- **integrateddynamics** (1): `recipe:kjs:mods/integrateddynamics/squeezer.js#L8.12` [mechanical_squeezer] #c:ores/sal_ammoniac → theurgy:sal_ammoniac_crystal
- **silentgear** (1): `recipe:kjs:mods/theurgy/incubation.js#L17.4` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:bort_sulfur → silentgear:bort
- **occultism** (1): `recipe:kjs:mods/theurgy/incubation.js#L17.5` [incubation] theurgy:mercury_shard, theurgy:alchemical_salt_mineral, kubejs:iesnium_sulfur → occultism:iesnium_ingot

## universalgrid — Universal Grid (2 партнерів)

- **refinedstorage** (1): `recipe:universalgrid:wireless_universal_grid` [crafting_shaped] minecraft:diamond, refinedstorage:quartz_enriched_iron, refinedstorage:wireless_autocrafting_monitor … → universalgrid:wireless_universal_grid
- **refinedstorage_quartz_arsenal** (1): `recipe:universalgrid:wireless_universal_grid` [crafting_shaped] minecraft:diamond, refinedstorage:quartz_enriched_iron, refinedstorage:wireless_autocrafting_monitor … → universalgrid:wireless_universal_grid

## utilitarian — Utilitarian (1 партнерів)

- **functionalstorage** (2): `recipe:kjs:mods/functionalstorage/compacting_recipe.js#L4` [custom_compacting] minecraft:charcoal, utilitarian:tiny_charcoal →  · `recipe:kjs:mods/functionalstorage/compacting_recipe.js#L4.2` [custom_compacting] minecraft:coal, utilitarian:tiny_coal → 

## waystones — Waystones (4 партнерів)

- **energizedpower** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand
- **geore** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand
- **neovitae** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand
- **occultism** (1): `recipe:allthemods:crystalline_infusion/perfect_crystalline_wand` [ritual] kubejs:crystalline_wand, geore:budding_allthemodium, occultism:book_of_binding_bound_foliot … → kubejs:perfected_crystalline_wand

## witchery — Witchery (2 партнерів)

- **thaumaturge** (2): `recipe:witchery:ritual/blocks_below_amber` [ritual] minecraft:blaze_powder, minecraft:ender_pearl, thaumaturge:amber … →  · `recipe:witchery:ritual/blocks_below_cinnabar` [ritual] minecraft:blaze_powder, minecraft:ender_pearl, thaumaturge:ore_cinnabar … → 
- **neovitae** (1): `recipe:witchery:ritual/rite_of_bloodbinding` [ritual] #witchery:nether_star, neovitae:blood_pearl, neovitae:weak_blood_shard … → 

