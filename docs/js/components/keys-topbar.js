// @ts-check
// Допоміжні елементи вкладки #/keys: завантаження options.txt у верхній панелі та підготовка виносок зони.
import { h, mount } from '../core/dom.js';
import { parseOptions, saveUserOptions } from '../core/keys-model.js';
import { resetToBuiltProgress } from '../core/store.js';
import { modName } from './keys-list.js';

/** Підключення завантаження options.txt у world-bar поряд із текою гри та темою. @param {any} kd */
export function setupTopbarOptions(kd) {
  const wb = document.getElementById('world-bar');
  if (!wb) return;
  let slot = document.getElementById('wb-keys-slot');
  if (!slot) {
    slot = h('div#wb-keys-slot');
    wb.append(slot);
  }
  const inp = h('input', {
    type: 'file',
    accept: '.txt,text/plain',
    hidden: true,
    onchange: async (/** @type {Event} */ e) => {
      const f = /** @type {HTMLInputElement} */ (e.target).files?.[0];
      if (!f) return;
      const binds = parseOptions(await f.text());
      if (!Object.keys(binds).length) {
        alertBox('У файлі немає рядків key_… — це точно options.txt з теки minecraft?');
        return;
      }
      saveUserOptions({ name: f.name, date: new Date().toLocaleString('uk-UA'), binds });
      location.reload();
    },
  });
  mount(slot,
    kd.user ? h('span.badge', { style: { '--c': 'var(--accent)' }, title: `Завантажено: ${kd.user.name} (${kd.user.date})` }, `📄 ${kd.user.name}`) : null,
    kd.user ? h('button.wb-btn', { onclick: async () => { await resetToBuiltProgress(); saveUserOptions(null); location.reload(); }, title: 'Скинути options.txt до збірки' }, '↺ Збірка') : null,
    h('button.wb-btn', { onclick: () => inp.click(), title: 'Завантажити файл minecraft/options.txt без Python' }, h('span.btn-ic', null, '📄'), ' options.txt'),
    inp,
  );
  const cleanup = () => {
    if (location.hash.split('?')[0] !== '#/keys') {
      document.getElementById('wb-keys-slot')?.remove();
      window.removeEventListener('hashchange', cleanup);
    }
  };
  window.addEventListener('hashchange', cleanup);
}

/** @param {string} t */
function alertBox(t) {
  const d = h('div.kalert', { onclick: () => d.remove() }, t, ' (клік — закрити)');
  document.body.append(d);
  setTimeout(() => d.remove(), 6000);
}

/**
 * Формує відфільтрований список виносок (до 8 зверху, до 6 знизу, до 2 на миші) для обраної зони дій.
 * @param {Store} s
 * @param {Map<string, any>} by
 * @param {string} layer
 * @param {string} cat
 */
export function buildZoneCallouts(s, by, layer, cat) {
  if (!cat || innerWidth < 1100) return [];
  const catBinds = [...by.entries()].filter(([c, v]) => c.split('|')[0] === layer && v.acts.some((/** @type {KeyAct} */ a) => a.cat === cat));

  // Групуємо повторювані цифрові слоти хотбару 1-9 в одну компактну виноску
  const hasSlots = catBinds.some(([c]) => /^key\.keyboard\.[1-9]$/.test(c.split('|')[1]));
  const filtered = catBinds.filter(([c]) => {
    const b = c.split('|')[1];
    return !(hasSlots && /^key\.keyboard\.[2-9]$/.test(b));
  });

  const rawItems = filtered.map(([c, v]) => {
    const b = c.split('|')[1];
    const acts = v.acts.filter((/** @type {KeyAct} */ a) => a.cat === cat);
    if (hasSlots && b === 'key.keyboard.1') {
      return { bind: b, text: 'Слоти хотбару 1–9', sub: 'Minecraft швидкий доступ', cls: '' };
    }
    return {
      bind: b,
      text: acts[0].name,
      sub: acts.length > 1 ? `+ ${acts.slice(1).map((/** @type {KeyAct} */ a) => a.name).join(' · ')}` : modName(s, acts[0]),
      cls: v.lvl === 2 ? 'lv2' : v.lvl === 1 ? 'lv1' : '',
    };
  });

  // Для миші залишаємо не більше 2 ключових дій, щоб не створювати скупчення праворуч
  let mouseCount = 0;
  const cleanItems = rawItems.filter((it) => {
    if (it.bind.startsWith('key.mouse.')) {
      mouseCount++;
      return mouseCount <= 2;
    }
    return true;
  });

  const isTopKey = (/** @type {string} */ b) => {
    if (b.startsWith('key.mouse.')) return false;
    return /^key\.keyboard\.(f\d+|escape|grave|[0-9]|minus|equals|backspace|tab|q|w|e|r|t|y|u|i|o|p|bracket)/.test(b);
  };
  const topList = cleanItems.filter((it) => isTopKey(it.bind)).slice(0, 8);
  const botList = cleanItems.filter((it) => !isTopKey(it.bind)).slice(0, 6);
  return [...topList, ...botList];
}

