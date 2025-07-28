// Estado do jogo
let gameState = {
    scoreA: 0,
    scoreB: 0,
    historyA: [],
    historyB: [],
    winsA: 0,
    winsB: 0,
    currentGame: 1,
    maxGames: 3,
    pointLimit: 12
};

// Controle de debounce para cliques rápidos
let isProcessing = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadGameState();
    updateDisplay();
    
    // Manter tela ligada
    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').catch(err => {
            console.log('Wake lock failed:', err);
        });
    }
    
    // Prevenir zoom duplo toque no Safari
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});

// Formatação do score
function formatScore(score) {
    return score.toString().padStart(2, '0');
}

// Atualizar display
function updateDisplay() {
    document.getElementById('scoreA').textContent = formatScore(gameState.scoreA);
    document.getElementById('scoreB').textContent = formatScore(gameState.scoreB);
    
    // Mostra o penúltimo score no histórico
    const prevA = gameState.historyA.length > 0 ? gameState.historyA[gameState.historyA.length - 1] : 0;
    const prevB = gameState.historyB.length > 0 ? gameState.historyB[gameState.historyB.length - 1] : 0;
    
    document.getElementById('prevScoreA').textContent = formatScore(prevA);
    document.getElementById('prevScoreB').textContent = formatScore(prevB);
    
    document.getElementById('winsA').textContent = gameState.winsA;
    document.getElementById('winsB').textContent = gameState.winsB;
    document.getElementById('currentGame').textContent = gameState.currentGame;
    document.getElementById('maxGames').textContent = gameState.maxGames;
    document.getElementById('pointLimit').textContent = gameState.pointLimit;
}

// Debounce para prevenir cliques múltiplos
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Adicionar pontos com proteção contra cliques rápidos
function addScore(team, points) {
    // Prevenir processamento múltiplo
    if (isProcessing) return;
    
    isProcessing = true;
    
    // Feedback visual imediato
    const button = event.target;
    button.classList.add('clicking');
    
    // Vibração se disponível
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }

    if (team === 'A') {
        gameState.historyA.push(gameState.scoreA);
        gameState.scoreA += points;
        document.getElementById('scoreA').classList.add('score-animation');
        setTimeout(() => {
            document.getElementById('scoreA').classList.remove('score-animation');
        }, 600);
    } else {
        gameState.historyB.push(gameState.scoreB);
        gameState.scoreB += points;
        document.getElementById('scoreB').classList.add('score-animation');
        setTimeout(() => {
            document.getElementById('scoreB').classList.remove('score-animation');
        }, 600);
    }
    
    saveGameState();
    updateDisplay();
    checkWinner();
    
    // Liberar processamento após um tempo
    setTimeout(() => {
        isProcessing = false;
        button.classList.remove('clicking');
    }, 300);
}

// Desfazer pontuação
function undoScore(team) {
    if (isProcessing) return;
    
    if (team === 'A' && gameState.historyA.length > 0) {
        gameState.scoreA = gameState.historyA.pop();
    } else if (team === 'B' && gameState.historyB.length > 0) {
        gameState.scoreB = gameState.historyB.pop();
    }
    
    saveGameState();
    updateDisplay();
}

// Verificar vencedor
function checkWinner() {
    if (gameState.scoreA >= gameState.pointLimit) {
        gameWon('A');
    } else if (gameState.scoreB >= gameState.pointLimit) {
        gameWon('B');
    }
}

// Partida ganha
function gameWon(team) {
    if (team === 'A') {
        gameState.winsA++;
    } else {
        gameState.winsB++;
    }

    const neededWins = Math.ceil(gameState.maxGames / 2);
    if (gameState.winsA >= neededWins || gameState.winsB >= neededWins) {
        showWinner(team);
    } else {
        // Próxima partida
        gameState.currentGame++;
        gameState.scoreA = 0;
        gameState.scoreB = 0;
        gameState.historyA = [];
        gameState.historyB = [];
        
        saveGameState();
        updateDisplay();
        
        // Pequena pausa antes da próxima partida
        setTimeout(() => {
            alert(`Partida ${gameState.currentGame - 1} finalizada! Começando partida ${gameState.currentGame}`);
        }, 100);
    }
}

// Mostrar vencedor
function showWinner(team) {
    const teamName = team === 'A' ? 
        document.getElementById('teamAName').textContent : 
        document.getElementById('teamBName').textContent;
    
    document.getElementById('winnerText').textContent = `${teamName} GANHOU!`;
    document.getElementById('winnerScore').textContent = `${gameState.winsA} x ${gameState.winsB}`;
    document.getElementById('winner').classList.add('show');
    
    // Vibração de vitória
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

// Nova partida completa
function newMatch() {
    gameState = {
        scoreA: 0,
        scoreB: 0,
        historyA: [],
        historyB: [],
        winsA: 0,
        winsB: 0,
        currentGame: 1,
        maxGames: gameState.maxGames,
        pointLimit: gameState.pointLimit
    };
    
    document.getElementById('winner').classList.remove('show');
    saveGameState();
    updateDisplay();
}

// Reset partida atual - CORRIGIDO
function resetGame() {
    if (confirm('Resetar tudo? (partida atual + vitórias)')) {
        // Reset completo: partida atual E vitórias
        gameState.scoreA = 0;
        gameState.scoreB = 0;
        gameState.historyA = [];
        gameState.historyB = [];
        gameState.winsA = 0;  // CORRIGIDO: resetar vitórias também
        gameState.winsB = 0;  // CORRIGIDO: resetar vitórias também
        gameState.currentGame = 1; // CORRIGIDO: voltar para partida 1
        
        saveGameState();
        updateDisplay();
    }
}

// Mostrar/ocultar configurações
function toggleSettings() {
    const settings = document.getElementById('settings');
    settings.classList.toggle('show');
    
    if (settings.classList.contains('show')) {
        // Carregar valores atuais
        document.getElementById('pointLimitSelect').value = gameState.pointLimit;
        document.getElementById('maxGamesSelect').value = gameState.maxGames;
        document.getElementById('teamAInput').value = document.getElementById('teamAName').textContent;
        document.getElementById('teamBInput').value = document.getElementById('teamBName').textContent;
        
        // Scroll para o topo no Safari
        settings.scrollTop = 0;
    }
}

// Atualizar configurações
function updateSettings() {
    gameState.pointLimit = parseInt(document.getElementById('pointLimitSelect').value);
    gameState.maxGames = parseInt(document.getElementById('maxGamesSelect').value);
    
    saveGameState();
    updateDisplay();
}

// Atualizar nomes dos times
function updateTeamNames() {
    const nameA = document.getElementById('teamAInput').value.trim() || 'TIME A';
    const nameB = document.getElementById('teamBInput').value.trim() || 'TIME B';
    
    document.getElementById('teamAName').textContent = nameA.toUpperCase();
    document.getElementById('teamBName').textContent = nameB.toUpperCase();
    
    saveGameState();
}

// Salvar estado no localStorage
function saveGameState() {
    const dataToSave = {
        ...gameState,
        teamAName: document.getElementById('teamAName').textContent,
        teamBName: document.getElementById('teamBName').textContent,
        timestamp: Date.now()
    };
    
    try {
        localStorage.setItem('trucoGameState', JSON.stringify(dataToSave));
    } catch (e) {
        console.log('Erro ao salvar:', e);
    }
}

// Carregar estado do localStorage
function loadGameState() {
    const saved = localStorage.getItem('trucoGameState');
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState = {
                scoreA: data.scoreA || 0,
                scoreB: data.scoreB || 0,
                historyA: data.historyA || [],
                historyB: data.historyB || [],
                winsA: data.winsA || 0,
                winsB: data.winsB || 0,
                currentGame: data.currentGame || 1,
                maxGames: data.maxGames || 3,
                pointLimit: data.pointLimit || 12
            };
            
            // Restaurar nomes dos times
            if (data.teamAName) {
                document.getElementById('teamAName').textContent = data.teamAName;
            }
            if (data.teamBName) {
                document.getElementById('teamBName').textContent = data.teamBName;
            }
        } catch (e) {
            console.log('Erro ao carregar estado salvo:', e);
            // Se der erro, usar estado padrão
            resetToDefault();
        }
    }
}

// Reset para estado padrão
function resetToDefault() {
    gameState = {
        scoreA: 0,
        scoreB: 0,
        historyA: [],
        historyB: [],
        winsA: 0,
        winsB: 0,
        currentGame: 1,
        maxGames: 3,
        pointLimit: 12
    };
}

// Prevenir comportamentos indesejados no Safari
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});

document.addEventListener('selectstart', function(e) {
    e.preventDefault();
});

// Prevenir scroll indevido
document.addEventListener('touchmove', function(e) {
    if (e.target.closest('.settings')) {
        // Permitir scroll apenas nas configurações
        return;
    }
    e.preventDefault();
}, { passive: false });