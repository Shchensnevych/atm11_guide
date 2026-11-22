// @ts-check
// Мапа синергій (G7 / K36) — огляд «класи ↔ класи»: класи модів по колу, дуга між двома класами — скільки синергій
// поєднує їхні моди (за головним класом мода; товщина й прозорість — кількість). Наведення на клас або дугу — підсвітка
// й підказка; клік по класу — моди класу, клік по дузі — конкретні синергії між цією парою класів.
import { h } from '../core/dom.js';
import { CLS_ICONS } from '../components/feat.js';
import { mainCls, clsColor, synCount } from './syn-model.js';

const NS = 'http://www.w3.org/2000/svg';
/** @param {string} tag @param {Record<string, any>} [a] */
function el(tag, a = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(a)) if (v != null) e.setAttribute(k, String(v));
  return e;
}

/**
 * Створює вкладений векторний <svg class="ic-svg"> з єдиного набору CLS_ICONS по центру кола.
 * @param {string} clsId @param {number} cx @param {number} cy @param {number} sz
 * @returns {SVGElement | null}
 */
function classIconSvg(clsId, cx, cy, sz) {
  const raw = CLS_ICONS[clsId];
  if (!raw) return null;
  const xml = raw.includes('xmlns=') ? raw : raw.replace('<svg ', `<svg xmlns="${NS}" `);
  const doc = new DOMParser().parseFromString(xml, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.tagName.toLowerCase() !== 'svg') return null;
  const node = /** @type {SVGElement} */ (/** @type {unknown} */ (document.importNode(root, true)));
  node.setAttribute('class', 'ic-svg');
  node.setAttribute('x', (cx - sz / 2).toFixed(1));
  node.setAttribute('y', (cy - sz / 2).toFixed(1));
  node.setAttribute('width', String(sz));
  node.setAttribute('height', String(sz));
  node.setAttribute('aria-hidden', 'true');
  return node;
}

/**
 * @param {Store} s @param {import('./syn-model.js').SynEdge[]} edges
 * @param {{ active?: string, pair?: [string, string] | null, onPick: (cls: string) => void, onPickPair: (a: string, b: string) => void }} o
 */
export function classDiagram(s, edges, o) {
  /** @type {Map<string, number>} */
  const pair = new Map();
  /** @type {Map<string, number>} */
  const total = new Map();
  for (const e of edges) {
    const a = mainCls(s, e.from), b = mainCls(s, e.to);
    const k = [a, b].sort().join('|');
    pair.set(k, (pair.get(k) || 0) + 1);
    total.set(a, (total.get(a) || 0) + 1);
    if (b !== a) total.set(b, (total.get(b) || 0) + 1);
  }
  const cls = s.classes.filter((c) => total.has(c.id));
  const clsName = (/** @type {string} */ id) => s.classById.get(id)?.title || id;
  const W = 800, C = W / 2, R = 236;
  /** @type {Map<string, {x: number, y: number, a: number}>} */
  const P = new Map(cls.map((c, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / Math.max(1, cls.length);
    return [c.id, { x: C + R * Math.cos(a), y: C + R * Math.sin(a), a }];
  }));

  const pairKey = o.pair ? [...o.pair].sort().join('|') : '';
  const hasActive = Boolean(o.active || pairKey);
  const svg = el('svg', { viewBox: `0 0 ${W} ${W}`, class: `syn-classes${hasActive ? ' has-active' : ''}`, role: 'img', 'aria-label': 'Синергії між класами модів' });
  const gl = el('g', { class: 'links' });
  const gn = el('g', { class: 'nodes' });
  svg.append(gl, gn);

  const defaultTip = pairKey && o.pair
    ? `${clsName(o.pair[0])} ↔ ${clsName(o.pair[1])}: ${synCount(pair.get(pairKey) || 0)} · клікніть ще раз, щоб скинути`
    : o.active
      ? `${clsName(o.active)}: ${synCount(total.get(o.active) || 0)} · клікніть по дузі, щоб побачити пару класів`
      : 'Наведіть на клас або лінію · клік по класу — його моди · клік по лінії — зв’язки між парою класів';
  const tip = h('div.syn-wheel-tip.small.muted', null, defaultTip);
  const setTip = (/** @type {string} */ txt) => { tip.textContent = txt || defaultTip; };

  const crossVals = [...pair.entries()].filter(([k]) => { const [a, b] = k.split('|'); return a !== b; }).map(([, n]) => n);
  const maxN = Math.max(1, ...crossVals);

  /** @type {{ x: number, y: number, el: SVGElement, on: boolean }[]} */
  const labels = [];

  for (const [k, n] of [...pair.entries()].sort((x, y) => x[1] - y[1])) {
    const [a, b] = k.split('|');
    if (a === b) continue;
    const p = P.get(a), q = P.get(b);
    if (!p || !q) continue;
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    const cx = C + (mx - C) * 0.34, cy = C + (my - C) * 0.34;
    const on = pairKey ? k === pairKey : Boolean(o.active && (a === o.active || b === o.active));
    const strong = n >= Math.max(4, maxN * 0.35);
    const dStr = `M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${q.x.toFixed(1)},${q.y.toFixed(1)}`;
    const g = el('g', {
      class: `lk${on ? ' on' : ''}${strong ? ' strong' : ''}`,
      'data-a': a, 'data-b': b,
      tabindex: 0, role: 'button',
      'aria-label': `${clsName(a)} та ${clsName(b)}: ${synCount(n)}`,
    });
    const colorFor = on && o.active ? clsColor(s, a === o.active ? b : a) : clsColor(s, (total.get(a) || 0) >= (total.get(b) || 0) ? a : b);
    g.style.setProperty('--c', colorFor);
    g.style.setProperty('--op', (0.22 + 0.48 * Math.sqrt(n / maxN)).toFixed(2));

    const hit = el('path', { d: dStr, class: 'hit' });
    const vis = el('path', { d: dStr, class: 'vis', 'stroke-width': (1.4 + 6.8 * Math.sqrt(n / maxN)).toFixed(1) });
    const title = el('title');
    title.textContent = `${clsName(a)} ↔ ${clsName(b)}: ${synCount(n)}`;
    g.append(title, hit, vis);

    // Розміщуємо підпис трохи зміщено до активного/меншого вузла, щоб цифри не злипались у центрі
    const tParam = o.active ? (a === o.active ? 0.36 : 0.64) : 0.5;
    const u = 1 - tParam;
    const lx = u * u * p.x + 2 * u * tParam * cx + tParam * tParam * q.x;
    const ly = u * u * p.y + 2 * u * tParam * cy + tParam * tParam * q.y;
    const t = el('text', { x: lx.toFixed(1), y: (ly + 4).toFixed(1), class: 'cnt' });
    t.textContent = String(n);
    g.append(t);
    labels.push({ x: lx, y: ly, el: t, on });

    const enter = () => {
      svg.classList.add('hovering');
      g.classList.add('hover');
      gn.querySelectorAll(`g.nd[data-cls="${a}"], g.nd[data-cls="${b}"]`).forEach((nd) => nd.classList.add('peer'));
      setTip(`${clsName(a)} ↔ ${clsName(b)}: ${synCount(n)} — клікніть, щоб переглянути`);
    };
    const leave = () => {
      svg.classList.remove('hovering');
      g.classList.remove('hover');
      gn.querySelectorAll('g.nd.peer').forEach((nd) => nd.classList.remove('peer'));
      setTip('');
    };
    g.addEventListener('mouseenter', enter);
    g.addEventListener('mouseleave', leave);
    g.addEventListener('focus', enter);
    g.addEventListener('blur', leave);
    g.addEventListener('click', () => o.onPickPair(a, b));
    g.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.onPickPair(a, b); } });
    gl.append(g);
  }

  // Легке розведення підписів цифр, щоб при виборі класу сусідні числа ніколи не наїжджали одне на одне
  const activeLabels = labels.filter((l) => l.on);
  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < activeLabels.length; i++) {
      for (let j = i + 1; j < activeLabels.length; j++) {
        const A = activeLabels[i], B = activeLabels[j];
        const dx = B.x - A.x, dy = B.y - A.y;
        const dist = Math.hypot(dx, dy) || 0.1;
        if (dist < 26) {
          const push = (26 - dist) / 2;
          const nx = dx / dist, ny = dy / dist;
          A.x -= nx * push; A.y -= ny * push;
          B.x += nx * push; B.y += ny * push;
        }
      }
    }
  }
  for (const l of activeLabels) {
    l.el.setAttribute('x', l.x.toFixed(1));
    l.el.setAttribute('y', (l.y + 4).toFixed(1));
  }

  const NODE_R = 29;
  const ICON_SZ = 28;
  for (const c of cls) {
    const p = /** @type {{x: number, y: number, a: number}} */ (P.get(c.id));
    const self = pair.get(`${c.id}|${c.id}`) || 0;
    const cnt = total.get(c.id) || 0;
    const isOn = o.active === c.id || Boolean(o.pair && o.pair.includes(c.id));
    const g = el('g', { class: `nd${isOn ? ' on' : ''}`, 'data-cls': c.id, tabindex: 0, role: 'button', 'aria-label': `${c.title}: ${synCount(cnt)}` });
    g.style.setProperty('--c', c.color);
    g.append(el('circle', { class: 'ring', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: String(NODE_R) }));
    const icSvg = classIconSvg(c.id, p.x, p.y, ICON_SZ);
    if (icSvg) g.append(icSvg);
    else {
      const ic = el('text', { x: p.x.toFixed(1), y: (p.y + 6).toFixed(1), class: 'ic' });
      ic.textContent = c.icon || '•';
      g.append(ic);
    }
    const out = NODE_R + 14, lx = p.x + Math.cos(p.a) * out, ly = p.y + Math.sin(p.a) * out;
    const anchor = Math.abs(Math.cos(p.a)) < 0.3 ? 'middle' : (Math.cos(p.a) > 0 ? 'start' : 'end');
    const dy = Math.sin(p.a) > 0.5 ? 12 : (Math.sin(p.a) < -0.5 ? -4 : 4);
    const lb = el('text', { x: lx.toFixed(1), y: (ly + dy).toFixed(1), 'text-anchor': anchor, class: 'lb' });
    lb.textContent = c.title;
    const sub = el('tspan', { x: lx.toFixed(1), dy: 15, class: 'sub' });
    sub.textContent = `${synCount(cnt)}${self ? ` · ${self} у класі` : ''}`;
    lb.append(sub);
    g.append(lb);

    const hover = (/** @type {boolean} */ v) => {
      svg.classList.toggle('hovering', v);
      gl.querySelectorAll(`g.lk[data-a="${c.id}"], g.lk[data-b="${c.id}"]`).forEach((x) => x.classList.toggle('hover', v));
      setTip(v ? `${c.title}: ${synCount(cnt)}${self ? ` (${self} усередині класу)` : ''} — клікніть, щоб показати моди` : '');
    };
    g.addEventListener('mouseenter', () => hover(true));
    g.addEventListener('mouseleave', () => hover(false));
    g.addEventListener('focus', () => hover(true));
    g.addEventListener('blur', () => hover(false));
    g.addEventListener('click', () => o.onPick(c.id));
    g.addEventListener('keydown', (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); o.onPick(c.id); } });
    gn.append(g);
  }

  return h('div.syn-wheel-wrap', null, svg, tip);
}
