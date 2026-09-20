// boot.mjs — the studio's pages, opened in a real browser and held to a contract.
//
// `scripts/smoke.mjs` discovers pages under games/ and drafts/ only, so studio/
// was in no boot suite at all: an independent QA pass named eight mutations the
// whole repository suite survived (TD-004). `scripts/` is outside the path
// guard, so the studio grows its own check rather than widening production's.
//
// What this proves, and what it does not: it proves each page boots without
// errors and holds the contract in lib/boot-contract.mjs, in three
// configurations — ordinary, scripting disabled, and site data blocked. It does
// not prove the page looks right. There are no screenshots and no visual
// regression here.
//
// Discovery is by walking studio/** for index.html, so a page added later is
// covered without this file being edited. That is the property that makes the
// debt closed rather than paused.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { chromeAvailable, chromePath, collectErrors, launch, serve, settle } from '../lib/browser.mjs';
import {
  MIN_TARGET, NARROW_WIDTH, NOT_OURS, SHELF_BREAKPOINTS,
  isInheritedSettingsThrow, judgePage, pageErrors
} from '../lib/boot-contract.mjs';

/** How long a hold has to run before a frozen gauge and a live one look different. */
const HOLD_MS = 500;

/** Every index.html under studio/, as repo-relative paths, in a stable order. */
async function discoverPages(root) {
  const pages = [];
  async function walk(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(abs);
      else if (entry.name === 'index.html') pages.push(path.relative(root, abs));
    }
  }
  await walk(path.join(root, 'studio'));
  return pages.sort();
}

/** `studio/games/overtighten/index.html` → `/studio/games/overtighten/`. */
function urlFor(origin, pagePath) {
  return `${origin}/${pagePath.replace(/index\.html$/, '')}`;
}

/**
 * The ordinary load: the page as a reader gets it, at the narrowest width worth
 * supporting. Targets and sideways scroll are judged here because both are
 * properties of a narrow viewport and neither can fail on a wide one.
 */
async function observeNormal(browser, url) {
  const page = await browser.newPage();
  const errors = collectErrors(page);
  await page.setViewport({ width: NARROW_WIDTH, height: 720 });
  await page.goto(url, { waitUntil: 'networkidle2' });
  await settle();

  const measured = await page.evaluate((notOurs, floor) => {
    const excluded = new Set();
    for (const selector of notOurs) {
      for (const el of document.querySelectorAll(selector)) {
        excluded.add(el);
        for (const child of el.querySelectorAll('*')) excluded.add(child);
      }
    }
    // Three different states, kept apart rather than collapsed into "visible":
    // absent from the layout (legitimate — the page is not offering it), laid
    // out and seen, and laid out but invisible. Only the contract decides which
    // of those is a failure. `checkVisibility` is asked about opacity and
    // visibility because both inherit: the previous version read the element's
    // own computed style, so a control inside an `opacity: 0` ancestor measured
    // as perfectly visible.
    const describe = el => {
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const laidOut = box.width > 0 && box.height > 0 && style.display !== 'none' && !el.closest('[hidden]');
      const seen = typeof el.checkVisibility === 'function'
        ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })
        : style.visibility !== 'hidden' && Number(style.opacity) !== 0;
      let reason = '';
      if (laidOut && !seen) {
        const faded = el.closest('*');
        reason = style.visibility === 'hidden' ? 'visibility: hidden'
          : Number(style.opacity) === 0 ? 'opacity: 0'
          : 'hidden by an ancestor (opacity or visibility)';
        void faded;
      }
      return { laidOut, seen, reason };
    };
    const label = el => {
      const text = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ');
      return `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''} "${text.slice(0, 40)}"`;
    };

    const targets = [];
    for (const el of document.querySelectorAll('a[href], button, [role="button"], input, select, summary')) {
      if (excluded.has(el)) continue;
      const { laidOut, seen, reason } = describe(el);
      if (!laidOut) continue;
      const box = el.getBoundingClientRect();
      targets.push({ label: label(el), width: box.width, height: box.height, laidOut, visible: seen, reason });
    }

    const back = document.querySelector('[data-back], a.back');
    const backBox = back ? back.getBoundingClientRect() : null;
    void describe;

    return {
      targets,
      backLink: back
        ? { present: true, href: back.getAttribute('href') || '', width: backBox.width, height: backBox.height }
        : { present: false },
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      mainText: (document.querySelector('main') || document.body).innerText || '',
      floor
    };
  }, NOT_OURS, MIN_TARGET);

  await page.close();
  return { ...measured, errors: pageErrors(errors) };
}

/**
 * The same page with scripting off. A page that builds its content in the
 * browser owes the reader an explanation when it cannot, and the only way to
 * know the explanation is really there is to load the page without scripts.
 */
async function observeWithoutScript(browser, url) {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(false);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const text = await page.evaluate(() => {
    const el = document.querySelector('noscript');
    // With scripting disabled the browser parses noscript content into the
    // document, so its rendered text is what a reader would actually see.
    return el ? (el.innerText || el.textContent || '') : null;
  });
  await page.close();
  return { present: text !== null, text: text ?? '' };
}

/**
 * The same page with every localStorage accessor throwing, which is what a
 * browser with site data blocked does. studio/ shares an origin with production
 * and keeps a visit log, so every call site here is a place the page can die.
 */
async function observeWithoutStorage(browser, url, origin) {
  const page = await browser.newPage();
  const errors = collectErrors(page);
  await page.evaluateOnNewDocument(() => {
    const blocked = () => { throw new DOMException('denied', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { return { getItem: blocked, setItem: blocked, removeItem: blocked, clear: blocked, key: blocked, get length() { return blocked(); } }; }
    });
  });
  await page.goto(url, { waitUntil: 'networkidle2' });
  await settle();
  const mainText = await page.evaluate(() => (document.querySelector('main') || document.body).innerText || '');
  await page.close();
  // shared/settings.js throws an uncaught SecurityError in exactly this
  // configuration, and it is production code outside the path guard (TD-005).
  // The studio records that in the debt register; it does not fail its own
  // pages for it. The exemption is by throwing file, not by message — the
  // message is "SecurityError: denied" and names nobody — so a studio file that
  // starts throwing here is still caught.
  // The exemption is anchored to this page's own origin, so a studio-owned file
  // that merely ends in `shared/settings.js` cannot claim it.
  return { mainText, errors: pageErrors(errors, e => isInheritedSettingsThrow(e, origin)) };
}

/**
 * The realm home's own measurements. Everything responsive is read off a
 * fixture built with the page's real shelf component rather than off whatever
 * is on the shelf today: iteration 01 verified three criteria against an empty
 * shelf, the one configuration in which they cannot fail.
 */
async function observeHome(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  await settle();

  const live = await page.evaluate(() => {
    const section = document.getElementById('shelf-section');
    const region = document.getElementById('shelf-region');
    return {
      pulseText: (document.getElementById('pulse') || {}).innerText || '',
      learnedText: (document.getElementById('learned') || {}).innerText || '',
      shelfSectionHidden: section ? section.hidden : true,
      shelfRegion: region ? { present: true, text: region.innerText || '' } : { present: false }
    };
  });

  // The fixture: three cards, one of them killed, rendered by shelf.js itself.
  await page.evaluate(async () => {
    const { shelfMarkup } = await import('./shelf.js');
    const host = document.createElement('div');
    host.id = 'boot-fixture';
    host.innerHTML = shelfMarkup([
      { title: 'Fixture A', status: 'PROTOTYPE', blurb: 'live', iteration: '02', changed: '2026-09-20', url: 'games/x/' },
      { title: 'Fixture B', status: 'ITERATING', blurb: 'live', iteration: '02', changed: '2026-09-20' },
      { title: 'Fixture C', status: 'KILLED', blurb: 'killed', iteration: '02', changed: '2026-09-20', url: 'games/x/' }
    ]);
    document.querySelector('main').appendChild(host);
  });

  const shelfTracks = {};
  for (const { width } of SHELF_BREAKPOINTS) {
    await page.setViewport({ width, height: 900 });
    shelfTracks[width] = await page.evaluate(() => {
      const shelf = document.querySelector('#boot-fixture .shelf');
      if (!shelf) return -1;
      return getComputedStyle(shelf).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
    });
  }

  const cards = await page.evaluate(() => {
    const read = el => el && {
      background: getComputedStyle(el).backgroundColor,
      boxShadow: getComputedStyle(el).boxShadow,
      borderStyle: getComputedStyle(el).borderTopStyle,
      isLink: Boolean(el.querySelector('h3 a'))
    };
    const items = [...document.querySelectorAll('#boot-fixture .item')];
    return {
      liveCard: read(items.find(el => !el.classList.contains('is-killed'))),
      killedCard: read(items.find(el => el.classList.contains('is-killed')))
    };
  });

  await page.close();
  return { ...live, shelfTracks, ...cards };
}

/**
 * Overtighten, driven.
 *
 * Holding is the whole interface, so it is held — with a key, with the pointer,
 * and for long enough to strip a thread. Three things here exist because the
 * first version of this function missed them and both reviews found the gap:
 *
 *  - errors are collected. The first version drove focus, keys, pointer capture
 *    and stripping with nothing listening, so "no console errors" was true of
 *    the page load and of nothing else.
 *  - the **pointer** release is asserted, by reading the readouts again after a
 *    settle. The first version sampled immediately after `mouse.up`, which is
 *    indistinguishable from a bolt that never stops. Deleting the pointer
 *    release listeners — which makes every tap run the bolt to its strip point
 *    and destroy the plate — passed every check.
 *  - progress is proved to survive a **reload**, not merely to be written.
 *    Stubbing the storage wrapper to a no-op passed everything.
 */
async function observeOvertighten(browser, url) {
  const page = await browser.newPage();
  const errors = collectErrors(page);
  await page.setViewport({ width: 420, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2' });
  await settle();

  const readouts = () => page.evaluate(() =>
    Object.fromEntries([...document.querySelectorAll('[data-readout]')]
      .map(el => [el.dataset.readout, Number.parseFloat(el.textContent) || 0])));
  const dashOf = id => page.evaluate(boltId =>
    document.querySelector(`[data-bolt="${boltId}"] .fill`)?.getAttribute('stroke-dasharray') ?? '', id);
  const centreOf = id => page.$eval(`[data-bolt="${id}"]`, el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });

  const boltIds = await page.evaluate(() =>
    [...document.querySelectorAll('[data-bolt]')].map(el => el.dataset.bolt));
  const lockedPicks = await page.evaluate(() =>
    document.querySelectorAll('#picker [data-plate][disabled]').length);
  const plateVisible = await page.evaluate(() => {
    const plate = document.getElementById('plate');
    if (!plate) return false;
    const box = plate.getBoundingClientRect();
    if (!(box.width > 0 && box.height > 0)) return false;
    return typeof plate.checkVisibility === 'function'
      ? plate.checkVisibility({ opacityProperty: true, visibilityProperty: true })
      : true;
  });

  // Keyboard: focus the first bolt and hold space. A held key repeats rather
  // than staying down, which is why the game cannot rely on click alone.
  const dashBefore = await dashOf(boltIds[0]);
  await page.focus(`[data-bolt="${boltIds[0]}"]`);
  await page.keyboard.down(' ');
  await settle(HOLD_MS);
  const dashDuring = await dashOf(boltIds[0]);
  await page.keyboard.up(' ');
  const afterKey = await readouts();
  await settle(300);
  const afterKeySettled = await readouts();

  // Pointer on the second bolt, which the first is coupled to on every shipped
  // plate: the first must lose torque while the second gains it. Then read
  // again after a settle, which is the assertion that the pointer release works.
  const box = await centreOf(boltIds[1]);
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await settle(HOLD_MS);
  await page.mouse.up();
  const afterPointer = await readouts();
  await settle(400);
  const afterPointerSettled = await readouts();

  // Past the strip point: the bands top out at 92 and the rate is 42/s, so
  // three more seconds of holding is unambiguous.
  await page.mouse.down();
  await settle(3000);
  await page.mouse.up();
  const ended = await page.evaluate(() => {
    const panel = document.getElementById('outcome');
    return Boolean(panel && !panel.hidden && /strip/i.test(panel.innerText));
  });

  // Persistence, end to end: clear a plate, reload, and see it stay cleared.
  // Written as "one fewer plate is locked" rather than as a storage read, so it
  // is a claim about what the player gets back.
  const progressPersisted = await provePersistence(page, url, lockedPicks);

  await page.close();
  return {
    game: {
      errors: pageErrors(errors),
      bolts: boltIds.length,
      lockedPicks,
      plateVisible,
      gaugeMoved: dashDuring !== dashBefore,
      keyboardTurned: afterKey[boltIds[0]] > 0,
      released: afterKeySettled[boltIds[0]] === afterKey[boltIds[0]],
      pointerTurned: afterPointer[boltIds[1]] > 0,
      releasedPointer: afterPointerSettled[boltIds[1]] === afterPointer[boltIds[1]],
      couplingObserved: afterPointer[boltIds[0]] < afterKey[boltIds[0]],
      strippedEndsPlate: ended,
      progressPersisted
    }
  };
}

/**
 * Win the first plate through the page's own input, reload, and report whether
 * the win survived. Stated as "one fewer plate is locked" rather than as a
 * storage read, because that is what the player gets back — stubbing the
 * storage wrapper to a no-op passed every check before this existed.
 *
 * The strategy is the closed loop a person uses: look at the readouts, hold the
 * bolt furthest below the middle of its band for about as long as it needs,
 * look again. It is deliberately not a computed solution applied blind.
 */
async function provePersistence(page, url, lockedBefore) {
  await page.goto(url, { waitUntil: 'networkidle2' });
  await settle(400);

  const bolts = await page.evaluate(async () => {
    const { PLATES } = await import('./constants.js');
    return PLATES[0].bolts.map(b => ({ id: b.id, mid: (b.lo + b.hi) / 2 }));
  });
  const readouts = () => page.evaluate(() =>
    Object.fromEntries([...document.querySelectorAll('[data-readout]')]
      .map(el => [el.dataset.readout, Number.parseFloat(el.textContent) || 0])));
  const solvedNow = () => page.evaluate(() => {
    const panel = document.getElementById('outcome');
    return Boolean(panel && !panel.hidden && /seated/i.test(panel.innerText));
  });

  for (let step = 0; step < 30; step++) {
    if (await solvedNow()) break;
    const values = await readouts();
    const worst = bolts
      .map(b => ({ b, deficit: b.mid - (values[b.id] ?? 0) }))
      .filter(x => x.deficit > 0.5)
      .sort((x, y) => y.deficit - x.deficit)[0];
    if (!worst) break;
    const point = await page.$eval(`[data-bolt="${worst.b.id}"]`, el => {
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await settle(Math.max(40, Math.round((worst.deficit / 42) * 1000)));
    await page.mouse.up();
    await settle(70);
  }

  if (!(await solvedNow())) return false;

  await page.reload({ waitUntil: 'networkidle2' });
  await settle(400);
  const lockedAfter = await page.evaluate(() =>
    document.querySelectorAll('#picker [data-plate][disabled]').length);
  return lockedAfter < lockedBefore;
}

async function run(ctx) {
  if (ctx.offline) {
    return { status: 'skip', detail: 'needs a browser; --offline was passed' };
  }
  if (!chromeAvailable()) {
    return { status: 'skip', detail: `no Chrome at ${chromePath()}; set CHROME_PATH` };
  }

  const pages = await discoverPages(ctx.root);
  if (!pages.length) return { status: 'fail', detail: 'no index.html found under studio/' };

  const site = await serve(ctx.root);
  let browser;
  const results = [];
  try {
    browser = await launch();
    for (const pagePath of pages) {
      const url = urlFor(site.origin, pagePath);
      const obs = {
        ...(await observeNormal(browser, url)),
        withoutScript: await observeWithoutScript(browser, url),
        withoutStorage: await observeWithoutStorage(browser, url, site.origin)
      };
      if (pagePath === 'studio/index.html') Object.assign(obs, await observeHome(browser, url));
      if (pagePath === 'studio/games/overtighten/index.html') {
        Object.assign(obs, await observeOvertighten(browser, url));
      }
      results.push(judgePage(pagePath, obs));
    }
  } finally {
    if (browser) await browser.close();
    await site.close();
  }

  const broken = results.filter(r => r.failures.length);
  if (broken.length) {
    return {
      status: 'fail',
      detail: broken.map(r => `${r.page}\n${r.failures.map(f => '    ' + f).join('\n')}`).join('\n')
    };
  }
  const generic = results.filter(r => r.contract === 'generic only').map(r => r.page);
  const detail = `${results.length} page(s) booted and held their contract`
    + (generic.length ? `; generic contract only: ${generic.join(', ')}` : '');
  return { status: 'pass', detail };
}

export const studioBoot = {
  id: 'studio-boot',
  stages: ['ticket', 'gate'],
  description: 'Every page under studio/ boots in a real browser and holds its contract',
  run
};
