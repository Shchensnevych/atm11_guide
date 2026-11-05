// @ts-check
// Нагороди квестів FTB: підписи й шанси таблиць нагород (reward_tables.json).
// Спільний модуль сайту (вкладка «Квести») і моста ATM11-Companion (інструмент get_quest, import() — C5g): без DOM і без імпортів.

/** Коротка назва з id, коли перекладу немає. @param {string} id */
export const nice = (id) => String(id || '').replace(/^#/, '').split(':').pop()?.split('/').pop()?.replace(/_/g, ' ') || '';

/** Підпис нагороди квесту (rw). @param {any} r @returns {{ icon?: string, glyph?: string, text: string }} */
export function rewardLabel(r) {
  switch (r.t) {
    case 'item': return { icon: r.item, text: `${r.name || nice(r.item)}${r.n > 1 ? ` × ${r.n}` : ''}` };
    case 'xp': return { glyph: '✨', text: `${r.n} досвіду` };
    case 'xp_levels': return { glyph: '✨', text: `${r.n} рів. досвіду` };
    case 'random': return { glyph: '🎲', text: `Випадковий предмет${r.table ? ` («${r.table}»)` : ''}` };
    case 'loot': return { glyph: '🎁', text: `Лут-набір${r.table ? ` «${r.table}»` : ''}` };
    case 'choice': return { glyph: '🔀', text: `На вибір${r.table ? ` з «${r.table}»` : ''}` };
    default: return { glyph: '•', text: r.t };
  }
}

/**
 * Що може випасти з таблиці нагород: шанс — вага предмета / сума ваг (так рахує FTB Quests); для «на вибір» шансу немає.
 * @param {any} r нагорода квесту з tid @param {any} t запис reward_tables.json
 * @returns {{ head: string, items: { item?: string, label: string, chance: number | null, miss: boolean, xp: boolean }[] }}
 */
export function tableView(r, t) {
  const items = (t && t.items) || [];
  const sum = items.reduce((/** @type {number} */ a, /** @type {any} */ x) => a + (x.w ?? 1), 0) || 1;
  const head = `${r.t === 'choice' ? 'На вибір один із' : r.t === 'loot' ? 'Лут-набір: може випасти' : `Випадково ${t.n > 1 ? t.n + ' з' : 'одне з'}`} ${items.length}${t.title ? ` («${t.title}»)` : ''}`;
  return {
    head,
    items: items.map((/** @type {any} */ x) => ({
      item: x.item || undefined,
      label: x.t ? `${x.n} ${x.t === 'xp' ? 'досвіду' : 'рів. досвіду'}` : `${x.name || x.item}${x.n > 1 ? ` × ${x.n}` : ''}`,
      chance: r.t !== 'choice' ? Math.round(((x.w ?? 1) / sum) * 1000) / 10 : null,
      miss: Boolean(x.miss),
      xp: Boolean(x.t),
    })),
  };
}
