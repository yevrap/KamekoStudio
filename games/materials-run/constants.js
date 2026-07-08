export const GRID_SIZE = 20;
export const ZONE_SIZE = 5;
export const MATERIALS = { GRASS: 'grass', WATER: 'water', ICE: 'ice', SAND: 'sand' };
export const MATERIAL_TYPES = Object.values(MATERIALS);

export const BASE_ACCELERATION = 300;
export const BASE_FRICTION = 0.9;
export const MAX_SPEED = 200;
export const PHYSICS_MODIFIERS = {
    [MATERIALS.GRASS]: { acceleration: 1.0, friction: 1.0 },
    [MATERIALS.WATER]: { acceleration: 0.5, friction: 0.5 },
    [MATERIALS.ICE]:   { acceleration: 1.0, friction: 6.0 },
    [MATERIALS.SAND]:  { acceleration: 0.6, friction: 0.6 },
};
export const ACCELERATION_THRESHOLD = 2;
export const ROTATION_FACTOR = 0.8;
export const PIN_LIFESPAN = 5000; // Lifespan of movement pins in milliseconds (5 seconds)

export const SHOOTING_RANGE = 150;
export const SHOOTING_INTERVAL = 200;
export const BULLET_SPEED = 300;
export const MIN_SPEED_TO_SHOOT = 20;
export const DANGER_ZONE_SIZE = 3;
export const DANGER_ZONE_APPEAR_INTERVAL = 10000;
export const DANGER_ZONE_DURATION = 7000;
export const DANGER_ZONE_GRACE_PERIOD = 500;
export const ENEMY_COUNT = 3;
export const ENEMY_SPEED = 50;
export const ENEMY_MOVE_INTERVAL = 1500;
export const SURVIVAL_DURATION = 180000; // 3 minutes in milliseconds

export const TOP_SCORE_SCORE_KEY = 'gridGameTopScoreScore';
export const TOP_SCORE_SURVIVAL_KEY = 'gridGameTopScoreSurvival';

export function isInBounds(x, y) {
    return x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;
}

export function formatTime(ms) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
