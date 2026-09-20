// shelf-data.js — the realm's contents, as data.
//
// This is the only file that declares what is on the shelf. Adding a game is
// one entry here and no markup anywhere: studio/shelf.js turns each entry into
// a card. Nothing in this file is invented — an empty shelf renders as an empty
// shelf, which is the honest state of the realm today.

/**
 * What the company is doing right now. The realm's one live line.
 *
 * `iteration` is checked against the newest directory in
 * docs/studio/iterations/ by a test, so this line cannot quietly go stale while
 * iterations ship past it.
 */
export const PULSE = {
  iteration: '01',
  shipped: '2026-09-20',
  summary: 'Gave the realm its Backstage identity and this shelf, and restored two arcade games that the 3D landing page had been silently dropping.'
};

/** One line from the most recent retrospective. What the team changed about itself. */
export const LEARNED = 'A check that is only exercised by the input it was written for proves nothing: test the input that defeats the rule.';

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
export const SHELF = [];
