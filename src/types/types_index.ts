// ═══════════════════════════════════════════════════════════════
// StatusVault — Core Type Definitions
// All types are shared across iOS and Android — no platform splits
// ═══════════════════════════════════════════════════════════════

/** Supported immigration document categories */
export type DocumentCategory =
  | 'visa'
  | 'employment'
  | 'travel'
  | 'academic'
  | 'immigration'
  | 'other';

/** Pre-built document types with smart defaults */
export interface DocumentTemplate {
  id: string;
  label: string;
  category: DocumentCategory;
  /** Alert windows in days — varies by document type */
  alertDays: number[];
  /** Icon emoji */
  icon: string;
  /** Short description shown in dropdown */
  description: string;
}

/** A user-added document entry */
export interface UserDocument {
  id: string;
  templateId: string;
  label: string;
  category: DocumentCategory;
  expiryDate: string; // ISO date string YYYY-MM-DD
  alertDays: number[];
  icon: string;
  notes: string;
  /** Notification IDs scheduled for this doc (for cancellation) */
  notificationIds: string[];
  createdAt: string;
}

/** Urgency level derived from days remaining */
export type UrgencyLevel = 'expired' | 'critical' | 'urgent' | 'upcoming' | 'safe';

/** Dashboard deadline item (computed, not stored) */
export interface DeadlineItem {
  documentId: string;
  label: string;
  icon: string;
  category: DocumentCategory;
  expiryDate: string;
  daysRemaining: number;
  urgency: UrgencyLevel;
}

/** OPT unemployment tracking */
export interface UnemploymentTracker {
  daysUsed: number;
  /** Date tracking started */
  startDate: string | null;
  /** Whether currently unemployed (auto-increment mode) */
  isTracking: boolean;
  /** Last date the counter was auto-incremented */
  lastIncrementDate: string | null;
}

/** Purpose of an international trip */
export type TripPurpose = 'vacation' | 'business' | 'family' | 'medical' | 'other';

/** A single international travel entry for I-94 / N-400 tracking */
export interface TravelTrip {
  id: string;
  departureDate: string;  // YYYY-MM-DD
  returnDate: string;     // YYYY-MM-DD
  country: string;
  purpose: TripPurpose;
  portOfEntry: string;
  notes?: string;
  createdAt: string;
}

/** Checklist item for OPT/H1B processes */
export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  category: string;
}

/** Root app state — persisted via AsyncStorage */
export interface AppState {
  /** Has user completed onboarding */
  hasOnboarded: boolean;
  /** User's documents */
  documents: UserDocument[];
  /** OPT unemployment counter */
  unemployment: UnemploymentTracker;
  /** Process checklists */
  checklists: ChecklistItem[];
  /** Notifications globally enabled */
  notificationsEnabled: boolean;
  /** Premium status (for future paywall) */
  isPremium: boolean;
}

/** Navigation param types */
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  Profile: undefined;
  Main: undefined;
  AddDocument: undefined;
  Premium: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Documents: undefined;
  Travel: undefined;
  Settings: undefined;
  Help: undefined;
};

/** Authenticated user profile */
export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}
