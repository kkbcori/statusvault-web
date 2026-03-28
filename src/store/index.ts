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

const FREE_DOCUMENT_LIMIT = 3;

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
  hasOnboarded: boolean;
  documents: UserDocument[];
  checklists: ChecklistInstance[];
  counters: ImmiCounter[];
  trips: TravelTrip[];
  notificationsEnabled: boolean;
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
  getRemainingFreeSlots: () => number;
  setPremium: (v: boolean) => void;

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
  updateTrip: (id: string, updates: Partial<TravelTrip>) => void;

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  initAuth: () => Promise<void>;

  // Sync
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;

  // Settings
  setNotificationsEnabled: (v: boolean) => void;
  setOnboarded: () => void;
  resetAllData: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
}

const today = () => new Date().toISOString().split('T')[0];

export const FREE_LIMIT = FREE_DOCUMENT_LIMIT;

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
      hasOnboarded: false,
      documents: [],
      checklists: [],
      counters: [],
      trips: [],
      notificationsEnabled: true,
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
      canAddDocument: () => {
        const { documents, isPremium } = get();
        return isPremium || documents.length < FREE_DOCUMENT_LIMIT;
      },
      getRemainingFreeSlots: () => {
        const { documents, isPremium } = get();
        return isPremium ? 999 : Math.max(0, FREE_DOCUMENT_LIMIT - documents.length);
      },
      setPremium: (v) => set({ isPremium: v }),

      // ─── Documents ─────────────────────────────────────────
      addDocument: async (doc) => {
        if (!get().canAddDocument()) return false;
        let notificationIds: string[] = [];
        if (get().notificationsEnabled) {
          try { notificationIds = await scheduleDocumentNotifications(doc); } catch {}
        }
        set((s) => ({ documents: [...s.documents, { ...doc, notificationIds }] }));
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
        if (error) return { error: error.message };
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

      signOut: async () => {
        await supabase.auth.signOut();
        set({ authUser: null, lastSyncedAt: null, syncError: null });
      },

      initAuth: async () => {
        let initialSyncDone = false;

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
          } else if (event === 'SIGNED_OUT') {
            set({ authUser: null, lastSyncedAt: null, syncError: null });
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
        const { authUser, documents, checklists, counters, trips, isPremium } = get();
        if (!authUser) return;
        set({ isSyncing: true, syncError: null });
        try {
          const key  = deriveKey(authUser.id, authUser.email);
          const blob = { documents, checklists, counters, trips, isPremium, syncedAt: new Date().toISOString() };
          const data_encrypted = encryptData(blob, key);
          const { error } = await supabase
            .from('user_data')
            .upsert({ user_id: authUser.id, data_encrypted }, { onConflict: 'user_id' });
          if (error) throw new Error(error.message);
          set({ lastSyncedAt: new Date().toISOString(), isSyncing: false });
        } catch (e: any) {
          set({ isSyncing: false, syncError: e.message ?? 'Sync failed' });
        }
      },

      syncFromCloud: async () => {
        const { authUser } = get();
        if (!authUser) return;
        set({ isSyncing: true, syncError: null });
        try {
          const { data, error } = await supabase
            .from('user_data')
            .select('data_encrypted, updated_at')
            .eq('user_id', authUser.id)
            .single();
          if (error && error.code !== 'PGRST116') throw new Error(error.message); // PGRST116 = no rows
          if (!data) {
            // No cloud data yet — upload local data
            await get().syncToCloud();
            return;
          }
          const key     = deriveKey(authUser.id, authUser.email);
          const decoded = decryptData(data.data_encrypted, key) as any;
          if (!decoded) throw new Error('Decryption failed — wrong account?');
          // Cloud wins: merge by taking cloud data as source of truth
          set({
            documents:  decoded.documents  ?? get().documents,
            checklists: decoded.checklists ?? get().checklists,
            counters:   decoded.counters   ?? get().counters,
            trips:      decoded.trips      ?? get().trips,
            isPremium:  decoded.isPremium  ?? get().isPremium,
            lastSyncedAt: data.updated_at,
            isSyncing: false,
          });
        } catch (e: any) {
          set({ isSyncing: false, syncError: e.message ?? 'Sync failed' });
        }
      },

      // ─── Settings ──────────────────────────────────────────
      setNotificationsEnabled: (v) => set({ notificationsEnabled: v }),
      setOnboarded: () => set({ hasOnboarded: true }),
      resetAllData: () => set({
        hasOnboarded: false, documents: [], checklists: [], counters: [], trips: [],
        notificationsEnabled: true, isPremium: false, pinEnabled: false, pinCode: null,
      }),
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
      partialize: (s) => ({
        hasOnboarded: s.hasOnboarded, documents: s.documents, checklists: s.checklists,
        counters: s.counters, trips: s.trips, notificationsEnabled: s.notificationsEnabled,
        isPremium: s.isPremium, pinEnabled: s.pinEnabled, pinCode: s.pinCode,
        lastSyncedAt: s.lastSyncedAt,
      }),
    }
  )
);
