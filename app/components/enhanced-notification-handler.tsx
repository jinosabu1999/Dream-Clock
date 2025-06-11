"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MathChallenge } from "./math-challenge"
import { Volume2, VolumeX, RotateCcw, X, Smartphone, Bell } from "lucide-react"
import type { Alarm, AlarmSettings } from "../types/alarm"

interface EnhancedNotificationHandlerProps {
  alarms: Alarm[]
  settings: AlarmSettings
  customAudioFiles: { [key: string]: string }
  onSnooze: (id: string) => void
  onDismiss: (id: string) => void
}

export function EnhancedNotificationHandler({
  alarms,
  settings,
  customAudioFiles,
  onSnooze,
  onDismiss,
}: EnhancedNotificationHandlerProps) {
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [showMathChallenge, setShowMathChallenge] = useState(false)
  const [audioController, setAudioController] = useState<any>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [showPermissionBanner, setShowPermissionBanner] = useState(false)
  const [hasDeviceNotificationSupport, setHasDeviceNotificationSupport] = useState(false)

  useEffect(() => {
    // Check for enhanced notification support (Android/iOS)
    const isAndroid = /Android/i.test(navigator.userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setHasDeviceNotificationSupport(isAndroid || isIOS)

    // Check notification permission
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)

      if (Notification.permission === "default") {
        setTimeout(() => setShowPermissionBanner(true), 2000)
      } else if (Notification.permission === "granted") {
        // Test notification with enhanced features
        setTimeout(() => {
          showEnhancedNotification("Dream Clock Ready! 🔔", {
            body: "Enhanced notifications enabled. Your alarms will work with device controls.",
            actions: [
              { action: "test", title: "Test Alarm" },
              { action: "settings", title: "Settings" },
            ],
          })
        }, 1000)
      }
    }

    // Enhanced service worker registration
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/enhanced-sw.js")
        .then((registration) => {
          console.log("Enhanced Service Worker registered")

          // Request persistent notification permission for Android
          if (isAndroid && "showNotification" in registration) {
            registration.showNotification("Dream Clock Background Service", {
              body: "Alarm service is running in background",
              icon: "/icon-192x192.png",
              badge: "/icon-192x192.png",
              silent: true,
              tag: "background-service",
              persistent: true,
            })
          }

          navigator.serviceWorker.ready.then((swRegistration) => {
            swRegistration.active?.postMessage({
              type: "UPDATE_ALARMS",
              alarms: alarms,
              settings: settings,
            })
          })
        })
        .catch((error) => {
          console.warn("Enhanced Service Worker registration failed:", error)
        })
    }
  }, [])

  const showEnhancedNotification = (title: string, options: any) => {
    if ("serviceWorker" in navigator && "showNotification" in ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          ...options,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          requireInteraction: true,
          silent: false,
          vibrate: [1000, 500, 1000],
          actions: options.actions || [],
        })
      })
    } else {
      new Notification(title, options)
    }
  }

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      const currentDay = now.toLocaleDateString("en-US", { weekday: "long" })

      alarms.forEach((alarm) => {
        if (
          alarm.enabled &&
          alarm.time === currentTime &&
          alarm.days.includes(currentDay) &&
          !activeAlarm &&
          now.getSeconds() === 0
        ) {
          triggerEnhancedAlarm(alarm)
        }
      })
    }

    const interval = setInterval(checkAlarms, 1000)
    return () => clearInterval(interval)
  }, [alarms, activeAlarm])

  const triggerEnhancedAlarm = (alarm: Alarm) => {
    setActiveAlarm(alarm)
    setShowMathChallenge(false)

    // Enhanced device notification with action buttons
    if (notificationPermission === "granted") {
      const actions = [
        { action: "snooze", title: `⏰ Snooze ${settings.defaultSnoozeTime}m` },
        { action: "dismiss", title: "✅ Dismiss" },
      ]

      if (settings.mathChallenge) {
        actions.push({ action: "solve", title: "🧮 Solve Math" })
      }

      showEnhancedNotification(`🔔 ${alarm.label || "Alarm"}`, {
        body: `Time: ${formatTime(alarm.time)} - ${settings.mathChallenge ? "Solve math to dismiss!" : "Tap to dismiss"}`,
        actions: actions,
        tag: alarm.id,
        data: {
          alarmId: alarm.id,
          alarmTime: alarm.time,
          alarmLabel: alarm.label,
          mathChallenge: settings.mathChallenge,
        },
      })
    }

    // Enhanced vibration pattern
    if (settings.vibrationEnabled && alarm.vibrate && "vibrate" in navigator) {
      const enhancedPattern = [500, 200, 500, 200, 1000, 300, 500, 200, 500]
      navigator.vibrate(enhancedPattern)

      const vibrationInterval = setInterval(() => {
        if (activeAlarm) {
          navigator.vibrate(enhancedPattern)
        } else {
          clearInterval(vibrationInterval)
        }
      }, 8000)
    }

    playAlarmSound(alarm)

    // Enhanced wake lock
    if ("wakeLock" in navigator) {
      navigator.wakeLock.request("screen").catch((err) => {
        console.log("Wake lock request failed:", err)
      })
    }
  }

  const playAlarmSound = (alarm: Alarm) => {
    const audioManager = (window as any).audioManager
    if (!audioManager) return

    const volume = (settings.volume / 100) * (isMuted ? 0 : 1)
    let controller

    if (customAudioFiles[alarm.sound || ""]) {
      controller = audioManager.playCustomSound(
        customAudioFiles[alarm.sound || ""],
        volume,
        settings.gradualVolumeIncrease,
      )
    } else {
      controller = audioManager.playPredefinedSound(
        alarm.sound || "Gentle Wake",
        volume,
        settings.gradualVolumeIncrease,
      )
    }

    setAudioController(controller)
  }

  const handleSnooze = () => {
    if (activeAlarm) {
      onSnooze(activeAlarm.id)
      stopAlarm()
    }
  }

  const handleDismiss = () => {
    if (settings.mathChallenge && !showMathChallenge) {
      setShowMathChallenge(true)
    } else {
      if (activeAlarm) {
        onDismiss(activeAlarm.id)
        stopAlarm()
      }
    }
  }

  const handleMathSolved = () => {
    if (activeAlarm) {
      onDismiss(activeAlarm.id)
      stopAlarm()
    }
  }

  const stopAlarm = () => {
    setActiveAlarm(null)
    setShowMathChallenge(false)

    if (audioController) {
      audioController.stop()
      setAudioController(null)
    }

    if ("vibrate" in navigator) {
      navigator.vibrate(0)
    }

    // Clear all notifications
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.getNotifications().then((notifications) => {
            notifications.forEach((notification) => notification.close())
          })
        })
        .catch(() => {})
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioController) {
      audioController.setVolume(isMuted ? settings.volume / 100 : 0)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const requestEnhancedNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setNotificationPermission(permission)
      setShowPermissionBanner(false)

      if (permission === "granted") {
        showEnhancedNotification("Dream Clock Ready! 🔔", {
          body: "Enhanced notifications enabled with device controls.",
          actions: [
            { action: "test", title: "Test Alarm" },
            { action: "settings", title: "Settings" },
          ],
        })
      }
    }
  }

  // Enhanced notification permission banner
  if (showPermissionBanner && (notificationPermission === "denied" || notificationPermission === "default")) {
    return (
      <div className="fixed top-4 left-4 right-4 z-50">
        <div
          className={`max-w-sm mx-auto p-4 rounded-2xl border shadow-xl backdrop-blur-md ${
            document.documentElement.classList.contains("dark")
              ? "bg-slate-800/95 border-slate-700 text-white"
              : "bg-white/95 border-gray-200 text-slate-800"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-1">
              {hasDeviceNotificationSupport ? (
                <Smartphone className="h-5 w-5 text-blue-500" />
              ) : (
                <Bell className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">
                {hasDeviceNotificationSupport ? "Enable Device Notifications" : "Enable Notifications"}
              </h3>
              <p className="text-xs opacity-75 mt-1">
                {hasDeviceNotificationSupport
                  ? "Get alarm alerts with snooze/dismiss buttons on your device"
                  : "Get alarm alerts even when the app is closed"}
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={requestEnhancedNotificationPermission}
                  size="sm"
                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Enable
                </Button>
                <Button
                  onClick={() => setShowPermissionBanner(false)}
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs rounded-lg"
                >
                  Later
                </Button>
              </div>
            </div>
            <Button
              onClick={() => setShowPermissionBanner(false)}
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full flex-shrink-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Enhanced alarm popup
  if (!activeAlarm) return null

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl border border-white/20">
        {!showMathChallenge ? (
          <>
            <div className="mb-6">
              <div className="text-6xl mb-4 animate-bounce">⏰</div>
              <h2 className="text-2xl font-bold mb-2 dark:text-white">{activeAlarm.label || "Wake Up!"}</h2>
              <p className="text-4xl font-light mb-2 dark:text-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {formatTime(activeAlarm.time)}
              </p>
              <p className="text-sm dark:text-slate-400 text-slate-600">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <Button onClick={toggleMute} variant="outline" size="icon" className="rounded-full">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleDismiss}
                className="w-full h-14 text-lg rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold transition-all duration-300 hover:scale-105"
              >
                {settings.mathChallenge ? "🧮 Solve Math to Dismiss" : "✅ Dismiss"}
              </Button>
              <Button
                onClick={handleSnooze}
                variant="outline"
                className="w-full h-12 text-lg rounded-xl border-2 hover:scale-105 transition-all duration-300"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Snooze ({settings.defaultSnoozeTime}m)
              </Button>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl">
              <p className="text-sm dark:text-slate-300 text-slate-600">
                {hasDeviceNotificationSupport && (
                  <span className="flex items-center justify-center gap-2 mb-2">
                    <Smartphone className="h-4 w-4" />
                    Device controls available in notification
                  </span>
                )}
                {
                  [
                    "🌟 Rise and shine, superstar!",
                    "☀️ Today is full of possibilities!",
                    "💪 You've got this!",
                    "🚀 Time to conquer the day!",
                    "✨ Make today amazing!",
                  ][Math.floor(Math.random() * 5)]
                }
              </p>
            </div>
          </>
        ) : (
          <MathChallenge
            difficulty={settings.challengeDifficulty}
            onSolved={handleMathSolved}
            isDarkMode={document.documentElement.classList.contains("dark")}
          />
        )}
      </div>
    </div>
  )
}
