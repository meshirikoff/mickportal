// Mick Band - Lifebelt Catching Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;

// Set canvas size
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game constants
const CHARACTER_SIZE = 80;
const LIFEBELT_RADIUS = 35;
const THROW_SPEED = 8;
const GRAVITY = 0.35;
const MAX_ROUNDS = 10;

// Character image
let characterImage = new Image();
characterImage.src = 'images/image_2.png';

// Game state
let gameState = {
    running: true,
    gameOver: false,
    round: 1,
    score: 0,
    hits: 0,
    misses: 0,
    difficulty: 1,
    gameWon: false,
    namePrompted: false
};

// Character object (bouncing up and down)
let character = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    width: CHARACTER_SIZE,
    height: CHARACTER_SIZE,
    velocityY: 0,
    speed: 2 + gameState.difficulty * 0.5,
    minY: 50,
    maxY: CANVAS_HEIGHT - 150,
    phase: 0,
    amplitude: 100,
    frequency: 0.03 + gameState.difficulty * 0.01
};

// Lifebelt object
let lifebelt = null;

// Throw controls
let throwControls = {
    angle: 45,  // Degrees, 0 = right, 90 = up
    power: 0,   // 0-100
    maxPower: 100,
    isCharging: false,
    chargeRate: 2  // Power per frame
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    // Store key in lowercase for consistency (handles both 'a' and 'A')
    const key = e.key.toLowerCase();
    keys[key] = true;
    // Also store the original key for non-letter keys
    if (key !== e.key) {
        keys[e.key] = true;
    }
    
    if (e.key === ' ') {
        e.preventDefault();
        if (!gameState.gameOver && !gameState.gameWon) {
            throwControls.isCharging = true;
            throwControls.power = 0;
        }
    }
    
    if (e.key === 'Enter') {
        e.preventDefault();
        if (gameState.gameOver && !gameState.gameWon) {
            restartGame();
        } else if (gameState.gameWon) {
            if (!gameState.namePrompted) {
                saveHighScore();
            } else {
                location.reload();
            }
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
    if (key !== e.key) {
        keys[e.key] = false;
    }
    
    if (e.key === ' ' && throwControls.isCharging && !gameState.gameOver && lifebelt === null) {
        e.preventDefault();
        throwControls.isCharging = false;
        throwLifebelt();
    }
});

// Mobile button
const btnThrow = document.getElementById('btnThrow');
let mobileCharging = false;

btnThrow.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameState.gameOver && !gameState.gameWon && lifebelt === null) {
        mobileCharging = true;
        throwControls.isCharging = true;
        throwControls.power = 0;
    }
});

btnThrow.addEventListener('touchend', (e) => {
    e.preventDefault();
    if (mobileCharging) {
        mobileCharging = false;
        throwControls.isCharging = false;
        throwLifebelt();
    }
});

btnThrow.addEventListener('mousedown', () => {
    if (!gameState.gameOver && !gameState.gameWon && lifebelt === null) {
        mobileCharging = true;
        throwControls.isCharging = true;
        throwControls.power = 0;
    }
});

btnThrow.addEventListener('mouseup', () => {
    if (mobileCharging) {
        mobileCharging = false;
        throwControls.isCharging = false;
        throwLifebelt();
    }
});

// Throw lifebelt
function throwLifebelt() {
    if (lifebelt !== null || throwControls.power === 0) return; // Already thrown or no power

    const throwX = CANVAS_WIDTH / 2;
    const throwY = CANVAS_HEIGHT - 80;

    // Convert angle to radians
    const angleRad = (throwControls.angle * Math.PI) / 180;
    
    // Calculate velocity based on angle and power
    const speed = (throwControls.power / throwControls.maxPower) * THROW_SPEED * 2; // Up to 2x base speed
    const vx = Math.cos(angleRad) * speed;
    const vy = -Math.sin(angleRad) * speed;  // Negative because canvas Y increases downward
    
    lifebelt = {
        x: throwX,
        y: throwY,
        vx: vx,
        vy: vy,
        radius: LIFEBELT_RADIUS,
        trail: []
    };
    
    // Reset power
    throwControls.power = 0;
}

// Save high score to leaderboard
function saveHighScore() {
    if (gameState.namePrompted) return;
    gameState.namePrompted = true;
    
    const playerName = prompt('You Won! Enter your name for the leaderboard:', 'Player');
    if (playerName && playerName.trim()) {
        leaderboard.addScore('mickBand', playerName.trim(), gameState.score, gameState.round);
        alert('🏆 Score saved to leaderboard!');
    }
}

// Update game state
function update() {
    if (!gameState.running || gameState.gameOver) return;

    // Update angle based on arrow keys (normalized to lowercase for iPad compatibility)
    if (keys['arrowleft'] || keys['a']) {
        throwControls.angle = Math.min(180, throwControls.angle + 2);
    }
    if (keys['arrowright'] || keys['d']) {
        throwControls.angle = Math.max(0, throwControls.angle - 2);
    }

    // Update power when charging
    if (throwControls.isCharging && throwControls.power < throwControls.maxPower) {
        throwControls.power += throwControls.chargeRate;
    }

    // Update character position (sine wave motion)
    character.phase += character.frequency;
    character.y = CANVAS_HEIGHT / 2 + Math.sin(character.phase) * character.amplitude;

    // Keep character in bounds
    if (character.y < character.minY) character.y = character.minY;
    if (character.y > character.maxY) character.y = character.maxY;

    // Update lifebelt
    if (lifebelt !== null) {
        // Apply gravity
        lifebelt.vy += GRAVITY;

        // Update position
        lifebelt.x += lifebelt.vx;
        lifebelt.y += lifebelt.vy;

        // Store trail for visual effect
        lifebelt.trail.push({ x: lifebelt.x, y: lifebelt.y });
        if (lifebelt.trail.length > 20) {
            lifebelt.trail.shift();
        }

        // Check collision with character (neck area)
        const neckX = character.x + character.width / 2;
        const neckY = character.y + character.height / 4;
        const neckRadius = character.width / 3;

        const distToNeck = Math.sqrt(
            Math.pow(lifebelt.x - neckX, 2) +
            Math.pow(lifebelt.y - neckY, 2)
        );

        if (distToNeck < lifebelt.radius + neckRadius) {
            // HIT!
            gameState.hits++;
            gameState.score += 100 * gameState.difficulty;
            lifebelt = null;

            // Next round
            gameState.round++;
            if (gameState.round > MAX_ROUNDS) {
                gameState.gameWon = true;
                gameState.running = false;
            } else {
                increaseDifficulty();
            }
        }

        // Check if lifebelt went off screen
        if (
            lifebelt.x < -100 ||
            lifebelt.x > CANVAS_WIDTH + 100 ||
            lifebelt.y > CANVAS_HEIGHT + 100
        ) {
            gameState.misses++;
            lifebelt = null;
            
            // Game over after 3 misses
            if (gameState.misses >= 3) {
                gameState.gameOver = true;
                gameState.running = false;
            }
        }
    }
}

// Increase difficulty
function increaseDifficulty() {
    gameState.difficulty = Math.floor((gameState.round - 1) / 3) + 1;
    character.frequency = 0.03 + gameState.difficulty * 0.01;
    character.amplitude = 100 - gameState.difficulty * 10;
}

// Draw game
function draw() {
    // Draw water background
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw water waves effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50 + i * 30, 100 + i * 50, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw sand/pool bottom
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);

    // Draw character
    if (characterImage.complete) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(
            characterImage,
            character.x - character.width / 2,
            character.y - character.height / 2,
            character.width,
            character.height
        );
        ctx.restore();
    } else {
        // Fallback if image not loaded
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(
            character.x - character.width / 2,
            character.y - character.height / 2,
            character.width,
            character.height
        );
    }

    // Draw neck target area (for debugging/reference)
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
        character.x + character.width / 2,
        character.y + character.height / 4,
        character.width / 3,
        0,
        Math.PI * 2
    );
    ctx.stroke();

    // Draw lifebelt trail
    if (lifebelt !== null && lifebelt.trail.length > 1) {
        ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lifebelt.trail[0].x, lifebelt.trail[0].y);
        for (let i = 1; i < lifebelt.trail.length; i++) {
            ctx.lineTo(lifebelt.trail[i].x, lifebelt.trail[i].y);
        }
        ctx.stroke();
    }

    // Draw lifebelt
    if (lifebelt !== null) {
        ctx.strokeStyle = '#FF8C00';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(lifebelt.x, lifebelt.y, lifebelt.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner decoration
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lifebelt.x, lifebelt.y, lifebelt.radius - 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw HUD
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, 400, 100);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`Score: ${gameState.score}`, 20, 30);
    ctx.fillText(`Round: ${gameState.round}/${MAX_ROUNDS}`, 20, 55);
    ctx.fillText(`Hits: ${gameState.hits} | Misses: ${gameState.misses}/3`, 20, 80);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`Difficulty: ${'⭐'.repeat(gameState.difficulty)}`, 320, 30);

    // Draw throw launcher (bottom center) with direction indicator
    const launcherX = CANVAS_WIDTH / 2;
    const launcherY = CANVAS_HEIGHT - 80;
    
    // Draw launcher base
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(launcherX - 30, launcherY - 10, 60, 20);
    
    // Draw direction arrows
    const angleRad = (throwControls.angle * Math.PI) / 180;
    const arrowLength = 60;
    const arrowEndX = launcherX + Math.cos(angleRad) * arrowLength;
    const arrowEndY = launcherY - Math.sin(angleRad) * arrowLength;
    
    ctx.strokeStyle = throwControls.isCharging ? '#FF6B6B' : '#FFD700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(launcherX, launcherY);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();
    
    // Arrow head
    const arrowSize = 15;
    const angle1 = angleRad + Math.PI * 0.85;
    const angle2 = angleRad - Math.PI * 0.85;
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(arrowEndX + Math.cos(angle1) * arrowSize, arrowEndY - Math.sin(angle1) * arrowSize);
    ctx.lineTo(arrowEndX + Math.cos(angle2) * arrowSize, arrowEndY - Math.sin(angle2) * arrowSize);
    ctx.closePath();
    ctx.fillStyle = throwControls.isCharging ? '#FF6B6B' : '#FFD700';
    ctx.fill();

    // Draw power meter
    const powerBarWidth = 200;
    const powerBarHeight = 20;
    const powerBarX = CANVAS_WIDTH / 2 - powerBarWidth / 2;
    const powerBarY = CANVAS_HEIGHT - 50;
    
    // Power bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(powerBarX - 5, powerBarY - 5, powerBarWidth + 10, powerBarHeight + 10);
    
    // Power bar border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(powerBarX, powerBarY, powerBarWidth, powerBarHeight);
    
    // Power bar fill
    if (throwControls.isCharging) {
        const powerPercent = throwControls.power / throwControls.maxPower;
        ctx.fillStyle = powerPercent < 0.5 ? '#00FF00' : (powerPercent < 0.8 ? '#FFAA00' : '#FF0000');
        ctx.fillRect(powerBarX, powerBarY, powerBarWidth * powerPercent, powerBarHeight);
    }
    
    // Power text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`POWER: ${Math.round((throwControls.power / throwControls.maxPower) * 100)}%`, powerBarX + powerBarWidth / 2, powerBarY + 28);

    // Draw instructions
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(CANVAS_WIDTH - 400, 0, 400, 100);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('← ARROW LEFT/RIGHT → to aim', CANVAS_WIDTH - 20, 25);
    ctx.fillText('SPACE to charge power', CANVAS_WIDTH - 20, 45);
    ctx.fillText('Release SPACE to throw', CANVAS_WIDTH - 20, 65);
    ctx.fillText('Aim for the neck! ⭕', CANVAS_WIDTH - 20, 85);
    ctx.textAlign = 'left';

    // Draw game over screen
    if (gameState.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FF6B6B';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '28px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillText(`Successful Catches: ${gameState.hits}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

        ctx.font = '20px Arial';
        ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);

        ctx.textAlign = 'left';
    }

    // Draw game won screen
    if (gameState.gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('YOU WIN! 🏆', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.fillText(`Perfect Catches: ${gameState.hits}/${MAX_ROUNDS}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

        if (!gameState.namePrompted) {
            ctx.font = '20px Arial';
            ctx.fillText('Press ENTER to save your score', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
        } else {
            ctx.fillText('Score saved! Press ENTER to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
        }

        ctx.textAlign = 'left';
    }
}

// Restart game
function restartGame() {
    gameState = {
        running: true,
        gameOver: false,
        round: 1,
        score: 0,
        hits: 0,
        misses: 0,
        difficulty: 1,
        gameWon: false,
        namePrompted: false
    };

    character = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        width: CHARACTER_SIZE,
        height: CHARACTER_SIZE,
        velocityY: 0,
        speed: 2 + gameState.difficulty * 0.5,
        minY: 50,
        maxY: CANVAS_HEIGHT - 150,
        phase: 0,
        amplitude: 100,
        frequency: 0.03
    };

    throwControls = {
        angle: 45,
        power: 0,
        maxPower: 100,
        isCharging: false,
        chargeRate: 2
    };

    lifebelt = null;
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();
