// @ts-check
// SVG-шар ліній дерева: ортогональні траси ELK із заокругленими кутами, стрілка в кінці, точки-порти на краях карток, підписи на лініях.
// Тип зв'язку — колір і штрих (req суцільна, syn жовта пунктирна, opt точкова).

const NS = 'http://www.w3.org/2000/svg';
export const EDGE_KIND = {
  req: { title: 'потрібно для', color: 'var(--e-req)', dash: '' },            // кольори — токени tokens.css (обидві теми)
  syn: { title: 'синергія (разом краще)', color: 'var(--e-syn)', dash: '7 5' },
  opt: { title: 'варіант / за бажанням', color: 'var(--e-opt)', dash: '2 5' },
};

/** @param {string} tag @param {Record<string, any>} [attrs] */
function el(tag, attrs = {}) { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, String(v)); return e; }

/** Ламана → path із заокругленими кутами. @param {{x: number, y: number}[]} p @param {number} [r] */
export function roundedPath(p, r = 14) {
  if (p.length < 2) return '';
  let d = `M${p[0].x},${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const a = p[i - 1], b = p[i], c = p[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr < 0.5) { d += ` L${b.x},${b.y}`; continue; }
    const p1 = { x: b.x - (b.x - a.x) / l1 * rr, y: b.y - (b.y - a.y) / l1 * rr }, p2 = { x: b.x + (c.x - b.x) / l2 * rr, y: b.y + (c.y - b.y) / l2 * rr };
    d += ` L${p1.x},${p1.y} Q${b.x},${b.y} ${p2.x},${p2.y}`;
  }
  const z = p[p.length - 1];
  return d + ` L${z.x},${z.y}`;
}

/**
 * @param {number} w @param {number} hgt
 * @param {(RoadEdge & {points: {x: number, y: number}[], labelPos: any, r?: number})[]} edges
 */
export function drawEdges(w, hgt, edges) {
  const svg = el('svg', { class: 'tv-edges', width: w, height: hgt, viewBox: `0 0 ${w} ${hgt}` });
  const defs = el('defs'); svg.append(defs);
  for (const [k, v] of Object.entries(EDGE_KIND)) {
    const m = el('marker', { id: `arr-${k}`, viewBox: '0 0 10 10', refX: 8.5, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' });
    m.append(el('path', { d: 'M0,0 L10,5 L0,10 z', style: `fill: ${v.color}` })); defs.append(m);
  }
  /** @type {Map<string, SVGGElement>} */
  const byId = new Map();
  for (const e of edges) {
    if (e.points.length < 2) continue;
    const k = EDGE_KIND[e.kind] || EDGE_KIND.req;
    const g = /** @type {SVGGElement} */ (el('g', { class: `edge ${e.kind}`, 'data-from': e.from, 'data-to': e.to }));
    const pts = e.points.slice(); const last = pts[pts.length - 1], prev = pts[pts.length - 2];
    const len = Math.hypot(last.x - prev.x, last.y - prev.y) || 1;                      // кінець лінії — до вістря стрілки (порт лишається видно)
    pts[pts.length - 1] = { x: last.x - (last.x - prev.x) / len * 5, y: last.y - (last.y - prev.y) / len * 5 };
    const d = roundedPath(pts, e.r || 14);
    g.append(el('path', { class: 'e-glow', d }), el('path', { class: 'e-line', d, style: `stroke: ${k.color}`, 'stroke-dasharray': k.dash || null, 'marker-end': `url(#arr-${e.kind})` }));
    const tip = el('title'); tip.textContent = `${k.title}${e.label ? ` · ${e.label}` : ''}${e.src ? `\nДжерело: ${e.src}` : ''}`; g.append(tip);
    g.append(el('circle', { class: 'port', cx: e.points[0].x, cy: e.points[0].y, r: 4, style: `fill: ${k.color}` }));
    g.append(el('circle', { class: 'port port-target', cx: last.x, cy: last.y, r: 3.2, style: `fill: var(--e-port); stroke: ${k.color}`, 'stroke-width': 2 }));
    if (e.label && e.labelPos) {
      const L = e.labelPos;
      g.append(el('rect', { class: 'e-label-bg', x: L.x, y: L.y, width: L.w, height: L.h, rx: 4 }));
      const t = el('text', { class: 'e-label', x: L.x + L.w / 2, y: L.y + L.h / 2 + 4, 'text-anchor': 'middle' }); t.textContent = e.label; g.append(t);
    }
    svg.append(g); byId.set(`${e.from}>${e.to}`, g);
  }
  return { svg, byId };
}
