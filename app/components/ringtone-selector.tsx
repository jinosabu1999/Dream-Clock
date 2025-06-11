"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Play, Square, Volume2 } from "lucide-react"

interface RingtoneSelectorProps {
  selectedSound: string
  onSoundChange: (sound: string) => void
  customAudioFiles: { [key: string]: string }
  isDarkMode: boolean
}

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

export function RingtoneSelector({
  selectedSound,
  onSoundChange,
  customAudioFiles,
  isDarkMode,
}: RingtoneSelectorProps) {
  const [playingSound, setPlayingSound] = useState<string | null>(null)

  const playPreview = (soundName: string) => {
    const audioManager = (window as any).audioManager
    if (!audioManager) return

    if (playingSound === soundName) {
      audioManager.stopAllAudio()
      setPlayingSound(null)
    } else {
      audioManager.stopAllAudio()

      if (customAudioFiles[soundName]) {
        audioManager.playCustomSound(customAudioFiles[soundName], 0.6)
      } else {
        audioManager.playPredefinedSound(soundName, 0.6)
      }

      setPlayingSound(soundName)

      // Auto-stop after 5 seconds
      setTimeout(() => {
        audioManager.stopAllAudio()
        setPlayingSound(null)
      }, 5000)
    }
  }

  const allSounds = [
    ...predefinedSounds.map((sound) => ({ name: sound, type: "predefined" })),
    ...Object.keys(customAudioFiles).map((sound) => ({ name: sound, type: "custom" })),
  ]

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {allSounds.map(({ name, type }) => (
        <div
          key={name}
          className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 ${
            selectedSound === name
              ? isDarkMode
                ? "bg-blue-600/20 border-blue-500 ring-2 ring-blue-500/30"
                : "bg-blue-50 border-blue-500 ring-2 ring-blue-500/30"
              : isDarkMode
                ? "border-slate-600 hover:bg-slate-700/50"
                : "border-gray-300 hover:bg-gray-50"
          }`}
        >
          <button
            type="button"
            onClick={() => onSoundChange(name)}
            className="flex-1 text-left flex items-center gap-3"
          >
            <div
              className={`p-2 rounded-xl ${
                type === "custom"
                  ? isDarkMode
                    ? "bg-green-600/20"
                    : "bg-green-100"
                  : isDarkMode
                    ? "bg-blue-600/20"
                    : "bg-blue-100"
              }`}
            >
              {type === "custom" ? (
                <span className="text-lg">🎵</span>
              ) : (
                <Volume2
                  className={`h-4 w-4 ${
                    type === "custom"
                      ? isDarkMode
                        ? "text-green-400"
                        : "text-green-600"
                      : isDarkMode
                        ? "text-blue-400"
                        : "text-blue-600"
                  }`}
                />
              )}
            </div>
            <div>
              <div className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}>{name}</div>
              <div className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {type === "custom" ? "Custom Audio" : "Built-in Sound"}
              </div>
            </div>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => playPreview(name)}
            className={`h-10 w-10 rounded-full transition-all duration-200 ${
              playingSound === name
                ? isDarkMode
                  ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  : "bg-red-100 text-red-600 hover:bg-red-200"
                : isDarkMode
                  ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-gray-100"
            }`}
          >
            {playingSound === name ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      ))}
    </div>
  )
}
