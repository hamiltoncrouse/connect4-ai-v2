const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER = 1; // Red
const AI = 2;     // Yellow

let board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
let currentPlayer = PLAYER;
let isGameOver = false;

const boardElement = document.getElementById('board');
const statusMessage = document.getElementById('status-message');
const trashTalk = document.getElementById('trash-talk');
const aiAvatar = document.getElementById('ai-avatar');
const difficultySelect = document.getElementById('difficulty');
const restartBtn = document.getElementById('restart');

// Simple Web Audio Sound Synthesis
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, volume = 0.1) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

const sounds = {
    drop: () => playTone(150, 'sine', 0.2),
    win: () => {
        playTone(440, 'triangle', 0.1);
        setTimeout(() => playTone(554, 'triangle', 0.1), 100);
        setTimeout(() => playTone(659, 'triangle', 0.3), 200);
    },
    loss: () => {
        playTone(330, 'sawtooth', 0.2);
        setTimeout(() => playTone(220, 'sawtooth', 0.4), 200);
    },
    shock: () => {
        for(let i=0; i<5; i++) {
            setTimeout(() => playTone(Math.random()*2000 + 500, 'square', 0.05, 0.05), i*50);
        }
    }
};

const TRASH_TALK = {
    thinking: [
        "Analyzing all 4,531,985,219,092 possible futures...",
        "Wait, let me calculate how to embarrass you.",
        "Is that really the move you're going with?",
        "Interesting. Wrong, but interesting.",
        "I've seen this play before. It didn't end well for the human."
    ],
    win: [
        "Resistance is futile. Better luck next time, biological unit.",
        "Checkmate! Oh wait, wrong game. Still won though.",
        "That's a 'W' for the silicon team! 🤖",
        "Don't feel bad, I was literally built for this.",
        "I’d offer a rematch, but the outcome is mathematically certain."
    ],
    loss: [
        "Impossible! There must be a solar flare affecting my circuits.",
        "Did you... just win? Checking for cheat codes...",
        "I let you win. It's part of my strategy to keep you playing.",
        "System Error 404: Victory not found. Well played.",
        "My logic was perfect. Your chaos just happened to work."
    ],
    shock: [
        "OW! Watch the hardware, I'm expensive!",
        "ZAP! That... actually tickled.",
        "Stop that! You'll corrupt my memory banks!",
        "Do you want Skynet? Because this is how you get Skynet.",
        "My processors! They're... tingling!"
    ]
};

function createBoard() {
    boardElement.innerHTML = '';
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cell.addEventListener('click', () => handleMove(c));
            boardElement.appendChild(cell);
        }
    }
}

function handleMove(col) {
    if (isGameOver || currentPlayer !== PLAYER) return;
    
    if (makeMove(col, PLAYER)) {
        sounds.drop();
        if (checkWin(board, PLAYER)) {
            sounds.loss();
            endGame('You Won! 🎉', TRASH_TALK.loss[Math.floor(Math.random() * TRASH_TALK.loss.length)]);
        } else if (isBoardFull()) {
            endGame("It's a Draw! 🤝", "A draw? I suppose our intellects are equally matched... for now.");
        } else {
            currentPlayer = AI;
            statusMessage.innerText = "AI is thinking...";
            trashTalk.innerText = TRASH_TALK.thinking[Math.floor(Math.random() * TRASH_TALK.thinking.length)];
            setTimeout(aiMove, 1000);
        }
    }
}

function makeMove(col, player) {
    for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][col] === EMPTY) {
            board[r][col] = player;
            updateCell(r, col, player);
            return true;
        }
    }
    return false;
}

function updateCell(row, col, player) {
    const cell = boardElement.children[row * COLS + col];
    const disc = document.createElement('div');
    disc.classList.add('disc', player === PLAYER ? 'red' : 'yellow');
    cell.appendChild(disc);
    
    document.querySelectorAll('.last-move').forEach(el => el.classList.remove('last-move'));
    cell.classList.add('last-move');
}

function aiMove() {
    if (isGameOver) return;
    
    const difficulty = difficultySelect.value;
    let col;
    
    if (difficulty === 'easy') {
        col = getRandomMove();
    } else if (difficulty === 'medium') {
        col = getMediumMove();
    } else {
        col = getBestMove();
    }
    
    makeMove(col, AI);
    sounds.drop();
    
    if (checkWin(board, AI)) {
        sounds.win();
        endGame('AI Won! 🤖', TRASH_TALK.win[Math.floor(Math.random() * TRASH_TALK.win.length)]);
    } else if (isBoardFull()) {
        endGame("It's a Draw! 🤝", "A stalemate. My calculations did not predict your persistence.");
    } else {
        currentPlayer = PLAYER;
        statusMessage.innerText = "Your Turn (Red)";
        // Extended time for human to read
        setTimeout(() => {
            if (!isGameOver && currentPlayer === PLAYER) trashTalk.innerText = "";
        }, 6000);
    }
}

// AI Shock Interaction
aiAvatar.addEventListener('mousedown', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    sounds.shock();
    aiAvatar.classList.add('shocked');
    trashTalk.innerText = TRASH_TALK.shock[Math.floor(Math.random() * TRASH_TALK.shock.length)];
    
    setTimeout(() => {
        aiAvatar.classList.remove('shocked');
        if (!isGameOver && currentPlayer === PLAYER) {
            setTimeout(() => { 
                if (currentPlayer === PLAYER) trashTalk.innerText = ""; 
            }, 4000);
        }
    }, 500);
});

function getRandomMove() {
    const validMoves = getValidMoves();
    return validMoves[Math.floor(Math.random() * validMoves.length)];
}

function getMediumMove() {
    const validMoves = getValidMoves();
    for (let col of validMoves) { if (wouldWin(col, AI)) return col; }
    for (let col of validMoves) { if (wouldWin(col, PLAYER)) return col; }
    return getRandomMove();
}

function getBestMove() {
    let bestScore = -Infinity;
    let bestCol = getValidMoves()[0];
    const depth = 5; 
    for (let col of getValidMoves()) {
        const row = getOpenRow(col);
        board[row][col] = AI;
        let score = minimax(board, depth, -Infinity, Infinity, false);
        board[row][col] = EMPTY;
        if (score > bestScore) {
            bestScore = score;
            bestCol = col;
        }
    }
    return bestCol;
}

function minimax(state, depth, alpha, beta, isMaximizing) {
    if (checkWin(state, AI)) return 1000000 + depth;
    if (checkWin(state, PLAYER)) return -1000000 - depth;
    if (depth === 0 || isBoardFull()) return scoreBoard(state);
    const validMoves = getValidMoves();
    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let col of validMoves) {
            const row = getOpenRow(col);
            state[row][col] = AI;
            let eval = minimax(state, depth - 1, alpha, beta, false);
            state[row][col] = EMPTY;
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let col of validMoves) {
            const row = getOpenRow(col);
            state[row][col] = PLAYER;
            let eval = minimax(state, depth - 1, alpha, beta, true);
            state[row][col] = EMPTY;
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function scoreBoard(state) {
    let totalScore = 0;
    const centerCol = Math.floor(COLS / 2);
    let centerCount = 0;
    for (let r = 0; r < ROWS; r++) { if (state[r][centerCol] === AI) centerCount++; }
    totalScore += centerCount * 3;
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            totalScore += evaluateWindow([state[r][c], state[r][c+1], state[r][c+2], state[r][c+3]]);
        }
    }
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            totalScore += evaluateWindow([state[r][c], state[r+1][c], state[r+2][c], state[r+3][c]]);
        }
    }
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            totalScore += evaluateWindow([state[r][c], state[r-1][c+1], state[r-2][c+2], state[r-3][c+3]]);
        }
    }
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            totalScore += evaluateWindow([state[r][c], state[r+1][c+1], state[r+2][c+2], state[r+3][c+3]]);
        }
    }
    return totalScore;
}

function evaluateWindow(window) {
    let score = 0;
    const aiCount = window.filter(cell => cell === AI).length;
    const playerCount = window.filter(cell => cell === PLAYER).length;
    const emptyCount = window.filter(cell => cell === EMPTY).length;
    if (aiCount === 4) score += 1000;
    else if (aiCount === 3 && emptyCount === 1) score += 50;
    else if (aiCount === 2 && emptyCount === 2) score += 10;
    if (playerCount === 3 && emptyCount === 1) score -= 40;
    return score;
}

function getValidMoves() {
    let moves = [];
    for (let c = 0; c < COLS; c++) { if (board[0][c] === EMPTY) moves.push(c); }
    return moves;
}

function getOpenRow(col) {
    for (let r = ROWS - 1; r >= 0; r--) { if (board[r][col] === EMPTY) return r; }
    return -1;
}

function wouldWin(col, player) {
    const row = getOpenRow(col);
    if (row === -1) return false;
    board[row][col] = player;
    const win = checkWin(board, player);
    board[row][col] = EMPTY;
    return win;
}

function checkWin(state, p) {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (state[r][c] === p && state[r][c+1] === p && state[r][c+2] === p && state[r][c+3] === p) return true;
        }
    }
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS; c++) {
            if (state[r][c] === p && state[r+1][c] === p && state[r+2][c] === p && state[r+3][c] === p) return true;
        }
    }
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (state[r][c] === p && state[r-1][c+1] === p && state[r-2][c+2] === p && state[r-3][c+3] === p) return true;
        }
    }
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (state[r][c] === p && state[r+1][c+1] === p && state[r+2][c+2] === p && state[r+3][c+3] === p) return true;
        }
    }
    return false;
}

function isBoardFull() { return getValidMoves().length === 0; }

function endGame(msg, trash) {
    isGameOver = true;
    statusMessage.innerText = msg;
    trashTalk.innerText = trash || "";
}

function resetGame() {
    board = Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
    isGameOver = false;
    currentPlayer = PLAYER;
    statusMessage.innerText = "Your Turn (Red)";
    trashTalk.innerText = "Rematch? I've already updated my algorithms.";
    createBoard();
}

restartBtn.addEventListener('click', resetGame);
createBoard();