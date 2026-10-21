// actors.js — everything that moves: procedural knife strokes rebuilt every frame from fixed seeds,
// so the paint of a walking figure or a flying crow never boils.

import { KNIFE, BRUSH, DAB, LINE, hex, mixc, scalec, hash1, strokePath } from '../engine/impasto.js';

const TAU = Math.PI * 2;
export const PAL = {
  linen: hex('#B9AE9C'), first: hex('#E8892B'), first2: hex('#F6C46A'), moon: hex('#A9B9D0'), night: hex('#2E3A5C'),
  umbrella: hex('#9C3B2A'), umbrella2: hex('#C0543F'), wheat: hex('#E3C05A'), earth: hex('#9A4E2A'), harvest: hex('#6B4A2E'),
  frost: hex('#D8DDE2'), window: hex('#F0A04B'), nightSky: hex('#1F2C5A'), silver: hex('#A8B3C2'), grey: hex('#8A8A8A'),
  pale: hex('#EDEBE6'), sheen: hex('#3A4A7A'), viridian: hex('#4E8A6A'), gold: hex('#F2C14E'), peach: hex('#E9A37A'),
  cobalt: hex('#3D5A8A'), ink: hex('#1c1a1d'), coat: hex('#4a443f'),
};

// ── the first stroke: the thread of the film (warm orange knife + bright core) ──
export function firstStroke(out, x, y, o = {}) {
  const s = o.scale || 1, app = o.app != null ? o.app : 0;
  out.push({ x, y, ang: o.ang != null ? o.ang : -0.12, len: 110 * s, wid: 60 * s, c: PAL.first, c2: PAL.first2, type: KNIFE, skew: 0.42, run: 0.25, seed: 701, gmul: 0, hgt: 1.25, app, alpha: o.alpha, taper: 0.08 });
  out.push({ x: x + 6 * s, y: y - 2 * s, ang: -0.12, len: 34 * s, wid: 22 * s, c: mixc(PAL.first2, [1, 0.95, 0.8], 0.45), c2: PAL.first2, type: DAB, seed: 702, gmul: 0, hgt: 0.9, app: app + 0.12, alpha: o.alpha });
  return out;
}

// ── a faceless figure in a long coat ──
// o: {x, y (feet), h, facing:'back'|'front', walk (phase in cycles; two steps a cycle), stride (rad),
//     coat, lit, trousers, hair, skin, collar, sit (seat height in h; hips drop there),
//     armL / armR: [upper-arm angle from straight down (+ = screen right), elbow bend (+ = toward the body)],
//     hem (wind lift, ±), look (+ up / − down), light (−1 lit from the left, +1 from the right), seed, gmul, alpha}
export function figure(out, o) {
  const h = o.h, x = o.x, y = o.y, s0 = (o.seed || 0) * 97;
  const coat = o.coat || PAL.coat, lit = o.lit || mixc(coat, [0.92, 0.9, 0.86], 0.28);
  const dark = scalec(coat, 0.78);
  const trous = o.trousers || mixc(scalec(coat, 0.55), [0.1, 0.1, 0.12], 0.3), hair = o.hair || hex('#221d1c'), skin = o.skin || hex('#b88f74');
  const gm = o.gmul, al = o.alpha != null ? o.alpha : 1, front = o.facing === 'front';
  const L = o.light || -1;
  const ph = (o.walk || 0) * TAU, walking = o.walk != null && o.stride !== 0;
  const stride = walking ? (o.stride != null ? o.stride : 0.3) : 0;
  const bob = walking ? (0.5 - 0.5 * Math.cos(2 * ph)) * h * 0.012 : 0;
  const sit = o.sit || 0;
  const hipV = sit ? sit : 0.47, shV = hipV + 0.34, hdV = shV + 0.095;
  const P = (u, v) => [x + u * h, y - v * h - bob];
  const push = (q) => out.push(Object.assign({ gmul: gm, alpha: al, run: 0.06, hgt: 0.8 }, q));
  const blade = (a, b, w, c, c2, seed, q = {}) => push(Object.assign({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, ang: Math.atan2(b[1] - a[1], b[0] - a[0]), len: Math.hypot(b[0] - a[0], b[1] - a[1]), wid: w, c, c2, type: KNIFE, seed: s0 + seed, skew: 0.15 }, q));
  // ground shadow
  push({ x: x - L * h * 0.08, y: y + h * 0.006, ang: 0, len: h * 0.46, wid: h * 0.06, c: o.shadow || hex('#16151a'), type: DAB, alpha: al * 0.5, seed: s0 + 1, hgt: 0.1 });
  // legs
  const hip = P(0, hipV);
  for (let k = 0; k < 2; k++) {
    const side = k ? 1 : -1;
    if (sit) {
      const kn = P(side * 0.07, hipV - 0.06), ft = P(side * 0.075, 0.012);
      blade(P(side * 0.05, hipV), kn, h * 0.095, trous, scalec(trous, 1.2), 2 + k, { skew: 0 });
      blade(kn, ft, h * 0.07, scalec(trous, 0.85), trous, 6 + k, { taper: 0.15, skew: 0 });
      push({ x: ft[0], y: y - h * 0.008, ang: 0, len: h * 0.085, wid: h * 0.04, c: hex('#121113'), type: DAB, seed: s0 + 4 + k, hgt: 0.5 });
      continue;
    }
    const sw = Math.sin(ph + k * Math.PI) * stride, lift = walking ? Math.max(0, Math.sin(ph + k * Math.PI + Math.PI / 2)) * h * 0.035 : 0;
    const hx = hip[0] + side * h * 0.04;
    const ft = [hx + Math.sin(sw) * h * 0.47, hip[1] + Math.cos(sw) * h * 0.47 - lift];
    blade([hx, hip[1]], ft, h * 0.072, trous, scalec(trous, 0.8), 2 + k, { taper: 0.3 });
    push({ x: ft[0] + (front ? 0 : h * 0.01) * side, y: ft[1] - h * 0.006, ang: 0, len: h * 0.075, wid: h * 0.035, c: hex('#121113'), type: DAB, seed: s0 + 4 + k, hgt: 0.5 });
  }
  // coat: an A-line of three blades, shoulders to hem
  const hem = o.hem || 0;
  const hemV = sit ? hipV - 0.07 : hipV - 0.16;
  const topW = 0.21, botW = sit ? 0.3 : 0.26 + Math.abs(hem) * 0.05;
  const nb = o.blades || 3, half = (nb - 1) / 2;
  for (let i = 0; i < nb; i++) {
    const k = (i - half) / half;                     // −1 … 1 across the back
    const a = P(k * topW * 0.3, shV - 0.01), b = P(k * botW * 0.36 + hem * 0.06 * (1 + k * 0.6), hemV);
    const c = k * L > 0.5 ? lit : (k * L < -0.5 ? dark : mixc(coat, k * L > 0 ? lit : dark, Math.abs(k) * 0.5));
    blade(b, a, h * (nb > 3 ? 0.075 : (k ? 0.11 : 0.12)), c, Math.abs(k) < 0.3 ? dark : coat, 10 + i, { taper: 0.22, skew: 0.12 * k, run: 0.04, bend: nb > 3 ? 0.04 * k : 0 });
  }
  // hem lip, lit edge
  blade(P(-botW * 0.5 + hem * 0.06, hemV + 0.01), P(botW * 0.5 + hem * 0.1, hemV + 0.01 + hem * 0.02), h * 0.035, dark, coat, 15, { skew: 0.5, run: 0.1 });
  blade(P(L * topW * 0.47, shV - 0.03), P(L * botW * 0.49 + hem * 0.06, hemV + 0.03), h * 0.028, mixc(lit, [1, 0.97, 0.9], 0.2), lit, 14, { taper: 0.3, hgt: 1.1 });
  // shoulders: rounded caps
  for (let k = -1; k <= 1; k += 2) push({ x: P(k * 0.085, 0)[0], y: P(0, shV - 0.012)[1], ang: k * 0.35, len: h * 0.1, wid: h * 0.065, c: k === L ? lit : coat, type: DAB, seed: s0 + 16 + k, hgt: 0.9 });
  // arms
  for (let k = 0; k < 2; k++) {
    const side = k ? 1 : -1;
    const swing = walking ? -Math.sin(ph + k * Math.PI) * stride * 0.7 : 0;
    const arm = (k ? o.armR : o.armL) || [side * 0.06 + swing, 0.12];
    const a1 = arm[0], a2 = arm[0] - side * arm[1];
    const s = P(side * 0.1, shV - 0.03);
    const e = [s[0] + Math.sin(a1) * h * 0.19, s[1] + Math.cos(a1) * h * 0.19];
    const w = [e[0] + Math.sin(a2) * h * 0.18, e[1] + Math.cos(a2) * h * 0.18];
    const ac = side === L ? lit : dark;
    blade(s, e, h * 0.064, ac, coat, 20 + k, { taper: 0.15 });
    blade(e, w, h * 0.056, ac, coat, 22 + k, { taper: 0.25 });
    if (o.hands !== false || (k === 0 && o.handL)) push({ x: w[0] + Math.sin(a2) * h * 0.02, y: w[1] + Math.cos(a2) * h * 0.02, ang: a2 + Math.PI / 2, len: h * 0.045, wid: h * 0.036, c: skin, type: DAB, seed: s0 + 24 + k, hgt: 0.6 });
    if (k === 0) o._handL = w; else o._handR = w;
  }
  // collar, head
  const look = o.look || 0;
  if (o.collar !== false) for (let k = -1; k <= 1; k += 2) {
    const a = P(k * 0.04, shV - 0.005), b = P(k * 0.07 * (o.collarLift || 1), shV + 0.07 * (o.collarLift || 1));
    blade(a, b, h * 0.045, k === L ? mixc(coat, lit, 0.6) : coat, dark, 30 + k, { taper: 0.4, hgt: 1 });
  }
  const hd = P(look * 0.004, hdV + Math.min(0, look) * 0.03);
  if (front) {
    push({ x: hd[0], y: hd[1] + h * 0.005, ang: Math.PI / 2, len: h * 0.122, wid: h * 0.098, c: skin, c2: scalec(skin, 0.8), type: DAB, seed: s0 + 40, hgt: 0.9 });
    // hair: a cap over the top and the shadowed side of the face
    push({ x: hd[0], y: hd[1] - h * 0.04 + Math.max(0, -look) * h * 0.03, ang: 0, len: h * 0.12, wid: h * (0.055 + Math.max(0, -look) * 0.04), c: hair, type: KNIFE, seed: s0 + 41, skew: 0.3, run: 0, hgt: 1 });
    push({ x: hd[0] - L * h * 0.035, y: hd[1] + h * 0.01, ang: Math.PI / 2, len: h * 0.08, wid: h * 0.03, c: scalec(skin, 0.7), type: KNIFE, seed: s0 + 42, hgt: 0.5, alpha: al * 0.8 });
  } else {
    push({ x: hd[0], y: hd[1], ang: Math.PI / 2, len: h * 0.125, wid: h * 0.1, c: hair, c2: scalec(hair, 1.25), type: DAB, seed: s0 + 40, hgt: 0.9 });
    push({ x: hd[0] + L * h * 0.032, y: hd[1] + h * 0.012, ang: Math.PI / 2 + L * 0.2, len: h * 0.06, wid: h * 0.022, c: mixc(hair, skin, o.cheek ? 0.8 : 0.4), type: KNIFE, seed: s0 + 43, hgt: 0.6, alpha: al * 0.8 });
  }
  o._head = hd; o._shoulder = P(0, shV);
  return o;
}

// ── crow: one body mass + two wing blades ──
// o: {x, y, s, pose:'perch'|'fly'|'crouch'|'walk', flap (phase), dir (±1), head (0..1 up), seed, gmul, sheen (0..1)}
export function crow(out, o) {
  const s = o.s, d = o.dir || 1, s0 = 5000 + (o.seed || 0) * 31;
  const ink = PAL.ink, sheen = mixc(ink, PAL.sheen, 0.55 + 0.45 * (o.sheen || 0));
  const gm = o.gmul, al = o.alpha;
  const push = (q) => out.push(Object.assign({ gmul: gm, alpha: al, run: 0, hgt: 0.9, c2: sheen }, q));
  const pose = o.pose || 'perch';
  if (pose === 'fly') {
    const f = Math.sin((o.flap || 0) * TAU);
    const tilt = o.tilt || 0;
    push({ x: o.x, y: o.y, ang: tilt, len: s * 0.9, wid: s * 0.32, c: ink, type: DAB, seed: s0 });
    push({ x: o.x + d * s * 0.5 * Math.cos(tilt), y: o.y - s * 0.06 + d * s * 0.5 * Math.sin(tilt), ang: 0, len: s * 0.3, wid: s * 0.24, c: ink, type: DAB, seed: s0 + 1 });
    push({ x: o.x - d * s * 0.55, y: o.y + s * 0.03, ang: d > 0 ? Math.PI + tilt : tilt, len: s * 0.45, wid: s * 0.22, c: ink, type: KNIFE, taper: 0.5, seed: s0 + 2 });
    for (let k = 0; k < 2; k++) {
      const side = k ? 1 : -1;   // near / far wing
      const a = -Math.PI / 2 + side * 0.15 + f * 0.95 * (k ? 1 : 0.85);
      const L = s * (k ? 1.25 : 1.05);
      const bx = o.x - d * s * 0.05, by = o.y - s * 0.04;
      const ex = bx + Math.cos(a) * L * 0.5 * (k ? 1 : 0.9) * (0.6 + 0.4 * Math.abs(Math.cos(f))) - d * s * 0.15, ey = by + Math.sin(a) * L * 0.5;
      push({ x: ex, y: ey, ang: a + (d > 0 ? -0.35 : 0.35), len: L, wid: s * 0.36, c: k ? ink : sheen, c2: k ? sheen : ink, type: KNIFE, taper: 0.75, seed: s0 + 3 + k, skew: 0.3 * d });
    }
    return;
  }
  const crouch = pose === 'crouch' ? 1 : 0;
  const hy = (o.head || 0);
  const by = o.y - s * (0.42 - crouch * 0.1);
  // legs
  if (!crouch) for (let k = 0; k < 2; k++) push({ x: o.x + (k - 0.5) * s * 0.12, y: o.y - s * 0.12, ang: Math.PI / 2, len: s * 0.26, wid: s * 0.04, c: ink, type: LINE, seed: s0 + 10 + k, hgt: 0.4 });
  push({ x: o.x - d * s * 0.05, y: by, ang: -d * 0.35 * (1 - crouch * 0.6), len: s * 0.95, wid: s * (0.5 + crouch * 0.08), c: ink, type: DAB, seed: s0 });
  // folded wing (a blade over the body)
  push({ x: o.x - d * s * 0.12, y: by + s * 0.02, ang: d > 0 ? Math.PI - 0.45 : 0.45, len: s * 0.8, wid: s * 0.3, c: sheen, c2: ink, type: KNIFE, taper: 0.6, seed: s0 + 3, skew: 0.3 });
  push({ x: o.x - d * s * 0.55, y: by + s * 0.2, ang: d > 0 ? Math.PI - 0.6 : 0.6, len: s * 0.5, wid: s * 0.2, c: ink, type: KNIFE, taper: 0.6, seed: s0 + 4 });
  // head + beak
  const hx = o.x + d * s * 0.38, hyy = by - s * (0.3 + hy * 0.12) + crouch * s * 0.12;
  push({ x: hx, y: hyy, ang: 0, len: s * 0.34, wid: s * 0.3, c: ink, type: DAB, seed: s0 + 1 });
  push({ x: hx + d * s * 0.2, y: hyy + s * 0.02 - hy * s * 0.06, ang: d > 0 ? -hy * 0.5 : Math.PI + hy * 0.5, len: s * 0.22, wid: s * 0.08, c: hex('#2c2a2c'), type: KNIFE, taper: 0.9, seed: s0 + 2, skew: 0 });
}

// ── umbrella: a dome of radial blades from the tip to the rim, a shaft and a hooked handle ──
// o: {x, y (where the shaft meets the canopy rim), r, open 0..1 (overshoots on the snap), tilt, c, c2, seed, gmul}
export function umbrella(out, o) {
  const r = o.r, op = Math.max(0, o.open), tilt = o.tilt || 0, s0 = 7000 + (o.seed || 0) * 13;
  const c = o.c || PAL.umbrella, c2 = o.c2 || PAL.umbrella2, gm = o.gmul, al = o.alpha;
  const ca = Math.cos(tilt), sa = Math.sin(tilt);
  const R = (px, py) => [o.x + px * ca - py * sa, o.y + px * sa + py * ca];
  const push = (q) => out.push(Object.assign({ gmul: gm, alpha: al, run: 0.04, hgt: 1 }, q));
  const ink = hex('#241c18');
  const shaftL = r * 1.15;
  const sb = R(0, shaftL), st = R(0, -r * 0.62);
  push({ x: (sb[0] + st[0]) / 2, y: (sb[1] + st[1]) / 2, ang: Math.PI / 2 + tilt, len: shaftL + r * 0.62, wid: Math.max(3, r * 0.035), c: ink, type: LINE, seed: s0 });
  const hk = R(-r * 0.05, shaftL + r * 0.03);
  push({ x: hk[0], y: hk[1], ang: tilt + 0.6, len: r * 0.16, wid: Math.max(4, r * 0.06), c: hex('#4a3020'), type: KNIFE, taper: 0.3, seed: s0 + 1, run: 0 });
  const k = Math.min(op, 1.15), spread = 0.1 + 0.9 * k;
  const tipY = -r * (0.48 + 0.55 * (1 - Math.min(k, 1))) - r * 0.06 * Math.max(0, k - 1);
  const tip = R(0, tipY);
  if (op < 0.04) {   // furled: one tight blade along the shaft
    const m = R(0, -r * 0.1);
    push({ x: m[0], y: m[1], ang: -Math.PI / 2 + tilt, len: r * 1.0, wid: r * 0.17, c, c2, type: KNIFE, taper: 0.75, seed: s0 + 2, skew: 0 });
    return;
  }
  const n = 7;
  for (let i = 0; i < n; i++) {
    const th = Math.PI * (i + 0.5) / n;                     // front half of the rim
    const rim = R(-Math.cos(th) * r * spread, Math.sin(th) * r * 0.2 * spread - r * 0.04 * (1 - Math.sin(th)));
    const len = Math.hypot(rim[0] - tip[0], rim[1] - tip[1]);
    const w = r * spread * 2 / n * 1.35 * (0.75 + 0.25 * Math.sin(th));
    push({ x: (rim[0] + tip[0]) / 2, y: (rim[1] + tip[1]) / 2, ang: Math.atan2(tip[1] - rim[1], tip[0] - rim[0]), len: len * 1.04, wid: w, c: i % 2 ? c : c2, c2: i % 2 ? c2 : c, type: KNIFE, taper: 0.72, seed: s0 + 3 + i, skew: 0, run: 0 });
  }
  // rim: scallops and rib tips
  for (let i = 0; i <= n; i++) {
    const th = Math.PI * i / n, p = R(-Math.cos(th) * r * spread, Math.sin(th) * r * 0.2 * spread - r * 0.04 * (1 - Math.sin(th)));
    push({ x: p[0], y: p[1] + r * 0.012, ang: tilt, len: r * 0.06, wid: r * 0.04, c: ink, type: DAB, seed: s0 + 20 + i, hgt: 0.6 });
  }
  push({ x: tip[0], y: tip[1] - r * 0.03, ang: tilt - Math.PI / 2, len: r * 0.1, wid: r * 0.035, c: ink, type: KNIFE, seed: s0 + 30, run: 0 });
  o._tip = tip;
}

// ── rain: slanted thin lines, fixed seeds, wrapping in a rect ──
export function rain(out, o) {
  const [x0, y0, x1, y1] = o.rect, W = x1 - x0, H = y1 - y0, t = o.t;
  const ang = o.angle != null ? o.angle : 1.35, sp = o.speed || 1900;
  const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
  for (let k = 0; k < o.n; k++) {
    const r1 = hash1(k * 3.1 + 1), r2 = hash1(k * 5.7 + 2), r3 = hash1(k * 1.3 + 3);
    const spd = 0.8 + 0.4 * r3;
    let x = (r1 * W + vx * t * spd) % W; if (x < 0) x += W;
    let y = (r2 * H + vy * t * spd) % H; if (y < 0) y += H;
    out.push({ x: x0 + x, y: y0 + y, ang, len: (o.len || 46) * (0.6 + 0.6 * r3), wid: (o.wid || 2.2) * (0.7 + 0.5 * r1), c: o.c || hex('#c9ced6'), type: LINE,
      alpha: (o.alpha || 0.45) * (0.5 + 0.5 * r2), seed: 9000 + k, gmul: o.gmul, hgt: 0.5, wet: 0.6 });
  }
}

// ── things blown by wind / falling: leaves, confetti, petals ──
export function flutter(out, o) {
  const t = o.t, [x0, y0, x1, y1] = o.rect, W = x1 - x0, H = y1 - y0;
  for (let k = 0; k < o.n; k++) {
    const r1 = hash1(k * 2.3 + (o.seed || 0)), r2 = hash1(k * 4.1 + 7 + (o.seed || 0)), r3 = hash1(k * 6.7 + 3 + (o.seed || 0));
    const vx = (o.vx || 300) * (0.6 + 0.8 * r3), vy = (o.vy || -60) * (0.5 + r1);
    let x = (r1 * W + vx * t + Math.sin(t * 2.1 + k) * 40) % W; if (x < 0) x += W;
    let y = (r2 * H + vy * t + Math.sin(t * 3.3 + k * 1.7) * 60) % H; if (y < 0) y += H;
    const cols = o.colours;
    out.push({ x: x0 + x, y: y0 + y, ang: t * (2 + 6 * r3) * (r1 > 0.5 ? 1 : -1) + k, len: (o.size || 18) * (0.7 + 0.6 * r2) * (0.4 + 0.6 * Math.abs(Math.sin(t * 5 * r3 + k))), wid: (o.size || 18) * 0.55,
      c: cols[k % cols.length], type: o.type != null ? o.type : KNIFE, seed: 9500 + k + (o.seed || 0) * 100, alpha: o.alpha, gmul: o.gmul, run: 0, hgt: 0.6 });
  }
}

// ── an oil lamp / lantern: glass, flame, frame ──
export function lantern(out, o) {
  const s = o.s, x = o.x, y = o.y, gm = o.gmul, lit = o.lit != null ? o.lit : 1, s0 = 8000 + (o.seed || 0) * 7;
  const push = (q) => out.push(Object.assign({ gmul: gm, run: 0, hgt: 0.9 }, q));
  push({ x, y: y - s * 0.12, ang: 0, len: s * 0.7, wid: s * 0.16, c: hex('#3a2c22'), type: KNIFE, seed: s0 });     // base
  push({ x, y: y - s * 0.55, ang: Math.PI / 2, len: s * 0.7, wid: s * 0.5, c: mixc(hex('#6b5a48'), PAL.first2, 0.7 * lit), c2: mixc(hex('#5a4a3a'), PAL.first, lit), type: DAB, seed: s0 + 1, alpha: 0.9 });   // glass
  if (lit > 0.02) {
    const fl = 1 + 0.08 * Math.sin((o.t || 0) * 17) + 0.05 * Math.sin((o.t || 0) * 29);
    push({ x, y: y - s * 0.6, ang: -Math.PI / 2, len: s * 0.34 * lit * fl, wid: s * 0.16 * lit, c: mixc(PAL.first, [1, 0.97, 0.85], 0.55), c2: PAL.first2, type: KNIFE, taper: 0.9, seed: s0 + 2, hgt: 1.2 });
  }
  push({ x, y: y - s * 0.95, ang: 0, len: s * 0.42, wid: s * 0.1, c: hex('#3a2c22'), type: KNIFE, seed: s0 + 3 });   // cap
  if (o.handle) push({ x, y: y - s * 1.12, ang: 0, len: s * 0.3, wid: s * 0.05, c: hex('#2a2018'), type: LINE, seed: s0 + 4 });
}

// ── a paint ribbon: knife blades laid along a curve, one after another ──
// pts: polyline; prog 0..1 how far the knife has travelled; c: colour (or fn of k)
export function ribbon(out, pts, o) {
  const n = pts.length;
  // resample by arc length
  const acc = [0];
  for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = acc[n - 1], step = o.step || 26, m = Math.floor(total / step);
  const upto = (o.prog != null ? o.prog : 1) * m, from = (o.tail || 0) * m;
  for (let k = Math.floor(from); k < Math.min(upto, m); k++) {
    const d = k * step;
    let i = 1; while (i < n - 1 && acc[i] < d) i++;
    const f = (d - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]);
    const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f;
    const ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
    const fresh = Math.min(1, (upto - k) / 2);          // the newest blades are still being laid
    const w = typeof o.wid === 'function' ? o.wid(k / m) : (o.wid || 22);
    out.push({ x, y, ang: ang + Math.sin(k * 1.7) * 0.12, len: step * 2.1, wid: w * (0.85 + 0.3 * hash1(k + (o.seed || 0))), c: typeof o.c === 'function' ? o.c(k / m) : o.c, c2: o.c2,
      type: KNIFE, seed: (o.seed || 0) * 50 + k, run: 0.35, alpha: (o.alpha != null ? o.alpha : 1) * fresh, gmul: 0, hgt: 1.1 });
  }
}

// ── a wheat ear: a long thin blade bending in the wind ──
export function wheat(out, x, y, len, sway, o = {}) {
  const segs = 3, c = o.c || PAL.wheat, c2 = o.c2 || hex('#c99a3a');
  let px = x, py = y, a = -Math.PI / 2;
  for (let k = 0; k < segs; k++) {
    a += sway / segs * (k + 1) * 0.7;
    const L = len / segs;
    const nx = px + Math.cos(a) * L, ny = py + Math.sin(a) * L;
    out.push({ x: (px + nx) / 2, y: (py + ny) / 2, ang: a, len: L * 1.15, wid: k === segs - 1 ? len * 0.075 : len * 0.03, c: k === segs - 1 ? c : c2, c2: c, type: KNIFE, taper: k === segs - 1 ? 0.7 : 0.1, seed: (o.seed || 0) * 10 + k, gmul: o.gmul, run: 0.1, hgt: 0.8, alpha: o.alpha });
    px = nx; py = ny;
  }
  return [px, py];
}

// ── burst of knife-scraped colour (thrown wheat and confetti) ──
export function burst(out, o) {
  const p = Math.max(0, o.p), cols = o.colours;
  if (p <= 0 || p >= 1.6) return;
  for (let k = 0; k < o.n; k++) {
    const a = k / o.n * TAU + hash1(k + o.seed) * 0.6, sp = 0.55 + 0.45 * hash1(k * 3 + o.seed);
    const r = o.r * sp * (1 - Math.pow(1 - Math.min(p, 1), 2.4));
    const fall = Math.max(0, p - 0.6) * o.r * 0.25;
    const al = p < 1 ? 1 : Math.max(0, 1 - (p - 1) / 0.6);
    out.push({ x: o.x + Math.cos(a) * r, y: o.y + Math.sin(a) * r + fall, ang: a, len: o.size * (1.4 - 0.5 * Math.min(p, 1)) * (0.7 + 0.6 * sp), wid: o.size * 0.55, c: cols[k % cols.length], c2: cols[(k + 1) % cols.length],
      type: k % 3 ? KNIFE : DAB, seed: 9800 + k + o.seed * 100, alpha: al, gmul: 0, run: 0.25, hgt: 1 });
  }
}

export { strokePath, hash1 };
