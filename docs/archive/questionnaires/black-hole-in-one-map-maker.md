# Black Hole in One — Map Maker Questionnaire

> **Status: ANSWERED July 15, 2026 → consumed into the build plan in Improvements.** This note stays as the concept/decision record.
> Concept: A built-in level editor to create, save, play, and share custom maps. It includes local saving and an export/backup mechanism (URL or file). Also includes a camera tweak for the orbit mechanic ("when in orbit, do not move camera").

## Q1. Sharing & Backup Mechanism

How should players share maps and back them up?

- [x] **URL Encoding** *(recommended)* — Map data (planet positions, sizes, types) is serialized and compressed into a long URL hash (e.g., `yevrap.github.io/KamekoStudio/#map=xyz...`). Pros: completely serverless, easy to copy/paste in chat, zero friction to play. Cons: URLs can get long if the map is massive.
- [ ] **File Import/Export** — Export map as a `.json` file that downloads to the device. Players share the file, and load it via a file picker. Pros: infinite map size, physical backup. Cons: higher friction to share/play on mobile.
- [ ] **Both** — Support both URL links for quick sharing and JSON files for permanent backup.
- [ ] Write-in:

## Q2. Editor Interface (UX)

How much control do you want when building a map?

- [x] **Drag & Drop (WYSIWYG)** *(recommended)* — A "God mode" where you drag planets from a palette, place them on the grid, pinch/scroll to resize them, and drag the tee and cup. Pure visual placement.
- [ ] **Parametric / Grid-based** — Tap a grid square, select an object, type in its mass/radius. More precise but less fluid.
- [ ] Write-in:

## Q3. Local Saves (Saved Maps)

You want to "save and play and replay ones you saved."

- [x] **Save Slots** *(recommended)* — The game keeps a "My Maps" menu (saved in `localStorage`). You can name maps, load them to edit, or play them.
- [ ] **Single Autosave** — Just one active work-in-progress map that auto-saves locally. You have to export it to back it up before making a new one.
- [ ] Write-in:

## Q4. The Orbit Camera Tweak

"when in orbit, do not move camera" — In the current Open World/Explore mode (or just general gameplay), the camera follows the comet. You want the camera to lock/stop moving while the comet is caught in an orbit.

- [x] **Apply globally** *(recommended)* — Lock the camera whenever the comet is in a stable orbit in *any* mode (Explore or custom maps). Makes orbits less dizzying.
- [ ] **Apply only in Map Maker / specific modes** — Keep the smooth-follow in Explore, but lock it in custom holes.
- [ ] Write-in:

## Q5. AI Agent Execution Phases

You requested a plan for AI agents to build this in phases. Here is the proposed breakdown. Does this staging look right to you?

- **Phase 1: The Editor Core** — Build the UI to place the tee, cup, and planets. Connect it to the physics engine so you can hit "Test Play" from the editor. No saving yet.
- **Phase 2: Local Saves ("Saved Maps")** — Add the `localStorage` persistence layer. A "My Maps" drawer to save, load, rename, and play local creations.
- **Phase 3: Export & Share** — Implement the chosen backup/sharing method (URL or JSON). Add the UI to generate the share link/file and the loader to ingest it on start.
- **Phase 4: Orbit Camera Tweak** — Implement the camera lock logic during stable orbits and verify it feels good. (This could also be done as Phase 1 since it's a small tweak).

- [ ] **Yes, this phase plan looks good.**
- [ ] I want to change the phases (write-in):

---

*When answered, these decisions will feed directly into the Dev Log / Improvements inbox as a fully specified, prioritized sprint for agents to execute.*
