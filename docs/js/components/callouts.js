// @ts-check
// Виноски навколо клавіатури (як на схемах «зони клавіатури»): підписи смугами зверху й знизу, лінії до клавіш.
// Лінії — roundedPath з дорожньої карти (graph/tree-svg.js). Розставлення — жадібне по рядах смуги, без накладань.
import { h } from '../core/dom.js';
import { roundedPath } from '../graph/tree-svg.js';

const NS = 'http://www.w3.org/2000/svg';
const GAP = 8;          // між підписами в ряду
const LANE = 26;        // відстань від клавіатури до першого ряду (для горизонтальних відрізків ліній)

/**
 * @typedef {{bind: string, text: string, sub?: string, cls?: string}} Callout
 * @param {HTMLElement} stage .kb-stage (position: relative): усередині .co-top, .kb-wrap, .co-bot
 * @param {Callout[]} items
 * @param {{onHover?: (bind: string | null) => void, onPick?: (bind: string) => void}} [o]
 */
export function drawCallouts(stage, items, o = {}) {
  const top = /** @type {HTMLElement} */ (stage.querySelector('.co-top'));
  const bot = /** @type {HTMLElement} */ (stage.querySelector('.co-bot'));
  stage.querySelector('svg.co-lines')?.remove();
  top.replaceChildren(); bot.replaceChildren(); top.style.height = bot.style.height = '0px';
  if (!items.length) return;
  const sr = stage.getBoundingClientRect();
  const kb = /** @type {HTMLElement} */ (stage.querySelector('.kb-wrap')).getBoundingClientRect();
  const midY = kb.top + kb.height / 2;
  /** @type {{it: Callout, el: HTMLElement, ax: number, ay: number, up: boolean, w: number, hgt: number, x: number, row: number}[]} */
  const placed = [];
  for (const it of items) {
    const k = stage.querySelector(`[data-bind="${CSS.escape(it.bind)}"]`);
    if (!k) continue;
    const r = k.getBoundingClientRect();
    const up = !it.bind.startsWith('key.mouse.') && r.top + r.height / 2 < midY;      // миша — у нижню смугу (там вільніше)
    const el = h(`div.co${it.cls ? '.' + it.cls : ''}`, {
      'data-bind': it.bind, onmouseenter: () => o.onHover?.(it.bind), onmouseleave: () => o.onHover?.(null), onclick: () => o.onPick?.(it.bind),
    }, h('div.co-t', null, it.text), it.sub ? h('div.co-s', null, it.sub) : null);
    (up ? top : bot).append(el);
    placed.push({ it, el, ax: r.left + r.width / 2 - sr.left, ay: (up ? r.top : r.bottom) - sr.top, up, w: 0, hgt: 0, x: 0, row: 0 });
  }
  const W = stage.clientWidth;
  for (const band of [true, false]) {
    const list = placed.filter((p) => p.up === band).sort((a, b) => a.ax - b.ax);
    /** @type {number[]} */ const ends = [];
    for (const p of list) {
      p.w = p.el.offsetWidth; p.hgt = p.el.offsetHeight;
      const want = Math.max(0, Math.min(W - p.w, p.ax - p.w / 2));
      let row = -1; let bestShift = Infinity;                                        // ряд з найменшим зсувом (≤ 170 px) — інакше новий
      ends.forEach((e, i) => { const x = Math.max(want, e + GAP); const sh = x - want; if (x + p.w <= W && sh <= 170 && sh < bestShift - 20) { row = i; bestShift = sh; } });
      if (row >= 0) p.x = Math.max(want, ends[row] + GAP);
      else { row = ends.length; ends.push(-1e9); p.x = want; }
      p.row = row; ends[row] = p.x + p.w;
    }
    const rowH = Math.max(0, ...list.map((p) => p.hgt)) + 8;
    const bandH = ends.length ? ends.length * rowH + LANE : 0;
    const box = band ? top : bot;
    box.style.height = bandH + 'px';
    for (const p of list) {
      p.el.style.left = p.x + 'px';
      p.el.style[band ? 'bottom' : 'top'] = (LANE + p.row * rowH) + 'px';
    }
  }
  // лінії — після того, як смуги отримали висоту (клавіатура зсунулась)
  const sr2 = stage.getBoundingClientRect();
  const kb2 = /** @type {HTMLElement} */ (stage.querySelector('.kb-wrap')).getBoundingClientRect();
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'co-lines'); svg.setAttribute('width', String(stage.clientWidth)); svg.setAttribute('height', String(stage.clientHeight));
  placed.forEach((p, i) => {
    const k = /** @type {HTMLElement} */ (stage.querySelector(`.kb-wrap [data-bind="${CSS.escape(p.it.bind)}"]`));
    const kr = k.getBoundingClientRect(); const lr = p.el.getBoundingClientRect();
    const ax = kr.left + kr.width / 2 - sr2.left, ay = (p.up ? kr.top + 3 : kr.bottom - 3) - sr2.top;
    const lx = Math.max(lr.left + 10, Math.min(lr.right - 10, ax + sr2.left)) - sr2.left;
    const ly = (p.up ? lr.bottom : lr.top) - sr2.top;
    const kbEdge = (p.up ? kb2.top : kb2.bottom) - sr2.top;
    const yMid = p.up ? Math.min(ly + 6 + (i % 4) * 4, kbEdge - 4) : Math.max(ly - 6 - (i % 4) * 4, kbEdge + 4);
    const pts = Math.abs(lx - ax) < 2 ? [{ x: ax, y: ay }, { x: ax, y: ly }] : [{ x: ax, y: ay }, { x: ax, y: yMid }, { x: lx, y: yMid }, { x: lx, y: ly }];
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'co-line'); g.setAttribute('data-bind', p.it.bind);
    const path = document.createElementNS(NS, 'path'); path.setAttribute('d', roundedPath(pts, 8));
    const dot = document.createElementNS(NS, 'circle'); dot.setAttribute('cx', String(ax)); dot.setAttribute('cy', String(ay)); dot.setAttribute('r', '3');
    g.append(path, dot); svg.append(g);
  });
  stage.prepend(svg);
}

/** Тимчасова лінія між двома елементами (клавіша ↔ рядок у правій колонці). @param {HTMLElement} host position: relative @param {Element|null} a @param {Element|null} b */
export function linkLine(host, a, b) {
  host.querySelector('svg.k-link')?.remove();
  if (!a || !b) return;
  const hr = host.getBoundingClientRect(); const ar = a.getBoundingClientRect(); const br = b.getBoundingClientRect();
  if (br.bottom < hr.top || ar.bottom < hr.top) return;
  const x1 = ar.right - hr.left - 2, y1 = ar.top + ar.height / 2 - hr.top, x2 = br.left - hr.left + 2, y2 = br.top + br.height / 2 - hr.top;
  const mx = Math.max(x1 + 14, x2 - 18);
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'k-link');
  svg.setAttribute('width', String(host.clientWidth)); svg.setAttribute('height', String(host.scrollHeight));
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', roundedPath([{ x: x1, y: y1 }, { x: mx, y: y1 }, { x: mx, y: y2 }, { x: x2, y: y2 }], 10));
  const c1 = document.createElementNS(NS, 'circle'); c1.setAttribute('cx', String(x1)); c1.setAttribute('cy', String(y1)); c1.setAttribute('r', '3.5');
  const c2 = document.createElementNS(NS, 'circle'); c2.setAttribute('cx', String(x2)); c2.setAttribute('cy', String(y2)); c2.setAttribute('r', '3.5');
  svg.append(path, c1, c2); host.append(svg);
}
