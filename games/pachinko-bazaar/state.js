import { BASE_DROPS, START_COINS, quotaFor } from './constants.js';

export const state = {
    mode: 'howto', // howto | aim | drop | shop | over
    paused: false,
    round: 1,
    quota: quotaFor(1),
    roundScore: 0,
    runScore: 0,
    drops: BASE_DROPS,
    coins: START_COINS,
    owned: {}, // itemId -> true
    pegs: [],
    orbs: [],
    particles: [],
    floats: [],
    dropMult: 1,
    dropSplitUsed: false,
    launchX: 200,
    aiming: false,
    shopStock: [],
    slowMo: 0,
    shake: 0
};
