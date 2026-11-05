// @ts-check
// Вкладка «🧠 Ядро Джарвіса + 📦 Сховища» сторінки #/assistant (C5): станція «Ядро Компаньйона (Джарвіс V1.0)»
// і навігатор сховищ — ті самі налаштування й пошук, що в HUD ⚙️ і панелі ATM11-Companion.
// Дані — лише з живого моста (/state → jarvis, /api/jarvis/*, /api/storage/search); без моста — «немає», нічого не вигадуємо.
// DOM — лише через h() / textContent (SECURITY §4).
import { h, mount } from '../core/dom.js';

/** Постійний корінь: перерисовка вкладок не скидає введений запит і результати пошуку. */
const cache = {
  /** @type {HTMLElement | null} */ root: null,
  /** @type {HTMLElement | null} */ body: null,
  /** @type {HTMLInputElement | null} */ input: null,
  /** @type {HTMLElement | null} */ results: null,
  /** @type {any} */ pttCheck: null,
  msg: '',
  baseUrl: '',
  /** @type {any} */ last: null,
  /** @type {any} */ stats: null,
  connected: false,
};

const PTT_MODE = /** @type {Record<string, string>} */ ({
  hook: '🟢 тримай-говори', shortcut: '🟡 перемикач', unavailable: '🔴 недоступно', off: '⚪ модуль вимкнено', error: '🔴 помилка', unknown: '— (стан повідомить вікно компаньйона)',
});

/** @param {string} path @param {any} [body] */
async function call(path, body) {
  const opt = body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  const r = await fetch(`${cache.baseUrl}${path}`, opt);
  const d = await r.json().catch(() => ({}));
  return { r, d };
}

/** @param {any} patch */
async function update(patch) {
  const { r, d } = await call('/api/jarvis/config', patch);
  if (r.status === 409 && d.check) { cache.pttCheck = d.check; cache.msg = ''; }
  else if (!r.ok || !d.ok) cache.msg = `✕ ${d.error || r.status}`;
  else { cache.last = d; cache.pttCheck = null; cache.msg = ''; }
  draw();
}

function draw() {
  if (!cache.body) return;
  const j = cache.last;
  if (!cache.connected || !j || !Array.isArray(j.modules)) {
    mount(cache.body, h('div.card', null,
      h('h3.section', { style: { marginTop: 0 } }, '🧠 Ядро Компаньйона (Джарвіс V1.0)'),
      h('p.small.muted', null, 'Немає даних: міст ATM11-Companion не запущено або він старої версії. Запустіть компаньйон (start.bat) — тут з\'являться модулі Ядра, клавіша Push-to-Talk, живий супутник і пошук по скринях.')));
    return;
  }
  const used = Number(j.usedCu) || 0;
  const max = Number(j.maxCu) || 100;
  const st = j.pttStatus || {};
  const soul = j.soul || {};
  const fd = (j.soulFrequencies || []).find((/** @type {any} */ f) => f.id === j.soulFrequency);
  const chk = cache.pttCheck;
  mount(cache.body,
    h('div.card.jv-card', null,
      h('div.jv-head', null, h('h3.section', { style: { margin: 0 } }, '🧠 Ядро Компаньйона (Джарвіс V1.0)'), h('span.badge', null, `${used} / ${max} CU`)),
      h('div.jv-cu', null, h('div.jv-cu-fill', { style: { width: `${max ? Math.min(100, Math.round((used / max) * 100)) : 0}%` } })),
      h('div.jv-row', null,
        h('span.small', null, 'Ємність'),
        h('div.seg', null, [['sandbox', '100 CU'], ['progression', 'Прогресія']].map(([id, label]) =>
          h(`button${j.mode === id ? '.on' : ''}`, { onclick: () => update({ mode: id }) }, label)))),
      h('div.jv-row', null,
        h('span.small', null, 'Характер'),
        h('div.seg', null, (j.personas || []).map((/** @type {any} */ p) =>
          h(`button${j.persona === p.id ? '.on' : ''}`, { title: p.desc, onclick: () => update({ persona: p.id }) }, p.name)))),
      h('div.chips', null, (j.presets || []).map((/** @type {any} */ p) => h('span.chip', { onclick: () => update({ preset: p.id }) }, p.name))),
      h('div.jv-mods', null, j.modules.map((/** @type {any} */ m) =>
        h(`label.jv-mod${m.enabled ? '.on' : ''}`, { title: m.desc },
          h('input', { type: 'checkbox', checked: m.enabled, onchange: (/** @type {Event} */ e) => update({ enabledModules: { [m.id]: /** @type {HTMLInputElement} */ (e.target).checked } }) }),
          h('span', null, m.icon),
          h('span.jv-mod-txt', null, h('b', null, m.name), h('small.muted', null, m.shortDesc || '')),
          h('span.jv-cu-cost', null, `${m.cost} CU`))))),
    h('div.card.jv-card', null,
      h('h3.section', { style: { marginTop: 0 } }, '🎙️ Голосовий ввід (Push-to-Talk)'),
      h('div.jv-row', null, h('span.small', null, 'Клавіша'), h('b.jv-key', null, `${j.pttHotkey || '—'}${j.pttHotkeyTitle && j.pttHotkeyTitle !== j.pttHotkey ? ` — ${j.pttHotkeyTitle}` : ''}`)),
      h('div.jv-row', null, h('span.small', null, 'Стан'), h('span.small', null, PTT_MODE[st.mode] || PTT_MODE.unknown)),
      st.message ? h('div.small.muted', null, st.message) : null,
      h('div.chips', null,
        h('span.chip', { title: 'Дальня бічна кнопка миші (X2)', onclick: () => update({ pttHotkey: 'Mouse5' }) }, '🖱️ Mouse5'),
        h('span.chip', { title: 'Ближня бічна кнопка миші (X1)', onclick: () => update({ pttHotkey: 'Mouse4' }) }, '🖱️ Mouse4')),
      chk ? h('div.jv-check', null,
        h('div.small', { style: { color: 'var(--bad)' } }, `✕ «${chk.canonical}» конфліктує з клавішами гри (${chk.source}):`),
        h('ul.small', null, (chk.conflicts || []).slice(0, 6).map((/** @type {any} */ c) => h('li', null, h('b', null, c.name), ` · ${c.ns} — ${c.why}`))),
        h('button.btn.small', { onclick: () => update({ pttHotkey: chk.canonical, force: true }) }, '⚠ Все одно призначити')) : null,
      h('div.small.muted', null, 'Власну комбінацію з Ctrl / Shift / Alt призначає рекордер у HUD ⚙️ або в панелі компаньйона (там видно натискання клавіш і бічних кнопок миші). Затиснули — говорите українською — відпустили: питання йде в чат.'),
      j.stt ? h('div.small.muted', null, j.stt.available === false ? 'Розпізнавання недоступне: немає ключа в .env компаньйона.' : `Розпізнавання: ${j.stt.model} · запитів ${j.stt.requests} (успішно ${j.stt.ok}, аудіо ${j.stt.audioSec} с)`) : null),
    h('div.card.jv-card', null,
      h('h3.section', { style: { marginTop: 0 } }, '✨ Живий супутник'),
      h('div.seg.jv-seg-wide', null, (j.soulFrequencies || []).map((/** @type {any} */ f) =>
        h(`button${j.soulFrequency === f.id ? '.on' : ''}`, { title: f.desc, onclick: () => update({ soulFrequency: f.id }) }, f.name))),
      h('div.small.muted', null, j.modules.find((/** @type {any} */ m) => m.id === 'companion_soul')?.enabled ? (fd?.desc || '') : 'Модуль «Живий характер супутника» вимкнено.'),
      h('div.small', null, `Реплік за сесію: ${soul.lines || 0} · порад ШІ: ${soul.advice || 0} / ${soul.adviceMax || 0}`),
      (soul.recent || []).length ? h('div.chips', null, soul.recent.map((/** @type {any} */ x) => h('span.chip', { title: new Date(x.ts).toLocaleTimeString() }, x.text))) : null,
      h('div.chips', null, [['dim', '🌀 Тест: вимір'], ['deep_dark', '🌑 Глибини'], ['night', '🌙 Ніч']].map(([id, label]) =>
        h('span.chip', { onclick: () => call('/api/jarvis/soul-test', { type: id }) }, label)))),
    cache.msg ? h('div.small', { style: { color: 'var(--bad)' } }, cache.msg) : null);
}

/** @param {string} text */
async function searchStorage(text) {
  const box = cache.results;
  if (!box) return;
  mount(box, h('div.small.muted', null, 'Шукаю…'));
  try {
    const { r, d } = await call(`/api/storage/search?q=${encodeURIComponent(String(text || '').trim() || '*')}&limit=20`);
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    /** @param {any[]} items */
    const chips = (items) => h('div.chips', null, (items || []).slice(0, 12).map((it) => h('span.chip', null, `${it.name} ×${it.count}`)));
    const cards = [
      ...(d.containers || []).map((/** @type {any} */ c) => h('div.jv-st', null,
        h('div', null, h('b', null, c.label), c.nav?.dist != null ? h('span.badge', { style: { marginLeft: '6px' } }, `${c.nav.dist} м`) : null),
        h('div.small.muted', null, c.nav?.summary || (Array.isArray(c.pos) ? `X:${c.pos[0]} Y:${c.pos[1]} Z:${c.pos[2]}` : '')),
        chips(c.items))),
      ...(d.personal || []).map((/** @type {any} */ p) => h('div.jv-st', null, h('b', null, p.label), chips(p.items))),
    ];
    mount(box,
      h('div.small.muted', null, cards.length
        ? (d.isOverview ? `Огляд: ${(d.containers || []).length} з ${d.totalContainersIndexed} контейнерів` : `«${d.query}» — усього ${d.totalFoundCount} шт.`)
        : (d.formatted || 'Нічого не знайдено')),
      cards);
  } catch (e) {
    mount(box, h('div.small', { style: { color: 'var(--bad)' } }, `Міст недоступний: ${/** @type {Error} */ (e).message}`));
  }
}

/**
 * @param {any} st стан сторінки помічника (liveState, liveConnected)
 * @param {string} baseUrl адреса моста
 */
export function renderJarvisTab(st, baseUrl) {
  cache.baseUrl = baseUrl;
  cache.connected = Boolean(st.liveConnected);
  if (st.liveState?.jarvis) cache.last = st.liveState.jarvis;
  cache.stats = st.liveState?.storageIndexStats || cache.stats;
  if (!cache.root) {
    cache.body = h('div.jv-grid');
    cache.input = /** @type {HTMLInputElement} */ (h('input.ai-input', {
      type: 'search',
      placeholder: 'Що шукати у скринях? (алмаз, кайло, усемодій…) — порожньо = огляд сховищ поруч',
      onkeydown: (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter') searchStorage(cache.input?.value || ''); },
    }));
    cache.results = h('div.jv-st-list', null, h('div.small.muted', null, 'Пошук — як команда !де в грі: 0 токенів API, координати й напрямок від гравця.'));
    cache.root = h('div.jv-wrap', null,
      cache.body,
      h('div.card.jv-card', null,
        h('h3.section', { style: { marginTop: 0 } }, '📦 Навігатор сховищ'),
        h('div.ai-ask-row', null, cache.input, h('button.btn.primary', { onclick: () => searchStorage(cache.input?.value || '') }, '🧭 Знайти')),
        cache.results));
  }
  draw();
  return cache.root;
}

/** Оновлення з події SSE jarvis-state (без перерисовки всієї вкладки). @param {any} j */
export function updateJarvisState(j) {
  if (!j || !Array.isArray(j.modules)) return;
  cache.last = j;
  draw();
}
