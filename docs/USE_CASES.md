# StatusVault — Use Case Testing Document
> Version 1.0 · Generated 2026-04-12
> Covers: Guest Mode, Free Account, Premium, Auth Flows

---

## Tier Matrix

| Feature            | Guest (no account) | Free Account | Premium |
|--------------------|--------------------|--------------|---------|
| Documents          | 1                  | 2            | ∞       |
| Checklists         | 1                  | 2            | ∞       |
| Immi Timers        | 1                  | 2            | ∞       |
| Family Members     | 0                  | 1            | ∞       |
| Family Member Docs | 0                  | 1 per member | ∞       |
| PDF Export         | ✗                  | ✗            | ✓       |
| JSON Export/Import | ✗                  | ✓            | ✓       |
| Upgrade to Premium | ✗ (must create account first) | ✓ | N/A |

---

## UC-AUTH: Authentication Flows

### UC-AUTH-01: First Visit — Welcome Modal
**Trigger:** New user opens app for first time (hasOnboarded = false)  
**Expected:**
- [ ] Welcome modal appears after 1.2s
- [ ] Shows "Continue as Guest" and "Create Free Account" options
- [ ] "100% private · AES-256 · on your device" pill visible
- [ ] Premium teaser row at bottom shows $3.99/yr

### UC-AUTH-02: Continue as Guest
**Steps:** Click "Continue as Guest"  
**Expected:**
- [ ] Modal closes, dashboard shown
- [ ] `isGuestMode = true`, `hasOnboarded = true` persisted
- [ ] Guest banner shows "Guest mode — 1 doc · 1 checklist · 1 timer · no family members"
- [ ] Welcome modal never appears again on refresh

### UC-AUTH-03: Create Free Account → Magic Link
**Steps:** Click "Create Free Account" → enter email → "Send Login Link"  
**Expected:**
- [ ] AuthModal opens with Magic Link tab active
- [ ] "Check your email" screen shows after sending
- [ ] Email arrives with "Sign in to StatusVault →" button
- [ ] Clicking link: "Signing you in..." overlay appears (dark screen)
- [ ] User auto-signed in, overlay disappears, dashboard shown
- [ ] `isGuestMode = false`, `authUser` set
- [ ] Profile setup modal appears ONCE if `immigrationProfile` is null
- [ ] Profile modal does NOT reappear on next visit/refresh

### UC-AUTH-04: Create Free Account → Google OAuth
**Steps:** Click "Create Free Account" → "Continue with Google"  
**Expected:**
- [ ] Google consent screen shows "StatusVault" (not Supabase URL)
- [ ] After auth: user signed in, dashboard shown
- [ ] `isGuestMode = false`

### UC-AUTH-05: Return User — Magic Link Login
**Steps:** Already has account, signed out → click "Sign In / Create Account" in sidebar → Magic Link tab → send link  
**Expected:**
- [ ] Same email/login flow as UC-AUTH-03
- [ ] Existing data restored after sign-in

### UC-AUTH-06: Return User — Password Login
**Steps:** Already set password → Password tab → email + password → Sign In  
**Expected:**
- [ ] Signs in successfully if credentials correct
- [ ] "Incorrect email or password" for wrong credentials
- [ ] "Forgot password? Use magic link instead →" link works

### UC-AUTH-07: Set Password (from Settings)
**Steps:** Signed in → Settings → Account → "Set / Change Password"  
**Expected:**
- [ ] AuthModal opens in set-password mode
- [ ] Requires 8+ characters
- [ ] "Passwords do not match" if confirmPwd wrong
- [ ] Success message on completion
- [ ] Can now login via Password tab

### UC-AUTH-08: Sign Out
**Steps:** Settings → Account → Sign Out  
**Expected:**
- [ ] Confirmation dialog shown
- [ ] After confirm: `authUser = null`, `showWelcomeModal = false`
- [ ] Sidebar shows "Sign In / Create Account" button
- [ ] Dashboard shows guest banner with "Sign In →"
- [ ] Data still visible (persisted locally)

### UC-AUTH-09: Delete Account
**Steps:** Settings → Danger Zone → Delete Account  
**Expected:**
- [ ] Red danger confirmation shown
- [ ] After confirm: all data cleared, signed out
- [ ] Redirects to guest view with welcome modal suppressed

---

## UC-GUEST: Guest Mode Flows

### UC-GUEST-01: Add First Document
**State:** isGuestMode=true, documents=[]  
**Expected:** ✅ Document picker opens → can add → document saved

### UC-GUEST-02: Add Second Document (over limit)
**State:** isGuestMode=true, documents=[1 doc]  
**Expected:** 🔒 AuthModal opens with "Create a free account to track up to 2 documents"  
**NOT Expected:** ❌ Paywall should NOT open

### UC-GUEST-03: Add First Checklist
**State:** isGuestMode=true, checklists=[]  
**Expected:** ✅ Checklist picker opens

### UC-GUEST-04: Add Second Checklist (over limit)
**State:** isGuestMode=true, checklists=[1]  
**Expected:** 🔒 AuthModal — not paywall

### UC-GUEST-05: Add First Timer
**State:** isGuestMode=true, counters=[]  
**Expected:** ✅ Timer picker opens

### UC-GUEST-06: Add Second Timer (over limit)
**State:** isGuestMode=true, counters=[1]  
**Expected:** 🔒 AuthModal — not paywall

### UC-GUEST-07: Access Family Tab
**State:** isGuestMode=true  
**Expected:** 🔒 "Create a free account to add family members" banner/prompt  
**Add member button:** Opens AuthModal, not family form

### UC-GUEST-08: Access Premium / Upgrade
**State:** isGuestMode=true  
**Click sidebar "Upgrade to Premium":**  
**Expected:** 🔒 AuthModal "Create a free account first, then upgrade to Premium"  
**NOT Expected:** ❌ Paywall modal should NOT open

### UC-GUEST-09: Data persists on refresh
**State:** Added 1 doc as guest  
**Expected:** Document still there after page refresh  
**Expected:** `isGuestMode` still true

---

## UC-FREE: Free Account Flows

### UC-FREE-01: Add Documents (under limit)
**State:** authUser set, isGuestMode=false, documents=[0 or 1]  
**Expected:** ✅ Document picker opens for each

### UC-FREE-02: Add Third Document (over limit)
**State:** documents=[2 docs]  
**Expected:** 💎 Paywall opens (not auth modal)

### UC-FREE-03: Add Checklists (under limit)
**State:** checklists=[0 or 1]  
**Expected:** ✅ Opens for each

### UC-FREE-04: Add Third Checklist (over limit)
**State:** checklists=[2]  
**Expected:** 💎 Paywall

### UC-FREE-05: Add Timers (under limit)
**State:** counters=[0 or 1]  
**Expected:** ✅ Opens

### UC-FREE-06: Add Third Timer (over limit)
**State:** counters=[2]  
**Expected:** 💎 Paywall

### UC-FREE-07: Add Family Member (under limit)
**State:** familyMembers=[]  
**Expected:** ✅ Add member form opens

### UC-FREE-08: Add Second Family Member (over limit)
**State:** familyMembers=[1 member]  
**Expected:** 💎 Paywall

### UC-FREE-09: Add Doc to Family Member (under limit)
**State:** family member with 0 docs  
**Expected:** ✅ Doc picker opens

### UC-FREE-10: Add Second Doc to Family Member (over limit)
**State:** family member with 1 doc  
**Expected:** 💎 Paywall (opened directly, not navigate away)

### UC-FREE-11: Upgrade to Premium
**Steps:** Sidebar "Upgrade to Premium" or Documents "Upgrade" pill → Paywall opens → Subscribe  
**Expected:** 💎 Paywall shows features, price $3.99/yr  
**After confirm:** `isPremium = true`, all limits removed

### UC-FREE-12: JSON Export/Import
**Steps:** Settings → Cross-Device Sync → Export Data  
**Expected:** JSON file downloads  
**Import:** Restore works, documents/checklists restored

### UC-FREE-13: PDF Export — blocked
**Steps:** Settings → PDF Export section  
**Expected:** Premium lock shown, "Upgrade to Premium" button

---

## UC-PREMIUM: Premium Account Flows

### UC-PREMIUM-01: Unlimited Documents
**State:** isPremium=true  
**Expected:** Can add doc #3, #4, #5... no limit

### UC-PREMIUM-02: Unlimited Checklists
**Expected:** Can add checklist #3, #4... no paywall

### UC-PREMIUM-03: Unlimited Timers
**Expected:** Can add timer #3, #4... no paywall

### UC-PREMIUM-04: Multiple Family Members
**Expected:** Can add family member #2, #3... no paywall

### UC-PREMIUM-05: Multiple Docs per Family Member
**Expected:** Can add doc #2, #3 for each member

### UC-PREMIUM-06: PDF Export Available
**Steps:** Settings → PDF Export  
**Expected:** Export buttons visible and functional (downloads .txt file)

### UC-PREMIUM-07: "Upgrade" button hidden
**Expected:** Sidebar "Upgrade to Premium" row NOT shown when `isPremium=true`  
**Expected:** Documents header "Upgrade" pill NOT shown

---

## UC-DOCS: Document Management

### UC-DOCS-01: Add Document — full flow
**Steps:** Documents → + Add → pick type → set expiry date → (optional) doc number/notes → Save  
**Expected:** Document appears in list with correct severity badge

### UC-DOCS-02: Severity thresholds
| Days remaining | Expected label | Expected color |
|----------------|---------------|----------------|
| < 0            | Expired       | Red            |
| 0–29           | Critical      | Red            |
| 30–59          | High          | Amber          |
| 60–179         | Medium        | Indigo         |
| ≥ 180          | Low           | Green          |

### UC-DOCS-03: Edit Document
**Expected:** Expiry date and notes editable, type and category fixed

### UC-DOCS-04: Delete Document
**Expected:** Confirmation dialog → removes from list → notifications cancelled

### UC-DOCS-05: Notification windows
**Expected:** Notifications scheduled at 180, 90, 60, 30, 15, 7 days before expiry

---

## UC-NAV: Navigation & Layout

### UC-NAV-01: Sidebar items all clickable
**Expected:** Dashboard, Documents, Residency & Travel, Family, Checklist, Timers, Links, Settings, Help all navigate correctly

### UC-NAV-02: No scroll in sidebar
**Expected:** All nav items visible without scrolling

### UC-NAV-03: Scrollbar visible on all screens
**Expected:** Right-side scrollbar appears when content overflows on Documents, Family, Checklist, Timers, Settings, Links

### UC-NAV-04: Add Trip modal — no scroll
**Expected:** All fields fit in modal without inner scroll

---

## UC-LINKS: Visa Tools / Links Screen

### UC-LINKS-01: All links are .gov
**Expected:** No commercial (.com non-gov) links visible

### UC-LINKS-02: Links open in browser
**Expected:** Clicking any link opens URL in new tab

### UC-LINKS-03: Monthly link checker
**Expected:** GitHub Action runs on 1st of month, opens Issue if broken links found

