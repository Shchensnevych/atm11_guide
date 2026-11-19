// @ts-check
// views/assistant/slots-model.js — модель ігрових слотів ATM11, індекс гарячих клавіш і вкладених контейнерів.
import { comboText, level, layerOf, UNBOUND, MOD_TITLE } from '../../core/keys-model.js';

/** Типовий набір слотів Curios у ATM11 (якщо живий міст передає лише зайняті слоти без curiosTypes). */
export const DEFAULT_CURIOS_TYPES = [
  { id: 'back', uk: 'Спина', size: 1, core: true },
  { id: 'head', uk: 'Голова', size: 1, core: true },
  { id: 'necklace', uk: 'Намисто', size: 1, core: true },
  { id: 'body', uk: 'Тіло', size: 1, core: true },
  { id: 'hands', uk: 'Руки', size: 2, core: true },
  { id: 'bracelet', uk: 'Браслет', size: 1, core: true },
  { id: 'ring', uk: 'Перстень', size: 2, core: true },
  { id: 'belt', uk: 'Пояс', size: 1, core: true },
  { id: 'charm', uk: 'Амулет', size: 2, core: true },
  { id: 'feet', uk: 'Ступні', size: 1, core: true },
  { id: 'heart_amulet', uk: 'Амулет сердець', size: 1, core: true },
  { id: 'crafting_on_a_stick', uk: 'Верстак на паличці', size: 1, core: false },
  { id: 'refinedstorage_curios_integration', uk: 'Refined Storage', size: 2, core: false },
  { id: 'adv_pattern_encoder', uk: 'Кодувальник АЕ2', size: 1, core: false },
  { id: 'deep_learner', uk: 'Глибинний учень', size: 1, core: false },
  { id: 'poppet', uk: 'Лялька', size: 1, core: false },
];

export const CORE_CURIO_IDS = new Set(DEFAULT_CURIOS_TYPES.filter((x) => x.core).map((x) => x.id));

/** @type {Record<string, string>} */
export const CURIO_GLYPH = {
  back: '🎒', head: '👑', necklace: '📿', body: '🥋', hands: '🧤', bracelet: '⌚',
  ring: '💍', belt: '🎗', charm: '🔮', feet: '🥾', heart_amulet: '❤️',
  crafting_on_a_stick: '🪚', refinedstorage_curios_integration: '📡',
  adv_pattern_encoder: '📐', deep_learner: '👾', poppet: '🪆',
};

export const KEY_STATE_LABEL = /** @type {Record<string, string>} */ ({
  ok: 'вільна', warn: 'можливий перетин', bad: 'конфлікт', kuma: 'Balm/Kuma!', none: 'не призначено',
});

/** Форматує велику кількість предметів у кутку слота (64, 1.2k). @param {number} n */
export function fmtCount(n) {
  if (n >= 10000) return `${Math.round(n / 1000)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** Будує індекс клавіш і конфліктів за модами з keys.json (+ options.txt) або живого радара моста.
 * @param {Store} s @param {KeyAct[]} keysList @param {any[]} liveRadar */
export function buildKeyLookup(s, keysList, liveRadar) {
  /** @type {Map<string, KeyAct[]>} */
  const byCombo = new Map();
  for (const k of keysList) {
    if (!k.bind || k.bind === UNBOUND) continue;
    const sig = `${layerOf(k)}|${k.bind}`;
    let arr = byCombo.get(sig);
    if (!arr) { arr = []; byCombo.set(sig, arr); }
    arr.push(k);
  }

  /** @type {Map<string, Array<{ id: string, name: string, combo: string, state: string, note: string, warning: string }>>} */
  const byMod = new Map();
  let conflicts = 0; let maybe = 0; let unboundImp = 0;
  const rank = /** @type {Record<string, number>} */ ({ held: 0, game: 1, vehicle: 2, gui: 3, debug: 4 });

  for (const k of keysList) {
    const isBound = Boolean(k.bind && k.bind !== UNBOUND);
    const isKuma = Boolean(/** @type {any} */ (k).kuma && k.m && isBound);
    let state = isBound ? 'ok' : 'none';
    let warning = '';
    if (!isBound && k.imp) unboundImp++;
    if (isKuma) {
      state = 'kuma';
      conflicts++;
      warning = `КРИТИЧНО (Balm / Kuma API): модифікатор ${MOD_TITLE[k.m] || k.m} для мода ${k.ns} викликає краш при запуску. Ставте клавішу без Ctrl/Shift/Alt.`;
    } else if (isBound) {
      const peers = byCombo.get(`${layerOf(k)}|${k.bind}`) || [];
      for (const other of peers) {
        if (other === k) continue;
        const lv = level(k, other);
        if (lv === 2) {
          state = 'bad';
          warning = `Конфлікт на [${comboText(k)}] з дією «${other.name}» (${other.ns})`;
          break;
        }
        if (lv === 1 && state === 'ok') {
          state = 'warn';
          warning = `Можливий перетин на [${comboText(k)}] з «${other.name}» (${other.ns})`;
        }
      }
      if (state === 'bad') conflicts++;
      else if (state === 'warn') maybe++;
    } else if (k.imp) {
      warning = `Важлива клавіша «${k.name}» не призначена в options.txt${k.plan ? ` (рекомендовано: ${k.plan})` : ''}`;
    }

    const entry = {
      id: k.id,
      name: k.name || k.en || k.id,
      combo: isBound ? comboText(k) : 'Не призначено',
      state,
      note: k.note || '',
      warning,
      _rank: rank[k.ctx] ?? 5,
      _imp: k.imp ? 1 : 0,
    };
    for (const mId of new Set([k.ns, k.mod].filter(Boolean))) {
      if (!mId) continue;
      let list = byMod.get(mId);
      if (!list) { list = []; byMod.set(mId, list); }
      list.push(entry);
    }
  }

  for (const [mId, list] of byMod.entries()) {
    list.sort((a, b) => /** @type {any} */ (a)._rank - /** @type {any} */ (b)._rank || /** @type {any} */ (b)._imp - /** @type {any} */ (a)._imp);
    byMod.set(mId, list.slice(0, 5));
  }

  /** @type {Map<string, any>} */
  const radarByItem = new Map();
  for (const r of liveRadar || []) {
    if (r?.itemId) radarByItem.set(`${r.itemId}|${r.where || ''}`, r);
    if (r?.itemId && !radarByItem.has(r.itemId)) radarByItem.set(r.itemId, r);
  }

  /** @param {any} item */
  function forItem(item) {
    if (!item) return { keys: [], warnings: [], worst: '', howToUse: '' };
    const hit = radarByItem.get(`${item.id}|${item.slotLabel || ''}`) || radarByItem.get(item.id);
    if (hit && Array.isArray(hit.keys) && hit.keys.length) {
      const mapped = hit.keys.map((/** @type {any} */ k) => ({
        id: k.id || k.name,
        name: k.name || k.id,
        combo: k.isBound === false ? 'Не призначено' : (k.combo || 'Не призначено'),
        state: k.status === 'kuma_warn' ? 'kuma' : !k.isBound ? 'none' : k.status === 'conflict' ? 'bad' : k.status === 'maybe' ? 'warn' : 'ok',
        note: k.note || '',
        warning: k.warning || '',
      }));
      const warns = (hit.warnings || []).map((/** @type {string} */ w) => w.replace(/^\s*⚠\s*/, ''));
      const worst = mapped.some((/** @type {any} */ x) => x.state === 'bad' || x.state === 'kuma') ? 'bad'
        : mapped.some((/** @type {any} */ x) => x.state === 'warn' || x.state === 'none') ? 'warn' : 'ok';
      return { keys: mapped, warnings: warns, worst, howToUse: hit.howToUse || '' };
    }
    const ns = item.ns || String(item.id || '').split(':')[0] || 'minecraft';
    if (ns === 'minecraft') return { keys: [], warnings: [], worst: '', howToUse: '' };
    const modKeys = byMod.get(ns) || [];
    const warns = modKeys.map((k) => k.warning).filter(Boolean);
    const worst = !modKeys.length ? ''
      : modKeys.some((x) => x.state === 'bad' || x.state === 'kuma') ? 'bad'
      : modKeys.some((x) => x.state === 'warn' || x.state === 'none') ? 'warn' : 'ok';
    const modMeta = s.modById.get(ns);
    return { keys: modKeys, warnings: warns, worst, howToUse: modMeta?.uk || '' };
  }

  const globals = keysList.filter((k) => k.imp && k.ctx === 'game').slice(0, 8).map((k) => {
    const isBound = Boolean(k.bind && k.bind !== UNBOUND);
    const modId = k.mod || k.ns;
    const info = forItem({ id: modId, ns: modId, slotLabel: 'Глобальна дія' });
    const ownKey = (byMod.get(modId) || []).find((x) => x.id === k.id) || {
      id: k.id, name: k.name, combo: isBound ? comboText(k) : 'Не призначено', state: isBound ? 'ok' : 'none', note: k.note || '', warning: '',
    };
    return {
      selKey: `global:${k.id}`,
      id: modId,
      uk: k.name,
      count: 1,
      slotLabel: 'Глобальна дія у світі',
      slotKind: 'global',
      ns: modId,
      modName: s.modById.get(modId)?.name || modId,
      keys: [ownKey],
      warnings: ownKey.warning ? [ownKey.warning] : info.warnings.slice(0, 1),
      worst: ownKey.state === 'bad' || ownKey.state === 'kuma' ? 'bad' : ownKey.state === 'warn' || ownKey.state === 'none' ? 'warn' : 'ok',
      howToUse: k.note || s.modById.get(modId)?.uk || '',
    };
  });

  const findCombo = (/** @type {RegExp} */ re) => {
    const kb = keysList.find((k) => re.test(k.id));
    if (!kb) return '';
    return kb.bind && kb.bind !== UNBOUND ? comboText(kb) : 'Не призначено';
  };

  return {
    forItem,
    globals,
    stats: { conflicts: Math.round(conflicts / 2), maybe: Math.round(maybe / 2), unboundImp },
    curiosOpenCombo: findCombo(/curios\.open/),
    offhandSwapCombo: findCombo(/swapOffhand/i) || 'F',
  };
}

/** Нормалізує джерело слотів (живий міст → прогрес сейву → резервний список інвентарю).
 * @param {Store} s @param {any} an @param {any} liveState @returns {PlayerSlotsData} */
export function resolveActiveSlots(s, an, liveState) {
  if (liveState?.world?.slots) {
    const ls = liveState.world.slots;
    const fallbackTypes = s.progress?.slots?.curiosTypes || [];
    return normalizeModSlots({
      ...ls,
      curiosTypes: ls.curiosTypes?.length ? ls.curiosTypes : fallbackTypes,
    });
  }
  if (s.progress?.slots) return normalizeModSlots(s.progress.slots);
  const hotbar = [];
  const inventory = [];
  an.invEntries.slice(0, 36).forEach((/** @type {any} */ e, /** @type {number} */ idx) => {
    const entry = {
      id: e.id, uk: e.name, count: e.count, slot: idx,
      slotLabel: idx < 9 ? `Гаряча панель (слот ${idx + 1})` : `Інвентар (слот ${idx})`,
      slotKind: idx < 9 ? 'hotbar' : 'inventory',
      ns: e.id.split(':')[0] || 'minecraft',
      modName: s.modById.get(e.id.split(':')[0])?.name || e.id.split(':')[0],
    };
    if (idx < 9) hotbar.push(entry); else inventory.push(entry);
  });
  return {
    mainHand: hotbar[0] || null, offHand: null, hotbar, inventory,
    armor: [], curios: [], curiosTypes: [], toolbelt: [], toolbeltTools: [], backpacks: [], enderChest: [],
  };
}

/** K23: додаткові слоти модів — одне місце для всіх (міст K16: `modSlots`, вміст — серед вкладених контейнерів). Старі джерела
 * (знімок сейву путівника, старий міст) дають пояс окремими полями `toolbelt` / `toolbeltTools` — зводимо до тієї самої форми:
 * сам предмет — додатковий слот, його вміст — вкладений контейнер з назвою предмета. Окремого коду під моди у вигляді немає.
 * @param {PlayerSlotsData} sl @returns {PlayerSlotsData} */
export function normalizeModSlots(sl) {
  if (!sl || sl.modSlots?.length || !(sl.toolbelt || []).length) return sl;
  const carriers = sl.toolbelt.map((t, i) => ({ ...t, slotKind: 'mod_slot', slotKey: t.slotKey || `${t.id}#${i}` }));
  const head = carriers[0];
  const title = head.customName || head.uk;
  const where = head.slotLabel || '';
  const inside = (sl.toolbeltTools || []).map((t, i) => ({ ...t, bpTitle: title, bpKey: `legacy|${head.slotKey}`, bpKind: 'carried', bpWhere: where, bpSlot: t.beltSlot ?? i }));
  return { ...sl, modSlots: carriers, toolbelt: [], toolbeltTools: [], backpacks: [...(sl.backpacks || []), ...inside] };
}

/** Групує вкладені контейнери (рюкзаки, шалкери, мішечки, DeepNull, Ендер-скриню) та знаходить іконку носія.
 * @param {PlayerSlotsData} slots */
export function collectNestedContainers(slots) {
  const carriers = [...(slots.hotbar || []), ...(slots.inventory || []), ...(slots.curios || []), ...(slots.modSlots || [])];
  const defaultIdByKind = /** @type {Record<string, string>} */ ({
    bundle: 'minecraft:bundle',
    shulker: 'minecraft:shulker_box',
    backpack: 'sophisticatedbackpacks:backpack',
    ender: 'minecraft:ender_chest',
  });
  /** @type {Map<string, { key: string, title: string, where: string, kind: string, itemId: string, cap: number, items: SlotItemEntry[] }>} */
  const map = new Map();
  for (const b of slots.backpacks || []) {
    const key = b.bpKey || b.bpTitle || 'backpack';
    let g = map.get(key);
    if (!g) {
      const kind = b.bpKind || 'backpack';
      const where = b.bpWhere || '';
      const title = b.bpTitle || 'Контейнер';
      // K23: вкладене (ланцюжок «A → B», міст K17) — іконка самого B з уміщу A, а не носія верхнього рівня
      const cut = key.lastIndexOf(' → ');
      const holder = cut > 0 ? (slots.backpacks || []).find((x) => x.bpKey === key.slice(0, cut) && x.uk === key.slice(cut + 3)) : null;
      const carrier = holder || carriers.find((c) => (where && c.slotLabel === where) || (c.customName || c.uk) === title);
      const itemId = carrier?.id || defaultIdByKind[kind] || 'sophisticatedbackpacks:backpack';
      g = { key, title, where, kind, itemId, cap: b.bpCapacity || 0, items: [] };   // K24: місткість — з гри; 0 — невідома (без вигаданих 27)
      map.set(key, g);
    }
    g.items.push(b);
  }
  if ((slots.enderChest || []).length) {
    map.set('ender_chest', {
      key: 'ender_chest',
      title: 'Ендер-скриня',
      where: 'Особисте сховище гравця',
      kind: 'ender',
      itemId: 'minecraft:ender_chest',
      cap: 27,
      items: slots.enderChest,
    });
  }
  return { map, list: [...map.values()] };
}

/** K24 (§4 п. 33): скільки рядків показати після прокрутки не потрібно. */
export const CONT_SCROLL_ROWS = 4;
/**
 * K24 (§4 п. 33): сітка предмета-контейнера. Місткість (cap) — з гри: скільки місць має саме цей екземпляр (серверний знімок;
 * покращений пояс — більше); клітинки поза нею — недоступні (зафарбовані, не прибрані), рядки по 9, як у вікні гри. Невідома
 * (0: старий знімок, сейв без знімка) — лише рядки до останнього зайнятого місця, без фарбування. Більше CONT_SCROLL_ROWS
 * рядків — прокрутка. Без правил під моди чи типи предметів.
 * @param {number} cap @param {number} maxSlot найбільший номер зайнятого місця (-1 — немає)
 * @returns {{ known: boolean, total: number, open: number, scroll: boolean }}
 */
export function containerLayout(cap, maxSlot) {
  const known = Number(cap) > 0;
  const need = Math.max(0, (Number(maxSlot) || 0) + 1);
  const total = Math.max(9, Math.ceil(Math.max(known ? Number(cap) : 0, need) / 9) * 9);
  return { known, total, open: known ? Math.max(Number(cap), need) : total, scroll: total / 9 > CONT_SCROLL_ROWS };
}
