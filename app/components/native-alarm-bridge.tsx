"use client"

import { useEffect, useState } from "react"
import type { Alarm, AlarmSettings } from "../types/alarm"

interface NativeAlarmBridgeProps {
  alarms: Alarm[]
  settings: AlarmSettings
}

export function NativeAlarmBridge({ alarms, settings }: NativeAlarmBridgeProps) {
  const [isNativeSupported, setIsNativeSupported] = useState(false)
  const [backgroundPermission, setBackgroundPermission] = useState(false)

  useEffect(() => {
    initializeNativeBridge()
  }, [])

  useEffect(() => {
    if (isNativeSupported) {
      syncAlarmsWithNative()
    }
  }, [alarms, settings, isNativeSupported])

  const initializeNativeBridge = async () => {
    try {
      // Check if running in Capacitor (native app)
      if (typeof window !== "undefined" && (window as any).Capacitor) {
        const { Capacitor } = await import("@capacitor/core")

        if (Capacitor.isNativePlatform()) {
          console.log("Running in native app - initializing native alarm bridge")
          setIsNativeSupported(true)

          await setupNativeAlarms()
          await requestNativePermissions()
        }
      } else {
        console.log("Running in browser - using web-based persistent alarms")
      }
    } catch (error) {
      console.error("Error initializing native bridge:", error)
    }
  }

  const setupNativeAlarms = async () => {
    try {
      // Import Capacitor plugins dynamically
      const { LocalNotifications } = await import("@capacitor/local-notifications")
      const { BackgroundMode } = await import("@capacitor-community/background-mode")

      // Enable background mode
      await BackgroundMode.enable()
      setBackgroundPermission(true)

      console.log("Native alarm system enabled")
    } catch (error) {
      console.error("Error setting up native alarms:", error)
    }
  }

  const requestNativePermissions = async () => {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications")

      // Request notification permissions
      const permission = await LocalNotifications.requestPermissions()
      console.log("Native notification permission:", permission)

      if (permission.display === "granted") {
        console.log("✅ Native notifications enabled")
      }
    } catch (error) {
      console.error("Error requesting native permissions:", error)
    }
  }

  const syncAlarmsWithNative = async () => {
    if (!isNativeSupported) return

    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications")

      // Cancel all existing notifications
      await LocalNotifications.cancel({ notifications: [] })

      // Schedule new notifications for each enabled alarm
      const notifications = []

      for (const alarm of alarms) {
        if (!alarm.enabled) continue

        const nextAlarmTimes = calculateNextAlarmTimes(alarm)

        for (const alarmTime of nextAlarmTimes) {
          notifications.push({
            title: `🔔 ${alarm.label || "Alarm"}`,
            body: `Time to wake up! ${settings.mathChallenge ? "Solve math to dismiss." : ""}`,
            id: Number.parseInt(`${alarm.id.replace(/\D/g, "")}${alarmTime.getTime().toString().slice(-6)}`),
            schedule: { at: alarmTime },
            sound: alarm.sound || "beep.wav",
            attachments: [],
            actionTypeId: "ALARM_ACTION",
            extra: {
              alarmId: alarm.id,
              mathChallenge: settings.mathChallenge,
              snoozeTime: settings.defaultSnoozeTime,
            },
          })
        }
      }

      if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications })
        console.log(`Scheduled ${notifications.length} native alarm notifications`)
      }
    } catch (error) {
      console.error("Error syncing alarms with native:", error)
    }
  }

  const calculateNextAlarmTimes = (alarm: Alarm): Date[] => {
    const times: Date[] = []
    const now = new Date()
    const [hours, minutes] = alarm.time.split(":").map(Number)

    // Calculate next 7 occurrences
    for (let i = 0; i < 7; i++) {
      const alarmDate = new Date(now)
      alarmDate.setDate(now.getDate() + i)
      alarmDate.setHours(hours, minutes, 0, 0)

      const dayName = alarmDate.toLocaleDateString("en-US", { weekday: "long" })

      if (alarm.days.includes(dayName) && alarmDate > now) {
        times.push(alarmDate)
      }
    }

    return times
  }

  // Handle native notification actions
  useEffect(() => {
    if (!isNativeSupported) return

    const setupNotificationListeners = async () => {
      try {
        const { LocalNotifications } = await import("@capacitor/local-notifications")

        LocalNotifications.addListener("localNotificationActionPerformed", (notification) => {
          console.log("Native notification action:", notification)

          const { actionId, notification: notif } = notification
          const alarmData = notif.extra

          if (actionId === "snooze") {
            handleNativeSnooze(alarmData)
          } else if (actionId === "dismiss") {
            handleNativeDismiss(alarmData)
          }
        })

        LocalNotifications.addListener("localNotificationReceived", (notification) => {
          console.log("Native notification received:", notification)
        })
      } catch (error) {
        console.error("Error setting up notification listeners:", error)
      }
    }

    setupNotificationListeners()
  }, [isNativeSupported])

  const handleNativeSnooze = async (alarmData: any) => {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications")

      const snoozeTime = new Date()
      snoozeTime.setMinutes(snoozeTime.getMinutes() + (alarmData.snoozeTime || 5))

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "⏰ Snoozed Alarm",
            body: `${alarmData.alarmLabel || "Alarm"} (Snoozed)`,
            id: Date.now(),
            schedule: { at: snoozeTime },
            sound: "beep.wav",
            extra: alarmData,
          },
        ],
      })

      console.log("Native alarm snoozed")
    } catch (error) {
      console.error("Error handling native snooze:", error)
    }
  }

  const handleNativeDismiss = (alarmData: any) => {
    console.log("Native alarm dismissed:", alarmData.alarmId)
  }

  return (
    <div className="fixed top-4 left-4 z-50">
      {isNativeSupported && (
        <div className="flex flex-col gap-1">
          <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full">
            📱 Native App Mode
          </div>
          {backgroundPermission && (
            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded-full">
              🔋 Background Mode Active
            </div>
          )}
        </div>
      )}
    </div>
  )
}
