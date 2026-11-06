// @ts-check
// Хеш-роутер: #/шлях/параметр. Кожен маршрут — модуль views/*.js з функцією render(el, params, store).
import { load } from './store.js';
import { h, mount } from './dom.js';
import { beforeRouteChange, restoreRouteScroll } from './view-state.js';

/** @type {[RegExp, string, string][]} [шаблон, модуль, пункт меню] */
const ROUTES = [
  [/^#?\/?$/, 'home', ''],
  [/^#\/roadmap(?:\/([\w-]+))?$/, 'roadmap', 'roadmap'],
  [/^#\/mods$/, 'mods', 'mods'],
  [/^#\/mod\/([\w.-]+)$/, 'mod', 'mods'],
  [/^#\/chapters$/, 'chapters', 'chapters'],
  [/^#\/chapter\/([\w-]+)(?:\/([\w]+))?$/, 'chapter', 'chapters'],
  [/^#\/branches$/, 'branches', 'branches'],
  [/^#\/branch\/([\w-]+)$/, 'branch', 'branches'],
  [/^#\/synergy$/, 'synergy', 'synergy'],
  [/^#\/keys$/, 'keys', 'keys'],
  [/^#\/assistant$/, 'assistant', 'assistant'],
];

let seq = 0;
let currentFullHash = '';

export async function route() {
  const full = location.hash || '#/'; const hash = full.split('?')[0];   // ?параметри читає сама сторінка
  const view = /** @type {HTMLElement} */ (document.getElementById('view'));
  const hit = ROUTES.find(([re]) => re.test(hash));
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', !!hit && a.getAttribute('data-nav') === hit[2]));
  if (!hit) { mount(view, h('div.empty', null, 'Сторінку не знайдено. ', h('a', { href: '#/' }, 'На головну'))); return; }
  const my = ++seq;
  const params = hit[0].exec(hash)?.slice(1) || [];
  const routeKey = hit[1] + (params[0] ? ':' + params[0] : '');
  beforeRouteChange(routeKey, currentFullHash);
  currentFullHash = full;
  try {
    const [store, mod] = await Promise.all([load(), import(`../views/${hit[1]}.js`)]);
    if (my !== seq) return;                       // користувач уже перейшов далі
    view.className = 'view';                      // сторінка може додати клас (напр. wide)
    await mod.render(view, params, store);
    // Сторінки конкретного мода завжди відкриваємо згори, а списки (mods, chapters, branches, branch, keys, home) — відновлюють прокрутку
    restoreRouteScroll(routeKey, hit[1] === 'mod');
  } catch (e) {
    console.error(e);
    mount(view, h('div.empty', null, 'Помилка завантаження: ', String(e),
      h('p.small', null, 'Сайт треба відкривати через веб-сервер (start.bat або GitHub Pages), а не подвійним кліком по файлу.')));
  }
}
