"use client"

import { useState, useEffect } from "react"

interface ClockDisplayProps {
  isDarkMode: boolean
}

export function ClockDisplay({ isDarkMode }: ClockDisplayProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  const formatSeconds = (date: Date) => {
    return date.getSeconds().toString().padStart(2, "0")
  }

  return (
    <div
      className={`text-center mb-8 p-8 rounded-3xl backdrop-blur-sm border transition-all duration-500 relative overflow-hidden ${
        isDarkMode ? "bg-slate-800/30 border-slate-700/50 shadow-2xl" : "bg-white/40 border-white/50 shadow-xl"
      }`}
    >
      {/* Animated background gradient */}
      <div
        className={`absolute inset-0 opacity-20 animate-pulse ${
          isDarkMode
            ? "bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600"
            : "bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400"
        }`}
        style={{ animationDuration: "4s" }}
      />

      <div className="relative z-10">
        <div
          className={`text-6xl md:text-7xl font-light tracking-tight mb-2 transition-all duration-300 ${
            isDarkMode ? "text-white drop-shadow-lg" : "text-slate-800 drop-shadow-md"
          }`}
        >
          {formatTime(time)}
          <span className={`text-3xl md:text-4xl ml-2 ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>
            {formatSeconds(time)}
          </span>
        </div>
        <div className={`text-lg font-medium ${isDarkMode ? "text-slate-200" : "text-slate-600"}`}>
          {formatDate(time)}
        </div>

        {/* Decorative elements */}
        <div className="flex justify-center mt-4 space-x-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? "bg-purple-400" : "bg-blue-400"}`}
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
