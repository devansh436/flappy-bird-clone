import PipePair from './objects.js';
const bird = document.getElementById("bird");
const birdStyle = getComputedStyle(bird);
let birdX = parseInt(birdStyle.left);
let birdY = parseInt(birdStyle.top);
let birdVelocity = 0;
let timeSinceLastPipe = 0;
let lastFrameTime = null;
let isGameOver = false;
let pipeCounter = 0; // 0 to 5
let score = 0;
let pipesOnScreen = [];
const main = document.getElementById('gamePlayWindow');
const scoreElement = document.getElementById('scoreValue');
const mainStyle = getComputedStyle(main);
const mainWidth = parseInt(mainStyle.width);
const mainHeight = parseInt(mainStyle.height);
const originalBirdPosition = [birdX, birdY];
const birdHeight = parseInt(birdStyle.height);
const birdWidth = parseInt(birdStyle.width);
const framerate = 60;
const gravity = 0.07;
const flapStrength = 3;
const pipeWidth = 60;
const pipeGapX = 4 * birdWidth;
const pipeSpeed = 2.5;
const timeBetweenPipes = (pipeGapX / pipeSpeed) * (1000/framerate); // 1s = 1000ms 
const topBound = parseInt(mainStyle.top);
const leftBound = parseInt(mainStyle.left);
const bottomBound = parseInt(mainStyle.top) + mainHeight;
const rightBound = parseInt(mainStyle.left) + mainWidth;
const pipeSpawnX = rightBound - pipeWidth;

// Gravity, motion, pipe generation
function applyEffects(delta) {
    // Apply gravity
    birdVelocity += gravity;
    birdY += birdVelocity;
    bird.style.top = birdY + 'px';

    // Check bounds
    if (isBirdOutOfBounds(birdX, birdY)) {
        isGameOver = true;
        return;
    }

    // Move pipes leftward
    pipesOnScreen.forEach(pipeObj => {
        pipeObj.updateX(pipeSpeed);
        
        if (checkCollision(birdX, birdY, pipeObj.element.firstElementChild, pipeObj.element.lastElementChild)) {
            isGameOver = true;
            return;
        }
        if (!pipeObj.scored && birdX > pipeObj.x + pipeWidth) {
            pipeObj.scored = true;
            score++;
            scoreElement.innerText = score;
            console.log('Score:', score);
        }
        if (pipeObj.x + pipeWidth <= 0) {
            pipeObj.element.remove();
            pipesOnScreen.splice(0,1);
        }
    });

    // Generate new Pipe-pairs
    timeSinceLastPipe += delta;
    if (timeSinceLastPipe >= timeBetweenPipes) {
        pipeCounter++;
        pipeCounter %= 5
        generatePipes(pipeCounter);
        timeSinceLastPipe= 0;
    }
}

// Pipe collision logic
function checkCollision(birdX, birdY, topPipe, bottomPipe) {
    const birdRect = bird.getBoundingClientRect();
    const topPipeRect = topPipe.getBoundingClientRect();
    const bottomPipeRect = bottomPipe.getBoundingClientRect();

    return intersects(birdRect, topPipeRect) || intersects(birdRect, bottomPipeRect)
}

function birdCrossedPipe(pipePair) {
    const birdRect = bird.getBoundingClientRect();
    const pipePairRect = pipePair.getBoundingClientRect(); 

    return (
        birdRect.left > pipePairRect.right
    )
}

// Bird flap logic
function flap() {
    birdVelocity = -flapStrength;
}

// Game loop
function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    
    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    applyEffects(delta);
    
    if (!isGameOver) requestAnimationFrame(gameLoop);
    else gameLost();
}

// Pipe generation logic
function generatePipes(pid) {
    // RNG for pipe height & top/bottom pipe turn to get the random height
    let pipeHeight = Math.floor(Math.random() * (70 - 10 + 1)) + 10;
    let topPipeTurn = Math.random() < 0.5;
    
    // Pipe pair creation
    let pipePair = document.createElement('div');
    pipePair.id = pid;
    pipePair.className = 'pipePair';    
    pipePair.style.left = (pipeSpawnX) + 'px';
    
    // Pipe creation
    let pipe1 = document.createElement('div');
    pipe1.className = 'pipe';
    let pipe2 = document.createElement('div');
    pipe2.className = 'pipe';
    
    // Apply random height to one of the pipes
    if (topPipeTurn) pipe1.style.height = pipeHeight + '%';
    else pipe2.style.height = pipeHeight + '%';
    
    pipePair.appendChild(pipe1);
    pipePair.appendChild(pipe2);
    let pipeObj = new PipePair(pipePair.style.left, pid, pipePair);
    pipesOnScreen.push(pipeObj);
    main.appendChild(pipePair);
}


function handleKeypress(e) {
    switch (e.key) {
        case ' ':
            if (!isGameOver) flap();
            break;
        default:
            break;
    }
}

// If bird goes out of bounds, user lost
function isBirdOutOfBounds(x, y) {
    if (x < leftBound || x + birdWidth >= rightBound ||
        y < topBound  || y + birdHeight >= bottomBound) {
            return true;
    } 
    return false;
}

function intersects(bird, pipe) {
    return !(
        bird.right < pipe.left ||
        bird.left > pipe.right ||
        bird.top > pipe.bottom ||
        bird.bottom < pipe.top
    );
}

function restartGame() {
    // reset bird position
    [birdX , birdY] = originalBirdPosition;
    bird.style.left = birdX + 'px';
    bird.style.top =  birdY + 'px';
    
    // reset vars
    resetVariables();

    // start RAF(gameLoop)
    requestAnimationFrame(gameLoop);
}


function resetVariables() {
    isGameOver = false;
    lastFrameTime = null;
    birdVelocity = 0;
    timeSinceLastPipe = 0;
    score = 0;
    scoreValue.innerText = 0;

    pipesOnScreen.forEach(pair => {
        pair.element.remove();
    });
    pipesOnScreen = [];
}

// User Lost: stop gameloop and reset variables
function gameLost() {
    Swal.fire({
        title: 'You Lost!',
        text: `Score: ${score}. Wanna try again?`,
        icon : 'error',
        confirmButtonText: 'Restart',
        confirmButtonColor: '#d33',
        background: '#e6ffe6',
        color:'#333',
        allowOutsideClick: false,
    }).then(() => restartGame());
    console.log('You Lost!');
}

document.addEventListener("keydown", handleKeypress);
requestAnimationFrame(gameLoop);
