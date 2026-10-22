// provence.js — style A: the wheat field in three lights (dusk S09, harvest S11, sunrise S19–S20) and the field's
// edge at sunset (S10). 1440 × 2560 so the camera can drift; the horizon sits at y 1300, the rows meet at x 720.
import { Ref } from '../../engine/plate.js';
import { hex, mixc, DAB, KNIFE } from '../../engine/impasto.js';
import { swirl, swirlTint, reflect, rnd, pick, mixh, ellipsePts, blob } from '../concepts/lib.js';

const R6 = [55, 34, 20, 12.3, 7.7, 4.6];
export const FIELD3 = { hz: 1300, vp: [720, 1300], gather: [720, 1820], cypress: [250, 2560], village: [1040, 1290], sunDusk: [1130, 1180], sunRise: [720, 1100] };
// the field's ground plane: camera 3 m up, so a point X m right and z m ahead lands here
export const F3 = { FC: 3, FF: 1500 };
export const f3ground = (X, z) => [FIELD3.vp[0] + X * F3.FF / z, FIELD3.hz + F3.FC * F3.FF / z];

const PALS = {
  dusk: { sky: [[0, '#1e3a8a'], [0.35, '#3a6ab8'], [0.7, '#e8a070'], [0.9, '#f8c870'], [1, '#fbe0a0']], cloud: ['#fff2d8', '#f0c8a0', '#c890a8', '#8a7aa8'], swirl: '#ffe6b8',
    hills: ['#7a6aa8', '#9a7aa0'], hills2: ['#6a6a98', '#8a7a88'], field: [[0, '#e8b048'], [0.4, '#f0c048'], [1, '#c88a28']], furrowD: '#8a4a1a', furrowL: '#fbd870', path: ['#e0b080', '#b87a48'], sun: true },
  harvest: { sky: [[0, '#4a5a7a'], [0.5, '#8a96a8'], [1, '#c8c4b8']], cloud: ['#e8e4dc', '#b8b8c0', '#8a8ea0', '#6a7088'], swirl: '#dcdcd8',
    hills: ['#6a7088', '#7a8090'], hills2: ['#5a6878', '#6a7470'], field: [[0, '#b89a5a'], [0.4, '#a8864a'], [1, '#7a5a32']], furrowD: '#4a3420', furrowL: '#d8c088', path: ['#a88a68', '#7a5a40'], sun: false },
  sunrise: { sky: [[0, '#2a7ab0'], [0.35, '#6ab8c8'], [0.62, '#f8d890'], [0.85, '#ffc860'], [1, '#fff0b0']], cloud: ['#fffaf0', '#ffe0b0', '#f0b8a0', '#a8b8d0'], swirl: '#fff8d8',
    hills: ['#8a8ac8', '#b8a0c0'], hills2: ['#7a90b8', '#a0a0a8'], field: [[0, '#f8d058'], [0.4, '#f8c840'], [1, '#d8962a']], furrowD: '#a85a1a', furrowL: '#fff090', path: ['#f0c890', '#c88a50'], sun: true },
};

export function plateField3(variant) {
  const W = 1440, H = 2560, ref = new Ref(W, H), V = PALS[variant], { hz, vp } = FIELD3;
  const toVP = (x, y) => Math.atan2(vp[1] - y, vp[0] - x);
  const sun = variant === 'sunrise' ? FIELD3.sunRise : FIELD3.sunDusk;
  // the sky turns round the sun
  ref.fill({ rect: [0, 0, W, hz + 20] }, { lin: [0, 0, 0, hz], stops: V.sky }, { dir: V.sun ? swirl(sun[0], sun[1], 1) : -0.04, maxR: 36, group: 'sky', jit: 0.05 });
  if (V.sun) { for (let k = 0; k < 5; k++) swirlTint(ref, sun[0], sun[1], 90 + k * 40, 160 + k * 150, 0.9, k % 2 ? V.swirl : V.cloud[1], 0.22, 14, k + 1); }
  else for (let k = 0; k < 5; k++) ref.tint({ rect: [0, 200 + k * 200, W, 40] }, '#a8acb8', 0.2);
  // clouds: a few puffs each, turning
  const cloud = (cx, cy, rx, ry, seed) => {
    const pr = rnd(seed * 7), puffs = [];
    for (let k = 0; k < 6; k++) { const u = (k / 5 - 0.5) * 1.5; puffs.push(ellipsePts(cx + u * rx * 0.62, cy - Math.cos(u * 1.4) * ry * 0.35 + pr() * ry * 0.2, rx * (0.38 + pr() * 0.16), ry * (0.55 + pr() * 0.3) * Math.cos(u * 0.9), 20, 0, 0.08, k)); }
    puffs.push(ellipsePts(cx, cy + ry * 0.25, rx * 0.95, ry * 0.42, 24, 0, 0.05, 9));
    ref.fill(puffs, { lin: [0, cy - ry, 0, cy + ry], stops: [[0, V.cloud[0]], [0.45, V.cloud[1]], [0.8, V.cloud[2]], [1, V.cloud[3]]] }, { dir: swirl(cx, cy, 1, 0.3), maxR: 13, group: 'cloud' + seed, detail: 2 });
    swirlTint(ref, cx, cy, 6, Math.min(rx, ry * 1.6), 2.2, '#ffffff', 0.45, 6, seed);
  };
  const clouds = variant === 'harvest' ? [[300, 260, 320, 110, 1], [1000, 200, 300, 90, 2], [700, 560, 360, 90, 3], [200, 820, 260, 60, 4], [1200, 760, 240, 60, 5], [760, 1000, 300, 50, 6]]
    : [[300, 250, 260, 120, 1], [1060, 330, 240, 110, 2], [600, 620, 220, 80, 3], [220, 900, 200, 60, 4], [1260, 860, 160, 50, 5]];
  for (const [cx, cy, rx, ry, sd] of clouds) cloud(cx, cy, rx, ry, sd);
  if (V.sun) {
    for (let k = 5; k >= 1; k--) ref.tint({ circle: [...sun, 50 + k * 36] }, k % 2 ? '#fff4b0' : '#f8d870', 0.16);
    ref.fill({ circle: [...sun, variant === 'sunrise' ? 92 : 58] }, { rad: [sun[0] - 10, sun[1] - 10, 4, ...sun, variant === 'sunrise' ? 92 : 58], stops: [[0, '#fffde8'], [1, '#fcd860']] }, { maxR: 10, edge: 2, group: 'sun', gmul: 0 });
    for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, r0 = variant === 'sunrise' ? 110 : 76; ref.tint([[sun[0] + Math.cos(a) * r0, sun[1] + Math.sin(a) * r0], [sun[0] + Math.cos(a + 0.05) * r0 * 2.2, sun[1] + Math.sin(a + 0.05) * r0 * 2.2], [sun[0] + Math.cos(a + 0.1) * r0, sun[1] + Math.sin(a + 0.1) * r0]], '#fff4c0', 0.3); }
  }
  // the Alpilles: two violet ridges
  ref.fill([[0, 1210], [160, 1150], [340, 1185], [540, 1130], [750, 1180], [930, 1140], [1150, 1195], [1330, 1150], [1440, 1175], [1440, hz + 10], [0, hz + 10]], { lin: [0, 1130, 0, hz], stops: [[0, V.hills[0]], [1, V.hills[1]]] }, { dir: 0, maxR: 14, group: 'hills1' });
  ref.fill([[0, 1270], [240, 1238], [440, 1262], [700, 1228], [960, 1258], [1200, 1236], [1440, 1252], [1440, hz + 10], [0, hz + 10]], { lin: [0, 1228, 0, hz], stops: [[0, V.hills2[0]], [1, V.hills2[1]]] }, { dir: 0, maxR: 10, group: 'hills2' });
  // the village on the right, its steeple; olive trees along the far edge
  const vr = rnd(4), [vx, vy] = FIELD3.village;
  for (let i = 0; i < 16; i++) {
    const x = vx - 220 + i * 30 + vr() * 10, w = 24 + vr() * 16, h = 16 + vr() * 14, y = vy - (i % 3) * 8;
    ref.fill({ rect: [x, y - h, w, h] }, pick(vr, variant === 'harvest' ? ['#c8b8a0', '#b8a890', '#d8c8b0'] : ['#e8c890', '#f0d8a8', '#d8b078', '#f2e2c0']), { maxR: 4, edge: 1.2, group: 'vh' });
    ref.fill([[x - 3, y - h], [x + w + 3, y - h], [x + w / 2, y - h - 10]], pick(vr, ['#c0502e', '#a8402a', '#d06a3a']), { maxR: 3, edge: 1, group: 'vr' });
    if (vr() < 0.6) ref.fill({ rect: [x + w * 0.3, y - h * 0.65, 5, 6] }, '#4a3a5a', { maxR: 2.6, edge: 1, group: 'vw' });
  }
  ref.fill({ rect: [vx - 12, vy - 120, 22, 112] }, variant === 'harvest' ? '#c8b8a0' : '#e8d0a0', { maxR: 4, edge: 1.2, group: 'tower' });
  ref.fill([[vx - 16, vy - 120], [vx + 14, vy - 120], [vx - 1, vy - 180]], '#5a6aa0', { maxR: 3, edge: 1, group: 'steeple' });
  for (const [x, y, r, sd] of [[1260, hz, 40, 1], [1350, hz + 6, 46, 2], [80, hz + 2, 36, 3], [180, hz - 2, 30, 4], [600, hz - 2, 26, 5]]) ref.fill(blob(ellipsePts(x, y - r * 0.4, r, r * 0.7, 9, 0, 0.3, sd)), { rad: [x - r * 0.3, y - r * 0.7, 2, x, y - r * 0.4, r], stops: [[0, variant === 'harvest' ? '#8a9a88' : '#a8c0a0'], [1, '#4a6a52']] }, { dir: 'edge', maxR: 8, group: 'olive' + sd, type: DAB });
  for (const [x, h] of [[420, 190], [468, 140], [510, 110]]) ref.fill(blob([[x, hz + 6], [x - 20, hz - h * 0.3], [x - 13, hz - h * 0.7], [x, hz - h], [x + 13, hz - h * 0.7], [x + 20, hz - h * 0.3]]), { lin: [x - 20, 0, x + 20, 0], stops: [[0, '#1e3e2e'], [1, '#3a6a40']] }, { dir: Math.PI / 2, maxR: 6, group: 'cyp' + x });
  // the field: rows to the vanishing point, light and shade alternating so the strokes follow them
  ref.fill([[0, hz], [W, hz], [W, H], [0, H]], { lin: [0, hz, 0, H], stops: V.field }, { dir: toVP, maxR: (x, y) => 5 + 30 * Math.min(1, (y - hz) / 1200), group: 'field', edgeFollow: 0.2 });
  for (let k = -22; k <= 22; k++) { const xb = 720 + k * 150; ref.tint([[vp[0], vp[1]], [xb - 18, H], [xb + 18, H]], k % 2 ? V.furrowD : V.furrowL, 0.24); }
  ref.fill([[vp[0] - 4, hz + 2], [vp[0] + 4, hz + 2], [860, H], [580, H]], { lin: [0, hz, 0, H], stops: [[0, V.path[0]], [1, V.path[1]]] }, { dir: toVP, maxR: (x, y) => 4 + 18 * Math.min(1, (y - hz) / 1200), group: 'path', edgeFollow: 0.9 });
  if (variant === 'harvest') {
    // stubble and haystacks with long cool shadows
    const hr = rnd(15);
    for (let i = 0; i < 240; i++) { const y = hz + 30 + Math.pow(hr(), 0.8) * 1230, x = hr() * W, s = 0.3 + (y - hz) / 1260 * 1.4; if (Math.abs(x - 720) < 60 + (y - hz) * 0.12) continue; ref.tint({ rect: [x, y - 10 * s, 2 + s * 1.5, 10 * s] }, '#e8d098', 0.55); }
    for (const [x, y, s] of [[300, 1520, 70], [1080, 1460, 50], [1220, 1700, 100], [180, 1900, 140], [960, 1620, 70]]) {
      ref.tint([[x, y], [x + s * 2.4, y + s * 0.3], [x + s * 2.2, y + s * 0.6], [x - s * 0.2, y + s * 0.3]], '#3a3448', 0.4);
      ref.fill(blob([[x - s, y], [x - s * 0.9, y - s * 0.9], [x - s * 0.3, y - s * 1.5], [x + s * 0.3, y - s * 1.5], [x + s * 0.9, y - s * 0.9], [x + s, y]]), { lin: [x - s, 0, x + s, 0], stops: [[0, '#e8c878'], [0.6, '#c8a050'], [1, '#8a6a38']] }, { dir: 'edge', maxR: 10, group: 'stack' + x });
      for (let k = 0; k < 8; k++) ref.tint([[x - s * 0.9 + k * s * 0.24, y - s * 0.2], [x - s * 0.8 + k * s * 0.22, y - s * 1.2], [x - s * 0.78 + k * s * 0.22, y - s * 1.2], [x - s * 0.86 + k * s * 0.24, y - s * 0.2]], k % 2 ? '#fbe8a8' : '#8a6a30', 0.4);
    }
  } else {
    // poppies and cornflowers scattered into the near wheat
    const fr = rnd(9);
    for (let i = 0; i < 160; i++) {
      const y = hz + 60 + Math.pow(fr(), 0.7) * 1200, x = fr() * W, s = 0.3 + (y - hz) / 1260 * 1.4;
      if (Math.abs(x - 720) < 70 + (y - hz) * 0.12) continue;
      ref.fill({ circle: [x, y, 6 * s + 1.5] }, fr() < 0.78 ? pick(fr, ['#e0281e', '#d81e1e', '#f04a2a']) : '#3a5ad0', { maxR: 4, edge: 1.2, group: 'flower', gmul: variant === 'sunrise' ? 1 : 0 });
    }
  }
  // the great cypress on the left, rising from below the frame like a dark green flame
  const cyp = [], cyR = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, y = 2620 - t * 2050, w = 175 * Math.pow(Math.sin(Math.PI * (0.5 + 0.5 * t)), 0.9) * (t > 0.86 ? (1 - t) / 0.14 : 1), ax = 250 + 30 * Math.sin(t * 7);
    const fl = 1 + 0.14 * Math.sin(t * 41) + 0.08 * Math.sin(t * 97);
    cyp.push([ax - w * fl, y]); cyR.unshift([ax + w * (2 - fl) * 0.9, y]);
  }
  ref.fill(cyp.concat(cyR), { lin: [70, 0, 430, 0], stops: variant === 'harvest' ? [[0, '#0e2420'], [0.5, '#1e3a30'], [1, '#3a5a3a']] : [[0, '#0e2a22'], [0.45, '#1e4a30'], [0.8, '#2e6a3a'], [1, '#4a7a3a']] }, { dir: swirl(250, 1500, 1, -1.35), maxR: 14, group: 'cypress' });
  for (let k = 0; k < 16; k++) { const y = 640 + k * 118, w = 34 + Math.min(k, 8) * 16; swirlTint(ref, 250 + (k % 2 ? 26 : -26), y, 6, w, 1.1, k % 2 ? '#5a8a44' : '#08201a', 0.55, 7, k + 2); }
  return { ref, w: W, h: H, hz, R: R6 };
}

// ── the field's edge at sunset: an almond tree losing its leaves, a stone wall, a haystack, the sun on the right ──
export const EDGE = { leafFrom: [470, 1180], leafTo: [560, 2110], wall: 1960, sun: [1130, 1260], hz: 1360 };
export function plateEdge() {
  const W = 1440, H = 2560, ref = new Ref(W, H), hz = EDGE.hz, sun = EDGE.sun;
  ref.fill({ rect: [0, 0, W, hz + 20] }, { lin: [0, 0, 0, hz], stops: [[0, '#2a3a8a'], [0.4, '#6a6ab0'], [0.72, '#e8907a'], [0.9, '#f8c070'], [1, '#fbe0a0']] }, { dir: swirl(sun[0], sun[1], 1), maxR: 36, group: 'sky', jit: 0.05 });
  for (let k = 0; k < 5; k++) swirlTint(ref, sun[0], sun[1], 90 + k * 46, 170 + k * 160, 0.9, k % 2 ? '#ffe6b8' : '#f0b090', 0.22, 14, k + 3);
  for (let k = 5; k >= 1; k--) ref.tint({ circle: [...sun, 56 + k * 40] }, k % 2 ? '#fff4b0' : '#f8d070', 0.16);
  ref.fill({ circle: [...sun, 70] }, { rad: [sun[0] - 10, sun[1] - 10, 4, ...sun, 70], stops: [[0, '#fffde8'], [1, '#fcc850']] }, { maxR: 10, edge: 2, group: 'sun', gmul: 0 });
  // far: ridges, a row of cypresses, the village
  ref.fill([[0, 1290], [300, 1240], [600, 1280], [900, 1230], [1200, 1280], [1440, 1250], [1440, hz + 10], [0, hz + 10]], { lin: [0, 1230, 0, hz], stops: [[0, '#7a6aa8'], [1, '#9a7aa0']] }, { dir: 0, maxR: 12, group: 'hills' });
  for (let i = 0; i < 9; i++) { const x = 640 + i * 46, h = 90 + (i % 3) * 30; ref.fill(blob([[x, hz + 4], [x - 14, hz - h * 0.3], [x - 9, hz - h * 0.7], [x, hz - h], [x + 9, hz - h * 0.7], [x + 14, hz - h * 0.3]]), '#2a4a3a', { dir: Math.PI / 2, maxR: 5, group: 'cypr' }); }
  // the field, gold in the low light, rows running away to the right
  ref.fill([[0, hz], [W, hz], [W, H], [0, H]], { lin: [0, hz, 0, H], stops: [[0, '#f0b848'], [0.5, '#e8a838'], [1, '#b87a28']] }, { dir: -0.25, maxR: (x, y) => 6 + 28 * Math.min(1, (y - hz) / 1100), group: 'field' });
  for (let k = 0; k < 18; k++) { const y = hz + 40 + k * k * 4.2; ref.tint([[0, y], [W, y - 140], [W, y - 140 + 6 + k], [0, y + 6 + k]], k % 2 ? '#a8641a' : '#fbd870', 0.25); }
  // the haystack, its long shadow toward us
  const [sx, sy, ss] = [1060, 1640, 150];
  ref.tint([[sx - ss, sy], [sx - ss * 3.6, sy + ss * 0.9], [sx - ss * 3.2, sy + ss * 1.2], [sx + ss * 0.4, sy + ss * 0.2]], '#5a3a5a', 0.45);
  ref.fill(blob([[sx - ss, sy], [sx - ss * 0.9, sy - ss * 0.9], [sx - ss * 0.3, sy - ss * 1.5], [sx + ss * 0.3, sy - ss * 1.5], [sx + ss * 0.9, sy - ss * 0.9], [sx + ss, sy]]), { lin: [sx - ss, 0, sx + ss, 0], stops: [[0, '#8a6a38'], [0.4, '#d8b060'], [1, '#fbe090']] }, { dir: 'edge', maxR: 10, group: 'stack' });
  for (let k = 0; k < 10; k++) ref.tint([[sx - ss * 0.9 + k * ss * 0.19, sy - ss * 0.15], [sx - ss * 0.8 + k * ss * 0.17, sy - ss * 1.25], [sx - ss * 0.77 + k * ss * 0.17, sy - ss * 1.25], [sx - ss * 0.86 + k * ss * 0.19, sy - ss * 0.15]], k % 2 ? '#fff0b0' : '#7a5a28', 0.4);
  // the almond tree on the left: a dark crooked trunk, branches, gold and rust leaves, some already down
  const tr = rnd(8);
  ref.fill([[300, 2010], [440, 2010], [430, 1720], [470, 1480], [440, 1300], [400, 1290], [380, 1480], [330, 1720]], { lin: [300, 0, 470, 0], stops: [[0, '#2a1e1a'], [0.6, '#5a3e2e'], [1, '#8a5a3a']] }, { dir: Math.PI / 2, maxR: 10, group: 'trunk' });
  for (const pts of [[[440, 1320], [560, 1150], [700, 1080]], [[420, 1300], [360, 1100], [240, 980]], [[450, 1400], [620, 1340], [760, 1360]], [[560, 1150], [600, 980], [560, 860]], [[360, 1100], [420, 900], [470, 820]], [[400, 1290], [300, 1240], [180, 1260]]]) ref.line(pts, 20, '#3a2a22', { area: true, group: 'branch' });
  // the crown: a loose mass of warm leaves, darker inside, lit on the sunward side
  ref.fill(blob(ellipsePts(470, 1060, 330, 250, 12, 0, 0.3, 4)), { rad: [620, 960, 20, 470, 1060, 360], stops: [[0, '#e8a840'], [0.6, '#b8642a'], [1, '#7a3a22']] }, { dir: 'edge', maxR: 10, group: 'crown', type: DAB });
  ref.fill(blob(ellipsePts(330, 1200, 140, 90, 10, 0, 0.3, 7)), { rad: [380, 1160, 10, 330, 1200, 160], stops: [[0, '#d8902e'], [1, '#8a4224']] }, { dir: 'edge', maxR: 8, group: 'crown', type: DAB });
  for (let i = 0; i < 420; i++) {
    const a = tr() * Math.PI * 2, r = Math.sqrt(tr()), x = 470 + Math.cos(a) * 350 * r, y = 1070 + Math.sin(a) * 270 * r;
    const lit = (x - 470) * 0.6 - (y - 1070) * 0.8 > 60;
    ref.fill(ellipsePts(x, y, 10 + tr() * 6, 6 + tr() * 3, 8, tr() * 3, 0.2, i), lit ? pick(tr, ['#f8c850', '#f0b038', '#ffd870']) : pick(tr, ['#d8782a', '#c85a22', '#a8441e', '#e8a830']), { maxR: 2.8, edge: 1, group: 'leaf' });
  }
  // the dry-stone wall along the field's edge, ochre and violet stones; poppies at its foot
  const wy = EDGE.wall;
  ref.fill([[0, wy - 120], [W, wy - 150], [W, wy + 30], [0, wy + 40]], '#8a6a5a', { dir: 0, maxR: 10, group: 'wall' });
  const sr = rnd(22);
  for (let row = 0; row < 5; row++) for (let x = (row % 2) * 40 - 20; x < W; x += 76 + sr() * 50) {
    const y = wy - 118 + row * 31 - x * 0.021, w = 64 + sr() * 44, h = 24 + sr() * 6;
    ref.fill([[x + 4, y], [x + w - 6, y - 2], [x + w, y + h * 0.4], [x + w - 4, y + h], [x + 6, y + h + 1], [x, y + h * 0.5]], mixh('#d8a070', '#7a6a8a', sr()), { maxR: 5, edge: 1.2, group: 'stone' });
    ref.tint([[x + 4, y], [x + w - 6, y - 2], [x + w - 8, y + 5], [x + 6, y + 6]], '#ffe0b0', 0.4);
  }
  // soil in front with the place the leaf will land; poppies, wheat that strayed
  ref.fill({ rect: [0, wy + 30, W, H - wy - 30] }, { lin: [0, wy + 30, 0, H], stops: [[0, '#8a5a3a'], [1, '#5a3a28']] }, { dir: 0, maxR: 20, group: 'soil' });
  const pr = rnd(31);
  for (let i = 0; i < 70; i++) { const x = pr() * W, y = wy + 40 + pr() * 500, s = 0.6 + (y - wy) / 500; if (Math.hypot(x - EDGE.leafTo[0], y - EDGE.leafTo[1]) < 90) continue; ref.line([[x, y], [x + (pr() - 0.5) * 20, y - 50 * s]], 3, '#4a6a2a', { type: 3 }); ref.fill({ circle: [x + (pr() - 0.5) * 20, y - 50 * s, 9 * s] }, pick(pr, ['#e0281e', '#d81e1e', '#f04a2a']), { maxR: 4, edge: 1.2, group: 'poppy', gmul: 0 }); }
  for (let i = 0; i < 40; i++) { const x = EDGE.leafTo[0] - 400 + pr() * 800, y = wy + 60 + pr() * 400; ref.fill(ellipsePts(x, y, 10, 5, 8, pr() * 3, 0.2, i), pick(pr, ['#c85a22', '#e8a830', '#a8641e']), { maxR: 3, edge: 1, group: 'fallen' }); }
  return { ref, w: W, h: H, R: R6 };
}
