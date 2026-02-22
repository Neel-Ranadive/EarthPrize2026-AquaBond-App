# EarthPrize2026-AquaBond-App

This project contains a React Native / Expo UI that opens the camera, crops a center ROI, and (optionally) decodes the cropped image pixels in-app using @shopify/react-native-skia.

What I added:
- `index.tsx` — camera UI (Expo Camera) + crop flow + attempt to compute average RGB from the cropped image.
- `colorUtils.ts` — `rgbToLab()` and `labToPh()` placeholder.
- `package.json` — minimal dependency manifest (Expo + Skia).

Notes & next steps to run locally (Expo managed):
1. Install dependencies:

```bash
npm install
# or
yarn
```

2. Install Skia (native) and rebuild a dev client if you want in-app pixel decode to work. For Expo-managed projects use EAS / custom dev client:

```bash
npm install @shopify/react-native-skia
# then build a dev client with EAS
# eas build --profile development --platform android
```

EAS / dev client quick steps:

```bash
# install EAS CLI if you don't have it
npm install -g eas-cli
# login and configure project (follow prompts)
eas login
eas build --profile development --platform android
# or for iOS
eas build --profile development --platform ios
# After build, install the generated dev-client on your device to run the local JS bundle with native Skia available.
```

Server upload endpoint:
- The app auto-uploads each successful scan to `http://10.0.2.2:3000/upload` by default (change `SERVER` in `index.tsx` for a device on your LAN). The server saves images into `server/uploads/` and logs metadata to `server/uploads/scans.json`.

Release artifacts & download:
- When you run `eas build` the build output page will contain a downloadable artifact (APK for Android, or an iOS TestFlight link). After a successful build, EAS provides a direct download URL in the build details.
- For Android you can download the APK and install via `adb install <path-to-apk>` or share the APK to testers. For iOS use TestFlight or the EAS-provided distribution.

Installing APK on Android device via adb:

```bash
adb install -r path/to/your-app.apk
```

If you want me to prepare a CI config or GitHub Actions workflow to produce builds automatically, tell me which platform(s) to target and I will add it.


If you don't install Skia, the app still captures and crops images; the in-app pixel-decoding path will be skipped and you'll see a console warning. You can either:
- Use a small backend service to decode the image pixels and return average RGB, or
- Install `@shopify/react-native-skia` and rebuild the app (recommended for on-device decoding).

Also install Async Storage to enable logs persistence:

```bash
npm install @react-native-async-storage/async-storage
```

Calibration and pH mapping:
- The code includes a placeholder `labToPh()` function. You should collect calibration images (bandage with known pH) and train a regression to replace the placeholder mapping.

Server fallback (optional):
- A simple Node server is included in `server/` that decodes images and returns average RGB using `sharp`.
- Start it with:

```bash
cd server
npm install
node index.js
```

Then change the `SERVER` constant in `index.tsx` to point to your machine (use `http://10.0.2.2:3000` for Android emulator, or `http://<your-ip>:3000` for a device on the same LAN).

Calibration dataset generation:
- Use `calibration/generate_dataset.py` to scan `calibration/images/` and produce `calibration/calibration_samples.csv` containing average RGB and Lab for each sample image. Name images with their pH in the filename (e.g. `sample_pH7.0_1.jpg`).


Team:
- Neel - UI
- Nysa - UI
- Joseph - Color Sensor Research and Starting Code
