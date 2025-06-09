"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown } from "lucide-react"

interface ModernTimePickerProps {
  value: string
  onChange: (time: string) => void
  isDarkMode: boolean
}

export function ModernTimePicker({ value, onChange, isDarkMode }: ModernTimePickerProps) {
  const [hours, setHours] = useState(7)
  const [minutes, setMinutes] = useState(0)
  const [isAM, setIsAM] = useState(true)
  const isInitializing = useRef(true)
  const lastValue = useRef(value)

  // Initialize from value only when value actually changes
  useEffect(() => {
    if (value && value !== lastValue.current) {
      const [h, m] = value.split(":").map(Number)
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h
      setHours(hour12)
      setMinutes(m)
      setIsAM(h < 12)
      lastValue.current = value
      isInitializing.current = false
    }
  }, [value])

  // Update parent only when internal state changes (not during initialization)
  useEffect(() => {
    if (!isInitializing.current) {
      const hour24 = isAM ? (hours === 12 ? 0 : hours) : hours === 12 ? 12 : hours + 12
      const timeString = `${hour24.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`

      if (timeString !== lastValue.current) {
        lastValue.current = timeString
        onChange(timeString)
      }
    }
  }, [hours, minutes, isAM, onChange])

  const adjustHours = useCallback((increment: boolean) => {
    setHours((prev) => (increment ? (prev === 12 ? 1 : prev + 1) : prev === 1 ? 12 : prev - 1))
  }, [])

  const adjustMinutes = useCallback((increment: boolean) => {
    setMinutes((prev) => (increment ? (prev === 59 ? 0 : prev + 1) : prev === 0 ? 59 : prev - 1))
  }, [])

  return (
    <div
      className={`p-6 rounded-3xl backdrop-blur-sm border ${
        isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-white/50"
      }`}
    >
      <div className="flex items-center justify-center gap-4">
        {/* Hours */}
        <div className="flex flex-col items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => adjustHours(true)}
            className={`rounded-full ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <div
            className={`text-4xl font-bold py-4 px-2 min-w-[80px] text-center ${
              isDarkMode ? "text-white" : "text-slate-800"
            }`}
          >
            {hours.toString().padStart(2, "0")}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => adjustHours(false)}
            className={`rounded-full ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>

        {/* Separator */}
        <div className={`text-4xl font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>:</div>

        {/* Minutes */}
        <div className="flex flex-col items-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => adjustMinutes(true)}
            className={`rounded-full ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
          <div
            className={`text-4xl font-bold py-4 px-2 min-w-[80px] text-center ${
              isDarkMode ? "text-white" : "text-slate-800"
            }`}
          >
            {minutes.toString().padStart(2, "0")}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => adjustMinutes(false)}
            className={`rounded-full ${isDarkMode ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
          >
            <ChevronDown className="h-5 w-5" />
          </Button>
        </div>

        {/* AM/PM */}
        <div className="flex flex-col gap-2 ml-4">
          <Button
            type="button"
            variant={isAM ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAM(true)}
            className={`rounded-xl font-semibold ${
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
            type="button"
            variant={!isAM ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAM(false)}
            className={`rounded-xl font-semibold ${
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
  )
}
