import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.dreamclock.app",
  appName: "Dream Clock",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    },
  },
}

export default config
