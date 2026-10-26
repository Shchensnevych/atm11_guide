// @ts-check
// Глави квестів за групами (як у книзі квестів) з позначками прогресу із сейву. Приховані глави — для модів, яких у цій версії збірки ще немає.
import { h, mount } from '../core/dom.js';
import { modLogo } from '../components/modcard.js';

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export function render(el, _p, s) {
  const { groups, chapters } = s.chapters;
  const p = s.progress;
  const byCh = p?.quests?.by_chapter || {};
  const totalDone = p?.quests?.done?.length || 0;
  const totalStarted = p?.quests?.started?.length || 0;
  const modeUk = p?.mode_uk || p?.mode || '';
  const byGroup = (g) => chapters.filter((c) => (c.group || '') === g);
  const card = (c) => {
    const m = c.mods?.map((x) => s.modById.get(x)).find(Boolean);
    const cp = byCh[c.file];
    const done = cp?.done?.length || 0, started = cp?.started?.length || 0;
    return h('a.card.chapter-card' + (done ? '.ch-done' : started ? '.ch-part' : ''), { href: `#/chapter/${c.file}` },
      m ? modLogo(m) : h('div.mod-logo', null, '📜'),
      h('div.chapter-body', null, h('h3', null, c.title),
        c.sub ? h('div.small.muted', null, c.sub) : null,
        h('div.small', null,
          `квестів: ${c.quests}`,
          done ? h('span.q-ok', null, ` · ✔ виконано: ${done}/${c.quests}`) : null,
          started ? h('span.q-part', null, ` · ⏳ у процесі: ${started}`) : null,
          c.hidden ? h('span.tag-hidden', null, ' · прихована в грі') : null)));
  };
  mount(el, h('h1', null, 'Квести'),
    h('p.muted', null, 'Глави з книги квестів збірки, українською. «Прихована в грі» — глава для модів, яких у цій версії ATM11 ще немає (або вона в розробці).'),
    p && p.slug ? h('div.card.small', { style: { marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' } },
      h('span', null, `💾 Світ «${p.world}» (${modeUk}, знято ${p.updated}): виконано квестів `),
      h('b', { style: { color: 'var(--ok)' } }, String(totalDone)),
      totalStarted ? h('span', { style: { color: 'var(--link)' } }, ` · розпочато ${totalStarted}`) : null,
      h('span.muted', null, ` · активних глав: ${Object.keys(byCh).length}`)) : null,
    [...groups.map((g) => [h('h2.section', null, g.title), h('div.grid', null, byGroup(g.id).map(card))]),
      byGroup('').length ? [h('h2.section', null, 'Інше'), h('div.grid', null, byGroup('').map(card))] : null]);
}
