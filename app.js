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
  
  const pool = gameData[currentDifficulty];
  const item = pool[Math.floor(Math.random() * pool.length)];

  // 1. Fade out current content
  cardContent.classList.add('fade-out');

  // 2. Wait for fade, then swap content and fade back in
  setTimeout(() => {
    cardContent.innerHTML = ''; // Clear container

    if (item.type === 'image') {
      const img = document.createElement('img');
      img.src = item.content;
      img.alt = item.answer || 'Charades image';
      img.className = 'game-image';
      cardContent.appendChild(img);
    } else {
      const textNode = document.createElement('h2');
      textNode.className = 'game-word';
      textNode.textContent = item.content;
      cardContent.appendChild(textNode);
    }

    // Remove fade class to reveal new content
    cardContent.classList.remove('fade-out');
  }, 200); // 200ms matches the CSS transition time
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
