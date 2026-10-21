// window.js — P4: from the puddle by the bench up the wall to the window with the oil lamp (S05).
// Tall plate (1440×3400); the camera tilts from the puddle (bottom) to the window (top).
import { Ref } from '../../engine/plate.js';
import { DAB, KNIFE, hex, mixc } from '../../engine/impasto.js';
import { ellipsePts } from './common.js';

export function plateWindow() {
  const W = 1440, H = 3400, ref = new Ref(W, H);
  const base = 2520;                         // wall meets the ground
  const win = { x0: 470, x1: 970, y0: 700, y1: 1260 };   // window opening
  const lamp = [700, 1238];                  // lamp on the inner sill (foot)
  // wall: old plaster over brick, moonlit blue-grey; calm above the window (caption band)
  ref.fill({ rect: [0, 0, W, base] }, { lin: [0, 0, 0, base], stops: [[0, '#4a5574'], [0.5, '#56617f'], [1, '#434d6a']] }, { dir: Math.PI / 2 - 0.08, maxR: 46, group: 'wall', jit: 0.05 });
  // patches where the plaster fell off: bricks
  for (const [px, py, pw, ph, s] of [[140, 1700, 260, 200, 1], [1060, 520, 220, 160, 2], [1100, 2000, 240, 180, 3], [200, 360, 180, 130, 4]]) {
    ref.fill(ellipsePts(px + pw / 2, py + ph / 2, pw / 2, ph / 2, 22, 0.1, 0.25, s), '#5e5a66', { dir: 0, maxR: 10, group: 'brick' + s });
    for (let r = 0; r < ph / 26; r++) ref.line([[px + 20, py + 14 + r * 26], [px + pw - 20, py + 14 + r * 26]], 2, '#3e3b46', { step: 9 });
  }
  // drainpipe
  ref.fill({ rect: [1240, 0, 34, base] }, { lin: [1240, 0, 1274, 0], stops: [[0, '#2c3248'], [0.5, '#56607e'], [1, '#262b3e']] }, { dir: Math.PI / 2, maxR: 8, edge: 3, run: 0, group: 'pipe' });
  for (let y = 300; y < base; y += 420) ref.fill({ rect: [1230, y, 54, 16] }, '#1f2436', { maxR: 4, group: 'pipe' });
  // cornice and the lintel above the window
  ref.fill({ rect: [0, 230, W, 36] }, '#6c7898', { dir: 0, maxR: 10 });
  ref.fill({ rect: [win.x0 - 60, win.y0 - 70, win.x1 - win.x0 + 120, 54] }, '#6a7594', { dir: 0, maxR: 10, edge: 3 });
  // window: dark frame, warm room behind, curtains, glass
  ref.fill({ rect: [win.x0 - 34, win.y0 - 20, win.x1 - win.x0 + 68, win.y1 - win.y0 + 40] }, '#2a2420', { maxR: 8, edge: 3, run: 0, group: 'frame' });
  ref.fill({ rect: [win.x0, win.y0, win.x1 - win.x0, win.y1 - win.y0] }, { rad: [lamp[0], lamp[1] - 80, 30, lamp[0], lamp[1] - 80, 520], stops: [[0, '#f3b25a'], [0.35, '#c8783a'], [1, '#5a3a2a']] }, { dir: Math.PI / 2, maxR: 18, group: 'room', gmul: 0 });
  // curtains drawn to the sides
  ref.fill([[win.x0, win.y0], [win.x0 + 120, win.y0], [win.x0 + 70, win.y0 + 280], [win.x0 + 96, win.y1], [win.x0, win.y1]], { lin: [win.x0, 0, win.x0 + 120, 0], stops: [[0, '#6e2f24'], [1, '#a64a34']] }, { dir: Math.PI / 2, maxR: 12, group: 'curtL' });
  ref.fill([[win.x1, win.y0], [win.x1 - 120, win.y0], [win.x1 - 70, win.y0 + 280], [win.x1 - 96, win.y1], [win.x1, win.y1]], { lin: [win.x1, 0, win.x1 - 120, 0], stops: [[0, '#6e2f24'], [1, '#a64a34']] }, { dir: Math.PI / 2, maxR: 12, group: 'curtR' });
  // open casements (glass panes catching the lamp)
  ref.fill([[win.x0 - 26, win.y0 + 10], [win.x0 + 40, win.y0 + 40], [win.x0 + 40, win.y1 - 30], [win.x0 - 26, win.y1 - 10]], 'rgba(120,96,70,1)', { maxR: 8, edge: 2, group: 'paneL' });
  ref.fill([[win.x1 + 26, win.y0 + 10], [win.x1 - 40, win.y0 + 40], [win.x1 - 40, win.y1 - 30], [win.x1 + 26, win.y1 - 10]], 'rgba(120,96,70,1)', { maxR: 8, edge: 2, group: 'paneR' });
  ref.line([[win.x0 + 7, win.y0 + 25], [win.x0 + 7, win.y1 - 20]], 5, '#2a2420', { area: true, group: 'frame' });
  ref.line([[win.x1 - 7, win.y0 + 25], [win.x1 - 7, win.y1 - 20]], 5, '#2a2420', { area: true, group: 'frame' });
  // sill
  ref.fill([[win.x0 - 70, win.y1 + 14], [win.x1 + 70, win.y1 + 14], [win.x1 + 90, win.y1 + 58], [win.x0 - 90, win.y1 + 58]], '#7d88a6', { dir: 0, maxR: 10, edge: 3, group: 'sill' });
  ref.fill({ rect: [win.x0 - 90, win.y1 + 58, win.x1 - win.x0 + 180, 22] }, '#353c56', { dir: 0, maxR: 6, group: 'sill2' });
  // ground: wet cobbles and the puddle with the window's reflection
  ref.fill([[0, base], [W, base], [W, H], [0, H]], { lin: [0, base, 0, H], stops: [[0, '#2f3858'], [1, '#262e4a']] }, { dir: 0, maxR: (x, y) => 10 + 34 * Math.min(1, (y - base) / 800), group: 'ground' });
  ref.fill({ rect: [0, base - 18, W, 22] }, '#2a3150', { dir: 0, maxR: 6 });
  for (let k = 1; k < 9; k++) { const y = base + (H - base) * Math.pow(k / 9, 1.5); ref.line([[0, y], [W, y + 5 * Math.sin(k)]], 2 + 3 * k / 9, '#232a45', { step: 16, type: KNIFE, run: 0.6 }); }
  const pud = [740, 3000, 420, 110];
  ref.fill(ellipsePts(pud[0], pud[1], pud[2], pud[3], 34, 0, 0.12, 2), { lin: [0, pud[1] - pud[3], 0, pud[1] + pud[3]], stops: [[0, '#3e4c78'], [1, '#2c3760']] }, { dir: 0, maxR: 18, edge: 3, wet: 1, group: 'puddle' });
  // the reflection: the window flipped and broken into short horizontal dabs (warm, always in colour)
  for (let k = 0; k < 16; k++) {
    const y = pud[1] - pud[3] * 0.6 + k * 11, w = (380 - k * 10) * (0.8 + 0.2 * Math.sin(k * 1.7)), warm = k < 12;
    ref.extra.push({ x: pud[0] - 20 + Math.sin(k * 2.3) * 14, y, ang: 0.01, len: w * (k % 3 === 1 ? 0.6 : 1), wid: 9, c: warm ? mixc(hex('#F0A04B'), hex('#3e4c78'), 0.15 + k * 0.04) : hex('#a64a34'),
      type: DAB, gmul: 0, alpha: 0.85 - k * 0.04, seed: 3500 + k, hgt: 0.4, wet: 1, run: 0.5 });
  }
  // the end of the bench at the left edge (where S04 left us)
  ref.fill([[0, 2790], [150, 2790], [150, 2830], [0, 2830]], '#5a4a3c', { dir: 0, maxR: 8, edge: 2, group: 'bench' });
  ref.fill([[118, 2830], [136, 2830], [136, 3080], [118, 3080]], '#1c1d26', { maxR: 5, edge: 2, group: 'bench' });
  return { ref, w: W, h: H, win, lamp, pud, base, R: [50, 32, 20, 12, 7, 4] };
}
