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

/** The file a stack trace blames first, or '' when there is no usable frame. */
export function firstFrame(stack) {
  const text = String(stack ?? '');
  const match = /\((https?:[^)\s]+)/.exec(text) || /at (https?:\S+)/.exec(text);
  return match ? match[1] : '';
}

/**
 * Chrome asks every origin for /favicon.ico on its own. The repository ships no
 * favicon, so every page in it — production's included — answers 404. It is a
 * request the browser made, not one the page made, and failing a studio page
 * for it would be reporting production's omission as the studio's defect.
 */
export function isBrowserInitiated(error = {}) {
  return /\/favicon\.ico(\?|$)/.test(error.source || '');
}

/**
 * TD-005, and only TD-005: `shared/settings.js` throws an uncaught SecurityError
 * when site data is blocked, and it is production code outside the path guard.
 *
 * The exemption is by **throwing file**, never by message. The message is
 * `SecurityError: denied` and names nobody, so a message test would exempt the
 * studio's own code for throwing the same thing — which is precisely the
 * mutation this check exists to catch. An error with no frame to blame is not
 * exempt: an exemption that widens when it is least certain is not an
 * exemption, it is a hole.
 */
export function isInheritedSettingsThrow(error = {}) {
  return error.kind === 'uncaught' && /\/shared\/settings\.js(\?|$|:)/.test(error.source || '');
}

/** The error strings a page is answerable for, after `ignore` has had its say. */
export function pageErrors(errors = [], ignore = () => false) {
  return errors.filter(e => !isBrowserInitiated(e) && !ignore(e)).map(e => e.text);
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

  const small = (obs.targets ?? []).filter(t => t.height < MIN_TARGET || t.width < MIN_TARGET);
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

  if (!(game.bolts > 0)) fail.push('the plate rendered no bolts');
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
    fail.push('the bolt kept turning after the input stopped');
  }
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
