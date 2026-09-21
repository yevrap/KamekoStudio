# Changelog

All notable changes to Shadow Studio, one section per iteration. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are iteration tags.

## [studio-iteration-02] — 2026-09-20

The shelf gets its first experiment, the realm gets boot coverage, and the experiment
returns a "no".

### Added

- **`studio-boot`** — a self-check that opens every `index.html` found by walking
  `studio/**` in a real headless Chrome, three times: ordinarily, with scripting disabled,
  and with every `localStorage` accessor throwing. Pages are discovered rather than listed,
  so a page added later arrives covered. It proves no uncaught error, no `console.error`, no
  failed request, a back link, 44px targets and no sideways scroll at 320px, a `noscript`
  fallback that says something, and — on the realm home — that the page ran its own script,
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
  per bolt**, with 6 to 38 units of strip headroom; the four that resist miss a strip point
  by under three units. Blind round-robin clears every plate in at most three passes. The
  test that was meant to catch this fixed the hold amount at the middle of the band — the
  one variable a player chooses — and so could not fail. Nothing was re-tuned: any strategy
  that moves a bolt to the middle of its band converges whatever the numbers. The assertions
  now state what is true and are named so a redesign inverts them.

### Also fixed, after three reviews

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

### Debt

- **TD-004 closed** by SS-020. **TD-007 opened**: the static file server now exists twice,
  once in `scripts/smoke.mjs` and once in `tests/studio/lib/browser.mjs`. Taken deliberately
  — `scripts/` is outside the path guard and exports nothing, so the alternative was a
  production exception for test plumbing. TD-001, TD-003, TD-005 and TD-006 unchanged.

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
