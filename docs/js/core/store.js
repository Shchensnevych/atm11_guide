// @ts-check
// Завантаження даних з data/*.json (кеш у пам'яті) і індекси. Дані генерує tools/build_data.py, tools/extract_quests.py і tools/extract_progress.py.
import { initProgress, getSavedWorldSlug, setSavedWorldSlug } from './progress.js';
import { getBrowserGameState, clearBrowserGameState } from './game-folder.js';

/** @type {Map<string, Promise<any>>} */
const cache = new Map();

/** @param {string} path шлях відносно docs/ */
export function getJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then((r) => { if (!r.ok) throw new Error(`${path}: ${r.status}`); return r.json(); }));
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

/** Основні дані: моди, класи, етапи, карта, глави (+ огляди путівника guide.json), гілки, іконки предметів, прогрес із сейву. */
export function load() {
  if (!base) base = Promise.all([
    getJSON('data/mods.json'), getJSON('data/classes.json'), getJSON('data/stages.json'), getJSON('data/roadmap.json'),
    getJSON('data/chapters.json'), getJSON('data/branches.json'), getJSON('data/meta.json'), getJSON('data/items.json'),
    getJSON('data/progress.json').catch(() => null),
    getJSON('data/facts.json').catch(() => ({ facts: [] })),
    getJSON('data/guide.json').catch(() => ({})),
  ]).then(async ([mods, classes, stages, roadmap, chapters, branches, meta, items, prog0, facts, guide]) => {
    const progress = await resolveInitialProgress(prog0);
    initProgress(progress, roadmap);
    /** @type {Store} */
    const s = {
      mods, classes: classes.classes, roles: classes.roles, stages: stages.stages, roadmap, chapters, branches, meta, items, progress, facts: facts.facts || [], guide: guide || {},
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

/** Перемкнути активний світ прогресу без перезавантаження сторінки. @param {string} slug */
export async function switchWorld(slug) {
  const s = await load();
  if (!s.progress || !slug || s.progress.slug === slug) return s.progress;
  const bState = getBrowserGameState();
  if (bState?.bySlug?.[slug]) {
    s.progress = bState.bySlug[slug];
  } else {
    const alt = await getJSON(`data/progress/${slug}.json`).catch(() => null);
    if (!alt) return s.progress;
    s.progress = { ...alt, default: s.progress.default, worlds: s.progress.worlds };
  }
  setSavedWorldSlug(slug);
  initProgress(s.progress, s.roadmap);
  window.dispatchEvent(new CustomEvent('worldchange', { detail: { slug } }));
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
