// @ts-check
// Дерево розвитку v2 (рушій A: ELK + SVG). Два вигляди: «Дерево» (згори вниз, етапи — рейка зліва) і «За модами» (сузір'я).
// Спільне: картки з іконками, лінії, масштаб і рух, мінікарта, стани зроблено / доступно / недоступно, підсвітка шляху (наведення — тимчасово,
// клік — закріплено), фільтр за модом або групою, приховування типів зв'язків, збереження та відновлення трансформації й вибору.
import { h, mount } from '../core/dom.js';
import { featLegend } from '../components/feat.js';
import { isDone, setDone } from '../core/progress.js';
import { nodeCard, setState } from '../components/node-card.js';
import { createPanZoom } from './panzoom.js';
import { createMinimap } from './minimap.js';
import { computeStates, lineage } from './tree-state.js';
import { layoutTree } from './elk-layout.js';
import { layoutConstellations } from './constellation.js';
import { drawEdges, EDGE_KIND } from './tree-svg.js';
import { cssVar } from '../core/theme.js';
import { drawBands } from './stage-bands.js';
import { drawHubs, setHubProgress } from './hubs.js';

const HOVER_IN = 110, HOVER_OUT = 170;   // мс: затримка наведення (без блимання між картками)

/**
 * @param {HTMLElement} host
 * @param {Store} s
 * @param {{
 *   mode?: 'tree' | 'mods',
 *   onSelect?: (id: string) => void,
 *   onProgress?: () => void,
 *   elk?: Record<string, string>,
 *   legendHost?: HTMLElement,
 *   onFeat?: (id: string, on: boolean) => void,
 *   selectedFeat?: Set<string>,
 *   initialTransform?: {x: number, y: number, k: number} | null,
 *   onTransform?: (t: {x: number, y: number, k: number}) => void,
 *   hiddenEdges?: string[],
 *   onHiddenChange?: (hidden: string[]) => void,
 * }} [o]
 */
export async function createTreeView(host, s, o = {}) {
  const mode = o.mode || 'tree'; const onSelect = o.onSelect || (() => {});
  const nodes = s.roadmap.nodes, edges = s.roadmap.edges;
  const vp = h(`div.tv.mode-${mode}`); const stage = h('div.tv-stage'); vp.append(stage, h('div.tv-loading', null, 'Розкладаю карту…'));
  host.replaceChildren(vp);
  const L = mode === 'mods' ? await layoutConstellations(nodes, edges, s.roadmap.groups || [], o.elk, {
    expand: o.expand, icons: (id) => (s.modById.get(id)?.icons || []).filter((x) => s.items[x]), modName: (id) => s.modById.get(id)?.name || id })
    : await layoutTree(nodes, edges, s.stages, { elk: o.elk });
  /** Віхи сузір'я (хаба) gid: за променями розкладки; стиснутий хаб — уся група. @param {string} gid */
  const members = (gid) => { const sp = (L.spokes || []).filter((x) => x.group === gid).map((x) => x.id);
    return sp.length ? sp : nodes.filter((n) => (n.group || n.lane) === gid).map((n) => n.id); };
  vp.querySelector('.tv-loading')?.remove();
  stage.style.width = `${L.width}px`; stage.style.height = `${L.height}px`;
  const bands = mode === 'tree' ? drawBands(stage, vp, L, s.stageById, 'rail', (id) => api.focusStage(id)) : null;
  const deco = mode === 'mods' ? drawHubs(stage, L, s, (gid) => api.filterGroup(gid), o.onExpand) : null;
  const { svg, byId } = drawEdges(L.width, L.height, L.edges); stage.append(svg);
  /** ребро вузлів «from>to» → SVG-елементи (у «За модами» між групами — зведена лінія) @type {Map<string, Element[]>} */
  const edgeEls = new Map();
  for (const e of L.edges) {
    const g = byId.get(`${e.from}>${e.to}`); if (!g) continue;
    for (const m of e.members || [e]) { const k = `${m.from}>${m.to}`; edgeEls.set(k, [...(edgeEls.get(k) || []), g]); }
  }
  const els = (e) => edgeEls.get(`${e.from}>${e.to}`) || [];
  /** @type {Map<string, HTMLElement>} */
  const cards = new Map();
  for (const n of nodes) {
    const p = L.pos.get(n.id); if (!p) continue;
    const el = nodeCard(n, s); el.style.left = `${p.x}px`; el.style.top = `${p.y}px`;
    el.addEventListener('click', (ev) => { if (!/** @type {HTMLElement} */ (ev.target).closest('a')) select(n.id); });
    el.addEventListener('dblclick', () => { setDone(n.id); refresh(); o.onProgress?.(); if (sel === n.id) onSelect(n.id); });
    el.addEventListener('mouseenter', () => hover(n.id)); el.addEventListener('mouseleave', () => hover(''));
    stage.append(el); cards.set(n.id, el);
  }
  let states = new Map(); let sel = ''; /** @type {Set<string> | null} */ let focusSet = null;

  const refresh = () => {
    states = computeStates(nodes, edges, isDone);
    states.forEach((st, id) => { const c = cards.get(id); if (c) setState(c, st); });
    const lit = new Set(edges.filter((e) => isDone(e.from)).flatMap(els));
    for (const g of byId.values()) g.classList.toggle('lit', lit.has(g));
    deco?.hubEls.forEach((el, gid) => {
      const ids = members(gid);
      setHubProgress(el, ids.filter(isDone).length, ids.length);
    });
    mm?.draw();
  };
  /** Підсвітка: шлях вузла id (попередники + наступники) або набір focusSet. @param {string} id */
  const paint = (id) => {
    cards.forEach((c) => c.classList.remove('hl', 'hl-self'));
    for (const g of byId.values()) g.classList.remove('hl');
    deco?.spokeEls.forEach((x) => x.classList.remove('hl')); deco?.hubEls.forEach((x) => x.classList.remove('hl'));
    /** @type {Set<string> | null} */ let on = null;
    if (id) {
      const { up, down } = lineage(id, edges); on = new Set([id, ...up, ...down]);
      for (const e of edges) if ((up.has(e.from) && (e.to === id || up.has(e.to))) || ((e.from === id || down.has(e.from)) && down.has(e.to))) els(e).forEach((g) => g.classList.add('hl'));
      cards.get(id)?.classList.add('hl-self');
    } else if (focusSet) {
      on = focusSet;
      for (const e of edges) if (on.has(e.from) && on.has(e.to)) els(e).forEach((g) => g.classList.add('hl'));
    }
    vp.classList.toggle('hl-mode', !!on);
    if (!on) return;
    on.forEach((x) => cards.get(x)?.classList.add('hl'));
    if (deco) for (const n of nodes) if (on.has(n.id)) { deco.spokeEls.get(n.id)?.classList.add('hl'); deco.hubEls.get(n.group || n.lane)?.classList.add('hl'); }
  };
  let ht = 0;
  const hover = (id) => { clearTimeout(ht); ht = window.setTimeout(() => paint(id || sel), id ? HOVER_IN : HOVER_OUT); };
  /** @param {string} id */
  const select = (id) => {
    sel = id; cards.forEach((c, k) => c.classList.toggle('sel', k === id)); paint(id); onSelect(id);
  };
  vp.addEventListener('click', (ev) => { const t = /** @type {HTMLElement} */ (ev.target); if (!t.closest('.ncard, .hub, .no-pan')) { select(''); } });

  const pz = createPanZoom(vp, stage, { onChange: (t) => { bands?.update(t); mm?.draw(); o.onTransform?.(t); } });
  const mm = createMinimap(vp, { w: L.width, h: L.height, bands: L.bands,
    nodes: () => { const cDone = cssVar('--mm-done'), cTrunk = cssVar('--trunk');            // токени теми — мінікарта перемальовується на 'themechange'
      return nodes.filter((n) => L.pos.has(n.id)).map((n) => { const st = states.get(n.id);
        return { ...L.pos.get(n.id), state: st, color: st === 'done' ? cDone : n.trunk ? cTrunk : s.classById.get(n.lane)?.color || '#888' }; }); } }, pz, vp);
  const hidden = new Set(o.hiddenEdges || []);
  for (const k of hidden) vp.classList.add(`hide-${k}`);
  // легенда: типи ліній (клік — сховати), стани, піктограми можливостей. За замовчуванням — у панелі над картою (o.legendHost)
  const legend = h(`div.tv-legend${o.legendHost ? '.top' : '.no-pan'}`, null,
    h('span.lg-h', null, 'Лінії:'), Object.entries(EDGE_KIND).map(([k, v]) => {
      const it = h(`span.lg-kind${hidden.has(k) ? '.off' : ''}`, { title: 'Клік — сховати / показати', onclick: () => {
        hidden.has(k) ? hidden.delete(k) : hidden.add(k);
        vp.classList.toggle(`hide-${k}`, hidden.has(k));
        it.classList.toggle('off', hidden.has(k));
        o.onHiddenChange?.([...hidden]);
      } },
        h('span', { html: `<svg width="26" height="8"><line x1="1" y1="4" x2="25" y2="4" style="stroke:${v.color}" stroke-width="2.4" stroke-dasharray="${v.dash}"/></svg>` }), v.title);
      return it;
    }),
    h('span.lg-sep'), h('span.lg-h', null, 'Стани:'), h('span', null, '✔ зроблено · ! доступно · 🔒 ще ні · ∅ недоступно'),
    ...(o.hideFeatLegend ? [] : [h('span.lg-sep'), h('span.lg-h', null, 'На картках:'), featLegend(o.onFeat, o.selectedFeat)]));
  if (o.legendHost) mount(o.legendHost, legend);
  vp.append(
    h('div.tv-ctrl.no-pan', null,
      h('button.btn', { title: 'Наблизити', onclick: () => pz.zoomBy(1.25) }, '+'),
      h('button.btn', { title: 'Віддалити', onclick: () => pz.zoomBy(0.8) }, '−'),
      h('button.btn', { title: 'Уся карта', onclick: () => pz.fit(L.width, L.height) }, '⤢'),
      L.expanded && o.onExpand ? h('button.btn', { title: 'Згорнути: усі сузір\'я', onclick: () => o.onExpand?.('') }, '↩') : null),
    ...(o.legendHost ? [] : [legend]));                                   // null у append() дав текст «null» на полотні
  const boxOf = (ids) => {
    const ps = ids.map((i) => L.pos.get(i)).filter(Boolean); if (!ps.length) return null;
    const x0 = Math.min(...ps.map((p) => p.x)), y0 = Math.min(...ps.map((p) => p.y));
    return { x: x0, y: y0, w: Math.max(...ps.map((p) => p.x + p.w)) - x0, h: Math.max(...ps.map((p) => p.y + p.h)) - y0 };
  };
  const resetView = () => {
    if (mode === 'tree') {
      const first = nodes.filter((n) => n.stage === s.stages[0]?.id && L.pos.has(n.id)).map((n) => n.id);
      const b = boxOf(first.length ? first : nodes.slice(0, 1).map((n) => n.id));
      const rail = vp.clientWidth < 800 ? 46 : 176;
      const k = Math.max(0.55, Math.min(0.85, (vp.clientWidth - rail - 110) / (b ? b.w : L.width)));
      pz.centerOn((b ? b.x + b.w / 2 : L.width / 2) - rail / 2 / k, 0, k, 16);
    } else pz.fit(L.width, L.height);
  };
  refresh();
  if (o.initialTransform && Number.isFinite(o.initialTransform.k)) {
    pz.set(o.initialTransform.x, o.initialTransform.y, o.initialTransform.k);
  } else {
    resetView();
  }

  const api = {
    mode, refresh, select, resetView,
    getTransform: () => pz.get(),
    setTransform: (t) => pz.set(t.x, t.y, t.k),
    /** @param {string} id */
    focusNode(id) { const p = L.pos.get(id); if (!p) return; pz.centerOn(p.x + p.w / 2, p.y + p.h / 2, Math.max(pz.get().k, 0.9)); select(id); },
    /** @param {string} stageId */
    focusStage(stageId) { const b = L.bands.find((x) => x.stage === stageId); if (!b) return; const t = pz.get(); pz.centerOn((vp.clientWidth / 2 - t.x) / t.k, b.y0, t.k, 0); },
    /** Підсвітити віхи мода (або '' — скинути). @param {string} modId @param {boolean} [keepTransform] */
    filterMod(modId, keepTransform = false) { focus(modId ? nodes.filter((n) => (n.mods || []).includes(modId)).map((n) => n.id) : null, keepTransform); },
    /** @param {string} gid @param {boolean} [keepTransform] */
    filterGroup(gid, keepTransform = false) { focus(members(gid).filter((id) => L.pos.has(id)), keepTransform); },
    clearFilter() { focusSet = null; select(''); },
    /** Підсвітити набір віх без зміни масштабу (фільтри класів / можливостей); null — скинути. @param {string[] | null} ids */
    highlight(ids) { focusSet = ids ? new Set(ids) : null; paint(sel); },
    fit: () => pz.fit(L.width, L.height),
  };
  /** @param {string[] | null} ids @param {boolean} [keepTransform] */
  function focus(ids, keepTransform = false) {
    focusSet = ids && ids.length ? new Set(ids) : null; sel = ''; cards.forEach((c) => c.classList.remove('sel')); paint('');
    if (!keepTransform) {
      const b = ids && boxOf(ids); if (b) pz.fitBox(b.x, b.y, b.w, b.h, 60, 1);
    }
  }
  return api;
}
