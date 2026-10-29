// @ts-check
// Огляд глави квестів (content/chapters/<файл>.json → data/guide.json): що дає глава, порядок проходження, ключові нагороди, особливості ATM11, чому прихована.
import { h } from '../core/dom.js';
import { hiddenWhy } from '../core/fmt.js';
import { modLinks } from './modcard.js';

/** @param {Store} s @param {any} ch глава з chapters.json @param {any} g огляд або null @param {{ compact?: boolean }} [o] */
export function chapterGuide(s, ch, g, o = {}) {
  const mods = (ch.mods || []).filter((/** @type {string} */ m) => s.modById.has(m));
  const list = (/** @type {string} */ title, /** @type {string[]} */ xs, ordered = false) => xs?.length
    ? [h('h4.q-sec', null, title), h(ordered ? 'ol.cg-list' : 'ul.cg-list', null, xs.map((x) => h('li', null, x)))] : null;
  return h('section.chapter-guide' + (o.compact ? '.compact' : ''), null,
    ch.hidden ? h('div.cg-hidden', null, h('b', null, '🚫 Глава прихована в грі. '), g?.why || hiddenWhy(ch)) : null,
    g?.ov ? h('p.cg-ov', null, g.ov) : (ch.sub ? h('p.muted', null, ch.sub) : null),
    g?.verify ? h('p.small.verify', null, '⚑ Чернетка: частину огляду не підтверджено даними збірки') : null,
    list('Порядок проходження', g?.steps, true),
    list('Ключові нагороди', g?.rewards),
    list('Особливості ATM11', g?.atm),
    mods.length ? [h('h4.q-sec', null, 'Моди глави'), modLinks(s, mods)] : null,
    !g ? h('p.small.muted', null, 'Огляду цієї глави в путівнику ще немає.') : null);
}
