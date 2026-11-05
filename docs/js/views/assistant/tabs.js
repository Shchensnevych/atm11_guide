// @ts-check
// views/assistant/tabs.js — вкладки сторінки «Помічник»: радар клавіш і Vision, наступні кроки, інвентар, журнал, налаштування.
// Частина сторінки #/assistant (A1: перенесено з views/assistant.js без змін логіки).
import { h } from '../../core/dom.js';
import { isDone, setDone } from '../../core/progress.js';
import { buildPlayerContextPrompt } from '../../core/advisor.js';
import { COMPANION_MODELS, COMPANION_VISION_MODELS, saveAssistantConfig } from '../../core/rag.js';
import { stageBadge, clsBadge } from '../../components/badge.js';

/** @param {string} val @param {string} label @param {string | null} href */
export function kpi(val, label, href) {
  const inner = [h('b', null, val), h('span.small.muted', null, label)];
  return href ? h('a.ai-kpi', { href }, ...inner) : h('div.ai-kpi', null, ...inner);
}

/**
 * Вкладка «⌨️ Радар клавіш (Інвентар + Curios) + Останній скріншот F2 + Стрічка подій».
 * @param {Store} s
 * @param {any} _an
 * @param {any} st
 * @param {any[]} radarItems
 * @param {(q: string, ext?: boolean) => void} runQuery
 * @param {(q?: string) => void} runVisionF2
 */
export function renderRadarAndVisionTab(s, _an, st, radarItems, runQuery, runVisionF2) {
  const lv = st.liveState;
  const shot = lv?.latestScreenshot;
  const baseUrl = (st.cfg.bridgeUrl || 'http://127.0.0.1:8812').replace(/\/$/, '');
  const combat = lv?.combatRadar;
  const events = lv?.events || [];

  return h('div.ai-stack', null,
    // 1. Радар «Інвентар + Curios → Гарячі клавіші»
    h('div.card.ai-radar-card', null,
      h('div.ai-q-head', null,
        h('h3', { style: { margin: 0 } }, '⌨️ Інвентар + Curios → Гарячі клавіші'),
        h('a.small', { href: '#/keys' }, 'Усі 462 клавіші →')),
      h('p.small.muted', { style: { margin: '4px 0 10px' } },
        st.liveConnected
          ? 'Живий зріз предметів, одягнених у слотах Curios, броні, поясі та інвентарі гравця, звірений з актуальним options.txt та правилом Balm / Kuma API:'
          : 'Шпаргалка гарячих клавіш для активних предметів і слотів Curios за даними сейву (запустіть ATM11-Companion для живого моніторингу кожні 2.5 с):'),
      radarItems.length ? h('div.ai-radar-list', null, radarItems.map((/** @type {any} */ r) => {
        const meta = s.items[r.itemId];
        const firstKey = Array.isArray(r.keys) && r.keys.length ? r.keys[0] : null;
        const keyCombo = r.keyUk || (Array.isArray(r.keys) && r.keys.length
          ? r.keys.map((/** @type {any} */ k) => `${k.name}: ${k.combo}`).join(' · ')
          : 'ПКМ / Інвентар');
        const hasWarn = (r.warnings && r.warnings.length > 0) || r.balmWarn || r.unbound || r.conflict;
        const isKuma = r.balmWarn || (r.warnings || []).some((/** @type {string} */ w) => /Balm|Kuma/i.test(w)) || firstKey?.status === 'kuma_warn';
        const statusColor = isKuma ? 'var(--bad)' : hasWarn ? 'var(--warn)' : 'var(--ok)';
        const statusText = isKuma
          ? '🛡 Balm/Kuma: без Ctrl/Shift/Alt!'
          : (r.warnings && r.warnings.length)
            ? r.warnings[0].slice(0, 48)
            : r.unbound
              ? '⚠ Не призначено'
              : r.conflict
                ? '⚡ Конфлікт клавіш'
                : '✔ Активна';
        const subLine = [r.where || r.slotLabel || r.modName || '', r.howToUse || r.actionUk || ''].filter(Boolean).join(' · ');
        return h('div.ai-radar-row', null,
          h('div.ai-radar-item', null,
            meta?.img ? h('img', { src: meta.img, alt: '', width: 24, height: 24 }) : h('span.nc-q', null, '🎒'),
            h('div', null,
              h('b', null, `${r.itemUk || r.actionUk}${r.count > 1 ? ` ×${r.count}` : ''}`),
              h('div.small.muted', null, subLine))),
          h('div.ai-radar-key', null,
            h('kbd.ai-kbd', null, keyCombo),
            h('span.badge', { style: { '--c': statusColor } }, statusText),
            h('button.wb-btn', {
              title: 'Запитати ШІ як користуватися цим предметом і налаштувати клавішу',
              onclick: () => runQuery(`Як користуватися «${r.itemUk || r.actionUk}» (${r.itemId}) та яка клавіша рекомендована?`, st.cfg.mode !== 'local'),
            }, '❓ Як користуватись')));
      })) : h('p.small.muted', null, 'У поточному інвентарі немає спеціальних модових хоткеїв.')),

    // 2. Останній скріншот F2 + Vision AI (Qwen 2.5 VL 72B)
    h('div.card.ai-vision-card', null,
      h('div.ai-q-head', null,
        h('h3', { style: { margin: 0 } }, '📸 Останній скріншот F2 · Vision AI (Qwen 2.5 VL 72B)'),
        shot ? h('span.badge', { style: { '--c': 'var(--ok)' } }, `Скріншот F2: ${shot.name}`) : null),
      shot && st.liveConnected ? h('div.ai-vision-body', null,
        h('div.ai-shot-wrap', null,
          h('img.ai-shot-img', {
            src: `${baseUrl}/screenshots/file?name=${encodeURIComponent(shot.name)}&t=${Math.floor(shot.mtime || shot.mtimeMs || 1)}`,   // C5g: саме цей знімок, не «останній»
            alt: shot.name,
            loading: 'lazy',
          })),
        h('div.ai-shot-actions', null,
          h('p.small.muted', { style: { margin: '0 0 8px' } },
            'Натисніть F2 у грі — скріншот автоматично підтягнеться сюди й в оверлей Alt+Q для миттєвого розбору через Qwen 2.5 VL 72B:'),
          h('div.ai-card-foot', null,
            h('button.btn.small.primary', {
              disabled: st.busyVision,
              onclick: () => runVisionF2('Що зображено на цьому скріншоті гри ATM11? Поясни українською всі елементи та порадь наступні дії.'),
            }, st.busyVision ? '⏳ Аналізую скріншот…' : [h('span.btn-ic', null, '👁️'), ' Розібрати скріншот у 1 клік (Qwen 2.5 VL)']),
            h('button.btn.small', {
              disabled: st.busyVision,
              onclick: () => runVisionF2('Які предмети, блоки або квести видно на екрані і як їх скрафтити чи виконати?'),
            }, '🔍 Що за блоки / інтерфейс?'))))
        : h('p.small.muted', null,
          'Коли запущено ATM11-Companion, тут автоматично відображається останній скріншот із теки minecraft/screenshots/ (клавіша F2) для розбору в 1 клік через Qwen 2.5 VL 72B.')),

    // 3. Бойовий радар та стрічка подій у реальному часі
    h('div.card', null,
      h('div.ai-q-head', null,
        h('h3', { style: { margin: 0 } }, '⚔️ Бойовий радар і стрічка подій у реальному часі'),
        st.liveConnected ? h('span.badge', { style: { '--c': 'var(--ok)' } }, 'SSE Live') : h('span.badge.ghost', null, 'Очікування моста')),
      combat?.lastAlert ? h('div.ai-combat-box', null,
        h('b', { style: { color: 'var(--warn)' } }, `⚔️ ${combat.lastAlert.title || 'Бойове зведення'}`),
        h('p.small', { style: { margin: '4px 0' } }, combat.lastAlert.advice || combat.lastAlert.text || '')) : null,
      events.length ? h('div.ai-events-feed', null, events.slice(0, 10).map((/** @type {any} */ ev) =>
        h('div.ai-ev-row', null,
          h('span.badge', {
            style: { '--c': ev.type === 'death' ? 'var(--bad)' : ev.type === 'kubejs_cmd' ? 'var(--accent)' : ev.type === 'advancement' ? 'var(--ok)' : 'var(--link)' },
          }, ev.type === 'death' ? '💀 Смерть' : ev.type === 'kubejs_cmd' ? '💬 Чат !' : ev.type === 'advancement' ? '🏆 Досягнення' : '📡 Подія'),
          h('span.small', null, ev.text || ev.title || ''),
          ev.time ? h('span.small.muted', { style: { marginLeft: 'auto' } }, ev.time) : null)))
        : h('p.small.muted', null, 'Стрічка подій показує смерті від мобів, нові досягнення, скріншоти F2 та команди !що / !клавіші / !як з ігрового чату (KubeJS).')));
}

/** Вкладка «Наступні кроки за сейвом». @param {Store} s @param {any} an @param {() => void} onChange */
export function renderNextTab(s, an, onChange) {
  const qi = s.roadmap.quest_info || {};
  return h('div.ai-stack', null,
    // 1. Смуга прогресу за етапами
    h('div.card', null,
      h('h3', null, '📊 Прогрес за етапами розвитку'),
      h('div.ai-stages-bar', null, an.stageProgress.map((/** @type {any} */ sp) => {
        const pct = sp.total ? Math.round((sp.done / sp.total) * 100) : 0;
        const isCur = sp.stage.id === an.currentStage.id;
        return h(`a.ai-st-pill${isCur ? '.cur' : ''}${sp.done === sp.total && sp.total ? '.done' : ''}`, {
          href: `#/roadmap/${sp.stage.id}`,
          title: `${sp.stage.title}: ${sp.done}/${sp.total} віх (${pct}%)`,
        },
        h('div.small', null, `${sp.stage.icon} Е${sp.stage.n}`),
        h('b', null, `${sp.done}/${sp.total}`));
      }))),

    // 2. Головна віха стовбура
    an.nextTrunk.length ? h('div.card.ai-trunk-card', null,
      h('div.badges', null,
        h('span.badge', { style: { '--c': 'var(--accent)' } }, '⭐ Пріоритет 1 · Головний шлях (Стовбур)'),
        stageBadge(s, an.nextTrunk[0].node.stage)),
      h('h3', { style: { marginTop: '8px' } }, an.nextTrunk[0].node.title),
      h('p.small', null, an.nextTrunk[0].node.text),
      renderDoneByMini(s, an.nextTrunk[0].why, qi),
      h('div.ai-card-foot', null,
        h('a.btn.small.primary', { href: `#/roadmap?node=${an.nextTrunk[0].node.id}` }, 'Відкрити на карті →'),
        an.nextTrunk[0].node.chapter ? h('a.btn.small', { href: `#/chapter/${an.nextTrunk[0].node.chapter}` }, 'Глава квестів →') : null)) : null,

    // 3. Незавершені (розпочаті) квести у сейві
    an.startedQuests.length ? h('div.card', null,
      h('h3', null, `⏳ Розпочаті квести у сейві (${an.startedQuests.length})`),
      h('p.small.muted', null, 'Ці квести вже розпочаті у вашому світі — виконайте завдання, щоб закрити їх:'),
      h('div.ai-q-list', null, an.startedQuests.map((/** @type {any} */ sq) => h('div.ai-q-item', null,
        h('div.ai-q-head', null,
          h('a', { href: `#/chapter/${sq.chapter}/${sq.id}` }, h('b', null, `⏳ ${sq.title}`)),
          h('span.small.muted', null, sq.chapterTitle)),
        h('ul.list-clean.small', null, sq.tasks.map((/** @type {any} */ t) => h('li', { class: t.done ? 'db-done' : '' },
          `${t.done ? '✔' : '○'} ${t.text}`))))))) : null,

    // 4. Рекомендовані відкриті віхи зараз
    h('div.card', null,
      h('h3', null, `🧭 Відкриті віхи розвитку (${an.availNodes.length})`),
      h('p.small.muted', null, 'Усі попередні вимоги для цих віх уже виконані — обирайте напрямок за потребою:'),
      h('div.ai-avail-list', null, an.availNodes.slice(0, 10).map((/** @type {any} */ item) => {
        const n = item.node;
        return h('div.ai-avail-item', null,
          h('div.ai-avail-top', null,
            h('div.badges', null, stageBadge(s, n.stage), n.trunk ? h('span.badge', { style: { '--c': 'var(--accent)' } }, '⭐ Стовбур') : clsBadge(s, n.lane),
              item.unlocksCount ? h('span.badge.ghost', null, `відкриває +${item.unlocksCount}`) : null),
            h('label.check.small', null,
              h('input', { type: 'checkbox', checked: isDone(n.id), onchange: (e) => { setDone(n.id, e.target.checked); onChange(); } }),
              'Зроблено')),
          h('div.ai-avail-title', null,
            h('a', { href: `#/roadmap?node=${n.id}` }, h('b', null, n.title)),
            n.icons?.length ? h('span.ai-mini-icons', null, n.icons.slice(0, 3).map((/** @type {string} */ iid) => {
              const it = s.items[iid];
              return it ? h('img', { src: it.img, alt: '', title: it.uk || iid }) : null;
            })) : null),
          h('p.small.muted', { style: { margin: '4px 0' } }, n.text),
          renderDoneByMini(s, item.why, qi));
      }))),

    // 5. Персональні поради
    h('div.card', null,
      h('h3', null, '💡 Поради за вашим сейвом'),
      h('div.ai-tips-list', null, an.tips.map((/** @type {any} */ t) => h('div.ai-tip', null,
        h('div.ai-tip-h', null, `${t.icon} `, h('b', null, t.title)),
        h('p.small.muted', { style: { margin: '4px 0' } }, t.text),
        t.link ? h('a.small', { href: t.link }, t.linkText || 'Детальніше →') : null)))));
}

/** @param {Store} s @param {any} w @param {Record<string, any>} qi */
export function renderDoneByMini(s, w, qi) {
  if (!w) return null;
  const chips = [
    ...(w.quests || []).map((/** @type {any} */ q) => {
      const info = qi[q.id];
      return h('a.badge', {
        href: info ? `#/chapter/${info.chapter}/${q.id}` : '#/chapters',
        style: { '--c': q.done ? 'var(--ok)' : q.started ? 'var(--link)' : 'var(--muted)' },
      }, `${q.done ? '✔' : q.started ? '⏳' : '○'} Квест: ${info?.title || q.id}`);
    }),
    ...(w.items || []).map((/** @type {any} */ it) => {
      const meta = s.items[it.id];
      return h('span.badge', {
        style: { '--c': it.done ? 'var(--ok)' : 'var(--muted)' },
      }, `${it.done ? '✔' : '○'} Предмет: ${meta?.uk || meta?.en || it.id}`);
    }),
  ];
  return chips.length ? h('div.badges', { style: { marginTop: '6px' } }, ...chips) : null;
}

/** Вкладка «Інвентар і персонаж». @param {Store} s @param {any} an @param {any} liveState */
export function renderInvTab(s, an, liveState) {
  const p = an.world;
  const lvPlayer = liveState?.player;
  const curios = lvPlayer?.curios || [];
  const armor = lvPlayer?.armor || [];
  return h('div.ai-stack', null,
    h('div.card', null,
      h('h3', null, '🧙 Дані персонажа з NBT (<uuid>.dat)'),
      h('dl.kv.small', null,
        h('dt', null, 'Ім’я / UUID'), h('dd', null, `${lvPlayer?.name || p?.player?.name || '—'} (${lvPlayer?.uuid || p?.player?.uuid || '—'})`),
        h('dt', null, 'Здоров’я / Голод'), h('dd', null, `${lvPlayer?.health ?? 20} ❤ / ${lvPlayer?.foodLevel ?? 20} 🍖`),
        h('dt', null, 'Рівень досвіду'), h('dd', null, String(lvPlayer?.xpLevel ?? p?.player?.xp_level ?? 0)),
        h('dt', null, 'Вимір і координати'), h('dd', null, `${lvPlayer?.dimensionUk || an.dimUk} (${lvPlayer?.pos ? lvPlayer.pos.join(', ') : p?.player?.dimension || 'minecraft:overworld'})`),
        h('dt', null, 'Світовий рівень Apotheosis'), h('dd', null, an.worldTierUk),
        h('dt', null, 'Унікальних страв (Spice of Life)'), h('dd', null, String(p?.player?.unique_foods ?? 0)),
        h('dt', null, 'Забрано нагород квестів'), h('dd', null, String(p?.quests?.rewards_claimed ?? 0)))),
    (curios.length || armor.length) ? h('div.card', null,
      h('h3', null, `💍 Одягнено в слотах Curios та броні (${curios.length + armor.length})`),
      h('div.item-list', null, [...curios, ...armor].map((/** @type {any} */ it) => {
        const meta = s.items[it.id];
        return h('div.item-chip', { title: `${it.slot || 'Curios'}: ${it.id}` },
          meta ? h('img', { src: meta.img, alt: '', width: 24, height: 24 }) : h('span.nc-q', null, '💍'),
          h('span', null, `${it.uk || meta?.uk || it.id} (${it.slot || 'Curios'})`),
          h('b', { style: { color: 'var(--accent)' } }, `×${it.count || 1}`));
      }))) : null,
    h('div.card', null,
      h('h3', null, `🎒 Предмети в інвентарі (${an.invEntries.length})`),
      an.invEntries.length ? h('div.item-list', null, an.invEntries.map((/** @type {any} */ it) =>
        h('div.item-chip', { title: it.id },
          it.meta ? h('img', { src: it.meta.img, alt: '', width: 28, height: 28 }) : h('span.nc-q', null, '📦'),
          h('span', null, it.name),
          h('b', { style: { color: 'var(--accent)' } }, `×${it.count}`))))
        : h('p.small.muted', null, 'Інвентар порожній або даних немає.')),
    h('div.card', null,
      h('h3', null, `🔨 Скрафчені предмети зі статистики (${an.craftedEntries.length})`),
      an.craftedEntries.length ? h('div.item-list', null, an.craftedEntries.map((/** @type {any} */ it) =>
        h('div.item-chip', { title: it.id },
          it.meta ? h('img', { src: it.meta.img, alt: '', width: 24, height: 24 }) : null,
          h('span', null, it.name),
          h('span.muted', null, `×${it.count}`))))
        : h('p.small.muted', null, 'Ще немає записів крафту в статистиці.')));
}

/** Вкладка «Журнал і контекст». @param {Store} s @param {any} an @param {string} logTail @param {any} liveState */
export function renderLogTab(s, an, logTail, liveState) {
  const ctxText = buildPlayerContextPrompt(s, an, logTail);
  const copyBtn = h('button.btn.small', {
    onclick: () => {
      navigator.clipboard?.writeText(ctxText);
      copyBtn.textContent = '✔ Скопійовано в буфер!';
      setTimeout(() => { copyBtn.textContent = '📋 Скопіювати контекст гравця'; }, 2500);
    },
  }, '📋 Скопіювати контекст гравця');
  return h('div.ai-stack', null,
    liveState?.dictStats ? h('div.card', null,
      h('h3', null, '🇺🇦 Індексатор словника ATM11-UA та KubeJS-інтеграція'),
      h('p.small.muted', null,
        `Проіндексовано файлів uk_ua.json: ${liveState.dictStats.filesLoaded} · перекладених рядків та ID: ${liveState.dictStats.totalEntries}. ` +
        'У грі працюють швидкі чат-команди KubeJS (!що, !клавіші, !як <питання>) та оверлей Alt+Q.')) : null,
    h('div.card', null,
      h('div.mod-head', null,
        h('h3', null, '📋 Зведений контекст стану гравця (для LLM / промптів)'),
        copyBtn),
      h('pre.ai-pre', null, ctxText)),
    h('div.card', null,
      h('h3', null, '📜 Останні рядки minecraft/logs/latest.log'),
      logTail
        ? h('pre.ai-pre', null, logTail)
        : h('p.small.muted', null, 'Щоб побачити свіжий latest.log у браузері, запустіть ATM11-Companion або натисніть «📂 Вказати теку гри» вгорі.')));
}

/**
 * Налаштування підключення до моста ATM11-Companion (:8812). Ключі API — лише в .env компаньйона, не в браузері.
 * @param {any} st
 * @param {() => void} redraw
 * @param {(m: string, v?: string) => void} syncModelWithBridge
 * @param {() => void} reconnectBridge
 */
export function renderConfigBox(st, redraw, syncModelWithBridge, reconnectBridge) {
  const cfg = st.cfg;
  const upd = (/** @type {string} */ k, /** @type {any} */ v) => { cfg[k] = v; saveAssistantConfig(cfg); };
  return h('div.ai-cfg-box', null,
    h('div.small', { style: { marginBottom: '8px' } },
      h('b', null, '🔌 Міст ATM11-Companion (:8812) '),
      h('span.muted', null, '— запускається разом із компаньйоном; ключі API зберігаються лише в його .env')),
    h('div.ai-cfg-row.small', null,
      h('label', null, 'URL мосту: ', h('input', { type: 'text', value: cfg.bridgeUrl, oninput: (e) => upd('bridgeUrl', e.target.value) })),
      h('label', null, 'Текстова модель: ',
        h('select.wb-select', {
          onchange: (e) => syncModelWithBridge(e.target.value, cfg.visionModel),
        }, COMPANION_MODELS.map((m) => h('option', { value: m.id, selected: m.id === cfg.openaiModel }, m.label)))),
      h('label', null, 'Vision модель (F2): ',
        h('select.wb-select', {
          onchange: (e) => syncModelWithBridge(cfg.openaiModel, e.target.value),
        }, COMPANION_VISION_MODELS.map((m) => h('option', { value: m.id, selected: m.id === cfg.visionModel }, m.label)))),
      h('button.btn.small', {
        onclick: async () => {
          await reconnectBridge();
          redraw();
        },
      }, 'Перевірити міст'),
      st.bridgeInfo ? h('span.small', { style: { color: st.bridgeInfo.ok ? 'var(--ok)' : 'var(--bad)' } },
        st.bridgeInfo.ok ? `✔ Активний (${(st.bridgeInfo.providers || []).join(', ') || 'локальний'})` : `✕ Не запущено (${st.bridgeInfo.error})`) : h('span.small.muted', null, st.liveConnected ? '' : 'міст не знайдено')));
}

/**
 * Будує резервний радар «Інвентар + Curios → Гарячі клавіші» за статичним сейвом і keys.json,
 * коли живий міст ATM11-Companion ще не запущено.
 * @param {Store} s
 * @param {any} an
 */
export function buildStaticKeyRadar(s, an) {
  const binds = s.keys?.keybinds || [];
  const invIds = an.invEntries.map((/** @type {any} */ e) => e.id);
  const activeMods = new Set(invIds.map((/** @type {string} */ id) => id.split(':')[0]));
  const out = [];

  // Завжди показуємо ключові слоти рюкзака/Curios/квестів + моди з інвентарю
  const priorityActions = [
    { match: /backpack|ранець/i, slotLabel: 'Спина / Curios · Ранець', itemUk: 'Ранець (Sophisticated Backpacks)' },
    { match: /curios|аксесуар/i, slotLabel: 'Меню слотів Curios', itemUk: 'Слоти аксесуарів Curios' },
    { match: /quest|квест/i, slotLabel: 'Книга квестів FTB', itemUk: 'Квести FTB Quests' },
    { match: /belt|пояс/i, slotLabel: 'Пояс (Tool Belt)', itemUk: 'Пояс для інструментів' },
    { match: /vein|жила|ftbultimine/i, slotLabel: 'Копання жили', itemUk: 'FTB Ultimine (копання жили)' },
  ];

  for (const pa of priorityActions) {
    const kb = binds.find((/** @type {any} */ b) => pa.match.test(`${b.action_uk || ''} ${b.action_en || ''} ${b.id || ''} ${b.mod_id || ''}`));
    if (kb) {
      out.push({
        itemId: kb.mod_id || kb.id,
        itemUk: pa.itemUk,
        slotLabel: pa.slotLabel,
        modName: kb.mod_name || kb.mod_id || 'ATM11',
        actionUk: kb.action_uk || kb.action_en || kb.id,
        keyUk: kb.key_uk || kb.key || 'Не призначено',
        unbound: Boolean(kb.unbound),
        conflict: (kb.conflicts || []).length > 0,
        balmWarn: Boolean(kb.kuma_unsafe),
      });
    }
  }

  for (const e of an.invEntries.slice(0, 12)) {
    const modId = e.id.split(':')[0];
    if (modId === 'minecraft') continue;
    const modBinds = binds.filter((/** @type {any} */ b) => b.mod_id === modId || (b.id && b.id.toLowerCase().includes(modId)));
    if (modBinds.length) {
      const kb = modBinds[0];
      out.push({
        itemId: e.id,
        itemUk: e.name,
        slotLabel: `Інвентар ×${e.count}`,
        modName: kb.mod_name || modId,
        actionUk: kb.action_uk || kb.action_en || kb.id,
        keyUk: kb.key_uk || kb.key || 'Не призначено',
        unbound: Boolean(kb.unbound),
        conflict: (kb.conflicts || []).length > 0,
        balmWarn: Boolean(kb.kuma_unsafe),
      });
    }
  }
  return out;
}

export const PRESET_QUESTIONS = [
  ['🎯 Що робити далі за сейвом?', 'Що мені робити далі за моїм сейвом і які квести завершити?'],
  ['🎒 Де зберігати речі?', 'Де зберігати речі на старті: ранець, шухляди, скрині та мережі?'],
  ['⚡ Перша енергія FE', 'Як отримати першу енергію FE та які генератори краще ставити?'],
  ['🔩 Як зробити сталь?', 'Як зробити сталь і чому не крафтиться сталь MFFS або Oritech?'],
  ['⛏ Чому не крафтиться кар’єр?', 'Чому не крафтиться кар’єр QuarryPlus і Руйнівник чанків та чим копати руди?'],
  ['⭐ ATM Star у цій версії', 'Чому не крафтиться ATM Star у цій версії і які компоненти активні?'],
  ['⌨️ Важливі клавіші', 'Які гарячі клавіші призначені для ранця, квестів, Curios, пояса та терміналів?'],
];
