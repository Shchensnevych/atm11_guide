// @ts-check
// HTML-шар над схемою глави (як картки дорожньої карти): назви квестів, галочки «виконано», піктограми квестів без іконки предмета.
// Cytoscape малює лише вузли, іконки й стрілки; тут — текст. Назви розставляються без накладань: спершу вибраний / наведений квест,
// його сусіди й великі вузли; кожна назва пробує місце під вузлом, над ним, праворуч, ліворуч — і ховається, якщо всюди тісно.
import { h } from '../core/dom.js';

const MIN_LABEL_R = 11, GAP = 3;

/**
 * @param {any} cy @param {HTMLElement} host контейнер, у якому лежить полотно Cytoscape (position: relative)
 * @param {Map<string, { label: string, glyph?: string, done?: boolean, cls?: string }>} meta
 * @param {{ all?: boolean }} [o] all: false — назви лише вибраного й наведеного квесту (як у книзі в грі)
 */
export function attachLabels(cy, host, meta, o = {}) {
  const layer = h('div.ql-layer', { 'aria-hidden': 'true' });
  host.appendChild(layer);
  /** @type {Map<string, { el: HTMLElement, chk: HTMLElement | null, gl: HTMLElement | null, w: number, h: number }>} */
  const items = new Map();
  for (const [id, m] of meta) {
    const el = h('div.ql' + (m.cls ? '.' + m.cls : ''), null, m.label);
    const chk = m.done ? h('div.ql-chk', null, '✔') : null;
    const gl = m.glyph ? h('div.ql-gl' + (m.glyph === '∅' ? '.miss' : ''), { title: m.glyph === '∅' ? 'Предмет мода, якого немає в збірці' : null }, m.glyph) : null;
    layer.append(el, ...(chk ? [chk] : []), ...(gl ? [gl] : []));
    items.set(id, { el, chk, gl, w: 0, h: 0 });
  }
  for (const it of items.values()) { it.w = it.el.offsetWidth; it.h = it.el.offsetHeight; it.el.style.visibility = 'hidden'; }
  let hover = '', raf = 0;

  const layout = () => {
    raf = 0;
    const W = layer.clientWidth, H = layer.clientHeight - 24;      // знизу — рядок підказки
    const sel = cy.$('node:selected'); const selId = sel.length ? sel.id() : '';
    const near = new Set(sel.length ? sel.neighborhood('node').map((/** @type {any} */ n) => n.id()) : []);
    /** @type {{ id: string, x: number, y: number, r: number, pri: number }[]} */
    const vis = [];
    cy.nodes().forEach((/** @type {any} */ n) => {
      const it = items.get(n.id()); if (!it) return;
      const p = n.renderedPosition(), r = n.renderedWidth() / 2;
      const on = p.x + r > -40 && p.x - r < W + 40 && p.y + r > -40 && p.y - r < H + 40 && n.visible();
      const fade = cy.getElementById(n.id()).hasClass('faded') ? '0.32' : '';
      if (it.chk) {
        it.chk.style.opacity = fade;
        const s = Math.max(12, Math.min(20, r * 0.6));
        it.chk.style.display = on && r >= 7 ? '' : 'none';
        Object.assign(it.chk.style, { left: `${p.x + r * 0.68 - s / 2}px`, top: `${p.y - r * 0.68 - s / 2}px`, width: `${s}px`, height: `${s}px`, fontSize: `${s * 0.62}px` });
      }
      if (it.gl) {
        it.gl.style.opacity = fade;
        it.gl.style.display = on && r >= 6 ? '' : 'none';
        Object.assign(it.gl.style, { left: `${p.x}px`, top: `${p.y}px`, fontSize: `${Math.max(9, r * 0.95)}px` });
      }
      if (!on) { it.el.style.visibility = 'hidden'; return; }
      const id = n.id();
      const pri = id === hover ? 100 : id === selId ? 90 : near.has(id) ? 50 + r : r + (n.hasClass('done') || n.hasClass('started') ? 2 : 0);
      vis.push({ id, x: p.x, y: p.y, r, pri });
    });
    vis.sort((a, b) => b.pri - a.pri);
    /** @type {number[][]} */
    const placed = [];
    const nodeBoxes = vis.map((v) => [v.x - v.r, v.y - v.r, v.x + v.r, v.y + v.r, v.id]);
    const free = (/** @type {number[]} */ b, /** @type {string} */ own) => {
      if (b[0] < 0 || b[1] < 0 || b[2] > W || b[3] > H) return false;
      for (const p of placed) if (b[0] < p[2] && b[2] > p[0] && b[1] < p[3] && b[3] > p[1]) return false;
      for (const nb of nodeBoxes) if (nb[4] !== own && b[0] < nb[2] && b[2] > nb[0] && b[1] < nb[3] && b[3] > nb[1]) return false;
      return true;
    };
    for (const v of vis) {
      const it = /** @type {any} */ (items.get(v.id)); const forced = v.pri >= 90;
      if (!forced && (v.r < MIN_LABEL_R || o.all === false)) { it.el.style.visibility = 'hidden'; continue; }
      const w = it.w, hh = it.h;
      const cand = [[v.x - w / 2, v.y + v.r + GAP], [v.x - w / 2, v.y - v.r - GAP - hh], [v.x + v.r + GAP + 2, v.y - hh / 2], [v.x - v.r - GAP - 2 - w, v.y - hh / 2]];
      let pos = null;
      for (const [x, y] of cand) { const b = [x, y, x + w, y + hh]; if (free(b, v.id)) { pos = b; break; } }
      if (!pos && forced) pos = [cand[0][0], cand[0][1], cand[0][0] + w, cand[0][1] + hh];   // вибраний / наведений — завжди, поверх
      if (!pos) { it.el.style.visibility = 'hidden'; continue; }
      placed.push(pos);
      it.el.style.visibility = 'visible';
      it.el.style.transform = `translate(${Math.round(pos[0])}px, ${Math.round(pos[1])}px)`;
      it.el.classList.toggle('sel', v.id === selId); it.el.classList.toggle('hov', v.id === hover); it.el.classList.toggle('near', near.has(v.id));
      it.el.classList.toggle('faded', !!selId && v.id !== selId && v.id !== hover && !near.has(v.id));
      it.el.style.zIndex = forced ? '3' : near.has(v.id) ? '2' : '1';
    }
  };
  const schedule = () => {
    if (!layer.isConnected) { window.removeEventListener('resize', schedule); return; }   // сторінку перемальовано
    if (!raf) raf = requestAnimationFrame(layout);
  };
  cy.on('viewport resize select unselect', schedule);
  cy.on('mouseover', 'node', (/** @type {any} */ e) => { hover = e.target.id(); host.style.cursor = 'pointer'; schedule(); });
  cy.on('mouseout', 'node', () => { hover = ''; host.style.cursor = ''; schedule(); });
  window.addEventListener('resize', schedule);
  schedule();
  return { refresh: schedule };
}
