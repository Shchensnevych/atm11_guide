// @ts-check
// Невеликі схеми гілок на jsPlumb: HTML-картки на сітці + стрілки між ними.
import { h } from '../core/dom.js';
import { isDone } from '../core/progress.js';

const CW = 230, CH = 110, PAD = 20;

/**
 * @param {HTMLElement} box контейнер .scheme
 * @param {{id:string,x:number,y:number,title:string,text?:string,spoiler?:boolean}[]} steps
 * @param {[string,string][]} links
 * @param {string} color
 * @param {(id: string) => void} onSelect
 * @param {string} prefix префікс id для прогресу
 */
export function drawScheme(box, steps, links, color, onSelect, prefix) {
  const jp = /** @type {any} */ (window).jsPlumb;
  box.replaceChildren();
  const els = new Map();
  let w = 0, hgt = 0;
  for (const st of steps) {
    const el = h('div.scheme-node', { style: { left: `${PAD + st.x * CW}px`, top: `${PAD + st.y * CH}px`, '--c': color }, onclick: () => onSelect(st.id) },
      h('b', null, (isDone(`${prefix}:${st.id}`) ? '✔ ' : '') + st.title), st.spoiler ? h('span.small.muted', null, 'спойлер') : null);
    if (isDone(`${prefix}:${st.id}`)) el.classList.add('done');
    box.append(el); els.set(st.id, el);
    w = Math.max(w, PAD * 2 + st.x * CW + 200); hgt = Math.max(hgt, PAD * 2 + st.y * CH + 60);
  }
  box.style.height = `${hgt + 20}px`;
  const inner = h('div', { style: { position: 'absolute', width: `${w}px`, height: '1px' } }); box.append(inner);
  if (!jp?.newInstance) return { select() {} };
  const inst = jp.newInstance({ container: box, elementsDraggable: false });
  for (const [a, b] of links) {
    if (!els.has(a) || !els.has(b)) continue;
    inst.connect({ source: els.get(a), target: els.get(b), anchors: ['Right', 'Left'],
      connector: { type: 'Bezier', options: { curviness: 60 } }, endpoint: 'Blank',
      paintStyle: { stroke: '#5b6b82', strokeWidth: 2 }, overlays: [{ type: 'Arrow', options: { location: 1, width: 10, length: 10 } }] });
  }
  return {
    /** @param {string} id */
    select(id) { els.forEach((el, k) => el.classList.toggle('sel', k === id)); },
    /** @param {string} id */
    mark(id) { const el = els.get(id); if (!el) return; const d = isDone(`${prefix}:${id}`); el.classList.toggle('done', d);
      const b = el.querySelector('b'); const st = steps.find((x) => x.id === id); if (b && st) b.textContent = (d ? '✔ ' : '') + st.title; },
  };
}
