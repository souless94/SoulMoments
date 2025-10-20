const CACHE_VERSION = 'v4';
const STATIC_CACHE = `life-moments-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `life-moments-dynamic-${CACHE_VERSION}`;
const RUNTIME_CACHE = `life-moments-runtime-${CACHE_VERSION}`;

// Static assets to cache immediately for complete offline functionality
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/img/icon-48-48.png',
  '/img/icon-72-72.png',
  '/img/icon-96-96.png',
  '/img/icon-144-144.png',
  '/img/icon-192-192.png',
  '/img/icon-512-512.png'
];

// Critical resources that must be cached for offline-first operation
const CRITICAL_RESOURCES = [
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/_next/static/media/'
];

// Assets to cache on first request for offline-first functionality
const RUNTIME_CACHE_PATTERNS = [
  /\/_next\/static\/.*/,
  /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
  /\/fonts\/.*/,
  /\/api\/.*/ // Cache API calls if any exist
];

// Offline-first: Cache everything needed for the app to work without internet
const OFFLINE_FIRST_PATTERNS = [
  /\/_next\/static\/chunks\/.*\.js$/,
  /\/_next\/static\/css\/.*\.css$/,
  /\/.*\.woff2?$/
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Cache size limits
const CACHE_LIMITS = {
  DYNAMIC: 50,
  RUNTIME: 100
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
        throw error;
      })
  );
});

// Activate event - clean up old caches and manage cache size
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, RUNTIME_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!currentCaches.includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Manage cache sizes
      manageCacheSize(DYNAMIC_CACHE, CACHE_LIMITS.DYNAMIC),
      manageCacheSize(RUNTIME_CACHE, CACHE_LIMITS.RUNTIME)
    ]).then(() => {
      console.log('Service worker activated and caches managed');
      return self.clients.claim();
    }).then(() => {
      // Notify all clients that the app is ready for offline use
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'OFFLINE_READY',
            message: 'App is ready for offline use'
          });
        });
      });
    }).catch((error) => {
      console.error('Service worker activation failed:', error);
    })
  );
});

// Helper function to manage cache size
async function manageCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
      const itemsToDelete = keys.length - maxItems;
      console.log(`Cleaning ${itemsToDelete} items from ${cacheName}`);
      
      // Delete oldest items (FIFO)
      for (let i = 0; i < itemsToDelete; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (error) {
    console.error(`Failed to manage cache size for ${cacheName}:`, error);
  }
}

// Fetch event - optimized cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip unsupported schemes (chrome-extension, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests that aren't same-origin
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle navigation requests (pages) - Cache first with network fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      handleNavigationRequest(request)
    );
    return;
  }

  // Handle static assets (cache first)
  if (STATIC_ASSETS.some(asset => url.pathname === asset)) {
    event.respondWith(
      handleStaticAssetRequest(request)
    );
    return;
  }

  // Handle runtime cacheable assets (stale while revalidate)
  if (RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(
      handleRuntimeCacheRequest(request)
    );
    return;
  }

  // Handle other requests (network first with cache fallback)
  event.respondWith(
    handleDynamicRequest(request)
  );
});

// Navigation request handler
async function handleNavigationRequest(request) {
  try {
    // Try cache first for offline capability
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      // Try network in background for updates
      fetch(request).then(response => {
        if (response.ok) {
          caches.open(STATIC_CACHE).then(cache => {
            cache.put('/', response.clone());
          });
        }
      }).catch(() => {
        // Network failed, but we have cache
      });
      
      return cachedResponse;
    }
    
    // No cache, try network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put('/', networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Navigation request failed:', error);
    // Return offline page if available
    return caches.match('/') || new Response('Offline', { status: 503 });
  }
}

// Static asset request handler
async function handleStaticAssetRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Static asset request failed:', error);
    return caches.match(request) || new Response('Asset not found', { status: 404 });
  }
}

// Runtime cache request handler (stale while revalidate)
async function handleRuntimeCacheRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network for updates
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || networkResponsePromise || new Response('Resource not available', { status: 503 });
}

// Dynamic request handler
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone()).catch(error => {
        console.warn('Failed to cache dynamic request:', error);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Network request failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache available
    return new Response('Network error and no cache available', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform any background sync operations here
      Promise.resolve().then(() => {
        console.log('Background sync completed');
      })
    );
  }
});

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      caches: [STATIC_CACHE, DYNAMIC_CACHE, RUNTIME_CACHE]
    });
  }
});

