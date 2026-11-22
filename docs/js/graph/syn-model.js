// @ts-check
// Мапа синергій (G7 / K36): дані й спільні дрібниці. Синергії — лише з бази (docs/data/mods.json → synergy; кожна пара описана
// один раз модом-власником механізму, з src і ref — сито), сайт нічого не рахує «від себе».
import { h } from '../core/dom.js';
import { clsIcon } from '../components/feat.js';

/** @typedef {{ from: string, to: string, why: string, src: string, ingame?: string }} SynEdge */

/**
 * Українське відмінювання числівників.
 * @param {number} n @param {string} one @param {string} few @param {string} many
 */
export function pluralUk(n, one, few, many) {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a >= 11 && a <= 14) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

/** @param {number} n */
export const synCount = (n) => `${n} ${pluralUk(n, 'синергія', 'синергії', 'синергій')}`;
/** @param {number} n */
export const modCount = (n) => `${n} ${pluralUk(n, 'мод', 'моди', 'модів')}`;

/** Усі синергії бази як ребра «власник механізму → партнер». @param {Store} s @returns {SynEdge[]} */
export function synergyEdges(s) {
  /** @type {SynEdge[]} */
  const out = [];
  for (const m of s.mods) for (const x of /** @type {any[]} */ (m.synergy || [])) {
    if (s.modById.has(x.mod)) out.push({ from: m.id, to: x.mod, why: x.why || '', src: x.src || '', ...(x.ingame ? { ingame: x.ingame } : {}) });
  }
  return out;
}

/**
 * Ребра з урахуванням фільтра етапу: обидва моди пари мають бути вже відкриті до обраного етапу включно
 * (щоб пізній мод на кшталт AllTheModium не протікав у ранній етап) і принаймні один актуальний саме на цьому етапі.
 * @param {Store} s @param {SynEdge[]} all @param {string} stage
 */
export function filterByStage(s, all, stage) {
  if (!stage) return all;
  const order = new Map(s.stages.map((x, i) => [x.id, i]));
  const idx = order.get(stage);
  if (idx == null) return all;
  const minIdx = (/** @type {string} */ id) => {
    const st = /** @type {string[]} */ (/** @type {any} */ (s.modById.get(id))?.stage || []);
    const nums = st.map((x) => order.get(x)).filter((x) => x != null);
    return nums.length ? Math.min(.../** @type {number[]} */ (nums)) : 0;
  };
  const on = (/** @type {string} */ id) => /** @type {any} */ (s.modById.get(id))?.stage?.includes(stage);
  return all.filter((e) => minIdx(e.from) <= idx && minIdx(e.to) <= idx && (on(e.from) || on(e.to)));
}

/** Головний клас мода. @param {Store} s @param {string} id */
export const mainCls = (s, id) => /** @type {any} */ (s.modById.get(id))?.cls?.[0] || 'library';
/** Колір класу. @param {Store} s @param {string} cls */
export const clsColor = (s, cls) => s.classById.get(cls)?.color || '#8b98a9';

/**
 * Короткий підпис етапів мода («Етап 2» / «Етапи 2–6»).
 * @param {Store} s @param {string} id
 */
export function stageRange(s, id) {
  const st = /** @type {string[]} */ (/** @type {any} */ (s.modById.get(id))?.stage || []);
  const ns = st.map((x) => s.stageById.get(x)?.n).filter((x) => x != null).sort((a, b) => a - b);
  if (!ns.length) return '';
  return ns[0] === ns[ns.length - 1] ? `Етап ${ns[0]}` : `Етапи ${ns[0]}–${ns[ns.length - 1]}`;
}

/**
 * Значок мода у квадратному слоті: квадратний логотип з jar або ключовий 3D-предмет мода;
 * якщо логотип є широким банером (співвідношення сторін ≥ 1.6), автоматично підставляється чітка квадратна іконка предмета.
 * @param {Store} s @param {string} id @param {'sm'|'md'|'lg'} [size]
 */
export function modIcon(s, id, size = 'md') {
  const m = /** @type {any} */ (s.modById.get(id));
  const clsId = mainCls(s, id);
  const color = clsColor(s, clsId);
  const mono = () => {
    const ic = clsIcon(clsId, color);
    return h(`span.syn-ic.${size}.mono`, { style: { '--c': color } }, ic || String(m?.name || id)[0].toUpperCase());
  };
  const item = (m?.icons || []).map((/** @type {string} */ x) => s.items[x]?.img).find(Boolean) || '';
  const logo = m?.logo || '';
  const src = logo || item;
  if (!src) return mono();
  const img = /** @type {HTMLImageElement} */ (h(`img.syn-ic.${size}${logo ? '' : '.item'}`, { src, alt: '', style: { '--c': color } }));
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
      else if (ratio >= 2.2 && !item) img.replaceWith(mono());
    }
  };
  img.addEventListener('load', checkBanner);
  img.addEventListener('error', () => { if (!swapToItem()) img.replaceWith(mono()); });
  if (img.complete && img.naturalWidth > 0) checkBanner();
  return img;
}

/** Кількість синергій кожного мода. @param {SynEdge[]} edges */
export function degrees(edges) {
  /** @type {Map<string, number>} */
  const d = new Map();
  for (const e of edges) { d.set(e.from, (d.get(e.from) || 0) + 1); d.set(e.to, (d.get(e.to) || 0) + 1); }
  return d;
}
