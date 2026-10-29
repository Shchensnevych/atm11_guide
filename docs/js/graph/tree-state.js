// @ts-check
// Стани віх як у книзі квестів: done — зроблено; avail — доступно (усі «потрібно для» виконано; без них — хоч один попередник або жодного);
// locked — ще не доступно; na — у цій версії збірки недоступно (поле na). lineage — попередники й наступники для підсвітки шляху.

/** @param {{id: string, na?: string}[]} nodes @param {RoadEdge[]} edges @param {(id: string) => boolean} done */
export function computeStates(nodes, edges, done) {
  const preds = new Map(nodes.map((n) => [n.id, /** @type {RoadEdge[]} */ ([])]));
  for (const e of edges) preds.get(e.to)?.push(e);
  /** @type {Map<string, string>} */
  const st = new Map();
  for (const n of nodes) {
    if (n.na) { st.set(n.id, 'na'); continue; }
    if (done(n.id)) { st.set(n.id, 'done'); continue; }
    const p = preds.get(n.id) || []; const req = p.filter((e) => e.kind === 'req');
    const ok = req.length ? req.every((e) => done(e.from)) : (!p.length || p.some((e) => done(e.from)));
    st.set(n.id, ok ? 'avail' : 'locked');
  }
  return st;
}

/** Усі попередники (up) і наступники (down) вузла. @param {string} id @param {RoadEdge[]} edges */
export function lineage(id, edges) {
  const walk = (start, key, other) => {
    const seen = new Set(); const q = [start];
    while (q.length) { const c = q.pop(); for (const e of edges) if (e[key] === c && !seen.has(e[other])) { seen.add(e[other]); q.push(e[other]); } }
    return seen;
  };
  return { up: walk(id, 'to', 'from'), down: walk(id, 'from', 'to') };
}
