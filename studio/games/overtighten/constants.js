// Overtighten — tuning and plates.
//
// Everything a designer would want to change lives here, and nothing here
// touches the document. The plates are hand-authored and every one is proved
// reachable from zero by a solver in tests/studio/overtighten-plates.test.mjs.
//
// That file also records what these plates turned out to be: each one falls to
// one hold per bolt, in almost any order, and to blind round-robin topping-up.
// The design hypothesis — that the coupling makes a plate an ordering puzzle —
// is false here. Tuning these numbers will not fix it; the mechanic needs a
// state the player cannot undo. See docs/studio/iterations/02/review.md.

/** Torque units added per second of holding. One "unit" has no meaning beyond the bands. */
export const TURN_RATE = 42;

/**
 * How much of what you add to a bolt is taken off each of its neighbours.
 *
 * The one number the whole game turns on. Below about 0.15 the coupling stops
 * mattering and the game is a reaction test; at `1 / degree` a bolt gives back
 * to its neighbours everything a single turn gains, which is the point past
 * which the plate stops behaving as designed. It does not stop being solvable —
 * the bracket still converges at 1.0 — so this is a design limit, not a
 * mathematical one, and `couplingLoad` enforces it as such.
 *
 * A plate may lower it — see `bracket`, whose hub has four neighbours and would
 * sit at exactly 1.0 on this value. It may not raise it: a plate that needed a
 * stronger coupling to be interesting would be saying the layout is not.
 */
export const COUPLING = 0.25;

/** The coupling in force on a plate: its own, or the house value. Never higher. */
export function couplingFor(plate) {
  const own = plate && plate.coupling;
  return Number.isFinite(own) && own > 0 && own < COUPLING ? own : COUPLING;
}

/** A bolt is seated when its torque is within the band, inclusive at both ends. */
export const BANDS = {
  /** The ordinary band: wide enough to release by hand, narrow enough to miss. */
  standard: { lo: 46, hi: 62, strip: 92 },
  /** Tighter, for the bolt a plate wants you to do last. */
  tight: { lo: 52, hi: 62, strip: 88 },
  /** Wider, for a hub that everything else drains. */
  wide: { lo: 40, hi: 64, strip: 104 }
};

function bolt(id, x, y, band, links) {
  return { id, x, y, ...BANDS[band], links };
}

/**
 * The plates, in the order they are offered.
 *
 * `x` and `y` are fractions of the plate, so the layout is resolution-free and
 * the renderer never needs a pixel from this file. `links` is symmetric and the
 * model asserts it: a one-way coupling would be invisible on the plate and
 * unreadable as a rule.
 */
export const PLATES = [
  {
    id: 'hinge',
    // Two bolts on one line, so the plate is a strip rather than a square. The
    // field is a frame around the bolts, not a fixed shape they sit inside.
    aspect: 2.1,
    name: 'Hinge plate',
    hint: 'Two bolts, coupled. Tightening either one loosens the other.',
    bolts: [
      bolt('a', 0.32, 0.5, 'standard', ['b']),
      bolt('b', 0.68, 0.5, 'standard', ['a'])
    ]
  },
  {
    id: 'face',
    name: 'Face plate',
    hint: 'A ring of four. Each bolt pulls on the two beside it, and not on the one opposite.',
    bolts: [
      bolt('a', 0.3, 0.28, 'standard', ['b', 'd']),
      bolt('b', 0.7, 0.28, 'standard', ['a', 'c']),
      bolt('c', 0.7, 0.72, 'standard', ['b', 'd']),
      bolt('d', 0.3, 0.72, 'tight', ['a', 'c'])
    ]
  },
  {
    id: 'bracket',
    // Four neighbours on the hub, so this plate turns its coupling down: at the
    // house value the hub would lose exactly as much as it gained and the plate
    // would never close. The wider hub band is the second half of the same fix.
    coupling: 0.18,
    name: 'Bracket',
    hint: 'One bolt holds the other four, and all four pull on it. Its band is wider for a reason.',
    bolts: [
      bolt('hub', 0.5, 0.5, 'wide', ['n', 'e', 's', 'w']),
      bolt('n', 0.5, 0.16, 'standard', ['hub']),
      bolt('e', 0.84, 0.5, 'standard', ['hub']),
      bolt('s', 0.5, 0.84, 'standard', ['hub']),
      bolt('w', 0.16, 0.5, 'tight', ['hub'])
    ]
  }
];

/** The copy the page shows for each way a plate can end. */
export const OUTCOMES = {
  solved: { title: 'Seated', line: 'Every bolt inside its band, all at once.' },
  stripped: { title: 'Thread stripped', line: 'Past the strip point there is nothing left to grip. Start the plate again.' }
};
