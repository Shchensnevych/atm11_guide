// @ts-check
// Вкладка «Клавіші» (#/keys[?q=пошук][&k=шар|прив'язка]). Компонування на весь екран:
//   ліворуч — зони-категорії, клавіатура + миша (виноски зони), легенда, цифровий блок, ЗАКРІПЛЕНА картка вибраної клавіші (клік);
//   праворуч — панель на всю висоту: вкладки «Дії» (пошук, «За клавішами / категоріями / модами», фільтри) і «План».
// Наведення на клавішу — лише підсвітка й підказка (з затримкою); панель праворуч не гортається. Наведення на картку праворуч — лінія до клавіші.
import { h, mount, debounce } from '../core/dom.js';
import { loadKeys, analyze, layerOf, comboText, actLevel, parseOptions, saveUserOptions, parseSuggest, withPlan, UNBOUND, MOD_TITLE, pretty } from '../core/keys-model.js';
import { pickGameFolder } from '../core/game-folder.js';
import { applyBrowserGameState, resetToBuiltProgress } from '../core/store.js';
import { keyboard, mouse, isPad, mainAct } from '../components/keyboard.js';
import { keysList, keyPanel, modName, ctxBadge } from '../components/keys-list.js';
import { keyCards, planSection } from '../components/keys-side.js';
import { drawCallouts, linkLine } from '../components/callouts.js';

const LS = 'atm11.keys.view';
const LAYERS = ['', 'S', 'C', 'A', 'F3'];
const CTX_UI = ['game', 'held', 'vehicle', 'gui'];
const lsGet = () => { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch { return {}; } };
const lsSet = (/** @type {any} */ v) => { try { localStorage.setItem(LS, JSON.stringify(v)); } catch { /* приватний режим */ } };

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export async function render(el, _p, s) {
  const kd = await loadKeys();
  const qs = new URLSearchParams(location.hash.split('?')[1] || '');
  const saved = lsGet();
  const st = {
    layout: /** @type {'tkl'|'full'} */ (saved.layout === 'full' ? 'full' : 'tkl'), color: /** @type {'state'|'cat'} */ (saved.color === 'cat' ? 'cat' : 'state'),
    plan: Boolean(saved.plan), layer: String(saved.layer || ''), cat: String(saved.cat || ''), ctxOn: new Set([...CTX_UI, 'debug']), sel: String(saved.sel || ''), hl: '',
    tab: String(saved.tab || 'acts'), group: /** @type {'key'|'cat'|'mod'} */ (saved.group || 'key'), q: qs.has('q') ? (qs.get('q') || '') : String(saved.q || ''), filter: String(saved.filter || 'all'),
  };
  const k0 = qs.get('k');
  if (k0 && k0.includes('|')) { const [l, b] = k0.split('|'); st.layer = l; st.sel = b; }
  if (qs.has('q') && st.q) st.group = 'cat';
  const save = () => lsSet({ layout: st.layout, color: st.color, group: st.group, plan: st.plan, layer: st.layer, cat: st.cat, sel: st.sel, tab: st.tab, q: st.q, filter: st.filter });
  /** @type {KeyAct[]} */ let keys = kd.keys;
  /** @type {Map<string, any>} */ let by = analyze(keys, st.ctxOn);
  let planned = new Set();
  const recalc = () => {
    keys = st.plan ? withPlan(kd.keys) : kd.keys; by = analyze(keys, st.ctxOn);
    planned = new Set(st.plan ? keys.filter((k) => k.was && k.bind !== UNBOUND).map((k) => layerOf(k) + '|' + k.bind) : []);
  };

  el.classList.add('wide');
  const tip = h('div.kb-tip');
  const headBox = h('div'); const barBox = h('div'); const zoneBox = h('div.zones');
  const stage = h('div.kb-stage', null, h('div.co-top'), h('div.kb-holder'), h('div.co-bot'));
  const holder = /** @type {HTMLElement} */ (stage.querySelector('.kb-holder'));
  const legend = h('div'); const padBox = h('div'); const cardBox = h('div.kcard-box');
  const panelBody = h('div.kp-body'); const panelTools = h('div.kp-tools'); const tabsBox = h('div.kp-tabs');
  const panel = h('aside.keys-panel', null, tabsBox, panelTools, panelBody);
  const left = h('div.keys-left', null, zoneBox, stage, legend, padBox, cardBox);
  const cols = h('div.keys-cols', null, left, panel);

  // ── підказка (затримка 120 мс, зникає за 160 мс) і лінія «картка праворуч → клавіша»
  let tipT = 0;
  const showTip = (/** @type {string|null} */ bind, /** @type {HTMLElement|undefined} */ at) => {
    clearTimeout(tipT);
    if (!bind || !at || (st.cat && innerWidth >= 1100)) { tipT = window.setTimeout(() => tip.classList.remove('on'), 160); return; }
    tipT = window.setTimeout(() => {
      const v = by.get(st.layer + '|' + bind); if (!v) return;
      mount(tip, h('div.tip-h', null, (st.layer ? MOD_TITLE[st.layer] + '+' : '') + pretty(bind),
        v.lvl ? h(`span.small.lv${v.lvl}`, null, v.lvl === 2 ? '  ⚠ конфлікт' : '  ◐ можливий') : null),
        h('ul', null, v.acts.map((/** @type {KeyAct} */ k) => h('li', null, h(`i.cdot.${k.ctx}`), k.name, h('span.muted', null, ` · ${modName(s, k)}`)))),
        h('div.small.muted', null, 'клік — закріпити картку під клавіатурою'));
      const r = at.getBoundingClientRect();
      tip.classList.add('on');
      const tw = tip.offsetWidth; const th = tip.offsetHeight;
      tip.style.left = Math.max(8, Math.min(innerWidth - tw - 8, r.left + r.width / 2 - tw / 2)) + 'px';
      tip.style.top = (r.top - th - 8 > 8 ? r.top - th - 8 : r.bottom + 8) + 'px';
    }, 120);
  };
  const lit = (/** @type {string|null} */ bind) => {
    stage.querySelectorAll('.lit').forEach((x) => x.classList.remove('lit'));
    if (bind) stage.querySelectorAll(`[data-bind="${CSS.escape(bind)}"]`).forEach((x) => x.classList.add('lit'));
  };
  const onKeyHover = (/** @type {string|null} */ bind, /** @type {MouseEvent|undefined} */ e) => { lit(bind); showTip(bind, /** @type {any} */ (e?.currentTarget)); };
  const onCardHover = (/** @type {string|null} */ bind, /** @type {HTMLElement|undefined} */ card) => {
    lit(bind);
    const key = bind ? holder.querySelector(`.kb-wrap [data-bind="${CSS.escape(bind)}"]`) : null;
    if (innerWidth >= 1100) linkLine(cols, key, card || null); else linkLine(cols, null, null);
  };

  const select = (/** @type {string} */ l, /** @type {string} */ b) => { st.layer = l; st.sel = b; save(); drawBar(); drawZones(); drawKb(); drawCard(); drawPanel(); };
  const pick = (/** @type {string} */ bind) => {
    tip.classList.remove('on'); st.sel = st.sel === bind ? '' : bind; save(); drawKb(); drawCard();
    if (st.sel) requestAnimationFrame(() => { const r = cardBox.getBoundingClientRect(); if (r.top > innerHeight - 80) cardBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  };
  const pickAct = (/** @type {KeyAct} */ k) => {
    const kk = st.plan ? keys.find((x) => x.id === k.id) || k : k;
    if (kk.bind === UNBOUND) return; select(layerOf(kk), kk.bind);
  };
  const onSug = (/** @type {KeyAct|null} */ k) => {
    if (!k || !k.plan || k.plan === 'none') { if (st.hl) { st.hl = ''; drawKb(); } return; }
    const p = parseSuggest(k.plan); if (p.l !== st.layer) { st.layer = p.l; drawBar(); }
    st.hl = p.bind; drawKb();
  };

  function fitU() {                                                       // клавіатура: на всю ширину лівої колонки, але не вища за ~55 % екрана
    const W = (st.layout === 'full' ? 22.5 : 18.25) + 4.3;
    const byW = (holder.clientWidth - 30) / W;
    const byH = (innerHeight * 0.56) / 6.9;
    stage.style.setProperty('--u', Math.max(38, Math.min(78, Math.floor(Math.min(byW, byH)))) + 'px');
  }
  function drawKb() {
    const o = { layout: st.layout, layer: st.layer, by, sel: st.sel, hl: st.hl, color: st.color, cat: st.cat, planned, onPick: pick, onHover: onKeyHover };
    mount(holder, h(`div.kb-wrap${st.layout === 'full' ? '.full' : ''}`, null, keyboard(o), mouse(o)));
    fitU();
    const items = st.cat && innerWidth >= 1100 ? [...by.entries()].filter(([c, v]) => c.split('|')[0] === st.layer && v.acts.some((/** @type {KeyAct} */ a) => a.cat === st.cat))
      .map(([c, v]) => { const acts = v.acts.filter((/** @type {KeyAct} */ a) => a.cat === st.cat);
        return { bind: c.split('|')[1], text: acts[0].name, sub: acts.length > 1 ? `+ ${acts.slice(1).map((/** @type {KeyAct} */ a) => a.name).join(' · ')}` : modName(s, acts[0]),
          cls: v.lvl === 2 ? 'lv2' : v.lvl === 1 ? 'lv1' : '' }; }) : [];
    requestAnimationFrame(() => drawCallouts(stage, items, { onHover: (b) => lit(b), onPick: pick }));
    mount(legend, h('div.kb-legend', null,
      st.color === 'state'
        ? [[['free', 'вільна'], ['one', 'одна дія'], ['multi', 'кілька, різні контексти'], ['maybe', 'можливий конфлікт'], ['conflict', 'конфлікт']].map(([c, t]) => h('span', null, h(`i.st-${c}`), t)),
          h('span', null, h('i', { style: { borderStyle: 'dashed' } }), 'лише в інтерфейсі')]
        : h('span', null, 'Колір — категорія головної дії клавіші'),
      st.plan ? h('span', null, h('i.planned-i'), 'змінено планом') : null,
      h('span', null, 'контекст: ', ['game', 'held', 'vehicle', 'gui'].map((c) => h('span.nowrap', null, h(`i.cdot.${c}`), kd.ctxs.find((/** @type {any} */ x) => x.id === c)?.title, ' '))),
      h('span', null, 'клік по клавіші — картка нижче')));
    drawPad();
  }
  function drawPad() {
    const pad = st.layout === 'tkl' ? [...by.entries()].filter(([c]) => isPad(c.split('|')[1])) : [];
    mount(padBox, pad.length ? h('div.kpad', null, h('span.small.muted', null, 'Цифровий блок (на TKL немає): '),
      pad.map(([c, v]) => { const [l, b] = c.split('|'); const m = mainAct(v.acts);
        return h('button.chip', { onclick: () => select(l, b), title: `${m.name} (${modName(s, m)})` }, `${pretty(b)} · ${m.name}`); })) : null);
  }
  function drawCard() {                                                   // закріплена картка клавіші (або зведення конфліктів)
    if (st.sel) { mount(cardBox, h('div.kcard-pin', null, h('button.kc-close', { onclick: () => pick(st.sel), title: 'Закрити' }, '✕'), keyPanel(s, kd, st.layer, st.sel, by))); return; }
    const all = [...by.entries()].filter(([c, v]) => v.lvl > 0 && c.split('|')[0] === st.layer).sort((a, b) => b[1].lvl - a[1].lvl);
    mount(cardBox, h('div.kcard-pin.summary', null,
      h('div.ks-h', null, h('b', null, 'Зіткнення на цьому шарі'), h('span.small.muted', null, ' — клікніть клавішу, щоб закріпити її картку тут')),
      all.length ? h('div.ks-list', null, all.map(([c, v]) => { const b = c.split('|')[1];
        return h(`button.ks-item.lv${v.lvl}`, { onclick: () => pick(b), onmouseenter: () => lit(b), onmouseleave: () => lit(null) },
          h('span.kbd', null, (st.layer ? MOD_TITLE[st.layer] + '+' : '') + pretty(b)), ` ${v.lvl === 2 ? '⚠' : '◐'} `,
          v.acts.filter((/** @type {KeyAct} */ k) => !k.nc).slice(0, 3).map((/** @type {KeyAct} */ k) => k.name).join(' · '), v.acts.length > 3 ? ` +${v.acts.length - 3}` : ''); }))
        : h('p.muted', null, 'Зіткнень немає.')));
  }
  function drawBar() {
    const cnt = (/** @type {string} */ l) => [...by.keys()].filter((c) => c.split('|')[0] === l).length;
    const seg = (/** @type {string[][]} */ opts, /** @type {string} */ cur, /** @type {(v: string) => void} */ on) =>
      h('div.seg', null, opts.map(([v, t, c]) => h(`button${cur === v ? '.on' : ''}`, { onclick: () => on(v) }, t, c != null ? h('span.cnt', null, c) : null)));
    mount(barBox, h('div.keys-bar', null,
      h('div.kb-group', null, h('span.lbl', null, 'Шар'), seg(LAYERS.map((l) => [l, l ? MOD_TITLE[l] : 'Без мод.', String(cnt(l))]), st.layer, (v) => { st.layer = v; st.sel = ''; save(); drawAll(); })),
      h('div.kb-group', null, h('span.lbl', null, 'Контекст'), h('span.chips', null, CTX_UI.map((c) => h(`span.chip${st.ctxOn.has(c) ? '.on' : ''}`, {
        'data-ctx': c, style: { '--c': `var(--x-${c})` }, title: kd.ctxs.find((/** @type {any} */ x) => x.id === c)?.desc,
        onclick: () => { if (st.ctxOn.has(c)) st.ctxOn.delete(c); else st.ctxOn.add(c); recalc(); drawAll(); } },
      kd.ctxs.find((/** @type {any} */ x) => x.id === c)?.title || c)))),
      h('div.kb-group', null, h('span.lbl', null, 'Колір'), seg([['state', 'Стан'], ['cat', 'Категорія']], st.color, (v) => { st.color = /** @type {any} */ (v); save(); drawBar(); drawKb(); })),
      h('div.kb-group', null, h('span.lbl', null, 'Клавіші'), seg([['now', 'Як зараз'], ['plan', 'З планом']], st.plan ? 'plan' : 'now', (v) => { st.plan = v === 'plan'; save(); recalc(); drawAll(); })),
      h('div.kb-group', null, h('span.lbl', null, 'Вигляд'), seg([['tkl', 'TKL 87'], ['full', 'Повна 104']], st.layout, (v) => { st.layout = /** @type {any} */ (v); save(); drawBar(); drawKb(); }))));
  }
  function drawZones() {
    const n = (/** @type {string} */ cat) => [...by.entries()].filter(([c, v]) => c.split('|')[0] === st.layer && v.acts.some((/** @type {KeyAct} */ a) => a.cat === cat)).length;
    const setCat = (/** @type {string} */ c) => { st.cat = c; save(); drawZones(); drawKb(); drawPanel(); };
    mount(zoneBox, h('button.zone' + (st.cat ? '' : '.on'), { onclick: () => setCat('') }, 'Усі зони'),
      kd.cats.map((/** @type {any} */ c) => { const k = n(c.id);
        return h(`button.zone${st.cat === c.id ? '.on' : ''}`, { disabled: !k, style: { '--cc': `var(--cat-${c.id})` }, title: 'Показати назви дій виносками',
          onclick: () => setCat(st.cat === c.id ? '' : c.id) }, h('i'), `${c.icon} ${c.title}`, h('span.cnt', null, String(k))); }));
  }
  function drawPanel() {
    mount(tabsBox, [['acts', 'Дії'], ['plan', `🛠 План · ${kd.keys.filter((k) => k.plan).length}`]].map(([v, t]) =>
      h(`button${st.tab === v ? '.on' : ''}`, { onclick: () => { st.tab = v; save(); drawPanel(); } }, t)));
    if (st.tab === 'plan') { mount(panelTools); mount(panelBody, planSection(s, kd, kd.keys, pickAct)); return; }
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
    linkLine(cols, null, null);
    if (st.group === 'key' && (st.filter === 'all' || st.filter === 'conf')) {
      mount(panelBody, keyCards(s, kd, by, st.layer, { cat: st.cat, q: st.q, conf: st.filter === 'conf', onHover: onCardHover, onPick: (b) => pick(b) })); return;
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
  function drawHead() {
    const all = analyze(keys, new Set([...CTX_UI, 'debug']));
    const nConf = [...all.values()].filter((v) => v.lvl === 2).length; const nMaybe = [...all.values()].filter((v) => v.lvl === 1).length;
    mount(headBox, h('div.keys-head', null, h('h1', null, '⌨️ Клавіші'),
      h('div.small.muted.kh-stat', null, `дій ${keys.length} · не призначено ${keys.filter((k) => k.bind === UNBOUND).length} · `,
        h(nConf ? 'span.lv2' : 'span.ok', null, `конфліктів ${nConf}`), ` · можливих ${nMaybe} · важливих непризначених ${keys.filter((k) => k.bind === UNBOUND && k.imp).length}`,
        st.plan ? h('b.sug', null, ' · з планом') : null),
      srcBlock(kd, s)));
  }
  const drawAll = () => { drawHead(); drawBar(); drawZones(); drawKb(); drawCard(); drawPanel(); };

  recalc();
  mount(el, headBox, barBox, cols, tip);
  drawAll();
  const onResize = debounce(() => { if (!el.isConnected) { removeEventListener('resize', onResize); return; } drawKb(); }, 150);
  addEventListener('resize', onResize);
}

/** Джерело даних: options.txt збірки або власний (localStorage) + кнопки. @param {any} kd @param {Store} s */
function srcBlock(kd, s) {
  const inp = h('input', { type: 'file', accept: '.txt,text/plain', hidden: true, onchange: async (/** @type {Event} */ e) => {
    const f = /** @type {HTMLInputElement} */ (e.target).files?.[0]; if (!f) return;
    const binds = parseOptions(await f.text());
    if (!Object.keys(binds).length) { alertBox('У файлі немає рядків key_… — це точно options.txt з теки minecraft?'); return; }
    saveUserOptions({ name: f.name, date: new Date().toLocaleString('uk-UA'), binds }); location.reload();
  } });
  return h('div.keys-src', null,
    kd.user ? h('span.badge', { style: { '--c': 'var(--accent)' } }, `Ваш ${kd.user.name} · ${kd.user.date}`) : h('span.muted', null, 'Дані: options.txt збірки'),
    h('button.btn', {
      onclick: async () => {
        try {
          const res = await pickGameFolder(s);
          await applyBrowserGameState(res);
          location.reload();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg !== 'cancelled' && !/AbortError|user aborted/i.test(msg)) alertBox(msg);
        }
      },
      title: 'Вказати теку гри (All the Mods 11 або minecraft): оновлює і клавіші options.txt, і прогрес світів saves/',
    }, '📂 Вказати теку гри'),
    h('button.btn', { onclick: () => inp.click(), title: 'Файл minecraft/options.txt — розбирається лише у вашому браузері' }, '📄 Лише options.txt'),
    kd.user ? h('button.btn', { onclick: async () => { await resetToBuiltProgress(); saveUserOptions(null); location.reload(); } }, '↺ Дані збірки') : null, inp);
}
/** @param {string} t */
function alertBox(t) { const d = h('div.kalert', { onclick: () => d.remove() }, t, ' (клік — закрити)'); document.body.append(d); setTimeout(() => d.remove(), 6000); }
