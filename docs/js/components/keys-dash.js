// @ts-check
import { h } from '../core/dom.js';
import { pretty, MOD_TITLE } from '../core/keys-model.js';
import { modName } from './keys-list.js';
import { mainAct } from './keyboard.js';

/**
 * Розкладка міні-калькулятора NumPad (4 колонки, 5 рядків)
 */
const PAD_GRID = [
  { bind: 'key.keyboard.num.lock', label: 'Num', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.divide', label: '/', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.multiply', label: '*', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.subtract', label: '-', w: 1, h: 1 },

  { bind: 'key.keyboard.keypad.7', label: '7', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.8', label: '8', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.9', label: '9', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.add', label: '+', w: 1, h: 2 },

  { bind: 'key.keyboard.keypad.4', label: '4', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.5', label: '5', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.6', label: '6', w: 1, h: 1 },

  { bind: 'key.keyboard.keypad.1', label: '1', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.2', label: '2', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.3', label: '3', w: 1, h: 1 },
  { bind: 'key.keyboard.keypad.enter', label: '↵', w: 1, h: 2 },

  { bind: 'key.keyboard.keypad.0', label: '0', w: 2, h: 1 },
  { bind: 'key.keyboard.keypad.decimal', label: '.', w: 1, h: 1 },
];

let accordionOpen = true;

/**
 * Інтерактивний аналітичний дашборд розкладки та зіткнень:
 * 1. Картка прямих конфліктів (Severity 2 ⚠️)
 * 2. Топ перевантажених клавіш (мікро-гістограма)
 * 3. Міні-NumPad віджет (калькуляторний блок для TKL)
 * 4. Акордеон безпечних контекстних перетинів (Severity 1 ◐)
 *
 * @param {any} s Store
 * @param {any} kd KeysData
 * @param {{layer: string, sel: string|null, layout: string}} st
 * @param {Map<string, {lvl: number, acts: any[]}>} by
 * @param {{onPick: (bind: string, layer?: string) => void, onHover: (bind: string|null) => void}} handlers
 */
export function keysDashboard(s, kd, st, by, handlers) {
  const layerPrefix = st.layer ? MOD_TITLE[st.layer] + '+' : '';

  // 1. Критичні конфлікти (lvl 2)
  const conflicts = [...by.entries()].filter(([c, v]) => v.lvl === 2 && c.split('|')[0] === st.layer);

  // 2. Топ перевантажених клавіш за кількістю дій
  const layerEntries = [...by.entries()]
    .filter(([c, v]) => c.split('|')[0] === st.layer && v.acts.length > 0)
    .sort((a, b) => b[1].acts.length - a[1].acts.length);
  const topKeys = layerEntries.slice(0, 4);
  const maxActs = topKeys.length ? topKeys[0][1].acts.length : 1;

  // 3. Активні дії на NumPad
  const padActive = PAD_GRID.map((p) => {
    const v = by.get(st.layer + '|' + p.bind);
    return v && v.acts.length ? { ...p, v } : null;
  }).filter(Boolean);

  // 4. Можливі контекстні перетини (lvl 1)
  const safeCollisions = [...by.entries()].filter(([c, v]) => v.lvl === 1 && c.split('|')[0] === st.layer);

  // ── Картка 1: Критичні конфлікти ──
  const conflictCard = h('div.kbd-card.kbd-conflicts', null,
    h('div.kbd-card-h', null,
      h('div.kbd-card-title', null,
        h('span.kbd-card-icon', null, '⚠️'),
        h('b', null, 'Критичні конфлікти'),
        conflicts.length
          ? h('span.kbd-badge.lv2', null, `${conflicts.length}`)
          : h('span.kbd-badge.ok', null, '0')
      ),
      h('span.small.muted', null, 'однакові умови активації')
    ),
    conflicts.length ? h('div.kbd-conf-list', null, conflicts.map(([c, v]) => {
      const bind = c.split('|')[1];
      const isSelected = st.sel === bind;
      const actNames = v.acts.map((a) => `${a.name} (${modName(s, a)})`).join(' ⚡ ');
      return h(`div.kbd-conf-row${isSelected ? '.sel' : ''}`, {
        onclick: () => handlers.onPick(bind),
        onmouseenter: () => handlers.onHover(bind),
        onmouseleave: () => handlers.onHover(null),
        title: 'Клік — відкрити та розібрати конфлікт'
      },
        h('span.kbd.kbd-warn', null, layerPrefix + pretty(bind)),
        h('div.kbd-conf-text', null,
          h('div.kbd-conf-acts', null, actNames),
          h('div.kbd-conf-sub.small', null, 'Дії спрацюють одночасно в грі — змініть одну з них')
        )
      );
    })) : h('div.kbd-empty-state.ok', null,
      h('span.kbd-empty-ic', null, '✓'),
      h('b', null, 'Жодних конфліктів дій'),
      h('span.small.muted', null, `На шарі «${st.layer ? MOD_TITLE[st.layer] : 'без модифікатора'}» всі дії розведені`)
    )
  );

  // ── Картка 2: Топ перевантажених клавіш ──
  const topKeysCard = h('div.kbd-card.kbd-topkeys', null,
    h('div.kbd-card-h', null,
      h('div.kbd-card-title', null,
        h('span.kbd-card-icon', null, '📊'),
        h('b', null, 'Топ гарячих клавіш'),
        h('span.kbd-badge.neutral', null, `${topKeys.length}`)
      ),
      h('span.small.muted', null, 'найбільше призначених дій')
    ),
    topKeys.length ? h('div.kbd-bars-list', null, topKeys.map(([c, v]) => {
      const bind = c.split('|')[1];
      const isSelected = st.sel === bind;
      const pct = Math.max(18, Math.round((v.acts.length / maxActs) * 100));
      const main = mainAct(v.acts);
      const lvlCls = v.lvl === 2 ? 'lv2' : v.lvl === 1 ? 'lv1' : 'ok';
      return h(`div.kbd-bar-row${isSelected ? '.sel' : ''}`, {
        onclick: () => handlers.onPick(bind),
        onmouseenter: () => handlers.onHover(bind),
        onmouseleave: () => handlers.onHover(null),
        title: `${pretty(bind)}: ${v.acts.length} дій (${v.acts.map((a) => a.name).join(', ')})`
      },
        h('span.kbd', null, layerPrefix + pretty(bind)),
        h('div.kbd-bar-track', null,
          h(`div.kbd-bar-fill.${lvlCls}`, { style: { width: `${pct}%` } }),
          h('span.kbd-bar-lbl', null,
            h('span.kbd-bar-act-name', null, main.name),
            h('span.kbd-bar-mod', null, ` · ${modName(s, main)}`)
          )
        ),
        h('span.kbd-bar-count', null, `${v.acts.length}`)
      );
    })) : h('p.muted.small', null, 'Немає призначених клавіш.')
  );

  // ── Картка 3: Міні-NumPad калькулятор ──
  const numpadCard = h('div.kbd-card.kbd-numpad', null,
    h('div.kbd-card-h', null,
      h('div.kbd-card-title', null,
        h('span.kbd-card-icon', null, '🔢'),
        h('b', null, 'Цифровий блок'),
        h('span.kbd-badge.neutral', null, `${padActive.length} дій`)
      ),
      h('span.small.muted', null, st.layout === 'tkl' ? 'відсутній на TKL 87' : 'розкладка 104')
    ),
    h('div.kbd-np-body', null,
      // Візуальна калькуляторна сітка
      h('div.mini-np-grid', null, PAD_GRID.map((k) => {
        const v = by.get(st.layer + '|' + k.bind);
        const hasAct = v && v.acts.length > 0;
        const isSelected = st.sel === k.bind;
        const cls = [
          'mnp-k',
          k.w === 2 ? 'w2' : '',
          k.h === 2 ? 'h2' : '',
          hasAct ? 'active' : '',
          v?.lvl === 2 ? 'lv2' : v?.lvl === 1 ? 'lv1' : hasAct ? 'act' : '',
          isSelected ? 'sel' : ''
        ].filter(Boolean).join(' ');

        return h('button', {
          type: 'button',
          class: cls,
          onclick: hasAct ? () => handlers.onPick(k.bind) : null,
          onmouseenter: hasAct ? () => handlers.onHover(k.bind) : null,
          onmouseleave: hasAct ? () => handlers.onHover(null) : null,
          title: hasAct ? `${pretty(k.bind)}: ${v.acts.map((a) => a.name).join(' / ')}` : pretty(k.bind)
        }, k.label);
      })),
      // Компактний перелік дій поруч
      h('div.kbd-np-acts', null,
        padActive.length ? padActive.map((item) => {
          if (!item) return null;
          const { bind, v } = item;
          const isSelected = st.sel === bind;
          const m = mainAct(v.acts);
          const lvlCls = v.lvl === 2 ? 'lv2' : v.lvl === 1 ? 'lv1' : '';
          return h(`button.kbd-np-chip${lvlCls ? '.' + lvlCls : ''}${isSelected ? '.sel' : ''}`, {
            type: 'button',
            onclick: () => handlers.onPick(bind),
            onmouseenter: () => handlers.onHover(bind),
            onmouseleave: () => handlers.onHover(null),
            title: `${pretty(bind)}: ${m.name} (${modName(s, m)})`
          },
            h('span.kbd', null, pretty(bind)),
            h('span.np-chip-name', null, m.name)
          );
        }) : h('div.small.muted.np-empty', null, '✨ На NumPad немає дій для цього шару.')
      )
    )
  );

  // ── Картка 0: Клавіші та швидкі дії ATM11-Companion ──
  const companionItems = [
    {
      kbd: 'Alt+Q',
      layer: 'A',
      bind: 'key.keyboard.q',
      hoverBinds: 'key.keyboard.left.alt,key.keyboard.q',
      title: 'HUD-оверлей поверх гри',
      desc: 'Розгортає вікно компаньйона, ставить гру на паузу та звільняє курсор миші (перекриває Left Alt радіального меню).'
    },
    {
      kbd: 'F2',
      layer: '',
      bind: 'key.keyboard.f2',
      hoverBinds: 'key.keyboard.f2',
      title: 'Скріншот у Vision ШІ',
      desc: 'Зберігає знімок у minecraft/screenshots і підсвічує у HUD кнопку «📸 Розібрати скріншот F2».'
    },
    {
      kbd: 'Ctrl+V',
      layer: 'C',
      bind: 'key.keyboard.v',
      hoverBinds: 'key.keyboard.left.control,key.keyboard.v',
      title: 'Вставка кропу з буфера',
      desc: 'У відкритому чаті HUD вставляє вирізану ділянку екрана (Win+Shift+S) для розбору схеми чи вікна JEI.'
    },
    {
      kbd: '!що · !як · !де · !клавіші',
      layer: '',
      bind: 'key.keyboard.t',
      hoverBinds: 'key.keyboard.t',
      title: 'Швидкі команди в чаті гри (T) або HUD',
      desc: 'Предмет у руці/прицілі (!що), рецепт і застосування (!як), пошук у скринях/рюкзаках з напрямком (!де), вільні клавіші (!клавіші).'
    }
  ];

  const companionCard = h('div.kbd-companion-card', null,
    h('div.kbd-card-h', null,
      h('div.kbd-card-title', null,
        h('span.kbd-card-icon', null, '🤖'),
        h('b', null, 'Клавіші та швидкі дії ATM11-Companion'),
        h('span.kbd-badge.companion', null, 'HUD + Гра')
      ),
      h('span.small.muted', null, 'глобальні комбінації оверлею та команди KubeJS-моста')
    ),
    h('div.kbd-companion-grid', null, companionItems.map((it) => {
      const isSelected = st.sel === it.bind && st.layer === it.layer;
      return h(`div.kbd-companion-item${isSelected ? '.sel' : ''}`, {
        onclick: () => handlers.onPick(it.bind, it.layer),
        onmouseenter: () => handlers.onHover(it.hoverBinds || it.bind),
        onmouseleave: () => handlers.onHover(null),
        title: 'Клік — увімкнути відповідний шар і підсвітити комбінацію на розкладці'
      },
        h('div.kbd-companion-top', null,
          h('span.kbd.kbd-comp-key', null, it.kbd),
          h('span.kbd-comp-title', null, it.title)
        ),
        h('div.kbd-comp-desc.small.muted', null, it.desc)
      );
    }))
  );

  // ── Сітка 3 карток дашборду ──
  const dashboardCards = h('div.kbd-grid', null, conflictCard, topKeysCard, numpadCard);

  // ── Нижня секція: Акордеон безпечних контекстних перетинів ──
  const accordionContent = h(`div.kbd-acc-content${accordionOpen ? '.open' : ''}`, null,
    safeCollisions.length ? h('div.ks-list', null, safeCollisions.map(([c, v]) => {
      const b = c.split('|')[1];
      const isSelected = st.sel === b;
      const acts = v.acts.filter((k) => !k.nc);
      const actsToShow = (acts.length ? acts : v.acts).slice(0, 2);
      const extraCount = v.acts.length - actsToShow.length;
      return h(`button.ks-item.lv1${isSelected ? '.sel' : ''}`, {
        type: 'button',
        onclick: () => handlers.onPick(b),
        onmouseenter: () => handlers.onHover(b),
        onmouseleave: () => handlers.onHover(null),
        title: `${layerPrefix + pretty(b)}: ${v.acts.map((k) => `${k.name} (${modName(s, k)})`).join(' / ')}`
      },
        h('div.ks-item-top', null,
          h('span.kbd', null, layerPrefix + pretty(b)),
          h('span.ks-item-lvl-badge', null,
            h('span.ks-lvl-icon', null, '◐'),
            h('span.ks-lvl-text', null, `${v.acts.length} ${v.acts.length % 10 === 1 && v.acts.length % 100 !== 11 ? 'дія' : v.acts.length % 10 >= 2 && v.acts.length % 10 <= 4 && (v.acts.length % 100 < 12 || v.acts.length % 100 > 14) ? 'дії' : 'дій'}`)
          ),
          extraCount > 0 ? h('span.ks-extra-pill', null, `+${extraCount} ще`) : null
        ),
        h('div.ks-item-acts', null,
          actsToShow.map((k) =>
            h('div.ks-act-line', null,
              h(`i.cdot.${k.ctx}`),
              h('span.ks-act-title', null, k.name),
              h('span.ks-act-mod', null, modName(s, k))
            )
          )
        )
      );
    })) : h('p.muted.small', null, '✨ Немає перетинів дій.')
  );

  const accordionToggleBtn = h('button.kbd-acc-toggle', {
    type: 'button',
    onclick: () => {
      accordionOpen = !accordionOpen;
      accordionContent.classList.toggle('open', accordionOpen);
      chevron.textContent = accordionOpen ? '▲' : '▼';
    }
  },
    h('div.kbd-acc-h-left', null,
      h('span.kbd-acc-icon', null, '◐'),
      h('b', null, `Можливі контекстні перетини (${safeCollisions.length})`),
      h('span.small.muted', null, '— дії активні в різних умовах (з предметом у руці, верхи, у GUI)')
    ),
    h('div.kbd-acc-h-right', null,
      h('span.kbd-acc-badge', null, accordionOpen ? 'Згорнути' : 'Розгорнути'),
      h('span.kbd-acc-chevron', null, accordionOpen ? '▲' : '▼')
    )
  );
  const chevron = /** @type {HTMLElement} */ (accordionToggleBtn.querySelector('.kbd-acc-chevron'));

  const accordionSection = h('div.kbd-acc-wrap', null, accordionToggleBtn, accordionContent);

  return h('div.kb-dashboard-box', null, companionCard, dashboardCards, accordionSection);
}
