// river-run-fork.test.mjs — SHS-056: the studio's copy of River Run; SHS-060: its power-ups.
//
// What is proved:
//
//  1. The copy's record. Until SHS-060 this file proved the fork equal, byte for
//     byte, to production's River Run at a named commit plus the closed list of
//     edits in lib/river-run-fork.mjs. SHS-060 retired that equality: the fork's
//     first experiment (power-ups) changes the game on purpose, so "identical plus
//     the list" stopped being true there. What stays is the record — the source
//     commit, the edits, and a test that they still apply to that source — as the
//     account of how the copy was made, not of what it is now.
//  2. Played in a real browser — a run to game over, mute, Watch Mode from the
//     start screen and from the drawer, the drawer's own toggle — it leaves every
//     key outside the studio_ namespace exactly as it found it, while the studio
//     keys really are written. The second half matters: a fork that saved
//     nothing at all would pass the first half on its own.
//  3. The power-ups (SHS-060), in a real browser: the shield takes one hit, the
//     spread shot fires three for its time and then one, the pickup sounds keep
//     to the fork's mute, and Watch Mode plays through a pickup.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gitPath } from './lib/shell.mjs';
import { extractStorageKeys, findStorageViolations } from './lib/rules.mjs';
import { applyEdits, occurrences, EDITS, FORK_KEYS, FORK_PATH, SOURCE_COMMIT, SOURCE_PATH } from './lib/river-run-fork.mjs';
import { chromeAvailable, collectErrors, launch, serve, settle } from './lib/browser.mjs';
import { SHELF } from '../../studio/shelf-data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fork = readFileSync(path.join(ROOT, FORK_PATH), 'utf8');

/** The source file at the named commit, raw: no trimming, so the final newline counts. */
function sourceAtCommit() {
  return execFileSync(gitPath(), ['show', `${SOURCE_COMMIT}:${SOURCE_PATH}`],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

// ---- 1. The copy's record ----------------------------------------------------
//
// Retired at SHS-060: 'the fork is the source at its commit plus the listed
// edits, byte for byte', and its companion 'an unlisted change to the fork breaks
// the equality'. They held from SHS-056 until the power-ups landed.

test('the recorded edits still apply cleanly to the source at its commit', () => {
  assert.doesNotThrow(() => applyEdits(sourceAtCommit()));
});

test('the fork names its source path and commit in the file itself', () => {
  assert.ok(fork.includes(`fork of ${SOURCE_PATH} at ${SOURCE_COMMIT}`));
});

test('an edit whose text has moved is reported, not half-applied', () => {
  const source = sourceAtCommit();
  const wrongCount = EDITS.map((e, i) => (i === 1 ? { ...e, count: e.count + 1 } : e));
  assert.throws(() => applyEdits(source, wrongCount), /expected 3 occurrence/);
});

// ---- The saves ----------------------------------------------------------------

test('every storage call in the fork is a studio_ key the rule can read', () => {
  assert.deepEqual(findStorageViolations(fork), []);
});

test('the fork uses exactly the keys it declares', () => {
  const used = [...new Set(extractStorageKeys(fork).map(k => k.key))].sort();
  assert.deepEqual(used, [...FORK_KEYS].sort());
});

test('Watch Mode is registered under the studio prefix, so settings.js writes studio_ keys', () => {
  assert.equal(occurrences(fork, "registerWatchSection('studio_riverRun',"), 1);
  assert.equal(occurrences(fork, 'registerWatchSection('), 1);
  assert.ok(FORK_KEYS.includes('studio_riverRun_autoPlay'));
});

test('no production River Run key, the unnamespaced muted, or the arcade theme key survives', () => {
  // `'muted'` on its own is also the mute button's CSS class, so the storage
  // calls are what is searched for.
  for (const key of ['riverRunHighScore', "Item('muted'", "Item('theme'", "'riverRun_", 'lastPlayed_riverRun']) {
    assert.equal(occurrences(fork, key), 0, `${key} is still in the fork`);
  }
});

test('the theme comes from the class shared/settings.js sets on body', () => {
  assert.equal(occurrences(fork, "document.body.classList.contains('dark-mode')"), 2);
});

test('every key the fork uses is documented in studio/README.md', () => {
  const readme = readFileSync(path.join(ROOT, 'studio/README.md'), 'utf8');
  for (const key of FORK_KEYS) {
    assert.match(readme, new RegExp(`^\\| \`${key}\` \\|`, 'm'), `${key} has no row in studio/README.md`);
  }
});

// ---- Paths and the shelf ------------------------------------------------------

test('shared paths are re-pointed one directory deeper, and resolve', () => {
  assert.equal(occurrences(fork, '<script src="../../../shared/settings.js" data-gallery-depth="3"></script>'), 1);
  assert.ok(existsSync(path.join(ROOT, path.dirname(FORK_PATH), '../../../shared/settings.js')));
});

test('the shelf lists the fork with a status and a link', () => {
  const entry = SHELF.find(e => e.url === 'games/river-run/');
  assert.ok(entry, 'no shelf entry links to games/river-run/');
  assert.ok(['PROTOTYPE', 'ITERATING'].includes(entry.status));
  assert.ok(existsSync(path.join(ROOT, 'studio', entry.url, 'index.html')));
});

// ---- 2. The browser -----------------------------------------------------------

/** Production's keys, as a player of the arcade would have them. */
const PRODUCTION_SAVES = {
  theme: 'light',
  riverRunHighScore: '98765',
  muted: 'false',
  riverRun_autoPlay: 'false',
  riverRun_invertControls: 'true',
  lastPlayed_riverRun: '1',
  mazeWarden_bestWave: '7'
};

/**
 * One error the fork inherits rather than causes. River Run's music restarts a
 * Tone.js sequence on every new run, and now and then Tone computes a start time
 * a hair below zero (-1e-12) and rejects it. The music code (setupMusic's synth,
 * initGame's sequence restart) is still production's as copied: SHS-060 added a
 * second synth for pickup sounds and left those lines alone, though with the
 * equality test retired that is now a claim read from the diff, not a proof.
 * Matched exactly: negative values only, this message only. SHS-061 fixes it in
 * the fork and removes this exemption (TD-014).
 */
const INHERITED_TONE_RANGE = /^uncaught: Uncaught \(in promise\) RangeError: Value must be within \[0, Infinity\], got: -\d(\.\d+)?e-\d+$/;

/**
 * What shared/settings.js does on every page load, the arcade's too: it drops the
 * retired token keys (ADR-0003). Not the fork's doing, and not a save.
 */
const SETTINGS_LOAD_REMOVALS = ['removeItem tokens', 'removeItem tokenHistory'];

const notStudio = store => Object.fromEntries(Object.entries(store).filter(([k]) => !k.startsWith('studio_')).sort());

test('in a browser, playing the fork leaves every non-studio key exactly as it was',
  { skip: chromeAvailable() ? false : 'no Chrome; set CHROME_PATH', timeout: 120_000 },
  async t => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      const page = await browser.newPage();
      const errors = collectErrors(page);
      // The one request a browser makes unasked; the repository ships no favicon.
      await page.setRequestInterception(true);
      page.on('request', r => (new URL(r.url()).pathname === '/favicon.ico'
        ? r.respond({ status: 200, contentType: 'image/x-icon', body: '' })
        : r.continue()));
      await page.setViewport({ width: 390, height: 780, isMobile: true, hasTouch: true });

      const url = `${site.origin}/studio/games/river-run/`;
      await page.goto(url, { waitUntil: 'networkidle2' });
      await page.evaluate(saves => {
        localStorage.clear();
        for (const [k, v] of Object.entries(saves)) localStorage.setItem(k, v);
      }, PRODUCTION_SAVES);
      // Record every localStorage write from here on. Comparing the store
      // before and after cannot see a write that puts back the value a key
      // already had (iteration 05 review, finding 3); the log can.
      await page.evaluateOnNewDocument(() => {
        window.__storageWrites = [];
        for (const name of ['setItem', 'removeItem']) {
          const original = Storage.prototype[name];
          Storage.prototype[name] = function (key, ...rest) {
            if (this === window.localStorage) window.__storageWrites.push(`${name} ${key}`);
            return original.call(this, key, ...rest);
          };
        }
        const clear = Storage.prototype.clear;
        Storage.prototype.clear = function () {
          if (this === window.localStorage) window.__storageWrites.push('clear');
          return clear.call(this);
        };
      });
      await page.reload({ waitUntil: 'networkidle2' });
      await settle();

      const dump = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
      const before = notStudio(await dump());
      assert.deepEqual(before, notStudio(PRODUCTION_SAVES), 'the page changed production keys just by loading');

      // The arcade's light theme reached the fork through body.dark-mode, not a key read.
      assert.equal(await page.evaluate(() => isDarkMode), false);
      // The arcade's invert setting did not leak in.
      assert.equal(await page.evaluate(() => invertControls), false);

      // Play a run to game over with a point on the board, so the high score is
      // written. Left to chance, an unattended run outlived the 60-second wait
      // about one time in three (it failed the push stage twice in sprint 05),
      // and one hit by the first rock ends at zero and never saves. So the test
      // waits for a point, restarting a run that ends without one, then moves a
      // rock onto the boat. The game's own collision code still ends the run.
      await page.click('#start-button');
      for (let attempt = 1; ; attempt++) {
        await page.waitForFunction(() => score > 0 || isGameOver, { timeout: 60_000, polling: 100 });
        if (await page.evaluate(() => score > 0)) break;
        assert.ok(attempt < 3, 'three runs in a row ended before scoring a point');
        await page.click('#start-button');
      }
      await page.waitForFunction(() => {
        if (isGameOver) return true;
        const rock = obstacles.find(o => o.mesh.parent === scene);
        if (rock) rock.mesh.position.set(boat.position.x, rock.mesh.position.y, boat.position.z + gameSpeed);
        return false;
      }, { timeout: 10_000, polling: 100 });
      assert.ok(await page.evaluate(() => score > 0), 'the run ended with a point on the board');

      // Mute, then Watch Mode from the start screen.
      await page.click('#mute-toggle');
      await page.click('#start-watch-button');
      await settle(500);
      assert.equal(await page.evaluate(() => autoPlay), true);

      // Stop it from the drawer, and flip the drawer's own toggle.
      const clickInDrawer = text => page.evaluate(label => {
        const el = [...document.querySelectorAll('#settings-panel button')].find(b => b.textContent.trim() === label);
        if (!el) throw new Error(`no drawer button "${label}"`);
        el.click();
      }, text);
      await page.evaluate(() => window.KamekoSettings.openDrawer());
      await settle(300);
      await clickInDrawer('Take Over / Stop');
      await settle(300);
      assert.equal(await page.evaluate(() => autoPlay), false);

      await page.evaluate(() => window.KamekoSettings.openDrawer());
      await settle(300);
      await clickInDrawer('▶ Watch');
      await settle(300);
      await page.evaluate(() => window.KamekoSettings.openDrawer());
      await settle(300);
      await clickInDrawer('Take Over / Stop');
      await page.evaluate(() => window.KamekoSettings.openDrawer());
      await settle(300);
      await page.evaluate(() => {
        const row = [...document.querySelectorAll('#settings-panel .settings-row')]
          .find(r => r.textContent.includes('Invert Drag'));
        if (!row) throw new Error('no Invert Drag row in the drawer');
        row.querySelector('input[type=checkbox]').click();
      });
      await page.evaluate(() => window.KamekoSettings.closeDrawer());
      await settle(300);

      const after = await dump();
      assert.deepEqual(notStudio(after), before, 'a non-studio key changed');
      const writes = await page.evaluate(() => window.__storageWrites);
      assert.ok(writes.some(w => w.startsWith('setItem studio_')), 'the write log saw no studio write, so it is not recording');
      assert.deepEqual(writes.filter(w => !w.split(' ')[1]?.startsWith('studio_') && !SETTINGS_LOAD_REMOVALS.includes(w)), [],
        'a non-studio key was written, even if back to the value it had');

      // And the studio's own saves were really made.
      assert.ok(Number(after.studio_riverRun_highScore) > 0, 'no high score was saved');
      assert.equal(after.studio_riverRun_muted, 'false', 'mute was not saved (fresh default is muted, one toggle unmutes)');
      assert.equal(after.studio_riverRun_autoPlay, 'false');
      assert.ok(Number(after.studio_riverRun_lastPlayed) > 0);
      assert.equal(after.studio_riverRun_invertControls, 'true');

      const inherited = errors.filter(e => INHERITED_TONE_RANGE.test(e.text));
      if (inherited.length) t.diagnostic(`inherited Tone.js RangeError seen ${inherited.length}×`);
      assert.deepEqual(errors.filter(e => !inherited.includes(e)).map(e => e.text), []);
      await page.evaluate(() => localStorage.clear());
    } finally {
      await browser.close();
      await site.close();
    }
  });

// ---- 3. The power-ups (SHS-060) ----------------------------------------------

/**
 * Opens the fork on a fresh store, phone-sized, and returns helpers for driving
 * a run. `quiet()` stops the river spawning rocks, logs and pickups by itself and
 * clears what is on it, so each test places exactly what it checks.
 */
async function openFork(browser, origin) {
  const page = await browser.newPage();
  const errors = collectErrors(page);
  await page.setRequestInterception(true);
  page.on('request', r => (new URL(r.url()).pathname === '/favicon.ico'
    ? r.respond({ status: 200, contentType: 'image/x-icon', body: '' })
    : r.continue()));
  await page.setViewport({ width: 390, height: 780, isMobile: true, hasTouch: true });
  await page.goto(`${origin}/studio/games/river-run/`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await settle();
  const start = async selector => {
    await page.click(selector);
    await page.waitForFunction(() => !isGameOver && audioStarted, { timeout: 10_000, polling: 50 });
  };
  const quiet = () => page.evaluate(() => {
    obstacleSpawnTimer = -1e9; powerUpSpawnTimer = -1e9;
    obstacles.forEach(o => scene.remove(o.mesh)); obstacles = [];
  });
  /** A pickup of `type`, floating toward the boat from `ahead` units up the river. */
  const pickupAhead = (type, ahead = 3) => page.evaluate((type, ahead) => {
    spawnPowerUp(type);
    powerUp.mesh.position.set(boat.position.x, powerUp.mesh.position.y, boat.position.z + ahead);
  }, type, ahead);
  /** A rock about to hit the boat. */
  const rockOnBoat = () => page.evaluate(() => {
    spawnObstacle();
    const rock = obstacles[obstacles.length - 1];
    rock.mesh.position.set(boat.position.x, rock.mesh.position.y, boat.position.z + 1);
  });
  const hud = () => page.evaluate(() => ({ text: powerHud.textContent, shown: getComputedStyle(powerHud).display !== 'none' }));
  const unexpected = () => errors.filter(e => !INHERITED_TONE_RANGE.test(e.text)).map(e => e.text);
  return { page, start, quiet, pickupAhead, rockOnBoat, hud, unexpected };
}

test('in a browser, the fork\'s power-ups do what they say',
  { skip: chromeAvailable() ? false : 'no Chrome; set CHROME_PATH', timeout: 120_000 },
  async t => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      await t.test('the shield takes the next hit instead of the run, and shows while it lasts', async () => {
        const f = await openFork(browser, site.origin);
        await f.start('#start-button');
        await f.quiet();
        assert.equal(await f.page.evaluate(() => shieldMesh.visible), false);
        await f.pickupAhead('shield');
        await f.page.waitForFunction(() => shieldActive, { timeout: 10_000, polling: 50 });
        assert.equal(await f.page.evaluate(() => powerUp), null, 'the pickup is still floating after it was taken');
        assert.equal(await f.page.evaluate(() => shieldMesh.visible), true, 'the shield does not show on the boat');
        assert.deepEqual(await f.hud(), { text: '\u{1F6E1} SHIELD', shown: true });

        await f.rockOnBoat();
        await f.page.waitForFunction(() => !shieldActive || isGameOver, { timeout: 10_000, polling: 50 });
        assert.equal(await f.page.evaluate(() => isGameOver), false, 'the shielded hit ended the run');
        assert.equal(await f.page.evaluate(() => obstacles.length), 0, 'the rock the shield took is still on the river');
        assert.equal(await f.page.evaluate(() => shieldMesh.visible), false, 'the used shield still shows');
        assert.equal((await f.hud()).shown, false);

        await f.rockOnBoat();
        await f.page.waitForFunction(() => isGameOver, { timeout: 10_000, polling: 50 });
        assert.deepEqual(f.unexpected(), []);
        await f.page.close();
      });

      await t.test('the spread shot fires three for its time, counts down on screen, then fires one', async () => {
        const f = await openFork(browser, site.origin);
        await f.start('#start-button');
        await f.quiet();
        const volley = () => f.page.evaluate(() => {
          const before = activeProjectiles.length;
          shootProjectile();
          return activeProjectiles.slice(before).map(p => Math.sign(Math.round(p.direction.x * 100)));
        });
        assert.deepEqual(await volley(), [0], 'a normal shot is one, straight ahead');

        await f.pickupAhead('rapid');
        await f.page.waitForFunction(() => rapidFireFrames > 0, { timeout: 10_000, polling: 50 });
        assert.deepEqual((await volley()).sort(), [-1, 0, 1], 'the spread is one straight and one to each side');
        const first = await f.hud();
        assert.ok(first.shown && /^✦ SPREAD \d\.\ds$/.test(first.text), `the timer reads "${first.text}"`);
        await settle(400);
        const later = await f.hud();
        assert.ok(parseFloat(later.text.split(' ')[2]) < parseFloat(first.text.split(' ')[2]), 'the timer is not counting down');

        await f.page.evaluate(() => { rapidFireFrames = 3; });
        await f.page.waitForFunction(() => rapidFireFrames === 0, { timeout: 5_000, polling: 50 });
        assert.equal((await f.hud()).shown, false, 'the timer outlived the spread shot');
        assert.deepEqual(await volley(), [0], 'shooting did not return to normal');
        assert.deepEqual(f.unexpected(), []);
        await f.page.close();
      });

      await t.test('pickup sounds play only when the fork is unmuted', async () => {
        const f = await openFork(browser, site.origin);
        await f.start('#start-button');
        await f.quiet();
        await f.page.evaluate(() => {
          window.__sfxNotes = 0;
          const play = sfxSynth.triggerAttackRelease.bind(sfxSynth);
          sfxSynth.triggerAttackRelease = (...args) => { window.__sfxNotes++; return play(...args); };
        });
        // A fresh store starts muted.
        assert.equal(await f.page.evaluate(() => isMuted), true);
        await f.pickupAhead('shield');
        await f.page.waitForFunction(() => shieldActive, { timeout: 10_000, polling: 50 });
        await f.pickupAhead('rapid');
        await f.page.waitForFunction(() => rapidFireFrames > 0, { timeout: 10_000, polling: 50 });
        assert.equal(await f.page.evaluate(() => window.__sfxNotes), 0, 'a pickup sounded while muted');

        await f.page.click('#mute-toggle');
        assert.equal(await f.page.evaluate(() => localStorage.getItem('studio_riverRun_muted')), 'false');
        await f.pickupAhead('rapid');
        await f.page.waitForFunction(() => powerUp === null, { timeout: 10_000, polling: 50 });
        assert.equal(await f.page.evaluate(() => window.__sfxNotes), 2, 'an unmuted pickup made no sound');
        assert.deepEqual(f.unexpected(), []);
        await f.page.close();
      });

      await t.test('Watch Mode plays through a pickup without steering from it or shooting at it', async () => {
        const f = await openFork(browser, site.origin);
        await f.start('#start-watch-button');
        assert.equal(await f.page.evaluate(() => autoPlay), true);
        await f.quiet();
        const x = await f.page.evaluate(() => boat.position.x);
        await f.pickupAhead('rapid', 8);
        await f.page.waitForFunction(() => rapidFireFrames > 0 || powerUp === null, { timeout: 15_000, polling: 50 });
        assert.equal(await f.page.evaluate(() => rapidFireFrames > 0), true, 'the auto boat did not take the pickup in its path');
        assert.equal(await f.page.evaluate(() => boat.position.x), x, 'the auto boat swerved from a pickup');
        assert.equal(await f.page.evaluate(() => activeProjectiles.length), 0, 'the auto boat shot at a pickup');

        // And it still plays: the next rock is shot or dodged, and the run goes on.
        await f.page.evaluate(() => { obstacleSpawnTimer = 0; });
        await settle(3000);
        assert.equal(await f.page.evaluate(() => autoPlay && !isGameOver), true);
        assert.deepEqual(f.unexpected(), []);
        await f.page.close();
      });
    } finally {
      await browser.close();
      await site.close();
    }
  });
