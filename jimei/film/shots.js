// shots.js — the 24 shots. Every action is written in beats: B(n) is the time of beat n.
import { Strokes, KNIFE, DAB, LINE, BRUSH, hex, mixc, scalec, hash1 } from '../engine/impasto.js';
import { B, beatAt, prog, lerp, smooth, easeOut, easeIn, easeInOut, spring, clamp01 } from './timeline.js';
import { PAL, firstStroke, figure, crow, umbrella, rain, flutter, lantern, ribbon, wheat, burst } from './actors.js';
import { TITLE } from './plates/title.js';
import { FIELD, CLOSE, OVER } from './plates/field.js';
import { HILL } from './plates/hill.js';
import { TL } from './timeline.js';

const S = () => new Strokes(2048);
const cam = (x, y, zoom = 1, rot = 0) => ({ x, y, zoom, rot });
// keep the camera inside the painted plate
const clampCam = (c, r) => {
  const z = c.zoom || 1, a = c.rot || 0, hw = 540 / z, hh = 960 / z;
  const ex = Math.abs(Math.cos(a)) * hw + Math.abs(Math.sin(a)) * hh, ey = Math.abs(Math.sin(a)) * hw + Math.abs(Math.cos(a)) * hh;
  return cam(Math.max(r[0] + ex, Math.min(r[2] - ex, c.x)), Math.max(r[1] + ey, Math.min(r[3] - ey, c.y)), z, a);
};
const lerpCam = (a, b, t) => cam(lerp(a.x, b.x, t), lerp(a.y, b.y, t), Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)), lerp(a.rot || 0, b.rot || 0, t));
const NIGHT_POST = { amb: 0.82, dif: 0.26, spec: 0.24, vig: 0.28 };

// the street's ground plane: camera 4 m up, horizon at the vanishing point (P2 and P3 share it)
const HZ = 1330, VPX = 700, CAMH = 4, FOC = 1500;
const ground = (X, z) => [VPX + X * FOC / z, HZ + CAMH * FOC / z];
const hAt = (z) => 1.7 * FOC / z;

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

// ───────────────────────── act one · 散场 ─────────────────────────
function streetCamS03(F, t) {
  const st = F.store.plate('street').info;
  const z0 = 2.2, start = cam(st.warm[0], st.warm[1] - 20 / z0, z0);
  const wide = cam(720, 1280, 1);
  if (t < B(24)) return lerpCam(start, wide, easeInOut(prog(t, B(16), B(24))));
  return lerpCam(wide, cam(780, 1268, 1.07), smooth(prog(t, B(24), B(32))));
}

// the crowd leaving the festival: [X lateral m, z0 depth m, speed m/s, phase, coat colour, gesture]
const CROWD = [
  [-1.9, 6.2, 1.25, 0.1, '#3a3430', null], [-1.3, 6.8, 1.2, 0.6, '#2c3036', 'shoulderR'], [-0.72, 6.9, 1.2, 0.35, '#41382f', 'shoulderL'],
  [1.4, 7.6, 1.3, 0.8, '#33323a', null], [2.05, 8.8, 1.1, 0.2, '#3d362e', 'wave'], [0.4, 10.5, 1.35, 0.5, '#2f312b', null],
  [-2.3, 11.8, 1.2, 0.9, '#3a3338', null], [-1.7, 12.4, 1.2, 0.4, '#292c31', 'shoulderR'], [-1.12, 12.6, 1.2, 0.7, '#3e3731', 'shoulderL'],
  [1.8, 14, 1.25, 0.15, '#35302c', null], [0.9, 16.5, 1.3, 0.65, '#34343c', 'wave'], [-0.4, 19, 1.2, 0.3, '#3b322d', null],
  [2.3, 21, 1.15, 0.85, '#2e3034', null], [-2.0, 23, 1.2, 0.05, '#37332f', null],
];
function crowdStrokes(out, t, tStart, o = {}) {
  const items = [];
  for (let i = 0; i < CROWD.length; i++) {
    const [X, z0, v, ph, col, g] = CROWD[i];
    const z = z0 + v * (t - tStart);
    if (z > 40) continue;
    const [x, y] = ground(X * (1 - 0.01 * (z - z0)), z);
    items.push({ i, x, y, z, ph, col, g });
  }
  items.push(...(o.extra || []));
  items.sort((a, b) => b.z - a.z);
  for (const it of items) {
    if (it.draw) { it.draw(out); continue; }
    const h = hAt(it.z), beat = beatAt(o.tb != null ? o.tb : t);
    const walk = beat * 0.5 + it.ph;
    const f = { x: it.x, y: it.y, h, facing: 'back', walk, stride: 0.3, coat: hex(it.col), seed: 40 + it.i, light: 1, gmul: 1 };
    if (it.g === 'wave') { const w = Math.sin(beat * Math.PI); f.armR = [2.55 + 0.22 * w, -0.35 - 0.2 * w]; }
    if (it.g === 'shoulderR') f.armR = [1.95, 0.5];
    if (it.g === 'shoulderL') f.armL = [-1.95, 0.5];
    figure(out, f);
  }
}
function bulbs(out, st, t, outBeats, o = {}) {
  st.strings.forEach((pts, si) => {
    const off = t >= B(outBeats[si]);
    const flick = !off && t > B(outBeats[si]) - 0.12 && Math.sin(t * 90) > 0;
    const depth = [0.1, 0.27, 0.43, 0.58][si], sz = 20 * (1 - depth);
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      const lit = !off && !flick;
      out.push({ x, y: y + sz * 0.5, ang: 0, len: sz, wid: sz * 1.15, c: lit ? hex('#fff1c8') : hex('#5b5f6c'), c2: lit ? hex('#ffd890') : hex('#454955'), type: DAB, seed: 2000 + si * 40 + i, gmul: o.gmul != null ? o.gmul : 1, hgt: 0.8, run: 0 });
      // reflection on the wet stone below: short horizontal dabs, broken and fading
      if (lit && si < 3 && i % 2 === 0) {
        const gy = lerp(2200, 2260, x / 1440) - (lerp(2200, 2260, x / 1440) - HZ) * depth * 1.0;
        for (let k = 0; k < 4; k++) out.push({ x: x + Math.sin(i * 3 + k) * 5, y: gy + (gy - y) * 0.12 + k * sz * 0.7, ang: 0, len: sz * (1.6 - k * 0.25), wid: sz * 0.32, c: hex('#d9d3c0'), type: DAB, alpha: 0.42 * (1 - k / 4), seed: 2600 + si * 80 + i * 4 + k, hgt: 0.3, wet: 1, gmul: o.gmul != null ? o.gmul : 1 });
      }
    }
  });
}
function wireCrows(out, wire, n, t, o = {}) {
  const res = [];
  for (let k = 0; k < n; k++) {
    const idx = Math.round(wire.length * (0.18 + 0.64 * k / (n - 1)) + Math.sin(k * 2.3) * 1.5);
    const [x, y] = wire[Math.max(0, Math.min(wire.length - 1, idx))];
    res.push([x, y]);
    if (o.skip && o.skip(k)) continue;
    const beat = beatAt(t);
    const head = 0.5 + 0.5 * Math.sin(beat * 0.5 + k * 1.9) > 0.8 ? 0.35 : 0;
    crow(out, { x, y: y + 2, s: (o.s || 34) * (1 + 0.1 * Math.sin(k * 5)), pose: 'perch', dir: k % 3 ? -1 : 1, head, seed: k, gmul: 1 });
  }
  return res;
}

const S03 = {
  id: 'S03', b0: 16, b1: 32,
  layers: (F) => {
    const st = F.store.plate('street').info;
    return [{ plate: 'street', D: 2.5, revW: [st.moon[0], st.moon[1], 1 / 900] },
      { plate: 'street', D: 4.6, sub: [st.warm[0] - 340, st.warm[1] - 560, st.warm[0] + 340, st.warm[1] + 560], revW: [st.moon[0], st.moon[1], 1 / 900] }];
  },
  draw(F, t) {
    const st = F.store.plate('street').info, E = F.E, c = streetCamS03(F, t);
    const T0 = B(16), sweep = 0.85;
    const revW = [st.moon[0], st.moon[1], 1 / 900];
    if (t < T0 + sweep + 0.1) {
      // paint-over from the bottom of the frame to the top, over the linen and the first stroke
      S02.draw(F, Math.min(t, B(16) - 1e-3));
      const vb = F.store.viewBox(c), k = sweep / (vb[3] - vb[1]);
      F.store.drawLive('street', { cam: c, t, grey: 1, appW: [0, -1, k, 2], appear: T0 + vb[3] * k - 0.05, appDur: 0.18, uAppW: [0, -1, k, 2], uAppear: T0 + vb[3] * k + 0.1, uAppDur: 0.25 });
    } else F.store.drawPlate('street', { cam: c, t, grey: 1, revW });
    const s = S();
    bulbs(s, st, t, [24, 26, 28, 30]);
    wireCrows(s, st.wire, 7, t);
    // the traveller walks against the flow, one step a beat
    const tz = 34 - 1.75 * (t - T0), [tx, ty] = ground(-0.35, tz);
    crowdStrokes(s, t, T0, { extra: [{ z: tz, draw: (out) => figure(out, { x: tx, y: ty, h: hAt(tz), facing: 'front', walk: beatAt(t) * 0.5, stride: 0.34, coat: hex('#4a4239'), seed: 1, collar: true, light: 1, gmul: 1 }) }] });
    E.drawNow(s, { cam: c, t, grey: 1, appear: t < T0 + sweep ? T0 + 0.6 : -1e6, appDur: 0.2 });
    return Object.assign({}, NIGHT_POST);
  },
};

const S04 = {
  id: 'S04', b0: 32, b1: 48,
  layers: () => [{ plate: 'bench', D: 2.6 }],
  draw(F, t) {
    const bi = F.store.plate('bench').info, E = F.E;
    const c = lerpCam(cam(740, 1600, 1), cam(720, 1560, 1.25), easeInOut(prog(t, B(36), B(48))));
    F.store.drawPlate('bench', { cam: c, t, grey: 1 });
    const s = S();
    wireCrows(s, bi.wire, 5, t, { s: 36 });
    // the traveller, collar up, head down
    figure(s, { x: 800, y: bi.seatY + 150, h: 470, facing: 'front', sit: 0.32, coat: hex('#4a4239'), seed: 1, collar: true, look: -1, light: -1, gmul: 1, armL: [0.12, 0.6], armR: [-0.12, 0.6] });
    // b44: a black feather lets go of the wire and lands at b47
    const fk = prog(t, B(44), B(47));
    if (t >= B(44)) {
      const x = 1010 + Math.sin(fk * 9) * 60 * (1 - fk), y = lerp(1300, bi.seatY + 120, easeIn(fk) * 0.4 + fk * 0.6);
      s.push({ x, y, ang: Math.sin(fk * 9 + 1) * 0.8 + 0.4, len: 30, wid: 9, c: PAL.ink, c2: PAL.sheen, type: KNIFE, taper: 0.7, seed: 4400, run: 0, gmul: 1 });
    }
    E.drawNow(s, { cam: c, t, grey: 1 });
    // b40: the lamp flickers
    const fl = t > B(40) && t < B(40) + 0.5 ? (Math.sin((t - B(40)) * 70) > 0.2 ? 0.0 : 1) : 1;
    const lampScr = [(bi.lamp[0] - c.x) * c.zoom / 1080 + 0.5, (bi.lamp[1] - c.y) * c.zoom / 1920 + 0.5];
    return Object.assign({}, NIGHT_POST, { glow: [lampScr[0], lampScr[1], 0.16, 0.55 * fl, 0.9, 0.9, 0.85], expo: 0.94 + 0.06 * fl });
  },
};

// ───────────────────────── act two · 小小的光 ─────────────────────────
const S05 = {
  id: 'S05', b0: 48, b1: 64,
  layers: (F) => { const w = F.store.plate('window').info; return [{ plate: 'window', D: 2.5, revW: [w.lamp[0], w.lamp[1] - 60, 1.58 / 260] }]; },
  draw(F, t) {
    const w = F.store.plate('window').info, E = F.E, revW = [w.lamp[0], w.lamp[1] - 60, 1.58 / 260];
    // tilt up from the reflection to the window over two bars, then hold
    const c = lerpCam(cam(740, 2560, 1.15), cam(720, 1060, 1.15), easeInOut(prog(t, B(48), B(56))));
    // the lamp is turned up at b56: colour spreads 260 px from it in two beats, then stops
    const tR = Math.min(t, B(56) + 1.58 + 0.4);
    F.store.drawPlate('window', { cam: c, t: tR, grey: 1, reveal: B(56), revDur: 0.4, revW });
    // the woman who writes by this window, half-length behind the sill: she leans to the lamp, reaches for the
    // wick at b52, holds at b55, turns it up at b56 and lets the hand fall back to the sill
    const wo = S(), hW = 836, fx = 760, fy = w.win.y1 + 0.45 * hW;
    const reach = easeOut(prog(t, B(52), B(55))) * (1 - easeInOut(prog(t, B(57.5), B(59.5))));
    const twist = spring(t, B(56), 0.25);
    const shL = [fx - 0.112 * hW, fy - 0.841 * hW];
    const rest = [shL[0] + 64, w.win.y1 - 30], knob = [w.lamp[0] + 54, w.lamp[1] - 46 - twist * 6];
    const hand = [lerp(rest[0], knob[0], reach), lerp(rest[1], knob[1], reach) - Math.sin(reach * Math.PI) * 30];
    // she is lit by the lamp alone: dim until the wick goes up at b56
    const up = smooth(prog(t, B(56), B(56) + 0.35)), lk = (c0) => scalec(hex(c0), 0.5 + 0.5 * up);
    const her = figure(wo, { x: fx, y: fy, h: hW, facing: 'front', coat: lk('#3f5266'), skin: lk('#b5856a'), hair: lk('#2a201c'), longHair: true,
      look: -0.55 - 0.1 * reach, tiltHead: -0.35 - 0.25 * reach, light: -1, collar: false, scarf: lk('#7a4a40'),
      armL: ik(shL, hand, hW, -1), armR: [0.22, 2.05], seed: 41, gmul: 0 });
    // the notebook she writes in, held against her chest
    const nb = her._handR;
    wo.push({ x: nb[0] - 22, y: nb[1] - 30, ang: 1.38, len: 96, wid: 66, c: lk('#bfae8e'), c2: lk('#a8967a'), type: KNIFE, seed: 5104, run: 0, gmul: 0, hgt: 0.9, skew: 0 });
    wo.push({ x: nb[0] - 22 + 32, y: nb[1] - 30, ang: 1.38, len: 96, wid: 9, c: lk('#6a4a36'), type: KNIFE, seed: 5105, run: 0, gmul: 0, hgt: 1, skew: 0 });
    wo.push({ x: nb[0] + 2, y: nb[1] - 8, ang: 2.75, len: 30, wid: 18, c: lk('#b5856a'), c2: lk('#9a6e56'), type: DAB, seed: 5106, gmul: 0, hgt: 0.7 });
    E.drawNow(wo, { cam: c, t, clip: [w.win.x0, w.win.y0, w.win.x1, w.win.y1 + 2] });
    const s = S();
    lantern(s, { x: w.lamp[0], y: w.lamp[1], s: 120, lit: 0.35 + 0.65 * up, t, gmul: 0, seed: 1 });
    E.drawNow(s, { cam: c, t });
    const ls = [(w.lamp[0] - c.x) * c.zoom / 1080 + 0.5, (w.lamp[1] - 70 - c.y) * c.zoom / 1920 + 0.5];
    return Object.assign({}, NIGHT_POST, { glow: [ls[0], ls[1], 0.12 + 0.1 * up, 0.25 + 0.5 * up, 1, 0.62, 0.3] });
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

const S06 = {
  id: 'S06', b0: 64, b1: 72,
  layers: (F) => { const st = F.store.plate('street').info; return [{ plate: 'street', D: 2.5, revW: [st.moon[0], st.moon[1], 1 / 900] }]; },
  draw(F, t) {
    const st = F.store.plate('street').info, E = F.E;
    const c = cam(720, 1060, 1);
    // moonlight re-lays the street from the moon outward (from b66, two bars)
    F.store.drawPlate('street', { cam: c, t, grey: 1, reveal: B(66), revDur: 0.5, revW: [st.moon[0], st.moon[1], 1 / 900] });
    const s = S();
    // clouds slide off the moon
    const open = easeInOut(prog(t, B(64.5), B(67)));
    for (let k = 0; k < 7; k++) s.push({ x: st.moon[0] - 150 + (k % 4) * 90 + open * 520 + k * 12, y: st.moon[1] - 70 + Math.floor(k / 4) * 90 + (k % 2) * 30, ang: -0.06, len: 230 - (k % 3) * 30, wid: 110, c: hex('#26315b'), c2: hex('#34426f'), type: DAB, seed: 6100 + k, run: 0, alpha: 1 - smooth(prog(t, B(66), B(67.5))), gmul: 1, hgt: 0.6 });
    // the moon in the puddles
    const mr = smooth(prog(t, B(66), B(69)));
    for (const [px, py] of [[620, 1985], [930, 2262]]) for (let k = 0; k < 4; k++) s.push({ x: px + 60 + Math.sin(k * 2) * 6, y: py - 8 + k * 7, ang: 0, len: 40 - k * 7, wid: 6, c: hex('#e6ecf4'), type: DAB, alpha: mr * (0.9 - k * 0.2), seed: 6200 + k + px, wet: 1, gmul: 0, hgt: 0.4 });
    E.drawNow(s, { cam: c, t, grey: 1, reveal: B(66), revW: [st.moon[0], st.moon[1], 1 / 900] });
    // foreground: the lamp goes out at b64, three grey smoke puffs rise
    const f = S(), lit = 1 - smooth(prog(t, B(64), B(64) + 0.25));
    windowForeground(f, t, lit, mr);
    lantern(f, { x: 330, y: 1726, s: 230, lit, t, gmul: 0, seed: 2 });
    for (let k = 0; k < 3; k++) {
      const p = prog(t, B(64) + 0.15 + k * 0.35, B(64) + 2.6 + k * 0.35);
      if (p > 0 && p < 1) f.push({ x: 330 + Math.sin(p * 5 + k) * 26, y: 1600 - p * 380, ang: p * 2 + k, len: 50 + p * 70, wid: 40 + p * 50, c: hex('#8a8d95'), type: DAB, alpha: 0.55 * (1 - p), seed: 6300 + k, gmul: 0, hgt: 0.3 });
    }
    E.drawNow(f, { cam: cam(540, 960, 1), t });
    const ls = [330 / 1080, 1620 / 1920];
    return Object.assign({}, NIGHT_POST, { expo: 0.92 + 0.08 * Math.max(lit, mr), glow: [ls[0], ls[1], 0.14, 0.6 * lit, 1, 0.62, 0.3] });
  },
};

const S07 = {
  id: 'S07', b0: 72, b1: 80,
  layers: (F) => { const st = F.store.plate('street').info; return [{ plate: 'street', D: 3.2, sub: [100, 1000, 1300, 2560], revW: [st.moon[0], st.moon[1], 1 / 900] }]; },
  draw(F, t) {
    const st = F.store.plate('street').info, E = F.E;
    const c = lerpCam(cam(600, 1810, 1.5), cam(700, 1800, 1.5), smooth(prog(t, B(72), B(80))));
    F.store.drawPlate('street', { cam: c, t, revW: [st.moon[0], st.moon[1], 1 / 900], grey: 0 });
    const s = S(), beat = beatAt(t);
    const wind = 0.5 + 0.5 * Math.sin(t * 2.3);
    // the traveller walks slowly; a stranger comes from the right and opens the old red umbrella over them
    const tz = 8.4 - 0.25 * (t - B(72)), [tx, ty] = ground(-0.25, tz);
    const sz = 7.6, sx0 = 1.6, sxp = lerp(sx0, 0.25, easeOut(prog(t, B(72), B(75.5))));
    const [ux, uy] = ground(sxp, sz);
    const hT = hAt(tz), hS = hAt(sz) * 0.97;
    figure(s, { x: tx, y: ty, h: hT, facing: 'front', walk: beat * 0.5, stride: 0.22, coat: hex('#4a4239'), seed: 1, collar: true, light: 1, hem: -0.6 * wind, look: t > B(76.3) ? 0.6 : 0 });
    // closed umbrella carried low; b75 lifted over the traveller (anticipation); b76 snaps open
    const lift = smooth(prog(t, B(75), B(75.7)));
    const open = t < B(76) ? 0 : spring(t, B(76), 0.3);
    const sh = [ux - hS * 0.1, uy - hS * 0.78];
    const top = [lerp(ux + hS * 0.12, (tx + ux) / 2 + hS * 0.04, lift), lerp(uy - hS * 0.45, Math.min(ty - hT, uy - hS) - hS * 0.08, lift)];
    const handT = [lerp(top[0], top[0] + hS * 0.02, lift), top[1] + hS * lerp(0.35, 0.42, lift)];
    figure(s, { x: ux, y: uy, h: hS, facing: 'front', walk: t < B(75.5) ? beat * 0.5 : null, stride: 0.25, coat: hex('#3c3f4a'), seed: 2, collar: false, light: 1, hem: -0.4 * wind, armL: ik([ux - 0.112 * hS, uy - 0.841 * hS], handT, hS, -1) });
    umbrella(s, { x: top[0], y: top[1], r: hS * 0.4, open, tilt: lerp(0.5, -0.12, lift) - 0.08 * Math.sin(t * 2.3), c: PAL.umbrella, c2: PAL.umbrella2, seed: 1, gmul: 0 });
    rain(s, { rect: [c.x - 400, c.y - 720, c.x + 400, c.y + 720], t, n: 260, angle: 1.32, speed: 1700, len: 52, wid: 2.2, c: hex('#b9c4d8'), alpha: 0.5 });
    E.drawNow(s, { cam: c, t });
    return Object.assign({}, NIGHT_POST, { spec: 0.32 });
  },
};

const S08 = {
  id: 'S08', b0: 80, b1: 88,
  layers: (F) => { const st = F.store.plate('street').info; return [{ plate: 'street', D: 2.6, revW: [st.moon[0], st.moon[1], 1 / 900] }, { plate: 'sky', D: 2.4 }]; },
  draw(F, t) {
    const st = F.store.plate('street').info, E = F.E;
    // a slight sink with the music (63.4–64.0), the tilt up after the birds (64.5), a whip after 69.0
    const sink = Math.sin(Math.PI * prog(t, 63.4, 64.2)) * 30;
    const up = easeInOut(prog(t, 64.5, 69.0)), whip = easeIn(prog(t, 69.0, B(88)));
    const c = cam(720, 1080 + sink - up * 1500 - whip * 700, 1.18);
    F.store.drawPlate('street', { cam: c, t, revW: [st.moon[0], st.moon[1], 1 / 900] });
    F.store.drawPlate('sky', { cam: c, t });
    const s = S();
    // seven crows lift off, one a beat (b80…b86), flapping twice a beat
    const pos = wireCrows(s, st.wire, 7, t, { skip: (k) => t >= B(80 + k) });
    for (let k = 0; k < 7; k++) {
      const t0 = B(80 + k);
      if (t < t0) continue;
      const a = t - t0, [x0, y0] = pos[k];
      const dir = k % 2 ? 1 : -1;
      const x = x0 + dir * (a * 90 + a * a * 30), y = y0 - a * 260 - a * a * 120;
      crow(s, { x, y, s: 40, pose: 'fly', flap: a * 2 / 0.7895 + k * 0.3, dir, seed: k, tilt: -0.3 * dir, gmul: 0 });
    }
    // wind lifts confetti and leaves
    flutter(s, { t, rect: [c.x - 700, c.y - 1100, c.x + 700, c.y + 1100], n: 70, vx: 420, vy: -160, size: 22, colours: [hex('#a9b9d0'), hex('#7c8cb0'), hex('#9a8a70'), hex('#6a5a48'), hex('#c0543f')], seed: 3, gmul: 0 });
    E.drawNow(s, { cam: c, t });
    return Object.assign({}, NIGHT_POST);
  },
};

// ───────────────────────── act three · 麦田 ─────────────────────────
// the field's ground plane: camera 3 m up on the ridge, horizon at y 900
const FH = 900, FVX = 760, FC = 3, FF = 1500;
const fground = (X, z) => [FVX + X * FF / z, FH + FC * FF / z];
const fH = (z) => 1.7 * FF / z;
const DUSK_POST = { amb: 0.84, dif: 0.3, spec: 0.18, vig: 0.2, warm: 0.4 };

// wheat ears over the field: fixed positions, perspective sizes, swaying in phase with the wind
function wheatField(out, t, o = {}) {
  const n = o.n || 260, gust = o.gust || 0, dip = o.dip || 0, y0 = o.y0 || 1500;
  for (let k = 0; k < n; k++) {
    const fy = Math.pow(hash1(k * 1.7 + 2), 0.7), y = y0 + (2600 - y0) * fy;
    const x = -100 + hash1(k * 3.1 + 5) * 1640;
    const sz = 30 + 160 * ((y - FH) / (2560 - FH)) ** 1.6;
    if (o.cut && o.cut(x, y)) continue;
    const sway = 0.12 + 0.1 * gust;
    const a = sway * Math.sin(t * (1.6 + gust) - x * 0.004 + y * 0.001) + 0.15 * gust - dip;
    wheat(out, x, y, sz, a, { seed: 300 + k, c: o.c, c2: o.c2, gmul: o.gmul, alpha: o.alpha });
  }
}

// people walking in along the furrows to the gathering place: [X0, z0, X1, z1, start beat, coat]
const GATHER = [
  [-6.5, 9.5, -1.6, 11.4, 88, '#5a3e2e'], [6.8, 10.2, 1.5, 11.0, 88.5, '#3e4a5a'], [-0.8, 40, -0.5, 12.4, 89, '#6a4a32'],
  [7.2, 13, 2.4, 12.6, 90, '#4a3a3e'], [-7, 14.5, -2.5, 12.8, 91, '#3e4638'], [1.2, 44, 0.6, 12.9, 91.5, '#5e4a3a'],
  [-3.5, 6.2, -0.9, 11.0, 92, '#4a3e36'], [4.0, 6.5, 0.4, 10.8, 93, '#3a3a46'],
];
function gatherers(out, t, o = {}) {
  const items = [];
  GATHER.forEach(([X0, z0, X1, z1, b0, col], i) => {
    const t0 = B(b0), dur = Math.hypot(X1 - X0, z1 - z0) / 1.3;
    const k = clamp01((t - t0) / dur);
    const X = lerp(X0, X1, k), z = lerp(z0, z1, k);
    const [x, y] = fground(X, z);
    const toward = z1 < z0;   // walking toward the camera → we see a face
    items.push({ x, y, z, i, col, walking: k > 0 && k < 1, face: toward && k < 1 });
  });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) figure(out, { x: it.x, y: it.y, h: fH(it.z), facing: it.face ? 'front' : 'back', walk: it.walking ? beatAt(t) * 0.5 + it.i * 0.3 : null, stride: 0.3, coat: hex(it.col), seed: 60 + it.i, light: 1, gmul: o.gmul, hem: o.hem });
}

// crows gliding in and landing; batches at b92, b96, b100
function landingCrows(out, t, batches, o = {}) {
  batches.forEach((b, bi) => {
    for (let k = 0; k < 3; k++) {
      const i = bi * 3 + k, t0 = B(b) + k * 0.18, land = t0 + 1.6;
      const [gx, gy] = fground(-3 + hash1(i * 4.1) * 6, 9 + hash1(i * 2.3) * 5);
      if (t < t0) continue;
      const p = clamp01((t - t0) / (land - t0));
      const sx = gx - 700 + k * 80, sy = gy - 900 - k * 60;
      const x = lerp(sx, gx, easeOut(p)), y = lerp(sy, gy, easeOut(p)) - Math.sin(p * Math.PI) * 60;
      const sz = 22 * fH(9 + hash1(i * 2.3) * 5) / 220;
      if (p < 1) crow(out, { x, y, s: sz, pose: 'fly', flap: (t - t0) * 2.5, dir: 1, seed: 20 + i, tilt: 0.25 * (1 - p), gmul: o.gmul });
      else crow(out, { x: gx, y: gy, s: sz, pose: o.crouch ? 'crouch' : 'perch', dir: i % 2 ? 1 : -1, head: Math.sin(t * 2 + i) > 0.7 ? 0.4 : 0, seed: 20 + i, gmul: o.gmul, sheen: o.sheen });
    }
  });
}

const S09 = {
  id: 'S09', b0: 88, b1: 104,
  layers: () => [{ plate: 'fieldDusk', D: 2.5, revW: [FH, 0, (B(96) - B(89)) / 1660, 3] }],
  draw(F, t) {
    const E = F.E, revW = [FH, 0, (B(96) - B(89)) / 1660, 3];
    const c = lerpCam(cam(700, 1280, 1), cam(760, 1300, 1.12), smooth(prog(t, B(88), B(104))));
    const T0 = B(88), sweep = 0.8;
    const po = { cam: c, t, grey: 1, reveal: B(89), revDur: 0.5, revW };
    if (t < T0 + sweep + 0.1) {
      // paint-over from the top: the dusk is laid down in grey over the night sky
      S08.draw(F, Math.min(t, T0 - 1e-3));
      const vb = F.store.viewBox(c), k = sweep / (vb[3] - vb[1]);
      F.store.drawLive('fieldDusk', Object.assign({}, po, { appW: [0, 1, k, 2], appear: T0 - vb[1] * k - 0.05, appDur: 0.2, uAppW: [0, 1, k, 2], uAppear: T0 - vb[1] * k + 0.1, uAppDur: 0.25 }));
    } else F.store.drawPlate('fieldDusk', po);
    const s = S();
    wheatField(s, t, { y0: 1550, n: 220 });
    gatherers(s, t);
    landingCrows(s, t, [92, 96, 100]);
    E.drawNow(s, { cam: c, t, grey: 1, reveal: B(89), revDur: 0.5, revW, appear: t < T0 + sweep ? T0 + 0.5 : -1e6, appDur: 0.3 });
    return Object.assign({}, DUSK_POST);
  },
};

const S10 = {
  id: 'S10', b0: 104, b1: 120,
  layers: () => [{ plate: 'close', D: 2.5 }, { plate: 'close', D: 3.2, sub: [500, 1250, 1440, 2560] }, { plate: 'close', D: 4.6, sub: [20, 700, 620, 2500] }],
  draw(F, t) {
    const E = F.E, s = S();
    let c;
    const gust = smooth(prog(t, B(116), B(119)));
    if (t < B(108)) {
      // the traveller wades waist-deep through the wheat, one hand trailing over the ears
      const p = prog(t, B(104), B(108));
      c = clampCam(cam(lerp(1010, 880, smooth(p)), 1920, 1.5), [0, 0, 1440, 2560]);
      F.store.drawPlate('close', { cam: c, t, allowSoft: true });
      const px = lerp(1060, 900, p), py = 2620 - 40 * p, ph = 720 - 30 * p;
      const f = figure(s, { x: px, y: py, h: ph, facing: 'back', walk: beatAt(t) * 0.5, stride: 0.14, coat: hex('#4a4239'), lit: hex('#a8865a'), seed: 1, collar: true, light: 1, belt: true, armR: [0.48, 0.12], armL: [-0.08, 0.18], hem: 0.1 * Math.sin(t * 2) });
      const hand = f._handR;
      // the stand of wheat he wades through: close vertical blades up to his waist, lit along the top, deep in the stalks
      const top0 = py - 0.53 * ph;
      for (let r = 0; r < 8; r++) for (let i = 0; i < 104; i++) {
        const n = r * 131 + i, hx = 470 + i * 9 + (hash1(n) - 0.5) * 8;
        const yT = top0 + r * 46 + Math.sin(i * 1.7 + r * 0.9) * 12 + (hash1(n + 7) - 0.5) * 14, len = 72 + 26 * hash1(n + 3);
        const sw = 0.1 * Math.sin(t * 1.7 - hx * 0.01) + (hash1(n + 5) - 0.5) * 0.18;
        const col = r === 0 ? mixc(hex('#f0c45a'), hex('#d4a444'), hash1(n + 9)) : mixc(mixc(hex('#d9aa48'), hex('#b8822e'), hash1(n + 9)), hex('#6e4622'), r / 9);
        s.push({ x: hx + Math.cos(-Math.PI / 2 + sw) * len / 2, y: yT + len / 2, ang: -Math.PI / 2 + sw, len, wid: 9 + 5 * hash1(n + 11), c: col, c2: scalec(col, 0.86), type: KNIFE, taper: r === 0 ? 0.6 : 0.2, seed: 7000 + n, run: 0.1, hgt: 0.85 });
      }
      for (let k = 0; k < 96; k++) {      // a dense stand of ears in front of the walker, bowing where the hand passes
        const row = k % 4, x = 640 + Math.floor(k / 4) * 34 + row * 9 + Math.sin(k * 2.7) * 9, y = 2420 + row * 46 + Math.sin(k * 3.1) * 10;
        const len = 175 + 35 * Math.sin(k * 1.3) + row * 14, top = y - len;
        const touch = Math.exp(-Math.pow((x - hand[0]) / 50, 2)) * Math.exp(-Math.pow((top - hand[1]) / 110, 2));
        wheat(s, x, y, len, 0.14 * Math.sin(t * 1.7 - x * 0.01) - 0.75 * touch, { seed: 900 + k });
      }
    } else if (t < B(112)) {
      // the tree: a leaf lets go, turns over and falls; the camera follows it down
      const p = prog(t, B(108) + 0.25, B(112));
      const lx = lerp(CLOSE.leafFrom[0], CLOSE.leafTo[0], p) + Math.sin(p * 9) * 50 * (1 - p), ly = lerp(CLOSE.leafFrom[1], CLOSE.leafTo[1], easeIn(p) * 0.5 + p * 0.5);
      c = clampCam(cam(lerp(CLOSE.leafFrom[0], CLOSE.leafTo[0], easeInOut(p)), lerp(CLOSE.leafFrom[1] + 120, CLOSE.leafTo[1] - 200, easeInOut(p)), 2.2), [0, 0, 1440, 2560]);
      F.store.drawPlate('close', { cam: c, t, allowSoft: true });
      s.push({ x: lx, y: ly, ang: p * 11, len: 34 * (0.4 + 0.6 * Math.abs(Math.cos(p * 11))), wid: 18, c: hex('#c07a3a'), c2: hex('#8a4a2a'), type: KNIFE, taper: 0.6, seed: 5301, run: 0 });
    } else {
      // landed: the leaf becomes an ochre stroke in the soil; pull back to the people watching the sunset
      const p = easeInOut(prog(t, B(112), B(120)));
      c = clampCam(lerpCam(cam(CLOSE.leafTo[0] + 40, CLOSE.leafTo[1] - 220, 2.2), cam(720, 1300, 1), p), [0, 0, 1440, 2560]);
      F.store.drawPlate('close', { cam: c, t });
      s.push({ x: CLOSE.leafTo[0], y: CLOSE.leafTo[1], ang: 0.1, len: 46, wid: 16, c: hex('#9A4E2A'), c2: hex('#C08A3E'), type: KNIFE, seed: 5302, run: 0.3, app: 0 });
      // seven people watching the sunset, at ease: hands in pockets, a couple holding hands, a head on a shoulder, a child
      const G = [
        { x: 500, y: 1792, h: 300, coat: '#5a3e2e', pockets: true, sway: 1 },
        { x: 598, y: 1800, h: 292, coat: '#3e4a5a', sway: -0.6, hold: 2, side: 1 },
        { x: 668, y: 1796, h: 274, coat: '#6a4a32', sway: 0.6, hold: 1, side: -1, scarf: hex('#9C3B2A') },
        { x: 792, y: 1804, h: 290, coat: '#4a3a3e', sway: 1, tiltHead: 1, pockets: true },
        { x: 858, y: 1798, h: 304, coat: '#3e4638', sway: -0.4, armL: [-0.08, 0.2], armR: [0.1, 0.15] },
        { x: 942, y: 1806, h: 188, coat: '#8a5a3a', child: true, hold: 6, side: 1 },
        { x: 1012, y: 1794, h: 306, coat: '#5e4a3a', sway: -1, hold: 5, side: -1 },
      ];
      const shoulderOf = (q, sd) => [q.x + sd * 0.112 * q.h * (q.child ? 0.9 : 1), q.y - (q.child ? 0.741 : 0.841) * q.h];
      G.forEach((q, i) => {
        const f = { x: q.x, y: q.y, h: q.h, facing: 'back', coat: hex(q.coat), seed: 70 + i, light: 1, hem: 0.35 * gust * Math.sin(t * 3 + i), sway: q.sway, pockets: q.pockets, child: q.child, tiltHead: q.tiltHead, scarf: q.scarf, armL: q.armL, armR: q.armR };
        if (q.hold != null) {
          const o2 = G[q.hold], lowH = Math.min(q.child ? q.h : 1e9, o2.child ? o2.h : 1e9);
          const meetY = lowH < 1e8 ? Math.max(q.y, o2.y) - 0.72 * lowH : (q.y + o2.y) / 2 - 0.42 * Math.min(q.h, o2.h);
          const target = [(q.x + o2.x) / 2, meetY], sh = shoulderOf(q, q.side);
          if (q.side > 0) f.armR = ik(sh, target, q.h, 1); else f.armL = ik(sh, target, q.h, -1);
        }
        figure(s, f);
      });
      for (let k = 0; k < 4; k++) crow(s, { x: 560 + k * 150, y: 1850 + (k % 2) * 14, s: 28, pose: 'perch', dir: k % 2 ? 1 : -1, head: 0.2 * (k % 2), seed: 40 + k });
      for (let k = 0; k < 40; k++) {
        const x = 60 + k * 36, y = 2440 + (k % 3) * 30;
        wheat(s, x, y, 170 + 20 * Math.sin(k), (0.12 + 0.18 * gust) * Math.sin(t * (1.7 + gust) - x * 0.008) + 0.2 * gust, { seed: 950 + k });
      }
    }
    E.drawNow(s, { cam: c, t, appear: t >= B(112) ? B(112) : -1e6, appDur: 0.3 });
    return Object.assign({}, DUSK_POST, { glow: t >= B(112) ? [0.68, 0.38, 0.3, 0.25, 1, 0.75, 0.4] : null });
  },
};

const S11 = {
  id: 'S11', b0: 120, b1: 140,
  layers: () => [{ plate: 'fieldDusk', D: 2.5, revW: [FH, 0, (B(96) - B(89)) / 1660, 3] }, { plate: 'fieldHarvest', D: 2.5 }],
  draw(F, t) {
    const E = F.E, c = cam(700, 1280, 1);
    const hold = t >= 110.2 && t < 110.4;          // the frame stands still for an instant
    const ta = hold ? 110.2 : t;
    // dusk field, then the harvest scraped in column by column (b120 → b124)
    F.store.drawPlate('fieldDusk', { cam: c, t: ta, revW: [FH, 0, (B(96) - B(89)) / 1660, 3] });
    const harvestK = 1440 / (B(124) - B(120.6));
    const wipe = { wipeW: [1 / harvestK, 0, 1, 2], wipe: [B(120.6), 0.25, 0.25] };
    E.drawCache(F.store.layer('fieldHarvest', { D: 2.5 }), Object.assign({ cam: c, t: ta, sub: [0, FH - 30, 1440, 2560] }, wipe));
    // the sky turns cold (b128)
    E.drawCache(F.store.layer('fieldHarvest', { D: 2.5 }), { cam: c, t: ta, sub: [0, 0, 1440, FH - 30], alpha: smooth(prog(t, B(128), B(131))) });
    const s = S();
    // b120: the whole sea of wheat dips at once, then the uncut ears go as the scrape passes
    const dip = Math.sin(Math.PI * prog(t, B(120), B(120.6))) * 0.45;
    wheatField(s, ta, { y0: 1550, n: 220, dip, cut: (x) => ta > B(120.6) + x / harvestK });
    // b124: where the people stood, a small warm fire — the first stroke again
    if (t >= B(124)) firstStroke(s, FIELD.gather[0], FIELD.gather[1], { scale: 0.55 });
    // b132: first frost, a thin grey-white veil of dabs
    for (let k = 0; k < 420; k++) {
      const tk = B(132) + hash1(k * 1.3) * 5;
      if (ta < tk) continue;
      const y = FH + 40 + Math.pow(hash1(k * 2.9), 0.8) * 1640, x = hash1(k * 4.7) * 1440, sz = 4 + 18 * (y - FH) / 1660;
      s.push({ x, y, ang: hash1(k) * 0.4, len: sz * 1.6, wid: sz, c: PAL.frost, type: DAB, alpha: 0.55 * clamp01((ta - tk) / 0.6), seed: 7000 + k, hgt: 0.3, gmul: 0 });
    }
    // leaves go back into the soil under the tree
    for (let k = 0; k < 8; k++) {
      const t0 = B(126 + k * 1.5), p = clamp01((ta - t0) / 2.2);
      if (p <= 0) continue;
      const x = FIELD.tree[0] - 80 + hash1(k * 3) * 180 + Math.sin(p * 8 + k) * 30, y = lerp(FIELD.tree[1] - 300, FIELD.tree[1] + 10 + hash1(k) * 20, p);
      s.push({ x, y, ang: p * 9 + k, len: 12, wid: 7, c: hex('#9A4E2A'), c2: hex('#C08A3E'), type: KNIFE, seed: 7600 + k, alpha: p < 1 ? 1 : 0.7, run: 0 });
    }
    // crows pacing on the empty field
    for (let k = 0; k < 4; k++) {
      const z = 10 + k * 1.3, X = -2 + k * 1.4 + 0.25 * Math.floor(beatAt(ta) + k) % 3 * (k % 2 ? 1 : -1);
      const [x, y] = fground(X, z);
      if (t > B(128)) crow(s, { x, y, s: 22 * fH(z) / 220, pose: 'perch', dir: k % 2 ? 1 : -1, head: Math.sin(beatAt(ta) * Math.PI + k) > 0.5 ? 0.4 : 0, seed: 50 + k });
    }
    E.drawNow(s, { cam: c, t: ta });
    const cold = smooth(prog(t, B(128), B(132)));
    return Object.assign({}, DUSK_POST, { warm: 0.4 - 0.9 * cold, sat: 1 - 0.25 * cold });
  },
};

// ───────────────────────── act four · 递光 ─────────────────────────
// a window lighting up: warm blades dragged into its quad, a mullion, a faint reflection below
function litWindow(out, w, t0, t, o = {}) {
  if (t < t0) return;
  const q = w.q, cx = w.c[0], cy = w.c[1];
  const wd = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), ht = Math.hypot(q[3][0] - q[0][0], q[3][1] - q[0][1]);
  const ang = Math.atan2(q[3][1] - q[0][1], q[3][0] - q[0][0]);
  const k = clamp01((t - t0) / 0.25), seed = (o.seed || 0) * 7;
  for (let i = -1; i <= 1; i++) {
    const ox = i * wd * 0.3;
    out.push({ x: cx + Math.cos(ang - Math.PI / 2) * ox, y: cy + Math.sin(ang - Math.PI / 2) * ox, ang, len: ht * 0.98, wid: wd * 0.42, c: PAL.window, c2: PAL.first2, type: KNIFE, seed: 8100 + seed + i, gmul: 0, run: 0, app: t0 + Math.abs(i) * 0.05, hgt: 0.9, skew: 0 });
  }
  out.push({ x: cx, y: cy, ang, len: ht * 0.95, wid: Math.max(2, wd * 0.07), c: hex('#3a2a1e'), type: LINE, seed: 8150 + seed, gmul: 0, app: t0 + 0.1 });
  if (o.reflect) for (let r = 0; r < 4; r++) out.push({ x: cx + Math.sin(r * 2) * 4, y: o.reflect + r * 7, ang: 0, len: wd * (1.1 - r * 0.2), wid: 5, c: mixc(PAL.window, hex('#5b6c97'), 0.3 + r * 0.12), type: DAB, alpha: 0.7 * k * (1 - r / 5), seed: 8160 + seed + r, gmul: 0, wet: 1, hgt: 0.3 });
}
const WIN_PICK = (st) => {
  // six windows, low to high, alternating sides, all in frame
  const L = st.windows.filter((w) => w.side < 0 && w.d < 0.5), R = st.windows.filter((w) => w.side > 0 && w.d < 0.5);
  const by = (arr, row, d) => arr.reduce((b, w) => (Math.abs(w.row - row) + Math.abs(w.d - d) < Math.abs(b.row - row) + Math.abs(b.d - d) ? w : b));
  return [by(L, 0.47, 0.3), by(R, 0.46, 0.3), by(L, 0.27, 0.42), by(R, 0.25, 0.4), by(L, 0.09, 0.2), by(R, 0.07, 0.25)];
};
function bez(a, c, b, n = 24) { const o = []; for (let i = 0; i <= n; i++) { const u = i / n; o.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]]); } return o; }
const GOLD = (k) => mixc(PAL.gold, PAL.window, 0.5 + 0.5 * Math.sin(k * 9));
const TRAIL = (k) => mixc(hex('#fff1c2'), PAL.gold, 0.35 + 0.35 * Math.sin(k * 11));

// arm angles that put the hand on a target: [upper-arm angle, elbow bend toward the body] for figure()
function ik(sh, target, h, side) {
  const L1 = 0.19 * h, L2 = 0.18 * h, dx = target[0] - sh[0], dy = target[1] - sh[1];
  const r = Math.min(Math.hypot(dx, dy), (L1 + L2) * 0.999), th = Math.atan2(dx, dy);
  const d = Math.acos(Math.max(-1, Math.min(1, (r * r - L1 * L1 - L2 * L2) / (2 * L1 * L2))));
  const a = Math.atan2(L2 * Math.sin(d), L1 + L2 * Math.cos(d));
  return [th + side * a, d];
}
// a crow with a spark of the lantern's light in its beak, and the faint wake of that spark
function emberCrow(out, x, y, s, dir, t, seed, o = {}) {
  crow(out, { x, y, s, pose: 'fly', flap: t * 2.6 + seed * 0.37, dir, seed, tilt: o.tilt || 0, gmul: 1 });
  const bx = x + dir * s * 0.74, by = y - s * 0.03, e = s * 0.38;
  out.push({ x: bx, y: by, ang: 0, len: e * 5, wid: e * 5, c: PAL.window, type: DAB, alpha: 0.25, seed: 9900 + seed, gmul: 0, hgt: 0.05 });
  out.push({ x: bx, y: by, ang: 0, len: e, wid: e, c: hex('#fff1c2'), c2: PAL.first2, type: DAB, seed: 9901 + seed, gmul: 0, hgt: 1 });
  (o.wake || []).forEach(([wx, wy], k) => out.push({ x: wx, y: wy, ang: 0, len: e * (0.8 - k * 0.12), wid: e * (0.8 - k * 0.12), c: mixc(hex('#fff1c2'), PAL.window, 0.5), type: DAB, alpha: 0.55 * (1 - k / 6), seed: 9910 + seed * 7 + k, gmul: 0, hgt: 0.4 }));
}
const sillOf = (w) => [(w.q[2][0] + w.q[3][0]) / 2, (w.q[2][1] + w.q[3][1]) / 2 + 4];

function travellerWithLantern(out, x, y, h, t, o = {}) {
  const f = figure(out, { x, y, h, facing: o.facing || 'front', walk: o.walk, stride: 0.3, coat: hex('#4a4239'), seed: 1, collar: true, light: 1, armR: o.armR || [0.45, 0.35], gmul: 1, look: o.look });
  const hd = f._handR;
  lantern(out, { x: hd[0], y: hd[1] + h * 0.17, s: h * 0.16, lit: 1, t, gmul: 0, seed: 3, handle: true });
  return [hd[0], hd[1] + h * 0.07];
}

const S12 = {
  id: 'S12', b0: 140, b1: 156,
  layers: (F) => { const st = F.store.plate('street').info; return [{ plate: 'street', D: 2.5, revW: [st.moon[0], st.moon[1], 1 / 900] }]; },
  draw(F, t) {
    const st = F.store.plate('street').info, E = F.E, revW = [st.moon[0], st.moon[1], 1 / 900];
    const c = lerpCam(cam(720, 1280, 1), cam(740, 1300, 1.08), smooth(prog(t, B(140), B(156))));
    F.store.drawPlate('street', { cam: c, t, grey: 1, revW });
    const s = S(), g = S();
    const tz = 30 - 1.4 * (t - B(140)), [tx, ty] = ground(0.2, tz);
    const lamp = travellerWithLantern(g, tx, ty, hAt(tz), t, { walk: beatAt(t) * 0.5 });
    // a crow dips to the lantern, takes a spark, carries it to a window; the window lights as it lands
    const lampAt = (tt) => { const z = 30 - 1.4 * (tt - B(140)), [x, y] = ground(0.2, z); return travellerWithLantern(new Strokes(64), x, y, hAt(z), tt, { walk: beatAt(tt) * 0.5 }); };
    const wins = WIN_PICK(st);
    wins.forEach((w, i) => {
      const tl = B(144 + 2 * i), t0 = tl - 2.0;
      litWindow(s, w, tl, t, { seed: i, reflect: w.row > 0.4 ? lerp(2200, 2260, w.c[0] / 1440) - (lerp(2200, 2260, w.c[0] / 1440) - HZ) * w.d + 30 : 0 });
      if (t < t0) return;
      const sill = sillOf(w), ls0 = lampAt(t0 + 0.5), size = 44 * (1 - 0.5 * w.d);
      if (t >= tl - 0.05) { crow(s, { x: sill[0], y: sill[1], s: size, pose: 'perch', dir: -w.side, head: Math.sin(t * 1.5 + i) > 0.6 ? 0.3 : 0, seed: 80 + i, gmul: 1 }); return; }
      const dive = bez([ls0[0] - w.side * 90, ls0[1] - 230], [ls0[0] - w.side * 60, ls0[1] - 40], [ls0[0], ls0[1] - 10], 12);
      const rise = bez([ls0[0], ls0[1] - 10], [(ls0[0] + sill[0]) / 2 + w.side * 80, Math.min(ls0[1], sill[1]) - 220], sill, 30);
      const at = (u) => { const path = u < 0.25 ? dive : rise, v = u < 0.25 ? u / 0.25 : (u - 0.25) / 0.75, f = v * (path.length - 1), j = Math.min(path.length - 2, Math.floor(f)), r = f - j; return [lerp(path[j][0], path[j + 1][0], r), lerp(path[j][1], path[j + 1][1], r)]; };
      const u = smooth((t - t0) / (tl - t0)), [x, y] = at(u), [nx, ny] = at(Math.min(1, u + 0.02));
      const sz = lerp(20, size, u), dir = nx >= x ? 1 : -1;
      if (u < 0.25) crow(s, { x, y, s: sz, pose: 'fly', flap: t * 2.6 + i, dir, seed: 80 + i, tilt: 0.3, gmul: 1 });
      else emberCrow(s, x, y, sz, dir, t, 80 + i, { tilt: Math.atan2(ny - y, Math.abs(nx - x) + 1e-3) * 0.5, wake: [1, 2, 3, 4, 5].map((k) => at(Math.max(0.25, u - 0.03 * k))).map(([wx, wy]) => [wx + dir * sz * 0.74, wy]) });
    });
    E.drawNow(g, { cam: c, t, grey: 1 });
    E.drawNow(s, { cam: c, t, grey: 1 });
    const ls = [(lamp[0] - c.x) * c.zoom / 1080 + 0.5, (lamp[1] - c.y) * c.zoom / 1920 + 0.5];
    return Object.assign({}, NIGHT_POST, { glow: [ls[0], ls[1], 0.09, 0.55, 1, 0.62, 0.3] });
  },
};

const S13 = {
  id: 'S13', b0: 156, b1: 172,
  layers: () => [{ plate: 'bench', D: 2.8 }],
  draw(F, t) {
    const bi = F.store.plate('bench').info, E = F.E;
    const c = clampCam(lerpCam(cam(760, 1720, 1.3), cam(740, 1600, 1.0), easeInOut(prog(t, B(164), B(172)))), [0, 0, 1440, 2560]);
    F.store.drawPlate('bench', { cam: c, t, grey: 1 });
    const s = S(), g = S();
    // half the windows of the square are already lit
    bi.windows.forEach(([wx, wy, ww, wh], i) => {
      if (hash1(i * 5.3) < 0.5) return;
      litWindow(s, { q: [[wx - ww / 2, wy - wh / 2], [wx + ww / 2, wy - wh / 2], [wx + ww / 2, wy + wh / 2], [wx - ww / 2, wy + wh / 2]], c: [wx, wy] }, -1, t, { seed: 20 + i });
    });
    // someone else sits head-down on the bench
    const seat = bi.seatY, feet = seat + 150;
    figure(g, { x: 840, y: feet, h: 460, facing: 'front', sit: 0.32, coat: hex('#3e4652'), seed: 9, collar: true, look: -1, light: 1, gmul: 1, armL: [0.12, 0.6], armR: [-0.12, 0.6] });
    // the traveller comes in from the left and stops beside them
    const arrive = easeOut(prog(t, B(156), B(159)));
    const tx = lerp(260, 640, arrive), ty = feet + 40, th = 520;
    const shR = [tx + 0.1 * th, ty - 0.78 * th], shL = [tx - 0.1 * th, ty - 0.78 * th];
    // right hand: lifts the old red umbrella (b159, anticipation) and opens it over the sitter (b160)
    const lift = smooth(prog(t, B(159), B(159.8))), open = t < B(160) ? 0 : spring(t, B(160), 0.3);
    const tilt = lerp(0.55, -0.08, lift);
    const top = [lerp(tx + 0.22 * th, 815, lift), lerp(ty - 0.66 * th, ty - 1.16 * th, lift)];
    const gripR = [top[0] - Math.sin(tilt) * th * 0.42 * 0.9, top[1] + Math.cos(tilt) * th * 0.42 * 0.9];
    // left hand: carries the lantern by its handle, sets it on the seat at b162 → b163.2, lets go
    const lsz = th * 0.16, spot = [505, seat - 4];
    const hang = [shL[0] - 0.01 * th, shL[1] + 0.36 * th];
    const put = smooth(prog(t, B(162), B(163.2))), back = smooth(prog(t, B(163.4), B(164.4)));
    const onSeat = t >= B(163.2);
    const handle = [spot[0], spot[1] - lsz * 1.12];
    const gripL = onSeat ? [lerp(handle[0], hang[0], back), lerp(handle[1], hang[1], back)] : [lerp(hang[0], handle[0], put), lerp(hang[1], handle[1], put)];
    if (onSeat) lantern(g, { x: spot[0], y: spot[1], s: lsz, lit: 1, t, gmul: 0, seed: 3, handle: true });
    figure(g, { x: tx, y: ty, h: th, facing: 'front', walk: arrive < 1 ? beatAt(t) * 0.5 : null, stride: 0.28, coat: hex('#4a4239'), seed: 1, collar: true, light: -1, gmul: 1, armR: ik(shR, gripR, th, 1), armL: ik(shL, gripL, th, -1), look: 0.2, lean: 0 });
    if (!onSeat) lantern(g, { x: gripL[0], y: gripL[1] + lsz * 1.12, s: lsz, lit: 1, t, gmul: 0, seed: 3, handle: true });
    umbrella(g, { x: top[0], y: top[1], r: th * 0.42, open, tilt, c: PAL.umbrella, c2: PAL.umbrella2, seed: 2, gmul: 0 });
    const lp = onSeat ? spot : [gripL[0], gripL[1] + lsz * 1.12];
    rain(s, { rect: [c.x - 700, c.y - 1100, c.x + 700, c.y + 1100], t, n: 300, angle: 1.4, speed: 1800, len: 58, wid: 2.4, c: hex('#b9c4d8'), alpha: 0.45 });
    E.drawNow(s, { cam: c, t, grey: 1 });
    E.drawNow(g, { cam: c, t, grey: 1 });
    const ls = [(lp[0] - c.x) * c.zoom / 1080 + 0.5, (lp[1] - 60 - c.y) * c.zoom / 1920 + 0.5];
    return Object.assign({}, NIGHT_POST, { glow: [ls[0], ls[1], 0.16, 0.6, 1, 0.62, 0.3] });
  },
};

const S14 = {
  id: 'S14', b0: 172, b1: 178,
  layers: (F) => { const st = F.store.plate('street').info; return [{ plate: 'street', D: 2.6, revW: [st.moon[0], st.moon[1], 1 / 900] }, { plate: 'sky', D: 2.4 }]; },
  draw(F, t) {
    const st = F.store.plate('street').info, E = F.E, revW = [st.moon[0], st.moon[1], 1 / 900];
    const up = easeIn(prog(t, B(172.5), B(178)));
    const c = cam(720, 1280 - up * 2300, 1.1);
    F.store.drawPlate('street', { cam: c, t, grey: 1, revW });
    F.store.drawPlate('sky', { cam: c, t, grey: 1 });
    const s = S();
    // every window on the street lights up, a batch a beat (b172…b175)
    const picked = new Set(WIN_PICK(st));
    st.windows.forEach((w, i) => litWindow(s, w, picked.has(w) ? -1 : B(172 + (i % 4)), t, { seed: 40 + i }));
    // the crows on the sills lift off and gather into a spiral, climbing with their sparks
    const sills = WIN_PICK(st).map(sillOf);
    const spiral = (k, tt) => { const a = tt * 2.2 + k * 0.52, h = 1500 - k * 140 - prog(tt, B(172), B(178)) * 1200; return [720 + Math.cos(a) * (120 + k * 14), h + Math.sin(a) * 40, a]; };
    for (let k = 0; k < 12; k++) {
      const [sx, sy, a] = spiral(k, t), [px] = spiral(k, t - 0.05);
      if (k < 6) {
        const lk = smooth(prog(t, B(172) + k * 0.3, B(172) + k * 0.3 + 1.2)), [cx, cy] = sills[k];
        if (lk <= 0) { crow(s, { x: cx, y: cy, s: 26, pose: 'perch', dir: k % 2 ? 1 : -1, seed: 80 + k, gmul: 1 }); continue; }
        emberCrow(s, lerp(cx, sx, lk), lerp(cy, sy, lk), 28, lk < 1 ? (sx > cx ? 1 : -1) : (sx >= px ? 1 : -1), t, 100 + k, { tilt: -0.3 });
        continue;
      }
      emberCrow(s, sx, sy, 28, sx >= px ? 1 : -1, t, 100 + k, { tilt: -0.3, wake: [1, 2, 3].map((j) => { const [wx, wy] = spiral(k, t - j * 0.07); return [wx, wy]; }) });
    }
    E.drawNow(s, { cam: c, t, grey: 1 });
    return Object.assign({}, NIGHT_POST);
  },
};

// ───────────────────────── act five · 夜的麦田 (overhead) ─────────────────────────
// a person seen from above: shadow, shoulders, head, swinging arms, an optional lamp
function topFigure(out, o) {
  const s = o.s, a = o.ang, ca = Math.cos(a), sa = Math.sin(a), s0 = 8500 + (o.seed || 0) * 11;
  const P = (fx, fy) => [o.x + fx * ca - fy * sa, o.y + fx * sa + fy * ca];   // fx forward, fy right
  const sw = Math.sin((o.phase || 0) * Math.PI * 2) * 0.25;
  const push = (q) => out.push(Object.assign({ gmul: o.gmul, run: 0, hgt: 0.9 }, q));
  const sh = P(-s * 0.3, s * 0.35);
  push({ x: sh[0], y: sh[1], ang: a + 0.6, len: s * 1.6, wid: s * 0.7, c: hex('#141a2e'), type: DAB, alpha: 0.5, seed: s0, hgt: 0.1 });
  for (let k = -1; k <= 1; k += 2) { const p = P(sw * k * s * 0.5, k * s * 0.55); push({ x: p[0], y: p[1], ang: a, len: s * 0.55, wid: s * 0.22, c: o.coat, type: KNIFE, seed: s0 + 2 + k, taper: 0.3 }); }
  push({ x: o.x, y: o.y, ang: a + Math.PI / 2, len: s * 1.15, wid: s * 0.62, c: o.coat, c2: mixc(o.coat, [0.8, 0.85, 0.95], 0.25), type: DAB, seed: s0 + 4 });
  const hd = P(s * 0.06, 0);
  push({ x: hd[0], y: hd[1], ang: a, len: s * 0.46, wid: s * 0.42, c: hex('#1d1a1c'), type: DAB, seed: s0 + 5 });
  if (o.lamp) {
    const lp = P(s * 0.25 + sw * s * 0.4, s * 0.62);
    // the pool of lamplight: thin washes that grow fainter outward, so it has no edge
    for (let i = 0; i < 7; i++) { const r = 2.8 - i * 0.33; push({ x: lp[0], y: lp[1], ang: i * 1.3, len: s * r, wid: s * r * 0.94, c: mixc(PAL.window, PAL.first2, i * 0.08), type: DAB, alpha: 0.035 + i * 0.012, seed: s0 + 6 + i * 0.37, hgt: 0.01, gmul: 0 }); }
    push({ x: lp[0], y: lp[1], ang: 0, len: s * 0.36, wid: s * 0.36, c: mixc(PAL.first2, [1, 1, 0.9], 0.4), c2: PAL.window, type: DAB, seed: s0 + 7, gmul: 0, hgt: 1 });
  }
}
const RING = [];   // the people who bring lamps: four groups from four sides, settling on a loose ring
for (let g = 0; g < 4; g++) for (let k = 0; k < 6; k++) {
  const side = g * Math.PI / 2 + 0.4, ang = side + (k - 2.5) * 0.11;
  RING.push({ g, b: 180 + g * 4 + k * 0.2, from: [OVER.c[0] + Math.cos(ang) * 1050, OVER.c[1] + Math.sin(ang) * 1050], to: [OVER.c[0] + Math.cos(side + (k - 2.5) * 0.26) * (300 + (k % 2) * 40), OVER.c[1] + Math.sin(side + (k - 2.5) * 0.26) * (300 + (k % 2) * 40)], coat: ['#2e3a5c', '#3a3f52', '#283350', '#3e4660'][k % 4] });
}
function circlingCrows(out, t, o = {}) {
  for (let k = 0; k < (o.n || 6); k++) {
    const r = 520 + k * 70, w = 0.5 + (k % 3) * 0.08, a0 = k * 1.1;
    const pos = (tt) => { const a = a0 + tt * w * (k % 2 ? 1 : -1); return [OVER.c[0] + Math.cos(a) * r, OVER.c[1] + Math.sin(a) * r * 0.92]; };
    // the trail: thin dark knife marks along the last moments of the flight
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
    for (const r of RING) {
      const t0 = B(r.b), k = clamp01((t - t0) / 3.0);
      if (t < t0) continue;
      const x = lerp(r.from[0], r.to[0], easeOut(k)), y = lerp(r.from[1], r.to[1], easeOut(k));
      topFigure(s, { x, y, s: 44, ang: Math.atan2(r.to[1] - r.from[1], r.to[0] - r.from[0]), phase: k < 1 ? beatAt(t) * 0.5 : 0, lamp: true, coat: hex(r.coat), seed: r.g * 10 + RING.indexOf(r) });
    }
    circlingCrows(s, t);
    E.drawNow(s, { cam: c, t, appear: t < T0 + 0.9 ? T0 + 0.6 : -1e6, appDur: 0.3 });
    return { amb: 0.84, dif: 0.3, spec: 0.3, vig: 0.3, light: [-0.4, -0.5, 0.75] };
  },
};

// ───────────────────────── act six · 灰与白 ─────────────────────────
// the traveller close enough to need more paint: folds, seams, hair, a sliver of face
function heroTraveller(out, t, o) {
  const f = figure(out, Object.assign({ x: HILL.feet[0], y: HILL.feet[1], h: HILL.h, facing: 'back', coat: hex('#3e3731'), seed: 1, collar: true, light: 1, cheek: o.look > 0.2, belt: true, hands: false, armL: [0.1, 0.25], armR: [-0.1, 0.25] }, o, { hem: (o.hem || 0) * 1.6 }));
  const h = HILL.h, x = HILL.feet[0], y = HILL.feet[1];
  const wind = o.hem || 0;
  for (let k = 0; k < 3; k++) {   // soft coat folds pushed across by the wind
    const u = -0.06 + k * 0.05 + wind * 0.01 * k;
    out.push({ x: x + u * h, y: y - (0.42 + 0.07 * (k % 2)) * h, ang: -Math.PI / 2 + 0.22 + 0.06 * k + wind * 0.12, len: h * (0.2 + 0.04 * (k % 2)), wid: h * 0.016, c: hex('#332e28'), c2: hex('#4a4239'), type: KNIFE, alpha: 0.35, seed: 4700 + k, run: 0.5, hgt: 1.1, gmul: 1, taper: 0.7 });
  }
  const hd = f._head;
  if ((o.look || 0) > 0.2) {   // looking up: the line of the jaw and cheek catches the light
    out.push({ x: hd[0] + 0.039 * h, y: hd[1] + 0.012 * h, ang: Math.PI / 2 - 0.35, len: h * 0.048, wid: h * 0.012, c: hex('#c9a084'), c2: hex('#a8826a'), type: DAB, seed: 4730, hgt: 0.7, gmul: 1, alpha: 0.9 * smooth(prog(o.look, 0.2, 0.6)) });
  }
  return f;
}
const PALE = [...hex('#EDEBE6'), 0.5], PALE_FIG = [...hex('#EDEBE6'), 0.25];

const S16 = {
  id: 'S16', b0: 196, b1: 204,
  layers: () => [{ plate: 'hill', D: 2.5 }],
  draw(F, t) {
    const E = F.E, c = cam(720, 1280, 1);
    // the same strokes, grey and pale in turn every two beats; the caption band keeps still
    const pale = Math.floor((beatAt(t) - 196) / 2) % 2 === 1;
    const tint = pale ? PALE : null, tintEx = [600, 900];
    F.store.drawPlate('hill', { cam: c, t, grey: 1, tint, tintEx });
    const s = S();
    const wind = 0.4 + 0.35 * Math.sin(t * 3.7) + 0.15 * Math.sin(t * 7.1);
    // b199 the hand comes up; b200 the top button; the collar springs back
    const handUp = smooth(prog(t, B(199), B(199.8))) * (1 - smooth(prog(t, B(201), B(202))));
    const collar = t < B(200) ? 1.25 : 1 + 0.25 * (1 - spring(t, B(200), 0.3));
    heroTraveller(s, t, { hem: wind, armL: [lerp(0.1, 0.5, handUp), lerp(0.25, 2.3, handUp)], handL: handUp > 0.05, collarLift: collar });
    crow(s, { x: HILL.rock[0], y: HILL.rock[1] - 60, s: 46, pose: 'perch', dir: -1, head: 0.1, seed: 140, gmul: 1 });
    E.drawNow(s, { cam: c, t, grey: 1, tint: pale ? PALE_FIG : null, tintEx });
    return { amb: 0.86, dif: 0.3, spec: 0.16, vig: 0.22, light: [0.6, -0.55, 0.6] };
  },
};

const S17 = {
  id: 'S17', b0: 204, t1: 166.9,
  layers: () => [{ plate: 'hill', D: 4.2, sub: [360, 640, 1100, 2100] }],
  draw(F, t) { return drawS17(F, t, 0); },
};
function drawS17(F, t, dark) {
  const E = F.E;
  // from the boots up the body to the side of the face, easing to a stop at b208
  const up = easeInOut(prog(t, B(204), B(208)));
  const c = cam(720, lerp(1640, 1195, up), 2.3);
  F.store.drawPlate('hill', { cam: c, t, grey: 1, allowSoft: true });
  const s = S();
  const look = smooth(prog(t, B(208), B(208.6)));
  const wind = 0.3 + 0.25 * Math.sin(t * 3.7);
  heroTraveller(s, t, { hem: wind, look: look * 1.2 });
  crow(s, { x: HILL.rock[0] - 20, y: HILL.rock[1] - 60, s: 54, pose: 'perch', dir: -1, head: look, seed: 140, gmul: 1 });
  E.drawNow(s, { cam: c, t, grey: 1 });
  const side = look;
  return { amb: lerp(0.86 - 0.1 * side, 0.03, dark), dif: lerp(0.3 + 0.3 * side, 1.7, dark), spec: lerp(0.18, 0.5, dark), vig: 0.26 + 0.3 * dark, light: dark > 0 ? [0.96, -0.12, lerp(0.5, 0.06, dark)] : [lerp(0.6, 0.9, side), -0.5, lerp(0.6, 0.35, side)], c };
}

// ───────────────────────── the silence · 静默 ─────────────────────────
const S18 = {
  id: 'S18', t0: 166.9, t1: 168.4, clear: [0, 0, 0],
  layers: () => [{ plate: 'hill', D: 4.2, sub: [360, 640, 1100, 2100] }],
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
const sunRev = () => _sunRev || (_sunRev = [FIELD.gather[0], FIELD.gather[1], (B(224) - B(216)) / 1500]);
const S19 = {
  id: 'S19', t0: 168.4, b1: 216, clear: [0, 0, 0],
  layers: () => [{ plate: 'fieldSunrise', D: 2.5, revW: sunRev() }],
  draw(F, t) {
    const E = F.E, [gx, gy] = FIELD.gather;
    const z = lerp(1, 1.15, easeOut(prog(t, 168.4, 169.4)));
    const c = cam(gx, gy - 20 / z, z);
    // a ring of the field is scraped out of the dark around the stroke
    F.store.drawPlate('fieldSunrise', { cam: c, t, grey: 1, revW: sunRev(), wipeW: [gx, gy, (170.67 - 168.4) / 560, 1], wipe: [168.4, 0.3, 0.12] });
    const s = S();
    firstStroke(s, gx, gy, { scale: 1 / z });
    // crows in the field crouch, then all lift at 169.2
    for (let k = 0; k < 8; k++) {
      const [x0, y0] = fground(-2.6 + (k % 4) * 1.7 + (k > 3 ? 0.8 : 0), 9.5 + (k > 3 ? 2.5 : 0) + hash1(k) * 1.2);
      const sz = 24 * fH(10) / 220;
      if (t < 169.2) crow(s, { x: x0, y: y0, s: sz, pose: 'crouch', dir: k % 2 ? 1 : -1, seed: 160 + k, gmul: 1 });
      else { const a = t - 169.2; crow(s, { x: x0 + (k % 2 ? 1 : -1) * a * 120, y: y0 - a * 300 - a * a * 150, s: sz, pose: 'fly', flap: a * 2.6 + k * 0.2, dir: k % 2 ? 1 : -1, seed: 160 + k, tilt: -0.4 * (k % 2 ? 1 : -1), gmul: 1 }); }
    }
    E.drawNow(s, { cam: c, t, grey: 1 });
    return { amb: 0.1, dif: 1.25, spec: 0.35, vig: 0.4, light: [0.1, -0.95, 0.18], expo: 0.9, glow: [0.5, 0.51, 0.05, 6, 1, 0.7, 0.35] };
  },
};

// ───────────────────────── act seven · 极美 ─────────────────────────
const SUNRISE_PEOPLE = GATHER.map((g, i) => [g[2], g[3], g[5], i]);
const S20 = {
  id: 'S20', b0: 216, b1: 228, clear: [0, 0, 0],
  layers: () => [{ plate: 'fieldSunrise', D: 2.5, revW: sunRev() }],
  draw(F, t) {
    const E = F.E, [gx, gy] = FIELD.gather, T0 = B(216);
    const p = smooth(prog(t, T0, B(228)));
    const c = cam(gx, lerp(gy - 17, 1280, p), lerp(1.15, 1.06, p));
    const po = { cam: c, t, grey: 1, reveal: T0, revDur: 0.5, revW: sunRev() };
    if (t < T0 + 0.85) {
      // paint-over sweeping upward into the sunrise
      S19.draw(F, Math.min(t, T0 - 1e-3));
      const vb = F.store.viewBox(c), k = 0.8 / (vb[3] - vb[1]);
      F.store.drawLive('fieldSunrise', Object.assign({}, po, { appW: [0, -1, k, 2], appear: T0 + vb[3] * k - 0.05, appDur: 0.2, uAppW: [0, -1, k, 2], uAppear: T0 + vb[3] * k + 0.1, uAppDur: 0.25 }));
    } else F.store.drawPlate('fieldSunrise', po);
    const s = S();
    firstStroke(s, gx, gy, { scale: 0.9 });
    // everyone is here; the crows' feathers show ultramarine, violet and green in the low light
    const items = SUNRISE_PEOPLE.map(([X, z, col, i]) => { const [x, y] = fground(X * 1.4, z + 0.6); return { x, y, z, col, i }; }).sort((a, b) => b.z - a.z);
    for (const it of items) figure(s, { x: it.x, y: it.y, h: fH(it.z + 0.6), facing: 'back', coat: hex(it.col), seed: 60 + it.i, light: 1, gmul: 1, hem: 0.2 * Math.sin(t * 2 + it.i) });
    for (let k = 0; k < 6; k++) {
      const [x, y] = fground(-3.2 + k * 1.3, 8.6 + (k % 2) * 1.5);
      crow(s, { x, y, s: 24 * fH(9) / 220, pose: 'perch', dir: k % 2 ? 1 : -1, head: Math.sin(t * 2 + k) > 0.6 ? 0.4 : 0, seed: 170 + k, gmul: 1, sheen: 1 });
    }
    E.drawNow(s, { cam: c, t, grey: 1, reveal: T0, revDur: 0.5, revW: sunRev(), appear: t < T0 + 0.85 ? T0 + 0.6 : -1e6, appDur: 0.3 });
    // the sun's light starts at the horizon and climbs (b216 → b224)
    const lift = smooth(prog(t, T0, B(224)));
    return { amb: lerp(0.45, 0.86, lift), dif: lerp(0.9, 0.3, lift), spec: 0.24, vig: 0.16, warm: 0.5, light: [lerp(0.05, -0.35, lift), lerp(-0.95, -0.7, lift), lerp(0.14, 0.62, lift)] };
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
const S21 = {
  id: 'S21', b0: 228, b1: 244,
  layers: () => [{ plate: 'overGold', D: 2.1 }],
  draw(F, t) {
    const E = F.E, p = smooth(prog(t, B(228), B(244)));
    const c = cam(OVER.c[0], OVER.c[1], lerp(1.18, 1.0, p), lerp(0, Math.PI / 4, p));
    F.store.drawPlate('overGold', { cam: c, t, allowSoft: true });
    const s = S(), grow = prog(t, B(228), B(243));
    sunPattern(s, t, grow);
    // the walkers at the heads of the arms, leaving the gold behind them
    for (let a = 0; a < 8; a++) {
      const u = clamp01(grow * 1.05 - a * 0.012), r = lerp(980, 70, u), th = a * Math.PI / 4 + u * 2.2;
      const x = OVER.c[0] + Math.cos(th) * r, y = OVER.c[1] + Math.sin(th) * r;
      if (u < 0.98) topFigure(s, { x, y, s: 42, ang: th + Math.PI - 0.6, phase: beatAt(t) * 0.5 + a * 0.2, coat: hex(['#6a4a32', '#3e4a5a', '#5a3e2e', '#4a3a3e'][a % 4]), seed: 200 + a });
    }
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
    for (let a = 0; a < 8; a++) topFigure(s, { x: OVER.c[0] + Math.cos(a * 0.785 + 2.2) * 120, y: OVER.c[1] + Math.sin(a * 0.785 + 2.2) * 120, s: 42, ang: a * 0.785 + 2.2 + Math.PI, phase: 0, coat: hex(['#6a4a32', '#3e4a5a', '#5a3e2e', '#4a3a3e'][a % 4]), seed: 200 + a });
    circlingCrows(s, t, { n: 8 });
    firstStroke(s, OVER.c[0], OVER.c[1], { scale: 0.9 });
    // thrown wheat and confetti burst into scraped colour: b248, then higher and bigger at b250
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
  const E = F.E, p1 = F.store.plate('linen'), scr = cam(540, 960, 1);
  const frozen = t < B(255) + 0.5;
  if (frozen) { S22.draw(F, B(252) - 0.02); }
  const s = S();
  SCRAPES.forEach((b, i) => {
    const t0 = B(b);
    if (t < t0) return;
    const y0 = i * 480, y1 = y0 + 480, bx = lerp(1180, -100, easeInOut(clamp01((t - t0) / 0.38)));
    E.under(p1.tex, 1080, 1920, { cam: scr, rect: [0, 0, 1080, 1920], weave: 0.075, clip: [bx, y0 - (i === 0 ? 50 : 0), 1200, y1 + (i === 3 ? 50 : 0)] });
    for (let k = 0; k < 9; k++) {     // what the blade leaves behind
      if (hash1(k * 3 + i * 17) < 0.3) continue;
      const y = y0 + 30 + k * 50 + hash1(k + i) * 20, xa = Math.max(bx, 40 + hash1(k * 7 + i) * 300), xb = 1080 - hash1(k * 11 + i) * 280;
      if (xb > xa) s.push({ x: (xa + xb) / 2, y, ang: 0.01, len: xb - xa, wid: 8 + 10 * hash1(k * 5 + i), c: mixc(PAL.linen, [hex('#9A4E2A'), PAL.gold, hex('#3e4a5a')][k % 3], 0.3 + 0.2 * hash1(k)), type: KNIFE, alpha: 0.4, hgt: 0.3, run: 0.95, seed: 9300 + i * 20 + k, skew: 0.9 });
    }
    if (t < t0 + 0.45) s.push({ x: bx + 60, y: (y0 + y1) / 2 + 30, ang: 0.05, len: 140, wid: 560, c: hex('#4a3f34'), type: DAB, alpha: 0.14 * Math.sin(Math.PI * clamp01((t - t0) / 0.45)), hgt: 0, seed: 9390 + i });
  });
  if (!frozen) E.under(p1.tex, 1080, 1920, { cam: scr, rect: [0, 0, 1080, 1920], weave: 0.075 });
  firstStroke(s, 540, 980);
  E.drawNow(s, { cam: scr, t });
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
// actually behind the band in this frame (sRGB luma; the crossover sits where both colours hold equal contrast)
// lines that sit over a bright sky or field crossed by one dark shape (a trunk, the traveller's coat) stay dark
// for their whole length, with the light halo carrying them over the dark part, instead of fading through grey
const DARK_LINES = new Set(['T11', 'T12', 'T21']);
export function captionMode(c, t, luma) {
  if (DARK_LINES.has(c.id)) return 0;
  return smooth(prog(luma, 0.56, 0.44));
}
