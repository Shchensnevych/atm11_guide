// @ts-check
// components/jarvis-card.js — вкладка «🧠 Ядро Джарвіса та сховища» (#/assistant):
// сучасна 2-колонкова станція керування (категорії зліва + панель налаштувань праворуч), синхронізована з HUD ⚙️ та ATM11-Companion.
// Дані — лише з живого моста (:8812); DOM — виключно через h() / textContent (SECURITY §4).
import { h, mount } from '../core/dom.js';

const SEC_LS_KEY = 'atm11.site.jarvis.sec';
const NAV_ITEMS = [
  ['mode', '⚙️', 'Режим і характер'],
  ['mods', '🧩', 'Модулі (CU)'],
  ['voice', '🎙️', 'Голосовий ввід'],
  ['soul', '✨', 'Живий супутник'],
  ['storage', '📦', 'Сховища'],
  ['memory', '🧠', 'Пам’ять'],
  ['help', '🩺', 'Діагностика'],
];

const PTT_MODE = /** @type {Record<string, string>} */ ({
  hook: '🟢 тримай-говори (uiohook)',
  shortcut: '🟡 перемикач (globalShortcut)',
  unavailable: '🔴 недоступно',
  off: '⚪ модуль вимкнено',
  error: '🔴 помилка',
  unknown: '— (стан повідомляє вікно компаньйона)',
});

const MEM_ICON = /** @type {Record<string, string>} */ ({
  death: '💀', advancement: '🏆', dimension: '🌀', milestone: '🗺️', quest: '📜',
});

const DIAG_ICON = /** @type {Record<string, string>} */ ({
  ok: '✅', warn: '⚠️', bad: '⛔', info: 'ℹ️',
});

const cache = {
  /** @type {HTMLElement | null} */ root: null,
  sec: (() => { try { return localStorage.getItem(SEC_LS_KEY) || 'mode'; } catch { return 'mode'; } })(),
  baseUrl: 'http://127.0.0.1:8812',
  connected: false,
  /** @type {(() => Promise<void> | void) | null} */ onReconnect: null,
  /** @type {any} */ last: null,
  /** @type {any} */ stats: null,
  /** @type {any} */ ownData: null,
  ownLoadedAt: 0,
  /** @type {any} */ memData: null,
  memLoadedAt: 0,
  noteDraft: '',
  /** @type {any} */ diagReport: null,
  diagBusy: false,
  /** @type {any} */ pttCheck: null,
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
async function updateJarvis(patch) {
  try {
    const { r, d } = await apiCall('/api/jarvis/config', patch);
    if (r.status === 409 && d.check) {
      cache.pttCheck = d.check;
      cache.toast = '';
    } else if (!r.ok || !d.ok) {
      cache.toast = `⚠ ${d.error || `HTTP ${r.status}`}`;
    } else {
      cache.last = d;
      cache.pttCheck = null;
      cache.toast = '';
    }
  } catch (e) {
    cache.toast = `⚠ Міст недоступний: ${e instanceof Error ? e.message : String(e)}`;
  }
  draw();
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
function renderActivePane(j) {
  const sec = cache.sec;

  if (sec === 'mode') {
    const bonuses = (j.capacity?.bonuses || []).map((/** @type {any} */ b) => b.label).join(' · ');
    return h('div.jv-sec', null,
      h('h4.jv-sec-title', null, '⚙️ Режим і характер'),
      h('div.jv-set-row', null,
        h('div.jv-set-lbl', null,
          h('span', null, 'Ємність ядра'),
          h('small.muted', null, '100 CU — усі модулі одразу; «Прогресія» — 50 CU + бонуси за прогрес світу')),
        h('div.seg', null, [['sandbox', '100 CU'], ['progression', 'Прогресія']].map(([id, lbl]) =>
          h(`button${j.mode === id ? '.on' : ''}`, { type: 'button', onclick: () => updateJarvis({ mode: id }) }, lbl)))),
      h('div.jv-set-row', null,
        h('div.jv-set-lbl', null, h('span', null, 'Характер супутника')),
        h('select.wb-select', {
          'aria-label': 'Характер супутника',
          onchange: (/** @type {Event} */ e) => updateJarvis({ persona: /** @type {HTMLSelectElement} */ (e.target).value }),
        }, (j.personas || []).map((/** @type {any} */ p) => h('option', { value: p.id, selected: p.id === j.persona }, p.name)))),
      h('div.jv-set-row', null,
        h('div.jv-set-lbl', null,
          h('span', null, 'Голосові тригери загроз'),
          h('small.muted', null, 'Озвучення ворогів зі спини, критичного ХП та зносу броні (0 токенів API)')),
        renderSwitch(Boolean(j.voiceAlertsEnabled), (v) => updateJarvis({ voiceAlertsEnabled: v }), 'Голосові тригери загроз')),
      h('div.jv-group-title', null, 'Швидкі набори модулів'),
      h('div.jv-presets', null, (j.presets || []).map((/** @type {any} */ p) =>
        h('button.btn.small', { type: 'button', onclick: () => updateJarvis({ preset: p.id }) }, p.name))),
      bonuses ? h('div.small.muted.jv-note', null, bonuses) : null);
  }

  if (sec === 'mods') {
    return h('div.jv-sec', null,
      h('h4.jv-sec-title', null, '🧩 Модулі ядра (CU)'),
      h('div.jv-mods', null, (j.modules || []).map((/** @type {any} */ m) =>
        h(`div.jv-mod-row${m.enabled ? '.on' : ''}`, { title: m.desc || '' },
          h('span.jv-mod-ic', null, m.icon),
          h('div.jv-mod-txt', null,
            h('b', null, m.name),
            h('small.muted', null, m.shortDesc || '')),
          h('span.jv-cu-cost', null, `${m.cost} CU`),
          renderSwitch(Boolean(m.enabled), (v) => updateJarvis({ enabledModules: { [m.id]: v } }), m.name)))));
  }

  if (sec === 'voice') {
    const st = j.pttStatus || {};
    const chk = cache.pttCheck;
    const stt = j.stt || {};
    return h('div.jv-sec', null,
      h('h4.jv-sec-title', null, '🎙️ Голосовий ввід у грі (Push-to-Talk)'),
      h('div.jv-set-row', null,
        h('div.jv-set-lbl', null, h('span', null, 'Клавіша у грі')),
        h('kbd.ai-kbd.jv-key', null, j.pttHotkey ? `${j.pttHotkey}${j.pttHotkeyTitle && j.pttHotkeyTitle !== j.pttHotkey ? ` — ${j.pttHotkeyTitle}` : ''}` : '—')),
      h('div.jv-set-row', null,
        h('div.jv-set-lbl', null,
          h('span', null, 'Стан перехоплення'),
          st.message ? h('small.muted', null, st.message) : null),
        h('span.small', null, PTT_MODE[st.mode] || PTT_MODE.unknown)),
      h('div.jv-group-title', null, 'Швидке призначення бічної кнопки миші'),
      h('div.jv-btns', null,
        h('button.btn.small', { type: 'button', onclick: () => updateJarvis({ pttHotkey: 'Mouse5' }) }, '🖱️ Mouse5 (дальня)'),
        h('button.btn.small', { type: 'button', onclick: () => updateJarvis({ pttHotkey: 'Mouse4' }) }, '🖱️ Mouse4 (ближня)')),
      chk ? h('div.jv-check', null,
        h('div.small', { style: { color: 'var(--bad)' } }, `✕ «${chk.canonical}» перетинається з клавішами гри (${chk.source}):`),
        h('ul.small', null, (chk.conflicts || []).slice(0, 6).map((/** @type {any} */ c) => h('li', null, h('b', null, c.name), ` · ${c.ns} — ${c.why}`))),
        h('button.btn.small', { type: 'button', onclick: () => updateJarvis({ pttHotkey: chk.canonical, force: true }) }, '⚠ Все одно призначити')) : null,
      h('div.jv-set-row', null,
        h('div.jv-set-lbl', null, h('span', null, 'Надсилати одразу після диктування')),
        renderSwitch(j.pttAutoSend !== false, (v) => updateJarvis({ pttAutoSend: v }), 'Автонадсилання голосу')),
      h('div.small.muted.jv-note', null,
        'Довільну комбінацію з Ctrl / Shift / Alt призначає рекордер у HUD (Alt+Q → ⚙️) або у вікні ATM11-Companion. Для голосового вводу прямо на сайті використовуйте кнопку 🎙️ у полі чату праворуч.'),
      h('div.small.muted.jv-note', null,
        stt.available === false
          ? 'Whisper STT у компаньйоні вимкнено (немає TOGETHER_API_KEY у .env).'
          : `Whisper STT: ${stt.model || 'openai/whisper-large-v3'} · запитів ${stt.requests || 0} (успішно ${stt.ok || 0}, аудіо ${stt.audioSec || 0} с)`));
  }

  if (sec === 'soul') {
    const soul = j.soul || {};
    const soulOn = Boolean((j.modules || []).find((/** @type {any} */ m) => m.id === 'companion_soul')?.enabled);
    const fd = (j.soulFrequencies || []).find((/** @type {any} */ f) => f.id === j.soulFrequency);
    return h('div.jv-sec', null,
      h('h4.jv-sec-title', null, '✨ Живий супутник'),
      h('div.jv-group-title', null, 'Частота реплік'),
      h('div.seg.jv-seg-wide', null, (j.soulFrequencies || []).map((/** @type {any} */ f) =>
        h(`button${j.soulFrequency === f.id ? '.on' : ''}`, { type: 'button', title: f.desc, onclick: () => updateJarvis({ soulFrequency: f.id }) }, f.name))),
      h('div.small.muted.jv-note', null, soulOn ? (fd?.desc || '') : 'Модуль «Живий характер супутника» вимкнено в розділі «Модулі (CU)».'),
      h('div.small.jv-note', null, `Реплік за сесію: ${soul.lines || 0} · порад ШІ: ${soul.advice || 0} / ${soul.adviceMax || 0}`),
      h('div.jv-group-title', null, 'Тест реплік супутника'),
      h('div.jv-btns', null, [['dim', '🌀 Тест: вимір'], ['deep_dark', '🌑 Глибини'], ['night', '🌙 Ніч']].map(([id, lbl]) =>
        h('button.btn.small', {
          type: 'button',
          onclick: async () => {
            const { r, d } = await apiCall('/api/jarvis/soul-test', { type: id });
            setToast(r.ok ? `✨ ${d.alert?.text || 'Репліку надіслано в HUD'}` : `⚠ ${d.error || r.status}`);
          },
        }, lbl))),
      h('div.jv-group-title', null, '🔊 Тест тригерів загроз'),
      h('div.jv-btns', null, [['stealth_mob', '💥 Ворог ззаду'], ['low_hp', '❤️‍🩹 ХП ≤30%'], ['low_gear', '🛡️ Знос <5%']].map(([id, lbl]) =>
        h('button.btn.small', {
          type: 'button',
          onclick: async () => {
            const { r } = await apiCall('/api/jarvis/test-alert', { type: id });
            setToast(r.ok ? '🔊 Тестовий сигнал надіслано в HUD' : '⚠ Не вдалося надіслати сигнал');
          },
        }, lbl))),
      (soul.recent || []).length ? h('div.chips.jv-note', null,
        soul.recent.map((/** @type {any} */ x) => h('span.chip', { title: new Date(x.ts).toLocaleTimeString() }, x.text))) : null);
  }

  if (sec === 'storage') {
    ensureOwnLoaded(false);
    const rv = Math.max(16, Math.min(128, Math.round((Number(j.ownZoneRadius) || 48) / 8) * 8));
    const pct = `${(((rv - 16) / (128 - 16)) * 100).toFixed(1)}%`;
    const badgeEl = h('span.badge', { style: { '--c': 'var(--accent)' } }, `${rv} бл.`);
    const rangeEl = /** @type {HTMLInputElement} */ (h('input.jv-range', {
      type: 'range',
      min: '16',
      max: '128',
      step: '8',
      value: String(rv),
      style: { '--slider-pct': pct },
      oninput: () => {
        const v = Number(rangeEl.value) || 48;
        rangeEl.style.setProperty('--slider-pct', `${(((v - 16) / (128 - 16)) * 100).toFixed(1)}%`);
        badgeEl.textContent = `${v} бл.`;
      },
      onchange: () => updateJarvis({ ownZoneRadius: Number(rangeEl.value) || 48 }),
    }));
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
      h('div.jv-set-col', null,
        h('div.jv-set-top', null,
          h('div.jv-set-lbl', null,
            h('span', null, 'Радіус зони «тут моя база / шахта / ферма»'),
            h('small.muted', null, 'Поставлені й сусідні скрині у цьому радіусі вважаються вашими')),
          badgeEl),
        h('div.jv-slider-wrap', null,
          rangeEl,
          h('div.jv-slider-ticks', null,
            h('span', null, '16'),
            h('span', null, '48 (типово)'),
            h('span', null, '96'),
            h('span', null, '128 бл.')))),
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
  const j = cache.last;
  if (!cache.connected || !j || !Array.isArray(j.modules)) {
    mount(cache.root, h('div.card.jv-offline', null,
      h('div.jv-head', null,
        h('h3', null, '🧠 Ядро Компаньйона (Джарвіс V1.0) та 📦 Сховища'),
        h('span.badge.ghost', null, 'Міст офлайн')),
      h('p.small.muted', null,
        'Ця вкладка керує живим ядром ATM11-Companion (:8812): модулями CU, характером Джарвіса, Push-to-Talk, радіусом зон бази та миттєвим пошуком по скринях (!де). Запустіть ATM11-Companion на ПК, щоб активувати панель.'),
      h('div.jv-btns', null,
        cache.onReconnect ? h('button.btn.small.primary', {
          type: 'button',
          onclick: () => cache.onReconnect && cache.onReconnect(),
        }, '🔌 Перевірити підключення (:8812)') : null)));
    return;
  }

  const used = Number(j.usedCu) || 0;
  const max = Number(j.maxCu) || 100;
  const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;

  mount(cache.root, h('div.card.jv-shell', null,
    h('div.jv-head', null,
      h('div', null,
        h('h3', null, '🧠 Ядро Компаньйона (Джарвіс V1.0)'),
        h('span.small.muted', null, 'Ті самі налаштування, що в ігровому HUD (Alt+Q) та вікні ATM11-Companion')),
      h('span.badge', { style: { '--c': used > max ? 'var(--bad)' : 'var(--accent)' } }, `${used} / ${max} CU`)),
    h('div.jv-cu', null, h('div.jv-cu-fill', { style: { width: `${pct}%` } })),
    cache.toast ? h('div.small.jv-toast', null,
      h('span', null, cache.toast),
      h('button.wb-btn', { type: 'button', onclick: () => setToast('') }, '✕')) : null,
    h('div.jv-layout', null,
      h('nav.jv-nav', { role: 'tablist', 'aria-label': 'Розділи ядра Джарвіса' },
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
      h('div.jv-pane', null, renderActivePane(j)))));
}

/**
 * Рендерить вкладку «🧠 Ядро Джарвіса та сховища».
 * @param {any} st
 * @param {string} baseUrl
 * @param {() => Promise<void> | void} [onReconnect]
 */
export function renderJarvisTab(st, baseUrl, onReconnect) {
  cache.baseUrl = baseUrl;
  cache.connected = Boolean(st.liveConnected);
  cache.onReconnect = onReconnect || null;
  if (st.liveState?.jarvis) cache.last = st.liveState.jarvis;
  cache.stats = st.liveState?.storageIndexStats || cache.stats;
  if (!cache.root) cache.root = h('div.jv-wrap');
  draw();
  return cache.root;
}

/** Оновлення з події SSE jarvis-state. @param {any} j */
export function updateJarvisState(j) {
  if (!j || !Array.isArray(j.modules)) return;
  // Не перериваємо перетягування повзунка радіуса зони під час SSE-оновлення
  const active = document.activeElement;
  if (active && active.classList?.contains('jv-range')) {
    cache.last = { ...j, ownZoneRadius: cache.last?.ownZoneRadius ?? j.ownZoneRadius };
    return;
  }
  cache.last = j;
  draw();
}
