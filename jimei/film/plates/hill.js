// hill.js — P9: the hilltop in the wind (S16–S18). Shown grey / pale, so the colour version only has to
// carry a strong value plan: bright broken sky, dark crest, wet mud at the feet, a rock for the crow.
import { Ref } from '../../engine/plate.js';
import { DAB, KNIFE, hex } from '../../engine/impasto.js';
import { ellipsePts, blob } from './common.js';

export const HILL = { feet: [700, 1700], h: 560, rock: [905, 1712], crest: 1600 };

export function plateHill() {
  const W = 1440, H = 2560, ref = new Ref(W, H);
  // sky: wind-driven bands, light breaking low on the right (caption band stays a plain plane)
  ref.fill({ rect: [0, 0, W, 1700] }, { lin: [0, 0, 0, 1700], stops: [[0, '#4a5670'], [0.35, '#7d8aa0'], [0.7, '#b9bfc8'], [1, '#d8d6cf']] }, { dir: -0.12, maxR: 54, group: 'sky', jit: 0.05, hgt: 0.85 });
  for (const [cx, cy, rx, ry, s] of [[300, 150, 380, 50, 1], [1150, 250, 330, 44, 2], [1200, 1060, 300, 40, 3], [250, 1180, 260, 34, 4], [760, 1360, 420, 30, 5]]) {
    ref.fill(ellipsePts(cx, cy, rx, ry, 30, -0.12, 0.25, s), '#5d677c', { dir: -0.12, maxR: 22, group: 'cloud' + s });
    ref.fill(ellipsePts(cx + rx * 0.1, cy - ry * 0.4, rx * 0.6, ry * 0.35, 22, -0.12, 0.25, s + 7), '#c8ccd2', { dir: -0.12, maxR: 10, group: 'cloud' + s });
  }
  // the valley below, far hills in layers
  ref.fill([[0, 1560], [300, 1520], [620, 1560], [1000, 1500], [1440, 1540], [1440, 1760], [0, 1760]], '#7a8290', { dir: -0.05, maxR: 16, group: 'far1' });
  ref.fill([[0, 1640], [420, 1610], [900, 1650], [1440, 1620], [1440, 1800], [0, 1800]], '#5d6572', { dir: -0.05, maxR: 16, group: 'far2' });
  // the crest: grass combed by the wind, darker toward us
  const crest = [[0, 1730], [240, 1690], [520, 1668], [760, 1660], [1000, 1666], [1260, 1690], [1440, 1716], [1440, H], [0, H]];
  ref.fill(crest, { lin: [0, 1660, 0, H], stops: [[0, '#5a6048'], [0.25, '#3f4536'], [1, '#2a2e26']] }, { dir: -0.35, maxR: (x, y) => 8 + 34 * Math.min(1, (y - 1660) / 800), group: 'grass', hgt: 1.1 });
  for (let k = 0; k < 120; k++) {   // blades bent to the right
    const x = (k * 97.3) % 1440, y = 1700 + ((k * 61.7) % 1) * 820 + ((k * 0.37) % 1) * 40;
    const sz = 18 + 50 * (y - 1660) / 900;
    ref.extra.push({ x, y, ang: -Math.PI / 2 + 0.55, len: sz * 1.8, wid: sz * 0.22, c: hex(k % 3 ? '#6a7050' : '#8a8e6a'), c2: hex('#4a5038'), type: KNIFE, taper: 0.8, seed: 4600 + k, hgt: 0.9, run: 0.2 });
  }
  // wet mud where the traveller stands
  ref.fill(ellipsePts(HILL.feet[0] - 10, HILL.feet[1] + 18, 210, 40, 26, 0.02, 0.2, 2), '#3a3430', { dir: 0, maxR: 12, edge: 3, wet: 0.8, group: 'mud' });
  ref.fill(ellipsePts(HILL.feet[0] + 70, HILL.feet[1] + 30, 70, 12, 18, 0, 0.2, 3), '#8a8c90', { dir: 0, maxR: 6, edge: 2, wet: 1, group: 'mudpool' });
  // the rock for the crow
  const [rx, ry] = HILL.rock;
  ref.fill(blob([[rx - 110, ry + 30], [rx - 90, ry - 40], [rx - 20, ry - 70], [rx + 70, ry - 50], [rx + 110, ry + 10], [rx + 90, ry + 40]]), '#55565a', { dir: 0.3, maxR: 14, edge: 3, group: 'rock' });
  ref.fill(blob([[rx - 70, ry - 40], [rx - 10, ry - 66], [rx + 60, ry - 48], [rx + 20, ry - 30]]), '#9a9ca0', { dir: 0.3, maxR: 8, group: 'rock' });
  // the climb ends in a 2.3× close-up, so the knife marks start finer than on the ground-level plates
  return { ref, w: W, h: H, R: [20, 13, 8, 5.5, 4, 3] };
}
