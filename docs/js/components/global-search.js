// @ts-check
// Глобальний пошук по путівнику (G7) — поле в шапці сайту: моди, віхи карти, гілки, глави й квести, предмети, клавіші.
// Індекс — docs/data/search.json (tools/build_search.py, з тієї ж бази, що й сайт), вантажиться ліниво — коли гравець почав
// пошук. Слова — тим самим стемером, що core/rag.js (#/assistant). Працює без моста (GitHub Pages). «/» — фокус на поле.
import { h, mount, debounce } from '../core/dom.js';
import { getJSON, load } from '../core/store.js';
import { tokenize, stemUk } from '../core/rag.js';

/** вид → [заголовок групи, піктограма, вага] */
const KIND = {
  m: ['Моди', '🧩', 1.3], n: ['Віхи дорожньої карти', '🗺', 1.25], b: ['Гілки', '🌿', 1.2], c: ['Глави квестів', '📚', 1.15],
  q: ['Квести', '📜', 1], i: ['Предмети', '◆', 0.9], k: ['Клавіші', '⌨', 0.9],
};
const PER_KIND = { q: 8, k: 6, i: 6 };

/** @typedef {{ k: string, t: string, sub: string, href: string, tl: string, id: string, tt: string[], xt: string[] }} SRow */
/** @type {Promise<SRow[]> | null} */
let idxP = null;

function loadIndex() {
  if (!idxP) idxP = Promise.all([getJSON('data/search.json'), load()]).then(([d, s]) => d.rows.map((/** @type {string[]} */ r) => {
    const [k, t, sub0, href, extra] = r;
    let sub = sub0;
    if (k === 'q' && !sub) sub = s.chapterByFile.get(/^#\/chapter\/([\w-]+)/.exec(href)?.[1] || '')?.title || '';
    return { k, t, sub, href, tl: t.toLowerCase(), id: k === 'm' ? href.slice(6) : '', tt: tokenize(t), xt: tokenize(`${extra || ''} ${sub}`) };
  }));
  return idxP;
}

/** Слова запиту: [слово, основа]. @param {string} q */
function queryWords(q) {
  const raw = q.toLowerCase().replace(/['’`ʼ]/g, '').match(/[a-zа-яіїєґ0-9_]+/g) || [];
  return raw.filter((w) => w.length >= 2).map((w) => [w, stemUk(w)]);
}

/** @param {string[]} toks @param {string} w @param {string} st */
const hit = (toks, w, st) => toks.some((x) => x.startsWith(w) || (st.length >= 3 && x.startsWith(st)));

/** @param {SRow[]} rows @param {string} q */
export function searchRows(rows, q) {
  const words = queryWords(q);
  if (!words.length) return [];
  const ql = q.trim().toLowerCase();
  /** @type {{ r: SRow, sc: number }[]} */
  const res = [];
  for (const r of rows) {
    let sc = 0;
    let ok = true;
    for (const [w, st] of words) {
      if (hit(r.tt, w, st)) sc += 3;
      else if (hit(r.xt, w, st)) sc += 1;
      else { ok = false; break; }
    }
    if (!ok) continue;
    if (r.tl === ql || (r.id && r.id === ql)) sc += 8;
    else if (r.tl.startsWith(ql)) sc += 5;
    else if (r.tl.includes(ql)) sc += 3;
    sc = sc * (KIND[r.k]?.[2] || 1) - r.t.length / 200;   // коротша назва — точніший збіг
    res.push({ r, sc });
  }
  res.sort((a, b) => b.sc - a.sc);
  /** @type {Map<string, { r: SRow, sc: number }[]>} */
  const by = new Map();
  for (const x of res) {
    const arr = by.get(x.r.k) || [];
    if (arr.length < (PER_KIND[x.r.k] || 5)) arr.push(x);
    by.set(x.r.k, arr);
  }
  return [...by.entries()].sort((a, b) => b[1][0].sc - a[1][0].sc).map(([k, arr]) => ({ k, total: res.filter((x) => x.r.k === k).length, items: arr.map((x) => x.r) }));
}

/** Поле пошуку в шапці. @param {HTMLElement} box */
export function mountSearch(box) {
  const input = /** @type {HTMLInputElement} */ (h('input.gs-input', { type: 'search', placeholder: 'Пошук: моди, квести, предмети, клавіші…', 'aria-label': 'Пошук по путівнику', autocomplete: 'off', spellcheck: false }));
  const drop = h('div.gs-drop', { role: 'listbox', hidden: true });
  mount(box, h('span.gs-ic', { 'aria-hidden': 'true' }, '🔍'), input, drop);
  let active = -1;
  const links = () => /** @type {HTMLAnchorElement[]} */ ([...drop.querySelectorAll('a.gs-row')]);
  const close = () => { drop.hidden = true; active = -1; };
  const setActive = (/** @type {number} */ i) => {
    const ls = links();
    if (!ls.length) return;
    active = (i + ls.length) % ls.length;
    ls.forEach((a, j) => a.classList.toggle('on', j === active));
    ls[active].scrollIntoView({ block: 'nearest' });
  };
  const go = (/** @type {string} */ href) => { close(); input.blur(); input.value = ''; location.hash = href.replace(/^#/, ''); };
  const run = debounce(async () => {
    const q = input.value.trim();
    if (q.length < 2) { close(); return; }
    let rows;
    try { rows = await loadIndex(); } catch (e) { mount(drop, h('div.gs-empty', null, 'Не вдалося завантажити індекс пошуку.')); drop.hidden = false; return; }
    if (input.value.trim() !== q) return;
    const groups = searchRows(rows, q);
    active = -1;
    if (!groups.length) mount(drop, h('div.gs-empty', null, `Нічого не знайдено за «${q}».`));
    else mount(drop, groups.map((g) => h('div.gs-group', null,
      h('div.gs-head', null, `${KIND[g.k]?.[1] || ''} ${KIND[g.k]?.[0] || g.k}`, g.total > g.items.length ? h('span.muted', null, ` · ${g.items.length} з ${g.total}`) : null),
      g.items.map((r) => h('a.gs-row', { href: r.href, role: 'option', onclick: (/** @type {MouseEvent} */ e) => { e.preventDefault(); go(r.href); } },
        h('span.gs-title', null, r.t), r.sub ? h('span.gs-sub', null, r.sub) : null)))));
    drop.hidden = false;
  }, 120);
  input.addEventListener('input', run);
  input.addEventListener('focus', () => { loadIndex().catch(() => {}); if (input.value.trim().length >= 2) run(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { const ls = links(); const a = ls[active >= 0 ? active : 0]; if (a) { e.preventDefault(); go(a.getAttribute('href') || ''); } }
    else if (e.key === 'Escape') { close(); input.blur(); }
  });
  document.addEventListener('click', (e) => { if (!box.contains(/** @type {Node} */ (e.target))) close(); });
  document.addEventListener('keydown', (e) => {
    const t = /** @type {HTMLElement} */ (e.target);
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !t.isContentEditable) { e.preventDefault(); input.focus(); }
  });
}
