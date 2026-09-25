---
name: studio-sprint
description: "Runs the Shadow Studio's current sprint from wherever docs/studio/steering/next.md is to its retro, one step at a time, while Yevster watches — plan, each build, review with QA, the Independent Reviewer and the Playtester, close, retro. Use when Yevster says 'run the studio', 'run a studio sprint', 'kick off the studio', optionally with 'focus: X' or 'for N sprints', or 'restart the studio' when it is tabled (the restart runs alone, with two scouts on what's new, and the run stops after it). For a single step, use studio-iteration ('studio next') instead."
---

# Run the studio

The conductor for [ADR-0011](../../../docs/studio/decisions/ADR-0011-the-studio-runs-itself.md):
it runs the sprint's steps back to back, each one following the
[`studio-iteration`](../studio-iteration/SKILL.md) skill, and stops at the end of the
sprint. The work, the rules and the state are the same for every tool; only the conductor
differs.

## In Claude Code: start the workflow

Start the saved workflow **`studio-sprint`** (`.claude/workflows/studio-sprint.js`) with the
Workflow tool, by name. Yevster saying "run the studio" is the explicit opt-in. Pass a focus
as `args` (`{ focus: "…" }`, plus `sprints` or `steps` if asked). Then point Yevster to
`/workflows` to watch, and don't run steps yourself: the workflow gives each step a fresh agent,
runs the reviewers, and measures tokens per step.

## Anywhere else (Antigravity, Gemini): conduct it yourself

1. **Where is it?** Read the `**Next:**` line of `docs/studio/steering/next.md`. If a `STOP`
   file is at the repo root, stop and say so. Don't run while another tool is running the
   studio in this checkout: both would move the same `next.md` and `main`.
2. **Loop over steps.** While the `**Next:**` line names a step (`` `plan …` ``,
   `` `build …` ``, `` `review` ``, `` `close` ``, `` `retro` ``, `` `restart` ``):
   - Stop before a `plan` once a sprint has finished in this run (after one sprint, unless
     Yevster asked for more). Stop on any other `**Next:**` line: that's a hard stop.
   - **Run the step with fresh context:** hand it to a **subagent** with the step prompt in
     [references/prompts.md](references/prompts.md), if your tool can start one. If it
     can't, do the step yourself, following `studio-iteration` for that one step only, and
     re-read `next.md` before the next one.
   - **Before `plan`:** the Playtester pass on open verdicts (prompts file). Its verdicts go
     into the plan step's prompt.
   - **Before `restart`** (a tabled studio, SHS-076): the two scouts, tools and practice
     (prompts file); their results go into the restart step's prompt. **Stop after the
     restart**, even if `next.md` now names a `plan`: Yevster reads the Restart log in
     `docs/studio/steering/restart.md` first.
   - **At `review`:** run the Independent Reviewer, QA and the Playtester (prompts file) —
     as parallel subagents if you can, on two different models if you can choose — then
     give their results to the review step. Without subagents, do each as a separate pass
     that reads only what its prompt says, and write each verdict down before starting the
     next.
   - **After each step,** tell Yevster in two lines: what was done, and what can now be
     played (a local URL: `npx serve -l 5173 .` then `http://localhost:5173/studio/…`).
     Stop if the step didn't finish, or if `next.md` didn't move.
3. **Verify locally.** Only `close` checks the live site, once.
4. **Efficiency.** You can't measure tokens per step: when the retro asks, say "not
   measured in this tool" rather than guessing.
5. **End** with the steps done, what to play, where the studio is now, and one question:
   how did this run go? File the answer with the `studio-request` skill as a `feedback`
   issue (a verdict as a `verdict` issue) — never as an edit to the working tree — and the
   next retro turns it into a rule or a change (direction rule 8).

Opus-class models only where you can choose (no Fable).
