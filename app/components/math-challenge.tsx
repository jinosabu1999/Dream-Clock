"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calculator, CheckCircle, XCircle } from "lucide-react"

interface MathChallengeProps {
  difficulty: "easy" | "medium" | "hard"
  onSolved: () => void
  isDarkMode: boolean
}

export function MathChallenge({ difficulty, onSolved, isDarkMode }: MathChallengeProps) {
  const [problem, setProblem] = useState({ question: "", answer: 0 })
  const [userAnswer, setUserAnswer] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const generateProblem = () => {
    let question = ""
    let answer = 0

    switch (difficulty) {
      case "easy":
        const a = Math.floor(Math.random() * 20) + 1
        const b = Math.floor(Math.random() * 20) + 1
        const operation = Math.random() > 0.5 ? "+" : "-"
        if (operation === "+") {
          question = `${a} + ${b}`
          answer = a + b
        } else {
          question = `${Math.max(a, b)} - ${Math.min(a, b)}`
          answer = Math.max(a, b) - Math.min(a, b)
        }
        break

      case "medium":
        const c = Math.floor(Math.random() * 12) + 1
        const d = Math.floor(Math.random() * 12) + 1
        const op = Math.random() > 0.5 ? "*" : "+"
        if (op === "*") {
          question = `${c} × ${d}`
          answer = c * d
        } else {
          const e = Math.floor(Math.random() * 50) + 10
          const f = Math.floor(Math.random() * 30) + 5
          question = `${e} + ${f}`
          answer = e + f
        }
        break

      case "hard":
        const operations = ["+", "-", "*"]
        const op1 = operations[Math.floor(Math.random() * operations.length)]
        const op2 = operations[Math.floor(Math.random() * operations.length)]
        const x = Math.floor(Math.random() * 15) + 1
        const y = Math.floor(Math.random() * 15) + 1
        const z = Math.floor(Math.random() * 10) + 1

        if (op1 === "*" && op2 === "+") {
          question = `${x} × ${y} + ${z}`
          answer = x * y + z
        } else if (op1 === "+" && op2 === "*") {
          question = `${x} + ${y} × ${z}`
          answer = x + y * z
        } else {
          question = `${x} ${op1} ${y} ${op2} ${z}`
          if (op1 === "+" && op2 === "+") answer = x + y + z
          else if (op1 === "+" && op2 === "-") answer = x + y - z
          else if (op1 === "-" && op2 === "+") answer = x - y + z
          else if (op1 === "-" && op2 === "-") answer = x - y - z
          else if (op1 === "*" && op2 === "*") answer = x * y * z
        }
        break
    }

    setProblem({ question, answer })
    setUserAnswer("")
    setIsCorrect(null)
  }

  useEffect(() => {
    generateProblem()
  }, [difficulty])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const userNum = Number.parseInt(userAnswer)

    if (userNum === problem.answer) {
      setIsCorrect(true)
      setTimeout(() => {
        onSolved()
      }, 1000)
    } else {
      setIsCorrect(false)
      setAttempts((prev) => prev + 1)
      setTimeout(() => {
        setIsCorrect(null)
        setUserAnswer("")
        if (attempts >= 2) {
          generateProblem()
          setAttempts(0)
        }
      }, 1500)
    }
  }

  const getDifficultyColor = () => {
    switch (difficulty) {
      case "easy":
        return isDarkMode ? "from-green-600 to-emerald-600" : "from-green-500 to-emerald-500"
      case "medium":
        return isDarkMode ? "from-yellow-600 to-orange-600" : "from-yellow-500 to-orange-500"
      case "hard":
        return isDarkMode ? "from-red-600 to-pink-600" : "from-red-500 to-pink-500"
    }
  }

  return (
    <div
      className={`p-6 rounded-3xl backdrop-blur-sm border ${
        isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white/70 border-white/50"
      }`}
    >
      <div className="text-center mb-6">
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getDifficultyColor()} text-white text-sm font-medium mb-4`}
        >
          <Calculator className="h-4 w-4" />
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Challenge
        </div>
        <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-white" : "text-slate-800"}`}>
          Solve to dismiss alarm
        </h3>
        <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Attempts: {attempts}/3</p>
      </div>

      <div className="text-center mb-6">
        <div
          className={`text-4xl font-bold mb-4 p-4 rounded-2xl ${
            isDarkMode ? "bg-slate-700/50 text-white" : "bg-gray-100 text-slate-800"
          }`}
        >
          {problem.question} = ?
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Your answer"
              className={`text-center text-2xl h-14 rounded-xl ${
                isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-gray-300"
              } ${
                isCorrect === true
                  ? "border-green-500 bg-green-50"
                  : isCorrect === false
                    ? "border-red-500 bg-red-50"
                    : ""
              }`}
              required
              autoFocus
            />
            {isCorrect === true && (
              <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-green-500" />
            )}
            {isCorrect === false && (
              <XCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-red-500" />
            )}
          </div>

          <Button
            type="submit"
            disabled={!userAnswer || isCorrect === true}
            className={`w-full h-12 rounded-xl font-semibold ${
              isCorrect === true
                ? "bg-green-500 hover:bg-green-600"
                : isCorrect === false
                  ? "bg-red-500 hover:bg-red-600"
                  : isDarkMode
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            } text-white transition-all duration-300`}
          >
            {isCorrect === true ? "Correct! 🎉" : isCorrect === false ? "Try Again 😅" : "Submit Answer"}
          </Button>
        </form>

        {attempts >= 2 && (
          <Button
            onClick={generateProblem}
            variant="outline"
            className={`mt-3 ${isDarkMode ? "border-slate-600 text-slate-300" : "border-gray-300"}`}
          >
            New Problem
          </Button>
        )}
      </div>

      {isCorrect === true && (
        <div className="text-center">
          <div className="text-6xl mb-2">🎉</div>
          <p className={`text-lg font-semibold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
            Great job! Alarm dismissed!
          </p>
        </div>
      )}
    </div>
  )
}
