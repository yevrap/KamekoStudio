# Kameko Studio — Dev Log

> Ship-session log, newest first. What shipped, commits, where to verify. Roadmap lives in the repo at `docs/roadmap.md`.

## 2026-07-22 — Skazka Trail: third tale jammed — The Geese-Swans

**Shipped** (commit `a7f36e9`, deployed): the session initially held on picking a third tale, correctly, because Morozko's Playtest Log entry was only an agent self-check, not Yev's own played verdict (see the entry below). Yev then said directly he doesn't use that log as a hard gate and to stop blocking on it, so this tale was picked and built on that explicit go-ahead rather than a played "keep" — the Morozko (and now Geese-Swans) played verdicts remain genuinely open questions, they just don't block the next build anymore per Yev's own steer.

- **Picked The Geese-Swans**, weighed the same way as Morozko: cheapest of the remaining candidates (vs. the longer, more ambitious Ivan Tsarevich, or the stretch picks Sadko/Marya Morevna), and the first to exercise a flag set early silently changing the *outcome* of an identical-looking choice much later — distinct from Vasilisa's "flag unlocks a new option" gate and Morozko's "single accumulated total" ending split.
- **`tales/geese-swans.js`** — `engine.js` untouched. 15 nodes: setup (brother taken by the geese-swans) → three outbound encounters (stove/tree/river, each accept-and-thank vs. refuse, setting `kindStove`/`kindTree`/`kindRiver`) → Baba Yaga's hut (grab brother, flee) → chase begins → three return encounters (same three helpers, in reverse) → `resolution` → one of 3 endings.
- **The mechanic:** the return-leg nodes don't re-branch the story graph — each one's `text` is a function of flags, keyed to its matching boolean (the same dynamic-flavor-text pattern as Vasilisa's `dollHelp`), so an earlier refusal is felt as a near-miss on the way back rather than a flat retelling. `resolution` sums all three booleans and routes via three mutually exclusive `when` guards — the same mechanism Morozko's `resolution` already uses, just on a summed total instead of one incrementing counter.
- **Three endings, kept real per Q6:** "The Debts Repaid" (3/3 kind), "A Near Thing" (1–2/3, game-original middle path, flagged in the file header), "Lost to the Geese" (0/3, canonical dark ending — the geese catch the brother for good — unsoftened).
- **Tale-select** — no changes needed; it already lists tales dynamically off `window.SKAZKA_TALES`. Just added the `<script src="tales/geese-swans.js">` tag.

**Verified:** in-browser on a local `arcade` dev server, then re-confirmed live. `?debug=1` showed 15 nodes, zero structural-lint issues. Three full playthroughs reached all three endings via distinct answer combinations (3/3 → Debts Repaid, 0/3 → Lost to the Geese, 2/3 → A Near Thing), and all six per-flag flavor-text variants (kind/not-kind × stove/tree/river) read correctly in context. Vasilisa (17 nodes) and Morozko (9 nodes) both confirmed byte-unchanged via debug dump. `📜 Story so far` confirmed working. Zero console errors across every run. Phone viewport (375×812) and light color scheme checked. GitHub Pages deploy confirmed green, live URL serving the change: https://yevrap.github.io/KamekoStudio/drafts/skazka-trail/

**Docs:** [Skazka Trail Backlog](../../games/skazka-trail/backlog.md) (Geese-Swans moved to Shipped, status note and Parked/Questions updated) · [Kameko Playtest Log](../../playtest-log.md) (new agent-verified entry, flagged for Yev to confirm or override).

**Next:** a fourth tale is open whenever Yev wants one (Ivan Tsarevich, or stretch Sadko/Marya Morevna) — not gated on played verdicts for Morozko or Geese-Swans per Yev's own call. Separately, a UI/UX visual pass (mobile + laptop) is in progress on its own thread.

## 2026-07-22 — Skazka Trail: third-tale session held (no verdict yet); redirected to UI/UX

**Nothing shipped, nothing built.** This session's task was: check the Playtest Log for Yev's verdict on Morozko, and if it's a keep, pick a third tale fresh (Q9=C) and jam it. The only Morozko entry is the agent-verified self-check logged the same day Morozko shipped ("not a Yev play session... confirmation still outstanding") — not Yev's own played read, unlike Vasilisa which has a separate "i like it" line from Yev. Since that branch never unlocked, the session correctly held rather than picking or building anything speculative — repeated re-checks of the log confirmed no change. **Still only two tales exist:** Vasilisa the Beautiful and Morozko.

Yev then redirected: work on a **UI/UX visual pass** (mobile + laptop) next, independent of the pending third-tale decision. A ready-to-paste planning prompt was given in chat (not yet run as its own session). [Skazka Trail Backlog](../../games/skazka-trail/backlog.md) updated: status note added, visual-bar-upgrade item unparked into Inbox, Questions-for-Yev clarified.

**Next:** either (a) Yev plays Morozko and logs a real verdict, reopening the third-tale pick, or (b) the UI/UX planning prompt gets run as its own session — the two are independent and can happen in either order.

## 2026-07-22 — Skazka Trail: second tale jammed — Morozko

**Shipped** (commit `71b917f`, deployed): the anthology's second tale, picked fresh the same day Yev's own "i like it" verdict landed on the Vasilisa pilot (Q9=C — no pre-planned order). Scoped directly off [Skazka Trail Backlog](../../games/skazka-trail/backlog.md)'s P1 item: Morozko, picked as the fast second jam because the source tale is an almost-binary structure — cheapest proof that the shared engine handles a much simpler tale shape now that Vasilisa proved it on a rich one.

- **`tales/morozko.js`** — a new content pack, `engine.js` untouched (reuse confirmed, no new engine capability was needed). 9 nodes: `intro` → `sentToForest` (setup, no real choice) → three trial scenes (`trial1`/`trial2`/`trial3`, Morozko asking "Are you warm, maiden?" at rising cold) → `resolution` → one of 3 endings.
- **The mechanic:** a single accumulated `patience` flag (0–3) — the polite answer at each trial is `patience+1`, admitting the cold or staying silent is `+0`. Ending selection is done at `resolution` with three otherwise-identical "Continue" choices, each gated by a mutually exclusive `when` guard on the total (`===3`, `1–2`, `===0`) — the same conditional-choice-visibility mechanism Vasilisa's forbidden-question option already used, so no engine change was needed to auto-route on an accumulated total instead of the last click.
- **Three endings, kept real per Q6:** "The Gift" (3/3, canonical happy ending — furs and treasure), "Mercy" (1–2/3, a game-original middle path — spared but sent home empty-handed, flagged as an addition in the file's own header comment since the collected tale is a clean binary), "The Silence" (0/3, the canonical dark ending — she freezes — unsoftened).
- **Tale-select screen** — `index.html` no longer hardcodes mounting `SKAZKA_TALES.vasilisa`. A bare-text select screen (matching the existing bar, no engine.js changes) lists every registered tale with a **Play** link (`?tale=<id>`) and a **Debug** link (`?tale=<id>&debug=1`). Real `<a>` navigation, not client-side routing, so the browser Back button returns to the select screen for free and the engine's own existing `?debug=1` check (which reads `location.search`) works unmodified per whichever tale is active.

**Verified:** in-browser on the local `arcade` dev server, then re-confirmed live. All 3 Morozko endings reached via distinct answer combinations (3/3 polite → Gift, 0/3 non-polite → Silence, 1/3 mixed → Mercy) and each recap correctly listed the actual choices made. `resolution` confirmed to show exactly one visible "Continue" in every case (the three `when` guards partition 0–3 exhaustively). `?debug=1` confirmed for both tales — Morozko's dump shows all 9 nodes with zero structural-lint issues; Vasilisa's is byte-identical to before (17 nodes, zero issues), confirming the pilot is genuinely unchanged. `📜 Story so far` confirmed working on both tales. Select screen checked on phone viewport (375×812) and desktop, light and dark. Zero console errors across every test, including the live site. GitHub Pages deploy confirmed green, live URL serving the change: https://yevrap.github.io/KamekoStudio/drafts/skazka-trail/

**Docs:** [Skazka Trail Backlog](../../games/skazka-trail/backlog.md) (Morozko item moved to Shipped) · [Kameko Playtest Log](../../playtest-log.md) (new agent-verified entry, flagged for Yev to confirm or override).

**Next:** Yev plays it — does the near-binary structure feel meaningfully different from Vasilisa's richer branching, does the "Mercy" middle path land, is the dark "Silence" ending the right call kept real. A keep re-opens Q9's open question: which tale comes third (no pre-planned order).

## 2026-07-22 — Skazka Trail: pilot tale jammed — Vasilisa the Beautiful

**Shipped** (commit `a9a7140`, deployed): the first jam of a new Lab prototype — a turn-based, choice-driven anthology of Slavic/Soviet-origin folk tales. Un-shelved from [What to Build Next — Proposals & Questionnaire (July 2026)](../../questionnaires/what-to-build-next.md) Pitch B on Yev's direct ask; scoped in [Skazka Trail — Concept & Directions](../../games/skazka-trail/plans/concept-and-directions.md) and the answered [Skazka Trail Questionnaire — Design Decisions](../questionnaires/skazka-trail-design-decisions.md), turned into build scope in [Skazka Trail — Jam Brief (Vasilisa Pilot)](../../games/skazka-trail/plans/jam-brief-vasilisa-pilot.md).

- **`drafts/skazka-trail/`** — `index.html` (markup + inline CSS, bare text per Q7) + **`engine.js`** (reusable, tale-agnostic: renders a scene, applies flag deltas, resolves routing, shows the ending screen) + **`tales/vasilisa.js`** (the pilot tale as a pure-data content pack — nodes, choices, flags, endings, no engine logic). This three-file split is a deliberate exception to the usual single-inline-file drafts convention: Q10 locked in a shared engine so a second tale (picked fresh after this verdict, per Q9) can plug in as a new `tales/<name>.js` with zero changes to `engine.js`.
- **The tale** — Vasilisa the Beautiful (Baba Yaga), not Morozko (Q3 overrode the concept doc's own ⭐ pick). 17 nodes: mother's death/doll → sent for fire → the three Riders (White/Day, Red/Sun, Black/Night — each a watch/hurry choice accumulating a `curiosity` flag) → Baba Yaga's three chores (each an alone/doll choice accumulating `dollHelp`) → a Q&A scene → the closing honest/evasive choice → one of 3 endings.
- **The load-bearing mechanic (Q4):** `curiosity >= 2` from the Riders scenes is what makes a forbidden question ("ask about the disembodied hands") even *appear* as an option at the Q&A scene — an early choice literally gating a later scene, the tale-native version of the Geese-Swans callback pattern the concept doc describes. `dollHelp` doesn't hard-branch the ending but changes Baba Yaga's closing-question wording, so the accumulated three-chore flag is still legible, not just flavor-text noise.
- **Three endings, kept real per Q6:** "Blessing's Fire" (honest + didn't pry — the canonical ending, unsoftened: the stepfamily still burns), "The Bargain Kept" (lied but the bargain's kept — the doll goes silent after, a quiet private cost), "The Price of Prying" (asked the forbidden question — a game-original dark branch, flagged as such in the jam brief, playing straight a warning Baba Yaga speaks in the source itself rather than softening it).
- **Q12 — seeing the branches**, built at the simplest version that clears the Modest bar: a **`?debug=1`** dev view dumping every node (text preview, choices, flag deltas, gating conditions, which nodes are endings) plus a generic structural lint (`SkazkaEngine.validateTale` — catches broken `next` links, dead ends, unreachable nodes) that isn't Vasilisa-specific and will run against every future tale for free. And an in-fiction **`📜 Story so far`** button, visible throughout play, opening a recap of every choice made this run — the same recap is what powers each ending screen's own "how you got here" section, so it wasn't a bolt-on, it's the same data the endings already needed.

**Verified:** full in-browser playthroughs (local `arcade` dev server, then re-confirmed live) on a phone viewport (375×812) and desktop, both light and dark color schemes. Reached all 3 endings and read each one correctly, including the recap. Confirmed the curiosity-gate: the forbidden option appeared when curiosity reached 2 across two separate runs and was absent in a reserved (hurry-past) run. Confirmed both `qanda_final` flavor-text variants (`dollHelp` 0 vs. ≥1) via the live tale object. Confirmed `?debug=1` renders all 17 nodes with zero lint issues. Zero console errors across every test. GitHub Pages deploy confirmed green (`gh run watch`), live URL serving the change: https://yevrap.github.io/KamekoStudio/drafts/skazka-trail/

**Docs:** [Skazka Trail — Jam Brief (Vasilisa Pilot)](../../games/skazka-trail/plans/jam-brief-vasilisa-pilot.md) (new) · [Skazka Trail Backlog](../../games/skazka-trail/backlog.md) (new, this jam moved to Shipped) · [Kameko Playtest Log](../../playtest-log.md) (new agent-verified entry, flagged for Yev to confirm or override).

**Next:** play it and log a real verdict — a **keep** unblocks the promotion checklist and picking the anthology's next tale (deliberately left open, Q9=C).

## 2026-07-22 — Cleanup: stale Pachinko Bazaar Lab card (p3-07 ✅)

Yev noticed Pachinko Bazaar showing in both the main gallery and the Lab. Root cause: its 2026-07-14 promotion (p3-07) deleted `drafts/pachinko-bazaar/` but never removed the matching card from `drafts/index.html`, which still linked to the now-gone folder. Removed the dead card; the Lab now lists only Flow Glider (killed, kept as a curio) under Prototypes and the four shelved games (Durak Alchemist, Durak Dungeon, Durak Tactics, Blob Zapper) under "Shelved from the arcade" — matching [Kameko Arcade](../../games/README.md)'s "In the Lab"/"Killed" lists, which were already correct. No other stale Lab entries found; `drafts/` on disk only contains `flow-glider/` plus the shelved games' code (which lives under `games/`, untouched). `docs/roadmap.md` p3-07 annotated with the cleanup. Not yet committed/pushed — pending Yev's go-ahead.

## 2026-07-21 — Maze Warden iteration 7: escalating tower-cost inflation + Bomber-damage bug root-cause (p3-22 🚧)

Yev's own many-wave playtest of iteration 6 landed **Meh** the same day, overriding the provisional agent-verified keep: "I get too much money and nothing to spend it on... maxes out everything pretty quick and feels useless and boring in some ways." Diagnosis: iteration 6 deepened the Essence/Upgrades meta-economy and the late-wave curve, but never touched the **in-run gold economy** — a maxed maze has a fixed, low-thousands gold ceiling while per-wave income grows faster than linear, so late-game gold has nowhere to go. [Iteration 7 Direction](../questionnaires/maze-warden-iteration-7-direction.md) answered same day: Q2=A (escalating tower-cost inflation), Q3=A (ship that alone, defer the "solved maze" half). Bundled in: a Bomber tower-damage bug Yev flagged in the same chat pass ("I don't see the towers being damaged").

**Shipped (commit `47c6654`, deploy verified via Pages):**
- **Escalating tower-cost inflation (Q2=A).** New run-scoped `state.towersBuiltThisRun` counter (reset in `freshState()`, incremented on every successful `placeTower()`, never decremented by selling) feeds a `costMultiplier = 1 + 0.05 × towersBuiltThisRun` into `effectiveCost()`, which gained a second parameter (`isInitialBuild`) gating the multiplier — `placeTower()` and the build-sheet cost display pass `true`; `upgradeTower()` and the upgrade-sheet display keep the original single-argument call, so an already-placed tower's next-level cost is untouched by how many other towers have been built since. Roughly 1.5× by the 10th tower this run, ~2× by the 20th, ~3× by the 40th. The scoped "correctness gotcha" (sell refund must reflect actual gold paid, not a recomputed current-multiplier cost) turned out to already be handled: the pre-existing `tower.spent` field already accumulates real gold paid across build + every upgrade, and `sellTower()` was already refunding 60% of *that* — confirmed via live UI test rather than needing a new field.
- **Bomber tower-damage bug — root-caused, no code change.** A temporary debug hook (removed before commit, same method as iteration 5's Bomber verification) drove `detonateBomber()` directly against two towers at different starting HP (5/40 and 40/40): the low-HP tower was destroyed, the full-HP tower correctly dropped to 10/40, and the scorched-tint + hp-bar visuals rendered exactly as designed — ruling out both a scan-logic bug and a rendering bug. A separate multi-wave *organic* playthrough simulation (the real spawn/combat/detonation code, natural random spawns, a realistic build-as-you-go tower layout, no scripted outcomes) confirmed the actual cause: a Bomber's HP equals a regular grunt's, so any maze dense enough to survive escalating waves (29hp bomber vs. ~24 combined dps from just 2 nearby Spires) kills it via normal tower fire in ~1.5s — well under its 9s+ fuse — before it ever gets the chance to detonate. The same simulation caught a real detonation landing on a tower for the expected 30 damage when one *did* survive, confirming the mechanic fires correctly end-to-end, just rarely. Bomber HP/frequency retuning to make detonations more common is explicitly out of scope this round (Q3=A) — flagged as an open question in Improvements.md instead.
- **Verification:** the full production UI event path (not just the debug hook) confirmed the shipped cost curve live in the preview-pane dev server — build-sheet cost rose 25→26→28→29→30g across the first five placements, upgrade cost stayed flat at 20g regardless of towers built, and sell refund correctly differed per tower (15g for the 1st built at 25g, 17g for the 4th built at 29g) rather than converging on one number. Zero console errors throughout, both on the local preview and the live Pages deploy (`curl`-confirmed serving `towerInflationMultiplier`/`towersBuiltThisRun` with no leftover debug-hook code). Full `node --test tests/` suite (439/439) green — no existing modules touched, still no dedicated maze-warden test file (still in `drafts/`).

**Docs:** [Maze Warden](../../games/maze-warden/README.md) (status header + "What happens next" + How-it-plays + Design-decisions + Known-simplifications all updated) · [Improvements](../../games/maze-warden/ideas.md) (both iteration 7 items checked off shipped with full detail; a new Bomber-HP data point folded into the existing open fuse/damage/radius question) · [Kameko Playtest Log](../../playtest-log.md) (fresh entry, provisional `keep` flagged agent-verified-only, explicitly not a promotion call).

**Next:** Yev's own fresh playtest read — does the gold sink actually fix "too much money, nothing to spend it on," and does he agree the Bomber mechanic is fine as-is or want its numbers retuned so detonations happen more often. That read is also what promotion to the main arcade is gated on. The "solved maze, nothing left to think about" half of the iteration-6 complaint stays deliberately deferred per Q3=A.

## 2026-07-21 — Maze Warden iteration 6: deeper Upgrades tree + late-game wave retune (p3-22 🚧)

Per [Improvements](../../games/maze-warden/ideas.md)'s Backlog (Q6=A+C from the Iteration 4 Direction questionnaire) — the replayability/difficulty pass meant to resolve the iteration-3 playtest's headline "maxed out pretty fast... too easy... not a lot of replayability" verdict. Two numbers-only changes, no new systems.

**Shipped (commit `a0e71c7`, deploy verified via Pages):**
- **Deepen the Upgrades tree (Q6=A).** Rank caps raised 3→5 on Deep Pockets, Fortified Core, Cheap Walls, and Overcharge — ranks 1-3 keep their exact original per-rank cost and effect (so any essence Yev had already banked into these isn't retroactively devalued), ranks 4-5 are new tiers extending the same cost-growth ratio the original 3 ranks used. Added a 6th node, **🛡️ Reinforced Walls** (+12% tower HP/rank, 5 ranks) — the tree's first defensive lever, filling a gap flagged after Bombers made tower HP matter; wired via a new `effectiveHp()` multiplier that mirrors the existing `effectiveDmg()`/`effectiveCost()` pattern, applied at tower placement and on upgrade. **Total essence to max the whole tree: 266 (was ~76)** — at a rough early-game 8 essence/run that's ~34 runs to fully max, well past "meaningfully more than 10."
- **Retune late-game wave scaling (Q6=C).** The old `waveEnemySpeed` hard-capped at 2.4 cells/sec around wave 37 (`(2.4-1.1)/0.035`), and the purely linear `waveEnemyCount`/`waveEnemyHp` growth never picked up the slack — so total pressure flattened right where a run was deepest. All three curves now share one breakpoint, `LATE_WAVE_START` (= that same old cap wave, 37) — **waves 1-37 are numerically unchanged.** Past it: speed no longer hard-caps, it keeps climbing at a much gentler 0.01/wave instead of going flat; `waveEnemyHp` picks up a quadratic term and `waveEnemyCount` a faster linear term, so pressure keeps ramping instead of plateauing. By wave 100: hp 815 vs the old formula's flat 339 (~2.4x), count 181 vs 156, speed still rising (3.03 cells/sec) instead of stuck at 2.4.
- **Verification:** UI/regression-checked against the local `arcade` preview-pane dev server — Upgrades panel renders all 6 nodes with correct pip counts/costs/descriptions, tower placement and upgrade both work correctly with `effectiveHp()` wired in (verified via `PointerEvent`/`.click()` dispatch, since the preview pane's rAF-throttling artifact from every prior iteration still applies to real wall-clock testing), zero console errors throughout. Since a real playthrough to wave 50-100 isn't practical to drive in one sitting, the late-game escalation claim is verified by a node-level simulation of the *actual shipped formulas* (not reimplemented copies) confirming the wave 30/37/50/70/100 numbers above and the 266-essence tree total. Full `node --test tests/` suite (439/439) green — no existing modules touched, still no dedicated maze-warden test file (still in `drafts/`).

**Docs:** [Improvements](../../games/maze-warden/ideas.md) (iteration 6 checked off shipped with full numbers; wall-migrates-difficulty and difficulty-curve-tuning cross-references updated; the standing Reinforced-Walls idea marked shipped) · `docs/roadmap.md` p3-22 updated · [Kameko Playtest Log](../../playtest-log.md) (fresh entry).

**Next:** Yev's own many-wave playtest read — does the deeper tree still feel worth chasing, does the late-game curve actually read as escalating rather than just numerically escalating, do the new Reinforced Walls numbers feel right. All three iterations from the Iteration 4 Direction questionnaire (4, 5, 6) are now shipped; the "Bigger bets" list (hex grid, chambered runs, hero sortie, theme pass, RU localization) stays parked until a fresh keep/meh verdict picks something up.

## 2026-07-21 — Maze Warden iteration 5 revision: Bomber redesign, supersedes the Breaker (p3-22 🚧)

Same-day playtest of the iteration-5 Breaker (logged just below) found the blocked-then-attack mechanic effectively unreachable: `wouldSeal()` guarantees spawn always keeps an open path to the core, so a normal single-corridor maze has no redundant route to sacrifice — trapping a Breaker needed a deliberate loop/fork the game never teaches and nobody naturally builds. Yev's own read: "I see the new units but I can't make a blocking path." Rather than retune the trapping mechanic, replaced it entirely with a fuse-based self-destruct that doesn't care about maze topology at all.

**Shipped (commit `c4eab4b`, deploy verified via Pages):**
- **💣 Bomber** (renamed from Breaker throughout — display text and internal identifiers). Same wall/pathing rules, HP, and speed as the base enemy; same wave-6-start spawn-chance ramp (`bomberChance`, formula unchanged from `breakerChance`: `min(0.15 + (wave-6)*0.03, 0.5)`). The new part: a fuse, captured once at spawn from `bomberFuseSeconds(wave) = max(4, 9-(wave-6)*0.15)` (9s at wave 6, floored at 4s around wave 39 — shorter at later waves per Yev's explicit ask for more late-game urgency).
- **Reverted `wouldSeal()`'s Breaker exemption.** `cellOccupiedActiveEnemies()` is back to taking no arguments — every active enemy, Bombers included, is unconditionally guaranteed an open path again. Topology no longer matters for this mechanic at all, which is the whole point of the redesign.
- **Removed entirely:** `findAdjacentTowerToAttack()` (nearest-bordering-tower BFS), `updateBreakers()`'s blocked-timer/attack-key logic, the dashed attack-line + filling-warning-ring visuals, `BREAKER_BLOCK_DELAY`/`BREAKER_DPS`, the "sealed-in Breaker" howto bullet.
- **`updateBombers(dt)` + `detonateBomber()`.** Counts the fuse down every frame; at zero, collects every tower within `BOMBER_EXPLOSION_RADIUS` (1.5 cells) into a list *before* damaging/destroying any of them — `destroyTower()` deletes from `state.towers`, so damaging while scanning that same object risks skipping a neighbor once 3+ towers are in range at once. Each hit tower takes `BOMBER_EXPLOSION_DMG` (30 flat, no falloff — same flat-AoE shape Frost Prism already uses), calling the existing `destroyTower()` for anything reduced to ≤0 hp. Only towers take damage; a Bomber detonating with nothing nearby just fizzles. The Bomber itself is removed with no leak and no kill-gold (the player didn't kill it).
- **Fuse-urgency telegraph.** A ring around the Bomber fills in and pulses faster as `fuse/fuseMax` shrinks, replacing the old blocked-warning ring. On detonation: a 30-particle burst, a new `spawnBlast()`/`drawBlast()` radius-flash that fades over 0.35s, and a distinct two-layer `audio.explosion()` cue (a low sine thump plus a sharper sawtooth crack) — separate from `audio.towerBreak()`, which still plays per tower actually destroyed.
- **Kept unchanged:** tower `hp`/`maxHp`, the damaged-tower tint + hp bar, `destroyTower()` itself, the spawn-chance ramp formula.
- **Verification:** the same rAF-throttling preview-pane artifact as every prior iteration meant real wall-clock waiting doesn't advance the sim, so verified via a temporary debug hook (removed before commit) exposing `placeTower`/`spawnEnemy`/`updateBombers`/`detonateBomber`/`damageEnemy`/`killEnemy` against the `arcade` preview-pane dev server. Placed two Spire towers (one manually set to 20/40hp, one left at 40/40hp) within blast range of a forced Bomber detonation: both took the flat 30 dmg, the 20hp one destroyed (`state.towers['3,3']` gone), the 40hp one survived at 10hp — confirmed via direct state inspection, one `spawnBlast` recorded, 50 particles (30 from the burst + 20 from `destroyTower`'s own burst). Separately, a Bomber killed via `damageEnemy` well before its fuse expired died with normal kill-gold (70→73g) and zero blast/explosion (`blastsBefore === blastsAfter === 0`) — confirms "killed first, dies normally, no explosion." `bomberFuseSeconds` confirmed monotonically decreasing across waves 1/6/10/20/39/50 (9.75/9/8.4/6.9/4.05/4-floor). Zero console errors across the full session; howto card confirmed rendering the new Bomber bullet; live deploy `curl`-confirmed serving `bomberFuseSeconds`/`BOMBER_EXPLOSION_*`/`updateBombers` with no leftover `breaker`/`Breaker` identifiers (only two intentional historical-comment mentions remain). Full `node --test tests/` suite (439/439) green — no existing modules touched, still no dedicated maze-warden test file (still in `drafts/`).

**Docs:** [Maze Warden](../../games/maze-warden/README.md) (overview rewritten — Breaker description replaced with Bomber throughout: status line, how-it-plays bullets, 5 design-decision entries, cut-scope, next-steps) · [Improvements](../../games/maze-warden/ideas.md) (revision checked off shipped; 3 now-moot Breaker-specific follow-up ideas marked superseded/moot; 3 open questions reframed for the Bomber's numbers) · `docs/roadmap.md` p3-22 updated.

**Next:** Yev's playtest read of the Bomber (does the fuse telegraph read as urgent, does the blast radius/damage feel right, does the wave-6 ramp still feel right) — then iteration 6 (deeper Upgrades tree + late-game wave-scaling retune, now also covering the Bomber's own knobs) is already scoped and doesn't need a fresh questionnaire to start.

## 2026-07-21 — Maze Warden iteration 5: Breaker enemy + tower HP (p3-22 🚧)

Per [Improvements](../../games/maze-warden/ideas.md)'s Backlog (Q5=C, starred/recommended) — the second enemy type, and the pick that structurally answers "too easy" rather than just retuning numbers.

**Shipped (commit `a290513`, deploy verified via Pages):**
- **🧨 Breaker enemy.** Same wall/pathing rules, HP, and speed as the base enemy — a stat-profile reskin was explicitly not the point (Improvements.md's own framing). Mixed into wave spawns from wave 6 onward, chance ramping `min(0.15 + (wave-6)*0.03, 0.5)` (15%→50% by ~wave 20).
- **The core problem this solves:** normal enemies can never be sealed off — `wouldSeal()` already guarantees every active enemy's cell stays reachable before allowing a build, so nothing could ever get stuck without breaking that guarantee for the whole wave. Solved by exempting only Breakers from that one check (`cellOccupiedActiveEnemies(excludeBreakers)`), reusing the exact same BFS distance field the rest of pathfinding already maintains — no parallel blocked-detection system.
- **Blocked-then-attack loop.** A Breaker whose own cell reads `Infinity` in the live distance field for 2.5s straight locks onto the nearest tower bordering its sealed pocket (a small BFS handles both a direct wall and a deeper dead-end) and deals 14 dmg/sec. Reopening any path — selling a different wall, anything — stops the attack immediately with the tower frozen at its current hp (no partial repair); left alone, the tower is destroyed outright (no refund) and everything re-paths.
- **Tower HP (new).** Towers had none before. Per-level: Spire 40/55/75, Prism 55/70/90, Volt 25/35/45. Upgrading fully repairs to the new level's hp — matches how dmg/range already reset per-level rather than accumulating. A damaged tower gets a scorched red tint + an hp bar, both hidden at full health.
- **Why this actually answers "too easy":** previously, building more towers mid-wave was always risk-free since normal enemies always kept a guaranteed path — now, sealing in a nearby Breaker while extending a "finished" maze starts its attack timer, so a static layout is a liability again late-game.
- **Verification:** the preview pane's rAF-throttling artifact (same one iterations 1–4 hit — `document.hidden` reads `true` even though the tab is frontmost) means real wall-clock waiting doesn't advance the sim, so verified via a temporary debug hook (removed before commit) driving `updateBreakers(dt)` directly with fixed steps: confirmed a Breaker can be walled in where a normal enemy couldn't (`wouldSeal()` returns `false` for the sealing build), the attack starts only once `blockedTime` crosses 2.5s, damage accrues at the expected rate, and the tower is destroyed/removed at 0 hp with correct re-pathing after. Separately confirmed the recovery direction: re-sealed a fresh pocket, let the attack run partway, then sold a *different* wall to reopen an alternate path — attack stopped immediately, the damaged tower's hp froze (didn't keep dropping or auto-repair), and the Breaker's target updated toward the newly reopened cell. Visually confirmed in-browser: the Breaker renders as a distinct spiky diamond with a pulsing attack line to its target, and the damaged tower shows the tint + hp bar. Full `node --test tests/` suite (439/439) green — no existing modules touched, still no dedicated maze-warden test file (still in `drafts/`).

**Docs:** [Maze Warden](../../games/maze-warden/README.md) (overview updated — new How-it-plays bullets, 5 new design-decision entries, cut-scope and next-steps updated) · `PLAYTEST.md` (iteration 5 section added, evaluation checklist updated) · [Improvements](../../games/maze-warden/ideas.md) (iteration 5 checked off, 4 new discovered/deferred ideas, 3 new questions for Yev).

**Next:** Yev's quick playtest read of iteration 5 (does the Breaker read as a threat, does the wave-6 ramp feel right, does the reopen-stops-the-attack recovery feel good) — then **iteration 6** (deeper Upgrades tree + late-game wave-scaling retune, now also covering the Breaker's own tuning knobs) is already scoped and doesn't need a fresh questionnaire to start.

## 2026-07-21 — Maze Warden iteration 3: legibility/UI polish pass (p3-22 🚧)

Iteration 2's verdict came back **Keep** ([Iteration 2 Verdict & Direction](../questionnaires/maze-warden-iteration-2-verdict-and-direction.md) Q1). Yev's direct chat ask for iteration 3 was presentation-only, not the questionnaire's Q5 picks (second enemy type, further Mirror/balance tuning — those stay queued): "more industry standard polish and patterns that make it easy to understand what is going on, it feels a bit wordy."

**Shipped (commit `9cd1b7b`, deploy verified via Pages):**
- **Game speed toggle (0.5x/1x/2x/3x).** Directly answers Q6 free space ("a speed setting so I can speed up or slow down the mobs"). Topbar icon, cycles and persists (`localStorage` `mazeWarden_speed`); scales the simulation `dt` uniformly — the standard Bloons TD/Kingdom Rush fast-forward pattern.
- **Locked-tower discoverability.** Q3 free-text read as a bug report ("I don't see the new tower type") but was expected behavior — Volt Coil is Mirror-gated and iteration 2 simply omitted it from the build sheet until unlocked, which looked broken rather than "not yet." Now always listed, greyed out with a 🔒 lock icon and an "Unlock in the 🔮 Mirror" hint; tapping it toasts instead of doing nothing. The howto overlay's tower legend now renders from `TOWER_DEFS` at open time instead of hand-duplicated prose, so it reflects the same locked/unlocked state live.
- **Range-ring preview.** Tapping a built tower to open its action sheet now draws a dashed range ring on the board in the tower's color — a standard TD legibility pattern (what can this actually hit?), previously absent (flagged in Improvements.md as a future cheap add).
- **Wave-progress bar.** Replaced the ambiguous "Wave 3 in progress — 2 + 5 left" text (alive vs. queued isn't a meaningful split to a player) with a slim resolved/total progress bar plus a single "👾 N left" count, computed from the existing `waveEnemyCount(wave)` formula — no new state needed.
- **Copy trim.** Howto overlay cut from a paragraph + 3-sentence list to 2 bullets + 1 status line; tower sheet descriptions shortened (e.g. "Single target, long range, high focus-fire damage" → "Long range, single target"); Mirror node descriptions dropped the repeated "— applies immediately" / "— starting next run" suffix in favor of one compact NOW/NEXT RUN badge per node.
- **Verification:** 439/439 unit tests green (maze-warden isn't in the suite, same as other Lab drafts — untouched either way). Browser-preview harness still can't deliver real `pointerdown` to the canvas (same rAF-throttling artifact noted in iterations 1–2, not a game bug); verified via dispatched `PointerEvent`s and direct DOM/state inspection instead: build sheet shows the locked Volt Coil row correctly, range ring renders on a tapped tower, wave-progress bar computes and updates correctly, speed toggle cycles/persists/reloads correctly, Mirror NOW/NEXT RUN badges render correctly. Deploy confirmed live via `curl` against the GitHub Pages URL.

**Docs:** [Maze Warden](../../games/maze-warden/README.md) (overview updated) · `PLAYTEST.md` (iteration 3 section added) · [Improvements](../../games/maze-warden/ideas.md) (range-ring preview checked off, new ideas added) · new [Iteration 3 Verdict & Direction](../questionnaires/maze-warden-iteration-3-verdict-and-direction.md) questionnaire opened.

**Next:** play iteration 3 (mobile + laptop), log a verdict line in [Kameko Playtest Log](../../playtest-log.md), fill the iteration-3 verdict questionnaire — it scopes iteration 4 (the deferred Q5 picks, or a new direction).

## 2026-07-21 — Maze Warden iteration 2: Mirror meta-progression, balance pass, pause/build fixes (p3-22 🚧)

Iteration 1's verdict came back **Keep** (Q1) — logged in [Kameko Playtest Log](../../playtest-log.md) and [Maze Warden Questionnaire — Verdict & Direction](../questionnaires/maze-warden-verdict-and-direction.md). Q7=A said build the meta-progression tree next; the questionnaire's free-space notes also flagged two UX problems and Q4 flagged the two towers as indistinguishable. Iteration 2 shipped same day, addressing all three.

**Shipped (commit `5834af9`, deploy verified via Pages):**
- **🔮 Mirror of the Warden — permanent upgrade tree.** Dying banks Essence (`floor(wave/2)+floor(kills/10)`); spend it on 5 nodes, `localStorage`-persisted (`mazeWarden_meta`): 💰 Deep Pockets (+10 start gold/rank), ❤️ Fortified Core (+3 start HP/rank), 🔨 Cheap Walls (-10% tower cost/rank), ⚡ Overcharge (+15% tower dmg/rank) — all 3 ranks — and 🟡 Volt Coil (single unlock, adds a 3rd tower). Adapted from Improvements.md's node list; dropped "draft re-roll" since no draft system exists this iteration, added Overcharge in its place for a direct power-growth feel. Accessible via a new topbar 🔮 icon (pauses the run) or the game-over screen.
- **Tower balance pass (Q4: "didn't notice a difference").** Pulse Spire pushed further into long-range single-target focus fire; Frost Prism pushed further into short-range, bigger-radius, heavier-slow crowd control, trading away some damage to pay for it. Volt Coil (Mirror-unlocked) adds a genuinely distinct 3rd archetype — cheap, short-range, very rapid low damage — rather than a reskin.
- **Auto-pause-on-blur/hidden/pagehide removed.** Q8 free space: "it should keep going unless I click to pause or use a menu." The explicit ⏸ button and opening a menu (help/Mirror) still pause; losing window focus no longer does.
- **Root-caused and fixed "can't build during a run."** Reading the code, nothing actually phase-gated building on `phase==='wave'` — the real bug was in the build/tower-action sheet: its full-screen backdrop absorbed the *next* tap when switching to a different cell while a sheet was already open, closing the old sheet but eating the tap meant for the new one. That forced a close-then-retap pattern on every cell switch, which reads as broken/blocked input especially when reacting fast mid-wave. Fixed by routing a backdrop tap that lands over the board straight into the same cell-selection handler instead of only closing.
- **Verification:** 439/439 unit tests + `npm run smoke` green (no existing modules touched). The Browser preview pane doesn't deliver real `pointerdown` events to the canvas in this harness (`document.hidden` reads `true` even though the tab is frontmost — the same rAF-throttling artifact iteration 1's verification note already flagged, not a game bug) — confirmed via a temporary debug hook driving `placeTower`/`upgradeTower`/`sellTower`/`triggerGameOver`/`buyNode` directly (removed before commit): mid-wave build/upgrade/sell all succeed, essence award math and `localStorage` persistence confirmed across a real page reload, cost/damage scaling formulas match, rank caps enforced. Visually confirmed the Mirror overlay, updated game-over screen, and howto card all render correctly.

**Docs:** [Maze Warden](../../games/maze-warden/README.md) (overview updated) · [Improvements](../../games/maze-warden/ideas.md) (shipped items checked off) · [Maze Warden Questionnaire — Verdict & Direction](../questionnaires/maze-warden-verdict-and-direction.md) (marked answered/acted-on) · new [Iteration 2 Verdict & Direction questionnaire](../questionnaires/maze-warden-iteration-2-verdict-and-direction.md) (open — fill after playing iteration 2) · [Kameko Playtest Log](../../playtest-log.md) backfilled with iteration 1's verdict · [Kameko Arcade](../../games/README.md) hub updated

## 2026-07-21 — New game jam: Maze Warden iteration 1 (p3-22 🚧)

Yev's July 21 ask — maze-building TD + Hades-style "stronger every run" meta + a migrating difficulty curve — went through a design questionnaire same day ([Maze Warden Questionnaire — Design Decisions](../questionnaires/maze-warden-design-decisions.md), now answered), then straight to a jam. Yev scoped iteration 1 tighter than the questionnaire's own recommended MVP slice: **core loop only, no meta-progression** — that layer is iteration 2, gated on this loop earning a keep/meh verdict on its own. Un-benches **B3 (maze-builder TD)** from `docs/brief.md`'s not-picked list, same new-signal path that produced Black Hole in One.

**Shipped (commit `02c4ca0`, deploy verified via Pages):**
- **`drafts/maze-warden/index.html`** (new, single file) — your towers ARE the walls: an 8×14 grid (aspect chosen to closely match a phone's usable portrait area, ~89–97% fill vs. ~62% with the concept doc's suggested 9×11), BFS/flow-field pathfinding recomputed on every build/sell so enemies always take the shortest currently-open route and reroute cleanly mid-wave, placement that would fully seal the core rejected ("🚧 Path must stay open"). 2 tower types (🟦 Pulse Spire single-target, 🟪 Frost Prism splash+slow, 2 upgrade levels each, 60% sell refund), endless escalating waves, gold economy, core HP → game over → restart. Same board centered/letterboxed on desktop rather than widened (device parity, same approach as Black Hole in One's fixed-course letterboxing). WebAudio synth SFX throughout, no assets. Auto-pause on blur/hidden/pagehide, explicit-resume-only.
- **`drafts/index.html`** — Lab card added (top of Prototypes, newest-first).
- **`docs/roadmap.md`** (p3-22, new row) + **`docs/brief.md`** (B3 un-benched note) updated.
- **Verified:** 439/439 existing unit tests + `npm run smoke` green (no existing modules touched). Because the Browser preview pane throttles `requestAnimationFrame` for a backgrounded tab (confirmed via `document.hidden === true` even while the tab is frontmost in the pane — a harness artifact, not a game bug), gameplay was verified via a temporary debug hook that drove the simulation directly, bypassing rAF: seal-validation (can't wall off the core; confirmed correct on both a 3-open-neighbor and a fully-tested corridor case), dynamic re-pathing when a wall goes up mid-wave (zero enemies stranded across a stepped 200+ simulated-second run), tower placement/upgrade/sell gold math (exact expected amounts every time), wave-clear gold/bonus math, core-HP depletion → game over → restart, all with zero console errors across the full test session. The debug hook was removed before commit — not in the shipped file. Visually confirmed the board renders correctly and fills well at both a 375×812 mobile viewport and a 1280×800 desktop viewport (identical board, centered with equal matting at desktop width).

**Docs:** [Maze Warden](../../games/maze-warden/README.md) (new overview) · [Improvements](../../games/maze-warden/ideas.md) (new) · [Maze Warden Questionnaire — Verdict & Direction](../questionnaires/maze-warden-verdict-and-direction.md) (new, open) · [Maze Warden Questionnaire — Design Decisions](../questionnaires/maze-warden-design-decisions.md) (marked answered) · [Kameko Arcade](../../games/README.md) hub updated

## 2026-07-20 — Durak: Russian language toggle (p2-36 ✅)

All three of Durak's user-facing string surfaces (card faces, status text, roles, coach banner, game log, gameover screen, rules overlay, names/pass-device screens, settings drawer) now route through a new `i18n.js`, mirroring the `t()` pattern already shipped for Tysiacha (`p1-14`) and Astro Salon. Language selector lives in the always-visible Quick Actions drawer section and switches live — no restart, including mid-match.

Two gaps in the written plan ([Russian Localization Sprint](../plans/durak-russian-localization-sprint-july-2026.md)) surfaced during implementation and were fixed along the way, not deferred:
- `gameplay.js`'s `checkGameOver()` set `state.winnerText` to raw English sentences ("You are the Durak!", etc.) — the plan's inventory never mentioned this file. Converted to a typed `state.winnerOutcome = {kind, isYou, name}`, localized at render time via `t('gameover.msg', outcome)`, the same shape as tysiacha's `bidLabel` migration during `p1-14`.
- The in-game Take/Pass/Done action buttons (`#btn-take`/`#btn-pass`/`#btn-done`) were static English in `index.html` and slipped through both the plan's inventory and the first implementation pass — caught in browser verification, not in the test suite (they're plain static text, nothing to unit-test).
- A real bug the plan's role-chip note glossed over: role chip *display text* and role chip *CSS class* were the same variable in the original code. Localizing the role label without splitting it from the class would have broken the chip's color-coding (`role-attacker` etc.) as soon as the language changed. Split into a language-neutral key (`roleFor()`) plus a localized label (`t('role.' + key)`).
- Default player names (`Player 2`, `CPU 3`, …) are assigned once at `newGame()` time, not read live like tysiacha's `playerName()`. A mid-match language switch left them stuck in the old language while everything else around them retranslated — jarring enough in manual testing to fix rather than document as a limitation. `refreshDefaultPlayerNames()` now re-derives any name that hasn't been overridden by the player whenever the language changes.

**Shipped (commit `12d5cc9`, deploy verified via Pages):**
- **`games/durak/i18n.js`** (new) — full EN/RU string table (~65 keys), `t()`, `rankText`/`cardText` (Cyrillic Т В Д К on card faces), `defaultPlayerName(mode, seat)`, 5-section `howto` rules content.
- **`cards.js`, `log.js`, `state.js`, `ui.js`, `main.js`, `index.html`, `shared/settings.js`** — every call site routed through `t()`; `localizeStatic()`/drawer re-registration on language change; `durak_lang` added to the reset-all-data registry.
- **`tests/durak-i18n.test.mjs`** (new) — defaults + fallback, per-log-event-type localization, rank letters, `defaultPlayerName`, EN/RU key-parity smoke test.
- **Verified:** full suite green (`node --test tests/`, incl. `guard-localStorage`); in-browser both languages — full round, pile-on, gameover + placements, names modal, rules overlay, log, coach banner, hot-seat pass-device, mid-match language switch with no restart, mobile viewport (no Cyrillic overflow).

**Docs:** [durak Improvements](../../games/durak/ideas.md) (checked off) · [arcade Improvements](../../planning/ideas.md) (checked off) · [Russian Localization Sprint](../plans/durak-russian-localization-sprint-july-2026.md) (archived, status updated).

## 2026-07-17 — ⏪ Black Hole in One: Orbit Aim Assist reverted (supersedes the entry directly below)

The "Orbit Aim Assist Polish" ship logged just below turned out to have real problems in play, same day: the grid-search snap had performance issues (hundreds of ghost physics steps per drag) and the blue "guaranteed orbit" preview didn't always deliver a clean capture, due to grid-resolution and simulation mismatch. Yev reverted the whole two-phase Nav Computer feature.

**Reverted (commit `0947442`, cleanup `d92de74`):** `4d3f4e8` (Phase 2: Orbit Aim Assist), `58ba90f` (test fix), `b66ae4f` (the 2D grid-search polish logged below) — the entire Orbit Aim Assist / Nav Computer arc. Parked pending a different approach (analytic orbit solving instead of brute-force simulation); tracked as OW-11 in the game's own Improvements.

**Not reverted, still live:** the same day's separate "Explore Black Holes (Gravity Well)" change (`d4a2eff`) — wild black holes now capture the comet into orbit from afar, with the Town-warp trigger tightened to a close dive into the event horizon. That one stuck (tracked as OW-10, shipped).

Note for anyone skimming this arcade-wide log: Black Hole in One's day-to-day ship history has mostly moved to its own per-game [Dev Log](black-hole-in-one.md) since promotion — that's the authoritative source for its recent commits; this top-level log only picks up the occasional cross-cutting or noteworthy entry.

**Docs:** [Black Hole in One](../../games/black-hole-in-one/README.md) (overview, "Current state" section) · [Improvements](../../games/black-hole-in-one/ideas.md) (OW-10 ✅ / OW-11 parked) · [Black Hole in One — Next Arc Questionnaire (July 18, 2026)](../questionnaires/black-hole-in-one-next-arc-july-18-2026.md) (new — retry-or-drop + what's next).

## 2026-07-17 — Black Hole in One: Orbit Aim Assist Polish

The Nav Computer's Orbit Aim Assist was upgraded from a 1D angle sweep to a 2D angle+power grid search (searching 80 candidate paths). It now accurately finds orbital captures even if the user's drag power is off, snapping the visual aim arrow to the exact correct length to provide guess-free power feedback. Look-ahead distance was doubled to 240 steps (~4 seconds) for earlier lock-on.

**Shipped (commit `b66ae4f`, deploy verified via Pages):**
- **`ui.js`** — Rewrote `getSnappedAim` to generate candidates across ±0.25 rad angle and ±25% power, sorted by deviation penalty, and test the best 80 trajectories. Arrow `length` natively updates based on the matched power.
- **Verified:** Full `npm test` suite green.

**Docs:** [Black Hole in One](../../games/black-hole-in-one/README.md) (mechanic improved).

## 2026-07-15 — Black Hole in One: URL Export & Share (MM-3 ✅)

Implemented map data serialization to compress custom map states (planet positions, sizes, types) into a base64url hash, allowing players to share maps via direct URL links.

**Shipped (commit `f396241`, deploy verified via Pages):**
- **`editor.js`** — `encodeMap` and `decodeMap` added. Arrays of positions and sizes are packed tightly into arrays, stringified, and base64url encoded. A "Share" button was added to the maps drawer (next to Rename and Trash), and a "🔗 Share Current Map" button next to "Save Current Map". Both generate a link and copy it to the clipboard.
- **`main.js`** — intercepts `?map=HASH` on boot. If valid, strips the parameter from the URL bar (so refresh doesn't trigger it again) and boots directly into the new mode.
- **`gameplay.js`** — `startCustomMap` bootstraps the physics engine directly from a loaded map array, bypassing procedural hole generation. Custom mode finishes return the player right back to the custom map tee to try again.
- **UI** — Unnecessary editor and explore bars are hidden when playing a custom map link so the player sees a clean presentation.
- **Verified in-browser:** `npm run smoke` and `node --test tests/` passed locally. Booted with `?map=...`, the UI stripped the hash, loaded the map properly, and let the user play the custom map. Clicking Share copies a functioning link.

**Docs:** [Black Hole in One](../../games/black-hole-in-one/README.md) (overview updated) · [Improvements](../../games/black-hole-in-one/ideas.md) (MM-3 checked off).

## 2026-07-15 — Black Hole in One: orbit-and-flick (BH-4 ✅)

Yev's stable-orbits pick, built end-to-end from the design spec ([Black Hole in One — Stable Orbits Exploration](../plans/black-hole-in-one-stable-orbits-exploration.md)). A near-circular pass around a planet now snaps into a **live, station-kept orbit** the player flicks out of. The flick became a **force-push impulse** — added to the comet's current velocity, not overwriting it — which is a no-op at rest (tee shots unchanged) but *bends the existing motion* when breaking out of an orbit. Per Yev's ruling, the draft's "fully at rest between flicks" pause-proofing was dropped by choice; auto-pause freeze/resume is enough, and live/complicated motion is now an intended feature.

**Shipped (commit `4dfb217`, live as v27 — deploy verified: Pages run `29449084883` green, live `version.json` = 27, `orbitCapture` present in the deployed `physics.js`, https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/):**
- **`physics.js`** — pure `orbitCapture(p, b)`: captures only genuine "swung around but stayed" passes (near-tangential, near-circular speed, hugging the surface); rejects dives, slingshot flybys, and near-stationary grazes (those still land/soft-catch/sling as before).
- **`constants.js`** — orbit tuning band (`ORBIT_*`) + `circularSpeed(m,d)` helper.
- **`gameplay.js`** — `beginOrbit`/`stepOrbit`; capture check in `stepFlight` (armed after the launch instant, gated by a post-break cooldown so you don't insta-recapture); `launch()` **adds** the impulse; an orbit skimming the cup still sinks (emergent).
- **`main.js`** — aim from a live orbit (drag freezes it into aiming → flick out), orbit stepped in the main loop, cancelled flick resumes the orbit.
- **`ui.js`** — aim preview is honest (seeds current velocity + impulse); faint pulsing orbit ring on the held planet.
- **Verified:** 241 unit tests (7 new: capture math, orbit persistence over 200 steps with no decay, cup-skim sink, force-push impulse-add), 13-page smoke — all green. In-browser through the real loaded modules: a coarse aim sweep found **orbits reachable on all 8 holes sampled (1010/3640 tee shots ~28%)**; the full input path drove **orbit → pointerdown=aiming → drag+release=flight, 1 stroke spent, orbit released** through the actual `main.js` handlers.

**Docs:** [Black Hole in One](../../games/black-hole-in-one/README.md) (overview → orbit mechanic added) · [Black Hole in One — Stable Orbits Exploration](../plans/black-hole-in-one-stable-orbits-exploration.md) (spec, now shipped) · [Black Hole in One — Style & Stats Sprint (July 2026)](../../games/black-hole-in-one/plans/style-and-stats-sprint.md) (BH-4 checked off; BH-1/2/3 still queued) · [Improvements](../../games/black-hole-in-one/ideas.md) (BH-4 → Shipped; tuning + follow-ups queued) · [Black Hole in One — Orbit Tuning Questionnaire](../questionnaires/black-hole-in-one-orbit-tuning.md) (**open — how frequent/how the reward should feel**).

## 2026-07-15 — Astro Salon Sprint 2: Chart Reading room + year-of-horoscopes; Blob Zapper to the Lab (p2-33 ✅, p2-34 ✅, p1-41 ✅)

The two Sprint 2 depth bets, plus one arcade-wide inbox item, in one ship. Questionnaire answers ([Astro Salon Questionnaire — Promotion Decisions](../../questionnaires/astro-salon-promotion-decisions.md) Q1–Q3) reshaped scope before build: Q2 → all 12 houses (not four angles), Q3 → streak cut.

**Shipped (commit `87e1a94`, live as v26 — deploy verified: Pages run `29446512184` green, https://yevrap.github.io/KamekoStudio/games/astro-salon/ serving the new `chartBtn`, live `version.json` = 26, gallery drops Blob Zapper and the Lab lists it shelved):**
- **🌅 Chart Reading room (p2-34)** — a second session type chosen on the start screen. 4 returning (undisguised) guests, each with a birth time; per guest place the **rising sign** then answer **3 whole-sign house questions**; all 12 houses dealt exactly once per session. Rising uses the simplified sunrise rule (sun sign rises at dawn, +1 sign per 2h, whole-sign houses). Same 2⭐/1⭐/streak scoring + rule-on-miss teaching; separate best `astroSalon_bestStarsChart`; full EN/RU. Design note: [Astro Salon — Chart Reading Room Design](../plans/astro-salon-chart-reading-room-design.md).
- **✨ Year-of-horoscopes + fortune tie-in (p2-33)** — versioned `YEAR_THEME` (2026 · *The Year of Quiet Momentum*) on the daily panel and in the read seed; pools tripled (30 themes / 24 advice per language, all unique); end-screen fortune now quotes the same deterministic read the ✨ panel shows (shared `dailyReadIndices`). Streak cut per Q3.
- **⚡ Blob Zapper → Lab (p1-41)** — Yev's inbox ask "move blob zapper to lab." Gallery card + `GAMES_META` entry + drawer quick-switcher entry removed; shelved card added to `drafts/index.html`; both `CLAUDE.md`s + `clearAllGameData` updated. Files stay at `games/blob-zapper/`; the controls-rework row p1-31 stays open, now Lab-tier.
- **Verified:** 234 unit tests (new coverage for rising/houses/deal + horoscope determinism/pool-size), 13-page smoke, and a purpose-built headless Sprint 2 script (full 16-question chart session → end screen with its own best; daily determinism; year line; RU chart-card re-render; salon regression; blob-zapper Lab move + old URL still loads) — all green. GEMINI docs regenerated and in sync.

**Docs:** [Astro Salon](../../games/astro-salon/README.md) (overview → Sprint 2 status + design decisions) · [Astro Salon — Chart Reading Room Design](../plans/astro-salon-chart-reading-room-design.md) (new) · [Astro Salon — Promotion & Depth Sprints (July 2026)](../plans/astro-salon-promotion-and-depth-sprints-july-2026.md) (Sprint 2 checked off) · [Astro Salon Questionnaire — Promotion Decisions](../../questionnaires/astro-salon-promotion-decisions.md) (**Q4 expert-mode now the open decision → gates p2-35**) · [Astro Salon Improvements](../../games/astro-salon/ideas.md) (shipped checked; per-sign chart intros / richer house pool / cusp-decan depth queued). Next open thread: answer Q4 to unlock expert mode.

## 2026-07-15 — Black Hole in One: promoted to the arcade (p3-10 ✅, all verdict-questionnaire asks shipped)

July 15 playtest verdict was **keep** with three concrete asks ([Black Hole in One Questionnaire — Verdict & Direction](../questionnaires/black-hole-in-one-verdict-and-direction.md), consumed & archived). All three shipped inside the promotion itself rather than as follow-ups.

**Shipped (commit `ab176d8`, live as v25 — deploy verified: Pages run green, https://yevrap.github.io/KamekoStudio/games/black-hole-in-one/ serving, gallery card + best-round meta rendering):**
- **⛳ 9-Hole Round mode (Q3="both")** — start-screen mode choice (Round / Endless, last-used remembered), round-over scorecard (per-hole strokes color-coded vs par, 🪐 markers on hopped holes, total big), **best-round record** in `blackHoleInOne_bestRound` with "🏆 NEW BEST ROUND!" flair. Endless unchanged.
- **🪐 Inviting planet-hops (Q4=B)** — landing window widened (17→22), new **soft-catch** band above it bounces nearly dead so the next touch sticks, guard planet a size up as a stepping stone, 🪐 HOP toast + scorecard celebration, how-to sells the hop as strategy.
- **📐 Device parity (Q5)** — root cause of "mobile harder than laptop": the draft derived world height from the viewport, so laptops got a short course where planets often couldn't even place. Now a **fixed 100×170 course letterboxed into any viewport** — identical holes on every device; wide screens get a centered strip with a dashed edge.
- **Promotion checklist in full** — ES-module split with `physics.js`/`gameplay.js` DOM-free behind injected hooks (generation → flight → collision → scoring → rounds all run headless), **20 unit tests** (`tests/black-hole-in-one.test.mjs`), settings-drawer section (how-to / new run / sound toggle `blackHoleInOne_muted`), pause on drawer open, `lastPlayed`, registered in gallery card + GAMES_META/SCORES_META (custom best-round renderer — "E"/negative bests are valid and the generic `>0` filter would hide them), 3d portal, drawer game switcher, clear-data keys, both `CLAUDE.md`s + GEMINI regen. Draft deleted from `drafts/`.
- **Verified in-browser before ship:** full round driven to the scorecard (NEW BEST + hop markers rendering), endless restart, drawer section, mode buttons, flick physics live, zero console errors, all modules 200. Full unit suite (221) + 17-page smoke green.
- **Rider:** Pachinko Bazaar had been missing from the 3d portal, drawer switcher, and both `CLAUDE.md` doc tables since its own promotion — registered now.

**Docs:** [Black Hole in One](../../games/black-hole-in-one/README.md) (overview updated to arcade status + promotion decisions) · [Black Hole in One Questionnaire — Post-Promotion Polish](../questionnaires/black-hole-in-one-post-promotion-polish.md) (**open, non-blocking** — laptop letterbox verdict, hop reward depth, RU localization, mode emphasis) · [Improvements](../../games/black-hole-in-one/ideas.md) (shipped items checked off; EN/RU + daily hole + stats surface queued). Next jam in the queue: p3-08 one-tower roguelike.

## 2026-07-14 — Black Hole in One: new Lab prototype (p3-10, A2 flick golf by direct request)

The A2 "pausable by construction" flick-golf direction from [Kameko Studio — New Game Directions (July 2026)](../../planning/new-game-directions.md) — originally in the not-picked list, pulled forward by Yev's direct ask the same evening the Flow Glider jam was killed as a Tiny Wings copy. Built deliberately as its own game, not a Desert Golfing reskin: drag-release to fling a comet through pocket planetary systems; planet gravity bends every shot **and planets are landable fairways you tee off from** (hop-and-putt); the cup is a black hole with a capture spiral; slingshot flybys celebrated; repulsor pulsars from hole 6. Infinite procedural holes, par tracking, running total vs par; a 1-flick hole is a BLACK HOLE IN ONE.

**Shipped (commit `512df3b`, live as v24 — deploy verified: Pages run green, https://yevrap.github.io/KamekoStudio/drafts/black-hole-in-one/ serving, listed on the Lab index):**
- Single-file draft (`drafts/black-hole-in-one/index.html`): 240 Hz fixed-timestep gravity sim, one-screen-per-hole procedural generator (guard planet on the tee→hole line from hole 2, difficulty ramp, par-from-blockers), short honest trajectory preview (~0.55 s of the real integrator), friendly "lost in space" OB rule, orbit traps decayed by space-dust drag, accretion-ring/nebula/trail/particle visuals, 5 synthesized SFX, first-load how-to + ? help + ↺ restart.
- Pause-proof per Q2=B: fully at rest between flicks; mid-flight auto-pause on blur/visibilitychange.
- **Verified through the real game pipeline, not just eyeballing:** in-page aim-search found 28 sinking solutions on hole 1 (healthy window — and every one aims *beside* the hole and lets the guard planet curve it in, which is exactly the intended skill); a live shot sank with the spiral and scored PAR; a lob landed on a planet and re-teed; an overshoot slingshotted past the hole, went OB, and returned with the stroke kept. `node --test` + 17-page `npm run smoke` green; zero console errors; mobile-viewport screenshots. The auto-pause proved itself by freezing the sim whenever the test browser lost focus.
- Repo docs: roadmap p3-10 added (🧪 Lab), p3-06 flow-glider marked ❌ kill per the playtest verdict, and the **no-reskins rule** written into `docs/brief.md` Things-to-avoid (cited prior art = tone reference, never blueprint).

**Docs:** [Black Hole in One](../../games/black-hole-in-one/README.md) (overview + design decisions) · [Black Hole in One Questionnaire — Verdict & Direction](../questionnaires/black-hole-in-one-verdict-and-direction.md) (**open — fill after playing**) · [Improvements](../../games/black-hole-in-one/ideas.md) (cut scope + jam ideas). Next: Yev playtests on the phone, logs the verdict in [Kameko Playtest Log](../../playtest-log.md), answers the questionnaire; keep → promotion checklist.

## 2026-07-14 — Flow Glider: new Lab prototype (p3-06, the "next jam" off the New Game Directions queue)

The A1 one-touch flow glider from [Kameko Studio — New Game Directions (July 2026)](../../planning/new-game-directions.md), built at the Modest bar per the p3-06 roadmap row. Hold to dive, release to soar; perfect downhill landings chain a streak (fever at ×3) and push the sunset back; nightfall is the only way a run ends.

**Shipped (commit `a5b5843`, live as v23 — deploy verified: Pages run green, https://yevrap.github.io/KamekoStudio/drafts/flow-glider/ serving, listed on the Lab index):**
- Single-file draft (`drafts/flow-glider/index.html`): 120Hz fixed-timestep physics, procedural sine hills with per-half-hill re-rolls and a distance ramp, keyframed day→night sky, banded Tiny-Wings hills, 3 parallax silhouette layers, motion trail (rainbow in fever), particles, floating combo text, dusk vignette + stars.
- Pause-proof per Q2=B: auto-pause on visibilitychange/blur/pagehide, 48px ⏸ button, instant resume; session-best on the night screen; teach = 3-line start overlay + a one-time "hold to dive" coach nudge.
- **Verified with in-page headless physics sims, not just eyeballing:** a dive-bomb bot dies at sundown with streaks of ×2, while a lookahead bot that times its dives chains ×9, holds fever 28s, and sustains daylight — the skill curve works. The sims caught and fixed a real feel-bug: invisible valley micro-skims were judged as thuds and silently reset streaks (fever was unreachable); landing judgment now ignores gentle skims, and only true slams thud. 5-minute max-difficulty sim: no NaN, no stalls, 10km clean. `node --test tests/` and 16-page `npm run smoke` green.
- Roadmap p3-06 → 🧪 Lab, verdict pending.

**Docs:** [Flow Glider](../../games/flow-glider/README.md) (overview + design decisions) · [Flow Glider Questionnaire — Verdict & Direction](../questionnaires/flow-glider-verdict-and-direction.md) (**open — fill after playing**) · [Improvements](../../games/flow-glider/ideas.md) (cut scope + build ideas). Next: Yev playtests on the phone, logs the verdict in [Kameko Playtest Log](../../playtest-log.md), answers the questionnaire; keep → promotion checklist, and p3-08 (one-tower roguelike) is the next jam either way unless Q7 says otherwise.

## 2026-07-14 — Pachinko Bazaar: promoted to the arcade (Phase 1–5, Sprint 1)

Round-1 playtest verdict was **keep** ([Pachinko Bazaar Questionnaire — Verdict & Direction](../questionnaires/pachinko-bazaar-verdict-and-direction.md), archived). Yev asked to ship the promotion phases.

**Shipped (commit `f5434bb`, live as v22 — deploy verified: listed on the root gallery):**
- **Full ES-module promotion**: The single draft file was split into `constants.js`, `state.js`, `gameplay.js`, `main.js`, and `style.css`.
- **Game Logic Tweaks (Phase 2)**: Orb density / gravity adjusted to make bounces more realistic. Bazaar items rebalanced (Split Orb costs 2400→3400, Golden Touch adds +500→+750). Sound added (Web Audio synthesis). Aim Assist arc added. Combo counter and screen shake added.
- **Unit Tests (Phase 3)**: Added `tests/pachinko-bazaar.test.mjs` verifying core physics (`collideCircle`), `quotaFor`, item application (`hitPeg`), and drop score logic (`landOrb`). Full suite passes.
- **Shared Infrastructure (Phase 4)**: Added settings drawer support with pause/resume hooks (`settingsOpened`/`settingsClosed`). Added `bestScore` and `lastPlayed` persistence via localStorage. Added a zero-size window dimension guard. Light mode CSS variables implemented and wired up.
- **Registered Everywhere (Phase 5)**: Tile added to root `index.html`. Added to `docs/roadmap.md`. `Improvements.md` checked off. Settings auto-clear list updated. 

## 2026-07-14 — iOS PWA Safe Area Fix (Astro Salon & Hidden Object)

**Shipped (commit `3e252e1`, deploy verified via Pages):**
- **Root cause:** The iOS notch and home indicator safe areas in standalone PWA mode take the background color of the `html` element, not `body`. Neither Astro Salon nor Hidden Object had the requisite CSS rules or PWA meta tags configured for this.
- **Fix:** Added iOS `apple-mobile-web-app-status-bar-style` and `theme-color` meta tags to `index.html`. 
- Added `html` background color synchronization to `style.css` (using `html:has(body:not(.dark-mode))` logic).
- Added `MutationObserver` to `main.js` to ensure the `theme-color` tags dynamically switch when the user toggles dark mode via the shared settings drawer.
- Also refactored Hidden Object's CSS to properly support a light mode palette natively.

## 2026-07-14 — Astro Salon: promoted from the Lab to the arcade (p1-38, p1-39, p1-40, Sprint 1)

Round-3 playtest verdict was **keep** ([Astro Salon Questionnaire — Verdict & Direction](../questionnaires/astro-salon-verdict-and-direction.md), archived); same-day pickup per [Astro Salon — Promotion & Depth Sprints (July 2026)](../plans/astro-salon-promotion-and-depth-sprints-july-2026.md).

**Shipped (commit `5abf5b4`, live as v21 — deploy verified: Pages run green, page serving at https://yevrap.github.io/KamekoStudio/games/astro-salon/, listed on the root gallery):**
- **Full ES-module promotion** per `docs/promotion-checklist.md`: the 1,275-line single-file draft split into `constants/i18n/content/state/gameplay/ui/main.js` (`durak-dungeon` was the structural reference). `content.js` is new relative to the studio's usual file table — pure text-generation (chip labels, rule/hint text) shared by `ui.js` and its tests, added specifically to keep `gameplay.js → ui.js` one-directional and avoid an import cycle.
- **24 new unit tests** (`tests/astro-salon.test.mjs`): sign data integrity (date ranges tile the year with zero gaps, element/modality groupings, opposites form an involution), the element-compatibility rule, scoring + streak-bonus math (extracted into a pure `computeScore()`), `mulberry32` determinism, EN/RU key parity, content-generation smoke tests. Full suite: 194 passing.
- **Shared infrastructure**: settings-drawer info section, `lastPlayed_astroSalon` + `astroSalon_bestStars` persistence, pause via a new `isPaused()` state flag (turn-based game, nothing to freeze — taps are just ignored while the drawer's open), **dark/light mode added** (the draft only ever had a fixed dark palette), and the draft's `click` handlers converted to `pointerdown` throughout to match the studio's mobile-first convention.
- **Registered everywhere**, including one gap the promotion checklist doesn't call out: the settings drawer's quick game switcher (a hardcoded list inside `shared/settings.js`, separate from root `index.html`'s `GAMES_META`) didn't have an astro-salon entry. Caught during the in-browser verification pass, not by any test — a reminder that "registered everywhere" needs an actual browser check, not just following the checklist's named locations.
- **Bundled two round-3 UX fixes** into the same ship since they land in the freshly-split files: **p1-39** drops the per-wedge date text (the read-then-confirm hub preview is now the only range surface); **p1-40** moves the continue button out of the scrolling feedback card to a fixed stage sibling, so it's never scrolled out of view even when a long RU feedback string forces the card itself to scroll internally.
- **Verified in-browser**: a full 5-guest session (wheel read-then-confirm, all 5 question types, scoring, streak bonus), EN/RU toggle mid-session, daily horoscope + sign picker, learn overlay, dark/light toggle, settings-drawer pause/resume (confirmed taps are ignored while open and resume after close), at both a 375×812 phone viewport and an 800×450 desktop viewport. Zero console errors throughout. `node --test tests/` (194/194) and `npm run smoke` (14 pages) both green.
- **Roadmap:** p1-38/p1-39/p1-40 ✅ (`5abf5b4`). Sprint 2 (p2-33 year-of-horoscopes, p2-34 Chart Reading room) is next — see the sprint-plan note for scope changes from the follow-up questionnaire (all-12-houses, no streak).

## 2026-07-14 — Pachinko Bazaar: new Lab prototype (p3-07, first jam off the New Game Directions queue)

Same-day pickup of the answered [Kameko Studio Questionnaire — New Game Directions](../questionnaires/kameko-studio-new-game-directions.md) (archived): Yev said "start shipping p3-07," so the pachinko roguelike jumped the queue ahead of the flow glider.

**Shipped (commit `09e316b`, live as v20 — deploy verified: Pages run green, page serving at https://yevrap.github.io/KamekoStudio/drafts/pachinko-bazaar/, listed on the Lab index):**
- **Peglin-style pachinko roguelike, single self-contained file at the Modest bar.** Drag to aim, release to drop through a 60-peg field (real circle physics, anti-stall jitter); blue/gold pegs score, purple pegs multiply the whole drop, green pegs pay coins; landing bucket (×1/×2/×5/×2/×1) multiplies the drop; ~×1.45 quota curve ends the run; between rounds a 3-of-7 modifier shop (Split Orb, Magnet, Extra Orb, Golden Touch, Heavy Orb, Bouncy, Coin Doubler). Early clears convert leftover orbs to coins.
- **Pause story per the new Q2=B steering:** static between drops by construction; mid-drop focus loss freezes the orb under a Resume overlay. PLAYTEST.md states it, as the brief now requires.
- **Look/tech call (Q6=C):** polished 2D canvas — glow pegs, orb trails, particles, floating score text; no Three.js.
- **Verified:** unit suite + 14-page smoke green (smoke auto-picked up the new page); full in-browser run — intro → drops → shop purchase (Extra Orb: 6 drops next round) → rounds 1–3 cleared → game over at R4 (2,310/2,440) → restart resets everything; split-orb path driven directly onto a gold peg (orb doubled, 3,630-pt drop); zero console errors. Note: the harness browser doesn't run rAF continuously, so physics was verified by stepping the simulation programmatically — on-device feel is exactly what the playtest should judge.
- **Roadmap:** p3-07 ✅ (`c80d851`). Jam queue remaining: p3-06 flow glider (next unless Q7 below changes it), p3-08 one-tower TD, p3-09 durak score-attack.

**Docs:** new [Pachinko Bazaar](../../games/pachinko-bazaar/README.md) overview (decisions + cut scope), [Improvements](../../games/pachinko-bazaar/ideas.md) inbox seeded (sound, RU, orb types, stacking shop, aim assist…), [Pachinko Bazaar Questionnaire — Verdict & Direction](../questionnaires/pachinko-bazaar-verdict-and-direction.md) **open — Yev to fill after playing** (verdict, aiming agency, pacing, shop shape, juice, language, and whether this changes the jam queue).

## 2026-07-14 — Astro Salon v21: read-then-confirm wheel + daily horoscope (round-2 questionnaire iteration)

Yev filled round 2 of [Astro Salon Questionnaire — Verdict & Direction](../questionnaires/astro-salon-verdict-and-direction.md) — verdict **meh** again: readability still failing (*"hard to see the date ranges, symbols… everything is so small"*), Russian native enough, depth picks = daily horoscope **and** deeper chart reading.

**Shipped (commit `fe6d0cb`, live as v21 — deploy verified: Pages run green, "astro-salon v21" + "Lab draft · v21" serving at https://yevrap.github.io/KamekoStudio/drafts/astro-salon/):**
- **Read-then-confirm wheel picker (Q2).** First tap on a wedge previews the sign **big in the wheel hub** — symbol, name, full date range — with a gold rim on the wedge; the same wedge tapped again commits. Beginners can browse the wheel freely; the readable detail lives on one big surface instead of 12 tiny wedges.
- **Bigger labels, decluttered wedges (Q2).** Hub radius 88→72, symbols 23→30px, names 9.5→13.5px. Wedges show only their start date ("from Mar 21" / «с 21 мар») — the full range shows in the hub on tap. Found in-browser during verification: v20's two-line ranges collided with neighboring wedge emoji on the side wedges at any legible size; start-date-only was the fix, not smaller fonts.
- **✨ Daily horoscope (Q5 pick #1).** Header + start-screen buttons; readable 12-sign picker on first use (persisted `astroSalon_mySign`); date-seeded deterministic read (mulberry32 over day+sign): theme, element-pairing note that restates the compatibility rule, advice, sign of the day. Full EN/RU.
- **Deeper chart reading (Q5 pick #2) deferred** — a full new mode, not a rider; committed as the next depth step in [Improvements](../../games/astro-salon/ideas.md), shape question is Q5 of the round-3 questionnaire.
- Verified: 170 unit tests green, smoke suite green, full flow driven in-browser in both languages (preview→confirm correct path, wrong-confirm hint path, daily picker + read, mid-question language toggle).

## 2026-07-13 — Astro Salon v20: zodiac-guest redesign (round-1 questionnaire iteration)

Yev filled [Astro Salon Questionnaire — Verdict & Direction](../questionnaires/astro-salon-verdict-and-direction.md) — verdict **meh**, one more iteration, with three direction asks. All three shipped the same day.

**Shipped (commit `1c33d3e`, live as v20 — deploy verified: "astro-salon v20" serving at https://yevrap.github.io/KamekoStudio/drafts/astro-salon/):**
- **Signs as the characters (Q3).** Named human clients (Vera, Boris…) cut; the **12 zodiac signs themselves visit as personas, incognito** — each opens with a trait-flavored line (impatient Aries, armchair Taurus…) plus a birthday, you guess who on the wheel, identity revealed on answer. Traits become a second hint channel and a second thing the game teaches.
- **Month-name dates + readability (Q2).** Dates with month names everywhere (wheel wedges, big gold birthday line, cheat sheet, rule texts), sign names on every wedge, bigger labels, season markers (🌸☀️🍂❄️) in the corners, and a "the wheel is the year" rule box explaining the ~20th-to-~20th ranges. Fixed a layout bug found in-browser: radial label offsets garbled the 3/9-o'clock wedges and flipped date order in the bottom hemisphere — labels now stack from one anchor per wedge.
- **EN/RU (Q5).** Full string table with a live header toggle (persisted, `astroSalon_lang`), real Russian astrology vocabulary (Овен, стихии, кардинальный…), correct month grammar, and persona lines gendered to the Russian sign names (Дева feminine, Рыбы genderless). Language switches re-render mid-question with state intact — game state stores keys, never display strings.
- **Q4 (depth) was left unanswered** → deliberately no new surfaces; re-asked in the refreshed questionnaire.
- **Rider:** `npm run smoke` now loads draft prototype pages too (was only the Lab index), so astro-salon is load-tested (14 pages).

**Verified:** 170 unit tests + 14-page smoke green; played in-browser at phone size in both languages — full RU session end-to-end (all 5 question types, wrong-tap season hint, second-try scoring, streak bonuses = scoring math checked, end screen), mid-question EN↔RU toggle, cheat sheet, lang persistence across reload; zero console errors.

**Docs:** [Astro Salon](../../games/astro-salon/README.md) rewritten for v20 (what changed and why, per-answer mapping), [Astro Salon Questionnaire — Verdict & Direction](../questionnaires/astro-salon-verdict-and-direction.md) **refreshed for round 2** (round-1 answers archived in it) — **open, Yev to fill after playing v20**; [Improvements](../../games/astro-salon/ideas.md) updated (RU/readability/reframe moved to Shipped; new ideas: trait profile cards, month tick ring, persona storylines); round-1 meh verdict logged in [Kameko Playtest Log](../../playtest-log.md).

## 2026-07-13 — Jam: Astro Salon prototype (new Lab draft)

Yev asked for **something new to build and play with**; the arcade inbox had his own seed ("teach astrology with dialogue and rules… daily horoscope?"). Ran `/new-game` against the fresh taste brief.

**Shipped (commit `4a2e684`, live as v19 — deploy verified: v19 serving, https://yevrap.github.io/KamekoStudio/drafts/astro-salon/ returns the game):**
- **Astro Salon 🔮** — run a tiny salon; 5 clients/session bring a birthday + a question; you answer on the zodiac wheel. Teaches sign dates, elements, modalities, ruling planets, opposites, and element compatibility via season hints, per-answer rules, and a 📖 cheat sheet. 2⭐/1⭐ scoring with streak bonuses; ~5-min portrait sessions; restart in header. Registered on the Lab index.

**Verified:** full unit suite + 13-page smoke green; played a full session in-browser at phone size (all 5 question types, wrong-answer/hint/reveal path, learn overlay, both restarts) with zero console errors.

**Docs:** [Astro Salon](../../games/astro-salon/README.md) (overview + design decisions), [Improvements](../../games/astro-salon/ideas.md) (cut scope: ru, daily-horoscope surface, houses/rising, expert mode…), [Astro Salon Questionnaire — Verdict & Direction](../questionnaires/astro-salon-verdict-and-direction.md) (**open — Yev to fill after playing**). Verdict goes in [Kameko Playtest Log](../../playtest-log.md).

## 2026-07-13 — Quick-win batch: taste brief, watch-switch cleanup, durak chip, dead-code sweep (p0-08, b-26, p1-24, b-18, b-27)

Started from the Next Best Actions queue. Five small independent items shipped in one pass; Yev answered the one open decision (b-26) in chat — "remove it."

**Shipped (commit `082943a`, docs `20cd7ac`, live as v18 — deploy verified: v18 serving, gate present in live `settings.js`, suit-only comment in live `durak/ui.js`, `#marry` gone from live tysiacha DOM, `docs/brief.md` returns 200):**

- **p0-08 — `docs/brief.md` written.** The taste brief that steers `/new-game`, built faithfully from the answered [Kameko Studio Questionnaire — Taste and Tiers](../../questionnaires/taste-and-tiers.md). Notable: Q2 was *narrow* — Yev checked only "nostalgia/cultural connection" and "right session length (5–10 min)", **not** "decisions over reflexes", "a real opponent", or "card games specifically". The brief calls this out so agents don't assume deep strategy is the draw. Q3 (genre directions) and Q7 (free space) are still blank — flagged TBD in the brief; jams use the durak-benchmark fallback for genre until Q3 lands. `/new-game` now reads the real brief instead of its inline fallback.
- **b-26 — dead Auto-restart switch removed from Keypad Quest & River Run.** Yev's call: "remove it." Added a `hasAutoRestart:false` opt-out to the shared `registerWatchSection`; those two games (no discrete game-over to loop) pass it, so the switch is gone. Durak / Tysiacha / Materials Run / Blob Zapper still show it (verified in-browser: keypad-quest & river-run drawers have no switch, durak's still does). Legacy `keypadQuest_autoRestart`/`riverRun_autoRestart` kept in Clear All Game Data for one-time cleanup of stale values.
- **p1-24 — Durak trump chip shows suit only.** The header chip rendered value+suit ("9♦") while the deck was non-empty; now always suit-only. The actual trump card's rank is already visible face-up under the deck (`#trump-slot`), so the chip was redundant. Verified live: deck at 24 cards, trump value 9, chip shows just the suit symbol — no digit.
- **b-18 — dead `#marry` overlay deleted from Tysiacha.** 1-tap play (p1-12) replaced it with inline `act-play-card`/`act-declare` buttons months ago; nothing could ever un-hide it. Removed markup, handlers, three `setText` localization calls, and the now-unused `marry.title`/`marry.body` i18n keys (en+ru). **Kept `marry.no`/`marry.yes`** — the backlog note said `marry.yes` was removable, but it's live for the action-bar Declare button; caught by grepping `ui.js` before deleting. Overlay confirmed absent from the live DOM; both keys still resolve.
- **b-27 — token-system residue sweep.** Removed the dead 3D "Arcade Tokens" achievement (`shared/3d/gameplay.js`), the orphaned `#settings-get-token-btn` CSS, the empty `updateTokenDisplay()` in hidden-object plus its call site, and a stale token comment in tysiacha. Left `durak/main.js spendTokenAndStart()` alone — it's live and correct, only the *name* is stale (no longer spends tokens); renaming it churns 4 call sites, so it's filed as **b-29** (cosmetic follow-up) rather than expanding this ship's "no behavior change" scope.

**Verified:** 170 unit tests + 13-page smoke + 10 e2e green; all five items checked in-browser locally and on the live site; zero console errors on the touched pages.

**Follow-up filed:** b-29 (rename `spendTokenAndStart` → `startMatch`) in the repo roadmap Backlog.

## 2026-07-12 (late night) — Bugfix: Watch Mode state sync (Keypad Quest + River Run) + first e2e suite (b-28)

From Yev's playtest reports in the [Improvements](../../planning/ideas.md) inbox. All four inbox items resolved or filed.

**Shipped (commit `282b28f`, live as v17):**
- **Keypad Quest — autoplay/take-over/stop all broken.** Two root causes. (1) The shared drawer watch section only wrote `localStorage`, but Keypad Quest's game loop reads in-memory `state.autoPlay` (read once at boot) — so the drawer's ▶ Watch did nothing and "Take Over / Stop" couldn't stop a running watch (its `onStop` was an empty no-op). `registerWatchSection` now takes `onStart`/`onStop` hooks and the game syncs its state there; drawer ▶ Watch from the menu now also starts a run. (2) The auto-typist submits via synthetic `input`/`click` events, and the manual-takeover abort listened to exactly those events — keyboard-mode autoplay cancelled itself after one character; the drawer couldn't restart it. Aborts now fire only on `event.isTrusted`, so real taps take over and the typist can't kill itself.
- **River Run — watch section invisible, ▶ Watch didn't autoplay.** The inline game script registered its drawer sections at parse time, but `shared/settings.js` loads *after* it — `window.KamekoSettings` didn't exist, so both the Watch section and the Invert Drag section silently never appeared (this also explains "nothing in settings to stop"). Registration is now deferred to `DOMContentLoaded`. Separately, the start-screen ▶ Watch button wrote localStorage without setting the in-memory `autoPlay` var (only read at `onload`/drawer close) — now sets it directly. Dead `autoShoot`/`autoAvoid` leftovers removed.
- **Lab games "need tokens".** The actual gates were already removed in Sprint 2 — the buttons just still *said* "Play 1🪙" / "Play (1🪙)". Labels fixed; the games were and are free.
- **Rider:** "Clear All Game Data" crashed on every page — it still called `KamekoTokens.toast()`, deleted with the token system. Replaced with a minimal local toast.
- **New: `npm run e2e`** (`scripts/e2e.mjs`, puppeteer-core like smoke) — 10 behavior-level browser tests: watch start/stop/take-over in both games, keyboard-mode self-abort regression, clear-data, Lab free play. This is the seed of the full core-flows suite Yev asked for → roadmap **p1-36**.

**Also filed:** **b-26** — the shared watch section renders an Auto-restart switch that keypad-quest and river-run never read (dead control; needs a decision — see Improvements note); **b-27** — token residue sweep (dead 3D-mode tokens achievement, orphaned CSS).

**Root cause in one line:** the Sprint 3 watch rollout mixed two state models — games polling localStorage per frame vs. games mirroring it in memory — and the shared drawer only spoke to the first kind.

**Verify:** 170 unit tests, smoke, and 10 e2e green. Live: keypad-quest → ▶ Watch plays all three input modes, drawer stops/takes over; river-run → drawer shows Watch Mode + Invert Drag, ▶ Watch actually dodges obstacles; any page → ⚙️ App → Clear All Game Data shows a toast and reloads instead of dying silently.

## 2026-07-12 — Bugfix: Tysiacha Watch Mode Takeover & Settings Jump

**Shipped:**
- **Tysiacha Watch Mode Takeover (Follow-up):** The AI continued to play even after watch mode was turned off because `later()` resumed the scheduled AI move. Fixed by adding an explicit abort if it is the human's turn and `autoPlay` is false.
- **River Run Watch Mode:** River Run was missing the unified Watch Mode drawer integration from Sprint 3. Integrated it, added a start screen "Watch" button, mapped `autoPlay` to both autoShoot and autoAvoid, and ensured manual interaction (taps or button presses) aborts the autoPlay logic. Fixed `clearAllGameData` to properly cover the new keys.
- **Settings Drawer Jump:** Fixed the UI jumping when selecting a new Watch Speed (which rerenders the game sections). Saved and restored `scrollTop` on the drawer body during rerender.
- **Root Cause:** Pending timeout functions didn't check their state in Tysiacha; incomplete rollout in Sprint 3 for River Run.
- **Commit:** `204f9bc`, `b362a8c`
- **Verify:** Start a Tysiacha match. Open drawer, turn on Watch Mode. Close drawer. AI should immediately start playing. Change Watch Speed in the drawer, the scroll position should not reset to the top.

## 2026-07-12 — Drawer & update polish (Sprint 4)

Phase 4 of [Kameko Studio — Settings & Automation Cleanup Sprint (July 2026)](../plans/kameko-studio-settings-and-automation-cleanup-sprint-july-2026.md). Deployed live.

**Shipped:**
- **p1-34 — Update UX deferral**: the auto-update banner no longer interrupts active gameplay on visibility-change/pageshow; it defers until the next time the drawer is opened or the gallery context is active. Manual checking continues to work directly.
- **p1-35 — Drawer regroup**: The Arcade-wide UI components in the settings drawer (Games switcher, Theme, Gallery, App details) were consolidated into a distinct visual "Arcade" cluster with its own background and border, cleanly separating arcade-level settings from game-specific settings.
- **b-16 — Drawer scroll affordance**: Added a linear gradient fade at the bottom of the drawer to signal scrollable content below. Also resets the drawer scroll position to 0 on open.

**Verified:** 170 unit tests green. Smoke tests green. Drawer visually confirmed. GitHub Pages deploy triggered via `v16`.


## 2026-07-12 — Free Arcade (Sprint 2) / Token Removal (p1-33)

Sprint 2 of [Kameko Studio — Settings & Automation Cleanup Sprint (July 2026)](../plans/kameko-studio-settings-and-automation-cleanup-sprint-july-2026.md). Deployed live.

**Shipped:**
- **p1-33 — Remove the token system:** Completely removed the `KamekoTokens` system. All games are now free to play without token gates.
- Removed token costs and `▶ Play · 1 🪙` badges across all game index files and start UI (`durak`, `tysiacha`).
- Stripped `KamekoTokens.earn()` logic and token toasts from all session-end paths.
- Removed token display UI from `hidden-object` and `shared/settings.js` drawer.
- Updated documentation (`CLAUDE.md`, `promotion-checklist.md`, `GEMINI.md`) to reflect total token removal.

**Verified:** Zero grep matches for `KamekoTokens` or token currency outside of roadmap and tests. 170 unit tests green. GitHub Pages deploy confirmed.

## 2026-07-12 — Settings-key hygiene & drawer fix (b-19, b-20, b-17)

Phase 2 (Sprint 1) of [Kameko Studio — Settings & Automation Cleanup Sprint (July 2026)](../plans/kameko-studio-settings-and-automation-cleanup-sprint-july-2026.md). Deployed live.

**Shipped:**
- **b-19 — settings-key hygiene & guard test:** Full literal-key inventory taken. Missing automation keys added to `clearAllGameData` in `shared/settings.js` and `games/CLAUDE.md`. Added a robust guard test (`tests/guard-localStorage.test.mjs`) that scans the codebase for new keys and asserts they are covered, preventing drift.
- **b-20 — river-run drawer lifecycle:** Refactored `games/river-run/index.html` to migrate the drawer section to the new b-14 lifecycle. The settings section is now registered once at boot instead of on every `settingsOpened` event, and the old remove-on-close hack was dropped.
- **b-17 — Root gallery 404 console error:** Injected a zero-asset data-URI emoji SVG favicon via `shared/settings.js` to eliminate the implicit `/favicon.ico` 404 error across all 13 pages without requiring per-page markup edits.

**Verified:** 170 unit tests (including the new guard test) and 13-page smoke test green. Local storage correctly clears on manual action. River Run settings UI verified in-browser. GitHub Pages deploy confirmed.

## 2026-07-12 — Surface shrink: durak-likes to the Lab, waterfall deleted (p1-29 + p1-30)

Phase 1 of [Kameko Studio — Settings & Automation Cleanup Sprint (July 2026)](../plans/kameko-studio-settings-and-automation-cleanup-sprint-july-2026.md). Commit `e56cad2`, live as **v15** (deploy verified: gallery clean, Lab lists 3, waterfall 404s).

**Shipped:**
- **p1-29 — durak-dungeon, durak-tactics, durak-alchemist shelved to the Lab.** Gallery cards, Recently-Played/Best-Scores meta rows, 3D-room portals, and drawer quick-switcher entries removed. The Lab (`drafts/`) gained a purple-accented **"Shelved from the arcade"** section linking all three at their unchanged `games/` URLs — code untouched, still playable, smoke test still covers them.
- **p1-30 — waterfall deleted** per the taste-questionnaire verdict (code remains in git history). `lastPlayed_waterfall` removed from Clear All Game Data; doc tables cleaned.
- Root gallery and switcher now show exactly the **7 invest-tier games**.

**Judgment calls:** Durak Dungeon / Durak Alchemist rows also removed from the gallery's "Your Best Scores" list (a Lab game's score on the arcade dashboard felt inconsistent; localStorage data kept). Historical waterfall mentions in `docs/archive/` left intact — archives are records.

**Verified:** 169 unit tests + 13-page smoke green; gallery, Lab, and drawer checked in browser locally and on the live site.

**Open follow-up:** what settings drawer convention Lab games keep is Q7 of [Kameko Studio Questionnaire — Settings, Automation & Tokens](../questionnaires/kameko-studio-settings-automation-and-tokens.md) (Yev is filling it in — Q1=A already answered).

## 2026-07-11 — Blob Zapper Auto Play Visualizer (p2-26)

Implemented the "Automated Defense Grid" auto-play mode for Blob Zapper. Commit `4cc8c44`, deployed live.

**Shipped:**
- **Auto Play Laser Grid:** The game periodically scans for the largest blob on the screen, targets it with a shrinking/spinning red reticle, and fires a laser beam from the destruction zone to zap it procedurally.
- **Auto Restart:** Added a toggle to automatically restart the game in an endless screensaver loop.
- **Settings:** Both Auto Play and Auto Restart are exposed in the settings drawer and persisted to `localStorage`.
- **Manual Takeover:** Touching the screen to manually push blobs automatically pauses the auto play laser grid until the user stops touching.

**Verify:** live Blob Zapper → Settings Drawer: Auto Play ON, Auto Restart ON → watch the game pop blobs.

**Docs:** overview updated in [Kameko Studio — Auto Play Visualizers](../plans/kameko-studio-auto-play-visualizers.md).

## 2026-07-11 — Materials Run Auto Play Visualizer (p2-25)

Implemented the "Pathfinder Bot" auto-play mode for Materials Run. Commit `72cd18a`, deployed live.

**Shipped:**
- **Auto Play Bot:** The bot evaluates the grid and automatically places movement pins to navigate the player towards the target tile while avoiding enemies and the danger zone.
- **Auto Restart:** Added a toggle to automatically restart the game in the same mode upon win or game over.
- **Spectate Button:** Added a Spectate button to the start screen to immediately start an auto-play session in Score mode.
- **Settings:** Both Auto Play and Auto Restart are exposed in the settings drawer and persisted to `localStorage`.
- **Manual Takeover:** Interacting with the grid automatically pauses the bot for 3 seconds.

## 2026-07-11 — Keypad Quest Auto Play Fixes (Speed & Predictability)

Fixed the root cause of the Auto Play state unpredictability and added a Speed setting. Commit `b16c2db`, deployed live.

**Shipped:**
- **Mode Toggle Bug:** The "Auto Play" and "Auto Restart" buttons used the `.mode-btn` CSS class, which triggered the global input-mode switcher in `main.js`. Clicking Auto Play was wiping out the active input mode (setting it to `undefined`), causing the Auto Typist to break silently. Clicking "Tap to Spell" fixed it because it properly restored a known mode. Fixed the delegated click listener to only switch modes if `dataset.mode` is present.
- **Speed Settings:** Added a Speed Selector (Slow, Normal, Fast) to the Auto Play drawer section, saved to `localStorage`, and updated the `updateAutoPlay` loop to type at 350ms, 120ms, or 40ms delays respectively.
- **Auto Restart Removed:** Removed the "Auto Restart" toggle since Keypad Quest operates on continuous, endless waves and has no discrete game-over state to restart from.

## 2026-07-11 — Keypad Quest Auto Play Bug Fix

Fixed two bugs with the Auto Play Virtual Typist in Keypad Quest. Commit `f4e2df6`, deployed live.

**Shipped:**
- **Predict Mode Bug:** The virtual typist was passing the expected letter to the T9 input handler instead of the expected T9 key, causing the predict mode logic to instantly fail and get stuck. Fixed by translating the expected letter into its corresponding T9 key before passing it to the handler.
- **Responsiveness/UX:** Changed the "Auto Play" toggle in the settings drawer to immediately close the drawer when enabled. Because the game pauses while the drawer is open, previously users would click the toggle and see no feedback that the virtual typist had started until they manually closed the drawer.

## 2026-07-11 — Keypad Quest Auto Play Visualizer (p2-24)

Implemented the "Virtual Typist" auto-play mode for Keypad Quest. Commit `86229bb`, deployed live.

**Shipped:**
- **p2-24 — Keypad Quest: Auto Play Visualizer**: Added a "Spectate (Auto-Play)" button to the start menu, and "Auto Play" and "Auto Restart" toggles to the settings drawer under a new "Auto Play (Virtual Typist)" section.
- **Virtual Typist**: Added an `updateAutoPlay` loop in `input.js` (called from `rendering.js` `loop`) that types characters natively into whichever input mode buffer is active (Scroll T9, Predict T9, or Keyboard). It types one character every 120ms to simulate a human typist pacing themselves.
- **Human Takeover**: Works seamlessly because the auto typist just reads the active input buffer length/position and appends the next expected character. If the user starts typing, the visualizer just keeps appending correctly to whatever they typed.
- **Tests**: 168 tests run and passed.

**Verify:** live Keypad Quest → click "🤖 Spectate (Auto-Play)" from the start menu.

**Docs:** design and implementation plan updated in [Kameko Studio — Auto Play Visualizers](../plans/kameko-studio-auto-play-visualizers.md).

## 2026-07-11 — Tysiacha Auto Play Visualizer (p2-23)

Implemented the "Simulated Tournament" auto-play mode with Auto-Restart for Tysiacha. Commit `670ec19`, deployed live.

**Shipped:**
- **p2-23 — Tysiacha: Auto Play Visualizer**: Added "Auto Play Visualizer", "Fast Forward", and "Auto-Restart" toggles to the settings drawer under a new "Simulated Tournament" section.
- **AI driving human seats**: Modified `gameplay.js` (`step`, `bidStep`, `winBidding`) to allow `ai.js` logic to drive the human seat when Auto Play is enabled. The `fastForward` toggle significantly reduces the timeout delays between actions.
- **Auto-Advance**: Modified `main.js` `state.onDealEnd` to automatically click the next-deal or new-match button after a brief delay if Auto Play is enabled.
- **Tests**: Ran the existing 168 tests, all passed.

**Verify:** live tysiacha → Settings Drawer: Simulated Tournament toggles ON → watch the AI play.

**Docs:** overview updated in [Tysiacha (1000)](../../games/tysiacha/README.md); design note at [Kameko Studio — Auto Play Visualizers](../plans/kameko-studio-auto-play-visualizers.md).

## 2026-07-11 — Bugfix: Durak Start Screen Layout (mode/player toggle collapse)

The auto-play visualizer addition pushed the start-overlay content tall enough to overflow the viewport. The `scrollable-modal` class uses `overflow-y: auto` to allow scrolling, but flex layout was silently **shrinking children to zero height** instead of scrolling — the `display: flex; flex-direction: column` container compresses items by default. The mode toggle and player count toggle had `overflow: hidden`, so when flexbox crushed them to zero height, they disappeared completely. Commit `7c3d30d`, deployed live.

**Shipped:**
- **CSS fix**: Added `.scrollable-modal > * { flex-shrink: 0; }` to `style.css`. This ensures every direct child of a scrollable modal retains its natural height, so `overflow-y: auto` kicks in and actually scrolls rather than collapsing content silently.
- All three scrollable modals (start screen, edit names, log/rules overlays) benefit from this rule.

**Root cause**: `flex-shrink` defaults to 1 on all flex children. When the start screen's total content height exceeded the viewport (which the auto-play addition caused), flex compressed items proportionally. Elements with `overflow: hidden` (the mode/count toggles) went visually invisible at zero height. The previous fix attempts only applied `flex-shrink: 0` to individual components, not the whole child set.

**Verify:** live durak start screen — MODE toggle (vs Computer / Hot-seat) and PLAYERS count buttons (2–6) should both be visible and scrollable on small viewports.

## 2026-07-11 — Durak Auto Play Visualizer (p2-22)

Implemented the passive auto-play mode ("Spectate AI Match") with Auto-Restart toggle for Durak. Commit `5b38b4b` (docs) and `319953e` (code), deployed live.

**Shipped:**
- **p2-22 — Durak: Auto Play Visualizer**: Added "Auto Play Visualizer" and "Auto-Restart Match" toggles to the game setup screen under a new "Automation" section. Also added an "Auto Play" quick action in the settings drawer to toggle it mid-game.
- **AI driving human seats**: Modified `ai.js`'s tick loop and `main.js` to allow `scheduleAiAction` to play for the human seat when Auto Play is enabled. The human player can seamlessly tap a card to takeover without explicitly turning off the toggle; if they are faster than the AI's 500-900ms delay, their action executes.
- **Auto-Restart**: Modified the `tick()` gameover branch to wait 2.5 seconds and call `spendTokenAndStart()` if the feature is toggled on.
- **Tests**: Ran the existing 168 tests, all passed.

**Verify:** live durak → Rules: Automation toggles ON → Play. Watch the AI play for you, or tap a card to take over a turn.

**Docs:** design and implementation plan updated in [Kameko Studio — Auto Play Visualizers](../plans/kameko-studio-auto-play-visualizers.md).


## 2026-07-11 — Bugfix: Durak Post-Transfer Draw (p0-15)

From Yev's screenshot (durak idea inbox): his hand was stuck at 5 cards during his own attack turn with the deck non-empty — a follow-on bug from the same-day perevodnoy sprint below. Commit `3ee87b4`, deployed live.

**Shipped:**
- **p0-15 — original attacker never redrew to 6 after a transfer**: `playTransfer` (`gameplay.js`) did `state.contributionOrder = [seat]`, overwriting the array instead of adding to it. The seat that threw the original attack — already recorded in `contributionOrder` by `playAttack` — was silently dropped, and `drawPhase`'s "ensure primary attacker draws" fallback didn't catch them either, because `playTransfer` also reassigns `state.attackerSeat` to the transferrer. Net effect: whoever threw the first attack of a transferred bout stopped drawing replacement cards for the rest of the game. Same defect applied to chain transfers (a transferred-to player who transfers again). Fix: push instead of overwrite.
- **Test gap closed**: the existing suite had actually baked in the buggy value (`contributionOrder === [1]` post-transfer, missing seat 0) — the perevodnoy variant shipped same-day as p0-14/p1-21 with no test exercising the draw phase after a transfer. Updated that assertion and added a regression test that plays a full transfer bout to `'defended'` and checks every contributing seat redraws to 6. 169 tests green + smoke suite.
- **Verified two ways**: the Node test suite, and live in the browser by driving the exact scenario through the running page's own ES modules (`gameplay.js`/`state.js` imported directly in devtools) — confirmed all three hands settle at 6 with zero console errors, then the game continued normally.

**Verify:** live durak → Rules: Perevodnoy ON → play until a transfer happens → after the bout resolves, every seat that threw a card into it should be back at 6 (deck permitting).

**Docs:** root cause + triage in [Improvements](../../games/durak/ideas.md); overview updated in [Durak overview](../../games/durak/README.md).

## 2026-07-11 — Durak Perevodnoy Sprint (p0-14, p1-21, p1-09, p1-10)

From Yev's playtest of the transfer variant: the game hung after transfers, and a dual-purpose card auto-transferred with no way to choose. One commit `ca11114`, deployed as **v14**, verified live.

**Shipped:**
- **p0-14 — post-transfer deadlock fixed**: after a transfer left 2+ undefended attacks, covering one handed priority back to the attacker, who could neither add a card (no rank match) nor pass (field not fully defended) — the AI no-op'd forever ("CPU 2 attacking…", the screenshot from the inbox). Priority now stays with the defender until every attack is covered. Also: a defense may now cover *any* open attack the tapped card beats (was silently rejecting cards that couldn't beat the first open one specifically), and the AI takes when the first open attack has no beater.
- **p1-21 — transfer-or-beat choice popup**: when one card is legal as both (trump matching the attack rank), a modal asks ⇄ Transfer / 🛡 Beat; tap outside cancels. Single-purpose cards play instantly as before.
- **p1-09 — hand sort**: ☰ → Current Match → Off/Suit/Strength, display-only, persists as `durak_sort`.
- **p1-10 — finishing placements**: game-over lists every seat's finish (your row highlighted, Durak in red) via new `state.finishOrder`.
- **Test gap closed**: p2-11 had shipped with zero transfer tests; 11 added (deadlock regression, transfer legality, any-open-attack defense, finish order) — 167 green + smoke suite.

**Verify:** live durak → Rules: Perevodnoy ON → play until a transfer chain happens (or trump-6 vs 6 attack for the popup). Game-over shows the placement list.

**Docs:** overview updated in [Durak overview](../../games/durak/README.md); inbox triaged in [Improvements](../../games/durak/ideas.md); open decisions in [Durak Questionnaire — Perevodnoy UX](../questionnaires/durak-perevodnoy-ux.md) (Q1–Q5: defense targeting, popup style, ties, sort placement, 2p placements).

## 2026-07-11 — Bugfix: Tysiacha Drawer Freeze

**Shipped:**
- **Tysiacha AI Freeze Fix** (`3a2f09b`): fixed a bug where toggling 1-Tap Play (or opening the drawer) during an AI's turn or trick resolution would permanently freeze the game. `tysiacha` pauses its game loop when the drawer opens, but its `later()` timer just dropped executing callbacks if fired during a pause. The timer now saves the pending callback into `state.resumeAction` if fired while paused, and `main.js` correctly restarts the stalled game loop action when the drawer closes. Deployed to GitHub Pages.

## 2026-07-11 — Settings Drawer Recovery Sprint (p0-12, p0-13, p1-17…p1-20, b-14, b-15)

The full sprint from [Kameko Studio — Settings Drawer Audit & Sprint (July 2026)](../plans/kameko-studio-settings-drawer-audit-and-sprint-july-2026.md), steered by Yev's answers in [Kameko Studio Questionnaire — Settings & Drawer UX](../questionnaires/kameko-studio-settings-and-drawer-ux.md) (Q1–Q5, all option A except Q5=B). Eight commits, `972820c` → `b2e70a3`, deployed as **v13** at https://yevrap.github.io/KamekoStudio/.

**Shipped:**
- **p0-12 — Tysiacha un-broken** (`972820c`, pushed alone and live within the hour): the drawer migration had left `localizeStatic()` writing to deleted elements, which crashed boot (empty table on the live site) and killed every drawer binding, including player rename. Localization is now split page/drawer with null-safe setters.
- **b-14 — drawer API lifecycle** (`cdedb6e`): sections register once at boot and re-render on every open (`title` can be a function, `when()` hides a section contextually). All four games dropped their remove-on-close hacks.
- **p1-17 — Tysiacha New Match setup screen** (`aed9c3f`, Q1=A/Q2=A): names, target score and classic rules moved out of the drawer to a proper setup overlay (durak's pattern); boot lands there instead of auto-spending a token; Play says `▶ Play · 1 🪙` when it charges and a settings-triggered restart mid-session is **free**; ↺ opens the setup instead of silently restarting; match settings finally persist (`tysiacha_settings`); full en/ru.
- **p1-18 — durak context-aware drawer** (`a49c8d9`, Q5=B): no more "Current Match"/"End round" on the start menu; perevodnoy toggles moved to the start screen's Rules block; coach hints is a Quick Action button in both card games now.
- **p1-19 + p1-20 — shared chrome** (`1e37d72`, Q3=A/Q4=A): quick game switcher (emoji row, current game highlighted — the inbox idea, Yev said yes in Q4); theme+gallery side by side; dev tools/version folded into a collapsed ⚙️ App disclosure. Tysiacha's drawer went from ~1523px to ~800px of scroll.
- **b-15** (`4fcdd5d`): Clear All Game Data now actually clears everything (verified empty localStorage).
- **p0-13 — page-load smoke test** (`45c74a8`): `npm run smoke` loads all 14 pages in headless Chrome and fails on any boot error — the check that would have caught p0-12 (verified by reintroducing the crash). This closes the "156 tests green while the game was unbootable" gap.

**Verify:** any game → ☰ menu (short drawer, Games switcher row, collapsed App section). Tysiacha → lands on New Match screen, rename works and survives reload. Durak menu → no phantom match section; rules on the start screen.

**Docs:** findings + design in [Kameko Studio — Settings Drawer Audit & Sprint (July 2026)](../plans/kameko-studio-settings-drawer-audit-and-sprint-july-2026.md) (updated with ship status); overview updated in [Tysiacha (1000)](../../games/tysiacha/README.md); new capture in [Improvements](../../planning/ideas.md).

## 2026-07-10 — Unified Settings Drawer Refactor (All Games)

**Shipped** (commit `641732d`):
- **Unified Drawer API**: Replaced per-game settings overlays and custom UI injections with a single, shared slide-out drawer (`shared/settings.js` / `shared/settings.css`).
- **Hamburger Menu Trigger**: Replaced the floating gear icons with a standardized top-left hamburger menu trigger across all games (`durak`, `tysiacha`, `durak-dungeon`, `keypad-quest`, `durak-tactics`).
- **Game Integrations**: All games now hook into the `settingsOpened` and `settingsClosed` events to pause/resume their main loops, and inject per-game rows (like Input Mode or Match Stats) using `window.KamekoSettings.registerSection`.
- **UI Cleanups**: `tysiacha` and `durak` headers were cleaned up; removed custom modal and redundant topbar buttons.

**Docs:** Logged to [Durak Overview](../../games/durak/README.md) and [Tysiacha Overview](../../games/tysiacha/README.md).

## 2026-07-10 — Settings Drawer Refactor: Hotfixes

**Shipped** (commit `7f87b3c`):
- **Tysiacha Settings Fix**: Fixed a DOM timing bug in the `KamekoSettings.registerSection` API where sections were trying to initialize `innerHTML` components before the wrapper was attached to the document. This resolves the missing Tysiacha options menu.
- **Token Toast Text**: Updated the fallback "out of tokens" toast message to correctly instruct the user to "Open ☰ Menu" instead of referencing the old gear icon.

## 2026-07-10 — Durak: Perevodnoy (Transfer), Coach Hints, and Game Log (p2-11, p2-14)

**Shipped** (commit `c9854ab`):
- **Perevodnoy Variant (p2-11)**: Added a rules toggle for transferring attacks to the next player. The `legalTransfer` check prevents transferring if the next defender has fewer cards than the total number of attacks. Also included a "First Turn Transfer" toggle.
- **Coach Hints & Game Log (p2-14)**: Added a *Tysiacha*-style 📜 logbook drawer that displays the full event history of the match. Added a `Coach Hints` toggle that dynamically queries the Hard AI logic (`getHardAiMove`) and displays its recommendation in a `#coach-banner` during the human's turn. To prevent log spam, the hint is only appended to the Game Log when the advice materially changes.

**Docs:** Logged to [Durak Overview](../../games/durak/README.md).


## 2026-07-10 — Tysiacha: Polish UX & Animations (p1-12 hotfix follow-up)

**Shipped** (commit `0991e15`):
- **Select-to-Act vs 1-Tap Play**: Added a setting to choose between 1-tap play (default) and select-to-act. When select-to-act is enabled, tapping a card selects it, and a "Play Card" / "Сыграть" button appears. This allows players to carefully select which cards to give away or play, without accidental misclicks. 
- **Premium Animations**: Replaced linear transitions with spring-like easing curves (`cubic-bezier(0.34, 1.56, 0.64, 1)` and `ease-in-out`), giving card flips, hovers, and sweep-to-winner a bouncier, premium feel.

**Docs:** Logged to [Tysiacha Improvements](../../games/tysiacha/ideas.md).


## 2026-07-10 — Tysiacha: fix game-breaking crash from p1-12 (hotfix)

**Bug:** Yev reported the live game hanging when it was an opponent's turn to bid, Restart spending a token and then hitting the same freeze, and the game feeling "slow." Root cause: commit `efa8cde` (p1-12 card animations, same day) deleted the `import { aiBid as aiDoBid, aiExchange as aiDoExchange, aiMove as aiDoMove, estimateHand } from './ai.js';` line from `gameplay.js` while leaving all three call sites in place. The human's forced opening bid always goes first, so every match got as far as the opponent's first bid and then threw a silent `ReferenceError` inside a `setTimeout` callback — game froze there. Restart re-spent a token and hit the identical crash on the very next AI turn.

**Fixed** (commit `865e0a4`, deployed as v11): restored the import line. One-line fix. 43 tysiacha tests green (durak.test.mjs had one unrelated failure from a different session's in-progress, uncommitted durak work — left untouched). Verified in browser: full deal through bidding → talon → exchange → a resolved trick → Restart, with `state.give`/`state.phase` inspected directly via dynamic `import()` at each step, zero console errors throughout. Live site confirmed serving v11 with the corrected file.

**Note for next session:** the p1-12 animation work itself (FLIP card movement, 1-tap play, sweep-to-winner) was shipped by a separate agent session without planning docs — this hotfix entry is the first planning-docs record of it. Worth a look-over next time Tysiacha comes up: the marriage-prompt overlay (`#marry`) in `index.html`/`main.js` looks like dead code now that 1-tap play replaced it with inline `act-play-card`/`act-declare` buttons — not broken, just unused, low-priority cleanup.

## 2026-07-10 — Tysiacha: Card Animations & 1-Tap Play (p1-12) — sprint complete

- **FLIP Animations & Trick Sweep (p1-12)** — Cards now slide smoothly from hand to the trick, and won tricks sweep gracefully to the winner's avatar using FLIP technique (commit `efa8cde`).
- **1-Tap Play & Selectability Fix** — Normal cards now play instantly on tap (no double-tap required). Marriages remain selectable with explicit "Play Card" / "Declare Marriage" buttons in the action bar. Selecting a card slightly shifts adjacent cards to keep them visible.
- **Tokens Check** — Fallback added for failed token checks on startup.

**Docs:** Checked off in [Tysiacha Improvements](../../games/tysiacha/ideas.md).

## 2026-07-10 — Tysiacha: Russian toggle, AI difficulty, player names, sound (p1-14, p2-18, p2-21, p1-13) — sprint complete

**Shipped** (three feature commits `d0dc684` → `0794526` → `a460e8b` + docs `90a3c09`, deployed as v10 — the "Language & Opponents" sprint):

- **🇷🇺 Russian language toggle (p1-14)** — new `i18n.js` with a full en/ru string table: every event line, coach hint, the rules overlay, settings, scoring notes, and even the rank letters on the cards (Т В Д К). The select in the game's ⚙️ menu applies **live, mid-deal, no restart** — and because log entries are typed rather than stored as text, the *entire match history* re-renders in the chosen language. Persisted as `tysiacha_lang`, default English.
- **AI difficulty setting (p2-18)** — Easy / Normal / Hard in ⚙️, applies live. Easy bots bid timidly and blunder in play (random dumps, forgotten marriages); Hard bots price their hands tightly, protect K+Q pairs, and win tricks specifically to unlock a marriage declaration. Persisted as `tysiacha_difficulty`. The named-personality flavor (cautious Vera / aggressive Boris) was deliberately cut to the Improvements inbox.
- **Custom player names (p2-21, added on request this session)** — rename any seat in ⚙️ (defaults stay localized: You/Vera/Boris ↔ Вы/Вера/Борис). Renaming yourself flips the log to third person ("Yev passes" / "Yev пасует"); Russian phrasing uses case-neutral «игроку <имя>» so custom names never need declension.
- **🔊 Sound (p1-13)** — synthesized WebAudio in new `sfx.js` (no asset files): card **snap** on every play, marriage **chime**, bid-won **gavel**. Sound toggle in ⚙️, persisted as `tysiacha_muted`.

**Verified:** 156 repo tests green (7 new: ru/en event grammar, rank letters, name overrides + third-person flip, difficulty estimate bounds). Browser playthroughs in both languages: settings all apply live, whole log re-rendered en↔ru, renamed seats flowed through banners/log/scoreboard, zero console errors or autoplay warnings. Live site confirmed serving v10 with the new files.

**Docs:** [Tysiacha (1000)](../../games/tysiacha/README.md) (updated) · [Tysiacha Questionnaire — Language, Difficulty & Sound](../questionnaires/tysiacha-language-difficulty-and-sound.md) (**new — please fill**, includes the «объявляет марьяж» vs «хвалюсь» wording question) · [Tysiacha Improvements](../../games/tysiacha/ideas.md) (checked off + new inbox items).

**Next:** p1-12 card animations is the last open Phase-1 polish item; then the teaching items (p2-15 scripted first deal, p2-16 post-deal analysis). Studio-wide, `p0-08` (taste brief) is still blocked on the Kameko Studio questionnaire.

## 2026-07-09 — Tysiacha: trick audit rows + deal recap (p2-20) — sprint complete

**Shipped** (commit `f424587`, deployed as v7): slice 3/3 of the [game-log & clarity sprint](../plans/tysiacha-game-log-and-clarity-design.md). In the 📜 log, each completed trick is now an **audit row**: the three cards as mini card chips in play order (leader tagged "led", winner gold-bordered, player named under each) with winner, points, and reason alongside. The deal-end summary gains a **"📜 Review deal"** button that opens the log above it. Rendering-only change; 149 tests green; verified in browser (audit row correct, review button stacks over the summary, zero console errors); live site serving v7. **The sprint from this morning's playtest confusion is fully shipped.**

## 2026-07-09 — Tysiacha: 📜 log drawer (p1-16)

**Shipped** (commit `3fad1c1`, deployed as v6):
- Slice 2/3 of the [game-log & clarity sprint](../plans/tysiacha-game-log-and-clarity-design.md). A 📜 button (top-left of the table, mirroring the trump chip) opens the game log: every deal of the match grouped in collapsible sections (current deal open — Q9 decision), "Trick N" headers, and color-coded lines — milestones in green, marriages in gold, trick results bold with their reasons, plays and bids muted, hints in italic teal, ♥/♦ suits in red.
- **Hints are always captured** (Q10): what the coach *would say* is logged at every human decision point — bidding, exchange, each play turn — even with the Hint bar off. The bar toggle now only controls live display; after a confusing moment you can open the log and read the advice retroactively.
- The drawer live-updates while open (the game keeps playing underneath), closes by tap-outside or ✕, and has zero footprint when closed.

**Verified:** 149 repo tests green (3 new). Browser playthrough: a full bidding → talon → ♦-marriage → trick sequence read back correctly in the drawer, live updates appeared while it was open, backdrop tap closed it, zero console errors. Live site confirmed serving v6.

**Docs:** [Tysiacha — Game Log & Clarity Design](../plans/tysiacha-game-log-and-clarity-design.md) · [Tysiacha (1000)](../../games/tysiacha/README.md) · [Tysiacha Improvements](../../games/tysiacha/ideas.md).

**Next:** p2-20 — trick audit rows + "review deal" from the scoring screen — completes the sprint.

## 2026-07-09 — Tysiacha: event stream + ambient trick clarity (p1-15)

**Shipped** (commits `5647035` docs + `9c92b1b` feat, deployed as v5):
- Slice 1/3 of the [game-log & clarity sprint](../plans/tysiacha-game-log-and-clarity-design.md), planned earlier the same day from a playtest where a *correctly* resolved trick looked like a bug (led suit invisible, banner overwritten, trick swept away).
- **Event stream** (`log.js`): every game action — deal, bids/passes, talon, exchange, plays (with leader flag + trump at the time), marriages, trick results, deal scores — appends a typed entry to a match-long `state.log`. The banner is now a *view* of the log (`announce()`), so live announcements and history can never disagree. This is the foundation the 📜 log drawer (p1-16) renders from.
- **Ambient clarity, always on:** gold "led" badge on the leader's trick slot; the trump chip gains a led-suit column during a trick ("♦ led · no trump" — Q8); trick banners now explain *why* ("You take the trick (+13 — highest ♦)" / "trumped with 9♠"); the winning card pulses during the 1.25s resolve pause (pace unchanged — Q11).
- Also folded all four filled questionnaire answers (Q8–Q11) into the design note + roadmap, and the older answers into their items: Russian toggle now includes rules/help (p1-14), AI ability becomes a difficulty setting (p2-18).

**Verified:** 146 repo tests green (6 new: event stamping, trick reasons, banner grammar, scripted-trick replay, marriage logging). Browser playthrough: led A♦ showed the led badge + "♦ led" chip; a trick where Vera discarded off-suit — the exact playtest confusion — showed the winning 10♦ pulsing and a reasoned banner. Live site confirmed serving v5.

**Docs:** [Tysiacha — Game Log & Clarity Design](../plans/tysiacha-game-log-and-clarity-design.md) (updated to in-progress, decisions folded in) · [Tysiacha Improvements](../../games/tysiacha/ideas.md) · [Tysiacha (1000)](../../games/tysiacha/README.md) (teaching-layer section).

**Next:** p1-16 — the 📜 log drawer (whole-match scope, hints always logged per Q9/Q10) — then p2-20 audit rows + deal recap.

## 2026-07-09 — Tysiacha Promotion

**Shipped** (commit `feat: promote tysiacha from drafts to arcade`, deployed):
- Promoted **Tysiacha** from `drafts/` to `games/` following the full promotion checklist.
- Extracted logic into ES modules (`constants.js`, `state.js`, `gameplay.js`, `ai.js`, `ui.js`, `main.js`).
- Added robust unit test coverage in `tests/tysiacha.test.mjs`.
- Integrated shared infrastructure (token gating, token earning, dark mode, settings overlay).
- Registered the game in the arcade dashboard and `3d.html` portal.
- Triaged Yev's questionnaire answers into the roadmap (coach hint toggle, 500-point default, toggleable classic rules).

**Verified:** `node --test tests/` green, `node scripts/generate-context-docs.js --check` clean. GitHub Pages deploy verified.

**Docs updated:** [Tysiacha (1000)](../../games/tysiacha/README.md) · [Improvements](../../games/tysiacha/ideas.md).

## 2026-07-09 — Studio-loop infrastructure + first jam: Tysiacha draft

**Shipped** (commits `8bbf01d`, `6626118`, `dde8437`, deployed as v4):

- **p0-09** — `/new-game` jam command (`.claude/commands/new-game.md`): pitch 3 → build strongest as single-file draft → PLAYTEST.md → register in the Lab → ship. Runs on a fallback taste brief until the [Kameko Studio Questionnaire — Taste and Tiers](../../questionnaires/taste-and-tiers.md) is filled (p0-08 stays open until then).
- **p0-10** — **The Lab** (`drafts/index.html`): prototype index, linked from the arcade root header as "Lab 🧪". Live: https://yevrap.github.io/KamekoStudio/drafts/
- **p0-11** — Promotion checklist (`docs/promotion-checklist.md`): the 6-phase path a keep-verdict draft pays to graduate into `games/`.
- **p3-04 (new)** — **Tysiacha (1000) prototype** — the jam itself; direction picked by Yev in-session (wanted the 1000 game, doesn't know the rules → built teach-first). 3-player vs 2 AI: forced-100 bidding, revealed talon + card exchange, strict follow-suit/forced-trump tricks, K+Q marriage declarations set trump + score bonuses (♥100/♦80/♣60/♠40), race to 1000. Teaching layer: 5-step how-to overlay, always-on Coach bar, illegal cards dimmed with tap-to-explain, two-tap play. **Play it: https://yevrap.github.io/KamekoStudio/drafts/tysiacha/**

**Verified:** `node --test tests/` green (113+ tests, 0 fail); full browser playthrough on mobile viewport — deal as declarer (marriage declared, bid made +100) and as defender (AI failed bid −100), 120-point invariant held both deals, zero console errors; GitHub Pages deploy confirmed serving v4 and both new URLs.

**Docs:** [Tysiacha (1000)](../../games/tysiacha/README.md) — game overview, rules as implemented, design decisions · [Tysiacha Questionnaire — Rules and Direction](../questionnaires/tysiacha-rules-and-direction.md) — your input on rules/length/language/AI · [Tysiacha Improvements](../../games/tysiacha/ideas.md) — future-work inbox.

**Next:** play Tysiacha on the phone, then log a verdict line in [Kameko Playtest Log](../../playtest-log.md) (`2026-07-XX — tysiacha (draft) — keep|meh|kill — why`) and fill [Tysiacha Questionnaire — Rules and Direction](../questionnaires/tysiacha-rules-and-direction.md). A **keep** triggers the promotion checklist; filling the [Kameko Studio Questionnaire — Taste and Tiers](../../questionnaires/taste-and-tiers.md) unblocks p0-08 (taste brief) and makes future jams self-steering.

### 2026-07-09: Tysiacha Rule Variants and UI Updates
* **What shipped**: Implemented post-promotion features based on questionnaire feedback.
  * Coach defaults to off, renamed to Hint (no game restart).
  * `?` button renamed to Rules.
  * Added ⚙️ Settings menu with Target Score (500/1000).
  * Added classic rules: The Barrel, Bolts, Rounding, Hidden Points, Raspasy, and Re-raise.
* **Commit**: `5db3d40`
* **Live**: [Tysiacha](https://yevrap.github.io/KamekoStudio/games/tysiacha/)
* **Notes**: [Tysiacha (1000)](../../games/tysiacha/README.md)

## 2026-07-12: Watch Mode — unified automation UX (Sprint 3)
**Shipped:** p1-32
Consolidated auto-play functionality across durak, tysiacha, keypad-quest, materials-run, and blob-zapper into a unified "Watch Mode".
- Added a "▶ Watch" button to the start screen of all 5 games.
- Replaced custom drawer rows with a shared `KamekoSettings.registerWatchSection()` helper.
- Standardized automation settings keys and behavior (e.g. `tysiacha_autoPlaySpeed`, `tysiacha_revealHands`).
- Cleaned up localized speed checks and toggles.
- Fixed `localStorage` ReferenceError in Node tests caused by the `tysiacha_autoPlaySpeed` direct read in `getDelay()`.


## 2026-07-12: Bugfix — Arcade Watch Mode (b-21)
**Shipped:** b-21
Fixed an issue where the Watch Mode settings drawer section was entirely hidden when `autoPlay` was false, making it impossible to enable Watch mode mid-game.
- Removed the `when` condition that hid the `registerWatchSection`.
- Swapped the drawer's "Take Over / Stop" button to "▶ Watch" if the user opens the drawer while auto-play is disabled.
* **Commit**: `caa73f7`
* **Root cause**: Sprint 3 consolidated the section but incorrectly assumed it only needed to be shown if already watching.

## July 12, 2026 — Watch Mode Manual Takeover Fix
- Modified all games (Tysiacha, Durak, Blob Zapper, Keypad Quest) to permanently abort Watch Mode (setting the autoPlay localStorage flag to false) when the user manually interacts.
- Fixed a race condition in Tysiacha where AI could continue to bid out-of-turn if a queued bid timer was not aborted.
