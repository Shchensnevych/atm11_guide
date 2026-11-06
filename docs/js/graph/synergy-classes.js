// @ts-check
// Мапа синергій (G7) — огляд «класи ↔ класи»: класи модів по колу, лінія між двома класами — скільки синергій поєднує
// їхні моди (за головним класом мода; товщина — кількість). Наведення — зв'язки класу, клік — моди класу. Без «клубка»:
// 13 вузлів замість 112, а моди — у списку й у вигляді «мод у центрі».
import { mainCls, clsColor } from './syn-model.js';

const NS = 'http://www.w3.org/2000/svg';
/** @param {string} tag @param {Record<string, any>} [a] */
function el(tag, a = {}) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) if (v != null) e.setAttribute(k, String(v)); return e; }

/**
 * @param {Store} s @param {import('./syn-model.js').SynEdge[]} edges
 * @param {{ active?: string, onPick: (cls: string) => void }} o
 */
export function classDiagram(s, edges, o) {
  /** @type {Map<string, number>} */
  const pair = new Map();
  /** @type {Map<string, number>} */
  const total = new Map();
  for (const e of edges) {
    const a = mainCls(s, e.from), b = mainCls(s, e.to);
    const k = [a, b].sort().join('|');
    pair.set(k, (pair.get(k) || 0) + 1);
    total.set(a, (total.get(a) || 0) + 1);
    if (b !== a) total.set(b, (total.get(b) || 0) + 1);
  }
  const cls = s.classes.filter((c) => total.has(c.id));
  const W = 800, C = W / 2, R = 240;
  /** @type {Map<string, {x: number, y: number, a: number}>} */
  const P = new Map(cls.map((c, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / cls.length;
    return [c.id, { x: C + R * Math.cos(a), y: C + R * Math.sin(a), a }];
  }));
  const svg = el('svg', { viewBox: `0 0 ${W} ${W}`, class: `syn-classes${o.active ? ' has-active' : ''}`, role: 'img', 'aria-label': 'Синергії між класами модів' });
  const gl = el('g', { class: 'links' });
  const gn = el('g', { class: 'nodes' });
  svg.append(gl, gn);
  const maxN = Math.max(1, ...[...pair.values()]);
  for (const [k, n] of [...pair.entries()].sort((x, y) => x[1] - y[1])) {
    const [a, b] = k.split('|');
    if (a === b) continue;
    const p = P.get(a), q = P.get(b);
    if (!p || !q) continue;
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    const cx = C + (mx - C) * 0.35, cy = C + (my - C) * 0.35;
    const on = o.active && (a === o.active || b === o.active);
    const g = el('g', { class: `lk${on ? ' on' : ''}`, 'data-a': a, 'data-b': b });
    const path = el('path', { d: `M${p.x},${p.y} Q${cx},${cy} ${q.x},${q.y}`, 'stroke-width': (1.2 + 7 * Math.sqrt(n / maxN)).toFixed(1) });
    if (on) path.style.setProperty('--c', clsColor(s, a === o.active ? b : a));
    g.append(path);
    const lx = 0.25 * p.x + 0.5 * cx + 0.25 * q.x, ly = 0.25 * p.y + 0.5 * cy + 0.25 * q.y;
    const t = el('text', { x: lx.toFixed(1), y: (ly + 4).toFixed(1), class: 'cnt' });
    t.textContent = String(n);
    g.append(t);
    gl.append(g);
  }
  for (const c of cls) {
    const p = /** @type {{x: number, y: number, a: number}} */ (P.get(c.id));
    const self = pair.get(`${c.id}|${c.id}`) || 0;
    const g = el('g', { class: `nd${o.active === c.id ? ' on' : ''}`, 'data-cls': c.id, tabindex: 0, role: 'button', 'aria-label': `${c.title}: ${total.get(c.id)} синергій` });
    g.style.setProperty('--c', c.color);
    const r = 20 + 2.2 * Math.sqrt(total.get(c.id) || 1);
    g.append(el('circle', { cx: p.x, cy: p.y, r: r.toFixed(1) }));
    const ic = el('text', { x: p.x, y: p.y + 6, class: 'ic' }); ic.textContent = c.icon || '•'; g.append(ic);
    const out = r + 12, lx = p.x + Math.cos(p.a) * out, ly = p.y + Math.sin(p.a) * out;
    const anchor = Math.abs(Math.cos(p.a)) < 0.3 ? 'middle' : (Math.cos(p.a) > 0 ? 'start' : 'end');
    const dy = Math.sin(p.a) > 0.5 ? 12 : (Math.sin(p.a) < -0.5 ? -4 : 4);
    const lb = el('text', { x: lx.toFixed(1), y: (ly + dy).toFixed(1), 'text-anchor': anchor, class: 'lb' });
    lb.textContent = c.title;
    const sub = el('tspan', { x: lx.toFixed(1), dy: 15, class: 'sub' });
    sub.textContent = `${total.get(c.id)} синергій${self ? ` · ${self} у класі` : ''}`;
    lb.append(sub);
    g.append(lb);
    const hover = (/** @type {boolean} */ v) => gl.querySelectorAll(`g.lk[data-a="${c.id}"], g.lk[data-b="${c.id}"]`).forEach((x) => x.classList.toggle('hover', v));
    g.addEventListener('mouseenter', () => { svg.classList.add('hovering'); hover(true); });
    g.addEventListener('mouseleave', () => { svg.classList.remove('hovering'); hover(false); });
    g.addEventListener('click', () => o.onPick(c.id));
    g.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.onPick(c.id); } });
    gn.append(g);
  }
  return svg;
}
