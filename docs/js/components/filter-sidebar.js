// @ts-check
// Спільні елементи бічної панелі фільтрів (використовуються у #/mods, #/roadmap та #/keys).
import { h } from '../core/dom.js';
import { FEATS, FEAT_ORDER, featIcon, clsIcon } from './feat.js';

export const searchIconSvg = () => h('span.sidebar-search-icon', {
  html: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
});

export const selectArrowSvg = () => h('span.sidebar-select-arrow', {
  html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>',
});

export const chevronDownSvg = () => '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

export const checkSvg = () => '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

/**
 * Розкладний список категорій зі лічильниками й прапорцями («Ще N категорій» / «Згорнути»).
 * @param {{
 *   items: { cls: ClassDef, count: number }[],
 *   selected: Set<string>,
 *   onToggle: (id: string) => void,
 *   titleFor?: (cls: ClassDef, count: number) => string,
 *   visibleLimit?: number,
 * }} opts
 */
export function buildCategoryFilterList(opts) {
  const { items, selected, onToggle, titleFor, visibleLimit = 8 } = opts;
  /** @type {Map<string, { el: HTMLElement, index: number }>} */
  const rows = new Map();
  let expanded = selected.size > 0 && items.slice(visibleLimit).some((x) => selected.has(x.cls.id));

  const restCount = items.length - visibleLimit;
  const moreBtnText = h('span', null, expanded ? 'Згорнути' : `Ще ${restCount} категорій`);
  const moreBtnIcon = h('span.sidebar-more-icon', { html: chevronDownSvg() });
  /** @type {HTMLElement | null} */
  let moreBtn = null;

  const updateVisibility = () => {
    for (const [_, { el, index }] of rows) {
      if (index >= visibleLimit) {
        el.style.display = expanded ? 'flex' : 'none';
      }
    }
    if (moreBtn) {
      moreBtnText.textContent = expanded ? 'Згорнути' : `Ще ${restCount} категорій`;
      moreBtn.classList.toggle('expanded', expanded);
    }
  };

  if (restCount > 0) {
    moreBtn = h('button.sidebar-more-btn', {
      type: 'button',
      className: `sidebar-more-btn${expanded ? ' expanded' : ''}`,
      onclick: () => {
        expanded = !expanded;
        updateVisibility();
      },
    }, moreBtnText, moreBtnIcon);
  }

  const wrap = h('div.sidebar-cat-list');
  items.forEach(({ cls, count }, index) => {
    const row = h('div.sidebar-cat-row', {
      'data-cls': cls.id,
      style: {
        '--c': cls.color,
        display: (index < visibleLimit || expanded) ? 'flex' : 'none',
      },
      title: titleFor ? titleFor(cls, count) : (cls.desc || cls.title),
      onclick: () => onToggle(cls.id),
    },
      h('div.sidebar-cat-left', null,
        clsIcon(cls.id, cls.color),
        h('span.sidebar-cat-name', null, cls.title),
        h('span.sidebar-cat-count', null, `(${count})`),
      ),
      h('span.sidebar-check-box', { html: checkSvg() }),
    );
    if (selected.has(cls.id)) row.classList.add('on');
    rows.set(cls.id, { el: row, index });
    wrap.append(row);
  });
  if (moreBtn) wrap.append(moreBtn);

  /** @param {Set<string>} curSelected */
  const sync = (curSelected) => {
    for (const [id, { el }] of rows) {
      el.classList.toggle('on', curSelected.has(id));
    }
  };

  return { el: wrap, sync };
}

/**
 * Двоколонкова сітка фільтрів особливостей світу (виміри, боси, данжі, руди…).
 * @param {{
 *   countOf: (featId: string) => number,
 *   selected: Set<string>,
 *   onToggle: (featId: string) => void,
 *   titleFor?: (featId: string, feat: { title: string, short: string, color: string }, count: number) => string,
 * }} opts
 */
export function buildFeatureFilterGrid(opts) {
  const { countOf, selected, onToggle, titleFor } = opts;
  /** @type {Map<string, HTMLElement>} */
  const btns = new Map();
  const wrap = h('div.sidebar-feat-grid');

  FEAT_ORDER.forEach((f) => {
    const feat = FEATS[f];
    const count = countOf(f);
    const btn = h('button.sidebar-feat-btn', {
      type: 'button',
      'data-feat': f,
      style: { '--c': feat.color },
      title: titleFor ? titleFor(f, feat, count) : feat.title,
      onclick: () => onToggle(f),
    },
      h('span.sidebar-feat-label', null,
        featIcon(f),
        h('span', null, feat.short),
      ),
      h('span.sidebar-feat-cnt', null, String(count)),
    );
    if (selected.has(f)) btn.classList.add('on');
    btns.set(f, btn);
    wrap.append(btn);
  });

  /** @param {Set<string>} curSelected */
  const sync = (curSelected) => {
    for (const [id, btn] of btns) {
      btn.classList.toggle('on', curSelected.has(id));
    }
  };

  return { el: wrap, sync };
}

/**
 * Рядок-перемикач у бічній панелі.
 * @param {string} label
 * @param {HTMLInputElement} input
 */
export function sidebarSwitchRow(label, input) {
  return h('label.sidebar-switch-row', null,
    h('span', null, label),
    h('span.switch-control', null, input, h('span.switch-slider')),
  );
}

/**
 * Пігулка активного фільтра з кнопкою скидання «✕».
 * @param {'mods' | 'rm'} prefix
 * @param {any[]} children
 * @param {string} clearTitle
 * @param {() => void} onClear
 */
export function activeChip(prefix, children, clearTitle, onClear) {
  return h(`span.${prefix}-active-chip`, null,
    ...children,
    h(`span.${prefix}-active-chip-x`, {
      title: clearTitle,
      onclick: onClear,
    }, '✕'),
  );
}

