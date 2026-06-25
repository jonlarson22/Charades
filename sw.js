const CACHE_NAME = 'charades-v1.4';

// 1. Install Event: Pre-cache core files AND all images
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // Cache the bones of the app
      await cache.addAll([
        './',
        './index.html',
        './style.css',
        './app.js',
        './games.json',
        './manifest.json',
        './audio/buzzer.mp3'
      ]);

      // Fetch games.json to figure out how many images exist
      try {
        const response = await fetch('./games.json');
        const gameData = await response.json();
        
        // Ensure totalImages is defined before looping
        if (gameData && gameData.easy && gameData.easy.totalImages) {
            const totalImages = gameData.easy.totalImages;
            const imagePaths = [];
            
            for (let i = 1; i <= totalImages; i++) {
              imagePaths.push(`./images/${i}.png`);
            }
            
            // Cache all images immediately
            await cache.addAll(imagePaths);
            console.log('All images pre-cached successfully for offline play!');
        }
      } catch (error) {
        console.error('Failed to pre-cache images:', error);
      }
    })()
  );
});

// 2. Fetch Event: Serve from cache first, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return the cached version if found, otherwise fetch from the internet
      return cachedResponse || fetch(event.request);
    })
  );
});

// 3. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Takes control of all open pages immediately
});
