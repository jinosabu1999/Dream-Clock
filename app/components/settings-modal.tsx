"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload, Trash2 } from "lucide-react"
import type { AlarmSettings } from "../types/alarm"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: AlarmSettings
  onUpdate: (settings: AlarmSettings) => void
  isDarkMode: boolean
  customAudioFiles: { [key: string]: string }
  onAddCustomAudio: (name: string, audioUrl: string) => void
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdate,
  isDarkMode,
  customAudioFiles,
  onAddCustomAudio,
}: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateSetting = <K extends keyof AlarmSettings>(key: K, value: AlarmSettings[K]) => {
    onUpdate({ ...settings, [key]: value })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("audio/")) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const audioUrl = event.target?.result as string
        const fileName = file.name.replace(/\.[^/.]+$/, "")
        onAddCustomAudio(fileName, audioUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeCustomAudio = (fileName: string) => {
    const updatedFiles = { ...customAudioFiles }
    delete updatedFiles[fileName]
    localStorage.setItem("customAudioFiles", JSON.stringify(updatedFiles))
    window.location.reload() // Simple way to update the state
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
          <h2 className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Audio Settings */}
          <div className={`p-4 rounded-2xl ${isDarkMode ? "bg-slate-700/50" : "bg-gray-50"}`}>
            <h3 className={`font-medium mb-4 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
              🔊 Audio Settings
            </h3>

            <div className="space-y-4">
              <div>
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Volume: {settings.volume}%</Label>
                <Slider
                  value={[settings.volume]}
                  onValueChange={([value]) => updateSetting("volume", value)}
                  max={100}
                  min={0}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Gradual Volume Increase</Label>
                <Switch
                  checked={settings.gradualVolumeIncrease}
                  onCheckedChange={(checked) => updateSetting("gradualVolumeIncrease", checked)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <div>
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>
                  Fade In Duration: {settings.fadeInDuration}s
                </Label>
                <Slider
                  value={[settings.fadeInDuration]}
                  onValueChange={([value]) => updateSetting("fadeInDuration", value)}
                  max={60}
                  min={5}
                  step={5}
                  className="mt-2"
                  disabled={!settings.gradualVolumeIncrease}
                />
              </div>
            </div>
          </div>

          {/* Vibration Settings */}
          <div className={`p-4 rounded-2xl ${isDarkMode ? "bg-slate-700/50" : "bg-gray-50"}`}>
            <h3 className={`font-medium mb-4 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
              📳 Vibration Settings
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Vibration</Label>
                <Switch
                  checked={settings.vibrationEnabled}
                  onCheckedChange={(checked) => updateSetting("vibrationEnabled", checked)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Haptic Feedback</Label>
                <Switch
                  checked={settings.hapticFeedback}
                  onCheckedChange={(checked) => updateSetting("hapticFeedback", checked)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
          </div>

          {/* Alarm Behavior */}
          <div className={`p-4 rounded-2xl ${isDarkMode ? "bg-slate-700/50" : "bg-gray-50"}`}>
            <h3 className={`font-medium mb-4 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
              ⏰ Alarm Behavior
            </h3>

            <div className="space-y-4">
              <div>
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>
                  Default Snooze Time: {settings.defaultSnoozeTime} minutes
                </Label>
                <Slider
                  value={[settings.defaultSnoozeTime]}
                  onValueChange={([value]) => updateSetting("defaultSnoozeTime", value)}
                  max={30}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Math Challenge to Dismiss</Label>
                <Switch
                  checked={settings.mathChallenge}
                  onCheckedChange={(checked) => updateSetting("mathChallenge", checked)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              {settings.mathChallenge && (
                <div>
                  <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Challenge Difficulty</Label>
                  <Select
                    value={settings.challengeDifficulty}
                    onValueChange={(value: "easy" | "medium" | "hard") => updateSetting("challengeDifficulty", value)}
                  >
                    <SelectTrigger className={`mt-1 ${isDarkMode ? "bg-slate-700 border-slate-600" : "bg-white"}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">🟢 Easy (Simple addition/subtraction)</SelectItem>
                      <SelectItem value="medium">🟡 Medium (Multiplication/larger numbers)</SelectItem>
                      <SelectItem value="hard">🔴 Hard (Complex operations)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Custom Audio Files */}
          <div className={`p-4 rounded-2xl ${isDarkMode ? "bg-slate-700/50" : "bg-gray-50"}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                🎵 Custom Audio Files
              </h3>
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                variant="outline"
                className={`${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
              >
                <Upload className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />

            <div className="space-y-2 max-h-32 overflow-y-auto">
              {Object.keys(customAudioFiles).length === 0 ? (
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  No custom audio files added yet
                </p>
              ) : (
                Object.keys(customAudioFiles).map((fileName) => (
                  <div
                    key={fileName}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      isDarkMode ? "bg-slate-600/50" : "bg-white"
                    }`}
                  >
                    <span className={`text-sm ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>🎵 {fileName}</span>
                    <Button
                      onClick={() => removeCustomAudio(fileName)}
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* About */}
          <div className={`p-4 rounded-2xl ${isDarkMode ? "bg-slate-700/50" : "bg-gray-50"}`}>
            <h3 className={`font-medium mb-2 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
              ℹ️ About Permissions
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              This app uses browser notifications, vibration, and audio APIs to provide the best alarm experience. Make
              sure to allow notifications and keep the app tab open for reliable alarm functionality.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
