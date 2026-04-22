# StatusVault — Midnight Glass Redesign

Complete visual redesign of the StatusVault app from light-SaaS (indigo on white) to **Midnight Glass** (dark glassmorphic UI with StatusVault brand colors: blue `#3B8BE8`, green `#4CD98A`, gold `#F5C053`).

## What's in this package

| Area | Files | Approach |
|---|---|---|
| **Foundation** | `src/theme/index.ts`, `App.tsx`, `src/components/ScreenBackground.tsx`, `src/components/LogoMark.tsx` | Full rewrite |
| **Shell** | `src/navigation/AppNavigator.tsx`, `src/navigation/StandaloneTabBar.tsx`, `src/navigation/MobileTabBar.tsx` | Full rewrite |
| **Modals (first-impression)** | `src/components/WelcomeModal.tsx`, `src/components/AuthModal.tsx` | Full rewrite |
| **Showcase screens** | `src/screens/DashboardScreen.tsx`, `ContactScreen.tsx`, `OnboardingScreen.tsx`, `VisaToolsScreen.tsx`, `ChecklistScreen.tsx`, `CounterScreen.tsx` | Full rewrite |
| **Remaining screens + components** | 8 screens + 12 components | Targeted hex-literal substitutions (~585 replacements total) with precise color mapping from light to dark glass |
| **Assets** | `assets/bg-app.png`, `assets/logo-transparent.png`, `assets/logo-white-bg.png` | Fresh assets — logo has true alpha (checker pattern removed) |

## Apply instructions (fresh clone workflow)

Per your workflow preference — clone fresh, overlay these files, commit, push.

```bash
# 1. Fresh clone
git clone https://github.com/kkbcori/statusvault-web.git
cd statusvault-web

# 2. Overlay this package on top
# (extract this zip into the repo root — it will overwrite existing files)
unzip -o /path/to/statusvault-redesign.zip -d .

# 3. Also delete the old bg-dashboard.png (no longer used by DashboardScreen)
#    Note: the new Dashboard uses the global bg-app.png from AppNavigator instead
rm -f assets/bg-dashboard.png

# 4. Smoke test locally
npx expo start --web
```

## Git commit commands

```bash
git add -A

git commit -m "Redesign: Midnight Glass theme

- New dark glassmorphic palette with StatusVault brand colors (blue/green/gold from logo)
- Full rewrite of theme, App shell, AppNavigator, tab bars (web sidebar + mobile pill), LogoMark
- New ScreenBackground component with bg-app.png layered + ambient radial glows
- Fresh Dashboard, Contact, Onboarding, VisaTools, Checklist, Counter screens
- WelcomeModal & AuthModal redesigned for dark theme
- Targeted color substitutions on Auth, Travel, Family, Help, Settings, Profile, Scanner, Processing screens
- Logo true-transparency fixed (checker-pattern baked-in bg removed)
- Dark form inputs with proper color-scheme and autofill styling

Preserves all auth/magic-link/OAuth logic, tier limits, notification IDs,
Zustand persist merge strategy, and Supabase session handling unchanged."

git push origin main
```

## Design reference

- **Color palette** derived from the StatusVault logo (blue shield, green wings, yellow sun) mapped to functional roles:
  - `primary` = brand blue = primary interactive
  - `success` = logo green = valid documents
  - `gold` = logo yellow = premium / warnings
  - `danger` = coral red = critical expiries
- **Typography**: Inter (already loaded). Weight variation + letter-spacing creates distinctive headings without requiring a new display font.
- **Cards**: glassmorphic — `rgba(255,255,255,0.055)` base with `blur(18px)` on web and `1px` white-alpha border.
- **Background**: `bg-app.png` (provided shield composition) layered behind all screens at 30% opacity with a 55% dark scrim, plus ambient blue + green radial glows at the corners.

## Known gaps / follow-ups

- **Paywall modal** still uses the `paywall*` StyleSheet inside `DocumentsScreen.tsx` — most colors were swapped via the StyleSheet rewrite, but a few `LinearGradient colors={[...]}` arrays and a couple of inline icon color props in the JSX still reference the old indigo (`#4F46E5` / `#7C3AED`). See lines 145, 164, 212, 347, 382 of `DocumentsScreen.tsx`.
- The 8 screens that received batch substitutions (Travel, Family, Help, Settings, Profile, Scanner, Processing, Auth) are color-correct but weren't visually audited screen-by-screen — a few spot adjustments may be needed (e.g. some gradient combinations may need tuning for the new palette).
- `ProcessingScreen.tsx`, `ScannerScreen.tsx`, `ProfileScreen.tsx` received substitutions only — they'll render dark but may benefit from a structural refinement pass later.
- No new font was added. Designs using `Inter` with varied weights give the aesthetic room without a new package dependency.

## Logic preserved (verified by file-by-file review)

- Supabase auth (magic link implicit flow + PKCE + OAuth) — **unchanged**
- `SUPABASE_SESSION_KEY` constant moved into `AppNavigator.tsx` (was imported before) — same string, same check
- Tier-limit guards (`canAddDocument`, `canAddChecklist`, `canAddCounter`) — **unchanged**
- Notification ID stripping and auto-backup debounce — **unchanged** (never touched store)
- Welcome modal suppression logic for pre-existing sessions — **unchanged**
- Magic-link redirect handling — **unchanged**
- PIN lock / re-lock on foreground — **unchanged**

No changes made to `src/store/`, `src/utils/`, `src/types/`, or any supabase / notification wiring.
