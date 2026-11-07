// @ts-check
// Модель вкладки «Клавіші»: дані data/keys.json (+ власний options.txt користувача з localStorage), назви клавіш, шари, конфлікти.
// level() — дзеркало tools/build_keys.py: змінювати разом.
import { getJSON } from './store.js';

const LS = 'atm11.keys.options';
const MODS = { CONTROL: 'C', CONTROL_OR_COMMAND: 'C', SHIFT: 'S', ALT: 'A' };
export const MOD_TITLE = { '': 'Без модифікатора', S: 'Shift', C: 'Ctrl', A: 'Alt', F3: 'F3' };
const SPECIAL = {
  'left.shift': 'Лівий Shift', 'right.shift': 'Правий Shift', 'left.control': 'Лівий Ctrl', 'right.control': 'Правий Ctrl',
  'left.alt': 'Лівий Alt', 'right.alt': 'Правий Alt', 'grave.accent': '`', 'left.bracket': '[', 'right.bracket': ']', backslash: '\\',
  semicolon: ';', apostrophe: "'", comma: ',', period: '.', slash: '/', minus: '-', equal: '=', space: 'Пробіл', tab: 'Tab', escape: 'Esc',
  enter: 'Enter', backspace: 'Backspace', delete: 'Delete', insert: 'Insert', home: 'Home', end: 'End', 'page.up': 'PgUp', 'page.down': 'PgDn',
  up: '↑', down: '↓', left: '←', right: '→', 'caps.lock': 'Caps Lock', 'left.win': 'Win', 'right.win': 'Win', menu: 'Menu',
  'print.screen': 'PrtSc', pause: 'Pause', 'scroll.lock': 'Scroll Lock', 'num.lock': 'Num Lock',
};
const MOUSE = { left: 'ЛКМ', right: 'ПКМ', middle: 'СКМ' };
export const UNBOUND = 'key.keyboard.unknown';

/** «key.keyboard.left.shift» → «Лівий Shift»; «key.mouse.4» → «Миша 4». @param {string} b */
export function pretty(b) {
  if (!b || b === UNBOUND) return '';
  const m = /^key\.(keyboard|mouse)\.(.+)$/.exec(b);
  if (!m) return b;
  const k = m[2];
  if (m[1] === 'mouse') return MOUSE[k] || `Миша ${k}`;
  if (k.startsWith('keypad.')) return 'Num ' + k.slice(7).replace(/\./g, ' ');
  if (/^f\d+$/.test(k)) return k.toUpperCase();
  return SPECIAL[k] || (k.length === 1 ? k.toUpperCase() : k.replace(/\./g, ' '));
}

/** Шар клавіатури дії: '' | S | C | A | F3 (F3 — налагодження). @param {KeyAct} k */
export const layerOf = (k) => (k.ctx === 'debug' ? 'F3' : k.m || '');
/** Повне сполучення для показу: «Ctrl+K», «F3+G». @param {KeyAct} k */
export function comboText(k) {
  if (k.bind === UNBOUND) return '';
  const l = layerOf(k);
  return (l ? MOD_TITLE[l] + '+' : '') + pretty(k.bind);
}

/** @param {string|undefined} x @param {string|undefined} y */
const scrMatch = (x, y) => !!x && !!y && (x === y || (x === 'c:*' && y.startsWith('c:')) || (y === 'c:*' && x.startsWith('c:')));

/** 0 — не конфлікт, 1 — можливий (лише з предметом / верхи / умовно), 2 — конфлікт (обидві діють завжди). Дзеркало build_keys.py.
 * @param {KeyAct} a @param {KeyAct} b */
export function level(a, b) {
  if (a.nc || b.nc || a.ns === b.ns) return 0;                 // один мод — так задумано
  const p = new Set([a.ctx, b.ctx]); const only = (...xs) => [...p].every((x) => xs.includes(x));
  let lv = 0;
  if (p.size === 1 && p.has('game')) lv = 2;
  else if (only('game', 'held')) lv = 1;
  else if (p.has('vehicle')) lv = only('vehicle', 'game', 'held') && p.size > 1 ? 1 : 0;
  else if (p.size === 1 && p.has('gui')) lv = scrMatch(a.scr, b.scr) ? (a.scr === b.scr ? 2 : 1) : 0;
  else if (p.size === 1 && p.has('debug')) lv = 2;
  return a.soft || b.soft ? Math.min(lv, 1) : lv;
}

/** Дії з застосованим планом перепризначень (поле plan: «Ctrl+G» | «F8» | «none»). @param {KeyAct[]} keys */
export function withPlan(keys) {
  return keys.map((k) => { if (!k.plan || k.plan_done) return k; const p = parseSuggest(k.plan); return { ...k, bind: p.bind, m: p.l, was: comboText(k) || '—' }; });
}

/** Розбір options.txt у браузері: рядки key_<id>:<прив'язка>[:<модифікатор>]. @param {string} text */
export function parseOptions(text) {
  /** @type {Record<string, [string, string]>} */
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('key_')) continue;
    const body = line.slice(4); const i = body.indexOf(':');
    if (i < 0) continue;
    const [bind, mod = ''] = body.slice(i + 1).split(':');
    if (/^key\.(keyboard|mouse)\./.test(bind)) out[body.slice(0, i)] = [bind, MODS[mod] || ''];
  }
  return out;
}

/** Власні клавіші користувача (localStorage) або null. */
export function userOptions() {
  try { const v = JSON.parse(localStorage.getItem(LS) || 'null'); return v && v.binds ? v : null; } catch { return null; }
}
/** @param {{name: string, date: string, sig?: string, binds: Record<string, [string, string]>} | null} v */
export function saveUserOptions(v) {
  try { if (v) localStorage.setItem(LS, JSON.stringify(v)); else localStorage.removeItem(LS); } catch { /* приватний режим */ }
}

/** Синхронізує актуальні прив'язки з живого моста (:8812) у localStorage, якщо змінився відбиток options.txt.
 * @param {Record<string, [string, string]> | null | undefined} binds @param {string} [sig] @returns {boolean} */
export function syncBridgeOptions(binds, sig = '') {
  if (!binds || typeof binds !== 'object' || !Object.keys(binds).length) return false;
  const cur = userOptions();
  if (cur && sig && cur.sig === sig) return false;
  saveUserOptions({
    name: 'options.txt (живий міст)',
    date: new Date().toLocaleTimeString('uk-UA'),
    sig,
    binds,
  });
  return true;
}

/** Повертає базовий URL активного моста ATM11-Companion (:8812), якщо він відомий у сесії або відкритий через /site/. */
export function getActiveBridgeBase() {
  if (typeof location !== 'undefined' && location.pathname.startsWith('/site')) return location.origin;
  try {
    const s = sessionStorage.getItem('atm11.bridge.online');
    if (s) return s.replace(/\/$/, '');
    const cfg = JSON.parse(localStorage.getItem('atm11.assistant.cfg.v2') || 'null');
    if (cfg?.bridgeUrl) return String(cfg.bridgeUrl).replace(/\/$/, '');
  } catch { /* ignore */ }
  return '';
}

/** Дані вкладки: дії збірки + (за наявності) прив'язки з власного options.txt. Повертає {cats, ctxs, stat, keys, user}. */
export async function loadKeys() {
  const d = await getJSON('data/keys.json');
  const user = userOptions();
  /** @type {KeyAct[]} */
  let keys = d.keys;
  if (user) {
    const known = new Set(keys.map((k) => k.id));
    keys = keys.map((k) => {
      if (!user.binds[k.id]) return k;
      const [bind, m] = user.binds[k.id];
      const next = { ...k, bind, m };
      if (k.plan) {
        const p = parseSuggest(k.plan);
        next.plan_done = bind === p.bind && m === p.l;
      }
      return next;
    });
    for (const [id, [bind, m]] of Object.entries(user.binds)) {   // дії, яких немає в збірці (інша збірка / новий мод)
      if (!known.has(id)) keys.push({ id, ns: (/^key\.([a-z0-9_]+)\./.exec(id) || [, '?'])[1] || '?', name: id, bind, m, cat: 'ui', ctx: 'game', extra: true });
    }
  }
  const allCtx = new Set(['game', 'held', 'vehicle', 'gui', 'debug']);
  const curBy = user ? analyze(keys, allCtx) : null;
  const planKeys = user ? withPlan(keys) : null;
  const planBy = planKeys ? analyze(planKeys, allCtx) : null;
  const stat = (user && curBy && planBy && planKeys) ? {
    ...d.stat,
    conflicts: [...curBy.values()].filter((v) => v.lvl === 2).length,
    maybe: [...curBy.values()].filter((v) => v.lvl === 1).length,
    imp_unbound: keys.filter((k) => k.bind === UNBOUND && k.imp).length,
    plan_conflicts: [...planBy.values()].filter((v) => v.lvl === 2).length,
    plan_imp_unbound: planKeys.filter((k) => k.bind === UNBOUND && k.imp).length,
  } : d.stat;
  return { cats: d.cats, ctxs: d.ctxs, stat, keys, user };
}

/**
 * Аналіз: дії за сполученням (шар|клавіша) і стан кожного сполучення.
 * @param {KeyAct[]} keys @param {Set<string>} ctxOn увімкнені контексти
 */
export function analyze(keys, ctxOn) {
  /** @type {Map<string, {acts: KeyAct[], lvl: number}>} */
  const by = new Map();
  for (const k of keys) {
    if (k.bind === UNBOUND || !ctxOn.has(k.ctx)) continue;
    const c = layerOf(k) + '|' + k.bind;
    if (!by.has(c)) by.set(c, { acts: [], lvl: 0 });
    /** @type {any} */ (by.get(c)).acts.push(k);
  }
  for (const v of by.values()) {
    for (let i = 0; i < v.acts.length; i++) for (let j = i + 1; j < v.acts.length; j++) v.lvl = Math.max(v.lvl, level(v.acts[i], v.acts[j]));
  }
  return by;
}

/** Стан сполучення для кольору: free | one | multi | maybe | conflict. @param {{acts: KeyAct[], lvl: number} | undefined} v */
export const stateOf = (v) => (!v ? 'free' : v.lvl === 2 ? 'conflict' : v.lvl === 1 ? 'maybe' : v.acts.length > 1 ? 'multi' : 'one');

/** Чи конфліктує дія з іншими на своєму сполученні: 0 | 1 | 2. @param {KeyAct} k @param {Map<string, any>} by */
export function actLevel(k, by) {
  const v = by.get(layerOf(k) + '|' + k.bind);
  return v ? Math.max(0, ...v.acts.filter((/** @type {KeyAct} */ x) => x !== k).map((/** @type {KeyAct} */ x) => level(k, x))) : 0;
}

/** «Ctrl+I» → {l: 'C', bind: 'key.keyboard.i'} — для підсвітки порад. @param {string} s */
export function parseSuggest(s) {
  if (s === 'none') return { l: '', bind: UNBOUND };
  const p = s.split('+'); const key = p.pop() || '';
  const l = p.length ? ({ Ctrl: 'C', Shift: 'S', Alt: 'A' })[p[0]] || '' : '';
  const k = key.toLowerCase();
  const ms = /^миша (\d+)$/.exec(k);
  if (ms) return { l, bind: 'key.mouse.' + ms[1] };
  return { l, bind: 'key.keyboard.' + (({ '`': 'grave.accent', ins: 'insert', del: 'delete', pgup: 'page.up', pgdn: 'page.down' })[k] || k) };
}
