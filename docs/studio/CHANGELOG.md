# Changelog

All notable changes to Shadow Studio, one section per iteration. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are iteration tags.

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
