// samovar.test.mjs — SHS-068: Samovar, the studio's first original game, its core loop.
//
// What is proved:
//
//  1. The rules, without a browser: a spill scores 0, a cup poured to the
//     wanted ratio and filled into the band scores 3, a short cup loses stars,
//     the tea darkens as the brew ratio rises, the four strengths read as
//     different colours, an evening has ten guests with every cup size and at
//     least four strengths and no two guests asking for the same pour, and an
//     unreadable saved best counts as none.
//  2. In a real browser, by real pointer holds on the pour button:
//     - a full evening of ten cups, each poured to its guest's ratio and filled
//       into the band, scores 3 stars a cup, and the end screen says so;
//     - the best evening is saved under studio_samovar_best, no other key is
//       written, and it is still there after a reload;
//     - holding the brew past the brim spills: the cup scores 0 and says so;
//     - the pour follows real time: a one-second hold pours the same at
//       ~120 and ~30 updates a second;
//     - hiding the page stops a pour where it is and holds the result timer;
//     - at 320×640 and 390×780, with each cup size, the cup, the wanted
//       swatch and the pour button are all on screen, none overlapping, the
//       button at least 44 px tall in the bottom third, nothing scrolls sideways.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromeAvailable, collectErrors, launch, serve, settle } from './lib/browser.mjs';
import { extractStorageKeys, findStorageViolations } from './lib/rules.mjs';
import { CUPS, EVENING_LENGTH, FULL_FROM, POUR_RATE, STRENGTHS } from '../../studio/games/samovar/constants.js';
import { colourAt, judge, pourAmount, ratioOf, verdictLine } from '../../studio/games/samovar/gameplay.js';
import { makeEvening, readBest, rng } from '../../studio/games/samovar/state.js';
import { SHELF } from '../../studio/shelf-data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GAME = 'studio/games/samovar';

// ---- 1. The rules --------------------------------------------------------------

test('a cup poured to the wanted ratio and filled into the band scores 3', () => {
  for (const cup of CUPS) {
    for (const { ratio } of STRENGTHS) {
      const total = cup.volume * 0.95;
      const r = judge({ brew: total * ratio, water: total * (1 - ratio), volume: cup.volume, wanted: ratio });
      assert.equal(r.stars, 3, `${cup.id} at ${ratio}`);
      assert.equal(r.fill, 'full');
    }
  }
});

test('over the brim is a spill and scores 0, however good the strength', () => {
  const r = judge({ brew: 50, water: 71, volume: 120, wanted: 50 / 121 });
  assert.equal(r.spilled, true);
  assert.equal(r.stars, 0);
  assert.match(verdictLine(r), /Spilled/);
  // Exactly at the brim is still in.
  assert.equal(judge({ brew: 48, water: 72, volume: 120, wanted: 0.4 }).stars, 3);
});

test('strength and fill each cost stars', () => {
  const V = 180;
  const full = V * 0.95;
  assert.equal(judge({ brew: full * 0.47, water: full * 0.53, volume: V, wanted: 0.4 }).stars, 2);
  assert.equal(judge({ brew: full * 0.54, water: full * 0.46, volume: V, wanted: 0.4 }).stars, 1);
  assert.equal(judge({ brew: full * 0.7, water: full * 0.3, volume: V, wanted: 0.4 }).stars, 0);
  // Right strength, short of the band: one star off; well short: two.
  assert.equal(judge({ brew: V * 0.8 * 0.4, water: V * 0.8 * 0.6, volume: V, wanted: 0.4 }).stars, 2);
  assert.equal(judge({ brew: V * 0.5 * 0.4, water: V * 0.5 * 0.6, volume: V, wanted: 0.4 }).stars, 1);
  assert.equal(judge({ brew: 0, water: 0, volume: V, wanted: 0.4 }).stars, 0);
});

test('the tea darkens as the brew ratio rises, and the four strengths read apart', () => {
  const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
  let last = Infinity;
  for (let i = 0; i <= 20; i++) {
    const l = lum(colourAt(i / 20));
    assert.ok(l < last, `not darker at ${i / 20}`);
    last = l;
  }
  const swatches = STRENGTHS.map(s => lum(colourAt(s.ratio)));
  for (let i = 1; i < swatches.length; i++) {
    assert.ok(swatches[i - 1] - swatches[i] > 25, `${STRENGTHS[i - 1].id} and ${STRENGTHS[i].id} are too close to tell apart`);
  }
  assert.ok(STRENGTHS.length >= 4 && CUPS.length >= 3);
});

test('pour amounts come from milliseconds, and an empty cup reads as water', () => {
  assert.equal(pourAmount(1000), POUR_RATE);
  assert.equal(pourAmount(-5), 0);
  assert.equal(ratioOf(0, 0), 0);
});

test('an evening is ten guests with every cup, four strengths and no pour asked twice', () => {
  for (let seed = 1; seed <= 300; seed++) {
    const guests = makeEvening(rng(seed));
    assert.equal(guests.length, EVENING_LENGTH);
    assert.equal(new Set(guests.map(g => g.cup.id)).size, CUPS.length, `seed ${seed}: a cup size is missing`);
    assert.ok(new Set(guests.map(g => g.strength.id)).size >= 4, `seed ${seed}: under four strengths`);
    const pairs = new Set(guests.map(g => `${g.cup.id}/${g.strength.id}`));
    assert.equal(pairs.size, guests.length, `seed ${seed}: two guests ask for the same pour`);
  }
});

test('an unreadable saved best counts as none, and a best is capped at a perfect evening', () => {
  assert.equal(readBest(null), 0);
  assert.equal(readBest('banana'), 0);
  assert.equal(readBest('-4'), 0);
  assert.equal(readBest('17'), 17);
  assert.equal(readBest('9999'), EVENING_LENGTH * 3);
});

test('the game writes one key, studio_samovar_best, a literal the storage rule can read', () => {
  const main = readFileSync(path.join(ROOT, GAME, 'main.js'), 'utf8');
  assert.deepEqual(findStorageViolations(main), []);
  assert.deepEqual(extractStorageKeys(main).map(k => k.key), ['studio_samovar_best']);
  const readme = readFileSync(path.join(ROOT, 'studio/README.md'), 'utf8');
  assert.match(readme, /^\| `studio_samovar_best` \|/m);
});

test('the shelf lists Samovar as a prototype that opens the game', () => {
  const entry = SHELF.find(e => e.url === 'games/samovar/');
  assert.ok(entry, 'no shelf entry links to games/samovar/');
  assert.equal(entry.status, 'PROTOTYPE');
  assert.match(entry.blurb, /test/i, 'the blurb should say what it is testing');
});

// ---- 2. In a browser ---------------------------------------------------------

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function openGame(browser, origin, { width = 390, height = 780, rafMs = null } = {}) {
  const page = await browser.newPage();
  const errors = collectErrors(page);
  await page.setRequestInterception(true);
  page.on('request', r => (new URL(r.url()).pathname === '/favicon.ico'
    ? r.respond({ status: 200, contentType: 'image/x-icon', body: '' })
    : r.continue()));
  await page.setViewport({ width, height, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument(ms => {
    window.__writes = [];
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, ...rest) {
      if (this === window.localStorage) window.__writes.push(key);
      return set.call(this, key, ...rest);
    };
    // A display running at a different rate: frames every `ms` instead of the
    // browser's own. The pour must not care.
    if (ms) window.requestAnimationFrame = cb => setTimeout(() => cb(performance.now()), ms);
  }, rafMs);
  await page.goto(`${origin}/${GAME}/`, { waitUntil: 'networkidle2' });
  await settle(400);
  return { page, errors };
}

const data = page => page.evaluate(() => ({ ...document.getElementById('game').dataset }));

/** A real hold on the pour button: pointer down, wait, pointer up. */
async function hold(page, ms) {
  const box = await (await page.$('#pour')).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await wait(ms);
  await page.mouse.up();
}

/** Pour the current guest's cup to their ratio, 95% full. */
async function pourRight(page) {
  const d = await data(page);
  const total = Number(d.volume) * 0.95;
  const wanted = Number(d.wanted);
  await hold(page, total * wanted / POUR_RATE * 1000);
  await wait(60);
  assert.equal((await data(page)).phase, 'water', 'letting go of the brew should move on to the water');
  await hold(page, total * (1 - wanted) / POUR_RATE * 1000);
  await page.waitForFunction(() => document.getElementById('game').dataset.phase === 'result');
  return page.evaluate(() => Number(document.getElementById('result').dataset.stars));
}

async function nextGuestOrEnd(page, guest) {
  await page.waitForFunction(g => {
    const d = document.getElementById('game').dataset;
    return d.phase === 'end' || (d.phase === 'brew' && d.guest === String(g + 1));
  }, { timeout: 5000 }, guest);
}

const skip = chromeAvailable() ? false : 'no Chrome; set CHROME_PATH';

test('in a browser: a full evening poured right scores 3 a cup, and the best survives a reload',
  { skip, timeout: 180_000 },
  async () => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      const { page, errors } = await openGame(browser, site.origin);
      await page.evaluate(() => { localStorage.clear(); localStorage.setItem('mazeWarden_bestWave', '7'); });
      await page.reload({ waitUntil: 'networkidle2' });
      await settle(400);
      assert.equal((await data(page)).best, '0');

      const stars = [];
      for (let guest = 1; guest <= EVENING_LENGTH; guest++) {
        assert.equal((await data(page)).guest, String(guest));
        stars.push(await pourRight(page));
        await nextGuestOrEnd(page, guest);
      }
      assert.deepEqual(stars, Array(EVENING_LENGTH).fill(3));

      const end = await page.evaluate(() => ({
        visible: !document.getElementById('end').hidden,
        total: document.getElementById('end').dataset.total,
        text: document.getElementById('end').innerText,
        again: document.activeElement?.id
      }));
      assert.ok(end.visible, 'no end screen');
      assert.equal(end.total, String(EVENING_LENGTH * 3));
      assert.match(end.text, /30 of 30 stars/);
      assert.match(end.text, /Pour again/);

      const store = await page.evaluate(() => ({ best: localStorage.getItem('studio_samovar_best'), writes: window.__writes, maze: localStorage.getItem('mazeWarden_bestWave') }));
      assert.equal(store.best, '30');
      assert.deepEqual([...new Set(store.writes)], ['studio_samovar_best'], 'the game wrote a key other than its own');
      assert.equal(store.maze, '7');

      await page.reload({ waitUntil: 'networkidle2' });
      await settle(400);
      assert.equal((await data(page)).best, '30', 'the best evening did not survive a reload');

      assert.deepEqual(errors.map(e => e.text), []);
      await page.close();
    } finally {
      await browser.close();
      await site.close();
    }
  });

test('in a browser: Pour again starts a new evening at once, and a spill scores 0',
  { skip, timeout: 120_000 },
  async () => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      const { page, errors } = await openGame(browser, site.origin);
      // Reach the end quickly by serving nine empty cups (two taps each) and one real one.
      for (let guest = 1; guest <= EVENING_LENGTH; guest++) {
        await hold(page, 30);
        await wait(40);
        await hold(page, 30);
        await nextGuestOrEnd(page, guest);
      }
      assert.equal((await data(page)).phase, 'end');
      const again = await (await page.$('#again')).boundingBox();
      assert.ok(again.height >= 44);
      await page.mouse.click(again.x + again.width / 2, again.y + again.height / 2);
      await wait(60);
      const fresh = await data(page);
      assert.equal(fresh.phase, 'brew');
      assert.equal(fresh.guest, '1');

      // Hold the brew well past the brim: it spills mid-hold.
      const volume = Number(fresh.volume);
      await hold(page, volume / POUR_RATE * 1000 + 400);
      await page.waitForFunction(() => document.getElementById('game').dataset.phase === 'result');
      const result = await page.evaluate(() => ({
        stars: document.getElementById('result').dataset.stars,
        line: document.getElementById('result-line').textContent,
        spilled: document.getElementById('cup').classList.contains('spilled')
      }));
      assert.equal(result.stars, '0');
      assert.match(result.line, /Spilled/);
      assert.ok(result.spilled);
      assert.deepEqual(errors.map(e => e.text), []);
      await page.close();
    } finally {
      await browser.close();
      await site.close();
    }
  });

test('in a browser: the pour follows real time, not the frame rate',
  { skip, timeout: 60_000 },
  async () => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      for (const rafMs of [8, 33]) {
        const { page } = await openGame(browser, site.origin, { rafMs });
        await hold(page, 1000);
        await wait(60);
        const brew = Number((await data(page)).brew);
        assert.ok(Math.abs(brew - POUR_RATE) < POUR_RATE * 0.08,
          `a one-second hold at a frame every ${rafMs} ms poured ${brew}, not ~${POUR_RATE}`);
        await page.close();
      }
    } finally {
      await browser.close();
      await site.close();
    }
  });

test('in a browser: hiding the page stops a pour where it is and holds the result',
  { skip, timeout: 60_000 },
  async () => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      const { page } = await openGame(browser, site.origin);
      const setHidden = hidden => page.evaluate(h => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);

      const box = await (await page.$('#pour')).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await wait(300);
      await setHidden(true);
      const stopped = await data(page);
      assert.equal(stopped.pouring, '', 'the pour kept running while hidden');
      assert.equal(stopped.phase, 'brew', 'a hidden page should not move the cup on');
      await wait(500);
      assert.equal((await data(page)).brew, stopped.brew, 'tea poured while the page was hidden');
      await page.mouse.up();
      await setHidden(false);

      // The next hold carries on with the brew, then the water serves.
      await hold(page, 200);
      await wait(40);
      assert.ok(Number((await data(page)).brew) > Number(stopped.brew));
      await hold(page, 200);
      await page.waitForFunction(() => document.getElementById('game').dataset.phase === 'result');
      await setHidden(true);
      await wait(2600);
      assert.equal((await data(page)).phase, 'result', 'the result timer ran while the page was hidden');
      await setHidden(false);
      await page.waitForFunction(() => document.getElementById('game').dataset.guest === '2', { timeout: 4000 });
      await page.close();
    } finally {
      await browser.close();
      await site.close();
    }
  });

test('in a browser: at 320 and 390 wide every cup, the swatch and the button fit without overlapping',
  { skip, timeout: 60_000 },
  async () => {
    const site = await serve(ROOT);
    const browser = await launch();
    try {
      for (const [width, height] of [[320, 640], [390, 780]]) {
        for (const theme of ['dark', 'light']) {
          const { page } = await openGame(browser, site.origin, { width, height });
          await page.evaluate(t => document.body.classList.toggle('dark-mode', t === 'dark'), theme);
          for (let c = 0; c < CUPS.length; c++) {
            const boxes = await page.evaluate(async index => {
              const m = await import('/studio/games/samovar/main.js');
              m.session.guests[m.session.index].cup = m.CUPS[index];
              m.showGuest();
              const box = id => {
                const r = document.getElementById(id).getBoundingClientRect();
                return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
              };
              return {
                cup: box('cup'), swatch: box('swatch'), pour: box('pour'), guest: box('guest'),
                scrollWidth: document.documentElement.scrollWidth,
                clientWidth: document.documentElement.clientWidth,
                pourBg: getComputedStyle(document.getElementById('pour')).backgroundColor,
                pourInk: getComputedStyle(document.getElementById('pour')).color
              };
            }, c);
            const where = `${CUPS[c].id} at ${width}×${height} (${theme})`;
            for (const name of ['cup', 'swatch', 'pour', 'guest']) {
              const b = boxes[name];
              assert.ok(b.width > 0 && b.height > 0, `${name} has no size, ${where}`);
              assert.ok(b.left >= 0 && b.top >= 0 && b.right <= width + 0.5 && b.bottom <= height + 0.5,
                `${name} is off screen, ${where}: ${JSON.stringify(b)}`);
            }
            const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
            assert.ok(!overlap(boxes.cup, boxes.swatch), `the cup covers the swatch, ${where}`);
            assert.ok(!overlap(boxes.cup, boxes.pour), `the cup runs into the button, ${where}`);
            assert.ok(!overlap(boxes.cup, boxes.guest), `the cup runs into the guest line, ${where}`);
            assert.ok(boxes.pour.height >= 44 && boxes.pour.width >= 44, `the button is under 44 px, ${where}`);
            assert.ok(boxes.pour.top >= height * 2 / 3, `the button is above the bottom third, ${where}`);
            assert.ok(boxes.scrollWidth <= boxes.clientWidth, `the page scrolls sideways, ${where}`);
            assert.notEqual(boxes.pourBg, boxes.pourInk, `the button's label is invisible, ${where}`);
          }
          await page.close();
        }
      }
    } finally {
      await browser.close();
      await site.close();
    }
  });
