const CACHE_NAME = "airbuddy-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"]

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
})

// Fetch event - serve from cache when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If both cache and network fail, return offline page
        if (event.request.destination === "document") {
          return caches.match("/")
        }
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Background sync for data updates
self.addEventListener("sync", (event) => {
  if (event.tag === "air-quality-sync") {
    event.waitUntil(
      // Sync air quality data when connection is restored
      fetch("/api/air-quality")
        .then((response) => response.json())
        .then((data) => {
          // Update cached data
          return caches
            .open(CACHE_NAME)
            .then((cache) => cache.put("/api/air-quality", new Response(JSON.stringify(data))))
        }),
    )
  }
})
