"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Upload, ChevronUp, ChevronDown, AlertCircle, HardDrive, Clock, Calendar, Music, Zap } from "lucide-react"
import { audioStorage } from "../utils/audio-storage"
import type { Alarm } from "../types/alarm"

interface AddAlarmModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (alarm: Omit<Alarm, "id">) => void
  isDarkMode: boolean
  customAudioFiles: { [key: string]: string }
  onAddCustomAudio: (name: string, audioUrl: string) => void
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function AddAlarmModal({
  isOpen,
  onClose,
  onAdd,
  isDarkMode,
  customAudioFiles,
  onAddCustomAudio,
}: AddAlarmModalProps) {
  const [hours, setHours] = useState(7)
  const [minutes, setMinutes] = useState(0)
  const [isAM, setIsAM] = useState(true)
  const [label, setLabel] = useState("")
  const [days, setDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
  const [sound, setSound] = useState("Gentle Wake")
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
    if (isOpen) {
      loadStorageInfo()
    }
  }, [isOpen])

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
      vibrate: true,
      enabled: true,
      snoozed: false,
    })
    onClose()
    resetForm()
  }

  const resetForm = () => {
    setHours(7)
    setMinutes(0)
    setIsAM(true)
    setLabel("")
    setDays(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"])
    setSound("Gentle Wake")
    setUploadError("")
  }

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const adjustTime = (type: "hours" | "minutes", increment: boolean) => {
    if (type === "hours") {
      setHours((prev) => (increment ? (prev === 12 ? 1 : prev + 1) : prev === 1 ? 12 : prev - 1))
    } else {
      setMinutes((prev) => (increment ? (prev === 59 ? 0 : prev + 1) : prev === 0 ? 59 : prev - 1))
    }
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modern Slide-up Panel */}
      <div
        className={`relative w-full max-h-[90vh] rounded-t-[2rem] transition-all duration-500 ease-out transform ${
          isOpen ? "translate-y-0" : "translate-y-full"
        } ${
          isDarkMode ? "bg-gradient-to-b from-slate-800 to-slate-900" : "bg-gradient-to-b from-white to-gray-50"
        } shadow-2xl`}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-4 pb-2">
          <div className={`w-12 h-1.5 rounded-full ${isDarkMode ? "bg-slate-600" : "bg-gray-300"}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/10">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isDarkMode
                  ? "bg-gradient-to-br from-purple-600 to-pink-600"
                  : "bg-gradient-to-br from-blue-600 to-purple-600"
              }`}
            >
              <Clock className="h-5 w-5 text-white" />
            </div>
            <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Create New Alarm</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100/10">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Time Section */}
            <div
              className={`p-6 rounded-2xl ${isDarkMode ? "bg-slate-700/30" : "bg-white/70"} border border-gray-200/20`}
            >
              <div className="flex items-center gap-2 mb-6">
                <Clock className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Set Time</h3>
              </div>

              {/* Modern Time Picker */}
              <div className="flex items-center justify-center gap-6 mb-6">
                {/* Hours */}
                <div className="flex flex-col items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustTime("hours", true)}
                    className={`rounded-full mb-2 ${isDarkMode ? "hover:bg-slate-600" : "hover:bg-gray-100"}`}
                  >
                    <ChevronUp className="h-5 w-5" />
                  </Button>
                  <div
                    className={`text-4xl font-bold py-4 px-6 rounded-2xl min-w-[100px] text-center ${
                      isDarkMode ? "bg-slate-600/50 text-white" : "bg-gray-100 text-slate-800"
                    }`}
                  >
                    {hours.toString().padStart(2, "0")}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustTime("hours", false)}
                    className={`rounded-full mt-2 ${isDarkMode ? "hover:bg-slate-600" : "hover:bg-gray-100"}`}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </Button>
                </div>

                <div className={`text-4xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>:</div>

                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustTime("minutes", true)}
                    className={`rounded-full mb-2 ${isDarkMode ? "hover:bg-slate-600" : "hover:bg-gray-100"}`}
                  >
                    <ChevronUp className="h-5 w-5" />
                  </Button>
                  <div
                    className={`text-4xl font-bold py-4 px-6 rounded-2xl min-w-[100px] text-center ${
                      isDarkMode ? "bg-slate-600/50 text-white" : "bg-gray-100 text-slate-800"
                    }`}
                  >
                    {minutes.toString().padStart(2, "0")}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => adjustTime("minutes", false)}
                    className={`rounded-full mt-2 ${isDarkMode ? "hover:bg-slate-600" : "hover:bg-gray-100"}`}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </Button>
                </div>

                {/* AM/PM Toggle */}
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    variant={isAM ? "default" : "outline"}
                    onClick={() => setIsAM(true)}
                    className={`px-6 py-3 rounded-xl font-semibold ${
                      isAM
                        ? isDarkMode
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        : isDarkMode
                          ? "border-slate-600 text-slate-300"
                          : "border-gray-300"
                    }`}
                  >
                    AM
                  </Button>
                  <Button
                    type="button"
                    variant={!isAM ? "default" : "outline"}
                    onClick={() => setIsAM(false)}
                    className={`px-6 py-3 rounded-xl font-semibold ${
                      !isAM
                        ? isDarkMode
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        : isDarkMode
                          ? "border-slate-600 text-slate-300"
                          : "border-gray-300"
                    }`}
                  >
                    PM
                  </Button>
                </div>
              </div>

              {/* Time Until Alarm */}
              {remainingTime && (
                <div
                  className={`text-center p-4 rounded-xl ${
                    isDarkMode
                      ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300"
                      : "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700"
                  }`}
                >
                  <Zap className="h-4 w-4 inline mr-2" />
                  Alarm rings in {remainingTime}
                </div>
              )}
            </div>

            {/* Label Section */}
            <div
              className={`p-6 rounded-2xl ${isDarkMode ? "bg-slate-700/30" : "bg-white/70"} border border-gray-200/20`}
            >
              <Label className={`text-lg font-semibold mb-4 block ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                Alarm Label
              </Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Morning workout, Take medicine, Wake up..."
                className={`h-12 text-lg rounded-xl ${
                  isDarkMode
                    ? "bg-slate-600/50 border-slate-500 text-white placeholder-slate-400"
                    : "bg-white border-gray-300 placeholder-gray-500"
                }`}
              />
            </div>

            {/* Days Section */}
            <div
              className={`p-6 rounded-2xl ${isDarkMode ? "bg-slate-700/30" : "bg-white/70"} border border-gray-200/20`}
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
                <Label className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                  Repeat Days
                </Label>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day, index) => (
                  <Button
                    key={day}
                    type="button"
                    variant={days.includes(FULL_DAYS[index]) ? "default" : "outline"}
                    onClick={() => toggleDay(FULL_DAYS[index])}
                    className={`h-12 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      days.includes(FULL_DAYS[index])
                        ? isDarkMode
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        : isDarkMode
                          ? "border-slate-600 text-slate-300 hover:bg-slate-600/50"
                          : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sound Section */}
            <div
              className={`p-6 rounded-2xl ${isDarkMode ? "bg-slate-700/30" : "bg-white/70"} border border-gray-200/20`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className={`h-5 w-5 ${isDarkMode ? "text-purple-400" : "text-blue-600"}`} />
                  <Label className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    Alarm Sound
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`rounded-xl ${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </div>

              {/* Storage Info */}
              {storageInfo.available > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className={`flex items-center gap-1 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <HardDrive className="h-4 w-4" />
                      Storage
                    </span>
                    <span className={isDarkMode ? "text-slate-400" : "text-slate-500"}>
                      {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.available)}
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-600" : "bg-gray-200"}`}>
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
                  className={`h-12 rounded-xl ${
                    isDarkMode ? "bg-slate-600/50 border-slate-500 text-white" : "bg-white border-gray-300"
                  }`}
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
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className={`p-6 border-t ${isDarkMode ? "border-slate-700/50" : "border-gray-200/50"}`}>
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={`flex-1 h-14 rounded-xl font-semibold ${
                isDarkMode ? "border-slate-600 text-slate-300 hover:bg-slate-700" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className={`flex-1 h-14 rounded-xl font-semibold text-lg transition-all duration-300 ${
                isDarkMode
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              } text-white shadow-lg hover:shadow-xl`}
              disabled={days.length === 0 || isUploading}
            >
              Create Alarm
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
