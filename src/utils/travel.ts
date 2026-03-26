// ═══════════════════════════════════════════════════════════════
// StatusVault — Travel Utilities
// I-94 tracking helpers for N-400 naturalization support
// ═══════════════════════════════════════════════════════════════

import { TravelTrip, TripPurpose } from '../types';

export const PURPOSE_LABELS: Record<TripPurpose, string> = {
  vacation: 'Vacation / Tourism',
  business: 'Business',
  family:   'Family Visit',
  medical:  'Medical',
  other:    'Other',
};

export const PURPOSE_ICONS: Record<TripPurpose, string> = {
  vacation: '🏖️',
  business: '💼',
  family:   '👨‍👩‍👧',
  medical:  '🏥',
  other:    '✈️',
};

/** Days between departure and return (inclusive of first day) */
export function getTripDays(trip: TravelTrip): number {
  const dep = new Date(trip.departureDate + 'T00:00:00');
  const ret = new Date(trip.returnDate + 'T00:00:00');
  return Math.max(0, Math.round((ret.getTime() - dep.getTime()) / 86400000));
}

/** Sum of all trip durations */
export function getTotalDaysAbroad(trips: TravelTrip[]): number {
  return trips.reduce((sum, t) => sum + getTripDays(t), 0);
}

/** Trips whose departure date falls within the last 5 years */
export function filterLast5Years(trips: TravelTrip[]): TravelTrip[] {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 5);
  cutoff.setHours(0, 0, 0, 0);
  return trips.filter((t) => new Date(t.departureDate + 'T00:00:00') >= cutoff);
}

/** Most recent departures first */
export function sortByDateDesc(trips: TravelTrip[]): TravelTrip[] {
  return [...trips].sort(
    (a, b) => new Date(b.departureDate).getTime() - new Date(a.departureDate).getTime()
  );
}

/** ≥ 180 days abroad may break continuous residence for naturalization */
export function isLongAbsence(trip: TravelTrip): boolean {
  return getTripDays(trip) >= 180;
}

/** Color coding by trip length */
export function getTripColor(days: number): string {
  if (days >= 180) return '#EF4444'; // danger — breaks continuous residence
  if (days >= 60)  return '#F59E0B'; // warning
  if (days >= 30)  return '#3B82F6'; // blue — notable
  return '#22C55E';                   // green — short trip
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export function formatDateFull(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}
