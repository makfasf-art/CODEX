#!/usr/bin/env bash
# Build debug APK lokal. Butuh: Node 18+, JDK 17, Android SDK (ANDROID_HOME terset).
set -euo pipefail
cd "$(dirname "$0")/.."
npm install
[ -d android ] || npx cap add android
npx @capacitor/assets generate --android --iconBackgroundColor '#000000' --iconBackgroundColorDark '#000000' --splashBackgroundColor '#000000' --splashBackgroundColorDark '#000000'
npx cap sync android
(cd android && chmod +x gradlew && ./gradlew assembleDebug)
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
