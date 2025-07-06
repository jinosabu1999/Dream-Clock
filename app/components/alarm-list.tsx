"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Trash2, Volume2, Vibrate, Music, Clock, Calendar } from "lucide-react"
import { UnifiedToggle } from "./unified-toggle"
import type { Alarm, AlarmSettings } from "../types/alarm"

interface AlarmListProps {
  alarms: Alarm[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  isDarkMode: boolean
  settings: AlarmSettings
  customAudioFiles: { [key: string]: string }
}

export function AlarmList({ alarms, onToggle, onDelete, isDarkMode, settings, customAudioFiles }: AlarmListProps) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getDaysText = (days: string[]) => {
    if (days.length === 7) return "Every day"
    if (days.length === 5 && !days.includes("Saturday") && !days.includes("Sunday")) {
      return "Weekdays"
    }
    if (days.length === 2 && days.includes("Saturday") && days.includes("Sunday")) {
      return "Weekends"
    }
    return days.map((day) => day.slice(0, 3)).join(", ")
  }

  const getNextAlarmTime = (alarm: Alarm) => {
    const now = new Date()
    const [hours, minutes] = alarm.time.split(":").map(Number)

    const nextAlarm = new Date()
    nextAlarm.setHours(hours, minutes, 0, 0)

    if (nextAlarm <= now) {
      nextAlarm.setDate(nextAlarm.getDate() + 1)
    }

    while (!alarm.days.includes(nextAlarm.toLocaleDateString("en-US", { weekday: "long" }))) {
      nextAlarm.setDate(nextAlarm.getDate() + 1)
    }

    const diff = nextAlarm.getTime() - now.getTime()
    const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (daysLeft > 0) return `in ${daysLeft}d ${hoursLeft}h`
    if (hoursLeft > 0) return `in ${hoursLeft}h ${minutesLeft}m`
    return `in ${minutesLeft}m`
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this alarm?")) {
      onDelete(id)
    }
  }

  if (alarms.length === 0) {
    return (
      <div
        className={`text-center py-12 rounded-3xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode
            ? "bg-slate-800/20 border-slate-700/30 text-slate-400"
            : "bg-white/30 border-white/30 text-slate-500"
        }`}
      >
        <div className="text-6xl mb-4 animate-bounce">⏰</div>
        <p className="text-lg font-medium">No alarms set</p>
        <p className="text-sm mt-2">Your alarms will appear here</p>
        <div className="mt-4 text-xs opacity-70">
          ✨ Pro tip: Upload custom sounds for a personalized wake-up experience!
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {alarms.map((alarm, index) => (
        <div
          key={alarm.id}
          className={`p-6 rounded-3xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
            isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/50 border-white/50"
          } ${alarm.enabled ? "shadow-lg ring-2 ring-blue-500/20" : "opacity-60"}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Clock className={`h-5 w-5 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                  {formatTime(alarm.time)}
                  {alarm.snoozed && (
                    <span className="ml-2 text-sm bg-yellow-500 text-white px-2 py-1 rounded-full">Snoozed</span>
                  )}
                </div>
              </div>

              {alarm.enabled && (
                <div className={`text-sm font-medium ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                  {getNextAlarmTime(alarm)}
                </div>
              )}

              <div className="flex items-center gap-2 mt-1">
                <Calendar className={`h-4 w-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`} />
                <div className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {getDaysText(alarm.days)}
                </div>
              </div>

              {alarm.label && (
                <div className={`text-sm mt-2 font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                  "{alarm.label}"
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-3">
              <UnifiedToggle
                checked={alarm.enabled}
                onCheckedChange={() => onToggle(alarm.id)}
                isDarkMode={isDarkMode}
                size="lg"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => handleDelete(alarm.id, e)}
                className={`rounded-full transition-all duration-200 hover:scale-110 ${
                  isDarkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-500 hover:bg-red-50"
                }`}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Alarm Features */}
          <div className="flex items-center gap-3 mt-4">
            {alarm.sound && (
              <div
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${
                  customAudioFiles[alarm.sound]
                    ? isDarkMode
                      ? "bg-green-600/30 text-green-300"
                      : "bg-green-100 text-green-700"
                    : isDarkMode
                      ? "bg-blue-600/30 text-blue-300"
                      : "bg-blue-100 text-blue-700"
                }`}
              >
                {customAudioFiles[alarm.sound] ? <Music className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                {alarm.sound}
              </div>
            )}
            {alarm.vibrate && (
              <div
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${
                  isDarkMode ? "bg-purple-600/30 text-purple-300" : "bg-purple-100 text-purple-700"
                }`}
              >
                <Vibrate className="h-3 w-3" />
                Vibrate
              </div>
            )}
            {settings.mathChallenge && (
              <div
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full ${
                  isDarkMode ? "bg-orange-600/30 text-orange-300" : "bg-orange-100 text-orange-700"
                }`}
              >
                🧮 Math Challenge
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
