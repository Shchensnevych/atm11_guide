// @ts-check
// Вигляд «За модами» — сузір'я (як кластери Storage у книзі квестів): у центрі хаб групи (логотипи модів), навколо — картки віх
// на кільцях за етапами (ближче до хаба — ранні етапи; ROADMAP_V2 §6 «Б»). Розстановку сузір'їв і траси зв'язків між ними рахує ELK
// (кожне сузір'я — один прямокутник); зв'язки між групами зведено в одну лінію.
// Розгортання (§6 «А», opt.expand = id групи): група ділиться на під-сузір'я за головним модом віхи (хаб — логотип мода, навколо хаба —
// ключові предмети мода з content/mods «icons»), решта груп стискається до хабів без карток.
// Результат має ту саму форму, що й layoutTree: pos, edges (з points), width, height + hubs, spokes, rings, chips.
import { CARD } from '../components/node-card.js';
import { loadElk } from './elk-layout.js';

export const HUB = { w: 220, h: 142 };                         // хаб: логотипи, назва, прогрес, смуга, дія (css/tree.css .hub)
const PAD = 34, KIND_RANK = { req: 0, syn: 1, opt: 2 }, CHIP = 30;

/** Точка на межі прямокутника (центр c, половини hw, hh) у напрямку до точки p. */
function edgePoint(c, hw, hh, p) {
  const dx = p.x - c.x, dy = p.y - c.y; if (!dx && !dy) return { ...c };
  const t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return { x: c.x + dx * t, y: c.y + dy * t };
}
const overlap = (a, b, m) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + m && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + m;

/**
 * Локальна розкладка одного сузір'я: хаб у (0, 0); ключові предмети (chips) — на внутрішньому кільці; картки — на кільцях за етапами.
 * @param {RoadNode[]} list @param {string[]} [chipIds]
 */
function cluster(list, chipIds = []) {
  const box = (nd) => ({ w: nd.trunk ? CARD.tw : CARD.w, h: nd.trunk ? CARD.th : CARD.h });
  const hub = { x: 0, y: 0, ...HUB };
  const crx = HUB.w / 2 + CHIP, cry = HUB.h / 2 + CHIP;
  const chips = chipIds.map((id, i) => { const a = -Math.PI / 2 + (2 * Math.PI * (i + 0.5)) / chipIds.length; return { id, x: crx * Math.cos(a), y: cry * Math.sin(a), w: CHIP, h: CHIP }; });
  const stages = [...new Set(list.map((n) => n.stage))].sort();
  const ringOf = (n) => stages.indexOf(n.stage);
  const rings = stages.map((st) => list.filter((n) => n.stage === st));
  let pts = []; let radii = [];
  for (let R = chips.length ? 190 : 150; R < 4000; R += 15) {
    radii = stages.map((_, k) => ({ rx: (R + k * R * 0.45) * 1.35 + 40, ry: (R + k * R * 0.45) * 0.8 }));
    pts = list.map((nd) => {
      const k = ringOf(nd), ring = rings[k], i = ring.indexOf(nd), m = ring.length, rr = radii[k];
      const a = -Math.PI / 2 + k * 0.55 + (2 * Math.PI * i) / Math.max(m, 1);
      return { x: rr.rx * Math.cos(a), y: rr.ry * Math.sin(a), ...box(nd) };
    });
    const ok = pts.every((p, i) => !overlap(p, hub, 26) && chips.every((c) => !overlap(p, c, 14)) && pts.every((q, j) => j <= i || !overlap(p, q, 18)));
    if (ok) break;
  }
  const drawRings = list.length > 1 && stages.length > 1;
  const rx = drawRings ? radii.flatMap((r) => [-r.rx, r.rx]) : [], ry = drawRings ? radii.flatMap((r) => [-r.ry - 22, r.ry]) : [];   // кільця й підписи — усередині рамки, не обрізаються
  const xs = pts.flatMap((p) => [p.x - p.w / 2, p.x + p.w / 2]).concat([-HUB.w / 2, HUB.w / 2], chips.flatMap((c) => [c.x - CHIP / 2, c.x + CHIP / 2]), rx);
  const ys = pts.flatMap((p) => [p.y - p.h / 2, p.y + p.h / 2]).concat([-HUB.h / 2, HUB.h / 2], chips.flatMap((c) => [c.y - CHIP / 2, c.y + CHIP / 2]), ry);
  const x0 = Math.min(...xs) - PAD, y0 = Math.min(...ys) - PAD;
  return { pts, chips, rings: drawRings ? stages.map((st, k) => ({ stage: st, ...radii[k] })) : [], x0, y0, w: Math.max(...xs) + PAD - x0, h: Math.max(...ys) + PAD - y0 };
}

/**
 * @param {RoadNode[]} nodes @param {RoadEdge[]} edges
 * @param {{id: string, title: string, cls: string, mods?: string[], desc?: string}[]} groups
 * @param {Record<string, string>} [extra] додаткові параметри ELK (налагодження)
 * @param {{expand?: string, icons?: (modId: string) => string[], modName?: (modId: string) => string}} [opt]
 */
export async function layoutConstellations(nodes, edges, groups, extra = {}, opt = {}) {
  const exp = opt.expand && groups.some((g) => g.id === opt.expand) ? opt.expand : '';
  const base = (n) => n.group || n.lane;
  const subOf = (n) => `${exp}/${n.mods?.[0] || 'hub'}`;                     // під-сузір'я розгорнутої групи — за головним модом віхи
  const gOf = (n) => (exp && base(n) === exp ? subOf(n) : base(n));
  const parent = groups.find((g) => g.id === exp);
  const gs = groups.filter((g) => g.id !== exp && nodes.some((n) => base(n) === g.id)).map((g) => ({ ...g, compact: !!exp }));
  for (const n of nodes) {
    const id = gOf(n); if (gs.some((g) => g.id === id)) continue;
    if (exp && base(n) === exp) {
      const mod = n.mods?.[0];
      gs.unshift({ id, title: mod ? (opt.modName?.(mod) || mod) : n.title, cls: parent?.cls || n.lane, mods: mod ? [mod] : [], sub: true, parent: exp });
    } else gs.push({ id, title: id, cls: n.lane, mods: [], compact: !!exp });
  }
  const shown = (n) => !exp || base(n) === exp;                                // у розгорнутому вигляді картки — лише в групі exp
  const local = new Map(gs.map((g) => [g.id, g.compact ? cluster([]) : cluster(nodes.filter((n) => gOf(n) === g.id),
    g.sub && g.mods[0] ? (opt.icons?.(g.mods[0]) || []).slice(0, 8) : [])]));
  const byId = new Map(nodes.map((n) => [n.id, n]));
  // зв'язки між групами → одна лінія на пару груп
  /** @type {Map<string, {from: string, to: string, kind: string, members: RoadEdge[]}>} */
  const agg = new Map();
  for (const e of edges) {
    const a = byId.get(e.from), b = byId.get(e.to); if (!a || !b || gOf(a) === gOf(b)) continue;
    if (e.kind === 'opt' || gOf(a) === 'trunk' || gOf(b) === 'trunk') continue;   // між сузір'ями — лише синергії й «потрібно» (без стовбура)
    if (exp && base(a) !== exp && base(b) !== exp) continue;                       // розгорнуто: лише зв'язки розгорнутої групи
    const k = `${gOf(a)}>${gOf(b)}`; const cur = agg.get(k) || { from: `g:${gOf(a)}`, to: `g:${gOf(b)}`, kind: e.kind, members: [] };
    cur.members.push(e); if (KIND_RANK[e.kind] < KIND_RANK[cur.kind]) cur.kind = e.kind; agg.set(k, cur);
  }
  const ELK = await loadElk(); const elk = new ELK();
  const aggs = [...agg.values()];
  const r = await elk.layout({
    id: 'root',
    layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': exp ? '50' : '70', 'elk.layered.spacing.nodeNodeBetweenLayers': '110', 'elk.spacing.edgeEdge': '14', 'elk.spacing.edgeNode': '24',
      'elk.layered.spacing.edgeNodeBetweenLayers': '24', 'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
      'elk.aspectRatio': '1.6', 'elk.separateConnectedComponents': 'true', 'elk.spacing.componentComponent': exp ? '50' : '70', 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES', ...extra },
    children: gs.map((g) => ({ id: `g:${g.id}`, width: local.get(g.id).w, height: local.get(g.id).h })),
    edges: aggs.map((a, i) => ({ id: `a${i}`, sources: [a.from], targets: [a.to],
      labels: a.members.length > 1 ? [{ id: `al${i}`, text: `×${a.members.length}`, width: 30, height: 18 }] : [] })),
  });
  const OX = 30, OY = 30;
  /** @type {Map<string, {x: number, y: number, w: number, h: number}>} */
  const pos = new Map(); const hubs = []; const spokes = []; const frames = []; const rings = []; const chips = [];
  for (const c of r.children) {
    const g = gs.find((x) => `g:${x.id}` === c.id); const L = local.get(g.id);
    const cx = c.x + OX - L.x0, cy = c.y + OY - L.y0;            // центр хаба в глобальних координатах
    if (!g.compact) frames.push({ group: g.id, x: c.x + OX, y: c.y + OY, w: L.w, h: L.h });
    hubs.push({ group: g, x: cx - HUB.w / 2, y: cy - HUB.h / 2, w: HUB.w, h: HUB.h });
    for (const rg of L.rings) rings.push({ group: g.id, stage: rg.stage, cx, cy, rx: rg.rx, ry: rg.ry });
    for (const ch of L.chips) chips.push({ id: ch.id, group: g.id, x: cx + ch.x - CHIP / 2, y: cy + ch.y - CHIP / 2, w: CHIP, h: CHIP });
    if (g.compact) continue;
    nodes.filter((n) => shown(n) && gOf(n) === g.id).forEach((n, i) => {
      const p = L.pts[i]; const q = { x: cx + p.x - p.w / 2, y: cy + p.y - p.h / 2, w: p.w, h: p.h }; pos.set(n.id, q);
      const cc = { x: cx + p.x, y: cy + p.y };
      spokes.push({ id: n.id, group: g.id, a: edgePoint({ x: cx, y: cy }, HUB.w / 2, HUB.h / 2, cc), b: edgePoint(cc, p.w / 2, p.h / 2, { x: cx, y: cy }) });
    });
  }
  const center = (id) => { const p = /** @type {any} */ (pos.get(id)); return { x: p.x + p.w / 2, y: p.y + p.h / 2, hw: p.w / 2, hh: p.h / 2 }; };
  const hubC = (gid) => { const hb = hubs.find((x) => x.group.id === gid); return { x: hb.x + HUB.w / 2, y: hb.y + HUB.h / 2 }; };
  // зв'язки всередині сузір'я — дуга, вигнута до хаба
  const inner = edges.filter((e) => pos.has(e.from) && pos.has(e.to) && gOf(byId.get(e.from)) === gOf(byId.get(e.to))).map((e) => {
    const a = center(e.from), b = center(e.to), hc = hubC(gOf(byId.get(e.from)));
    // контрольна точка — на внутрішньому еліпсі посередині дуги між картками: крива йде між кільцем і хабом, не крізь хаб
    const ang = (p) => Math.atan2((p.y - hc.y) / 0.6, p.x - hc.x); let da = ang(b) - ang(a);
    if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    const mid = ang(a) + da / 2, rr = 0.62 * (Math.hypot(a.x - hc.x, (a.y - hc.y) / 0.6) + Math.hypot(b.x - hc.x, (b.y - hc.y) / 0.6)) / 2;
    const ctl = { x: hc.x + Math.cos(mid) * Math.max(rr, HUB.w * 0.75), y: hc.y + Math.sin(mid) * 0.6 * Math.max(rr, HUB.w * 0.75) };
    return { ...e, r: 2000, points: [edgePoint(a, a.hw, a.hh, ctl), ctl, edgePoint(b, b.hw, b.hh, ctl)], labelPos: null };
  });
  const outer = r.edges.map((re, i) => {
    const sec = re.sections?.[0]; const lb = re.labels?.[0];
    const pts = sec ? [sec.startPoint, ...(sec.bendPoints || []), sec.endPoint].map((p) => ({ x: p.x + OX, y: p.y + OY })) : [];
    return { from: aggs[i].from, to: aggs[i].to, kind: aggs[i].kind, members: aggs[i].members, label: lb ? `×${aggs[i].members.length}` : undefined,
      points: pts, labelPos: lb ? { x: lb.x + OX, y: lb.y + OY, w: lb.width, h: lb.height } : null };
  });
  return { pos, edges: [...inner, ...outer], hubs, spokes, frames, rings, chips, expanded: exp, bands: [], width: r.width + OX * 2, height: r.height + OY * 2 };
}
