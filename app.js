// State Management
let gameData = null;
let currentDifficulty = 'easy';
let shuffledBags = { easy: [], medium: [], hard: [] };

// Timer State
let timerInterval;
let currentDuration = 60;
let timeLeft = 60;

// DOM Elements
const cardContent = document.getElementById('cardContent');
const nextBtn = document.getElementById('nextBtn');
const tabs = document.querySelectorAll('.tab-btn');
const timeSlider = document.getElementById('timeSlider');
const timeDisplay = document.getElementById('timeDisplay');
const progressBar = document.getElementById('progressBar');

// Audio Context (must be initialized after user clicks)
let audioCtx;

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

// Synth Buzzer Sound (No external audio file needed!)
function playBuzzer() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.type = 'sawtooth'; // Gives it that harsh "game show buzzer" vibe
  oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); // Low pitch
  
  // Fade out slightly over 1 second
  gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1);
  
  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 1);
}

// Timer Logic
function startTimer() {
  clearInterval(timerInterval); // Reset any existing timer
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
      playBuzzer();
    }
  }, 1000);
}

// Draw Card & Start Round
function drawCard() {
  if (!gameData || !gameData[currentDifficulty]) return;
  
  // Initialize audio context on first user click to bypass browser auto-play blocks
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();

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
    startTimer(); // Kick off the timer when the card is revealed
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
      progressBar.style.width = '100%';
      progressBar.classList.remove('warning');
    }, 200);
  });
});

timeSlider.addEventListener('input', (e) => {
  currentDuration = parseInt(e.target.value);
  timeDisplay.textContent = currentDuration;
  clearInterval(timerInterval); // Stop active timer if they change the slider
  progressBar.style.width = '100%';
  progressBar.classList.remove('warning');
});

nextBtn.addEventListener('click', drawCard);

window.addEventListener('DOMContentLoaded', async () => {
  await loadGameData();
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW registration failed', err));
  }
});
