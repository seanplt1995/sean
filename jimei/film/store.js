// store.js — plates are painted once (paintRef) and baked into world-space cache layers on demand.
// drawPlate() picks the sharpest cached layer that covers the view, or paints live when none does.
import { paintRef } from '../engine/plate.js';

export class Store {
  constructor(E, defs) {
    this.E = E; this.defs = defs;
    this.plates = new Map(); this.layers = new Map();
    this.used = new Set();
  }
  plate(name) {
    if (this.plates.has(name)) return this.plates.get(name);
    const d = this.defs[name];
    const info = d.fn();
    const ox = d.x0 || 0, oy = d.y0 != null ? d.y0 : (info.y0 || 0);
    const p = { name, info, w: info.w, h: info.h, ox, oy, rect: [ox, oy, ox + info.w, oy + info.h], M: [1, 0, 0, 1, ox, oy] };
    const t0 = performance.now();
    if (!info.noStrokes) {
      p.strokes = paintRef(info.ref, Object.assign({ R: info.R || [56, 34, 20, 12, 7, 4], seed: d.seed || 1 }, d.paint || {}));
      p.batch = this.E.batch(p.strokes.data());
    }
    p.tex = this.E.texture(info.ref.under(1.5));
    p.ms = Math.round(performance.now() - t0);
    this.plates.set(name, p);
    return p;
  }
  key(name, o) { return `${name}|${o.D}|${(o.sub || []).join(',')}|${(o.revW || []).join(',')}`; }
  // bake (or reuse) a cache layer: o = {D, sub: world rect, revW}
  layer(name, o) {
    const k = this.key(name, o);
    this.used.add(k);
    if (this.layers.has(k)) return this.layers.get(k);
    const p = this.plate(name), E = this.E;
    const rect = o.sub || p.rect;
    const L = E.cache(rect, o.D);
    E.bakeBegin(L);
    E.under(p.tex, p.w, p.h, { rect: p.rect, revW: o.revW, revDur: o.revDur || 0.4, weave: o.weave });
    if (p.batch) E.draw(p.batch, { M: p.M, revW: o.revW, revDur: o.revDur || 0.4 });
    E.bakeEnd();
    L.name = name; L.key = k; L.revW = o.revW;
    this.layers.set(k, L);
    return L;
  }
  // free layers not marked used since the last call
  gc() {
    for (const [k, L] of this.layers) if (!this.used.has(k)) { this.E.release(L); this.layers.delete(k); }
    this.used = new Set();
  }
  viewBox(cam) {
    const z = cam.zoom || 1, r = cam.rot || 0, hw = this.E.W / 2 / z, hh = this.E.H / 2 / z;
    const ex = Math.abs(Math.cos(r)) * hw + Math.abs(Math.sin(r)) * hh, ey = Math.abs(Math.sin(r)) * hw + Math.abs(Math.cos(r)) * hh;
    return [cam.x - ex, cam.y - ey, cam.x + ex, cam.y + ey];
  }
  // draw a plate through cam: the coarsest cached layer that is sharp enough and covers the view, else live
  drawPlate(name, o) {
    const cam = o.cam, need = (cam.zoom || 1) * this.E.ss / 1.12, vb = this.viewBox(cam), p = this.plate(name).rect;
    const vis = [Math.max(vb[0], p[0]), Math.max(vb[1], p[1]), Math.min(vb[2], p[2]), Math.min(vb[3], p[3])];
    if (vis[0] >= vis[2] || vis[1] >= vis[3]) return 'none';
    let sharp = null, soft = null;
    for (const L of this.layers.values()) {
      if (L.name !== name || (o.revW && String(L.revW) !== String(o.revW))) continue;
      const r = L.rect;
      if (vis[0] < r[0] - 1 || vis[1] < r[1] - 1 || vis[2] > r[2] + 1 || vis[3] > r[3] + 1) continue;
      if (L.D >= need) { if (!sharp || L.D < sharp.D) sharp = L; }
      else if (!soft || L.D > soft.D) soft = L;
    }
    const L = sharp || (o.allowSoft ? soft : null);
    if (L) { this.used.add(L.key); this.E.drawCache(L, o); return 'cache'; }
    this.drawLive(name, o);
    return 'live';
  }
  drawLive(name, o) {
    const p = this.plate(name), E = this.E;
    if (o.under !== false) E.under(p.tex, p.w, p.h, Object.assign({}, o, { rect: p.rect, appW: o.uAppW || o.appW, appear: o.uAppear != null ? o.uAppear : o.appear, appDur: o.uAppDur || o.appDur }));
    if (p.batch) E.draw(p.batch, Object.assign({}, o, { M: p.M }));
  }
}
