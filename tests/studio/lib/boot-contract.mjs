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
 * Chrome asks every origin for /favicon.ico on its own. The repository ships no
 * favicon, so every page in it — production's included — answers 404. It is a
 * request the browser made, not one the page made.
 *
 * Safe to decide from, unlike a stack frame: this is the URL the browser
 * actually requested, observed by the driver, not a string the page chose.
 */
export function isBrowserInitiated(error = {}) {
  const url = sourceUrl(error.source);
  return Boolean(url && /\/favicon\.ico$/.test(url.pathname));
}

/** The error strings a page is answerable for. */
export function pageErrors(errors = []) {
  return errors.filter(e => !isBrowserInitiated(e)).map(e => e.text);
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
    if (!back.href) fail.push('the back link has no href');
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

  // Asked as "were these measured, and do they hold" rather than as a bare
  // comparison. `undefined > undefined` is false, so a rule written only as the
  // comparison passes an observation that contains no measurement at all —
  // which is the shape of every bug where a check is wired to nothing.
  if (!Number.isFinite(obs.documentWidth) || !Number.isFinite(obs.viewportWidth)) {
    fail.push('the page width was never measured');
  } else if (obs.documentWidth > obs.viewportWidth) {
    fail.push(`the page scrolls sideways at ${obs.viewportWidth}px: content is ${Math.round(obs.documentWidth)}px wide`);
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
  for (const [part, colour] of Object.entries(game.gaugeInk ?? {})) {
    if (isInvisibleColour(colour)) {
      fail.push(`the gauge's ${part} is drawn in ${colour || 'nothing'}: the player cannot see it`);
    }
  }
  if (!game.gaugeInk) fail.push('the gauge\'s colours were never read');
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
