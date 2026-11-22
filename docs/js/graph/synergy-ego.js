// @ts-check
// Мапа синергій (K36, Варіант B) — «мод у центрі»: адаптивна CSS-сітка зі sticky-центром та живими SVG-кривими Безьє.
// Без transform: scale() (шрифт завжди чіткий 1:1), без «чорної діри» у великих модів, без дублювання ID для pair_ok.
const NS = 'http://www.w3.org/2000/svg';

/**
 * Підключає живий SVG-шар кривих між центральною карткою мода і видимими картками партнерів.
 * Автоматично перемальовує лінії при зміні розміру вікна, розгортанні тексту/джерела та скролі sticky-центру.
 * @param {HTMLElement} ego контейнер .syn-ego (position: relative)
 * @param {HTMLElement} center центральна картка .syn-card.center
 * @returns {{ redraw: () => void, destroy: () => void }}
 */
export function mountEgoLines(ego, center) {
  let svg = /** @type {SVGSVGElement | null} */ (ego.querySelector('svg.syn-lines'));
  if (!svg) {
    svg = /** @type {SVGSVGElement} */ (document.createElementNS(NS, 'svg'));
    svg.setAttribute('class', 'syn-lines');
    svg.setAttribute('aria-hidden', 'true');
    ego.prepend(svg);
  }

  let raf = 0;
  /** @type {string} */
  let hlKey = '';

  const draw = () => {
    raf = 0;
    if (!ego.isConnected || !svg) { destroy(); return; }
    // На вузькому екрані (стек) лінії не малюємо
    if (window.matchMedia('(max-width: 1180px)').matches) {
      svg.replaceChildren();
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      return;
    }
    const er = ego.getBoundingClientRect();
    const cr = center.getBoundingClientRect();
    const w = Math.ceil(ego.scrollWidth);
    const h = Math.ceil(ego.scrollHeight);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const cxLeft = cr.left - er.left;
    const cxRight = cr.right - er.left;
    const cTop = cr.top - er.top;
    const cH = Math.max(40, cr.height);
    const cMidX = (cxLeft + cxRight) / 2;

    /** @type {{ el: HTMLElement, r: DOMRect, key: string, color: string }[]} */
    const leftCards = [];
    /** @type {{ el: HTMLElement, r: DOMRect, key: string, color: string }[]} */
    const rightCards = [];
    for (const node of ego.querySelectorAll('.syn-card.partner:not([hidden])')) {
      const card = /** @type {HTMLElement} */ (node);
      const r = card.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const item = { el: card, r, key: card.dataset.synKey || '', color: card.style.getPropertyValue('--c') || 'var(--line-2)' };
      if ((r.left + r.right) / 2 - er.left < cMidX) leftCards.push(item);
      else rightCards.push(item);
    }

    const frag = document.createDocumentFragment();
    const drawSide = (/** @type {typeof leftCards} */ arr, /** @type {'L'|'R'} */ side) => {
      const n = arr.length;
      arr.forEach((item, i) => {
        const px = side === 'L' ? item.r.right - er.left : item.r.left - er.left;
        const py = item.r.top - er.top + item.r.height / 2;
        const t = n === 1 ? 0.5 : 0.16 + (0.68 * i) / (n - 1);
        const tx = side === 'L' ? cxLeft : cxRight;
        const ty = cTop + cH * t;
        const bend = Math.max(28, Math.abs(tx - px) * 0.48);
        const c1x = side === 'L' ? px + bend : px - bend;
        const c2x = side === 'L' ? tx - bend : tx + bend;

        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', `M${px.toFixed(1)},${py.toFixed(1)} C${c1x.toFixed(1)},${py.toFixed(1)} ${c2x.toFixed(1)},${ty.toFixed(1)} ${tx.toFixed(1)},${ty.toFixed(1)}`);
        path.setAttribute('class', `syn-edge${hlKey === item.key ? ' hl' : ''}`);
        path.setAttribute('data-for', item.key);
        path.style.setProperty('--c', item.color);
        frag.append(path);

        const dot = document.createElementNS(NS, 'circle');
        dot.setAttribute('cx', px.toFixed(1));
        dot.setAttribute('cy', py.toFixed(1));
        dot.setAttribute('r', hlKey === item.key ? '4' : '3');
        dot.setAttribute('class', `syn-dot${hlKey === item.key ? ' hl' : ''}`);
        dot.setAttribute('data-for', item.key);
        dot.style.setProperty('--c', item.color);
        frag.append(dot);
      });
    };

    drawSide(leftCards, 'L');
    drawSide(rightCards, 'R');
    svg.replaceChildren(frag);
  };

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(draw);
  };

  /** @param {string} key */
  const setHover = (key) => {
    hlKey = key;
    if (!svg) return;
    svg.classList.toggle('has-hl', Boolean(key));
    svg.querySelectorAll('.syn-edge, .syn-dot').forEach((n) => {
      const on = n.getAttribute('data-for') === key;
      n.classList.toggle('hl', on);
      if (n.tagName === 'circle') n.setAttribute('r', on ? '4.5' : '3');
    });
  };

  const onEnter = (/** @type {Event} */ ev) => {
    const card = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (ev.target)?.closest?.('.syn-card.partner'));
    if (card?.dataset.synKey) setHover(card.dataset.synKey);
  };
  const onLeave = (/** @type {Event} */ ev) => {
    const card = /** @type {HTMLElement | null} */ (/** @type {HTMLElement} */ (ev.target)?.closest?.('.syn-card.partner'));
    if (card?.dataset.synKey === hlKey) setHover('');
  };

  ego.addEventListener('pointerover', onEnter);
  ego.addEventListener('pointerout', onLeave);

  const ro = new ResizeObserver(schedule);
  ro.observe(ego);
  ro.observe(center);
  ego.querySelectorAll('.syn-card.partner').forEach((c) => ro.observe(c));

  const onScroll = () => schedule();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  const destroy = () => {
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    ego.removeEventListener('pointerover', onEnter);
    ego.removeEventListener('pointerout', onLeave);
  };

  schedule();
  return { redraw: schedule, destroy };
}
