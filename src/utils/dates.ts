// ═══════════════════════════════════════════════════════════════
// StatusVault — Date & Deadline Utilities
// All calculations use dayjs — consistent day-boundary logic
// No network calls — everything computed on-device
// ═══════════════════════════════════════════════════════════════

import dayjs from 'dayjs';
import { UrgencyLevel, DeadlineItem, UserDocument } from '../types';
import { colors } from '../theme';

/**
 * Format a Date as a local-time YYYY-MM-DD string.
 * NEVER use date.toISOString().split('T')[0] for storing user-facing dates —
 * that returns the UTC date, which causes off-by-1-day bugs in any timezone
 * other than UTC. For example, at 8pm CDT on April 22, the local date is
 * still April 22 but the UTC date is already April 23. Storing the UTC string
 * means the user sees their trip "shift" to the next day.
 */
export const toLocalDateString = (d: Date): string => {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/** Calculate days remaining from today to a target date */
export const calculateDaysRemaining = (targetDate: string): number => {
  if (!targetDate) return -999;
  const target = dayjs(targetDate).startOf('day');
  if (!target.isValid()) return -999; // Bug 70 fix: invalid date treated as expired
  const today = dayjs().startOf('day');
  return target.diff(today, 'day');
};

/** Get urgency level from days remaining */
export const getUrgency = (days: number): UrgencyLevel => {
  if (days < 0)    return 'expired';   // Expired
  if (days < 30)   return 'critical';  // Critical  — < 30 days
  if (days < 60)   return 'urgent';    // High      — 30–60 days
  if (days < 180)  return 'upcoming';  // Medium    — 60–180 days
  return 'safe';                        // Low       — > 180 days
};

/** Get color for urgency level */
export const getUrgencyColor = (days: number): string => {
  const urgency = getUrgency(days);
  switch (urgency) {
    case 'expired':
      return colors.danger;
    case 'critical':
      return colors.danger;
    case 'urgent':
      return colors.warning;
    case 'upcoming':
      return colors.warning;
    case 'safe':
      return colors.success;
  }
};

/** Get background color for urgency badge */
export const getUrgencyBg = (days: number): string => {
  const urgency = getUrgency(days);
  switch (urgency) {
    case 'expired':
      return colors.dangerLight;
    case 'critical':
      return colors.dangerLight;
    case 'urgent':
      return colors.warningLight;
    case 'upcoming':
      return colors.warningLight;
    case 'safe':
      return colors.successLight;
  }
};

/** Get display label for urgency */
export const getSeverityLabel = (days: number): string => {
  if (days < 0)   return 'Expired';
  if (days < 30)  return 'Critical';
  if (days < 60)  return 'High';
  if (days < 180) return 'Medium';
  return 'Low';
};

export const getUrgencyLabel = (days: number): string => {
  const urgency = getUrgency(days);
  switch (urgency) {
    case 'expired':
      return 'EXPIRED';
    case 'critical':
      return 'CRITICAL';
    case 'urgent':
      return 'URGENT';
    case 'upcoming':
      return 'SOON';
    case 'safe':
      return 'ON TRACK';
  }
};

/** Format date for display: "May 15, 2026" */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '—';
  return dayjs(dateStr).format('MMM D, YYYY');
};

/** Format date short: "May 15" */
export const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return '—';
  return dayjs(dateStr).format('MMM D');
};

/** Get today's date as ISO string */
export const today = (): string => dayjs().format('YYYY-MM-DD');

/** Add days to a date */
export const addDaysToDate = (dateStr: string, days: number): string =>
  dayjs(dateStr).add(days, 'day').format('YYYY-MM-DD');

/**
 * Generate deadline items from user documents
 * Sorted by urgency (most urgent first)
 */
export const generateDeadlines = (documents: UserDocument[]): DeadlineItem[] => {
  return documents
    .map((doc) => {
      const daysRemaining = calculateDaysRemaining(doc.expiryDate);
      return {
        documentId: doc.id,
        label: doc.label,
        icon: doc.icon,
        category: doc.category,
        expiryDate: doc.expiryDate,
        daysRemaining,
        urgency: getUrgency(daysRemaining),
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);
};

/**
 * Get the most critical deadline for hero display
 */
export const getMostCritical = (deadlines: DeadlineItem[]): DeadlineItem | null => {
  if (deadlines.length === 0) return null;
  // First non-expired, or first expired
  const active = deadlines.find((d) => d.daysRemaining >= 0);
  return active || deadlines[0];
};

/**
 * Count documents by urgency level for dashboard summary
 */
export const countByUrgency = (
  deadlines: DeadlineItem[]
): Record<UrgencyLevel, number> => {
  const counts: Record<UrgencyLevel, number> = {
    expired: 0,
    critical: 0,
    urgent: 0,
    upcoming: 0,
    safe: 0,
  };
  deadlines.forEach((d) => {
    counts[d.urgency]++;
  });
  return counts;
};
