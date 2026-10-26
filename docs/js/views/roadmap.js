// @ts-check
// Дорожня карта v2: вигляди «Дерево» / «За модами», пошук мода, бічна панель віхи з позначкою «зроблено».
// Маршрути: #/roadmap · #/roadmap/s2 (етап) · ?view=mods · ?mod=<id> (підсвітити мод) · ?node=<id> (відкрити віху).
// Зберігає позицію та масштаб полотна, вибрану віху, режим і активні фільтри при переходах на картки модів і глави квестів.
import { h, mount } from '../core/dom.js';
import { createTreeView } from '../graph/tree-view.js';
import { isDone, setDone, countDone, countAutoDone, whyDone } from '../core/progress.js';
import { stageBadge, clsBadge } from '../components/badge.js';
import { featuresOf, featRow, clsIcon } from '../components/feat.js';
import { spoiler } from '../components/spoiler.js';
import { getViewState, setViewState } from '../core/view-state.js';

/** @param {HTMLElement} el @param {string[]} p @param {Store} s */
export async function render(el, [stageId], s) {
  el.className = 'view full';
  const q = new URLSearchParams(location.hash.split('?')[1] || '');
  const saved = getViewState('roadmap', {
    mode: 'tree',
    transforms: { tree: null, mods: null },
    sel: '',
    search: '',
    cls: [],
    feat: [],
    hiddenEdges: [],
  });
  const mode = q.get('view') === 'mods' ? 'mods' : q.get('view') === 'tree' ? 'tree' : (saved.mode === 'mods' ? 'mods' : 'tree');
  setViewState('roadmap', { mode });

  const side = h('aside.split-side'); const canvas = h('div.tv-host'); const prog = h('span.small.muted'); const legendBox = h('div.rm-legend');
  const ids = s.roadmap.nodes.map((n) => n.id);
  const upd = () => {
    const auto = countAutoDone(ids);
    prog.textContent = `зроблено ${countDone(ids)} / ${ids.length}${auto ? ` (з сейву: ${auto})` : ''}`;
  };
  const onMap = [...new Set(s.roadmap.nodes.flatMap((n) => n.mods || []))].map((id) => s.modById.get(id)).filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'));

  const hasExplicitTarget = Boolean(stageId || q.get('mod') || q.get('node'));
  const flt = {
    cls: new Set(hasExplicitTarget ? [] : (saved.cls || [])),
    feat: new Set(hasExplicitTarget ? [] : (saved.feat || [])),
  };

  const search = /** @type {HTMLInputElement} */ (h('input', {
    type: 'search',
    list: 'rm-mods',
    value: hasExplicitTarget ? '' : String(saved.search || ''),
    placeholder: 'Знайти мод на карті…',
    style: { minWidth: '220px' },
    onchange: (e) => pickMod(e.target.value),
  }));

  const nodeCls = (n) => new Set([n.lane, ...(n.mods || []).flatMap((id) => s.modById.get(id)?.cls || [])]);
  const nodeFeat = (n) => new Set(featuresOf(s, n.mods || [], n.features).list);
  const syncFilters = () => {
    setViewState('roadmap', { cls: [...flt.cls], feat: [...flt.feat], search: search.value });
  };
  const applyFlt = () => {
    syncFilters();
    if (!flt.cls.size && !flt.feat.size) { tv?.highlight(null); return; }
    tv?.highlight(s.roadmap.nodes.filter((n) => (!flt.cls.size || [...flt.cls].some((c) => nodeCls(n).has(c)))
      && (!flt.feat.size || [...flt.feat].some((f) => nodeFeat(n).has(f)))).map((n) => n.id));
  };
  const clsBox = h('div.rm-cls');
  const drawCls = () => mount(clsBox, s.classes.map((c) => ({ c, n: s.roadmap.nodes.filter((x) => nodeCls(x).has(c.id)).length })).filter((x) => x.n)
    .map(({ c, n }) => h(`span.chip${flt.cls.has(c.id) ? '.on' : ''}`, {
      'data-cls': c.id,
      style: { '--c': c.color },
      title: `${c.desc || c.title} — підсвітити віхи (${n})`,
      onclick: () => { flt.cls.has(c.id) ? flt.cls.delete(c.id) : flt.cls.add(c.id); drawCls(); applyFlt(); }
    }, clsIcon(c.id, c.color), c.title)));
  drawCls();
  const link = (v) => `#/roadmap${stageId ? `/${stageId}` : ''}?view=${v}`;
  mount(el, h('div.rm', null,
    h('div.toolbar', null,
      h('div.seg', null, h('a', { href: link('tree'), class: mode === 'tree' ? 'on' : '' }, '🌳 Дерево'), h('a', { href: link('mods'), class: mode === 'mods' ? 'on' : '' }, '✦ За модами')),
      search, h('datalist#rm-mods', null, onMap.map((m) => h('option', { value: m.name }))),
      h('button.btn', { onclick: () => {
        search.value = ''; flt.cls.clear(); flt.feat.clear();
        drawCls(); legendBox.querySelectorAll('.fl-item.on').forEach((x) => x.classList.remove('on'));
        tv?.clearFilter(); tv?.resetView();
        setViewState('roadmap', { cls: [], feat: [], search: '', sel: '' });
      } }, 'Скинути'),
      clsBox, prog),
    legendBox,
    h('div.split', null, h('div.split-main', null, canvas), side)));
  /** @type {any} */ let tv = null;
  mount(side, intro(s, mode, (st) => tv?.focusStage(st)));
  upd();
  const elk = {}; for (const [k, v] of q) if (k.startsWith('elk.') || k.startsWith('trunk.')) elk[k] = v;   // налагодження розкладки: ?elk.<параметр>=<значення>
  const initialTransform = !hasExplicitTarget ? (saved.transforms?.[mode] || null) : null;
  tv = await createTreeView(canvas, s, {
    mode,
    elk,
    legendHost: legendBox,
    selectedFeat: flt.feat,
    initialTransform,
    hiddenEdges: saved.hiddenEdges || [],
    onHiddenChange: (hiddenEdges) => setViewState('roadmap', { hiddenEdges }),
    onTransform: (t) => {
      const cur = getViewState('roadmap', { transforms: {} });
      setViewState('roadmap', { transforms: { ...(cur.transforms || {}), [mode]: t } });
    },
    onFeat: (f, on) => { on ? flt.feat.add(f) : flt.feat.delete(f); applyFlt(); },
    onSelect: (id) => { setViewState('roadmap', { sel: id }); showNode(id); },
    onProgress: upd,
  });

  /** @param {string} name @param {boolean} [keepTransform] */
  function pickMod(name, keepTransform = false) {
    const m = onMap.find((x) => x.name === name || x.id === name);
    if (!m) { search.value = ''; syncFilters(); tv.clearFilter(); return; }
    search.value = m.name; syncFilters();
    tv.filterMod(m.id, keepTransform);
  }
  /** @param {string} id */
  function showNode(id) {
    const n = s.roadmap.nodes.find((x) => x.id === id);
    if (!n) { mount(side, intro(s, mode, (st) => tv.focusStage(st))); return; }
    mount(side, nodePanel(s, n, () => { tv.refresh(); upd(); }, (x) => tv.focusNode(x)));
  }

  if (stageId && mode === 'tree') tv.focusStage(stageId);
  if (q.get('mod')) pickMod(q.get('mod') || '');
  if (q.get('node')) tv.focusNode(q.get('node') || '');
  if (!hasExplicitTarget) {
    if (saved.search) pickMod(saved.search, true);
    if (flt.cls.size || flt.feat.size) applyFlt();
    if (saved.sel) tv.select(saved.sel);
  }
  // Якщо в URL були одноразові параметри (?node= або ?mod=), очищаємо їх у history, щоб при поверненні «Назад» зберігався поточний стан
  if (q.has('node') || q.has('mod')) {
    history.replaceState(null, '', `#/roadmap${mode === 'mods' ? '?view=mods' : ''}`);
  }
}

/** @param {Store} s @param {RoadNode} n @param {() => void} changed @param {(id: string) => void} go */
function nodePanel(s, n, changed, go) {
  const T = (x) => s.roadmap.nodes.find((k) => k.id === x);
  const KIND = { req: 'потрібно', syn: 'синергія', opt: 'варіант' };
  const inn = s.roadmap.edges.filter((e) => e.to === n.id), out = s.roadmap.edges.filter((e) => e.from === n.id);
  const ch = n.chapter && s.chapterByFile.get(n.chapter);
  const body = [h('p', null, n.text), n.verify ? h('p.small', { style: { color: 'var(--warn)' } }, '⚑ Чернетка: факт ще звіряється з книгою мода.') : null];
  const nl = (e, k) => { const x = T(e[k]); return h('a', { href: '#', onclick: (ev) => { ev.preventDefault(); go(e[k]); } }, x?.title || e[k]); };
  const f = featuresOf(s, [], n.features);
  return h('div', null,
    h('div.badges', null, stageBadge(s, n.stage), n.trunk ? h('span.badge', { style: { '--c': 'var(--accent)' } }, '⭐ Головний шлях') : clsBadge(s, n.lane)),
    h('h2', { style: { marginTop: '10px' } }, n.title),
    n.spoiler ? spoiler(body) : body,
    n.star ? h('p.small', { style: { color: 'var(--accent)' } }, '★ Компоненти звідси знадобляться для ATM Star (ендгейм).') : null,
    n.icons?.length ? h('div.rm-items', null, n.icons.map((id) => { const it = s.items[id];
      return h('div.rm-item', { title: id }, it ? h('img', { src: it.img, alt: '' }) : h('span.nc-q', null, '?'), h('span', null, it?.uk || it?.en || id)); })) : null,
    f.list.length ? h('div', { style: { margin: '8px 0' } }, featRow(f.list, f.dims, true)) : null,
    n.mods?.length ? h('div.section', null, h('h3', null, 'Моди'), h('ul.list-clean', null, n.mods.map((id) => {
      const m = s.modById.get(id); const ff = featuresOf(s, [id]);
      return h('li.rm-mod', null, h('a', { href: `#/mod/${id}` }, m?.name || id), ' ', featRow(ff.list, ff.dims));
    }))) : null,
    ch ? h('p', { style: { marginTop: '12px' } }, '📜 Глава квестів: ', h('a', { href: `#/chapter/${ch.file}` }, ch.title)) : null,
    doneByBlock(s, n),
    h('label.check', { style: { marginTop: '14px' } },
      h('input', { type: 'checkbox', checked: isDone(n.id), onchange: (e) => { setDone(n.id, e.target.checked); changed(); } }),
      whyDone(n).auto ? 'Зроблено (позначено автоматично з сейву)' : 'Зроблено'),
    inn.length || out.length ? h('div.section.small', null,
      inn.length ? h('p', null, h('b', null, 'Перед цим: '), inn.flatMap((e, i) => [i ? ', ' : '', nl(e, 'from'), ` (${KIND[e.kind]})`])) : null,
      out.length ? h('p', null, h('b', null, 'Далі: '), out.flatMap((e, i) => [i ? ', ' : '', nl(e, 'to'), ` (${KIND[e.kind]})`])) : null) : null);
}

/** @param {Store} s @param {RoadNode} n */
function doneByBlock(s, n) {
  const w = whyDone(n);
  if (!w.quests.length && !w.advancements.length && !w.items.length) return null;
  const qi = s.roadmap.quest_info || {};
  const rows = [
    ...w.quests.map((q) => {
      const info = qi[q.id];
      const mark = q.done ? '✔' : q.started ? '⏳' : '○';
      return h('li', { class: q.done ? 'db-done' : q.started ? 'db-part' : '' },
        `${mark} Квест: `, info ? h('a', { href: `#/chapter/${info.chapter}/${q.id}` }, info.title) : h('code.small', null, q.id));
    }),
    ...w.advancements.map((a) => h('li', { class: a.done ? 'db-done' : '' }, `${a.done ? '✔' : '○'} Досягнення: `, h('code.small', null, a.id))),
    ...w.items.map((it) => {
      const meta = s.items[it.id];
      return h('li', { class: it.done ? 'db-done' : '' }, `${it.done ? '✔' : '○'} Предмет: ${meta?.uk || meta?.en || it.id} `, h('code.small', null, it.id));
    }),
  ];
  return h('div.section.small.db-box', null,
    h('div.db-head', null, w.auto
      ? h('span.badge', { style: { '--c': 'var(--ok)' } }, `💾 Виконано у сейві «${s.progress?.world || ''}»`)
      : h('span.muted', null, '💾 Автоматична перевірка з сейву (достатньо однієї умови):')),
    h('ul.list-clean.db-list', null, rows));
}

/** @param {Store} s @param {string} mode @param {(st: string) => void} goStage */
const intro = (s, mode, goStage) => h('div', null, h('h2', null, 'Як читати карту'),
  mode === 'tree'
    ? h('p', null, 'Розвиток іде згори вниз. Золотий стовбур — головний шлях (квести «Розділ 1/2»), від нього відгалужуються групи модів на своєму етапі. Етапи — на рейці зліва.')
    : h('p', null, 'Кожне сузір\'я — група модів: у центрі хаб з логотипами, навколо — її віхи. Лінії між сузір\'ями — зв\'язки між групами (×N — кілька). Клік по хабу підсвічує групу.'),
  h('p', null, 'Суцільна лінія — «потрібно для», жовта пунктирна — синергія, точкова — варіант. Клік по пункту легенди ховає тип ліній.'),
  h('p', null, 'Стани: ✔ зроблено · ! доступно (усе потрібне виконано) · 🔒 ще не доступно. ★ — знадобиться для ATM Star.'),
  h('p.small.muted', null, 'Наведіть на віху — підсвітиться шлях до неї й далі; клік — деталі (і закріплена підсвітка); подвійний клік — «зроблено». Колесо — масштаб, перетягування — рух. Прогрес зберігається у браузері.'),
  h('ul.list-clean.small', null, s.stages.map((st) => h('li', null,
    h('a', { href: mode === 'tree' ? '#' : `#/roadmap/${st.id}`, onclick: (e) => { if (mode === 'tree') { e.preventDefault(); goStage(st.id); } } }, `${st.icon} ${st.n}. ${st.title}`),
    h('div.muted', null, st.goal)))));
