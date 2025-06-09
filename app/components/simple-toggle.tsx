"use client"

import { useState, useEffect } from "react"

interface SimpleToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  isDarkMode: boolean
  size?: "sm" | "md" | "lg"
  disabled?: boolean
}

export function SimpleToggle({
  checked,
  onCheckedChange,
  isDarkMode,
  size = "md",
  disabled = false,
}: SimpleToggleProps) {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const handleToggle = () => {
    if (disabled) return

    const newValue = !isChecked
    setIsChecked(newValue)
    onCheckedChange(newValue)
  }

  const sizeClasses = {
    sm: "w-8 h-4",
    md: "w-10 h-5",
    lg: "w-12 h-6",
  }

  const thumbSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} 
        relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${
          isChecked
            ? isDarkMode
              ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg"
              : "bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg"
            : isDarkMode
              ? "bg-slate-700 border border-slate-600"
              : "bg-gray-300 border border-gray-400"
        }
        ${!disabled && "hover:scale-105"}
      `}
    >
      <span
        className={`
          ${thumbSizeClasses[size]}
          inline-block rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out
          ${isChecked ? "translate-x-full" : "translate-x-0"}
        `}
      />
      {isChecked && (
        <div className="absolute inset-0 rounded-full animate-ping bg-gradient-to-r from-purple-500 to-pink-500 opacity-20" />
      )}
    </button>
  )
}
