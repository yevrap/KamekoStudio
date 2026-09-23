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
  iteration: '05',
  shipped: '2026-09-22',
  summary: 'Shipped: the Studio Wing opens. River Run is the studio\'s first fork, a copy with saves of its own, and the 3D landing page\'s River Run portal now leads to it.'
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
  iteration: '04',
  line: 'A check that reads only what the checked party writes proves consistency, not legitimacy. Ours proved a production fix was planned and recorded; only a review before the push could say it was right — and that review is now required, against the exact commit.'
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
  },
  {
    title: 'River Runner 3D',
    status: 'ITERATING',
    blurb: 'The arcade\'s river runner, forked into the studio with saves of its own. It plays exactly like the original for now; River Run\'s experiments happen here from the next sprint on.',
    iteration: '05',
    changed: '2026-09-22',
    url: 'games/river-run/'
  }
];
