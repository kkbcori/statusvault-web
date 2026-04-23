# StatusVault — Pre-Release Smoke Test Guide

**Purpose:** Catch regressions in critical flows before every release.
**Time required:** ~15 minutes
**Where to run:** statusvault.org (web) — repeat key sections on iOS/Android if mobile build is included in the release.

---

## How to use this doc

Each section is a single test scenario. Follow the steps in order, top to bottom — each one builds on the state from the previous step. If any **Expected** line doesn't match what you see, the release is **NOT** ready to ship.

Mark each box with ✅ pass / ❌ fail / ⏭ skipped (with reason).

Before starting:
- Open an **Incognito / Private browser window**. (StatusVault uses localStorage and Supabase auth; a fresh session is essential for guest-mode tests.)
- Have one **Google account ready for OAuth login** plus one **email address you can receive mail at** for magic-link testing.
- Have **DevTools console open** (Cmd/Ctrl+Shift+J) — keep an eye on it for red errors throughout.

---

## Section 1 — Cold start & welcome flow (~1 min)

| # | Step | Expected | Pass? |
|---|---|---|---|
| 1.1 | Navigate to https://www.statusvault.org in incognito | Loading splash with shield logo + "StatusVault" wordmark briefly visible, then Welcome modal appears | ☐ |
| 1.2 | Welcome modal shows three options | "Continue as Guest", "Sign in with Google", "Sign in with magic link" all visible and tappable | ☐ |
| 1.3 | Browser tab title and favicon | Tab title says "StatusVault — Visa Tracker Dashboard"; favicon is the shield logo on dark navy (not a generic globe) | ☐ |
| 1.4 | DevTools console | No red errors on page load (warnings about `useNativeDriver` and `expo-notifications` are expected and OK) | ☐ |

---

## Section 2 — Guest mode tier limits (~3 min)

This section verifies guest-mode caps everything at 1 entry and routes users to the account-creation prompt when they hit the limit.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 2.1 | Click **"Continue as Guest"** | Dashboard appears. Top-right shows "Guest" badge or similar | ☐ |
| 2.2 | Go to **Documents** → **+ Add** → pick any template (e.g. "Passport") → set future expiry → **Save** | Document appears in the list. Counter shows "1 of 1 (guest)" | ☐ |
| 2.3 | Click **+ Add** again | Account-creation modal appears: "Create a free account to track up to 2 documents" — **the empty document form does NOT open** | ☐ |
| 2.4 | Dismiss that modal. Go to **Checklist** → **+ Add** → pick any template → **Save** | Checklist added; "1 of 1" indicator | ☐ |
| 2.5 | Click **+ Add** on Checklist again | Account-creation modal appears, NOT the picker | ☐ |
| 2.6 | Dismiss. Go to **Timers** → **+ Add** → pick a counter (e.g. "OPT Unemployment") → **Save** | Counter added | ☐ |
| 2.7 | Click **+ Add** on Timers again | Account-creation modal appears | ☐ |
| 2.8 | Dismiss. Go to **Travel** → **+ Trip** → fill country, dates → **Save** | Trip appears | ☐ |
| 2.9 | Click **+ Trip** again | Account-creation modal appears, NOT the empty trip form | ☐ |
| 2.10 | Dismiss. On Travel screen, click **+ Add Address** → fill street/city/dates → **Save** | Address appears | ☐ |
| 2.11 | Click **+ Add Address** again | Account-creation modal appears, NOT the empty address form | ☐ |
| 2.12 | Try to navigate to **Family** | Either tab is hidden, or an explainer says "Family tracking requires a free account" | ☐ |

**Critical**: in 2.3, 2.5, 2.7, 2.9, 2.11 the empty form must NOT open. If a form opens for a guest at the limit, that's a bug.

---

## Section 3 — Sign up + free tier limits (~4 min)

This section moves the guest user to a free account and verifies free-tier caps.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 3.1 | When the account-creation modal is open from Section 2, click **Sign in with magic link** → enter your email → **Send link** | Confirmation: "Check your email for a sign-in link" | ☐ |
| 3.2 | Open the email and click the magic link | Tab opens, lands on Dashboard. **Guest data from Section 2 is preserved** (1 doc, 1 checklist, 1 timer, 1 trip, 1 address visible) | ☐ |
| 3.3 | Documents → **+ Add** → another template → **Save** | Doc count shows "2 of 2 free" | ☐ |
| 3.4 | Documents → **+ Add** again | **Premium paywall** appears (NOT the create-account modal) — pricing shows "$0.49/month or $4.99/year — SAVE 15%" | ☐ |
| 3.5 | Dismiss paywall. Checklist → **+ Add** → pick a different template → **Save** | 2nd checklist added | ☐ |
| 3.6 | Checklist → **+ Add** again | Premium paywall appears | ☐ |
| 3.7 | Timers → **+ Add** another → **Save**, then try **+ Add** a 3rd time | 2nd added; 3rd opens premium paywall | ☐ |
| 3.8 | Travel → **+ Trip** → add 2nd trip | Added | ☐ |
| 3.9 | Travel → **+ Trip** again | Premium paywall appears | ☐ |
| 3.10 | Travel → **+ Add Address** → add 2nd address | Added | ☐ |
| 3.11 | Travel → **+ Add Address** again | Premium paywall appears | ☐ |
| 3.12 | Family → **+ Add Member** → fill name + relation → **Save** | Member added; counter shows "1 of 1 free" | ☐ |
| 3.13 | Family → **+ Add Member** again | Premium paywall appears | ☐ |

**Critical**: 3.4 and onwards must be the **paywall** (with pricing), NOT the create-account modal. Different CTA per tier.

---

## Section 4 — Per-family-member pools (~2 min)

Verifies the rule that "trips and addresses are 2 per person — independent pools per family member."

| # | Step | Expected | Pass? |
|---|---|---|---|
| 4.1 | On Travel screen, find the **family member selector** (dropdown or pill) at the top | Dropdown lists "You" and the family member you added in 3.12 | ☐ |
| 4.2 | Switch to the family member | Trip list and Address list show empty (member starts fresh) | ☐ |
| 4.3 | Click **+ Trip** → fill → **Save** | Member's first trip added (your own 2 trips remain unchanged in the You view) | ☐ |
| 4.4 | Click **+ Trip** again → fill → **Save** | Member's 2nd trip added | ☐ |
| 4.5 | Click **+ Trip** a 3rd time | Premium paywall appears (per-member pool exhausted) | ☐ |
| 4.6 | Switch back to **You** view | You still see your original 2 trips intact, and the family member's trips are NOT mixed in | ☐ |
| 4.7 | Repeat 4.3–4.6 for **+ Add Address** under the family member view | Same independent-pool behavior | ☐ |
| 4.8 | Family screen → expand the family member → **Add Document** → pick template + date → **Save** | Doc added under the member; counter shows "1 of 1 free" | ☐ |
| 4.9 | Try **Add Document** for that member again | Premium paywall appears (free tier = 1 doc per family member) | ☐ |

**Critical**: 4.5 and 4.6 — pool independence is the trickiest tier rule. If switching members shows mixed trips, or the user pool also blocks when a member pool fills, the gating logic is broken.

---

## Section 5 — PDF export gate (~1 min)

Verifies non-premium users CANNOT export PDFs from any flow.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 5.1 | As the still-free user, go to **Settings** → scroll to "PDF Export" section | A locked card with "Premium Feature" banner; **NO** "Export All Documents as PDF" button is enabled | ☐ |
| 5.2 | Travel screen → click **Export** (trip PDF button) | Premium paywall appears immediately; no PDF download starts | ☐ |
| 5.3 | Travel screen → click **Export I-485** (address PDF button) | Premium paywall appears; no PDF download starts | ☐ |
| 5.4 | DevTools → Network tab while attempting any of the above | **No PDF blob is generated.** Should see no PDF-mime POST/download requests | ☐ |

---

## Section 6 — Premium upgrade + cloud-backup opt-in (~2 min)

| # | Step | Expected | Pass? |
|---|---|---|---|
| 6.1 | Open any paywall again. Click "Unlock for Testing" (or whatever the dev-mode unlock label is) | Modal closes; user is now Premium | ☐ |
| 6.2 | **Cloud Backup Opt-in modal appears immediately** | Modal headline "Welcome to Premium ✨ Enable Cloud Backup?" — explains AES-256 encryption — has two buttons: "Enable Encrypted Cloud Backup" and "Keep On-Device Only" | ☐ |
| 6.3 | Click **"Keep On-Device Only"** | Modal closes. Go to **Settings** → "Cloud Backup" toggle is OFF | ☐ |
| 6.4 | Toggle Cloud Backup ON in Settings | Toggle flips to ON; "Last synced" timestamp updates within ~5 sec; no errors in console | ☐ |
| 6.5 | Documents → **+ Add** (try adding a 3rd, 4th, 5th document) | All succeed — no paywall, no limit | ☐ |
| 6.6 | Travel → **+ Trip** (try adding several) | All succeed | ☐ |
| 6.7 | Family → **+ Add Member** (try adding more than 1) | All succeed | ☐ |
| 6.8 | Settings → "Export All Documents as PDF" | A PDF downloads; opening it shows your docs with proper formatting | ☐ |
| 6.9 | Travel → **Export** (trip PDF) | A trip PDF downloads | ☐ |
| 6.10 | Travel → **Export I-485** (address PDF) | An address PDF downloads | ☐ |

---

## Section 7 — Sign-out and Reset all data (~2 min)

This area has had recurring regressions — test thoroughly.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 7.1 | Settings → scroll to bottom → click **Sign Out** | Confirm dialog appears with Cancel + Sign Out buttons | ☐ |
| 7.2 | Click **Sign Out** in the dialog | Page reloads after ~100ms; **Welcome modal appears** showing the three sign-in options. Dashboard does NOT remain visible with empty data. | ☐ |
| 7.3 | Sign back in (magic link or Google) | Dashboard returns. **Premium status is gone** (back to free). Documents/checklists/timers/trips from before are restored from cloud (if you toggled cloud on in 6.4) OR start fresh (if you kept "On-Device Only") | ☐ |
| 7.4 | Settings → **Reset All Data** | Confirm dialog appears | ☐ |
| 7.5 | Click **Reset Everything** in the dialog | Dialog closes. Dashboard immediately shows empty state ("No documents yet" etc.). Auth status is preserved (still signed in). | ☐ |
| 7.6 | Wait ~10 seconds, then refresh the page | Data is still empty (NOT restored from a stale cloud sync). | ☐ |

**Critical**: 7.2 is the regression-prone one. If sign-out leaves you on an empty Dashboard with no Welcome modal, that's a bug. 7.6 checks the cloud-restore race that bit us before.

---

## Section 8 — Visual regression spot-check (~1 min)

Quick eyeball pass — fail any item that's visually broken.

| # | Item | Pass? |
|---|---|---|
| 8.1 | All headers (Dashboard, Settings, Help, etc.) are **dark glass panels** with a thin brand-blue accent stripe — NOT solid bright blue or indigo | ☐ |
| 8.2 | All modals (Profile, Search, Premium, Sign-out confirm, Trip-add, Address-add) have **opaque dark navy bodies** — page content does NOT bleed through | ☐ |
| 8.3 | Date inputs across the app — text is **clearly visible white** on dark; calendar icon at right edge is brand-blue tinted (not a black blob) | ☐ |
| 8.4 | When you click a date input, the popup calendar opens in **dark mode** (white text on dark bg) — not light mode | ☐ |
| 8.5 | Empty states (open a fresh tab/checklist/timer screen) show an **animated icon** (gentle floating + glowing halo) — not pixelated 3D PNGs | ☐ |
| 8.6 | Help → **Featured tips** section shows 3 cards (Renew Early / Mark Deadlines / Prepare Early) with crisp Ionicons in tinted frames | ☐ |
| 8.7 | Settings premium card price reads "**$0.49 /month**" then "**or $4.99/year — SAVE 15%**" — NOT "from $0.49 /year — SAVE 85%" | ☐ |
| 8.8 | Topbar (right side) has the **search icon** but NO sun/moon theme toggle (light theme was removed) | ☐ |

---

## Section 9 — Mobile-only quick check (skip on web-only releases)

Only run on iOS/Android builds via TestFlight or APK.

| # | Step | Expected | Pass? |
|---|---|---|---|
| 9.1 | Cold launch the app | Splash → Welcome modal | ☐ |
| 9.2 | Repeat Sections 2 + 3 (guest → free tier limits) on mobile | Same behaviors as web | ☐ |
| 9.3 | Add a document, set expiry to 7 days from today | After ~1 minute, a local notification fires with the doc name | ☐ |
| 9.4 | Background the app for 10 seconds, return | If PIN is enabled in Settings, PIN lock screen appears on return | ☐ |
| 9.5 | Network — turn off wifi, add a document, turn wifi back on | Document persists locally; sync happens automatically when online | ☐ |

---

## Quick fail summary

If **any** of the following fails, do NOT ship:

- Section 2.3, 2.5, 2.7, 2.9, 2.11 — guest at limit must hit account-creation modal, not the empty form
- Section 3.4 onward — free at limit must hit **paywall**, not account-creation
- Section 4.5, 4.6 — per-member pool isolation
- Section 5 — any PDF export available to non-premium
- Section 6.2 — premium upgrade must trigger cloud backup opt-in modal (defaulting OFF)
- Section 7.2 — sign-out must show Welcome modal after reload
- Section 7.6 — reset must NOT be undone by stale cloud restore

---

## Where bugs live (reference for triage)

| Symptom | Most-likely file |
|---|---|
| Form opens despite limit hit | `src/screens/TravelScreen.tsx` (`enforceLimit`/`openAdd`/`openAddAddr`), `src/screens/DocumentsScreen.tsx` (`openAdd`), `src/screens/ChecklistScreen.tsx`, `src/screens/CounterScreen.tsx` |
| Wrong CTA (paywall for guest, or auth for free) | `src/store/index.ts` (`canAdd*` selectors), screens' `enforceLimit` helper |
| Sign-out leaves blank dashboard | `src/store/index.ts` (`signOut` — must set `hasOnboarded: false`, `showWelcomeModal: true`, clear localStorage `sb-auth-token`) |
| Reset undone by cloud sync | `src/store/index.ts` (`resetAllData` — must `clearTimeout(scheduleSync._t)` then push empty state to cloud) |
| Modal transparent / page bleeds through | Component's `modalSheet`/`panel` style — must be opaque `#0C1A34`, not `'transparent'` or `rgba(255,255,255,0.05)` |
| Date text invisible | `src/screens/TravelScreen.tsx` (`color:'transparent'` on inputs), or App.tsx web CSS for `::-webkit-datetime-edit-*` |
| PDF export accessible to free user | `src/screens/TravelScreen.tsx` (`handleExport`/`handleExportAddressPdf` must check `isPremium`), `src/screens/SettingsScreen.tsx` (PDF section must be inside `!isPremium ? <upgradeCard> : <exportButtons>` branch) |
| Cloud backup auto-on for new premium | `src/store/index.ts` (`setPremium` must set `cloudBackupEnabled: false, showCloudBackupPrompt: true` on first activation) |

---

## Tier limits reference

| Feature | Guest | Free | Premium |
|---|---|---|---|
| Documents (own) | 1 | 2 | unlimited |
| Checklists | 1 | 2 | unlimited |
| Timers | 1 | 2 | unlimited |
| Trips (own) | 1 | 2 | unlimited |
| Addresses (own) | 1 | 2 | unlimited |
| Family members | 0 | 1 | unlimited |
| Trips per family member | n/a | 2 | unlimited |
| Addresses per family member | n/a | 2 | unlimited |
| Documents per family member | n/a | 1 | unlimited |
| PDF export (any kind) | ❌ | ❌ | ✅ |
| Cloud backup | ❌ | ❌ | ✅ (opt-in, off by default) |
| Local notifications | ✅ | ✅ | ✅ |
| Local data persistence | ✅ | ✅ | ✅ |

---

## Maintenance

When tier rules change, update:
1. The constants in `src/store/index.ts` (top of file)
2. The mirror constants in `__tests__/e2e.test.js` (top of file)
3. Both **Section 2/3/4** and the **Tier limits reference** table above

When new screens or modals are added, add a Section 8 visual spot-check item.
When new premium-only features are added, add a Section 5/6 step.

Last updated to reflect: tier-gate-fix + upfront-gate-fix + theme-revert (cloud-backup opt-in feature retained).
