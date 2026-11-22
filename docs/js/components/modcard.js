// @ts-check
// Картка мода для довідника і списків.
import { h } from '../core/dom.js';
import { modBadges } from './badge.js';
import { featRow, clsIcon } from './feat.js';

/**
 * Значок мода (для #/mods, #/mod/<id> і #/chapters):
 * 1) квадратний логотип з jar;
 * 2) якщо логотипа немає або це вузький банер (≥ 1.6) — чітка 3D-іконка ключового предмета мода;
 * 3) якщо в jar немає ані логотипа, ані предметів — акуратна векторна піктограма класу на кольоровій підкладці.
 * @param {Store | null} s @param {ModEntry} m @param {boolean} [big]
 */
export function modLogo(s, m, big) {
  const clsId = m.cls?.[0] || 'library';
  const color = s?.classById?.get(clsId)?.color || '#8b98a9';
  const sz = big ? '.big' : '';
  const fallback = () => {
    const ic = clsIcon(clsId, color);
    return h(`div.mod-logo.mod-logo-cls${sz}`, { style: { '--c': color } }, ic || (m.name || m.id)[0].toUpperCase());
  };
  const item = (m.icons || []).map((x) => s?.items?.[x]?.img).find(Boolean) || '';
  const logo = m.logo || '';
  const src = logo || item;
  if (!src) return fallback();
  const img = /** @type {HTMLImageElement} */ (h(`img.mod-logo${sz}${logo ? '' : '.item'}`, { src, alt: '', loading: 'lazy', style: { '--c': color } }));
  let swapped = !logo;
  const swapToItem = () => {
    if (swapped || !item) return false;
    swapped = true;
    img.classList.add('item');
    img.src = item;
    return true;
  };
  const checkBanner = () => {
    if (!swapped && img.naturalHeight > 0) {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (ratio >= 1.6 && item) swapToItem();
      else if (ratio >= 2.2 && !item) img.replaceWith(fallback());
    }
  };
  img.addEventListener('load', checkBanner);
  img.addEventListener('error', () => { if (!swapToItem()) img.replaceWith(fallback()); });
  if (img.complete && img.naturalWidth > 0) checkBanner();
  return img;
}

/** @param {Store} s @param {ModEntry} m */
export function modCard(s, m) {
  const n = (m.counts?.item || 0) + (m.counts?.block || 0);
  const parentName = m.parent ? (s.modById.get(m.parent)?.name || m.parent) : null;
  return h('a.card.mod-card', { href: `#/mod/${m.id}` },
    h('div.mod-card-head', null,
      modLogo(s, m),
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
