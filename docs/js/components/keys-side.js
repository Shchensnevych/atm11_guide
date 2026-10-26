// @ts-check
// Права панель вкладки «Клавіші»: картки «за клавішами» (поточний шар, у порядку клавіатури) і вкладка «План перепризначень».
import { h } from '../core/dom.js';
import { pretty, comboText, MOD_TITLE, UNBOUND, parseSuggest } from '../core/keys-model.js';
import { ORDER, mainAct } from './keyboard.js';
import { modName, planText } from './keys-list.js';

/** 2–4 дії, 5+ дій, 21 дія. @param {number} n */
export const dij = (n) => (n % 10 === 1 && n % 100 !== 11 ? 'дія' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'дії' : 'дій');

/**
 * Картки «за клавішами»: одна клавіша — одна картка (смужка-заголовок кольору стану + дії, розділені лініями).
 * @param {Store} s @param {any} kd @param {Map<string, {acts: KeyAct[], lvl: number}>} by @param {string} layer
 * @param {{cat?: string, q?: string, conf?: boolean, onHover: (bind: string | null, el?: HTMLElement) => void, onPick: (bind: string) => void}} o
 */
export function keyCards(s, kd, by, layer, o) {
  const q = (o.q || '').trim().toLowerCase();
  const rows = [...by.entries()].filter(([c, v]) => c.split('|')[0] === layer)
    .map(([c, v]) => ({ bind: c.split('|')[1], v, acts: v.acts.filter((a) => (!o.cat || a.cat === o.cat)
      && (!q || `${a.name} ${a.en || ''} ${a.id} ${modName(s, a)} ${pretty(c.split('|')[1])}`.toLowerCase().includes(q))) }))
    .filter((r) => r.acts.length && (!o.conf || r.v.lvl > 0))
    .sort((a, b) => (ORDER.get(a.bind) ?? 999) - (ORDER.get(b.bind) ?? 999));
  if (!rows.length) return h('p.empty', null, 'На цьому шарі нічого не знайдено.');
  return h('div.kcards', null, rows.map(({ bind, v, acts }) => {
    const main = mainAct(v.acts);
    const st = v.lvl === 2 ? 'conflict' : v.lvl === 1 ? 'maybe' : v.acts.length > 1 ? 'multi' : 'one';
    const card = h(`div.kcard.st-${st}`, {
      'data-bind': bind, onmouseenter: () => o.onHover(bind, card), onmouseleave: () => o.onHover(null), onclick: () => o.onPick(bind),
    },
    h('div.kc-head', null, h('span.kbd', null, (layer ? MOD_TITLE[layer] + '+' : '') + pretty(bind)),
      h('span.kc-st', null, v.lvl === 2 ? '⚠ конфлікт' : v.lvl === 1 ? '◐ можливий' : v.acts.length > 1 ? `${v.acts.length} ${dij(v.acts.length)}, різні контексти` : ''),
      acts.length < v.acts.length ? h('span.muted.small', null, `+${v.acts.length - acts.length} поза фільтром`) : null),
    h('ul.kc-acts', null, [...acts].sort((a, b) => (a === main ? -1 : b === main ? 1 : 0)).map((a) => h('li', null,
      h(`i.cdot.${a.ctx}`, { title: kd.ctxs.find((/** @type {any} */ c) => c.id === a.ctx)?.title }),
      h('span.kc-name', null, a.name), h('span.kc-mod', null, modName(s, a)),
      a.was ? h('span.sug.small', null, ` було ${a.was}`) : null))));
    return card;
  }));
}

/**
 * План перепризначень (вкладка панелі): картки «було → стане», причина; рядки для options.txt.
 * @param {Store} s @param {any} kd @param {KeyAct[]} keys дані без плану @param {(k: KeyAct) => void} onPick
 */
export function planSection(s, kd, keys, onPick) {
  const plan = keys.filter((k) => k.plan);
  if (!plan.length) return h('p.empty', null, 'План порожній.');
  const MODK = { S: 'SHIFT', C: 'CONTROL', A: 'ALT' };
  const lines = plan.map((k) => { const to = parseSuggest(k.plan || 'none'); return `key_${k.id}:${to.bind}${to.l ? ':' + MODK[to.l] : ''}`; });
  const download = () => {
    const blob = new Blob(['# План перепризначень ATM11 (путівник, вкладка «Клавіші»).\n# Закрийте гру, відкрийте minecraft/options.txt і замініть рядки з тими самими key_… на ці:\n' + lines.join('\n') + '\n'], { type: 'text/plain' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'keys_plan.txt' }); document.body.append(a); a.click(); a.remove();
  };
  const card = (/** @type {KeyAct} */ k) => h(`div.kcard.plan-c${k.plan_done ? '.done' : ''}`, { onclick: () => onPick(k) },
    h('div.kc-head', null, h('span.kbd', null, (k.plan_done ? k.was : comboText(k)) || '—'), h('span.muted', null, '→'), h('span.kbd.to', null, planText(k.plan || '')),
      k.plan_done ? h('span.kc-st.ok', null, '✓ застосовано') : null),
    h('div.pc-body', null, h('div', null, h('b', null, k.name), ' ', h('span.kc-mod', null, modName(s, k))), h('div.small.muted', null, k.why || '')));
  const done = plan.filter((k) => k.plan_done).length;
  return h('div.plan', null,
    done ? h('p.ok', null, `✓ План застосовано до options.txt: ${done} з ${plan.length}. Копія попередніх клавіш — minecraft/options.txt.bak.`) : null,
    h('p.small.muted', null, `Клавіші модів «з предметом у руці» лишаються своїми; переносимо глобальні рідковживані дії й даємо клавіші важливим. `,
      h('b', null, `Конфліктів: ${kd.stat?.conflicts ?? '?'} → ${kd.stat?.plan_conflicts ?? '?'}`), `, важливих непризначених: ${kd.stat?.imp_unbound ?? '?'} → ${kd.stat?.plan_imp_unbound ?? '?'}. `,
      'Угорі «З планом» — показати результат на клавіатурі.'),
    h('p', null, h('button.btn', { onclick: download }, '⬇ Рядки для options.txt')),
    h('h3', null, 'Перенести або зняти'), h('div.kcards', null, plan.filter((k) => (k.was || '—') !== '—').map(card)),
    h('h3', null, 'Призначити важливі'), h('div.kcards', null, plan.filter((k) => (k.was || '—') === '—').map(card)));
}
