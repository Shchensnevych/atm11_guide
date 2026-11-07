// @ts-check
// Пошук по базі путівника для автономного режиму #/assistant (BM25 + укр. стемер + словник понять + триграми)
// і запит до моста ATM11-Companion (http://127.0.0.1:8812) — єдиного «мозку» ШІ.

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

/** Двомовне розширення запитів синонімами ATM11 для високої повноти пошуку українською. @type {[RegExp, string][]} */
const CONCEPT_EXPANSIONS = [
  [/(?<![\p{L}\d])(що робити|куди далі|наступн\p{L}* крок\p{L}*|з чого почати|що далі|порад\p{L}*|сейв\p{L}*)(?![\p{L}\d])/iu, 'наступні кроки головний шлях стовбур початок етап квести'],
  [/(?<![\p{L}\d])(сховищ\p{L}*|скрин\p{L}*|інвентар\p{L}*|зберіга\p{L}*|рюкзак\p{L}*|ран\p{L}*|мішок|мереж\p{L}*)(?![\p{L}\d])/iu, 'storage sophisticatedbackpacks sophisticatedstorage functionalstorage ae2 refinedstorage deepnull шухляди комірки термінал'],
  [/(?<![\p{L}\d])(енерг\p{L}*|електрик\p{L}*|генератор\p{L}*|реактор\p{L}*|fe|rf|живлен\p{L}*|батаре\p{L}*|заряд\p{L}*)(?![\p{L}\d])/iu, 'energy powah generatorgalore energizedpower oritech enderio термогенератор сонячна панель реактор повах'],
  [/(?<![\p{L}\d])(труб\p{L}*|логістик\p{L}*|передава\p{L}*|транспорт\p{L}*|фільтр\p{L}*|кабел\p{L}*|маршрут\p{L}*)(?![\p{L}\d])/iu, 'logistics pipez laserio modularrouters sfm enderthing classicpipes integratedtunnels'],
  [/(?<![\p{L}\d])(руд\p{L}*|копат\p{L}*|шахт\p{L}*|видобу\p{L}*|кар['’]?єр\p{L}*|автовидобу\p{L}*|сито|сита|ресурс\p{L}*)(?![\p{L}\d])/iu, 'resources quarryplus mininggadgets cobblegengalore bblstrainers allthemodium geore mysticalagriculture productivebees'],
  [/(?<![\p{L}\d])(літат\p{L}*|політ|польот\p{L}*|джетпак\p{L}*|крил\p{L}*)(?![\p{L}\d])/iu, 'ironjetpacks pylons mysticalagriculture паливний джетпак ранець політ'],
  [/(?<![\p{L}\d])(магі\p{L}*|ритуал\p{L}*|дух\p{L}*|алхімі\p{L}*|заклинан\p{L}*|відьм\p{L}*|кров\p{L}*|таум\p{L}*)(?![\p{L}\d])/iu, 'magic occultism theurgy thaumaturge arsmagica neovitae evilcraft forbidden_arcanus witchery mahoutsukai'],
  [/(?<![\p{L}\d])(їж\p{L}*|ферм\p{L}*|город\p{L}*|серц\p{L}*|здоров['’]?я|моркв\p{L}*|кухн\p{L}*|бджол\p{L}*|насін\p{L}*)(?![\p{L}\d])/iu, 'farming productivefarming cookingforblockheads solcarrot mysticalagriculture productivebees'],
  [/(?<![\p{L}\d])(збро\p{L}*|брон\p{L}*|меч\p{L}*|кайл\p{L}*|інструмент\p{L}*|зачарув\p{L}*|самоцвіт\p{L}*|апотеоз\p{L}*)(?![\p{L}\d])/iu, 'gear silentgear apotheosis apothic_enchanting powerarmor allthemodium реліквії артефакти'],
  [/(?<![\p{L}\d])(бос\p{L}*|дракон\p{L}*|данж\p{L}*|вимір\p{L}*|портал\p{L}*|ефір|незер\p{L}*|енд\p{L}*)(?![\p{L}\d])/iu, 'exploration boss dimension aether undergarden allthemodium iceandfire'],
  [/(?<![\p{L}\d])(клавіш\p{L}*|кнопк\p{L}*|хотке\p{L}*|гаряч\p{L}*|конфлікт\p{L}*|управлін\p{L}*|options\.txt)(?![\p{L}\d])/iu, 'keys клавіші конфлікт перепризначення миша ctrl shift alt'],
  [/(?<![\p{L}\d])(не крафт\p{L}*|не працю\p{L}*|вимкнен\p{L}*|заблокован\p{L}*|чому не|краш\p{L}*|помилк\p{L}*)(?![\p{L}\d])/iu, 'fact kubejs прибрано неактивний заглушка сталь кар’єр зірка'],
  [/(?<![\p{L}\d])(сталь\p{L}*|сталев\p{L}*|steel)(?![\p{L}\d])/iu, 'fact:steel сталь сплав піч домна energizedpower enderio railcraft mffs oritech'],
  [/(?<![\p{L}\d])(зірк\p{L}*|atm star|ендгейм\p{L}*)(?![\p{L}\d])/iu, 'fact:atm_star tr_star зірка атм усемодій вібраній унобтаній творча есенція'],
];

/** Простий український/англійський стемер для токенізації пошуку. @param {string} w */
export function stemUk(w) {
  if (w.length <= 3) return w;
  return w.replace(/(ями|ами|ові|еві|ього|ому|им|ім|их|іх|ість|ості|ння|ття|увати|ювати|ати|яти|ити|іти|ою|єю|ах|ях|ів|їв|ей|ам|ям|ом|ем|а|я|о|е|и|і|у|ю|ї|й)$/, '') || w.slice(0, 3);
}

/** Розбиває текст на нормалізовані токени та стеми. @param {string} text */
export function tokenize(text) {
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

  for (const f of s.facts || []) {
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
    const g = s.guide?.[c.file];
    const hidTxt = c.hidden ? (g?.why ? `Прихована глава в грі: ${g.why}` : `Прихована глава в грі (відсутні моди: ${(c.missing || []).join(', ') || 'не портовано'}).`) : '';
    const guideTxt = g ? [g.ov, g.steps?.length ? `Порядок: ${g.steps.join('; ')}.` : '', g.atm?.length ? `Особливості ATM11: ${g.atm.join('; ')}.` : ''].filter(Boolean).join(' ') : '';
    add({
      id: `chapter:${c.file}`, kind: 'chapter',
      title: `Глава квестів «${c.title}» (${c.quests} квестів)`,
      href: `#/chapter/${c.file}`,
      badge: '📜 Глава квестів',
      text: `${guideTxt || (c.sub ? c.sub + '.' : '')} Квестів: ${c.quests - (c.service || 0)}. ${modNames ? `Моди: ${modNames}. ` : ''}${hidTxt}`.trim(),
      searchText: `${c.title} ${c.file} ${c.sub || ''} ${modNames} ${hidTxt} ${guideTxt}`,
      mods: c.mods,
    });
  }

  cachedCorpus = docs;
  return docs;
}

/** Виконує миттєвий гібридний пошук (BM25 + український стемер + двомовні синоніми ATM11 + триграми).
 * @param {Store} s @param {string} query @param {any} [analysis] @param {number} [topK] */
export function searchGuideSync(s, query, analysis, topK = 8) {
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

/** @param {Store} s @param {string} query @param {any} [analysis] @param {number} [topK] */
export async function searchGuide(s, query, analysis, topK = 8) {
  return searchGuideSync(s, query, analysis, topK);
}

/** Синтезує локальну структуровану відповідь українською мовою без зовнішнього API.
 * @param {string} query @param {Array<{ doc: RagDoc, score: number }>} hits @param {any} an @param {Store} _s */
export function composeLocalAnswer(query, hits, an, _s) {
  const q = (query || '').trim().toLowerCase();
  const lines = [];

  const asksNext = /(що робити|куди далі|наступн\w* крок|з чого почати|що далі|мій сейв|моєму світі)/i.test(q);
  if (asksNext || !q) {
    const p = an.world;
    const nt0 = an.nextTrunk[0];
    const voiceLine = nt0
      ? `Зараз твій етап — «${an.currentStage.title}». Головна віха далі — «${nt0.node.title}», а у сейві розпочато ${an.startedQuests.length} квестів.`
      : `Твій поточний етап — «${an.currentStage.title}», відкрито ${an.availNodes.length} віх для розвитку.`;
    lines.push(`🗣️ [${voiceLine}]`);
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
    if (!q) {
      lines.push(`Джерело: сейв світу «${p?.world || 'Новий світ'}» та дорожня карта ATM11`);
      return lines.join('\n\n');
    }
  }

  if (!hits.length) {
    lines.push(`🗣️ [За запитом «${query}» точних збігів у путівнику не знайдено.]`);
    lines.push(`За запитом **«${query}»** точних збігів не знайдено. Спробуйте інше формулювання (наприклад: *«де зберігати речі»*, *«перша енергія»*, *«як зробити сталь»*, *«клавіша ранця»*).`);
    return lines.join('\n\n');
  }

  const top = hits[0].doc;
  if (!asksNext && q) {
    const firstSent = (top.text.split(/(?<=[.!?])\s+/)[0] || top.title).replace(/\s+/g, ' ').trim().slice(0, 210);
    lines.push(`🗣️ [${top.title}: ${firstSent}]`);
  }
  lines.push(`### 💡 Відповідь за базою путівника: ${top.title}`);
  lines.push(top.text);

  const moreFacts = hits.slice(1, 4).filter((h) => h.score >= hits[0].score * 0.45);
  if (moreFacts.length) {
    lines.push(`**Додатково з путівника:**`);
    for (const h of moreFacts) {
      lines.push(`- **${h.doc.title}** [${h.doc.badge}]: ${h.doc.text.slice(0, 260)}${h.doc.text.length > 260 ? '…' : ''}`);
    }
  }
  lines.push(`Джерело: база путівника сайту (${hits.slice(0, 3).map((h) => h.doc.title).join(', ')})`);
  return lines.join('\n\n');
}

// ── Налаштування та виклик живого моста ATM11-Companion (:8812) ──
export function loadAssistantConfig() {
  /** @type {Record<string, any>} */
  let raw = {};
  try { raw = JSON.parse(localStorage.getItem(CFG_LS_KEY) || '{}') || {}; } catch { raw = {}; }
  return {
    mode: raw.mode === 'local' || !raw.mode ? 'local' : 'bridge', // 'local' | 'bridge' (старі 'ollama' / 'openai' → міст)
    modeExplicit: Boolean(raw.modeExplicit),
    bridgeUrl: raw.bridgeUrl || 'http://127.0.0.1:8812',
    openaiModel: raw.openaiModel || raw.model || 'deepseek-ai/DeepSeek-V4.1-Flash',
    visionModel: raw.visionModel || 'qwen/qwen2.5-vl-72b-instruct',
    ttsVoice: raw.ttsVoice || '',
    autoSpeak: Boolean(raw.autoSpeak),
  };
}

/** @param {Record<string, any>} cfg */
export function saveAssistantConfig(cfg) {
  try { localStorage.setItem(CFG_LS_KEY, JSON.stringify(cfg)); } catch {}
}

/** Відповідь на питання: через міст ATM11-Companion (єдиний «мозок») або локально без ШІ.
 * Режим мосту: сайт шле лише питання (і світ, вибраний у мості), базу путівника й стан світу міст додає сам.
 * Локальний режим: відповідь складає composeLocalAnswer з пошуку сайту (без моделі).
 * @param {string} query @param {Array<{ doc: RagDoc, score: number }>} hits @param {any} an @param {Store} s @param {any} cfg @param {string} [logTail]
 * @param {{ world?: string }} [opts] */
export async function askExternalPipeline(query, hits, an, s, cfg, logTail = '', opts = {}) {
  if (cfg.mode === 'bridge') {
    const base = (cfg.bridgeUrl || 'http://127.0.0.1:8812').replace(/\/$/, '');
    /** @type {Record<string, string>} */
    const body = { query: query || 'Що мені робити далі за моїм сейвом?', source: 'site' };
    if (opts.world) body.world = opts.world;
    const r = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.error) throw new Error(data.error || `Міст ATM11-Companion повернув ${r.status}`);
    const mode = data.mode === 'tools' ? 'інструменти бази' : 'попередній пошук';
    return { answer: data.answer, provider: `${data.provider || 'ATM11-Companion'} · ${mode}`, elapsedMs: data.elapsedMs, viaBridge: true };
  }

  return { answer: composeLocalAnswer(query, hits, an, s), provider: 'Локальний радник + Гібридний RAG' };
}
