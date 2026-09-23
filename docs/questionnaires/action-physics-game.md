---
title: "Kameko Studio Questionnaire — Action Physics Game (July 2026)"
type: questionnaire
status: answered
created: 2026-07-21
gates: []
tags: [questionnaire, studio-wide]
---

# Kameko Studio Questionnaire — Action Physics Game (July 2026)

**Related:** [Studio Dashboard](../README.md) · [Roadmap](../roadmap.md) · [Playtest log](../playtest-log.md)

> Answer in chat or edit this file — check a letter, add write-ins freely. Design source with full concept details: [Kameko Studio — Action Physics Directions (July 2026)](../planning/action-physics-directions.md). Each question has a **recommended default** marked ⭐ so you can skip any you don't care about and I'll take the default.
>
> **Status: 🟢 CLOSED — all defaults auto-applied 2026-07-29.** Created 2026-07-21; Q1/Q2/Q3/Q4/Q6 defaults sat unconfirmed but uncontested since creation. **Q5 (2D canvas vs. 3D) was the one genuinely open fork with no safe default** — its own written commitment ("if Q5 is still silent next cycle, its ⭐ default auto-applies") never got a next cycle to fire on, since no morning-brief ran between 2026-07-24 and 2026-07-29. That gap has now closed: Q5-A (Polished 2D canvas) is auto-applied below per that standing commitment. **All six questions now have an accepted answer — the jam is unblocked.** Say "start the action physics jam" (or override any answer first) to kick it off.

---

## Q1 — Which concept jams first?

Pick one (or rank them 1/2/3). Full pitches in the design source.

- [x] **A1 — Slingshot Smash** ⭐ — arena survival; no gun, *speed is your weapon*, slingshot around gravity wells to charge, smash enemy clusters. Fast, physical, reuses BHiO's physics, lowest risk.
- [ ] **B1 — Chain Comet** — tether onto planets and *swing*; the tether charges from the well's gravity for a slingshot boost; traverse a world at speed. The "adventure" pick, bigger swing / bigger risk.
- [ ] **A2 — Well Brawl** — orbital sumo; ram AI rivals out of the arena; eat mass to hit harder but move slower.
- [ ] **C1 — Comet Rush** — high-speed gravity slalom; you pick wells to grab and gravity does the cornering. ⚠️ closest to River Run.
- [ ] Other / write-in (e.g. the calmer **Gravity Lance** flick-combat variant, or a combo): __________

**Notes:** 

---

## Q2 — Action vs. adventure balance?

You said "action and *maybe* adventure." How much adventure?

- [x] **A — Mostly action.** Arena/waves, combat is the point. Adventure = light framing (sectors, upgrades). ⭐
- [ ] **B — Real balance.** A traversal *journey* with combat along the way (points toward B1 + a combat mode / B2).
- [ ] **C — Adventure-forward.** Exploration/route is the point; combat is secondary or optional.

**Notes:** 

---

## Q3 — Control scheme (or leave it to me)?

The single most important thing for feel (the Blob Zapper lesson: a novel-but-awkward control sinks a good game).

- [x] **A — Drag-anywhere thrust** — BHiO's exact drag gesture, but sustained thrust. Familiar from a game you already like. ⭐ (for A1/A2)
- [ ] **B — Tap-to-pulse** — tap where you want to go, craft pulses toward it. Punchier, more arcade-y.
- [ ] **C — Tether tap/hold/release** — the grapple gesture (required for B1/B2).
- [ ] **D — Agent's call** — prototype 1–2 in the jam and pick the best feel; you verdict it.

**Notes:** 

---

## Q4 — Roguelike upgrade layer in the *first* jam?

Between-wave "draft 1-of-3 upgrades" adds depth and replay, but also scope.

- [x] **A — Yes, include a light draft** — it's most of the fun and reuses p3-08 groundwork. ⭐
- [ ] **B — No, keep the jam pure** — just prove the core physics feel is fun first; add upgrades only if it earns a keep.

**Notes:** 

---

## Q5 — Look & tech?

- [x] **A — Polished 2D canvas** — reuse BHiO's trails / lensing / particles / nebula look. Proven, fast, phone-safe. ⭐ *(auto-applied 2026-07-29 per the standing rotation commitment above — override here if you actually want B or C.)*
- [ ] **B — Push for Three.js 3D** — higher visual ceiling, real showpiece, more risk of feeling bad on a phone.
- [ ] **C — Agent's call** — decide by what the concept demands (per `docs/brief.md` Q6=C).

**Notes:** 

---

## Q6 — Pausability for a real-time game — OK?

BHiO already ruled *"auto-pause on blur + short runs is enough; live motion is the point."* A real-time action game inherits that.

- [x] **A — Confirmed, that's fine** — auto-pause on focus loss + short/checkpointed runs. ⭐
- [ ] **B — I want more** — e.g. an explicit big pause button, or hard between-wave rest points only. Specify: __________

**Notes:** 

---

## Q7 — Anything to avoid, or a must-have? (free space)

Vibe, theme, a specific feel you're chasing, or a hard no.

**Notes:** 

---

*Created July 21, 2026. Answers → seeded jam brief + paste-ready jam prompt → Lab jam → playtest verdict.*
