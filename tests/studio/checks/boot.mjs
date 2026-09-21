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
  INHERITED_SETTINGS, MIN_TARGET, NARROW_WIDTH, NOT_OURS, SHELF_BREAKPOINTS,
  judgePage, pageErrors
} from '../lib/boot-contract.mjs';

/**
 * A phone, as Chrome understands one.
 *
 * `setViewport({ width: 320 })` on its own is a narrow *desktop* window, and
 * desktop Chrome ignores `<meta name="viewport">` entirely — so every mobile
 * assertion this check makes was being measured in the one configuration where
 * the viewport meta cannot matter. Deleting that tag from both pages, which
 * renders the whole realm zoomed out at ~980px on a real phone, passed
 * everything. `isMobile` is what makes the meta tag load-bearing.
 */
const PHONE = { width: NARROW_WIDTH, height: 640, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

/** The one path a browser requests unasked, and the only one the driver answers for it. */
const FAVICON = '/favicon.ico';

/** How long a hold has to run before a frozen gauge and a live one look different. */
const HOLD_MS = 500;

/**
 * Open a page with the two things the driver controls rather than judges.
 *
 * **The favicon is served**, not filtered. Chrome asks every origin for
 * `/favicon.ico` on its own and the repository ships none, so every page
 * answers 404 — production's included — and that 404 arrives as both a failed
 * response and a console error. The first answer was a filter keyed on the
 * error's source, and a source is a string the page chooses: a studio file
 * throwing `//# sourceURL=<origin>/favicon.ico` had its error dropped in every
 * pass. Answering the browser's request removes the 404, and with it the need
 * to recognise anything. There is no error filter left in this check.
 *
 * `stubInherited` additionally replaces production's settings drawer, for the
 * blocked-storage pass. Same principle: change what happens, do not excuse it.
 */
async function openPage(browser, { stubInherited = false } = {}) {
  const page = await browser.newPage();
  const errors = collectErrors(page);
  const stubbed = { favicon: 0, inherited: 0 };
  await page.setRequestInterception(true);
  page.on('request', request => {
    let pathname;
    try { pathname = new URL(request.url()).pathname; } catch { pathname = ''; }
    // Exactly the one path the browser asks for on its own, not anything ending
    // in that name: a suffix match answered `studio/whatever/favicon.ico` with a
    // 200 as well, so a studio page could hide a real 404 behind the name. The
    // fourth instance of the same mistake, in the code written to end it.
    if (pathname === FAVICON) {
      stubbed.favicon += 1;
      return request.respond({ status: 200, contentType: 'image/x-icon', body: '' });
    }
    if (stubInherited && pathname === INHERITED_SETTINGS) {
      stubbed.inherited += 1;
      return request.respond({
        status: 200, contentType: 'text/javascript',
        body: '/* replaced for the blocked-storage pass */'
      });
    }
    return request.continue();
  });
  return { page, errors, stubbed };
}

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
  const { page, errors } = await openPage(browser);
  await page.setViewport(PHONE);
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
        reason = style.visibility === 'hidden' ? 'visibility: hidden'
          : Number(style.opacity) === 0 ? 'opacity: 0'
          : 'hidden by an ancestor (opacity or visibility)';
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

    return {
      deviceWidth: floor.deviceWidth,
      targets,
      backLink: back
        ? { present: true, href: back.getAttribute('href') || '', width: backBox.width, height: backBox.height }
        : { present: false },
      // Three separate numbers, because under mobile emulation two of them move
      // together and one does not.
      //
      // `innerWidth` is the *layout* viewport, and Chrome grows it to fit
      // overflowing content — so `scrollWidth > innerWidth` became unreachable
      // the moment this check started emulating a phone, and the sideways-scroll
      // rule it fed was proved by nothing. `clientWidth` is what the content is
      // actually laid out against, and `deviceWidth` is the screen the page was
      // given, which never moves.
      documentWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      viewportWidth: window.innerWidth,
      layoutWidth: window.innerWidth,
      // Whether the page asks for the device's width at all. Read rather than
      // inferred, so "no meta tag" and "content too wide" are told apart
      // instead of both being reported as the first one.
      viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? null,
      mainText: (document.querySelector('main') || document.body).innerText || ''
    };
  }, NOT_OURS, { deviceWidth: PHONE.width });

  await page.close();
  return { ...measured, errors: pageErrors(errors) };
}

/**
 * The same page with scripting off. A page that builds its content in the
 * browser owes the reader an explanation when it cannot, and the only way to
 * know the explanation is really there is to load the page without scripts.
 */
async function observeWithoutScript(browser, url) {
  const { page } = await openPage(browser);
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
async function observeWithoutStorage(browser, url) {
  const { page, errors, stubbed } = await openPage(browser, { stubInherited: true });

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

  // Prove the configuration actually happened. Without this the pass would
  // silently become a second ordinary load if `evaluateOnNewDocument` or the
  // interception ever stopped applying — and report a pass either way. It is
  // the iteration's own rule turned on itself: verify in the configuration
  // where it can fail, and first check you are in it.
  const storageBlocked = await page.evaluate(() => {
    try { localStorage.getItem('studio_probe'); return false; } catch { return true; }
  });
  const referencesInherited = await page.evaluate(
    path => [...document.scripts].some(s => s.src && new URL(s.src).pathname === path), INHERITED_SETTINGS);

  await page.close();
  return {
    mainText,
    errors: pageErrors(errors),
    storageBlocked,
    inheritedStubbed: !referencesInherited || stubbed.inherited > 0
  };
}

/**
 * The realm home's own measurements. Everything responsive is read off a
 * fixture built with the page's real shelf component rather than off whatever
 * is on the shelf today: iteration 01 verified three criteria against an empty
 * shelf, the one configuration in which they cannot fail.
 */
async function observeHome(browser, url) {
  const { page } = await openPage(browser);
  await page.goto(url, { waitUntil: 'networkidle2' });
  await settle();

  const live = await page.evaluate(() => {
    const section = document.getElementById('shelf-section');
    const region = document.getElementById('shelf-region');
    return {
      pulseText: (document.getElementById('pulse') || {}).innerText || '',
      learnedText: (document.getElementById('learned') || {}).innerText || '',
      shelfSectionHidden: section ? section.hidden : true,
      shelfRegion: region ? { present: true, text: region.innerText || '' } : { present: false },
      // The realm's own shelf, before any fixture touches the page: what it
      // actually offers, and whether each offer goes anywhere.
      shelfCards: [...document.querySelectorAll('#shelf-region .item')].map(item => ({
        title: (item.querySelector('h3')?.textContent || '').trim(),
        killed: item.classList.contains('is-killed'),
        href: item.querySelector('h3 a')?.href || ''
      }))
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
  const { page, errors } = await openPage(browser);
  // A phone, not a desktop: 'the plate is on screen' is only a real assertion
  // on a viewport where it can fail.
  await page.setViewport({ width: 390, height: 720 });
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
  const labels = await page.evaluate(() => ({
    'plate name': document.getElementById('plate-name')?.textContent ?? '',
    'plate hint': document.getElementById('plate-hint')?.textContent ?? '',
    'status line': document.getElementById('status')?.textContent ?? ''
  }));
  // The gauge's own ink. A bolt that repaints is not the same as a bolt whose
  // gauge is drawn: the turning highlight repaints even when every stroke on
  // the arc is transparent.
  const gaugeInk = await page.evaluate(() => {
    const bolt = document.querySelector('[data-bolt]');
    if (!bolt) return null;
    const stroke = el => (el ? { colour: getComputedStyle(el).stroke, width: getComputedStyle(el).strokeWidth } : {});
    const head = bolt.querySelector('.head');
    const line = document.querySelector('.links line');
    const readout = document.querySelector('[data-readout]');
    return {
      track: stroke(bolt.querySelector('.track')),
      band: stroke(bolt.querySelector('.band')),
      fill: stroke(bolt.querySelector('.fill')),
      'coupling line': stroke(line),
      'head edge': head ? { colour: getComputedStyle(head).borderTopColor } : {},
      'torque readout': readout ? { colour: getComputedStyle(readout).color } : {}
    };
  });

  // What each of the four states is drawn as. Read from a copy of a real bolt
  // with each class applied in turn, because a live plate starts with every
  // bolt loose — so three of the four treatments were never observed at all,
  // and deleting all of them passed. Same shape as the shelf's killed-card
  // fixture, and judged the same way: each state must differ from the others.
  const stateInk = await page.evaluate(() => {
    const bolt = document.querySelector('[data-bolt]');
    if (!bolt) return null;
    const host = document.createElement('div');
    host.className = 'plate';
    host.style.cssText = 'position:absolute;left:-9999px;top:0;width:300px;height:300px';
    const copy = bolt.cloneNode(true);
    host.appendChild(copy);
    document.body.appendChild(host);
    const read = state => {
      copy.className = `bolt is-${state}`;
      const fill = copy.querySelector('.fill');
      const head = copy.querySelector('.head');
      return {
        fill: fill ? getComputedStyle(fill).stroke : '',
        head: head ? getComputedStyle(head).borderTopColor : '',
        shape: head ? getComputedStyle(head).clipPath : ''
      };
    };
    const out = Object.fromEntries(['loose', 'seated', 'over', 'stripped'].map(s => [s, read(s)]));
    host.remove();
    return out;
  });

  // The picker's locked treatment, read the same way and for the same reason:
  // `lockedPicks` counts the disabled attribute, never what it looks like, so a
  // locked plate could be made visually identical to an open one.
  const pickInk = await page.evaluate(() => {
    const open = document.querySelector('#picker [data-plate]:not([disabled])');
    const locked = document.querySelector('#picker [data-plate][disabled]');
    const read = el => (el ? {
      background: getComputedStyle(el).backgroundColor,
      borderStyle: getComputedStyle(el).borderTopStyle,
      colour: getComputedStyle(el).color
    } : null);
    return { open: read(open), locked: read(locked) };
  });
  // The focus ring on the only control in the game. Deleting it leaves a
  // keyboard player with no idea which bolt they are about to turn, and every
  // other focus assertion here still passes because the driver knows where
  // focus is without being able to see it.
  // Reached with Tab, not with `.focus()`. `:focus-visible` is a pseudo-*class*,
  // so it cannot be read with a pseudo-element argument, and Chrome does not
  // match it for programmatic focus on a button — the ring only exists for the
  // player this rule is about.
  await page.evaluate(() => document.querySelector('.back')?.focus());
  await page.keyboard.press('Tab');
  await settle(150);
  const focusRing = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || !(el instanceof HTMLElement) || el.dataset.bolt === undefined) return null;
    const style = getComputedStyle(el);
    return {
      style: style.outlineStyle,
      width: style.outlineWidth,
      colour: style.outlineColor,
      visible: el.matches(':focus-visible')
    };
  });
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
  // A picture of the plate, not a reading of its attributes. Stroking the
  // gauge, the band and the head in `transparent` leaves every attribute moving
  // and the plate blank; an invisible band has already shipped here once.
  // Focus first, then take the baseline. Taking it before focusing put the
  // focus ring in the "during" frame, so a bolt with nothing drawn on it still
  // changed pixels — the difference was the outline, not the gauge.
  await page.focus(`[data-bolt="${boltIds[0]}"]`);
  await settle(120);
  const pixelsBefore = await page.screenshot({ clip: await boltBox(page, boltIds[0]) });
  await page.keyboard.down(' ');
  await settle(HOLD_MS);
  const dashDuring = await dashOf(boltIds[0]);
  const pixelsDuring = await page.screenshot({ clip: await boltBox(page, boltIds[0]) });
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

  // The keyboard *after* the pointer. Done in this order on purpose: focusing a
  // bolt from the driver and then using the pointer is the one sequence in
  // which a missing `focus()` in the pointer handler cannot be noticed.
  const keyboardAfterPointer = await proveKeyboardAfterPointer(page, boltIds[0]);

  // Losing focus must stop the turn, or a hold started with the keyboard cannot
  // be stopped at all.
  const releasedOnFocusLoss = await proveFocusLossReleases(page, boltIds[0]);

  // A bolt must change state class as it crosses into its band.
  const stateClassesTrack = await proveStateClasses(page, boltIds[0]);

  // Two behaviours SS-025 fixed in the game and nothing ever checked: a turn
  // must survive one of two inputs letting go, and the status line must not
  // rewrite itself on every frame. Both were counted as covered when they were
  // only ever reproduced by hand.
  const survivesSecondRelease = await proveSecondReleaseKeepsTurning(page, boltIds[0]);
  const statusChurn = await measureStatusChurn(page, boltIds[0]);

  // Where focus lands after a plate is loaded. `showBench` scrolls *and*
  // focuses, and only the scroll half was asserted — so dropping `focus: true`
  // from all three call sites, which leaves a keyboard player on a hidden button
  // or on the document body, passed everything.
  const focusAfterLoad = await proveFocusAfterLoad(page);

  // The controls that exist on a fresh profile, pressed. The two that need a
  // cleared plate — "Next plate" and the picker's positive case — are pressed
  // in provePersistence, where one exists.
  const controls = await exerciseControls(page);

  // Persistence, end to end: clear a plate, reload, and see it stay cleared.
  // Written as "one fewer plate is locked" rather than as a storage read, so it
  // is a claim about what the player gets back.
  const persistence = await provePersistence(page, url, lockedPicks);

  // Last, because it seeds progress so every plate can be opened.
  const couplingPerPlate = await proveCouplingPerPlate(page, url);

  await page.close();
  return {
    game: {
      errors: pageErrors(errors),
      bolts: boltIds.length,
      lockedPicks,
      plateVisible,
      gaugeMoved: dashDuring !== dashBefore,
      boltRepainted: !Buffer.from(pixelsBefore).equals(Buffer.from(pixelsDuring)),
      gaugeInk,
      labels,
      controls: {
        ...controls,
        'Next plate': persistence.advanced,
        'plate picker': persistence.picked
      },
      benchOnScreenAfterPick: persistence.boltsOnScreen,
      focusAfterLoad: focusAfterLoad && persistence.focusedAfterPick,
      pickerRefreshedOnClear: persistence.pickerRefreshed,
      outcomeExplained: persistence.outcomeExplained,
      advanceLabelled: persistence.advanceLabelled,
      couplingPerPlate,
      keyboardTurned: afterKey[boltIds[0]] > 0,
      released: afterKeySettled[boltIds[0]] === afterKey[boltIds[0]],
      pointerTurned: afterPointer[boltIds[1]] > 0,
      releasedPointer: afterPointerSettled[boltIds[1]] === afterPointer[boltIds[1]],
      couplingObserved: afterPointer[boltIds[0]] < afterKey[boltIds[0]],
      survivesSecondRelease,
      statusChurn,
      keyboardAfterPointer,
      releasedOnFocusLoss,
      stateClassesTrack,
      stateInk,
      pickInk,
      focusRing,
      strippedEndsPlate: ended,
      progressPersisted: persistence.persisted
    }
  };
}

/**
 * One bolt's box on screen, for a screenshot clip.
 *
 * The bolt, not the whole plate. Clipping the plate included the torque
 * readouts, whose text changes while a bolt turns — so a stylesheet that
 * stroked the gauge, the band and the head in `transparent`, leaving nothing
 * drawn on the bolt at all, still changed pixels and passed.
 */
async function boltBox(page, boltId) {
  return page.$eval(`[data-bolt="${boltId}"]`, el => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
  });
}

/**
 * Click a bolt, then hold a key on it without touching focus from the driver.
 *
 * The pointer handler calls `preventDefault`, which suppresses the browser's own
 * focus, so it must set focus itself. Deleting that one line leaves
 * `activeElement` on the body and the keyboard dead after any click — the
 * SS-025 defect, restorable in one line and invisible to a check that focuses
 * bolts for itself.
 */
async function proveKeyboardAfterPointer(page, boltId) {
  await page.evaluate(() => document.getElementById('restart')?.click());
  await settle(200);
  // Focus is deliberately taken off the plate first. An earlier phase focuses a
  // bolt from the driver, and with focus still there the keyboard works whether
  // or not the pointer handler restores it — which is the one arrangement in
  // which deleting that line cannot be noticed.
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    document.body.focus?.();
  });
  await settle(100);
  const box = await page.$eval(`[data-bolt="${boltId}"]`, el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.click(box.x, box.y);
  await settle(150);
  const read = () => page.evaluate(
    id => Number.parseFloat(document.querySelector(`[data-readout="${id}"]`)?.textContent) || 0, boltId);
  const before = await read();
  await page.keyboard.down(' ');
  await settle(400);
  await page.keyboard.up(' ');
  const after = await read();
  return after > before;
}

/** Focus leaving the plate mid-hold must stop the turn, and it must stay stopped. */
async function proveFocusLossReleases(page, boltId) {
  await page.evaluate(() => document.getElementById('restart')?.click());
  await settle(200);
  const read = () => page.evaluate(
    id => Number.parseFloat(document.querySelector(`[data-readout="${id}"]`)?.textContent) || 0, boltId);
  await page.focus(`[data-bolt="${boltId}"]`);
  await page.keyboard.down(' ');
  await settle(300);
  await page.evaluate(() => document.getElementById('restart')?.focus());
  await settle(120);
  const atFocusLoss = await read();
  await settle(500);
  const later = await read();
  await page.keyboard.up(' ');
  return later === atFocusLoss;
}

/**
 * A bolt must change state class as it crosses into its band. Without the class
 * being cleared, the old one stays alongside the new and the gauge stops
 * reporting what the bolt is.
 */
async function proveStateClasses(page, boltId) {
  await page.evaluate(() => document.getElementById('restart')?.click());
  await settle(200);
  const classesOf = () => page.evaluate(
    id => document.querySelector(`[data-bolt="${id}"]`)?.className ?? '', boltId);
  const before = await classesOf();
  const box = await page.$eval(`[data-bolt="${boltId}"]`, el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await settle(1400);
  await page.mouse.up();
  const after = await classesOf();
  const states = text => (text.match(/is-(loose|seated|over|stripped)/g) || []);
  await page.evaluate(() => document.getElementById('restart')?.click());
  await settle(200);
  return before.includes('is-loose') && states(after).length === 1 && !after.includes('is-loose');
}

/**
 * Hold a bolt with two inputs, let one go, and it must keep turning.
 *
 * A bolt is held by a set of causes precisely so that tapping Enter while Space
 * is down, or lifting a second finger, does not end a turn the other input is
 * still making. Deleting the size check restores that defect in one line, and
 * nothing here noticed — the behaviour had only ever been reproduced by hand.
 */
async function proveSecondReleaseKeepsTurning(page, boltId) {
  await page.evaluate(() => document.getElementById('restart')?.click());
  await settle(200);
  const read = () => page.evaluate(
    id => Number.parseFloat(document.querySelector(`[data-readout="${id}"]`)?.textContent) || 0, boltId);
  await page.focus(`[data-bolt="${boltId}"]`);
  await page.keyboard.down(' ');
  await settle(250);
  // A second input joins the same bolt, then leaves it.
  await page.keyboard.down('Enter');
  await settle(80);
  await page.keyboard.up('Enter');
  await settle(60);
  const atSecondRelease = await read();
  await settle(400);
  const later = await read();
  await page.keyboard.up(' ');
  await settle(80);
  await page.evaluate(() => document.getElementById('restart')?.click());
  await settle(150);
  return later > atSecondRelease;
}

/**
 * How many times the status line is rewritten during a one-second hold.
 *
 * It is an `aria-live` region and `paint()` runs every frame, so assigning it
 * unconditionally re-stuffs a screen reader's polite queue about sixty times a
 * second. The fix was to assign only on change; nothing checked that it stayed
 * fixed.
 */
async function measureStatusChurn(page, boltId) {
  await page.evaluate(() => document.getElementById('restart')?.click());
  await settle(200);
  await page.evaluate(() => {
    window.__statusWrites = 0;
    const node = document.getElementById('status');
    if (!node) return;
    new MutationObserver(list => { window.__statusWrites += list.length; })
      .observe(node, { childList: true, characterData: true, subtree: true });
  });
  const box = await page.$eval(`[data-bolt="${boltId}"]`, el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await settle(1000);
  await page.mouse.up();
  const writes = await page.evaluate(() => window.__statusWrites ?? 0);
  await page.evaluate(() => document.getElementById('restart')?.click());
  await settle(150);
  return writes;
}

/**
 * After restarting a plate, focus must be on a bolt. The other way a plate
 * loads — chosen from the picker — is asserted in `provePersistence`, where a
 * second plate is unlocked; both call sites pass `focus: true` and only one of
 * them used to be checked.
 *
 * `showBench` scrolls *and* focuses, and only the scroll was asserted — so
 * deleting the focus half left a keyboard player on the document body after
 * every plate load, which is the defect its own docstring says it prevents.
 */
async function proveFocusAfterLoad(page) {
  const focusedBolt = () => page.evaluate(() => document.activeElement?.dataset?.bolt ?? null);
  await page.click('#restart');
  await settle(250);
  return Boolean(await focusedBolt());
}



/**
 * Every plate's coupling, as the running game uses it, against the value the
 * model says it should.
 *
 * `constants.js` lets a plate lower its own coupling and the bracket does, but
 * nothing connected the value the *unit tests* verify to the one `main.js`
 * passes to `turn()`. Replacing `couplingFor(plate)` with the house constant
 * made the bracket silently ignore its own tuning, and passed: the driver only
 * ever played the first plate. Progress is seeded so every plate can be opened.
 */
async function proveCouplingPerPlate(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.evaluate(async () => {
    const { PLATES } = await import('./constants.js');
    try { localStorage.setItem('studio_overtighten_progress', String(PLATES.length)); } catch { /* ignore */ }
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await settle(400);
  const expected = await page.evaluate(async () => {
    const { PLATES, couplingFor } = await import('./constants.js');
    return PLATES.map(p => couplingFor(p));
  });
  for (let i = 0; i < expected.length; i++) {
    await page.evaluate(n => document.querySelector(`#picker [data-plate="${n}"]`)?.click(), i);
    await settle(250);
    const used = await page.evaluate(() => Number(document.getElementById('plate')?.dataset.coupling));
    if (!(Math.abs(used - expected[i]) < 1e-9)) return false;
  }
  return true;
}

/**
 * Press each control and check something actually happened.
 *
 * Restart must reset a turned bolt; the picker must change the plate; advance
 * is checked during the persistence solve, where a plate has been cleared and
 * the button is on screen. Each of these listeners was emptied in turn by the
 * second review, and each left a dead button with the whole ticket stage green.
 */
async function exerciseControls(page) {
  const firstBolt = await page.evaluate(() => document.querySelector('[data-bolt]')?.dataset.bolt ?? '');
  const valueOf = id => page.evaluate(
    boltId => Number.parseFloat(document.querySelector(`[data-readout="${boltId}"]`)?.textContent) || 0, id);

  // Turn the bolt here rather than relying on an earlier phase having left it
  // turned: the helpers above each restart the plate, and a restart button
  // "resets" a bolt that was already at zero however dead its listener is.
  const box = await page.$eval(`[data-bolt="${firstBolt}"]`, el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await settle(400);
  await page.mouse.up();
  await settle(120);
  const before = await valueOf(firstBolt);
  await page.click('#restart');
  await settle(200);
  const afterRestart = await valueOf(firstBolt);

  // A locked plate must not load. This is the picker's *refusal*, and on its own
  // it is satisfied by a picker that does nothing at all — which is why the
  // picker's positive case is checked later, once a second plate is unlocked.
  const nameBefore = await currentPlate(page);
  await page.evaluate(() => document.querySelector('#picker [data-plate="1"]')?.click());
  await settle(200);
  const lockedStayed = (await currentPlate(page)) === nameBefore;

  // The mute toggle. Never pressed before, while the comment above claimed
  // every control was — and `sfx.js` has no other coverage in the repository.
  const muteBefore = await page.evaluate(() => ({
    pressed: document.getElementById('mute')?.getAttribute('aria-pressed'),
    label: document.getElementById('mute')?.textContent?.trim()
  }));
  await page.click('#mute');
  await settle(150);
  const muteAfter = await page.evaluate(() => ({
    pressed: document.getElementById('mute')?.getAttribute('aria-pressed'),
    label: document.getElementById('mute')?.textContent?.trim()
  }));
  await page.click('#mute');
  await settle(150);

  return {
    'Start this plate again': before > 0 && afterRestart === 0,
    'plate picker refuses a locked plate': lockedStayed,
    'Sound on/off': muteBefore.pressed === 'false'
      && muteAfter.pressed === 'true'
      && muteAfter.label !== muteBefore.label
  };
}

/** Which plate the picker says is current, by index — not by a label that can be blanked. */
function currentPlate(page) {
  return page.evaluate(() =>
    document.querySelector('#picker [aria-current="true"]')?.dataset.plate ?? null);
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
  const unsolved = {
    persisted: false, advanced: false, picked: false, boltsOnScreen: false,
    pickerRefreshed: false, outcomeExplained: false, advanceLabelled: false,
    focusedAfterPick: false
  };
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

  if (!(await solvedNow())) return unsolved;

  // "Next plate" only exists once a plate has been cleared, so it is pressed
  // here rather than in exerciseControls.
  // Both of these need a cleared plate to exist, so they happen here rather
  // than in exerciseControls. Identity is read from the picker's own
  // `aria-current` index, not from a heading a mutation can blank.
  // Read while the outcome panel is up: its explanation and the next button's
  // generated label. Both could be blanked with everything still green — the
  // labels rule covered the plate's name and hint and not the one control whose
  // text the code writes.
  const outcomeExplained = await page.evaluate(() =>
    (document.getElementById('outcome-line')?.textContent ?? '').trim().length > 10);
  const advanceLabelled = await page.evaluate(() =>
    (document.getElementById('advance')?.textContent ?? '').trim().length > 0);
  // And the picker must be redrawn when a plate is cleared, not only on reload.
  const pickerRefreshed = await page.evaluate(() =>
    document.querySelectorAll('#picker [data-plate][disabled]').length);

  const beforeAdvance = await currentPlate(page);
  await page.click('#advance');
  await settle(400);
  const advanced = (await currentPlate(page)) !== beforeAdvance;

  await page.reload({ waitUntil: 'networkidle2' });
  await settle(400);
  const lockedAfter = await page.evaluate(() =>
    document.querySelectorAll('#picker [data-plate][disabled]').length);

  // The picker's positive case: a plate that is now unlocked must load when
  // pressed. Deleting the picker's listener entirely passed every check while
  // this was only ever tested on a fresh profile, where nothing may load anyway.
  const beforePick = await currentPlate(page);
  const target = beforePick === '0' ? '1' : '0';
  // A small phone for this one measurement. On a tall viewport the bench fits
  // however it is scrolled, which is the configuration where scrolling to the
  // wrong edge cannot fail.
  await page.setViewport({ width: 320, height: 568 });
  await settle(200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(120);
  // A real click, not `element.click()`. The browser scrolls a control into
  // view and focuses it when a person presses it, and that is exactly what
  // pushes the bench off the top — a programmatic click does neither, so it
  // tests the page in the one configuration where this cannot fail.
  await page.click(`#picker [data-plate="${target}"]`);
  await settle(500);
  const picked = (await currentPlate(page)) === target;
  // The pick path's focus, which the restart path's helper only claimed to
  // cover. Both call sites pass `focus: true` and only one was asserted.
  const focusedAfterPick = await page.evaluate(() => Boolean(document.activeElement?.dataset?.bolt));

  // And the plate you just chose has to be on screen. The picker sits after the
  // bench in the document, so pressing it scrolls the picker into view: with the
  // bench scrolled to the wrong edge every bolt sits above the top of a phone
  // screen and there is nothing playable visible at all.
  const boltsOnScreen = await page.evaluate(() => {
    const bolts = [...document.querySelectorAll('[data-bolt]')];
    if (!bolts.length) return false;
    return bolts.every(b => {
      const r = b.getBoundingClientRect();
      return r.top >= 0 && r.bottom <= window.innerHeight;
    });
  });

  return {
    persisted: lockedAfter < lockedBefore,
    advanced, picked, boltsOnScreen,
    pickerRefreshed: pickerRefreshed < lockedBefore,
    focusedAfterPick,
    outcomeExplained,
    advanceLabelled
  };
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
        withoutStorage: await observeWithoutStorage(browser, url)
      };
      if (pagePath === 'studio/index.html') {
        const home = await observeHome(browser, url);
        // A card's link is "reachable" only if it points at a page this check
        // itself discovered and booted. A url that merely parses is not a door.
        home.shelfCards = home.shelfCards
          .filter(card => !card.killed)
          .map(card => ({
            ...card,
            // A page the check booted **and not the shelf's own page**. The
            // first version accepted any booted page, so pointing a card at
            // `./` made the only game unreachable and passed — the defect the
            // rule was written for, one substitution over.
            reachable: card.href
              ? pages.some(p => {
                const target = '/' + p.replace(/index\.html$/, '');
                return card.href.replace(site.origin, '') === target && target !== '/studio/';
              })
              : false
          }));
        Object.assign(obs, home);
      }
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
