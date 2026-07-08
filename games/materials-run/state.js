import { DANGER_ZONE_SIZE } from './constants.js';

export const state = {
    gridData: [],
    playerPos: { x: 0, y: 0 },
    playerVel: { x: 0, y: 0 },
    playerRotation: 0,
    activePins: [], // Array to store {id, x, y, creationTime, element}
    nextPinId: 0,
    targetPos: null, // Average of active pins
    cellSize: 30,
    playerSize: 0,
    enemySize: 0,
    gridPixelWidth: 0,
    gridPixelHeight: 0,
    lastTimestamp: 0,
    score: 0,
    targetTile: { x: null, y: null },
    currentTargetElement: null,
    bullets: [],
    nextBulletId: 0,
    lastShotTime: 0,
    gameState: 'menu', // 'menu', 'playing', 'gameover', 'won'
    currentGameMode: 'score', // 'score', 'survival'
    dangerZone: { x: null, y: null, size: DANGER_ZONE_SIZE },
    dangerZoneCells: [],
    isDangerZoneActive: false,
    timePlayerInDangerZone: 0,
    nextDangerZoneAppearTime: 0,
    dangerZoneEndTime: 0,
    enemies: [],
    nextEnemyId: 0,
    gameStartTime: 0, // For survival timer
    animationFrameId: null, // To control game loop
};

// DOM element references, populated by main.js on DOMContentLoaded
export const dom = {};
