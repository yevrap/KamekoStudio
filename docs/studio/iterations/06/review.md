# Iteration 06 — review

**Verdict:** Approve with findings (Independent Reviewer, `fable`, round 1 of 1)

QA (`opus`, round 1 of 1): **Approve with findings.** Neither pass rejected, so there is no
second round (direction rule 3).

## In plain words

*Written at close.*

## Demo

*Written at close.*

## Keep / Iterate / Kill

*Written at close.*

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
  mutation-tested SHS-061's regression test (the fix reverted, 7 runs), ran the same
  20-restart loop against production River Run, measured the power-up HUD at 390 and 320
  wide, and confirmed the live fork serves `HEAD`.
- **QA.** Walked every criterion of SHS-059 (7/7), SHS-060 (7/7) and SHS-061 (3/3). It
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
| IR 2 · QA F2 | At 320 and 375 wide, the score wraps to two lines and the power-up HUD covers its number from below while a power-up is active. SHS-060's evidence used only 390 wide | player-facing, minor | **Backlog #35** widened: the score, the HUD and the controls must not overlap each other |
| IR 3 · QA F4 | The link script's lib claimed that a misread could only leave a mention plain or link it harmlessly. Seven shapes get a broken link written into them (wrapped link text, a shortcut reference, a reference title, an indented code block, an HTML attribute, CRLF frontmatter, a title after frontmatter). None is in the repo today | process | **Fixed now (docs)**, `c361b17`: the header names the shapes and says to read the dry run. Guarding or parsing them is **backlog #36** |
| IR 4 · QA F3 | SHS-061's regression test catches a reverted fix only by chance: red 6 of 7 runs (IR), 4 of 6 (QA) | process, test strength | **Backlog #37** (S, Ready): a deterministic case that makes `Sequence.stop()` throw on a stopped Transport. #33 reuses it |
| IR 5 | SHS-061's first criterion names a Tone start time, but the throw was `Sequence.stop()` | nit | **Declined.** The ticket says so itself, and the substance of the criterion is met |
| QA F5 | The HUD's seconds are frames ÷ 60, so on a 120 Hz phone "6.0s" lasts 3 s | nit | **Declined for now.** The whole game counts frames, and this predates the sprint. Noted for the executive's Keep / Iterate / Kill on the power-ups |

## Also in this step

`p0-17` is an arcade `docs:` commit made by a studio session, the route the executive set at
sprint 05's review: a docs-only change, in its own commit, about the studio's own work.

## What a second round would likely have found

None is due. Neither pass rejected. The one serious player-facing defect is in production,
predates the sprint and is queued twice (studio #33, arcade p0-17). The fork's one new
player-facing defect is fixed, and no save or production file changed.
