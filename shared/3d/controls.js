import { state, domElements, engineState } from './state.js';
import { 
    VIRTUAL_JOYSTICK_RADIUS, 
    VIRTUAL_JOYSTICK_MAX_TRAVEL, 
    VIRTUAL_JOYSTICK_DEADZONE,
    LOOK_SENSITIVITY,
    LOOK_FRICTION 
} from './constants.js';

export const isTouchDevice = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

export function setupControls() {
    if (isTouchDevice) {
        domElements.interactButtonTouch.style.display = 'flex';
        const controlsInfo = document.getElementById('controls-info');
        if(controlsInfo) controlsInfo.style.display = 'none';

        const canvas = engineState.renderer.domElement;
        
        canvas.style.touchAction = 'none';
        
        canvas.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);

        domElements.interactButtonTouch.addEventListener('click', () => {
            if (state.currentActivePortal) window.location.href = state.currentActivePortal.url;
        });
    } else {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        document.addEventListener('pointerlockchange', onPointerLockChange);
        engineState.renderer.domElement.addEventListener('click', () => {
            if (!document.pointerLockElement) {
                engineState.renderer.domElement.requestPointerLock();
            }
        });
    }
}

function handlePointerDown(e) {
    engineState.renderer.domElement.setPointerCapture(e.pointerId);

    if (e.clientX < window.innerWidth / 2) {
        if (state.currentMovePointerId === null) {
            state.currentMovePointerId = e.pointerId;
            state.movePointerStartX = e.clientX;
            state.movePointerStartY = e.clientY;

            domElements.joystickBase.style.left = `${e.clientX - VIRTUAL_JOYSTICK_RADIUS}px`;
            domElements.joystickBase.style.top = `${e.clientY - VIRTUAL_JOYSTICK_RADIUS}px`;
            domElements.joystickBase.style.display = 'flex';
            domElements.joystickHandle.style.transform = 'translate(0px, 0px)';
            state.movementInput = { x: 0, y: 0 };
        }
    } else {
        if (state.currentLookPointerId === null) {
            state.currentLookPointerId = e.pointerId;
            state.lookPointerStartX = e.clientX;
            state.lookPointerStartY = e.clientY;
            state.cameraVelocity = { x: 0, y: 0 };
        }
    }
}

function handlePointerMove(e) {
    if (e.pointerId === state.currentMovePointerId) {
        let deltaX = e.clientX - state.movePointerStartX;
        let deltaY = e.clientY - state.movePointerStartY;

        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        let stickX = deltaX;
        let stickY = deltaY;

        if (distance > VIRTUAL_JOYSTICK_MAX_TRAVEL) {
            stickX = (deltaX / distance) * VIRTUAL_JOYSTICK_MAX_TRAVEL;
            stickY = (deltaY / distance) * VIRTUAL_JOYSTICK_MAX_TRAVEL;
        }

        domElements.joystickHandle.style.transform = `translate(${stickX}px, ${stickY}px)`;

        if (distance > VIRTUAL_JOYSTICK_DEADZONE) {
            const normalizedDist = Math.min(1, (distance - VIRTUAL_JOYSTICK_DEADZONE) / (VIRTUAL_JOYSTICK_MAX_TRAVEL - VIRTUAL_JOYSTICK_DEADZONE));
            const easedOutput = normalizedDist * normalizedDist; 
            
            const dirX = deltaX / distance;
            const dirY = deltaY / distance;

            state.movementInput.x = dirX * easedOutput;
            state.movementInput.y = -dirY * easedOutput;
        } else {
            state.movementInput.x = 0;
            state.movementInput.y = 0;
        }

    } else if (e.pointerId === state.currentLookPointerId) {
        const deltaX = e.clientX - state.lookPointerStartX;
        const deltaY = e.clientY - state.lookPointerStartY;

        engineState.player.rotation.y -= deltaX * LOOK_SENSITIVITY;
        engineState.camera.rotation.x -= deltaY * LOOK_SENSITIVITY;
        engineState.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, engineState.camera.rotation.x));

        state.cameraVelocity.x = -deltaX * LOOK_SENSITIVITY;
        state.cameraVelocity.y = -deltaY * LOOK_SENSITIVITY;

        state.lookPointerStartX = e.clientX;
        state.lookPointerStartY = e.clientY;
    }
}

function handlePointerUp(e) {
    if (e.pointerId === state.currentMovePointerId) {
        state.currentMovePointerId = null;
        state.movementInput = { x: 0, y: 0 };
        domElements.joystickBase.style.display = 'none';
        try {
            engineState.renderer.domElement.releasePointerCapture(e.pointerId);
        } catch(err) {}
    } else if (e.pointerId === state.currentLookPointerId) {
        state.currentLookPointerId = null;
        try {
            engineState.renderer.domElement.releasePointerCapture(e.pointerId);
        } catch(err) {}
    }
}

export function applyLookInertia() {
    if (state.currentLookPointerId === null && (Math.abs(state.cameraVelocity.x) > 0.0001 || Math.abs(state.cameraVelocity.y) > 0.0001)) {
        engineState.player.rotation.y += state.cameraVelocity.x;
        engineState.camera.rotation.x += state.cameraVelocity.y;
        engineState.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, engineState.camera.rotation.x));
        
        state.cameraVelocity.x *= LOOK_FRICTION;
        state.cameraVelocity.y *= LOOK_FRICTION;
    }
}

function onKeyDown(event) {
    state.keysPressed[event.key.toLowerCase()] = true;
    if (event.key.toLowerCase() === 'e' && state.currentActivePortal) {
        window.location.href = state.currentActivePortal.url;
    } else if (event.key.toLowerCase() === 'escape') {
        if (document.pointerLockElement) document.exitPointerLock();
    }
}

function onKeyUp(event) {
    state.keysPressed[event.key.toLowerCase()] = false;
}

let isPointerLocked = false;
function onPointerLockChange() {
    if (document.pointerLockElement === engineState.renderer.domElement) {
        document.addEventListener("mousemove", onMouseMove, false);
        isPointerLocked = true;
    } else {
        document.removeEventListener("mousemove", onMouseMove, false);
        isPointerLocked = false;
    }
}

function onMouseMove(event) {
    if (!isPointerLocked) return;
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    engineState.player.rotation.y -= movementX * 0.002;
    engineState.camera.rotation.x -= movementY * 0.002;
    engineState.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, engineState.camera.rotation.x));
}
