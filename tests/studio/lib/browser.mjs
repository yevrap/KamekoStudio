// browser.mjs — a static server and a headless Chrome, for the studio's own use.
//
// `scripts/smoke.mjs` does the same two things for production, and does them
// well. The studio does not import it: it is a top-level script with no exports
// and it lives outside the path guard, so the studio can neither call into it
// nor change it. Standing up a second small server is the cheaper of the two
// honest options — the other being a production exception for a test helper.
// The duplication is registered as TD-007 rather than left implicit.
//
// The Chrome convention is production's, deliberately: the same CHROME_PATH
// override, the same system install, no browser download.

import http from 'node:http';
import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { firstFrame } from './boot-contract.mjs';

const DEFAULT_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json'
};

export function chromePath() {
  return process.env.CHROME_PATH || DEFAULT_CHROME;
}

export function chromeAvailable() {
  return existsSync(chromePath());
}

/** Serves `root` on a loopback port the OS picks. Returns { origin, close }. */
export async function serve(root) {
  const server = http.createServer(async (req, res) => {
    try {
      let urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (urlPath.endsWith('/')) urlPath += 'index.html';
      const filePath = path.join(root, urlPath);
      // A request may not escape the served root, even with a well-formed path.
      if (!filePath.startsWith(root)) { res.writeHead(403); res.end(); return; }
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise(resolve => server.close(resolve))
  };
}

export function launch() {
  return puppeteer.launch({ executablePath: chromePath(), headless: 'new' });
}

/**
 * Every way a page can go wrong at load, collected in one place: an uncaught
 * throw, a rejected promise nobody handled, anything written to console.error,
 * and a request the page made and did not get. A page that boots is a page
 * where this array is empty.
 */
export function collectErrors(page) {
  const errors = [];
  // The throwing file is carried alongside the message, not folded into it: the
  // studio inherits production scripts it may not edit, and "whose error is
  // this" is a question a filter has to be able to answer precisely. Matching
  // on message text cannot — `SecurityError: denied` names no file at all.
  page.on('pageerror', err => errors.push({
    kind: 'uncaught',
    text: `uncaught: ${err.message}`,
    source: firstFrame(err.stack)
  }));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    errors.push({
      kind: 'console',
      text: `console.error: ${msg.text()}`,
      source: msg.location()?.url ?? ''
    });
  });
  page.on('requestfailed', req => {
    // A request the test itself aborted is not the page's failure.
    const reason = req.failure()?.errorText ?? 'failed';
    if (reason !== 'net::ERR_ABORTED') {
      errors.push({ kind: 'request', text: `request failed (${reason}): ${req.url()}`, source: req.url() });
    }
  });
  page.on('response', res => {
    if (res.status() >= 400) errors.push({ kind: 'response', text: `HTTP ${res.status()}: ${res.url()}`, source: res.url() });
  });
  return errors;
}

/** Let module init and any boot timers run, the way the production smoke suite does. */
export const SETTLE_MS = 1200;

export function settle(ms = SETTLE_MS) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
