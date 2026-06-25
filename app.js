// State Management
let gameData = null;
let currentDifficulty = 'easy';
let shuffledBags = { easy: [], medium: [], hard: [] };

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
  clearInterval(timerInterval); // Reset any existing timer
  clearTimeout(buzzerTimeout);  // Reset any pending buzzer
  
  timeLeft = currentDuration;
  progressBar.style.width = '100%';
  progressBar.classList.remove('warning');

  timerInterval = setInterval(() => {
    timeLeft--;
    
    // Update visual bar width
    const percentage = (timeLeft / currentDuration) * 100;
    progressBar.style.width = `${percentage}%`;

    // Turn bar red at 25% remaining
    if (percentage <= 25) {
      progressBar.classList.add('warning');
    }

    // Time's Up!
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      
      // Wait 1 second for the CSS bar to visually slide to 0%
      buzzerTimeout = setTimeout(() => {
        playBuzzer();
      }, 1000); 
    }
  }, 1000);
}

// Draw Card & Start Round
// Draw Card & Start Round
function drawCard() {
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
    
    // Reset timer visuals but DO NOT start the clock yet
    clearInterval(timerInterval);
    clearTimeout(buzzerTimeout);
    progressBar.style.width = '100%';
    progressBar.classList.remove('warning');
    
    // Wake up the Start Timer button!
    startTimerBtn.disabled = false;
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
  progressBar.style.width = '100%';
  progressBar.classList.remove('warning');
});

startTimerBtn.addEventListener('click', () => {
  startTimerBtn.disabled = true; // Disable it so they can't spam click it
  startTimer();
});

nextBtn.addEventListener('click', drawCard);

window.addEventListener('DOMContentLoaded', async () => {
  await loadGameData();
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed', err));
  }
});
