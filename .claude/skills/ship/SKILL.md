---
name: ship
description: "Ship a Kameko Studio roadmap item end to end: verify it is real, plan, implement, test, commit, push, verify the live deploy, and update the docs. Use for 'ship p1-22', 'ship the next thing', 'build X', 'implement the next roadmap item', or any request to make a change and put it live. Bugs go to the fix skill; new prototypes to new-game."
---

# Ship

One roadmap item, taken all the way to production: tested, pushed, deploy-verified and
documented. The working agreements in `CLAUDE.md` apply.

**Argument:** `$ARGUMENTS` — a roadmap ID (`p1-22`), a short description, or empty. Empty
means the highest-priority open item that isn't waiting on a questionnaire.

## Autonomy

For a well-specified item, run every phase without pausing for approval and report at the
end. Stop and report only when:

- two reasonable implementations would differ in product behavior — write the options into
  `docs/questionnaires/<topic>.md` with a recommendation, report its path, and ship only the
  part that doesn't depend on the answer;
- an action is destructive or hard to reverse: rewriting history, force-pushing, dropping
  players' saved `localStorage` data;
- a step touches accounts, money or paid services;
- tests can only go green by changing what they assert;
- the change would touch `studio/`, `docs/studio/` or `tests/studio/` — Shadow Studio's
  paths, which change only through `studio-iteration`.

## 1. Select

Read `docs/roadmap.md`. With an argument, find the matching row. Without one, take the first
open row by tier (P0 → P1 → P2 → P3 → Backlog), skipping rows marked as waiting on a
questionnaire. State the pick and why in one sentence.

## 2. Research, and verify the item is real

Read every file the item touches (all of the game's modules), the game's row in
`games/CLAUDE.md`, `docs/games/<slug>/README.md`, any plan or questionnaire the row links,
and the tests that cover it.

The roadmap is agent-written and drifts. Before planning, grep for the behavior the row
describes:

- **Already done** → implement nothing. Mark the row `✅` with a note naming the code (and
  the commit, if you can find it) that covers it, commit that alone, report, stop.
- **Partly done** → scope the plan to the real gap, and say so.

## 3. Plan

At most seven bullets: what changes, which files, in what order, and the risks. Say it in
chat and carry on — it's a record, not a request for approval.

## 4. Implement

Follow `CLAUDE.md` and `games/CLAUDE.md` strictly: vanilla JS, ES modules, pointer events,
44px tap targets, mobile-first, no comments unless the why is non-obvious, no dead code left
behind. Several independent items in one run: one subagent per item, each in its own git
worktree, merged and re-tested at the end.

For anything visible, serve the repo (`npx serve .`) and walk the golden path in a browser at
phone and desktop widths, light and dark, with zero console errors. Say what you checked.

## 5. Test

- `npm test` — always. It includes the repo hygiene test.
- `npm run smoke` — when the change touches boot paths, `shared/settings.js`, or any page's
  `index.html` structure.
- `npm run e2e` — when it touches Watch Mode, the settings drawer, or a game's start flow.
- New pure logic gets unit tests in `tests/`, following the neighbors.

All green before committing. Diagnose failures; never commit red.

## 6. Document

In the same commit:

- `docs/roadmap.md` — the row to `✅` with today's date and a one-line note of what shipped.
- If a product surface changed: `docs/games/<slug>/README.md` (what it is now, decisions and
  why, cut scope); cut or discovered ideas into that game's `ideas.md`; each open judgment
  call into a questionnaire in `docs/questionnaires/`.
- If the change adds `localStorage` keys, modules or games: the tables in `CLAUDE.md` and
  `games/CLAUDE.md`, and the key list in `clearAllGameData` (`shared/settings.js`). After any
  `CLAUDE.md` edit, run `node scripts/generate-context-docs.js`.

## 7. Commit and push

```
node scripts/bump-version.js
git add <the specific files> version.json
git commit -m "<type>: <what changed>"      # feat | fix | refactor | test | docs | chore
git push origin main
```

Never `--force`, never `--no-verify`.

## 8. Verify the deploy

Pushed is not shipped. `gh run list --limit 1`, then `gh run watch <id>` until the Pages run
succeeds. Then confirm the live site serves the new build:
`curl -s "https://yevrap.github.io/KamekoStudio/version.json?cb=$(date +%s)"` matches
`version.json`, and the changed page loads. A red or stuck deploy is part of this item: fix it
or report it.

## 9. Report

Three to five sentences: what shipped, how it was tested, the deploy result, the live URL to
check it at, and any questionnaire written for Yevster.
