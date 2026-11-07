// @ts-check
// Довідник модів: пошук, фільтр за класами й можливостями (виміри, боси, данжі…), приховування бібліотек, «лише описані», «без доповнень».
// Зберігає вибрані фільтри, пошук і сортування між переходами на картки модів.
import { h, mount, debounce } from '../core/dom.js';
import { modCard } from '../components/modcard.js';
import { FEATS, featIcon, clsIcon } from '../components/feat.js';
import { getViewState, setViewState } from '../core/view-state.js';
import {
  searchIconSvg, selectArrowSvg,
  buildCategoryFilterList, buildFeatureFilterGrid,
  sidebarSwitchRow, activeChip,
} from '../components/filter-sidebar.js';

const HIDE_ROLES = new Set(['library', 'perf']);

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export function render(el, _p, s) {
  el.className = 'view mods-view';
  const qStr = location.hash.split('?')[1] || '';
  const q = new URLSearchParams(qStr);
  const saved = getViewState('mods', { text: '', cls: [], feat: [], libs: false, curated: false, noAddons: false, sort: 'name' });
  const hasUrlFilter = q.has('cls') || q.has('feat') || q.has('q');
  const state = {
    text: q.has('q') ? (q.get('q') || '') : (hasUrlFilter ? '' : String(saved.text || '')),
    cls: new Set(q.has('cls') ? (q.get('cls') || '').split(',').filter(Boolean) : (hasUrlFilter ? [] : (saved.cls || []))),
    feat: new Set(q.has('feat') ? (q.get('feat') || '').split(',').filter(Boolean) : (hasUrlFilter ? [] : (saved.feat || []))),
    libs: Boolean(saved.libs),
    curated: Boolean(saved.curated),
    noAddons: Boolean(saved.noAddons),
    sort: String(saved.sort || 'name'),
  };

  const chipsWrap = h('div.mods-active-chips');
  const counterEl = h('div.mods-counter-text');
  const grid = h('div.grid');

  const syncState = () => {
    setViewState('mods', {
      text: state.text,
      cls: [...state.cls],
      feat: [...state.feat],
      libs: state.libs,
      curated: state.curated,
      noAddons: state.noAddons,
      sort: state.sort,
    });
  };

  const searchInp = /** @type {HTMLInputElement} */ (h('input', {
    type: 'search',
    value: state.text,
    placeholder: 'Пошук: назва, id, опис…',
    oninput: debounce((/** @type {Event} */ e) => {
      state.text = /** @type {HTMLInputElement} */ (e.target).value;
      draw();
    }, 150),
  }));

  const sortSel = /** @type {HTMLSelectElement} */ (h('select', {
    onchange: (/** @type {Event} */ e) => {
      state.sort = /** @type {HTMLSelectElement} */ (e.target).value;
      draw();
    },
  },
    h('option', { value: 'name', selected: state.sort === 'name' }, 'За назвою'),
    h('option', { value: 'size', selected: state.sort === 'size' }, 'За кількістю предметів'),
  ));

  const libsChk = /** @type {HTMLInputElement} */ (h('input', {
    type: 'checkbox',
    checked: state.libs,
    onchange: (/** @type {Event} */ e) => { state.libs = /** @type {HTMLInputElement} */ (e.target).checked; draw(); },
  }));

  const curChk = /** @type {HTMLInputElement} */ (h('input', {
    type: 'checkbox',
    checked: state.curated,
    onchange: (/** @type {Event} */ e) => { state.curated = /** @type {HTMLInputElement} */ (e.target).checked; draw(); },
  }));

  const noAddChk = /** @type {HTMLInputElement} */ (h('input', {
    type: 'checkbox',
    checked: state.noAddons,
    onchange: (/** @type {Event} */ e) => { state.noAddons = /** @type {HTMLInputElement} */ (e.target).checked; draw(); },
  }));

  const catList = buildCategoryFilterList({
    items: s.classes.map((cls) => ({
      cls,
      count: s.mods.filter((m) => (m.cls || []).includes(cls.id)).length,
    })),
    selected: state.cls,
    onToggle: (id) => {
      state.cls.has(id) ? state.cls.delete(id) : state.cls.add(id);
      draw();
    },
  });

  const featGrid = buildFeatureFilterGrid({
    countOf: (f) => s.mods.filter((m) => (m.features || []).includes(f)).length,
    selected: state.feat,
    onToggle: (f) => {
      state.feat.has(f) ? state.feat.delete(f) : state.feat.add(f);
      draw();
    },
  });

  const syncFilterUi = () => {
    catList.sync(state.cls);
    featGrid.sync(state.feat);
    libsChk.checked = state.libs;
    curChk.checked = state.curated;
    noAddChk.checked = state.noAddons;
    if (document.activeElement !== searchInp) {
      searchInp.value = state.text;
    }
    sortSel.value = state.sort;
  };

  const sidebar = h('aside.mods-sidebar', null,
    h('div.sidebar-search-wrap', null, searchInp, searchIconSvg()),
    h('div.sidebar-select-wrap', null, sortSel, selectArrowSvg()),
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Категорії'),
    catList.el,
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Додає у світ'),
    featGrid.el,
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Показати'),
    h('div.sidebar-switches', null,
      sidebarSwitchRow('Бібліотеки й оптимізація', libsChk),
      sidebarSwitchRow('Лише описані', curChk),
      sidebarSwitchRow('Без доповнень', noAddChk),
    ),
  );

  const draw = () => {
    syncState();
    syncFilterUi();

    const chips = [];
    if (state.text.trim()) {
      chips.push(activeChip('mods', [`Пошук: "${state.text.trim()}"`], 'Очистити пошук', () => {
        state.text = '';
        searchInp.value = '';
        draw();
      }));
    }

    for (const cid of state.cls) {
      const c = s.classes.find((x) => x.id === cid);
      if (c) {
        chips.push(activeChip('mods', [clsIcon(c.id, c.color), c.title], `Зняти фільтр "${c.title}"`, () => {
          state.cls.delete(cid);
          draw();
        }));
      }
    }

    for (const fid of state.feat) {
      const f = FEATS[fid];
      if (f) {
        chips.push(activeChip('mods', [featIcon(fid), f.short], `Зняти фільтр "${f.title}"`, () => {
          state.feat.delete(fid);
          draw();
        }));
      }
    }

    if (state.libs) {
      chips.push(activeChip('mods', ['З бібліотеками'], 'Приховати бібліотеки й оптимізацію', () => {
        state.libs = false;
        draw();
      }));
    }
    if (state.curated) {
      chips.push(activeChip('mods', ['Лише описані'], 'Показати всі моди', () => {
        state.curated = false;
        draw();
      }));
    }
    if (state.noAddons) {
      chips.push(activeChip('mods', ['Без доповнень'], 'Показати доповнення', () => {
        state.noAddons = false;
        draw();
      }));
    }
    if (state.sort !== 'name') {
      chips.push(activeChip('mods', ['За кількістю предметів'], 'Скинути сортування', () => {
        state.sort = 'name';
        draw();
      }));
    }

    const hasAnyActive = Boolean(state.text.trim() || state.cls.size || state.feat.size || state.libs || state.curated || state.noAddons || state.sort !== 'name');
    if (hasAnyActive) {
      chips.push(h('button.mods-clear-all-btn', {
        type: 'button',
        onclick: () => {
          state.text = '';
          state.cls.clear();
          state.feat.clear();
          state.libs = false;
          state.curated = false;
          state.noAddons = false;
          state.sort = 'name';
          if (location.hash.includes('?')) history.replaceState(null, '', '#/mods');
          draw();
        },
      }, 'Очистити все'));
    }

    mount(chipsWrap, chips);

    const t = state.text.trim().toLowerCase();
    let list = s.mods.filter((m) => (state.libs || !HIDE_ROLES.has(m.role))
      && (!state.curated || !m.auto) && (!state.noAddons || !m.parent)
      && (!state.cls.size || (m.cls || []).some((c) => state.cls.has(c)))
      && (!state.feat.size || [...state.feat].every((f) => (m.features || []).includes(f)))
      && (!t || `${m.id} ${m.name} ${m.uk || ''} ${m.desc_en || ''}`.toLowerCase().includes(t)));

    list = list.sort(state.sort === 'size'
      ? (a, b) => size(b) - size(a)
      : (a, b) => a.name.localeCompare(b.name, 'uk'));

    mount(counterEl, 'показано ', h('b', null, String(list.length)), ` з ${s.mods.length}`);
    mount(grid, list.length ? list.map((m) => modCard(s, m)) : h('div.empty', null, 'Нічого не знайдено'));
  };

  const mainArea = h('div.mods-main', null,
    h('div.mods-head', null,
      h('h1', null, 'Довідник модів'),
      h('p.small.muted', { style: { margin: 0 } }, 'Пошук, фільтрація за категоріями, вмістом та особливостями модифікацій ATM11.'),
    ),
    h('div.mods-top-bar', null, chipsWrap, counterEl),
    grid,
  );

  mount(el, h('div.mods-layout', null, sidebar, mainArea));
  draw();
}

/** @param {ModEntry} m */
const size = (m) => (m.counts?.item || 0) + (m.counts?.block || 0);
