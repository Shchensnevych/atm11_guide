// @ts-check
// components/own-storages.js — «Мої сховища» на сайті #/assistant (K14, HANDOFF компаньйона §4 Б22; рішення користувача
// 2026-11-14 — нарівні з ⚙️ HUD і вікном керування, storage-own-ui.js компаньйона): зони й усе, що гравець поставив або
// позначив; причина — значком рядка фіксованого розміру (варіант B: 📌 позначив, 🔨 поставив, 📌 з кутовим 🔨 — обидві);
// у межах якої бази — смужкою кольору зони ліворуч (варіант 3; поза зонами й рухоме — без смужки) і легендою; меню «⋯» —
// перейменувати, «Зняти позначку» (лише 📌; поставлене лишається), «Не моє» (як голосом), для зони — видалити. Маршрут — лише
// в грі (рішення 11-14). Дані й підписи (`zone`, `where`, `n`) — з моста GET /api/storage/own; дії — POST /api/storage/own.
// DOM — лише h() / textContent (SECURITY §4).
import { h, mount } from '../core/dom.js';
import { openRowMenu, closeRowMenu, renameInPlace, isEditing } from './row-menu.js';

/** Кольорів зон у стилях (класи .so-zc0…so-zc5, css/assistant.css; токени --zone-*); зон більше — по колу. */
export const ZONE_COLORS = 6;
/** @param {any} i */
const zoneCls = (i) => (Number.isInteger(i) && i >= 0 ? `.so-zc${i % ZONE_COLORS}` : '');

/** Причина «мого» значком: 📌 позначив, 🔨 поставив, обидві — 📌 з кутовим 🔨 (розмір значка той самий). @param {any} m */
function whyIcon(m) {
  if (m.pinned && m.placed) return h('span.so-ic', { title: 'позначив «це моє» і поставив ти' }, '📌', h('span.so-corner', null, '🔨'));
  if (m.placed) return h('span.so-ic', { title: 'поставив ти' }, '🔨');
  return h('span.so-ic', { title: 'позначив «це моє»' }, '📌');
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
  const sig = JSON.stringify([d.zones, d.marks, d.placed, d.pinned, d.unpinned, d.snapshot?.lastAt]);
  if (shown.get(el) === sig) return;
  shown.set(el, sig);
  closeRowMenu();

  /**
   * @param {HTMLElement} icon @param {string} name @param {string} where @param {any} zone
   * @param {(btn: HTMLElement, nameEl: HTMLElement) => void} onMenu
   */
  const row = (icon, name, where, zone, onMenu, extra = '') => {
    const nameEl = h('span.so-name', null, name);
    const btn = h('button.so-menu', {
      type: 'button',
      title: 'Дії',
      'aria-haspopup': 'menu',
      onclick: (/** @type {Event} */ e) => { e.stopPropagation(); onMenu(btn, nameEl); },
    }, '⋯');
    return h(`div.so-row${extra}${zoneCls(zone)}`, null, icon, nameEl, h('span.so-meta', null, where || ''), btn);
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

  const marks = (d.marks || []).map((/** @type {any} */ m) => row(whyIcon(m), m.label || 'Сховище', m.where, m.zone,
    (btn, nameEl) => openRowMenu(btn, [
      { id: 'rename', icon: '✏️', label: 'Перейменувати' },
      { sep: true },
      ...(m.pinned !== false ? [{ id: 'unmark', icon: '📌', label: 'Зняти позначку', hint: m.placed ? 'лишиться 🔨' : '' }] : []),
      { id: 'notmine', icon: '🚫', label: 'Не моє', kind: /** @type {'danger'} */ ('danger'), hint: 'як голосом' },
    ], (id) => {
      if (id === 'rename') renameInPlace(nameEl, m.label || 'Сховище', (to) => act({ action: 'rename-mark', key: m.key, to }));
      else act({ action: id, key: m.key });
    })));

  const dot = (/** @type {string} */ cls) => h(`span.so-zdot${cls}`);
  const outside = (d.marks || []).some((/** @type {any} */ m) => m.zone == null);
  const zLegend = (d.zones || []).length ? h('div.so-zlegend', null,
    (d.zones || []).map((/** @type {any} */ z, /** @type {number} */ i) => h('span', null, dot(zoneCls(i)), z.name)),
    outside ? h('span', null, dot('.so-zout'), 'поза зонами') : null) : null;

  mount(el,
    h('div.so-list', null,
      zones.length ? zones : h('div.small.muted', null, 'Зон ще немає — станьте на базі в грі й скажіть або напишіть у чат «тут моя база».'),
      marks),
    zLegend,
    marks.length ? h('div.so-legend', null, '📌 позначив «це моє» · 🔨 поставив ти · дані — з компаньйона (ті самі, що в HUD)') : null,
    h('div.small.muted', null,
      `Поставлено вами: ${d.placed ?? 0} · позначено: ${d.pinned ?? 0} · «не моє»: ${d.unpinned ?? 0}` +
      (d.snapshot?.lastAt ? ` · знімок гри: ${d.snapshot.lastContainers} сховищ за ${d.snapshot.lastWorkMs} мс` : '')));
}
