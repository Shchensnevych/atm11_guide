// @ts-check
// Прогрес гравця: знімок із сейву (data/progress.json, data/progress/<slug>.json) + ручні позначки у localStorage окремо для кожного світу.
// Наявні позначки «без світу» (atm11-guide-progress-v1) автоматично переносяться у перший вибраний світ без втрати даних.
const LEGACY_KEY = 'atm11-guide-progress-v1';
const WORLD_KEY = 'atm11-guide-world-v1';
const MIGRATED_KEY = 'atm11-guide-progress-migrated-v1';

/** @type {ProgressData | null} */
let curWorld = null;
/** @type {RoadNode[]} */
let roadNodes = [];
/** @type {Set<string>} */
let autoDone = new Set();
/** @type {Set<string>} */
let doneQuests = new Set();
/** @type {Set<string>} */
let startedQuests = new Set();
/** @type {Set<string>} */
let doneTasks = new Set();
/** @type {Set<string>} */
let doneAdvs = new Set();
/** @type {Set<string>} */
let obtainedItems = new Set();

function storageKey(slug = curWorld?.slug || '') {
  return slug ? `${LEGACY_KEY}:${slug}` : LEGACY_KEY;
}

/** @param {string} [slug] @returns {Record<string, number>} */
function read(slug) {
  try { return JSON.parse(localStorage.getItem(storageKey(slug)) || '{}') || {}; } catch { return {}; }
}

/** @param {Record<string, number>} d @param {string} [slug] */
function write(d, slug) {
  try { localStorage.setItem(storageKey(slug), JSON.stringify(d)); } catch { /* приватний режим */ }
}

/** Одноразове перенесення старих позначок «без світу» у перший вибраний світ. @param {string} slug */
function migrateLegacy(slug) {
  if (!slug) return;
  try {
    if (localStorage.getItem(MIGRATED_KEY)) return;
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const legacy = JSON.parse(raw) || {};
      const keys = Object.keys(legacy);
      if (keys.length) {
        const cur = read(slug);
        for (const k of keys) if (!cur[k]) cur[k] = legacy[k];
        write(cur, slug);
      }
    }
    localStorage.setItem(MIGRATED_KEY, slug);
  } catch { /* ігноруємо помилки доступу до localStorage */ }
}

/** Ініціалізація або перемикання даних прогресу зі знімка світу. @param {ProgressData | null} prog @param {{nodes?: RoadNode[]}} [roadmap] */
export function initProgress(prog, roadmap) {
  curWorld = prog || null;
  if (roadmap?.nodes) roadNodes = roadmap.nodes;
  if (curWorld?.slug) migrateLegacy(curWorld.slug);
  doneQuests = new Set(curWorld?.quests?.done || []);
  startedQuests = new Set(curWorld?.quests?.started || []);
  doneTasks = new Set(curWorld?.quests?.tasks_done || []);
  doneAdvs = new Set(curWorld?.advancements?.done || []);
  obtainedItems = new Set(curWorld?.items?.obtained || []);
  autoDone = new Set();
  for (const n of roadNodes) {
    const db = n.done_by;
    if (!db) continue;
    const ok = (db.quests || []).some((q) => doneQuests.has(q))
      || (db.advancements || []).some((a) => doneAdvs.has(a))
      || (db.items || []).some((i) => obtainedItems.has(i));
    if (ok) autoDone.add(n.id);
  }
}

export const getWorld = () => curWorld;
export const getWorlds = () => curWorld?.worlds || [];
export function getSavedWorldSlug() {
  try { return localStorage.getItem(WORLD_KEY) || ''; } catch { return ''; }
}
/** @param {string} slug */
export function setSavedWorldSlug(slug) {
  try { if (slug) localStorage.setItem(WORLD_KEY, slug); else localStorage.removeItem(WORLD_KEY); } catch {}
}

/** @param {string} id */
export const isAutoDone = (id) => autoDone.has(id);
/** @param {string} id */
export const isManualDone = (id) => !!read()[id];
/** @param {string} id */
export const isDone = (id) => autoDone.has(id) || !!read()[id];

/** @param {string} id @param {boolean} [on] */
export function setDone(id, on) {
  const d = read();
  if (on ?? !d[id]) d[id] = Date.now(); else delete d[id];
  write(d);
  window.dispatchEvent(new CustomEvent('progress', { detail: { id } }));
  return isDone(id);
}

/** @param {string[]} ids */
export const countDone = (ids) => ids.filter((i) => isDone(i)).length;
/** @param {string[]} ids */
export const countAutoDone = (ids) => ids.filter((i) => isAutoDone(i)).length;
/** @param {string[]} ids */
export const countManualDone = (ids) => ids.filter((i) => isManualDone(i)).length;

/** @param {string} qid */
export const isQuestDone = (qid) => doneQuests.has(qid);
/** @param {string} qid */
export const isQuestStarted = (qid) => startedQuests.has(qid);
/** @param {string} tid */
export const isTaskDone = (tid) => doneTasks.has(tid);
/** @param {string} aid */
export const isAdvDone = (aid) => doneAdvs.has(aid);
/** @param {string} iid */
export const isItemObtained = (iid) => obtainedItems.has(iid);

/** Деталізація умов виконання віхи (done_by) для бічної панелі карти. @param {RoadNode} n */
export function whyDone(n) {
  const db = n.done_by || {};
  return {
    auto: autoDone.has(n.id),
    manual: isManualDone(n.id),
    quests: (db.quests || []).map((id) => ({ id, done: doneQuests.has(id), started: startedQuests.has(id) })),
    advancements: (db.advancements || []).map((id) => ({ id, done: doneAdvs.has(id) })),
    items: (db.items || []).map((id) => ({ id, done: obtainedItems.has(id) })),
  };
}

export function exportJSON() { return JSON.stringify(read(), null, 1); }
/** @param {string} txt */
export function importJSON(txt) { write(JSON.parse(txt)); window.dispatchEvent(new CustomEvent('progress', { detail: {} })); }
