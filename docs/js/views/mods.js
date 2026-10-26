// @ts-check
// Довідник модів: пошук, фільтр за класами й можливостями (виміри, боси, данжі…), приховування бібліотек, «лише описані», «без доповнень».
// Зберігає вибрані фільтри, пошук і сортування між переходами на картки модів.
import { h, mount, debounce } from '../core/dom.js';
import { modCard } from '../components/modcard.js';
import { FEATS, FEAT_ORDER, featIcon, clsIcon } from '../components/feat.js';
import { getViewState, setViewState } from '../core/view-state.js';

const HIDE_ROLES = new Set(['library', 'perf']);

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export function render(el, _p, s) {
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

  /** @type {Map<string, HTMLElement>} */
  const clsChips = new Map();
  /** @type {Map<string, HTMLElement>} */
  const featChips = new Map();
  const grid = h('div.grid');
  const count = h('span.small.muted');

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
    style: { minWidth: '260px' },
    oninput: debounce((e) => { state.text = e.target.value; draw(); }),
  }));
  const sortSel = /** @type {HTMLSelectElement} */ (h('select', {
    onchange: (e) => { state.sort = e.target.value; draw(); },
  },
    h('option', { value: 'name', selected: state.sort === 'name' }, 'За назвою'),
    h('option', { value: 'size', selected: state.sort === 'size' }, 'За кількістю предметів')));
  const libsChk = /** @type {HTMLInputElement} */ (h('input', { type: 'checkbox', checked: state.libs, onchange: (e) => { state.libs = e.target.checked; draw(); } }));
  const curChk = /** @type {HTMLInputElement} */ (h('input', { type: 'checkbox', checked: state.curated, onchange: (e) => { state.curated = e.target.checked; draw(); } }));
  const noAddChk = /** @type {HTMLInputElement} */ (h('input', { type: 'checkbox', checked: state.noAddons, onchange: (e) => { state.noAddons = e.target.checked; draw(); } }));
  const resetBtn = h('button.btn.small', {
    style: { display: 'none', padding: '4px 10px' },
    title: 'Скинути пошук і всі вибрані фільтри',
    onclick: () => {
      state.text = ''; state.cls.clear(); state.feat.clear();
      state.libs = false; state.curated = false; state.noAddons = false; state.sort = 'name';
      searchInp.value = ''; sortSel.value = 'name';
      libsChk.checked = false; curChk.checked = false; noAddChk.checked = false;
      clsChips.forEach((ch) => ch.classList.remove('on'));
      featChips.forEach((ch) => ch.classList.remove('on'));
      if (location.hash.includes('?')) history.replaceState(null, '', '#/mods');
      draw();
    },
  }, '✕ Скинути');

  const draw = () => {
    syncState();
    const hasActive = Boolean(state.text || state.cls.size || state.feat.size || state.libs || state.curated || state.noAddons || state.sort !== 'name');
    resetBtn.style.display = hasActive ? '' : 'none';
    const t = state.text.toLowerCase();
    let list = s.mods.filter((m) => (state.libs || !HIDE_ROLES.has(m.role))
      && (!state.curated || !m.auto) && (!state.noAddons || !m.parent)
      && (!state.cls.size || (m.cls || []).some((c) => state.cls.has(c)))
      && (!state.feat.size || [...state.feat].every((f) => (m.features || []).includes(f)))
      && (!t || `${m.id} ${m.name} ${m.uk || ''} ${m.desc_en || ''}`.toLowerCase().includes(t)));
    list = list.sort(state.sort === 'size'
      ? (a, b) => size(b) - size(a)
      : (a, b) => a.name.localeCompare(b.name, 'uk'));
    count.textContent = `показано ${list.length} з ${s.mods.length}`;
    mount(grid, list.length ? list.map((m) => modCard(s, m)) : h('div.empty', null, 'Нічого не знайдено'));
  };

  const chip = (c) => {
    const el = h('span.chip.cls-chip', {
      'data-cls': c.id,
      style: { '--c': c.color },
      title: c.desc,
      onclick: () => { state.cls.has(c.id) ? state.cls.delete(c.id) : state.cls.add(c.id); el.classList.toggle('on'); draw(); },
    }, clsIcon(c.id, c.color), c.title);
    if (state.cls.has(c.id)) el.classList.add('on');
    clsChips.set(c.id, el);
    return el;
  };
  const featChip = (f) => {
    const n = s.mods.filter((m) => (m.features || []).includes(f)).length;
    const el = h('span.chip.feat-chip', {
      'data-feat': f,
      style: { '--c': FEATS[f].color },
      title: FEATS[f].title,
      onclick: () => { state.feat.has(f) ? state.feat.delete(f) : state.feat.add(f); el.classList.toggle('on'); draw(); },
    }, featIcon(f), ` ${FEATS[f].short} `, h('span.small', null, String(n)));
    if (state.feat.has(f)) el.classList.add('on');
    featChips.set(f, el);
    return el;
  };
  mount(el,
    h('h1', null, 'Довідник модів'),
    h('div.toolbar', { style: { borderRadius: 'var(--radius)', marginBottom: '14px', border: '1px solid var(--line)' } },
      searchInp,
      sortSel,
      h('label.check.small', null, libsChk, 'бібліотеки й оптимізація'),
      h('label.check.small', null, curChk, 'лише описані'),
      h('label.check.small', null, noAddChk, 'без доповнень'),
      resetBtn,
      count),
    h('div.chips', { style: { marginBottom: '8px' } }, s.classes.map(chip)),
    h('div.chips', { style: { marginBottom: '16px', alignItems: 'center' } }, h('span.small.muted', null, 'Що додає у світ:'), FEAT_ORDER.map(featChip)),
    grid);
  draw();
}

/** @param {ModEntry} m */
const size = (m) => (m.counts?.item || 0) + (m.counts?.block || 0);
