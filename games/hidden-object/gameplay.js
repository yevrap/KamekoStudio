import {
    ROUND_DURATION, BASE_SPEED_MULTIPLIER, SPEED_INCREMENT_PER_ROUND, INITIAL_SPEED_FACTOR,
    MIN_SPEED_AFTER_COLLISION, BLINK_INTERVAL_VISIBLE_BASE, BLINK_INTERVAL_INVISIBLE_BASE, BLINK_INTERVAL_INVISIBLE_LONG,
    allPossibleItems, numItemsToDisplay, minRelativeSize, maxRelativeSize,
} from './constants.js';
import { state, dom } from './state.js';

// --- Screen Management & UI Updates ---
export function updateTokenDisplay() {

}

export function showScreen(screenName) {
    state.currentScreen = screenName;
    dom.mainScreenElement.classList.toggle('hidden', screenName !== 'main');
    dom.gameScreenContainerElement.classList.toggle('hidden', screenName !== 'game');
    if (screenName === 'main') {
        updateTokenDisplay();
        if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
        if (state.roundIntervalId) clearInterval(state.roundIntervalId);
        state.lastFrameTime = 0;
    }
}

// --- Game Logic ---
export function startNewGameSession() {
    state.currentRoundNumber = 0;
    startNextRound();
}

export function startNextRound() {
    state.isRoundOver = false;
    state.targetItem = null;
    state.currentRoundNumber++;
    dom.currentRoundDisplayElement.textContent = `Round: ${state.currentRoundNumber}`;
    dom.successModalElement.classList.add('hidden');
    dom.gameOverModalElement.classList.add('hidden');
    dom.targetMessageElement.classList.remove('pulsate');
    showScreen('game');
    generateObjectsAndSelectTarget();
    updateTargetMessage();
    state.objectFindStartTime = Date.now();
    state.roundTimeLeft = ROUND_DURATION / 1000;
    updateRoundTimerDisplay();
    if (state.roundIntervalId) clearInterval(state.roundIntervalId);
    state.roundIntervalId = setInterval(handleRoundTick, 1000);

    state.lastFrameTime = performance.now();
    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    animateScene(state.lastFrameTime);
}

export function handleRoundTick() {
    state.roundTimeLeft--;
    updateRoundTimerDisplay();
    if (state.roundTimeLeft <= 0) {
        if (!state.isRoundOver) {
            handleSessionEnd(false, 0);
        }
    }
}

function updateRoundTimerDisplay() {
    dom.roundTimerDisplayElement.textContent = `Time: ${state.roundTimeLeft}s`;
}

export function handleSessionEnd(wasFound, timeTakenToFind, userQuit = false) {
    if (state.isRoundOver && !userQuit) return;
    state.isRoundOver = true;
    if (state.roundIntervalId) clearInterval(state.roundIntervalId);
    state.roundIntervalId = null;
    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = null;

    if (wasFound) {
        dom.timeTakenTextElement.textContent = `Found in: ${(timeTakenToFind / 1000).toFixed(2)}s`;
        dom.successMessageTextElement.textContent = `🎉 You found the ${state.targetItem.emoji} ${state.targetItem.name}! 🎉`;
        dom.foundObjectNameElement.textContent = '';
        dom.successModalElement.classList.remove('hidden');
    } else {
        if (!userQuit) {
            dom.sessionEndedScoreTextElement.textContent = `Session over! Reached round ${state.currentRoundNumber}.`;
            dom.gameOverModalElement.classList.remove('hidden');

        } else {
            showScreen('main');
        }
    }
}

export function quitGameAndGoToMenu() {
    handleSessionEnd(false, 0, true);
}

function generateObjectInstance(itemDetail, isThisTheTarget = false) {
    const effectiveRoundForSpeed = Math.max(1, state.currentRoundNumber);
    const currentSpeedMagnitude = BASE_SPEED_MULTIPLIER + (SPEED_INCREMENT_PER_ROUND * (effectiveRoundForSpeed - 1));
    let newObj = {
        ...itemDetail,
        id: Math.random().toString(36).substr(2, 9) + (isThisTheTarget ? "-target" : "-distractor"),
        x: Math.random() * 0.92 + 0.04,
        y: Math.random() * 0.92 + 0.04,
        size: minRelativeSize + Math.random() * (maxRelativeSize - minRelativeSize),
        isTarget: isThisTheTarget,
        found: false,
        angle: (Math.random() - 0.5) * Math.PI * 0.6,
        opacity: isThisTheTarget ? 1 : ((Math.random() < 0.3) ? (0.7 + Math.random() * 0.2) : 1),
        vx: 0, vy: 0,
        isVisible: true,
        blinkTimer: BLINK_INTERVAL_VISIBLE_BASE + Math.random() * 500,
        timeVisible: BLINK_INTERVAL_VISIBLE_BASE,
        timeInvisible: state.currentRoundNumber >= 15 ? BLINK_INTERVAL_INVISIBLE_LONG : BLINK_INTERVAL_INVISIBLE_BASE,
    };

    if (state.currentRoundNumber >= 5) {
        let angle = Math.random() * 2 * Math.PI;
        newObj.vx = Math.cos(angle) * currentSpeedMagnitude * INITIAL_SPEED_FACTOR;
        newObj.vy = Math.sin(angle) * currentSpeedMagnitude * INITIAL_SPEED_FACTOR;
    } else {
        newObj.vx = (Math.random() - 0.5) * currentSpeedMagnitude * INITIAL_SPEED_FACTOR;
        newObj.vy = (Math.random() - 0.5) * currentSpeedMagnitude * INITIAL_SPEED_FACTOR;
    }
    return newObj;
}

function generateObjectsAndSelectTarget() {
    state.gameObjects = [];
    state.targetItem = null;
    const targetDetailsIndex = Math.floor(Math.random() * allPossibleItems.length);
    const currentTargetItemDetails = allPossibleItems[targetDetailsIndex];
    let attempts = 0;
    let placedTarget = false;
    let newTargetObjAttempt;

    while (!placedTarget && attempts < 50) {
        newTargetObjAttempt = generateObjectInstance(currentTargetItemDetails, true);
        placedTarget = true;
        attempts++;
    }

    if (placedTarget && newTargetObjAttempt) {
        state.gameObjects.push(newTargetObjAttempt);
        state.targetItem = newTargetObjAttempt;
    } else {
        console.error("CRITICAL: Failed to place the target object.");
        state.targetItem = generateObjectInstance(currentTargetItemDetails, true);
        state.targetItem.x = 0.5; state.targetItem.y = 0.5;
        state.gameObjects.push(state.targetItem);
    }

    const distractorPoolDetails = allPossibleItems.filter(item => item.emoji !== currentTargetItemDetails.emoji);
    let distractorsToPlace = numItemsToDisplay - 1;
    if (state.gameObjects.length === 0) distractorsToPlace = numItemsToDisplay;

    for (let i = 0; i < distractorsToPlace; i++) {
        if (distractorPoolDetails.length === 0 && allPossibleItems.length > 1) {
            console.warn("Ran out of unique emoji distractors.");
            break;
        }
        if (distractorPoolDetails.length === 0 && allPossibleItems.length <= 1) break;

        const distractorDetail = distractorPoolDetails.length > 0
            ? distractorPoolDetails[Math.floor(Math.random() * distractorPoolDetails.length)]
            : allPossibleItems[Math.floor(Math.random() * allPossibleItems.length)];

        let chosenDistractorDetail = distractorDetail;
        if (distractorPoolDetails.length === 0 && chosenDistractorDetail.emoji === currentTargetItemDetails.emoji && allPossibleItems.length > 1) {
            let attemptsToFindDifferent = 0;
            do {
                chosenDistractorDetail = allPossibleItems[Math.floor(Math.random() * allPossibleItems.length)];
                attemptsToFindDifferent++;
            } while (chosenDistractorDetail.emoji === currentTargetItemDetails.emoji && attemptsToFindDifferent < allPossibleItems.length * 2);
        }

        let placedDistractor = false;
        attempts = 0;
        let newDistractorObjAttempt;
        while (!placedDistractor && attempts < 30) {
            newDistractorObjAttempt = generateObjectInstance(chosenDistractorDetail, false);
            let overlapsSignificantly = false;
            for (const obj of state.gameObjects) {
                const dist = Math.sqrt(Math.pow(obj.x - newDistractorObjAttempt.x, 2) + Math.pow(obj.y - newDistractorObjAttempt.y, 2));
                const collisionRadiusObj = obj.size / 2;
                const collisionRadiusNew = newDistractorObjAttempt.size / 2;
                if (dist < (collisionRadiusObj + collisionRadiusNew) * 0.7) {
                    overlapsSignificantly = true;
                    break;
                }
            }
            if (!overlapsSignificantly) placedDistractor = true;
            attempts++;
        }
        if (placedDistractor && newDistractorObjAttempt) {
            state.gameObjects.push(newDistractorObjAttempt);
        } else if (newDistractorObjAttempt) {
            state.gameObjects.push(newDistractorObjAttempt);
        }
    }
    if (!state.targetItem && state.gameObjects.length > 0) {
        console.error("Fallback: Target item was not set. Assigning first available object matching original target details, or first object.");
        let potentialTarget = state.gameObjects.find(obj => obj.name === currentTargetItemDetails.name && obj.emoji === currentTargetItemDetails.emoji && !obj.isTarget);
        if (potentialTarget) {
            state.targetItem = potentialTarget;
            state.targetItem.isTarget = true;
        } else {
            state.targetItem = state.gameObjects[0];
            state.targetItem.isTarget = true;
        }
        if (state.targetItem) {
            state.targetItem.opacity = 1;
            currentTargetItemDetails.name = state.targetItem.name;
            currentTargetItemDetails.emoji = state.targetItem.emoji;
        }
    }
}

function updateTargetMessage() {
    if (state.targetItem) {
        dom.targetMessageElement.innerHTML = `Find the <span class="target-emoji">${state.targetItem.emoji}</span> ${state.targetItem.name}!`;
        setTimeout(() => dom.targetMessageElement.classList.add('pulsate'), 100);
    } else {
        dom.targetMessageElement.textContent = "Error: Target item not ready.";
        console.error("updateTargetMessage called but targetItem is null or undefined.");
    }
}

export function animateScene(currentTime) {
    if (state.isRoundOver) {
        if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
        return;
    }

    const deltaTime = currentTime - state.lastFrameTime;
    state.lastFrameTime = currentTime;

    if (!state.isRoundOver) {
        if (state.currentRoundNumber >= 10) {
            state.gameObjects.forEach(obj => {
                obj.blinkTimer -= deltaTime;
                if (obj.blinkTimer <= 0) {
                    obj.isVisible = !obj.isVisible;
                    if (obj.isVisible) {
                        obj.blinkTimer = obj.timeVisible + Math.random() * 200 - 100;
                    } else {
                        obj.blinkTimer = obj.timeInvisible + Math.random() * 200 - 100;
                    }
                }
            });
        }

        state.gameObjects.forEach(obj => {
            const objRadiusRelX = (obj.size * Math.min(dom.canvas.width, dom.canvas.height) / 2) / dom.canvas.width;
            const objRadiusRelY = (obj.size * Math.min(dom.canvas.width, dom.canvas.height) / 2) / dom.canvas.height;
            let nextX = obj.x + obj.vx;
            let nextY = obj.y + obj.vy;
            if (nextX - objRadiusRelX < 0 || nextX + objRadiusRelX > 1) {
                obj.vx *= -1;
                if (nextX - objRadiusRelX < 0) obj.x = objRadiusRelX;
                else if (nextX + objRadiusRelX > 1) obj.x = 1 - objRadiusRelX;
            }
            if (nextY - objRadiusRelY < 0 || nextY + objRadiusRelY > 1) {
                obj.vy *= -1;
                if (nextY - objRadiusRelY < 0) obj.y = objRadiusRelY;
                else if (nextY + objRadiusRelY > 1) obj.y = 1 - objRadiusRelY;
            }
            obj.x += obj.vx;
            obj.y += obj.vy;
            obj.x = Math.max(objRadiusRelX, Math.min(obj.x, 1 - objRadiusRelX));
            obj.y = Math.max(objRadiusRelY, Math.min(obj.y, 1 - objRadiusRelY));
        });

        if (state.currentRoundNumber >= 5) {
            for (let i = 0; i < state.gameObjects.length; i++) {
                for (let j = i + 1; j < state.gameObjects.length; j++) {
                    const objA = state.gameObjects[i];
                    const objB = state.gameObjects[j];
                    const dx = (objB.x * dom.canvas.width) - (objA.x * dom.canvas.width);
                    const dy = (objB.y * dom.canvas.height) - (objA.y * dom.canvas.height);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const radiusA = (objA.size * Math.min(dom.canvas.width, dom.canvas.height)) / 2;
                    const radiusB = (objB.size * Math.min(dom.canvas.width, dom.canvas.height)) / 2;

                    if (distance < radiusA + radiusB) {
                        let tempVx = objA.vx; let tempVy = objA.vy;
                        objA.vx = objB.vx; objA.vy = objB.vy;
                        objB.vx = tempVx; objB.vy = tempVy;
                        if (Math.abs(objA.vx) < MIN_SPEED_AFTER_COLLISION) objA.vx = (objA.vx < 0 ? -1 : 1) * MIN_SPEED_AFTER_COLLISION;
                        if (Math.abs(objA.vy) < MIN_SPEED_AFTER_COLLISION) objA.vy = (objA.vy < 0 ? -1 : 1) * MIN_SPEED_AFTER_COLLISION;
                        if (Math.abs(objB.vx) < MIN_SPEED_AFTER_COLLISION) objB.vx = (objB.vx < 0 ? -1 : 1) * MIN_SPEED_AFTER_COLLISION;
                        if (Math.abs(objB.vy) < MIN_SPEED_AFTER_COLLISION) objB.vy = (objB.vy < 0 ? -1 : 1) * MIN_SPEED_AFTER_COLLISION;
                        const overlap = (radiusA + radiusB) - distance;
                        let normalX, normalY;
                        if (distance < 0.0001) {
                            normalX = (Math.random() - 0.5) * 2; normalY = (Math.random() - 0.5) * 2;
                            const mag = Math.sqrt(normalX * normalX + normalY * normalY);
                            if (mag > 0) { normalX /= mag; normalY /= mag; } else { normalX = 1; normalY = 0; }
                        } else { normalX = dx / distance; normalY = dy / distance; }
                        const separationAmount = overlap / 2;
                        objA.x -= (normalX * separationAmount) / dom.canvas.width;
                        objA.y -= (normalY * separationAmount) / dom.canvas.height;
                        objB.x += (normalX * separationAmount) / dom.canvas.width;
                        objB.y += (normalY * separationAmount) / dom.canvas.height;
                        const objARelX = (objA.size * Math.min(dom.canvas.width, dom.canvas.height) / 2) / dom.canvas.width;
                        const objARelY = (objA.size * Math.min(dom.canvas.width, dom.canvas.height) / 2) / dom.canvas.height;
                        objA.x = Math.max(objARelX, Math.min(objA.x, 1 - objARelX));
                        objA.y = Math.max(objARelY, Math.min(objA.y, 1 - objARelY));
                        const objBRelX = (objB.size * Math.min(dom.canvas.width, dom.canvas.height) / 2) / dom.canvas.width;
                        const objBRelY = (objB.size * Math.min(dom.canvas.width, dom.canvas.height) / 2) / dom.canvas.height;
                        objB.x = Math.max(objBRelX, Math.min(objB.x, 1 - objBRelX));
                        objB.y = Math.max(objBRelY, Math.min(objB.y, 1 - objBRelY));
                    }
                }
            }
        }
    }
    drawScene();
    if (!state.isRoundOver) {
        state.animationFrameId = requestAnimationFrame(animateScene);
    } else if (state.targetItem && state.targetItem.found) {
        state.animationFrameId = requestAnimationFrame(animateScene);
    }
}

function drawBackgroundPattern() {
    const pS = 30, nC = Math.ceil(dom.canvas.width / pS), nR = Math.ceil(dom.canvas.height / pS);
    dom.ctx.save();
    dom.ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < nC; i++) {
        for (let j = 0; j < nR; j++) {
            if ((i + j) % 2 === 0) { dom.ctx.beginPath(); dom.ctx.arc(i * pS + pS / 2, j * pS + pS / 2, 2, 0, Math.PI * 2); dom.ctx.fill(); }
        }
    }
    dom.ctx.restore();
}

export function drawScene() {
    const cw = dom.canvas.clientWidth;
    const ch = dom.canvas.clientHeight;
    if (cw > 0 && ch > 0) { dom.canvas.width = cw; dom.canvas.height = ch; }
    if (dom.canvas.width === 0 || dom.canvas.height === 0) return;
    dom.ctx.fillStyle = '#374151'; dom.ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
    drawBackgroundPattern();
    state.gameObjects.forEach(obj => drawObject(obj));
    if (state.isRoundOver && state.targetItem && state.targetItem.found) { highlightFoundObject(state.targetItem); }
}

function drawObject(obj) {
    if (!obj.isVisible && state.currentRoundNumber >= 10) return;

    const pX = obj.x * dom.canvas.width, pY = obj.y * dom.canvas.height, pS = obj.size * Math.min(dom.canvas.width, dom.canvas.height);
    dom.ctx.save();
    dom.ctx.translate(pX, pY);
    dom.ctx.rotate(obj.angle);
    dom.ctx.globalAlpha = obj.isTarget ? 1 : obj.opacity;
    dom.ctx.font = `${pS}px Inter,sans-serif`;
    dom.ctx.textAlign = 'center';
    dom.ctx.textBaseline = 'middle';
    dom.ctx.shadowColor = 'rgba(0,0,0,0.5)';
    dom.ctx.shadowBlur = 8;
    dom.ctx.shadowOffsetX = pS * 0.05;
    dom.ctx.shadowOffsetY = pS * 0.05;
    dom.ctx.fillText(obj.emoji, 0, 0);
    dom.ctx.restore();
}

function highlightFoundObject(obj) {
    const pX = obj.x * dom.canvas.width, pY = obj.y * dom.canvas.height, pS = obj.size * Math.min(dom.canvas.width, dom.canvas.height);
    dom.ctx.save();
    const pF = Math.abs(Math.sin(Date.now() / 200)) * 0.3 + 0.7;
    dom.ctx.strokeStyle = `rgba(74,222,128,${0.6 * pF})`;
    dom.ctx.lineWidth = (pS * 0.1) * pF;
    dom.ctx.beginPath();
    dom.ctx.arc(pX, pY, pS * (0.75 * pF), 0, Math.PI * 2);
    dom.ctx.stroke();
    dom.ctx.strokeStyle = `rgba(167,243,208,${0.8 * pF})`;
    dom.ctx.lineWidth = (pS * 0.05) * pF;
    dom.ctx.beginPath();
    dom.ctx.arc(pX, pY, pS * (0.65 * pF), 0, Math.PI * 2);
    dom.ctx.stroke();
    dom.ctx.restore();
}

export function handleCanvasInteraction(event) {
    event.preventDefault();
    const now = Date.now();
    if (now - state.lastClickTime < 100 || state.isRoundOver) return;
    state.lastClickTime = now;
    const rect = dom.canvas.getBoundingClientRect();
    const scaleX = dom.canvas.width / rect.width, scaleY = dom.canvas.height / rect.height;
    let cX, cY;
    if (event.touches && event.touches.length > 0) { cX = event.touches[0].clientX; cY = event.touches[0].clientY; } else { cX = event.clientX; cY = event.clientY; }
    const clX = (cX - rect.left) * scaleX, clY = (cY - rect.top) * scaleY;
    for (let i = state.gameObjects.length - 1; i >= 0; i--) {
        const obj = state.gameObjects[i];
        const oPX = obj.x * dom.canvas.width, oPY = obj.y * dom.canvas.height, oPS = obj.size * Math.min(dom.canvas.width, dom.canvas.height), hS = oPS / 2;
        const dist = Math.sqrt(Math.pow(clX - oPX, 2) + Math.pow(clY - oPY, 2));
        if (dist < hS * 0.75) {
            if (obj.isTarget && obj === state.targetItem) {
                obj.found = true;
                const timeTaken = Date.now() - state.objectFindStartTime;
                handleSessionEnd(true, timeTaken);
            } else {
                dom.ctx.save(); dom.ctx.fillStyle = 'rgba(255,0,0,0.3)'; dom.ctx.beginPath(); dom.ctx.arc(clX, clY, 15, 0, Math.PI * 2); dom.ctx.fill(); dom.ctx.restore();
            }
            return;
        }
    }
}
