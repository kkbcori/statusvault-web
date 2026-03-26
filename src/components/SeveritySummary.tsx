// ═══════════════════════════════════════════════════════════════
// SeveritySummary v2 — Premium urgency breakdown pills
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../theme';
import { DeadlineItem, UrgencyLevel } from '../types';
import { countByUrgency } from '../utils/dates';

interface SeveritySummaryProps { deadlines: DeadlineItem[]; }

const SEVERITY_CONFIG: { key: UrgencyLevel; label: string; color: string; bg: string }[] = [
  { key: 'expired', label: 'Expired', color: colors.danger, bg: colors.dangerLight },
  { key: 'critical', label: 'Critical', color: colors.danger, bg: colors.dangerLight },
  { key: 'urgent', label: 'Urgent', color: colors.warning, bg: colors.warningLight },
  { key: 'upcoming', label: 'Soon', color: colors.warning, bg: colors.warningLight },
  { key: 'safe', label: 'On Track', color: colors.success, bg: colors.successLight },
];

export const SeveritySummary: React.FC<SeveritySummaryProps> = ({ deadlines }) => {
  const counts = countByUrgency(deadlines);
  const activePills = SEVERITY_CONFIG.filter((s) => counts[s.key] > 0);
  if (activePills.length === 0) return null;

  return (
    <View style={styles.container}>
      {activePills.map((pill) => (
        <View key={pill.key} style={[styles.pill, { backgroundColor: pill.bg, borderColor: pill.color + '25', borderWidth: 1 }]}>
          <View style={[styles.dot, { backgroundColor: pill.color }]} />
          <Text style={[styles.count, { color: pill.color }]}>{counts[pill.key]}</Text>
          <Text style={[styles.label, { color: pill.color }]}>{pill.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginHorizontal: spacing.screen, marginTop: spacing.md },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  count: { ...typography.captionBold, fontSize: 14 },
  label: { ...typography.caption, fontSize: 12 },
});
