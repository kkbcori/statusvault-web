// ═══════════════════════════════════════════════════════════════
// StatusVault — Zustand Store (v7)
// Auth + cloud sync added. Offline-first: local always written first.
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserDocument, ChecklistItem, TravelTrip, AuthUser } from '../types';
import {
  scheduleDocumentNotifications,
  cancelDocumentNotifications,
} from '../utils/notifications';
import { CHECKLIST_TEMPLATES } from '../utils/checklists';
import { COUNTER_TEMPLATES } from '../utils/counters';
import { platformStorage } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { deriveKey, encryptData, decryptData } from '../utils/crypto';

// Guest limits (no account)
const GUEST_DOC_LIMIT = 1;
const GUEST_CHECKLIST_LIMIT = 1;
const GUEST_COUNTER_LIMIT = 1;
const GUEST_FAMILY_LIMIT = 0;       // no family in guest mode
// Free account limits
const FREE_DOCUMENT_LIMIT = 2;
const FREE_FAMILY_LIMIT_STORE = 1;
const FREE_FAMILY_DOC_LIMIT = 1;
const FREE_CHECKLIST_LIMIT = 2;
const FREE_COUNTER_LIMIT = 2;
const PRE_AUTH_DOC_LIMIT = 1;       // kept for canAddDocument compat

// ─── Checklist Instance ──────────────────────────────────────
export interface ChecklistInstance {
  templateId: string;
  label: string;
  icon: string;
  items: ChecklistItem[];
}

// ─── Immi Counter Instance ───────────────────────────────────
export interface ImmiCounter {
  templateId: string;
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
  familyMembers: FamilyMember[];
  notificationsEnabled: boolean;
  notificationEmail: string | null;   // for email expiry alerts
  whatsappPhone: string | null;        // for WhatsApp alerts
  isPremium: boolean;

  // Auth
  authUser: AuthUser | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
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
  autoIncrementCounters: () => void;

  // Travel / I-94
  addTrip: (trip: TravelTrip) => void;
  removeTrip: (id: string) => void;
  addFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (id: string) => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  updateTrip: (id: string, updates: Partial<TravelTrip>) => void;

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initAuth: () => Promise<void>;

  // Sync
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;

  // Settings
  setNotificationsEnabled: (v: boolean) => void;
  setOnboarded: () => void;
  anyModalOpen: boolean;
  setAnyModalOpen: (v: boolean) => void;
  showAuthModal: boolean;
  authModalMessage: string;
  openAuthModal: (message?: string) => void;
  closeAuthModal: () => void;
  showPaywallModal: boolean;
  emailVerified: boolean;
  preAuthDocCount: number;
  isGuestMode: boolean;       // true = using without account
  showWelcomeModal: boolean;  // first-visit chooser
  setGuestMode: (v: boolean) => void;
  setWelcomeModalShown: () => void;
  openPaywall: () => void;
  closePaywall: () => void;
  openProfileModal: () => void;  // set by MainTabs after mount
  setVisaProfile: (profile: string) => void;
  resetAllData: () => void;
  deleteAccount: () => Promise<{ error: string | null }>;
  exportData: () => string;
  importData: (json: string) => boolean;
}

const today = () => new Date().toISOString().split('T')[0];

export const FREE_LIMIT = FREE_DOCUMENT_LIMIT;
export const GUEST_LIMIT = GUEST_DOC_LIMIT;
export { GUEST_CHECKLIST_LIMIT, GUEST_COUNTER_LIMIT, GUEST_FAMILY_LIMIT };

// ─── Sync helper — call after any mutation ───────────────────
const scheduleSync = () => {
  const { authUser, syncToCloud } = useStore.getState();
  if (authUser) {
    // Debounce — wait 1.5s after last change before uploading
    clearTimeout((scheduleSync as any)._t);
    (scheduleSync as any)._t = setTimeout(() => syncToCloud(), 1500);
  }
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      hasOnboarded: false,
      visaProfile: null,
      immigrationProfile: null,
      documents: [],
      checklists: [],
      counters: [],
      trips: [],
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

      // ─── PIN ───────────────────────────────────────────────
      pinEnabled: false,
      pinCode: null,
      setPin: (pin) => set({ pinEnabled: true, pinCode: pin }),
      removePin: () => set({ pinEnabled: false, pinCode: null }),
      verifyPin: (pin) => get().pinCode === pin,

      // ─── Paywall ───────────────────────────────────────────
      forceAddDocument: (doc) => {
        // Bypasses free limit — used by profile setup wizard
        set((s) => ({ documents: [...s.documents, doc] }));
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
      getRemainingFreeSlots: () => {
        const { documents, isPremium } = get();
        return isPremium ? 999 : Math.max(0, FREE_DOCUMENT_LIMIT - documents.length);
      },
      setPremium: (v) => set({ isPremium: v }),
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
          // preAuthDocCount deprecated — limit enforced via documents.length in canAddDocument
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
              ? { ...cl, items: [...cl.items, { id: `c-${Date.now()}`, text, done: false, category: 'Custom' }] }
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
        const id = `custom-${Date.now()}`;
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
      autoIncrementCounters: () => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        set((s) => ({
          counters: s.counters.map((c) => {
            if (!c.isTracking || !c.lastIncrementDate) return c;
            const last = new Date(c.lastIncrementDate);
            last.setHours(0, 0, 0, 0);
            const diff = Math.floor((now.getTime() - last.getTime()) / 86400000);
            if (diff <= 0) return c;
            return { ...c, daysUsed: Math.min(c.maxDays, c.daysUsed + diff), lastIncrementDate: today() };
          }),
        }));
      },

      // ─── Travel / I-94 ─────────────────────────────────────
      addTrip: (trip) => {
        set((s) => ({ trips: [...s.trips, trip] }));
        scheduleSync();
      },
      addFamilyMember: (member) => {
        set((s) => ({ familyMembers: [...s.familyMembers, member] }));
        scheduleSync();
      },

      removeFamilyMember: (id) => {
        set((s) => ({ familyMembers: s.familyMembers.filter((m) => m.id !== id) }));
        scheduleSync();
      },

      updateFamilyMember: (id, updates) => {
        set((s) => ({
          familyMembers: s.familyMembers.map((m) => m.id === id ? { ...m, ...updates } : m),
        }));
        scheduleSync();
      },

      removeTrip: (id) => {
        set((s) => ({ trips: s.trips.filter((t) => t.id !== id) }));
        scheduleSync();
      },
      updateTrip: (id, updates) => {
        set((s) => ({
          trips: s.trips.map((t) => t.id === id ? { ...t, ...updates } : t),
        }));
        scheduleSync();
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
        const redirectTo = typeof window !== 'undefined'
          ? (window.location.hostname === 'localhost'
              ? window.location.origin + '/statusvault-web'
              : 'https://kkbcori.github.io/statusvault-web')
          : 'https://kkbcori.github.io/statusvault-web';
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
        });
        if (error) return { error: error.message };
        return { error: null };
      },

      signOut: async () => {
        await supabase.auth.signOut();
        set({
          authUser: null, lastSyncedAt: null, syncError: null,
          emailVerified: false, isGuestMode: false,
          hasOnboarded: true, // keep so welcome modal doesn't reappear
          showWelcomeModal: false,
        });
      },

      deleteAccount: async () => {
        try {
          // Delete user data from Supabase cloud
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Delete synced data from cloud
            await supabase.from('user_data').delete().eq('user_id', user.id);
            // Delete auth user — requires service role in production,
            // for now we sign out and clear all local data
          }
          await supabase.auth.signOut();
          // Clear all local data
          get().resetAllData();
          return { error: null };
        } catch (e: any) {
          return { error: e.message ?? 'Failed to delete account' };
        }
      },

      initAuth: async () => {
        let initialSyncDone = false;

        // Handle email confirmation in URL (both token_hash and access_token formats)
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          const search = window.location.search;
          // Check both hash (#token_hash=) and query string (?token_hash=)
          const hashParams   = new URLSearchParams(hash.replace('#', '?'));
          const searchParams = new URLSearchParams(search);
          const tokenHash    = hashParams.get('token_hash') || searchParams.get('token_hash');
          const accessToken  = hashParams.get('access_token');
          const type         = hashParams.get('type') || searchParams.get('type');

          // Format 1: token_hash (older email template format)
          if (tokenHash && (type === 'signup' || type === 'email' || type === 'magiclink')) {
            try {
              const { data, error } = await supabase.auth.verifyOtp({
                token_hash: tokenHash,
                type: type as any,
              });
              if (!error && data.session) {
                set({
                  authUser: {
                    id: data.session.user.id,
                    email: data.session.user.email!,
                    createdAt: data.session.user.created_at,
                  },
                  emailVerified: true,
                  isGuestMode: false,
                  hasOnboarded: true,
                  showWelcomeModal: false,
                });
                initialSyncDone = true;
                try { await get().syncFromCloud(); } catch {}
              }
            } catch {}
            window.history.replaceState(null, '', window.location.pathname);
          }

          // Format 2: access_token (current Supabase email confirmation format)
          // Supabase JS handles this automatically via onAuthStateChange,
          // but we mark emailVerified and clean the URL here
          if (accessToken && (type === 'signup' || type === 'magiclink')) {
            set({ emailVerified: true, isGuestMode: false, hasOnboarded: true, showWelcomeModal: false });
            setTimeout(() => {
              window.history.replaceState(null, '', window.location.pathname);
            }, 1000);
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
            // Clean URL after OAuth redirect
            if (
              event === 'SIGNED_IN' &&
              typeof window !== 'undefined' &&
              window.location.hash.includes('access_token')
            ) {
              window.history.replaceState(null, '', window.location.pathname);
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
            // After any sign-in, open profile setup if not completed yet
            if (event === 'SIGNED_IN') {
              setTimeout(() => {
                if (!get().immigrationProfile) {
                  get().openProfileModal();
                }
              }, 500);
            }
          } else if (event === 'SIGNED_OUT') {
            set({ authUser: null, lastSyncedAt: null, syncError: null, emailVerified: false });
          }
        });

        // Check existing session on startup (page refresh)
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            initialSyncDone = true;
            set({
              authUser: {
                id: session.user.id,
                email: session.user.email!,
                createdAt: session.user.created_at,
              },
            });
            try { await get().syncFromCloud(); } catch {}
          }
        } catch {}
      },

      // ─── Sync ──────────────────────────────────────────────
      syncToCloud: async () => {
        // Use getSession() — reads from local storage, no network call needed
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;
        const { authUser: storeAuth, documents, checklists, counters, trips, isPremium } = get();
        const email = storeAuth?.email ?? user.email ?? '';
        set({ isSyncing: true, syncError: null });
        try {
          const key  = deriveKey(user.id, email);
          const { familyMembers, visaProfile } = get();
          const { notificationEmail, whatsappPhone } = get();
          const blob = { documents, checklists, counters, trips, familyMembers, visaProfile, isPremium, notificationEmail, whatsappPhone, syncedAt: new Date().toISOString() };
          const data_encrypted = encryptData(blob, key);
          const { error } = await supabase
            .from('user_data')
            .upsert({ user_id: user.id, data_encrypted }, { onConflict: 'user_id' });
          if (error) throw new Error(error.message);
          set({ lastSyncedAt: new Date().toISOString(), isSyncing: false });
        } catch (e: any) {
          set({ isSyncing: false, syncError: e.message ?? 'Sync failed' });
        }
      },

      syncFromCloud: async () => {
        // Use getSession() — reads from local storage, no network call needed
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;
        const { authUser: storeAuth } = get();
        const email = storeAuth?.email ?? user.email ?? '';
        set({ isSyncing: true, syncError: null });
        try {
          const { data, error } = await supabase
            .from('user_data')
            .select('data_encrypted, updated_at')
            .eq('user_id', user.id)
            .single();
          if (error && error.code !== 'PGRST116') throw new Error(error.message);
          if (!data) {
            // No cloud data yet — upload local data
            await get().syncToCloud();
            return;
          }
          const key     = deriveKey(user.id, email);
          const decoded = decryptData(data.data_encrypted, key) as any;
          if (!decoded) throw new Error('Decryption failed — wrong account?');
          // Cloud wins: merge by taking cloud data as source of truth
          set({
            documents:  decoded.documents  ?? get().documents,
            checklists: decoded.checklists ?? get().checklists,
            counters:   decoded.counters   ?? get().counters,
            trips:      decoded.trips      ?? get().trips,
            familyMembers: decoded.familyMembers ?? get().familyMembers,
            visaProfile: decoded.visaProfile ?? get().visaProfile,
            notificationEmail: decoded.notificationEmail ?? get().notificationEmail,
            whatsappPhone: decoded.whatsappPhone ?? get().whatsappPhone,
            isPremium:  decoded.isPremium  ?? get().isPremium,
            lastSyncedAt: data.updated_at,
            isSyncing: false,
          });
        } catch (e: any) {
          set({ isSyncing: false, syncError: e.message ?? 'Sync failed' });
        }
      },

      // ─── Alert sync ────────────────────────────────────────
      // Writes contact info + expiring docs to user_alerts table
      // Then fires edge function immediately if any doc is < 180 days
      syncAlerts: async (triggerImmediate = false) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { documents, notificationEmail, whatsappPhone } = get();
        if (!notificationEmail && !whatsappPhone) return;

        // Find docs expiring within 180 days
        const today = new Date();
        const expiringDocs = documents
          .map(d => {
            const expiry = new Date(d.expiryDate);
            const days = Math.floor((expiry.getTime() - today.getTime()) / 86400000);
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
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setAnyModalOpen: (v) => set({ anyModalOpen: v }),
      setGuestMode: (v) => set({ isGuestMode: v }),
      setWelcomeModalShown: () => {
        // Only show on very first visit (hasOnboarded===false AND no documents)
        const { hasOnboarded, documents } = useStore.getState();
        if (!hasOnboarded && documents.length === 0) {
          set({ showWelcomeModal: true });
        }
      },
      openAuthModal: (message) => set({ showAuthModal: true, authModalMessage: message ?? 'Sign in to continue' }),
      closeAuthModal: () => set({ showAuthModal: false, authModalMessage: '' }),
      openPaywall: () => set({ showPaywallModal: true }),
      closePaywall: () => set({ showPaywallModal: false }),
      openProfileModal: () => { /* overridden by MainTabs */ },
      setOnboarded: () => set({ hasOnboarded: true }),
      setVisaProfile: (profile) => set({ visaProfile: profile }),
      setImmigrationProfile: (p) => { set({ immigrationProfile: p }); scheduleSync(); },

      resetAllData: () => {
        // Sign out from Supabase too
        supabase.auth.signOut().catch(() => {});
        set({
          _hasHydrated: false,
          hasOnboarded: false,
          isGuestMode: false,
          showWelcomeModal: false,
          authUser: null,
          visaProfile: null,
          immigrationProfile: null,
          documents: [],
          checklists: [],
          counters: [],
          trips: [],
          familyMembers: [],
          anyModalOpen: false,
          showAuthModal: false,
          authModalMessage: 'Sign in to continue',
          showPaywallModal: false,
          emailVerified: false,
          notificationsEnabled: true,
          notificationEmail: null,
          whatsappPhone: null,
          isPremium: false,
          pinEnabled: false,
          pinCode: null,
          lastSyncedAt: null,
          syncError: null,
          preAuthDocCount: 0,
        });
      },
      exportData: () => {
        const { documents, checklists, counters, trips, isPremium } = get();
        return JSON.stringify({
          app: 'StatusVault', version: '2.0.0',
          exportedAt: new Date().toISOString(),
          data: { documents, checklists, counters, trips, isPremium },
        }, null, 2);
      },
      importData: (json) => {
        try {
          const p = JSON.parse(json);
          if (p.app !== 'StatusVault' || !p.data) return false;
          set({
            documents: p.data.documents || [], checklists: p.data.checklists || [],
            counters: p.data.counters || [], trips: p.data.trips || [],
            isPremium: p.data.isPremium || false, hasOnboarded: true,
          });
          scheduleSync();
          return true;
        } catch { return false; }
      },
    }),
    {
      name: 'statusvault-storage',
      storage: createJSONStorage(() => platformStorage),
      onRehydrateStorage: () => (state) => {
        // Check for magic link token in URL — suppress welcome modal immediately
        const hasMagicToken = typeof window !== 'undefined' &&
          (window.location.hash.includes('access_token') ||
           window.location.hash.includes('token_hash') ||
           window.location.search.includes('token_hash'));
        useStore.setState({
          _hasHydrated: true,
          // Suppress welcome modal if magic link is being processed
          ...(hasMagicToken ? { hasOnboarded: true, showWelcomeModal: false } : {}),
        });
      },
      partialize: (s) => ({
        hasOnboarded: s.hasOnboarded, documents: s.documents, checklists: s.checklists,
        counters: s.counters, trips: s.trips, notificationsEnabled: s.notificationsEnabled,
        isPremium: s.isPremium, pinEnabled: s.pinEnabled, pinCode: s.pinCode,
        lastSyncedAt: s.lastSyncedAt,
        familyMembers: s.familyMembers,
        visaProfile: s.visaProfile,
        immigrationProfile: s.immigrationProfile,
        notificationEmail: s.notificationEmail,
        whatsappPhone: s.whatsappPhone,
        preAuthDocCount: s.preAuthDocCount,
        isGuestMode: s.isGuestMode,
      }),
    }
  )
);
