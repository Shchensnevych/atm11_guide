// @ts-check
// Мапа синергій (G7): дані й спільні дрібниці. Синергії — лише з бази (docs/data/mods.json → synergy; кожна пара описана
// один раз модом-власником механізму, з src і ref — сито), сайт нічого не рахує «від себе».
import { h } from '../core/dom.js';

/** @typedef {{ from: string, to: string, why: string, src: string, ingame?: string }} SynEdge */

/** Усі синергії бази як ребра «власник механізму → партнер». @param {Store} s @returns {SynEdge[]} */
export function synergyEdges(s) {
  /** @type {SynEdge[]} */
  const out = [];
  for (const m of s.mods) for (const x of /** @type {any[]} */ (m.synergy || [])) {
    if (s.modById.has(x.mod)) out.push({ from: m.id, to: x.mod, why: x.why || '', src: x.src || '', ...(x.ingame ? { ingame: x.ingame } : {}) });
  }
  return out;
}

/** Ребра з урахуванням фільтра етапу (ребро лишається, якщо хоч один мод пари актуальний на етапі). @param {Store} s @param {SynEdge[]} all @param {string} stage */
export function filterByStage(s, all, stage) {
  if (!stage) return all;
  const on = (/** @type {string} */ id) => /** @type {any} */ (s.modById.get(id))?.stage?.includes(stage);
  return all.filter((e) => on(e.from) || on(e.to));
}

/** Головний клас мода. @param {Store} s @param {string} id */
export const mainCls = (s, id) => /** @type {any} */ (s.modById.get(id))?.cls?.[0] || 'library';
/** Колір класу. @param {Store} s @param {string} cls */
export const clsColor = (s, cls) => s.classById.get(cls)?.color || '#8b98a9';

/**
 * Значок мода: логотип з jar; немає — перший ключовий предмет мода (іконка путівника); немає й його — літера на кольорі класу.
 * @param {Store} s @param {string} id @param {'sm'|'md'|'lg'} [size]
 */
export function modIcon(s, id, size = 'md') {
  const m = /** @type {any} */ (s.modById.get(id));
  const color = clsColor(s, mainCls(s, id));
  const mono = () => h(`span.syn-ic.${size}.mono`, { style: { '--c': color } }, String(m?.name || id)[0].toUpperCase());
  const item = (m?.icons || []).map((/** @type {string} */ x) => s.items[x]?.img).find(Boolean);
  const src = m?.logo || item;
  if (!src) return mono();
  const img = h(`img.syn-ic.${size}${m?.logo ? '' : '.item'}`, { src, alt: '', style: { '--c': color } });
  img.addEventListener('error', () => img.replaceWith(mono()), { once: true });
  return img;
}

/** Кількість синергій кожного мода. @param {SynEdge[]} edges */
export function degrees(edges) {
  /** @type {Map<string, number>} */
  const d = new Map();
  for (const e of edges) { d.set(e.from, (d.get(e.from) || 0) + 1); d.set(e.to, (d.get(e.to) || 0) + 1); }
  return d;
}
