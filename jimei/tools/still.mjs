#!/usr/bin/env node
// Render stills at given times to PNG (and a contact sheet):  node tools/still.mjs <outdir> t1 t2 …
import { serve, browser } from './harness.mjs';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const [out, ...ts] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const names = [];
const { server, port } = await serve({ onPost: (p, q, buf) => {
  const name = q.get('name');
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1080x1920', '-i', '-', '-vf', 'vflip', `${out}/${name}.png`], { input: buf });
  console.log(`${name}  ${q.get('shot')}  ${q.get('ms')} ms`);
  names.push(`${out}/${name}.png`);
} });
const b = await browser();
const page = await b.newPage({ viewport: { width: 540, height: 960 } });
page.on('console', (m) => { const s = m.text(); if (!s.includes('GL Driver')) console.log('page>', s); });
page.on('pageerror', (e) => console.log('pageerror', e));
const t0 = Date.now();
await page.goto(`http://127.0.0.1:${port}/index.html?still=${ts.join(',')}`);
await page.waitForFunction(() => window.__DONE || window.__ERR, null, { timeout: Number(process.env.STILL_TIMEOUT || 900000), polling: 500 });
const err = await page.evaluate(() => window.__ERR);
if (err) console.log('ERROR', err);
await b.close(); server.close();
if (names.length > 1) {
  const cols = Math.min(names.length, 6);
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...names.flatMap((n) => ['-i', n]), '-filter_complex',
    names.map((_, i) => `[${i}]scale=270:480[s${i}]`).join(';') + ';' + names.map((_, i) => `[s${i}]`).join('') + `xstack=inputs=${names.length}:layout=` +
    names.map((_, i) => `${(i % cols) * 270}_${Math.floor(i / cols) * 480}`).join('|') + ':fill=black', `${out}/sheet.png`]);
}
console.log(`total ${((Date.now() - t0) / 1000).toFixed(1)} s`);
