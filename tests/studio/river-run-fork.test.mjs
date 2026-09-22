// river-run-fork.test.mjs — SHS-056: the studio's copy of River Run.
//
// Two claims, proved separately:
//
//  1. The fork is production's River Run at a named commit plus the closed
//     list of edits in lib/river-run-fork.mjs, and nothing else.
//  2. Played in a real browser — a run to game over, mute, Watch Mode from the
//     start screen and from the drawer, the drawer's own toggle — it leaves every
//     key outside the studio_ namespace exactly as it found it, while the studio
//     keys really are written. The second half matters: a fork that saved
//     nothing at all would pass the first half on its own.

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

// ---- 1. The copy --------------------------------------------------------------

test('the fork is the source at its commit plus the listed edits, byte for byte', () => {
  assert.equal(applyEdits(sourceAtCommit()), fork);
});

test('the fork names its source path and commit in the file itself', () => {
  assert.ok(fork.includes(`fork of ${SOURCE_PATH} at ${SOURCE_COMMIT}`));
});

test('an edit whose text has moved is reported, not half-applied', () => {
  const source = sourceAtCommit();
  const wrongCount = EDITS.map((e, i) => (i === 1 ? { ...e, count: e.count + 1 } : e));
  assert.throws(() => applyEdits(source, wrongCount), /expected 3 occurrence/);
});

test('an unlisted change to the fork breaks the equality', () => {
  // The kind of thing the list exists to catch: one tuning constant, nudged.
  const tampered = fork.replace(/const BOAT_WIDTH = [^;]+;/, 'const BOAT_WIDTH = 99;');
  assert.notEqual(tampered, fork, 'the fixture must actually change the fork');
  assert.notEqual(applyEdits(sourceAtCommit()), tampered);
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
 * a hair below zero (-1e-12) and rejects it. The audio code is byte-identical to
 * production — no edit in lib/river-run-fork.mjs touches it, which the equality
 * test above proves — so this is production's defect travelling with the copy.
 * Matched exactly: negative values only, this message only. Backlog: SHS-056's
 * follow-up row in docs/studio/steering/backlog.md.
 */
const INHERITED_TONE_RANGE = /^uncaught: Uncaught \(in promise\) RangeError: Value must be within \[0, Infinity\], got: -\d(\.\d+)?e-\d+$/;

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
      await page.reload({ waitUntil: 'networkidle2' });
      await settle();

      const dump = () => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])));
      const before = notStudio(await dump());
      assert.deepEqual(before, notStudio(PRODUCTION_SAVES), 'the page changed production keys just by loading');

      // The arcade's light theme reached the fork through body.dark-mode, not a key read.
      assert.equal(await page.evaluate(() => isDarkMode), false);
      // The arcade's invert setting did not leak in.
      assert.equal(await page.evaluate(() => invertControls), false);

      // Play until the river ends the run on its own.
      await page.click('#start-button');
      await page.waitForFunction(() => isGameOver === true && score > 0, { timeout: 60_000, polling: 250 });

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
