// @ts-check
// Довідник модів: пошук, фільтр за класами й можливостями (виміри, боси, данжі…), приховування бібліотек, «лише описані», «без доповнень».
// Зберігає вибрані фільтри, пошук і сортування між переходами на картки модів.
import { h, mount, debounce } from '../core/dom.js';
import { modCard } from '../components/modcard.js';
import { FEATS, FEAT_ORDER, featIcon, clsIcon } from '../components/feat.js';
import { getViewState, setViewState } from '../core/view-state.js';

const HIDE_ROLES = new Set(['library', 'perf']);

const searchIconSvg = () => h('span.sidebar-search-icon', {
  html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>'
});

const selectArrowSvg = () => h('span.sidebar-select-arrow', {
  html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>'
});

const chevronDownSvg = () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

const checkSvg = () => '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

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

  /** @type {Map<string, { el: HTMLElement, index: number }>} */
  const catRows = new Map();
  /** @type {Map<string, HTMLElement>} */
  const featBtns = new Map();

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
    oninput: debounce((e) => {
      state.text = e.target.value;
      draw();
    }, 150),
  }));

  const sortSel = /** @type {HTMLSelectElement} */ (h('select', {
    onchange: (e) => {
      state.sort = e.target.value;
      draw();
    },
  },
    h('option', { value: 'name', selected: state.sort === 'name' }, 'За назвою'),
    h('option', { value: 'size', selected: state.sort === 'size' }, 'За кількістю предметів')
  ));

  const libsChk = /** @type {HTMLInputElement} */ (h('input', {
    type: 'checkbox',
    checked: state.libs,
    onchange: (e) => { state.libs = e.target.checked; draw(); },
  }));

  const curChk = /** @type {HTMLInputElement} */ (h('input', {
    type: 'checkbox',
    checked: state.curated,
    onchange: (e) => { state.curated = e.target.checked; draw(); },
  }));

  const noAddChk = /** @type {HTMLInputElement} */ (h('input', {
    type: 'checkbox',
    checked: state.noAddons,
    onchange: (e) => { state.noAddons = e.target.checked; draw(); },
  }));

  const syncFilterUi = () => {
    for (const [id, { el }] of catRows) {
      el.classList.toggle('on', state.cls.has(id));
    }
    for (const [id, btn] of featBtns) {
      btn.classList.toggle('on', state.feat.has(id));
    }
    libsChk.checked = state.libs;
    curChk.checked = state.curated;
    noAddChk.checked = state.noAddons;
    if (document.activeElement !== searchInp) {
      searchInp.value = state.text;
    }
    sortSel.value = state.sort;
  };

  // Categories list
  const catListWrap = h('div.sidebar-cat-list');
  let catExpanded = (state.cls.size > 0 && s.classes.slice(8).some((c) => state.cls.has(c.id)));

  const moreBtnText = h('span', null, catExpanded ? 'Згорнути' : `Ще ${s.classes.length - 8} категорій`);
  const moreBtnIcon = h('span.sidebar-more-icon', { html: chevronDownSvg() });

  const updateCatVisibility = () => {
    for (const [_, { el, index }] of catRows) {
      if (index >= 8) {
        el.style.display = catExpanded ? 'flex' : 'none';
      }
    }
    if (moreBtn) {
      moreBtnText.textContent = catExpanded ? 'Згорнути' : `Ще ${s.classes.length - 8} категорій`;
      moreBtn.classList.toggle('expanded', catExpanded);
    }
  };

  /** @type {HTMLElement | null} */
  let moreBtn = null;
  if (s.classes.length > 8) {
    moreBtn = h('button.sidebar-more-btn', {
      type: 'button',
      className: `sidebar-more-btn${catExpanded ? ' expanded' : ''}`,
      onclick: () => {
        catExpanded = !catExpanded;
        updateCatVisibility();
      },
    }, moreBtnText, moreBtnIcon);
  }

  s.classes.forEach((c, index) => {
    const count = s.mods.filter((m) => (m.cls || []).includes(c.id)).length;
    const row = h('div.sidebar-cat-row', {
      'data-cls': c.id,
      style: {
        '--c': c.color,
        display: (index < 8 || catExpanded) ? 'flex' : 'none',
      },
      title: c.desc || c.title,
      onclick: () => {
        if (state.cls.has(c.id)) {
          state.cls.delete(c.id);
        } else {
          state.cls.add(c.id);
        }
        draw();
      },
    },
      h('div.sidebar-cat-left', null,
        clsIcon(c.id, c.color),
        h('span.sidebar-cat-name', null, c.title),
        h('span.sidebar-cat-count', null, `(${count})`)
      ),
      h('span.sidebar-check-box', { html: checkSvg() })
    );
    if (state.cls.has(c.id)) row.classList.add('on');
    catRows.set(c.id, { el: row, index });
    catListWrap.append(row);
  });
  if (moreBtn) catListWrap.append(moreBtn);

  // Features grid
  const featGridWrap = h('div.sidebar-feat-grid');
  FEAT_ORDER.forEach((f) => {
    const count = s.mods.filter((m) => (m.features || []).includes(f)).length;
    const btn = h('button.sidebar-feat-btn', {
      type: 'button',
      'data-feat': f,
      style: { '--c': FEATS[f].color },
      title: FEATS[f].title,
      onclick: () => {
        if (state.feat.has(f)) {
          state.feat.delete(f);
        } else {
          state.feat.add(f);
        }
        draw();
      },
    },
      h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '5px' } },
        featIcon(f),
        h('span', null, FEATS[f].short)
      ),
      h('span.sidebar-feat-cnt', null, String(count))
    );
    if (state.feat.has(f)) btn.classList.add('on');
    featBtns.set(f, btn);
    featGridWrap.append(btn);
  });

  const switchRow = (label, input) => h('label.sidebar-switch-row', null,
    h('span', null, label),
    h('span.switch-control', null,
      input,
      h('span.switch-slider')
    )
  );

  const sidebar = h('aside.mods-sidebar', null,
    h('div.sidebar-search-wrap', null,
      searchInp,
      searchIconSvg()
    ),
    h('div.sidebar-select-wrap', null,
      sortSel,
      selectArrowSvg()
    ),
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Категорії'),
    catListWrap,
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Додає у світ'),
    featGridWrap,
    h('div.sidebar-divider'),
    h('div.sidebar-sec-title', null, 'Показати'),
    h('div.sidebar-switches', null,
      switchRow('Бібліотеки й оптимізація', libsChk),
      switchRow('Лише описані', curChk),
      switchRow('Без доповнень', noAddChk)
    )
  );

  const draw = () => {
    syncState();
    syncFilterUi();

    // Rebuild active chips
    const activeChips = [];
    if (state.text.trim()) {
      activeChips.push(h('span.mods-active-chip', null,
        `Пошук: "${state.text.trim()}"`,
        h('span.mods-active-chip-x', {
          title: 'Очистити пошук',
          onclick: () => {
            state.text = '';
            searchInp.value = '';
            draw();
          },
        }, '✕')
      ));
    }

    for (const cid of state.cls) {
      const c = s.classes.find((x) => x.id === cid);
      if (c) {
        activeChips.push(h('span.mods-active-chip', null,
          clsIcon(c.id, c.color),
          c.title,
          h('span.mods-active-chip-x', {
            title: `Зняти фільтр "${c.title}"`,
            onclick: () => {
              state.cls.delete(cid);
              draw();
            },
          }, '✕')
        ));
      }
    }

    for (const fid of state.feat) {
      const f = FEATS[fid];
      if (f) {
        activeChips.push(h('span.mods-active-chip', null,
          featIcon(fid),
          f.short,
          h('span.mods-active-chip-x', {
            title: `Зняти фільтр "${f.title}"`,
            onclick: () => {
              state.feat.delete(fid);
              draw();
            },
          }, '✕')
        ));
      }
    }

    if (state.libs) {
      activeChips.push(h('span.mods-active-chip', null,
        'З бібліотеками',
        h('span.mods-active-chip-x', {
          title: 'Приховати бібліотеки й оптимізацію',
          onclick: () => {
            state.libs = false;
            draw();
          },
        }, '✕')
      ));
    }

    if (state.curated) {
      activeChips.push(h('span.mods-active-chip', null,
        'Лише описані',
        h('span.mods-active-chip-x', {
          title: 'Показати всі моди',
          onclick: () => {
            state.curated = false;
            draw();
          },
        }, '✕')
      ));
    }

    if (state.noAddons) {
      activeChips.push(h('span.mods-active-chip', null,
        'Без доповнень',
        h('span.mods-active-chip-x', {
          title: 'Показати доповнення',
          onclick: () => {
            state.noAddons = false;
            draw();
          },
        }, '✕')
      ));
    }

    if (state.sort !== 'name') {
      activeChips.push(h('span.mods-active-chip', null,
        'За кількістю предметів',
        h('span.mods-active-chip-x', {
          title: 'Скинути сортування',
          onclick: () => {
            state.sort = 'name';
            draw();
          },
        }, '✕')
      ));
    }

    const hasAnyActive = Boolean(state.text.trim() || state.cls.size || state.feat.size || state.libs || state.curated || state.noAddons || state.sort !== 'name');
    if (hasAnyActive) {
      activeChips.push(h('button.mods-clear-all-btn', {
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

    mount(chipsWrap, activeChips);

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
      h('p.small.muted', { style: { margin: 0 } }, 'Пошук, фільтрація за категоріями, вмістом та особливостями модифікацій ATM11.')
    ),
    h('div.mods-top-bar', null,
      chipsWrap,
      counterEl
    ),
    grid
  );

  mount(el, h('div.mods-layout', null, sidebar, mainArea));
  draw();
}

/** @param {ModEntry} m */
const size = (m) => (m.counts?.item || 0) + (m.counts?.block || 0);
