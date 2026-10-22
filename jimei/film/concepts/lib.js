// lib.js — helpers for the concept plates: a pinhole camera over a ground plane, and the small things
// that make a place feel lived in (windows, shutters, balconies with flowers, cobbles, stars, reflections).
import { hex, mixc } from '../../engine/impasto.js';
import { css, mixh, ellipsePts, blob } from '../plates/common.js';

export { css, mixh, ellipsePts, blob };

// camera: X right, Y up (metres), Z forward; screen x = cx + (X - camX)·F/Z, y = hz + (camH - Y)·F/Z
export function camera({ cx = 540, hz = 1100, F = 700, camX = 0, camH = 1.6 } = {}) {
  const P = (X, Y, Z) => [cx + (X - camX) * F / Z, hz + (camH - Y) * F / Z];
  P.s = (Z) => F / Z;      // pixels per metre at depth Z
  P.hz = hz; P.cx = cx; P.F = F; P.camH = camH; P.camX = camX;
  return P;
}
// a rectangle on a wall that runs along Z (constant X), corners (z0..z1, y0..y1)
export const wallZ = (P, X, z0, z1, y0, y1) => [P(X, y1, z0), P(X, y1, z1), P(X, y0, z1), P(X, y0, z0)];
// a rectangle facing the camera (constant Z)
export const wallX = (P, Z, x0, x1, y0, y1) => [P(x0, y1, Z), P(x1, y1, Z), P(x1, y0, Z), P(x0, y0, Z)];
// a patch of ground (constant Y)
export const ground = (P, Y, x0, x1, z0, z1) => [P(x0, Y, z0), P(x1, Y, z0), P(x1, Y, z1), P(x0, Y, z1)];

export const rnd = (seed) => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
export const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];

// a window on a wall along Z: frame, glass (lit or dark), sill, optional shutters and arched head
export function windowZ(ref, P, X, z0, z1, y0, y1, o = {}) {
  const g = o.group || 'win';
  const lit = o.lit, glass = lit ? { lin: [...P(X, y1, z0), ...P(X, y0, z0)], stops: [[0, o.litTop || '#ffd27a'], [1, o.litBot || '#f0953a']] } : (o.dark || '#1d2236');
  ref.fill(wallZ(P, X, z0 - 0.06, z1 + 0.06, y0 - 0.06, y1 + 0.06), o.frame || '#2a2420', { maxR: 4, edge: 1.5, group: g + 'f' });
  ref.fill(wallZ(P, X, z0, z1, y0, y1), glass, { maxR: 6, edge: 1.5, group: g + (lit ? 'L' : 'D'), gmul: lit ? 0 : 1 });
  // mullions
  const zm = (z0 + z1) / 2, ym = y0 + (y1 - y0) * 0.62;
  ref.line([P(X, y0, zm), P(X, y1, zm)], Math.max(1, P.s(zm) * 0.05), o.frame || '#2a2420', { type: 3 });
  ref.line([P(X, ym, z0), P(X, ym, z1)], Math.max(1, P.s(zm) * 0.05), o.frame || '#2a2420', { type: 3 });
  ref.fill(wallZ(P, X, z0 - 0.12, z1 + 0.12, y0 - 0.14, y0 - 0.02), o.sill || '#cbbfa8', { maxR: 4, edge: 1.5, group: g + 's' });
  if (o.shutter) {
    const w = (z1 - z0) * 0.48;
    for (const [a, b] of [[z0 - 0.08 - w, z0 - 0.08], [z1 + 0.08, z1 + 0.08 + w]]) {
      ref.fill(wallZ(P, X, a, b, y0, y1), o.shutter, { maxR: 5, edge: 1.5, group: g + 'sh', dir: Math.PI / 2 });
      for (let k = 1; k < 6; k++) { const y = y0 + (y1 - y0) * k / 6; ref.tint([P(X, y, a), P(X, y, b), P(X, y - 0.04, b), P(X, y - 0.04, a)], '#000', 0.25); }
    }
  }
}
// a balcony on a wall along Z: slab, iron rail, a row of potted flowers
export function balconyZ(ref, P, X, z0, z1, y, depth, o = {}) {
  const side = Math.sign(X - P.camX) || 1, Xo = X - side * depth;
  ref.fill([P(X, y, z0), P(X, y, z1), P(Xo, y, z1), P(Xo, y, z0)], o.slab || '#b9ad98', { maxR: 4, edge: 1.5, group: 'bal' });
  ref.fill([P(X, y, z0), P(X, y, z1), P(X, y - 0.18, z1), P(X, y - 0.18, z0)], o.slabEdge || '#8f8572', { maxR: 3, edge: 1.2, group: 'bal' });
  // flowers on the slab, spilling over the rail
  const r = rnd(o.seed || 7), cols = o.flowers || ['#d8323a', '#e0505a', '#f07a5a', '#c22a4a'];
  const n = Math.round((z1 - z0) * 5);
  for (let i = 0; i < n; i++) {
    const z = z0 + (i + 0.5) / n * (z1 - z0), xx = Xo + side * depth * (0.25 + r() * 0.5), yy = y + 0.2 + r() * 0.35, s = P.s(z);
    const [px, py] = P(xx, yy, z);
    ref.fill({ circle: [px, py, Math.max(2, s * (0.16 + r() * 0.1))] }, o.leaf || '#2f5a32', { maxR: 4, edge: 1.2, group: 'leaf' });
    ref.fill({ circle: [px + (r() - 0.5) * s * 0.2, py - s * 0.08, Math.max(1.5, s * (0.09 + r() * 0.06))] }, pick(r, cols), { maxR: 3, edge: 1, group: 'flw', gmul: 0 });
  }
  // rail: posts and two bars
  const rc = o.rail || '#1d1a1a', w = Math.max(1, P.s((z0 + z1) / 2) * 0.035);
  for (const yy of [y + 0.95, y + 0.5]) ref.line([P(Xo, yy, z0), P(Xo, yy, z1)], w * 1.3, rc, { type: 3 });
  const m = Math.round((z1 - z0) * 6);
  for (let i = 0; i <= m; i++) { const z = z0 + i / m * (z1 - z0); ref.line([P(Xo, y, z), P(Xo, y + 0.95, z)], w, rc, { type: 3 }); }
  for (const z of [z0, z1]) ref.line([P(X, y + 0.95, z), P(Xo, y + 0.95, z)], w * 1.3, rc, { type: 3 });
}
// stars: a pale halo, a bright core and four short rays
export function star(ref, x, y, r, o = {}) {
  ref.fill({ circle: [x, y, r * 2.6] }, { rad: [x, y, r * 0.4, x, y, r * 2.6], stops: [[0, o.halo || 'rgba(250,236,170,0.75)'], [1, o.sky || 'rgba(60,90,160,0)']] }, { maxR: Math.max(4, r * 0.6), dir: 'edge', group: o.group || 'halo', gmul: 0 });
  ref.fill({ circle: [x, y, r] }, { rad: [x - r * 0.3, y - r * 0.3, 0, x, y, r], stops: [[0, '#fffbe6'], [1, o.core || '#f6dc78']] }, { maxR: Math.max(2.6, r * 0.5), edge: 1.5, group: (o.group || 'halo') + 'c', gmul: 0 });
}
// a swirl direction field around a centre (Van Gogh skies); returns an angle function for fills
export const swirl = (cx, cy, k = 1, base = 0) => (x, y) => Math.atan2(y - cy, x - cx) + Math.PI / 2 * k + base;
// colour-only streaks along a spiral, to give a sky shape inside one group
export function swirlTint(ref, cx, cy, r0, r1, turns, col, alpha, width, seed = 1) {
  const pts = [], n = 90, r = rnd(seed);
  for (let i = 0; i <= n; i++) { const t = i / n, a = turns * Math.PI * 2 * t + seed, rr = r0 + (r1 - r0) * t; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.8]); }
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1, w = width * (0.6 + 0.4 * Math.sin(i * 0.3 + r()));
    ref.tint([[x0 + nx / l * w, y0 + ny / l * w], [x1 + nx / l * w, y1 + ny / l * w], [x1 - nx / l * w, y1 - ny / l * w], [x0 - nx / l * w, y0 - ny / l * w]], col, alpha);
  }
}
// warm reflections on water: broken horizontal dashes below a light, colour-only
export function reflect(ref, x, yTop, yBot, width, col, alpha = 0.7, seed = 1) {
  const r = rnd(seed);
  for (let y = yTop; y < yBot; y += 3 + r() * 5) {
    const k = (y - yTop) / (yBot - yTop), w = width * (0.5 + r() * 0.9) * (1 + k * 0.6), dx = (r() - 0.5) * width * 0.5;
    ref.tint({ rect: [x - w / 2 + dx, y, w, 1.5 + r() * 2.5] }, col, alpha * (1 - k * 0.7));
  }
}
