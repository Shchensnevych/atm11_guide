// @ts-check
// Картка мода для довідника і списків.
import { h } from '../core/dom.js';
import { modBadges } from './badge.js';
import { featRow } from './feat.js';

/** Логотип мода або літера-заглушка. @param {ModEntry} m @param {boolean} [big] */
export function modLogo(m, big) {
  const cls = `.mod-logo${big ? '.big' : ''}`;
  return m.logo ? h(`img${cls}`, { src: m.logo, alt: '', loading: 'lazy' }) : h(`div${cls}`, null, (m.name || m.id)[0].toUpperCase());
}

/** @param {Store} s @param {ModEntry} m */
export function modCard(s, m) {
  const n = (m.counts?.item || 0) + (m.counts?.block || 0);
  const parentName = m.parent ? (s.modById.get(m.parent)?.name || m.parent) : null;
  return h('a.card.mod-card', { href: `#/mod/${m.id}` },
    h('div.mod-card-head', null,
      modLogo(m),
      h('h3.mod-card-title', null, m.name)),
    h('div.mod-card-badges', null, modBadges(s, m)),
    parentName ? h('div.mod-card-parent', null,
      h('span.mod-parent-arrow', null, '↳'),
      ' доповнення до ',
      h('span.mod-parent-name', null, parentName)) : null,
    h('div.mod-card-desc', null, m.uk || m.desc_en || ''),
    h('div.mod-card-foot', null,
      h('span.mod-card-count', null, 'Предметів і блоків: ', h('b', null, n ? String(n) : '—')),
      featRow(m.features || [], (m.dims || []).map((d) => d.name))));
}

/** Короткі посилання-бейджі на моди. @param {Store} s @param {string[]} ids */
export function modLinks(s, ids) {
  return h('div.badges', null, (ids || []).map((id) => {
    const m = s.modById.get(id); const c = m && s.classById.get(m.cls?.[0]);
    return h('a.badge', { href: `#/mod/${id}`, onclick: (e) => e.stopPropagation(), style: { '--c': c?.color || 'var(--muted)' } }, m ? m.name : id);
  }));
}
