// @ts-check
// Вкладка «Клавіші» (#/keys[?q=пошук][&k=шар|прив'язка]). Компонування 3 колонки:
//   ліворуч — сайдбар фільтрів (шар, контексти, зони-виноски, налаштування розкладки й плану);
//   по центру — заголовок зі статистикою, легенда станів НАД клавіатурою, центрована клавіатура + миша, опис колізій знизу;
//   праворуч — панель на всю висоту: вкладки «Дії» (пошук, «За клавішами / категоріями / модами», фільтри) і «План».
import { h, mount, debounce } from '../core/dom.js';
import { loadKeys, syncBridgeOptions, getActiveBridgeBase, analyze, layerOf, comboText, actLevel, parseSuggest, withPlan, UNBOUND, MOD_TITLE, pretty } from '../core/keys-model.js';
import { keyboard, mouse } from '../components/keyboard.js';
import { keysList, keyPanel, modName } from '../components/keys-list.js';
import { keyCards, planSection } from '../components/keys-side.js';
import { wizardSection, wizardCount } from '../components/keys-wizard.js';
import { companionReserved } from '../core/keys-suggest.js';
import { drawCallouts, linkLine } from '../components/callouts.js';
import { keysDashboard } from '../components/keys-dash.js';
import { setupTopbarOptions, buildZoneCallouts } from '../components/keys-topbar.js';
import { checkSvg } from '../components/filter-sidebar.js';

const LS = 'atm11.keys.view';
const LAYERS = ['', 'S', 'C', 'A', 'F3'];
const CTX_UI = ['game', 'held', 'vehicle', 'gui'];
const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } };
const lsSet = (/** @type {any} */ v) => { try { localStorage.setItem(LS, JSON.stringify(v)); } catch { /* приватний режим */ } };

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export async function render(el, _p, s) {
  let kd = await loadKeys();
  const qs = new URLSearchParams(location.hash.split('?')[1] || '');
  const saved = lsGet();
  const st = {
    layout: /** @type {'tkl'|'full'} */ (saved.layout === 'full' ? 'full' : 'tkl'),
    color: /** @type {'state'|'cat'} */ ('state'),
    plan: Boolean(saved.plan),
    layer: String(saved.layer || ''),
    cat: String(saved.cat || ''),
    ctxOn: new Set([...CTX_UI, 'debug']),
    sel: String(saved.sel || ''),
    hl: '',
    tab: String(saved.tab || 'acts'),
    group: /** @type {'key'|'cat'|'mod'} */ (saved.group || 'key'),
    q: qs.has('q') ? (qs.get('q') || '') : String(saved.q || ''),
    filter: String(saved.filter || 'all'),
  };
  const k0 = qs.get('k');
  if (k0 && k0.includes('|')) { const [l, b] = k0.split('|'); st.layer = l; st.sel = b; }
  if (qs.has('q') && st.q) st.group = 'cat';
  const save = () => lsSet({ layout: st.layout, group: st.group, plan: st.plan, layer: st.layer, cat: st.cat, sel: st.sel, tab: st.tab, q: st.q, filter: st.filter });

  /** Сполучення компаньйона (Alt+Q, Push-to-Talk) — майстер їх не пропонує; PTT уточнюється з моста. */
  let reserved = companionReserved('Mouse5', 'Миша 5 (типово)');
  /** @type {KeyAct[]} */ let keys = kd.keys;
  /** @type {Map<string, any>} */ let by = analyze(keys, st.ctxOn);
  /** @type {Set<string>} */ let planned = new Set();
  const recalc = () => {
    keys = st.plan ? withPlan(kd.keys) : kd.keys;
    by = analyze(keys, st.ctxOn);
    planned = new Set(st.plan ? keys.filter((k) => k.was && k.bind !== UNBOUND).map((k) => layerOf(k) + '|' + k.bind) : []);
  };

  el.className = 'view keys-view-page';
  const tip = h('div.kb-tip');
  const sidebar = h('aside.keys-sidebar');
  const headBox = h('div.keys-head-box');
  const legendBox = h('div.kb-legend-wrap');
  const stage = h('div.kb-stage', null, h('div.co-top'), h('div.kb-holder'), h('div.co-bot'));
  const holder = /** @type {HTMLElement} */ (stage.querySelector('.kb-holder'));
  const cardBox = h('div.kcard-box');
  const panelBody = h('div.kp-body');
  const panelTools = h('div.kp-tools');
  const tabsBox = h('div.kp-tabs');
  const panel = h('aside.keys-panel', null, tabsBox, panelTools, panelBody);
  const center = h('div.keys-center', null, headBox, legendBox, stage, cardBox);
  const layout = h('div.keys-layout', null, sidebar, center, panel);

  setupTopbarOptions(kd);

  let tipT = 0;
  const showTip = (/** @type {string|null} */ bind, /** @type {HTMLElement|undefined} */ at) => {
    clearTimeout(tipT);
    if (!bind || !at || (st.cat && innerWidth >= 1100)) { tipT = window.setTimeout(() => tip.classList.remove('on'), 160); return; }
    tipT = window.setTimeout(() => {
      const v = by.get(st.layer + '|' + bind);
      if (!v) return;
      mount(tip,
        h('div.tip-h', null, (st.layer ? MOD_TITLE[st.layer] + '+' : '') + pretty(bind),
          v.lvl ? h(`span.small.lv${v.lvl}`, null, v.lvl === 2 ? '  ⚠ конфлікт' : '  ◐ можливий') : null),
        h('ul', null, v.acts.map((/** @type {KeyAct} */ k) => h('li', null, h(`i.cdot.${k.ctx}`), k.name, h('span.muted', null, ` · ${modName(s, k)}`)))),
        h('div.small.muted', null, 'клік — закріпити картку дій знизу'));
      const r = at.getBoundingClientRect();
      tip.classList.add('on');
      const tw = tip.offsetWidth;
      const th = tip.offsetHeight;
      tip.style.left = Math.max(8, Math.min(innerWidth - tw - 8, r.left + r.width / 2 - tw / 2)) + 'px';
      tip.style.top = (r.top - th - 8 > 8 ? r.top - th - 8 : r.bottom + 8) + 'px';
    }, 120);
  };

  const lit = (/** @type {string|null} */ bind) => {
    stage.querySelectorAll('.lit').forEach((x) => x.classList.remove('lit'));
    if (bind) {
      for (const part of String(bind).split(',')) {
        const b = part.trim();
        if (b) stage.querySelectorAll(`[data-bind="${CSS.escape(b)}"]`).forEach((x) => x.classList.add('lit'));
      }
    }
  };

  const onKeyHover = (/** @type {string|null} */ bind, /** @type {MouseEvent|undefined} */ e) => {
    lit(bind);
    showTip(bind, /** @type {any} */ (e?.currentTarget));
  };

  const onCardHover = (/** @type {string|null} */ bind, /** @type {HTMLElement|undefined} */ card) => {
    lit(bind);
    const key = bind ? holder.querySelector(`.kb-wrap [data-bind="${CSS.escape(bind)}"]`) : null;
    if (innerWidth >= 1100) linkLine(layout, key, card || null); else linkLine(layout, null, null);
  };

  const select = (/** @type {string} */ l, /** @type {string} */ b) => {
    st.layer = l; st.sel = b; save(); drawSidebar(); drawKb(); drawCard(); drawPanel();
  };

  /** @param {string} bind @param {string} [targetLayer] */
  const pick = (bind, targetLayer) => {
    tip.classList.remove('on');
    if (typeof targetLayer === 'string' && targetLayer !== st.layer) {
      st.layer = targetLayer;
      st.sel = bind;
      save();
      drawSidebar();
      drawKb();
      drawCard();
      drawPanel();
    } else {
      st.sel = st.sel === bind ? '' : bind;
      save();
      drawKb();
      drawCard();
    }
    if (st.sel) requestAnimationFrame(() => {
      const r = cardBox.getBoundingClientRect();
      const cr = center.getBoundingClientRect();
      if (r.top > cr.bottom - 40 || r.top < cr.top) {
        center.scrollTo({ top: cardBox.offsetTop - 20, behavior: 'smooth' });
      }
    });
  };

  const pickAct = (/** @type {KeyAct} */ k) => {
    const kk = st.plan ? keys.find((x) => x.id === k.id) || k : k;
    if (kk.bind === UNBOUND) return;
    select(layerOf(kk), kk.bind);
  };

  /** Підсвітити сполучення на клавіатурі (порада плану, варіант майстра); null — зняти. @param {string|null} l @param {string} [bind] */
  const preview = (l, bind) => {
    if (l === null || !bind) { if (st.hl) { st.hl = ''; drawKb(); } return; }
    if (l !== st.layer) { st.layer = l; drawSidebar(); }
    st.hl = bind;
    drawKb();
  };
  const onSug = (/** @type {KeyAct|null} */ k) => {
    if (!k || !k.plan || k.plan === 'none') { preview(null); return; }
    const p = parseSuggest(k.plan);
    preview(p.l, p.bind);
  };

  function fitU() {
    const W = (st.layout === 'full' ? 22.5 : 18.25) + 4.35;
    const pad = innerWidth <= 1440 ? 44 : 72;
    const availableW = Math.max(300, center.clientWidth - pad);
    const byW = availableW / W;
    const byH = Math.max(30, (innerHeight - (innerHeight <= 800 ? 255 : 340)) / 6.5);
    const minU = st.layout === 'full' ? 28 : 30;
    stage.style.setProperty('--u', Math.max(minU, Math.min(68, Math.floor(Math.min(byW, byH)))) + 'px');
  }

  function drawHead() {
    const all = analyze(keys, new Set([...CTX_UI, 'debug']));
    const nConf = [...all.values()].filter((v) => v.lvl === 2).length;
    const nMaybe = [...all.values()].filter((v) => v.lvl === 1).length;
    const nUnb = keys.filter((k) => k.bind === UNBOUND).length;
    const nImp = keys.filter((k) => k.bind === UNBOUND && k.imp).length;

    mount(headBox,
      h('div.keys-head-row', null,
        h('h1', null, '⌨️ Клавіші'),
        h('div.kh-stats', null,
          h('span.kh-stat-item', null, h('b', null, String(keys.length)), ' дій'),
          h('span.kh-stat-item', null, h('b', null, String(nUnb)), ' непризначено'),
          nConf > 0
            ? h('span.kh-stat-item.lv2', { title: 'Клавіші з кількома діями в одному контексті' }, h('b', null, String(nConf)), ' конфліктів ⚠️')
            : h('span.kh-stat-item.ok', null, 'конфліктів немає ✔'),
          nMaybe > 0
            ? h('span.kh-stat-item.lv1', { title: 'Можливі перетини в суміжних контекстах' }, h('b', null, String(nMaybe)), ' можливих')
            : null,
          nImp > 0
            ? h('span.kh-stat-item.imp', { title: 'Важливі дії з модами, які не мають прив\'язки' }, '★ ', h('b', null, String(nImp)), ' важливих')
            : null,
          st.plan ? h('span.kh-stat-item.sug', null, '🛠 з планом') : null,
        ),
      ),
    );
  }

  function drawLegend() {
    mount(legendBox, h('div.kb-legend', null,
      h('div.kb-legend-states', null,
        [['free', 'вільна'], ['one', '1 дія'], ['multi', 'різні контексти'], ['maybe', 'можливий конфлікт'], ['conflict', 'конфлікт']].map(([c, t]) =>
          h('span.kb-leg-item', null, h(`i.st-${c}`), t),
        ),
        h('span.kb-leg-item', null, h('i.st-gui-dash'), 'лише в інтерфейсі'),
        st.plan ? h('span.kb-leg-item', null, h('i.planned-i'), 'змінено планом') : null,
      ),
      h('div.kb-legend-hint', null, '💡 Клік по клавіші — закріпити картку дій знизу'),
    ));
  }

  function drawSidebar() {
    const cnt = (/** @type {string} */ l) => [...by.keys()].filter((c) => c.split('|')[0] === l).length;
    const n = (/** @type {string} */ cat) => [...by.entries()].filter(([c, v]) => c.split('|')[0] === st.layer && v.acts.some((/** @type {KeyAct} */ a) => a.cat === cat)).length;
    const setCat = (/** @type {string} */ c) => { st.cat = c; save(); drawSidebar(); drawKb(); drawPanel(); };

    const seg = (/** @type {string[][]} */ opts, /** @type {string} */ cur, /** @type {(v: string) => void} */ on) =>
      h('div.seg.full', null, opts.map(([v, t]) => h(`button${cur === v ? '.on' : ''}`, { type: 'button', onclick: () => on(v) }, t)));

    mount(sidebar,
      h('div.sidebar-sec-title', null, 'Шар модифікатора'),
      h('div.kb-side-layers', null, LAYERS.map((l) => {
        const count = cnt(l);
        const active = st.layer === l;
        return h(`button.kb-side-row${active ? '.on' : ''}`, {
          type: 'button',
          onclick: () => { st.layer = l; st.sel = ''; save(); drawAll(); },
        },
          h('span.kb-side-row-name', null, l ? MOD_TITLE[l] : 'Без модифікатора'),
          h('span.kb-side-cnt', null, String(count)),
        );
      })),

      h('div.sidebar-divider'),

      h('div.sidebar-sec-title', null, 'Контексти гри'),
      h('div.sidebar-cat-list', null, CTX_UI.map((c) => {
        const info = kd.ctxs.find((/** @type {any} */ x) => x.id === c);
        const active = st.ctxOn.has(c);
        return h(`div.sidebar-cat-row${active ? '.on' : ''}`, {
          onclick: () => {
            if (st.ctxOn.has(c)) st.ctxOn.delete(c); else st.ctxOn.add(c);
            recalc(); drawAll();
          },
          title: info?.desc || info?.title || c,
        },
          h('div.sidebar-cat-left', null, h(`i.cdot.${c}`), h('span.sidebar-cat-name', null, info?.title || c)),
          h('span.sidebar-check-box' + (active ? '.checked' : ''), { html: checkSvg() }),
        );
      })),

      h('div.sidebar-divider'),

      h('div.sidebar-sec-head', null,
        h('div.sidebar-sec-title', null, 'Зони дій (виноски)'),
        st.cat ? h('button.zone-clear-btn', { type: 'button', onclick: () => setCat(''), title: 'Скинути вибір зони' }, '✕ Скинути') : null,
      ),
      h('div.sidebar-cat-list', null,
        h(`div.sidebar-cat-row${st.cat ? '' : '.on'}`, { onclick: () => setCat('') },
          h('div.sidebar-cat-left', null, h('span.zone-icon', null, '🌐'), h('span.sidebar-cat-name', null, 'Усі зони')),
          h('span.sidebar-check-box' + (st.cat ? '' : '.checked'), { html: checkSvg() }),
        ),
        kd.cats.map((/** @type {any} */ c) => {
          const k = n(c.id);
          const active = st.cat === c.id;
          return h(`div.sidebar-cat-row${active ? '.on' : ''}${!k ? '.disabled' : ''}`, {
            onclick: () => setCat(active ? '' : c.id),
            title: k ? `Показати виноски дій для «${c.title}» (${k})` : `Немає дій на шарі ${st.layer ? MOD_TITLE[st.layer] : 'без мод.'} (${c.title})`,
          },
            h('div.sidebar-cat-left', null, h('span.zone-icon', null, c.icon), h('span.sidebar-cat-name', null, c.title)),
            h('span.sidebar-cat-count', null, `(${k})`),
            h('span.sidebar-check-box' + (active ? '.checked' : ''), { html: checkSvg() }),
          );
        }),
      ),

      h('div.sidebar-divider'),

      h('div.sidebar-sec-title', null, 'Налаштування'),
      h('div.sidebar-switch-group', null,
        h('div.sidebar-sub-lbl', null, 'Клавіші'),
        seg([['now', 'Як зараз'], ['plan', 'З планом']], st.plan ? 'plan' : 'now', (v) => {
          st.plan = v === 'plan'; save(); recalc(); drawAll();
        }),
      ),
      h('div.sidebar-switch-group.mt', null,
        h('div.sidebar-sub-lbl', null, 'Розкладка'),
        seg([['tkl', 'TKL 87'], ['full', 'Повна 104']], st.layout, (v) => {
          st.layout = /** @type {any} */ (v); save(); drawSidebar(); drawKb();
        }),
      ),
    );
  }

  function drawKb() {
    /** @type {import('../components/keyboard.js').KbOpts} */
    const o = { layout: st.layout, layer: st.layer, by, sel: st.sel, hl: st.hl, color: st.color, cat: st.cat, planned, onPick: (b) => pick(b), onHover: onKeyHover };
    mount(holder, h(`div.kb-wrap${st.layout === 'full' ? '.full' : ''}`, null, keyboard(o), mouse(o)));
    fitU();
    const items = buildZoneCallouts(s, by, st.layer, st.cat);
    requestAnimationFrame(() => drawCallouts(stage, items, { onHover: (b) => lit(b), onPick: (b) => pick(b) }));
  }

  function drawCard() {
    const dashNode = keysDashboard(s, kd, st, by, {
      onPick: (b, l) => pick(b, l),
      onHover: (b) => lit(b),
    });

    if (st.sel) {
      const pinNode = h('div.kcard-pin', null,
        h('button.kc-close', { onclick: () => pick(st.sel), title: 'Закрити картку дій' }, '✕ Закрити'),
        keyPanel(s, kd, st.layer, st.sel, by),
      );
      mount(cardBox, pinNode, dashNode);
    } else {
      mount(cardBox, dashNode);
    }
  }

  function drawPanel() {
    mount(tabsBox, [['acts', 'Дії'], ['wiz', `🧭 Майстер · ${wizardCount(kd.keys, reserved)}`], ['plan', `🛠 План · ${kd.keys.filter((k) => k.plan).length}`]].map(([v, t]) =>
      h(`button${st.tab === v ? '.on' : ''}`, { onclick: () => { st.tab = v; save(); drawPanel(); } }, t)));
    if (st.tab === 'plan') { mount(panelTools); mount(panelBody, planSection(s, kd, kd.keys, pickAct)); return; }
    if (st.tab === 'wiz') { mount(panelTools); mount(panelBody, wizardSection(s, kd, kd.keys, { reserved, onPreview: preview })); return; }
    const byKey = st.group === 'key' && (st.filter === 'all' || st.filter === 'conf');
    mount(panelTools,
      h('input', { type: 'search', placeholder: 'Пошук: дія, мод, клавіша…', value: st.q, oninput: debounce((/** @type {Event} */ e) => { st.q = /** @type {HTMLInputElement} */ (e.target).value; save(); drawList(); }, 120) }),
      h('div.seg.full', null, [['key', 'За клавішами'], ['cat', 'За категоріями'], ['mod', 'За модами']].map(([v, t]) =>
        h(`button${st.group === v ? '.on' : ''}`, { onclick: () => { st.group = /** @type {any} */ (v); save(); drawPanel(); } }, t))),
      h('div.kp-filters', null, [['all', 'Усі'], ['conf', 'Зіткнення'], ['unb', 'Не призначено'], ['imp', '★ Важливі непризначені'], ['plan', '🛠 У плані']].map(([v, t]) =>
        h(`span.chip${st.filter === v ? '.on' : ''}`, { onclick: () => { st.filter = v; save(); drawPanel(); } }, t))),
      byKey ? h('div.small.muted', null, `Шар «${st.layer ? MOD_TITLE[st.layer] : 'без модифікатора'}»${st.cat ? ' · зона ' + kd.cats.find((/** @type {any} */ c) => c.id === st.cat)?.title : ''} — у порядку клавіатури`) : null);
    drawList();
  }

  function drawList() {
    linkLine(layout, null, null);
    if (st.group === 'key' && (st.filter === 'all' || st.filter === 'conf')) {
      mount(panelBody, keyCards(s, kd, by, st.layer, { cat: st.cat, q: st.q, conf: st.filter === 'conf', onHover: onCardHover, onPick: (b) => pick(b) }));
      return;
    }
    const q = st.q.trim().toLowerCase();
    const list = keys.filter((k) => {
      if (k.ctx !== 'debug' && !st.ctxOn.has(k.ctx)) return false;
      if (st.cat && k.cat !== st.cat) return false;
      const unb = k.bind === UNBOUND;
      if (st.filter === 'conf' && (unb || actLevel(k, by) === 0)) return false;
      if (st.filter === 'unb' && !unb) return false;
      if (st.filter === 'imp' && !(unb && k.imp)) return false;
      if (st.filter === 'plan' && !k.plan) return false;
      return !q || `${k.name} ${k.en || ''} ${k.id} ${k.mod || k.ns} ${modName(s, k)} ${comboText(k)}`.toLowerCase().includes(q);
    });
    mount(panelBody, list.length ? keysList(s, kd, list, by, st.group === 'mod' ? 'mod' : 'cat', { onPick: pickAct, onSug, open: !!q || st.filter !== 'all' || !!st.cat })
      : h('p.empty', null, 'Нічого не знайдено.'));
  }

  const drawAll = () => { drawHead(); drawSidebar(); drawLegend(); drawKb(); drawCard(); drawPanel(); };

  recalc();
  mount(el, layout, tip);
  drawAll();
  const onResize = debounce(() => { if (!el.isConnected) { removeEventListener('resize', onResize); return; } drawKb(); }, 150);
  addEventListener('resize', onResize);

  // Жива синхронізація options.txt із мостом ATM11-Companion (:8812), якщо він активний
  const bridgeBase = getActiveBridgeBase();
  if (bridgeBase) {
    const applyLiveBinds = async (/** @type {any} */ d) => {
      if (!el.isConnected || !d?.keyBinds) return;
      if (syncBridgeOptions(d.keyBinds, d.keyStats?.sig)) {
        kd = await loadKeys();
        recalc();
        setupTopbarOptions(kd);
        drawAll();
      }
    };
    fetch(`${bridgeBase}/api/state`).then((r) => (r.ok ? r.json() : null)).then(applyLiveBinds).catch(() => {});
    fetch(`${bridgeBase}/api/jarvis/state`).then((r) => (r.ok ? r.json() : null)).then((/** @type {any} */ j) => {   // справжня клавіша PTT компаньйона
      if (!el.isConnected || !j?.pttHotkey) return;
      reserved = companionReserved(String(j.pttHotkey), String(j.pttHotkeyTitle || j.pttHotkey));
      drawPanel();
    }).catch(() => {});
    try {
      const es = new EventSource(`${bridgeBase}/api/events`);
      es.addEventListener('state', (e) => {
        try { applyLiveBinds(JSON.parse(/** @type {MessageEvent} */ (e).data)); } catch {}
      });
      const closeEs = () => {
        if (!el.isConnected || location.hash.split('?')[0] !== '#/keys') {
          es.close();
          window.removeEventListener('hashchange', closeEs);
        }
      };
      window.addEventListener('hashchange', closeEs);
    } catch {}
  }
}
