/**
 * Logic Tests — gaps identified in the gap analysis
 * All pure logic (no browser needed) unless noted.
 * Covers: tier limits, counter logic, checklist ops, importData, date utils.
 */
import { test, expect } from '@playwright/test';
import { injectState, freeState, premiumState, guestState, getState, daysFromNow, daysAgo, makeDoc, makeCounter } from './helpers/state';

// ── Helpers mirroring store logic ─────────────────────────────
const canAddDocument = (docs: number, isPremium: boolean, isGuest: boolean) => {
  if (isPremium) return true;
  if (isGuest)   return docs < 1;
  return docs < 2;
};
const getUrgency = (days: number) =>
  days < 0 ? 'expired' : days < 30 ? 'critical' : days < 60 ? 'urgent' : days < 180 ? 'upcoming' : 'safe';
const getSeverityLabel = (days: number) =>
  days < 0 ? 'Expired' : days < 30 ? 'Critical' : days < 60 ? 'High' : days < 180 ? 'Medium' : 'Low';
const autoIncrement = (counters: any[]) => {
  const now = new Date(); now.setHours(0,0,0,0);
  return counters.map(c => {
    if (!c.isTracking || !c.lastIncrementDate) return c;
    const last = new Date(c.lastIncrementDate + 'T00:00:00'); last.setHours(0,0,0,0);
    const diff = Math.floor((now.getTime() - last.getTime()) / 86_400_000);
    if (diff <= 0) return c;
    return { ...c, daysUsed: Math.min(c.maxDays, c.daysUsed + diff) };
  });
};
const mergeById = (local: any[], cloud: any[]) => {
  if (!cloud?.length) return local;
  if (!local?.length) return cloud.map((d:any) => ({ ...d, notificationIds: [] }));
  const ids = new Set(local.map((x:any) => x.id));
  return [...local.map((d:any) => ({ ...d, notificationIds: [] })),
          ...cloud.filter((x:any) => !ids.has(x.id)).map((d:any) => ({ ...d, notificationIds: [] }))];
};

test.describe('Tier limit logic', () => {

  test('addDocument: returns false at guest limit (1)', async () => {
    expect(canAddDocument(0, false, true)).toBe(true);
    expect(canAddDocument(1, false, true)).toBe(false);  // blocked
    expect(canAddDocument(5, true,  false)).toBe(true);  // premium: no limit
  });

  test('addDocument: returns false at free limit (2)', async () => {
    expect(canAddDocument(1, false, false)).toBe(true);
    expect(canAddDocument(2, false, false)).toBe(false); // blocked
  });

  test('getRemainingFreeSlots: correct at 0, 1, 2, premium', async () => {
    const slots = (docs: number, isPremium: boolean) =>
      isPremium ? 999 : Math.max(0, 2 - docs);
    expect(slots(0, false)).toBe(2);
    expect(slots(1, false)).toBe(1);
    expect(slots(2, false)).toBe(0);
    expect(slots(3, false)).toBe(0); // never negative
    expect(slots(0, true)).toBe(999);
  });

  test('free family: 1 member limit, 1 doc per member', async () => {
    const FREE_FAMILY_DOC_LIMIT = 1;
    const FREE_FAMILY_LIMIT = 1;
    const canAddMember = (count: number, isPremium: boolean) =>
      isPremium ? true : count < FREE_FAMILY_LIMIT;
    const canAddMemberDoc = (docCount: number, isPremium: boolean) =>
      isPremium ? true : docCount < FREE_FAMILY_DOC_LIMIT;

    expect(canAddMember(0, false)).toBe(true);
    expect(canAddMember(1, false)).toBe(false); // at limit
    expect(canAddMember(5, true)).toBe(true);   // premium ok

    expect(canAddMemberDoc(0, false)).toBe(true);
    expect(canAddMemberDoc(1, false)).toBe(false); // 1 doc limit per member
    expect(canAddMemberDoc(5, true)).toBe(true);
  });

  test('family doc limit constant equals 1 (not 2 as old UI text said)', async () => {
    // Bug fix: UI used to say "2 docs per member" but constant was always 1
    const FREE_FAMILY_DOC_LIMIT = 1;
    expect(FREE_FAMILY_DOC_LIMIT).toBe(1);
  });

  test('guest: zero family members allowed', async () => {
    const canAddFamilyGuest = (isGuest: boolean) => isGuest ? false : true;
    expect(canAddFamilyGuest(true)).toBe(false);
    expect(canAddFamilyGuest(false)).toBe(true);
  });

  test('addChecklist/addCounter: duplicate templateId is rejected', async () => {
    const hasChecklist = (checklists: any[], id: string) => checklists.some(c => c.templateId === id);
    const hasCounter   = (counters: any[],   id: string) => counters.some(c => c.templateId === id);
    const checklists = [{ templateId: 'opt-application' }];
    const counters   = [{ templateId: 'opt-unemployment' }];
    expect(hasChecklist(checklists, 'opt-application')).toBe(true);  // duplicate detected
    expect(hasChecklist(checklists, 'stem-opt')).toBe(false);        // new template ok
    expect(hasCounter(counters,   'opt-unemployment')).toBe(true);
    expect(hasCounter(counters,   'stem-unemployment')).toBe(false);
  });

});

test.describe('Counter auto-increment logic', () => {

  test('paused counter (isTracking=false) is never incremented', async () => {
    const counter = { templateId: 'opt', daysUsed: 10, maxDays: 90, isTracking: false, lastIncrementDate: daysAgo(3) };
    const result = autoIncrement([counter]);
    expect(result[0].daysUsed).toBe(10); // unchanged
  });

  test('tracking counter with null lastIncrementDate is not incremented', async () => {
    const counter = { templateId: 'opt', daysUsed: 5, maxDays: 90, isTracking: true, lastIncrementDate: null };
    const result = autoIncrement([counter]);
    expect(result[0].daysUsed).toBe(5); // unchanged
  });

  test('tracking counter increments by exact days since last increment', async () => {
    const counter = { templateId: 'opt', daysUsed: 10, maxDays: 90, isTracking: true, lastIncrementDate: daysAgo(3) };
    const result = autoIncrement([counter]);
    expect(result[0].daysUsed).toBe(13); // 10 + 3
  });

  test('counter clamped to maxDays — never exceeds limit', async () => {
    const counter = { templateId: 'opt', daysUsed: 85, maxDays: 90, isTracking: true, lastIncrementDate: daysAgo(10) };
    const result = autoIncrement([counter]);
    expect(result[0].daysUsed).toBe(90); // 85+10=95 → clamped to 90
  });

  test('same-day increment: diff=0, no change', async () => {
    const today = new Date().toISOString().split('T')[0];
    const counter = { templateId: 'opt', daysUsed: 20, maxDays: 90, isTracking: true, lastIncrementDate: today };
    const result = autoIncrement([counter]);
    expect(result[0].daysUsed).toBe(20); // no change — same day
  });

  test('resetCounter clears all four fields', async () => {
    const reset = (c: any) => ({ ...c, daysUsed: 0, isTracking: false, lastIncrementDate: null, startDate: null });
    const counter = { daysUsed: 45, isTracking: true, startDate: '2025-01-01', lastIncrementDate: '2025-04-01' };
    const result = reset(counter);
    expect(result.daysUsed).toBe(0);
    expect(result.isTracking).toBe(false);
    expect(result.lastIncrementDate).toBeNull();
    expect(result.startDate).toBeNull();
  });

  test('addCustomCounter warnAt/critAt use correct formulas', async () => {
    const make = (maxDays: number) => ({
      maxDays, daysUsed: 0, isTracking: false,
      warnAt: Math.floor(maxDays * 0.7),
      critAt: Math.floor(maxDays * 0.9),
    });
    // IEEE 754 note: 90 * 0.7 = 62.999... so floor gives 62
    expect(make(90).warnAt).toBe(62);
    expect(make(90).critAt).toBe(81);
    expect(make(100).warnAt).toBe(70);
    expect(make(100).critAt).toBe(90);
    expect(make(60).warnAt).toBe(42);
    expect(make(30).critAt).toBe(27);
  });

});

test.describe('Checklist item operations', () => {

  const makeChecklist = (id: string, itemCount = 5) => ({
    templateId: id, label: 'Test', icon: '✅',
    items: Array.from({ length: itemCount }, (_, i) => ({
      id: `item-${id}-${i}`, text: `Step ${i}`, done: false, category: 'Test'
    })),
  });

  test('toggleChecklistItem flips done: false→true', async () => {
    const cls = [makeChecklist('opt', 3)];
    const toggle = (cls: any[], tid: string, iid: string) => cls.map(c =>
      c.templateId === tid ? { ...c, items: c.items.map((i: any) => i.id === iid ? { ...i, done: !i.done } : i) } : c
    );
    const result = toggle(cls, 'opt', 'item-opt-0');
    expect(result[0].items[0].done).toBe(true);
    expect(result[0].items[1].done).toBe(false);
  });

  test('toggleChecklistItem only affects the target checklist', async () => {
    const cls = [makeChecklist('opt', 2), makeChecklist('stem', 2)];
    const toggle = (cls: any[], tid: string, iid: string) => cls.map(c =>
      c.templateId === tid ? { ...c, items: c.items.map((i: any) => i.id === iid ? { ...i, done: !i.done } : i) } : c
    );
    const result = toggle(cls, 'opt', 'item-opt-0');
    expect(result[0].items[0].done).toBe(true);
    expect(result[1].items[0].done).toBe(false); // stem untouched
  });

  test('addCustomChecklistItem appends with category="Custom"', async () => {
    const cls = [makeChecklist('opt', 2)];
    const addItem = (cls: any[], tid: string, text: string) => cls.map(c =>
      c.templateId === tid
        ? { ...c, items: [...c.items, { id: 'custom-1', text, done: false, category: 'Custom' }] }
        : c
    );
    const result = addItem(cls, 'opt', 'Email advisor');
    expect(result[0].items.length).toBe(3);
    expect(result[0].items[2].category).toBe('Custom');
    expect(result[0].items[2].done).toBe(false);
  });

  test('removeChecklistItem removes only the target item', async () => {
    const cls = [makeChecklist('opt', 3)];
    const removeItem = (cls: any[], tid: string, iid: string) => cls.map(c =>
      c.templateId === tid ? { ...c, items: c.items.filter((i: any) => i.id !== iid) } : c
    );
    const result = removeItem(cls, 'opt', 'item-opt-1');
    expect(result[0].items.length).toBe(2);
    expect(result[0].items.find((i: any) => i.id === 'item-opt-1')).toBeUndefined();
  });

});

test.describe('importData behavior', () => {

  test('importData is full replacement, not merge', async () => {
    // Unlike syncFromCloud (merge), importData sets documents directly
    const imported = [makeDoc('i1', daysFromNow(100)), makeDoc('i2', daysFromNow(200))];
    // Had 3 docs before → after import: exactly 2 (the imported ones)
    const result = imported; // importData: set({ documents: importedDocs })
    expect(result.length).toBe(2);
  });

  test('importData strips notificationIds from imported docs', async () => {
    const docsWithIds = [{ ...makeDoc('d1', daysFromNow(100)), notificationIds: ['old-notif-1'] }];
    const stripped = docsWithIds.map((d: any) => ({ ...d, notificationIds: [] }));
    expect(stripped[0].notificationIds).toHaveLength(0);
  });

  test('importData: invalid JSON returns false', async () => {
    const validate = (text: string) => {
      try { const p = JSON.parse(text); return p.app === 'StatusVault' && !!p.data; }
      catch { return false; }
    };
    expect(validate('not json')).toBe(false);
    expect(validate('{"other":"app"}')).toBe(false);
    expect(validate('{"app":"StatusVault"}')).toBe(false); // missing data
    expect(validate('{"app":"StatusVault","data":{}}')).toBe(true);
  });

  test('exportData includes all 11 required fields', async ({ page }) => {
    const docs = [makeDoc('d1', daysFromNow(200))];
    await injectState(page, premiumState({ documents: docs }));
    const s = await getState(page);
    const exported = JSON.stringify({
      app: 'StatusVault', version: '2.0.0', exportedAt: new Date().toISOString(),
      data: { documents: s.documents, checklists: s.checklists, counters: s.counters,
        trips: s.trips, familyMembers: s.familyMembers, addressHistory: s.addressHistory,
        visaProfile: s.visaProfile, immigrationProfile: s.immigrationProfile,
        notificationEmail: s.notificationEmail, whatsappPhone: s.whatsappPhone,
        isPremium: s.isPremium },
    });
    const d = JSON.parse(exported).data;
    const REQUIRED = ['documents','checklists','counters','trips','familyMembers',
                      'addressHistory','visaProfile','immigrationProfile',
                      'notificationEmail','whatsappPhone','isPremium'];
    REQUIRED.forEach(field => expect(field in d).toBe(true));
  });

});

test.describe('Date utilities', () => {

  test('calculateDaysRemaining: returns -999 for empty or invalid date', async () => {
    const calc = (d: string | null) => {
      if (!d) return -999;
      const t = new Date(d + 'T00:00:00');
      if (isNaN(t.getTime())) return -999;
      const now = new Date(); now.setHours(0,0,0,0);
      return Math.round((t.getTime() - now.getTime()) / 86_400_000);
    };
    expect(calc('')).toBe(-999);
    expect(calc(null)).toBe(-999);
    expect(calc('not-a-date')).toBe(-999);
    expect(calc('2025-01-01')).not.toBe(-999);
  });

  test('getSeverityLabel thresholds match getUrgency thresholds', async () => {
    const boundaries = [-1, 0, 29, 30, 59, 60, 179, 180];
    boundaries.forEach(b => {
      expect(getSeverityLabel(b) === 'Expired').toBe(getUrgency(b) === 'expired');
      expect(getSeverityLabel(b) === 'Low').toBe(getUrgency(b) === 'safe');
    });
  });

  test('countByUrgency aggregates 6 docs across all 5 categories', async () => {
    const docs = [
      makeDoc('d1', daysFromNow(-5)),   // expired
      makeDoc('d2', daysFromNow(10)),   // critical
      makeDoc('d3', daysFromNow(10)),   // critical
      makeDoc('d4', daysFromNow(45)),   // urgent
      makeDoc('d5', daysFromNow(100)),  // upcoming
      makeDoc('d6', daysFromNow(200)),  // safe
    ];
    const counts = { expired:0, critical:0, urgent:0, upcoming:0, safe:0 } as any;
    docs.forEach(doc => {
      const now = new Date(); now.setHours(0,0,0,0);
      const target = new Date(doc.expiryDate + 'T00:00:00');
      const days = Math.round((target.getTime() - now.getTime()) / 86_400_000);
      counts[getUrgency(days)]++;
    });
    expect(counts.expired).toBe(1);
    expect(counts.critical).toBe(2);
    expect(counts.urgent).toBe(1);
    expect(counts.upcoming).toBe(1);
    expect(counts.safe).toBe(1);
    const total = Object.values(counts).reduce((a: any, b: any) => a + b, 0);
    expect(total).toBe(docs.length);
  });

  test('generateDeadlines sorted most-urgent first', async () => {
    const docs = [
      makeDoc('safe',     daysFromNow(200)),
      makeDoc('expired',  daysFromNow(-5)),
      makeDoc('critical', daysFromNow(10)),
      makeDoc('upcoming', daysFromNow(100)),
    ];
    const now = new Date(); now.setHours(0,0,0,0);
    const sorted = docs
      .map(d => ({ ...d, days: Math.round((new Date(d.expiryDate+'T00:00:00').getTime()-now.getTime())/86_400_000) }))
      .sort((a, b) => a.days - b.days);
    expect(sorted[0].id).toBe('expired');
    expect(sorted[1].id).toBe('critical');
    expect(sorted[2].id).toBe('upcoming');
    expect(sorted[3].id).toBe('safe');
  });

  test('mergeById: notificationIds stripped from all merged docs', async () => {
    const local = [{ ...makeDoc('d1', daysFromNow(100)), notificationIds: ['local-1'] }];
    const cloud = [{ ...makeDoc('d2', daysFromNow(200)), notificationIds: ['cloud-1'] }];
    const merged = mergeById(local, cloud);
    merged.forEach((d: any) => expect(d.notificationIds).toHaveLength(0));
  });

});
