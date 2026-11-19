// @ts-check
// views/assistant/slots-view.js — об'єднана вкладка «🎒 Слоти й клавіші» (#/assistant):
// візуальна розкладка реальних слотів ATM11 (броня, руки, додаткові слоти модів (K23), слоти Curios, інвентар 3×9,
// гаряча панель 1×9, вкладені рюкзаки/контейнери/Ендер-скриня) + спливаючі підказки й майстер-деталь інспектор.
import { h, mount } from '../../core/dom.js';
import { itemIconUrl, itemNameUk } from '../../core/store.js';
import { CURIOS_SLOT_UK } from '../../core/nbt-slots.js';
import {
  DEFAULT_CURIOS_TYPES, CORE_CURIO_IDS, CURIO_GLYPH, KEY_STATE_LABEL,
  fmtCount, buildKeyLookup, resolveActiveSlots, collectNestedContainers, containerLayout,
} from './slots-model.js';

/**
 * Рендерить об'єднану вкладку «🎒 Слоти й клавіші».
 * @param {Store} s
 * @param {any} an
 * @param {any} st
 * @param {KeyAct[]} keysList
 * @param {() => void} redrawLeft
 * @param {(q: string, useExt?: boolean) => void} askInChat
 */
export function renderSlotsAndKeysTab(s, an, st, keysList, redrawLeft, askInChat) {
  const lv = st.liveState;
  const w = lv?.world;
  const wPlayer = w?.player;
  const p = an.world;
  const slots = resolveActiveSlots(s, an, lv);
  const selectedHotbar = Number(lv?.live?.selected_slot ?? wPlayer?.selectedSlot ?? p?.player?.selected_slot ?? 0);
  const kl = buildKeyLookup(s, keysList, lv?.keyRadar || []);

  const { map: containersMap, list: containers } = collectNestedContainers(slots);
  if (containers.length && (!st.activeContainerKey || !containersMap.has(st.activeContainerKey))) {
    st.activeContainerKey = containers[0].key;
  }

  /** @type {Map<string, any>} */
  const selectable = new Map();
  // K23: parentKey — контейнер, у якому лежить річ; її власний вміст — контейнер «<ланцюжок> → <назва>» (міст K17), а не будь-який
  // однойменний верхнього рівня (друга «Шалкерова коробка» в ранці — не та, що в інвентарі)
  const registerItem = (/** @type {string} */ selKey, /** @type {any} */ item, /** @type {string} */ fallbackWhere = '', /** @type {string} */ parentKey = '') => {
    if (!item || !item.id) return null;
    const uk = itemNameUk(s, item.id, item.customName || item.uk);
    const kInfo = kl.forItem(item);
    const ownCont = parentKey
      ? containersMap.get(`${parentKey} → ${item.uk}`) || null
      : containers.find((c) => c.title === (item.customName || item.uk || uk) || (c.where && c.where === item.slotLabel));
    const enriched = {
      ...item, selKey, uk, slotLabel: item.slotLabel || fallbackWhere,
      keys: kInfo.keys, warnings: kInfo.warnings, worst: kInfo.worst, howToUse: kInfo.howToUse,
      containerKey: ownCont?.key || '',
    };
    selectable.set(selKey, enriched);
    return enriched;
  };

  const armorBySlot = /** @type {Record<string, any>} */ ({});
  for (const a of slots.armor || []) {
    const aKey = a.armorSlot || (a.slot === 103 ? 'head' : a.slot === 102 ? 'chest' : a.slot === 101 ? 'legs' : 'feet');
    armorBySlot[aKey] = registerItem(`armor:${aKey}`, a, `Броня (${aKey})`);
  }
  const hotbarBySlot = /** @type {Record<number, any>} */ ({});
  for (const hItem of slots.hotbar || []) {
    const idx = Number(hItem.slot ?? 0);
    if (idx >= 0 && idx <= 8) hotbarBySlot[idx] = registerItem(`hotbar:${idx}`, hItem, `Гаряча панель (слот ${idx + 1})`);
  }
  const mainHandItem = hotbarBySlot[selectedHotbar] || (slots.mainHand ? registerItem('hand:main', slots.mainHand, 'Головна рука') : null);
  const offHandItem = slots.offHand ? registerItem('hand:off', slots.offHand, 'Друга рука (Offhand)') : null;

  const invBySlot = /** @type {Record<number, any>} */ ({});
  for (const invItem of slots.inventory || []) {
    const idx = Number(invItem.slot ?? -1);
    if (idx >= 9 && idx <= 35) invBySlot[idx] = registerItem(`inv:${idx}`, invItem, `Інвентар (слот ${idx})`);
  }

  // K23: додаткові слоти модів (міст K16 — будь-який мод, без коду під мод); уміст предмета в слоті — вкладений контейнер
  const modSlotItems = (slots.modSlots || []).map((ms, i) => registerItem(`mod:${ms.slotKey || ms.slot || i}`, ms, ms.slotLabel || 'Додатковий слот')).filter(Boolean);

  const curioTypesRaw = (slots.curiosTypes && slots.curiosTypes.length) ? slots.curiosTypes : DEFAULT_CURIOS_TYPES;
  /** @type {Map<string, any[]>} */
  const curiosOccupied = new Map();
  (slots.curios || []).forEach((c, idx) => {
    const cType = c.curiosSlot || 'curio';
    let arr = curiosOccupied.get(cType);
    if (!arr) { arr = []; curiosOccupied.set(cType, arr); }
    const enriched = registerItem(`curio:${cType}:${c.curiosIndex ?? idx}`, c, `Curios: ${CURIOS_SLOT_UK[cType] || cType}`);
    if (enriched) arr.push(enriched);
  });

  for (const cont of containers) {
    cont.items.forEach((ci, idx) => registerItem(`cont:${cont.key}:${ci.bpSlot ?? idx}`, ci, cont.title, cont.key));
  }
  for (const g of kl.globals) selectable.set(g.selKey, g);

  const seenQuick = new Set();
  const dedupedQuick = [
    ...[...selectable.values()].filter((x) => x.slotKind !== 'global' && x.keys?.length > 0),
    ...kl.globals,
  ].filter((x) => {
    const k = x.slotKind === 'global' ? x.selKey : `${x.id}|${x.slotKind}`;
    if (seenQuick.has(k)) return false;
    seenQuick.add(k);
    return true;
  });

  if (!st.selectedSlotKey || !selectable.has(st.selectedSlotKey)) {
    const firstInteresting = dedupedQuick[0] || mainHandItem || [...selectable.values()][0] || null;
    st.selectedSlotKey = firstInteresting ? firstInteresting.selKey : '';
  }

  const slotTip = h('div.mc-slot-tip', { hidden: true, role: 'tooltip' });

  /** @param {HTMLElement} anchorEl @param {any} enriched @param {string} emptyText */
  const showSlotTip = (anchorEl, enriched, emptyText) => {
    if (!enriched) {
      slotTip.className = 'mc-slot-tip is-empty';
      mount(slotTip, h('span', null, emptyText || 'Порожній слот'));
    } else {
      slotTip.className = 'mc-slot-tip';
      const img = itemIconUrl(s, enriched.id);
      const modTitle = s.modById.get(enriched.ns)?.name || enriched.modName || enriched.ns;
      const dur = typeof enriched.durabilityPct === 'number' ? enriched.durabilityPct : null;
      const durColor = dur !== null ? (dur <= 15 ? 'var(--bad)' : dur <= 45 ? 'var(--warn)' : 'var(--ok)') : '';
      mount(slotTip,
        h('div.mc-tip-head', null,
          img
            ? h('img.mc-tip-ic', { src: img, alt: '', width: 28, height: 28 })
            : h('span.mc-slot-fallback', null, (enriched.uk || '?').slice(0, 2).toUpperCase()),
          h('div.mc-tip-titles', null,
            h('div.mc-tip-name', null,
              h('b', null, enriched.uk),
              enriched.count > 1 ? h('span.ai-cnt', null, ` ×${enriched.count}`) : null),
            h('div.mc-tip-sub', null, `${enriched.slotLabel} · ${modTitle}`))),
        dur !== null ? h('div.mc-tip-dur', null,
          h('span', null, `Міцність: ${dur}%`),
          h('span.mc-tip-dur-bar', null, h('i', { style: { width: `${dur}%`, background: durColor } }))) : null,
        enriched.detail ? h('div.mc-tip-detail', null, enriched.detail) : null,
        enriched.containerKey ? h('div.mc-tip-bag', null, '📦 Має вкладені предмети — натисніть для перегляду вмісту') : null,
        enriched.more ? h('div.mc-tip-bag', null, '📦 Є ще вміст глибше — знімок гри його не розгортає') : null,
        enriched.keys?.length ? h('div.mc-tip-keys', null,
          enriched.keys.slice(0, 5).map((/** @type {any} */ k) => h('div.mc-tip-krow', null,
            h(`span.mc-slot-dot.${k.state}`),
            h('span.mc-tip-kname', null, k.name),
            h('kbd.ai-kbd', null, k.combo)))) : null,
        enriched.warnings?.length ? h('div.mc-tip-warn', null, `⚠ ${enriched.warnings[0]}`) : null,
        h('div.mc-tip-foot', null,
          h('code', null, enriched.id),
          h('span', null, 'клік — у інспектор')));
    }
    slotTip.hidden = false;
    const r = anchorEl.getBoundingClientRect();
    const tw = slotTip.offsetWidth || 260;
    const th = slotTip.offsetHeight || 80;
    const left = Math.max(10, Math.min(window.innerWidth - tw - 10, r.left + r.width / 2 - tw / 2));
    const top = r.top - th - 8 >= 10 ? r.top - th - 8 : Math.min(window.innerHeight - th - 10, r.bottom + 8);
    slotTip.style.left = `${Math.round(left)}px`;
    slotTip.style.top = `${Math.round(top)}px`;
  };

  const hideSlotTip = () => { slotTip.hidden = true; };

  /** @param {any} enriched @param {{ emptyIcon?: string, emptyHint?: string, cornerTag?: string, activeHand?: boolean }} [opts] */
  const renderSlotCell = (enriched, opts = {}) => {
    const isSel = Boolean(enriched && st.selectedSlotKey === enriched.selKey);
    const cls = [
      'mc-slot', enriched ? 'filled' : 'empty', isSel ? 'sel' : '',
      opts.activeHand ? 'hand-active' : '', enriched?.worst ? `st-${enriched.worst}` : '',
    ].filter(Boolean).join('.');

    if (!enriched) {
      return h(`div.${cls}`, {
        onmouseenter: (/** @type {MouseEvent} */ e) => showSlotTip(/** @type {HTMLElement} */ (e.currentTarget), null, opts.emptyHint || 'Порожній слот'),
        onmouseleave: hideSlotTip,
      },
      opts.cornerTag ? h('span.mc-slot-idx', null, opts.cornerTag) : null,
      opts.emptyIcon ? h('span.mc-slot-ghost', null, opts.emptyIcon) : null);
    }

    const img = itemIconUrl(s, enriched.id);
    const dur = typeof enriched.durabilityPct === 'number' ? enriched.durabilityPct : null;
    const durColor = dur !== null ? (dur <= 15 ? 'var(--bad)' : dur <= 45 ? 'var(--warn)' : 'var(--ok)') : '';

    return h(`button.${cls}`, {
      type: 'button',
      'aria-label': `${enriched.uk}${enriched.count > 1 ? ` ×${enriched.count}` : ''} (${enriched.slotLabel})`,
      onmouseenter: (/** @type {MouseEvent} */ e) => showSlotTip(/** @type {HTMLElement} */ (e.currentTarget), enriched, ''),
      onmouseleave: hideSlotTip,
      onfocus: (/** @type {FocusEvent} */ e) => showSlotTip(/** @type {HTMLElement} */ (e.currentTarget), enriched, ''),
      onblur: hideSlotTip,
      onclick: () => {
        hideSlotTip();
        st.selectedSlotKey = enriched.selKey;
        if (enriched.containerKey) st.activeContainerKey = enriched.containerKey;
        redrawLeft();
      },
    },
    opts.cornerTag ? h('span.mc-slot-idx', null, opts.cornerTag) : null,
    img
      ? h('img.mc-slot-img', {
          src: img,
          alt: '',
          width: 28,
          height: 28,
          onerror: (/** @type {Event} */ ev) => {
            const elImg = /** @type {HTMLElement} */ (ev.currentTarget);
            elImg.replaceWith(h('span.mc-slot-fallback', null, (enriched.uk || '?').slice(0, 2).toUpperCase()));
          },
        })
      : h('span.mc-slot-fallback', null, (enriched.uk || '?').slice(0, 2).toUpperCase()),
    enriched.count > 1 ? h('span.mc-slot-cnt', null, fmtCount(enriched.count)) : null,
    enriched.worst ? h(`span.mc-slot-dot.${enriched.worst}`) : null,
    enriched.containerKey ? h('span.mc-slot-bag', null, '▾') : null,
    dur !== null && dur < 100 ? h('span.mc-slot-dur', null, h('i', { style: { width: `${dur}%`, background: durColor } })) : null);
  };

  const curioCells = [];
  let hiddenCurioCount = 0;
  for (const ct of curioTypesRaw) {
    const occ = curiosOccupied.get(ct.id) || [];
    const isCore = CORE_CURIO_IDS.has(ct.id) || occ.length > 0;
    if (!isCore && !st.showAllCurios) {
      hiddenCurioCount += Math.max(1, ct.size || 1);
      continue;
    }
    const size = Math.max(occ.length, ct.size || 1);
    const labelUk = CURIOS_SLOT_UK[ct.id] || ct.uk || ct.id;
    for (let i = 0; i < size; i++) {
      const slotHint = size > 1 ? `${labelUk} #${i + 1}` : labelUk;
      curioCells.push(h('div.mc-curio-unit', null,
        renderSlotCell(occ[i] || null, { emptyIcon: CURIO_GLYPH[ct.id] || '💍', emptyHint: `Слот Curios: ${slotHint} (порожньо)` }),
        h('span.mc-curio-lbl', { title: slotHint }, labelUk)));
    }
  }
  for (const [cId, occ] of curiosOccupied.entries()) {
    if (curioTypesRaw.some((ct) => ct.id === cId)) continue;
    const labelUk = CURIOS_SLOT_UK[cId] || cId;
    for (const it of occ) {
      curioCells.push(h('div.mc-curio-unit', null,
        renderSlotCell(it, { emptyIcon: '💍', emptyHint: `Curios: ${labelUk}` }),
        h('span.mc-curio-lbl', null, labelUk)));
    }
  }

  const hp = Math.round((lv?.live?.health ?? wPlayer?.health ?? p?.player?.health ?? 20) * 10) / 10;
  const food = lv?.live?.food ?? wPlayer?.foodLevel ?? p?.player?.food_level ?? 20;
  const xp = wPlayer?.xpLevel ?? p?.player?.xp_level ?? 0;
  const posArr = lv?.live?.pos || wPlayer?.pos || p?.player?.pos;
  const dimLabel = lv?.live?.dimensionUk || wPlayer?.dimensionUk || an.dimUk;
  const ks = lv?.keyStats || kl.stats;
  const hasKeyIssues = (ks.conflicts || 0) > 0 || (ks.kumaWarns || 0) > 0;
  const activeCont = containers.find((c) => c.key === st.activeContainerKey) || null;
  const craftedList = Array.isArray(w?.crafted)
    ? w.crafted.map((/** @type {any} */ c) => ({ id: c.id, name: itemNameUk(s, c.id, c.uk), count: c.count, img: itemIconUrl(s, c.id) }))
    : an.craftedEntries.map((/** @type {any} */ c) => ({ id: c.id, name: c.name, count: c.count, img: c.meta?.img || itemIconUrl(s, c.id) }));
  const inspected = selectable.get(st.selectedSlotKey) || null;

  return h('div.ai-stack', null,
    h('div.card.mc-player-bar', null,
      h('div.mc-player-top', null,
        h('div.mc-player-id', null,
          h('span.mc-avatar', null, '🧙'),
          h('div', null,
            h('b', null, wPlayer?.name || p?.player?.name || 'Гравець ATM11'),
            h('div.small.muted', null, `${dimLabel}${posArr ? ` · X:${posArr[0]} Y:${posArr[1]} Z:${posArr[2]}` : ''}`))),
        h('div.mc-player-stats', null,
          h('span.mc-stat-pill', { title: 'Здоров’я' }, `❤️ ${hp}`),
          h('span.mc-stat-pill', { title: 'Голод' }, `🍖 ${food}`),
          h('span.mc-stat-pill', { title: 'Рівень досвіду' }, `✨ XP ${xp}`),
          h('span.mc-stat-pill', { title: 'Світовий рівень Apotheosis' }, `👑 ${wPlayer?.worldTierUk || an.worldTierUk}`),
          h('span.mc-stat-pill', { title: 'Унікальних страв (Spice of Life)' }, `🥕 ${wPlayer?.uniqueFoods ?? p?.player?.unique_foods ?? 0}`)),
        h('a.badge.mc-keystat-badge', {
          href: '#/keys',
          style: { '--c': hasKeyIssues ? 'var(--bad)' : (ks.maybe || ks.unboundImp) ? 'var(--warn)' : 'var(--ok)' },
          title: 'Перейти до інтерактивної карти всіх клавіш (#/keys)',
        }, `⌨️ Конфліктів: ${ks.conflicts || 0} · Перетинів: ${ks.maybe || 0} · Непризнач.: ${ks.unboundImp || 0} →`))),

    h('div.card.mc-rig-card', null,
      h('div.ai-q-head', null,
        h('h3', null, '🎒 Ігрові слоти спорядження, Curios та інвентарю'),
        h('span.small.muted', null, st.liveConnected
          ? (w?.slotsSource?.kind === 'live' ? '🟢 Живий зріз із клієнта гри' : '💾 Синхронізовано із сейву моста')
          : '📂 Зріз зі збереження світу · натисніть слот для огляду клавіш')),

      h('div.mc-upper-rig', null,
        h('div.mc-equip-panel', null,
          h('div.mc-sub-head', null,
            h('span', null, '🛡 Броня та руки'),
            h('span.small.muted', null, `Слот руки: #${selectedHotbar + 1}`)),
          h('div.mc-armor-hands', null,
            [['head', '🪖', 'Шолом'], ['chest', '🦺', 'Нагрудник'], ['legs', '👖', 'Наголінники'], ['feet', '🥾', 'Черевики']].map(([aId, ic, lbl]) =>
              h('div.mc-labeled-slot', null,
                renderSlotCell(armorBySlot[aId], { emptyIcon: ic, emptyHint: `Броня: ${lbl} (порожньо)` }),
                h('span.mc-curio-lbl', null, lbl))),
            h('div.mc-labeled-slot', null,
              renderSlotCell(mainHandItem, { emptyIcon: '✋', emptyHint: 'Головна рука (активний слот хотбару)', activeHand: true }),
              h('span.mc-curio-lbl', null, 'Головна')),
            h('div.mc-labeled-slot', null,
              renderSlotCell(offHandItem, { emptyIcon: '🛡', emptyHint: `Друга рука (Offhand, клавіша ${kl.offhandSwapCombo || 'F'})` }),
              h('span.mc-curio-lbl', null, 'Друга рука'))),

          modSlotItems.length ? h('div.mc-belt-box', null,
            h('div.mc-sub-head', null,
              h('span', null, `🧩 Додаткові слоти модів (${modSlotItems.length})`)),
            h('div.mc-belt-slots', null,
              modSlotItems.map((ms) => h('div.mc-labeled-slot', null,
                renderSlotCell(ms, { emptyIcon: '🧩', emptyHint: ms.slotLabel }),
                h('span.mc-curio-lbl', { title: `${ms.modName || ms.ns} · ${ms.slotLabel}` }, ms.modName || ms.ns))))) : null),

        h('div.mc-curios-panel', null,
          h('div.mc-sub-head', null,
            h('span', null, `💍 Аксесуари Curios (${(slots.curios || []).length} одягнено)`),
            h('div.mc-mini-kbs', null,
              kl.curiosOpenCombo ? h('kbd.ai-kbd', { title: 'Відкрити/закрити інвентар Curios у грі' }, kl.curiosOpenCombo) : null,
              hiddenCurioCount > 0 || st.showAllCurios ? h('button.wb-btn', {
                type: 'button',
                onclick: () => { st.showAllCurios = !st.showAllCurios; redrawLeft(); },
              }, st.showAllCurios ? 'Згорнути порожні спец.' : `+ ще ${hiddenCurioCount} спец.`) : null)),
          h('div.mc-curios-grid', null, ...curioCells))),

      h('div.mc-inv-section', null,
        h('div.mc-sub-head', null,
          h('span', null, '🎒 Основний інвентар (3×9) та Гаряча панель (1–9)'),
          h('span.small.muted', null, '● вільна · ● перетин/не признач. · ● конфлікт')),
        h('div.mc-inv-grid', null,
          ...Array.from({ length: 27 }, (_, i) => renderSlotCell(invBySlot[i + 9] || null, { emptyHint: `Інвентар: слот ${i + 9}` }))),
        h('div.mc-hotbar-sep'),
        h('div.mc-inv-grid.mc-hotbar-grid', null,
          ...Array.from({ length: 9 }, (_, sl) =>
            renderSlotCell(hotbarBySlot[sl] || null, {
              cornerTag: String(sl + 1),
              activeHand: sl === selectedHotbar,
              emptyHint: `Гаряча панель: слот ${sl + 1}${sl === selectedHotbar ? ' (активний у руці)' : ''}`,
            }))))),

    containers.length ? h('div.card.mc-containers-card', null,
      h('div.ai-q-head', null,
        h('h3', null, '📦 Вміст одягнених ранців, сумок та Ендер-скрині'),
        h('span.small.muted', null, `Контейнерів із речами: ${containers.length}`)),
      h('div.mc-cont-tabs', null, containers.map((c) => {
        const cImg = itemIconUrl(s, c.itemId);
        const fallbackGlyph = c.kind === 'backpack' ? '🎒' : c.kind === 'ender' ? '👁' : c.kind === 'bundle' ? '👝' : '📦';
        return h(`button.mc-cont-tab${c.key === activeCont?.key ? '.on' : ''}`, {
          type: 'button',
          onclick: () => { st.activeContainerKey = c.key; redrawLeft(); },
        },
        cImg ? h('img.mc-cont-tab-ic', { src: cImg, alt: '', width: 18, height: 18 }) : h('span', null, fallbackGlyph),
        h('span', null, c.title),
        c.where ? h('span.muted', null, `· ${c.where}`) : null,
        h('b', null, `(${c.items.length})`));
      })),
      activeCont ? renderContainerGrid(activeCont, selectable, renderSlotCell) : null) : null,

    renderInspectorCard(s, st, inspected, dedupedQuick, lv, redrawLeft, askInChat),
    slotTip,

    craftedList.length ? h('details.card.mc-crafted-details', null,
      h('summary', null, `🔨 Скрафчені предмети зі статистики світу (${craftedList.length})`),
      h('div.item-list.mc-crafted-list', null, craftedList.map((/** @type {any} */ it) =>
        h('div.item-chip', { title: it.id },
          it.img ? h('img', { src: it.img, alt: '', width: 22, height: 22 }) : h('span.nc-q', null, '🔨'),
          h('span', null, it.name),
          h('span.muted', null, `×${it.count}`))))) : null);
}

/** @param {{ key: string, title: string, where: string, kind: string, cap: number, items: SlotItemEntry[] }} cont
 * @param {Map<string, any>} selectable @param {(it: any, opts?: any) => HTMLElement} renderSlotCell */
function renderContainerGrid(cont, selectable, renderSlotCell) {
  const bySlot = /** @type {Record<number, any>} */ ({});
  let maxSl = -1;
  cont.items.forEach((ci, idx) => {
    const sl = Number(ci.bpSlot ?? ci.slot ?? idx);
    if (sl > maxSl) maxSl = sl;
    bySlot[sl] = selectable.get(`cont:${cont.key}:${ci.bpSlot ?? idx}`) || null;
  });
  // K24 (§4 п. 33): місткість з гри — недоступні місця зафарбовані (варіант B), невідома — лише зайняте з підписом
  const lay = containerLayout(cont.cap, maxSl);
  const cells = Array.from({ length: lay.total }, (_, sl) => (sl >= lay.open
    ? h('div.mc-slot.locked', { title: `${cont.title}: місць ${lay.open}`, 'aria-hidden': 'true' })
    : renderSlotCell(bySlot[sl] || null, { emptyHint: `${cont.title}: слот ${sl + 1}` })));
  return h('div.mc-cont-body', null,
    h(`div.mc-inv-grid${lay.scroll ? '.mc-cont-scroll' : ''}`, null, ...cells),
    lay.known ? null : h('div.mc-cont-note', null, 'Місткість невідома — оновиться з наступним знімком гри'));
}

/** @param {Store} s @param {any} st @param {any} inspected @param {any[]} quickList @param {any} lv
 * @param {() => void} redrawLeft @param {(q: string, ext?: boolean) => void} askInChat */
function renderInspectorCard(s, st, inspected, quickList, lv, redrawLeft, askInChat) {
  const img = inspected && inspected.slotKind !== 'global' ? itemIconUrl(s, inspected.id) : null;
  const modMeta = inspected ? s.modById.get(inspected.ns) : null;
  const liveDetails = inspected && lv?.live?.item_details?.[inspected.id];

  return h('div.card.mc-inspector-card', null,
    h('div.ai-q-head', null,
      h('h3', null, '🔍 Інспектор предмета, параметрів та гарячих клавіш'),
      h('span.small.muted', null, 'Оберіть предмет зі списку хоткеїв або натисніть слот вище')),
    h('div.mc-insp-layout', null,
      h('div.mc-insp-list', null,
        quickList.length ? quickList.map((qItem) => {
          const qImg = qItem.slotKind !== 'global' ? itemIconUrl(s, qItem.id) : null;
          const badCnt = (qItem.keys || []).filter((/** @type {any} */ k) => k.state === 'bad' || k.state === 'kuma').length;
          const warnCnt = (qItem.keys || []).filter((/** @type {any} */ k) => k.state === 'warn').length;
          const noneCnt = (qItem.keys || []).filter((/** @type {any} */ k) => k.state === 'none').length;
          const okCnt = (qItem.keys || []).filter((/** @type {any} */ k) => k.state === 'ok').length;
          return h(`button.mc-insp-row${st.selectedSlotKey === qItem.selKey ? '.on' : ''}`, {
            type: 'button',
            onclick: () => {
              st.selectedSlotKey = qItem.selKey;
              if (qItem.containerKey) st.activeContainerKey = qItem.containerKey;
              redrawLeft();
            },
          },
          qImg ? h('img', { src: qImg, alt: '', width: 22, height: 22 }) : h('span.mc-insp-glyph', null, qItem.slotKind === 'global' ? '⌨️' : '📦'),
          h('span.mc-insp-txt', null,
            h('b', null, `${qItem.uk}${qItem.count > 1 ? ` ×${qItem.count}` : ''}`),
            h('small', null, qItem.slotLabel)),
          h('span.mc-insp-marks', null,
            badCnt ? h('span.mc-mark.bad', { title: 'Конфлікти клавіш' }, String(badCnt)) : null,
            warnCnt ? h('span.mc-mark.warn', { title: 'Можливі перетини' }, String(warnCnt)) : null,
            noneCnt ? h('span.mc-mark.none', { title: 'Не призначено' }, String(noneCnt)) : null,
            !badCnt && !warnCnt && !noneCnt && okCnt ? h('span.mc-mark.ok', { title: 'Активні клавіші' }, String(okCnt)) : null));
        }) : h('div.small.muted', null, 'Предметів із модовими клавішами немає — клікніть будь-який слот інвентарю.')),

      inspected ? h('div.mc-insp-detail', null,
        h('div.mc-id-head', null,
          h('div.mc-id-icon', null,
            img ? h('img', { src: img, alt: '', width: 36, height: 36 }) : h('span', null, inspected.slotKind === 'global' ? '⌨️' : '📦')),
          h('div.mc-id-title-wrap', null,
            h('div.mc-id-name', null,
              h('b', null, inspected.uk),
              inspected.count > 1 ? h('span.ai-cnt', null, ` ×${inspected.count}`) : null),
            h('div.mc-id-meta.small', null,
              h('span.badge', { style: { '--c': 'var(--accent)' } }, inspected.slotLabel),
              modMeta ? h('a', { href: `#/mod/${inspected.ns}` }, modMeta.name) : h('span', null, inspected.modName || inspected.ns),
              inspected.slotKind !== 'global' ? h('code.small', null, inspected.id) : null,
              typeof inspected.durabilityPct === 'number' ? h('span.muted', null, `міцність ${inspected.durabilityPct}%`) : null))),
        inspected.detail ? h('div.mc-id-tooltip.small', null, String(inspected.detail).split(' · ').map((/** @type {string} */ ln) => h('div', null, ln))) : null,
        inspected.more ? h('p.small.muted', null, '📦 Є ще вміст глибше — знімок гри його не розгортає.') : null,
        inspected.howToUse ? h('p.small.mc-id-desc', null, inspected.howToUse) : null,
        Array.isArray(liveDetails?.lines) && liveDetails.lines.length
          ? h('div.mc-id-tooltip.small', null, liveDetails.lines.slice(0, 5).map((/** @type {string} */ ln) => h('div', null, ln)))
          : null,
        inspected.keys?.length ? h('table.mc-kd-table', null,
          h('thead', null, h('tr', null, h('th', null, 'Дія'), h('th', null, 'Клавіша'), h('th', null, 'Стан'))),
          h('tbody', null, inspected.keys.map((/** @type {any} */ k) => h(`tr.st-${k.state}`, null,
            h('td', null, h('span', null, k.name), k.note ? h('small.muted', null, k.note) : null),
            h('td', null, h('kbd.ai-kbd', null, k.combo)),
            h('td', null, h(`span.mc-kd-state.${k.state}`, null, KEY_STATE_LABEL[k.state] || k.state))))))
          : h('div.small.muted.mc-nokeys', null, 'Окремих гарячих клавіш немає · ПКМ у руці / у JEI: R — рецепт, U — застосування.'),
        inspected.warnings?.length ? h('div.mc-kd-warns', null,
          inspected.warnings.map((/** @type {string} */ w) => h('div.small.mc-kd-warn', null, `⚠ ${w}`))) : null,
        h('div.mc-id-actions', null,
          h('button.btn.small.primary', {
            type: 'button',
            onclick: () => askInChat(
              inspected.slotKind === 'global'
                ? `Як працює дія «${inspected.uk}» у моді ${inspected.modName} і яку клавішу краще призначити?`
                : `Для чого потрібен предмет «${inspected.uk}» (${inspected.id}), як ним користуватись та з чим поєднувати в ATM11?`,
              st.cfg.mode !== 'local',
            ),
          }, '💬 Запитати в чаті'),
          inspected.slotKind !== 'global' && st.liveConnected ? h('button.btn.small', {
            type: 'button',
            title: 'Знайти всі екземпляри цього предмета у скринях бази (!де)',
            onclick: () => askInChat(`!де ${inspected.uk}`, true),
          }, '📦 Де у скринях? (!де)') : null,
          modMeta ? h('a.btn.small', { href: `#/mod/${inspected.ns}` }, '📘 Опис мода →') : null))
        : h('div.small.muted', null, 'Оберіть слот або предмет зі списку зліва для огляду клавіш і властивостей.')));
}
