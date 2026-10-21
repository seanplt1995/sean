// impasto.js — WebGL2 palette-knife renderer.
//
// Every stroke is a quad rasterised into two supersampled buffers: colour (paint, coverage)
// and height (paint thickness, wetness). finish() rakes a light across the height field,
// grades, and box-filters down to W×H.
//
//   const E = new Impasto(canvas, { W: 1080, H: 1920, ss: 2 });
//   E.begin(); E.under(tex, w, h, o); E.draw(batch, o); E.drawNow(f32, o); E.finish(post);
//
// Static paint can be baked once into a world-space cache layer (colour, height, reveal key,
// position along the stroke) and resampled through any camera each frame: drawCache() then
// recomputes the grey → colour re-lay per pixel, so a cached plate still reveals stroke by stroke.
// Software GL (SwiftShader) makes this the difference between minutes and hours per film.

export const KNIFE = 0, BRUSH = 1, DAB = 2, LINE = 3;
export const STRIDE = 24;   // floats per stroke, see Strokes.push

export function hex(s) {
  s = s.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const scalec = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// deterministic PRNG (fixed seeds keep moving paint from boiling)
export function rng(seed) {
  let a = (seed | 0) ^ 0x9e3779b9;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export class Strokes {
  constructor(cap = 1024) { this.f = new Float32Array(cap * STRIDE); this.n = 0; }
  get count() { return this.n; }
  clear() { this.n = 0; return this; }
  _grow() { const g = new Float32Array(this.f.length * 2); g.set(this.f); this.f = g; }
  // {x,y,ang,len,wid,c,c2,type,taper,bend,skew,alpha,hgt,rev,app,seed,gmul,run,wet}
  push(o) {
    if ((this.n + 1) * STRIDE > this.f.length) this._grow();
    const f = this.f, i = this.n * STRIDE, c = o.c || [1, 1, 1], c2 = o.c2 || c;
    const seed = o.seed != null ? o.seed : this.n * 1.618;
    f[i] = o.x; f[i + 1] = o.y; f[i + 2] = o.ang || 0; f[i + 3] = o.len != null ? o.len : 20;
    f[i + 4] = o.wid != null ? o.wid : 10; f[i + 5] = o.type || 0; f[i + 6] = o.taper || 0; f[i + 7] = o.bend || 0;
    f[i + 8] = c[0]; f[i + 9] = c[1]; f[i + 10] = c[2]; f[i + 11] = o.alpha != null ? o.alpha : 1;
    f[i + 12] = c2[0]; f[i + 13] = c2[1]; f[i + 14] = c2[2];
    f[i + 15] = o.skew != null ? o.skew : (hash1(seed) * 2 - 1) * 0.55;
    f[i + 16] = o.hgt != null ? o.hgt : 1; f[i + 17] = o.rev || 0; f[i + 18] = o.app || 0; f[i + 19] = seed % 4096;
    f[i + 20] = o.gmul != null ? o.gmul : 1; f[i + 21] = o.run != null ? o.run : 1; f[i + 22] = o.wet || 0; f[i + 23] = 0;
    this.n++;
    return this;
  }
  append(other) {
    while ((this.n + other.n) * STRIDE > this.f.length) this._grow();
    this.f.set(other.f.subarray(0, other.n * STRIDE), this.n * STRIDE); this.n += other.n;
    return this;
  }
  data() { return this.f.subarray(0, this.n * STRIDE); }
}

// strokes along a polyline (ribbons, wires, trails)
export function strokePath(out, pts, o = {}) {
  const step = o.step || (typeof o.wid === 'number' ? o.wid : 8) * 1.4;
  let acc = 0, k = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    if (L < 1e-6) continue;
    const ang = Math.atan2(dy, dx);
    while (acc <= L) {
      const t = acc / L, s = (o.seed || 0) + k * 3.17;
      const w = typeof o.wid === 'function' ? o.wid(k) : (o.wid || 8);
      out.push({
        x: x0 + dx * t, y: y0 + dy * t, ang: ang + (o.aj ? (hash1(s) - 0.5) * o.aj : 0), len: o.len || step * 1.9, wid: w,
        c: typeof o.c === 'function' ? o.c(k) : o.c, c2: typeof o.c2 === 'function' ? o.c2(k) : o.c2, type: o.type != null ? o.type : KNIFE,
        taper: o.taper || 0, alpha: typeof o.alpha === 'function' ? o.alpha(k) : o.alpha, hgt: o.hgt, run: o.run != null ? o.run : 0.3, seed: s,
        rev: typeof o.rev === 'function' ? o.rev(k) : o.rev, app: typeof o.app === 'function' ? o.app(k) : o.app,
        gmul: o.gmul, wet: o.wet, skew: o.skew,
      });
      acc += step; k++;
    }
    acc -= L;
  }
  return out;
}

// ───────────────────────────── shaders ─────────────────────────────
const NOISE = `
uniform sampler2D uNoise;   // 256² tileable value noise, 4 independent channels
float vn(vec2 p){ return texture(uNoise, p*(1.0/256.0)).r; }
vec4 vn4(vec2 p){ return texture(uNoise, p*(1.0/256.0)); }
vec3 greyOf(vec3 c){ float l=dot(c, vec3(0.299,0.587,0.114)); return vec3(l)*vec3(0.965,0.99,1.045) + (c-vec3(l))*0.05; }
`;

const STROKE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aQ;
layout(location=1) in vec4 a0;   // x y ang len
layout(location=2) in vec4 a1;   // wid type taper bend
layout(location=3) in vec4 a2;   // r g b alpha
layout(location=4) in vec4 a3;   // r2 g2 b2 skew
layout(location=5) in vec4 a4;   // hgt rev app seed
layout(location=6) in vec4 a5;   // gmul run wet -
uniform vec4 uCam;               // cx cy zoom rot
uniform vec2 uView;              // view size in world units at zoom 1
uniform float uSS;               // device px per world px at zoom 1
uniform vec3 uM0, uM1;           // model affine rows
uniform vec4 uRevW, uAppW;       // key mode: (ax, ay, k, mode) 0 per-stroke, 1 radial, 2 linear
uniform vec4 uT;                 // t, reveal, revDur, appear
uniform float uAppDur, uCache;
out vec2 vP;
flat out vec4 vG;    // L, W, taper, bend
flat out vec4 vC1;   // colour, alpha
flat out vec4 vC2;   // colour2, skew
flat out vec4 vX;    // hgt, seed, type, run
flat out vec4 vY;    // revAmt (or key in cache mode), appAmt, gmul, wet
flat out vec3 vS;    // per-stroke randoms
out vec2 vWorld;
float hs(float n){ return fract(sin(n*127.1)*43758.5453); }
void main(){
  vec2 c = vec2(dot(uM0, vec3(a0.xy,1.0)), dot(uM1, vec3(a0.xy,1.0)));
  float ms = sqrt(abs(uM0.x*uM1.y - uM0.y*uM1.x));
  float ang = a0.z + atan(uM1.x, uM0.x);
  float L = a0.w*0.5*ms, W = a1.x*0.5*ms;
  float keyR = a4.y, keyA = a4.z;
  if (uRevW.w == 1.0) keyR += length(c - uRevW.xy)*uRevW.z; else if (uRevW.w == 2.0) keyR += dot(c, uRevW.xy)*uRevW.z;
  else if (uRevW.w == 3.0) keyR += abs(c.y - uRevW.x)*uRevW.z;
  if (uAppW.w == 1.0) keyA += length(c - uAppW.xy)*uAppW.z; else if (uAppW.w == 2.0) keyA += dot(c, uAppW.xy)*uAppW.z;
  if (a5.x <= 0.0) keyR = -30000.0;                 // gmul 0: always in colour
  float revAmt = clamp((uT.x - uT.y - keyR)/max(uT.z,1e-4), 0.0, 1.0);
  float appAmt = clamp((uT.x - uT.w - keyA)/max(uAppDur,1e-4), 0.0, 1.0);
  float pad = 2.0/(uCam.z*uSS);
  float skew = a3.w;
  float hw = W + abs(a1.w)*L + pad;
  vec2 lp;
  if (a1.y == 2.0) lp = aQ*vec2(L*1.15 + pad, W*1.15 + pad);
  else if (a1.y == 3.0) lp = aQ*vec2(L + pad, W + pad);
  else { lp.y = aQ.y*hw; lp.x = aQ.x*(L + pad) - skew*lp.y; }   // sheared to the slanted blade
  float ca = cos(ang), sa = sin(ang);
  vec2 wp = c + vec2(ca*lp.x - sa*lp.y, sa*lp.x + ca*lp.y);
  vec2 d = wp - uCam.xy;
  float cr = cos(-uCam.w), sr = sin(-uCam.w);
  d = vec2(cr*d.x - sr*d.y, sr*d.x + cr*d.y)*uCam.z;
  gl_Position = vec4(d.x/(uView.x*0.5), -d.y/(uView.y*0.5), 0.0, 1.0);
  if (appAmt <= 0.0 || a2.w <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vP = lp; vWorld = wp;
  vG = vec4(L, W, a1.z, a1.w);
  vC1 = a2; vC2 = vec4(a3.xyz, skew);
  vX = vec4(a4.x, a4.w, a1.y, a5.y);
  vY = vec4(uCache > 0.5 ? keyR : revAmt, appAmt, a5.x, a5.z);
  vS = vec3(hs(a4.w*1.37+0.11), hs(a4.w*2.71+0.53), hs(a4.w*0.73+0.97));
}`;

const STROKE_FS = `#version 300 es
precision highp float;
in vec2 vP; in vec2 vWorld;
flat in vec4 vG; flat in vec4 vC1; flat in vec4 vC2; flat in vec4 vX; flat in vec4 vY; flat in vec3 vS;
uniform float uGrey, uAlpha, uRun, uHgt, uHScale, uWet, uCache;
uniform vec4 uTint;      // rgb, amount
uniform vec2 uTintY;     // tint applies where world y in [x, y]
uniform vec2 uTintEx;    // … except where world y in [x, y]
uniform vec4 uClip;      // world clip rect (x0,y0,x1,y1); x0>x1 disables
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oHgt;
layout(location=2) out vec4 oAux;
${NOISE}
void main(){
  vec2 fw = fwidth(vP);
  float aa = max(max(fw.x, fw.y), 1e-4);
  if (uClip.x < uClip.z && (vWorld.x < uClip.x || vWorld.x > uClip.z || vWorld.y < uClip.y || vWorld.y > uClip.w)) discard;
  float L = vG.x, W = vG.y, taper = vG.z, bend = vG.w;
  float seed = vX.y, type = vX.z;
  float x = vP.x, y = vP.y;
  float s1 = vS.x, s2 = vS.y, s3 = vS.z;
  float appAmt = vY.y;
  float cov, h, m, tt;
  if (type < 1.5) {
    // KNIFE (0) / BRUSH (1)
    float t0 = x / L;
    float yy = y - bend * L * (1.0 - t0*t0);
    float xs = x + vC2.w * yy;                         // slanted ends
    tt = xs / L;
    float tp = clamp(tt*0.5+0.5, 0.0, 1.0);
    float hw = W * (1.0 - taper*tp);
    if (type > 0.5) hw *= 0.75 + 0.25*sqrt(max(1.0 - tt*tt*tt*tt, 0.0));
    float dEnd = L - abs(xs);
    if (min(hw*1.04 - abs(yy), dEnd) < -aa) discard;
    vec4 nz = vn4(vec2(tt*2.5 + seed*7.1, sign(yy)*3.0 + seed*3.3));
    hw *= 1.0 + 0.07*(nz.x - 0.5);
    float sv = yy / max(hw, 1e-3);
    float dSide = hw - abs(yy);
    if (type > 0.5) { float e = max(abs(xs) - (L - hw), 0.0); dEnd = min(hw - length(vec2(e, yy)), dEnd + hw); }
    float tpA = tp / max(appAmt, 1e-3);
    float d = min(dSide, dEnd);
    if (appAmt < 1.0) d = min(d, (appAmt - tp) * L * 2.0);   // the knife drags the stroke in from its start
    // streaks across the blade, run-out toward the lift-off end
    vec4 sn = vn4(vec2(sv*5.0 + seed*13.0, tt*0.6 + seed*1.7));
    vec4 sn2 = vn4(vec2(sv*15.0 + seed*5.0, tt*1.2 + seed*0.9));
    float st = sn.r*0.6 + sn2.g*0.4;
    float runAmt = uRun * vX.w * (0.35 + 0.65*s2);
    float rz = smoothstep(0.55, 1.0, min(tpA, 1.0));
    float cut = runAmt * rz * 1.05;
    cov = clamp(d/aa + 0.5, 0.0, 1.0);
    cov *= clamp((st - cut)*(1.0/(fwidth(st)*1.5 + 0.02)) + 0.5, 0.0, 1.0);
    float te = appAmt < 1.0 ? (min(tpA,1.0)*2.0-1.0) : tt;
    if (type < 0.5) {
      float r0 = (te + 0.9)*11.1;
      h = 0.55 + 0.25*s1 + 0.12*te                                 // tilted plane
        + 0.55*exp(-r0*r0)                                         // ridge where the blade pressed
        + 0.85*smoothstep(0.72, 0.97, te)*(1.0 - smoothstep(0.97, 1.0, te)) // lip where it lifted
        + 0.35*smoothstep(0.72, 1.0, abs(sv))                      // squeezed edges
        + 0.16*(st - 0.5);                                         // blade scratches
      h *= 1.0 - 0.45*rz*runAmt;                                    // thin where paint ran out
    } else {
      h = 0.45 + 0.2*s1 + 0.35*(sn2.b - 0.5) + 0.2*(1.0 - abs(sv)) - 0.25*te*te*te*te;
    }
    m = smoothstep(0.35, 0.75, sn.a) * (0.35 + 0.65*tp);
  } else if (type < 2.5) {
    // DAB
    vec2 q = vec2(x / L, y / W);
    float r = length(q);
    if ((1.1 - r)*min(L, W) < -aa) discard;
    vec4 nz = vn4(vec2(atan(q.y, q.x)*1.6 + seed*5.0, seed*3.0));
    r *= 1.0 + 0.12*(nz.x - 0.5);
    float d = min((1.0 - r), (appAmt*1.2 - r)) * min(L, W);
    cov = clamp(d/aa + 0.5, 0.0, 1.0);
    tt = q.x;
    float st = vn(vec2(q.y*6.0 + seed*9.0, q.x*1.5 + seed));
    h = 0.55 + 0.25*s1 + 0.55*(1.0 - r*r) + 0.45*smoothstep(0.6, 0.9, r)*(1.0 - smoothstep(0.9, 1.0, r)) + 0.15*(st - 0.5);
    m = smoothstep(0.3, 0.8, st) * 0.6;
  } else {
    // LINE: thin capsule
    float e = max(abs(x) - (L - W), 0.0);
    float d = W - length(vec2(e, y));
    if (d < -aa) discard;
    float tp = x / L * 0.5 + 0.5;
    if (appAmt < 1.0) d = min(d, (appAmt - tp) * L * 2.0);
    cov = clamp(d/aa + 0.5, 0.0, 1.0);
    tt = x / L;
    h = 0.5 + 0.4*(1.0 - abs(y)/W);
    m = tp;
  }
  float alpha = cov * vC1.a * uAlpha;
  if (alpha < 0.004) discard;
  vec3 col = mix(vC1.rgb, vC2.rgb, m);
  col *= 1.0 + 0.035*(s3 - 0.5) + 0.03*tt*(s1 - 0.5);
  float tpp = clamp(tt*0.5+0.5, 0.0, 1.0);
  float hh = h * vX.x * uHgt * sqrt(max(W, 0.5)) * 0.9 * uHScale;
  if (uCache > 0.5) {   // bake: raw colour; reveal key and position along the blade for drawCache()
    oCol = vec4(col, alpha);
    oHgt = vec4(hh, clamp(vY.w + uWet, 0.0, 1.0), vY.x, alpha);
    oAux = vec4(tpp, 0.0, 0.0, alpha);
    return;
  }
  // grey world / knife re-lay to colour: the colour front travels along the stroke
  float g = uGrey * vY.z;
  if (g > 0.0) {
    float colOn = vY.x >= 1.0 ? 1.0 : clamp((vY.x*1.3 - 0.15 - tpp)*12.0 + 0.5, 0.0, 1.0);
    g *= 1.0 - colOn;
    col = mix(col, greyOf(col), g);
  }
  if (uTint.a > 0.0 && vWorld.y >= uTintY.x && vWorld.y <= uTintY.y) {
    float ex = uTintEx.x < uTintEx.y ? smoothstep(0.0, 140.0, max(uTintEx.x - vWorld.y, vWorld.y - uTintEx.y)) : 1.0;
    col = mix(col, uTint.rgb, uTint.a * ex);
  }
  oCol = vec4(col, alpha);
  oHgt = vec4(hh, clamp(vY.w + uWet + g*0.25, 0.0, 1.0), 0.0, alpha);
  oAux = vec4(tpp, 0.0, 0.0, alpha);
}`;

const QUAD_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aQ;
out vec2 vUV;
void main(){ vUV = aQ*0.5+0.5; gl_Position = vec4(aQ, 0.0, 1.0); }`;

// a world-space rectangle through the camera (underpainting, cache resample)
const RECT_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aQ;
uniform vec4 uCam; uniform vec2 uView; uniform vec4 uRect;   // x0 y0 x1 y1
uniform vec4 uSub;                                           // drawn part of the rect, in its uv
out vec2 vUV; out vec2 vWorld;
void main(){
  vec2 uv = mix(uSub.xy, uSub.zw, aQ*0.5+0.5);
  vec2 wp = mix(uRect.xy, uRect.zw, uv);
  vec2 d = wp - uCam.xy;
  float cr = cos(-uCam.w), sr = sin(-uCam.w);
  d = vec2(cr*d.x - sr*d.y, sr*d.x + cr*d.y)*uCam.z;
  vUV = uv; vWorld = wp;
  gl_Position = vec4(d.x/(uView.x*0.5), -d.y/(uView.y*0.5), 0.0, 1.0);
}`;

// underpainting: the reference, thin, with an optional canvas weave
const UNDER_FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec2 vWorld;
uniform sampler2D uTex;
uniform float uGrey, uAlpha, uWeave, uHScale, uWet, uHgt, uCache;
uniform vec4 uT;         // t reveal revDur -
uniform vec4 uRevW;      // ax ay k mode
uniform vec4 uAppW;      // ax ay k mode ; appear key
uniform vec2 uApp;       // appear start, soft width
uniform vec4 uTint; uniform vec2 uTintY;
uniform vec4 uClip;
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oHgt;
layout(location=2) out vec4 oAux;
${NOISE}
void main(){
  if (uClip.x < uClip.z && (vWorld.x < uClip.x || vWorld.x > uClip.z || vWorld.y < uClip.y || vWorld.y > uClip.w)) discard;
  vec4 tx = texture(uTex, vUV);
  vec3 col = tx.rgb;
  float key = 0.0;
  if (uRevW.w == 1.0) key = length(vWorld - uRevW.xy)*uRevW.z; else if (uRevW.w == 2.0) key = dot(vWorld, uRevW.xy)*uRevW.z;
  else if (uRevW.w == 3.0) key = abs(vWorld.y - uRevW.x)*uRevW.z;
  key += (vn(vWorld*0.02) - 0.5)*uT.z*1.5;
  float a = tx.a * uAlpha;
  if (uAppW.w > 0.0) {
    float k2 = uAppW.w == 1.0 ? length(vWorld - uAppW.xy)*uAppW.z : dot(vWorld, uAppW.xy)*uAppW.z;
    k2 += (vn(vWorld*0.03)-0.5)*0.15;
    a *= clamp((uT.x - uApp.x - k2)/max(uApp.y,1e-3), 0.0, 1.0);
  }
  if (a < 0.004) discard;
  float wv = 0.0;
  if (uWeave > 0.0) { vec2 wq = fract(vWorld*0.3) - 0.5; wv = uWeave*(1.0 - 4.0*abs(wq.x*wq.y)) + uWeave*0.6*vn(vWorld*0.35); }
  float hh = (0.25*uHgt + wv)*uHScale;
  if (uCache > 0.5) { oCol = vec4(col, a); oHgt = vec4(hh, uWet, key, a); oAux = vec4(-1.0, 0.0, 0.0, a); return; }
  float g = uGrey * (1.0 - clamp((uT.x - uT.y - key)/max(uT.z, 1e-3), 0.0, 1.0));
  col = mix(col, greyOf(col), g);
  if (uTint.a > 0.0 && vWorld.y >= uTintY.x && vWorld.y <= uTintY.y) col = mix(col, uTint.rgb, uTint.a);
  oCol = vec4(col, a);
  oHgt = vec4(hh, uWet + g*0.2, 0.0, a);
  oAux = vec4(-1.0, 0.0, 0.0, a);
}`;

// cached layer → paint buffer through the camera, with grey / reveal / tint evaluated per pixel
const CACHE_FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec2 vWorld;
uniform sampler2D uCC, uCH, uCA;
uniform float uHS, uGrey, uAlpha, uWet;
uniform vec4 uT;          // t reveal revDur -
uniform vec4 uTint; uniform vec2 uTintY; uniform vec2 uTintEx;
uniform vec4 uWipeW;      // ax ay k mode (1 radial, 2 linear) — layer appears where key < t - start
uniform vec3 uWipe;       // start, soft, noise
uniform sampler2D uNoise;
layout(location=0) out vec4 oCol;
layout(location=1) out vec4 oHgt;
vec3 greyOf(vec3 c){ float l=dot(c, vec3(0.299,0.587,0.114)); return vec3(l)*vec3(0.965,0.99,1.045) + (c-vec3(l))*0.05; }
void main(){
  vec2 uv = vec2(vUV.x, 1.0 - vUV.y);
  vec4 c = texture(uCC, uv);
  float a = c.a;
  if (a < 0.004) discard;
  vec4 h = texture(uCH, uv) / a;        // cache is premultiplied (baked over transparent)
  float tt = texture(uCA, uv).r / a;
  float wa = 1.0;
  if (uWipeW.w > 0.0) {
    float k = uWipeW.w == 1.0 ? length(vWorld - uWipeW.xy)*uWipeW.z : dot(vWorld, uWipeW.xy)*uWipeW.z;
    k += (texture(uNoise, vWorld*(1.0/700.0)).r - 0.5)*uWipe.z + (texture(uNoise, vWorld*(1.0/90.0)).g - 0.5)*uWipe.z*0.5;
    wa = clamp((uT.x - uWipe.x - k)/max(uWipe.y, 1e-4), 0.0, 1.0);
    if (wa <= 0.0) discard;
  }
  vec3 col = c.rgb / a;
  float g = h.b < -5000.0 ? 0.0 : uGrey;
  if (g > 0.0) {
    float amt = clamp((uT.x - uT.y - h.b)/max(uT.z, 1e-4), 0.0, 1.0);
    float colOn = tt < -0.5 ? amt : (amt >= 1.0 ? 1.0 : clamp((amt*1.3 - 0.15 - tt)*12.0 + 0.5, 0.0, 1.0));
    g *= 1.0 - colOn;
    col = mix(col, greyOf(col), g);
  }
  if (uTint.a > 0.0 && vWorld.y >= uTintY.x && vWorld.y <= uTintY.y) {
    float ex = uTintEx.x < uTintEx.y ? smoothstep(0.0, 140.0, max(uTintEx.x - vWorld.y, vWorld.y - uTintEx.y)) : 1.0;
    col = mix(col, uTint.rgb, uTint.a * ex);
  }
  oCol = vec4(col, a*uAlpha*wa);
  oHgt = vec4(h.r*uHS, clamp(h.g + uWet + g*0.25, 0.0, 1.0), 0.0, a*uAlpha*wa);
}`;

const DOWN_FS = `#version 300 es
precision highp float;
in vec2 vUV; uniform sampler2D uSrc; uniform vec2 uTexel;
out vec4 o;
void main(){
  vec2 t = uTexel;
  float s = texture(uSrc, vUV + t*vec2(-1,-1)).r + texture(uSrc, vUV + t*vec2(1,-1)).r
          + texture(uSrc, vUV + t*vec2(-1,1)).r + texture(uSrc, vUV + t*vec2(1,1)).r;
  o = vec4(s*0.25, 0.0, 0.0, 1.0);
}`;

const FINISH_FS = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uCol, uHgt, uAO1, uAO2;
uniform vec3 uL;           // light, GL row space (y up)
uniform vec4 uLit;         // norm amb dif spec
uniform vec4 uLit2;        // ao shin
uniform vec4 uG1;          // expo sat con vig
uniform vec4 uG2;          // warm lift fade gamma
uniform vec3 uTintC; uniform float uTintA;
uniform vec4 uLight2;      // warm pool: x y (uv) radius strength
uniform vec3 uLight2C;
uniform vec2 uRes;         // output W H
uniform vec2 uSTex;        // one output pixel in uv
out vec4 o;
void main(){
  vec2 uv = vUV, tx = uSTex;
  // the 2×2 supersample block averages with one bilinear fetch at its centre
  vec3 col = texture(uCol, uv).rgb;
  vec4 hC = texture(uHgt, uv);
  float hl = texture(uHgt, uv - vec2(tx.x, 0.0)).r, hr = texture(uHgt, uv + vec2(tx.x, 0.0)).r;
  float hd = texture(uHgt, uv - vec2(0.0, tx.y)).r, hu = texture(uHgt, uv + vec2(0.0, tx.y)).r;
  vec3 n = normalize(vec3((hl - hr)*0.5*uLit.x, (hd - hu)*0.5*uLit.x, 1.0));
  vec3 L = normalize(uL);
  float dif = max(dot(n, L), 0.0);
  vec3 H = normalize(L + vec3(0,0,1));
  float sp = pow(max(dot(n, H), 0.0), uLit2.y) * uLit.w * (0.55 + 0.9*hC.g);
  vec3 c = col*(uLit.y + uLit.z*dif) + vec3(sp)*vec3(1.0, 0.97, 0.92);
  // ambient occlusion: grooves below the local mean get darker
  float hm = mix(texture(uAO1, uv).r, texture(uAO2, uv).r, 0.5);
  c *= clamp(1.0 - uLit2.x*max(hm - hC.r, 0.0)*0.06, 0.55, 1.0);
  if (uLight2.w > 0.0) {
    vec2 dv = (uv - uLight2.xy) * vec2(uRes.x/uRes.y, 1.0);
    c += c*uLight2C*exp(-dot(dv, dv)/(uLight2.z*uLight2.z))*uLight2.w;
  }
  c *= uG1.x;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(lum), c, uG1.y);
  c = (c - 0.5)*uG1.z + 0.5;
  c += vec3(0.03, 0.01, -0.03)*uG2.x;
  c = c*(1.0 - uG2.y) + uG2.y*vec3(0.5);
  c = mix(c, uTintC, uTintA);
  vec2 v = uv - 0.5; v.x *= uRes.x/uRes.y;
  c *= 1.0 - uG1.w*smoothstep(0.25, 0.85, length(v));
  c = pow(max(c, 0.0), vec3(uG2.w));
  c *= 1.0 - uG2.z;
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

const OVER_FS = `#version 300 es
precision highp float;
in vec2 vUV; uniform sampler2D uTex; uniform float uA;
out vec4 o;
void main(){ vec4 t = texture(uTex, vec2(vUV.x, 1.0 - vUV.y)); o = vec4(t.rgb, t.a*uA); }`;

const SHOW_FS = `#version 300 es
precision highp float;
in vec2 vUV; uniform sampler2D uTex; out vec4 o;
void main(){ o = texture(uTex, vUV); }`;

// RGB → planar YUV 4:2:0 (BT.709, limited range), packed 4 bytes per texel; rows top-down
const YUV_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uRes;
out vec4 o;
vec3 rgbAt(int x, int y){ return texelFetch(uTex, ivec2(x, int(uRes.y) - 1 - y), 0).rgb; }
float Yf(vec3 c){ return 16.0 + 219.0*dot(c, vec3(0.2126, 0.7152, 0.0722)); }
void main(){
  int W = int(uRes.x), H = int(uRes.y);
  int px = int(gl_FragCoord.x), row = int(gl_FragCoord.y);
  vec4 r;
  if (row < H) {
    for (int k = 0; k < 4; k++) r[k] = Yf(rgbAt(px*4 + k, row));
  } else {
    int pr = row - H; bool isV = pr >= H/4; if (isV) pr -= H/4;
    int CW = W/2;
    for (int k = 0; k < 4; k++) {
      int i = pr*W + px*4 + k;
      int cy = i / CW, cx = i - cy*CW;
      vec3 c = (rgbAt(cx*2, cy*2) + rgbAt(cx*2+1, cy*2) + rgbAt(cx*2, cy*2+1) + rgbAt(cx*2+1, cy*2+1))*0.25;
      float Y = dot(c, vec3(0.2126, 0.7152, 0.0722));
      r[k] = isV ? 128.0 + 224.0*(c.r - Y)/1.5748 : 128.0 + 224.0*(c.b - Y)/1.8556;
    }
  }
  o = r/255.0;
}`;

function compile(gl, vs, fs) {
  const mk = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      throw new Error('shader: ' + log + '\n' + src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n'));
    }
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}

export const DEFAULT_POST = {
  light: [-0.55, -0.6, 0.7], norm: 3.2, amb: 0.8, dif: 0.28, spec: 0.2, ao: 1.2, shin: 28,
  expo: 1, sat: 1, con: 1, vig: 0.18, warm: 0, lift: 0, fade: 0, gamma: 1, tint: null, glow: null,
};

const key4 = (w) => !w ? [0, 0, 0, 0] : w.length === 4 ? w : [w[0], w[1], w[2], 1];

export class Impasto {
  constructor(canvas, o = {}) {
    this.W = o.W || 1080; this.H = o.H || 1920; this.ss = o.ss || 2;
    canvas.width = this.W; canvas.height = this.H;
    const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true, alpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('EXT_color_buffer_float unavailable');
    gl.getExtension('OES_texture_float_linear');
    this.gl = gl; this.canvas = canvas;
    this.maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.sw = this.W * this.ss; this.sh = this.H * this.ss;
    this.pS = compile(gl, STROKE_VS, STROKE_FS);
    this.pU = compile(gl, RECT_VS, UNDER_FS);
    this.pC = compile(gl, RECT_VS, CACHE_FS);
    this.pD = compile(gl, QUAD_VS, DOWN_FS);
    this.pF = compile(gl, QUAD_VS, FINISH_FS);
    this.pO = compile(gl, QUAD_VS, OVER_FS);
    this.pV = compile(gl, QUAD_VS, SHOW_FS);
    this.pY = compile(gl, QUAD_VS, YUV_FS);
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    this.quadVAO = gl.createVertexArray();
    gl.bindVertexArray(this.quadVAO);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    this.tCol = this._tex(this.sw, this.sh, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
    this.tHgt = this._tex(this.sw, this.sh, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    this.fbPaint = this._fbo([this.tCol, this.tHgt]);
    const single = (w, h, ifmt, fmt, type, filt) => { const t = this._tex(w, h, ifmt, fmt, type, filt); return { t, fb: this._fbo([t]), w, h }; };
    this.ao0 = single(this.sw >> 1, this.sh >> 1, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.LINEAR);
    this.ao1 = single(this.sw >> 2, this.sh >> 2, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.LINEAR);
    this.aoA = single(this.sw >> 3, this.sh >> 3, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.LINEAR);
    this.ao2 = single(this.sw >> 4, this.sh >> 4, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.LINEAR);
    this.fin = single(this.W, this.H, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
    this.yuv = single(this.W / 4, this.H * 3 / 2, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this._batches = [];
    this.dyn = this.batch(new Float32Array(STRIDE * 4096), true);
    this.tNoise = this._noiseTex();
    this.cam = { x: this.W / 2, y: this.H / 2, zoom: 1, rot: 0 };
    this.clearColor = hex('#B9AE9C');
    this.target = null;          // a cache layer while baking
    this.stats = { strokes: 0 };
  }

  _tex(w, h, ifmt, fmt, type, filt) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, fmt, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  _fbo(texs) {
    const gl = this.gl, fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    texs.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    gl.drawBuffers(texs.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('FBO incomplete');
    return fb;
  }

  _noiseTex() {
    const gl = this.gl, N = 256, d = new Uint8Array(N * N * 4);
    for (let ch = 0; ch < 4; ch++) {
      const r = rng(101 + ch * 977), g = new Float32Array(N * N);
      let tot = 0;
      for (let oct = 0, amp = 1; oct < 3; oct++, amp *= 0.5) {
        const c = 16 << oct, lat = new Float32Array(c * c);
        for (let i = 0; i < lat.length; i++) lat[i] = r();
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const fx = x * c / N, fy = y * c / N, ix = Math.floor(fx), iy = Math.floor(fy);
          let u = fx - ix, v = fy - iy; u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
          const a = lat[iy % c * c + ix % c], b = lat[iy % c * c + (ix + 1) % c], cc = lat[(iy + 1) % c * c + ix % c], dd = lat[(iy + 1) % c * c + (ix + 1) % c];
          g[y * N + x] += amp * (a + (b - a) * u + (cc - a) * v + (a - b - cc + dd) * u * v);
        }
        tot += amp;
      }
      for (let i = 0; i < N * N; i++) d[i * 4 + ch] = Math.max(0, Math.min(255, Math.round((g[i] / tot - 0.5) * 1.6 * 255 + 128)));
    }
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    return t;
  }

  // Stroke set in a VAO. SwiftShader pays a large fixed cost per instance, so strokes are
  // expanded to 4 vertices each and drawn as indexed triangles in one call.
  _expand(f32, n, dst) {
    const VS = STRIDE + 2;
    for (let i = 0; i < n; i++) {
      const src = i * STRIDE;
      for (let k = 0; k < 4; k++) {
        const o = (i * 4 + k) * VS;
        dst[o] = (k & 1) ? 1 : -1; dst[o + 1] = (k & 2) ? 1 : -1;
        for (let j = 0; j < STRIDE; j++) dst[o + 2 + j] = f32[src + j];
      }
    }
    return dst;
  }
  _indices(n) {
    if (this._idxN >= n) return;
    const gl = this.gl, idx = new Uint32Array(n * 6);
    for (let i = 0; i < n; i++) { const b = i * 4, o = i * 6; idx[o] = b; idx[o + 1] = b + 1; idx[o + 2] = b + 2; idx[o + 3] = b + 2; idx[o + 4] = b + 1; idx[o + 5] = b + 3; }
    if (!this.ibo) this.ibo = gl.createBuffer();
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    this._idxN = n;
  }
  batch(f32, dynamic = false) {
    if (f32 && f32.data) f32 = f32.data();
    const gl = this.gl, n = dynamic ? 0 : f32.length / STRIDE;
    const cap = dynamic ? f32.length / STRIDE : n;
    this._indices(Math.max(cap, 1));
    const vao = gl.createVertexArray(), buf = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    const VS = STRIDE + 2;
    if (dynamic) gl.bufferData(gl.ARRAY_BUFFER, cap * 4 * VS * 4, gl.DYNAMIC_DRAW);
    else gl.bufferData(gl.ARRAY_BUFFER, this._expand(f32, n, new Float32Array(Math.max(n, 1) * 4 * VS)), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, VS * 4, 0);
    for (let k = 0; k < 6; k++) { gl.enableVertexAttribArray(1 + k); gl.vertexAttribPointer(1 + k, 4, gl.FLOAT, false, VS * 4, 8 + k * 16); }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bindVertexArray(null);
    const b = { vao, buf, n, cap, dynamic };
    this._batches.push(b);
    return b;
  }
  release(b) {
    if (!b) return;
    const gl = this.gl;
    if (b.vao) { gl.deleteVertexArray(b.vao); gl.deleteBuffer(b.buf); this._batches = this._batches.filter((x) => x !== b); }
    if (b.tex) for (const t of b.tex) gl.deleteTexture(t);
    if (b.fb) gl.deleteFramebuffer(b.fb);
  }

  texture(canvas, o = {}) {
    const gl = this.gl, t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, o.mip === false ? gl.LINEAR : gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (o.mip !== false) gl.generateMipmap(gl.TEXTURE_2D);
    return t;
  }
  updateTexture(t, canvas) {
    const gl = this.gl; gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  }

  begin(o = {}) {
    const gl = this.gl;
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbPaint);
    gl.viewport(0, 0, this.sw, this.sh);
    const c = o.clear || this.clearColor;
    gl.clearBufferfv(gl.COLOR, 0, [c[0], c[1], c[2], 1]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 1]);
    this._blend();
    this.stats.strokes = 0;
  }
  _blend() {
    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  }

  // ── cache layers ──
  // rect: world rectangle [x0,y0,x1,y1]; D: cache px per world px (≥ zoom·ss of the shots that use it)
  cache(rect, D) {
    const gl = this.gl;
    const rw = rect[2] - rect[0], rh = rect[3] - rect[1];
    D = Math.min(D, this.maxTex / rw, this.maxTex / rh);
    const w = Math.round(rw * D), h = Math.round(rh * D);
    const tc = this._tex(w, h, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.LINEAR);
    const th = this._tex(w, h, gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT, gl.LINEAR);
    const ta = this._tex(w, h, gl.R16F, gl.RED, gl.HALF_FLOAT, gl.LINEAR);
    const fb = this._fbo([tc, th, ta]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { rect, D, w, h, tex: [tc, th, ta], fb };
  }
  // bake: draws between bakeBegin/bakeEnd go into the layer (camera is ignored)
  bakeBegin(L) {
    const gl = this.gl;
    gl.bindVertexArray(null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, L.fb);
    gl.viewport(0, 0, L.w, L.h);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 0]);
    gl.clearBufferfv(gl.COLOR, 2, [0, 0, 0, 0]);
    this._blend();
    this.target = L;
  }
  bakeEnd() { this.target = null; this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbPaint); this.gl.viewport(0, 0, this.sw, this.sh); }
  drawCache(L, o = {}) {
    const gl = this.gl, { p, u } = this.pC;
    gl.useProgram(p);
    const c = o.cam || this.cam;
    gl.uniform4f(u.uCam, c.x, c.y, c.zoom || 1, c.rot || 0);
    gl.uniform2f(u.uView, this.W, this.H);
    gl.uniform4f(u.uRect, L.rect[0], L.rect[1], L.rect[2], L.rect[3]);
    const R = L.rect, sb = o.sub;
    if (sb) gl.uniform4f(u.uSub, (sb[0] - R[0]) / (R[2] - R[0]), (sb[1] - R[1]) / (R[3] - R[1]), (sb[2] - R[0]) / (R[2] - R[0]), (sb[3] - R[1]) / (R[3] - R[1]));
    else gl.uniform4f(u.uSub, 0, 0, 1, 1);
    const names = ['uCC', 'uCH', 'uCA'];
    L.tex.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u[names[i]], i); });
    gl.uniform1f(u.uHS, (c.zoom || 1) * this.ss / L.D);
    gl.uniform1f(u.uGrey, o.grey || 0);
    gl.uniform1f(u.uAlpha, o.alpha != null ? o.alpha : 1);
    gl.uniform1f(u.uWet, o.wet || 0);
    gl.uniform4f(u.uT, o.t || 0, o.reveal != null ? o.reveal : 1e6, o.revDur || 0.35, 0);
    const ti = o.tint || [0, 0, 0, 0];
    gl.uniform4f(u.uTint, ti[0], ti[1], ti[2], ti[3] || 0);
    const ty = o.tintY || [-1e9, 1e9];
    gl.uniform2f(u.uTintY, ty[0], ty[1]);
    const tx = o.tintEx || [1e9, -1e9];
    gl.uniform2f(u.uTintEx, tx[0], tx[1]);
    const ww = key4(o.wipeW), wp = o.wipe || [0, 0.3, 0];
    gl.uniform4f(u.uWipeW, ww[0], ww[1], ww[2], ww[3]);
    gl.uniform3f(u.uWipe, wp[0], wp[1], wp[2]);
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.tNoise); gl.uniform1i(u.uNoise, 3);
    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  _camU(u, o) {
    const gl = this.gl, L = this.target;
    if (L) {   // baking: the layer's rectangle is the view, D device px per world px
      const r = L.rect;
      gl.uniform4f(u.uCam, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2, 1, 0);
      gl.uniform2f(u.uView, r[2] - r[0], r[3] - r[1]);
      return { zoom: 1, dev: L.D };
    }
    const c = o.cam || this.cam;
    gl.uniform4f(u.uCam, c.x, c.y, c.zoom || 1, c.rot || 0);
    gl.uniform2f(u.uView, this.W, this.H);
    return { zoom: c.zoom || 1, dev: (c.zoom || 1) * this.ss };
  }

  draw(b, o = {}) {
    if (!b || !b.n) return;
    const gl = this.gl, { p, u } = this.pS;
    gl.useProgram(p);
    const c = this._camU(u, o);
    gl.uniform1f(u.uSS, c.dev / c.zoom);
    gl.uniform1f(u.uCache, this.target ? 1 : 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tNoise); gl.uniform1i(u.uNoise, 1);
    const M = o.M || [1, 0, 0, 1, 0, 0];   // a b c d e f : x' = a x + c y + e, y' = b x + d y + f
    gl.uniform3f(u.uM0, M[0], M[2], M[4]); gl.uniform3f(u.uM1, M[1], M[3], M[5]);
    const rw = key4(o.revW), aw = key4(o.appW);
    gl.uniform4f(u.uRevW, rw[0], rw[1], rw[2], rw[3]);
    gl.uniform4f(u.uAppW, aw[0], aw[1], aw[2], aw[3]);
    gl.uniform4f(u.uT, o.t || 0, o.reveal != null ? o.reveal : 1e6, o.revDur || 0.35, o.appear != null ? o.appear : -1e6);
    gl.uniform1f(u.uAppDur, o.appDur || 0.25);
    gl.uniform1f(u.uGrey, o.grey || 0);
    gl.uniform1f(u.uAlpha, o.alpha != null ? o.alpha : 1);
    gl.uniform1f(u.uRun, o.run != null ? o.run : 1);
    gl.uniform1f(u.uHgt, o.hgt != null ? o.hgt : 1);
    gl.uniform1f(u.uWet, o.wet || 0);
    gl.uniform1f(u.uHScale, c.dev * 0.12);
    const ti = o.tint || [0, 0, 0, 0];
    gl.uniform4f(u.uTint, ti[0], ti[1], ti[2], ti[3] || 0);
    const ty = o.tintY || [-1e9, 1e9];
    gl.uniform2f(u.uTintY, ty[0], ty[1]);
    const tx = o.tintEx || [1e9, -1e9];
    gl.uniform2f(u.uTintEx, tx[0], tx[1]);
    const cl = o.clip || [1, 0, 0, 0];
    gl.uniform4f(u.uClip, cl[0], cl[1], cl[2], cl[3]);
    gl.bindVertexArray(b.vao);
    gl.drawElements(gl.TRIANGLES, b.n * 6, gl.UNSIGNED_INT, 0);
    gl.bindVertexArray(null);
    this.stats.strokes += b.n;
  }

  drawNow(f32, o = {}) {
    if (f32 && f32.data) f32 = f32.data();
    if (!f32 || !f32.length) return;
    const gl = this.gl, b = this.dyn, n = f32.length / STRIDE, VS = STRIDE + 2;
    if (!this._dynBuf || this._dynBuf.length < n * 4 * VS) this._dynBuf = new Float32Array(Math.max(n, 4096) * 4 * VS);
    const v = this._expand(f32, n, this._dynBuf).subarray(0, n * 4 * VS);
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.buf);
    if (n > b.cap) { this._indices(n); gl.bufferData(gl.ARRAY_BUFFER, v, gl.DYNAMIC_DRAW); b.cap = n; }
    else gl.bufferSubData(gl.ARRAY_BUFFER, 0, v);
    b.n = n;
    this.draw(b, o);
  }

  under(t, w, h, o = {}) {
    const gl = this.gl, { p, u } = this.pU;
    gl.useProgram(p);
    const c = this._camU(u, o);
    const r = o.rect || [0, 0, w, h];
    gl.uniform4f(u.uRect, r[0], r[1], r[2], r[3]);
    gl.uniform4f(u.uSub, 0, 0, 1, 1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u.uTex, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tNoise); gl.uniform1i(u.uNoise, 1);
    gl.uniform1f(u.uCache, this.target ? 1 : 0);
    gl.uniform1f(u.uGrey, o.grey || 0);
    gl.uniform1f(u.uAlpha, o.alpha != null ? o.alpha : 1);
    gl.uniform1f(u.uWeave, o.weave != null ? o.weave : 0.06);
    gl.uniform1f(u.uHgt, o.hgt != null ? o.hgt : 1);
    gl.uniform1f(u.uHScale, c.dev * 0.12 * 6);
    gl.uniform1f(u.uWet, o.wet || 0);
    gl.uniform4f(u.uT, o.t || 0, o.reveal != null ? o.reveal : 1e6, o.revDur || 0.35, 0);
    const rw = key4(o.revW);
    gl.uniform4f(u.uRevW, rw[0], rw[1], rw[2], rw[3]);
    const aw = key4(o.appW);
    gl.uniform4f(u.uAppW, aw[0], aw[1], aw[2], aw[3]);
    gl.uniform2f(u.uApp, o.appear != null ? o.appear : 0, o.appDur || 0.3);
    const ti = o.tint || [0, 0, 0, 0];
    gl.uniform4f(u.uTint, ti[0], ti[1], ti[2], ti[3] || 0);
    const ty = o.tintY || [-1e9, 1e9];
    gl.uniform2f(u.uTintY, ty[0], ty[1]);
    const cl = o.clip || [1, 0, 0, 0];
    gl.uniform4f(u.uClip, cl[0], cl[1], cl[2], cl[3]);
    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  _pass(prog, fb, w, h) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog.p);
    gl.bindVertexArray(this.quadVAO);
  }

  finish(post = {}) {
    const gl = this.gl, P = Object.assign({}, DEFAULT_POST, post);
    gl.disable(gl.BLEND);
    // height pyramid for ambient occlusion
    const down = (src, dst) => {
      this._pass(this.pD, dst.fb, dst.w, dst.h);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.t || src);
      gl.uniform1i(this.pD.u.uSrc, 0);
      gl.uniform2f(this.pD.u.uTexel, 0.5 / dst.w, 0.5 / dst.h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    down(this.tHgt, this.ao0); down(this.ao0, this.ao1); down(this.ao1, this.aoA); down(this.aoA, this.ao2);
    const { u } = this.pF;
    this._pass(this.pF, this.fin.fb, this.W, this.H);
    const bind = (unit, t, name) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u[name], unit); };
    bind(0, this.tCol, 'uCol'); bind(1, this.tHgt, 'uHgt'); bind(2, this.ao1.t, 'uAO1'); bind(3, this.ao2.t, 'uAO2');
    const L = P.light;
    gl.uniform3f(u.uL, L[0], -L[1], L[2]);
    gl.uniform4f(u.uLit, P.norm, P.amb, P.dif, P.spec);
    gl.uniform4f(u.uLit2, P.ao, P.shin, 0, 0);
    gl.uniform4f(u.uG1, P.expo, P.sat, P.con, P.vig);
    gl.uniform4f(u.uG2, P.warm, P.lift, P.fade, P.gamma);
    const tc = P.tint || [0, 0, 0, 0];
    gl.uniform3f(u.uTintC, tc[0], tc[1], tc[2]); gl.uniform1f(u.uTintA, tc[3] || 0);
    const gw = P.glow || [0, 0, 0.1, 0, 1, 0.7, 0.4];   // x y (0..1 screen, y down) radius strength r g b
    gl.uniform4f(u.uLight2, gw[0], 1 - gw[1], gw[2], gw[3]);
    gl.uniform3f(u.uLight2C, gw[4], gw[5], gw[6]);
    gl.uniform2f(u.uRes, this.W, this.H);
    gl.uniform2f(u.uSTex, 1 / this.W, 1 / this.H);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  // composite a straight-alpha RGBA texture (e.g. the captions canvas) over the finished frame
  overlay(t, a = 1) {
    const gl = this.gl;
    this._pass(this.pO, this.fin.fb, this.W, this.H);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(this.pO.u.uTex, 0);
    gl.uniform1f(this.pO.u.uA, a);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);
  }

  show() {
    const gl = this.gl;
    this._pass(this.pV, null, this.W, this.H);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fin.t); gl.uniform1i(this.pV.u.uTex, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  readYUV(out) {
    const gl = this.gl, y = this.yuv;
    this._pass(this.pY, y.fb, y.w, y.h);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fin.t); gl.uniform1i(this.pY.u.uTex, 0);
    gl.uniform2f(this.pY.u.uRes, this.W, this.H);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
    out = out || new Uint8Array(y.w * y.h * 4);
    gl.readPixels(0, 0, y.w, y.h, gl.RGBA, gl.UNSIGNED_BYTE, out);
    return out;
  }

  readRGBA(out) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fin.fb);
    out = out || new Uint8Array(this.W * this.H * 4);
    gl.readPixels(0, 0, this.W, this.H, gl.RGBA, gl.UNSIGNED_BYTE, out);
    return out;
  }
}
