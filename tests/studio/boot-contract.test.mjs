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
  MIN_TARGET, NARROW_WIDTH, SHELF_BREAKPOINTS,
  judgeGeneric, judgeHome, judgeKilledTreatment, judgeOvertighten, judgePage
} from './lib/boot-contract.mjs';

/** A page that holds every generic rule. Each test spoils exactly one thing. */
function goodGeneric(overrides = {}) {
  return {
    errors: [],
    backLink: { present: true, href: '../', width: 87, height: 44 },
    targets: [{ label: 'a "← Arcade"', width: 87, height: 44 }],
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
  const short = { label: 'a "How it works"', width: 120, height: MIN_TARGET - 1 };
  const narrow = { label: 'a "GitHub"', width: MIN_TARGET - 1, height: 48 };
  assert.deepEqual(judgeGeneric(goodGeneric({ targets: [{ ...short, height: MIN_TARGET }] })), []);
  assert.match(judgeGeneric(goodGeneric({ targets: [short] }))[0], /1 target\(s\) under 44px/);
  assert.match(judgeGeneric(goodGeneric({ targets: [narrow] }))[0], /1 target\(s\) under 44px/);
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
  const live = { background: 'rgb(251, 249, 245)', boxShadow: 'none-live', borderStyle: 'solid', isLink: true };
  const killed = { background: 'rgba(0, 0, 0, 0)', boxShadow: 'none', borderStyle: 'dashed', isLink: false };
  assert.deepEqual(judgeKilledTreatment(killed, live), []);
  assert.match(judgeKilledTreatment({ ...killed, background: live.background }, live)[0], /same background/);
  assert.match(judgeKilledTreatment({ ...killed, boxShadow: live.boxShadow }, live)[0], /still casts/);
  assert.match(judgeKilledTreatment({ ...killed, borderStyle: 'solid' }, live)[0], /same as a live one/);
  assert.match(judgeKilledTreatment({ ...killed, isLink: true }, live)[0], /absent as an offer/);
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
    bolts: 2, lockedPicks: 2, keyboardTurned: true, released: true,
    pointerTurned: true, couplingObserved: true, strippedEndsPlate: true, ...overrides
  };
}

test('each way the mechanic can stop running is reported as itself', () => {
  const cases = [
    ['bolts', 0, /rendered no bolts/],
    ['lockedPicks', 0, /not gated at all/],
    ['keyboardTurned', false, /unplayable without a pointer/],
    ['pointerTurned', false, /holding the pointer on a bolt did not turn it/],
    ['couplingObserved', false, /the mechanic is not running/],
    ['released', false, /kept turning after the input stopped/],
    ['strippedEndsPlate', false, /did not end the plate/]
  ];
  for (const [field, value, pattern] of cases) {
    const fail = judgeOvertighten({ game: playing({ [field]: value }) });
    assert.equal(fail.length, 1, `${field} produced ${fail.length} failures`);
    assert.match(fail[0], pattern);
  }
});

test('the game page is judged by its own contract, not only the generic one', () => {
  const verdict = judgePage('studio/games/overtighten/index.html', { game: playing() });
  assert.equal(verdict.contract, 'Overtighten');
  // The generic rules still apply on top: an observation with a working game and
  // nothing else is not a page that passed.
  assert.ok(verdict.failures.length >= 4);
});
