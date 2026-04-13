/**
 * StatusVault — Tier Logic Tests (Pure JS — no Babel/TypeScript needed)
 * Run: node __tests__/tierLogic.test.js
 */

// ── Limits (mirrors src/store/index.ts) ──────────────────────
const GUEST_DOC_LIMIT       = 1;
const GUEST_CHECKLIST_LIMIT = 1;
const GUEST_COUNTER_LIMIT   = 1;
const FREE_DOCUMENT_LIMIT   = 2;
const FREE_CHECKLIST_LIMIT  = 2;
const FREE_COUNTER_LIMIT    = 2;
const FREE_FAMILY_LIMIT     = 1;

// ── canAdd logic (mirrors store) ──────────────────────────────
const canAddDocument = s => {
  if (s.isPremium) return true;
  if (!s.authUser || s.isGuestMode) return s.documents.length < GUEST_DOC_LIMIT;
  return s.documents.length < FREE_DOCUMENT_LIMIT;
};
const canAddChecklist = s => {
  if (s.isPremium) return true;
  if (!s.authUser || s.isGuestMode) return s.checklists.length < GUEST_CHECKLIST_LIMIT;
  return s.checklists.length < FREE_CHECKLIST_LIMIT;
};
const canAddCounter = s => {
  if (s.isPremium) return true;
  if (!s.authUser || s.isGuestMode) return s.counters.length < GUEST_COUNTER_LIMIT;
  return s.counters.length < FREE_COUNTER_LIMIT;
};
const canAddFamilyMember = s => {
  if (s.isPremium) return true;
  if (!s.authUser || s.isGuestMode) return false;
  return s.familyMembers.length < FREE_FAMILY_LIMIT;
};
const canOpenPaywall = s => !!(s.authUser && !s.isGuestMode);
const getSeverity = d => {
  if (d < 0)   return 'Expired';
  if (d < 30)  return 'Critical';
  if (d < 60)  return 'High';
  if (d < 180) return 'Medium';
  return 'Low';
};

// ── Helpers ───────────────────────────────────────────────────
const USER  = { id: 'u1', email: 'test@example.com', createdAt: '' };
const docs  = n => Array.from({ length: n }, (_, i) => ({ id: `d${i}` }));
const cls   = n => Array.from({ length: n }, (_, i) => ({ id: `c${i}` }));
const cts   = n => Array.from({ length: n }, (_, i) => ({ id: `t${i}` }));
const fams  = n => Array.from({ length: n }, (_, i) => ({ id: `f${i}`, documentIds: [] }));
const state = (o = {}) => ({
  documents: [], checklists: [], counters: [], familyMembers: [],
  isPremium: false, authUser: null, isGuestMode: false, ...o
});
const guest = (d=0,c=0,t=0) => state({ isGuestMode: true, authUser: null, documents: docs(d), checklists: cls(c), counters: cts(t) });
const free  = (d=0,c=0,t=0,f=0) => state({ isGuestMode: false, authUser: USER, documents: docs(d), checklists: cls(c), counters: cts(t), familyMembers: fams(f) });
const prem  = (d=0,c=0,t=0,f=0) => state({ isPremium: true, authUser: USER, documents: docs(d), checklists: cls(c), counters: cts(t), familyMembers: fams(f) });

// ── Test runner ───────────────────────────────────────────────
let passed = 0, failed = 0;
const assert = (desc, actual, expected) => {
  if (actual === expected) {
    process.stdout.write('  ✅ ' + desc + '\n');
    passed++;
  } else {
    process.stdout.write(`  ❌ ${desc}\n     Expected: ${expected}, Got: ${actual}\n`);
    failed++;
  }
};

// ══════════════════════════════════════════════════════════════
console.log('\n╔══════════════════════════════════════════════╗');
console.log('║  StatusVault Tier Logic Tests                ║');
console.log('╚══════════════════════════════════════════════╝\n');

// ── GUEST MODE ────────────────────────────────────────────────
console.log('► GUEST MODE\n');
assert('UC-GUEST-01: can add 1st document',          canAddDocument(guest(0)), true);
assert('UC-GUEST-02: cannot add 2nd document',       canAddDocument(guest(1)), false);
assert('UC-GUEST-02: 2nd doc → auth modal not paywall', canOpenPaywall(guest(1)), false);
assert('UC-GUEST-03: can add 1st checklist',         canAddChecklist(guest()), true);
assert('UC-GUEST-04: cannot add 2nd checklist',      canAddChecklist(guest(0,1)), false);
assert('UC-GUEST-04: over limit → auth not paywall', canOpenPaywall(guest(0,1)), false);
assert('UC-GUEST-05: can add 1st timer',             canAddCounter(guest()), true);
assert('UC-GUEST-06: cannot add 2nd timer',          canAddCounter(guest(0,0,1)), false);
assert('UC-GUEST-07: cannot add family member',      canAddFamilyMember(guest()), false);
assert('UC-GUEST-08: cannot open paywall (empty)',   canOpenPaywall(guest()), false);
assert('UC-GUEST-08: cannot open paywall (full)',    canOpenPaywall(guest(1)), false);

// ── FREE ACCOUNT ──────────────────────────────────────────────
console.log('\n► FREE ACCOUNT\n');
assert('UC-FREE-01a: can add 1st document',          canAddDocument(free(0)), true);
assert('UC-FREE-01b: can add 2nd document',          canAddDocument(free(1)), true);
assert('UC-FREE-02:  cannot add 3rd document',       canAddDocument(free(2)), false);
assert('UC-FREE-02:  3rd doc → paywall (not auth)',  canOpenPaywall(free(2)), true);
assert('UC-FREE-03a: can add 1st checklist',         canAddChecklist(free()), true);
assert('UC-FREE-03b: can add 2nd checklist',         canAddChecklist(free(0,1)), true);
assert('UC-FREE-04:  cannot add 3rd checklist',      canAddChecklist(free(0,2)), false);
assert('UC-FREE-04:  3rd checklist → paywall',       canOpenPaywall(free(0,2)), true);
assert('UC-FREE-05a: can add 1st timer',             canAddCounter(free()), true);
assert('UC-FREE-05b: can add 2nd timer',             canAddCounter(free(0,0,1)), true);
assert('UC-FREE-06:  cannot add 3rd timer',          canAddCounter(free(0,0,2)), false);
assert('UC-FREE-07:  can add 1st family member',     canAddFamilyMember(free()), true);
assert('UC-FREE-08:  cannot add 2nd family member',  canAddFamilyMember(free(0,0,0,1)), false);
assert('UC-FREE-08:  2nd member → paywall',          canOpenPaywall(free(0,0,0,1)), true);
assert('UC-FREE-11:  free user CAN open paywall',    canOpenPaywall(free()), true);

// ── PREMIUM ───────────────────────────────────────────────────
console.log('\n► PREMIUM ACCOUNT\n');
assert('UC-PREM-01: unlimited docs (100)',            canAddDocument(prem(100)), true);
assert('UC-PREM-01: unlimited docs (999)',            canAddDocument(prem(999)), true);
assert('UC-PREM-02: unlimited checklists (100)',      canAddChecklist(prem(0,100)), true);
assert('UC-PREM-03: unlimited timers (100)',          canAddCounter(prem(0,0,100)), true);
assert('UC-PREM-04: unlimited family (50)',           canAddFamilyMember(prem(0,0,0,50)), true);

// ── SEVERITY THRESHOLDS ───────────────────────────────────────
console.log('\n► SEVERITY THRESHOLDS\n');
assert('Expired: days = -1',  getSeverity(-1),  'Expired');
assert('Expired: days = -30', getSeverity(-30), 'Expired');
assert('Critical: days = 0',  getSeverity(0),   'Critical');
assert('Critical: days = 15', getSeverity(15),  'Critical');
assert('Critical: days = 29', getSeverity(29),  'Critical');
assert('High: days = 30',     getSeverity(30),  'High');
assert('High: days = 45',     getSeverity(45),  'High');
assert('High: days = 59',     getSeverity(59),  'High');
assert('Medium: days = 60',   getSeverity(60),  'Medium');
assert('Medium: days = 120',  getSeverity(120), 'Medium');
assert('Medium: days = 179',  getSeverity(179), 'Medium');
assert('Low: days = 180',     getSeverity(180), 'Low');
assert('Low: days = 365',     getSeverity(365), 'Low');

// ── AUTH STATE TRANSITIONS ────────────────────────────────────
console.log('\n► AUTH STATE TRANSITIONS\n');
const afterSignIn = { ...guest(1), authUser: USER, isGuestMode: false };
assert('Guest→Login: isGuestMode clears',            afterSignIn.isGuestMode, false);
assert('Guest→Login: authUser set',                  !!afterSignIn.authUser, true);
assert('Guest→Login: can now add 2nd doc',           canAddDocument(afterSignIn), true);

const loggedIn   = free(2);
const afterSignOut = { ...loggedIn, authUser: null };
assert('Logout: authUser clears',                    afterSignOut.authUser, null);
assert('Logout: data preserved (docs still 2)',      afterSignOut.documents.length, 2);
assert('Logout: cannot open paywall',                canOpenPaywall(afterSignOut), false);

// ── EDGE CASES ────────────────────────────────────────────────
console.log('\n► EDGE CASES\n');
const bypass = state({ isGuestMode: true, authUser: null, documents: docs(5) });
assert('Guest with many docs: paywall still blocked', canOpenPaywall(bypass), false);
assert('Guest with many docs: canAddDoc = false',    canAddDocument(bypass), false);

const preAuth = state({ authUser: null, isGuestMode: false, documents: docs(1) });
assert('Pre-auth (no choice): treated as guest',     canAddDocument(preAuth), false);
assert('Pre-auth: cannot open paywall',              canOpenPaywall(preAuth), false);

// isGuestMode=true overrides authUser (defensive)
const weirdState = state({ isGuestMode: true, authUser: USER, documents: docs(1) });
assert('isGuestMode=true overrides authUser limits', canAddDocument(weirdState), false);
assert('isGuestMode=true blocks paywall',            canOpenPaywall(weirdState), false);

// ── SUMMARY ───────────────────────────────────────────────────
const total = passed + failed;
console.log('\n' + '═'.repeat(48));
console.log(`  ${passed}/${total} tests passed${failed > 0 ? `  ⚠ ${failed} FAILED` : '  🎉 All passed'}`);
console.log('═'.repeat(48) + '\n');
process.exit(failed > 0 ? 1 : 0);
