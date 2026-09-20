# Promotion

A studio game becomes a production game only by an explicit decision from the executive.
Nothing graduates automatically, and no iteration proposes a promotion as part of its own
plan.

## What promotion is

A move from `studio/games/<name>/` to `games/<name>/`, plus the work that makes it a
first-class arcade game: a card in `index.html`, a portal in the landing page, an entry in
the games table in the repository `CLAUDE.md`, its `localStorage` keys renamed off the
`studio_` prefix and added to the production clear-data list.

All of that is outside the path guard. Promotion is therefore the one workflow that
deliberately leaves the studio's sandbox, and it runs as its own ticket, with its own
review, against the repository's existing [`../promotion-checklist.md`](../promotion-checklist.md).

## Sequence

1. The executive names the game.
2. A promotion ticket is written: the file moves, the key renames, the integration points,
   and the acceptance criteria from the production checklist.
3. The path-guard exception for that ticket is recorded in `guardrails.md` before any edit.
4. The move is made in one branch, with the full suites and the studio checks green.
5. The review demos the game at its production URL, and the executive confirms.

## Killed work

Work that is killed stays in git history, marked killed in the iteration's review and in
the changelog, and is removed from the studio gallery so it stops being presented as live.
It is not reverted: the history is the record of what the team tried.
