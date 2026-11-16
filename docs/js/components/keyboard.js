// @ts-check
// Графічна клавіатура (ANSI TKL 87 — як у користувача, Hator Skyfall TKL PRO; або повна 104 з цифровим блоком) і миша.
// Клавіша = сполучення «шар|прив'язка» з keys-model.analyze(); колір — стан (free/one/multi/maybe/conflict). Розміри — у u (CSS --u).
import { h } from '../core/dom.js';
import { stateOf } from '../core/keys-model.js';
import { K, ROWS, ROW_Y, NAV, PAD } from '../core/kb-layout.js';

/** Модифікатори шарів: які клавіші «натиснуті». */
const LAYER_KEYS = { S: ['left.shift', 'right.shift'], C: ['left.control', 'right.control'], A: ['left.alt', 'right.alt'], F3: ['f3'] };
const CTX_ORDER = ['game', 'held', 'vehicle', 'gui', 'debug'];

/** Усі прив'язки цифрового блока (щоб показати їх окремо на TKL). */
export const isPad = (/** @type {string} */ b) => b.startsWith(K + 'keypad.') || b === K + 'num.lock';

/** Головна дія для підпису на клавіші: спершу «у світі», потім з предметом… @param {KeyAct[]} acts */
export function mainAct(acts) {
  return [...acts].sort((a, b) => CTX_ORDER.indexOf(a.ctx) - CTX_ORDER.indexOf(b.ctx) || (b.imp ? 1 : 0) - (a.imp ? 1 : 0))[0];
}

/**
 * @typedef {{layout: 'tkl'|'full', layer: string, by: Map<string, {acts: KeyAct[], lvl: number}>, sel?: string, hl?: string,
 *   color?: 'state'|'cat', cat?: string, planned?: Set<string>,
 *   onPick: (bind: string) => void, onHover: (bind: string | null, ev?: MouseEvent) => void}} KbOpts
 */

/** @param {KbOpts} o @param {string} name @param {number} x @param {number} y @param {number} w @param {number} hh @param {string} [cap] */
function keyEl(o, name, x, y, w = 1, hh = 1, cap) {
  const pos = { left: `calc(var(--u) * ${x})`, top: `calc(var(--u) * ${y})`, width: `calc(var(--u) * ${w} - var(--kg))`, height: `calc(var(--u) * ${hh} - var(--kg))` };
  if (!name) return h('div.kb-key.dead', { style: pos }, h('span.kb-cap', null, cap || ''));
  const bind = K + name;
  return cell(o, bind, `div.kb-key${(LAYER_KEYS[o.layer] || []).includes(name) ? '.down' : ''}`, pos, cap ?? name.toUpperCase());
}

/** Клавіша / кнопка миші: позначка, колір (стан або категорія), лічильник дій; без підписів дій (вони — у виносках і правій колонці).
 * @param {KbOpts} o @param {string} bind @param {string} sel @param {Record<string, string> | null} pos @param {string} cap */
function cell(o, bind, sel, pos, cap) {
  const v = o.by.get(o.layer + '|' + bind);
  const main = v ? mainAct(v.acts) : null;
  const inCat = !o.cat || !!v?.acts.some((a) => a.cat === o.cat);
  const guiOnly = v && v.acts.every((a) => a.ctx === 'gui');
  const cls = `${sel}.st-${stateOf(v)}${o.color === 'cat' && main ? '.bycat' : ''}${guiOnly ? '.gui' : ''}${inCat ? '' : '.dim'}`
    + `${o.sel === bind ? '.sel' : ''}${o.hl === bind ? '.hl' : ''}${o.planned?.has(o.layer + '|' + bind) ? '.planned' : ''}`;
  return h(cls, {
    style: { ...(pos || {}), '--cc': main ? `var(--cat-${main.cat})` : null }, tabindex: v ? 0 : null, 'data-bind': bind,
    onclick: () => o.onPick(bind), onkeydown: (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter') o.onPick(bind); },
    onmouseenter: (/** @type {MouseEvent} */ e) => o.onHover(v ? bind : null, e), onmouseleave: () => o.onHover(null),
  }, h('span.kb-cap', null, cap), v && v.acts.length > 1 ? h('span.kb-n', null, String(v.acts.length)) : null);
}

/** Клавіатура. @param {KbOpts} o */
export function keyboard(o) {
  const full = o.layout === 'full';
  const keys = [];
  ROWS.forEach((row, i) => {
    let x = 0;
    for (const it of row) {
      if (typeof it === 'number') { x += it; continue; }
      const [name, w = 1, cap] = /** @type {[string|null, number?, string?]} */ (it);
      keys.push(keyEl(o, /** @type {string} */ (name), x, ROW_Y[i], w, 1, cap)); x += w;
    }
  });
  for (const [name, x, y, w, hh, cap] of NAV) keys.push(keyEl(o, /** @type {string} */ (name), /** @type {number} */ (x), /** @type {number} */ (y), /** @type {number} */ (w), /** @type {number} */ (hh), /** @type {string} */ (cap)));
  if (full) for (const [name, x, y, w, hh, cap] of PAD) keys.push(keyEl(o, /** @type {string} */ (name), 18.5 + /** @type {number} */ (x), /** @type {number} */ (y), /** @type {number} */ (w ?? 1), /** @type {number} */ (hh ?? 1), /** @type {string} */ (cap ?? String(name).slice(7))));
  const W = full ? 22.5 : 18.25;
  return h('div.kb', { style: { width: `calc(var(--u) * ${W})`, height: 'calc(var(--u) * 6.25)' } }, keys);
}

/** Миша: ЛКМ, ПКМ, коліщатко (СКМ), бічні 4 і 5. @param {KbOpts} o */
export function mouse(o) {
  /** @param {string} n @param {string} cls @param {string} cap */
  const btn = (n, cls, cap) => cell(o, 'key.mouse.' + n, `div.ms-btn.${cls}`, null, cap);
  return h('div.ms', null, btn('left', 'ms-l', 'ЛКМ'), btn('right', 'ms-r', 'ПКМ'), btn('middle', 'ms-m', 'СКМ'),
    btn('5', 'ms-5', '5'), btn('4', 'ms-4', '4'), h('div.ms-body'));
}
