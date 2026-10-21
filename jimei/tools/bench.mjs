import { serve, browser } from './harness.mjs';
import { spawnSync } from 'node:child_process';
const out = process.argv[2] || '/tmp';
const { server, port } = await serve({ onPost: (p, q, buf) => {
  // RGBA rows bottom-up → PNG
  spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', '1080x1920', '-i', '-', '-vf', 'vflip', `${out}/${q.get('name')}.png`], { input: buf });
} });
const b = await browser();
const page = await b.newPage();
page.on('console', (m) => console.log('page>', m.text()));
page.on('pageerror', (e) => console.log('pageerror', e));
await page.goto(`http://127.0.0.1:${port}/tools/${process.argv[3] || "bench"}.html${process.argv[4] ? "?" + process.argv[4] : ""}`);
await page.waitForFunction(() => window.__R, null, { timeout: 0 });
console.log(await page.evaluate(() => window.__R));
await b.close(); server.close();
