// @ts-check
// Гібридний семантичний пошук (RAG) українською по базі путівника ATM11 (BM25 + укр. стемер + двомовні синоніми ATM11 + триграми)
// та інтеграція з живим десктопним мостом ATM11-Companion (http://127.0.0.1:8812).
import { buildPlayerContextPrompt } from './advisor.js';

const CFG_LS_KEY = 'atm11.assistant.cfg.v2';

/** Протестовані моделі для живих підказок у грі та розбору скріншотів F2. */
export const COMPANION_MODELS = [
  { id: 'deepseek-ai/DeepSeek-V4.1-Flash', group: 'Together AI (reasoning_effort: low)', label: '⚡ DeepSeek-V4.1-Flash (~0.6 с — за замовчуванням)', provider: 'together', reasoningEffort: 'low' },
  { id: 'deepseek-ai/DeepSeek-V4-Pro-0813', group: 'Together AI (reasoning_effort: low)', label: '🧠 DeepSeek-V4-Pro-0813 (~1.7 с)', provider: 'together', reasoningEffort: 'low' },
  { id: 'qwen/qwen-2.5-72b-instruct', group: 'OpenRouter', label: '🏆 Qwen 2.5 72B Instruct (~1.3 с)', provider: 'openrouter' },
  { id: 'deepseek/deepseek-v3.2', group: 'OpenRouter', label: '⚡ DeepSeek-V3.2 (~1.6 с)', provider: 'openrouter' },
  { id: 'deepseek/deepseek-chat', group: 'OpenRouter', label: '💡 DeepSeek-Chat (V3)', provider: 'openrouter' },
  { id: 'meta-llama/llama-3.3-70b-instruct', group: 'OpenRouter', label: '🦙 Llama-3.3-70B Instruct', provider: 'openrouter' },
];

export const COMPANION_VISION_MODELS = [
  { id: 'qwen/qwen2.5-vl-72b-instruct', label: '🏆 Qwen 2.5 VL 72B (~1.6 с — розбір скріншотів F2)' },
];

/** Перевірені реверс-інжинірингом факти та обмеження збірки ATM11 26.1.2 (KubeJS, конфіги, jar). */
export const PACK_FACTS = [
  {
    id: 'fact:atm_star',
    title: 'Чому не крафтиться ATM Star (Зірка ATM) у цій версії?',
    stage: 's7',
    href: '#/roadmap?node=tr_star',
    text: 'У поточній бета-версії ATM11 (Minecraft 26.1.2) фінальний рецепт ATM Star прив’язаний до зоряного вівтаря Modern Industrialization, але сам мод Modern Industrialization ще не портовано. З компонентів Зірки зараз активні лише: насіння вимірів, творча есенція (Mystical Agriculture) та стиснені блоки зірки Незеру 3x. Глава ATM Star у квестах прихована («NOT HERE YET»).',
  },
  {
    id: 'fact:quarryplus',
    title: 'Кар’єр QuarryPlus і чому не крафтиться Руйнівник чанків (adv_quarry)',
    stage: 's6',
    href: '#/mod/quarryplus',
    text: 'У ATM11 базовий кар’єр QuarryPlus (quarryplus:quarry) перенесено в ендгейм (етап 6): його рецепт у KubeJS потребує усемодію, унобтанієвого кайла, кайла зі сплаву затемнення (Just Dire Things), покращеного руйнівника JDT і двох «Покращень: продуктивність омега». А «Руйнівник чанків» (quarryplus:adv_quarry, покращений кар’єр) повністю вимкнено скриптом KubeJS remove("quarryplus:adv_quarry"). Для раннього автовидобутку використовуйте генератори Cobblegen Galore, сита BBL Strainers, GeOre, бджіл або Mystical Agriculture.',
  },
  {
    id: 'fact:steel',
    title: 'Як зробити сталь (Чому не крафтиться сталь MFFS та Oritech)',
    stage: 's2',
    href: '#/roadmap?node=te_first',
    text: 'Ручні рецепти сталі у верстаку для MFFS та Oritech у збірці прибрані уніфікацією KubeJS. Щоб отримати сталеві злитки (AllTheOres), використовуйте: 1) Піч для сплавів (Energized Power), 2) Плавильник сплавів (Ender IO), або 3) Коксову піч і домну (Railcraft Reborn). Сталеві шестерні та інструменти крафтяться зі сталі AllTheOres.',
  },
  {
    id: 'fact:atm_alloys',
    title: 'Як зробити сплави всемодію (Allthemodium / Vibranium / Unobtainium)',
    stage: 's6',
    href: '#/mod/powah',
    text: 'Вібранієво-усемодієвий сплав у поточній версії виготовляється лише у сфері заряджання Powah (потребує 1 млрд FE енергії). Інші рецепти ATM-сплавів у KubeJS розраховані на Ars Nouveau або Industrial Foregoing, яких у цій версії 26.1.2 ще немає.',
  },
  {
    id: 'fact:gadgets',
    title: 'Гірничі гаджети (Mining Gadgets) та Будівельні гаджети (Building Gadgets 2)',
    stage: 's5',
    href: '#/mod/mininggadgets',
    text: 'У ATM11 рецепти порожнього модуля покращення Mining Gadgets (mininggadgets:upgrade_empty) та будівельних гаджетів Building Gadgets 2 змінені через KubeJS і вимагають самородків усемодію (Allthemodium). Тому вони стають доступними лише на етапі 5 після виходу у виміри ATM. На старті для швидкого будівництва використовуйте будівельні палиці Construction Sticks (Ctrl+Z).',
  },
  {
    id: 'fact:keys_kuma_balm',
    title: 'Гарячі клавіші, конфлікти та краш Kuma API (Balm / Crafting Tweaks)',
    stage: 's0',
    href: '#/keys',
    text: 'Усі конфлікти клавіш у збірці виправлено планом перепризначень: ранець — Миша 4, Curios — Shift+Миша 4 (або Ctrl+G), двигун джетпака — Ctrl+Миша 4, квести — Ctrl+Q, термінал AE2 — Ctrl+E, сітка RS — Ctrl+R, пояс — Ctrl+V, шейдери Iris — F8/F10. Важливо: модам на бібліотеці Balm (Crafting Tweaks, Inventory Essentials, Waystones, Trash Slot, Cooking/Farming for Blockheads) НЕ можна призначати клавіші з модифікаторами Ctrl/Shift/Alt у options.txt, інакше гра падає при запуску зі StackOverflowError у NativeKeyModifierReconciler. Крім того, Crafting Tweaks у бета-версії 0.12.0 не показує кнопок біля сітки 3×3.',
  },
  {
    id: 'fact:magic_tweaks',
    title: 'Особливості магії ATM11 (Forbidden Arcanus, Occultism, Neo Vitae, Mahou Tsukai)',
    stage: 's3',
    href: '#/mods?cls=magic',
    text: 'Вічна Стелла (Кузня Гефеста 3 рівня) накладає незламність через ексклюзивний ритуал Occultism «Контакт Ронази» (misc_unbreakable) та кує інструменти зі сплавів ATM на Кузні 4 рівня. Ритуал Neo Vitae «Falling Tower» скидає метеорит AE2 та всі 22 руди GeOre (до унобтанію за 5 млн EV). Кристалічний вівтар насичення Occultism клонує диски AE2/RS 1→2. У Mahou Tsukai макс. мана 20 000, кап шкоди Калібурна/Морґана — 60.',
  },
  {
    id: 'fact:hidden_chapters',
    title: 'Приховані глави квестів та квести-заглушки (missing_item)',
    stage: 's1',
    href: '#/chapters',
    text: 'Частина глав у книзі квестів перенесена розробниками з ATM10 і позначена always_invisible (Create, Mekanism, Immersive Engineering, Modern Industrialization, Twilight Forest, Iron’s Spells, MEGA Cells). Цих модів ще немає на неофорджі 26.1.2, тому такі глави в грі не відкриваються, а окремі квести з їхніми предметами позначені на сайті як квести-заглушки.',
  },
];

/** Двомовне розширення запитів синонімами ATM11 для високої повноти пошуку українською. */
const CONCEPT_EXPANSIONS = [
  [/\b(що робити|куди далі|наступн\w* крок\w*|з чого почати|що далі|порад\w*|сейв\w*)\b/i, 'наступні кроки головний шлях стовбур початок етап квести'],
  [/\b(сховищ\w*|скрин\w*|інвентар\w*|зберіга\w*|рюкзак\w*|ран\w*|мішок|мереж\w*)\b/i, 'storage sophisticatedbackpacks sophisticatedstorage functionalstorage ae2 refinedstorage deepnull шухляди комірки термінал'],
  [/\b(енерг\w*|електрик\w*|генератор\w*|реактор\w*|fe|rf|живлен\w*|батаре\w*|заряд\w*)\b/i, 'energy powah generatorgalore energizedpower oritech enderio термогенератор сонячна панель реактор повах'],
  [/\b(труб\w*|логістик\w*|передава\w*|транспорт\w*|фільтр\w*|кабел\w*|маршрут\w*)\b/i, 'logistics pipez laserio modularrouters sfm enderthing classicpipes integratedtunnels'],
  [/\b(руд\w*|копат\w*|шахт\w*|видобу\w*|кар['’]?єр\w*|автовидобу\w*|сито|сита|ресурс\w*)\b/i, 'resources quarryplus mininggadgets cobblegengalore bblstrainers allthemodium geore mysticalagriculture productivebees'],
  [/\b(літат\w*|політ|польот\w*|джетпак\w*|крил\w*)\b/i, 'ironjetpacks pylons mysticalagriculture паливний джетпак ранець політ'],
  [/\b(магі\w*|ритуал\w*|дух\w*|алхімі\w*|заклинан\w*|відьм\w*|кров\w*|таум\w*)\b/i, 'magic occultism theurgy thaumaturge arsmagica neovitae evilcraft forbidden_arcanus witchery mahoutsukai'],
  [/\b(їж\w*|ферм\w*|город\w*|серц\w*|здоров['’]?я|моркв\w*|кухн\w*|бджол\w*|насін\w*)\b/i, 'farming productivefarming cookingforblockheads solcarrot mysticalagriculture productivebees'],
  [/\b(збро\w*|брон\w*|меч\w*|кайл\w*|інструмент\w*|зачарув\w*|самоцвіт\w*|апотеоз\w*)\b/i, 'gear silentgear apotheosis apothic_enchanting powerarmor allthemodium реліквії артефакти'],
  [/\b(бос\w*|дракон\w*|данж\w*|вимір\w*|портал\w*|ефір|незер\w*|енд\w*)\b/i, 'exploration boss dimension aether undergarden allthemodium iceandfire'],
  [/\b(клавіш\w*|кнопк\w*|хотке\w*|гаряч\w*|конфлікт\w*|управлін\w*|options\.txt)\b/i, 'keys клавіші конфлікт перепризначення миша ctrl shift alt'],
  [/\b(не крафт\w*|не працю\w*|вимкнен\w*|заблокован\w*|чому не|краш\w*|помилк\w*)\b/i, 'fact kubejs прибрано неактивний заглушка сталь кар’єр зірка'],
  [/\b(сталь\w*|сталев\w*|steel)\b/i, 'fact:steel сталь сплав піч домна energizedpower enderio railcraft mffs oritech'],
  [/\b(зірк\w*|atm star|ендгейм\w*)\b/i, 'fact:atm_star tr_star зірка атм усемодій вібраній унобтаній творча есенція'],
];

/** Простий український/англійський стемер для токенізації пошуку. @param {string} w */
function stemUk(w) {
  if (w.length <= 3) return w;
  return w.replace(/(ями|ами|ові|еві|ього|ому|им|ім|их|іх|ість|ості|ння|ття|увати|ювати|ати|яти|ити|іти|ою|єю|ах|ях|ів|їв|ей|ам|ям|ом|ем|а|я|о|е|и|і|у|ю|ї|й)$/, '') || w.slice(0, 3);
}

/** Розбиває текст на нормалізовані токени та стеми. @param {string} text */
function tokenize(text) {
  const raw = (text || '').toLowerCase().replace(/['’`]/g, '').match(/[a-zа-яіїєґ0-9_]+/g) || [];
  const out = [];
  for (const w of raw) {
    if (w.length < 2) continue;
    out.push(w);
    const st = stemUk(w);
    if (st.length >= 3 && st !== w) out.push(st);
  }
  return out;
}

/** Будує розріджений вектор символьних 3-грам для нечіткого збігу. @param {string} text */
function trigramMap(text) {
  const s = ` ${text.toLowerCase().replace(/[^a-zа-яіїєґ0-9]+/g, ' ').trim()} `;
  /** @type {Map<string, number>} */
  const m = new Map();
  for (let i = 0; i <= s.length - 3; i++) {
    const g = s.slice(i, i + 3);
    m.set(g, (m.get(g) || 0) + 1);
  }
  let norm = 0;
  for (const v of m.values()) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  for (const [k, v] of m.entries()) m.set(k, v / norm);
  return m;
}

/** @param {Map<string, number>} a @param {Map<string, number>} b */
function trigramCosine(a, b) {
  let dot = 0;
  const [sm, lg] = a.size < b.size ? [a, b] : [b, a];
  for (const [k, v] of sm.entries()) {
    const bv = lg.get(k);
    if (bv) dot += v * bv;
  }
  return dot;
}

/** @typedef {{ id: string, kind: 'fact'|'node'|'mod'|'branch'|'chapter'|'key', title: string, stage?: string, href: string, badge: string, text: string, searchText: string, tokens: string[], tf: Map<string, number>, trigrams: Map<string, number>, mods?: string[], nodeId?: string }} RagDoc */

/** @type {RagDoc[] | null} */
let cachedCorpus = null;

/** Формує пошуковий корпус з усіх розділів путівника. @param {Store} s @returns {RagDoc[]} */
export function buildCorpus(s) {
  if (cachedCorpus) return cachedCorpus;
  /** @type {RagDoc[]} */
  const docs = [];
  const add = (/** @type {Omit<RagDoc, 'tokens'|'tf'|'trigrams'>} */ d) => {
    const tokens = tokenize(d.searchText);
    const tf = new Map();
    for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
    docs.push({ ...d, tokens, tf, trigrams: trigramMap(d.title + ' ' + d.text) });
  };

  for (const f of PACK_FACTS) {
    add({
      id: f.id, kind: 'fact', title: f.title, stage: f.stage, href: f.href,
      badge: '⚡ Особливість збірки', text: f.text, searchText: `${f.title} ${f.text}`,
    });
  }

  for (const n of s.roadmap.nodes || []) {
    const st = s.stageById.get(n.stage);
    const modNames = (n.mods || []).map((id) => s.modById.get(id)?.name || id).join(', ');
    const itemNames = (n.icons || []).map((id) => s.items[id]?.uk || s.items[id]?.en || id).join(', ');
    const dbQuests = (n.done_by?.quests || []).map((qid) => s.roadmap.quest_info?.[qid]?.title || qid).join(', ');
    const dbItems = (n.done_by?.items || []).map((iid) => s.items[iid]?.uk || iid).join(', ');
    const extra = [
      modNames ? `Моди: ${modNames}.` : '',
      itemNames ? `Ключові предмети: ${itemNames}.` : '',
      dbQuests ? `Квести для виконання: ${dbQuests}.` : '',
      dbItems ? `Предмети умови: ${dbItems}.` : '',
    ].filter(Boolean).join(' ');
    add({
      id: `node:${n.id}`, kind: 'node', nodeId: n.id,
      title: `${n.title} (${st ? `Етап ${st.n}: ${st.title}` : n.stage})`,
      stage: n.stage, href: `#/roadmap?node=${n.id}`,
      badge: n.trunk ? '⭐ Віха стовбура' : '🗺 Віха карти',
      text: `${n.text} ${extra}`.trim(),
      searchText: `${n.title} ${n.id} ${n.lane} ${n.text} ${extra} ${(n.mods || []).join(' ')}`,
      mods: n.mods,
    });
  }

  for (const m of s.mods || []) {
    if (!m.uk && m.role !== 'content' && m.role !== 'addon') continue;
    const clsTitles = (m.cls || []).map((c) => s.classById.get(c)?.title || c).join(', ');
    const whatTxt = (m.what || []).length ? `Можливості: ${m.what.join('; ')}.` : '';
    const tipsTxt = (m.tips || []).length ? `Поради: ${m.tips.join(' ')}` : '';
    const synTxt = (m.synergy || []).length ? `Синергія: ${m.synergy.map((x) => `${s.modById.get(x.mod)?.name || x.mod} (${x.why})`).join('; ')}.` : '';
    const dimsTxt = (m.dims || []).length ? `Виміри: ${m.dims.map((d) => d.name).join(', ')}.` : '';
    const body = [m.uk || m.desc_en || '', whatTxt, tipsTxt, synTxt, dimsTxt, m.spoiler ? `Спойлер: ${m.spoiler}` : ''].filter(Boolean).join(' ');
    add({
      id: `mod:${m.id}`, kind: 'mod',
      title: `${m.name} (${clsTitles || m.role})`,
      stage: m.stage?.[0], href: `#/mod/${m.id}`,
      badge: m.auto ? '📦 Мод (авто)' : '📦 Довідник модів',
      text: body || `Мод ${m.name} (${m.id}).`,
      searchText: `${m.name} ${m.id} ${clsTitles} ${body} ${(m.icons || []).map((i) => s.items[i]?.uk || i).join(' ')}`,
      mods: [m.id],
    });
  }

  for (const b of s.branches || []) {
    const stepsTxt = (b.steps || []).map((/** @type {any} */ st, idx) => `${idx + 1}) ${st.title}: ${st.text}`).join(' ');
    add({
      id: `branch:${b.id}`, kind: 'branch',
      title: `Гілка «${b.title}»`,
      stage: b.enter, href: `#/branch/${b.id}`,
      badge: '🌿 Гілка',
      text: `${b.summary || ''} Дає: ${(b.gives || []).join(', ')}. Кроки: ${stepsTxt}`,
      searchText: `${b.title} ${b.id} ${b.summary || ''} ${(b.gives || []).join(' ')} ${stepsTxt}`,
      mods: b.mods,
    });
  }

  for (const c of s.chapters?.chapters || []) {
    const modNames = (c.mods || []).map((id) => s.modById.get(id)?.name || id).join(', ');
    const hidTxt = c.hidden ? `Прихована глава в грі (відсутні моди: ${(c.missing || []).join(', ') || 'не портовано'}).` : '';
    add({
      id: `chapter:${c.file}`, kind: 'chapter',
      title: `Глава квестів «${c.title}» (${c.quests} квестів)`,
      href: `#/chapter/${c.file}`,
      badge: '📜 Глава квестів',
      text: `${c.sub ? c.sub + '. ' : ''}Квестів: ${c.quests}. ${modNames ? `Моди: ${modNames}. ` : ''}${hidTxt}`.trim(),
      searchText: `${c.title} ${c.file} ${c.sub || ''} ${modNames} ${hidTxt}`,
      mods: c.mods,
    });
  }

  cachedCorpus = docs;
  return docs;
}

/** Виконує миттєвий гібридний пошук (BM25 + український стемер + двомовні синоніми ATM11 + триграми).
 * @param {Store} s @param {string} query @param {any} [analysis] @param {number} [topK] */
export async function searchGuide(s, query, analysis, topK = 8) {
  const corpus = buildCorpus(s);
  let expanded = query || '';
  for (const [re, addWords] of CONCEPT_EXPANSIONS) {
    if (re.test(query)) expanded += ' ' + addWords;
  }
  const qTokens = tokenize(expanded);
  const qTrigrams = trigramMap(query);
  const N = corpus.length || 1;

  /** @type {Map<string, number>} */
  const idf = new Map();
  for (const qt of new Set(qTokens)) {
    let df = 0;
    for (const d of corpus) if (d.tf.has(qt)) df++;
    idf.set(qt, Math.log(1 + (N - df + 0.5) / (df + 0.5)));
  }

  const avgLen = corpus.reduce((acc, d) => acc + d.tokens.length, 0) / N || 40;
  const availIds = new Set((analysis?.availNodes || []).map((/** @type {any} */ x) => x.node.id));
  const curStageId = analysis?.currentStage?.id || 's0';

  const scored = [];
  for (const d of corpus) {
    let bm25 = 0;
    const dl = d.tokens.length || 1;
    for (const qt of qTokens) {
      const f = d.tf.get(qt) || 0;
      if (!f) continue;
      const w = idf.get(qt) || 0;
      bm25 += w * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (dl / avgLen))));
    }

    const qLower = query.trim().toLowerCase();
    const titleLower = d.title.toLowerCase();
    const titleBoost = qLower.length >= 2 && titleLower.includes(qLower) ? 4.5 : 0;
    const triSim = trigramCosine(qTrigrams, d.trigrams);

    let ctxBoost = 0;
    if (d.kind === 'fact' && bm25 > 1.2) ctxBoost += 1.8;
    if (d.nodeId && availIds.has(d.nodeId)) ctxBoost += 0.9;
    if (d.stage && d.stage === curStageId) ctxBoost += 0.4;

    const total = bm25 + titleBoost + triSim * 3.2 + ctxBoost;
    if (total > 0.45) {
      scored.push({ doc: d, score: total, triSim, bm25 });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/** Синтезує локальну структуровану відповідь українською мовою без зовнішнього API.
 * @param {string} query @param {Array<{ doc: RagDoc, score: number }>} hits @param {any} an @param {Store} _s */
export function composeLocalAnswer(query, hits, an, _s) {
  const q = (query || '').trim().toLowerCase();
  const lines = [];

  const asksNext = /(що робити|куди далі|наступн\w* крок|з чого почати|що далі|мій сейв|моєму світі)/i.test(q);
  if (asksNext || !q) {
    const p = an.world;
    lines.push(`### 🎯 План дій для світу «${p?.world || 'Новий світ'}» (${an.currentStage.icon} Етап ${an.currentStage.n}: ${an.currentStage.title})`);
    if (an.nextTrunk.length) {
      const nt = an.nextTrunk[0];
      lines.push(`1. **Головна віха стовбура зараз — «${nt.node.title}»** (${nt.stageDef?.title || nt.node.stage}): ${nt.node.text}`);
    }
    if (an.startedQuests.length) {
      lines.push(`2. **Незавершені квести у вашому сейві (${an.startedQuests.length}):**`);
      for (const sq of an.startedQuests.slice(0, 4)) {
        const left = sq.tasks.filter((/** @type {any} */ t) => !t.done).map((/** @type {any} */ t) => t.text).join(', ') || 'готово до здачі';
        lines.push(`   - **«${sq.title}»** (${sq.chapterTitle}) — залишилось: ${left}`);
      }
    }
    if (an.availNodes.length) {
      const topAvail = an.availNodes.filter((/** @type {any} */ x) => !x.node.trunk).slice(0, 4);
      if (topAvail.length) {
        lines.push(`3. **Відкриті гілки розвитку на поточному етапі:** ${topAvail.map((/** @type {any} */ x) => `**${x.node.title}** (${x.node.text.split('.')[0]})`).join('; ')}.`);
      }
    }
    if (!q) return lines.join('\n\n');
  }

  if (!hits.length) {
    lines.push(`За запитом **«${query}»** точних збігів не знайдено. Спробуйте інше формулювання (наприклад: *«де зберігати речі»*, *«перша енергія»*, *«як зробити сталь»*, *«клавіша ранця»*).`);
    return lines.join('\n\n');
  }

  const top = hits[0].doc;
  lines.push(`### 💡 Відповідь за базою путівника: ${top.title}`);
  lines.push(top.text);

  const moreFacts = hits.slice(1, 4).filter((h) => h.score >= hits[0].score * 0.45);
  if (moreFacts.length) {
    lines.push(`**Додатково з путівника:**`);
    for (const h of moreFacts) {
      lines.push(`- **${h.doc.title}** [${h.doc.badge}]: ${h.doc.text.slice(0, 260)}${h.doc.text.length > 260 ? '…' : ''}`);
    }
  }
  return lines.join('\n\n');
}

// ── Налаштування та виклик живого моста ATM11-Companion (:8812) ──
export function loadAssistantConfig() {
  try {
    const raw = JSON.parse(localStorage.getItem(CFG_LS_KEY) || '{}') || {};
    return {
      mode: raw.mode || 'local', // 'local' | 'bridge' | 'ollama'
      bridgeUrl: raw.bridgeUrl || 'http://127.0.0.1:8812',
      model: raw.model || 'deepseek-ai/DeepSeek-V4.1-Flash',
      visionModel: raw.visionModel || 'qwen/qwen2.5-vl-72b-instruct',
      ollamaUrl: raw.ollamaUrl || 'http://localhost:11434',
      ollamaModel: raw.ollamaModel || 'llama3.1:8b',
    };
  } catch {
    return {
      mode: 'local',
      bridgeUrl: 'http://127.0.0.1:8812',
      model: 'deepseek-ai/DeepSeek-V4.1-Flash',
      visionModel: 'qwen/qwen2.5-vl-72b-instruct',
      ollamaUrl: 'http://localhost:11434',
      ollamaModel: 'llama3.1:8b',
    };
  }
}

/** @param {Record<string, any>} cfg */
export function saveAssistantConfig(cfg) {
  try { localStorage.setItem(CFG_LS_KEY, JSON.stringify(cfg)); } catch {}
}

/** Запит до живого моста ATM11-Companion (:8812) або локальної Ollama.
 * @param {string} query @param {Array<{ doc: RagDoc, score: number }>} hits @param {any} an @param {Store} s @param {any} cfg @param {string} [logTail] */
export async function askExternalPipeline(query, hits, an, s, cfg, logTail = '') {
  const playerCtx = buildPlayerContextPrompt(s, an, logTail);
  const ragCtx = hits.slice(0, 6).map((h, i) => `[Джерело ${i + 1}: ${h.doc.title} (${h.doc.href})]\n${h.doc.text}`).join('\n\n');
  const sysPrompt = [
    'Ти — експертний ШІ-помічник українського інтерактивного путівника по збірці Minecraft All the Mods 11 (ATM11, версія гри 26.1.2).',
    'Відповідай ВИКЛЮЧНО українською мовою, лаконічно, точно і по суті, спираючись ТІЛЬКИ на наданий стан сейву гравця, словник ATM11-UA та витяги з бази путівника (KubeJS, конфіги, дорожня карта).',
    'Не вигадуй рецептів чи механік з інших версій ATM, якщо в путівнику сказано, що мод відсутній або рецепт змінено.',
  ].join('\n');
  const userPrompt = `${playerCtx}\n\n=== ЗНАЙДЕНІ ДАНІ ПУТІВНИКА (RAG) ===\n${ragCtx || 'Немає додаткових витягів.'}\n\n=== ЗАПИТАННЯ ГРАВЦЯ ===\n${query || 'Що мені робити далі за моїм сейвом?'}`;

  if (cfg.mode === 'bridge') {
    const base = (cfg.bridgeUrl || 'http://127.0.0.1:8812').replace(/\/$/, '');
    const r = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, systemPrompt: sysPrompt, userPrompt, model: cfg.model }),
    });
    if (!r.ok) throw new Error(`Міст ATM11-Companion повернув ${r.status}`);
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    return { answer: data.answer, provider: data.provider || `ATM11-Companion (${cfg.model})`, elapsedMs: data.elapsedMs };
  }

  if (cfg.mode === 'ollama') {
    const url = `${(cfg.ollamaUrl || 'http://localhost:11434').replace(/\/$/, '')}/api/chat`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: cfg.ollamaModel || 'llama3.1',
        messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
        stream: false,
      }),
    });
    if (!r.ok) throw new Error(`Ollama повернула ${r.status}`);
    const data = await r.json();
    const msg = (data.message?.content || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return { answer: msg, provider: `Ollama (${cfg.ollamaModel})` };
  }

  return { answer: composeLocalAnswer(query, hits, an, s), provider: 'Локальний радник + Гібридний RAG' };
}
