// ═══════════════════════════════════════════════════════════════
// UnemploymentCounter — 90-day OPT unemployment tracker
// Big visual counter with +/- buttons and auto-track toggle
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useStore } from '../store';

export const UnemploymentCounter: React.FC = () => {
  const {
    unemployment,
    incrementUnemployment,
    decrementUnemployment,
    setUnemploymentTracking,
  } = useStore();

  const { daysUsed, isTracking } = unemployment;
  const pct = (daysUsed / 90) * 100;
  const remaining = 90 - daysUsed;

  // Color based on severity
  const getColor = () => {
    if (daysUsed >= 80) return colors.danger;
    if (daysUsed >= 60) return colors.warning;
    return colors.success;
  };

  const color = getColor();
  const bgColor =
    daysUsed >= 80
      ? colors.dangerLight
      : daysUsed >= 60
        ? colors.warningLight
        : colors.successLight;

  const statusText =
    daysUsed >= 80
      ? 'AT RISK'
      : daysUsed >= 60
        ? 'MONITOR'
        : 'SAFE';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Unemployment Counter</Text>
          <Text style={styles.subtitle}>90-day OPT limit</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
          <Text style={[styles.badgeText, { color }]}>{statusText}</Text>
        </View>
      </View>

      {/* Big number */}
      <View style={styles.countRow}>
        <Text style={[styles.bigNumber, { color }]}>{daysUsed}</Text>
        <Text style={styles.separator}> / </Text>
        <Text style={styles.maxNumber}>90</Text>
        <Text style={styles.unit}> days used</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.remainingText}>{remaining} days remaining</Text>

      {/* Auto-tracking toggle */}
      <View style={styles.trackingRow}>
        <View>
          <Text style={styles.trackingLabel}>Auto-track unemployment</Text>
          <Text style={styles.trackingDesc}>
            Adds 1 day automatically each day
          </Text>
        </View>
        <Switch
          value={isTracking}
          onValueChange={setUnemploymentTracking}
          trackColor={{ false: colors.border, true: color + '66' }}
          thumbColor={isTracking ? color : '#f4f4f4'}
        />
      </View>

      {/* +/- buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.buttonOutline]}
          onPress={() => decrementUnemployment(1)}
          disabled={daysUsed <= 0}
          activeOpacity={0.6}
        >
          <Text style={styles.buttonIcon}>−</Text>
          <Text style={styles.buttonLabel}>Remove Day</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: color + '15', borderColor: color + '30' }]}
          onPress={() => incrementUnemployment(1)}
          disabled={daysUsed >= 90}
          activeOpacity={0.6}
        >
          <Text style={[styles.buttonIcon, { color }]}>+</Text>
          <Text style={[styles.buttonLabel, { color }]}>Add Day</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginHorizontal: spacing.screen,
    marginTop: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.text1,
  },
  subtitle: {
    ...typography.caption,
    color: colors.text3,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    ...typography.micro,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  bigNumber: {
    fontSize: 44,
    fontWeight: '900',
    lineHeight: 44,
    letterSpacing: -1.5,
  },
  separator: {
    fontSize: 24,
    fontWeight: '300',
    color: colors.text3,
  },
  maxNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text3,
  },
  unit: {
    ...typography.caption,
    color: colors.text3,
    marginLeft: 4,
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.borderLight,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  remainingText: {
    ...typography.caption,
    color: colors.text3,
    marginBottom: spacing.lg,
  },
  trackingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  trackingLabel: {
    ...typography.bodySemibold,
    color: colors.text1,
    fontSize: 14,
  },
  trackingDesc: {
    ...typography.caption,
    color: colors.text3,
    marginTop: 1,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    gap: 6,
  },
  buttonOutline: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  buttonIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text2,
  },
  buttonLabel: {
    ...typography.captionBold,
    color: colors.text2,
  },
});
