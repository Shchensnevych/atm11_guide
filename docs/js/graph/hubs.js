// @ts-check
// Оформлення вигляду «За модами»: рамки сузір'їв, кільця етапів (пунктирні еліпси з номером етапу), хаби (логотипи модів групи, назва,
// прогрес-смуга), ключові предмети мода навколо хаба під-сузір'я і «промені» від хаба до карток. Нижній рядок хаба — дія «Розгорнути ⤢» / «Згорнути ↩».
import { h } from '../core/dom.js';
import { monogram } from '../components/node-card.js';
import { clsIcon } from '../components/feat.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v)); return e; };

/**
 * @param {HTMLElement} stage
 * @param {any} L результат layoutConstellations
 * @param {Store} s
 * @param {(groupId: string) => void} onHub
 * @param {(groupId: string) => void} [onExpand] розгорнути групу ('' — згорнути)
 */
export function drawHubs(stage, L, s, onHub, onExpand) {
  for (const f of L.frames) stage.append(h('div.tv-cframe', { style: { left: `${f.x}px`, top: `${f.y}px`, width: `${f.w}px`, height: `${f.h}px` } }));
  const svg = svgEl('svg', { class: 'tv-spokes', width: L.width, height: L.height });
  const colorOf = (gid) => { const g = L.hubs.find((x) => x.group.id === gid)?.group; return g?.id === 'trunk' ? 'var(--trunk)' : s.classById.get(g?.cls)?.color || '#94a3b8'; };
  for (const rg of L.rings || []) {                                   // кільця етапів: ближче до хаба — раніше
    const c = colorOf(rg.group); const st = s.stageById.get(rg.stage);
    svg.append(svgEl('ellipse', { class: 'ring', cx: rg.cx, cy: rg.cy, rx: rg.rx, ry: rg.ry, style: `stroke: ${c}` }));
    const t = svgEl('text', { class: 'ring-lab', x: rg.cx, y: rg.cy - rg.ry - 6, 'text-anchor': 'middle', style: `--rc: ${c}` });
    t.textContent = st ? `${st.n}. ${st.title}` : rg.stage; svg.append(t);
  }
  /** @type {Map<string, SVGElement>} */
  const spokeEls = new Map();
  for (const sp of L.spokes) {
    const c = colorOf(sp.group); const g = svgEl('g', { class: 'spoke' });
    g.append(svgEl('line', { x1: sp.a.x, y1: sp.a.y, x2: sp.b.x, y2: sp.b.y, style: `stroke: ${c}` }), svgEl('circle', { cx: sp.b.x, cy: sp.b.y, r: 3.5, style: `fill: ${c}` }));
    svg.append(g); spokeEls.set(sp.id, g);
  }
  stage.append(svg);
  for (const ch of L.chips || []) {                                   // ключові предмети мода (content/mods «icons»)
    const it = s.items[ch.id];
    stage.append(h('span.hub-chip', { title: it ? (it.uk || it.en) : ch.id, style: { left: `${ch.x}px`, top: `${ch.y}px`, '--c': colorOf(ch.group) } },
      it ? h('img', { src: it.img, alt: '' }) : h('span.nc-q', null, '?')));
  }
  /** @type {Map<string, HTMLElement>} */
  const hubEls = new Map();
  for (const hb of L.hubs) {
    const g = hb.group; const cl = s.classById.get(g.cls);
    const mods = (g.mods || []).map((id) => s.modById.get(id)).filter(Boolean).slice(0, 4);
    const nCards = L.spokes.filter((x) => x.group === g.id).length;
    // дія в нижньому рядку (концепт користувача): розгорнути групу / згорнути під-сузір'я / розгорнути стиснуту групу
    const act = !onExpand ? null
      : g.sub ? { text: 'Згорнути', ic: '↩', tip: 'Згорнути: усі сузір\'я', go: '' }
      : g.compact && g.id === 'trunk' ? { text: 'Усі сузір\'я', ic: '↩', tip: 'Згорнути: усі сузір\'я', go: '' }
      : g.compact ? { text: 'Розгорнути', ic: '⤢', tip: `Розгорнути «${g.title}» за модами`, go: g.id }
      : !L.expanded && g.id !== 'trunk' && nCards >= 4 ? { text: 'Розгорнути', ic: '⤢', tip: `Розгорнути «${g.title}» на сузір'я модів`, go: g.id } : null;
    const el = h(`div.hub${g.compact ? '.compact' : ''}${g.sub ? '.sub' : ''}${act ? '.has-act' : ''}`, { 'data-group': g.id,
      title: g.compact ? `${g.title}: розгорнути цю групу` : (g.desc || `${g.title}: підсвітити всі віхи${g.sub ? ' мода' : ' групи'}`),
      style: { left: `${hb.x}px`, top: `${hb.y}px`, '--c': g.id === 'trunk' ? 'var(--accent)' : cl?.color },
      onclick: () => (g.compact && onExpand ? onExpand(g.id === 'trunk' ? '' : g.id) : onHub(g.id)) },
      h('div.hub-logos', null, mods.length ? mods.map((m) => m.logo ? h('img', { src: m.logo, alt: '', title: m.name }) : h('span.nc-mono', { title: m.name }, monogram(m.name)))
        : h('span.hub-ic', null, clsIcon(g.cls, cl?.color) || cl?.icon || '★')),
      h('div.hub-title', null, g.sub && mods[0] ? h('a', { href: `#/mod/${mods[0].id}`, onclick: (e) => e.stopPropagation() }, g.title) : g.title),
      h('div.hub-n'), h('div.hub-bar'),
      act ? h('button.hub-act.no-pan', { type: 'button', title: act.tip, onclick: (e) => { e.stopPropagation(); onExpand?.(act.go); } },
        h('span', null, act.text), h('span.hub-act-ic', null, act.ic)) : null);
    stage.append(el); hubEls.set(g.id, el);
  }
  return { hubEls, spokeEls };
}

/** Прогрес хаба: «зроблено N / M» і сегментна смуга (понад 14 віх — суцільна). @param {HTMLElement} el @param {number} done @param {number} total */
export function setHubProgress(el, done, total) {
  const n = el.querySelector('.hub-n'); if (n) n.textContent = `зроблено ${done} / ${total}`;
  const bar = el.querySelector('.hub-bar'); if (!bar) return;
  if (total > 14) { bar.classList.add('solid'); bar.replaceChildren(h('i.on', { style: { width: `${total ? (100 * done) / total : 0}%` } })); return; }
  bar.replaceChildren(...Array.from({ length: total }, (_, i) => h(`i${i < done ? '.on' : ''}`)));
}
