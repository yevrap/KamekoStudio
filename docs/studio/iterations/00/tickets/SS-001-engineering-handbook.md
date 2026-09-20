# SS-001 — The engineering handbook

- **Status:** Done
- **Size:** L
- **Iteration:** 00
- **Role lead:** Technical Writer
- **Depends on:** none
- **Branch:** `ss-001-process-docs`

## Motivation

The studio has no written process, so nothing constrains it and nothing can be checked
against it. A public repository needs the process to be readable by a stranger.

## Acceptance criteria

- [x] `docs/studio/README.md` orients a reader with no outside context and links every other document.
- [x] The iteration protocol and the ceremonies are written down, each ceremony with the artifact it produces.
- [x] A Definition of Ready and a Definition of Done exist, the latter with a per-role sign-off line.
- [x] The path guard, the storage rule and the stop rules are stated precisely enough to be automated.
- [x] Public-repo hygiene states what may never be committed and how direction is translated into the record.
- [x] Templates exist for a ticket, a decision record and an iteration.
- [x] The decisions taken while writing all of the above are recorded as ADRs, not left implicit.
- [x] Tech-debt policy, register, learning log, changelog and promotion process all exist.

## Evidence plan

A reader check: every document reachable from the README, every cross-link resolving.
The `doc-cleanliness` check (SS-003) run over the whole folder.

## Out of scope

Anything about the realm's content or appearance.

---

## Result

- **What changed:** 15 documents under `docs/studio/` — README, process, DoR, DoD,
  guardrails, public-repo hygiene, self-checks, tech-debt (policy + 4 rows), learning log,
  promotion, CHANGELOG, `decisions/` (README + ADR-0001…0004), `templates/` (ticket, ADR,
  iteration).
- **Tested by:** `doc-cleanliness` over 35 documents, green; every relative link checked by
  hand against the tree.
- **Deferred:** nothing.
- **Fix rounds used:** 0 / 2
