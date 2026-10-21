// Shared bits for the offline tools: a static server with a frame sink, and a SwiftShader Chromium.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
export function playwright() {
  for (const name of ['playwright', 'playwright-core']) { try { return require(name); } catch (e) { /* next */ } }
  return require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.woff2': 'font/woff2', '.flac': 'audio/flac', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.mp3': 'audio/mpeg', '.png': 'image/png' };

// onPost(pathname, searchParams, Buffer) → string | Promise<string>
export async function serve({ audio, onPost }) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    if (req.method === 'POST') {
      const chunks = []; for await (const c of req) chunks.push(c);
      try { res.end(String(await onPost(url.pathname, url.searchParams, Buffer.concat(chunks)) ?? 'ok')); }
      catch (e) { res.statusCode = 500; res.end(String(e)); }
      return;
    }
    if (url.pathname === '/audio' && audio) {
      res.setHeader('Content-Type', MIME[path.extname(audio).toLowerCase()] || 'application/octet-stream');
      fs.createReadStream(audio).pipe(res); return;
    }
    const f = path.join(ROOT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; res.end(); return; }
    res.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream');
    fs.createReadStream(f).pipe(res);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, port: server.address().port };
}

export async function browser({ headed = false, gpu = false } = {}) {
  const { chromium } = playwright();
  const args = headed || gpu ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-background-timer-throttling', '--disable-renderer-backgrounding']
    : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling', '--js-flags=--max-old-space-size=8192'];
  return chromium.launch({ headless: !headed, args });
}
