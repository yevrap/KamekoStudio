# Iteration 06 — review

**Verdict:** Approve with findings (Independent Reviewer, `fable`, round 1 of 1)

QA (`opus`, round 1 of 1): **Approve with findings.** Neither pass rejected, so there is no
second round (direction rule 3).

## In plain words

The studio's copy of River Run now has its first experiment: a shield and a spread shot
float down the river one at a time, and the boat picks them up by touching them. The same
sprint fixed a bug in the copy where restarting a run could leave the river frozen, and
made every studio ticket number in the docs a link to that ticket's file. Two independent
reviewers approved with findings; the one new problem a player would hit (fast taps with
the spread shot sometimes fired nothing) was fixed before this close. The reviewers also
found that the arcade's own River Run has the same freeze on restart, which is now queued
in both the arcade's bug lane (p0-17) and the studio's next plan (#33). You are asked for a
Keep / Iterate / Kill on the power-ups below: epic E1 needs your verdict on one experiment
before it can finish.

## Demo

- **The fork:** https://yevrap.github.io/KamekoStudio/studio/games/river-run/ (or the River
  Run portal on https://yevrap.github.io/KamekoStudio/3d.html).
  1. Start a run. About 5 s in, a glowing shape floats down the river: a cyan one is the
     shield, a pink one the spread shot. Steer into it.
  2. **Shield:** a bubble follows the boat and the HUD under the score reads `🛡 SHIELD`.
     Hit a rock or a log: it bursts instead of ending the run, and the bubble goes.
  3. **Spread shot:** for about 6 s every shot is three, fanned left, straight and right,
     and the HUD counts down `✦ SPREAD 4.7s`. Tap FIRE fast; every tap fires.
  4. Die and restart many times in a row: every run starts, and the music comes back.
  5. Try ▶ Watch: the auto-boat picks power-ups up when they come its way.
- **Linked ticket numbers:** open any studio doc on GitHub, for example
  [the plan](plan.md) or [the backlog](../../steering/backlog.md): every `SHS-NNN` is a link
  to its ticket.

## Keep / Iterate / Kill

> The executive: strike through what you disagree with. These are the team's.

- **[SHS-060](tickets/SHS-060-river-run-power-ups.md), power-ups on the river — Iterate.**
  Both work and change how a run feels, but on a narrow phone their HUD sits over the
  score (#35), and their timers count frames, so on a 120 Hz phone "6.0s" lasts 3 s (QA F5).
  Sprint 07 would fix the layout and, on your Keep, tune them from your play. A **Kill**
  removes both and returns the fork to the arcade's gameplay.
- **[SHS-061](tickets/SHS-061-river-run-tone-start-time.md), restart never freezes the
  fork — Keep.** A real freeze, reproduced and fixed. Its test catches a regression only
  most of the time; #37 makes it deterministic, and production's twin is #33 / p0-17.
- **[SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md), ticket numbers link —
  Keep.** 378 mentions linked, and the retro keeps new ones linked. Seven Markdown shapes it
  would mislink are named in its lib (none is in the repo); guarding them is #36.

## What was reviewed

The sprint 06 studio commits, `5bccbd0`…`e77e87d`:
[SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md) (ticket numbers in the docs
link to their files, plus the arcade `docs:` commit `c98e8b2` carrying its two arcade
links), [SHS-060](tickets/SHS-060-river-run-power-ups.md) (the shield and spread shot in
the River Run fork), [SHS-061](tickets/SHS-061-river-run-tone-start-time.md) (the fork's
music restart no longer freezes a run), and
[SHS-062](tickets/SHS-062-iteration-record.md)'s records. Out of scope: the arcade's p0-16
(`85726fc`) and sprint 05's close and retro commits, reviewed with sprint 05. There is no
ADR-0008 production fix this sprint, so no `reviews/<TICKET>.md`.

Each reviewer ran with fresh context in its own throwaway clone and made no change to the
repository.

- **Independent Reviewer.** `node --test tests/studio/` 349/349, `npm test` 820/820,
  path-guard on the real range (9 studio, 2 arcade commits). A dry run of the link script
  links nothing, so a second run changes nothing. Probed the linker with 17 Markdown shapes,
  mutation-tested [SHS-061](tickets/SHS-061-river-run-tone-start-time.md)'s regression test (the fix reverted, 7 runs), ran the same
  20-restart loop against production River Run, measured the power-up HUD at 390 and 320
  wide, and confirmed the live fork serves `HEAD`.
- **QA.** Walked every criterion of [SHS-059](tickets/SHS-059-ticket-mentions-link-to-tickets.md) (7/7), [SHS-060](tickets/SHS-060-river-run-power-ups.md) (7/7) and [SHS-061](tickets/SHS-061-river-run-tone-start-time.md) (3/3). It
  used `node --test tests/studio/` 349/349, `npm test` 820/820 and `--stage=ticket` 5/5,
  and played the fork in headless Chrome at 375×667: natural pickups, a real rock on the
  shield, the spread timer against the wall clock (360 frames in 6005 ms), the drawer's
  pause, mute, 45 s of Watch Mode, and 30 restarts after real collisions. It logged every
  storage write (only `studio_riverRun_*`, plus `settings.js`'s two token removals) and
  confirmed the live fork is byte-identical to `HEAD`. It did not run `smoke` or `e2e`.

## Findings and what became of them

| # | Finding | Severity | Became |
|---|---|---|---|
| QA F1 | With the spread shot active, fast FIRE taps (7–10 a second) ran the 30-shot pool dry. Each volley takes three shots, and the side shots flew on past the bank for about 2 s, so up to a third of taps fired nothing | player-facing, minor | **Fixed now (S)**, `8a7a604`: the pool is 90, and a shot past the river bank goes back to it. The spread subtest fires a 25-volley burst (red at 30, green at 90) and follows a side shot off the river |
| IR 1 | Production River Run (`games/river-run/index.html`, the gallery's build) freezes on restart. `musicSequence.stop()` throws, `initGame` aborts, and since the sequence is never disposed every later restart freezes too, until reload (the first freeze came at restart 13, then 28 of 39). Pre-existing, and already fixed in the fork | player-facing, production | **Backlog #33** reworded: the freeze lasts until reload, and #33 goes first in sprint 07's plan. **Arcade roadmap 🐞 p0-17** (`6911474`, arcade `docs:`) so the arcade's fix lane can take it too; whichever ships first closes both |
| IR 2 · QA F2 | At 320 and 375 wide, the score wraps to two lines and the power-up HUD covers its number from below while a power-up is active. [SHS-060](tickets/SHS-060-river-run-power-ups.md)'s evidence used only 390 wide | player-facing, minor | **Backlog #35** widened: the score, the HUD and the controls must not overlap each other |
| IR 3 · QA F4 | The link script's lib claimed that a misread could only leave a mention plain or link it harmlessly. Seven shapes get a broken link written into them (wrapped link text, a shortcut reference, a reference title, an indented code block, an HTML attribute, CRLF frontmatter, a title after frontmatter). None is in the repo today | process | **Fixed now (docs)**, `c361b17`: the header names the shapes and says to read the dry run. Guarding or parsing them is **backlog #36** |
| IR 4 · QA F3 | [SHS-061](tickets/SHS-061-river-run-tone-start-time.md)'s regression test catches a reverted fix only by chance: red 6 of 7 runs (IR), 4 of 6 (QA) | process, test strength | **Backlog #37** (S, Ready): a deterministic case that makes `Sequence.stop()` throw on a stopped Transport. #33 reuses it |
| IR 5 | [SHS-061](tickets/SHS-061-river-run-tone-start-time.md)'s first criterion names a Tone start time, but the throw was `Sequence.stop()` | nit | **Declined.** The ticket says so itself, and the substance of the criterion is met |
| QA F5 | The HUD's seconds are frames ÷ 60, so on a 120 Hz phone "6.0s" lasts 3 s | nit | **Declined for now.** The whole game counts frames, and this predates the sprint. Noted for the executive's Keep / Iterate / Kill on the power-ups |

## Also in this step

`p0-17` is an arcade `docs:` commit made by a studio session, the route the executive set at
sprint 05's review: a docs-only change, in its own commit, about the studio's own work.

## What a second round would likely have found

None is due. Neither pass rejected. The one serious player-facing defect is in production,
predates the sprint and is queued twice (studio #33, arcade p0-17). The fork's one new
player-facing defect is fixed, and no save or production file changed.
