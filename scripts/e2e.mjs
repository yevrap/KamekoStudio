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

// Restart Game must never freeze the river (arcade 🐞 p0-17, studio SHS-066). The
// music restart used to call `musicSequence.stop()` after game over had stopped the
// Tone Transport; now and then Tone threw, `initGame` aborted before the game loop,
// and since the old sequence was never disposed every later restart froze too.
// A run counts as started when its game loop is scheduled and the Transport plays.
const rrRunStarted = page => page.waitForFunction(
  () => !isGameOver && animationFrameId != null && Tone.Transport.state === 'started',
  { timeout: 5000, polling: 20 });

async function rrRestarts(page, pageErrors, runs) {
  await page.click('#start-button');
  await rrRunStarted(page).catch(() => { throw new Error('run 1 did not start its game loop and music'); });
  for (let run = 2; run <= runs; run++) {
    // A short run, ended the way a rock ends it, then Restart Game. Uneven run
    // lengths, because the natural throw depended on where the Transport stopped.
    await sleep(20 + (run * 37) % 180);
    await page.evaluate(() => gameOver());
    await page.click('#start-button');
    await rrRunStarted(page).catch(() => {
      throw new Error('restart ' + run + ' froze: no game loop or no music' +
        (pageErrors.length ? ' — ' + pageErrors[0] : ''));
    });
    assert(!pageErrors.length, 'restart ' + run + ' threw: ' + pageErrors.join(' | '));
  }
}

await test('river-run: twenty restarts in a row each start the game loop and the music (SHS-066, p0-17)', async (page, pageErrors) => {
  await page.goto(RR, { waitUntil: 'load' });
  await sleep(1000);
  await rrRestarts(page, pageErrors, 20);
  // The music is the restarted sequence alone: 90 bpm quarter notes are two or
  // three in 1.5 s, and old sequences left on the Transport would add to them.
  const notes = await page.evaluate(() => new Promise(resolve => {
    let n = 0;
    const play = musicSynth.triggerAttackRelease.bind(musicSynth);
    musicSynth.triggerAttackRelease = (...args) => { n++; return play(...args); };
    setTimeout(() => resolve(n), 1500);
  }));
  assert(notes > 0, 'no music note played after the twentieth restart');
  assert(notes <= 4, notes + ' notes in 1.5 s: earlier runs\' sequences are still playing');
});

await test('river-run: restarts run even when Sequence.stop throws on a stopped Transport (SHS-066)', async (page, pageErrors) => {
  await page.goto(RR, { waitUntil: 'load' });
  await sleep(1000);
  // The fault made certain: what Tone did now and then, it now does every time.
  await page.evaluate(() => {
    const stop = Tone.Sequence.prototype.stop;
    Tone.Sequence.prototype.stop = function (...args) {
      if (Tone.Transport.state !== 'started') throw new RangeError('SHS-066 test: stop on a stopped Transport');
      return stop.apply(this, args);
    };
  });
  await rrRestarts(page, pageErrors, 5);
});

await test('river-run: a music restart that fails still starts the run (SHS-066)', async (page, pageErrors) => {
  await page.goto(RR, { waitUntil: 'load' });
  await sleep(1000);
  await page.click('#start-button');
  await rrRunStarted(page);
  await page.evaluate(() => gameOver());
  // Every music call the restart makes fails; the run must start without music.
  await page.evaluate(() => {
    Tone.Transport.start = () => { throw new Error('SHS-066 test: the Transport will not start'); };
  });
  await page.click('#start-button');
  await page.waitForFunction(() => !isGameOver && animationFrameId != null, { timeout: 5000, polling: 20 })
    .catch(() => { throw new Error('a failed music restart kept the run from starting' +
      (pageErrors.length ? ' — ' + pageErrors[0] : '')); });
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

await test('black-hole-in-one: Golf running out of fuel shows a non-blocking round-over summary, never a full-screen modal (FUEL-9/GOLF-7)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    S.mode = 'endless';
    S.hole = 3;
    S.fuel = 0;
  });
  await sleep(200); // next frame's central stranded check (main.js) picks this up

  const stranded = await page.evaluate(() => ({
    glow: document.getElementById('restartBtn').classList.contains('stranded'),
    panelHidden: document.getElementById('roundOverPanel').classList.contains('hidden'),
    holeText: document.getElementById('ro-hole').textContent,
    canvasVisible: getComputedStyle(document.getElementById('game')).display !== 'none',
  }));
  assert(stranded.glow, 'restart button should pulse red once Golf is out of fuel (FUEL-1 contract extended to Golf)');
  assert(!stranded.panelHidden, 'Golf should show the non-blocking round-over summary on fuel-out');
  assert(stranded.holeText.includes('3'), 'round-over summary should show the hole reached, got "' + stranded.holeText + '"');
  assert(stranded.canvasVisible, 'the game canvas must stay visible — no mode may ever force-block the screen on fuel-out (FUEL-9/GOLF-7)');

  // ✕ Dismiss only hides the card — it's not a recovery action, so the player
  // stays stranded (glow persists) until Restart, New Map, or the item toggle.
  await page.click('#ro-dismiss');
  await sleep(100);
  const afterDismiss = await page.evaluate(() => ({
    panelHidden: document.getElementById('roundOverPanel').classList.contains('hidden'),
    glow: document.getElementById('restartBtn').classList.contains('stranded'),
  }));
  assert(afterDismiss.panelHidden, '✕ Dismiss did not hide the round-over summary');
  assert(afterDismiss.glow, 'dismissing the summary must not by itself un-strand the player — restart button should still pulse');
});

await test("black-hole-in-one: the round-over summary's own ↺ Restart button recovers exactly like the persistent button (FUEL-9/GOLF-7)", async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    S.mode = 'endless';
    S.hole = 3;
    S.fuel = 0;
  });
  await sleep(200);
  await page.click('#ro-restart');
  await sleep(200);
  const after = await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    return {
      fuel: S.fuel, hole: S.hole,
      glow: document.getElementById('restartBtn').classList.contains('stranded'),
      panelHidden: document.getElementById('roundOverPanel').classList.contains('hidden'),
    };
  });
  assert(after.fuel > 0, "the summary's ↺ Restart did not refuel the tank");
  assert(after.hole === 1, "the summary's ↺ Restart did not reset to hole 1");
  assert(!after.glow, "the summary's ↺ Restart did not clear the stranded glow");
  assert(after.panelHidden, "the summary's ↺ Restart did not hide itself");
});

await test("black-hole-in-one: the round-over summary's own 🔄 New Map button rerolls and hides the card (fuel is untouched, same reroll-not-restart contract as GEN-1) (FUEL-9/GOLF-7)", async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    S.mode = 'endless';
    S.hole = 3;
    S.fuel = 0;
  });
  await sleep(200);
  await page.click('#ro-newmap');
  await sleep(150);
  const after = await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    return { fuel: S.fuel, hole: S.hole, panelHidden: document.getElementById('roundOverPanel').classList.contains('hidden') };
  });
  assert(after.hole === 3, "the summary's 🔄 New Map should reroll the SAME hole number, not advance it (GEN-1 contract)");
  assert(after.fuel === 0, "the summary's 🔄 New Map leaves fuel untouched, same as GEN-1's existing reroll-not-restart contract");
  assert(after.panelHidden, "the summary's 🔄 New Map did not hide the card");
});

await test('black-hole-in-one: the ☰ Settings Inventory section is reachable in Golf (not just Explore), and toggling ♾️ Endless Flight on while stranded instantly clears the stranded state (FUEL-9/GOLF-7)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    S.mode = 'endless';
    S.hole = 2;
    S.fuel = 0;
  });
  await sleep(200);
  const strandedBefore = await page.evaluate(() => ({
    glow: document.getElementById('restartBtn').classList.contains('stranded'),
    panelHidden: document.getElementById('roundOverPanel').classList.contains('hidden'),
  }));
  assert(strandedBefore.glow && !strandedBefore.panelHidden, 'test setup: Golf should be stranded before the rescue toggle');

  // Real click through the ☰ menu, same path a stranded player would use —
  // not a direct state poke — since FUEL-9/GOLF-7 specifically requires the
  // toggle be reachable "via the ☰ menu, reachable from any mode."
  await page.click('#settingsBtn');
  await sleep(100);
  const checkboxVisible = await page.evaluate(() =>
    !!document.querySelector('input[data-item="endlessFlight"]'));
  assert(checkboxVisible, '♾️ Endless Flight checkbox is not reachable from Golf\'s ☰ Settings tab — the rescue toggle has nothing to click');
  await page.click('input[data-item="endlessFlight"]');
  await sleep(100);
  await page.click('#howto-close');
  await sleep(200);

  const rescued = await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    return {
      fuel: S.fuel,
      enabled: S.inventory.endlessFlight.enabled,
      glow: document.getElementById('restartBtn').classList.contains('stranded'),
      panelHidden: document.getElementById('roundOverPanel').classList.contains('hidden'),
    };
  });
  assert(rescued.enabled, 'clicking the checkbox did not enable Endless Flight');
  assert(!rescued.glow, 'toggling Endless Flight on did not clear the stranded glow');
  assert(rescued.panelHidden, 'toggling Endless Flight on did not hide the round-over summary');
  assert(rescued.fuel > 0, 'toggling Endless Flight on should also top off the Golf tank (mirrors Explore\'s refuelFull() on the same toggle)');

  // The checkbox click persists blackHoleInOne_inventory to localStorage, which
  // survives a page.goto reload (same origin) — clear it so this doesn't leak
  // Endless Flight into every other black-hole-in-one test that runs after this
  // one in the same e2e pass.
  await page.evaluate(() => localStorage.clear());
});

await test('black-hole-in-one: Custom Map running out of fuel gets glow+toast but never the Golf round-over summary (no scorecard concept) (FUEL-9/GOLF-7)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { S, world } = await import('/games/black-hole-in-one/state.js');
    const game = await import('/games/black-hole-in-one/gameplay.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    const teeRock = { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' };
    const blackHole = { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' };
    game.startCustomMap({ teeRock, blackHole, bodies: [], pickups: [] });
    S.fuel = 0;
  });
  await sleep(200);
  const stranded = await page.evaluate(() => ({
    glow: document.getElementById('restartBtn').classList.contains('stranded'),
    panelHidden: document.getElementById('roundOverPanel').classList.contains('hidden'),
  }));
  assert(stranded.glow, 'restart button should pulse red once Custom Map is out of fuel');
  assert(stranded.panelHidden, 'Custom Map must never show the Golf-only round-over summary — it has no round/scorecard concept');
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

await test('black-hole-in-one: restarting a custom/shared map reloads that same map instead of a random golf hole (FUEL-4)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { world } = await import('/games/black-hole-in-one/state.js');
    const game = await import('/games/black-hole-in-one/gameplay.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    // A hand-authored map with a distinctive marker planet + one fuel pickup —
    // real custom-map play (My Maps ▶ Play / a ?map= share link) hands
    // startCustomMap() an object shaped exactly like this.
    game.startCustomMap({
      teeRock: { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' },
      blackHole: { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' },
      bodies: [{ x: 50, y: 90, r: 8, m: 64, type: 'planet', pal: { base: '#fff', dark: '#000' }, marker: 'fuel-4-e2e' }],
      pickups: [{ x: 40, y: 40, r: 1.2, type: 'fuel' }],
    });
    // Simulate having collected the pickup mid-play, same as flying through it.
    world.pickups.length = 0;
  });

  await page.click('#restartBtn');
  await sleep(200);

  const after = await page.evaluate(async () => {
    const { S, world } = await import('/games/black-hole-in-one/state.js');
    return {
      mode: S.mode,
      hasMarkerPlanet: world.bodies.some(b => b.marker === 'fuel-4-e2e'),
      pickupCount: world.pickups.length,
    };
  });
  assert(after.mode === 'custom', 'restart dropped the player out of custom mode entirely, got mode "' + after.mode + '"');
  assert(after.hasMarkerPlanet,
    'restart discarded the custom map and generated a random golf hole instead (FUEL-4 regression) — marker planet is gone');
  assert(after.pickupCount === 1,
    'restart did not reset the map\'s pickups back to their original layout, got ' + after.pickupCount);
});

await test('black-hole-in-one: fuel bar visibly ticks down while flying a custom map (FUEL-6/7/8)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const game = await import('/games/black-hole-in-one/gameplay.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    // Leave leftover golf fuel behind, same as a real player switching from
    // Endless into a custom map — FUEL-8 must still reset to full on entry.
    const { S } = await import('/games/black-hole-in-one/state.js');
    S.fuel = 7;
    game.startCustomMap({
      teeRock: { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' },
      blackHole: { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' },
      bodies: [], pickups: [],
    });
    ui.updateBar();
  });

  const beforeLaunch = await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    return { fuel: S.fuel, barWidth: document.getElementById('endlessFuelBar').style.width };
  });
  assert(beforeLaunch.fuel === 100, 'FUEL-8: custom map must start at full fuel, not the leftover golf value');
  assert(beforeLaunch.barWidth === '100%', 'FUEL-7: fuel bar must render the reset fuel value, got ' + beforeLaunch.barWidth);

  const afterLaunch = await page.evaluate(async () => {
    const { S, world, comet } = await import('/games/black-hole-in-one/state.js');
    const game = await import('/games/black-hole-in-one/gameplay.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    comet.rest = { b: world.teeRock, ang: -Math.PI / 2 };
    game.placeOnRest();
    comet.vx = comet.vy = 0;
    S.phase = 'rest';
    game.launch(0, -1, 100); // full-power drag
    ui.updateBar();
    return { fuel: S.fuel, barWidth: document.getElementById('endlessFuelBar').style.width };
  });
  assert(afterLaunch.fuel < 100, 'FUEL-6: fuel must drain on a custom-map launch, got ' + afterLaunch.fuel);
  assert(afterLaunch.barWidth === afterLaunch.fuel + '%',
    'FUEL-7: fuel bar DOM width must track S.fuel in custom mode, got width ' + afterLaunch.barWidth + ' for fuel ' + afterLaunch.fuel);
});

await test('black-hole-in-one: 🔄 New Map rerolls the current hole in Golf, keeping hole/fuel/score (GEN-1)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    const game = await import('/games/black-hole-in-one/gameplay.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    game.startRun('endless');
    S.hole = 4;
    game.genHole(4);
    S.fuel = 63;
    S.totalDiff = 5;
    S.phase = 'flight'; // reroll must work mid-flight
  });

  const visible = await page.evaluate(() =>
    !document.getElementById('newMapBtn').classList.contains('hidden'));
  assert(visible, '🔄 New Map button should be visible in Golf/Endless mode');

  await page.click('#newMapBtn');
  await sleep(200);

  const after = await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    return { hole: S.hole, fuel: S.fuel, totalDiff: S.totalDiff, phase: S.phase, strokes: S.strokes };
  });
  assert(after.hole === 4, 'New Map changed the hole number — should reroll the same hole, not advance/restart, got ' + after.hole);
  assert(after.fuel === 63, 'New Map should not touch fuel, got ' + after.fuel);
  assert(after.totalDiff === 5, 'New Map should not touch the run total, got ' + after.totalDiff);
  assert(after.phase === 'rest', 'New Map should land the comet back at rest, got "' + after.phase + '"');
  assert(after.strokes === 0, 'the rerolled hole should start with a clean stroke count, got ' + after.strokes);
});

await test('black-hole-in-one: 🔄 New Map regenerates the Explore world under a fresh seed, keeping fuel (GEN-1)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    const explore = await import('/games/black-hole-in-one/explore.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    explore.startRun();
    S.mode = 'explore';
    explore.launch(0, -1, 40); // spend some fuel with a real shot
  });

  const before = await page.evaluate(async () => {
    const explore = await import('/games/black-hole-in-one/explore.js');
    return { seed: explore.worldSeed, fuel: explore.fuel };
  });
  assert(before.fuel < 100, 'test shot did not actually spend fuel, got ' + before.fuel);

  await page.click('#newMapBtn');
  await sleep(200);

  const after = await page.evaluate(async () => {
    const { S, comet, world } = await import('/games/black-hole-in-one/state.js');
    const explore = await import('/games/black-hole-in-one/explore.js');
    return { seed: explore.worldSeed, fuel: explore.fuel, phase: S.phase, restsOnTee: comet.rest && comet.rest.b === world.teeRock };
  });
  assert(after.seed !== before.seed, 'New Map did not change the explore world seed');
  assert(after.fuel === before.fuel, 'New Map should not touch fuel in Explore, got ' + after.fuel + ' vs ' + before.fuel);
  assert(after.phase === 'rest', 'New Map should land the comet back at rest, got "' + after.phase + '"');
  assert(after.restsOnTee, 'New Map should place the comet back on the home tee in the regenerated world');
});

await test('black-hole-in-one: 🔄 New Map falls back to a fresh Endless round in Custom Map (GEN-1, same fallback as FUEL-4)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.evaluate(async () => {
    const game = await import('/games/black-hole-in-one/gameplay.js');
    const ui = await import('/games/black-hole-in-one/ui.js');
    ui.hideHowto();
    game.startCustomMap({
      teeRock: { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' },
      blackHole: { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' },
      bodies: [], pickups: [],
    });
  });

  await page.click('#newMapBtn');
  await sleep(200);

  const after = await page.evaluate(async () => {
    const { S } = await import('/games/black-hole-in-one/state.js');
    return {
      mode: S.mode,
      barHidden: document.getElementById('customBar').classList.contains('hidden'),
      endlessBarVisible: !document.getElementById('bar').classList.contains('hidden'),
    };
  });
  assert(after.mode === 'endless', 'New Map in Custom Map should fall back to Endless, got mode "' + after.mode + '"');
  assert(after.barHidden, 'the custom-map HUD bar should be hidden after falling back to Endless');
  assert(after.endlessBarVisible, 'the endless HUD bar should be visible after falling back to Endless');
});

await test('black-hole-in-one: 🔄 New Map is hidden while authoring a map in the editor (GEN-1)', async page => {
  await page.goto(BH, { waitUntil: 'load' });
  await page.click('#modeEditor');
  await page.click('#mapSizeSmall');
  await sleep(200);

  const hidden = await page.evaluate(() =>
    document.getElementById('newMapBtn').classList.contains('hidden'));
  assert(hidden, '🔄 New Map should be hidden in the Map Maker editor — nothing procedural to reroll');
});

// TD-009: entering Explore while a golf hole's spiral particles were alive threw
// "Cannot read properties of null (reading 'x')" from stepParticles on every frame
// for about a second. Explore's world has no black hole, and the spirals were left
// orbiting nothing. Spirals spawn on about one frame in eleven, so tests that
// happened to enter Explore early failed only sometimes. These force the
// precondition, prove it, and then take the route a player takes.
//
// Each runs in a browser profile of its own: the game remembers the last mode
// played and draws it behind the start menu, and Explore — which earlier tests
// play — has no black hole to spawn spirals around.
async function inFreshProfile(fn) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(String(err && err.message || err)));
  let failure = null;
  try {
    await fn(page);
  } catch (err) {
    failure = err;
  } finally {
    await context.close().catch(() => {});
  }
  const thrown = errors.length
    ? errors.length + ' uncaught page error(s), the first: ' + errors[0]
    : null;
  if (failure) throw new Error(failure.message + (thrown ? ' — and ' + thrown : ''));
  if (thrown) throw new Error(thrown);
}

// Let spirals spawn on every frame for a while: stepParticles spawns one whenever
// Math.random() < 0.09, so forcing it only makes certain what play makes likely.
async function forceSpirals(page, frames = 30) {
  await page.evaluate(async n => {
    const real = Math.random;
    Math.random = () => 0;
    try {
      await new Promise(resolve => {
        let seen = 0;
        const tick = () => (++seen >= n ? resolve() : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
      });
    } finally {
      Math.random = real;
    }
  }, frames);
}

// How many spirals are orbiting the black hole right now, counted without reaching
// into the module: swap in a black hole whose `x` counts its reads, and take one
// step that passes no time and spawns nothing. Each spiral reads `x` exactly once.
const spiralCount = page => page.evaluate(async () => {
  const ui = await import('/games/black-hole-in-one/ui.js');
  const { world } = await import('/games/black-hole-in-one/state.js');
  const hole = world.blackHole;
  if (!hole) return 0;
  let reads = 0;
  const counted = {};
  for (const key of Object.keys(hole)) {
    Object.defineProperty(counted, key, { enumerable: true, get: () => { if (key === 'x') reads++; return hole[key]; } });
  }
  const real = Math.random;
  world.blackHole = counted;
  Math.random = () => 1;
  try { ui.stepParticles(0); } finally { Math.random = real; world.blackHole = hole; }
  return reads;
});

const bhMode = page => page.evaluate(async () => (await import('/games/black-hole-in-one/state.js')).S.mode);

await test('black-hole-in-one: entering Explore from the start menu with spirals alive throws nothing (TD-009)', () =>
  inFreshProfile(async page => {
    await page.goto(BH, { waitUntil: 'load' });
    await forceSpirals(page);
    const alive = await spiralCount(page);
    assert(alive > 0, 'precondition not met: no spirals orbiting the golf hole behind the start menu');
    await page.click('#modeExplore');
    await sleep(1600); // a spiral lives 1.1 s; any throw would have happened by now
    assert(await bhMode(page) === 'explore', 'tapping Explore did not start Explore');
  }));

await test('black-hole-in-one: entering Explore from a golf round via ☰ Menu with spirals alive throws nothing (TD-009)', () =>
  inFreshProfile(async page => {
    await page.goto(BH, { waitUntil: 'load' });
    await page.click('#modeEndless');
    await forceSpirals(page);
    await page.click('#helpBtn');
    await sleep(300);
    const alive = await spiralCount(page);
    assert(alive > 0, 'precondition not met: no spirals orbiting the golf hole when ☰ Menu opened');
    await page.click('#modeExplore');
    await sleep(1600);
    assert(await bhMode(page) === 'explore', 'tapping Explore from ☰ Menu did not start Explore');
  }));

await test('black-hole-in-one: spirals whose black hole is gone are dropped, not stepped (TD-009)', () =>
  inFreshProfile(async page => {
    await page.goto(BH, { waitUntil: 'load' });
    await page.click('#modeEndless');
    await sleep(300);
    // The defect itself, whatever route leads to it. One synchronous evaluation
    // from start to finish, so no animation frame runs in between and nothing but
    // these calls touches the particles.
    const r = await page.evaluate(async () => {
      const ui = await import('/games/black-hole-in-one/ui.js');
      const { world } = await import('/games/black-hole-in-one/state.js');
      const hole = world.blackHole;
      if (!hole) return { noHole: true };
      const real = Math.random;
      const count = () => {
        let reads = 0;
        const counted = {};
        for (const key of Object.keys(hole)) {
          Object.defineProperty(counted, key, { enumerable: true, get: () => { if (key === 'x') reads++; return hole[key]; } });
        }
        world.blackHole = counted;
        Math.random = () => 1;
        try { ui.stepParticles(0); } finally { Math.random = real; world.blackHole = hole; }
        return reads;
      };
      // Particles that are not spirals — a burst, in a colour nothing else draws —
      // must survive: the fix drops what orbited the black hole, not everything.
      // Counted by what the renderer draws, since the particle list is private.
      const MARK = '#0f1e2d';
      const drawnInMark = () => {
        const proto = CanvasRenderingContext2D.prototype;
        const real = Object.getOwnPropertyDescriptor(proto, 'fillStyle');
        let hits = 0;
        Object.defineProperty(proto, 'fillStyle', {
          configurable: true,
          get() { return real.get.call(this); },
          set(v) { if (v === MARK) hits++; real.set.call(this, v); }
        });
        try { ui.render(); } finally { Object.defineProperty(proto, 'fillStyle', real); }
        return hits;
      };
      Math.random = () => 0;
      try { for (let i = 0; i < 10; i++) ui.stepParticles(1 / 60); } finally { Math.random = real; }
      ui.burst(hole.x, hole.y, 5, MARK, 0);
      const before = count();
      const burstBefore = drawnInMark();
      world.blackHole = null;
      let threw = null;
      Math.random = () => 1;
      try { ui.stepParticles(1 / 60); } catch (err) { threw = String(err && err.message || err); }
      finally { Math.random = real; world.blackHole = hole; }
      const after = count();
      const burstAfter = drawnInMark();
      return { before, threw, after, burstBefore, burstAfter };
    });
    assert(!r.noHole, 'precondition not met: a golf round has no black hole');
    assert(r.before > 0, 'precondition not met: no spiral could be created in a golf round');
    assert(r.burstBefore > 0, 'precondition not met: the marked burst was never drawn');
    assert(r.threw === null, 'stepping ' + r.before + ' spiral(s) with no black hole threw: ' + r.threw);
    assert(r.after === 0, r.after + ' spiral(s) survived their black hole and would orbit the next one');
    assert(r.burstAfter > 0, 'the burst was dropped with the spirals — only particles orbiting the black hole should go');
  }));

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

// ── Durak: a turn with no playable card plays itself (p1-53) ────────────────

const DURAK = base + '/games/durak/';

// Start a match from the setup screen, then deal a crafted mid-game table.
// `table` is a plain object so it crosses into the page: hands as [value, suit].
async function durakStart(page, mode, count, table) {
  await page.goto(DURAK, { waitUntil: 'load' });
  await page.evaluate(() => {
    localStorage.setItem('durak_perevodnoy', 'false');
    localStorage.setItem('durak_difficulty', 'normal');
    localStorage.removeItem('durak_showPlayable');   // the default: dimming on
  });
  await page.click('#mode-toggle [data-mode="' + mode + '"]');
  await page.click('#count-toggle [data-count="' + count + '"]');
  await page.click('#btn-play');
  await sleep(300);
  if (mode === 'hotseat') { await page.click('#pass-device-overlay'); await sleep(200); }
  await page.evaluate(async t => {
    const { state } = await import('/games/durak/state.js');
    const { Card } = await import('/games/durak/constants.js');
    const { renderAll } = await import('/games/durak/ui.js');
    const { clearAiTimeout } = await import('/games/durak/ai.js');
    const cards = list => list.map(c => c && new Card(c[0], c[1]));   // null = an open slot
    // The real deal may have handed the lead to a computer (p1-57), whose
    // first move would land on the crafted table.
    clearAiTimeout();
    state.openingLead = null;
    state.trumpSuit = 4;
    state.deck = cards(t.deck);
    state.attackerSeat = t.attacker; state.defenderSeat = t.defender; state.prioritySeat = t.priority;
    state.field.attacks = cards(t.attacks); state.field.defenses = cards(t.defenses);
    state.contributionOrder = t.attacks.length ? [t.attacker] : [];
    t.hands.forEach((h, i) => { state.players[i].hand = cards(h); });
    Object.assign(state, t.extra || {});
    renderAll();
  }, table);
  await sleep(450);   // let the cards finish their FLIP slide, or a tap can land on a neighbour
}

const durakState = page => page.evaluate(async () => {
  const { state } = await import('/games/durak/state.js');
  return {
    phase: state.phase, priority: state.prioritySeat, attacks: state.field.attacks.length,
    discard: state.discard.length, reveal: state.pendingReveal && state.pendingReveal.seat,
    defenses: state.field.defenses.map(d => d && d.id), defender: state.defenderSeat,
    selected: [...document.querySelectorAll('#human-hand .card-btn.selected')].map(b => b.dataset.cardId),
    targets: [...document.querySelectorAll('#field .field-pair.is-target')].map(p => +p.dataset.attackIndex),
    bar: document.getElementById('choice-bar').classList.contains('hidden') ? null : {
      transfer: !document.getElementById('btn-choice-transfer').classList.contains('hidden'),
      beat: !document.getElementById('btn-choice-beat').classList.contains('hidden'),
      hint: !document.getElementById('choice-hint').classList.contains('hidden')
    },
    status: document.getElementById('status-display').textContent,
    passHidden: document.getElementById('btn-pass').classList.contains('hidden'),
    dimmed: [...document.querySelectorAll('#human-hand .card-btn.unplayable')].map(b => b.dataset.cardId)
  };
});

await test('durak: defender out of cards — your dead throw-in is dimmed and Pass plays itself', async page => {
  // You attack with 7♠; the computer's only card, 10♠, beats it. Your 7♣
  // matches the field but can't be thrown at a defender holding nothing.
  await durakStart(page, 'ai', 2, {
    deck: [[6, 3], [8, 3], [11, 3], [12, 3], [13, 3], [14, 3]],
    attacker: 0, defender: 1, priority: 0, attacks: [], defenses: [],
    hands: [[[7, 1], [7, 2], [9, 3]], [[10, 1]]]
  });
  await page.click('#human-hand .card-btn[data-card-id="71"]');
  let s, sawForced = null;
  for (const deadline = Date.now() + 4000; Date.now() < deadline; await sleep(50)) {
    s = await durakState(page);
    if (!sawForced && /Nothing to throw/.test(s.status)) sawForced = s;
    if (s.discard === 2) break;
  }
  assert(sawForced, 'never showed the forced-pass status; last status: "' + s.status + '"');
  assert(sawForced.passHidden, 'Pass button still offered during a forced pass');
  assert(sawForced.dimmed.includes('72'), '7♣ was not dimmed while unplayable: ' + JSON.stringify(sawForced.dimmed));
  assert(s.discard === 2 && s.attacks === 0, 'bout never closed on its own: ' + JSON.stringify(s));
  assert(s.priority === 1, 'defender should lead the next bout, priority is seat ' + s.priority);
});

await test('durak: "Show playable cards" is on by default and the drawer switch turns the dimming off (p1-54)', async page => {
  // You attacked 7♠, it was beaten; 7♣ can be thrown on, 9♥ can't.
  await durakStart(page, 'ai', 2, {
    deck: [[6, 3], [8, 3], [11, 3], [12, 3], [13, 3], [14, 3]],
    attacker: 0, defender: 1, priority: 0, attacks: [[7, 1]], defenses: [[10, 1]],
    hands: [[[7, 2], [9, 3]], [[11, 2], [12, 2], [13, 2]]]
  });
  let s = await durakState(page);
  assert(JSON.stringify(s.dimmed) === '["93"]', 'by default only 9♥ should be dimmed: ' + JSON.stringify(s.dimmed));

  await page.click('#settings-hamburger-btn');
  await sleep(400);
  const before = await page.$eval('#durak-show-playable', i => i.checked);
  assert(before === true, 'drawer switch should start on');
  await page.evaluate(() => document.getElementById('durak-show-playable').closest('label').click());
  await page.click('#settings-close-btn');
  await sleep(400);

  s = await durakState(page);
  assert(s.dimmed.length === 0, 'dimming still on after switching it off: ' + JSON.stringify(s.dimmed));
  assert(s.priority === 0, 'still your turn, priority is seat ' + s.priority);
  const saved = await page.evaluate(() => localStorage.getItem('durak_showPlayable'));
  assert(saved === 'false', 'the choice should persist, got ' + saved);
});

// p1-55: six open attacks, you defending — on every screen shape the pairs
// stay inside the table without overlapping, Take is fully on screen, and the
// instruction above the hand isn't cut off.
const SIX_ATTACKS = {
  deck: [[6, 4], [8, 4], [11, 4], [12, 4], [13, 4], [14, 4]],
  attacker: 1, defender: 0, priority: 0,
  attacks: [[6, 1], [6, 2], [6, 3], [7, 1], [7, 2], [7, 3]],
  defenses: [null, null, null, null, null, null],
  hands: [[[14, 1], [8, 2], [9, 3]], [[9, 1]]]
};
for (const [label, vp] of [
  ['phone', { width: 390, height: 844, isMobile: true, hasTouch: true }],
  ['small phone', { width: 375, height: 667, isMobile: true, hasTouch: true }],
  ['phone on its side', { width: 844, height: 390, isMobile: true, hasTouch: true, isLandscape: true }],
  ['laptop', { width: 1440, height: 900 }]
]) {
  await test('durak: six attacks fit the table on a ' + label + ', no overlap, Take on screen (p1-55)', async page => {
    await page.setViewport(vp);
    await durakStart(page, 'ai', 2, SIX_ATTACKS);
    const g = await page.evaluate(() => {
      const r = el => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
      const status = document.getElementById('status-display');
      return {
        table: r(document.getElementById('table-center')),
        pairs: [...document.querySelectorAll('#field .field-pair')].map(r),
        take: document.getElementById('btn-take').classList.contains('hidden') ? null : r(document.getElementById('btn-take')),
        vw: innerWidth, vh: innerHeight,
        status: status.textContent, statusCut: status.scrollWidth > status.clientWidth + 1,
        statusInHand: !!status.closest('#human-zone')
      };
    });
    assert(g.pairs.length === 6, 'expected 6 pairs, got ' + g.pairs.length);
    for (const p of g.pairs) {
      assert(p.l >= g.table.l - 1 && p.r <= g.table.r + 1 && p.t >= g.table.t - 1 && p.b <= g.table.b + 1,
        'a pair spills out of the table: ' + JSON.stringify({ pair: p, table: g.table }));
    }
    for (let i = 0; i < g.pairs.length; i++) for (let j = i + 1; j < g.pairs.length; j++) {
      const a = g.pairs[i], b = g.pairs[j];
      const overlap = a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
      assert(!overlap, `pairs ${i} and ${j} overlap: ` + JSON.stringify([a, b]));
    }
    assert(g.take, 'Take should be offered');
    assert(g.take.t >= 0 && g.take.b <= g.vh && g.take.l >= 0 && g.take.r <= g.vw, 'Take is off screen: ' + JSON.stringify(g.take));
    assert(g.statusInHand, 'the instruction should sit with the hand');
    assert(/Defend/.test(g.status) && !g.statusCut, 'instruction missing or cut off: "' + g.status + '"');
  });
}

await test('durak: the waiting spinner never shows on your own turn (p1-55)', async page => {
  await durakStart(page, 'ai', 2, {
    deck: [[6, 3], [8, 3], [11, 3], [12, 3], [13, 3], [14, 3]],
    attacker: 0, defender: 1, priority: 0, attacks: [], defenses: [],
    hands: [[[7, 1], [9, 2]], [[10, 1], [11, 1], [12, 1]]]
  });
  const mine = await page.evaluate(() => document.getElementById('wait-spinner').classList.contains('hidden'));
  assert(mine, 'spinner shown while it is your attack');
  await page.click('#human-hand .card-btn[data-card-id="71"]');
  await sleep(80);
  const theirs = await page.evaluate(async () => {
    const { state } = await import('/games/durak/state.js');
    return { pri: state.prioritySeat, hidden: document.getElementById('wait-spinner').classList.contains('hidden') };
  });
  assert(theirs.pri === 1 && !theirs.hidden, 'spinner should show while the computer defends: ' + JSON.stringify(theirs));
});

await test('durak: hot-seat skips the pass-device cover for a forced pass', async page => {
  // Seat 0 passes with a playable card in hand. Seat 2 can throw nothing, so
  // its pass is forced: no cover for it — the bout closes and the cover names
  // seat 1, who leads next.
  await durakStart(page, 'hotseat', 3, {
    deck: [[6, 3], [8, 3], [11, 3], [12, 3], [13, 3], [14, 3]],
    attacker: 0, defender: 1, priority: 0, attacks: [[7, 1]], defenses: [[10, 1]],
    hands: [[[7, 2], [9, 3]], [[6, 2], [8, 2]], [[11, 2]]]
  });
  const before = await durakState(page);
  assert(!before.passHidden && before.dimmed.length === 1, 'precondition: Pass offered, only 9♦ dimmed — ' + JSON.stringify(before));
  await page.click('#btn-pass');
  await sleep(200);
  const s = await durakState(page);
  assert(s.discard === 2, 'bout did not close after the forced pass: ' + JSON.stringify(s));
  assert(s.phase === 'passDevice' && s.reveal === 1, 'cover should be for seat 1 (next leader), got ' + JSON.stringify(s));
});

// ── Durak: defense choices inline (p1-23) and tap-to-target (p1-22) ─────────

await test('durak: a card that can transfer or beat opens the inline bar, not a modal (p1-23)', async page => {
  // CPU 2 attacks you with 6♠. Your 6♥ is trump: it can beat the 6♠ or transfer it on.
  await durakStart(page, 'ai', 3, {
    deck: [[6, 3], [8, 3], [11, 3], [12, 3], [13, 3], [14, 3]],
    attacker: 2, defender: 0, priority: 0, attacks: [[6, 1]], defenses: [null],
    hands: [[[6, 4], [9, 3]], [[7, 1], [8, 1], [12, 2]], [[13, 1]]],
    extra: { variantPerevodnoy: true, attacksThisGame: 5 }
  });
  assert(!(await page.$('#choice-overlay')), 'the old choice modal is still in the page');
  await page.click('#human-hand .card-btn[data-card-id="64"]');
  let s = await durakState(page);
  assert(s.bar && s.bar.transfer && s.bar.beat && !s.bar.hint, 'expected Transfer + Beat in the bar: ' + JSON.stringify(s.bar));
  assert(s.selected.includes('64') && s.defenses[0] === null, 'card should be selected, not played: ' + JSON.stringify(s));
  await page.click('#human-hand .card-btn[data-card-id="64"]');           // tap again: cancel
  s = await durakState(page);
  assert(!s.bar && !s.selected.length, 'tapping the selected card again did not cancel');
  await page.click('#human-hand .card-btn[data-card-id="64"]');
  await page.click('#opponents');                                          // tap elsewhere: cancel
  s = await durakState(page);
  assert(!s.bar && !s.selected.length, 'tapping elsewhere did not cancel');
  await page.click('#human-hand .card-btn[data-card-id="64"]');
  await page.click('#btn-choice-beat');
  s = await durakState(page);
  assert(s.defenses[0] === '64' && !s.bar, 'Beat did not cover the attack: ' + JSON.stringify(s));
});

await test('durak: with 2 open attacks, tap a card then the attack it covers; unambiguous taps still play at once (p1-22)', async page => {
  // After a transfer you face 6♠ and 6♣. 7♥ (trump) beats both — you choose; 8♣ beats only 6♣.
  const table = {
    deck: [[6, 3], [8, 3], [11, 3], [12, 3], [13, 3], [14, 3]],
    attacker: 2, defender: 0, priority: 0, attacks: [[6, 1], [6, 2]], defenses: [null, null],
    hands: [[[7, 4], [8, 2], [10, 1], [12, 3]], [[7, 1], [9, 1], [12, 2]], [[13, 1], [11, 1]]]
  };
  await durakStart(page, 'ai', 3, table);
  await page.click('#human-hand .card-btn[data-card-id="74"]');
  let s = await durakState(page);
  assert(JSON.stringify(s.targets) === '[0,1]', 'both attacks should glow as targets: ' + JSON.stringify(s.targets));
  assert(s.bar && s.bar.hint && !s.bar.beat && !s.bar.transfer, 'expected only the pick-an-attack hint: ' + JSON.stringify(s.bar));
  await page.click('#field .field-pair.is-target[data-attack-index="1"]');
  s = await durakState(page);
  assert(s.defenses[0] === null && s.defenses[1] === '74', '7♥ should cover the tapped 2nd attack: ' + JSON.stringify(s.defenses));
  await page.click('#human-hand .card-btn[data-card-id="101"]');        // one attack left: instant
  s = await durakState(page);
  assert(s.defenses[0] === '101', 'single open attack: the tap should play at once: ' + JSON.stringify(s.defenses));

  await durakStart(page, 'ai', 3, table);
  await page.click('#human-hand .card-btn[data-card-id="82"]');         // 2 open, but 8♣ fits only 6♣
  s = await durakState(page);
  assert(s.defenses[1] === '82' && !s.bar, 'a card with one possible target should play at once: ' + JSON.stringify(s));
});

// ── Durak: the status line says why you can't throw in (p1-56) ──────────────

await test('durak: shut out after a transfer — the line above your hand names the neighbours who may throw in (p1-56)', async page => {
  // Yev's bout: CPU 1 transferred to CPU 2, so only CPU 1 and CPU 3 sit next
  // to the defender. You hold a 10 and a J, matching the field, but sit across.
  const hands = [[[10, 3], [11, 3], [14, 2]], [[11, 1], [6, 2]], [[7, 2], [8, 2], [9, 2], [13, 1], [6, 1]], [[12, 1], [7, 3]]];
  const waitFor = async re => {
    let s;
    for (const deadline = Date.now() + 2000; Date.now() < deadline; await sleep(50)) {
      s = await durakState(page);
      if (re.test(s.status)) return s;
    }
    return s;
  };

  await durakStart(page, 'ai', 4, {
    deck: [], attacker: 1, defender: 2, priority: 1,
    attacks: [[10, 2], [10, 1], [11, 4]], defenses: [[11, 2], [12, 4], null], hands,
    extra: { phase: 'pileOn' }
  });
  let s = await waitFor(/may pile on/);
  assert(s.status === 'CPU 2 is taking — only CPU 1 and CPU 3 (next to them) may pile on',
    'pile-on should say who may pile on and why; got "' + s.status + '"');

  await durakStart(page, 'ai', 4, {
    deck: [], attacker: 1, defender: 2, priority: 1,
    attacks: [[10, 2], [10, 1]], defenses: [[11, 2], [12, 4]], hands
  });
  s = await waitFor(/may throw in/);
  assert(s.status === 'Only CPU 1 and CPU 3 (next to CPU 2) may throw in',
    'a throw-in round should say who may throw in; got "' + s.status + '"');
});

// ── Durak: the lowest trump leads (p1-57) ───────────────────────────────────

// Math.random pinned to 0.3 for the shuffle deals 3 players a hand where
// CPU 1 holds the lowest trump, 6❤ (8❤ is face up under the deck).
async function durakPlayPinnedDeal(page, mode, button = '#btn-play') {
  await page.goto(DURAK, { waitUntil: 'load' });
  await page.evaluate(() => {
    localStorage.setItem('durak_perevodnoy', 'false');
    localStorage.removeItem('durak_autoPlaySpeed');
  });
  await page.click('#mode-toggle [data-mode="' + mode + '"]');
  await page.click('#count-toggle [data-count="3"]');
  await page.evaluate(() => { window.__random = Math.random; Math.random = () => 0.3; });
  await page.click(button);
  await page.evaluate(() => { Math.random = window.__random; });
}

const durakLog = page => page.evaluate(async () => {
  const { state } = await import('/games/durak/state.js');
  return { bout: state.boutNum, log: state.log.map(e => ({ type: e.type, seat: e.seat })),
           status: document.getElementById('status-display').textContent };
});

await test('durak: the lowest trump leads — a computer holding it attacks first on its own (p1-57)', async page => {
  await durakPlayPinnedDeal(page, 'ai');
  const opening = await page.evaluate(async () => {
    const { state } = await import('/games/durak/state.js');
    const { eventText } = await import('/games/durak/log.js');
    return {
      attacker: state.attackerSeat, defender: state.defenderSeat, priority: state.prioritySeat,
      lead: state.openingLead.card.id, trump: state.trumpCard.id,
      log: state.log.map(eventText),
      status: document.getElementById('status-display').textContent
    };
  });
  assert(opening.trump === '84' && opening.lead === '64', 'the pinned deal changed: ' + JSON.stringify(opening));
  assert(opening.attacker === 1 && opening.priority === 1 && opening.defender === 2,
    'CPU 1 holds the lowest trump and should lead against CPU 2: ' + JSON.stringify(opening));
  assert(opening.status === 'CPU 1 has the lowest trump, 6❤, and attacks first',
    'the opening line should say who leads and why; got "' + opening.status + '"');
  assert(opening.log[0] === opening.status, 'the log should open with the same line: ' + JSON.stringify(opening.log));

  // No input from you: CPU 1 attacks, then CPU 2 answers it.
  let s;
  const answered = log => log.some(e => e.seat === 2 && (e.type === 'defend' || e.type === 'take'));
  for (const deadline = Date.now() + 6000; Date.now() < deadline; await sleep(100)) {
    s = await durakLog(page);
    if (answered(s.log)) break;
  }
  const first = s.log.find(e => e.type === 'attack');
  assert(first && first.seat === 1, 'CPU 1 never made the first attack: ' + JSON.stringify(s));
  assert(answered(s.log), 'CPU 2 never answered the opening attack: ' + JSON.stringify(s));
  assert(!/lowest trump/.test(s.status), 'the opening line outlived the first attack: "' + s.status + '"');
});

await test('durak: Watch Mode — a computer leader opens and the first bout plays out (p1-57)', async page => {
  await durakPlayPinnedDeal(page, 'ai', '#btn-watch');
  let s;
  for (const deadline = Date.now() + 10000; Date.now() < deadline; await sleep(100)) {
    s = await durakLog(page);
    if (s.bout >= 2) break;
  }
  await page.evaluate(() => localStorage.setItem('durak_autoPlay', 'false'));
  const first = s.log.find(e => e.type === 'attack');
  assert(first && first.seat === 1, 'CPU 1 should open the watched match: ' + JSON.stringify(s));
  assert(s.bout >= 2, 'the first watched bout never finished: ' + JSON.stringify(s));
});

await test('durak: hot-seat — the pass-device cover goes to the player holding the lowest trump (p1-57)', async page => {
  await durakPlayPinnedDeal(page, 'hotseat');
  const cover = await page.evaluate(() => document.getElementById('pass-device-name').textContent);
  assert(cover === 'Player 2', 'the opening cover should name Player 2 (seat 1), got "' + cover + '"');
  await page.click('#pass-device-overlay');
  await sleep(200);
  const status = await page.evaluate(() => document.getElementById('status-display').textContent);
  assert(status === 'You have the lowest trump, 6❤, and attack first',
    'the leader should be told why they go first; got "' + status + '"');
});

await browser.close();
server.close();

console.log('');
if (failures) {
  console.error('E2E FAILED: ' + failures + ' test(s).');
  process.exit(1);
}
console.log('E2E passed: ' + results.length + ' test(s).');
