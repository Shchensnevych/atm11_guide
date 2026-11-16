// @ts-check
// Майстер конфліктів клавіш (GK2): для дії в конфлікті або важливої непризначеної — кілька вільних зручних сполучень,
// перше — найкраще, з поясненням чому. Та сама модель конфліктів, що й вкладка / build_keys.py (keys-model.level).
// Чистий модуль без DOM — спільний із мостом компаньйона (import()). Нічого не пише в гру: лише пропонує.
import { level, analyze, pretty, parseSuggest, MOD_TITLE, UNBOUND } from './keys-model.js';
import { TKL_CENTERS } from './kb-layout.js';

const KB = 'key.keyboard.';
/** Ванільні дії Minecraft: їхні клавіші не переносимо й не займаємо (вони діють і у вікнах з інвентарем: E, Q, F, 1–9). */
const VANILLA = 'minecraft';
const ALL_CTX = new Set(['game', 'held', 'vehicle', 'gui', 'debug']);
const LAYERS = ['', 'C', 'S', 'A'];
/** Ціна шару: без модифікатора найпростіше; Ctrl і Shift уже під пальцем лівої руки. */
const LAYER_COST = { '': 0, C: 2, S: 3, A: 5 };
/** Самі модифікатори шарів (для правила «модифікатор має власну дію»). */
const MOD_KEYS = { C: ['left.control', 'right.control'], S: ['left.shift', 'right.shift'], A: ['left.alt', 'right.alt'] };
/** Вподобання користувача (GK2): інтерактивні дії (інвентарі, зброя, аксесуари, жетпак) — бічні кнопки миші з модифікаторами;
 * рідкісні перемикачі HUD — Ins / Home / End (+ модифікатори), далі Del / PgUp / PgDn. Категорії — з content/keys.json. */
const MOUSE_CATS = new Set(['inv', 'combat', 'gear']);
const HUD_CATS = new Set(['ui', 'screen']);
const MOUSE_SIDE = ['key.mouse.4', 'key.mouse.5'];
const HUD_KEYS = new Set(['insert', 'home', 'end'].map((k) => KB + k));
const HUD_KEYS2 = new Set(['delete', 'page.up', 'page.down'].map((k) => KB + k));
/** Не для призначення: Esc (меню гри), F3 (шар налагодження), Win / Menu / PrtSc (система), Caps / Scroll Lock (перемикають стан системи), самі модифікатори. */
const NOT_ASSIGNABLE = new Set(['escape', 'f3', 'left.win', 'right.win', 'menu', 'print.screen', 'caps.lock', 'scroll.lock',
  'left.shift', 'right.shift', 'left.control', 'right.control', 'left.alt', 'right.alt'].map((k) => KB + k));
/** Ліва рука на WASD: зручність клавіші — відстань від S / D. */
const HOME = { x: 3.25, y: 3.75 };
/** Службові англійські слова, з яких не беремо першу літеру (мнемоніка «Night Vision» → N). */
const STOP = new Set(['open', 'toggle', 'show', 'hide', 'the', 'to', 'a', 'an', 'of', 'for', 'and', 'or', 'key', 'keybind', 'keys', 'mode',
  'gui', 'screen', 'menu', 'in', 'on', 'with', 'from', 'item', 'use', 'desc', 'your', 'my', 'all', 'current']);

/** Рівень конфлікту для НОВОГО призначення: без винятку «один мод — так задумано» (той виняток — для власних клавіш мода, а не для наших перенесень).
 * @param {KeyAct} a @param {KeyAct} b */
const levelNew = (a, b) => (a.ns === b.ns ? level({ ...a, ns: a.ns + '#a' }, { ...b, ns: b.ns + '#b' }) : level(a, b));

const dist = (/** @type {{x: number, y: number}} */ a, /** @type {{x: number, y: number}} */ b) => Math.hypot(a.x - b.x, a.y - b.y);
/** «Ctrl+V», «Миша 4», «Ins» — сполучення так, як його розуміє parseSuggest / план. @param {string} l @param {string} bind */
export const comboOf = (l, bind) => (l ? MOD_TITLE[l] + '+' : '') + pretty(bind);

/** Літери-мнемоніки з англійської назви дії (або з id). @param {KeyAct} k */
function mnemonics(k) {
  const src = (k.en || (/[a-z]/i.test(k.name) ? k.name : '') || k.id.split('.').pop() || '').replace(/([a-z])([A-Z])/g, '$1 $2');
  const words = src.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w));
  return { letters: [...new Set(words.map((w) => w[0]).filter((c) => /[a-z]/.test(c)))], words };
}

/**
 * Контекст підбору: аналіз сполучень і обмеження, що випливають із самих даних (без правил під окремі моди).
 * reserved — сполучення, зайняті поза грою (клавіші компаньйона); l: '' | S | C | A | '*' (будь-який шар).
 * @param {KeyAct[]} keys @param {{reserved?: {l: string, bind: string, why: string}[]}} [opts]
 */
export function suggestCtx(keys, opts = {}) {
  const by = analyze(keys, ALL_CTX);
  // Ctrl (біг) і Shift (присідання) тримають постійно, а сполучення з утриманим модифікатором перехоплює клавішу (NeoForge):
  // Ctrl+1 «з'їв» би перемикання панелі на бігу. Тому модифікатори не ставимо на клавіші руху й ванільних дій (1–9, E, Q, F…).
  const baseKeys = new Set(keys.filter((k) => !k.m && !k.nc && k.bind !== UNBOUND && k.ctx !== 'debug'
    && ((k.ctx === 'game' && k.cat === 'move') || k.ns === VANILLA)).map((k) => k.bind));
  // Модифікатор, який сам по собі відкриває щось у світі (не рух і не «утримуваний» модифікатор nc): напр. лівий Alt — кругове меню.
  // Такий шар не пропонуємо (рішення користувача GK2: Alt + клавіша / Миша 4 — ризик крашу й відкритого меню).
  /** @type {Record<string, KeyAct | undefined>} */
  const modOwn = {};
  for (const [l, names] of Object.entries(MOD_KEYS)) {
    modOwn[l] = keys.find((k) => names.includes(k.bind.slice(KB.length)) && k.bind.startsWith(KB) && !k.m && k.ctx === 'game' && !k.nc && k.cat !== 'move');
  }
  const reserved = new Map((opts.reserved || []).map((r) => [r.l + '|' + r.bind, r.why]));
  const binds = [...TKL_CENTERS.keys()].filter((b) => !NOT_ASSIGNABLE.has(b)).concat(MOUSE_SIDE);
  return { keys, by, baseKeys, modOwn, reserved, binds };
}

/**
 * Варіанти для однієї дії: [{l, bind, combo, lvl, score, why[]}] — від найкращого. lvl 0 — без конфлікту, 1 — лише «можливий».
 * @param {ReturnType<typeof suggestCtx>} cx @param {KeyAct} act @param {number} [n]
 */
export function suggestFor(cx, act, n = 3) {
  if (act.ctx === 'debug' || act.ns === VANILLA) return [];             // ванільні дії (і F3+…) не переносимо — рішення користувача GK2
  const cur = act.bind !== UNBOUND ? act.bind : '';
  const curPos = cur ? TKL_CENTERS.get(cur) : undefined;
  const mn = mnemonics(act);
  const planned = act.plan && !act.plan_done && act.plan !== 'none' ? parseSuggest(act.plan) : null;   // незастосований пункт плану
  const out = [];
  for (const bind of cx.binds) for (const l of LAYERS) {
    if (bind === act.bind && l === (act.m || '')) continue;               // поточне сполучення
    if (act.kuma && l) continue;                                         // Kuma API: модифікатор крашить гру (правило Balm / Kuma)
    if (l && cx.baseKeys.has(bind)) continue;                            // модифікатор + клавіша руху / ванільної дії перехопить її на бігу
    const key = l + '|' + bind;
    if (cx.reserved.has(key) || cx.reserved.has('*|' + bind)) continue;   // '*' — на будь-якому шарі (PTT компаньйона не дивиться на модифікатори)
    if (l && cx.modOwn[l]) continue;                                      // модифікатор сам відкриває щось у світі
    const cand = { ...act, bind, m: /** @type {any} */ (l) };
    const others = (cx.by.get(key)?.acts || []).filter((/** @type {KeyAct} */ x) => x.id !== act.id);
    if (others.some((/** @type {KeyAct} */ x) => x.ns === VANILLA)) continue;   // сполучення ванільних дій лишаються ванільним (рішення користувача GK2)
    const lvl = Math.max(0, ...others.map((/** @type {KeyAct} */ x) => levelNew(cand, x)));
    if (lvl === 2) continue;
    /** @type {[number, string][]} */ const why = [];                  // [вага для порядку пояснень, текст]
    let score = LAYER_COST[l];
    const pos = TKL_CENTERS.get(bind);
    const mouse = !pos;
    // вподобання користувача
    if (MOUSE_CATS.has(act.cat) && act.ctx !== 'gui') {
      if (mouse) { score -= 15; why.push([0, 'інтерактивна дія — на бічній кнопці миші (ваше правило: Миша 4 + Ctrl / Shift / Alt)']); }
    } else if (mouse) score += 6;                                        // бічні кнопки миші бережемо для інтерактивних дій
    if (HUD_CATS.has(act.cat) && act.ctx === 'game') {
      if (HUD_KEYS.has(bind)) { score -= 15; why.push([0, 'рідкісний перемикач HUD — Ins / Home / End (ваше правило)']); }
      else if (HUD_KEYS2.has(bind)) { score -= 10; why.push([0, 'рідкісний перемикач HUD — блок навігації (поруч з Ins / Home / End)']); }
    } else if (HUD_KEYS.has(bind) || HUD_KEYS2.has(bind)) score += 4;    // блок навігації бережемо для HUD
    // близькість: та сама клавіша з модифікатором — найлегше запам'ятати; інакше — ближче до попередньої
    if (cur && bind === cur) { score -= 10; why.push([1, `та сама клавіша ${pretty(cur)}, лише ${l ? 'з ' + MOD_TITLE[l] : 'без модифікатора'} — звична позиція`]); }
    else if (curPos && pos) score += 0.6 * dist(curPos, pos);
    if (pos && /^key\.keyboard\.[a-z]$/.test(bind) && mn.letters.includes(bind.slice(-1))) {
      const w = mn.words.find((x) => x[0] === bind.slice(-1));
      score -= 6; why.push([2, `літера з назви: «${w}» → ${bind.slice(-1).toUpperCase()}`]);
    }
    if (pos && !mouse) score += 0.5 * Math.max(0, dist(HOME, pos) - 1.5);  // зручність для лівої руки
    if (lvl === 1) {
      score += 40;
      const o = others.find((/** @type {KeyAct} */ x) => levelNew(cand, x) === 1);
      why.push([4, `◐ можливий конфлікт з «${o?.name}» (діє лише з предметом / верхи / умовно)`]);
    } else if (others.length) {
      score += 3;
      why.push([5, `на ${comboOf(l, bind)} уже є «${others[0].name}»${others.length > 1 ? ` і ще ${others.length - 1}` : ''} — інший контекст, не заважає`]);
    } else why.push([5, 'вільне в усіх контекстах']);
    if (act.kuma) why.push([6, 'без модифікатора: мод на Kuma API (з модифікатором гра крашиться)']);
    const fromPlan = !!planned && planned.bind === bind && planned.l === l;
    if (fromPlan) { score -= 100; why.push([-1, `з вашого плану (content/keys.json): ${act.why || 'перепризначення'}`]); }
    out.push({ l, bind, combo: comboOf(l, bind), lvl, score: Math.round(score * 10) / 10, plan: fromPlan, why: why.sort((a, b) => a[0] - b[0]).map((x) => x[1]) });
  }
  out.sort((a, b) => a.score - b.score || a.combo.localeCompare(b.combo));
  // незастосований пункт плану «зняти» — першим варіантом (зняття не створює конфлікту)
  if (act.plan === 'none' && !act.plan_done && act.bind !== UNBOUND) {
    out.unshift({ l: '', bind: UNBOUND, combo: 'зняти з клавіші', lvl: 0, score: -100, plan: true, why: [`з вашого плану (content/keys.json): ${act.why || 'зняти'}`] });
  }
  return out.slice(0, n);
}

/** Клавіша HUD компаньйона (глобальна, Windows забирає її собі — гра не отримує). */
const COMPANION_HUD = { l: 'A', bind: KB + 'q', why: 'Alt+Q — HUD компаньйона' };
/**
 * Сполучення, зайняті компаньйоном: HUD (Alt+Q) і Push-to-Talk (канонічна назва компаньйона: «Mouse5», «Ctrl+G», «F8»).
 * PTT спрацьовує, коли затиснуто його модифікатори, незалежно від інших, тому без модифікатора — зайнято на всіх шарах ('*').
 * @param {string} [ptt] @param {string} [pttTitle]
 */
export function companionReserved(ptt = 'Mouse5', pttTitle = '') {
  const parts = String(ptt).split('+').map((x) => x.trim()).filter(Boolean);
  const key = parts.pop() || '';
  const mod = parts.map((p) => ({ ctrl: 'C', control: 'C', shift: 'S', alt: 'A' })[p.toLowerCase()]).find(Boolean) || '';
  const ms = /^mouse\s*(\d)$/i.exec(key);
  const bind = ms ? 'key.mouse.' + ms[1] : KB + key.toLowerCase();
  return [COMPANION_HUD, { l: mod || '*', bind, why: `${pttTitle || ptt} — Push-to-Talk компаньйона` }];
}

/** Яку з дій конфлікту переносити першою: ту, що вже в плані; не важливу; рідковживану (HUD / екран). Ванільні — останніми (без варіантів). @param {KeyAct} k */
const moveCost = (k) => (k.plan && !k.plan_done ? -20 : 0) + (k.imp ? 10 : 0) + (k.ns === VANILLA ? 50 : 0) + (HUD_CATS.has(k.cat) ? -3 : 0);

/**
 * Цілі майстра: конфлікти (обидві сторони з варіантами, перша — рекомендована) і важливі непризначені дії.
 * @param {ReturnType<typeof suggestCtx>} cx @param {number} [n]
 */
export function wizardTargets(cx, n = 3) {
  /** @type {{kind: 'conflict'|'unbound', combo: string, acts: {act: KeyAct, sugg: ReturnType<typeof suggestFor>}[]}[]} */
  const out = [];
  for (const [key, v] of cx.by) {
    if (v.lvl !== 2) continue;
    const ids = new Set();
    v.acts.forEach((/** @type {KeyAct} */ a, /** @type {number} */ i) => v.acts.slice(i + 1).forEach((/** @type {KeyAct} */ b) => { if (level(a, b) === 2) { ids.add(a); ids.add(b); } }));
    const acts = [.../** @type {Set<KeyAct>} */ (ids)].map((act) => ({ act, sugg: suggestFor(cx, act, n) }))
      .sort((a, b) => moveCost(a.act) - moveCost(b.act) || (a.sugg[0]?.score ?? 99) - (b.sugg[0]?.score ?? 99));
    const [l, bind] = key.split('|');
    out.push({ kind: 'conflict', combo: comboOf(l, bind), acts });
  }
  for (const act of cx.keys) if (act.imp && act.bind === UNBOUND) out.push({ kind: 'unbound', combo: '', acts: [{ act, sugg: suggestFor(cx, act, n) }] });
  return out;
}

/**
 * Застосувати вибрані зміни до копії й перевірити: нових конфліктів немає (як build_keys для плану).
 * @param {KeyAct[]} keys @param {{id: string, l: string, bind: string}[]} picks
 */
export function checkPicks(keys, picks) {
  const pid = new Map(picks.map((p) => [p.id, p]));
  const after = keys.map((k) => { const p = pid.get(k.id); return p ? { ...k, bind: p.bind, m: /** @type {any} */ (p.l) } : k; });
  const before = analyze(keys, ALL_CTX); const by = analyze(after, ALL_CTX);
  const n2 = (/** @type {Map<string, any>} */ m) => [...m.values()].filter((v) => v.lvl === 2).length;
  /** @type {{combo: string, acts: KeyAct[]}[]} */ const fresh = [];
  for (const p of picks) {
    if (p.bind === UNBOUND) continue;
    const v = by.get(p.l + '|' + p.bind);
    const me = v?.acts.find((/** @type {KeyAct} */ x) => x.id === p.id);
    const bad = me ? v.acts.filter((/** @type {KeyAct} */ x) => x !== me && levelNew(me, x) === 2) : [];
    if (bad.length && !fresh.some((f) => f.combo === comboOf(p.l, p.bind))) fresh.push({ combo: comboOf(p.l, p.bind), acts: [me, ...bad] });
  }
  return { ok: !fresh.length, fresh, conflicts: [n2(before), n2(by)], after };
}

/**
 * Узгоджений набір перших варіантів для всіх цілей (кожна наступна ціль бачить попередні зміни) — для «Скопіювати все».
 * @param {KeyAct[]} keys @param {{reserved?: {l: string, bind: string, why: string}[]}} [opts]
 */
export function planAll(keys, opts = {}) {
  let cur = keys; /** @type {{id: string, l: string, bind: string, combo: string, act: KeyAct}[]} */ const picks = [];
  for (let guard = 0; guard < 50; guard++) {
    const cx = suggestCtx(cur, opts);
    const t = wizardTargets(cx, 1).find((x) => x.acts.some((a) => a.sugg.length && !picks.some((p) => p.id === a.act.id)));
    if (!t) break;
    const a = t.acts.find((x) => x.sugg.length && !picks.some((p) => p.id === x.act.id));
    if (!a) break;
    const s = a.sugg[0];
    picks.push({ id: a.act.id, l: s.l, bind: s.bind, combo: s.combo, act: a.act });
    cur = cur.map((k) => (k.id === a.act.id ? { ...k, bind: s.bind, m: /** @type {any} */ (s.l) } : k));
  }
  return picks;
}

