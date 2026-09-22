# Kameko Studio — Settings & Automation Cleanup Sprint (July 2026)

> **Status: COMPLETE (July 12, 2026) — all sprints 0–4 shipped same day, plus a follow-up bugfix pass.** Audit done July 12, 2026; questionnaire fully answered same day (all decisions below); surface shrink (p1-29 + p1-30) shipped in `e56cad2` (v15); Sprints 1–4 shipped through `a8e615c` (v16). The Watch Mode rollout (Sprint 3) needed two rounds of fixes: same-day take-over fixes (`204f9bc`, `b362a8c`), then Yev's playtest found keypad-quest and river-run still broken — root-caused and fixed as **b-28** (`282b28f`, v17): the shared drawer only wrote localStorage, invisible to games that mirror the flag in live state; plus a synthetic-event self-abort in keypad-quest and a script-order bug that hid river-run's drawer sections entirely. Details: Dev Log. A browser e2e suite (`npm run e2e`) now guards the watch flows; expansion to all games is roadmap p1-36. Open follow-ups: b-26 (dead auto-restart switch — question for Yev in [Improvements](../../planning/ideas.md)), b-27 (token residue sweep). Consumed questionnaire archived: [Kameko Studio Questionnaire — Settings, Automation & Tokens](../questionnaires/kameko-studio-settings-automation-and-tokens.md).

## Decisions (questionnaire answered July 12, 2026)

| Q | Decision | Consequence |
|---|---|---|
| Q1=A | Auto modes are **attract modes** — a "▶ Watch" entry point per game, not persistent settings | p1-32 becomes "Watch Mode" (Sprint 3) |
| Q2=B | Automation controls live in the **drawer only** — durak's setup-screen duplicates go away | Combined with Q1=A: ▶ Watch button on start screens *starts* the mode; the drawer carries a single Watch section **visible only while watching** (speed/reveal/auto-restart/stop). This synthesis is recorded here because A and B textually conflict — veto in this note if wrong. |
| Q3=A | One control idiom: switch rows for on/off, segmented pickers for multi-choice, quick-action buttons only for actions | Applied in Sprint 3; label-flipping buttons retired |
| **Q4=E** | **Remove the token system entirely** (Yev's write-in: "I want it all to be free… I don't want it") | Everything becomes free to play. p1-33 becomes the removal item (Sprint 2); p1-06 rescoped to a free hint; p2-32 cosmetics lose the purchase model |
| Q5=B | Update banner deferred out of active play; manual Check button stays; add Simulate Update dev button | p1-34, Sprint 4 |
| Q6=A | One drawer, clearer grouping — game sections on top, one compact visually distinct "Arcade" cluster | New p1-35, Sprint 4 |
| Q7=B | Lab games keep their current drawer sections | Decision recorded, **no work** |

**Context:** The July 11 Settings Drawer Recovery sprint ([Kameko Studio — Settings Drawer Audit & Sprint (July 2026)](kameko-studio-settings-drawer-audit-and-sprint-july-2026.md), archived) fixed the drawer's structure. But the *same two days* also shipped Auto Play visualizers to six games (p2-22…p2-27), each adding 2–4 persistent controls — and Yev's July 12 verdict is that settings are cluttered again: game settings, arcade settings, app-update UI, tokens that "do nothing for now," and auto modes all competing for space. This note is the audit of the current settings surface (verified against the repo at this repo, July 12) and the plan for the cleanup sprint.

Roadmap rows live in the repo: `docs/roadmap.md` (b-19, b-20 now; p1-32, p1-33, p1-34 blocked on the questionnaire).

---

## Finding 1 — The automation controls shipped in one sprint, six different ways

The Auto Play visualizers were built game-by-game with no shared spec. The result, per game:

| Game | What it's called | Control idiom | Where it lives | Speed | Reveal hands | Auto-restart |
|---|---|---|---|---|---|---|
| durak | "Auto Play Visualizer" (setup) / "Automation" + "🤖 Turn on Auto Play" (drawer) | label-flipping buttons + segmented speed | **both** setup screen and drawer, duplicated & synced | 3-speed | yes (autoplay-only) | yes (setup screen only) |
| tysiacha | "Simulated Tournament" / "Auto Play Visualizer" | switch rows | drawer only | binary Fast Forward (p2-28 → 3-speed) | no (p2-28 open) | yes |
| keypad-quest | "Auto Play (Virtual Typist)" | segmented mode-buttons | drawer + "Spectate" button on start menu | 3-speed | n/a | not persisted |
| materials-run | "👁️ Auto-Play" | switch rows | drawer + "Spectate" button on start menu | none | n/a | yes |
| blob-zapper | "🤖 Turn on Auto Play" | label-flipping buttons | drawer only, section titled "Blob Zapper" | none | n/a | yes |
| river-run | "Auto-Shoot" + "Auto-Avoid" (assists, not a mode) | switch rows | drawer only | none | n/a | no |

Three different names for the same concept ("Auto Play Visualizer", "Simulated Tournament", "Virtual Typist"), three placements, and **three control idioms for a boolean** (label-flipping button, switch row, segmented button). Durak alone maintains duplicate controls on two screens with a sync function.

The deeper issue is **identity**: Yev has called these "visualizers *or* tutorials." If they're attract modes (something cool to watch), they should be an entry point — a "▶ Watch" button — not four persistent settings per game. If they're tutorials, they belong with the coach. If they're player assists (river-run's auto-shoot genuinely is one), they're settings. The questionnaire's Q1–Q3 decide this; **p1-32** implements it.

## Finding 2 — The token economy is circular, and its UI is pure overhead right now

- Every game charges 1 🪙 to start; finishing earns 1 back (2 on a personal best) — net zero.
- The drawer's faucet button hands out free tokens anyway, in every game.
- **No real sink has shipped.** Hidden-object's hint cost (p1-06) and durak's cosmetics (p2-32) are still open.

So the player-visible surface — token row + faucet in every drawer, "no tokens" toasts, `· 1 🪙` cost labels — currently gates nothing and rewards nothing. Yev: "tokens that do nothing for now but maybe will eventually." Q4 decides the direction (make them real / keep / pause the gate / hide the UI); **p1-33** implements it.

## Finding 3 — App-update UI: two paths, and the banner can interrupt play

The version system ([PWA Versioning Plan](pwa-versioning-plan.md), archived) works, and p1-19 already folded version + Check for Updates into the collapsed ⚙️ App disclosure. Remaining clutter:

- Two parallel update paths: the auto banner (fires on any tab-return via `visibilitychange`/`pageshow` — including **mid-game**) and the in-drawer Check button with its own result box.
- The planned "Simulate Update" dev-mode button was never implemented, so the banner flow is untestable without a real deploy.

Q5 decides how quiet this should get; **p1-34** implements it.

## Finding 4 — Hygiene drift resumed the day b-15 shipped

The visualizer sprint landed new localStorage keys the same day the key-coverage fix (b-15) shipped, so both trackers are stale again:

- `clearAllGameData` (shared/settings.js) misses: `durak_autoRestart`, `blobZapper_autoPlay`, `blobZapper_autoRestart`, `tysiacha_autoPlay`, `tysiacha_fastForward`, `tysiacha_autoRestart`, `keypadQuest_autoPlay`, `keypadQuest_autoPlaySpeed`.
- CLAUDE.md's localStorage table misses those plus `durak_autoPlay`, `durak_autoPlaySpeed`, `durak_revealHands`, `materialsRun_autoPlay`, `materialsRun_autoRestart`.
- `keypadQuest_customDeck` is still read in keypad-quest code but documented nowhere (legacy migration leftover?).
- river-run's `muted` key is unnamespaced (any other game adding sound would collide).

This will keep drifting after every ship unless a **guard test** enforces it (scan `games/*/` for localStorage keys, assert each appears in `clearAllGameData` or an explicit allowlist). That's **b-19** — no decisions needed.

## Finding 5 — river-run still uses the forbidden drawer lifecycle

river-run registers its section on `settingsOpened` and removes it on `settingsClosed` — the exact pre-b-14 anti-pattern CLAUDE.md now forbids ("never remove sections on settingsClosed"). It works by accident. Migrating it is **b-20**, best done with or just before the b-01 module split (the game is still a ~1000-line inline monolith).

## Finding 6 — the drawer serves 10 games; the arcade is about to have 7

The quick switcher lists all 10 games, including the three durak-likes headed to the Lab (p1-29) — that item already covers shrinking the switcher. Related open question: what settings convention do Lab games keep (Q7)? And the drawer's arcade chrome (switcher, tokens, theme, gallery, App) still trails every game's own sections — Yev's inbox item "Game settings separated from arcade-wide settings?" is Q6.

---

## The sprint sequence (the active plan — July 12, 2026)

**✅ Sprint 0 — Surface shrink** *(shipped July 12, `e56cad2`, v15)*: p1-29 durak-likes → Lab, p1-30 waterfall deleted. Gallery + switcher = 7 invest games.

**Sprint 1 — Hygiene** *(next up; no dependencies, ship any time)*

| ID | Item | Effort |
|---|---|---|
| **b-19** | Settings-key hygiene: cover the automation keys in `clearAllGameData` + CLAUDE.md table, resolve `keypadQuest_customDeck`, add the **guard test** so key drift can't recur | S |
| **b-20** | river-run: migrate drawer section to the b-14 lifecycle (register once at boot) | S |
| *(b-17)* | *rider: root-gallery favicon 404* | S |

**Sprint 2 — Free Arcade (token removal, Q4=E)** — **p1-33**, effort L. Remove the token system end to end: entry gates (`spend()` + `▶ Play 1🪙` labels → `▶ Play`), earning (`earn()` calls + toasts in every game), the drawer token row + faucet, gallery header count, `KamekoTokens` global, `tokens`/`tokenHistory` storage (one-time cleanup on load), plus the Token System / Token Gate doc sections and localStorage-table rows (GEMINI regenerated). Sweeps the roadmap: p1-06 becomes a **free** hint, p2-32 cosmetics lose the purchase model, p2-02's "bonus tokens" reward framing dies. Do this **before** the UI sprints — it shrinks the drawer and start screens everywhere. Keep the b-19 guard test green through the removal.

**Sprint 3 — Watch Mode (automation unification, Q1=A + Q2=B + Q3=A)** — **p1-32**, effort M–L. One feature, one name, everywhere: a **"▶ Watch"** button on each start screen (durak, tysiacha, keypad-quest, materials-run, blob-zapper) starts the attract mode; one consistent **Watch section in the drawer, visible only while watching** (speed segmented picker, reveal-hands switch where applicable, auto-restart switch, "take over / stop" action). Durak's setup-screen Automation block is removed (Q2=B); label-flipping buttons retired arcade-wide (Q3=A); p2-28 (tysiacha 3-speed + reveal) folds in as the tysiacha slice. Consider a shared drawer helper in `shared/settings.js` so the five games stop hand-rolling the same rows. River-run's Auto-Shoot/Auto-Avoid stay as player-assist settings (its real Watch mode arrives with p2-29 later).

**Sprint 4 — Drawer & update polish (Q5=B + Q6=A)**

| ID        | Item                                                                                                                                                                    | Effort |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **p1-34** | Update UX: banner defers to menu/game-over/gallery (never mid-play); manual Check button stays; do not add the missing "Simulate Update" dev button - i don't this idea | S      |
| **p1-35** | Drawer regroup: game sections on top, then ONE visually distinct compact "Arcade" cluster (switcher · theme/gallery · ⚙️ App — token row already gone after Sprint 2)   | S–M    |
| **b-16**  | rider: drawer scroll affordance + reset-on-open                                                                                                                         | S      |

Q7=B recorded: Lab games keep their drawer sections — no work.

**Definition of done for the whole plan:** everything free to play with zero token residue; automation reads as one "Watch" feature; every drawer = game sections + one compact Arcade cluster; updates never interrupt play; no undocumented localStorage keys (guard test green); Yev re-plays and logs a verdict in [Kameko Playtest Log](../../playtest-log.md).

---

Related: [Kameko Studio — Settings Drawer Audit & Sprint (July 2026)](kameko-studio-settings-drawer-audit-and-sprint-july-2026.md) (the July 11 predecessor — structure) · [Kameko Studio — Auto Play Visualizers](kameko-studio-auto-play-visualizers.md) (how the auto modes were built) · [PWA Versioning Plan](pwa-versioning-plan.md) (update system design) · [Improvements](../../planning/ideas.md) (the "settings separated?" and tokens inbox items absorbed here)
