// e2e.mjs — browser end-to-end tests for core interactive flows.
//
// Complements smoke.mjs (which only checks page load): drives real clicks in
// headless Chrome and asserts game behavior. Started as the regression suite
// for the July 2026 Watch Mode fixes; grow it per-flow as bugs teach us where
// coverage is missing.
//
// Run:  npm run e2e        (needs `npm install` once, and Google Chrome)
// Override the browser binary with CHROME_PATH if Chrome lives elsewhere.
// river-run loads three.js from a CDN, so network access is required.

import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

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

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Click the action button inside a registered watch section
// ("▶ Watch" when idle, "Take Over / Stop" while watching).
async function clickWatchSectionButton(page, gamePrefix) {
  await page.click('#settings-hamburger-btn');
  await sleep(400);
  const clicked = await page.evaluate(prefix => {
    const section = document.getElementById('game-settings-' + prefix + '-watch');
    if (!section) return 'no-section';
    const btn = [...section.querySelectorAll('button')]
      .find(b => /Watch|Take Over|Stop/i.test(b.textContent));
    if (!btn) return 'no-button';
    const label = btn.textContent.trim();
    btn.click();
    return label;
  }, gamePrefix);
  await sleep(400);
  return clicked;
}

const server = await startServer();
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: 'new' });

let failures = 0;
const results = [];

async function test(name, fn) {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(String(err && err.message || err)));
  try {
    await fn(page, pageErrors);
    if (pageErrors.length) throw new Error('uncaught page error(s): ' + pageErrors.join(' | '));
    results.push('✓ ' + name);
    console.log('✓ ' + name);
  } catch (err) {
    failures++;
    results.push('✗ ' + name + ' — ' + err.message);
    console.error('✗ ' + name + '\n    ' + err.message);
  } finally {
    await page.close().catch(() => {});
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// ── Keypad Quest ─────────────────────────────────────────────────────────────

const KQ = base + '/games/keypad-quest/';
const kqState = page => page.evaluate(async () => {
  const { state } = await import('/games/keypad-quest/state.js');
  return {
    autoPlay: state.autoPlay, gameState: state.gameState, mode: state.inputMode,
    t9buf: state.t9buf, kiLen: (document.getElementById('keyboard-input') || { value: '' }).value.length,
    score: state.score, towers: state.towers.length, wave: state.wave
  };
});
// Autoplay progress = it typed ≥2 chars, or already scored / placed a tower.
const kqProgressed = s => s.t9buf.length >= 2 || s.kiLen >= 2 || s.score > 0 || s.towers > 0;

async function kqWaitForProgress(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    last = await kqState(page);
    if (kqProgressed(last)) return last;
    await sleep(500);
  }
  throw new Error('no autoplay progress within ' + timeoutMs + 'ms: ' + JSON.stringify(last));
}

await test('keypad-quest: menu ▶ Watch starts autoplay (scroll mode)', async page => {
  await page.goto(KQ, { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('keypadQuest_autoPlaySpeed', 'fast'); });
  await page.click('#btn-spectate');
  const s = await kqWaitForProgress(page, 10000);
  assert(s.autoPlay === true, 'state.autoPlay should be true, got ' + JSON.stringify(s));
});

await test('keypad-quest: drawer "Take Over / Stop" actually stops the typist', async page => {
  await page.goto(KQ, { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('keypadQuest_autoPlaySpeed', 'fast'); });
  await page.click('#btn-spectate');
  await kqWaitForProgress(page, 10000);

  const label = await clickWatchSectionButton(page, 'keypadQuest');
  assert(/Take Over|Stop/i.test(label), 'expected stop button while watching, got: ' + label);

  const s = await kqState(page);
  assert(s.autoPlay === false, 'state.autoPlay should be false after stop');
  const ls = await page.evaluate(() => localStorage.getItem('keypadQuest_autoPlay'));
  assert(ls === 'false', 'localStorage should be false after stop');

  // The typist must be idle now: no input progress over 2.5s of play time.
  const before = await kqState(page);
  await sleep(2500);
  const after = await kqState(page);
  assert(after.t9buf === before.t9buf && after.score === before.score && after.towers === before.towers,
    'autoplay kept playing after stop: ' + JSON.stringify({ before, after }));
});

await test('keypad-quest: drawer "▶ Watch" starts autoplay mid-game', async page => {
  await page.goto(KQ, { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('keypadQuest_autoPlaySpeed', 'fast'); });
  await page.click('#btn-play'); // manual game, autoplay off
  await sleep(1000);
  const label = await clickWatchSectionButton(page, 'keypadQuest');
  assert(/Watch/i.test(label) && !/Stop/i.test(label), 'expected ▶ Watch button while idle, got: ' + label);
  const s = await kqWaitForProgress(page, 10000);
  assert(s.autoPlay === true, 'state.autoPlay should be true after drawer start');
});

await test('keypad-quest: keyboard-mode autoplay does not cancel itself', async page => {
  await page.goto(KQ, { waitUntil: 'load' });
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('keypadQuest_inputMode', 'keyboard');
    localStorage.setItem('keypadQuest_autoPlaySpeed', 'fast');
  });
  await page.reload({ waitUntil: 'load' });
  await page.click('#btn-spectate');
  const s = await kqWaitForProgress(page, 10000);
  assert(s.autoPlay === true,
    'autoPlay flipped off — synthetic input events are aborting the typist: ' + JSON.stringify(s));
});

// ── River Run ────────────────────────────────────────────────────────────────

const RR = base + '/games/river-run/';
// Top-level `let` bindings in the inline classic script are visible from evaluate.
const rrAutoPlay = page => page.evaluate(() => autoPlay);

await test('river-run: watch + settings sections are registered in the drawer', async page => {
  await page.goto(RR, { waitUntil: 'load' });
  await sleep(1000);
  await page.click('#settings-hamburger-btn');
  await sleep(400);
  const sections = await page.evaluate(() => ({
    watch: !!document.getElementById('game-settings-riverRun-watch'),
    settings: !!document.getElementById('game-settings-riverrun-settings-section')
  }));
  assert(sections.watch, 'riverRun watch section missing from drawer');
  assert(sections.settings, 'riverRun settings (invert drag) section missing from drawer');
});

await test('river-run: start-screen ▶ Watch engages autoplay', async page => {
  await page.goto(RR, { waitUntil: 'load' });
  await sleep(1000);
  await page.evaluate(() => localStorage.clear());
  await page.click('#start-watch-button');
  await sleep(1500);
  assert(await rrAutoPlay(page) === true, 'in-memory autoPlay should be true after ▶ Watch');
  const started = await page.evaluate(() => document.getElementById('message-box').style.display !== 'block');
  assert(started, 'game should have started (start screen still visible)');
});

await test('river-run: drawer "Take Over / Stop" disengages autoplay', async page => {
  await page.goto(RR, { waitUntil: 'load' });
  await sleep(1000);
  await page.click('#start-watch-button');
  await sleep(1000);
  const label = await clickWatchSectionButton(page, 'riverRun');
  assert(/Take Over|Stop/i.test(label), 'expected stop button while watching, got: ' + label);
  assert(await rrAutoPlay(page) === false, 'in-memory autoPlay should be false after stop');
});

// ── Shared drawer: Clear All Game Data must not crash (post-token removal) ──

await test('gallery: Clear All Game Data completes without throwing', async page => {
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.evaluate(() => localStorage.setItem('devMode', 'true'));
  await page.reload({ waitUntil: 'load' });
  page.on('dialog', d => d.accept());
  await page.click('#settings-hamburger-btn');
  await sleep(400);
  await page.evaluate(() => {
    document.querySelector('#settings-panel details')?.setAttribute('open', '');
  });
  await page.click('#clear-data-btn');
  await sleep(700); // toast shows before the reload timer fires
  const toastShown = await page.evaluate(() =>
    [...document.querySelectorAll('div')].some(d => /Cleared \d+ item/.test(d.textContent)));
  assert(toastShown, 'clear-data toast never appeared (KamekoTokens.toast regression?)');
});

// ── Black Hole in One ───────────────────────────────────────────────────────

const BH = base + '/games/black-hole-in-one/';

await test('black-hole-in-one: ☰ menu fully hides an open Town Shop, both directions', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  // Force "resting at Town" directly via the state modules (reaching the tee
  // rock legitimately needs live flight physics) — mirrors the state-import
  // pattern used for keypad-quest above.
  await page.evaluate(async () => {
    const { S, comet } = await import('/games/black-hole-in-one/state.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto(); // close the default start-screen menu so it doesn't intercept the #helpBtn click
    S.mode = 'explore';
    S.phase = 'rest';
    comet.rest = { b: { type: 'tee' } };
  });
  await sleep(200); // render loop's updateTownShop() picks up the forced state
  const shopVisibleBefore = await page.evaluate(() =>
    !document.getElementById('townShop').classList.contains('hidden'));
  assert(shopVisibleBefore, 'Town Shop never appeared after forcing atTown() state — test setup is broken');

  await page.click('#helpBtn');
  const shopHiddenWithMenuOpen = await page.evaluate(() =>
    document.getElementById('townShop').classList.contains('hidden'));
  assert(shopHiddenWithMenuOpen, 'Town Shop still visible behind the ☰ menu (Shop Options Bleed regression)');

  await page.click('#howto h1'); // pointerdown outside any button closes the menu (S.phase !== 'menu')
  await sleep(200);
  const shopVisibleAfter = await page.evaluate(() =>
    !document.getElementById('townShop').classList.contains('hidden'));
  assert(shopVisibleAfter, 'Town Shop did not reappear after closing the menu while still at Town');
});

await test('black-hole-in-one: survival game-over "Try Again" and "Menu" buttons are wired', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    S.mode = 'endless';
    ui.showSurvivalGameOver(3);
  });
  await sleep(100);

  await page.click('#sg-again');
  await sleep(200);
  const restarted = await page.evaluate(() => ({
    overlayHidden: document.getElementById('survGameOver').classList.contains('hidden'),
    barVisible: !document.getElementById('bar').classList.contains('hidden'),
  }));
  assert(restarted.overlayHidden, '🔋 Try Again did not dismiss the survival game-over overlay');
  assert(restarted.barVisible, '🔋 Try Again did not restart the run (game bar still hidden)');

  await page.evaluate(async () => {
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.showSurvivalGameOver(3);
  });
  await sleep(100);
  await page.click('#sg-menu');
  await sleep(200);
  const afterMenu = await page.evaluate(() => ({
    menuOpened: !document.getElementById('howto').classList.contains('hidden'),
    overlayHidden: document.getElementById('survGameOver').classList.contains('hidden'),
  }));
  assert(afterMenu.menuOpened, '☰ Menu did not open the howto/menu screen from the survival game-over overlay');
  assert(afterMenu.overlayHidden,
    '☰ Menu left the survival game-over overlay stacked on top of the menu (same z-index, later in DOM order)');
});

// ── Lab games: free to play, no token labels ────────────────────────────────

await test('black-hole-in-one: running out of fuel mid-flight while aiming does not permanently freeze the comet (FUEL-3)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { S, comet } = await import('/games/black-hole-in-one/state.js');
    const explore = await import('/games/black-hole-in-one/explore.js');
    const { MAX_DRAG } = await import('/games/black-hole-in-one/constants.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    S.mode = 'explore';
    explore.startRun();
    // Freeze mid-flight aim is ON by default (localStorage default) — left untouched.
    S.phase = 'flight';
    S.prevPhase = 'flight';
    comet.vx = 20; comet.vy = -10;
    // Drain the tank to exactly 0 via real launches, same as repeated flicks.
    const dragLen = MAX_DRAG * 0.5;
    while (explore.fuel > 0) explore.launch(dragLen, 0, dragLen);
    // Simulate starting a mid-flight aim (main.js's pointerdown sets exactly
    // this on a real drag) and releasing a real, non-tap drag with no fuel left.
    S.phase = 'aiming';
    S.prevPhase = 'flight';
    explore.launch(dragLen, 0, dragLen);
  });

  const phaseAfterFailedAim = await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    return S.phase;
  });
  assert(phaseAfterFailedAim === 'flight',
    'phase stuck at "' + phaseAfterFailedAim + '" instead of returning to flight — comet is frozen (FUEL-3 regression)');

  const posBefore = await page.evaluate(async () => {
    const { comet } = await import('/games/black-hole-in-one/state.js');
    return { x: comet.x, y: comet.y };
  });
  await sleep(400);
  const posAfter = await page.evaluate(async () => {
    const { comet } = await import('/games/black-hole-in-one/state.js');
    return { x: comet.x, y: comet.y };
  });
  const moved = Math.hypot(posAfter.x - posBefore.x, posAfter.y - posBefore.y) > 0.01;
  assert(moved, 'comet did not drift after running out of fuel mid-aim — it is frozen, not stranded');

  const strandedPulsing = await page.evaluate(() =>
    document.getElementById('restartBtn').classList.contains('stranded'));
  assert(strandedPulsing, 'restart button should pulse red once the tank is empty (FUEL-1 contract)');

  await page.click('#restartBtn');
  await sleep(200);
  const recovered = await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    const explore = await import('/games/black-hole-in-one/explore.js');
    return { phase: S.phase, fuel: explore.fuel, stranded: document.getElementById('restartBtn').classList.contains('stranded') };
  });
  assert(recovered.phase === 'rest', 'restart did not put the comet back to rest at Town, got "' + recovered.phase + '"');
  assert(recovered.fuel > 0, 'restart did not refuel the tank');
  assert(!recovered.stranded, 'restart button is still pulsing after a fresh start');
});

await test('durak-alchemist: Play is free and starts the game', async page => {
  await page.goto(base + '/games/durak-alchemist/', { waitUntil: 'load' });
  const label = await page.$eval('#start-btn', b => b.textContent);
  assert(!label.includes('🪙'), 'start button still shows a token cost: ' + label);
  await page.click('#start-btn');
  await sleep(800);
  const hidden = await page.evaluate(() =>
    getComputedStyle(document.getElementById('start-screen')).display === 'none');
  assert(hidden, 'start screen still visible after Play');
});

await test('durak-tactics: Play is free and starts the game', async page => {
  await page.goto(base + '/games/durak-tactics/', { waitUntil: 'load' });
  const label = await page.$eval('#btn-start', b => b.textContent);
  assert(!label.includes('🪙'), 'start button still shows a token cost: ' + label);
  await page.click('#btn-start');
  await sleep(800);
  const started = await page.evaluate(() =>
    getComputedStyle(document.getElementById('start-screen')).display === 'none');
  assert(started, 'start screen still visible after Play');
});

await browser.close();
server.close();

console.log('');
if (failures) {
  console.error('E2E FAILED: ' + failures + ' test(s).');
  process.exit(1);
}
console.log('E2E passed: ' + results.length + ' test(s).');
