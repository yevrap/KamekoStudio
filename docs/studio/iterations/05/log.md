# Iteration 05 — stand-up log

Done / next / blocked, per role that acted. One entry per session (ADR-0009), pushed when it
is committed.

## Session 1 — plan (2026-09-22)

- **Scrum Master** — *Done:* preflight green (tree clean, on `main` in sync, no `STOP`,
  baseline suites green in 98 s). E1 has its full budget: this is sprint 1 of 3 (+1
  reserve). Three planned tickets plus the record, one of them studio machinery ([SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md)).
  *Next:* build [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md). *Blocked:* nothing.
- **Product Owner** — *Done:* logged the seven 2026-09-22 inbox lines and the chat focus
  in the input ledger and cleared the inbox. The focus answers Q11 with River Run, so the
  fork and portal rows now name River Run. The Maze Warden rows are parked, and River Run's
  answered-but-unbuilt experiments (power-ups, streak, biomes, best-score screen, module
  split) are on the backlog. Q12 asks which experiment goes first. *Next:* nothing until
  plan 06. *Blocked:* nothing.
- **Tech Lead** — *Done:* ordered [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md) first, because the guard can't pass a gate until
  it lands. Named the fork's storage traps in the plan: River Run reads `theme` and writes
  the unnamespaced `muted`, and its Watch Mode prefix makes production `settings.js` write
  the keys. *Next:* [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md). *Blocked:* nothing.

## Session 2 — build [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md) (2026-09-22)

- **Tech Lead** — *Done:* [SHS-055](tickets/SHS-055-checks-tell-studio-from-arcade.md). `commitKind` in `rules.mjs` sorts every commit on the
  shared `main` into studio, arcade, merge or exempt; `commit-lint` lints studio commits
  only, and `path-guard` / `production-unchanged` judge what studio commits changed while
  refusing an arcade commit or a mixed merge that touches a studio path. The executive's
  three 2026-09-22 commits are exempt by hash, `7712cf2` included (the ticket named two;
  the migration moved the steering views, so the reverse rule caught it too). 17 new
  tests, six red first; 300 of 300; the real history since `studio-iteration-04` passes
  both checks. *Next:* build [SHS-056](tickets/SHS-056-river-run-fork.md). *Blocked:* nothing.

## Session 3 — build [SHS-056](tickets/SHS-056-river-run-fork.md) (2026-09-22)

- **Front-end / Gameplay Dev** — *Done:* [SHS-056](tickets/SHS-056-river-run-fork.md). River Run is forked into
  `studio/games/river-run/` from `082943a`. Its saves are `studio_riverRun_*`, its theme
  comes from the body class, and its Watch Mode prefix is `studio_riverRun`. Every
  difference is listed in `tests/studio/lib/river-run-fork.mjs` and proved byte for byte.
  The first boot showed that production River Run fails the studio page contract in four
  places, so the fork carries four more listed edits: a back link, a 44px mute button, a
  noscript message, and guarded storage. A headless run leaves every production key as it
  was. The fork is live and on the shelf. *Next:* build [SHS-057](tickets/SHS-057-portal-opens-fork.md). *Blocked:* nothing.
- **Scrum Master** — *Done:* preflight was red on an untracked `.obsidian/` (editor
  config, not the team's). It is excluded locally in `.git/info/exclude`, and no
  repository file changed. *Next:* [SHS-057](tickets/SHS-057-portal-opens-fork.md). *Blocked:* nothing.
- **Scrum Master (for the retro)** — the push stage for `98d542f` (records only) failed
  `full-suites` once. The command chain pushed anyway, because a `grep` after the stage
  returned success. `npm test`, smoke and e2e then passed one by one, and the full push
  stage passed on the same commit. Which suite flaked wasn't captured. Lesson: gate the
  push on the stage's own exit code, never on a filter of its output.

## Session 4 — build [SHS-057](tickets/SHS-057-portal-opens-fork.md) (2026-09-22)

- **Tech Lead** — *Done:* [SHS-057](tickets/SHS-057-portal-opens-fork.md). River Run's portal on `3d.html` now opens
  `studio/games/river-run/`. `shared/3d/constants.js` is a recorded exception (ADR-0010),
  scoped to that one url and checked like `frontPositions`. A headless test walks into
  the portal and lands on the fork. Ticket, push and postdeploy stages green. *Next:*
  review. *Blocked:* nothing.
- **Scrum Master (for the retro)** — the push stage's first run failed. Following the last
  retro note, the push was gated on the stage's exit code, and it held. The failure was
  [SHS-056](tickets/SHS-056-river-run-fork.md)'s browser test waiting on chance: 1 run in 3 outlived its 60 s wait. It's fixed
  in `045f031`, so the run now ends deterministically. Lesson: a browser test waits on
  something the test causes, never on something the game might do.

## Session 5 — review (2026-09-22)

- **Scrum Master** — *Done:* one review round. The Independent Reviewer (`fable`) and QA
  (`opus`) each approved with findings; every finding is fixed, on the backlog, or declined
  with a reason in `review.md`. Two S fixes landed in the step: a subject naming a studio
  ticket is now a studio commit (`b897707`), and the fork's browser test logs every storage
  write (`607d40b`). On the executive's chat direction, the arcade doc updates for River Run
  were made here instead of being handed back (`63b8190`). *Next:* close. *Blocked:* nothing.
- **Scrum Master (for the retro)** — the sprint report asked the executive to do arcade doc
  edits the studio could have done itself; the executive said not to draw that line. Now a
  guardrail. Also: a ceremony commit subject ran to 115 characters and only the reviewer
  noticed. Lesson: run `--stage=ticket` before every commit, ceremony ones included.

## Session 6 — close (2026-09-22)

- **Scrum Master** — *Done:* the gate against `studio-iteration-04` passed 11 of 11, with
  full suites. Pushed, tagged `studio-iteration-05` and pushed the tag. Postdeploy passed
  3 of 3: the new pulse line was served live from `studio/shelf-data.js`. `review.md` now
  opens with *In plain words*, the demo list and Keep / Iterate / Kill. `CHANGELOG.md` has
  the iteration's section. [SHS-058](tickets/SHS-058-iteration-record.md) is closed. *Next:* retro. *Blocked:* nothing.
- **Scrum Master (for the retro)** — the first gate failed `docs-current` twice on
  [SHS-058](tickets/SHS-058-iteration-record.md). It was still In progress, and then it was Done with its criteria unticked. The
  record ticket's criteria named retro-step work (`retro.md`, the retro line, the learning
  log, tech debt, the steering views), but the gate needs the ticket Done before the retro
  step exists. The criteria were amended at close, with a note, rather than ticked early.
  Iteration 04's [SHS-053](../04/tickets/SHS-053-iteration-record.md) ticked `retro.md` at close. Lesson: the record-ticket template
  should say which criteria close checks and which the retro does.

## Session 7 — retro (2026-09-22)

- **Scrum Master** — *Done:* `retro.md`. All five of the log's retro inputs became a rule,
  a template edit or a guardrail. `templates/ticket.md` now splits the record ticket's
  close criteria from its retro work, and asks a checker ticket for its refusal cases.
  Iteration 04's changes held; its unreviewed fix round is still unexercised. *Next:* plan
  06. *Blocked:* nothing.
- **Learning Lead** — *Done:* the learning log opens with an **Active rules** list of ten
  (backlog #13, direction rule 7), and iteration 05's lessons are in. TD-014 opened (the
  fork test's Tone.js exemption), TD-001 restated for E1. *Next:* nothing. *Blocked:* nothing.
- **Product Owner** — *Done:* the backlog's top five are Ready: #4 power-ups (Q12 ⭐), #22
  the Tone.js fix, #21 a commit form for the executive's steering edits (the process slot),
  #8 best score, #31 a way back to the 3D page. Done rows removed. Budget: 1 of 3 spent,
  reserve unclaimed, on track. *Next:* plan 06. *Blocked:* nothing.

