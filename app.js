let gameData = null;
let currentDifficulty = 'easy';

const cardContent = document.getElementById('cardContent');
const nextBtn = document.getElementById('nextBtn');
const tabs = document.querySelectorAll('.tab-btn');

async function loadGameData() {
  try {
    const response = await fetch('./games.json');
    gameData = await response.json();
  } catch (error) {
    console.error('Error loading game data:', error);
    cardContent.innerHTML = '<p class="placeholder-text">Error loading words!</p>';
  }
}

function drawCard() {
  if (!gameData || !gameData[currentDifficulty]) return;

  cardContent.innerHTML = ''; // Clear container

  // Logic for the Toddler Image Mode
  if (currentDifficulty === 'easy') {
    const totalImages = gameData.easy.totalImages;
    // Pick a random number between 1 and totalImages
    const randomImgNumber = Math.floor(Math.random() * totalImages) + 1;
    
    const img = document.createElement('img');
    img.src = `images/${randomImgNumber}.png`; // Calls 1.png, 2.png, etc.
    img.alt = 'Charades image';
    img.className = 'game-image';
    cardContent.appendChild(img);
  } 
  // Logic for the Text Modes
  else {
    const pool = gameData[currentDifficulty];
    // Grab a random string from the array
    const selectedWord = pool[Math.floor(Math.random() * pool.length)];

    const textNode = document.createElement('h2');
    textNode.className = 'game-word';
    textNode.textContent = selectedWord; // Directly assign the text
    cardContent.appendChild(textNode);
  }
}

// Tab Switching Logic
tabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    tabs.forEach(t => t.classList.remove('active'));
    e.target.classList.add('active');
    currentDifficulty = e.target.getAttribute('data-difficulty');
    
    // Reset to placeholder when switching modes
    cardContent.classList.add('fade-out');
    setTimeout(() => {
      cardContent.innerHTML = `<p class="placeholder-text">${currentDifficulty.toUpperCase()} mode ready.</p>`;
      cardContent.classList.remove('fade-out');
    }, 200);
  });
});

nextBtn.addEventListener('click', drawCard);

window.addEventListener('DOMContentLoaded', async () => {
  await loadGameData();
  
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
    } catch (error) {
      console.log('SW registration failed');
    }
  }
});
