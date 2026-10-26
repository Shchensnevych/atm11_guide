// @ts-check
// Тексти квестів FTB → HTML: коди &0–&f і &#RRGGBB (кольори), &l &o &n &m (стиль), &r (скидання), \\& (буквальне «&»), \n, {@pagebreak}, {image:…}.
import { esc } from './dom.js';

const COLORS = { 0: '#000000', 1: '#3b5bdb', 2: '#2f9e44', 3: '#22b8cf', 4: '#e03131', 5: '#ae3ec9', 6: '#f59f00', 7: '#adb5bd',
  8: '#868e96', 9: '#5c7cfa', a: '#69db7c', b: '#66d9e8', c: '#ff6b6b', d: '#f783ac', e: '#ffe066', f: '#ffffff' };
const STYLE = { l: 'b', o: 'i', n: 'u', m: 's' };

/** @param {string} raw */
export function ftb(raw) {
  let s = String(raw || '')
    .replace(/\\n/g, '\n')
    .replace(/\{@pagebreak\}/g, '\n\n')
    .replace(/\{image:[^}]*\}/g, '')
    .replace(/\{"(?:text|translate)"[^\n]*\}/g, '');                // вбудований JSON-текст — пропускаємо
  let out = '', color = '', styles = new Set(), open = false;
  const close = () => { if (open) { out += '</span>'; open = false; } };
  const openSpan = () => {
    if (!color && !styles.size) return;
    out += `<span class="${[...styles].join(' ')}"${color ? ` style="color:${color}"` : ''}>`; open = true;
  };
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], code = (s[i + 1] || '').toLowerCase();
    if (ch === '\\' && (s[i + 1] === '&' || s[i + 1] === '§')) { out += esc(s[i + 1]); i++; continue; }   // екранування FTB
    const hex = ch === '&' && s[i + 1] === '#' ? /^[0-9a-f]{6}/i.exec(s.slice(i + 2, i + 8)) : null;
    if (hex) { close(); color = '#' + hex[0]; styles = new Set(); openSpan(); i += 7; continue; }
    if ((ch === '&' || ch === '§') && (code in COLORS || code in STYLE || code === 'r' || code === 'k')) {
      close();
      if (code in COLORS) { color = COLORS[code]; styles = new Set(); }
      else if (code in STYLE) styles.add(STYLE[code]);
      else if (code === 'r') { color = ''; styles = new Set(); }
      openSpan(); i++; continue;
    }
    out += esc(ch);
  }
  close();
  return out.replace(/\n{3,}/g, '\n\n').trim();
}

/** Простий текст без кодів. @param {string} raw */
export const plain = (raw) => String(raw || '').replace(/\\&/g, '\u0000').replace(/&#[0-9a-f]{6}/gi, '').replace(/[&§][0-9a-fk-or]/gi, '').replace(/\u0000/g, '&').replace(/\\n/g, ' ');

/** Чому глава прихована. @param {any} ch */
export const hiddenWhy = (ch) => 'Прихована авторами збірки (always_invisible) — ігровим прогресом не відкривається'
  + (ch.missing?.length ? `; модів немає в збірці: ${ch.missing.join(', ')}` : '; можливо, ще в роботі');
