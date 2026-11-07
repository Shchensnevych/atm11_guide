// @ts-check
// views/assistant/vision-voice.js — підготовка зображень для Vision AI (F2 / Ctrl+V / файл),
// голосове диктування (Web Speech API uk-UA), озвучка відповідей (Edge Neural TTS / speechSynthesis) та лайтбокс.
import { h } from '../../core/dom.js';

/** Завантажує Blob у HTMLImageElement. @param {Blob} blob @returns {Promise<HTMLImageElement>} */
function loadImg(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Не вдалося прочитати зображення')); };
    img.src = url;
  });
}

/** Масштабує зображення до maxSide на canvas і повертає JPEG dataUrl.
 * @param {HTMLImageElement} img @param {number} maxSide @param {number} quality */
function scaleToJpegDataUrl(img, maxSide, quality) {
  const w0 = img.naturalWidth || img.width || 1;
  const h0 = img.naturalHeight || img.height || 1;
  const k = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * k));
  const hPx = Math.max(1, Math.round(h0 * k));
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = hPx;
  const ctx = cv.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D недоступний');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, hPx);
  ctx.drawImage(img, 0, 0, w, hPx);
  return { dataUrl: cv.toDataURL('image/jpeg', quality), width: w0, height: h0 };
}

/**
 * Готує локальне або вставлене з буфера зображення для відправки на /api/vision.
 * @param {Blob} blob
 * @param {string} label
 * @param {'clipboard'|'f2'} [kind]
 * @param {string} [screenshotName]
 */
export async function prepareImageFromBlob(blob, label, kind = 'clipboard', screenshotName = '') {
  const img = await loadImg(blob);
  const full = scaleToJpegDataUrl(img, 1440, 0.85);
  const thumb = scaleToJpegDataUrl(img, 320, 0.72);
  const imageBase64 = full.dataUrl.replace(/^data:image\/jpeg;base64,/i, '');
  const compressedBytes = Math.round((imageBase64.length * 3) / 4);
  return {
    kind,
    label: label || screenshotName || 'Скріншот з буфера',
    screenshotName,
    mimeType: 'image/jpeg',
    imageBase64,
    thumbDataUrl: thumb.dataUrl,
    previewUrl: full.dataUrl,
    width: full.width,
    height: full.height,
    origBytes: blob.size || compressedBytes,
    compressedBytes,
  };
}

/**
 * Завантажує конкретний скріншот F2 з моста (:8812) і готує його до вкладення в чат.
 * @param {string} baseUrl
 * @param {string} shotName
 * @param {number} [mtime]
 */
export async function prepareF2FromBridge(baseUrl, shotName, mtime = 0) {
  const url = `${baseUrl}/screenshots/file?name=${encodeURIComponent(shotName)}${mtime ? `&t=${Math.floor(mtime)}` : ''}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Не вдалося завантажити ${shotName} (HTTP ${r.status})`);
  const blob = await r.blob();
  return prepareImageFromBlob(blob, `F2: ${shotName}`, 'f2', shotName);
}

/**
 * Створює контролер браузерного голосового вводу українською мовою (Web Speech API).
 * Працює як з мостом ШІ, так і в автономному режимі без передачі токенів сесії.
 * @param {(text: string, isFinal: boolean) => void} onTranscript
 * @param {(listening: boolean, errMsg?: string) => void} onStateChange
 */
export function createVoiceDictation(onTranscript, onStateChange) {
  const SR = /** @type {any} */ (window).SpeechRecognition || /** @type {any} */ (window).webkitSpeechRecognition || null;
  /** @type {any} */
  let rec = null;
  let active = false;

  function stop() {
    if (rec && active) {
      try { rec.stop(); } catch { /* ignore */ }
    }
    active = false;
    onStateChange(false);
  }

  function toggle() {
    if (!SR) {
      onStateChange(false, 'Браузер не підтримує Web Speech API (використовуйте Chrome / Edge або клавішу Push-to-Talk у HUD).');
      return;
    }
    if (active) {
      stop();
      return;
    }
    try {
      rec = new SR();
      rec.lang = 'uk-UA';
      rec.interimResults = true;
      rec.continuous = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => {
        active = true;
        onStateChange(true);
      };
      rec.onresult = (/** @type {any} */ ev) => {
        let interim = '';
        let finalTxt = '';
        for (let i = ev.resultIndex || 0; i < ev.results.length; i++) {
          const chunk = ev.results[i][0]?.transcript || '';
          if (ev.results[i].isFinal) finalTxt += chunk;
          else interim += chunk;
        }
        if (finalTxt) onTranscript(finalTxt.trim(), true);
        else if (interim) onTranscript(interim.trim(), false);
      };
      rec.onerror = (/** @type {any} */ ev) => {
        active = false;
        const code = String(ev?.error || '');
        const msg = code === 'not-allowed'
          ? 'Доступ до мікрофона заборонено в браузері.'
          : code === 'no-speech'
            ? ''
            : code ? `Помилка мікрофона: ${code}` : '';
        onStateChange(false, msg);
      };
      rec.onend = () => {
        active = false;
        onStateChange(false);
      };
      rec.start();
    } catch (e) {
      active = false;
      onStateChange(false, e instanceof Error ? e.message : String(e));
    }
  }

  return {
    supported: Boolean(SR),
    isListening: () => active,
    toggle,
    stop,
  };
}

/** Поточне активне озвучення (одне на сторінку). */
let activeAudio = /** @type {HTMLAudioElement | null} */ (null);
let activeAudioUrl = '';
let activeMsgId = '';

export function getSpeakingMsgId() {
  return activeMsgId;
}

export function stopSpeaking() {
  if (activeAudio) {
    try { activeAudio.pause(); } catch { /* ignore */ }
    activeAudio = null;
  }
  if (activeAudioUrl) {
    URL.revokeObjectURL(activeAudioUrl);
    activeAudioUrl = '';
  }
  try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  activeMsgId = '';
}

/**
 * Озвучує відповідь через нейронний голос моста (/api/tts: Остап / Поліна) або браузерний синтезатор.
 * Повторний клік по тому самому повідомленню зупиняє відтворення.
 * @param {string} msgId
 * @param {string} text
 * @param {string} baseUrl
 * @param {boolean} liveConnected
 * @param {string} voiceId
 * @param {() => void} onChange
 */
export async function toggleSpeakAnswer(msgId, text, baseUrl, liveConnected, voiceId, onChange) {
  const clean = String(text || '').replace(/[#*_`>|[\]]/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 900);
  if (!clean) return;
  if (activeMsgId === msgId) {
    stopSpeaking();
    onChange();
    return;
  }
  stopSpeaking();
  activeMsgId = msgId;
  onChange();

  if (liveConnected) {
    try {
      const r = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean, ...(voiceId ? { voice: voiceId } : {}) }),
      });
      if (r.ok) {
        const blob = await r.blob();
        if (activeMsgId !== msgId) return;
        activeAudioUrl = URL.createObjectURL(blob);
        const audio = new Audio(activeAudioUrl);
        activeAudio = audio;
        audio.onended = () => { stopSpeaking(); onChange(); };
        audio.onerror = () => { stopSpeaking(); onChange(); };
        await audio.play();
        return;
      }
    } catch { /* fallback to speechSynthesis */ }
  }

  if (window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'uk-UA';
    u.onend = () => { stopSpeaking(); onChange(); };
    u.onerror = () => { stopSpeaking(); onChange(); };
    window.speechSynthesis.speak(u);
  } else {
    stopSpeaking();
    onChange();
  }
}

/** Відкриває модальне вікно перегляду скріншота у повному розмірі.
 * @param {string} src @param {string} [caption] */
export function openImageLightbox(src, caption = '') {
  if (!src) return;
  const close = () => {
    window.removeEventListener('keydown', onKey);
    overlay.remove();
  };
  const onKey = (/** @type {KeyboardEvent} */ e) => { if (e.key === 'Escape') close(); };
  const overlay = h('div.ai-lightbox', {
    role: 'dialog',
    'aria-modal': 'true',
    onclick: (/** @type {MouseEvent} */ e) => { if (e.target === overlay) close(); },
  },
  h('div.ai-lightbox-inner', null,
    h('img.ai-lightbox-img', { src, alt: caption || 'Скріншот' }),
    h('div.ai-lightbox-bar', null,
      h('span.small', null, caption || 'Скріншот гри ATM11'),
      h('button.btn.small', { type: 'button', onclick: close }, '✕ Закрити (Esc)'))));
  window.addEventListener('keydown', onKey);
  document.body.appendChild(overlay);
}

