---
name: studio-promote
description: "Prepares moving a Shadow Studio game out of the studio and into the production Kameko Studio arcade — the plan, the exceptions it needs, and the checklist — for Yevster's approval. Use when Yevster says 'promote X', 'graduate that studio game', or 'move X into the real arcade'."
---

# Studio Promote

Promotion is the one workflow that deliberately leaves the studio's sandbox. It **prepares**
the move and stops for approval; it doesn't carry it out unprompted.

**Authoritative:** `docs/studio/promotion.md` and `docs/promotion-checklist.md`.

**Argument:** `$ARGUMENTS` — the game to promote. If missing, list what's in `studio/games/`
with its review verdicts and ask which one.

## Rule

**Nothing moves without Yevster saying so, in this session, for this game.** Approval of a
different promotion isn't approval of this one.

## Phase 1 — Prepare (without asking)

1. Read the game's design notes, its tickets, and every review verdict it has received. A game
   with an open Iterate or Kill verdict isn't a candidate; say so.
2. Run `docs/promotion-checklist.md` against it and record each item as met, not met, or not
   applicable.
3. Write the promotion ticket into the current iteration's `tickets/`, listing:
   - the file moves (`studio/games/<name>/` → `games/<name>/`);
   - every `studio_` key it uses, and its production name after the rename;
   - the integration points: a card in `index.html`, an entry in `ARCADE_GAMES` in
     `shared/3d/constants.js`, a row in the games table in `CLAUDE.md` and `games/CLAUDE.md`,
     its keys in `clearAllGameData` in `shared/settings.js`, tests moved to `tests/`, and
     `docs/games/<name>/README.md` written from its design notes;
   - the **path-guard exceptions** each of those needs, written out for
     `docs/studio/guardrails.md`;
   - acceptance criteria, from the checklist.
4. Note the capacity limit on the 3D landing page — see
   `docs/studio/iterations/00/findings-3d.md`; the portal table may need a slot first.

## Phase 2 — Report and stop

Give Yevster, in chat:

- what the game is, and its review history in two lines;
- the checklist result, with anything not met called out;
- exactly which production files the move touches;
- what is and isn't reversible about it;
- the sentence to send to go ahead.

## Phase 3 — Execute (only after explicit approval)

Record the exceptions in `guardrails.md` **before** the first edit. Then the moves, the
renames, the integrations, the full suites, `npm run studio:check -- --stage=gate`, and the
ordinary publish steps. Demo the game at its production URL in the review.

If anything turns out to need a decision Yevster hasn't made, stop there rather than choosing —
a half-promoted game is worse than an unpromoted one.
