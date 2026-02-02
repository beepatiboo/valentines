// Game state
const gameState = {
    score: 0,
    speed: 3,
    gameActive: false,
    paused: false,
    basketPosition: 50, // percentage
    hearts: [],
    letterQueue: [],
    collectedLetters: {},
    heartSpawnCounter: 0,
    animationFrame: null,
    pausedHeartData: [] // Store heart positions when paused
};

// Game configuration
const config = {
    basketWidth: 80,
    heartWidth: 50,
    spawnInterval: 1000, // base spawn interval in ms
    letterHeartRatio: 3 // 1 letter heart for every 3 regular hearts
};

// Letter slots tracking
const letterSlots = [];
const requiredLetters = "WILLYOUBEMYVALENTINE".split('');

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const revealScreen = document.getElementById('reveal-screen');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const speedSlider = document.getElementById('speed-slider');
const scoreDisplay = document.getElementById('score');
const basket = document.getElementById('basket');
const gameCanvas = document.getElementById('game-canvas');
const progressDisplay = document.getElementById('progress-display');
const letterMessage = document.getElementById('letter-message');
const yesBtn = document.getElementById('yes-btn');
const noBtn = document.getElementById('no-btn');
const playAgainBtn = document.getElementById('play-again-btn');

// Initialize letter slots
function initializeLetterSlots() {
    const slots = progressDisplay.querySelectorAll('.letter-slot');
    letterSlots.length = 0;
    
    slots.forEach((slot, index) => {
        const letter = slot.getAttribute('data-letter');
        letterSlots.push({
            element: slot,
            letter: letter,
            filled: false,
            index: index
        });
    });
    
    // Initialize letter queue with all required letters
    gameState.letterQueue = [...requiredLetters];
    shuffleArray(gameState.letterQueue);
    gameState.collectedLetters = {};
}

// Shuffle array helper
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Speed slider
speedSlider.addEventListener('input', (e) => {
    gameState.speed = parseInt(e.target.value);
});

// Start game
startBtn.addEventListener('click', () => {
    startScreen.classList.remove('active');
    gameScreen.classList.add('active');
    startGame();
});

// Pause button
pauseBtn.addEventListener('click', () => {
    togglePause();
});

// Toggle pause function
function togglePause() {
    gameState.paused = !gameState.paused;
    
    if (gameState.paused) {
        pauseBtn.textContent = '▶️ Resume';
        pauseBtn.style.background = 'linear-gradient(135deg, #90EE90, #32CD32)';
        console.log('Game paused');
    } else {
        pauseBtn.textContent = '⏸️ Pause';
        pauseBtn.style.background = 'linear-gradient(135deg, #ffd700, #ffaa00)';
        console.log('Game resumed');
    }
}

// Start game function
function startGame() {
    console.log('Starting game...');
    gameState.gameActive = true;
    gameState.paused = false;
    gameState.score = 0;
    gameState.hearts = [];
    gameState.heartSpawnCounter = 0;
    gameState.basketPosition = 50;
    
    // Reset pause button
    pauseBtn.textContent = '⏸️ Pause';
    pauseBtn.style.background = 'linear-gradient(135deg, #ffd700, #ffaa00)';
    
    // Clear game canvas
    const existingHearts = gameCanvas.querySelectorAll('.heart');
    existingHearts.forEach(heart => heart.remove());
    
    // Initialize letter tracking
    initializeLetterSlots();
    console.log('Letter queue:', gameState.letterQueue);
    
    // Reset progress display to show underscores
    letterSlots.forEach(slot => {
        slot.filled = false;
        slot.element.textContent = '_';
        slot.element.classList.remove('filled');
    });
    
    // Reset display
    scoreDisplay.textContent = '0';
    updateBasketPosition();
    
    // Start spawning hearts
    console.log('Starting heart spawn...');
    spawnHeart();
    
    // Start game loop
    gameLoop();
}

// Game loop
function gameLoop() {
    if (!gameState.gameActive) return;
    
    // Skip updates if paused
    if (!gameState.paused) {
        // Update all hearts
        gameState.hearts.forEach((heart, index) => {
            updateHeart(heart);
            checkCollision(heart);
        });
        
        // Remove hearts that are off screen
        gameState.hearts = gameState.hearts.filter(heart => {
            const heartTop = parseFloat(heart.element.style.top);
            if (heartTop > window.innerHeight) {
                heart.element.remove();
                return false;
            }
            return true;
        });
    }
    
    gameState.animationFrame = requestAnimationFrame(gameLoop);
}

// Spawn heart
function spawnHeart() {
    if (!gameState.gameActive) {
        console.log('Game not active, stopping spawn');
        return;
    }
    
    // Don't spawn new hearts while paused, but keep the timer running
    if (!gameState.paused) {
        gameState.heartSpawnCounter++;
        console.log('Spawning heart #', gameState.heartSpawnCounter);
        
        // Determine if this should be a letter heart
        // Only spawn letter hearts if there are still letters needed
        const isLetterHeart = gameState.heartSpawnCounter % config.letterHeartRatio === 0 && gameState.letterQueue.length > 0;
        
        let letter = null;
        if (isLetterHeart) {
            // Get a random letter from the queue that we still need
            const randomIndex = Math.floor(Math.random() * gameState.letterQueue.length);
            letter = gameState.letterQueue[randomIndex];
            console.log('Spawning letter heart with:', letter, '- Remaining letters:', gameState.letterQueue);
        }
        
        createHeart(isLetterHeart, letter);
    }
    
    // Schedule next heart spawn
    const spawnDelay = config.spawnInterval / gameState.speed;
    setTimeout(() => spawnHeart(), spawnDelay);
}

// Create heart element
function createHeart(isLetterHeart, letter) {
    console.log('Creating heart - isLetter:', isLetterHeart, 'letter:', letter);
    
    const heart = document.createElement('div');
    heart.className = 'heart' + (isLetterHeart ? ' letter-heart' : '');
    
    // Create hand-drawn SVG heart
    const size = isLetterHeart ? 60 : 50;
    const svg = `
        <svg width="${size}" height="${size}" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <path d="M25,45 C25,45 5,30 5,17 C5,10 10,5 16,5 C20,5 23,7 25,10 C27,7 30,5 34,5 C40,5 45,10 45,17 C45,30 25,45 25,45 Z" 
                  fill="${isLetterHeart ? '#ffb3ba' : '#ffcccb'}" 
                  stroke="#d84a4a" 
                  stroke-width="2"
                  stroke-linejoin="round"/>
        </svg>
    `;
    heart.innerHTML = svg;
    
    // Random horizontal position
    const randomX = Math.random() * (window.innerWidth - 100) + 50;
    heart.style.left = randomX + 'px';
    heart.style.top = '-50px';
    heart.style.position = 'absolute';
    
    // Add letter if it's a letter heart
    if (isLetterHeart && letter) {
        const letterSpan = document.createElement('span');
        letterSpan.className = 'letter';
        letterSpan.textContent = letter;
        heart.appendChild(letterSpan);
    }
    
    gameCanvas.appendChild(heart);
    console.log('Heart added to canvas');
    
    // Store heart data
    const heartData = {
        element: heart,
        x: randomX,
        y: -50,
        isLetterHeart: isLetterHeart,
        letter: letter,
        caught: false
    };
    
    gameState.hearts.push(heartData);
}

// Update heart position
function updateHeart(heart) {
    if (heart.caught) return;
    
    heart.y += gameState.speed * 0.8;
    heart.element.style.top = heart.y + 'px';
}

// Check collision with basket
function checkCollision(heart) {
    if (heart.caught) return;
    
    const heartRect = heart.element.getBoundingClientRect();
    const basketRect = basket.getBoundingClientRect();

    // added by me - start

    const heartCenterX = (heartRect.left + heartRect.right) / 2;
    // tolerance: how close to basket top counts as a catch
    const verticalTolerance = 10; // pixels

    if (
    Math.abs(heartRect.bottom - basketRect.top) <= verticalTolerance &&
    heartCenterX >= basketRect.left &&
    heartCenterX <= basketRect.right
    ) {
        catchHeart(heart);
    }
    
    // added by me - end
    
    // Check if heart overlaps with basket
    // if (
    //     heartRect.bottom >= basketRect.top &&
    //     heartRect.top <= basketRect.bottom &&
    //     heartRect.right >= basketRect.left &&
    //     heartRect.left <= basketRect.right
    // ) {
    //     catchHeart(heart);
    // }
}

// Catch heart
function catchHeart(heart) {
    heart.caught = true;
    
    // Increase score
    gameState.score++;
    scoreDisplay.textContent = gameState.score;
    
    // Animate heart to basket
    heart.element.style.transition = 'all 0.3s ease';
    heart.element.style.transform = 'scale(0)';
    
    setTimeout(() => {
        heart.element.remove();
    }, 300);
    
    // If it's a letter heart, add to progress
    if (heart.isLetterHeart && heart.letter) {
        addLetterToProgress(heart.letter);
    }
}

// Add letter to progress
function addLetterToProgress(letter) {
    // Find the first unfilled slot with this letter
    const slot = letterSlots.find(s => s.letter === letter && !s.filled);
    
    if (slot) {
        slot.filled = true;
        slot.element.textContent = letter;
        slot.element.classList.add('filled');
        
        // Check if there are any more unfilled slots for this letter
        const stillNeedThisLetter = letterSlots.some(s => s.letter === letter && !s.filled);
        
        if (!stillNeedThisLetter) {
            // Remove ALL instances of this letter from the queue
            gameState.letterQueue = gameState.letterQueue.filter(l => l !== letter);
            console.log(`Letter ${letter} complete! No longer needed. Remaining:`, gameState.letterQueue);
        } else {
            console.log(`Got ${letter}, but still need more. Remaining in queue:`, gameState.letterQueue);
        }
        
        // Show letter caught message
        showLetterMessage(letter);
        
        // Check if game is complete
        checkGameComplete();
    }
}

// Show letter caught message
function showLetterMessage(letter) {
    const messages = [
        `Got ${letter}! 💖`,
        `Nice catch! ${letter} ✨`,
        `${letter} collected! 💕`,
        `Perfect! ${letter} 🌟`
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    letterMessage.textContent = randomMessage;
    letterMessage.classList.add('show');
    
    setTimeout(() => {
        letterMessage.classList.remove('show');
    }, 1500);
}

// Check if game is complete
function checkGameComplete() {
    const allFilled = letterSlots.every(slot => slot.filled);
    
    if (allFilled) {
        setTimeout(() => {
            endGame();
        }, 1000);
    }
}

// End game
function endGame() {
    gameState.gameActive = false;
    cancelAnimationFrame(gameState.animationFrame);
    
    // Clear all hearts
    gameState.hearts.forEach(heart => {
        if (heart.element && heart.element.parentNode) {
            heart.element.remove();
        }
    });
    gameState.hearts = [];
    
    // Show reveal screen
    gameScreen.classList.remove('active');
    revealScreen.classList.add('active');
}

// Basket movement
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    updateBasketMovement();
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
    updateBasketMovement();
});

function updateBasketMovement() {
    if (!gameState.gameActive || gameState.paused) return;
    
    const moveSpeed = 2;
    
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
        gameState.basketPosition = Math.max(5, gameState.basketPosition - moveSpeed);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
        gameState.basketPosition = Math.min(95, gameState.basketPosition + moveSpeed);
    }
    
    updateBasketPosition();
    
    if (keys['ArrowLeft'] || keys['ArrowRight'] || keys['a'] || keys['A'] || keys['d'] || keys['D']) {
        requestAnimationFrame(updateBasketMovement);
    }
}

function updateBasketPosition() {
    basket.style.left = gameState.basketPosition + '%';
}

// Reveal screen buttons
yesBtn.addEventListener('click', () => {
    alert('Yay! 💖💖💖 You made my day!');
});

noBtn.addEventListener('click', () => {
    // Make the No button run away!
    const btn = noBtn;
    const randomX = Math.random() * 200 - 100;
    const randomY = Math.random() * 200 - 100;
    
    btn.style.position = 'relative';
    btn.style.transition = 'all 0.3s ease';
    btn.style.transform = `translate(${randomX}px, ${randomY}px)`;
    
    setTimeout(() => {
        alert('The "No" button is shy! Try the "Yes" button instead! 😊💕');
        btn.style.transform = 'translate(0, 0)';
    }, 500);
});

playAgainBtn.addEventListener('click', () => {
    revealScreen.classList.remove('active');
    startScreen.classList.add('active');
});