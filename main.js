// Game Constants
const GRAVITY = 0.25; // Reduced from 0.3
const FLAP_FORCE = -8; // Reduced from -10 for more control
const DRONE_WIDTH = 40;
const DRONE_HEIGHT = 30;
const LASER_GAP = 240; // Increased from 180
const LASER_WIDTH = 60;
const LASER_SPEED = 1.5; // Reduced from 2
const LASER_FREQ = 2000; // Increased from 1500 for more time between lasers
// Game State
let gameState = 'loading'; // loading, start, playing, gameover
let score = 0;
let highScore = 0;
let gameSpeed = 0.8; // Reduced initial game speed from 1
let lastLaserTime = 0;

// Sound Effects
const sounds = {
    flap: new Howl({ src: ['assets/sounds/flap.mp3'] }),
    score: new Howl({ src: ['assets/sounds/score.mp3'] }),
    crash: new Howl({ src: ['assets/sounds/crash.mp3'] })
};

// DOM Elements
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const loadingScreen = document.getElementById('loading-screen');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreDisplay = document.getElementById('score-display');
const finalScoreDisplay = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Set canvas size
function resizeCanvas() {
    const container = document.getElementById('game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Game Objects
const drone = {
    x: 100,
    y: canvas.height / 2,
    width: DRONE_WIDTH,
    height: DRONE_HEIGHT,
    velocity: 0,
    color: '#05d9e8',

    update() {
    if (gameState === 'playing') {
            this.velocity += GRAVITY;
            this.y += this.velocity;
        }

        // Keep drone within canvas bounds
        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height - this.height) {
            this.y = canvas.height - this.height;
            if (gameState === 'playing') gameOver();
        }
    },

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 5);
        ctx.fill();

        // Drone glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowBlur = 0;
    },

    flap() {
        this.velocity = FLAP_FORCE;
        // Play flap sound
        if (gameState === 'playing') {
            sounds.flap.play();
        }
    }
};

const lasers = [];

function createLaser() {
    // Make sure gap is at least 30% away from top and bottom edges for easier play
    const minGapPosition = canvas.height * 0.3;
    const maxGapPosition = canvas.height * 0.7 - LASER_GAP;
    const gapPosition = minGapPosition + Math.random() * (maxGapPosition - minGapPosition);
    
    // Define random offset for pipe variation
    const randomOffset = Math.random();
    
    // Set the --random-offset CSS variable
    document.documentElement.style.setProperty('--random-offset', randomOffset);

    // Determine pipe position variation (up, middle, or down)
    const positionVariation = Math.floor(Math.random() * 3); // 0: up, 1: middle, 2: down
    let topHeight, bottomStart;

    if (positionVariation === 0) { // Up position
        topHeight = Math.min(gapPosition, canvas.height * 0.2);
        bottomStart = topHeight + LASER_GAP;
    } else if (positionVariation === 2) { // Down position
        bottomStart = Math.max(gapPosition + LASER_GAP, canvas.height * 0.8);
        topHeight = bottomStart - LASER_GAP;
    } else { // Middle position
        topHeight = gapPosition;
        bottomStart = topHeight + LASER_GAP;
    }

    lasers.push({
        x: canvas.width,
        gapY: topHeight,
        width: LASER_WIDTH,
        gap: LASER_GAP,
        color: '#ff2a6d',
        passed: false,
        randomOffset: randomOffset // Store the random offset for each laser
    });
}

function updateLasers() {
    // Remove off-screen lasers
    const activeLasers = [];
    lasers.forEach((laser) => {
        laser.x -= LASER_SPEED * gameSpeed;

        // Check if drone passed the laser
        if (!laser.passed && drone.x > laser.x + laser.width) {
            laser.passed = true;
            score++;
            scoreDisplay.textContent = score;
            sounds.score.play();
        }

        if (laser.x + laser.width > 0) {
            activeLasers.push(laser);
        }
    });

    lasers.length = 0;
    lasers.push(...activeLasers);
}

function drawLasers() {
    lasers.forEach(laser => {
        ctx.fillStyle = laser.color;
        
        // Apply random offset to pipe positions
        const offset = laser.randomOffset * 20; // Adjust the multiplier for more or less variation

        // Top laser
        ctx.beginPath();
        ctx.roundRect(laser.x, 0, laser.width, laser.gapY + offset, 5);
        ctx.fill();

        // Bottom laser
        ctx.beginPath();
        ctx.roundRect(laser.x, laser.gapY + laser.gap - offset, laser.width, canvas.height, 5);
        ctx.fill();

        // Laser glow
        ctx.shadowColor = laser.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

function checkCollisions() {
    if (gameState !== 'playing') return;

    // Simple AABB collision detection
    for (const laser of lasers) {
        if (
            drone.x < laser.x + laser.width &&
            drone.x + drone.width > laser.x &&
            (drone.y < laser.gapY || drone.y + drone.height > laser.gapY + laser.gap)
        ) {
            gameOver();
            break;
        }
    }
}
    
function gameOver() {
    gameState = 'gameover';
    gameOverScreen.classList.remove('hidden');
    finalScoreDisplay.textContent = score;
    highScore = Math.max(score, highScore);
    sounds.crash.play();
}

function resetGame() {
    console.log('Resetting game...');
if (!canvas) {
        console.error('Canvas not found!');
        return;
}

    gameState = 'playing';
    score = 0;
    gameSpeed = 0.8; // Reset to slower initial speed
    lasers.length = 0;
    lastLaserTime = 0;
    scoreDisplay.textContent = '0';
    drone.y = canvas.height / 2;
    drone.velocity = 0;
    gameOverScreen.classList.add('hidden');
    console.log('Game reset complete');
}

// Simulate loading assets
function simulateLoading() {
    // This simulates loading assets - in a real game you would load assets here
    setTimeout(() => {
        loadingScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
        gameState = 'start';
    }, 2000); // Show loading screen for 2 seconds
}

// Removed drawPlayerName function as it is now handled by the HTML element

// Game Loop
function gameLoop(timestamp) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#0d0221';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw game objects based on state
    if (gameState === 'playing') {
        // Spawn new lasers
        if (timestamp - lastLaserTime > LASER_FREQ / gameSpeed) {
            createLaser();
            lastLaserTime = timestamp;
            // Increase difficulty more gradually
            gameSpeed = Math.min(0.8 + score * 0.005, 2); // Slower progression
        }

        drone.update();
        updateLasers();
        checkCollisions();
    }

    drawLasers();
    drone.draw();
    drawPlayerName(); // Draw player name in every frame

    requestAnimationFrame(gameLoop);
}

// Event Listeners
window.addEventListener('resize', () => {
    resizeCanvas();
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (gameState === 'start') {
            startScreen.classList.add('hidden');
            resetGame();
        } else if (gameState === 'playing') {
            drone.flap();
        }
    }
});

restartBtn.addEventListener('click', () => {
    resetGame();
});

// Touch support for mobile devices
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState === 'start') {
        startScreen.classList.add('hidden');
        resetGame();
    } else if (gameState === 'playing') {
        drone.flap();
    }
});

// Initialize game
console.log('Initializing game...');
if (!canvas) {
    console.error('Canvas element not found!');
} else {
    resizeCanvas();
    simulateLoading(); // Start the loading sequence
    gameLoop(0);
    console.log('Game initialized');
}

