"use client"

import { useEffect, useRef } from "react"

interface AudioManagerProps {
  customAudioFiles: { [key: string]: string }
}

// Enhanced predefined sounds with distinct audio characteristics
const PREDEFINED_SOUNDS = {
  "Gentle Wake": {
    type: "gentle",
    frequencies: [440, 554, 659, 880],
    pattern: [0.3, 0.5, 0.7, 0.9, 0.7, 0.5, 0.3],
    waveType: "sine" as OscillatorType,
    tempo: 800,
  },
  "Morning Birds": {
    type: "birds",
    frequencies: [800, 1200, 600, 1000, 1400],
    pattern: [0.2, 0.8, 0.1, 0.6, 0.3, 0.9, 0.1, 0.4],
    waveType: "sine" as OscillatorType,
    tempo: 300,
  },
  "Digital Beep": {
    type: "digital",
    frequencies: [1000, 1000, 1000],
    pattern: [1, 0, 1, 0, 1, 0, 1],
    waveType: "square" as OscillatorType,
    tempo: 500,
  },
  "Rooster Call": {
    type: "rooster",
    frequencies: [300, 600, 400, 800, 500, 700],
    pattern: [0.1, 0.9, 0.3, 0.7, 0.5, 0.8, 0.2, 0.6],
    waveType: "sawtooth" as OscillatorType,
    tempo: 400,
  },
  "Hen Cluck": {
    type: "hen",
    frequencies: [200, 400, 300, 250],
    pattern: [0.8, 0.2, 0.6, 0.1, 0.4, 0.3, 0.7, 0.2],
    waveType: "triangle" as OscillatorType,
    tempo: 200,
  },
  "Cat Meow": {
    type: "cat",
    frequencies: [400, 800, 600, 1000, 500, 900],
    pattern: [0.1, 0.8, 0.3, 0.9, 0.2, 0.6, 0.1, 0.5],
    waveType: "triangle" as OscillatorType,
    tempo: 600,
  },
  "Ocean Waves": {
    type: "ocean",
    frequencies: [100, 150, 200, 120, 180],
    pattern: [0.3, 0.6, 0.9, 0.6, 0.3, 0.5, 0.8, 0.4],
    waveType: "sine" as OscillatorType,
    tempo: 1000,
  },
  "Funny Honk": {
    type: "honk",
    frequencies: [200, 300, 250],
    pattern: [1, 0.2, 1, 0.2, 1, 0.5, 0.8],
    waveType: "sawtooth" as OscillatorType,
    tempo: 600,
  },
  "Space Alarm": {
    type: "space",
    frequencies: [1200, 800, 1500, 600, 1800, 400],
    pattern: [0.5, 0.8, 0.3, 0.9, 0.4, 0.7, 0.6],
    waveType: "triangle" as OscillatorType,
    tempo: 350,
  },
  "Church Bell": {
    type: "bell",
    frequencies: [523, 659, 784, 1047],
    pattern: [1, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05],
    waveType: "sine" as OscillatorType,
    tempo: 1200,
  },
}

export function AudioManager({ customAudioFiles }: AudioManagerProps) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const oscillatorsRef = useRef<OscillatorNode[]>([])

  useEffect(() => {
    // Initialize AudioContext
    if (typeof window !== "undefined" && !audioContextRef.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        audioContextRef.current = new AudioContext()
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const createRealisticSound = (soundConfig: any, volume = 0.8, gradual = false) => {
    if (!audioContextRef.current) return null

    const audioContext = audioContextRef.current
    const masterGain = audioContext.createGain()
    masterGain.connect(audioContext.destination)

    // Set initial volume
    const initialVolume = gradual ? 0.1 : volume
    masterGain.gain.setValueAtTime(initialVolume, audioContext.currentTime)

    // Gradual volume increase if enabled
    if (gradual) {
      masterGain.gain.exponentialRampToValueAtTime(volume, audioContext.currentTime + 30)
    }

    const oscillators: OscillatorNode[] = []

    // Create multiple oscillators for richer sound
    soundConfig.frequencies.forEach((freq: number, index: number) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      const filterNode = audioContext.createBiquadFilter()

      oscillator.connect(filterNode)
      filterNode.connect(gainNode)
      gainNode.connect(masterGain)

      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
      oscillator.type = soundConfig.waveType

      // Configure filter for different sound types
      switch (soundConfig.type) {
        case "birds":
          filterNode.type = "highpass"
          filterNode.frequency.setValueAtTime(400, audioContext.currentTime)
          break
        case "ocean":
          filterNode.type = "lowpass"
          filterNode.frequency.setValueAtTime(300, audioContext.currentTime)
          break
        case "bell":
          filterNode.type = "peaking"
          filterNode.frequency.setValueAtTime(freq, audioContext.currentTime)
          filterNode.Q.setValueAtTime(10, audioContext.currentTime)
          break
        default:
          filterNode.type = "allpass"
      }

      // Different volume for each frequency component
      const componentVolume = 1 / soundConfig.frequencies.length
      gainNode.gain.setValueAtTime(componentVolume, audioContext.currentTime)

      // Add frequency modulation for realistic sounds
      if (soundConfig.type === "cat") {
        // Cat meow frequency sweep
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, audioContext.currentTime + 0.3)
        oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, audioContext.currentTime + 0.6)
        oscillator.frequency.exponentialRampToValueAtTime(freq, audioContext.currentTime + 1)
      } else if (soundConfig.type === "rooster") {
        // Rooster call pattern
        oscillator.frequency.setValueAtTime(freq * 0.8, audioContext.currentTime + 0.1)
        oscillator.frequency.exponentialRampToValueAtTime(freq * 2, audioContext.currentTime + 0.5)
        oscillator.frequency.exponentialRampToValueAtTime(freq, audioContext.currentTime + 1.2)
      } else if (soundConfig.type === "hen") {
        // Quick cluck pattern
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(freq * 1.5, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + 0.2)
      } else if (soundConfig.type === "birds") {
        // Bird chirp variations
        const chirpTime = audioContext.currentTime + index * 0.1
        oscillator.frequency.setValueAtTime(freq, chirpTime)
        oscillator.frequency.exponentialRampToValueAtTime(freq * 1.8, chirpTime + 0.15)
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.7, chirpTime + 0.3)
      } else if (soundConfig.type === "space") {
        // Space-like frequency sweeps
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
        oscillator.frequency.exponentialRampToValueAtTime(freq * 0.3, audioContext.currentTime + 0.8)
        oscillator.frequency.exponentialRampToValueAtTime(freq * 2.5, audioContext.currentTime + 1.6)
      }

      oscillator.start()
      oscillators.push(oscillator)
    })

    oscillatorsRef.current = oscillators

    // Create pattern effect with configurable tempo
    let patternIndex = 0
    const patternInterval = setInterval(() => {
      if (patternIndex < soundConfig.pattern.length && audioContext.state === "running") {
        const patternVolume = soundConfig.pattern[patternIndex] * volume
        masterGain.gain.setValueAtTime(patternVolume, audioContext.currentTime)
        patternIndex++
      } else {
        patternIndex = 0
      }
    }, soundConfig.tempo || 300)

    return {
      stop: () => {
        clearInterval(patternInterval)
        oscillators.forEach((osc) => {
          try {
            osc.stop()
            osc.disconnect()
          } catch (e) {
            // Oscillator might already be stopped
          }
        })
        oscillatorsRef.current = []
      },
      setVolume: (newVolume: number) => {
        if (masterGain) {
          masterGain.gain.setValueAtTime(newVolume, audioContext.currentTime)
        }
      },
    }
  }

  const playPredefinedSound = (soundName: string, volume = 0.8, gradual = false) => {
    const sound = PREDEFINED_SOUNDS[soundName as keyof typeof PREDEFINED_SOUNDS]
    if (!sound) return null

    return createRealisticSound(sound, volume, gradual)
  }

  const playCustomSound = (audioUrl: string, volume = 0.8, gradual = false) => {
    const audio = new Audio(audioUrl)
    audio.loop = true
    audio.volume = gradual ? 0.1 : volume

    // Gradual volume increase if enabled
    if (gradual) {
      const fadeInterval = setInterval(() => {
        if (audio.volume < volume) {
          audio.volume = Math.min(audio.volume + 0.02, volume)
        } else {
          clearInterval(fadeInterval)
        }
      }, 1000)
    }

    audio.play().catch((error) => {
      console.error("Error playing custom audio:", error)
    })

    currentAudioRef.current = audio

    return {
      stop: () => {
        audio.pause()
        audio.currentTime = 0
        currentAudioRef.current = null
      },
      setVolume: (newVolume: number) => {
        audio.volume = newVolume
      },
    }
  }

  const stopAllAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }

    oscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop()
        osc.disconnect()
      } catch (e) {
        // Oscillator might already be stopped
      }
    })
    oscillatorsRef.current = []
  }

  // Expose methods globally for use by other components
  useEffect(() => {
    ;(window as any).audioManager = {
      playPredefinedSound,
      playCustomSound,
      stopAllAudio,
      getPredefinedSounds: () => Object.keys(PREDEFINED_SOUNDS),
    }
  }, [])

  return null
}
