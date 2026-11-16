// @ts-check
// Геометрія клавіатури (ANSI TKL 87 — як у користувача, Hator Skyfall TKL PRO; повна 104 — з цифровим блоком) і порядок прив'язок.
// Чисті дані без DOM: малює components/keyboard.js, підбір клавіш (core/keys-suggest.js) бере звідси список і відстані.

export const K = 'key.keyboard.';
/** Рядок: [ім'я GLFW після key.keyboard., ширина u, підпис?]; число — проміжок у u; null-ім'я — неназначувана клавіша (Fn). */
export const ROWS = [
  [['escape', 1, 'Esc'], 1, ['f1'], ['f2'], ['f3'], ['f4'], .5, ['f5'], ['f6'], ['f7'], ['f8'], .5, ['f9'], ['f10'], ['f11'], ['f12']],
  [['grave.accent', 1, '`'], ['1'], ['2'], ['3'], ['4'], ['5'], ['6'], ['7'], ['8'], ['9'], ['0'], ['minus', 1, '-'], ['equal', 1, '='], ['backspace', 2, 'Backspace']],
  [['tab', 1.5, 'Tab'], ['q'], ['w'], ['e'], ['r'], ['t'], ['y'], ['u'], ['i'], ['o'], ['p'], ['left.bracket', 1, '['], ['right.bracket', 1, ']'], ['backslash', 1.5, '\\']],
  [['caps.lock', 1.75, 'Caps'], ['a'], ['s'], ['d'], ['f'], ['g'], ['h'], ['j'], ['k'], ['l'], ['semicolon', 1, ';'], ['apostrophe', 1, "'"], ['enter', 2.25, 'Enter']],
  [['left.shift', 2.25, 'Shift'], ['z'], ['x'], ['c'], ['v'], ['b'], ['n'], ['m'], ['comma', 1, ','], ['period', 1, '.'], ['slash', 1, '/'], ['right.shift', 2.75, 'Shift']],
  [['left.control', 1.25, 'Ctrl'], ['left.win', 1.25, 'Win'], ['left.alt', 1.25, 'Alt'], ['space', 6.25, ''], ['right.alt', 1.25, 'Alt'], [null, 1.25, 'Fn'], ['menu', 1.25, 'Menu'], ['right.control', 1.25, 'Ctrl']],
];
export const ROW_Y = [0, 1.25, 2.25, 3.25, 4.25, 5.25];
/** Блок навігації (x від 15.25) і цифровий (x від 18.5): [ім'я, x, y, w?, h?, підпис?] */
export const NAV = [
  ['print.screen', 15.25, 0, 1, 1, 'PrtSc'], ['scroll.lock', 16.25, 0, 1, 1, 'ScrLk'], ['pause', 17.25, 0, 1, 1, 'Pause'],
  ['insert', 15.25, 1.25, 1, 1, 'Ins'], ['home', 16.25, 1.25, 1, 1, 'Home'], ['page.up', 17.25, 1.25, 1, 1, 'PgUp'],
  ['delete', 15.25, 2.25, 1, 1, 'Del'], ['end', 16.25, 2.25, 1, 1, 'End'], ['page.down', 17.25, 2.25, 1, 1, 'PgDn'],
  ['up', 16.25, 4.25, 1, 1, '↑'], ['left', 15.25, 5.25, 1, 1, '←'], ['down', 16.25, 5.25, 1, 1, '↓'], ['right', 17.25, 5.25, 1, 1, '→'],
];
export const PAD = [
  ['num.lock', 0, 1.25, 1, 1, 'Num'], ['keypad.divide', 1, 1.25, 1, 1, '/'], ['keypad.multiply', 2, 1.25, 1, 1, '*'], ['keypad.subtract', 3, 1.25, 1, 1, '-'],
  ['keypad.7', 0, 2.25], ['keypad.8', 1, 2.25], ['keypad.9', 2, 2.25], ['keypad.add', 3, 2.25, 1, 2, '+'],
  ['keypad.4', 0, 3.25], ['keypad.5', 1, 3.25], ['keypad.6', 2, 3.25],
  ['keypad.1', 0, 4.25], ['keypad.2', 1, 4.25], ['keypad.3', 2, 4.25], ['keypad.enter', 3, 4.25, 1, 2, 'Ent'],
  ['keypad.0', 0, 5.25, 2, 1, '0'], ['keypad.decimal', 2, 5.25, 1, 1, '.'],
];
/** Кнопки миші, які показує сайт. */
export const MOUSE_BTNS = ['left', 'right', 'middle', '4', '5'];

/** Центри клавіш TKL 87 (основний блок + навігація) у u: прив'язка → {x, y}. Цифрового блока на TKL немає. */
export const TKL_CENTERS = (() => {
  /** @type {Map<string, {x: number, y: number}>} */
  const out = new Map();
  ROWS.forEach((row, i) => {
    let x = 0;
    for (const it of row) {
      if (typeof it === 'number') { x += it; continue; }
      const [name, w = 1] = /** @type {[string|null, number?]} */ (it);
      if (name) out.set(K + name, { x: x + /** @type {number} */ (w) / 2, y: ROW_Y[i] + 0.5 });
      x += /** @type {number} */ (w);
    }
  });
  for (const [name, x, y, w, hh] of NAV) out.set(K + name, { x: /** @type {number} */ (x) + /** @type {number} */ (w) / 2, y: /** @type {number} */ (y) + /** @type {number} */ (hh) / 2 });
  return out;
})();

/** Порядок прив'язок «як на клавіатурі» (для списку праворуч): ряди зліва направо, навігація, цифровий блок, миша. */
export const ORDER = (() => {
  const out = [];
  ROWS.forEach((row) => { for (const it of row) if (typeof it !== 'number' && it[0]) out.push(K + it[0]); });
  for (const [n] of NAV) out.push(K + n);
  for (const [n] of PAD) out.push(K + n);
  for (const n of MOUSE_BTNS) out.push('key.mouse.' + n);
  return new Map(out.map((b, i) => [b, i]));
})();
