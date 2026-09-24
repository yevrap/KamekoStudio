// Samovar — tuning. Every number the game decides with is here.
//
// Volumes are in abstract units; a pour adds POUR_RATE units per second of
// real time, brew and water alike. Nothing here is in pixels or frames.

/** Units per second, for both liquids. Real time, never frames (Active rule 9). */
export const POUR_RATE = 80;

/** Guests per evening. */
export const EVENING_LENGTH = 10;

/**
 * The cups. `height` and `width` are fractions of the stage, so the cup that
 * holds more also looks bigger, which is the only size cue the player gets.
 */
export const CUPS = [
  { id: 'small', name: 'a small cup', volume: 120, height: 0.40, width: 0.36 },
  { id: 'medium', name: 'a teacup', volume: 180, height: 0.56, width: 0.40 },
  { id: 'tall', name: 'a tall glass', volume: 260, height: 0.80, width: 0.30 }
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
