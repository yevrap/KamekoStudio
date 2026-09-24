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
//     spread shot fires three for its time (a fast burst too) and then one, the
//     pickup sounds keep to the fork's mute, and Watch Mode plays through a pickup.
//  4. Twenty new runs in a row (SHS-061): each restart gets its game loop and its
//     music back, and not one of them throws. Until SHS-061 the music restart
//     threw now and then (Tone.js RangeError, a stop time a hair below zero),
//     which aborted the restart and froze the run; a named exemption let it by.
//  5. The power-up HUD (SHS-064): at 390 and 320 wide, with a shield and a spread
//     shot active and a four-digit score, the score reads on one line and the
//     score, the power-up label, "← Studio", Mute and the settings button each
//     sit whole on screen with no two overlapping; and the power-up clocks (the
//     spread shot, the first pickup, the gap between pickups) count wall-clock
//     seconds at 60 and at 120 updates a second, and stand still while the
//     settings drawer is open.
//  6. The power-ups read at a glance (SHS-069): at 390 and 320 wide, a pickup at
//     its spawn distance draws at least 12 px across and keeps its colour, the
//     pickup box is still the pickup alone (one passing just beside the boat is
//     not taken), and the power-up label is one height with the shield, the
//     spread shot, or both.

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

      assert.deepEqual(errors.map(e => e.text), []);
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
async function openFork(browser, origin, { width = 390, height = 780 } = {}) {
  const page = await browser.newPage();
  const errors = collectErrors(page);
  await page.setRequestInterception(true);
  page.on('request', r => (new URL(r.url()).pathname === '/favicon.ico'
    ? r.respond({ status: 200, contentType: 'image/x-icon', body: '' })
    : r.continue()));
  await page.setViewport({ width, height, isMobile: true, hasTouch: true });
  await page.goto(`${origin}/studio/games/river-run/`, { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'networkidle2' });
  await settle();
  const start = async selector => {
    await page.click(selector);
    await page.waitForFunction(() => !isGameOver && audioStarted, { timeout: 10_000, polling: 50 });
  };
  const quiet = () => page.evaluate(() => {
    obstacleSpawnTimer = -1e9; powerUpSpawnClock = -1e9;
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
  const unexpected = () => errors.map(e => e.text);
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
        await f.page.waitForFunction(() => rapidFireLeft > 0, { timeout: 10_000, polling: 50 });
        assert.deepEqual((await volley()).sort(), [-1, 0, 1], 'the spread is one straight and one to each side');
        const first = await f.hud();
        assert.ok(first.shown && /^✦ SPREAD \d\.\ds$/.test(first.text), `the timer reads "${first.text}"`);
        await settle(400);
        const later = await f.hud();
        assert.ok(parseFloat(later.text.split(' ')[2]) < parseFloat(first.text.split(' ')[2]), 'the timer is not counting down');

        // Iteration 06 review (QA F1): fast taps ran the 30-shot pool dry, and a tap fired nothing.
        const burst = await f.page.evaluate(() => {
          const sizes = [];
          for (let i = 0; i < 25; i++) {
            const before = activeProjectiles.length;
            shootProjectile();
            sizes.push(activeProjectiles.length - before);
          }
          return sizes;
        });
        assert.deepEqual(burst, Array(25).fill(3), 'a fast burst of spread volleys ran out of shots');
        assert.ok(await f.page.evaluate(() => activeProjectiles.some(p => p.direction.x > 0.1)), 'no side shot to follow');
        await f.page.evaluate(() => {
          const p = activeProjectiles.find(q => q.direction.x > 0.1);
          p.mesh.position.x = riverWidth; window.__offRiver = p.mesh;
        });
        await f.page.waitForFunction(() => !activeProjectiles.some(p => p.mesh === window.__offRiver),
          { timeout: 5_000, polling: 50 }).catch(() => assert.fail('a shot past the river bank stays in flight'));

        await f.page.evaluate(() => { rapidFireLeft = 0.05; });
        await f.page.waitForFunction(() => rapidFireLeft === 0, { timeout: 5_000, polling: 50 });
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
        await f.page.waitForFunction(() => rapidFireLeft > 0, { timeout: 10_000, polling: 50 });
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
        await f.page.waitForFunction(() => rapidFireLeft > 0 || powerUp === null, { timeout: 15_000, polling: 50 });
        assert.equal(await f.page.evaluate(() => rapidFireLeft > 0), true, 'the auto boat did not take the pickup in its path');
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

// ---- 4. Restarts (SHS-061) ------------------------------------------------------

test('in a browser, twenty new runs in a row each start cleanly, with the loop and the music running',
  { skip: chromeAvailable() ? false : 'no Chrome; set CHROME_PATH', timeout: 120_000 },
  async () => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      const f = await openFork(browser, site.origin);
      await f.start('#start-button');
      for (let run = 2; run <= 20; run++) {
        // A short run, ended the way a rock ends it, then Restart. Uneven run
        // lengths, because the throw depended on where the Transport stopped.
        await settle(20 + (run * 37) % 180);
        await f.page.evaluate(() => gameOver());
        await f.start('#start-button');
        await f.page.waitForFunction(() => animationFrameId !== null && Tone.Transport.state === 'started',
          { timeout: 5_000, polling: 20 }).catch(() => {
          throw new Error(`run ${run} did not start its game loop and music: ${JSON.stringify(f.unexpected())}`);
        });
        assert.deepEqual(f.unexpected(), [], `run ${run} threw`);
      }
      // And the music is really playing the restarted sequence, not a stale one.
      const beats = await f.page.evaluate(() => new Promise(resolve => {
        let n = 0;
        const play = musicSynth.triggerAttackRelease.bind(musicSynth);
        musicSynth.triggerAttackRelease = (...args) => { n++; return play(...args); };
        setTimeout(() => resolve(n), 1500);
      }));
      assert.ok(beats > 0, 'no music note played after the twentieth restart');
      // 90 bpm quarter notes: two or three in 1.5 s. Old sequences left on the
      // Transport would play alongside it, many times over.
      assert.ok(beats <= 4, `${beats} notes in 1.5 s: earlier runs' sequences are still playing`);
      assert.deepEqual(f.unexpected(), []);
      await f.page.close();
    } finally {
      await browser.close();
      await site.close();
    }
  });

// ---- 5. The power-up HUD at phone width, in real seconds (SHS-064) ------------

test('in a browser, the score, the power-up label and the top buttons stay whole and apart at phone width',
  { skip: chromeAvailable() ? false : 'no Chrome; set CHROME_PATH', timeout: 120_000 },
  async t => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      for (const [width, height] of [[390, 780], [320, 640]]) {
        await t.test(`${width}×${height}, shield and spread active, score 1234`, async () => {
          const f = await openFork(browser, site.origin, { width, height });
          await f.start('#start-button');
          await f.quiet();
          await f.pickupAhead('shield');
          await f.page.waitForFunction(() => shieldActive, { timeout: 10_000, polling: 50 });
          await f.pickupAhead('rapid');
          await f.page.waitForFunction(() => /SPREAD/.test(powerHud.textContent), { timeout: 10_000, polling: 50 });
          const seen = await f.page.evaluate(() => {
            score = 1234; scoreElement.textContent = `Score: ${score}`;
            const box = el => {
              const b = el.getBoundingClientRect();
              return { left: b.left, top: b.top, right: b.right, bottom: b.bottom, width: b.width, height: b.height };
            };
            const text = document.createRange();
            text.selectNodeContents(scoreElement);
            return {
              vw: innerWidth, vh: innerHeight, label: powerHud.textContent,
              scoreLines: new Set([...text.getClientRects()].map(r => Math.round(r.top))).size,
              boxes: {
                'the score': box(scoreElement),
                'the power-up label': box(powerHud),
                '← Studio': box(document.querySelector('#top-controls .back')),
                'Mute': box(muteToggle),
                'the settings button': box(document.getElementById('settings-hamburger-btn'))
              }
            };
          });
          assert.match(seen.label, /SHIELD.*SPREAD/, 'the label is not showing both power-ups');
          assert.equal(seen.scoreLines, 1, `"Score: 1234" wraps onto ${seen.scoreLines} lines`);
          const named = Object.entries(seen.boxes);
          for (const [name, b] of named) {
            assert.ok(b.width > 0 && b.height > 0, `${name} is not showing`);
            assert.ok(b.left >= -0.5 && b.top >= -0.5 && b.right <= seen.vw + 0.5 && b.bottom <= seen.vh + 0.5,
              `${name} is cut off by the screen edge: ${JSON.stringify(b)}`);
          }
          for (let i = 0; i < named.length; i++) {
            for (let j = i + 1; j < named.length; j++) {
              const [a, p] = named[i]; const [b, q] = named[j];
              const overlapX = Math.min(p.right, q.right) - Math.max(p.left, q.left);
              const overlapY = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
              assert.ok(overlapX <= 0.5 || overlapY <= 0.5,
                `${a} and ${b} overlap: ${JSON.stringify(p)} / ${JSON.stringify(q)}`);
            }
          }
          for (const name of ['← Studio', 'Mute']) {
            const b = seen.boxes[name];
            assert.ok(b.width >= 44 && b.height >= 44, `${name}'s tap target is ${b.width}×${b.height}`);
          }
          assert.deepEqual(f.unexpected(), []);
          await f.page.close();
        });
      }
    } finally {
      await browser.close();
      await site.close();
    }
  });

/**
 * One run on a quiet river, timed inside the page: when the first pickup
 * appears (counted from the run's first update), how long the spread shot it
 * turns into lasts, how far its label strays from the time really left, and
 * the gap until the next pickup. `doubled` runs two updates per animation
 * frame, which is what a 120 Hz screen does to a frame-counted clock.
 */
async function timePowerUps(f, doubled) {
  await f.page.evaluate(doubled => {
    const once = updateGame;
    window.__firstUpdate = null;
    updateGame = function () {
      if (window.__firstUpdate === null) window.__firstUpdate = performance.now();
      once();
      if (doubled) once();
    };
  }, doubled);
  await f.start('#start-button');
  // No rocks or logs: the pickup clock runs on its own, and nothing ends the run.
  await f.page.evaluate(() => { obstacleSpawnTimer = -1e9; });
  return f.page.evaluate(() => new Promise((resolve, reject) => {
    const out = { firstSpawn: null, spread: null, labelOff: 0, nextSpawn: null };
    let spreadStart = null;
    const tick = () => {
      const now = (performance.now() - window.__firstUpdate) / 1000;
      if (out.firstSpawn === null) {
        if (powerUp) {
          out.firstSpawn = now;
          // Whatever came, make it a spread shot and put it on the boat.
          spawnPowerUp('rapid');
          powerUp.mesh.position.set(boat.position.x, powerUp.mesh.position.y, boat.position.z);
        }
      } else if (spreadStart === null) {
        if (/SPREAD/.test(powerHud.textContent)) spreadStart = now;
      } else {
        const shown = powerHud.textContent.match(/SPREAD (\d+\.\d)s/);
        if (shown && out.spread === null) {
          out.labelOff = Math.max(out.labelOff, Math.abs(parseFloat(shown[1]) - (6 - (now - spreadStart))));
        } else if (!shown && out.spread === null) {
          out.spread = now - spreadStart;
        }
        if (powerUp) { out.nextSpawn = now - spreadStart; resolve(out); return; }
      }
      if (now > 40) { reject(new Error(`no second pickup within 40 s: ${JSON.stringify(out)}`)); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }));
}

test('in a browser, the power-up clocks count real seconds at 60 and 120 updates a second, and stop for the drawer',
  { skip: chromeAvailable() ? false : 'no Chrome; set CHROME_PATH', timeout: 180_000 },
  async t => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      for (const doubled of [false, true]) {
        await t.test(doubled ? 'two updates a frame (120 fps)' : 'one update a frame (60 fps)', async () => {
          const f = await openFork(browser, site.origin);
          const tl = await timePowerUps(f, doubled);
          const near = (seen, want, what) => assert.ok(Math.abs(seen - want) <= 0.3,
            `${what}: ${seen.toFixed(2)} s, not ${want} ± 0.3 s (${JSON.stringify(tl)})`);
          near(tl.firstSpawn, 5, 'the first pickup came after');
          near(tl.spread, 6, 'the spread shot lasted');
          assert.ok(tl.labelOff <= 0.3, `the label strayed ${tl.labelOff.toFixed(2)} s from the time left`);
          near(tl.nextSpawn, 10, 'the next pickup came after');
          assert.deepEqual(f.unexpected(), []);
          await f.page.close();
        });
      }

      await t.test('with the drawer open, the spread timer and the pickup clock stand still, then carry on', async () => {
        const f = await openFork(browser, site.origin);
        await f.start('#start-button');
        await f.quiet();
        await f.pickupAhead('rapid');
        await f.page.waitForFunction(() => rapidFireLeft > 0 && powerUp === null, { timeout: 10_000, polling: 50 });
        await f.page.evaluate(() => { powerUpSpawnClock = 0; });
        await settle(300);
        const clocks = () => f.page.evaluate(() => ({ spread: rapidFireLeft, pickup: powerUpSpawnClock, label: powerHud.textContent }));
        await f.page.evaluate(() => window.KamekoSettings.openDrawer());
        await settle(100);
        const opened = await clocks();
        await settle(1500);
        const stillOpen = await clocks();
        assert.deepEqual(stillOpen, opened, 'a clock moved while the drawer was open');
        await f.page.evaluate(() => window.KamekoSettings.closeDrawer());
        await settle(1000);
        const after = await clocks();
        const ran = { spread: opened.spread - after.spread, pickup: after.pickup - opened.pickup };
        assert.ok(ran.spread >= 0.7 && ran.spread <= 1.3, `the spread timer ran ${ran.spread.toFixed(2)} s in the second after closing`);
        assert.ok(ran.pickup >= 0.7 && ran.pickup <= 1.3, `the pickup clock ran ${ran.pickup.toFixed(2)} s in the second after closing`);
        assert.deepEqual(f.unexpected(), []);
        await f.page.close();
      });
    } finally {
      await browser.close();
      await site.close();
    }
  });

// ---- 6. The power-ups read at a glance (SHS-069) ------------------------------
//
// A pickup at its spawn distance, measured by what it draws: the frame is
// rendered twice, with and without whatever spawnPowerUp() added to the scene,
// and the pixels that differ are the pickup as a player sees it.

/** Spawns a `type` pickup in the middle of the river at its spawn distance and measures what it draws. */
const measureFarPickup = type => {
  const before = new Set(scene.children);
  spawnPowerUp(type);
  powerUp.mesh.position.x = boat.position.x;
  const added = scene.children.filter(o => !before.has(o));
  // Whatever follows the pickup is placed by the loop; one update's worth, with the river still.
  const speed = gameSpeed; gameSpeed = 0;
  try { updateGame(); } finally { gameSpeed = speed; }
  const gl = renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  const grab = () => {
    renderer.render(scene, camera);
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    return px;
  };
  const shown = grab();
  added.forEach(o => { o.userData.wasVisible = o.visible; o.visible = false; });
  const hidden = grab();
  added.forEach(o => { o.visible = o.userData.wasVisible; });
  let minX = w, maxX = -1, minY = h, maxY = -1;
  const changed = [];
  for (let i = 0; i < w * h; i++) {
    const d = Math.abs(shown[i * 4] - hidden[i * 4]) + Math.abs(shown[i * 4 + 1] - hidden[i * 4 + 1])
      + Math.abs(shown[i * 4 + 2] - hidden[i * 4 + 2]);
    if (d <= 24) continue;
    const x = i % w, y = Math.floor(i / w);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    changed.push([d, shown[i * 4], shown[i * 4 + 1], shown[i * 4 + 2]]);
  }
  // The colour a player reads: the most-changed quarter of the pixels, averaged.
  changed.sort((a, b) => b[0] - a[0]);
  const core = changed.slice(0, Math.max(1, Math.ceil(changed.length / 4)));
  const rgb = [1, 2, 3].map(k => core.reduce((s, p) => s + p[k], 0) / core.length);
  const perCss = w / renderer.domElement.clientWidth;
  return {
    width: changed.length ? (maxX - minX + 1) / perCss : 0,
    height: changed.length ? (maxY - minY + 1) / perCss : 0,
    rgb, distance: powerUp.mesh.position.distanceTo(camera.position)
  };
};

/** Hue in degrees of an [r, g, b]. */
function hue([r, g, b]) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
const hueGap = (a, b) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const PICKUP_HUE = { shield: hue([0x22, 0xd3, 0xee]), rapid: hue([0xf4, 0x72, 0xb6]) };

test('in a browser, a pickup far up the river is big enough to steer for, and the power-up label keeps one height',
  { skip: chromeAvailable() ? false : 'no Chrome; set CHROME_PATH', timeout: 180_000 },
  async t => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      for (const [width, height] of [[390, 780], [320, 640]]) {
        await t.test(`${width}×${height}: at its spawn distance each pickup covers 12 px and keeps its colour`, async () => {
          const f = await openFork(browser, site.origin, { width, height });
          await f.start('#start-button');
          await f.quiet();
          for (const type of ['shield', 'rapid']) {
            const seen = await f.page.evaluate(measureFarPickup, type);
            assert.ok(seen.distance > 40, `the pickup was measured ${seen.distance.toFixed(1)} units away, not at spawn`);
            assert.ok(seen.width >= 12 && seen.height >= 12,
              `a far-off ${type} pickup covers ${seen.width.toFixed(1)}×${seen.height.toFixed(1)} px`);
            const gap = hueGap(hue(seen.rgb), PICKUP_HUE[type]);
            assert.ok(gap <= 30, `a far-off ${type} pickup reads as rgb(${seen.rgb.map(Math.round)}), ${gap.toFixed(0)}° off its colour`);
          }
          assert.deepEqual(f.unexpected(), []);
          await f.page.close();
        });

        await t.test(`${width}×${height}: the power-up label is one height with the shield, the spread shot, or both`, async () => {
          const f = await openFork(browser, site.origin, { width, height });
          await f.start('#start-button');
          await f.quiet();
          const heights = await f.page.evaluate(() => {
            const at = (shield, spread) => {
              setShield(shield); rapidFireLeft = spread ? 5.4 : 0; updatePowerHud();
              return powerHud.getBoundingClientRect().height;
            };
            const out = { shield: at(true, false), spread: at(false, true), both: at(true, true) };
            clearPowerUps();
            return out;
          });
          const all = Object.values(heights);
          assert.ok(all.every(hh => hh > 0), `the label is not showing: ${JSON.stringify(heights)}`);
          assert.ok(Math.max(...all) - Math.min(...all) <= 1, `the label's height changes: ${JSON.stringify(heights)}`);
          assert.deepEqual(f.unexpected(), []);
          await f.page.close();
        });
      }

      await t.test('the pickup box is the pickup itself: a pickup passing just beside the boat is not taken', async () => {
        const f = await openFork(browser, site.origin);
        await f.start('#start-button');
        await f.quiet();
        const box = await f.page.evaluate(() => {
          spawnPowerUp('shield');
          const s = new THREE.Vector3(); powerUp.boundingBox.getSize(s);
          const own = new THREE.Box3().setFromObject(powerUp.mesh).getSize(new THREE.Vector3());
          const wide = new THREE.Box3().setFromObject(boat).getSize(new THREE.Vector3()).x;
          // Beside the boat: clear of its box by 0.3, well inside any glow drawn around the pickup.
          powerUp.mesh.position.set(boat.position.x + wide / 2 + s.x / 2 + 0.3, powerUp.mesh.position.y, boat.position.z + 3);
          return { size: s.toArray(), own: own.toArray() };
        });
        assert.ok(box.size.every(v => v <= 1.1 + 1e-6), `the pickup box grew: ${box.size}`);
        assert.deepEqual(box.size.map(v => v.toFixed(4)), box.own.map(v => v.toFixed(4)), 'the pickup box is not the pickup mesh\'s own');
        await f.page.waitForFunction(() => powerUp === null, { timeout: 15_000, polling: 50 });
        assert.equal(await f.page.evaluate(() => shieldActive), false, 'a pickup that passed beside the boat was taken');
        await f.pickupAhead('shield');
        await f.page.waitForFunction(() => shieldActive, { timeout: 10_000, polling: 50 });
        assert.deepEqual(f.unexpected(), []);
        await f.page.close();
      });
    } finally {
      await browser.close();
      await site.close();
    }
  });
