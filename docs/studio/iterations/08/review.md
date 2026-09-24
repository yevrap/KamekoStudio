# Iteration 08 — review

**Verdict:** Approve with findings (Independent Reviewer, `opus`, round 1 of 1)

QA (`sonnet`, round 1 of 1): **Verdict:** Approve. Every claim in the Result sections of
[SHS-068](tickets/SHS-068-samovar-core.md), [SHS-069](tickets/SHS-069-river-run-power-ups-read-at-a-glance.md) and [SHS-070](tickets/SHS-070-checks-accept-studio-branches.md) reproduced against the code and real local runs, and QA found
no defect. Playtester (`opus`): **Iterate** on Samovar, **Keep** on the River Run fork's
pickups. Neither reviewer rejected, so there is no second round.

The Independent Reviewer ran on `opus`, the model the builds used (ADR-0011), so its
independence was of context only. QA, on `sonnet`, was the round's different-model pass.
The sprint changed no production file, so there is no `reviews/<TICKET>.md` record.

## In plain words

The studio made its first game of its own, *Samovar*: you pour tea for ten guests, holding
one button to pour the dark brew and again to top up with hot water, and the tea's colour
has to match the one each guest asked for. The studio's copy of River Run now shows its
power-ups glowing far up the river, so a player can steer for one instead of spotting it
too late, and the label under the score stays the same height. The studio's checks also
now accept a separate branch for each ticket, the first step toward work going through
pull requests. The reviewers approved everything. They found that Samovar's cups don't
change the decision the way the design said, and fixed two small bugs straight away. The
Playtester kept the River Run change and asked for another pass on Samovar: the idea works,
but going a hair over the brim costs the whole cup, and a first evening scored nothing.

## Demo

- **Samovar:** https://yevrap.github.io/KamekoStudio/studio/games/samovar/ (on the realm's
  shelf as `PROTOTYPE`). Hold *Hold to pour the tea*, let go; hold again to add hot water,
  let go to serve. Match the colour swatch and stop between the dashed line and the brim.
  After ten guests you see the evening's stars and your best evening, then *Pour again*.
- **The River Run fork:** https://yevrap.github.io/KamekoStudio/studio/games/river-run/
  (or the River Run portal on https://yevrap.github.io/KamekoStudio/3d.html). A pickup
  far up the river glows its colour (pink is the spread shot, cyan the shield). The label
  under the score stays one height with the shield, the spread shot or both.
- **For the reader:** the branch check `on-branch` ([SHS-070](tickets/SHS-070-checks-accept-studio-branches.md)) in
  [self-checks.md](../../self-checks.md).

## Keep / Iterate / Kill

> Since [ADR-0011](../../decisions/ADR-0011-the-studio-runs-itself.md) the Playtester's
> verdict is the one the team acts on. The executive may strike it and write their own;
> theirs overrides. Given at this review (2026-09-24), from a local build at phone width.

- **[SHS-068](tickets/SHS-068-samovar-core.md), Samovar's core loop — Iterate** (Playtester). Five full
  evenings on fresh profiles with real touch on the pour button, three at 390×780 and two
  at 320×640. It also tried *Pour again*, a reload, the realm card, ← Studio, Space on the
  button, sliding a finger off, and hiding the tab mid-pour. No console errors. **What
  works:** the loop reads at once. The dark brew goes in, then the water lightens the tea
  live, then the result shows the wanted and poured colours side by side with 1–3 stars. It
  fits one screen at both widths. A hidden tab stops and holds the pour. The best evening
  survives a reload. The tea-glass theme fits the brief's call for warmth. Once the player
  anticipates the stop it becomes a real skill curve: 5 → 24 of 30 at 390, 0 → 21 at 320.
  **What gets in the way:** (1) the brim is a cliff. Any overfill, even to 1.01, is
  "Spilled — no stars", including cups whose colour matched exactly. A first evening with
  an ordinary 150–200 ms release lag scored 0 of 30 at both widths. (2) Everything pours at
  80 units a second, so the small cup fills in 1.5 s and its three-star window is about
  ±60 ms; a tall glass gives about twice as long. Small things: the result card covers the
  tall glass's top, so the overshoot that cost the stars can't be seen; a first best above
  0 isn't celebrated; the best evening only shows at the end; an evening lasts about a
  minute, short of the brief's 5–10 minute session. **Its next step:** a forgiving brim
  (**backlog #51**), the same fill time for every cup and a result card clear of the rim
  (**#52**), the best on the first screen (**#54**). Together with IR08-1 below, #52 needs
  **#53** so the cups still differ.
- **[SHS-069](tickets/SHS-069-river-run-power-ups-read-at-a-glance.md), River Run fork pickups read at a glance — Keep**
  (Playtester). Touch-drag steering and taps on FIRE at 390×780 (two runs to game over,
  a restart, a 100 s Watch run) and at 320×640 (two 120 s runs, one to game over), fresh
  profiles, no console errors. Each pickup appears about 40 units up the river with its
  halo already at full brightness, pink for the spread and cyan for the shield. Both read
  at a glance against the dark river and look nothing like the rocks or crates. Up close
  the glow fades into the solid shape with no double image. The first one arrives about
  5 s into a run. A steering bot collected 6 of 8 and 8 of 8 over two 2-minute runs at 320.
  The label measured 26 px tall in every frame logged, with the shield, the spread, or
  both on one line at 320, and the score above it never moved. *A note, not a verdict:*
  the realm's River Runner card still reads *Iteration 07*, which `close` updates with the
  shelf entries.

[SHS-070](tickets/SHS-070-checks-accept-studio-branches.md) can't be played, so it has no verdict.

### For the executive, on a real phone

The Playtester could not answer these from headless Chrome:

1. Samovar: can a real thumb stop the small cup between the dashed line and the rim
   (about 150 ms), and hit the colour (about ±60 ms for three stars)? Headless timing can't
   account for touch latency or a thumb covering the cup.
2. Samovar: are Golden and Amber different enough on your screen in normal light, and does
   an evening of about a minute feel like a session or too short?
3. River Run: is the far-off glow still visible on a bright phone screen outdoors?

## What was reviewed

The sprint's diff, `studio-iteration-07..9dcd45b`: [SHS-068](tickets/SHS-068-samovar-core.md) (`8a351b7`), [SHS-069](tickets/SHS-069-river-run-power-ups-read-at-a-glance.md)
(`9c00a38`), [SHS-070](tickets/SHS-070-checks-accept-studio-branches.md) (`4b8dd72`) and [SHS-071](tickets/SHS-071-iteration-record.md)'s records. No path outside
`studio/`, `docs/studio/` and `tests/studio/` changed. Each reviewer worked from a local
server and made no change to the repository.

- **Independent Reviewer.** Played Samovar in headless Chrome at 320 and 390 wide, with a
  real touchscreen hold (500 ms poured 42.6 units and moved the phase to water), checked
  the header against the settings button, and did the pour arithmetic behind IR08-1 and
  IR08-2. It reproduced IR08-3 and IR08-4 with its own probe. It looked at a far-off rapid
  pickup 50 units away, and checked the exemption hash and the glow's disposal. It did not
  re-run the counted suites (samovar 14/14, the fork's section 6, branch-check 18/18), as
  retro 07 asked.
- **QA.** Checked the code, tests and process claims of all three tickets against a real
  local run and its own reproduction.

## Findings and what became of them

| # | Finding | Severity | Became |
|---|---|---|---|
| IR08-1 | The design says a cup's size is the cue for how long to pour the brew. Every cup has one shape and its level is volume over the cup's, so a three-star brew stops at the same share of every cup's height (about half-way for Amber). The ratio isn't hidden, and the decision is to stop at an imagined line, close to the fill-to-a-line genre the hook set out to differ from | player-facing (design claim) | **Fixed now** in the [design note](../../games/samovar.md) (the hook and the Cups row say what the review found). The design change is **backlog #53** on **[Q15](../../steering/questionnaire.md)** (⭐ A: cups of different shapes, so the stop sits at a different height in each). It is tied to #52, which on its own would make the cups identical |
| IR08-2 | The fill band doesn't make the water "the lesser skill". It is 10 % of the cup, as long in time as the three-star brew window (about 150 / 225 / 325 ms), and a miss over the brim costs every star while a strength miss costs one per band | player-facing (tuning claim) | **Fixed now** in the design note's Fill line row. The change is **backlog #51** (a forgiving brim), which the Playtester's Iterate asks for too |
| IR08-3 | Hiding and showing the page while the settings drawer is open unpaused Samovar behind the drawer: the result timer ran out and the next guest came with the drawer still open | player-facing, low | **Fixed now**, `14d4db8`: the hidden page and the open drawer each hold the evening and let go only of their own hold. A browser test, red first (phase `brew` where `result` was expected), then green |
| IR08-4 | The pour button is disabled during each result card, which drops focus to the page, so a keyboard player had to Tab back before every guest | player-facing, low (keyboard) | **Fixed now**, `14d4db8`: the button gets the keyboard's focus back with the next guest (not while the drawer is open). A browser test holding Space for two guests with no Tab, red first (focus on `body`), then green. Samovar suite 16/16 |
| IR08-5 | `studio/README.md` said a cup short of the dashed line loses one star; below three quarters of the brim the code takes two | nit | **Fixed now**, `14d4db8`: the README gives both rules, as the design note does |
| IR08-6 | On a ticket branch, `on-branch`'s pass detail says *(unpushed)* whenever the branch is ahead of `origin/main`, which is always true of a pushed branch waiting for its merge | nit (process) | **Fixed now**, `fd3cc18`: a ticket branch reads *(not merged into main yet)*; *(unpushed)* stays for `main`. One case in `branch-check.test.mjs`, red first, then 19/19 |
| IR08-7 | `SQUASH_SUFFIX_RE` strips any trailing ` (#N)`, so a commit made straight on `main` could add a made-up suffix and pass `commit-lint` at up to 85 characters | nit (process) | **Declined.** The lint is a style check on subjects the team writes, not a boundary against an adversary, and the slack is at most the suffix's length. Telling a real squash-merge from a hand-written suffix would mean asking GitHub about each commit, which the push stage shouldn't depend on. Revisit if #50's first real pull request shows a reason |
| IR08-8 | No defect: [SHS-069](tickets/SHS-069-river-run-power-ups-read-at-a-glance.md)'s glow is its own scene object, the pickup box is unchanged and the glow is disposed; [SHS-070](tickets/SHS-070-checks-accept-studio-branches.md)'s exemption is the full hash; no production path changed; Samovar's header clears the settings button at 320 and 390; a real touch hold pours | — | Recorded |
| Playtester | Samovar: the brim is a cliff, small cups are about twice as hard, the result card hides the tall glass's top, a first best isn't celebrated, the best shows only at the end, an evening lasts about a minute | player-facing | **Backlog #51, #52, #54** (Ready), **#53** with Q15. The evening's length is the second layer's question (sprint 10, per the epic) |
| Playtester | The realm's River Runner card still reads *Iteration 07* | record | **Already covered:** `close` updates the shelf entry of every game the sprint changed |

## What a second round would likely have found

None is due: neither reviewer rejected, no production file changed and no save changed. A
second round would most likely have re-read `14d4db8`. The focus rule assumes that
disabling a button drops focus to `body`, and that a pointer hold doesn't leave the button
focused, so the next guest wouldn't pull focus on touch. It would also have checked that
the design note's corrections match the reviewer's arithmetic.
