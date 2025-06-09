# Building Dream Clock Android APK

## Automatic Build with GitHub Actions

1. **Commit the workflow file**: Make sure `.github/workflows/build-apk.yml` is committed to your repository
2. **Push to GitHub**: Push your changes to the main branch
3. **Go to Actions tab**: Visit your repository on GitHub and click the "Actions" tab
4. **Run the workflow**: 
   - Click "Build Android APK" workflow
   - Click "Run workflow" button
   - Select the main branch and click "Run workflow"
5. **Download APK**: Once the build completes, download the APK from the "Artifacts" section

## Manual Build (Local Development)

### Prerequisites
- Node.js 18+
- Java 17+
- Android SDK
- Android Studio (recommended)

### Steps
1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Build the Next.js app:
   \`\`\`bash
   npm run build
   \`\`\`

3. Add Android platform:
   \`\`\`bash
   npx cap add android
   \`\`\`

4. Sync Capacitor:
   \`\`\`bash
   npx cap sync android
   \`\`\`

5. Open in Android Studio:
   \`\`\`bash
   npx cap open android
   \`\`\`

6. Build APK in Android Studio:
   - Go to Build → Build Bundle(s) / APK(s) → Build APK(s)
   - APK will be generated in `android/app/build/outputs/apk/debug/`

## Troubleshooting

- **Gradle build fails**: Make sure you have Java 17 installed
- **Android SDK not found**: Install Android Studio and set ANDROID_HOME environment variable
- **Build tools missing**: Install Android SDK Build Tools via Android Studio SDK Manager

## APK Installation

1. Enable "Unknown Sources" in Android Settings → Security
2. Transfer the APK file to your Android device
3. Tap the APK file to install
4. Grant necessary permissions when prompted
