// @ts-check
// Глави квестів за групами (як у книзі квестів) з позначками прогресу із сейву. Приховані глави — для модів, яких у цій версії збірки ще немає.
import { h, mount } from '../core/dom.js';
import { modLogo } from '../components/modcard.js';
import { hiddenWhy } from '../core/fmt.js';
import { getJSON } from '../core/store.js';

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export async function render(el, _p, s) {
  const { groups, chapters } = s.chapters;
  const guide = s.guide || {};
  const qicons = new Set(await getJSON('data/qicons.json').catch(() => []));      // іконка глави — як у книзі квестів
  const chIcon = (/** @type {any} */ c) => c.icon && qicons.has(c.icon) ? h('img.mod-logo.ch-ic', { src: `img/items/${c.icon.replace(':', '/')}.png`, alt: '', loading: 'lazy' }) : null;
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
    const g = guide[c.file];
    const total = c.quests - (c.service || 0);

    let badge = null;
    if (c.hidden) {
      badge = h('span.ch-badge.ch-badge-hidden', null,
        h('span.ch-badge-ic', { html: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>' }),
        'прихована в грі'
      );
    } else if (done > 0 && done === total) {
      badge = h('span.ch-badge.ch-badge-done', null,
        h('span.ch-badge-ic', { html: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' }),
        `виконано: ${done}/${total}`
      );
    } else if (done > 0) {
      badge = h('span.ch-badge.ch-badge-part', null,
        h('span.ch-badge-ic', { html: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' }),
        `у процесі: ${done}/${total}`
      );
    } else if (started > 0) {
      badge = h('span.ch-badge.ch-badge-part', null,
        h('span.ch-badge-ic', { html: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' }),
        `у процесі: ${started}`
      );
    }

    const stateClass = (done === total && total > 0) ? '.ch-done' : (done > 0 || started > 0) ? '.ch-part' : '';

    return h('a.card.chapter-card' + stateClass,
      { href: `#/chapter/${c.file}`, title: c.hidden ? (g?.why || hiddenWhy(c)) : null },
      h('div.chapter-main', null,
        h('div.chapter-head', null,
          chIcon(c) || (m ? modLogo(s, m) : h('div.mod-logo', null, '📜')),
          h('div.chapter-title-wrap', null,
            h('h3.chapter-title', null, c.title),
            c.sub ? h('div.chapter-sub', null, c.sub) : null
          )
        ),
        h('div.chapter-divider'),
        (g?.ov || g?.why) ? h('div.cg-snip', null, c.hidden ? (g.why || '') : g.ov) : null,
        badge ? h('div.chapter-badge-wrap', null, badge) : null
      ),
      h('div.chapter-stat', null,
        h('div.chapter-count-num', null, String(total)),
        h('div.chapter-count-lbl', null, 'квестів')
      )
    );
  };
  mount(el, h('h1', null, 'Квести'),
    h('p.muted', null, 'Глави з книги квестів збірки, українською: огляд путівника, схема як у книзі і список квестів підряд. «Прихована в грі» — глава, яку автори ще не відкрили (здебільшого — моди, яких у цій версії ATM11 ще немає); причина — у підказці й на сторінці глави.'),
    p && p.slug ? h('div.card.small', { style: { marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' } },
      h('span', null, `💾 Світ «${p.world}» (${modeUk}, знято ${p.updated}): виконано квестів `),
      h('b', { style: { color: 'var(--ok)' } }, String(totalDone)),
      totalStarted ? h('span', { style: { color: 'var(--link)' } }, ` · розпочато ${totalStarted}`) : null,
      h('span.muted', null, ` · активних глав: ${Object.keys(byCh).length}`)) : null,
    [...groups.map((g) => [h('h2.section', null, g.title), h('div.grid.chapters-grid', null, byGroup(g.id).map(card))]),
      byGroup('').length ? [h('h2.section', null, 'Інше'), h('div.grid.chapters-grid', null, byGroup('').map(card))] : null]);
}
