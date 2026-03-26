// ═══════════════════════════════════════════════════════════════
// StatusCard v2 — Passport-inspired hero card
// Gold foil accents, globe wireframe decoration, refined typography
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { DeadlineItem } from '../types';
import { getUrgencyColor, formatDate } from '../utils/dates';
import { LinearGradient } from 'expo-linear-gradient';

interface StatusCardProps {
  deadline: DeadlineItem | null;
  totalDocs: number;
}

export const StatusCard: React.FC<StatusCardProps> = ({ deadline, totalDocs }) => {
  if (!deadline) {
    return (
      <LinearGradient
        colors={[colors.primary, '#132847', '#1B3A65']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.emptyCard]}
      >
        {/* Decorative passport pattern */}
        <View style={styles.passportLines}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={[styles.passportLine, { top: 20 + i * 28, opacity: 0.03 + i * 0.01 }]} />
          ))}
        </View>
        {/* Globe decoration */}
        <View style={styles.globeDecor}>
          <View style={styles.globeRing} />
          <View style={[styles.globeRing, { width: 100, height: 100, borderRadius: 50 }]} />
          <View style={styles.globeMeridian} />
          <View style={[styles.globeMeridian, { transform: [{ rotate: '60deg' }] }]} />
          <View style={[styles.globeMeridian, { transform: [{ rotate: '120deg' }] }]} />
        </View>
        <View style={styles.emptyContent}>
          <View style={styles.stampCircle}>
            <Text style={styles.stampIcon}>🌍</Text>
          </View>
          <Text style={styles.emptyTitle}>Welcome to StatusVault</Text>
          <Text style={styles.emptySubtitle}>Your immigration documents, organized and tracked</Text>
          <View style={styles.goldDivider} />
          <Text style={styles.emptyHint}>✈️  Add your first document to get started</Text>
        </View>
      </LinearGradient>
    );
  }

  const urgColor = getUrgencyColor(deadline.daysRemaining);
  const isExpired = deadline.daysRemaining < 0;

  return (
    <LinearGradient
      colors={[colors.primary, '#132847', '#1B3A65']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {/* Decorative passport-style elements */}
      <View style={styles.passportLines}>
        {[...Array(4)].map((_, i) => (
          <View key={i} style={[styles.passportLine, { top: 15 + i * 30, opacity: 0.03 + i * 0.008 }]} />
        ))}
      </View>
      <View style={styles.cornerStamp} />
      <View style={styles.cornerStampBR} />

      {/* Gold trim top */}
      <View style={styles.goldTrim} />

      <View style={styles.header}>
        <View>
          <Text style={styles.label}>✈️  MOST CRITICAL</Text>
          <Text style={styles.title} numberOfLines={1}>
            {deadline.icon} {deadline.label}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: urgColor + '33', borderColor: urgColor + '44', borderWidth: 1 }]}>
          <Text style={[styles.badgeText, { color: urgColor }]}>
            {isExpired ? 'EXPIRED' : deadline.daysRemaining <= 30 ? 'URGENT' : 'ACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.countdownRow}>
        <Text style={[styles.countdownNumber, { color: isExpired ? colors.danger : colors.accent }]}>
          {Math.abs(deadline.daysRemaining)}
        </Text>
        <View>
          <Text style={styles.countdownUnit}>
            {isExpired ? 'days overdue' : 'days left'}
          </Text>
          <Text style={styles.countdownDate}>
            {isExpired ? 'Expired' : 'Expires'} {formatDate(deadline.expiryDate)}
          </Text>
        </View>
      </View>

      {/* Gold-accented progress bar */}
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={isExpired ? [colors.danger, '#FF6B6B'] : [colors.accent, '#E8C468']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, {
            width: `${Math.min(Math.max(100 - (deadline.daysRemaining / 365) * 100, 0), 100)}%`,
          }]}
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>
          📄 Tracking {totalDocs} document{totalDocs !== 1 ? 's' : ''}
        </Text>
        <Text style={styles.footerBrand}>STATUSVAULT</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    marginHorizontal: spacing.screen,
    marginTop: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    minHeight: 200,
  },
  emptyCard: { paddingVertical: spacing.huge },
  emptyContent: { alignItems: 'center', zIndex: 2 },
  stampCircle: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: 'rgba(201,163,81,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    backgroundColor: 'rgba(201,163,81,0.08)',
  },
  stampIcon: { fontSize: 32 },
  emptyTitle: { ...typography.h2, color: colors.textInverse, textAlign: 'center', fontSize: 20 },
  emptySubtitle: { ...typography.caption, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 6, maxWidth: 240 },
  goldDivider: { width: 40, height: 2, backgroundColor: colors.accent, marginVertical: 16, borderRadius: 1, opacity: 0.6 },
  emptyHint: { ...typography.caption, color: 'rgba(201,163,81,0.7)', fontSize: 13 },

  // Passport decorations
  passportLines: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  passportLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#fff' },
  globeDecor: { position: 'absolute', right: -30, top: -30, width: 140, height: 140, opacity: 0.04 },
  globeRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1.5, borderColor: '#fff' },
  globeMeridian: { position: 'absolute', left: 69, top: 0, width: 2, height: 140, backgroundColor: '#fff' },
  cornerStamp: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(201,163,81,0.1)' },
  cornerStampBR: { position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(201,163,81,0.06)' },
  goldTrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, opacity: 0.35 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg, zIndex: 2 },
  label: { ...typography.micro, color: 'rgba(201,163,81,0.7)', marginBottom: 4, letterSpacing: 1.5 },
  title: { ...typography.h2, color: colors.textInverse, maxWidth: 220 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  badgeText: { ...typography.micro },
  countdownRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: spacing.lg, zIndex: 2 },
  countdownNumber: { fontSize: 56, fontWeight: '900', lineHeight: 56, letterSpacing: -2 },
  countdownUnit: { ...typography.bodySemibold, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  countdownDate: { ...typography.caption, color: 'rgba(255,255,255,0.4)' },
  progressTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden', marginBottom: spacing.md, zIndex: 2 },
  progressFill: { height: '100%', borderRadius: 3 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 },
  footerText: { ...typography.caption, color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  footerBrand: { ...typography.micro, color: 'rgba(201,163,81,0.2)', letterSpacing: 2, fontSize: 9 },
});
