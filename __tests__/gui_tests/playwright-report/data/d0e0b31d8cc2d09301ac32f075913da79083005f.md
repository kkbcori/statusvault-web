# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: edge.spec.ts >> Edge cases >> TC-E-10 — guest doc preserved when transitioning to free account
- Location: tests\edge.spec.ts:112:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: MAIN
          - generic [ref=e17] [cursor=pointer]:
            - generic [ref=e18]: 
            - generic [ref=e19]: Home
          - generic [ref=e20] [cursor=pointer]:
            - generic [ref=e21]: 
            - generic [ref=e22]: Documents
          - generic [ref=e23] [cursor=pointer]:
            - generic [ref=e24]: 
            - generic [ref=e25]: Residency & Travel
          - generic [ref=e26] [cursor=pointer]:
            - generic [ref=e27]: 
            - generic [ref=e28]: Family
        - generic [ref=e29]:
          - generic [ref=e30]: TOOLS
          - generic [ref=e31] [cursor=pointer]:
            - generic [ref=e32]: 
            - generic [ref=e33]: Checklist
          - generic [ref=e34] [cursor=pointer]:
            - generic [ref=e35]: 
            - generic [ref=e36]: Timers
          - generic [ref=e37] [cursor=pointer]:
            - generic [ref=e38]: 
            - generic [ref=e39]: Links
        - generic [ref=e40]:
          - generic [ref=e41]: ACCOUNT
          - generic [ref=e42] [cursor=pointer]:
            - generic [ref=e43]: 
            - generic [ref=e44]: Settings
          - generic [ref=e45] [cursor=pointer]:
            - generic [ref=e46]: 
            - generic [ref=e47]: Help
          - generic [ref=e48] [cursor=pointer]:
            - generic [ref=e49]: 
            - generic [ref=e50]: Contact
      - generic [ref=e51] [cursor=pointer]:
        - generic [ref=e52]: 
        - generic [ref=e53]: Sign In / Create Account
      - generic [ref=e54] [cursor=pointer]:
        - generic [ref=e56]: 
        - generic [ref=e57]:
          - generic [ref=e58]: Upgrade to Premium
          - generic [ref=e59]: Unlimited docs · from $0.49/mo
        - generic [ref=e60]: 
    - generic [ref=e63]:
      - generic [ref=e64]:
        - generic [ref=e66]: Home
        - generic [ref=e67]:
          - generic [ref=e69] [cursor=pointer]: 
          - generic [ref=e72] [cursor=pointer]: 
          - generic [ref=e74] [cursor=pointer]: 
      - generic [ref=e83]:
        - generic [ref=e84] [cursor=pointer]:
          - generic [ref=e85]: 
          - generic [ref=e86]: Guest mode — 1 doc · 1 checklist · 1 timer · no family members
          - generic [ref=e88]: Upgrade →
        - generic [ref=e89]:
          - generic [ref=e92] [cursor=pointer]:
            - generic [ref=e93]:
              - generic [ref=e94]: Documents Tracked
              - generic [ref=e95]: "1"
              - generic [ref=e96]: of 2 total
            - generic [ref=e98]: 
          - generic [ref=e101] [cursor=pointer]:
            - generic [ref=e102]:
              - generic [ref=e103]: Next Expiry
              - generic [ref=e104]: 200d
              - generic [ref=e105]: Guest Passport
            - generic [ref=e107]: 
          - generic [ref=e110] [cursor=pointer]:
            - generic [ref=e111]:
              - generic [ref=e112]: Expiring Soon
              - generic [ref=e113]: "0"
              - generic [ref=e114]: None in 90 days
            - generic [ref=e116]: 
          - generic [ref=e119] [cursor=pointer]:
            - generic [ref=e120]:
              - generic [ref=e121]: Family Members
              - generic [ref=e122]: "0"
              - generic [ref=e123]: Add family members
            - generic [ref=e125]: 
        - generic [ref=e126]:
          - generic [ref=e127]:
            - generic [ref=e128]:
              - generic [ref=e129]:
                - generic [ref=e130]: Document Status
                - generic [ref=e131]: Urgency breakdown
              - generic [ref=e133]: 1 total
            - generic [ref=e134]:
              - generic [ref=e136]: 🔴 Expired
              - generic [ref=e139]: "0"
            - generic [ref=e140]:
              - generic [ref=e142]: Critical (<30d)
              - generic [ref=e145]: "0"
            - generic [ref=e146]:
              - generic [ref=e148]: High (30–60d)
              - generic [ref=e151]: "0"
            - generic [ref=e152]:
              - generic [ref=e154]: Medium (60–180d)
              - generic [ref=e157]: "0"
            - generic [ref=e158]:
              - generic [ref=e160]: Low (>180d)
              - generic [ref=e164]: "1"
            - generic [ref=e166] [cursor=pointer]:
              - generic [ref=e167]: View Documents
              - generic [ref=e168]: 
          - generic [ref=e169]:
            - generic [ref=e170]:
              - generic [ref=e171]:
                - generic [ref=e172]: Upcoming Deadlines
                - generic [ref=e173]: 1 doc tracked
              - generic [ref=e174] [cursor=pointer]:
                - generic [ref=e175]: All
                - generic [ref=e176]: 
            - generic [ref=e178]:
              - generic [ref=e180]: 🛂
              - generic [ref=e181]:
                - generic [ref=e182]: Guest Passport
                - generic [ref=e183]: Nov 5, 2026
              - generic [ref=e185]: Low · 200d
          - generic [ref=e186]:
            - generic [ref=e187]:
              - generic [ref=e188]:
                - generic [ref=e189]: Immi Checklist
                - generic [ref=e190]: Track your immigration steps
              - generic [ref=e191] [cursor=pointer]:
                - generic [ref=e192]: Manage
                - generic [ref=e193]: 
            - generic [ref=e194]:
              - generic [ref=e195]: 
              - generic [ref=e196]: No checklists yet
              - generic [ref=e197]: Add checklists to track OPT, H-1B, and green card steps
              - generic [ref=e199] [cursor=pointer]: Browse Checklists
          - generic [ref=e200]:
            - generic [ref=e201]:
              - generic [ref=e202]:
                - generic [ref=e203]: Immi Timers
                - generic [ref=e204]: Track unemployment & stay days
              - generic [ref=e205] [cursor=pointer]:
                - generic [ref=e206]: Manage
                - generic [ref=e207]: 
            - generic [ref=e208]:
              - generic [ref=e209]: 
              - generic [ref=e210]: No timers yet
              - generic [ref=e211]: Track OPT unemployment days, 60-day grace period, and more
              - generic [ref=e213] [cursor=pointer]: Add Timer
        - generic [ref=e214]:
          - generic [ref=e215]: 
          - generic [ref=e216]: Saving to device...
  - dialog [ref=e219]:
    - generic [ref=e222]:
      - generic [ref=e223]:
        - generic [ref=e227]: 
        - generic [ref=e228]: StatusVault
        - generic [ref=e229]: Your immigration documents, protected
        - generic [ref=e230]:
          - generic [ref=e231]: 
          - generic [ref=e232]: 100% private · AES-256 · on your device
      - generic [ref=e233]:
        - generic [ref=e234]: Choose how to start
        - generic [active] [ref=e235] [cursor=pointer]:
          - generic [ref=e237]: 
          - generic [ref=e238]:
            - generic [ref=e239]: Continue as Guest
            - generic [ref=e240]: No sign-up · explore with limited access
            - generic [ref=e241]:
              - generic [ref=e243]: 1 document
              - generic [ref=e245]: 1 checklist
              - generic [ref=e247]: 1 timer
              - generic [ref=e249]: No family
          - generic [ref=e250]: 
        - generic [ref=e252] [cursor=pointer]:
          - generic [ref=e254]: 
          - generic [ref=e255]:
            - generic [ref=e256]:
              - generic [ref=e257]: Create Free Account
              - generic [ref=e259]: RECOMMENDED
            - generic [ref=e260]: Email login link · no password needed
            - generic [ref=e261]:
              - generic [ref=e263]: 2 documents
              - generic [ref=e265]: 1 family + 1 doc
              - generic [ref=e267]: 2 checklists
              - generic [ref=e269]: 2 timers
        - generic [ref=e270]:
          - generic [ref=e271]: 
          - generic [ref=e272]: Premium from $0.49/mo — Unlimited docs · family · PDF export · AES-256 encrypted cloud backup
```

# Test source

```ts
  21  |     const urgency = (d: number) => d < 0 ? 'expired' : d < 30 ? 'critical' : d < 60 ? 'urgent' : d < 180 ? 'upcoming' : 'safe';
  22  |     expect(urgency(-1)).toBe('expired');
  23  |     expect(urgency(0)).toBe('critical');
  24  |     expect(urgency(29)).toBe('critical');
  25  |     expect(urgency(30)).toBe('urgent');
  26  |     expect(urgency(59)).toBe('urgent');
  27  |     expect(urgency(60)).toBe('upcoming');
  28  |     expect(urgency(179)).toBe('upcoming');
  29  |     expect(urgency(180)).toBe('safe');
  30  |   });
  31  | 
  32  |   // TC-E-03: pure logic
  33  |   test('TC-E-03 — counter clamped at maxDays', async () => {
  34  |     const clamp = (c: any, add: number) => ({ ...c, daysUsed: Math.min(c.maxDays, c.daysUsed + add) });
  35  |     expect(clamp({ daysUsed: 88, maxDays: 90 }, 10).daysUsed).toBe(90);
  36  |     expect(clamp({ daysUsed: 90, maxDays: 90 },  1).daysUsed).toBe(90);
  37  |     expect(clamp({ daysUsed: 88, maxDays: 90 },  1).daysUsed).toBe(89);
  38  |   });
  39  | 
  40  |   // TC-E-04: pure logic
  41  |   test('TC-E-04 — counter cannot go below 0', async () => {
  42  |     const dec = (n: number) => Math.max(0, n - 1);
  43  |     expect(dec(0)).toBe(0);
  44  |     expect(dec(1)).toBe(0);
  45  |     expect(dec(5)).toBe(4);
  46  |   });
  47  | 
  48  |   // TC-E-05: state check
  49  |   test('TC-E-05 — paused counter has startDate set', async ({ page }) => {
  50  |     const counter = { templateId: 'opt-unemployment', label: 'OPT', icon: '⏱️',
  51  |       maxDays: 90, warnAt: 63, critAt: 81, daysUsed: 15,
  52  |       isTracking: false, startDate: daysAgo(20), lastIncrementDate: null };
  53  |     await injectState(page, freeState({ counters: [counter] }));
  54  |     const s = await getState(page);
  55  |     // startDate set means it was previously started — UI shows "Resume" not "Start"
  56  |     expect(s.counters[0].startDate).toBeTruthy();
  57  |     expect(s.counters[0].isTracking).toBe(false);
  58  |     expect(s.counters[0].daysUsed).toBe(15);
  59  |   });
  60  | 
  61  |   // TC-E-06: pure logic
  62  |   test('TC-E-06 — I-94: ≥180 days = long absence, <180 = none', async () => {
  63  |     const tripDays = (dep: string, ret: string) =>
  64  |       Math.round((new Date(ret+'T00:00:00').getTime() - new Date(dep+'T00:00:00').getTime()) / 86_400_000);
  65  |     expect(tripDays('2025-01-01','2025-07-01') >= 180).toBe(true);  // 181 days
  66  |     expect(tripDays('2025-01-01','2025-06-29') >= 180).toBe(false); // 179 days
  67  |     expect(180 >= 180).toBe(true);
  68  |     expect(179 >= 180).toBe(false);
  69  |   });
  70  | 
  71  |   // TC-E-07: pure logic
  72  |   test('TC-E-07 — trips >5 years excluded from N-400 stats', async () => {
  73  |     const filter5yr = (trips: any[]) => {
  74  |       const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear()-5); cutoff.setHours(0,0,0,0);
  75  |       return trips.filter(t => new Date(t.departureDate+'T00:00:00') >= cutoff);
  76  |     };
  77  |     const trips = [makeTrip('old', daysAgo(365*6), daysAgo(365*6-14)), makeTrip('recent', daysAgo(180), daysAgo(165))];
  78  |     const filtered = filter5yr(trips);
  79  |     expect(filtered.length).toBe(1);
  80  |     expect(filtered[0].id).toBe('recent');
  81  |   });
  82  | 
  83  |   // TC-E-08: pure logic
  84  |   test('TC-E-08 — alert fires at 7/15/30/60/90/180 day windows', async () => {
  85  |     const WINDOWS = [180,90,60,30,15,7];
  86  |     const shouldAlert = (d: number) => WINDOWS.some(w => Math.abs(d-w) <= 2);
  87  |     expect(shouldAlert(7)).toBe(true);
  88  |     expect(shouldAlert(15)).toBe(true);
  89  |     expect(shouldAlert(30)).toBe(true);
  90  |     expect(shouldAlert(60)).toBe(true);
  91  |     expect(shouldAlert(90)).toBe(true);
  92  |     expect(shouldAlert(180)).toBe(true);
  93  |     expect(shouldAlert(50)).toBe(false);
  94  |     expect(shouldAlert(200)).toBe(false);
  95  |   });
  96  | 
  97  |   // TC-E-09: pure logic
  98  |   test('TC-E-09 — import merge: no duplicate docs', async () => {
  99  |     const merge = (local: any[], cloud: any[]) => {
  100 |       const ids = new Set(local.map((x:any) => x.id));
  101 |       return [...local, ...cloud.filter((x:any) => !ids.has(x.id))];
  102 |     };
  103 |     const shared = makeDoc('shared', daysFromNow(200));
  104 |     const localD = makeDoc('local',  daysFromNow(250));
  105 |     const cloudD = makeDoc('cloud',  daysFromNow(300));
  106 |     const merged = merge([shared, localD], [shared, cloudD]);
  107 |     expect(merged.length).toBe(3);
  108 |     expect(merged.filter((d:any) => d.id==='shared').length).toBe(1);
  109 |   });
  110 | 
  111 |   // TC-E-10: guest → free — authUser NOT checked (not in partialize)
  112 |   test('TC-E-10 — guest doc preserved when transitioning to free account', async ({ page }) => {
  113 |     const doc = makeDoc('g-doc', daysFromNow(200), 'passport', 'Guest Passport');
  114 |     await injectState(page, guestState({ documents: [doc] }));
  115 |     let s = await getState(page);
  116 |     expect(s.documents.length).toBe(1);
  117 |     expect(s.isGuestMode).toBe(true);
  118 |     // Simulate account creation: isGuestMode cleared, doc preserved
  119 |     await injectState(page, freeState({ documents: [doc] }));
  120 |     s = await getState(page);
> 121 |     expect(s.isGuestMode).toBe(false);  // no longer guest
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  122 |     expect(s.documents.length).toBe(1); // doc still there
  123 |     expect(s.documents[0].label).toBe('Guest Passport');
  124 |   });
  125 | 
  126 |   // TC-E-11
  127 |   test('TC-E-11 — storage key exists after inject', async ({ page }) => {
  128 |     await injectState(page, freeState({ documents: [makeDoc('d1', daysFromNow(200))] }));
  129 |     const keys = await page.evaluate(() => Object.keys(localStorage));
  130 |     expect(keys).toContain('statusvault-storage');
  131 |   });
  132 | 
  133 |   // TC-E-12: authUser NOT checked (not in partialize)
  134 |   test('TC-E-12 — premium state persisted after sign-out/sign-in simulation', async ({ page }) => {
  135 |     const docs = [makeDoc('d1', daysFromNow(200)), makeDoc('d2', daysFromNow(365))];
  136 |     // Sign out → guest
  137 |     await injectState(page, guestState({ documents: docs }));
  138 |     let s = await getState(page);
  139 |     expect(s.isGuestMode).toBe(true);
  140 |     // Sign back in as premium
  141 |     await injectState(page, premiumState({ documents: docs }));
  142 |     s = await getState(page);
  143 |     expect(s.isPremium).toBe(true);          // premium restored
  144 |     expect(s.isGuestMode).toBe(false);       // not guest
  145 |     expect(s.documents.length).toBe(2);      // docs still there
  146 |   });
  147 | 
  148 | });
  149 | 
```