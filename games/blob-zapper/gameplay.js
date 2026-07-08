import {
    TARGET_ASPECT_RATIO, NUM_BLOBS_START,
    MIN_BLOB_RADIUS_FACTOR, MAX_BLOB_RADIUS_FACTOR, BLOB_SPEED_FACTOR,
    TOUCH_REPULSION_FORCE, TOUCH_REPULSION_RADIUS_FACTOR, TENDRIL_MAX_DIST_FACTOR,
    TENDRIL_COLOR, BLOB_COLORS,
    DESTRUCTION_ZONE_RADIUS_FACTOR, DESTRUCTION_ZONE_COLOR_FILL, DESTRUCTION_ZONE_COLOR_STROKE,
    DESTRUCTION_ZONE_SPEED_FACTOR, BUTTON_PUSH_IMPULSE,
    ZAP_SHAKE_KICK, ZAP_SHAKE_MAX, ZAP_PARTICLE_COUNT,
    COMBO_WINDOW_MS, COMBO_MAX_MULTIPLIER, BASE_ZAP_SCORE,
} from './constants.js';
import { state, dom } from './state.js';

// --- Blob Class ---
class Blob {
    constructor(x, y, radius, color) {
        this.x = x; this.y = y; this.radius = radius; this.color = color;
        // Use calculated blobSpeed (with fallback)
        this.vx = (Math.random() - 0.5) * (state.blobSpeed || 0.1) * 2;
        this.vy = (Math.random() - 0.5) * (state.blobSpeed || 0.1) * 2;
    }
    update(deltaTime) {
        try {
            this.x += this.vx * deltaTime; this.y += this.vy * deltaTime;
            // Boundary Collision
            if (this.x - this.radius < 0) { this.x = this.radius; this.vx *= -0.8; }
            else if (this.x + this.radius > dom.canvas.width) { this.x = dom.canvas.width - this.radius; this.vx *= -0.8; }
            if (this.y - this.radius < 0) { this.y = this.radius; this.vy *= -0.8; }
            else if (this.y + this.radius > dom.canvas.height) { this.y = dom.canvas.height - this.radius; this.vy *= -0.8; }
            // Touch Repulsion
            state.touchPoints.forEach(touch => {
                const dx = this.x - touch.x; const dy = this.y - touch.y;
                const distSq = dx * dx + dy * dy;
                // Use calculated radius (with fallback)
                const repulsionRadiusSq = (state.touchRepulsionRadius || 50) * (state.touchRepulsionRadius || 50);
                if (distSq < repulsionRadiusSq && distSq > 1) {
                    const dist = Math.sqrt(distSq);
                    const force = (1 - dist / (state.touchRepulsionRadius || 50)) * TOUCH_REPULSION_FORCE;
                    const forceMultiplier = deltaTime / Math.max(1, this.radius / (state.minBlobRadius || 10));
                    this.vx += (dx / dist) * force * forceMultiplier;
                    this.vy += (dy / dist) * force * forceMultiplier;
                }
            });
            // Dampen & Wiggle
            this.vx *= 0.995; this.vy *= 0.995;
            this.vx += (Math.random() - 0.5) * (state.blobSpeed || 0.1) * 0.1 * deltaTime;
            this.vy += (Math.random() - 0.5) * (state.blobSpeed || 0.1) * 0.1 * deltaTime;
        } catch (error) { console.error("Error during Blob update:", error); }
    }
    draw() {
        try {
            dom.ctx.beginPath(); dom.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            dom.ctx.fillStyle = this.color; dom.ctx.fill();
        } catch (error) { console.error("Error during Blob draw:", error); }
    }
}

// --- Initialization ---
export function init() {
    console.log("Initializing game...");
    try {
        resizeCanvas(); // Sets dimensions and calculates relative sizes
        state.isGameOver = false;
        document.body.dataset.gameOver = "false";
        state.blobs = [];
        state.touchPoints = [];
        state.particles = [];
        state.shakeIntensity = 0;
        state.score = 0;
        state.comboCount = 0;
        state.comboMultiplier = 1;
        state.lastZapTime = -Infinity;
        state.comboFlashIntensity = 0;
        state.isNewBest = false;

        // Use calculated speed (with fallback)
        const initialSpeedX = (Math.random() - 0.5) * (state.destructionZoneSpeed || 0.1) * 2;
        const initialSpeedY = (Math.random() - 0.5) * (state.destructionZoneSpeed || 0.1) * 2;
        state.destructionZone.vx = isNaN(initialSpeedX) ? 0 : initialSpeedX;
        state.destructionZone.vy = isNaN(initialSpeedY) ? 0 : initialSpeedY;
        // Position/Radius set in resizeCanvas

        for (let i = 0; i < NUM_BLOBS_START; i++) {
            // Use calculated radii (with fallback)
            const radius = (state.minBlobRadius || 10) + Math.random() * ((state.maxBlobRadius || 30) - (state.minBlobRadius || 10));
            if (dom.canvas.width > radius * 2 && dom.canvas.height > radius * 2) {
                const x = radius + Math.random() * (dom.canvas.width - radius * 2);
                const y = radius + Math.random() * (dom.canvas.height - radius * 2);
                const color = BLOB_COLORS[Math.floor(Math.random() * BLOB_COLORS.length)];
                if (!isNaN(x) && !isNaN(y) && !isNaN(radius) && radius > 0) {
                    state.blobs.push(new Blob(x, y, radius, color));
                } else { console.warn("Skipped creating blob due to invalid calculated values"); }
            } else { console.warn("Canvas too small to create blobs"); break; }
        }
        console.log(`Created ${state.blobs.length} blobs.`);

        if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
        state.lastTime = performance.now();
        animate();
        console.log("Initialization complete. Animation started.");
    } catch (error) { console.error("Error during init:", error); }
}

// --- Canvas Resizing (Restored Aspect Ratio Logic) ---
export function resizeCanvas() {
    console.log("Resizing canvas (Aspect Ratio Aware)...");
    try {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const windowAspectRatio = windowWidth / windowHeight;

        let canvasWidth, canvasHeight;

        // Determine dimensions based on aspect ratio
        if (windowAspectRatio > TARGET_ASPECT_RATIO) {
            // Window is wider than target: Pillarbox (height constrained)
            canvasHeight = windowHeight;
            canvasWidth = canvasHeight * TARGET_ASPECT_RATIO;
        } else {
            // Window is taller than target: Letterbox (width constrained)
            canvasWidth = windowWidth;
            canvasHeight = canvasWidth / TARGET_ASPECT_RATIO;
        }

        // Ensure dimensions are integers and apply to canvas buffer
        dom.canvas.width = Math.max(1, Math.floor(canvasWidth));
        dom.canvas.height = Math.max(1, Math.floor(canvasHeight));

        // Apply dimensions to canvas element style for display size
        dom.canvas.style.width = dom.canvas.width + 'px';
        dom.canvas.style.height = dom.canvas.height + 'px';

        // --- Recalculate dynamic sizes based on new canvas dimensions ---
        const smallerDim = Math.min(dom.canvas.width, dom.canvas.height);
        state.minBlobRadius = Math.max(1, dom.canvas.height * MIN_BLOB_RADIUS_FACTOR);
        state.maxBlobRadius = Math.max(state.minBlobRadius + 1, dom.canvas.height * MAX_BLOB_RADIUS_FACTOR);
        state.blobSpeed = dom.canvas.height * BLOB_SPEED_FACTOR;
        state.touchRepulsionRadius = dom.canvas.height * TOUCH_REPULSION_RADIUS_FACTOR;
        state.tendrilMaxDist = dom.canvas.height * TENDRIL_MAX_DIST_FACTOR;
        state.destructionZoneRadius = Math.max(5, smallerDim * DESTRUCTION_ZONE_RADIUS_FACTOR);
        state.destructionZoneSpeed = smallerDim * DESTRUCTION_ZONE_SPEED_FACTOR;

        // Update destruction zone object
        state.destructionZone.radius = state.destructionZoneRadius;

        // Center zone or keep it within bounds
        if (!state.destructionZone.x || state.destructionZone.x === 0 || isNaN(state.destructionZone.x)) {
            state.destructionZone.x = dom.canvas.width / 2;
            state.destructionZone.y = dom.canvas.height / 2;
        } else {
            state.destructionZone.x = Math.max(state.destructionZone.radius, Math.min(dom.canvas.width - state.destructionZone.radius, state.destructionZone.x));
            state.destructionZone.y = Math.max(state.destructionZone.radius, Math.min(dom.canvas.height - state.destructionZone.radius, state.destructionZone.y));
        }
        console.log(`Canvas resized to ${dom.canvas.width}x${dom.canvas.height}. Zone radius: ${state.destructionZone.radius}`);
    } catch (error) { console.error("Error during resizeCanvas:", error); }
}

// --- Update Destruction Zone ---
function updateDestructionZone(deltaTime) {
    state.destructionZone.vx = isNaN(state.destructionZone.vx) ? 0 : state.destructionZone.vx;
    state.destructionZone.vy = isNaN(state.destructionZone.vy) ? 0 : state.destructionZone.vy;
    state.destructionZone.x = isNaN(state.destructionZone.x) ? dom.canvas.width / 2 : state.destructionZone.x;
    state.destructionZone.y = isNaN(state.destructionZone.y) ? dom.canvas.height / 2 : state.destructionZone.y;
    state.destructionZone.x += state.destructionZone.vx * deltaTime;
    state.destructionZone.y += state.destructionZone.vy * deltaTime;
    // Boundary Collision & Direction Change (logic remains same)
    if (state.destructionZone.x - state.destructionZone.radius < 0) { state.destructionZone.x = state.destructionZone.radius; state.destructionZone.vx *= -1; }
    else if (state.destructionZone.x + state.destructionZone.radius > dom.canvas.width) { state.destructionZone.x = dom.canvas.width - state.destructionZone.radius; state.destructionZone.vx *= -1; }
    if (state.destructionZone.y - state.destructionZone.radius < 0) { state.destructionZone.y = state.destructionZone.radius; state.destructionZone.vy *= -1; }
    else if (state.destructionZone.y + state.destructionZone.radius > dom.canvas.height) { state.destructionZone.y = dom.canvas.height - state.destructionZone.radius; state.destructionZone.vy *= -1; }
    if (Math.random() < 0.015) {
        const speedFactor = state.destructionZoneSpeed || 0.1; // Use calculated speed
        state.destructionZone.vx += (Math.random() - 0.5) * speedFactor * 0.6;
        state.destructionZone.vy += (Math.random() - 0.5) * speedFactor * 0.6;
        const speed = Math.sqrt(state.destructionZone.vx * state.destructionZone.vx + state.destructionZone.vy * state.destructionZone.vy);
        const maxSpeed = speedFactor * 1.5;
        if (speed > maxSpeed) { state.destructionZone.vx = (state.destructionZone.vx / speed) * maxSpeed; state.destructionZone.vy = (state.destructionZone.vy / speed) * maxSpeed; }
        const minSpeed = speedFactor * 0.5;
        if (speed < minSpeed && speed > 0) { state.destructionZone.vx = (state.destructionZone.vx / speed) * minSpeed; state.destructionZone.vy = (state.destructionZone.vy / speed) * minSpeed; }
        else if (speed === 0) { state.destructionZone.vx = (Math.random() - 0.5) * speedFactor; state.destructionZone.vy = (Math.random() - 0.5) * speedFactor; }
    }
}

// --- Combo Scoring ---
function registerZap(currentTime) {
    if (currentTime - state.lastZapTime <= COMBO_WINDOW_MS) {
        state.comboCount++;
    } else {
        state.comboCount = 1;
    }
    state.lastZapTime = currentTime;
    state.comboMultiplier = Math.min(COMBO_MAX_MULTIPLIER, state.comboCount);
    state.score += BASE_ZAP_SCORE * state.comboMultiplier;
    state.comboFlashIntensity = 1;
}

// --- Zap Feedback: particles + screen shake ---
function spawnZapParticles(x, y, color) {
    for (let i = 0; i < ZAP_PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        state.particles.push({
            x, y, color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.03 + Math.random() * 0.03,
            size: 2 + Math.random() * 2.5,
        });
    }
    state.shakeIntensity = Math.min(ZAP_SHAKE_MAX, state.shakeIntensity + ZAP_SHAKE_KICK);
}
function updateParticles(deltaTime) {
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * deltaTime; p.y += p.vy * deltaTime;
        p.vx *= 0.94; p.vy *= 0.94;
        p.life -= p.decay * deltaTime;
        if (p.life <= 0) state.particles.splice(i, 1);
    }
}
function drawParticles() {
    try {
        dom.ctx.globalCompositeOperation = 'source-over';
        state.particles.forEach(p => {
            dom.ctx.globalAlpha = Math.max(0, p.life);
            dom.ctx.beginPath(); dom.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            dom.ctx.fillStyle = p.color; dom.ctx.fill();
        });
        dom.ctx.globalAlpha = 1;
    } catch (error) { console.error("Error drawing particles:", error); }
}

// --- Drawing ---
function drawDestructionZone() {
    try {
        const remainingRatio = NUM_BLOBS_START > 0 ? state.blobs.length / NUM_BLOBS_START : 1;
        const urgency = 1 - remainingRatio; // rises toward 1 as blobs clear out
        const pulseSpeed = 0.003 + urgency * 0.006;
        const pulseAmp = 3 + urgency * 5;
        const pulse = Math.sin(performance.now() * pulseSpeed) * pulseAmp + pulseAmp;
        dom.ctx.globalCompositeOperation = 'source-over';
        dom.ctx.fillStyle = DESTRUCTION_ZONE_COLOR_FILL;
        dom.ctx.beginPath(); dom.ctx.arc(state.destructionZone.x, state.destructionZone.y, state.destructionZone.radius, 0, Math.PI * 2); dom.ctx.fill();
        const strokeAlpha = (0.5 + urgency * 0.5).toFixed(2);
        dom.ctx.strokeStyle = `rgba(255, ${Math.round(80 - urgency * 50)}, ${Math.round(80 - urgency * 50)}, ${strokeAlpha})`;
        dom.ctx.lineWidth = pulse;
        dom.ctx.beginPath(); dom.ctx.arc(state.destructionZone.x, state.destructionZone.y, state.destructionZone.radius, 0, Math.PI * 2); dom.ctx.stroke();
        dom.ctx.lineWidth = 1;
    } catch (error) { console.error("Error drawing destruction zone:", error); }
}
function drawTendrils() {
    try {
        dom.ctx.globalCompositeOperation = 'source-over'; dom.ctx.strokeStyle = TENDRIL_COLOR;
        dom.ctx.lineWidth = 1.5;
        const maxDist = state.tendrilMaxDist || 100; // Use calculated distance
        state.touchPoints.forEach(touch => {
            state.blobs.forEach(blob => {
                const dx = blob.x - touch.x; const dy = blob.y - touch.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < maxDist && dist > blob.radius * 0.5) {
                    dom.ctx.beginPath(); dom.ctx.moveTo(blob.x, blob.y); dom.ctx.lineTo(touch.x, touch.y); dom.ctx.stroke();
                }
            });
        });
    } catch (error) { console.error("Error drawing tendrils:", error); }
}
function drawBlobs() {
    try {
        dom.ctx.globalCompositeOperation = 'source-over'; // Use source-over for simplicity
        state.blobs.forEach(blob => blob.draw());
    } catch (error) { console.error("Error drawing blobs:", error); }
}
function drawScoreUI() {
    try {
        dom.ctx.globalCompositeOperation = 'source-over';
        dom.ctx.textAlign = 'left';
        dom.ctx.textBaseline = 'top';
        const fontSize = Math.max(14, Math.min(dom.canvas.width * 0.045, 22));
        dom.ctx.font = `bold ${fontSize}px Inter`;
        dom.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        dom.ctx.fillText(`Score: ${state.score}`, 12, 12);

        if (state.comboMultiplier > 1 && state.comboFlashIntensity > 0.01) {
            const comboFontSize = Math.max(18, Math.min(dom.canvas.width * 0.08, 42));
            dom.ctx.font = `bold ${comboFontSize}px Inter`;
            dom.ctx.fillStyle = `rgba(255, 220, 80, ${Math.min(1, state.comboFlashIntensity)})`;
            dom.ctx.textAlign = 'center';
            dom.ctx.save();
            dom.ctx.translate(dom.canvas.width / 2, dom.canvas.height * 0.14);
            dom.ctx.scale(1 + state.comboFlashIntensity * 0.3, 1 + state.comboFlashIntensity * 0.3);
            dom.ctx.fillText(`x${state.comboMultiplier} COMBO!`, 0, 0);
            dom.ctx.restore();
        }
    } catch (error) { console.error("Error drawing score UI:", error); }
}

function drawUI() {
    if (state.isGameOver) {
        try {
            dom.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            dom.ctx.fillRect(0, 0, dom.canvas.width, dom.canvas.height);
            dom.ctx.fillStyle = '#ff6b6b';
            const gameOverFontSize = Math.max(24, Math.min(dom.canvas.width * 0.1, 60));
            dom.ctx.font = `bold ${gameOverFontSize}px Inter`;
            dom.ctx.textAlign = 'center';
            dom.ctx.textBaseline = 'middle';
            dom.ctx.fillText('GAME OVER', dom.canvas.width / 2, dom.canvas.height / 2 - gameOverFontSize * 0.9);
            const scoreFontSize = Math.max(16, Math.min(dom.canvas.width * 0.05, 28));
            dom.ctx.font = `bold ${scoreFontSize}px Inter`;
            dom.ctx.fillStyle = '#ffffff';
            dom.ctx.fillText(`Score: ${state.score}`, dom.canvas.width / 2, dom.canvas.height / 2 - gameOverFontSize * 0.1);
            dom.ctx.fillStyle = state.isNewBest ? '#ffd76a' : 'rgba(255, 255, 255, 0.7)';
            const bestLabel = state.isNewBest ? `New Best! ${state.highScore}` : `Best: ${state.highScore}`;
            if (state.isNewBest) {
                const bestPulse = 1 + Math.sin(state.lastTime * 0.005) * 0.08;
                dom.ctx.save();
                dom.ctx.translate(dom.canvas.width / 2, dom.canvas.height / 2 + gameOverFontSize * 0.35);
                dom.ctx.scale(bestPulse, bestPulse);
                dom.ctx.fillText(bestLabel, 0, 0);
                dom.ctx.restore();
            } else {
                dom.ctx.fillText(bestLabel, dom.canvas.width / 2, dom.canvas.height / 2 + gameOverFontSize * 0.35);
            }
            const restartFontSize = Math.max(14, Math.min(dom.canvas.width * 0.04, 24));
            dom.ctx.font = `${restartFontSize}px Inter`;
            dom.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            dom.ctx.fillText('Tap to Restart', dom.canvas.width / 2, dom.canvas.height / 2 + gameOverFontSize * 0.9);
        } catch (error) { console.error("Error drawing game over UI:", error); }
    }
}

// --- Animation Loop ---
export function animate(currentTime = 0) {
    state.animationFrameId = requestAnimationFrame(animate);
    try {
        const elapsed = currentTime - state.lastTime;
        state.lastTime = currentTime;
        let deltaTime = elapsed / (1000 / 60);
        if (isNaN(deltaTime) || deltaTime <= 0) deltaTime = 1;
        deltaTime = Math.min(deltaTime, 5);

        dom.ctx.clearRect(0, 0, dom.canvas.width, dom.canvas.height);

        dom.ctx.save();
        if (state.shakeIntensity > 0.1) {
            const shakeX = (Math.random() - 0.5) * state.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * state.shakeIntensity;
            dom.ctx.translate(shakeX, shakeY);
            state.shakeIntensity *= 0.88;
        } else {
            state.shakeIntensity = 0;
        }
        state.comboFlashIntensity *= 0.9;
        if (state.comboFlashIntensity < 0.01) state.comboFlashIntensity = 0;

        if (!state.isGameOver) {
            updateDestructionZone(deltaTime);

            if (state.comboCount > 0 && currentTime - state.lastZapTime > COMBO_WINDOW_MS) {
                state.comboCount = 0;
                state.comboMultiplier = 1;
            }

            for (let i = state.blobs.length - 1; i >= 0; i--) {
                const blob = state.blobs[i];
                if (!blob) { continue; }
                blob.update(deltaTime);
                const dx = blob.x - state.destructionZone.x; const dy = blob.y - state.destructionZone.y;
                const distSq = dx * dx + dy * dy;
                // Use calculated radius
                if (distSq < (state.destructionZone.radius + blob.radius) * (state.destructionZone.radius + blob.radius)) {
                    spawnZapParticles(blob.x, blob.y, blob.color);
                    registerZap(currentTime);
                    state.blobs.splice(i, 1);
                }
            }

            if (state.blobs.length === 0 && NUM_BLOBS_START > 0) {
                console.log("Game Over condition met.");
                state.isGameOver = true;
                document.body.dataset.gameOver = "true";
                state.isNewBest = state.score > state.highScore;
                if (state.isNewBest) {
                    state.highScore = state.score;
                    localStorage.setItem('blobZapperHighScore', String(state.highScore));
                }
                if (window.KamekoTokens) window.KamekoTokens.earn(state.isNewBest ? 2 : 1, state.isNewBest ? 'blob-zapper new best' : 'blob-zapper finish');
            }

            drawDestructionZone();
            drawBlobs();
            drawTendrils();
            drawScoreUI();
        }

        updateParticles(deltaTime);
        drawParticles();

        dom.ctx.restore();
        drawUI(); // Draw UI last

    } catch (error) {
        console.error("Error in animation loop:", error);
        if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    }
}

// --- Button Push Logic ---
export function pushBlobsTowardsCenter() {
    if (state.isGameOver) return;
    console.log("Push button activated");
    state.blobs.forEach(blob => {
        const dx = state.destructionZone.x - blob.x; const dy = state.destructionZone.y - blob.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 1) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist; const ny = dy / dist;
            blob.vx += nx * BUTTON_PUSH_IMPULSE;
            blob.vy += ny * BUTTON_PUSH_IMPULSE;
        }
    });
}

// --- Input Handling ---
export function handlePointerDown(id, clientX, clientY) {
    if (state.isGameOver) {
        if (!window.KamekoTokens || !window.KamekoTokens.spend()) { if (window.KamekoTokens) window.KamekoTokens.toast(); return; }
        localStorage.setItem('lastPlayed_blobZapper', Date.now()); init(); return;
    }
    try {
        const rect = dom.canvas.getBoundingClientRect();
        if (!rect) { console.error("Canvas rect not found in handlePointerDown"); return; }
        const x = clientX - rect.left; const y = clientY - rect.top;
        if (x < 0 || x > dom.canvas.width || y < 0 || y > dom.canvas.height) return;
        const existingPoint = state.touchPoints.find(p => p.id === id);
        if (!existingPoint) state.touchPoints.push({ id, x, y });
        else { existingPoint.x = x; existingPoint.y = y; }
    } catch (error) { console.error("Error in handlePointerDown:", error); }
}
export function handlePointerMove(id, clientX, clientY) {
    if (state.isGameOver) return;
    try {
        const rect = dom.canvas.getBoundingClientRect();
        if (!rect) { console.error("Canvas rect not found in handlePointerMove"); return; }
        const x = clientX - rect.left; const y = clientY - rect.top;
        if (x >= 0 && x <= dom.canvas.width && y >= 0 && y <= dom.canvas.height) {
            const point = state.touchPoints.find(p => p.id === id);
            if (point) { point.x = x; point.y = y; }
        } else { handlePointerUp(id); }
    } catch (error) { console.error("Error in handlePointerMove:", error); }
}
export function handlePointerUp(id) {
    if (!state.isGameOver) {
        try { state.touchPoints = state.touchPoints.filter(p => p.id !== id); }
        catch (error) { console.error("Error in handlePointerUp:", error); state.touchPoints = []; }
    }
}
