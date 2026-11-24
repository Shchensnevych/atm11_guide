// @ts-check
// Сторінка «🤖 Помічник» (#/assistant):
//   1) Візуальні ігрові слоти спорядження, Curios, пояса Tool Belt, інвентарю й ранців + інспектор клавіш;
//   2) Радник «Наступні кроки за сейвом», стрічка подій у реальному часі та 2-колонкова станція «Ядро Джарвіса»;
//   3) Єдиний живий ШІ-чат з Vision (F2 / Ctrl+V / файл), голосовим вводом 🎙️ та автономним гібридним RAG.
import { h, mount } from '../core/dom.js';
import { switchWorld, applyBrowserGameState, resetToBuiltProgress, ensureNames } from '../core/store.js';
import { loadKeys, syncBridgeOptions } from '../core/keys-model.js';
import { pickGameFolder, rescanSavedGameFolder, getBrowserGameState } from '../core/game-folder.js';
import { analyzePlayerState } from '../core/advisor.js';
import { buildCorpus, searchGuide, composeLocalAnswer, loadAssistantConfig, saveAssistantConfig } from '../core/rag.js';
import { renderJarvisTab, updateComponentsState } from '../components/jarvis-card.js';
import { renderSlotsAndKeysTab } from './assistant/slots-view.js';
import { kpi, countSlotItems, renderNextTab, renderLogTab } from './assistant/tabs.js';
import { createUnifiedChatView } from './assistant/chat-feed.js';
import { prepareImageFromBlob, prepareF2FromBridge, createVoiceDictation, toggleSpeakAnswer, stopSpeaking } from './assistant/vision-voice.js';

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export async function render(el, _p, s) {
  const qs = new URLSearchParams(location.hash.split('?')[1] || '');
  const initialQ = qs.get('q') || '';
  const st = {
    leftTab: /** @type {'slots'|'next'|'log'|'core'} */ ('slots'),
    selectedSlotKey: '',
    activeContainerKey: '',
    showAllCurios: false,
    cfg: loadAssistantConfig(),
    showCfg: false,
    openPop: /** @type {''|'f2'|'model'} */ (''),
    busyFolder: false,
    busyAsk: false,
    busyVision: false,
    voiceListening: false,
    dragOver: false,
    draft: '',
    voiceBaseDraft: '',
    /** @type {any} */ pendingAttachment: null,
    f2Items: /** @type {any[]} */ ([]),
    f2Loading: false,
    statusMsg: '',
    bridgeInfo: /** @type {any} */ (null),
    liveState: /** @type {any} */ (null),
    liveConnected: false,
    corpusCount: 0,
    /** @type {any} */ seedMessage: null,
    localMessages: /** @type {any[]} */ ([]),
    chatHistory: /** @type {any[]} */ ([]),
    lastSlotsSig: '',
    lastLogSig: '',
  };

  const [, keysData] = await Promise.all([
    ensureNames(s),
    loadKeys().catch(() => ({ keys: /** @type {KeyAct[]} */ ([]) })),
  ]);
  let an = await analyzePlayerState(s);
  const corpus = buildCorpus(s);
  st.corpusCount = corpus.length;
  const bState = () => getBrowserGameState();
  /** @type {EventSource | null} */
  let sse = null;

  async function refreshSeedOverview() {
    const hits = await searchGuide(s, 'наступні кроки головний шлях початок', an, 5);
    st.seedMessage = {
      id: 'loc_seed',
      role: 'assistant',
      bodyMd: composeLocalAnswer('', hits, an, s),
      hits,
      provider: '⚡ Радник за сейвом + Гібридний RAG',
    };
    if (!st.localMessages.length) {
      st.localMessages = [st.seedMessage];
    } else if (st.localMessages[0]?.id === 'loc_seed') {
      st.localMessages[0] = st.seedMessage;
    }
  }
  await refreshSeedOverview();

  const headBox = h('div');
  const leftBox = h('div.ai-left');
  const rightBox = h('div.ai-right');
  const baseBridgeUrl = () => (st.cfg.bridgeUrl || 'http://127.0.0.1:8812').replace(/\/$/, '');

  const voice = createVoiceDictation(
    (txt, isFinal) => {
      const prefix = st.voiceBaseDraft ? `${st.voiceBaseDraft.trimEnd()} ` : '';
      const next = `${prefix}${txt}`;
      chatView.setDraft(next, true);
      if (isFinal) st.voiceBaseDraft = next;
    },
    (listening, errMsg) => {
      st.voiceListening = listening;
      if (errMsg) { st.statusMsg = `⚠ ${errMsg}`; drawHead(); }
      chatView.syncComposer();
    },
  );

  /** @param {Blob} blob @param {string} label */
  async function stageFileBlob(blob, label) {
    try {
      st.pendingAttachment = await prepareImageFromBlob(blob, label, 'clipboard');
      if (!st.liveConnected) {
        st.statusMsg = '📷 Скріншот прикріплено. Запустіть ATM11-Companion (:8812), щоб розібрати його через Vision AI.';
        drawHead();
      } else if (st.cfg.mode === 'local') {
        st.cfg.mode = 'bridge';
      }
      chatView.syncHead();
      chatView.syncStream(false);
      chatView.syncComposer();
    } catch (e) {
      st.statusMsg = `⚠ ${e instanceof Error ? e.message : String(e)}`;
      drawHead();
    }
  }

  /** @param {string} name @param {number} [mtime] */
  async function stageBridgeShot(name, mtime = 0) {
    try {
      st.pendingAttachment = await prepareF2FromBridge(baseBridgeUrl(), name, mtime);
      if (st.cfg.mode === 'local') st.cfg.mode = 'bridge';
      chatView.syncHead();
      chatView.syncStream(false);
      chatView.syncComposer();
    } catch (e) {
      st.statusMsg = `⚠ ${e instanceof Error ? e.message : String(e)}`;
      drawHead();
    }
  }

  /** @param {{ text?: string, forceF2?: boolean, retryMsg?: any }} [opts] */
  async function sendTurn(opts = {}) {
    const retryMsg = opts.retryMsg || null;
    const rawText = (opts.text !== undefined ? opts.text : st.draft).trim();
    const att = st.pendingAttachment;
    const isVision = Boolean(att || opts.forceF2 || retryMsg?.kind === 'vision');

    if (!rawText && !isVision && !retryMsg) return;
    if (voice.isListening()) voice.stop();

    // 1. Vision-розбір скріншота (F2 / Ctrl+V / файл) через міст :8812
    if (isVision) {
      if (!st.liveConnected) {
        st.localMessages.push(
          { id: `loc_u_${Date.now()}`, role: 'user', source: 'site', time: nowHHMM(), text: rawText || 'Розібрати скріншот', attachment: att || { label: 'Скріншот F2' } },
          { id: `loc_a_${Date.now()}`, role: 'assistant', bodyMd: '⚠ **Розбір скріншотів Vision AI (Qwen 2.5 VL 72B)** працює через локальний міст **ATM11-Companion (`:8812`)**, де зберігаються API-ключі. Запустіть компаньйон і натисніть **«🔌 Перевірити міст»** у ⚙️ налаштуваннях чату.', provider: 'Локальна підказка' },
        );
        st.pendingAttachment = null;
        chatView.setDraft('');
        chatView.syncComposer();
        chatView.syncStream(true);
        return;
      }
      st.cfg.mode = 'bridge';
      st.busyVision = true;
      st.busyAsk = true;
      st.pendingAttachment = null;
      const prompt = retryMsg ? (retryMsg.query || '') : (rawText || 'Що зображено на цьому скріншоті гри ATM11? Поясни українською призначення блоків, предметів або інтерфейсу та що робити далі.');
      if (!retryMsg) chatView.setDraft('');
      chatView.syncHead();
      chatView.syncComposer();
      try {
        const r = await fetch(`${baseBridgeUrl()}/api/vision`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            ...(att ? {
              imageBase64: att.imageBase64,
              mimeType: att.mimeType,
              thumbDataUrl: att.thumbDataUrl,
              screenshotLabel: att.label,
              screenshotName: att.screenshotName || '',
              attachmentKind: att.kind,
            } : {}),
            ...(retryMsg?.id ? { retryMessageId: retryMsg.id } : {}),
            source: 'site',
            visionModel: st.cfg.visionModel || 'qwen/qwen2.5-vl-72b-instruct',
          }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.error) throw new Error(d.error || `HTTP ${r.status}`);
        if (st.cfg.autoSpeak && (d.voiceSummary || d.answer)) {
          toggleSpeakAnswer(d.messageId || `vis_${Date.now()}`, d.voiceSummary || d.answer, baseBridgeUrl(), true, st.cfg.ttsVoice, () => chatView.syncStream(false));
        }
      } catch (e) {
        st.statusMsg = `⚠ Vision AI: ${e instanceof Error ? e.message : String(e)}`;
        drawHead();
      } finally {
        st.busyVision = false;
        st.busyAsk = false;
        chatView.syncComposer();
        chatView.syncStream(true);
      }
      return;
    }

    // 2. Текстовий запит через живий міст ATM11-Companion (:8812)
    const qText = retryMsg ? String(retryMsg.query || '') : rawText;
    if (!retryMsg) chatView.setDraft('');
    st.busyAsk = true;
    chatView.syncComposer();

    if (st.cfg.mode === 'bridge' && st.liveConnected) {
      try {
        const r = await fetch(`${baseBridgeUrl()}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: qText,
            ...(st.liveState?.world?.folder ? { world: st.liveState.world.folder } : {}),
            model: st.cfg.openaiModel,
            source: 'site',
            ...(retryMsg?.id ? { retryMessageId: retryMsg.id } : {}),
          }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok || d.error) throw new Error(d.error || `HTTP ${r.status}`);
        if (st.cfg.autoSpeak && (d.voiceSummary || d.answer)) {
          toggleSpeakAnswer(d.messageId || `chat_${Date.now()}`, d.voiceSummary || d.answer, baseBridgeUrl(), true, st.cfg.ttsVoice, () => chatView.syncStream(false));
        }
        return;
      } catch (e) {
        // Fallback до автономного RAG при мережевому збої моста
        const hits = await searchGuide(s, qText, an, 6);
        st.localMessages.push(
          { id: `loc_u_${Date.now()}`, role: 'user', source: 'site', time: nowHHMM(), text: qText },
          {
            id: `loc_a_${Date.now()}`,
            role: 'assistant',
            bodyMd: `${composeLocalAnswer(qText, hits, an, s)}\n\n> ⚠ Міст ШІ недоступний (${e instanceof Error ? e.message : String(e)}), показано автономну відповідь за базою путівника.`,
            hits,
            provider: '⚡ Автономний RAG (резерв)',
          },
        );
        st.cfg.mode = 'local';
        chatView.syncHead();
        chatView.syncStream(true);
        return;
      } finally {
        st.busyAsk = false;
        chatView.syncComposer();
      }
    }

    // 3. Миттєвий автономний пошук по базі сайту (BM25 + стемер + синоніми ATM11 + триграми)
    try {
      const t0 = performance.now();
      const hits = await searchGuide(s, qText, an, 6);
      const ans = composeLocalAnswer(qText, hits, an, s);
      const ms = Math.max(1, Math.round(performance.now() - t0));
      st.localMessages.push(
        { id: `loc_u_${Date.now()}`, role: 'user', source: 'site', time: nowHHMM(), text: qText },
        { id: `loc_a_${Date.now() + 1}`, role: 'assistant', bodyMd: ans, hits, provider: '⚡ Автономний RAG', elapsedMs: ms },
      );
      if (st.localMessages.length > 40) st.localMessages = st.localMessages.slice(-40);
      if (st.cfg.autoSpeak) {
        toggleSpeakAnswer(`loc_${Date.now()}`, ans, baseBridgeUrl(), st.liveConnected, st.cfg.ttsVoice, () => chatView.syncStream(false));
      }
    } finally {
      st.busyAsk = false;
      chatView.syncStream(true);
      chatView.syncComposer();
    }
  }

  /** @param {string} modelId @param {string} [visionId] */
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
          st.liveState.selectedModel = d.activeModel || d.selectedModel || modelId;
          st.liveState.selectedVisionModel = d.visionModel || d.selectedVisionModel || st.cfg.visionModel;
        }
      } catch { /* ignore */ }
    }
    chatView.syncHead();
    chatView.syncStream(false);
    chatView.syncComposer();
  }

  const chatView = createUnifiedChatView(s, st, {
    baseBridgeUrl,
    syncModel: syncModelWithBridge,
    reconnectBridge: connectCompanionBridge,
    sendTurn,
    stageFileBlob,
    stageBridgeShot,
    toggleMic: () => {
      st.voiceBaseDraft = st.draft;
      voice.toggle();
    },
  });
  mount(rightBox, chatView.root);

  /** Швидкий запит із лівої панелі (інспектора слотів тощо) прямо в живий потік чату.
   * @param {string} qText @param {boolean} [preferBridge] */
  function askFromLeftPanel(qText, preferBridge = false) {
    if (preferBridge && st.liveConnected) st.cfg.mode = 'bridge';
    sendTurn({ text: qText });
  }

  function baseMismatch() {
    if (!st.liveConnected) return '';
    const mine = s.meta?.fingerprint || '';
    const br = st.liveState?.base;
    if (!br || !br.fingerprint) return mine ? 'Міст старої версії — оновіть ATM11-Companion.' : '';
    if (!mine || br.fingerprint === mine) return '';
    const bt = String(br.built || ''); const mt = String(s.meta?.built || '');
    return bt && mt && bt < mt
      ? `Міст на старій базі (${bt}, сайт — ${mt}): перезапустіть компаньйон.`
      : `Різні версії бази (сайт — ${mt || '?'}, міст — ${bt || '?'}): оновіть сторінку.`;
  }

  /** @param {any} d */
  function computeSlotsSig(d) {
    if (!d) return '';
    const w = d.world || {};
    const p = w.player || {};
    const lv = d.live || {};
    return JSON.stringify([
      w.folder, w.savedTs, w.slotsSource?.kind,
      p.xpLevel, p.health, p.foodLevel, p.selectedSlot,
      lv.health, lv.food, lv.dimension, lv.pos,
      d.keyStats?.sig,
      w.slots,
    ]);
  }

  /** @param {any} d */
  function computeLogSig(d) {
    if (!d) return '';
    const ev0 = d.events?.[0] || {};
    return `${(d.events || []).length}:${ev0.id || ev0.time || ''}:${(d.logTail || '').length}:${(d.combatRadar || []).length}`;
  }

  /** @param {any} data @param {boolean} isInitial */
  function applyLiveCompanionState(data, isInitial = false) {
    if (!data || !data.ok) return;
    const prevFolder = st.liveState?.world?.folder;
    const nextSlotsSig = computeSlotsSig(data);
    const nextLogSig = computeLogSig(data);
    const slotsChanged = isInitial || nextSlotsSig !== st.lastSlotsSig;
    const logChanged = isInitial || nextLogSig !== st.lastLogSig;
    st.lastSlotsSig = nextSlotsSig;
    st.lastLogSig = nextLogSig;
    st.liveState = data;
    st.liveConnected = true;
    try { sessionStorage.setItem('atm11.bridge.online', baseBridgeUrl()); } catch {}
    if (!st.cfg.modeExplicit && st.cfg.mode === 'local') {
      st.cfg.mode = 'bridge';
    }
    const folder = data.world?.folder;
    if (folder && folder !== prevFolder) {
      const pw = (s.progress?.worlds || []).find((w) => w.folder === folder || w.world === data.world?.name);
      if (pw && pw.slug !== s.progress?.slug) {
        switchWorld(pw.slug, { fromBridge: true }).catch(() => {});
      }
    }
    st.bridgeInfo = { ok: true, providers: Array.isArray(data.providers) ? data.providers : [] };
    if (data.selectedModel && st.cfg.openaiModel !== data.selectedModel) {
      st.cfg.openaiModel = data.selectedModel;
      saveAssistantConfig(st.cfg);
    }
    if (data.selectedVisionModel && st.cfg.visionModel !== data.selectedVisionModel) {
      st.cfg.visionModel = data.selectedVisionModel;
      saveAssistantConfig(st.cfg);
    }
    if (data.keyBinds && (syncBridgeOptions(data.keyBinds, data.keyStats?.sig) || isInitial)) {
      loadKeys().then((kd) => {
        keysData.keys = kd.keys;
        if (st.leftTab === 'slots') drawLeft();
      }).catch(() => {});
    }
    if (isInitial) {
      drawAll();
    } else {
      drawHead();
      if ((st.leftTab === 'slots' && slotsChanged) || (st.leftTab === 'log' && logChanged)) drawLeft();
      chatView.syncHead();
      chatView.syncChips();
    }
  }

  /** @param {string} url */
  function setupSSE(url) {
    if (sse) { try { sse.close(); } catch { /* ignore */ } sse = null; }
    try {
      sse = new EventSource(`${url}/events`);
      sse.addEventListener('state', (ev) => {
        if (!el.isConnected) { cleanup(); return; }
        try {
          applyLiveCompanionState(JSON.parse(/** @type {MessageEvent} */ (ev).data), false);
          if (st.leftTab === 'core') updateComponentsState(st.liveState?.components, st.liveState);
        } catch { /* ignore */ }
      });
      sse.addEventListener('game-event', (ev) => {
        if (!el.isConnected) { cleanup(); return; }
        try {
          const item = JSON.parse(/** @type {MessageEvent} */ (ev).data);
          if (st.liveState) {
            st.liveState.events = [item, ...(st.liveState.events || []).slice(0, 29)];
            if (st.leftTab === 'log') drawLeft();
          }
        } catch { /* ignore */ }
      });
      sse.addEventListener('chat-history', (ev) => {
        if (!el.isConnected) { cleanup(); return; }
        try {
          const items = JSON.parse(/** @type {MessageEvent} */ (ev).data);
          if (Array.isArray(items)) { st.chatHistory = items; chatView.syncStream(true); }
        } catch { /* ignore */ }
      });
      sse.addEventListener('chat-message', (ev) => {
        if (!el.isConnected) { cleanup(); return; }
        try {
          const msg = JSON.parse(/** @type {MessageEvent} */ (ev).data);
          if (msg && msg.id) {
            const idx = st.chatHistory.findIndex((m) => m.id === msg.id);
            if (idx >= 0) st.chatHistory[idx] = msg;
            else st.chatHistory.push(msg);
            const limit = Number(st.liveState?.maxMessages) || 200;
            if (st.chatHistory.length > limit) st.chatHistory = st.chatHistory.slice(-limit);
            chatView.syncStream(false);
          }
        } catch { /* ignore */ }
      });
      sse.addEventListener('chat-cleared', () => {
        if (!el.isConnected) { cleanup(); return; }
        st.chatHistory = [];
        chatView.syncStream(true);
      });
      sse.onerror = () => {
        st.liveConnected = false;
        sse?.close();
        sse = null;
        chatView.syncHead();
        chatView.syncComposer();
      };
    } catch { /* ignore */ }
  }

  async function connectCompanionBridge() {
    const url = baseBridgeUrl();
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1800);
      const r = await fetch(`${url}/state`, { signal: ctrl.signal });
      clearTimeout(timer);
      if (r.ok) {
        applyLiveCompanionState(await r.json(), true);
        setupSSE(url);
      } else {
        st.liveConnected = false;
        st.bridgeInfo = { ok: false, error: `HTTP ${r.status}` };
      }
    } catch {
      st.liveConnected = false;
      st.bridgeInfo = { ok: false, error: 'не відповідає' };
    }
  }

  async function onPickFolder(rescan = false) {
    st.busyFolder = true;
    st.statusMsg = '⏳ Зчитування сейвів, слотів NBT та options.txt у браузері…';
    drawHead();
    try {
      const res = rescan ? await rescanSavedGameFolder(s) : await pickGameFolder(s);
      await applyBrowserGameState(res);
      const kd = await loadKeys().catch(() => null);
      if (kd?.keys) keysData.keys = kd.keys;
      an = await analyzePlayerState(s);
      await refreshSeedOverview();
      const wCount = (res.worlds || []).length;
      st.statusMsg = `✅ Отримано з теки «${res.folderName}»: світів ${wCount}${res.keysUpdated ? `, клавіш ${res.keysUpdated}` : ''}${res.logTail ? ', latest.log' : ''}.`;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      st.statusMsg = (msg !== 'cancelled' && !/AbortError|user aborted/i.test(msg)) ? `⚠ ${msg}` : '';
    } finally {
      st.busyFolder = false;
      drawAll();
    }
  }

  function drawHead() {
    const p = s.progress;
    const bs = bState();
    const lv = st.liveState;
    const lw = lv?.world;
    const modeUk = lw?.modeUk || p?.mode_uk || p?.mode || '';
    const activeWorldName = lw?.name || p?.world || '';
    const slotsCnt = countSlotItems(s, lv, an);
    const mismatch = baseMismatch();

    mount(headBox, h('section.card.ai-hero', null,
      h('div.ai-hero-top', null,
        h('div', null,
          h('h1', null, '🤖 Живий ШІ-компаньйон і радник ATM11'),
          h('div.small.muted.ai-hero-meta', null,
            activeWorldName
              ? `Активний світ: «${activeWorldName}» (${modeUk}) · остання гра: ${lw?.lastPlayed || p?.last_played || 'сьогодні'} · у грі: ${lw?.playHours ?? p?.play_hours ?? 0} год`
              : 'Світ не вибрано',
            mismatch ? h('span.badge', { style: { '--c': 'var(--warn)' }, title: mismatch }, `⚠ ${mismatch}`) : null,
            st.liveConnected
              ? h('span.badge', { style: { '--c': 'var(--ok)' } }, '🟢 ATM11-Companion Live (:8812)')
              : bs
                ? h('span.badge', { style: { '--c': 'var(--ok)' } }, `📂 Дані теки гри (${bs.folderName} · ${bs.updated})`)
                : h('span.badge.ghost', null, `Знімок збірки (${p?.updated || 'data/progress.json'})`))),
        h('div.ai-folder-actions', null,
          st.liveConnected && lv?.worldSelection?.auto === false ? h('button.btn.small', {
            type: 'button',
            title: 'Повернути автоматичний вибір останнього зіграного світу в мості ATM11-Companion',
            onclick: async () => {
              try {
                const r = await fetch(`${baseBridgeUrl()}/api/world`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ world: '' }),
                });
                if (r.ok) applyLiveCompanionState(await r.json(), false);
              } catch { /* ignore */ }
            },
          }, '🎯 Автовибір світу') : null,
          st.liveConnected ? h('button.btn.small', {
            type: 'button',
            title: 'Миттєво пересканувати активний сейв, інвентар, Curios, options.txt і скріншоти F2 через ATM11-Companion',
            onclick: async () => {
              try {
                const r = await fetch(`${baseBridgeUrl()}/rescan`, { method: 'POST' });
                if (r.ok) applyLiveCompanionState(await r.json(), true);
              } catch { /* ignore */ }
            },
          }, '🔄 Оновити міст') : null,
          bs ? h('button.btn.small', {
            type: 'button',
            disabled: st.busyFolder,
            onclick: () => onPickFolder(true),
          }, '🔄 Оновити з гри') : null,
          bs ? h('button.btn.small', {
            type: 'button',
            onclick: async () => {
              await resetToBuiltProgress();
              const kd = await loadKeys().catch(() => null);
              if (kd?.keys) keysData.keys = kd.keys;
              an = await analyzePlayerState(s);
              await refreshSeedOverview();
              st.statusMsg = '↺ Повернуто дані збірки.';
              drawAll();
            },
          }, '↺ Дані збірки') : null)),
      st.statusMsg ? h('div.ai-status-line.small', null, st.statusMsg) : null,
      h('div.ai-kpis', null,
        kpi(`${an.currentStage.icon} Етап ${an.currentStage.n}`, an.currentStage.title, `#/roadmap/${an.currentStage.id}`),
        kpi(`${an.doneNodes.length} / ${s.roadmap.nodes.length}`, `віх виконано · відкрито зараз: ${an.availNodes.length}`, '#/roadmap'),
        kpi(`${lw?.quests?.doneCount ?? p?.quests?.done?.length ?? 0}`, `квестів виконано · у процесі: ${lw?.quests?.startedCount ?? an.startedQuests.length}`, '#/chapters'),
        kpi(`${slotsCnt} / ${lw?.itemsObtained?.length ?? p?.items?.obtained?.length ?? 0}`, 'у слотах (інв. + Curios) / здобуто', null),
        kpi(`XP ${lw?.player?.xpLevel ?? p?.player?.xp_level ?? 0} · ${lw?.player?.worldTierUk || an.worldTierUk}`, `вимір: ${lv?.live?.dimensionUk || lw?.player?.dimensionUk || an.dimUk} · страв: ${lw?.player?.uniqueFoods ?? p?.player?.unique_foods ?? 0}`, null))));
  }

  function drawLeft() {
    const contTabsScroll = leftBox.querySelector('.mc-cont-tabs')?.scrollLeft || 0;
    const inspListScroll = leftBox.querySelector('.mc-insp-list')?.scrollTop || 0;
    const evCount = (st.liveState?.events || []).length;
    const slotCnt = countSlotItems(s, st.liveState, an);
    mount(leftBox,
      h('div.ai-tabs', { role: 'tablist', 'aria-label': 'Вкладки помічника' },
        [['slots', `🎒 Слоти й клавіші (${slotCnt})`],
         ['next', `🧭 Наступні кроки (${an.availNodes.length})`],
         ['log', `📜 Події та лог${evCount ? ` (${evCount})` : ''}`],
         ['core', '🧩 Компаньйон і сховища']].map(([id, label]) =>
          h(`button${st.leftTab === id ? '.on' : ''}`, {
            type: 'button',
            role: 'tab',
            'aria-selected': String(st.leftTab === id),
            onclick: () => { st.leftTab = /** @type {any} */ (id); drawLeft(); },
          }, label))),
      st.leftTab === 'slots'
        ? renderSlotsAndKeysTab(s, an, st, keysData.keys, drawLeft, askFromLeftPanel)
        : st.leftTab === 'next'
          ? renderNextTab(s, an, async () => { an = await analyzePlayerState(s); await refreshSeedOverview(); drawHead(); drawLeft(); chatView.syncStream(false); })
          : st.leftTab === 'core'
            ? renderJarvisTab(st, baseBridgeUrl(), connectCompanionBridge)
            : renderLogTab(s, an, st.liveState?.logTail || bState()?.logTail || '', st.liveState, st.liveConnected));
    if (contTabsScroll > 0) {
      const ct = leftBox.querySelector('.mc-cont-tabs');
      if (ct) ct.scrollLeft = contTabsScroll;
    }
    if (inspListScroll > 0) {
      const il = leftBox.querySelector('.mc-insp-list');
      if (il) il.scrollTop = inspListScroll;
    }
  }

  function drawAll() {
    drawHead();
    drawLeft();
    chatView.syncHead();
    chatView.syncCfg();
    chatView.syncChips();
    chatView.syncStream(false);
    chatView.syncComposer();
  }

  const onDocPaste = (/** @type {ClipboardEvent} */ e) => {
    if (!el.isConnected) { cleanup(); return; }
    const items = [...(e.clipboardData?.items || [])];
    const imgItem = items.find((it) => it.type.startsWith('image/'));
    if (imgItem) {
      const f = imgItem.getAsFile();
      if (f) {
        e.preventDefault();
        stageFileBlob(f, `Буфер обміну (${nowHHMM()})`);
      }
    }
  };

  const onDocClick = (/** @type {MouseEvent} */ e) => {
    if (!el.isConnected) { cleanup(); return; }
    if (st.openPop && !(/** @type {HTMLElement} */ (e.target)?.closest?.('.ai-pop, .ai-cam-btn, .ai-model-btn'))) {
      st.openPop = '';
      chatView.syncComposer();
    }
  };

  const onWorldChange = async (/** @type {Event} */ ev) => {
    if (!el.isConnected) { cleanup(); return; }
    const detail = /** @type {CustomEvent} */ (ev).detail || {};
    if (detail.bridgeState && detail.bridgeState.ok) {
      st.liveState = detail.bridgeState;
      st.lastSlotsSig = computeSlotsSig(detail.bridgeState);
      st.lastLogSig = computeLogSig(detail.bridgeState);
    } else if (!detail.fromBridge && st.liveState?.world && s.progress?.folder && st.liveState.world.folder !== s.progress.folder) {
      st.liveState = { ...st.liveState, world: null, keyRadar: [] };
      st.lastSlotsSig = '';
    }
    const kd = await loadKeys().catch(() => null);
    if (kd?.keys) keysData.keys = kd.keys;
    an = await analyzePlayerState(s);
    await refreshSeedOverview();
    drawAll();
  };

  function cleanup() {
    if (sse) { try { sse.close(); } catch { /* ignore */ } sse = null; }
    voice.stop();
    stopSpeaking();
    document.removeEventListener('paste', onDocPaste);
    document.removeEventListener('click', onDocClick);
    window.removeEventListener('worldchange', onWorldChange);
    window.removeEventListener('hashchange', onHashLeave);
  }
  function onHashLeave() {
    if (!location.hash.startsWith('#/assistant')) cleanup();
  }
  document.addEventListener('paste', onDocPaste);
  document.addEventListener('click', onDocClick);
  window.addEventListener('worldchange', onWorldChange);
  window.addEventListener('hashchange', onHashLeave);

  mount(el, headBox, h('div.ai-cols', null, leftBox, rightBox));
  drawAll();
  await connectCompanionBridge();
  if (initialQ) sendTurn({ text: initialQ });
}
