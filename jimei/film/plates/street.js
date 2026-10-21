// street.js — P1 linen, P2 the street after the festival (+ P5 the sky above it), P3 the bench under the lamp.
// Colour versions are the moonlit night; most shots show them grey (grey: 1) and the moon re-lays them.
import { Ref } from '../../engine/plate.js';
import { KNIFE, DAB, LINE, hex, mixc } from '../../engine/impasto.js';
import { css, mixh, lerp2, catenary, facade, quadOn, towards, ellipsePts, blob } from './common.js';

const VP = [700, 1330];

// ── P1: the bare linen canvas (underpainting only) ──
export function plateLinen() {
  const ref = new Ref(1440, 2560);
  ref.fill({ rect: [0, 0, 1440, 2560] }, { rad: [720, 1250, 100, 720, 1250, 1500], stops: [[0, '#c2b8a6'], [1, '#ada290']] }, { maxR: 60 });
  return { ref, w: 1440, h: 2560, noStrokes: true };
}

// ── P2: the street ──
export function plateStreet() {
  const W = 1440, H = 2560, ref = new Ref(W, H);
  const moon = [1000, 380];
  const L = facade([0, 140], [0, 2200], VP), Rf = facade([1440, 60], [1440, 2260], VP);
  const dFar = 0.84;
  const sky = { rad: [moon[0], moon[1], 30, moon[0], moon[1], 1500], stops: [[0, '#6a79a3'], [0.12, '#45547f'], [0.4, '#2c3964'], [1, '#18214a']] };
  const toVP = towards(VP);
  // sky
  ref.fill({ rect: [0, 0, W, 1300] }, sky, { dir: 0.12, maxR: 50, group: 'sky', jit: 0.04, hgt: 0.7 });
  // clouds drifting under the moon
  for (const [cx, cy, rx, ry, s] of [[560, 300, 300, 46, 1], [1250, 610, 220, 36, 2], [300, 720, 180, 30, 3], [880, 160, 260, 34, 4]]) {
    ref.fill(ellipsePts(cx, cy, rx, ry, 30, -0.04, 0.18, s), mixh('#2a3660', '#4b5b88', 0.4), { dir: -0.04, maxR: 26, group: 'cloud' + s, jit: 0.05 });
    ref.fill(ellipsePts(cx + rx * 0.15, cy - ry * 0.35, rx * 0.6, ry * 0.4, 24, -0.04, 0.2, s + 9), '#5a6a96', { dir: -0.04, maxR: 14, group: 'cloud' + s });
  }
  ref.fill({ circle: [moon[0], moon[1], 120] }, { rad: [moon[0], moon[1], 50, moon[0], moon[1], 120], stops: [[0, '#8796bd'], [1, '#55648f']] }, { dir: 0.3, maxR: 18, group: 'halo' });
  ref.fill({ circle: [moon[0], moon[1], 48] }, { rad: [moon[0] - 12, moon[1] - 12, 4, moon[0], moon[1], 48], stops: [[0, '#f4f6f8'], [1, '#c9d3e2']] }, { dir: 0.4, maxR: 12, edge: 3, run: 0.1 });
  // far end of the street: low buildings, an arch, the lamp over the bench
  ref.fill([[560, 1060], [690, 1040], [700, 1000], [760, 1020], [850, 1060], [850, 1500], [560, 1500]], '#3f4a72', { dir: Math.PI / 2, maxR: 14, group: 'far' });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) ref.fill({ rect: [600 + i * 58, 1100 + j * 70, 22, 34] }, '#20284a', { maxR: 5, edge: 2 });
  ref.fill([[640, 1500], [640, 1390], [705, 1350], [770, 1390], [770, 1500]], '#141a33', { maxR: 8, group: 'arch' });
  ref.line([[742, 1500], [742, 1400]], 3, '#2a2f44', {});
  ref.fill({ circle: [742, 1396, 9] }, '#e8e2c8', { maxR: 4, edge: 2 });
  // left facade (moonlit)
  ref.fill([L(0, 0), L(dFar, 0), L(dFar, 1), L(0, 1)], { lin: [0, 0, 600, 0], stops: [[0, '#56627f'], [1, '#68749a']] }, { dir: toVP, maxR: (x, y) => 14 + 30 * (1 - x / 700), group: 'Lwall' });
  // right facade (in shadow)
  ref.fill([Rf(0, 0), Rf(dFar, 0), Rf(dFar, 1), Rf(0, 1)], { lin: [1440, 0, 800, 0], stops: [[0, '#28304e'], [1, '#3a4466']] }, { dir: toVP, maxR: (x, y) => 14 + 30 * ((x - 740) / 700), group: 'Rwall' });
  // cornices and string courses
  for (const f of [0.03, 0.4, 0.73]) {
    ref.fill([L(0, f), L(dFar, f), L(dFar, f + 0.018), L(0, f + 0.018)], '#7d8aa8', { dir: toVP, maxR: 8 });
    ref.fill([Rf(0, f), Rf(dFar, f), Rf(dFar, f + 0.018), Rf(0, f + 0.018)], '#3e4868', { dir: toVP, maxR: 8 });
  }
  // rooftop silhouettes: chimneys and a gable
  ref.fill([[1180, 140], [1180, 40], [1230, 40], [1230, 132]], '#232b48', { maxR: 10, group: 'Rwall' });
  ref.fill([[200, 270], [200, 190], [240, 190], [240, 276]], '#46516f', { maxR: 8, group: 'Lwall' });
  // windows: columns toward the VP, rows by height
  const cols = (d0, n, k) => { const out = []; let d = d0; for (let i = 0; i < n; i++) { out.push(d); d += k * (1 - d); } return out; };
  const warm = { d: 0.585, f: 0.105 };
  let warmPts = null;
  const windows = [];   // unlit windows: {q, c, side, row}
  for (const d of cols(0.06, 8, 0.2)) {
    const dw = 0.07 * (1 - d) * 0.9;
    for (const [f0, f1] of [[0.09, 0.2], [0.27, 0.37], [0.47, 0.6]]) {
      const isWarm = Math.abs(d - warm.d) < 0.04 && f0 === 0.09;
      const q = quadOn(L, d, d + dw, f0, f1);
      ref.fill(quadOn(L, d - dw * 0.12, d + dw * 1.12, f0 - 0.012, f1 + 0.012), '#8794b0', { dir: Math.PI / 2, maxR: 6, edge: 2 });
      if (isWarm) {
        warmPts = q;
        ref.fill(q, { lin: [q[0][0], q[0][1], q[2][0], q[2][1]], stops: [[0, '#F6C46A'], [0.5, '#F0A04B'], [1, '#E8892B']] }, { maxR: 10, gmul: 0, edge: 2, run: 0, group: 'warm' });
        const mx = (q[0][0] + q[1][0]) / 2;
        ref.line([[mx, (q[0][1] + q[1][1]) / 2], [mx, (q[2][1] + q[3][1]) / 2]], 3, '#3a2a1e', { gmul: 0 });
      } else { ref.fill(q, '#1d2540', { maxR: 8, edge: 2 }); windows.push({ q, c: [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2], side: -1, row: f0, d }); }
    }
    // ground floor: a shopfront and its awning
    const sw = 0.12 * (1 - d);
    if (d < 0.7) {
      ref.fill(quadOn(L, d, d + sw * 0.8, 0.79, 0.99), '#1a2038', { maxR: 10, edge: 2 });
      ref.fill([L(d - 0.01 * (1 - d), 0.77), L(d + sw * 0.85, 0.77), lerp2(L(d + sw * 0.85, 0.77), [L(d + sw * 0.85, 0.77)[0] + 60 * (1 - d), L(d + sw * 0.85, 0.77)[1] + 50 * (1 - d)], 1), lerp2(L(d - 0.01, 0.77), [L(d - 0.01, 0.77)[0] + 60 * (1 - d), L(d - 0.01, 0.77)[1] + 50 * (1 - d)], 1)], '#4c5774', { dir: toVP, maxR: 10 });
    }
  }
  for (const d of cols(0.04, 8, 0.2)) {
    const dw = 0.065 * (1 - d) * 0.9;
    for (const [f0, f1] of [[0.07, 0.18], [0.25, 0.35], [0.46, 0.58]]) {
      ref.fill(quadOn(Rf, d - dw * 0.1, d + dw * 1.1, f0 - 0.012, f1 + 0.012), '#3b4566', { dir: Math.PI / 2, maxR: 6, edge: 2 });
      const q = quadOn(Rf, d, d + dw, f0, f1);
      ref.fill(q, '#141a31', { maxR: 8, edge: 2 });
      windows.push({ q, c: [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2], side: 1, row: f0, d });
    }
    if (d < 0.7) ref.fill(quadOn(Rf, d, d + 0.11 * (1 - d), 0.8, 0.99), '#11162b', { maxR: 10, edge: 2 });
  }
  // the ground: sidewalks, road, joints, puddles
  const gTop = 1465;
  const gMaxR = (x, y) => 6 + 40 * Math.max(0, Math.min(1, (y - gTop) / 1000));
  ref.fill([L(0, 1), L(dFar, 1), Rf(dFar, 1), Rf(0, 1), [W, H], [0, H]], { lin: [0, gTop, 0, H], stops: [[0, '#3c4669'], [0.5, '#2f3958'], [1, '#262f4c']] }, { dir: 0, maxR: gMaxR, group: 'ground', edgeFollow: 0.3 });
  const curbL = [[300, H], lerp2([300, H], VP, 0.84)], curbR = [[1130, H], lerp2([1130, H], VP, 0.84)];
  ref.fill([L(0, 1), L(dFar, 1), curbL[1], curbL[0], [0, H]], { lin: [0, gTop, 0, H], stops: [[0, '#4a5577'], [1, '#353f5e']] }, { dir: 0, maxR: gMaxR, group: 'walkL' });
  ref.fill([Rf(0, 1), Rf(dFar, 1), curbR[1], curbR[0], [W, H]], { lin: [0, gTop, 0, H], stops: [[0, '#39425f'], [1, '#272f4a']] }, { dir: 0, maxR: gMaxR, group: 'walkR' });
  ref.line(curbL, 6, '#8592b0', { type: KNIFE, step: 18 });
  ref.line(curbR, 6, '#6a7798', { type: KNIFE, step: 18 });
  // flagstone joints
  for (let k = 1; k < 16; k++) {
    const y = gTop + (H - gTop) * Math.pow(k / 16, 1.7);
    const t = (y - VP[1]) / (H - VP[1]);
    ref.line([[VP[0] - (VP[0] - 300) * t * 1.02, y], [VP[0] + (1130 - VP[0]) * t * 1.02, y]], 1.5 + 3.5 * t, '#272f4c', { step: 10 + 20 * t, type: KNIFE, run: 0.7 });
  }
  for (const xn of [420, 560, 700, 840, 980]) ref.line([[xn, H], lerp2([xn, H], VP, 0.84)], 3, '#283050', { step: 22, type: KNIFE, run: 0.7 });
  // puddles (mirrors of the sky)
  const puddles = [[620, 1980, 210, 34], [930, 2260, 260, 44], [470, 2420, 200, 40], [760, 1690, 120, 16], [1010, 1820, 110, 18], [470, 1720, 120, 20]];
  puddles.forEach(([cx, cy, rx, ry], i) => {
    ref.fill(ellipsePts(cx, cy, rx, ry, 30, 0, 0.2, i), { lin: [0, cy - ry, 0, cy + ry], stops: [[0, '#5b6c97'], [1, '#3e4c76']] }, { dir: 0, maxR: Math.max(6, ry * 0.6), edge: 3, wet: 0.8, run: 0.2 });
  });
  // the warm window's reflection: short horizontal dabs, broken and fading
  const wc = warmPts ? [(warmPts[0][0] + warmPts[2][0]) / 2, (warmPts[0][1] + warmPts[2][1]) / 2] : [430, 980];
  for (let k = 0; k < 7; k++) {
    const y = 1708 + k * 6, fade = 1 - k / 8;
    ref.extra.push({ x: 470 + Math.sin(k * 2.1) * 10, y, ang: 0.02, len: (40 - k * 3) * (0.75 + 0.25 * Math.sin(k)), wid: 5, c: mixc(hex('#F0A04B'), hex('#5b6c97'), 0.2 + k * 0.07), type: DAB, gmul: 0, alpha: fade, seed: 3300 + k, hgt: 0.5, wet: 1 });
  }
  // wires and festival strings
  const wire = catenary(L(0.2, 0.36), Rf(0.2, 0.36), 38, 40);
  ref.line(wire, 2.4, '#141826', {});
  ref.line(catenary(L(0.42, 0.33), Rf(0.42, 0.33), 22, 30), 1.6, '#1b2032', {});
  const strings = [0.08, 0.25, 0.41, 0.56].map((d, i) => catenary(L(d, 0.47 + i * 0.035), Rf(d, 0.47 + i * 0.035), 150 * (1 - d), 22 - i * 3));
  for (const s of strings) ref.line(s, 1.8, '#252b3e', {});
  // bunting left over from the festival
  strings.slice(0, 2).forEach((s, si) => {
    for (let i = 2; i < s.length - 2; i += 2) {
      const [x, y] = s[i], sz = 26 * (1 - si * 0.35);
      ref.fill([[x - sz * 0.45, y], [x + sz * 0.45, y + 2], [x + sz * 0.05, y + sz * 1.05]], si ? '#6c7896' : '#8a96b2', { maxR: 6, edge: 2, group: 'flag' });
    }
  });
  return { ref, w: W, h: H, VP, moon, warm: wc, warmQuad: warmPts, wire, strings, L, Rf, puddles, gTop, windows, R: [56, 34, 20, 12, 7, 4] };
}

// ── P5: the night sky above the street (world y −1900…0, continuous with P2's sky) ──
export function plateSky() {
  const W = 1440, H = 1900, ref = new Ref(W, H);
  const moon = [1000, 380 + H];   // P2's moon in this plate's coordinates
  ref.fill({ rect: [0, 0, W, H] }, { rad: [moon[0], moon[1], 30, moon[0], moon[1], 1500], stops: [[0, '#6a79a3'], [0.12, '#45547f'], [0.4, '#2c3964'], [1, '#18214a']] }, { dir: 0.12, maxR: 56, group: 'sky', jit: 0.04 });
  ref.tint({ rect: [0, 0, W, 900] }, { lin: [0, 0, 0, 900], stops: [[0, 'rgba(10,14,38,0.55)'], [1, 'rgba(10,14,38,0)']] });
  for (const [cx, cy, rx, ry, s] of [[400, 1500, 340, 50, 11], [1100, 1100, 280, 40, 12], [600, 700, 360, 44, 13], [1150, 380, 260, 36, 14], [300, 260, 240, 30, 15]]) {
    ref.fill(ellipsePts(cx, cy, rx, ry, 30, -0.03, 0.2, s), mixh('#232e57', '#3f4f7e', 0.45), { dir: -0.03, maxR: 26, group: 'cloud' + s, jit: 0.05 });
    ref.fill(ellipsePts(cx - rx * 0.1, cy - ry * 0.3, rx * 0.55, ry * 0.38, 24, -0.03, 0.2, s + 5), '#4f5f8e', { dir: -0.03, maxR: 12, group: 'cloud' + s });
  }
  for (let k = 0; k < 70; k++) {
    const x = (Math.sin(k * 12.9898) * 43758.5453 % 1 + 1) % 1 * W, y = (Math.sin(k * 78.233) * 12345.678 % 1 + 1) % 1 * 1300;
    ref.extra.push({ x, y, ang: 0, len: 5 + (k % 3) * 2, wid: 5 + (k % 3) * 2, c: hex(k % 4 ? '#c9d2e6' : '#f1ecd8'), type: DAB, seed: 4100 + k, hgt: 0.5, alpha: 0.7 + 0.3 * (k % 2) });
  }
  return { ref, w: W, h: H, y0: -H, R: [56, 34, 20, 12, 7] };
}

// ── P3: the bench under the street lamp, at the end of the street ──
// framed with cam y ≈ 1600: screen y = plate y − 640; the caption band (screen 300–560) is flat wall.
export function plateBench() {
  const W = 1440, H = 2560, ref = new Ref(W, H);
  const hz = 1640;   // where the far facades meet the ground
  ref.fill({ rect: [0, 0, W, 1000] }, { lin: [0, 0, 0, 1000], stops: [[0, '#151d40'], [1, '#2e3a62']] }, { dir: 0.1, maxR: 56, group: 'sky' });
  // far facades across the square
  const fac = [[0, 760, 300], [300, 820, 330], [630, 720, 280], [910, 790, 300], [1210, 740, 230]];
  fac.forEach(([x, top, w], i) => {
    const base = i % 2 ? '#3a4568' : '#46527a';
    ref.fill([[x, top], [x + w, top], [x + w, hz], [x, hz]], base, { dir: Math.PI / 2, maxR: 30, group: 'fac' + i });
    ref.fill([[x, top], [x + w, top], [x + w, top + 22], [x, top + 22]], i % 2 ? '#56628a' : '#6a77a0', { dir: 0, maxR: 8 });
  });
  const windows = [];
  fac.forEach(([x, top, w], i) => {
    const n = Math.max(2, Math.floor(w / 92));
    for (let r = 0; r < 2; r++) for (let c = 0; c < n; c++) {
      const wx = x + 30 + c * (w - 50) / n, wy = 1225 + r * 150;
      ref.fill({ rect: [wx - 4, wy - 4, 44, 98] }, '#7884a4', { maxR: 6, edge: 2 });
      ref.fill({ rect: [wx, wy, 36, 90] }, '#1a2140', { maxR: 6, edge: 2 });
      windows.push([wx + 18, wy + 45, 36, 90]);
    }
    ref.fill([[x + w * 0.3, hz], [x + w * 0.3, hz - 110], [x + w * 0.62, hz - 110], [x + w * 0.62, hz]], '#141a33', { maxR: 8, edge: 2 });
  });
  // ground: wet cobbles toward the viewer
  ref.fill([[0, hz], [W, hz], [W, H], [0, H]], { lin: [0, hz, 0, H], stops: [[0, '#3b4569'], [0.4, '#2f3858'], [1, '#232b47']] }, { dir: 0, maxR: (x, y) => 8 + 40 * Math.max(0, Math.min(1, (y - hz) / 900)), group: 'ground' });
  for (let k = 1; k < 12; k++) {
    const y = hz + (H - hz) * Math.pow(k / 12, 1.6);
    ref.line([[0, y], [W, y + Math.sin(k) * 6]], 1.2 + 3 * (y - hz) / (H - hz), '#1c2340', { step: 12 + 22 * (y - hz) / (H - hz) });
  }
  // puddles by the bench
  ref.fill(ellipsePts(820, 2330, 260, 46, 30, 0.02, 0.18, 3), { lin: [0, 2290, 0, 2380], stops: [[0, '#6c7ca6'], [1, '#43527c']] }, { dir: 0, maxR: 16, edge: 3, wet: 0.9 });
  ref.fill(ellipsePts(240, 2470, 170, 34, 26, 0, 0.2, 5), '#4d5c86', { dir: 0, maxR: 14, edge: 3, wet: 0.9 });
  // the lamp post and its head
  const lamp = [380, 1250];
  ref.fill([[364, 2160], [364, 1300], [396, 1300], [396, 2160]], { lin: [364, 0, 396, 0], stops: [[0, '#2b3044'], [0.5, '#4a5270'], [1, '#22263a']] }, { dir: Math.PI / 2, maxR: 8, edge: 3, run: 0, group: 'post' });
  ref.fill([[344, 2170], [416, 2170], [406, 2120], [354, 2120]], '#262b3e', { maxR: 8, group: 'post' });
  ref.fill([[336, 1306], [424, 1306], [442, 1258], [318, 1258]], '#252a3c', { maxR: 6, edge: 2, group: 'lampcap' });
  ref.fill([[340, 1258], [420, 1258], [406, 1200], [354, 1200]], { lin: [0, 1200, 0, 1258], stops: [[0, '#cfc8ae'], [1, '#f0ead6']] }, { maxR: 8, edge: 2, group: 'lamp' });
  ref.fill([[346, 1202], [414, 1202], [380, 1176]], '#1f2333', { maxR: 6, edge: 2, group: 'lampcap' });
  ref.tint(ellipsePts(560, 2190, 460, 100, 30), { rad: [560, 2190, 10, 560, 2190, 460], stops: [[0, 'rgba(160,170,200,0.45)'], [1, 'rgba(160,170,200,0)']] });
  // the bench: seat, back rails, legs
  const bx0 = 480, bx1 = 1000, seatY = 2030;
  ref.fill([[bx0, seatY - 16], [bx1, seatY - 16], [bx1 + 12, seatY + 10], [bx0 - 12, seatY + 10]], '#5a4a3c', { dir: 0, maxR: 8, edge: 2, run: 0, group: 'bench' });
  ref.fill([[bx0 + 10, seatY - 150], [bx1 - 10, seatY - 150], [bx1 - 10, seatY - 114], [bx0 + 10, seatY - 114]], '#4e4034', { dir: 0, maxR: 8, edge: 2, run: 0, group: 'bench' });
  ref.fill([[bx0 + 10, seatY - 94], [bx1 - 10, seatY - 94], [bx1 - 10, seatY - 62], [bx0 + 10, seatY - 62]], '#4e4034', { dir: 0, maxR: 8, edge: 2, run: 0, group: 'bench' });
  for (const lx of [bx0 + 28, bx1 - 28]) {
    ref.fill([[lx - 8, seatY - 160], [lx + 8, seatY - 160], [lx + 8, seatY + 112], [lx - 8, seatY + 112]], '#1c1d26', { dir: Math.PI / 2, maxR: 5, edge: 2, run: 0, group: 'benchleg' });
  }
  ref.extra.push({ x: 740, y: seatY + 120, ang: 0, len: 600, wid: 22, c: hex('#181d30'), type: DAB, seed: 3401, hgt: 0.2, alpha: 0.55 });
  // wire from the lamp post to the right edge, for the crows
  const wire = catenary([396, 1320], [1440, 1270], 60, 30);
  ref.line(wire, 2.4, '#141826', {});
  ref.line(catenary([0, 1340], [364, 1325], 24, 14), 2.2, '#141826', {});
  return { ref, w: W, h: H, lamp, wire, windows, seatY, bench: [bx0, bx1], hz, R: [56, 34, 20, 12, 7, 4] };
}
