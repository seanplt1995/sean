// common.js — helpers for drawing reference plates.
import { hex, mixc } from '../../engine/impasto.js';

export const css = (c) => `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
export const mixh = (a, b, t) => css(mixc(hex(a), hex(b), t));
export const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const clamp01 = (x) => Math.max(0, Math.min(1, x));

// hanging cable between two points
export function catenary(a, b, sag, n = 24) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = lerp2(a, b, t);
    pts.push([p[0], p[1] + sag * 4 * t * (1 - t)]);
  }
  return pts;
}

// a facade between a near edge (top, bottom) and the vanishing point; point(d, f): d toward VP, f top→bottom
export function facade(top, bottom, vp) {
  return (d, f) => lerp2(lerp2(top, vp, d), lerp2(bottom, vp, d), f);
}
export const quadOn = (P, d0, d1, f0, f1) => [P(d0, f0), P(d1, f0), P(d1, f1), P(d0, f1)];
export const towards = (vp) => (x, y) => Math.atan2(vp[1] - y, vp[0] - x);

export function ellipsePts(cx, cy, rx, ry, n = 28, rot = 0, wobble = 0, seed = 1) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2, w = 1 + wobble * Math.sin(a * 3 + seed) * Math.cos(a * 2 - seed * 0.7);
    const x = Math.cos(a) * rx * w, y = Math.sin(a) * ry * w;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return pts;
}

// a smooth closed blob through control points (Catmull-Rom → bezier)
export function blob(pts) {
  const out = [pts[0]], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    out.push([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]]);
  }
  return out;
}
