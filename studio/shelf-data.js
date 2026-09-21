// shelf-data.js — the realm's contents, as data.
//
// This is the only file that declares what is on the shelf. Adding a game is
// one entry here and no markup anywhere: studio/shelf.js turns each entry into
// a card. Nothing in this file is invented — an empty shelf renders as an empty
// shelf, and a blurb says what a thing is rather than what it was meant to be.

/**
 * What the company is doing right now. The realm's one live line.
 *
 * `iteration` is checked against the newest directory in
 * docs/studio/iterations/ by a test, so this line cannot quietly go stale while
 * iterations ship past it.
 */
export const PULSE = {
  iteration: '04',
  shipped: '2026-09-21',
  summary: 'In progress, and visible as it goes: the studio makes its first fix to a production game, under a written permission its own checks enforce, and every push is now checked before and after it lands.'
};

/**
 * One line from the most recent retrospective. What the team changed about itself.
 *
 * Carries the iteration it came from for the same reason PULSE does: a free
 * string on a live page goes stale silently. A test ties `iteration` to the
 * newest iteration that has actually written a retro, so shipping one without
 * updating this line fails before it reaches the page.
 */
export const LEARNED = {
  iteration: '03',
  line: 'A check that can say "fixed" has to test the defect itself and prove its own precondition first. Ours was fooled twice by partial fixes: once by testing only the route it was built from, once by testing in the very state those fixes keyed off.'
};

/**
 * The shelf. One entry per piece of work.
 *
 * @type {{ title: string, status: 'PROTOTYPE'|'ITERATING'|'KILLED'|'PROMOTED',
 *          blurb: string, iteration: string, changed: string, url?: string }[]}
 *
 * - `status` drives the tag and the treatment. KILLED work stays on the shelf,
 *   dimmed and unplayable: visible as history, absent as an offer.
 * - `changed` is an ISO date, `YYYY-MM-DD`.
 * - `url` is relative to studio/. An entry without one renders as a card that
 *   is not a link, which is what a prototype with nothing to open looks like.
 */
export const SHELF = [
  {
    title: 'Overtighten',
    status: 'PROTOTYPE',
    blurb: 'Hold a bolt to turn it; every bolt it is coupled to loosens while you hold. Seat them all inside their bands at once. Built to test whether the coupling would make it an ordering puzzle — it does not, and the page says so.',
    iteration: '02',
    changed: '2026-09-20',
    url: 'games/overtighten/'
  }
];
