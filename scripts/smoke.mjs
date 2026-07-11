// smoke.mjs — page-load smoke test for every page in the arcade (p0-13).
//
// Serves the repo over a local HTTP server, opens every page in headless
// Chrome (the system install, via puppeteer-core — no browser download), and
// fails if any page throws an uncaught error or unhandled rejection at load.
// This is the check the headless unit suite can't do: tests were green while
// tysiacha was unbootable (see roadmap p0-12).
//
// Run:  npm run smoke        (needs `npm install` once, and Google Chrome)
// Override the browser binary with CHROME_PATH if Chrome lives elsewhere.
// Note: pages that load three.js from a CDN (river-run, waterfall, 3d.html)
// need network access, same as production.

import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SETTLE_MS = 1500; // let boot timers / module init run after load

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2'
};

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = path.join(ROOT, urlPath);
      if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function findChrome() {
  return process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

async function collectPages() {
  const pages = ['/', '/3d.html', '/drafts/'];
  const gamesDir = path.join(ROOT, 'games');
  for (const entry of await fs.readdir(gamesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      await fs.access(path.join(gamesDir, entry.name, 'index.html'));
      pages.push('/games/' + entry.name + '/');
    } catch { /* no index.html — not a game page */ }
  }
  return pages;
}

const server = await startServer();
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: 'new' });

let failures = 0;
try {
  for (const pagePath of await collectPages()) {
    const page = await browser.newPage();
    const errors = [];
    const warnings = [];
    page.on('pageerror', err => errors.push(String(err && err.message || err)));
    page.on('console', msg => { if (msg.type() === 'error') warnings.push(msg.text()); });

    try {
      await page.goto(base + pagePath, { waitUntil: 'load', timeout: 20000 });
      await new Promise(r => setTimeout(r, SETTLE_MS));
    } catch (navErr) {
      errors.push('navigation failed: ' + navErr.message);
    }

    if (errors.length) {
      failures++;
      console.error('✗ ' + pagePath);
      errors.forEach(e => console.error('    pageerror: ' + e));
    } else {
      console.log('✓ ' + pagePath + (warnings.length ? '  (' + warnings.length + ' console error(s) — not fatal)' : ''));
    }
    warnings.forEach(w => console.log('    console.error: ' + w));
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}

if (failures) {
  console.error('\nSMOKE FAILED: ' + failures + ' page(s) threw at load.');
  process.exit(1);
}
console.log('\nSmoke passed: every page loads without uncaught errors.');
