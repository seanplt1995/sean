// title.js — 极美, set in Noto Serif SC Black as a mask and painted with the knife (T00).
import { Ref } from '../../engine/plate.js';

// world centre (720, 1015); the plate is the word's box only, placed at (220, 755)
export const TITLE = { cx: 720, cy: 1015, size: 400, x0: 220, y0: 755 };
export function plateTitle() {
  const W = 1000, H = 520, ref = new Ref(W, H), cx = TITLE.cx - TITLE.x0, cy = TITLE.cy - TITLE.y0;
  const g = { lin: [cx - 400, cy - 200, cx + 400, cy + 200], stops: [[0, '#8f4526'], [0.5, '#9A4E2A'], [1, '#a65a2c']] };
  ref.text('极美', cx, cy, `900 ${TITLE.size}px "Noto Serif SC"`, g, { baseline: 'middle', group: 'title', maxR: 16, dir: Math.PI / 2 - 0.25, c2: '#C08A3E', run: 0.12, hgt: 1.15, jit: 0.05 });
  return { ref, w: W, h: H, R: [16, 11, 7, 4.5, 3] };
}
