// @ts-check
// Мапа синергій (G7): #/synergy[?cls=<клас>][&stage=<етап>][&mod=<мод>].
// Ліворуч — список модів із синергіями (пошук, групи за класом, етап). Без вибраного мода — огляд «класи ↔ класи»
// (graph/synergy-classes.js) і моди класу; з модом — «мод у центрі» (graph/synergy-ego.js, ELK як на дорожній карті):
// картки партнерів із повною назвою, поясненням і джерелом, лінії — до центрального мода. Дані — лише docs/data/mods.json.
import { h, mount } from '../core/dom.js';
import { stageBadge } from '../components/badge.js';
import { synergyEdges, filterByStage, degrees, modIcon, mainCls, clsColor } from '../graph/syn-model.js';
import { classDiagram } from '../graph/synergy-classes.js';
import { layoutEgo } from '../graph/synergy-ego.js';

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
  const chip = (/** @type {string} */ cls) => { const c = s.classById.get(cls); return c ? h('span.syn-chip', { style: { '--c': c.color } }, `${c.icon || ''} ${c.title}`) : null; };
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
          `${g.c.icon || ''} ${g.c.title}`, h('span.muted', null, ` ${rows.length}`)),
        rows.map((id) => h(`a.syn-row${id === mod ? '.on' : ''}`, { href: hrefWith({ ...keep, mod: id }) }, modIcon(s, id, 'sm'), h('span.syn-row-name', null, name(id)), h('span.syn-n', null, String(deg.get(id))))));
    }));
  };
  const search = /** @type {HTMLInputElement} */ (h('input.syn-search', { type: 'search', placeholder: 'Знайти мод…', 'aria-label': 'Знайти мод у мапі синергій', oninput: (/** @type {Event} */ e) => drawList(/** @type {HTMLInputElement} */ (e.target).value) }));
  const stageSel = h('select.syn-sel', { 'aria-label': 'Етап', onchange: (/** @type {Event} */ e) => { location.hash = hrefWith({ ...par, stage: /** @type {HTMLSelectElement} */ (e.target).value }).slice(1); } },
    h('option', { value: '' }, 'Усі етапи'), s.stages.map((x) => h('option', { value: x.id, selected: x.id === par.stage }, x.title)));
  drawList('');
  const aside = h('aside.syn-aside', null, search, stageSel, h('div.small.muted.syn-total', null, `${deg.size} модів · ${edges.length} синергій`), list);

  const main = h('section.syn-main');
  mount(el, h('div.syn-page', null, aside, main));
  if (mod) egoView(main, s, mod, edges, deg, keep, chip);
  else overview(main, s, edges, deg, par, keep, chip);
  el.querySelector('.syn-row.on')?.scrollIntoView({ block: 'center' });
}

/** Огляд: класи ↔ класи + моди класу (або найзв'язаніші моди). */
function overview(/** @type {HTMLElement} */ main, /** @type {Store} */ s, /** @type {any[]} */ edges, /** @type {Map<string, number>} */ deg, /** @type {Record<string, string>} */ par, /** @type {Record<string, string>} */ keep, /** @type {(c: string) => any} */ chip) {
  const cls = par.cls && s.classById.has(par.cls) ? par.cls : '';
  const ids = [...deg.keys()].filter((id) => !cls || mainCls(s, id) === cls).sort((a, b) => (deg.get(b) || 0) - (deg.get(a) || 0) || a.localeCompare(b));
  const shown = cls ? ids : ids.slice(0, 12);
  const tile = (/** @type {string} */ id) => h('a.syn-tile', { href: hrefWith({ ...keep, mod: id }), style: { '--c': clsColor(s, mainCls(s, id)) } },
    modIcon(s, id, 'md'), h('span.syn-tile-name', null, s.modById.get(id)?.name || id), h('span.syn-n', null, `${deg.get(id)} синергій`));
  mount(main,
    h('div.syn-head', null, h('h1', null, 'Мапа синергій'),
      h('p.muted', null, 'Синергія — моди, які краще працюють разом (спільний рецепт, механіка, сумісність), і це підтверджено файлами збірки. Коло — як пов\'язані класи модів; клік по класу — його моди. Виберіть мод у списку чи нижче — побачите, з чим його поєднувати і чому.')),
    h('div.syn-overview', null,
      h('div.syn-diagram', null, classDiagram(s, edges, { active: cls, onPick: (c) => { location.hash = hrefWith({ ...keep, cls: c === cls ? '' : c }).slice(1); } })),
      h('div.syn-tiles-box', null,
        h('h2', null, cls ? [chip(cls), ` — моди з синергіями: ${ids.length}`] : 'Найбільше синергій'),
        cls ? h('p.small', null, h('a', { href: hrefWith(keep) }, '← усі класи')) : null,
        h('div.syn-tiles', null, shown.map(tile)))));
}

/** «Мод у центрі»: ELK зліва направо, картки партнерів із поясненням. */
function egoView(/** @type {HTMLElement} */ main, /** @type {Store} */ s, /** @type {string} */ id, /** @type {any[]} */ edges, /** @type {Map<string, number>} */ deg, /** @type {Record<string, string>} */ keep, /** @type {(c: string) => any} */ chip) {
  const m = /** @type {any} */ (s.modById.get(id));
  const name = (/** @type {string} */ x) => s.modById.get(x)?.name || x;
  const ins = edges.filter((e) => e.to === id).map((e) => ({ e, pid: e.from, side: /** @type {'in'} */ ('in') }));
  const outs = edges.filter((e) => e.from === id).map((e) => ({ e, pid: e.to, side: /** @type {'out'} */ ('out') }));
  const byCls = (/** @type {{pid: string}} */ a, /** @type {{pid: string}} */ b) => mainCls(s, a.pid).localeCompare(mainCls(s, b.pid)) || name(a.pid).localeCompare(name(b.pid));
  // обидві колонки — порівну (ліворуч / праворуч від мода), щоб мод був посередині, а не під довгим стовпцем;
  // хто описав синергію — у картці («описано на сторінці …»)
  const parts = [...outs.sort(byCls), ...ins.sort(byCls)].map((p, i) => ({ ...p, lay: i % 2 ? 'out' : 'in' }));
  const center = h('div.syn-card.center', { 'data-id': '__c' },
    h('div.syn-card-top', null, modIcon(s, id, 'lg'), h('div', null, h('h2', null, m.name), h('div.syn-chips', null, (m.cls || []).map(chip)))),
    m.stage?.length ? h('div.badges', null, m.stage.map((/** @type {string} */ x) => stageBadge(s, x))) : null,
    m.uk ? h('p.small', null, m.uk) : null,
    h('div.syn-card-foot', null, h('b', null, `${parts.length} синергій`), h('a.btn.small.primary', { href: `#/mod/${id}` }, 'Сторінка мода →')));
  const card = (/** @type {{e: any, pid: string, side: string, lay?: string}} */ p) => {
    const key = `${p.lay || p.side}:${p.pid}`;
    const color = clsColor(s, mainCls(s, p.pid));
    const more = (deg.get(p.pid) || 1) - 1;
    const c = h(`div.syn-card.${p.side}`, { 'data-id': key, style: { '--c': color } },
      h('div.syn-card-top', null, modIcon(s, p.pid, 'md'), h('div', null, h('h3', null, name(p.pid)), h('div.syn-chips', null, chip(mainCls(s, p.pid))))),
      h('p.syn-why', { title: 'Клік — повний текст', onclick: (/** @type {Event} */ ev) => { /** @type {HTMLElement} */ (ev.currentTarget).classList.toggle('open'); relayout?.(); } }, p.e.why),
      p.e.ingame ? h('p.small.draft', null, '⚑ Перевірити в грі: ', p.e.ingame) : null,
      h('details.syn-src', null, h('summary', null, `Джерело · описано на сторінці «${name(p.e.from)}»`), h('div', null, p.e.src)),
      h('div.syn-card-foot', null,
        more > 0 ? h('a.btn.small', { href: hrefWith({ ...keep, mod: p.pid }), title: `Перейти: ${name(p.pid)} у центрі` }, `⊙ у центр · ще ${more}`) : null,
        h('a.btn.small', { href: `#/mod/${p.pid}` }, 'Сторінка мода')));
    c.addEventListener('mouseenter', () => main.querySelector(`path.syn-edge[data-for="${key}"]`)?.classList.add('hl'));
    c.addEventListener('mouseleave', () => main.querySelector(`path.syn-edge[data-for="${key}"]`)?.classList.remove('hl'));
    c.querySelector('details')?.addEventListener('toggle', () => relayout?.());   // розгорнуте джерело змінює висоту картки
    return c;
  };
  const head = h('div.syn-head', null,
    h('p.small', null, h('a', { href: hrefWith(keep) }, '← огляд класів')),
    h('h1', null, `Синергії: ${m.name}`),
    h('p.muted.small', null, 'Кожна картка — з чим поєднувати, що це дає і де це у файлах збірки («Джерело»). «⊙ у центр» — перейти до синергій партнера.'));
  const narrow = window.matchMedia('(max-width: 900px)').matches;
  if (narrow || !parts.length) {
    mount(main, head, center,
      outs.length ? h('h2.syn-col-h', null, 'Описано на сторінці мода') : null, outs.map(card),
      ins.length ? h('h2.syn-col-h', null, 'Описано на сторінках партнерів') : null, ins.map(card));
    main.classList.add('stacked');
    return;
  }
  const stage = h('div.syn-stage', null, center, parts.map(card));
  stage.querySelectorAll('.syn-card').forEach((c) => { /** @type {HTMLElement} */ (c).style.visibility = 'hidden'; });
  const box = h('div.syn-ego');
  box.append(stage);
  mount(main, head, box);
  /** @type {(() => void) | null} */
  let relayout = null;
  const doLayout = async () => {
    if (!box.isConnected) return;
    try {
      const keyed = parts.map((p) => ({ id: `${p.lay}:${p.pid}`, color: clsColor(s, mainCls(s, p.pid)), side: p.lay }));
      const { width, height } = await layoutEgo(stage, '__c', /** @type {any} */ (keyed));
      const k = Math.min(1, (box.clientWidth - 4) / width);
      stage.style.transform = k < 1 ? `scale(${k})` : '';
      box.style.height = `${Math.ceil(height * k)}px`;
    } catch (err) {
      console.error(err);
      stage.querySelectorAll('.syn-card').forEach((c) => { /** @type {HTMLElement} */ (c).style.cssText = ''; });
      main.classList.add('stacked');
    }
  };
  relayout = () => { stage.style.transform = ''; doLayout(); };
  requestAnimationFrame(doLayout);
}
