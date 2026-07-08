import { state, domElements, engineState } from './state.js';
import { PLAYER_SPEED, PLAYER_HEIGHT, PLAYER_RADIUS, INTERACTION_DISTANCE } from './constants.js';

export function createEnvironment() {
    const roomWidth = 18; 
    const roomDepth = 24; 
    const roomHeight = 6; 
    const wallThickness = 0.5;

    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x455A64, roughness: 0.8, metalness: 0.2 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomDepth), floorMaterial);
    floor.rotation.x = -Math.PI / 2; 
    floor.receiveShadow = true; 
    engineState.scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x607D8B, roughness: 0.7, metalness: 0.1 });
    function createWall(w,h,d,x,y,z){
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), wallMaterial);
        wall.position.set(x,y,z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        engineState.scene.add(wall);
        engineState.walls.push(new THREE.Box3().setFromObject(wall));
    }

    createWall(roomWidth+wallThickness,roomHeight,wallThickness,0,roomHeight/2,-roomDepth/2);
    createWall(roomWidth+wallThickness,roomHeight,wallThickness,0,roomHeight/2,roomDepth/2);
    createWall(wallThickness,roomHeight,roomDepth,-roomWidth/2,roomHeight/2,0);
    createWall(wallThickness,roomHeight,roomDepth,roomWidth/2,roomHeight/2,0);

    const ceilingMaterial = new THREE.MeshStandardMaterial({color:0x546E7A,side:THREE.DoubleSide,roughness:0.9});
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth,roomDepth), ceilingMaterial);
    ceiling.position.y = roomHeight;
    ceiling.rotation.x = Math.PI/2;
    engineState.scene.add(ceiling);

    const activatorGeometry = new THREE.OctahedronGeometry(0.7, 0);
    const activatorMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ccff,
        emissive: 0x0077aa,
        metalness: 0.4,
        roughness: 0.3,
        transparent: true,
        opacity: 0.85
    });
    engineState.menuActivatorMesh = new THREE.Mesh(activatorGeometry, activatorMaterial);
    engineState.menuActivatorMesh.position.set(0, 1.0, -roomDepth/2 + wallThickness + 1.2);
    engineState.menuActivatorMesh.castShadow = true;
    engineState.scene.add(engineState.menuActivatorMesh);

    const activatorLight = new THREE.PointLight(0x00ccff, 1, 7);
    activatorLight.position.copy(engineState.menuActivatorMesh.position);
    activatorLight.position.y += 0.2;
    engineState.scene.add(activatorLight);
}

export function updatePlayer(deltaTime) {
    if (state.menuOpen) {
        state.movementInput = { x: 0, y: 0 };
        state.keysPressed = {};
        return;
    }

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

    const distanceToActivator = engineState.player.position.distanceTo(engineState.menuActivatorMesh.position);
    if (distanceToActivator < INTERACTION_DISTANCE && !state.menuOpen) {
        state.canInteract = true;
        domElements.interactionPrompt.style.display = 'block';
    } else {
        state.canInteract = false;
        domElements.interactionPrompt.style.display = 'none';
    }

    if (engineState.menuActivatorMesh) {
        engineState.time += deltaTime;
        engineState.menuActivatorMesh.rotation.y = engineState.time * 0.5;
        engineState.menuActivatorMesh.position.y = 1.0 + Math.sin(engineState.time * 1.5) * 0.1;
    }
}
