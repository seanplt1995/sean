// captions.js — the small guide texts: crisp canvas text over the painting, never knife strokes.
// Noto Serif SC Medium 46 px, line height 1.5, ≤ 16 characters a line, centred at y = 420.

const FONT = '"Noto Serif SC"';
const BODY = '#F3EBDD', DARK = '#2B2420';
const lum = (h) => {
  const n = parseInt(h.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

// break after the punctuation nearest the middle when a caption is longer than a line
function lines(text, max = 16) {
  if ([...text].length <= max) return [text];
  const ch = [...text], mid = ch.length / 2;
  // a full-width space is the natural break in a credit line; otherwise the punctuation nearest the middle
  const sp = ch.indexOf('　');
  if (sp > 0 && sp <= max && ch.length - sp - 1 <= max) return [ch.slice(0, sp).join(''), ch.slice(sp + 1).join('')];
  let best = -1, bd = 1e9;
  ch.forEach((c, i) => { if ('，、：。—'.includes(c) && i < ch.length - 1) { const d = Math.abs(i + 1 - mid); if (d < bd && i + 1 <= max && ch.length - i - 1 <= max) { bd = d; best = i + 1; } } });
  if (best < 0) best = Math.ceil(mid);
  return [ch.slice(0, best).join(''), ch.slice(best).join('')];
}

export class Captions {
  constructor(list, o = {}) {
    this.W = o.W || 1080; this.H = o.H || 1920;
    this.list = list;
    this.cy = o.cy || 420;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.ctx = this.canvas.getContext('2d');
    this.key = '';
    this.mode = o.mode || (() => 'dark');   // (caption, t) → 'dark' | 'light' background behind the band
  }
  async ready() {
    const all = this.list.map((c) => c.text).join('');
    await Promise.all([500, 700].map((w) => document.fonts.load(`${w} 46px ${FONT}`, all)));
  }
  // returns true when the canvas changed
  draw(t) {
    const fade = 0.35;
    const vis = this.list.filter((c) => t >= c.start && t <= c.end);
    const states = vis.map((c) => {
      const a = Math.min(1, (t - c.start) / fade, (c.end - t) / fade);
      let m = this.mode(c, t); if (m === 'dark') m = 1; else if (m === 'light') m = 0;
      return { c, a: Math.max(0, a), rise: 6 * (1 - Math.min(1, (t - c.start) / fade)), m: Math.round(m * 50) / 50 };
    });
    const key = states.map((s) => `${s.c.id}:${s.a.toFixed(3)}:${s.rise.toFixed(2)}:${s.m}`).join('|');
    if (key === this.key) return false;
    this.key = key;
    const x = this.ctx;
    x.clearRect(0, 0, this.W, this.H);
    for (const s of states) this._one(s);
    return true;
  }
  _one({ c, a, rise, m }) {
    const x = this.ctx, size = c.size_px || 46, lh = size * 1.5;
    const light = m < 0.5;
    const mixHex = (a, b, k) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * (1 - k) + parseInt(b.slice(1 + i, 3 + i), 16) * k).toString(16).padStart(2, '0')).join('');
    const body = mixHex(DARK, BODY, m);
    const bg = light ? '#c6b9a3' : '#2b3050';
    const ls = lines(c.text);
    const y0 = this.cy - (ls.length - 1) * lh / 2 + rise;
    x.save();
    x.globalAlpha = a;
    x.textBaseline = 'middle';
    if (m > 0) { x.shadowColor = `rgba(20,16,12,${(0.55 * m).toFixed(3)})`; x.shadowBlur = 8; x.shadowOffsetY = 2; }
    const emph = c.emphasis || [];
    ls.forEach((line, li) => {
      // split into runs: plain / emphasised
      const runs = [];
      let i = 0;
      while (i < line.length) {
        let hit = null;
        for (const e of emph) if (line.startsWith(e.word, i)) { hit = e; break; }
        if (hit) { runs.push({ s: hit.word, e: hit }); i += hit.word.length; }
        else { if (runs.length && !runs[runs.length - 1].e) runs[runs.length - 1].s += line[i]; else runs.push({ s: line[i], e: null }); i++; }
      }
      const style = (r) => {
        if (!r.e) return { w: 500, col: body };
        if (r.e.style === 'bold' || !r.e.color) return { w: 700, col: body };
        // an emphasis colour that can't hold 3:1 against the band becomes bold body colour
        return contrast(r.e.color, bg) >= 3 ? { w: 500, col: r.e.color } : { w: 700, col: body };
      };
      let total = 0;
      for (const r of runs) { const st = style(r); x.font = `${st.w} ${size}px ${FONT}`; r.w = x.measureText(r.s).width; r.st = st; total += r.w; }
      let px = this.W / 2 - total / 2;
      const py = y0 + li * lh;
      for (const r of runs) { x.font = `${r.st.w} ${size}px ${FONT}`; x.fillStyle = r.st.col; x.textAlign = 'left'; x.fillText(r.s, px, py); px += r.w; }
    });
    x.restore();
  }
}
