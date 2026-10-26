// @ts-check
// Сторінка мода: опис, класи, етапи, синергії, залежності, глави квестів і віхи карти, де він згадується.
import { h, mount } from '../core/dom.js';
import { modBadges, stageBadge } from '../components/badge.js';
import { modLogo, modLinks } from '../components/modcard.js';
import { spoiler } from '../components/spoiler.js';
import { featRow } from '../components/feat.js';
import { itemList } from '../components/items.js';
import { hiddenWhy } from '../core/fmt.js';
import { loadKeys, analyze } from '../core/keys-model.js';
import { modKeysBlock } from '../components/keys-list.js';
import { getModBackTarget } from '../core/view-state.js';

/** @param {HTMLElement} el @param {string[]} p @param {Store} s */
export function render(el, [id], s) {
  el.classList.add('narrow');
  const m = s.modById.get(id);
  if (!m) { mount(el, h('div.empty', null, `Мод «${id}» не знайдено. `, h('a', { href: '#/mods' }, 'До довідника'))); return; }
  const back = getModBackTarget();
  const chapters = s.chapters.chapters.filter((c) => c.mods?.includes(id) || c.file === m.chapter);
  const nodes = s.roadmap.nodes.filter((n) => n.mods?.includes(id));
  const deps = (m.deps || []).filter((d) => s.modById.has(d));
  const users = s.dependents.get(id) || [];
  const addons = s.mods.filter((x) => x.parent === id).map((x) => x.id);
  const parent = m.parent ? s.modById.get(m.parent) : null;
  const c = m.counts || {};
  const keysBox = h('div');                                  // блок «Клавіші» — ліниво з data/keys.json (+ власний options.txt)
  loadKeys().then((kd) => { if (keysBox.isConnected) mount(keysBox, modKeysBlock(s, kd, id, analyze(kd.keys, new Set(['game', 'held', 'vehicle', 'gui', 'debug'])))); }).catch(() => {});
  mount(el,
    h('div', { style: { marginBottom: '12px' } },
      h('a.btn.small', { href: back.href, style: { display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' } }, back.label)),
    h('div', { style: { display: 'flex', gap: '18px', alignItems: 'center', marginBottom: '16px' } },
      modLogo(m, true),
      h('div', null, h('h1', null, m.name), modBadges(s, m),
        parent ? h('div.mod-parent', null, '↳ доповнення до ', h('a', { href: `#/mod/${parent.id}` }, parent.name)) : null,
        m.features?.length ? h('div', { style: { marginTop: '8px' } }, featRow(m.features, (m.dims || []).map((d) => d.name), true)) : null,
        m.auto ? h('div.small.muted', { style: { marginTop: '6px' } }, 'Опис ще не написано — клас визначено автоматично.') : null)),
    m.uk ? h('p', { style: { fontSize: '1.05rem' } }, m.uk) : null,
    m.verify ? h('p.draft', null, '⚑ Чернетка: частину фактів не вдалося підтвердити даними збірки (jar, конфіги, квести).') : null,
    m.icons?.length ? itemList(s, m.icons) : null,
    m.what?.length ? h('ul', null, m.what.map((w) => h('li', null, w))) : null,
    m.dims?.length ? h('div.section', null, h('h2', null, 'Виміри'), h('ul', null, m.dims.map((d) => h('li', null, d.name, ' ', h('code.small.muted', null, d.id))))) : null,
    m.stage?.length ? h('div.badges', null, h('span.small.muted', null, 'Етапи: '), m.stage.map((x) => stageBadge(s, x))) : null,
    m.book ? h('p.small', { style: { marginTop: '10px' } }, h('span.muted', null, '📖 Книга в грі: '), m.book) : null,
    m.synergy?.length ? h('div.section', null, h('h2', null, 'Синергії'),
      h('ul.list-clean', null, m.synergy.map((x) => h('li', null, h('a', { href: `#/mod/${x.mod}` }, s.modById.get(x.mod)?.name || x.mod), ' — ', x.why)))) : null,
    m.tips?.length ? h('div.section', null, h('h2', null, 'Поради'), h('ul', null, m.tips.map((t) => h('li', null, t)))) : null,
    m.spoiler ? spoiler(h('p', null, m.spoiler)) : null,
    keysBox,
    addons.length ? h('div.section', null, h('h2', null, 'Доповнення'), modLinks(s, addons)) : null,
    nodes.length ? h('div.section', null, h('h2', null, 'На дорожній карті'),
      h('div.badges', null, nodes.map((n) => h('a.badge', { href: `#/roadmap?node=${n.id}`, style: { '--c': s.classById.get(n.lane)?.color } }, n.title)),
        h('a.badge', { href: `#/roadmap?mod=${id}`, style: { '--c': 'var(--accent)' } }, '✦ підсвітити всі віхи мода'))) : null,
    chapters.length ? h('div.section', null, h('h2', null, 'Глави квестів'),
      h('div.badges', null, chapters.filter((ch) => !ch.hidden).map((ch) => h('a.badge', { href: `#/chapter/${ch.file}`, style: { '--c': 'var(--accent)' } }, ch.title))),
      chapters.some((ch) => ch.hidden) ? h('div.badges', null, h('span.small.muted', null, 'Приховані в грі: '),
        chapters.filter((ch) => ch.hidden).map((ch) => h('a.badge.ghost', { href: `#/chapter/${ch.file}`, title: hiddenWhy(ch) }, ch.title))) : null) : null,
    h('div.section', null, h('h2', null, 'Технічне'),
      h('dl.kv', null,
        dt('ID', h('code', null, m.id)), dt('Версія', m.version || '—'), dt('Автори', m.authors || '—'),
        dt('Опис автора', m.desc_en || '—'),
        dt('Вміст', `предметів ${c.item || 0}, блоків ${c.block || 0}, істот ${c.entity || 0}, ефектів ${c.effect || 0}, зачарувань ${c.enchantment || 0}, біомів ${c.biome || 0}`),
        dt('Переклад (ключів у паку)', String(m.uk_keys || 0)),
        m.books?.length ? dt('Книги Patchouli', m.books.join(', ')) : null,
        dt('Файл', h('code', null, m.jar)),
        m.url ? dt('Сторінка', h('a', { href: m.url, target: '_blank', rel: 'noopener' }, m.url)) : null)),
    deps.length ? h('div.section', null, h('h3', null, 'Потребує'), modLinks(s, deps)) : null,
    users.length ? h('div.section', null, h('h3', null, 'Використовується модами'), modLinks(s, users)) : null);
}

/** @param {string} k @param {any} v */
const dt = (k, v) => [h('dt', null, k), h('dd', null, v)];
