// @ts-check
// Глава квестів: дані сторінки (квести, наявні іконки, дописи путівника, огляд), стан квесту із сейву, порядок читання, підписи завдань і нагород.
import { getJSON, quests as loadQuests } from './store.js';
import { isQuestDone, isQuestStarted, isTaskDone, isItemObtained, isAdvDone } from './progress.js';
import { nice, rewardLabel } from './rewards.js';

export { rewardLabel };   // підписи нагород — спільний модуль core/rewards.js (сайт і міст компаньйона)

/** @typedef {{ file: string, quests: any[], byId: Map<string, any>, ext: Record<string, any>, links: any[], img: any[], qicons: Set<string>,
 *   qimages: Record<string, [string, number, number]>, tables: Record<string, any>,
 *   notes: Record<string, { text: string, title?: string, verify?: boolean }>, guide: any, unlocks: Map<string, string[]>, hasProg: boolean, hidden: boolean, dims: Map<string, string> }} ChapterCtx */

/** @param {string} file @param {Store} s @returns {Promise<ChapterCtx>} */
export async function loadChapter(file, s) {
  const [data, qi, qimages, tables] = await Promise.all([loadQuests(file), getJSON('data/qicons.json').catch(() => []),
    getJSON('data/qimages.json').catch(() => ({})), getJSON('data/reward_tables.json').catch(() => ({}))]);
  const guide = s.guide || {};
  const notes = guide?.[file]?.notes ? await getJSON(`data/notes/${file}.json`).catch(() => ({})) : {};   // дописи є не в усіх глав
  const qs = data.quests || [];
  const unlocks = new Map();
  for (const q of qs) for (const d of q.deps || []) { if (!unlocks.has(d)) unlocks.set(d, []); unlocks.get(d).push(q.id); }
  const dims = new Map();
  for (const m of s.mods) for (const d of m.dims || []) dims.set(d.id, d.name);
  return { file, quests: qs, byId: new Map(qs.map((q) => [q.id, q])), ext: data.ext || {}, links: data.links || [], img: data.img || [], qicons: new Set(qi), qimages, tables,
    notes: notes || {}, guide: guide?.[file] || null, unlocks, hasProg: !!s.progress?.slug, dims, hidden: !!s.chapterByFile.get(file)?.hidden };
}

/** Шлях до іконки предмета (лише якщо її намальовано). @param {string | undefined} id @param {Set<string>} qicons */
export function iconUrl(id, qicons) {
  if (!id || !qicons.has(id)) return null;
  const [ns, p] = id.split(':');
  return `img/items/${ns}/${p}.png`;
}

/** Іконка квесту: власна з книги, а якщо її не намальовано — перша намальована іконка завдань. @param {any} q @param {ChapterCtx} ctx */
export const questIconId = (q, ctx) => [q.icon, ...(q.tasks || []).map((/** @type {any} */ t) => t.icon)].find((i) => i && ctx.qicons.has(i)) || q.icon;

/** Назва квесту: з книги, а якщо там порожньо — з допису путівника. @param {any} q @param {ChapterCtx} ctx */
export const qTitle = (q, ctx) => q.title || ctx.notes[q.id]?.title || '(без назви)';

/** Службовий квест: «AllRightsReserved» (не видно ніколи) або невидимий до виконання. @param {any} q */
export const isService = (q) => !!(q.arr || q.inv);

/** Чи виконано умову залежностей — як у FTB Quests: dependency_requirement (усі / один виконано, усі / один розпочато), min_required_dependencies.
 * @param {any} q */
export function depsMet(q) {
  const deps = q.deps || [];
  if (!deps.length) return true;
  const done = deps.filter((d) => isQuestDone(d)).length, started = deps.filter((d) => isQuestDone(d) || isQuestStarted(d)).length;
  if (q.dmin) return done >= q.dmin;
  switch (q.dreq) {
    case 'one_completed': return done > 0;
    case 'one_started': return started > 0;
    case 'all_started': return started === deps.length;
    default: return done === deps.length;
  }
}

/** Опис умови залежностей українською. @param {any} q */
export function depsRule(q) {
  const n = (q.deps || []).length;
  if (q.dmin) return `Потрібно спершу (будь-які ${q.dmin} з ${n})`;
  if (n < 2 && !q.dreq?.endsWith('started')) return 'Потрібно спершу';
  return ({ one_completed: 'Потрібно спершу (будь-який один)', one_started: 'Потрібно розпочати (будь-який один)', all_started: 'Потрібно розпочати (усі)' })[q.dreq] || 'Потрібно спершу';
}

/** Стан квесту із сейву: done | started | avail (умову залежностей виконано) | early (гнучкий режим: можна виконувати заздалегідь) | locked | ''.
 * @param {any} q @param {ChapterCtx} ctx */
export function questState(q, ctx) {
  if (!ctx.hasProg) return '';
  if (isQuestDone(q.id)) return 'done';
  if (isQuestStarted(q.id)) return 'started';
  if (ctx.hidden) return '';                                   // прихована глава: «доступний / заблокований» не має сенсу
  return depsMet(q) ? 'avail' : q.flex ? 'early' : 'locked';
}

/** Чи видно квест у книзі в грі зараз (FTB: invisible, hide_until_deps_visible / hide_until_deps_complete). Без сейву — null (невідомо).
 * @param {any} q @param {ChapterCtx} ctx @param {Set<string>} [seen] @returns {boolean | null} */
export function visibleInGame(q, ctx, seen = new Set()) {
  if (!ctx.hasProg) return null;
  if (q.arr) return false;
  if (q.inv) return isQuestDone(q.id);
  if (!q.vis || seen.has(q.id)) return true;
  seen.add(q.id);
  if (q.vis === 'deps_complete') return depsMet(q);
  return (q.deps || []).every((/** @type {string} */ d) => { const x = ctx.byId.get(d); return !x || visibleInGame(x, ctx, seen) !== false; });
}

/** Чи виконано завдання (із сейву). @param {any} t @param {boolean} qDone */
export const taskDone = (t, qDone) => qDone || (t.id && isTaskDone(t.id)) || (t.item && isItemObtained(t.item)) || (t.adv && isAdvDone(t.adv));

/** Порядок читання глави: глибина за залежностями (найдовший шлях від початку), далі — позиція в книзі (y, x). @param {any[]} qs */
export function readingOrder(qs) {
  const byId = new Map(qs.map((q) => [q.id, q])); const depth = new Map();
  /** @param {string} id @param {Set<string>} seen @returns {number} */
  const dep = (id, seen) => {
    if (depth.has(id)) return depth.get(id);
    if (seen.has(id)) return 0;
    seen.add(id);
    const ds = (byId.get(id)?.deps || []).filter((d) => byId.has(d));
    const v = ds.length ? 1 + Math.max(...ds.map((d) => dep(d, seen))) : 0;
    depth.set(id, v); return v;
  };
  for (const q of qs) dep(q.id, new Set());
  return [...qs].sort((a, b) => depth.get(a.id) - depth.get(b.id) || (a.y || 0) - (b.y || 0) || (a.x || 0) - (b.x || 0));
}


/** Текст завдання українською. @param {any} t @param {ChapterCtx} ctx */
export function taskLabel(t, ctx) {
  const n = t.count ? ` × ${t.count}` : '';
  switch (t.type) {
    case 'item': return t.opts?.length || t.tags?.length ? `${t.name || 'Будь-що з переліку'}${n}` : `${t.name || nice(t.item)}${n}`;
    case 'checkmark': return t.name ? `${t.name} (позначити галочкою)` : 'Позначити галочкою в книзі квестів';
    case 'kill': return `Перемогти: ${t.name || nice(t.entity)}${n}`;
    case 'dimension': return `Потрапити у вимір: ${t.name || ctx.dims.get(t.dim) || nice(t.dim)}`;
    case 'structure': return `Знайти структуру: ${t.name || nice(t.structure)}`;
    case 'biome': return `Відвідати біом: ${t.name || nice(t.biome)}`;
    case 'advancement': return `Досягнення: ${t.name || nice(t.adv)}`;
    case 'observation': return `Оглянути: ${t.name || 'об\'єкт'}`;
    case 'forge_energy': return `Енергія: ${t.name || 'FE'}${n}`;
    case 'xp': return `Досвід${n}`;
    default: return t.name || t.type || '?';
  }
}

/** Піктограма завдання без іконки предмета. @param {any} t */
export const taskGlyph = (t) => ({ checkmark: '☑', kill: '⚔', dimension: '🌀', structure: '🏛', biome: '🌲', advancement: '🏆', observation: '👁', forge_energy: '⚡', xp: '✨' })[t.type] || '•';

/** Картинка книги квестів (полотно глави, {image:…} в описі): [шлях, ширина, висота] або null. @param {string} ref @param {ChapterCtx} ctx */
export const imageOf = (ref, ctx) => ctx.qimages[ref] || null;
