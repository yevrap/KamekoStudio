# Changelog

All notable changes to Shadow Studio, one section per iteration. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are iteration tags.

## [studio-iteration-07] — 2026-09-23

Power-ups you can read, and a River Run that restarts: the fork's score and power-up label
stay readable at phone width and the spread shot counts real seconds, the arcade's own River
Run no longer freezes on restart, and the studio can change its own skills. Sprint 3 of 3 of
epic E1, the last granted sprint.

### Fixed

- **The fork's score and power-up label read at phone width** ([SHS-064](iterations/07/tickets/SHS-064-river-run-power-up-hud-real-time.md))
  — the score and the label stack below "← Studio", Mute and ☰; the score stays on one line
  at 320 and 390 wide, and the label sits in a dark pill of its own. 44 px targets kept.
- **The spread shot's "6.0s" is six real seconds** ([SHS-064](iterations/07/tickets/SHS-064-river-run-power-up-hud-real-time.md))
  — the spread shot, the first pickup and the gap between pickups count wall-clock time,
  on a 60 Hz or a 120 Hz screen, and stop while the ☰ drawer is open. Below 10 fps a 0.1 s
  cap per update slows them. The rest of the fork still counts frames (backlog #46).
- **The arcade's River Run never freezes on restart** ([SHS-066](iterations/07/tickets/SHS-066-production-river-run-restart.md),
  arcade p0-17) — a production fix under ADR-0008: the old music sequence is disposed
  without `stop()`, and a music failure can no longer stop a run starting. Three browser
  cases in `scripts/e2e.mjs`, red before and green after; reviewed before it was pushed
  ([reviews/SHS-066.md](iterations/07/reviews/SHS-066.md)).

### Changed

- **The studio may change its own skills and conductor** ([SHS-065](iterations/07/tickets/SHS-065-studio-edits-its-own-workflow.md))
  — `.claude/skills/studio-*/**` and `.claude/workflows/studio-sprint.js` are a recorded
  exception for ticketed studio commits (ADR-0011 §6), so a retro's change to how the team
  works can land in the files that run it. Unticketed studio commits there are refused, and
  ADR-0011 stays the executive's.
- **The Independent Reviewer's role file matches ADR-0011 on models** (review, IR-2) — its
  independence is of context; QA on another model is the different-model pass.

## [studio-iteration-06] — 2026-09-22

River Run's first experiment: a shield and a spread shot float down the fork's river, a
restart can no longer freeze the fork, and every studio ticket number in the docs links to
its ticket. Sprint 2 of 3 of epic E1.

### Added

- **Power-ups on the fork's river** ([SHS-060](iterations/06/tickets/SHS-060-river-run-power-ups.md))
  — one pickup at a time, the first about 5 s into a run. A **shield** (cyan) puts a bubble
  on the boat that takes the next rock or log; a **spread shot** (pink) makes every shot
  three for about 6 s. A HUD under the score shows each, with the spread's countdown; the
  pickup sounds respect mute, the drawer's pause pauses them, and nothing new is saved.
  The fork's byte-for-byte equality test is retired; its edit list stays as the record of
  the copy.
- **Ticket numbers link to their tickets** ([SHS-059](iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md))
  — `tests/studio/link-tickets.mjs` linked 378 `SHS-NNN` mentions in 48 Markdown files and
  leaves code, title lines, commit subjects, numbers with no ticket and self-mentions
  plain. The retro runs it; a second run changes nothing.

### Fixed

- **A restart could freeze the fork's river** ([SHS-061](iterations/06/tickets/SHS-061-river-run-tone-start-time.md))
  — `musicSequence.stop()` threw against a stopped Tone Transport and aborted the new run
  before its game loop. The fork disposes the old sequence instead, and a music failure can
  no longer stop a run starting. A 20-restart browser test covers it, and the fork's
  browser tests now accept no error at all (TD-014 closed).
- **Fast taps with the spread shot fired nothing** — the 30-shot pool ran dry; it is 90,
  and a shot past the river bank returns to it (`8a7a604`, review).

### Changed

- **The link lib names the Markdown shapes it would mislink** (`c361b17`, review); none is
  in the repo, and guarding them is backlog #36.

## [studio-iteration-05] — 2026-09-22

The Studio Wing opens: River Run is the studio's first fork, with saves of its own, and the
3D landing page's River Run portal leads to it. Sprint 1 of 3 of epic E1.

### Added

- **River Run, forked into the studio** ([SHS-056](iterations/05/tickets/SHS-056-river-run-fork.md)) — `studio/games/river-run/`, copied
  from production at `082943a`. Every save is `studio_riverRun_*`, Watch Mode registers
  under `studio_riverRun`, and the theme comes from the body class instead of the shared
  `theme` key. Every difference from production is a closed list in
  `tests/studio/lib/river-run-fork.mjs`, proved byte for byte, including four edits the
  studio page contract needed (a back link, a 44px mute button, a no-script message,
  guarded storage). A headless run logs every `localStorage` write and refuses any
  non-`studio_` key. The procedure is `docs/studio/forking.md`.
- **The 3D River Run portal opens the fork** ([SHS-057](iterations/05/tickets/SHS-057-portal-opens-fork.md)) — one `url` in
  `shared/3d/constants.js`, a recorded exception (ADR-0010) scoped to that value and
  checked like the front-wall row. A headless test walks into the portal and lands on the
  fork.

### Changed

- **The checks tell studio commits from arcade commits** ([SHS-055](iterations/05/tickets/SHS-055-checks-tell-studio-from-arcade.md)). `commitKind` sorts
  every commit on the shared `main` into studio, arcade, merge or exempt. `commit-lint`
  lints studio commits only; `path-guard` and `production-unchanged` judge what studio
  commits changed and refuse an arcade commit or a mixed merge that touches a studio path.
  Three executive commits are exempt by full hash, each with its reason.
- **A subject naming a studio ticket is a studio commit, whatever its scope** — opened by
  review (`b897707`), so a production change cannot leave the guard by dropping `(studio)`.
- **Rebase, don't merge**: a pull-merge that brings in both kinds of commit fails the guard
  (`process.md`).
- **The studio keeps the arcade docs about its own work current**, docs only, in its own
  arcade commit (`guardrails.md`).

### Fixed

- **The fork's browser test could not see a write that restored a seeded value**; it now
  logs every write (`607d40b`).
- **The fork's browser test waited on chance** and outlived its 60 s wait 1 run in 3; the
  run now ends on a collision the test causes (`045f031`).

## [studio-iteration-04] — 2026-09-21

The studio's first production fix, under a written permission its checks enforce, in the
first trunk-based iteration: every finished ticket and every ceremony record was pushed and
checked as it landed.

### Added

- **Production fixes, under the full process** — ADR-0008. The studio may fix production
  files as tickets. The path guard admits a production file only when all of these hold:
  - an entry in `PRODUCTION_FIXES` names it for the iteration being checked;
  - the ticket has a file in that iteration;
  - every commit that changed the file names that ticket, a merge that changed it
    included.

  A deletion, or a change after the iteration's tag, is refused. A merge that takes a file
  from one of its parents is not seen by this guard (TD-013); the review check refuses
  it. The guard proves a write
  was planned and recorded; ADR-0008 says plainly that it cannot prove the plan was
  legitimate.
- **A production fix is reviewed before it is pushed** — [SHS-054](iterations/04/tickets/SHS-054-production-fixes-reviewed-before-push.md), opened by review.
  `production-fix-reviewed`, in `push` and `gate`, refuses a production fix unless
  `iterations/NN/reviews/<TICKET>.md` names a reviewed commit and an approving verdict, and
  every file the fix owns is, at `HEAD`, exactly what that commit holds. It is decided
  from content, and measured from the previous release. It makes the review impossible to
  forget, not impossible to fake.
- **A `push` stage** — the gate's checks short of the two review checks, plus `on-main`
  and `no-stop-file`, run before every push.
- **`--marker-at`** — `studio-live` can prove a build is served at any path on the site,
  a production script included.

### Changed

- **Trunk-based development, as a trial** (ADR-0007): commits to `main`, each ticket and
  each ceremony record pushed and deploy-checked when it lands.
- **`--base` and `--previous-tag` default to the previous release**, the newest iteration
  tag that is not `HEAD`.
- **`gate`, `push` and `postdeploy` are conclusive**: a check they could not run fails
  them.
- **The iteration is the newest one git tracks**, not the newest directory on disk.

### Fixed

- **Black Hole in One: entering Explore with spiral particles alive threw on every frame
  for about a second** (TD-009, [SHS-052](iterations/04/tickets/SHS-052-td-009-fixed.md)). The studio's first production fix, one line in
  `stepParticles`. Three regression tests in `scripts/e2e.mjs`, each in its own browser
  profile and each proving its precondition. They failed on the unfixed file and pass on
  the fixed one, and they refuse partial and over-broad fixes.
- **`studio-live` never waited for the new build** (TD-010). It searches afresh on every
  attempt.
- **`production-unchanged` compared a tagged release with itself** (TD-011). No check now
  passes on a comparison of no commits, a marker the last release already had, or a stage
  that verified nothing.
- **A `--marker` containing `=` was silently cut short.**

### Removed

- `tests/studio/diagnostics/td-009.mjs`, retired once its checks lived in production's
  suite.

## [studio-iteration-03] — 2026-09-21

A maintenance iteration: the ticket prefix is retired, a production defect is diagnosed
rather than called flaky, and the gate stops accepting a ticket that has no file.

### Added

- **`tests/studio/diagnostics/td-009.mjs`** — a reproduction of a Black Hole in One defect
  (TD-009), for whoever fixes it. It tries four player routes into Explore, a control, and
  the defect directly — spirals proven alive in a golf round, black hole removed — and
  says *fixed* only when all of them are clean. Two review rounds each defeated a version
  of it with a partial fix; the final version reports every one of their decoys as
  *present* or *unclear*. Not a test:
  nothing collects it, so it cannot turn a suite red. It changes no file.
- **ADR-0006** and a *Naming* section in `process.md`: every name the studio coins is read
  as a stranger would read it before it is adopted.

### Changed

- **Tickets are numbered `SHS-NNN` from 043.** The `SS-` prefix was made by abbreviating the
  realm's name without reading the result, and the initials are those of the Nazi
  *Schutzstaffel*. The numbering continues, so one number names one ticket, and `SS-001` to
  `SS-042` keep their names. `commit-lint` enforces the split in both directions.
- **`docs-current` checks that every ticket a commit names has exactly one file** — whose
  name and first line carry its ID, and whose ID obeys the sequence — across the whole
  history, and applies the content rules to every ticket the iteration names or edits,
  wherever the file lives. A test lints every example commit subject in the handbook.
- **`commit-lint` waives one commit by its full hash**, visibly: SS-042's subject is 81
  characters, it reached the remote after the previous gate ran, and fixing it would
  rewrite `main`.

### Fixed

- **`docs-current` could not see a missing ticket.** It read only the files that existed,
  so SS-039, SS-041 and SS-042 were named by commits on `main` with no file while the gate
  reported iteration 02 complete. The three files are reconstructed from their commits and
  marked as such.

### Diagnosed, not fixed

- **TD-009 is a real defect, not a flaky test.** Entering Explore while a golf hole's
  spiral particles are alive throws on every frame for about a second, before the canvas
  renders: `stepParticles` moves spirals around a black hole that Explore's reset removed.
  Players reach it by every route from a golf hole to the Explore button that was tried —
  four of them; two end-to-end tests catch it only when a particle spawns in time. The one-line fix is specified in the debt
  register and was tried on a scratch copy only. It is production code, and waits on the
  executive.

### Found on the way out

- **The post-deploy stage proved less than it said, twice.** `studio-live` never waits for
  the new build, so a correct deploy read as a failure; `production-unchanged`, run after
  the tag, compared the release with itself and passed. Registered as TD-010 and TD-011 by
  [SHS-049](iterations/03/tickets/SHS-049-postdeploy-gaps.md), which landed after the tag; the deploy itself was verified with the right
  baseline.

### Review

Two rounds, the cap. The second rejected the iteration, on a gap in the TD-009 check that
both reviewers found independently; it was closed in a fix round no reviewer has examined.
See `iterations/03/review.md`.

## [studio-iteration-02] — 2026-09-20

The shelf gets its first experiment, the realm gets boot coverage, and the experiment
returns a "no".

### Added

- **`studio-boot`** — a self-check that opens every `index.html` found by walking
  `studio/**` in a real headless Chrome, three times: ordinarily, with scripting disabled,
  and with every `localStorage` accessor throwing. Pages are discovered rather than listed,
  so a page added later arrives covered. It proves no uncaught error, no `console.error`, no
  failed request, a back link, 44px targets, a page that asks for the device's width and
  does not overflow it, a `noscript` fallback that says something, and — on the realm home — that the page ran its own script,
  that the shelf holds its three column counts either side of both breakpoints, and that a
  killed card reads differently from a live one. Closes TD-004: the eight mutations an
  independent QA pass had named as surviving the entire repository suite all fail it.
- **Overtighten**, at `studio/games/overtighten/` — the studio's first game and the first
  entry on the shelf. A plate of bolts; holding one turns it and loosens every bolt it is
  coupled to; all of them must end inside their tolerance bands at once, and past the strip
  point a thread is gone. The torque rules, the progress rules and the markup are pure and
  unit-tested; one file touches the document. Three plates, each proved reachable from zero
  without stripping.

### Changed

- The realm's home page shows its first card, and the empty state it shipped with in
  iteration 01 is no longer what the page renders.
- **Overtighten's own page describes what the game turned out to be rather than what it was
  designed to be.** See below.

### Fixed

- **The boot check's one exemption was defeatable.** It waived uncaught throws from
  production's `shared/settings.js` (TD-005, a file outside the path guard) by matching any
  path *ending* in that name — so `studio/games/x/shared/settings.js`, a file the studio may
  create at will, claimed it. Both independent reviews built exactly that file, threw
  uncaught from it, and watched the check pass. Anchoring it to the page's own origin and
  the exact served path was the first attempt and was itself defeated — see *After three
  reviews* below for what the check does instead. `firstFrame` also did not return the
  first frame. None of the classifiers had a test at the time; the ones that remain are
  covered by tests built from the bypasses the reviews demonstrated.
- **Four blind spots in the same check**, each found by mutating `studio/**` and watching
  the whole ticket stage pass: an invisible control was excluded from the 44px rule rather
  than failing it, so `opacity: 0` over the plate was an escape; the phase that drives the
  game collected no errors; the pointer release was sampled at the moment of release, so
  deleting the release listeners — which makes every tap destroy the plate — passed. And
  persistence is now proved by a reload rather than by a write.
- **Seven input and focus defects in Overtighten.** A bolt was held by one slot with nothing
  recording what held it, so a second finger froze the first bolt and left it drawn as
  turning, and tapping Enter while Space was down ended a hold Space was still making;
  a bolt is now held by a set of causes and the turn ends when the last lets go. A pointer
  press never focused the bolt, so after any click the keyboard did nothing at all.
  `setPointerCapture` was unguarded against the exception it is specified to throw. Choosing
  a plate scrolled every bolt off the top of a phone screen; advancing dropped focus to the
  body. The status line is an `aria-live` region and was rewritten every frame — 62 times
  during a one-second hold, 61 of them identically.

### Recorded

- **Overtighten's design hypothesis is false, and the tests now say so.** It was built to
  test whether the coupling between bolts would make each plate an ordering puzzle. Because
  loosening clamps at zero, a bolt at zero absorbs nothing, so in a single pass a bolt is
  reduced only by the neighbours turned after it — which makes each plate a
  back-substitution. **142 of the 146 orderings across the three plates clear with one hold
  per bolt**; the four that resist miss a strip point by under three units. On the order the
  plates are listed in, the per-bolt strip headroom runs from 6 to 38 units, and across all
  142 clearing orderings the tightest is 3.5 — comfortable either way, and not a
  frame-perfect exploit. Blind round-robin clears every plate in at most three passes. The
  test that was meant to catch this fixed the hold amount at the middle of the band — the
  one variable a player chooses — and so could not fail. Nothing was re-tuned: any strategy
  that moves a bolt to the middle of its band converges whatever the numbers. The assertions
  now state what is true and are named so a redesign inverts them.

### Also fixed, after ten rounds of review

- **The boot check's exemption was removed rather than tightened.** Anchoring it to an
  origin and an exact path was still wrong: a stack frame's URL is minted by the script
  that throws, so a `//# sourceURL` comment lets any studio file claim production's
  identity — demonstrated in six lines. The blocked-storage pass now serves an empty script
  in place of production's `shared/settings.js`, so nothing in that pass is production's and
  there is nothing left to forge. What the pass proves is narrower and true.
- **Seven more mutations inside `studio/**` passed the whole ticket stage:** three control
  listeners emptied (restart, the picker, "next plate" — each a dead button), the plate's
  name, hint and status line blanked, the gauge stroked in `transparent`, and the shelf
  losing its only link to the game. Each is now covered by an observation: every control is
  pressed, every label read, the bolt's own pixels compared before and during a turn, the
  gauge's computed strokes checked for visibility, and the **realm's own shelf** required to
  offer at least one card whose link is a page the check itself booted.
- **`docs-current` accepted a Done ticket with an entirely empty Result**, because its
  evidence match used `\s*(.*)` and `\s` matches a newline, so each label was answered by
  the label below it. One ticket had shipped that way.
- **One hold now runs one animation loop.** A frame pending from a previous hold carried on
  beside the new one; six rapid press/release pairs left seven concurrent loops.
- **The error filter is gone entirely.** A third review found that deleting the
  `shared/settings.js` exemption had left a second one: the filter for the browser's own
  `/favicon.ico` 404 also read `error.source`, so a studio file throwing
  `//# sourceURL=<origin>/favicon.ico` had its error dropped in every pass. Three successive
  exemptions, three successive forgeries. The driver now **answers** the browser's favicon
  request and **stubs** the inherited settings script, so nothing needs recognising and
  nothing can be impersonated, and the blocked-storage pass proves it was in that
  configuration rather than assuming it.
- **Nine more mutations inside `studio/**`** beyond the forged `sourceURL` above, all found by the third review: a click no
  longer leaving the keyboard dead, focus loss releasing a hold, the mute toggle, the state
  classes a bolt carries as it seats, the band at `stroke-width: 0` with its colour intact,
  the coupling lines and the torque readouts in `transparent`, a transposed coupling line,
  and choosing a plate leaving nothing playable on a 320px screen.
- **`docs-current` could still pass an evidence-free ticket three ways**: an unvalidated
  status word (`Done ✅`, `Shipped`), a label inside a fenced example elsewhere in the file,
  and an earlier draft Result answering for the final one.

- **The check had never used a mobile viewport, while its code said it had.**
  `setViewport({ width: 320 })` is a narrow *desktop* window, and desktop Chrome ignores
  `<meta name="viewport">` entirely — so deleting that tag from both pages, which on a phone
  renders the whole realm at ~980px and scales it down under a thumb, passed everything. The
  driver now emulates a phone, and three separate measurements replace one: whether the page
  *asks* for the device width, whether content forced the layout viewport wider than the
  device anyway, and whether the page scrolls sideways inside its own layout. The first
  version of that fix reported all three as the first one, and silently killed the
  sideways-scroll rule by comparing `scrollWidth` against a number that tracks it.
- **Three of a bolt's four state treatments were drawn by nobody's rule.** The gauge's ink
  was read from a bolt on a fresh plate, where every bolt is loose, so deleting the seated,
  over and stripped colours left one shade in every state and passed. The four states and
  the picker's locked treatment are now read from fixtures and must differ from one another.
- **Five more things a player sees are now observed:** focus landing on a bolt after a plate
  loads by either route, the picker redrawn when a plate is cleared, the outcome panel's
  explanation, the "next plate" button's label, and a visible focus ring on a bolt reached
  with Tab.
- **The tuning the tests verify is now the tuning that runs.** A plate may lower its own
  coupling and the bracket does, but nothing connected the value the unit tests check to the
  one the game passes to `turn()`; the plate element carries the coupling it is being played
  at, and every plate is compared against the model.
- **`docs-current` accepted an evidence-free Done ticket in twelve different ways**, found
  across seven rounds and closed one round at a time — and the last fix is the only one that
  generalises. The routes: a label answered by the label below it;
  an unvalidated status word (`Done ✅`, `Shipped`); a backtick-fenced example elsewhere in
  the file; an earlier draft Result answering for the final one; a `~~~` fence; an HTML
  comment; a fence indented by one to three spaces, which CommonMark still renders as a code
  block; and finally the fallback inside the fix itself — when the heading pattern missed,
  on `## Result (final)` or a lowercase `## result` or no heading at all, evidence was taken
  from the raw file with nothing stripped. Then three more in the **status word**, which
  gates every one of those checks and was itself read from raw text: forged in an HTML
  comment, in a fenced block, and in a raw `<script>` block. And two in the criteria count:
  `*`/`+` bullets, then ordered `1. [ ]` items, both of which render as empty boxes.

  It now fails closed, and the status rule is the general one: **a ticket declares its
  status exactly once**, counted in the raw file, so it is indifferent to how a second
  declaration was hidden. A Done ticket with no Result section is a failure; an unclosed
  fence or comment hides everything after it, as it does when rendered.
- **The favicon is answered by exact path**, not by suffix: a suffix match answered
  `studio/anything/favicon.ico` too, and would have hidden a real 404.
- **Rules written to close a defect kept being satisfied by that defect**, which the
  learning log now states as writing the rule about the thing rather than about the
  spelling. The back link is compared as a *page* — decoded, case-folded and with
  `index.html` normalised away — after `index.html`, `%69ndex.html` and `Index.html` each
  passed in turn; the four bolt-state colours are compared **as colours against an absolute
  gap**, after four greys one unit apart passed a test of string difference; and unticked
  criteria are counted on rendered structure, after `*`, `+`, `1.` and `> -` each counted
  zero. Separately, the status-churn rule gained a floor as well as a ceiling, after
  freezing the live region turned out to pass — a ceiling-only rule, not a spelling.
- **`docs-current` stopped trying to read Markdown.** Ten rounds of review defeated it ten
  times, and every fix but the last made the same bet: that the checker could decide which
  text a renderer would show. Stripping hiding places out deleted text that *renders* and
  promoted a draft Result over the real one; a hand-written CommonMark scanner then missed a
  comment inside a blockquote, an HTML block interrupting a paragraph, and a nested list's
  indentation. **A ticket now declares each thing exactly once** — one `## Result`, one
  `Status`, one `What changed`, one `Tested by` — counted in the raw file, so a second
  declaration fails wherever it is and however it is hidden. Every payload from all ten
  rounds had beaten the old checks by adding a second declaration, so one rule catches all
  of them, and 170 lines of parser were deleted.
- **The deploy check can see what changed.** `studio-live` searched the realm's HTML for
  its marker, but that page is a shell — its shelf, pulse and retro lines are all built in
  the browser from `shelf-data.js`. A correct deploy reported a failure. It now searches the
  page and the same-origin files it loads, following one level of module imports.

### Debt

- **TD-004 closed** by SS-020. **TD-007 opened**: the static file server now exists twice,
  once in `scripts/smoke.mjs` and once in `tests/studio/lib/browser.mjs`. Taken deliberately
  — `scripts/` is outside the path guard and exports nothing, so the alternative was a
  production exception for test plumbing. **TD-008 opened**: `studio-boot` covers what it
  collects, and four things it does not collect are written down in `self-checks.md` — no
  audio observation, no layout or visual regression beyond one bolt's pixels, only the first
  plate played, and the realm home measured rather than driven. Registered rather than only
  described, because a gap in prose schedules nothing. TD-001, TD-003, TD-005 and TD-006
  unchanged.

## [studio-iteration-01] — 2026-09-20

The realm gets its identity and its shelf, and the arcade gets two doors back.

### Added

- The **Backstage** visual identity in `studio/style.css`, replacing iteration 00's
  deliberately identity-free tokens: a warm paper ground by day and graphite by night, one
  amber worklight reserved for status, one teal reserved for anything interactive, a
  monospace for tags and dates, and a faint bench grid under the page. Every
  foreground/background pair measures AA or better in both themes.
- The realm's home page: a pulse line naming the current iteration, a shelf generated
  entirely from `studio/shelf-data.js` through pure functions in `studio/shelf.js`, status
  tags (PROTOTYPE / ITERATING / KILLED / PROMOTED), a persistent way back to the arcade,
  and a `<noscript>` route to the handbook. The shelf is empty, and renders as empty: the
  realm has no games yet and none were invented to fill it.
- `portal-capacity` — a self-check that counts `ARCADE_GAMES` against the 3D landing page's
  portal position table, and fails when the list outgrows it.

### Fixed

- **Two production games had no portal.** The 3D landing page built nine portal positions
  for an eleven-game list and dropped the remainder with a bare `return`, so Black Hole in
  One and Maze Warden were unreachable from the landing page and nothing reported it. A
  front-wall row takes the room to twelve slots. Made under a recorded, content-checked
  path exception (ADR-0005), in its own commit, last in the iteration. Closes TD-002.
- The path-guard exception mechanism, in both directions. It rejected its own approved
  edit, because the base revision was read through a helper that trims and every source
  file ends in a newline. And it accepted a bypass: the approved block was matched first as
  "everything up to the next bracket" and then as "arguments containing no parentheses",
  and an independent review demonstrated four payloads that need no parenthesis — a tagged
  template calls, an assignment expression assigns — going into a production file with the
  guard reporting the exception as used. A permitted element is now a whitelist of exactly
  three arithmetic arguments, and the four payloads are regression tests. The reader behind
  the first bug is now tested against the repository rather than through the pure rule it
  feeds, which was never wrong.

### Known gaps

- The realm still has no entrance from the 3D landing page. The twelfth portal slot — the
  centre of the front wall, facing the spawn point — is free and reserved for it. Held by
  decision rather than by capacity (TD-001).
- The shelf has nothing on it. That is the next iteration's work, not a defect.

## [studio-iteration-00] — 2026-09-19

The setup iteration. No player-facing features.

### Added

- The engineering handbook in `docs/studio/`: process, Definition of Ready, Definition of
  Done, guardrails, public-repo hygiene, self-check reference, tech-debt policy and
  register, learning log, promotion process, decision records and templates.
- Twelve role definitions in `docs/studio/team/`.
- `npm run studio:check` — the executable self-checks, in `tests/studio/`: eighteen checks
  across five stages, with the decision logic isolated as pure functions and unit tested.
- `studio/` — a placeholder landing page for the realm, live, with `studio/README.md`.
- `docs/studio/iterations/00/` — plan, log, eleven tickets, review, retro, and a findings
  note on how the 3D landing page actually works.

### Fixed

After an independent review of this iteration's own diff, run by two agents with fresh
context:

- The `package.json` path-guard exception read diff text, so once a change to that file was
  committed it compared an empty string and passed — any committed change was waved through
  while the check reported "exception used". It now compares the parsed file between the
  base revision and now, and checks the script's value as strictly as its key.
- The path guard counted only a rename's destination, so a file could be moved out of
  production and reported as a studio-only change.
- The storage rule checked three named accessors, missing bracket access, `delete`, and
  `localStorage.clear()` — which empties the whole shared origin, production saves included.
- Five places, including copy on the public placeholder page, overstated the storage rule:
  studio pages inherit the arcade's settings script, which owns `theme` and `devMode`.
- Standalone footer links were below the 44px tap target; a corrupted visit count rendered
  a nonsense sentence.
- Smaller: commit-lint could be opted out of by starting a subject with "Merge"; `hygiene`
  skipped files by extension, so a stray `.pem` would not be scanned; an unresolvable
  `--base` silently disabled the guard; a missing browser was reported as a test failure
  rather than as "not run".

### Known gaps

- The realm has no portal from the 3D landing page: the change falls outside the path guard
  and is proposed for approval in `iterations/00/findings-3d.md` (TD-001, TD-002).
- Five open rows on the tech-debt register, three of them production-side.
