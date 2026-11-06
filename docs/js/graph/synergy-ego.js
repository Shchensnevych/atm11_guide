// @ts-check
// Мапа синергій (G7) — «мод у центрі»: розкладка ELK layered (той самий рушій, що й дорожня карта) зліва направо:
// ліворуч — моди, на сторінках яких описано синергію з центральним (їхній механізм), посередині — мод, праворуч — синергії,
// описані на сторінці самого мода. Картки — HTML (повні назви й пояснення), лінії — SVG з ортогональними трасами ELK.
import { loadElk } from './elk-layout.js';
import { roundedPath } from './tree-svg.js';

const NS = 'http://www.w3.org/2000/svg';

/**
 * @param {HTMLElement} stage полотно (position: relative), у якому вже є картки (position: absolute) з data-id
 * @param {string} center id центрального мода
 * @param {{ id: string, color: string, side: 'in'|'out' }[]} partners
 * @returns {Promise<{ width: number, height: number }>}
 */
export async function layoutEgo(stage, center, partners) {
  const ELK = await loadElk();
  const elk = new ELK();
  /** @type {Map<string, HTMLElement>} */
  const cards = new Map([...stage.querySelectorAll('[data-id]')].map((el) => [/** @type {HTMLElement} */ (el).dataset.id || '', /** @type {HTMLElement} */ (el)]));
  const size = (/** @type {string} */ id) => ({ width: Math.ceil(cards.get(id)?.offsetWidth || 300), height: Math.ceil(cards.get(id)?.offsetHeight || 80) });
  const nid = (/** @type {string} */ id) => (id === center ? 'c' : `p_${id}`);
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.edgeRouting': 'ORTHOGONAL',
      'elk.layered.spacing.nodeNodeBetweenLayers': '84', 'elk.spacing.nodeNode': '14', 'elk.spacing.edgeEdge': '6',
      'elk.layered.spacing.edgeNodeBetweenLayers': '18', 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX', 'elk.padding': '[top=8,left=8,bottom=8,right=8]',
    },
    children: [{ id: 'c', ...size(center) }, ...partners.map((p) => ({ id: nid(p.id), ...size(p.id) }))],
    edges: partners.map((p, i) => (p.side === 'in' ? { id: `e${i}`, sources: [nid(p.id)], targets: ['c'] } : { id: `e${i}`, sources: ['c'], targets: [nid(p.id)] })),
  };
  const r = await elk.layout(graph);
  /** @type {Map<string, any>} */
  const pos = new Map(r.children.map((/** @type {any} */ c) => [c.id, c]));
  for (const [id, el] of cards) {
    const p = pos.get(nid(id));
    if (!p) continue;
    el.style.left = `${p.x}px`; el.style.top = `${p.y}px`; el.style.visibility = '';
  }
  const width = Math.ceil(r.width), height = Math.ceil(r.height);
  stage.querySelector('svg.syn-lines')?.remove();
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'syn-lines'); svg.setAttribute('width', String(width)); svg.setAttribute('height', String(height));
  for (const e of r.edges || []) {
    const sec = e.sections?.[0];
    if (!sec) continue;
    const pts = [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint];
    const p = partners[Number(String(e.id).slice(1))];
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', roundedPath(pts, 12));
    path.setAttribute('class', 'syn-edge');
    path.setAttribute('data-for', p.id);
    path.style.setProperty('--c', p.color);
    svg.append(path);
  }
  stage.prepend(svg);
  stage.style.width = `${width}px`; stage.style.height = `${height}px`;
  return { width, height };
}
