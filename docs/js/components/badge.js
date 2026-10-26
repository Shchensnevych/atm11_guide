// @ts-check
// Бейджі класів модів і етапів.
import { h } from '../core/dom.js';
import { clsIcon } from './feat.js';

/** @param {Store} s @param {string} id @param {boolean} [auto] */
export function clsBadge(s, id, auto) {
  const c = s.classById.get(id);
  if (!c) return h('span.badge.ghost', null, id);
  return h(`span.badge${auto ? '.auto' : ''}`, { style: { '--c': c.color }, title: c.desc + (auto ? ' (визначено автоматично)' : '') }, clsIcon(id, c.color), c.title);
}

/** @param {Store} s @param {string} id */
export function stageBadge(s, id) {
  const st = s.stageById.get(id);
  return h('span.badge', { style: { '--c': 'var(--accent)' }, title: st?.goal || '' }, st ? `${st.icon} ${st.n}. ${st.title}` : id);
}

/** Бейджі всіх класів мода. @param {Store} s @param {ModEntry} m */
export const modBadges = (s, m) => h('div.badges', null, (m.cls || []).map((c) => clsBadge(s, c, m.auto)));
