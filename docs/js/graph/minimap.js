// @ts-check
// Мінікарта в куті: смуги етапів, картки (колір класу / стан), рамка видимої області. Клік або перетягування — перейти.
import { h } from '../core/dom.js';

/**
 * @param {HTMLElement} host контейнер карти (position: relative)
 * @param {{w: number, h: number, bands: {y0: number, y1: number}[], nodes: () => {x: number, y: number, w: number, h: number, color: string, state: string}[]}} model
 * @param {{get: () => {x: number, y: number, k: number}, centerOn: (x: number, y: number) => void}} pz
 * @param {HTMLElement} viewport
 */
export function createMinimap(host, model, pz, viewport) {
  const W = 200, H = Math.max(80, Math.min(220, W * model.h / model.w)), sc = Math.min(W / model.w, H / model.h);
  const cv = /** @type {HTMLCanvasElement} */ (h('canvas', { width: W * 2, height: H * 2 }));
  const box = h('div.minimap.no-pan', { title: 'Мінікарта: клік — перейти' }, cv);
  host.append(box);
  const ctx = /** @type {CanvasRenderingContext2D} */ (cv.getContext('2d')); ctx.scale(2, 2);
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    model.bands.forEach((b, i) => { ctx.fillStyle = i % 2 ? 'rgba(255,255,255,.035)' : 'rgba(255,255,255,.07)'; ctx.fillRect(0, b.y0 * sc, W, (b.y1 - b.y0) * sc); });
    for (const n of model.nodes()) {
      ctx.globalAlpha = n.state === 'locked' ? 0.35 : 1; ctx.fillStyle = n.color;
      ctx.fillRect(n.x * sc, n.y * sc, Math.max(2, n.w * sc), Math.max(2, n.h * sc));
    }
    ctx.globalAlpha = 1;
    const t = pz.get(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 1.5;
    ctx.strokeRect(-t.x / t.k * sc, -t.y / t.k * sc, viewport.clientWidth / t.k * sc, viewport.clientHeight / t.k * sc);
  };
  let down = false;
  const go = (e) => { const r = cv.getBoundingClientRect(); pz.centerOn((e.clientX - r.left) / sc, (e.clientY - r.top) / sc); };
  cv.addEventListener('pointerdown', (e) => { down = true; cv.setPointerCapture(e.pointerId); go(e); });
  cv.addEventListener('pointermove', (e) => { if (down) go(e); });
  cv.addEventListener('pointerup', () => { down = false; });
  draw();
  return { draw };
}
