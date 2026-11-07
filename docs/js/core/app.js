// @ts-check
// Точка входу: запускає роутер, перемикач світу й вибір теки гри у верхній панелі та підвал зі статистикою збірки.
import { h, mount } from './dom.js';
import { route } from './router.js';
import { load, switchWorld, applyBrowserGameState } from './store.js';
import { pickGameFolder, rescanSavedGameFolder, getBrowserGameState } from './game-folder.js';
import { initTheme } from './theme.js';
import { mountSearch } from '../components/global-search.js';

initTheme();
{ const gs = document.getElementById('gsearch'); if (gs) mountSearch(gs); }   // G7: глобальний пошук у шапці

window.addEventListener('hashchange', route);
// кнопка «нагору»: з'являється після прокрутки на ~1,5 екрана
const top = document.createElement('button');
top.className = 'to-top'; top.title = 'Нагору'; top.textContent = '↑';
top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
document.body.append(top);
window.addEventListener('scroll', () => top.classList.toggle('on', window.scrollY > innerHeight * 0.8), { passive: true });
route();

/** @param {Store} s */
function renderWorldBar(s) {
  const wb = document.getElementById('world-bar');
  const p = s.progress;
  if (!wb) return;
  const worlds = p?.worlds || [];
  const bs = getBrowserGameState();
  const modeUk = p?.mode_uk || p?.mode || '';
  const tip = p?.slug
    ? `Світ: «${p.world}» (${modeUk}) · остання гра: ${p.last_played} · знімок: ${p.updated}${bs ? ` (з теки «${bs.folderName}» у браузері)` : ''}`
    : 'Світ не вибрано';
  const onPick = async (rescan = false) => {
    try {
      const res = rescan ? await rescanSavedGameFolder(s) : await pickGameFolder(s);
      await applyBrowserGameState(res);
    } catch {}
  };
  mount(wb,
    p?.slug ? h('span.wb-icon', { title: tip }, bs ? '📂' : '💾') : null,
    worlds.length > 1
      ? h('select.wb-select', {
          title: tip,
          'aria-label': 'Вибір світу',
          onchange: async (e) => { await switchWorld(e.target.value); },
        }, worlds.map((w) => h('option', { value: w.slug, selected: w.slug === p?.slug }, `${w.world} (${w.mode_uk || w.mode})`)))
      : p?.slug ? h('span.wb-name', { title: tip }, `${p.world} (${modeUk})`) : null,
    p?.slug ? h('span.wb-time', { title: `Остання гра в сейві: ${p.last_played}` }, `знято ${p.updated}`) : null,
    bs ? h('button.wb-btn', {
      title: `Перечитати сейви та options.txt з обраної теки «${bs.folderName}»`,
      onclick: () => onPick(true),
    }, '🔄') : null,
    h('button.wb-btn', {
      title: 'Вказати теку гри (All the Mods 11 або minecraft) прямо в браузері: зчитує saves/<світ> і options.txt без Python',
      onclick: () => onPick(false),
    }, h('span.btn-ic', null, '📂'), ' Вказати теку гри'));
}

load().then((s) => {
  renderWorldBar(s);
  window.addEventListener('worldchange', () => {
    renderWorldBar(s);
    if (location.hash.split('?')[0] !== '#/assistant') route();
  });
  const f = document.getElementById('footer');
  if (f) f.textContent = `Модів: ${s.meta.mods} · описано вручну: ${s.meta.curated} · дані зібрано ${s.meta.built} · ATM11 26.1.2`;
}).catch(() => {});
