// @ts-check
// Сторінка «🤖 Помічник» (#/assistant):
//   1) Радник «Наступні кроки за сейвом» (стовбур, розпочаті квести, відкриті віхи, інвентар з NBT, latest.log);
//   2) Автономний пошук по базі путівника (BM25 + укр. стемер + словник понять + триграми) — без ШІ;
//   3) Жива синергія з десктопним компаньйоном ATM11-Companion (http://127.0.0.1:8812/events та /state):
//      синхронізація моделі, радар «Інвентар + Curios → Гарячі клавіші», останній скріншот F2 (Vision Qwen 2.5 VL 72B) і стрічка подій.
//   A1: допоміжне винесено — views/assistant/md.js (Markdown), views/assistant/tabs.js (вкладки); тут — сама сторінка render().
import { h, mount } from '../core/dom.js';
import { switchWorld, applyBrowserGameState, resetToBuiltProgress } from '../core/store.js';
import { pickGameFolder, rescanSavedGameFolder, getBrowserGameState } from '../core/game-folder.js';
import { analyzePlayerState } from '../core/advisor.js';
import { buildCorpus, searchGuide, composeLocalAnswer, COMPANION_MODELS, loadAssistantConfig, saveAssistantConfig, askExternalPipeline } from '../core/rag.js';
import { renderJarvisTab, updateJarvisState } from '../components/jarvis-card.js';
import { renderMd } from './assistant/md.js';
import { kpi, renderRadarAndVisionTab, renderNextTab, renderInvTab, renderLogTab, renderConfigBox, buildStaticKeyRadar, PRESET_QUESTIONS } from './assistant/tabs.js';

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export async function render(el, _p, s) {
  const qs = new URLSearchParams(location.hash.split('?')[1] || '');
  const st = {
    leftTab: /** @type {'radar'|'next'|'inv'|'log'|'core'} */ ('radar'),
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
    chatHistory: /** @type {any[]} */ ([]),
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
      sse.addEventListener('chat-history', (ev) => {
        if (!el.isConnected) { sse?.close(); return; }
        try {
          const items = JSON.parse(/** @type {MessageEvent} */ (ev).data);
          if (Array.isArray(items)) {
            st.chatHistory = items;
            drawRight();
          }
        } catch { /* ignore */ }
      });
      sse.addEventListener('chat-message', (ev) => {
        if (!el.isConnected) { sse?.close(); return; }
        try {
          const msg = JSON.parse(/** @type {MessageEvent} */ (ev).data);
          if (msg && msg.id) {
            const idx = st.chatHistory.findIndex((m) => m.id === msg.id);
            if (idx >= 0) st.chatHistory[idx] = msg;
            else st.chatHistory.push(msg);
            const limit = Number(st.liveState?.maxMessages) || 200;
            if (st.chatHistory.length > limit) st.chatHistory = st.chatHistory.slice(-limit);
            drawRight();
          }
        } catch { /* ignore */ }
      });
      sse.addEventListener('jarvis-state', (ev) => {
        if (!el.isConnected) { sse?.close(); return; }
        try {
          const j = JSON.parse(/** @type {MessageEvent} */ (ev).data);
          if (st.liveState) st.liveState.jarvis = j;
          if (st.leftTab === 'core') updateJarvisState(j);
        } catch { /* ignore */ }
      });
      sse.addEventListener('chat-cleared', () => {
        if (!el.isConnected) { sse?.close(); return; }
        st.chatHistory = [];
        drawRight();
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
          source: 'site',
          visionModel: st.cfg.visionModel || 'qwen/qwen2.5-vl-72b-instruct',
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.error) throw new Error(d.error || `HTTP ${r.status}`);
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
         ['log', `📜 Події та лог${evCount ? ` (${evCount})` : ''}`],
         ['core', '🧠 Ядро Джарвіса + 📦 Сховища']].map(([id, label]) =>
          h(`button${st.leftTab === id ? '.on' : ''}`, { onclick: () => { st.leftTab = /** @type {any} */ (id); drawLeft(); } }, label))),
      st.leftTab === 'radar' ? renderRadarAndVisionTab(s, an, st, radarItems, runQuery, runVisionF2)
        : st.leftTab === 'next' ? renderNextTab(s, an, async () => { an = await analyzePlayerState(s); drawHead(); drawLeft(); })
        : st.leftTab === 'inv' ? renderInvTab(s, an, st.liveState)
        : st.leftTab === 'core' ? renderJarvisTab(st, baseBridgeUrl())
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
        st.liveConnected && st.chatHistory.length ? h('div.ai-shared-feed', { style: { marginTop: '14px' } },
          h('div.ai-q-head', { style: { marginBottom: '8px' } },
            h('h3.section', { style: { margin: 0 } }, `💬 Спільний діалог з ігровим HUD (${st.chatHistory.length})`),
            h('button.btn.small', {
              onclick: async () => {
                try { await fetch(`${baseBridgeUrl()}/api/chat/clear`, { method: 'POST' }); } catch { /* ignore */ }
              },
            }, 'Очистити')),
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto', paddingRight: '4px' } },
            st.chatHistory.slice(-16).map((/** @type {any} */ m) => {
              if (m.role === 'user') {
                const srcMap = { game: 'з гри', demo: 'демо (без гри)', hud: 'HUD', site: 'сайт', panel: 'панель' };
                const srcLabel = srcMap[/** @type {keyof typeof srcMap} */ (m.source)] || 'чат';
                return h('div', {
                  style: {
                    alignSelf: 'flex-end',
                    maxWidth: '88%',
                    background: 'var(--panel-2)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius)',
                    padding: '6px 10px',
                  },
                },
                h('div.small.muted', null, `${srcLabel} · ${m.time || ''}`),
                m.attachment ? h('div.small', { style: { color: 'var(--accent)', fontWeight: '600' } }, `📷 ${m.attachment.label}`) : null,
                h('div', { style: { fontWeight: '600', wordBreak: 'break-word' } }, m.text || m.rawCmd || ''));
              }
              return h('div', {
                style: {
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius)',
                  padding: '8px 10px',
                },
              },
              m.pending
                ? h('div.small.muted', null, `⏳ ${m.pendingLabel || 'Аналіз…'}`)
                : m.error
                  ? h('div.small', { style: { color: 'var(--bad)' } }, `⚠ ${m.error}`)
                  : [
                      m.voiceQuote ? h('div.small', {
                        style: {
                          padding: '6px 8px',
                          marginBottom: '6px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--accent)',
                          background: 'var(--panel-2)',
                        },
                      }, `🔊 ${m.voiceQuote}`) : null,
                      m.bodyMd ? renderMd(m.bodyMd) : null,
                      (m.sources?.length || m.checkInGame) ? h('div.badges', { style: { marginTop: '6px' } },
                        ...(m.sources || []).map((/** @type {string} */ src) => h('span.badge.ghost', null, src)),
                        m.checkInGame ? h('span.badge', { style: { '--c': 'var(--warn)' } }, '⚑ Перевірити в грі') : null) : null,
                      h('div.small.muted', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '6px' } },
                        h('div', { style: { display: 'flex', gap: '4px' } },
                          h(`button.wb-btn${m.rating === 'up' ? '.on' : ''}`, {
                            title: 'Корисна відповідь',
                            onclick: async () => {
                              const next = m.rating === 'up' ? null : 'up';
                              try {
                                await fetch(`${baseBridgeUrl()}/api/chat/rate`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ messageId: m.id, rating: next }),
                                });
                              } catch { /* ignore */ }
                            },
                          }, '👍'),
                          h(`button.wb-btn${m.rating === 'down' ? '.on' : ''}`, {
                            title: 'Неточна відповідь',
                            onclick: async () => {
                              const next = m.rating === 'down' ? null : 'down';
                              try {
                                await fetch(`${baseBridgeUrl()}/api/chat/rate`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ messageId: m.id, rating: next }),
                                });
                              } catch { /* ignore */ }
                            },
                          }, '👎')),
                        h('span', null, `${m.shortModel || m.model || 'ШІ'} · ${((m.elapsedMs || 0) / 1000).toFixed(2).replace('.', ',')} с`))
                    ]);
            }))) : null,
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
