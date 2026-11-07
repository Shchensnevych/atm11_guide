// Типи даних сайту (для // @ts-check у VS Code). Джерело — tools/build_data.py.
interface ModEntry { id: string; name: string; version?: string; jar: string; authors?: string; url?: string; desc_en?: string;
  deps?: string[]; deps_opt?: string[]; counts?: Record<string, number>; uk_keys?: number; books?: string[]; guideme?: boolean; logo?: string | null;
  cls: string[]; role: string; auto: boolean; uk?: string; what?: string[]; synergy?: { mod: string; why: string; src?: string; ref?: string[]; ingame?: string; back?: boolean }[]; tips?: string[];
  spoiler?: string; stage?: string[]; parent?: string; chapter?: string; book?: string; branch?: string; ref?: string[]; ingame?: string;
  /** G6b: синергії інших модів з цим модом (mod — автор запису); item_ref — ref пунктів what / tips {поле: {індекс: ref}}; abs_ok — чому «лише / усі» доведено */
  synergy_in?: { mod: string; why: string; src?: string; ref?: string[]; ingame?: string; back?: boolean }[]; item_ref?: Record<string, Record<string, string | string[]>>; abs_ok?: string;
  features: string[];                       // dimension | boss | dungeon | biome | ores | mobs (авто з extract_mods → world, або вручну)
  dims?: { id: string; name: string }[];    // виміри мода (назви українською з перекладу)
  bosses?: string[]; icons?: string[]; verify?: boolean; }
interface ItemIcon { img: string; kind: 'item' | 'block' | 'approx'; uk?: string; en?: string; }
interface ClassDef { id: string; title: string; icon: string; color: string; desc: string; }
interface StageDef { id: string; n: number; title: string; icon: string; goal: string; exit: string; }
interface DoneBy { quests?: string[]; advancements?: string[]; items?: string[]; }
interface RoadNode { id: string; stage: string; lane: string; group?: string; trunk?: boolean; star?: boolean; title: string; text: string;
  icons?: string[]; mods?: string[]; features?: string[]; chapter?: string; spoiler?: boolean; verify?: boolean; book?: string; done_by?: DoneBy; na?: string; }
interface RoadEdge { from: string; to: string; kind: 'req' | 'syn' | 'opt' | string; label?: string; src?: string; ref?: string[]; }
interface RoadGroup { id: string; title: string; cls: string; mods?: string[]; desc?: string; }
interface WorldSummary { slug: string; world: string; folder: string; mode: string; mode_uk: string; last_played: string; last_played_ts: number;
  updated: string; play_hours: number; quests_done: number; quests_visible_done: number; quests_started: number; advancements_done: number; items_obtained: number; }
interface SlotItemEntry { id: string; uk: string; count: number; slot?: number | null; slotLabel: string; slotKind: string; ns: string; modName: string;
  customName?: string; durabilityPct?: number; armorSlot?: string; curiosSlot?: string; curiosSlotUk?: string; curiosIndex?: number;
  beltSlot?: number; bpTitle?: string; bpKey?: string; bpKind?: string; bpSlot?: number; bpWhere?: string; bpCapacity?: number; live?: boolean; }
interface PlayerSlotsData { mainHand?: SlotItemEntry | null; offHand?: SlotItemEntry | null; hotbar: SlotItemEntry[]; inventory: SlotItemEntry[];
  armor: SlotItemEntry[]; curios: SlotItemEntry[]; curiosTypes?: { id: string; uk: string; size: number }[];
  toolbelt: SlotItemEntry[]; toolbeltTools?: SlotItemEntry[]; backpacks: SlotItemEntry[]; enderChest: SlotItemEntry[]; }
interface ProgressData { slug: string; world: string; folder: string; default?: string; game_type: number; mode: string; mode_uk: string; last_played: string;
  last_played_ts: number; updated: string; play_hours: number; from_browser?: boolean;
  player: { uuid: string; name?: string; xp_level?: number; selected_slot?: number; health?: number; food_level?: number; pos?: number[]; dimension?: string; dimension_uk?: string; world_tier?: string; unique_foods?: number };
  quests: { done: string[]; done_visible: string[]; started: string[]; tasks_done: string[]; rewards_claimed?: number; by_chapter: Record<string, { done: string[]; started: string[] }> };
  advancements: { done: string[] };
  items: { obtained: string[]; crafted: Record<string, number>; inventory: Record<string, number>; names?: Record<string, string> };
  slots?: PlayerSlotsData;
  worlds?: WorldSummary[]; }
/** Огляд глави квестів (content/chapters/<файл>.json → data/guide.json). */
interface ChapterGuide { ov?: string; steps?: string[]; rewards?: string[]; atm?: string[]; why?: string; verify?: boolean; notes?: number }
interface FactEntry { id: string; title: string; text: string; href: string; stage?: string; mods?: string[]; ref?: string | string[] }
interface NamesDict { items?: Record<string, string[]>; entities?: Record<string, string[]>; keys?: Record<string, string[]>; books?: Record<string, string[]>; dims?: Record<string, string[]>; biomes?: Record<string, string[]> }
interface Store { mods: ModEntry[]; classes: ClassDef[]; roles: { id: string; title: string }[]; stages: StageDef[];
  roadmap: { lanes: string[]; groups?: RoadGroup[]; nodes: RoadNode[]; edges: RoadEdge[]; quest_info?: Record<string, { title: string; chapter: string }>; adv_info?: Record<string, { uk?: string; en?: string; hidden?: boolean }> };
  chapters: { groups: any[]; chapters: any[]; links: any[] }; guide: Record<string, ChapterGuide>; branches: any[]; facts: FactEntry[]; meta: any; items: Record<string, ItemIcon>;
  qicons: Set<string>; names?: NamesDict | null; progress?: ProgressData;
  modById: Map<string, ModEntry>; classById: Map<string, ClassDef>; stageById: Map<string, StageDef>; chapterByFile: Map<string, any>; dependents: Map<string, string[]>; }
// Вкладка «Клавіші» (data/keys.json, tools/build_keys.py): дія = прив'язка з options.txt + ручний шар content/keys.json
interface KeyAct { id: string; ns: string; mod?: string; name: string; en?: string; bind: string; m: '' | 'S' | 'C' | 'A';
  cat: string; ctx: 'game' | 'gui' | 'held' | 'vehicle' | 'debug' | string; scr?: string; nc?: boolean; soft?: boolean; imp?: boolean;
  note?: string; plan?: string; why?: string; was?: string; plan_done?: boolean; extra?: boolean; }
