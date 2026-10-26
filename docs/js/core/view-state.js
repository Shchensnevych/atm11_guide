// @ts-check
// Збереження стану сторінок між переходами (фільтри, пошук, позиція й масштаб карти/графів, вибрана віха/квест, прокрутка).
// Дані живуть у пам'яті та дублюються в sessionStorage, щоб не губитися при кліках на картки модів, кнопці «Назад» чи F5.

const SS_KEY = 'atm11_guide_view_state_v1';

/** @type {Record<string, any>} */
let cache = {};
try {
  const raw = sessionStorage.getItem(SS_KEY);
  if (raw) cache = JSON.parse(raw) || {};
} catch {}

function persist() {
  try { sessionStorage.setItem(SS_KEY, JSON.stringify(cache)); } catch {}
}

/** Прочитати збережений стан екрана за ключем. @template T @param {string} key @param {T} [defaults] @returns {T} */
export function getViewState(key, defaults = /** @type {any} */ ({})) {
  const cur = cache[key];
  if (!cur || typeof cur !== 'object') return { ...defaults };
  return { ...defaults, ...cur };
}

/** Оновити стан екрана за ключем (часткове злиття). @param {string} key @param {Record<string, any>} patch */
export function setViewState(key, patch) {
  cache[key] = { ...(cache[key] || {}), ...patch };
  persist();
}

let activeRouteKey = '';
let lastKnownScroll = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => {
    lastKnownScroll = window.scrollY || 0;
    if (activeRouteKey) {
      cache[`scroll:${activeRouteKey}`] = lastKnownScroll;
    }
  }, { passive: true });
}

/** Викликається роутером перед переходом на новий маршрут. @param {string} nextRouteKey @param {string} prevFullHash */
export function beforeRouteChange(nextRouteKey, prevFullHash) {
  if (activeRouteKey) {
    cache[`scroll:${activeRouteKey}`] = lastKnownScroll;
  }
  if (prevFullHash && !prevFullHash.startsWith('#/mod/')) {
    cache._lastNonModHash = prevFullHash;
  }
  activeRouteKey = nextRouteKey;
  persist();
}

/** Відновити прокрутку для маршруту (або прокрутити на початок, якщо збереженої немає). @param {string} routeKey @param {boolean} [forceTop] */
export function restoreRouteScroll(routeKey, forceTop = false) {
  const y = forceTop ? 0 : (Number(cache[`scroll:${routeKey}`]) || 0);
  lastKnownScroll = y;
  window.scrollTo(0, y);
  if (y > 0) {
    requestAnimationFrame(() => { window.scrollTo(0, y); });
  }
}

/** Куди вести кнопку «← Назад» зі сторінки мода. @returns {{ href: string, label: string }} */
export function getModBackTarget() {
  const h = String(cache._lastNonModHash || '#/mods');
  const base = h.split('?')[0];
  if (base.startsWith('#/roadmap')) return { href: '#/' + h.replace(/^#\/?/, '').split('?')[0], label: '← На дорожню карту' };
  if (base.startsWith('#/chapter/')) return { href: base, label: '← До глави квестів' };
  if (base.startsWith('#/chapters')) return { href: '#/chapters', label: '← До глав квестів' };
  if (base.startsWith('#/branch/')) return { href: base, label: '← До гілки прогресу' };
  if (base.startsWith('#/branches')) return { href: '#/branches', label: '← До гілок' };
  if (base.startsWith('#/keys')) return { href: '#/keys', label: '← До клавіш' };
  if (base.startsWith('#/assistant')) return { href: '#/assistant', label: '← До помічника' };
  if (base === '#/' || base === '#') return { href: '#/', label: '← На головну' };
  return { href: '#/mods', label: '← До списку модів' };
}
