// State Management
let gameData = null;
let currentDifficulty = 'easy';
let shuffledBags = { easy: [], medium: [], hard: [] };
let isLightningRound = false;
let currentScore = 0;

// Timer State
let timerInterval;
let buzzerTimeout;
let currentDuration = 60;
let timeLeft = 60;

// DOM Elements
const cardContent = document.getElementById('cardContent');
const nextBtn = document.getElementById('nextBtn');
const startTimerBtn = document.getElementById('startTimerBtn');
const tabs = document.querySelectorAll('.tab-btn');
const timeSlider = document.getElementById('timeSlider');
const timeDisplay = document.getElementById('timeDisplay');
const progressBar = document.getElementById('progressBar');
const lightningToggle = document.getElementById('lightningToggle');
const scoreDisplay = document.getElementById('scoreDisplay');
const scoreValue = document.getElementById('scoreValue');
const lightningControls = document.getElementById('lightningControls');
const correctBtn = document.getElementById('correctBtn');
const skipBtn = document.getElementById('skipBtn');
const cancelBtn = document.getElementById('cancelBtn');

// <-- NEW (Timer Fix): Helper function to fade the timer bar in and out safely
function toggleTimerVisibility(show) {
  const container = document.querySelector('.progress-container');
  if (container) {
    if (show) {
      container.classList.add('active');
    } else {
      container.classList.remove('active');
    }
  }
}

cancelBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  clearTimeout(buzzerTimeout);

  document.body.classList.remove('game-active');
  toggleTimerVisibility(false); // <-- NEW (Timer Fix): Hides bar when round is canceled
  
  // Reset UI back to default
  lightningControls.classList.add('hidden');
  cancelBtn.classList.add('hidden');
  
  // Bring back the main buttons
  startTimerBtn.classList.remove('hidden');
  startTimerBtn.disabled = false;
  nextBtn.classList.remove('hidden');
  
  scoreDisplay.classList.add('hidden');
  progressBar.style.width = '100%'; 
});

// Audio Setup
const buzzerSound = new Audio('audio/buzzer.mp3');

async function loadGameData() {
  try {
    const response = await fetch('./games.json');
    gameData = await response.json();
  } catch (error) {
    console.error('Error loading game data:', error);
    cardContent.innerHTML = '<p class="placeholder-text">Error loading words!</p>';
  }
}

// The "Shuffle Bag" Logic
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getNextCard() {
  // If the bag for this difficulty is empty, refill and reshuffle it!
  if (shuffledBags[currentDifficulty].length === 0) {
    if (currentDifficulty === 'easy') {
      // Creates an array of numbers: [1, 2, 3...]
      shuffledBags.easy = Array.from({ length: gameData.easy.totalImages }, (_, i) => i + 1);
    } else {
      // Copies the text array: ["Monkey", "Driving a Car"...]
      shuffledBags[currentDifficulty] = [...gameData[currentDifficulty]];
    }
    shuffleArray(shuffledBags[currentDifficulty]);
  }
  
  // Pop the last item off the shuffled array
  return shuffledBags[currentDifficulty].pop();
}

function playBuzzer() {
  buzzerSound.currentTime = 0; // Rewinds the track in case it's played twice in a row
  buzzerSound.play().catch(err => console.log('Audio blocked by browser:', err));
}

// Timer Logic
function startTimer() {
  clearInterval(timerInterval); 
  clearTimeout(buzzerTimeout);  

  document.body.classList.add('game-active');
  toggleTimerVisibility(true); // <-- NEW (Timer Fix): Shows bar when timer starts
  
  timeLeft = currentDuration;
  progressBar.style.width = '100%';
  progressBar.classList.remove('warning');

  // --- UI TOGGLES FOR ACTIVE PLAY ---
  startTimerBtn.classList.add('hidden'); // Hide Start Timer
  nextBtn.classList.add('hidden');       // Hide Next Card
  cancelBtn.classList.remove('hidden');  // Show End Round

  if (isLightningRound) {
    currentScore = 0;
    scoreValue.textContent = currentScore;
    scoreDisplay.classList.remove('hidden');
    lightningControls.classList.remove('hidden'); // Show Correct/Skip
  }

  timerInterval = setInterval(() => {
    timeLeft--;
    const percentage = (timeLeft / currentDuration) * 100;
    progressBar.style.width = `${percentage}%`;
  
    if (percentage <= 25) {
      progressBar.classList.add('warning');
    }
  
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      
      buzzerTimeout = setTimeout(() => {
        playBuzzer();
        document.body.classList.remove('game-active');
        toggleTimerVisibility(false); // <-- NEW (Timer Fix): Hides bar when time runs out
        
        // Reset UI completely after time runs out
        if (isLightningRound) {
          lightningControls.classList.add('hidden');
        }
        cancelBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
        startTimerBtn.classList.remove('hidden');
        startTimerBtn.disabled = false;
      }, 1000); 
    }
  }, 1000);
}

// Draw Card & Start Round
function drawCard(keepTimerRunning = false) {
  if (!gameData || !gameData[currentDifficulty]) return;

  const item = getNextCard();
  cardContent.classList.add('fade-out');

  setTimeout(() => {
    cardContent.innerHTML = ''; 

    if (currentDifficulty === 'easy') {
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
    
    // ONLY reset the timer and buttons if we are NOT in the middle of a Lightning Round
    if (!keepTimerRunning) {
      clearInterval(timerInterval);
      clearTimeout(buzzerTimeout);
      document.body.classList.remove('game-active');
      toggleTimerVisibility(false); // <-- NEW (Timer Fix): Hides bar on manual card draw
      
      progressBar.style.width = '100%';
      progressBar.classList.remove('warning');
      
      // Reset Button States for a fresh card
      startTimerBtn.classList.remove('hidden');
      startTimerBtn.disabled = false;
      nextBtn.classList.remove('hidden');
      
      scoreDisplay.classList.add('hidden');
      lightningControls.classList.add('hidden');
      cancelBtn.classList.add('hidden');
    }
  }, 200);
}

// Event Listeners
tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    tabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentDifficulty = e.target.getAttribute('data-difficulty');
    
    cardContent.classList.add('fade-out');
    setTimeout(() => {
      cardContent.innerHTML = `<p class="placeholder-text">${currentDifficulty.toUpperCase()} mode ready.</p>`;
      cardContent.classList.remove('fade-out');
      clearInterval(timerInterval); // Stop timer on tab switch
      clearTimeout(buzzerTimeout);
      toggleTimerVisibility(false); // <-- NEW (Timer Fix): Hides bar if they switch tabs mid-game
      
      progressBar.style.width = '100%';
      progressBar.classList.remove('warning');

      startTimerBtn.disabled = true; 
    }, 200);
  });
});

timeSlider.addEventListener('input', (e) => {
  currentDuration = parseInt(e.target.value);
  timeDisplay.textContent = currentDuration;
  clearInterval(timerInterval); // Stop active timer if they change the slider
  clearTimeout(buzzerTimeout);
  toggleTimerVisibility(false); // <-- NEW (Timer Fix): Hides bar if they adjust time mid-game
  
  progressBar.style.width = '100%';
  progressBar.classList.remove('warning');

  if (cardContent.querySelector('.game-image, .game-word')) {
    startTimerBtn.disabled = false;
  }
});

startTimerBtn.addEventListener('click', () => {
  startTimerBtn.disabled = true; // Disable it so they can't spam click it
  startTimer();
});

nextBtn.addEventListener('click', () => drawCard());

// Lightning Round Event Listeners
lightningToggle.addEventListener('change', (e) => {
  isLightningRound = e.target.checked;
  if (!isLightningRound) {
    // Reset UI if they turn it off mid-game
    scoreDisplay.classList.add('hidden');
    lightningControls.classList.add('hidden');
    nextBtn.classList.remove('hidden');
  }
});

correctBtn.addEventListener('click', () => {
  currentScore++;
  scoreValue.textContent = currentScore;
  drawCard(true); // Passes "true" so the timer keeps running!
});

skipBtn.addEventListener('click', () => {
  drawCard(true); // Passes "true" so the timer keeps running!
});

window.addEventListener('DOMContentLoaded', async () => {
  await loadGameData();
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed', err));
  }
});
