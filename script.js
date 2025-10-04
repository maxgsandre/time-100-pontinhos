// Game State Management
class GameManager {
    constructor() {
        this.players = [];
        this.currentRound = 1;
        this.gamePhase = 'setup'; // 'setup', 'game', 'results'
        this.roundScores = {};
        this.totalScores = {};
        
        this.initializeEventListeners();
        this.updateUI();
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Player management
        document.getElementById('add-player').addEventListener('click', () => this.addPlayer());
        document.getElementById('player-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPlayer();
        });

        // Game controls
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('new-round').addEventListener('click', () => this.newRound());
        document.getElementById('confirm-round').addEventListener('click', () => this.confirmRound());
        document.getElementById('end-game').addEventListener('click', () => this.endGame());
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
    }

    // Player Management
    addPlayer() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();

        if (!name) {
            this.showToast('Digite um nome válido', 'error');
            return;
        }

        if (this.players.some(player => player.name.toLowerCase() === name.toLowerCase())) {
            this.showToast('Já existe um jogador com este nome', 'error');
            return;
        }

        if (this.players.length >= 8) {
            this.showToast('Máximo de 8 jogadores', 'error');
            return;
        }

        const player = {
            id: Date.now(),
            name: name,
            totalScore: 0,
            isEliminated: false
        };

        this.players.push(player);
        this.totalScores[player.id] = 0;
        
        nameInput.value = '';
        this.updateUI();
        this.showToast(`${name} adicionado ao jogo`, 'success');
    }

    removePlayer(playerId) {
        const playerIndex = this.players.findIndex(p => p.id === playerId);
        if (playerIndex === -1) return;

        const playerName = this.players[playerIndex].name;
        this.players.splice(playerIndex, 1);
        delete this.totalScores[playerId];
        
        this.updateUI();
        this.showToast(`${playerName} removido do jogo`, 'warning');
    }

    // Game Flow
    startGame() {
        if (this.players.length < 3) {
            this.showToast('Mínimo de 3 jogadores para iniciar', 'error');
            return;
        }

        this.gamePhase = 'game';
        this.currentRound = 1;
        this.roundScores = {};
        
        // Initialize scores
        this.players.forEach(player => {
            this.totalScores[player.id] = 0;
            this.roundScores[player.id] = 0;
        });

        this.updateUI();
        this.showToast('Jogo iniciado! Boa sorte!', 'success');
    }

    newRound() {
        this.currentRound++;
        this.roundScores = {};
        
        this.players.forEach(player => {
            this.roundScores[player.id] = 0;
        });

        this.updateUI();
        this.showToast(`Rodada ${this.currentRound} iniciada`, 'success');
    }

    confirmRound() {
        // Validate all inputs
        const inputs = document.querySelectorAll('.points-input');
        let allValid = true;
        let totalPoints = 0;

        inputs.forEach(input => {
            const value = parseInt(input.value) || 0;
            if (value < 0) {
                allValid = false;
                input.style.borderColor = '#f56565';
            } else {
                input.style.borderColor = '#e2e8f0';
                totalPoints += value;
            }
        });

        if (!allValid) {
            this.showToast('Pontos não podem ser negativos', 'error');
            return;
        }

        // Update scores
        this.players.forEach(player => {
            const input = document.querySelector(`input[data-player-id="${player.id}"]`);
            const roundScore = parseInt(input.value) || 0;
            
            this.totalScores[player.id] += roundScore;
            this.roundScores[player.id] = roundScore;

            // Check for elimination
            if (this.totalScores[player.id] >= 100 && !player.isEliminated) {
                player.isEliminated = true;
                this.showToast(`${player.name} foi eliminado! (${this.totalScores[player.id]} pontos)`, 'warning');
            }
        });

        // Check for game end
        const activePlayers = this.players.filter(p => !p.isEliminated);
        if (activePlayers.length <= 1) {
            this.endGame();
            return;
        }

        this.updateUI();
        this.showToast(`Pontos da rodada ${this.currentRound} registrados`, 'success');
    }

    endGame() {
        this.gamePhase = 'results';
        this.updateUI();
        
        // Show winner
        const winner = this.getWinner();
        if (winner) {
            this.showToast(`${winner.name} venceu o jogo!`, 'success');
        }
    }

    newGame() {
        this.players = [];
        this.currentRound = 1;
        this.gamePhase = 'setup';
        this.roundScores = {};
        this.totalScores = {};
        
        document.getElementById('player-name').value = '';
        this.updateUI();
        this.showToast('Novo jogo iniciado', 'success');
    }

    // Utility Methods
    getWinner() {
        const activePlayers = this.players.filter(p => !p.isEliminated);
        if (activePlayers.length === 0) return null;
        
        return activePlayers.reduce((winner, player) => 
            this.totalScores[player.id] < this.totalScores[winner.id] ? player : winner
        );
    }

    getRanking() {
        return [...this.players].sort((a, b) => {
            // Eliminated players go to the end
            if (a.isEliminated && !b.isEliminated) return 1;
            if (!a.isEliminated && b.isEliminated) return -1;
            
            // Among active players, sort by score (ascending)
            return this.totalScores[a.id] - this.totalScores[b.id];
        });
    }

    // UI Updates
    updateUI() {
        this.updatePhase();
        this.updatePlayerCount();
        this.updatePlayersList();
        this.updateScoreboard();
        this.updateRoundInputs();
        this.updateResults();
    }

    updatePhase() {
        // Hide all phases
        document.querySelectorAll('.phase').forEach(phase => {
            phase.classList.remove('active');
        });

        // Show active phase
        document.getElementById(`${this.gamePhase}-phase`).classList.add('active');
    }

    updatePlayerCount() {
        document.getElementById('player-count').textContent = this.players.length;
        
        const startButton = document.getElementById('start-game');
        startButton.disabled = this.players.length < 3;
    }

    updatePlayersList() {
        const container = document.getElementById('players-container');
        
        if (this.players.length === 0) {
            container.innerHTML = `
                <div class="no-players">
                    <i class="fas fa-user-plus"></i>
                    <p>Adicione jogadores para começar</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.players.map(player => `
            <div class="player-card">
                <span class="player-name">${player.name}</span>
                <button class="remove-player" onclick="game.removePlayer(${player.id})" title="Remover jogador">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    updateScoreboard() {
        if (this.gamePhase !== 'game') return;

        const container = document.getElementById('scoreboard-content');
        const roundElement = document.getElementById('current-round');
        
        roundElement.textContent = this.currentRound;

        const ranking = this.getRanking();
        container.innerHTML = ranking.map(player => `
            <div class="scoreboard-player ${player.isEliminated ? 'eliminated' : ''}">
                <div class="player-name">${player.name}</div>
                <div class="total-score">${this.totalScores[player.id] || 0}</div>
            </div>
        `).join('');
    }

    updateRoundInputs() {
        if (this.gamePhase !== 'game') return;

        const container = document.getElementById('round-inputs');
        const confirmButton = document.getElementById('confirm-round');

        container.innerHTML = this.players.map(player => `
            <div class="round-input">
                <div class="player-name">${player.name}</div>
                <input 
                    type="number" 
                    class="points-input" 
                    data-player-id="${player.id}"
                    placeholder="0" 
                    min="0" 
                    value=""
                >
            </div>
        `).join('');

        // Add event listeners to inputs
        container.querySelectorAll('.points-input').forEach(input => {
            input.addEventListener('input', () => {
                const hasValues = Array.from(container.querySelectorAll('.points-input'))
                    .some(inp => inp.value && parseInt(inp.value) > 0);
                confirmButton.disabled = !hasValues;
            });
        });

        // Initial state
        confirmButton.disabled = true;
    }

    updateResults() {
        if (this.gamePhase !== 'results') return;

        const ranking = this.getRanking();
        const winner = ranking[0];
        const runnerUp = ranking[1];

        // Update podium
        document.getElementById('winner-name').textContent = winner ? winner.name : '-';
        document.getElementById('winner-score').textContent = winner ? `${this.totalScores[winner.id]} pontos` : '-';
        
        if (runnerUp) {
            document.getElementById('runner-up-name').textContent = runnerUp.name;
            document.getElementById('runner-up-score').textContent = `${this.totalScores[runnerUp.id]} pontos`;
        } else {
            document.getElementById('runner-up-name').textContent = '-';
            document.getElementById('runner-up-score').textContent = '-';
        }

        // Update final ranking
        const rankingContainer = document.getElementById('final-ranking-list');
        rankingContainer.innerHTML = ranking.map((player, index) => `
            <div class="ranking-item">
                <span class="ranking-position">${index + 1}º</span>
                <span class="ranking-name">${player.name}</span>
                <span class="ranking-score">${this.totalScores[player.id]} pontos</span>
            </div>
        `).join('');
    }

    // Toast Notifications
    showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span class="toast-message">${message}</span>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 4000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };
        return icons[type] || icons.success;
    }
}

// Initialize the game
let game;

document.addEventListener('DOMContentLoaded', () => {
    game = new GameManager();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                if (game.gamePhase === 'setup') {
                    document.getElementById('start-game').click();
                } else if (game.gamePhase === 'game') {
                    document.getElementById('confirm-round').click();
                }
                break;
            case 'n':
                e.preventDefault();
                if (game.gamePhase === 'game') {
                    document.getElementById('new-round').click();
                }
                break;
        }
    }
});
