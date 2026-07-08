export const state = {
    keysPressed: {},
    currentActivePortal: null, // Holds the reference to the game object if near one
    
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
    portals: [], // Array of portal meshes
    clock: null,
    time: 0
};
