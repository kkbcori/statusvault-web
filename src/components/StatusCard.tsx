// StatusCard v5 — Dark navy hero + urgency bar chart
// Empty state tappable → opens Documents add flow

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppIcon } from '../utils/icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { DeadlineItem } from '../types';
import { getUrgencyColor, formatDate } from '../utils/dates';

interface StatusCardProps {
  deadline: DeadlineItem | null;
  totalDocs: number;
  deadlines?: DeadlineItem[];
}

// ─── Urgency bar chart ─────────────────────────────────────────
const UrgencyBars: React.FC<{ deadlines: DeadlineItem[] }> = ({ deadlines }) => {
  const groups = {
    expired:  deadlines.filter((d) => d.daysRemaining < 0).length,
    critical: deadlines.filter((d) => d.daysRemaining >= 0  && d.daysRemaining <= 30).length,
    upcoming: deadlines.filter((d) => d.daysRemaining > 30  && d.daysRemaining <= 90).length,
    safe:     deadlines.filter((d) => d.daysRemaining > 90).length,
  };
  const total = deadlines.length || 1;
  const bars = [
    { label: 'Expired',  count: groups.expired,  color: colors.danger  },
    { label: 'Critical', count: groups.critical, color: colors.warning  },
    { label: 'Upcoming', count: groups.upcoming, color: '#3B82F6'       },
    { label: 'Safe',     count: groups.safe,     color: colors.success  },
  ].filter((b) => b.count > 0);
  if (bars.length === 0) return null;
  return (
    <View style={barStyles.wrap}>
      <View style={barStyles.track}>
        {bars.map((b, i) => (
          <View key={i} style={[barStyles.segment, { backgroundColor: b.color, flex: b.count / total },
            i === 0 && { borderTopLeftRadius: 4, borderBottomLeftRadius: 4 },
            i === bars.length - 1 && { borderTopRightRadius: 4, borderBottomRightRadius: 4 },
          ]} />
        ))}
      </View>
      <View style={barStyles.legend}>
        {bars.map((b, i) => (
          <View key={i} style={barStyles.legendItem}>
            <View style={[barStyles.legendDot, { backgroundColor: b.color }]} />
            <Text style={barStyles.legendText}>{b.count} {b.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const barStyles = StyleSheet.create({
  wrap:       { marginTop: spacing.lg },
  track:      { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)' },
  segment:    { height: '100%' },
  legend:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.65)' },
});

export const StatusCard: React.FC<StatusCardProps> = ({ deadline, totalDocs, deadlines = [] }) => {
  const navigation = useNavigation<any>();

  // ── Empty state ─────────────────────────────────────────────
  if (!deadline) {
    return (
      <TouchableOpacity
        style={styles.emptyTile}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
      >
        <View style={styles.emptyTop}>
          <View style={styles.emptyIconBox}>
            <AppIcon name="travel" size={40} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.emptyTitle}>Welcome to StatusVault</Text>
            <Text style={styles.emptySubtitle}>Your immigration documents, organized and tracked</Text>
          </View>
        </View>
        <View style={styles.emptyHintRow}>
          <Ionicons name="add-circle-outline" size={14} color={colors.accent} />
          <Text style={styles.emptyHint}>Tap to add your first document</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.accent} />
        </View>
      </TouchableOpacity>
    );
  }

  // ── Active state — dark navy ──────────────────────────────
  const urgColor  = getUrgencyColor(deadline.daysRemaining);
  const isExpired = deadline.daysRemaining < 0;
  const urgLabel  = isExpired ? 'EXPIRED'
    : deadline.daysRemaining <= 7  ? 'CRITICAL'
    : deadline.daysRemaining <= 30 ? 'URGENT'
    : 'ACTIVE';

  return (
    <LinearGradient
      colors={['#0E2137', '#0A1628', '#132847']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={styles.darkTile}
    >
      <View style={[styles.topTrim, { backgroundColor: urgColor }]} />
      <View style={styles.darkHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.darkEye}>MOST CRITICAL DEADLINE</Text>
          <Text style={styles.darkLabel}>{deadline.icon}  {deadline.label}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: urgColor + '28', borderColor: urgColor + '50' }]}>
          <View style={[styles.chipDot, { backgroundColor: urgColor }]} />
          <Text style={[styles.chipText, { color: urgColor }]}>{urgLabel}</Text>
        </View>
      </View>
      <View style={styles.darkBody}>
        <View>
          <Text style={[styles.darkNumber, { color: isExpired ? colors.danger : 'rgba(255,255,255,0.05)' }]}>
            {Math.abs(deadline.daysRemaining)}
          </Text>
          <Text style={styles.darkUnit}>{isExpired ? 'days overdue' : 'days remaining'}</Text>
          <Text style={styles.darkDate}>{isExpired ? 'Expired' : 'Expires'} {formatDate(deadline.expiryDate)}</Text>
        </View>
        <View style={styles.darkRight}>
          <Text style={styles.darkDocCount}>{totalDocs} doc{totalDocs !== 1 ? 's' : ''} tracked</Text>
          {deadlines.length > 1 && <Text style={styles.darkAllCount}>{deadlines.length} deadlines total</Text>}
        </View>
      </View>
      {deadlines.length > 0 && <UrgencyBars deadlines={deadlines} />}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  emptyTile:     { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, marginHorizontal: spacing.screen, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, ...shadows.sm },
  emptyTop:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.md },
  emptyIconBox:  { width: 48, height: 48, borderRadius: 12, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold, flexShrink: 0 },
  emptyTitle:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text1 },
  emptySubtitle: { ...typography.caption, color: colors.text3, marginTop: 3 },
  emptyHintRow:  { flexDirection: 'row', alignItems: 'center', gap: 7, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  emptyHint:     { flex: 1, ...typography.caption, color: colors.accent },
  darkTile:      { borderRadius: radius.xl, marginHorizontal: spacing.screen, marginTop: spacing.lg, overflow: 'hidden', padding: spacing.xl, ...shadows.lg },
  topTrim:       { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  darkHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg, marginTop: 4 },
  darkEye:       { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginBottom: 4 },
  darkLabel:     { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  chip:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  chipDot:       { width: 5, height: 5, borderRadius: 3 },
  chipText:      { fontSize: 10, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  darkBody:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  darkNumber:    { fontSize: 52, fontFamily: 'Inter_800ExtraBold', letterSpacing: -2, lineHeight: 56 },
  darkUnit:      { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  darkDate:      { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  darkRight:     { alignItems: 'flex-end', gap: 4 },
  darkDocCount:  { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.5)' },
  darkAllCount:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.3)' },
});
