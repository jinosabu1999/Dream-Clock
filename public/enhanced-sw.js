const CACHE_NAME = "dream-clock-enhanced-v1"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png", "/offline.html"]

let alarms = []
let settings = {}

// Enhanced service worker with foreground service capabilities
self.addEventListener("install", (event) => {
  console.log("Enhanced Service Worker installing...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Caching app shell")
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn("Failed to cache some resources:", error)
          return Promise.resolve()
        })
      })
      .then(() => {
        console.log("Enhanced Service Worker installed successfully")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("Enhanced Service Worker installation failed:", error)
      }),
  )
})

self.addEventListener("activate", (event) => {
  console.log("Enhanced Service Worker activating...")
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
        console.log("Enhanced Service Worker activated")
        startEnhancedAlarmChecker()
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

// Enhanced message handling
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "UPDATE_ALARMS") {
    alarms = event.data.alarms || []
    settings = event.data.settings || {}
    console.log("Enhanced alarms updated in service worker:", alarms.length)
  }
})

// Enhanced alarm checker with foreground service simulation
function startEnhancedAlarmChecker() {
  // Check every 30 seconds for more responsive alarms
  setInterval(() => {
    checkAndTriggerEnhancedAlarms()
  }, 30000)

  // Also check every minute for standard timing
  setInterval(() => {
    checkAndTriggerEnhancedAlarms()
  }, 60000)
}

function checkAndTriggerEnhancedAlarms() {
  const now = new Date()
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
  const currentDay = now.toLocaleDateString("en-US", { weekday: "long" })

  console.log("Enhanced background alarm check:", currentTime, currentDay)

  alarms.forEach((alarm) => {
    if (alarm.enabled && alarm.time === currentTime && alarm.days.includes(currentDay)) {
      console.log("Enhanced background alarm triggered:", alarm.id)
      showEnhancedAlarmNotification(alarm)
    }
  })
}

function showEnhancedAlarmNotification(alarm) {
  const formatTime = (time) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const actions = [
    { action: "snooze", title: `⏰ Snooze ${settings.defaultSnoozeTime || 5}m` },
    { action: "dismiss", title: "✅ Dismiss" },
    { action: "open", title: "📱 Open App" },
  ]

  if (settings.mathChallenge) {
    actions.splice(1, 0, { action: "solve", title: "🧮 Solve Math" })
  }

  self.registration.showNotification(`🔔 ${alarm.label || "Alarm"}`, {
    body: `Time: ${formatTime(alarm.time)} - ${settings.mathChallenge ? "Solve math to dismiss!" : "Tap to dismiss"}`,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: alarm.id,
    requireInteraction: true,
    silent: false,
    vibrate: [500, 200, 500, 200, 1000, 300, 500, 200, 500],
    actions: actions,
    data: {
      alarmId: alarm.id,
      alarmTime: alarm.time,
      alarmLabel: alarm.label,
      mathChallenge: settings.mathChallenge,
      snoozeTime: settings.defaultSnoozeTime || 5,
    },
    // Enhanced notification options
    persistent: true,
    sticky: true,
    renotify: true,
  })
}

// Enhanced notification interactions
self.addEventListener("notificationclick", (event) => {
  console.log("Enhanced notification clicked:", event.action, event.notification.data)

  event.notification.close()

  const alarmData = event.notification.data

  if (event.action === "snooze") {
    // Create a new alarm for snooze time
    const snoozeTime = new Date()
    snoozeTime.setMinutes(snoozeTime.getMinutes() + (alarmData.snoozeTime || 5))

    setTimeout(
      () => {
        showEnhancedAlarmNotification({
          id: alarmData.alarmId + "_snooze",
          label: (alarmData.alarmLabel || "Alarm") + " (Snoozed)",
          time: `${snoozeTime.getHours().toString().padStart(2, "0")}:${snoozeTime.getMinutes().toString().padStart(2, "0")}`,
          enabled: true,
          days: [snoozeTime.toLocaleDateString("en-US", { weekday: "long" })],
        })
      },
      (alarmData.snoozeTime || 5) * 60 * 1000,
    )

    // Show snooze confirmation
    self.registration.showNotification("⏰ Alarm Snoozed", {
      body: `Will ring again in ${alarmData.snoozeTime || 5} minutes`,
      icon: "/icon-192x192.png",
      tag: "snooze-confirmation",
      silent: true,
      actions: [{ action: "cancel", title: "Cancel Snooze" }],
    })
  } else if (event.action === "dismiss") {
    console.log("Alarm dismissed via notification")

    // Show dismissal confirmation
    self.registration.showNotification("✅ Alarm Dismissed", {
      body: "Have a great day!",
      icon: "/icon-192x192.png",
      tag: "dismiss-confirmation",
      silent: true,
    })
  } else if (event.action === "solve") {
    // Open app to math challenge
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({ type: "SHOW_MATH_CHALLENGE", alarmId: alarmData.alarmId })
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow("/?mathChallenge=" + alarmData.alarmId)
        }
      }),
    )
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
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

// Enhanced notification close handling
self.addEventListener("notificationclose", (event) => {
  console.log("Enhanced notification closed:", event.notification.tag)

  // If alarm notification was closed without action, show reminder
  if (event.notification.tag && !event.notification.tag.includes("confirmation")) {
    setTimeout(() => {
      self.registration.showNotification("⏰ Alarm Still Active", {
        body: "Your alarm is still ringing. Tap to dismiss or snooze.",
        icon: "/icon-192x192.png",
        tag: "alarm-reminder",
        requireInteraction: true,
        actions: [
          { action: "snooze", title: "Snooze" },
          { action: "dismiss", title: "Dismiss" },
        ],
      })
    }, 30000) // Show reminder after 30 seconds
  }
})

// Enhanced background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "enhanced-alarm-check") {
    console.log("Enhanced background sync: alarm check")
    event.waitUntil(checkAndTriggerEnhancedAlarms())
  }
})

// Foreground service simulation for Android
self.addEventListener("backgroundfetch", (event) => {
  console.log("Background fetch triggered for alarm service")
  event.waitUntil(checkAndTriggerEnhancedAlarms())
})

// Enhanced push event handling
self.addEventListener("push", (event) => {
  console.log("Push event received for alarm service")

  if (event.data) {
    const data = event.data.json()
    if (data.type === "alarm-trigger") {
      event.waitUntil(showEnhancedAlarmNotification(data.alarm))
    }
  }
})
