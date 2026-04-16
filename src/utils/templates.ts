// ═══════════════════════════════════════════════════════════════
// StatusVault — Document Templates
// Pre-built types with smart notification windows per category
// Users pick from dropdowns — minimal typing required
// ═══════════════════════════════════════════════════════════════

import { DocumentTemplate, DocumentCategory } from '../types';

/**
 * Alert windows are customized per document type based on real-world urgency:
 * - H1B visa renewal: 180, 90, 60, 30, 7 days (long lead time needed)
 * - OPT/EAD: 90, 60, 30, 15, 7 days (unemployment limit pressure)
 * - Passport: 180, 90, 30 days (6-month validity rule for travel)
 * - I-20: 90, 60, 30, 7 days (DSO processing time)
 * - Green Card: 180, 90, 30 days (renewal takes months)
 */
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // ─── Visa Types ──────────────────────────────────────────
  {
    id: 'f1-visa',
    label: 'F-1 Visa Stamp',
    category: 'visa',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '🎓',
    description: 'F-1 student visa stamp in passport',
  },
  {
    id: 'h1b-visa',
    label: 'H-1B Visa',
    category: 'visa',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '💼',
    description: 'H-1B work visa — long renewal lead time',
  },
  {
    id: 'h4-visa',
    label: 'H-4 Dependent Visa',
    category: 'visa',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '👨‍👩‍👧',
    description: 'H-4 dependent visa stamp',
  },
  {
    id: 'j1-visa',
    label: 'J-1 Visa',
    category: 'visa',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '🔬',
    description: 'J-1 exchange visitor visa',
  },
  {
    id: 'l1-visa',
    label: 'L-1 Visa',
    category: 'visa',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '🏢',
    description: 'L-1 intracompany transfer visa',
  },
  {
    id: 'o1-visa',
    label: 'O-1 Visa',
    category: 'visa',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '⭐',
    description: 'O-1 extraordinary ability visa',
  },
  {
    id: 'b1b2-visa',
    label: 'B-1/B-2 Visa',
    category: 'visa',
    alertDays: [90, 30, 7],
    icon: '✈️',
    description: 'Business or tourist visa',
  },

  // ─── Employment Authorization ────────────────────────────
  {
    id: 'opt-ead',
    label: 'OPT EAD Card',
    category: 'employment',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '📋',
    description: 'Optional Practical Training work permit',
  },
  {
    id: 'stem-opt',
    label: 'STEM OPT Extension',
    category: 'employment',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '🔬',
    description: '24-month STEM OPT extension EAD',
  },
  {
    id: 'cpt',
    label: 'CPT Authorization',
    category: 'employment',
    alertDays: [60, 30, 15, 7],
    icon: '📝',
    description: 'Curricular Practical Training',
  },
  {
    id: 'h1b-approval',
    label: 'H-1B Approval Notice (I-797)',
    category: 'employment',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '📄',
    description: 'H-1B approval/petition validity',
  },
  {
    id: 'h4-ead',
    label: 'H-4 EAD',
    category: 'employment',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '💳',
    description: 'H-4 spouse employment authorization',
  },
  {
    id: 'l2-ead',
    label: 'L-2 EAD',
    category: 'employment',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '💳',
    description: 'L-2 dependent work authorization',
  },
  {
    id: 'general-ead',
    label: 'EAD Card (General)',
    category: 'employment',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '💳',
    description: 'Employment Authorization Document',
  },

  // ─── Travel Documents ────────────────────────────────────
  {
    id: 'passport',
    label: 'Passport',
    category: 'travel',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '🛂',
    description: 'Passport — 6-month validity rule for travel',
  },
  {
    id: 'advance-parole',
    label: 'Advance Parole',
    category: 'travel',
    alertDays: [90, 60, 30, 15, 7],
    icon: '🎫',
    description: 'Travel document for pending AOS',
  },
  {
    id: 'travel-signature',
    label: 'I-20 Travel Signature',
    category: 'travel',
    alertDays: [30, 15, 7],
    icon: '✍️',
    description: 'DSO travel endorsement — valid 6 months (F-1) or 1 year',
  },

  // ─── Academic Documents ──────────────────────────────────
  {
    id: 'i20',
    label: 'I-20 Form',
    category: 'academic',
    alertDays: [90, 60, 30, 15, 7],
    icon: '📄',
    description: 'Certificate of Eligibility (F-1)',
  },
  {
    id: 'ds2019',
    label: 'DS-2019 Form',
    category: 'academic',
    alertDays: [90, 60, 30, 15, 7],
    icon: '📄',
    description: 'Certificate of Eligibility (J-1)',
  },
  {
    id: 'program-end',
    label: 'Program End Date',
    category: 'academic',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '🎓',
    description: 'Academic program completion date',
  },
  {
    id: 'sevis',
    label: 'SEVIS Record',
    category: 'academic',
    alertDays: [90, 60, 30, 15, 7],
    icon: '🏛️',
    description: 'SEVIS registration validity',
  },

  // ─── Immigration / Green Card ────────────────────────────
  {
    id: 'green-card',
    label: 'Green Card (I-551)',
    category: 'immigration',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '🟢',
    description: 'Permanent Resident Card — 10yr or 2yr conditional',
  },
  {
    id: 'green-card-conditional',
    label: 'Conditional Green Card',
    category: 'immigration',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '🟡',
    description: '2-year conditional — file I-751 before expiry',
  },
  {
    id: 'combo-card',
    label: 'Combo Card (EAD/AP)',
    category: 'immigration',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '🔗',
    description: 'Combined EAD + Advance Parole',
  },
  {
    id: 'i94',
    label: 'I-94 Arrival Record',
    category: 'immigration',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '📊',
    description: 'Authorized stay expiry date',
  },
  {
    id: 'i-797-receipt',
    label: 'I-797 Receipt Notice',
    category: 'immigration',
    alertDays: [180, 90, 60, 30, 15, 7],
    icon: '📨',
    description: 'USCIS receipt/approval notice',
  },

  // ─── Other ───────────────────────────────────────────────
  {
    id: 'drivers-license',
    label: "Driver's License",
    category: 'other',
    alertDays: [60, 30, 7],
    icon: '🚗',
    description: 'State-issued driver license',
  },
  {
    id: 'custom',
    label: 'Custom Document',
    category: 'other',
    alertDays: [90, 30, 7],
    icon: '📎',
    description: 'Add any other document',
  },
];

/** Get template by ID */
export const getTemplate = (id: string): DocumentTemplate | undefined =>
  DOCUMENT_TEMPLATES.find((t) => t.id === id);

/** Group templates by category for dropdown sections */
export const getTemplatesByCategory = (): Record<DocumentCategory, DocumentTemplate[]> => {
  const grouped: Record<DocumentCategory, DocumentTemplate[]> = {
    visa: [],
    employment: [],
    travel: [],
    academic: [],
    immigration: [],
    other: [],
  };
  DOCUMENT_TEMPLATES.forEach((t) => {
    grouped[t.category].push(t);
  });
  return grouped;
};

/** Category display labels */
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  visa: 'Visa Types',
  employment: 'Employment Authorization',
  travel: 'Travel Documents',
  academic: 'Academic Documents',
  immigration: 'Immigration / Green Card',
  other: 'Other',
};

/** Category colors for visual grouping */
export const CATEGORY_COLORS: Record<DocumentCategory, string> = {
  visa: '#2E5AAC',
  employment: '#2DBE7F',
  travel: '#8B5CF6',
  academic: '#F59E0B',
  immigration: '#EC4899',
  other: '#6B7280',
};
