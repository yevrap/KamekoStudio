# Maze Warden Questionnaire — Iteration 8 Direction

> **Status: Q1–Q3 answered (Q3 auto-resolved to default 2026-07-30), Q4 free space still open — asked 2026-07-22.** Triaged from a fresh raw note at the top of [Improvements](../games/maze-warden/ideas.md): *"Too much blinking animation on towers that slow maybe? I want to rethink the shooting mechanic. I don't want to end up like Bloons TD where at the end it's too much and doesn't make sense and look good and with so much stuff going on it's hard on performance."* This is the first post-promotion pass on the live `games/maze-warden/` build (promoted 2026-07-21 after iteration 7's Keep verdict).
>
> This note splits into two halves: a **root-caused, already-scoped visual/performance fix** (no decision needed — see Improvements.md's Iteration 8 Backlog, ready to ship) and **genuinely open design questions** below that only Yev can settle before a deeper "shooting mechanic" rework starts.

## Diagnosis, grounded in the shipped source (`games/maze-warden/gameplay.js`)

**The "blinking" is real and has two separate causes, both root-caused — no guessing needed:**

1. **Towers never sit still.** 🟦 Spire's diamond shape and 🟡 Volt's spiky star are redrawn every single frame at a continuously advancing rotation angle (`state.time * 0.6` for Spire, `state.time * 1.4` for Volt — `drawTower()`, gameplay.js:682–700) — regardless of whether the tower is firing, has a target, or is just sitting idle between waves. With a maze full of towers all rotating at independent, unsynchronized phases, the board reads as constantly shimmering/busy even when nothing is actually happening — this is almost certainly what "too much blinking" refers to, not a literal flash effect.
2. **Every tower and enemy pays full glow cost every frame, unconditionally.** `ctx.shadowBlur` (one of Canvas 2D's most expensive per-draw operations) is set and re-rendered for **every tower** (gameplay.js:679–680), **every enemy** (gameplay.js:749), and the core itself (gameplay.js:625–638, plus a `radialGradient` rebuilt from scratch every frame) — even a full-health, undamaged, non-firing tower pays this cost every single frame. Late in a run, with dozens of towers and 100+ enemies alive at once, this is a direct, compounding performance cost — the "hard on performance" worry is grounded, not hypothetical, and it will only get worse as the board fills up (exactly the shape of the Bloons complaint).

**Both of these are being fixed unconditionally as Iteration 8's Backlog** (see [Improvements](../games/maze-warden/ideas.md)) — replacing idle rotation with a static default + a brief fire-triggered "kick" animation, and caching/cheapening the glow instead of recomputing it live every frame. **No questionnaire answer is needed to ship that part.**

**A third, smaller finding, also being shipped without a question:** 🟡 Volt Coil's shots are currently visually and sonically **identical** to 🟦 Spire's — `fireVolt()` (gameplay.js:380–386) pushes the exact same `kind: 'spire'` projectile and calls the exact same `audio.shootSpire()` cue as Spire itself. The two towers only differ in speed/damage numbers you can't see mid-fight — you can't actually tell Volt is firing versus Spire by watching or listening to the board. Giving Volt its own shot identity is a concrete, scoped piece of "rethinking the shooting mechanic" purely on the legibility axis, independent of any deeper mechanic change below.

**What's genuinely open — and why it needs your call:** "rethink the shooting mechanic" could mean anything from "just make it readable" (covered above) to "change how targeting/combat actually works" to "simplify what's on screen even if it costs some visual variety." Those are different amounts of work pointing in different directions, and only one of them is a pure legibility fix agents can just ship. The questions below are about the second kind.

## Q1 — Does the diagnosis above cover what you were feeling, or is there more?

- [ ] **A ⭐ Yes — that's exactly it.** The constant tower rotation + glow is the "blinking," and the perf worry is about the same thing compounding late-game. Once Iteration 8's fix ships, re-test before deciding anything else.
- [x] **B — That's part of it, but the shooting mechanic itself also feels flat/repetitive**, separate from the visual noise — say more in Q2/Q4.
- [ ] **C — Something else entirely** — describe it in Q4.

## Q2 — If the mechanic itself needs a rethink (not just the visuals), which direction? 🔑

*Check as many as apply — these aren't mutually exclusive, but Q3 asks you to prioritize.*

- [ ] **A — Just the legibility fixes above are enough for now.** Ship Iteration 8, re-test, and only revisit the mechanic itself if it still feels flat afterward.
- [ ] **B — Give the player a real targeting choice per tower** (e.g. tap a built tower's action sheet to cycle Closest-to-core / Strongest / First-in-range, instead of every tower always defaulting to closest-to-core). Adds an actual decision without adding new visual effects — same rendering cost as today.
- [ ] **C — Simplify before adding: fewer distinct simultaneous effect types, on purpose**, even if it costs some tower-to-tower visual variety — explicitly trading spectacle for a calmer, more readable board (the direct anti-Bloons move).
- [ ] **D — Make Frost Prism's AoE telegraph clearer** — right now the same expanding ring plays for both "this is where the shot is flying to" and "this is who just got hit and slowed," which can read as one ambiguous effect rather than two distinct moments (fire → impact).
- [x] **E — Write-in:** i don't like the circle always blinking

## Q3 — Standing guardrail: what hard rule should cap visual complexity as the game grows?

> **Auto-resolved to default (a) 2026-07-30** — 8 days unanswered across the morning-brief rotation (surfaced 2026-07-22, flagged as a 3-day rotation candidate 2026-07-29 per its own written commitment). **A — hard cap on simultaneous rendered effects** applies: a global particle/effect ceiling with oldest-first eviction, same style as Iteration 8's particle-cap item — effects can still happen, they just can't pile up unbounded. Same pattern already used for the BHiO New Map question and the Action Physics Q5 default. Say so here if you actually wanted B/C/D instead — nothing is irreversible, this just stops the question from resurfacing daily. Iteration 8's actual ship-now fixes (rotation/glow/Volt-identity/particle-cap/lane-offset) never waited on this either way — see the Backlog's ready-to-paste prompt.

*This is the actual "don't become Bloons" question — a rule to bake into the project's design decisions so any future tower, enemy, or ability change gets checked against it, not just this pass.*

- [x] **A ⭐ A hard cap on simultaneous rendered effects** (e.g. a global particle/effect ceiling with oldest-first eviction — the same style already shipping in Iteration 8's particle-cap item) — effects can still happen, they just can't pile up unbounded.
- [ ] **B — "Reduce, don't add" bias** — any future tower/enemy that would need its own new *always-on* visual state (like the constant tower rotation being removed now) needs a specific justification, not a default yes.
- [ ] **C — A frame-time budget, checked in practice** — e.g. a documented "stress-test at N towers / M enemies before shipping any new visual effect" step added to this project's ship checklist.
- [ ] **D — Some combination of the above — say which:**
- [ ] **E — Write-in:**

## Q4 — Free space

Anything the above doesn't cover — a specific moment that felt too busy, a tower/effect you'd cut outright, or how far this needs to go before the board feels calm to you:

-

---

*Answers here scope Iteration 9 (any mechanic-level shooting rework) — Iteration 8's visual-noise/performance/Volt-identity fixes are already scoped and don't wait on this. See [Improvements](../games/maze-warden/ideas.md) for the full backlog and the ready-to-paste ship prompt.*
