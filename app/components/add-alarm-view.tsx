"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Upload, AlertCircle, HardDrive, Clock, Calendar, Music, Vibrate } from "lucide-react"
import { audioStorage } from "../utils/audio-storage"
import { SimpleToggle } from "./simple-toggle"
import type { Alarm } from "../types/alarm"

interface AddAlarmViewProps {
  onBack: () => void
  onAdd: (alarm: Omit<Alarm, "id">) => void
  isDarkMode: boolean
  customAudioFiles: { [key: string]: string }
  onAddCustomAudio: (name: string, audioUrl: string) => void
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export function AddAlarmView({ onBack, onAdd, isDarkMode, customAudioFiles, onAddCustomAudio }: AddAlarmViewProps) {
  const [hours, setHours] = useState(7)
  const [minutes, setMinutes] = useState(0)
  const [isAM, setIsAM] = useState(true)
  const [label, setLabel] = useState("")
  const [days, setDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
  const [sound, setSound] = useState("Gentle Wake")
  const [vibrate, setVibrate] = useState(true)
  const [remainingTime, setRemainingTime] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [storageInfo, setStorageInfo] = useState<{ used: number; available: number }>({ used: 0, available: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Load storage info
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

  // Calculate remaining time until alarm
  useEffect(() => {
    const calculateRemainingTime = () => {
      const now = new Date()
      const hour24 = isAM ? (hours === 12 ? 0 : hours) : hours === 12 ? 12 : hours + 12

      const nextAlarm = new Date()
      nextAlarm.setHours(hour24, minutes, 0, 0)

      if (nextAlarm <= now) {
        nextAlarm.setDate(nextAlarm.getDate() + 1)
      }

      while (!days.includes(nextAlarm.toLocaleDateString("en-US", { weekday: "long" }))) {
        nextAlarm.setDate(nextAlarm.getDate() + 1)
      }

      const diff = nextAlarm.getTime() - now.getTime()
      const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hoursLeft = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      let timeString = ""
      if (daysLeft > 0) timeString += `${daysLeft}d `
      if (hoursLeft > 0) timeString += `${hoursLeft}h `
      timeString += `${minutesLeft}m`

      setRemainingTime(timeString.trim())
    }

    if (days.length > 0) {
      calculateRemainingTime()
      const interval = setInterval(calculateRemainingTime, 60000)
      return () => clearInterval(interval)
    }
  }, [hours, minutes, isAM, days])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const hour24 = isAM ? (hours === 12 ? 0 : hours) : hours === 12 ? 12 : hours + 12
    const timeString = `${hour24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

    onAdd({
      time: timeString,
      label,
      days,
      sound,
      vibrate,
      enabled: true,
      snoozed: false,
    })
    onBack()
  }

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError("")

    try {
      // Validate file type
      if (!file.type.startsWith("audio/")) {
        throw new Error("Please select an audio file (MP3, WAV, OGG, etc.)")
      }

      // Validate file size (5MB limit for better performance)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error(`File size must be less than ${formatFileSize(maxSize)}`)
      }

      // Check available storage
      const storageInfo = await audioStorage.getStorageUsage()
      if (storageInfo.available > 0 && file.size > storageInfo.available - storageInfo.used) {
        throw new Error("Not enough storage space available")
      }

      // Validate file name
      const fileName = file.name.replace(/\.[^/.]+$/, "")
      if (fileName.length === 0) {
        throw new Error("Invalid file name")
      }

      if (fileName.length > 50) {
        throw new Error("File name is too long (max 50 characters)")
      }

      // Check if file already exists
      if (customAudioFiles[fileName]) {
        throw new Error("A file with this name already exists")
      }

      // Store file in IndexedDB
      const audioId = await audioStorage.storeAudioFile(fileName, file)

      // Get the blob URL for immediate use
      const audioUrl = await audioStorage.getAudioFile(fileName)

      if (audioUrl) {
        onAddCustomAudio(fileName, audioUrl)
        setSound(fileName)

        // Update storage info
        await loadStorageInfo()

        // Clear the input
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      } else {
        throw new Error("Failed to process audio file")
      }
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  const getStoragePercentage = (): number => {
    if (storageInfo.available === 0) return 0
    return (storageInfo.used / storageInfo.available) * 100
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-slate-900" : "bg-gray-50"}`}>
      {/* Header */}
      <div
        className={`sticky top-0 z-10 ${
          isDarkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-gray-200"
        } backdrop-blur-md border-b`}
      >
        <div className="container mx-auto px-4 max-w-md">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className={`rounded-full ${isDarkMode ? "text-white hover:bg-slate-800" : "hover:bg-gray-100"}`}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>New Alarm</h1>
            <Button
              onClick={handleSubmit}
              disabled={days.length === 0}
              className={`rounded-full px-4 ${
                isDarkMode ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 max-w-md py-6">
        <div className="space-y-8">
          {/* Time Picker */}
          <div
            className={`p-6 rounded-2xl ${
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            } border shadow-sm`}
          >
            {/* Time Display */}
            <div className="flex justify-center mb-8">
              <div className="flex items-end">
                {/* Hours */}
                <div className="relative">
                  <div
                    className={`text-7xl font-light tabular-nums ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {hours.toString().padStart(2, "0")}
                  </div>
                  <div className="absolute -top-6 left-0 right-0 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHours((prev) => (prev === 12 ? 1 : prev + 1))}
                      className={`h-6 w-6 rounded-full ${
                        isDarkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-600 hover:bg-gray-100"
                      }`}
                    >
                      ▲
                    </Button>
                  </div>
                  <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHours((prev) => (prev === 1 ? 12 : prev - 1))}
                      className={`h-6 w-6 rounded-full ${
                        isDarkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-600 hover:bg-gray-100"
                      }`}
                    >
                      ▼
                    </Button>
                  </div>
                </div>

                {/* Colon */}
                <div className={`text-7xl font-light mx-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}>:</div>

                {/* Minutes */}
                <div className="relative">
                  <div
                    className={`text-7xl font-light tabular-nums ${isDarkMode ? "text-white" : "text-slate-800"}`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {minutes.toString().padStart(2, "0")}
                  </div>
                  <div className="absolute -top-6 left-0 right-0 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMinutes((prev) => (prev === 59 ? 0 : prev + 1))}
                      className={`h-6 w-6 rounded-full ${
                        isDarkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-600 hover:bg-gray-100"
                      }`}
                    >
                      ▲
                    </Button>
                  </div>
                  <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMinutes((prev) => (prev === 0 ? 59 : prev - 1))}
                      className={`h-6 w-6 rounded-full ${
                        isDarkMode ? "text-slate-400 hover:bg-slate-700" : "text-slate-600 hover:bg-gray-100"
                      }`}
                    >
                      ▼
                    </Button>
                  </div>
                </div>

                {/* AM/PM */}
                <div className="ml-4 mb-2">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant={isAM ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsAM(true)}
                      className={`rounded-lg ${
                        isAM
                          ? isDarkMode
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-blue-600 hover:bg-blue-700"
                          : isDarkMode
                            ? "border-slate-600 text-slate-300"
                            : "border-gray-300"
                      }`}
                    >
                      AM
                    </Button>
                    <Button
                      variant={!isAM ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsAM(false)}
                      className={`rounded-lg ${
                        !isAM
                          ? isDarkMode
                            ? "bg-purple-600 hover:bg-purple-700"
                            : "bg-blue-600 hover:bg-blue-700"
                          : isDarkMode
                            ? "border-slate-600 text-slate-300"
                            : "border-gray-300"
                      }`}
                    >
                      PM
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Remaining Time */}
            {remainingTime && (
              <div
                className={`text-center p-3 rounded-xl text-sm ${
                  isDarkMode ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-slate-700"
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Alarm will ring in {remainingTime}
              </div>
            )}
          </div>

          {/* Label */}
          <div
            className={`p-6 rounded-2xl ${
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            } border shadow-sm`}
          >
            <Label className={`block mb-2 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Morning workout, Take medicine..."
              className={`${
                isDarkMode
                  ? "bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  : "bg-white border-gray-300"
              }`}
            />
          </div>

          {/* Repeat Days */}
          <div
            className={`p-6 rounded-2xl ${
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            } border shadow-sm`}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
              <h3 className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}>Repeat on</h3>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, index) => (
                <Button
                  key={day}
                  type="button"
                  variant={days.includes(day) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleDay(day)}
                  className={`h-12 ${
                    days.includes(day)
                      ? isDarkMode
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-blue-600 hover:bg-blue-700"
                      : isDarkMode
                        ? "border-slate-600 text-slate-300"
                        : "border-gray-300"
                  }`}
                >
                  {SHORT_DAYS[index].slice(0, 1)}
                  <span className="sr-only">{day}</span>
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])}
                className={`text-xs ${
                  days.length === 5 &&
                  days.includes("Monday") &&
                  days.includes("Friday") &&
                  !days.includes("Saturday") &&
                  !days.includes("Sunday")
                    ? isDarkMode
                      ? "border-purple-500 text-purple-400"
                      : "border-blue-500 text-blue-600"
                    : isDarkMode
                      ? "border-slate-600 text-slate-300"
                      : "border-gray-300"
                }`}
              >
                Weekdays
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDays(["Saturday", "Sunday"])}
                className={`text-xs ${
                  days.length === 2 && days.includes("Saturday") && days.includes("Sunday")
                    ? isDarkMode
                      ? "border-purple-500 text-purple-400"
                      : "border-blue-500 text-blue-600"
                    : isDarkMode
                      ? "border-slate-600 text-slate-300"
                      : "border-gray-300"
                }`}
              >
                Weekends
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])}
                className={`text-xs ${
                  days.length === 7
                    ? isDarkMode
                      ? "border-purple-500 text-purple-400"
                      : "border-blue-500 text-blue-600"
                    : isDarkMode
                      ? "border-slate-600 text-slate-300"
                      : "border-gray-300"
                }`}
              >
                Every day
              </Button>
            </div>
          </div>

          {/* Sound */}
          <div
            className={`p-6 rounded-2xl ${
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            } border shadow-sm`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
                <h3 className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}>Sound</h3>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`text-xs ${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
              >
                <Upload className="h-4 w-4 mr-1" />
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload Error */}
            {uploadError && (
              <div className="mb-4 p-3 rounded-xl bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {uploadError}
                </div>
              </div>
            )}

            <Select value={sound} onValueChange={setSound}>
              <SelectTrigger
                className={`${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300"}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {predefinedSounds.map((soundOption) => (
                  <SelectItem key={soundOption} value={soundOption}>
                    🔊 {soundOption}
                  </SelectItem>
                ))}
                {Object.keys(customAudioFiles).map((fileName) => (
                  <SelectItem key={fileName} value={fileName}>
                    🎵 {fileName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Storage Info */}
            {storageInfo.available > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`flex items-center gap-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <HardDrive className="h-3 w-3" />
                    Storage
                  </span>
                  <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
                    {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.available)}
                  </span>
                </div>
                <div className={`h-1 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-gray-200"}`}>
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
              </div>
            )}
          </div>

          {/* Vibration */}
          <div
            className={`p-6 rounded-2xl ${
              isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
            } border shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
                <h3 className={`font-medium ${isDarkMode ? "text-white" : "text-slate-800"}`}>Vibration</h3>
              </div>
              <SimpleToggle checked={vibrate} onCheckedChange={setVibrate} isDarkMode={isDarkMode} size="lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
