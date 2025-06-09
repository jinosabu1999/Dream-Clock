const CACHE_NAME = "dream-clock-v2"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png", "/offline.html"]

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching app shell")
        return cache.addAll(urlsToCache)
      })
      .then(() => {
        console.log("Service Worker installed successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Service Worker installation failed:", error)
      }),
  )
})

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Service Worker activated")
        return self.clients.claim()
      }),
  )
})

self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        console.log("Serving from cache:", event.request.url)
        return response
      }

      // Otherwise fetch from network
      console.log("Fetching from network:", event.request.url)
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          // Add to cache for future use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch((error) => {
          console.error("Fetch failed:", error)
          // Return offline page for navigation requests
          if (event.request.destination === "document") {
            return caches.match("/offline.html")
          }
          throw error
        })
    }),
  )
})

// Background sync for alarms (when browser supports it)
self.addEventListener("sync", (event) => {
  if (event.tag === "alarm-sync") {
    console.log("Background sync triggered for alarms")
    event.waitUntil(checkAlarms())
  }
})

// Check alarms function for background sync
async function checkAlarms() {
  try {
    // Get stored alarms from IndexedDB or localStorage
    const alarms = await getStoredAlarms()
    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" })

    alarms.forEach((alarm) => {
      if (alarm.enabled && alarm.time === currentTime && alarm.days.includes(currentDay)) {
        // Show notification
        self.registration.showNotification(`🔔 ${alarm.label || "Alarm"}`, {
          body: `Time: ${alarm.time}`,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: alarm.id,
          requireInteraction: true,
          actions: [
            { action: "snooze", title: "Snooze" },
            { action: "dismiss", title: "Dismiss" },
          ],
        })
      }
    })
  } catch (error) {
    console.error("Error checking alarms:", error)
  }
}

// Get stored alarms (fallback for offline functionality)
async function getStoredAlarms() {
  try {
    // Try to get from localStorage (since IndexedDB might not be available in SW)
    const clients = await self.clients.matchAll()
    if (clients.length > 0) {
      // Send message to client to get alarms
      clients[0].postMessage({ type: "GET_ALARMS" })
    }
    return []
  } catch (error) {
    console.error("Error getting stored alarms:", error)
    return []
  }
}

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.action)

  event.notification.close()

  if (event.action === "snooze") {
    // Handle snooze action
    console.log("Snooze action triggered")
  } else if (event.action === "dismiss") {
    // Handle dismiss action
    console.log("Dismiss action triggered")
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/")
        }
      }),
    )
  }
})

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
