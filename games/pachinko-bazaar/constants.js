export const BW = 400, BH = 580;               // logical board size
export const G = 1500;                          // gravity px/s^2
export const REST_PEG = 0.48, REST_WALL = 0.5;
export const MAX_SPEED = 1100;
export const ORB_R = 8, PEG_R = 7;
export const STEP = 1 / 120;
export const WALL = 12;                         // side wall thickness
export const BUCKET_TOP = BH - 100;
export const DIVIDERS = [80, 160, 240, 320];    // divider center x
export const BUCKET_MULTS = [1, 2, 5, 2, 1];
export const BASE_DROPS = 5;
export const START_COINS = 4;

export const QUOTAS = [800, 1160, 1680, 2440, 3540, 5130, 7440, 10790, 15650, 22690];
export const quotaFor = r => r <= QUOTAS.length ? QUOTAS[r - 1] : Math.round(QUOTAS[QUOTAS.length - 1] * Math.pow(1.45, r - QUOTAS.length) / 10) * 10;

export const ITEMS = [
    { id: 'heavy',   emoji: '🪨', name: 'Heavy Orb',    desc: 'Every bucket multiplier +1', price: 4 },
    { id: 'magnet',  emoji: '🧲', name: 'Magnet',       desc: 'Pegs gently pull your orb in', price: 5 },
    { id: 'split',   emoji: '🫧', name: 'Split Orb',    desc: 'First gold peg each drop splits your orb', price: 6 },
    { id: 'golden',  emoji: '🥇', name: 'Golden Touch', desc: 'Gold pegs score double', price: 5 },
    { id: 'extra',   emoji: '➕', name: 'Extra Orb',    desc: '+1 orb every round', price: 7 },
    { id: 'bouncy',  emoji: '🎈', name: 'Bouncy',       desc: 'Extra bounce — more pegs per drop', price: 4 },
    { id: 'coinx2',  emoji: '💰', name: 'Coin Doubler', desc: 'Coin pegs pay ×2', price: 4 },
    { id: 'ghost',   emoji: '👻', name: 'Ghost Orb',    desc: 'Passes through the first peg it hits each drop', price: 5 },
    { id: 'upgrade', emoji: '✨', name: 'Peg Upgrader', desc: 'First blue peg hit turns gold forever', price: 6 },
];
