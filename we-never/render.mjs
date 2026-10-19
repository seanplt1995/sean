#!/usr/bin/env node
/*
 * Frame-exact offline renderer for index.html → MP4 (H.264 + AAC) for Douyin.
 *
 *   node render.mjs --audio "霓虹兔 - We Never.mp3" --out WeNever_1080x1920_60fps.mp4
 *
 * Options
 *   --audio <file>     the master track (required for audio-reactive render; omit for silent demo grid)
 *   --out <file.mp4>   output video (default WeNever_1080x1920_60fps.mp4)
 *   --from <s> --to <s>  time range (default whole track; Douyin cut: --from 9.04 --to 45.04)
 *   --fps <n>          frame rate (default 60)
 *   --q <ultra|high|medium|low>  particle / resolution preset (default high)
 *   --hud <0|1>        burn the telemetry HUD into the video (default 1)
 *   --crf <n>          x264 quality (default 16, lower = better)
 *   --png <dir> --every <n>   instead of a video, dump every n-th frame as PNG (for previews)
 *   --headed           open a visible browser window (uses the real GPU — much faster)
 *   --gpu              headless, but ask Chromium for the hardware GPU
 *
 * Requires: Node 18+, ffmpeg on PATH, and Playwright (npm i playwright && npx playwright install chromium).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

const require = createRequire(import.meta.url);
function loadPlaywright() {
  for (const name of ['playwright', 'playwright-core']) { try { return require(name); } catch (e) { /* try next */ } }
  const root = execSync('npm root -g').toString().trim();
  return require(path.join(root, 'playwright'));
}
const { chromium } = loadPlaywright();

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : d; };
const HERE = path.dirname(fileURLToPath(import.meta.url));
const audioPath = arg('audio', null) ? path.resolve(arg('audio')) : null;
const out = path.resolve(arg('out', 'WeNever_1080x1920_60fps.mp4'));
const fps = Number(arg('fps', 60));
const from = Number(arg('from', 0));
const to = arg('to', null);
const quality = arg('q', 'high');
const hud = String(arg('hud', '1'));
const crf = String(arg('crf', 16));
const pngDir = arg('png', null);
const every = Number(arg('every', 30));
const SIZES = { ultra: [1080, 1920], high: [1080, 1920], medium: [1080, 1920], low: [720, 1280] };
const [W, H] = SIZES[quality] || SIZES.high;

if (audioPath && !fs.existsSync(audioPath)) { console.error('audio not found:', audioPath); process.exit(1); }

let duration = null;
if (audioPath) {
  duration = Number(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${audioPath}"`).toString().trim());
}
const tEnd = to != null ? Number(to) : (duration || 102.48);

// ── ffmpeg sink ──
let ffArgs;
if (pngDir) {
  fs.mkdirSync(pngDir, { recursive: true });
  ffArgs = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', `${W}x${H}`, '-r', String(fps), '-i', '-',
    '-vf', `select='not(mod(n\\,${every}))',scale=in_color_matrix=bt709:in_range=tv,format=rgb24`, '-fps_mode', 'vfr', path.join(pngDir, 'f_%04d.png')];
} else {
  // frames arrive as planar YUV 4:2:0, BT.709 limited range, top-down (converted on the GPU)
  ffArgs = ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'yuv420p', '-s', `${W}x${H}`, '-r', String(fps), '-i', '-'];
  if (audioPath) ffArgs.push('-ss', String(from), '-t', String(tEnd - from), '-i', audioPath);
  ffArgs.push('-map', '0:v');
  if (audioPath) ffArgs.push('-map', '1:a', '-c:a', 'aac', '-b:a', '320k', '-ar', '44100');
  ffArgs.push('-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-profile:v', 'high', '-level:v', '4.2', '-g', String(fps * 2),
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
    '-movflags', '+faststart', '-shortest', out);
}
const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = once(ff, 'close');

// ── tiny static server + frame sink ──
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.flac': 'audio/flac' };
let frames = 0, finished = false;
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/frame') {
    if (url.searchParams.has('done')) { finished = true; ff.stdin.end(); res.end('ok'); return; }
    const chunks = []; for await (const c of req) chunks.push(c);
    const buf = Buffer.concat(chunks);
    if (buf.length !== W * H * 3 / 2) { res.statusCode = 400; res.end('bad frame size ' + buf.length); return; }
    if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
    frames++;
    res.end('ok');
    return;
  }
  if (url.pathname === '/audio' && audioPath) {
    res.setHeader('Content-Type', MIME[path.extname(audioPath).toLowerCase()] || 'application/octet-stream');
    fs.createReadStream(audioPath).pipe(res);
    return;
  }
  const f = path.join(HERE, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!f.startsWith(HERE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; res.end(); return; }
  res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const headed = !!arg('headed', false), gpu = !!arg('gpu', false);
const args = headed || gpu ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ headless: !headed, args });
const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
page.on('console', (m) => console.log('  page>', m.text()));
page.on('pageerror', (e) => { console.error('page error:', e); });

const qs = new URLSearchParams({ render: '1', fps: String(fps), from: String(from), to: String(tEnd), q: quality, hud, post: '/frame' });
if (audioPath) qs.set('audio', '/audio');
const t0 = Date.now();
console.log(`rendering ${W}x${H} @${fps}fps  ${from}s → ${tEnd}s  (${Math.round((tEnd - from) * fps)} frames)  → ${pngDir || out}`);
await page.goto(`http://127.0.0.1:${port}/index.html?${qs}`);
await page.waitForFunction(() => window.__WN_DONE || window.__WN_ERROR, null, { timeout: 0, polling: 1000 });
const err = await page.evaluate(() => window.__WN_ERROR || null);
await browser.close();
server.close();
if (!finished) ff.stdin.end();
await ffDone;
if (err) { console.error('render failed:', err); process.exit(1); }
console.log(`done: ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s → ${pngDir || out}`);
