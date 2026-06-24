// State Management
let gameData = null;
let currentDifficulty = 'easy';

// DOM Elements
const cardDisplay = document.getElementById('cardDisplay');
const nextBtn = document.getElementById('nextBtn');
const tabs = document.querySelectorAll('.tab-btn');

// Fetch Game Data
async function loadGameData() {
  try {
    const response = await fetch('./games.json');
    gameData = await response.json();
  } catch (error) {
    console.error('Error loading game data:', error);
  }
}

// Draw a random item from the active pool
function drawCard() {
  if (!gameData || !gameData[currentDifficulty]) return;
  
  const pool = gameData[currentDifficulty];
  const randomIndex = Math.floor(Math.random() * pool.length);
  const item = pool[randomIndex];

  cardDisplay.innerHTML = ''; // Clear card area

  if (item.type === 'image') {
    const img = document.createElement('img');
    img.src = item.content;
    img.alt = item.answer || 'Charades cue';
    img.className = 'game-image';
    cardDisplay.appendChild(img);
  } else {
    const textNode = document.createElement('div');
    textNode.className = 'game-card';
    textNode.textContent = item.content;
    cardDisplay.appendChild(textNode);
  }
}

// Event Listeners for Tabs
tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    tabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentDifficulty = e.target.getAttribute('data-difficulty');
    cardDisplay.innerHTML = `<p class="instruction">${currentDifficulty.toUpperCase()} mode selected. Tap Next!</p>`;
  });
});

nextBtn.addEventListener('click', drawCard);

// Initialize App
window.addEventListener('DOMContentLoaded', async () => {
  await loadGameData();
  
  // Register Service Worker for PWA functionality
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker Registered Successfully');
    } catch (error) {
      console.log('Service Worker Registration Failed', error);
    }
  }
});
