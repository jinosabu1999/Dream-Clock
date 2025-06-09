"use client"

import { useState, useEffect } from "react"
import { ClockDisplay } from "./components/clock-display"
import { AlarmList } from "./components/alarm-list"
import { AddAlarmView } from "./components/add-alarm-view"
import { SettingsView } from "./components/settings-view"
import { StopwatchView } from "./components/stopwatch-view"
import { TimerView } from "./components/timer-view"
import { WorldClockView } from "./components/world-clock-view"
import { NotificationHandler } from "./components/notification-handler"
import { AudioManager } from "./components/audio-manager"
import { BottomNavbar } from "./components/bottom-navbar"
import { Button } from "@/components/ui/button"
import { Plus, Sparkles, Moon, Sun } from "lucide-react"
import { audioStorage } from "./utils/audio-storage"
import type { Alarm, AlarmSettings } from "./types/alarm"

export default function AlarmClockApp() {
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [isAddingAlarm, setIsAddingAlarm] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [activeView, setActiveView] = useState("home")
  const [customAudioFiles, setCustomAudioFiles] = useState<{ [key: string]: string }>({})
  const [settings, setSettings] = useState<AlarmSettings>({
    defaultSnoozeTime: 5,
    vibrationEnabled: true,
    volume: 80,
    gradualVolumeIncrease: true,
    mathChallenge: true,
    challengeDifficulty: "easy",
    fadeInDuration: 30,
  })

  useEffect(() => {
    // Load saved data from localStorage (except audio files)
    const savedAlarms = localStorage.getItem("alarms")
    const savedSettings = localStorage.getItem("alarmSettings")
    const savedTheme = localStorage.getItem("darkMode")

    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms))
    }
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
    if (savedTheme) {
      setIsDarkMode(JSON.parse(savedTheme))
    }

    // Load audio files from IndexedDB
    loadAudioFiles()
  }, [])

  const loadAudioFiles = async () => {
    try {
      const audioFiles = await audioStorage.getAllAudioFiles()
      setCustomAudioFiles(audioFiles)
    } catch (error) {
      console.error("Error loading audio files:", error)
    }
  }

  useEffect(() => {
    // Save alarms to localStorage (safe for small data)
    try {
      localStorage.setItem("alarms", JSON.stringify(alarms))
    } catch (error) {
      console.error("Error saving alarms:", error)
    }
  }, [alarms])

  useEffect(() => {
    // Save settings to localStorage (safe for small data)
    try {
      localStorage.setItem("alarmSettings", JSON.stringify(settings))
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }, [settings])

  useEffect(() => {
    // Save theme to localStorage (safe for small data)
    try {
      localStorage.setItem("darkMode", JSON.stringify(isDarkMode))
      if (isDarkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }, [isDarkMode])

  // Add global event listener for theme toggle
  useEffect(() => {
    const handleToggleDarkMode = () => {
      setIsDarkMode((prev) => !prev)
    }

    window.addEventListener("toggleDarkMode", handleToggleDarkMode)
    return () => {
      window.removeEventListener("toggleDarkMode", handleToggleDarkMode)
    }
  }, [])

  const addAlarm = (alarm: Omit<Alarm, "id">) => {
    const newAlarm: Alarm = {
      ...alarm,
      id: Date.now().toString(),
    }
    setAlarms((prev) => [...prev, newAlarm])
  }

  const updateAlarm = (id: string, updates: Partial<Alarm>) => {
    setAlarms((prev) => prev.map((alarm) => (alarm.id === id ? { ...alarm, ...updates } : alarm)))
  }

  const deleteAlarm = (id: string) => {
    setAlarms((prev) => prev.filter((alarm) => alarm.id !== id))
  }

  const toggleAlarm = (id: string) => {
    updateAlarm(id, { enabled: !alarms.find((a) => a.id === id)?.enabled })
  }

  const addCustomAudio = async (name: string, audioUrl: string) => {
    // Audio is already stored in IndexedDB by the modal
    // Just update the state for immediate UI update
    setCustomAudioFiles((prev) => ({ ...prev, [name]: audioUrl }))
  }

  const removeCustomAudio = async (fileName: string) => {
    try {
      await audioStorage.deleteAudioFile(fileName)
      setCustomAudioFiles((prev) => {
        const updated = { ...prev }
        delete updated[fileName]
        return updated
      })
    } catch (error) {
      console.error("Error removing audio file:", error)
    }
  }

  // If adding alarm, show the add alarm view
  if (isAddingAlarm) {
    return (
      <AddAlarmView
        onBack={() => setIsAddingAlarm(false)}
        onAdd={addAlarm}
        isDarkMode={isDarkMode}
        customAudioFiles={customAudioFiles}
        onAddCustomAudio={addCustomAudio}
      />
    )
  }

  const renderContent = () => {
    switch (activeView) {
      case "settings":
        return (
          <SettingsView
            settings={settings}
            onUpdate={setSettings}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            customAudioFiles={customAudioFiles}
            onAddCustomAudio={addCustomAudio}
            onRemoveCustomAudio={removeCustomAudio}
          />
        )
      case "stopwatch":
        return <StopwatchView isDarkMode={isDarkMode} />
      case "timer":
        return <TimerView isDarkMode={isDarkMode} settings={settings} />
      case "worldclock":
        return <WorldClockView isDarkMode={isDarkMode} />
      default:
        return (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-2xl ${
                    isDarkMode
                      ? "bg-gradient-to-br from-purple-600 to-pink-600"
                      : "bg-gradient-to-br from-blue-600 to-purple-600"
                  }`}
                >
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Dream Clock</h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`rounded-full transition-all duration-300 ${
                  isDarkMode
                    ? "text-yellow-400 hover:bg-slate-800 hover:scale-110"
                    : "text-slate-600 hover:bg-white/50 hover:scale-110"
                }`}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>

            {/* Clock Display */}
            <ClockDisplay isDarkMode={isDarkMode} />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div
                className={`p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                  isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
                }`}
              >
                <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                  {alarms.filter((a) => a.enabled).length}
                </div>
                <div className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Active Alarms</div>
              </div>
              <div
                className={`p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
                  isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
                }`}
              >
                <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                  {Object.keys(customAudioFiles).length}
                </div>
                <div className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Custom Sounds</div>
              </div>
            </div>

            {/* Add Alarm Button - Moved above alarm list */}
            <div className="mb-6">
              <Button
                onClick={() => setIsAddingAlarm(true)}
                className={`w-full h-14 rounded-2xl font-semibold text-lg shadow-lg transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                }`}
              >
                <Plus className="h-6 w-6 mr-2" />
                Add New Alarm
              </Button>
            </div>

            {/* Alarm List */}
            <div className="mb-20">
              <AlarmList
                alarms={alarms}
                onToggle={toggleAlarm}
                onDelete={deleteAlarm}
                onEdit={updateAlarm}
                isDarkMode={isDarkMode}
                settings={settings}
                customAudioFiles={customAudioFiles}
              />
            </div>
          </>
        )
    }
  }

  return (
    <div
      className={`min-h-screen transition-all duration-500 relative overflow-hidden ${
        isDarkMode
          ? "bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900"
          : "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      }`}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-pulse ${
            isDarkMode ? "bg-purple-500" : "bg-blue-400"
          }`}
        />
        <div
          className={`absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 animate-pulse ${
            isDarkMode ? "bg-pink-500" : "bg-purple-400"
          }`}
          style={{ animationDelay: "2s" }}
        />
        <div
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5 animate-spin ${
            isDarkMode ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gradient-to-r from-pink-400 to-blue-400"
          }`}
          style={{ animationDuration: "20s" }}
        />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md relative z-10">
        {renderContent()}

        {/* Audio Manager */}
        <AudioManager customAudioFiles={customAudioFiles} />

        {/* Notification Handler */}
        <NotificationHandler
          alarms={alarms}
          settings={settings}
          customAudioFiles={customAudioFiles}
          onSnooze={(id) => {
            const alarm = alarms.find((a) => a.id === id)
            if (alarm) {
              const snoozeTime = new Date()
              snoozeTime.setMinutes(snoozeTime.getMinutes() + settings.defaultSnoozeTime)
              updateAlarm(id, {
                time: `${snoozeTime.getHours().toString().padStart(2, "0")}:${snoozeTime.getMinutes().toString().padStart(2, "0")}`,
                snoozed: true,
              })
            }
          }}
          onDismiss={(id) => updateAlarm(id, { enabled: false, snoozed: false })}
        />
      </div>

      {/* Bottom Navigation */}
      <BottomNavbar activeView={activeView} onViewChange={setActiveView} isDarkMode={isDarkMode} />
    </div>
  )
}
