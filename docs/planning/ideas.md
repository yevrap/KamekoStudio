> **Idea Inbox** (arcade-wide, not game-specific)
> These are raw ideas. The active roadmap is in the repo at `docs/roadmap.md`.

## Inbox

*(empty — the raw capture below was triaged 2026-07-24 into the Backlog below.)*

## Backlog

- [ ] **P0 · p0-16 — Obsidian Intranet: docs organization, interlinking & Studio Dashboard.** Prioritized 2026-09-22 as the **top-priority next item** to be executed immediately once the current iteration closes out (Yevster steer): *"no, add it as a priority, next thing thats going to be done after this current itteration is closed out"*.
  - **What ships:**
    1. **Master Dashboard / MOC in `docs/README.md`:** Upgrade `docs/README.md` into an Obsidian hub (Active games gallery grouped by tier, quick links to design docs & idea inboxes, open questionnaires, roadmap priority tiers, steering and Shadow Studio links).
    2. **YAML Frontmatter / Obsidian Properties:** Add clean frontmatter to key documents (game READMEs in `docs/games/<slug>/README.md`, open questionnaires) with `title`, `tier`, `status`, `tags`, and `play_url` so Obsidian's properties and graph views function cleanly.
    3. **Document Cross-Linking:** Standardize relative Markdown links (GitHub- and agent-safe) between roadmap rows, playtest log entries, questionnaires, and game specifications.
  - **Constraints:** Keep core paths unchanged (`docs/roadmap.md`, `docs/playtest-log.md`, `docs/questionnaires/`, `docs/games/<slug>/README.md`); use standard relative markdown links `[label](path.md)` (never Obsidian-only bare wikilinks); keep all tests passing.
  - *Done when:* `docs/README.md` acts as an Obsidian dashboard; all game READMEs have valid YAML frontmatter and tags; cross-links between roadmap, games, questionnaires, and playtest logs resolve cleanly on both GitHub and Obsidian; `npm test` remains green.
  - **Ready-to-paste prompt for the next planned session:**
    ```
    Ship p0-16 from docs/roadmap.md: Obsidian Intranet & documentation interlinking pass.
    1. Upgrade docs/README.md into a Studio Dashboard / Map of Content (MOC) with active games by tier, open questionnaires, roadmap priorities, and steering links.
    2. Add standard YAML frontmatter (title, status, tier, tags) to all game READMEs in docs/games/ and open questionnaires in docs/questionnaires/.
    3. Cross-link roadmap items, playtest log entries, and game specs with standard relative Markdown links.
    4. Verify relative links resolve cleanly, run npm test to ensure no test regressions, and document the changes.
    ```

- [ ] **P2 · MENU-1 — Replace the quick game-switcher with three top-bar two-click icons + a footer version number.** Triaged 2026-07-24 from the raw inbox note: *"in the menu side bar, i don't want the quick switcher. i want the back to gallery, light/dark mode, and app refresh to be in the top next to the word menu as icons but two click. one click to enable and bring up a dialogue like help text and then the second to perform the action. show the version number at the bottom."*
  - **Root-caused against the shared `shared/settings.js` (used by all 10 arcade games — one change ships everywhere):** `injectUI()` (~line 532) creates a single floating ☰ hamburger button (`#settings-hamburger-btn`) that opens the settings drawer; the drawer's own header just displays the word "Menu" as a heading once open — there's no icon row next to it today. Inside the open drawer, the **Arcade Cluster** (~line 591) currently shows: a 10-icon **quick game switcher** (`#settings-game-switcher`, one tap per game, jumps directly to it) and a `chromeRow` with a dark-mode toggle button + a "🏠 Gallery" link, side by side. Version display (`#settings-version-display`) exists but only inside the collapsed "⚙️ App" `<details>` section, not a visible footer.
  - **What ships:** remove the 10-icon quick switcher (`GAMES` array + `#settings-game-switcher` block) entirely from the Arcade Cluster. Replace the `chromeRow`'s gallery-link/dark-mode pair with **three icons in the top bar itself, next to the ☰ Menu button** (not inside the drawer): 🏠 back-to-gallery, ☀️/🌙 light/dark toggle, 🔄 app refresh — each **two-click**: first tap shows a small inline label/tooltip naming the action (reuse the same "select → confirm" pattern already shipped for Black Hole in One's star-map fast travel, MAP-2: first tap highlights + shows a prompt, second tap on the same icon (or a tap elsewhere) confirms/cancels); second tap on the same icon performs the action. Add a small, low-contrast version-number footer (reuse `loadedVersion`/`updateSettingsVersionDisplay()`'s existing data, just render it in a fixed footer instead of only inside the collapsed App details).
  - **Explicitly out of scope:** the collapsed "⚙️ App" section (dev tools, clear-data, check-for-updates) is unaffected — this only touches the always-visible chrome.
  - *Done when:* every game's top bar shows ☰ Menu plus the three new two-click icons (no quick-switcher row anywhere); tapping an icon once shows a confirm/help label without performing the action; tapping it again (or the confirmed control) performs it; a tap elsewhere cancels back to idle, matching MAP-2's precedent; a version number is visibly readable without opening the drawer; `node --test tests/` still green (settings.js is shared, so a regression here breaks every game).
  - **Ready-to-paste prompt for a fresh dev-ship session:**
    ```
    Ship MENU-1 from the Kameko Arcade Improvements.md (arcade-wide idea inbox): replace the quick game-switcher with three top-bar two-click icons + a footer version number, in shared/settings.js.

    1. Remove the 10-icon quick game switcher entirely — the GAMES array and #settings-game-switcher block in the Arcade Cluster (injectUI(), ~line 591 onward).
    2. Add three icons next to the existing ☰ hamburger button in the top bar (not inside the settings drawer): 🏠 back-to-gallery, light/dark toggle, 🔄 app refresh.
    3. Make each icon two-click: first tap shows an inline confirm/help label (what this icon does); second tap on the same icon performs the action; a tap elsewhere cancels back to idle. Reuse the same select-then-confirm interaction Black Hole in One's star-map fast travel (MAP-2) already shipped, rather than inventing a new pattern.
    4. Add a small, low-contrast version-number footer, always visible (not just inside the collapsed "⚙️ App" details) — reuse the existing loadedVersion/updateSettingsVersionDisplay() data.
    5. Leave the collapsed "⚙️ App" section (dev tools, clear-data, check-for-updates) untouched.

    This is shared/settings.js — every one of the 10 games uses it, so verify across at least two games (one Invest-tier, e.g. durak, and one recently-shipped, e.g. maze-warden) plus both light and dark theme. Run the full test suite, verify via the preview-pane dev server, commit, push, verify the Pages deploy, then close the loop in the docs: check off this item in Improvements.md with what actually shipped, add a Dev Log entry.
    ```

**Triaged 2026-07-18 (docs cleanup pass):** *"Durak, 1000, and Astrology game should have Russian. No other games for now."* Checked against the live code — **2 of 3 done, 1 real gap found:**
- [x] Tysiacha — full Russian translation shipped 2026-07-10 (`i18n.js`, toggle in ⚙️).
- [x] Astro Salon — full Russian translation shipped at promotion 2026-07-14 (`i18n.js`, EN/RU toggle mid-session).
- [x] **Durak Russian gap closed** → **p2-36**, shipped 2026-07-20. All three card-game siblings (Tysiacha, Astro Salon, Durak) now have full EN/RU. Plan archived: [Durak — Russian Localization Sprint](../archive/plans/durak-russian-localization-sprint-july-2026.md).

"Investigate kozel or other Russian games" — still open, untriaged. A candidate for a future jam pitch alongside p3-09 (durak score-attack), not yet worked up into a concept.

## Questions for Yev

- [x] **Move Blob Zapper to the Lab (July 15):** inbox "move blob zapper to lab" → repo **p1-41**, **shipped 2026-07-15 (`87e1a94`, v26)** alongside Astro Salon Sprint 2. Gallery card + quick-switcher removed, shelved card in the Lab; controls-rework p1-31 stays open (Lab-tier). See [Dev Log](../archive/dev-logs/arcade.md).
- [x] **New game directions (July 14):** your physics / TD-roguelike / Balatro-blend ideas are worked into nine concepts in [Kameko Studio — New Game Directions (July 2026)](new-game-directions.md) — **answered & picked up same day**: A1 flow glider is the next jam (p3-06), then C3 pachinko (p3-07), B1+ one-tower TD (p3-08), C1 durak score-attack (p3-09); questionnaire archived
- [x] **Auto-restart switch in Watch Mode (b-26):** ~~the drawer's Watch section shows an "Auto-restart match" switch in every game, but Keypad Quest and River Run don't actually implement auto-restart.~~ **Answered "remove it" (option B) → shipped 2026-07-13 (`082943a`, v18).** `hasAutoRestart:false` opt-out added to `registerWatchSection`; the switch is gone from both games, still present where it works. See [Dev Log](../archive/dev-logs/arcade.md).

## Triaged → new game directions (July 14, 2026)

- [x] Fun, fast physics game like River Run — cool-looking, fun, pausable → mechanics menu + concepts **A1–A3** in [Kameko Studio — New Game Directions (July 2026)](new-game-directions.md); pick in [Kameko Studio Questionnaire — New Game Directions](../archive/questionnaires/kameko-studio-new-game-directions.md)
- [x] Tower defense roguelike (Kingdom Rush, The Tower, Green TD, UnderDark, Castle Busters) → concepts **B1–B3**, same note
- [x] Liked: Rift Busters, Endless Wanderer, Hero Wars, mo.co → folded into Direction B as the "controllable hero" signal (B1+ / B2 options)
- [x] Balatro / Scritchy Scratchy mechanic blending → concepts **C1–C3**, same note (blend at the scoring layer, not genre mash — the Lab lesson)
- [x] Move "back to home" up so no scrolling needed → repo roadmap **p1-37** (small chrome fix, not gated on the questionnaire)

## Triaged → watch-mode bugfix pass (July 12, 2026, late night)

- [x] Keypad quest auto play doesn't work / take over doesn't work / can start watch but cannot stop → **fixed & live (b-28, `282b28f`, v17)**. Root causes: drawer wrote localStorage that the game never re-read, and the auto-typist's synthetic events triggered its own take-over abort. Details in [Dev Log](../archive/dev-logs/arcade.md).
- [x] River run watch mode has nothing in settings to stop, doesn't auto play → **fixed & live (b-28, `282b28f`, v17)**. The drawer sections were never registered (script load order) and ▶ Watch never set the live flag. Details in [Dev Log](../archive/dev-logs/arcade.md).
- [x] Tokens needed in lab games? → **fixed & live (b-28)**. The gates were already gone (Sprint 2) — only the "Play 1🪙" button labels survived and made the Lab look paywalled. Labels removed; a residue sweep is filed as **b-27**.
- [x] Ui end to end tests to test core use cases of games → **started + filed as p1-36**. `npm run e2e` now exists (10 browser tests around watch mode, clear-data, Lab free play); the per-game core-flow expansion is roadmap **p1-36**.

## Triaged → settings cleanup sprint (July 12, 2026, evening)

- [x] Do something with tokens — **decided July 12, 2026 (Q4=E of [Kameko Studio Questionnaire — Settings, Automation & Tokens](../archive/questionnaires/kameko-studio-settings-automation-and-tokens.md)): remove the token system entirely, arcade goes free** → **p1-33** (Sprint 2 of [Kameko Studio — Settings & Automation Cleanup Sprint (July 2026)](../archive/plans/kameko-studio-settings-and-automation-cleanup-sprint-july-2026.md)). p1-06 hint and p2-32 cosmetics rescoped to free versions.
- [x] Game settings separated from arcade-wide settings? — absorbed as Q6 of [Kameko Studio Questionnaire — Settings, Automation & Tokens](../archive/questionnaires/kameko-studio-settings-automation-and-tokens.md); audit + sprint plan in [Kameko Studio — Settings & Automation Cleanup Sprint (July 2026)](../archive/plans/kameko-studio-settings-and-automation-cleanup-sprint-july-2026.md)

## Triaged → repo roadmap (July 12, 2026)

- [x] move durak-like games into labs section → **p1-29** — confirmed by the taste questionnaire (all three durak-likes: "move to labs"; parked games live in the Lab per Q6). Waterfall's verdict was **delete** → **p1-30**; blob-zapper's control gripe → **p1-31**
- [x] in durak trump suit should not have card's value → **p1-24** (duplicate of the durak inbox item, merged there)
- [x] for durak and 1000 show the opponents cards and have variable speed in settings → **p2-27** (durak) + **p2-28** (tysiacha); your "yes this is great" note on hand-reveal in [Kameko Studio — Auto Play Visualizers](../archive/plans/kameko-studio-auto-play-visualizers.md) folded in
- [x] river run auto mode but cooler visualizer, skate around more not just go to the side → **p2-29**
- [x] Root gallery 404 at load → **b-17** (verified: root `index.html` has no favicon/manifest link, so the implicit `/favicon.ico` request 404s)
- [x] Token-cost consistency (Tysiacha match-end "New match" charges 1 🪙 but the setup-screen restart is free) → **answered same day (Q9=A, free everywhere)** → **p1-28**

*(moved here from the [Kameko Arcade](../games/README.md) hub note, July 9, 2026)*
