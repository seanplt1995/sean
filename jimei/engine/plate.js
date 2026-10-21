// plate.js — reference illustration → coarse-to-fine knife strokes.
//
//   const ref = new Ref(1440, 2560);
//   ref.fill([[0,0],[1440,0],[1440,900],[0,900]], '#3d5a8a', { dir: 0, maxR: 60, group: 'sky' });
//   ref.line([[100,500],[1300,520]], 3, '#222', { type: LINE });
//   const strokes = paintRef(ref, { R: [56, 34, 20, 12, 7, 4] });
//
// Shapes are drawn into a colour canvas (the look) and an id canvas (which shape owns each
// pixel). Strokes are confined to their shape group with a distance transform, so silhouettes
// stay crisp; two shapes with the same `group` share strokes (a lost edge).

import { Strokes, KNIFE, LINE, rng, hex, strokePath } from './impasto.js';

const toPath = (p) => {
  if (p instanceof Path2D) return p;
  const P = new Path2D();
  if (Array.isArray(p)) {
    if (Array.isArray(p[0]) && Array.isArray(p[0][0])) { for (const ring of p) addPoly(P, ring); }
    else addPoly(P, p);
  } else if (p.rect) P.rect(...p.rect);
  else if (p.ellipse) P.ellipse(p.ellipse[0], p.ellipse[1], p.ellipse[2], p.ellipse[3], p.ellipse[4] || 0, 0, Math.PI * 2);
  else if (p.circle) P.arc(p.circle[0], p.circle[1], p.circle[2], 0, Math.PI * 2);
  return P;
};
function addPoly(P, pts) {
  P.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const q = pts[i];
    if (q.length === 6) P.bezierCurveTo(q[0], q[1], q[2], q[3], q[4], q[5]);
    else if (q.length === 4) P.quadraticCurveTo(q[0], q[1], q[2], q[3]);
    else P.lineTo(q[0], q[1]);
  }
  P.closePath();
}

export class Ref {
  constructor(w, h, scale = 1) {
    this.w = w; this.h = h; this.scale = scale;
    this.cw = Math.round(w * scale); this.ch = Math.round(h * scale);
    const mk = () => { const c = document.createElement('canvas'); c.width = this.cw; c.height = this.ch; return c; };
    this.col = mk(); this.id = mk(); this.lin = mk();
    this.cx = this.col.getContext('2d', { willReadFrequently: true });
    this.ix = this.id.getContext('2d', { willReadFrequently: true });
    this.lx = this.lin.getContext('2d');
    for (const x of [this.cx, this.ix, this.lx]) x.setTransform(scale, 0, 0, scale, 0, 0);
    this.shapes = [null];
    this.lines = [];
    this.extra = new Strokes();
    this.groups = new Map();
    this._r = rng(77);
    this.codes = new Map();
  }
  _style(ctx, fill) {
    if (typeof fill === 'string') return fill;
    if (typeof fill === 'function') return fill(ctx);
    if (fill.lin) { const g = ctx.createLinearGradient(...fill.lin); for (const [t, c] of fill.stops) g.addColorStop(t, c); return g; }
    if (fill.rad) { const g = ctx.createRadialGradient(...fill.rad); for (const [t, c] of fill.stops) g.addColorStop(t, c); return g; }
    return '#f0f';
  }
  _code(k) {
    let c;
    do { c = ((this._r() * 0xffffff) | 0) & 0xffffff; } while (this.codes.has(c) || c === 0);
    this.codes.set(c, k);
    return '#' + c.toString(16).padStart(6, '0');
  }
  _shape(props) {
    const k = this.shapes.length;
    const gname = props.group != null ? props.group : '#' + k;
    if (!this.groups.has(gname)) this.groups.set(gname, this.groups.size + 1);
    this.shapes.push({ props, group: this.groups.get(gname) });
    return k;
  }
  // a flat shape: path (points / Path2D / {rect}/{ellipse}/{circle}), fill (colour / gradient spec), props
  fill(path, fill, props = {}) {
    const P = toPath(path), k = this._shape(props);
    this.cx.fillStyle = this._style(this.cx, fill); this.cx.fill(P, props.rule || 'nonzero');
    if (!props.colourOnly) { this.ix.fillStyle = this._code(k); this.ix.fill(P, props.rule || 'nonzero'); }
    return k;
  }
  // a thin line: painted as strokes along the path after all area strokes
  line(pts, width, colour, props = {}) {
    // drawn into its own layer: area strokes must not sample a wire's colour
    const lx = props.area ? this.cx : this.lx;
    lx.strokeStyle = colour; lx.lineWidth = width; lx.lineCap = 'round'; lx.lineJoin = 'round';
    lx.beginPath(); lx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) lx.lineTo(pts[i][0], pts[i][1]);
    lx.stroke();
    if (props.area) {   // a thick line that should own its pixels
      const k = this._shape(props);
      this.ix.strokeStyle = this._code(k); this.ix.lineWidth = width; this.ix.lineCap = 'round'; this.ix.lineJoin = 'round';
      this.ix.beginPath(); this.ix.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) this.ix.lineTo(pts[i][0], pts[i][1]);
      this.ix.stroke();
      return k;
    }
    this.lines.push({ pts, width, colour: hex(colour), props });
    return -1;
  }
  text(str, x, y, font, colour, props = {}) {
    const k = this._shape(props);
    for (const [ctx, st] of [[this.cx, this._style(this.cx, colour)], [this.ix, this._code(k)]]) {
      ctx.font = font; ctx.textAlign = props.align || 'center'; ctx.textBaseline = props.baseline || 'alphabetic';
      ctx.fillStyle = st; ctx.fillText(str, x, y);
    }
    return k;
  }
  // colour-only modulation (light, shadow) that doesn't change shape ownership
  tint(path, fill, alpha = 1, mode = 'source-over') {
    const P = toPath(path);
    this.cx.save(); this.cx.globalAlpha = alpha; this.cx.globalCompositeOperation = mode;
    this.cx.fillStyle = this._style(this.cx, fill); this.cx.fill(P); this.cx.restore();
  }
  under(blur = 1.5) {
    const c = document.createElement('canvas'); c.width = this.cw; c.height = this.ch;
    const x = c.getContext('2d'); x.filter = `blur(${blur * this.scale}px)`; x.drawImage(this.col, 0, 0); x.drawImage(this.lin, 0, 0);
    return c;
  }
  analyse() {
    if (this.A) return this.A;
    const { cw, ch } = this;
    const cd = this.cx.getImageData(0, 0, cw, ch).data, id = this.ix.getImageData(0, 0, cw, ch).data;
    const N = cw * ch, sidx = new Int32Array(N).fill(-1);
    for (let i = 0; i < N; i++) {
      const c = (id[i * 4] << 16) | (id[i * 4 + 1] << 8) | id[i * 4 + 2];
      if (id[i * 4 + 3] > 250) { const k = this.codes.get(c); if (k != null) sidx[i] = k; }
      else if (id[i * 4 + 3] < 5) sidx[i] = 0;
    }
    // blended edge pixels → a neighbour's shape
    for (let pass = 0; pass < 6; pass++) {
      let left = 0;
      for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
        const i = y * cw + x; if (sidx[i] >= 0) continue;
        const nb = [x > 0 ? i - 1 : -1, x < cw - 1 ? i + 1 : -1, y > 0 ? i - cw : -1, y < ch - 1 ? i + cw : -1];
        let v = -1; for (const j of nb) if (j >= 0 && sidx[j] >= 0) { v = sidx[j]; break; }
        if (v >= 0) sidx[i] = v; else left++;
      }
      if (!left) break;
    }
    const grp = new Int32Array(N);
    for (let i = 0; i < N; i++) grp[i] = sidx[i] > 0 ? this.shapes[sidx[i]].group : 0;
    // distance (in analysis px) to the nearest pixel of another group
    const INF = 1e12, f = new Float64Array(N);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const i = y * cw + x, g = grp[i];
      const b = (x > 0 && grp[i - 1] !== g) || (x < cw - 1 && grp[i + 1] !== g) || (y > 0 && grp[i - cw] !== g) || (y < ch - 1 && grp[i + cw] !== g);
      f[i] = b ? 0 : INF;
    }
    edt2d(f, cw, ch);
    const dist = new Float32Array(N);
    for (let i = 0; i < N; i++) dist[i] = (Math.sqrt(f[i]) + 0.5) / this.scale;
    this.A = { cd, sidx, grp, dist };
    return this.A;
  }
}

// Felzenszwalb & Huttenlocher squared EDT
function edt1d(f, n, d, v, z) {
  let k = 0; v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
function edt2d(g, w, h) {
  const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) f[y] = g[y * w + x];
    edt1d(f, h, d, v, z);
    for (let y = 0; y < h; y++) g[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) f[x] = g[y * w + x];
    edt1d(f, w, d, v, z);
    for (let x = 0; x < w; x++) g[y * w + x] = d[x];
  }
}

const DEG = Math.PI / 180;

// opts: { R: radii coarse→fine, seed, rev(x,y,level), app(x,y,level), spacing, edgeBand, detailThresh }
export function paintRef(ref, opts = {}) {
  const R = opts.R || [56, 34, 20, 12, 7, 4];
  const A = ref.analyse(), { cw, ch, scale } = ref;
  const { cd, sidx, grp, dist } = A;
  const rand = rng(opts.seed || 1);
  const out = new Strokes(8192);
  const cs = 4, covW = Math.ceil(cw / cs), covH = Math.ceil(ch / cs), cov = new Uint8Array(covW * covH);
  const at = (x, y) => { const ix = Math.min(cw - 1, Math.max(0, (x * scale) | 0)), iy = Math.min(ch - 1, Math.max(0, (y * scale) | 0)); return iy * cw + ix; };
  const colAt = (i) => [cd[i * 4] / 255, cd[i * 4 + 1] / 255, cd[i * 4 + 2] / 255];
  const minR = R[R.length - 1];
  const detailThresh = opts.detailThresh || 0.075;
  for (let li = 0; li < R.length; li++) {
    const r = R[li], sp = r * (opts.spacing || 0.95);
    const nx = Math.ceil(ref.w / sp), ny = Math.ceil(ref.h / sp);
    const order = new Int32Array(nx * ny);
    for (let i = 0; i < order.length; i++) order[i] = i;
    for (let i = order.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0; const t = order[i]; order[i] = order[j]; order[j] = t; }
    for (const cell of order) {
      const gx = cell % nx, gy = (cell / nx) | 0;
      const x = (gx + 0.15 + rand() * 0.7) * sp, y = (gy + 0.15 + rand() * 0.7) * sp;
      if (x >= ref.w || y >= ref.h) continue;
      const i = at(x, y), s = sidx[i];
      if (s <= 0) continue;
      const sh = ref.shapes[s], P = sh.props, g = grp[i];
      const maxR = typeof P.maxR === 'function' ? P.maxR(x, y) : (P.maxR || Infinity);
      if (r > maxR * 1.001) continue;
      const firstLevel = li === 0 || R[li - 1] > maxR * 1.001;
      const d = dist[i];
      const edgeMin = P.edge != null ? P.edge : minR;
      const interiorMin = P.minR != null ? P.minR : Math.max(edgeMin, R[Math.min(R.length - 1, Math.max(0, R.findIndex((q) => q <= maxR) + 2))]);
      const covered = cov[(((y * scale) / cs) | 0) * covW + (((x * scale) / cs) | 0)] > 0;
      let need = firstLevel || !covered;
      if (!need && r >= edgeMin && d < r * (opts.edgeBand || 2.4)) need = true;
      if (!need && r >= interiorMin * 0.999) {
        // colour detail at this scale
        const c0 = colAt(i); let dv = 0;
        for (let k = 0; k < 4; k++) {
          const a = k * Math.PI / 2 + 0.4, j = at(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
          if (grp[j] !== g) continue;
          const c1 = colAt(j); dv = Math.max(dv, Math.abs(c1[0] - c0[0]) + Math.abs(c1[1] - c0[1]) + Math.abs(c1[2] - c0[2]));
        }
        if (dv * (P.detail != null ? P.detail : 1) > detailThresh) need = true;
      }
      if (!need) continue;
      // direction: shape's field, bending to the boundary tangent near edges
      let ang;
      const dirP = P.dir != null ? P.dir : 0;
      const base = typeof dirP === 'function' ? dirP(x, y) : dirP === 'edge' ? null : dirP;
      if (base == null || d < r * 3) {
        const e = 2 / scale;
        const gxd = dist[at(x + e, y)] - dist[at(x - e, y)], gyd = dist[at(x, y + e)] - dist[at(x, y - e)];
        const tan = Math.atan2(gyd, gxd) + Math.PI / 2;
        if (base == null) ang = tan;
        else {
          const w = Math.max(0, Math.min(1, 1 - (d - r) / (2 * r))) * (P.edgeFollow != null ? P.edgeFollow : 0.85);
          let dt = tan - base; dt = Math.atan2(Math.sin(dt), Math.cos(dt));
          if (dt > Math.PI / 2) dt -= Math.PI; else if (dt < -Math.PI / 2) dt += Math.PI;
          ang = base + dt * w;
        }
      } else ang = base;
      ang += (rand() * 2 - 1) * (P.aj != null ? P.aj : 13 * DEG);
      const lf = P.len || [1.7, 3.1], wf = P.wid || [0.95, 1.45];
      let len = r * (lf[0] + rand() * (lf[1] - lf[0])), wid = r * (wf[0] + rand() * (wf[1] - wf[0]));
      // confinement: the blade must stay inside its group
      const fits = (L, Wd) => {
        const ca = Math.cos(ang), sa = Math.sin(ang);
        for (const t of [-0.5, -0.25, 0, 0.25, 0.5]) {
          const j = at(x + ca * L * t, y + sa * L * t);
          if (grp[j] !== g || dist[j] < Wd * 0.5 * 0.85 + (Math.abs(t) > 0.4 ? Wd * 0.2 : 0)) return false;
        }
        return true;
      };
      if (!fits(len, wid)) {
        len = r * 1.25;
        if (!fits(len, wid)) {
          if (li < R.length - 1 && r > edgeMin) continue;
          if (d < 0.8) continue;
          wid = Math.min(wid, d * 1.7); len = Math.min(len, Math.max(wid * 1.3, d * 2.6));
          if (!fits(len, wid * 0.6)) { len = wid * 1.2; }
        }
      }
      // colour: centre, and the colour the blade drags in from further along
      const ca = Math.cos(ang), sa = Math.sin(ang);
      let c = colAt(i);
      const j2 = at(x + ca * len * 0.45, y + sa * len * 0.45);
      let c2 = grp[j2] === g ? colAt(j2) : c;
      const jit = P.jit != null ? P.jit : 0.06;
      const vj = 1 + (rand() * 2 - 1) * jit, hj = (rand() * 2 - 1) * jit * 0.35;
      const vary = (q, k) => [Math.min(1, q[0] * k * (1 + hj)), Math.min(1, q[1] * k), Math.min(1, q[2] * k * (1 - hj))];
      c = vary(c, vj); c2 = vary(P.c2 ? hex(P.c2) : c2, vj * (1 + (rand() - 0.5) * jit));
      out.push({
        x, y, ang, len, wid, c, c2, type: P.type != null ? P.type : (opts.T != null ? opts.T : KNIFE),
        taper: P.taper || 0, bend: (rand() - 0.5) * (P.bend != null ? P.bend : 0.12), hgt: (P.hgt != null ? P.hgt : 1) * (0.85 + rand() * 0.3),
        run: P.run != null ? P.run : 0.6, wet: P.wet || 0, gmul: P.gmul != null ? P.gmul : 1,
        rev: opts.rev ? opts.rev(x, y, li, P) : 0, app: opts.app ? opts.app(x, y, li, P) : 0,
        seed: (out.count * 13 + li * 7 + (opts.seed || 0) * 101) % 4096 + rand(),
      });
      // stamp coverage
      const hl = len * 0.42, hw = wid * 0.42;
      const ext = Math.abs(ca) * hl + Math.abs(sa) * hw, eyt = Math.abs(sa) * hl + Math.abs(ca) * hw;
      const x0 = Math.max(0, ((x - ext) * scale / cs) | 0), x1 = Math.min(covW - 1, ((x + ext) * scale / cs) | 0);
      const y0 = Math.max(0, ((y - eyt) * scale / cs) | 0), y1 = Math.min(covH - 1, ((y + eyt) * scale / cs) | 0);
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const px = (xx + 0.5) * cs / scale - x, py = (yy + 0.5) * cs / scale - y;
        const u = px * ca + py * sa, v = -px * sa + py * ca;
        if (Math.abs(u) < hl && Math.abs(v) < hw) cov[yy * covW + xx] = 1;
      }
    }
  }
  // lines on top, in drawing order
  let li = 0;
  for (const L of ref.lines) {
    const P = L.props;
    strokePath(out, L.pts, {
      wid: L.width, c: L.colour, c2: P.c2 ? hex(P.c2) : L.colour, type: P.type != null ? P.type : LINE, step: P.step || Math.max(L.width * 2.2, 6),
      len: P.len, run: P.run != null ? P.run : 0.2, hgt: P.hgt, seed: 3000 + li * 17, gmul: P.gmul, aj: P.aj != null ? P.aj : 0.06,
      rev: opts.rev ? opts.rev(L.pts[0][0], L.pts[0][1], R.length, P) : 0, app: opts.app ? opts.app(L.pts[0][0], L.pts[0][1], R.length, P) : 0,
    });
    li++;
  }
  out.append(ref.extra);
  return out;
}
