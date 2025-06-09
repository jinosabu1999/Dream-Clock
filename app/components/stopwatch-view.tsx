"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Flag, TimerIcon as Stopwatch, Moon, Sun } from "lucide-react"

interface StopwatchViewProps {
  isDarkMode: boolean
}

export function StopwatchView({ isDarkMode }: StopwatchViewProps) {
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [laps, setLaps] = useState<number[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && startTime) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime)
      }, 10) // Update every 10ms for accuracy
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
  }, [isRunning, startTime])

  const formatTime = (milliseconds: number) => {
    const totalMs = Math.floor(milliseconds)
    const minutes = Math.floor(totalMs / 60000)
    const seconds = Math.floor((totalMs % 60000) / 1000)
    const ms = Math.floor((totalMs % 1000) / 10)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  const handleStart = () => {
    const now = Date.now()
    if (startTime === null) {
      setStartTime(now)
    } else {
      // Resume: adjust start time to account for elapsed time
      setStartTime(now - elapsedTime)
    }
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setStartTime(null)
    setElapsedTime(0)
    setLaps([])
  }

  const handleLap = () => {
    if (isRunning && startTime) {
      const currentTime = Date.now() - startTime
      setLaps((prevLaps) => [currentTime, ...prevLaps])
    }
  }

  const toggleDarkMode = () => {
    const event = new CustomEvent("toggleDarkMode")
    window.dispatchEvent(event)
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
            <Stopwatch className="h-6 w-6 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>Stopwatch</h1>
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

      {/* Main Timer Display */}
      <div
        className={`text-center p-8 rounded-3xl backdrop-blur-sm border transition-all duration-300 ${
          isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
        }`}
      >
        <div
          className={`text-5xl md:text-6xl font-mono font-light tracking-tight mb-6 ${
            isDarkMode ? "text-white" : "text-slate-800"
          }`}
        >
          {formatTime(elapsedTime)}
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              size="lg"
              className={`h-16 w-16 rounded-full ${
                isDarkMode ? "bg-green-600 hover:bg-green-700" : "bg-green-500 hover:bg-green-600"
              } text-white shadow-lg transition-all duration-200 hover:scale-110`}
            >
              <Play className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              size="lg"
              className={`h-16 w-16 rounded-full ${
                isDarkMode ? "bg-orange-600 hover:bg-orange-700" : "bg-orange-500 hover:bg-orange-600"
              } text-white shadow-lg transition-all duration-200 hover:scale-110`}
            >
              <Pause className="h-8 w-8" />
            </Button>
          )}

          <Button
            onClick={handleLap}
            disabled={!isRunning}
            size="lg"
            className={`h-16 w-16 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
              isRunning
                ? isDarkMode
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-orange-500 hover:bg-orange-600"
                : "bg-gray-400 hover:bg-gray-500"
            } text-white`}
          >
            <Flag className="h-8 w-8 font-bold" strokeWidth={3} />
          </Button>

          <Button
            onClick={handleReset}
            size="lg"
            className={`h-16 w-16 rounded-full ${
              isDarkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"
            } text-white shadow-lg transition-all duration-200 hover:scale-110`}
          >
            <RotateCcw className="h-8 w-8" />
          </Button>
        </div>
      </div>

      {/* Lap Times */}
      {laps.length > 0 && (
        <div
          className={`p-6 rounded-3xl backdrop-blur-sm border ${
            isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-slate-800"}`}>
            Lap Times ({laps.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {laps.map((lapTime, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-3 rounded-xl ${
                  isDarkMode ? "bg-slate-700/50" : "bg-white/50"
                }`}
              >
                <span className={`font-medium ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Lap {laps.length - index}
                </span>
                <span className={`font-mono text-lg ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                  {formatTime(lapTime)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
