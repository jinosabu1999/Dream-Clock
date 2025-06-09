"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Globe, Moon, Sun } from "lucide-react"

interface WorldClockViewProps {
  isDarkMode: boolean
}

interface WorldClock {
  city: string
  timezone: string
  flag: string
}

const worldClocks: WorldClock[] = [
  { city: "New York", timezone: "America/New_York", flag: "🇺🇸" },
  { city: "London", timezone: "Europe/London", flag: "🇬🇧" },
  { city: "Tokyo", timezone: "Asia/Tokyo", flag: "🇯🇵" },
  { city: "Sydney", timezone: "Australia/Sydney", flag: "🇦🇺" },
  { city: "Dubai", timezone: "Asia/Dubai", flag: "🇦🇪" },
  { city: "Los Angeles", timezone: "America/Los_Angeles", flag: "🇺🇸" },
  { city: "Paris", timezone: "Europe/Paris", flag: "🇫🇷" },
  { city: "Singapore", timezone: "Asia/Singapore", flag: "🇸🇬" },
]

export function WorldClockView({ isDarkMode }: WorldClockViewProps) {
  const [times, setTimes] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    const updateTimes = () => {
      const newTimes: { [key: string]: string } = {}
      worldClocks.forEach((clock) => {
        const time = new Date().toLocaleTimeString("en-US", {
          timeZone: clock.timezone,
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
        newTimes[clock.city] = time
      })
      setTimes(newTimes)
    }

    updateTimes()
    const interval = setInterval(updateTimes, 1000)

    return () => clearInterval(interval)
  }, [])

  const getLocalDate = (timezone: string) => {
    return new Date().toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
    })
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
            <Globe className="h-6 w-6 text-white" />
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>World Clock</h1>
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

      {/* World Clocks Grid */}
      <div className="grid grid-cols-1 gap-4">
        {worldClocks.map((clock) => (
          <div
            key={clock.city}
            className={`p-6 rounded-3xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
              isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-3xl">{clock.flag}</div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                    {clock.city}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                    {getLocalDate(clock.timezone)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                  {times[clock.city] || "--:--"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current Location */}
      <div
        className={`p-6 rounded-3xl backdrop-blur-sm border ${
          isDarkMode ? "bg-slate-800/30 border-slate-700/50" : "bg-white/40 border-white/50"
        }`}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">📍</div>
          <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}>
            Your Location
          </h3>
          <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
            {new Date().toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
