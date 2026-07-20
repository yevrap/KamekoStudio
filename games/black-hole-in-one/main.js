// Black Hole in One — boot, input, main loop, shared-infrastructure wiring.
'use strict';

import { DT, ROUND_HOLES, TAP_MAX_LEN, LS_KEYS, isStranded } from './constants.js';
import { S, world, comet, mergeInventory, mergeGlossarySeen } from './state.js';
import * as game from './gameplay.js';
import * as explore from './explore.js';
import * as editor from './editor.js';
import * as ui from './ui.js';
import { sfx, audio, setMuted } from './sfx.js';

const canvas = document.getElementById('game');
const restartBtn = document.getElementById('restartBtn');
const newMapBtn = document.getElementById('newMapBtn');

const LS = {
    lastPlayed: 'lastPlayed_blackHoleInOne',
    bestRound: 'blackHoleInOne_bestRound',
    mode: 'blackHoleInOne_mode',
    muted: LS_KEYS.muted,
    freezeAim: LS_KEYS.freezeAim,
    stardust: 'blackHoleInOne_stardust',
    upgrades: 'blackHoleInOne_upgrades',
    inventory: LS_KEYS.inventory,
    exploreHome: 'blackHoleInOne_exploreHome',
    discoveredChunks: 'blackHoleInOne_discoveredChunks',
    glossarySeen: LS_KEYS.glossarySeen,
};

function bestRound() {
    const v = localStorage.getItem(LS.bestRound);
    return v === null ? null : parseInt(v, 10);
}

/* ============================== HOOKS ============================== */

game.setHooks({
    toast: ui.toast,
    chip: ui.chip,
    bar: ui.updateBar,
    burst: ui.burst,
    holeStart() {
        ui.clearParticles();
        ui.camera.x = comet.x;
        ui.camera.y = comet.y;
    },
    sfx,
    roundEnd(result) {
        const prev = bestRound();
        const isNew = (prev === null || result.total < prev);
        if (isNew) localStorage.setItem(LS.bestRound, String(result.total));
        ui.showScorecard(result, prev, isNew);
        sfx.score(result.total <= 0 ? 5 : 2);
    },
    roundOver(level) {
        ui.showRoundOverSummary(level);
    },
    editorReturn() {
        editor.stopTest();
    },
    stardust(total) {
        localStorage.setItem(LS.stardust, String(total));
    },
    glossary() {
        localStorage.setItem(LS.glossarySeen, JSON.stringify(S.glossarySeen));
    },
});

explore.setHooks({
    toast: ui.toast,
    bar: ui.updateBar,
    burst: ui.burst,
    sfx,
    stardust(total) {
        localStorage.setItem(LS.stardust, String(total));
    },
    upgrades(u) {
        localStorage.setItem(LS.upgrades, JSON.stringify(u));
    },
    exploreHome(h) {
        localStorage.setItem(LS.exploreHome, JSON.stringify(h));
    },
    discovery(chunks) {
        localStorage.setItem(LS.discoveredChunks, JSON.stringify(chunks));
    },
    glossary() {
        localStorage.setItem(LS.glossarySeen, JSON.stringify(S.glossarySeen));
    },
});

editor.setHooks({
    toast: ui.toast,
    bar: ui.updateBar,
    sfx,
});

/* ============================== INPUT ============================== */

let drag = null;   // {sx, sy, cx, cy, id} in world coords

canvas.addEventListener('pointerdown', e => {
    audio();
    if (S.phase === 'menu') return;  // the ☰ menu overlay owns this tap
    if (S.phase === 'result') { game.advance(); return; }

    // INV-3b: the Thruster's floating stick takes over touch/drag entirely in
    // Explore while the item is on (T6) — the old drag-to-flick path below never runs.
    if (S.mode === 'explore' && S.inventory.thruster?.enabled) {
        const [vx, vy] = ui.toView(e);
        explore.stickDown(vx, vy, e.pointerId);
        canvas.setPointerCapture(e.pointerId);
        return;
    }

    const [wx, wy] = ui.toWorld(e);
    if (S.mode === 'editor' && S.phase === 'edit') {
        if (editor.pointerDown(wx, wy, e.pointerId)) {
            canvas.setPointerCapture(e.pointerId);
        }
        return;
    }

    // aim from rest, a live orbit (BH-4), or mid-flight in Explore (OW-0).
    // Starting a drag enters 'aiming'; comet.vx/vy keep the current velocity
    // for the force-push impulse. Mid-flight aiming keeps physics stepping.
    const canAim = S.phase === 'rest' || S.phase === 'orbit'
        || (S.phase === 'flight' && S.mode === 'explore');
    if (!canAim || drag) return;
    S.prevPhase = S.phase;   // remember what we came from (OW-0)
    drag = { sx: wx, sy: wy, cx: wx, cy: wy, id: e.pointerId };
    S.phase = 'aiming';
    canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
    if (S.mode === 'explore' && S.inventory.thruster?.enabled) {
        const [vx, vy] = ui.toView(e);
        explore.stickMove(vx, vy, e.pointerId);
        return;
    }

    const [wx, wy] = ui.toWorld(e);
    if (S.mode === 'editor' && S.phase === 'edit') {
        editor.pointerMove(wx, wy, e.pointerId);
        return;
    }

    if (!drag || e.pointerId !== drag.id) return;
    drag.cx = wx; drag.cy = wy;
});
canvas.addEventListener('pointerup', e => {
    if (S.mode === 'explore' && S.inventory.thruster?.enabled) {
        if (explore.stick && explore.stick.id === e.pointerId) {
            const dx = explore.stick.cx - explore.stick.ox;
            const dy = explore.stick.cy - explore.stick.oy;
            if (Math.hypot(dx, dy) <= TAP_MAX_LEN) {
                const [wx, wy] = ui.toWorld(e);
                explore.handleTap(wx, wy);
            }
        }
        explore.stickUp(e.pointerId);
        return;
    }

    const [wx, wy] = ui.toWorld(e);
    if (S.mode === 'editor' && S.phase === 'edit') {
        editor.pointerUp(wx, wy, e.pointerId, e.clientX, e.clientY);
        return;
    }

    if (!drag || e.pointerId !== drag.id) return;
    const dx = drag.sx - drag.cx, dy = drag.sy - drag.cy;
    const len = Math.hypot(dx, dy);
    drag = null;

    if (S.mode === 'explore' && len <= TAP_MAX_LEN) {
        if (S.phase === 'aiming') S.phase = world.orbit ? 'orbit' : (S.prevPhase === 'flight' ? 'flight' : 'rest');
        explore.handleTap(wx, wy);
    } else if (len > 0) {
        if (S.mode === 'explore') explore.launch(dx, dy, len);
        else game.launch(dx, dy, len); // Editor test play reuses game.launch
    } else {
        S.phase = world.orbit ? 'orbit' : (S.prevPhase === 'flight' ? 'flight' : 'rest');
    }
});
canvas.addEventListener('pointercancel', () => {
    explore.stickCancel();
    if (drag) { drag = null; S.phase = world.orbit ? 'orbit' : (S.prevPhase === 'flight' ? 'flight' : 'rest'); }
    if (S.mode === 'editor') editor.cancelDrag(); // force-release; -1 id can't match a real drag
});

/* ============================== OVERLAY BUTTONS ============================== */

function startRun(mode, editorSize) {
    audio();
    localStorage.setItem(LS.mode, mode);
    ui.hideHowto();
    ui.hideScorecard();
    ui.hideRoundOverSummary();
    document.getElementById('bar').classList.add('hidden');
    document.getElementById('exploreBar').classList.add('hidden');
    document.getElementById('editorBar').classList.add('hidden');
    document.getElementById('customBar').classList.add('hidden');
    document.getElementById('mapBtn').classList.add('hidden');
    // GEN-1: reroll has nothing to reroll while authoring a map in the editor.
    newMapBtn.classList.toggle('hidden', mode === 'editor');
    if (mode === 'explore') {
        document.getElementById('exploreBar').classList.remove('hidden');
        document.getElementById('mapBtn').classList.remove('hidden');
        explore.startRun();
    } else if (mode === 'editor') {
        document.getElementById('editorBar').classList.remove('hidden');
        editor.startEditor(editorSize);
    } else if (mode === 'custom') {
        document.getElementById('customBar').classList.remove('hidden');
        document.getElementById('bar').classList.remove('hidden');
        if (world.activeMapData) {
            // FUEL-4: reload the same custom/shared map fresh rather than
            // falling through to golf's genHole() below.
            game.startCustomMap(world.activeMapData);
        } else {
            // No map retained in memory (e.g. a fresh page load resuming a
            // stale 'custom' last-played mode) — nothing to reload, so fall
            // back to Endless instead of crashing on a missing map.
            localStorage.setItem(LS.mode, 'endless');
            game.startRun('endless');
        }
    } else {
        document.getElementById('bar').classList.remove('hidden');
        game.startRun(mode);
    }
}

document.getElementById('modeEndless').addEventListener('click', () => startRun('endless'));
document.getElementById('modeExplore').addEventListener('click', () => startRun('explore'));

// MM-6: "🔨 Map Maker" opens a size chooser rather than starting straight into the
// editor, since the canvas tier has to be picked before a single body is placed.
document.getElementById('modeEditor').addEventListener('click', () => {
    audio();
    document.getElementById('modeBtns').classList.add('hidden');
    document.getElementById('mapSizeBtns').classList.remove('hidden');
});
function pickMapSize(size) {
    document.getElementById('mapSizeBtns').classList.add('hidden');
    document.getElementById('modeBtns').classList.remove('hidden');
    startRun('editor', size);
}
document.getElementById('mapSizeSmall').addEventListener('click', () => pickMapSize('small'));
document.getElementById('mapSizeLarge').addEventListener('click', () => pickMapSize('large'));
document.getElementById('mapSizeBack').addEventListener('click', () => {
    audio();
    document.getElementById('mapSizeBtns').classList.add('hidden');
    document.getElementById('modeBtns').classList.remove('hidden');
});

document.getElementById('modeSharedPlay').addEventListener('click', () => {
    audio();
    document.getElementById('sharedMapBtns').classList.add('hidden');
    document.getElementById('modeBtns').classList.remove('hidden');
    if (window.pendingSharedMap) {
        game.startCustomMap(window.pendingSharedMap);
        window.pendingSharedMap = null;
    }
});

// New note (July 2026): "My Maps" as a top-level menu option, not just an
// in-editor drawer — #howto stays open underneath (its own full-screen overlay
// already gets fully covered by myMapsDrawer's own opaque backdrop) so tapping
// Close returns to the main menu with no extra state to restore. ▶ Play already
// hides #howto itself (startCustomMap), and ✎ Edit now does the same
// (editor.js's loadMap), so both leave the menu correctly once acted on.
document.getElementById('modeMyMaps').addEventListener('click', () => {
    audio();
    editor.toggleMapsDrawer();
});

document.getElementById('modeSharedMenu').addEventListener('click', () => {
    audio();
    document.getElementById('sharedMapBtns').classList.add('hidden');
    document.getElementById('modeBtns').classList.remove('hidden');
    window.pendingSharedMap = null;
});

document.getElementById('ed-test').addEventListener('click', () => editor.toggleTestPlay());
document.getElementById('ed-add-planet').addEventListener('click', () => editor.addPlanet());
document.getElementById('ed-add-pulsar').addEventListener('click', () => editor.addPulsar());
document.getElementById('ed-add-trap').addEventListener('click', () => editor.addTrap());
document.getElementById('ed-add-mine').addEventListener('click', () => editor.addMine());
document.getElementById('ed-add-fuel').addEventListener('click', () => editor.addFuelPickup());
document.getElementById('ed-add-stardust').addEventListener('click', () => editor.addStardustPickup());
document.getElementById('ed-maps').addEventListener('click', () => editor.toggleMapsDrawer());

// MM-15: selected-planet property panel (size stepper + refuel toggle).
document.getElementById('ed-size-dec').addEventListener('click', () => editor.shrinkSelectedPlanet());
document.getElementById('ed-size-inc').addEventListener('click', () => editor.growSelectedPlanet());
document.getElementById('ed-refuel-toggle').addEventListener('click', () => editor.toggleSelectedRefuel());
document.getElementById('ed-deselect').addEventListener('click', () => editor.deselectBody());

// MM-16: editor overview — coarse drag-placement on a large map's full canvas.
// Pointer events convert canvas-relative px straight to world coords (ui.
// overviewEventToWorld) and feed editor.js's existing pointerDown/Move/Up
// unchanged — same drag/delete/out-of-bounds logic as the 1:1 editor view, just
// fed different screen coordinates, so overview- and 1:1-placed bodies are
// identical on the wire.
const editorOverviewCanvas = document.getElementById('editorOverviewCanvas');
document.getElementById('ed-overview').addEventListener('click', () => ui.showEditorOverview());
document.getElementById('eo-close').addEventListener('click', () => ui.hideEditorOverview());
document.getElementById('eo-add-planet').addEventListener('click', () => { editor.addPlanet(); ui.renderEditorOverview(); });
document.getElementById('eo-add-pulsar').addEventListener('click', () => { editor.addPulsar(); ui.renderEditorOverview(); });
document.getElementById('eo-add-trap').addEventListener('click', () => { editor.addTrap(); ui.renderEditorOverview(); });
document.getElementById('eo-add-mine').addEventListener('click', () => { editor.addMine(); ui.renderEditorOverview(); });
document.getElementById('eo-add-fuel').addEventListener('click', () => { editor.addFuelPickup(); ui.renderEditorOverview(); });
document.getElementById('eo-add-stardust').addEventListener('click', () => { editor.addStardustPickup(); ui.renderEditorOverview(); });
editorOverviewCanvas.addEventListener('pointerdown', e => {
    const [wx, wy] = ui.overviewEventToWorld(e);
    if (editor.pointerDown(wx, wy, e.pointerId)) editorOverviewCanvas.setPointerCapture(e.pointerId);
});
editorOverviewCanvas.addEventListener('pointermove', e => {
    const [wx, wy] = ui.overviewEventToWorld(e);
    editor.pointerMove(wx, wy, e.pointerId);
    ui.renderEditorOverview();
});
editorOverviewCanvas.addEventListener('pointerup', e => {
    const [wx, wy] = ui.overviewEventToWorld(e);
    editor.pointerUp(wx, wy, e.pointerId, e.clientX, e.clientY);
    ui.renderEditorOverview();
});
editorOverviewCanvas.addEventListener('pointercancel', () => {
    editor.cancelDrag();
    ui.renderEditorOverview();
});
document.getElementById('mm-saveNew').addEventListener('click', () => editor.saveCurrentMap());
document.getElementById('mm-shareNew').addEventListener('click', () => editor.shareCurrentMap());
document.getElementById('mm-importUrl').addEventListener('click', () => editor.importFromUrl());
document.getElementById('mm-close').addEventListener('click', () => editor.toggleMapsDrawer());
document.getElementById('cb-save').addEventListener('click', () => editor.saveCustomMap());
document.getElementById('cb-menu').addEventListener('click', () => {
    ui.showHowto();
    if (drag) drag = null;
    if (S.phase === 'aiming') S.phase = 'rest';
});
document.getElementById('howto').addEventListener('pointerdown', e => {
    if (e.target.closest('button, input, label')) return;
    audio();
    // tap outside the controls: resume if a run is live, else start last-used mode.
    // The auto-start convenience only applies from the Play tab (HUD-1) — a blank-
    // space tap while browsing Settings/Inventory shouldn't launch a run.
    if (S.phase === 'menu') {
        if (!ui.isHowtoPlayTab() || window.pendingSharedMap) return; // force them to click a button
        startRun(localStorage.getItem(LS.mode) || 'endless');
    } else {
        ui.hideHowto();
    }
});
document.getElementById('howtoTabs').addEventListener('click', e => {
    const btn = e.target.closest('.howto-tab');
    if (!btn || btn.classList.contains('hidden')) return;
    audio();
    ui.showHowtoTab(btn.dataset.tab);
});
document.getElementById('howto-close').addEventListener('click', () => ui.hideHowto());

document.getElementById('sc-endless').addEventListener('click', () => startRun('endless'));

// FUEL-9/GOLF-7: named so the always-on ↺/🔄 buttons and the non-blocking
// round-over panel's Restart/New Map buttons share one code path each — the
// stranded state reuses these exact recovery actions rather than inventing its
// own, per Yev's "one reroll control, less code paths to get confused" answer.
function doRestart() {
    startRun(S.mode);
    ui.toast('↺ Fresh start');
}
// GEN-1: 🔄 New Map — reroll the current level with a fresh seed, keeping
// hole count/fuel/score (unlike Restart, which resets the whole run). Custom
// Map has no procedural generator to reroll, so it falls back to a fresh
// Endless round — same fallback FUEL-4 established for a missing map.
function doNewMap() {
    audio();
    ui.hideRoundOverSummary();
    if (S.mode === 'explore') {
        explore.rerollWorld();
        ui.toast('🔄 New region');
    } else if (S.mode === 'custom') {
        startRun('endless');
        ui.toast('🔄 New map — Endless');
    } else {
        game.rerollHole();
        ui.toast('🔄 New hole');
    }
}
restartBtn.addEventListener('click', doRestart);
newMapBtn.addEventListener('click', doNewMap);
document.getElementById('ro-restart').addEventListener('click', doRestart);
document.getElementById('ro-newmap').addEventListener('click', doNewMap);
document.getElementById('ro-dismiss').addEventListener('click', () => ui.hideRoundOverSummary());
document.getElementById('helpBtn').addEventListener('click', () => {
    ui.showHowto();
    if (drag) drag = null;
    if (S.phase === 'aiming') S.phase = 'rest';
});
document.getElementById('settingsBtn').addEventListener('click', () => {
    // HUD-2: straight to Settings, no detour through Play.
    ui.showHowto();
    ui.showHowtoTab('settings');
    if (drag) drag = null;
    if (S.phase === 'aiming') S.phase = 'rest';
});
document.getElementById('mapBtn').addEventListener('click', () => {
    ui.toggleStarMap();
    if (drag) drag = null;
    if (S.phase === 'aiming') S.phase = 'rest';
});
document.getElementById('sm-close').addEventListener('click', () => ui.hideStarMap());
document.getElementById('starMapCanvas').addEventListener('pointerdown', e => {
    ui.handleStarMapTap(e.offsetX, e.offsetY);
});
document.getElementById('sm-travel-go').addEventListener('click', () => ui.confirmStarMapTravel());
document.getElementById('ts-launch').addEventListener('click', () => {
    explore.launchFromTown();
    ui.updateTownShop();
});
document.getElementById('ts-close').addEventListener('click', () => ui.closeTownShop());

/* ============================== KEYBOARD (Thruster, INV-3a) ============================== */

window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.code.startsWith('Arrow')) e.preventDefault();  // don't let the page scroll under the canvas
    explore.keyDown(e.code);
});
window.addEventListener('keyup', e => { explore.keyUp(e.code); });

/* ============================== PAUSE ============================== */

document.addEventListener('visibilitychange', () => { S.paused = document.hidden; });
window.addEventListener('blur', () => { S.paused = true; explore.clearKeys(); });
window.addEventListener('focus', () => { S.paused = false; });
window.addEventListener('settingsOpened', () => { S.paused = true; });
window.addEventListener('settingsClosed', () => { S.paused = false; });

/* ============================== MAIN LOOP ============================== */

let lastT = 0, acc = 0;
let wasStranded = false;
function frame(now) {
    requestAnimationFrame(frame);
    const dtRaw = Math.min((now - lastT) / 1000 || 0, 0.05);
    lastT = now;
    if (S.paused) { acc = 0; return; }

    S.time += dtRaw;
    acc += dtRaw;
    while (acc >= DT) {
        acc -= DT;
        if (S.mode === 'explore') {
            // OW-0: mid-flight aiming can be frozen (so the player can aim accurately)
            // or continuous (so the comet keeps moving while planning the push).
            // INV-3a: also step while resting under active thrust, so lifting off
            // a planet (or Town) under power actually moves the comet.
            if (S.phase === 'flight' || (!S.freezeAim && S.phase === 'aiming' && S.prevPhase === 'flight') || (S.phase === 'rest' && explore.hasThrust())) explore.step(DT);
            else if (S.phase === 'orbit') explore.stepOrbit(DT);
            else if (S.phase === 'warp') explore.stepWarp(DT);
            else if (S.phase === 'descend') explore.stepDescent(DT);
            else if (S.phase === 'ascend') explore.stepAscend(DT);
        } else {
            if (S.phase === 'flight') game.stepFlight(DT);
            else if (S.phase === 'orbit') game.stepOrbit(DT);
            else if (S.phase === 'sink') game.stepSink(DT);
            
            if (S.mode === 'survival' && (S.phase === 'rest' || S.phase === 'aiming' || S.phase === 'flight' || S.phase === 'orbit')) {
                game.stepAsteroids(DT);
            }
        }
    }

    // FUEL-1/FUEL-9/GOLF-7: no auto-tow anywhere, in any mode — an empty tank just
    // leaves the comet stranded, restart button pulsing, no mode ever force-blocking
    // the screen. Checked every frame (not just on step()) since step() doesn't run
    // in every phase (e.g. resting with no thrust), but stranding can happen in any
    // of them — this also means toggling ♾️ Endless Flight on mid-strand clears the
    // glow/summary the very next frame, no special-case rescue code needed.
    // Golf/Endless additionally gets a dismissible round-over summary (its
    // scorecard equivalent); Explore/Custom have no round concept, so glow+toast
    // is their whole treatment, unchanged.
    let stranded = false;
    if (S.mode === 'explore') stranded = explore.isStranded(explore.fuel, S.inventory);
    else if (S.mode === 'endless' || S.mode === 'custom') stranded = isStranded(S.fuel, S.inventory);
    if (stranded !== wasStranded) {
        wasStranded = stranded;
        restartBtn.classList.toggle('stranded', stranded);
        if (stranded) {
            ui.toast('🚫 Stranded — out of fuel. Hit ↺ to restart.');
            if (S.mode === 'endless') ui.showRoundOverSummary(S.hole);
        } else if (S.mode === 'endless') {
            ui.hideRoundOverSummary();
        }
    }

    if (S.phase === 'flight' || S.phase === 'orbit') {
        world.trail.push({ x: comet.x, y: comet.y });
        if (world.trail.length > 46) world.trail.shift();
    }
    
    // Update camera for golf modes (Explore mode updates its own)
    if (S.mode !== 'explore') {
        if (S.phase === 'orbit' && world.orbit) {
            ui.camera.x += (world.orbit.b.x - ui.camera.x) * Math.min(1, dtRaw * 3);
            ui.camera.y += (world.orbit.b.y - ui.camera.y) * Math.min(1, dtRaw * 3);
        } else {
            ui.camera.x += (comet.x - ui.camera.x) * dtRaw * 4;
            ui.camera.y += (comet.y - ui.camera.y) * dtRaw * 4;
        }
    }
    
    ui.stepParticles(dtRaw);
    ui.updateZoom(dtRaw);
    ui.stepStick(dtRaw);
    ui.render(drag);
}

/* ============================== BOOT ============================== */

localStorage.setItem(LS.lastPlayed, String(Date.now()));
setMuted(localStorage.getItem(LS.muted) === 'true');
S.freezeAim = localStorage.getItem(LS.freezeAim) !== 'false'; // Default to true
S.stardust = parseInt(localStorage.getItem(LS.stardust), 10) || 0;
try {
    const savedUpgrades = JSON.parse(localStorage.getItem(LS.upgrades));
    if (savedUpgrades && typeof savedUpgrades === 'object') Object.assign(S.upgrades, savedUpgrades);
} catch (e) { /* corrupt/missing value — keep defaults */ }
try {
    S.inventory = mergeInventory(JSON.parse(localStorage.getItem(LS.inventory)));
} catch (e) { /* corrupt value — keep defaults */ }
try {
    explore.loadExploreHome(JSON.parse(localStorage.getItem(LS.exploreHome)));
} catch (e) { /* corrupt value — keep defaults */ }
try {
    explore.loadDiscoveredChunks(JSON.parse(localStorage.getItem(LS.discoveredChunks)));
} catch (e) { /* corrupt value — keep defaults */ }
try {
    S.glossarySeen = mergeGlossarySeen(JSON.parse(localStorage.getItem(LS.glossarySeen)));
} catch (e) { /* corrupt value — keep defaults */ }

// MM-18: silent=true — this generates the decorative hole/chunk behind the boot
// menu, never actually played, so it must not mark anything in the glossary as seen.
function bootBackground() {
    const lastMode = localStorage.getItem(LS.mode);
    if (lastMode === 'explore') {
        explore.startRun(true);
    } else {
        game.genHole(1, true);
    }
    S.phase = 'menu';
}

window.addEventListener('resize', ui.resize);
ui.resize();

const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('map')) {
    const mapData = editor.decodeMap(urlParams.get('map'));
    if (mapData) {
        // Strip map from URL so refreshes don't re-trigger it
        const url = new URL(window.location);
        url.searchParams.delete('map');
        window.history.replaceState({}, '', url);
        
        window.pendingSharedMap = mapData;
        document.getElementById('modeBtns').classList.add('hidden');
        document.getElementById('sharedMapBtns').classList.remove('hidden');
        
        bootBackground();
        if (canvas.width === 0) requestAnimationFrame(() => { ui.resize(); bootBackground(); });
    } else {
        ui.toast('❌ Invalid map link');
        bootBackground();
        if (canvas.width === 0) requestAnimationFrame(() => { ui.resize(); bootBackground(); });
    }
} else {
    bootBackground();
    if (canvas.width === 0) requestAnimationFrame(() => { ui.resize(); bootBackground(); });
}

requestAnimationFrame(t => { lastT = t; requestAnimationFrame(frame); });
