// @ts-check
// Головна: що це, підсумок прогресу із сейву (+ вибір теки гри у браузері та ШІ-помічник), етапи з прогресом, класи модів.
import { h, mount } from '../core/dom.js';
import { countDone, countAutoDone, countManualDone, isAutoDone } from '../core/progress.js';
import { switchWorld, applyBrowserGameState, resetToBuiltProgress } from '../core/store.js';
import { pickGameFolder, rescanSavedGameFolder, getBrowserGameState } from '../core/game-folder.js';
import { clsIcon } from '../components/feat.js';

/** @param {HTMLElement} el @param {string[]} _p @param {Store} s */
export function render(el, _p, s) {
  const content = s.mods.filter((m) => m.role === 'content' || m.role === 'addon').length;
  const allIds = s.roadmap.nodes.map((n) => n.id);
  const p = s.progress;
  const worlds = p?.worlds || [];
  const bs = getBrowserGameState();
  const chEntries = Object.entries(p?.quests?.by_chapter || {}).map(([fn, c]) => {
    const meta = s.chapterByFile.get(fn);
    return { fn, title: meta?.title || fn, total: meta?.quests || 0, done: (c.done || []).length, started: (c.started || []).length };
  }).sort((a, b) => (b.done - a.done) || a.title.localeCompare(b.title, 'uk'));
  const autoNodes = s.roadmap.nodes.filter((n) => isAutoDone(n.id));
  const modeUk = p?.mode_uk || p?.mode || '';
  const onPick = async (rescan = false) => {
    try {
      const res = rescan ? await rescanSavedGameFolder(s) : await pickGameFolder(s);
      await applyBrowserGameState(res);
    } catch {}
  };

  mount(el,
    h('section.hero', null,
      h('h1', null, 'All the Mods 11 — дорожня карта'),
      h('p', null, 'Путівник по збірці: з чого починати, які моди поєднувати на кожному етапі й куди відгалужуватися, щоб не застрягнути в грінді. Усе клікабельне.'),
      h('div.stats', null,
        stat(s.meta.mods, 'модів у збірці'), stat(content, 'контентних модів'),
        stat(s.chapters.chapters.length, 'глав квестів'), stat(s.roadmap.nodes.length, 'віх на карті'))),
    p && p.slug ? h('section.card.save-box', null,
      h('div.save-head', null,
        h('div', null,
          h('h2', { style: { margin: 0 } }, '💾 Прогрес із сейву'),
          h('div.small.muted', { style: { marginTop: '4px' } },
            `Світ: «${p.world}» (${modeUk}) · остання гра: ${p.last_played} · знімок: ${p.updated}`,
            p.play_hours ? ` · у грі: ${p.play_hours} год` : '',
            bs ? ` · прочитано у браузері з «${bs.folderName}»` : '')),
        h('div.ai-folder-actions', null,
          worlds.length > 1 ? h('label.small', { style: { display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '100%', minWidth: '0' } },
            h('span.muted', null, 'Світ:'),
            h('select.wb-select', {
              onchange: async (e) => { await switchWorld(e.target.value); },
            }, worlds.map((w) => h('option', { value: w.slug, selected: w.slug === p.slug }, `${w.world} (${w.mode_uk || w.mode} · гра ${w.last_played})`)))) : null,
          h('button.btn.primary', {
            title: 'Обрати теку гри (All the Mods 11 або minecraft) прямо в браузері: зчитує saves/<світ> і options.txt без Python',
            onclick: () => onPick(false),
          }, '📂 Вказати теку гри'),
          bs ? h('button.btn', {
            title: 'Перечитати сейви та options.txt з обраної теки гри',
            onclick: () => onPick(true),
          }, '🔄 Оновити з гри') : null,
          bs ? h('button.btn', {
            title: 'Повернути дані збірки',
            onclick: async () => { await resetToBuiltProgress(); },
          }, '↺ Дані збірки') : null,
          h('a.btn', { href: '#/assistant', style: { textDecoration: 'none' } }, '🤖 Що робити далі?'))),
      h('div.stats.save-stats', null,
        stat(`${countDone(allIds)} / ${allIds.length}`, `віх виконано (з сейву: ${countAutoDone(allIds)}, вручну: ${countManualDone(allIds)})`),
        stat(p.quests?.done?.length || 0, `квестів виконано${p.quests?.started?.length ? ` (+${p.quests.started.length} у процесі)` : ''}`),
        stat(p.advancements?.done?.length || 0, 'досягнень відкрито'),
        stat(p.items?.obtained?.length || 0, 'предметів здобуто / скрафчено')),
      autoNodes.length ? h('div.save-row', null,
        h('span.small.muted', null, 'Віхи з сейву:'),
        ...autoNodes.map((n) => h('a.badge.save-pill', { href: `#/roadmap?node=${n.id}`, style: { '--c': 'var(--ok)' } }, `✔ ${n.title}`))) : null,
      chEntries.length ? h('div.save-row', null,
        h('span.small.muted', null, 'Активні глави квестів:'),
        ...chEntries.map((c) => h('a.badge.save-pill', {
          href: `#/chapter/${c.fn}`,
          style: { '--c': c.done ? 'var(--ok)' : 'var(--link)' },
        }, `${c.title}: ✔ ${c.done}/${c.total}${c.started ? ` · ⏳ ${c.started}` : ''}`))) : null,
      h('p.small.muted', { style: { margin: '10px 0 0' } },
        'Щоб оновити прогрес і клавіші після сесії гри без Python: збережіть світ у грі (вихід у головне меню) і натисніть ',
        h('b', null, '«📂 Вказати теку гри»'), ' (або запустіть ', h('code', null, 'start.bat'), ' → пункт ', h('b', null, '3'),
        '). У вкладці ', h('a', { href: '#/assistant' }, '🤖 Помічник'), ' доступний інтерактивний радник «Наступні кроки за сейвом» та семантичний пошук (RAG).')) : null,
    h('h2.section', null, 'Етапи'),
    h('div.grid', null, s.stages.map((st) => {
      const ids = s.roadmap.nodes.filter((n) => n.stage === st.id).map((n) => n.id);
      const done = countDone(ids), auto = countAutoDone(ids);
      return h('a.card.stage-card', { href: `#/roadmap/${st.id}`, style: { color: 'var(--text)' } },
        h('div.stage-n', null, `${st.icon} Етап ${st.n}`),
        h('h3', null, st.title),
        h('p.small.muted', null, st.goal),
        h('div.small', null, `Віх: ${ids.length} · зроблено: ${done}${auto ? ` (з сейву: ${auto})` : ''}`));
    })),
    h('h2.section', null, 'Класи модів'),
    h('div.grid', null, s.classes.map((c) => h('a.card', { href: `#/mods?cls=${c.id}`, style: { borderLeft: `4px solid ${c.color}`, color: 'var(--text)' } },
      h('h3', { style: { display: 'flex', alignItems: 'center', gap: '6px' } }, clsIcon(c.id, c.color), c.title), h('p.small.muted', null, c.desc),
      h('div.small', null, `модів: ${s.mods.filter((m) => m.cls?.includes(c.id)).length}`)))));
}

/** @param {number | string} n @param {string} label */
const stat = (n, label) => h('div.stat', null, h('b', null, String(n)), h('span.small.muted', null, label));
