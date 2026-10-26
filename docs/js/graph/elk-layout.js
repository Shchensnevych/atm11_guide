// @ts-check
// Розкладка дерева через ELK.js (layered, згори вниз, ортогональні траси в обхід карток). Етапи — розділи (partitioning): вузли
// етапу N завжди нижче етапу N−1. Бібліотека (≈1.6 МБ) вантажиться ліниво — лише на сторінці карти.
import { CARD } from '../components/node-card.js';

/** @type {Promise<any> | null} */
let elkP = null;
export function loadElk() {
  const w = /** @type {any} */ (window);
  if (!elkP) elkP = w.ELK ? Promise.resolve(w.ELK) : new Promise((res, rej) => {
    const sc = document.createElement('script'); sc.src = 'vendor/elk.bundled.js';
    sc.onload = () => res(w.ELK); sc.onerror = () => rej(new Error('vendor/elk.bundled.js не завантажився')); document.head.append(sc);
  });
  return elkP;
}

/** Класи, що ростуть ліворуч від стовбура (решта — праворуч). */
export const LEFT_LANES = new Set(['storage', 'logistics', 'farming', 'resources', 'gear', 'exploration']);

export const LEFT = 210, TOP = 20, BAND_PAD = 34;   // колонка підписів етапів, відступ згори, поле смуги над/під картками

/**
 * @param {RoadNode[]} nodes
 * @param {RoadEdge[]} edges
 * @param {{id: string}[]} stages порядок етапів
 * @param {{trunkStraight?: boolean, elk?: Record<string, string>}} [o]
 */
export async function layoutTree(nodes, edges, stages, o = {}) {
  const ELK = await loadElk(); const elk = new ELK();
  const si = new Map(stages.map((s, i) => [s.id, i]));
  const ids = new Set(nodes.map((n) => n.id));
  const es = edges.filter((e) => ids.has(e.from) && ids.has(e.to));
  const trunk = new Set(nodes.filter((n) => n.trunk).map((n) => n.id));
  const usePorts = o.elk?.['trunk.ports'] !== '0';
  // порядок у моделі: ліві гілки → стовбур → праві гілки (ELK зберігає його в межах шару — стовбур посередині)
  const side = (n) => (n.trunk ? 1 : LEFT_LANES.has(n.lane) ? 0 : 2);
  const ordered = nodes.map((n, i) => ({ n, i })).sort((a, b) => side(a.n) - side(b.n) || a.i - b.i).map((x) => x.n);
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': 'DOWN', 'elk.edgeRouting': 'ORTHOGONAL',
      'elk.partitioning.activate': 'true',
      'elk.spacing.nodeNode': '34', 'elk.layered.spacing.nodeNodeBetweenLayers': '54',
      'elk.spacing.edgeNode': '16', 'elk.spacing.edgeEdge': '11',
      'elk.layered.spacing.edgeNodeBetweenLayers': '18', 'elk.layered.spacing.edgeEdgeBetweenLayers': '11',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',   // + порти стовбура посередині → рівна вертикаль
      'elk.layered.layering.strategy': 'LONGEST_PATH_SOURCE',             // вузол — якомога вище (одразу під попередниками)
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.crossingMinimization.forceNodeModelOrder': 'true',
      'elk.edgeLabels.inline': 'true',
      'elk.layered.mergeEdges': 'false',
    },
    children: ordered.map((n) => {
      const w = n.trunk ? CARD.tw : CARD.w, hh = n.trunk ? CARD.th : CARD.h;
      return {
        id: n.id, width: w, height: hh,
        layoutOptions: { 'elk.partitioning.partition': String(si.get(n.stage) ?? 0), ...(n.trunk && usePorts ? { 'elk.portConstraints': 'FIXED_POS' } : {}) },
        // стовбур: порти рівно посередині верху й низу — ELK тягне лінії між ними в одну вертикаль
        ports: n.trunk && usePorts ? [{ id: `${n.id}.in`, x: w / 2, y: 0, width: 1, height: 1, layoutOptions: { 'elk.port.side': 'NORTH' } },
          { id: `${n.id}.out`, x: w / 2, y: hh, width: 1, height: 1, layoutOptions: { 'elk.port.side': 'SOUTH' } }] : undefined,
      };
    }),
    edges: es.map((e, i) => ({
      id: `e${i}`, sources: [trunk.has(e.from) && trunk.has(e.to) && usePorts ? `${e.from}.out` : e.from], targets: [trunk.has(e.from) && trunk.has(e.to) && usePorts ? `${e.to}.in` : e.to],
      labels: e.label ? [{ id: `l${i}`, text: e.label, width: e.label.length * 6.6 + 14, height: 18 }] : [],
      layoutOptions: trunk.has(e.from) && trunk.has(e.to) && o.trunkStraight !== false ? { 'elk.layered.priority.straightness': String(o.elk?.['trunk.straight'] || 20), 'elk.layered.priority.direction': '10' } : {},
    })),
  };
  Object.assign(graph.layoutOptions, Object.fromEntries(Object.entries(o.elk || {}).filter(([k]) => k.startsWith('elk.'))));
  const r = await elk.layout(graph);
  /** @type {Map<string, {x: number, y: number, w: number, h: number}>} */
  const pos = new Map();
  for (const c of r.children) pos.set(c.id, { x: c.x + LEFT, y: c.y + TOP, w: c.width, h: c.height });
  const out = r.edges.map((re, i) => {
    const sec = re.sections?.[0];
    const pts = sec ? [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint].map((p) => ({ x: p.x + LEFT, y: p.y + TOP })) : [];
    const lb = re.labels?.[0];
    return { ...es[i], points: pts, labelPos: lb ? { x: lb.x + LEFT, y: lb.y + TOP, w: lb.width, h: lb.height } : null };
  });
  // смуги етапів: від верху першої картки етапу до низу останньої; межа між сусідніми — посередині проміжку
  const raw = stages.map((s) => {
    const ys = nodes.filter((n) => n.stage === s.id).map((n) => pos.get(n.id)).filter(Boolean);
    return ys.length ? { stage: s.id, y0: Math.min(...ys.map((p) => p.y)), y1: Math.max(...ys.map((p) => p.y + p.h)) } : null;
  }).filter(Boolean);
  const bands = raw.map((b, i) => ({
    stage: b.stage,
    y0: i === 0 ? b.y0 - BAND_PAD : (raw[i - 1].y1 + b.y0) / 2,
    y1: i === raw.length - 1 ? b.y1 + BAND_PAD : (b.y1 + raw[i + 1].y0) / 2,
  }));
  const width = r.width + LEFT + 40, height = (bands.length ? bands[bands.length - 1].y1 : r.height) + TOP;
  return { pos, edges: out, bands, width, height };
}
