// @ts-check
// core/nbt-slots.js — розбір структурованих слотів гравця (гаряча панель, інвентар 3×9, броня, друга рука, Curios,
// додаткові слоти модів, рюкзаки Sophisticated Backpacks, уміст предметів углиб за формою даних (K23), Ендер-скриня) прямо в браузері (дзеркало extract_structured_slots).
import { readNbt } from './nbt.js';
import { itemNameUk } from './store.js';

const BACKPACK_STORAGE_FILES = [
  'dimensions/minecraft/overworld/data/sophisticatedbackpacks/backpack_storage.dat',
  'data/sophisticatedbackpacks/backpack_storage.dat',
  'data/sophisticatedbackpacks.dat',
  'data/sophisticatedcore/sophisticatedbackpacks.dat',
];

/** @type {Record<string, string>} */
export const CURIOS_SLOT_UK = {
  back: 'Спина',
  belt: 'Пояс',
  body: 'Тіло',
  bracelet: 'Браслет',
  charm: 'Амулет',
  curio: 'Аксесуар',
  hands: 'Руки',
  head: 'Голова',
  necklace: 'Намисто',
  ring: 'Перстень',
  feet: 'Ступні',
  heart_amulet: 'Амулет сердець',
  crafting_on_a_stick: 'Створення на паличці',
  adv_pattern_encoder: 'Кодувальник шаблонів',
  deep_learner: 'Глибинний учень',
  refinedstorage_curios_integration: 'Refined Storage',
  poppet: 'Лялька',
  sentient_armour_socket: 'Гніздо живої броні',
};

/** @param {any} v */
function uuidKey(v) {
  if (v == null) return '';
  if (Array.isArray(v) && v.length === 4 && v.every((n) => Number.isInteger(Number(n)))) {
    const hex = v.map((n) => (Number(n) >>> 0).toString(16).padStart(8, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return String(v).trim().toLowerCase();
}

/** @param {any} stack */
function customNameOf(stack) {
  const v = stack?.components?.['minecraft:custom_name'];
  /** @param {any} x @param {number} depth @returns {string} */
  const textOf = (x, depth = 0) => {
    if (x == null || depth > 4) return '';
    if (typeof x === 'string') {
      const t = x.trim();
      if (/^[{["]/.test(t)) { try { return textOf(JSON.parse(t), depth + 1); } catch { /* plain */ } }
      return t;
    }
    if (Array.isArray(x)) return x.map((e) => textOf(e, depth + 1)).join('');
    if (typeof x === 'object') return `${typeof x.text === 'string' ? x.text : ''}${Array.isArray(x.extra) ? x.extra.map((/** @type {any} */ e) => textOf(e, depth + 1)).join('') : ''}`;
    return '';
  };
  return textOf(v).replace(/§[0-9a-fk-or]/gi, '').trim().slice(0, 80);
}

/** @param {Store} store @param {string} id @param {any} comp */
function resolveStackUk(store, id, comp) {
  if (comp && typeof comp === 'object') {
    const book = comp['patchouli:book'] || comp['modonomicon:book_id'] || comp['guideme:guide_id'];
    if (typeof book === 'string' && book) {
      const hit = store.names?.books?.[book];
      if (Array.isArray(hit) && hit[0]) return hit[0].replace(/§[0-9a-fk-or]/gi, '').trim();
      const bns = book.split(':')[0];
      return `Посібник ${store.modById.get(bns)?.name || bns} (${book})`;
    }
  }
  return itemNameUk(store, id);
}

/**
 * @param {Record<string, any>} pnbt
 * @param {import('./game-fs.js').VDir} wdir
 * @param {Store} store
 * @param {Record<string, number>} invCounts
 * @returns {Promise<PlayerSlotsData>}
 */
// K23 (з гри 11-19; те саме правило, що в мосту — ATM11-Companion services/watcher/saves.js): що лежить усередині предмета —
// за формою даних, будь-який компонент, углиб до NEST_MAX_DEPTH рівнів. Перелік-уміст: обгортки зі слотом { slot / Slot,
// item / Stack } — будь-де (кількість — з обгортки, якщо вона там є); голі предмети — лише в полі-вмісті (container / contents /
// inventory / items / stacks); фільтри й службові копії — ні. Додаткові слоти модів — з будь-якого вкладення гравця (міст K16).
const SKIP_NESTED_KEY = /filter|ghost|preview|display|template|cache|backup|cosmetic|^(last|old|prev|render|sync)/i;
const CONTENTS_KEY = /container|contents|inventory|items|stacks/i;
const NEST_MAX_DEPTH = 4;
const NEST_BUDGET = 400;
/** @param {any} o @param {{ allowNoCount?: boolean }} [opt] */
function isNbtItemStack(o, { allowNoCount = false } = {}) {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return false;
  if (typeof o.id !== 'string' || !o.id.includes(':') || o.id === 'minecraft:air') return false;
  const c = o.count ?? o.Count;
  return c === undefined ? Boolean(allowNoCount) : Number(c) >= 1;
}
/** Що лежить усередині предмета: [{ stack, slot, count, comp }]. @param {any} stack */
export function nestedStacks(stack) {
  const comp = stack && typeof stack === 'object' ? stack.components : null;
  /** @type {{ stack: any, slot: number, count: number, comp: string }[]} */
  const out = [];
  if (!comp || typeof comp !== 'object') return out;
  /** @param {any} v @param {string} compKey @param {string} key @param {number} d */
  const visit = (v, compKey, key, d) => {
    if (!v || typeof v !== 'object' || d > 4) return;
    if (Array.isArray(v)) {
      let found = 0;
      v.forEach((/** @type {any} */ e, /** @type {number} */ idx) => {
        if (!e || typeof e !== 'object' || Array.isArray(e)) return;
        const wrapped = e.slot !== undefined || e.Slot !== undefined;
        for (const fld of ['item', 'Item', 'stack', 'Stack']) {
          const st = e[fld];
          if (isNbtItemStack(st, { allowNoCount: wrapped })) {
            out.push({ stack: st, slot: Number(e.slot ?? e.Slot ?? idx), count: Number(e.count ?? e.Count ?? st.count ?? st.Count ?? 1), comp: compKey });
            found++;
            return;
          }
        }
        if (CONTENTS_KEY.test(key) && isNbtItemStack(e)) { out.push({ stack: e, slot: idx, count: Number(e.count ?? e.Count), comp: compKey }); found++; }
      });
      if (!found) v.forEach((/** @type {any} */ e) => visit(e, compKey, key, d + 1));
      return;
    }
    if (isNbtItemStack(v)) return;
    for (const [k, x] of Object.entries(v)) if (!SKIP_NESTED_KEY.test(k)) visit(x, compKey, k, d + 1);
  };
  for (const [k, v] of Object.entries(comp)) if (!SKIP_NESTED_KEY.test(k)) visit(v, k, k, 0);
  return out;
}
/** Предмети у вкладенні гравця (міст K16 extractAttachmentStacks): [{ stack, slotKey }]. @param {any} val @param {string} baseKey */
function attachmentStacks(val, baseKey) {
  /** @type {{ stack: any, slotKey: string }[]} */
  const out = [];
  if (!val || typeof val !== 'object') return out;
  if (isNbtItemStack(val)) return [{ stack: val, slotKey: baseKey }];
  /** @param {any[]} arr */
  const pushArr = (arr) => arr.forEach((e, idx) => {
    const w = Boolean(e && typeof e === 'object' && (e.slot !== undefined || e.Slot !== undefined));
    const st = isNbtItemStack(e) ? e : (isNbtItemStack(e?.item, { allowNoCount: w }) ? e.item : (isNbtItemStack(e?.Stack, { allowNoCount: w }) ? e.Stack : null));
    if (st) out.push({ stack: st, slotKey: `${baseKey}#${idx}` });
  });
  if (Array.isArray(val)) { pushArr(val); return out; }
  for (const [k, x] of Object.entries(val)) {
    if (!x || typeof x !== 'object' || /^(last|old|prev|cosmetic|backup|cache|ghost|render|sync)/i.test(k)) continue;
    if (isNbtItemStack(x)) { out.push({ stack: x, slotKey: `${baseKey}:${k}` }); continue; }
    if (Array.isArray(x)) pushArr(x);
  }
  return out;
}

export async function extractSlotsInBrowser(pnbt, wdir, store, invCounts) {
  /** @type {PlayerSlotsData} */
  const slots = {
    mainHand: null, offHand: null, hotbar: [], inventory: [],
    armor: [], curios: [], curiosTypes: [],
    toolbelt: [], toolbeltTools: [], modSlots: [], backpacks: [], enderChest: [],
  };

  /** @type {Map<string, any>} */
  const bpMap = new Map();
  for (const bpRel of BACKPACK_STORAGE_FILES) {
    const bpFile = await wdir.getFile(bpRel);
    if (!bpFile) continue;
    const bpNbt = /** @type {any} */ (await readNbt(await bpFile.arrayBuffer()).catch(() => ({})));
    const cl = bpNbt?.data?.backpackContents || bpNbt?.backpackContents;
    if (Array.isArray(cl)) {
      for (const entry of cl) {
        const k = entry?.contents ? uuidKey(entry.uuid) : '';
        if (k) bpMap.set(k, entry.contents);
      }
    } else if (cl && typeof cl === 'object') {
      for (const [id, contents] of Object.entries(cl)) {
        const k = uuidKey(id);
        if (k && contents && typeof contents === 'object') bpMap.set(k, contents);
      }
    }
  }

  /** @param {any} raw @param {string} slotLabel @param {string} slotKind @returns {SlotItemEntry | null} */
  const fmtStack = (raw, slotLabel, slotKind) => {
    if (!raw || typeof raw !== 'object') return null;
    const id = raw.id;
    if (typeof id !== 'string' || !id || id === 'minecraft:air') return null;
    const count = Number(raw.count ?? raw.Count ?? 1);
    if (count <= 0) return null;
    const comp = raw.components && typeof raw.components === 'object' ? raw.components : null;
    const uk = resolveStackUk(store, id, comp);
    const cname = customNameOf(raw);
    const ns = id.split(':')[0] || 'minecraft';
    /** @type {SlotItemEntry} */
    const out = {
      id, uk, count,
      slot: raw.Slot ?? null,
      slotLabel, slotKind, ns,
      modName: ns === 'minecraft' ? 'Minecraft' : (store.modById.get(ns)?.name || ns),
    };
    if (cname && cname !== uk) out.customName = cname;
    const dmg = Number(comp?.['minecraft:damage']) || 0;
    const maxDmg = Number(comp?.['minecraft:max_damage']) || 0;
    if (maxDmg > 0) out.durabilityPct = Math.max(0, Math.min(100, Math.round(((maxDmg - dmg) / maxDmg) * 100)));
    return out;
  };

  /** K23: углиб, ланцюжком «A → B»; ключ вкладеного — ключ батька + « → назва» (як міст і живий знімок).
   * @param {any} rawItem @param {string} title @param {SlotItemEntry[]} outArr @param {string} where
   * @param {string} [keyWhere] @param {number} [depth] @param {{ n: number }} [budget] @param {string} [parentKey] */
  const extractNested = (rawItem, title, outArr, where = '', keyWhere = '', depth = 1, budget = { n: NEST_BUDGET }, parentKey = '') => {
    const comp = rawItem?.components;
    if (!comp || typeof comp !== 'object') return;
    const sUuid = uuidKey(comp['sophisticatedcore:storage_uuid'] || comp['storage_uuid']);
    const bpCap = Number(comp['sophisticatedcore:number_of_inventory_slots']) || 0;
    const key = sUuid || parentKey || `${keyWhere || where}|${title}`;
    const tag = (/** @type {SlotItemEntry} */ f, /** @type {number | null} */ bpSlot, /** @type {string} */ bpKind) => {
      f.bpTitle = title;
      f.bpKey = key;
      f.bpKind = bpKind;
      if (bpCap) f.bpCapacity = bpCap;
      if (bpSlot !== null) f.bpSlot = bpSlot;
      if (where) f.bpWhere = where;
      invCounts[f.id] = (invCounts[f.id] || 0) + f.count;
      return f;
    };
    /** @param {any} st @param {number} slot @param {number} count @param {string} kind @param {string} label */
    const take = (st, slot, count, kind, label) => {
      if (budget.n <= 0) return;
      const f = fmtStack(st, label, 'backpack');
      if (!f) return;
      if (Number(count) > 0) f.count = Number(count);
      budget.n--;
      outArr.push(tag(f, Number.isFinite(slot) ? slot : null, kind));
      const own = nestedStacks(st).length > 0 || Boolean(uuidKey(st?.components?.['sophisticatedcore:storage_uuid'] || st?.components?.storage_uuid));
      if (!own) return;
      if (depth >= NEST_MAX_DEPTH || budget.n <= 0) { f.more = true; return; }
      const name = customNameOf(st) || f.uk;
      extractNested(st, `${title} → ${name}`, outArr, where, keyWhere, depth + 1, budget, `${key} → ${name}`);
    };
    for (const it of nestedStacks(rawItem)) take(it.stack, it.slot, it.count, it.comp === 'minecraft:bundle_contents' ? 'bundle' : 'container', `Усередині «${title}»`);
    if (sUuid && bpMap.has(sUuid)) {
      const stks = bpMap.get(sUuid)?.inventory?.stacks || bpMap.get(sUuid)?.Items || [];
      if (Array.isArray(stks)) stks.forEach((/** @type {any} */ st, /** @type {number} */ idx) => take(st, Number(st?.Slot ?? idx), Number(st?.count ?? st?.Count ?? 1), 'backpack', `Рюкзак «${title}»`));
    }
  };

  const sel = Number(pnbt.SelectedItemSlot ?? 0);
  /** @type {Record<number, [string, string]>} */
  const armorMap = { 100: ['feet', 'Черевики'], 101: ['legs', 'Наголінники'], 102: ['chest', 'Нагрудник'], 103: ['head', 'Шолом'] };
  for (const raw of Array.isArray(pnbt.Inventory) ? pnbt.Inventory : []) {
    const sl = Number(raw?.Slot ?? -1);
    let kind = 'inventory';
    let label = `Інвентар (слот ${sl})`;
    if (sl >= 0 && sl <= 8) {
      kind = sl === sel ? 'mainHand' : 'hotbar';
      label = sl === sel ? `Головна рука (слот ${sl + 1})` : `Гаряча панель (слот ${sl + 1})`;
    } else if (sl === -106) {
      kind = 'offHand'; label = 'Друга рука (Offhand)';
    } else if (armorMap[sl]) {
      kind = 'armor'; label = `Броня (${armorMap[sl][1]})`;
    }
    const f = fmtStack(raw, label, kind);
    if (!f) continue;
    if (armorMap[sl]) f.armorSlot = armorMap[sl][0];
    if (sl === sel) { slots.mainHand = f; slots.hotbar.push(f); }
    else if (kind === 'hotbar') slots.hotbar.push(f);
    else if (kind === 'offHand') slots.offHand = f;
    else if (kind === 'armor') slots.armor.push(f);
    else slots.inventory.push(f);
    extractNested(raw, customNameOf(raw) || f.uk, slots.backpacks, label);
  }

  /** @type {Record<string, string>} */
  const eqUk = { feet: 'Черевики', legs: 'Наголінники', chest: 'Нагрудник', head: 'Шолом' };
  if (pnbt.equipment && typeof pnbt.equipment === 'object') {
    for (const [eqSlot, eqStack] of Object.entries(pnbt.equipment)) {
      if (eqSlot === 'mainhand' && !slots.mainHand) slots.mainHand = fmtStack(eqStack, 'Головна рука', 'mainHand');
      else if (eqSlot === 'offhand' && !slots.offHand) slots.offHand = fmtStack(eqStack, 'Друга рука (Offhand)', 'offHand');
      else if (eqUk[eqSlot]) {
        const arm = fmtStack(eqStack, `Броня (${eqUk[eqSlot]})`, 'armor');
        if (arm) { arm.armorSlot = eqSlot; slots.armor.push(arm); }
      }
    }
  }

  const att = pnbt['neoforge:attachments'] || {};
  const curList = att['curios:inventory']?.Curios || [];
  if (Array.isArray(curList)) {
    for (const curEntry of curList) {
      if (!curEntry || typeof curEntry !== 'object') continue;
      for (const [slotId, slotData] of Object.entries(curEntry)) {
        const idName = slotData?.Identifier || slotId;
        const slotUk = CURIOS_SLOT_UK[idName] || idName;
        const size = Number(slotData?.Stacks?.Size ?? slotData?.Size ?? 0);
        if (size > 0) slots.curiosTypes?.push({ id: idName, uk: slotUk, size });
        const items = slotData?.Stacks?.Items || [];
        if (Array.isArray(items)) {
          items.forEach((/** @type {any} */ cItem, /** @type {number} */ cIdx) => {
            const f = fmtStack(cItem, `Curios: ${slotUk}`, 'curios');
            if (f) {
              f.curiosSlot = idName; f.curiosSlotUk = slotUk; f.curiosIndex = Number(cItem?.Slot ?? cIdx);
              slots.curios.push(f);
              extractNested(cItem, customNameOf(cItem) || f.uk, slots.backpacks, `Curios: ${slotUk}`);
            }
          });
        }
      }
    }
  }

  // K23: додаткові слоти модів — з будь-якого вкладення гравця (міст K16), не за назвою мода; уміст — тим самим обходом
  for (const [attKey, attVal] of Object.entries(att)) {
    if (attKey === 'curios:inventory') continue;
    for (const { stack, slotKey } of attachmentStacks(attVal, attKey)) {
      const f = fmtStack(stack, 'Додатковий слот', 'mod_slot');
      if (!f) continue;
      f.slotKey = slotKey;
      slots.modSlots?.push(f);
      extractNested(stack, customNameOf(stack) || f.uk, slots.backpacks, 'Додатковий слот', slotKey);
    }
  }

  for (const eItem of Array.isArray(pnbt.EnderItems) ? pnbt.EnderItems : []) {
    const f = fmtStack(eItem, 'Ендер-скриня', 'enderChest');
    if (f) {
      slots.enderChest.push(f);
      extractNested(eItem, `Усередині Ендер-скрині (${customNameOf(eItem) || f.uk})`, slots.enderChest, 'Ендер-скриня');
    }
  }
  return slots;
}
