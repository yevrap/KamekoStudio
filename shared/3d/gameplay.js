import { state, domElements, engineState } from './state.js';
import { PLAYER_SPEED, PLAYER_HEIGHT, PLAYER_RADIUS, INTERACTION_DISTANCE, ARCADE_GAMES } from './constants.js';
import { isTouchDevice } from './controls.js';

function createGridTexture(colorStr) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    context.fillStyle = '#020208'; 
    context.fillRect(0, 0, 512, 512);
    
    context.strokeStyle = colorStr;
    context.lineWidth = 4;
    context.shadowBlur = 15;
    context.shadowColor = colorStr;
    
    context.beginPath();
    for (let i = 0; i <= 512; i += 64) {
        context.moveTo(i, 0);
        context.lineTo(i, 512);
        context.moveTo(0, i);
        context.lineTo(512, i);
    }
    context.stroke();
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

export function createEnvironment() {
    const roomWidth = 18; 
    const roomDepth = 24; 
    const roomHeight = 6; 
    const wallThickness = 0.5;

    // Floor
    const floorTexture = createGridTexture('#00ffff');
    floorTexture.repeat.set(roomWidth / 4, roomDepth / 4);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: floorTexture, 
        roughness: 0.1, 
        metalness: 0.8,
        emissive: 0x001111 
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), floorMaterial);
    floor.rotation.x = -Math.PI / 2; 
    floor.receiveShadow = true; 
    engineState.scene.add(floor);

    // Walls
    const wallTexture = createGridTexture('#ff00ff');
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        map: wallTexture, 
        roughness: 0.4, 
        metalness: 0.6,
        emissive: 0x110011
    });

    function createWall(w,h,d,x,y,z, repeatX){
        const mat = wallMaterial.clone();
        mat.map = wallMaterial.map.clone();
        mat.map.repeat.set(repeatX / 4, roomHeight / 4);
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
        wall.position.set(x,y,z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        engineState.scene.add(wall);
        engineState.walls.push(new THREE.Box3().setFromObject(wall));
    }

    createWall(roomWidth+wallThickness,roomHeight,wallThickness,0,roomHeight/2,-roomDepth/2, roomWidth);
    createWall(roomWidth+wallThickness,roomHeight,wallThickness,0,roomHeight/2,roomDepth/2, roomWidth);
    createWall(wallThickness,roomHeight,roomDepth,-roomWidth/2,roomHeight/2,0, roomDepth);
    createWall(wallThickness,roomHeight,roomDepth,roomWidth/2,roomHeight/2,0, roomDepth);

    // Ceiling
    const ceilingTexture = createGridTexture('#8800ff');
    ceilingTexture.repeat.set(roomWidth / 4, roomDepth / 4);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        map: ceilingTexture,
        side: THREE.DoubleSide,
        roughness: 0.9,
        metalness: 0.2
    });
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth,roomDepth), ceilingMaterial);
    ceiling.position.y = roomHeight;
    ceiling.rotation.x = Math.PI/2;
    engineState.scene.add(ceiling);

    // Spawning Portals
    const leftPositions = [
        new THREE.Vector3(-roomWidth/2 + 1.2, 2.5, -roomDepth/4),
        new THREE.Vector3(-roomWidth/2 + 1.2, 2.5, 0),
        new THREE.Vector3(-roomWidth/2 + 1.2, 2.5, roomDepth/4)
    ];
    const rightPositions = [
        new THREE.Vector3(roomWidth/2 - 1.2, 2.5, -roomDepth/4),
        new THREE.Vector3(roomWidth/2 - 1.2, 2.5, 0),
        new THREE.Vector3(roomWidth/2 - 1.2, 2.5, roomDepth/4)
    ];
    const backPositions = [
        new THREE.Vector3(-roomWidth/4, 2.5, -roomDepth/2 + 1.2),
        new THREE.Vector3(0, 2.5, -roomDepth/2 + 1.2),
        new THREE.Vector3(roomWidth/4, 2.5, -roomDepth/2 + 1.2)
    ];
    const positions = [...leftPositions, ...rightPositions, ...backPositions];
    const rotations = [
        ...leftPositions.map(() => Math.PI/2),
        ...rightPositions.map(() => -Math.PI/2),
        ...backPositions.map(() => 0)
    ];

    ARCADE_GAMES.forEach((game, index) => {
        if (!positions[index]) return; 
        const portalGroup = new THREE.Group();
        portalGroup.position.copy(positions[index]);
        portalGroup.rotation.y = rotations[index];
        portalGroup.userData = { game: game }; 

        const ringGeo = new THREE.TorusGeometry(1, 0.1, 16, 64);
        const ringMat = new THREE.MeshStandardMaterial({
            color: game.color,
            emissive: game.color,
            emissiveIntensity: 0.8,
            metalness: 0.5,
            roughness: 0.2
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        portalGroup.add(ring);

        const coreGeo = new THREE.OctahedronGeometry(0.3, 0);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: game.color,
            emissiveIntensity: 1.0,
            wireframe: true
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        portalGroup.add(core);

        const light = new THREE.PointLight(game.color, 1.2, 10);
        portalGroup.add(light);

        engineState.scene.add(portalGroup);
        engineState.portals.push(portalGroup);
    });

    spawnTrophies();
}

function spawnTrophies() {
    const shelfWidth = 10;
    const shelfDepth = 1.5;
    const shelfHeight = 0.2;
    const shelfZ = 12 - shelfDepth / 2; // Front wall
    const shelfY = 2.0;

    const shelfGeo = new THREE.BoxGeometry(shelfWidth, shelfHeight, shelfDepth);
    const shelfMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.7,
        metalness: 0.3
    });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, shelfY, shelfZ);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    engineState.scene.add(shelf);
    
    // Add shelf to walls collision so player doesn't clip through the base wall under it
    engineState.walls.push(new THREE.Box3().setFromObject(shelf));

    const achievements = [];

    const blobScore = parseInt(localStorage.getItem('blobZapperHighScore') || '0', 10);
    if (blobScore > 0) 
        achievements.push({ type: 'blob', color: 0xff0000, desc: `Blob Zapper High Score: ${blobScore}` });

    const riverScore = parseInt(localStorage.getItem('riverRunHighScore') || '0', 10);
    if (riverScore > 0) 
        achievements.push({ type: 'boat', color: 0x0088ff, desc: `River Run High Score: ${riverScore}` });

    const alchScore = parseInt(localStorage.getItem('alchemistHighScore') || '0', 10);
    if (alchScore > 0) 
        achievements.push({ type: 'potion', color: 0x00ff00, desc: `Durak Alchemist High Score: ${alchScore}` });

    const ddWins = parseInt(localStorage.getItem('durakDungeon_victories') || '0', 10);
    if (ddWins > 0) 
        achievements.push({ type: 'crown', color: 0xaa00ff, desc: `Durak Dungeon Victories: ${ddWins}` });

    const dtWins = parseInt(localStorage.getItem('durakTactics_victories') || '0', 10);
    if (dtWins > 0) 
        achievements.push({ type: 'sword', color: 0x00ffff, desc: `Durak Tactics Victories: ${dtWins}` });

    if (achievements.length === 0) return;

    const spacing = shelfWidth / (achievements.length + 1);
    let startX = -shelfWidth / 2 + spacing;

    achievements.forEach((ach) => {
        const trophyGroup = new THREE.Group();
        trophyGroup.position.set(startX, shelfY + 0.5, shelfZ);
        trophyGroup.userData = { isTrophy: true, description: ach.desc };

        let mesh;
        const mat = new THREE.MeshStandardMaterial({
            color: ach.color,
            emissive: ach.color,
            emissiveIntensity: 0.6,
            metalness: 0.8,
            roughness: 0.2
        });

        if (ach.type === 'coin') {
            mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), mat);
            mesh.rotation.x = Math.PI / 2;
        } else if (ach.type === 'blob') {
            mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), mat);
        } else if (ach.type === 'boat') {
            mesh = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 4), mat);
        } else if (ach.type === 'potion') {
            const group = new THREE.Group();
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8), mat);
            const top = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat);
            top.position.y = 0.3;
            group.add(base);
            group.add(top);
            mesh = group;
        } else if (ach.type === 'crown') {
            mesh = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 5), mat);
            mesh.rotation.x = Math.PI / 2;
        } else if (ach.type === 'sword') {
            mesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), mat);
            const cross = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), mat);
            cross.position.y = -0.2;
            mesh.add(cross);
        }

        if (mesh) {
            mesh.castShadow = true;
            trophyGroup.add(mesh);
        }

        const light = new THREE.PointLight(ach.color, 0.5, 3);
        light.position.y = 0.5;
        trophyGroup.add(light);

        engineState.scene.add(trophyGroup);
        engineState.trophies.push(trophyGroup);

        startX += spacing;
    });
}

export function updatePlayer(deltaTime) {
    engineState.time += deltaTime;

    const moveSpeed = PLAYER_SPEED * deltaTime;
    let moveDirection = new THREE.Vector3();

    if (state.keysPressed['w'] || state.keysPressed['arrowup']) moveDirection.z = -1;
    if (state.keysPressed['s'] || state.keysPressed['arrowdown']) moveDirection.z = 1;
    if (state.keysPressed['a'] || state.keysPressed['arrowleft']) moveDirection.x = -1;
    if (state.keysPressed['d'] || state.keysPressed['arrowright']) moveDirection.x = 1;

    if (state.movementInput.y !== 0) moveDirection.z = state.movementInput.y;
    if (state.movementInput.x !== 0) moveDirection.x = state.movementInput.x;

    if (moveDirection.lengthSq() > 0) moveDirection.normalize();

    const worldMoveDelta = moveDirection.clone().multiplyScalar(moveSpeed).applyEuler(engineState.player.rotation);
    const nextPosition = engineState.player.position.clone().add(worldMoveDelta);

    const playerCollider = new THREE.Box3(
        new THREE.Vector3(nextPosition.x - PLAYER_RADIUS, nextPosition.y, nextPosition.z - PLAYER_RADIUS),
        new THREE.Vector3(nextPosition.x + PLAYER_RADIUS, nextPosition.y + PLAYER_HEIGHT, nextPosition.z + PLAYER_RADIUS)
    );
    
    let collision = false;
    for (const wallBox of engineState.walls) {
        if (playerCollider.intersectsBox(wallBox)) {
            collision = true;
            break;
        }
    }
    
    if (!collision) {
        engineState.player.position.copy(nextPosition);
    } else {
        let tempPos = engineState.player.position.clone();
        tempPos.x += worldMoveDelta.x;
        let playerColliderX = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(tempPos.x, tempPos.y + PLAYER_HEIGHT/2, engineState.player.position.z),
            new THREE.Vector3(PLAYER_RADIUS*2, PLAYER_HEIGHT, PLAYER_RADIUS*2)
        );
        let collisionX = false;
        for (const wallBox of engineState.walls) {
            if (playerColliderX.intersectsBox(wallBox)) {
                collisionX = true;
                break;
            }
        }
        if (!collisionX) engineState.player.position.x = tempPos.x;
        
        tempPos = engineState.player.position.clone();
        tempPos.z += worldMoveDelta.z;
        let playerColliderZ = new THREE.Box3().setFromCenterAndSize(
            new THREE.Vector3(engineState.player.position.x, tempPos.y + PLAYER_HEIGHT/2, tempPos.z),
            new THREE.Vector3(PLAYER_RADIUS*2, PLAYER_HEIGHT, PLAYER_RADIUS*2)
        );
        let collisionZ = false;
        for (const wallBox of engineState.walls) {
            if (playerColliderZ.intersectsBox(wallBox)) {
                collisionZ = true;
                break;
            }
        }
        if (!collisionZ) engineState.player.position.z = tempPos.z;
    }

    let closestPortal = null;
    let closestTrophy = null;
    let minDistance = INTERACTION_DISTANCE;
    let minTrophyDistance = INTERACTION_DISTANCE;

    for (const portal of engineState.portals) {
        portal.children[0].rotation.z += deltaTime * 1.5;
        portal.children[1].rotation.y -= deltaTime * 2.0;
        portal.children[1].rotation.x += deltaTime * 1.0;

        // Calculate 2D distance (ignore Y axis)
        const dx = engineState.player.position.x - portal.position.x;
        const dz = engineState.player.position.z - portal.position.z;
        const distance = Math.hypot(dx, dz);
        
        if (distance < minDistance) {
            minDistance = distance;
            closestPortal = portal;
        }
    }

    engineState.trophies.forEach((trophy, i) => {
        trophy.rotation.y += deltaTime;
        trophy.position.y = 2.5 + Math.sin(engineState.time * 2 + i) * 0.1;
        
        // Calculate 2D distance for trophies too
        const dx = engineState.player.position.x - trophy.position.x;
        const dz = engineState.player.position.z - trophy.position.z;
        const distance = Math.hypot(dx, dz);
        
        if (distance < minTrophyDistance) {
            minTrophyDistance = distance;
            closestTrophy = trophy;
        }
    });

    if (closestPortal) {
        state.currentActivePortal = closestPortal.userData.game;
        const btn = isTouchDevice ? 'ACT' : 'E';
        domElements.interactionPrompt.textContent = `Press ${btn} to enter ${state.currentActivePortal.name}`;
        domElements.interactionPrompt.style.display = 'block';
    } else if (closestTrophy) {
        state.currentActivePortal = null;
        domElements.interactionPrompt.textContent = `🏆 ${closestTrophy.userData.description}`;
        domElements.interactionPrompt.style.display = 'block';
    } else {
        state.currentActivePortal = null;
        domElements.interactionPrompt.style.display = 'none';
    }
}
