// Black Hole in One — Map Maker / Editor mode
'use strict';

import { WORLD_W as W, COURSE_H, PALETTES, rand, COMET_R, CAPTURE_R, MAP_SIZES, DEFAULT_MAP_SIZE, mapBounds } from './constants.js';
import { S, world, comet } from './state.js';
import { placeOnRest } from './gameplay.js';

export let hooks = {
    toast() {}, bar() {},
    sfx: { pop() {} }
};
export function setHooks(h) { hooks = Object.assign(hooks, h); }

let dragged = null;
let lastIdx = 0; // for palette cycling

// sizeKey: the MM-6 canvas tier ('small' | 'large') chosen in the mode menu's size
// chooser before entering the editor. Always starts a fresh blank map — Map Maker
// has no separate "new map" action, so choosing a size from the menu IS starting new.
export function startEditor(sizeKey = DEFAULT_MAP_SIZE) {
    S.mode = 'editor';
    S.phase = 'edit';
    world.mapSizeKey = MAP_SIZES[sizeKey] ? sizeKey : DEFAULT_MAP_SIZE;
    const { w, h } = mapBounds(world.mapSizeKey);

    world.bodies = [];
    world.teeRock = { x: w / 2, y: h * 0.88, r: 3.4, m: 8, type: 'tee' };
    world.blackHole = { x: w / 2, y: h * 0.15, r: 3.2, m: 230, type: 'hole' };
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
    const { w, h } = mapBounds(world.mapSizeKey);
    const r = rand(9, 14);
    const pal = PALETTES[(lastIdx++) % PALETTES.length];
    const p = { x: w / 2, y: h / 2, r, m: r * r, type: 'planet', pal, spin: rand(0, Math.PI * 2) };
    world.bodies.push(p);
    hooks.sfx.pop();
}

export function addPulsar() {
    if (S.phase !== 'edit') return;
    const { w, h } = mapBounds(world.mapSizeKey);
    const p = { x: w / 2, y: h / 2, r: 2.6, m: -160, type: 'pulsar' };
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
            const hitR = b.type === 'pulsar' ? 12.6 : b.r + 5;
            if (Math.hypot(b.x - wx, b.y - wy) <= hitR) {
                found = b;
                break;
            }
        }
    }
    
    if (found) {
        dragged = { id, obj: found, ox: found.x - wx, oy: found.y - wy };
        if (found.type !== 'tee' && found.type !== 'hole') {
            const trash = document.getElementById('editorTrash');
            if (trash) trash.classList.remove('hidden');
        }
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

export function pointerUp(wx, wy, id, cx, cy) {
    if (!dragged || dragged.id !== id) return false;
    const o = dragged.obj;
    // Clear the drag FIRST: if any hook below throws, the editor must not be left
    // wedged with a stuck `dragged` (that was the STAB-3 "drag/delete stops working").
    dragged = null;
    const trash = document.getElementById('editorTrash');

    // Decide deletion WHILE the trash is still visible. getBoundingClientRect() on a
    // display:none element returns all-zeros, so measuring after hiding made the trash
    // drop-zone never register a hit — the "delete box does not work" report.
    const deletable = o.type !== 'tee' && o.type !== 'hole';
    let overTrash = false;
    if (deletable && trash && cx !== undefined && cy !== undefined) {
        const rect = trash.getBoundingClientRect();
        overTrash = (cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom);
    }
    if (trash) trash.classList.add('hidden');

    const { w: mapW, h: mapH } = mapBounds(world.mapSizeKey);
    if (deletable && (overTrash || o.x < -10 || o.x > mapW + 10 || o.y < -10 || o.y > mapH + 10)) {
        world.bodies = world.bodies.filter(b => b !== o);
        hooks.sfx.pop();
        hooks.toast('🗑️ Deleted');
    }
    return true;
}

// Force-release any in-progress drag — used by the pointercancel handler, which
// can't match a real pointer id. Without this a canceled touch wedged the editor.
export function cancelDrag() {
    dragged = null;
    const trash = document.getElementById('editorTrash');
    if (trash) trash.classList.add('hidden');
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
        blackHole: { ...world.blackHole },
        size: world.mapSizeKey,
    };
    maps.push(mapData);
    saveMaps(maps);
    hooks.toast('💾 Map saved');
    renderMapsList();
}

export function saveCustomMap() {
    if (S.mode !== 'custom') return;
    const maps = getMaps();
    const name = prompt('Enter a name for this map:', 'Imported Map');
    if (!name) return;

    const mapData = {
        name,
        bodies: world.bodies.map(b => ({ ...b })),
        teeRock: { ...world.teeRock },
        blackHole: { ...world.blackHole },
        size: world.mapSizeKey,
    };
    maps.push(mapData);
    saveMaps(maps);
    hooks.toast('💾 Map saved to My Maps');
}

export function importFromUrl() {
    const url = prompt('Paste the shared map URL here:');
    if (!url) return;
    try {
        let hash = '';
        if (url.includes('?map=')) {
            const urlObj = new URL(url);
            hash = urlObj.searchParams.get('map');
        } else {
            hash = url;
        }
        
        if (!hash) {
            hooks.toast('❌ No map found in URL');
            return;
        }
        const mapData = decodeMap(hash);
        if (!mapData) {
            hooks.toast('❌ Invalid map data');
            return;
        }
        const maps = getMaps();
        const name = prompt('Enter a name for this imported map:', 'Imported Map');
        if (!name) return;
        
        mapData.name = name;
        maps.push(mapData);
        saveMaps(maps);
        hooks.toast('💾 Map imported');
        renderMapsList();
    } catch (e) {
        hooks.toast('❌ Invalid URL');
    }
}

export function encodeMap(mapData) {
    const arr = [];
    const r = (v) => Math.round(v * 10) / 10;
    arr.push([0, r(mapData.teeRock.x), r(mapData.teeRock.y)]);
    arr.push([1, r(mapData.blackHole.x), r(mapData.blackHole.y)]);
    // Omitted for the default 'small' size so pre-sprint share links stay byte-identical.
    if (mapData.size === 'large') arr.push([4, 1]);

    mapData.bodies.forEach(b => {
        if (b.type === 'planet') arr.push([2, r(b.x), r(b.y), r(b.r), b.pal, r(b.spin)]);
        else if (b.type === 'pulsar') arr.push([3, r(b.x), r(b.y)]);
    });
    
    const str = JSON.stringify(arr);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeMap(hash) {
    try {
        let b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        const arr = JSON.parse(atob(b64));
        
        let teeRock = null, blackHole = null;
        const bodies = [];
        let size = DEFAULT_MAP_SIZE; // maps encoded before MM-6 carry no size tag — default small

        arr.forEach(i => {
            if (i[0] === 0) teeRock = { x: i[1], y: i[2], r: 3.4, m: 8, type: 'tee' };
            else if (i[0] === 1) blackHole = { x: i[1], y: i[2], r: 3.2, m: 230, type: 'hole' };
            else if (i[0] === 2) bodies.push({ x: i[1], y: i[2], r: i[3], m: i[3]*i[3], type: 'planet', pal: i[4], spin: i[5] });
            else if (i[0] === 3) bodies.push({ x: i[1], y: i[2], r: 2.6, m: -160, type: 'pulsar' });
            else if (i[0] === 4) size = i[1] === 1 ? 'large' : DEFAULT_MAP_SIZE;
        });

        if (!teeRock || !blackHole) return null;
        return { teeRock, blackHole, bodies, size };
    } catch {
        return null;
    }
}

export function shareCurrentMap() {
    if (S.phase !== 'edit') return;
    const mapData = {
        bodies: world.bodies.map(b => ({ ...b })),
        teeRock: { ...world.teeRock },
        blackHole: { ...world.blackHole },
        size: world.mapSizeKey,
    };
    const hash = encodeMap(mapData);
    copyShareLink(hash);
}

function shareMap(index) {
    const maps = getMaps();
    const m = maps[index];
    if (!m) return;
    const hash = encodeMap(m);
    copyShareLink(hash);
}

function copyShareLink(hash) {
    const url = window.location.origin + window.location.pathname + '?map=' + hash;
    navigator.clipboard.writeText(url).then(() => {
        hooks.toast('🔗 Link copied');
    }).catch(() => {
        hooks.toast('❌ Could not copy');
    });
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
    world.mapSizeKey = m.size === 'large' ? 'large' : DEFAULT_MAP_SIZE;

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
        
        const shareBtn = document.createElement('button');
        shareBtn.textContent = '🔗 Share';
        shareBtn.onclick = () => shareMap(idx);
        
        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑';
        delBtn.onclick = () => deleteMap(idx);
        
        actions.appendChild(playBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(shareBtn);
        actions.appendChild(delBtn);
        
        item.appendChild(nameSpan);
        item.appendChild(actions);
        list.appendChild(item);
    });
}
