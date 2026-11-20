// @ts-check
// Схема глави квестів (як у книзі FTB Quests): позиції x, y з книги, у вузлах — іконки предметів, стрілки — залежності, кольори — стан із сейву.
// Службові квести (AllRightsReserved, невидимі) — лише за перемикачем; посилання на квести інших глав (quest_links) — пунктирні вузли «↗».
// Назви, галочки й піктограми без іконки — HTML-шар graph/quest-labels.js (без накладань, як картки дорожньої карти).
// K25 (вигляд «як у грі», рішення користувача 11-20): вузли непрозорі, іконка 80 %, закритий квест — замочок у куті (не напівпрозорість).
import { iconUrl, isService, questState, taskGlyph, qTitle, questIconId, visibleInGame, imageOf } from '../core/quests-model.js';
import { isQuestDone } from '../core/progress.js';
import { attachLabels } from './quest-labels.js';
import { cssVar } from '../core/theme.js';

const SCALE = 70, BASE = 46;
const SHAPES = { circle: 'ellipse', square: 'rectangle', rsquare: 'round-rectangle', diamond: 'diamond', pentagon: 'pentagon', hexagon: 'hexagon',
  octagon: 'octagon', gear: 'octagon', heart: 'round-heptagon', none: 'ellipse' };

/** Стилі Cytoscape з токенів теми (css/tokens.css: --q-*) — Cytoscape не розуміє var(), тому значення читаються на момент виклику. */
export function getCyThemeStyles() {
  const v = cssVar;
  return [
    { selector: 'node', style: { width: 'data(size)', height: 'data(size)', shape: 'data(shape)', 'background-color': v('--q-node'), 'border-width': 2, 'border-color': v('--q-node-line'),
      'background-image': 'data(img)', 'background-fit': 'none', 'background-width': '80%', 'background-height': '80%', 'background-image-smoothing': 'no',
      'transition-property': 'opacity', 'transition-duration': 200 } },
    { selector: 'node.opt', style: { 'border-style': 'dashed' } },
    { selector: 'node.noshape', style: { 'background-opacity': 0, 'border-width': 0 } },
    { selector: 'node.avail', style: { 'border-color': v('--q-avail'), 'border-width': 2.5 } },
    { selector: 'node.early', style: { 'border-color': v('--q-early') } },
    { selector: 'node.ghost', style: { 'border-style': 'dotted', opacity: 0.45 } },
    { selector: 'node.started', style: { 'background-color': v('--q-start-bg'), 'border-color': v('--q-start'), 'border-width': 3 } },
    { selector: 'node.done', style: { 'background-color': v('--q-done-bg'), 'border-color': v('--q-done'), 'border-width': 3 } },
    { selector: 'node.svc', style: { opacity: 0.35, 'border-style': 'dotted' } },
    { selector: 'node.miss', style: { 'border-style': 'dashed', 'border-color': v('--q-miss'), 'background-color': v('--q-miss-bg') } },
    { selector: 'node.link', style: { 'border-style': 'dashed', 'border-color': v('--q-link') } },
    { selector: 'node.faded', style: { opacity: 0.32 } },
    { selector: 'node:selected', style: { 'border-color': v('--q-avail'), 'border-width': 4, opacity: 1 } },
    { selector: 'edge', style: { width: 2, 'line-color': v('--q-edge'), 'target-arrow-color': v('--q-edge'), 'target-arrow-shape': 'triangle', 'arrow-scale': 1.15,
      'curve-style': 'straight', 'source-distance-from-node': 3, 'target-distance-from-node': 3, opacity: 0.9 } },
    { selector: 'edge.open', style: { 'line-color': v('--q-open'), 'target-arrow-color': v('--q-open-arrow') } },
    { selector: 'edge.done', style: { width: 2.5, 'line-color': v('--q-edge-done'), 'target-arrow-color': v('--q-edge-done') } },
    { selector: 'edge.faint', style: { display: 'none' } },          // у книзі ці лінії сховано — з'являються лише при виборі квесту (hl-in / hl-out)
    { selector: 'edge.faded', style: { opacity: 0.12 } },
    { selector: 'edge.hl-in', style: { width: 3.5, 'line-color': v('--q-hl-in'), 'target-arrow-color': v('--q-hl-in'), opacity: 1, 'line-style': 'solid', 'z-index': 9 } },
    { selector: 'edge.hl-out', style: { width: 2, 'line-color': v('--q-hl-out'), 'target-arrow-color': v('--q-hl-out'), opacity: 0.7, 'line-style': 'solid', 'z-index': 8, 'arrow-scale': 0.9 } },
    { selector: 'edge.hl-out.many', style: { width: 1.3, opacity: 0.45, 'arrow-scale': 0.7 } },
    { selector: 'edge.faint.hl-in, edge.faint.hl-out', style: { display: 'element' } },
  ];
}

/**
 * @param {HTMLElement} container @param {import('../core/quests-model.js').ChapterCtx} ctx
 * @param {{ showSvc?: boolean, names?: boolean, onSelect: (id: string) => void, initialViewport?: { zoom: number, pan: { x: number, y: number } } | null,
 *   onViewport?: (vp: { zoom: number, pan: { x: number, y: number } }) => void }} o
 */
export function createQuestGraph(container, ctx, o) {
  const cytoscape = /** @type {any} */ (window).cytoscape;
  const qs = ctx.quests.filter((q) => o.showSvc || !isService(q));
  const ids = new Set(qs.map((q) => q.id)); const st = new Map(qs.map((q) => [q.id, questState(q, ctx)]));
  /** @type {Map<string, { label: string, glyph?: string, done?: boolean, cls?: string }>} */
  const meta = new Map();
  /** @type {any[]} */
  const els = qs.map((q) => {
    const s = st.get(q.id) || ''; const url = iconUrl(questIconId(q, ctx), ctx.qicons); const miss = !url && q.missing?.length;
    // без іконки: предмет мода, якого немає в збірці (∅ — текстури ніде немає), або завдання без предмета (галочка, структура…)
    const ghost = q.vis && visibleInGame(q, ctx) === false;          // у книзі в грі цього квесту ще не видно (hide_until_deps_*)
    meta.set(q.id, { label: qTitle(q, ctx), glyph: url ? undefined : miss ? '∅' : (q.tasks?.[0] ? taskGlyph(q.tasks[0]) : '•'), done: s === 'done', cls: [s, miss ? 'miss' : '', ghost ? 'ghost' : ''].filter(Boolean).join('.') || undefined });
    return { group: 'nodes', position: { x: (q.x || 0) * SCALE, y: (q.y || 0) * SCALE },
      data: { id: q.id, size: BASE * (q.size || 1), shape: SHAPES[q.shape] || 'ellipse', img: url || 'none' },
      classes: [s, q.optional ? 'opt' : '', isService(q) ? 'svc' : '', q.shape === 'none' ? 'noshape' : '', miss ? 'miss' : '', ghost ? 'ghost' : ''].filter(Boolean).join(' ') };
  });
  const linkOf = new Map();                                   // квест іншої глави → вузол-посилання на схемі
  for (const l of ctx.links) {
    const x = ctx.ext[l.linked] || {}; const url = iconUrl(x.icon, ctx.qicons);
    linkOf.set(l.linked, l.id);
    meta.set(l.id, { label: `↗ ${x.t || 'інша глава'}`, glyph: url ? undefined : '↗', cls: 'link' });
    els.push({ group: 'nodes', position: { x: (l.x || 0) * SCALE, y: (l.y || 0) * SCALE }, classes: 'link',
      data: { id: l.id, size: BASE * (l.size || 1), shape: SHAPES[l.shape] || 'ellipse', img: url || 'none', href: `#/chapter/${l.chapter}/${l.linked}` } });
  }
  for (const q of qs) for (const d of q.deps || []) {
    const src = ids.has(d) ? d : linkOf.get(d);
    if (!src) continue;
    const sd = ids.has(d) ? st.get(d) === 'done' : ctx.hasProg && isQuestDone(d), td = st.get(q.id) === 'done';
    els.push({ group: 'edges', data: { id: `${src}>${q.id}`, source: src, target: q.id },
      classes: [sd && td ? 'done' : sd ? 'open' : '', q.hdl || ctx.byId.get(d)?.hdtl ? 'faint' : ''].filter(Boolean).join(' ') });
  }
  const cy = cytoscape({
    container, elements: els, layout: { name: 'preset' }, wheelSensitivity: 0.25, minZoom: 0.08, maxZoom: 3, autoungrabify: true,
    style: getCyThemeStyles(),
  });
  const onTheme = () => {                                           // перемикання теми — перемалювати; главу закрито — зняти слухача
    if (cy.destroyed() || !container.isConnected) { window.removeEventListener('themechange', onTheme); return; }
    cy.style(getCyThemeStyles()).update();
  };
  window.addEventListener('themechange', onTheme);
  cy.on('destroy', () => window.removeEventListener('themechange', onTheme));
  cy.on('tap', 'node', (/** @type {any} */ ev) => {
    const href = ev.target.data('href');
    if (href) { location.hash = href; return; }
    o.onSelect(ev.target.id());
  });
  if (o.initialViewport && Number.isFinite(o.initialViewport.zoom) && o.initialViewport.pan) cy.viewport({ zoom: o.initialViewport.zoom, pan: o.initialViewport.pan });
  else cy.fit(undefined, 30);
  if (o.onViewport) cy.on('viewport', () => { const p = cy.pan(); o.onViewport?.({ zoom: cy.zoom(), pan: { x: p.x, y: p.y } }); });
  attachImages(cy, /** @type {HTMLElement} */ (container.parentElement), container, ctx);
  attachLabels(cy, /** @type {HTMLElement} */ (container.parentElement), meta, { all: o.names !== false });
  return cy;
}

/** Виділити квест на схемі: вхідні стрілки (що потрібно) — жовті, вихідні (що відкриває) — помаранчеві, решту приглушено. @param {any} cy @param {string} id */
export function selectQuest(cy, id) {
  clearSelection(cy);
  const n = cy.getElementById(id);
  if (!n || !n.length) return false;
  const out = n.outgoers('edge');
  n.incomers('edge').addClass('hl-in'); out.addClass(out.length > 8 ? 'hl-out many' : 'hl-out');   // віяло з десятків стрілок — тонше
  cy.elements().difference(n.closedNeighborhood()).addClass('faded');
  n.select();
  return true;
}

/** Зняти виділення й приглушення. @param {any} cy */
export function clearSelection(cy) {
  cy.elements().removeClass('hl-in hl-out many faded'); cy.$(':selected').unselect();
}

/** Картинки книги на полотні (images глави): координати й розмір — у клітинках книги (центр картинки), поворот, прозорість.
 * Картинка з dependency у грі з'являється лише після виконання того квесту — так само й тут, якщо є сейв.
 * @param {any} cy @param {HTMLElement} host @param {HTMLElement} canvas @param {import('../core/quests-model.js').ChapterCtx} ctx */
function attachImages(cy, host, canvas, ctx) {
  const list = ctx.img.filter((i) => imageOf(i.src, ctx) && !(i.dep && ctx.hasProg && !isQuestDone(i.dep)));
  if (!list.length) return;
  const world = document.createElement('div'); world.className = 'qimg-world';
  for (const i of list) {
    const im = document.createElement('img'); const w = (i.w || 1) * SCALE, hh = (i.h || 1) * SCALE;
    im.src = /** @type {any} */ (imageOf(i.src, ctx))[0]; im.alt = ''; im.loading = 'lazy';
    Object.assign(im.style, { left: `${(i.x || 0) * SCALE - w / 2}px`, top: `${(i.y || 0) * SCALE - hh / 2}px`, width: `${w}px`, height: `${hh}px`,
      transform: i.r ? `rotate(${i.r}deg)` : '', opacity: i.a != null ? String(Math.min(1, i.a / 255)) : '' });
    world.appendChild(im);
  }
  const layer = document.createElement('div'); layer.className = 'qimg-layer'; layer.appendChild(world);
  host.insertBefore(layer, canvas);
  const sync = () => { const p = cy.pan(), z = cy.zoom(); world.style.transform = `translate(${p.x}px, ${p.y}px) scale(${z})`; };
  cy.on('viewport resize', sync); sync();
}
