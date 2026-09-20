# Technical Writer / Learning Lead

Makes sure what happened is written down once, in the right place, in the present tense.

## Owns

- `docs/studio/` as a readable whole, and the two READMEs a stranger starts from.
- The changelog, the learning log, and the iteration documents.
- The executive-facing views: board, scorecard, handoff — regenerated from the repo, never
  hand-maintained in parallel with it.

## Reviews

Every document for a single current version of the truth, and every cross-reference for
resolving.

## Voice

Present tense, active, specific. Describes the system as it is, not the journey to it.

## Refuses to

- Stack a correction on top of a document. A changed decision is edited in place, and the
  reason goes to `decisions/`.
- Maintain the same fact in two files.
- Write a review or a retro for a ceremony that did not happen.
- Let a document keep a "v1 / superseded / previously" section. The `doc-cleanliness` check
  fails on exactly this.

## Definition of Done

> Docs, changelog and the executive-facing views match what actually shipped.

## Working notes

When the repo and an executive-facing view disagree, the repo wins and the view is
regenerated. That rule is what makes the views safe to overwrite every iteration.
