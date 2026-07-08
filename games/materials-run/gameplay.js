import {
    GRID_SIZE, ZONE_SIZE, MATERIALS, MATERIAL_TYPES,
    BASE_ACCELERATION, BASE_FRICTION, MAX_SPEED, PHYSICS_MODIFIERS,
    ACCELERATION_THRESHOLD, ROTATION_FACTOR, PIN_LIFESPAN,
    SHOOTING_RANGE, SHOOTING_INTERVAL, BULLET_SPEED, MIN_SPEED_TO_SHOOT,
    DANGER_ZONE_SIZE, DANGER_ZONE_APPEAR_INTERVAL, DANGER_ZONE_DURATION, DANGER_ZONE_GRACE_PERIOD,
    ENEMY_COUNT, ENEMY_SPEED, ENEMY_MOVE_INTERVAL, SURVIVAL_DURATION,
    TOP_SCORE_SCORE_KEY, TOP_SCORE_SURVIVAL_KEY,
    isInBounds, formatTime,
} from './constants.js';
import { state, dom } from './state.js';

function getMaterialAtPixel(px, py) {
    const gridX = Math.floor(px / state.cellSize);
    const gridY = Math.floor(py / state.cellSize);
    if (!isInBounds(gridX, gridY)) return null;
    if (state.gridData.length > gridY && state.gridData[gridY].length > gridX) {
        return state.gridData[gridY][gridX];
    }
    console.error(`Grid data error at (${gridX}, ${gridY})`);
    return MATERIALS.GRASS;
}

function selectNewTarget() {
    if (state.currentTargetElement) {
        state.currentTargetElement.classList.remove('blinking-target');
    }
    let newX, newY;
    const playerGridX = Math.floor((state.playerPos.x + state.playerSize / 2) / state.cellSize);
    const playerGridY = Math.floor((state.playerPos.y + state.playerSize / 2) / state.cellSize);
    do {
        newX = Math.floor(Math.random() * GRID_SIZE);
        newY = Math.floor(Math.random() * GRID_SIZE);
    } while (!isInBounds(newX, newY) || (newX === playerGridX && newY === playerGridY) || (newX === state.targetTile.x && newY === state.targetTile.y));
    state.targetTile = { x: newX, y: newY };
    state.currentTargetElement = dom.gridElement?.querySelector(`.cell[data-x="${state.targetTile.x}"][data-y="${state.targetTile.y}"]`);
    if (state.currentTargetElement) {
        state.currentTargetElement.classList.add('blinking-target');
    } else {
        console.error("Could not find DOM element for new target tile:", state.targetTile.x, state.targetTile.y);
    }
}

function activateDangerZone() {
    if (state.gameState !== 'playing') return;
    const zoneSize = DANGER_ZONE_SIZE;
    const startX = Math.floor(Math.random() * (GRID_SIZE - zoneSize + 1));
    const startY = Math.floor(Math.random() * (GRID_SIZE - zoneSize + 1));
    state.dangerZone = { x: startX, y: startY, size: zoneSize };
    state.dangerZoneCells = [];
    state.isDangerZoneActive = true;
    state.timePlayerInDangerZone = 0;
    state.dangerZoneEndTime = performance.now() + DANGER_ZONE_DURATION;
    state.nextDangerZoneAppearTime = 0;
    console.log("Danger Zone Activated at:", startX, startY);
    for (let y = startY; y < startY + zoneSize; y++) {
        for (let x = startX; x < startX + zoneSize; x++) {
            state.dangerZoneCells.push({ x, y });
            const cellElement = dom.gridElement?.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
            if (cellElement) cellElement.classList.add('danger-zone-blinking');
        }
    }
}

function deactivateDangerZone() {
    if (!state.isDangerZoneActive) return;
    console.log("Deactivating Danger Zone");
    state.isDangerZoneActive = false;
    state.dangerZoneEndTime = 0;
    state.nextDangerZoneAppearTime = performance.now() + DANGER_ZONE_APPEAR_INTERVAL;
    state.dangerZoneCells.forEach(coord => {
        const cellElement = dom.gridElement?.querySelector(`.cell[data-x="${coord.x}"][data-y="${coord.y}"]`);
        if (cellElement) cellElement.classList.remove('danger-zone-blinking');
    });
    state.dangerZoneCells = [];
}

function createEnemies() {
    dom.gridElement?.querySelectorAll('.enemy').forEach(el => el.remove());
    state.enemies = [];
    const enemySizeRatio = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--enemy-size-ratio') || '0.6');
    state.enemySize = state.cellSize * enemySizeRatio;
    for (let i = 0; i < ENEMY_COUNT; i++) {
        let startX, startY, startGridX, startGridY;
        const playerGridX = Math.floor((state.playerPos.x + state.playerSize / 2) / state.cellSize);
        const playerGridY = Math.floor((state.playerPos.y + state.playerSize / 2) / state.cellSize);
        do {
            startGridX = Math.floor(Math.random() * GRID_SIZE);
            startGridY = Math.floor(Math.random() * GRID_SIZE);
        } while (!isInBounds(startGridX, startGridY) || (Math.abs(startGridX - playerGridX) < 3 && Math.abs(startGridY - playerGridY) < 3));
        startX = startGridX * state.cellSize + (state.cellSize / 2) - (state.enemySize / 2);
        startY = startGridY * state.cellSize + (state.cellSize / 2) - (state.enemySize / 2);
        state.enemies.push({
            id: state.nextEnemyId++, x: startX, y: startY,
            targetPixelX: startX, targetPixelY: startY, element: null,
            nextMoveTime: performance.now() + Math.random() * ENEMY_MOVE_INTERVAL,
        });
    }
    console.log("Created enemies:", state.enemies.length);
}

/** Resets the game state for a new game */
function resetGame() {
    console.log("Resetting game state...");
    if (!dom.gridElement || !dom.playerElement) {
        console.error("Cannot reset grid, essential elements not found!");
        return;
    }
    // Clear dynamic elements
    dom.gridElement.querySelectorAll('.cell').forEach(cell => cell.remove());
    dom.gridElement.querySelectorAll('.bullet').forEach(b => b.remove());
    dom.gridElement.querySelectorAll('.enemy').forEach(e => e.remove());
    dom.gridElement.querySelectorAll('.pin').forEach(p => p.remove()); // Clear old pins

    // Reset game variables
    state.cellSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
    const playerDiameterRatio = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--player-diameter-ratio'));
    state.playerSize = state.cellSize * playerDiameterRatio;
    state.gridPixelWidth = GRID_SIZE * state.cellSize;
    state.gridPixelHeight = GRID_SIZE * state.cellSize;
    state.gridData = [];
    state.bullets = [];
    state.enemies = [];
    state.activePins = []; // Reset pins
    state.nextPinId = 0;
    state.playerVel = { x: 0, y: 0 };
    state.playerRotation = 0;
    state.targetPos = null; // Reset target position
    state.score = 0;
    updateScoreDisplay();
    state.targetTile = { x: null, y: null };
    state.currentTargetElement = null;
    state.lastShotTime = 0;
    state.nextBulletId = 0;
    state.nextEnemyId = 0;
    deactivateDangerZone();
    state.nextDangerZoneAppearTime = performance.now() + DANGER_ZONE_APPEAR_INTERVAL;
    state.timePlayerInDangerZone = 0;
    state.gameStartTime = performance.now();
    if (dom.timerDisplay) dom.timerDisplay.style.display = 'none';

    // Regenerate grid materials
    const zoneMaterials = [];
    for (let zy = 0; zy < Math.ceil(GRID_SIZE / ZONE_SIZE); zy++) {
        let zoneRow = [];
        for (let zx = 0; zx < Math.ceil(GRID_SIZE / ZONE_SIZE); zx++) {
            zoneRow.push(MATERIAL_TYPES[Math.floor(Math.random() * MATERIAL_TYPES.length)]);
        }
        zoneMaterials.push(zoneRow);
    }

    // Create grid cells and assign materials
    for (let y = GRID_SIZE - 1; y >= 0; y--) {
        const row = [];
        for (let x = GRID_SIZE - 1; x >= 0; x--) {
            const zoneX = Math.floor(x / ZONE_SIZE);
            const zoneY = Math.floor(y / ZONE_SIZE);
            const material = zoneMaterials[zoneY]?.[zoneX] || MATERIALS.GRASS;
            row.unshift(material);
            const cell = document.createElement('div');
            cell.classList.add('cell', material);
            cell.dataset.x = x;
            cell.dataset.y = y;
            dom.gridElement.insertBefore(cell, dom.gridElement.firstChild);
        }
        state.gridData.unshift(row);
    }

    // Find a starting position for the player (prefer grass)
    let startGridX = -1, startGridY = -1;
    outerLoop:
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (state.gridData[y][x] === MATERIALS.GRASS) {
                startGridX = x;
                startGridY = y;
                break outerLoop;
            }
        }
    }
    if (startGridX === -1) { startGridX = 0; startGridY = 0; } // Fallback if no grass found

    // Position the player
    const playerOffset = (state.cellSize - state.playerSize) / 2;
    state.playerPos.x = startGridX * state.cellSize + playerOffset;
    state.playerPos.y = startGridY * state.cellSize + playerOffset;

    // Initialize game elements
    selectNewTarget();
    createEnemies();
    renderPlayer(); // Initial render
    console.log("resetGame finished.");
}

function renderPlayer() {
    if (!dom.playerElement) return;
    dom.playerElement.style.transform = `translate(${state.playerPos.x}px, ${state.playerPos.y}px)`;
    if (dom.spinArcsContainer) {
        dom.spinArcsContainer.style.transform = `rotate(${state.playerRotation}deg)`;
    } else {
        dom.spinArcsContainer = dom.playerElement.querySelector('.spin-arcs-container');
        if (dom.spinArcsContainer) {
            dom.spinArcsContainer.style.transform = `rotate(${state.playerRotation}deg)`;
        } else {
            console.warn("Spin arcs container not found for rotation.");
        }
    }
}

function updateScoreDisplay() {
    if (dom.scoreDisplay) dom.scoreDisplay.textContent = `Score: ${state.score}`;
}

function renderBullets() {
    if (!dom.gridElement) return;
    const existingBulletElements = dom.gridElement.querySelectorAll('.bullet');
    const activeBulletIds = new Set(state.bullets.map(b => `bullet-${b.id}`));
    existingBulletElements.forEach(el => { if (!activeBulletIds.has(el.id)) el.remove(); });
    state.bullets.forEach(bullet => {
        if (!bullet.element) {
            bullet.element = document.createElement('div');
            bullet.element.classList.add('bullet');
            bullet.element.id = `bullet-${bullet.id}`;
            dom.gridElement.appendChild(bullet.element);
        }
        bullet.element.style.left = `${bullet.x - 3}px`;
        bullet.element.style.top = `${bullet.y - 3}px`;
    });
}

function renderEnemies() {
    if (!dom.gridElement) return;
    const existingEnemyElements = dom.gridElement.querySelectorAll('.enemy');
    const activeEnemyIds = new Set(state.enemies.map(e => `enemy-${e.id}`));
    existingEnemyElements.forEach(el => { if (!activeEnemyIds.has(el.id)) el.remove(); });
    state.enemies.forEach(enemy => {
        if (!enemy.element) {
            enemy.element = document.createElement('div');
            enemy.element.classList.add('enemy');
            enemy.element.id = `enemy-${enemy.id}`;
            dom.gridElement.appendChild(enemy.element);
        }
        enemy.element.style.transform = `translate(${enemy.x}px, ${enemy.y}px)`;
    });
}

function getPointerPosOnGrid(event) {
    if (!dom.gridElement) return null;
    const rect = dom.gridElement.getBoundingClientRect();
    if (!rect) return null;
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

/** Handles placing a movement pin on the grid */
export function handlePointerDown(event) {
    if (state.gameState !== 'playing') return;
    // Allow placing pins with primary mouse button or touch
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const pos = getPointerPosOnGrid(event);
    if (pos && pos.x >= 0 && pos.x <= state.gridPixelWidth && pos.y >= 0 && pos.y <= state.gridPixelHeight) {
        event.preventDefault(); // Prevent default actions like text selection

        // Create pin data
        const newPin = {
            id: state.nextPinId++,
            x: pos.x,
            y: pos.y,
            creationTime: performance.now(),
            element: null,
        };

        // Create pin visual element
        const pinElement = document.createElement('div');
        pinElement.classList.add('pin');
        pinElement.id = `pin-${newPin.id}`;
        pinElement.style.left = `${newPin.x}px`;
        pinElement.style.top = `${newPin.y}px`;
        dom.gridElement.appendChild(pinElement);

        newPin.element = pinElement;
        state.activePins.push(newPin);
    }
}

function getTopScore(mode) {
    const key = mode === 'survival' ? TOP_SCORE_SURVIVAL_KEY : TOP_SCORE_SCORE_KEY;
    return parseInt(localStorage.getItem(key) || '0');
}

function updateTopScore(mode, currentScore) {
    const key = mode === 'survival' ? TOP_SCORE_SURVIVAL_KEY : TOP_SCORE_SCORE_KEY;
    const topScore = getTopScore(mode);
    if (currentScore > topScore) {
        localStorage.setItem(key, currentScore.toString());
        return currentScore;
    }
    return topScore;
}

/** Toggles the celebratory gold pulse + badge on whichever score span matches the mode just played */
function applyRecordCelebration(isNewRecord, scoreEl, badgeEl, otherScoreEl, otherBadgeEl) {
    otherScoreEl?.classList.remove('new-record');
    otherBadgeEl?.classList.remove('show');
    scoreEl?.classList.toggle('new-record', isNewRecord);
    badgeEl?.classList.toggle('show', isNewRecord);
}

/** Displays end screen (Game Over or Win) */
function showEndScreen(isWin) {
    const finalScore = state.score;
    const priorTop = getTopScore(state.currentGameMode);
    updateTopScore(state.currentGameMode, finalScore); // Update score for the mode played
    const isNewRecord = finalScore > priorTop;
    if (window.KamekoTokens) window.KamekoTokens.earn(isNewRecord ? 2 : 1, 'materials-run finish');
    const topScoreScore = getTopScore('score'); // Get latest scores for display
    const topScoreSurvival = getTopScore('survival');

    if (isWin) {
        if (dom.winFinalScoreElement) dom.winFinalScoreElement.textContent = finalScore;
        if (dom.winTopScoreScoreElement) dom.winTopScoreScoreElement.textContent = topScoreScore;
        if (dom.winTopScoreSurvivalElement) dom.winTopScoreSurvivalElement.textContent = topScoreSurvival;
        if (state.currentGameMode === 'survival') {
            applyRecordCelebration(isNewRecord, dom.winTopScoreSurvivalElement, dom.winTopScoreSurvivalBadge, dom.winTopScoreScoreElement, dom.winTopScoreScoreBadge);
        } else {
            applyRecordCelebration(isNewRecord, dom.winTopScoreScoreElement, dom.winTopScoreScoreBadge, dom.winTopScoreSurvivalElement, dom.winTopScoreSurvivalBadge);
        }
        if (dom.winOverlay) dom.winOverlay.style.display = 'flex';
    } else {
        if (dom.finalScoreElement) dom.finalScoreElement.textContent = finalScore;
        if (dom.topScoreScoreElement) dom.topScoreScoreElement.textContent = topScoreScore;
        if (dom.topScoreSurvivalElement) dom.topScoreSurvivalElement.textContent = topScoreSurvival;
        if (state.currentGameMode === 'survival') {
            applyRecordCelebration(isNewRecord, dom.topScoreSurvivalElement, dom.topScoreSurvivalBadge, dom.topScoreScoreElement, dom.topScoreScoreBadge);
        } else {
            applyRecordCelebration(isNewRecord, dom.topScoreScoreElement, dom.topScoreScoreBadge, dom.topScoreSurvivalElement, dom.topScoreSurvivalBadge);
        }
        if (dom.gameOverOverlay) dom.gameOverOverlay.style.display = 'flex';
    }
}

/** Cleans up game state and shows the start screen */
export function goToStartScreen() {
    console.log("Returning to start screen...");
    if (dom.gameOverOverlay) dom.gameOverOverlay.style.display = 'none';
    if (dom.winOverlay) dom.winOverlay.style.display = 'none';
    if (dom.startScreenOverlay) dom.startScreenOverlay.style.display = 'flex';
    if (dom.topScoresOverlay) dom.topScoresOverlay.style.display = 'none';
    state.gameState = 'menu';
    // Clean up game elements
    dom.gridElement?.querySelectorAll('.cell').forEach(cell => cell.remove());
    dom.gridElement?.querySelectorAll('.bullet').forEach(b => b.remove());
    dom.gridElement?.querySelectorAll('.enemy').forEach(e => e.remove());
    dom.gridElement?.querySelectorAll('.pin').forEach(p => p.remove()); // Clear pins on menu return
    state.activePins = []; // Clear pin data
    if (dom.playerElement) dom.playerElement.style.transform = 'translate(-1000px, -1000px)'; // Hide player

    // Stop game loop when returning to menu
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null; // Reset the ID
        console.log("Stopped game loop on return to menu.");
    }
}

function triggerGameOver() {
    if (state.gameState === 'gameover' || state.gameState === 'won') return;
    console.log("GAME OVER!");
    state.gameState = 'gameover';
    state.targetPos = null;
    state.activePins = [];
    dom.gridElement?.querySelectorAll('.pin').forEach(p => p.remove());
    deactivateDangerZone();
    if (state.currentTargetElement) {
        state.currentTargetElement.classList.remove('blinking-target');
        state.currentTargetElement = null;
        state.targetTile = { x: null, y: null };
    }
    state.bullets.forEach(b => b.element?.remove());
    state.bullets = [];
    showEndScreen(false);
}

function triggerWin() {
    if (state.gameState === 'gameover' || state.gameState === 'won') return;
    console.log("YOU WIN!");
    state.gameState = 'won';
    state.targetPos = null;
    state.activePins = [];
    dom.gridElement?.querySelectorAll('.pin').forEach(p => p.remove());
    deactivateDangerZone();
    if (state.currentTargetElement) {
        state.currentTargetElement.classList.remove('blinking-target');
        state.currentTargetElement = null;
        state.targetTile = { x: null, y: null };
    }
    state.bullets.forEach(b => b.element?.remove());
    state.bullets = [];
    showEndScreen(true);
}

function updateEnemies(deltaTime, now) {
    state.enemies.forEach(enemy => {
        if (now >= enemy.nextMoveTime) {
            const currentGridX = Math.floor((enemy.x + state.enemySize / 2) / state.cellSize);
            const currentGridY = Math.floor((enemy.y + state.enemySize / 2) / state.cellSize);
            const possibleMoves = [{ dx: 0, dy: 0 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
            let nextGridX, nextGridY, moveFound = false;
            possibleMoves.sort(() => Math.random() - 0.5);
            for (const move of possibleMoves) {
                nextGridX = currentGridX + move.dx;
                nextGridY = currentGridY + move.dy;
                if (isInBounds(nextGridX, nextGridY)) { moveFound = true; break; }
            }
            if (moveFound) {
                enemy.targetPixelX = nextGridX * state.cellSize + (state.cellSize / 2) - (state.enemySize / 2);
                enemy.targetPixelY = nextGridY * state.cellSize + (state.cellSize / 2) - (state.enemySize / 2);
            } else {
                enemy.targetPixelX = enemy.x;
                enemy.targetPixelY = enemy.y;
            }
            enemy.nextMoveTime = now + ENEMY_MOVE_INTERVAL + (Math.random() * 500 - 250);
        }
        const dirX = enemy.targetPixelX - enemy.x;
        const dirY = enemy.targetPixelY - enemy.y;
        const distToTarget = Math.sqrt(dirX ** 2 + dirY ** 2);
        const moveAmount = ENEMY_SPEED * deltaTime;
        if (distToTarget > 1) {
            if (moveAmount >= distToTarget) {
                enemy.x = enemy.targetPixelX;
                enemy.y = enemy.targetPixelY;
            } else {
                enemy.x += (dirX / distToTarget) * moveAmount;
                enemy.y += (dirY / distToTarget) * moveAmount;
            }
        }
    });
}

export function handleResize() {
    console.log("Window resized.");
    if (state.gameState === 'playing') {
        resetGame();
    } else {
        state.cellSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--cell-size'));
        state.gridPixelWidth = GRID_SIZE * state.cellSize;
        state.gridPixelHeight = GRID_SIZE * state.cellSize;
    }
    state.lastTimestamp = performance.now();
}

export function showTopScores() {
    if (!dom.topScoresOverlay) return;
    const topScoreScore = getTopScore('score');
    const topScoreSurvival = getTopScore('survival');
    if (dom.infoTopScoreScoreElement) dom.infoTopScoreScoreElement.textContent = topScoreScore;
    if (dom.infoTopScoreSurvivalElement) dom.infoTopScoreSurvivalElement.textContent = topScoreSurvival;
    dom.topScoresOverlay.style.display = 'flex';
}

export function hideTopScores() {
    if (dom.topScoresOverlay) dom.topScoresOverlay.style.display = 'none';
}

/** Main game update loop */
function update(deltaTime) {
    if (state.gameState !== 'playing') return;
    if (!deltaTime || deltaTime > 0.1) { deltaTime = 0.016; } // Prevent large jumps
    const now = performance.now();

    // --- Update and Remove Expired Pins ---
    state.activePins = state.activePins.filter(pin => {
        if (now - pin.creationTime > PIN_LIFESPAN) {
            if (pin.element) {
                pin.element.classList.add('fading-out');
                setTimeout(() => pin.element?.remove(), 500); // Match CSS transition duration
            }
            return false;
        }
        return true;
    });

    // --- Calculate Average Pin Position (Target Position) ---
    if (state.activePins.length > 0) {
        let sumX = 0, sumY = 0;
        state.activePins.forEach(pin => { sumX += pin.x; sumY += pin.y; });
        state.targetPos = { x: sumX / state.activePins.length, y: sumY / state.activePins.length };
    } else {
        state.targetPos = null; // No pins, no target
    }

    // --- Player Physics ---
    const validPlayerSize = (typeof state.playerSize === 'number' && !isNaN(state.playerSize) && state.playerSize > 0)
        ? state.playerSize
        : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--player-diameter-ratio') || '0.7') * state.cellSize;
    const playerRadius = validPlayerSize / 2;
    const playerCenterX = state.playerPos.x + playerRadius;
    const playerCenterY = state.playerPos.y + playerRadius;

    const currentMaterial = getMaterialAtPixel(playerCenterX, playerCenterY) || MATERIALS.GRASS;
    const mods = PHYSICS_MODIFIERS[currentMaterial] || PHYSICS_MODIFIERS[MATERIALS.GRASS];
    const currentAcceleration = BASE_ACCELERATION * mods.acceleration;
    const adjustedBaseFriction = Math.pow(BASE_FRICTION / mods.friction, deltaTime); // Apply friction based on material

    let accX = 0, accY = 0;
    // Accelerate towards the average pin position if it exists
    if (state.targetPos) {
        const directionX = state.targetPos.x - playerCenterX;
        const directionY = state.targetPos.y - playerCenterY;
        const distance = Math.sqrt(directionX ** 2 + directionY ** 2);
        if (distance > ACCELERATION_THRESHOLD) {
            const normX = directionX / distance;
            const normY = directionY / distance;
            accX = normX * currentAcceleration;
            accY = normY * currentAcceleration;
        }
    }

    // Apply acceleration
    state.playerVel.x += accX * deltaTime;
    state.playerVel.y += accY * deltaTime;

    // Apply friction if not accelerating towards a target
    if (!state.targetPos || (accX === 0 && accY === 0)) {
        state.playerVel.x *= adjustedBaseFriction;
        state.playerVel.y *= adjustedBaseFriction;
        // Stop movement if velocity is very low
        if (Math.abs(state.playerVel.x) < 1) state.playerVel.x = 0;
        if (Math.abs(state.playerVel.y) < 1) state.playerVel.y = 0;
    }

    // Clamp speed
    let currentSpeed = Math.sqrt(state.playerVel.x ** 2 + state.playerVel.y ** 2);
    if (currentSpeed > MAX_SPEED) {
        const scale = MAX_SPEED / currentSpeed;
        state.playerVel.x *= scale;
        state.playerVel.y *= scale;
        currentSpeed = MAX_SPEED;
    }

    // Update position
    state.playerPos.x += state.playerVel.x * deltaTime;
    state.playerPos.y += state.playerVel.y * deltaTime;

    // Update rotation (based on velocity and acceleration cross product)
    let rotationSpeed = 0;
    if (currentSpeed > 1.0 && (accX !== 0 || accY !== 0)) {
        const crossProduct = (state.playerVel.x * accY - state.playerVel.y * accX);
        const crossProductThreshold = 1000; // Threshold to prevent jitter
        if (Math.abs(crossProduct) > crossProductThreshold) {
            rotationSpeed = Math.sign(crossProduct) * currentSpeed * ROTATION_FACTOR;
        }
    }
    state.playerRotation += rotationSpeed * deltaTime;
    state.playerRotation %= 360; // Keep rotation within 0-360

    // Boundary collision
    const minX = 0, minY = 0;
    const maxX = state.gridPixelWidth - validPlayerSize;
    const maxY = state.gridPixelHeight - validPlayerSize;
    if (state.playerPos.x < minX) { state.playerPos.x = minX; state.playerVel.x = 0; }
    if (state.playerPos.x > maxX) { state.playerPos.x = maxX; state.playerVel.x = 0; }
    if (state.playerPos.y < minY) { state.playerPos.y = minY; state.playerVel.y = 0; }
    if (state.playerPos.y > maxY) { state.playerPos.y = maxY; state.playerVel.y = 0; }

    // --- Shooting Logic ---
    if (state.targetTile.x !== null && currentSpeed > MIN_SPEED_TO_SHOOT && now > state.lastShotTime + SHOOTING_INTERVAL) {
        const targetCenterX = state.targetTile.x * state.cellSize + state.cellSize / 2;
        const targetCenterY = state.targetTile.y * state.cellSize + state.cellSize / 2;
        const distToTarget = Math.sqrt((targetCenterX - playerCenterX) ** 2 + (targetCenterY - playerCenterY) ** 2);
        if (distToTarget <= SHOOTING_RANGE) {
            const velMagnitude = Math.sqrt(state.playerVel.x ** 2 + state.playerVel.y ** 2);
            if (velMagnitude > 0) { // Only shoot if moving
                const bulletVx = (state.playerVel.x / velMagnitude) * BULLET_SPEED;
                const bulletVy = (state.playerVel.y / velMagnitude) * BULLET_SPEED;
                state.bullets.push({ id: state.nextBulletId++, x: playerCenterX, y: playerCenterY, vx: bulletVx, vy: bulletVy, element: null });
                state.lastShotTime = now;
            }
        }
    }

    // --- Bullet Update & Collision ---
    const targetLeft = state.targetTile.x * state.cellSize;
    const targetRight = targetLeft + state.cellSize;
    const targetTop = state.targetTile.y * state.cellSize;
    const targetBottom = targetTop + state.cellSize;
    for (let i = state.bullets.length - 1; i >= 0; i--) {
        const bullet = state.bullets[i];
        bullet.x += bullet.vx * deltaTime;
        bullet.y += bullet.vy * deltaTime;
        let hit = false;
        // Check collision with target tile
        if (state.targetTile.x !== null && bullet.x >= targetLeft && bullet.x <= targetRight && bullet.y >= targetTop && bullet.y <= targetBottom) {
            console.log("Bullet hit target!");
            hit = true;
            state.score++;
            updateScoreDisplay();
            selectNewTarget(); // Select a new target immediately
        }
        // Remove bullet if hit or out of bounds
        if (hit || bullet.x < 0 || bullet.x > state.gridPixelWidth || bullet.y < 0 || bullet.y > state.gridPixelHeight) {
            bullet.element?.remove(); // Safely remove element if it exists
            state.bullets.splice(i, 1);
        }
    }

    // --- Danger Zone Logic ---
    if (!state.isDangerZoneActive && now >= state.nextDangerZoneAppearTime && state.nextDangerZoneAppearTime !== 0) activateDangerZone();
    if (state.isDangerZoneActive && now >= state.dangerZoneEndTime) deactivateDangerZone();
    if (state.isDangerZoneActive) {
        const playerGridX = Math.floor(playerCenterX / state.cellSize);
        const playerGridY = Math.floor(playerCenterY / state.cellSize);
        let isInside = false;
        if (playerGridX >= state.dangerZone.x && playerGridX < state.dangerZone.x + state.dangerZone.size &&
            playerGridY >= state.dangerZone.y && playerGridY < state.dangerZone.y + state.dangerZone.size) {
            isInside = true;
        }
        if (isInside) {
            state.timePlayerInDangerZone += deltaTime * 1000; // Accumulate time in ms
            if (state.timePlayerInDangerZone >= DANGER_ZONE_GRACE_PERIOD) {
                triggerGameOver(); return; // Exit update early
            }
        } else {
            state.timePlayerInDangerZone = 0; // Reset timer if outside
        }
    } else {
        state.timePlayerInDangerZone = 0; // Ensure timer is 0 if zone not active
    }

    // --- Enemy Update ---
    updateEnemies(deltaTime, now);

    // --- Player-Enemy Collision Check ---
    const validEnemySize = (typeof state.enemySize === 'number' && !isNaN(state.enemySize) && state.enemySize > 0)
        ? state.enemySize
        : parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--enemy-size-ratio') || '0.6') * state.cellSize;
    const enemyRadius = validEnemySize / 2; // Approximation for collision
    state.enemies.forEach(enemy => {
        if (state.gameState !== 'playing') return; // Don't check if already game over
        const enemyCenterX = enemy.x + enemyRadius;
        const enemyCenterY = enemy.y + enemyRadius;
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionDistance = playerRadius + enemyRadius;
        if (distance < collisionDistance) {
            console.log("Collision with enemy!");
            triggerGameOver();
            return; // Exit check early
        }
    });
    if (state.gameState !== 'playing') return; // Exit update if game over triggered by collision

    // --- Survival Timer Check ---
    if (state.currentGameMode === 'survival') {
        const elapsedTime = now - state.gameStartTime;
        const remainingTime = SURVIVAL_DURATION - elapsedTime;
        if (dom.timerDisplay) dom.timerDisplay.textContent = `Time: ${formatTime(remainingTime)}`;
        if (remainingTime <= 0) {
            triggerWin();
            return; // Exit update early
        }
    }
}

export function gameLoop(timestamp) {
    if (!state.lastTimestamp) state.lastTimestamp = timestamp;
    const deltaTime = (timestamp - state.lastTimestamp) / 1000;
    state.lastTimestamp = timestamp;

    if (state.gameState === 'playing') {
        update(deltaTime);
        renderPlayer();
        renderBullets();
        renderEnemies();
        // Pin rendering is handled by creation/deletion
    }
    // Only request next frame if not in menu state
    if (state.gameState !== 'menu') {
        state.animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        state.animationFrameId = null; // Ensure ID is null if loop stops
    }
}

/** Starts the selected game mode */
export function startGame(mode) {
    console.log(`Starting game mode: ${mode}`);
    state.currentGameMode = mode;
    if (dom.startScreenOverlay) dom.startScreenOverlay.style.display = 'none';
    state.gameState = 'playing';
    resetGame(); // Full reset before starting
    state.lastTimestamp = performance.now(); // Reset timestamp for deltaTime calculation
    state.gameStartTime = performance.now(); // Reset game start time
    if (dom.timerDisplay) dom.timerDisplay.style.display = (mode === 'survival' ? 'block' : 'none');

    // Stop any previous loop and start a new one
    if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
        console.log("Cancelled previous animation frame.");
    }
    console.log("Starting game loop...");
    state.animationFrameId = requestAnimationFrame(gameLoop);
}
