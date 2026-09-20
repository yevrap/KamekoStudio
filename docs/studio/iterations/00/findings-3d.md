# Findings — how the 3D landing page works, and what a studio portal costs

Written during iteration 00 so that the portal change can be proposed as a reviewed diff
rather than discovered mid-build. Nothing in this iteration edited any of the files below.

## The short version

**The landing page is not in `3d.html`.** That file is 32 lines of scaffolding: a viewport
meta tag, a stylesheet link, a Three.js CDN script, five empty `div`s and two script tags.
Every part a portal would touch lives in `shared/3d/`.

Adding a studio portal is therefore **not** a one-line edit to `3d.html`. It is a two-file
change in `shared/3d/`, both of which are outside the path guard, plus a decision about a
capacity limit that already drops two shipped games.

## What each file does

| File | Lines | Responsibility |
|---|---|---|
| `3d.html` | 32 | Markup shell: scene container, joystick elements, prompt, controls legend, ACT button. Loads `shared/3d/main.js` as a module and `shared/settings.js` after it. |
| `shared/3d/main.js` | 68 | Boot: builds scene, camera, renderer, lights and the player group; calls `createEnvironment()` and `setupControls()`; owns the animation loop and the resize handler. |
| `shared/3d/constants.js` | 27 | Tunables — player height/speed/radius, interaction distance, joystick and look settings — and **`ARCADE_GAMES`**, the list of `{ name, url, color }` the portals are generated from. |
| `shared/3d/state.js` | 37 | Three plain objects: input `state`, cached `domElements`, and `engineState` (scene, camera, renderer, player, `walls`, `portals`, `trophies`, clock). |
| `shared/3d/gameplay.js` | 374 | `createEnvironment()` builds the room and one portal group per entry in `ARCADE_GAMES`; `spawnTrophies()` reads high-score keys from `localStorage` and puts trophies on a shelf; `updatePlayer()` runs movement, wall collision, portal spin and the proximity prompt. |
| `shared/3d/controls.js` | 171 | Keyboard, mouse-look and touch joystick. Navigation happens here: pressing **E**, or tapping **ACT**, sets `window.location.href` to the active portal's `url`. |
| `shared/3d/style.css` | 108 | Full-bleed canvas, the joystick and prompt UI, `100dvh` with a `100vh` fallback. |

## How a portal comes to exist

1. `createEnvironment()` builds three position tables — three positions on the left wall,
   three on the right, three on the back — and concatenates them into `positions`,
   **nine entries**, with a matching `rotations` array.
2. It then iterates `ARCADE_GAMES` and, for index *i*, builds a torus ring, a wireframe
   octahedron core and a point light at `positions[i]`, tagging the group with
   `userData.game`.
3. `updatePlayer()` measures the 2D distance from the player to each portal group, and
   within `INTERACTION_DISTANCE` (3.0) shows `Press E to enter <name>`.
4. `controls.js` navigates to `state.currentActivePortal.url`.

## The capacity problem

`ARCADE_GAMES` currently holds **eleven** games. `positions` holds **nine**. The loop opens
with:

```js
ARCADE_GAMES.forEach((game, index) => {
    if (!positions[index]) return;
```

So entries ten and eleven — **Black Hole in One** and **Maze Warden**, both promoted,
production games — are silently dropped. They have no portal on the 3D landing page and
nothing reports it. A studio portal appended to that list would be the twelfth entry and
would simply not appear.

Recorded as TD-002 in [`../../tech-debt.md`](../../tech-debt.md). It is a production defect
that predates the studio, which is why it is proposed here rather than fixed here.

## The proposed change

Two edits, both outside the path guard, both requiring approval. They are shown here in
full so the diff can be reviewed before it is written.

### 1. A front-wall position row, so the room holds twelve portals

The front wall (`z = +roomDepth/2`) is the only unused wall. It already carries the trophy
shelf at `z = 12 - 0.75`, `y = 2.0`, centred, 10 units wide — so portals there must sit
above it or outside its span. Above is cleaner: the shelf top is at `y ≈ 2.1` and the room
is 6 units tall.

```diff
--- a/shared/3d/gameplay.js
+++ b/shared/3d/gameplay.js
@@ createEnvironment()
     const backPositions = [
         new THREE.Vector3(-roomWidth/4, 2.5, -roomDepth/2 + 1.2),
         new THREE.Vector3(0, 2.5, -roomDepth/2 + 1.2),
         new THREE.Vector3(roomWidth/4, 2.5, -roomDepth/2 + 1.2)
     ];
-    const positions = [...leftPositions, ...rightPositions, ...backPositions];
+    // Front wall, above the trophy shelf. Three more slots, so the room holds
+    // twelve portals rather than nine — ARCADE_GAMES has outgrown the table
+    // twice now, most recently when Maze Warden was promoted.
+    const frontPositions = [
+        new THREE.Vector3(-roomWidth/4, 4.0, roomDepth/2 - 1.2),
+        new THREE.Vector3(roomWidth/4, 4.0, roomDepth/2 - 1.2),
+        new THREE.Vector3(0, 4.0, roomDepth/2 - 1.2)
+    ];
+    const positions = [...leftPositions, ...rightPositions, ...backPositions, ...frontPositions];
     const rotations = [
         ...leftPositions.map(() => Math.PI/2),
         ...rightPositions.map(() => -Math.PI/2),
-        ...backPositions.map(() => 0)
+        ...backPositions.map(() => 0),
+        ...frontPositions.map(() => Math.PI)
     ];
```

This alone restores the two missing production games, in the order they appear in the list.

### 2. One entry in the game list

```diff
--- a/shared/3d/constants.js
+++ b/shared/3d/constants.js
@@ ARCADE_GAMES
     { name: "Maze Warden", url: "games/maze-warden/", color: 0x2fe6ff },
+    { name: "Shadow Studio", url: "studio/", color: 0xf0a84c }
 ];
```

Placed last, it lands in the twelfth slot — the centre of the front wall, directly behind
the player's spawn point at `z = 5`, facing them when they turn around. That is a good
place for an experimental door: found deliberately, not walked into.

The colour is the studio's warm accent as it appears on a dark ground — `--accent-warm`
is `#f0a84c` under `body.dark-mode` and `#a25c14` in light mode, and the 3D landing page is
always dark — which is the one hue not already used by a game portal — the nearest are Black Hole in One's `0xff9a5c` and
Tysiacha's `0xffd54f`. If the realm's identity changes colour, this changes with it.

### What this does not need

- **No change to `3d.html`.** It contains none of this.
- **No change to `controls.js`.** Navigation is generic: any entry with a `url` works, and
  a relative `studio/` resolves correctly from the root page exactly as `games/...` does.
- **No trailing-slash risk.** `studio/` already has the trailing slash the repository's
  convention requires.

## Costs and risks

| | |
|---|---|
| **Path guard** | Both files are production. The change needs a recorded exception, and by the rules it is made last, in its own reviewed commit. |
| **Blast radius** | `createEnvironment()` runs on every visit to the landing page. A mistake in the position table is visible immediately on a production page. |
| **Test coverage** | None of `shared/3d/` is unit tested; `npm run smoke` only asserts that `/3d.html` loads without throwing. A portal that renders in the wrong place would pass every existing check. Manual verification, or an e2e assertion on portal count, is the only real evidence. |
| **Alternative** | Leave the realm URL-only until it has something to play. Costs nothing, and TD-001 keeps the debt visible. |

## Recommendation

Approve edit 1 on its own merits — it is a production bug fix that restores two missing
games, and it is worth doing whether or not the studio ever gets a portal. Hold edit 2
until the realm has a gallery worth entering; an empty room behind a door is worse than no
door.
