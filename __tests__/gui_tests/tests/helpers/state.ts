import { Page } from '@playwright/test';

export const STORE_KEY = 'statusvault-storage';

// ── Date helpers ──────────────────────────────────────────────
export function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
}
export function daysAgo(n: number) { return daysFromNow(-n); }

// ── Data factories ────────────────────────────────────────────
export function makeDoc(id: string, expiry: string, templateId = 'passport', label = 'Test Doc') {
  return { id, templateId, label, category: 'travel', expiryDate: expiry,
    alertDays: [180,90,60,30,15,7], icon: '🛂', notes: '',
    documentNumber: 'A12345', notificationIds: [], createdAt: new Date().toISOString() };
}
export function makeTrip(id: string, dep: string, ret: string, country = 'India') {
  return { id, departureDate: dep, returnDate: ret, country,
    purpose: 'vacation', portOfEntry: 'JFK', notes: '', createdAt: new Date().toISOString() };
}
export function makeAddress(id: string, from: string, to = 'present', isCurrent = true) {
  return { id, street: '100 Main St', city: 'Dallas', state: 'TX',
    zipCode: '75001', country: 'United States', dateFrom: from, dateTo: to,
    isCurrentAddress: isCurrent, createdAt: new Date().toISOString() };
}
export function makeMember(id: string, name = 'Jane Doe') {
  return { id, name, relation: 'spouse', visaType: 'H-4',
    documentIds: [], trips: [], addressHistory: [], createdAt: new Date().toISOString() };
}
export function makeCounter(templateId: string, daysUsed = 0, maxDays = 90, isTracking = false) {
  return { templateId, label: templateId, icon: '⏱️', maxDays,
    warnAt: Math.floor(maxDays*0.7), critAt: Math.floor(maxDays*0.9),
    daysUsed, isTracking, lastIncrementDate: null,
    startDate: daysUsed > 0 ? daysAgo(daysUsed + 5) : null };
}

// ── State builders ────────────────────────────────────────────
// NOTE: authUser is NOT in Zustand partialize — never written to localStorage.
// Tests must NOT assert on authUser from getState(). Use isPremium / isGuestMode instead.
function base(o: any = {}) {
  return {
    _hasHydrated: true, hasOnboarded: true, showWelcomeModal: false,
    isGuestMode: false, isPremium: false, cloudBackupEnabled: false,
    pinEnabled: false, pinCode: null, notificationsEnabled: false,
    profileSetupShown: true, documents: [], checklists: [], counters: [],
    trips: [], addressHistory: [], familyMembers: [], visaProfile: null,
    immigrationProfile: null, notificationEmail: null, whatsappPhone: null,
    lastSyncedAt: null, lastAutoBackupAt: null, notifications: [],
    // authUser intentionally excluded — not in partialize, won't survive reload
    ...o,
  };
}
export const guestState   = (o: any = {}) => base({ isGuestMode: true, ...o });
export const freeState    = (o: any = {}) => base(o);
export const premiumState = (o: any = {}) => base({ isPremium: true, cloudBackupEnabled: true, ...o });

// ── Core helpers ──────────────────────────────────────────────

/** Inject state → reload → wait for hydration.
 *
 * Why waitForLoadState('networkidle') before clearing:
 * DashboardScreen runs autoIncrementCounters() in a useEffect on mount.
 * That calls Zustand set() → persist middleware writes in-memory state back
 * to localStorage. If we clear localStorage BEFORE that write completes,
 * the write happens AFTER our clear and overwrites our inject.
 * Waiting for networkidle ensures all effects have settled first.
 */
export async function injectState(page: Page, state: object) {
  // Ensure page is loaded so we can run evaluate()
  if (page.url() === 'about:blank') {
    await page.goto('/');
  }
  // Wait for all pending React effects and Zustand writes to settle
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(300); // extra buffer for debounced Zustand writes

  // Now clear and write our state — no pending writes will race us
  await page.evaluate(({ key, s }) => {
    localStorage.clear();
    localStorage.setItem(key, JSON.stringify({ state: s, version: 0 }));
  }, { key: STORE_KEY, s: state });

  // Reload so the app hydrates cleanly from our injected state
  await page.reload();

  // Wait for Zustand hydration — 'documents' array is always in partialize
  await page.waitForFunction((k) => {
    try {
      const raw = localStorage.getItem(k);
      return raw ? Array.isArray(JSON.parse(raw)?.state?.documents) : false;
    } catch { return false; }
  }, STORE_KEY, { timeout: 10_000 });
  await page.waitForTimeout(400);
}

/** Wipe all storage — simulates first ever visit */
export async function clearState(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForTimeout(600);
}

/** Read persisted Zustand state from localStorage.
 *  Only returns fields in partialize — authUser is NOT available here. */
export async function getState(page: Page): Promise<any> {
  return page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw).state : {};
  }, STORE_KEY);
}

/**
 * Click a button/touchable by text — handles React Native Web's div-based buttons.
 *
 * RN Web renders TouchableOpacity as <div role="button">. Standard locator.click()
 * sometimes finds the inner text div (not the touchable). This helper:
 *   1. Tries getByRole('button') with text filter
 *   2. Falls back to [role="button"] with hasText filter + force click
 *   3. Last resort: force click the text element itself
 */
export async function clickText(page: Page, text: string | RegExp, opts: { timeout?: number } = {}) {
  const timeout = opts.timeout ?? 10_000;

  // Strategy 1: native role=button
  try {
    const btn = page.getByRole('button', { name: text });
    await btn.first().waitFor({ state: 'visible', timeout: 3000 });
    await btn.first().click({ timeout: 3000 });
    return;
  } catch {}

  // Strategy 2: any element with role=button filtered by text
  try {
    const btn = page.locator('[role="button"]').filter({ hasText: text });
    await btn.first().waitFor({ state: 'visible', timeout });
    await btn.first().click({ force: true });
    return;
  } catch {}

  // Strategy 3: any clickable element with the text (force click)
  const el = typeof text === 'string'
    ? page.locator(`text="${text}"`).first()
    : page.locator('*').filter({ hasText: text }).first();
  await el.waitFor({ state: 'visible', timeout });
  await el.click({ force: true });
}
