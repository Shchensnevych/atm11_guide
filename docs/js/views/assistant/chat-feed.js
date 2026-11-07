// @ts-check
// views/assistant/chat-feed.js — живий ШІ-чат і голосовий помічник у стилі HUD-віджета ATM11-Companion (#/assistant).
import { h, mount } from '../../core/dom.js';
import { COMPANION_MODELS, COMPANION_VISION_MODELS, saveAssistantConfig } from '../../core/rag.js';
import { renderMd } from './md.js';
import { QUICK_CHIPS } from './tabs.js';
import { getSpeakingMsgId, toggleSpeakAnswer, openImageLightbox } from './vision-voice.js';

const SRC_LABEL = /** @type {Record<string, string>} */ ({
  game: 'з гри',
  demo: 'демо (без гри)',
  hud: 'з HUD',
  site: 'з путівника',
  panel: 'з панелі',
  local: 'з путівника',
});

const MODE_LABEL = /** @type {Record<string, string>} */ ({
  tools: 'виклик інструментів бази',
  prefetch: 'попередня вибірка з бази',
  collected: 'інструменти бази (відповідь із зібраних даних)',
  vision: 'Vision-розбір зображення',
  keys: 'прямий зріз options.txt',
  storage: 'локальний індекс сховищ (0 токенів)',
  memory: 'локальна пам’ять компаньйона (0 токенів)',
});

/** Створює векторну SVG-іконку за набором шляхів (лише статичні константи іконок). @param {string} innerSvg */
function svgIcon(innerSvg) {
  const tpl = document.createElement('template');
  tpl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${innerSvg}</svg>`;
  return /** @type {SVGElement} */ (tpl.content.firstElementChild);
}

const PATH_SPEAKER_ON = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>';
const PATH_SPEAKER_OFF = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>';
const PATH_SPEAKER_SM = '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>';
const PATH_COPY = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>';
const PATH_CHECK = '<polyline points="20 6 9 17 4 12"></polyline>';
const PATH_THUMB_UP = '<path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>';
const PATH_THUMB_DOWN = '<path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>';
const PATH_FLAG = '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line>';
const PATH_CAMERA = '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle>';
const PATH_MIC = '<rect x="9" y="2.5" width="6" height="11.5" rx="3"></rect><path d="M5.5 10.5v.5a6.5 6.5 0 0 0 13 0v-.5"></path><line x1="12" y1="17.5" x2="12" y2="21.5"></line>';
const PATH_SEND = '<line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>';
const PATH_TRASH = '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>';
const PATH_GEAR = '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>';

/** Скорочена назва моделі для кнопки в композері та футера. @param {string} modelId */
function shortModelTitle(modelId) {
  const m = String(modelId || '');
  if (/DeepSeek-V4\.1-Flash/i.test(m)) return 'DeepSeek-V4.1-Flash';
  if (/DeepSeek-V4-Pro/i.test(m)) return 'DeepSeek-V4-Pro';
  if (/qwen-2\.5-72b/i.test(m)) return 'Qwen 2.5 72B';
  if (/qwen2\.5-vl/i.test(m)) return 'Qwen VL';
  if (/deepseek-v3\.2/i.test(m)) return 'DeepSeek V3.2';
  if (/llama-3\.3-70b/i.test(m)) return 'Llama 3.3 70B';
  if (m.startsWith('local/')) return `Ollama · ${m.slice(6)}`;
  return m.replace(/^[^/]+\//, '') || 'Модель ШІ';
}

/** Перетворює Markdown у чистий текст для буфера обміну. @param {string} md */
function plainFromMd(md) {
  return String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/(\*\*|__|`)/g, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();
}

/** Розбирає повідомлення асистента на розмовну репліку `voiceQuote`, основний `bodyMd`, `sources` та `checkInGame` (узгоджено з chat-store.js). @param {any} m */
function extractAssistantParts(m) {
  let voiceQuote = String(m.voiceQuote || m.voiceSummary || '').trim();
  let rest = String(m.bodyMd ?? m.answer ?? '').trim();
  /** @type {string[]} */
  const sources = Array.isArray(m.sources) ? [...m.sources] : [];

  const bracketMatch = rest.match(/^\s*🗣️\s*\[([\s\S]*?)\](?:\s*(?:\r?\n|$))/i)
    || rest.match(/^\s*🗣️\s*«([\s\S]*?)»(?:\s*(?:\r?\n|$))/i)
    || rest.match(/^\s*🗣️\s*"([\s\S]*?)"(?:\s*(?:\r?\n|$))/i);

  if (bracketMatch && bracketMatch[1]) {
    if (!voiceQuote) {
      voiceQuote = bracketMatch[1].trim().replace(/^[«"'\s]+|[»"'\s]+$/g, '').replace(/\*\*|__|`/g, '').trim();
    }
    rest = rest.slice(bracketMatch[0].length).trim().replace(/^🗣️\s+/, '');
  } else if (/^\s*🗣️\s*/.test(rest)) {
    const parts = [];
    while (/^\s*🗣️\s*/.test(rest)) {
      const lm = rest.match(/^\s*🗣️\s*\[?([^\]\r\n]+)\]?(?:\r?\n|$)/);
      if (!lm || !lm[1]) break;
      parts.push(lm[1].trim().replace(/^[«"'\s]+|[»"'\s]+$/g, '').replace(/\*\*|__|`/g, '').trim());
      rest = rest.slice(lm[0].length).trimStart();
    }
    if (!voiceQuote && parts.length) voiceQuote = parts.join(' ');
  }

  const bodyLines = [];
  for (const line of rest.split(/\r?\n/)) {
    const trimmed = line.trim();
    const srcMatch = trimmed.match(/^(?:[-*•]\s*)?(?:\*\*|\*)?Джерел(?:о|а)\s*:(?:\*\*|\*)?\s*(.+)$/i);
    if (srcMatch && srcMatch[1]) {
      const cleanSrc = srcMatch[1]
        .replace(/\*\*|__|`/g, '')
        .replace(/⚑\s*Перевірити в грі\.?/gi, '')
        .replace(/[.;,\s]+$/, '')
        .trim();
      const label = `Джерело: ${cleanSrc}`;
      if (cleanSrc && !sources.includes(label)) sources.push(label);
      continue;
    }
    bodyLines.push(line);
  }

  const bodyMd = bodyLines.join('\n').trim();
  const checkInGame = Boolean(m.checkInGame || /⚑|перевірити в грі|перевір(?:те)? у грі/i.test(`${rest} ${voiceQuote}`));
  return { voiceQuote, bodyMd, sources, checkInGame };
}

/** Текст шухлядки «Деталі» під відповіддю (як у HUD feed.js). @param {any} m @param {string} fallbackWorld */
function buildDetailsText(m, fallbackWorld) {
  const sec = ((m.elapsedMs || 0) / 1000).toFixed(2).replace('.', ',');
  const lines = [
    `Провайдер: ${m.provider || m.model || 'Гібридний RAG путівника'}`,
    `Час відповіді: ${sec} с · Режим: ${MODE_LABEL[m.mode] || m.mode || (String(m.id || '').startsWith('loc_') ? 'гібридний пошук BM25' : 'чат')}`,
  ];
  const wName = m.world || fallbackWorld;
  if (wName) lines.push(`Світ: ${wName}${m.modeUk ? ` (${m.modeUk})` : ''}`);
  if (Array.isArray(m.toolsUsed) && m.toolsUsed.length) {
    lines.push(`Звернення до бази (${m.toolsUsed.length}):`);
    m.toolsUsed.forEach((/** @type {string} */ t, /** @type {number} */ i) => lines.push(`  ${i + 1}. ${t}`));
  }
  return lines.join('\n');
}

/**
 * Створює єдину картку інтерактивного чату (шапка + потік повідомлень + нижня панель чіпів і капсули вводу).
 * Розділяє DOM-слоти потоку і поля вводу, щоб SSE-оновлення не збивали фокус і текст під час набору.
 * @param {Store} s
 * @param {any} st
 * @param {{
 *   baseBridgeUrl: () => string,
 *   syncModel: (modelId: string, visionId?: string) => Promise<void> | void,
 *   reconnectBridge: () => Promise<void> | void,
 *   sendTurn: (opts?: { text?: string, forceF2?: boolean, retryMsg?: any }) => Promise<void> | void,
 *   stageFileBlob: (blob: Blob, label: string) => Promise<void> | void,
 *   stageBridgeShot: (name: string, mtime?: number) => Promise<void> | void,
 *   toggleMic: () => void,
 * }} actions
 */
export function createUnifiedChatView(s, st, actions) {
  const headSlot = h('div.ai-chat-head-wrap');
  const cfgSlot = h('div.ai-chat-cfg-wrap');
  const streamSlot = h('div.ai-chat-stream', { role: 'log', 'aria-live': 'polite' });
  const chipsSlot = h('div.ai-quick-chips');
  const composerSlot = h('div.ai-composer-wrap');
  const openDetailIds = new Set();

  /** @type {HTMLTextAreaElement | null} */
  let taEl = null;
  let lastStreamSig = '';

  const fileInput = /** @type {HTMLInputElement} */ (h('input', {
    type: 'file',
    accept: 'image/png,image/jpeg,image/webp',
    hidden: true,
    onchange: () => {
      const f = fileInput.files?.[0];
      fileInput.value = '';
      if (f) actions.stageFileBlob(f, f.name);
    },
  }));

  function autoGrowTa() {
    if (!taEl) return;
    taEl.style.height = 'auto';
    taEl.style.height = `${Math.min(120, Math.max(24, taEl.scrollHeight))}px`;
  }

  function syncHead() {
    const isBridge = st.cfg.mode === 'bridge' && st.liveConnected;
    const lv = st.liveState?.live;
    const worldName = st.liveState?.world?.name || s.progress?.world || 'Стенд';
    const isLiveNow = Boolean(isBridge && lv?.in_world && lv?.now && !lv?.paused);
    const isPaused = Boolean(isBridge && lv?.in_world && lv?.paused);

    const dotCls = isLiveNow ? 'live' : isBridge ? 'paused' : 'rag';
    const statusText = isLiveNow
      ? `наживо · ${worldName}`
      : isPaused
        ? `на паузі · ${worldName}`
        : isBridge
          ? `міст онлайн · ${worldName}`
          : `автономний RAG · ${worldName}`;

    mount(headSlot, h('div.ai-chat-head', null,
      h('div.ai-head-left', null,
        h('div.ai-avatar', null, 'AI'),
        h('div.ai-title-wrap', null,
          h('div.ai-title', null, 'Компаньйон'),
          h('div.ai-subtitle', { title: isBridge ? 'Спільна стрічка діалогу з ігровим HUD (Alt+Q)' : `Гібридний пошук по базі сайту (${st.corpusCount || 469} статей)` },
            h(`span.ai-status-dot.${dotCls}`),
            h('span', null, statusText)))),
      h('div.ai-chat-tools', null,
        h(`button.ai-tool-btn${st.cfg.autoSpeak ? '.on' : ''}`, {
          type: 'button',
          title: st.cfg.autoSpeak ? 'Автоозвучення увімкнено (клік — вимкнути)' : 'Увімкнути автоозвучення відповідей (Остап / Поліна)',
          onclick: () => {
            st.cfg.autoSpeak = !st.cfg.autoSpeak;
            saveAssistantConfig(st.cfg);
            syncHead();
          },
        }, svgIcon(st.cfg.autoSpeak ? PATH_SPEAKER_ON : PATH_SPEAKER_OFF)),
        h('button.ai-tool-btn', {
          type: 'button',
          title: isBridge ? 'Очистити спільну історію діалогу моста' : 'Очистити локальний діалог',
          onclick: async () => {
            if (isBridge) {
              try { await fetch(`${actions.baseBridgeUrl()}/api/chat/clear`, { method: 'POST' }); } catch { /* ignore */ }
            } else {
              st.localMessages = st.seedMessage ? [st.seedMessage] : [];
              syncStream(true);
            }
          },
        }, svgIcon(PATH_TRASH)),
        h(`button.ai-tool-btn${st.showCfg ? '.on' : ''}`, {
          type: 'button',
          title: 'Налаштування моста (:8812) та голосу озвучення',
          onclick: () => { st.showCfg = !st.showCfg; syncHead(); syncCfg(); },
        }, svgIcon(PATH_GEAR)))));
  }

  function syncCfg() {
    if (!st.showCfg) {
      mount(cfgSlot);
      return;
    }
    const cfg = st.cfg;
    const upd = (/** @type {string} */ k, /** @type {any} */ v) => { cfg[k] = v; saveAssistantConfig(cfg); };
    mount(cfgSlot, h('div.ai-cfg-box', null,
      h('div.small.ai-cfg-lead', null,
        h('b', null, '🔌 Підключення до моста ATM11-Companion (:8812) '),
        h('span.muted', null, '— ключі API зберігаються виключно в .env компаньйона')),
      h('div.ai-cfg-row.small', null,
        h('label', null, 'URL моста: ', h('input', {
          type: 'text',
          value: cfg.bridgeUrl,
          oninput: (/** @type {Event} */ e) => upd('bridgeUrl', /** @type {HTMLInputElement} */ (e.target).value),
        })),
        h('label', null, 'Голос озвучення: ', h('select.wb-select', {
          onchange: (/** @type {Event} */ e) => upd('ttsVoice', /** @type {HTMLSelectElement} */ (e.target).value),
        }, [
          ['', 'Авто (за характером Джарвіса)'],
          ['uk-UA-OstapNeural', 'Остап (чоловічий Neural)'],
          ['uk-UA-PolinaNeural', 'Поліна (жіночий Neural)'],
        ].map(([id, lbl]) => h('option', { value: id, selected: cfg.ttsVoice === id }, lbl)))),
        h('button.btn.small', {
          type: 'button',
          onclick: async () => {
            await actions.reconnectBridge();
            syncHead();
            syncCfg();
            syncComposer();
          },
        }, '🔌 Перевірити міст'),
        st.bridgeInfo
          ? h(`span.small.${st.bridgeInfo.ok ? 'ai-cfg-ok' : 'ai-cfg-bad'}`, null,
              st.bridgeInfo.ok ? `✔ Онлайн (${(st.bridgeInfo.providers || []).join(', ') || 'локальний'})` : `✕ Офлайн (${st.bridgeInfo.error || 'не запущено'})`)
          : h('span.small.muted', null, st.liveConnected ? '✔ Підключено' : 'міст не запущено'))));
  }

  /** @param {string} msgId @param {'up'|'down'|null} rating */
  async function rateMessage(msgId, rating) {
    try {
      await fetch(`${actions.baseBridgeUrl()}/api/chat/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId, rating }),
      });
    } catch { /* ignore */ }
  }

  /** Повертає релевантні посилання на статті путівника (.ai-hit-pill) для локальних відповідей RAG. @param {any} m */
  function resolveGuideHits(m) {
    return Array.isArray(m.hits) ? m.hits : [];
  }

  /** Рендерить одне повідомлення (гравця або ШІ) у візуальній мові ігрового HUD. @param {any} m */
  function renderMessageBubble(m) {
    const baseUrl = actions.baseBridgeUrl();
    const worldName = st.liveState?.world?.name || s.progress?.world || 'Стенд';

    // 1. Хмаринка гравця (праворуч)
    if (m.role === 'user') {
      const srcLbl = SRC_LABEL[m.source] || 'з путівника';
      const metaStr = [srcLbl, m.time].filter(Boolean).join(' · ');
      const rawText = m.text || m.rawCmd || '';
      const att = m.attachment;

      if (att) {
        const thumbSrc = att.thumbDataUrl
          || (att.screenshotName && st.liveConnected ? `${baseUrl}/screenshots/file?name=${encodeURIComponent(att.screenshotName)}` : '');
        const fullSrc = (att.screenshotName && st.liveConnected)
          ? `${baseUrl}/screenshots/file?name=${encodeURIComponent(att.screenshotName)}`
          : (att.previewUrl || thumbSrc);
        const hasThumb = Boolean(thumbSrc);

        return h('div.ai-user-row', null,
          h('div.ai-msg-user.has-shot', null,
            metaStr ? h('div.u-meta-top', null, metaStr) : null,
            h(`div.u-shot-box.${hasThumb ? 'with-img' : 'no-img'}`, {
              title: hasThumb ? 'Натисніть для збільшення скріншота' : '',
              onclick: hasThumb ? () => openImageLightbox(fullSrc, att.label || att.screenshotName) : undefined,
            },
            hasThumb ? h('img.ai-msg-thumb', { src: thumbSrc, alt: att.label || 'Скріншот', loading: 'lazy' }) : null,
            h('span.u-shot-label', null, att.label || att.screenshotName || 'скріншот F2')),
            rawText ? h('div.u-text', null, rawText) : null));
      }

      const isShortCmd = (m.source === 'game' || m.source === 'demo' || rawText.startsWith('!')) && rawText.length <= 36;
      if (isShortCmd && metaStr) {
        return h('div.ai-user-row', null,
          h('div.ai-msg-user.is-inline-cmd', null,
            h('span.u-meta', null, metaStr),
            h('span.u-cmd', null, rawText)));
      }

      return h('div.ai-user-row', null,
        h('div.ai-msg-user', null,
          metaStr ? h('div.u-meta-top', null, metaStr) : null,
          h('div.u-text', null, rawText)));
    }

    // 2. Стан очікування відповіді ШІ (.ai-msg-ai.pending)
    if (m.pending) {
      return h('div.ai-msg-ai.pending', null,
        m.voiceEarly ? h('div.ai-msg-voice', null,
          h('span.ai-voice-icon', null, svgIcon(PATH_SPEAKER_SM)),
          h('span.ai-voice-text', null, m.voiceEarly)) : null,
        h('div.ai-pending-wrap', null,
          h('div.ai-pending-label', null, m.voiceEarly
            ? 'Дописую відповідь…'
            : (m.pendingLabel || (m.kind === 'vision' ? 'Розбираю скріншот через Vision AI…' : 'Шукаю в базі…'))),
          h('div.ai-typing-pill', null, h('span'), h('span'), h('span'))));
    }

    // 3. Помилка запиту (.ai-msg-ai.err)
    if (m.error) {
      return h('div.ai-msg-ai.err', null,
        h('div.ai-error-box', null,
          h('span.ai-error-text', null, `⚠ ${m.error}`),
          m.query ? h('button.ai-retry-btn', {
            type: 'button',
            title: 'Повторити цей запит',
            onclick: () => actions.sendTurn({ retryMsg: m }),
          }, '↻ Повторити') : null));
    }

    // 4. Готова відповідь ШІ: золотиста голосова хмаринка + довідковий блок + плашки джерел + футер дій
    const { voiceQuote, bodyMd, sources, checkInGame } = extractAssistantParts(m);
    const msgId = String(m.id || 'seed');
    const speaking = getSpeakingMsgId() === msgId;
    const isBridgeMsg = Boolean(m.id && !String(m.id).startsWith('loc_') && st.liveConnected);
    const isDetailsOpen = openDetailIds.has(msgId);
    const elapsedStr = ((m.elapsedMs || 0) / 1000).toFixed(2).replace('.', ',');
    const shortModel = m.shortModel || shortModelTitle(m.model || m.provider || 'Гібридний RAG');
    const hits = resolveGuideHits(m);

    const triggerSpeak = () => {
      toggleSpeakAnswer(msgId, voiceQuote || plainFromMd(bodyMd), baseUrl, st.liveConnected, st.cfg.ttsVoice, () => syncStream(false));
      syncStream(false);
    };

    const copyBtn = h('button.ai-act-btn', {
      type: 'button',
      title: 'Копіювати відповідь',
      onclick: async () => {
        const parts = [voiceQuote, plainFromMd(bodyMd), ...sources].filter(Boolean);
        try {
          await navigator.clipboard.writeText(parts.join('\n\n'));
          mount(copyBtn, svgIcon(PATH_CHECK));
          copyBtn.classList.add('copied');
          setTimeout(() => {
            mount(copyBtn, svgIcon(PATH_COPY));
            copyBtn.classList.remove('copied');
          }, 1400);
        } catch { /* ignore */ }
      },
    }, svgIcon(PATH_COPY));

    const detailsDrawer = h(`div.ai-details-drawer${isDetailsOpen ? '.open' : ''}`, null, buildDetailsText(m, worldName));
    const detailsBtn = h(`button.ai-details-btn${isDetailsOpen ? '.open' : ''}`, {
      type: 'button',
      onclick: () => {
        if (openDetailIds.has(msgId)) openDetailIds.delete(msgId);
        else openDetailIds.add(msgId);
        const nowOpen = openDetailIds.has(msgId);
        detailsBtn.classList.toggle('open', nowOpen);
        detailsDrawer.classList.toggle('open', nowOpen);
      },
    }, 'Деталі');

    return h('div.ai-msg-ai', null,
      voiceQuote ? h(`div.ai-msg-voice${speaking ? '.speaking' : ''}`, {
        title: 'Натисніть, щоб озвучити або зупинити',
        onclick: triggerSpeak,
      },
      h('span.ai-voice-icon', null, svgIcon(PATH_SPEAKER_SM)),
      h('span.ai-voice-text', null, voiceQuote)) : null,

      bodyMd ? renderMd(bodyMd) : null,

      (sources.length || checkInGame) ? h('div.ai-pills-row', null,
        ...sources.map((src) => h('span.ai-pill-source', null, src)),
        checkInGame ? h('span.ai-pill-flag', { title: 'Твердження потребує перевірки безпосередньо в грі' },
          svgIcon(PATH_FLAG), ' Перевірити в грі') : null) : null,

      hits.length ? h('div.ai-msg-hits', null,
        hits.slice(0, 5).map((/** @type {any} */ hit) => h('a.ai-hit-pill', {
          href: hit.doc.href,
          title: hit.doc.text.slice(0, 180),
        }, h('span.muted', null, hit.doc.badge.split(' ')[0]), ' ', h('span', null, hit.doc.title)))) : null,

      h('div.ai-footer-row', null,
        h('div.ai-actions', null,
          h(`button.ai-act-btn${speaking ? '.speaking' : ''}`, {
            type: 'button',
            title: speaking ? 'Зупинити озвучення' : 'Озвучити повторно',
            onclick: triggerSpeak,
          }, svgIcon(PATH_SPEAKER_SM)),
          copyBtn,
          isBridgeMsg ? h(`button.ai-act-btn${m.rating === 'up' ? '.rated-up' : ''}`, {
            type: 'button',
            title: 'Корисна відповідь (додати в еталон)',
            onclick: () => {
              m.rating = m.rating === 'up' ? null : 'up';
              syncStream(false);
              rateMessage(m.id, m.rating);
            },
          }, svgIcon(PATH_THUMB_UP)) : null,
          isBridgeMsg ? h(`button.ai-act-btn${m.rating === 'down' ? '.rated-down' : ''}`, {
            type: 'button',
            title: 'Неточна відповідь (записати в журнал)',
            onclick: () => {
              m.rating = m.rating === 'down' ? null : 'down';
              syncStream(false);
              rateMessage(m.id, m.rating);
            },
          }, svgIcon(PATH_THUMB_DOWN)) : null),
        h('div.ai-meta', null,
          h('span', null, `${shortModel} · ${elapsedStr} с ·`),
          detailsBtn)),

      detailsDrawer);
  }

  /** Оновлює потік повідомлень без переривання вводу в композері. @param {boolean} [forceScroll] */
  function syncStream(forceScroll = false) {
    const isBridge = st.cfg.mode === 'bridge' && st.liveConnected;
    const list = isBridge
      ? (st.chatHistory.length ? st.chatHistory.slice(-40) : (st.seedMessage ? [st.seedMessage] : []))
      : st.localMessages;
    const nearBottom = streamSlot.scrollHeight - streamSlot.scrollTop - streamSlot.clientHeight < 95;
    const last = list[list.length - 1];
    const sig = `${isBridge ? 'B' : 'L'}:${list.length}:${last?.id || ''}:${last?.pending ? 'P' : 'D'}:${last?.voiceEarly || ''}`;

    mount(streamSlot, ...(list.length
      ? list.map((/** @type {any} */ m) => renderMessageBubble(m))
      : [h('div.small.muted.ai-empty-chat', null, 'Напишіть запитання, оберіть швидку дію нижче або вставте скріншот F2 / Ctrl+V.')]));

    if (forceScroll || (sig !== lastStreamSig && nearBottom)) {
      requestAnimationFrame(() => { streamSlot.scrollTop = streamSlot.scrollHeight; });
    }
    lastStreamSig = sig;
  }

  function syncChips() {
    mount(chipsSlot, ...QUICK_CHIPS.map((c) => {
      if (c.kind === 'f2' && !st.liveConnected) return null;
      return h('button.ai-qchip', {
        type: 'button',
        onclick: () => {
          if (c.kind === 'draft') {
            setDraft(c.query, true);
          } else if (c.kind === 'f2') {
            actions.sendTurn({ text: c.query, forceF2: true });
          } else {
            actions.sendTurn({ text: c.query });
          }
        },
      }, c.label);
    }));
  }

  async function loadRecentF2Gallery() {
    if (!st.liveConnected) return;
    st.f2Loading = true;
    syncComposer();
    try {
      const r = await fetch(`${actions.baseBridgeUrl()}/api/screenshots?limit=8`);
      const d = await r.json().catch(() => ({}));
      if (r.ok && Array.isArray(d.items)) st.f2Items = d.items;
    } catch { /* ignore */ }
    st.f2Loading = false;
    syncComposer();
  }

  function syncComposer() {
    const prevVal = taEl ? taEl.value : st.draft;
    const hadFocus = Boolean(taEl && document.activeElement === taEl);
    const att = st.pendingAttachment;
    const busy = Boolean(st.busyAsk || st.busyVision);
    const isBridge = st.cfg.mode === 'bridge';
    const baseUrl = actions.baseBridgeUrl();
    const ollamaList = (st.liveState?.ollamaModels || []).map((/** @type {string} */ name) => ({
      id: `local/${name}`, label: `🦙 ${name}`, provider: 'Ollama',
    }));
    const allTextModels = [...COMPANION_MODELS, ...ollamaList];

    taEl = /** @type {HTMLTextAreaElement} */ (h('textarea.ai-composer-ta', {
      rows: 1,
      value: prevVal,
      placeholder: att
        ? `Додайте питання до «${att.label}» або натисніть Enter…`
        : 'Запитайте про гру...',
      oninput: () => {
        st.draft = taEl?.value || '';
        autoGrowTa();
      },
      onkeydown: (/** @type {KeyboardEvent} */ e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          if (!busy) actions.sendTurn({ text: taEl?.value || '' });
        }
      },
    }));

    mount(composerSlot,
      fileInput,
      // Спливаюча галерея скріншотів F2 (як у HUD #hudShotGallery)
      st.openPop === 'f2' ? h('div.ai-pop.ai-f2-pop', null,
        h('div.ai-pop-head', null,
          h('span', null, '📸 Скріншоти гри (F2)'),
          h('div.ai-pop-actions', null,
            st.liveConnected ? h('button.ai-gal-btn.primary', {
              type: 'button',
              title: 'Прикріпити та розібрати найсвіжіший скріншот F2',
              onclick: () => {
                st.openPop = '';
                syncComposer();
                actions.sendTurn({ text: taEl?.value || '', forceF2: true });
              },
            }, '⚡ Останній') : null,
            h('button.ai-gal-btn', {
              type: 'button',
              title: 'Обрати будь-який скріншот або зображення з ПК',
              onclick: () => { st.openPop = ''; syncComposer(); fileInput.click(); },
            }, '📂 Обрати…'),
            h('button.ai-gal-btn', {
              type: 'button',
              title: 'Закрити галерею',
              onclick: () => { st.openPop = ''; syncComposer(); },
            }, '✕'))),
        st.liveConnected
          ? (st.f2Loading
              ? h('div.small.muted.ai-pop-hint', null, '⏳ Завантаження скріншотів…')
              : (st.f2Items || []).length
                ? h('div.ai-f2-grid', null, st.f2Items.map((/** @type {any} */ it) => h('button.ai-f2-card', {
                    type: 'button',
                    title: `Прикріпити ${it.name}`,
                    onclick: () => {
                      st.openPop = '';
                      actions.stageBridgeShot(it.name, it.mtimeMs || it.mtime || 0);
                    },
                  },
                  h('img', { src: `${baseUrl}${it.url}&t=${Math.floor(it.mtimeMs || it.mtime || 1)}`, alt: it.name, loading: 'lazy' }),
                  h('span.shot-gal-time', null, it.name.replace(/\.png$/i, '').slice(-8)))))
                : h('div.small.muted.ai-pop-hint', null, 'У теці minecraft/screenshots поки немає F2-скріншотів. Натисніть F2 у грі або вставте Ctrl+V.'))
          : h('div.small.muted.ai-pop-hint', null, 'Натисніть «📂 Обрати…» або вставте скріншот із буфера обміну через Ctrl+V.')) : null,

      // Спливаючий пікер моделей ШІ
      st.openPop === 'model' ? h('div.ai-pop.ai-model-pop', null,
        h('div.ai-pop-head', null,
          h('span', null, 'Текстова модель ШІ (:8812)'),
          h('button.ai-gal-btn', { type: 'button', onclick: () => { st.openPop = ''; syncComposer(); } }, '✕')),
        ...allTextModels.map((m) => {
          const sel = st.cfg.mode === 'bridge' && st.cfg.openaiModel === m.id;
          return h(`button.ai-pop-item${sel ? '.sel' : ''}`, {
            type: 'button',
            onclick: () => {
              st.cfg.mode = 'bridge';
              st.cfg.modeExplicit = true;
              st.openPop = '';
              actions.syncModel(m.id);
            },
          },
          h('span.ai-pop-mname', null, shortModelTitle(m.id), m.provider ? h('small.ai-pop-tag', null, m.provider) : null),
          h('span.ai-pop-chk', null, sel ? '✓' : ''));
        }),
        h('div.ai-pop-sep'),
        h('div.ai-pop-head', null, h('span', null, 'Vision-модель для скріншотів')),
        ...COMPANION_VISION_MODELS.map((vm) => {
          const vSel = st.cfg.visionModel === vm.id;
          return h(`button.ai-pop-item${vSel ? '.sel' : ''}`, {
            type: 'button',
            onclick: () => {
              st.openPop = '';
              actions.syncModel(st.cfg.openaiModel, vm.id);
            },
          },
          h('span.ai-pop-mname', null, 'Qwen 2.5 VL 72B', h('small.ai-pop-tag', null, 'Vision')),
          h('span.ai-pop-chk', null, vSel ? '✓' : ''));
        })) : null,

      // Прев'ю прикріпленого скріншота перед відправкою
      att ? h('div.ai-attach-bar', null,
        h('img.ai-attach-thumb', {
          src: att.thumbDataUrl || att.previewUrl,
          alt: att.label,
          onclick: () => openImageLightbox(att.previewUrl || att.thumbDataUrl, att.label),
        }),
        h('div.ai-attach-meta', null,
          h('span.ai-attach-title', null, att.label),
          h('span.ai-attach-sub', null, `${att.width}×${att.height} · ${Math.max(1, Math.round(att.compressedBytes / 1024))} КБ · стиснено для Qwen VL`)),
        h('button.ai-attach-remove', {
          type: 'button',
          title: 'Прибрати вкладення',
          onclick: () => { st.pendingAttachment = null; syncComposer(); },
        }, '✕')) : null,

      // Заглиблена капсула поля вводу (як .hud-composer-pill у HUD)
      h(`div.ai-composer${st.dragOver ? '.drag' : ''}`, null,
        h(`button.ai-cam-btn${st.openPop === 'f2' || att ? '.has-file' : ''}`, {
          type: 'button',
          title: 'Галерея скріншотів F2 або вибір зображення з ПК (Ctrl+V — буфер обміну)',
          onclick: (/** @type {MouseEvent} */ e) => {
            e.stopPropagation();
            const next = st.openPop === 'f2' ? '' : 'f2';
            st.openPop = next;
            syncComposer();
            if (next === 'f2') loadRecentF2Gallery();
          },
        }, svgIcon(PATH_CAMERA)),

        taEl,

        h(`button.ai-mic-btn${st.voiceListening ? '.listening' : ''}`, {
          type: 'button',
          title: st.voiceListening ? 'Слухаю українською… Натисніть, щоб зупинити' : '🎙️ Голосове питання українською',
          'aria-label': 'Голосовий ввід',
          onclick: () => actions.toggleMic(),
        }, svgIcon(PATH_MIC)),

        h('button.ai-send-btn', {
          type: 'button',
          disabled: busy,
          title: att ? 'Надіслати скріншот у Vision AI' : 'Надіслати (Enter)',
          'aria-label': 'Надіслати',
          onclick: () => actions.sendTurn({ text: taEl?.value || '' }),
        }, svgIcon(PATH_SEND))),

      // Нижній рядок підказки + швидкого вибору моделі та режиму (Міст ШІ / Автономний RAG)
      h('div.ai-composer-sub', null,
        h('div.ai-comp-left', null,
          h(`button.ai-comp-btn.ai-model-btn${st.openPop === 'model' ? '.on' : ''}`, {
            type: 'button',
            title: 'Обрати текстову та Vision-модель ШІ',
            onclick: (/** @type {MouseEvent} */ e) => {
              e.stopPropagation();
              st.openPop = st.openPop === 'model' ? '' : 'model';
              syncComposer();
            },
          },
          h('span.ai-model-dot', { class: isBridge && st.liveConnected ? 'live' : '' }),
          h('span.ai-model-lbl', null, isBridge ? shortModelTitle(st.cfg.openaiModel) : 'BM25 + RAG'),
          h('span.muted', null, '▴')),
          h(`button.ai-mode-pill${isBridge && st.liveConnected ? '.live' : isBridge ? '.warn' : ''}`, {
            type: 'button',
            title: isBridge
              ? 'Активний живий ШІ-чат через міст ATM11-Companion (:8812). Натисніть для перемикання на локальний RAG.'
              : 'Активний автономний пошук по базі сайту (0 токенів). Натисніть для перемикання на ШІ-міст.',
            onclick: () => {
              st.cfg.mode = st.cfg.mode === 'local' ? 'bridge' : 'local';
              st.cfg.modeExplicit = true;
              saveAssistantConfig(st.cfg);
              syncHead();
              syncStream(true);
              syncComposer();
            },
          }, isBridge
            ? (st.liveConnected ? '🟢 Міст ШІ' : '🔌 Міст офлайн')
            : '⚡ Автономний RAG')),
        h('div.ai-hotkey-hint', null, 'Enter — надіслати · !де <предмет> — скрині · F2 / Ctrl+V — скріншот')));

    autoGrowTa();
    if (hadFocus && taEl) taEl.focus();
  }

  /** @param {string} val @param {boolean} [focus] */
  function setDraft(val, focus = false) {
    st.draft = val;
    if (taEl) {
      taEl.value = val;
      autoGrowTa();
      if (focus) {
        taEl.focus();
        taEl.setSelectionRange(val.length, val.length);
      }
    } else {
      syncComposer();
    }
  }

  const root = h('div.card.ai-chat-card', {
    ondragover: (/** @type {DragEvent} */ e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        if (!st.dragOver) { st.dragOver = true; composerSlot.querySelector('.ai-composer')?.classList.add('drag'); }
      }
    },
    ondragleave: () => {
      if (st.dragOver) { st.dragOver = false; composerSlot.querySelector('.ai-composer')?.classList.remove('drag'); }
    },
    ondrop: (/** @type {DragEvent} */ e) => {
      st.dragOver = false;
      composerSlot.querySelector('.ai-composer')?.classList.remove('drag');
      const file = [...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith('image/'));
      if (file) {
        e.preventDefault();
        actions.stageFileBlob(file, file.name);
      }
    },
  }, headSlot, cfgSlot, streamSlot, h('div.ai-composer-area', null, chipsSlot, composerSlot));

  syncHead();
  syncCfg();
  syncStream(true);
  syncChips();
  syncComposer();

  return {
    root,
    syncHead,
    syncCfg,
    syncStream,
    syncChips,
    syncComposer,
    setDraft,
  };
}
