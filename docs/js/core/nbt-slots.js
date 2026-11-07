// @ts-check
// core/nbt-slots.js — розбір структурованих слотів гравця (гаряча панель, інвентар 3×9, броня, друга рука, Curios,
// пояс Tool Belt, рюкзаки Sophisticated Backpacks, шалкери/мішечки/DeepNull, Ендер-скриня) прямо в браузері (дзеркало extract_structured_slots).
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
export async function extractSlotsInBrowser(pnbt, wdir, store, invCounts) {
  /** @type {PlayerSlotsData} */
  const slots = {
    mainHand: null, offHand: null, hotbar: [], inventory: [],
    armor: [], curios: [], curiosTypes: [],
    toolbelt: [], toolbeltTools: [], backpacks: [], enderChest: [],
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

  /** @param {any} rawItem @param {string} title @param {SlotItemEntry[]} outArr @param {string} where */
  const extractNested = (rawItem, title, outArr, where = '') => {
    const comp = rawItem?.components;
    if (!comp || typeof comp !== 'object') return;
    const sUuid = uuidKey(comp['sophisticatedcore:storage_uuid'] || comp['storage_uuid']);
    const bpCap = Number(comp['sophisticatedcore:number_of_inventory_slots']) || 0;
    const tag = (/** @type {SlotItemEntry} */ f, /** @type {number | null} */ bpSlot, /** @type {string} */ bpKind) => {
      f.bpTitle = title;
      f.bpKey = sUuid || `${where}|${title}`;
      f.bpKind = bpKind;
      if (bpCap) f.bpCapacity = bpCap;
      if (bpSlot !== null) f.bpSlot = bpSlot;
      if (where) f.bpWhere = where;
      invCounts[f.id] = (invCounts[f.id] || 0) + f.count;
      return f;
    };
    if (Array.isArray(comp['minecraft:container'])) {
      comp['minecraft:container'].forEach((/** @type {any} */ entry, /** @type {number} */ idx) => {
        const f = fmtStack(entry?.item || entry, `Усередині «${title}»`, 'backpack');
        if (f) outArr.push(tag(f, Number(entry?.slot ?? idx), 'shulker'));
      });
    }
    if (Array.isArray(comp['minecraft:bundle_contents'])) {
      comp['minecraft:bundle_contents'].forEach((/** @type {any} */ inner, /** @type {number} */ idx) => {
        const f = fmtStack(inner, `Усередині «${title}»`, 'backpack');
        if (f) outArr.push(tag(f, idx, 'bundle'));
      });
    }
    const dnInv = comp['minecraft:custom_data']?.DeepNull?.Inventory;
    if (Array.isArray(dnInv)) {
      dnInv.forEach((/** @type {any} */ entry, /** @type {number} */ idx) => {
        const f = fmtStack(entry?.Stack || entry?.item || entry, `Усередині «${title}»`, 'backpack');
        if (f) {
          const bigCnt = Number(entry?.Count ?? entry?.count ?? f.count);
          if (bigCnt > 0) f.count = bigCnt;
          outArr.push(tag(f, Number(entry?.Slot ?? idx), 'deepnull'));
        }
      });
    }
    if (sUuid && bpMap.has(sUuid)) {
      const stks = bpMap.get(sUuid)?.inventory?.stacks || bpMap.get(sUuid)?.Items || [];
      if (Array.isArray(stks)) {
        stks.forEach((/** @type {any} */ st, /** @type {number} */ idx) => {
          const f = fmtStack(st, `Рюкзак «${title}»`, 'backpack');
          if (f) outArr.push(tag(f, Number(st?.Slot ?? idx), 'backpack'));
        });
      }
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

  const beltItems = att['toolbelt:belt']?.Items || att['toolbelt:belt']?.stacks || [];
  if (Array.isArray(beltItems)) {
    for (const bItem of beltItems) {
      const f = fmtStack(bItem, 'Пояс (Tool Belt)', 'toolbelt');
      if (f) {
        slots.toolbelt.push(f);
        const inner = bItem?.components?.['minecraft:container'];
        if (Array.isArray(inner)) {
          for (const entry of inner) {
            const bSlot = Number(entry?.slot ?? 0);
            const tf = fmtStack(entry?.item || entry, `У поясі (слот ${bSlot + 1})`, 'toolbelt');
            if (tf) { tf.beltSlot = bSlot; slots.toolbeltTools?.push(tf); }
          }
        }
      }
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
