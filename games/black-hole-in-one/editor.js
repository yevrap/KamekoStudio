// Black Hole in One — Map Maker / Editor mode
'use strict';

import { WORLD_W as W, COURSE_H, PALETTES, rand, COMET_R, CAPTURE_R, MAP_SIZES, DEFAULT_MAP_SIZE, mapBounds, PLANET_R_MIN, PLANET_R_MAX, PLANET_R_STEP } from './constants.js';
import { S, world, comet } from './state.js';
import { placeOnRest, startCustomMap } from './gameplay.js';

export let hooks = {
    toast() {}, bar() {},
    sfx: { pop() {} }
};
export function setHooks(h) { hooks = Object.assign(hooks, h); }

let dragged = null;
let lastIdx = 0; // for palette cycling

// MM-15: the one planet a builder is currently fine-tuning in the 1:1 view —
// property panel (size stepper, refuel toggle) reads/writes through this.
// Only ever a planet (per the sprint doc: sizing is a fine-adjustment
// operation, not something the overview canvas exposes).
let selected = null;
export function getSelected() { return selected; }

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
    // MM-15: pickups are now placeable in the editor — start every fresh map
    // clean rather than inheriting whatever golf/endless/explore left behind
    // in this module-level singleton. Asteroids stay out of Map Maker
    // entirely (see addTrap/addMine comment below) but are cleared too so a
    // stray leftover swarm never renders as confusing background clutter.
    world.pickups = [];
    world.asteroids = [];
    selected = null;

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
    // MM-15: reduced from rand(9,14) — tighter, more solvable holes by
    // default; the size stepper covers the rest of the range (PLANET_R_MIN
    // to PLANET_R_MAX) once a builder wants something bigger.
    const r = rand(6, 10);
    const pal = PALETTES[(lastIdx++) % PALETTES.length];
    const p = { x: w / 2, y: h / 2, r, m: r * r, type: 'planet', pal, spin: rand(0, Math.PI * 2) };
    world.bodies.push(p);
    selected = p; // MM-15: select it immediately so the size/refuel panel is one tap away, not two
    hooks.sfx.pop();
    hooks.bar();
}

export function addPulsar() {
    if (S.phase !== 'edit') return;
    const { w, h } = mapBounds(world.mapSizeKey);
    const p = { x: w / 2, y: h / 2, r: 2.6, m: -160, type: 'pulsar' };
    world.bodies.push(p);
    hooks.sfx.pop();
}

// MM-15 scope expansion (Yev, 2026-07-19: "I want all of the current object
// types available"). Trap/Mine reuse world.bodies and the generic hit-test/
// drag/delete loops below unchanged — same as Pulsar always has. Made safe to
// place outside Endless by gameplay.js's triggerHazardDeath fix (see that
// file): hitting one no longer softlocks golf/editor Test Play/custom play.
export function addTrap() {
    if (S.phase !== 'edit') return;
    const { w, h } = mapBounds(world.mapSizeKey);
    world.bodies.push({ x: w / 2, y: h / 2, r: 2.8, m: 200, type: 'trap' });
    hooks.sfx.pop();
}

export function addMine() {
    if (S.phase !== 'edit') return;
    const { w, h } = mapBounds(world.mapSizeKey);
    world.bodies.push({ x: w / 2, y: h / 2, r: 2, m: 0, type: 'mine' });
    hooks.sfx.pop();
}

// Fuel/Stardust pickups live in world.pickups, not world.bodies — same
// canonical r/type as gameplay.js's genHole/explore.js spawn them with. Made
// non-inert outside Endless by widening gameplay.js's pickup-collision gate.
export function addFuelPickup() {
    if (S.phase !== 'edit') return;
    const { w, h } = mapBounds(world.mapSizeKey);
    world.pickups.push({ x: w / 2, y: h / 2, r: 1.8, type: 'fuel' });
    hooks.sfx.pop();
}

export function addStardustPickup() {
    if (S.phase !== 'edit') return;
    const { w, h } = mapBounds(world.mapSizeKey);
    world.pickups.push({ x: w / 2, y: h / 2, r: 1.2, type: 'stardust' });
    hooks.sfx.pop();
}

// MM-15: fine-adjustment controls for the currently selected planet (1:1 view
// only — the overview canvas never calls these, per the sprint doc's own
// "sizing is a fine-adjustment operation, not an overview one").
export function growSelectedPlanet() {
    if (!selected || selected.type !== 'planet') return;
    selected.r = Math.min(PLANET_R_MAX, Math.round((selected.r + PLANET_R_STEP) * 10) / 10);
    selected.m = selected.r * selected.r;
    hooks.bar();
}

export function shrinkSelectedPlanet() {
    if (!selected || selected.type !== 'planet') return;
    selected.r = Math.max(PLANET_R_MIN, Math.round((selected.r - PLANET_R_STEP) * 10) / 10);
    selected.m = selected.r * selected.r;
    hooks.bar();
}

export function toggleSelectedRefuel() {
    if (!selected || selected.type !== 'planet') return;
    selected.refuelStation = !selected.refuelStation;
    hooks.bar();
}

export function deselectBody() {
    if (!selected) return;
    selected = null;
    hooks.bar();
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
        // Check bodies (planets, pulsars, tee, trap, mine)
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

    // MM-15: fuel/stardust pickups — generous flat margin, same rationale as
    // pulsar's special case above (their true radius is too small to be a
    // fair touch target on its own).
    if (!found) {
        for (let i = world.pickups.length - 1; i >= 0; i--) {
            const p = world.pickups[i];
            if (Math.hypot(p.x - wx, p.y - wy) <= p.r + 6) {
                found = p;
                break;
            }
        }
    }

    // MM-15: tapping a planet selects it for the size/refuel panel; tapping
    // anything else (or empty canvas) clears the selection so the panel
    // never shows stale data for an object no longer under the cursor.
    selected = (found && found.type === 'planet') ? found : null;
    hooks.bar();

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
        // MM-15: pickups live in world.pickups, not world.bodies — everything
        // else (planet/pulsar/trap/mine) still comes from the bodies array.
        if (o.type === 'fuel' || o.type === 'stardust') {
            world.pickups = world.pickups.filter(p => p !== o);
        } else {
            world.bodies = world.bodies.filter(b => b !== o);
        }
        if (selected === o) { selected = null; }
        hooks.sfx.pop();
        hooks.toast('🗑️ Deleted');
        hooks.bar();
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
            blackHole: { ...world.blackHole },
            pickups: world.pickups.map(p => ({ ...p })), // MM-15: pickups can now be consumed mid-test
        };
        S.phase = 'rest';
        S.strokes = 0;
        S.totalDiff = 0;
        selected = null; // the size/refuel panel has nothing to do mid-test
        resetComet();
        hooks.toast('▶ Test Play');
        document.getElementById('ed-test').textContent = '⏹ Stop Test';
        document.getElementById('ed-test').classList.add('active');
        // MM-15: the toolbar is now two `.ed-tools` rows (Add object / Overview+Maps),
        // not one — both must lock during Test Play, not just the first match.
        document.querySelectorAll('.ed-tools').forEach(el => el.classList.add('disabled'));
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
        world.pickups = world.editorBackup.pickups || [];

        // Re-link teeRock in bodies to ensure identity matches
        world.bodies = world.bodies.filter(b => b.type !== 'tee');
        world.bodies.push(world.teeRock);
    }
    S.phase = 'edit';
    selected = null;
    resetComet();
    hooks.toast('🔨 Map Maker');
    document.getElementById('ed-test').textContent = '▶ Test Play';
    document.getElementById('ed-test').classList.remove('active');
    document.querySelectorAll('.ed-tools').forEach(el => el.classList.remove('disabled'));
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
        // "Save/Share Current Map" only make sense when a map is actually open in
        // the 1:1 editor — opened from the main menu's top-level "My Maps" entry
        // there is no current map to act on, so hide rather than leave a dead tap.
        const hasCurrentMap = S.mode === 'editor' && S.phase === 'edit';
        document.getElementById('mm-saveNew').classList.toggle('hidden', !hasCurrentMap);
        document.getElementById('mm-shareNew').classList.toggle('hidden', !hasCurrentMap);
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
        pickups: world.pickups.map(p => ({ ...p })), // MM-15
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
        pickups: world.pickups.map(p => ({ ...p })), // MM-15
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
        // MM-15: 7th planet field is the refuelStation flag (0/1) — appended
        // rather than inserted, so every pre-MM-15 share link still decodes
        // byte-for-byte identically (decode reads a missing i[6] as falsy).
        if (b.type === 'planet') arr.push([2, r(b.x), r(b.y), r(b.r), b.pal, r(b.spin), b.refuelStation ? 1 : 0]);
        else if (b.type === 'pulsar') arr.push([3, r(b.x), r(b.y)]);
        else if (b.type === 'trap') arr.push([5, r(b.x), r(b.y)]);
        else if (b.type === 'mine') arr.push([6, r(b.x), r(b.y)]);
    });
    (mapData.pickups || []).forEach(p => {
        if (p.type === 'fuel') arr.push([7, r(p.x), r(p.y)]);
        else if (p.type === 'stardust') arr.push([8, r(p.x), r(p.y)]);
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
        const pickups = [];
        let size = DEFAULT_MAP_SIZE; // maps encoded before MM-6 carry no size tag — default small

        arr.forEach(i => {
            if (i[0] === 0) teeRock = { x: i[1], y: i[2], r: 3.4, m: 8, type: 'tee' };
            else if (i[0] === 1) blackHole = { x: i[1], y: i[2], r: 3.2, m: 230, type: 'hole' };
            else if (i[0] === 2) bodies.push({ x: i[1], y: i[2], r: i[3], m: i[3]*i[3], type: 'planet', pal: i[4], spin: i[5], refuelStation: !!i[6] });
            else if (i[0] === 3) bodies.push({ x: i[1], y: i[2], r: 2.6, m: -160, type: 'pulsar' });
            else if (i[0] === 4) size = i[1] === 1 ? 'large' : DEFAULT_MAP_SIZE;
            else if (i[0] === 5) bodies.push({ x: i[1], y: i[2], r: 2.8, m: 200, type: 'trap' });
            else if (i[0] === 6) bodies.push({ x: i[1], y: i[2], r: 2, m: 0, type: 'mine' });
            else if (i[0] === 7) pickups.push({ x: i[1], y: i[2], r: 1.8, type: 'fuel' });
            else if (i[0] === 8) pickups.push({ x: i[1], y: i[2], r: 1.2, type: 'stardust' });
        });

        if (!teeRock || !blackHole) return null;
        return { teeRock, blackHole, bodies, size, pickups };
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
        pickups: world.pickups.map(p => ({ ...p })), // MM-15
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

// "✎ Edit" — unconditionally enters editor mode with this map, rather than
// assuming (as it used to) that the caller is already mid-edit: the My Maps
// drawer is now reachable from the main menu's top-level "📂 My Maps" entry too,
// not just editorBar's, so this can't rely on ambient editor state anymore.
function loadMap(index) {
    const maps = getMaps();
    const m = maps[index];
    if (!m) return;

    S.mode = 'editor';
    S.phase = 'edit';
    world.editorBackup = null;

    world.bodies = m.bodies;
    world.teeRock = m.teeRock;
    world.blackHole = m.blackHole;
    world.mapSizeKey = m.size === 'large' ? 'large' : DEFAULT_MAP_SIZE;
    world.pickups = m.pickups || []; // MM-15: pre-MM-15 saved maps carry no pickups field
    world.asteroids = []; // Map Maker doesn't author asteroids — never carry a stale swarm in
    selected = null;

    // Re-link teeRock in bodies
    world.bodies = world.bodies.filter(b => b.type !== 'tee');
    world.bodies.push(world.teeRock);

    resetComet();

    document.getElementById('bar').classList.add('hidden');
    document.getElementById('exploreBar').classList.add('hidden');
    document.getElementById('customBar').classList.add('hidden');
    document.getElementById('howto').classList.add('hidden');
    document.getElementById('scorecard').classList.add('hidden');
    document.getElementById('editorBar').classList.remove('hidden');
    document.getElementById('ed-test').textContent = '▶ Test Play';
    document.getElementById('ed-test').classList.remove('active');
    document.querySelectorAll('.ed-tools').forEach(el => el.classList.remove('disabled'));

    hooks.bar(); // refreshes editor chrome gated on mapSizeKey (e.g. MM-16's Overview button)
    hooks.toast('📂 Map loaded');
    toggleMapsDrawer();
}

// MM-11: play a saved map end-to-end (custom mode's rest phase) without detouring
// through the 1:1 editor first. gameplay.js's startCustomMap already does everything
// a shared-link arrival does — hides editor/explore chrome, shows customBar, sets
// S.mode='custom'/S.phase='rest' — so this is just the drawer's own hand-off to it.
function playMap(index) {
    const maps = getMaps();
    const m = maps[index];
    if (!m) return;

    // Stop test if we were in it (mirrors loadMap's defensive guard).
    if (S.phase === 'rest' || S.phase === 'aiming' || S.phase === 'orbit' || S.phase === 'flight' || S.phase === 'sink') {
        stopTest();
    }

    startCustomMap(m);
    toggleMapsDrawer(); // close the drawer, revealing the now-playable map underneath
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
        playBtn.textContent = '▶ Play';
        playBtn.onclick = () => playMap(idx);

        const editBtn = document.createElement('button');
        editBtn.textContent = '✎ Edit';
        editBtn.onclick = () => loadMap(idx);

        const renameBtn = document.createElement('button');
        renameBtn.textContent = '✏️ Rename';
        renameBtn.onclick = () => renameMap(idx);

        const shareBtn = document.createElement('button');
        shareBtn.textContent = '🔗 Share';
        shareBtn.onclick = () => shareMap(idx);

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑';
        delBtn.onclick = () => deleteMap(idx);

        actions.appendChild(playBtn);
        actions.appendChild(editBtn);
        actions.appendChild(renameBtn);
        actions.appendChild(shareBtn);
        actions.appendChild(delBtn);
        
        item.appendChild(nameSpan);
        item.appendChild(actions);
        list.appendChild(item);
    });
}
