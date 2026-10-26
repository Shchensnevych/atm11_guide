// @ts-check
// Граф глави квестів: позиції з книги квестів FTB (x, y), стрілки — залежності, кольори — стан виконання у сейві.
import { isQuestDone, isQuestStarted } from '../core/progress.js';

const SCALE = 70;

/**
 * @param {HTMLElement} container
 * @param {any[]} quests
 * @param {(id: string) => void} onSelect
 * @param {{ initialViewport?: { zoom: number, pan: { x: number, y: number } } | null, onViewport?: (vp: { zoom: number, pan: { x: number, y: number } }) => void }} [o]
 */
export function createQuestGraph(container, quests, onSelect, o = {}) {
  const cytoscape = /** @type {any} */ (window).cytoscape;
  const ids = new Set(quests.map((q) => q.id));
  const els = quests.map((q) => {
    const done = isQuestDone(q.id), started = !done && isQuestStarted(q.id);
    const title = q.title || '?';
    return {
      group: 'nodes',
      data: { id: q.id, label: done ? `✔ ${title}` : started ? `⏳ ${title}` : title, size: 30 * (q.size || 1) },
      classes: [q.optional ? 'opt' : '', q.shape || '', done ? 'done' : started ? 'started' : ''].filter(Boolean).join(' '),
      position: { x: (q.x || 0) * SCALE, y: (q.y || 0) * SCALE },
    };
  });
  for (const q of quests) for (const d of q.deps || []) if (ids.has(d)) {
    els.push({ group: 'edges', data: { id: `${d}>${q.id}`, source: d, target: q.id }, classes: isQuestDone(d) ? 'done' : '' });
  }
  const cy = cytoscape({
    container, elements: els, layout: { name: 'preset' }, wheelSensitivity: 0.25, minZoom: 0.1, maxZoom: 3, autoungrabify: true,
    style: [
      { selector: 'node', style: { width: 'data(size)', height: 'data(size)', shape: 'round-rectangle', 'background-color': '#1b2532', 'border-width': 2, 'border-color': '#5b6b82',
        label: 'data(label)', color: '#c9d4e0', 'font-size': 10, 'text-valign': 'bottom', 'text-margin-y': 4, 'text-wrap': 'wrap', 'text-max-width': 110, 'min-zoomed-font-size': 7 } },
      { selector: 'node.hexagon', style: { shape: 'hexagon' } }, { selector: 'node.circle', style: { shape: 'ellipse' } },
      { selector: 'node.diamond', style: { shape: 'diamond' } }, { selector: 'node.pentagon', style: { shape: 'pentagon' } },
      { selector: 'node.gear', style: { shape: 'star' } }, { selector: 'node.heart', style: { shape: 'heptagon' } },
      { selector: 'node.opt', style: { 'border-style': 'dashed' } },
      { selector: 'node.done', style: { 'background-color': '#143828', 'border-color': '#4ade80', 'border-width': 3, color: '#bbf7d0' } },
      { selector: 'node.started', style: { 'background-color': '#152b3d', 'border-color': '#38bdf8', 'border-width': 2.5, color: '#bae6fd' } },
      { selector: 'node:selected', style: { 'border-color': '#facc15', 'border-width': 4, color: '#facc15' } },
      { selector: 'edge', style: { width: 1.5, 'line-color': '#3d4b60', 'target-arrow-color': '#3d4b60', 'target-arrow-shape': 'triangle', 'curve-style': 'straight', 'arrow-scale': 0.7 } },
      { selector: 'edge.done', style: { width: 2, 'line-color': '#22c55e', 'target-arrow-color': '#22c55e' } },
      { selector: 'edge.hl', style: { width: 3, 'line-color': '#facc15', 'target-arrow-color': '#facc15' } },
    ],
  });
  cy.on('tap', 'node', (ev) => { cy.edges().removeClass('hl'); ev.target.connectedEdges().addClass('hl'); onSelect(ev.target.id()); });
  if (o.initialViewport && Number.isFinite(o.initialViewport.zoom) && o.initialViewport.pan) {
    cy.viewport({ zoom: o.initialViewport.zoom, pan: o.initialViewport.pan });
  } else {
    cy.fit(undefined, 30);
  }
  if (o.onViewport) {
    cy.on('viewport', () => {
      const p = cy.pan();
      o.onViewport?.({ zoom: cy.zoom(), pan: { x: p.x, y: p.y } });
    });
  }
  return cy;
}
