// @ts-check
// Графічна клавіатура (ANSI TKL 87 — як у користувача, Hator Skyfall TKL PRO; або повна 104 з цифровим блоком) і миша.
// Клавіша = сполучення «шар|прив'язка» з keys-model.analyze(); колір — стан (free/one/multi/maybe/conflict). Розміри — у u (CSS --u).
import { h } from '../core/dom.js';
import { stateOf } from '../core/keys-model.js';

const K = 'key.keyboard.';
/** Рядок: [ім'я GLFW після key.keyboard., ширина u, підпис?]; число — проміжок у u; null-ім'я — неназначувана клавіша (Fn). */
const ROWS = [
  [['escape', 1, 'Esc'], 1, ['f1'], ['f2'], ['f3'], ['f4'], .5, ['f5'], ['f6'], ['f7'], ['f8'], .5, ['f9'], ['f10'], ['f11'], ['f12']],
  [['grave.accent', 1, '`'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'], ['minus', 1, '-'], ['equal', 1, '='], ['backspace', 2, 'Backspace']],
  [['tab', 1.5, 'Tab'], ['q'], ['w'], ['e'], ['r'], ['t'], ['y'], ['u'], ['i'], ['o'], ['p'], ['left.bracket', 1, '['], ['right.bracket', 1, ']'], ['backslash', 1.5, '\\']],
  [['caps.lock', 1.75, 'Caps'], ['a'], ['s'], ['d'], ['f'], ['g'], ['h'], ['j'], ['k'], ['l'], ['semicolon', 1, ';'], ['apostrophe', 1, "'"], ['enter', 2.25, 'Enter']],
  [['left.shift', 2.25, 'Shift'], ['z'], ['x'], ['c'], ['v'], ['b'], ['n'], ['m'], ['comma', 1, ','], ['period', 1, '.'], ['slash', 1, '/'], ['right.shift', 2.75, 'Shift']],
  [['left.control', 1.25, 'Ctrl'], ['left.win', 1.25, 'Win'], ['left.alt', 1.25, 'Alt'], ['space', 6.25, ''], ['right.alt', 1.25, 'Alt'], [null, 1.25, 'Fn'], ['menu', 1.25, 'Menu'], ['right.control', 1.25, 'Ctrl']],
];
const ROW_Y = [0, 1.25, 2.25, 3.25, 4.25, 5.25];
/** Блок навігації (x від 15.25) і цифровий (x від 18.5): [ім'я, x, y, w?, h?, підпис?] */
const NAV = [
  ['print.screen', 15.25, 0, 1, 1, 'PrtSc'], ['scroll.lock', 16.25, 0, 1, 1, 'ScrLk'], ['pause', 17.25, 0, 1, 1, 'Pause'],
  ['insert', 15.25, 1.25, 1, 1, 'Ins'], ['home', 16.25, 1.25, 1, 1, 'Home'], ['page.up', 17.25, 1.25, 1, 1, 'PgUp'],
  ['delete', 15.25, 2.25, 1, 1, 'Del'], ['end', 16.25, 2.25, 1, 1, 'End'], ['page.down', 17.25, 2.25, 1, 1, 'PgDn'],
  ['up', 16.25, 4.25, 1, 1, '↑'], ['left', 15.25, 5.25, 1, 1, '←'], ['down', 16.25, 5.25, 1, 1, '↓'], ['right', 17.25, 5.25, 1, 1, '→'],
];
const PAD = [
  ['num.lock', 0, 1.25, 1, 1, 'Num'], ['keypad.divide', 1, 1.25, 1, 1, '/'], ['keypad.multiply', 2, 1.25, 1, 1, '*'], ['keypad.subtract', 3, 1.25, 1, 1, '-'],
  ['keypad.7', 0, 2.25], ['keypad.8', 1, 2.25], ['keypad.9', 2, 2.25], ['keypad.add', 3, 2.25, 1, 2, '+'],
  ['keypad.4', 0, 3.25], ['keypad.5', 1, 3.25], ['keypad.6', 2, 3.25],
  ['keypad.1', 0, 4.25], ['keypad.2', 1, 4.25], ['keypad.3', 2, 4.25], ['keypad.enter', 3, 4.25, 1, 2, 'Ent'],
  ['keypad.0', 0, 5.25, 2, 1, '0'], ['keypad.decimal', 2, 5.25, 1, 1, '.'],
];
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

/** Порядок прив'язок «як на клавіатурі» (для списку праворуч): ряди зліва направо, навігація, цифровий блок, миша. */
export const ORDER = (() => {
  const out = [];
  ROWS.forEach((row) => { for (const it of row) if (typeof it !== 'number' && it[0]) out.push(K + it[0]); });
  for (const [n] of NAV) out.push(K + n);
  for (const [n] of PAD) out.push(K + n);
  for (const n of ['left', 'right', 'middle', '4', '5']) out.push('key.mouse.' + n);
  return new Map(out.map((b, i) => [b, i]));
})();
