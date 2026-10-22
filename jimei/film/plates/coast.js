// coast.js — style C: the cliff village at night (S12, S14), the harbour in the rain (S13), and the alpine ridge
// above a lake where the woman stands (S16–S18).
import { Ref } from '../../engine/plate.js';
import { hex, mixc, DAB, KNIFE } from '../../engine/impasto.js';
import { star, swirlTint, reflect, rnd, pick, mixh, ellipsePts, blob } from '../concepts/lib.js';

const R6 = [55, 34, 20, 12.3, 7.7, 4.6];

// ── the village climbing the cliff over the sea, at night: 1080 × 2900, the scene in the lower 1920 ──
export function plateVillage() {
  const W = 1080, DY = 980, H = 1920 + DY, ref = new Ref(W, H), hz = 900 + DY;
  const moon = [820, 260 + DY];
  ref.fill({ rect: [0, 0, W, hz + 4] }, { lin: [0, 0, 0, hz], stops: [[0, '#060c24'], [0.35, '#0e1a44'], [0.7, '#1e2e6a'], [0.92, '#3a4a8a'], [1, '#5a6aa0']] }, { dir: 0.02, maxR: 36, group: 'sky', jit: 0.04 });
  swirlTint(ref, 520, 520, 40, 380, 1.4, '#3a5aa0', 0.25, 16, 3);
  swirlTint(ref, 300, 1200, 30, 300, 1.2, '#4a6ab0', 0.22, 14, 7);
  const sr = rnd(5);
  for (let i = 0; i < 90; i++) { const x = sr() * W, y = sr() * (hz - 200); ref.fill({ circle: [x, y, 1.6 + sr() * 2.4] }, '#f0ecd8', { maxR: 2.6, edge: 1, group: 'stars' }); }
  for (const [x, y, r] of [[200, 300, 12], [640, 180, 10], [940, 640, 9], [380, 900, 11], [120, 1300, 8], [700, 1150, 9]]) { for (let k = 2; k >= 1; k--) ref.tint({ circle: [x, y, r * (1.8 + k)] }, '#d8d0a0', 0.12); star(ref, x, y, r, { group: 's' + x, gmul: 1 }); }
  for (const [cx, cy, rx, ry, sd] of [[300, 1500 + 0, 320, 18, 1], [800, 1620, 260, 14, 2], [540, 1760, 380, 12, 3]]) ref.fill(ellipsePts(cx, cy, rx, ry, 28, 0.02, 0.25, sd), '#2e3e78', { dir: 0.02, maxR: 8, group: 'cloud' + sd });
  ref.fill({ circle: [...moon, 130] }, { rad: [...moon, 40, ...moon, 130], stops: [[0, 'rgba(240,232,200,0.6)'], [1, 'rgba(30,46,106,0)']] }, { maxR: 10, dir: 'edge', group: 'halo' });
  ref.fill({ circle: [...moon, 50] }, { rad: [moon[0] - 14, moon[1] - 14, 4, ...moon, 50], stops: [[0, '#fffbea'], [1, '#f0dca8']] }, { maxR: 6, edge: 2, group: 'moon' });
  // the sea and the moon's road
  ref.fill({ rect: [0, hz, W, H - hz] }, { lin: [0, hz, 0, H], stops: [[0, '#2a3a7a'], [0.4, '#1a3a6a'], [1, '#14304a']] }, { dir: 0, maxR: 18, group: 'sea', aj: 0.05, len: [2.4, 4], wid: [0.6, 0.9] });
  reflect(ref, moon[0], hz + 4, H - 260, 80, 'rgba(240,232,200,1)', 0.6, 4);
  // the headland and lighthouse (lit)
  ref.fill([[900, hz + 10], [940, hz - 28], [990, hz - 48], [1040, hz - 64], [1080, hz - 70], [1080, hz + 90], [900, hz + 60]], { lin: [0, hz - 70, 0, hz + 90], stops: [[0, '#2a2a4a'], [1, '#141a30']] }, { dir: 0.2, maxR: 10, group: 'head' });
  const LH = [1015, hz - 210];
  ref.fill([[1002, hz - 54], [1028, hz - 54], [1022, LH[1] + 22], [1008, LH[1] + 22]], '#c8c4c8', { maxR: 4, edge: 1.2, group: 'lh' });
  for (const y of [hz - 98, hz - 144]) ref.fill([[1005, y], [1025, y], [1024, y - 14], [1006, y - 14]], '#a83a3a', { maxR: 2.6, edge: 1, group: 'lhb' });
  ref.fill({ rect: [1004, LH[1], 22, 22] }, '#fff0b0', { maxR: 2.6, edge: 1, group: 'lamp', gmul: 0 });
  ref.fill([[1000, LH[1]], [1030, LH[1]], [1015, LH[1] - 16]], '#2a2030', { maxR: 2.6, edge: 1, group: 'lhc' });
  // the cliff
  ref.fill([[0, 640 + DY], [180, 620 + DY], [420, 700 + DY], [620, 820 + DY], [760, 1000 + DY], [820, 1240 + DY], [860, 1500 + DY], [900, 1640 + DY], [0, 1640 + DY]], { lin: [0, 640 + DY, 0, 1640 + DY], stops: [[0, '#5a4a6a'], [1, '#2e2a3e']] }, { dir: 1.2, maxR: 16, group: 'cliff' });
  const rr = rnd(5);
  for (let i = 0; i < 40; i++) { const x = 600 + rr() * 300, y = 900 + DY + rr() * 700; ref.tint([[x, y], [x + 30 + rr() * 40, y + 10], [x + 20, y + 40 + rr() * 30]], rr() < 0.5 ? '#7a6a8a' : '#1e1a2a', 0.4); }
  // the houses, row by row; every window recorded so the shots can light it
  const PALN = ['#a89ab8', '#b8b0b8', '#9a8aa8', '#c8c4cc', '#8a9ab8', '#b098b0', '#a8a088', '#b8a8b0'];
  const SH = ['#2e5a6a', '#2a4a7a', '#2e6a6a', '#4a6a3a'];
  const hr = rnd(13), windows = [];
  const house = (x, y, w, h, flat, row) => {
    const col = pick(hr, PALN);
    ref.fill({ rect: [x, y - h, w, h] }, { lin: [x, 0, x + w, 0], stops: [[0, mixh(col, '#d8d0e0', 0.25)], [1, mixh(col, '#2a2a4a', 0.35)]] }, { dir: Math.PI / 2, maxR: 8, edge: 1.5, group: 'h' });
    if (flat) ref.fill({ rect: [x - 3, y - h - 8, w + 6, 9] }, mixh(col, '#ffffff', 0.3), { maxR: 3, edge: 1, group: 'par' });
    else { ref.fill([[x - 8, y - h + 2], [x + w + 8, y - h + 2], [x + w / 2, y - h - 22 - w * 0.08]], { lin: [x, 0, x + w, 0], stops: [[0, '#a85a4a'], [1, '#6a3030']] }, { maxR: 4, edge: 1.2, group: 'roof' }); for (let q = x - 4; q < x + w + 4; q += 7) ref.tint([[q, y - h + 2], [q + 3, y - h + 2], [x + w / 2 + (q - x - w / 2) * 0.2, y - h - 14]], '#3a1a1a', 0.3); }
    const floors = Math.max(1, Math.round(h / 44)), nw = Math.max(1, Math.round(w / 38));
    for (let f = 0; f < floors; f++) for (let k = 0; k < nw; k++) {
      const wx = x + (k + 0.5) * w / nw - 6, wy = y - h + 12 + f * 44;
      if (wy + 18 > y - 4) continue;
      ref.fill({ rect: [wx, wy, 12, 18] }, '#1e2038', { maxR: 2.6, edge: 1, group: 'wd' });
      windows.push({ q: [[wx, wy], [wx + 12, wy], [wx + 12, wy + 18], [wx, wy + 18]], c: [wx + 6, wy + 9], row, x: wx + 6 });
      if (hr() < 0.7) { const sc = pick(hr, SH); ref.fill({ rect: [wx - 7, wy, 6, 18] }, sc, { maxR: 2.6, edge: 1, group: 'sh' }); ref.fill({ rect: [wx + 13, wy, 6, 18] }, sc, { maxR: 2.6, edge: 1, group: 'sh' }); }
    }
    if (hr() < 0.45) {
      const bx = hr() < 0.5 ? x + 6 : x + w - 6, n = 10 + (hr() * 10 | 0);
      for (let j = 0; j < n; j++) ref.fill({ circle: [bx + (hr() - 0.5) * 34, y - h + 10 + hr() * h * 0.9, 5 + hr() * 6] }, pick(hr, ['#a8287a', '#b8489a', '#98206a']), { maxR: 3, edge: 1, group: 'bg' });
    }
  };
  for (let k = 0; k < 11; k++) {
    const y = 700 + DY + k * 86, xEnd = 300 + k * 46 + (k > 6 ? 40 : 0);
    let x = -20 + (k % 2) * 30;
    while (x < xEnd) {
      const w = 64 + hr() * 70, h = 60 + hr() * 70 + (k > 7 ? 20 : 0);
      if (!(k === 1 && x > 180 && x < 420)) house(x, y + hr() * 10, w, h, hr() < 0.45, k);
      if (hr() < 0.22) ref.fill(blob(ellipsePts(x + w + 18, y - 14, 18, 15, 9, 0, 0.3, k * 31 + x)), '#2a3a3a', { maxR: 5, group: 'tree', type: DAB });
      x += w + 4 + hr() * 14;
    }
  }
  // the church with its majolica dome near the top
  { const cx = 300, cy = 790 + DY;
    ref.fill({ rect: [cx - 90, cy - 120, 180, 120] }, { lin: [cx - 90, 0, cx + 90, 0], stops: [[0, '#d8d0d8'], [1, '#8a8098']] }, { maxR: 8, edge: 1.5, group: 'ch' });
    ref.fill([[cx - 30, cy], [cx + 30, cy], [cx + 30, cy - 50], [cx, cy - 70], [cx - 30, cy - 50]], '#2a1e2a', { maxR: 4, edge: 1.2, group: 'chd' });
    ref.fill({ circle: [cx, cy - 92, 14] }, '#2a2a4a', { maxR: 3, edge: 1, group: 'chr' });
    ref.fill({ rect: [cx - 56, cy - 170, 112, 50] }, '#c8c0cc', { maxR: 5, edge: 1.2, group: 'drum' });
    for (let k = 0; k < 5; k++) { ref.fill({ rect: [cx - 44 + k * 21, cy - 160, 8, 24] }, '#1e2038', { maxR: 2.6, edge: 1, group: 'drumw' }); windows.push({ q: [[cx - 44 + k * 21, cy - 160], [cx - 36 + k * 21, cy - 160], [cx - 36 + k * 21, cy - 136], [cx - 44 + k * 21, cy - 136]], c: [cx - 40 + k * 21, cy - 148], row: -1, x: cx - 40 + k * 21 }); }
    const dome = []; for (let k = 0; k <= 20; k++) { const a = Math.PI + k / 20 * Math.PI; dome.push([cx + Math.cos(a) * 62, cy - 170 + Math.sin(a) * 74]); }
    ref.fill(dome, { rad: [cx - 20, cy - 220, 6, cx, cy - 190, 80], stops: [[0, '#6aa8a0'], [0.5, '#2a6a6a'], [1, '#14384a']] }, { maxR: 6, edge: 1.5, group: 'dome', dir: 'edge' });
    for (let j = 0; j < 60; j++) { const a = Math.PI + hr() * Math.PI, r = hr(), px = cx + Math.cos(a) * 62 * r, py = cy - 170 + Math.sin(a) * 74 * r; ref.tint([[px, py - 5], [px + 5, py], [px, py + 5], [px - 5, py]], hr() < 0.5 ? '#c8a830' : '#1a3a7a', 0.7); }
    ref.fill({ rect: [cx - 9, cy - 262, 18, 22] }, '#c8c0cc', { maxR: 2.6, edge: 1, group: 'lant' });
    ref.line([[cx, cy - 262], [cx, cy - 292]], 3, '#2a2030', { type: 3 }); ref.line([[cx - 9, cy - 282], [cx + 9, cy - 282]], 3, '#2a2030', { type: 3 });
    ref.fill({ rect: [cx + 96, cy - 230, 56, 230] }, { lin: [cx + 96, 0, cx + 152, 0], stops: [[0, '#d8d0d8'], [1, '#8a8098']] }, { maxR: 6, edge: 1.5, group: 'bell' });
    ref.fill([[cx + 108, cy - 196], [cx + 140, cy - 196], [cx + 140, cy - 168], [cx + 124, cy - 160], [cx + 108, cy - 168]], '#1e2038', { maxR: 2.6, edge: 1, group: 'belfry' });
    const bd = []; for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI; bd.push([cx + 124 + Math.cos(a) * 30, cy - 230 + Math.sin(a) * 30]); }
    ref.fill(bd, '#a88a40', { maxR: 4, edge: 1.2, group: 'bdome', dir: 'edge' }); }
  // the harbour: the quay, its lamps (unlit), boats
  ref.fill([[0, 1640 + DY], [900, 1640 + DY], [920, 1700 + DY], [0, 1700 + DY]], { lin: [0, 1640 + DY, 0, 1700 + DY], stops: [[0, '#8a8098'], [1, '#4a4058']] }, { dir: 0, maxR: 8, group: 'quay' });
  for (let x = 10; x < 900; x += 60) ref.tint({ rect: [x, 1642 + DY, 3, 56] }, '#2a2030', 0.5);
  ref.fill({ rect: [0, 1700 + DY, 920, H - 1700 - DY] }, { lin: [0, 1700 + DY, 0, H], stops: [[0, '#1a3a5a'], [1, '#14304a']] }, { dir: 0, maxR: 12, group: 'harb', len: [2.4, 4], wid: [0.6, 0.9] });
  const br = rnd(19);
  for (const [x, y, w, hull, band] of [[80, 1790, 190, '#c8c8d0', '#2a4a88'], [330, 1760, 150, '#2a4a88', '#c8b040'], [520, 1820, 210, '#983a2e', '#c8c8d0'], [760, 1770, 140, '#c8a840', '#2a6a6a']]) {
    const yy = y + DY;
    ref.fill([[x, yy], [x + w, yy - 6], [x + w * 0.88, yy + 34], [x + w * 0.12, yy + 36]], hull, { maxR: 5, edge: 1.5, group: 'boat' });
    ref.fill([[x + 4, yy + 2], [x + w - 4, yy - 4], [x + w * 0.98, yy + 8], [x + 6, yy + 10]], band, { maxR: 3, edge: 1, group: 'band' });
    ref.line([[x + w * 0.45, yy - 2], [x + w * 0.45, yy - 90 - br() * 30]], 3, '#2a2020', { type: 3 });
    reflect(ref, x + w / 2, yy + 40, yy + 120, w * 0.8, hull, 0.3, x);
  }
  const lamps = [[160, 1640 + DY], [640, 1640 + DY]];
  for (const [lx, ly] of lamps) { ref.line([[lx, ly], [lx, ly - 120]], 6, '#1e1c26', { area: true, group: 'post' }); ref.fill({ rect: [lx - 12, ly - 150, 24, 32] }, '#6a7088', { maxR: 3, edge: 1, group: 'qlamp' }); ref.fill([[lx - 16, ly - 150], [lx + 16, ly - 150], [lx, ly - 166]], '#1e1c26', { maxR: 2.6, edge: 1, group: 'qcap' }); }
  return { ref, w: W, h: H, R: R6, DY, windows, LH: [LH[0] + 11, LH[1] + 11], lamps: lamps.map(([x, y]) => [x, y - 134]) };
}

// ── the harbour in the rain, close: a mooring bollard on the quay, a lamp, the boats rocking ──
export const HARB = { bollard: [470, 1540], lamp: [800, 1000], quay: 1560, top: 1390 };
export function plateHarbour() {
  const W = 1080, H = 1920, ref = new Ref(W, H);
  // behind: the lowest houses of the village, dark, a few windows, the church dome high up
  ref.fill({ rect: [0, 0, W, 900] }, { lin: [0, 0, 0, 900], stops: [[0, '#10183a'], [1, '#2a3058']] }, { dir: 0.04, maxR: 30, group: 'sky' });
  const hr = rnd(7), windows = [];
  let x = -20;
  for (let row = 0; row < 3; row++) {
    x = -30 + row * 40;
    const y = 520 + row * 170;
    while (x < W + 40) {
      const w = 110 + hr() * 90, h = 150 + hr() * 90, col = pick(hr, ['#8a7a98', '#9a8aa0', '#7a7a98', '#a098a8', '#8a8aa8']);
      ref.fill({ rect: [x, y - h, w, h + 40] }, { lin: [x, 0, x + w, 0], stops: [[0, mixh(col, '#c8c0d0', 0.2)], [1, mixh(col, '#1e1e3a', 0.4)]] }, { dir: Math.PI / 2, maxR: 10, edge: 1.5, group: 'h' + row });
      ref.fill([[x - 10, y - h + 2], [x + w + 10, y - h + 2], [x + w / 2, y - h - 40]], { lin: [x, 0, x + w, 0], stops: [[0, '#8a4a40'], [1, '#4a2428']] }, { maxR: 5, edge: 1.2, group: 'roof' + row });
      for (let f = 0; f < 2; f++) for (let k = 0; k < 2; k++) {
        const wx = x + 22 + k * (w - 60), wy = y - h + 30 + f * 70;
        ref.fill({ rect: [wx, wy, 20, 32] }, '#1e2038', { maxR: 2.6, edge: 1, group: 'wd' });
        ref.fill({ rect: [wx - 10, wy, 9, 32] }, '#2a4a5a', { maxR: 2.6, edge: 1, group: 'sh' }); ref.fill({ rect: [wx + 21, wy, 9, 32] }, '#2a4a5a', { maxR: 2.6, edge: 1, group: 'sh' });
        windows.push({ q: [[wx, wy], [wx + 20, wy], [wx + 20, wy + 32], [wx, wy + 32]], c: [wx + 10, wy + 16], row });
      }
      x += w + 6 + hr() * 20;
    }
  }
  // the quay wall and the stones of the quay, wet
  ref.fill({ rect: [0, 880, W, 140] }, '#4a4258', { dir: 0, maxR: 12, group: 'qwall' });
  ref.fill({ rect: [0, 1020, W, 560] }, { lin: [0, 1020, 0, 1580], stops: [[0, '#5a5068'], [1, '#3a3448']] }, { dir: 0, maxR: 18, group: 'quay' });
  for (let row = 0; row < 9; row++) { const y = 1030 + row * 52 + row * row * 2, h = 36 + row * 4, w = h * 2.6; for (let xx = (row % 2) * w * 0.5; xx < W; xx += w + 4) { ref.tint({ rect: [xx, y, w, 3] }, '#1e1a2a', 0.5); ref.tint({ rect: [xx, y, 3, h] }, '#1e1a2a', 0.4); } }
  ref.fill({ rect: [0, 1560, W, 26] }, '#8a8098', { maxR: 6, edge: 1.5, group: 'edge' });
  // the water: boats, ropes to the bollard
  ref.fill({ rect: [0, 1586, W, H - 1586] }, { lin: [0, 1586, 0, H], stops: [[0, '#1e3a5a'], [1, '#14284a']] }, { dir: 0, maxR: 14, group: 'water', len: [2.4, 4], wid: [0.6, 0.9] });
  for (const [bx, by, w, hull, band] of [[-60, 1700, 520, '#c8c8d0', '#2a4a88'], [560, 1760, 600, '#983a2e', '#d8c040']]) {
    ref.fill([[bx, by], [bx + w, by - 14], [bx + w * 0.9, by + 110], [bx + w * 0.1, by + 120]], hull, { maxR: 6, edge: 1.5, group: 'boat' + bx });
    ref.fill([[bx + 6, by + 4], [bx + w - 6, by - 10], [bx + w * 0.98, by + 24], [bx + 10, by + 30]], band, { maxR: 4, edge: 1.2, group: 'band' + bx });
    ref.line([[bx + w * 0.5, by - 4], [bx + w * 0.5, by - 360]], 6, '#2a2020', { area: true, group: 'mast' + bx });
    reflect(ref, bx + w / 2, by + 120, H, w * 0.7, hull, 0.3, bx + 3);
  }
  // the bollard
  const [bx, by] = HARB.bollard;
  ref.tint({ ellipse: [bx + 40, by + 20, 140, 18, 0] }, '#14121c', 0.5);
  ref.fill([[bx - 70, by + 20], [bx + 70, by + 20], [bx + 58, by - 110], [bx + 80, by - 130], [bx + 62, by - 150], [bx - 62, by - 150], [bx - 80, by - 130], [bx - 58, by - 110]], { lin: [bx - 80, 0, bx + 80, 0], stops: [[0, '#2a2832'], [0.6, '#6a6878'], [1, '#3a3844']] }, { maxR: 6, edge: 1.5, group: 'bollard' });
  ref.tint([[bx - 62, by - 150], [bx + 62, by - 150], [bx + 50, by - 140], [bx - 50, by - 140]], '#a8a8b8', 0.6);
  ref.line([[bx - 50, by - 80], [bx - 40, by - 96], [bx + 40, by - 96], [bx + 50, by - 80]], 9, '#8a7a58', { type: 3 });
  ref.line([[bx - 50, by - 80], [180, 1700], [120, 1720]], 7, '#8a7a58', { type: 3 });
  ref.line([[bx + 50, by - 80], [800, 1740], [860, 1760]], 7, '#8a7a58', { type: 3 });
  // puddles on the quay holding the lamp and the windows
  for (const [px, py, rw] of [[300, 1400, 120], [720, 1300, 90], [880, 1470, 130], [140, 1200, 80]]) ref.fill(ellipsePts(px, py, rw, rw * 0.22, 20, 0, 0.2, px), { lin: [0, py - 20, 0, py + 20], stops: [[0, '#2a3a6a'], [1, '#4a5a8a']] }, { dir: 0, maxR: 6, edge: 1.5, group: 'pud' + px });
  // the lamp post, unlit for now (lit live)
  const [lx, ly] = HARB.lamp;
  ref.fill([[lx - 24, 1450], [lx + 24, 1450], [lx + 14, 1400], [lx - 14, 1400]], '#1c1b24', { maxR: 4, edge: 1.2, group: 'lpost' });
  ref.line([[lx, 1405], [lx, ly + 46]], 12, '#1c1b24', { area: true, group: 'lpost' });
  ref.fill([[lx - 30, ly + 44], [lx + 30, ly + 44], [lx + 40, ly - 44], [lx - 40, ly - 44]], { lin: [lx, ly - 44, lx, ly + 44], stops: [[0, '#6a7088'], [1, '#3a4058']] }, { maxR: 4, edge: 1.2, group: 'lglass' });
  ref.fill([[lx - 50, ly - 44], [lx + 50, ly - 44], [lx, ly - 84]], '#1c1b24', { maxR: 3, edge: 1, group: 'lcap' });
  // fishing nets and a crate by the bollard
  ref.fill([[150, 1460], [330, 1450], [340, 1520], [140, 1530]], '#6a4a32', { maxR: 5, edge: 1.5, group: 'crate' });
  for (let k = 1; k < 3; k++) ref.tint({ rect: [140, 1460 + k * 22, 200, 3] }, '#2a1a10', 0.6);
  ref.fill(blob([[560, 1520], [640, 1470], [720, 1490], [760, 1530], [600, 1545]]), '#3a5a6a', { maxR: 5, edge: 1.2, group: 'net' });
  for (let k = 0; k < 10; k++) ref.tint({ rect: [570 + k * 18, 1478, 2, 60] }, '#1a2a30', 0.5);
  return { ref, w: W, h: H, R: R6, windows };
}

// ── the alpine ridge: the woman stands on the crest; far below a lake, across the valley the snow peaks ──
export function plateRidge() {
  const W = 1440, H = 2560, ref = new Ref(W, H);
  const FEET = [700, 1700], ROCK = [905, 1712];
  ref.fill({ rect: [0, 0, W, 1500] }, { lin: [0, 0, 0, 1500], stops: [[0, '#3a4a78'], [0.45, '#7a8ab0'], [0.8, '#c8c4cc'], [1, '#e8d8c8']] }, { dir: -0.1, maxR: 40, group: 'sky', jit: 0.05 });
  for (const [cx, cy, rx, ry, s] of [[300, 180, 380, 50, 1], [1150, 260, 330, 44, 2], [1200, 760, 300, 40, 3], [250, 640, 260, 34, 4]]) {
    ref.fill(ellipsePts(cx, cy, rx, ry, 30, -0.1, 0.25, s), '#6a7498', { dir: -0.1, maxR: 18, group: 'cloud' + s });
    ref.fill(ellipsePts(cx + rx * 0.1, cy - ry * 0.4, rx * 0.6, ry * 0.35, 22, -0.1, 0.25, s + 7), '#d8d8e0', { dir: -0.1, maxR: 8, group: 'cloud' + s });
  }
  // the peaks across the valley: violet rock, snowfields, lit faces
  const peaks = [
    { o: [[-60, 1400], [140, 1000], [260, 860], [330, 940], [480, 1400]], lit: [[260, 860], [330, 940], [380, 1100], [300, 1120]], snow: [[260, 860], [300, 900], [280, 950], [240, 920]] },
    { o: [[200, 1400], [420, 1040], [600, 760], [660, 820], [720, 880], [800, 820], [940, 1060], [1100, 1400]], lit: [[600, 760], [660, 820], [720, 880], [800, 820], [860, 960], [780, 1080], [700, 1120], [660, 980], [630, 860]], snow: [[600, 760], [660, 820], [690, 860], [650, 890], [610, 840], [580, 800]] },
    { o: [[880, 1400], [1060, 1020], [1180, 860], [1250, 920], [1320, 880], [1440, 1080], [1440, 1400]], lit: [[1180, 860], [1250, 920], [1320, 880], [1380, 1000], [1300, 1080], [1240, 1040], [1200, 940]], snow: [[1180, 860], [1230, 900], [1210, 940], [1170, 910]] },
  ];
  peaks.forEach((pk, i) => {
    ref.fill(pk.o, { lin: [0, 760, 0, 1400], stops: [[0, '#7a7aa8'], [1, '#4a5080']] }, { dir: Math.PI / 2 + 0.4, maxR: 12, group: 'p' + i });
    ref.tint(pk.lit, { lin: [0, 760, 0, 1200], stops: [[0, '#fff0e0'], [0.5, '#f0c8c0'], [1, '#c8a8b8']] }, 0.9);
    ref.tint(pk.snow, '#fbf6f4', 0.9);
  });
  const gr = rnd(31);
  for (let i = 0; i < 30; i++) { const x = 100 + gr() * 1240, y = 880 + gr() * 360, l = 60 + gr() * 140, a = Math.PI / 2 + (gr() - 0.5) * 1.1; ref.tint([[x, y], [x + Math.cos(a) * l, y + Math.sin(a) * l], [x + Math.cos(a) * l + 6, y + Math.sin(a) * l], [x + 4, y]], gr() < 0.5 ? '#2e3060' : '#f0e8f0', 0.45); }
  // the valley: forested slopes, the lake far below with the peaks in it
  ref.fill([[0, 1380], [400, 1360], [800, 1390], [1200, 1350], [1440, 1370], [1440, 1580], [0, 1580]], { lin: [0, 1350, 0, 1580], stops: [[0, '#3a5a5a'], [1, '#2a4048']] }, { dir: 0, maxR: 12, group: 'forest' });
  for (let i = 0; i < 120; i++) { const x = gr() * W, y = 1370 + gr() * 120, h = 14 + gr() * 12; ref.fill([[x, y - h], [x + h * 0.3, y], [x - h * 0.3, y]], pick(gr, ['#1e3a34', '#28463c', '#34503e']), { maxR: 3, edge: 1, group: 'fir' }); }
  ref.fill(blob([[200, 1500], [520, 1470], [900, 1480], [1200, 1500], [1100, 1560], [600, 1575], [260, 1560]]), { lin: [0, 1470, 0, 1575], stops: [[0, '#a8b8d0'], [1, '#6a7aa0']] }, { dir: 0, maxR: 8, group: 'lake' });
  for (let y = 1480; y < 1570; y += 6) ref.tint({ rect: [200, y, 1000, 2] }, '#e8eef4', 0.15);
  ref.fill([[0, 1560], [300, 1520], [620, 1560], [1000, 1500], [1440, 1540], [1440, 1760], [0, 1760]], '#6a7088', { dir: -0.05, maxR: 16, group: 'far1' });
  ref.fill([[0, 1640], [420, 1610], [900, 1650], [1440, 1620], [1440, 1800], [0, 1800]], '#4e5668', { dir: -0.05, maxR: 16, group: 'far2' });
  // the crest: alpine grass combed by the wind, gentians and edelweiss in it
  const crest = [[0, 1730], [240, 1690], [520, 1668], [760, 1660], [1000, 1666], [1260, 1690], [1440, 1716], [1440, H], [0, H]];
  ref.fill(crest, { lin: [0, 1660, 0, H], stops: [[0, '#6a7a4a'], [0.25, '#4a5a38'], [1, '#2a3426']] }, { dir: -0.35, maxR: (x, y) => 8 + 30 * Math.min(1, (y - 1660) / 800), group: 'grass', hgt: 1.1 });
  for (let k = 0; k < 140; k++) {
    const x = (k * 97.3) % 1440, y = 1700 + ((k * 61.7) % 1) * 820 + ((k * 0.37) % 1) * 40, sz = 18 + 50 * (y - 1660) / 900;
    ref.extra.push({ x, y, ang: -Math.PI / 2 + 0.55, len: sz * 1.8, wid: sz * 0.22, c: hex(k % 3 ? '#7a8a50' : '#9aa46a'), c2: hex('#4a5a38'), type: KNIFE, taper: 0.8, seed: 4600 + k, hgt: 0.9, run: 0.2 });
  }
  const fr = rnd(44);
  for (let i = 0; i < 70; i++) { const x = fr() * W, y = 1720 + Math.pow(fr(), 0.8) * 800, s = 0.5 + (y - 1700) / 800; if (Math.abs(x - FEET[0]) < 180 && y < 1780) continue; ref.fill({ circle: [x, y, 7 * s] }, fr() < 0.6 ? '#3a4ab0' : '#f0f0e8', { maxR: 3, edge: 1, group: 'flw' }); }
  // the footing: dark wet earth, a pool; the rock for the crow
  ref.fill(ellipsePts(FEET[0] - 10, FEET[1] + 18, 210, 40, 26, 0.02, 0.2, 2), '#3a3430', { dir: 0, maxR: 12, edge: 3, wet: 0.8, group: 'mud' });
  ref.fill(ellipsePts(FEET[0] + 70, FEET[1] + 30, 70, 12, 18, 0, 0.2, 3), '#a8acb8', { dir: 0, maxR: 6, edge: 2, wet: 1, group: 'mudpool' });
  const [rx, ry] = ROCK;
  ref.fill(blob([[rx - 110, ry + 30], [rx - 90, ry - 40], [rx - 20, ry - 70], [rx + 70, ry - 50], [rx + 110, ry + 10], [rx + 90, ry + 40]]), '#55565a', { dir: 0.3, maxR: 14, edge: 3, group: 'rock' });
  ref.fill(blob([[rx - 70, ry - 40], [rx - 10, ry - 66], [rx + 60, ry - 48], [rx + 20, ry - 30]]), '#9a9ca0', { dir: 0.3, maxR: 8, group: 'rock' });
  for (let k = 0; k < 8; k++) ref.fill({ circle: [rx - 80 + k * 22, ry + 28 + (k % 2) * 6, 5] }, '#c8c8a0', { maxR: 2.6, edge: 1, group: 'lichen' });
  return { ref, w: W, h: H, R: [20, 13, 8, 5.5, 4, 3] };
}
export const RIDGE = { feet: [700, 1700], h: 560, rock: [905, 1712], crest: 1600 };
