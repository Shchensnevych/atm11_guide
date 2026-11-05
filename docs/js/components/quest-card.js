// @ts-check
// Квест: опис, допис путівника, завдання, нагороди, залежності й стан із сейву. Один вигляд для бічної панелі схеми й для картки в режимі «Список».
import { h } from '../core/dom.js';
import { ftb } from '../core/fmt.js';
import { isQuestDone } from '../core/progress.js';
import { iconUrl, questState, taskDone, taskLabel, taskGlyph, rewardLabel, qTitle, questIconId, depsRule, visibleInGame } from '../core/quests-model.js';
import { tableView } from '../core/rewards.js';

const STATE = { done: ['✔ Виконано', 'var(--ok)'], started: ['⏳ У процесі', 'var(--link)'], avail: ['● Доступний', 'var(--accent)'], locked: ['🔒 Спершу попередні', 'var(--muted)'],
  early: ['◐ Можна заздалегідь', 'var(--link)'] };
const VIS = { deps_visible: 'У книзі з\'являється, коли видно попередні квести', deps_complete: 'У книзі з\'являється лише після виконання попередніх квестів' };

/** Іконка предмета або піктограма. @param {string | null | undefined} id @param {import('../core/quests-model.js').ChapterCtx} ctx @param {string} [glyph] @param {string} [cls] */
export function qIcon(id, ctx, glyph = '•', cls = '') {
  const url = iconUrl(id || undefined, ctx.qicons);
  return h('span.q-ic' + cls, { title: id || '' }, url ? h('img', { src: url, alt: '', loading: 'lazy' }) : h('span.q-gl', null, glyph));
}

/** Посилання на квест (у цій главі — вибір, в іншій — перехід). @param {string} id @param {import('../core/quests-model.js').ChapterCtx} ctx @param {(id: string) => void} pick */
function qLink(id, ctx, pick) {
  const q = ctx.byId.get(id); const done = ctx.hasProg && isQuestDone(id);
  if (q) return h('a.q-link', { href: '#', onclick: (/** @type {Event} */ e) => { e.preventDefault(); pick(id); } },
    qIcon(questIconId(q, ctx), ctx, q.missing?.length ? '∅' : q.tasks?.[0] ? taskGlyph(q.tasks[0]) : '•', '.sm'), done ? '✔ ' : '', qTitle(q, ctx));
  const x = ctx.ext[id];
  return h('a.q-link', { href: x ? `#/chapter/${x.c}/${id}` : '#/chapters' }, qIcon(x?.icon, ctx, '↗', '.sm'), done ? '✔ ' : '',
    x ? `${x.t || id} ` : `інша глава (${id})`, x ? h('span.muted.small', null, '↗ інша глава') : null);
}

/**
 * @param {Store} s @param {import('../core/quests-model.js').ChapterCtx} ctx @param {any} q
 * @param {{ pick: (id: string) => void, onScheme?: (id: string) => void, list?: boolean }} o
 */
export function questDetail(s, ctx, q, o) {
  const st = questState(q, ctx); const qDone = st === 'done';
  const note = ctx.notes[q.id];
  const unl = ctx.unlocks.get(q.id) || [];
  const head = h('div.q-head', null, qIcon(questIconId(q, ctx), ctx, q.missing?.length ? '∅' : q.tasks?.[0] ? taskGlyph(q.tasks[0]) : '•', '.lg'),
    h('div.q-title', null,
      h(o.list ? 'h3' : 'h2', null, qTitle(q, ctx)),
      q.sub ? h('div.muted.small', null, q.sub) : null,
      h('div.badges', null,
        st ? h('span.badge', { style: { '--c': STATE[st][1] } }, STATE[st][0] + (st === 'done' || st === 'started' ? ` у сейві «${s.progress?.world || ''}»` : '')) : null,
        q.optional ? h('span.badge.ghost', null, 'необов\'язковий') : null,
        q.inv ? h('span.badge.ghost', { title: 'У книзі квест невидимий, доки його не виконано' }, '👻 невидимий') : null,
        q.arr ? h('span.badge.ghost', null, 'службовий') : null,
        q.vis ? h('span.badge.ghost', { title: VIS[q.vis] }, visibleInGame(q, ctx) === false ? '👁 у грі поки не видно' : '👁 з\'являється не одразу') : null,
        q.hdet ? h('span.badge.ghost', { title: 'У книзі опис і завдання приховано, доки квест не стане доступним' }, 'деталі — після попередніх') : null,
        o.onScheme ? h('a.badge.ghost', { href: '#', onclick: (/** @type {Event} */ e) => { e.preventDefault(); o.onScheme?.(q.id); } }, '🕸 на схемі') : null)));
  return [
    head,
    q.desc ? h('div.ftb', { html: ftb(q.desc, ctx.qimages) }) : null,
    note?.text ? h('div.q-note', null, h('div.q-note-h', null, '📝 Допис путівника', note.verify ? h('span.verify', { title: 'Не підтверджено даними збірки' }, ' ⚑ чернетка') : null),
      h('div', null, note.text)) : null,
    !q.desc && !note?.text ? h('p.small.muted', null, 'У книзі квестів опису немає.') : null,
    q.tasks?.length ? [h('h4.q-sec', null, 'Завдання'), h('ul.q-tasks', null, q.tasks.map((t) => {
      const d = taskDone(t, qDone);
      return h('li' + (d ? '.ok' : ''), null, qIcon(t.icon, ctx, taskGlyph(t), '.sm'), h('span', null, d ? '✔ ' : '', taskLabel(t, ctx),
        t.comp ? h('span.muted.small', null, ` (${t.comp})`) : null,
        t.opt ? h('span.muted.small', null, ' (необов\'язкове)') : null,
        t.consume ? h('span.muted.small', { title: 'Предмети забираються з інвентаря під час здачі' }, ' — забирається') : null),
        t.opts?.length || t.tags?.length ? h('div.q-opts', null, 'будь-що з: ', (t.opts || []).map((x) => h('span.q-opt', { title: x.id }, qIcon(x.id, ctx, '•', '.sm'), x.name || x.id.split(':')[1])),
          (t.tags || []).map((x) => h('span.q-opt', null, x.startsWith('@') ? `увесь мод ${x.slice(1)}` : `тег ${x.slice(1)}`))) : null);
    }))] : null,
    q.rw?.length ? [h('h4.q-sec', null, 'Нагороди'), h('div.q-rw', null, q.rw.map((r) => {
      const L = rewardLabel(r);
      return h('span.q-chip', null, L.icon ? qIcon(L.icon, ctx, '🎁', '.sm') : h('span.q-gl', null, L.glyph), L.text);
    })), q.rw.filter((r) => r.tid && ctx.tables[r.tid]).map((r) => tableBox(r, ctx))] : null,
    q.flex && q.deps?.length ? h('p.small.muted', null, 'Гнучкий режим глави: завдання можна виконувати до попередніх квестів, квест зарахується, коли їх буде виконано.') : null,
    q.deps?.length ? [h('h4.q-sec', null, depsRule(q)),
      h('div.q-links', null, q.deps.map((d) => qLink(d, ctx, o.pick)))] : null,
    unl.length ? [h('h4.q-sec', null, 'Відкриває'), h('div.q-links', null, unl.map((d) => qLink(d, ctx, o.pick)))] : null,
    q.missing?.length ? h('p.small', { style: { color: 'var(--bad)' } }, `⚠ Квест-заглушка: потрібні предмети модів, яких немає в збірці (${q.missing.join(', ')}). Виконати його не вийде.`) : null,
  ];
}

/** Що може випасти з таблиці нагород (reward_tables): шанс — вага / сума ваг (core/rewards.js — спільний з мостом компаньйона). @param {any} r @param {import('../core/quests-model.js').ChapterCtx} ctx */
function tableBox(r, ctx) {
  const v = tableView(r, ctx.tables[r.tid]);
  return h('details.q-table', null, h('summary.small', null, v.head),
    h('ul.q-tasks.small', null, v.items.map((x) => h('li' + (x.miss ? '.muted' : ''), null,
      x.xp ? h('span.q-gl', null, '✨') : qIcon(x.item, ctx, x.miss ? '∅' : '🎁', '.sm'),
      x.label,
      x.chance !== null ? h('span.muted', null, ` — ${x.chance}%`) : null,
      x.miss ? h('span.muted', null, ' (мода немає в збірці)') : null))));
}
