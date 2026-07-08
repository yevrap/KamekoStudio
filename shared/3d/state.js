export const state = {
    keysPressed: {},
    canInteract: false,
    menuOpen: false,
    
    // Mobile controls state
    currentMovePointerId: null,
    movePointerStartX: 0,
    movePointerStartY: 0,
    movementInput: { x: 0, y: 0 },
    
    currentLookPointerId: null,
    lookPointerStartX: 0,
    lookPointerStartY: 0,
    
    // Inertia state
    cameraVelocity: { x: 0, y: 0 }
};

export const domElements = {
    menu: null,
    interactionPrompt: null,
    sceneContainer: null,
    interactButtonTouch: null,
    joystickBase: null,
    joystickHandle: null
};

export const engineState = {
    scene: null,
    camera: null,
    renderer: null,
    player: null,
    walls: [],
    menuActivatorMesh: null,
    clock: null,
    time: 0
};
