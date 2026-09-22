# PWA Versioning Plan

> **Archived July 12, 2026 — implemented.** version.json + bump-version script + settings footer + update banner all shipped; version display now lives in the drawer's ⚙️ App section (p1-19).

**Goal:** Gracefully prompt the user to refresh their iOS PWA when a new version of Kameko Studio is deployed. It needs to show a visible version number in the settings, look visually premium, and be easily testable, all without a build step or service worker.

## The Solution
Since Kameko Studio is a vanilla JS static site, we can use a polling approach tied to visibility events and manual checks, storing a visible version number in a static JSON file.

### 1. The Version File & Script
- Add a `version.json` file to the root of the project: `{"version": 1, "buildDate": "2026-07-08", "timestamp": 123456789}`.
- Create a `scripts/bump-version.js` script to parse this file, increment the version, update the date/timestamp, and save it.
- Update `.claude/commands/ship.md` to run `node scripts/bump-version.js` and stage `version.json` before committing. This ensures every `/ship` auto-increments the arcade version.

### 2. Settings UI & Testability (`shared/settings.js`)
- On initial page load, fetch `version.json` and store the data in memory.
- **Version Display:** Inject a small footer in the settings panel showing the current version (e.g. `v42 • 2026-07-08`) with a `Check for updates` refresh link.
- **Developer Testability:** Add a `Simulate Update` button to the Developer Tools section of the settings panel to instantly preview the Update Banner without needing a real code change.

### 3. The Update Checker
- Add event listeners for `visibilitychange` (when `!document.hidden`), `pageshow`, and the manual `Check for updates` click.
- When triggered, fetch `version.json?t=[Date.now()]` to bypass the cache.
- If the fetched version > the current loaded version, inject the **Update Prompt Banner**.
- **The Banner UI:** A visually polished, premium banner (glassmorphism/arcade vibes) fixed to the screen that says "Update Available (vX)".
- When the user taps "Update", we call `location.reload(true)` to force a refresh, downloading the new assets.

### Why this works well
- **User Trust:** Users can explicitly see what version they are on and manually check for updates.
- **Developer Confidence:** The "Simulate Update" button allows us to style and test the banner flow locally.
- **No Service Worker needed:** Avoids the complexity of manually caching all static assets in a Service Worker without a build tool like Workbox.
