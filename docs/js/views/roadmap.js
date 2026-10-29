// @ts-check
// Дорожня карта v2: вигляди «Дерево» / «За модами», бічна панель фільтрів, полотно з нижньою легендою, інспектор віхи праворуч.
// Маршрути: #/roadmap · #/roadmap/s2 (етап) · ?view=mods · ?mod=<id> (підсвітити мод) · ?node=<id> (відкрити віху).
// Зберігає позицію та масштаб полотна, вибрану віху, режим і активні фільтри при переходах на картки модів і глави квестів.
import { h, mount } from '../core/dom.js';
import { createTreeView } from '../graph/tree-view.js';
import { isDone, setDone, countDone, countAutoDone, whyDone } from '../core/progress.js';
import { stageBadge, clsBadge } from '../components/badge.js';
import { FEATS, FEAT_ORDER, featIcon, featuresOf, featRow, clsIcon } from '../components/feat.js';
import { spoiler } from '../components/spoiler.js';
import { getViewState, setViewState } from '../core/view-state.js';

const searchIconSvg = () => h('span.sidebar-search-icon', {
  html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
});

const checkSvg = () => '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

const chevronDownSvg = () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

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

  const side = h('aside.split-side');
  const canvas = h('div.tv-host');
  const ids = s.roadmap.nodes.map((n) => n.id);

  const onMap = [...new Set(s.roadmap.nodes.flatMap((n) => n.mods || []))].map((id) => s.modById.get(id)).filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'));

  const expand = mode === 'mods' ? (q.get('expand') || '') : '';
  const hasExplicitTarget = Boolean(stageId || q.get('mod') || q.get('node'));
  const tkey = expand ? `mods:${expand}` : mode;
  const flt = {
    cls: new Set(hasExplicitTarget ? [] : (saved.cls || [])),
    feat: new Set(hasExplicitTarget ? [] : (saved.feat || [])),
  };

  const nodeCls = (n) => new Set([n.lane, ...(n.mods || []).flatMap((id) => s.modById.get(id)?.cls || [])]);
  const nodeFeat = (n) => new Set(featuresOf(s, n.mods || [], n.features).list);

  const syncFilters = () => {
    setViewState('roadmap', { cls: [...flt.cls], feat: [...flt.feat], search: searchInp.value });
  };

  const applyFlt = () => {
    syncFilters();
    if (!flt.cls.size && !flt.feat.size) {
      tv?.highlight(null);
    } else {
      tv?.highlight(s.roadmap.nodes.filter((n) => (!flt.cls.size || [...flt.cls].some((c) => nodeCls(n).has(c)))
        && (!flt.feat.size || [...flt.feat].some((f) => nodeFeat(n).has(f)))).map((n) => n.id));
    }
    renderActiveChips();
  };

  // Перемикач режимів
  const link = (v) => `#/roadmap${stageId ? `/${stageId}` : ''}?view=${v}`;
  const seg = h('div.rm-seg', null,
    h(mode === 'tree' ? 'a.rm-seg-btn.on' : 'a.rm-seg-btn', {
      href: link('tree'),
      title: 'Режим дерева етапів розвитку',
    }, '🌲 Дерево'),
    h(mode === 'mods' ? 'a.rm-seg-btn.on' : 'a.rm-seg-btn', {
      href: link('mods'),
      title: 'Режим сузір\'їв за модами',
    }, '✦ За модами')
  );

  // Пошук мода
  const searchInp = /** @type {HTMLInputElement} */ (h('input', {
    type: 'search',
    list: 'rm-mods',
    value: hasExplicitTarget ? '' : String(saved.search || ''),
    placeholder: 'Знайти мод на карті…',
    oninput: (e) => {
      const val = e.target.value.trim();
      if (!val) {
        pickMod('');
      } else if (onMap.some((m) => m.name.toLowerCase() === val.toLowerCase())) {
        pickMod(val);
      }
      renderActiveChips();
    },
    onchange: (e) => {
      pickMod(e.target.value.trim());
      renderActiveChips();
    },
  }));

  const searchWrap = h('div.sidebar-search-wrap', null,
    searchInp,
    searchIconSvg(),
    h('datalist#rm-mods', null, onMap.map((m) => h('option', { value: m.name })))
  );

  // Лічильник прогресу та активні фільтри
  const counterEl = h('div.rm-counter-text');
  const updProgress = () => {
    const auto = countAutoDone(ids);
    mount(counterEl, 'зроблено ', h('b', null, String(countDone(ids))), ` / ${ids.length}`, auto ? ` (з сейву: ${auto})` : '');
  };

  const chipsWrap = h('div.rm-active-chips');

  const renderActiveChips = () => {
    const activeChips = [];
    const curSearch = searchInp.value.trim();
    if (curSearch) {
      activeChips.push(h('span.rm-active-chip', null,
        `Пошук: "${curSearch}"`,
        h('span.rm-active-chip-x', {
          title: 'Очистити пошук',
          onclick: () => {
            pickMod('');
          },
        }, '✕')
      ));
    }

    for (const cid of flt.cls) {
      const c = s.classes.find((x) => x.id === cid);
      if (c) {
        activeChips.push(h('span.rm-active-chip', null,
          clsIcon(c.id, c.color),
          c.title,
          h('span.rm-active-chip-x', {
            title: `Зняти фільтр "${c.title}"`,
            onclick: () => {
              flt.cls.delete(cid);
              const row = catRows.get(cid)?.el;
              if (row) row.classList.remove('on');
              applyFlt();
            },
          }, '✕')
        ));
      }
    }

    for (const fid of flt.feat) {
      const f = FEATS[fid];
      if (f) {
        activeChips.push(h('span.rm-active-chip', null,
          featIcon(fid),
          f.short,
          h('span.rm-active-chip-x', {
            title: `Зняти фільтр "${f.title}"`,
            onclick: () => {
              flt.feat.delete(fid);
              const btn = featBtns.get(fid);
              if (btn) btn.classList.remove('on');
              applyFlt();
            },
          }, '✕')
        ));
      }
    }

    const hasAnyActive = Boolean(curSearch || flt.cls.size || flt.feat.size);
    if (hasAnyActive) {
      activeChips.push(h('button.rm-clear-all-btn', {
        type: 'button',
        onclick: () => {
          searchInp.value = '';
          flt.cls.clear();
          flt.feat.clear();
          for (const { el: row } of catRows.values()) row.classList.remove('on');
          for (const btn of featBtns.values()) btn.classList.remove('on');
          tv?.clearFilter();
          tv?.highlight(null);
          setViewState('roadmap', { cls: [], feat: [], search: '', sel: '' });
          renderActiveChips();
        },
      }, 'Очистити все'));
    }

    mount(chipsWrap, activeChips);
  };

  // Список категорій
  const catsWithCount = s.classes
    .map((c) => ({ c, n: s.roadmap.nodes.filter((x) => nodeCls(x).has(c.id)).length }))
    .filter((x) => x.n > 0);

  /** @type {Map<string, { el: HTMLElement, index: number }>} */
  const catRows = new Map();
  let catExpanded = (flt.cls.size > 0 && catsWithCount.slice(8).some((x) => flt.cls.has(x.c.id)));

  const updateCatVisibility = () => {
    for (const [_, { el: row, index }] of catRows) {
      if (index >= 8) {
        row.style.display = catExpanded ? 'flex' : 'none';
      }
    }
    if (moreBtn) {
      moreBtnText.textContent = catExpanded ? 'Згорнути' : `Ще ${catsWithCount.length - 8} категорій`;
      moreBtn.classList.toggle('expanded', catExpanded);
    }
  };

  const moreBtnText = h('span', null, catExpanded ? 'Згорнути' : `Ще ${catsWithCount.length - 8} категорій`);
  const moreBtnIcon = h('span.sidebar-more-icon', { html: chevronDownSvg() });
  /** @type {HTMLElement | null} */
  let moreBtn = null;
  if (catsWithCount.length > 8) {
    moreBtn = h('button.sidebar-more-btn', {
      type: 'button',
      className: `sidebar-more-btn${catExpanded ? ' expanded' : ''}`,
      onclick: () => {
        catExpanded = !catExpanded;
        updateCatVisibility();
      },
    }, moreBtnText, moreBtnIcon);
  }

  const catListWrap = h('div.sidebar-cat-list');
  catsWithCount.forEach(({ c, n }, index) => {
    const row = h('div.sidebar-cat-row', {
      'data-cls': c.id,
      style: {
        '--c': c.color,
        display: (index < 8 || catExpanded) ? 'flex' : 'none',
      },
      title: `${c.desc || c.title} — підсвітити віхи (${n})`,
      onclick: () => {
        flt.cls.has(c.id) ? flt.cls.delete(c.id) : flt.cls.add(c.id);
        row.classList.toggle('on', flt.cls.has(c.id));
        applyFlt();
      },
    },
      h('div.sidebar-cat-left', null,
        clsIcon(c.id, c.color),
        h('span.sidebar-cat-name', null, c.title),
        h('span.sidebar-cat-count', null, `(${n})`)
      ),
      h('span.sidebar-check-box', { html: checkSvg() })
    );
    if (flt.cls.has(c.id)) row.classList.add('on');
    catRows.set(c.id, { el: row, index });
    catListWrap.append(row);
  });
  if (moreBtn) catListWrap.append(moreBtn);

  // Сітка можливостей (На картках)
  /** @type {Map<string, HTMLElement>} */
  const featBtns = new Map();
  const featGridWrap = h('div.sidebar-feat-grid');
  FEAT_ORDER.forEach((f) => {
    const count = s.roadmap.nodes.filter((n) => nodeFeat(n).has(f)).length;
    const btn = h('button.sidebar-feat-btn', {
      type: 'button',
      'data-feat': f,
      style: { '--c': FEATS[f].color },
      title: `${FEATS[f].title} — підсвітити такі віхи (${count})`,
      onclick: () => {
        flt.feat.has(f) ? flt.feat.delete(f) : flt.feat.add(f);
        btn.classList.toggle('on', flt.feat.has(f));
        applyFlt();
      },
    },
      h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '5px' } },
        featIcon(f),
        h('span', null, FEATS[f].short)
      ),
      h('span.sidebar-feat-cnt', null, String(count))
    );
    if (flt.feat.has(f)) btn.classList.add('on');
    featBtns.set(f, btn);
    featGridWrap.append(btn);
  });

  const sidebar = h('aside.rm-sidebar', null,
    seg,
    searchWrap,
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Категорії'),
    catListWrap,
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Додає у світ'),
    featGridWrap
  );

  const topBar = h('div.rm-top-bar', null, chipsWrap, counterEl);
  const body = h('div.rm-body', null, canvas, side);
  const main = h('div.rm-main', null, topBar, body);
  mount(el, h('div.rm-layout', null, sidebar, main));

  /** @type {any} */ let tv = null;
  mount(side, intro(s, mode, (st) => tv?.focusStage(st)));
  updProgress();
  renderActiveChips();

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
    hideFeatLegend: true, // особливості винесені у бічну панель
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
      const btn = featBtns.get(f);
      if (btn) btn.classList.toggle('on', on);
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
  const T = (x) => s.roadmap.nodes.find((k) => k.id === x);
  const KIND = { req: 'потрібно', syn: 'синергія', opt: 'варіант' };
  const inn = s.roadmap.edges.filter((e) => e.to === n.id), out = s.roadmap.edges.filter((e) => e.from === n.id);
  const ch = n.chapter && s.chapterByFile.get(n.chapter);
  const body = [h('p', null, n.text), n.verify ? h('p.small', { style: { color: 'var(--warn)' } }, '⚑ Чернетка: факт ще звіряється з книгою мода.') : null];
  const nl = (e, k) => { const x = T(e[k]); return h('a', { href: '#', onclick: (ev) => { ev.preventDefault(); go(e[k]); } }, x?.title || e[k]); };
  /** Зв'язок: віха, тип, підпис і джерело (квест / рецепт / KubeJS / конфіг) — щоб було видно, чому лінія є. */
  const linkRow = (e, k) => h('li', null, nl(e, k), ` — ${KIND[e.kind]}${e.label ? `: ${e.label}` : ''}`, e.src ? h('div.muted.rm-src', null, e.src) : null);
  const f = featuresOf(s, [], n.features);
  return h('div', null,
    h('div.badges', null, stageBadge(s, n.stage), n.trunk ? h('span.badge', { style: { '--c': 'var(--accent)' } }, '⭐ Головний шлях') : clsBadge(s, n.lane)),
    h('h2', { style: { marginTop: '10px' } }, n.title),
    n.na ? h('p.small.na-note', null, h('b', null, '∅ У цій версії збірки недоступно. '), n.na) : null,
    n.spoiler ? spoiler(body) : body,
    n.icons?.length ? h('div.rm-items', null, n.icons.map((id) => { const it = s.items[id];
      return h('div.rm-item', { title: id }, it ? h('img', { src: it.img, alt: '' }) : h('span.nc-q', null, '?'), h('span', null, it?.uk || it?.en || id)); })) : null,
    f.list.length ? h('div', { style: { margin: '8px 0' } }, featRow(f.list, f.dims, true)) : null,
    n.mods?.length ? h('div.section', null, h('h3', null, 'Моди'), h('ul.list-clean', null, n.mods.map((id) => {
      const m = s.modById.get(id); const ff = featuresOf(s, [id]);
      return h('li.rm-mod', null, h('a', { href: `#/mod/${id}` }, m?.name || id), ' ', featRow(ff.list, ff.dims));
    }))) : null,
    ch ? h('p', { style: { marginTop: '12px' } }, '📜 Глава квестів: ', h('a', { href: `#/chapter/${ch.file}` }, ch.title)) : null,
    (() => { const bs = s.branches.filter((b) => (b.mods || []).some((x) => n.mods?.includes(x))); return bs.length ? h('p', null, '🌿 Гілка: ', bs.map((b, i) => [i ? ' · ' : '', h('a', { href: `#/branch/${b.id}` }, b.title)])) : null; })(),
    doneByBlock(s, n),
    n.na ? null : h('label.check', { style: { marginTop: '14px' } },
      h('input', { type: 'checkbox', checked: isDone(n.id), onchange: (e) => { setDone(n.id, e.target.checked); changed(); } }),
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
  const qi = s.roadmap.quest_info || {}; const ai = s.roadmap.adv_info || {};
  const row = (st, kind, body, id) => h('li', { class: st, title: id }, h('span.db-kind', null, kind), body);
  const rows = [
    ...w.quests.map((q) => { const info = qi[q.id];
      return row(q.done ? 'db-done' : q.started ? 'db-part' : '', 'Квест', info ? h('a', { href: `#/chapter/${info.chapter}/${q.id}` }, info.title) : q.id, q.id); }),
    ...w.advancements.map((a) => { const x = ai[a.id] || {};
      const mod = s.modById.get(a.id.split(':')[0])?.name;
      return row(a.done ? 'db-done' : '', 'Досягнення', x.hidden ? h('span.muted', null, `службове${mod ? ` (${mod})` : ''}`) : `«${x.uk || x.en || a.id}»`, a.id); }),
    ...w.items.map((it) => { const meta = s.items[it.id];
      return row(it.done ? 'db-done' : '', 'Предмет', meta ? h('span.db-item', null, h('img', { src: meta.img, alt: '' }), meta.uk || meta.en) : it.id, it.id); }),
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
  h('p', null, 'Суцільна лінія — «потрібно для», жовта пунктирна — синергія, точкова — варіант. Клік по пункту легенди ховає тип ліній.'),
  h('p', null, 'Стани: ✔ зроблено · ! доступно (усе потрібне виконано) · 🔒 ще не доступно · ∅ у цій версії збірки недоступно.'),
  h('p.small.muted', null, 'Кожен зв\'язок «потрібно» й «синергія» має джерело — залежність квестів, рецепт (jar / KubeJS) або конфіг; його видно в панелі віхи й у підказці над лінією.'),
  h('p.small.muted', null, 'Наведіть на віху — підсвітиться шлях до неї й далі; клік — деталі (і закріплена підсвітка); подвійний клік — «зроблено». Колесо — масштаб, перетягування — рух. Прогрес зберігається у браузері.'),
  h('ul.list-clean.small', null, s.stages.map((st) => h('li', null,
    h('a', { href: mode === 'tree' ? '#' : `#/roadmap/${st.id}`, onclick: (e) => { if (mode === 'tree') { e.preventDefault(); goStage(st.id); } } }, `${st.icon} ${st.n}. ${st.title}`),
    h('div.muted', null, st.goal)))));
