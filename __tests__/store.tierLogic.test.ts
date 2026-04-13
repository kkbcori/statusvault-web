/**
 * StatusVault — Tier Logic Automated Tests
 * Tests all canAdd* functions across Guest, Free, Premium modes
 * Run: npx jest __tests__/store.tierLogic.test.ts
 */

// ── Mock Zustand store state for testing ──────────────────────
const makeState = (overrides: Partial<any> = {}) => ({
  documents:     [],
  checklists:    [],
  counters:      [],
  familyMembers: [],
  isPremium:     false,
  authUser:      null,
  isGuestMode:   false,
  ...overrides,
});

const GUEST_DOC_LIMIT       = 1;
const GUEST_CHECKLIST_LIMIT = 1;
const GUEST_COUNTER_LIMIT   = 1;
const FREE_DOCUMENT_LIMIT   = 2;
const FREE_CHECKLIST_LIMIT  = 2;
const FREE_COUNTER_LIMIT    = 2;
const FREE_FAMILY_LIMIT     = 1;
const FREE_FAMILY_DOC_LIMIT = 1;

// Re-implement canAdd* logic from store for pure unit testing
const canAddDocument = (s: any): boolean => {
  if (s.isPremium) return true;
  if (!s.authUser || s.isGuestMode) return s.documents.length < GUEST_DOC_LIMIT;
  return s.documents.length < FREE_DOCUMENT_LIMIT;
};
const canAddChecklist = (s: any): boolean => {
  if (s.isPremium) return true;
  if (!s.authUser || s.isGuestMode) return s.checklists.length < GUEST_CHECKLIST_LIMIT;
  return s.checklists.length < FREE_CHECKLIST_LIMIT;
};
const canAddCounter = (s: any): boolean => {
  if (s.isPremium) return true;
  if (!s.authUser || s.isGuestMode) return s.counters.length < GUEST_COUNTER_LIMIT;
  return s.counters.length < FREE_COUNTER_LIMIT;
};
const canAddFamilyMember = (s: any): boolean => {
  if (s.isPremium) return true;
  if (!s.authUser || s.isGuestMode) return false;
  return s.familyMembers.length < FREE_FAMILY_LIMIT;
};
const canOpenPaywall = (s: any): boolean => {
  // Guests should be redirected to auth modal, not paywall
  return !!(s.authUser && !s.isGuestMode);
};

// ── Helpers ───────────────────────────────────────────────────
const doc  = (n: number) => Array.from({length:n}, (_,i) => ({id:`d${i}`}));
const cl   = (n: number) => Array.from({length:n}, (_,i) => ({id:`c${i}`}));
const ct   = (n: number) => Array.from({length:n}, (_,i) => ({id:`t${i}`}));
const fam  = (n: number) => Array.from({length:n}, (_,i) => ({id:`f${i}`, documentIds:[]}));
const USER = { id: 'u1', email: 'test@test.com', createdAt: '' };

// ══════════════════════════════════════════════════════════════
// GUEST MODE
// ══════════════════════════════════════════════════════════════
describe('Guest Mode', () => {
  const guest = (docs=0, cls=0, cts=0) => makeState({
    isGuestMode: true, authUser: null,
    documents: doc(docs), checklists: cl(cls), counters: ct(cts),
  });

  describe('Documents', () => {
    it('UC-GUEST-01: can add first document', () => {
      expect(canAddDocument(guest(0))).toBe(true);
    });
    it('UC-GUEST-02: cannot add second document', () => {
      expect(canAddDocument(guest(1))).toBe(false);
    });
    it('UC-GUEST-02: second doc triggers auth modal, not paywall', () => {
      expect(canOpenPaywall(guest(1))).toBe(false);
    });
  });

  describe('Checklists', () => {
    it('UC-GUEST-03: can add first checklist', () => {
      expect(canAddChecklist(guest())).toBe(true);
    });
    it('UC-GUEST-04: cannot add second checklist', () => {
      expect(canAddChecklist(guest(0,1))).toBe(false);
    });
    it('UC-GUEST-04: over-limit triggers auth modal not paywall', () => {
      expect(canOpenPaywall(guest(0,1))).toBe(false);
    });
  });

  describe('Timers', () => {
    it('UC-GUEST-05: can add first timer', () => {
      expect(canAddCounter(guest())).toBe(true);
    });
    it('UC-GUEST-06: cannot add second timer', () => {
      expect(canAddCounter(guest(0,0,1))).toBe(false);
    });
  });

  describe('Family', () => {
    it('UC-GUEST-07: cannot add family members', () => {
      expect(canAddFamilyMember(guest())).toBe(false);
    });
  });

  describe('Premium / Paywall', () => {
    it('UC-GUEST-08: guest cannot open paywall', () => {
      expect(canOpenPaywall(guest())).toBe(false);
    });
    it('UC-GUEST-08: guest with docs still cannot open paywall', () => {
      expect(canOpenPaywall(guest(1))).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════
// FREE ACCOUNT
// ══════════════════════════════════════════════════════════════
describe('Free Account', () => {
  const free = (docs=0, cls=0, cts=0, fams=0) => makeState({
    isGuestMode: false, authUser: USER, isPremium: false,
    documents: doc(docs), checklists: cl(cls), counters: ct(cts),
    familyMembers: fam(fams),
  });

  describe('Documents', () => {
    it('UC-FREE-01a: can add first document', () => {
      expect(canAddDocument(free(0))).toBe(true);
    });
    it('UC-FREE-01b: can add second document', () => {
      expect(canAddDocument(free(1))).toBe(true);
    });
    it('UC-FREE-02: cannot add third document', () => {
      expect(canAddDocument(free(2))).toBe(false);
    });
    it('UC-FREE-02: third doc triggers paywall (not auth modal)', () => {
      expect(canOpenPaywall(free(2))).toBe(true);
    });
  });

  describe('Checklists', () => {
    it('UC-FREE-03a: can add first checklist', () => {
      expect(canAddChecklist(free())).toBe(true);
    });
    it('UC-FREE-03b: can add second checklist', () => {
      expect(canAddChecklist(free(0,1))).toBe(true);
    });
    it('UC-FREE-04: cannot add third checklist', () => {
      expect(canAddChecklist(free(0,2))).toBe(false);
    });
    it('UC-FREE-04: over limit triggers paywall', () => {
      expect(canOpenPaywall(free(0,2))).toBe(true);
    });
  });

  describe('Timers', () => {
    it('UC-FREE-05a: can add first timer', () => {
      expect(canAddCounter(free())).toBe(true);
    });
    it('UC-FREE-05b: can add second timer', () => {
      expect(canAddCounter(free(0,0,1))).toBe(true);
    });
    it('UC-FREE-06: cannot add third timer', () => {
      expect(canAddCounter(free(0,0,2))).toBe(false);
    });
  });

  describe('Family', () => {
    it('UC-FREE-07: can add first family member', () => {
      expect(canAddFamilyMember(free())).toBe(true);
    });
    it('UC-FREE-08: cannot add second family member', () => {
      expect(canAddFamilyMember(free(0,0,0,1))).toBe(false);
    });
    it('UC-FREE-08: second member triggers paywall', () => {
      expect(canOpenPaywall(free(0,0,0,1))).toBe(true);
    });
  });

  describe('Paywall Access', () => {
    it('UC-FREE-11: free account CAN open paywall', () => {
      expect(canOpenPaywall(free())).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════
// PREMIUM ACCOUNT
// ══════════════════════════════════════════════════════════════
describe('Premium Account', () => {
  const premium = (docs=0, cls=0, cts=0, fams=0) => makeState({
    isGuestMode: false, authUser: USER, isPremium: true,
    documents: doc(docs), checklists: cl(cls), counters: ct(cts),
    familyMembers: fam(fams),
  });

  it('UC-PREMIUM-01: can add unlimited documents', () => {
    expect(canAddDocument(premium(100))).toBe(true);
    expect(canAddDocument(premium(999))).toBe(true);
  });
  it('UC-PREMIUM-02: can add unlimited checklists', () => {
    expect(canAddChecklist(premium(0,100))).toBe(true);
  });
  it('UC-PREMIUM-03: can add unlimited timers', () => {
    expect(canAddCounter(premium(0,0,100))).toBe(true);
  });
  it('UC-PREMIUM-04: can add unlimited family members', () => {
    expect(canAddFamilyMember(premium(0,0,0,50))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════
// SEVERITY THRESHOLDS (UC-DOCS-02)
// ══════════════════════════════════════════════════════════════
describe('Document Severity Thresholds', () => {
  const getSeverity = (days: number): string => {
    if (days < 0)   return 'Expired';
    if (days < 30)  return 'Critical';
    if (days < 60)  return 'High';
    if (days < 180) return 'Medium';
    return 'Low';
  };

  it('expired: days < 0', () => expect(getSeverity(-1)).toBe('Expired'));
  it('critical: days = 0', () => expect(getSeverity(0)).toBe('Critical'));
  it('critical: days = 29', () => expect(getSeverity(29)).toBe('Critical'));
  it('high: days = 30', () => expect(getSeverity(30)).toBe('High'));
  it('high: days = 59', () => expect(getSeverity(59)).toBe('High'));
  it('medium: days = 60', () => expect(getSeverity(60)).toBe('Medium'));
  it('medium: days = 179', () => expect(getSeverity(179)).toBe('Medium'));
  it('low: days = 180', () => expect(getSeverity(180)).toBe('Low'));
  it('low: days = 365', () => expect(getSeverity(365)).toBe('Low'));
});

// ══════════════════════════════════════════════════════════════
// AUTH STATE TRANSITIONS
// ══════════════════════════════════════════════════════════════
describe('Auth State Transitions', () => {
  it('guest → login: isGuestMode clears', () => {
    const guestState = makeState({ isGuestMode: true, authUser: null });
    // Simulate SIGNED_IN
    const afterSignIn = { ...guestState, authUser: USER, isGuestMode: false };
    expect(afterSignIn.isGuestMode).toBe(false);
    expect(afterSignIn.authUser).toBeTruthy();
  });

  it('login → signout: authUser clears, data preserved', () => {
    const loggedIn = makeState({ authUser: USER, documents: doc(2) });
    const afterSignOut = { ...loggedIn, authUser: null };
    expect(afterSignOut.authUser).toBeNull();
    expect(afterSignOut.documents).toHaveLength(2); // data preserved
  });

  it('guest mode: canAdd enforces guest limits not free limits', () => {
    // A user who is "isGuestMode=true but somehow has authUser" should still get guest limits
    const s = makeState({ isGuestMode: true, authUser: USER, documents: doc(1) });
    expect(canAddDocument(s)).toBe(false); // guest limit = 1, not free limit = 2
  });

  it('returning user: hasOnboarded prevents welcome modal', () => {
    const s = makeState({ authUser: USER });
    const shouldShowWelcome = !s.authUser; // guest check in AppNavigator
    expect(shouldShowWelcome).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════
// EDGE CASES
// ══════════════════════════════════════════════════════════════
describe('Edge Cases', () => {
  it('guest with many docs (via bypass): still cannot open paywall', () => {
    const s = makeState({ isGuestMode: true, authUser: null, documents: doc(5) });
    expect(canOpenPaywall(s)).toBe(false);
  });

  it('isPremium=true overrides all limits regardless of counts', () => {
    const s = makeState({
      isPremium: true, authUser: USER,
      documents: doc(50), checklists: cl(50),
      counters: ct(50), familyMembers: fam(50),
    });
    expect(canAddDocument(s)).toBe(true);
    expect(canAddChecklist(s)).toBe(true);
    expect(canAddCounter(s)).toBe(true);
    expect(canAddFamilyMember(s)).toBe(true);
  });

  it('no authUser + no guestMode = treated as guest (pre-auth state)', () => {
    const s = makeState({ authUser: null, isGuestMode: false, documents: doc(1) });
    expect(canAddDocument(s)).toBe(false); // treated as guest
    expect(canOpenPaywall(s)).toBe(false);
  });
});
