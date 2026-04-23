// ═══════════════════════════════════════════════════════════════
// StatusVault — Zustand Store (v7)
// Auth + cloud sync added. Offline-first: local always written first.
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserDocument, ChecklistItem, TravelTrip, AddressEntry, AuthUser } from '../types';
import {
  scheduleDocumentNotifications,
  cancelDocumentNotifications,
  cancelAllNotifications,
} from '../utils/notifications';
import { CHECKLIST_TEMPLATES } from '../utils/checklists';
import { COUNTER_TEMPLATES } from '../utils/counters';
import { platformStorage } from '../utils/storage';
import { supabase, SUPABASE_SESSION_KEY } from '../utils/supabase';
import { deriveKey, encryptData, decryptData } from '../utils/crypto';

// Guest limits (no account)
const GUEST_DOC_LIMIT = 1;
const GUEST_CHECKLIST_LIMIT = 1;
const GUEST_COUNTER_LIMIT = 1;
const GUEST_FAMILY_LIMIT = 0;       // no family in guest mode
const GUEST_TRIP_LIMIT = 1;         // 1 trip in guest mode
const GUEST_ADDR_LIMIT = 1;         // 1 address in guest mode
// Free account limits
const FREE_DOCUMENT_LIMIT = 2;
const FREE_FAMILY_LIMIT_STORE = 1;
const FREE_FAMILY_DOC_LIMIT = 1;
const FREE_CHECKLIST_LIMIT = 2;
const FREE_COUNTER_LIMIT = 2;
const FREE_TRIP_LIMIT = 2;          // 2 trips per person (user + each family member)
const FREE_ADDR_LIMIT = 2;          // 2 addresses per person (user + each family member)

// ─── Checklist Instance ──────────────────────────────────────
export interface ChecklistInstance {
  templateId: string;
  label: string;
  icon: string;
  items: ChecklistItem[];
}

// ─── Immi Counter Instance ───────────────────────────────────
export interface ImmiCounter {
  templateId: string;  // for template-based; also serves as unique key
  label: string;
  icon: string;
  maxDays: number;
  warnAt: number;
  critAt: number;
  daysUsed: number;
  isTracking: boolean;
  lastIncrementDate: string | null;
  startDate: string | null;
}

// ─── State ───────────────────────────────────────────────────
interface AppStore {
  _hasHydrated: boolean;
  hasOnboarded: boolean;
  visaProfile: string | null;  // e.g. 'f1-opt', 'h1b', etc
  immigrationProfile: {
    firstName: string; lastName: string; phone: string; country: string; location: string;
    visaType: string; startYear: string; statusExpiry: string; i94: string;
    jobTitle: string; employer: string; salary: string; experience: string; degree: string;
    gcStage: string; priorityDate: string; ebCategory: string; i140Status: string; perm: string;
  } | null;
  setImmigrationProfile: (p: AppStore['immigrationProfile']) => void;
  documents: UserDocument[];
  checklists: ChecklistInstance[];
  counters: ImmiCounter[];
  trips: TravelTrip[];
  addressHistory: AddressEntry[];
  familyMembers: FamilyMember[];
  notificationsEnabled: boolean;
  notificationEmail: string | null;   // for email expiry alerts
  whatsappPhone: string | null;        // for WhatsApp alerts
  isPremium: boolean;

  // Auth
  authUser: AuthUser | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastAutoBackupAt: string | null;   // timestamp of last auto-backup to AsyncStorage
  syncError: string | null;

  // PIN
  pinEnabled: boolean;
  pinCode: string | null;
  setPin: (pin: string) => void;
  removePin: () => void;
  verifyPin: (pin: string) => boolean;

  // Documents
  addDocument: (doc: UserDocument) => Promise<boolean>;
  removeDocument: (id: string) => Promise<void>;
  updateDocument: (id: string, updates: Partial<UserDocument>) => Promise<void>;
  canAddDocument: () => boolean;
  canAddChecklist: () => boolean;
  canAddCounter: () => boolean;
  canAddFamilyMember: () => boolean;
  canAddTrip: (memberId?: string) => boolean;     // Per-person: user (no memberId) or specific family member
  canAddAddress: (memberId?: string) => boolean;  // Per-person: user (no memberId) or specific family member
  forceAddDocument: (doc: UserDocument) => void; // bypasses free limit — for profile setup
  getRemainingFreeSlots: () => number;
  setPremium: (v: boolean) => void;
  setNotificationEmail: (email: string | null) => void;
  setWhatsappPhone: (phone: string | null) => void;
  syncAlerts: () => Promise<void>;

  // Checklists
  addChecklist: (templateId: string) => void;
  removeChecklist: (templateId: string) => void;
  toggleChecklistItem: (templateId: string, itemId: string) => void;
  addCustomChecklistItem: (templateId: string, text: string) => void;
  removeChecklistItem: (templateId: string, itemId: string) => void;
  hasChecklist: (templateId: string) => boolean;

  // Immi Counters
  addCounter: (templateId: string) => void;
  addCustomCounter: (label: string, maxDays: number) => void;
  removeCounter: (templateId: string) => void;
  hasCounter: (templateId: string) => boolean;
  incrementCounter: (templateId: string, days?: number) => void;
  decrementCounter: (templateId: string, days?: number) => void;
  resetCounter: (templateId: string) => void;
  setCounterTracking: (templateId: string, isTracking: boolean) => void;
  toggleCounterTracking: (templateId: string) => void;
  autoIncrementCounters: () => void;

  // Travel / I-94 — adds return false if blocked by tier limit
  addTrip: (trip: TravelTrip) => boolean;
  addAddress: (entry: AddressEntry) => boolean;
  removeAddress: (id: string) => void;
  updateAddress: (id: string, updates: Partial<AddressEntry>) => void;
  removeTrip: (id: string) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (id: string) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  addMemberTrip: (memberId: string, trip: TravelTrip) => boolean;
  removeMemberTrip: (memberId: string, tripId: string) => void;
  updateMemberTrip: (memberId: string, tripId: string, updates: Partial<TravelTrip>) => void;
  addMemberAddress: (memberId: string, entry: AddressEntry) => boolean;
  removeMemberAddress: (memberId: string, entryId: string) => void;
  updateMemberAddress: (memberId: string, entryId: string, updates: Partial<AddressEntry>) => void;
  updateTrip: (id: string, updates: Partial<TravelTrip>) => void;

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  setPassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initAuth: () => Promise<void>;

  // Sync
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;

  // Settings
  setNotificationsEnabled: (v: boolean) => void;
  setInAppNotifications: (notifs: any[]) => void;
  dismissEmailVerified: () => void;
  setOnboarded: () => void;
  anyModalOpen: boolean;
  setAnyModalOpen: (v: boolean) => void;
  showAuthModal: boolean;
  authModalMessage: string;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
  showPaywallModal: boolean;
  emailVerified: boolean;
  profileSetupShown: boolean;  // true after profile modal shown once
  pendingProfileSetup: boolean; // true if profile modal should show when MainTabs mounts
  cloudBackupEnabled: boolean;  // premium only — auto-sync to Supabase
  setCloudBackupEnabled: (v: boolean) => void;
  showCloudBackupPrompt: boolean;  // shown right after upgrading to premium
  closeCloudBackupPrompt: () => void;
  notifications: any[];             // in-app notification center items
  isGuestMode: boolean;       // true = using without account
  showWelcomeModal: boolean;  // first-visit chooser
  setGuestMode: (v: boolean) => void;
  openPaywall: () => void;
  closePaywall: () => void;
  openProfileModal: () => void;  // set by MainTabs after mount
  openSearch: () => void;           // set by MainTabs after mount
  setVisaProfile: (profile: string) => void;
  resetAllData: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
  exportData: () => string;
  importData: (json: string) => boolean;
}

// Local-time date string (YYYY-MM-DD). Using toISOString() returns UTC date,
// which causes off-by-1-day bugs in any non-UTC timezone — e.g. for a user
// in UTC-5, at 8pm local on April 22, toISOString() returns "2026-04-23"
// while their wall clock still says April 22.
const today = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const FREE_LIMIT = FREE_DOCUMENT_LIMIT;
export const GUEST_LIMIT = GUEST_DOC_LIMIT;
export { GUEST_CHECKLIST_LIMIT, GUEST_COUNTER_LIMIT, GUEST_FAMILY_LIMIT, GUEST_TRIP_LIMIT, GUEST_ADDR_LIMIT };
export { FREE_FAMILY_DOC_LIMIT, FREE_TRIP_LIMIT, FREE_ADDR_LIMIT };

// Module-level flag — prevents visibilitychange listener accumulating across
// multiple initAuth calls (dev hot-reload, StrictMode double-invoke, etc.)
let _visibilityListenerRegistered = false;

// ─── Sync helper — premium + cloudBackupEnabled only ─────────
// Key used for the rolling auto-backup in AsyncStorage / localStorage
const AUTO_BACKUP_KEY = 'statusvault_auto_backup';
const AUTO_BACKUP_DATE_KEY = 'statusvault_auto_backup_date';

// ─── Auto-backup: write full JSON to device storage silently ─────
// Single overwrite key — never accumulates, always latest snapshot.
// Storage impact: ~36KB even for heavy users (1.5% of 5MB localStorage limit).
// Debounced at 2s so rapid mutations (bulk import, adding many docs) coalesce
// into one write. On mobile (future): swap platformStorage for expo-file-system
// to land the file in the Files app, visible to the user without the app open.
let _autoBackupTimer: ReturnType<typeof setTimeout> | null = null;

const writeAutoBackup = () => {
  // Debounce: collapse rapid mutations into one write per 2 seconds
  if (_autoBackupTimer) clearTimeout(_autoBackupTimer);
  _autoBackupTimer = setTimeout(() => {
    _autoBackupTimer = null;
    try {
      const state = useStore.getState();
      // Compact JSON (no pretty-print) — saves ~10% space vs JSON.stringify(obj, null, 2)
      const json = JSON.stringify({
        app: 'StatusVault', version: '2.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          documents:          state.documents,
          checklists:         state.checklists,
          counters:           state.counters,
          trips:              state.trips,
          addressHistory:     state.addressHistory,
          familyMembers:      state.familyMembers,
          visaProfile:        state.visaProfile,
          immigrationProfile: state.immigrationProfile,
          notificationEmail:  state.notificationEmail,
          whatsappPhone:      state.whatsappPhone,
          isPremium:          state.isPremium,
        },
      });
      const now = new Date().toISOString();
      // Single key — always overwritten, never accumulates
      platformStorage.setItem(AUTO_BACKUP_KEY, json);
      platformStorage.setItem(AUTO_BACKUP_DATE_KEY, now);
      useStore.setState({ lastAutoBackupAt: now });
    } catch {
      // Silent fail — auto-backup is best-effort, never blocks the user
    }
  }, 2000); // 2s debounce — coalesces bursts of mutations into one write
};

const scheduleSync = () => {
  // Auto-backup to device storage on every mutation (device is always source of truth)
  writeAutoBackup();
  const { authUser, isPremium, cloudBackupEnabled, isSyncing } = useStore.getState();
  if (authUser && isPremium && cloudBackupEnabled) {
    clearTimeout((scheduleSync as any)._t);
    // If already syncing, wait a bit longer to avoid overlapping requests
    const delay = isSyncing ? 3000 : 1500;
    (scheduleSync as any)._t = setTimeout(() => {
      // Re-read state at execution time (not closure time)
      const s = useStore.getState();
      if (s.authUser && s.isPremium && s.cloudBackupEnabled) {
        s.syncToCloud();
      }
    }, delay);
  }
};

// ─── Immediate sync for critical travel/address mutations ────
const syncNow = () => {
  writeAutoBackup();
  const s = useStore.getState();
  if (s.authUser && s.isPremium && s.cloudBackupEnabled) {
    clearTimeout((scheduleSync as any)._t);
    s.syncToCloud().catch(() => {});
  }
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      hasOnboarded: false,
      profileSetupShown: false,
      pendingProfileSetup: false,
      cloudBackupEnabled: false,  // default OFF — user explicitly opts in for premium privacy
      showCloudBackupPrompt: false,
      notifications: [],
      visaProfile: null,
      immigrationProfile: null,
      documents: [],
      checklists: [],
      counters: [],
      trips: [],
      addressHistory: [],
      familyMembers: [],
      anyModalOpen: false,
      showAuthModal: false,
      authModalMessage: 'Sign in to continue',
      showPaywallModal: false,
      notificationsEnabled: true,
      notificationEmail: null,
      whatsappPhone: null,
      isPremium: false,

      // Auth
      authUser: null,
      isSyncing: false,
      lastSyncedAt: null,
      syncError: null,
      lastAutoBackupAt: null,

      // ─── PIN ───────────────────────────────────────────────
      pinEnabled: false,
      pinCode: null,
      setPin: (pin) => { set({ pinEnabled: true, pinCode: pin }); scheduleSync(); },
      removePin: () => { set({ pinEnabled: false, pinCode: null }); scheduleSync(); },
      verifyPin: (pin) => get().pinCode === pin,

      // ─── Paywall ───────────────────────────────────────────
      forceAddDocument: async (doc) => {
        // Bypasses free limit — used by profile setup wizard and family member docs
        let notificationIds: string[] = [];
        if (get().notificationsEnabled) {
          try { notificationIds = await scheduleDocumentNotifications(doc); } catch {}
        }
        set((s) => ({ documents: [...s.documents, { ...doc, notificationIds }] }));
        scheduleSync();
      },
      canAddChecklist: () => {
        const { checklists, isPremium, authUser, isGuestMode } = get();
        if (isPremium) return true;
        // Guest or not logged in: max 1
        if (!authUser || isGuestMode) return checklists.length < GUEST_CHECKLIST_LIMIT;
        // Free account: max 2
        return checklists.length < FREE_CHECKLIST_LIMIT;
      },
      canAddCounter: () => {
        const { counters, isPremium, authUser, isGuestMode } = get();
        if (isPremium) return true;
        // Guest or not logged in: max 1
        if (!authUser || isGuestMode) return counters.length < GUEST_COUNTER_LIMIT;
        // Free account: max 2
        return counters.length < FREE_COUNTER_LIMIT;
      },
      canAddFamilyMember: () => {
        const { familyMembers, isPremium, authUser, isGuestMode } = get();
        if (isPremium) return true;
        // Guest or not logged in: no family allowed
        if (!authUser || isGuestMode) return false;
        // Free account: max 1 family member
        return familyMembers.length < FREE_FAMILY_LIMIT_STORE;
      },
      canAddDocument: () => {
        const { documents, isPremium, authUser, isGuestMode } = get();
        if (isPremium) return true;
        // Guest or not logged in: max 1
        if (!authUser || isGuestMode) return documents.length < GUEST_DOC_LIMIT;
        // Free account: max 2
        return documents.length < FREE_DOCUMENT_LIMIT;
      },
      // Trips and addresses are per-person: the user has their own pool, and each
      // family member has their own pool. memberId selects which pool.
      canAddTrip: (memberId) => {
        const { trips, familyMembers, isPremium, authUser, isGuestMode } = get();
        if (isPremium) return true;
        const list = memberId
          ? (familyMembers.find((m) => m.id === memberId)?.trips ?? [])
          : trips;
        // Guest or not logged in: max 1
        if (!authUser || isGuestMode) return list.length < GUEST_TRIP_LIMIT;
        // Free account: max 2 per person
        return list.length < FREE_TRIP_LIMIT;
      },
      canAddAddress: (memberId) => {
        const { addressHistory, familyMembers, isPremium, authUser, isGuestMode } = get();
        if (isPremium) return true;
        const list = memberId
          ? (familyMembers.find((m) => m.id === memberId)?.addressHistory ?? [])
          : addressHistory;
        // Guest or not logged in: max 1
        if (!authUser || isGuestMode) return list.length < GUEST_ADDR_LIMIT;
        // Free account: max 2 per person
        return list.length < FREE_ADDR_LIMIT;
      },
      getRemainingFreeSlots: () => {
        const { documents, isPremium } = get();
        return isPremium ? 999 : Math.max(0, FREE_DOCUMENT_LIMIT - documents.length);
      },
      setPremium: (v) => {
        if (v && !get().isPremium) {
          // First-time premium: keep cloud backup OFF by default and show the opt-in prompt
          set({ isPremium: true, cloudBackupEnabled: false, showCloudBackupPrompt: true });
        } else {
          set({ isPremium: v });
        }
      },
      closeCloudBackupPrompt: () => set({ showCloudBackupPrompt: false }),
      setNotificationEmail: (email) => { set({ notificationEmail: email }); scheduleSync(); },
      setWhatsappPhone: (phone) => { set({ whatsappPhone: phone }); scheduleSync(); },

      // ─── Documents ─────────────────────────────────────────
      addDocument: async (doc) => {
        if (!get().canAddDocument()) return false;
        let notificationIds: string[] = [];
        if (get().notificationsEnabled) {
          try { notificationIds = await scheduleDocumentNotifications(doc); } catch {}
        }
        set((s) => ({
          documents: [...s.documents, { ...doc, notificationIds }],
        }));
        scheduleSync();
        return true;
      },
      removeDocument: async (id) => {
        const doc = get().documents.find((d) => d.id === id);
        if (doc?.notificationIds?.length) await cancelDocumentNotifications(doc.notificationIds);
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
        scheduleSync();
      },
      updateDocument: async (id, updates) => {
        const doc = get().documents.find((d) => d.id === id);
        if (doc?.notificationIds?.length) {
          try { await cancelDocumentNotifications(doc.notificationIds); } catch {}
        }
        let notificationIds: string[] = [];
        if (get().notificationsEnabled) {
          try { notificationIds = await scheduleDocumentNotifications({ ...doc!, ...updates } as UserDocument); } catch {}
        }
        set((s) => ({
          documents: s.documents.map((d) => d.id === id ? { ...d, ...updates, notificationIds } : d),
        }));
        scheduleSync();
      },

      // ─── Checklists ───────────────────────────────────────
      addChecklist: (templateId) => {
        const t = CHECKLIST_TEMPLATES.find((x) => x.id === templateId);
        if (!t || get().checklists.some((c) => c.templateId === templateId)) return;
        // Bug 30 fix: enforce tier limit inside the action, not just in UI
        if (!get().canAddChecklist()) return;
        set((s) => ({
          checklists: [...s.checklists, {
            templateId: t.id, label: t.label, icon: t.icon,
            items: t.items.map((i) => ({ ...i, done: false })),
          }],
        }));
        scheduleSync();
      },
      removeChecklist: (templateId) => {
        set((s) => ({ checklists: s.checklists.filter((c) => c.templateId !== templateId) }));
        scheduleSync();
      },
      toggleChecklistItem: (templateId, itemId) => {
        set((s) => ({
          checklists: s.checklists.map((cl) =>
            cl.templateId === templateId
              ? { ...cl, items: cl.items.map((i) => i.id === itemId ? { ...i, done: !i.done } : i) }
              : cl
          ),
        }));
        scheduleSync();
      },
      addCustomChecklistItem: (templateId, text) => {
        set((s) => ({
          checklists: s.checklists.map((cl) =>
            cl.templateId === templateId
              ? { ...cl, items: [...cl.items, { id: `c-${Date.now()}-${Math.random().toString(36).slice(2,7)}`, text, done: false, category: 'Custom' }] }
              : cl
          ),
        }));
        scheduleSync();
      },
      removeChecklistItem: (templateId, itemId) => {
        set((s) => ({
          checklists: s.checklists.map((cl) =>
            cl.templateId === templateId
              ? { ...cl, items: cl.items.filter((i) => i.id !== itemId) }
              : cl
          ),
        }));
        scheduleSync();
      },
      hasChecklist: (templateId) => get().checklists.some((c) => c.templateId === templateId),

      // ─── Immi Counters ─────────────────────────────────────
      addCounter: (templateId) => {
        const t = COUNTER_TEMPLATES.find((x) => x.id === templateId);
        if (!t || get().counters.some((c) => c.templateId === templateId)) return;
        // Bug 30 fix: enforce tier limit inside the action
        if (!get().canAddCounter()) return;
        set((s) => ({
          counters: [...s.counters, {
            templateId: t.id, label: t.label, icon: t.icon,
            maxDays: t.maxDays, warnAt: t.warnAt, critAt: t.critAt,
            daysUsed: 0, isTracking: false, lastIncrementDate: null, startDate: null,
          }],
        }));
        scheduleSync();
      },
      addCustomCounter: (label, maxDays) => {
        // Bug 30 fix: enforce tier limit for custom counters too
        if (!get().canAddCounter()) return;
        // Validate maxDays — must be a positive integer
        if (!maxDays || maxDays < 1 || !Number.isFinite(maxDays)) return;
        const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        set((s) => ({
          counters: [...s.counters, {
            templateId: id, label, icon: '🔢', maxDays,
            warnAt: Math.floor(maxDays * 0.7), critAt: Math.floor(maxDays * 0.9),
            daysUsed: 0, isTracking: false, lastIncrementDate: null, startDate: null,
          }],
        }));
        scheduleSync();
      },
      removeCounter: (templateId) => {
        set((s) => ({ counters: s.counters.filter((c) => c.templateId !== templateId) }));
        scheduleSync();
      },
      hasCounter: (templateId) => get().counters.some((c) => c.templateId === templateId),
      incrementCounter: (templateId, days = 1) => {
        set((s) => ({
          counters: s.counters.map((c) =>
            c.templateId === templateId
              ? { ...c, daysUsed: Math.min(c.maxDays, c.daysUsed + days) } : c
          ),
        }));
        scheduleSync();
      },
      decrementCounter: (templateId, days = 1) => {
        set((s) => ({
          counters: s.counters.map((c) =>
            c.templateId === templateId
              ? { ...c, daysUsed: Math.max(0, c.daysUsed - days) } : c
          ),
        }));
        scheduleSync();
      },
      resetCounter: (templateId) => {
        set((s) => ({
          counters: s.counters.map((c) =>
            c.templateId === templateId
              ? { ...c, daysUsed: 0, isTracking: false, lastIncrementDate: null, startDate: null } : c
          ),
        }));
        scheduleSync();
      },
      setCounterTracking: (templateId, isTracking) => {
        set((s) => ({
          counters: s.counters.map((c) =>
            c.templateId === templateId
              ? { ...c, isTracking, startDate: isTracking ? today() : c.startDate, lastIncrementDate: isTracking ? today() : null } : c
          ),
        }));
        scheduleSync();
      },
      // Bug 1 fix: toggleCounterTracking was called in CounterScreen but missing from store
      toggleCounterTracking: (templateId) => {
        const counter = get().counters.find((c) => c.templateId === templateId);
        if (!counter) return;
        get().setCounterTracking(templateId, !counter.isTracking);
      },
      autoIncrementCounters: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        set((s) => ({
          counters: s.counters.map((c) => {
            if (!c.isTracking || !c.lastIncrementDate) return c;
            // Fix: append T00:00:00 to force LOCAL time parsing.
            // Without it, 'YYYY-MM-DD' parses as UTC midnight, which in
            // UTC-5 (CDT) becomes yesterday, causing an off-by-1 increment.
            const last = new Date(c.lastIncrementDate + 'T00:00:00');
            last.setHours(0, 0, 0, 0);
            const diff = Math.floor((now.getTime() - last.getTime()) / 86400000);
            if (diff <= 0) return c;
            return { ...c, daysUsed: Math.min(c.maxDays, c.daysUsed + diff), lastIncrementDate: today() };
          }),
        }));
      },

      // ─── Travel / I-94 ─────────────────────────────────────
      addTrip: (trip) => {
        if (!get().canAddTrip()) return false;
        set((s) => ({ trips: [...s.trips, trip] }));
        syncNow();
        return true;
      },
      addAddress: (entry) => {
        if (!get().canAddAddress()) return false;
        set((s) => ({ addressHistory: [entry, ...s.addressHistory] }));
        syncNow();
        return true;
      },
      removeAddress: (id) => {
        set((s) => ({ addressHistory: s.addressHistory.filter((a) => a.id !== id) }));
        syncNow();
      },
      updateAddress: (id, updates) => {
        set((s) => ({ addressHistory: s.addressHistory.map((a) => a.id === id ? { ...a, ...updates } : a) }));
        syncNow();
      },
      addFamilyMember: (member) => {
        // Bug 34 fix: enforce tier limit inside the action
        if (!get().canAddFamilyMember()) return;
        set((s) => ({ familyMembers: [...s.familyMembers, { trips: [], addressHistory: [], ...member }] }));
        syncNow();
      },

      removeFamilyMember: (id) => {
        set((s) => ({ familyMembers: s.familyMembers.filter((m) => m.id !== id) }));
        syncNow();
      },

      updateFamilyMember: (id, updates) => {
        set((s) => ({
          familyMembers: s.familyMembers.map((m) => m.id === id ? { ...m, ...updates } : m),
        }));
        syncNow();
      },

      addMemberTrip: (memberId, trip) => {
        if (!get().canAddTrip(memberId)) return false;
        set((s) => ({ familyMembers: s.familyMembers.map((m) => m.id === memberId ? { ...m, trips: [...(m.trips ?? []), trip] } : m) }));
        syncNow();
        return true;
      },
      removeMemberTrip: (memberId, tripId) => {
        set((s) => ({ familyMembers: s.familyMembers.map((m) => m.id === memberId ? { ...m, trips: (m.trips ?? []).filter((t) => t.id !== tripId) } : m) }));
        syncNow();
      },
      updateMemberTrip: (memberId, tripId, updates) => {
        set((s) => ({ familyMembers: s.familyMembers.map((m) => m.id === memberId ? { ...m, trips: (m.trips ?? []).map((t) => t.id === tripId ? { ...t, ...updates } : t) } : m) }));
        syncNow();
      },
      addMemberAddress: (memberId, entry) => {
        if (!get().canAddAddress(memberId)) return false;
        set((s) => ({ familyMembers: s.familyMembers.map((m) => m.id === memberId ? { ...m, addressHistory: [entry, ...(m.addressHistory ?? [])] } : m) }));
        syncNow();
        return true;
      },
      removeMemberAddress: (memberId, entryId) => {
        set((s) => ({ familyMembers: s.familyMembers.map((m) => m.id === memberId ? { ...m, addressHistory: (m.addressHistory ?? []).filter((a) => a.id !== entryId) } : m) }));
        syncNow();
      },
      updateMemberAddress: (memberId, entryId, updates) => {
        set((s) => ({ familyMembers: s.familyMembers.map((m) => m.id === memberId ? { ...m, addressHistory: (m.addressHistory ?? []).map((a) => a.id === entryId ? { ...a, ...updates } : a) } : m) }));
        syncNow();
      },

      removeTrip: (id) => {
        set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }));
        syncNow();
      },
      updateTrip: (id, updates) => {
        set((s) => ({
          trips: s.trips.map((t) => t.id === id ? { ...t, ...updates } : t),
        }));
        syncNow();
      },

      // ─── Auth ──────────────────────────────────────────────
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) {
          // Clear guest mode immediately on successful login
          set({ isGuestMode: false });
        }
        if (error) {
          const msg = error.message.toLowerCase();
          // Only show "verify email" for the specific Supabase "email not confirmed" error
          if (msg.includes('email not confirmed')) {
            return { error: 'Your email is not verified yet. Check your inbox for the confirmation link.' };
          }
          // Wrong credentials — do NOT mention email verification here
          if (msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('wrong password') || msg.includes('user not found')) {
            return { error: 'Incorrect email or password. Please check and try again.' };
          }
          if (msg.includes('too many requests') || msg.includes('rate limit')) {
            return { error: 'Too many attempts. Please wait a few minutes and try again.' };
          }
          return { error: `${error.message} (${error.status ?? ''})` };
        }
        const user = data.user;
        set({
          authUser: {
            id: user.id,
            email: user.email!,
            createdAt: user.created_at,
          },
        });
        // Pull cloud data after sign in
        await get().syncFromCloud();
        return { error: null };
      },

      signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (!error) set({ isGuestMode: false });
        if (error) return { error: error.message };
        if (data.user && !data.session) {
          // Email confirmation required
          return { error: null };
        }
        if (data.user) {
          set({
            authUser: {
              id: data.user.id,
              email: data.user.email!,
              createdAt: data.user.created_at,
            },
          });
          // Upload local data to fresh account
          await get().syncToCloud();
        }
        return { error: null };
      },

      sendMagicLink: async (email) => {
        // Native: use deep link scheme. Web: use origin URL.
        const redirectTo = Platform.OS !== 'web'
          ? 'statusvault://auth'
          : (typeof window !== 'undefined' && window.location.hostname === 'localhost'
              ? window.location.origin
              : 'https://www.statusvault.org');
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
        });
        if (error) return { error: error.message };
        return { error: null };
      },

      signInWithPassword: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = error.message.toLowerCase();
          if (msg.includes('email not confirmed'))
            return { error: 'Please verify your email first.' };
          if (msg.includes('invalid') || msg.includes('credentials'))
            return { error: 'Incorrect email or password.' };
          return { error: error.message };
        }
        set({ isGuestMode: false });
        return { error: null };
      },

      setPassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { error: error.message };
        return { error: null };
      },

      signOut: async () => {
        // Flush any pending sync BEFORE signing out so latest data is in cloud
        const s = useStore.getState();
        if (s.authUser && s.isPremium && s.cloudBackupEnabled) {
          clearTimeout((scheduleSync as any)._t);
          try { await s.syncToCloud(); } catch {}
        }
        // Bug 62 fix: always clear local state even if signOut API call fails (offline)
        try { await supabase.auth.signOut(); } catch {}
        // Bug 60a: clear isPremium so next user on same device doesn't inherit it
        // Privacy fix: clear ALL user data on sign-out — trips/addressHistory/docs must
        // not be visible if someone else opens the browser after you sign out.
        // UX fix: hasOnboarded=false + showWelcomeModal=true so after the reload the
        // user actually sees the Welcome screen, providing visual confirmation that
        // sign-out worked (otherwise they land on a blank Dashboard and think nothing happened).
        set({
          authUser: null, lastSyncedAt: null, syncError: null,
          emailVerified: false, isGuestMode: false,
          hasOnboarded: false, showWelcomeModal: true,
          isPremium: false, cloudBackupEnabled: false,
          // Clear all user data
          documents:          [],
          checklists:         [],
          counters:           [],
          trips:              [],
          addressHistory:     [],
          familyMembers:      [],
          visaProfile:        null,
          immigrationProfile: null,
          notificationEmail:  null,
          whatsappPhone:      null,
          notifications:      [],
          lastAutoBackupAt:   null,
          pinEnabled:         false,
          pinCode:            null,
          profileSetupShown:  false,
        });
        // Bug 60b: reload only on web — native just re-renders via state reset above
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // Clear Supabase session token from localStorage too — if it lingers, the
          // welcome modal suppression logic in AppNavigator will see it and skip the
          // welcome modal even though we just cleared authUser in state.
          try { localStorage.removeItem('sb-auth-token'); } catch {}
          setTimeout(() => window.location.reload(), 100);
        }
        // On native: no reload needed — Zustand state reset above causes re-render
        // and the app navigates back to welcome screen automatically
      },

      deleteAccount: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Delete all cloud data rows for this user
            await supabase.from('user_data').delete().eq('user_id', user.id);
            await supabase.from('user_alerts').delete().eq('user_id', user.id);
            // Call edge function to hard-delete the Supabase auth user
            // (supabase.auth.admin is server-side only; we use an edge function instead)
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (session?.access_token) {
                await fetch(
                  'https://gekhrdqkaadqeeebzvlu.supabase.co/functions/v1/delete-user',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({ userId: user.id }),
                  }
                );
              }
            } catch { /* Edge fn unavailable — auth row remains but data is cleared */ }
          }
          await supabase.auth.signOut();
          await get().resetAllData();
          return { error: null };
        } catch (e: any) {
          return { error: e.message ?? 'Failed to delete account' };
        }
      },

      initAuth: async () => {
        let initialSyncDone = false;

        // Bug 11 fix: register visibility listener only once (module-level flag prevents
        //             accumulation across hot-reloads / StrictMode double-invokes)
        // Bug 12 fix: only sync on tab/app focus for premium+cloudBackup users
        if (Platform.OS === 'web') {
          // Web: use visibilitychange event
          if (typeof document !== 'undefined' && !_visibilityListenerRegistered) {
            _visibilityListenerRegistered = true;
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                const s = useStore.getState();
                if (s.authUser && s.isPremium && s.cloudBackupEnabled) {
                  s.syncFromCloud().catch(() => {});
                }
              }
            });
          }
        } else {
          // Native: use AppState to sync when app comes to foreground
          if (!_visibilityListenerRegistered) {
            _visibilityListenerRegistered = true;
            const { AppState } = require('react-native');
            AppState.addEventListener('change', (nextState: string) => {
              if (nextState === 'active') {
                const s = useStore.getState();
                if (s.authUser && s.isPremium && s.cloudBackupEnabled) {
                  s.syncFromCloud().catch(() => {});
                }
              }
            });
          }
        }

        // ── URL token handling ──────────────────────────────────────
        // detectSessionInUrl:true handles both implicit (#access_token=) and PKCE
        // (?code=) automatically — it fires onAuthStateChange(SIGNED_IN, session).
        // We must NOT touch the URL before the SDK reads it, so we only clean up
        // AFTER onAuthStateChange fires (handled in that listener below).
        //
        // The one exception: token_hash (legacy OTP email format) requires a manual
        // verifyOtp call because it's not handled by detectSessionInUrl.
        if (typeof window !== 'undefined') {
          const hash         = window.location.hash;
          const search       = window.location.search;
          const hashParams   = new URLSearchParams(hash.replace('#', '?'));
          const searchParams = new URLSearchParams(search);
          const tokenHash    = hashParams.get('token_hash') || searchParams.get('token_hash');
          const type         = hashParams.get('type') || searchParams.get('type');

          // Legacy token_hash OTP format — not handled by detectSessionInUrl
          if (tokenHash && (type === 'signup' || type === 'email' || type === 'magiclink')) {
            try {
              const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
              if (!error && data.session) {
                const isFirst = !get().profileSetupShown;
                set({
                  authUser: { id: data.session.user.id, email: data.session.user.email!, createdAt: data.session.user.created_at },
                  emailVerified: true,
                  isGuestMode: false,
                  hasOnboarded: true,
                  showWelcomeModal: false,
                  showAuthModal: false,
                  profileSetupShown: true,
                });
                initialSyncDone = true;
                try { await get().syncFromCloud(); } catch {}
                if (isFirst && !get().immigrationProfile) set({ pendingProfileSetup: true });
              }
            } catch {}
            window.history.replaceState(null, '', window.location.pathname);
          }
        }

        // Listen for ALL auth changes — covers OAuth redirects, sign in, sign out
        supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            set({
              authUser: {
                id: session.user.id,
                email: session.user.email!,
                createdAt: session.user.created_at,
              },
            });
            // Clean auth params from URL after successful sign-in
            // Covers both implicit (#access_token=) and PKCE (?code=) formats
            if (event === 'SIGNED_IN' && typeof window !== 'undefined') {
              const needsClean = window.location.hash.includes('access_token') ||
                                 window.location.search.includes('code=');
              if (needsClean) window.history.replaceState(null, '', window.location.pathname);
            }
            // Only sync from auth listener if getSession didn't already do it
            if (!initialSyncDone) {
              initialSyncDone = true;
              try { await get().syncFromCloud(); } catch {}
            }
            // Clear guest mode when user signs in + close any open auth modal
            if (event === 'SIGNED_IN') {
              set({
                isGuestMode: false,
                hasOnboarded: true,
                showWelcomeModal: false,
                showAuthModal: false,   // close auth modal automatically
                authModalMessage: '',
              });
            }
            // Trigger profile setup on first login via Google OAuth (no URL token)
            // Only if profileSetupShown is false AND we haven't already processed a URL token
            if (event === 'SIGNED_IN' && !get().profileSetupShown) {
              set({ profileSetupShown: true });
              if (!get().immigrationProfile) {
                set({ pendingProfileSetup: true });
              }
            }
          } else if (event === 'SIGNED_OUT') {
            // Bug 45 fix + privacy fix: clear all user data so it's not visible after logout
            set({
              authUser: null, lastSyncedAt: null, syncError: null,
              emailVerified: false, isPremium: false, cloudBackupEnabled: false,
              lastAutoBackupAt: null,
              documents:          [],
              checklists:         [],
              counters:           [],
              trips:              [],
              addressHistory:     [],
              familyMembers:      [],
              visaProfile:        null,
              immigrationProfile: null,
              notificationEmail:  null,
              whatsappPhone:      null,
              notifications:      [],
              pinEnabled:         false,
              pinCode:            null,
              profileSetupShown:  false,
            });
          }
        });

        // Check existing session on startup (page refresh)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            initialSyncDone = true;
            // Set hasOnboarded FIRST so welcome modal never shows for logged-in users
            set({
              authUser: {
                id: session.user.id,
                email: session.user.email!,
                createdAt: session.user.created_at,
              },
              hasOnboarded: true,
              showWelcomeModal: false,
              isGuestMode: false,
            });
            try { await get().syncFromCloud(); } catch {}
          }
        } catch {}
      },

      // ─── Sync ──────────────────────────────────────────────
      syncToCloud: async () => {
        const { isPremium, cloudBackupEnabled } = get();
        if (!isPremium || !cloudBackupEnabled) return;
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;
        const { authUser: storeAuth, documents, checklists, counters, trips } = get();
        const email = storeAuth?.email ?? user.email ?? '';
        // Bug 85 fix: never encrypt with empty key — would use same key for all no-email accounts
        if (!email) { set({ isSyncing: false, syncError: 'Cannot sync: email not available' }); return; }
        set({ isSyncing: true, syncError: null });
        try {
          const key  = deriveKey(user.id, email);
          const { familyMembers, visaProfile } = get();
          const { notificationEmail, whatsappPhone } = get();
          const blob = { documents, checklists, counters, trips, addressHistory: get().addressHistory, familyMembers, visaProfile, immigrationProfile: get().immigrationProfile, isPremium, notificationEmail, whatsappPhone, syncedAt: new Date().toISOString() };
          const data_encrypted = encryptData(blob, key);
          // Try upsert first, fall back to update if upsert fails
          let { error } = await supabase
            .from('user_data')
            .upsert(
              { user_id: user.id, data_encrypted },
              { onConflict: 'user_id', ignoreDuplicates: false }
            );
          if (error) {
            // Fallback: explicit update
            const { error: updateError } = await supabase
              .from('user_data')
              .update({ data_encrypted })
              .eq('user_id', user.id);
            if (updateError) throw new Error(updateError.message);
          }
          set({ lastSyncedAt: new Date().toISOString(), isSyncing: false, syncError: null });
        } catch (e: any) {
          set({ isSyncing: false, syncError: e.message ?? 'Sync failed' });
        }
      },

      syncFromCloud: async () => {
        const { cloudBackupEnabled, isPremium } = get();
        // Only premium users with backup enabled have cloud data
        if (!isPremium || cloudBackupEnabled === false) return;

        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        const { authUser: storeAuth } = get();
        const email = storeAuth?.email ?? user.email ?? '';
        // Bug 85 fix: never decrypt with empty key
        if (!email) return;

        // Silently check if cloud data exists — no loading spinner for free users
        // This is a lightweight SELECT that costs nothing if no row exists
        try {
          const { data, error } = await supabase
            .from('user_data')
            .select('data_encrypted, updated_at')
            .eq('user_id', user.id)
            .single();

          // PGRST116 = no row found — free user, nothing to restore, silent return
          if (error?.code === 'PGRST116' || !data) { set({ isSyncing: false }); return; }

          // Row exists → this user has/had premium. Decrypt and restore.
          if (error) throw new Error(error.message);

          set({ isSyncing: true, syncError: null });
          const key     = deriveKey(user.id, email);
          const decoded = decryptData(data.data_encrypted, key) as any;
          if (!decoded) throw new Error('Decryption failed');

          // ── Merge cloud into local (device is source of truth) ──────────
          // We never blindly overwrite local with cloud. Instead we merge by ID
          // so that items added offline on this device are preserved.
          const local = get();

          // Merge arrays by id: keep all local items + any cloud items not in local
          const mergeById = (localArr: any[], cloudArr: any[]) => {
            if (!cloudArr?.length) return localArr;
            if (!localArr?.length) return cloudArr.map((d: any) => ({ ...d, notificationIds: [] }));
            const localIds = new Set(localArr.map((x: any) => x.id));
            const cloudOnlyItems = cloudArr
              .filter((x: any) => !localIds.has(x.id))
              .map((d: any) => ({ ...d, notificationIds: [] })); // strip foreign notif IDs
            // Strip notificationIds from local items too (wrong device's IDs)
            const localStripped = localArr.map((d: any) => ({ ...d, notificationIds: [] }));
            return [...localStripped, ...cloudOnlyItems];
          };

          const mergedDocs     = mergeById(local.documents,      decoded.documents      ?? []);
          const mergedTrips    = mergeById(local.trips,          decoded.trips          ?? []);
          const mergedAddresses= mergeById(local.addressHistory, decoded.addressHistory ?? []);
          const mergedCounters = mergeById(local.counters,       decoded.counters       ?? []);
          const mergedChecklists = mergeById(local.checklists,   decoded.checklists     ?? []);

          // Family members: merge by id, and also merge their nested trips/addresses
          const localMemberIds = new Set(local.familyMembers.map((m: any) => m.id));
          const cloudOnlyMembers = (decoded.familyMembers ?? [])
            .filter((m: any) => !localMemberIds.has(m.id));
          const mergedMembers = [
            ...local.familyMembers.map((m: any) => {
              const cloudMember = (decoded.familyMembers ?? []).find((cm: any) => cm.id === m.id);
              if (!cloudMember) return m;
              return {
                ...m,
                trips:          mergeById(m.trips ?? [],          cloudMember.trips          ?? []),
                addressHistory: mergeById(m.addressHistory ?? [], cloudMember.addressHistory ?? []),
                documentIds:    Array.from(new Set([...(m.documentIds ?? []), ...(cloudMember.documentIds ?? [])])),
              };
            }),
            ...cloudOnlyMembers,
          ];

          set({
            documents:          mergedDocs,
            checklists:         mergedChecklists,
            counters:           mergedCounters,
            trips:              mergedTrips,
            familyMembers:      mergedMembers,
            addressHistory:     mergedAddresses,
            // For scalar fields: prefer local if set, fall back to cloud
            visaProfile:        local.visaProfile        ?? decoded.visaProfile        ?? null,
            immigrationProfile: local.immigrationProfile ?? decoded.immigrationProfile ?? null,
            notificationEmail:  local.notificationEmail  ?? decoded.notificationEmail  ?? null,
            whatsappPhone:      local.whatsappPhone      ?? decoded.whatsappPhone      ?? null,
            isPremium:          decoded.isPremium         ?? local.isPremium,
            lastSyncedAt:       data.updated_at,
            isSyncing:          false,
          });
          // After merge, push merged result back to cloud so both are in sync
          setTimeout(() => { get().syncToCloud().catch(() => {}); }, 2000);
          // Reschedule notifications for all restored docs on this device
          if (get().notificationsEnabled) {
            restoredDocs.forEach(async (doc: any) => {
              try {
                const ids = await scheduleDocumentNotifications(doc);
                set((s) => ({
                  documents: s.documents.map((d) => d.id === doc.id ? { ...d, notificationIds: ids } : d),
                }));
              } catch {}
            });
          }
        } catch (e: any) {
          set({ isSyncing: false, syncError: e.message ?? 'Sync failed' });
        }
      },

      // ─── Alert sync (DISABLED — email/WhatsApp alerts pending edge function setup)
      syncAlerts: async (_triggerImmediate = false) => {
        // Email/WhatsApp notifications disabled. Local push notifications (iOS/Android)
        // are still fully functional via scheduleDocumentNotifications.
        return;
        // Dead code below preserved for future re-enablement:
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { documents, notificationEmail, whatsappPhone } = get();
        if (!notificationEmail && !whatsappPhone) return;

        // Find docs expiring within 180 days
        const nowTs = new Date(); // Bug 93 fix: renamed from 'today' to avoid shadowing module-level today()
        const expiringDocs = documents
          .map(d => {
            const expiry = new Date(d.expiryDate);
            const days = Math.floor((expiry.getTime() - nowTs.getTime()) / 86400000);
            return { id: d.id, label: d.label, icon: d.icon, expiryDate: d.expiryDate, days };
          })
          .filter(d => d.days <= 180);

        // Write to user_alerts table
        await supabase.from('user_alerts').upsert({
          user_id: session.user.id,
          notification_email: notificationEmail,
          whatsapp_phone: whatsappPhone,
          expiring_docs: expiringDocs,
        }, { onConflict: 'user_id' });

        // If triggered by a new/edited doc and something is within 180 days — fire immediately
        if (triggerImmediate && expiringDocs.length > 0) {
          try {
            const { data: { session: s } } = await supabase.auth.getSession();
            if (s?.access_token) {
              await fetch(
                'https://gekhrdqkaadqeeebzvlu.supabase.co/functions/v1/check-expiry-alerts',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${s.access_token}`,
                  },
                  body: JSON.stringify({ userId: session.user.id }),
                }
              );
            }
          } catch {
            // Silent fail — daily cron will catch it
          }
        }
      },

      // ─── Settings ──────────────────────────────────────────
      setNotificationsEnabled: (v) => { set({ notificationsEnabled: v }); scheduleSync(); },
      setInAppNotifications: (notifs) => { set({ notifications: notifs }); },  // no sync — in-app only
      dismissEmailVerified: () => set({ emailVerified: false }),
      setAnyModalOpen: (v) => set({ anyModalOpen: v }),
      setGuestMode: (v) => { set({ isGuestMode: v }); scheduleSync(); },
      setCloudBackupEnabled: (v) => { set({ cloudBackupEnabled: v }); scheduleSync(); },

      openAuthModal: (message) => set({ showAuthModal: true, authModalMessage: message ?? 'Sign in to continue' }),
      closeAuthModal: () => set({ showAuthModal: false, authModalMessage: '' }),
      openPaywall: () => {
        const { authUser, isGuestMode } = get();
        // Guests must create account before subscribing to premium
        if (!authUser || isGuestMode) {
          set({ showAuthModal: true, authModalMessage: 'Create a free account first, then upgrade to Premium' });
          return;
        }
        set({ showPaywallModal: true });
      },
      closePaywall: () => set({ showPaywallModal: false }),
      openProfileModal: () => { /* overridden by MainTabs */ },
      openSearch: () => { /* overridden by MainTabs */ },
      setOnboarded: () => set({ hasOnboarded: true }),
      setVisaProfile: (profile) => { set({ visaProfile: profile }); scheduleSync(); },
      setImmigrationProfile: (p) => { set({ immigrationProfile: p }); scheduleSync(); },

      resetAllData: async () => {
        // Bug 64 fix: cancel all scheduled push notifications before wiping documents
        try { await cancelAllNotifications(); } catch {}
        // CRITICAL: cancel any pending sync timer FIRST — otherwise a queued
        // syncToCloud might fire after we delete cloud data and write the old
        // state back up, defeating the reset.
        try { clearTimeout((scheduleSync as any)._t); } catch {}

        // Delete cloud data from Supabase (keep user logged in)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await supabase.from('user_data').delete().eq('user_id', session.user.id);
          }
        } catch {}

        // Preserve auth state — only clear local data
        const { authUser, isPremium, emailVerified } = get();
        set({
          _hasHydrated: true,
          hasOnboarded: true,   // keep true so welcome modal doesn't reappear
          isGuestMode: false,
          showWelcomeModal: false,
          // Keep auth — user stays logged in
          authUser,
          isPremium,
          emailVerified,
          // Clear all personal data
          visaProfile: null,
          immigrationProfile: null,
          documents: [],
          checklists: [],
          counters: [],
          trips: [],
          addressHistory: [],
          familyMembers: [],
          anyModalOpen: false,
          showAuthModal: false,
          authModalMessage: 'Sign in to continue',
          showPaywallModal: false,
          notificationsEnabled: true,
          notificationEmail: null,
          whatsappPhone: null,
          pinEnabled: false,
          pinCode: null,
          lastSyncedAt: null,
          syncError: null,
          lastAutoBackupAt: null,
          notifications: [],
          profileSetupShown: false,
        });

        // CRITICAL: immediately push the empty state up to cloud so any subsequent
        // sync (foreground listener, periodic timer) sees an empty cloud copy
        // instead of pulling back the pre-reset data via mergeById.
        try {
          if (authUser && isPremium) {
            await get().syncToCloud();
          }
        } catch {}
      },
      exportData: () => {
        const { documents, checklists, counters, trips, isPremium, familyMembers, addressHistory, visaProfile, immigrationProfile, notificationEmail, whatsappPhone } = get();
        return JSON.stringify({
          app: 'StatusVault', version: '2.0.0',
          exportedAt: new Date().toISOString(),
          data: { documents, checklists, counters, trips, isPremium, familyMembers, addressHistory, visaProfile, immigrationProfile, notificationEmail, whatsappPhone },
        }, null, 2);
      },
      importData: (json) => {
        try {
          const p = JSON.parse(json);
          if (p.app !== 'StatusVault' || !p.data) return false;
          const d = p.data;
          // Bug 33 fix: strip phantom notificationIds from import — IDs from
          // another device won't match any locally scheduled notifications
          const importedDocs = (d.documents ?? []).map(
            (doc: any) => ({ ...doc, notificationIds: [] })
          );
          set({
            documents:          importedDocs,
            checklists:         d.checklists         ?? [],
            counters:           d.counters           ?? [],
            trips:              d.trips              ?? [],
            familyMembers:      d.familyMembers      ?? [],
            addressHistory:     d.addressHistory     ?? [],
            visaProfile:        d.visaProfile        ?? null,
            immigrationProfile: d.immigrationProfile ?? null,
            notificationEmail:  d.notificationEmail  ?? '',
            whatsappPhone:      d.whatsappPhone      ?? '',
            isPremium:          d.isPremium          || false,
            hasOnboarded:       true,
          });
          // Reschedule notifications for imported docs
          if (get().notificationsEnabled) {
            importedDocs.forEach(async (doc: any) => {
              try {
                const ids = await scheduleDocumentNotifications(doc);
                set((s) => ({
                  documents: s.documents.map((d2) => d2.id === doc.id ? { ...d2, notificationIds: ids } : d2),
                }));
              } catch {}
            });
          }
          scheduleSync();
          return true;
        } catch { return false; }
      },
    }),
    {
      name: 'statusvault-storage',
      storage: createJSONStorage(() => platformStorage),
      onRehydrateStorage: () => (state) => {
        const hasMagicToken = typeof window !== 'undefined' && (
          window.location.search.includes('code=')        ||  // PKCE (Supabase v2 default)
          window.location.search.includes('token_hash=')  ||  // legacy OTP query string
          window.location.hash.includes('token_hash=')    ||  // legacy OTP hash
          window.location.hash.includes('access_token='));    // legacy implicit

        // Check Supabase session synchronously — logged-in users never see welcome modal
        const hasSupabaseSession = (() => {
          try {
            const raw = localStorage.getItem(SUPABASE_SESSION_KEY);
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            return !!(parsed?.access_token || parsed?.session?.access_token);
          } catch { return false; }
        })();

        const suppressWelcome = hasMagicToken || hasSupabaseSession;
        useStore.setState({
          _hasHydrated: true,
          ...(suppressWelcome ? { hasOnboarded: true, showWelcomeModal: false } : {}),
        });
      },
      // Explicit merge ensures new fields added to initial state are not
      // lost when loading old persisted state that predates those fields
      merge: (persisted: any, current: any) => ({
        ...current,      // start with full initial state (all new fields with defaults)
        ...persisted,    // overlay saved values on top
        // Always keep these as their persisted values, never overwrite with initial
        lastAutoBackupAt: persisted.lastAutoBackupAt ?? null,
        lastSyncedAt:     persisted.lastSyncedAt     ?? null,
      }),
      partialize: (s) => ({
        hasOnboarded: s.hasOnboarded, documents: s.documents, checklists: s.checklists,
        counters: s.counters, trips: s.trips, notificationsEnabled: s.notificationsEnabled,
        isPremium: s.isPremium, pinEnabled: s.pinEnabled, pinCode: s.pinCode,
        lastSyncedAt: s.lastSyncedAt,
        familyMembers: s.familyMembers,
        addressHistory: s.addressHistory,
        visaProfile: s.visaProfile,
        immigrationProfile: s.immigrationProfile,
        notificationEmail: s.notificationEmail,
        whatsappPhone: s.whatsappPhone,
        isGuestMode: s.isGuestMode,
        profileSetupShown: s.profileSetupShown,
        cloudBackupEnabled: s.cloudBackupEnabled,
        notifications: s.notifications,
        lastAutoBackupAt: s.lastAutoBackupAt,
      }),
    }
  )
);
