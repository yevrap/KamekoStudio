# SHS-063 — The executive's ADR-0011 commits pass the checks

- **Status:** Done
- **Size:** S
- **Iteration:** between 06 and 07 (built before plan 07, by the executive's session that wrote ADR-0011; filed under 06 because it closes 06's gap)
- **Role lead:** Tech Lead
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The executive's five `docs(studio)` commits of 2026-09-23 recording
[ADR-0011](../../../decisions/ADR-0011-the-studio-runs-itself.md) carry no ticket, so
`commit-lint` failed every `--stage=push` — including the one plan 07 needs to push its own
records. Backlog #39; the same fix [SHS-055](../../05/tickets/SHS-055-checks-tell-studio-from-arcade.md)
made for the 2026-09-22 executive commits.

## Acceptance criteria

- [x] `commit-lint` and `path-guard` report each of the five commits as exempt, with a reason
      naming ADR-0011 and SHS-063.
- [x] An unnumbered `(studio)` commit not in the list is still a studio commit and still
      fails the lint.

## Evidence plan

`tests/studio/rules.test.mjs`: the new SHS-063 case, shown red before the exemptions were
added; the existing *a new unnumbered (studio) commit … still fails* case. Then
`npm run studio:check -- --stage=push`.

## Out of scope

A commit form for executive steering edits (#21); issues now carry requests, feedback and
verdicts, so the executive rarely needs one.

---

## Result

- **What changed:** `tests/studio/lib/rules.mjs` lists the five ADR-0011 commits in
  `COMMIT_EXEMPTIONS`, each with a reason naming ADR-0011 and SHS-063; `guardrails.md` and
  backlog #39 say so (`2544ebe`).
- **Tested by:** the SHS-063 case in `tests/studio/rules.test.mjs`, red 3 of 3 before the
  exemptions and green 3 of 3 after, with the existing *a new unnumbered (studio) commit …
  still fails* case; `--stage=push`, where `commit-lint` passes with the five commits
  reported exempt (run before the push of this commit; see the commit message).
- **Deferred:** nothing. Not one of sprint 07's planned tickets, and it doesn't count
  against the caps. *(Result reshaped into the template's fields at sprint 07's close, when
  the gate's `docs-current` first read this ticket.)*
- **Fix rounds used:** 0 / 2
