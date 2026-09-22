---
name: studio-standup
description: "Read-only status of the Shadow Studio company: where it is, what's open, the scorecard trend, and what it's waiting on from Yevster. Use when Yevster says 'studio status', 'where is the studio', 'what is shadow studio doing', or asks how the studio company is going."
---

# Studio Status

**Read-only.** No commits, no edits, no fixes. If something is broken, report it and stop.

## What to read

1. **Repo state**
   - `git status --porcelain` — dirty tree?
   - `git log --oneline --grep "(studio)" -12` — recent studio work
   - `git tag --list "studio-iteration-*" --sort=-v:refname | head -3` — iterations shipped
   - `git log origin/main..main --oneline` — unpushed
2. **Direction and position** — `docs/studio/steering/next.md` (the step due and the sprint),
   `docs/studio/steering/direction.md` (the epic, its done-when, sprints used of those granted,
   reserve claimed or not) and the top five of `docs/studio/steering/backlog.md`. Report these
   first, ending with the prompt: `studio next`.
3. **The latest iteration** — `docs/studio/iterations/<highest>/`: `plan.md` for what was
   committed, `review.md` for what landed and the reviewer's verdict, `retro.md` for what the
   team changed about itself.
4. **Open work** — open rows in `docs/studio/tech-debt.md`, and any ticket marked Blocked.
5. **Waiting on Yevster** — unanswered items in `docs/studio/steering/questionnaire.md`,
   unresolved entries in `steering/input-ledger.md`, untriaged lines in `steering/inbox.md`, and
   any Keep / Iterate / Kill line in the latest review with no verdict.
6. **Trend** — the last three rows of `docs/studio/steering/scorecard.md`.
7. **Live** — is `https://yevrap.github.io/KamekoStudio/studio/` serving?

## Delta rule

If nothing has changed since the last status — no new commits, no new answers, no new inbox
lines — say so in one line and stop.

## Report

Compact, in chat:

- **Where it is:** the last iteration, what it shipped, what's live.
- **Open:** blocked tickets, debt rows worth naming.
- **Waiting on you:** unanswered questions and unresolved verdicts — the short list.
- **Trend:** three lines from the scorecard.
- **Say next:** the sentence that moves it forward.
