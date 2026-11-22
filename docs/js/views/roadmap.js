// @ts-check
// Дорожня карта v2: вигляди «Дерево» / «За модами», бічна панель фільтрів, полотно з нижньою легендою, інспектор віхи праворуч.
// Маршрути: #/roadmap · #/roadmap/s2 (етап) · ?view=mods · ?mod=<id> (підсвітити мод) · ?node=<id> (відкрити віху).
// Зберігає позицію та масштаб полотна, вибрану віху, режим і активні фільтри при переходах на картки модів і глави квестів.
import { h, mount } from '../core/dom.js';
import { createTreeView } from '../graph/tree-view.js';
import { isDone, setDone, countDone, countAutoDone, whyDone } from '../core/progress.js';
import { stageBadge, clsBadge } from '../components/badge.js';
import { FEATS, featIcon, featuresOf, featRow, clsIcon } from '../components/feat.js';
import { spoiler } from '../components/spoiler.js';
import { getViewState, setViewState } from '../core/view-state.js';
import { ensureNames, itemNameUk, itemIconUrl, advNameUk } from '../core/store.js';
import {
  searchIconSvg, buildCategoryFilterList, buildFeatureFilterGrid, activeChip,
} from '../components/filter-sidebar.js';

/** @param {HTMLElement} el @param {string[]} p @param {Store} s */
export async function render(el, [stageId], s) {
  el.className = 'view full';
  ensureNames(s).catch(() => {});

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

  const side = h('aside.split-side');
  const canvas = h('div.tv-host');
  const ids = s.roadmap.nodes.map((n) => n.id);

  const onMap = /** @type {ModEntry[]} */ ([...new Set(s.roadmap.nodes.flatMap((n) => n.mods || []))]
    .map((id) => s.modById.get(id))
    .filter(Boolean))
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'));

  const expand = mode === 'mods' ? (q.get('expand') || '') : '';
  const hasExplicitTarget = Boolean(stageId || q.get('mod') || q.get('node'));
  const tkey = expand ? `mods:${expand}` : mode;
  const flt = {
    cls: new Set(hasExplicitTarget ? [] : (saved.cls || [])),
    feat: new Set(hasExplicitTarget ? [] : (saved.feat || [])),
  };

  const nodeCls = (/** @type {RoadNode} */ n) => new Set([n.lane, ...(n.mods || []).flatMap((id) => s.modById.get(id)?.cls || [])]);
  const nodeFeat = (/** @type {RoadNode} */ n) => new Set(featuresOf(s, n.mods || [], n.features).list);

  const syncFilters = () => {
    setViewState('roadmap', { cls: [...flt.cls], feat: [...flt.feat], search: searchInp.value });
  };

  const applyFlt = () => {
    syncFilters();
    catList.sync(flt.cls);
    featGrid.sync(flt.feat);
    if (!flt.cls.size && !flt.feat.size) {
      tv?.highlight(null);
    } else {
      tv?.highlight(s.roadmap.nodes.filter((n) => (!flt.cls.size || [...flt.cls].some((c) => nodeCls(n).has(c)))
        && (!flt.feat.size || [...flt.feat].some((f) => nodeFeat(n).has(f)))).map((n) => n.id));
    }
    renderActiveChips();
  };

  const link = (/** @type {string} */ v) => `#/roadmap${stageId ? `/${stageId}` : ''}?view=${v}`;
  const seg = h('div.rm-seg', null,
    h(mode === 'tree' ? 'a.rm-seg-btn.on' : 'a.rm-seg-btn', {
      href: link('tree'),
      title: 'Режим дерева етапів розвитку',
    }, '🌲 Дерево'),
    h(mode === 'mods' ? 'a.rm-seg-btn.on' : 'a.rm-seg-btn', {
      href: link('mods'),
      title: 'Режим сузір\'їв за модами',
    }, '✦ За модами'),
  );

  const searchInp = /** @type {HTMLInputElement} */ (h('input', {
    type: 'search',
    list: 'rm-mods',
    value: hasExplicitTarget ? '' : String(saved.search || ''),
    placeholder: 'Знайти мод на карті…',
    oninput: (/** @type {Event} */ e) => {
      const val = /** @type {HTMLInputElement} */ (e.target).value.trim();
      if (!val) {
        pickMod('');
      } else if (onMap.some((m) => m.name.toLowerCase() === val.toLowerCase())) {
        pickMod(val);
      }
      renderActiveChips();
    },
    onchange: (/** @type {Event} */ e) => {
      pickMod(/** @type {HTMLInputElement} */ (e.target).value.trim());
      renderActiveChips();
    },
  }));

  const searchWrap = h('div.sidebar-search-wrap', null,
    searchInp,
    searchIconSvg(),
    h('datalist#rm-mods', null, onMap.map((m) => h('option', { value: m.name }))),
  );

  const counterEl = h('div.rm-counter-text');
  const updProgress = () => {
    const auto = countAutoDone(ids);
    mount(counterEl, 'зроблено ', h('b', null, String(countDone(ids))), ` / ${ids.length}`, auto ? ` (з сейву: ${auto})` : '');
  };

  const chipsWrap = h('div.rm-active-chips');

  const catList = buildCategoryFilterList({
    items: s.classes
      .map((cls) => ({ cls, count: s.roadmap.nodes.filter((x) => nodeCls(x).has(cls.id)).length }))
      .filter((x) => x.count > 0),
    selected: flt.cls,
    titleFor: (cls, count) => `${cls.desc || cls.title} — підсвітити віхи (${count})`,
    onToggle: (id) => {
      flt.cls.has(id) ? flt.cls.delete(id) : flt.cls.add(id);
      applyFlt();
    },
  });

  const featGrid = buildFeatureFilterGrid({
    countOf: (f) => s.roadmap.nodes.filter((n) => nodeFeat(n).has(f)).length,
    selected: flt.feat,
    titleFor: (_f, feat, count) => `${feat.title} — підсвітити такі віхи (${count})`,
    onToggle: (f) => {
      flt.feat.has(f) ? flt.feat.delete(f) : flt.feat.add(f);
      applyFlt();
    },
  });

  const renderActiveChips = () => {
    const chips = [];
    const curSearch = searchInp.value.trim();
    if (curSearch) {
      chips.push(activeChip('rm', [`Пошук: "${curSearch}"`], 'Очистити пошук', () => pickMod('')));
    }

    for (const cid of flt.cls) {
      const c = s.classes.find((x) => x.id === cid);
      if (c) {
        chips.push(activeChip('rm', [clsIcon(c.id, c.color), c.title], `Зняти фільтр "${c.title}"`, () => {
          flt.cls.delete(cid);
          applyFlt();
        }));
      }
    }

    for (const fid of flt.feat) {
      const f = FEATS[fid];
      if (f) {
        chips.push(activeChip('rm', [featIcon(fid), f.short], `Зняти фільтр "${f.title}"`, () => {
          flt.feat.delete(fid);
          applyFlt();
        }));
      }
    }

    if (curSearch || flt.cls.size || flt.feat.size) {
      chips.push(h('button.rm-clear-all-btn', {
        type: 'button',
        onclick: () => {
          searchInp.value = '';
          flt.cls.clear();
          flt.feat.clear();
          catList.sync(flt.cls);
          featGrid.sync(flt.feat);
          tv?.clearFilter();
          tv?.highlight(null);
          setViewState('roadmap', { cls: [], feat: [], search: '', sel: '' });
          renderActiveChips();
        },
      }, 'Очистити все'));
    }

    mount(chipsWrap, chips);
  };

  const sidebar = h('aside.rm-sidebar', null,
    seg,
    searchWrap,
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Категорії'),
    catList.el,
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Додає у світ'),
    featGrid.el,
  );

  const topBar = h('div.rm-top-bar', null, chipsWrap, counterEl);
  const body = h('div.rm-body', null, canvas, side);
  const main = h('div.rm-main', null, topBar, body);
  mount(el, h('div.rm-layout', null, sidebar, main));

  /** @type {any} */ let tv = null;
  mount(side, intro(s, mode, (st) => tv?.focusStage(st)));
  updProgress();
  renderActiveChips();

  /** @type {Record<string, string>} */
  const elk = {};
  for (const [k, v] of q) {
    if (k.startsWith('elk.') || k.startsWith('trunk.')) elk[k] = v;
  }
  const initialTransform = !hasExplicitTarget ? (saved.transforms?.[tkey] || null) : null;

  tv = await createTreeView(canvas, s, {
    mode,
    elk,
    expand,
    onExpand: (gid) => { location.hash = `#/roadmap?view=mods${gid ? `&expand=${gid}` : ''}`; },
    hideFeatLegend: true,
    selectedFeat: flt.feat,
    initialTransform,
    hiddenEdges: saved.hiddenEdges || [],
    onHiddenChange: (hiddenEdges) => setViewState('roadmap', { hiddenEdges }),
    onTransform: (t) => {
      const cur = getViewState('roadmap', { transforms: {} });
      setViewState('roadmap', { transforms: { ...(cur.transforms || {}), [tkey]: t } });
    },
    onFeat: (f, on) => {
      on ? flt.feat.add(f) : flt.feat.delete(f);
      applyFlt();
    },
    onSelect: (id) => { setViewState('roadmap', { sel: id }); showNode(id); },
    onProgress: updProgress,
  });

  /** @param {string} name @param {boolean} [keepTransform] */
  function pickMod(name, keepTransform = false) {
    const m = onMap.find((x) => x.name.toLowerCase() === name.toLowerCase() || x.id.toLowerCase() === name.toLowerCase());
    if (!m) {
      if (!name) {
        searchInp.value = '';
        syncFilters();
        tv?.clearFilter();
      }
      renderActiveChips();
      return;
    }
    searchInp.value = m.name;
    syncFilters();
    tv?.filterMod(m.id, keepTransform);
    renderActiveChips();
  }

  /** @param {string} id */
  function showNode(id) {
    const n = s.roadmap.nodes.find((x) => x.id === id);
    if (!n) { mount(side, intro(s, mode, (st) => tv?.focusStage(st))); return; }
    mount(side, nodePanel(s, n, () => { tv?.refresh(); updProgress(); }, (x) => tv?.focusNode(x)));
  }

  if (stageId && mode === 'tree') tv?.focusStage(stageId);
  if (q.get('mod')) pickMod(q.get('mod') || '');
  if (q.get('node')) tv?.focusNode(q.get('node') || '');
  if (!hasExplicitTarget) {
    if (saved.search) pickMod(saved.search, true);
    if (flt.cls.size || flt.feat.size) applyFlt();
    if (saved.sel) tv?.select(saved.sel);
  }
  if (q.has('node') || q.has('mod')) {
    history.replaceState(null, '', `#/roadmap${mode === 'mods' ? `?view=mods${expand ? `&expand=${expand}` : ''}` : ''}`);
  }
}

/** @param {Store} s @param {RoadNode} n @param {() => void} changed @param {(id: string) => void} go */
function nodePanel(s, n, changed, go) {
  const T = (/** @type {string} */ x) => s.roadmap.nodes.find((k) => k.id === x);
  /** @type {Record<string, string>} */
  const KIND = { req: 'потрібно', syn: 'синергія', opt: 'варіант' };
  const inn = s.roadmap.edges.filter((e) => e.to === n.id);
  const out = s.roadmap.edges.filter((e) => e.from === n.id);
  const ch = n.chapter && s.chapterByFile.get(n.chapter);
  const body = [h('p', null, n.text), n.verify ? h('p.small', { style: { color: 'var(--warn)' } }, '⚑ Чернетка: факт ще звіряється з книгою мода.') : null];
  const nl = (/** @type {RoadEdge} */ e, /** @type {'from' | 'to'} */ k) => {
    const x = T(e[k]);
    return h('a', { href: '#', onclick: (/** @type {Event} */ ev) => { ev.preventDefault(); go(e[k]); } }, x?.title || e[k]);
  };
  const linkRow = (/** @type {RoadEdge} */ e, /** @type {'from' | 'to'} */ k) => h('li', null,
    nl(e, k), ` — ${KIND[e.kind] || e.kind}${e.label ? `: ${e.label}` : ''}`, e.src ? h('div.muted.rm-src', null, e.src) : null);
  const f = featuresOf(s, [], n.features);
  return h('div', null,
    h('div.badges', null, stageBadge(s, n.stage), n.trunk ? h('span.badge', { style: { '--c': 'var(--accent)' } }, '⭐ Головний шлях') : clsBadge(s, n.lane)),
    h('h2', { style: { marginTop: '10px' } }, n.title),
    n.na ? h('p.small.na-note', null, h('b', null, '∅ У цій версії збірки недоступно. '), n.na) : null,
    n.spoiler ? spoiler(body) : body,
    n.icons?.length ? h('div.rm-items', null, n.icons.map((id) => {
      const img = itemIconUrl(s, id);
      return h('div.rm-item', { title: id },
        img ? h('img', { src: img, alt: '' }) : h('span.nc-q', null, '?'),
        h('span', null, itemNameUk(s, id)),
      );
    })) : null,
    f.list.length ? h('div', { style: { margin: '8px 0' } }, featRow(f.list, f.dims, true)) : null,
    n.mods?.length ? h('div.section', null, h('h3', null, 'Моди'), h('ul.list-clean', null, n.mods.map((id) => {
      const m = s.modById.get(id);
      const ff = featuresOf(s, [id]);
      return h('li.rm-mod', null, h('a', { href: `#/mod/${id}` }, m?.name || id), ' ', featRow(ff.list, ff.dims));
    }))) : null,
    ch ? h('p', { style: { marginTop: '12px' } }, '📜 Глава квестів: ', h('a', { href: `#/chapter/${ch.file}` }, ch.title)) : null,
    (() => {
      const bs = s.branches.filter((b) => (b.mods || []).some((/** @type {string} */ x) => n.mods?.includes(x)));
      return bs.length ? h('p', null, '🌿 Гілка: ', bs.map((b, i) => [i ? ' · ' : '', h('a', { href: `#/branch/${b.id}` }, b.title)])) : null;
    })(),
    doneByBlock(s, n),
    n.na ? null : h('label.check', { style: { marginTop: '14px' } },
      h('input', { type: 'checkbox', checked: isDone(n.id), onchange: (/** @type {Event} */ e) => { setDone(n.id, /** @type {HTMLInputElement} */ (e.target).checked); changed(); } }),
      whyDone(n).auto ? 'Зроблено (позначено автоматично з сейву)' : 'Зроблено'),
    inn.length || out.length ? h('div.section.small.rm-links', null,
      inn.length ? [h('b', null, 'Перед цим:'), h('ul.list-clean', null, inn.map((e) => linkRow(e, 'from')))] : null,
      out.length ? [h('b', null, 'Далі:'), h('ul.list-clean', null, out.map((e) => linkRow(e, 'to')))] : null) : null);
}

/** Умови автовиконання віхи з сейву: назви українською (квест — посилання на квест; досягнення й предмет — з перекладу), ID — у підказці.
 * @param {Store} s @param {RoadNode} n */
function doneByBlock(s, n) {
  const w = whyDone(n);
  if (!w.quests.length && !w.advancements.length && !w.items.length) return null;
  const qi = s.roadmap.quest_info || {};
  const ai = s.roadmap.adv_info || {};
  const row = (/** @type {string} */ st, /** @type {string} */ kind, /** @type {any} */ body, /** @type {string} */ id) =>
    h('li', { class: st, title: id }, h('span.db-kind', null, kind), body);
  const rows = [
    ...w.quests.map((q) => {
      const info = qi[q.id];
      return row(q.done ? 'db-done' : q.started ? 'db-part' : '', 'Квест', info ? h('a', { href: `#/chapter/${info.chapter}/${q.id}` }, info.title) : q.id, q.id);
    }),
    ...w.advancements.map((a) => {
      const x = ai[a.id] || {};
      const mod = s.modById.get(a.id.split(':')[0])?.name;
      return row(a.done ? 'db-done' : '', 'Досягнення', x.hidden ? h('span.muted', null, `службове${mod ? ` (${mod})` : ''}`) : `«${advNameUk(s, a.id)}»`, a.id);
    }),
    ...w.items.map((it) => {
      const img = itemIconUrl(s, it.id);
      const uk = itemNameUk(s, it.id);
      return row(it.done ? 'db-done' : '', 'Предмет', h('span.db-item', null, img ? h('img', { src: img, alt: '' }) : null, uk), it.id);
    }),
  ];
  return h('div.section.small.db-box', null,
    h('div.db-head', null, w.auto
      ? h('span.badge', { style: { '--c': 'var(--ok)' } }, `💾 Виконано у сейві «${s.progress?.world || ''}»`)
      : h('span.muted', null, '💾 Автоматична перевірка з сейву (достатньо однієї умови):')),
    h('ul.db-list', null, rows));
}

/** @param {Store} s @param {string} mode @param {(st: string) => void} goStage */
const intro = (s, mode, goStage) => h('div', null, h('h2', null, 'Як читати карту'),
  mode === 'tree'
    ? h('p', null, 'Розвиток іде згори вниз. Золотий стовбур — головний шлях (квести «Розділ 1/2»), від нього відгалужуються групи модів на своєму етапі. Етапи — на рейці зліва.')
    : h('p', null, 'Кожне сузір\'я — група модів: у центрі хаб з логотипами, навколо — її віхи. Лінії між сузір\'ями — зв\'язки між групами (×N — кілька). Клік по хабу підсвічує групу.'),
  h('p', null, 'Суцільна лінія — «потрібно для», пунктирна — синергія, точкова — варіант. Клік по пункту легенди ховає тип ліній.'),
  h('p', null, 'Стани: ✔ зроблено · ! доступно (усе потрібне виконано) · 🔒 ще не доступно · ∅ у цій версії збірки недоступно.'),
  h('p.small.muted', null, 'Кожен зв\'язок «потрібно» й «синергія» має джерело — залежність квестів, рецепт (jar / KubeJS) або конфіг; його видно в панелі віхи й у підказці над лінією.'),
  h('p.small.muted', null, 'Наведіть на віху — підсвітиться шлях до неї й далі; клік — деталі (і закріплена підсвітка); подвійний клік — «зроблено». Колесо — масштаб, перетягування — рух. Прогрес зберігається у браузері.'),
  h('ul.list-clean.small', null, s.stages.map((st) => h('li', null,
    h('a', { href: mode === 'tree' ? '#' : `#/roadmap/${st.id}`, onclick: (/** @type {Event} */ e) => { if (mode === 'tree') { e.preventDefault(); goStage(st.id); } } }, `${st.icon} ${st.n}. ${st.title}`),
    h('div.muted', null, st.goal)))));
