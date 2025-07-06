import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.dreamclock.persistent",
  appName: "Dream Clock",
  webDir: "out",
  server: {
    androidScheme: "https",
    allowNavigation: ["*"],
  },
  android: {
    buildOptions: {
      keystorePath: "keystore.jks",
      keystoreAlias: "dreamclock",
      releaseType: "APK",
    },
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Disable in production
    appendUserAgent: "DreamClockApp/1.0",
    overrideUserAgent: "DreamClockApp/1.0 (Android)",
    backgroundColor: "#6366f1",
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true,
    backgroundColor: "#6366f1",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6366f1",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "small",
      spinnerColor: "#ffffff",
      splashFullScreen: true,
      splashImmersive: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#6366f1",
      sound: "beep.wav",
      requestPermissions: true,
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#6366f1",
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true,
    },
    App: {
      launchUrl: "com.dreamclock.persistent",
    },
  },
}

export default config
