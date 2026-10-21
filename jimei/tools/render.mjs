#!/usr/bin/env node
/*
 * Offline render of 《极美》 → MP4 (H.264 High, yuv420p, AAC 320k), frame-exact at 24 fps.
 *
 *   node tools/render.mjs --audio mix.wav --out 极美_刮刀油画.mp4 [--from 0 --to 5079] [--crf 15]
 *
 * Frames are rendered in headless Chromium (SwiftShader, or --headed for a real GPU), converted to planar
 * YUV on the GPU, and piped to ffmpeg in resumable chunks: re-run the same command after an
 * interruption and it continues from the last finished chunk. --png <dir> --every n writes previews instead.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { serve, browser, ROOT } from './harness.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : d; };
const W = 1080, H = 1920, FPS = 24, TOTAL = 5079;
const audio = arg('audio', null) ? path.resolve(arg('audio')) : null;
const out = path.resolve(arg('out', '极美_刮刀油画.mp4'));
const F0 = Number(arg('from', 0)), F1 = Number(arg('to', TOTAL));
const crf = String(arg('crf', 15)), chunk = Number(arg('chunk', 240));
const pngDir = arg('png', null), every = Number(arg('every', 24));
const parts = out + '.parts';
fs.mkdirSync(parts, { recursive: true });
const partPath = (k, tmp) => path.join(parts, `part_${String(k).padStart(4, '0')}${tmp ? '.tmp' : ''}.mp4`);

// chunks already finished
const firstChunk = Math.floor(F0 / chunk), lastChunk = Math.ceil(F1 / chunk) - 1;
let resume = F0;
if (!pngDir) { let k = firstChunk; while (k <= lastChunk && fs.existsSync(partPath(k))) k++; resume = Math.max(F0, k * chunk); }
if (resume >= F1 && !pngDir) console.log('all chunks done');

let enc = null;
function openChunk(k) {
  const a = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-maxrate', '45M', '-bufsize', '90M', '-profile:v', 'high', '-level:v', '4.2',
    '-g', '48', '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-f', 'mp4', partPath(k, true)];
  const p = spawn('ffmpeg', a, { stdio: ['pipe', 'inherit', 'inherit'] });
  return { p, k, done: once(p, 'close') };
}
async function closeChunk() {
  if (!enc) return;
  enc.p.stdin.end(); await enc.done;
  fs.renameSync(partPath(enc.k, true), partPath(enc.k, false));
  enc = null;
}
let png = null;
if (pngDir) {
  fs.mkdirSync(pngDir, { recursive: true });
  png = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', `${W}x${H}`, '-r', String(FPS), '-start_number', String(resume), '-i', '-',
    '-vf', `select='not(mod(n\\,${every}))',scale=in_color_matrix=bt709:in_range=tv,format=rgb24`, '-fps_mode', 'vfr', path.join(pngDir, 'f_%05d.png')], { stdio: ['pipe', 'inherit', 'inherit'] });
}

const t0 = Date.now();
let done = 0, last = Date.now();
const { server, port } = await serve({
  audio,
  onPost: async (p, q, buf) => {
    if (p !== '/frame') return 'ok';
    const f = Number(q.get('f'));
    if (buf.length !== W * H * 3 / 2) throw new Error('bad frame size ' + buf.length);
    if (png) { if (!png.stdin.write(buf)) await once(png.stdin, 'drain'); }
    else {
      const k = Math.floor(f / chunk);
      if (!enc) enc = openChunk(k);
      if (!enc.p.stdin.write(buf)) await once(enc.p.stdin, 'drain');
      if ((f + 1) % chunk === 0 || f + 1 === F1) await closeChunk();
    }
    done++;
    if (Date.now() - last > 15000 || f + 1 === F1) {
      last = Date.now();
      const el = (Date.now() - t0) / 1000, rate = el / done;
      console.log(`frame ${f + 1}/${F1}  ${q.get('shot')}  ${rate.toFixed(2)} s/frame  eta ${((F1 - f - 1) * rate / 60).toFixed(1)} min`);
    }
    return 'ok';
  },
});

// render in browser sessions; a crash resumes at the start of the unfinished chunk
let f = resume;
while (f < F1) {
  const b = await browser({ headed: !!arg('headed', false), gpu: !!arg('gpu', false) });
  const page = await b.newPage({ viewport: { width: 540, height: 960 } });
  page.on('console', (m) => { const s = m.text(); if (!s.includes('GL Driver')) console.log('  page>', s); });
  let err = null;
  page.on('pageerror', (e) => { err = e; console.error('page error:', e); });
  page.on('crash', () => { err = new Error('page crashed'); });
  try {
    await page.goto(`http://127.0.0.1:${port}/index.html?render=1&fps=${FPS}&f0=${f}&f1=${F1}`);
    await page.waitForFunction(() => window.__DONE || window.__ERR, null, { timeout: 0, polling: 1000 });
    err = err || await page.evaluate(() => window.__ERR);
  } catch (e) { err = e; }
  await b.close().catch(() => {});
  if (!err) { f = F1; break; }
  console.error('session failed:', String(err).slice(0, 400));
  if (enc) { enc.p.stdin.end(); await enc.done.catch(() => {}); fs.rmSync(partPath(enc.k, true), { force: true }); enc = null; }
  let k = Math.floor(f / chunk); while (fs.existsSync(partPath(k))) k++;
  f = k * chunk;
  console.log('restarting at frame', f);
}
server.close();
if (png) { png.stdin.end(); await once(png, 'close'); console.log('previews in', pngDir); process.exit(0); }
await closeChunk();

if (F0 === 0 && F1 === TOTAL) {
  const list = path.join(parts, 'list.txt');
  const files = fs.readdirSync(parts).filter((n) => /^part_\d{4}\.mp4$/.test(n)).sort();
  fs.writeFileSync(list, files.map((n) => `file '${path.join(parts, n)}'`).join('\n') + '\n');
  const mux = ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list];
  if (audio) mux.push('-i', audio);
  mux.push('-map', '0:v', '-c:v', 'copy');
  if (audio) mux.push('-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-ar', '44100', '-t', String(TOTAL / FPS));
  mux.push('-movflags', '+faststart', out);
  const m = spawn('ffmpeg', mux, { stdio: 'inherit' });
  const [code] = await once(m, 'close');
  if (code !== 0) { console.error('mux failed'); process.exit(1); }
  console.log(`done → ${out}  (${((Date.now() - t0) / 60000).toFixed(1)} min)`);
} else console.log(`frames ${F0}–${F1} rendered into ${parts}`);
