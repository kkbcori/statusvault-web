// StatusCard v3 — Light stat tile · matches SaaS design system
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { DeadlineItem } from '../types';
import { getUrgencyColor, formatDate } from '../utils/dates';

interface StatusCardProps {
  deadline: DeadlineItem | null;
  totalDocs: number;
}

export const StatusCard: React.FC<StatusCardProps> = ({ deadline, totalDocs }) => {
  if (!deadline) {
    return (
      <View style={[styles.tile, styles.tileEmpty]}>
        <View style={styles.emptyTop}>
          <View style={styles.emptyIconBox}>
            <Text style={{ fontSize: 28 }}>🌍</Text>
          </View>
          <View>
            <Text style={styles.emptyTitle}>Welcome to StatusVault</Text>
            <Text style={styles.emptySubtitle}>Your immigration documents, organized and tracked</Text>
          </View>
        </View>
        <View style={styles.emptyHintRow}>
          <Ionicons name="add-circle-outline" size={14} color={colors.accent} />
          <Text style={styles.emptyHint}>Add your first document to get started</Text>
        </View>
      </View>
    );
  }

  const urgColor  = getUrgencyColor(deadline.daysRemaining);
  const isExpired = deadline.daysRemaining < 0;
  const urgLabel  = isExpired ? 'EXPIRED' : deadline.daysRemaining <= 7 ? 'CRITICAL' : deadline.daysRemaining <= 30 ? 'URGENT' : 'ACTIVE';

  return (
    <View style={[styles.tile, { borderTopColor: urgColor }]}>
      <View style={styles.tileHeader}>
        <View style={styles.tileLeft}>
          <Text style={styles.tileEye}>MOST CRITICAL DEADLINE</Text>
          <Text style={styles.tileLabel}>{deadline.icon} {deadline.label}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: urgColor + '18', borderColor: urgColor + '30' }]}>
          <View style={[styles.chipDot, { backgroundColor: urgColor }]} />
          <Text style={[styles.chipText, { color: urgColor }]}>{urgLabel}</Text>
        </View>
      </View>
      <View style={styles.tileBody}>
        <View>
          <Text style={[styles.tileNumber, { color: isExpired ? colors.danger : colors.text1 }]}>
            {Math.abs(deadline.daysRemaining)}
          </Text>
          <Text style={styles.tileUnit}>{isExpired ? 'days overdue' : 'days remaining'}</Text>
          <Text style={styles.tileDate}>{isExpired ? 'Expired' : 'Expires'} {formatDate(deadline.expiryDate)}</Text>
        </View>
        <View style={styles.tileRight}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {
              backgroundColor: urgColor,
              width: `${Math.min(Math.max(100 - (deadline.daysRemaining / 365) * 100, 0), 100)}%` as any,
            }]} />
          </View>
          <Text style={styles.tileDoc}>{totalDocs} document{totalDocs !== 1 ? 's' : ''} tracked</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tile:       { backgroundColor: colors.card, borderRadius: radius.lg, marginHorizontal: spacing.screen, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border, borderTopWidth: 3, borderTopColor: colors.accent, padding: spacing.xl, ...shadows.md },
  tileEmpty:  { borderTopColor: colors.accent },
  tileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  tileLeft:   { flex: 1 },
  tileEye:    { ...typography.micro, color: colors.text3, marginBottom: 4 },
  tileLabel:  { ...typography.h3, color: colors.text1, fontSize: 16 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  chipDot:    { width: 5, height: 5, borderRadius: 3 },
  chipText:   { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  tileBody:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  tileNumber: { fontSize: 48, fontFamily: 'Inter_800ExtraBold', letterSpacing: -2, lineHeight: 52 },
  tileUnit:   { ...typography.bodyMedium, color: colors.text2, marginTop: 2 },
  tileDate:   { ...typography.caption, color: colors.text3, marginTop: 2 },
  tileRight:  { flex: 1, alignItems: 'flex-end', gap: spacing.sm },
  progressTrack:{ height: 6, width: 120, backgroundColor: colors.background, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  progressFill: { height: '100%', borderRadius: 3 },
  tileDoc:    { ...typography.caption, color: colors.text3 },
  emptyTop:   { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.md },
  emptyIconBox:{ width: 52, height: 52, borderRadius: 12, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  emptyTitle: { ...typography.h3, color: colors.text1, fontSize: 15 },
  emptySubtitle:{ ...typography.caption, color: colors.text3, maxWidth: 220, marginTop: 3 },
  emptyHintRow: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  emptyHint:  { ...typography.caption, color: colors.accent },
});
