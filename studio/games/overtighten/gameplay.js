// Overtighten — the torque rules. Pure functions, no DOM, no time.
//
// The whole game is in `turn`. Everything else reads a state and reports on it.
// Keeping time out of here is deliberate: main.js converts held milliseconds
// into an amount and calls `turn`, so every rule below can be tested with exact
// numbers rather than by waiting.

/** A fresh plate: every bolt at zero, nothing stripped. */
export function initialTorque(plate) {
  const torque = {};
  for (const bolt of plate.bolts) torque[bolt.id] = 0;
  return torque;
}

/** The bolt with this id, or undefined. */
export function boltById(plate, id) {
  return plate.bolts.find(b => b.id === id);
}

/**
 * Turn one bolt by `amount`, and loosen everything coupled to it.
 *
 * Torque is only ever *added* to a bolt directly, and only ever *removed* from
 * it by turning one of its neighbours. That asymmetry is the game: an overshoot
 * is recoverable, but only by disturbing something else.
 *
 * Returns a new map; the input is never mutated, so a caller can compare before
 * and after, and the undo-free design of the UI stays a UI decision.
 */
export function turn(plate, torque, boltId, amount, coupling) {
  const bolt = boltById(plate, boltId);
  if (!bolt || !(amount > 0)) return torque;

  const next = { ...torque };
  next[boltId] = (next[boltId] ?? 0) + amount;
  const loosen = amount * coupling;
  for (const id of bolt.links) {
    // A bolt cannot be loosened past finger-tight: negative torque would mean
    // the bolt had fallen out, which is a different game.
    if (id in next) next[id] = Math.max(0, next[id] - loosen);
  }
  return next;
}

/** Inside the band, inclusive at both ends. */
export function isSeated(bolt, value) {
  return value >= bolt.lo && value <= bolt.hi;
}

/** Past the strip point. Not recoverable — that is what makes it the failure state. */
export function isStripped(bolt, value) {
  return value > bolt.strip;
}

/**
 * How a bolt stands right now, in the vocabulary the page uses.
 *
 * `fill` is the gauge position: the torque as a fraction of the strip point, so
 * the gauge and the danger it is warning about are the same scale. A gauge
 * drawn against the band instead would pin at the top well before the bolt was
 * in any trouble.
 */
export function boltState(bolt, value) {
  const v = value ?? 0;
  return {
    id: bolt.id,
    value: v,
    fill: Math.min(1, v / bolt.strip),
    bandStart: bolt.lo / bolt.strip,
    bandEnd: bolt.hi / bolt.strip,
    stripped: isStripped(bolt, v),
    seated: isSeated(bolt, v),
    // "Loose" and "over" are different problems with different fixes: one is
    // yours to turn, the other is your neighbour's. The page says which.
    state: isStripped(bolt, v) ? 'stripped'
      : isSeated(bolt, v) ? 'seated'
      : v < bolt.lo ? 'loose' : 'over'
  };
}

/** The whole plate: every bolt's state, and whether the plate is won, lost or neither. */
export function plateState(plate, torque) {
  const bolts = plate.bolts.map(b => boltState(b, torque[b.id]));
  const stripped = bolts.some(b => b.stripped);
  return {
    bolts,
    stripped,
    seatedCount: bolts.filter(b => b.seated).length,
    solved: !stripped && bolts.every(b => b.seated),
    outcome: stripped ? 'stripped' : bolts.every(b => b.seated) ? 'solved' : null
  };
}

/**
 * Every coupling is mutual. Checked rather than assumed: a one-way link would
 * draw as an ordinary line on the plate and behave as something the player has
 * no way to learn, which is worse than an obviously broken plate.
 */
export function asymmetricLinks(plate) {
  const broken = [];
  for (const bolt of plate.bolts) {
    for (const id of bolt.links) {
      const other = boltById(plate, id);
      if (!other) broken.push(`${bolt.id} → ${id} (no such bolt)`);
      else if (!other.links.includes(bolt.id)) broken.push(`${bolt.id} → ${id} is not returned`);
    }
  }
  return broken;
}

/**
 * The shape of a plate's field. A plate may state its own, within reason; a
 * missing or absurd value falls back to a square. The field is a frame around
 * the bolts rather than a fixed shape they sit inside, so a plate whose bolts
 * are all on one line is not surrounded by empty bench.
 */
export function plateAspect(plate) {
  const value = Number(plate && plate.aspect);
  return Number.isFinite(value) && value >= 0.4 && value <= 3 ? value : 1;
}

/** Each bolt's coupling load. At or above 1 a plate can lose torque faster than it gains it. */
export function couplingLoad(plate, coupling) {
  return plate.bolts.map(b => ({ id: b.id, load: b.links.length * coupling }));
}
