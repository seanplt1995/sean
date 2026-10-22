// film.js — 《极美》: which shot owns time t, which cache layers it needs, captions on top.
import { Impasto, Strokes, hex } from '../engine/impasto.js';
import { loadTimeline, TL, B, DUR } from './timeline.js';
import { Store } from './store.js';
import { Captions } from './captions.js';
import { PLATES } from './plates/index.js';
import { SHOTS, captionMode } from './shots.js';

export class Film {
  constructor(canvas, o = {}) {
    this.E = new Impasto(canvas, { W: 1080, H: 1920, ss: 2 });
    this.o = o;
  }
  async init() {
    await loadTimeline(new URL('./timeline.json', import.meta.url));
    await Promise.all([500, 700, 900].map((w) => document.fonts.load(`${w} 64px "Noto Serif SC"`, '极美这首歌')));
    this.store = new Store(this.E, PLATES);
    this.shots = SHOTS.map((s) => Object.assign({}, s, { t0: s.t0 != null ? s.t0 : B(s.b0), t1: s.t1 != null ? s.t1 : B(s.b1) }));
    this.shots[this.shots.length - 1].t1 = DUR;
    this.caps = new Captions(TL.captions, { mode: captionMode });
    await this.caps.ready();
    this.capTex = this.E.texture(this.caps.canvas, { mip: false });
    this.cur = -1;
    this.F = { E: this.E, store: this.store, film: this, S: new Strokes(4096) };
    for (const s of this.shots) if (s.init) s.init(this.F);
  }
  shotAt(t) { let i = this.shots.findIndex((s) => t >= s.t0 && t < s.t1); return i < 0 ? this.shots.length - 1 : i; }
  // before a shot draws: free what neither it nor the next shot needs, then bake what they need
  enter(i) {
    if (i === this.cur) return;
    const needs = [];
    for (const s of [this.shots[i], this.shots[i + 1]]) if (s && s.layers) needs.push(...s.layers(this.F));
    const st = this.store;
    st.used = new Set(needs.map((n) => st.key(n.plate, n)));
    // keep layers the current shot still draws during a transition into shot i
    if (this.cur >= 0 && this.shots[this.cur].layers) for (const n of this.shots[this.cur].layers(this.F)) if (i === this.cur + 1) st.used.add(st.key(n.plate, n));
    st.gc();
    for (const n of needs) st.layer(n.plate, n);
    this.cur = i;
  }
  // mean brightness of the painting behind the caption band (text rows y 360–480, x 160–920)
  bandLuma() {
    const gl = this.E.gl, w = 760, h = 120;
    this._band = this._band || new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.E.fin.fb);
    gl.readPixels(160, this.E.H - 480, w, h, gl.RGBA, gl.UNSIGNED_BYTE, this._band);
    let s = 0, n = 0, d = 0, br = 0;
    for (let i = 0; i < this._band.length; i += 16) { const l = 0.299 * this._band[i] + 0.587 * this._band[i + 1] + 0.114 * this._band[i + 2]; s += l; d += l < 115; br += l > 153; n++; }
    this.bandDark = d / n;   // share of the band too dark for dark text: a trunk or a coat behind part of the line
    this.bandBright = br / n; // share too bright for light text: lit houses, a moon
    return s / n / 255;
  }
  frame(t) {
    const i = this.shotAt(t), shot = this.shots[i];
    this.enter(i);
    const E = this.E;
    E.begin({ clear: shot.clear });
    this.F.t = t; this.F.shot = shot;
    const post = shot.draw(this.F, t) || {};
    E.finish(post);
    const vis = TL.captions.some((c) => t >= c.start && t <= c.end);
    if (this.caps.draw(t, vis ? this.bandLuma() : 0.2, vis ? this.bandDark : 0, vis ? this.bandBright : 0)) E.updateTexture(this.capTex, this.caps.canvas);
    if (this.caps.key) E.overlay(this.capTex, 1);
    return { shot: shot.id, strokes: E.stats.strokes };
  }
}
