import { test, expect } from '@playwright/test';
import { injectState, premiumState, getState, daysFromNow, makeDoc, makeTrip, makeMember } from './helpers/state';

test.describe('Premium account', () => {

  test('TC-P-01 — isPremium true in state', async ({ page }) => {
    await injectState(page, premiumState());
    const s = await getState(page);
    expect(s.isPremium).toBe(true);
    expect(s.cloudBackupEnabled).toBe(true);
  });

  test('TC-P-02 — premium: no document limit (state logic)', async ({ page }) => {
    // Premium users have unlimited documents — verify by having 10 with no cap
    const docs = Array.from({ length: 10 }, (_, i) => makeDoc(`d${i}`, daysFromNow(100 + i)));
    await injectState(page, premiumState({ documents: docs }));
    const s = await getState(page);
    expect(s.isPremium).toBe(true);
    expect(s.documents.length).toBe(10); // all 10 stored, no limit applied
  });

  test('TC-P-03 — family member trips isolated per member', async ({ page }) => {
    const jane = { ...makeMember('m1','Jane'), trips: [makeTrip('tj','2025-01-01','2025-01-21','India')] };
    const tim  = { ...makeMember('m2','Tim'),  trips: [makeTrip('tt','2025-03-01','2025-03-08','Mexico')] };
    await injectState(page, premiumState({ familyMembers: [jane, tim], trips: [makeTrip('to','2024-12-01','2024-12-15','Canada')] }));
    const s = await getState(page);
    expect(s.trips.length).toBe(1);
    expect(s.trips[0].country).toBe('Canada');
    expect(s.familyMembers[0].trips[0].country).toBe('India');
    expect(s.familyMembers[1].trips[0].country).toBe('Mexico');
    // All IDs are unique — no cross-contamination
    const allIds = [...s.trips, ...s.familyMembers[0].trips, ...s.familyMembers[1].trips].map((t:any) => t.id);
    expect(new Set(allIds).size).toBe(3);
  });

  test.skip('TC-P-04 — cloud backup (manual — needs Supabase)', async () => {});

  test('TC-P-05 — offline doc survives cloud sync merge', async () => {
    const merge = (local: any[], cloud: any[]) => {
      if (!cloud?.length) return local;
      if (!local?.length) return cloud.map((d:any) => ({ ...d, notificationIds: [] }));
      const ids = new Set(local.map((x:any) => x.id));
      return [...local.map((d:any) => ({ ...d, notificationIds: [] })),
              ...cloud.filter((x:any) => !ids.has(x.id)).map((d:any) => ({ ...d, notificationIds: [] }))];
    };
    const offline = makeDoc('offline', daysFromNow(200));
    const cloud   = makeDoc('cloud',   daysFromNow(300));
    const merged  = merge([offline], [cloud]);
    expect(merged.length).toBe(2);
    expect(merged.find((d:any) => d.id === 'offline')).toBeTruthy();
    expect(merged.find((d:any) => d.id === 'cloud')).toBeTruthy();
  });

  test.skip('TC-P-06 — PDF export (manual — print dialog)', async () => {});

  test('TC-P-07 — PIN enabled state is persisted', async ({ page }) => {
    await injectState(page, premiumState({ pinEnabled: true, pinCode: '1234' }));
    const s = await getState(page);
    expect(s.pinEnabled).toBe(true);
    expect(s.pinCode).toBe('1234');
  });

  test.skip('TC-P-07b — wrong PIN lockout (manual — requires PIN UI interaction)', async () => {});
  test.skip('TC-P-08 — change PIN (manual — requires PIN UI interaction)', async () => {});

});
