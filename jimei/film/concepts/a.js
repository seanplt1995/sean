// a.js — style A「梵高的阿尔勒」: Van Gogh's Provence. A1 the cathedral square at blue hour, A2 the wheat field.
import { Ref } from '../../engine/plate.js';
import { hex, mixc, DAB } from '../../engine/impasto.js';
import { crow } from '../actors.js';
import { camera, wallZ, wallX, ground, windowZ, balconyZ, star, swirl, swirlTint, reflect, rnd, pick, mixh, ellipsePts, blob } from './lib.js';

const W = 1080, H = 1920;

// ── A1: the square in front of the cathedral, a café terrace under a yellow awning, a sky full of stars ──
export function a1() {
  const ref = new Ref(W, H);
  const P = camera({ cx: 540, hz: 1370, F: 720, camX: 0.3, camH: 1.6 });
  // sky: ultramarine, swirling round two stars
  ref.fill({ rect: [0, 0, W, 1430] }, { lin: [0, 0, 0, 1370], stops: [[0, '#10235e'], [0.45, '#1f4590'], [0.8, '#3b6aa8'], [1, '#6d8fb8']] }, { dir: swirl(560, 420, 1), maxR: 36, group: 'sky', jit: 0.05 });
  swirlTint(ref, 560, 430, 40, 330, 1.6, '#86b6e6', 0.32, 16, 2);
  swirlTint(ref, 880, 250, 30, 220, 1.3, '#9cc4ea', 0.28, 12, 5);
  swirlTint(ref, 300, 560, 20, 160, 1.2, '#7aa8dc', 0.25, 10, 9);
  for (const [x, y, r] of [[560, 430, 20], [880, 250, 17], [420, 250, 12], [700, 610, 10], [300, 560, 12], [760, 120, 11], [990, 520, 9], [470, 640, 8], [640, 300, 8], [1010, 120, 10]]) {
    for (let k = 3; k >= 1; k--) ref.tint({ circle: [x, y, r * (1.6 + k * 1.1)] }, k % 2 ? '#e8d890' : '#9cc0e8', 0.12 + 0.05 * k);
    star(ref, x, y, r, { group: 'star' + x });
  }
  // crescent moon above the left roofs
  ref.fill({ circle: [150, 150, 70] }, { rad: [150, 150, 20, 150, 150, 70], stops: [[0, 'rgba(250,210,120,0.8)'], [1, 'rgba(40,70,140,0)']] }, { maxR: 10, dir: 'edge', group: 'moonhalo', gmul: 0 });
  ref.fill([[150, 104], [180, 120, 196, 170, 168, 200], [192, 172, 176, 122, 150, 104]], '#fbe7a0', { maxR: 4, edge: 1.5, group: 'moon', gmul: 0 });
  ref.fill([[150, 104], [196, 120, 200, 186, 160, 200], [176, 180, 182, 126, 150, 104]], '#fff4c8', { maxR: 4, edge: 1.5, group: 'moon', gmul: 0 });

  // ── the cathedral at the far side of the square (Z = 26) ──
  const Zc = 26, stone = { lin: [0, 180, 0, 1280], stops: [[0, '#6f7fae'], [0.5, '#9a95a8'], [0.85, '#d8b48a'], [1, '#e8c08a']] };
  for (const s of [-1, 1]) {   // towers with pyramidal spires
    const x0 = s < 0 ? -9 : 5, x1 = s < 0 ? -5 : 9;
    ref.fill(wallX(P, Zc, x0, x1, 0, 31), stone, { dir: Math.PI / 2, maxR: 18, group: 'cath' });
    ref.fill([P(x0 - 0.3, 31, Zc), P(x1 + 0.3, 31, Zc), P((x0 + x1) / 2, 40, Zc)], { lin: [0, 150, 0, 380], stops: [[0, '#4a5a8c'], [1, '#7a86b0']] }, { dir: Math.PI / 2, maxR: 10, edge: 2, group: 'spire' + s });
    ref.fill(wallX(P, Zc, x0 - 0.3, x1 + 0.3, 30.4, 31.2), '#c9c0b4', { maxR: 4, edge: 1.5, group: 'cornice' });
    for (const xb of [x0 + 0.8, x0 + 2.3]) {   // belfry openings
      ref.fill([P(xb, 22, Zc), P(xb + 0.9, 22, Zc), P(xb + 0.9, 27, Zc), [P(xb + 0.9, 27.6, Zc)[0], P(xb + 0.45, 28, Zc)[1], ...P(xb, 27, Zc)]], '#1a2140', { maxR: 4, edge: 1.5, group: 'belfry' });
    }
    for (const yy of [8, 14]) ref.fill([P(x0 + 1.6, yy, Zc), P(x0 + 2.4, yy, Zc), P(x0 + 2.4, yy + 2.6, Zc), P(x0 + 1.6, yy + 2.6, Zc)], '#2a2f50', { maxR: 4, edge: 1.5, group: 'twin' });
  }
  ref.fill(wallX(P, Zc, -5, 5, 0, 19), stone, { dir: Math.PI / 2, maxR: 18, group: 'cath' });
  ref.fill([P(-5.3, 19, Zc), P(5.3, 19, Zc), P(0, 23, Zc)], { lin: [0, 600, 0, 760], stops: [[0, '#7a86b0'], [1, '#a59cb0']] }, { maxR: 10, edge: 2, group: 'gable' });
  // rose window
  const [rx, ry] = P(0, 13, Zc), rr = 3 * P.s(Zc);
  ref.fill({ circle: [rx, ry, rr * 1.12] }, '#cfc3b2', { maxR: 5, edge: 1.5, group: 'roseF' });
  ref.fill({ circle: [rx, ry, rr] }, { rad: [rx, ry, 4, rx, ry, rr], stops: [[0, '#ffe08a'], [0.5, '#e07a3a'], [1, '#3a3f86']] }, { maxR: 5, edge: 1.5, group: 'rose', gmul: 0, dir: 'edge' });
  for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; ref.line([[rx, ry], [rx + Math.cos(a) * rr, ry + Math.sin(a) * rr]], 1.6, '#2a2440', { type: 3 }); }
  ref.line(ellipsePts(rx, ry, rr * 0.45, rr * 0.45, 24).concat([[rx + rr * 0.45, ry]]), 1.6, '#2a2440', { type: 3 });
  // a gallery of small arches across the front
  for (let k = 0; k < 9; k++) { const x = -4.4 + k * 1.1; ref.fill([P(x, 8.6, Zc), P(x + 0.7, 8.6, Zc), P(x + 0.7, 9.8, Zc), P(x + 0.35, 10.2, Zc), P(x, 9.8, Zc)], '#2b3058', { maxR: 3, edge: 1, group: 'gal' }); }
  // the portal: deep, warm inside
  const arch = (hw, spring) => { const pts = [P(-hw, 0, Zc), P(hw, 0, Zc)]; for (let k = 0; k <= 16; k++) { const a = k / 16 * Math.PI; pts.push(P(Math.cos(a) * hw, spring + Math.sin(a) * hw, Zc)); } return pts; };
  ref.fill(arch(2.7, 4.6), '#8a6a50', { maxR: 5, edge: 1.5, group: 'portalF' });
  ref.fill(arch(1.8, 4.4), { lin: [0, 1150, 0, 1400], stops: [[0, '#f7c86a'], [1, '#e08a3a']] }, { maxR: 5, edge: 1.5, group: 'portal', gmul: 0 });
  ref.fill(wallX(P, Zc, -9.5, 9.5, 0, 0.8), '#b8a690', { maxR: 4, edge: 1.5, group: 'steps' });
  for (let yy = 1.5; yy < 31; yy += 1.1) ref.tint([P(-9, yy, Zc), P(9, yy, Zc), P(9, yy - 0.08, Zc), P(-9, yy - 0.08, Zc)], '#4a4a6a', 0.18);
  for (const k of [1, 2]) { const hw = 1.8 + k * 0.3, pts = [P(-hw, 0, Zc)]; for (let j = 0; j <= 16; j++) { const a = Math.PI - j / 16 * Math.PI; pts.push(P(Math.cos(a) * hw, 4.4 + Math.sin(a) * hw, Zc)); } pts.push(P(hw, 0, Zc)); ref.line(pts, 2, '#5a4a40', { type: 3 }); }
  { const [cx, cy] = P(-7, 18, Zc), cr = 1.1 * P.s(Zc); ref.fill({ circle: [cx, cy, cr] }, '#f2ead0', { maxR: 4, edge: 1.2, group: 'clock', gmul: 0 }); ref.line([[cx, cy], [cx, cy - cr * 0.7]], 2, '#2a2430', { type: 3 }); ref.line([[cx, cy], [cx + cr * 0.5, cy + cr * 0.2]], 2, '#2a2430', { type: 3 }); }
  for (const xs of [-3.6, -2.9, 2.9, 3.6]) ref.fill([P(xs - 0.25, 1, Zc), P(xs + 0.25, 1, Zc), P(xs + 0.25, 3.4, Zc), P(xs, 3.8, Zc), P(xs - 0.25, 3.4, Zc)], '#c8b49a', { maxR: 3, edge: 1, group: 'statue' });

  // ── the buildings' end walls facing the square ──
  ref.fill(wallX(P, 17, -14, -6.2, 0, 13.5), { lin: [0, 700, 0, 1290], stops: [[0, '#3b4a7e'], [1, '#c98a52']] }, { dir: Math.PI / 2, maxR: 18, group: 'endL' });
  for (const [x0, y0] of [[-11, 5], [-8.6, 5], [-11, 8.4], [-8.6, 8.4]]) ref.fill(wallX(P, 17, x0, x0 + 1.2, y0, y0 + 2), y0 < 6 ? '#f2b85a' : '#1e2546', { maxR: 4, edge: 1.5, group: 'endLw', gmul: 0 });
  ref.fill(wallX(P, 18, 7, 13, 0, 12), { lin: [0, 800, 0, 1290], stops: [[0, '#3c5f78'], [1, '#6d7f8a']] }, { dir: Math.PI / 2, maxR: 18, group: 'endR' });
  for (const [x0, y0, lit] of [[8.2, 4.8, 1], [10.4, 4.8, 0], [8.2, 8, 0], [10.4, 8, 1]]) ref.fill(wallX(P, 18, x0, x0 + 1.1, y0, y0 + 2), lit ? '#f4c060' : '#1b2442', { maxR: 4, edge: 1.5, group: 'endRw', gmul: 0 });

  // ── the square: cobbles, lilac and blue, warm where the café lights fall ──
  ref.fill([[0, 1370], [W, 1370], [W, H], [0, H]], { lin: [0, 1370, 0, H], stops: [[0, '#6c6a96'], [0.4, '#5d5f93'], [1, '#4a4f86']] }, { dir: 0, maxR: 22, group: 'ground' });
  ref.tint(ground(P, 0, -7, -1.5, 2.2, 17), { lin: [0, 1300, 700, 1300], stops: [[0, 'rgba(240,160,70,0.85)'], [1, 'rgba(240,160,70,0)']] }, 0.9);
  ref.tint(ground(P, 0, -3, 4, 18, 26), { lin: [0, 1250, 0, 1290], stops: [[0, 'rgba(230,170,110,0.5)'], [1, 'rgba(230,170,110,0.1)']] }, 1);
  const r = rnd(11);
  for (let z = 2.3; z < 26; z += 0.32 * (1 + z * 0.02)) for (let x = -7.5 + (Math.round(z * 3) % 2) * 0.17; x < 8; x += 0.34) {
    const [px, py] = P(x, 0, z), s = P.s(z), w = 0.14 * s, h = w * 1.6 / z;
    if (w < 1.6 || px < -10 || px > W + 10) continue;
    ref.tint({ ellipse: [px, py, w, Math.max(0.8, h * 1.0), 0] }, r() < 0.5 ? '#a8a4cc' : (x < -2 && z < 17 ? '#ffd090' : '#8c8cc0'), 0.28 + r() * 0.2);
  }
  for (const [X, z, w, d] of [[-0.6, 5.2, 1.6, 0.9], [2.2, 9.5, 1.3, 0.8], [-2.0, 13, 1.1, 0.7]]) {
    const pts = ellipsePts(0, 0, w, d, 24, 0.1, 0.25, X * 3).map(([u, v]) => P(X + u, 0, z + v));
    ref.fill(pts, { lin: [0, P(0, 0, z + d)[1], 0, P(0, 0, z - d)[1]], stops: [[0, '#2a4a8c'], [1, '#5a7ab8']] }, { dir: 0, maxR: 8, edge: 1.5, group: 'puddle' + z });
    const [cx, cy] = P(X, 0, z); ref.tint({ ellipse: [cx + 10, cy, P.s(z) * 0.18, P.s(z) * 0.06, 0] }, '#fff0b0', 0.8);
  }
  // fountain in the middle of the square
  const Zf = 21.5, Xf = 0.8;
  const [fx, fy] = P(Xf, 0.65, Zf), fs = P.s(Zf);
  ref.fill({ ellipse: [fx, fy + fs * 0.32, fs * 2.4, fs * 0.42, 0] }, '#9a8e88', { maxR: 6, edge: 1.5, group: 'basin' });
  ref.fill([[fx - fs * 2.4, fy + fs * 0.32], [fx + fs * 2.4, fy + fs * 0.32], [fx + fs * 2.4, fy + fs * 0.85], [fx - fs * 2.4, fy + fs * 0.85]], { lin: [fx - fs * 2.4, 0, fx + fs * 2.4, 0], stops: [[0, '#d9a070'], [0.5, '#b7a090'], [1, '#7a7a9a']] }, { maxR: 6, edge: 1.5, group: 'basinS' });
  ref.fill({ ellipse: [fx, fy + fs * 0.32, fs * 2.1, fs * 0.3, 0] }, '#3d5a8a', { maxR: 5, edge: 1.5, group: 'water' });
  ref.fill([[fx - fs * 0.22, fy + fs * 0.3], [fx + fs * 0.22, fy + fs * 0.3], [fx + fs * 0.16, fy - fs * 1.6], [fx - fs * 0.16, fy - fs * 1.6]], '#a89a90', { maxR: 4, edge: 1.2, group: 'col' });
  ref.fill({ ellipse: [fx, fy - fs * 1.6, fs * 0.8, fs * 0.16, 0] }, '#b8a898', { maxR: 4, edge: 1.2, group: 'bowl' });
  for (let k = -3; k <= 3; k++) ref.line([[fx, fy - fs * 1.75], [fx + k * fs * 0.25, fy - fs * 2.1], [fx + k * fs * 0.5, fy - fs * 1.65]], 1.4, '#cfe0f0', { type: 3 });

  // ── right side: three tall houses, blue and violet under the moon, warm windows, iron balconies ──
  const houses = [[9, 13, 14, '#4d5d8a', '#2f6a4a'], [13, 15.6, 15.5, '#5b5486', '#3a5a8a'], [15.6, 18, 12, '#3f6a7a', '#2f6a4a']];
  houses.forEach(([z0, z1, hgt, col, sh], hi) => {
    const X = 7;
    ref.fill(wallZ(P, X, z0, z1, 0, hgt), { lin: [...P(X, hgt, z0), ...P(X, 0, z0)], stops: [[0, mixh(col, '#1a2050', 0.2)], [0.75, col], [1, mixh(col, '#d8a070', 0.45)]] }, { dir: (x, y) => Math.atan2(P.hz - y, P.cx - x), maxR: 22, group: 'house' + hi });
    ref.fill(wallZ(P, X, z0, z1, hgt - 0.5, hgt), '#c8c0b8', { maxR: 4, edge: 1.5, group: 'corn' + hi });
    ref.fill([P(X, hgt, z0), P(X, hgt, z1), P(X - 0.45, hgt + 0.12, z1), P(X - 0.45, hgt + 0.12, z0)], '#5a2e28', { maxR: 4, edge: 1.5, group: 'eave' + hi });
    for (let z = z0 + 0.2; z < z1; z += 0.35) ref.tint([P(X, hgt, z), P(X - 0.45, hgt + 0.12, z), P(X - 0.45, hgt + 0.12, z + 0.12), P(X, hgt, z + 0.12)], '#a85a3a', 0.6);
    const bays = Math.round((z1 - z0) / 1.9), bw = (z1 - z0) / bays;
    for (let b = 0; b < bays; b++) {
      const zc = z0 + (b + 0.5) * bw;
      for (const [k, fy0] of [[1, 4.6], [2, 7.7], [3, 10.8]]) {
        if (fy0 + 2.4 > hgt - 0.6) continue;
        windowZ(ref, P, X, zc - 0.5, zc + 0.5, fy0, fy0 + 2.1, { lit: (b + k + hi) % 3 === 0, shutter: sh, group: 'w' + hi });
      }
      // ground floor: arched doors and one lit shop
      const lit = (b + hi) % 2 === 0;
      ref.fill([P(X, 0, zc - 0.6), P(X, 0, zc + 0.6), P(X, 2.6, zc + 0.6), P(X, 3.1, zc), P(X, 2.6, zc - 0.6)], lit ? { lin: [...P(X, 3, zc), ...P(X, 0, zc)], stops: [[0, '#ffd47a'], [1, '#e88a3a']] } : '#2a2238', { maxR: 5, edge: 1.5, group: 'door' + hi, gmul: lit ? 0 : 1 });
    }
    balconyZ(ref, P, X, z0 + 0.3, z1 - 0.3, 4.3, 0.7, { seed: 20 + hi });
    if (hgt > 13) balconyZ(ref, P, X, z0 + 0.6, z1 - 0.6, 10.5, 0.5, { seed: 40 + hi, flowers: ['#f0f0f0', '#e06aa0', '#d8323a'] });
  });

  // ── left side: the café — a warm yellow front, a brilliant awning, tables on the cobbles ──
  const XL = -6.2, zA = 8.4, zB = 17;
  ref.fill(wallZ(P, XL, zA, zB, 0, 13.5), { lin: [...P(XL, 13.5, 10), ...P(XL, 0, 10)], stops: [[0, '#2f3f78'], [0.55, '#6a5a78'], [0.72, '#c8703a'], [1, '#d88a40']] }, { dir: (x, y) => Math.atan2(P.hz - y, P.cx - x), maxR: 22, group: 'cafe' });
  ref.fill(wallZ(P, XL, zA, zB, 13, 13.5), '#c8c0b8', { maxR: 4, edge: 1.5, group: 'cornL' });
  ref.fill([P(XL, 13.5, zA), P(XL, 13.5, zB), P(XL + 0.45, 13.62, zB), P(XL + 0.45, 13.62, zA)], '#5a2e28', { maxR: 4, edge: 1.5, group: 'eaveL' });
  for (let z = zA + 0.2; z < zB; z += 0.35) ref.tint([P(XL, 13.5, z), P(XL + 0.45, 13.62, z), P(XL + 0.45, 13.62, z + 0.12), P(XL, 13.5, z + 0.12)], '#a85a3a', 0.6);
  for (let b = 0; b < 4; b++) {
    const zc = zA + 1.1 + b * 2.1;
    for (const [k, fy0] of [[1, 5], [2, 8.2]]) windowZ(ref, P, XL, zc - 0.5, zc + 0.5, fy0, fy0 + 2.1, { lit: (b + k) % 2 === 0, shutter: '#3a6a5a', group: 'wl', litTop: '#ffe08a' });
    // tall glazed café doors, bright inside
    ref.fill([P(XL, 0, zc - 0.7), P(XL, 0, zc + 0.7), P(XL, 3.2, zc + 0.7), P(XL, 3.2, zc - 0.7)], { lin: [...P(XL, 3.2, zc), ...P(XL, 0, zc)], stops: [[0, '#fff0b0'], [1, '#f6a640']] }, { maxR: 5, edge: 1.5, group: 'cdoor', gmul: 0 });
    ref.line([P(XL, 0, zc), P(XL, 3.2, zc)], 2, '#5a3a20', { type: 3 });
  }
  balconyZ(ref, P, XL, zA + 0.4, zB - 1.2, 7.9, 0.6, { seed: 60, flowers: ['#d8323a', '#f07a5a', '#ffffff'] });
  // the awning: underside lit chrome yellow, a scalloped orange valance
  const Xo = -2.5, yIn = 4.3, yOut = 2.55;
  ref.fill([P(XL, yIn, zA), P(XL, yIn, 16), P(Xo, yOut, 16), P(Xo, yOut, zA)], { lin: [...P(XL, yIn, 10), ...P(Xo, yOut, 10)], stops: [[0, '#fff27a'], [1, '#f8d23a']] }, { dir: (x, y) => Math.atan2(P.hz - y, P.cx - x), maxR: 14, group: 'awning', gmul: 0 });
  for (let z = zA + 0.3; z < 16; z += 0.9) ref.tint([P(XL, yIn, z), P(XL, yIn, z + 0.4), P(Xo, yOut, z + 0.4), P(Xo, yOut, z)], '#f0a830', 0.55);
  const val = [];
  for (let i = 0; i <= 28; i++) { const z = zA + (16 - zA) * i / 28; const [x, y] = P(Xo, yOut - 0.32 - (i % 2 ? 0.12 : 0), z); val.push([x, y]); }
  ref.fill([P(Xo, yOut, zA), P(Xo, yOut, 16), ...val.reverse()], '#f6d040', { maxR: 6, edge: 1.5, group: 'valance', gmul: 0 });
  for (let z = zA; z < 16; z += 0.9) ref.tint([P(Xo, yOut + 0.02, z), P(Xo, yOut + 0.02, z + 0.45), P(Xo, yOut - 0.48, z + 0.45), P(Xo, yOut - 0.48, z)], '#e07a28', 0.85);
  // the lantern under the awning
  const [lx, ly] = P(-4.6, 3.1, 10.6), ls = P.s(10.6);
  ref.line([P(-4.6, 3.6, 10.6), [lx, ly - ls * 0.3]], 1.5, '#3a2a20', { type: 3 });
  ref.fill({ rect: [lx - ls * 0.2, ly - ls * 0.3, ls * 0.4, ls * 0.55] }, { rad: [lx, ly, 2, lx, ly, ls * 0.4], stops: [[0, '#fffbe0'], [1, '#ffb040']] }, { maxR: 4, edge: 1.2, group: 'lamp', gmul: 0 });
  // tables and chairs on the terrace
  const tr = rnd(5);
  for (const [X, z] of [[-4.9, 9.4], [-3.4, 10.4], [-4.9, 11.9], [-3.5, 13.1], [-4.8, 14.6]]) {
    const [tx, ty] = P(X, 0.75, z), s = P.s(z), [, gy] = P(X, 0, z);
    for (const sx of [-1, 1]) {   // a chair each side: legs, seat, a curved back
      const cx0 = tx + sx * s * 0.55, sy = P(X, 0.45, z)[1], by = P(X, 0.95, z)[1], cw = s * 0.36;
      for (const lx of [cx0 - cw / 2 + 2, cx0 + cw / 2 - 2]) ref.line([[lx, gy], [lx, sy]], Math.max(1, s * 0.03), '#5a3420', { type: 3 });
      ref.fill({ ellipse: [cx0, sy, cw / 2, Math.max(2, s * 0.05), 0] }, '#b8742e', { maxR: 3, edge: 1, group: 'chair' });
      ref.fill([[cx0 + sx * cw * 0.15, sy], [cx0 + sx * cw * 0.5, sy], [cx0 + sx * cw * 0.55, by], [cx0 + sx * cw * 0.2, by]], '#8a5226', { maxR: 3, edge: 1, group: 'chairB' });
    }
    ref.line([[tx, ty], [tx, gy]], Math.max(1.2, s * 0.045), '#3a2a20', { type: 3 });
    ref.fill({ ellipse: [tx, gy, s * 0.2, Math.max(1.5, s * 0.03), 0] }, '#3a2a20', { maxR: 3, edge: 1, group: 'tfoot' });
    ref.fill({ ellipse: [tx, ty, s * 0.42, Math.max(2.5, s * 0.1), 0] }, '#fbf0d8', { maxR: 4, edge: 1.2, group: 'table', gmul: 0 });
    ref.fill({ rect: [tx + s * 0.05, ty - s * 0.2, Math.max(2, s * 0.05), s * 0.18] }, '#e8e0c8', { maxR: 2.6, edge: 1, group: 'glass', gmul: 0 });
    ref.fill({ circle: [tx - s * 0.12, ty - s * 0.06, Math.max(1.5, s * 0.05)] }, '#ffcf60', { maxR: 2.6, edge: 1, group: 'candle', gmul: 0 });
  }
  // after the rain: every light lies again in the cobbles
  for (let b = 0; b < 4; b++) { const zc = zA + 1.1 + b * 2.1, [x0, y0] = P(XL, 0, zc); reflect(ref, x0 + P.s(zc) * 0.25, y0, y0 + P.s(zc) * 2.6, P.s(zc) * 1.1, 'rgba(255,214,120,1)', 0.7, 10 + b); }
  { const [x0, y0] = P(0, 0, Zc); reflect(ref, x0, y0, y0 + 140, 90, 'rgba(255,200,110,1)', 0.4, 31); }
  houses.forEach(([z0, z1], hi) => { const zc = z0 + (z1 - z0) / 4, [x0, y0] = P(7, 0, zc); reflect(ref, x0 - P.s(zc) * 0.3, y0, y0 + P.s(zc) * 2, P.s(zc) * 0.9, 'rgba(255,200,110,1)', 0.35, 40 + hi); });


  // ── a gas lamp on the right, near ──
  const [px0, py0] = P(3.7, 0, 7.6), [px1, py1] = P(3.7, 3.6, 7.6), ps = P.s(7.6);
  ref.line([[px0, py0], [px1, py1]], ps * 0.09, '#1c1a24', { area: true, group: 'post' });
  ref.fill({ rect: [px0 - ps * 0.14, py0 - ps * 0.5, ps * 0.28, ps * 0.5] }, '#24222e', { maxR: 4, edge: 1.2, group: 'post' });
  ref.fill([[px1 - ps * 0.22, py1], [px1 + ps * 0.22, py1], [px1 + ps * 0.3, py1 - ps * 0.55], [px1 - ps * 0.3, py1 - ps * 0.55]], { rad: [px1, py1 - ps * 0.28, 2, px1, py1 - ps * 0.28, ps * 0.35], stops: [[0, '#fffbe6'], [1, '#ffc050']] }, { maxR: 4, edge: 1.2, group: 'glass', gmul: 0 });
  ref.fill([[px1 - ps * 0.36, py1 - ps * 0.55], [px1 + ps * 0.36, py1 - ps * 0.55], [px1, py1 - ps * 0.8]], '#1c1a24', { maxR: 3, edge: 1, group: 'cap' });
  reflect(ref, px0, py0 + 4, py0 + ps * 3.2, ps * 0.5, 'rgba(255,220,140,1)', 0.55, 77);

  // ── foreground: a flower seller's cart (sunflowers, irises, lavender) and terracotta pots ──
  const Zk = 4.6, ks = P.s(Zk);
  const [kx0, ky0] = P(-2.7, 1.0, Zk), [kx1, ky1] = P(-0.7, 0.45, Zk);
  ref.fill({ rect: [kx0, ky0, kx1 - kx0, ky1 - ky0] }, { lin: [kx0, 0, kx1, 0], stops: [[0, '#6a3a1e'], [1, '#a8662e']] }, { dir: 0, maxR: 8, edge: 2, group: 'cart' });
  for (let k = 1; k < 4; k++) ref.tint({ rect: [kx0, ky0 + (ky1 - ky0) * k / 4, kx1 - kx0, 2] }, '#3a200e', 0.6);
  for (const wx of [kx0 + ks * 0.35, kx1 - ks * 0.35]) {
    ref.fill({ circle: [wx, P(0, 0.3, Zk)[1], ks * 0.3] }, '#3a2414', { maxR: 5, edge: 1.5, group: 'wheel' });
    ref.fill({ circle: [wx, P(0, 0.3, Zk)[1], ks * 0.22] }, '#8a5a30', { maxR: 4, edge: 1.2, group: 'wheelI' });
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, cy = P(0, 0.3, Zk)[1]; ref.line([[wx, cy], [wx + Math.cos(a) * ks * 0.22, cy + Math.sin(a) * ks * 0.22]], 2, '#3a2414', { type: 3 }); }
  }
  const fr = rnd(17);
  for (let i = 0; i < 6; i++) {   // buckets, each with its own flowers
    const bx = kx0 + (i + 0.5) * (kx1 - kx0) / 6, bw = (kx1 - kx0) / 6 * 0.8, by = ky0;
    ref.fill([[bx - bw / 2, by], [bx + bw / 2, by], [bx + bw * 0.42, by - ks * 0.28], [bx - bw * 0.42, by - ks * 0.28]], i % 2 ? '#6a7a8a' : '#8a8a96', { maxR: 4, edge: 1.2, group: 'bucket' });
    const kind = ['sun', 'iris', 'lav', 'sun', 'rose', 'lav'][i];
    for (let j = 0; j < 16; j++) {
      const sx = bx + (fr() - 0.5) * bw * 1.5, sy = by - ks * (0.4 + fr() * 0.6);
      ref.fill(ellipsePts(bx + (sx - bx) * 0.5, by - ks * 0.3 - (by - sy) * 0.3, ks * 0.06, ks * 0.025, 8, fr() * 3, 0.1, j), '#4a7a32', { maxR: 3, edge: 1, group: 'leafc' });
      ref.line([[bx + (fr() - 0.5) * bw * 0.5, by - ks * 0.25], [sx, sy]], 2, '#3a6a2a', { type: 3 });
      if (kind === 'sun') { ref.fill({ circle: [sx, sy, ks * 0.11] }, '#f6c228', { maxR: 4, edge: 1.2, group: 'sunp', gmul: 0 }); ref.fill({ circle: [sx, sy, ks * 0.04] }, '#6a3a12', { maxR: 2.6, edge: 1, group: 'sunc' }); }
      else if (kind === 'iris') ref.fill(ellipsePts(sx, sy, ks * 0.05, ks * 0.08, 10, fr(), 0.2, j), '#5a4ab0', { maxR: 3, edge: 1, group: 'iris', gmul: 0 });
      else if (kind === 'lav') ref.line([[sx, sy], [sx + (fr() - 0.5) * 6, sy - ks * 0.2]], 7, '#8a6ac8', { type: 3, gmul: 0 });
      else ref.fill({ circle: [sx, sy, ks * 0.075] }, pick(fr, ['#d8283a', '#f0f0e8', '#f07a8a']), { maxR: 3, edge: 1, group: 'rose', gmul: 0 });
    }
  }
  const Zp = 3.3, pss = P.s(Zp);
  for (const [X, col] of [[2.15, '#b8582e'], [2.85, '#a84a28']]) {
    const [p0x, p0y] = P(X, 0, Zp), [, p1y] = P(X, 0.55, Zp), pw = pss * 0.26;
    ref.fill([[p0x - pw * 0.75, p0y], [p0x + pw * 0.75, p0y], [p0x + pw, p1y], [p0x - pw, p1y]], { lin: [p0x - pw, 0, p0x + pw, 0], stops: [[0, mixh(col, '#ffd090', 0.3)], [1, col]] }, { maxR: 6, edge: 1.5, group: 'pot' });
    ref.fill({ rect: [p0x - pw * 1.08, p1y - pss * 0.06, pw * 2.16, pss * 0.07] }, mixh(col, '#000', 0.15), { maxR: 4, edge: 1.2, group: 'potrim' });
    for (let j = 0; j < 30; j++) { const a = -Math.PI / 2 + (fr() - 0.5) * 1.7, L = pss * (0.35 + fr() * 0.45), x1 = p0x + Math.cos(a) * L, y1 = p1y + Math.sin(a) * L; ref.line([[p0x + (fr() - 0.5) * pw, p1y], [x1, y1]], 3, '#4a6a3a', { type: 3 }); ref.line([[x1, y1], [x1 + Math.cos(a) * pss * 0.1, y1 + Math.sin(a) * pss * 0.1]], 6, X < 2.5 ? '#9a7ad8' : '#e8607a', { type: 3, gmul: 0 }); }
  }
  return {
    ref, clear: hex('#1a2a5a'),
    extra: (s) => {
      // two crows on the ledge of the left tower, one on the lamp
      crow(s, { x: 322, y: 382, s: 26, pose: 'perch', dir: 1, seed: 1, gmul: 1 });
      crow(s, { x: 360, y: 384, s: 22, pose: 'perch', dir: -1, seed: 2, gmul: 1 });
      crow(s, { x: px1 + 4, y: py1 - ps * 0.82, s: 24, pose: 'perch', dir: -1, seed: 3, gmul: 1 });
    },
    post: { amb: 0.8, dif: 0.3, spec: 0.26, vig: 0.3, sat: 1.06, glow: [P(-4.6, 3.1, 10.6)[0] / W, P(-4.6, 3.1, 10.6)[1] / H, 0.3, 0.45, 1, 0.75, 0.35] },
  };
}

// ── A2: the wheat field under a turning sky — a cypress like a dark flame, the village and its steeple, crows ──
export function a2() {
  const ref = new Ref(W, H), hz = 1010, vp = [520, hz];
  const toVP = (x, y) => Math.atan2(vp[1] - y, vp[0] - x);
  // sky: turquoise to cobalt, big cream clouds that turn
  ref.fill({ rect: [0, 0, W, hz + 20] }, { lin: [0, 0, 0, hz], stops: [[0, '#2a5aa8'], [0.5, '#4a8ac8'], [1, '#9ad0e0']] }, { dir: swirl(700, 330, 1), maxR: 34, group: 'sky', jit: 0.05 });
  swirlTint(ref, 700, 330, 30, 300, 1.5, '#d8eef0', 0.35, 18, 3);
  swirlTint(ref, 200, 220, 20, 200, 1.2, '#c8e4f0', 0.3, 14, 8);
  const cloud = (cx, cy, rx, ry, seed) => {
    const puffs = [];   // a cloud is a few overlapping puffs
    const pr = rnd(seed * 7);
    for (let k = 0; k < 6; k++) { const u = (k / 5 - 0.5) * 1.5; puffs.push(ellipsePts(cx + u * rx * 0.62, cy - Math.cos(u * 1.4) * ry * 0.35 + pr() * ry * 0.2, rx * (0.38 + pr() * 0.16), ry * (0.55 + pr() * 0.3) * Math.cos(u * 0.9), 20, 0, 0.08, k)); }
    puffs.push(ellipsePts(cx, cy + ry * 0.25, rx * 0.95, ry * 0.42, 24, 0, 0.05, 9));
    ref.fill(puffs, { lin: [0, cy - ry, 0, cy + ry], stops: [[0, '#fffaf0'], [0.45, '#efe8d8'], [0.8, '#c8c4dc'], [1, '#a8b0d0']] }, { dir: swirl(cx, cy, 1, 0.3), maxR: 11, group: 'cloud' + seed, detail: 2 });
    swirlTint(ref, cx, cy, 6, Math.min(rx, ry * 1.6), 2.2, '#ffffff', 0.55, 5, seed);
    swirlTint(ref, cx + rx * 0.1, cy + ry * 0.2, 4, Math.min(rx, ry * 1.4) * 0.8, 1.8, '#9aa4cc', 0.35, 4, seed + 5);
  };
  cloud(760, 330, 210, 120, 1); cloud(240, 190, 170, 80, 2); cloud(980, 640, 140, 60, 3); cloud(420, 520, 150, 55, 4); cloud(160, 720, 120, 45, 5);
  // the sun low on the right, ringed
  for (let k = 4; k >= 1; k--) ref.tint({ circle: [930, 860, 40 + k * 26] }, k % 2 ? '#fff0a0' : '#f0d070', 0.16);
  ref.fill({ circle: [930, 860, 42] }, { rad: [920, 850, 4, 930, 860, 42], stops: [[0, '#fffbe0'], [1, '#f8d860']] }, { maxR: 8, edge: 2, group: 'sun', gmul: 0 });
  // the Alpilles: two blue-violet ridges
  ref.fill([[0, 930], [120, 880], [260, 905], [400, 860], [560, 900], [700, 870], [860, 915], [1000, 880], [1080, 900], [1080, hz + 10], [0, hz + 10]], { lin: [0, 860, 0, hz], stops: [[0, '#6a78b8'], [1, '#8a9ac8']] }, { dir: 0, maxR: 14, group: 'hills1' });
  ref.fill([[0, 975], [180, 950], [330, 968], [520, 942], [720, 966], [900, 948], [1080, 962], [1080, hz + 10], [0, hz + 10]], { lin: [0, 940, 0, hz], stops: [[0, '#5a7aa0'], [1, '#6a8a8a']] }, { dir: 0, maxR: 10, group: 'hills2' });
  // the village on the slope: ochre walls, red roofs, a steeple
  const vr = rnd(4);
  for (let i = 0; i < 14; i++) {
    const x = 600 + i * 26 + vr() * 10, w = 20 + vr() * 14, h = 14 + vr() * 12, y = 992 - (i % 3) * 7;
    ref.fill({ rect: [x, y - h, w, h] }, pick(vr, ['#e8c890', '#f0d8a8', '#d8b078', '#f2e2c0']), { maxR: 4, edge: 1.2, group: 'vh' });
    ref.fill([[x - 3, y - h], [x + w + 3, y - h], [x + w / 2, y - h - 9]], pick(vr, ['#c0502e', '#a8402a', '#d06a3a']), { maxR: 3, edge: 1, group: 'vr' });
    if (vr() < 0.6) ref.fill({ rect: [x + w * 0.3, y - h * 0.65, 4, 5] }, '#4a3a5a', { maxR: 2.6, edge: 1, group: 'vw' });
  }
  ref.fill({ rect: [742, 900, 18, 86] }, '#e8d0a0', { maxR: 4, edge: 1.2, group: 'tower' });
  ref.fill([[738, 900], [764, 900], [751, 852]], '#5a6aa0', { maxR: 3, edge: 1, group: 'steeple' });
  ref.fill({ rect: [747, 915, 8, 12] }, '#3a3050', { maxR: 2.6, edge: 1, group: 'tw' });
  // olive trees, silver-green, on the far edge of the field
  const olive = (x, y, r, seed) => { ref.fill(blob(ellipsePts(x, y, r, r * 0.7, 9, 0, 0.3, seed)), { rad: [x - r * 0.3, y - r * 0.3, 2, x, y, r], stops: [[0, '#a8c0a0'], [1, '#5a7a62']] }, { dir: 'edge', maxR: 8, group: 'olive' + seed, type: DAB }); };
  for (const [x, y, r, sd] of [[850, 1000, 34, 1], [930, 1006, 40, 2], [1020, 998, 36, 3], [60, 1004, 30, 4]]) olive(x, y, r, sd);
  // the field: gold rows to the vanishing point, a path along one of them
  ref.fill([[0, hz], [W, hz], [W, H], [0, H]], { lin: [0, hz, 0, H], stops: [[0, '#d8a840'], [0.4, '#e8b840'], [1, '#c88a28']] }, { dir: toVP, maxR: (x, y) => 6 + 26 * Math.min(1, (y - hz) / 900), group: 'field', edgeFollow: 0.2 });
  for (let k = -16; k <= 16; k++) {   // furrow shading, colour-only, so the strokes follow the rows
    const xb = 540 + k * 120;
    ref.tint([[vp[0], vp[1]], [xb - 14, H], [xb + 14, H]], k % 2 ? '#8a5a1a' : '#f6d470', 0.22);
  }
  const path = [[vp[0] - 4, hz + 2], [vp[0] + 4, hz + 2], [640, H], [430, H]];
  ref.fill(path, { lin: [0, hz, 0, H], stops: [[0, '#d8b080'], [1, '#c08a58']] }, { dir: toVP, maxR: (x, y) => 4 + 16 * Math.min(1, (y - hz) / 900), group: 'path', edgeFollow: 0.9 });
  // the cypress: a dark green flame, coiling
  // two small cypresses standing on the far edge of the field
  for (const [x, h] of [[390, 150], [432, 110]]) ref.fill(blob([[x, hz + 6], [x - 18, hz - h * 0.3], [x - 12, hz - h * 0.7], [x, hz - h], [x + 12, hz - h * 0.7], [x + 18, hz - h * 0.3]]), { lin: [x - 18, 0, x + 18, 0], stops: [[0, '#1e3e2e'], [1, '#3a6a40']] }, { dir: Math.PI / 2, maxR: 6, group: 'cyp' + x });
  // the near wheat: ears, poppies, cornflowers
  const wr = rnd(9);
  for (let i = 0; i < 260; i++) {
    const x = wr() * W, y = 1320 + wr() * 600, s = 0.35 + (y - 1320) / 600 * 0.9, len = 70 * s + wr() * 40 * s, a = -Math.PI / 2 + (wr() - 0.4) * 0.5;
    if (x > 400 && x < 680 && y > 1500) continue;   // keep the path clear
    ref.line([[x, y], [x + Math.cos(a) * len, y + Math.sin(a) * len]], 2 + 2 * s, pick(wr, ['#f0c850', '#e0a838', '#f8dc70', '#c88a28']), { type: 3 });
    ref.line([[x + Math.cos(a) * len, y + Math.sin(a) * len], [x + Math.cos(a) * (len + 22 * s), y + Math.sin(a) * (len + 22 * s)]], 6 * s, '#f6d060', { type: 3 });
  }
  for (let i = 0; i < 130; i++) {
    const x = wr() * W, y = 1150 + wr() * 760, s = 0.3 + (y - 1150) / 760;
    if (x > 380 && x < 700 && y > 1450) continue;
    ref.fill({ circle: [x, y, 10 * s + 2] }, wr() < 0.75 ? pick(wr, ['#e0281e', '#d81e1e', '#f04a2a']) : '#3a5ad0', { maxR: 4, edge: 1.2, group: 'flower', gmul: 0 });
  }
  // the great cypress in front, rising out of the frame bottom like a dark green flame
  const cyp = [], cyR = [];
  for (let i = 0; i <= 60; i++) {   // a flame: the outline flickers and the axis twists
    const t = i / 60, y = 1980 - t * 1640, w = 165 * Math.pow(Math.sin(Math.PI * (0.5 + 0.5 * t)), 0.9) * (t > 0.85 ? (1 - t) / 0.15 : 1), ax = 205 + 26 * Math.sin(t * 7);
    const fl = 1 + 0.14 * Math.sin(t * 41) + 0.08 * Math.sin(t * 97);
    cyp.push([ax - w * fl, y]); cyR.unshift([ax + w * (2 - fl) * 0.9, y]);
  }
  ref.fill(cyp.concat(cyR), { lin: [40, 0, 360, 0], stops: [[0, '#0e2a22'], [0.45, '#1e4a30'], [0.8, '#2e6a3a'], [1, '#4a7a3a']] }, { dir: swirl(200, 1100, 1, -1.35), maxR: 14, group: 'cypress' });
  for (let k = 0; k < 14; k++) { const y = 430 + k * 105, w = 30 + Math.min(k, 8) * 14; swirlTint(ref, 205 + (k % 2 ? 22 : -22), y, 6, w, 1.1, k % 2 ? '#5a8a44' : '#08201a', 0.55, 7, k + 2); }
  return {
    ref, clear: hex('#4a8ac8'),
    extra: (s) => {
      const cr = rnd(21);
      for (let i = 0; i < 11; i++) crow(s, { x: 260 + i * 62 + cr() * 30, y: 640 + Math.sin(i * 1.3) * 60 + cr() * 40, s: 18 + cr() * 14, pose: 'fly', flap: cr(), dir: i % 3 ? 1 : -1, seed: 40 + i, gmul: 1 });
    },
    post: { amb: 0.8, dif: 0.32, spec: 0.2, vig: 0.2, sat: 1.08, warm: 0.04, light: [0.6, -0.5, 0.65] },
  };
}
