// Game Constants
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 600;
const GROUND_HEIGHT = 180;
const GROUND_Y = CANVAS_HEIGHT - GROUND_HEIGHT;

// Game State
const gameState = {
    level: 1,
    score: 0,
    gameOver: false,
    gameWon: false,
    namePrompted: false
};

// Save high score to leaderboard
function saveHighScore() {
    if (gameState.namePrompted) return; // Prevent duplicate saves
    gameState.namePrompted = true;
    
    const playerName = prompt('You Won! Enter your name for the leaderboard:', 'Player');
    if (playerName && playerName.trim()) {
        leaderboard.addScore('mickBlock', playerName.trim(), gameState.score, player.playerLevel);
        alert('🏆 Score saved to leaderboard!');
    }
}

// Player Object
const player = {
    x: 100,
    y: GROUND_Y - 60,
    width: 60,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    speed: 5,
    jumpPower: 12,
    gravity: 0.6,
    isGrounded: true,
    hp: 100,
    maxHp: 100,
    direction: 1,  // 1 for right, -1 for left
    isBlocking: false,
    blockDuration: 0,
    blockMaxDuration: 2000,  // 2 seconds in milliseconds
    blockCooldown: 0,
    blockMaxCooldown: 2000,  // 2 seconds cooldown
    experience: 0,
    playerLevel: 1
};

// Ground Object
const ground = {
    x: 0,
    y: GROUND_Y,
    width: CANVAS_WIDTH,
    height: GROUND_HEIGHT,
    velocityX: 0,
    velocityY: 0,
    gravity: 0.4,
    friction: 0.95,
    mass: 1000,  // Heavy object
    isMovable: false,
    color: '#228B22',
    borderColor: '#1a6b1a'
};

// Stick Weapon Object
const stick = {
    x: player.x + player.width,
    y: player.y + 15,
    width: 20,
    height: 8,
    isActive: false,
    speed: 8,
    maxDistance: 150,
    distanceTraveled: 0,
    direction: 1,
    damage: 25,
    swingAngle: 0,      // Current angle of swing
    swingDuration: 0,   // How long swing has been active
    swingMaxDuration: 300  // Swing lasts 300ms
};

// Gun Weapon Object (unlocked at player level 2)
const gun = {
    x: player.x + player.width,
    y: player.y + 15,
    width: 15,
    height: 8,
    isActive: false,
    direction: 1,
    damage: 15,
    shootCooldown: 0,
    shootMaxCooldown: 300,  // Fire rate
    projectiles: [],  // Gun's own projectiles
    firePressed: false  // Track if player manually pressed fire
};

// Enemy Object
const enemy = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    velocityX: 0,
    velocityY: 0,
    hp: 0,
    maxHp: 0,
    speed: 0,
    jumpPower: 0,
    gravity: 0.6,
    isGrounded: true,
    damage: 0,
    attackCooldown: 0,
    lastAttackTime: 0,
    isActive: false
};

// Projectiles Array (for enemy attacks)
const projectiles = [];

// Rockets Array (for rocket explosions)
const rockets = [];

// Input Handling
const keys = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    a: false,
    d: false,
    ' ': false,
    c: false
};

// Initialize Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load player sprite sheet
const playerImage = new Image();
playerImage.crossOrigin = 'anonymous';
playerImage.src = 'images/player_spritesheet.png';

// Log image loading for debugging
playerImage.onload = function() {
    console.log('Player sprite sheet loaded successfully!', this.width, 'x', this.height);
};

playerImage.onerror = function() {
    console.error('Failed to load player sprite sheet from:', playerImage.src);
};

// Sprite sheet configuration
const SPRITE_SHEET = {
    frameWidth: 100,
    frameHeight: 80,
    cols: 4,
    rows: 7,
    animations: {
        idle: { frames: [0, 1], speed: 0.04 },           // Row 0: idle poses
        walk: { frames: [4, 5, 6, 7, 8, 9, 10, 11], speed: 0.06 },  // Rows 1-2: walking cycle
        swordAttack: { frames: [12, 13, 14, 15, 16, 17, 18, 19], speed: 0.05 }, // Rows 3-4: sword swing
        gunShoot: { frames: [20, 21, 22, 23, 24, 25, 26, 27], speed: 0.04 },     // Rows 4-5: gun shooting
        block: { frames: [28, 29], speed: 0.04 },        // Row 6: blocking
        jump: { frames: [30, 31], speed: 0.05 }         // Row 6: jumping
    }
};

// Player animation state
const animationState = {
    currentAnimation: 'idle',
    frameIndex: 0,
    frameCounter: 0
};

// Function to initialize a level with an enemy
function initializeLevel() {
    const levelStats = {
        1: {
            hp: 50,
            speed: 2,
            damage: 10,
            jumpPower: 8,
            attackCooldown: 60,
            weaponType: 'stick'
        },
        2: {
            hp: 75,
            speed: 3.5,
            damage: 15,
            jumpPower: 8,
            attackCooldown: 50,
            weaponType: 'stick'
        },
        3: {
            hp: 100,
            speed: 2,
            damage: 12,
            jumpPower: 8,
            attackCooldown: 40,
            weaponType: 'projectile'
        },
        4: {
            hp: 125,
            speed: 2.5,
            damage: 18,
            jumpPower: 8,
            attackCooldown: 35,
            weaponType: 'projectile'
        },
        5: {
            hp: 150,
            speed: 3,
            damage: 20,
            jumpPower: 8,
            attackCooldown: 30,
            weaponType: 'dual-guns'
        },
        6: {
            hp: 175,
            speed: 3.2,
            damage: 22,
            jumpPower: 9,
            attackCooldown: 28,
            weaponType: 'dual-guns'
        },
        7: {
            hp: 200,
            speed: 3.5,
            damage: 25,
            jumpPower: 9,
            attackCooldown: 25,
            weaponType: 'dual-guns'
        },
        8: {
            hp: 225,
            speed: 3.8,
            damage: 28,
            jumpPower: 9,
            attackCooldown: 22,
            weaponType: 'triple-guns'
        },
        9: {
            hp: 250,
            speed: 4,
            damage: 30,
            jumpPower: 10,
            attackCooldown: 20,
            weaponType: 'triple-guns'
        },
        10: {
            hp: 300,
            speed: 4.2,
            damage: 35,
            jumpPower: 10,
            attackCooldown: 18,
            weaponType: 'triple-guns'
        },
        11: {
            hp: 325,
            speed: 4.3,
            damage: 38,
            jumpPower: 10,
            attackCooldown: 16,
            weaponType: 'rocket'
        },
        12: {
            hp: 350,
            speed: 4.5,
            damage: 40,
            jumpPower: 11,
            attackCooldown: 15,
            weaponType: 'rocket'
        },
        13: {
            hp: 375,
            speed: 4.7,
            damage: 42,
            jumpPower: 11,
            attackCooldown: 14,
            weaponType: 'rocket'
        },
        14: {
            hp: 400,
            speed: 4.9,
            damage: 45,
            jumpPower: 11,
            attackCooldown: 13,
            weaponType: 'rocket'
        },
        15: {
            hp: 450,
            speed: 5,
            damage: 50,
            jumpPower: 12,
            attackCooldown: 12,
            weaponType: 'rocket'
        },
        16: {
            hp: 475,
            speed: 5.1,
            damage: 52,
            jumpPower: 12,
            attackCooldown: 11,
            weaponType: 'rocket'
        },
        17: {
            hp: 500,
            speed: 5.3,
            damage: 55,
            jumpPower: 12,
            attackCooldown: 10,
            weaponType: 'rocket'
        },
        18: {
            hp: 525,
            speed: 5.5,
            damage: 58,
            jumpPower: 13,
            attackCooldown: 9,
            weaponType: 'rocket'
        },
        19: {
            hp: 550,
            speed: 5.7,
            damage: 60,
            jumpPower: 13,
            attackCooldown: 8,
            weaponType: 'rocket'
        },
        20: {
            hp: 600,
            speed: 5.9,
            damage: 65,
            jumpPower: 13,
            attackCooldown: 7,
            weaponType: 'rocket'
        }
    };

    const stats = levelStats[gameState.level] || levelStats[5];

    enemy.x = CANVAS_WIDTH - 150;
    enemy.y = GROUND_Y - 40;
    enemy.width = 40;
    enemy.height = 40;
    enemy.hp = stats.hp;
    enemy.maxHp = stats.hp;
    enemy.speed = stats.speed;
    enemy.jumpPower = stats.jumpPower;
    enemy.damage = stats.damage;
    enemy.attackCooldown = stats.attackCooldown;
    enemy.lastAttackTime = 0;
    enemy.velocityX = 0;
    enemy.velocityY = 0;
    enemy.isGrounded = false;
    enemy.weaponType = stats.weaponType;
    enemy.isActive = true;
    
    projectiles.length = 0; // Clear projectiles
    rockets.length = 0; // Clear rockets
    gun.projectiles.length = 0; // Clear gun projectiles
    stick.isActive = false; // Disable stick when level changes
    gun.shootCooldown = gun.shootMaxCooldown; // Reset gun cooldown
    
    // Unlock gun on level 2+
    if (gameState.level >= 2) {
        player.playerLevel = Math.max(player.playerLevel, 2);
    }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
    if (e.key.toLowerCase() === 'a') keys.a = true;
    if (e.key.toLowerCase() === 'd') keys.d = true;
    if (e.key.toLowerCase() === 'c') keys.c = true;
    
    // Jump with Up arrow
    if (e.key === 'ArrowUp' && player.isGrounded) {
        player.velocityY = -player.jumpPower;
        player.isGrounded = false;
    }
    
    // Attack with Space
    if (e.key === ' ') {
        e.preventDefault();
        
        // If gun is unlocked (level 2+), shoot gun instead of stick
        if (player.playerLevel >= 2 && gun.shootCooldown <= 0) {
            const directionToEnemy = enemy.x > player.x ? 1 : -1;
            gun.projectiles.push({
                x: player.x + (directionToEnemy > 0 ? player.width : 0),
                y: player.y + 15,
                width: 6,
                height: 6,
                velocityX: 7 * directionToEnemy,
                velocityY: 0,
                damage: gun.damage,
                maxDistance: 500,
                distanceTraveled: 0,
                playerFired: true  // Mark that player manually fired this
            });
            gun.shootCooldown = gun.shootMaxCooldown;
        } else if (player.playerLevel < 2 && !stick.isActive) {
            // Only allow stick if gun isn't available
            stick.isActive = true;
            stick.swingDuration = 0;
            stick.swingAngle = player.direction > 0 ? -45 : 45;
            stick.direction = player.direction;
        }
    }
    
    // Restart game on game over
    if (gameState.gameOver && e.key === 'Enter') {
        location.reload();
    }
    
    // Handle game won - save high score
    if (gameState.gameWon && e.key === 'Enter') {
        if (!gameState.namePrompted) {
            saveHighScore();
        } else {
            location.reload();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
    if (e.key.toLowerCase() === 'a') keys.a = false;
    if (e.key.toLowerCase() === 'd') keys.d = false;
    if (e.key.toLowerCase() === 'c') keys.c = false;
});

// Ground Physics
function updateGroundPhysics() {
    // Apply gravity to ground if movable
    if (ground.isMovable) {
        ground.velocityY += ground.gravity;
        ground.velocityX *= ground.friction;  // Apply friction
        
        // Update ground position
        ground.y += ground.velocityY;
        ground.x += ground.velocityX;
        
        // Keep ground within canvas bounds
        if (ground.y + ground.height >= CANVAS_HEIGHT) {
            ground.y = CANVAS_HEIGHT - ground.height;
            ground.velocityY = 0;
        }
        if (ground.x < 0) ground.x = 0;
        if (ground.x + ground.width > CANVAS_WIDTH) ground.x = CANVAS_WIDTH - ground.width;
    }
}

// Update Game State
function update() {
    if (gameState.gameOver || gameState.gameWon) return;

    // Update ground physics
    updateGroundPhysics();

    // Handle player movement
    if (keys.ArrowLeft || keys.a) {
        player.velocityX = -player.speed;
        player.direction = -1;  // Face left
    } else if (keys.ArrowRight || keys.d) {
        player.velocityX = player.speed;
        player.direction = 1;   // Face right
    } else {
        player.velocityX = 0;
    }
    
    // Apply gravity
    player.velocityY += player.gravity;
    
    // Update player position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Keep player within canvas bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > CANVAS_WIDTH) player.x = CANVAS_WIDTH - player.width;
    
    // Check if player is on ground
    if (player.y + player.height >= ground.y) {
        player.y = ground.y - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
    } else {
        player.isGrounded = false;
    }
    
    // Handle blocking
    if (keys.c && player.blockCooldown <= 0) {
        player.isBlocking = true;
        player.blockDuration += 16;  // ~16ms per frame
        
        // Check if block duration exceeded
        if (player.blockDuration >= player.blockMaxDuration) {
            player.isBlocking = false;
            player.blockDuration = 0;
            player.blockCooldown = player.blockMaxCooldown;
        }
    } else {
        player.isBlocking = false;
        player.blockDuration = 0;
        
        // Update cooldown
        if (player.blockCooldown > 0) {
            player.blockCooldown -= 16;
        }
    }
    
    // Reduce damage taken while blocking
    // This will be handled in projectile collision
    
    // Update stick weapon (swinging melee attack) - only if gun not available
    if (stick.isActive && player.playerLevel < 2) {
        stick.swingDuration += 16;  // ~16ms per frame
        
        // Animate swing: start at -45°, swing to 45°
        if (stick.direction > 0) {
            stick.swingAngle = -45 + (stick.swingDuration / stick.swingMaxDuration) * 90;
        } else {
            stick.swingAngle = 45 - (stick.swingDuration / stick.swingMaxDuration) * 90;
        }
        
        // End swing after max duration
        if (stick.swingDuration >= stick.swingMaxDuration) {
            stick.isActive = false;
            stick.swingDuration = 0;
        }
        
        // Check collision with enemy during swing
        if (stick.isActive && checkCollision(getStickBounds(), enemy)) {
            enemy.hp -= stick.damage;
            stick.isActive = false;
        }
    }
    
    // Update gun weapon (unlocked at player level 2) - now fires on space key
    if (player.playerLevel >= 2) {
        gun.shootCooldown -= 16;
    }
    
    // Update gun projectiles
    for (let i = gun.projectiles.length - 1; i >= 0; i--) {
        const proj = gun.projectiles[i];
        proj.x += proj.velocityX;
        proj.y += proj.velocityY;
        proj.distanceTraveled += Math.abs(proj.velocityX);
        
        // Only check collision if projectile was manually fired by player
        if (proj.playerFired && proj.distanceTraveled > 5 && checkCollision(proj, enemy)) {
            enemy.hp -= proj.damage;
            gun.projectiles.splice(i, 1);
            continue;
        }
        
        // Remove projectile if it's traveled too far or off screen
        if (proj.distanceTraveled > proj.maxDistance || proj.x < 0 || proj.x > CANVAS_WIDTH) {
            gun.projectiles.splice(i, 1);
        }
    }
    
    // Update enemy
    if (enemy.isActive) {
        updateEnemy();
        
        // Check if enemy is defeated
        if (enemy.hp <= 0) {
            gameState.level++;
            gameState.score += 100 * gameState.level;
            
            // Add experience points (1 point per enemy defeated)
            player.experience += 1;
            
            // Check player leveling (10 points per level)
            player.playerLevel = Math.floor(player.experience / 10) + 1;
            
            // Check if player won the game (completed level 20)
            if (gameState.level > 20) {
                gameState.gameWon = true;
            } else {
                initializeLevel();
            }
        }
    }
    
    // Update projectiles
    updateProjectiles();
    
    // Check if player was hit by projectiles
    projectiles.forEach((proj, index) => {
        if (checkCollision(proj, player)) {
            // If blocking, bounce projectile back at enemy
            if (player.isBlocking) {
                proj.velocityX = -proj.velocityX;  // Reverse direction
                proj.velocityY = -proj.velocityY;
                proj.isReflected = true;           // Mark as reflected
            } else {
                // Take damage if not blocking
                player.hp -= proj.damage;
                projectiles.splice(index, 1);
                if (player.hp <= 0) {
                    gameState.gameOver = true;
                }
            }
        }
    });
    
    // Check if player was hit by rockets
    rockets.forEach((rocket, index) => {
        if (checkCollision(rocket, player) && !rocket.hasExploded) {
            // Rockets damage the shield and deal 10% additional damage
            rocket.hasExploded = true;
            const explosionDamage = rocket.damage + (player.maxHp * 0.1);
            
            if (player.isBlocking) {
                // Rockets pierce through shield with bonus damage
                player.blockDuration = 0;  // Stun the shield
                player.isBlocking = false;
                player.hp -= explosionDamage * 0.5;  // Half damage through shield
            } else {
                // Full damage if not blocking
                player.hp -= explosionDamage;
            }
            
            if (player.hp <= 0) {
                gameState.gameOver = true;
            }
        }
    });
    
    // Check if reflected projectiles hit enemy
    projectiles.forEach((proj, index) => {
        if (proj.isReflected && checkCollision(proj, enemy)) {
            enemy.hp -= proj.damage;
            projectiles.splice(index, 1);
        }
    });
    
    // Update rockets
    for (let i = rockets.length - 1; i >= 0; i--) {
        const rocket = rockets[i];
        rocket.x += rocket.velocityX;
        rocket.y += rocket.velocityY;
        rocket.distanceTraveled += Math.abs(rocket.velocityX);
        
        // Check if rocket hits enemy
        if (!rocket.hasExploded && checkCollision(rocket, enemy)) {
            rocket.hasExploded = true;
            const explosionDamage = rocket.damage + (enemy.maxHp * 0.1);
            enemy.hp -= explosionDamage;
        }
        
        // Remove rocket if traveled too far or exploded
        if (rocket.distanceTraveled > rocket.maxDistance || rocket.x < 0 || rocket.x > CANVAS_WIDTH || rocket.hasExploded) {
            rockets.splice(i, 1);
        }
    }
}

// Enemy AI Update
function updateEnemy() {
    // Simple AI: Move towards player
    if (enemy.x > player.x + 50) {
        enemy.velocityX = -enemy.speed;
    } else if (enemy.x < player.x - 50) {
        enemy.velocityX = enemy.speed;
    } else {
        enemy.velocityX = 0;
    }
    
    // Apply gravity
    enemy.velocityY += enemy.gravity;
    
    // Update position
    enemy.x += enemy.velocityX;
    enemy.y += enemy.velocityY;
    
    // Keep in bounds
    if (enemy.x < 0) enemy.x = 0;
    if (enemy.x + enemy.width > CANVAS_WIDTH) enemy.x = CANVAS_WIDTH - enemy.width;
    
    // Ground collision
    if (enemy.y + enemy.height >= ground.y) {
        enemy.y = ground.y - enemy.height;
        enemy.velocityY = 0;
        enemy.isGrounded = true;
    } else {
        enemy.isGrounded = false;
    }
    
    // Random jumping
    if (Math.random() < 0.01 && enemy.isGrounded) {
        enemy.velocityY = -enemy.jumpPower;
    }
    
    // Attack logic
    if (Date.now() - enemy.lastAttackTime > enemy.attackCooldown * 16) {
        if (enemy.weaponType === 'stick') {
            // Enemy throws a stick at player
            if (Math.abs(enemy.x - player.x) < 100 && enemy.isGrounded) {
                player.hp -= enemy.damage;
                enemy.lastAttackTime = Date.now();
            }
        } else if (enemy.weaponType === 'projectile') {
            // Shoot projectile towards player
            const directionToPlayer = player.x > enemy.x ? 1 : -1;
            projectiles.push({
                x: enemy.x + (directionToPlayer > 0 ? enemy.width : 0),
                y: enemy.y + 15,
                width: 8,
                height: 8,
                velocityX: 5 * directionToPlayer,
                velocityY: 0,
                damage: enemy.damage,
                maxDistance: 400,
                distanceTraveled: 0,
                isReflected: false
            });
            enemy.lastAttackTime = Date.now();
        } else if (enemy.weaponType === 'dual-guns') {
            // Shoot 2 projectiles towards player
            const directionToPlayer = player.x > enemy.x ? 1 : -1;
            projectiles.push({
                x: enemy.x + (directionToPlayer > 0 ? enemy.width : 0),
                y: enemy.y + 10,
                width: 8,
                height: 8,
                velocityX: 5 * directionToPlayer,
                velocityY: -1,
                damage: enemy.damage,
                maxDistance: 400,
                distanceTraveled: 0,
                isReflected: false
            });
            projectiles.push({
                x: enemy.x + (directionToPlayer > 0 ? enemy.width : 0),
                y: enemy.y + 20,
                width: 8,
                height: 8,
                velocityX: 5 * directionToPlayer,
                velocityY: 1,
                damage: enemy.damage,
                maxDistance: 400,
                distanceTraveled: 0,
                isReflected: false
            });
            enemy.lastAttackTime = Date.now();
        } else if (enemy.weaponType === 'triple-guns') {
            // Shoot 3 projectiles towards player
            const directionToPlayer = player.x > enemy.x ? 1 : -1;
            projectiles.push({
                x: enemy.x + (directionToPlayer > 0 ? enemy.width : 0),
                y: enemy.y + 10,
                width: 8,
                height: 8,
                velocityX: 5 * directionToPlayer,
                velocityY: -1.5,
                damage: enemy.damage,
                maxDistance: 400,
                distanceTraveled: 0,
                isReflected: false
            });
            projectiles.push({
                x: enemy.x + (directionToPlayer > 0 ? enemy.width : 0),
                y: enemy.y + 15,
                width: 8,
                height: 8,
                velocityX: 5 * directionToPlayer,
                velocityY: 0,
                damage: enemy.damage,
                maxDistance: 400,
                distanceTraveled: 0,
                isReflected: false
            });
            projectiles.push({
                x: enemy.x + (directionToPlayer > 0 ? enemy.width : 0),
                y: enemy.y + 20,
                width: 8,
                height: 8,
                velocityX: 5 * directionToPlayer,
                velocityY: 1.5,
                damage: enemy.damage,
                maxDistance: 400,
                distanceTraveled: 0,
                isReflected: false
            });
            enemy.lastAttackTime = Date.now();
        } else if (enemy.weaponType === 'rocket') {
            // Shoot rocket towards player
            const directionToPlayer = player.x > enemy.x ? 1 : -1;
            rockets.push({
                x: enemy.x + (directionToPlayer > 0 ? enemy.width : 0),
                y: enemy.y + 15,
                width: 12,
                height: 12,
                velocityX: 4 * directionToPlayer,
                velocityY: 0,
                damage: enemy.damage,
                maxDistance: 500,
                distanceTraveled: 0,
                explosionRadius: 80,
                hasExploded: false,
                isReflected: false
            });
            enemy.lastAttackTime = Date.now();
        }
    }
}

// Projectile Update
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        proj.x += proj.velocityX;
        proj.y += proj.velocityY;
        proj.distanceTraveled += Math.abs(proj.velocityX);
        
        if (proj.distanceTraveled > proj.maxDistance || proj.x < 0 || proj.x > CANVAS_WIDTH) {
            projectiles.splice(i, 1);
        }
    }
}

// Get stick bounds based on swing angle
function getStickBounds() {
    const stickLength = 30;
    const radius = 15;  // Distance from player center
    const centerX = player.x + player.width / 2;
    const centerY = player.y + player.height / 2;
    
    // Convert angle to radians
    const angleRad = (stick.swingAngle * Math.PI) / 180;
    
    // Calculate stick end position based on angle
    const endX = centerX + Math.cos(angleRad) * stickLength;
    const endY = centerY + Math.sin(angleRad) * stickLength;
    
    // Return bounding box for collision
    return {
        x: Math.min(centerX, endX) - 5,
        y: Math.min(centerY, endY) - 5,
        width: Math.abs(endX - centerX) + 10,
        height: Math.abs(endY - centerY) + 10
    };
}

// Collision Detection
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Draw Functions
function drawGround() {
    ctx.fillStyle = ground.color;
    ctx.fillRect(ground.x, ground.y, ground.width, ground.height);
    
    // Draw a border for the ground
    ctx.strokeStyle = ground.borderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(ground.x, ground.y, ground.width, ground.height);
}

function updateAnimation() {
    // Determine current animation state
    let nextAnimation = 'idle';
    
    if (!player.isGrounded) {
        nextAnimation = 'jump';
    } else if (player.isBlocking) {
        nextAnimation = 'block';
    } else if (stick.isActive && player.playerLevel < 2) {
        nextAnimation = 'swordAttack';
    } else if (gun.shootCooldown > gun.shootMaxCooldown - 100 && player.playerLevel >= 2) {
        nextAnimation = 'gunShoot';
    } else if (Math.abs(player.velocityX) > 0.5) {
        nextAnimation = 'walk';
    } else {
        nextAnimation = 'idle';
    }
    
    // Reset animation if it changed
    if (nextAnimation !== animationState.currentAnimation) {
        animationState.currentAnimation = nextAnimation;
        animationState.frameIndex = 0;
        animationState.frameCounter = 0;
    }
    
    // Update frame counter
    const anim = SPRITE_SHEET.animations[animationState.currentAnimation];
    animationState.frameCounter += anim.speed;
    
    if (animationState.frameCounter >= 1) {
        animationState.frameCounter = 0;
        animationState.frameIndex = (animationState.frameIndex + 1) % anim.frames.length;
    }
}

function drawPlayer() {
    // Update animation state
    updateAnimation();
    
    // Get current frame from animation
    const anim = SPRITE_SHEET.animations[animationState.currentAnimation];
    const frameNumber = anim.frames[animationState.frameIndex];
    
    // Calculate sprite sheet position
    const spriteCol = frameNumber % SPRITE_SHEET.cols;
    const spriteRow = Math.floor(frameNumber / SPRITE_SHEET.cols);
    const sourceX = spriteCol * SPRITE_SHEET.frameWidth;
    const sourceY = spriteRow * SPRITE_SHEET.frameHeight;
    
    // Draw player sprite
    if (playerImage.complete && playerImage.naturalWidth > 0) {
        ctx.save();
        
        // Flip image based on direction
        if (player.direction < 0) {
            ctx.translate(player.x + player.width, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                playerImage,
                sourceX, sourceY,
                SPRITE_SHEET.frameWidth, SPRITE_SHEET.frameHeight,
                0, 0,
                player.width, player.height
            );
        } else {
            ctx.drawImage(
                playerImage,
                sourceX, sourceY,
                SPRITE_SHEET.frameWidth, SPRITE_SHEET.frameHeight,
                player.x, player.y,
                player.width, player.height
            );
        }
        
        ctx.restore();
    } else {
        // Fallback to placeholder while image loads
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
    
    // Draw shield when blocking
    if (player.isBlocking) {
        ctx.fillStyle = 'rgba(0, 150, 255, 0.4)';  // Transparent blue
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw shield outline
        ctx.strokeStyle = '#0096FF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw shield symbol inside
        ctx.fillStyle = '#0096FF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚔', player.x + player.width / 2, player.y + player.height / 2 + 8);
    }
}

function drawStick() {
    if (stick.isActive) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const stickLength = 30;
        
        // Convert angle to radians
        const angleRad = (stick.swingAngle * Math.PI) / 180;
        
        // Calculate stick end position
        const endX = centerX + Math.cos(angleRad) * stickLength;
        const endY = centerY + Math.sin(angleRad) * stickLength;
        
        // Draw stick as a line with thickness
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // Draw stick head (end cap)
        ctx.fillStyle = '#654321';
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGun() {
    // Draw gun barrel when gun is unlocked
    if (player.playerLevel >= 2) {
        const gunX = player.x + (player.direction > 0 ? player.width : -5);
        const gunY = player.y + 15;
        const gunLength = 15;
        
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(gunX, gunY);
        ctx.lineTo(gunX + (gunLength * player.direction), gunY);
        ctx.stroke();
    }
}

function drawGunProjectiles() {
    gun.projectiles.forEach(proj => {
        ctx.fillStyle = '#FF6600';
        ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        
        ctx.strokeStyle = '#CC4400';
        ctx.lineWidth = 1;
        ctx.strokeRect(proj.x, proj.y, proj.width, proj.height);
    });
}

function drawRockets() {
    rockets.forEach(rocket => {
        // Draw rocket
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(rocket.x, rocket.y, rocket.width, rocket.height);
        
        // Draw rocket outline
        ctx.strokeStyle = '#880000';
        ctx.lineWidth = 2;
        ctx.strokeRect(rocket.x, rocket.y, rocket.width, rocket.height);
        
        // Draw rocket flame trail
        ctx.fillStyle = '#FF8800';
        ctx.fillRect(rocket.x - rocket.velocityX * 0.3, rocket.y - 4, 4, 8);
        
        // Draw explosion if it hit
        if (rocket.hasExploded) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
            ctx.beginPath();
            ctx.arc(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2, rocket.explosionRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#FF6600';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(rocket.x + rocket.width / 2, rocket.y + rocket.height / 2, rocket.explosionRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
}

function drawEnemy() {
    if (enemy.isActive) {
        // Draw enemy as a blue square
        ctx.fillStyle = '#0000FF';
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw enemy outline
        ctx.strokeStyle = '#0000CC';
        ctx.lineWidth = 2;
        ctx.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Draw enemy eyes
        ctx.fillStyle = '#000000';
        ctx.fillRect(enemy.x + 8, enemy.y + 8, 6, 6);
        ctx.fillRect(enemy.x + 26, enemy.y + 8, 6, 6);
        
        // Draw enemy HP bar
        const hpBarWidth = 40;
        const hpBarHeight = 5;
        const hpBarX = enemy.x;
        const hpBarY = enemy.y - 10;
        
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
        
        ctx.fillStyle = '#00FF00';
        const hpPercentage = enemy.hp / enemy.maxHp;
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercentage, hpBarHeight);
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
    }
}

function drawProjectiles() {
    projectiles.forEach(proj => {
        // Reflected projectiles are cyan, normal projectiles are yellow
        if (proj.isReflected) {
            ctx.fillStyle = '#00FFFF';  // Cyan for reflected
            ctx.strokeStyle = '#0088FF';
        } else {
            ctx.fillStyle = '#FFFF00';  // Yellow for normal
            ctx.strokeStyle = '#FF9900';
        }
        
        ctx.fillRect(proj.x, proj.y, proj.width, proj.height);
        
        ctx.lineWidth = 2;
        ctx.strokeRect(proj.x, proj.y, proj.width, proj.height);
        
        // Draw arrow on reflected projectiles to show direction
        if (proj.isReflected) {
            ctx.fillStyle = '#0088FF';
            const arrowSize = 3;
            const arrowX = proj.x + proj.width / 2 + (proj.velocityX > 0 ? proj.width / 2 : -proj.width / 2);
            const arrowY = proj.y + proj.height / 2;
            ctx.beginPath();
            ctx.moveTo(arrowX - arrowSize, arrowY - arrowSize);
            ctx.lineTo(arrowX + arrowSize, arrowY);
            ctx.lineTo(arrowX - arrowSize, arrowY + arrowSize);
            ctx.fill();
        }
    });
}

function drawUI() {
    // Draw prominent HUD at top left
    const hudX = 10;
    const hudY = 10;
    const barWidth = 200;
    const barHeight = 20;
    
    // === Player HP Bar ===
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(hudX, hudY, barWidth + 80, 130);
    
    // Player Level
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(`PLAYER LEVEL: ${player.playerLevel}`, hudX + 10, hudY + 25);
    
    // HP Label and Bar
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('HP:', hudX + 10, hudY + 55);
    
    // HP Bar Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(hudX + 50, hudY + 40, barWidth, barHeight);
    
    // HP Bar Fill
    const hpPercent = player.hp / player.maxHp;
    ctx.fillStyle = hpPercent > 0.5 ? '#00FF00' : (hpPercent > 0.25 ? '#FFAA00' : '#FF0000');
    ctx.fillRect(hudX + 50, hudY + 40, barWidth * hpPercent, barHeight);
    
    // HP Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${player.hp}/${player.maxHp}`, hudX + 60, hudY + 58);
    
    // === Experience Bar ===
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('EXP:', hudX + 10, hudY + 95);
    
    // Calculate experience progress to next level
    const expForNextLevel = 10;
    const expInCurrentLevel = player.experience % expForNextLevel;
    const expPercent = expInCurrentLevel / expForNextLevel;
    
    // Experience Bar Background
    ctx.fillStyle = '#333333';
    ctx.fillRect(hudX + 50, hudY + 80, barWidth, barHeight);
    
    // Experience Bar Fill (purple/blue)
    ctx.fillStyle = '#9933FF';
    ctx.fillRect(hudX + 50, hudY + 80, barWidth * expPercent, barHeight);
    
    // Experience Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${expInCurrentLevel}/${expForNextLevel}`, hudX + 60, hudY + 98);
    
    // === Block Status (lower position) ===
    const blockStatusX = hudX;
    const blockStatusY = hudY + 150;
    
    if (player.isBlocking) {
        ctx.fillStyle = '#0096FF';
        ctx.fillText(`⚔ BLOCKING! (${Math.ceil((player.blockMaxDuration - player.blockDuration) / 100) / 10}s)`, blockStatusX + 10, blockStatusY);
    } else if (player.blockCooldown > 0) {
        ctx.fillStyle = '#999999';
        ctx.fillText(`⚔ Cooldown: ${Math.ceil(player.blockCooldown / 100) / 10}s`, blockStatusX + 10, blockStatusY);
    } else {
        ctx.fillStyle = '#00AA00';
        ctx.fillText(`⚔ Block ready (C)`, blockStatusX + 10, blockStatusY);
    }
    
    // === Weapon Status (top right) ===
    const weaponStatusX = CANVAS_WIDTH - 250;
    const weaponStatusY = 10;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(weaponStatusX, weaponStatusY, 240, 60);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    
    if (player.playerLevel >= 2) {
        ctx.fillStyle = '#FF6600';
        ctx.fillText('🔫 GUN UNLOCKED!', weaponStatusX + 10, weaponStatusY + 25);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(`SPACE to shoot | ${gun.shootCooldown > 0 ? 'Reloading...' : 'Ready'}`, weaponStatusX + 10, weaponStatusY + 45);
    } else {
        ctx.fillStyle = '#999999';
        ctx.fillText('🔫 Gun locked - Level 2+', weaponStatusX + 10, weaponStatusY + 25);
        ctx.font = '12px Arial';
        ctx.fillText('Get experience to unlock', weaponStatusX + 10, weaponStatusY + 45);
    }
    
    if (gameState.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
        
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        ctx.fillText('Press ENTER to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
        
        ctx.textAlign = 'left';
    }
    
    if (gameState.gameWon) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('THE END', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('YOU COMPLETED THE GAME!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
        
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
        ctx.fillText(`Player Level: ${player.playerLevel} | Experience: ${player.experience}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 85);
        
        if (!gameState.namePrompted) {
            ctx.fillText('Press ENTER to save your score', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
        } else {
            ctx.fillText('Score saved! Press ENTER to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
        }
        
        ctx.textAlign = 'left';
    }
}

function draw() {
    // Clear canvas with sky color
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw game objects
    drawGround();
    drawPlayer();
    drawEnemy();
    drawProjectiles();
    drawGunProjectiles();
    drawRockets();
    drawUI();
}

// Mobile Touch Controls
const mobileControls = {
    btnLeft: document.getElementById('btnLeft'),
    btnRight: document.getElementById('btnRight'),
    btnJump: document.getElementById('btnJump'),
    btnAction: document.getElementById('btnAction')
};

if (mobileControls.btnLeft) {
    // Left button (move left)
    mobileControls.btnLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.a = true;
    });
    mobileControls.btnLeft.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.a = false;
    });
    mobileControls.btnLeft.addEventListener('mousedown', () => keys.a = true);
    mobileControls.btnLeft.addEventListener('mouseup', () => keys.a = false);
    mobileControls.btnLeft.addEventListener('mouseleave', () => keys.a = false);
    
    // Right button (move right)
    mobileControls.btnRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        keys.d = true;
    });
    mobileControls.btnRight.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys.d = false;
    });
    mobileControls.btnRight.addEventListener('mousedown', () => keys.d = true);
    mobileControls.btnRight.addEventListener('mouseup', () => keys.d = false);
    mobileControls.btnRight.addEventListener('mouseleave', () => keys.d = false);
    
    // Jump button
    mobileControls.btnJump.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (player.isGrounded) {
            player.velocityY = -player.jumpPower;
            player.isGrounded = false;
        }
    });
    mobileControls.btnJump.addEventListener('mousedown', () => {
        if (player.isGrounded) {
            player.velocityY = -player.jumpPower;
            player.isGrounded = false;
        }
    });
    
    // Action button (Attack/Shoot)
    mobileControls.btnAction.addEventListener('touchstart', (e) => {
        e.preventDefault();
        // Trigger attack action
        if (player.playerLevel >= 2 && gun.shootCooldown <= 0) {
            const directionToEnemy = enemy.x > player.x ? 1 : -1;
            gun.projectiles.push({
                x: player.x + (directionToEnemy > 0 ? player.width : 0),
                y: player.y + 15,
                width: 6,
                height: 6,
                velocityX: 7 * directionToEnemy,
                velocityY: 0,
                damage: gun.damage,
                maxDistance: 500,
                distanceTraveled: 0,
                playerFired: true
            });
            gun.shootCooldown = gun.shootMaxCooldown;
        } else if (player.playerLevel < 2 && !stick.isActive) {
            stick.isActive = true;
            stick.swingDuration = 0;
            stick.swingAngle = player.direction > 0 ? -45 : 45;
            stick.direction = player.direction;
        }
    });
    mobileControls.btnAction.addEventListener('mousedown', () => {
        // Trigger attack action
        if (player.playerLevel >= 2 && gun.shootCooldown <= 0) {
            const directionToEnemy = enemy.x > player.x ? 1 : -1;
            gun.projectiles.push({
                x: player.x + (directionToEnemy > 0 ? player.width : 0),
                y: player.y + 15,
                width: 6,
                height: 6,
                velocityX: 7 * directionToEnemy,
                velocityY: 0,
                damage: gun.damage,
                maxDistance: 500,
                distanceTraveled: 0,
                playerFired: true
            });
            gun.shootCooldown = gun.shootMaxCooldown;
        } else if (player.playerLevel < 2 && !stick.isActive) {
            stick.isActive = true;
            stick.swingDuration = 0;
            stick.swingAngle = player.direction > 0 ? -45 : 45;
            stick.direction = player.direction;
        }
    });
}

// Game Loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
initializeLevel();
gameLoop();
