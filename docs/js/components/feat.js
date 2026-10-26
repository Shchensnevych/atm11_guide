// @ts-check
// Уніфіковані векторні SVG-піктограми можливостей модів (FEATS: вимір, бос, данж, біоми, руди, істоти)
// та класів модів (CLS_ICONS: техніка, енергія, сховища, логістика, ресурси, ферми, магія, спорядження, дослідження, боси й данжі, декор, зручність, бібліотека, оптимізація).
// Єдиний векторний набір (viewBox="0 0 24 24", stroke-width: 1.9) для карти, довідника, головної, сторінки мода, гілок і бейджів.
// Колір — CSS-змінна --fc (або currentColor у вибраних чипах). Автовизначення можливостей — tools/extract_mods.py (world) → build_data.py (features).
import { h } from '../core/dom.js';

const P = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

const BOSS_SVG = P('<path d="M6.5 7 8 3.5l2.2 2.3L12 3l1.8 2.8L16 3.5 17.5 7z" class="f"/><path d="M5.5 14a6.5 6.5 0 0 1 13 0v2.2l-2 1V21h-9v-3.8l-2-1z"/><circle cx="9.4" cy="13.6" r="1.5" class="f"/><circle cx="14.6" cy="13.6" r="1.5" class="f"/>');
const ORES_SVG = P('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path class="f" d="M8.5 6.5l2 2-2 2-2-2zM15.5 10.5l2 2-2 2-2-2zM9.5 14.5l1.7 1.7-1.7 1.7-1.7-1.7z"/>');

/** @type {Record<string, {title: string, short: string, color: string, svg: string}>} */
export const FEATS = {
  dimension: { title: 'Додає вимір', short: 'виміри', color: '#a78bfa',
    svg: P('<rect x="5.5" y="2.5" width="13" height="19" rx="6.5"/><path d="M12 7.5a3.5 3.5 0 1 1-3.5 3.5M12 11a1.2 1.2 0 1 0 1.2 1.2" />') },
  boss: { title: 'Є боси', short: 'боси', color: '#f87171',
    svg: BOSS_SVG },
  dungeon: { title: 'Структури й данжі з лутом', short: 'данжі', color: '#fbbf24',
    svg: P('<path d="M3.5 21V9h3V5.5h2.5V9h6V5.5h2.5V9h3v12z"/><path d="M10 21v-3.5a2 2 0 0 1 4 0V21"/><path d="M8 12.5h1.5M14.5 12.5H16"/>') },
  biome: { title: 'Нові біоми', short: 'біоми', color: '#4ade80',
    svg: P('<path d="M12 2.8 6.5 10.5h3.2L5.5 16.5h13l-4.2-6h3.2z"/><path d="M12 16.5V21"/>') },
  ores: { title: 'Нові руди', short: 'руди', color: '#d6a874',
    svg: ORES_SVG },
  mobs: { title: 'Нові істоти', short: 'істоти', color: '#f472b6',
    svg: P('<path d="M8 17.2c0-3.1 1.9-5.2 4-5.2s4 2.1 4 5.2c0 2-1.8 2.8-4 2.8s-4-.8-4-2.8z"/><circle cx="6.5" cy="10.5" r="1.7" class="f"/><circle cx="9.8" cy="6.6" r="1.7" class="f"/><circle cx="14.2" cy="6.6" r="1.7" class="f"/><circle cx="17.5" cy="10.5" r="1.7" class="f"/>') },
};
export const FEAT_ORDER = Object.keys(FEATS);

/** Векторні піктограми класів модів (classes.json) у тому ж візуальному стилі, що й FEATS. @type {Record<string, string>} */
export const CLS_ICONS = {
  tech:        P('<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="6.8"/><path d="M12 2.4v2.4M12 19.2v2.4M2.4 12h2.4M19.2 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7"/>'),
  energy:      P('<path d="M13.2 2.5 5.5 13h5.7l-1.4 8.5L18.5 11h-5.7z"/>'),
  storage:     P('<path d="M3.5 8.5h17v10a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M3.5 8.5V6.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v2"/><rect x="10.2" y="7" width="3.6" height="3.8" rx=".8" class="f"/>'),
  logistics:   P('<path d="M3.5 7h6c2.5 0 3.5 10 6 10h4.5M3.5 17h6c1.2 0 2-1.8 2.8-3.8M15.2 8.8c.8-1.3 1.6-1.8 2.8-1.8h2"/><path d="m17.5 4.5 2.5 2.5-2.5 2.5M17.5 14.5 20 17l-2.5 2.5"/>'),
  resources:   P('<path d="m14.2 4.2 5.6 5.6M5.5 18.5 16.2 7.8"/><path d="M11.5 3.8c3.2-.8 6.5.6 8.1 2.2s1.4 4.9-1.6 8.1"/><path class="f" d="m6 6.2 2.1 2.1L6 10.4 3.9 8.3zM16.8 14.8l2 2-2 2-2-2z"/>'),
  farming:     P('<path d="M12 21V8"/><path d="M12 13.5c-4.2 0-6.8-2.6-6.8-6.8 4.2 0 6.8 2.6 6.8 6.8z"/><path d="M12 16.5c4.2 0 6.8-2.6 6.8-6.8-4.2 0-6.8 2.6-6.8 6.8z"/>'),
  magic:       P('<path d="M12 2.5 14.2 9l6.3 2.2-6.3 2.2L12 19.7 9.8 13.4 3.5 11.2 9.8 9z"/><circle cx="18.5" cy="5" r="1.4" class="f"/><circle cx="5.5" cy="18" r="1.2" class="f"/>'),
  gear:        P('<path d="M12 3 4.5 6v5.5c0 5 3.2 8.2 7.5 9.8 4.3-1.6 7.5-4.8 7.5-9.8V6z"/><path d="M12 6.5v11"/>'),
  exploration: P('<circle cx="12" cy="12" r="8.5"/><path d="m15.8 8.2-2.3 5.3-5.3 2.3 2.3-5.3z"/>'),
  combat:      BOSS_SVG,
  decor:       P('<path d="M3.2 11.2 12 3.5l8.8 7.7"/><path d="M5.8 9.8V20h12.4V9.8"/><path d="M10 20v-5.5h4V20"/>'),
  qol:         P('<path d="M9.5 4.5a2 2 0 0 1 4 0V6h3.5a1.5 1.5 0 0 1 1.5 1.5V11h-1.5a2 2 0 0 0 0 4h1.5v3.5a1.5 1.5 0 0 1-1.5 1.5H13.5v-1.5a2 2 0 0 0-4 0V20H6a1.5 1.5 0 0 1-1.5-1.5V15H6a2 2 0 0 0 0-4H4.5V7.5A1.5 1.5 0 0 1 6 6h3.5z"/>'),
  library:     P('<path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h12.5v16H7a2.5 2.5 0 0 0-2.5 2.5z"/><path d="M4.5 19A2.5 2.5 0 0 1 7 16.5h12.5"/><path d="M8.5 7.5h6.5M8.5 11.2h4.5"/>'),
  perf:        P('<path d="M4.5 16.5a8.5 8.5 0 1 1 15 0"/><path d="m12 13 4.2-4.2"/><circle cx="12" cy="13" r="1.6" class="f"/><path d="M7 19h10"/>'),
};

/** Піктограма класу мода у єдиному векторному стилі. @param {string} id @param {string} [color] */
export function clsIcon(id, color) {
  const svg = CLS_ICONS[id]; if (!svg) return null;
  return h('span.feat.cls-ic', { style: color ? { '--fc': color } : null, html: svg });
}

/** Одна піктограма можливості. @param {string} id @param {string} [tip] додатковий текст підказки */
export function featIcon(id, tip) {
  const f = FEATS[id]; if (!f) return null;
  return h('span.feat', { title: tip ? `${f.title}: ${tip}` : f.title, style: { '--fc': f.color }, html: f.svg });
}

/** Можливості набору модів (об'єднання, у сталому порядку) + назви вимірів для підказки. @param {Store} s @param {string[]} mods @param {string[]} [own] */
export function featuresOf(s, mods, own) {
  const set = new Set(own || []); const dims = [];
  for (const id of mods || []) {
    const m = s.modById.get(id); if (!m) continue;
    for (const f of m.features || []) set.add(f);
    for (const d of m.dims || []) dims.push(d.name);
  }
  return { list: FEAT_ORDER.filter((f) => set.has(f)), dims };
}

/** Рядок піктограм. @param {string[]} list @param {string[]} [dims] @param {boolean} [labels] з підписами (довідник, сторінка мода) */
export function featRow(list, dims = [], labels = false) {
  if (!list.length) return null;
  return h('span.feats' + (labels ? '.labeled' : ''), null, list.map((f) => {
    const el = featIcon(f, f === 'dimension' && dims.length ? dims.join(', ') : '');
    if (el && labels) el.append(h('span.feat-l', null, FEATS[f].short));
    return el;
  }));
}

/** Легенда піктограм (карта, довідник): іконка + коротка назва; з onPick — пункти-перемикачі (фільтр). @param {(id: string, on: boolean) => void} [onPick] @param {Set<string>} [selected] */
export function featLegend(onPick, selected) {
  return h('span.feat-legend', null, FEAT_ORDER.map((id) => {
    const on = selected?.has(id);
    const it = h(`span.fl-item${onPick ? '.pick' : ''}${on ? '.on' : ''}`, { 'data-feat': id, title: onPick ? `${FEATS[id].title} — клік: підсвітити такі віхи` : FEATS[id].title,
      onclick: onPick ? () => { it.classList.toggle('on'); onPick(id, it.classList.contains('on')); } : null }, featIcon(id), FEATS[id].short);
    return it;
  }));
}
