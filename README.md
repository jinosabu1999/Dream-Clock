# Dream Clock - Persistent Alarm App

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/jinosabu1999s-projects/v0-alarm-clock)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/uwdhKGPUqoR)
[![Build APK](https://github.com/yourusername/dream-clock/actions/workflows/build-apk.yml/badge.svg)](https://github.com/yourusername/dream-clock/actions/workflows/build-apk.yml)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## 🚀 Features

### ⏰ **Persistent Alarms**
- ✅ Works when app is cleared from recent apps
- ✅ Works when phone is restarted  
- ✅ Works with screen off
- ✅ Works with battery optimization enabled
- ✅ Multiple notification fallbacks
- ✅ Native Android integration

### 📱 **Modern Interface**
- 🎨 Material 3 Design
- 🌙 Dark/Light Mode
- 📊 Real-time status indicators
- 🎵 Custom ringtone support
- 🧮 Math challenge to dismiss alarms

### 🔧 **Additional Tools**
- ⏱️ Stopwatch with lap times
- ⏲️ Timer with presets
- 🌍 World clock
- 📳 Vibration patterns
- 🔊 Volume controls

## 📱 Installation

### Option 1: Download from GitHub Releases
1. Go to [Releases](https://github.com/yourusername/dream-clock/releases)
2. Download the latest APK file
3. Install on your Android device

### Option 2: Build from GitHub Actions
1. Go to [Actions](https://github.com/yourusername/dream-clock/actions)
2. Click on the latest successful build
3. Download the APK from "Artifacts"
4. Install on your Android device

### Option 3: Build Locally
\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/dream-clock.git
cd dream-clock

# Install dependencies
npm install

# Build the web app
npm run build

# Add Android platform
npx cap add android

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# Build APK in Android Studio
\`\`\`

## ⚙️ Setup for Optimal Performance

After installing the APK:

### 1. **Grant Permissions**
- ✅ Notifications
- ✅ Background App Refresh
- ✅ Storage (for custom ringtones)
- ✅ Vibration

### 2. **Disable Battery Optimization**
1. Go to Settings → Battery → Battery Optimization
2. Find "Dream Clock" 
3. Select "Don't optimize"
4. Confirm the change

### 3. **Enable Auto-start (if available)**
1. Go to Settings → Apps → Dream Clock
2. Enable "Auto-start" or "Background activity"
3. This varies by manufacturer (Xiaomi, Huawei, etc.)

### 4. **Lock App in Recent Apps**
1. Open recent apps
2. Find Dream Clock
3. Pull down or long-press to "lock" the app
4. This prevents it from being cleared automatically

## 🧪 Testing Persistent Alarms

To verify alarms work when app is cleared:

1. **Set a test alarm** for 2-3 minutes from now
2. **Clear the app** from recent apps (swipe away)
3. **Wait for the alarm** to trigger
4. **Verify notification** appears with snooze/dismiss buttons

## 🔧 Technical Details

### Architecture
- **Service Worker**: Persistent background processing
- **IndexedDB**: Local alarm storage
- **Native Android Service**: Foreground service for reliability
- **Multiple Fallbacks**: Web + Native + Service Worker notifications

### Permissions Explained
- **WAKE_LOCK**: Prevents device sleep during alarms
- **RECEIVE_BOOT_COMPLETED**: Restart alarms after reboot
- **FOREGROUND_SERVICE**: Keep alarm service active
- **SCHEDULE_EXACT_ALARM**: Precise alarm timing
- **REQUEST_IGNORE_BATTERY_OPTIMIZATIONS**: Bypass power management

### Supported Android Versions
- **Minimum**: Android 7.0 (API 24)
- **Target**: Android 14 (API 34)
- **Recommended**: Android 8.0+ for best performance

## 🐛 Troubleshooting

### Alarms Not Working?
1. Check notification permissions
2. Disable battery optimization
3. Enable auto-start (manufacturer settings)
4. Keep app locked in recent apps
5. Restart the app after installation

### Build Issues?
1. Ensure Node.js 18+ is installed
2. Ensure Java 17 is installed
3. Update Android SDK to latest
4. Clear npm cache: `npm cache clean --force`

### APK Installation Issues?
1. Enable "Install from Unknown Sources"
2. Check available storage space
3. Disable antivirus temporarily
4. Try installing via ADB: `adb install app-release.apk`

## 📊 GitHub Actions Workflow

The repository includes automated APK building:

- **Triggers**: Push to main, PRs, manual dispatch
- **Outputs**: Debug and Release APKs
- **Artifacts**: Available for 30-90 days
- **Releases**: Automatic releases on main branch

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the APK build
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Capacitor](https://capacitorjs.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Powered by [Next.js](https://nextjs.org/)

---

**⚠️ Important**: For maximum reliability, always disable battery optimization for this app in your Android settings.

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
