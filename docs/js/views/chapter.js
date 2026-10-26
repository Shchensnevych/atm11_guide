// @ts-check
// Глава квестів: граф (як у книзі квестів) + панель квесту з описом, завданнями, залежностями та станом із сейву.
import { h, mount } from '../core/dom.js';
import { quests as loadQuests } from '../core/store.js';
import { ftb, hiddenWhy } from '../core/fmt.js';
import { createQuestGraph } from '../graph/quests-cy.js';
import { modLinks } from '../components/modcard.js';
import { isQuestDone, isQuestStarted, isTaskDone, isItemObtained, isAdvDone } from '../core/progress.js';
import { getViewState, setViewState } from '../core/view-state.js';

/** @param {HTMLElement} el @param {string[]} p @param {Store} s */
export async function render(el, [file, qid], s) {
  const ch = s.chapterByFile.get(file);
  if (!ch) { mount(el, h('div.empty', null, 'Главу не знайдено. ', h('a', { href: '#/chapters' }, 'До списку'))); return; }
  const data = await loadQuests(file); const qs = data.quests; const byId = new Map(qs.map((q) => [q.id, q]));
  const stateKey = `chapter:${file}`;
  const saved = getViewState(stateKey, { qid: '', viewport: null });
  const activeQid = (qid && byId.has(qid)) ? qid : (saved.qid && byId.has(saved.qid) ? saved.qid : '');
  const doneQs = qs.filter((q) => isQuestDone(q.id));
  const startedQs = qs.filter((q) => !isQuestDone(q.id) && isQuestStarted(q.id));
  el.className = 'view full';
  const side = h('aside.split-side'); const canvas = h('div.cy');
  mount(el, h('div', { style: { display: 'flex', flexDirection: 'column', width: '100%' } },
    h('div.toolbar', null, h('a', { href: '#/chapters' }, '← Квести'), h('b', null, ch.title),
      h('span.small.muted', null, `${qs.length} квестів`),
      s.progress?.slug ? h('span.small', { style: { color: doneQs.length ? 'var(--ok)' : 'var(--muted)' } },
        `✔ виконано: ${doneQs.length}/${qs.length}`,
        startedQs.length ? h('span', { style: { color: 'var(--link)' } }, ` · ⏳ у процесі: ${startedQs.length}`) : null) : null,
      ch.hidden ? h('span.tag-hidden', { title: hiddenWhy(ch) }, 'прихована в грі' + (ch.missing?.length ? ` — модів немає в збірці: ${ch.missing.join(', ')}` : '')) : null,
      modLinks(s, (ch.mods || []).filter((m) => s.modById.has(m)))),
    h('div.split', null, h('div.split-main', null, canvas, h('div.graph-hint', null, 'Розташування — як у книзі квестів · зелений = виконано, блакитний = у процесі')), side)));
  const pick = (id) => {
    cy.$(':selected').unselect();
    const node = cy.getElementById(id);
    if (node && node.length) {
      node.select();
      cy.edges().removeClass('hl');
      node.connectedEdges().addClass('hl');
    }
    show(id);
  };
  const show = (id) => {
    setViewState(stateKey, { qid: id || '' });
    const q = byId.get(id);
    if (!q) {
      mount(side,
        h('h2', null, ch.title),
        ch.sub ? h('p.muted', null, ch.sub) : null,
        h('p', null, 'Клікніть квест на схемі, щоб переглянути опис і завдання.'),
        doneQs.length ? [
          h('h3.section', null, `✔ Виконано у сейві (${doneQs.length})`),
          h('ul.list-clean.small', null, doneQs.map((x) => h('li', null,
            h('a', { href: '#', onclick: (e) => { e.preventDefault(); pick(x.id); } }, `✔ ${x.title || x.id}`)))),
        ] : null,
        startedQs.length ? [
          h('h3.section', null, `⏳ Розпочато у сейві (${startedQs.length})`),
          h('ul.list-clean.small', null, startedQs.map((x) => h('li', null,
            h('a', { href: '#', onclick: (e) => { e.preventDefault(); pick(x.id); } }, `⏳ ${x.title || x.id}`)))),
        ] : null);
      return;
    }
    history.replaceState(null, '', `#/chapter/${file}/${id}`);
    const qDone = isQuestDone(q.id), qStarted = !qDone && isQuestStarted(q.id);
    mount(side,
      qDone ? h('div.badges', null, h('span.badge', { style: { '--c': 'var(--ok)' } }, `✔ Виконано у сейві «${s.progress?.world || ''}»`))
        : qStarted ? h('div.badges', null, h('span.badge', { style: { '--c': 'var(--link)' } }, `⏳ Розпочато у сейві «${s.progress?.world || ''}»`)) : null,
      h('h2', { style: { marginTop: qDone || qStarted ? '8px' : '0' } }, q.title || '(без назви)'),
      q.sub ? h('p.muted', null, q.sub) : null,
      q.desc ? h('div.ftb', { html: ftb(q.desc) }) : null,
      q.tasks?.length ? [h('h3.section', null, 'Завдання'), h('ul', null, q.tasks.map((t) => {
        const tDone = qDone || (t.id && isTaskDone(t.id)) || (t.item && isItemObtained(t.item)) || (t.adv && isAdvDone(t.adv));
        return h('li', { style: tDone ? { color: 'var(--ok)' } : undefined },
          tDone ? '✔ ' : '',
          `${t.name || t.item || t.entity || t.dim || t.type}`,
          t.count ? ` × ${t.count}` : '',
          t.item ? h('code.small', { style: { marginLeft: '6px' } }, t.item) : null);
      }))] : null,
      q.deps?.length ? [h('h3.section', null, 'Потрібно спершу'), h('ul', null, q.deps.map((d) => {
        const dDone = isQuestDone(d);
        return h('li', null,
          dDone ? '✔ ' : '',
          byId.has(d) ? h('a', { href: '#', onclick: (e) => { e.preventDefault(); pick(d); } }, byId.get(d).title || d) : `інша глава (${d})`);
      }))] : null,
      q.optional ? h('p.small.muted', null, 'Необов\'язковий квест') : null,
      q.missing?.length ? h('p.small', { style: { color: 'var(--bad)' } }, `⚠ Квест-заглушка: потрібні предмети модів, яких немає в збірці (${q.missing.join(', ')}). Виконати його не вийде.`) : null);
  };
  const cy = createQuestGraph(canvas, qs, show, {
    initialViewport: saved.viewport,
    onViewport: (viewport) => setViewState(stateKey, { viewport }),
  });
  if (activeQid) pick(activeQid); else show('');
}
