// @ts-check
// Глава квестів: огляд путівника + два вигляди — «🕸 Схема» (як у книзі квестів, панель квесту збоку) і «📋 Список» (картки квестів у порядку проходження).
// Вигляд, вибраний квест, масштаб схеми й перемикачі зберігаються у view-state (вигляд — ще й як типовий для інших глав).
import { h, mount } from '../core/dom.js';
import { hiddenWhy } from '../core/fmt.js';
import { createQuestGraph, selectQuest, clearSelection } from '../graph/quests-cy.js';
import { modLinks } from '../components/modcard.js';
import { questDetail } from '../components/quest-card.js';
import { chapterGuide } from '../components/chapter-guide.js';
import { loadChapter, isService, questState, readingOrder, qTitle } from '../core/quests-model.js';
import { getViewState, setViewState } from '../core/view-state.js';

/** @param {HTMLElement} el @param {string[]} p @param {Store} s */
export async function render(el, [file, qid], s) {
  const ch = s.chapterByFile.get(file);
  if (!ch) { mount(el, h('div.empty', null, 'Главу не знайдено. ', h('a', { href: '#/chapters' }, 'До списку'))); return; }
  const ctx = await loadChapter(file, s);
  const key = `chapter:${file}`;
  const vs = getViewState(key, { qid: '', viewport: null, view: getViewState('chapters', { view: 'graph' }).view, svc: false, hideDone: false, names: false });   // K25: як у грі — назва лише при наведенні / виборі
  const svcN = ctx.quests.filter(isService).length;
  const visible = () => ctx.quests.filter((q) => vs.svc || !isService(q));
  const qs = visible();
  const done = qs.filter((q) => questState(q, ctx) === 'done'), started = qs.filter((q) => questState(q, ctx) === 'started');
  const setView = (/** @type {string} */ v) => { setViewState(key, { view: v }); setViewState('chapters', { view: v }); render(el, [file, vs.qid], s); };
  const toolbar = h('div.toolbar', null, h('a', { href: '#/chapters' }, '← Квести'), h('b', null, ch.title),
    h('span.small.muted', null, `${qs.length} квестів`),
    ctx.hasProg ? h('span.small', { style: { color: done.length ? 'var(--ok)' : 'var(--muted)' } }, `✔ ${done.length}/${qs.length}`,
      started.length ? h('span', { style: { color: 'var(--link)' } }, ` · ⏳ ${started.length}`) : null) : null,
    ch.hidden ? h('span.tag-hidden', { title: ctx.guide?.why || hiddenWhy(ch) }, '🚫 прихована в грі') : null,
    h('div.seg', { role: 'group', 'aria-label': 'Вигляд глави' },
      h('button' + (vs.view !== 'list' ? '.on' : ''), { type: 'button', onclick: () => setView('graph') }, '🕸 Схема'),
      h('button' + (vs.view === 'list' ? '.on' : ''), { type: 'button', onclick: () => setView('list') }, '📋 Список')),
    svcN ? h('label.small.muted.chk', { title: 'Службові квести авторів (AllRightsReserved, «NOT HERE YET») і невидимі до виконання — у грі їх не видно' },
      h('input', { type: 'checkbox', checked: vs.svc, onchange: (/** @type {any} */ e) => { setViewState(key, { svc: e.target.checked }); render(el, [file, vs.qid], s); } }),
      ` службові (${svcN})`) : null,
    vs.view !== 'list' ? h('label.small.muted.chk', { title: 'Назви квестів на схемі: усі (без накладань) або лише при наведенні — як у книзі в грі' },
      h('input', { type: 'checkbox', checked: vs.names !== false, onchange: (/** @type {any} */ e) => { setViewState(key, { names: e.target.checked }); render(el, [file, vs.qid], s); } }),
      ' назви') : null,
    modLinks(s, (ch.mods || []).filter((/** @type {string} */ m) => s.modById.has(m))));
  if (vs.view === 'list') return renderList(el, s, ch, ctx, vs, key, toolbar, qid, setView);

  el.className = 'view full';
  const side = h('aside.split-side'); const canvas = h('div.cy');
  mount(el, h('div.chapter-page', null, toolbar,
    h('div.split', null, h('div.split-main', null, canvas,
      h('div.graph-hint', null, 'Розташування — як у книзі квестів · колесо — масштаб · ',
        h('span', { style: { color: 'var(--q-hl-in)' } }, '━ потрібно'), ' / ', h('span', { style: { color: 'var(--q-hl-out)' } }, '━ відкриває'),
        ctx.hasProg ? ' · зелений ✔ — виконано, жовта рамка — доступний' : '')), side)));
  /** @param {string} id */
  const pick = (id) => { if (!selectQuest(cy, id)) clearSelection(cy); show(id); };
  /** @param {string} id */
  const show = (id) => {
    setViewState(key, { qid: id || '' }); vs.qid = id || '';
    const q = ctx.byId.get(id);
    if (!q) {
      if (location.hash !== `#/chapter/${file}`) history.replaceState(null, '', `#/chapter/${file}`);
      const lst = (/** @type {string} */ t, /** @type {any[]} */ xs, /** @type {string} */ mark) => xs.length ? [h('h4.q-sec', null, `${t} (${xs.length})`),
        h('ul.list-clean.small', null, xs.map((x) => h('li', null, h('a', { href: '#', onclick: (/** @type {Event} */ e) => { e.preventDefault(); pick(x.id); } }, `${mark} ${qTitle(x, ctx)}`))))] : null;
      mount(side, h('h2', null, ch.title), chapterGuide(s, ch, ctx.guide, { compact: true }),
        h('p.small.muted', null, 'Клікніть квест на схемі, щоб побачити опис, завдання й нагороди, або перемкніть на «📋 Список».'),
        lst('✔ Виконано у сейві', done, '✔'), lst('⏳ Розпочато у сейві', started, '⏳'));
      return;
    }
    history.replaceState(null, '', `#/chapter/${file}/${id}`);
    mount(side, h('a.small', { href: '#', onclick: (/** @type {Event} */ e) => { e.preventDefault(); clearSelection(cy); show(''); } }, '← Огляд глави'),
      questDetail(s, ctx, q, { pick }));
    side.scrollTop = 0;
  };
  const cy = createQuestGraph(canvas, ctx, { showSvc: vs.svc, names: vs.names !== false, onSelect: (id) => pick(id), initialViewport: vs.viewport,
    onViewport: (viewport) => setViewState(key, { viewport }) });
  const start = (qid && ctx.byId.has(qid)) ? qid : (vs.qid && ctx.byId.has(vs.qid) ? vs.qid : '');
  if (start) {
    pick(start);
    if (!vs.viewport) { const n = cy.getElementById(start); if (n.length) { cy.zoom(Math.max(cy.zoom(), 1.1)); cy.center(n); } }   // пряме посилання на квест — показати його зблизька
  } else show('');
}

/** Режим «Список»: огляд + картки квестів у порядку проходження.
 * @param {HTMLElement} el @param {Store} s @param {any} ch @param {import('../core/quests-model.js').ChapterCtx} ctx @param {any} vs @param {string} key
 * @param {HTMLElement} toolbar @param {string | undefined} qid @param {(v: string) => void} setView */
function renderList(el, s, ch, ctx, vs, key, toolbar, qid, setView) {
  el.className = 'view';
  const order = readingOrder(ctx.quests.filter((q) => vs.svc || !isService(q)));
  const cards = new Map();
  /** @param {string} id */
  const pick = (id) => {
    const c = cards.get(id);
    if (!c) { const q = ctx.byId.get(id); if (q && isService(q)) { setViewState(key, { svc: true, qid: id }); render(el, [ch.file, id], s); } return; }
    if (c.hidden) { setViewState(key, { hideDone: false }); vs.hideDone = false; cards.forEach((x) => { x.hidden = false; }); }
    cards.forEach((x) => x.classList.remove('sel')); c.classList.add('sel');
    c.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setViewState(key, { qid: id }); history.replaceState(null, '', `#/chapter/${ch.file}/${id}`);
  };
  const onScheme = (/** @type {string} */ id) => { setViewState(key, { qid: id, viewport: null }); setView('graph'); };
  const list = h('div.q-list', null, order.map((q, i) => {
    const st = questState(q, ctx);
    const c = h('article.card.q-card' + (st ? '.st-' + st : '') + (isService(q) ? '.svc' : ''), { id: `q-${q.id}` },
      h('span.q-num', null, String(i + 1)), questDetail(s, ctx, q, { pick, onScheme, list: true }));
    if (vs.hideDone && st === 'done') c.hidden = true;
    cards.set(q.id, c); return c;
  }));
  const nDone = order.filter((q) => questState(q, ctx) === 'done').length;
  mount(el, h('div.chapter-page.list-mode', null, toolbar,
    h('div.q-list-wrap', null,
      h('h1', null, ch.title),
      chapterGuide(s, ch, ctx.guide),
      h('div.q-list-bar', null,
        h('span.small.muted', null, `Квести в порядку проходження (за залежностями): ${order.length}`),
        ctx.hasProg && nDone ? h('label.small.chk', null, h('input', { type: 'checkbox', checked: vs.hideDone, onchange: (/** @type {any} */ e) => {
          setViewState(key, { hideDone: e.target.checked }); vs.hideDone = e.target.checked;
          order.forEach((q) => { const c = cards.get(q.id); if (c) c.hidden = e.target.checked && questState(q, ctx) === 'done'; });
        } }), ` сховати виконані (${nDone})`) : null),
      list)));
  const start = (qid && cards.has(qid)) ? qid : '';
  if (start) requestAnimationFrame(() => pick(start));
}
