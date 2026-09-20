// boot-contract.test.mjs — the boot contract, judged without a browser.
//
// checks/boot.mjs collects observations from a real page; everything that
// decides whether an observation is acceptable lives in lib/boot-contract.mjs
// and is exercised here. The cases that matter are the broken ones: a rule is
// only worth having if it fails on the input that defeats it, which is the
// lesson iteration 01 wrote into the learning log and then nearly missed.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INHERITED_SETTINGS, MIN_TARGET, NARROW_WIDTH, SHELF_BREAKPOINTS,
  firstFrame, isBrowserInitiated, isInheritedSettingsThrow, judgeGeneric, judgeHome,
  judgeKilledTreatment, judgeOvertighten, judgePage, pageErrors, sourceUrl
} from './lib/boot-contract.mjs';

/** A page that holds every generic rule. Each test spoils exactly one thing. */
function goodGeneric(overrides = {}) {
  return {
    errors: [],
    backLink: { present: true, href: '../', width: 87, height: 44 },
    targets: [{ label: 'a "← Arcade"', width: 87, height: 44, laidOut: true, visible: true }],
    documentWidth: NARROW_WIDTH,
    viewportWidth: NARROW_WIDTH,
    mainText: 'Iteration 02',
    withoutScript: { present: true, text: 'This page builds its shelf in the browser, so it needs JavaScript.' },
    withoutStorage: { mainText: 'Iteration 02', errors: [] },
    ...overrides
  };
}

function goodHome(overrides = {}) {
  const tracks = {};
  for (const { width, tracks: n } of SHELF_BREAKPOINTS) tracks[width] = n;
  return goodGeneric({
    pulseText: 'Iteration 02 · 20 Sep 2026',
    learnedText: 'A rule that decides what may be written is a grammar.',
    shelfSectionHidden: false,
    shelfRegion: { present: true, text: 'Overtighten' },
    shelfTracks: tracks,
    liveCard: { background: 'rgb(251, 249, 245)', boxShadow: '0 1px 1px rgba(0,0,0,0.05)', borderStyle: 'solid', isLink: true },
    killedCard: { background: 'rgba(0, 0, 0, 0)', boxShadow: 'none', borderStyle: 'dashed', isLink: false },
    ...overrides
  });
}

test('a page that holds the contract produces no failures', () => {
  assert.deepEqual(judgeGeneric(goodGeneric()), []);
  assert.deepEqual(judgeHome(goodHome()), []);
  assert.deepEqual(judgePage('studio/index.html', goodHome()).failures, []);
});

test('an unknown page still gets the generic contract, and says so', () => {
  const verdict = judgePage('studio/games/whatever/index.html', goodGeneric());
  assert.equal(verdict.contract, 'generic only');
  assert.deepEqual(verdict.failures, []);
});

test('a page with no errors at all is the only page that passes the error rule', () => {
  const fail = judgeGeneric(goodGeneric({ errors: ['uncaught: x is not a function'] }));
  assert.equal(fail.length, 1);
  assert.match(fail[0], /1 error/);
  assert.match(fail[0], /x is not a function/);
});

test('a missing back link fails, and so does one that is too small or has no href', () => {
  assert.match(judgeGeneric(goodGeneric({ backLink: { present: false } }))[0], /no back link/);
  assert.match(judgeGeneric(goodGeneric({ backLink: { present: true, href: '', height: 44 } }))[0], /no href/);
  assert.match(
    judgeGeneric(goodGeneric({ backLink: { present: true, href: '../', height: 26 } }))[0],
    /26px tall, under the 44px floor/
  );
});

test('a target one pixel under the floor fails: the boundary is the point of the rule', () => {
  const seen = { laidOut: true, visible: true };
  const short = { label: 'a "How it works"', width: 120, height: MIN_TARGET - 1, ...seen };
  const narrow = { label: 'a "GitHub"', width: MIN_TARGET - 1, height: 48, ...seen };
  assert.deepEqual(judgeGeneric(goodGeneric({ targets: [{ ...short, height: MIN_TARGET }] })), []);
  assert.match(judgeGeneric(goodGeneric({ targets: [short] }))[0], /1 target\(s\) under 44px/);
  assert.match(judgeGeneric(goodGeneric({ targets: [narrow] }))[0], /1 target\(s\) under 44px/);
});

test('hiding a control is a failure, not an escape from the size rule', () => {
  // Both reviews defeated the first version of this rule the same way: an
  // invisible element was skipped before it was measured, so `opacity: 0` on the
  // whole plate satisfied every target assertion on the page.
  const hidden = {
    label: 'button "Bolt A"', width: 68, height: 68,
    laidOut: true, visible: false, reason: 'hidden by an ancestor (opacity or visibility)'
  };
  const fail = judgeGeneric(goodGeneric({ targets: [hidden] }));
  assert.equal(fail.length, 1);
  assert.match(fail[0], /take up space but cannot be seen/);
  assert.match(fail[0], /hidden by an ancestor/);
});

test('a control the page is not offering at all is not a failure', () => {
  // `display: none` and `[hidden]` are the page choosing not to offer a control
  // — the "Next plate" button when there is no next plate. Never laid out,
  // never measured, never failed.
  const absent = { label: 'button "Next"', width: 0, height: 0, laidOut: false, visible: false };
  assert.deepEqual(judgeGeneric(goodGeneric({ targets: [absent] })), []);
});

test('content wider than the viewport fails, and content exactly as wide does not', () => {
  assert.deepEqual(judgeGeneric(goodGeneric({ documentWidth: 320, viewportWidth: 320 })), []);
  assert.match(judgeGeneric(goodGeneric({ documentWidth: 508, viewportWidth: 320 }))[0], /scrolls sideways/);
});

test('an empty main fails even when everything else is intact', () => {
  assert.match(judgeGeneric(goodGeneric({ mainText: '   ' }))[0], /rendered no text/);
});

test('the no-JS path fails when the fallback is missing, and when it is a token gesture', () => {
  assert.match(judgeGeneric(goodGeneric({ withoutScript: { present: false } }))[0], /says nothing/);
  assert.match(judgeGeneric(goodGeneric({ withoutScript: { present: true, text: 'Needs JS.' } }))[0], /too short/);
});

test('blocked storage fails on a throw, and on a page that renders nothing', () => {
  assert.match(
    judgeGeneric(goodGeneric({ withoutStorage: { mainText: 'x', errors: ['uncaught: SecurityError'] } }))[0],
    /with site data blocked the page throws/
  );
  assert.match(
    judgeGeneric(goodGeneric({ withoutStorage: { mainText: '', errors: [] } }))[0],
    /renders nothing/
  );
});

test('the home page fails when its script never ran', () => {
  const fail = judgeHome(goodHome({
    pulseText: '', learnedText: '', shelfSectionHidden: true,
    shelfRegion: { present: true, text: '' }
  }));
  assert.equal(fail.length, 4);
  assert.match(fail.join('\n'), /pulse line is empty/);
  assert.match(fail.join('\n'), /still hidden/);
});

test('a missing shelf region is reported differently from an empty one', () => {
  assert.match(judgeHome(goodHome({ shelfRegion: { present: false } }))[0], /is missing/);
  assert.match(judgeHome(goodHome({ shelfRegion: { present: true, text: '' } }))[0], /rendered nothing/);
});

test('every breakpoint is judged either side, so a moved rule cannot hide', () => {
  // A breakpoint pushed from 520px to 620px still gives the right answer at
  // 380px and at 900px. It is the measurement at 520px that catches it, which
  // is why the table measures on the boundary as well as away from it.
  const moved = { ...goodHome().shelfTracks, 520: 1, 899: 1 };
  const fail = judgeHome(goodHome({ shelfTracks: moved }));
  assert.equal(fail.length, 2);
  assert.match(fail[0], /at 520px the shelf has 1 column\(s\), not 2/);
});

test('a breakpoint that was never measured fails rather than passing by omission', () => {
  const missing = { ...goodHome().shelfTracks };
  delete missing[900];
  assert.match(judgeHome(goodHome({ shelfTracks: missing }))[0], /never measured at 900px/);
});

test('the killed card must differ from a live one in all three ways', () => {
  const live = { background: 'rgb(251, 249, 245)', boxShadow: '0 6px 16px rgba(0,0,0,0.3)', borderStyle: 'solid', isLink: true };
  const killed = { background: 'rgba(0, 0, 0, 0)', boxShadow: 'none', borderStyle: 'dashed', isLink: false };
  assert.deepEqual(judgeKilledTreatment(killed, live), []);
  assert.match(judgeKilledTreatment({ ...killed, background: live.background }, live).join('\n'), /same background/);
  assert.match(judgeKilledTreatment({ ...killed, boxShadow: live.boxShadow }, live).join('\n'), /still casts a shadow/);
  assert.match(judgeKilledTreatment({ ...killed, borderStyle: 'solid' }, live).join('\n'), /not dashed/);
  assert.match(judgeKilledTreatment({ ...killed, isLink: true }, live).join('\n'), /absent as an offer/);
});

test('a killed card made visually identical to a live one fails, however the numbers differ', () => {
  // The defeat case for a pure difference test, built by QA: a card that reads
  // exactly like a live card but differs numerically — a double border, a shadow
  // one thousandth of an alpha apart — passed every difference assertion.
  const live = { background: 'rgb(20, 22, 26)', boxShadow: '0 1px 2px rgba(0,0,0,0.3)', borderStyle: 'solid', isLink: true };
  const disguised = {
    background: 'rgba(20, 22, 26, 0.999)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.30001)',
    borderStyle: 'double',
    isLink: false
  };
  const fail = judgeKilledTreatment(disguised, live);
  assert.equal(fail.length, 2, 'the shadow and the border style are both wrong in absolute terms');
  assert.match(fail.join('\n'), /still casts a shadow/);
  assert.match(fail.join('\n'), /not dashed/);
});

test('a stylesheet that recedes every card equally does not satisfy the killed rule', () => {
  // The defeat case for an absolute test: assert only that the killed card is
  // transparent and dashed, and a stylesheet making every card transparent and
  // dashed passes while the distinction it exists to draw has disappeared.
  const flat = { background: 'rgba(0, 0, 0, 0)', boxShadow: 'none', borderStyle: 'dashed', isLink: false };
  const fail = judgeKilledTreatment(flat, { ...flat, isLink: true });
  assert.equal(fail.length, 3);
});

test('a fixture that did not render is a failure, not an empty pass', () => {
  assert.match(judgeKilledTreatment(null, null)[0], /did not render/);
  assert.match(judgeHome(goodHome({ killedCard: undefined }))[0], /did not render/);
});

test('an empty observation fails loudly rather than quietly', () => {
  assert.ok(judgeGeneric({}).length >= 5);
  assert.ok(judgePage('studio/index.html', {}).failures.length >= 8);
});

// ---- The game's own contract -------------------------------------------------

test('a game that was never driven fails rather than passing empty', () => {
  const fail = judgeOvertighten({});
  assert.equal(fail.length, 1);
  assert.match(fail[0], /never driven/);
});

test('a fully working game produces no failures', () => {
  assert.deepEqual(judgeOvertighten({ game: playing() }), []);
});

function playing(overrides = {}) {
  return {
    errors: [], bolts: 2, lockedPicks: 2, plateVisible: true, gaugeMoved: true,
    keyboardTurned: true, released: true, pointerTurned: true, releasedPointer: true,
    couplingObserved: true, strippedEndsPlate: true, progressPersisted: true, ...overrides
  };
}

test('each way the mechanic can stop running is reported as itself', () => {
  const cases = [
    ['bolts', 0, /rendered no bolts/],
    ['lockedPicks', 0, /not gated at all/],
    ['plateVisible', false, /cannot be seen/],
    ['gaugeMoved', false, /gauge did not move/],
    ['keyboardTurned', false, /unplayable without a pointer/],
    ['pointerTurned', false, /holding the pointer on a bolt did not turn it/],
    ['couplingObserved', false, /the mechanic is not running/],
    ['released', false, /kept turning after the key was released/],
    // The one that mattered most: deleting the pointer release listeners makes
    // every tap run the bolt to its strip point and destroy the plate, and the
    // whole ticket stage passed.
    ['releasedPointer', false, /every tap runs the bolt to its strip point/],
    ['progressPersisted', false, /did not survive a reload/],
    ['strippedEndsPlate', false, /did not end the plate/]
  ];
  for (const [field, value, pattern] of cases) {
    const fail = judgeOvertighten({ game: playing({ [field]: value }) });
    assert.equal(fail.length, 1, `${field} produced ${fail.length} failures`);
    assert.match(fail[0], pattern);
  }
});

test('an error thrown while the game is being played counts against it', () => {
  // The driven phase ran with no error listener at all, so "no console errors"
  // was a claim about the page load and nothing else.
  const fail = judgeOvertighten({ game: playing({ errors: ['uncaught: x is not a function'] }) });
  assert.equal(fail.length, 1);
  assert.match(fail[0], /threw while being played/);
});

test('the game page is judged by its own contract, not only the generic one', () => {
  const verdict = judgePage('studio/games/overtighten/index.html', { game: playing() });
  assert.equal(verdict.contract, 'Overtighten');
  // The generic rules still apply on top: an observation with a working game and
  // nothing else is not a page that passed.
  assert.ok(verdict.failures.length >= 4);
});

// ---- Whose error is it? ------------------------------------------------------
//
// These four functions decide whether an uncaught throw counts against a studio
// page, and until both independent reviews attacked them they had no test at
// all — while the ticket claimed they were "unit-tested both ways". Iteration
// 01's lesson was that an exemption documented as attacked is not an exemption
// that was attacked. Every case below is one a review actually built.

const ORIGIN = 'http://127.0.0.1:54321';
const uncaught = source => ({ kind: 'uncaught', text: 'uncaught: SecurityError: denied', source });

test('a stack frame URL drops its line and column, and refuses nonsense', () => {
  assert.equal(sourceUrl(`${ORIGIN}/shared/settings.js:12:9`).pathname, '/shared/settings.js');
  assert.equal(sourceUrl(`${ORIGIN}/shared/settings.js:12`).pathname, '/shared/settings.js');
  assert.equal(sourceUrl(`${ORIGIN}/shared/settings.js`).pathname, '/shared/settings.js');
  assert.equal(sourceUrl(''), null);
  assert.equal(sourceUrl(null), null);
  assert.equal(sourceUrl('not a url'), null);
  assert.equal(sourceUrl('   '), null);
});

test('firstFrame returns the first frame, not the first parenthesised one', () => {
  // The defeat case: an anonymous studio frame above a named production frame.
  // The previous version matched the parenthesised form against the whole stack
  // first, so the studio's own throw was credited to production.
  const stack = [
    'SecurityError: denied',
    `    at ${ORIGIN}/studio/games/overtighten/main.js:25:31`,
    `    at getSavedTheme (${ORIGIN}/shared/settings.js:12:9)`
  ].join('\n');
  assert.equal(firstFrame(stack), `${ORIGIN}/studio/games/overtighten/main.js:25:31`);
});

test('firstFrame skips the message line and a frame with no URL', () => {
  assert.equal(firstFrame(''), '');
  assert.equal(firstFrame(null), '');
  assert.equal(firstFrame('SecurityError: denied'), '');
  assert.equal(firstFrame('Error: x\n    at Object.<anonymous> (<anonymous>)'), '');
  assert.equal(
    firstFrame(`Error: x\n    at Object.get [as localStorage] (<anonymous>)\n    at boot (${ORIGIN}/studio/main.js:3:1)`),
    `${ORIGIN}/studio/main.js:3:1`
  );
});

test('production\'s settings script is exempt, and only at its own origin and path', () => {
  assert.equal(isInheritedSettingsThrow(uncaught(`${ORIGIN}${INHERITED_SETTINGS}:12:9`), ORIGIN), true);
  assert.equal(isInheritedSettingsThrow(uncaught(`http://elsewhere.test${INHERITED_SETTINGS}`), ORIGIN), false,
    'another origin is not this page');
});

test('a studio-owned shared/settings.js cannot claim the exemption', () => {
  // Both reviews built exactly this file and watched the check print "pass"
  // while a studio page threw uncaught. studio/** is inside the path guard, so
  // this is a file the studio can create at will.
  for (const path of [
    '/studio/shared/settings.js',
    '/studio/games/overtighten/shared/settings.js',
    '/studio/games/x/vendor/shared/settings.js'
  ]) {
    assert.equal(isInheritedSettingsThrow(uncaught(`${ORIGIN}${path}:1:55`), ORIGIN), false, path);
  }
});

test('a near-miss path is not the exempt path', () => {
  for (const path of [
    '/shared/settings.js.map',
    '/shared/settings.json',
    '/not-shared/settings.js',
    '/shared/settings.js/extra',
    '/Shared/Settings.js'
  ]) {
    assert.equal(isInheritedSettingsThrow(uncaught(`${ORIGIN}${path}`), ORIGIN), false, path);
  }
  // A query string is not a different file, and must stay exempt.
  assert.equal(isInheritedSettingsThrow(uncaught(`${ORIGIN}${INHERITED_SETTINGS}?v=2`), ORIGIN), true);
});

test('the exemption fails closed on everything it cannot establish', () => {
  assert.equal(isInheritedSettingsThrow(uncaught(`${ORIGIN}${INHERITED_SETTINGS}`), ''), false, 'no origin');
  assert.equal(isInheritedSettingsThrow(uncaught(''), ORIGIN), false, 'no frame to blame');
  assert.equal(isInheritedSettingsThrow(uncaught(undefined), ORIGIN), false);
  assert.equal(isInheritedSettingsThrow({}, ORIGIN), false);
  assert.equal(isInheritedSettingsThrow(undefined, ORIGIN), false);
  // Only an uncaught throw. A console.error or a failed request from that file
  // is a different thing and is not waved through.
  assert.equal(
    isInheritedSettingsThrow({ kind: 'console', text: 'x', source: `${ORIGIN}${INHERITED_SETTINGS}` }, ORIGIN),
    false
  );
});

test('the exemption cannot be claimed by the message, which names nobody', () => {
  // The studio's own throw and production's are the same string. If the
  // exemption were ever rewritten to match text, this is the case that catches
  // it: identical message, studio file, must not be exempt.
  const studio = { kind: 'uncaught', text: 'uncaught: SecurityError: denied', source: `${ORIGIN}/studio/main.js:9:1` };
  const production = { kind: 'uncaught', text: 'uncaught: SecurityError: denied', source: `${ORIGIN}${INHERITED_SETTINGS}:9:1` };
  assert.equal(studio.text, production.text);
  assert.equal(isInheritedSettingsThrow(studio, ORIGIN), false);
  assert.equal(isInheritedSettingsThrow(production, ORIGIN), true);
});

test('only the browser\'s own favicon request is browser-initiated', () => {
  assert.equal(isBrowserInitiated({ source: `${ORIGIN}/favicon.ico` }), true);
  assert.equal(isBrowserInitiated({ source: `${ORIGIN}/favicon.ico?v=1` }), true);
  assert.equal(isBrowserInitiated({ source: `${ORIGIN}/studio/favicon.ico` }), true);
  assert.equal(isBrowserInitiated({ source: `${ORIGIN}/studio/main.js` }), false);
  // A page that mentions the word is not a page the browser asked for an icon.
  assert.equal(isBrowserInitiated({ source: `${ORIGIN}/favicon.ico.js`, text: 'favicon.ico' }), false);
  assert.equal(isBrowserInitiated({ source: '' }), false);
  assert.equal(isBrowserInitiated({}), false);
});

test('pageErrors keeps everything it was not explicitly told to drop', () => {
  const errors = [
    { kind: 'response', text: 'HTTP 404: /favicon.ico', source: `${ORIGIN}/favicon.ico` },
    uncaught(`${ORIGIN}${INHERITED_SETTINGS}:1:1`),
    uncaught(`${ORIGIN}/studio/main.js:1:1`),
    { kind: 'console', text: 'console.error: boom', source: `${ORIGIN}/studio/main.js` }
  ];
  assert.deepEqual(pageErrors(errors), [
    'uncaught: SecurityError: denied',
    'uncaught: SecurityError: denied',
    'console.error: boom'
  ], 'only the favicon goes by default');
  assert.deepEqual(pageErrors(errors, e => isInheritedSettingsThrow(e, ORIGIN)), [
    'uncaught: SecurityError: denied',
    'console.error: boom'
  ]);
  assert.deepEqual(pageErrors([]), []);
  assert.deepEqual(pageErrors(), []);
});
