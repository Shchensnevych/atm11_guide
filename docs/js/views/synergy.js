// @ts-check
// Мапа синергій (G7 / K36): #/synergy[?cls=<клас>][&pair=<a>,<b>][&stage=<етап>][&mod=<мод>].
// Ліворуч — список модів із синергіями (пошук, групи за класом, чесний фільтр етапу).
// Без вибраного мода — огляд «класи ↔ класи» (клік по класу або по дузі пари класів).
// Із модом — жива адаптивна хаб-схема зі sticky-центром і SVG-кривими без scale().
import { h, mount } from '../core/dom.js';
import { stageBadge } from '../components/badge.js';
import { clsIcon } from '../components/feat.js';
import { synergyEdges, filterByStage, degrees, modIcon, mainCls, clsColor, synCount, modCount, stageRange } from '../graph/syn-model.js';
import { classDiagram } from '../graph/synergy-classes.js';
import { mountEgoLines } from '../graph/synergy-ego.js';

/** @returns {Record<string, string>} */
const readParams = () => Object.fromEntries(new URLSearchParams(location.hash.split('?')[1] || ''));
/** @param {Record<string, string>} p */
function hrefWith(p) {
  const q = new URLSearchParams(Object.entries(p).filter(([, v]) => v)).toString();
  return `#/synergy${q ? `?${q}` : ''}`;
}

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export function render(el, _p, s) {
  el.classList.add('wide');
  const par = readParams();
  const edges = filterByStage(s, synergyEdges(s), par.stage || '');
  const deg = degrees(edges);
  const mod = par.mod && s.modById.has(par.mod) ? par.mod : '';
  const name = (/** @type {string} */ id) => s.modById.get(id)?.name || id;
  const chip = (/** @type {string} */ cls) => {
    const c = s.classById.get(cls);
    return c ? h('span.syn-chip', { style: { '--c': c.color } }, clsIcon(c.id, c.color), c.title) : null;
  };
  const keep = { stage: par.stage || '' };

  // --- список модів (ліворуч) ---
  const ids = [...deg.keys()].sort((a, b) => name(a).localeCompare(name(b)));
  const groups = s.classes.map((c) => ({ c, ids: ids.filter((id) => mainCls(s, id) === c.id) })).filter((g) => g.ids.length);
  const list = h('div.syn-list');
  const drawList = (/** @type {string} */ q) => {
    const ql = q.trim().toLowerCase();
    mount(list, groups.map((g) => {
      const rows = g.ids.filter((id) => !ql || name(id).toLowerCase().includes(ql) || id.includes(ql));
      if (!rows.length) return null;
      return h('div.syn-group', null,
        h(`a.syn-ghead${par.cls === g.c.id ? '.on' : ''}`, { href: hrefWith({ ...keep, cls: par.cls === g.c.id ? '' : g.c.id }), style: { '--c': g.c.color } },
          clsIcon(g.c.id, g.c.color), h('span', null, g.c.title), h('span.muted', null, String(rows.length))),
        rows.map((id) => h(`a.syn-row${id === mod ? '.on' : ''}`, { href: hrefWith({ ...keep, mod: id }) },
          modIcon(s, id, 'sm'), h('span.syn-row-name', null, name(id)), h('span.syn-n', null, String(deg.get(id))))));
    }));
  };
  const search = /** @type {HTMLInputElement} */ (h('input.syn-search', {
    type: 'search', placeholder: 'Знайти мод…', 'aria-label': 'Знайти мод у мапі синергій',
    oninput: (/** @type {Event} */ e) => drawList(/** @type {HTMLInputElement} */ (e.target).value),
  }));
  const stageSel = h('select.syn-sel', {
    'aria-label': 'Фільтр за етапом',
    title: 'Показує синергії, де обидва моди вже відкриті на обраному етапі',
    onchange: (/** @type {Event} */ e) => { location.hash = hrefWith({ ...par, stage: /** @type {HTMLSelectElement} */ (e.target).value }).slice(1); },
  }, h('option', { value: '' }, 'Усі етапи'), s.stages.map((x) => h('option', { value: x.id, selected: x.id === par.stage }, `${x.n}. ${x.title}`)));
  drawList('');
  const aside = h('aside.syn-aside', null, search, stageSel,
    h('div.small.muted.syn-total', null, `${modCount(deg.size)} · ${synCount(edges.length)}`), list);

  const main = h('section.syn-main');
  mount(el, h('div.syn-page', null, aside, main));
  if (mod) egoView(main, s, mod, edges, deg, keep, chip);
  else overview(main, s, edges, deg, par, keep, chip);
  el.querySelector('.syn-row.on')?.scrollIntoView({ block: 'center' });
}

/** Огляд: класи ↔ класи + моди класу / зв'язки пари класів / найзв'язаніші моди. */
function overview(/** @type {HTMLElement} */ main, /** @type {Store} */ s, /** @type {any[]} */ edges, /** @type {Map<string, number>} */ deg, /** @type {Record<string, string>} */ par, /** @type {Record<string, string>} */ keep, /** @type {(c: string) => any} */ chip) {
  const cls = par.cls && s.classById.has(par.cls) ? par.cls : '';
  const rawPair = (par.pair || '').split(',').filter((x) => s.classById.has(x));
  /** @type {[string, string] | null} */
  const pair = !cls && rawPair.length === 2 && rawPair[0] !== rawPair[1] ? [rawPair[0], rawPair[1]] : null;
  const name = (/** @type {string} */ id) => s.modById.get(id)?.name || id;

  const diagram = classDiagram(s, edges, {
    active: cls,
    pair,
    onPick: (c) => { location.hash = hrefWith({ ...keep, cls: c === cls ? '' : c }).slice(1); },
    onPickPair: (a, b) => {
      const next = [a, b].sort().join(',');
      const cur = pair ? [...pair].sort().join(',') : '';
      location.hash = hrefWith({ ...keep, pair: next === cur ? '' : next }).slice(1);
    },
  });

  let rightBox;
  if (pair) {
    const pSet = new Set(pair);
    const pEdges = edges.filter((e) => {
      const ca = mainCls(s, e.from), cb = mainCls(s, e.to);
      return ca !== cb && pSet.has(ca) && pSet.has(cb);
    }).sort((x, y) => name(x.from).localeCompare(name(y.from)) || name(x.to).localeCompare(name(y.to)));
    rightBox = h('div.syn-tiles-box', null,
      h('h2', null, chip(pair[0]), ' ↔ ', chip(pair[1]), ` · ${synCount(pEdges.length)}`),
      h('p.small', null, h('a', { href: hrefWith(keep) }, '← усі класи')),
      h('div.syn-pair-list', null, pEdges.map((e) => h('div.syn-pair-item', { style: { '--c': clsColor(s, mainCls(s, e.from)) } },
        h('div.syn-pair-mods', null,
          h('a.syn-pair-mod', { href: hrefWith({ ...keep, mod: e.from }) }, modIcon(s, e.from, 'sm'), name(e.from)),
          h('span.muted', null, '↔'),
          h('a.syn-pair-mod', { href: hrefWith({ ...keep, mod: e.to }) }, modIcon(s, e.to, 'sm'), name(e.to))),
        h('p.small', null, e.why)))));
  } else {
    const ids = [...deg.keys()].filter((id) => !cls || mainCls(s, id) === cls).sort((a, b) => (deg.get(b) || 0) - (deg.get(a) || 0) || a.localeCompare(b));
    const shown = cls ? ids : ids.slice(0, 12);
    const tile = (/** @type {string} */ id) => {
      const n = deg.get(id) || 0;
      return h('a.syn-tile', { href: hrefWith({ ...keep, mod: id }), style: { '--c': clsColor(s, mainCls(s, id)) } },
        modIcon(s, id, 'md'),
        h('span.syn-tile-name', null, name(id)),
        h('span.syn-tile-cnt', { title: synCount(n) }, String(n)));
    };
    rightBox = h('div.syn-tiles-box', null,
      h('h2', null, cls ? [chip(cls), ` — ${modCount(ids.length)}`] : 'Найбільше синергій'),
      cls ? h('p.small', null, h('a', { href: hrefWith(keep) }, '← усі класи')) : null,
      h('div.syn-tiles', null, shown.map(tile)));
  }

  mount(main,
    h('div.syn-head', null, h('h1', null, 'Мапа синергій'),
      h('p.muted', null, 'Синергія — моди, які краще працюють разом (спільний рецепт, механіка, сумісність), і це підтверджено файлами збірки. Клік по класу на колі показує його моди, клік по лінії — синергії між парою класів.')),
    h('div.syn-overview', null, h('div.syn-diagram', null, diagram), rightBox));
}

/** «Мод у центрі» (Варіант B): адаптивна хаб-схема зі sticky-центром і живими SVG-кривими. */
function egoView(/** @type {HTMLElement} */ main, /** @type {Store} */ s, /** @type {string} */ id, /** @type {any[]} */ edges, /** @type {Map<string, number>} */ deg, /** @type {Record<string, string>} */ keep, /** @type {(c: string) => any} */ chip) {
  const m = /** @type {any} */ (s.modById.get(id));
  const name = (/** @type {string} */ x) => s.modById.get(x)?.name || x;
  const ins = edges.filter((e) => e.to === id).map((e) => ({ e, pid: e.from, side: /** @type {'in'} */ ('in') }));
  const outs = edges.filter((e) => e.from === id).map((e) => ({ e, pid: e.to, side: /** @type {'out'} */ ('out') }));
  const byCls = (/** @type {{pid: string}} */ a, /** @type {{pid: string}} */ b) => mainCls(s, a.pid).localeCompare(mainCls(s, b.pid)) || name(a.pid).localeCompare(name(b.pid));
  const parts = [...outs.sort(byCls), ...ins.sort(byCls)].map((p, i) => ({ ...p, key: `p-${i}`, pcls: mainCls(s, p.pid) }));

  const center = h('div.syn-card.center', { style: { '--c': clsColor(s, mainCls(s, id)) } },
    h('div.syn-card-top', null, modIcon(s, id, 'lg'), h('div', null, h('h2', null, m.name), h('div.syn-chips', null, (m.cls || []).map(chip)))),
    m.stage?.length ? h('div.badges', null, m.stage.map((/** @type {string} */ x) => stageBadge(s, x))) : null,
    m.uk ? h('p.small', null, m.uk) : null,
    h('div.syn-card-foot', null, h('b', null, synCount(parts.length)), h('a.btn.small.primary', { href: `#/mod/${id}` }, 'Сторінка мода →')));

  /** @type {{ redraw: () => void, destroy: () => void } | null} */
  let lines = null;
  /** @type {HTMLElement[]} */
  const whyEls = [];

  const card = (/** @type {(typeof parts)[number]} */ p) => {
    const color = clsColor(s, p.pcls);
    const more = (deg.get(p.pid) || 1) - 1;
    const stText = stageRange(s, p.pid);
    const whyEl = h('p.syn-why', null, p.e.why);
    whyEls.push(whyEl);
    const moreBtn = h('button.syn-more', {
      type: 'button',
      hidden: true,
      onclick: () => {
        const open = whyEl.classList.toggle('open');
        moreBtn.textContent = open ? 'Згорнути ▴' : 'Читати повністю ▾';
        lines?.redraw();
      },
    }, 'Читати повністю ▾');
    whyEl.dataset.moreBtn = '1';
    /** @type {any} */ (whyEl)._moreBtn = moreBtn;

    const c = h(`div.syn-card.partner.${p.side}`, { 'data-syn-key': p.key, 'data-pcls': p.pcls, style: { '--c': color } },
      h('div.syn-card-top', null,
        modIcon(s, p.pid, 'md'),
        h('div.syn-card-head', null,
          h('h3', null, name(p.pid)),
          h('div.syn-chips', null, chip(p.pcls), stText ? h('span.syn-st-pill', null, stText) : null))),
      whyEl,
      moreBtn,
      p.e.ingame ? h('p.small.draft', null, '⚑ Перевірити в грі: ', p.e.ingame) : null,
      h('details.syn-src', { ontoggle: () => lines?.redraw() },
        h('summary', null, `Джерело · описано на сторінці «${name(p.e.from)}»`), h('div', null, p.e.src)),
      h('div.syn-card-foot', null,
        more > 0 ? h('a.btn.small', { href: hrefWith({ ...keep, mod: p.pid }), title: `Перейти: ${name(p.pid)} у центрі` }, `⊙ у центр · ще ${more}`) : null,
        h('a.btn.small', { href: `#/mod/${p.pid}` }, 'Сторінка мода')));
    return c;
  };

  const head = h('div.syn-head', null,
    h('p.small', null, h('a', { href: hrefWith(keep) }, '← огляд класів')),
    h('h1', null, `Синергії: ${m.name}`),
    h('p.muted.small', null, 'Кожна картка — з чим поєднувати, що це дає і звідки це у файлах збірки («Джерело»). «⊙ у центр» — перейти до синергій партнера.'));

  if (!parts.length) {
    mount(main, head, h('div.syn-ego.is-empty', null, center, h('p.muted', null, 'На обраному етапі синергій немає — спробуйте перемкнути фільтр етапів на «Усі етапи».')));
    return;
  }

  // Швидкий фільтр партнерів за класом для великих хабів (≥ 6 синергій і ≥ 2 класи партнерів)
  /** @type {Map<string, number>} */
  const pClsCounts = new Map();
  for (const p of parts) pClsCounts.set(p.pcls, (pClsCounts.get(p.pcls) || 0) + 1);
  let activePCls = '';

  const leftCol = h('div.syn-col.syn-col-left');
  const rightCol = h('div.syn-col.syn-col-right');
  const midCol = h('div.syn-col.syn-col-mid', null, h('div.syn-sticky-wrap', null, center));

  const syncMore = () => {
    for (const w of whyEls) {
      if (!w.isConnected) continue;
      const btn = /** @type {HTMLElement | undefined} */ (/** @type {any} */ (w)._moreBtn);
      if (!btn) continue;
      const isOpen = w.classList.contains('open');
      btn.hidden = !isOpen && w.scrollHeight <= w.clientHeight + 2;
    }
  };

  const cardNodes = parts.map(card);
  const placeCards = () => {
    leftCol.replaceChildren();
    rightCol.replaceChildren();
    const visible = cardNodes.filter((n) => !activePCls || n.dataset.pcls === activePCls);
    if (visible.length === 1) {
      rightCol.append(visible[0]);
      ego.classList.add('is-single');
    } else {
      ego.classList.remove('is-single');
      visible.forEach((n, i) => (i % 2 === 0 ? leftCol : rightCol).append(n));
    }
    requestAnimationFrame(() => {
      syncMore();
      lines?.redraw();
    });
  };

  const ego = h('div.syn-ego', null, leftCol, midCol, rightCol);

  let pFilter = null;
  if (parts.length >= 6 && pClsCounts.size >= 2) {
    const btns = /** @type {HTMLButtonElement[]} */ ([]);
    const mkBtn = (/** @type {string} */ clsId, /** @type {string} */ label, /** @type {string} */ color) => {
      const b = /** @type {HTMLButtonElement} */ (h(`button.syn-pf-btn${clsId === '' ? '.on' : ''}`, {
        type: 'button',
        style: color ? { '--c': color } : undefined,
        onclick: () => {
          activePCls = clsId;
          btns.forEach((x) => x.classList.toggle('on', x === b));
          placeCards();
        },
      }, clsId ? clsIcon(clsId, color) : null, label));
      btns.push(b);
      return b;
    };
    const items = [mkBtn('', `Усі (${parts.length})`, '')];
    for (const c of s.classes) {
      const cnt = pClsCounts.get(c.id);
      if (cnt) items.push(mkBtn(c.id, `${c.title} (${cnt})`, c.color));
    }
    pFilter = h('div.syn-pfilter', { role: 'group', 'aria-label': 'Фільтр партнерів за класом' }, items);
  }

  mount(main, head, pFilter, ego);
  placeCards();
  lines = mountEgoLines(ego, center);
  const roMore = new ResizeObserver(() => {
    if (!ego.isConnected) { roMore.disconnect(); return; }
    syncMore();
  });
  roMore.observe(ego);
}
