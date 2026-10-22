// arles.js — style A, Van Gogh's Provence: the cathedral square after the festival (S03, S06, S08), the quay (S04),
// a window with a lamp (S05), the café terrace in the rain (S07). Colour versions are the moonlit night; the
// square is shown grey first and the moon lays its colour back.
import { Ref } from '../../engine/plate.js';
import { hex, mixc, DAB, KNIFE } from '../../engine/impasto.js';
import { camera, wallZ, wallX, ground, windowZ, balconyZ, star, swirl, swirlTint, reflect, rnd, pick, mixh, ellipsePts, blob } from '../concepts/lib.js';
import { catenary } from './common.js';

// stroke radii before the store's 0.65 (→ 36, 22, 13, 8, 5, 3)
const R6 = [55, 34, 20, 12.3, 7.7, 4.6];

// ── the square: 1080 × 2600, the scene below y 680, sky above for the tilt into the stars ──
export function plateSquare() {
  const W = 1080, H = 2600, DY = 680, ref = new Ref(W, H);
  const P = camera({ cx: 540, hz: 1370 + DY, F: 720, camX: 0.3, camH: 1.6 });
  const G = { gmul: 1 };
  // sky: ultramarine, swirling round the stars
  ref.fill({ rect: [0, 0, W, 1430 + DY] }, { lin: [0, 0, 0, 1370 + DY], stops: [[0, '#081438'], [0.3, '#10235e'], [0.62, '#1f4590'], [0.88, '#3b6aa8'], [1, '#6d8fb8']] }, { dir: swirl(560, 420 + DY * 0.7, 1), maxR: 36, group: 'sky', jit: 0.05 });
  swirlTint(ref, 560, 430 + DY, 40, 330, 1.6, '#86b6e6', 0.32, 16, 2);
  swirlTint(ref, 880, 250 + DY, 30, 220, 1.3, '#9cc4ea', 0.28, 12, 5);
  swirlTint(ref, 300, 560 + DY, 20, 160, 1.2, '#7aa8dc', 0.25, 10, 9);
  swirlTint(ref, 640, 360, 30, 300, 1.5, '#7aa8dc', 0.26, 14, 13);
  swirlTint(ref, 220, 220, 20, 180, 1.2, '#86b6e6', 0.24, 10, 17);
  const stars = [[560, 430, 20], [880, 250, 17], [420, 250, 12], [700, 610, 10], [300, 560, 12], [760, 120, 11], [990, 520, 9], [470, 640, 8], [640, 300, 8], [1010, 120, 10]].map(([x, y, r]) => [x, y + DY, r])
    .concat([[640, 360, 18], [220, 220, 14], [930, 90, 10], [420, 520, 9], [100, 520, 8], [820, 470, 12], [340, 80, 9]]);
  for (const [x, y, r] of stars) {
    for (let k = 3; k >= 1; k--) ref.tint({ circle: [x, y, r * (1.6 + k * 1.1)] }, k % 2 ? '#e8d890' : '#9cc0e8', 0.12 + 0.05 * k);
    star(ref, x, y, r, { group: 'star' + x + '_' + y, gmul: 1 });
  }
  // crescent moon above the left roofs
  const moon = [150, 150 + DY];
  ref.fill({ circle: [...moon, 70] }, { rad: [...moon, 20, ...moon, 70], stops: [[0, 'rgba(250,210,120,0.8)'], [1, 'rgba(40,70,140,0)']] }, { maxR: 10, dir: 'edge', group: 'moonhalo' });
  const mx = moon[0], my = moon[1];
  ref.fill([[mx, my - 46], [mx + 30, my - 30, mx + 46, my + 20, mx + 18, my + 50], [mx + 42, my + 22, mx + 26, my - 28, mx, my - 46]], '#fbe7a0', { maxR: 4, edge: 1.5, group: 'moon' });
  ref.fill([[mx, my - 46], [mx + 46, my - 30, mx + 50, my + 36, mx + 10, my + 50], [mx + 26, my + 30, mx + 32, my - 24, mx, my - 46]], '#fff4c8', { maxR: 4, edge: 1.5, group: 'moon' });

  // ── the cathedral at the far side of the square (Z = 26) ──
  const Zc = 26, stone = { lin: [0, 180 + DY, 0, 1280 + DY], stops: [[0, '#6f7fae'], [0.5, '#9a95a8'], [0.85, '#c8b4a0'], [1, '#d8c0a0']] };
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -9 : 5, x1 = s < 0 ? -5 : 9;
    ref.fill(wallX(P, Zc, x0, x1, 0, 31), stone, { dir: Math.PI / 2, maxR: 18, group: 'cath' });
    ref.fill([P(x0 - 0.3, 31, Zc), P(x1 + 0.3, 31, Zc), P((x0 + x1) / 2, 40, Zc)], { lin: [0, 150 + DY, 0, 380 + DY], stops: [[0, '#4a5a8c'], [1, '#7a86b0']] }, { dir: Math.PI / 2, maxR: 10, edge: 2, group: 'spire' + s });
    ref.fill(wallX(P, Zc, x0 - 0.3, x1 + 0.3, 30.4, 31.2), '#c9c0b4', { maxR: 4, edge: 1.5, group: 'cornice' });
    for (const xb of [x0 + 0.8, x0 + 2.3]) ref.fill([P(xb, 22, Zc), P(xb + 0.9, 22, Zc), P(xb + 0.9, 27, Zc), [P(xb + 0.9, 27.6, Zc)[0], P(xb + 0.45, 28, Zc)[1], ...P(xb, 27, Zc)]], '#1a2140', { maxR: 4, edge: 1.5, group: 'belfry' });
    for (const yy of [8, 14]) ref.fill([P(x0 + 1.6, yy, Zc), P(x0 + 2.4, yy, Zc), P(x0 + 2.4, yy + 2.6, Zc), P(x0 + 1.6, yy + 2.6, Zc)], '#2a2f50', { maxR: 4, edge: 1.5, group: 'twin' });
  }
  ref.fill(wallX(P, Zc, -5, 5, 0, 19), stone, { dir: Math.PI / 2, maxR: 18, group: 'cath' });
  ref.fill([P(-5.3, 19, Zc), P(5.3, 19, Zc), P(0, 23, Zc)], { lin: [0, 600 + DY, 0, 760 + DY], stops: [[0, '#7a86b0'], [1, '#a59cb0']] }, { maxR: 10, edge: 2, group: 'gable' });
  const [rx, ry] = P(0, 13, Zc), rr = 3 * P.s(Zc);
  ref.fill({ circle: [rx, ry, rr * 1.12] }, '#cfc3b2', { maxR: 5, edge: 1.5, group: 'roseF' });
  ref.fill({ circle: [rx, ry, rr] }, { rad: [rx, ry, 4, rx, ry, rr], stops: [[0, '#c8a8d8'], [0.5, '#6a5aa8'], [1, '#2a2f6a']] }, { maxR: 5, edge: 1.5, group: 'rose', dir: 'edge' });
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ref.line([[rx, ry], [rx + Math.cos(a) * rr, ry + Math.sin(a) * rr]], 1.6, '#2a2440', { type: 3 }); }
  ref.line(ellipsePts(rx, ry, rr * 0.45, rr * 0.45, 24).concat([[rx + rr * 0.45, ry]]), 1.6, '#2a2440', { type: 3 });
  for (let k = 0; k < 9; k++) { const x = -4.4 + k * 1.1; ref.fill([P(x, 8.6, Zc), P(x + 0.7, 8.6, Zc), P(x + 0.7, 9.8, Zc), P(x + 0.35, 10.2, Zc), P(x, 9.8, Zc)], '#2b3058', { maxR: 3, edge: 1, group: 'gal' }); }
  const arch = (hw, spring) => { const pts = [P(-hw, 0, Zc), P(hw, 0, Zc)]; for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI; pts.push(P(Math.cos(a) * hw, spring + Math.sin(a) * hw, Zc)); } return pts; };
  ref.fill(arch(2.7, 4.6), '#8a6a50', { maxR: 5, edge: 1.5, group: 'portalF' });
  ref.fill(arch(1.8, 4.4), { lin: [0, 1150 + DY, 0, 1400 + DY], stops: [[0, '#5a3e30'], [1, '#3a2820']] }, { maxR: 5, edge: 1.5, group: 'portal', dir: Math.PI / 2 });
  ref.line([P(0, 0, Zc), P(0, 6.2, Zc)], 2, '#22160f', { type: 3 });
  ref.fill(wallX(P, Zc, -9.5, 9.5, 0, 0.8), '#b8a690', { maxR: 4, edge: 1.5, group: 'steps' });
  for (let yy = 1.5; yy < 31; yy += 1.1) ref.tint([P(-9, yy, Zc), P(9, yy, Zc), P(9, yy - 0.08, Zc), P(-9, yy - 0.08, Zc)], '#4a4a6a', 0.18);
  for (const k of [1, 2]) { const hw = 1.8 + k * 0.3, pts = [P(-hw, 0, Zc)]; for (let j = 0; j <= 16; j++) { const a = Math.PI - j / 16 * Math.PI; pts.push(P(Math.cos(a) * hw, 4.4 + Math.sin(a) * hw, Zc)); } pts.push(P(hw, 0, Zc)); ref.line(pts, 2, '#5a4a40', { type: 3 }); }
  { const [cx, cy] = P(-7, 18, Zc), cr = 1.1 * P.s(Zc); ref.fill({ circle: [cx, cy, cr] }, '#e8e0c8', { maxR: 4, edge: 1.2, group: 'clock' }); ref.line([[cx, cy], [cx, cy - cr * 0.7]], 2, '#2a2430', { type: 3 }); ref.line([[cx, cy], [cx + cr * 0.5, cy + cr * 0.2]], 2, '#2a2430', { type: 3 }); }
  for (const xs of [-3.6, -2.9, 2.9, 3.6]) ref.fill([P(xs - 0.25, 1, Zc), P(xs + 0.25, 1, Zc), P(xs + 0.25, 3.4, Zc), P(xs, 3.8, Zc), P(xs - 0.25, 3.4, Zc)], '#c8b49a', { maxR: 3, edge: 1, group: 'statue' });

  // ── end walls facing the square ──
  ref.fill(wallX(P, 17, -14, -6.2, 0, 13.5), { lin: [0, 700 + DY, 0, 1290 + DY], stops: [[0, '#3b4a7e'], [1, '#8a7a8a']] }, { dir: Math.PI / 2, maxR: 18, group: 'endL' });
  for (const [x0, y0] of [[-11, 5], [-8.6, 5], [-11, 8.4], [-8.6, 8.4]]) ref.fill(wallX(P, 17, x0, x0 + 1.2, y0, y0 + 2), '#1e2546', { maxR: 4, edge: 1.5, group: 'endLw' });
  ref.fill(wallX(P, 18, 7, 13, 0, 12), { lin: [0, 800 + DY, 0, 1290 + DY], stops: [[0, '#3c5f78'], [1, '#6d7f8a']] }, { dir: Math.PI / 2, maxR: 18, group: 'endR' });
  for (const [x0, y0] of [[8.2, 4.8], [10.4, 4.8], [8.2, 8], [10.4, 8]]) ref.fill(wallX(P, 18, x0, x0 + 1.1, y0, y0 + 2), '#1b2442', { maxR: 4, edge: 1.5, group: 'endRw' });

  // ── the square: lilac and blue cobbles, puddles holding the sky, the festival's confetti ──
  ref.fill([[0, 1370 + DY], [W, 1370 + DY], [W, H], [0, H]], { lin: [0, 1370 + DY, 0, H], stops: [[0, '#6c6a96'], [0.4, '#5d5f93'], [1, '#4a4f86']] }, { dir: 0, maxR: 22, group: 'ground' });
  const r = rnd(11);
  for (let z = 2.3; z < 26; z += 0.32 * (1 + z * 0.02)) for (let x = -7.5 + (Math.round(z * 3) % 2) * 0.17; x < 8; x += 0.34) {
    const [px, py] = P(x, 0, z), s = P.s(z), w = 0.14 * s, h = w * 1.6 / z;
    if (w < 1.6 || px < -10 || px > W + 10) continue;
    ref.tint({ ellipse: [px, py, w, Math.max(0.8, h), 0] }, r() < 0.5 ? '#a8a4cc' : '#8c8cc0', 0.28 + r() * 0.2);
  }
  const puddles = [];
  for (const [X, z, w, d] of [[-0.6, 5.2, 1.6, 0.9], [2.2, 9.5, 1.3, 0.8], [-2.0, 13, 1.1, 0.7]]) {
    const pts = ellipsePts(0, 0, w, d, 24, 0.1, 0.25, X * 3).map(([u, v]) => P(X + u, 0, z + v));
    ref.fill(pts, { lin: [0, P(0, 0, z + d)[1], 0, P(0, 0, z - d)[1]], stops: [[0, '#2a4a8c'], [1, '#5a7ab8']] }, { dir: 0, maxR: 8, edge: 1.5, group: 'puddle' + z });
    puddles.push([...P(X, 0, z), P.s(z) * w]);
  }
  const cr = rnd(23);
  for (let i = 0; i < 260; i++) {   // confetti left from the festival
    const z = 2.4 + Math.pow(cr(), 1.4) * 20, X = -7 + cr() * 15, [px, py] = P(X, 0, z), s = P.s(z);
    if (px < 0 || px > W) continue;
    ref.tint({ ellipse: [px, py, Math.max(1.5, s * 0.05), Math.max(1, s * 0.022), cr() * 3] }, pick(cr, ['#e85a5a', '#f2c14e', '#5ab0e0', '#f0f0e8', '#e890c0', '#6ac08a']), 0.9);
  }
  // fountain
  const Zf = 21.5, Xf = 0.8, [fx, fy] = P(Xf, 0.65, Zf), fs = P.s(Zf);
  ref.fill({ ellipse: [fx, fy + fs * 0.32, fs * 2.4, fs * 0.42, 0] }, '#9a8e88', { maxR: 6, edge: 1.5, group: 'basin' });
  ref.fill([[fx - fs * 2.4, fy + fs * 0.32], [fx + fs * 2.4, fy + fs * 0.32], [fx + fs * 2.4, fy + fs * 0.85], [fx - fs * 2.4, fy + fs * 0.85]], { lin: [fx - fs * 2.4, 0, fx + fs * 2.4, 0], stops: [[0, '#a89a98'], [0.5, '#b7a8a0'], [1, '#7a7a9a']] }, { maxR: 6, edge: 1.5, group: 'basinS' });
  ref.fill({ ellipse: [fx, fy + fs * 0.32, fs * 2.1, fs * 0.3, 0] }, '#3d5a8a', { maxR: 5, edge: 1.5, group: 'water' });
  ref.fill([[fx - fs * 0.22, fy + fs * 0.3], [fx + fs * 0.22, fy + fs * 0.3], [fx + fs * 0.16, fy - fs * 1.6], [fx - fs * 0.16, fy - fs * 1.6]], '#a89a90', { maxR: 4, edge: 1.2, group: 'col' });
  ref.fill({ ellipse: [fx, fy - fs * 1.6, fs * 0.8, fs * 0.16, 0] }, '#b8a898', { maxR: 4, edge: 1.2, group: 'bowl' });
  for (let k = -3; k <= 3; k++) ref.line([[fx, fy - fs * 1.75], [fx + k * fs * 0.25, fy - fs * 2.1], [fx + k * fs * 0.5, fy - fs * 1.65]], 1.4, '#cfe0f0', { type: 3 });

  // ── right side: three tall houses, blue and violet under the moon, iron balconies with flowers ──
  const houses = [[9, 13, 14, '#4d5d8a', '#2f6a4a'], [13, 15.6, 15.5, '#5b5486', '#3a5a8a'], [15.6, 18, 12, '#3f6a7a', '#2f6a4a']];
  houses.forEach(([z0, z1, hgt, col, sh], hi) => {
    const X = 7;
    ref.fill(wallZ(P, X, z0, z1, 0, hgt), { lin: [...P(X, hgt, z0), ...P(X, 0, z0)], stops: [[0, mixh(col, '#1a2050', 0.2)], [0.75, col], [1, mixh(col, '#9a90a8', 0.35)]] }, { dir: (x, y) => Math.atan2(P.hz - y, P.cx - x), maxR: 22, group: 'house' + hi });
    ref.fill(wallZ(P, X, z0, z1, hgt - 0.5, hgt), '#c8c0b8', { maxR: 4, edge: 1.5, group: 'corn' + hi });
    ref.fill([P(X, hgt, z0), P(X, hgt, z1), P(X - 0.45, hgt + 0.12, z1), P(X - 0.45, hgt + 0.12, z0)], '#5a2e28', { maxR: 4, edge: 1.5, group: 'eave' + hi });
    for (let z = z0 + 0.2; z < z1; z += 0.35) ref.tint([P(X, hgt, z), P(X - 0.45, hgt + 0.12, z), P(X - 0.45, hgt + 0.12, z + 0.12), P(X, hgt, z + 0.12)], '#a85a3a', 0.6);
    const bays = Math.round((z1 - z0) / 1.9), bw = (z1 - z0) / bays;
    for (let b = 0; b < bays; b++) {
      const zc = z0 + (b + 0.5) * bw;
      for (const fy0 of [4.6, 7.7, 10.8]) { if (fy0 + 2.4 > hgt - 0.6) continue; windowZ(ref, P, X, zc - 0.5, zc + 0.5, fy0, fy0 + 2.1, { lit: false, shutter: sh, group: 'w' + hi }); }
      ref.fill([P(X, 0, zc - 0.6), P(X, 0, zc + 0.6), P(X, 2.6, zc + 0.6), P(X, 3.1, zc), P(X, 2.6, zc - 0.6)], '#2a2238', { maxR: 5, edge: 1.5, group: 'door' + hi });
    }
    balconyZ(ref, P, X, z0 + 0.3, z1 - 0.3, 4.3, 0.7, { seed: 20 + hi });
    if (hgt > 13) balconyZ(ref, P, X, z0 + 0.6, z1 - 0.6, 10.5, 0.5, { seed: 40 + hi, flowers: ['#f0f0f0', '#e06aa0', '#d8323a'] });
  });

  // ── left side: the café, closed for the night; one window high up still warm ──
  const XL = -6.2, zA = 8.4, zB = 17;
  ref.fill(wallZ(P, XL, zA, zB, 0, 13.5), { lin: [...P(XL, 13.5, 10), ...P(XL, 0, 10)], stops: [[0, '#2f3f78'], [0.55, '#5a5a80'], [0.8, '#8a6a70'], [1, '#9a7a70']] }, { dir: (x, y) => Math.atan2(P.hz - y, P.cx - x), maxR: 22, group: 'cafe' });
  ref.fill(wallZ(P, XL, zA, zB, 13, 13.5), '#c8c0b8', { maxR: 4, edge: 1.5, group: 'cornL' });
  ref.fill([P(XL, 13.5, zA), P(XL, 13.5, zB), P(XL + 0.45, 13.62, zB), P(XL + 0.45, 13.62, zA)], '#5a2e28', { maxR: 4, edge: 1.5, group: 'eaveL' });
  for (let z = zA + 0.2; z < zB; z += 0.35) ref.tint([P(XL, 13.5, z), P(XL + 0.45, 13.62, z), P(XL + 0.45, 13.62, z + 0.12), P(XL, 13.5, z + 0.12)], '#a85a3a', 0.6);
  let warmQ = null;
  for (let b = 0; b < 4; b++) {
    const zc = zA + 1.1 + b * 2.1;
    for (const fy0 of [5, 8.2]) {
      windowZ(ref, P, XL, zc - 0.5, zc + 0.5, fy0, fy0 + 2.1, { lit: false, shutter: '#3a6a5a', group: 'wl' });
      if (b === 3 && fy0 > 8) warmQ = wallZ(P, XL, zc - 0.5, zc + 0.5, fy0, fy0 + 2.1);
    }
    ref.fill([P(XL, 0, zc - 0.7), P(XL, 0, zc + 0.7), P(XL, 3.2, zc + 0.7), P(XL, 3.2, zc - 0.7)], '#3a2c28', { maxR: 5, edge: 1.5, group: 'cdoor' });
    for (let q = 1; q < 6; q++) ref.tint([P(XL, q * 0.53, zc - 0.7), P(XL, q * 0.53, zc + 0.7), P(XL, q * 0.53 - 0.06, zc + 0.7), P(XL, q * 0.53 - 0.06, zc - 0.7)], '#1a1210', 0.6);
  }
  balconyZ(ref, P, XL, zA + 0.4, zB - 1.2, 7.9, 0.6, { seed: 60, flowers: ['#d8323a', '#f07a5a', '#ffffff'] });
  const Xo = -2.5, yIn = 4.3, yOut = 2.55;
  ref.fill([P(XL, yIn, zA), P(XL, yIn, 16), P(Xo, yOut, 16), P(Xo, yOut, zA)], { lin: [...P(XL, yIn, 10), ...P(Xo, yOut, 10)], stops: [[0, '#f2d860'], [1, '#e8c040']] }, { dir: (x, y) => Math.atan2(P.hz - y, P.cx - x), maxR: 14, group: 'awning' });
  for (let z = zA + 0.3; z < 16; z += 0.9) ref.tint([P(XL, yIn, z), P(XL, yIn, z + 0.4), P(Xo, yOut, z + 0.4), P(Xo, yOut, z)], '#c89a30', 0.5);
  const val = [];
  for (let i = 0; i <= 28; i++) { const z = zA + (16 - zA) * i / 28; val.push(P(Xo, yOut - 0.32 - (i % 2 ? 0.12 : 0), z)); }
  ref.fill([P(Xo, yOut, zA), P(Xo, yOut, 16), ...val.reverse()], '#e8c040', { maxR: 6, edge: 1.5, group: 'valance' });
  for (let z = zA; z < 16; z += 0.9) ref.tint([P(Xo, yOut + 0.02, z), P(Xo, yOut + 0.02, z + 0.45), P(Xo, yOut - 0.48, z + 0.45), P(Xo, yOut - 0.48, z)], '#c8682a', 0.85);
  // tables and chairs on the terrace, left out after the festival
  for (const [X, z] of [[-4.9, 9.4], [-3.4, 10.4], [-4.9, 11.9], [-3.5, 13.1], [-4.8, 14.6]]) {
    const [tx, ty] = P(X, 0.75, z), s = P.s(z), [, gy] = P(X, 0, z);
    for (const sx of [-1, 1]) {
      const cx0 = tx + sx * s * 0.55, sy = P(X, 0.45, z)[1], by = P(X, 0.95, z)[1], cw = s * 0.36;
      for (const lx of [cx0 - cw / 2 + 2, cx0 + cw / 2 - 2]) ref.line([[lx, gy], [lx, sy]], Math.max(1, s * 0.03), '#3a2a20', { type: 3 });
      ref.fill({ ellipse: [cx0, sy, cw / 2, Math.max(2, s * 0.05), 0] }, '#8a5a2e', { maxR: 3, edge: 1, group: 'chair' });
      ref.fill([[cx0 + sx * cw * 0.15, sy], [cx0 + sx * cw * 0.5, sy], [cx0 + sx * cw * 0.55, by], [cx0 + sx * cw * 0.2, by]], '#6a4226', { maxR: 3, edge: 1, group: 'chairB' });
    }
    ref.line([[tx, ty], [tx, gy]], Math.max(1.2, s * 0.045), '#2a2020', { type: 3 });
    ref.fill({ ellipse: [tx, gy, s * 0.2, Math.max(1.5, s * 0.03), 0] }, '#2a2020', { maxR: 3, edge: 1, group: 'tfoot' });
    ref.fill({ ellipse: [tx, ty, s * 0.42, Math.max(2.5, s * 0.1), 0] }, '#d8d0c0', { maxR: 4, edge: 1.2, group: 'table' });
  }
  // a gas lamp on the right, unlit
  const [px0, py0] = P(3.7, 0, 7.6), [px1, py1] = P(3.7, 3.6, 7.6), ps = P.s(7.6);
  ref.line([[px0, py0], [px1, py1]], ps * 0.09, '#1c1a24', { area: true, group: 'post' });
  ref.fill({ rect: [px0 - ps * 0.14, py0 - ps * 0.5, ps * 0.28, ps * 0.5] }, '#24222e', { maxR: 4, edge: 1.2, group: 'post' });
  ref.fill([[px1 - ps * 0.22, py1], [px1 + ps * 0.22, py1], [px1 + ps * 0.3, py1 - ps * 0.55], [px1 - ps * 0.3, py1 - ps * 0.55]], { lin: [px1, py1 - ps * 0.55, px1, py1], stops: [[0, '#8a9ab8'], [1, '#4a5470']] }, { maxR: 4, edge: 1.2, group: 'glass' });
  ref.fill([[px1 - ps * 0.36, py1 - ps * 0.55], [px1 + ps * 0.36, py1 - ps * 0.55], [px1, py1 - ps * 0.8]], '#1c1a24', { maxR: 3, edge: 1, group: 'cap' });
  // foreground: the flower seller's cart and terracotta pots
  const Zk = 4.6, ks = P.s(Zk), [kx0, ky0] = P(-2.7, 1.0, Zk), [kx1, ky1] = P(-0.7, 0.45, Zk);
  ref.fill({ rect: [kx0, ky0, kx1 - kx0, ky1 - ky0] }, { lin: [kx0, 0, kx1, 0], stops: [[0, '#6a3a1e'], [1, '#a8662e']] }, { dir: 0, maxR: 8, edge: 2, group: 'cart' });
  for (let k = 1; k < 4; k++) ref.tint({ rect: [kx0, ky0 + (ky1 - ky0) * k / 4, kx1 - kx0, 2] }, '#3a200e', 0.6);
  for (const wx of [kx0 + ks * 0.35, kx1 - ks * 0.35]) {
    const cy = P(0, 0.3, Zk)[1];
    ref.fill({ circle: [wx, cy, ks * 0.3] }, '#3a2414', { maxR: 5, edge: 1.5, group: 'wheel' });
    ref.fill({ circle: [wx, cy, ks * 0.22] }, '#8a5a30', { maxR: 4, edge: 1.2, group: 'wheelI' });
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ref.line([[wx, cy], [wx + Math.cos(a) * ks * 0.22, cy + Math.sin(a) * ks * 0.22]], 2, '#3a2414', { type: 3 }); }
  }
  const fr = rnd(17);
  for (let i = 0; i < 6; i++) {
    const bx = kx0 + (i + 0.5) * (kx1 - kx0) / 6, bw = (kx1 - kx0) / 6 * 0.8, by = ky0;
    ref.fill([[bx - bw / 2, by], [bx + bw / 2, by], [bx + bw * 0.42, by - ks * 0.28], [bx - bw * 0.42, by - ks * 0.28]], i % 2 ? '#6a7a8a' : '#8a8a96', { maxR: 4, edge: 1.2, group: 'bucket' });
    const kind = ['sun', 'iris', 'lav', 'sun', 'rose', 'lav'][i];
    for (let j = 0; j < 16; j++) {
      const sx = bx + (fr() - 0.5) * bw * 1.5, sy = by - ks * (0.4 + fr() * 0.6);
      ref.fill(ellipsePts(bx + (sx - bx) * 0.5, by - ks * 0.3 - (by - sy) * 0.3, ks * 0.06, ks * 0.025, 8, fr() * 3, 0.1, j), '#4a7a32', { maxR: 3, edge: 1, group: 'leafc' });
      ref.line([[bx + (fr() - 0.5) * bw * 0.5, by - ks * 0.25], [sx, sy]], 2, '#3a6a2a', { type: 3 });
      if (kind === 'sun') { ref.fill({ circle: [sx, sy, ks * 0.11] }, '#f6c228', { maxR: 4, edge: 1.2, group: 'sunp' }); ref.fill({ circle: [sx, sy, ks * 0.04] }, '#6a3a12', { maxR: 2.6, edge: 1, group: 'sunc' }); }
      else if (kind === 'iris') ref.fill(ellipsePts(sx, sy, ks * 0.05, ks * 0.08, 10, fr(), 0.2, j), '#5a4ab0', { maxR: 3, edge: 1, group: 'iris' });
      else if (kind === 'lav') ref.line([[sx, sy], [sx + (fr() - 0.5) * 6, sy - ks * 0.2]], 7, '#8a6ac8', { type: 3 });
      else ref.fill({ circle: [sx, sy, ks * 0.075] }, pick(fr, ['#d8283a', '#f0f0e8', '#f07a8a']), { maxR: 3, edge: 1, group: 'rose' });
    }
  }
  const Zp = 3.3, pss = P.s(Zp);
  for (const [X, col] of [[2.15, '#b8582e'], [2.85, '#a84a28']]) {
    const [p0x, p0y] = P(X, 0, Zp), [, p1y] = P(X, 0.55, Zp), pw = pss * 0.26;
    ref.fill([[p0x - pw * 0.75, p0y], [p0x + pw * 0.75, p0y], [p0x + pw, p1y], [p0x - pw, p1y]], { lin: [p0x - pw, 0, p0x + pw, 0], stops: [[0, mixh(col, '#ffd090', 0.3)], [1, col]] }, { maxR: 6, edge: 1.5, group: 'pot' });
    ref.fill({ rect: [p0x - pw * 1.08, p1y - pss * 0.06, pw * 2.16, pss * 0.07] }, mixh(col, '#000', 0.15), { maxR: 4, edge: 1.2, group: 'potrim' });
    for (let j = 0; j < 30; j++) { const a = -Math.PI / 2 + (fr() - 0.5) * 1.7, L = pss * (0.35 + fr() * 0.45), x1 = p0x + Math.cos(a) * L, y1 = p1y + Math.sin(a) * L; ref.line([[p0x + (fr() - 0.5) * pw, p1y], [x1, y1]], 3, '#4a6a3a', { type: 3 }); ref.line([[x1, y1], [x1 + Math.cos(a) * pss * 0.1, y1 + Math.sin(a) * pss * 0.1]], 6, X < 2.5 ? '#9a7ad8' : '#e8607a', { type: 3 }); }
  }
  // the festival's strings of bulbs across the square (drawn live), its bunting, and a wire for the crows
  const strings = [9.2, 11.2, 13.4, 15.8].map((Z, i) => catenary(P(XL, 6.6 + i * 0.25, Z), P(7, 6.9 + i * 0.2, Z + 0.6), 1.1 * P.s(Z), 22));
  const bunting = catenary(P(XL, 7.6, 12.2), P(7, 7.9, 12.6), 1.4 * P.s(12.4), 30);
  ref.line(bunting, 1.5, '#2a2430', { type: 3 });
  bunting.forEach(([x, y], i) => { if (i % 2 || i === 0 || i === bunting.length - 1) return; const s = P.s(12.4) * 0.28; ref.fill([[x - s * 0.5, y], [x + s * 0.5, y], [x, y + s]], pick(cr, ['#e85a5a', '#f2c14e', '#5ab0e0', '#f0f0e8', '#6ac08a', '#e890c0']), { maxR: 3, edge: 1, group: 'flag' }); });
  for (const pts of strings) ref.line(pts, 1.4, '#1e1c26', { type: 3 });
  const wire = catenary(P(XL, 12.4, 9.6), P(7, 11.8, 10.4), 1.0 * P.s(10), 40);
  ref.line(wire, 1.8, '#15141c', { type: 3 });
  const warmC = [(warmQ[0][0] + warmQ[2][0]) / 2, (warmQ[0][1] + warmQ[2][1]) / 2];
  return { ref, w: W, h: H, R: R6, DY, moon, strings, wire, warmQ, warmC, lamp: [px1, py1 - ps * 0.28], puddles, P };
}

// ── the quay on the Rhône at night: a gas lamp, an empty bench, the far bank and its bridge ──
export const QUAY = { lamp: [850, 1012], seatY: 1640, bench: [520, 1640] };
export function plateQuay() {
  const W = 1080, H = 1920, ref = new Ref(W, H);
  ref.fill({ rect: [0, 0, W, 1000] }, { lin: [0, 0, 0, 1000], stops: [[0, '#141c3c'], [0.5, '#24305a'], [1, '#4a5480']] }, { dir: -0.05, maxR: 34, group: 'sky', jit: 0.04 });
  ref.tint({ circle: [760, 300, 260] }, { rad: [760, 300, 20, 760, 300, 260], stops: [[0, 'rgba(200,200,220,0.55)'], [1, 'rgba(40,50,90,0)']] }, 1);
  for (const [cx, cy, rx, ry, sd] of [[300, 180, 380, 46, 1], [820, 280, 300, 60, 2], [560, 470, 420, 40, 3], [180, 620, 260, 30, 4], [900, 700, 220, 26, 5]]) {
    ref.fill(ellipsePts(cx, cy, rx, ry, 30, -0.03, 0.25, sd), mixh('#1e2848', '#3a4670', 0.4), { dir: -0.03, maxR: 18, group: 'cloud' + sd });
    ref.fill(ellipsePts(cx + rx * 0.1, cy - ry * 0.45, rx * 0.65, ry * 0.3, 24, -0.03, 0.25, sd + 9), '#6a7498', { dir: -0.03, maxR: 8, group: 'cloud' + sd });
  }
  const sr = rnd(4);
  for (let i = 0; i < 18; i++) { const x = sr() * W, y = sr() * 760; ref.fill({ circle: [x, y, 2 + sr() * 2] }, '#e8e4d0', { maxR: 2.6, edge: 1, group: 'st' }); }
  // the far bank: roofs, a church tower, and a long bridge of stone arches on the right
  const fr = rnd(8);
  let x = -10;
  while (x < 700) {
    const w = 40 + fr() * 50, h = 50 + fr() * 70, y = 990;
    ref.fill({ rect: [x, y - h, w, h] }, mixh('#2a3254', '#3a4268', fr()), { maxR: 6, edge: 1.5, group: 'far' });
    ref.fill([[x - 4, y - h], [x + w + 4, y - h], [x + w / 2, y - h - 18]], '#1e2440', { maxR: 4, edge: 1.2, group: 'farR' });
    for (let k = 0; k < 2; k++) ref.fill({ rect: [x + 8 + k * w * 0.45, y - h + 14, 6, 9] }, '#1a1f36', { maxR: 2.6, edge: 1, group: 'farW' });
    x += w + 2;
  }
  ref.fill({ rect: [282, 800, 36, 190] }, '#2e3658', { maxR: 6, edge: 1.5, group: 'tower' });
  ref.fill([[278, 800], [322, 800], [300, 730]], '#1e2440', { maxR: 4, edge: 1.2, group: 'spire' });
  ref.fill({ rect: [294, 830, 12, 18] }, '#1a1f36', { maxR: 2.6, edge: 1, group: 'tw' });
  ref.fill([[620, 925], [1080, 905], [1080, 940], [620, 955]], '#4a4e6a', { dir: 0, maxR: 6, edge: 1.5, group: 'bridge' });
  for (let k = 0; k < 6; k++) {
    const ax = 660 + k * 76, ay = 950 - k * 3.5, rw = 30;
    const pts = [[ax - rw, 1000]]; for (let j = 0; j <= 10; j++) { const a = Math.PI - j / 10 * Math.PI; pts.push([ax + Math.cos(a) * rw, ay + 18 - Math.sin(a) * rw * 0.9]); } pts.push([ax + rw, 1000]);
    ref.fill([[ax - 38, 1000], [ax - 38, ay], [ax + 38, ay - 2], [ax + 38, 1000]], '#3e425e', { maxR: 6, edge: 1.5, group: 'pier' });
    ref.fill(pts, '#1a2036', { maxR: 4, edge: 1.2, group: 'arch' });
  }
  // the river: slow, dark, with the far bank in it
  ref.fill({ rect: [0, 990, W, 350] }, { lin: [0, 990, 0, 1340], stops: [[0, '#2a3458'], [1, '#1a2240']] }, { dir: 0, maxR: 16, group: 'river', aj: 0.05, len: [2.4, 4.2], wid: [0.6, 0.9] });
  for (let k = 0; k < 6; k++) reflect(ref, 660 + k * 76, 1000, 1090, 60, 'rgba(90,96,130,1)', 0.5, 50 + k);
  reflect(ref, QUAY.lamp[0], 1190, 1330, 46, 'rgba(255,200,120,1)', 0.6, 3);
  // a rowing boat tied to the quay
  ref.fill([[80, 1250], [380, 1240], [350, 1290], [110, 1296]], '#3a2c24', { maxR: 6, edge: 1.5, group: 'boat' });
  ref.fill([[90, 1250], [370, 1241], [360, 1254], [96, 1262]], '#7a6450', { maxR: 3, edge: 1, group: 'boatR' });
  ref.line([[360, 1244], [470, 1330]], 2, '#2a2420', { type: 3 });
  reflect(ref, 230, 1300, 1338, 240, 'rgba(30,26,30,1)', 0.5, 9);
  // the quay: wet cobbles, a warm pool of light under the lamp
  ref.fill({ rect: [0, 1410, W, 510] }, { lin: [0, 1410, 0, H], stops: [[0, '#4a4a62'], [1, '#33344a']] }, { dir: 0, maxR: 20, group: 'quay' });
  const cr = rnd(12);
  for (let row = 0; row < 26; row++) {
    const y = 1420 + Math.pow(row / 26, 1.6) * 500, h = 6 + row * 1.3, w = h * 2.4;
    for (let xx = (row % 2) * w * 0.5; xx < W; xx += w + 4) ref.tint({ ellipse: [xx, y, w * 0.45, h * 0.4, 0] }, cr() < 0.5 ? '#6a6a86' : '#2a2a3c', 0.35);
  }
  ref.tint({ ellipse: [QUAY.lamp[0] - 40, 1700, 380, 170, 0] }, { rad: [QUAY.lamp[0] - 40, 1700, 10, QUAY.lamp[0] - 40, 1700, 380], stops: [[0, 'rgba(255,200,120,0.75)'], [1, 'rgba(255,200,120,0)']] }, 1);
  for (let k = 0; k < 3; k++) reflect(ref, QUAY.lamp[0] - 20 + k * 30, 1770, 1920, 30, 'rgba(255,214,140,1)', 0.45, 20 + k);
  // the railing: an iron rail on posts, rings between
  ref.fill({ rect: [0, 1395, W, 22] }, '#5a5a70', { maxR: 6, edge: 1.5, group: 'kerb' });
  ref.line([[0, 1336], [W, 1336]], 7, '#16151c', { area: true, group: 'rail' });
  ref.line([[0, 1366], [W, 1366]], 4, '#16151c', { area: true, group: 'rail' });
  for (let px = 20; px < W; px += 72) { ref.line([[px, 1334], [px, 1398]], 6, '#16151c', { area: true, group: 'rail' }); if (px > 150) ref.line(ellipsePts(px + 36, 1351, 11, 11, 14).concat([[px + 47, 1351]]), 2.5, '#16151c', { type: 3 }); }
  // the bench: iron frame, wooden slats
  const [bx, by] = QUAY.bench;
  ref.tint({ ellipse: [bx + 30, by + 60, 300, 26, 0] }, '#1a1a26', 0.55);
  for (const lx of [bx - 230, bx + 230]) { ref.line([[lx, by + 70], [lx + 10, by - 4], [lx + 4, by - 120]], 8, '#16151c', { area: true, group: 'bframe' }); }
  for (let k = 0; k < 3; k++) ref.fill([[bx - 250, by - 16 + k * 10], [bx + 250, by - 16 + k * 10], [bx + 252, by - 8 + k * 10], [bx - 252, by - 8 + k * 10]], k % 2 ? '#5a3e2a' : '#6a4a32', { maxR: 4, edge: 1.2, group: 'seat' });
  for (let k = 0; k < 3; k++) ref.fill({ rect: [bx - 246, by - 120 + k * 26, 492, 16] }, k % 2 ? '#5a3e2a' : '#6a4a32', { maxR: 4, edge: 1.2, group: 'back' });
  // the gas lamp: a fluted iron post, a four-paned lantern, warm
  const [lx, ly] = QUAY.lamp;
  ref.fill([[lx - 22, 1780], [lx + 22, 1780], [lx + 14, 1730], [lx - 14, 1730]], '#1c1b24', { maxR: 4, edge: 1.2, group: 'lpost' });
  ref.line([[lx, 1735], [lx, 1070]], 12, '#1c1b24', { area: true, group: 'lpost' });
  ref.fill([[lx - 30, 1068], [lx + 30, 1068], [lx + 40, 975], [lx - 40, 975]], { rad: [lx, 1020, 4, lx, 1020, 60], stops: [[0, '#fffbe6'], [0.6, '#ffd070'], [1, '#e8a040']] }, { maxR: 4, edge: 1.2, group: 'lglass', gmul: 0 });
  ref.line([[lx, 975], [lx, 1068]], 3, '#2a2430', { type: 3 });
  ref.fill([[lx - 50, 975], [lx + 50, 975], [lx, 935]], '#1c1b24', { maxR: 3, edge: 1, group: 'lcap' });
  ref.fill({ rect: [lx - 34, 1066, 68, 8] }, '#1c1b24', { maxR: 2.6, edge: 1, group: 'lcap' });
  const wire = catenary([lx, 940], [-40, 860], 64, 40);
  ref.line(wire, 2, '#121118', { type: 3 });
  // a plane tree on the left: mottled trunk, branches across the top, the last leaves
  const tr = rnd(31);
  ref.fill([[0, 1920], [150, 1920], [140, 1500], [120, 1100], [96, 700], [60, 300], [0, 200]], { lin: [0, 0, 150, 0], stops: [[0, '#3a3a3a'], [0.6, '#7a7468'], [1, '#5a564e']] }, { dir: Math.PI / 2, maxR: 12, group: 'trunk' });
  for (let i = 0; i < 40; i++) { const y = 260 + tr() * 1600, x = tr() * 120; ref.tint(ellipsePts(x, y, 18 + tr() * 26, 12 + tr() * 20, 10, tr(), 0.3, i), tr() < 0.5 ? '#b8b0a0' : '#4a4640', 0.6); }
  for (const pts of [[[96, 700], [300, 520], [520, 470]], [[80, 480], [260, 300], [460, 220], [640, 180]], [[60, 300], [200, 140], [380, 60]], [[300, 520], [420, 600], [520, 610]], [[260, 300], [360, 360]]]) ref.line(pts, pts.length > 3 ? 18 : 12, '#3a3632', { area: true, group: 'branch' });
  for (let i = 0; i < 70; i++) { const x = 60 + tr() * 600, y = 60 + tr() * 600 - x * 0.2; if (y < 20) continue; ref.fill(ellipsePts(x, y, 9 + tr() * 6, 6 + tr() * 4, 8, tr() * 3, 0.2, i), pick(tr, ['#c8902e', '#a8682a', '#d8a840', '#7a6a3a']), { maxR: 3, edge: 1, group: 'leaf' }); }
  for (let i = 0; i < 40; i++) { const x = 100 + tr() * 900, y = 1450 + tr() * 460, s = 0.5 + (y - 1450) / 460; ref.fill(ellipsePts(x, y, 10 * s, 5 * s, 8, tr() * 3, 0.2, i), pick(tr, ['#a8682a', '#c8902e', '#7a5a2a']), { maxR: 3, edge: 1, group: 'fallen' }); }
  for (const [wx, wy] of [[180, 938], [470, 950]]) ref.fill({ rect: [wx, wy, 7, 10] }, '#f2b860', { maxR: 2.6, edge: 1, group: 'farLit', gmul: 0 });
  return { ref, w: W, h: H, R: R6, wire };
}

// ── a window in the old town: stone, blue shutters, lace, sunflowers on the sill, wisteria above, a puddle below ──
export const WIN = { lamp: [468, 1286], sill: 1292, perch: [712, 1290], puddle: [540, 2350], open: [330, 700, 750, 1290] };
export function plateWindow3() {
  const W = 1080, H = 2600, ref = new Ref(W, H);
  const [ox0, oy0, ox1, oy1] = WIN.open;
  // the wall: warm stone gone blue in the night, laid in uneven blocks
  ref.fill({ rect: [0, 0, W, 1960] }, { lin: [0, 0, 0, 1960], stops: [[0, '#5a5a70'], [0.5, '#7a7080'], [1, '#6a6070']] }, { dir: 0, maxR: 24, group: 'wall' });
  const br = rnd(5);
  for (let y = 0; y < 1960; y += 46 + br() * 10) for (let x = (br() * 60) | 0; x < W; x += 90 + br() * 60) {
    const w = 70 + br() * 60, h = 38 + br() * 10;
    ref.tint({ rect: [x, y, w, h] }, br() < 0.5 ? '#8a8090' : '#5a5466', 0.35);
    ref.tint({ rect: [x, y + h, w, 3] }, '#3a3444', 0.5);
  }
  // stone surround
  ref.fill({ rect: [ox0 - 42, oy0 - 46, ox1 - ox0 + 84, oy1 - oy0 + 60] }, { lin: [0, oy0, 0, oy1], stops: [[0, '#b8b0a8'], [1, '#948a88']] }, { maxR: 8, edge: 2, group: 'surround' });
  ref.fill({ rect: [ox0 - 60, oy0 - 70, ox1 - ox0 + 120, 30] }, '#a8a0a0', { maxR: 6, edge: 1.5, group: 'lintel' });
  // inside: a dim room, lace drawn aside, a small painting, a shelf of books
  ref.fill({ rect: [ox0, oy0, ox1 - ox0, oy1 - oy0] }, { rad: [WIN.lamp[0], WIN.lamp[1] - 120, 20, WIN.lamp[0], WIN.lamp[1] - 120, 520], stops: [[0, '#8a5a3a'], [0.4, '#5a3e30'], [1, '#2a2026']] }, { dir: Math.PI / 2, maxR: 14, group: 'room' });
  ref.fill({ rect: [560, 820, 120, 90] }, '#3a2a20', { maxR: 4, edge: 1.2, group: 'frame' });
  ref.fill({ rect: [570, 830, 100, 70] }, { lin: [570, 830, 570, 900], stops: [[0, '#2a4a8a'], [0.55, '#4a7aa8'], [0.56, '#d8a838'], [1, '#c88a28']] }, { maxR: 3, edge: 1, group: 'painting' });
  ref.fill({ rect: [600, 1010, 140, 10] }, '#4a3426', { maxR: 2.6, edge: 1, group: 'shelf' });
  for (let k = 0; k < 7; k++) ref.fill({ rect: [604 + k * 18, 966 + (k % 3) * 6, 14, 44 - (k % 3) * 6] }, ['#8a3a2a', '#3a5a7a', '#c8a050', '#5a6a3a', '#7a4a6a', '#a87a3a', '#3a3a5a'][k], { maxR: 2.6, edge: 1, group: 'book' });
  for (const [x0, x1, sg] of [[ox0, ox0 + 100, 1], [ox1 - 100, ox1, -1]]) {
    const pts = sg > 0 ? [[x0, oy0], [x1, oy0], [x0 + 46, oy0 + 300], [x0 + 70, oy1], [x0, oy1]] : [[x1, oy0], [x0, oy0], [x1 - 46, oy0 + 300], [x1 - 70, oy1], [x1, oy1]];
    ref.fill(pts, { lin: [x0, 0, x1, 0], stops: sg > 0 ? [[0, '#c8c0b4'], [1, '#e8e2d8']] : [[0, '#e8e2d8'], [1, '#c8c0b4']] }, { dir: Math.PI / 2, maxR: 8, group: 'lace' + sg });
    for (let k = 0; k < 7; k++) ref.tint([[sg > 0 ? x0 + k * 12 : x1 - k * 12, oy0], [sg > 0 ? x0 + k * 12 + 4 : x1 - k * 12 - 4, oy0], [sg > 0 ? x0 + 30 + k * 6 : x1 - 30 - k * 6, oy1], [sg > 0 ? x0 + 26 + k * 6 : x1 - 26 - k * 6, oy1]], '#9a948c', 0.4);
    ref.fill({ ellipse: [sg > 0 ? x0 + 52 : x1 - 52, oy0 + 300, 22, 8, 0] }, '#8a5a3a', { maxR: 2.6, edge: 1, group: 'tie' });
  }
  // the inner sill, a blue jug of sunflowers on it (the lamp stands at its left, drawn live)
  ref.fill({ rect: [ox0, oy1 - 18, ox1 - ox0, 18] }, '#6a5040', { maxR: 4, edge: 1.2, group: 'isill' });
  const jx = 640, jy = oy1 - 18;
  ref.fill([[jx - 30, jy], [jx + 30, jy], [jx + 38, jy - 60], [jx + 18, jy - 92], [jx - 18, jy - 92], [jx - 38, jy - 60]], { lin: [jx - 38, 0, jx + 38, 0], stops: [[0, '#3a5aa0'], [0.5, '#6a8ad0'], [1, '#2a3a7a']] }, { maxR: 4, edge: 1.2, group: 'jug' });
  ref.tint({ rect: [jx - 36, jy - 56, 72, 6] }, '#e8e8f0', 0.7);
  const sf = rnd(9);
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k - 2.5) * 0.28, L = 120 + sf() * 70, hx = jx + Math.cos(a) * L, hy = jy - 90 + Math.sin(a) * L;
    ref.line([[jx + (k - 2.5) * 5, jy - 90], [hx, hy + 12]], 4, '#4a6a2a', { type: 3 });
    ref.fill(ellipsePts((jx + hx) / 2 + (k % 2 ? 16 : -16), (jy - 90 + hy) / 2, 16, 7, 10, a + 1, 0.2, k), '#4a7a32', { maxR: 3, edge: 1, group: 'sleaf' });
    for (let p = 0; p < 14; p++) { const pa = p / 14 * Math.PI * 2; ref.fill(ellipsePts(hx + Math.cos(pa) * 20, hy + Math.sin(pa) * 20, 12, 5, 8, pa, 0.1, p), p % 2 ? '#f6c228' : '#f0a820', { maxR: 2.6, edge: 1, group: 'petal' }); }
    ref.fill({ circle: [hx, hy, 15] }, '#6a3a18', { maxR: 4, edge: 1, group: 'disc' });
  }
  // the blue shutters, folded back
  for (const [x0, x1] of [[ox0 - 200, ox0 - 46], [ox1 + 46, ox1 + 200]]) {
    ref.fill({ rect: [x0, oy0 - 10, x1 - x0, oy1 - oy0 + 20] }, { lin: [x0, 0, x1, 0], stops: [[0, '#2e6a7a'], [1, '#3a7a8a']] }, { dir: Math.PI / 2, maxR: 8, edge: 2, group: 'shutter' });
    for (let y = oy0 + 10; y < oy1; y += 22) ref.tint({ rect: [x0 + 10, y, x1 - x0 - 20, 6] }, '#1a3a48', 0.55);
    ref.tint({ rect: [x0, oy0 - 10, 8, oy1 - oy0 + 20] }, '#163038', 0.6);
  }
  // the outer sill and a box of red geraniums with ivy spilling down
  ref.fill([[ox0 - 60, oy1], [ox1 + 60, oy1], [ox1 + 70, oy1 + 38], [ox0 - 70, oy1 + 38]], '#b0a8a0', { maxR: 6, edge: 1.5, group: 'osill' });
  ref.fill({ rect: [ox0 - 10, oy1 + 38, ox1 - ox0 + 20, 70] }, { lin: [0, oy1 + 38, 0, oy1 + 108], stops: [[0, '#b8602e'], [1, '#8a4224']] }, { maxR: 6, edge: 1.5, group: 'box' });
  const gr = rnd(14);
  for (let i = 0; i < 60; i++) { const x = ox0 + gr() * (ox1 - ox0), y = oy1 + 34 - gr() * 40; ref.fill(ellipsePts(x, y, 12 + gr() * 8, 9 + gr() * 5, 9, gr() * 3, 0.25, i), gr() < 0.5 ? '#3a6a32' : '#4a7a3a', { maxR: 3, edge: 1, group: 'gleaf' }); }
  for (let i = 0; i < 26; i++) { const x = ox0 + 10 + gr() * (ox1 - ox0 - 20), y = oy1 + 10 - gr() * 50; for (let p = 0; p < 5; p++) ref.fill({ circle: [x + Math.cos(p * 1.26) * 7, y + Math.sin(p * 1.26) * 7, 6] }, pick(gr, ['#d8202a', '#e83a3a', '#c81828']), { maxR: 2.6, edge: 1, group: 'geranium' }); }
  for (let i = 0; i < 9; i++) { const x0 = ox0 + 20 + i * 48, pts = []; for (let k = 0; k <= 10; k++) pts.push([x0 + Math.sin(k * 0.7 + i) * 14, oy1 + 100 + k * 26]); ref.line(pts, 2.5, '#2e4a28', { type: 3 }); for (let k = 1; k < 10; k += 2) ref.fill(ellipsePts(pts[k][0] + 6, pts[k][1], 9, 6, 8, 0.5, 0.2, k + i * 10), '#3a6a32', { maxR: 2.6, edge: 1, group: 'ivy' }); }
  // the wisteria: a twisted vine climbing from the left and over the window, purple racemes hanging
  ref.line([[90, 1960], [130, 1600], [100, 1240], [160, 880], [220, 640], [400, 580], [640, 600], [880, 560], [1080, 600]], 26, '#4a3a30', { area: true, group: 'vine' });
  ref.line([[100, 1240], [40, 1100], [10, 980]], 14, '#4a3a30', { area: true, group: 'vine' });
  const wr = rnd(21);
  for (let i = 0; i < 46; i++) {
    const x = 160 + wr() * 900, y = 560 + Math.sin(x * 0.01) * 30 + wr() * 30, L = 80 + wr() * 110;
    for (let k = 0; k < 12; k++) { const t = k / 11, px = x + Math.sin(t * 3 + i) * 6, py = y + t * L, r = 11 * (1 - t * 0.7); ref.fill({ circle: [px + (wr() - 0.5) * 8, py, r] }, mixh('#8a6ad0', '#c8a8f0', wr()), { maxR: 3, edge: 1, group: 'wist' }); }
    ref.fill(ellipsePts(x + 20, y - 10, 22, 10, 10, wr(), 0.2, i), '#4a7a3a', { maxR: 3, edge: 1, group: 'wleaf' });
  }
  for (let i = 0; i < 30; i++) { const y = 700 + wr() * 1200, x = 100 + Math.sin(y * 0.01) * 50 + wr() * 60; ref.fill(ellipsePts(x, y, 18, 9, 10, wr() * 3, 0.2, i + 90), wr() < 0.5 ? '#3a6a32' : '#4a7a3a', { maxR: 3, edge: 1, group: 'vleaf' }); }
  // a drainpipe, the house number
  ref.line([[1010, 0], [1010, 1960]], 18, '#4a4a58', { area: true, group: 'pipe' });
  ref.fill({ rect: [880, 1460, 70, 56] }, '#2a5a8a', { maxR: 3, edge: 1, group: 'plaque' });
  ref.fill({ rect: [892, 1470, 46, 36] }, '#e8e4dc', { maxR: 2.6, edge: 1, group: 'plaqueI' });
  ref.line([[905, 1478], [905, 1498]], 3, '#2a5a8a', { type: 3 }); ref.line([[918, 1478], [928, 1478], [918, 1498], [928, 1498]], 3, '#2a5a8a', { type: 3 });
  // the street: cobbles, a puddle
  ref.fill({ rect: [0, 1940, W, 30] }, '#8a8090', { maxR: 6, edge: 1.5, group: 'kerb' });
  ref.fill({ rect: [0, 1970, W, H - 1970] }, { lin: [0, 1970, 0, H], stops: [[0, '#4a4a64'], [1, '#3a3a52']] }, { dir: 0, maxR: 20, group: 'street' });
  const cr = rnd(41);
  for (let row = 0; row < 18; row++) { const y = 1985 + row * 34 + row * row * 0.6, h = 12 + row * 1.2, w = h * 2.2; for (let x = (row % 2) * w * 0.5; x < W; x += w + 6) ref.tint({ ellipse: [x, y, w * 0.45, h * 0.4, 0] }, cr() < 0.5 ? '#6a6a86' : '#2a2a3c', 0.4); }
  const [qx, qy] = WIN.puddle;
  ref.fill(ellipsePts(qx, qy, 300, 90, 30, 0, 0.18, 3), { lin: [0, qy - 90, 0, qy + 90], stops: [[0, '#2a3a6a'], [1, '#3a4a7a']] }, { dir: 0, maxR: 10, edge: 2, group: 'puddle' });
  // the window, upside down in the puddle: stone, the dark room, the teal shutters, broken by ripples
  ref.tint({ rect: [qx - 250, qy - 70, 500, 120] }, '#8a8490', 0.35);
  ref.tint({ rect: [qx - 200, qy - 62, 400, 96] }, '#2a2026', 0.6);
  for (const x0 of [qx - 290, qx + 216]) ref.tint({ rect: [x0, qy - 70, 74, 120] }, '#2e6a7a', 0.5);
  for (let y = qy - 70; y < qy + 60; y += 8) ref.tint({ rect: [qx - 300, y, 600, 2] }, '#3a4a7a', 0.45);
  return { ref, w: W, h: H, R: R6 };
}

// ── the café terrace in the rain, close: the yellow awning, tables, an old coat on a chair, a red umbrella ──
export const CAFE = { table: [610, 1530], umbrella: [610, 1500], chair: [330, 1640], coatHook: [330, 1390], awningY: 760, lamp: [500, 600] };
export function plateCafe() {
  const W = 1080, H = 1920, ref = new Ref(W, H);
  // the café front: warm ochre wall, a tall glazed door bright inside, a window full of bottles
  ref.fill({ rect: [0, 0, W, 1260] }, { lin: [0, 0, 0, 1260], stops: [[0, '#3a3a5a'], [0.4, '#7a5a4a'], [1, '#b8783a']] }, { dir: Math.PI / 2, maxR: 22, group: 'wall' });
  const br = rnd(6);
  for (let y = 40; y < 1260; y += 50) for (let x = (br() * 80) | 0; x < W; x += 110 + br() * 50) ref.tint({ rect: [x, y, 90 + br() * 30, 42] }, br() < 0.5 ? '#c8905a' : '#6a4a3a', 0.25);
  ref.fill({ rect: [80, 400, 360, 780] }, '#3a2418', { maxR: 6, edge: 1.5, group: 'doorF' });
  ref.fill({ rect: [104, 424, 312, 736] }, { lin: [0, 424, 0, 1160], stops: [[0, '#fff0b8'], [0.5, '#ffd27a'], [1, '#f0a040']] }, { dir: Math.PI / 2, maxR: 10, group: 'doorG', gmul: 0 });
  ref.line([[260, 424], [260, 1160]], 10, '#3a2418', { area: true, group: 'doorF' });
  for (const y of [660, 900]) ref.line([[104, y], [416, y]], 8, '#3a2418', { area: true, group: 'doorF' });
  ref.fill({ rect: [560, 420, 420, 520] }, '#3a2418', { maxR: 6, edge: 1.5, group: 'winF' });
  ref.fill({ rect: [580, 440, 380, 480] }, { lin: [0, 440, 0, 920], stops: [[0, '#ffe8a8'], [1, '#f0a850']] }, { dir: Math.PI / 2, maxR: 10, group: 'winG', gmul: 0 });
  const bt = rnd(12);
  for (const sy of [590, 760, 910]) { ref.fill({ rect: [580, sy, 380, 10] }, '#5a3a24', { maxR: 3, edge: 1, group: 'shelf' }); for (let k = 0; k < 11; k++) { const x = 600 + k * 33 + bt() * 6, h = 70 + bt() * 40; ref.fill([[x, sy], [x + 18, sy], [x + 18, sy - h * 0.6], [x + 12, sy - h * 0.75], [x + 12, sy - h], [x + 6, sy - h], [x + 6, sy - h * 0.75], [x, sy - h * 0.6]], pick(bt, ['#2a6a3a', '#7a2a2a', '#c89a3a', '#3a4a7a', '#a8c0a0']), { maxR: 2.6, edge: 1, group: 'bottle', gmul: 0 }); } }
  // the awning across the top: chrome yellow with orange stripes, scalloped, the name painted on the valance
  ref.fill([[-20, 130], [1100, 130], [1100, 300], [-20, 300]], { lin: [0, 130, 0, 300], stops: [[0, '#e8b830'], [1, '#fff070']] }, { dir: Math.PI / 2, maxR: 14, group: 'awning', gmul: 0 });
  for (let x = -20; x < 1100; x += 120) ref.tint([[x, 130], [x + 60, 130], [x + 60, 300], [x, 300]], '#e8901e', 0.7);
  const sc = [[-20, 300]]; for (let x = -20; x <= 1100; x += 30) sc.push([x, 360 + (((x + 20) / 30) % 2 ? 22 : 0)]); sc.push([1100, 300]);
  ref.fill([[-20, 296], [1100, 296], ...sc.reverse()], '#f8dc50', { maxR: 4, edge: 1.2, group: 'valance', gmul: 0 });
  ref.text('CAFÉ  DE  NUIT', 540, 350, 'bold 54px "Noto Serif SC"', '#3a2a7a', { group: 'sign', gmul: 0 });
  ref.line([[0, 126], [1080, 126]], 6, '#3a2a20', { type: 3 });
  // a wall lantern on the right
  const [lx, ly] = CAFE.lamp;
  ref.line([[lx, ly - 120], [lx, ly - 76]], 5, '#1c1a24', { type: 3 });
  ref.line([[lx - 30, ly - 120], [lx + 30, ly - 120]], 6, '#1c1a24', { type: 3 });
  ref.fill([[lx - 30, ly + 40], [lx + 30, ly + 40], [lx + 40, ly - 40], [lx - 40, ly - 40]], { rad: [lx, ly, 4, lx, ly, 60], stops: [[0, '#fffbe6'], [1, '#ffc050']] }, { maxR: 4, edge: 1.2, group: 'lamp', gmul: 0 });
  ref.fill([[lx - 48, ly - 40], [lx + 48, ly - 40], [lx, ly - 76]], '#1c1a24', { maxR: 3, edge: 1, group: 'lcap' });
  // the terrace: wet flagstones holding every light
  ref.fill({ rect: [0, 1240, W, 680] }, { lin: [0, 1240, 0, H], stops: [[0, '#5a4a5a'], [1, '#3a3448']] }, { dir: 0, maxR: 20, group: 'floor' });
  const fr = rnd(9);
  for (let row = 0; row < 12; row++) { const y = 1250 + row * 40 + row * row * 2.4, h = 30 + row * 4, w = h * 2.6; for (let x = (row % 2) * w * 0.5; x < W; x += w + 4) { ref.tint({ rect: [x, y, w, 3] }, '#2a2232', 0.5); ref.tint({ rect: [x, y, 3, h] }, '#2a2232', 0.4); } }
  reflect(ref, 260, 1250, 1900, 300, 'rgba(255,214,130,1)', 0.65, 4);
  reflect(ref, 770, 1250, 1700, 360, 'rgba(255,200,120,1)', 0.45, 6);
  reflect(ref, 540, 1250, 1500, 900, 'rgba(255,220,80,1)', 0.25, 8);
  // two tables: the near one with a cup and a candle jar, a chair by it
  const table = (x, y, s, near) => {
    ref.tint({ ellipse: [x, y + s * 2.2, s * 1.3, s * 0.18, 0] }, '#1a1420', 0.5);
    ref.line([[x, y + s * 0.1], [x, y + s * 2.1]], s * 0.08, '#1c1a20', { area: true, group: 'tleg' });
    ref.fill({ ellipse: [x, y + s * 2.15, s * 0.42, s * 0.08, 0] }, '#1c1a20', { maxR: 4, edge: 1.2, group: 'tleg' });
    ref.fill({ ellipse: [x, y + s * 0.05, s * 1.05, s * 0.2, 0] }, '#3a3240', { maxR: 4, edge: 1.2, group: 'trim' });
    ref.fill({ ellipse: [x, y, s * 1.0, s * 0.2, 0] }, { lin: [x - s, 0, x + s, 0], stops: [[0, '#f8f0e0'], [1, '#c8c0b8']] }, { maxR: 6, edge: 1.5, group: 'ttop' });
    if (near) {
      ref.fill({ ellipse: [x + s * 0.4, y - s * 0.04, s * 0.18, s * 0.05, 0] }, '#e8e4dc', { maxR: 3, edge: 1, group: 'saucer' });
      ref.fill([[x + s * 0.3, y - s * 0.06], [x + s * 0.5, y - s * 0.06], [x + s * 0.48, y - s * 0.22], [x + s * 0.32, y - s * 0.22]], '#f0ece4', { maxR: 3, edge: 1, group: 'cup' });
      ref.fill([[x - s * 0.55, y - s * 0.02], [x - s * 0.35, y - s * 0.02], [x - s * 0.37, y - s * 0.3], [x - s * 0.53, y - s * 0.3]], { lin: [0, y - s * 0.3, 0, y], stops: [[0, '#ffe8a0'], [1, '#e89040']] }, { maxR: 3, edge: 1, group: 'candle', gmul: 0 });
    }
  };
  const chair = (x, y, s, dir, coat) => {
    for (const lx2 of [x - s * 0.3, x + s * 0.3]) ref.line([[lx2, y + s * 1.2], [lx2 + dir * s * 0.03, y]], s * 0.05, '#2a1e16', { area: true, group: 'cleg' });
    ref.fill({ ellipse: [x, y, s * 0.42, s * 0.1, 0] }, '#9a5a2a', { maxR: 4, edge: 1.2, group: 'cseat' });
    const bx = x - dir * s * 0.32;
    ref.line([[bx, y], [bx - dir * s * 0.04, y - s * 1.1]], s * 0.06, '#5a3420', { area: true, group: 'cback' });
    ref.line([[bx + dir * s * 0.6, y], [bx + dir * s * 0.56, y - s * 1.1]], s * 0.05, '#5a3420', { area: true, group: 'cback' });
    for (const yy of [0.55, 0.85, 1.08]) ref.line([[bx - dir * s * 0.04, y - s * yy], [bx + dir * s * 0.56, y - s * yy]], s * 0.06, '#8a4a22', { area: true, group: 'cback' });
    if (coat) {   // the old coat over the back: shoulders on the rail, a sleeve hanging, the hem on the seat
      const cx0 = bx + dir * s * 0.26, top = y - s * 1.12;
      ref.fill(blob([[cx0 - s * 0.36, top], [cx0, top - s * 0.05], [cx0 + s * 0.36, top], [cx0 + s * 0.5, top + s * 0.2], [cx0 + s * 0.54, top + s * 0.8], [cx0 + s * 0.6, top + s * 1.28], [cx0 + s * 0.1, top + s * 1.34], [cx0 - s * 0.5, top + s * 1.3], [cx0 - s * 0.56, top + s * 0.8], [cx0 - s * 0.5, top + s * 0.2]]), { lin: [cx0 - s * 0.5, 0, cx0 + s * 0.5, 0], stops: [[0, '#5a4430'], [0.5, '#8a6a46'], [1, '#6a5038']] }, { dir: Math.PI / 2, maxR: 8, edge: 2, group: 'coat' });
      ref.fill(blob([[cx0 - s * 0.34, top + s * 0.02], [cx0, top - s * 0.04], [cx0 + s * 0.34, top + s * 0.02], [cx0 + s * 0.2, top + s * 0.1], [cx0 - s * 0.2, top + s * 0.1]]), '#a8885a', { maxR: 4, edge: 1.2, group: 'coatT' });
      ref.fill([[cx0 + s * 0.44, top + s * 0.14], [cx0 + s * 0.62, top + s * 0.22], [cx0 + s * 0.66, top + s * 1.0], [cx0 + s * 0.52, top + s * 1.06], [cx0 + s * 0.46, top + s * 0.3]], '#6a5038', { maxR: 5, edge: 1.5, group: 'sleeve' });
      ref.fill([[cx0 - s * 0.16, top + s * 0.06], [cx0, top + s * 0.06], [cx0 + s * 0.04, top + s * 0.7], [cx0 - s * 0.1, top + s * 0.72]], '#4a3826', { maxR: 4, edge: 1.2, group: 'lapel' });
      for (const k of [0.4, 0.62, 0.84]) ref.fill({ circle: [cx0 + s * 0.08, top + s * k, s * 0.03] }, '#2a2018', { maxR: 2.6, edge: 1, group: 'button' });
      for (const k of [-0.32, -0.12, 0.3]) ref.tint([[cx0 + k * s, top + s * 0.35], [cx0 + k * s + 5, top + s * 0.35], [cx0 + k * s * 1.25 + 12, top + s * 1.28], [cx0 + k * s * 1.25 + 4, top + s * 1.28]], '#3a2a1c', 0.45);
      ref.tint([[cx0 + s * 0.3, top + s * 0.2], [cx0 + s * 0.5, top + s * 0.25], [cx0 + s * 0.56, top + s * 1.2], [cx0 + s * 0.4, top + s * 1.2]], '#c8a070', 0.35);
    }
  };
  table(860, 1340, 140, false); chair(1000, 1380, 140, -1, false); chair(722, 1390, 140, 1, false);
  const [tx, ty] = CAFE.table; table(tx, ty, 240, true);
  const [chx, chy] = CAFE.chair; chair(chx, chy, 250, 1, true);
  // geraniums in a pot by the door, ivy up the wall
  const gr = rnd(44);
  ref.fill([[440, 1250], [520, 1250], [530, 1180], [430, 1180]], '#b8582e', { maxR: 4, edge: 1.2, group: 'pot' });
  for (let i = 0; i < 26; i++) ref.fill(ellipsePts(480 + (gr() - 0.5) * 120, 1150 - gr() * 70, 14, 10, 9, gr() * 3, 0.25, i), '#3a6a32', { maxR: 3, edge: 1, group: 'pl' });
  for (let i = 0; i < 12; i++) { const x = 480 + (gr() - 0.5) * 110, y = 1120 - gr() * 70; for (let p = 0; p < 5; p++) ref.fill({ circle: [x + Math.cos(p * 1.26) * 7, y + Math.sin(p * 1.26) * 7, 6] }, '#d8202a', { maxR: 2.6, edge: 1, group: 'ger' }); }
  return { ref, w: W, h: H, R: R6 };
}
