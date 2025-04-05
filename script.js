// Добавляем статистику игры
const gameStats = {
    hits: 0,
    misses: 0,
    shipsSunk: 0,
    accuracy: 0,
    updateStats: function(hit) {
        if (hit) {
            this.hits++;
            this.shipsSunk++;
        } else {
            this.misses++;
        }
        this.accuracy = this.hits / (this.hits + this.misses) * 100;
        this.updateStatsDisplay();
    },
    updateStatsDisplay: function() {
        document.querySelector('.stat-value[data-stat="hits"]').textContent = this.hits;
        document.querySelector('.stat-value[data-stat="misses"]').textContent = this.misses;
        document.querySelector('.stat-value[data-stat="ships"]').textContent = this.shipsSunk;
        document.querySelector('.stat-value[data-stat="accuracy"]').textContent = 
            this.accuracy.toFixed(1) + '%';
    }
};

// Добавляем систему достижений
const achievements = {
    firstHit: false,
    firstSink: false,
    perfectAccuracy: false,
    checkAchievements: function(hit, accuracy) {
        if (hit && !this.firstHit) {
            this.firstHit = true;
            this.showAchievement('Первое попадание!');
        }
        if (gameStats.shipsSunk === 1 && !this.firstSink) {
            this.firstSink = true;
            this.showAchievement('Первый потопленный корабль!');
        }
        if (accuracy === 100 && !this.perfectAccuracy) {
            this.perfectAccuracy = true;
            this.showAchievement('Идеальная точность!');
        }
    },
    showAchievement: function(text) {
        const achievement = document.createElement('div');
        achievement.className = 'achievement';
        achievement.textContent = text;
        document.body.appendChild(achievement);
        setTimeout(() => achievement.remove(), 3000);
    }
};

// Улучшаем систему чата
function sendMessage(message) {
    const messagesDiv = document.querySelector('.messages');
    const messageElement = document.createElement('div');
    messageElement.className = 'message';
    messageElement.innerHTML = `
        <div class="message-content">${message}</div>
        <div class="timestamp">${new Date().toLocaleTimeString()}</div>
    `;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Добавляем звуковые эффекты
const sounds = {
    hit: new Audio('sounds/hit.mp3'),
    miss: new Audio('sounds/miss.mp3'),
    win: new Audio('sounds/win.mp3'),
    lose: new Audio('sounds/lose.mp3'),
    play: function(sound) {
        this[sound].currentTime = 0;
        this[sound].play();
    }
};

// Улучшаем анимации попаданий
function showHitAnimation(cell) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    cell.appendChild(explosion);
    setTimeout(() => explosion.remove(), 1000);
}

// Добавляем систему подсказок
const hints = {
    lastHit: null,
    showHint: function() {
        if (this.lastHit) {
            const [row, col] = this.lastHit;
            const possibleMoves = [
                [row - 1, col], [row + 1, col],
                [row, col - 1], [row, col + 1]
            ].filter(([r, c]) => r >= 0 && r < 10 && c >= 0 && c < 10);
            
            possibleMoves.forEach(([r, c]) => {
                const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                if (cell && !cell.classList.contains('hit') && !cell.classList.contains('miss')) {
                    cell.classList.add('hint');
                }
            });
        }
    },
    clearHints: function() {
        document.querySelectorAll('.hint').forEach(cell => {
            cell.classList.remove('hint');
        });
    }
};

// Обновляем функцию обработки хода
function handleCellClick(cell) {
    if (cell.classList.contains('hit') || cell.classList.contains('miss')) return;
    
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    // Проверяем попадание
    const hit = checkHit(row, col);
    
    if (hit) {
        cell.classList.add('hit');
        sounds.play('hit');
        showHitAnimation(cell);
        hints.lastHit = [row, col];
        gameStats.updateStats(true);
    } else {
        cell.classList.add('miss');
        sounds.play('miss');
        hints.clearHints();
        gameStats.updateStats(false);
    }
    
    achievements.checkAchievements(hit, gameStats.accuracy);
    
    // Проверяем конец игры
    if (checkGameEnd()) {
        const winner = determineWinner();
        showGameEnd(winner);
    }
}

// Добавляем функцию отображения конца игры
function showGameEnd(winner) {
    const endGameModal = document.createElement('div');
    endGameModal.className = 'end-game-modal';
    endGameModal.innerHTML = `
        <div class="end-game-content">
            <h2>${winner === 'player' ? 'Поздравляем! Вы победили!' : 'Игра окончена'}</h2>
            <div class="final-stats">
                <p>Точность: ${gameStats.accuracy.toFixed(1)}%</p>
                <p>Попаданий: ${gameStats.hits}</p>
                <p>Промахов: ${gameStats.misses}</p>
                <p>Потоплено кораблей: ${gameStats.shipsSunk}</p>
            </div>
            <button onclick="restartGame()">Играть снова</button>
        </div>
    `;
    document.body.appendChild(endGameModal);
    sounds.play(winner === 'player' ? 'win' : 'lose');
}

// Добавляем функцию перезапуска игры
function restartGame() {
    document.querySelector('.end-game-modal')?.remove();
    resetGame();
    gameStats.hits = 0;
    gameStats.misses = 0;
    gameStats.shipsSunk = 0;
    gameStats.accuracy = 0;
    gameStats.updateStatsDisplay();
    hints.lastHit = null;
    hints.clearHints();
}

// Добавляем стили для новых элементов
const style = document.createElement('style');
style.textContent = `
    .achievement {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass-background);
        padding: 15px 25px;
        border-radius: var(--border-radius);
        box-shadow: var(--box-shadow);
        animation: achievementAppear 0.5s ease-out;
        z-index: 1000;
    }
    
    .explosion {
        position: absolute;
        width: 100%;
        height: 100%;
        background: radial-gradient(circle, #ff0000 0%, transparent 70%);
        animation: explosion 1s ease-out;
    }
    
    .hint {
        box-shadow: 0 0 10px var(--warning-color);
    }
    
    .end-game-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .end-game-content {
        background: var(--glass-background);
        padding: 30px;
        border-radius: var(--border-radius);
        text-align: center;
        max-width: 400px;
        width: 90%;
    }
    
    .final-stats {
        margin: 20px 0;
    }
    
    @keyframes achievementAppear {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes explosion {
        0% { transform: scale(0); opacity: 1; }
        100% { transform: scale(2); opacity: 0; }
    }
`;
document.head.appendChild(style); 