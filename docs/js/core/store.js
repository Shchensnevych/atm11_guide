// @ts-check
// Завантаження даних з data/*.json (кеш у пам'яті) і індекси. Дані генерує tools/build_data.py, tools/extract_quests.py і tools/extract_progress.py.
import { initProgress, getSavedWorldSlug, setSavedWorldSlug } from './progress.js';
import { getBrowserGameState, clearBrowserGameState } from './game-folder.js';

/** @type {Map<string, Promise<any>>} */
const cache = new Map();

/** @param {string} path шлях відносно docs/ */
export function getJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); }));
  }
  return /** @type {Promise<any>} */ (cache.get(path));
}

/** @type {Promise<Store> | null} */
let base = null;

/** Обчислює активний знімок прогресу (з обраної у браузері теки гри або з data/progress.json). @param {any} prog0 */
async function resolveInitialProgress(prog0) {
  const savedSlug = getSavedWorldSlug();
  const bState = getBrowserGameState();
  if (bState && bState.bySlug && Object.keys(bState.bySlug).length) {
    const slug = (savedSlug && bState.bySlug[savedSlug]) ? savedSlug : (bState.defaultSlug || Object.keys(bState.bySlug)[0]);
    return bState.bySlug[slug] || prog0;
  }
  let progress = prog0;
  if (prog0 && savedSlug && savedSlug !== prog0.slug && (prog0.worlds || []).some((/** @type {any} */ w) => w.slug === savedSlug)) {
    const alt = await getJSON(`data/progress/${savedSlug}.json`).catch(() => null);
    if (alt) progress = { ...alt, default: prog0.default, worlds: prog0.worlds };
  }
  return progress;
}

/** Основні дані: моди, класи, етапи, карта, глави (+ огляди путівника guide.json), гілки, іконки предметів (+ qicons), прогрес із сейву. */
export function load() {
  if (!base) base = Promise.all([
    getJSON('data/mods.json'), getJSON('data/classes.json'), getJSON('data/stages.json'), getJSON('data/roadmap.json'),
    getJSON('data/chapters.json'), getJSON('data/branches.json'), getJSON('data/meta.json'), getJSON('data/items.json'),
    getJSON('data/progress.json').catch(() => null),
    getJSON('data/facts.json').catch(() => ({ facts: [] })),
    getJSON('data/guide.json').catch(() => ({})),
    getJSON('data/qicons.json').catch(() => []),
  ]).then(async ([mods, classes, stages, roadmap, chapters, branches, meta, items, prog0, facts, guide, qicons]) => {
    const progress = await resolveInitialProgress(prog0);
    initProgress(progress, roadmap);
    /** @type {Store} */
    const s = {
      mods, classes: classes.classes, roles: classes.roles, stages: stages.stages, roadmap, chapters, branches, meta, items,
      qicons: new Set(Array.isArray(qicons) ? qicons : []), names: null,
      progress, facts: facts.facts || [], guide: guide || {},
      modById: new Map(mods.map((m) => [m.id, m])),
      classById: new Map(classes.classes.map((c) => [c.id, c])),
      stageById: new Map(stages.stages.map((x) => [x.id, x])),
      chapterByFile: new Map(chapters.chapters.map((c) => [c.file, c])),
      dependents: new Map(),
    };
    for (const m of mods) for (const d of m.deps || []) {
      if (!s.dependents.has(d)) s.dependents.set(d, []);
      s.dependents.get(d).push(m.id);
    }
    // кольори класів → CSS-змінні --c-<id>
    for (const c of s.classes) document.documentElement.style.setProperty(`--c-${c.id}`, c.color);
    return s;
  });
  return base;
}

/** Перемкнути активний світ прогресу без перезавантаження сторінки (та синхронізувати з мостом :8812, якщо він онлайн).
 * @param {string} slug @param {{ fromBridge?: boolean }} [opts] */
export async function switchWorld(slug, opts = {}) {
  const s = await load();
  if (!s.progress || !slug) return s.progress;
  const bState = getBrowserGameState();
  if (s.progress.slug !== slug) {
    if (bState?.bySlug?.[slug]) {
      s.progress = bState.bySlug[slug];
    } else {
      const alt = await getJSON(`data/progress/${slug}.json`).catch(() => null);
      if (!alt) return s.progress;
      s.progress = { ...alt, default: s.progress.default, worlds: s.progress.worlds };
    }
    setSavedWorldSlug(slug);
    initProgress(s.progress, s.roadmap);
  }
  let bridgeState = null;
  if (!opts.fromBridge) {
    try {
      const bridgeBase = sessionStorage.getItem('atm11.bridge.online') || '';
      const targetFolder = s.progress.folder || (s.progress.worlds || []).find((w) => w.slug === slug)?.folder || '';
      if (bridgeBase && targetFolder) {
        const r = await fetch(`${bridgeBase.replace(/\/$/, '')}/api/world`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ world: targetFolder }),
        });
        if (r.ok) bridgeState = await r.json().catch(() => null);
      }
    } catch { /* ignore */ }
  }
  window.dispatchEvent(new CustomEvent('worldchange', { detail: { slug, fromBridge: Boolean(opts.fromBridge), bridgeState } }));
  return s.progress;
}

/** Застосовує свіжозчитані дані з обраної в браузері теки гри до Store. @param {any} bState */
export async function applyBrowserGameState(bState) {
  const s = await load();
  if (bState && bState.bySlug && Object.keys(bState.bySlug).length) {
    const curSlug = s.progress?.slug || '';
    const slug = (curSlug && bState.bySlug[curSlug]) ? curSlug : (bState.defaultSlug || Object.keys(bState.bySlug)[0]);
    s.progress = bState.bySlug[slug];
    setSavedWorldSlug(slug);
    initProgress(s.progress, s.roadmap);
  }
  window.dispatchEvent(new CustomEvent('worldchange', { detail: { slug: s.progress?.slug || '', fromBrowser: true } }));
  return s.progress;
}

/** Скидає браузерний знімок теки гри назад до серверного data/progress.json + data/keys.json. */
export async function resetToBuiltProgress() {
  await clearBrowserGameState();
  const s = await load();
  cache.delete('data/progress.json');
  const prog0 = await getJSON('data/progress.json').catch(() => null);
  s.progress = prog0;
  if (prog0?.slug) setSavedWorldSlug(prog0.slug);
  initProgress(s.progress, s.roadmap);
  window.dispatchEvent(new CustomEvent('worldchange', { detail: { slug: s.progress?.slug || '', reset: true } }));
  return s.progress;
}

/** Квести однієї глави (ліниво). @param {string} file */
export const quests = (file) => getJSON(`data/quests/${file}.json`);

/** @param {string | undefined} str */
function stripMcCodes(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/§[0-9a-fk-or]/gi, '').replace(/&#[0-9a-fA-F]{6}/g, '').replace(/\\&/g, '&').trim();
}
/** @param {string | undefined} v */
const isTpl = (v) => typeof v === 'string' && /%(\d+\$)?s/.test(v);
/** @param {string | undefined} v */
const untemplate = (v) => String(v || '').replace(/%(\d+\$)?[sd]/g, ' ').replace(/\s*[:—–-]\s*$/, '').replace(/^\s*[:—–-]\s*/, '').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim();

/** Ліниво довантажує повний словник перекладу data/names.json (55 тис. предметів/блоків, істот, вимірів) у Store. @param {Store} s */
export async function ensureNames(s) {
  if (s.names) return s.names;
  s.names = await getJSON('data/names.json').catch(() => null);
  return s.names;
}

/** Шлях до іконки предмета (з items.json або з 3 503 іконок qicons.json). @param {Store} s @param {string | undefined} id */
export function itemIconUrl(s, id) {
  if (!id) return null;
  if (s.items?.[id]?.img) return s.items[id].img;
  if (s.qicons?.has(id)) {
    const [ns, p] = id.split(':');
    if (ns && p) return `img/items/${ns}/${p}.png`;
  }
  return null;
}

/** Українська назва предмета чи блока (як у грі та мості компаньйона).
 * @param {Store} s @param {string | undefined} id @param {string} [fallback] */
export function itemNameUk(s, id, fallback) {
  if (!id || id === 'minecraft:air') return fallback || 'Порожньо';
  if (fallback && fallback !== id && /[іїєґа-яІЇЄҐА-Я]/.test(fallback)) return stripMcCodes(fallback);
  const it = s.items?.[id];
  if (it?.uk && !isTpl(it.uk)) return stripMcCodes(it.uk);
  const hit = s.names?.items?.[id];
  if (Array.isArray(hit) && hit.length) {
    const uk = stripMcCodes(hit[0] || '');
    const en = stripMcCodes(hit[1] || uk);
    if (uk && !isTpl(uk)) return uk;
    if (en && !isTpl(en)) return en;
    const part = untemplate(uk) || untemplate(en);
    if (/^[A-ZА-ЯІЇЄҐ][A-Za-zА-Яа-яІіЇїЄєҐґ'ʼ]/.test(part)) return part;
  }
  const progUk = s.progress?.items?.names?.[id];
  if (progUk && progUk !== id && !isTpl(progUk)) return progUk;
  if (fallback && fallback !== id) return stripMcCodes(fallback);
  if (it?.en && !isTpl(it.en)) return stripMcCodes(it.en);
  const [ns, p] = id.split(':');
  if (ns && p) {
    const modTitle = ns === 'minecraft' ? 'Minecraft' : (s.modById?.get(ns)?.name || ns);
    return `${p.replace(/_/g, ' ')} (${modTitle})`;
  }
  return id;
}

/** Українська назва виміру. @param {Store} s @param {string | undefined} id */
export function dimNameUk(s, id) {
  if (!id) return 'Верхній світ';
  if (id === 'minecraft:overworld') return 'Верхній світ';
  if (id === 'minecraft:the_nether') return 'Незер';
  if (id === 'minecraft:the_end') return 'Енд';
  if (s.progress?.player?.dimension === id && s.progress?.player?.dimension_uk) return s.progress.player.dimension_uk;
  const hit = s.names?.dims?.[id];
  if (Array.isArray(hit) && hit[0]) return stripMcCodes(hit[0]);
  for (const m of s.mods || []) {
    for (const d of m.dims || []) if (d.id === id && d.name) return d.name;
  }
  return id;
}

/** Українська назва істоти / моба з data/names.json. @param {Store} s @param {string | undefined} id @param {string} [fallback] */
export function entityNameUk(s, id, fallback) {
  if (!id) return fallback || '';
  if (fallback && fallback !== id && /[іїєґа-яІЇЄҐА-Я]/.test(fallback)) return stripMcCodes(fallback);
  const hit = s.names?.entities?.[id];
  if (Array.isArray(hit) && hit[0] && !isTpl(hit[0])) return stripMcCodes(hit[0]);
  if (fallback && fallback !== id) return stripMcCodes(fallback);
  return id;
}

/** Українська назва досягнення (з roadmap.adv_info). @param {Store} s @param {string | undefined} id */
export function advNameUk(s, id) {
  if (!id) return '';
  return s.roadmap?.adv_info?.[id]?.uk || s.roadmap?.adv_info?.[id]?.en || id;
}
