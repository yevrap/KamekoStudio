export const state = {
    // Dynamic sizes recalculated on resize
    minBlobRadius: undefined,
    maxBlobRadius: undefined,
    blobSpeed: undefined,
    touchRepulsionRadius: undefined,
    tendrilMaxDist: undefined,
    destructionZoneRadius: undefined,
    destructionZoneSpeed: undefined,

    blobs: [],
    touchPoints: [],
    destructionZone: { x: 0, y: 0, radius: 0, vx: 0, vy: 0 },
    particles: [],
    shakeIntensity: 0,

    score: 0,
    highScore: parseInt(localStorage.getItem('blobZapperHighScore') || '0', 10),
    comboCount: 0,
    comboMultiplier: 1,
    lastZapTime: -Infinity,
    comboFlashIntensity: 0,
    isNewBest: false,

    autoPlayTarget: null,
    autoPlayLastZap: 0,
    autoPlayLockTime: 0,
    autoPlayLaser: null,

    isGameOver: false,
    animationFrameId: null,
    lastTime: 0,
};

// DOM element references, populated by main.js
export const dom = {};
