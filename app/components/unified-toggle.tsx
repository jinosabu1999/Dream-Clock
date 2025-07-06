"use client"

import { useState, useEffect } from "react"

interface UnifiedToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  isDarkMode: boolean
  size?: "sm" | "md" | "lg"
  disabled?: boolean
}

export function UnifiedToggle({
  checked,
  onCheckedChange,
  isDarkMode,
  size = "md",
  disabled = false,
}: UnifiedToggleProps) {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const handleToggle = () => {
    if (disabled) return

    const newValue = !isChecked
    setIsChecked(newValue)
    onCheckedChange(newValue)

    // Haptic feedback
    if ("vibrate" in navigator && !disabled) {
      navigator.vibrate(30)
    }
  }

  const sizeClasses = {
    sm: "w-9 h-5",
    md: "w-11 h-6",
    lg: "w-13 h-7",
  }

  const thumbSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  const translateClasses = {
    sm: "translate-x-4",
    md: "translate-x-5",
    lg: "translate-x-6",
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} 
        relative inline-flex items-center rounded-full transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${
          isChecked
            ? isDarkMode
              ? "bg-blue-600 focus:ring-blue-500"
              : "bg-blue-600 focus:ring-blue-500"
            : isDarkMode
              ? "bg-slate-600 focus:ring-slate-500"
              : "bg-gray-300 focus:ring-gray-400"
        }
        ${!disabled && "hover:scale-105 active:scale-95"}
        shadow-sm
      `}
    >
      {/* Track Background */}
      <span
        className={`
          absolute inset-0 rounded-full transition-all duration-300
          ${
            isChecked
              ? "bg-gradient-to-r from-blue-500 to-blue-600 shadow-inner"
              : isDarkMode
                ? "bg-gradient-to-r from-slate-600 to-slate-700"
                : "bg-gradient-to-r from-gray-300 to-gray-400"
          }
        `}
      />

      {/* Thumb */}
      <span
        className={`
          ${thumbSizeClasses[size]}
          relative inline-block rounded-full bg-white shadow-lg transform transition-all duration-300 ease-out
          ${isChecked ? translateClasses[size] : "translate-x-0.5"}
          flex items-center justify-center
          ${isChecked ? "shadow-lg shadow-blue-500/20" : "shadow-md"}
          border border-gray-200/50
        `}
      >
        {/* Material 3 Check Icon */}
        <svg
          className={`w-3 h-3 transition-all duration-300 ${
            isChecked ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
            fill={isChecked ? "#1976d2" : "transparent"}
            className="transition-colors duration-300"
          />
        </svg>
      </span>

      {/* Ripple effect */}
      <span
        className={`
          absolute inset-0 rounded-full transition-opacity duration-300
          ${isChecked ? "bg-blue-600/20" : "bg-gray-400/20"}
          ${!disabled && "hover:opacity-100 active:opacity-100"}
          opacity-0
        `}
      />
    </button>
  )
}
