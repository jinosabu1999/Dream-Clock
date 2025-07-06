"use client"

import { useState, useEffect } from "react"

interface MaterialToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  isDarkMode: boolean
  size?: "sm" | "md" | "lg"
  disabled?: boolean
}

export function MaterialToggle({
  checked,
  onCheckedChange,
  isDarkMode,
  size = "md",
  disabled = false,
}: MaterialToggleProps) {
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

  // Size configurations
  const sizeConfig = {
    sm: { track: "w-8 h-5", thumb: "w-4 h-4", translate: "translate-x-3" },
    md: { track: "w-11 h-6", thumb: "w-5 h-5", translate: "translate-x-5" },
    lg: { track: "w-14 h-7", thumb: "w-6 h-6", translate: "translate-x-7" },
  }

  const config = sizeConfig[size]

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`
        ${config.track}
        relative inline-flex items-center rounded-full transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${
          isChecked
            ? "bg-blue-600 focus:ring-blue-500"
            : isDarkMode
              ? "bg-gray-600 focus:ring-gray-500"
              : "bg-gray-300 focus:ring-gray-400"
        }
      `}
    >
      <span
        className={`
          ${config.thumb}
          inline-block rounded-full bg-white shadow-lg transform transition-transform duration-200 ease-in-out
          ${isChecked ? config.translate : "translate-x-0.5"}
          flex items-center justify-center
        `}
      >
        {isChecked && (
          <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
    </button>
  )
}
