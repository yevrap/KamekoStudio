// SHS-057 — the 3D landing page's River Run portal opens the studio fork.
//
// Two layers, like the fork's own tests:
//
//  1. The source — every portal in `shared/3d/constants.js` leads to a page that
//     exists, River Run's to the fork and every other one to its production
//     game. The rule that admits the edit is tested in rules.test.mjs.
//  2. The browser — on `3d.html`, stand at River Run's portal, press E, and the
//     page that opens is the fork. Reading the list proves what it says; walking
//     through the door proves what the landing page does with it.

import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STUDIO_FORK_PORTALS } from './lib/rules.mjs';
import { chromeAvailable, collectErrors, launch, serve, settle } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CONSTANTS = readFileSync(path.join(ROOT, 'shared/3d/constants.js'), 'utf8');

/** `{ name, url }` for every entry in ARCADE_GAMES, in order. */
function portals(source) {
  const list = source.match(/export const ARCADE_GAMES = \[([\s\S]*?)\n\];/);
  assert.ok(list, 'could not find ARCADE_GAMES in shared/3d/constants.js');
  return [...list[1].matchAll(/\{\s*name:\s*"([^"]+)",\s*url:\s*"([^"]+)"/g)]
    .map(([, name, url]) => ({ name, url }));
}

const RIVER_RUN = STUDIO_FORK_PORTALS.find(p => p.name === 'River Run Rapids');

// ---- 1. The source ------------------------------------------------------------

test('River Run\'s portal points at the studio fork', () => {
  const entry = portals(CONSTANTS).find(p => p.name === 'River Run Rapids');
  assert.ok(entry, 'River Run Rapids is not in ARCADE_GAMES');
  assert.equal(entry.url, 'studio/games/river-run/');
  assert.equal(entry.url, RIVER_RUN.to);
});

test('every portal without a fork still leads to its production game', () => {
  const forked = new Set(STUDIO_FORK_PORTALS.map(p => p.name));
  const others = portals(CONSTANTS).filter(p => !forked.has(p.name));
  assert.ok(others.length >= 10, `expected the arcade's other portals, found ${others.length}`);
  for (const { name, url } of others) {
    assert.match(url, /^games\/[a-z0-9-]+\/$/, `${name} → ${url}`);
  }
});

test('every portal url resolves to a directory with an index.html', () => {
  for (const { name, url } of portals(CONSTANTS)) {
    assert.ok(existsSync(path.join(ROOT, url, 'index.html')), `${name} → ${url} has no index.html`);
  }
});

// ---- 2. The browser -----------------------------------------------------------

test('on 3d.html, walking into the River Run portal opens the fork',
  { skip: chromeAvailable() ? false : 'no Chrome; set CHROME_PATH', timeout: 60_000 },
  async () => {
    const server = await serve(ROOT);
    const browser = await launch();
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1024, height: 768 });
      const errors = collectErrors(page);
      await page.goto(`${server.origin}/3d.html`, { waitUntil: 'load' });
      await settle();
      // The favicon is the one request a browser makes unasked.
      const real = errors.filter(e => !/favicon\.ico/.test(e.text));
      assert.deepEqual(real.map(e => e.text), [], '3d.html boots cleanly');

      // Stand at the portal the landing page built for River Run, and let the
      // frame loop notice. Nothing is set on the portal state directly: the
      // page's own proximity code has to pick it.
      const target = await page.evaluate(async () => {
        const { engineState, state } = await import('/shared/3d/state.js');
        const portal = engineState.portals.find(p => p.userData.game.name === 'River Run Rapids');
        if (!portal) return { error: 'no River Run portal was built' };
        engineState.player.position.x = portal.position.x;
        engineState.player.position.z = portal.position.z;
        await new Promise(r => setTimeout(r, 500));
        return { active: state.currentActivePortal && state.currentActivePortal.url };
      });
      assert.equal(target.error, undefined, target.error);
      assert.equal(target.active, 'studio/games/river-run/');

      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load' }),
        page.keyboard.press('e')
      ]);
      assert.equal(new URL(page.url()).pathname, '/studio/games/river-run/');
      assert.match(await page.title(), /river/i, 'the fork\'s page opened');
    } finally {
      await browser.close();
      await server.close();
    }
  });
