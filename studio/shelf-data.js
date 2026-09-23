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
  iteration: '06',
  shipped: '2026-09-22',
  summary: 'In progress: River Run\'s first experiment. A shield and rapid-fire float down the fork\'s river, and every ticket number in the studio\'s docs becomes a link to its ticket.'
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
  iteration: '05',
  line: 'A ticket\'s criteria belong to the step that checks them. Our record ticket listed retro work the gate needed done before the retro existed, so the template now splits the two.'
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
