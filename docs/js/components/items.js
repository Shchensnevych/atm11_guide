// @ts-check
// Іконки предметів (docs/data/items.json): рядок «іконка + назва українською» для сторінки мода; на карті — node-card.js.
import { h } from '../core/dom.js';

/** @param {Store} s @param {string[]} ids */
export function itemList(s, ids) {
  return h('div.item-list', null, (ids || []).map((id) => {
    const it = s.items?.[id];
    return h('span.item-chip', { title: it?.en ? `${it.en} · ${id}` : id },
      h('span.nc-ic', null, it ? h('img', { src: it.img, alt: '', loading: 'lazy' }) : h('span.nc-q', null, '?')),
      h('span', null, it?.uk || it?.en || id));
  }));
}
