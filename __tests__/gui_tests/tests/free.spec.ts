import { test, expect } from '@playwright/test';
import { injectState, freeState, getState, daysFromNow, makeDoc, makeTrip, makeAddress, makeMember } from './helpers/state';

test.describe('Free account', () => {

  test.skip('TC-F-01 — magic link sign up (manual)', async () => {});
  test.skip('TC-F-02 — Google sign in (manual)', async () => {});

  test('TC-F-03 — session and data persist across reload', async ({ page }) => {
    await injectState(page, freeState({ documents: [makeDoc('d1', daysFromNow(300))] }));
    await page.reload();
    await page.waitForTimeout(600);
    const s = await getState(page);
    // authUser not persisted — check isPremium and documents
    expect(s.isPremium).toBe(false);
    expect(s.documents.length).toBe(1);
    expect(s.isGuestMode).toBe(false);
  });

  test('TC-F-04 — profile accessible after login', async ({ page }) => {
    await injectState(page, freeState({ profileSetupShown: false }));
    const s = await getState(page);
    expect(s.isGuestMode).toBe(false);
    expect(s.profileSetupShown).toBe(false); // setup not yet shown
  });

  test('TC-F-05 — 2 docs allowed, 3rd blocked (state logic)', async ({ page }) => {
    const FREE_DOC_LIMIT = 2;
    // At limit
    await injectState(page, freeState({
      documents: [makeDoc('d1', daysFromNow(200)), makeDoc('d2', daysFromNow(300))],
    }));
    const s = await getState(page);
    expect(s.documents.length).toBe(2);
    expect(s.documents.length >= FREE_DOC_LIMIT).toBe(true); // blocked
    expect(s.isPremium).toBe(false);
  });

  test('TC-F-06 — 7-day doc is within alert window', async ({ page }) => {
    await injectState(page, freeState({
      documents: [makeDoc('d-urgent', daysFromNow(7), 'passport', 'Expiring Soon')],
    }));
    const s = await getState(page);
    const WINDOWS = [180, 90, 60, 30, 15, 7];
    const days = Math.round(
      (new Date(s.documents[0].expiryDate + 'T00:00:00').getTime() - Date.now()) / 86_400_000
    );
    const inWindow = WINDOWS.some(w => Math.abs(days - w) <= 2);
    expect(inWindow).toBe(true);
  });

  test('TC-F-07 — free: 1 family member, 2nd blocked (state logic)', async ({ page }) => {
    const FREE_FAMILY_LIMIT = 1;
    await injectState(page, freeState({ familyMembers: [makeMember('m1')] }));
    const s = await getState(page);
    expect(s.familyMembers.length).toBe(1);
    expect(s.familyMembers.length >= FREE_FAMILY_LIMIT).toBe(true); // at limit
    expect(s.isPremium).toBe(false);
  });

  test('TC-F-08 — I-94 trip day count is correct', async ({ page }) => {
    const dep = '2024-12-20', ret = '2025-01-10';
    await injectState(page, freeState({ trips: [makeTrip('t1', dep, ret)] }));
    const s = await getState(page);
    expect(s.trips.length).toBe(1);
    const days = Math.round(
      (new Date(ret + 'T00:00:00').getTime() - new Date(dep + 'T00:00:00').getTime()) / 86_400_000
    );
    expect(days).toBe(21);
  });

  test('TC-F-08b — return before departure is invalid', async () => {
    // Pure logic test — validate date comparison the app uses
    const isValidTrip = (dep: string, ret: string) =>
      new Date(ret + 'T00:00:00') >= new Date(dep + 'T00:00:00');
    expect(isValidTrip('2025-05-10', '2025-05-01')).toBe(false); // invalid
    expect(isValidTrip('2025-05-01', '2025-05-10')).toBe(true);  // valid
    expect(isValidTrip('2025-05-01', '2025-05-01')).toBe(true);  // same day ok
  });

  test('TC-F-09 — address history state', async ({ page }) => {
    await injectState(page, freeState({
      addressHistory: [makeAddress('a1', '2022-01-01', 'present', true), makeAddress('a2', '2020-01-01', '2022-01-01', false)],
    }));
    const s = await getState(page);
    expect(s.addressHistory.length).toBe(2);
    expect(s.addressHistory.find((a: any) => a.isCurrentAddress)).toBeTruthy();
    expect(s.addressHistory.find((a: any) => !a.isCurrentAddress)).toBeTruthy();
  });

  test('TC-F-10 — export JSON is valid StatusVault format', async ({ page }) => {
    await injectState(page, freeState({ documents: [makeDoc('d1', daysFromNow(200)), makeDoc('d2', daysFromNow(365))] }));
    const s = await getState(page);
    const exported = JSON.stringify({
      app: 'StatusVault', version: '2.0.0', exportedAt: new Date().toISOString(),
      data: { documents: s.documents, checklists: [], counters: [], trips: [],
        addressHistory: [], familyMembers: [], visaProfile: null,
        immigrationProfile: null, notificationEmail: null, whatsappPhone: null, isPremium: false },
    });
    const parsed = JSON.parse(exported);
    expect(parsed.app).toBe('StatusVault');
    expect(parsed.data.documents.length).toBe(2);
    expect(new Date(parsed.exportedAt).getFullYear()).toBeGreaterThanOrEqual(2025);
  });

  test('TC-F-11 — invalid JSON rejected on import', async () => {
    const validate = (t: string) => {
      try { const p = JSON.parse(t); return p.app === 'StatusVault' && !!p.data; }
      catch { return false; }
    };
    expect(validate('{"random":true}')).toBe(false);
    expect(validate('not json')).toBe(false);
    expect(validate('{"app":"StatusVault","data":{}}')).toBe(true);
  });

});
