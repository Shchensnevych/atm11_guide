// @ts-check
// Керування темою інтерфейсу (темна / світла «Slate Paper»).
// Зберігає стан у localStorage під ключем 'atm11-theme' та синхронізує атрибут data-theme на <html>.

const STORAGE_KEY = 'atm11-theme';

const SUN_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const MOON_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

export function getTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  if (cur === 'light' || cur === 'dark') return cur;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'dark';
}

/** Значення CSS-змінної теми — для canvas, SVG-атрибутів і Cytoscape, які не розуміють var(). @param {string} name */
export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function isLight() {
  return getTheme() === 'light';
}

/**
 * @param {HTMLElement} btn
 * @param {'dark'|'light'} theme
 */
export function updateToggleBtn(btn, theme) {
  if (!btn) return;
  const isL = theme === 'light';
  btn.innerHTML = isL ? MOON_SVG : SUN_SVG;
  btn.title = isL ? 'Перемкнути на темну тему' : 'Перемкнути на світлу тему';
  btn.setAttribute('aria-label', btn.title);
}

/** @param {'dark'|'light'} theme */
export function setTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {}

  const btn = document.getElementById('theme-toggle');
  if (btn) updateToggleBtn(btn, next);

  window.dispatchEvent(new CustomEvent('themechange', {
    detail: { theme: next, isLight: next === 'light' }
  }));
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}

export function initTheme() {
  const theme = getTheme();
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    updateToggleBtn(btn, theme);
    btn.onclick = () => toggleTheme();
  }

  // @ts-ignore
  window.__toggleTheme = toggleTheme;
}
