# SHS-068 — Samovar: pour tea for an evening of guests, the core mechanic playable on a phone

- **Status:** Done
- **Size:** M
- **Iteration:** 08
- **Role lead:** Game Designer (Frontend Developer builds)
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

E2 ([Direction](../../../steering/direction.md), *Current epic*) asks for the studio's first
original game worth playing, core mechanic first. Of the three pitches in
[plan.md](../plan.md#three-pitches), Q14's ⭐ is *Samovar*; this ticket builds its core
loop only (backlog #48).

## Design hypothesis (recorded before the build)

Tea is strong or weak by its ratio, not its amount. The player pours the dark brew first
and then tops the cup up with hot water to the brim, so the only real decision is **how
long to pour the brew for this cup's size**: a tall glass needs a long first pour, a small
cup a short one, and once the water goes in the strength is fixed. Each cup is a
two-second estimate whose result shows at once as a colour. **It is fun if** a player's
misses shrink over an evening (they can see the estimate improving) and they start a
second evening straight away. **It is not** if the cups feel random or the colour match
can't be read at a glance on a phone.

What is new against the genre (pour-the-drink phone games fill a glass to a line): two
liquids, a hidden target ratio, and a brim that punishes both too much brew and too little.

## Acceptance criteria

- [x] `studio/games/samovar/` is a playable page (native ES modules split by concern, the
      studio convention) linked from the realm's shelf as `PROTOTYPE`, with a blurb that says
      what it is and what it is testing.
- [x] **An evening** is 10 guests, one at a time. Each guest brings a cup of one of at least
      three sizes and wants a strength shown as a colour swatch (pale gold to dark amber)
      next to the cup, at least four strengths in use.
- [x] **One thumb, one button.** Holding the pour button pours brew; releasing stops it. The
      next hold pours hot water; releasing it serves the cup. The button is at least 44 px,
      in the bottom third, with `touch-action: none` and pointer events.
- [x] **What you see is the ratio.** The liquid's colour is the mix of brew and water poured
      so far; its level is their total against the cup's volume. Pour rates come from
      elapsed real time, not frames (Active rule 9), so a 120 Hz screen pours at the same
      speed as a 60 Hz one.
- [x] **Judging a cup:** overflowing the brim spills (the cup scores 0 and says so);
      otherwise 0–3 stars from strength (the gap between poured and wanted ratio) and fill
      (a band just under the brim). The result shows for a moment with the wanted and the
      poured colour side by side, then the next guest comes.
- [x] **End of evening:** total stars, the best evening so far (saved as
      `studio_samovar_best`; no other key, and every key under `studio_samovar_`), and a
      *Pour again* button that starts a new evening at once.
- [x] **Teach in the game:** the first screen says in two lines what to do; nothing else
      needs explaining.
- [x] Plays at 320×640 and 390×780 with nothing clipped or overlapping, the cup, swatch and
      button all visible without scrolling; light and dark themes both read.
- [x] Pauses when the page is hidden (a pour in progress stops) and resumes on return.
- [x] A browser test (`tests/studio/samovar.test.mjs`) drives the core loop: a full evening
      of 10 cups by real pointer holds, a spill scores 0, a pour matched to the wanted ratio
      and fill scores 3, the best evening persists across a reload under `studio_samovar_best`,
      and layout boxes at both widths.
- [x] A design note, `docs/studio/games/samovar.md`: what it is, the hook, the hypothesis,
      and what was cut.

## Evidence plan

The browser test above; `--stage=ticket` (storage keys, studio boot, hygiene); screenshots
at 320 and 390 read back once, not kept in context. The Playtester judges the hypothesis
at review.

## Out of scope

Progression, guest personalities, a tray of several cups, sugar or lemon, sound beyond a
pour hiss (optional), a 3D portal (production, `shared/3d/`), the arcade gallery.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:** a new game, `studio/games/samovar/` (`8a351b7`): `constants.js` (cups
  120/180/260 units, strengths 25/40/55/70 % brew, the colour ramp, 80 units/s pour, star
  bands 5/10/17 points, fill line at 90 %), `gameplay.js` (pure: pour amounts from
  milliseconds, colour by ratio, judging), `state.js` (pure: an evening is 10 of the 12
  cup-and-strength pairs drawn without replacement, so every cup and strength appears and
  no pour is asked twice; the saved best read defensively), `main.js` (the hold, one rAF
  loop, the result and end cards, storage), `index.html`, `style.css`. Pours are timed
  from `performance.now()` at press and release. Hiding the page, a window blur or the
  settings drawer stops a pour without moving the cup on (the next hold carries on with
  the same liquid) and holds the result timer. One key, `studio_samovar_best`, documented
  in `studio/README.md`. Shelf entry `PROTOTYPE` in `studio/shelf-data.js`; design note
  `docs/studio/games/samovar.md`.
- **Tested by:** `tests/studio/samovar.test.mjs`, 14/14 green in 91 s. Pure: every
  cup × strength poured to ratio at 95 % scores 3; over the brim scores 0 (exactly at the
  brim is in); strength and fill each cost stars; the ramp darkens monotonically and the
  four swatches sit ≥ 25 luminance apart; 300 seeded evenings each have 10 guests, all 3
  cups, all 4 strengths, no pair twice; an unreadable best counts as 0. Browser, by real
  pointer holds (puppeteer mouse down/up on the button): a full evening poured to each
  guest's ratio scores 3 on every cup, the end card reads "30 of 30 stars" with *Pour
  again*, the only key written is `studio_samovar_best` (= 30, a seeded production key
  untouched), and it survives a reload; *Pour again* starts guest 1 at once; a brew held
  past the brim spills mid-hold, 0 stars, "Spilled"; a 1 s hold pours 80 ± 6 units with
  frames every 8 ms and every 33 ms; a hidden page stops the pour (brew unchanged over
  500 ms, phase still brew), the next hold carries on, and the result card holds 2.6 s
  while hidden; at 320×640 and 390×780, dark and light, with each cup size, the cup,
  swatch, guest line and button are on screen and don't overlap, the button is ≥ 44 px and
  in the bottom third, no sideways scroll. `--stage=ticket` 5/5 (studio-boot boots the page
  on the generic contract: back link, targets, no-JS text, blocked storage). Screenshots at
  320 (tall glass, light, mid-pour) and 390 (result card, dark) read once by eye. Not shown
  red first: these are new-feature tests, and no mutation run was made.
- **Deferred:** nothing beyond the ticket's out of scope. Studio-boot holds Samovar to the
  generic contract only (no game-specific judge), as it does the River Run fork.
- **Fix rounds used:** 0 / 2
