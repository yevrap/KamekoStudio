# Kameko Studio — Auto Play Visualizers

> **Archived July 12, 2026 — plan fully shipped** (p2-22…p2-26, July 11, 2026). Follow-ups from Yev's inline notes are on the roadmap: reveal hands + speed for durak (p2-27) and tysiacha (p2-28), cooler river-run bot (p2-29).

**Context:** Adding an entertaining, passive "Auto Play Visualizer" mode to select games, inspired by the Auto-Shoot/Auto-Avoid settings in River Run. The goal is to allow the player to just sit back, relax, and watch the game play itself in a satisfying way.

Below is an investigation and proposed plan for how this feature could be uniquely implemented in each of the requested games.

## 1. Durak (`games/durak/`)

**Current State:** 
Durak is a DOM-based card game with a robust existing AI (`games/durak/ai.js`) that plays against the human player. The UI supports hardware-accelerated FLIP animations for card movements.

**Auto Play Concept:** "Spectate AI Match"
Instead of the human playing, we replace the human seat with a second AI. 

**Implementation Plan:**
- Add an "Auto Play" toggle to the new game setup screen or the settings drawer.
- When enabled, the game loop automatically requests moves from the AI for the human player's seat.
- **Visuals:** We can optionally reveal both players' hands, allowing the user to see the strategy unfold. The turn delays (e.g., 500ms to 1s) should be tuned so the user can easily follow the flow of attacks and defenses. The FLIP animations of cards flying from hand to table to discard pile will make it feel like watching a fast-paced card hustle.
- ^ note: yes this is great

## 2. 1000 (Tysiacha) (`games/tysiacha/`)

**Current State:** 
A 3-player trick-taking game where the human plays against 2 AIs. It already features a robust game loop, auction phase, and AI logic (`games/tysiacha/ai.js`).

**Auto Play Concept:** "Simulated Tournament"
A fully automated match where 3 AIs battle it out.

**Implementation Plan:**
- Similar to Durak, add an "Auto Play" setting.
- When active, the human's seat is driven by `aiMove`.
- **Visuals:** The auction phase can be played out rapidly (showing the bids increasing in real-time). During the trick phase, we can either reveal all cards face up for the spectator, or keep them hidden and just show the cards being thrown into the center and the tricks being scooped. We can add a "Fast Forward" setting to speed up the AI thinking time so the score swings and logs update rapidly, turning it into a fast-paced numbers race.
- ^ note: yes i like the idea about the auto speed

## 3. Keypad Quest (`games/keypad-quest/`)

**Current State:** 
A Canvas-based typing/tower defense game where the user types words to shoot down incoming enemies. 

**Auto Play Concept:** "Virtual Typist"
An automated typist that visually types out the answers.

**Implementation Plan:**
- **Logic:** Add an `autoPlay` loop that polls the active enemies on screen. It selects the enemy closest to the center/base.
- **Visuals:** Instead of just instantly killing the enemy, the auto-player should simulate *typing*. We can show the letters appearing one by one in the input box with a realistic typing delay (e.g., 50-100ms per keystroke). Once the word is complete, it automatically submits.
- This creates an extremely satisfying "hacker/typing test" visualizer where the user watches a perfect typist clear waves of enemies with rhythmic laser shots.

## 4. Materials Run (`games/materials-run/`)

**Current State:** 
A DOM/CSS grid game where the player moves a pin to collect items, score points, or survive.

**Auto Play Concept:** "Pathfinder Bot"
An algorithmic bot that navigates the grid autonomously.

**Implementation Plan:**
- **Logic:** Implement a simple greedy pathfinding algorithm (or A* if obstacles are complex). In "Score Mode", the bot targets the highest value material currently on the board. In "Survival Mode", the bot constantly paths to the nearest safe tile to avoid danger.
- **Visuals:** The pin smoothly hops from tile to tile on its own. We can add a faint "target line" or highlight the tile the bot has chosen to move to next, so the viewer understands the bot's intent before it moves. It turns the game into a soothing, robotic vacuum-like cleaning visualization.

## 5. Blob Zapper (`games/blob-zapper/`)

**Current State:** 
A Canvas 2D game (Lava Plasma Flow) where the user taps/clicks to zap growing blobs or presses a button to push blobs towards the center.

**Auto Play Concept:** "Automated Defense Grid"
A hands-free laser defense system that manages the plasma flow.

**Implementation Plan:**
- **Logic:** Add an `autoZap` routine to the `animate` loop. It periodically scans the `state.blobs` array for blobs that are getting too large or too close to merging.
- **Visuals:** It injects simulated `touchPoints` at those coordinates. Visually, a crosshair or targeting reticle could quickly snap to the target blob right before the zap occurs. The game essentially becomes a mesmerizing screensaver of plasma blobs growing and being procedurally popped by an automated laser grid.

## General Features (Apply to all)
- **Takeover & Resume:** The auto mode should not lock the player out. A user can step in, make a manual move, and then re-enable auto-play (or auto-play pauses/resumes automatically) so they can seamlessly interact.
- **Auto-Restart Setting:** A toggle to determine whether the game should automatically start a new round/match when one finishes, creating an endless loop of gameplay.

---
**Implementation Plan (Game by Game in Small, Testable Increments):**

These have been added to the Kameko Studio backlog to be worked on sequentially. The phased approach allows each agent sprint to ship a testable increment.

### Phase 1: Durak (`games/durak/`)
- **Step 1:** Add the "Auto Play" and "Auto Restart" toggles to the game setup/settings. Plumb the state into the game loop.
- **Step 2:** Modify the main game loop to request moves from the AI for the human's seat when Auto Play is on. Ensure human inputs (taking over) pause or override the auto-play gracefully.
- **Step 3:** Implement the Auto-Restart logic at the game-over screen. Test end-to-end.

### Phase 2: 1000 (Tysiacha) (`games/tysiacha/`)
- **Step 1:** Add settings toggles (Auto Play, Auto Restart, Fast Forward).
- **Step 2:** Wire the human seat to `aiMove` during the auction and trick phases.
- **Step 3:** Implement Fast Forward (reduce AI thinking delays) and Auto-Restart. Validate the spectator experience.

### Phase 3: Keypad Quest (`games/keypad-quest/`)
- **Step 1:** Add the Auto Play/Restart settings.
- **Step 2:** Create the `autoPlay` targeting loop (find enemy closest to base).
- **Step 3:** Implement the visual "Virtual Typist" delay and auto-submit mechanics.

### Phase 4: Materials Run (`games/materials-run/`)
- **Step 1:** Add settings toggles.
- **Step 2:** Implement the greedy pathfinding bot for both Score and Survival modes.
- **Step 3:** Add the visual "target line" or tile highlight and ensure the pin moves smoothly.

### Phase 5: Blob Zapper (`games/blob-zapper/`)
- **Step 1:** Add settings toggles.
- **Step 2:** Create the `autoZap` routine that identifies danger blobs and generates simulated `touchPoints`.
- **Step 3:** Add the visual targeting reticle before zapping. Test the endless screensaver feel.
