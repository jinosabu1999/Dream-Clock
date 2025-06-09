"use client"

import { Switch } from "@/components/ui/switch"

interface EnhancedToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  isDarkMode: boolean
  size?: "sm" | "md" | "lg"
}

export function EnhancedToggle({ checked, onCheckedChange, isDarkMode, size = "md" }: EnhancedToggleProps) {
  const sizeClasses = {
    sm: "h-5 w-9",
    md: "h-6 w-11",
    lg: "h-7 w-13",
  }

  const handleChange = (newChecked: boolean) => {
    console.log("Toggle changed:", newChecked) // Debug log

    // Trigger haptic feedback immediately
    if ("vibrate" in navigator) {
      try {
        navigator.vibrate(50)
        console.log("Haptic feedback triggered") // Debug log
      } catch (error) {
        console.log("Haptic feedback failed:", error)
      }
    }

    // Call the parent handler
    onCheckedChange(newChecked)
  }

  return (
    <div className="relative">
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
        className={`${sizeClasses[size]} transition-all duration-300 ${
          checked
            ? isDarkMode
              ? "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
              : "data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
            : isDarkMode
              ? "bg-slate-700 border-slate-600"
              : "bg-gray-200 border-gray-300"
        } ${checked ? "shadow-lg scale-105" : ""}`}
      />
      {checked && (
        <div
          className={`absolute inset-0 rounded-full animate-ping ${
            isDarkMode ? "bg-gradient-to-r from-purple-500 to-pink-500" : "bg-gradient-to-r from-blue-500 to-purple-500"
          } opacity-20`}
        />
      )}
    </div>
  )
}
