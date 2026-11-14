// @ts-check
// components/row-menu.js — меню рядка «⋯» на сайті (K14, «Мої сховища» на #/assistant): плаваюче, під кнопкою; закривається
// кліком поза ним, Esc, прокруткою чи зміною розміру вікна. Перейменування — полем вводу на місці назви (Enter / вихід з поля
// — зберегти, Esc — скасувати). Те саме, що row-menu.js компаньйона (вікна Electron), але DOM — лише h() / textContent
// (SECURITY §4: сайт не пише innerHTML); пункти дає той, хто малює рядки.
import { h } from '../core/dom.js';

/** @typedef {{ id: string, label: string, icon?: string, kind?: 'go' | 'danger', hint?: string } | { sep: true }} RowMenuItem */

/** @type {{ el: HTMLElement, btn: HTMLElement } | null} */
let open = null;

export function closeRowMenu() {
  if (!open) return;
  open.el.remove();
  open.btn.classList.remove('open');
  open = null;
}

/**
 * Відкрити меню під кнопкою (повторне натискання тієї самої кнопки — закрити).
 * @param {HTMLElement} btn
 * @param {RowMenuItem[]} items
 * @param {(id: string) => void} onPick
 */
export function openRowMenu(btn, items, onPick) {
  const same = open && open.btn === btn;
  closeRowMenu();
  if (same || !items.length) return;
  const el = h('div.so-pop', { role: 'menu' }, items.map((it) => ('sep' in it
    ? h('div.so-pop-sep', { role: 'separator' })
    : h(`button.so-pop-item${it.kind ? `.${it.kind}` : ''}`, {
      type: 'button',
      role: 'menuitem',
      onclick: (/** @type {Event} */ ev) => { ev.stopPropagation(); closeRowMenu(); onPick(it.id); },
    }, h('span.so-pop-ic', null, it.icon || ''), it.label, it.hint ? h('span.so-pop-hint', null, it.hint) : null))));
  document.body.append(el);
  // під кнопкою, праворуч по її краю; не виходить за вікно (знизу — тоді над кнопкою)
  const r = btn.getBoundingClientRect();
  const w = el.offsetWidth; const ht = el.offsetHeight;
  const left = Math.max(4, Math.min(window.innerWidth - w - 4, r.right - w));
  const top = r.bottom + 4 + ht > window.innerHeight - 4 ? Math.max(4, r.top - 4 - ht) : r.bottom + 4;
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
  btn.classList.add('open');
  open = { el, btn };
}

/**
 * Редагування назви на місці. @returns {boolean} false — уже редагується
 * @param {HTMLElement | null} nameEl @param {string} current @param {(v: string) => void} onSave
 */
export function renameInPlace(nameEl, current, onSave, maxLength = 40) {
  if (!nameEl || nameEl.querySelector('input')) return false;
  const input = /** @type {HTMLInputElement} */ (h('input.so-input', { type: 'text', maxLength }));
  input.value = current || '';
  nameEl.replaceChildren(input);
  input.focus();
  input.select();
  let done = false;
  /** @param {boolean} save */
  const finish = (save) => {
    if (done) return;
    done = true;
    const v = input.value.trim();
    nameEl.textContent = current || '';
    if (save && v && v !== current) onSave(v);
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    e.stopPropagation();
  });
  input.addEventListener('blur', () => finish(true));
  input.addEventListener('click', (e) => e.stopPropagation());
  return true;
}

/** Чи йде редагування в контейнері (тоді рядки не перемальовуються — інакше поле вводу зникне). @param {HTMLElement | null} el */
export const isEditing = (el) => Boolean(el && el.querySelector('input.so-input'));

document.addEventListener('click', (e) => { if (open && !open.el.contains(/** @type {Node} */ (e.target))) closeRowMenu(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRowMenu(); });
window.addEventListener('resize', closeRowMenu);
document.addEventListener('scroll', closeRowMenu, true);
