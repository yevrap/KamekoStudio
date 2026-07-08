import { state, domElements, engineState } from './state.js';
import { PLAYER_HEIGHT } from './constants.js';
import { createEnvironment, updatePlayer } from './gameplay.js';
import { setupControls, applyLookInertia, hideMenu } from './controls.js';

function init() {
    domElements.menu = document.getElementById('menu');
    domElements.interactionPrompt = document.getElementById('interaction-prompt');
    domElements.sceneContainer = document.getElementById('scene-container');
    domElements.interactButtonTouch = document.getElementById('interact-button-touch');
    domElements.joystickBase = document.getElementById('dynamic-joystick-base');
    domElements.joystickHandle = document.getElementById('dynamic-joystick-handle');

    engineState.clock = new THREE.Clock();

    engineState.scene = new THREE.Scene();
    engineState.scene.background = new THREE.Color(0x1a1a2e);
    engineState.scene.fog = new THREE.Fog(0x1a1a2e, 12, 35);

    engineState.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    engineState.camera.position.set(0, PLAYER_HEIGHT, 0);

    engineState.renderer = new THREE.WebGLRenderer({ antialias: true });
    engineState.renderer.setSize(window.innerWidth, window.innerHeight);
    engineState.renderer.setPixelRatio(window.devicePixelRatio);
    engineState.renderer.shadowMap.enabled = true;
    domElements.sceneContainer.appendChild(engineState.renderer.domElement);

    engineState.player = new THREE.Group();
    engineState.player.position.set(0, 0, 5);
    engineState.player.add(engineState.camera);
    engineState.scene.add(engineState.player);

    const ambientLight = new THREE.AmbientLight(0x708090, 0.8);
    engineState.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xe0e0ff, 1.0);
    directionalLight.position.set(10, 18, 12);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 60;
    engineState.scene.add(directionalLight);

    createEnvironment();
    setupControls();

    window.addEventListener('resize', onWindowResize);

    const closeBtn = document.querySelector('.close-button');
    if (closeBtn) {
        closeBtn.addEventListener('click', hideMenu);
    }

    animate();
}

function onWindowResize() {
    engineState.camera.aspect = window.innerWidth / window.innerHeight;
    engineState.camera.updateProjectionMatrix();
    engineState.renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = engineState.clock.getDelta();
    applyLookInertia();
    updatePlayer(deltaTime);
    engineState.renderer.render(engineState.scene, engineState.camera);
}

// Start everything once DOM is ready
window.addEventListener('DOMContentLoaded', init);
