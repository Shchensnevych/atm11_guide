// @ts-check
// Сторінка «🤖 Помічник» (#/assistant):
//   1) Радник «Наступні кроки за сейвом» (стовбур, розпочаті квести, відкриті віхи, інвентар з NBT, latest.log);
//   2) Автономний пошук по базі путівника (BM25 + укр. стемер + словник понять + триграми) — без ШІ;
//   3) Жива синергія з десктопним компаньйоном ATM11-Companion (http://127.0.0.1:8812/events та /state):
//      синхронізація моделі, радар «Інвентар + Curios → Гарячі клавіші», останній скріншот F2 (Vision Qwen 2.5 VL 72B) і стрічка подій.
import { h, mount } from '../core/dom.js';
import { switchWorld, applyBrowserGameState, resetToBuiltProgress } from '../core/store.js';
import { isDone, setDone } from '../core/progress.js';
import { pickGameFolder, rescanSavedGameFolder, getBrowserGameState } from '../core/game-folder.js';
import { analyzePlayerState, buildPlayerContextPrompt } from '../core/advisor.js';
import {
  buildCorpus,
  searchGuide,
  composeLocalAnswer,
  COMPANION_MODELS,
  COMPANION_VISION_MODELS,
  loadAssistantConfig,
  saveAssistantConfig,
  askExternalPipeline,
} from '../core/rag.js';
import { stageBadge, clsBadge } from '../components/badge.js';

/** Безпечний рендер Markdown-відповіді ШІ: лише DOM через h() / textContent, без innerHTML (SECURITY §4).
 * Підтримує заголовки #–####, абзаци, марковані й нумеровані списки (зокрема впереміш з текстом), **жирний**, *курсив*, `код`
 * і посилання [текст](#/…) на сторінки путівника або https://. @param {string} md */
function renderMd(md) {
  const lines = String(md || '').replace(/\r/g, '').split('\n');
  /** @type {any[]} */
  const out = [];
  /** @type {{ ordered: boolean, items: any[] } | null} */
  let list = null;
  /** @type {string[]} */
  let para = [];
  const flushPara = () => {
    if (para.length) out.push(h('p', null, inlineMd(para.join(' '))));
    para = [];
  };
  const flushList = () => {
    if (list) out.push(h(list.ordered ? 'ol.ai-list' : 'ul.ai-list', null, list.items));
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); flushList(); continue; }
    const hm = /^(#{1,4})\s+(.*)$/.exec(line);
    if (hm) { flushPara(); flushList(); out.push(h(hm[1].length <= 2 ? 'h2' : 'h3', null, inlineMd(hm[2]))); continue; }
    const lm = /^(\d+[.)]|[-*•])\s+(.*)$/.exec(line);
    if (lm) {
      flushPara();
      const ordered = /^\d/.test(lm[1]);
      if (!list || list.ordered !== ordered) { flushList(); list = { ordered, items: [] }; }
      list.items.push(h('li', null, inlineMd(lm[2])));
      continue;
    }
    if (/^>\s?/.test(line)) { flushPara(); flushList(); out.push(h('blockquote', null, inlineMd(line.replace(/^>\s?/, '')))); continue; }
    flushList();
    para.push(line);
  }
  flushPara();
  flushList();
  return h('div.ai-md', null, out);
}

/** @param {string} line */
function inlineMd(line) {
  const out = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|\*(.+?)\*|`(.+?)`/g;
  let last = 0;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(line.slice(last, m.index));
    if (m[1]) out.push(h('b', null, m[1]));
    else if (m[2]) {
      const href = m[3];
      // Лише сторінки путівника (#/…) і https:// — інше показуємо текстом
      if (/^#\//.test(href)) out.push(h('a', { href }, m[2]));
      else if (/^https:\/\//i.test(href)) out.push(h('a', { href, target: '_blank', rel: 'noopener noreferrer' }, m[2]));
      else out.push(m[2]);
    } else if (m[4]) out.push(h('em', null, m[4]));
    else if (m[5]) out.push(h('code', null, m[5]));
    last = re.lastIndex;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

const PRESET_QUESTIONS = [
  ['🎯 Що робити далі за сейвом?', 'Що мені робити далі за моїм сейвом і які квести завершити?'],
  ['🎒 Де зберігати речі?', 'Де зберігати речі на старті: ранець, шухляди, скрині та мережі?'],
  ['⚡ Перша енергія FE', 'Як отримати першу енергію FE та які генератори краще ставити?'],
  ['🔩 Як зробити сталь?', 'Як зробити сталь і чому не крафтиться сталь MFFS або Oritech?'],
  ['⛏ Чому не крафтиться кар’єр?', 'Чому не крафтиться кар’єр QuarryPlus і Руйнівник чанків та чим копати руди?'],
  ['⭐ ATM Star у цій версії', 'Чому не крафтиться ATM Star у цій версії і які компоненти активні?'],
  ['⌨️ Важливі клавіші', 'Які гарячі клавіші призначені для ранця, квестів, Curios, пояса та терміналів?'],
];

/**
 * Будує резервний радар «Інвентар + Curios → Гарячі клавіші» за статичним сейвом і keys.json,
 * коли живий міст ATM11-Companion ще не запущено.
 * @param {Store} s
 * @param {any} an
 */
function buildStaticKeyRadar(s, an) {
  const binds = s.keys?.keybinds || [];
  const invIds = an.invEntries.map((/** @type {any} */ e) => e.id);
  const activeMods = new Set(invIds.map((/** @type {string} */ id) => id.split(':')[0]));
  const out = [];

  // Завжди показуємо ключові слоти рюкзака/Curios/квестів + моди з інвентарю
  const priorityActions = [
    { match: /backpack|ранець/i, slotLabel: 'Спина / Curios · Ранець', itemUk: 'Ранець (Sophisticated Backpacks)' },
    { match: /curios|аксесуар/i, slotLabel: 'Меню слотів Curios', itemUk: 'Слоти аксесуарів Curios' },
    { match: /quest|квест/i, slotLabel: 'Книга квестів FTB', itemUk: 'Квести FTB Quests' },
    { match: /belt|пояс/i, slotLabel: 'Пояс (Tool Belt)', itemUk: 'Пояс для інструментів' },
    { match: /vein|жила|ftbultimine/i, slotLabel: 'Копання жили', itemUk: 'FTB Ultimine (копання жили)' },
  ];

  for (const pa of priorityActions) {
    const kb = binds.find((/** @type {any} */ b) => pa.match.test(`${b.action_uk || ''} ${b.action_en || ''} ${b.id || ''} ${b.mod_id || ''}`));
    if (kb) {
      out.push({
        itemId: kb.mod_id || kb.id,
        itemUk: pa.itemUk,
        slotLabel: pa.slotLabel,
        modName: kb.mod_name || kb.mod_id || 'ATM11',
        actionUk: kb.action_uk || kb.action_en || kb.id,
        keyUk: kb.key_uk || kb.key || 'Не призначено',
        unbound: Boolean(kb.unbound),
        conflict: (kb.conflicts || []).length > 0,
        balmWarn: Boolean(kb.kuma_unsafe),
      });
    }
  }

  for (const e of an.invEntries.slice(0, 12)) {
    const modId = e.id.split(':')[0];
    if (modId === 'minecraft') continue;
    const modBinds = binds.filter((/** @type {any} */ b) => b.mod_id === modId || (b.id && b.id.toLowerCase().includes(modId)));
    if (modBinds.length) {
      const kb = modBinds[0];
      out.push({
        itemId: e.id,
        itemUk: e.name,
        slotLabel: `Інвентар ×${e.count}`,
        modName: kb.mod_name || modId,
        actionUk: kb.action_uk || kb.action_en || kb.id,
        keyUk: kb.key_uk || kb.key || 'Не призначено',
        unbound: Boolean(kb.unbound),
        conflict: (kb.conflicts || []).length > 0,
        balmWarn: Boolean(kb.kuma_unsafe),
      });
    }
  }
  return out;
}

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export async function render(el, _p, s) {
  const qs = new URLSearchParams(location.hash.split('?')[1] || '');
  const st = {
    leftTab: /** @type {'radar'|'next'|'inv'|'log'} */ ('radar'),
    query: qs.get('q') || '',
    cfg: loadAssistantConfig(),
    showCfg: false,
    busyFolder: false,
    busyAsk: false,
    busyVision: false,
    statusMsg: '',
    bridgeInfo: /** @type {any} */ (null),
    liveState: /** @type {any} */ (null),
    liveConnected: false,
    answerTitle: '',
    answerMd: '',
    answerProvider: '',
    hits: /** @type {any[]} */ ([]),
  };

  let an = await analyzePlayerState(s);
  const corpus = buildCorpus(s);
  const bState = () => getBrowserGameState();
  /** @type {EventSource | null} */
  let sse = null;

  const headBox = h('div');
  const leftBox = h('div.ai-left');
  const rightBox = h('div.ai-right');

  const baseBridgeUrl = () => (st.cfg.bridgeUrl || 'http://127.0.0.1:8812').replace(/\/$/, '');

  // Підключення до живого потоку ATM11-Companion (/state + /events SSE)
  async function connectCompanionBridge() {
    const url = baseBridgeUrl();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1800);
      const r = await fetch(`${url}/state`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (r.ok) {
        const data = await r.json();
        applyLiveCompanionState(data, true);
        setupSSE(url);
      }
    } catch {
      st.liveConnected = false;
    }
  }

  /**
   * Чи на одній базі сайт і міст (C2): відбиток docs/data/meta.json сайту ↔ base.fingerprint з /state моста.
   * Повертає попередження (рядок) або '' — бази однакові або порівняти нема з чим.
   */
  function baseMismatch() {
    if (!st.liveConnected) return '';
    const mine = s.meta?.fingerprint || '';
    const br = st.liveState?.base;
    if (!br || !br.fingerprint) return mine ? 'Міст старої версії — не повідомляє версію бази путівника. Оновіть ATM11-Companion.' : '';
    if (!mine || br.fingerprint === mine) return '';
    const bt = String(br.built || ''); const mt = String(s.meta?.built || '');
    return bt && mt && bt < mt
      ? `Міст на старій базі путівника (зібрано ${bt}, сайт — ${mt}): перезапустіть компаньйон або start.bat → «Оновити все».`
      : `Сайт на іншій базі, ніж міст (сайт — ${mt || '?'}, міст — ${bt || '?'}): оновіть сторінку; онлайн-копія сайту оновлюється після git push.`;
  }

  /** @param {any} data @param {boolean} isInitial */
  function applyLiveCompanionState(data, isInitial = false) {
    if (!data || !data.ok) return;
    const prevFolder = st.liveState?.world?.folder;
    st.liveState = data;
    st.liveConnected = true;
    // Один вибір світу: сайт іде за світом, вибраним у мості (автовибір — останній зіграний)
    const folder = data.world?.folder;
    if (folder && folder !== prevFolder) {
      const pw = (s.progress?.worlds || []).find((w) => w.folder === folder || w.world === data.world?.name);
      if (pw && pw.slug !== s.progress?.slug) {
        switchWorld(pw.slug).then(async () => { an = await analyzePlayerState(s); drawAll(); }).catch(() => {});
      }
    }
    st.bridgeInfo = {
      ok: true,
      providers: Array.isArray(data.providers) ? data.providers : [],
    };
    if (data.selectedModel && st.cfg.openaiModel !== data.selectedModel) {
      st.cfg.openaiModel = data.selectedModel;
      saveAssistantConfig(st.cfg);
    }
    if (data.selectedVisionModel && st.cfg.visionModel !== data.selectedVisionModel) {
      st.cfg.visionModel = data.selectedVisionModel;
      saveAssistantConfig(st.cfg);
    }
    if (isInitial) {
      drawAll();
    } else {
      drawHead();
      if (st.leftTab === 'radar' || st.leftTab === 'inv' || st.leftTab === 'log') drawLeft();
    }
  }

  /** @param {string} url */
  function setupSSE(url) {
    if (sse) {
      try { sse.close(); } catch { /* ignore */ }
      sse = null;
    }
    try {
      sse = new EventSource(`${url}/events`);
      sse.addEventListener('state', (ev) => {
        if (!el.isConnected) {
          sse?.close();
          return;
        }
        try {
          const data = JSON.parse(/** @type {MessageEvent} */ (ev).data);
          applyLiveCompanionState(data, false);
        } catch { /* ignore */ }
      });
      sse.addEventListener('game-event', (ev) => {
        if (!el.isConnected) {
          sse?.close();
          return;
        }
        try {
          const item = JSON.parse(/** @type {MessageEvent} */ (ev).data);
          if (st.liveState) {
            st.liveState.events = [item, ...(st.liveState.events || []).slice(0, 29)];
            if (st.leftTab === 'radar') drawLeft();
          }
        } catch { /* ignore */ }
      });
      sse.onerror = () => {
        st.liveConnected = false;
        sse?.close();
        sse = null;
      };
    } catch { /* ignore */ }
  }

  /** Синхронізує обрану модель із мостом ATM11-Companion. @param {string} modelId @param {string} [visionId] */
  async function syncModelWithBridge(modelId, visionId) {
    st.cfg.openaiModel = modelId;
    if (visionId) st.cfg.visionModel = visionId;
    saveAssistantConfig(st.cfg);
    if (st.liveConnected) {
      try {
        const r = await fetch(`${baseBridgeUrl()}/set-model`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: modelId, visionModel: visionId || st.cfg.visionModel }),
        });
        if (r.ok && st.liveState) {
          const d = await r.json();
          st.liveState.selectedModel = d.selectedModel || modelId;
          st.liveState.selectedVisionModel = d.selectedVisionModel || st.cfg.visionModel;
        }
      } catch { /* ignore */ }
    }
    drawHead();
    drawRight();
  }

  /** Розбір останнього скріншота F2 через Vision AI (Qwen 2.5 VL 72B). */
  async function runVisionF2(customPrompt = '') {
    if (!st.liveConnected) {
      st.statusMsg = '⚠ Для аналізу скріншота F2 запустіть міст ATM11-Companion (порт 8812).';
      drawHead();
      return;
    }
    st.busyVision = true;
    st.busyAsk = true;
    const q = customPrompt || st.query || 'Що зображено на цьому скріншоті гри ATM11? Поясни українською призначення блоків, предметів або інтерфейсу та що робити далі.';
    st.query = q;
    drawLeft();
    drawRight();
    try {
      const r = await fetch(`${baseBridgeUrl()}/api/vision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          visionModel: st.cfg.visionModel || 'qwen/qwen2.5-vl-72b-instruct',
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error);
      st.answerMd = d.answer || '';
      st.answerProvider = `👁️ Vision AI: ${d.provider || st.cfg.visionModel}`;
    } catch (e) {
      st.answerMd = `⚠ Не вдалося розібрати скріншот через Vision AI: ${e instanceof Error ? e.message : String(e)}`;
      st.answerProvider = '👁️ Vision AI (помилка)';
    } finally {
      st.busyVision = false;
      st.busyAsk = false;
      drawLeft();
      drawRight();
    }
  }

  // Початкова відповідь — план за поточним сейвом + гібридний RAG (або живий міст)
  async function runQuery(qText, useExternal = st.cfg.mode !== 'local') {
    st.query = qText;
    st.busyAsk = true;
    drawRight();
    try {
      const hits = await searchGuide(s, qText || 'наступні кроки головний шлях початок', an, 7);
      st.hits = hits;
      if (useExternal && st.cfg.mode !== 'local') {
        const logTail = st.liveState?.logTail || bState()?.logTail || '';
        // Режим мосту: шлемо лише питання й світ, вибраний у мосту (база й стан світу — на боці моста)
        const res = await askExternalPipeline(qText, hits, an, s, st.cfg, logTail, { world: st.liveState?.world?.folder });
        st.answerMd = res.answer;
        st.answerProvider = `🤖 ШІ-компаньйон: ${res.provider}`;
      } else {
        st.answerMd = composeLocalAnswer(qText, hits, an, s);
        st.answerProvider = '⚡ Локальний радник + Гібридний RAG (BM25 + Укр. стемер + Синоніми ATM11 + Триграми)';
      }
    } catch (e) {
      st.answerMd = composeLocalAnswer(qText, st.hits, an, s)
        + `\n\n> ⚠ Примітка: зовнішній API недоступний (${e instanceof Error ? e.message : String(e)}), тому показано точну локальну відповідь за базою путівника.`;
      st.answerProvider = '⚡ Локальний радник (fallback з API)';
    } finally {
      st.busyAsk = false;
      drawRight();
    }
  }

  async function onPickFolder(rescan = false) {
    st.busyFolder = true;
    st.statusMsg = '⏳ Зчитування сейвів, NBT та options.txt у браузері…';
    drawHead();
    try {
      const res = rescan ? await rescanSavedGameFolder(s) : await pickGameFolder(s);
      await applyBrowserGameState(res);
      an = await analyzePlayerState(s);
      const wCount = (res.worlds || []).length;
      st.statusMsg = `✅ Отримано з теки «${res.folderName}»: світів ${wCount}${res.keysUpdated ? `, клавіш ${res.keysUpdated}` : ''}${res.logTail ? ', latest.log' : ''}.`;
      await runQuery(st.query, false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== 'cancelled' && !/AbortError|user aborted/i.test(msg)) {
        st.statusMsg = `⚠ ${msg}`;
      } else {
        st.statusMsg = '';
      }
    } finally {
      st.busyFolder = false;
      drawAll();
    }
  }

  function drawHead() {
    const p = s.progress;
    const worlds = p?.worlds || [];
    const bs = bState();
    const lv = st.liveState;
    const modeUk = lv?.world?.modeUk || p?.mode_uk || p?.mode || '';
    const activeWorldName = lv?.world?.name || p?.world || '';
    // міст повертає список назв моделей Ollama (рядки)
    const ollamaList = (lv?.ollamaModels || []).map((/** @type {string} */ name) => ({
      id: `local/${name}`,
      label: `Ollama · ${name} (локальна)`,
      provider: 'Ollama',
    }));
    const allModels = [...COMPANION_MODELS, ...ollamaList];

    mount(headBox, h('section.card.ai-hero', null,
      h('div.ai-hero-top', null,
        h('div', null,
          h('h1', { style: { margin: 0 } }, '🤖 Живий ШІ-компаньйон і радник ATM11'),
          h('div.small.muted', { style: { marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' } },
            activeWorldName
              ? `Активний світ: «${activeWorldName}» (${modeUk}) · остання гра: ${p?.last_played || 'сьогодні'} · у грі: ${p?.play_hours || 0} год`
              : 'Світ не вибрано',
            baseMismatch() ? h('span.badge', { style: { '--c': 'var(--warn)' }, title: baseMismatch() }, `⚠ ${baseMismatch()}`) : null,
            st.liveConnected
              ? h('span.badge', { style: { '--c': 'var(--ok)' } }, `🟢 ATM11-Companion Live (:8812)`)
              : bs
                ? h('span.badge', { style: { '--c': 'var(--ok)' } }, `📂 Живі дані з браузера (${bs.folderName} · ${bs.updated})`)
                : h('span.badge.ghost', null, `Знімок збірки (${p?.updated || 'data/progress.json'})`))),
        h('div.ai-folder-actions', null,
          h('label.small.ai-model-picker', { title: 'Синхронізований вибір моделі з ATM11-Companion' },
            '🧠 Модель: ',
            h('select.wb-select', {
              'aria-label': 'Модель ШІ',
              onchange: (e) => syncModelWithBridge(e.target.value),
            }, allModels.map((m) => h('option', { value: m.id, selected: m.id === st.cfg.openaiModel }, m.label)))),
          st.liveConnected && (lv?.worlds || []).length ? h('select.wb-select', {
            'aria-label': 'Світ (спільний вибір моста ATM11-Companion)',
            title: 'Світ вибирається в мості — один для HUD, панелі й сайту. Автовибір — світ, у який грали останнім.',
            onchange: async (e) => {
              try {
                const r = await fetch(`${baseBridgeUrl()}/api/world`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ world: e.target.value }),
                });
                if (r.ok) applyLiveCompanionState(await r.json(), false);
              } catch { /* ignore */ }
            },
          },
          h('option', { value: '', selected: lv?.worldSelection?.auto !== false }, `Автовибір (останній зіграний${lv?.worldSelection?.auto !== false && lv?.world ? `: ${lv.world.name}` : ''})`),
          (lv?.worlds || []).map((/** @type {any} */ w) => h('option', { value: w.folder, selected: lv?.worldSelection?.auto === false && w.folder === lv?.world?.folder }, `${w.name} (${w.modeUk})`)))
          : worlds.length > 1 ? h('select.wb-select', {
            'aria-label': 'Світ для аналізу',
            onchange: async (e) => {
              const slug = e.target.value;
              await switchWorld(slug);
              an = await analyzePlayerState(s);
              drawAll();
              runQuery(st.query, false);
            },
          }, worlds.map((w) => h('option', { value: w.slug, selected: w.slug === p?.slug }, `${w.world} (${w.mode_uk || w.mode})`))) : null,
          st.liveConnected ? h('button.btn', {
            title: 'Миттєво пересканувати активний сейв, інвентар, Curios і скріншоти F2 через ATM11-Companion',
            onclick: async () => {
              try {
                const r = await fetch(`${baseBridgeUrl()}/rescan`, { method: 'POST' });
                if (r.ok) applyLiveCompanionState(await r.json(), true);
              } catch { /* ignore */ }
            },
          }, '🔄 Оновити міст') : null,
          h('button.btn.primary', {
            disabled: st.busyFolder,
            title: 'Обрати теку гри (All the Mods 11 або minecraft) прямо в браузері без Python: оновлює saves/<світ> та options.txt',
            onclick: () => onPickFolder(false),
          }, h('span.btn-ic', null, '📂'), ' Вказати теку гри'),
          bs ? h('button.btn', {
            disabled: st.busyFolder,
            title: 'Перечитати сейви й options.txt з обраної теки гри',
            onclick: () => onPickFolder(true),
          }, '🔄 Оновити з гри') : null,
          bs ? h('button.btn', {
            title: 'Повернути стандартні дані збірки (data/progress.json та data/keys.json)',
            onclick: async () => {
              await resetToBuiltProgress();
              an = await analyzePlayerState(s);
              st.statusMsg = '↺ Повернуто дані збірки.';
              drawAll();
              runQuery(st.query, false);
            },
          }, '↺ Дані збірки') : null)),
      st.statusMsg ? h('div.ai-status-line.small', null, st.statusMsg) : null,
      h('div.ai-kpis', null,
        kpi(`${an.currentStage.icon} Етап ${an.currentStage.n}`, an.currentStage.title, `#/roadmap/${an.currentStage.id}`),
        kpi(`${an.doneNodes.length} / ${s.roadmap.nodes.length}`, `віх виконано · відкрито зараз: ${an.availNodes.length}`, '#/roadmap'),
        kpi(`${p?.quests?.done?.length || 0}`, `квестів виконано · у процесі: ${an.startedQuests.length}`, '#/chapters'),
        kpi(`${lv?.player?.totalItemsCount ?? an.invEntries.length} / ${p?.items?.obtained?.length || 0}`, 'у слотах (інв. + Curios) / здобуто', null),
        kpi(`XP ${lv?.player?.xpLevel ?? p?.player?.xp_level ?? 0} · ${an.worldTierUk}`, `вимір: ${lv?.player?.dimensionUk || an.dimUk} · страв: ${p?.player?.unique_foods ?? 0}`, null))));
  }

  function drawLeft() {
    const radarItems = st.liveState?.keyRadar?.length ? st.liveState.keyRadar : buildStaticKeyRadar(s, an);
    const evCount = (st.liveState?.events || []).length;
    mount(leftBox,
      h('div.ai-tabs', null,
        [['radar', `⌨️ Радар клавіш + F2 (${radarItems.length})`],
         ['next', `🎯 Наступні кроки (${an.availNodes.length})`],
         ['inv', `🎒 Інвентар + Curios (${st.liveState?.player?.allItems?.length || an.invEntries.length})`],
         ['log', `📜 Події та лог${evCount ? ` (${evCount})` : ''}`]].map(([id, label]) =>
          h(`button${st.leftTab === id ? '.on' : ''}`, { onclick: () => { st.leftTab = /** @type {any} */ (id); drawLeft(); } }, label))),
      st.leftTab === 'radar' ? renderRadarAndVisionTab(s, an, st, radarItems, runQuery, runVisionF2)
        : st.leftTab === 'next' ? renderNextTab(s, an, async () => { an = await analyzePlayerState(s); drawHead(); drawLeft(); })
        : st.leftTab === 'inv' ? renderInvTab(s, an, st.liveState)
        : renderLogTab(s, an, st.liveState?.logTail || bState()?.logTail || '', st.liveState));
  }

  function drawRight() {
    const inp = /** @type {HTMLInputElement} */ (h('input.ai-input', {
      type: 'search',
      placeholder: 'Запитайте українською: що в руці, як працює предмет, що робити далі, чому не крафтиться…',
      value: st.query,
      onkeydown: (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Enter') runQuery(inp.value); },
    }));

    mount(rightBox,
      h('div.card.ai-rag-card', null,
        h('div.ai-rag-head', null,
          h('div', null,
            h('h2', { style: { margin: 0 } }, '🔎 Гібридний пошук (RAG) і ШІ-чат компаньйона'),
            h('div.small.muted', null, st.cfg.mode === 'bridge' && st.liveState?.knowledge?.mods
              ? `ШІ відповідає через міст: база путівника — модів ${st.liveState.knowledge.mods}, клавіш ${st.liveState.knowledge.keys}, квестів ${st.liveState.knowledge.quests}, віх ${st.liveState.knowledge.nodes} + стан світу «${st.liveState.world?.name || '—'}»`
              : `База знань сайту: ${corpus.length} статей (BM25 + укр. стемер + двомовні синоніми ATM11 + триграми)`)),
          h('div.ai-mode-bar', null,
            h('div.seg', null,
              h(`button${st.cfg.mode === 'local' ? '.on' : ''}`, {
                onclick: () => { st.cfg.mode = 'local'; saveAssistantConfig(st.cfg); drawRight(); },
                title: 'Працює миттєво в браузері без API-ключів (BM25 + триграми)',
              }, h('span.btn-ic', null, '⚡'), ' Автономний RAG'),
              h(`button${st.cfg.mode !== 'local' ? '.on' : ''}`, {
                onclick: () => { if (st.cfg.mode === 'local') st.cfg.mode = 'bridge'; saveAssistantConfig(st.cfg); drawRight(); },
                title: 'Живий міст ATM11-Companion (:8812) з DeepSeek V4.1 Flash / Qwen 2.5 72B / Vision VL',
              }, h('span.btn-ic', null, st.liveConnected ? '🟢' : '🔌'), st.liveConnected ? ' Міст ATM11-Companion' : ' Міст (не запущено)')),
            h('button.btn.small', {
              onclick: () => { st.showCfg = !st.showCfg; drawRight(); },
              title: 'Налаштування моста ATM11-Companion (:8812), моделей Together AI / OpenRouter / Ollama',
            }, '⚙'))),
        st.showCfg ? renderConfigBox(st, () => drawRight(), syncModelWithBridge, connectCompanionBridge) : null,
        h('div.ai-ask-row', null,
          inp,
          h('button.btn.primary', {
            disabled: st.busyAsk,
            onclick: () => runQuery(inp.value, st.cfg.mode !== 'local'),
          }, st.busyAsk ? '⏳ Аналіз…' : st.cfg.mode !== 'local' ? [h('span.btn-ic', null, '🤖'), ' Запитати ШІ'] : 'Запитати'),
          st.liveConnected ? h('button.btn', {
            disabled: st.busyVision,
            title: 'Розібрати останній скріншот F2 через Vision AI (Qwen 2.5 VL 72B)',
            onclick: () => runVisionF2(inp.value),
          }, st.busyVision ? '⏳ Vision…' : [h('span.btn-ic', null, '📸'), ' Vision F2']) : null),
        h('div.chips.ai-presets', null, PRESET_QUESTIONS.map(([label, q]) =>
          h(`span.chip${st.query === q ? '.on' : ''}`, {
            style: { '--c': 'var(--accent)' },
            onclick: () => runQuery(q, st.cfg.mode !== 'local'),
          }, label))),
        st.answerMd ? (() => {
          const savedH = localStorage.getItem('atm11_ai_answer_h');
          const box = h('div.ai-answer-box', {
            style: savedH ? { height: savedH } : null,
            title: 'Тягніть за правий нижній куток для зміни висоти (подвійний клік внизу — скинути)',
            ondblclick: (e) => {
              if (e.offsetY > box.clientHeight - 35) {
                box.style.height = '';
                localStorage.removeItem('atm11_ai_answer_h');
              }
            },
          },
            h('div.ai-answer-meta.small.muted', null,
              h('span', null, st.answerProvider),
              st.hits.length ? h('span', null, `знайдено джерел: ${st.hits.length}`) : null),
            renderMd(st.answerMd));

          if (window.ResizeObserver) {
            let roTimer;
            const ro = new ResizeObserver((entries) => {
              clearTimeout(roTimer);
              roTimer = setTimeout(() => {
                for (const entry of entries) {
                  if (entry.target === box && box.style.height) {
                    localStorage.setItem('atm11_ai_answer_h', box.style.height);
                  }
                }
              }, 200);
            });
            ro.observe(box);
          }
          return box;
        })() : null,
        st.hits.length ? h('div.ai-hits', null,
          h('h3.section', { style: { marginTop: '14px' } }, '📚 Релевантні матеріали путівника'),
          h('div.ai-hits-list', null, st.hits.map((hit) => h('a.card.ai-hit', { href: hit.doc.href },
            h('div.ai-hit-top', null,
              h('span.badge', { style: { '--c': hit.doc.kind === 'fact' ? 'var(--warn)' : hit.doc.kind === 'node' ? 'var(--ok)' : 'var(--link)' } }, hit.doc.badge),
              h('b', null, hit.doc.title),
              h('span.small.muted.ai-score', null, `оцінка ${hit.score.toFixed(1)}`)),
            h('div.small.muted.ai-hit-txt', null, hit.doc.text.slice(0, 220) + (hit.doc.text.length > 220 ? '…' : '')))))) : null));
  }

  const drawAll = () => { drawHead(); drawLeft(); drawRight(); };
  mount(el, headBox, h('div.ai-cols', null, leftBox, rightBox));
  drawAll();
  runQuery(st.query, false);
  connectCompanionBridge();
}

/** @param {string} val @param {string} label @param {string | null} href */
function kpi(val, label, href) {
  const inner = [h('b', null, val), h('span.small.muted', null, label)];
  return href ? h('a.ai-kpi', { href }, ...inner) : h('div.ai-kpi', null, ...inner);
}

/**
 * Вкладка «⌨️ Радар клавіш (Інвентар + Curios) + Останній скріншот F2 + Стрічка подій».
 * @param {Store} s
 * @param {any} _an
 * @param {any} st
 * @param {any[]} radarItems
 * @param {(q: string, ext?: boolean) => void} runQuery
 * @param {(q?: string) => void} runVisionF2
 */
function renderRadarAndVisionTab(s, _an, st, radarItems, runQuery, runVisionF2) {
  const lv = st.liveState;
  const shot = lv?.latestScreenshot;
  const baseUrl = (st.cfg.bridgeUrl || 'http://127.0.0.1:8812').replace(/\/$/, '');
  const combat = lv?.combatRadar;
  const events = lv?.events || [];

  return h('div.ai-stack', null,
    // 1. Радар «Інвентар + Curios → Гарячі клавіші»
    h('div.card.ai-radar-card', null,
      h('div.ai-q-head', null,
        h('h3', { style: { margin: 0 } }, '⌨️ Інвентар + Curios → Гарячі клавіші'),
        h('a.small', { href: '#/keys' }, 'Усі 462 клавіші →')),
      h('p.small.muted', { style: { margin: '4px 0 10px' } },
        st.liveConnected
          ? 'Живий зріз предметів, одягнених у слотах Curios, броні, поясі та інвентарі гравця, звірений з актуальним options.txt та правилом Balm / Kuma API:'
          : 'Шпаргалка гарячих клавіш для активних предметів і слотів Curios за даними сейву (запустіть ATM11-Companion для живого моніторингу кожні 2.5 с):'),
      radarItems.length ? h('div.ai-radar-list', null, radarItems.map((/** @type {any} */ r) => {
        const meta = s.items[r.itemId];
        const firstKey = Array.isArray(r.keys) && r.keys.length ? r.keys[0] : null;
        const keyCombo = r.keyUk || (Array.isArray(r.keys) && r.keys.length
          ? r.keys.map((/** @type {any} */ k) => `${k.name}: ${k.combo}`).join(' · ')
          : 'ПКМ / Інвентар');
        const hasWarn = (r.warnings && r.warnings.length > 0) || r.balmWarn || r.unbound || r.conflict;
        const isKuma = r.balmWarn || (r.warnings || []).some((/** @type {string} */ w) => /Balm|Kuma/i.test(w)) || firstKey?.status === 'kuma_warn';
        const statusColor = isKuma ? 'var(--bad)' : hasWarn ? 'var(--warn)' : 'var(--ok)';
        const statusText = isKuma
          ? '🛡 Balm/Kuma: без Ctrl/Shift/Alt!'
          : (r.warnings && r.warnings.length)
            ? r.warnings[0].slice(0, 48)
            : r.unbound
              ? '⚠ Не призначено'
              : r.conflict
                ? '⚡ Конфлікт клавіш'
                : '✔ Активна';
        const subLine = [r.where || r.slotLabel || r.modName || '', r.howToUse || r.actionUk || ''].filter(Boolean).join(' · ');
        return h('div.ai-radar-row', null,
          h('div.ai-radar-item', null,
            meta?.img ? h('img', { src: meta.img, alt: '', width: 24, height: 24 }) : h('span.nc-q', null, '🎒'),
            h('div', null,
              h('b', null, `${r.itemUk || r.actionUk}${r.count > 1 ? ` ×${r.count}` : ''}`),
              h('div.small.muted', null, subLine))),
          h('div.ai-radar-key', null,
            h('kbd.ai-kbd', null, keyCombo),
            h('span.badge', { style: { '--c': statusColor } }, statusText),
            h('button.wb-btn', {
              title: 'Запитати ШІ як користуватися цим предметом і налаштувати клавішу',
              onclick: () => runQuery(`Як користуватися «${r.itemUk || r.actionUk}» (${r.itemId}) та яка клавіша рекомендована?`, st.cfg.mode !== 'local'),
            }, '❓ Як користуватись')));
      })) : h('p.small.muted', null, 'У поточному інвентарі немає спеціальних модових хоткеїв.')),

    // 2. Останній скріншот F2 + Vision AI (Qwen 2.5 VL 72B)
    h('div.card.ai-vision-card', null,
      h('div.ai-q-head', null,
        h('h3', { style: { margin: 0 } }, '📸 Останній скріншот F2 · Vision AI (Qwen 2.5 VL 72B)'),
        shot ? h('span.badge', { style: { '--c': (shot.isFallback || shot.isDemo) ? 'var(--link)' : 'var(--ok)' } },
          (shot.isFallback || shot.isDemo) ? `Огляд інтерфейсу: ${shot.name}` : `Скріншот F2: ${shot.name}`) : null),
      shot && st.liveConnected ? h('div.ai-vision-body', null,
        h('div.ai-shot-wrap', null,
          h('img.ai-shot-img', {
            src: `${baseUrl}/api/screenshot?name=${encodeURIComponent(shot.name)}&t=${Math.floor(shot.mtime || shot.mtimeMs || 1)}`,
            alt: shot.name,
            loading: 'lazy',
          })),
        h('div.ai-shot-actions', null,
          h('p.small.muted', { style: { margin: '0 0 8px' } },
            'Натисніть F2 у грі — скріншот автоматично підтягнеться сюди й в оверлей Alt+Q для миттєвого розбору через Qwen 2.5 VL 72B:'),
          h('div.ai-card-foot', null,
            h('button.btn.small.primary', {
              disabled: st.busyVision,
              onclick: () => runVisionF2('Що зображено на цьому скріншоті гри ATM11? Поясни українською всі елементи та порадь наступні дії.'),
            }, st.busyVision ? '⏳ Аналізую скріншот…' : [h('span.btn-ic', null, '👁️'), ' Розібрати скріншот у 1 клік (Qwen 2.5 VL)']),
            h('button.btn.small', {
              disabled: st.busyVision,
              onclick: () => runVisionF2('Які предмети, блоки або квести видно на екрані і як їх скрафтити чи виконати?'),
            }, '🔍 Що за блоки / інтерфейс?'))))
        : h('p.small.muted', null,
          'Коли запущено ATM11-Companion, тут автоматично відображається останній скріншот із теки minecraft/screenshots/ (клавіша F2) для розбору в 1 клік через Qwen 2.5 VL 72B.')),

    // 3. Бойовий радар та стрічка подій у реальному часі
    h('div.card', null,
      h('div.ai-q-head', null,
        h('h3', { style: { margin: 0 } }, '⚔️ Бойовий радар і стрічка подій у реальному часі'),
        st.liveConnected ? h('span.badge', { style: { '--c': 'var(--ok)' } }, 'SSE Live') : h('span.badge.ghost', null, 'Очікування моста')),
      combat?.lastAlert ? h('div.ai-combat-box', null,
        h('b', { style: { color: 'var(--warn)' } }, `⚔️ ${combat.lastAlert.title || 'Бойове зведення'}`),
        h('p.small', { style: { margin: '4px 0' } }, combat.lastAlert.advice || combat.lastAlert.text || '')) : null,
      events.length ? h('div.ai-events-feed', null, events.slice(0, 10).map((/** @type {any} */ ev) =>
        h('div.ai-ev-row', null,
          h('span.badge', {
            style: { '--c': ev.type === 'death' ? 'var(--bad)' : ev.type === 'kubejs_cmd' ? 'var(--accent)' : ev.type === 'advancement' ? 'var(--ok)' : 'var(--link)' },
          }, ev.type === 'death' ? '💀 Смерть' : ev.type === 'kubejs_cmd' ? '💬 Чат !' : ev.type === 'advancement' ? '🏆 Досягнення' : '📡 Подія'),
          h('span.small', null, ev.text || ev.title || ''),
          ev.time ? h('span.small.muted', { style: { marginLeft: 'auto' } }, ev.time) : null)))
        : h('p.small.muted', null, 'Стрічка подій показує смерті від мобів, нові досягнення, скріншоти F2 та команди !що / !клавіші / !як з ігрового чату (KubeJS).')));
}

/** Вкладка «Наступні кроки за сейвом». @param {Store} s @param {any} an @param {() => void} onChange */
function renderNextTab(s, an, onChange) {
  const qi = s.roadmap.quest_info || {};
  return h('div.ai-stack', null,
    // 1. Смуга прогресу за етапами
    h('div.card', null,
      h('h3', null, '📊 Прогрес за етапами розвитку'),
      h('div.ai-stages-bar', null, an.stageProgress.map((/** @type {any} */ sp) => {
        const pct = sp.total ? Math.round((sp.done / sp.total) * 100) : 0;
        const isCur = sp.stage.id === an.currentStage.id;
        return h(`a.ai-st-pill${isCur ? '.cur' : ''}${sp.done === sp.total && sp.total ? '.done' : ''}`, {
          href: `#/roadmap/${sp.stage.id}`,
          title: `${sp.stage.title}: ${sp.done}/${sp.total} віх (${pct}%)`,
        },
        h('div.small', null, `${sp.stage.icon} Е${sp.stage.n}`),
        h('b', null, `${sp.done}/${sp.total}`));
      }))),

    // 2. Головна віха стовбура
    an.nextTrunk.length ? h('div.card.ai-trunk-card', null,
      h('div.badges', null,
        h('span.badge', { style: { '--c': 'var(--accent)' } }, '⭐ Пріоритет 1 · Головний шлях (Стовбур)'),
        stageBadge(s, an.nextTrunk[0].node.stage)),
      h('h3', { style: { marginTop: '8px' } }, an.nextTrunk[0].node.title),
      h('p.small', null, an.nextTrunk[0].node.text),
      renderDoneByMini(s, an.nextTrunk[0].why, qi),
      h('div.ai-card-foot', null,
        h('a.btn.small.primary', { href: `#/roadmap?node=${an.nextTrunk[0].node.id}` }, 'Відкрити на карті →'),
        an.nextTrunk[0].node.chapter ? h('a.btn.small', { href: `#/chapter/${an.nextTrunk[0].node.chapter}` }, 'Глава квестів →') : null)) : null,

    // 3. Незавершені (розпочаті) квести у сейві
    an.startedQuests.length ? h('div.card', null,
      h('h3', null, `⏳ Розпочаті квести у сейві (${an.startedQuests.length})`),
      h('p.small.muted', null, 'Ці квести вже розпочаті у вашому світі — виконайте завдання, щоб закрити їх:'),
      h('div.ai-q-list', null, an.startedQuests.map((/** @type {any} */ sq) => h('div.ai-q-item', null,
        h('div.ai-q-head', null,
          h('a', { href: `#/chapter/${sq.chapter}/${sq.id}` }, h('b', null, `⏳ ${sq.title}`)),
          h('span.small.muted', null, sq.chapterTitle)),
        h('ul.list-clean.small', null, sq.tasks.map((/** @type {any} */ t) => h('li', { class: t.done ? 'db-done' : '' },
          `${t.done ? '✔' : '○'} ${t.text}`))))))) : null,

    // 4. Рекомендовані відкриті віхи зараз
    h('div.card', null,
      h('h3', null, `🧭 Відкриті віхи розвитку (${an.availNodes.length})`),
      h('p.small.muted', null, 'Усі попередні вимоги для цих віх уже виконані — обирайте напрямок за потребою:'),
      h('div.ai-avail-list', null, an.availNodes.slice(0, 10).map((/** @type {any} */ item) => {
        const n = item.node;
        return h('div.ai-avail-item', null,
          h('div.ai-avail-top', null,
            h('div.badges', null, stageBadge(s, n.stage), n.trunk ? h('span.badge', { style: { '--c': 'var(--accent)' } }, '⭐ Стовбур') : clsBadge(s, n.lane),
              item.unlocksCount ? h('span.badge.ghost', null, `відкриває +${item.unlocksCount}`) : null),
            h('label.check.small', null,
              h('input', { type: 'checkbox', checked: isDone(n.id), onchange: (e) => { setDone(n.id, e.target.checked); onChange(); } }),
              'Зроблено')),
          h('div.ai-avail-title', null,
            h('a', { href: `#/roadmap?node=${n.id}` }, h('b', null, n.title)),
            n.icons?.length ? h('span.ai-mini-icons', null, n.icons.slice(0, 3).map((/** @type {string} */ iid) => {
              const it = s.items[iid];
              return it ? h('img', { src: it.img, alt: '', title: it.uk || iid }) : null;
            })) : null),
          h('p.small.muted', { style: { margin: '4px 0' } }, n.text),
          renderDoneByMini(s, item.why, qi));
      }))),

    // 5. Персональні поради
    h('div.card', null,
      h('h3', null, '💡 Поради за вашим сейвом'),
      h('div.ai-tips-list', null, an.tips.map((/** @type {any} */ t) => h('div.ai-tip', null,
        h('div.ai-tip-h', null, `${t.icon} `, h('b', null, t.title)),
        h('p.small.muted', { style: { margin: '4px 0' } }, t.text),
        t.link ? h('a.small', { href: t.link }, t.linkText || 'Детальніше →') : null)))));
}

/** @param {Store} s @param {any} w @param {Record<string, any>} qi */
function renderDoneByMini(s, w, qi) {
  if (!w) return null;
  const chips = [
    ...(w.quests || []).map((/** @type {any} */ q) => {
      const info = qi[q.id];
      return h('a.badge', {
        href: info ? `#/chapter/${info.chapter}/${q.id}` : '#/chapters',
        style: { '--c': q.done ? 'var(--ok)' : q.started ? 'var(--link)' : 'var(--muted)' },
      }, `${q.done ? '✔' : q.started ? '⏳' : '○'} Квест: ${info?.title || q.id}`);
    }),
    ...(w.items || []).map((/** @type {any} */ it) => {
      const meta = s.items[it.id];
      return h('span.badge', {
        style: { '--c': it.done ? 'var(--ok)' : 'var(--muted)' },
      }, `${it.done ? '✔' : '○'} Предмет: ${meta?.uk || meta?.en || it.id}`);
    }),
  ];
  return chips.length ? h('div.badges', { style: { marginTop: '6px' } }, ...chips) : null;
}

/** Вкладка «Інвентар і персонаж». @param {Store} s @param {any} an @param {any} liveState */
function renderInvTab(s, an, liveState) {
  const p = an.world;
  const lvPlayer = liveState?.player;
  const curios = lvPlayer?.curios || [];
  const armor = lvPlayer?.armor || [];
  return h('div.ai-stack', null,
    h('div.card', null,
      h('h3', null, '🧙 Дані персонажа з NBT (<uuid>.dat)'),
      h('dl.kv.small', null,
        h('dt', null, 'Ім’я / UUID'), h('dd', null, `${lvPlayer?.name || p?.player?.name || '—'} (${lvPlayer?.uuid || p?.player?.uuid || '—'})`),
        h('dt', null, 'Здоров’я / Голод'), h('dd', null, `${lvPlayer?.health ?? 20} ❤ / ${lvPlayer?.foodLevel ?? 20} 🍖`),
        h('dt', null, 'Рівень досвіду'), h('dd', null, String(lvPlayer?.xpLevel ?? p?.player?.xp_level ?? 0)),
        h('dt', null, 'Вимір і координати'), h('dd', null, `${lvPlayer?.dimensionUk || an.dimUk} (${lvPlayer?.pos ? lvPlayer.pos.join(', ') : p?.player?.dimension || 'minecraft:overworld'})`),
        h('dt', null, 'Світовий рівень Apotheosis'), h('dd', null, an.worldTierUk),
        h('dt', null, 'Унікальних страв (Spice of Life)'), h('dd', null, String(p?.player?.unique_foods ?? 0)),
        h('dt', null, 'Забрано нагород квестів'), h('dd', null, String(p?.quests?.rewards_claimed ?? 0)))),
    (curios.length || armor.length) ? h('div.card', null,
      h('h3', null, `💍 Одягнено в слотах Curios та броні (${curios.length + armor.length})`),
      h('div.item-list', null, [...curios, ...armor].map((/** @type {any} */ it) => {
        const meta = s.items[it.id];
        return h('div.item-chip', { title: `${it.slot || 'Curios'}: ${it.id}` },
          meta ? h('img', { src: meta.img, alt: '', width: 24, height: 24 }) : h('span.nc-q', null, '💍'),
          h('span', null, `${it.uk || meta?.uk || it.id} (${it.slot || 'Curios'})`),
          h('b', { style: { color: 'var(--accent)' } }, `×${it.count || 1}`));
      }))) : null,
    h('div.card', null,
      h('h3', null, `🎒 Предмети в інвентарі (${an.invEntries.length})`),
      an.invEntries.length ? h('div.item-list', null, an.invEntries.map((/** @type {any} */ it) =>
        h('div.item-chip', { title: it.id },
          it.meta ? h('img', { src: it.meta.img, alt: '', width: 28, height: 28 }) : h('span.nc-q', null, '📦'),
          h('span', null, it.name),
          h('b', { style: { color: 'var(--accent)' } }, `×${it.count}`))))
        : h('p.small.muted', null, 'Інвентар порожній або даних немає.')),
    h('div.card', null,
      h('h3', null, `🔨 Скрафчені предмети зі статистики (${an.craftedEntries.length})`),
      an.craftedEntries.length ? h('div.item-list', null, an.craftedEntries.map((/** @type {any} */ it) =>
        h('div.item-chip', { title: it.id },
          it.meta ? h('img', { src: it.meta.img, alt: '', width: 24, height: 24 }) : null,
          h('span', null, it.name),
          h('span.muted', null, `×${it.count}`))))
        : h('p.small.muted', null, 'Ще немає записів крафту в статистиці.')));
}

/** Вкладка «Журнал і контекст». @param {Store} s @param {any} an @param {string} logTail @param {any} liveState */
function renderLogTab(s, an, logTail, liveState) {
  const ctxText = buildPlayerContextPrompt(s, an, logTail);
  const copyBtn = h('button.btn.small', {
    onclick: () => {
      navigator.clipboard?.writeText(ctxText);
      copyBtn.textContent = '✔ Скопійовано в буфер!';
      setTimeout(() => { copyBtn.textContent = '📋 Скопіювати контекст гравця'; }, 2500);
    },
  }, '📋 Скопіювати контекст гравця');
  return h('div.ai-stack', null,
    liveState?.dictStats ? h('div.card', null,
      h('h3', null, '🇺🇦 Індексатор словника ATM11-UA та KubeJS-інтеграція'),
      h('p.small.muted', null,
        `Проіндексовано файлів uk_ua.json: ${liveState.dictStats.filesLoaded} · перекладених рядків та ID: ${liveState.dictStats.totalEntries}. ` +
        'У грі працюють швидкі чат-команди KubeJS (!що, !клавіші, !як <питання>) та оверлей Alt+Q.')) : null,
    h('div.card', null,
      h('div.mod-head', null,
        h('h3', null, '📋 Зведений контекст стану гравця (для LLM / промптів)'),
        copyBtn),
      h('pre.ai-pre', null, ctxText)),
    h('div.card', null,
      h('h3', null, '📜 Останні рядки minecraft/logs/latest.log'),
      logTail
        ? h('pre.ai-pre', null, logTail)
        : h('p.small.muted', null, 'Щоб побачити свіжий latest.log у браузері, запустіть ATM11-Companion або натисніть «📂 Вказати теку гри» вгорі.')));
}

/**
 * Налаштування підключення до моста ATM11-Companion (:8812). Ключі API — лише в .env компаньйона, не в браузері.
 * @param {any} st
 * @param {() => void} redraw
 * @param {(m: string, v?: string) => void} syncModelWithBridge
 * @param {() => void} reconnectBridge
 */
function renderConfigBox(st, redraw, syncModelWithBridge, reconnectBridge) {
  const cfg = st.cfg;
  const upd = (/** @type {string} */ k, /** @type {any} */ v) => { cfg[k] = v; saveAssistantConfig(cfg); };
  return h('div.ai-cfg-box', null,
    h('div.small', { style: { marginBottom: '8px' } },
      h('b', null, '🔌 Міст ATM11-Companion (:8812) '),
      h('span.muted', null, '— запускається разом із компаньйоном; ключі API зберігаються лише в його .env')),
    h('div.ai-cfg-row.small', null,
      h('label', null, 'URL мосту: ', h('input', { type: 'text', value: cfg.bridgeUrl, oninput: (e) => upd('bridgeUrl', e.target.value) })),
      h('label', null, 'Текстова модель: ',
        h('select.wb-select', {
          onchange: (e) => syncModelWithBridge(e.target.value, cfg.visionModel),
        }, COMPANION_MODELS.map((m) => h('option', { value: m.id, selected: m.id === cfg.openaiModel }, m.label)))),
      h('label', null, 'Vision модель (F2): ',
        h('select.wb-select', {
          onchange: (e) => syncModelWithBridge(cfg.openaiModel, e.target.value),
        }, COMPANION_VISION_MODELS.map((m) => h('option', { value: m.id, selected: m.id === cfg.visionModel }, m.label)))),
      h('button.btn.small', {
        onclick: async () => {
          await reconnectBridge();
          redraw();
        },
      }, 'Перевірити міст'),
      st.bridgeInfo ? h('span.small', { style: { color: st.bridgeInfo.ok ? 'var(--ok)' : 'var(--bad)' } },
        st.bridgeInfo.ok ? `✔ Активний (${(st.bridgeInfo.providers || []).join(', ') || 'локальний'})` : `✕ Не запущено (${st.bridgeInfo.error})`) : h('span.small.muted', null, st.liveConnected ? '' : 'міст не знайдено')));
}
