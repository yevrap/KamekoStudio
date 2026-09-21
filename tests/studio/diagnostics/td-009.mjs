// td-009.mjs — a deterministic reproduction of TD-009, for whoever fixes it.
//
//   node tests/studio/diagnostics/td-009.mjs                # the precondition forced
//   node tests/studio/diagnostics/td-009.mjs --as-a-player  # nothing forced
//
// Exit 1 while the defect is present, 0 once it is fixed, 2 if the result does
// not match the diagnosis, 3 if Chrome is not available. This is a diagnostic,
// not a test: nothing collects it (`node --test` looks for *.test.mjs), so it
// cannot turn any suite red. It only reads production — it drives Black Hole in
// One in a browser and changes no file.
//
// The defect, in production code the studio may not edit: `stepParticles` in
// games/black-hole-in-one/ui.js moves every "spiral" particle around
// `world.blackHole`, and Explore's world reset sets `world.blackHole = null`
// without clearing them. Spirals are spawned around the decorative golf hole
// drawn behind the start menu, so tapping Explore after a moment on the menu
// leaves live spirals orbiting nothing: every frame throws in `stepParticles`,
// before the canvas is rendered, until the last one expires about a second
// later. The e2e test that flakes calls Explore's start directly within a few
// frames of load, so it only fails when a spiral happened to spawn in time.
//
// Two trials, identical except for what the start menu shows behind it:
//   defect  — a fresh profile, so the menu shows a golf hole with a black hole;
//   control — Explore played once first, so the menu shows Explore's world,
//             which has no black hole.
// If the diagnosis is right the first throws and the second does not.
//
// By default the precondition is forced — every frame on the menu spawns a
// spiral — so the result is certain. `--as-a-player` forces nothing: two
// seconds on the menu and a real tap, which is what a player does. Spirals then
// spawn on about one frame in eleven, so the defect is very likely rather than
// certain, and that mode is the answer to "can a player reach this?".

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch, chromeAvailable, chromePath } from '../lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const GAME = '/games/black-hole-in-one/';
const TRIALS = 3;
/** Frames spent on the start menu with spawning forced, so the precondition is certain rather than likely. */
const MENU_FRAMES = 30;
/** How long to watch after tapping Explore. A spiral lives 1.1 s. */
const WATCH_MS = 1600;
/** In player mode, how long to look at the menu before tapping. */
const PLAYER_MENU_MS = 2000;
const AS_A_PLAYER = process.argv.includes('--as-a-player');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Wait `frames` animation frames on the start menu, with every frame spawning a spiral if there is a black hole to spawn it around. */
async function sitOnMenu(page, frames) {
  await page.evaluate(async n => {
    const real = Math.random;
    // stepParticles spawns a spiral when Math.random() < 0.09; forcing it only
    // makes certain what two seconds on the menu makes very likely.
    Math.random = () => 0;
    await new Promise(resolve => {
      let seen = 0;
      const tick = () => (++seen >= n ? resolve() : requestAnimationFrame(tick));
      requestAnimationFrame(tick);
    });
    Math.random = real;
  }, frames);
}

/** One trial in its own browser profile. Returns the uncaught errors thrown after tapping Explore. */
async function trial(browser, origin, { playExploreFirst }) {
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(origin + GAME, { waitUntil: 'load' });
    if (playExploreFirst) {
      // The game remembers the last mode and draws it behind the menu on the
      // next visit. Playing Explore once is how a player gets that state.
      await page.click('#modeExplore');
      await sleep(300);
      await page.reload({ waitUntil: 'load' });
    }
    if (AS_A_PLAYER) await sleep(PLAYER_MENU_MS);
    else await sitOnMenu(page, MENU_FRAMES);
    const errors = [];
    page.on('pageerror', err => errors.push(err));
    await page.click('#modeExplore');
    await sleep(WATCH_MS);
    return errors;
  } finally {
    await context.close();
  }
}

function describe(errors) {
  if (!errors.length) return 'no uncaught errors';
  const first = errors[0];
  const frame = String(first.stack || '').split('\n').find(line => /^\s+at /.test(line)) || '';
  const where = frame.trim().replace(/https?:\/\/[^/]+/, '');
  return `${errors.length} uncaught error(s) — ${first.message}${where ? ` (${where})` : ''}`;
}

if (!chromeAvailable()) {
  console.log(`not run: no Chrome at ${chromePath()} (set CHROME_PATH)`);
  process.exit(3);
}

const server = await serve(ROOT);
const browser = await launch();
const results = { defect: [], control: [] };
try {
  for (let i = 0; i < TRIALS; i++) {
    results.defect.push(await trial(browser, server.origin, { playExploreFirst: false }));
    results.control.push(await trial(browser, server.origin, { playExploreFirst: true }));
  }
} finally {
  await browser.close();
  await server.close();
}

const threw = runs => runs.filter(e => e.length).length;
console.log(`TD-009 — Black Hole in One, tapping Explore from the start menu (${AS_A_PLAYER ? 'as a player, nothing forced' : 'precondition forced'})\n`);
for (const [name, label] of [['defect', 'golf hole behind the menu'], ['control', 'Explore behind the menu ']]) {
  results[name].forEach((errors, i) => console.log(`  ${label}  trial ${i + 1}: ${describe(errors)}`));
}
const defect = threw(results.defect);
const control = threw(results.control);
console.log('');

if (control > 0) {
  console.log(`The control threw in ${control}/${TRIALS} trials. Something other than the diagnosis is wrong.`);
  process.exit(2);
}
if (defect === TRIALS) {
  console.log(`Present: ${TRIALS}/${TRIALS} trials threw with a black hole behind the menu, 0/${TRIALS} without one.`);
  process.exit(1);
}
if (defect === 0) {
  console.log(`Not reproduced: 0/${TRIALS} trials threw. TD-009 looks fixed; close the row with this output.`);
  process.exit(0);
}
if (AS_A_PLAYER) {
  // Nothing was forced, so a spiral may simply not have spawned in time.
  console.log(`Present in ${defect}/${TRIALS} trials as a player, 0/${TRIALS} without a black hole. Unforced spawning makes a miss possible.`);
  process.exit(1);
}
console.log(`Partly reproduced: ${defect}/${TRIALS}. The precondition is forced, so this does not match the diagnosis.`);
process.exit(2);
