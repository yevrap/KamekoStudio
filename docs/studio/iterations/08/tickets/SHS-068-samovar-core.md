# SHS-068 — Samovar: pour tea for an evening of guests, the core mechanic playable on a phone

- **Status:** Ready
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

- [ ] `studio/games/samovar/` is a playable page (native ES modules split by concern, the
      studio convention) linked from the realm's shelf as `PROTOTYPE`, with a blurb that says
      what it is and what it is testing.
- [ ] **An evening** is 10 guests, one at a time. Each guest brings a cup of one of at least
      three sizes and wants a strength shown as a colour swatch (pale gold to dark amber)
      next to the cup, at least four strengths in use.
- [ ] **One thumb, one button.** Holding the pour button pours brew; releasing stops it. The
      next hold pours hot water; releasing it serves the cup. The button is at least 44 px,
      in the bottom third, with `touch-action: none` and pointer events.
- [ ] **What you see is the ratio.** The liquid's colour is the mix of brew and water poured
      so far; its level is their total against the cup's volume. Pour rates come from
      elapsed real time, not frames (Active rule 9), so a 120 Hz screen pours at the same
      speed as a 60 Hz one.
- [ ] **Judging a cup:** overflowing the brim spills (the cup scores 0 and says so);
      otherwise 0–3 stars from strength (the gap between poured and wanted ratio) and fill
      (a band just under the brim). The result shows for a moment with the wanted and the
      poured colour side by side, then the next guest comes.
- [ ] **End of evening:** total stars, the best evening so far (saved as
      `studio_samovar_best`; no other key, and every key under `studio_samovar_`), and a
      *Pour again* button that starts a new evening at once.
- [ ] **Teach in the game:** the first screen says in two lines what to do; nothing else
      needs explaining.
- [ ] Plays at 320×640 and 390×780 with nothing clipped or overlapping, the cup, swatch and
      button all visible without scrolling; light and dark themes both read.
- [ ] Pauses when the page is hidden (a pour in progress stops) and resumes on return.
- [ ] A browser test (`tests/studio/samovar.test.mjs`) drives the core loop: a full evening
      of 10 cups by real pointer holds, a spill scores 0, a pour matched to the wanted ratio
      and fill scores 3, the best evening persists across a reload under `studio_samovar_best`,
      and layout boxes at both widths.
- [ ] A design note, `docs/studio/games/samovar.md`: what it is, the hook, the hypothesis,
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

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
