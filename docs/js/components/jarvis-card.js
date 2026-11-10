// @ts-check
// components/jarvis-card.js — вкладка «🧩 Компаньйон і сховища» (#/assistant): що зараз працює (стан конструктора
// компаньйона — лише показ; налаштування змінюються в одному місці, у вікні ATM11-Companion → «Конструктор»),
// зони й пошук у сховищах, пам'ять, діагностика.
// Дані — лише з живого моста (:8812): поле `components` повного стану; DOM — виключно через h() / textContent (SECURITY §4).
import { h, mount } from '../core/dom.js';

const SEC_LS_KEY = 'atm11.site.jarvis.sec';
const NAV_ITEMS = [
  ['build', '🧩', 'Що працює'],
  ['storage', '📦', 'Сховища'],
  ['memory', '🧠', 'Пам’ять'],
  ['help', '🩺', 'Діагностика'],
];
const SECTIONS = new Set(NAV_ITEMS.map(([id]) => id));

const MEM_ICON = /** @type {Record<string, string>} */ ({
  death: '💀', advancement: '🏆', dimension: '🌀', milestone: '🗺️', quest: '📜',
});

const DIAG_ICON = /** @type {Record<string, string>} */ ({
  ok: '✅', warn: '⚠️', bad: '⛔', info: 'ℹ️',
});

const cache = {
  /** @type {HTMLElement | null} */ root: null,
  sec: (() => { try { const v = localStorage.getItem(SEC_LS_KEY) || ''; return SECTIONS.has(v) ? v : 'build'; } catch { return 'build'; } })(),
  baseUrl: 'http://127.0.0.1:8812',
  connected: false,
  /** @type {(() => Promise<void> | void) | null} */ onReconnect: null,
  /** @type {any} */ comp: null,   // стан конструктора з моста: { groups, components, profiles, profile }
  /** @type {any} */ stats: null,
  /** @type {any} */ ownData: null,
  ownLoadedAt: 0,
  /** @type {any} */ memData: null,
  memLoadedAt: 0,
  noteDraft: '',
  /** @type {any} */ diagReport: null,
  diagBusy: false,
  toast: '',
  storageQuery: '',
  /** @type {HTMLElement | null} */ storageResultsEl: null,
};

/** @param {string} path @param {any} [body] */
async function apiCall(path, body) {
  const opt = body === undefined
    ? {}
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  const r = await fetch(`${cache.baseUrl}${path}`, opt);
  const d = await r.json().catch(() => ({}));
  return { r, d };
}

/** @param {string} msg */
function setToast(msg) {
  cache.toast = msg;
  draw();
}

/** @param {any} patch */
/** Значення налаштування словами (тип — з реєстру моста). @param {any} s */
function settingText(s) {
  if (s.type === 'toggle') return s.value ? 'так' : 'ні';
  if (s.type === 'choice') return (s.options || []).find((/** @type {any} */ o) => o.id === s.value)?.name || String(s.value);
  return `${s.value}${s.unit ? ` ${s.unit}` : ''}`;
}

/** Стан компонента одним словом. @param {any} x */
function stateText(x) {
  if ((x.blockedBy || []).length) return `потрібен: ${x.blockedBy.join(', ')}`;
  if (!x.enabled) return 'вимкнено';
  return x.status?.text || 'працює';
}

async function ensureOwnLoaded(force = false) {
  if (!cache.connected || (!force && Date.now() - cache.ownLoadedAt < 8000)) return;
  cache.ownLoadedAt = Date.now();
  try {
    const { r, d } = await apiCall('/api/storage/own');
    if (r.ok && d.ok) { cache.ownData = d; draw(); }
  } catch { /* ignore */ }
}

async function ensureMemLoaded(force = false) {
  if (!cache.connected || (!force && Date.now() - cache.memLoadedAt < 8000)) return;
  cache.memLoadedAt = Date.now();
  try {
    const { r, d } = await apiCall('/api/memory');
    if (r.ok && d.ok) { cache.memData = d; draw(); }
  } catch { /* ignore */ }
}

/** Перемикач у стилі панелі ATM11-Companion (.ui-switch). @param {boolean} checked @param {(v: boolean) => void} onChange @param {string} [label] */
function renderSwitch(checked, onChange, label = '') {
  return h('label.ui-switch', { title: label || (checked ? 'Увімкнено' : 'Вимкнено') },
    h('input', {
      type: 'checkbox',
      checked,
      onchange: (/** @type {Event} */ e) => onChange(/** @type {HTMLInputElement} */ (e.target).checked),
    }),
    h('span.ui-switch-slider'));
}

/** @param {string} text */
async function searchStorage(text) {
  cache.storageQuery = text;
  if (!cache.storageResultsEl) cache.storageResultsEl = h('div.jv-st-list');
  mount(cache.storageResultsEl, h('div.small.muted', null, '⏳ Шукаю у скринях і контейнерах…'));
  try {
    const { r, d } = await apiCall(`/api/storage/search?q=${encodeURIComponent(String(text || '').trim() || '*')}&limit=20`);
    if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
    /** @param {any[]} items */
    const chips = (items) => h('div.chips.jv-st-chips', null, (items || []).slice(0, 12).map((it) => h('span.chip', null, `${it.name} ×${it.count}`)));
    const cards = [
      ...(d.containers || []).map((/** @type {any} */ c) => h('div.jv-st', null,
        h('div.jv-st-top', null,
          h('b', null, c.label),
          c.nav?.dist != null ? h('span.badge', { style: { '--c': 'var(--accent)' } }, `${c.nav.dist} м`) : null),
        h('div.small.muted', null, [c.nav?.summary || (Array.isArray(c.pos) ? `X:${c.pos[0]} Y:${c.pos[1]} Z:${c.pos[2]}` : ''), c.source || ''].filter(Boolean).join(' · ')),
        chips(c.items))),
      ...(d.personal || []).map((/** @type {any} */ p) => h('div.jv-st', null,
        h('div.jv-st-top', null,
          h('b', null, p.label),
          p.totalCount ? h('span.badge.ghost', null, `×${p.totalCount}`) : null),
        chips(p.items))),
    ];
    mount(cache.storageResultsEl,
      h('div.small.muted', null, cards.length
        ? (d.isOverview ? `Огляд: ${(d.containers || []).length} з ${d.totalContainersIndexed} контейнерів` : `«${d.query}» — знайдено ${d.totalFoundCount} шт.`)
        : (d.formatted || 'Нічого не знайдено у проіндексованих сховищах.')),
      ...cards);
  } catch (e) {
    mount(cache.storageResultsEl, h('div.small', { style: { color: 'var(--bad)' } }, `Міст недоступний: ${e instanceof Error ? e.message : String(e)}`));
  }
}

/** Рендерить активну категорію налаштувань Ядра праворуч. @param {any} j */
function renderActivePane(c) {
  const sec = cache.sec;

  if (sec === 'build') {
    const profile = (c.profiles || []).find((/** @type {any} */ p) => p.id === c.profile);
    return h('div.jv-sec', null,
      h('h4.jv-sec-title', null, '🧩 Що зараз працює'),
      h('p.small.muted', null,
        `Стан конструктора компаньйона${profile ? ` · профіль «${profile.name}»` : ''}. Змінити — у вікні ATM11-Companion → вкладка «Конструктор».`),
      (c.groups || []).map((/** @type {any} */ g) => {
        const list = c.components.filter((/** @type {any} */ x) => x.group === g.id);
        return list.length ? h('div.jv-cmp-group', null,
          h('div.jv-group-title', null, `${g.icon} ${g.name}`),
          list.map((/** @type {any} */ x) => h(`div.jv-cmp${x.active ? '.on' : ''}`, null,
            h('span.jv-mod-ic', null, x.icon),
            h('div.jv-mod-txt', null,
              h('b', null, x.name),
              h('small.muted', null, x.desc),
              x.active && (x.settings || []).length ? h('div.chips.jv-note', null,
                x.settings.map((/** @type {any} */ st) => h('span.chip', null, `${st.label}: ${settingText(st)}`))) : null),
            h(`span.badge${x.active ? '' : '.ghost'}`, null, stateText(x))))) : null;
      }));
  }

  if (sec === 'storage') {
    ensureOwnLoaded(false);
    const zone = c.components.find((/** @type {any} */ x) => x.id === 'storage_nav')?.settings.find((/** @type {any} */ x) => x.key === 'zoneRadius');
    const stStats = cache.stats;
    const own = cache.ownData;
    const stInp = /** @type {HTMLInputElement} */ (h('input.ai-input', {
      type: 'search',
      value: cache.storageQuery,
      placeholder: 'Що шукати у скринях? (алмаз, кайло, усемодій…) — порожньо = огляд поруч',
      onkeydown: (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter') searchStorage(stInp.value); },
    }));
    if (!cache.storageResultsEl) {
      cache.storageResultsEl = h('div.jv-st-list', null,
        h('div.small.muted', null, 'Пошук — як команда !де в грі: 0 токенів API, координати й напрямок від гравця.'));
    }

    return h('div.jv-sec', null,
      h('h4.jv-sec-title', null, '📦 Мої сховища та Навігатор (!де)'),
      zone ? h('p.small.muted', null, `Радіус зони «тут моя база / шахта / ферма»: ${settingText(zone)} — змінюється в «Конструкторі» компаньйона.`) : null,
      h('div.jv-group-title', null, 'Активні зони гравця'),
      own ? h('div.jv-own-box', null,
        (own.zones || []).length
          ? h('div.chips', null, own.zones.map((/** @type {any} */ z) => h('span.chip.on', { style: { '--c': 'var(--accent)' } }, `📍 ${z.name}`)))
          : h('div.small.muted', null, 'Зон ще немає — станьте на базі в грі й скажіть або напишіть у чат «тут моя база».'),
        h('div.small.muted.jv-note', null,
          `Поставлено вами: ${own.placed ?? 0} · позначено: ${own.pinned ?? 0} · «не моє»: ${own.unpinned ?? 0}` +
          (own.snapshot?.lastAt ? ` · знімок гри: ${own.snapshot.lastContainers} сховищ за ${own.snapshot.lastWorkMs} мс` : '')))
        : h('div.small.muted', null, 'Зчитую статистику зон…'),
      h('div.jv-group-row', null,
        h('span.jv-group-title', null, '📦 Навігатор сховищ (!де)'),
        stStats ? h('span.badge.ghost', null, `проіндексовано: ${stStats.containersCount ?? 0} · ${Math.round((Number(stStats.bytes || 0)) / 1024)} КБ`) : null),
      h('div.jv-search-row', null,
        stInp,
        h('button.btn.primary', { type: 'button', onclick: () => searchStorage(stInp.value) }, '🧭 Знайти')),
      cache.storageResultsEl);
  }

  if (sec === 'memory') {
    ensureMemLoaded(false);
    const m = cache.memData;
    const noteInp = /** @type {HTMLInputElement} */ (h('input.ai-input', {
      type: 'text',
      maxLength: 200,
      value: cache.noteDraft,
      placeholder: 'Нова нотатка для компаньйона («база біля вишневого гаю»…)',
      oninput: () => { cache.noteDraft = noteInp.value; },
      onkeydown: async (/** @type {KeyboardEvent} */ e) => {
        if (e.key === 'Enter' && noteInp.value.trim()) {
          const { r, d } = await apiCall('/api/memory/note', { text: noteInp.value.trim(), source: 'site' });
          if (r.ok && d.notes) { cache.noteDraft = ''; cache.memData = d; draw(); }
        }
      },
    }));
    return h('div.jv-sec', null,
      h('h4.jv-sec-title', null, '🧠 Пам’ять компаньйона'),
      h('div.jv-set-row', null,
        h('div.jv-set-lbl', null,
          h('span', null, 'Пам’ять сесії увімкнено'),
          h('small.muted', null, 'Лише події гри й ваші нотатки («запам’ятай …»), без відповідей ШІ')),
        renderSwitch(Boolean(m?.enabled ?? true), async (v) => {
          const { r, d } = await apiCall('/api/memory/config', { enabled: v });
          if (r.ok) { cache.memData = d; draw(); }
        }, 'Пам’ять сесії')),
      h('div.jv-group-title', null, 'Нотатки гравця'),
      h('div.jv-search-row', null,
        noteInp,
        h('button.btn.primary', {
          type: 'button',
          onclick: async () => {
            if (!noteInp.value.trim()) return;
            const { r, d } = await apiCall('/api/memory/note', { text: noteInp.value.trim(), source: 'site' });
            if (r.ok && d.notes) { cache.noteDraft = ''; cache.memData = d; draw(); }
          },
        }, '＋ Додати')),
      m?.notes?.length ? h('div.jv-mem-list', null, m.notes.map((/** @type {any} */ n) =>
        h('div.jv-mem-item', null,
          h('span.small', null, `📝 ${n.text}`),
          h('button.wb-btn', {
            type: 'button',
            title: 'Забути нотатку',
            onclick: async () => {
              const { r, d } = await apiCall('/api/memory/forget', { id: n.id });
              if (r.ok) { cache.memData = d; draw(); }
            },
          }, '✕'))))
        : h('div.small.muted', null, 'Збережених нотаток поки немає.'),
      h('div.jv-group-row', null,
        h('span.jv-group-title', null, 'Журнал подій світу'),
        m?.eventsTotal ? h('span.small.muted', null, `${m.eventsTotal} подій · світ «${m.world || '—'}»`) : null),
      m?.events?.length ? h('div.jv-mem-list', null, m.events.slice(0, 10).map((/** @type {any} */ ev) =>
        h('div.jv-mem-item', null,
          h('span.small', null, `${MEM_ICON[ev.type] || '•'} ${ev.text}`),
          h('small.muted', null, ev.ago || ''))))
        : h('div.small.muted', null, 'Подій ще немає — журнал автоматично наповнює гра.'),
      h('div.jv-btns', null,
        h('button.btn.small', {
          type: 'button',
          onclick: async () => {
            const { r, d } = await apiCall('/api/memory/new-topic', {});
            if (r.ok) { cache.memData = d; setToast('↺ Контекст попередніх питань очищено (нова тема)'); }
          },
        }, '↺ Нова тема діалогу')));
  }

  // sec === 'help'
  const rep = cache.diagReport;
  return h('div.jv-sec', null,
    h('h4.jv-sec-title', null, '🩺 Самодіагностика моста й інтеграції'),
    h('p.small.muted', null, 'Перевіряє зв’язок із грою, KubeJS-скрипт, базу путівника, індекс сховищ, голосові модулі та стан API.'),
    h('div.jv-btns', null,
      h('button.btn.small.primary', {
        type: 'button',
        disabled: cache.diagBusy,
        onclick: async () => {
          cache.diagBusy = true;
          draw();
          try {
            const { r, d } = await apiCall('/api/diag');
            cache.diagReport = r.ok && d.ok ? d : { error: d.error || `HTTP ${r.status}` };
          } catch (e) {
            cache.diagReport = { error: e instanceof Error ? e.message : String(e) };
          } finally {
            cache.diagBusy = false;
            draw();
          }
        },
      }, cache.diagBusy ? '⏳ Перевіряю…' : '🩺 Запустити самодіагностику')),
    rep ? (rep.error
      ? h('div.jv-diag-item.bad', null, h('b', null, `⛔ Помилка: ${rep.error}`))
      : h('div.jv-diag-list', null,
          h('div.small.jv-diag-sum', null,
            `✅ Гаразд: ${rep.summary?.ok || 0} · ⚠️ Увага: ${rep.summary?.warn || 0} · ⛔ Проблем: ${rep.summary?.bad || 0}`),
          ...(rep.checks || []).map((/** @type {any} */ c) => h(`div.jv-diag-item.${c.status || 'info'}`, null,
            h('span.jv-diag-ic', null, DIAG_ICON[c.status] || '•'),
            h('div', null,
              h('b.small', null, c.title),
              c.detail ? h('div.small.muted', null, c.detail) : null,
              c.fix ? h('div.small.jv-diag-fix', null, `→ ${c.fix}`) : null))))) : null);
}

function draw() {
  if (!cache.root) return;
  const c = cache.comp;
  if (!cache.connected || !c || !Array.isArray(c.components)) {
    mount(cache.root, h('div.card.jv-offline', null,
      h('div.jv-head', null,
        h('h3', null, '🧩 Компаньйон і 📦 сховища'),
        h('span.badge.ghost', null, 'Міст офлайн')),
      h('p.small.muted', null,
        'Тут видно, що зараз увімкнено в ATM11-Companion (:8812), зони й пошук у сховищах, пам’ять і діагностику. Запустіть компаньйон — дані з’являться самі.'),
      h('div.jv-btns', null,
        cache.onReconnect ? h('button.btn.small.primary', {
          type: 'button',
          onclick: () => cache.onReconnect && cache.onReconnect(),
        }, '🔌 Перевірити підключення (:8812)') : null)));
    return;
  }

  const active = c.components.filter((/** @type {any} */ x) => x.active).length;

  mount(cache.root, h('div.card.jv-shell', null,
    h('div.jv-head', null,
      h('div', null,
        h('h3', null, '🧩 Компаньйон'),
        h('span.small.muted', null, 'Стан із живого моста; налаштування — у вікні ATM11-Companion → «Конструктор»')),
      h('span.badge', { style: { '--c': 'var(--accent)' } }, `працює ${active} з ${c.components.length}`)),
    cache.toast ? h('div.small.jv-toast', null,
      h('span', null, cache.toast),
      h('button.wb-btn', { type: 'button', onclick: () => setToast('') }, '✕')) : null,
    h('div.jv-layout', null,
      h('nav.jv-nav', { role: 'tablist', 'aria-label': 'Розділи компаньйона' },
        NAV_ITEMS.map(([id, ic, lbl]) => h(`button.jv-nav-item${cache.sec === id ? '.on' : ''}`, {
          type: 'button',
          role: 'tab',
          'aria-selected': String(cache.sec === id),
          onclick: () => {
            cache.sec = id;
            try { localStorage.setItem(SEC_LS_KEY, id); } catch { /* ignore */ }
            draw();
          },
        }, h('span.jv-nav-ic', null, ic), h('span', null, lbl)))),
      h('div.jv-pane', null, renderActivePane(c)))));
}

/**
 * Рендерить вкладку «🧩 Компаньйон і сховища».
 * @param {any} st
 * @param {string} baseUrl
 * @param {() => Promise<void> | void} [onReconnect]
 */
export function renderJarvisTab(st, baseUrl, onReconnect) {
  cache.baseUrl = baseUrl;
  cache.connected = Boolean(st.liveConnected);
  cache.onReconnect = onReconnect || null;
  if (st.liveState?.components) cache.comp = st.liveState.components;
  cache.stats = st.liveState?.storageIndexStats || cache.stats;
  if (!cache.root) cache.root = h('div.jv-wrap');
  draw();
  return cache.root;
}

/** Новий стан конструктора (поле `components` події SSE `state`). @param {any} c */
export function updateComponentsState(c) {
  if (!c || !Array.isArray(c.components)) return;
  if (JSON.stringify(c) === JSON.stringify(cache.comp)) return;   // стан приходить кожні 2,5 с — без змін не перемальовуємо
  cache.comp = c;
  draw();
}
