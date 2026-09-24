# Iteration 07 — review

**Verdict:** Approve with findings (Independent Reviewer, `opus`, round 1 of 1)

QA (`sonnet`, round 1 of 1): **Approve with findings.** Playtester (`opus`): **Keep** on both
player-visible items. Neither pass rejected, so there is no second round.

The Independent Reviewer ran on the same model as the builds (`opus`, ADR-0011): its
independence was of context only. QA, on `sonnet`, was the round's different-model pass.
The two agreed on the one finding they share (IR-1 · QA F1).

## In plain words

The studio's copy of River Run now keeps the score on one line and readable on a small
phone, with the power-up label in a place of its own, and the spread shot's "6.0s" counts
real seconds on any screen. The arcade's own River Run no longer freezes when you restart
it: the fix the studio proved in its copy last sprint was applied to the gallery's build,
reviewed before it was pushed, and restarted 80 times in a row without a freeze. The studio
can also now change its own skills and its sprint conductor in a ticketed commit, so a
retro's lesson can land in the files that run the team. Two reviewers approved with small
findings, all fixed or queued in this review. The Playtester played both games at phone
width and kept both changes.

## Demo

- **The fork:** https://yevrap.github.io/KamekoStudio/studio/games/river-run/ (or the River
  Run portal on https://yevrap.github.io/KamekoStudio/3d.html).
  1. Start a run and steer into a glowing pickup (cyan is the shield, pink the spread shot).
  2. The score stays on one line under the top buttons, and the power-up label sits in its
     own dark pill just below it, clear of "← Studio", Mute and ☰, at any phone width.
  3. With the spread shot, "✦ SPREAD 6.0s" counts down about once a second, on a 60 Hz or
     a 120 Hz screen. Open the ☰ drawer mid-spread: the timer waits for you.
- **The arcade's River Run:** https://yevrap.github.io/KamekoStudio/games/river-run/ (the
  gallery's build). Die and restart as often as you like, quickly or slowly: every run
  starts, and the music comes back.
- **For the reader:** [guardrails.md](../../guardrails.md) lists the studio's skills
  (`.claude/skills/studio-*/**`) and its conductor as a recorded exception for ticketed
  studio commits ([SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md)).

## Keep / Iterate / Kill

> Since [ADR-0011](../../decisions/ADR-0011-the-studio-runs-itself.md) the Playtester's
> verdict is the one the team acts on. The executive may strike it and write their own;
> theirs overrides. Given at this review (2026-09-23), from a local build at phone width.

- **[SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md), the fork's power-up HUD
  and real-second timers — Keep** (Playtester). Six full runs, three at 390×780 and three
  at 320×640, each on a fresh profile with real keys and taps, each ending in game over and
  a restart. The score stayed on one line throughout (its box 29 px tall at both widths),
  the label sat in its own pill just under it, the two never overlapped, and there was no
  sideways scroll. The longest label, "🛡 SHIELD   ✦ SPREAD 6.0s", is 267 px wide and fits
  at 320. The countdown ran at wall-clock speed in every window measured (ratio 1.00),
  including with the frame rate forced to about 29 and about 133 fps; the drawer held it
  for 3 s. No console errors. *Two notes, neither a reason to hold it:* the pill is 5 px
  taller with the shield's emoji in it, so it shifts as power-ups come and go
  (**backlog #44**); and the spread's own shots are still tiny yellow dots far down the
  river, so the label explains the power-up better than the shots show it (**backlog #45**).
- **[SHS-066](tickets/SHS-066-production-river-run-restart.md), the arcade's River Run
  restarts never freeze (p0-17) — Keep** (Playtester). From the gallery link on a fresh
  profile, unmuted, 10 back-to-back runs at 390×780 and 10 at 320×640: long and short runs,
  deliberate rams, a restart tapped the instant game over appeared, a double tap on
  Restart. Every one of the 20 restarts had the river moving within 3 s with the music's
  transport running. Back to the gallery and forward again, then start: moving, with
  music. Left muted, 3 restarts all moved, and unmuting mid-run brought the music in. Watch
  Mode ran. No console errors. The freeze did not happen once.

[SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md) can't be played, so it has no
verdict.

### For the executive, on a real phone

The Playtester could not answer these from headless Chrome:

1. Does the arcade River Run's music really play after the 5th or 10th restart on an
   iPhone, including from the home-screen app? The browser reported the music running and
   unmuted every time, but it has no speakers.
2. On a 120 Hz phone, is the 6-second spread still worth grabbing? Its label counts real
   seconds now, but the river itself still moves per frame, so on a fast screen the river
   runs about twice as fast and a spread gives fewer shots. That is **backlog #46** (the
   rest of the fork on real time).

## What was reviewed

The sprint's diff, `studio-iteration-06..HEAD` before this review: [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md) (`fee743d`),
[SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md) (`1209d09`), [SHS-066](tickets/SHS-066-production-river-run-restart.md)'s production fix (`1414dab`) and its arcade `docs:`
commit (`61e69c6`, roadmap p0-17 ✅), and [SHS-067](tickets/SHS-067-iteration-record.md)'s records. The production fix has its own
record, [reviews/SHS-066.md](reviews/SHS-066.md), and was pushed only after it, through
`--stage=push`. Each reviewer worked from a local server and made no change to the
repository.

- **Independent Reviewer.** On a scratch copy, [SHS-066](tickets/SHS-066-production-river-run-restart.md)'s deterministic cases were red 3 of
  3 against the unfixed file; at `HEAD`, 40 restarts in each of two fresh browser contexts
  on both River Run builds, none froze, no page errors (80 of 80 on the arcade's).
  [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md)'s layout held at 10 viewports from 320×568 to 1280×800, landscape included,
  light and dark, with 4- and 6-digit scores (40 cases). [SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md)'s rename case is covered
  (`--name-status -M`). `npm test` 840/840, `npm run e2e` 29/29, the fork's test file
  green, `--stage=push` 10 of 11 (the one red was `production-fix-reviewed`, expected before
  this record).
- **QA.** Verified the code, tests and process claims of all three tickets against a real
  local run and its own reproduction.

## Findings and what became of them

| # | Finding | Severity | Became |
|---|---|---|---|
| IR-1 · QA F1 | [SHS-066](tickets/SHS-066-production-river-run-restart.md) was Done with its first criterion unticked, though the code meets it, and kept the template's "Empty until then" line above a filled-in Result; `docs-current` would fail the gate | process | **Fixed now** (this review's record commit): criteria 1 and 5 ticked, the placeholder removed |
| IR-2 | The Independent Reviewer's role file said it must run on a different model from the author; the conductor runs it on `opus`, the builds' own model | process | **Fixed now** (the studio's half): [independent-reviewer.md](../../team/independent-reviewer.md) now says what ADR-0011 does — independence of context, with QA on `sonnet` as the different-model pass — and that each review says when two passes shared a model (this one does, above). Whether the reviewer *should* run on another model is the executive's, in ADR-0011 and the conductor; not changed here |
| IR-3 | The production fix ships without a `version.json` bump, so a player with the arcade already open isn't offered "New version available". A studio commit can't make the bump under the path guard; SHS-052 had the same gap | production, low | **Backlog #43**, with **Q13** in the [questionnaire](../../steering/questionnaire.md) (⭐ a production-fix ticket may list and bump `version.json`). It touches the arcade's release marker, so it waits for a tick. The arcade roadmap's p0-17 row said "pushed after its independent review" before the push; it is true from this review's push |
| IR-4 | Below 10 fps the 0.1 s cap per update slows the spread timer: at 8 fps "6.0s" lasts about 8 s. The cap is deliberate, but the ticket's Result didn't say so | nit | **Fixed now** (docs): [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md)'s Result states the limit with the reviewer's numbers |
| IR-5 | `#score` and `#power-hud` kept `z-index: 5` after moving into `#hud-stack`, where it does nothing | nit | **Fixed now**, `0d1f540`: both lines removed. The fork's test file 25/25 (layout subtests included), `--stage=ticket` 5/5 |
| IR-6 | No defect: the reviewer's own probes beyond the tickets' evidence (listed above) | — | Recorded |
| Playtester | Pill height shifts 5 px with the shield's emoji; spread shots are tiny far down the river; the river runs faster on a 120 Hz screen | player-facing, minor | **Backlog #44** (Ready), **#45**, **#46** |

## What a second round would likely have found

None is due: no pass rejected, the production fix was approved as it stands, and no save
changed. A second round would most likely have re-read `0d1f540` (two CSS lines, covered by
the layout subtests) and checked the role file's new wording against ADR-0011.
