// @ts-check
// views/assistant/tabs.js — вкладки сторінки «Помічник»: наступні кроки за сейвом та події/лог гри.
import { h } from '../../core/dom.js';
import { isDone, setDone } from '../../core/progress.js';
import { itemIconUrl, itemNameUk, entityNameUk, advNameUk } from '../../core/store.js';
import { buildPlayerContextPrompt } from '../../core/advisor.js';
import { stageBadge, clsBadge } from '../../components/badge.js';

/** @param {string} val @param {string} label @param {string | null} href */
export function kpi(val, label, href) {
  const inner = [h('b', null, val), h('span.small.muted', null, label)];
  return href ? h('a.ai-kpi', { href }, ...inner) : h('div.ai-kpi', null, ...inner);
}

/** Кількість зайнятих слотів у спорядженні та інвентарі (живий міст або збереження світу).
 * @param {Store} s @param {any} liveState @param {any} an */
export function countSlotItems(s, liveState, an) {
  const sl = liveState?.world?.slots || s.progress?.slots;
  if (!sl) return an.invEntries.length;
  let n = 0;
  for (const arr of [sl.hotbar, sl.inventory, sl.armor, sl.curios, sl.toolbelt]) {
    if (Array.isArray(arr)) n += arr.length;
  }
  if (sl.offHand?.id) n += 1;
  return n;
}

/** Підставляє українські назви замість випадкових сирих ID (ns:id) у тексті подій. @param {Store} s @param {string} text */
function localizeIdsInText(s, text) {
  if (!text || !text.includes(':')) return text;
  return text.replace(/\b([a-z0-9_]+:[a-z0-9_/.-]+)\b/g, (m) => {
    if (m.startsWith('http:') || m.startsWith('https:')) return m;
    if (s.names?.entities?.[m]) return entityNameUk(s, m, m);
    if (s.items?.[m] || s.names?.items?.[m] || s.progress?.items?.names?.[m]) return itemNameUk(s, m, m);
    if (s.roadmap?.adv_info?.[m]) return advNameUk(s, m);
    return m;
  });
}

/** Вкладка «🧭 Наступні кроки за сейвом». @param {Store} s @param {any} an @param {() => void} onChange */
export function renderNextTab(s, an, onChange) {
  const qi = s.roadmap.quest_info || {};
  return h('div.ai-stack', null,
    h('div.card', null,
      h('h3', null, '📊 Прогрес за етапами розвитку'),
      h('div.ai-stages-bar', null, an.stageProgress.map((/** @type {any} */ sp) => {
        const pct = sp.total ? Math.round((sp.done / sp.total) * 100) : 0;
        const isCur = sp.stage.id === an.currentStage.id;
        return h(`a.ai-st-pill${isCur ? '.cur' : ''}${sp.done === sp.total && sp.total ? '.done' : ''}`, {
          href: `#/roadmap/${sp.stage.id}`,
          title: `${sp.stage.title}: ${sp.done}/${sp.total} віх (${pct}%)`,
        },
        h('div.small', null, `${sp.stage.icon} Е${sp.stage.n}`),
        h('b', null, `${sp.done}/${sp.total}`),
        h('span.ai-st-bar', null, h('i', { style: { width: `${pct}%` } })));
      }))),

    an.nextTrunk.length ? h('div.card.ai-trunk-card', null,
      h('div.badges', null,
        h('span.badge', { style: { '--c': 'var(--accent)' } }, '⭐ Пріоритет 1 · Головний шлях (Стовбур)'),
        stageBadge(s, an.nextTrunk[0].node.stage)),
      h('h3', null, an.nextTrunk[0].node.title),
      h('p.small', null, an.nextTrunk[0].node.text),
      renderDoneByMini(s, an.nextTrunk[0].why, qi),
      h('div.ai-card-foot', null,
        h('a.btn.small.primary', { href: `#/roadmap?node=${an.nextTrunk[0].node.id}` }, 'Відкрити на карті →'),
        an.nextTrunk[0].node.chapter ? h('a.btn.small', { href: `#/chapter/${an.nextTrunk[0].node.chapter}` }, 'Глава квестів →') : null)) : null,

    an.startedQuests.length ? h('div.card', null,
      h('h3', null, `⏳ Розпочаті квести у сейві (${an.startedQuests.length})`),
      h('p.small.muted', null, 'Ці квести вже розпочаті у вашому світі — виконайте завдання, щоб закрити їх:'),
      h('div.ai-q-list', null, an.startedQuests.map((/** @type {any} */ sq) => {
        const totalT = Math.max(1, sq.tasks?.length || 0);
        const doneT = (sq.tasks || []).filter((/** @type {any} */ t) => t.done).length;
        const pct = Math.round((doneT / totalT) * 100);
        return h('div.ai-q-item', null,
          h('div.ai-q-head', null,
            h('a', { href: `#/chapter/${sq.chapter}/${sq.id}` }, h('b', null, `⏳ ${sq.title}`)),
            h('span.ai-q-meta.small.muted', null,
              h('span', null, sq.chapterTitle),
              h('span.badge.ghost', null, `${doneT}/${totalT}`))),
          h('div.ai-q-prog', null, h('i', { style: { width: `${pct}%` } })),
          h('ul.list-clean.small', null, sq.tasks.map((/** @type {any} */ t) => h('li', { class: t.done ? 'db-done' : '' },
            `${t.done ? '✔' : '○'} ${t.text}`))));
      }))) : null,

    h('div.card', null,
      h('h3', null, `🧭 Відкриті віхи розвитку (${an.availNodes.length})`),
      h('p.small.muted', null, 'Усі попередні вимоги для цих віх уже виконані — обирайте напрямок за потребою:'),
      h('div.ai-avail-list', null, an.availNodes.slice(0, 10).map((/** @type {any} */ item) => {
        const n = item.node;
        return h('div.ai-avail-item', null,
          h('div.ai-avail-top', null,
            h('div.badges', null, stageBadge(s, n.stage), n.trunk ? h('span.badge', { style: { '--c': 'var(--accent)' } }, '⭐ Стовбур') : clsBadge(s, n.lane),
              item.unlocksCount ? h('span.badge.ghost', null, `відкриває +${item.unlocksCount}`) : null),
            h('label.check.small', null,
              h('input', { type: 'checkbox', checked: isDone(n.id), onchange: (e) => { setDone(n.id, e.target.checked); onChange(); } }),
              'Зроблено')),
          h('div.ai-avail-title', null,
            h('a', { href: `#/roadmap?node=${n.id}` }, h('b', null, n.title)),
            n.icons?.length ? h('span.ai-mini-icons', null, n.icons.slice(0, 3).map((/** @type {string} */ iid) => {
              const img = itemIconUrl(s, iid);
              return img ? h('img', { src: img, alt: '', title: itemNameUk(s, iid) }) : null;
            })) : null),
          h('p.small.muted', null, n.text),
          renderDoneByMini(s, item.why, qi));
      }))),

    h('div.card', null,
      h('h3', null, '💡 Поради за вашим сейвом'),
      h('div.ai-tips-list', null, an.tips.map((/** @type {any} */ t) => h('div.ai-tip', null,
        h('div.ai-tip-h', null, `${t.icon} `, h('b', null, t.title)),
        h('p.small.muted', null, t.text),
        t.link ? h('a.small', { href: t.link }, t.linkText || 'Детальніше →') : null)))));
}

/** @param {Store} s @param {any} w @param {Record<string, any>} qi */
export function renderDoneByMini(s, w, qi) {
  if (!w) return null;
  const chips = [
    ...(w.quests || []).map((/** @type {any} */ q) => {
      const info = qi[q.id];
      return h('a.badge', {
        href: info ? `#/chapter/${info.chapter}/${q.id}` : '#/chapters',
        style: { '--c': q.done ? 'var(--ok)' : q.started ? 'var(--link)' : 'var(--muted)' },
      }, `${q.done ? '✔' : q.started ? '⏳' : '○'} Квест: ${info?.title || q.id}`);
    }),
    ...(w.advancements || []).map((/** @type {any} */ a) =>
      h('span.badge', {
        style: { '--c': a.done ? 'var(--ok)' : 'var(--muted)' },
        title: a.id,
      }, `${a.done ? '✔' : '○'} Досягнення: ${advNameUk(s, a.id)}`)),
    ...(w.items || []).map((/** @type {any} */ it) =>
      h('span.badge', {
        style: { '--c': it.done ? 'var(--ok)' : 'var(--muted)' },
        title: it.id,
      }, `${it.done ? '✔' : '○'} Предмет: ${itemNameUk(s, it.id)}`)),
  ];
  return chips.length ? h('div.badges.ai-doneby-badges', null, ...chips) : null;
}

/** Вкладка «📜 Події та лог». @param {Store} s @param {any} an @param {string} logTail @param {any} liveState @param {boolean} [liveConnected] */
export function renderLogTab(s, an, logTail, liveState, liveConnected = false) {
  const ctxText = buildPlayerContextPrompt(s, an, logTail);
  const ds = liveState?.dictStats;
  const combat = liveState?.combatRadar;
  const events = liveState?.events || [];

  const combatAlert = combat?.activeTarget
    ? {
        title: `У прицілі: ${entityNameUk(s, combat.activeTarget.id, combat.activeTarget.uk)}`,
        text: `HP: ${combat.activeTarget.health ?? '?'} / ${combat.activeTarget.maxHealth ?? '?'}`,
      }
    : combat?.lastCombat
      ? {
          title: `Останній бій (${combat.lastCombat.time || ''}): ${entityNameUk(s, combat.lastCombat.mobId, combat.lastCombat.mobUk)}`,
          text: `HP моба: ${combat.lastCombat.mobHealth ?? '?'}/${combat.lastCombat.mobMaxHealth ?? '?'}`,
        }
      : combat?.lastDeath
        ? {
            title: `Остання смерть (${combat.lastDeath.time || ''})`,
            text: combat.lastDeath.killerUk || combat.lastDeath.killerId
              ? `Від: ${entityNameUk(s, combat.lastDeath.killerId, combat.lastDeath.killerUk)}`
              : localizeIdsInText(s, combat.lastDeath.message || ''),
          }
        : null;

  const copyBtn = h('button.btn.small', {
    type: 'button',
    onclick: (/** @type {MouseEvent} */ e) => {
      e.preventDefault();
      e.stopPropagation();
      navigator.clipboard?.writeText(ctxText);
      copyBtn.textContent = '✔ Скопійовано!';
      setTimeout(() => { copyBtn.textContent = '📋 Скопіювати контекст'; }, 2500);
    },
  }, '📋 Скопіювати контекст');

  return h('div.ai-stack', null,
    h('div.card', null,
      h('div.ai-q-head', null,
        h('h3', null, '⚔️ Бойовий радар і стрічка подій у реальному часі'),
        liveConnected ? h('span.badge', { style: { '--c': 'var(--ok)' } }, '🟢 SSE Live') : h('span.badge.ghost', null, 'Очікування моста')),
      combatAlert ? h('div.ai-combat-box', null,
        h('b.ai-combat-title', null, `⚔️ ${combatAlert.title}`),
        combatAlert.text ? h('p.small.ai-combat-txt', null, combatAlert.text) : null) : null,
      events.length ? h('div.ai-events-feed', null, events.slice(0, 15).map((/** @type {any} */ ev) => {
        const isCmd = ev.type === 'chat_cmd' || ev.type === 'kubejs_cmd';
        const badgeColor = ev.type === 'death' ? 'var(--bad)' : ev.type === 'combat' ? 'var(--warn)' : isCmd ? 'var(--accent)' : ev.type === 'advancement' ? 'var(--ok)' : 'var(--link)';
        const badgeLabel = ev.type === 'death' ? '💀 Смерть' : ev.type === 'combat' ? '⚔️ Бій' : isCmd ? '💬 Чат !' : ev.type === 'advancement' ? '🏆 Досягнення' : ev.type === 'screenshot' ? '📸 Скріншот' : ev.type === 'ai' ? '🤖 ШІ' : '📡 Подія';
        const rawText = [ev.title || ev.text || '', ev.detail ? String(ev.detail).slice(0, 180) : ''].filter(Boolean).join(' — ');
        return h('div.ai-ev-row', null,
          h('span.badge', { style: { '--c': badgeColor } }, badgeLabel),
          h('span.small.ai-ev-txt', null, localizeIdsInText(s, rawText)),
          ev.time ? h('span.small.muted.ai-ev-time', null, ev.time) : null);
      }))
        : h('p.small.muted', null, 'Стрічка подій у реальному часі показує смерті від мобів, бої, здобуті досягнення, скріншоти F2 та запити з гри (!що, !клавіші, !де, !як).')),

    h('div.card', null,
      h('h3', null, '🇺🇦 База українських назв (names.json) та KubeJS-інтеграція'),
      h('p.small.muted', null,
        `Предметів і блоків: ${ds?.indexedItems ?? Object.keys(s.names?.items || {}).length} · істот: ${ds?.indexedEntities ?? Object.keys(s.names?.entities || {}).length} · клавіш: ${ds?.indexedKeys ?? Object.keys(s.names?.keys || {}).length} · вимірів: ${ds?.indexedDims ?? Object.keys(s.names?.dims || {}).length}. ` +
        'Усі назви синхронізовані з перекладом гри (ua_work/review/effective.tsv).')),

    h('details.card.ai-ctx-details', null,
      h('summary', null,
        h('span', null, '📋 Зведений контекст стану гравця (для промптів LLM)'),
        copyBtn),
      h('pre.ai-pre', null, ctxText)),

    h('div.card', null,
      h('h3', null, '📜 Останні рядки minecraft/logs/latest.log'),
      logTail
        ? h('pre.ai-pre', null, logTail)
        : h('p.small.muted', null, 'Щоб побачити свіжий latest.log у браузері, запустіть ATM11-Companion або натисніть «📂 Вказати теку гри» вгорі.')));
}

/** Короткі чіпи швидких запитів над полем вводу чату (узгоджені з ігровим HUD). @type {Array<{ label: string, query: string, kind?: 'ask'|'draft'|'f2' }>} */
export const QUICK_CHIPS = [
  { label: 'Що в руках?', query: 'Поясни українською, що зараз у мене в руках та одягнено в Curios і як цим користуватись?' },
  { label: '📦 Де в скринях?', query: '!де ', kind: 'draft' },
  { label: 'Що далі?', query: 'Що мені робити далі за моїм сейвом і які квести завершити?' },
  { label: 'Розібрати F2', query: 'Що зображено на цьому скріншоті гри ATM11? Поясни українською призначення блоків, предметів або інтерфейсу та що робити далі.', kind: 'f2' },
  { label: '⚡ Перша FE', query: 'Як отримати першу енергію FE та які генератори краще ставити?' },
  { label: '🔩 Як зробити сталь?', query: 'Як зробити сталь і чому не крафтиться сталь MFFS або Oritech?' },
  { label: '⛏ Кар’єр', query: 'Чому не крафтиться кар’єр QuarryPlus і Руйнівник чанків та чим копати руди?' },
  { label: '⭐ ATM Star', query: 'Чому не крафтиться ATM Star у цій версії і які компоненти активні?' },
];
