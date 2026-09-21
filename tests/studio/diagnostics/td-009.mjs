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
// What is tried, each in a fresh browser profile. The routes are the ways a
// player gets from a black hole to the Explore button; each ends in a real tap:
//
//   start menu        — the menu draws a golf hole behind itself; tap Explore.
//   golf, ☰ Menu      — tap Endless, play a moment, open ☰ Menu, tap Explore.
//   golf, ⚙️ Play tab  — tap Endless, play, open ⚙️, switch to the Play tab, tap Explore.
//   shared map, ☰ Menu — open a shared map link, play it, its own ☰ Menu, tap Explore.
//   control           — Explore played once first, so the menu draws Explore's world,
//                       which has no black hole. Must be clean, or the diagnosis is wrong.
//   direct            — no route at all. In a golf round, spawn spirals by calling
//                       `stepParticles`, **prove they exist**, remove the black hole and
//                       step once. This is the defect itself, whatever state the game is
//                       in, so a fix that only covers the routes above is not reported
//                       fixed — the routes show that players reach it, and the direct
//                       check shows whether it is gone.
//
// The direct check counts spirals without reaching into the module: it swaps the
// black hole for one whose `x` counts its reads, steps once with no time passing
// and no spawning, and subtracts the reads the same step makes with no particles
// at all. What is left is one read per spiral moved around the black hole. If it
// cannot create a single spiral in a golf round, it says so rather than
// reporting a clean result it never tested.
//
// By default the precondition is forced — every frame spawns a spiral — so each
// result is certain. `--as-a-player` forces nothing: spirals then spawn on about
// one frame in eleven, so a miss is possible; use the default mode to close the row.

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve, launch, chromeAvailable, chromePath } from '../lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const GAME = '/games/black-hole-in-one/';
/** A shared-map link's payload: a tee and a black hole, nothing else. */
const SHARED_MAP = 'W1swLDUwLDg1XSxbMSw1MCwxNV1d';
const TRIALS = 3;
/** Frames played with spawning forced, so the precondition is certain rather than likely. */
const FORCED_FRAMES = 30;
/** In player mode, how long to look at the menu or play before leaving it. */
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

/** The player routes, and the control. Each sets up the moment before tapping Explore. */
const ROUTES = {
  'start menu': {
    url: GAME,
    setUp: page => letSpiralsSpawn(page)
  },
  'golf, ☰ Menu': {
    url: GAME,
    setUp: async page => {
      await page.click('#modeEndless');
      await letSpiralsSpawn(page);
      await page.click('#helpBtn');
      await sleep(300);
    }
  },
  'golf, ⚙️ Play tab': {
    url: GAME,
    setUp: async page => {
      await page.click('#modeEndless');
      await letSpiralsSpawn(page);
      await page.click('#settingsBtn');
      await sleep(150);
      await page.click('.howto-tab[data-tab="play"]');
      await sleep(100);
    }
  },
  'shared map, ☰ Menu': {
    url: `${GAME}?map=${SHARED_MAP}`,
    setUp: async page => {
      await page.click('#modeSharedPlay');
      await letSpiralsSpawn(page);
      await page.click('#cb-menu');
      await sleep(250);
    }
  },
  control: {
    url: GAME,
    setUp: async page => {
      // The game remembers the last mode and draws it behind the menu next time.
      await page.click('#modeExplore');
      await sleep(300);
      await page.reload({ waitUntil: 'load' });
      await letSpiralsSpawn(page);
    }
  }
};

/** One route in its own profile. Returns the uncaught errors thrown after tapping Explore. */
async function routeTrial(browser, origin, { url, setUp }) {
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(origin + url, { waitUntil: 'load' });
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

/**
 * The defect itself, in a golf round: spirals proven alive, black hole removed,
 * one step. Returns `{ spirals, threw }`, or `{ unclear }` if the precondition
 * could not be created.
 */
async function directTrial(browser, origin) {
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.goto(origin + GAME, { waitUntil: 'load' });
    await page.click('#modeEndless');
    await sleep(300);
    // One synchronous evaluation from start to finish, so no animation frame
    // runs in between and nothing but these calls touches the particles.
    return await page.evaluate(async game => {
      const ui = await import(game + 'ui.js');
      const { world } = await import(game + 'state.js');
      const hole = world.blackHole;
      if (!hole) return { unclear: 'a golf round has no black hole, so there is nothing for a spiral to orbit' };
      const real = Math.random;
      // Reads of `x` in one step that neither passes time nor spawns.
      const readsOfX = () => {
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
      ui.clearParticles();
      const baseline = readsOfX();
      Math.random = () => 0;
      try { for (let i = 0; i < 10; i++) ui.stepParticles(1 / 60); } finally { Math.random = real; }
      const spirals = readsOfX() - baseline;
      if (spirals <= 0) {
        return { unclear: 'no spiral could be created in a golf round — spawning looks removed altogether, which is a design change to judge by eye, not a fix to confirm here' };
      }
      world.blackHole = null;
      try {
        ui.stepParticles(1 / 60);
        return { spirals, threw: null };
      } catch (err) {
        return { spirals, threw: { message: err.message } };
      } finally {
        world.blackHole = hole;
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
  const results = Object.fromEntries(Object.keys(ROUTES).map(name => [name, []]));
  let direct;
  try {
    for (let i = 0; i < TRIALS; i++) {
      for (const [name, route] of Object.entries(ROUTES)) results[name].push(await routeTrial(browser, server.origin, route));
    }
    direct = await directTrial(browser, server.origin);
  } finally {
    await browser.close();
    await server.close();
  }

  const width = Math.max(...Object.keys(ROUTES).map(n => n.length));
  console.log(`TD-009 — Black Hole in One, entering Explore (${AS_A_PLAYER ? 'as a player, nothing forced' : 'precondition forced'})\n`);
  for (const [name, runs] of Object.entries(results)) {
    runs.forEach((errors, i) => console.log(`  ${name.padEnd(width)}  trial ${i + 1}: ${describe(errors)}`));
  }
  const directLine = direct.unclear ? `could not be tested — ${direct.unclear}`
    : `${direct.spirals} spiral(s) alive, black hole removed: ${direct.threw ? `threw — ${direct.threw.message}` : 'clean'}`;
  console.log(`  ${'direct'.padEnd(width)}  ${directLine}`);
  console.log('');

  const all = Object.values(results).flat();
  const foreign = all.flat().filter(err => !isTd009(err));
  if (foreign.length) {
    console.log(`Unclear: ${foreign.length} error(s) not thrown from stepParticles — something other than TD-009. First: ${foreign[0].message}`);
    return 2;
  }
  if (results.control.some(e => e.length)) {
    console.log('Unclear: the control threw, with no black hole behind the menu. The diagnosis is wrong somewhere.');
    return 2;
  }
  const routes = Object.keys(ROUTES).filter(name => name !== 'control');
  const threw = name => results[name].filter(e => e.length).length;
  if (!AS_A_PLAYER) {
    const mixed = routes.filter(name => threw(name) > 0 && threw(name) < TRIALS);
    if (mixed.length) {
      console.log(`Unclear: ${mixed.join(', ')} threw in some forced trials and not others. The precondition is forced, so it should be all or none.`);
      return 2;
    }
  }
  const hit = routes.filter(name => threw(name) > 0);
  if (hit.length) {
    console.log(`Present: a player entering Explore hits it — ${hit.map(name => `${name} ${threw(name)}/${TRIALS}`).join(', ')}; control 0/${TRIALS}.`);
    return 1;
  }
  if (direct.unclear) {
    console.log(`Unclear: every route is clean, but the direct check could not be run: ${direct.unclear}.`);
    return 2;
  }
  if (direct.threw) {
    console.log(`Unclear: every route is clean, but with ${direct.spirals} spiral(s) alive stepParticles still throws when the black hole is removed. ` +
      'The fix covers the routes tried here and not the defect, so any other way of reaching Explore with spirals alive is still exposed.');
    return 2;
  }
  if (AS_A_PLAYER) {
    console.log('Clean as a player, and the direct check is clean. Unforced spawning can miss; run without --as-a-player to close the row.');
    return 0;
  }
  console.log(`Fixed: every route clean in ${TRIALS}/${TRIALS} forced trials, and with ${direct.spirals} spiral(s) alive stepParticles survives the black hole's removal. Close the row with this output.`);
  return 0;
}

try {
  process.exitCode = await main();
} catch (err) {
  console.log(`broken: this script failed before reaching a verdict — ${err.message}\nThat says nothing about TD-009 either way.`);
  process.exitCode = 4;
}
