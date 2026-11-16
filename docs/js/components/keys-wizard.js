// @ts-check
// Вкладка «🧭 Майстер» правої панелі #/keys (GK2): для конфліктів і важливих непризначених дій — варіанти вільних зручних клавіш
// (core/keys-suggest.js), рядки для options.txt і «Скопіювати». Сайт нічого не пише в гру: застосовує користувач при закритій грі.
import { h, mount } from '../core/dom.js';
import { comboText, optionsLine } from '../core/keys-model.js';
import { suggestCtx, wizardTargets, checkPicks, planAll } from '../core/keys-suggest.js';
import { modName } from './keys-list.js';

/** Скопіювати текст у буфер; якщо браузер не дав — показати поле з текстом, виділене для Ctrl+C.
 * @param {string} text @param {HTMLElement} btn */
async function copyText(text, btn) {
  const old = btn.textContent;
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = '✓ Скопійовано';
  } catch {
    const ta = /** @type {HTMLTextAreaElement} */ (h('textarea.wz-fallback', { readonly: true, rows: Math.min(8, text.split('\n').length + 1) }));
    ta.value = text;
    btn.after(ta); ta.select();
    btn.textContent = 'Виділено — Ctrl+C';
  }
  setTimeout(() => { btn.textContent = old; }, 1800);
}

/**
 * @param {Store} s @param {any} kd @param {KeyAct[]} keys поточні клавіші (options.txt, без плану)
 * @param {{reserved: {l: string, bind: string, why: string}[], onPreview: (l: string | null, bind?: string) => void}} o
 */
export function wizardSection(s, kd, keys, o) {
  const cx = suggestCtx(keys, { reserved: o.reserved });
  const targets = wizardTargets(cx, 3);
  /** Вибір: id дії → індекс варіанта (-1 — лишити як є). Типово — узгоджений набір перших варіантів (planAll). */
  const sel = new Map();
  for (const p of planAll(keys, { reserved: o.reserved })) {
    const t = targets.flatMap((x) => x.acts).find((a) => a.act.id === p.id);
    const i = t ? t.sugg.findIndex((v) => v.l === p.l && v.bind === p.bind) : -1;
    if (i >= 0) sel.set(p.id, i);
  }
  const root = h('div.wizard');

  const picks = () => targets.flatMap((t) => t.acts).filter((a) => (sel.get(a.act.id) ?? -1) >= 0)
    .map((a) => { const v = a.sugg[sel.get(a.act.id)]; return { id: a.act.id, l: v.l, bind: v.bind, combo: v.combo, act: a.act }; });
  // незастосовані пункти вашого плану (content/keys.json) — теж вибрані, якщо разом не дають нового конфлікту
  for (const a of targets.flatMap((x) => x.acts)) {
    if (sel.has(a.act.id) || !a.sugg[0]?.plan) continue;
    sel.set(a.act.id, 0);
    if (!checkPicks(keys, picks()).ok) sel.delete(a.act.id);
  }

  function draw() {
    const ps = picks();
    const chk = checkPicks(keys, ps);
    const lines = ps.map((p) => optionsLine(p.id, p.bind, p.l));
    const bad = new Set(chk.fresh.flatMap((f) => f.acts.map((a) => a.id)));
    const allBtn = h('button.btn.wz-copy', { disabled: !ps.length || !chk.ok, onclick: () => copyText(lines.join('\n'), allBtn) }, `📋 Скопіювати вибрані (${ps.length})`);
    const ptt = o.reserved.filter((r) => r.why).map((r) => r.why).join(', ');
    mount(root,
      h('p.small.muted', null, 'Майстер лише пропонує — у гру нічого не пише. Перший варіант — найкращий; наведіть, щоб побачити його на клавіатурі.'),
      h('details.wz-rules.small.muted', null, h('summary', null, 'Як підбирає'),
        h('p', null, 'Від ваших поточних клавіш (options.txt), за тією самою моделлю конфліктів, що й уся вкладка; спершу — незастосований пункт вашого плану, далі ваші правила: ',
          'інтерактивні дії — бічні кнопки миші, рідкісні перемикачі HUD — Ins / Home / End; потім та сама клавіша з модифікатором, літера з назви, близькість до WASD.'),
        h('p', null, 'Ванільні клавіші не чіпаємо; Ctrl / Shift не ставимо на клавіші руху й ванільних дій (біг і присідання перехопили б їх); шар Alt не пропонуємо; моди на Kuma API — лише без модифікатора.',
          ptt ? ` Зайняте компаньйоном: ${ptt}.` : '')),
      targets.length ? h('div.wz-bar', null,
        h('span', null, 'Вибрано ', h('b', null, String(ps.length)), ` · конфліктів ${chk.conflicts[0]} → `, h('b', null, String(chk.conflicts[1]))),
        chk.ok ? h('span.ok', null, '✓ нових конфліктів немає')
          : h('span.lv2', null, '⚠ нові конфлікти: ' + chk.fresh.map((f) => `${f.combo} (${f.acts.map((a) => a.name).join(' × ')})`).join('; ')),
        allBtn) : h('p.ok', null, '✓ Конфліктів і важливих непризначених дій немає — майстру нічого пропонувати.'),
      h('div.kcards', null, targets.map((t) => card(t, bad))),
      ps.length ? h('div.wz-howto.small.muted', null,
        h('b', null, 'Як застосувати: '), 'закрийте гру → відкрийте minecraft/options.txt → замініть рядки з тими самими key_… на скопійовані → збережіть (рядки Windows, CRLF) → запустіть гру й перевірте → оновіть клавіші на сайті (start.bat → 2).') : null);
  }

  /** @param {ReturnType<typeof wizardTargets>[number]} t @param {Set<string>} bad */
  function card(t, bad) {
    const head = t.kind === 'conflict'
      ? h('div.kc-head', null, h('span.kbd', null, t.combo), h('span.kc-st', null, '⚠ конфлікт — перенесіть одну з дій'))
      : h('div.kc-head', null, h('span.kbd.none', null, '—'), h('span.kc-st', null, '★ важлива, не призначена'));
    return h(`div.kcard.wz-c.st-${t.kind === 'conflict' ? 'conflict' : 'maybe'}`, null, head,
      t.acts.map((a, ai) => actBlock(a, ai === 0 && t.kind === 'conflict', bad.has(a.act.id))));
  }

  /** @param {{act: KeyAct, sugg: any[]}} a @param {boolean} rec @param {boolean} isBad */
  function actBlock(a, rec, isBad) {
    const cur = sel.get(a.act.id) ?? -1;
    const choose = (/** @type {number} */ i) => { sel.set(a.act.id, i); draw(); };
    const v = cur >= 0 ? a.sugg[cur] : null;
    const line = v ? optionsLine(a.act.id, v.bind, v.l) : '';
    const copyBtn = h('button.btn.small', { onclick: () => copyText(line, copyBtn) }, '📋 Скопіювати');
    return h(`div.wz-act${isBad ? '.bad' : ''}`, null,
      h('div.wz-name', null, h(`i.cdot.${a.act.ctx}`, { title: kd.ctxs.find((/** @type {any} */ c) => c.id === a.act.ctx)?.title }),
        h('b', null, a.act.name), h('span.kc-mod', null, modName(s, a.act)),
        h('span.small.muted', null, ` · зараз ${comboText(a.act) || 'не призначено'}`),
        rec ? h('span.wz-rec', null, 'рекомендуємо перенести цю') : null),
      a.sugg.length ? h('div.wz-opts', null,
        a.sugg.map((sg, i) => h(`label.wz-opt${cur === i ? '.on' : ''}`, {
          onmouseenter: () => o.onPreview(sg.l, sg.bind), onmouseleave: () => o.onPreview(null),
        },
        h('input', { type: 'radio', name: 'wz-' + a.act.id, checked: cur === i, onchange: () => choose(i) }),
        h('span.kbd.to', null, sg.combo), i === 0 ? h('span.wz-best', null, 'найкраще') : null, sg.lvl ? h('span.lv1.small', null, '◐ можливий') : null,
        h('span.wz-why', null, sg.why.join(' · ')))),
        h(`label.wz-opt.keep${cur < 0 ? '.on' : ''}`, null,
          h('input', { type: 'radio', name: 'wz-' + a.act.id, checked: cur < 0, onchange: () => choose(-1) }),
          h('span.muted', null, 'лишити як є'))) : h('p.small.muted', null, a.act.ns === 'minecraft' ? 'Ванільна дія — лишаємо на місці.' : 'Вільних сполучень без конфлікту немає.'),
      v ? h('div.wz-line', null, h('code', null, line), copyBtn) : null);
  }

  draw();
  return root;
}

/** Кількість цілей майстра (для підпису вкладки). @param {KeyAct[]} keys @param {{l: string, bind: string, why: string}[]} reserved */
export const wizardCount = (keys, reserved) => wizardTargets(suggestCtx(keys, { reserved }), 0).length;
