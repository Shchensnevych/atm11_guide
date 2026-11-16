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
// DOM — лише h() / textContent (SECURITY §4).
import { h, mount } from '../core/dom.js';
import { openRowMenu, closeRowMenu, renameInPlace, isEditing } from './row-menu.js';

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
const ACCESS_FALLBACK = '🚪';
const NET_FALLBACK = '🗄️';

/** K16: картинка блока / предмета з бази сайту (rel — «простір/шлях» від моста) або запасний значок; причини 📌 / 🔨 — у кутах.
 * @param {any} m @param {string} fallback @param {string} [what] */
function rowIcon(m, fallback, what = '') {
  const rel = m && m.icon;
  const ok = typeof rel === 'string' && /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(rel);
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

/**
 * Намалювати список у контейнері, що живе між перемальовуваннями картки. Без змін даних — не перемальовує
 * (меню й поле вводу лишаються); під час перейменування — теж.
 * @param {HTMLElement} el
 * @param {any} d  відповідь моста: { zones: [{ name, n, where }], marks: [{ key, label, pinned, placed, entity, zone, where }], placed, pinned, unpinned, snapshot }
 * @param {{ act: (body: Record<string, string>) => void }} opt  дія меню → POST /api/storage/own
 */
export function renderOwnStorages(el, d, { act }) {
  if (isEditing(el)) return;
  const sig = JSON.stringify([d.zones, d.marks, d.access, d.networks, d.carried, d.stored, d.placed, d.pinned, d.unpinned, d.snapshot?.lastAt]);
  if (shown.get(el) === sig) return;
  shown.set(el, sig);
  closeRowMenu();

  /**
   * @param {HTMLElement} icon @param {string} name @param {string} where @param {any} zone
   * @param {((btn: HTMLElement, nameEl: HTMLElement) => void) | null} onMenu  null — рядок без меню (точка доступу, мережа)
   * @param {string} [extra] @param {any} [m]  рядок моста: chain — літера групи спільного вмісту, hint — підказка рядка
   */
  const row = (icon, name, where, zone, onMenu, extra = '', m = null) => {
    const nameEl = h('span.so-name', { title: name }, name);
    const chain = m && m.chain
      ? h(`span.so-chain.ch${chainHue(m.chainN)}`, { title: `спільний вміст — група ${m.chain}: у всіх місцях із цією літерою й кольором лежить те саме` }, m.chain)
      : h('span.so-chain.none');
    if (!onMenu) return h(`div.so-row${extra}${zoneCls(zone)}`, m && m.hint ? { title: m.hint } : null, icon, nameEl, h('span.so-meta', null, where || ''), chain, h('span.so-nomenu'));
    const btn = h('button.so-menu', {
      type: 'button',
      title: 'Дії',
      'aria-haspopup': 'menu',
      onclick: (/** @type {Event} */ e) => { e.stopPropagation(); onMenu(btn, nameEl); },
    }, '⋯');
    return h(`div.so-row${extra}${zoneCls(zone)}`, null, icon, nameEl, h('span.so-meta', null, where || ''), chain, btn);
  };

  const zones = (d.zones || []).map((/** @type {any} */ z, /** @type {number} */ i) => row(h('span.so-ic', { title: 'зона бази' }, '📍'), z.name, z.where, i,
    (btn, nameEl) => openRowMenu(btn, [
      { id: 'rename', icon: '✏️', label: 'Перейменувати' },
      { sep: true },
      { id: 'delete', icon: '✕', label: 'Видалити зону', kind: 'danger' },
    ], (id) => {
      if (id === 'delete') act({ action: 'unzone', name: z.name });
      else renameInPlace(nameEl, z.name, (to) => act({ action: 'rename-zone', name: z.name, to }));
    }), '.zone'));

  // K16: картинка блока для всіх рядків; 📌 / 🔨 — у кутах значка
  const marks = (d.marks || []).map((/** @type {any} */ m) => row(rowIcon(m, MARK_FALLBACK, m.auto ? (m.why || 'ваше') : ''), m.label || 'Сховище', m.where, m.zone,
    (btn, nameEl) => openRowMenu(btn, [
      ...(m.auto ? [] : [{ id: 'rename', icon: '✏️', label: 'Перейменувати' }, { sep: true }]),
      ...(!m.auto && m.pinned !== false ? [{ id: 'unmark', icon: '📌', label: 'Зняти позначку', hint: m.placed ? 'лишиться 🔨' : '' }] : []),
      { id: 'notmine', icon: '🚫', label: 'Не моє', kind: /** @type {'danger'} */ ('danger'), hint: 'як голосом' },
    ], (id) => {
      if (id === 'rename') renameInPlace(nameEl, m.label || 'Сховище', (to) => act({ action: 'rename-mark', key: m.key, to }));
      else act({ action: id, key: m.key });
    }), '', m));

  const access = (d.access || []).map((/** @type {any} */ a) => row(rowIcon(a, ACCESS_FALLBACK, 'точка доступу: з цього блока ви відкривали особисте сховище'),
    a.label || 'Точка доступу', a.where, a.zone,
    (btn) => openRowMenu(btn, [{ id: 'forget', icon: '✕', label: 'Забути точку доступу', hint: 'відкриєте — згадає' }], () => act({ action: 'forget-access', key: a.key })), '', a));
  const nets = (d.networks || []).map((/** @type {any} */ n) => row(rowIcon(n, NET_FALLBACK, 'мережа'), n.label || 'Мережа', n.where, n.zone, null, '', n));
  const rows = [...(d.marks || []), ...(d.access || []), ...(d.networks || [])];
  /** Рядок легенди / «При собі»: назва групи → вміст. @param {any} what @param {any} text */
  const keyRow = (what, text, cls = '') => h(`div.so-key${cls}`, null, h('span.so-key-what', null, what), h('span.so-key-text', null, text));
  /** Пара легенди «значок — пояснення». @param {any} icon @param {string} text */
  const kv = (icon, text, title = '') => h('span.so-kv', title ? { title } : null, icon, h('span', null, text));
  /** @param {any} x */
  const chip = (x) => h('span.so-chip', null,
    typeof x.icon === 'string' && /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/.test(x.icon) ? h('img.so-blk.sm', { src: `img/items/${x.icon}.png`, alt: '', loading: 'lazy' }) : null,
    `${x.label} · ${x.note}${x.where ? ` → ${x.where}` : ''}`);
  const holders = [
    (d.carried || []).length ? keyRow('При собі', (d.carried || []).map(chip), '.hold') : null,
    (d.stored || []).length ? keyRow('У сховищах', (d.stored || []).map(chip), '.hold') : null,
  ].filter(Boolean);

  const dot = (/** @type {string} */ cls) => h(`span.so-zdot${cls}`);
  const outside = rows.some((/** @type {any} */ m) => m.zone == null);
  const legend = [
    (d.zones || []).length ? keyRow('Зони', [
      (d.zones || []).map((/** @type {any} */ z, /** @type {number} */ i) => kv(dot(zoneCls(i)), z.name)),
      outside ? kv(dot('.so-zout'), 'поза зонами') : null]) : null,
    marks.length || (d.access || []).some((/** @type {any} */ a) => a.placed) ? keyRow('Мітки', [kv('📌', PIN_TEXT, 'у куті значка'), kv('🔨', PLACED_TEXT, 'у куті значка')]) : null,
    access.length || nets.length ? keyRow('Типи', [
      access.length ? kv(ACCESS_FALLBACK, 'точка доступу', 'у рядку — картинка самого блока, якщо вона є') : null,
      nets.length ? kv(NET_FALLBACK, 'мережа', 'у рядку — картинка блока мережі, якщо вона є') : null]) : null,
    rows.some((/** @type {any} */ m) => m.chain) ? keyRow('Зв\'язок', kv([h('span.so-chain.ch0', null, 'А'), h('span.so-chain.ch1', null, 'Б')], 'однакова літера й колір — спільний вміст')) : null,
  ].filter(Boolean);

  mount(el,
    h('div.so-list', null,
      zones.length ? zones : h('div.small.muted', null, 'Зон ще немає — станьте на базі в грі й скажіть або напишіть у чат «тут моя база».'),
      marks, access, nets),
    holders.length ? h('div.so-keys', null, holders) : null,
    legend.length ? h('div.so-keys.legend', null, legend) : null,
    h('div.small.muted', null, 'Дані — з компаньйона (ті самі, що в HUD). ' +
      `Поставлено вами: ${d.placed ?? 0} · позначено: ${d.pinned ?? 0} · «не моє»: ${d.unpinned ?? 0}` +
      (d.snapshot?.lastAt ? ` · знімок гри: ${d.snapshot.lastContainers} сховищ за ${d.snapshot.lastWorkMs} мс` : '')));
}
