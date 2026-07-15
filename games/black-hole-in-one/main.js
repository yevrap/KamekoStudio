// Black Hole in One — boot, input, main loop, shared-infrastructure wiring.
'use strict';

import { DT, ROUND_HOLES } from './constants.js';
import { S, world, comet } from './state.js';
import * as game from './gameplay.js';
import * as explore from './explore.js';
import * as editor from './editor.js';
import * as ui from './ui.js';
import { sfx, audio, setMuted, isMuted } from './sfx.js';

const canvas = document.getElementById('game');

const LS = {
    lastPlayed: 'lastPlayed_blackHoleInOne',
    bestRound: 'blackHoleInOne_bestRound',
    mode: 'blackHoleInOne_mode',
    muted: 'blackHoleInOne_muted',
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
    holeStart: ui.clearParticles,
    sfx,
    roundEnd(result) {
        const prev = bestRound();
        const isNew = (prev === null || result.total < prev);
        if (isNew) localStorage.setItem(LS.bestRound, String(result.total));
        ui.showScorecard(result, prev, isNew);
        sfx.score(result.total <= 0 ? 5 : 2);
    },
    editorReturn() {
        editor.stopTest();
    },
});

explore.setHooks({
    toast: ui.toast,
    bar: ui.updateBar,
    burst: ui.burst,
    sfx,
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
    
    const [wx, wy] = ui.toWorld(e);
    if (S.mode === 'editor' && S.phase === 'edit') {
        if (editor.pointerDown(wx, wy, e.pointerId)) {
            canvas.setPointerCapture(e.pointerId);
        }
        return;
    }

    // aim from rest OR from a live orbit (BH-4) — starting a drag freezes the
    // orbit into 'aiming'; comet.vx/vy keep the orbital velocity for the impulse
    if ((S.phase !== 'rest' && S.phase !== 'orbit') || drag) return;
    drag = { sx: wx, sy: wy, cx: wx, cy: wy, id: e.pointerId };
    S.phase = 'aiming';
    canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
    const [wx, wy] = ui.toWorld(e);
    if (S.mode === 'editor' && S.phase === 'edit') {
        editor.pointerMove(wx, wy, e.pointerId);
        return;
    }

    if (!drag || e.pointerId !== drag.id) return;
    drag.cx = wx; drag.cy = wy;
});
canvas.addEventListener('pointerup', e => {
    const [wx, wy] = ui.toWorld(e);
    if (S.mode === 'editor' && S.phase === 'edit') {
        editor.pointerUp(wx, wy, e.pointerId);
        return;
    }

    if (!drag || e.pointerId !== drag.id) return;
    const dx = drag.sx - drag.cx, dy = drag.sy - drag.cy;
    const len = Math.hypot(dx, dy);
    drag = null;
    if (len > 0) {
        if (S.mode === 'explore') explore.launch(dx, dy, len);
        else game.launch(dx, dy, len); // Editor test play reuses game.launch
    }
    else S.phase = world.orbit ? 'orbit' : 'rest'; // no drag: fall back to whatever we were aiming from
});
canvas.addEventListener('pointercancel', () => { 
    if (drag) { drag = null; S.phase = world.orbit ? 'orbit' : 'rest'; } 
    if (S.mode === 'editor' && S.phase === 'edit') editor.pointerUp(0, 0, -1); // Just to clear dragged if any
});

/* ============================== OVERLAY BUTTONS ============================== */

function startRun(mode) {
    audio();
    localStorage.setItem(LS.mode, mode);
    ui.hideHowto();
    ui.hideScorecard();
    document.getElementById('bar').classList.add('hidden');
    document.getElementById('exploreBar').classList.add('hidden');
    document.getElementById('editorBar').classList.add('hidden');
    if (mode === 'explore') {
        document.getElementById('exploreBar').classList.remove('hidden');
        explore.startRun();
    } else if (mode === 'editor') {
        document.getElementById('editorBar').classList.remove('hidden');
        editor.startEditor();
    } else {
        document.getElementById('bar').classList.remove('hidden');
        game.startRun(mode);
    }
}

document.getElementById('modeEndless').addEventListener('click', () => startRun('endless'));
document.getElementById('modeRound').addEventListener('click', () => startRun('round'));
document.getElementById('modeExplore').addEventListener('click', () => startRun('explore'));
document.getElementById('modeEditor').addEventListener('click', () => startRun('editor'));

document.getElementById('ed-test').addEventListener('click', () => editor.toggleTestPlay());
document.getElementById('ed-add-planet').addEventListener('click', () => editor.addPlanet());
document.getElementById('ed-add-pulsar').addEventListener('click', () => editor.addPulsar());
document.getElementById('ed-maps').addEventListener('click', () => editor.toggleMapsDrawer());
document.getElementById('mm-saveNew').addEventListener('click', () => editor.saveCurrentMap());
document.getElementById('mm-close').addEventListener('click', () => editor.toggleMapsDrawer());
document.getElementById('howto').addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    audio();
    // tap outside the buttons: resume if a run is live, else start last-used mode
    if (S.phase === 'menu') startRun(localStorage.getItem(LS.mode) || 'endless');
    else ui.hideHowto();
});

document.getElementById('sc-again').addEventListener('click', () => startRun('round'));
document.getElementById('sc-endless').addEventListener('click', () => startRun('endless'));

document.getElementById('restartBtn').addEventListener('click', () => {
    startRun(S.mode);
    ui.toast(S.mode === 'round' ? '↺ New round' : '↺ Fresh start');
});
document.getElementById('helpBtn').addEventListener('click', () => {
    ui.showHowto();
    if (drag) drag = null;
    if (S.phase === 'aiming') S.phase = 'rest';
});

/* ============================== PAUSE ============================== */

document.addEventListener('visibilitychange', () => { S.paused = document.hidden; });
window.addEventListener('blur', () => { S.paused = true; });
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
                <button class="settings-btn" id="bh-new">↺ New ${S.mode === 'round' ? 'round' : 'run'}</button>
                <label class="settings-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px">
                    <span>Sound effects</span>
                    <input type="checkbox" id="bh-sound" ${isMuted() ? '' : 'checked'}>
                </label>`;
            container.querySelector('#bh-howto').addEventListener('click', () => {
                window.KamekoSettings.closeDrawer();
                ui.showHowto();
            });
            container.querySelector('#bh-new').addEventListener('click', () => {
                window.KamekoSettings.closeDrawer();
                startRun(S.mode);
            });
            container.querySelector('#bh-sound').addEventListener('change', e => {
                setMuted(!e.target.checked);
                localStorage.setItem(LS.muted, String(!e.target.checked));
            });
        },
    });
}

/* ============================== MAIN LOOP ============================== */

let lastT = 0, acc = 0;
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
            if (S.phase === 'flight') explore.step(DT);
            else if (S.phase === 'orbit') explore.stepOrbit(DT);
        } else {
            if (S.phase === 'flight') game.stepFlight(DT);
            else if (S.phase === 'orbit') game.stepOrbit(DT);
            else if (S.phase === 'sink') game.stepSink(DT);
        }
    }
    if (S.phase === 'flight' || S.phase === 'orbit') {
        world.trail.push({ x: comet.x, y: comet.y });
        if (world.trail.length > 46) world.trail.shift();
    }
    ui.stepParticles(dtRaw);
    ui.render(drag);
}

/* ============================== BOOT ============================== */

localStorage.setItem(LS.lastPlayed, String(Date.now()));
setMuted(localStorage.getItem(LS.muted) === 'true');

window.addEventListener('resize', ui.resize);
ui.resize();
game.genHole(1);
S.phase = 'menu';
if (canvas.width === 0) requestAnimationFrame(() => { ui.resize(); game.genHole(1); S.phase = 'menu'; });
requestAnimationFrame(t => { lastT = t; requestAnimationFrame(frame); });
