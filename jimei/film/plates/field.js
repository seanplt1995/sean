// field.js — P6 the wheat field seen from the ridge (dusk / harvested / sunrise), P7 the close-ups, P8 overhead.
import { Ref } from '../../engine/plate.js';
import { KNIFE, DAB, LINE, hex, mixc } from '../../engine/impasto.js';
import { css, mixh, lerp2, ellipsePts, blob } from './common.js';

export const FIELD = { hz: 900, vp: [760, 885], gather: [720, 1300], tree: [300, 1182] };

const PALETTES = {
  dusk: {
    sky: [[0, '#3D5A8A'], [0.42, '#8a7aa0'], [0.62, '#E9A37A'], [0.9, '#F2C14E'], [1, '#f6d27a']],
    cloud: '#c98a8a', cloudLit: '#f3b884', far: '#6a5a86', farLit: '#8f6f8a',
    rows: ['#E3C05A', '#d4a94a', '#e9c868', '#c99a3e'], rowFar: '#d9a96a', shadow: '#a8783a',
    ridge: '#b8774a', ridgeLit: '#d99a62', grass: '#7a7a3a', earth: '#9A4E2A',
    trunk: '#3b2a24', crown: '#4f4a2e', crownLit: '#8a7a3a', sun: '#fbe3a0', sunPos: [1010, 868], sunR: 64,
  },
  harvest: {
    sky: [[0, '#4a5a78'], [0.45, '#8a8c9c'], [0.7, '#b8a49a'], [0.92, '#c9b08a'], [1, '#d0b890']],
    cloud: '#8a8a98', cloudLit: '#b8aaa0', far: '#555a70', farLit: '#6a6a7a',
    rows: ['#6B4A2E', '#5a3d26', '#7a5838', '#4e3420'], rowFar: '#7a6a5a', shadow: '#3e2a1a',
    ridge: '#7a5a40', ridgeLit: '#94704e', grass: '#5a5a3e', earth: '#6B4A2E', stubble: '#a68a5a',
    trunk: '#2e2420', crown: null, crownLit: null, sun: null,
  },
  sunrise: {
    sky: [[0, '#7aa0c8'], [0.35, '#c9b8b0'], [0.6, '#E9A37A'], [0.85, '#F6C46A'], [1, '#F2C14E']],
    cloud: '#e8b08a', cloudLit: '#fbe0a8', far: '#7a7aa0', farLit: '#c08a7a',
    rows: ['#E3C05A', '#cfb04a', '#ecd070', '#b9a040'], rowFar: '#e8c080', shadow: '#9a8a3a',
    ridge: '#c08a5a', ridgeLit: '#e8b070', grass: '#4E8A6A', earth: '#9A4E2A',
    trunk: '#3b2a24', crown: '#3f7a5a', crownLit: '#7aa65a', sun: '#fff1c0', sunPos: [720, 892], sunR: 80,
  },
};

export function plateField(variant = 'dusk') {
  const P = PALETTES[variant], W = 1440, H = 2560, ref = new Ref(W, H), hz = FIELD.hz, vp = FIELD.vp;
  // sky: horizontal knife planes, gradient laid as stroke-to-stroke steps
  ref.fill({ rect: [0, 0, W, hz + 10] }, { lin: [0, 0, 0, hz], stops: P.sky }, { dir: 0.03, maxR: 52, group: 'sky', jit: 0.04, hgt: 0.8 });
  if (P.sun) {
    ref.fill({ circle: [P.sunPos[0], P.sunPos[1], P.sunR * 2.2] }, { rad: [P.sunPos[0], P.sunPos[1], P.sunR * 0.5, P.sunPos[0], P.sunPos[1], P.sunR * 2.2], stops: [[0, P.sun], [1, P.sun + '00']] }, { colourOnly: true });
    ref.fill({ circle: [P.sunPos[0], P.sunPos[1], P.sunR] }, P.sun, { dir: 0, maxR: 16, edge: 3, run: 0.1, group: 'sun', gmul: variant === 'sunrise' ? 1 : 1 });
  }
  // long streaks of cloud, kept low and to the sides (the caption band stays a calm plane)
  for (const [cx, cy, rx, ry, s] of [[260, 160, 300, 26, 1], [1180, 240, 280, 22, 2], [1240, 780, 220, 16, 3], [180, 820, 200, 14, 4]]) {
    ref.fill(ellipsePts(cx, cy, rx, ry, 26, 0.02, 0.25, s), P.cloud, { dir: 0.02, maxR: 16, group: 'cloud' + s });
    ref.fill(ellipsePts(cx - rx * 0.1, cy + ry * 0.35, rx * 0.7, ry * 0.4, 20, 0.02, 0.25, s + 3), P.cloudLit, { dir: 0.02, maxR: 8, group: 'cloud' + s });
  }
  // far tree line on the horizon
  const far = [[0, hz + 6]];
  for (let x = 0; x <= W; x += 40) far.push([x, hz - 14 - 18 * Math.abs(Math.sin(x * 0.013)) - 10 * Math.sin(x * 0.041)]);
  far.push([W, hz + 6]);
  ref.fill(far, P.far, { dir: 0, maxR: 10, group: 'far' });
  ref.fill({ rect: [0, hz - 6, W, 14] }, P.farLit, { dir: 0, maxR: 6, group: 'far' });
  // the field: a base plane, then rows converging on the vanishing point (a wide fan fills the sides)
  ref.fill({ rect: [0, hz - 4, W, H - hz + 4] }, { lin: [0, hz, 0, H], stops: [[0, P.rowFar], [0.3, P.rows[0]], [1, mixh(P.rows[1], P.shadow, 0.3)]] }, { dir: 0, maxR: (x, y) => 5 + 30 * Math.max(0, Math.min(1, (y - hz) / 1300)), group: 'field' });
  const rowsN = 44;
  for (let i = 0; i < rowsN; i++) {
    const span = 9800, xs = -4200;
    const x0 = xs + (i / rowsN) * span, x1 = xs + ((i + 1) / rowsN) * span;
    const q = [[x0, H], [x1, H], lerp2([x1, H], vp, 0.985), lerp2([x0, H], vp, 0.985)];
    const col = P.rows[i % P.rows.length];
    ref.fill(q, { lin: [0, hz, 0, H], stops: [[0, P.rowFar], [0.25, col], [1, mixh(col, P.shadow, 0.25)]] },
      { dir: (x, y) => Math.atan2(vp[1] - y, vp[0] - x), maxR: (x, y) => 5 + 34 * Math.max(0, Math.min(1, (y - hz) / 1300)), group: 'field', edgeFollow: 0.2, hgt: 0.9 });
  }
  // a path between the rows, toward the same vanishing point, coming in from the bottom-left;
  // a cross-ridge (a horizontal field boundary) branches off it to the left and carries the lone tree
  const depthR = (y) => 5 + 26 * Math.max(0, Math.min(1, (y - hz) / 1300));
  const pathL = [-300, H], pathR = [-20, H];
  const pq = [pathL, pathR, lerp2(pathR, vp, 0.985), lerp2(pathL, vp, 0.985)];
  ref.fill(pq, { lin: [0, hz, 0, H], stops: [[0, P.ridgeLit], [1, P.ridge]] }, { dir: (x, y) => Math.atan2(vp[1] - y, vp[0] - x), maxR: depthR, group: 'path', edgeFollow: 0.9 });
  const crossY = FIELD.tree[1], cw = 22, crossX1 = lerp2(pathL, vp, (H - crossY) / (H - vp[1]))[0] + 10;
  ref.fill([[0, crossY - cw / 2], [crossX1, crossY - cw / 2], [crossX1 + 8, crossY + cw / 2], [0, crossY + cw / 2]], { lin: [0, crossY - cw, 0, crossY + cw], stops: [[0, P.ridgeLit], [1, P.ridge]] }, { dir: 0, maxR: 6, group: 'cross' });
  // grass tufts along the edges (short blades, smaller with distance)
  const tufts = (a, b, n, seed) => {
    for (let k = 0; k < n; k++) {
      const u = Math.pow(k / n, 1.8), p = lerp2(a, b, u), d = Math.max(0, (p[1] - hz) / (H - hz));
      if (p[0] < -30 || p[0] > W + 30 || d < 0.03) continue;
      const sz = 4 + 30 * d;
      ref.extra.push({ x: p[0] + Math.sin(k * 7.1 + seed) * sz * 0.4, y: p[1], ang: -Math.PI / 2 + Math.sin(k * 3.3 + seed) * 0.5, len: sz * 1.7, wid: sz * 0.45, c: k % 3 ? hex(P.grass) : mixc(hex(P.grass), hex(P.ridgeLit), 0.4), type: KNIFE, taper: 0.7, seed: seed * 100 + k, hgt: 0.9, run: 0.2 });
    }
  };
  tufts(pathL, lerp2(pathL, vp, 0.95), 70, 1);
  tufts(pathR, lerp2(pathR, vp, 0.95), 70, 2);
  for (let k = 0; k < 16; k++) {
    const x = 10 + k * (crossX1 - 20) / 16, sz = 5 + 3 * Math.sin(k);
    ref.extra.push({ x, y: crossY - cw / 2 + 2, ang: -Math.PI / 2 + Math.sin(k * 2.3) * 0.5, len: sz * 1.8, wid: sz * 0.45, c: hex(P.grass), type: KNIFE, taper: 0.7, seed: 4900 + k, hgt: 0.8, run: 0.2 });
  }
  // the lone tree on the ridge
  const [tx, ty] = FIELD.tree;
  ref.fill([[tx - 14, ty], [tx - 8, ty - 190], [tx - 60, ty - 270], [tx - 48, ty - 278], [tx - 2, ty - 214], [tx + 6, ty - 300], [tx + 18, ty - 300], [tx + 14, ty - 200], [tx + 64, ty - 250], [tx + 72, ty - 240], [tx + 18, ty - 170], [tx + 14, ty]], P.trunk, { dir: Math.PI / 2, maxR: 6, edge: 2, run: 0, group: 'trunk' });
  if (P.crown) {
    const crown = blob([[tx - 150, ty - 250], [tx - 90, ty - 340], [tx, ty - 365], [tx + 100, ty - 335], [tx + 160, ty - 255], [tx + 110, ty - 195], [tx - 10, ty - 215], [tx - 120, ty - 195]]);
    ref.fill(crown, P.crown, { dir: 0.4, maxR: 14, group: 'crown', type: DAB });
    ref.fill(blob([[tx + 10, ty - 345], [tx + 100, ty - 325], [tx + 150, ty - 262], [tx + 80, ty - 270], [tx + 20, ty - 300]]), P.crownLit, { dir: 0.4, maxR: 10, group: 'crown', type: DAB });
  } else {
    for (let k = 0; k < 9; k++) {   // bare branches
      const a = -Math.PI / 2 + (k - 4) * 0.28, L = 110 + 40 * Math.sin(k * 2.1);
      ref.line([[tx + Math.cos(a) * 30, ty - 250 + Math.sin(a) * 30], [tx + Math.cos(a) * L, ty - 250 + Math.sin(a) * L]], 4, P.trunk, { type: KNIFE, step: 10, run: 0.2 });
    }
  }
  ref.extra.push({ x: tx + 70, y: ty + 6, ang: 0, len: 160, wid: 16, c: hex(P.shadow), type: DAB, seed: 3601, hgt: 0.2, alpha: 0.6 });
  if (P.stubble) {   // harvested: short stubble marks along the rows
    for (let k = 0; k < 260; k++) {
      const yy = hz + 30 + Math.pow(((k * 0.618) % 1), 1.6) * (H - hz - 30), t = (yy - hz) / (H - hz);
      const xx = vp[0] + ((k * 0.371) % 1 - 0.5) * 3300 * t;
      if (xx < -20 || xx > W + 20) continue;
      ref.extra.push({ x: xx, y: yy, ang: -Math.PI / 2 + ((k * 0.13) % 1 - 0.5) * 0.5, len: 5 + 20 * t, wid: 3 + 6 * t, c: mixc(hex(P.stubble), hex(P.rows[0]), 0.45), c2: hex(P.stubble), type: KNIFE, seed: 3700 + k, hgt: 0.8, run: 0.5, alpha: 0.8 });
    }
  }
  return { ref, w: W, h: H, hz, vp, R: [52, 32, 20, 12, 7, 4] };
}

// ── P7: close-ups — the lone tree large on the left, people on the ridge, wheat in front (dusk) ──
export const CLOSE = { tree: [190, 2080], leafFrom: [380, 1150], leafTo: [262, 2072], people: [[520, 1790], [600, 1800], [690, 1795], [780, 1805], [865, 1798], [950, 1790], [1035, 1802]], wheat: [1120, 2420], hz: 1160 };
export function plateClose() {
  const P = PALETTES.dusk, W = 1440, H = 2560, ref = new Ref(W, H), hz = CLOSE.hz;
  ref.fill({ rect: [0, 0, W, hz + 10] }, { lin: [0, 0, 0, hz], stops: P.sky }, { dir: 0.03, maxR: 52, group: 'sky', jit: 0.04, hgt: 0.8 });
  const sun = [1000, hz - 50];
  ref.fill({ circle: [sun[0], sun[1], 170] }, { rad: [sun[0], sun[1], 40, sun[0], sun[1], 170], stops: [[0, '#fbe3a0'], [1, 'rgba(242,193,78,0)']] }, { colourOnly: true });
  ref.fill({ circle: [sun[0], sun[1], 70] }, '#fbe3a0', { maxR: 14, edge: 3, group: 'sun', run: 0.1 });
  for (const [cx, cy, rx, ry, s] of [[1200, 260, 260, 22, 1], [300, 200, 300, 26, 2]]) ref.fill(ellipsePts(cx, cy, rx, ry, 26, 0.02, 0.25, s), P.cloud, { dir: 0.02, maxR: 14, group: 'cloud' + s });
  const far = [[0, hz + 6]];
  for (let x = 0; x <= W; x += 40) far.push([x, hz - 16 - 20 * Math.abs(Math.sin(x * 0.011)) - 9 * Math.sin(x * 0.037)]);
  far.push([W, hz + 6]);
  ref.fill(far, P.far, { dir: 0, maxR: 10, group: 'far' });
  // the field behind the ridge
  ref.fill({ rect: [0, hz, W, 700] }, { lin: [0, hz, 0, hz + 700], stops: [[0, P.rowFar], [1, '#d4a94a']] }, { dir: 0.05, maxR: (x, y) => 6 + 26 * Math.min(1, (y - hz) / 700), group: 'field' });
  // the ridge where people stand
  ref.fill([[0, 1760], [W, 1740], [W, 1900], [0, 1930]], { lin: [0, 1740, 0, 1930], stops: [[0, P.ridgeLit], [1, P.ridge]] }, { dir: 0, maxR: 18, group: 'ridge' });
  // foreground wheat and soil
  ref.fill([[0, 1930], [W, 1900], [W, H], [0, H]], { lin: [0, 1900, 0, H], stops: [[0, '#d9b04a'], [0.5, '#c99a3e'], [1, '#9a6a2e']] }, { dir: -Math.PI / 2, maxR: 30, group: 'wheat', hgt: 1.1 });
  ref.fill(blob([[60, 2040], [380, 2030], [520, 2120], [360, 2200], [40, 2210]]), '#8a4a2a', { dir: 0, maxR: 16, group: 'soil' });
  // the tree: trunk rising from the soil, branches, crown
  const [tx, ty] = CLOSE.tree;
  ref.fill([[tx - 40, ty], [tx - 28, ty - 480], [tx - 150, ty - 780], [tx - 126, ty - 800], [tx - 8, ty - 580], [tx + 4, ty - 960], [tx + 34, ty - 960], [tx + 36, ty - 600], [tx + 190, ty - 860], [tx + 214, ty - 846], [tx + 52, ty - 470], [tx + 40, ty]], { lin: [tx - 40, 0, tx + 40, 0], stops: [[0, '#2e211c'], [0.6, '#4a342a'], [1, '#7a5a3a']] }, { dir: Math.PI / 2, maxR: 10, edge: 3, run: 0, group: 'trunk' });
  ref.line([[tx + 140, ty - 790], [CLOSE.leafFrom[0] - 20, CLOSE.leafFrom[1] - 30], [CLOSE.leafFrom[0] + 30, CLOSE.leafFrom[1] - 90]], 10, '#3a2a22', { type: KNIFE, step: 14, run: 0.1 });
  const crown = blob([[-90, 760], [40, 560], [250, 520], [440, 640], [500, 900], [430, 1150], [250, 1180], [120, 1110], [-20, 1160], [-100, 980]]);
  ref.fill(crown, P.crown, { dir: 0.5, maxR: 18, group: 'crown', type: DAB });
  ref.fill(blob([[220, 560], [400, 620], [480, 830], [380, 760], [260, 680]]), P.crownLit, { dir: 0.5, maxR: 12, group: 'crown', type: DAB });
  for (let k = 0; k < 40; k++) {   // loose leaves at the crown's edge, so it doesn't read as a disc
    const a = k * 2.39996, r = 330 + 40 * Math.sin(k * 1.7), cxx = 200 + Math.cos(a) * r * 0.95, cyy = 870 + Math.sin(a) * r * 0.85;
    ref.extra.push({ x: cxx, y: cyy, ang: a, len: 26, wid: 14, c: hex(k % 3 ? P.crown : P.crownLit), type: DAB, seed: 3800 + k, hgt: 0.8 });
  }
  return { ref, w: W, h: H, hz, R: [52, 32, 20, 12, 7, 4] };
}

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
  return { ref, w: W, h: H, R: [48, 30, 18, 11, 7, 4] };
}
