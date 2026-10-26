// @ts-check
// Розмежування етапів на полотні (без заливки-градієнтів). Два стилі:
//  rail  — тонкі лінії-межі через усе полотно + «рейка» етапів зліва у вікні: не масштабується, підпис етапу липне до верху, поки етап видно;
//  frame — кожен етап обведено рамкою з заокругленими кутами, назва — вкладкою на верхній рамці (як fieldset).
import { h } from '../core/dom.js';

/**
 * @param {HTMLElement} stage полотно (масштабується)
 * @param {HTMLElement} vp вікно
 * @param {{width: number, bands: {stage: string, y0: number, y1: number}[]}} L
 * @param {Map<string, any>} stageById
 * @param {'rail' | 'frame'} mode
 * @param {(stageId: string) => void} [onPick] клік по етапу на рейці
 */
export function drawBands(stage, vp, L, stageById, mode, onPick) {
  vp.classList.add(`bands-${mode}`);
  if (mode === 'frame') {
    L.bands.forEach((b) => {
      const st = stageById.get(b.stage);
      stage.append(h('div.tv-zone', { style: { top: `${b.y0 + 8}px`, height: `${b.y1 - b.y0 - 16}px`, width: `${L.width - 24}px` } },
        h('div.tv-zone-tab', { title: st.goal }, h('span.n', null, st.n), h('b', null, `${st.icon} ${st.title}`), h('span.g', null, st.goal))));
    });
    return { update() {} };
  }
  L.bands.forEach((b, i) => { if (i) stage.append(h('div.tv-sep', { style: { top: `${b.y0}px`, width: `${L.width}px` } })); });
  const items = L.bands.map((b) => {
    const st = stageById.get(b.stage);
    const lab = h('div.tv-rail-lab', null, h('span.n', null, st.n), h('b', null, st.title), h('span.g', null, st.goal));
    const it = h('div.tv-rail-item', { onclick: () => onPick?.(b.stage), title: `${st.icon} ${st.n}. ${st.title}` }, lab);
    return { b, it, lab };
  });
  const rail = h('div.tv-rail.no-pan', null, items.map((x) => x.it));
  vp.append(rail);
  return {
    /** @param {{x: number, y: number, k: number}} t */
    update(t) {
      for (const { b, it, lab } of items) {
        const top = b.y0 * t.k + t.y, hgt = (b.y1 - b.y0) * t.k;
        it.style.top = `${top}px`; it.style.height = `${hgt}px`;
        // підпис «липне» до верху вікна, доки етап видно, і не виходить за низ етапу
        const off = Math.max(0, Math.min(-top + 8, hgt - lab.offsetHeight - 8));
        lab.style.transform = `translateY(${off}px)`;
      }
    },
  };
}
