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
  documentNumber?: string;  // e.g. passport number, receipt number
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

/** Purpose of an international trip */
export type TripPurpose = 'vacation' | 'business' | 'family' | 'medical' | 'other';

/** A single international travel entry for I-94 / N-400 tracking */
export interface AddressEntry {
  id: string;
  street: string;
  apt?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  dateFrom: string;  // YYYY-MM-DD
  dateTo: string;    // YYYY-MM-DD or 'present'
  isCurrentAddress: boolean;
  createdAt: string;
}

export interface TravelTrip {
  id: string;
  departureDate: string;  // YYYY-MM-DD
  returnDate: string;     // YYYY-MM-DD
  country: string;
  purpose: TripPurpose;
  portOfEntry?: string;  // optional — not always recorded
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

/** Navigation param types */
export type RootStackParamList = {
  Auth: { mode?: 'login' | 'register' } | undefined;
  Main: undefined | { screen: keyof MainTabParamList; params?: object };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Documents: undefined;
  Travel: undefined;
  Family: undefined;
  Checklist: undefined;
  VisaTools: undefined;
  Timers: undefined;
  Settings: undefined;
  Help: undefined;
  Contact: undefined;
};

export interface FamilyMember {
  id: string;
  name: string;
  relation: string; // spouse, child, parent, sibling, other
  visaType: string;
  documentIds: string[]; // references to UserDocument ids
  trips: TravelTrip[];         // I-94 travel history for this member
  addressHistory: AddressEntry[]; // Address history for this member
  createdAt: string;
}

/** Authenticated user profile */
export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}
