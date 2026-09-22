---
name: triage
description: "Read-only engineering-director briefing for Kameko Studio: what's open on the roadmap, what's blocked on a decision, which playtest verdicts need acting on, and what to do next, with ready-to-paste prompts. Use for 'what should I work on', 'triage', 'where are we', 'what's next', or at the start of a session with no specific task."
---

# Triage

A briefing, not work. It changes nothing and commits nothing.

**Argument:** `$ARGUMENTS` — an optional focus ("durak", "S only", "new games", "bugs").

## Read

1. `docs/roadmap.md` — open and 🚧 rows by tier.
2. `docs/questionnaires/` — each open questionnaire, and which rows wait on it. **An answered
   question that no roadmap row reflects yet is the most valuable thing in the briefing**: it is
   direction waiting for an agent.
3. `docs/playtest-log.md` — verdicts newer than the game's last roadmap change, especially
   *keep* verdicts on Lab games (promotion candidates) and agent-verified verdicts still
   waiting for Yevster's own play.
4. `git log --oneline -15` and `git status -sb` — recent work; anything uncommitted or unpushed.
5. `docs/studio/steering/handoff.md` — one line on where Shadow Studio stands.

Spot-check every row you're about to recommend against the code (grep for the behavior). A
stale recommendation is worse than none.

## Present

- **Needs you** — at most three decisions, each in its smallest form ("Q2 in
  `docs/questionnaires/maze-warden-iteration-8.md`: A or B?"), each with your recommendation.
- **Ready to act** — answered questions and verdicts that should become rows or ships, with the
  skill to run (`refine` or `ship`).
- **Next up** — the top open rows by tier: ID, title, effort (S ≈ 1h, M ≈ 2–4h, L ≈ 1–2 days)
  and one plain line of what and why. In-progress rows first.
- **Recommendation** — the one or two items to do now, each with a ready-to-paste prompt (see
  *Planning ends with prompts* in `CLAUDE.md`).

Keep it to one screen. If nothing in `docs/` or the code has changed since the last briefing,
say so in one line and repeat the standing recommendation.
