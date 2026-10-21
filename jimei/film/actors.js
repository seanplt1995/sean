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

// ── a figure in a long coat: a small skeleton (pelvis, knees, elbows) dressed in fine knife strokes ──
// facing: 'back' | 'front' | 'left' | 'right'. Proportions are about eight heads; the coat is a grid of small
// blades that follows the silhouette and swings with the stride, edged so the shape stays crisp.
// o: {x, y (feet on the ground), h, facing, walk (phase, cycles; two steps a cycle), stride (hip swing, rad),
//     sway (standing weight shift −1…1), coat, lit, trousers, hair, skin, scarf (colour), collar, collarLift,
//     sit (seat height in h), armL / armR ([upper-arm angle from straight down, + = screen right; elbow bend toward
//     the body] — front/back views), pockets, hands (false hides them), hem (wind ±), look (+ up / − down),
//     light (−1 lit from the left, +1 from the right), coatLen, child, longHair (front view), seed, gmul, alpha}
export function figure(out, o) {
  const h = o.h, s0 = (o.seed || 0) * 97;
  const facing = o.facing || 'back', side = facing === 'left' || facing === 'right', front = facing === 'front', dir = facing === 'left' ? -1 : 1;
  const coat = o.coat || PAL.coat, Lr = o.light || -1;
  const litC = o.lit || mixc(coat, [0.96, 0.9, 0.8], 0.32), shadeC = mixc(scalec(coat, 0.7), [0.1, 0.11, 0.16], 0.12);
  const trous = o.trousers || mixc(scalec(coat, 0.62), [0.12, 0.12, 0.15], 0.35);
  const HAIRS = ['#2b2220', '#3a2a22', '#4a3326', '#231e1e', '#5a4636'];
  const hair = o.hair || hex(HAIRS[(o.seed || 0) % HAIRS.length]), skin = o.skin || hex('#b48a70'), shoe = hex('#121012');
  const gm = o.gmul, al = o.alpha != null ? o.alpha : 1;
  let sid = 0;
  const push = (q) => out.push(Object.assign({ gmul: gm, alpha: al, run: 0.03, hgt: 0.75, skew: 0.08, seed: s0 + (sid++) }, q));
  const blade = (a, b, w, c, c2, q = {}) => push(Object.assign({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, ang: Math.atan2(b[1] - a[1], b[0] - a[0]), len: Math.hypot(b[0] - a[0], b[1] - a[1]), wid: w, c, c2, type: KNIFE }, q));
  const shadeBy = (k) => (k > 0 ? mixc(coat, litC, Math.min(1, k) * 0.85) : mixc(coat, shadeC, Math.min(1, -k) * 0.85));
  const child = o.child ? 1 : 0;
  const big = h >= 380;   // close figures get softer, more drawn shapes; the small crowds keep their simple blocks
  const L1 = 0.245 - 0.03 * child, L2 = 0.238 - 0.03 * child, ankleH = 0.03;
  const headH = 0.112 * (1 + 0.28 * child), headW = 0.08 * (1 + 0.22 * child);
  const torso = 0.328 - 0.04 * child, shW = 0.112 * (1 - 0.1 * child);
  // ── skeleton (person space: X lateral = screen right in front/back views, Y up, Z forward) ──
  const walking = o.walk != null && (o.stride == null || o.stride > 0);
  const A = walking ? (o.stride != null ? o.stride : 0.3) : 0, ph = (o.walk || 0) * TAU, sway = o.sway || 0, sit = o.sit || 0;
  const legs = [0, 1].map((k) => {
    if (walking) { const p = ph + k * Math.PI; return { a: A * Math.sin(p), kn: A * 1.8 * Math.pow(Math.max(0, Math.cos(p)), 1.5) + 0.04 }; }
    const free = sway !== 0 && ((k === 0) === (sway > 0));
    return { a: free ? 0.07 : 0, kn: free ? 0.24 : 0.03 };
  });
  const hipY = sit ? sit : ankleH + Math.max(...legs.map(({ a, kn }) => L1 * Math.cos(a) + L2 * Math.cos(a - kn)));
  const hipX = walking ? 0.01 * Math.sin(ph) : 0.022 * sway, lean = walking ? 0.022 : 0;
  const P3 = (p) => side ? [o.x + (p[2] * dir + p[0] * 0.1 * dir) * h, o.y - p[1] * h] : [o.x + p[0] * h, o.y - (p[1] + (front ? -1 : 1) * p[2] * 0.16) * h];
  const J = legs.map(({ a, kn }, k) => {
    const sx = k ? 1 : -1, hp = [hipX + sx * 0.05, hipY, 0];
    let kp, ap;
    if (sit) { kp = [hp[0] + sx * 0.022, hipY - 0.012, L1 * 0.92]; ap = [kp[0] + sx * 0.006, ankleH, kp[2] + 0.025]; }
    else { kp = [hp[0] + sx * 0.003, hp[1] - L1 * Math.cos(a), L1 * Math.sin(a)]; ap = [kp[0] - sx * 0.002, kp[1] - L2 * Math.cos(a - kn), kp[2] + L2 * Math.sin(a - kn)]; }
    const heel = sit ? 0 : walking ? Math.max(0, -a) * 1.3 : (kn > 0.1 ? 0.45 : 0);
    const tp = [ap[0], ap[1] - 0.022 + Math.sin(heel) * 0.04, ap[2] + 0.068 * Math.cos(heel)];
    return { hp, kp, ap, tp };
  });
  const shY = hipY + torso, tilt = walking ? 0.005 * Math.sin(ph) : -0.008 * sway;
  const S = [-1, 1].map((sx) => [hipX * 0.35 + sx * shW, shY + sx * tilt, lean]);
  const look = o.look || 0;
  const tiltH = o.tiltHead || 0;   // a head leaning toward a neighbour
  const neck = [hipX * 0.35 + tiltH * 0.008, shY + 0.022, lean];
  const head = [hipX * 0.35 + tiltH * 0.026, shY + 0.036 + headH * 0.5 + Math.min(0, look) * 0.035 - Math.abs(tiltH) * 0.008, lean + 0.01 + Math.max(0, -look) * 0.035];
  const arms = [0, 1].map((k) => {
    const sx = k ? 1 : -1, sh = S[k], spec = k ? o.armR : o.armL;
    if (spec && !side) {
      const a1 = spec[0], a2 = spec[0] - sx * spec[1];
      const el = [sh[0] + Math.sin(a1) * 0.19, sh[1] - Math.cos(a1) * 0.19, sh[2]];
      return { sh, el, wr: [el[0] + Math.sin(a2) * 0.18, el[1] - Math.cos(a2) * 0.18, sh[2]], a2 };
    }
    if (o.pockets && !side) return big ? { sh, el: [sh[0] + sx * 0.022, sh[1] - 0.18, sh[2] + 0.01], wr: [sh[0] - sx * 0.004, sh[1] - 0.3, sh[2] + 0.03], hidden: true }
      : { sh, el: [sh[0] + sx * 0.04, sh[1] - 0.17, sh[2] + 0.01], wr: [sh[0] + sx * 0.012, sh[1] - 0.3, sh[2] + 0.03], hidden: true };
    const b = walking ? -0.8 * A * Math.sin(ph + k * Math.PI) : 0.04, e = 0.2 + (walking ? 0.28 * Math.max(0, Math.sin(ph + k * Math.PI + Math.PI)) : 0.06);
    const ox = side ? 0 : sx * 0.014;
    const el = [sh[0] + ox, sh[1] - 0.19 * Math.cos(b), sh[2] + 0.19 * Math.sin(b)];
    return { sh, el, wr: [el[0] - ox * 0.5, el[1] - 0.18 * Math.cos(b + e), el[2] + 0.18 * Math.sin(b + e)] };
  });
  // ── ground shadow ──
  const ft = P3([hipX, 0, 0]);
  push({ x: ft[0] - Lr * h * 0.09, y: o.y + h * 0.004, ang: 0, len: h * (sit ? 0.5 : 0.42), wid: h * 0.05, c: o.shadow || hex('#141317'), type: DAB, alpha: al * 0.45, hgt: 0.1 });
  // ── legs and shoes (far leg first in side view) ──
  const legOrder = side ? [0, 1] : [0, 1];
  const drawLeg = (k) => {
    const j = J[k], hp = P3(j.hp), kp = P3(j.kp), ap = P3(j.ap), tp = P3(j.tp), near = !side || k === 1;
    const tc = near ? trous : scalec(trous, 0.8);
    blade(hp, kp, h * 0.068, tc, scalec(tc, 1.2), { type: BRUSH, taper: 0.2, bend: 0.02 });
    blade(kp, ap, h * (big ? 0.056 : 0.052), tc, scalec(tc, 1.25), { type: BRUSH, taper: big ? 0.42 : 0.28, bend: big ? 0.025 * (k ? 1 : -1) : 0 });
    if (side) blade([ap[0] - dir * h * 0.018, ap[1]], tp, h * 0.036, shoe, shoe, { taper: 0.35, run: 0, hgt: 0.6 });
    else push({ x: (ap[0] + tp[0]) / 2 + (big ? (k ? 1 : -1) * h * 0.006 : 0), y: Math.max(ap[1], tp[1]) - h * 0.008, ang: big ? (k ? 0.18 : -0.18) : 0, len: h * (big ? 0.07 : 0.062), wid: h * (big ? 0.028 : 0.032), c: shoe, type: DAB, hgt: 0.55 });
  };
  legOrder.forEach(drawLeg);
  // ── the coat ──
  const hemY = sit ? hipY - 0.035 : (o.coatLen != null ? o.coatLen : 0.255 + 0.02 * child);
  const hem = o.hem || 0, kz = (J[0].kp[2] + J[1].kp[2]) / 2;
  const hemCX = (J[0].kp[0] + J[1].kp[0]) / 2 + hem * 0.05 + (walking ? 0.006 * Math.sin(ph) : 0);
  const flare = 0.012 + 0.03 * Math.abs(hem) + (walking ? 0.012 * Math.abs(Math.sin(ph)) : 0) + (sit ? 0.035 : 0);
  const prof = o.belt ? [[0, 0.122], [0.16, 0.106], [0.36, 0.084], [0.5, 0.1], [1, 0.13 + flare]] : [[0, 0.124], [0.16, 0.11], [0.36, 0.096], [0.5, 0.104], [1, 0.124 + flare]];
  const wProf = (t) => { for (let i = 1; i < prof.length; i++) if (t <= prof[i][0]) { const u = (t - prof[i - 1][0]) / (prof[i][0] - prof[i - 1][0]); const w = u * u * (3 - 2 * u); return lerp(prof[i - 1][1], prof[i][1], w); } return prof[prof.length - 1][1]; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const yAt = (t) => lerp(shY - 0.004, hemY, t);
  let coatPt;
  if (side) {
    const fz = Math.max(J[0].kp[2], J[1].kp[2]), bz = Math.min(J[0].kp[2], J[1].kp[2]);
    const front3 = [[0, 0.062], [0.18, 0.074], [0.38, 0.056], [0.55, 0.066], [1, Math.max(0.07, fz * 0.75 + 0.04)]];
    const back3 = [[0, -0.07], [0.18, -0.072], [0.38, -0.06], [0.55, -0.078], [1, Math.min(-0.09, bz * 0.75 - 0.06) - flare - hem * 0.04 * dir]];
    const at = (tab, t) => { for (let i = 1; i < tab.length; i++) if (t <= tab[i][0]) { const u = (t - tab[i - 1][0]) / (tab[i][0] - tab[i - 1][0]); return lerp(tab[i - 1][1], tab[i][1], u * u * (3 - 2 * u)); } return tab[tab.length - 1][1]; };
    coatPt = (s, t) => P3([hipX * 0.35, yAt(t), lean * (1 - t) + lerp(at(back3, t), at(front3, t), (s + 1) / 2)]);
  } else {
    const hemZ = sit ? L1 * 0.62 : kz * 0.5;
    const drop = (s, t) => big ? 0.036 * s * s * Math.max(0, 1 - t / 0.15) : 0;   // shoulders fall away from the neck
    coatPt = (s, t) => P3([lerp(neck[0], hemCX, t) + s * wProf(t), yAt(t) - drop(s, t), lerp(lean, hemZ, t)]);
  }
  // long knife panels from the shoulders to the hem, widening a little toward the hem
  const nu = h > 520 ? 5 : h > 170 ? 4 : 3;
  const sideK = side ? -dir * Lr : 1;     // in profile the light falls on the front or the back
  for (let i = 0; i < nu; i++) {
    const sU = -1 + (2 * i + 1) / nu, k = (side ? sU * sideK : sU * Lr) * (big ? 0.6 : 1);
    const a = coatPt(sU * 0.72, 0.03), b = coatPt(sU * 0.8, 0.985);
    const wTop = side ? Math.abs(coatPt(1, 0.15)[0] - coatPt(-1, 0.15)[0]) : 2 * wProf(0.15) * h;
    blade(a, b, wTop / nu * 1.3, shadeBy(k + 0.05), shadeBy(k - 0.3), { taper: -0.22, bend: 0.02 * sU, run: 0.02, skew: 0.35 * (i % 2 ? 1 : -1) });
  }
  // a few loose accents of broken colour inside the coat
  for (let q = 0; q < (h > 300 ? 5 : 2); q++) {
    const sU = ((q * 0.618 + (o.seed || 0) * 0.37) % 1) * 1.4 - 0.7, t = 0.2 + ((q * 0.381) % 1) * 0.65, k = (side ? sU * sideK : sU * Lr);
    const a = coatPt(sU, t - 0.09), b = coatPt(sU * 1.05, t + 0.09);
    blade(a, b, h * 0.03, shadeBy(k + (q % 2 ? 0.22 : -0.22)), coat, { alpha: al * 0.5, taper: 0.5, run: 0.5 });
  }
  // the silhouette: one long curved edge on each side — a lit rim on the light side, a dark line on the other
  for (const sg of [-1, 1]) {
    const isLit = side ? sg * sideK > 0 : sg * Lr > 0;
    const a = coatPt(sg * 0.96, 0.07), m = coatPt(sg * 0.98, 0.5), b = coatPt(sg * 0.99, 0.985);
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const off = ((m[0] - mx) * -(b[1] - a[1]) + (m[1] - my) * (b[0] - a[0])) / L;   // sag of the curve
    blade(a, b, h * 0.022, isLit ? mixc(litC, [1, 0.97, 0.9], 0.2) : scalec(shadeC, 0.78), isLit ? litC : shadeC, { taper: 0, bend: off / (L * 0.5), run: 0, hgt: 0.9, skew: 0 });
  }
  // sloped shoulders: one rounded stroke over the top of the coat
  if (big && !side) {
    const n = P3([neck[0], shY + 0.006, lean]);
    push({ x: n[0], y: n[1] + h * 0.022, ang: 0, len: h * 0.1, wid: h * 0.05, c: coat, c2: mixc(coat, shadeC, 0.3), type: DAB, hgt: 0.8 });
    for (const sg of [-1, 1]) {
      const tip = coatPt(sg * 1.0, 0.03), lit = sg * Lr > 0;
      blade([n[0] + sg * h * 0.012, n[1] + h * 0.008], [tip[0] - sg * h * 0.008, tip[1] + h * 0.016], h * 0.046, lit ? mixc(coat, litC, 0.45) : mixc(coat, shadeC, 0.2), coat, { type: BRUSH, bend: -0.12 * sg * (front ? -1 : 1) * 0, taper: 0.15, run: 0 });
    }
  } else {
    const l = coatPt(-1.05, 0.02), r = coatPt(1.05, 0.02), n = P3([neck[0], shY + 0.012, lean]);
    blade([l[0], l[1] + h * 0.012], [r[0], r[1] + h * 0.012], h * 0.05, mixc(coat, litC, 0.25), coat, { type: BRUSH, bend: (n[1] - (l[1] + r[1]) / 2) / (Math.hypot(r[0] - l[0], r[1] - l[1]) * 0.5) * 0.5, taper: 0, run: 0 });
  }
  if (o.belt) {   // a belted waist: the band and its knot
    blade(coatPt(-1.02, 0.36), coatPt(1.02, 0.36), h * (big ? 0.019 : 0.026), scalec(shadeC, 0.85), shadeC, { run: 0, skew: 0, bend: -0.04, hgt: 1 });
    const kx = coatPt(Lr * 0.45, 0.37);
    blade(kx, [kx[0] + Lr * h * 0.012, kx[1] + h * 0.09], h * 0.018, shadeC, scalec(shadeC, 0.85), { taper: 0.4, run: 0, bend: 0.08 });
  }
  // hem, folds, seams
  blade(coatPt(-1, 0.985), coatPt(1, 0.985), h * (big ? 0.012 : 0.02), scalec(shadeC, 0.9), shadeC, { run: 0.15, skew: 0.5, bend: big ? 0.05 : 0.03, alpha: al * (big ? 0.7 : 1) });
  if (h > 150) for (const fs of [-0.4, 0.34]) blade(coatPt(fs, 0.5), coatPt(fs + hem * 0.15, 0.96), h * 0.012, scalec(shadeC, 0.9), shadeC, { alpha: al * 0.6, taper: 0.6, bend: 0.05 * fs, run: 0.3 });
  if (!side && h > 200) {
    if (front) {
      blade(coatPt(0, 0.14), coatPt(0, 0.99), h * 0.009, scalec(shadeC, 0.8), shadeC, { alpha: al * 0.75, run: 0.2 });
      for (const sg of [-1, 1]) blade(P3([neck[0] + sg * 0.016, shY + 0.01, lean]), coatPt(sg * 0.4, 0.25), h * 0.028, sg * Lr > 0 ? litC : shadeBy(-0.4), coat, { taper: 0.55 });
    } else blade(coatPt(0, 0.64), coatPt(0, 0.99), h * 0.008, scalec(shadeC, 0.85), shadeC, { alpha: al * 0.6, run: 0.1 });
  }
  // ── arms ──
  const drawArm = (k) => {
    const a = arms[k], sh = P3(a.sh), el = P3(a.el), wr = P3(a.wr), sx = k ? 1 : -1;
    const isLit = side ? k === 1 && sideK > 0 : sx * Lr > 0, ac = isLit ? mixc(coat, litC, 0.6) : shadeBy(side && k === 0 ? -0.9 : -0.35);
    const sh2 = big && !side ? [sh[0] - sx * h * 0.026, sh[1] + h * 0.042] : [sh[0] - sx * h * 0.02, sh[1] + h * 0.02];
    const ex = (a, b, f) => [b[0] + (b[0] - a[0]) * f, b[1] + (b[1] - a[1]) * f];
    if (big) {
      blade(sh2, ex(sh2, el, 0.1), h * 0.05, ac, ac, { taper: 0.22, bend: 0.05 * sx, skew: 0, run: 0.02, type: BRUSH });
      push({ x: el[0], y: el[1], ang: Math.atan2(wr[1] - sh2[1], wr[0] - sh2[0]), len: h * 0.05, wid: h * 0.042, c: ac, c2: ac, type: DAB, hgt: 0.7 });
      blade(ex(wr, el, 0.06), wr, h * 0.04, ac, shadeBy(-0.45), { taper: 0.3, skew: 0, run: 0.02, type: BRUSH, bend: -0.03 * sx });
      if (isLit) blade(sh2, el, h * 0.009, mixc(litC, [1, 0.97, 0.9], 0.2), litC, { run: 0, hgt: 0.9, bend: 0.06 * sx, taper: 0.6, alpha: al * 0.7 });
    } else {
      blade(sh2, ex(sh2, el, 0.12), h * 0.052, ac, ac, { taper: 0.1, bend: 0.03 * sx, skew: 0, run: 0.02 });
      blade(ex(wr, el, 0.1), wr, h * 0.046, ac, shadeBy(-0.45), { taper: 0.18, skew: 0, run: 0.02 });
      if (isLit) blade(sh2, el, h * 0.013, mixc(litC, [1, 0.97, 0.9], 0.2), litC, { run: 0, hgt: 0.9, bend: 0.04 * sx });
    }
    const dx = wr[0] - el[0], dy = wr[1] - el[1], dl = Math.hypot(dx, dy) || 1;
    blade([wr[0] - dx / dl * h * 0.022, wr[1] - dy / dl * h * 0.022], wr, h * (big ? 0.038 : 0.047), scalec(shadeC, 0.92), shadeC, { run: 0, alpha: al * (big ? 0.8 : 1) });   // cuff
    const hd = [wr[0] + dx / dl * h * 0.026, wr[1] + dy / dl * h * 0.026];
    if (!a.hidden && o.hands !== false || (k === 0 && o.handL)) {
      push({ x: hd[0], y: hd[1], ang: Math.atan2(dy, dx), len: h * 0.04, wid: h * 0.026, c: skin, c2: scalec(skin, 0.82), type: DAB, hgt: 0.6 });
      blade(hd, [hd[0] + dx / dl * h * 0.018 - sx * h * 0.004, hd[1] + dy / dl * h * 0.018], h * 0.009, scalec(skin, 0.9), skin, { run: 0, hgt: 0.5 });
    }
    if (k === 0) o._handL = hd; else o._handR = hd;
  };
  if (side) drawArm(0);
  // collar, scarf, neck
  const nk = P3(neck), hd = P3(head);
  if (o.scarf) {
    push({ x: nk[0], y: nk[1] + h * 0.006, ang: 0.08, len: h * 0.14, wid: h * 0.05, c: o.scarf, c2: scalec(o.scarf, 0.8), type: KNIFE, run: 0.1, skew: 0.4 });
    blade([nk[0] + (side ? -dir : 1) * h * 0.03, nk[1] + h * 0.01], [nk[0] + (side ? -dir : 1) * h * 0.04 + hem * h * 0.05, nk[1] + h * 0.15], h * 0.032, o.scarf, scalec(o.scarf, 0.8), { taper: 0.3, bend: 0.06 });
  }
  if (o.collar !== false) {
    const cl = o.collarLift || 1;
    if (side) blade([nk[0] - dir * h * 0.035, nk[1] + h * 0.01], [nk[0] - dir * h * 0.03, nk[1] - h * 0.055 * cl], h * 0.04, shadeBy(-0.3), coat, { taper: 0.3, hgt: 1 });
    else if (big) {
      blade([nk[0] - h * 0.032, nk[1] + h * 0.004], [nk[0] + h * 0.032, nk[1] + h * 0.004], h * 0.03 * cl, shadeBy(-0.35), coat, { run: 0, bend: front ? -0.2 : 0.2, hgt: 1 });
      for (const sg of [-1, 1]) blade([nk[0] + sg * h * 0.022, nk[1] - h * 0.004], [nk[0] + sg * h * 0.072, nk[1] + h * 0.034], h * 0.032, sg * Lr > 0 ? mixc(coat, litC, 0.5) : shadeBy(-0.5), coat, { taper: 0.55, hgt: 1, bend: 0.1 * sg });
    } else for (const sg of [-1, 1]) blade([nk[0] + sg * h * 0.03, nk[1] + h * 0.012], [nk[0] + sg * h * 0.05 * cl, nk[1] - h * 0.05 * cl], h * 0.036, sg * Lr > 0 ? mixc(coat, litC, 0.5) : shadeBy(-0.5), coat, { taper: 0.4, hgt: 1 });
  }
  // ── head ──
  const hw = headW * h, hh = headH * h;
  const hairLit = mixc(hair, [0.62, 0.52, 0.44], 0.22);
  if (front) {
    // long hair: two dark falls behind the face, either side of the neck, down to the shoulders
    if (o.longHair) for (const sg of [-1, 1]) push({ x: hd[0] + sg * hw * 0.4, y: hd[1] + hh * 0.42, ang: Math.PI / 2 + sg * 0.06, len: hh * 1.25, wid: hw * 0.46, c: hair, c2: sg * Lr > 0 ? hairLit : hair, type: DAB, hgt: 0.9 });
    blade([nk[0], nk[1] + h * 0.005], [nk[0], hd[1] + hh * 0.3], h * 0.03, scalec(skin, 0.8), skin, { run: 0, hgt: 0.5 });
    push({ x: hd[0], y: hd[1] + hh * 0.06, ang: Math.PI / 2, len: hh * 0.9, wid: hw * 0.92, c: skin, c2: mixc(skin, [1, 0.9, 0.8], 0.15), type: DAB, hgt: 0.85 });
    blade([hd[0] - Lr * hw * 0.36, hd[1] - hh * 0.08], [hd[0] - Lr * hw * 0.3, hd[1] + hh * 0.4], hw * 0.26, scalec(skin, 0.76), scalec(skin, 0.82), { alpha: al * 0.8, taper: 0.45, run: 0 });
    const down = Math.max(0, -look);
    // hair: a soft mass over the crown, swept to one side, falling past the temples
    if (big) {
      push({ x: hd[0], y: hd[1] - hh * (0.27 - down * 0.08), ang: 0, len: hw * 1.02, wid: hh * (0.32 + down * 0.16), c: hair, c2: mixc(hair, hairLit, 0.3), type: DAB, hgt: 1 });
      const part = [hd[0] + Lr * hw * 0.16, hd[1] - hh * (0.5 - down * 0.06)];
      for (let q = 0; q < 8; q++) {
        const sg = q < 4 ? -1 : 1, j = q % 4, far = sg * Lr < 0;   // strands swept away from the parting, more of them to the far side
        const end = [hd[0] + sg * hw * (0.2 + j * 0.09), hd[1] + hh * (-0.18 + j * 0.13 + (far ? 0.04 : 0))];
        blade(part, end, hw * (0.2 - j * 0.02), sg * Lr > 0 ? hairLit : mixc(hair, hairLit, 0.12 * (j % 2)), hair, { taper: 0.8, run: 0.08, bend: sg * 0.16, alpha: al * 0.95 });
      }
    } else {
      push({ x: hd[0] + Lr * hw * 0.04, y: hd[1] - hh * (0.3 - down * 0.1), ang: 0.15 * Lr, len: hw * 1.12, wid: hh * (0.5 + down * 0.25), c: hair, c2: hairLit, type: DAB, hgt: 1 });
      blade([hd[0] - Lr * hw * 0.42, hd[1] - hh * 0.36], [hd[0] + Lr * hw * 0.5, hd[1] - hh * 0.06], hh * 0.2, hairLit, hair, { taper: 0.5, run: 0, bend: 0.12, alpha: al * 0.9 });
      for (const sg of [-1, 1]) blade([hd[0] + sg * hw * 0.44, hd[1] - hh * 0.2], [hd[0] + sg * hw * 0.48, hd[1] + hh * 0.2], hw * 0.16, hair, hair, { taper: 0.6, run: 0 });
    }
    // and the locks that fall past the cheeks onto the shoulders, the lit one catching the light
    if (o.longHair) for (const sg of [-1, 1]) blade([hd[0] + sg * hw * 0.44, hd[1] - hh * 0.12], [hd[0] + sg * hw * 0.58, hd[1] + hh * 0.98], hw * 0.17, sg * Lr > 0 ? hairLit : hair, hair, { taper: 0.6, run: 0.05, bend: -sg * 0.05 });
  } else if (side) {
    push({ x: hd[0] + dir * hw * 0.12, y: hd[1] + hh * 0.06, ang: Math.PI / 2 - dir * 0.12, len: hh * 0.86, wid: hw * 0.74, c: skin, c2: scalec(skin, 0.85), type: DAB, hgt: 0.85 });
    push({ x: hd[0] - dir * hw * 0.12, y: hd[1] - hh * 0.07, ang: Math.PI / 2 + dir * 0.35, len: hh * 0.9, wid: hw * 0.86, c: hair, c2: hairLit, type: DAB, hgt: 1 });
    blade([hd[0] + dir * hw * 0.2, hd[1] - hh * 0.45], [hd[0] - dir * hw * 0.45, hd[1] + hh * 0.2], hh * 0.16, hairLit, hair, { taper: 0.6, run: 0, bend: dir * 0.15 });
  } else {
    blade([nk[0], nk[1] + h * 0.004], [nk[0], hd[1] + hh * 0.3], h * 0.028, scalec(skin, 0.72), skin, { run: 0, hgt: 0.5 });
    push({ x: hd[0], y: hd[1] - hh * 0.04, ang: Math.PI / 2, len: hh * 0.96, wid: hw, c: hair, c2: hairLit, type: DAB, hgt: 0.9 });
    if (big) {
      // the hair as it lies: strands from the crown down to a soft, uneven nape line, one side catching the light
      for (let q = 0; q < 7; q++) {
        const u = -0.9 + q * 0.3, a0 = [hd[0] + u * hw * 0.22, hd[1] - hh * (0.42 - 0.12 * u * u)], b0 = [hd[0] + u * hw * 0.36 + hem * hw * 0.06, hd[1] + hh * (0.3 + 0.1 * Math.cos(q * 2.3) - 0.08 * u * u)];
        blade(a0, b0, hw * 0.24, u * Lr > 0.3 ? hairLit : mixc(hair, hairLit, 0.15 * ((q * 3) % 2)), hair, { taper: 0.85, run: 0.1, bend: -u * 0.12, alpha: al * 0.95 });
      }
      if (o.cheek || look > 0.2) push({ x: hd[0] + Lr * hw * 0.47, y: hd[1] + hh * 0.12, ang: Math.PI / 2 - Lr * 0.2, len: hh * 0.3, wid: hw * 0.16, c: mixc(skin, [1, 0.92, 0.82], 0.1), c2: skin, type: DAB, hgt: 0.7, alpha: al * 0.9 });
    } else {
      push({ x: hd[0] + hem * hw * 0.1, y: hd[1] + hh * 0.22, ang: Math.PI / 2, len: hh * 0.42, wid: hw * 0.76, c: hair, c2: hair, type: DAB, hgt: 0.85 });
      blade([hd[0] + Lr * hw * 0.2, hd[1] - hh * 0.44], [hd[0] + Lr * hw * 0.46, hd[1] + hh * 0.2], hw * 0.2, hairLit, hair, { taper: 0.55, run: 0, bend: -Lr * 0.12, alpha: al * 0.9 });
      if (o.cheek || look > 0.2) blade([hd[0] + Lr * hw * 0.42, hd[1] - hh * 0.05], [hd[0] + Lr * hw * 0.46, hd[1] + hh * 0.38], hw * 0.18, mixc(skin, [1, 0.92, 0.82], 0.1), skin, { taper: 0.4, run: 0, alpha: al * 0.9 });
    }
  }
  if (side) drawArm(1); else { drawArm(0); drawArm(1); }
  o._head = hd; o._shoulder = P3([0, shY, lean]);
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
