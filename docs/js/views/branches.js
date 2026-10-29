// @ts-check
// Список гілок-відгалужень (магічні системи, виміри, великі техмоди).
import { h, mount } from '../core/dom.js';
import { stageBadge } from '../components/badge.js';
import { modLinks } from '../components/modcard.js';
import { clsIcon, featuresOf, featRow } from '../components/feat.js';

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export function render(el, _p, s) {
  mount(el, h('h1', null, 'Гілки'),
    h('p.muted', null, 'Гілка — окремий мод або група модів, у яку можна зануритися: що вона дає для основного прогресу, з чого почати і куди веде.'),
    s.branches.length ? h('div.grid', null, s.branches.map((b) => {
      const c = s.classById.get(b.cls);
      const f = featuresOf(s, b.mods || []);
      return h('a.card.branch-card', { href: `#/branch/${b.id}`, style: { borderLeft: `4px solid ${c?.color || 'var(--accent)'}` } },
        h('div.mod-head', null,
          h('h3', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, clsIcon(b.cls, c?.color) || (b.icon || ''), b.title),
          featRow(f.list, f.dims)),
        h('div.badges', null, b.enter ? stageBadge(s, b.enter) : null),
        h('p.branch-desc', null, b.summary),
        modLinks(s, b.mods));
    })) : h('div.empty', null, 'Гілки з\'являться в наступних сесіях.'));
}
