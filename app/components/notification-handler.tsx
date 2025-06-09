"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { MathChallenge } from "./math-challenge"
import { Volume2, VolumeX, RotateCcw } from "lucide-react"
import type { Alarm, AlarmSettings } from "../types/alarm"

interface NotificationHandlerProps {
  alarms: Alarm[]
  settings: AlarmSettings
  customAudioFiles: { [key: string]: string }
  onSnooze: (id: string) => void
  onDismiss: (id: string) => void
}

export function NotificationHandler({
  alarms,
  settings,
  customAudioFiles,
  onSnooze,
  onDismiss,
}: NotificationHandlerProps) {
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const [showMathChallenge, setShowMathChallenge] = useState(false)
  const [audioController, setAudioController] = useState<any>(null)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        setNotificationPermission(permission)
      })
    }
  }, [])

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`
      const currentDay = now.toLocaleDateString("en-US", { weekday: "long" })

      console.log("Checking alarms at:", currentTime, "on", currentDay) // Debug log

      alarms.forEach((alarm) => {
        console.log("Alarm:", alarm.time, "Enabled:", alarm.enabled, "Days:", alarm.days) // Debug log

        if (
          alarm.enabled &&
          alarm.time === currentTime &&
          alarm.days.includes(currentDay) &&
          !activeAlarm &&
          now.getSeconds() === 0 // Only trigger at the exact minute
        ) {
          console.log("Triggering alarm:", alarm.id) // Debug log
          triggerAlarm(alarm)
        }
      })
    }

    // Check every second, but only trigger at exact minute
    const interval = setInterval(checkAlarms, 1000)
    return () => clearInterval(interval)
  }, [alarms, activeAlarm])

  const triggerAlarm = (alarm: Alarm) => {
    console.log("Alarm triggered:", alarm) // Debug log
    setActiveAlarm(alarm)
    setShowMathChallenge(false)

    // Show notification
    if (notificationPermission === "granted") {
      new Notification(`🔔 ${alarm.label || "Alarm"}`, {
        body: `Time: ${alarm.time} - ${settings.mathChallenge ? "Solve math to dismiss!" : "Tap to dismiss"}`,
        icon: "/icon-192x192.png",
        tag: alarm.id,
        requireInteraction: true,
      })
    }

    // Trigger vibration
    if (settings.vibrationEnabled && alarm.vibrate && "vibrate" in navigator) {
      const vibrationPattern = [1000, 500, 1000, 500, 1000, 500, 1000]
      navigator.vibrate(vibrationPattern)

      // Continue vibrating every 10 seconds
      const vibrationInterval = setInterval(() => {
        if (activeAlarm) {
          navigator.vibrate(vibrationPattern)
        } else {
          clearInterval(vibrationInterval)
        }
      }, 10000)
    }

    // Play alarm sound
    playAlarmSound(alarm)
  }

  const playAlarmSound = (alarm: Alarm) => {
    const audioManager = (window as any).audioManager
    if (!audioManager) return

    const volume = (settings.volume / 100) * (isMuted ? 0 : 1)
    let controller

    // Check if it's a custom audio file
    if (customAudioFiles[alarm.sound || ""]) {
      controller = audioManager.playCustomSound(
        customAudioFiles[alarm.sound || ""],
        volume,
        settings.gradualVolumeIncrease,
      )
    } else {
      // Use predefined sound
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

    // Stop audio
    if (audioController) {
      audioController.stop()
      setAudioController(null)
    }

    // Stop vibration
    if ("vibrate" in navigator) {
      navigator.vibrate(0)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (audioController) {
      audioController.setVolume(isMuted ? settings.volume / 100 : 0)
    }
  }

  if (!activeAlarm) return null

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 text-center max-w-sm w-full shadow-2xl border border-white/20">
        {!showMathChallenge ? (
          <>
            {/* Alarm Header */}
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

            {/* Audio Controls */}
            <div className="flex justify-center mb-6">
              <Button onClick={toggleMute} variant="outline" size="icon" className="rounded-full">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>

            {/* Action Buttons */}
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

            {/* Fun motivational messages */}
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl">
              <p className="text-sm dark:text-slate-300 text-slate-600">
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
