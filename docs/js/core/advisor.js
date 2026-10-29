// @ts-check
// Інтерактивний радник «Наступні кроки за сейвом» та аналізатор стану гравця для ШІ-помічника.
// Працює миттєво в браузері без зовнішніх API, спираючись на progress.json (або обрану теку гри), roadmap.json, mods.json і quests/*.json.
import { isDone, isAutoDone, isManualDone, whyDone, isTaskDone, isItemObtained, isAdvDone } from './progress.js';
import { computeStates, lineage } from '../graph/tree-state.js';
import { quests as loadChapterQuests } from './store.js';

const WORLD_TIERS_UK = /** @type {Record<string, string>} */ ({
  haven: 'Гавань (початковий)',
  frontier: 'Рубіж (II)',
  ascent: 'Сходження (III)',
  summit: 'Вершина (IV)',
  pinnacle: 'Пік (V)',
});

// Ванільні виміри; модові додаються з даних путівника (mods.json → dims) на початку analyzePlayerState
const DIMS_UK = /** @type {Record<string, string>} */ ({
  'minecraft:overworld': 'Верхній світ',
  'minecraft:the_nether': 'Незер',
  'minecraft:the_end': 'Енд',
});

/** Аналізує поточний сейв і дорожню карту, повертаючи пріоритетні наступні кроки, незавершені квести й поради.
 * @param {Store} s */
export async function analyzePlayerState(s) {
  for (const m of s.mods || []) for (const d of m.dims || []) if (d.id && d.name && !DIMS_UK[d.id]) DIMS_UK[d.id] = d.name;
  const p = s.progress;
  const nodes = s.roadmap.nodes || [];
  const edges = s.roadmap.edges || [];
  const states = computeStates(nodes, edges, isDone);
  const stageOrder = new Map(s.stages.map((st, idx) => [st.id, idx]));

  const doneNodes = [];
  const availNodes = [];
  const lockedNodes = [];

  for (const n of nodes) {
    const st = states.get(n.id) || 'locked';
    const lin = lineage(n.id, edges);
    const w = whyDone(n);
    const hasPartial = w.quests.some((q) => q.started || q.done) || w.items.some((i) => i.done) || w.advancements.some((a) => a.done);
    const info = {
      node: n,
      state: st,
      why: w,
      hasPartial,
      unlocksCount: lin.down.size,
      stageIdx: stageOrder.get(n.stage) ?? 99,
      stageDef: s.stageById.get(n.stage),
    };
    if (st === 'done') doneNodes.push(info);
    else if (st === 'avail') availNodes.push(info);
    else if (st !== 'na') lockedNodes.push(info);                     // na — «у цій версії недоступно», не радимо
  }

  // 1. Головний шлях (стовбур): наступна доступна або перша невиконана віха стовбура
  const trunkAll = nodes
    .filter((n) => n.trunk)
    .map((n) => availNodes.find((x) => x.node.id === n.id) || lockedNodes.find((x) => x.node.id === n.id) || doneNodes.find((x) => x.node.id === n.id))
    .filter(Boolean);
  const nextTrunk = trunkAll.filter((x) => x && x.state !== 'done');
  const currentStageId = nextTrunk[0]?.node.stage || availNodes[0]?.node.stage || 's0';
  const currentStage = s.stageById.get(currentStageId) || s.stages[0];
  const curStageIdx = stageOrder.get(currentStageId) ?? 0;

  // 2. Сортуємо доступні віхи: спершу стовбур, потім розпочаті (hasPartial), далі близькі до поточного етапу та ті, що відкривають найбільше гілок
  availNodes.sort((a, b) => {
    if (!!a.node.trunk !== !!b.node.trunk) return a.node.trunk ? -1 : 1;
    if (a.hasPartial !== b.hasPartial) return a.hasPartial ? -1 : 1;
    const da = Math.max(0, a.stageIdx - curStageIdx);
    const db = Math.max(0, b.stageIdx - curStageIdx);
    if (da !== db) return da - db;
    if (a.stageIdx !== b.stageIdx) return a.stageIdx - b.stageIdx;
    return b.unlocksCount - a.unlocksCount;
  });

  // 3. Деталі розпочатих у сейві квестів (підвантажуємо активні глави)
  /** @type {Array<{ id: string, title: string, chapter: string, chapterTitle: string, tasks: Array<{ text: string, done: boolean, item?: string }> }>} */
  const startedQuests = [];
  if (p?.quests?.by_chapter) {
    const activeChapters = Object.entries(p.quests.by_chapter).filter(([, v]) => (v.started || []).length > 0);
    const loaded = await Promise.all(activeChapters.map(async ([fn, v]) => {
      const chData = await loadChapterQuests(fn).catch(() => null);
      return { fn, startedIds: v.started || [], chData };
    }));
    for (const { fn, startedIds, chData } of loaded) {
      if (!chData?.quests) continue;
      const chTitle = s.chapterByFile.get(fn)?.title || fn;
      const byId = new Map(chData.quests.map((/** @type {any} */ q) => [q.id, q]));
      for (const qid of startedIds) {
        const q = byId.get(qid);
        if (!q) continue;
        const tasks = (q.tasks || []).map((/** @type {any} */ t) => {
          const tDone = (t.id && isTaskDone(t.id)) || (t.item && isItemObtained(t.item)) || (t.adv && isAdvDone(t.adv));
          const rawName = t.name
            || (t.item && (s.items[t.item]?.uk || s.items[t.item]?.en || t.item))
            || (t.dim && `Вимір: ${DIMS_UK[t.dim] || t.dim}`)
            || (t.adv && `Досягнення: ${t.adv}`)
            || (t.type === 'advancement' ? 'Виконати досягнення мода' : t.type === 'checkmark' ? 'Поставити галочку в книзі квестів' : (t.entity || t.type || 'Завдання'));
          const label = `${rawName}${t.count ? ` × ${t.count}` : ''}`;
          return { text: label, done: !!tDone, item: t.item };
        });
        startedQuests.push({ id: qid, title: q.title || qid, chapter: fn, chapterTitle: chTitle, tasks });
      }
    }
  }

  // 4. Предмети в інвентарі та скрафчені з назвами й іконками
  const invEntries = Object.entries(p?.items?.inventory || {}).map(([id, count]) => ({
    id,
    count,
    meta: s.items[id] || null,
    name: s.items[id]?.uk || s.items[id]?.en || id,
  })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'uk'));

  const craftedEntries = Object.entries(p?.items?.crafted || {}).map(([id, count]) => ({
    id,
    count,
    meta: s.items[id] || null,
    name: s.items[id]?.uk || s.items[id]?.en || id,
  })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'uk'));

  // 5. Персональні поради на основі стану сейву
  /** @type {Array<{ icon: string, title: string, text: string, link?: string, linkText?: string }>} */
  const tips = [];
  const obt = new Set(p?.items?.obtained || []);

  const hasBackpack = [...obt].some((i) => i.startsWith('sophisticatedbackpacks:'));
  if (!hasBackpack) {
    tips.push({
      icon: '🎒',
      title: 'Скрафтіть ранець Sophisticated Backpacks',
      text: 'На старті інвентар швидко забивається. Базовий ранець крафтиться зі шкіри, ниток і скрині, відкривається клавішею «Миша 4» і приймає покращення автопідбору й магніту.',
      link: '#/mod/sophisticatedbackpacks',
      linkText: 'Мод Sophisticated Backpacks →',
    });
  }

  const tier = p?.player?.world_tier || 'haven';
  if (tier === 'haven' && (p?.quests?.done || []).includes('196312DF0D2E2CB6')) {
    tips.push({
      icon: '⚔️',
      title: 'Світовий рівень Apotheosis: Гавань (Haven)',
      text: 'Ви вже відкрили квест «Загарбники/боси і світові рівні». Коли здобудете базову броню, перевірте меню світових рівнів (Ctrl+T), щоб переходити на вищі рівні заради кращого луту й самоцвітів.',
      link: '#/chapter/apotheosis_gear/196312DF0D2E2CB6',
      linkText: 'Квест Apotheosis →',
    });
  }

  const foods = p?.player?.unique_foods ?? 0;
  if (foods < 10) {
    tips.push({
      icon: '🥕',
      title: `Різноманітне харчування (скуштовано страв: ${foods})`,
      text: 'Мод Spice of Life: Carrot Edition дає додаткові постійні серця здоров’я за куштування нових видів їжі.',
      link: '#/roadmap?node=f_food',
      linkText: 'Віха «Фермерство й їжа» →',
    });
  }

  if (invEntries.some((x) => x.id === 'auroral:guide')) {
    tips.push({
      icon: '📖',
      title: 'Путівник Auroral у вашому інвентарі',
      text: 'У вас у сумці лежить «Путівник по сяйву» (auroral:guide). Мод Auroral додає холодні біоми, мобів та спорядження — зазирніть у главу квестів Auroral або покладіть книгу на полицю.',
      link: '#/chapter/auroral',
      linkText: 'Глава Auroral →',
    });
  }

  tips.push({
    icon: '⌨️',
    title: 'Корисні клавіші збірки (без конфліктів)',
    text: 'Книга квестів — Ctrl+Q · Ранець — Миша 4 · Слот Curios — Shift+Миша 4 · Пояс інструментів — Ctrl+V · Маршрутна точка карти — Ctrl+B · Шейдери — F8.',
    link: '#/keys',
    linkText: 'Інтерактивна клавіатура →',
  });

  // Прогрес по кожному етапу
  const stageProgress = s.stages.map((st) => {
    const stNodes = nodes.filter((n) => n.stage === st.id);
    const doneCnt = stNodes.filter((n) => isDone(n.id)).length;
    const autoCnt = stNodes.filter((n) => isAutoDone(n.id)).length;
    return { stage: st, total: stNodes.length, done: doneCnt, auto: autoCnt };
  });

  return {
    world: p,
    currentStage,
    doneNodes,
    availNodes,
    lockedNodes,
    nextTrunk,
    startedQuests,
    invEntries,
    craftedEntries,
    tips,
    stageProgress,
    worldTierUk: WORLD_TIERS_UK[tier] || tier,
    dimUk: DIMS_UK[p?.player?.dimension || 'minecraft:overworld'] || (p?.player?.dimension || 'Верхній світ'),
  };
}

/** Формує стислий текстовий контекст стану гравця для LLM-пайплайну або експорту.
 * @param {Store} s @param {Awaited<ReturnType<typeof analyzePlayerState>>} an @param {string} [logTail] */
export function buildPlayerContextPrompt(s, an, logTail = '') {
  const p = an.world;
  if (!p || !p.slug) {
    return 'Сейв гравця не завантажено (початковий стан збірки ATM11 26.1.2).';
  }
  const lines = [
    `=== СТАН СВІТУ ГРАВЦЯ (ATM11 26.1.2) ===`,
    `Світ: «${p.world}» (${p.mode_uk || p.mode}) | Час у грі: ${p.play_hours || 0} год | Остання гра: ${p.last_played}`,
    `Гравець: ${p.player?.name || 'Гравець'} | Рівень XP: ${p.player?.xp_level ?? 0} | Вимір: ${an.dimUk} | Світовий рівень Apotheosis: ${an.worldTierUk} | Унікальних страв: ${p.player?.unique_foods ?? 0}`,
    `Прогрес на дорожній карті: виконано ${an.doneNodes.length}/${s.roadmap.nodes.length} віх (з сейву: ${an.doneNodes.filter((x) => isAutoDone(x.node.id)).length}, вручну: ${an.doneNodes.filter((x) => isManualDone(x.node.id)).length}), зараз відкрито (доступно): ${an.availNodes.length} віх.`,
    `Поточний етап: Етап ${an.currentStage.n} «${an.currentStage.title}» (${an.currentStage.goal}).`,
    `Виконані віхи: ${an.doneNodes.map((x) => `${x.node.title} [${x.node.id}]`).join(', ') || 'ще немає'}.`,
    `Наступні віхи головного шляху (стовбур): ${an.nextTrunk.slice(0, 3).map((x) => `${x.node.title} (${x.node.stage}: ${x.node.text})`).join(' -> ') || 'усі виконано'}.`,
    `Найкращі відкриті віхи зараз: ${an.availNodes.slice(0, 8).map((x) => `${x.node.title} [${x.node.stage}, модів: ${(x.node.mods || []).join('/')}]`).join('; ')}.`,
    `Квести у сейві: виконано ${p.quests?.done?.length || 0}, розпочато ${an.startedQuests.length}.`,
  ];
  if (an.startedQuests.length) {
    lines.push(`Розпочаті квести: ${an.startedQuests.map((q) => `«${q.title}» (глава ${q.chapterTitle}; завдання: ${q.tasks.map((t) => `${t.done ? '✔' : '○'} ${t.text}`).join(', ')})`).join(' | ')}.`);
  }
  if (an.invEntries.length) {
    lines.push(`Інвентар гравця: ${an.invEntries.slice(0, 20).map((i) => `${i.name} (${i.id}) ×${i.count}`).join(', ')}.`);
  }
  if (an.craftedEntries.length) {
    lines.push(`Уже скрафчено: ${an.craftedEntries.slice(0, 15).map((i) => `${i.name} ×${i.count}`).join(', ')}.`);
  }
  if (logTail && logTail.trim()) {
    lines.push(`Останні рядки logs/latest.log:\n${logTail.trim().split('\n').slice(-15).join('\n')}`);
  }
  return lines.join('\n');
}
