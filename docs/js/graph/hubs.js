// @ts-check
// Оформлення вигляду «За модами»: рамки сузір'їв, хаби (логотипи модів групи, назва, прогрес) і «промені» від хаба до карток.
import { h } from '../core/dom.js';
import { monogram } from '../components/node-card.js';
import { clsIcon } from '../components/feat.js';

const NS = 'http://www.w3.org/2000/svg';

/**
 * @param {HTMLElement} stage
 * @param {any} L результат layoutConstellations
 * @param {Store} s
 * @param {(groupId: string) => void} onHub
 */
export function drawHubs(stage, L, s, onHub) {
  for (const f of L.frames) stage.append(h('div.tv-cframe', { style: { left: `${f.x}px`, top: `${f.y}px`, width: `${f.w}px`, height: `${f.h}px` } }));
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'tv-spokes'); svg.setAttribute('width', String(L.width)); svg.setAttribute('height', String(L.height));
  /** @type {Map<string, SVGElement>} */
  const spokeEls = new Map();
  for (const sp of L.spokes) {
    const c = s.classById.get(L.hubs.find((x) => x.group.id === sp.group)?.group.cls)?.color || '#94a3b8';
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'spoke');
    const ln = document.createElementNS(NS, 'line');
    for (const [k, v] of Object.entries({ x1: sp.a.x, y1: sp.a.y, x2: sp.b.x, y2: sp.b.y, stroke: c })) ln.setAttribute(k, String(v));
    const dot = document.createElementNS(NS, 'circle');
    for (const [k, v] of Object.entries({ cx: sp.b.x, cy: sp.b.y, r: 3.5, fill: c })) dot.setAttribute(k, String(v));
    g.append(ln, dot); svg.append(g); spokeEls.set(sp.id, g);
  }
  stage.append(svg);
  /** @type {Map<string, HTMLElement>} */
  const hubEls = new Map();
  for (const hb of L.hubs) {
    const g = hb.group; const cl = s.classById.get(g.cls);
    const mods = (g.mods || []).map((id) => s.modById.get(id)).filter(Boolean).slice(0, 4);
    const el = h('div.hub', { 'data-group': g.id, title: g.desc || `${g.title}: підсвітити всі віхи групи`, style: { left: `${hb.x}px`, top: `${hb.y}px`, '--c': g.id === 'trunk' ? 'var(--accent)' : cl?.color },
      onclick: () => onHub(g.id) },
      h('div.hub-logos', null, mods.length ? mods.map((m) => m.logo ? h('img', { src: m.logo, alt: '', title: m.name }) : h('span.nc-mono', { title: m.name }, monogram(m.name)))
        : h('span.hub-ic', null, clsIcon(g.cls, cl?.color) || cl?.icon || '★')),
      h('div.hub-title', null, g.title), h('div.hub-n'));
    stage.append(el); hubEls.set(g.id, el);
  }
  return { hubEls, spokeEls };
}
