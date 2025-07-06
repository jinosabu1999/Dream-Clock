"use client"

import { useEffect, useRef, useState } from "react"
import type { Alarm, AlarmSettings } from "../types/alarm"

interface PersistentAlarmManagerProps {
  alarms: Alarm[]
  settings: AlarmSettings
}

export function PersistentAlarmManager({ alarms, settings }: PersistentAlarmManagerProps) {
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false)
  const [appKillDetected, setAppKillDetected] = useState(false)
  const keepAliveInterval = useRef<NodeJS.Timeout | null>(null)
  const wakeLock = useRef<any>(null)

  useEffect(() => {
    initializePersistentService()
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (isServiceWorkerReady) {
      updateServiceWorkerAlarms()
    }
  }, [alarms, settings, isServiceWorkerReady])

  const initializePersistentService = async () => {
    try {
      // Register persistent service worker
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/persistent-sw.js", {
          scope: "/",
          updateViaCache: "none",
        })

        console.log("Persistent Service Worker registered:", registration)

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready
        setIsServiceWorkerReady(true)

        // Set up communication with service worker
        setupServiceWorkerCommunication()

        // Request persistent notification permission
        await requestPersistentNotificationPermission()

        // Set up wake lock for critical alarms
        await setupWakeLock()

        // Set up app kill detection
        setupAppKillDetection()

        // Start keep-alive mechanism
        startKeepAlive()

        console.log("✅ Persistent alarm system initialized")
      }
    } catch (error) {
      console.error("Failed to initialize persistent service:", error)
    }
  }

  const setupServiceWorkerCommunication = () => {
    if (!navigator.serviceWorker.controller) return

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("Message from service worker:", event.data)

      if (event.data.type === "ALARM_TRIGGERED") {
        handleServiceWorkerAlarm(event.data.alarm)
      }
    })

    // Send app active signal
    navigator.serviceWorker.controller.postMessage({
      type: "APP_ACTIVE",
      timestamp: Date.now(),
    })
  }

  const updateServiceWorkerAlarms = () => {
    if (!navigator.serviceWorker.controller) return

    console.log("Updating service worker with", alarms.length, "alarms")

    navigator.serviceWorker.controller.postMessage({
      type: "UPDATE_ALARMS",
      alarms: alarms,
      settings: settings,
      timestamp: Date.now(),
    })
  }

  const requestPersistentNotificationPermission = async () => {
    if ("Notification" in window) {
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission()
        console.log("Notification permission:", permission)

        if (permission === "granted") {
          // Show confirmation that persistent alarms are enabled
          new Notification("🔔 Persistent Alarms Enabled", {
            body: "Your alarms will now work even when the app is closed or cleared from recent apps.",
            icon: "/icon-192x192.png",
            silent: true,
          })
        }
      }
    }
  }

  const setupWakeLock = async () => {
    if ("wakeLock" in navigator) {
      try {
        // Request wake lock when alarms are active
        const activeAlarms = alarms.filter((alarm) => alarm.enabled)
        if (activeAlarms.length > 0) {
          wakeLock.current = await navigator.wakeLock.request("screen")
          console.log("Wake lock acquired for active alarms")

          wakeLock.current.addEventListener("release", () => {
            console.log("Wake lock released")
          })
        }
      } catch (error) {
        console.log("Wake lock request failed:", error)
      }
    }
  }

  const setupAppKillDetection = () => {
    // Detect when app is about to be killed
    window.addEventListener("beforeunload", () => {
      console.log("App is being unloaded - notifying service worker")
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "APP_UNLOADING",
          timestamp: Date.now(),
        })
      }
    })

    // Detect when app becomes hidden (backgrounded)
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        console.log("App backgrounded - enabling persistent mode")
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "APP_BACKGROUNDED",
            timestamp: Date.now(),
          })
        }
      } else {
        console.log("App foregrounded - disabling persistent mode")
        if (navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: "APP_ACTIVE",
            timestamp: Date.now(),
          })
        }
      }
    })

    // Detect app focus/blur
    window.addEventListener("focus", () => {
      setAppKillDetected(false)
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "APP_ACTIVE",
          timestamp: Date.now(),
        })
      }
    })

    window.addEventListener("blur", () => {
      console.log("App lost focus")
    })
  }

  const startKeepAlive = () => {
    // Send keep-alive signals to service worker
    keepAliveInterval.current = setInterval(() => {
      if (navigator.serviceWorker.controller) {
        const channel = new MessageChannel()

        channel.port1.onmessage = (event) => {
          if (event.data.type === "ALIVE") {
            console.log("Service worker is alive")
          }
        }

        navigator.serviceWorker.controller.postMessage(
          {
            type: "KEEP_ALIVE",
            timestamp: Date.now(),
          },
          [channel.port2],
        )
      }
    }, 30000) // Every 30 seconds
  }

  const handleServiceWorkerAlarm = (alarm: Alarm) => {
    console.log("Handling service worker alarm:", alarm)
    // The service worker will handle the notification
    // This is just for logging and potential UI updates
  }

  const cleanup = () => {
    if (keepAliveInterval.current) {
      clearInterval(keepAliveInterval.current)
    }

    if (wakeLock.current) {
      wakeLock.current.release()
    }
  }

  // Test function to verify persistent alarms work
  const testPersistentAlarm = () => {
    const testAlarm: Alarm = {
      id: "test-persistent",
      time: new Date(Date.now() + 60000).toTimeString().slice(0, 5), // 1 minute from now
      label: "Test Persistent Alarm",
      days: [new Date().toLocaleDateString("en-US", { weekday: "long" })],
      sound: "Digital Beep",
      vibrate: true,
      enabled: true,
      snoozed: false,
    }

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "UPDATE_ALARMS",
        alarms: [...alarms, testAlarm],
        settings: settings,
        timestamp: Date.now(),
      })

      alert(
        "Test alarm set for 1 minute from now. Try clearing the app from recent apps and wait for the alarm to trigger!",
      )
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Status indicator */}
      <div
        className={`mb-2 px-3 py-1 rounded-full text-xs font-medium ${
          isServiceWorkerReady
            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
        }`}
      >
        {isServiceWorkerReady ? "🟢 Persistent Alarms Active" : "🟡 Initializing..."}
      </div>

      {/* Test button (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={testPersistentAlarm}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700"
        >
          Test Persistent Alarm
        </button>
      )}

      {appKillDetected && (
        <div className="mb-2 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          🔴 App Kill Detected
        </div>
      )}
    </div>
  )
}
