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
