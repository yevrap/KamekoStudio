import { ROUND_DURATION } from './constants.js';

export const state = {
    gameObjects: [],
    targetItem: null,
    isRoundOver: false,
    lastClickTime: 0,
    animationFrameId: null,
    objectFindStartTime: 0,
    currentScreen: 'main',
    currentRoundNumber: 0,
    roundTimeLeft: ROUND_DURATION,
    roundIntervalId: null,
    lastFrameTime: 0, // For delta time calculation
};

// DOM element references, populated by main.js on DOMContentLoaded
export const dom = {};
