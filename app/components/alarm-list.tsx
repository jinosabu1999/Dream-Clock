"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SimpleToggle } from "./simple-toggle"
import { Trash2, Edit3, Volume2, Vibrate, Music } from "lucide-react"
import type { Alarm, AlarmSettings } from "../types/alarm"
import { EditAlarmModal } from "./edit-alarm-modal"

interface AlarmListProps {
  alarms: Alarm[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, updates: Partial<Alarm>) => void
  isDarkMode: boolean
  settings: AlarmSettings
  customAudioFiles: { [key: string]: string }
}

export function AlarmList({
  alarms,
  onToggle,
  onDelete,
  onEdit,
  isDarkMode,
  settings,
  customAudioFiles,
}: AlarmListProps) {
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null)

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

  if (alarms.length === 0) {
    return (
      <div
        className={`text-center py-12 rounded-2xl backdrop-blur-sm border transition-all duration-300 ${
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
    <div className="space-y-3">
      {alarms.map((alarm, index) => (
        <div
          key={alarm.id}
          className={`p-4 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
            isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/50 border-white/50"
          } ${alarm.enabled ? "shadow-lg ring-2 ring-blue-500/20" : "opacity-60"}`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className={`text-2xl font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                {formatTime(alarm.time)}
                {alarm.snoozed && (
                  <span className="ml-2 text-sm bg-yellow-500 text-white px-2 py-1 rounded-full">Snoozed</span>
                )}
              </div>
              <div className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                {getDaysText(alarm.days)}
              </div>
              {alarm.label && (
                <div className={`text-sm mt-1 font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                  {alarm.label}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                {alarm.sound && (
                  <div
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
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
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      isDarkMode ? "bg-purple-600/30 text-purple-300" : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    <Vibrate className="h-3 w-3" />
                    Vibrate
                  </div>
                )}
                {settings.mathChallenge && (
                  <div
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      isDarkMode ? "bg-orange-600/30 text-orange-300" : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    🧮 Math Challenge
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingAlarm(alarm)}
                className={`rounded-full transition-all duration-200 hover:scale-110 ${
                  isDarkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-500 hover:bg-white/50"
                }`}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(alarm.id)}
                className={`rounded-full transition-all duration-200 hover:scale-110 ${
                  isDarkMode ? "text-red-400 hover:bg-red-900/30" : "text-red-500 hover:bg-red-50"
                }`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <SimpleToggle
                checked={alarm.enabled}
                onCheckedChange={() => onToggle(alarm.id)}
                isDarkMode={isDarkMode}
                size="lg"
              />
            </div>
          </div>
        </div>
      ))}

      {editingAlarm && (
        <EditAlarmModal
          alarm={editingAlarm}
          isOpen={!!editingAlarm}
          onClose={() => setEditingAlarm(null)}
          onSave={(updates) => {
            onEdit(editingAlarm.id, updates)
            setEditingAlarm(null)
          }}
          isDarkMode={isDarkMode}
          customAudioFiles={customAudioFiles}
        />
      )}
    </div>
  )
}
