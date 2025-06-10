"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SimpleToggle } from "./simple-toggle"
import { Upload, Trash2, Moon, Sun, Volume2, Brain, Clock, HardDrive, AlertTriangle } from "lucide-react"
import { audioStorage } from "../utils/audio-storage"
import type { AlarmSettings } from "../types/alarm"

interface SettingsViewProps {
  settings: AlarmSettings
  onUpdate: (settings: AlarmSettings) => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  customAudioFiles: { [key: string]: string }
  onAddCustomAudio: (name: string, audioUrl: string) => void
  onRemoveCustomAudio: (fileName: string) => void
}

export function SettingsView({
  settings,
  onUpdate,
  isDarkMode,
  onToggleDarkMode,
  customAudioFiles,
  onAddCustomAudio,
  onRemoveCustomAudio,
}: SettingsViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number }>({ used: 0, available: 0 })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  useEffect(() => {
    loadStorageInfo()
  }, [])

  const loadStorageInfo = async () => {
    try {
      const info = await audioStorage.getStorageUsage()
      setStorageInfo(info)
    } catch (error) {
      console.error("Error loading storage info:", error)
    }
  }

  const updateSetting = <K extends keyof AlarmSettings>(key: K, value: AlarmSettings[K]) => {
    console.log(`Updating ${key} to:`, value)
    const newSettings = { ...settings, [key]: value }
    onUpdate(newSettings)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getStoragePercentage = (): number => {
    if (storageInfo.available === 0) return 0
    return (storageInfo.used / storageInfo.available) * 100
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError("")

    try {
      // Validate file type
      if (!file.type.startsWith("audio/")) {
        throw new Error("Please select an audio file")
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${formatFileSize(maxSize)}`)
      }

      // Check available storage
      if (storageInfo.available > 0 && file.size > storageInfo.available - storageInfo.used) {
        throw new Error("Not enough storage space available")
      }

      const fileName = file.name.replace(/\.[^/.]+$/, "")
      if (customAudioFiles[fileName]) {
        throw new Error("A file with this name already exists")
      }

      // Store file in IndexedDB
      await audioStorage.storeAudioFile(fileName, file)

      // Get the blob URL for immediate use
      const audioUrl = await audioStorage.getAudioFile(fileName)

      if (audioUrl) {
        onAddCustomAudio(fileName, audioUrl)
        await loadStorageInfo()

        // Clear the input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const removeCustomAudio = async (fileName: string) => {
    try {
      await onRemoveCustomAudio(fileName)
      await loadStorageInfo()
    } catch (error) {
      console.error("Error removing audio file:", error)
    }
  }

  const clearAllAudioFiles = async () => {
    if (confirm("Are you sure you want to delete all custom audio files? This action cannot be undone.")) {
      try {
        await audioStorage.clearAllAudioFiles()
        // Clear the state
        Object.keys(customAudioFiles).forEach((fileName) => {
          onRemoveCustomAudio(fileName)
        })
        await loadStorageInfo()
      } catch (error) {
        console.error("Error clearing audio files:", error)
      }
    }
  }

  return (
    <div className="space-y-6 mb-20">
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
            <Clock className="h-6 w-6 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Settings</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDarkMode}
          className={`rounded-full transition-all duration-300 ${
            isDarkMode
              ? "text-yellow-400 hover:bg-slate-800 hover:scale-110"
              : "text-slate-600 hover:bg-white/50 hover:scale-110"
          }`}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Theme Settings */}
      <div
        className={`p-6 rounded-3xl backdrop-blur-sm border ${
          isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
        }`}
      >
        <div className="flex items-center gap-3 mb-4">
          {isDarkMode ? <Moon className="h-5 w-5 text-purple-400" /> : <Sun className="h-5 w-5 text-blue-600" />}
          <h3 className={`font-semibold text-lg ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>Appearance</h3>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Dark Mode</Label>
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Switch between light and dark themes
            </p>
          </div>
          <SimpleToggle checked={isDarkMode} onCheckedChange={onToggleDarkMode} isDarkMode={isDarkMode} size="lg" />
        </div>
      </div>

      {/* Audio & Vibration Settings */}
      <div
        className={`p-6 rounded-3xl backdrop-blur-sm border ${
          isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <Volume2 className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
          <h3 className={`font-semibold text-lg ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
            Audio & Vibration
          </h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Volume</Label>
              <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                {settings.volume}%
              </span>
            </div>
            <Slider
              value={[settings.volume]}
              onValueChange={([value]) => updateSetting("volume", value)}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Gradual Volume Increase</Label>
              <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Slowly increase volume for gentle wake-up
              </p>
            </div>
            <SimpleToggle
              checked={settings.gradualVolumeIncrease}
              onCheckedChange={(checked) => updateSetting("gradualVolumeIncrease", checked)}
              isDarkMode={isDarkMode}
            />
          </div>

          {settings.gradualVolumeIncrease && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Fade In Duration</Label>
                <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  {settings.fadeInDuration}s
                </span>
              </div>
              <Slider
                value={[settings.fadeInDuration]}
                onValueChange={([value]) => updateSetting("fadeInDuration", value)}
                max={60}
                min={5}
                step={5}
                className="w-full"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Vibration</Label>
              <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Enable vibration for alarms
              </p>
            </div>
            <SimpleToggle
              checked={settings.vibrationEnabled}
              onCheckedChange={(checked) => updateSetting("vibrationEnabled", checked)}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>

      {/* Alarm Behavior */}
      <div
        className={`p-6 rounded-3xl backdrop-blur-sm border ${
          isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
          <Brain className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
          <h3 className={`font-semibold text-lg ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
            Smart Features
          </h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Default Snooze Time</Label>
              <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                {settings.defaultSnoozeTime} min
              </span>
            </div>
            <Slider
              value={[settings.defaultSnoozeTime]}
              onValueChange={([value]) => updateSetting("defaultSnoozeTime", value)}
              max={30}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Math Challenge</Label>
              <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                Solve math problems to dismiss alarms
              </p>
            </div>
            <SimpleToggle
              checked={settings.mathChallenge}
              onCheckedChange={(checked) => updateSetting("mathChallenge", checked)}
              isDarkMode={isDarkMode}
            />
          </div>

          {settings.mathChallenge && (
            <div>
              <Label className={isDarkMode ? "text-slate-200" : "text-slate-700"}>Challenge Difficulty</Label>
              <Select
                value={settings.challengeDifficulty}
                onValueChange={(value: "easy" | "medium" | "hard") => updateSetting("challengeDifficulty", value)}
              >
                <SelectTrigger
                  className={`mt-2 ${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white"}`}
                >
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
      <div
        className={`p-6 rounded-3xl backdrop-blur-sm border ${
          isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="text-xl">🎵</div>
            <h3 className={`font-semibold text-lg ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
              Custom Audio Files
            </h3>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            disabled={isUploading}
            className={`rounded-xl ${
              isDarkMode ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            <Upload className="h-4 w-4 mr-1" />
            {isUploading ? "Uploading..." : "Add"}
          </Button>
        </div>

        {/* Storage Info */}
        {storageInfo.available > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className={`flex items-center gap-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                <HardDrive className="h-4 w-4" />
                Storage Usage
              </span>
              <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
                {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.available)}
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-gray-200"}`}>
              <div
                className={`h-full transition-all duration-300 ${
                  getStoragePercentage() > 80
                    ? "bg-red-500"
                    : getStoragePercentage() > 60
                      ? "bg-yellow-500"
                      : isDarkMode
                        ? "bg-purple-500"
                        : "bg-blue-500"
                }`}
                style={{ width: `${Math.min(getStoragePercentage(), 100)}%` }}
              />
            </div>
            {getStoragePercentage() > 80 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-orange-600 dark:text-orange-400">
                <AlertTriangle className="h-3 w-3" />
                Storage is almost full. Consider removing some files.
              </div>
            )}
          </div>
        )}

        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {uploadError}
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-40 overflow-y-auto">
          {Object.keys(customAudioFiles).length === 0 ? (
            <div
              className={`text-center py-8 rounded-2xl border-2 border-dashed ${
                isDarkMode ? "border-slate-600 text-slate-400" : "border-gray-300 text-slate-500"
              }`}
            >
              <div className="text-3xl mb-2">🎶</div>
              <p className="text-sm">No custom audio files added yet</p>
              <p className="text-xs mt-1">Upload your favorite songs or sounds!</p>
            </div>
          ) : (
            <>
              {Object.keys(customAudioFiles).map((fileName) => (
                <div
                  key={fileName}
                  className={`flex items-center justify-between p-4 rounded-2xl ${
                    isDarkMode ? "bg-slate-700/50 border border-slate-600" : "bg-white border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">🎵</div>
                    <span className={`font-medium ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
                      {fileName}
                    </span>
                  </div>
                  <Button
                    onClick={() => removeCustomAudio(fileName)}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {Object.keys(customAudioFiles).length > 0 && (
                <div className="pt-2">
                  <Button
                    onClick={clearAllAudioFiles}
                    variant="outline"
                    size="sm"
                    className={`w-full text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/30`}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Audio Files
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* About */}
      <div
        className={`p-6 rounded-3xl backdrop-blur-sm border ${
          isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
        }`}
      >
        <h3 className={`font-semibold text-lg mb-4 ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>
          ℹ️ About Dream Clock
        </h3>
        <div className="space-y-3 text-sm">
          <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
            Dream Clock uses browser notifications, vibration, and audio APIs to provide the best alarm experience.
          </p>
          <p className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
            Audio files are stored locally using IndexedDB for better performance and offline support.
          </p>
          <div
            className={`p-3 rounded-xl ${
              isDarkMode ? "bg-purple-600/20 border border-purple-500/30" : "bg-blue-50 border border-blue-200"
            }`}
          >
            <p className={`text-xs ${isDarkMode ? "text-purple-300" : "text-blue-700"}`}>
              💡 Pro tip: Install this app on your home screen for the best experience and reliable background alarms!
              Make sure to allow notifications for alarm alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
