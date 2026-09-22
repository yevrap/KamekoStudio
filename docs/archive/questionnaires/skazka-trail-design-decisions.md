# Skazka Trail Questionnaire — Design Decisions

> **Status: ANSWERED July 22, 2026.** Q1=A (name: Skazka Trail), Q2=A (traditional/collected oral tales only), **Q3=B (pilot tale: Vasilisa the Beautiful / Baba Yaga — overrides the doc's Morozko ⭐ recommendation)**, Q4=A (flag-based hybrid branching), Q5=B (3 endings per tale), Q6=A (keep the real endings, including dark ones), **Q7=A (bare text only for the jam — overrides the Modest-CSS-motifs ⭐ recommendation)**, Q8=A (English only for the pilot), Q9=C + write-in (don't pre-plan the full order beyond the pilot — Vasilisa the Beautiful confirmed first, next tale picked fresh after the verdict), Q10=A (shared story engine + per-tale content packs), Q11=B (defer the mirrored second playthrough to iteration 2), **Q12 new requirement — a way to see the branches**, both a testing/debug view of the story graph and an in-fiction "story so far" page for the player.
>
> Jam brief + `Backlog.md` next, then the pilot jams to the Lab. Ready-to-paste jam prompt is in [Skazka Trail — Concept & Directions](../../games/skazka-trail/plans/concept-and-directions.md).

> Fill this in (~15 min). Mark checkboxes with `x`, type directly into the table/write-ins. ⭐ marks the agent's recommendation, not a pre-picked answer — check whichever option you actually want. See [Skazka Trail — Concept & Directions](../../games/skazka-trail/plans/concept-and-directions.md) for the full rationale behind every option.

## Q1 — Name

- [x] **A** ⭐ — **Skazka Trail** (the working title from the original pitch — keep it)
- [ ] **B** — **Skazki** (simpler, just "fairy tales")
- [ ] **C** — **The Telling** / **Тропа сказок** *("The Tale Trail")*
- [ ] **Write-in:** ______

## Q2 — Source scope

- [x] **A** ⭐ — **Traditional/collected oral tales only** (Morozko, Baba Yaga, Ivan Tsarevich, Sadko, etc.) — safely public domain, no IP question to think about
- [ ] **B** — **Also draw tone/inspiration from Soviet-era literary or animated works** (Volkov, Nosov, Soyuzmultfilm-style aesthetics) — mood only, not lifted characters or scenes
- [ ] **Write-in:** ______

## Q3 — Pilot tale (which one gets jammed first) 🔑

- [ ] **A** ⭐ — **Morozko** — the source tale is already an almost-binary branch (kind/patient vs. rude/impatient), cheapest way to prove the format
- [x] **B** — **Vasilisa the Beautiful (Baba Yaga)** — richer branching (task-trials + a riddle mechanic) but more content to write for a first jam
- [ ] **C** — **The Geese-Swans** — proves the callback-flag mechanic first, since every later tale leans on it
- [ ] **D** — **Ivan Tsarevich and the Grey Wolf** — most ambitious first pick; longest, multi-act
- [ ] **Write-in (a different tale entirely):** ______

## Q4 — The branching mechanic (the core identity) 🔑

- [x] **A** ⭐ — **Flag-based hybrid.** Choices set flags/traits; some scenes route on *accumulated* flags (all three trials, not just the last click), and an early choice can gate a later scene (the callback pattern). Best "felt agency" per unit of writing.
- [ ] **B** — **Pure branching tree.** Every choice leads to a genuinely unique next scene, no shared flags. Narratively purest, but content cost explodes fast as tales get longer.
- [ ] **C** — **Simple end-of-story fork only.** Choices are flavor throughout; only the very last choice picks the ending. Cheapest to build, least "your choices actually mattered" feeling.
- [ ] **Write-in:** ______

## Q5 — Ending count per tale

- [ ] **A** — **2 endings** (clean binary — good/bad, matches Morozko's source shape exactly)
- [x] **B** ⭐ — **3 endings** (adds a middle/mixed outcome — more room for "mostly kind, one slip")
- [ ] **C** — **4+ endings** (richest, but more writing and playtesting per tale)
- [ ] **Write-in / varies per tale:** ______

## Q6 — Tone — how dark to go 🔑

*The original pitch's own words: "warm and a little dark like the originals."*

- [x] **A** ⭐ — **Keep the real endings, including the dark ones** (e.g. Morozko's stepsister can genuinely freeze). Faithful to the source, and the stakes make the good ending feel earned.
- [ ] **B** — **Soften failure endings** (turn back, go home empty-handed, lose the prize) — still a real loss, but nothing fatal.
- [ ] **Varies per tale — agent's call, flag anything that feels like it crosses a line**

## Q7 — Visual bar for the jam

- [x] **A** — **Bare text only** — narration + choice buttons, no visual theming. Cheapest, most tales per session of writing.
- [ ] **B** ⭐ — **Modest CSS motifs** — a color wash / simple shape per scene (snowfall for Morozko, a hut silhouette for Baba Yaga), no illustration pipeline. Matches the studio's Modest bar.
- [ ] **C** — **Full illustration investment up front** — against the Modest-bar norm; only if you're confident before a single tale has a verdict.

## Q8 — Language

- [x] **A** ⭐ — **English only for the pilot** — fastest to jam; RU can follow once the format's proven, same as durak's localization did.
- [ ] **B** — **Russian only**
- [ ] **C** — **Bilingual toggle from the start** (matches durak's convention, but doubles the writing for the pilot)

## Q9 — Anthology order after the pilot

*Proposed order from the concept note: Morozko → The Geese-Swans → Vasilisa the Beautiful → Ivan Tsarevich and the Grey Wolf → (stretch) Sadko → (stretch) Marya Morevna/Koschei.*

- [ ] **A** ⭐ — **Keep the proposed order** (each tale proves one more piece of the engine before the next needs it)
- [ ] **B** — **Reorder — write-in the order you'd actually want:**
- [x] **C** — **Don't pre-plan it — pick the next tale fresh after each verdict**  Vasilisa the Beautiful  first

## Q10 — Engine architecture

- [x] **A** ⭐ — **One shared story engine + a small content-pack file per tale** (same shape as the already-pitched Salon Engine idea). Reusable, and "the anthology grows tale by tale" actually holds up as more tales get added later.
- [ ] **B** — **Bespoke code per tale** — simpler for a single tale, but doesn't scale as an anthology.

## Q11 — The mirrored second playthrough (Morozko's rude stepsister run)

- [ ] **A** — **Include it in the pilot jam** — shows "your choices are actually you" via contrast from day one, but adds scope to the first jam.
- [x] **B** ⭐ — **Defer to iteration 2**, gated on the pilot's own playtest verdict — keeps the pilot jam tight and provable first.
- [ ] **Not interested in a mirrored run at all**

## Q12 — Free space

*A specific tale you want prioritized, a mechanic from another game (CYOA books, Reigns, Fallen London), a hard "don't do this," anything I'm missing.*

- i want some way to see the branches. both for testing and understanding what is going on and also as a sort of page of context. ______

---

*Answers → jam brief + `Backlog.md` in the Skazka Trail folder → jam the pilot tale to the Lab → [Kameko Playtest Log](../../playtest-log.md) verdict. See [Skazka Trail — Concept & Directions](../../games/skazka-trail/plans/concept-and-directions.md) for the full rationale behind every option.*
