# Maze Warden Questionnaire — Design Decisions

> **Status: ANSWERED July 21, 2026 — iteration 1 jammed to the Lab same day.** Q1=A (Maze Warden), Q2=C (run both — p3-08 stays queued, not replaced/absorbed), Q3=A (towers ARE the walls), Q4=A (square grid), Q5=A (permanent upgrade tree, shape for iteration 2), Q6=B (wall migrates + a voluntary Heat knob, both deferred to iteration 2+ — iteration 1 ships the base endless escalation only), Q7=A (one board, endless waves), Q8=A (pure TD, no hero), Q9=D (abstract/neon geometric), Q10=A (minimal 3–5 node tree — but see scope note below), Q11 blank.
>
> **Scope call made in chat, not this note (July 21, 2026):** Yev asked for iteration 1 to be tighter than Q10's own MVP slice — **core loop only, no meta-progression at all** (no permanent tree, no cross-run currency, no persistence, no draft-1-of-3). Q5/Q10's answers govern **iteration 2**, gated on iteration 1 earning a keep/meh signal. Desktop layout: same board centered/letterboxed, not widened (matches Black Hole in One precedent).
>
> **Shipped:** `drafts/maze-warden/` (repo `docs/roadmap.md` **p3-22**). Docs: [Maze Warden](../../games/maze-warden/README.md) (overview) · [Improvements](../../games/maze-warden/ideas.md) · [Maze Warden Questionnaire — Verdict & Direction](maze-warden-verdict-and-direction.md) (open — fill after playing).

## Q1 — Name

- [x] **A** ⭐ — **Maze Warden** (clear, on-genre)
- [ ] **B** — **Nightward** / **Deepward** (atmosphere, Underdark-ish)
- [ ] **C** — **Хранитель / Khranitel** ("the Keeper" — leans into the arcade's Slavic thread, pairs with a folk theme)
- [ ] **D** — Warren · Gloomroot · other from the shortlist
- [ ] **Write-in:** ______

## Q2 — Relationship to the queued one-tower TD (p3-08)

*p3-08 (B1+) is a **one-tower** roguelike with only "light unlocks." This concept is a **maze-building** roguelike with a full Hades-style meta-tree — bigger and different.*

- [ ] **A** ⭐ — **This replaces p3-08.** The maze + deep-meta version is the TD I actually want; retire the one-tower row.
- [ ] **B** — **Absorb p3-08 into this.** Keep the one-tower idea as an early-game / one-tower *mode* inside Maze Warden.
- [x] **C** — **Run both, this first.** They're different enough to be two games; jam Maze Warden now, keep p3-08 queued behind it for another time.
- [ ] **D** — **Keep p3-08 as-is, park this.** Not now.
- [ ] **Write-in:** ______

## Q3 — The maze mechanic (the core identity) 🔑

- [x] **A** ⭐ — **Towers ARE the walls (full maze-building).** You shape the path by where you place; enemies take the shortest open route; you can never fully seal the core. This is the Underdark hook and the whole point.
- [ ] **B** — **Fixed path + tower placement (classic Kingdom Rush TD).** The path is drawn; you place towers beside it. Simpler, but loses the maze-building Yev asked for.
- [ ] **C** — **Hybrid — some fixed choke points, some open cells you maze.** A drawn skeleton with open zones you shape.
- [ ] **Write-in:** ______

## Q4 — Grid shape

- [x] **A** ⭐ — **Square grid.** Easiest to build, cleanest touch targets on a phone, fastest to a playable jam.
- [ ] **B** — **Hex grid (Underdark-faithful).** More authentic to the mobile reference, but hex pathfinding + hex touch on a phone are extra risk — better as a later mode than in the jam.
- [ ] **No preference — agent's call for the MVP** (recommendation: square first, hex as a post-verdict mode)
- [ ] **Write-in:** ______

## Q5 — Meta-progression shape (the "stronger every run" layer)

- [x] **A** ⭐ — **Permanent upgrade tree (Hades' Mirror of Night).** Bank a currency on death, spend on nodes: +start gold, +core HP, cheaper walls, unlock new tower types into the pool, draft re-rolls. Persistent in `localStorage`.
- [ ] **B** — **Unlock-new-cards only (p3-08's "light unlocks").** No stat tree — just new towers/upgrades joining the draft pool after milestones. Lighter.
- [ ] **C** — **God-Mode auto-easing only.** Each death makes you passively a bit stronger, no shop to manage. Simplest, most accessible.
- [ ] **D** ⭐⭐ — **A + C together:** a spendable tree *and* a gentle automatic ramp when you keep dying (the fullest "gets easier every run" feel).
- [ ] **Write-in:** ______

## Q6 — The difficulty curve — *"easier at first, then harder in late game"* 🔑

*This is your subtlest ask. Which reading do you mean?*

- [ ] **A** ⭐ — **The wall migrates.** Meta-progression flattens the early waves (they get easier and easier over runs) while endless late-game scaling steepens the late waves. The hard part moves later and later; it never disappears. Happens automatically, no knob.
- [x] **B** ⭐⭐ — **A, plus a voluntary "Heat" knob (Hades' Pact of Punishment).** Once you can clear runs, you can *choose* to stack modifiers to make the late game harder for bigger rewards. The deliberate "harder endgame."
- [ ] **C** — **A valley within a single run.** Each run starts hard, a mid-run power spike makes it easy, then a final surge spikes it again. Meta is separate from this.
- [ ] **D** — **Keep it simple — just endless escalation.** "Easier at first" only means relative to how strong the meta-tree has made you. No extra systems.
- [ ] **Write-in:** ______

## Q7 — Run structure

- [x] **A** ⭐ — **One board, endless escalating waves** (survive as long as you can; a run is 5–10 min). Leanest, and the natural jam MVP.
- [ ] **B** — **A sequence of 3–5 short chambers + a boss (Hades' descent).** More variety and arc, but multiple boards = bigger scope; better as a post-verdict evolution.
- [ ] **C** — **Fixed N-wave run with a boss at the end** (clear it = win the run, then Heat/harder tier next time).
- [ ] **Write-in:** ______

## Q8 — A hero, or pure TD?

- [x] **A** ⭐ — **Pure TD, no hero** for the MVP — keep the jam focused on the maze + meta fusion.
- [ ] **B** — **One tappable hero-sortie ability** (a cooldown power you drop on the board — the Kingdom Rush itch as an ability, and where p3-08's hero folds in). Cheap to add.
- [ ] **C** — **A controllable hero that fights alongside the towers (Hades-style).** Most ambitious; changes the input model — post-verdict, not the jam.
- [ ] **Write-in:** ______

## Q9 — Theme / setting

*The arcade's stated draw is nostalgia + cultural connection (durak, tysiacha, домовой modifiers). Theme also names the meta-currency (embers? darkness? obereg?).*

- [ ] **A** — **Underdark-style dungeon / dark fantasy** (matches the reference directly).
- [ ] **B** ⭐ — **Slavic folk / нечисть.** You're a хранитель warding a дом/изба against night spirits crawling the forest maze; currency = обереги or embers. On-brand for the arcade's cultural thread and a real differentiator.
- [ ] **C** — **Sci-fi / space** (would sit visually near Black Hole in One — maybe too close).
- [x] **D** — **Abstract / neon geometric** (cheapest to make look cool, no art dependency).
- [ ] **No preference — agent's call**
- [ ] **Write-in:** ______

## Q10 — How much of the meta layer goes in the *jam* MVP?

*The jam is a Lab prototype at the Modest bar — just enough to feel the loop and earn a verdict.*

- [x] **A** ⭐ — **A minimal 3–5 node tree** so the "next run starts easier" feeling is real in the prototype (recommended — the meta *is* the hook; without it you can't judge the fusion).
- [ ] **B** — **No meta in the jam** — prove the maze + waves are fun first, add meta only if it earns a keep verdict.
- [ ] **C** — **Full meta-tree in the jam** — go big up front. *(Against the Modest-bar norm; only if you're confident.)*
- [ ] **Write-in:** ______

## Q11 — Free space / anything I'm missing

*A specific tower or enemy you want, a feel to chase, a mechanic from another game, a hard "don't do this," a wilder idea for the difficulty curve — anything.*

- ______

---

*Answers → jam brief + `Backlog.md` in the Maze Warden folder → jam the MVP to the Lab → [Kameko Playtest Log](../../playtest-log.md) verdict. See [Maze Warden — Concept & Directions](../../games/maze-warden/plans/concept-and-directions.md) for the full rationale behind every option.*
