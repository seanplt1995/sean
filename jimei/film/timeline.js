// timeline.js — the beat grid and the cut list. Every event in the film is written in beats (b#);
// seconds come from the measured grid in timeline.json (librosa, 76 BPM, 256 beats).

export let TL = null;
export async function loadTimeline(url = new URL('./timeline.json', import.meta.url)) {
  TL = await (await fetch(url)).json();
  return TL;
}

export const DUR = 211.63, FPS = 24, FRAMES = 5079;
export const PERIOD = 0.7895;

// time of beat n (fractional beats interpolate; beyond the grid extrapolate at 76 BPM)
export function B(n) {
  const g = TL.song.beats_s, N = g.length;
  if (n <= 0) return g[0] + n * PERIOD;
  if (n >= N - 1) return g[N - 1] + (n - (N - 1)) * PERIOD;
  const i = Math.floor(n), f = n - i;
  return g[i] + (g[i + 1] - g[i]) * f;
}
// fractional beat at time t
export function beatAt(t) {
  const g = TL.song.beats_s, N = g.length;
  if (t <= g[0]) return (t - g[0]) / PERIOD;
  if (t >= g[N - 1]) return N - 1 + (t - g[N - 1]) / PERIOD;
  let lo = 0, hi = N - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (g[m] <= t) lo = m; else hi = m; }
  return lo + (t - g[lo]) / (g[lo + 1] - g[lo]);
}

// easing
export const clamp01 = (x) => Math.max(0, Math.min(1, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const easeOut = (t) => { t = clamp01(t); return 1 - (1 - t) * (1 - t) * (1 - t); };
export const easeIn = (t) => { t = clamp01(t); return t * t * t; };
export const easeInOut = (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
// progress of t through [a, b]
export const prog = (t, a, b) => clamp01((t - a) / (b - a));
// damped overshoot after an event at t0 (action → follow-through): 0 before, ~1.16 peak, settles to 1
export const spring = (t, t0, dur = 0.3) => {
  if (t < t0) return 0;
  const x = (t - t0) / dur * 0.45;
  return 1 - Math.exp(-4 * x) * Math.cos(7 * x);
};
