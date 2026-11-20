// @ts-check
// Нагороди квестів FTB: підписи й шанси таблиць нагород (reward_tables.json).
// Спільний модуль сайту (вкладка «Квести») і моста ATM11-Companion (інструмент get_quest, import() — C5g): без DOM і без імпортів.

/** Коротка назва з id, коли перекладу немає. @param {string} id */
export const nice = (id) => String(id || '').replace(/^#/, '').split(':').pop()?.split('/').pop()?.replace(/_/g, ' ') || '';

/** K25: властивості стоса предмета (рядки підказки гри, яких немає в типовому екземплярі) — одним рядком; немає — ''.
 * Рядок, що закінчується двокрапкою («При застосуванні:»), — заголовок наступного, а рядок-пункт («• Луки») має свій маркер:
 * тоді між рядками пробіл, а не « · ». @param {any} x */
export function propsText(x) {
  const L = Array.isArray(x?.props) ? x.props.filter((/** @type {any} */ t) => typeof t === 'string' && t) : [];
  return L.reduce((/** @type {string} */ a, /** @type {string} */ t, /** @type {number} */ i) => (i === 0 ? t : a + (/:$/.test(L[i - 1]) || /^[•◦▪·-]\s/.test(t) ? ' ' : ' · ') + t), '');
}

/** Підпис нагороди квесту (rw); props — властивості стоса окремо (сайт — рядком під назвою, міст — у дужках). @param {any} r @returns {{ icon?: string, glyph?: string, text: string, props?: string }} */
export function rewardLabel(r) {
  switch (r.t) {
    case 'item': return { icon: r.item, text: `${r.name || nice(r.item)}${r.comp ? ` (${r.comp})` : ''}${r.n > 1 ? ` × ${r.n}` : ''}`, props: propsText(r) || undefined };
    case 'xp': return { glyph: '✨', text: `${r.n} досвіду` };
    case 'xp_levels': return { glyph: '✨', text: `${r.n} рів. досвіду` };
    case 'random': return { glyph: '🎲', text: `Випадковий предмет${r.table ? ` («${r.table}»)` : ''}` };
    case 'loot': return { glyph: '🎁', text: `Лут-набір${r.table ? ` «${r.table}»` : ''}` };
    case 'choice': return { glyph: '🔀', text: `На вибір${r.table ? ` з «${r.table}»` : ''}` };
    case 'command': return { icon: r.icon || undefined, glyph: '⚙', text: `Команда: ${r.cmd}` };   // як у книзі квестів
    default: return { glyph: '•', text: r.t };
  }
}

/**
 * Що може випасти з таблиці нагород: шанс — вага предмета / сума ваг (так рахує FTB Quests); для «на вибір» шансу немає.
 * @param {any} r нагорода квесту з tid @param {any} t запис reward_tables.json
 * @returns {{ head: string, items: { item?: string, label: string, props?: string, chance: number | null, miss: boolean, xp: boolean }[] }}
 */
export function tableView(r, t) {
  const items = (t && t.items) || [];
  const sum = items.reduce((/** @type {number} */ a, /** @type {any} */ x) => a + (x.w ?? 1), 0) || 1;
  const head = `${r.t === 'choice' ? 'На вибір один із' : r.t === 'loot' ? 'Лут-набір: може випасти' : `Випадково ${t.n > 1 ? t.n + ' з' : 'одне з'}`} ${items.length}${t.title ? ` («${t.title}»)` : ''}`;
  return {
    head,
    items: items.map((/** @type {any} */ x) => ({
      item: x.item || undefined,
      label: x.t ? `${x.n} ${x.t === 'xp' ? 'досвіду' : 'рів. досвіду'}` : `${x.name || x.item}${x.comp ? ` (${x.comp})` : ''}${x.n > 1 ? ` × ${x.n}` : ''}`,
      props: x.t ? undefined : propsText(x) || undefined,
      chance: r.t !== 'choice' ? Math.round(((x.w ?? 1) / sum) * 1000) / 10 : null,
      miss: Boolean(x.miss),
      xp: Boolean(x.t),
    })),
  };
}
