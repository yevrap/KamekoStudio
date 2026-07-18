// Black Hole in One — boot, input, main loop, shared-infrastructure wiring.
'use strict';

import { DT, ROUND_HOLES, ITEMS, TAP_MAX_LEN } from './constants.js';
import { S, world, comet, mergeInventory } from './state.js';
import * as game from './gameplay.js';
import * as explore from './explore.js';
import * as editor from './editor.js';
import * as ui from './ui.js';
import { sfx, audio, setMuted, isMuted } from './sfx.js';

const canvas = document.getElementById('game');
const restartBtn = document.getElementById('restartBtn');

const LS = {
    lastPlayed: 'lastPlayed_blackHoleInOne',
    bestRound: 'blackHoleInOne_bestRound',
    mode: 'blackHoleInOne_mode',
    muted: 'blackHoleInOne_muted',
    freezeAim: 'blackHoleInOne_freezeAim',
    stardust: 'blackHoleInOne_stardust',
    upgrades: 'blackHoleInOne_upgrades',
    inventory: 'blackHoleInOne_inventory',
    exploreHome: 'blackHoleInOne_exploreHome',
    discoveredChunks: 'blackHoleInOne_discoveredChunks',
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
    showSurvivalGameOver(level) {
        ui.showSurvivalGameOver(level);
    },
    editorReturn() {
        editor.stopTest();
    },
    stardust(total) {
        localStorage.setItem(LS.stardust, String(total));
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
    if (S.phase === 'menu' || S.phase === 'roundover') return;  // overlays own this tap
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
        explore.handleTap(wx, wy);
        if (S.phase === 'aiming') S.phase = world.orbit ? 'orbit' : (S.prevPhase === 'flight' ? 'flight' : 'rest');
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

function startRun(mode) {
    audio();
    localStorage.setItem(LS.mode, mode);
    ui.hideHowto();
    ui.hideScorecard();
    ui.hideSurvivalGameOver();
    document.getElementById('bar').classList.add('hidden');
    document.getElementById('exploreBar').classList.add('hidden');
    document.getElementById('editorBar').classList.add('hidden');
    document.getElementById('customBar').classList.add('hidden');
    document.getElementById('mapBtn').classList.add('hidden');
    if (mode === 'explore') {
        document.getElementById('exploreBar').classList.remove('hidden');
        document.getElementById('mapBtn').classList.remove('hidden');
        explore.startRun();
    } else if (mode === 'editor') {
        document.getElementById('editorBar').classList.remove('hidden');
        editor.startEditor();
    } else if (mode === 'custom') {
        document.getElementById('customBar').classList.remove('hidden');
        document.getElementById('bar').classList.remove('hidden');
        game.startRun(mode);
    } else {
        document.getElementById('bar').classList.remove('hidden');
        game.startRun(mode);
    }
}

document.getElementById('modeEndless').addEventListener('click', () => startRun('endless'));
document.getElementById('modeExplore').addEventListener('click', () => startRun('explore'));
document.getElementById('modeEditor').addEventListener('click', () => startRun('editor'));

document.getElementById('modeSharedPlay').addEventListener('click', () => {
    audio();
    document.getElementById('sharedMapBtns').classList.add('hidden');
    document.getElementById('modeBtns').classList.remove('hidden');
    if (window.pendingSharedMap) {
        game.startCustomMap(window.pendingSharedMap);
        window.pendingSharedMap = null;
    }
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
document.getElementById('ed-maps').addEventListener('click', () => editor.toggleMapsDrawer());
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
    if (e.target.closest('button')) return;
    audio();
    // tap outside the buttons: resume if a run is live, else start last-used mode
    if (S.phase === 'menu') {
        if (window.pendingSharedMap) return; // force them to click a button
        startRun(localStorage.getItem(LS.mode) || 'endless');
    } else {
        ui.hideHowto();
    }
});

document.getElementById('sc-endless').addEventListener('click', () => startRun('endless'));

restartBtn.addEventListener('click', () => {
    startRun(S.mode);
    ui.toast('↺ Fresh start');
});
document.getElementById('helpBtn').addEventListener('click', () => {
    ui.showHowto();
    if (drag) drag = null;
    if (S.phase === 'aiming') S.phase = 'rest';
});
document.getElementById('mapBtn').addEventListener('click', () => {
    ui.toggleStarMap();
    if (drag) drag = null;
    if (S.phase === 'aiming') S.phase = 'rest';
});
document.getElementById('sm-close').addEventListener('click', () => ui.hideStarMap());

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

/* ============================== SETTINGS DRAWER ============================== */

if (window.KamekoSettings) {
    window.KamekoSettings.registerSection('black-hole-in-one-settings', {
        title: () => '⚫ Black Hole in One',
        render(container) {
            container.innerHTML = `
                <button class="settings-btn" id="bh-howto">❓ How to play</button>
                <label class="settings-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px">
                    <span>Sound effects</span>
                    <input type="checkbox" id="bh-sound" ${isMuted() ? '' : 'checked'}>
                </label>
                <label class="settings-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px">
                    <span>Freeze mid-flight aim (Explore)</span>
                    <input type="checkbox" id="bh-freeze" ${S.freezeAim ? 'checked' : ''}>
                </label>`;
            container.querySelector('#bh-howto').addEventListener('click', () => {
                window.KamekoSettings.closeDrawer();
                ui.showHowto();
            });
            container.querySelector('#bh-sound').addEventListener('change', e => {
                setMuted(!e.target.checked);
                localStorage.setItem(LS.muted, String(!e.target.checked));
            });
            container.querySelector('#bh-freeze').addEventListener('change', e => {
                S.freezeAim = e.target.checked;
                localStorage.setItem(LS.freezeAim, String(e.target.checked));
            });
        },
    });

    window.KamekoSettings.registerSection('black-hole-in-one-inventory', {
        title: () => '🎒 Inventory',
        when: () => S.mode === 'explore',
        render(container) {
            container.innerHTML = ITEMS.map(item => `
                <label class="settings-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px">
                    <span>${item.icon} ${item.label}<br><small style="opacity:.65;font-weight:400">${item.desc}</small></span>
                    <input type="checkbox" data-item="${item.key}" ${S.inventory[item.key]?.enabled ? 'checked' : ''}>
                </label>`).join('');
            container.querySelectorAll('input[data-item]').forEach(cb => {
                cb.addEventListener('change', e => {
                    const key = e.target.dataset.item;
                    S.inventory[key].enabled = e.target.checked;
                    localStorage.setItem(LS.inventory, JSON.stringify(S.inventory));
                    // Endless Flight (INV-1) is a fuel-lock — switching it on tops the tank
                    // off immediately rather than waiting for the next drain/pickup event.
                    if (key === 'endlessFlight' && e.target.checked) explore.refuelFull();
                });
            });
        },
    });
}

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
        } else {
            if (S.phase === 'flight') game.stepFlight(DT);
            else if (S.phase === 'orbit') game.stepOrbit(DT);
            else if (S.phase === 'sink') game.stepSink(DT);
            
            if (S.mode === 'survival' && (S.phase === 'rest' || S.phase === 'aiming' || S.phase === 'flight' || S.phase === 'orbit')) {
                game.stepAsteroids(DT);
            }
        }
    }

    // FUEL-1: no auto-tow anywhere — an empty tank just leaves the comet
    // stranded, so the restart button pulses/glows as the way out instead.
    // Checked every frame (not just on step()) since step() doesn't run in
    // every phase (e.g. resting with no thrust), but stranding can happen in any of them.
    if (S.mode === 'explore') {
        const stranded = explore.isStranded(explore.fuel, S.inventory);
        if (stranded !== wasStranded) {
            wasStranded = stranded;
            restartBtn.classList.toggle('stranded', stranded);
            if (stranded) ui.toast('🚫 Stranded — out of fuel. Hit ↺ to restart.');
        }
    } else if (wasStranded) {
        wasStranded = false;
        restartBtn.classList.remove('stranded');
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

function bootBackground() {
    const lastMode = localStorage.getItem(LS.mode);
    if (lastMode === 'explore') {
        explore.startRun();
    } else {
        game.genHole(1);
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
