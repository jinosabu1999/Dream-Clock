"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { MaterialToggle } from "./material-toggle"
import { RingtoneSelector } from "./ringtone-selector"
import {
  Upload,
  Trash2,
  Moon,
  Sun,
  Volume2,
  Clock,
  HardDrive,
  AlertTriangle,
  Zap,
  Shield,
  Smartphone,
} from "lucide-react"
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
  const [selectedRingtone, setSelectedRingtone] = useState("Gentle Wake")
  const [batteryOptimizationDisabled, setBatteryOptimizationDisabled] = useState(false)

  useEffect(() => {
    loadStorageInfo()
    checkBatteryOptimization()
  }, [])

  const loadStorageInfo = async () => {
    try {
      const info = await audioStorage.getStorageUsage()
      setStorageInfo(info)
    } catch (error) {
      console.error("Error loading storage info:", error)
    }
  }

  const checkBatteryOptimization = () => {
    const isAndroid = /Android/i.test(navigator.userAgent)
    if (isAndroid) {
      setBatteryOptimizationDisabled(true)
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
      if (!file.type.startsWith("audio/")) {
        throw new Error("Please select an audio file")
      }

      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${formatFileSize(maxSize)}`)
      }

      if (storageInfo.available > 0 && file.size > storageInfo.available - storageInfo.used) {
        throw new Error("Not enough storage space available")
      }

      const fileName = file.name.replace(/\.[^/.]+$/, "")
      if (customAudioFiles[fileName]) {
        throw new Error("A file with this name already exists")
      }

      await audioStorage.storeAudioFile(fileName, file)
      const audioUrl = await audioStorage.getAudioFile(fileName)

      if (audioUrl) {
        onAddCustomAudio(fileName, audioUrl)
        await loadStorageInfo()

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
    <div
      className={`min-h-screen ${isDarkMode ? "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" : "bg-gradient-to-br from-blue-50 via-white to-purple-50"}`}
    >
      <div className="space-y-6 mb-20 p-4">
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
            isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/80 border-gray-200/50 shadow-lg"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {isDarkMode ? <Moon className="h-5 w-5 text-purple-400" /> : <Sun className="h-5 w-5 text-blue-600" />}
            <h3 className={`font-semibold text-lg ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Appearance</h3>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className={isDarkMode ? "text-slate-200" : "text-slate-800"}>Dark Mode</Label>
              <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                Switch between light and dark themes
              </p>
            </div>
            <MaterialToggle checked={isDarkMode} onCheckedChange={onToggleDarkMode} isDarkMode={isDarkMode} size="lg" />
          </div>
        </div>

        {/* Audio & Vibration Settings */}
        <div
          className={`p-6 rounded-3xl backdrop-blur-sm border ${
            isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/80 border-gray-200/50 shadow-lg"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <Volume2 className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
            <h3 className={`font-semibold text-lg ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              Audio & Vibration
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-800"}>Volume</Label>
                <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
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
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-800"}>Gradual Volume Increase</Label>
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Slowly increase volume for gentle wake-up
                </p>
              </div>
              <MaterialToggle
                checked={settings.gradualVolumeIncrease}
                onCheckedChange={(checked) => updateSetting("gradualVolumeIncrease", checked)}
                isDarkMode={isDarkMode}
              />
            </div>

            {settings.gradualVolumeIncrease && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className={isDarkMode ? "text-slate-200" : "text-slate-800"}>Fade In Duration</Label>
                  <span className={`text-sm font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
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
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-800"}>Vibration</Label>
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Enable vibration for alarms
                </p>
              </div>
              <MaterialToggle
                checked={settings.vibrationEnabled}
                onCheckedChange={(checked) => updateSetting("vibrationEnabled", checked)}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Features */}
        <div
          className={`p-6 rounded-3xl backdrop-blur-sm border ${
            isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/80 border-gray-200/50 shadow-lg"
          }`}
        >
          <div className="flex items-center gap-3 mb-6">
            <Zap className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
            <h3 className={`font-semibold text-lg ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              Enhanced Features
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-800"}>Background Service</Label>
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Keep alarms running in background
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs ${
                  isDarkMode ? "bg-green-600/30 text-green-300" : "bg-green-100 text-green-800"
                }`}
              >
                Active
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-800"}>Device Notifications</Label>
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Native notification controls
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs ${
                  isDarkMode ? "bg-blue-600/30 text-blue-300" : "bg-blue-100 text-blue-800"
                }`}
              >
                Enabled
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className={isDarkMode ? "text-slate-200" : "text-slate-800"}>Battery Optimization</Label>
                <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  Prevent system from killing app
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs ${
                  batteryOptimizationDisabled
                    ? isDarkMode
                      ? "bg-green-600/30 text-green-300"
                      : "bg-green-100 text-green-800"
                    : isDarkMode
                      ? "bg-orange-600/30 text-orange-300"
                      : "bg-orange-100 text-orange-800"
                }`}
              >
                {batteryOptimizationDisabled ? "Disabled" : "Check Settings"}
              </div>
            </div>
          </div>
        </div>

        {/* Custom Audio Files */}
        <div
          className={`p-6 rounded-3xl backdrop-blur-sm border ${
            isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/80 border-gray-200/50 shadow-lg"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="text-xl">🎵</div>
              <h3 className={`font-semibold text-lg ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
                Ringtone Library
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
                <span className={`flex items-center gap-2 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                  <HardDrive className="h-4 w-4" />
                  Storage Usage
                </span>
                <span className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
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

          {/* Ringtone Selector with Preview */}
          <div className="mb-4">
            <Label className={`${isDarkMode ? "text-slate-200" : "text-slate-800"} mb-3 block`}>
              Preview Ringtones
            </Label>
            <RingtoneSelector
              selectedSound={selectedRingtone}
              onSoundChange={setSelectedRingtone}
              customAudioFiles={customAudioFiles}
              isDarkMode={isDarkMode}
            />
          </div>

          {Object.keys(customAudioFiles).length > 0 && (
            <div className="pt-4 border-t border-slate-600/30">
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
        </div>

        {/* System Integration */}
        <div
          className={`p-6 rounded-3xl backdrop-blur-sm border ${
            isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/80 border-gray-200/50 shadow-lg"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
            <h3 className={`font-semibold text-lg ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>
              System Integration
            </h3>
          </div>

          <div className="space-y-3 text-sm">
            <div
              className={`p-3 rounded-xl ${
                isDarkMode ? "bg-blue-600/20 border border-blue-500/30" : "bg-blue-50 border border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4" />
                <span className={`font-medium ${isDarkMode ? "text-blue-300" : "text-blue-800"}`}>
                  Enhanced Mobile Features
                </span>
              </div>
              <ul className={`text-xs space-y-1 ${isDarkMode ? "text-blue-200" : "text-blue-700"}`}>
                <li>• Foreground service for reliable background alarms</li>
                <li>• Native notification controls with snooze/dismiss</li>
                <li>• Battery optimization bypass for uninterrupted service</li>
                <li>• Android 10+ scoped storage compliance</li>
                <li>• Enhanced audio management with system integration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
