export interface Alarm {
  id: string
  time: string
  label?: string
  days: string[]
  sound?: string
  vibrate: boolean
  enabled: boolean
  snoozed: boolean
}

export interface AlarmSettings {
  defaultSnoozeTime: number
  vibrationEnabled: boolean
  volume: number
  gradualVolumeIncrease: boolean
  mathChallenge: boolean
  challengeDifficulty: "easy" | "medium" | "hard"
  fadeInDuration: number
}
