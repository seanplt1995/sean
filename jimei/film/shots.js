// shots.js — the 24 shots. Every action is written in beats: B(n) is the time of beat n.
// No people walk through these places any more: the light and the crows carry the story; only the woman on the
// ridge (S16–S18) remains.
import { Strokes, KNIFE, DAB, LINE, hex, mixc, hash1 } from '../engine/impasto.js';
import { B, beatAt, prog, lerp, smooth, easeOut, easeIn, easeInOut, spring, clamp01, TL } from './timeline.js';
import { PAL, firstStroke, figure, crow, umbrella, rain, flutter, lantern, ribbon, wheat, burst } from './actors.js';
import { TITLE } from './plates/title.js';
import { QUAY, WIN, CAFE } from './plates/arles.js';
import { FIELD3, f3ground, F3, EDGE } from './plates/provence.js';
import { HARB, RIDGE } from './plates/coast.js';
import { OVER } from './plates/overhead.js';

const S = () => new Strokes(2048);
const cam = (x, y, zoom = 1, rot = 0) => ({ x, y, zoom, rot });
// keep the camera inside the painted plate
const clampCam = (c, r) => {
  const z = c.zoom || 1, a = c.rot || 0, hw = 540 / z, hh = 960 / z;
  const ex = Math.abs(Math.cos(a)) * hw + Math.abs(Math.sin(a)) * hh, ey = Math.abs(Math.sin(a)) * hw + Math.abs(Math.cos(a)) * hh;
  return cam(Math.max(r[0] + ex, Math.min(r[2] - ex, c.x)), Math.max(r[1] + ey, Math.min(r[3] - ey, c.y)), z, a);
};
const lerpCam = (a, b, t) => cam(lerp(a.x, b.x, t), lerp(a.y, b.y, t), Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)), lerp(a.rot || 0, b.rot || 0, t));
const scr = (c, p) => [(p[0] - c.x) * c.zoom / 1080 + 0.5, (p[1] - c.y) * c.zoom / 1920 + 0.5];   // world → 0..1 screen (for glows)
const NIGHT_POST = { amb: 0.82, dif: 0.26, spec: 0.24, vig: 0.28 };
const DUSK_POST = { amb: 0.84, dif: 0.3, spec: 0.18, vig: 0.2, warm: 0.25 };
const SQ = [0, 0, 1080, 2600], FULL = [0, 0, 1080, 1920], WIDE = [0, 0, 1440, 2560];

// first stroke position (plate coords, P1) and its screen anchor (540, 980)
const FS = [720, 1300];
const CAM_P1 = (t) => cam(720, 1280, lerp(1, 1.04, smooth(prog(t, 0, B(8)))));

// ───────────────────────── prelude ─────────────────────────
function drawLinen(F, t, c) {
  const p = F.store.plate('linen');
  F.E.under(p.tex, p.w, p.h, { cam: c, weave: 0.075 });
}
function knifeShadow(out, x0, y0, x1, y1, k, w = 70) {
  // a blade's soft shadow sliding across the canvas just before it lands
  if (k <= 0 || k >= 1) return;
  const x = lerp(x0, x1, k), y = lerp(y0, y1, k);
  out.push({ x, y: y + 28, ang: Math.atan2(y1 - y0, x1 - x0) - 0.25, len: w * 2.6, wid: w * 0.9, c: hex('#4a3f34'), type: DAB, alpha: 0.16 * Math.sin(k * Math.PI), hgt: 0, seed: 11, gmul: 0 });
}

const S01 = {
  id: 'S01', t0: 0, b1: 8, clear: hex('#B9AE9C'),
  draw(F, t) {
    const c = CAM_P1(t), s = S();
    drawLinen(F, t, c);
    knifeShadow(s, FS[0] - 260, FS[1] - 120, FS[0] + 40, FS[1] - 10, prog(t, B(0) - 0.22, B(0) + 0.05));
    if (t >= B(0)) firstStroke(s, FS[0], FS[1], { app: 0 });
    F.E.drawNow(s, { cam: c, t, appear: B(0), appDur: 0.16 });
    // b4: the light swings a little, the ridge of the stroke flashes
    const k = Math.sin(Math.PI * prog(t, B(4), B(5.5)));
    return { light: [-0.55 - 0.35 * k, -0.6 + 0.3 * k, 0.7 - 0.25 * k], spec: 0.2 + 0.25 * k, vig: 0.12 };
  },
};

const S02 = {
  id: 'S02', b0: 8, b1: 16, clear: hex('#B9AE9C'),
  draw(F, t) {
    const c = CAM_P1(t), s = S(), E = F.E;
    drawLinen(F, t, c);
    // the title is laid in from left to right in one second, then scraped off in the breath at 12.2 s
    const scrape0 = 12.2, scrape1 = 12.5;
    const bx = lerp(TITLE.cx - 520, TITLE.cx + 560, easeInOut(prog(t, scrape0, scrape1)));
    if (t < scrape1 + 0.05) {
      const p = F.store.plate('title');
      const o = { cam: c, t, M: p.M, appDur: 0.12 };
      o.appW = [1, 0, 1.0 / 840, 2];     // key = x / 840 s: one second across the word
      o.appear = B(8) - (TITLE.cx - 420) / 840;
      if (t >= scrape0) o.clip = [bx, -1e5, 1e5, 1e5];
      E.under(p.tex, p.w, p.h, { cam: c, rect: p.rect, t, appW: o.appW, appear: o.appear + 0.08, appDur: 0.2, alpha: 0.85, clip: o.clip });
      if (!(t >= scrape0 && bx > TITLE.cx + 500)) E.draw(p.batch, o);
    }
    if (t >= scrape0) {
      // what the scrape leaves: thin horizontal smears of the title's colour on the linen
      for (let k = 0; k < 22; k++) {
        const y = TITLE.cy - 170 + k * 16 + Math.sin(k * 3.1) * 5, x0 = TITLE.cx - 430, x1 = Math.min(bx, TITLE.cx + 440);
        if (x1 <= x0) break;
        if (hash1(k * 7) < 0.35) continue;
        const ink = hash1(k * 3.3), xa = x0 + hash1(k * 5.1) * 220, xb = x1 - hash1(k * 9.7) * 260;
        if (xb <= xa) continue;
        s.push({ x: (xa + xb) / 2, y, ang: 0.012 * Math.sin(k), len: xb - xa, wid: 7 + 9 * hash1(k), c: mixc(hex('#9A4E2A'), PAL.linen, 0.45 + 0.4 * ink), c2: mixc(hex('#C08A3E'), PAL.linen, 0.6), type: KNIFE, alpha: 0.35 + 0.35 * hash1(k * 2.2), hgt: 0.3, run: 0.95, seed: 1200 + k, gmul: 0, skew: 0.9 });
      }
      knifeShadow(s, TITLE.cx - 520, TITLE.cy + 40, TITLE.cx + 560, TITLE.cy + 40, prog(t, scrape0 - 0.05, scrape1 + 0.05), 180);
    }
    firstStroke(s, FS[0], FS[1]);
    E.drawNow(s, { cam: c, t });
    return { vig: 0.12 };
  },
};

// ───────────────────────── shared pieces ─────────────────────────
function wireCrows(out, wire, n, t, o = {}) {
  const res = [];
  for (let k = 0; k < n; k++) {
    const idx = Math.round(wire.length * (0.18 + 0.64 * k / (n - 1)) + Math.sin(k * 2.3) * 1.5);
    const [x, y] = wire[Math.max(0, Math.min(wire.length - 1, idx))];
    res.push([x, y]);
    if (o.skip && o.skip(k)) continue;
    const head = 0.5 + 0.5 * Math.sin(beatAt(t) * 0.5 + k * 1.9) > 0.8 ? 0.35 : 0;
    crow(out, { x, y: y + 2, s: (o.s || 34) * (1 + 0.1 * Math.sin(k * 5)), pose: 'perch', dir: k % 3 ? -1 : 1, head, seed: k, gmul: 1 });
  }
  return res;
}
// a window lighting up: warm blades dragged into its quad, a mullion, a soft halo, a faint reflection below
function litWindow(out, w, t0, t, o = {}) {
  if (t < t0) return;
  const q = w.q, cx = w.c[0], cy = w.c[1];
  const wd = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), ht = Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]);
  const ang = Math.atan2(q[3][1] - q[0][1], q[3][0] - q[0][0]);
  const k = clamp01((t - t0) / 0.25), seed = (o.seed || 0) * 7;
  if (o.halo) out.push({ x: cx, y: cy, ang: 0, len: Math.max(wd, ht) * o.halo, wid: Math.max(wd, ht) * o.halo, c: PAL.window, type: DAB, alpha: 0.3 * k, seed: 8090 + seed, gmul: 0, hgt: 0.02 });
  for (let i = -1; i <= 1; i++) {
    const ox = i * wd * 0.3;
    out.push({ x: cx + Math.cos(ang - Math.PI / 2) * ox, y: cy + Math.sin(ang - Math.PI / 2) * ox, ang, len: ht * 0.98, wid: wd * 0.42, c: PAL.window, c2: PAL.first2, type: KNIFE, seed: 8100 + seed + i, gmul: 0, run: 0, app: t0 + Math.abs(i) * 0.05, hgt: 0.9, skew: 0 });
  }
  out.push({ x: cx, y: cy, ang, len: ht * 0.95, wid: Math.max(1.5, wd * 0.07), c: hex('#3a2a1e'), type: LINE, seed: 8150 + seed, gmul: 0, app: t0 + 0.1 });
  if (o.reflect) for (let r = 0; r < 4; r++) out.push({ x: cx + Math.sin(r * 2) * 4, y: o.reflect + r * 7, ang: 0, len: wd * (1.1 - r * 0.2), wid: 5, c: mixc(PAL.window, hex('#5b6c97'), 0.3 + r * 0.12), type: DAB, alpha: 0.7 * k * (1 - r / 5), seed: 8160 + seed + r, gmul: 0, wet: 1, hgt: 0.3 });
}
function bez(a, c, b, n = 24) { const o = []; for (let i = 0; i <= n; i++) { const u = i / n; o.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]]); } return o; }
const along = (path, u) => { const f = clamp01(u) * (path.length - 1), j = Math.min(path.length - 2, Math.floor(f)), r = f - j; return [lerp(path[j][0], path[j + 1][0], r), lerp(path[j][1], path[j + 1][1], r)]; };
const TRAIL = (k) => mixc(hex('#fff1c2'), PAL.gold, 0.35 + 0.35 * Math.sin(k * 11));
// a crow with a spark of light in its beak, and the faint wake of that spark
function emberCrow(out, x, y, s, dir, t, seed, o = {}) {
  crow(out, { x, y, s, pose: 'fly', flap: t * 2.6 + seed * 0.37, dir, seed, tilt: o.tilt || 0, gmul: 1 });
  const bx = x + dir * s * 0.74, by = y - s * 0.03, e = s * 0.38;
  out.push({ x: bx, y: by, ang: 0, len: e * 5, wid: e * 5, c: PAL.window, type: DAB, alpha: 0.25, seed: 9900 + seed, gmul: 0, hgt: 0.05 });
  out.push({ x: bx, y: by, ang: 0, len: e, wid: e, c: hex('#fff1c2'), c2: PAL.first2, type: DAB, seed: 9901 + seed, gmul: 0, hgt: 1 });
  (o.wake || []).forEach(([wx, wy], k) => out.push({ x: wx, y: wy, ang: 0, len: e * (0.8 - k * 0.12), wid: e * (0.8 - k * 0.12), c: mixc(hex('#fff1c2'), PAL.window, 0.5), type: DAB, alpha: 0.55 * (1 - k / 6), seed: 9910 + seed * 7 + k, gmul: 0, hgt: 0.4 }));
}
const spark = (out, x, y, e, seed, a = 1) => {
  out.push({ x, y, ang: 0, len: e * 5, wid: e * 5, c: PAL.window, type: DAB, alpha: 0.25 * a, seed: 9950 + seed, gmul: 0, hgt: 0.05 });
  out.push({ x, y, ang: 0, len: e, wid: e, c: hex('#fff1c2'), c2: PAL.first2, type: DAB, alpha: a, seed: 9951 + seed, gmul: 0, hgt: 1 });
};
// a crow flying a path from a to b (an arc over cp), carrying a spark; returns its position
function carry(out, a, cp, b, u, t, s, seed, o = {}) {
  const path = bez(a, cp, b, 30), [x, y] = along(path, u), [nx, ny] = along(path, u + 0.02), dir = nx >= x ? 1 : -1;
  emberCrow(out, x, y, s, dir, t, seed, { tilt: Math.atan2(ny - y, Math.abs(nx - x) + 1e-3) * 0.5, wake: [1, 2, 3, 4, 5].map((k) => along(path, Math.max(0, u - 0.03 * k))).map(([wx, wy]) => [wx + dir * s * 0.74, wy]) });
  return [x, y];
}
// warm drifting confetti and leaves on the wind
const FEST = [hex('#e85a5a'), hex('#f2c14e'), hex('#5ab0e0'), hex('#f0f0e8'), hex('#6ac08a'), hex('#e890c0'), hex('#9a6a3a')];

// ───────────────────────── act one · 散场 ─────────────────────────
// the cathedral square after the festival, grey; only the window the first stroke became is warm
function bulbs(out, st, t, outBeats) {
  st.strings.forEach((pts, si) => {
    const off = t >= B(outBeats[si]);
    const flick = !off && t > B(outBeats[si]) - 0.12 && Math.sin(t * 90) > 0;
    const sz = [15, 13, 11, 9][si];
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i], lit = !off && !flick;
      out.push({ x, y: y + sz * 0.5, ang: 0, len: sz, wid: sz * 1.15, c: lit ? hex('#fff1c8') : hex('#5b5f6c'), c2: lit ? hex('#ffd890') : hex('#454955'), type: DAB, seed: 2000 + si * 40 + i, gmul: 1, hgt: 0.8, run: 0 });
      if (lit) out.push({ x, y: y + sz * 0.5, ang: 0, len: sz * 3.2, wid: sz * 3.2, c: hex('#ffd890'), type: DAB, alpha: 0.12, seed: 2400 + si * 40 + i, gmul: 1, hgt: 0.02 });
    }
  });
}
const sqWide = (st) => cam(540, st.DY + 960, 1);
function squareCamS03(st, t) {
  const start = clampCam(cam(st.warmC[0], st.warmC[1], 2.2), SQ), wide = sqWide(st);
  if (t < B(24)) return lerpCam(start, wide, easeInOut(prog(t, B(16), B(24))));
  return clampCam(lerpCam(wide, cam(560, st.DY + 950, 1.06), smooth(prog(t, B(24), B(32)))), SQ);
}
const S03 = {
  id: 'S03', b0: 16, b1: 32,
  layers: () => [{ plate: 'square', D: 2.5 }],
  draw(F, t) {
    const st = F.store.plate('square').info, E = F.E, c = squareCamS03(st, t);
    const T0 = B(16), sweep = 0.85;
    if (t < T0 + sweep + 0.1) {
      // paint-over from the bottom of the frame to the top, over the linen and the first stroke
      S02.draw(F, Math.min(t, B(16) - 1e-3));
      const vb = F.store.viewBox(c), k = sweep / (vb[3] - vb[1]);
      F.store.drawLive('square', { cam: c, t, grey: 1, appW: [0, -1, k, 2], appear: T0 + vb[3] * k - 0.05, appDur: 0.18, uAppW: [0, -1, k, 2], uAppear: T0 + vb[3] * k + 0.1, uAppDur: 0.25 });
    } else F.store.drawPlate('square', { cam: c, t, grey: 1 });
    const s = S();
    litWindow(s, { q: st.warmQ, c: st.warmC }, -1, t, { seed: 1, halo: 2.2 });
    bulbs(s, st, t, [24, 26, 28, 30]);
    wireCrows(s, st.wire, 7, t, { s: 30 });
    // the festival's confetti still drifting down over the square
    flutter(s, { t, rect: [c.x - 640, c.y - 1100, c.x + 640, c.y + 1100], n: 50, vx: 60, vy: 90, size: 14, colours: FEST, seed: 5, gmul: 1 });
    E.drawNow(s, { cam: c, t, grey: 1, appear: t < T0 + sweep ? T0 + 0.6 : -1e6, appDur: 0.2 });
    return Object.assign({}, NIGHT_POST, { glow: [...scr(c, st.warmC), 0.06 * c.zoom, 0.35, 1, 0.62, 0.3] });
  },
};

// the quay: an empty bench under the gas lamp
const S04 = {
  id: 'S04', b0: 32, b1: 48,
  layers: () => [{ plate: 'quay', D: 2.6 }],
  draw(F, t) {
    const qi = F.store.plate('quay').info, E = F.E;
    const c = clampCam(lerpCam(cam(540, 960, 1), cam(560, 1150, 1.25), easeInOut(prog(t, B(36), B(48)))), FULL);
    F.store.drawPlate('quay', { cam: c, t, grey: 1 });
    const s = S();
    const pos = wireCrows(s, qi.wire, 5, t, { s: 34 });
    // b44: a black feather lets go of the wire and settles on the empty seat at b47
    const fk = prog(t, B(44), B(47)), [x0, y0] = pos[3], land = [QUAY.bench[0] + 70, QUAY.seatY - 12];
    if (t >= B(44)) {
      const x = lerp(x0, land[0], fk) + Math.sin(fk * 9) * 70 * (1 - fk), y = lerp(y0 + 20, land[1], easeIn(fk) * 0.4 + fk * 0.6);
      s.push({ x, y, ang: fk < 1 ? Math.sin(fk * 9 + 1) * 0.8 + 0.4 : 0.15, len: 34, wid: 10, c: PAL.ink, c2: PAL.sheen, type: KNIFE, taper: 0.7, seed: 4400, run: 0, gmul: 1 });
    }
    // dry leaves skittering along the quay
    flutter(s, { t, rect: [c.x - 600, 1450, c.x + 600, 1900], n: 14, vx: 160, vy: 10, size: 16, colours: [hex('#a8682a'), hex('#c8902e'), hex('#7a5a2a')], seed: 8, gmul: 1 });
    E.drawNow(s, { cam: c, t, grey: 1 });
    // b40: the lamp flickers
    const fl = t > B(40) && t < B(40) + 0.5 ? (Math.sin((t - B(40)) * 70) > 0.2 ? 0.0 : 1) : 1;
    return Object.assign({}, NIGHT_POST, { glow: [...scr(c, QUAY.lamp), 0.16, 0.55 * fl, 0.9, 0.85, 0.7], expo: 0.94 + 0.06 * fl });
  },
};

// ───────────────────────── act two · 小小的光 ─────────────────────────
// the window: tilt up from its reflection in a puddle; a crow brings a spark and the lamp is turned up at b56
const S05 = {
  id: 'S05', b0: 48, b1: 64,
  layers: () => [{ plate: 'window3', D: 2.5, revW: [WIN.lamp[0], WIN.lamp[1] - 60, 1.58 / 300] }],
  draw(F, t) {
    const E = F.E, revW = [WIN.lamp[0], WIN.lamp[1] - 60, 1.58 / 300];
    const c = clampCam(lerpCam(cam(540, 2300, 1.15), cam(540, 1010, 1.15), easeInOut(prog(t, B(48), B(56)))), SQ);
    // the lamp is turned up at b56: colour spreads 300 px from it in two beats, then stops
    const tR = Math.min(t, B(56) + 1.58 + 0.4);
    F.store.drawPlate('window3', { cam: c, t: tR, grey: 1, reveal: B(56), revDur: 0.4, revW });
    const s = S(), up = smooth(prog(t, B(56), B(56) + 0.35));
    lantern(s, { x: WIN.lamp[0], y: WIN.lamp[1], s: 120, lit: 0.18 + 0.82 * up, t, gmul: 0, seed: 1 });
    // the crow flies in from the right with a spark (b52 → b55), waits a beat on the sill, gives it to the wick at b56
    const perch = [575, WIN.sill + 6], wick = [WIN.lamp[0], WIN.lamp[1] - 70];
    if (t >= B(52) && t < B(55)) carry(s, [1200, 760], [900, 640], [perch[0], perch[1] - 30], easeInOut(prog(t, B(52), B(55))), t, 70, 11);
    else if (t >= B(55)) {
      crow(s, { x: perch[0], y: perch[1], s: 70, pose: 'perch', dir: -1, head: t < B(56) ? 0.15 : 0.35, seed: 11, gmul: 1 });
      const bk = [perch[0] - 70 * 0.58, perch[1] - 70 * 0.7];
      if (t < B(56)) spark(s, bk[0], bk[1], 26 * 0.38 * 1.4, 1);
      else if (t < B(56) + 0.25) { const u = (t - B(56)) / 0.25; spark(s, lerp(bk[0], wick[0], u), lerp(bk[1], wick[1], u) - Math.sin(u * Math.PI) * 40, 10, 2, 1 - u * 0.3); }
    }
    // the puddle holds the window's light once the lamp is up
    if (up > 0) for (let r = 0; r < 6; r++) s.push({ x: WIN.puddle[0] - 70 + Math.sin(r * 2.3) * 14, y: WIN.puddle[1] - 50 + r * 14, ang: 0, len: 90 - r * 10, wid: 7, c: PAL.window, type: DAB, alpha: 0.6 * up * (1 - r / 7), seed: 5200 + r, gmul: 0, wet: 1, hgt: 0.3 });
    E.drawNow(s, { cam: c, t });
    return Object.assign({}, NIGHT_POST, { glow: [...scr(c, [WIN.lamp[0], WIN.lamp[1] - 70]), 0.12 + 0.1 * up, 0.15 + 0.6 * up, 1, 0.62, 0.3] });
  },
};

// the street through the window, from inside the dark room: frame, sill and lamp in the foreground (screen space)
function windowForeground(out, t, lampLit, moon) {
  const wood = mixc(hex('#2a221c'), hex('#7a5a40'), 0.5 * lampLit), rim = mixc(wood, hex('#9fb0d0'), 0.5 * moon);
  out.push({ x: 40, y: 1250, ang: Math.PI / 2, len: 1500, wid: 110, c: hex('#17130f'), c2: hex('#221a14'), type: KNIFE, seed: 6001, run: 0, gmul: 0, skew: 0 });
  out.push({ x: 96, y: 1250, ang: Math.PI / 2, len: 1500, wid: 18, c: rim, type: KNIFE, seed: 6002, run: 0, gmul: 0, skew: 0 });
  out.push({ x: 300, y: 1840, ang: 0, len: 760, wid: 180, c: hex('#140f0c'), c2: hex('#1e1712'), type: KNIFE, seed: 6003, run: 0, gmul: 0, skew: 0 });
  out.push({ x: 290, y: 1742, ang: 0.01, len: 700, wid: 40, c: mixc(wood, hex('#e0a060'), 0.55 * lampLit), c2: rim, type: KNIFE, seed: 6004, run: 0.1, gmul: 0, skew: 0.3 });
  out.push({ x: 640, y: 1650, ang: Math.PI / 2, len: 240, wid: 30, c: hex('#1a1410'), type: KNIFE, seed: 6005, run: 0, gmul: 0, skew: 0 });
}
// the lamp goes out; the moon lays the whole square back in silver-blue
const S06 = {
  id: 'S06', b0: 64, b1: 72,
  layers: (F) => { const st = F.store.plate('square').info; return [{ plate: 'square', D: 2.5, revW: [st.moon[0], st.moon[1], 1 / 900] }]; },
  draw(F, t) {
    const st = F.store.plate('square').info, E = F.E, revW = [st.moon[0], st.moon[1], 1 / 900];
    const c = cam(540, 1320, 1);
    F.store.drawPlate('square', { cam: c, t, grey: 1, reveal: B(66), revDur: 0.5, revW });
    const s = S();
    // clouds slide off the moon
    const open = easeInOut(prog(t, B(64.5), B(67)));
    for (let k = 0; k < 7; k++) s.push({ x: st.moon[0] - 120 + (k % 4) * 80 + open * 520 + k * 12, y: st.moon[1] - 60 + Math.floor(k / 4) * 80 + (k % 2) * 26, ang: -0.06, len: 210 - (k % 3) * 30, wid: 100, c: hex('#1a2a58'), c2: hex('#2a3a6a'), type: DAB, seed: 6100 + k, run: 0, alpha: 1 - smooth(prog(t, B(66), B(67.5))), gmul: 1, hgt: 0.6 });
    // the moon in the puddles
    const mr = smooth(prog(t, B(66), B(69)));
    for (const [px, py, pr] of st.puddles) for (let k = 0; k < 4; k++) s.push({ x: px - pr * 0.2 + Math.sin(k * 2) * 5, y: py - 4 + k * 5, ang: 0, len: pr * 0.4 - k * 6, wid: 5, c: hex('#e6ecf4'), type: DAB, alpha: mr * (0.9 - k * 0.2), seed: 6200 + k + Math.round(px), wet: 1, gmul: 0, hgt: 0.4 });
    E.drawNow(s, { cam: c, t, grey: 1, reveal: B(66), revW });
    // foreground: the lamp goes out at b64, three grey smoke puffs rise
    const f = S(), lit = 1 - smooth(prog(t, B(64), B(64) + 0.25));
    windowForeground(f, t, lit, mr);
    lantern(f, { x: 330, y: 1726, s: 230, lit, t, gmul: 0, seed: 2 });
    for (let k = 0; k < 3; k++) {
      const p = prog(t, B(64) + 0.15 + k * 0.35, B(64) + 2.6 + k * 0.35);
      if (p > 0 && p < 1) f.push({ x: 330 + Math.sin(p * 5 + k) * 26, y: 1600 - p * 380, ang: p * 2 + k, len: 50 + p * 70, wid: 40 + p * 50, c: hex('#8a8d95'), type: DAB, alpha: 0.55 * (1 - p), seed: 6300 + k, gmul: 0, hgt: 0.3 });
    }
    E.drawNow(f, { cam: cam(540, 960, 1), t });
    return Object.assign({}, NIGHT_POST, { expo: 0.92 + 0.08 * Math.max(lit, mr), glow: [330 / 1080, 1620 / 1920, 0.14, 0.6 * lit, 1, 0.62, 0.3] });
  },
};

// the café terrace in the rain: a crow shelters on the table; the old red umbrella springs open over it at b76
const S07 = {
  id: 'S07', b0: 72, b1: 80,
  layers: () => [{ plate: 'cafe', D: 2.8 }],
  draw(F, t) {
    const E = F.E;
    const c = clampCam(lerpCam(cam(500, 1000, 1.08), cam(580, 1010, 1.08), smooth(prog(t, B(72), B(80)))), FULL);
    F.store.drawPlate('cafe', { cam: c, t });
    const s = S(), [tx, ty] = CAFE.table;
    // the crow comes in out of the rain (b72 → b74) and lands on the table by the candle
    const land = [tx - 10, ty - 6];
    if (t < B(74)) { const u = easeOut(prog(t, B(72), B(74))), path = bez([-80, 700], [300, 900], land, 24), [x, y] = along(path, u); crow(s, { x, y: y - (u < 1 ? 20 : 0), s: 74, pose: 'fly', flap: t * 2.6, dir: 1, seed: 21, tilt: 0.2 * (1 - u), gmul: 1 }); }
    else crow(s, { x: land[0], y: land[1], s: 74, pose: t < B(76) ? 'crouch' : 'perch', dir: t < B(77) ? 1 : -1, head: t > B(76.4) ? 0.45 : 0, seed: 21, gmul: 1 });
    // the umbrella leans on the table's far edge; b75 the wind tips it up (anticipation), b76 it springs open
    const lift = easeOut(prog(t, B(75), B(75.8))), open = t < B(76) ? 0 : spring(t, B(76), 0.3);
    const o0 = [tx + 250, ty + 120], o1 = [tx + 30, ty - 300];
    umbrella(s, { x: lerp(o0[0], o1[0], lift), y: lerp(o0[1], o1[1], lift), r: 250, open, tilt: lerp(-0.1, -0.16, lift) + 0.04 * Math.sin(t * 2.3) * lift, c: PAL.umbrella, c2: PAL.umbrella2, seed: 2, gmul: 1 });
    rain(s, { rect: [c.x - 560, c.y - 1000, c.x + 560, c.y + 1000], t, n: 300, angle: 1.32, speed: 1700, len: 56, wid: 2.4, c: hex('#c9d0e0'), alpha: 0.45 });
    E.drawNow(s, { cam: c, t });
    return Object.assign({}, NIGHT_POST, { spec: 0.32, warm: 0.12, glow: [...scr(c, CAFE.lamp), 0.2, 0.4, 1, 0.75, 0.4] });
  },
};

// wind: confetti and leaves fly; the seven crows lift off the wire one a beat; tilt up into the stars
const S08 = {
  id: 'S08', b0: 80, b1: 88,
  layers: (F) => { const st = F.store.plate('square').info; return [{ plate: 'square', D: 2.5, revW: [st.moon[0], st.moon[1], 1 / 900] }]; },
  draw(F, t) {
    const st = F.store.plate('square').info, E = F.E;
    // a slight sink with the music (63.4–64.0), the tilt up after the birds (64.5), a whip into the big star after 69.0
    const sink = Math.sin(Math.PI * prog(t, 63.4, 64.2)) * 30;
    const up = easeInOut(prog(t, 64.5, 69.0)), whip = easeIn(prog(t, 69.0, B(88)));
    const base = clampCam(cam(540, lerp(st.DY + 960, 0, up) + sink, 1.18), SQ);
    const c = whip > 0 ? lerpCam(base, cam(640, 470, 1.9), whip) : base;
    F.store.drawPlate('square', { cam: c, t, revW: [st.moon[0], st.moon[1], 1 / 900] });
    const s = S();
    const pos = wireCrows(s, st.wire, 7, t, { s: 30, skip: (k) => t >= B(80 + k) });
    for (let k = 0; k < 7; k++) {
      const t0 = B(80 + k);
      if (t < t0) continue;
      const a = t - t0, [x0, y0] = pos[k], dir = k % 2 ? 1 : -1;
      crow(s, { x: x0 + dir * (a * 90 + a * a * 30), y: y0 - a * 260 - a * a * 120, s: 36, pose: 'fly', flap: a * 2 / 0.7895 + k * 0.3, dir, seed: k, tilt: -0.3 * dir, gmul: 1 });
    }
    flutter(s, { t, rect: [c.x - 700, c.y - 1100, c.x + 700, c.y + 1100], n: 80, vx: 420, vy: -160, size: 20, colours: FEST, seed: 3, gmul: 0 });
    E.drawNow(s, { cam: c, t });
    return Object.assign({}, NIGHT_POST);
  },
};

// ───────────────────────── act three · 麦田 ─────────────────────────
const fH = (z) => 1.7 * F3.FF / z;   // a 1.7 m thing at depth z, in pixels (sizes crows in the field)
const onPath = (x, y) => Math.abs(x - FIELD3.vp[0]) < 70 + (y - FIELD3.hz) * 0.12;
// wheat ears over the field: fixed positions, perspective sizes, swaying in phase with the wind
function wheatField(out, t, o = {}) {
  const n = o.n || 260, gust = o.gust || 0, dip = o.dip || 0, y0 = o.y0 || 1900, hz = FIELD3.hz;
  for (let k = 0; k < n; k++) {
    const fy = Math.pow(hash1(k * 1.7 + 2), 0.7), y = y0 + (2640 - y0) * fy;
    const x = -100 + hash1(k * 3.1 + 5) * 1640;
    if (onPath(x, y) || (o.cut && o.cut(x, y))) continue;
    const sz = 30 + 170 * ((y - hz) / (2560 - hz)) ** 1.6;
    const a = (0.12 + 0.1 * gust) * Math.sin(t * (1.6 + gust) - x * 0.004 + y * 0.001) + 0.15 * gust - dip;
    wheat(out, x, y, sz, a, { seed: 300 + k, c: o.c, c2: o.c2, gmul: o.gmul, alpha: o.alpha });
  }
}
// crows gliding in and landing in the field; batches at the given beats
function landingCrows(out, t, batches, o = {}) {
  batches.forEach((b, bi) => {
    for (let k = 0; k < 3; k++) {
      const i = bi * 3 + k, t0 = B(b) + k * 0.18, land = t0 + 1.6, z = 9 + hash1(i * 2.3) * 5;
      const [gx, gy] = f3ground(-3 + hash1(i * 4.1) * 6 + (hash1(i * 4.1) > 0.5 ? 0.8 : -0.8), z);
      if (t < t0) continue;
      const p = clamp01((t - t0) / (land - t0)), sx = gx - 700 + k * 80, sy = gy - 900 - k * 60;
      const x = lerp(sx, gx, easeOut(p)), y = lerp(sy, gy, easeOut(p)) - Math.sin(p * Math.PI) * 60, sz = 22 * fH(z) / 220;
      if (p < 1) crow(out, { x, y, s: sz, pose: 'fly', flap: (t - t0) * 2.5, dir: 1, seed: 20 + i, tilt: 0.25 * (1 - p), gmul: o.gmul });
      else crow(out, { x: gx, y: gy, s: sz, pose: o.crouch ? 'crouch' : 'perch', dir: i % 2 ? 1 : -1, head: Math.sin(t * 2 + i) > 0.7 ? 0.4 : 0, seed: 20 + i, gmul: o.gmul, sheen: o.sheen });
    }
  });
}
// a flock crossing the sky in a loose wave
function flock(out, t, t0, n, from, to, o = {}) {
  for (let k = 0; k < n; k++) {
    const u = (t - t0 - k * 0.12) / (o.dur || 6);
    if (u <= 0 || u >= 1) continue;
    const x = lerp(from[0], to[0], u) + Math.sin(k * 2.7) * 90, y = lerp(from[1], to[1], u) + Math.sin(k * 1.9 + u * 6) * 40 + k * 8;
    crow(out, { x, y, s: (o.s || 26) * (0.8 + 0.4 * hash1(k)), pose: 'fly', flap: t * 2.4 + k * 0.37, dir: to[0] > from[0] ? 1 : -1, seed: 600 + k, gmul: o.gmul });
  }
}
const FIELD_REV = () => [FIELD3.hz, 0, (B(96) - B(89)) / 1260, 3];
const S09 = {
  id: 'S09', b0: 88, b1: 104,
  layers: () => [{ plate: 'field3Dusk', D: 2.5, revW: FIELD_REV() }],
  draw(F, t) {
    const E = F.E, revW = FIELD_REV();
    const c = lerpCam(cam(700, 1280, 1), cam(760, 1320, 1.12), smooth(prog(t, B(88), B(104))));
    const T0 = B(88), sweep = 0.8;
    const po = { cam: c, t, grey: 1, reveal: B(89), revDur: 0.5, revW };
    if (t < T0 + sweep + 0.1) {
      // paint-over from the top: the dusk is laid down in grey over the night sky
      S08.draw(F, Math.min(t, T0 - 1e-3));
      const vb = F.store.viewBox(c), k = sweep / (vb[3] - vb[1]);
      F.store.drawLive('field3Dusk', Object.assign({}, po, { appW: [0, 1, k, 2], appear: T0 - vb[1] * k - 0.05, appDur: 0.2, uAppW: [0, 1, k, 2], uAppear: T0 - vb[1] * k + 0.1, uAppDur: 0.25 }));
    } else F.store.drawPlate('field3Dusk', po);
    const s = S();
    wheatField(s, t, { y0: 1950, n: 200 });
    flock(s, t, B(90), 14, [1500, 820], [-200, 640], { dur: 7, s: 28 });
    landingCrows(s, t, [92, 96, 100]);
    E.drawNow(s, { cam: c, t, grey: 1, reveal: B(89), revDur: 0.5, revW, appear: t < T0 + sweep ? T0 + 0.5 : -1e6, appDur: 0.3 });
    return Object.assign({}, DUSK_POST);
  },
};

// the field's edge: ears and a walking crow; a leaf lets go of the almond tree; the crows gather on the wall
const wallTop = (x) => EDGE.wall - 124 - x * 0.021;
const GATHER_CROWS = [300, 420, 520, 640, 760, 880, 990, 1110, 1230].map((x, i) => ({ x: x + Math.sin(i * 2.3) * 20, b: 112 + i * 0.45, s: 46 + (i % 3) * 6, dir: i === 2 || i === 6 ? -1 : 1 }));
const S10 = {
  id: 'S10', b0: 104, b1: 120,
  layers: () => [{ plate: 'edge', D: 2.5 }, { plate: 'edge', D: 4.4, sub: [200, 800, 1440, 2560] }],
  draw(F, t) {
    const E = F.E, s = S();
    let c;
    const gust = smooth(prog(t, B(116), B(119)));
    if (t < B(108)) {
      // close on the wall: a crow walks along its top behind the swaying ears
      const p = prog(t, B(104), B(108));
      c = clampCam(cam(lerp(900, 780, smooth(p)), 1760, 1.6), WIDE);
      F.store.drawPlate('edge', { cam: c, t });
      const cx = lerp(1180, 720, p), step = beatAt(t) * 2, hop = Math.max(0, Math.sin(step * Math.PI)) * 6;
      crow(s, { x: cx, y: wallTop(cx) - hop, s: 70, pose: 'perch', dir: -1, head: Math.sin(step * Math.PI * 0.5) > 0.6 ? 0.3 : 0, seed: 31, gmul: 1 });
      for (let k = 0; k < 46; k++) {   // a few ears in front, nodding at different heights
        const row = k % 3, x = 400 + hash1(k * 3.7) * 860, y = 2150 + row * 50 + hash1(k * 1.9) * 30;
        wheat(s, x, y, 150 + 80 * hash1(k * 5.3) + row * 20, 0.16 * Math.sin(t * 1.7 - x * 0.01) + (hash1(k * 2.1) - 0.5) * 0.5, { seed: 900 + k });
      }
      for (let k = 0; k < 9; k++) { const x = 480 + k * 100 + Math.sin(k * 5) * 30, y = 2010 + (k % 3) * 30; s.push({ x, y, ang: 0, len: 22, wid: 20, c: hex('#e0281e'), c2: hex('#a81810'), type: DAB, seed: 950 + k, gmul: 0 }); }
    } else if (t < B(112)) {
      // the almond tree: a leaf lets go, turns over and falls; the camera follows it down
      const p = prog(t, B(108) + 0.25, B(112));
      const lx = lerp(EDGE.leafFrom[0], EDGE.leafTo[0], p) + Math.sin(p * 9) * 60 * (1 - p), ly = lerp(EDGE.leafFrom[1], EDGE.leafTo[1], easeIn(p) * 0.5 + p * 0.5);
      c = clampCam(cam(lerp(EDGE.leafFrom[0], EDGE.leafTo[0], easeInOut(p)), lerp(EDGE.leafFrom[1] + 120, EDGE.leafTo[1] - 200, easeInOut(p)), 2.2), WIDE);
      F.store.drawPlate('edge', { cam: c, t, allowSoft: true });
      s.push({ x: lx, y: ly, ang: p * 11, len: 34 * (0.4 + 0.6 * Math.abs(Math.cos(p * 11))), wid: 18, c: hex('#d8782a'), c2: hex('#8a4a2a'), type: KNIFE, taper: 0.6, seed: 5301, run: 0 });
    } else {
      // landed: the leaf becomes an ochre stroke in the soil; pull back to the crows gathering on the wall at sunset
      const p = easeInOut(prog(t, B(112), B(120)));
      c = clampCam(lerpCam(cam(EDGE.leafTo[0] + 40, EDGE.leafTo[1] - 220, 2.2), cam(720, 1340, 1), p), WIDE);
      F.store.drawPlate('edge', { cam: c, t });
      s.push({ x: EDGE.leafTo[0], y: EDGE.leafTo[1], ang: 0.1, len: 46, wid: 16, c: hex('#9A4E2A'), c2: hex('#C08A3E'), type: KNIFE, seed: 5302, run: 0.3, app: 0 });
      for (const g of GATHER_CROWS) {
        const t0 = B(g.b), y = wallTop(g.x);
        if (t < t0) continue;
        const u = clamp01((t - t0) / 1.4);
        if (u < 1) { const sx = g.x + (g.x < 720 ? -500 : 500), sy = y - 600; crow(s, { x: lerp(sx, g.x, easeOut(u)), y: lerp(sy, y, easeOut(u)) - Math.sin(u * Math.PI) * 50, s: g.s, pose: 'fly', flap: (t - t0) * 2.5, dir: g.x < 720 ? 1 : -1, seed: 40 + g.x % 97, gmul: 1 }); }
        else crow(s, { x: g.x, y, s: g.s, pose: 'perch', dir: g.dir, head: Math.sin(t * 1.3 + g.x) > 0.75 ? 0.4 : 0.1, seed: 40 + g.x % 97, gmul: 1 });
      }
      for (let k = 0; k < 30; k++) {
        const x = 60 + k * 48, y = 2470 + (k % 3) * 30;
        wheat(s, x, y, 200 + 20 * Math.sin(k), (0.12 + 0.18 * gust) * Math.sin(t * (1.7 + gust) - x * 0.008) + 0.2 * gust, { seed: 950 + k });
      }
      if (gust > 0) flutter(s, { t, rect: [c.x - 700, c.y - 900, c.x + 700, c.y + 900], n: Math.round(30 * gust), vx: 380, vy: -60, size: 16, colours: [hex('#d8782a'), hex('#e8a830'), hex('#c85a22')], seed: 12, gmul: 0 });
    }
    E.drawNow(s, { cam: c, t, appear: t >= B(112) ? B(112) : -1e6, appDur: 0.3 });
    return Object.assign({}, DUSK_POST, { glow: t >= B(112) ? [...scr(c, EDGE.sun), 0.3, 0.3, 1, 0.75, 0.4] : null });
  },
};

// the turning of the year on the same field: harvest, a small fire, cold, first frost, leaves back into the soil
const S11 = {
  id: 'S11', b0: 120, b1: 140,
  layers: () => [{ plate: 'field3Dusk', D: 2.5, revW: FIELD_REV() }, { plate: 'field3Harvest', D: 2.5 }],
  draw(F, t) {
    const E = F.E, c = cam(700, 1280, 1);
    const hold = t >= 110.2 && t < 110.4;          // the frame stands still for an instant
    const ta = hold ? 110.2 : t;
    F.store.drawPlate('field3Dusk', { cam: c, t: ta, revW: FIELD_REV() });
    const harvestK = 1440 / (B(124) - B(120.6));
    const wipe = { wipeW: [1 / harvestK, 0, 1, 2], wipe: [B(120.6), 0.25, 0.25] };
    E.drawCache(F.store.layer('field3Harvest', { D: 2.5 }), Object.assign({ cam: c, t: ta, sub: [0, FIELD3.hz - 30, 1440, 2560] }, wipe));
    E.drawCache(F.store.layer('field3Harvest', { D: 2.5 }), { cam: c, t: ta, sub: [0, 0, 1440, FIELD3.hz - 30], alpha: smooth(prog(t, B(128), B(131))) });
    const s = S();
    // b120: the whole sea of wheat dips at once, then the uncut ears go as the scrape passes
    const dip = Math.sin(Math.PI * prog(t, B(120), B(120.6))) * 0.45;
    wheatField(s, ta, { y0: 1950, n: 200, dip, cut: (x) => ta > B(120.6) + x / harvestK });
    // b124: where the crows gathered, a small warm fire — the first stroke again
    if (t >= B(124)) firstStroke(s, FIELD3.gather[0], FIELD3.gather[1], { scale: 0.55 });
    // b132: first frost, a thin grey-white veil of dabs
    for (let k = 0; k < 420; k++) {
      const tk = B(132) + hash1(k * 1.3) * 5;
      if (ta < tk) continue;
      const y = FIELD3.hz + 40 + Math.pow(hash1(k * 2.9), 0.8) * 1220, x = hash1(k * 4.7) * 1440, sz = 4 + 18 * (y - FIELD3.hz) / 1260;
      s.push({ x, y, ang: hash1(k) * 0.4, len: sz * 1.6, wid: sz, c: PAL.frost, type: DAB, alpha: 0.55 * clamp01((ta - tk) / 0.6), seed: 7000 + k, hgt: 0.3, gmul: 0 });
    }
    // leaves blown in from the right go back into the soil
    for (let k = 0; k < 10; k++) {
      const t0 = B(126 + k * 1.2), p = clamp01((ta - t0) / 2.6);
      if (p <= 0) continue;
      const gx = 300 + hash1(k * 3) * 900, gy = 1800 + hash1(k * 5) * 600;
      const x = lerp(1500, gx, p) + Math.sin(p * 8 + k) * 40 * (1 - p), y = lerp(gy - 700, gy, easeIn(p));
      s.push({ x, y, ang: p * 9 + k, len: 16, wid: 9, c: hex('#9A4E2A'), c2: hex('#C08A3E'), type: KNIFE, seed: 7600 + k, alpha: p < 1 ? 1 : 0.7, run: 0 });
    }
    // crows pacing on the empty field
    for (let k = 0; k < 5; k++) {
      const z = 9 + k * 1.2, X = -2.5 + k * 1.3 + 0.25 * Math.floor(beatAt(ta) + k) % 3 * (k % 2 ? 1 : -1);
      const [x, y] = f3ground(X, z);
      if (t > B(126)) crow(s, { x, y, s: 22 * fH(z) / 220, pose: 'perch', dir: k % 2 ? 1 : -1, head: Math.sin(beatAt(ta) * Math.PI + k) > 0.5 ? 0.4 : 0, seed: 50 + k });
    }
    E.drawNow(s, { cam: c, t: ta });
    const cold = smooth(prog(t, B(128), B(132)));
    return Object.assign({}, DUSK_POST, { warm: 0.25 - 0.8 * cold, sat: 1 - 0.25 * cold });
  },
};

// ───────────────────────── act four · 递光 ─────────────────────────
// the cliff village: a crow takes a spark from the lighthouse to a window; that window's crow carries it on to the next
const VCAM = (vi) => cam(540, vi.DY + 960, 1);
let _chain = null;
function chainWindows(vi) {
  if (_chain) return _chain;
  const pick = (row, x) => vi.windows.filter((w) => w.row === row).reduce((b, w) => (Math.abs(w.x - x) < Math.abs(b.x - x) ? w : b));
  return (_chain = [pick(9, 640), pick(8, 260), pick(6, 560), pick(5, 180), pick(3, 420), pick(1, 120)]);
}
const sillOf = (w) => [w.c[0], w.q[2][1] + 2];
const S12 = {
  id: 'S12', b0: 140, b1: 156,
  layers: () => [{ plate: 'village', D: 3.0 }],
  draw(F, t) {
    const vi = F.store.plate('village').info, E = F.E;
    const wins = chainWindows(vi), R = [0, 0, 1080, vi.h];
    // close on the lighthouse and the first window, follow the sparks up the cliff, then open out on the village
    const near = (i) => { const w = wins[Math.min(5, Math.max(0, i))]; return cam(lerp(w.c[0], 700, i < 0 ? 1 : 0.35), w.c[1] - 120, 1.4); };
    const follow = beatAt(t) < 144 ? near(-1) : lerpCam(near(Math.floor((beatAt(t) - 144) / 2)), near(Math.floor((beatAt(t) - 144) / 2) + 1), easeInOut(((beatAt(t) - 144) / 2) % 1));
    const c = clampCam(lerpCam(follow, cam(500, vi.DY + 930, 1.08), easeInOut(prog(t, B(153), B(156)))), R);
    F.store.drawPlate('village', { cam: c, t });
    const s = S();
    wins.forEach((w, i) => {
      const tl = B(144 + 2 * i), t0 = tl - 1.9;
      litWindow(s, w, tl, t, { seed: i, halo: 4.5 });
      if (t >= tl - 0.05) { const [sx, sy] = sillOf(w); crow(s, { x: sx, y: sy, s: 20, pose: 'perch', dir: i % 2 ? 1 : -1, head: Math.sin(t * 1.5 + i) > 0.6 ? 0.3 : 0, seed: 80 + i, gmul: 1 }); return; }
      if (t < t0) return;
      // those who were lit become the light: each spark leaves from the window lit before it
      const from = i === 0 ? vi.LH : sillOf(wins[i - 1]), to = sillOf(w);
      carry(s, [from[0], from[1] - 12], [(from[0] + to[0]) / 2 + (i % 2 ? 160 : -160), Math.min(from[1], to[1]) - 220], [to[0], to[1] - 12], smooth((t - t0) / (tl - t0)), t, 28, 80 + i);
    });
    E.drawNow(s, { cam: c, t });
    return Object.assign({}, NIGHT_POST, { glow: [...scr(c, vi.LH), 0.07, 0.5, 1, 0.7, 0.35] });
  },
};

// the harbour in the rain: a wet crow alone on a bollard; a second comes and spreads a wing over it; the lamp comes on
function wingOver(out, x, y, s, dir, k, seed) {
  const sh = [x - dir * s * 0.05, y - s * 0.62], a = lerp(dir > 0 ? Math.PI - 0.5 : 0.5, dir > 0 ? -0.35 : Math.PI + 0.35, Math.min(1.1, k));
  const L = s * 1.35, e = [sh[0] + Math.cos(a) * L * 0.5, sh[1] + Math.sin(a) * L * 0.5];
  out.push({ x: e[0], y: e[1], ang: a, len: L, wid: s * 0.42, c: PAL.ink, c2: mixc(PAL.ink, PAL.sheen, 0.6), type: KNIFE, taper: 0.7, seed: 9700 + seed, run: 0, hgt: 0.9, gmul: 1 });
  for (let f = 0; f < 4; f++) { const t2 = 0.62 + f * 0.11, p = [sh[0] + Math.cos(a) * L * t2, sh[1] + Math.sin(a) * L * t2]; out.push({ x: p[0], y: p[1] + s * 0.12, ang: a + 0.9 * dir, len: s * 0.34, wid: s * 0.11, c: PAL.ink, c2: PAL.sheen, type: KNIFE, taper: 0.8, seed: 9710 + seed + f, run: 0, gmul: 1 }); }
}
const S13 = {
  id: 'S13', b0: 156, b1: 172,
  layers: () => [{ plate: 'harbour', D: 2.8 }, { plate: 'harbour', D: 4.2, sub: [100, 800, 900, 1920] }],
  draw(F, t) {
    const hi = F.store.plate('harbour').info, E = F.E;
    const c = clampCam(lerpCam(cam(590, 1415, 1.9), cam(540, 960, 1.0), easeInOut(prog(t, B(164), B(172)))), FULL);
    F.store.drawPlate('harbour', { cam: c, t });
    const s = S(), g = S();
    // half the village's windows above the harbour already lit
    hi.windows.forEach((w, i) => { if (hash1(i * 5.3) < 0.5) litWindow(s, w, -1, t, { seed: 20 + i, halo: 2.2 }); });
    const [bx, by] = HARB.bollard, top = by - 150, A = [bx + 26, top], Bp = [bx - 34, top];
    // the first crow, alone, hunched in the rain
    crow(g, { x: A[0], y: A[1], s: 66, pose: t < B(160.5) ? 'crouch' : 'perch', dir: -1, head: t < B(160.5) ? -0.2 : 0.3, seed: 51, gmul: 1 });
    // the second comes in through the rain (b156 → b159), lands at b159 (anticipation), opens its wing over the first at b160
    if (t < B(159)) { const u = easeOut(prog(t, B(156), B(159))), path = bez([-120, 900], [200, 1000], [Bp[0], Bp[1] - 10], 24), [x, y] = along(path, u); crow(g, { x, y, s: 68, pose: 'fly', flap: t * 2.6, dir: 1, seed: 52, tilt: 0.25 * (1 - u), gmul: 1 }); }
    else {
      crow(g, { x: Bp[0], y: Bp[1], s: 68, pose: 'perch', dir: 1, head: 0.1, seed: 52, gmul: 1 });
      wingOver(g, Bp[0], Bp[1], 68, 1, t < B(160) ? 0.15 * smooth(prog(t, B(159), B(160))) : spring(t, B(160), 0.3), 1);
    }
    // the harbour lamp comes on at b160
    const lit = smooth(prog(t, B(160), B(160) + 0.3));
    if (lit > 0) { const [lx, ly] = HARB.lamp; g.push({ x: lx, y: ly, ang: Math.PI / 2, len: 86, wid: 66, c: mixc(hex('#6a7088'), hex('#ffe8a8'), lit), c2: mixc(hex('#3a4058'), PAL.first2, lit), type: DAB, seed: 5410, gmul: 0, hgt: 0.6 }); for (let r = 0; r < 6; r++) g.push({ x: lx + Math.sin(r * 2.2) * 10, y: 1600 + r * 40, ang: 0, len: 70 - r * 6, wid: 7, c: PAL.window, type: DAB, alpha: 0.6 * lit * (1 - r / 7), seed: 5420 + r, gmul: 0, wet: 1, hgt: 0.3 }); }
    rain(s, { rect: [c.x - 700, c.y - 1100, c.x + 700, c.y + 1100], t, n: 300, angle: 1.4, speed: 1800, len: 58, wid: 2.4, c: hex('#b9c4d8'), alpha: 0.45 });
    E.drawNow(s, { cam: c, t });
    E.drawNow(g, { cam: c, t });
    return Object.assign({}, NIGHT_POST, { glow: [...scr(c, HARB.lamp), 0.16, 0.6 * lit, 1, 0.62, 0.3] });
  },
};

// every window in the village lights; the crows lift off their sills and climb in a spiral into the stars
const S14 = {
  id: 'S14', b0: 172, b1: 178,
  layers: () => [{ plate: 'village', D: 2.5 }],
  draw(F, t) {
    const vi = F.store.plate('village').info, E = F.E;
    const up = easeIn(prog(t, B(172.5), B(178)));
    const c = clampCam(cam(500, lerp(vi.DY + 930, 0, up), 1.08), [0, 0, 1080, vi.h]);
    F.store.drawPlate('village', { cam: c, t });
    const s = S(), chain = chainWindows(vi), inChain = new Set(chain);
    vi.windows.forEach((w, i) => litWindow(s, w, inChain.has(w) ? -1 : B(172 + (i % 4)), t, { seed: 40 + i, halo: 2.6 }));
    vi.lamps.forEach(([lx, ly], i) => { if (t >= B(172 + i)) s.push({ x: lx, y: ly, ang: 0, len: 40, wid: 40, c: hex('#fff0c0'), c2: PAL.first2, type: DAB, seed: 5500 + i, gmul: 0, hgt: 0.8 }); });
    const sills = chain.map(sillOf), cy0 = vi.DY + 900;
    const spiral = (k, tt) => { const a = tt * 2.2 + k * 0.52, h = cy0 - k * 120 - prog(tt, B(172), B(178)) * 1300; return [540 + Math.cos(a) * (120 + k * 14), h + Math.sin(a) * 40]; };
    for (let k = 0; k < 12; k++) {
      const [sx, sy] = spiral(k, t), [px] = spiral(k, t - 0.05);
      if (k < 6) {
        const lk = smooth(prog(t, B(172) + k * 0.3, B(172) + k * 0.3 + 1.2)), [cx, cy] = sills[k];
        if (lk <= 0) { crow(s, { x: cx, y: cy, s: 20, pose: 'perch', dir: k % 2 ? 1 : -1, seed: 80 + k, gmul: 1 }); continue; }
        emberCrow(s, lerp(cx, sx, lk), lerp(cy, sy, lk), lerp(20, 30, lk), lk < 1 ? (sx > cx ? 1 : -1) : (sx >= px ? 1 : -1), t, 100 + k, { tilt: -0.3 });
        continue;
      }
      emberCrow(s, sx, sy, 30, sx >= px ? 1 : -1, t, 100 + k, { tilt: -0.3, wake: [1, 2, 3].map((j) => spiral(k, t - j * 0.07)) });
    }
    E.drawNow(s, { cam: c, t });
    return Object.assign({}, NIGHT_POST);
  },
};

// ───────────────────────── act five · 夜的麦田 (overhead) ─────────────────────────
// a small travelling light seen from above: an edgeless pool and a bright core
function lampLight(out, x, y, s, seed, flick = 0) {
  for (let i = 0; i < 7; i++) { const r = 2.8 - i * 0.33; out.push({ x, y, ang: i * 1.3, len: s * r, wid: s * r * 0.94, c: mixc(PAL.window, PAL.first2, i * 0.08), type: DAB, alpha: 0.035 + i * 0.012, seed: 8506 + seed + i * 0.37, hgt: 0.01, gmul: 0 }); }
  out.push({ x, y, ang: 0, len: s * (0.36 + flick), wid: s * (0.36 + flick), c: mixc(PAL.first2, [1, 1, 0.9], 0.4), c2: PAL.window, type: DAB, seed: 8513 + seed, gmul: 0, hgt: 1 });
}
const RING = [];   // the lights that come back: four groups from four sides, settling on a loose ring
for (let g = 0; g < 4; g++) for (let k = 0; k < 6; k++) {
  const side = g * Math.PI / 2 + 0.4, ang = side + (k - 2.5) * 0.11;
  RING.push({ g, b: 180 + g * 4 + k * 0.2, from: [OVER.c[0] + Math.cos(ang) * 1050, OVER.c[1] + Math.sin(ang) * 1050], to: [OVER.c[0] + Math.cos(side + (k - 2.5) * 0.26) * (300 + (k % 2) * 40), OVER.c[1] + Math.sin(side + (k - 2.5) * 0.26) * (300 + (k % 2) * 40)] });
}
function circlingCrows(out, t, o = {}) {
  for (let k = 0; k < (o.n || 6); k++) {
    const r = 520 + k * 70, w = 0.5 + (k % 3) * 0.08, a0 = k * 1.1;
    const pos = (tt) => { const a = a0 + tt * w * (k % 2 ? 1 : -1); return [OVER.c[0] + Math.cos(a) * r, OVER.c[1] + Math.sin(a) * r * 0.92]; };
    const trail = [];
    for (let i = 14; i >= 0; i--) trail.push(pos(t - i * 0.12));
    for (let i = 1; i < trail.length; i++) {
      const [x0, y0] = trail[i - 1], [x1, y1] = trail[i];
      out.push({ x: (x0 + x1) / 2, y: (y0 + y1) / 2, ang: Math.atan2(y1 - y0, x1 - x0), len: Math.hypot(x1 - x0, y1 - y0) * 1.2, wid: 3.5, c: hex('#0f1220'), type: LINE, alpha: 0.6 * i / trail.length, seed: 8800 + k * 20 + i, gmul: o.gmul, hgt: 0.4 });
    }
    const [x, y] = pos(t), [px, py] = pos(t - 0.05);
    crow(out, { x, y, s: 34, pose: 'fly', flap: t * 2.6 + k, dir: x >= px ? 1 : -1, seed: 120 + k, tilt: Math.atan2(y - py, Math.abs(x - px) + 1e-3), gmul: o.gmul });
  }
}
const S15 = {
  id: 'S15', b0: 178, b1: 196,
  layers: () => [{ plate: 'overNight', D: 2.1 }, { plate: 'overNight', D: 3.4, sub: [500, 500, 2100, 2100] }],
  draw(F, t) {
    const E = F.E, T0 = B(178);
    const p = easeInOut(prog(t, T0, B(196)));
    const c = cam(OVER.c[0], OVER.c[1], lerp(1.6, 1.0, p), lerp(0, Math.PI / 6, p));
    if (t < T0 + 0.9) {
      S14.draw(F, Math.min(t, T0 - 1e-3));
      F.store.drawLive('overNight', { cam: c, t, appW: [OVER.c[0], OVER.c[1], 0.8 / 1300, 1], appear: T0 - 0.05, appDur: 0.2, uAppW: [OVER.c[0], OVER.c[1], 0.8 / 1300, 1], uAppear: T0 + 0.1, uAppDur: 0.25 });
    } else F.store.drawPlate('overNight', { cam: c, t });
    const s = S();
    // the lights come back along the paths, from every side, and settle into a ring
    for (const r of RING) {
      const t0 = B(r.b), k = clamp01((t - t0) / 3.0);
      if (t < t0) continue;
      const x = lerp(r.from[0], r.to[0], easeOut(k)), y = lerp(r.from[1], r.to[1], easeOut(k));
      if (k < 1) for (let j = 1; j <= 5; j++) { const kk = clamp01(k - j * 0.04), xx = lerp(r.from[0], r.to[0], easeOut(kk)), yy = lerp(r.from[1], r.to[1], easeOut(kk)); s.push({ x: xx, y: yy, ang: 0, len: 10, wid: 10, c: PAL.first2, type: DAB, alpha: 0.4 * (1 - j / 6), seed: 8600 + RING.indexOf(r) * 7 + j, gmul: 0, hgt: 0.2 }); }
      lampLight(s, x, y, 44, RING.indexOf(r) * 11, 0.04 * Math.sin(t * 7 + RING.indexOf(r)));
    }
    circlingCrows(s, t);
    E.drawNow(s, { cam: c, t, appear: t < T0 + 0.9 ? T0 + 0.6 : -1e6, appDur: 0.3 });
    return { amb: 0.84, dif: 0.3, spec: 0.3, vig: 0.3, light: [-0.4, -0.5, 0.75] };
  },
};

// ───────────────────────── act six · 灰与白 ─────────────────────────
// the woman on the ridge, close enough to need more paint: long hair in the wind, folds, a sliver of face
function heroine(out, t, o) {
  const f = figure(out, Object.assign({ x: RIDGE.feet[0], y: RIDGE.feet[1], h: RIDGE.h, facing: 'back', coat: hex('#3e3731'), hair: hex('#3a2a22'), longHair: true, seed: 1, collar: true, light: 1, cheek: o.look > 0.2, belt: true, hands: false, armL: [0.1, 0.25], armR: [-0.1, 0.25] }, o, { hem: (o.hem || 0) * 1.6 }));
  const h = RIDGE.h, x = RIDGE.feet[0], y = RIDGE.feet[1], wind = o.hem || 0;
  for (let k = 0; k < 3; k++) {   // soft coat folds pushed across by the wind
    const u = -0.06 + k * 0.05 + wind * 0.01 * k;
    out.push({ x: x + u * h, y: y - (0.42 + 0.07 * (k % 2)) * h, ang: -Math.PI / 2 + 0.22 + 0.06 * k + wind * 0.12, len: h * (0.2 + 0.04 * (k % 2)), wid: h * 0.016, c: hex('#332e28'), c2: hex('#4a4239'), type: KNIFE, alpha: 0.35, seed: 4700 + k, run: 0.5, hgt: 1.1, gmul: 1, taper: 0.7 });
  }
  const hd = f._head;
  if ((o.look || 0) > 0.2) out.push({ x: hd[0] + 0.039 * h, y: hd[1] + 0.012 * h, ang: Math.PI / 2 - 0.35, len: h * 0.048, wid: h * 0.012, c: hex('#c9a084'), c2: hex('#a8826a'), type: DAB, seed: 4730, hgt: 0.7, gmul: 1, alpha: 0.9 * smooth(prog(o.look, 0.2, 0.6)) });
  return f;
}
const PALE = [...hex('#EDEBE6'), 0.5], PALE_FIG = [...hex('#EDEBE6'), 0.25];
const S16 = {
  id: 'S16', b0: 196, b1: 204,
  layers: () => [{ plate: 'ridge', D: 2.5 }],
  draw(F, t) {
    const E = F.E, c = cam(720, 1280, 1);
    // the same strokes, grey and pale in turn every two beats; the caption band keeps still
    const pale = Math.floor((beatAt(t) - 196) / 2) % 2 === 1;
    const tint = pale ? PALE : null, tintEx = [600, 900];
    F.store.drawPlate('ridge', { cam: c, t, grey: 1, tint, tintEx });
    const s = S();
    const wind = 0.4 + 0.35 * Math.sin(t * 3.7) + 0.15 * Math.sin(t * 7.1);
    // b199 the hand comes up; b200 the top button; the collar springs back
    const handUp = smooth(prog(t, B(199), B(199.8))) * (1 - smooth(prog(t, B(201), B(202))));
    const collar = t < B(200) ? 1.25 : 1 + 0.25 * (1 - spring(t, B(200), 0.3));
    heroine(s, t, { hem: wind, armL: [lerp(0.1, 0.5, handUp), lerp(0.25, 2.3, handUp)], handL: handUp > 0.05, collarLift: collar });
    crow(s, { x: RIDGE.rock[0], y: RIDGE.rock[1] - 60, s: 46, pose: 'perch', dir: -1, head: 0.1, seed: 140, gmul: 1 });
    E.drawNow(s, { cam: c, t, grey: 1, tint: pale ? PALE_FIG : null, tintEx });
    return { amb: 0.86, dif: 0.3, spec: 0.16, vig: 0.22, light: [0.6, -0.55, 0.6] };
  },
};
const S17 = {
  id: 'S17', b0: 204, t1: 166.9,
  layers: () => [{ plate: 'ridge', D: 4.2, sub: [360, 640, 1100, 2100] }],
  draw(F, t) { return drawS17(F, t, 0); },
};
function drawS17(F, t, dark) {
  const E = F.E;
  // from the boots up the body to the side of the face, easing to a stop at b208
  const up = easeInOut(prog(t, B(204), B(208)));
  const c = cam(720, lerp(1640, 1195, up), 2.3);
  F.store.drawPlate('ridge', { cam: c, t, grey: 1, allowSoft: true });
  const s = S();
  const look = smooth(prog(t, B(208), B(208.6)));
  const wind = 0.3 + 0.25 * Math.sin(t * 3.7);
  heroine(s, t, { hem: wind, look: look * 1.2 });
  crow(s, { x: RIDGE.rock[0] - 20, y: RIDGE.rock[1] - 60, s: 54, pose: 'perch', dir: -1, head: look, seed: 140, gmul: 1 });
  E.drawNow(s, { cam: c, t, grey: 1 });
  const side = look;
  return { amb: lerp(0.86 - 0.1 * side, 0.03, dark), dif: lerp(0.3 + 0.3 * side, 1.7, dark), spec: lerp(0.18, 0.5, dark), vig: 0.26 + 0.3 * dark, light: dark > 0 ? [0.96, -0.12, lerp(0.5, 0.06, dark)] : [lerp(0.6, 0.9, side), -0.5, lerp(0.6, 0.35, side)], c };
}

// ───────────────────────── the silence · 静默 ─────────────────────────
const S18 = {
  id: 'S18', t0: 166.9, t1: 168.4, clear: [0, 0, 0],
  layers: () => [{ plate: 'ridge', D: 4.2, sub: [360, 640, 1100, 2100] }],
  draw(F, t) {
    // the light sinks to a grazing angle, the ridges glow for a moment, then everything is gone
    if (t < 167.5) {
      const dark = smooth(prog(t, 166.9, 167.25));
      const post = drawS17(F, B(210), dark);
      delete post.c;
      return Object.assign(post, { expo: lerp(1, 0.55, dark) * (1 - smooth(prog(t, 167.2, 167.5))) });
    }
    // 167.6 s, the single note: in the empty dark, the first stroke lands (and stays for S19 to grow from)
    const s = S();
    if (t >= 167.6) firstStroke(s, 540, 980);
    F.E.drawNow(s, { cam: cam(540, 960, 1), t, appear: 167.6, appDur: 0.14 });
    const lit = smooth(prog(t, 167.6, 167.75));
    return { amb: 0.5, dif: 0.8, spec: 0.35, vig: 0.4, light: [0.6, -0.6, 0.45], glow: [0.5, 0.51, 0.06, 4 * lit, 1, 0.7, 0.35] };
  },
};

let _sunRev = null;
const sunRev = () => _sunRev || (_sunRev = [FIELD3.gather[0], FIELD3.gather[1], (B(224) - B(216)) / 1500]);
const S19 = {
  id: 'S19', t0: 168.4, b1: 216, clear: [0, 0, 0],
  layers: () => [{ plate: 'field3Sunrise', D: 2.5, revW: sunRev() }],
  draw(F, t) {
    const E = F.E, [gx, gy] = FIELD3.gather;
    const z = lerp(1, 1.15, easeOut(prog(t, 168.4, 169.4)));
    const c = cam(gx, gy - 20 / z, z);
    // a ring of the field is scraped out of the dark around the stroke
    F.store.drawPlate('field3Sunrise', { cam: c, t, grey: 1, revW: sunRev(), wipeW: [gx, gy, (170.67 - 168.4) / 560, 1], wipe: [168.4, 0.3, 0.12] });
    const s = S();
    firstStroke(s, gx, gy, { scale: 1 / z });
    // crows in the field crouch, then all lift at 169.2
    for (let k = 0; k < 8; k++) {
      const [x0, y0] = f3ground(-2.6 + (k % 4) * 1.7 + (k > 3 ? 0.8 : 0), 9.5 + (k > 3 ? 2.5 : 0) + hash1(k) * 1.2);
      const sz = 26 * fH(10) / 220;
      if (t < 169.2) crow(s, { x: x0, y: y0, s: sz, pose: 'crouch', dir: k % 2 ? 1 : -1, seed: 160 + k, gmul: 1 });
      else { const a = t - 169.2; crow(s, { x: x0 + (k % 2 ? 1 : -1) * a * 120, y: y0 - a * 300 - a * a * 150, s: sz, pose: 'fly', flap: a * 2.6 + k * 0.2, dir: k % 2 ? 1 : -1, seed: 160 + k, tilt: -0.4 * (k % 2 ? 1 : -1), gmul: 1 }); }
    }
    E.drawNow(s, { cam: c, t, grey: 1 });
    return { amb: 0.1, dif: 1.25, spec: 0.35, vig: 0.4, light: [0.1, -0.95, 0.18], expo: 0.9, glow: [0.5, 0.51, 0.05, 6, 1, 0.7, 0.35] };
  },
};

// ───────────────────────── act seven · 极美 ─────────────────────────
const S20 = {
  id: 'S20', b0: 216, b1: 228, clear: [0, 0, 0],
  layers: () => [{ plate: 'field3Sunrise', D: 2.5, revW: sunRev() }],
  draw(F, t) {
    const E = F.E, [gx, gy] = FIELD3.gather, T0 = B(216);
    const p = smooth(prog(t, T0, B(228)));
    const c = cam(gx, lerp(gy - 17, 1280, p), lerp(1.15, 1.0, p));
    const po = { cam: c, t, grey: 1, reveal: T0, revDur: 0.5, revW: sunRev() };
    if (t < T0 + 0.85) {
      // paint-over sweeping upward into the sunrise
      S19.draw(F, Math.min(t, T0 - 1e-3));
      const vb = F.store.viewBox(c), k = 0.8 / (vb[3] - vb[1]);
      F.store.drawLive('field3Sunrise', Object.assign({}, po, { appW: [0, -1, k, 2], appear: T0 + vb[3] * k - 0.05, appDur: 0.2, uAppW: [0, -1, k, 2], uAppear: T0 + vb[3] * k + 0.1, uAppDur: 0.25 }));
    } else F.store.drawPlate('field3Sunrise', po);
    const s = S();
    firstStroke(s, gx, gy, { scale: 0.9 });
    wheatField(s, t, { y0: 2050, n: 140 });
    // the crows are all here; their feathers show ultramarine, violet and green in the low light
    for (let k = 0; k < 9; k++) {
      const [x, y] = f3ground(-3.4 + k * 0.85 + (k % 2) * 0.3, 7.6 + (k % 3) * 1.4);
      if (onPath(x, y)) continue;
      crow(s, { x, y, s: 24 * fH(8.5) / 220, pose: 'perch', dir: x < gx ? 1 : -1, head: Math.sin(t * 2 + k) > 0.6 ? 0.4 : 0.15, seed: 170 + k, gmul: 1, sheen: 1 });
    }
    flock(s, t, B(220), 16, [-200, 700], [1600, 520], { dur: 6, s: 30 });
    E.drawNow(s, { cam: c, t, grey: 1, reveal: T0, revDur: 0.5, revW: sunRev(), appear: t < T0 + 0.85 ? T0 + 0.6 : -1e6, appDur: 0.3 });
    // the sun's light starts at the horizon and climbs (b216 → b224)
    const lift = smooth(prog(t, T0, B(224)));
    return { amb: lerp(0.45, 0.86, lift), dif: lerp(0.9, 0.3, lift), spec: 0.24, vig: 0.16, warm: 0.4, light: [lerp(0.05, -0.35, lift), lerp(-0.95, -0.7, lift), lerp(0.14, 0.62, lift)] };
  },
};

// the overhead pattern: eight golden arms spiralling into the clearing, rings added every four beats
function sunPattern(out, t, grow) {
  const [cx, cy] = OVER.c;
  for (let a = 0; a < 8; a++) {
    const arm = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40, r = lerp(980, 70, u), th = a * Math.PI / 4 + u * 2.2; arm.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]); }
    ribbon(out, arm, { prog: clamp01(grow * 1.05 - a * 0.012), c: TRAIL, c2: PAL.first2, wid: 30, step: 24, seed: 200 + a });
  }
  const rings = [B(228), B(232), B(236), B(240)];
  rings.forEach((tr, i) => {
    if (t < tr) return;
    const r = 230 + i * 190, pts = [];
    for (let k = 0; k <= 64; k++) { const th = k / 64 * Math.PI * 2 + i; pts.push([cx + Math.cos(th) * r, cy + Math.sin(th) * r]); }
    ribbon(out, pts, { prog: clamp01((t - tr) / 1.2), c: (k) => mixc(PAL.gold, PAL.first2, 0.5 + 0.5 * Math.sin(k * 20)), wid: 16, step: 22, seed: 300 + i });
  });
}
// the head of each arm: a bright point laying the gold as it goes
function armHeads(out, grow) {
  for (let a = 0; a < 8; a++) {
    const u = clamp01(grow * 1.05 - a * 0.012);
    if (u >= 0.98) continue;
    const r = lerp(980, 70, u), th = a * Math.PI / 4 + u * 2.2;
    lampLight(out, OVER.c[0] + Math.cos(th) * r, OVER.c[1] + Math.sin(th) * r, 40, 200 + a * 9);
  }
}
const S21 = {
  id: 'S21', b0: 228, b1: 244,
  layers: () => [{ plate: 'overGold', D: 2.1 }],
  draw(F, t) {
    const E = F.E, p = smooth(prog(t, B(228), B(244)));
    const c = cam(OVER.c[0], OVER.c[1], lerp(1.18, 1.0, p), lerp(0, Math.PI / 4, p));
    F.store.drawPlate('overGold', { cam: c, t, allowSoft: true });
    const s = S(), grow = prog(t, B(228), B(243));
    sunPattern(s, t, grow);
    armHeads(s, grow);
    circlingCrows(s, t, { n: 8 });
    firstStroke(s, OVER.c[0], OVER.c[1], { scale: 0.9 });
    E.drawNow(s, { cam: c, t });
    return { amb: 0.86, dif: 0.3, spec: 0.2, vig: 0.14, warm: 0.45, light: [-0.45, -0.55, 0.7] };
  },
};

const S22 = {
  id: 'S22', b0: 244, b1: 252,
  layers: () => [{ plate: 'overGold', D: 2.1 }],
  draw(F, t) {
    const E = F.E, p = easeInOut(prog(t, B(244), B(252)));
    const c = cam(OVER.c[0], OVER.c[1], lerp(1.0, 0.86, p), lerp(Math.PI / 4, Math.PI / 4 + 0.18, p));
    F.store.drawPlate('overGold', { cam: c, t, allowSoft: true });
    const s = S();
    sunPattern(s, t, 1);
    circlingCrows(s, t, { n: 8 });
    firstStroke(s, OVER.c[0], OVER.c[1], { scale: 0.9 });
    // wheat and confetti thrown up from the field burst into scraped colour: b248, then higher and bigger at b250
    const cols = [PAL.gold, PAL.peach, PAL.viridian, PAL.umbrella2, PAL.first2];
    burst(s, { x: OVER.c[0] - 160, y: OVER.c[1] - 120, r: 420, p: prog(t, B(248), B(248) + 1.6), n: 60, size: 30, colours: cols, seed: 1 });
    burst(s, { x: OVER.c[0] + 140, y: OVER.c[1] + 60, r: 700, p: prog(t, B(250), B(250) + 1.8), n: 90, size: 40, colours: cols, seed: 2 });
    E.drawNow(s, { cam: c, t });
    const flash = Math.exp(-Math.pow((t - 199.0) / 0.12, 2));
    return { amb: 0.86, dif: 0.3, spec: 0.2, vig: 0.12, warm: 0.45, expo: 1 + 0.2 * smooth(prog(t, B(246), 199.0)) + 0.15 * flash, light: [-0.45, -0.55, 0.7] };
  },
};

// ───────────────────────── coda · 刮回 ─────────────────────────
// the light follows the song's last chord down to silence (−60 dB at 210.2 s)
const envAt = (t) => { const e = TL.env, i = Math.min(e.db.length - 1, Math.max(0, Math.round(t / e.hop_s))); return e.db[i]; };
const coda = (t) => t < 202.5 ? 1 : Math.pow(clamp01((envAt(t) + 60) / 40), 0.8) * (t >= 210.2 ? 0 : 1);
const SCRAPES = [252, 253, 254, 255];
function drawCoda(F, t) {
  const E = F.E, p1 = F.store.plate('linen'), sc = cam(540, 960, 1);
  const frozen = t < B(255) + 0.5;
  if (frozen) { S22.draw(F, B(252) - 0.02); }
  const s = S();
  SCRAPES.forEach((b, i) => {
    const t0 = B(b);
    if (t < t0) return;
    const y0 = i * 480, y1 = y0 + 480, bx = lerp(1180, -100, easeInOut(clamp01((t - t0) / 0.38)));
    E.under(p1.tex, 1080, 1920, { cam: sc, rect: [0, 0, 1080, 1920], weave: 0.075, clip: [bx, y0 - (i === 0 ? 50 : 0), 1200, y1 + (i === 3 ? 50 : 0)] });
    for (let k = 0; k < 9; k++) {     // what the blade leaves behind
      if (hash1(k * 3 + i * 17) < 0.3) continue;
      const y = y0 + 30 + k * 50 + hash1(k + i) * 20, xa = Math.max(bx, 40 + hash1(k * 7 + i) * 300), xb = 1080 - hash1(k * 11 + i) * 280;
      if (xb > xa) s.push({ x: (xa + xb) / 2, y, ang: 0.01, len: xb - xa, wid: 8 + 10 * hash1(k * 5 + i), c: mixc(PAL.linen, [hex('#9A4E2A'), PAL.gold, hex('#3e4a5a')][k % 3], 0.3 + 0.2 * hash1(k)), type: KNIFE, alpha: 0.4, hgt: 0.3, run: 0.95, seed: 9300 + i * 20 + k, skew: 0.9 });
    }
    if (t < t0 + 0.45) s.push({ x: bx + 60, y: (y0 + y1) / 2 + 30, ang: 0.05, len: 140, wid: 560, c: hex('#4a3f34'), type: DAB, alpha: 0.14 * Math.sin(Math.PI * clamp01((t - t0) / 0.45)), hgt: 0, seed: 9390 + i });
  });
  if (!frozen) E.under(p1.tex, 1080, 1920, { cam: sc, rect: [0, 0, 1080, 1920], weave: 0.075 });
  firstStroke(s, 540, 980);
  E.drawNow(s, { cam: sc, t });
}
const S23 = {
  id: 'S23', b0: 252, t1: 205.0,
  layers: () => [{ plate: 'overGold', D: 2.1 }],
  draw(F, t) { drawCoda(F, t); return { vig: 0.12, warm: 0.2, expo: coda(t) }; },
};
const S24 = {
  id: 'S24', t0: 205.0, t1: 211.63, clear: hex('#B9AE9C'),
  draw(F, t) { drawCoda(F, t); const k = coda(t); return { vig: 0.12 + 0.3 * (1 - k), expo: k, fade: t >= 210.2 ? 1 : 0 }; },
};

export const SHOTS = [S01, S02, S03, S04, S05, S06, S07, S08, S09, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21, S22, S23, S24];

// captions: warm white with a shadow on dark paint, dark brown on light paint — chosen from the brightness
// actually behind the band in this frame (sRGB luma; the crossover sits where both colours hold equal contrast).
// T21 sits over a pale sky crossed by the woman's dark hair, so it stays dark for its whole length with the halo.
const DARK_LINES = new Set(['T21']);
export function captionMode(c, t, luma) {
  if (DARK_LINES.has(c.id)) return 0;
  return smooth(prog(luma, 0.44, 0.36));
}
