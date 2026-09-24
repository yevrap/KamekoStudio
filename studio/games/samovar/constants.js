// Samovar — tuning. Every number the game decides with is here.
//
// Volumes are in abstract units: every cup holds CUP_VOLUME of them, so a unit
// is a hundredth of a cup, and a pour adds POUR_RATE units per second of real
// time, brew and water alike. Nothing here is in pixels or frames.

/** Every cup fills from empty to the brim in this long, brew and water alike (#52). */
export const FILL_MS = 2500;

/** What every cup holds, in units. The same for every cup, so every cup fills in FILL_MS. */
export const CUP_VOLUME = 100;

/** Units per second, for both liquids. Real time, never frames (Active rule 9). */
export const POUR_RATE = CUP_VOLUME * 1000 / FILL_MS;

/** Guests per evening. */
export const EVENING_LENGTH = 10;

/**
 * The cups (#53, Q15 ⭐ A): three glasses of different shapes.
 *
 * `halfWidth(h)` is the glass's profile: its inner half-width, as a share of
 * its widest, at height `h` from the foot (0) to the rim (1). It is the one
 * shape both the drawing and the rules read: the glass is drawn from it, and
 * gameplay.js turns it into the level a volume reaches. The glasses are round,
 * so a slice's volume goes as the square of its half-width: the level climbs
 * slowly where the glass is wide and quickly where it is narrow.
 *
 * `height` is the glass's share of the table's height and `aspect` its width
 * over its height, so each glass looks like what it is. Neither changes a rule.
 */
export const CUPS = [
  {
    id: 'straight', name: 'a tea glass', volume: CUP_VOLUME, height: 0.66, aspect: 0.52,
    halfWidth: () => 1
  },
  {
    // A wide belly low down, a waist at 80 % of the height, a slight flare at the rim.
    id: 'tulip', name: 'a tulip glass', volume: CUP_VOLUME, height: 0.78, aspect: 0.6,
    halfWidth: h => 1 - 0.42 * Math.sin(Math.PI * h / 1.6)
  },
  {
    // The foot half as wide as the rim, widening evenly.
    id: 'bowl', name: 'a wide bowl', volume: CUP_VOLUME, height: 0.5, aspect: 1.5,
    halfWidth: h => 0.5 + 0.5 * h
  }
];

/**
 * The strengths a guest can ask for: the share of the cup that is brew.
 * Shown as a colour swatch (with a word under it for the colour-blind).
 */
export const STRENGTHS = [
  { id: 'light', word: 'Light', ratio: 0.25 },
  { id: 'golden', word: 'Golden', ratio: 0.40 },
  { id: 'amber', word: 'Amber', ratio: 0.55 },
  { id: 'dark', word: 'Dark', ratio: 0.70 }
];

/**
 * The colour of tea by its brew ratio, 0 (hot water) to 1 (pure brew).
 * Stops are [ratio, [r, g, b]]; the colour between two stops is linear.
 * Chosen so the four strengths above sit on clearly different colours.
 */
export const COLOUR_STOPS = [
  [0.00, [246, 236, 206]],
  [0.25, [236, 196, 110]],
  [0.40, [214, 146, 44]],
  [0.55, [168, 92, 20]],
  [0.70, [112, 52, 12]],
  [1.00, [52, 22, 6]]
];

/** The fill band: a cup is full when its level is at least this share of the brim. */
export const FULL_FROM = 0.9;
/** Below this share of the brim, a cup is short by two stars. */
export const SHORT_FROM = 0.75;

/** Strength bands: the largest gap between poured and wanted ratio for 3, 2 and 1 stars. */
export const STRENGTH_BANDS = [0.05, 0.10, 0.17];

/** How long a cup's result stays up before the next guest comes, in ms. */
export const RESULT_MS = 1800;

/** The one key this game writes. */
export const BEST_KEY = 'studio_samovar_best';
