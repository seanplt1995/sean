// c.js — style C「海与山」: a cliff village over the sea at sunset (C1) and an alpine lake at alpenglow (C2).
import { Ref } from '../../engine/plate.js';
import { hex, DAB } from '../../engine/impasto.js';
import { crow } from '../actors.js';
import { star, reflect, rnd, pick, mixh, ellipsePts, blob } from './lib.js';

const W = 1080, H = 1920;

// ── C1: the cliff village — pastel houses climbing the rock, a majolica dome, a lighthouse, boats in the harbour ──
export function c1() {
  const ref = new Ref(W, H), hz = 900, sun = [800, 878];
  ref.fill({ rect: [0, 0, W, hz + 4] }, { lin: [0, 0, 0, hz], stops: [[0, '#2e3478'], [0.35, '#7a4a8a'], [0.62, '#d8708a'], [0.85, '#f6a868'], [1, '#fbd090']] }, { dir: 0.02, maxR: 34, group: 'sky', jit: 0.04 });
  for (const [cx, cy, rx, ry, sd, c] of [[300, 260, 340, 18, 1, '#e88aa0'], [760, 380, 300, 14, 2, '#f8b090'], [520, 560, 380, 16, 3, '#ffc890'], [160, 700, 260, 12, 4, '#ffd8a0'], [900, 640, 220, 10, 5, '#ffe0a8']]) ref.fill(ellipsePts(cx, cy, rx, ry, 28, 0.02, 0.25, sd), c, { dir: 0.02, maxR: 8, group: 'cloud' + sd });
  for (let k = 5; k >= 1; k--) ref.tint({ circle: [...sun, 40 + k * 34] }, '#fff0c0', 0.13);
  ref.fill({ circle: [...sun, 46] }, { rad: [sun[0], sun[1] - 10, 4, ...sun, 46], stops: [[0, '#fffbe8'], [1, '#ffc860']] }, { maxR: 8, edge: 2, group: 'sun', gmul: 0 });
  // the sea, deep blue to turquoise near the rocks, with the sun's road on it
  ref.fill({ rect: [0, hz, W, H - hz] }, { lin: [0, hz, 0, H], stops: [[0, '#4a5a9a'], [0.3, '#2a6a9a'], [0.7, '#1a7a9a'], [1, '#2a9aa0']] }, { dir: 0, maxR: 18, group: 'sea', aj: 0.05, len: [2.4, 4], wid: [0.6, 0.9] });
  reflect(ref, sun[0], hz + 2, 1700, 90, 'rgba(255,214,140,1)', 0.75, 4);
  reflect(ref, sun[0] - 30, hz + 40, 1500, 160, 'rgba(240,140,140,1)', 0.25, 9);
  // the headland with the lighthouse
  ref.fill([[900, hz + 10], [940, 872], [990, 852], [1040, 836], [1080, 830], [1080, 990], [900, 960]], { lin: [0, 820, 0, 990], stops: [[0, '#6a4a5a'], [1, '#2a2a40']] }, { dir: 0.2, maxR: 10, group: 'head' });
  ref.fill([[1002, 846], [1028, 846], [1022, 712], [1008, 712]], '#f2ece6', { maxR: 4, edge: 1.2, group: 'lh' });
  for (const y of [802, 756]) ref.fill([[1005, y], [1025, y], [1024, y - 14], [1006, y - 14]], '#c83a3a', { maxR: 2.6, edge: 1, group: 'lhb' });
  ref.fill({ rect: [1004, 690, 22, 22] }, '#fff4c0', { maxR: 2.6, edge: 1, group: 'lamp', gmul: 0 });
  ref.fill([[1000, 690], [1030, 690], [1015, 674]], '#3a2a3a', { maxR: 2.6, edge: 1, group: 'lhc' });
  ref.tint([[1015, 701], [640, 610], [640, 670]], '#fff0c0', 0.22);
  // the cliff the village climbs: ochre rock falling to the sea
  ref.fill([[0, 640], [180, 620], [420, 700], [620, 820], [760, 1000], [820, 1240], [860, 1500], [900, 1640], [0, 1640]], { lin: [0, 640, 0, 1640], stops: [[0, '#b07a5a'], [1, '#6a4a3a']] }, { dir: 1.2, maxR: 16, group: 'cliff' });
  const rr = rnd(5);
  for (let i = 0; i < 40; i++) { const x = 600 + rr() * 300, y = 900 + rr() * 700; ref.tint([[x, y], [x + 30 + rr() * 40, y + 10], [x + 20, y + 40 + rr() * 30]], rr() < 0.5 ? '#d8a07a' : '#4a3028', 0.4); }
  // the houses, row by row from the top (far) to the harbour (near)
  const PAL = ['#f4c8a8', '#f8e4a8', '#eaa08a', '#f8f2e4', '#c8dcec', '#f2b8c2', '#ecc47c', '#f6d6c0'];
  const SH = ['#2e7a6a', '#3a6aa0', '#2e8a8a', '#5a8a3a'];
  const hr = rnd(13);
  const house = (x, y, w, h, flat) => {
    const col = pick(hr, PAL);
    ref.fill({ rect: [x, y - h, w, h] }, { lin: [x, 0, x + w, 0], stops: [[0, mixh(col, '#ffe8c8', 0.35)], [1, mixh(col, '#7a5a8a', 0.25)]] }, { dir: Math.PI / 2, maxR: 8, edge: 1.5, group: 'h' });
    if (flat) { ref.fill({ rect: [x - 3, y - h - 8, w + 6, 9] }, mixh(col, '#ffffff', 0.4), { maxR: 3, edge: 1, group: 'par' }); }
    else { ref.fill([[x - 8, y - h + 2], [x + w + 8, y - h + 2], [x + w / 2, y - h - 22 - w * 0.08]], { lin: [x, 0, x + w, 0], stops: [[0, '#e07a4a'], [1, '#a8442e']] }, { maxR: 4, edge: 1.2, group: 'roof' }); for (let q = x - 4; q < x + w + 4; q += 7) ref.tint([[q, y - h + 2], [q + 3, y - h + 2], [x + w / 2 + (q - x - w / 2) * 0.2, y - h - 14]], '#7a2a1a', 0.3); }
    const floors = Math.max(1, Math.round(h / 44)), nw = Math.max(1, Math.round(w / 38));
    for (let f = 0; f < floors; f++) for (let k = 0; k < nw; k++) {
      const wx = x + (k + 0.5) * w / nw - 6, wy = y - h + 12 + f * 44, lit = hr() < 0.35;
      if (wy + 18 > y - 4) continue;
      ref.fill({ rect: [wx, wy, 12, 18] }, lit ? '#ffd27a' : '#3a3a5a', { maxR: 2.6, edge: 1, group: lit ? 'wl' : 'wd', gmul: lit ? 0 : 1 });
      if (hr() < 0.7) { const sc = pick(hr, SH); ref.fill({ rect: [wx - 7, wy, 6, 18] }, sc, { maxR: 2.6, edge: 1, group: 'sh' }); ref.fill({ rect: [wx + 13, wy, 6, 18] }, sc, { maxR: 2.6, edge: 1, group: 'sh' }); }
    }
    if (hr() < 0.45) {   // bougainvillea pouring down a corner
      const bx = hr() < 0.5 ? x + 6 : x + w - 6, n = 10 + (hr() * 10 | 0);
      for (let j = 0; j < n; j++) ref.fill({ circle: [bx + (hr() - 0.5) * 34, y - h + 10 + hr() * h * 0.9, 5 + hr() * 6] }, pick(hr, ['#d8287a', '#e8489a', '#c81e6a', '#f070b0']), { maxR: 3, edge: 1, group: 'bg', gmul: 0 });
      for (let j = 0; j < 5; j++) ref.fill({ circle: [bx + (hr() - 0.5) * 30, y - h + 10 + hr() * h * 0.9, 4] }, '#3a6a32', { maxR: 2.6, edge: 1, group: 'bgl' });
    }
  };
  const tree = (x, y, r, lemon) => { ref.fill(blob(ellipsePts(x, y - r, r, r * 0.85, 9, 0, 0.3, x)), { rad: [x - r * 0.3, y - r * 1.3, 2, x, y - r, r], stops: [[0, '#6a9a4a'], [1, '#2a4a2a']] }, { maxR: 5, group: 'tree', type: DAB }); if (lemon) for (let j = 0; j < 8; j++) ref.fill({ circle: [x + (hr() - 0.5) * r * 1.4, y - r + (hr() - 0.5) * r, 3.5] }, '#f8e040', { maxR: 2.6, edge: 1, group: 'lemon', gmul: 0 }); };
  for (let k = 0; k < 11; k++) {
    const y = 700 + k * 86, xEnd = 300 + k * 46 + (k > 6 ? 40 : 0);
    let x = -20 + (k % 2) * 30;
    while (x < xEnd) {
      const w = 64 + hr() * 70, h = 60 + hr() * 70 + (k > 7 ? 20 : 0);
      if (!(k === 1 && x > 180 && x < 420)) house(x, y + hr() * 10, w, h, hr() < 0.45);
      if (hr() < 0.25) tree(x + w + 8, y + 6, 18 + hr() * 10, hr() < 0.6);
      x += w + 4 + hr() * 14;
    }
  }
  // the church near the top: a majolica dome of green and gold tiles, a bell tower
  { const cx = 300, cy = 790;
    ref.fill({ rect: [cx - 90, cy - 120, 180, 120] }, { lin: [cx - 90, 0, cx + 90, 0], stops: [[0, '#fbf2dc'], [1, '#d8c0a8']] }, { maxR: 8, edge: 1.5, group: 'ch' });
    ref.fill([[cx - 30, cy], [cx + 30, cy], [cx + 30, cy - 50], [cx, cy - 70], [cx - 30, cy - 50]], '#5a3a2a', { maxR: 4, edge: 1.2, group: 'chd' });
    ref.fill({ circle: [cx, cy - 92, 14] }, '#f6c070', { maxR: 3, edge: 1, group: 'chr', gmul: 0 });
    ref.fill({ rect: [cx - 56, cy - 170, 112, 50] }, '#f2e6d0', { maxR: 5, edge: 1.2, group: 'drum' });
    for (let k = 0; k < 5; k++) ref.fill({ rect: [cx - 44 + k * 21, cy - 160, 8, 24] }, '#3a3a5a', { maxR: 2.6, edge: 1, group: 'drumw' });
    const dome = []; for (let k = 0; k <= 20; k++) { const a = Math.PI + k / 20 * Math.PI; dome.push([cx + Math.cos(a) * 62, cy - 170 + Math.sin(a) * 74]); }
    ref.fill(dome, { rad: [cx - 20, cy - 220, 6, cx, cy - 190, 80], stops: [[0, '#8ad0a0'], [0.5, '#2e9a72'], [1, '#1a5a5a']] }, { maxR: 6, edge: 1.5, group: 'dome', dir: 'edge' });
    for (let k = -3; k <= 3; k++) { const pts = []; for (let j = 0; j <= 12; j++) { const t = j / 12, a = Math.PI + (0.5 + k * 0.13) * Math.PI; pts.push([cx + Math.cos(Math.PI + (0.5 + k * 0.13 * (1 - t)) * Math.PI) * 62 * Math.sin(t * Math.PI / 2 + 0.0001) , cy - 170 - 74 * Math.sin(t * Math.PI / 2)]); } }
    for (let j = 0; j < 60; j++) { const a = Math.PI + hr() * Math.PI, r = hr(), px = cx + Math.cos(a) * 62 * r, py = cy - 170 + Math.sin(a) * 74 * r; ref.tint([[px, py - 5], [px + 5, py], [px, py + 5], [px - 5, py]], hr() < 0.5 ? '#f6d040' : '#1a4a8a', 0.75); }
    ref.fill({ rect: [cx - 9, cy - 262, 18, 22] }, '#f2e6d0', { maxR: 2.6, edge: 1, group: 'lant' });
    ref.line([[cx, cy - 262], [cx, cy - 292]], 3, '#3a2a2a', { type: 3 }); ref.line([[cx - 9, cy - 282], [cx + 9, cy - 282]], 3, '#3a2a2a', { type: 3 });
    ref.fill({ rect: [cx + 96, cy - 230, 56, 230] }, { lin: [cx + 96, 0, cx + 152, 0], stops: [[0, '#fbf0d8'], [1, '#cdb49a']] }, { maxR: 6, edge: 1.5, group: 'bell' });
    ref.fill([[cx + 108, cy - 196], [cx + 140, cy - 196], [cx + 140, cy - 168], [cx + 124, cy - 160], [cx + 108, cy - 168]].map(([x, y]) => [x, y]), '#2a2a44', { maxR: 2.6, edge: 1, group: 'belfry' });
    const bd = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI; bd.push([cx + 124 + Math.cos(a) * 30, cy - 230 + Math.sin(a) * 30]); }
    ref.fill(bd, '#d8b040', { maxR: 4, edge: 1.2, group: 'bdome', dir: 'edge' }); }
  // the harbour: a stone quay, a lamp, boats and their reflections
  ref.fill([[0, 1640], [900, 1640], [920, 1700], [0, 1700]], { lin: [0, 1640, 0, 1700], stops: [[0, '#d8c0a0'], [1, '#8a7060']] }, { dir: 0, maxR: 8, group: 'quay' });
  for (let x = 10; x < 900; x += 60) ref.tint({ rect: [x, 1642, 3, 56] }, '#5a4a40', 0.5);
  ref.fill({ rect: [0, 1700, 920, H - 1700] }, { lin: [0, 1700, 0, H], stops: [[0, '#1a6a8a'], [1, '#2a8a98']] }, { dir: 0, maxR: 12, group: 'harb', len: [2.4, 4], wid: [0.6, 0.9] });
  const br = rnd(19);
  for (const [x, y, w, hull, band] of [[80, 1790, 190, '#f2f2ec', '#2a5aa8'], [330, 1760, 150, '#2a6ab0', '#f2d040'], [520, 1820, 210, '#c83a2e', '#f2f2ec'], [760, 1770, 140, '#f8d050', '#2a8a7a']]) {
    ref.fill([[x, y], [x + w, y - 6], [x + w * 0.88, y + 34], [x + w * 0.12, y + 36]], hull, { maxR: 5, edge: 1.5, group: 'boat' });
    ref.fill([[x + 4, y + 2], [x + w - 4, y - 4], [x + w * 0.98, y + 8], [x + 6, y + 10]], band, { maxR: 3, edge: 1, group: 'band' });
    ref.line([[x + w * 0.45, y - 2], [x + w * 0.45, y - 90 - br() * 30]], 3, '#3a2a20', { type: 3 });
    reflect(ref, x + w / 2, y + 40, y + 120, w * 0.8, hull, 0.4, x);
  }
  { ref.line([[640, 1640], [640, 1520]], 6, '#2a2a30', { area: true, group: 'post' }); ref.fill({ rect: [628, 1490, 24, 32] }, '#fff0c0', { maxR: 3, edge: 1, group: 'qlamp', gmul: 0 }); ref.fill([[624, 1490], [656, 1490], [640, 1474]], '#2a2a30', { maxR: 2.6, edge: 1, group: 'qcap' }); reflect(ref, 640, 1704, 1900, 30, 'rgba(255,220,140,1)', 0.6, 3); }
  return {
    ref, clear: hex('#2a6a9a'),
    extra: (s) => {
      crow(s, { x: 405, y: 557, s: 20, pose: 'perch', dir: -1, seed: 11, gmul: 1 });
      const cr = rnd(70);
      for (let i = 0; i < 4; i++) crow(s, { x: 620 + i * 60 + cr() * 20, y: 560 + Math.sin(i * 2) * 30, s: 16 + cr() * 6, pose: 'fly', flap: cr(), dir: 1, seed: 80 + i, gmul: 1 });
    },
    post: { amb: 0.82, dif: 0.3, spec: 0.22, vig: 0.22, sat: 1.06, warm: 0.04, light: [0.7, -0.35, 0.6] },
  };
}

// ── C2: an alpine lake at alpenglow — snow peaks burning pink, fir forests, a white chapel on the shore, a meadow of flowers ──
export function c2() {
  const ref = new Ref(W, H), lake = 1180;
  ref.fill({ rect: [0, 0, W, lake] }, { lin: [0, 0, 0, 900], stops: [[0, '#1e2a5a'], [0.45, '#4a4a8a'], [0.8, '#c87a9a'], [1, '#f2b090']] }, { dir: 0.02, maxR: 34, group: 'sky', jit: 0.04 });
  const sr = rnd(2);
  for (let i = 0; i < 30; i++) ref.fill({ circle: [sr() * W, sr() * 380, 1.5 + sr() * 2.2] }, '#f4f0dc', { maxR: 2.6, edge: 1, group: 'stars', gmul: 0 });
  star(ref, 200, 150, 6, { group: 'vesper' });
  // peaks: violet rock, snowfields, the west faces burning pink; each peak is a few planes
  const peaks = [
    { o: [[-40, 1000], [60, 760], [120, 640], [170, 700], [260, 1000]], lit: [[120, 640], [170, 700], [200, 820], [150, 840]], snow: [[120, 640], [150, 680], [130, 720], [104, 690]] },
    { o: [[40, 1000], [200, 640], [320, 420], [370, 470], [410, 520], [470, 470], [560, 640], [700, 1000]], lit: [[320, 420], [370, 470], [410, 520], [470, 470], [520, 590], [470, 700], [420, 760], [380, 660], [340, 540]], snow: [[320, 420], [370, 470], [400, 510], [360, 560], [330, 520], [300, 470]] },
    { o: [[380, 1000], [520, 560], [640, 300], [700, 380], [760, 470], [820, 430], [920, 620], [1080, 880], [1080, 1000]], lit: [[640, 300], [700, 380], [760, 470], [820, 430], [880, 560], [820, 650], [760, 720], [720, 620], [680, 470]], snow: [[640, 300], [700, 380], [740, 450], [700, 470], [660, 420], [620, 380], [600, 360]] },
  ];
  peaks.forEach((pk, i) => {
    ref.fill(pk.o, { lin: [0, 300, 0, 1000], stops: [[0, '#6a6aa0'], [1, '#3e4478']] }, { dir: Math.PI / 2 + 0.4, maxR: 12, group: 'p' + i });
    ref.tint(pk.lit, { lin: [0, 300, 0, 860], stops: [[0, '#ffe0c8'], [0.45, '#f6a8a8'], [1, '#c088a8']] }, 0.95);
    ref.tint(pk.snow, '#f6eef4', 0.85);
  });
  // ridges and gullies: thin dark and light seams down the faces
  const gr = rnd(31);
  for (let i = 0; i < 26; i++) { const x = 160 + gr() * 820, y = 420 + gr() * 300, l = 80 + gr() * 160, a = Math.PI / 2 + (gr() - 0.5) * 1.1; ref.tint([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l], [x + Math.cos(a) * l + 6, y + Math.sin(a) * l], [x + 4, y]], gr() < 0.5 ? '#2e3060' : '#e8d8ec', gr() < 0.5 ? 0.45 : 0.5); }
  // the forested slopes: rows of dark firs
  ref.fill([[0, 900], [200, 860], [420, 920], [640, 880], [880, 900], [1080, 860], [1080, lake + 10], [0, lake + 10]], { lin: [0, 860, 0, lake], stops: [[0, '#2a4a4a'], [1, '#1a3036']] }, { dir: Math.PI / 2, maxR: 12, group: 'forest' });
  const fr = rnd(7);
  for (let i = 0; i < 160; i++) { const x = fr() * W, y = 880 + fr() * 280, h = 26 + (y - 880) * 0.18 + fr() * 14; ref.fill([[x, y - h], [x + h * 0.28, y], [x - h * 0.28, y]], fr() < 0.15 ? '#b88a3a' : pick(fr, ['#1e3a34', '#28463c', '#162c2a', '#34503e']), { maxR: 4, edge: 1.2, group: 'fir', dir: Math.PI / 2 }); }
  // the lake: the mountains again, upside down, softer
  ref.fill({ rect: [0, lake, W, 400] }, { lin: [0, lake, 0, lake + 400], stops: [[0, '#d0909a'], [0.25, '#7a6a98'], [0.6, '#3a4a78'], [1, '#2a3a5a']] }, { dir: 0, maxR: 16, group: 'lake', len: [2.6, 4.4], wid: [0.55, 0.85] });
  // the mountains mirrored: same shapes upside down about the waterline (the far shore sits at y 1000)
  const mir = (pts) => pts.map(([x, y]) => [x, lake + (1000 - y) * 0.42]);
  peaks.forEach((pk) => { ref.tint(mir(pk.o), '#3e4478', 0.55); ref.tint(mir(pk.lit), '#e89aa8', 0.5); ref.tint(mir(pk.snow), '#f0e4ee', 0.45); });
  ref.tint({ rect: [0, lake, W, 30] }, '#1a3036', 0.5);
  for (let y = lake + 8; y < lake + 380; y += 9) ref.tint({ rect: [0, y, W, 2] }, '#ffffff', 0.08);
  // the chapel on a little point: white walls, a red onion dome, one warm window
  ref.fill(blob([[560, lake + 30], [640, lake - 10], [800, lake - 6], [880, lake + 30], [760, lake + 46], [600, lake + 46]]), '#3a5a3a', { dir: 0, maxR: 6, group: 'point' });
  { const cx = 720, cy = lake + 8;
    ref.fill({ rect: [cx - 46, cy - 70, 92, 70] }, { lin: [cx - 46, 0, cx + 46, 0], stops: [[0, '#fbf6ee'], [1, '#c8c0c8']] }, { maxR: 5, edge: 1.2, group: 'chap' });
    ref.fill([[cx - 54, cy - 68], [cx + 54, cy - 68], [cx, cy - 104]], '#5a3a3a', { maxR: 4, edge: 1.2, group: 'chapR' });
    ref.fill({ rect: [cx + 30, cy - 150, 30, 150] }, { lin: [cx + 30, 0, cx + 60, 0], stops: [[0, '#fbf6ee'], [1, '#c8c0c8']] }, { maxR: 4, edge: 1.2, group: 'tow' });
    ref.fill(blob([[cx + 45, cy - 196], [cx + 60, cy - 170], [cx + 64, cy - 150], [cx + 26, cy - 150], [cx + 30, cy - 170]]), '#b83a2e', { maxR: 3, edge: 1, group: 'onion' });
    ref.line([[cx + 45, cy - 196], [cx + 45, cy - 214]], 2, '#3a2a2a', { type: 3 });
    ref.fill({ rect: [cx + 39, cy - 132, 12, 18] }, '#3a3050', { maxR: 2.6, edge: 1, group: 'tw' });
    ref.fill([[cx - 10, cy - 40], [cx + 10, cy - 40], [cx + 10, cy - 18], [cx - 10, cy - 18]], '#ffd27a', { maxR: 2.6, edge: 1, group: 'cw', gmul: 0 });
    reflect(ref, cx, lake + 50, lake + 200, 70, 'rgba(250,246,238,1)', 0.35, 6); reflect(ref, cx, lake + 50, lake + 160, 16, 'rgba(255,210,122,1)', 0.6, 8); }
  // a wooden boathouse and a pier on the left shore
  ref.fill([[40, lake + 40], [210, lake + 30], [220, lake - 40], [130, lake - 90], [30, lake - 40]], { lin: [30, 0, 220, 0], stops: [[0, '#8a5a3a'], [1, '#5a3a28']] }, { maxR: 5, edge: 1.2, group: 'bh' });
  ref.fill([[20, lake - 36], [130, lake - 96], [240, lake - 36], [222, lake - 30], [130, lake - 82], [36, lake - 30]], '#3a2a24', { maxR: 3, edge: 1, group: 'bhr' });
  ref.fill({ rect: [100, lake - 26, 50, 56] }, '#2a2026', { maxR: 3, edge: 1, group: 'bhd' });
  ref.fill([[200, lake + 26], [420, lake + 40], [420, lake + 50], [200, lake + 38]], '#7a5a40', { maxR: 3, edge: 1, group: 'pier' });
  for (let x = 220; x < 420; x += 40) ref.line([[x, lake + 40], [x, lake + 70]], 4, '#3a2a20', { type: 3 });
  // the meadow in front: green, then a riot of lupins, daisies, poppies
  ref.fill([[0, lake + 380], [300, lake + 340], [700, lake + 360], [1080, lake + 330], [1080, H], [0, H]], { lin: [0, lake + 330, 0, H], stops: [[0, '#4a7046'], [1, '#2e5030']] }, { dir: -Math.PI / 2, maxR: 18, group: 'meadow' });
  for (let i = 0; i < 40; i++) { const x = (i * 97) % W + 10, y = lake + 340 + (i % 5) * 6; ref.fill(ellipsePts(x, y, 14 + (i % 4) * 6, 8 + (i % 3) * 3, 10, 0, 0.3, i), i % 2 ? '#8a8a96' : '#6a6a78', { maxR: 4, edge: 1.2, group: 'stone' }); }
  for (let i = 0; i < 60; i++) { const x = (i * 53) % W, y = lake + 352; ref.line([[x, y], [x + (i % 3 - 1) * 4, y - 30 - (i % 4) * 8]], 2.5, '#5a7a3a', { type: 3 }); }
  const mr = rnd(23);
  for (let i = 0; i < 520; i++) {
    const y = lake + 360 + Math.pow(mr(), 0.7) * (H - lake - 360), s = 0.4 + (y - lake - 360) / (H - lake - 360) * 1.4, x = mr() * W;
    const kind = mr();
    if (kind < 0.3) { const c = pick(mr, ['#7a5ad0', '#9a7ae0', '#c070c8', '#e090c8']); ref.line([[x, y], [x, y - 30 * s]], 6 * s, c, { type: 3, gmul: 0 }); ref.line([[x, y + 2], [x, y + 14 * s]], 2, '#3a6a32', { type: 3 }); }
    else if (kind < 0.55) ref.fill({ circle: [x, y, 5 * s] }, '#f8f6ec', { maxR: 2.6, edge: 1, group: 'daisy', gmul: 0 });
    else if (kind < 0.7) ref.fill({ circle: [x, y, 5 * s] }, '#f6d040', { maxR: 2.6, edge: 1, group: 'butter', gmul: 0 });
    else if (kind < 0.8) ref.fill({ circle: [x, y, 6 * s] }, '#e0402e', { maxR: 2.6, edge: 1, group: 'poppy', gmul: 0 });
    else ref.line([[x, y], [x + (mr() - 0.5) * 10 * s, y - 24 * s]], 2.5 * s, pick(mr, ['#6a9a4a', '#8ab05a', '#4a7a3a']), { type: 3 });
  }
  return {
    ref, clear: hex('#2a3a5a'),
    extra: (s) => { const cr = rnd(90); for (let i = 0; i < 3; i++) crow(s, { x: 420 + i * 80 + cr() * 20, y: 260 + i * 24, s: 16 + cr() * 6, pose: 'fly', flap: cr(), dir: -1, seed: 90 + i, gmul: 1 }); },
    post: { amb: 0.82, dif: 0.3, spec: 0.22, vig: 0.24, sat: 1.06, warm: 0.03, light: [0.65, -0.45, 0.6] },
  };
}
