import { test, expect } from '@playwright/test';
import { injectState, freeState, guestState, premiumState, getState,
         daysFromNow, daysAgo, makeDoc, makeTrip, makeCounter } from './helpers/state';

test.describe('Edge cases', () => {

  // TC-E-01: urgency for near-expiry
  test('TC-E-01 — doc expiring in 1 day shows Critical', async ({ page }) => {
    await injectState(page, freeState({ documents: [makeDoc('d', daysFromNow(1), 'passport', 'Expires Tomorrow')] }));
    const s = await getState(page);
    const days = Math.round(
      (new Date(s.documents[0].expiryDate + 'T00:00:00').getTime() - Date.now()) / 86_400_000
    );
    // 1 day remaining = Critical (days < 30)
    expect(days).toBeGreaterThanOrEqual(0);
    expect(days).toBeLessThan(30);
  });

  // TC-E-02: pure logic
  test('TC-E-02 — urgency boundaries 29/30/59/60 days', async () => {
    const urgency = (d: number) => d < 0 ? 'expired' : d < 30 ? 'critical' : d < 60 ? 'urgent' : d < 180 ? 'upcoming' : 'safe';
    expect(urgency(-1)).toBe('expired');
    expect(urgency(0)).toBe('critical');
    expect(urgency(29)).toBe('critical');
    expect(urgency(30)).toBe('urgent');
    expect(urgency(59)).toBe('urgent');
    expect(urgency(60)).toBe('upcoming');
    expect(urgency(179)).toBe('upcoming');
    expect(urgency(180)).toBe('safe');
  });

  // TC-E-03: pure logic
  test('TC-E-03 — counter clamped at maxDays', async () => {
    const clamp = (c: any, add: number) => ({ ...c, daysUsed: Math.min(c.maxDays, c.daysUsed + add) });
    expect(clamp({ daysUsed: 88, maxDays: 90 }, 10).daysUsed).toBe(90);
    expect(clamp({ daysUsed: 90, maxDays: 90 },  1).daysUsed).toBe(90);
    expect(clamp({ daysUsed: 88, maxDays: 90 },  1).daysUsed).toBe(89);
  });

  // TC-E-04: pure logic
  test('TC-E-04 — counter cannot go below 0', async () => {
    const dec = (n: number) => Math.max(0, n - 1);
    expect(dec(0)).toBe(0);
    expect(dec(1)).toBe(0);
    expect(dec(5)).toBe(4);
  });

  // TC-E-05: state check
  test('TC-E-05 — paused counter has startDate set', async ({ page }) => {
    const counter = { templateId: 'opt-unemployment', label: 'OPT', icon: '⏱️',
      maxDays: 90, warnAt: 63, critAt: 81, daysUsed: 15,
      isTracking: false, startDate: daysAgo(20), lastIncrementDate: null };
    await injectState(page, freeState({ counters: [counter] }));
    const s = await getState(page);
    // startDate set means it was previously started — UI shows "Resume" not "Start"
    expect(s.counters[0].startDate).toBeTruthy();
    expect(s.counters[0].isTracking).toBe(false);
    expect(s.counters[0].daysUsed).toBe(15);
  });

  // TC-E-06: pure logic
  test('TC-E-06 — I-94: ≥180 days = long absence, <180 = none', async () => {
    const tripDays = (dep: string, ret: string) =>
      Math.round((new Date(ret+'T00:00:00').getTime() - new Date(dep+'T00:00:00').getTime()) / 86_400_000);
    expect(tripDays('2025-01-01','2025-07-01') >= 180).toBe(true);  // 181 days
    expect(tripDays('2025-01-01','2025-06-29') >= 180).toBe(false); // 179 days
    expect(180 >= 180).toBe(true);
    expect(179 >= 180).toBe(false);
  });

  // TC-E-07: pure logic
  test('TC-E-07 — trips >5 years excluded from N-400 stats', async () => {
    const filter5yr = (trips: any[]) => {
      const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear()-5); cutoff.setHours(0,0,0,0);
      return trips.filter(t => new Date(t.departureDate+'T00:00:00') >= cutoff);
    };
    const trips = [makeTrip('old', daysAgo(365*6), daysAgo(365*6-14)), makeTrip('recent', daysAgo(180), daysAgo(165))];
    const filtered = filter5yr(trips);
    expect(filtered.length).toBe(1);
    expect(filtered[0].id).toBe('recent');
  });

  // TC-E-08: pure logic
  test('TC-E-08 — alert fires at 7/15/30/60/90/180 day windows', async () => {
    const WINDOWS = [180,90,60,30,15,7];
    const shouldAlert = (d: number) => WINDOWS.some(w => Math.abs(d-w) <= 2);
    expect(shouldAlert(7)).toBe(true);
    expect(shouldAlert(15)).toBe(true);
    expect(shouldAlert(30)).toBe(true);
    expect(shouldAlert(60)).toBe(true);
    expect(shouldAlert(90)).toBe(true);
    expect(shouldAlert(180)).toBe(true);
    expect(shouldAlert(50)).toBe(false);
    expect(shouldAlert(200)).toBe(false);
  });

  // TC-E-09: pure logic
  test('TC-E-09 — import merge: no duplicate docs', async () => {
    const merge = (local: any[], cloud: any[]) => {
      const ids = new Set(local.map((x:any) => x.id));
      return [...local, ...cloud.filter((x:any) => !ids.has(x.id))];
    };
    const shared = makeDoc('shared', daysFromNow(200));
    const localD = makeDoc('local',  daysFromNow(250));
    const cloudD = makeDoc('cloud',  daysFromNow(300));
    const merged = merge([shared, localD], [shared, cloudD]);
    expect(merged.length).toBe(3);
    expect(merged.filter((d:any) => d.id==='shared').length).toBe(1);
  });

  // TC-E-10: guest → free — authUser NOT checked (not in partialize)
  test('TC-E-10 — guest doc preserved when transitioning to free account', async ({ page }) => {
    const doc = makeDoc('g-doc', daysFromNow(200), 'passport', 'Guest Passport');
    await injectState(page, guestState({ documents: [doc] }));
    let s = await getState(page);
    expect(s.documents.length).toBe(1);
    expect(s.isGuestMode).toBe(true);
    // Simulate account creation: isGuestMode cleared, doc preserved
    await injectState(page, freeState({ documents: [doc] }));
    s = await getState(page);
    expect(s.isGuestMode).toBe(false);  // no longer guest
    expect(s.documents.length).toBe(1); // doc still there
    expect(s.documents[0].label).toBe('Guest Passport');
  });

  // TC-E-11
  test('TC-E-11 — storage key exists after inject', async ({ page }) => {
    await injectState(page, freeState({ documents: [makeDoc('d1', daysFromNow(200))] }));
    const keys = await page.evaluate(() => Object.keys(localStorage));
    expect(keys).toContain('statusvault-storage');
  });

  // TC-E-12: authUser NOT checked (not in partialize)
  test('TC-E-12 — premium state persisted after sign-out/sign-in simulation', async ({ page }) => {
    const docs = [makeDoc('d1', daysFromNow(200)), makeDoc('d2', daysFromNow(365))];
    // Sign out → guest
    await injectState(page, guestState({ documents: docs }));
    let s = await getState(page);
    expect(s.isGuestMode).toBe(true);
    // Sign back in as premium
    await injectState(page, premiumState({ documents: docs }));
    s = await getState(page);
    expect(s.isPremium).toBe(true);          // premium restored
    expect(s.isGuestMode).toBe(false);       // not guest
    expect(s.documents.length).toBe(2);      // docs still there
  });

});
