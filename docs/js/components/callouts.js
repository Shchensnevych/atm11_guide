// @ts-check
// Виноски навколо клавіатури: розумне багаторівневе розміщення (1-2 яруси),
// виділені паралельні канали для ліній (шляхи не склеюються і не перекривають один одного),
// стабільна синхронна геометрія без вильотів у космос.
import { h } from '../core/dom.js';
import { roundedPath } from '../graph/tree-svg.js';

const NS = 'http://www.w3.org/2000/svg';
const GAP = 10;          // мінімальний горизонтальний проміжок між картками в одному ярусі
const LANE = 28;         // безпечний коридор від клавіатури до першого ярусу виносок

/**
 * @typedef {{bind: string, text: string, sub?: string, cls?: string}} Callout
 * @param {HTMLElement} stage .kb-stage (position: relative): усередині .co-top, .kb-wrap, .co-bot
 * @param {Callout[]} items
 * @param {{onHover?: (bind: string | null) => void, onPick?: (bind: string) => void}} [o]
 */
export function drawCallouts(stage, items, o = {}) {
  const top = /** @type {HTMLElement} */ (stage.querySelector('.co-top'));
  const bot = /** @type {HTMLElement} */ (stage.querySelector('.co-bot'));
  stage.querySelector('svg.co-lines')?.remove();
  top.replaceChildren();
  bot.replaceChildren();

  if (!items.length) {
    top.style.height = '36px';
    bot.style.height = '10px';
    top.append(h('div.co-hint', null, '💡 Оберіть зону дій у панелі ліворуч, щоб відкрити підписи-виноски'));
    return;
  }

  const sr = stage.getBoundingClientRect();
  const topR = top.getBoundingClientRect();
  const botR = bot.getBoundingClientRect();
  const kbWrap = /** @type {HTMLElement} */ (stage.querySelector('.kb-wrap'));
  const kb = kbWrap.getBoundingClientRect();
  const midY = kb.top + kb.height / 2;

  /** @type {{it: Callout, el: HTMLElement, ax: number, ay: number, up: boolean, w: number, hgt: number, x: number, row: number}[]} */
  const placed = [];

  for (const it of items) {
    const k = stage.querySelector(`[data-bind="${CSS.escape(it.bind)}"]`);
    if (!k) continue;
    const r = k.getBoundingClientRect();
    const up = !it.bind.startsWith('key.mouse.') && (r.top + r.height / 2 < midY);
    const el = h(`div.co${it.cls ? '.' + it.cls : ''}`, {
      'data-bind': it.bind,
      onmouseenter: () => {
        o.onHover?.(it.bind);
        stage.querySelector(`.co-line[data-bind="${CSS.escape(it.bind)}"]`)?.classList.add('lit');
      },
      onmouseleave: () => {
        o.onHover?.(null);
        stage.querySelector(`.co-line[data-bind="${CSS.escape(it.bind)}"]`)?.classList.remove('lit');
      },
      onclick: () => o.onPick?.(it.bind),
    },
      h('div.co-t', null, it.text),
      it.sub ? h('div.co-s', null, it.sub) : null
    );
    const box = up ? top : bot;
    const boxR = up ? topR : botR;
    box.append(el);
    placed.push({
      it,
      el,
      ax: r.left + r.width / 2 - boxR.left,
      ay: (up ? r.top : r.bottom) - sr.top,
      up,
      w: 0,
      hgt: 0,
      x: 0,
      row: 0
    });
  }

  // ── Розумне ярусне розміщення (жадібне пакування по 1–2 рядах без злипання) ──
  for (const band of [true, false]) {
    const list = placed.filter((p) => p.up === band).sort((a, b) => a.ax - b.ax);
    if (!list.length) continue;
    const box = band ? top : bot;
    const W = box.clientWidth || stage.clientWidth || 1000;

    /** @type {number[]} */ const ends = [];
    for (const p of list) {
      p.w = p.el.offsetWidth || 150;
      p.hgt = p.el.offsetHeight || 32;
      const rightPad = p.it.bind.startsWith('key.mouse.') ? 20 : 14;
      const want = Math.max(12, Math.min(W - p.w - rightPad, p.ax - p.w / 2));
      let row = -1;
      let bestShift = Infinity;

      // Шукаємо ярус із найменшим горизонтальним зміщенням від рідної клавіші
      ends.forEach((e, i) => {
        const x = Math.max(want, e + GAP);
        const sh = x - want;
        if (x + p.w <= W - rightPad && sh <= 160 && sh < bestShift - 16) {
          row = i;
          bestShift = sh;
        }
      });

      if (row >= 0) {
        p.x = Math.max(want, ends[row] + GAP);
      } else {
        const maxRows = band ? 2 : 3;
        if (ends.length < maxRows) {
          row = ends.length;
          ends.push(-1e9);
          p.x = want;
        } else {
          let minEndRow = 0;
          for (let r = 1; r < ends.length; r++) {
            if (ends[r] < ends[minEndRow]) minEndRow = r;
          }
          row = minEndRow;
          p.x = Math.max(want, ends[row] + GAP);
        }
      }
      p.x = Math.min(W - p.w - rightPad, p.x);
      p.row = row;
      ends[row] = p.x + p.w;
    }

    const rowH = Math.max(30, ...list.map((p) => p.hgt)) + 6;
    const bandH = ends.length ? ends.length * rowH + LANE : 0;
    box.style.height = `${bandH}px`;

    for (const p of list) {
      p.el.style.left = `${p.x}px`;
      // У верхній смузі відлік від низу (найближчий до клавіш рядок 0 біля LANE)
      // У нижній смузі відлік від верху
      p.el.style[band ? 'bottom' : 'top'] = `${LANE + p.row * rowH}px`;
    }
  }

  // ── Розрахунок трасування ліній з виділеними паралельними каналами ──
  const sr2 = stage.getBoundingClientRect();
  const kb2 = kbWrap.getBoundingClientRect();
  const stageW = stage.clientWidth;
  const stageH = stage.clientHeight;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'co-lines');
  svg.setAttribute('width', String(stageW));
  svg.setAttribute('height', String(stageH));

  const clampX = (/** @type {number} */ x) => Math.max(4, Math.min(stageW - 4, x));
  const clampY = (/** @type {number} */ y) => Math.max(4, Math.min(stageH - 4, y));

  // Окремо сортуємо верхні та нижні для послідовного виділення каналів без перетинів
  for (const band of [true, false]) {
    const list = placed.filter((p) => p.up === band).sort((a, b) => a.ax - b.ax);
    const nItems = list.length;
    if (!nItems) continue;

    list.forEach((p, i) => {
      const k = /** @type {HTMLElement} */ (stage.querySelector(`.kb-wrap [data-bind="${CSS.escape(p.it.bind)}"]`));
      if (!k) return;

      const kr = k.getBoundingClientRect();
      const lr = p.el.getBoundingClientRect();

      const ax = clampX(kr.left + kr.width / 2 - sr2.left);
      const ay = clampY(p.up ? kr.top + 3 - sr2.top : kr.bottom - 3 - sr2.top);
      const ly = clampY(p.up ? lr.bottom - sr2.top : lr.top - sr2.top);
      const kbEdge = clampY(p.up ? kb2.top - sr2.top : kb2.bottom - sr2.top);

      // Горизонтальний коридор: паралельні виділені канали у зоні LANE (шляхи НЕ склеюються)
      // Кожна лінія отримує свій зсув (6, 10, 14, 18, 22 px) від краю клавіатури
      const channelOffset = 6 + (i % 5) * 4;
      const yMid = clampY(p.up
        ? kbEdge - channelOffset
        : kbEdge + channelOffset);

      // З'єднання з карткою: якщо клавіша прямо під/над карткою — пряма вертикаль, інакше до найближчого краю
      let lx = ax;
      const cardLeft = lr.left - sr2.left;
      const cardRight = lr.right - sr2.left;
      if (ax < cardLeft + 12) {
        lx = clampX(cardLeft + 12);
      } else if (ax > cardRight - 12) {
        lx = clampX(cardRight - 12);
      }

      // Якщо клавіша точно під карткою, ведемо пряму вертикальну лінію без вигину
      const pts = Math.abs(lx - ax) < 3
        ? [{ x: ax, y: ay }, { x: ax, y: ly }]
        : [{ x: ax, y: ay }, { x: ax, y: yMid }, { x: lx, y: yMid }, { x: lx, y: ly }];

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'co-line');
      g.setAttribute('data-bind', p.it.bind);

      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', roundedPath(pts, 7));

      const dot = document.createElementNS(NS, 'circle');
      dot.setAttribute('cx', String(ax));
      dot.setAttribute('cy', String(ay));
      dot.setAttribute('r', '3');

      g.append(path, dot);
      svg.append(g);
    });
  }

  stage.prepend(svg);
}

/** Тимчасова лінія між двома елементами (клавіша ↔ рядок у правій колонці). @param {HTMLElement} host position: relative @param {Element|null} a @param {Element|null} b */
export function linkLine(host, a, b) {
  host.querySelector('svg.k-link')?.remove();
  if (!a || !b) return;
  const hr = host.getBoundingClientRect(); const ar = a.getBoundingClientRect(); const br = b.getBoundingClientRect();
  if (br.bottom < hr.top || ar.bottom < hr.top) return;
  const x1 = ar.right - hr.left - 2, y1 = ar.top + ar.height / 2 - hr.top, x2 = br.left - hr.left + 2, y2 = br.top + br.height / 2 - hr.top;
  const mx = Math.max(x1 + 14, x2 - 18);
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'k-link');
  svg.setAttribute('width', String(host.clientWidth)); svg.setAttribute('height', String(host.scrollHeight));
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', roundedPath([{ x: x1, y: y1 }, { x: mx, y: y1 }, { x: mx, y: y2 }, { x: x2, y: y2 }], 10));
  const c1 = document.createElementNS(NS, 'circle'); c1.setAttribute('cx', String(x1)); c1.setAttribute('cy', String(y1)); c1.setAttribute('r', '3.5');
  const c2 = document.createElementNS(NS, 'circle'); c2.setAttribute('cx', String(x2)); c2.setAttribute('cy', String(y2)); c2.setAttribute('r', '3.5');
  svg.append(path, c1, c2); host.append(svg);
}
