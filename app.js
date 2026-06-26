// ==========================================
// 1. GAME DEFINITIONS & STATE
// ==========================================
const GAME_MODES = {
  toddler: {
    dataKey: 'easy',
    title: '🐱 Toddler Mode',
    useTimer: false,
    isScored: false
  },
  classic: {
    dataKey: 'words',
    title: '⭐ Classic Charades',
    useTimer: true,
    isScored: false
  },
  challenge: {
    dataKey: 'words',
    title: '⚡ Lightning Round',
    useTimer: true,
    isScored: true
  }
};

let gameData = null;
let shuffledBags = { easy: [], words: [] };
let currentModeKey = 'toddler';
let currentDuration = 60;
let timeLeft = 60;
let currentScore = 0;
let timerInterval = null;
let buzzerTimeout = null;

const buzzerSound = new Audio('audio/buzzer.mp3');

// ==========================================
// 2. DOM ELEMENT DECLARATIONS
// ==========================================
const views = document.querySelectorAll('.view');
const modeCards = document.querySelectorAll('.mode-card');
const lobbyTimerContainer = document.getElementById('lobbyTimerContainer');
const timeSlider = document.getElementById('timeSlider');
const timeDisplay = document.getElementById('timeDisplay');
const startGameBtn = document.getElementById('startGameBtn');

const stageModeTitle = document.getElementById('stageModeTitle');
const scoreDisplay = document.getElementById('scoreDisplay');
const scoreValue = document.getElementById('scoreValue');
const cardContent = document.getElementById('cardContent');
const progressContainer = document.querySelector('.progress-container');
const progressBar = document.getElementById('progressBar');

const controlsPreStart = document.getElementById('controlsPreStart');
const controlsManual = document.getElementById('controlsManual');
const controlsLightning = document.getElementById('controlsLightning');
const startTimerBtn = document.getElementById('startTimerBtn');
const nextCardBtn = document.getElementById('nextCardBtn');
const skipBtn = document.getElementById('skipBtn');
const correctBtn = document.getElementById('correctBtn');
const exitStageBtn = document.getElementById('exitStageBtn');

const recapScoreContainer = document.getElementById('recapScoreContainer');
const recapScoreValue = document.getElementById('recapScoreValue');
const playAgainBtn = document.getElementById('playAgainBtn');
const changeModeBtn = document.getElementById('changeModeBtn');

// ==========================================
// 3. CORE ROUTER ENGINE
// ==========================================
function setView(viewId) {
  views.forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewId}`).classList.add('active');
}

// ==========================================
// 4. DATA & SHUFFLE BAG LOGIC
// ==========================================
async function loadGameData() {
  try {
    const response = await fetch('./games.json');
    gameData = await response.json();
  } catch (error) {
    console.error('Error loading game data:', error);
    cardContent.innerHTML = '<p class="placeholder-text">Error loading words!</p>';
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getNextCard() {
  const dataKey = GAME_MODES[currentModeKey].dataKey;
  
  if (!shuffledBags[dataKey] || shuffledBags[dataKey].length === 0) {
    if (dataKey === 'easy') {
      shuffledBags.easy = Array.from({ length: gameData.easy.totalImages }, (_, i) => i + 1);
    } else {
      shuffledBags[dataKey] = [...gameData[dataKey]];
    }
    shuffleArray(shuffledBags[dataKey]);
  }
  return shuffledBags[dataKey].pop();
}

function drawCard() {
  if (!gameData) return;
  const item = getNextCard();
  const dataKey = GAME_MODES[currentModeKey].dataKey;

  cardContent.classList.add('fade-out');
  setTimeout(() => {
    cardContent.innerHTML = '';
    if (dataKey === 'easy') {
      const img = document.createElement('img');
      img.src = `images/${item}.png`;
      img.alt = 'Charades image';
      img.className = 'game-image';
      cardContent.appendChild(img);
    } else {
      const textNode = document.createElement('h2');
      textNode.className = 'game-word';
      textNode.textContent = item;
      cardContent.appendChild(textNode);
    }
    cardContent.classList.remove('fade-out');
  }, 150);
}

// ==========================================
// 5. VIEW HANDLERS & TIMER ENGINE
// ==========================================
function updateLobbyUI() {
  modeCards.forEach(c => {
    c.classList.toggle('selected', c.getAttribute('data-mode') === currentModeKey);
  });
  
  const config = GAME_MODES[currentModeKey];
  if (config.useTimer) {
    lobbyTimerContainer.classList.remove('hidden');
  } else {
    lobbyTimerContainer.classList.add('hidden');
  }
}

function initStage() {
  const config = GAME_MODES[currentModeKey];
  stageModeTitle.textContent = config.title;
  
  clearInterval(timerInterval);
  clearTimeout(buzzerTimeout);
  progressContainer.classList.remove('active');
  progressBar.style.width = '100%';
  progressBar.classList.remove('warning');

  currentScore = 0;
  scoreValue.textContent = '0';
  if (config.isScored) {
    scoreDisplay.classList.remove('hidden');
  } else {
    scoreDisplay.classList.add('hidden');
  }

  controlsPreStart.classList.add('hidden');
  controlsManual.classList.add('hidden');
  controlsLightning.classList.add('hidden');

  drawCard();

  if (!config.useTimer) {
    controlsManual.classList.remove('hidden');
    exitStageBtn.textContent = 'Back to Menu';
  } else {
    controlsPreStart.classList.remove('hidden');
    exitStageBtn.textContent = 'End Round Early';
  }

  setView('stage');
}

function startActiveTimer() {
  const config = GAME_MODES[currentModeKey];
  controlsPreStart.classList.add('hidden');
  
  if (config.isScored) {
    controlsLightning.classList.remove('hidden');
  } else {
    controlsManual.classList.remove('hidden');
  }

  timeLeft = currentDuration;
  progressContainer.classList.add('active');

  timerInterval = setInterval(() => {
    timeLeft--;
    const pct = (timeLeft / currentDuration) * 100;
    progressBar.style.width = `${pct}%`;

    if (pct <= 25) progressBar.classList.add('warning');

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      buzzerTimeout = setTimeout(() => {
        buzzerSound.currentTime = 0;
        buzzerSound.play().catch(e => console.log('Audio blocked', e));
        triggerRecap();
      }, 1000);
    }
  }, 1000);
}

function triggerRecap() {
  clearInterval(timerInterval);
  clearTimeout(buzzerTimeout);
  progressContainer.classList.remove('active');

  const config = GAME_MODES[currentModeKey];
  if (config.isScored) {
    recapScoreValue.textContent = currentScore;
    recapScoreContainer.classList.remove('hidden');
  } else {
    recapScoreContainer.classList.add('hidden');
  }

  setView('recap');
}

function abortStage() {
  clearInterval(timerInterval);
  clearTimeout(buzzerTimeout);
  progressContainer.classList.remove('active');
  setView('lobby');
}

// ==========================================
// 6. EVENT LISTENERS
// ==========================================
modeCards.forEach(card => {
  card.addEventListener('click', () => {
    currentModeKey = card.getAttribute('data-mode');
    updateLobbyUI();
  });
});

timeSlider.addEventListener('input', (e) => {
  currentDuration = parseInt(e.target.value, 10);
  timeDisplay.textContent = currentDuration;
});

startGameBtn.addEventListener('click', initStage);
startTimerBtn.addEventListener('click', startActiveTimer);
nextCardBtn.addEventListener('click', drawCard);
exitStageBtn.addEventListener('click', abortStage);

skipBtn.addEventListener('click', drawCard);
correctBtn.addEventListener('click', () => {
  currentScore++;
  scoreValue.textContent = currentScore;
  drawCard();
});

playAgainBtn.addEventListener('click', initStage);
changeModeBtn.addEventListener('click', () => setView('lobby'));

window.addEventListener('DOMContentLoaded', async () => {
  updateLobbyUI();
  await loadGameData();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW fail', err));
  }
});
