# StatusVault — F-1 / OPT Visa Deadline Tracker

> "Never Miss an Immigration Deadline Again."

100% offline. No backend. No internet required. Your data stays on your device.

---

## Architecture Principles

| Requirement | Implementation |
|---|---|
| No backend | AsyncStorage persistence only, zero network calls |
| Cross-platform | Shared codebase, no `Platform.select` splits in business logic |
| iOS porting | Same code runs on both — just `expo start --ios` |
| Dashboard-first | Dashboard is initial tab, severity-driven hero card |
| Dropdown-driven | 30+ pre-built document templates, pick → date → done |
| Smart notifications | Alert windows per document type (H1B=180d, OPT=90d, etc.) |

---

## Quick Start — Run on Your Phone

### Prerequisites
- **Node.js 18+** — https://nodejs.org
- **Expo Go app** on your phone:
  - iPhone: [App Store](https://apps.apple.com/app/expo-go/id982107779)
  - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Step 1: Create the Expo project
```bash
npx create-expo-app StatusVault --template blank-typescript
cd StatusVault
```

### Step 2: Install dependencies
```bash
npx expo install expo-notifications expo-linear-gradient react-native-safe-area-context react-native-screens @react-native-community/datetimepicker @expo/vector-icons
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs @react-native-async-storage/async-storage zustand dayjs
```

### Step 3: Copy the source files
Copy the entire `src/` folder and `App.tsx` from this project into your new project, replacing the generated `App.tsx`.

### Step 4: Create placeholder assets
```bash
mkdir -p assets
# You'll need icon.png (1024x1024), splash.png (1284x2778), 
# adaptive-icon.png (1024x1024), notification-icon.png (96x96)
# For now, use any placeholder PNGs of those sizes
```

### Step 5: Run on your phone
```bash
npx expo start
```
- A QR code appears in your terminal
- **iPhone**: Open Camera app → scan QR → opens in Expo Go
- **Android**: Open Expo Go app → scan QR
- Both phone and computer must be on the **same WiFi network**

### If QR doesn't work (firewall issues):
```bash
npx expo start --tunnel
```
This routes through Expo's servers (one-time, just for the dev connection — the app itself is fully offline).

---

## Folder Structure

```
StatusVault/
├── App.tsx                          # Entry point
├── app.json                         # Expo config (iOS + Android)
├── package.json                     # Dependencies (no backend libs)
├── tsconfig.json
├── babel.config.js
└── src/
    ├── types/
    │   └── index.ts                 # All TypeScript interfaces
    ├── theme/
    │   └── index.ts                 # Colors, spacing, typography, shadows
    ├── store/
    │   └── index.ts                 # Zustand + AsyncStorage persistence
    ├── utils/
    │   ├── dates.ts                 # Date math, urgency logic, deadline generation
    │   ├── notifications.ts         # Local notification scheduling
    │   └── templates.ts             # 30+ document type templates with alert windows
    ├── components/
    │   ├── StatusCard.tsx           # Hero dashboard card
    │   ├── TimelineItem.tsx         # Deadline row
    │   ├── ExpiryCard.tsx           # Document detail card
    │   ├── ProgressBar.tsx          # Reusable progress bar
    │   ├── UnemploymentCounter.tsx  # 90-day OPT tracker
    │   ├── SeveritySummary.tsx      # Urgency breakdown pills
    │   └── index.ts                 # Barrel export
    ├── screens/
    │   ├── OnboardingScreen.tsx     # 3-slide intro
    │   ├── DashboardScreen.tsx      # Main screen — severity dashboard
    │   ├── DocumentsScreen.tsx      # Document list + dropdown add flow
    │   ├── SettingsScreen.tsx       # Settings, premium mock, legal
    │   └── index.ts                 # Barrel export
    └── navigation/
        ├── AppNavigator.tsx         # Stack + Tab navigation
        └── index.ts                 # Barrel export
```

---

## Smart Notification Windows (Per Document Type)

| Document Type | Alert Days Before Expiry |
|---|---|
| H-1B Visa | 180, 90, 60, 30, 7 |
| OPT EAD | 90, 60, 30, 14, 7 |
| STEM OPT Extension | 90, 60, 30, 14, 7 |
| Passport | 180, 90, 30 |
| I-20 Form | 90, 60, 30, 7 |
| Green Card | 180, 90, 30 |
| Travel Signature | 30, 14, 7 |
| I-94 Record | 90, 60, 30, 14, 7 |

All notifications are **local only** — scheduled on-device, no push server needed.

---

## Porting iOS → Android (or vice versa)

**Zero changes required.** The entire codebase is platform-agnostic:

- No `Platform.OS` branching in business logic
- `expo-notifications` handles both APNs (iOS) and FCM (Android) channels
- `@react-native-community/datetimepicker` adapts per platform automatically  
- Navigation, state, and all utilities are 100% shared
- Only visual differences are system-level (tab bar height, status bar)

To build for production:
```bash
# Android APK/AAB
eas build --platform android

# iOS IPA  
eas build --platform ios
```

---

## Monetization (Prepared)

Free tier + premium at $19/year is pre-wired in Settings. To activate:
1. Add `expo-in-app-purchases` or `react-native-purchases` (RevenueCat)
2. Gate premium features behind `useStore().isPremium`
3. The store already has `isPremium` flag persisted

---

## What's NOT in This App (By Design)

- ❌ No backend server
- ❌ No API calls
- ❌ No user accounts / login
- ❌ No cloud sync (Phase 2)
- ❌ No internet dependency
- ❌ No analytics / tracking
- ✅ Everything runs on-device
- ✅ Data persists in AsyncStorage
- ✅ Works in airplane mode
