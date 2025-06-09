"use client"

import { Button } from "@/components/ui/button"
import { Home, Settings, TimerIcon as Stopwatch, Globe, Clock } from "lucide-react"

interface BottomNavbarProps {
  activeView: string
  onViewChange: (view: string) => void
  isDarkMode: boolean
}

const navItems = [
  { id: "home", icon: Home, label: "Home" },
  { id: "stopwatch", icon: Stopwatch, label: "Stopwatch" },
  { id: "timer", icon: Clock, label: "Timer" },
  { id: "worldclock", icon: Globe, label: "World" },
  { id: "settings", icon: Settings, label: "Settings" },
]

export function BottomNavbar({ activeView, onViewChange, isDarkMode }: BottomNavbarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      {/* Modern Glass Morphism Background */}
      <div
        className={`relative ${
          isDarkMode
            ? "bg-gradient-to-t from-slate-900/95 via-slate-800/90 to-slate-800/80"
            : "bg-gradient-to-t from-white/95 via-white/90 to-white/80"
        } backdrop-blur-xl border-t ${isDarkMode ? "border-slate-700/50" : "border-gray-200/50"}`}
      >
        {/* Animated Glow Effect */}
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-gradient-to-t from-purple-600/10 via-transparent to-transparent"
              : "bg-gradient-to-t from-blue-600/10 via-transparent to-transparent"
          } animate-pulse`}
          style={{ animationDuration: "3s" }}
        />

        {/* Active Item Background Indicator */}
        <div
          className={`absolute top-0 h-1 transition-all duration-500 ease-out ${
            isDarkMode
              ? "bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
              : "bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500"
          } rounded-full`}
          style={{
            width: "20%",
            left: `${navItems.findIndex((item) => item.id === activeView) * 20}%`,
            transform: "translateX(0%)",
          }}
        />

        <div className="container mx-auto px-4 max-w-md relative">
          <div className="flex items-center justify-around py-3">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeView === item.id

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewChange(item.id)}
                  className={`relative flex flex-col items-center gap-1 h-auto py-3 px-4 rounded-2xl transition-all duration-300 transform ${
                    isActive
                      ? `scale-110 ${
                          isDarkMode
                            ? "bg-gradient-to-b from-purple-600/30 to-pink-600/20 text-white shadow-lg shadow-purple-500/25"
                            : "bg-gradient-to-b from-blue-600/30 to-purple-600/20 text-blue-700 shadow-lg shadow-blue-500/25"
                        }`
                      : `hover:scale-105 ${
                          isDarkMode
                            ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                            : "text-slate-600 hover:text-slate-800 hover:bg-gray-100/50"
                        }`
                  }`}
                >
                  {/* Icon Container with Modern Styling */}
                  <div
                    className={`relative p-2 rounded-xl transition-all duration-300 ${
                      isActive
                        ? `${
                            isDarkMode
                              ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
                              : "bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30"
                          } text-white`
                        : "bg-transparent"
                    }`}
                  >
                    <Icon className={`h-5 w-5 transition-all duration-300 ${isActive ? "drop-shadow-sm" : ""}`} />

                    {/* Animated Ring for Active State */}
                    {isActive && (
                      <div
                        className={`absolute inset-0 rounded-xl border-2 ${
                          isDarkMode ? "border-purple-400/50" : "border-blue-400/50"
                        } animate-pulse`}
                        style={{ animationDuration: "2s" }}
                      />
                    )}
                  </div>

                  {/* Label with Modern Typography */}
                  <span
                    className={`text-xs font-medium transition-all duration-300 ${
                      isActive ? "font-semibold tracking-wide" : "tracking-normal"
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Active Indicator Dot */}
                  {isActive && (
                    <div
                      className={`absolute -top-1 w-2 h-2 rounded-full ${
                        isDarkMode
                          ? "bg-gradient-to-r from-purple-400 to-pink-400"
                          : "bg-gradient-to-r from-blue-400 to-purple-400"
                      } animate-bounce shadow-lg`}
                      style={{ animationDuration: "1.5s" }}
                    />
                  )}

                  {/* Ripple Effect on Tap */}
                  <div
                    className={`absolute inset-0 rounded-2xl opacity-0 ${
                      isDarkMode ? "bg-purple-500/20" : "bg-blue-500/20"
                    } transition-opacity duration-150 active:opacity-100`}
                  />
                </Button>
              )
            })}
          </div>
        </div>

        {/* Bottom Safe Area for Mobile */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  )
}
