// Black Hole in One — Map Maker / Editor mode
'use strict';

import { WORLD_W as W, COURSE_H, PALETTES, rand, COMET_R, CAPTURE_R } from './constants.js';
import { S, world, comet } from './state.js';
import { placeOnRest } from './gameplay.js';

export let hooks = {
    toast() {}, bar() {},
    sfx: { pop() {} }
};
export function setHooks(h) { hooks = Object.assign(hooks, h); }

let dragged = null;
let lastIdx = 0; // for palette cycling

export function startEditor() {
    S.mode = 'editor';
    S.phase = 'edit';
    
    // Create default tee and hole if they don't exist
    if (!world.teeRock) {
        world.teeRock = { x: 50, y: COURSE_H * 0.88, r: 3.4, m: 8, type: 'tee' };
    }
    if (!world.blackHole) {
        world.blackHole = { x: 50, y: COURSE_H * 0.15, r: 3.2, m: 230, type: 'hole' };
    }
    
    // Ensure world.bodies contains the tee and not the blackhole
    world.bodies = world.bodies.filter(b => b.type !== 'tee' && b.type !== 'hole');
    world.bodies.push(world.teeRock);

    S.par = 2; // Default, not strictly used in editor test play but good to have
    S.strokes = 0;
    
    resetComet();
    hooks.bar();
}

function resetComet() {
    comet.vx = comet.vy = 0;
    comet.rest = { b: world.teeRock, ang: -Math.PI / 2 };
    placeOnRest();
    world.lastRest = { rest: comet.rest };
    world.trail = [];
    world.orbit = null;
}

export function addPlanet() {
    if (S.phase !== 'edit') return;
    const r = rand(9, 14);
    const pal = PALETTES[(lastIdx++) % PALETTES.length];
    const p = { x: 50, y: COURSE_H / 2, r, m: r * r, type: 'planet', pal, spin: rand(0, Math.PI * 2) };
    world.bodies.push(p);
    hooks.sfx.pop();
}

export function addPulsar() {
    if (S.phase !== 'edit') return;
    const p = { x: 50, y: COURSE_H / 2, r: 2.6, m: -160, type: 'pulsar' };
    world.bodies.push(p);
    hooks.sfx.pop();
}

export function pointerDown(wx, wy, id) {
    if (dragged) return false;
    
    // Find object under cursor
    let found = null;
    
    // Check black hole first
    if (world.blackHole && Math.hypot(world.blackHole.x - wx, world.blackHole.y - wy) <= world.blackHole.r * 2 + 5) {
        found = world.blackHole;
    }
    
    if (!found) {
        // Check bodies (planets, pulsars, tee)
        // Reverse order to grab top-most
        for (let i = world.bodies.length - 1; i >= 0; i--) {
            const b = world.bodies[i];
            const hitR = b.type === 'pulsar' ? b.r * 3 : b.r + 5;
            if (Math.hypot(b.x - wx, b.y - wy) <= hitR) {
                found = b;
                break;
            }
        }
    }
    
    if (found) {
        dragged = { id, obj: found, ox: found.x - wx, oy: found.y - wy };
        return true;
    }
    return false;
}

export function pointerMove(wx, wy, id) {
    if (dragged && dragged.id === id) {
        dragged.obj.x = wx + dragged.ox;
        dragged.obj.y = wy + dragged.oy;
        if (dragged.obj === world.teeRock) resetComet();
    }
}

export function pointerUp(wx, wy, id) {
    if (dragged && dragged.id === id) {
        const o = dragged.obj;
        // Delete if dragged out of bounds (except tee/hole)
        if (o.type !== 'tee' && o.type !== 'hole') {
            if (o.x < -10 || o.x > W + 10 || o.y < -10 || o.y > COURSE_H + 10) {
                world.bodies = world.bodies.filter(b => b !== o);
                hooks.sfx.pop();
                hooks.toast('🗑️ Deleted');
            }
        }
        dragged = null;
        return true;
    }
    return false;
}

export function toggleTestPlay() {
    if (S.phase === 'edit') {
        // Enter test mode
        world.editorBackup = {
            bodies: world.bodies.map(b => ({ ...b })),
            teeRock: { ...world.teeRock },
            blackHole: { ...world.blackHole }
        };
        S.phase = 'rest';
        S.strokes = 0;
        S.totalDiff = 0;
        resetComet();
        hooks.toast('▶ Test Play');
        document.getElementById('ed-test').textContent = '⏹ Stop Test';
        document.getElementById('ed-test').classList.add('active');
        document.querySelector('.ed-tools').classList.add('disabled');
    } else {
        // Exit test mode
        stopTest();
    }
}

export function stopTest() {
    if (S.phase === 'edit') return;
    if (world.editorBackup) {
        world.bodies = world.editorBackup.bodies;
        world.teeRock = world.editorBackup.teeRock;
        world.blackHole = world.editorBackup.blackHole;
        
        // Re-link teeRock in bodies to ensure identity matches
        world.bodies = world.bodies.filter(b => b.type !== 'tee');
        world.bodies.push(world.teeRock);
    }
    S.phase = 'edit';
    resetComet();
    hooks.toast('🔨 Map Maker');
    document.getElementById('ed-test').textContent = '▶ Test Play';
    document.getElementById('ed-test').classList.remove('active');
    document.querySelector('.ed-tools').classList.remove('disabled');
}

/* ============================== MY MAPS ============================== */

const LS_MAPS = 'blackHoleInOne_myMaps';

function getMaps() {
    try {
        return JSON.parse(localStorage.getItem(LS_MAPS) || '[]');
    } catch {
        return [];
    }
}

function saveMaps(maps) {
    localStorage.setItem(LS_MAPS, JSON.stringify(maps));
}

export function toggleMapsDrawer() {
    const drawer = document.getElementById('myMapsDrawer');
    if (drawer.classList.contains('hidden')) {
        renderMapsList();
        drawer.classList.remove('hidden');
    } else {
        drawer.classList.add('hidden');
    }
}

export function saveCurrentMap() {
    if (S.phase !== 'edit') return; // Only save from edit phase
    const maps = getMaps();
    const name = prompt('Enter a name for this map:', 'My Custom Hole');
    if (!name) return;

    const mapData = {
        name,
        bodies: world.bodies.map(b => ({ ...b })),
        teeRock: { ...world.teeRock },
        blackHole: { ...world.blackHole }
    };
    maps.push(mapData);
    saveMaps(maps);
    hooks.toast('💾 Map saved');
    renderMapsList();
}

function loadMap(index) {
    const maps = getMaps();
    const m = maps[index];
    if (!m) return;
    
    // Stop test if we were in it
    if (S.phase === 'rest' || S.phase === 'aiming' || S.phase === 'orbit' || S.phase === 'flight' || S.phase === 'sink') {
        stopTest();
    }
    
    world.bodies = m.bodies;
    world.teeRock = m.teeRock;
    world.blackHole = m.blackHole;
    
    // Re-link teeRock in bodies
    world.bodies = world.bodies.filter(b => b.type !== 'tee');
    world.bodies.push(world.teeRock);
    
    resetComet();
    hooks.toast('📂 Map loaded');
    toggleMapsDrawer();
}

function deleteMap(index) {
    if (!confirm('Delete this map?')) return;
    const maps = getMaps();
    maps.splice(index, 1);
    saveMaps(maps);
    renderMapsList();
}

function renameMap(index) {
    const maps = getMaps();
    const m = maps[index];
    if (!m) return;
    const newName = prompt('Enter new name:', m.name);
    if (!newName) return;
    m.name = newName;
    saveMaps(maps);
    renderMapsList();
}

function renderMapsList() {
    const maps = getMaps();
    const list = document.getElementById('myMapsList');
    list.innerHTML = '';
    
    if (maps.length === 0) {
        list.innerHTML = '<div style="opacity:0.6;font-size:0.9rem;">No saved maps yet.</div>';
        return;
    }
    
    maps.forEach((m, idx) => {
        const item = document.createElement('div');
        item.className = 'mm-map-item';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = m.name;
        
        const actions = document.createElement('div');
        actions.className = 'mm-map-actions';
        
        const playBtn = document.createElement('button');
        playBtn.textContent = '▶ Load';
        playBtn.onclick = () => loadMap(idx);
        
        const renameBtn = document.createElement('button');
        renameBtn.textContent = '✎';
        renameBtn.onclick = () => renameMap(idx);
        
        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑';
        delBtn.onclick = () => deleteMap(idx);
        
        actions.appendChild(playBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(delBtn);
        
        item.appendChild(nameSpan);
        item.appendChild(actions);
        list.appendChild(item);
    });
}
