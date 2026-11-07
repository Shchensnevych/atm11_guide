// @ts-check
// Іконки предметів (docs/data/items.json + qicons.json): рядок «іконка + назва українською» для сторінки мода; на карті — node-card.js.
import { h } from '../core/dom.js';
import { itemIconUrl, itemNameUk } from '../core/store.js';

/** @param {Store} s @param {string[]} ids */
export function itemList(s, ids) {
  return h('div.item-list', null, (ids || []).map((id) => {
    const it = s.items?.[id];
    const img = itemIconUrl(s, id);
    const nameUk = itemNameUk(s, id);
    return h('span.item-chip', { title: it?.en ? `${it.en} · ${id}` : id },
      h('span.nc-ic', null, img ? h('img', { src: img, alt: '', loading: 'lazy' }) : h('span.nc-q', null, '?')),
      h('span', null, nameUk));
  }));
}
