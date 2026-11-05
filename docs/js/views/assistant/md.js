// @ts-check
// views/assistant/md.js — безпечний рендер Markdown відповіді ШІ (лише DOM через h() / textContent, SECURITY §4).
// Частина сторінки #/assistant (A1: перенесено з views/assistant.js без змін логіки).
import { h } from '../../core/dom.js';

/** Безпечний рендер Markdown-відповіді ШІ: лише DOM через h() / textContent, без innerHTML (SECURITY §4).
 * Підтримує заголовки #–####, абзаци, марковані й нумеровані списки (зокрема впереміш з текстом), **жирний**, *курсив*, `код`
 * і посилання [текст](#/…) на сторінки путівника або https://. @param {string} md */
export function renderMd(md) {
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
export function inlineMd(line) {
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
