"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModernTimePicker } from "./modern-time-picker"
import { SimpleToggle } from "./simple-toggle"
import { X, Play, Square } from "lucide-react"
import type { Alarm } from "../types/alarm"

interface EditAlarmModalProps {
  alarm: Alarm
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<Alarm>) => void
  isDarkMode: boolean
  customAudioFiles: { [key: string]: string }
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const predefinedSounds = [
  "Gentle Wake",
  "Morning Birds",
  "Digital Beep",
  "Rooster Call",
  "Hen Cluck",
  "Cat Meow",
  "Ocean Waves",
  "Funny Honk",
  "Space Alarm",
  "Church Bell",
]

export function EditAlarmModal({ alarm, isOpen, onClose, onSave, isDarkMode, customAudioFiles }: EditAlarmModalProps) {
  const [time, setTime] = useState(alarm.time)
  const [label, setLabel] = useState(alarm.label || "")
  const [days, setDays] = useState<string[]>(alarm.days)
  const [sound, setSound] = useState(alarm.sound || "Gentle Wake")
  const [vibrate, setVibrate] = useState(alarm.vibrate)
  const [isPlaying, setIsPlaying] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      time,
      label,
      days,
      sound,
      vibrate,
    })
  }

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const playPreview = (soundName: string) => {
    const audioManager = (window as any).audioManager
    if (!audioManager) return

    if (isPlaying === soundName) {
      audioManager.stopAllAudio()
      setIsPlaying(null)
    } else {
      audioManager.stopAllAudio()
      if (customAudioFiles[soundName]) {
        audioManager.playCustomSound(customAudioFiles[soundName], 0.5)
      } else {
        audioManager.playPredefinedSound(soundName, 0.5)
      }
      setIsPlaying(soundName)
      setTimeout(() => setIsPlaying(null), 3000)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div
        className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto ${
          isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        } border`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Edit Alarm</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Modern Time Picker */}
          <div>
            <Label className={`${isDarkMode ? "text-slate-200" : "text-slate-700"} text-lg font-medium mb-4 block`}>
              Set Time
            </Label>
            <ModernTimePicker value={time} onChange={setTime} isDarkMode={isDarkMode} />
          </div>

          <div>
            <Label htmlFor="label" className={isDarkMode ? "text-slate-200" : "text-slate-700"}>
              Label (optional)
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Wake up, Morning workout, Take medicine..."
              className={`mt-1 ${
                isDarkMode
                  ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          <div>
            <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Repeat on</Label>
            {/* Days in 2 rows starting with Sunday */}
            <div className="grid grid-cols-4 gap-2 mt-2 mb-2">
              {DAYS.slice(0, 4).map((day, index) => (
                <Button
                  key={day}
                  type="button"
                  variant={days.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day)}
                  className={`transition-all duration-200 ${
                    days.includes(day)
                      ? isDarkMode
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-blue-600 hover:bg-blue-700"
                      : isDarkMode
                        ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                        : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {SHORT_DAYS[index]}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DAYS.slice(4).map((day, index) => (
                <Button
                  key={day}
                  type="button"
                  variant={days.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day)}
                  className={`transition-all duration-200 ${
                    days.includes(day)
                      ? isDarkMode
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-blue-600 hover:bg-blue-700"
                      : isDarkMode
                        ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                        : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {SHORT_DAYS[index + 4]}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Alarm Sound</Label>
            <div className="grid grid-cols-1 gap-2 mt-2 max-h-48 overflow-y-auto">
              {/* Predefined Sounds */}
              {predefinedSounds.map((soundOption) => (
                <div
                  key={soundOption}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                    sound === soundOption
                      ? isDarkMode
                        ? "bg-purple-600 border-purple-500 text-white"
                        : "bg-blue-600 border-blue-500 text-white"
                      : isDarkMode
                        ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                        : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <button type="button" onClick={() => setSound(soundOption)} className="flex-1 text-left">
                    {soundOption}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => playPreview(soundOption)}
                    className="h-8 w-8"
                  >
                    {isPlaying === soundOption ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              ))}

              {/* Custom Audio Files */}
              {Object.keys(customAudioFiles).map((fileName) => (
                <div
                  key={fileName}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
                    sound === fileName
                      ? isDarkMode
                        ? "bg-green-600 border-green-500 text-white"
                        : "bg-green-600 border-green-500 text-white"
                      : isDarkMode
                        ? "border-slate-600 text-slate-300 hover:bg-slate-700"
                        : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <button type="button" onClick={() => setSound(fileName)} className="flex-1 text-left">
                    🎵 {fileName}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => playPreview(fileName)}
                    className="h-8 w-8"
                  >
                    {isPlaying === fileName ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Vibration</Label>
            <SimpleToggle checked={vibrate} onCheckedChange={setVibrate} isDarkMode={isDarkMode} size="lg" />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`flex-1 h-12 rounded-xl ${
                isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={`flex-1 h-12 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                isDarkMode
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              } text-white`}
              disabled={days.length === 0}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
