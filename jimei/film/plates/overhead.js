// overhead.js — P8: the wheat field from above (night / gold), seen by the turning, rising camera of S15 and S21–S23.
import { Ref } from '../../engine/plate.js';
import { KNIFE, DAB, LINE, hex, mixc } from '../../engine/impasto.js';
import { css, mixh, lerp2, ellipsePts, blob } from './common.js';

// ── P8: the field from above (2400²); a clearing in the centre where the paths meet ──
export const OVER = { c: [1300, 1300], tree: [1960, 820] };
export function plateOver(variant = 'gold') {
  const night = variant === 'night', W = 2600, H = 2600, ref = new Ref(W, H), [cx, cy] = OVER.c;
  const base = night ? ['#2a3a6a', '#3a4a7a', '#4a5a8a', '#A8B3C2'] : ['#c99a3e', '#d6aa48', '#b7862f', '#e8c868'];
  const earth = night ? '#26325c' : '#b98a4a';
  // wheat as a swirled plane: strokes follow the wind's curl around the clearing
  const swirl = (x, y) => Math.atan2(y - cy, x - cx) + Math.PI / 2 + 0.35 + 0.25 * Math.sin(x * 0.003 + y * 0.002);
  ref.fill({ rect: [0, 0, W, H] }, { rad: [cx, cy, 100, cx, cy, 1700], stops: [[0, base[1]], [0.5, base[0]], [1, base[2]]] }, { dir: swirl, maxR: 40, group: 'wheat', jit: 0.07, hgt: 1.05 });
  // lighter bands of wind-pressed wheat
  for (let k = 0; k < 7; k++) {
    const r0 = 380 + k * 230, a0 = k * 0.9;
    const pts = [];
    for (let i = 0; i <= 30; i++) { const a = a0 + i * 0.07; pts.push([cx + Math.cos(a) * (r0 + i * 6), cy + Math.sin(a) * (r0 + i * 6)]); }
    for (let i = 30; i >= 0; i--) { const a = a0 + i * 0.07; pts.push([cx + Math.cos(a) * (r0 + 60 + i * 6), cy + Math.sin(a) * (r0 + 60 + i * 6)]); }
    ref.fill(pts, mixh(base[3], base[0], night ? 0.6 : 0.55), { dir: swirl, maxR: 16, group: 'band' + k, jit: 0.06 });
  }
  // two crossing earth paths and the clearing
  ref.line([[0, 1840], [980, 1490], [cx, cy], [1840, 980], [W, 560]], 30, earth, { area: true, group: 'path', dir: 0.3, maxR: 14 });
  ref.line([[760, 0], [1080, 760], [cx, cy], [1460, 1950], [1620, H]], 24, earth, { area: true, group: 'path', dir: 1.2, maxR: 12 });
  ref.fill({ circle: [cx, cy, 130] }, { rad: [cx, cy, 20, cx, cy, 130], stops: [[0, night ? '#3e4c80' : '#d4a050'], [1, night ? '#33407a' : '#c08a48']] }, { dir: swirl, maxR: 16, group: 'clearing' });
  // the lone tree from above: a round crown and its long shadow
  const [tx, ty] = OVER.tree;
  ref.fill(ellipsePts(tx + 120, ty + 70, 190, 70, 26, 0.5, 0.15, 3), night ? '#18214a' : '#8a6a2a', { dir: 0.5, maxR: 16, group: 'treeshadow' });
  ref.fill(ellipsePts(tx, ty, 130, 120, 26, 0, 0.18, 4), night ? '#1a2a4a' : '#3f7a5a', { dir: 0.8, maxR: 14, group: 'tree', type: DAB });
  ref.fill(ellipsePts(tx - 30, ty - 30, 70, 60, 20, 0, 0.2, 5), night ? '#3a4a70' : '#7aa65a', { dir: 0.8, maxR: 10, group: 'tree', type: DAB });
  // seen through a 1.0–1.6× camera, so the knife marks start a third smaller than the ground-level plates
  return { ref, w: W, h: H, R: [32, 20, 12, 8, 5, 3] };
}
