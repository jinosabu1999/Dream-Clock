const CACHE_NAME = "dream-clock-v3"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png", "/offline.html"]

let alarms = []

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching app shell")
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn("Failed to cache some resources:", error)
          // Continue installation even if some resources fail to cache
          return Promise.resolve()
        })
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
        startAlarmChecker()
        return self.clients.claim()
      }),
  )
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return
  }

  if (!event.request.url.startsWith("http")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {
              // Ignore cache errors
            })
          })

          return response
        })
        .catch((error) => {
          console.error("Fetch failed:", error)
          if (event.request.destination === "document") {
            return caches.match("/offline.html")
          }
          throw error
        })
    }),
  )
})

// Handle messages from main app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "UPDATE_ALARMS") {
    alarms = event.data.alarms || []
    console.log("Alarms updated in service worker:", alarms.length)
  }
})

// Background alarm checker
function startAlarmChecker() {
  setInterval(() => {
    checkAndTriggerAlarms()
  }, 60000) // Check every minute
}

function checkAndTriggerAlarms() {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" })

  console.log("Background alarm check:", currentTime, currentDay)

  alarms.forEach((alarm) => {
    if (alarm.enabled && alarm.time === currentTime && alarm.days.includes(currentDay)) {
      console.log("Background alarm triggered:", alarm.id)
      showAlarmNotification(alarm)
    }
  })
}

function showAlarmNotification(alarm) {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  self.registration.showNotification(`🔔 ${alarm.label || "Alarm"}`, {
    body: `Time: ${formatTime(alarm.time)} - Tap to open Dream Clock`,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: alarm.id,
    requireInteraction: true,
    silent: false,
    vibrate: [1000, 500, 1000, 500, 1000],
    actions: [
      { action: "snooze", title: "Snooze 5m" },
      { action: "dismiss", title: "Dismiss" },
      { action: "open", title: "Open App" },
    ],
    data: {
      alarmId: alarm.id,
      alarmTime: alarm.time,
      alarmLabel: alarm.label,
    },
  })
}

// Handle notification interactions
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event.action, event.notification.data)

  event.notification.close()

  const alarmData = event.notification.data

  if (event.action === "snooze") {
    // Create a new alarm 5 minutes from now
    const snoozeTime = new Date()
    snoozeTime.setMinutes(snoozeTime.getMinutes() + 5)

    setTimeout(
      () => {
        showAlarmNotification({
          id: alarmData.alarmId + "_snooze",
          label: alarmData.alarmLabel + " (Snoozed)",
          time: `${snoozeTime.getHours().toString().padStart(2, "0")}:${snoozeTime.getMinutes().toString().padStart(2, "0")}`,
          enabled: true,
          days: [snoozeTime.toLocaleDateString("en-US", { weekday: "long" })],
        })
      },
      5 * 60 * 1000,
    ) // 5 minutes
  } else if (event.action === "dismiss") {
    console.log("Alarm dismissed")
  } else {
    // Default action or "open" action - open the app
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus()
          }
        }
        // Open new window if no existing window found
        if (clients.openWindow) {
          return clients.openWindow("/")
        }
      }),
    )
  }
})

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event.notification.tag)
})

// Background sync for better reliability
self.addEventListener("sync", (event) => {
  if (event.tag === "alarm-check") {
    console.log("Background sync: alarm check")
    event.waitUntil(checkAndTriggerAlarms())
  }
})
