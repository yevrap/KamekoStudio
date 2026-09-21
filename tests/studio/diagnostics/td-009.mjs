// td-009.mjs — a reproduction of TD-009, for whoever fixes it.
//
//   node tests/studio/diagnostics/td-009.mjs                # the precondition forced
//   node tests/studio/diagnostics/td-009.mjs --as-a-player  # nothing forced
//
// Exit codes:
//   0  fixed      — every player path and the direct check are clean
//   1  present    — at least one player path throws TD-009's error
//   2  unclear    — a result that does not fit the diagnosis (see the message)
//   3  not run    — no Chrome
//   4  broken     — this script itself failed; says nothing about TD-009
//
// This is a diagnostic, not a test: nothing collects it (`node --test` looks for
// *.test.mjs), so it cannot turn any suite red. It only reads production — it
// drives Black Hole in One in a browser and changes no file.
//
// The defect, in production code the studio may not edit: `stepParticles` in
// games/black-hole-in-one/ui.js moves every "spiral" particle around
// `world.blackHole`, and Explore's world reset sets `world.blackHole = null`
// without clearing them. Spirals spawn around any golf hole's black hole, so
// entering Explore while spirals are alive leaves them orbiting nothing: every
// frame throws in `stepParticles`, before the canvas is rendered, until the last
// one expires about a second later.
//
// What is tried, each in a fresh browser profile:
//
//   start menu  — the menu draws a golf hole behind itself; tap Explore.
//   mid-round   — tap Endless, play a moment, open ☰ Menu, tap Explore.
//   control     — Explore played once first, so the menu draws Explore's world,
//                 which has no black hole. Must be clean, or the diagnosis is wrong.
//   direct      — no player path at all: with spirals alive, remove the black
//                 hole and call `stepParticles` once. This is the defect itself,
//                 so a fix that only covers the paths above is not reported fixed.
//
// By default the precondition is forced — every frame spawns a spiral — so each
// result is certain. `--as-a-player` forces nothing: spirals then spawn on about
// one frame in eleven, so a miss is possible; use the default mode to close the row.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch, chromeAvailable, chromePath } from '../lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const GAME = '/games/black-hole-in-one/';
const TRIALS = 3;
/** Frames played with spawning forced, so the precondition is certain rather than likely. */
const FORCED_FRAMES = 30;
/** In player mode, how long to look at the menu or play the round before leaving. */
const PLAYER_WAIT_MS = 2000;
/** How long to watch after tapping Explore. A spiral lives 1.1 s. */
const WATCH_MS = 1600;
const AS_A_PLAYER = process.argv.includes('--as-a-player');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Let the game run with spirals alive: forced for a fixed number of frames, or for as long as a player would look. */
async function letSpiralsSpawn(page) {
  if (AS_A_PLAYER) return sleep(PLAYER_WAIT_MS);
  await page.evaluate(async n => {
    const real = Math.random;
    // stepParticles spawns a spiral when Math.random() < 0.09; forcing it only
    // makes certain what a couple of seconds of play makes very likely.
    Math.random = () => 0;
    await new Promise(resolve => {
      let seen = 0;
      const tick = () => (++seen >= n ? resolve() : requestAnimationFrame(tick));
      requestAnimationFrame(tick);
    });
    Math.random = real;
  }, FORCED_FRAMES);
}

/** Is this error TD-009's — thrown from `stepParticles` — or something else? */
function isTd009(err) {
  const frame = String(err?.stack || '').split('\n').find(line => /^\s+at /.test(line)) || '';
  return /\bstepParticles\b/.test(frame);
}

const PATHS = {
  'start menu': async page => {
    await letSpiralsSpawn(page);
  },
  'mid-round': async page => {
    await page.click('#modeEndless');
    await letSpiralsSpawn(page);
    await page.click('#helpBtn');
    await sleep(300);
  },
  control: async page => {
    // The game remembers the last mode and draws it behind the menu next time.
    await page.click('#modeExplore');
    await sleep(300);
    await page.reload({ waitUntil: 'load' });
    await letSpiralsSpawn(page);
  }
};

/** One player path in its own profile. Returns the uncaught errors thrown after tapping Explore. */
async function playerTrial(browser, origin, setUp) {
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(origin + GAME, { waitUntil: 'load' });
    await setUp(page);
    const errors = [];
    page.on('pageerror', err => errors.push(err));
    await page.click('#modeExplore');
    await sleep(WATCH_MS);
    return errors;
  } finally {
    await context.close();
  }
}

/** The defect itself: spirals alive, black hole removed, one step. Returns the error thrown, or null. */
async function directTrial(browser, origin) {
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.goto(origin + GAME, { waitUntil: 'load' });
    return await page.evaluate(async game => {
      const ui = await import(game + 'ui.js');
      const { world } = await import(game + 'state.js');
      if (!world.blackHole) return { harness: 'the start menu drew no black hole to spawn spirals around' };
      const real = Math.random;
      Math.random = () => 0;
      try { for (let i = 0; i < 5; i++) ui.stepParticles(1 / 60); } finally { Math.random = real; }
      world.blackHole = null;
      try {
        ui.stepParticles(1 / 60);
        return { threw: null };
      } catch (err) {
        return { threw: { message: err.message, stack: err.stack } };
      }
    }, GAME);
  } finally {
    await context.close();
  }
}

function describe(errors) {
  if (!errors.length) return 'clean';
  const first = errors[0];
  const frame = String(first.stack || '').split('\n').find(line => /^\s+at /.test(line)) || '';
  const where = frame.trim().replace(/https?:\/\/[^/]+/, '');
  return `${errors.length} uncaught error(s) — ${first.message}${where ? ` (${where})` : ''}`;
}

async function main() {
  if (!chromeAvailable()) {
    console.log(`not run: no Chrome at ${chromePath()} (set CHROME_PATH)`);
    return 3;
  }
  const server = await serve(ROOT);
  const browser = await launch();
  const results = Object.fromEntries(Object.keys(PATHS).map(name => [name, []]));
  let direct;
  try {
    for (let i = 0; i < TRIALS; i++) {
      for (const [name, setUp] of Object.entries(PATHS)) results[name].push(await playerTrial(browser, server.origin, setUp));
    }
    direct = await directTrial(browser, server.origin);
  } finally {
    await browser.close();
    await server.close();
  }
  if (direct.harness) throw new Error(direct.harness);

  console.log(`TD-009 — Black Hole in One, entering Explore (${AS_A_PLAYER ? 'as a player, nothing forced' : 'precondition forced'})\n`);
  for (const [name, runs] of Object.entries(results)) {
    runs.forEach((errors, i) => console.log(`  ${name.padEnd(10)}  trial ${i + 1}: ${describe(errors)}`));
  }
  console.log(`  ${'direct'.padEnd(10)}  stepParticles with no black hole: ${direct.threw ? `threw — ${direct.threw.message}` : 'clean'}`);
  console.log('');

  const all = Object.values(results).flat().flat();
  const foreign = all.filter(err => !isTd009(err));
  if (foreign.length) {
    console.log(`Unclear: ${foreign.length} error(s) not thrown from stepParticles — something other than TD-009. First: ${foreign[0].message}`);
    return 2;
  }
  if (results.control.some(e => e.length)) {
    console.log('Unclear: the control threw, with no black hole behind the menu. The diagnosis is wrong somewhere.');
    return 2;
  }
  const players = ['start menu', 'mid-round'];
  const threw = name => results[name].filter(e => e.length).length;
  const hit = players.filter(name => threw(name) > 0);
  if (!AS_A_PLAYER) {
    const mixed = players.filter(name => threw(name) > 0 && threw(name) < TRIALS);
    if (mixed.length) {
      console.log(`Unclear: ${mixed.join(', ')} threw in some forced trials and not others. The precondition is forced, so it should be all or none.`);
      return 2;
    }
  }
  if (hit.length) {
    console.log(`Present: a player entering Explore hits it — ${hit.map(name => `${name} ${threw(name)}/${TRIALS}`).join(', ')}; control 0/${TRIALS}.`);
    return 1;
  }
  if (direct.threw) {
    console.log('Unclear: every player path is clean, but stepParticles still throws when the black hole is removed. ' +
      'The fix is somewhere other than the defect, which leaves any other way of removing the black hole exposed.');
    return 2;
  }
  if (AS_A_PLAYER) {
    console.log('Clean as a player, and the direct check is clean. Unforced spawning can miss; run without --as-a-player to close the row.');
    return 0;
  }
  console.log(`Fixed: every player path clean in ${TRIALS}/${TRIALS} forced trials, and stepParticles survives the black hole's removal. Close the row with this output.`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (err) {
  console.log(`broken: this script failed before reaching a verdict — ${err.message}\nThat says nothing about TD-009 either way.`);
  process.exitCode = 4;
}
