// @ts-check
// Мінімальний DOM-помічник: h('div.card#id', {attrs}, ...діти). Рядки — текст (екрановано), вузли — як є.

/**
 * @param {string} sel тег з класами/id: 'a.btn.primary#go'
 * @param {Record<string, any> | null} [attrs]
 * @param {...any} kids
 * @returns {HTMLElement}
 */
export function h(sel, attrs, ...kids) {
  const m = sel.match(/^([a-z0-9]+)?((?:[.#][\w-]+)*)$/i);
  const el = document.createElement((m && m[1]) || 'div');
  for (const part of ((m && m[2]) || '').match(/[.#][\w-]+/g) || []) {
    if (part[0] === '.') el.classList.add(part.slice(1)); else el.id = part.slice(1);
  }
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') {
      for (const [sk, sv] of Object.entries(v)) {           // CSS-змінні (--c) — лише через setProperty
        if (sv == null) continue;
        if (sk.startsWith('--')) el.style.setProperty(sk, String(sv)); else /** @type {any} */ (el.style)[sk] = sv;
      }
    }
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, kids);
  return el;
}

/** @param {HTMLElement} el @param {any[]} kids */
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

/** @param {HTMLElement} el @param {...any} kids */
export function mount(el, ...kids) { el.replaceChildren(); append(el, kids); return el; }

/** @param {string} s */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));

/** @param {Function} fn @param {number} ms */
export function debounce(fn, ms = 150) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
