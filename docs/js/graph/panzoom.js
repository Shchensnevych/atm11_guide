// @ts-check
// Масштаб і рух полотна: колесо — масштаб довкола курсора, перетягування — рух (і по картках: клік спрацьовує лише без руху), дотик — один палець рух, два — масштаб.
// stage масштабується CSS transform (origin 0 0). onChange викликається після кожної зміни (мінікарта, jsPlumb.setZoom, збереження стану).

/**
 * @param {HTMLElement} viewport видима область (overflow: hidden)
 * @param {HTMLElement} stage полотно всередині
 * @param {{min?: number, max?: number, onChange?: (t: {x: number, y: number, k: number}) => void}} [o]
 */
export function createPanZoom(viewport, stage, o = {}) {
  const min = o.min ?? 0.15, max = o.max ?? 2.5;
  let x = 0, y = 0, k = 1;
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const apply = () => { stage.style.transform = `translate(${x}px, ${y}px) scale(${k})`; o.onChange?.({ x, y, k }); };
  /** @param {number} px @param {number} py @param {number} f */
  const zoomAt = (px, py, f) => { const nk = clamp(k * f); x = px - (px - x) * nk / k; y = py - (py - y) * nk / k; k = nk; apply(); };
  viewport.addEventListener('wheel', (e) => {
    e.preventDefault(); const r = viewport.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
  }, { passive: false });
  let drag = null, moved = false;
  /** дотики для масштабу двома пальцями @type {Map<number, {x: number, y: number}>} */
  const touches = new Map(); let pinch = 0;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || /** @type {HTMLElement} */ (e.target).closest('.no-pan')) return;
    if (e.pointerType === 'touch') touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); drag = null; moved = true; return; }
    drag = { sx: e.clientX, sy: e.clientY, x, y, id: e.pointerId }; moved = false;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2 && pinch) {
      const [a, b] = [...touches.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); const r = viewport.getBoundingClientRect();
      zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / pinch); pinch = d; return;
    }
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
    if (!moved && Math.hypot(dx, dy) < 5) return;
    if (!moved) { moved = true; viewport.setPointerCapture(e.pointerId); viewport.classList.add('panning'); }
    x = drag.x + dx; y = drag.y + dy; apply();
  });
  const end = (e) => { touches.delete(e.pointerId); if (touches.size < 2) pinch = 0; drag = null; viewport.classList.remove('panning'); };
  viewport.addEventListener('pointerup', end); viewport.addEventListener('pointercancel', end);
  viewport.addEventListener('click', (e) => { if (moved) { e.stopImmediatePropagation(); e.preventDefault(); moved = false; } }, true);   // після перетягування — не клік
  return {
    get: () => ({ x, y, k }),
    /** Встановити точну трансформацію полотна. @param {number} nx @param {number} ny @param {number} nk */
    set(nx, ny, nk) { k = clamp(nk); x = nx; y = ny; apply(); },
    /** @param {number} f */
    zoomBy: (f) => zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, f),
    /** Уся карта у вікні. @param {number} w @param {number} hgt @param {number} [pad] */
    fit(w, hgt, pad = 24) {
      k = clamp(Math.min((viewport.clientWidth - 2 * pad) / w, (viewport.clientHeight - 2 * pad) / hgt));
      x = (viewport.clientWidth - w * k) / 2; y = Math.max(pad, (viewport.clientHeight - hgt * k) / 2); apply();
    },
    /** Прямокутник полотна — у вікно (не ближче за maxK). @param {number} bx @param {number} by @param {number} w @param {number} hgt @param {number} [pad] @param {number} [maxK] */
    fitBox(bx, by, w, hgt, pad = 40, maxK = 1.1) {
      k = clamp(Math.min(maxK, (viewport.clientWidth - 2 * pad) / w, (viewport.clientHeight - 2 * pad) / hgt));
      x = (viewport.clientWidth - w * k) / 2 - bx * k; y = (viewport.clientHeight - hgt * k) / 2 - by * k; apply();
    },
    /** Точку полотна — в центр вікна (або вгору: top). @param {number} cx @param {number} cy @param {number} [nk] @param {number} [top] */
    centerOn(cx, cy, nk = k, top) {
      k = clamp(nk); x = viewport.clientWidth / 2 - cx * k; y = top != null ? top - cy * k : viewport.clientHeight / 2 - cy * k; apply();
    },
  };
}
