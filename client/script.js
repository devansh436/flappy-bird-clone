import PipePair from '../objects.js';

const bird = document.getElementById("bird");
const birdStyle = getComputedStyle(bird);
let birdX = parseInt(birdStyle.left);
let birdY = parseInt(birdStyle.top);
let birdVelocity = 0;
let timeSinceLastPipe = 0;
let lastFrameTime = null;
let isGameOver = false;
let gamesPlayed = 0;
let timePlayed = 0;
let pipeCounter = 0; // 0 to 5
let score = 0;
let pipesOnScreen = [];
let flapCount = 0;
let userID;
let cachedLeaderboard = null;
let sessionStartTime, sessionEndTime, sessionLength;
const mainWindow = document.getElementById('gamePlayWindow');
const gameOverlay = document.getElementById('gameOverlay');
const leaderboard = document.getElementById('leaderboard');
const scoreElement = document.getElementById('scoreValue');
const mainStyle = getComputedStyle(mainWindow);
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
const pipeSpawnX = rightBound + pipeWidth;

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
        if (checkCollision(pipeObj.element.firstElementChild, pipeObj.element.lastElementChild)) {
            isGameOver = true;
            return;
        }
        if (!pipeObj.scored && birdX > pipeObj.x + pipeWidth) {
            pipeObj.scored = true;
            score++;
            scoreElement.innerText = score;
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
function checkCollision(topPipe, bottomPipe) {
    const birdRect = bird.getBoundingClientRect();
    const topPipeRect = topPipe.getBoundingClientRect();
    const bottomPipeRect = bottomPipe.getBoundingClientRect();

    return intersects(birdRect, topPipeRect) || intersects(birdRect, bottomPipeRect)
}

// Bird flap logic
function flap() {
    flapCount++;
    birdVelocity = -flapStrength;
}

// Game loop
function gameLoop(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    
    const delta = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    timePlayed = Math.round((timePlayed + delta) * 1e6) / 1e6;
    applyEffects(delta);
    
    if (!isGameOver) requestAnimationFrame(gameLoop);
    else gameLost();
}

// User Lost: stop gameloop and reset variables
async function gameLost() {
    // update variables
    gameOverlay.style.visibility = 'visible';   
    gamesPlayed++;
    sessionEndTime = Date.now();
    sessionLength = (sessionEndTime - sessionStartTime);
    updateUserData(userID, gamesPlayed, score, timePlayed,
        flapCount, sessionLength);
    
    await Swal.fire({
    title: 'You lost!',
    icon: 'error',
    confirmButtonText: 'Restart',
    confirmButtonColor: '#28a745',
    background: '#f0f8ff',
    color: '#333',
    allowOutsideClick: true,
    allowEscapeKey: true,
    showCloseButton: true,
    html: `<div class='retro-content'>Wanna try again?<div>`,
    customClass: {
        popup: 'retro-popup',
        title: 'retro-title',
        confirmButton: 'retro-confirm'
    }
});

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
    mainWindow.appendChild(pipePair);
}

// Listener functions for space (PC) & clicks (Phone)
function handleKeypress(e) {
    if (e.key === ' ') {
        if (!isGameOver) flap();
        else restartGame();
    }
}
function handleTouch(e) {
    if (!isGameOver) flap();
    else restartGame();
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

async function restartGame() {
    // reset vars, bird position, pipes
    resetVariables();
    // start RAF(gameLoop)
    requestAnimationFrame(gameLoop);
    await updateLeaderboard();
}

// Reset variables & DOM to original state
function resetVariables() {
    isGameOver = false;
    lastFrameTime = null;
    birdVelocity = 0;
    timeSinceLastPipe = 0;
    score = 0;
    scoreValue.innerText = 0;
    gameOverlay.style.visibility = 'hidden';

    // Reset bird position
    [birdX , birdY] = originalBirdPosition;
    bird.style.left = birdX + 'px';
    bird.style.top =  birdY + 'px';

    // Remove all pipe objects & elements
    pipesOnScreen.forEach(pair => {
        pair.element.remove();
    });
    pipesOnScreen = [];
}

// Game start
function startSession() {
    gameOverlay.style.visibility = 'hidden';
    sessionStartTime = Date.now();
    requestAnimationFrame(gameLoop);
}

// Recreate leaderboard DOM element
async function updateLeaderboard() {
    leaderboard.innerHTML = `<h2>Leaderboard</h2>`
    if (cachedLeaderboard) leaderboard.appendChild(cachedLeaderboard.cloneNode(true));

    try {
        const res = await fetch('/scores');
        const data = await res.json();
        data.sort((a, b) => b.highest_score - a.highest_score);
        const ul = document.createElement('ul');

        let count = Math.min(10, data.length);
        for (let i = 0; i < count; i++) {
            const li = document.createElement('li');
            li.innerHTML = 
            `<span>${i+1}.</span>
            <span>${data[i].user_id}</span>
            <span>${data[i].highest_score}</span>`
            ul.appendChild(li);
        }
        leaderboard.innerHTML = `<h2>Leaderboard</h2>`
        leaderboard.appendChild(ul);
        cachedLeaderboard = ul;
    } catch(err) {
        console.log(err);
    }    
}

// API calls 
async function createUser(credentials) {
    const res = await fetch('/scores', {
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body : JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error('Failed to create user.');
    return res.json();
}

// Use SweetAlert to get userID & pass via modal
async function getCredentials() {
    let credentials = null;
    let password;
    await Swal.fire({
        title: 'Login',
        html:
            `<input id="swal-input1" class="swal2-input retro-input" placeholder="Username" autocomplete="off">` +
            `<input id="swal-input2" class="swal2-input retro-input" type="password" placeholder="Password" autocomplete="off">`,
        customClass: {
            popup: 'retro-popup',
            title: 'retro-title',
            confirmButton: 'retro-confirm',
            validationMessage: 'retro-validation'
        },
        confirmButtonText: 'Start Game',
        background: '#1c1c1e',
        focusConfirm: false,
        preConfirm: () => {
            userID = document.getElementById('swal-input1').value;
            password = document.getElementById('swal-input2').value;
            if (!userID || !password) {
                Swal.showValidationMessage('Please enter both username and password');
                return false;
            }
            return { userID, password };
        }
    }).then((res) => {
        if (res.isConfirmed) {
            credentials = res.value;
        }
    });

    return credentials;
}

// Get credentials & create user if new
async function setup() {
    await updateLeaderboard();
    if (localStorage.getItem('smart_boi')) {
        userID = localStorage.getItem('smart_boi');
        return;
    }
    let credentials = await getCredentials();
    if (!credentials) {
        console.log('Unable to record credentials.');
        return;
    } 
    try {
        const res = await createUser(credentials);
        localStorage.setItem('smart_boi', credentials.userID);
        userID = credentials.userID;
    } catch (err) {
        console.log(err);
    }
}

// Update userdata in db
// user_id, gamesPlayed, score, timePlayed, flapCount, sessionLength
async function updateUserData(userID, gamesPlayed, score, 
    timePlayed, flapCount, sessionLength) {
    const userData = {
        userID, gamesPlayed, score, 
        timePlayed, flapCount, sessionLength
    };
    try {
        const res = await fetch('/scores', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
    } catch (err) {
        console.log('Error updating data.');
    }
}

async function main() {
    await setup();
    document.addEventListener("keydown", handleKeypress);
    document.addEventListener("touchstart", handleTouch);
    startSession();
}

window.onload = main;