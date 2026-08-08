// Pong Game - Classic 80s Style
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;

// Set canvas size
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Game constants
const PADDLE_WIDTH = 15;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;
const BASE_BALL_SPEED = 4;
const MAX_SCORE = 3;
const SPEED_INCREASE_INTERVAL = 15000; // 15 seconds

// Game state
let gameState = {
    running: true,
    paused: false,
    gameOver: false,
    winner: null,
    speedLevel: 1,
    lastSpeedIncrease: Date.now(),
    namePrompted: false
};

// Save high score to leaderboard
function saveHighScore() {
    if (gameState.namePrompted) return; // Prevent duplicate saves
    gameState.namePrompted = true;
    
    const playerName = prompt('You won! Enter your name for the leaderboard:', 'Player');
    if (playerName && playerName.trim()) {
        leaderboard.addScore('mickPong', playerName.trim(), player.score, gameState.speedLevel);
        alert('🏆 Score saved to leaderboard!');
    }
}

// Player paddle
let player = {
    x: CANVAS_WIDTH - PADDLE_WIDTH - 10,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 5,
    dy: 0,
    score: 0
};

// Opponent paddle (AI)
let opponent = {
    x: 10,
    y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 4,
    dy: 0,
    score: 0
};

// Ball
let ball = {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    radius: BALL_SIZE / 2,
    dx: BASE_BALL_SPEED,
    dy: BASE_BALL_SPEED,
    speed: BASE_BALL_SPEED
};

// Input handling
const keys = {};
window.addEventListener('keydown', (e) => {
    // Store key in lowercase for consistency (handles both 'w' and 'W', 's' and 'S')
    const key = e.key.toLowerCase();
    keys[key] = true;
    // Also store the original key for non-letter keys
    if (key !== e.key) {
        keys[e.key] = true;
    }
    if (e.key === 'Enter' && gameState.gameOver) {
        e.preventDefault();
        if (!gameState.namePrompted) {
            saveHighScore();
        } else {
            restartGame();
        }
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    keys[key] = false;
    if (key !== e.key) {
        keys[e.key] = false;
    }
});

// Mobile button controls
const btnUp = document.getElementById('btnUp');
const btnDown = document.getElementById('btnDown');
const btnRestart = document.getElementById('btnRestart');

let mobileUp = false;
let mobileDown = false;

btnUp.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mobileUp = true;
});

btnUp.addEventListener('touchend', (e) => {
    e.preventDefault();
    mobileUp = false;
});

btnUp.addEventListener('mousedown', () => { mobileUp = true; });
btnUp.addEventListener('mouseup', () => { mobileUp = false; });

btnDown.addEventListener('touchstart', (e) => {
    e.preventDefault();
    mobileDown = true;
});

btnDown.addEventListener('touchend', (e) => {
    e.preventDefault();
    mobileDown = false;
});

btnDown.addEventListener('mousedown', () => { mobileDown = true; });
btnDown.addEventListener('mouseup', () => { mobileDown = false; });

btnRestart.addEventListener('click', restartGame);
btnRestart.addEventListener('touchstart', (e) => {
    e.preventDefault();
    restartGame();
});

// Update game state
function update() {
    if (!gameState.running || gameState.gameOver) return;

    // Check for speed increase every 15 seconds
    if (Date.now() - gameState.lastSpeedIncrease > SPEED_INCREASE_INTERVAL) {
        gameState.speedLevel += 1;
        ball.speed = BASE_BALL_SPEED + (gameState.speedLevel - 1) * 0.5;
        gameState.lastSpeedIncrease = Date.now();
    }

    // Player paddle control (right side)
    if (keys['arrowup'] || keys['w'] || mobileUp) {
        player.y = Math.max(0, player.y - player.speed);
    }
    if (keys['arrowdown'] || keys['s'] || mobileDown) {
        player.y = Math.min(CANVAS_HEIGHT - player.height, player.y + player.speed);
    }

    // Opponent AI (left side) - follows ball
    const opponentCenter = opponent.y + opponent.height / 2;
    const ballCenter = ball.y;
    const aiDifficulty = 0.7 + (gameState.speedLevel * 0.05); // Slightly harder with speed level

    if (opponentCenter < ballCenter - 35) {
        opponent.y = Math.min(CANVAS_HEIGHT - opponent.height, opponent.y + opponent.speed * aiDifficulty);
    } else if (opponentCenter > ballCenter + 35) {
        opponent.y = Math.max(0, opponent.y - opponent.speed * aiDifficulty);
    }

    // Ball movement
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top/bottom walls
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > CANVAS_HEIGHT) {
        ball.dy = -ball.dy;
        ball.y = Math.max(ball.radius, Math.min(CANVAS_HEIGHT - ball.radius, ball.y));
    }

    // Ball collision with player paddle
    if (
        ball.x + ball.radius > player.x &&
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = -ball.speed;
        ball.x = player.x - ball.radius;
        // Add spin based on where ball hits paddle
        ball.dy = ((ball.y - (player.y + player.height / 2)) / (player.height / 2)) * ball.speed;
    }

    // Ball collision with opponent paddle
    if (
        ball.x - ball.radius < opponent.x + opponent.width &&
        ball.x + ball.radius > opponent.x &&
        ball.y > opponent.y &&
        ball.y < opponent.y + opponent.height
    ) {
        ball.dx = ball.speed;
        ball.x = opponent.x + opponent.width + ball.radius;
        // Add spin based on where ball hits paddle
        ball.dy = ((ball.y - (opponent.y + opponent.height / 2)) / (opponent.height / 2)) * ball.speed;
    }

    // Ball goes through left goal (player scores)
    if (ball.x < 0) {
        player.score++;
        if (player.score >= MAX_SCORE) {
            gameState.gameOver = true;
            gameState.winner = 'You Win!';
        } else {
            resetBall();
        }
    }

    // Ball goes through right goal (opponent scores)
    if (ball.x > CANVAS_WIDTH) {
        opponent.score++;
        if (opponent.score >= MAX_SCORE) {
            gameState.gameOver = true;
            gameState.winner = 'Game Over!\nOpponent Wins!';
        } else {
            resetBall();
        }
    }
}

// Reset ball to center
function resetBall() {
    ball.x = CANVAS_WIDTH / 2;
    ball.y = CANVAS_HEIGHT / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * ball.speed;
    ball.dy = (Math.random() * 2 - 1) * ball.speed;
}

// Restart game
function restartGame() {
    player.score = 0;
    opponent.score = 0;
    gameState.gameOver = false;
    gameState.winner = null;
    gameState.speedLevel = 1;
    gameState.lastSpeedIncrease = Date.now();
    ball.speed = BASE_BALL_SPEED;
    resetBall();
}

// Draw game
function draw() {
    // Clear canvas with black background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw center line (dashed)
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 0);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(opponent.x, opponent.y, opponent.width, opponent.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Draw scores
    ctx.font = 'bold 60px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(opponent.score, CANVAS_WIDTH / 4, 80);
    ctx.fillText(player.score, (CANVAS_WIDTH * 3) / 4, 80);

    // Draw speed level
    ctx.font = '16px Arial';
    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';
    ctx.fillText(`Speed: ${gameState.speedLevel}x`, CANVAS_WIDTH / 2, 30);

    // Draw game over screen
    if (gameState.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = gameState.winner.split('\n');
        const startY = CANVAS_HEIGHT / 2 - (lines.length * 40) / 2;
        lines.forEach((line, i) => {
            ctx.fillText(line, CANVAS_WIDTH / 2, startY + i * 60);
        });

        ctx.font = '24px Arial';
        ctx.fillStyle = '#fff';
        if (!gameState.namePrompted) {
            ctx.fillText('Press ENTER to save your score', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
        } else {
            ctx.fillText('Score saved! Press ENTER to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
        }
    }
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
gameLoop();
