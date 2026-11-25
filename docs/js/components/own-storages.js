// @ts-check
// components/own-storages.js — «Мої сховища» на сайті #/assistant (K14, HANDOFF компаньйона §4 Б22; рішення користувача
// 2026-11-14 — нарівні з ⚙️ HUD і вікном керування, storage-own-ui.js компаньйона): зони й усе, що гравець поставив або
// позначив; причина — значком рядка фіксованого розміру (варіант B: 📌 позначив, 🔨 поставив, 📌 з кутовим 🔨 — обидві);
// у межах якої бази — смужкою кольору зони ліворуч (варіант 3; поза зонами й рухоме — без смужки) і легендою; меню «⋯» —
// перейменувати, «Зняти позначку» (лише 📌; поставлене лишається), «Не моє» (як голосом), для зони — видалити. Маршрут — лише
// в грі (рішення 11-14). Дані й підписи (`zone`, `where`, `n`) — з моста GET /api/storage/own; дії — POST /api/storage/own.
// K15 (HANDOFF компаньйона §4 Б23, рішення користувача 2026-11-14): усе, що зберігає, — точки доступу особистих сховищ і
// мережі (значок — картинка блока з img/items сайту, немає — загальний значок; точку доступу можна забути; маршрут — лише
// в грі, тож рядок мережі на сайті без меню), спільне сховище, що «моє» за зоною, — рядок з картинкою блока, кольорова плашка з літерою групи
// спільного вмісту окремою вузькою колонкою перед «⋯» (варіант 2), рядки «При собі» й «У сховищах», легенда — рядками
// «Зони / Мітки / Типи / Зв'язок» з роздільниками (пари «значок — пояснення»), лише про те, що є у списку. Дані (`chain`, `access`, `networks`, `carried`, `stored`, `icon`) — з моста.
// K23 (HANDOFF компаньйона §4 М1, рішення користувача 2026-11-19 — варіант B макета): сховища, які мережа показує через свій
// вузол (шина сховища, зовнішнє сховище), — під рядком мережі (міст: `networks[].mounts`, зі списку прибрані): на рядку
// кнопка-лічильник «N▾» (K34: у тій самій 4-й колонці й прямокутному стилі, що літера групи, без «🔌», щоб координати стояли
// рівно в одну вертикаль), клік розгортає дочірні рядки з тим самим меню, що в рядка сховища; розгорнуте пам'ятає картка.
// DOM — лише h() / textContent (SECURITY §4).
import { h, mount } from '../core/dom.js';
import { openRowMenu, closeRowMenu, renameInPlace, isEditing, isRowMenuOpenIn } from './row-menu.js';

/** Кольорів зон у стилях (класи .so-zc0…so-zc5, css/assistant.css; токени --zone-*); зон більше — по колу. */
export const ZONE_COLORS = 6;
/** Кольорів плашок груп спільного вмісту в стилях (`.so-chain.ch<N>`, токени `--chain-N`); номер групи — по колу. */
export const CHAIN_COLORS = 8;
/** @param {any} n */
const chainHue = (n) => (Number.isInteger(n) && n >= 0 ? n : 0) % CHAIN_COLORS;
/** @param {any} i */
const zoneCls = (i) => (Number.isInteger(i) && i >= 0 ? `.so-zc${i % ZONE_COLORS}` : '');

const PIN_TEXT = 'позначив «це моє»';
const PLACED_TEXT = 'поставив ти';
const MARK_FALLBACK = '📦';
const TANK_FALLBACK = '💧';
const ENERGY_FALLBACK = '⚡';
const ACCESS_FALLBACK = '🚪';
const NET_FALLBACK = '🗄️';
const VALID_TABS = new Set(['all', 'items', 'fluids', 'energy', 'zones']);

/** K35 (Е.22): безпечний шлях іконки «простір/шлях» без «..» і прихованих сегментів. @param {any} rel */
const safeIconRel = (rel) => typeof rel === 'string' && /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(rel) && !rel.includes('..') && !rel.startsWith('.') && !rel.includes('/.');

/** @param {any} stat @param {any} where */
function compactStatWhere(stat, where) {
  if (!stat) return String(where || '');
  const w = String(where || '');
  const distMatch = /·\s*([^·]+)$/.exec(w);
  const tail = distMatch ? distMatch[1].trim() : w;
  return tail ? `${stat} · ${tail}` : String(stat);
}

/** @param {any} es */
function renderEnergyBox(es) {
  if (!es || (!(es.nodesCount > 0) && !(es.networks && es.networks.length > 0))) return null;
  const pct = Math.max(0, Math.min(100, Math.round(Number(es.fillPct) || 0)));
  const st = es.status || 'stable';
  const flowCls = st === 'critical' ? '.is-crit' : (es.netFePerTick > 1 ? '.is-pos' : (es.netFePerTick < -1 ? '.is-neg' : ''));
  const flowTxt = es.creative ? '∞ FE' : (es.hasTrend && es.flowText ? es.flowText : `${pct}%`);
  const rightSub = es.etaText || (es.nodesCount ? `блоків: ${es.nodesCount}` : '');
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', 'so-en-bar');
  svg.setAttribute('viewBox', '0 0 100 6');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  const bg = document.createElementNS(svgNs, 'rect');
  bg.setAttribute('x', '0'); bg.setAttribute('y', '0'); bg.setAttribute('width', '100'); bg.setAttribute('height', '6'); bg.setAttribute('rx', '3');
  bg.setAttribute('fill', 'rgba(15, 23, 42, 0.72)');
  svg.appendChild(bg);
  if (pct > 0) {
    const fg = document.createElementNS(svgNs, 'rect');
    fg.setAttribute('x', '0'); fg.setAttribute('y', '0'); fg.setAttribute('width', String(pct)); fg.setAttribute('height', '6'); fg.setAttribute('rx', '3');
    fg.setAttribute('fill', st === 'critical' ? '#ef4444' : (st === 'draining' ? '#f59e0b' : (es.creative ? '#c084fc' : '#22c55e')));
    svg.appendChild(fg);
  }
  return h(`div.so-en-box${st === 'critical' ? '.is-crit' : ''}`, null,
    h('div.so-en-top', null, h('span.so-en-title', null, '⚡ Енергобаланс бази'), h(`span.so-en-flow${flowCls}`, null, flowTxt)),
    svg,
    h('div.so-en-sub', null, h('span', null, es.fillText || '0 FE'), rightSub ? h('span', null, rightSub) : null));
}

/** K16: картинка блока / предмета з бази сайту (rel — «простір/шлях» від моста) або запасний значок; причини 📌 / 🔨 — у кутах.
 * @param {any} m @param {string} fallback @param {string} [what] */
function rowIcon(m, fallback, what = '') {
  const rel = m && m.icon;
  const ok = safeIconRel(rel);
  const pinned = Boolean(m && m.pinned);
  const placed = Boolean(m && m.placed);
  const title = [what, pinned ? PIN_TEXT : '', placed ? PLACED_TEXT : ''].filter(Boolean).join(' · ');
  return h('span.so-ic', { title },
    ok ? h('img.so-blk', { src: `img/items/${rel}.png`, alt: '', loading: 'lazy' }) : fallback,
    pinned ? h('span.so-corner.so-corner-top', null, '📌') : null,
    placed ? h('span.so-corner', null, '🔨') : null);
}

/** @type {WeakMap<HTMLElement, string>} */
const shown = new WeakMap();
/** K23: розгорнуті мережі (ключі), активна вкладка й останні дані — для перемальовування за кліком або після закриття меню. @type {WeakMap<HTMLElement, { open: Set<string>, tab: string, d: any, act: any, pending: boolean }>} */
const state = new WeakMap();
/** «1 підключене / 2 підключені / 5 підключених». @param {number} n */
const mountWord = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'підключене' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 'підключені' : 'підключених');
/** K23 (з гри 11-19): розгорнуті мережі й обрана вкладка — у сховищі браузера (переживають перезавантаження сторінки). */
const OPEN_KEY = 'atm11.own.mountsOpen';
const TAB_KEY = 'atm11.own.tab';
const readOpen = () => { try { const v = JSON.parse(localStorage.getItem(OPEN_KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (_) { return []; } };
const readTab = () => { try { const v = localStorage.getItem(TAB_KEY) || 'all'; return VALID_TABS.has(v) ? v : 'all'; } catch (_) { return 'all'; } };
/** @param {Set<string>} open */
const saveOpen = (open) => { try { localStorage.setItem(OPEN_KEY, JSON.stringify([...open])); } catch (_) { /* сховище недоступне — лише на сторінці */ } };
/** @param {string} tab */
const saveTab = (tab) => { try { localStorage.setItem(TAB_KEY, tab); } catch (_) {} };

/**
 * Намалювати список у контейнері, що живе між перемальовуваннями картки. Без змін даних — не перемальовує
 * (меню й поле вводу лишаються); під час перейменування або відкритого меню — відкладає оновлення до закриття.
 * @param {HTMLElement} el
 * @param {any} d  відповідь моста GET /api/storage/own
 * @param {{ act: (body: Record<string, string>) => void }} opt  дія меню → POST /api/storage/own
 */
export function renderOwnStorages(el, d, { act }) {
  const stt = state.get(el) || { open: new Set(readOpen()), tab: readTab(), d, act, pending: false };
  stt.d = d; stt.act = act;
  state.set(el, stt);
  if (isEditing(el) || isRowMenuOpenIn(el)) {
    stt.pending = true;
    return;
  }
  stt.pending = false;
  const open = stt.open;
  const tab = VALID_TABS.has(stt.tab) ? stt.tab : 'all';
  const sig = JSON.stringify([tab, d.zones, d.marks, d.tanks, d.energy, d.energySummary, d.access, d.networks, d.carried, d.stored, d.placed, d.pinned, d.unpinned, d.snapshot?.lastAt, [...open]]);
  if (shown.get(el) === sig) return;
  shown.set(el, sig);
  closeRowMenu();

  const flushIfPending = () => {
    if (stt.pending) {
      stt.pending = false;
      renderOwnStorages(el, stt.d, { act: stt.act });
    }
  };

  /**
   * @param {HTMLElement} icon @param {string} name @param {string} where @param {any} zone
   * @param {((btn: HTMLElement, nameEl: HTMLElement) => void) | null} onMenu  null — рядок без меню (точка доступу, мережа)
   * @param {string} [extra] @param {any} [m]  рядок моста: chain — літера групи спільного вмісту, hint — підказка рядка
   * @param {HTMLElement | null} [badge]  K34: кнопка в 4-й колонці на місці літери групи (лічильник підключених мережі)
   */
  const row = (icon, name, where, zone, onMenu, extra = '', m = null, badge = null) => {
    const nameEl = h('span.so-name', { title: name }, name);
    const nameCell = nameEl;
    const metaEl = h('span.so-meta', null, where || '');
    const chain = badge || (m && m.chain
      ? h(`span.so-chain.ch${chainHue(m.chainN)}`, { title: `спільний вміст — група ${m.chain}: у всіх місцях із цією літерою й кольором лежить те саме` }, m.chain)
      : h('span.so-chain.none'));
    if (!onMenu) return h(`div.so-row${extra}${zoneCls(zone)}`, m && m.hint ? { title: m.hint } : null, icon, nameCell, metaEl, chain, h('span.so-nomenu'));
    const btn = h('button.so-menu', {
      type: 'button',
      title: 'Дії',
      'aria-haspopup': 'menu',
      onclick: (/** @type {Event} */ e) => { e.stopPropagation(); onMenu(btn, nameEl); },
    }, '⋯');
    return h(`div.so-row${extra}${zoneCls(zone)}`, m && m.hint ? { title: m.hint } : null, icon, nameCell, metaEl, chain, btn);
  };

  const zones = (d.zones || []).map((/** @type {any} */ z, /** @type {number} */ i) => {
    const star = z.primary ? h('span.so-chain.so-zstar', { title: 'Головна база цього виміру' }, '⭐') : null;
    const zDim = z.dim ? { dim: z.dim } : {};
    return row(h('span.so-ic', { title: z.primary ? 'головна база' : 'зона бази' }, '📍'), z.name, z.where, i,
      (btn, nameEl) => openRowMenu(btn, [
        { id: 'primary', icon: z.primary ? '☆' : '⭐', label: z.primary ? 'Зняти «головну»' : 'Зробити головною' },
        { id: 'rename', icon: '✏️', label: 'Перейменувати' },
        { sep: true },
        { id: 'delete', icon: '✕', label: 'Видалити зону', kind: 'danger' },
      ], (id) => {
        if (id === 'delete') act({ action: 'unzone', name: z.name, ...zDim });
        else if (id === 'primary') act({ action: 'primary-zone', name: z.name, ...zDim, primary: z.primary ? '0' : '1' });
        else renameInPlace(nameEl, z.name, (to) => act({ action: 'rename-zone', name: z.name, ...zDim, to }));
      }, flushIfPending), '.zone', null, star);
  });

  // K16: картинка блока для всіх рядків; 📌 / 🔨 — у кутах значка
  /** @param {any} m @param {string} [fallback] @param {string} [extra] @param {string} [whatLabel] */
  const unitRow = (m, fallback = MARK_FALLBACK, extra = '', whatLabel = '') => row(
    rowIcon(m, m.isTank ? TANK_FALLBACK : fallback, m.auto ? (m.why || 'ваше') : whatLabel),
    m.label || 'Сховище',
    m.stat ? compactStatWhere(m.stat, m.where) : m.where,
    m.zone,
    (btn, nameEl) => openRowMenu(btn, [
      ...(m.auto ? [] : [{ id: 'rename', icon: '✏️', label: 'Перейменувати' }, { sep: true }]),
      ...(!m.auto && m.pinned !== false ? [{ id: 'unmark', icon: '📌', label: 'Зняти позначку', hint: m.placed ? 'лишиться 🔨' : '' }] : []),
      { id: 'notmine', icon: '🚫', label: 'Не моє', kind: /** @type {'danger'} */ ('danger'), hint: 'як голосом' },
    ], (id) => {
      if (id === 'rename') renameInPlace(nameEl, m.label || 'Сховище', (to) => act({ action: 'rename-mark', key: m.key, to }));
      else act({ action: id, key: m.key });
    }, flushIfPending), extra, m);

  const rawZones = d.zones || [];
  const rawMarks = d.marks || [];
  const rawTanks = d.tanks || [];
  const rawEnergy = d.energy || [];
  const rawAccess = d.access || [];
  const rawNets = d.networks || [];

  const marks = rawMarks.map((/** @type {any} */ m) => unitRow(m, MARK_FALLBACK));
  const tanks = rawTanks.map((/** @type {any} */ tk) => unitRow(tk, TANK_FALLBACK, '', 'рідинний резервуар'));
  const energy = rawEnergy.map((/** @type {any} */ en) => unitRow(en, ENERGY_FALLBACK, '', 'енергосховище FE'));

  const access = rawAccess.map((/** @type {any} */ a) => row(rowIcon(a, ACCESS_FALLBACK, 'точка доступу: з цього блока ви відкривали особисте сховище'),
    a.label || 'Точка доступу', a.where, a.zone,
    (btn) => openRowMenu(btn, [{ id: 'forget', icon: '✕', label: 'Забути точку доступу', hint: 'відкриєте — згадає' }], () => act({ action: 'forget-access', key: a.key }), flushIfPending), '', a));

  /** @param {any[]} netList @param {((m: any) => boolean) | null} [mountFilter] @param {((n: any) => string) | null} [metaOverride] */
  const renderNets = (netList, mountFilter = null, metaOverride = null) => netList.flatMap((/** @type {any} */ n) => {
    const sub = mountFilter ? (n.mounts || []).filter(mountFilter) : (n.mounts || []);
    const on = sub.length > 0 && open.has(n.key);
    const chip = sub.length ? h(`button.so-chain.so-mounts${on ? '.on' : ''}`, {
      type: 'button',
      title: `${sub.length} ${mountWord(sub.length)} — ${on ? 'згорнути' : 'показати'}`,
      'aria-label': `${sub.length} ${mountWord(sub.length)}`,
      'aria-expanded': String(on),
      onclick: (/** @type {Event} */ e) => {
        e.stopPropagation();
        closeRowMenu();
        if (open.has(n.key)) open.delete(n.key); else open.add(n.key);
        saveOpen(open);
        renderOwnStorages(el, stt.d, { act: stt.act });
      },
    }, `${sub.length}${on ? '▴' : '▾'}`) : null;
    const meta = metaOverride ? metaOverride(n) : n.where;
    return [row(rowIcon(n, NET_FALLBACK, 'мережа'), n.label || 'Мережа', meta, n.zone, null, '', n, chip), ...(on ? sub.map((/** @type {any} */ m) => unitRow(m, MARK_FALLBACK, '.sub')) : [])];
  });

  const mounted = rawNets.flatMap((/** @type {any} */ n) => n.mounts || []);
  const fluidNets = rawNets.filter((/** @type {any} */ n) => (n.fluidKinds > 0) || (n.mounts || []).some((/** @type {any} */ m) => m.isTank));
  const powerNets = rawNets.filter((/** @type {any} */ n) => Boolean(n.powerStat));
  const rows = [...rawMarks, ...rawTanks, ...rawEnergy, ...rawAccess, ...rawNets, ...mounted];

  const tabDefs = [
    { id: 'all', lbl: 'Усі', cnt: rawMarks.length + rawTanks.length + rawEnergy.length + rawAccess.length + rawNets.length + mounted.length },
    { id: 'items', lbl: '📦 Предмети', cnt: rawMarks.length + rawAccess.length + rawNets.length + mounted.filter((/** @type {any} */ m) => !m.isTank).length },
    { id: 'fluids', lbl: '💧 Рідини', cnt: rawTanks.length + mounted.filter((/** @type {any} */ m) => m.isTank).length + fluidNets.length },
    { id: 'energy', lbl: '⚡ Енергія', cnt: rawEnergy.length + powerNets.length },
    { id: 'zones', lbl: '📍 Зони', cnt: rawZones.length },
  ];
  const tabsBar = h('div.so-tabs', { role: 'tablist', 'aria-label': 'Категорії сховищ' },
    tabDefs.map((t) => h(`button.so-tab${tab === t.id ? '.on' : ''}`, {
      type: 'button',
      role: 'tab',
      'aria-selected': String(tab === t.id),
      onclick: (/** @type {Event} */ e) => {
        e.stopPropagation();
        if (stt.tab === t.id) return;
        closeRowMenu();
        stt.tab = t.id;
        saveTab(t.id);
        const curList = el.querySelector('.so-list');
        if (curList) curList.scrollTop = 0;
        renderOwnStorages(el, stt.d, { act: stt.act });
      },
    }, h('span', null, t.lbl), h('span.so-tab-cnt', null, String(t.cnt)))));

  /** Рядок легенди / «При собі»: назва групи → вміст. @param {any} what @param {any} text */
  const keyRow = (what, text, cls = '') => h(`div.so-key${cls}`, null, h('span.so-key-what', null, what), h('span.so-key-text', null, text));
  /** Пара легенди «значок — пояснення». @param {any} icon @param {string} text */
  const kv = (icon, text, title = '') => h('span.so-kv', title ? { title } : null, icon, h('span', null, text));
  /** @param {any} x */
  const chip = (x) => h('span.so-chip', null,
    safeIconRel(x.icon) ? h('img.so-blk.sm', { src: `img/items/${x.icon}.png`, alt: '', loading: 'lazy' }) : null,
    `${[x.label, x.note].filter(Boolean).join(' · ')}${x.where ? ` → ${x.where}` : ''}`);
  const carriedSrc = tab === 'fluids'
    ? (d.carriedFluids || [])
    : (tab === 'items' ? (d.carriedItems || d.carried || []) : (tab === 'all' ? (d.carried || []) : []));
  const storedSrc = (tab === 'all' || tab === 'items') ? (d.stored || []) : [];
  const holders = [
    carriedSrc.length ? keyRow('При собі', carriedSrc.map(chip), '.hold') : null,
    storedSrc.length ? keyRow('У сховищах', storedSrc.map(chip), '.hold') : null,
  ].filter(Boolean);

  const dot = (/** @type {string} */ cls) => h(`span.so-zdot${cls}`);
  const outside = rows.some((/** @type {any} */ m) => m.zone == null);
  const legend = [
    rawZones.length ? keyRow('Зони', [
      rawZones.map((/** @type {any} */ z, /** @type {number} */ i) => kv(dot(zoneCls(i)), z.name)),
      outside ? kv(dot('.so-zout'), 'поза зонами') : null]) : null,
    marks.length || tanks.length || energy.length || mounted.length || rawAccess.some((/** @type {any} */ a) => a.placed) ? keyRow('Мітки', [kv('📌', PIN_TEXT, 'у куті значка'), kv('🔨', PLACED_TEXT, 'у куті значка')]) : null,
    access.length || rawNets.length || tanks.length || energy.length ? keyRow('Типи', [
      tanks.length ? kv(TANK_FALLBACK, 'резервуар рідин / пари') : null,
      energy.length ? kv(ENERGY_FALLBACK, 'енергосховище FE') : null,
      access.length ? kv(ACCESS_FALLBACK, 'точка доступу', 'у рядку — картинка самого блока, якщо вона є') : null,
      rawNets.length ? kv(NET_FALLBACK, 'мережа', 'у рядку — картинка блока мережі, якщо вона є') : null,
      mounted.length ? kv(h('span.so-chain.so-mounts.so-mounts-sample', null, '1▾'), 'підключені до мережі', 'сховища, які мережа показує через шину чи зовнішнє сховище, — під її рядком; клік по лічильнику розгортає') : null]) : null,
    rows.some((/** @type {any} */ m) => m.chain) ? keyRow('Зв\'язок', kv([h('span.so-chain.ch0', null, 'А'), h('span.so-chain.ch1', null, 'Б')], 'однакова літера й колір — спільний вміст')) : null,
  ].filter(Boolean);

  /** @type {any[]} */
  let listChildren = [];
  let energyBox = null;
  if (tab === 'all') {
    listChildren = [
      zones.length ? zones : h('div.small.muted', null, 'Зон ще немає — станьте на базі в грі й скажіть або напишіть у чат «тут моя база».'),
      marks, tanks, energy, access, renderNets(rawNets),
    ];
  } else if (tab === 'items') {
    const itemNets = renderNets(rawNets, (m) => !m.isTank);
    listChildren = (marks.length || access.length || itemNets.length)
      ? [marks, access, itemNets]
      : [h('div.small.muted', null, 'Предметних сховищ ще немає — поставте скриню або створіть зону бази в грі.')];
  } else if (tab === 'fluids') {
    const fNets = renderNets(fluidNets, (m) => Boolean(m.isTank), (n) => compactStatWhere(n.fluidKinds ? `${n.fluidKinds} рідин` : '', n.where));
    listChildren = (tanks.length || fNets.length)
      ? [tanks, fNets]
      : [h('div.small.muted', null, 'Резервуарів для рідин і пари ще немає — поставте бак чи рідинну шухляду на базі.')];
  } else if (tab === 'energy') {
    energyBox = renderEnergyBox(d.energySummary);
    const pNets = renderNets(powerNets, () => false, (n) => compactStatWhere(n.powerStat, n.where));
    listChildren = (energy.length || pNets.length)
      ? [energy, pNets]
      : [h('div.small.muted', null, 'Енергосховищ FE ще немає — поставте батарею, комірку чи контролер мережі.')];
  } else if (tab === 'zones') {
    listChildren = zones.length
      ? [zones]
      : [h('div.small.muted', null, 'Зон ще немає — станьте на базі в грі й скажіть або напишіть у чат «тут моя база».')];
  }

  // K23 (з гри 11-19): прокрутка списку — та сама після перемальовування (розгортання й оновлення даних скидали її на початок)
  const prevList = el.querySelector('.so-list');
  const top = prevList ? prevList.scrollTop : 0;
  mount(el,
    tabsBar,
    energyBox,
    h('div.so-list', null, listChildren),
    holders.length ? h('div.so-keys', null, holders) : null,
    legend.length ? h('div.so-keys.legend', null, legend) : null,
    h('div.small.muted', null, 'Дані — з компаньйона (ті самі, що в HUD). ' +
      `Поставлено вами: ${d.placed ?? 0} · позначено: ${d.pinned ?? 0} · «не моє»: ${d.unpinned ?? 0}` +
      (d.snapshot?.lastAt ? ` · знімок гри: ${d.snapshot.lastContainers} сховищ за ${d.snapshot.lastWorkMs} мс` : '')));
  const nowList = /** @type {HTMLElement | null} */ (el.querySelector('.so-list'));
  if (nowList && top) nowList.scrollTop = top;
}
