---
name: refine
description: "Kameko Studio backlog refinement: turn ideas, answered questionnaires and playtest verdicts into agent-shippable roadmap rows, write questionnaires for the decisions that remain, and end with ready-to-paste prompts. Use for 'plan X', 'refine the backlog', 'turn these ideas into roadmap items', 'act on the questionnaire answers', 'plan a sprint for <game>', or when triage finds answered questions that no roadmap row reflects."
---

# Refine

Planning happens in files, not in chat. The output is an updated `docs/roadmap.md`,
questionnaires for whatever is still undecided, and a list of prompts.

**Argument:** `$ARGUMENTS` — a game, a questionnaire, an idea, or empty for everything waiting.

## Inputs

- The game's `docs/games/<slug>/ideas.md` and `README.md`, or `docs/planning/ideas.md` for
  arcade-wide ideas.
- Answered boxes in `docs/questionnaires/`.
- Recent verdicts in `docs/playtest-log.md`.
- Anything Yevster just said in chat — record it in the right file first.
- The code, to ground feasibility and see what already exists. This skill changes no code.

## Steps

1. **Check each idea against the code.** Some are done, some obsolete. Done → mark it done in
   `ideas.md` with the commit that did it. Obsolete → strike it through with the reason.
   Nothing disappears silently.
2. **Write agent-shippable rows** in `docs/roadmap.md`, in the right tier, with the next free ID:
   `| p1-NN | <game>: <title> | S/M/L | open | <what and why, one line>. *Done when:* <verifiable criteria>. Spec: <link, if any> |`
   A row that `ship` can't execute without a follow-up conversation isn't ready.
3. **Split big ideas.** Too large for one ship → a short plan in
   `docs/games/<slug>/plans/<topic>.md`, plus its first shippable slice as a row. Split a new
   game's core mechanic from its secondary layers; each slice stands alone as a playable,
   judgeable step.
4. **Open product questions → a questionnaire** in `docs/questionnaires/<game>-<topic>.md`:
   numbered questions, checkbox options, a recommendation on each, and the rows waiting on it.
   Mark those rows *waiting on <file> Qn*. Don't stall waiting for answers in chat.
5. **Consumed questionnaires** — every question answered and reflected in rows — move to
   `docs/archive/questionnaires/`.
6. **Commit and push** the planning changes (`docs: plan <topic>`).

## Report

N ideas → N rows (with IDs), N parked, N questions pending (with the file). Then **one
ready-to-paste prompt per new row, in ship order**: the item ID, the doc holding its spec, and
the skill to run (`ship` or `fix`). For Claude Code, wrap each in `/goal …` naming the whole
done checklist. Later waves say to confirm earlier items are `✅` first; an item with an
architectural unknown says to stop and report rather than guess.
