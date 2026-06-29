const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next');
const nextCtx = nextCanvas.getContext('2d');

const COLS = 10;
const ROWS = 20;
let blockSize = 30;
const EMPTY = 0;

function resizeCanvas() {
  const maxBoardWidth = Math.min(window.innerWidth * 0.55, 420);
  const maxBoardHeight = Math.min(window.innerHeight * 0.84, 760);
  const targetWidth = Math.min(maxBoardWidth, maxBoardHeight / 2);
  blockSize = Math.max(18, Math.floor(targetWidth / COLS));
  canvas.width = blockSize * COLS;
  canvas.height = blockSize * ROWS;
}
resizeCanvas();
window.addEventListener('resize', () => {
  resizeCanvas();
  draw();
});
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const startBtn = document.getElementById('startBtn');

const SHAPES = [
  { color: '#00f0ff', matrix: [[1, 1, 1, 1]] },
  { color: '#ff2bd6', matrix: [[1, 1], [1, 1]] },
  { color: '#ffd166', matrix: [[1, 1, 0], [0, 1, 1]] },
  { color: '#7c4dff', matrix: [[0, 1, 1], [1, 1, 0]] },
  { color: '#ff6b6b', matrix: [[1, 1, 1], [0, 1, 0]] },
  { color: '#00ff88', matrix: [[1, 1, 1], [1, 0, 0]] },
  { color: '#2ec4ff', matrix: [[1, 1, 1], [0, 0, 1]] }
];

let board = createBoard();
let currentPiece = null;
let nextPiece = null;
let score = 0;
let lines = 0;
let dropCounter = 0;
let dropInterval = 700;
let lastTime = 0;
let gameOver = false;
let paused = false;
let audioCtx = null;

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function randomPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  return {
    x: Math.floor(COLS / 2) - 1,
    y: 0,
    matrix: shape.matrix.map((row) => [...row]),
    color: shape.color
  };
}

function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playTone(frequency, duration, type = 'square', volume = 0.025) {
  ensureAudio();
  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = volume;
  oscillator.connect(gain);
  gain.connect(audioCtx.destination);
  oscillator.start();
  gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
  oscillator.stop(audioCtx.currentTime + duration);
}

function playMoveSound() {
  playTone(520, 0.05, 'square', 0.015);
}

function playRotateSound() {
  playTone(680, 0.06, 'triangle', 0.02);
}

function playClearSound() {
  playTone(880, 0.08, 'sine', 0.02);
}

function playGameOverSound() {
  playTone(220, 0.2, 'sawtooth', 0.03);
}

function resetGame() {
  board = createBoard();
  currentPiece = randomPiece();
  nextPiece = randomPiece();
  score = 0;
  lines = 0;
  dropCounter = 0;
  dropInterval = 700;
  gameOver = false;
  paused = false;
  updateHud();
  draw();
}

function updateHud() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
}

function collide(piece, xOffset = 0, yOffset = 0) {
  for (let y = 0; y < piece.matrix.length; y += 1) {
    for (let x = 0; x < piece.matrix[y].length; x += 1) {
      if (!piece.matrix[y][x]) continue;
      const newX = piece.x + x + xOffset;
      const newY = piece.y + y + yOffset;
      if (newX < 0 || newX >= COLS || newY >= ROWS) return true;
      if (newY >= 0 && board[newY][newX] !== EMPTY) return true;
    }
  }
  return false;
}

function mergePiece() {
  for (let y = 0; y < currentPiece.matrix.length; y += 1) {
    for (let x = 0; x < currentPiece.matrix[y].length; x += 1) {
      if (!currentPiece.matrix[y][x]) continue;
      const boardY = currentPiece.y + y;
      const boardX = currentPiece.x + x;
      if (boardY >= 0) board[boardY][boardX] = currentPiece.color;
    }
  }
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every((cell) => cell !== EMPTY)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(EMPTY));
      cleared += 1;
      y += 1;
    }
  }
  if (cleared) {
    lines += cleared;
    score += [0, 100, 300, 500, 800][cleared] || 0;
    dropInterval = Math.max(180, dropInterval - 35 * cleared);
    updateHud();
    playClearSound();
  }
}

function spawnPiece() {
  currentPiece = nextPiece;
  nextPiece = randomPiece();
  if (collide(currentPiece)) {
    gameOver = true;
    playGameOverSound();
  }
}

function rotateMatrix(matrix) {
  return matrix[0].map((_, index) => matrix.map((row) => row[index]).reverse());
}

function rotatePiece() {
  if (!currentPiece || gameOver || paused) return;
  const rotated = rotateMatrix(currentPiece.matrix);
  const previous = currentPiece.matrix;
  currentPiece.matrix = rotated;
  if (collide(currentPiece)) {
    currentPiece.matrix = previous;
  } else {
    playRotateSound();
  }
}

function movePiece(dx, dy) {
  if (!currentPiece || gameOver || paused) return;
  if (!collide(currentPiece, dx, dy)) {
    currentPiece.x += dx;
    currentPiece.y += dy;
    if (dx !== 0 || dy !== 0) {
      playMoveSound();
    }
    return true;
  }
  if (dy === 1) {
    mergePiece();
    clearLines();
    spawnPiece();
  }
  return false;
}

function hardDrop() {
  if (!currentPiece || gameOver || paused) return;
  while (!collide(currentPiece, 0, 1)) {
    currentPiece.y += 1;
  }
  movePiece(0, 1);
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.fillRect(x * blockSize + 2, y * blockSize + 2, blockSize - 4, blockSize - 4);
  ctx.shadowBlur = 0;
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#060816';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (board[y][x] !== EMPTY) drawCell(x, y, board[y][x]);
    }
  }
  if (currentPiece) {
    for (let y = 0; y < currentPiece.matrix.length; y += 1) {
      for (let x = 0; x < currentPiece.matrix[y].length; x += 1) {
        if (currentPiece.matrix[y][x]) {
          const drawY = currentPiece.y + y;
          const drawX = currentPiece.x + x;
          if (drawY >= 0) drawCell(drawX, drawY, currentPiece.color);
        }
      }
    }
  }

  if (gameOver) {
    ctx.fillStyle = 'rgba(6, 8, 22, 0.78)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 8);
    ctx.font = '16px Segoe UI';
    ctx.fillText('Press Start / Restart', canvas.width / 2, canvas.height / 2 + 24);
  }
}

function drawPreview() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  nextCtx.fillStyle = '#060816';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  const preview = nextPiece || randomPiece();
  const offsetX = 2;
  const offsetY = 2;
  const cell = 36;
  preview.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        nextCtx.fillStyle = preview.color;
        nextCtx.shadowBlur = 12;
        nextCtx.shadowColor = preview.color;
        nextCtx.fillRect(offsetX + x * cell, offsetY + y * cell, cell - 6, cell - 6);
        nextCtx.shadowBlur = 0;
      }
    });
  });
}

function draw() {
  drawBoard();
  drawPreview();
}

function tick(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  dropCounter += delta;
  if (!gameOver && dropCounter > dropInterval) {
    movePiece(0, 1);
    dropCounter = 0;
  }
  draw();
  requestAnimationFrame(tick);
}

function handleKeydown(event) {
  ensureAudio();
  if (event.code === 'ArrowLeft') {
    movePiece(-1, 0);
  } else if (event.code === 'ArrowRight') {
    movePiece(1, 0);
  } else if (event.code === 'ArrowDown') {
    movePiece(0, 1);
  } else if (event.code === 'ArrowUp') {
    rotatePiece();
  } else if (event.code === 'Space') {
    hardDrop();
    event.preventDefault();
  }
}

startBtn.addEventListener('click', resetGame);
document.addEventListener('keydown', handleKeydown);

resetGame();
requestAnimationFrame(tick);
