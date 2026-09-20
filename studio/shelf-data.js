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
  iteration: '02',
  shipped: '2026-09-20',
  summary: 'Built the studio\'s first experiment, Overtighten, and gave every page in the realm a boot check that opens it in a real browser — the eight mutations the old suite survived all fail it now.'
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
  iteration: '01',
  line: 'An adversarial test has to fail against the rule it is attacking. One that passes against the old rule and the new one proves nothing about the fix.'
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
export const SHELF = [];
