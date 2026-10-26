// @ts-check
// Сторінка гілки: опис, що дає, схема кроків (jsPlumb) і панель кроку з позначкою «зроблено».
import { h, mount } from '../core/dom.js';
import { drawScheme } from '../graph/scheme-plumb.js';
import { isDone, setDone } from '../core/progress.js';
import { stageBadge } from '../components/badge.js';
import { modLinks } from '../components/modcard.js';
import { spoiler } from '../components/spoiler.js';
import { featuresOf, featRow, clsIcon } from '../components/feat.js';
import { getViewState, setViewState } from '../core/view-state.js';

/** @param {HTMLElement} el @param {string[]} p @param {Store} s */
export function render(el, [id], s) {
  const b = s.branches.find((x) => x.id === id);
  if (!b) { mount(el, h('div.empty', null, 'Гілку не знайдено. ', h('a', { href: '#/branches' }, 'До списку'))); return; }
  const stateKey = `branch:${b.id}`;
  const saved = getViewState(stateKey, { sid: '' });
  const c = s.classById.get(b.cls); const ch = b.chapter && s.chapterByFile.get(b.chapter);
  const box = h('div.scheme'); const panel = h('div.card', { style: { marginTop: '14px' } }, h('p.muted', null, 'Клікніть крок на схемі.'));
  mount(el,
    h('p', null, h('a', { href: '#/branches' }, '← Гілки')),
    h('h1', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, clsIcon(b.cls, c?.color) || (b.icon || ''), b.title),
    h('div.badges', null, b.enter ? [h('span.small.muted', null, 'Вхід з етапу: '), stageBadge(s, b.enter)] : null),
    h('p', { style: { marginTop: '10px', fontSize: '1.05rem' } }, b.summary),
    b.gives?.length ? h('div.section', null, h('h3', null, 'Що дає для прогресу'), h('ul', null, b.gives.map((g) => h('li', null, g)))) : null,
    h('div.small', null, modLinks(s, b.mods)),
    (() => { const f = featuresOf(s, b.mods || []); return f.list.length ? h('div', { style: { marginTop: '8px' } }, featRow(f.list, f.dims, true)) : null; })(),
    ch ? h('p.small', { style: { marginTop: '8px' } }, '📜 Глава квестів: ', h('a', { href: `#/chapter/${ch.file}` }, ch.title), b.book ? ` · 📖 Книга: «${b.book}»` : '') : null,
    b.verify ? h('p.small', { style: { color: 'var(--warn)' } }, '⚑ Чернетка: кроки звіряються з книгою мода.') : null,
    h('h2.section', null, 'Схема'), box, panel);
  const onStep = (sid) => {
    const st = (b.steps || []).find((x) => x.id === sid);
    if (!st) return;
    setViewState(stateKey, { sid });
    sch.select(sid);
    const key = `${b.id}:${sid}`;
    mount(panel, h('h3', null, st.title), st.spoiler ? spoiler(h('p', null, st.text)) : h('p', null, st.text),
      h('label.check', null, h('input', { type: 'checkbox', checked: isDone(key), onchange: (e) => { setDone(key, e.target.checked); sch.mark(sid); } }), 'Зроблено'));
  };
  const sch = drawScheme(box, b.steps || [], b.links || [], c?.color || '#facc15', onStep, b.id);
  if (saved.sid) onStep(saved.sid);
}
