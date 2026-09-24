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
  iteration: '08',
  shipped: '2026-09-23',
  summary: 'In progress: the studio\'s first original game, Samovar, where you pour tea for an evening of guests by feel, and River Run\'s power-ups made easy to spot from far up the river.'
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
  iteration: '07',
  line: 'Our three reviewers kept re-running the same restarts and screen widths the build had already counted, and review cost more than the rest of the sprint\'s builds together. They now leave counted evidence alone and spend their runs on what it doesn\'t reach.'
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
    title: 'Samovar',
    status: 'PROTOTYPE',
    blurb: 'The studio\'s first original game. Pour tea for an evening of ten guests: hold to pour the dark brew, hold again to top it up with hot water, and match the colour each guest asks for without spilling. Built to test whether judging a ratio by feel, cup after cup, is fun on its own: whether your misses shrink across an evening and you pour another.',
    iteration: '08',
    changed: '2026-09-24',
    url: 'games/samovar/'
  },
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
    blurb: 'The arcade\'s river runner, forked into the studio with saves of its own. Its first experiment: a shield and a spread shot float down the river, one at a time, with a label of their own that leaves the score readable on a phone and a spread timer in real seconds. The arcade\'s build stays as it was.',
    iteration: '07',
    changed: '2026-09-23',
    url: 'games/river-run/'
  }
];
