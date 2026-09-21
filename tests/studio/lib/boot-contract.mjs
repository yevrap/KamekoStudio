// boot-contract.mjs — what a studio page must be true of, once it has booted.
//
// The judgement is here and the browser driving is in checks/boot.mjs, for the
// same reason shelf.js is separate from main.js: a rule that needs Chrome to
// run is a rule nobody reads. Everything below is a pure function over an
// "observation" — a plain object the driver collects from a real page — so the
// contract can be unit-tested against fabricated observations, including the
// ones that describe a broken page.
//
// Each judge returns an array of failure strings. Empty means the page held.
//
// Reference: docs/studio/self-checks.md, the `studio-boot` row.


// ---- Whose error is it? ------------------------------------------------------
//
// A studio page loads production scripts it may not edit, so "the page threw"
// and "the page is at fault" are different claims. Everything that decides
// between them is here, pure and tested, rather than inline in the driver:
// an exemption is the part of a check most worth attacking.

/**
 * The production script studio pages inherit for the light/dark toggle. Named
 * here because the blocked-storage pass replaces it; see below.
 */
export const INHERITED_SETTINGS = '/shared/settings.js';

/**
 * A stack frame's URL, with any trailing `:line:col` removed, or null.
 * Used for reporting, never for deciding anything. See the note on provenance.
 */
export function sourceUrl(raw) {
  const text = String(raw ?? '').trim().replace(/:\d+(?::\d+)?$/, '');
  if (!text) return null;
  try { return new URL(text); } catch { return null; }
}

/**
 * The first frame of a stack that names a URL, scanned line by line in order.
 *
 * **A stack frame's URL is not evidence of anything.** Any script can mint one
 * with a `//# sourceURL` comment, so a frame can claim to come from any file at
 * any origin. This function exists to put a helpful path in a failure message
 * and for nothing else. There used to be an exemption that trusted it; the
 * second review forged production's identity in six lines and walked straight
 * through. Nothing decides anything from this value any more.
 */
export function firstFrame(stack) {
  for (const line of String(stack ?? '').split('\n')) {
    const match = /\((https?:[^)\s]+)\)/.exec(line) || /^\s*at\s+(https?:\S+)/.exec(line);
    if (match) return match[1];
  }
  return '';
}

/**
 * The error strings a page is answerable for — which is all of them.
 *
 * There is deliberately no filter here. Two were tried and both were defeated
 * the same way: they decided from `error.source`, and for an uncaught throw or
 * a console message that is a string the page chose, forgeable with
 * `//# sourceURL`. The two things that used to need excusing — production's
 * settings drawer and the browser's favicon request — are now *changed* by the
 * driver instead, in `openPage`: it answers one exact path and replaces one
 * exact script, both decided before the page runs. Nothing about an error is
 * recognised here, so no error can be dressed up as one that would be excused.
 */
export function pageErrors(errors = []) {
  return errors.map(e => e.text);
}

/**
 * A colour that draws nothing: `transparent`, or any form with zero alpha.
 *
 * Needed because "did the pixels change" is not enough on its own. Stroking the
 * gauge, the band and the head in `transparent` leaves the bolt's *turning*
 * highlight intact, so the bolt still repaints while the thing the player reads
 * — the torque arc and the band they are aiming at — is not drawn at all.
 */
export function isInvisibleColour(value) {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text || text === 'transparent' || text === 'none') return true;
  const alpha = /^rgba?\(([^)]+)\)$/.exec(text);
  if (alpha) {
    const parts = alpha[1].split(/[,\s/]+/).filter(Boolean);
    if (parts.length >= 4 && Number(parts[3]) === 0) return true;
  }
  return false;
}

/**
 * Whether a viewport meta tag asks for the device's width.
 *
 * `width=device-width` is the whole point of the tag; a fixed pixel width, or a
 * tag with only `initial-scale`, leaves a phone laying the page out at its
 * default ~980px and scaling the result down.
 */
export function declaresDeviceWidth(content) {
  if (typeof content !== 'string') return false;
  return content.split(',').some(part => {
    const [key, value] = part.split('=').map(s => s.trim().toLowerCase());
    return key === 'width' && value === 'device-width';
  });
}

/** Every standalone target on a studio page, in CSS px. Mobile-first, per studio/README.md. */
export const MIN_TARGET = 44;

/** The width the no-horizontal-scroll rule is judged at: the narrowest phone worth supporting. */
export const NARROW_WIDTH = 320;

/**
 * The shelf's responsive contract, as the stylesheet states it: one column on a
 * phone, two from 520px, three from 900px. Measured either side of each
 * breakpoint rather than on it, so a rule moved by a few pixels is still caught
 * and a rule moved by one is not reported as if it were a redesign.
 */
export const SHELF_BREAKPOINTS = [
  { width: 380, tracks: 1 },
  { width: 519, tracks: 1 },
  { width: 520, tracks: 2 },
  { width: 899, tracks: 2 },
  { width: 900, tracks: 3 },
  { width: 1200, tracks: 3 }
];

/**
 * Elements the studio may not fix, and therefore may not assert on. The arcade's
 * settings drawer is injected into every studio page by `shared/settings.js`,
 * which is production code outside the path guard. Measuring its controls would
 * mean a studio check failing on a defect the studio cannot repair — see
 * guardrails.md on what the storage rule does and does not cover, which is the
 * same distinction.
 */
export const NOT_OURS = ['#settings-hamburger-btn', '#settings-overlay', '#kameko-update-banner'];

function list(values) {
  return values.map(v => `      · ${v}`).join('\n');
}

/**
 * The rules that hold for every page under studio/, including ones that do not
 * exist yet. A page gains these by being discovered, never by being listed.
 */
export function judgeGeneric(obs = {}) {
  const fail = [];

  const errors = obs.errors ?? [];
  if (errors.length) fail.push(`booted with ${errors.length} error(s):\n${list(errors)}`);

  const back = obs.backLink;
  if (!back || !back.present) {
    fail.push('no back link: leaving the page is a hunt');
  } else {
    // Judged on where the link *resolves*, not on what it says. A rule over the
    // raw attribute rejected `#` and accepted `#top`, `./` and a blank — three
    // more spellings of a back link that leaves you where you are, under a rule
    // whose own message is "leaving the page is a hunt".
    if (back.fragmentOnly || back.samePage) {
      fail.push(`the back link goes nowhere (href="${back.href}" resolves to this page):`
        + ' leaving the page is still a hunt');
    } else if (back.samePage === undefined) {
      fail.push('the back link was never resolved, so nothing knows where it goes');
    }
    if (back.height < MIN_TARGET) {
      fail.push(`the back link is ${back.height}px tall, under the ${MIN_TARGET}px floor`);
    }
  }

  const targets = obs.targets ?? [];

  // A control that takes up space but cannot be seen is a failure, not an
  // exclusion. The first version skipped invisible elements before measuring
  // them, which made hiding a target an escape from the 44px rule instead of a
  // violation of it: both reviews blanked the whole plate with `opacity: 0` and
  // watched the check pass. `display: none` and `[hidden]` are different — the
  // page is choosing not to offer the control at all, which is legitimate.
  const invisible = targets.filter(t => t.laidOut && !t.visible);
  if (invisible.length) {
    fail.push(`${invisible.length} control(s) take up space but cannot be seen:\n`
      + list(invisible.map(t => `${t.label} — ${t.reason ?? 'not visible'}`)));
  }

  const small = targets.filter(t => t.visible && (t.height < MIN_TARGET || t.width < MIN_TARGET));
  if (small.length) {
    fail.push(`${small.length} target(s) under ${MIN_TARGET}px at ${NARROW_WIDTH}px wide:\n`
      + list(small.map(t => `${t.label} — ${Math.round(t.width)}×${Math.round(t.height)}`)));
  }

  // Three rules over three measurements, because they are three different
  // defects and the first version reported all of them as the first one.
  //
  // Asked as "were these measured, and do they hold" rather than as bare
  // comparisons: `undefined > undefined` is false, so a rule written only as
  // the comparison passes an observation containing no measurement at all.
  if (!Number.isFinite(obs.documentWidth) || !Number.isFinite(obs.clientWidth)
      || !Number.isFinite(obs.layoutWidth) || !Number.isFinite(obs.deviceWidth)) {
    fail.push('the page width was never measured');
  } else {
    // 1. Does the page ask for the device's width? Read from the tag, not
    //    inferred from a measurement — inferring it reported a page whose meta
    //    tag was present and correct as "missing a viewport meta tag".
    if (!declaresDeviceWidth(obs.viewportMeta)) {
      fail.push(obs.viewportMeta === null
        ? 'there is no viewport meta tag: a phone lays the page out at ~980px and renders it zoomed out'
        : `the viewport meta tag does not ask for the device width (${obs.viewportMeta})`);
    }
    // 2. Did the content force the layout viewport wider than the device
    //    anyway? Chrome grows the layout viewport to fit an overflow under
    //    mobile emulation, which is why this is not a scroll.
    if (obs.layoutWidth > obs.deviceWidth) {
      fail.push(`content forced the layout viewport to ${obs.layoutWidth}px on a ${obs.deviceWidth}px device:`
        + ' something inside the page is wider than the screen, so it renders zoomed out');
    }
    // 3. And can it be scrolled sideways within its own layout? Compared
    //    against `clientWidth`, which does not move with the overflow the way
    //    `innerWidth` does — that identity is what made this rule unreachable.
    if (obs.documentWidth > obs.clientWidth) {
      fail.push(`the page scrolls sideways: content is ${Math.round(obs.documentWidth)}px`
        + ` inside a ${Math.round(obs.clientWidth)}px viewport`);
    }
  }

  if (!String(obs.mainText ?? '').trim()) fail.push('main rendered no text at all');

  // The no-JS path. A page whose content is built in the browser owes the
  // reader an explanation when it cannot build it, and the only way to know the
  // explanation is really there is to load the page with scripting off.
  const nojs = obs.withoutScript ?? {};
  if (!nojs.present) {
    fail.push('with JavaScript disabled the page says nothing: no noscript fallback rendered');
  } else if (String(nojs.text ?? '').trim().length < 40) {
    fail.push(`the noscript fallback is ${String(nojs.text ?? '').trim().length} characters — too short to explain anything`);
  }

  // The blocked-storage path. studio/ shares an origin with production and the
  // page keeps a visit log, so every accessor can throw. The page must survive
  // it, not merely avoid it.
  const blocked = obs.withoutStorage ?? {};
  // First, that the configuration happened at all. Without this the pass would
  // become a second ordinary load if the injection ever stopped applying, and
  // still report a pass.
  if (!blocked.storageBlocked) {
    fail.push('the blocked-storage pass ran without storage actually being blocked');
  }
  if (!blocked.inheritedStubbed) {
    fail.push('the blocked-storage pass loaded production\'s settings script instead of a stub');
  }
  if ((blocked.errors ?? []).length) {
    fail.push(`with site data blocked the page throws:\n${list(blocked.errors)}`);
  }
  if (!String(blocked.mainText ?? '').trim()) {
    fail.push('with site data blocked the page renders nothing');
  }

  return fail;
}

/**
 * The realm's home page on top of the generic rules. Everything here is
 * measured against a fixture built from the page's own shelf component, not
 * against whatever happens to be on the shelf today — iteration 01 ticked three
 * criteria against an empty shelf, the one configuration where they cannot fail.
 */
export function judgeHome(obs = {}) {
  const fail = [];

  if (!String(obs.pulseText ?? '').trim()) {
    fail.push('the pulse line is empty: the page did not run its own script');
  }
  if (!String(obs.learnedText ?? '').trim()) {
    fail.push('the retro line is empty');
  }
  if (!obs.shelfRegion || !obs.shelfRegion.present) {
    fail.push('#shelf-region is missing: there is nowhere for the shelf to render');
  } else if (!String(obs.shelfRegion.text ?? '').trim()) {
    fail.push('#shelf-region rendered nothing — not even the empty state');
  }

  // The *real* shelf, not the fixture. The fixture proved the component; it
  // said nothing about whether the realm actually offers anything. Emptying
  // SHELF, or dropping a card's url, closed the only route to the game and
  // passed every check — in the very configuration the last review was
  // supposed to have closed.
  const cards = obs.shelfCards;
  if (!Array.isArray(cards)) {
    fail.push('the realm home\'s own shelf was never read');
  } else if (cards.length === 0) {
    fail.push('the shelf is empty: the realm offers nothing, whatever the component can render');
  } else {
    for (const card of cards) {
      if (!card.href) fail.push(`"${card.title}" is on the shelf with no link: there is no way to reach it`);
      else if (!card.reachable) fail.push(`"${card.title}" links to ${card.href}, which is not a page that boots`);
    }
  }
  if (obs.shelfSectionHidden) {
    fail.push('the shelf section is still hidden: main.js never revealed it');
  }

  for (const { width, tracks } of SHELF_BREAKPOINTS) {
    const seen = (obs.shelfTracks ?? {})[width];
    if (seen === undefined) {
      fail.push(`the shelf was never measured at ${width}px`);
    } else if (seen !== tracks) {
      fail.push(`at ${width}px the shelf has ${seen} column(s), not ${tracks}`);
    }
  }

  fail.push(...judgeKilledTreatment(obs.killedCard, obs.liveCard));
  return fail;
}

/**
 * Killed work stays on the shelf as history, not as an offer: the card loses its
 * surface and its lift and sinks back into the bench. Asserted as a difference
 * from a live card rather than as three literal values, because the point is
 * that the two read differently — a stylesheet that dimmed both equally would
 * satisfy any absolute test of the killed one.
 */
export function judgeKilledTreatment(killed, live) {
  if (!killed || !live) return ['the killed-card fixture did not render'];
  const fail = [];

  // Absolute first, then the difference. A pure difference test was satisfied by
  // a killed card made *visually identical* to a live one and merely numerically
  // different — `border-style: double`, a shadow one thousandth of an alpha
  // apart. The treatment is named in the design: no surface, no lift, a dashed
  // edge. Say so, and keep the difference test for the case where the live card
  // is changed to match.
  if (killed.boxShadow !== 'none') {
    fail.push(`a killed card still casts a shadow (${killed.boxShadow}): it must sit in the bench, not on it`);
  }
  if (killed.borderStyle !== 'dashed') {
    fail.push(`a killed card's border is ${killed.borderStyle}, not dashed`);
  }
  if (killed.background === live.background) {
    fail.push(`a killed card has the same background as a live one (${killed.background}): it is not receding`);
  }
  if (killed.boxShadow === live.boxShadow) {
    fail.push('a killed card still casts the live card\'s shadow: it is sitting on the bench, not in it');
  }
  if (killed.borderStyle === live.borderStyle) {
    fail.push(`a killed card's border is ${killed.borderStyle}, the same as a live one`);
  }
  if (killed.isLink) {
    fail.push('a killed card is a link: killed work must be visible as history and absent as an offer');
  }
  return fail;
}

/**
 * Overtighten, on top of the generic rules.
 *
 * A game's page can boot perfectly and still not be a game, so this asserts the
 * mechanic rather than the markup: that holding turns a bolt by pointer and by
 * keyboard, that turning one bolt visibly loosens the one it is coupled to, and
 * that turning past the strip point ends the plate. The coupling assertion is
 * the one that matters — it is the design hypothesis, and a build where it
 * quietly stopped happening would look identical from the outside.
 */
export function judgeOvertighten(obs = {}) {
  const game = obs.game;
  if (!game) return ['the game was never driven: no observation was collected'];
  const fail = [];

  // Asked as "was this collected, and is it empty" — every other rule here
  // fails closed and these two did not, which is the shape this same file warns
  // about for the page width.
  if (!Array.isArray(game.errors)) {
    fail.push('no errors were collected while the game was driven');
  } else if (game.errors.length) {
    fail.push(`the game threw while being played:\n${list(game.errors)}`);
  }
  if (!(game.bolts > 0)) fail.push('the plate rendered no bolts');
  if (!game.plateVisible) {
    fail.push('the plate takes up space but cannot be seen');
  }
  if (!game.gaugeMoved) {
    fail.push('the gauge did not move while the bolt was turning: the page shows a number, not a state');
  }
  // The attribute changing is not the same as the player seeing anything. A
  // stylesheet that strokes the gauge, the band and the head in `transparent`
  // leaves every attribute moving and the plate blank — and an invisible band
  // has already shipped here once.
  if (!game.boltRepainted) {
    fail.push('the bolt did not change a single pixel while it was turning: its gauge is not drawn');
  }
  for (const [part, ink] of Object.entries(game.gaugeInk ?? {})) {
    if (isInvisibleColour(ink.colour)) {
      fail.push(`the gauge's ${part} is drawn in ${ink.colour || 'nothing'}: the player cannot see it`);
    }
    // A visible colour at zero width draws nothing either. The band was set to
    // `stroke-width: 0` with its colour untouched and walked through the rule
    // written to stop exactly this defect.
    if (ink.width !== undefined && !(Number.parseFloat(ink.width) > 0)) {
      fail.push(`the gauge's ${part} is ${ink.width} wide: the player cannot see it`);
    }
  }
  if (!game.gaugeInk) fail.push('the gauge\'s colours were never read');
  if (!game.focusRing) {
    fail.push('tabbing from the back link did not reach a bolt: the plate is not in the tab order');
  } else if (!game.focusRing.visible) {
    fail.push('a bolt reached with Tab does not match :focus-visible, so it is never given a ring');
  } else if (game.focusRing.style === 'none' || !(Number.parseFloat(game.focusRing.width) > 0)
      || isInvisibleColour(game.focusRing.colour)) {
    fail.push(`the focus ring is ${game.focusRing.style} ${game.focusRing.width} ${game.focusRing.colour}:`
      + ' a keyboard player cannot see which bolt they are on');
  }
  fail.push(...judgeStateInk(game.stateInk));
  fail.push(...judgeLockedPick(game.pickInk));
  for (const [label, text] of Object.entries(game.labels ?? {})) {
    if (!String(text ?? '').trim()) fail.push(`the ${label} is empty`);
  }
  if (!game.labels) fail.push('the plate\'s labels were never read');
  if (!(game.lockedPicks > 0)) {
    fail.push('no plate is locked on a fresh profile: the plates are not gated at all');
  }
  if (!game.keyboardTurned) {
    fail.push('holding a key on a focused bolt did not turn it: the game is unplayable without a pointer');
  }
  if (!game.pointerTurned) fail.push('holding the pointer on a bolt did not turn it');
  if (!game.couplingObserved) {
    fail.push('turning a bolt did not loosen the bolt it is coupled to — the mechanic is not running');
  }
  if (!game.released) {
    fail.push('the bolt kept turning after the key was released');
  }
  if (!game.releasedPointer) {
    fail.push('the bolt kept turning after the pointer was released: every tap runs the bolt to its strip point');
  }
  // The keyboard *after* a pointer press. The check used to focus a bolt itself
  // and then drive the pointer, which is the one order in which deleting the
  // handler's focus() call cannot be noticed — and that deletion is the SS-025
  // defect, restorable in one line.
  if (!game.survivesSecondRelease) {
    fail.push('releasing one of two inputs ended a turn the other was still making');
  }
  // Sixty writes a second to an aria-live region is a screen reader being
  // spoken over by itself for the length of every hold. A handful of changes
  // during a second of turning is the expected shape.
  if (!Number.isFinite(game.statusChurn)) {
    fail.push('the status line\'s churn was never measured');
  } else if (game.statusChurn > 12) {
    fail.push(`the status line was rewritten ${game.statusChurn} times while a bolt was seating:`
      + ' it is an aria-live region and this speaks over itself');
  } else if (game.statusChurn === 0) {
    // The opposite defect, and the rule had no floor: freezing the line on the
    // plate's opening sentence gave zero writes and passed, leaving a sighted
    // player a stale count and a screen-reader player no progress at all.
    fail.push('the status line never changed while a bolt crossed into its band: it is frozen');
  }
  if (!game.keyboardAfterPointer) {
    fail.push('holding a key did nothing after the pointer was used: a click leaves the keyboard dead');
  }
  // Losing focus must stop a turn. Without it, tabbing away mid-hold leaves a
  // bolt running to its strip point with no way to stop it.
  if (!game.releasedOnFocusLoss) {
    fail.push('the bolt kept turning after focus left it: the hold cannot be stopped');
  }
  if (!game.focusAfterLoad) {
    fail.push('after loading a plate, focus is not on a bolt: a keyboard player is dropped to the document');
  }
  if (!game.pickerRefreshedOnClear) {
    fail.push('the picker still showed the old lock state after a plate was cleared');
  }
  if (!game.outcomeExplained) {
    fail.push('the outcome panel gives a title and no explanation');
  }
  if (!game.advanceLabelled) {
    fail.push('the "next plate" button ships with no label');
  }
  if (!game.couplingPerPlate) {
    fail.push('a plate is being played at a coupling other than its own: the tuning the tests verify is not the tuning that runs');
  }
  if (!game.benchOnScreenAfterPick) {
    fail.push('after choosing a plate, its bolts are off screen: there is nothing playable in view');
  }
  if (!game.stateClassesTrack) {
    fail.push('a bolt kept its old state class as it seated: the gauge stops reporting what it is');
  }
  if (!game.progressPersisted) {
    fail.push('clearing a plate did not survive a reload: the game has no persistence');
  }
  // Every control on the page, pressed. A dead button is invisible to a check
  // that only ever touches the bolts.
  for (const [name, worked] of Object.entries(game.controls ?? {})) {
    if (!worked) fail.push(`the "${name}" control does nothing when pressed`);
  }
  if (!game.controls) fail.push('the page\'s controls were never pressed');
  if (!game.strippedEndsPlate) {
    fail.push('turning past the strip point did not end the plate');
  }
  return fail;
}

/**
 * The four states a bolt can be in must be drawn differently from one another.
 *
 * Asserted as a difference rather than as four literal colours, for the same
 * reason the killed card is: the point is that a player can tell them apart.
 * Read from a fixture, because a live plate starts with every bolt loose — so
 * three of the four treatments were observed by nothing, and deleting all of
 * them passed. The stylesheet's own header says amber means past the band and
 * red means a ruined thread; this is that promise, checked.
 */
/**
 * A colour as three channels, or null if it cannot be read.
 */
export function channelsOf(value) {
  const m = /^rgba?\(([^)]+)\)$/.exec(String(value ?? '').trim().toLowerCase());
  if (!m) return null;
  const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  return parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite) ? parts.slice(0, 3) : null;
}

/**
 * How far apart two colours are, as the largest single-channel difference.
 *
 * Crude on purpose: the question is "could a person tell these apart", and a
 * rule that answers it badly is still enormously better than a string
 * comparison. Four greys one unit of blue apart are four *different strings*
 * and one colour to the eye, and that is exactly how a difference test over
 * strings was defeated.
 */
export function colourDistance(a, b) {
  const x = channelsOf(a);
  const y = channelsOf(b);
  if (!x || !y) return a === b ? 0 : Infinity;
  return Math.max(...x.map((v, i) => Math.abs(v - y[i])));
}

/** Below this, two colours are the same colour as far as a player is concerned. */
export const MIN_COLOUR_GAP = 24;

/** "a loose bolt", "an over bolt" — the message reads as a sentence either way. */
function article(word) {
  return /^[aeiou]/i.test(String(word)) ? 'an' : 'a';
}

export function judgeStateInk(ink) {
  if (!ink) return ['the bolt\'s state treatments were never read'];
  const states = ['loose', 'seated', 'over', 'stripped'];
  const fail = [];
  for (const state of states) {
    if (!ink[state]) return [`the ${state} bolt was never rendered`];
    if (isInvisibleColour(ink[state].fill)) {
      fail.push(`a ${state} bolt's gauge is drawn in ${ink[state].fill || 'nothing'}`);
    }
  }
  // The torque arc on its own, first. A composite fingerprint of
  // fill+head+shape was satisfied by the 1px head border alone, so the 8px arc
  // — the thing the player actually reads — could be one colour in all four
  // states while the rule passed and its message still said otherwise.
  // Compared as colours, not as strings, and against an absolute gap. A pure
  // difference test was satisfied by four greys one unit of blue apart — which
  // is this project's own written lesson ("a difference test needs an absolute
  // alongside it"), re-committed one round after the ticket that cited it.
  for (let i = 0; i < states.length; i++) {
    for (let j = i + 1; j < states.length; j++) {
      const [a, b] = [states[i], states[j]];
      const gap = colourDistance(ink[a].fill, ink[b].fill);
      if (gap < MIN_COLOUR_GAP) {
        fail.push(`${article(a)} ${a} bolt's gauge (${ink[a].fill}) and ${article(b)} ${b} one`
          + ` (${ink[b].fill}) are ${gap === 0 ? 'the same colour' : `${gap} apart`}:`
          + ' the arc stops reporting what the bolt is');
      }
    }
  }

  const seen = new Map();
  for (const state of states) {
    const key = `${ink[state].fill}|${ink[state].head}|${ink[state].shape}`;
    if (seen.has(key)) {
      fail.push(`${article(state)} ${state} bolt looks exactly like ${article(seen.get(key))} ${seen.get(key)} one:`
        + ' the gauge stops reporting what it is');
    } else {
      seen.set(key, state);
    }
  }
  return fail;
}

/**
 * A locked plate must look locked. `lockedPicks` counts the `disabled`
 * attribute, which says nothing about what the player sees: emptying the rule
 * left a locked plate identical to an open one, so pressing it did nothing for
 * no visible reason. The realm's shelf already holds killed work to this
 * standard — visible as a thing that exists, absent as an offer — and the
 * game's picker cites that principle by name.
 */
export function judgeLockedPick(ink) {
  if (!ink) return ['the picker\'s treatments were never read'];
  if (!ink.open || !ink.locked) return ['the picker had no open and locked pair to compare'];
  const same = ['background', 'borderStyle', 'colour'].filter(k => ink.open[k] === ink.locked[k]);
  return same.length === 3
    ? [`a locked plate is drawn exactly like an open one (${ink.locked.borderStyle}, ${ink.locked.background}): pressing it does nothing for no visible reason`]
    : [];
}

/**
 * Page-specific contracts, by path relative to the repository root. A page with
 * no entry here is still judged by `judgeGeneric` — discovery is what grants
 * coverage, so a page added later cannot arrive uncovered. The check's report
 * names which pages got only the generic contract, so "covered generically" is
 * a visible state rather than a silent one.
 */
export const SPECIFIC = {
  'studio/index.html': { name: 'the realm home', judge: judgeHome },
  'studio/games/overtighten/index.html': { name: 'Overtighten', judge: judgeOvertighten }
};

/** The full judgement for one page: the generic contract, plus its own if it has one. */
export function judgePage(pagePath, obs = {}) {
  const specific = SPECIFIC[pagePath];
  return {
    page: pagePath,
    contract: specific ? specific.name : 'generic only',
    failures: [...judgeGeneric(obs), ...(specific ? specific.judge(obs) : [])]
  };
}
