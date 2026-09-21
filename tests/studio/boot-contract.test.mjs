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
  declaresDeviceWidth, firstFrame, isInvisibleColour, judgeGeneric, judgeHome,
  judgeLockedPick, judgeStateInk,
  judgeKilledTreatment, judgeOvertighten, judgePage, pageErrors, sourceUrl
} from './lib/boot-contract.mjs';

/** A page that holds every generic rule. Each test spoils exactly one thing. */
function goodGeneric(overrides = {}) {
  return {
    errors: [],
    backLink: { present: true, href: '../', width: 87, height: 44 },
    targets: [{ label: 'a "← Arcade"', width: 87, height: 44, laidOut: true, visible: true }],
    documentWidth: NARROW_WIDTH,
    clientWidth: NARROW_WIDTH,
    viewportWidth: NARROW_WIDTH,
    deviceWidth: NARROW_WIDTH,
    layoutWidth: NARROW_WIDTH,
    viewportMeta: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
    mainText: 'Iteration 02',
    withoutScript: { present: true, text: 'This page builds its shelf in the browser, so it needs JavaScript.' },
    withoutStorage: { mainText: 'Iteration 02', errors: [], storageBlocked: true, inheritedStubbed: true },
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
    shelfCards: [{ title: 'Overtighten', href: 'http://x/studio/games/overtighten/', killed: false, reachable: true }],
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

test('a missing viewport meta tag is named as a missing viewport meta tag', () => {
  // Read from the tag rather than inferred from a measurement. Inferring it
  // reported a page whose tag was present and correct as "missing a viewport
  // meta tag" the moment anything inside the page was too wide.
  const fail = judgeGeneric(goodGeneric({
    viewportMeta: null, layoutWidth: 980, clientWidth: 980, viewportWidth: 980, documentWidth: 980
  }));
  assert.match(fail[0], /no viewport meta tag/);
  assert.match(fail[1], /content forced the layout viewport to 980px/);
  assert.match(judgeGeneric(goodGeneric({ viewportMeta: 'initial-scale=1' }))[0], /does not ask for the device width/);
  assert.deepEqual(judgeGeneric(goodGeneric()), []);
});

test('a viewport meta tag is judged on what it asks for', () => {
  for (const good of ['width=device-width', 'width=device-width, initial-scale=1', 'WIDTH=DEVICE-WIDTH']) {
    assert.equal(declaresDeviceWidth(good), true, good);
  }
  for (const bad of ['initial-scale=1', 'width=980', '', null, undefined, 'width=device-widths']) {
    assert.equal(declaresDeviceWidth(bad), false, String(bad));
  }
});

test('content wider than the device is its own failure, with its own cause', () => {
  // Under mobile emulation Chrome grows the *layout* viewport to fit an
  // overflow, so this is not a scroll and must not be reported as one — and
  // the tag being present must not be reported as it being absent.
  const fail = judgeGeneric(goodGeneric({ layoutWidth: 440, viewportWidth: 440 }));
  assert.equal(fail.length, 1);
  assert.match(fail[0], /content forced the layout viewport to 440px on a 320px device/);
  assert.ok(!/viewport meta tag/.test(fail[0]), 'it must not blame the tag, which is present');
});

test('sideways scroll is measured against the layout viewport, not against innerWidth', () => {
  // `innerWidth` tracks the overflow under mobile emulation, so comparing
  // against it made this rule unreachable: it could only ever compare a number
  // against itself. `clientWidth` is what the content is laid out against.
  assert.deepEqual(judgeGeneric(goodGeneric({ documentWidth: 320, clientWidth: 320 })), []);
  assert.match(
    judgeGeneric(goodGeneric({ documentWidth: 508, clientWidth: 320 }))[0],
    /scrolls sideways: content is 508px inside a 320px viewport/
  );
});

test('a width that was never measured fails rather than passing by omission', () => {
  assert.match(judgeGeneric(goodGeneric({ clientWidth: undefined }))[0], /never measured/);
  assert.match(judgeGeneric(goodGeneric({ deviceWidth: undefined }))[0], /never measured/);
});

test('an empty main fails even when everything else is intact', () => {
  assert.match(judgeGeneric(goodGeneric({ mainText: '   ' }))[0], /rendered no text/);
});

test('the no-JS path fails when the fallback is missing, and when it is a token gesture', () => {
  assert.match(judgeGeneric(goodGeneric({ withoutScript: { present: false } }))[0], /says nothing/);
  assert.match(judgeGeneric(goodGeneric({ withoutScript: { present: true, text: 'Needs JS.' } }))[0], /too short/);
});

test('blocked storage fails on a throw, and on a page that renders nothing', () => {
  const blocked = extra => ({ mainText: 'x', errors: [], storageBlocked: true, inheritedStubbed: true, ...extra });
  assert.match(
    judgeGeneric(goodGeneric({ withoutStorage: blocked({ errors: ['uncaught: SecurityError'] }) }))[0],
    /with site data blocked the page throws/
  );
  assert.match(
    judgeGeneric(goodGeneric({ withoutStorage: blocked({ mainText: '' }) }))[0],
    /renders nothing/
  );
});

test('the blocked-storage pass has to prove it was blocked', () => {
  // Otherwise it degrades silently into a second ordinary load — and passes.
  // The iteration's own rule, turned on the check: verify in the configuration
  // where it can fail, and first check that you are in it.
  const blocked = extra => ({ mainText: 'x', errors: [], storageBlocked: true, inheritedStubbed: true, ...extra });
  assert.match(
    judgeGeneric(goodGeneric({ withoutStorage: blocked({ storageBlocked: false }) }))[0],
    /without storage actually being blocked/
  );
  assert.match(
    judgeGeneric(goodGeneric({ withoutStorage: blocked({ inheritedStubbed: false }) }))[0],
    /instead of a stub/
  );
  assert.ok(judgeGeneric(goodGeneric({ withoutStorage: {} })).length >= 3);
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
    boltRepainted: true,
    gaugeInk: {
      track: { colour: 'rgb(222, 215, 202)', width: '8px' },
      band: { colour: 'rgb(138, 75, 12)', width: '3px' },
      fill: { colour: 'rgb(28, 107, 63)', width: '8px' },
      'coupling line': { colour: 'rgb(205, 196, 180)', width: '1.5px' },
      'head edge': { colour: 'rgb(205, 196, 180)' },
      'torque readout': { colour: 'rgb(91, 83, 72)' }
    },
    stateInk: {
      loose: { fill: 'rgb(91, 83, 72)', head: 'rgb(205, 196, 180)', shape: 'polygon(a)' },
      seated: { fill: 'rgb(28, 107, 63)', head: 'rgb(28, 107, 63)', shape: 'polygon(a)' },
      over: { fill: 'rgb(138, 75, 12)', head: 'rgb(138, 75, 12)', shape: 'polygon(a)' },
      stripped: { fill: 'rgb(163, 48, 28)', head: 'rgb(163, 48, 28)', shape: 'polygon(b)' }
    },
    pickInk: {
      open: { background: 'rgb(251, 249, 245)', borderStyle: 'solid', colour: 'rgb(15, 109, 122)' },
      locked: { background: 'rgba(0, 0, 0, 0)', borderStyle: 'dashed', colour: 'rgb(91, 83, 72)' }
    },
    focusRing: { style: 'solid', width: '2px', colour: 'rgb(15, 109, 122)', visible: true },
    keyboardAfterPointer: true, releasedOnFocusLoss: true, stateClassesTrack: true,
    benchOnScreenAfterPick: true, focusAfterLoad: true, pickerRefreshedOnClear: true,
    outcomeExplained: true, advanceLabelled: true, couplingPerPlate: true,
    labels: { 'plate name': 'Hinge plate', 'plate hint': 'Two bolts, coupled.', 'status line': '2 of 2 still out' },
    controls: {
      'Start this plate again': true, 'plate picker': true,
      'plate picker refuses a locked plate': true, 'Next plate': true,
      'Sound on/off': true
    },
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
    ['boltRepainted', false, /did not change a single pixel/],
    ['keyboardAfterPointer', false, /a click leaves the keyboard dead/],
    ['releasedOnFocusLoss', false, /the hold cannot be stopped/],
    ['stateClassesTrack', false, /kept its old state class/],
    ['benchOnScreenAfterPick', false, /nothing playable in view/],
    ['focusAfterLoad', false, /dropped to the document/],
    ['pickerRefreshedOnClear', false, /old lock state/],
    ['outcomeExplained', false, /title and no explanation/],
    ['advanceLabelled', false, /no label/],
    ['couplingPerPlate', false, /not the tuning that runs/],
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
  // And an observation with no error array at all fails closed, rather than
  // reading as "no errors" — the shape this file warns about for page width.
  assert.match(judgeOvertighten({ game: playing({ errors: undefined }) })[0], /no errors were collected/);
});

test('a gauge stroked in nothing fails, even though the bolt still repaints', () => {
  // The turning highlight repaints the bolt whatever the arc is stroked in, so
  // "did the pixels change" cannot see this on its own.
  assert.match(
    judgeOvertighten({ game: playing({ gaugeInk: { band: { colour: 'transparent', width: '3px' } } }) })[0],
    /the gauge's band is drawn in transparent/
  );
  assert.match(
    judgeOvertighten({ game: playing({ gaugeInk: { fill: { colour: 'rgba(0, 0, 0, 0)', width: '8px' } } }) })[0],
    /the gauge's fill is drawn in/
  );
  assert.match(judgeOvertighten({ game: playing({ gaugeInk: null }) })[0], /colours were never read/);
});

test('a visible colour at zero width still draws nothing', () => {
  // The defeat case for a colour-only rule, and the one the third review used:
  // `stroke-width: 0` on the band leaves its colour untouched, so the band —
  // the thing the player aims at — vanishes while every colour check passes.
  // This file already records an invisible band as a defect that shipped once.
  assert.match(
    judgeOvertighten({ game: playing({ gaugeInk: { band: { colour: 'rgb(138, 75, 12)', width: '0px' } } }) })[0],
    /the gauge's band is 0px wide/
  );
  assert.match(
    judgeOvertighten({ game: playing({ gaugeInk: { 'coupling line': { colour: 'rgb(1,2,3)', width: '0' } } }) })[0],
    /coupling line is 0 wide/
  );
  // A part with no width of its own — a border colour, a text colour — is
  // judged on colour alone rather than failing for a width it cannot have.
  assert.deepEqual(
    judgeOvertighten({ game: playing({ gaugeInk: { 'head edge': { colour: 'rgb(1,2,3)' } } }) }),
    []
  );
});

test('an invisible colour is recognised however it is written', () => {
  for (const value of ['transparent', 'none', '', '  ', 'rgba(0,0,0,0)', 'rgba(255, 255, 255, 0)', 'rgb(0 0 0 / 0)']) {
    assert.equal(isInvisibleColour(value), true, JSON.stringify(value));
  }
  for (const value of ['rgb(0,0,0)', 'rgba(0,0,0,0.01)', '#fff', 'rgb(255 255 255 / 0.5)']) {
    assert.equal(isInvisibleColour(value), false, JSON.stringify(value));
  }
});

test('a bolt reached with Tab must have a ring somebody can see', () => {
  const ring = over => ({ style: 'solid', width: '2px', colour: 'rgb(15,109,122)', visible: true, ...over });
  assert.deepEqual(judgeOvertighten({ game: playing({ focusRing: ring() }) }), []);
  assert.match(judgeOvertighten({ game: playing({ focusRing: null }) })[0], /not in the tab order/);
  assert.match(judgeOvertighten({ game: playing({ focusRing: ring({ visible: false }) }) })[0], /never given a ring/);
  for (const broken of [{ style: 'none' }, { width: '0px' }, { colour: 'transparent' }]) {
    assert.match(judgeOvertighten({ game: playing({ focusRing: ring(broken) }) })[0], /cannot see which bolt/);
  }
});

test('the four bolt states must be told apart, and none may be invisible', () => {
  // Read from a fixture because a live plate is all-loose, so three of the four
  // treatments were observed by nothing and deleting every one of them passed.
  const ink = over => ({
    loose: { fill: 'rgb(91,83,72)', head: 'rgb(205,196,180)', shape: 'a' },
    seated: { fill: 'rgb(28,107,63)', head: 'rgb(28,107,63)', shape: 'a' },
    over: { fill: 'rgb(138,75,12)', head: 'rgb(138,75,12)', shape: 'a' },
    stripped: { fill: 'rgb(163,48,28)', head: 'rgb(163,48,28)', shape: 'b' },
    ...over
  });
  assert.deepEqual(judgeStateInk(ink()), []);
  // Every state stroked the same: the defect, which is what deleting the three
  // state rules actually does.
  const flat = { fill: 'rgb(91,83,72)', head: 'rgb(205,196,180)', shape: 'a' };
  const fail = judgeStateInk({ loose: flat, seated: flat, over: flat, stripped: flat });
  assert.equal(fail.length, 3);
  assert.match(fail[0], /looks exactly like a loose one/);
  // A single state made invisible is named on its own.
  assert.match(judgeStateInk(ink({ over: { fill: 'transparent', head: 'x', shape: 'a' } }))[0], /over bolt's gauge is drawn in transparent/);
  assert.match(judgeStateInk(null)[0], /never read/);
  assert.match(judgeStateInk({ loose: flat })[0], /seated bolt was never rendered/);
});

test('a locked plate must look locked', () => {
  const open = { background: 'rgb(251,249,245)', borderStyle: 'solid', colour: 'rgb(15,109,122)' };
  const locked = { background: 'rgba(0,0,0,0)', borderStyle: 'dashed', colour: 'rgb(91,83,72)' };
  assert.deepEqual(judgeLockedPick({ open, locked }), []);
  // One difference is enough; identical in all three is the defect.
  assert.deepEqual(judgeLockedPick({ open, locked: { ...open, colour: 'rgb(1,2,3)' } }), []);
  assert.match(judgeLockedPick({ open, locked: { ...open } })[0], /drawn exactly like an open one/);
  assert.match(judgeLockedPick(null)[0], /never read/);
  assert.match(judgeLockedPick({ open })[0], /no open and locked pair/);
});

test('a dead control and an empty label are each named', () => {
  // Five of the second review's seven mutations were exactly this: a listener
  // body deleted, or a label blanked. Every one passed the whole ticket stage.
  assert.match(
    judgeOvertighten({ game: playing({ controls: { 'Start this plate again': false } }) })[0],
    /"Start this plate again" control does nothing/
  );
  assert.match(
    judgeOvertighten({ game: playing({ labels: { 'status line': '  ' } }) })[0],
    /the status line is empty/
  );
  assert.match(judgeOvertighten({ game: playing({ controls: undefined }) })[0], /controls were never pressed/);
  assert.match(judgeOvertighten({ game: playing({ labels: undefined }) })[0], /labels were never read/);
});

test('the realm\'s own shelf must offer something that can be reached', () => {
  // Emptying SHELF, or dropping the card's url, closed the only route to the
  // game and passed every check — in the configuration review.md claimed was
  // closed. The three-card fixture proved the component, never the realm.
  assert.match(judgeHome(goodHome({ shelfCards: [] }))[0], /the shelf is empty/);
  assert.match(judgeHome(goodHome({ shelfCards: undefined }))[0], /never read/);
  assert.match(
    judgeHome(goodHome({ shelfCards: [{ title: 'Overtighten', href: '', reachable: false }] }))[0],
    /on the shelf with no link/
  );
  assert.match(
    judgeHome(goodHome({ shelfCards: [{ title: 'Overtighten', href: 'http://x/nope/', reachable: false }] }))[0],
    /which is not a page that boots/
  );
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

test('nothing decides anything from a stack frame, because a page can forge one', () => {
  // The exemption that used to live here was removed rather than anchored
  // harder. Two passes tightened it — first to an exact path, then to an origin
  // and an exact path — and the second review walked through both by minting a
  // frame with a `//# sourceURL` comment:
  //
  //   new Function('throw new DOMException("denied","SecurityError")' +
  //                '\\n//# sourceURL=' + location.origin + '/shared/settings.js')
  //
  // Origin matched, path matched, kind matched. No property of a self-reported
  // frame is evidence of anything, so the blocked-storage pass now serves an
  // empty script in place of production's and there is no exemption left to
  // defeat. `firstFrame` survives only to put a path in a failure message.
  assert.equal(
    firstFrame(`Error: x\n    at ${ORIGIN}/anything/at/all.js:1:1`),
    `${ORIGIN}/anything/at/all.js:1:1`,
    'it reports whatever the stack claims — which is exactly why it decides nothing'
  );
  // A studio file claiming production's identity is indistinguishable here, and
  // that is the fact the design now assumes rather than resists.
  assert.deepEqual(
    pageErrors([uncaught(`${ORIGIN}${INHERITED_SETTINGS}:3:1`)]),
    ['uncaught: SecurityError: denied'],
    'a throw claiming to be production is kept like any other'
  );
});

test('there is no error filter left to impersonate', () => {
  // Two filters were tried here and both decided from `error.source`, which for
  // an uncaught throw or a console message is a string the page chose. The
  // browser's favicon request is now *answered* by the driver rather than
  // recognised afterwards, so nothing needs excusing and nothing can pretend to
  // be the thing that was excused.
  const errors = [
    { kind: 'uncaught', text: 'uncaught: SecurityError: studio bug', source: `${ORIGIN}/studio/favicon.ico:3:1` },
    { kind: 'console', text: 'console.error: studio bug', source: `${ORIGIN}/favicon.ico` },
    { kind: 'uncaught', text: 'uncaught: SecurityError: denied', source: `${ORIGIN}${INHERITED_SETTINGS}:1:1` },
    { kind: 'response', text: 'HTTP 404: /favicon.ico', source: `${ORIGIN}/favicon.ico` }
  ];
  assert.deepEqual(pageErrors(errors), errors.map(e => e.text), 'every error counts against the page');
  assert.deepEqual(pageErrors([]), []);
  assert.deepEqual(pageErrors(), []);
});
