// @ts-check
// Картка віхи на дереві: заголовок, 2–4 іконки предметів (з підказкою-назвою українською), логотипи модів, піктограми можливостей, значок стану.
import { h } from '../core/dom.js';
import { featuresOf, featRow } from './feat.js';
import { isAutoDone } from '../core/progress.js';

export const CARD = { w: 220, h: 86, tw: 240, th: 92 };   // звичайна / стовбур
const STATE_TIP = { done: 'Зроблено', avail: 'Доступно — можна братися', locked: 'Ще не доступно: спершу попередні кроки' };
const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>';

/**
 * @param {RoadNode} n
 * @param {Store} s
 * @param {{state?: string, items?: Record<string, ItemIcon>}} [o]
 */
export function nodeCard(n, s, o = {}) {
  const c = s.classById.get(n.lane);
  const items = o.items || s.items || {};
  const logos = (n.mods || []).map((id) => s.modById.get(id)).filter(Boolean).slice(0, 2);
  const f = featuresOf(s, n.mods || [], n.features);
  const max = n.trunk ? 4 : 3;
  const el = h('div.ncard' + (n.trunk ? '.trunk' : '') + (n.spoiler ? '.spoil' : ''), { 'data-id': n.id, style: { '--c': n.trunk ? 'var(--accent)' : c?.color } },
    h('div.nc-title', null, n.title),
    logos.length ? h('div.nc-logos', null, logos.map((m) => h('a.nc-logo', { href: `#/mod/${m.id}`, title: `${m.name} — сторінка мода` },
      m.logo ? h('img', { src: m.logo, alt: '', loading: 'lazy' }) : h('span.nc-mono', null, monogram(m.name))))) : null,
    h('div.nc-icons', null, (n.icons || []).slice(0, max).map((id) => {
      const it = items[id];
      return h('span.nc-ic', { title: it ? (it.uk || it.en) + (it.uk && it.en ? ` (${it.en})` : '') : id },
        it ? h('img', { src: it.img, alt: '', loading: 'lazy' }) : h('span.nc-q', null, '?'));
    })),
    h('div.nc-feat', null, n.star ? h('span.nc-star', { title: 'Потрібно для ATM Star (ендгейм)' }, '★') : null, featRow(f.list.slice(0, n.star ? 3 : 4), f.dims)),
    h('span.nc-state', { title: '' }));
  setState(el, o.state || 'avail');
  return el;
}

/** Дві літери для мода без логотипа: «Mystical Agriculture» → MA. @param {string} name */
export function monogram(name) {
  const w = String(name || '?').replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 2)).toUpperCase();
}

/** @param {HTMLElement} el @param {string} st done | avail | locked */
export function setState(el, st) {
  const auto = st === 'done' && isAutoDone(el.dataset.id || '');
  el.classList.remove('done', 'avail', 'locked', 'auto-done'); el.classList.add(st);
  if (auto) el.classList.add('auto-done');
  const b = /** @type {HTMLElement} */ (el.querySelector('.nc-state'));
  b.title = auto ? 'Зроблено (автоматично з сейву гри)' : (STATE_TIP[st] || '');
  b.innerHTML = st === 'done' ? '✔' : st === 'avail' ? '!' : LOCK;
}
