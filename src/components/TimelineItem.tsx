// ═══════════════════════════════════════════════════════════════
// TimelineItem v2 — Premium deadline row with gold accents
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { DeadlineItem } from '../types';
import { getUrgencyColor, getUrgencyBg, getUrgencyLabel, formatDate } from '../utils/dates';

interface TimelineItemProps {
  deadline: DeadlineItem;
  onPress?: () => void;
  compact?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ deadline, onPress, compact = false }) => {
  const urgColor = getUrgencyColor(deadline.daysRemaining);
  const urgBg = getUrgencyBg(deadline.daysRemaining);
  const isExpired = deadline.daysRemaining < 0;

  return (
    <TouchableOpacity style={[styles.container, compact && styles.containerCompact]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.strip, { backgroundColor: urgColor }]} />
      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: urgBg, borderColor: urgColor + '20', borderWidth: 1 }]}>
          <Text style={styles.icon}>{deadline.icon}</Text>
        </View>
        <View style={styles.info}>
          <View style={styles.topRow}>
            <Text style={styles.title} numberOfLines={1}>{deadline.label}</Text>
            <View style={[styles.badge, { backgroundColor: urgBg, borderColor: urgColor + '30', borderWidth: 1 }]}>
              <Text style={[styles.badgeText, { color: urgColor }]}>{getUrgencyLabel(deadline.daysRemaining)}</Text>
            </View>
          </View>
          <Text style={styles.date}>{formatDate(deadline.expiryDate)}</Text>
          {!compact && (
            <View style={styles.countdownRow}>
              <Text style={[styles.countdownNumber, { color: urgColor }]}>{Math.abs(deadline.daysRemaining)}</Text>
              <Text style={styles.countdownLabel}>{isExpired ? 'days overdue' : 'days remaining'}</Text>
            </View>
          )}
        </View>
        {compact && (
          <View style={styles.compactCount}>
            <Text style={[styles.compactNumber, { color: urgColor }]}>{Math.abs(deadline.daysRemaining)}</Text>
            <Text style={styles.compactUnit}>{isExpired ? 'late' : 'days'}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  containerCompact: { marginBottom: spacing.xs + 2 },
  strip: { width: 4 },
  content: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md },
  iconBox: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  info: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  title: { ...typography.bodySemibold, color: colors.text1, flex: 1, marginRight: spacing.sm },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  badgeText: { ...typography.micro, fontSize: 9 },
  date: { ...typography.caption, color: colors.text3, marginBottom: spacing.sm },
  countdownRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  countdownNumber: { ...typography.number },
  countdownLabel: { ...typography.caption, color: colors.text3 },
  compactCount: { alignItems: 'flex-end' },
  compactNumber: { fontSize: 22, fontWeight: '800', lineHeight: 24 },
  compactUnit: { ...typography.micro, color: colors.text3, fontSize: 10 },
});
