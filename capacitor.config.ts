import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.dreamclock.app",
  appName: "Dream Clock",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
      sound: "beep.wav",
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1e293b",
      showSpinner: false,
    },
  },
}

export default config
