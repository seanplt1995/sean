// b.js — style B「江南」: a water town at night (B1) and misty mountains over terraced fields at sunrise (B2).
import { Ref } from '../../engine/plate.js';
import { hex, DAB } from '../../engine/impasto.js';
import { crow } from '../actors.js';
import { camera, wallZ, wallX, star, reflect, rnd, pick, mixh, ellipsePts, blob } from './lib.js';

const W = 1080, H = 1920;

// ── B1: the canal at night — white walls and black tiles, red lanterns, a stone arch whose reflection closes the circle ──
export function b1() {
  const ref = new Ref(W, H);
  const P = camera({ cx: 540, hz: 1050, F: 720, camX: 0.2, camH: 2.2 });
  const moon = [800, 300];
  ref.fill({ rect: [0, 0, W, 1110] }, { rad: [moon[0], moon[1], 40, moon[0], moon[1], 1300], stops: [[0, '#5a6a9a'], [0.2, '#2e3e70'], [0.6, '#1a2650'], [1, '#121a3a']] }, { dir: 0.05, maxR: 32, group: 'sky', jit: 0.04 });
  for (const [cx, cy, rx, ry, sd] of [[420, 360, 260, 30, 1], [900, 470, 200, 24, 2], [260, 180, 220, 26, 3]]) ref.fill(ellipsePts(cx, cy, rx, ry, 26, 0, 0.2, sd), mixh('#2a3866', '#5a6890', 0.45), { dir: 0, maxR: 12, group: 'cloud' + sd });
  ref.fill({ circle: [...moon, 150] }, { rad: [...moon, 50, ...moon, 150], stops: [[0, 'rgba(240,230,190,0.55)'], [1, 'rgba(40,56,110,0)']] }, { maxR: 12, dir: 'edge', group: 'halo', gmul: 0 });
  ref.fill({ circle: [...moon, 56] }, { rad: [moon[0] - 16, moon[1] - 16, 4, ...moon, 56], stops: [[0, '#fffbea'], [1, '#f0dca8']] }, { maxR: 8, edge: 2, group: 'moon', gmul: 0 });
  const sr = rnd(3);
  for (let i = 0; i < 26; i++) ref.fill({ circle: [sr() * W, sr() * 600, 1.5 + sr() * 2] }, '#e8e4d0', { maxR: 2.6, edge: 1, group: 'stars', gmul: 0 });

  // ── beyond the bridge: a far row of houses and a pagoda on the hill ──
  ref.fill([[300, 1000], [340, 940], [420, 950], [460, 900], [540, 905], [600, 880], [680, 900], [760, 950], [800, 1000]], '#2a3458', { dir: 0, maxR: 10, group: 'hill' });
  const pg = [612, 905];
  for (let k = 0; k < 7; k++) { const w = 26 - k * 2.6, y = pg[1] - k * 15; ref.fill({ rect: [pg[0] - w / 2, y - 12, w, 12] }, '#3a4268', { maxR: 3, edge: 1, group: 'pag' }); ref.fill([[pg[0] - w / 2 - 6, y - 12], [pg[0] + w / 2 + 6, y - 12], [pg[0] + w / 2, y - 16], [pg[0] - w / 2, y - 16]], '#1e2440', { maxR: 2.6, edge: 1, group: 'pagR' }); if (k % 2 === 0) ref.fill({ rect: [pg[0] - 2, y - 9, 4, 5] }, '#f0b860', { maxR: 2.6, edge: 1, group: 'pagW', gmul: 0 }); }
  for (let i = 0; i < 9; i++) {
    const x0 = 340 + i * 46, h0 = 46 + (i % 3) * 10;
    ref.fill({ rect: [x0, 1062 - h0, 44, h0] }, '#cfd0d8', { maxR: 4, edge: 1.2, group: 'farW' });
    ref.fill([[x0 - 6, 1062 - h0], [x0 + 50, 1062 - h0], [x0 + 22, 1062 - h0 - 14]], '#1c2036', { maxR: 3, edge: 1, group: 'farR' });
    ref.fill({ rect: [x0 + 14, 1062 - h0 + 14, 14, 12] }, i % 2 ? '#f2b860' : '#3a3e58', { maxR: 2.6, edge: 1, group: 'farWin', gmul: 0 });
  }

  // ── the water: ink-teal, catching everything ──
  ref.fill([[0, 1040], [W, 1040], [W, H], [0, H]], { lin: [0, 1040, 0, H], stops: [[0, '#2a3a62'], [0.35, '#1e3050'], [1, '#14223a']] }, { dir: 0, maxR: 14, group: 'water', aj: 0.04, len: [2.4, 4.2], wid: [0.6, 0.9] });
  // the moon's path
  reflect(ref, moon[0], 1080, 1900, 70, 'rgba(240,230,190,1)', 0.55, 5);

  // ── the houses on both banks (Z 4.5 … 16): granite base, white walls, wooden lattice windows, black tile eaves ──
  const sides = [{ X: -4.2, s: -1 }, { X: 4.6, s: 1 }];
  // horse-head gable at the far end of a segment: stepped white wall with black caps
  function gableAt(X, s, z0, z1, k, top) {
      if (k < 2) {
        const zb = z1, steps = [[X - s * 0.6, X + s * 2.2, top + 1.0], [X + s * 2.2, X + s * 4.6, top + 1.9], [X + s * 4.6, X + s * 7.0, top + 2.8]];
        for (const [xa, xb, yt] of steps) {
          ref.fill([P(xa, top - 0.3, zb), P(xb, top - 0.3, zb), P(xb, yt, zb), P(xa, yt, zb)], '#e4e2dc', { maxR: 8, edge: 1.5, group: 'gable' + s + k });
          ref.fill([P(xa - s * 0.15, yt, zb), P(xb + s * 0.15, yt, zb), P(xb + s * 0.15, yt + 0.32, zb), P(xa - s * 0.15, yt + 0.32, zb)], '#1c1e28', { maxR: 3, edge: 1.2, group: 'cap' + s + k });
          ref.fill([P(xa - s * 0.45, yt + 0.15, zb), P(xa - s * 0.05, yt + 0.15, zb), P(xa - s * 0.3, yt + 0.62, zb)], '#1c1e28', { maxR: 2.6, edge: 1, group: 'cap' + s + k });
        }
      }
  }
  const lanterns = [];
  for (const { X, s } of sides) {
    const segs = s < 0 ? [[4.5, 9.5], [9.5, 13], [13, 16]] : [[4.5, 8.5], [8.5, 12.5], [12.5, 16]];
    segs.map((g, k) => [g, k]).reverse().forEach(([[z0, z1], k]) => {
      const top = 7.4 + (k % 2) * 0.6;
      gableAt(X, s, z0, z1, k, top);
      // granite base with block joints
      ref.fill(wallZ(P, X, z0, z1, 0, 1.2), { lin: [...P(X, 1.2, z0), ...P(X, 0, z0)], stops: [[0, '#8a8a94'], [1, '#4a4c5a']] }, { dir: 0, maxR: 10, group: 'base' + s });
      for (let y = 0.4; y < 1.2; y += 0.4) ref.tint(wallZ(P, X, z0, z1, y - 0.03, y), '#2a2c36', 0.5);
      for (let z = z0 + 0.6; z < z1; z += 0.9) ref.tint(wallZ(P, X, z, z + 0.04, 0, 1.2), '#2a2c36', 0.4);
      // white wall, weathered at the foot, moonlit
      ref.fill(wallZ(P, X, z0, z1, 1.2, top), { lin: [...P(X, top, z0), ...P(X, 1.2, z0)], stops: [[0, '#e8e6e0'], [0.7, '#d8d6d4'], [1, '#a8a8b0']] }, { dir: Math.PI / 2, maxR: 18, group: 'wall' + s + k });
      ref.tint(wallZ(P, X, z0, z1, 1.2, 2.2), '#6a6a72', 0.35);
      // ground floor: wooden doors, two of them open and lit
      const nd = Math.round((z1 - z0) / 1.3);
      for (let d = 0; d < nd; d++) {
        const za = z0 + 0.25 + d * (z1 - z0 - 0.5) / nd, zb = za + (z1 - z0 - 0.5) / nd - 0.12, lit = (d + k + (s > 0 ? 1 : 0)) % 3 === 0;
        ref.fill(wallZ(P, X, za, zb, 1.3, 3.6), lit ? { lin: [...P(X, 3.6, za), ...P(X, 1.3, za)], stops: [[0, '#ffd890'], [1, '#e8903a']] } : '#4a3426', { maxR: 5, edge: 1.5, group: 'door' + (lit ? 'L' : 'D'), gmul: lit ? 0 : 1 });
        if (!lit) for (let q = 1; q < 4; q++) ref.tint(wallZ(P, X, za, zb, 1.3 + q * 0.57, 1.3 + q * 0.57 + 0.05), '#2a1c14', 0.6);
      }
      // waist eave: a short run of black tiles
      ref.fill([P(X, 4.0, z0), P(X, 4.0, z1), P(X - s * 0.7, 3.75, z1), P(X - s * 0.7, 3.75, z0)], '#22242e', { maxR: 4, edge: 1.5, group: 'weave' + s });
      for (let z = z0; z < z1; z += 0.22) ref.tint([P(X, 4.0, z), P(X - s * 0.7, 3.75, z), P(X - s * 0.7, 3.75, z + 0.06), P(X, 4.0, z + 0.06)], '#5a5c6a', 0.5);
      // upper floor: lattice windows, warm behind paper
      const nw = Math.round((z1 - z0) / 1.6);
      for (let w = 0; w < nw; w++) {
        const za = z0 + 0.4 + w * (z1 - z0 - 0.8) / nw, zb = za + (z1 - z0 - 0.8) / nw - 0.3, lit = (w + k) % 2 === 0 || s > 0 && w === 1;
        ref.fill(wallZ(P, X, za - 0.08, zb + 0.08, 4.5, 6.6), '#3a2a20', { maxR: 4, edge: 1.2, group: 'wframe' });
        ref.fill(wallZ(P, X, za, zb, 4.62, 6.48), lit ? { lin: [...P(X, 6.5, za), ...P(X, 4.6, za)], stops: [[0, '#ffe2a0'], [1, '#f2a24a']] } : '#2c2a36', { maxR: 5, edge: 1.2, group: 'wpaper' + (lit ? 'L' : 'D'), gmul: lit ? 0 : 1 });
        const ps = P.s((za + zb) / 2), lw = Math.max(1, ps * 0.03);
        for (let q = 1; q < 4; q++) { const z = za + (zb - za) * q / 4; ref.line([P(X, 4.62, z), P(X, 6.48, z)], lw, '#3a2a20', { type: 3 }); }
        for (let q = 1; q < 5; q++) { const y = 4.62 + 1.86 * q / 5; ref.line([P(X, y, za), P(X, y, zb)], lw, '#3a2a20', { type: 3 }); }
        if (lit) reflect(ref, P(X, 0, (za + zb) / 2)[0] - s * ps * 0.3, P(X, 0, (za + zb) / 2)[1] + 4, P(X, 0, (za + zb) / 2)[1] + ps * 3.4, ps * 0.9, 'rgba(255,200,110,1)', 0.45, Math.round(za * 10));
      }
      // the main eave: deep, black tiles with lighter ridges, upturned at the corner
      ref.fill([P(X, top, z0 - 0.3), P(X, top, z1 + 0.3), P(X - s * 1.1, top - 0.45, z1 + 0.3), P(X - s * 1.15, top - 0.2, z0 - 0.5)], '#1a1c26', { maxR: 5, edge: 1.5, group: 'eave' + s + k });
      for (let z = z0 - 0.3; z < z1 + 0.3; z += 0.24) ref.tint([P(X, top, z), P(X - s * 1.1, top - 0.45, z), P(X - s * 1.1, top - 0.45, z + 0.07), P(X, top, z + 0.07)], '#6a6c7a', 0.5);
      for (let z = z0 + 0.8; z < z1; z += 2.6) lanterns.push([X - s * 0.75, top - 1.1, z]);
    });
    // white wall reflections, broken
    reflect(ref, P(X, 0, 7)[0] - s * 40, P(X, 0, 7)[1] + 6, P(X, 0, 7)[1] + 300, 120, 'rgba(210,210,220,1)', 0.18, s > 0 ? 61 : 62);
  }

  // ── the bridge (Z = 16): a humped stone arch; its reflection makes it a full moon ──
  const Zb = 16, cxB = 0.2, rB = 3.4, arcPts = (r, y0) => { const pts = []; for (let k = 0; k <= 24; k++) { const a = Math.PI - k / 24 * Math.PI; pts.push(P(cxB + Math.cos(a) * r, y0 + Math.sin(a) * r, Zb)); } return pts; };
  const deck = (x) => 1.6 + 3.2 * Math.cos((x - cxB) / 6.2 * Math.PI / 2);
  const face = []; for (let k = 0; k <= 20; k++) { const x = -5 + k * 10.4 / 20; face.push(P(x, deck(x) + 0.5, Zb)); }
  ref.fill([P(-5.2, 0, Zb), ...face, P(5.6, 0, Zb), ...arcPts(rB, 0).reverse()], { lin: [0, 950, 0, 1160], stops: [[0, '#a8a8b4'], [1, '#6a6c7a']] }, { dir: 0, maxR: 10, group: 'bridge' });
  const ar = arcPts(rB + 0.35, 0); ref.line(ar, Math.max(2, P.s(Zb) * 0.12), '#c8c8d0', { type: 3 });
  for (let k = 0; k < 13; k++) { const a = Math.PI - k / 12 * Math.PI; ref.line([P(cxB + Math.cos(a) * rB, Math.sin(a) * rB, Zb), P(cxB + Math.cos(a) * (rB + 0.7), Math.sin(a) * (rB + 0.7), Zb)], 1.5, '#4a4c5a', { type: 3 }); }
  // parapet with posts
  const par = []; for (let k = 0; k <= 20; k++) { const x = -4.8 + k * 9.8 / 20; par.push(P(x, deck(x) + 1.3, Zb)); }
  ref.line(par, Math.max(2, P.s(Zb) * 0.14), '#b8b8c4', { type: 3 });
  for (let k = 0; k <= 10; k++) { const x = -4.8 + k * 0.98; ref.line([P(x, deck(x) + 0.5, Zb), P(x, deck(x) + 1.45, Zb)], Math.max(2, P.s(Zb) * 0.1), '#9a9aa8', { type: 3 }); }
  // the reflection of the arch: a pale ring under the water line, broken by ripples
  { const [ax, ay] = P(cxB, 0, Zb), rx = rB * P.s(Zb), ry = rB * P.s(Zb) * 0.98;
    // the stone face below the arch, mirrored (pale), then the arch's dark eye; ripples cut it into dashes
    ref.tint([[ax - rx * 1.55, ay], [ax + rx * 1.6, ay], [ax + rx * 1.5, ay + ry * 1.25], [ax - rx * 1.45, ay + ry * 1.25]], '#8a8ca0', 0.45);
    ref.tint({ ellipse: [ax, ay, rx, ry, 0] }, '#162440', 0.85);
    for (let k = 0; k <= 30; k++) { const a = k / 30 * Math.PI, x = ax + Math.cos(a) * rx * 1.06, y = ay + Math.sin(a) * ry * 1.06; ref.tint({ rect: [x - 9, y - 2, 18, 4] }, '#d8d8e4', 0.6); }
    for (let y = ay + 6; y < ay + ry * 1.25; y += 7) ref.tint({ rect: [ax - rx * 1.6, y, rx * 3.2, 2] }, '#1a2848', 0.35); }
  // two lanterns on the bridge
  for (const x of [-3.2, 3.6]) lanterns.push([x, deck(x) + 2.1, Zb - 0.2]);

  // ── red lanterns, and their light in the water ──
  for (const [X, Y, Z] of lanterns) {
    const [lx, ly] = P(X, Y, Z), s = P.s(Z);
    ref.line([P(X, Y + 0.7, Z), [lx, ly - s * 0.3]], Math.max(1, s * 0.02), '#2a1a14', { type: 3 });
    ref.fill({ ellipse: [lx, ly, s * 0.24, s * 0.3, 0] }, { rad: [lx - s * 0.06, ly - s * 0.06, 1, lx, ly, s * 0.3], stops: [[0, '#ffd27a'], [0.5, '#f05a2a'], [1, '#b8201a']] }, { maxR: 5, edge: 1.2, group: 'lantern', gmul: 0 });
    ref.fill({ rect: [lx - s * 0.14, ly - s * 0.34, s * 0.28, s * 0.06] }, '#2a1a14', { maxR: 2.6, edge: 1, group: 'lcap' });
    ref.line([[lx, ly + s * 0.3], [lx, ly + s * 0.55]], Math.max(1.5, s * 0.04), '#e8b040', { type: 3, gmul: 0 });
    const [, wy] = P(X, 0, Z);
    reflect(ref, lx, wy + 2, wy + s * 3.2, s * 0.5, 'rgba(255,110,60,1)', 0.6, Math.round(Z * 37));
  }

  // ── a wupeng boat moored on the right, with a lamp at the bow ──
  const bz0 = 6.2, bz1 = 10.6, bx = 3.1;
  const hull = [P(bx - 1.0, 0.45, bz0 + 0.3), P(bx - 1.1, 0.5, bz1), P(bx + 0.9, 0.5, bz1), P(bx + 0.8, 0.45, bz0 + 0.3), P(bx, 0.7, bz0 - 0.6)];
  ref.fill([P(bx - 1.0, 0.45, bz0 + 0.3), P(bx - 1.1, 0.5, bz1), P(bx - 1.0, -0.05, bz1), P(bx - 0.9, -0.05, bz0 + 0.5)], '#3a2618', { maxR: 6, edge: 1.5, group: 'hullS', dir: (x, y) => Math.atan2(P.hz - y, P.cx - x) });
  ref.fill(hull, '#5a3a22', { maxR: 6, edge: 1.5, group: 'hull' });
  const shell = []; for (let k = 0; k <= 12; k++) { const a = Math.PI - k / 12 * Math.PI; shell.push(P(bx + Math.cos(a) * 0.95, 0.55 + Math.sin(a) * 0.95, bz0 + 1.4)); }
  const shellB = []; for (let k = 0; k <= 12; k++) { const a = k / 12 * Math.PI; shellB.push(P(bx + Math.cos(a) * 0.95, 0.55 + Math.sin(a) * 0.95, bz1 - 0.4)); }
  ref.fill(shell.concat(shellB), '#1c1c22', { maxR: 6, edge: 1.5, group: 'awn', dir: 0 });
  ref.fill(shell.concat([P(bx + 0.95, 0.55, bz0 + 1.4)]), '#2e2e36', { maxR: 5, edge: 1.5, group: 'awnF' });
  for (let k = 1; k < 6; k++) { const z = bz0 + 1.4 + k * (bz1 - bz0 - 1.8) / 6; const arc = []; for (let j = 0; j <= 10; j++) { const a = Math.PI - j / 10 * Math.PI; arc.push(P(bx + Math.cos(a) * 0.96, 0.55 + Math.sin(a) * 0.96, z)); } ref.line(arc, 2, '#4a4a56', { type: 3 }); }
  { const [lx, ly] = P(bx, 1.3, bz0 - 0.2), s = P.s(bz0); ref.line([P(bx, 0.7, bz0 - 0.2), [lx, ly + s * 0.12]], 2, '#2a1a14', { type: 3 }); ref.fill({ rect: [lx - s * 0.1, ly - s * 0.12, s * 0.2, s * 0.24] }, { rad: [lx, ly, 1, lx, ly, s * 0.15], stops: [[0, '#fff4d0'], [1, '#ffb040']] }, { maxR: 3, edge: 1, group: 'blamp', gmul: 0 }); const [, wy] = P(bx, 0, bz0 - 0.2); reflect(ref, lx, wy, wy + s * 2.2, s * 0.35, 'rgba(255,200,110,1)', 0.6, 88); }
  // ripples round the hull
  for (let k = 0; k < 6; k++) { const [rx, ry] = P(bx, 0, bz0 + k * 0.8); ref.tint({ ellipse: [rx, ry + 4, P.s(bz0 + k * 0.8) * 1.4, 2, 0] }, '#6a7aa0', 0.35); }

  // ── paper lotus lanterns drifting on the water, each with a small flame ──
  for (const [X, Z] of [[-1.6, 3.2], [0.9, 4.1], [-0.4, 5.6], [1.8, 7.4], [-2.4, 6.4], [0.3, 9.5]]) {
    const [lx, ly] = P(X, 0.05, Z), s = P.s(Z);
    reflect(ref, lx, ly + 2, ly + s * 1.6, s * 0.4, 'rgba(255,190,110,1)', 0.55, Math.round(Z * 13));
    ref.fill({ ellipse: [lx, ly + s * 0.02, s * 0.32, s * 0.06, 0] }, '#3a5a3a', { maxR: 4, edge: 1.2, group: 'pad' });
    for (let k = 0; k < 7; k++) { const a = (k / 6 - 0.5) * 2.2, px = lx + Math.sin(a) * s * 0.2, py = ly - s * 0.05; ref.fill([[px - s * 0.06, py + s * 0.03], [px + s * 0.06, py + s * 0.03], [px + Math.sin(a) * s * 0.08, py - s * (0.16 - Math.abs(a) * 0.04)]], k % 2 ? '#f6b0b8' : '#fbd8dc', { maxR: 2.6, edge: 1, group: 'petal', gmul: 0 }); }
    ref.fill({ ellipse: [lx, ly - s * 0.12, s * 0.035, s * 0.07, 0] }, '#fff4c0', { maxR: 2.6, edge: 1, group: 'flame', gmul: 0 });
    ref.tint({ circle: [lx, ly - s * 0.1, s * 0.3] }, '#ffc070', 0.25);
  }
  // ── granite steps down to the water on the left bank ──
  for (let k = 0; k < 5; k++) { const y = 1.2 - k * 0.24, x = -4.2 + k * 0.32; ref.fill([P(-4.2, y, 5.0), P(x + 0.32, y, 5.0), P(x + 0.32, y, 6.6), P(-4.2, y, 6.6)], k % 2 ? '#9a9aa6' : '#8a8a96', { maxR: 5, edge: 1.5, group: 'step' + k }); ref.fill([P(x + 0.32, y, 5.0), P(x + 0.32, y, 6.6), P(x + 0.32, y - 0.24, 6.6), P(x + 0.32, y - 0.24, 5.0)], '#5a5c68', { maxR: 4, edge: 1.2, group: 'stepR' + k }); }
  // ── a willow leaning in from the top left ──
  const wr = rnd(12);
  ref.line([[-20, 40], [80, 20], [200, 70]], 22, '#2a2420', { area: true, group: 'branch' });
  for (let i = 0; i < 46; i++) {
    const x0 = 10 + wr() * 260, y0 = 30 + wr() * 60, L = 260 + wr() * 560, sway = 30 + wr() * 70;
    const pts = []; for (let k = 0; k <= 16; k++) { const t = k / 16; pts.push([x0 + sway * Math.sin(t * 1.4) + Math.sin(t * 5 + i) * 8, y0 + L * t]); }
    ref.line(pts, 1.6, wr() < 0.5 ? '#5a7a32' : '#3e5a28', { type: 3 });
    for (let k = 2; k < 16; k++) { const [px, py] = pts[k], sd = k % 2 ? 1 : -1; ref.line([[px, py], [px + sd * (6 + wr() * 8), py + 9 + wr() * 7]], 3.2, pick(wr, ['#8aa848', '#6a8a3a', '#b0c868', '#4e6e30']), { type: 3 }); }
  }
  return {
    ref, clear: hex('#14203e'),
    extra: (s) => {
      const [x0, y0] = P(-1.4, deck(-1.4) + 1.45, Zb), [x1, y1] = P(-0.6, deck(-0.6) + 1.45, Zb);
      crow(s, { x: x0, y: y0 - 4, s: 20, pose: 'perch', dir: 1, seed: 7, gmul: 1 });
      crow(s, { x: x1, y: y1 - 4, s: 18, pose: 'perch', dir: -1, seed: 8, gmul: 1 });
    },
    post: { amb: 0.8, dif: 0.28, spec: 0.28, vig: 0.32, sat: 1.04, light: [0.5, -0.6, 0.6] },
  };
}

// ── B2: sunrise over the mountains — ridges fading into mist, a pagoda, terraced paddies holding the sky, a pine ──
export function b2() {
  const ref = new Ref(W, H);
  const sun = [600, 470];
  ref.fill({ rect: [0, 0, W, H] }, { lin: [0, 0, 0, 1100], stops: [[0, '#6a7aa8'], [0.35, '#c8a8b8'], [0.6, '#f0c8a0'], [0.75, '#f8dca8'], [1, '#f0e0c0']] }, { dir: 0.02, maxR: 34, group: 'sky', jit: 0.04 });
  for (let k = 5; k >= 1; k--) ref.tint({ circle: [...sun, 50 + k * 50] }, '#fff0c8', 0.12);
  ref.fill({ circle: [...sun, 52] }, { rad: [sun[0] - 10, sun[1] - 10, 4, ...sun, 52], stops: [[0, '#fffbe8'], [1, '#ffd890']] }, { maxR: 8, edge: 2, group: 'sun', gmul: 0 });
  for (const [cx, cy, rx, ry, sd] of [[260, 300, 260, 22, 1], [820, 230, 220, 18, 2], [560, 420, 300, 16, 3]]) ref.fill(ellipsePts(cx, cy, rx, ry, 26, 0, 0.2, sd), mixh('#d8b0b8', '#f0d0c0', 0.5), { dir: 0, maxR: 10, group: 'cloud' + sd });
  // ridges: far → near, each paler at its foot where the mist lies
  const ridge = (y0, amp, seed, cTop, cMist, mistH, maxR, g) => {
    const r = rnd(seed), pts = [[0, H]];
    let y = y0;
    for (let x = 0; x <= W; x += 30) { y = y0 - amp * (0.5 + 0.5 * Math.sin(x * 0.006 + seed) * Math.sin(x * 0.013 + seed * 2)) - r() * amp * 0.12; pts.push([x, y]); }
    pts.push([W, H]);
    ref.fill(pts, { lin: [0, y0 - amp, 0, y0 + mistH], stops: [[0, cTop], [0.55, cTop], [1, cMist]] }, { dir: (x, yy) => Math.PI / 2 + 0.6 * Math.sin(x * 0.02 + seed), maxR, group: g, aj: 0.3 });
    return pts;
  };
  ridge(820, 260, 1, '#9aa0c0', '#efe0d0', 160, 16, 'r1');
  ridge(930, 300, 2, '#7a86a8', '#f2e2d0', 170, 18, 'r2');
  const r3 = ridge(1060, 260, 3, '#56688a', '#efe2d4', 180, 20, 'r3');
  // mist bands, colour-only
  for (const [y, h, a] of [[880, 70, 0.55], [1000, 80, 0.6], [1130, 90, 0.55]]) ref.tint({ rect: [0, y, W, h] }, { lin: [0, y, 0, y + h], stops: [[0, 'rgba(250,236,220,0)'], [0.5, 'rgba(250,236,220,1)'], [1, 'rgba(250,236,220,0)']] }, a);
  // a wooded hill on the right for the pagoda to stand on
  ref.fill(blob([[560, 1180], [640, 1060], [740, 1010], [860, 1000], [980, 1040], [1100, 1080], [1100, 1200], [560, 1200]]), { lin: [0, 1000, 0, 1180], stops: [[0, '#3e5a52'], [1, '#c8c0b8']] }, { dir: Math.PI / 2, maxR: 12, group: 'phill' });
  const hr = rnd(41);
  for (let i = 0; i < 18; i++) { const x = 620 + hr() * 460, y = 1030 + hr() * 60 + Math.abs(x - 820) * 0.12; if (Math.abs(x - 800) < 50) continue; ref.fill(blob(ellipsePts(x, y, 18 + hr() * 14, 14 + hr() * 8, 8, 0, 0.3, i)), hr() < 0.5 ? '#2e4a3e' : '#3e5e46', { maxR: 5, edge: 1.2, group: 'htree', type: DAB }); }
  // the pagoda on the hill: seven eaves, upturned corners, a lit window on each storey
  const pg = [800, 1012];
  ref.fill([[pg[0] - 60, pg[1] + 30], [pg[0] + 60, pg[1] + 30], [pg[0] + 40, pg[1]], [pg[0] - 40, pg[1]]], '#4a4a5a', { maxR: 5, edge: 1.5, group: 'pbase' });
  for (let k = 0; k < 7; k++) {
    const w = 46 - k * 4.5, h = 34 - k * 2, y = pg[1] - k * (h + 8);
    ref.fill({ rect: [pg[0] - w / 2, y - h, w, h] }, { lin: [pg[0] - w / 2, 0, pg[0] + w / 2, 0], stops: [[0, '#d8c0a8'], [1, '#9a8478']] }, { maxR: 4, edge: 1.2, group: 'pwall' });
    ref.fill({ rect: [pg[0] - 4, y - h * 0.75, 8, h * 0.45] }, '#f8c068', { maxR: 2.6, edge: 1, group: 'pwin', gmul: 0 });
    ref.fill([[pg[0] - w / 2 - 18, y - h + 2], [pg[0] - w / 2 - 24, y - h - 8], [pg[0] + w / 2 + 24, y - h - 8], [pg[0] + w / 2 + 18, y - h + 2]], '#2e2c3a', { maxR: 3, edge: 1.2, group: 'peave' });
  }
  ref.line([[pg[0], pg[1] - 7 * 38 + 20], [pg[0], pg[1] - 7 * 38 - 30]], 4, '#2e2c3a', { type: 3 });
  // terraced paddies on the slope below: curving contours, each pool mirroring the sky
  const tr = rnd(8);
  for (let k = 0; k < 15; k++) {
    const y0 = 1170 + k * 34 + k * k * 3.4, bend = 60 + k * 8, amp = 22 + k * 3.5;
    const top = [], bot = [];
    for (let x = -40; x <= W + 40; x += 30) {
      const u = x / W, yt = y0 + Math.sin(u * Math.PI * 1.3 + k * 0.4) * amp - bend * Math.sin(u * Math.PI);
      top.push([x, yt]); bot.unshift([x, yt + 30 + k * 8]);
    }
    const sky = [['#fbe0a8', '#f0b890'], ['#f2c0b0', '#b8a8cc'], ['#fde8b8', '#e8a888'], ['#c8b8d8', '#8a9ac0'], ['#f8d098', '#e09878']][k % 5];
    ref.fill(top.concat(bot), { lin: [0, y0 - bend, 0, y0 + 60], stops: [[0, sky[0]], [1, sky[1]]] }, { dir: 0, maxR: 8 + k, group: 'pool' + k, aj: 0.05 });
    ref.line(top, 9 + k * 1.4, k % 2 ? '#4e7238' : '#3a5e30', { area: true, group: 'bund' + k });
    ref.line(top.map(([x, y]) => [x, y - 3 - k * 0.5]), 3 + k * 0.5, '#8aa860', { area: true, group: 'bundL' + k });
    // the sun's glitter in the pools nearest its line
    for (let j = 0; j < 4; j++) { const x = sun[0] + (tr() - 0.5) * 140, yy = y0 + 18 + k * 2 - bend * Math.sin(x / W * Math.PI) + Math.sin(x / W * Math.PI * 1.3 + k * 0.4) * amp; ref.tint({ rect: [x - 20, yy, 40, 3] }, '#fffbe0', 0.6); }
    // rice shoots: rows of tiny green dashes
    for (let x = 20 + (k % 2) * 15; x < W; x += 34 - k) { const u = x / W, yy = y0 + 20 + Math.sin(u * Math.PI * 1.3 + k * 0.4) * amp - bend * Math.sin(u * Math.PI); ref.tint({ rect: [x, yy, 2 + k * 0.3, 6 + k * 0.6] }, '#6a8a42', 0.55); }
  }
  // a farmhouse on the terraces: white walls, a dark tile roof, a lit door
  { const fx = 760, fy = 1420, fw = 150, fh = 70;
    ref.fill({ rect: [fx, fy - fh, fw, fh] }, { lin: [fx, 0, fx + fw, 0], stops: [[0, '#f2ece2'], [1, '#c8c0b8']] }, { maxR: 6, edge: 1.5, group: 'farm' });
    ref.fill([[fx - 24, fy - fh + 6], [fx + fw + 24, fy - fh + 6], [fx + fw + 6, fy - fh - 34], [fx - 6, fy - fh - 34]], '#2e3038', { maxR: 5, edge: 1.5, group: 'froof' });
    for (let x = fx - 20; x < fx + fw + 20; x += 9) ref.tint({ rect: [x, fy - fh - 32, 3, 36] }, '#6a6c78', 0.5);
    ref.fill({ rect: [fx + 60, fy - 46, 28, 46] }, '#f6b860', { maxR: 3, edge: 1, group: 'fdoor', gmul: 0 });
    ref.fill({ rect: [fx + 18, fy - 52, 22, 18] }, '#4a3a30', { maxR: 3, edge: 1, group: 'fwin' });
    ref.fill({ rect: [fx + 108, fy - 52, 22, 18] }, '#f6c070', { maxR: 3, edge: 1, group: 'fwin2', gmul: 0 });
    ref.fill(blob(ellipsePts(fx + fw + 50, fy - 60, 46, 60, 9, 0, 0.25, 5)), { lin: [0, fy - 120, 0, fy], stops: [[0, '#5a8a52'], [1, '#2e4a32']] }, { maxR: 6, group: 'ftree', type: DAB });
    ref.line([[fx + fw + 50, fy], [fx + fw + 50, fy - 30]], 6, '#4a3428', { type: 3 }); }
  // the pine on a rock in the left foreground
  ref.fill([[0, 1470], [70, 1430], [150, 1440], [230, 1480], [280, 1560], [310, 1660], [260, 1760], [140, 1820], [0, 1830]], '#5a5a66', { dir: 0.6, maxR: 12, group: 'rock' });
  for (const [pts, c] of [[[[70, 1430], [150, 1440], [160, 1530], [60, 1520]], '#a8a4ac'], [[[150, 1440], [230, 1480], [250, 1560], [160, 1530]], '#8a8892'], [[[0, 1470], [70, 1430], [60, 1520], [0, 1560]], '#9a96a0'], [[[160, 1530], [250, 1560], [280, 1660], [180, 1640]], '#6a6874'], [[[60, 1520], [160, 1530], [180, 1640], [50, 1640]], '#7a7884']]) ref.tint(pts, c, 0.9);
  ref.line([[110, 1480], [130, 1300], [100, 1120], [150, 960], [230, 860]], 40, '#4a3428', { area: true, group: 'trunk' });
  ref.line([[104, 1470], [124, 1300], [94, 1120], [144, 960], [222, 862]], 10, '#7a5a40', { area: true, group: 'trunkL' });
  ref.line([[130, 1150], [260, 1080], [380, 1090]], 14, '#4a3428', { area: true, group: 'trunk' });
  ref.line([[150, 980], [40, 900], [-20, 910]], 12, '#4a3428', { area: true, group: 'trunk' });
  const nr = rnd(51);
  for (const [cx, cy, rx, ry, sd] of [[240, 830, 150, 46, 1], [380, 1060, 130, 40, 2], [40, 880, 110, 36, 3], [160, 760, 90, 30, 4]]) {
    for (let j = 0; j < 7; j++) {   // each cloud of needles is a few overlapping clumps, lit on top
      const u = (j / 6 - 0.5) * 1.6, x = cx + u * rx * 0.7, y = cy - Math.cos(u) * ry * 0.3 + nr() * ry * 0.3, r1 = rx * (0.3 + nr() * 0.15), r2 = ry * (0.55 + nr() * 0.3);
      ref.fill(blob(ellipsePts(x, y, r1, r2, 9, 0, 0.3, sd * 10 + j)), { lin: [0, y - r2, 0, y + r2], stops: [[0, '#6a9a5a'], [0.45, '#3a6a46'], [1, '#183424']] }, { dir: 0, maxR: 7, group: 'needles' + sd, type: DAB, detail: 2 });
    }
    for (let j = 0; j < 36; j++) { const a = j / 36 * Math.PI * 2, x = cx + Math.cos(a) * rx * 0.95, y = cy + Math.sin(a) * ry * 0.8; ref.line([[x, y], [x + Math.cos(a) * 14, y + Math.sin(a) * 5 - 3]], 2.5, j % 3 ? '#2e5a3a' : '#5a8a4a', { type: 3 }); }
  }
  return {
    ref, clear: hex('#f0d8b8'),
    extra: (s) => {
      const cr = rnd(30);
      for (let i = 0; i < 5; i++) crow(s, { x: 360 + i * 70 + cr() * 30, y: 520 + Math.sin(i) * 40, s: 16 + cr() * 8, pose: 'fly', flap: cr(), dir: 1, seed: 60 + i, gmul: 1 });
    },
    post: { amb: 0.82, dif: 0.28, spec: 0.2, vig: 0.18, sat: 1.04, warm: 0.05, light: [0.2, -0.7, 0.6] },
  };
}
