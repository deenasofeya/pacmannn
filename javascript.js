const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const gameOverScreen = document.getElementById('game-over-screen');
const gameMessage = document.getElementById('game-message');

const GRID_SIZE = 20;
const TILE_SIZE = canvas.width / GRID_SIZE;

let score = 0;
let lives = 3;
let gameOver = false;
let pelletsLeft = 0;

// Dynamic map setup (1: Wall, 0: Strawberry Pellet, 2: Empty)
const map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,2,1,0,0,0,0,0,0,0,0,0,0,1,2,1,0,1],
    [1,0,1,1,1,0,1,1,1,2,2,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0,0,1],
    [1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1],
    [2,2,1,0,1,2,2,0,0,2,2,0,0,2,2,1,0,1,2,2],
    [1,1,1,0,1,2,1,1,2,1,1,2,1,1,2,1,0,1,1,1],
    [0,0,0,0,0,2,1,2,2,2,2,2,2,1,2,0,0,0,0,0],
    [1,1,1,0,1,2,1,1,1,1,1,1,1,1,2,1,0,1,1,1],
    [2,2,1,0,1,2,2,2,2,2,2,2,2,2,2,1,0,1,2,2],
    [1,1,1,0,1,0,1,1,1,1,1,1,1,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,1,0,1,1,0,1,1,0,1,1,1,0,1],
    [1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,0,1,0,1,0,1,1,1,1,0,1,0,1,0,1,1,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

let currentMap = [];

class Pacman {
    constructor() {
        this.resetPosition();
        this.nextDx = 0;
        this.nextDy = 0;
        this.mouthAngle = 0.2;
        this.mouthSpeed = 0.02;
    }

    resetPosition() {
        this.x = 9.5 * TILE_SIZE;
        this.y = 13.5 * TILE_SIZE;
        this.dx = 0;
        this.dy = 0;
        this.radius = TILE_SIZE / 2 - 2;
    }

    draw() {
        // Animasi mulut
        this.mouthAngle += this.mouthSpeed;
        if (this.mouthAngle > 0.4 || this.mouthAngle < 0.05) {
            this.mouthSpeed = -this.mouthSpeed;
        }

        let angle = 0;
        if (this.dx > 0) angle = 0;
        if (this.dx < 0) angle = Math.PI;
        if (this.dy > 0) angle = Math.PI / 2;
        if (this.dy < 0) angle = -Math.PI / 2;

        ctx.beginPath();
        ctx.arc(
            this.x, this.y, this.radius,
            angle + this.mouthAngle,
            angle + Math.PI * 2 - this.mouthAngle
        );
        ctx.lineTo(this.x, this.y);
        ctx.fillStyle = '#ff4d6d'; // Warna Pink/Strawberi Pacman
        ctx.fill();
        ctx.closePath();
    }

    update() {
        // Cuba tukar arah ke nextDx/nextDy jika tiada dinding
        if (this.canMove(this.nextDx, this.nextDy)) {
            this.dx = this.nextDx;
            this.dy = this.nextDy;
        }

        if (this.canMove(this.dx, this.dy)) {
            this.x += this.dx * 2;
            this.y += this.dy * 2;
        }

        // Kerapian Posisi Warp / Skrin Sisi
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;

        // Makan Strawberi Pellets
        let gridX = Math.floor(this.x / TILE_SIZE);
        let gridY = Math.floor(this.y / TILE_SIZE);

        if (currentMap[gridY] && currentMap[gridY][gridX] === 0) {
            currentMap[gridY][gridX] = 2;
            score += 10;
            pelletsLeft--;
            scoreEl.innerText = score;
            if (pelletsLeft === 0) {
                endGame(true);
            }
        }
    }

    canMove(dx, dy) {
        let speed = 2;
        let nextX = this.x + dx * speed;
        let nextY = this.y + dy * speed;
        let r = this.radius;

        // Semak 4 bucu Pacman
        let corners = [
            { x: nextX - r, y: nextY - r },
            { x: nextX + r, y: nextY - r },
            { x: nextX - r, y: nextY + r },
            { x: nextX + r, y: nextY + r }
        ];

        return corners.every(c => {
            let gx = Math.floor(c.x / TILE_SIZE);
            let gy = Math.floor(c.y / TILE_SIZE);
            return currentMap[gy] && currentMap[gy][gx] !== 1;
        });
    }
}

class Ghost {
    constructor(x, y, color) {
        this.startX = x;
        this.startY = y;
        this.color = color;
        this.resetPosition();
    }

    resetPosition() {
        this.x = this.startX * TILE_SIZE + TILE_SIZE / 2;
        this.y = this.startY * TILE_SIZE + TILE_SIZE / 2;
        this.dx = 0;
        this.dy = -1;
    }

    draw() {
        let r = TILE_SIZE / 2 - 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y - 2, r, Math.PI, 0, false);
        ctx.lineTo(this.x + r, this.y + r);
        ctx.lineTo(this.x - r, this.y + r);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Mata Hantu
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 4, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 4, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        let speed = 1.5;
        let possibleDirections = [];
        const directions = [
            { dx: 0, dy: -1 },
            { dx: 0, dy: 1 },
            { dx: -1, dy: 0 },
            { dx: 1, dy: 0 }
        ];

        // Pilih arah secara rawak apabila tiba di persimpangan
        directions.forEach(dir => {
            if (dir.dx !== -this.dx || dir.dy !== -this.dy) {
                let nextX = this.x + dir.dx * speed;
                let nextY = this.y + dir.dy * speed;
                let r = TILE_SIZE / 2 - 2;
                let gx = Math.floor((nextX + dir.dx * r) / TILE_SIZE);
                let gy = Math.floor((nextY + dir.dy * r) / TILE_SIZE);

                if (currentMap[gy] && currentMap[gy][gx] !== 1) {
                    possibleDirections.push(dir);
                }
            }
        });

        if (possibleDirections.length > 0) {
            let move = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
            this.dx = move.dx;
            this.dy = move.dy;
        }

        this.x += this.dx * speed;
        this.y += this.dy * speed;
    }
}

const pacman = new Pacman();
const ghosts = [
    new Ghost(9, 9, '#ff758f'),
    new Ghost(10, 9, '#a2d2ff'),
    new Ghost(9, 8, '#b5e7a0')
];

function drawStrawberry(x, y) {
    let cx = x * TILE_SIZE + TILE_SIZE / 2;
    let cy = y * TILE_SIZE + TILE_SIZE / 2;
    
    // Buah Strawberi
    ctx.beginPath();
    ctx.arc(cx, cy + 1, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0054';
    ctx.fill();
    ctx.closePath();

    // Daun Strawberi (Hijau)
    ctx.beginPath();
    ctx.arc(cx, cy - 3, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#38b000';
    ctx.fill();
    ctx.closePath();
}

function drawMap() {
    for (let r = 0; r < MAP_HEIGHT; r++) {
        for (let c = 0; c < MAP_WIDTH; c++) {
            if (currentMap[r][c] === 1) {
                ctx.fillStyle = '#800f2f'; // Dinding Datar Tema Strawberi
                ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#ff4d6d';
                ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            } else if (currentMap[r][c] === 0) {
                drawStrawberry(c, r);
            }
        }
    }
}

const MAP_HEIGHT = map.length;
const MAP_WIDTH = map[0].length;

function initGame() {
    score = 0;
    lives = 3;
    gameOver = false;
    pelletsLeft = 0;
    scoreEl.innerText = score;
    livesEl.innerText = lives;

    // Salin peta asal & kira bilangan pellet strawberi
    currentMap = map.map(row => [...row]);
    for (let r = 0; r < MAP_HEIGHT; r++) {
        for (let c = 0; c < MAP_WIDTH; c++) {
            if (currentMap[r][c] === 0) pelletsLeft++;
        }
    }

    pacman.resetPosition();
    ghosts.forEach(g => g.resetPosition());
    gameOverScreen.classList.add('hidden');
    gameLoop();
}

function checkCollision() {
    ghosts.forEach(ghost => {
        let dist = Math.hypot(pacman.x - ghost.x, pacman.y - ghost.y);
        if (dist < pacman.radius + TILE_SIZE / 2 - 4) {
            lives--;
            livesEl.innerText = lives;
            if (lives <= 0) {
                endGame(false);
            } else {
                pacman.resetPosition();
                ghosts.forEach(g => g.resetPosition());
            }
        }
    });
}

function endGame(won) {
    gameOver = true;
    gameMessage.innerText = won ? "ANDA MENANG! 🍓" : "GAME OVER 💀";
    gameOverScreen.classList.remove('hidden');
}

function resetGame() {
    initGame();
}

function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMap();
    pacman.update();
    pacman.draw();

    ghosts.forEach(ghost => {
        ghost.update();
        ghost.draw();
    });

    checkCollision();

    requestAnimationFrame(gameLoop);
}

// Kawalan Papan Kekunci
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            pacman.nextDx = 0;
            pacman.nextDy = -1;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            pacman.nextDx = 0;
            pacman.nextDy = 1;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            pacman.nextDx = -1;
            pacman.nextDy = 0;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            pacman.nextDx = 1;
            pacman.nextDy = 0;
            break;
    }
});

// Mula Permainan
initGame();