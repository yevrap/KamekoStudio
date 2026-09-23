---
name: new-game
description: "Kameko Studio game jam: pitch three original concepts, build the strongest as a cheap playable prototype in drafts/, deploy it, write its docs and a verdict questionnaire, and hand it over for a phone playtest. Also runs the next iteration of an existing Lab prototype. Use for 'jam a new game', 'new game ideas', 'prototype X', 'next iteration of <draft>'."
---

# New Game — Jam

Build a playable prototype fast, put it live in the Lab, and let a playtest verdict decide what
happens next. Drafts are throwaway by design, so speed and playability beat polish and
integration.

**Argument:** `$ARGUMENTS` — an optional seed or constraint ("card game", "use Web Audio"), or
the name of an existing draft to iterate.

## 1. Read the steering inputs

1. `docs/brief.md` — the taste brief.
2. `docs/playtest-log.md` — every verdict. **Kill** verdicts are hard constraints (don't
   re-pitch that direction), **meh** notes are iteration requests, **keep** verdicts signal
   what to build more of.
3. `docs/planning/` and `docs/questionnaires/` — direction notes and any answered picks for
   the next jam.
4. The existing lineup: the games table in `CLAUDE.md` and the folders in `drafts/`. Don't pitch
   what the arcade already has unless the twist is the point.

## 2. Pitch

Exactly three concepts, one line each: name, core loop, why it fits the brief. Then say which
you'd build and why, in one sentence. If Yevster is present he may redirect; otherwise proceed
with your pick.

**Originality.** Games named in a brief or a direction note are references for genre and feel,
never blueprints. Each pitch needs a hook of its own. Before building, name what is new and
what is borrowed — if the obvious build is a known game's signature mechanic, keep pitching.

**One layer at a time.** A concept with a core mechanic plus a secondary system
(meta-progression, a hero ability, a second mode) jams as separate iterations: the core loop
first, the next layer only after the core earns its own verdict. Ask before bundling them, even
when a design note recommends it.

## 3. Build the prototype

`drafts/<slug>/index.html`, a **single self-contained file** (inline CSS and JS).

**Must have:**
- A playable core loop, start to game-over or win, on the first load
- Mobile-first portrait layout; pointer events; `touch-action: none` where gestures matter;
  44px tap targets
- A restart button
- If the rules aren't universally known, teaching in the game: a short how-to overlay, coach
  hints, legal-move highlighting

**Must not have** (this is what keeps drafts cheap):
- No ES-module split, no separate `style.css`
- No unit tests
- No `shared/settings.js`, no `lastPlayed_*` key
- No `CLAUDE.md` game-table rows
- No theme integration

Promotion pays those costs later — see `docs/promotion-checklist.md`.

## 4. Playtest note

`drafts/<slug>/PLAYTEST.md`: the concept in one line, then exactly three bullets of what the
playtest should judge (the open design questions, not generic QA), then the verdict format for
`docs/playtest-log.md`:

```
YYYY-MM-DD — <slug> (draft) — keep|meh|kill — <why>
```

## 5. Register it

Add it to `drafts/index.html` (the Lab page): name, one-liner, link (`<slug>/`, trailing
slash), date. Newest first.

## 6. Verify in a browser

`npx serve .` from the repo root. Play one full loop — start, a few meaningful moves, game
over, restart — at phone width, with zero console errors. Fix whatever breaks.

## 7. Document

- `docs/games/<slug>/README.md` — what the game is, its rules in plain language, design
  decisions and why, what was cut, the live URL, and what the verdict decides.
- `docs/games/<slug>/ideas.md` — everything deliberately cut and every idea that came up while
  building, as checkboxes.
- `docs/questionnaires/<slug>-verdict.md` — the verdict (keep / meh / kill) plus every product
  judgment call you made (rules depth, session length, difficulty, tutorial style), as
  checkboxes with your recommendation.
- Frontmatter on both files, a row for each in `docs/README.md` (the Studio Dashboard), and
  relative links only — schema and link rules in `docs/CLAUDE.md`.
- `docs/roadmap.md` — a P3 row for the jam (🚧 while it's in the Lab awaiting a verdict).
- `docs/playtest-log.md` — only if you verified the loop yourself, a line marked
  *agent-verified, not a Yevster play session*. Never record a keep on Yevster's behalf.

## 8. Ship

1. `node scripts/bump-version.js`
2. `git add drafts/<slug>/ drafts/index.html docs/ version.json` (plus `drafts/CLAUDE.md` if
   changed — then regenerate with `node scripts/generate-context-docs.js`)
3. `git commit -m "feat(drafts): add <slug> prototype"` with a one-paragraph body on the concept
4. `npm test` green, then `git push origin main`
5. `gh run watch` the Pages deploy and confirm
   `https://yevrap.github.io/KamekoStudio/drafts/<slug>/` serves the prototype

## 9. Report

Three to five sentences: the concept, what the prototype includes and leaves out, the live
URL, and the questionnaire path. Ask for the verdict in chat — when it comes, record it in
`docs/playtest-log.md` and act on it: iterate, promote through
`docs/promotion-checklist.md`, or kill.

## Iterating an existing draft

Read the draft's README, its questionnaire answers and its playtest verdicts first. Change
only what the verdict asked for, keep the single-file draft bar, bump the draft's iteration in
its README, and write a fresh verdict questionnaire.

## Safety

- A jam never touches `games/` — drafts only.
- Never push with `npm test` red.
- One prototype per jam. If the concept needs a second file or a test to feel safe, it's too
  big for a draft — shrink it.
