const CACHE_NAME = "dream-clock-persistent-v2"
const urlsToCache = ["/", "/manifest.json", "/icon-192x192.png", "/icon-512x512.png", "/offline.html"]

let alarms = []
let settings = {}
let isAppKilled = false
let persistentAlarmInterval = null
const wakeLock = null

// Persistent service worker that survives app termination
self.addEventListener("install", (event) => {
  console.log("Persistent Service Worker installing...")

  // Force immediate activation
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching app shell for persistence")
      return cache.addAll(urlsToCache).catch((error) => {
        console.warn("Failed to cache some resources:", error)
        return Promise.resolve()
      })
    }),
  )
})

self.addEventListener("activate", (event) => {
  console.log("Persistent Service Worker activating...")

  // Take control immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          }),
        )
      }),
    ]).then(() => {
      console.log("Persistent Service Worker activated")
      startPersistentAlarmService()
      registerBackgroundSync()
    }),
  )
})

// Enhanced fetch handler with offline support
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  if (!event.request.url.startsWith("http")) return

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) return response

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {})
          })

          return response
        })
        .catch(() => {
          if (event.request.destination === "document") {
            return caches.match("/offline.html")
          }
          throw new Error("Network failed and no cache available")
        })
    }),
  )
})

// Message handling with app state detection
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data)

  if (event.data && event.data.type === "UPDATE_ALARMS") {
    alarms = event.data.alarms || []
    settings = event.data.settings || {}
    isAppKilled = false

    console.log("Alarms updated in persistent service worker:", alarms.length)

    // Store alarms in IndexedDB for persistence
    storeAlarmsInIndexedDB(alarms, settings)

    // Restart persistent alarm service
    startPersistentAlarmService()
  }

  if (event.data && event.data.type === "APP_ACTIVE") {
    isAppKilled = false
    console.log("App is active, service worker notified")
  }

  if (event.data && event.data.type === "KEEP_ALIVE") {
    // Respond to keep-alive ping
    event.ports[0].postMessage({ type: "ALIVE", timestamp: Date.now() })
  }
})

// Persistent alarm service that works even when app is killed
function startPersistentAlarmService() {
  // Clear existing interval
  if (persistentAlarmInterval) {
    clearInterval(persistentAlarmInterval)
  }

  console.log("Starting persistent alarm service...")

  // Check alarms every 15 seconds for maximum reliability
  persistentAlarmInterval = setInterval(() => {
    checkPersistentAlarms()
  }, 15000)

  // Also check immediately
  checkPersistentAlarms()
}

async function checkPersistentAlarms() {
  try {
    // Load alarms from IndexedDB if not in memory
    if (alarms.length === 0) {
      const stored = await loadAlarmsFromIndexedDB()
      if (stored) {
        alarms = stored.alarms || []
        settings = stored.settings || {}
      }
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" })
    const currentSeconds = now.getSeconds()

    console.log("Persistent alarm check:", currentTime, currentDay, `(${alarms.length} alarms)`)

    // Only trigger on exact minute (0 seconds) to avoid duplicates
    if (currentSeconds === 0) {
      alarms.forEach((alarm) => {
        if (alarm.enabled && alarm.time === currentTime && alarm.days.includes(currentDay)) {
          console.log("🚨 PERSISTENT ALARM TRIGGERED:", alarm.id, alarm.label)
          triggerPersistentAlarm(alarm)
        }
      })
    }

    // Check if app might be killed (no recent communication)
    detectAppKilled()
  } catch (error) {
    console.error("Error in persistent alarm check:", error)
  }
}

// Detect if the main app has been killed
function detectAppKilled() {
  self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
    if (clients.length === 0) {
      if (!isAppKilled) {
        console.log("🔴 App appears to be killed - switching to persistent mode")
        isAppKilled = true

        // Try to wake up the app
        attemptAppWakeup()
      }
    } else {
      isAppKilled = false
    }
  })
}

// Attempt to wake up the app when alarm triggers
function attemptAppWakeup() {
  if ("clients" in self) {
    self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
      if (clients.length === 0) {
        // Try to open a new window
        if (self.clients.openWindow) {
          self.clients.openWindow("/").catch((error) => {
            console.log("Could not open window:", error)
          })
        }
      }
    })
  }
}

// Enhanced alarm triggering with multiple fallbacks
function triggerPersistentAlarm(alarm) {
  console.log("Triggering persistent alarm:", alarm.label || alarm.id)

  // 1. Show persistent notification with actions
  showPersistentNotification(alarm)

  // 2. Try to wake up the app
  attemptAppWakeup()

  // 3. Schedule reminder notifications
  scheduleReminderNotifications(alarm)

  // 4. Vibrate if supported
  if (settings.vibrationEnabled && "vibrate" in navigator) {
    navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000])
  }
}

function showPersistentNotification(alarm) {
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

  const notificationOptions = {
    body: `🔔 ${alarm.label || "Alarm"}\nTime: ${formatTime(alarm.time)}\n${settings.mathChallenge ? "Solve math to dismiss!" : "Tap to dismiss"}`,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: `alarm-${alarm.id}`,
    requireInteraction: true,
    silent: false,
    vibrate: [500, 200, 500, 200, 1000, 300, 500],
    actions: actions,
    data: {
      alarmId: alarm.id,
      alarmTime: alarm.time,
      alarmLabel: alarm.label,
      mathChallenge: settings.mathChallenge,
      snoozeTime: settings.defaultSnoozeTime || 5,
      persistent: true,
    },
    // Enhanced persistence options
    persistent: true,
    sticky: true,
    renotify: true,
    timestamp: Date.now(),
  }

  self.registration.showNotification(`🚨 ALARM: ${alarm.label || "Wake Up!"}`, notificationOptions)
}

// Schedule reminder notifications every 2 minutes until dismissed
function scheduleReminderNotifications(alarm) {
  let reminderCount = 0
  const maxReminders = 10 // Stop after 20 minutes

  const reminderInterval = setInterval(() => {
    reminderCount++

    if (reminderCount > maxReminders) {
      clearInterval(reminderInterval)
      return
    }

    self.registration.showNotification(`🔔 Reminder ${reminderCount}: ${alarm.label || "Alarm"}`, {
      body: `Your alarm is still active. Please dismiss or snooze.`,
      icon: "/icon-192x192.png",
      tag: `reminder-${alarm.id}-${reminderCount}`,
      requireInteraction: true,
      vibrate: [300, 200, 300],
      actions: [
        { action: "snooze", title: "Snooze" },
        { action: "dismiss", title: "Dismiss" },
        { action: "open", title: "Open App" },
      ],
      data: {
        alarmId: alarm.id,
        isReminder: true,
        reminderCount: reminderCount,
      },
    })
  }, 120000) // Every 2 minutes
}

// Enhanced notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Persistent notification clicked:", event.action, event.notification.data)

  event.notification.close()

  // Close all related notifications
  if (event.notification.data && event.notification.data.alarmId) {
    self.registration.getNotifications().then((notifications) => {
      notifications.forEach((notification) => {
        if (notification.data && notification.data.alarmId === event.notification.data.alarmId) {
          notification.close()
        }
      })
    })
  }

  const alarmData = event.notification.data

  if (event.action === "snooze") {
    handleSnoozeAction(alarmData)
  } else if (event.action === "dismiss") {
    handleDismissAction(alarmData)
  } else if (event.action === "solve") {
    openAppForMathChallenge(alarmData)
  } else {
    // Default action - open app
    openApp()
  }
})

function handleSnoozeAction(alarmData) {
  const snoozeTime = alarmData.snoozeTime || 5

  // Create snooze alarm
  const snoozeAlarm = {
    id: `${alarmData.alarmId}_snooze_${Date.now()}`,
    label: `${alarmData.alarmLabel || "Alarm"} (Snoozed)`,
    time: "",
    enabled: true,
    days: [new Date().toLocaleDateString("en-US", { weekday: "long" })],
    sound: "Gentle Wake",
    vibrate: true,
    snoozed: true,
  }

  // Calculate snooze time
  const snoozeDate = new Date()
  snoozeDate.setMinutes(snoozeDate.getMinutes() + snoozeTime)
  snoozeAlarm.time = `${snoozeDate.getHours().toString().padStart(2, "0")}:${snoozeDate.getMinutes().toString().padStart(2, "0")}`

  // Add to alarms array
  alarms.push(snoozeAlarm)

  // Store updated alarms
  storeAlarmsInIndexedDB(alarms, settings)

  // Show confirmation
  self.registration.showNotification("⏰ Alarm Snoozed", {
    body: `Will ring again in ${snoozeTime} minutes at ${formatTime(snoozeAlarm.time)}`,
    icon: "/icon-192x192.png",
    tag: "snooze-confirmation",
    silent: true,
  })

  console.log("Alarm snoozed for", snoozeTime, "minutes")
}

function handleDismissAction(alarmData) {
  // Remove alarm from active alarms if it's a snooze
  if (alarmData.alarmId.includes("snooze")) {
    alarms = alarms.filter((alarm) => alarm.id !== alarmData.alarmId)
    storeAlarmsInIndexedDB(alarms, settings)
  }

  // Show confirmation
  self.registration.showNotification("✅ Alarm Dismissed", {
    body: "Have a great day!",
    icon: "/icon-192x192.png",
    tag: "dismiss-confirmation",
    silent: true,
  })

  console.log("Alarm dismissed:", alarmData.alarmId)
}

function openAppForMathChallenge(alarmData) {
  openApp(`/?mathChallenge=${alarmData.alarmId}`)
}

function openApp(url = "/") {
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus()
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    }),
  )
}

// IndexedDB storage for alarm persistence
function storeAlarmsInIndexedDB(alarms, settings) {
  const request = indexedDB.open("DreamClockPersistent", 1)

  request.onupgradeneeded = (event) => {
    const db = event.target.result
    if (!db.objectStoreNames.contains("alarms")) {
      db.createObjectStore("alarms", { keyPath: "id" })
    }
    if (!db.objectStoreNames.contains("settings")) {
      db.createObjectStore("settings", { keyPath: "key" })
    }
  }

  request.onsuccess = (event) => {
    const db = event.target.result
    const transaction = db.transaction(["alarms", "settings"], "readwrite")

    // Store alarms
    const alarmStore = transaction.objectStore("alarms")
    alarmStore.clear()
    alarms.forEach((alarm) => {
      alarmStore.add(alarm)
    })

    // Store settings
    const settingsStore = transaction.objectStore("settings")
    settingsStore.put({ key: "main", ...settings })

    console.log("Alarms and settings stored in IndexedDB for persistence")
  }

  request.onerror = (event) => {
    console.error("Error storing alarms in IndexedDB:", event.target.error)
  }
}

function loadAlarmsFromIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("DreamClockPersistent", 1)

    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(["alarms", "settings"], "readonly")

      const alarmStore = transaction.objectStore("alarms")
      const settingsStore = transaction.objectStore("settings")

      const alarmRequest = alarmStore.getAll()
      const settingsRequest = settingsStore.get("main")

      Promise.all([
        new Promise((resolve) => {
          alarmRequest.onsuccess = () => resolve(alarmRequest.result)
        }),
        new Promise((resolve) => {
          settingsRequest.onsuccess = () => resolve(settingsRequest.result)
        }),
      ]).then(([alarms, settings]) => {
        console.log("Loaded from IndexedDB:", alarms.length, "alarms")
        resolve({
          alarms: alarms || [],
          settings: settings || {},
        })
      })
    }

    request.onerror = () => {
      console.error("Error loading alarms from IndexedDB")
      resolve(null)
    }
  })
}

// Background sync for alarm persistence
function registerBackgroundSync() {
  if ("sync" in self.registration) {
    self.registration.sync.register("persistent-alarm-sync").catch((error) => {
      console.log("Background sync registration failed:", error)
    })
  }
}

self.addEventListener("sync", (event) => {
  if (event.tag === "persistent-alarm-sync") {
    console.log("Background sync triggered for persistent alarms")
    event.waitUntil(checkPersistentAlarms())
  }
})

// Push event handling for external alarm triggers
self.addEventListener("push", (event) => {
  console.log("Push event received")

  if (event.data) {
    try {
      const data = event.data.json()
      if (data.type === "alarm-trigger") {
        event.waitUntil(triggerPersistentAlarm(data.alarm))
      }
    } catch (error) {
      console.error("Error handling push event:", error)
    }
  }
})

// Notification close handling
self.addEventListener("notificationclose", (event) => {
  console.log("Persistent notification closed:", event.notification.tag)

  // If alarm notification was closed without action, schedule a reminder
  if (event.notification.tag && event.notification.tag.startsWith("alarm-")) {
    setTimeout(() => {
      self.registration.showNotification("⏰ Alarm Still Active", {
        body: "Your alarm was closed. Please dismiss or snooze to stop reminders.",
        icon: "/icon-192x192.png",
        tag: "alarm-closed-reminder",
        requireInteraction: true,
        vibrate: [300, 200, 300],
        actions: [
          { action: "snooze", title: "Snooze" },
          { action: "dismiss", title: "Dismiss" },
          { action: "open", title: "Open App" },
        ],
        data: event.notification.data,
      })
    }, 60000) // Remind after 1 minute
  }
})

// Utility function to format time
function formatTime(time) {
  const [hours, minutes] = time.split(":")
  const hour = Number.parseInt(hours)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

// Keep service worker alive
setInterval(() => {
  console.log("Service worker heartbeat:", new Date().toISOString())
}, 30000)

console.log("Persistent Service Worker loaded and ready")
