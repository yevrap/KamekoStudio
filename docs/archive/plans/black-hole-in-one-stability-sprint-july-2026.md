# Black Hole in One — Stability Sprint (July 2026)

> **Status: ✅ COMPLETE — feature freeze LIFTED (July 16, 2026).** All six STAB items shipped and verified live; core golf loop proven healthy (hole 1: 51/300 tee shots sink; golf never zooms; no soft-lock). Overview: [Black Hole in One](../../games/black-hole-in-one/README.md) · backlog: [Improvements](../../games/black-hole-in-one/ideas.md) · repo `games/black-hole-in-one/`.
>
> **Theme (met): stop, stabilize, decide — no new features.** The three arcs ([Black Hole in One — Style & Stats Sprint (July 2026)](../../games/black-hole-in-one/plans/style-and-stats-sprint.md), [Map Maker](../questionnaires/black-hole-in-one-map-maker.md), [Open World](../../games/black-hole-in-one/plans/open-world.md)) were paused for the sprint and are now free to resume — **one at a time**. Recommended re-entry: Style & Stats (lowest risk).

## Why this sprint — the diagnosis

On July 15, 2026 the game took **13 commits in a single day** (git log below), stacking **three feature arcs at once** on top of a game that had *just* been promoted from the Lab that morning:

| Arc | What landed | State |
|---|---|---|
| **Orbits (v27, BH-4)** | live station-kept orbit + force-push flick | shipped, but breaks the "one screen, no camera" pillar → STAB-2 |
| **Map Maker** | editor core, URL share, local saves, import, mobile fixes | shipped, but mobile drag/delete still broken → STAB-3; menu bloated → STAB-4 |
| **Open World "Explore"** | OW-1 explore mode + OW-2 seeded sector/culling | **only 2 of 4 sprint items**; OW-3/OW-4 not built → STAB-5 |

Yev's read: *"a lot of features were added but it all got a little out of control."* The four raw inbox notes are all downstream symptoms — a trapped comet, an unreadable orbit, a flaky mobile editor, an incoherent menu. None is a one-off bug; together they say the surface area outran the polish.

```
dc47044 URL share onboarding (UI-4)      ┐
7ab5bdd clearer menu button (UI-2/3)      │
92db574 hide HUD on start screen (UI-1)   │
87f2be2 URL map import/export (MM-10)     │
eae237b mobile layout wrapping (MM-9)     ├ all 2026-07-15,
3ec8254 mobile deletion + pulsar (MM-5/8) │  same day
a8eeb68 orbit camera lock (MM-4)          │
f396241 custom map URL share (MM-3)       │
ff95686 local saves (MM-2)                │
6296f2b Map Maker editor core (MM-1)      │
97bdf38 Explore + sector/culling (OW-1/2) │
4dfb217 orbit-and-flick (BH-4)            │
ab176d8 promote draft → arcade (p3-10)    ┘  ← game was a clean draft this morning
```

## The freeze rule

**No new-feature commits on Black Hole in One until STAB-1…6 are closed.** That means paused, not cancelled:
- **Style & Stats sprint (BH-1/2/3)** — paused. Resumes after stability.
- **Open World Sprint 2+ (OW-2b/3/4 and beyond)** — paused. STAB-5 decides what happens to the already-shipped Explore mode in the meantime.
- **Remaining Map Maker items (MM-6/7/11/12/13)** — paused. STAB-3 fixes the *existing* editor first; new editor features wait.

Fixes, root-causes, and tests are the only work that ships this sprint.

## Open decisions — ✅ ANSWERED July 16, 2026

| | Answer | Consequence |
|---|---|---|
| **D1 — big-planet escape** | **C** — keep big planets, guarantee escape, no new mechanic | → STAB-1 = **liftoff grace** (no size cap). **✅ Shipped `044336a`.** |
| **D2 — golf-mode zoom** | **b** — gentle temporary zoom-out while orbiting / hugging a large body | → STAB-2 builds the real camera path (size cap won't dissolve it, since D1≠a). |
| **D3 — Explore mode** | **c** — keep it a first-class mode as-is | → STAB-5 resolves to "no demotion"; STAB-4 still declutters the menu around it. |

*(Raw inline answers preserved in the D1/D2/D3 blocks below.)*

### D1 — How should a comet escape a too-big planet? (drives STAB-1)
The deep-well problem is real: `m = r²`, radius to ~15, and `MAX_V 175` caps a single flick. Options:
- **(a) Cap generator mass/size** so one max-power flick *always* escapes the biggest planet it can spawn. Cheapest, invisible, preserves "no camera." **← recommended, and it also dissolves half of D2.**
- **(b) One-shot booster** — a second in-flight impulse the player can spend to break free. New mechanic, new UI, more surface area (against the spirit of this sprint).
- **(c) Guarantee multi-flick escape** — keep big planets, just make sure repeated flicks from the surface reliably walk you out (verify gravity doesn't instantly re-capture). No size change, no new mechanic.
- ✍️ **Answer:**C

### D2 — Do golf modes get a zoom, or stay camera-free? (drives STAB-2)
The one-screen, no-camera framing is a **core design pillar** ([Black Hole in One](../../games/black-hole-in-one/README.md) "One screen per hole, no camera"). Orbits and big planets strain it. Options:
- **(a) No zoom — cap sizes (D1a) so nothing ever needs it.** Keeps the pillar intact. **← recommended if D1 = (a).**
- **(b) Gentle temporary zoom-out** only while orbiting / hugging a large body, snapping back on release; default framing otherwise unchanged. Readable, but adds a camera path to golf modes.
- **(c) Leave as-is** — accept that orbits around big bodies are cramped.
- ✍️ **Answer:** b

### D3 — What happens to the half-built Explore mode during the freeze? (drives STAB-4/STAB-5)
Explore is 2 of 4 sprint items, sitting as a first-class menu button. Options:
- **(a) Label it "🧪 experimental" / tuck it into a secondary spot** so the menu leads with the finished golf game; Explore stays playable. **← recommended.**
- **(b) Park it entirely** (remove from menu) until the Open World arc formally resumes.
- **(c) Keep as a first-class mode** as-is.
- ✍️ **Answer:**c

## Sprint items — agent-shippable

Each mirrors the STAB item in [Improvements](../../games/black-hole-in-one/ideas.md); Done-when lives there. Summary:

| # | P | Item | Blocked on |
|---|---|---|---|
| ✅ **STAB-1** | P0 | ~~Big planets trap the comet~~ — **shipped `044336a`** (liftoff grace) | D1=C |
| ✅ **STAB-2** | P1 | ~~Orbit / large body zoom-out~~ — **shipped `4d1f6fc`** (fitZoom + orbit camera centre) | D2=b |
| ✅ **STAB-3** | P1 | ~~Map Maker drag + delete unreliable on mobile~~ — **shipped `8c418cc`** (missing sfx.pop + pointercancel id) | — |
| ✅ **STAB-4** | P1 | ~~Start menu / mode select overloaded~~ — **shipped `0e8450e`** (missing `.hidden` rule + reworded arrival + grouped modes) | — |
| ✅ **STAB-5** | P1 | ~~Scope call on Explore~~ — **resolved keep-as-is (D3=c)**; no demotion | — |
| ✅ **STAB-6** | P2 | ~~Regression coverage~~ — **shipped `f34782f`** (map serialize round-trip + editor/zoom/escape tests, 256 total) | — |

## Recommended order

1. **Answer D1–D3** (5-minute call, unblocks half the sprint).
2. **STAB-1** (P0 — the core golf loop is currently breakable). If D1 = (a) it's a generator tweak + a test.
3. **STAB-2** falls out of D2 — if (a), it's *already done* by STAB-1's size cap (just verify + note it); if (b), it's the one new bit of camera code, unit-tested.
4. **STAB-3** as a proper `dev-fix` — reproduce on a mobile-emulated browser first, root-cause the pointer/hit-test path, then the smallest safe fix + regression coverage. Do **not** patch blind (MM-5/MM-8 already did that and it didn't hold).
5. **STAB-4 + STAB-5 together** — one menu-IA pass that both declutters mode select and lands the D3 decision on Explore.
6. **STAB-6** last — backfill headless tests for map serialize/deserialize, editor state transitions, and the STAB-1 escape guarantee.

Ship each via `dev-ship` (test → commit → push → verify live at https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/). Log every one in [Dev Log](../dev-logs/black-hole-in-one.md) and move it to **Shipped** in [Improvements](../../games/black-hole-in-one/ideas.md).

## Exit criteria — ✅ all met (July 16, 2026)

- ✅ All six STAB items in **Shipped**; `node --test` (256) + `npm run smoke` green; verified in-browser at 375px.
- ✅ The start menu reads cleanly (Play / Make & explore groups) and the shared-map arrival is plain-language and only appears for `?map=` links.
- ✅ No soft-lock: an aim search sinks hole 1 on **51/300** tee shots; the STAB-1 liftoff grace cut instant re-captures on the biggest planet; big-body orbits get the STAB-2 zoom-out and golf never zooms.
- ✅ Dev Log records the STAB-3 root cause (missing `sfx.pop` + `-1` pointercancel id) and the STAB-6 coverage that closed the gap.

**Freeze lifted.** Resume **one** arc at a time (this sprint exists because three ran in parallel): **Style & Stats** is the lowest-risk re-entry; **Open World** is the biggest but needs its own scope pass first; remaining **Map Maker** items (MM-6/7/11/12/13) are now unblocked too.

---

*Created July 15, 2026 in response to Yev's "get this game back on track" call. Feeds [Improvements](../../games/black-hole-in-one/ideas.md); pauses [Black Hole in One — Style & Stats Sprint (July 2026)](../../games/black-hole-in-one/plans/style-and-stats-sprint.md) and [Black Hole in One — Open World Build Plan](../../games/black-hole-in-one/plans/open-world.md).*
