"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Play, Pause, RotateCcw, Timer, Moon, Sun, Square, Plus, Minus } from "lucide-react"
import type { AlarmSettings } from "../types/alarm"

interface TimerViewProps {
  isDarkMode: boolean
  settings: AlarmSettings
}

export function TimerView({ isDarkMode, settings }: TimerViewProps) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(5)
  const [seconds, setSeconds] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isFinished, setIsFinished] = useState(false)
  const [audioController, setAudioController] = useState<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1000) {
            setIsRunning(false)
            setIsFinished(true)
            triggerTimerFinished()
            return 0
          }
          return prevTime - 1000
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  const triggerTimerFinished = () => {
    // Play sound
    const audioManager = (window as any).audioManager
    if (audioManager) {
      const controller = audioManager.playPredefinedSound("Digital Beep", settings.volume / 100)
      setAudioController(controller)
    }

    // Vibrate
    if (settings.vibrationEnabled && "vibrate" in navigator) {
      navigator.vibrate([1000, 500, 1000, 500, 1000])
    }

    // Show notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Timer Finished!", {
        body: "Your timer has completed!",
        icon: "/icon-192x192.png",
      })
    }
  }

  const formatTime = useCallback((totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }, [])

  const handleStart = () => {
    if (timeLeft === 0) {
      const totalMs = (hours * 3600 + minutes * 60 + seconds) * 1000
      if (totalMs === 0) return
      setTimeLeft(totalMs)
    }
    setIsRunning(true)
    setIsFinished(false)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleStop = () => {
    setIsRunning(false)
    setTimeLeft(0)
    setIsFinished(false)
    if (audioController) {
      audioController.stop()
      setAudioController(null)
    }
    const audioManager = (window as any).audioManager
    if (audioManager) {
      audioManager.stopAllAudio()
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    setTimeLeft(0)
    setIsFinished(false)
    setHours(0)
    setMinutes(5)
    setSeconds(0)
    if (audioController) {
      audioController.stop()
      setAudioController(null)
    }
    const audioManager = (window as any).audioManager
    if (audioManager) {
      audioManager.stopAllAudio()
    }
  }

  const adjustTime = (type: "hours" | "minutes" | "seconds", increment: boolean) => {
    if (isRunning) return

    const setValue = type === "hours" ? setHours : type === "minutes" ? setMinutes : setSeconds
    const currentValue = type === "hours" ? hours : type === "minutes" ? minutes : seconds
    const maxValue = type === "hours" ? 23 : 59

    if (increment) {
      setValue(currentValue >= maxValue ? 0 : currentValue + 1)
    } else {
      setValue(currentValue <= 0 ? maxValue : currentValue - 1)
    }
  }

  const setPresetTimer = (h: number, m: number, s: number) => {
    if (isRunning) return
    setHours(h)
    setMinutes(m)
    setSeconds(s)
    setTimeLeft(0)
  }

  const toggleDarkMode = () => {
    const event = new CustomEvent("toggleDarkMode")
    window.dispatchEvent(event)
  }

  const displayTime =
    timeLeft > 0 ? formatTime(Math.floor(timeLeft / 1000)) : formatTime(hours * 3600 + minutes * 60 + seconds)
  const progress = timeLeft > 0 ? (timeLeft / ((hours * 3600 + minutes * 60 + seconds) * 1000)) * 100 : 0

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
            <Timer className="h-6 w-6 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Timer</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          className={`rounded-full transition-all duration-300 ${
            isDarkMode
              ? "text-yellow-400 hover:bg-slate-800 hover:scale-110"
              : "text-slate-600 hover:bg-white/50 hover:scale-110"
          }`}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Timer Display with Rectangular Progress Bar */}
      <div
        className={`p-8 rounded-3xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
        } ${isFinished ? "animate-pulse" : ""}`}
      >
        {/* Rectangular Progress Bar at Top */}
        {timeLeft > 0 && (
          <div className="mb-6">
            <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-slate-700" : "bg-gray-200"}`}>
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  isDarkMode
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-gradient-to-r from-blue-500 to-purple-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className={`text-center mt-2 text-sm ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
              {Math.round(progress)}% remaining
            </div>
          </div>
        )}

        <div className="text-center">
          {/* Time Display - Now with plenty of space */}
          <div
            className={`text-5xl md:text-6xl font-mono font-bold tracking-tight mb-6 ${
              isDarkMode ? "text-white" : "text-slate-800"
            } ${isFinished ? "text-red-500 animate-pulse" : ""}`}
          >
            {displayTime}
          </div>

          {isFinished && (
            <div className="mb-6">
              <div className="text-4xl mb-2">⏰</div>
              <p className={`text-lg font-semibold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>Time's Up!</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex justify-center gap-3">
            {isFinished ? (
              <Button
                onClick={handleStop}
                size="lg"
                className={`h-14 w-14 rounded-full ${
                  isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
                } text-white shadow-lg transition-all duration-200 hover:scale-110`}
              >
                <Square className="h-6 w-6" />
              </Button>
            ) : !isRunning ? (
              <>
                <Button
                  onClick={handleStart}
                  size="lg"
                  disabled={hours === 0 && minutes === 0 && seconds === 0}
                  className={`h-14 w-14 rounded-full ${
                    isDarkMode
                      ? "bg-green-600 hover:bg-green-700 disabled:bg-slate-700"
                      : "bg-green-500 hover:bg-green-600 disabled:bg-gray-300"
                  } text-white shadow-lg transition-all duration-200 hover:scale-110 disabled:hover:scale-100`}
                >
                  <Play className="h-6 w-6" />
                </Button>
                <Button
                  onClick={handleReset}
                  size="lg"
                  className={`h-14 w-14 rounded-full ${
                    isDarkMode ? "bg-gray-600 hover:bg-gray-700" : "bg-gray-500 hover:bg-gray-600"
                  } text-white shadow-lg transition-all duration-200 hover:scale-110`}
                >
                  <RotateCcw className="h-6 w-6" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handlePause}
                  size="lg"
                  className={`h-14 w-14 rounded-full ${
                    isDarkMode ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-500 hover:bg-orange-600"
                  } text-white shadow-lg transition-all duration-200 hover:scale-110`}
                >
                  <Pause className="h-6 w-6" />
                </Button>
                <Button
                  onClick={handleStop}
                  size="lg"
                  className={`h-14 w-14 rounded-full ${
                    isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
                  } text-white shadow-lg transition-all duration-200 hover:scale-110`}
                >
                  <Square className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Time Input */}
      {!isRunning && !isFinished && (
        <div
          className={`p-6 rounded-3xl backdrop-blur-sm border ${
            isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-slate-800"}`}>
            Set Timer Duration
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {/* Hours */}
            <div className="text-center">
              <Label className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Hours</Label>
              <div className="flex flex-col items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustTime("hours", true)}
                  className={`rounded-full ${isDarkMode ? "border-slate-600" : "border-gray-300"}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <div
                  className={`text-2xl font-bold py-2 px-4 rounded-xl min-w-[60px] ${
                    isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100 text-slate-800"
                  }`}
                >
                  {hours.toString().padStart(2, "0")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustTime("hours", false)}
                  className={`rounded-full ${isDarkMode ? "border-slate-600" : "border-gray-300"}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Minutes */}
            <div className="text-center">
              <Label className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Minutes</Label>
              <div className="flex flex-col items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustTime("minutes", true)}
                  className={`rounded-full ${isDarkMode ? "border-slate-600" : "border-gray-300"}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <div
                  className={`text-2xl font-bold py-2 px-4 rounded-xl min-w-[60px] ${
                    isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100 text-slate-800"
                  }`}
                >
                  {minutes.toString().padStart(2, "0")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustTime("minutes", false)}
                  className={`rounded-full ${isDarkMode ? "border-slate-600" : "border-gray-300"}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Seconds */}
            <div className="text-center">
              <Label className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Seconds</Label>
              <div className="flex flex-col items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustTime("seconds", true)}
                  className={`rounded-full ${isDarkMode ? "border-slate-600" : "border-gray-300"}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <div
                  className={`text-2xl font-bold py-2 px-4 rounded-xl min-w-[60px] ${
                    isDarkMode ? "bg-slate-700 text-white" : "bg-gray-100 text-slate-800"
                  }`}
                >
                  {seconds.toString().padStart(2, "0")}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => adjustTime("seconds", false)}
                  className={`rounded-full ${isDarkMode ? "border-slate-600" : "border-gray-300"}`}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={() => setPresetTimer(0, 1, 0)}
              variant="outline"
              size="sm"
              className={`${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
            >
              1m
            </Button>
            <Button
              onClick={() => setPresetTimer(0, 5, 0)}
              variant="outline"
              size="sm"
              className={`${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
            >
              5m
            </Button>
            <Button
              onClick={() => setPresetTimer(0, 10, 0)}
              variant="outline"
              size="sm"
              className={`${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
            >
              10m
            </Button>
            <Button
              onClick={() => setPresetTimer(0, 15, 0)}
              variant="outline"
              size="sm"
              className={`${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
            >
              15m
            </Button>
            <Button
              onClick={() => setPresetTimer(0, 30, 0)}
              variant="outline"
              size="sm"
              className={`${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
            >
              30m
            </Button>
            <Button
              onClick={() => setPresetTimer(1, 0, 0)}
              variant="outline"
              size="sm"
              className={`${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
            >
              1h
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
