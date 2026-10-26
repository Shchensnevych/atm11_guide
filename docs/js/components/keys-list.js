// @ts-check
// Список дій вкладки «Клавіші» (групи «за категоріями» / «за модами»), панель вибраного сполучення і блок «Клавіші» на сторінці мода.
import { h } from '../core/dom.js';
import { comboText, actLevel, level, layerOf, UNBOUND, MOD_TITLE, pretty } from '../core/keys-model.js';

/** «none» → «зняти». @param {string} p */
export const planText = (p) => (p === 'none' ? 'зняти' : p);
/** @param {any} kd дані loadKeys() @param {string} id */
export const ctxTitle = (kd, id) => kd.ctxs.find((/** @type {any} */ c) => c.id === id)?.title || id;
/** @param {any} kd @param {KeyAct} k */
export const ctxBadge = (kd, k) => h(`span.ctx.${k.ctx}`, { title: kd.ctxs.find((/** @type {any} */ c) => c.id === k.ctx)?.desc || '' }, ctxTitle(kd, k.ctx));
/** @param {Store} s @param {KeyAct} k */
export const modName = (s, k) => (k.mod && s.modById.get(k.mod)?.name) || (k.ns === 'minecraft' ? 'Minecraft' : k.ns);
/** @param {Store} s @param {KeyAct} k */
export const modLink = (s, k) => (k.mod ? h('a', { href: `#/mod/${k.mod}` }, modName(s, k)) : h('span.muted', null, modName(s, k)));

/**
 * Рядок дії.
 * @param {Store} s @param {any} kd @param {KeyAct} k @param {Map<string, any>} by
 * @param {{showMod?: boolean, onPick?: (k: KeyAct) => void, onSug?: (k: KeyAct | null) => void}} o
 */
export function actRow(s, kd, k, by, o = {}) {
  const lv = k.bind === UNBOUND ? 0 : actLevel(k, by);
  const combo = comboText(k);
  return h(`li.ka${lv ? '.lv' + lv : ''}${k.bind === UNBOUND ? '.unb' : ''}`, {
    onmouseenter: k.plan && o.onSug ? () => o.onSug?.(k) : null, onmouseleave: k.plan && o.onSug ? () => o.onSug?.(null) : null,
  },
  h('button.kbd', { title: combo ? 'Показати на клавіатурі' : 'Не призначено', disabled: !combo, onclick: () => o.onPick?.(k) }, combo || '—'),
  h('div.ka-main', null,
    h('div.ka-name', null, k.imp ? h('span.imp', { title: 'Важлива дія — варто мати клавішу' }, '★ ') : null, k.name,
      lv ? h(`span.lv${lv}`, { title: lv === 2 ? 'Конфлікт: діє в тому ж контексті' : 'Можливий конфлікт (умовно)' }, lv === 2 ? ' ⚠' : ' ◐') : null),
    h('div.ka-meta', null, o.showMod ? [modLink(s, k), ' · '] : null, ctxBadge(kd, k),
      k.note ? h('span.muted', null, ' ', k.note) : null,
      k.plan_done ? h('span.small.muted', { title: `Перепризначено в збірці: ${k.why || ''}` }, ` · було ${k.was || '—'}`)
        : k.plan ? h('span.sug', { title: `План: ${k.why || ''}` }, ` → ${planText(k.plan)}`) : null)));
}

/**
 * Згрупований список.
 * @param {Store} s @param {any} kd @param {KeyAct[]} list @param {Map<string, any>} by @param {'cat'|'mod'} group
 * @param {{onPick?: (k: KeyAct) => void, onSug?: (k: KeyAct | null) => void, open?: boolean}} o
 */
export function keysList(s, kd, list, by, group, o) {
  /** @type {Map<string, KeyAct[]>} */
  const g = new Map();
  for (const k of list) {
    const id = group === 'cat' ? k.cat : (k.mod || k.ns);
    if (!g.has(id)) g.set(id, []);
    /** @type {KeyAct[]} */ (g.get(id)).push(k);
  }
  const order = group === 'cat' ? kd.cats.map((/** @type {any} */ c) => c.id)
    : [...g.keys()].sort((a, b) => (a === 'minecraft' ? -1 : b === 'minecraft' ? 1 : modName(s, /** @type {any} */ (g.get(a))[0]).localeCompare(modName(s, /** @type {any} */ (g.get(b))[0]))));
  const sortActs = (/** @type {KeyAct[]} */ v) => v.sort((a, b) => (a.bind === UNBOUND ? 1 : 0) - (b.bind === UNBOUND ? 1 : 0) || modName(s, a).localeCompare(modName(s, b)));
  return h('div.klist', null, order.filter((id) => g.has(id)).map((id) => {
    const v = sortActs(/** @type {KeyAct[]} */ (g.get(id)));
    const cat = kd.cats.find((/** @type {any} */ c) => c.id === id);
    const head = group === 'cat' ? [cat?.icon || '', ' ', cat?.title || id] : [modLink(s, v[0])];
    return h('details.kgroup', { open: !!o.open }, h('summary', null, head, h('span.muted.small', null, ` ${v.length}`)),
      h('ul.list-clean.kacts', null, v.map((k) => actRow(s, kd, k, by, { ...o, showMod: group === 'cat' }))));
  }));
}

/**
 * Панель вибраного сполучення: дії за модами, конфлікти, поради.
 * @param {Store} s @param {any} kd @param {string} layer @param {string} bind @param {Map<string, any>} by
 */
export function keyPanel(s, kd, layer, bind, by) {
  const v = by.get(layer + '|' + bind);
  const title = (layer ? MOD_TITLE[layer] + '+' : '') + pretty(bind);
  if (!v) return h('div.kpanel', null, h('h2', null, h('span.kbd.big', null, title)), h('p.muted', null, 'Вільно — у вибраних контекстах на цьому сполученні немає дій.'));
  /** @type {Map<string, KeyAct[]>} */
  const g = new Map();
  for (const k of v.acts) { const id = k.mod || k.ns; if (!g.has(id)) g.set(id, []); /** @type {KeyAct[]} */ (g.get(id)).push(k); }
  const st = v.lvl === 2 ? h('p.lv2', null, '⚠ Конфлікт: кілька дій працюють в одному контексті — спрацюють одночасно.')
    : v.lvl === 1 ? h('p.lv1', null, '◐ Можливий конфлікт: лише в особливих умовах (з предметами в руці, верхи, у творчому режимі).')
      : v.acts.length > 1 ? h('p.muted', null, 'Кілька дій, але в різних контекстах — не заважають одна одній.') : null;
  return h('div.kpanel', null, h('h2', null, h('span.kbd.big', null, title), h('span.muted.small', null, ` ${v.acts.length} ${v.acts.length % 10 === 1 && v.acts.length % 100 !== 11 ? 'дія' : v.acts.length % 10 >= 2 && v.acts.length % 10 <= 4 && (v.acts.length % 100 < 12 || v.acts.length % 100 > 14) ? 'дії' : 'дій'}`)), st,
    h('div.kp-mods', null, [...g.values()].map((acts) => h('div.kp-mod', null, h('h3', null, modLink(s, acts[0])),
      h('ul.list-clean', null, acts.map((k) => {
        const others = v.acts.filter((/** @type {KeyAct} */ x) => x !== k && level(k, x) > 0);
        return h('li', null, h('div', null, k.imp ? '★ ' : '', h('b', null, k.name), ' ', ctxBadge(kd, k)),
          k.note ? h('div.small.muted', null, k.note) : null,
          others.length ? h(`div.small.lv${Math.max(...others.map((x) => level(k, x)))}`, { title: others.map((x) => `${x.name} (${modName(s, x)})`).join('\n') },
            `${Math.max(...others.map((x) => level(k, x))) === 2 ? '⚠' : '◐'} заважає: `, others.length > 2 ? `${others.length} діям` : others.map((x) => x.name).join(', ')) : null,
          k.plan_done ? h('div.small.muted', null, `✓ Перепризначено в збірці (було ${k.was || '—'} → ${k.plan === 'none' ? 'без клавіші' : k.plan}): ${k.why || ''}`)
            : k.plan ? h('div.small.sug', null, `План: ${k.plan === 'none' ? 'зняти клавішу' : 'перенести на ' + k.plan} — ${k.why || ''}`) : null);
      }))))));
}

/**
 * Блок «Клавіші» на сторінці мода.
 * @param {Store} s @param {any} kd @param {string} modId @param {Map<string, any>} by
 */
export function modKeysBlock(s, kd, modId, by) {
  const list = kd.keys.filter((/** @type {KeyAct} */ k) => k.mod === modId);
  if (!list.length) return null;
  const conf = list.filter((/** @type {KeyAct} */ k) => k.bind !== UNBOUND && actLevel(k, by) === 2).length;
  const unb = list.filter((/** @type {KeyAct} */ k) => k.bind === UNBOUND).length;
  return h('div.section.mod-keys', null, h('h2', null, 'Клавіші ', h('span.muted.small', null,
    `${list.length} ${conf ? `· конфліктів ${conf}` : ''} ${unb ? `· не призначено ${unb}` : ''}`)),
  h('ul.list-clean.kacts', null, list.sort((a, b) => (a.bind === UNBOUND ? 1 : 0) - (b.bind === UNBOUND ? 1 : 0))
    .map((/** @type {KeyAct} */ k) => actRow(s, kd, k, by, { onPick: (x) => { location.hash = `#/keys?k=${encodeURIComponent(layerOf(x) + '|' + x.bind)}`; } }))),
  h('p.small', null, h('a', { href: `#/keys?q=${encodeURIComponent(modId)}` }, 'Відкрити на вкладці «Клавіші» →')));
}
