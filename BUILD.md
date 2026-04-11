# Point — Build Guide

## Prerequisites

### For Web (Development)
- Node.js 18+ 
- npm 9+

### For Android (Google Play Market)
- Node.js 18+
- Java Development Kit (JDK) 17+
- Android SDK with:
  - SDK Platform 34 (Android 14)
  - Build Tools 34.0.0+
  - Android Emulator (for testing)
- Gradle 7.0+ (included with Android Studio or bundled)

## Development Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

Opens at `http://localhost:5173` with hot module reloading.

### 3. Run Tests
```bash
npm test              # Run once
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

### 4. Build for Web
```bash
npm run build
```

Outputs to `dist/` directory. This build is used for web deployments and Android webDir.

### 5. Lint and Format
```bash
npm run lint                  # Check for issues
npm run format              # Auto-format code
```

## Android Build

### Initial Setup (One-time)

1. **Install Android Tools**
   - Install Android Studio (recommended) or Android SDK CLI
   - Set `ANDROID_HOME` environment variable:
     ```bash
     export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
     export ANDROID_HOME=$HOME/Android/Sdk          # Linux
     export ANDROID_HOME=%APPDATA%\Android\sdk     # Windows
     ```

2. **Initialize Capacitor Android Project**
   ```bash
   npx cap add android
   ```
   This creates the `android/` directory with the native Android project.

3. **Review Capacitor Config**
   - Verify `capacitor.config.ts`:
     - `appId`: `com.pointgame.dots`
     - `appName`: `Точки`
     - `webDir`: `dist` (output of `npm run build`)

### Building for Release

#### Step 1: Build Web App
```bash
npm run build
```

#### Step 2: Sync Web App to Android
```bash
npx cap sync android
```
Copies the built web app (`dist/`) to Android project.

#### Step 3: Build AAB (Android App Bundle)
```bash
npm run build && npx cap sync android
cd android
./gradlew bundleRelease
```

**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

#### Step 4: Sign AAB (Required for Play Store)
Get the signing key from your keystore:
```bash
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore path/to/keystore.jks \
  android/app/build/outputs/bundle/release/app-release.aab \
  alias_name
```

### Building for Testing

#### Option A: APK (Install on Device)
```bash
cd android
./gradlew assembleDebug
```
Output: `android/app/build/outputs/apk/debug/app-debug.apk`

Install on connected device:
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

#### Option B: Run in Emulator
```bash
npx cap run android
```
Runs the app in connected emulator/device with live reload.

## CI/CD Pipeline

### Pull Request Checks
`.github/workflows/ci.yml` runs on every PR:
- TypeScript compilation
- Unit tests
- Build verification

### Release Build
`.github/workflows/release.yml` runs on tag push (e.g., `git tag v1.0.0`):
- All CI checks
- Android SDK setup
- Build AAB
- Upload artifact for Play Store submission

### Trigger Release Build
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Online Multiplayer Server

### Development
```bash
npm run server:dev
```
Starts WebSocket server on `http://localhost:3000`

### Production Deployment
```bash
npm run server:build
node server-dist/server/index.js
```

## Play Store Submission

### Requirements
1. **Signing Certificate**
   - Create keystore (one-time):
     ```bash
     keytool -genkey -v -keystore my-release-key.jks \
       -keyalg RSA -keysize 2048 -validity 10000
     ```
   - Keep private and secure

2. **App Listing**
   - Title: `Точки`
   - Description: Strategy game, capture opponent dots
   - Screenshots (5-8): Gameplay, AI opponent, multiplayer
   - Icon: 512x512 PNG
   - Privacy Policy: Required
   - Content Rating: ESRB

3. **Testing**
   - Internal Testing track (limited testers)
   - Open Testing track (public beta)
   - Production track (full release)

### Submission Steps
1. Upload AAB to Google Play Console
2. Add app details, screenshots, privacy policy
3. Submit for review (typically 1-3 hours)
4. Publish to Production track

## Troubleshooting

### "Cannot find android/gradlew"
- Run `npx cap add android` if not done
- Ensure `android/` is not in `.gitignore` when committed

### "Capacitor sync failed"
- Run `npm run build` first
- Check `capacitor.config.ts` paths
- Clear `android/app/src/main/assets/public/`

### Android build fails
- Update Android SDK: `sdkmanager --update`
- Sync Gradle: `cd android && ./gradlew sync`
- Check Java version: `java -version` should be 17+

### Play Store rejection
- Test privacy policy link
- Ensure all permissions are justified
- Check content rating matches game

## Additional Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Android Studio Setup](https://developer.android.com/studio/install)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
