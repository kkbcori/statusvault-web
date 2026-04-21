// ═══════════════════════════════════════════════════════════════
// ExpiryCard v2 — Premium document card
// ═══════════════════════════════════════════════════════════════

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { UserDocument } from '../types';
import { calculateDaysRemaining, getUrgencyColor, getUrgencyBg, getUrgencyLabel, formatDate } from '../utils/dates';
import { CATEGORY_COLORS } from '../utils/templates';
import { usePressScale, useEntrance } from '../hooks/useAnimations';

interface ExpiryCardProps {
  document: UserDocument;
  onDelete?: () => void;
  onEdit?: () => void;
}

export const ExpiryCard: React.FC<ExpiryCardProps> = ({ document, onDelete, onEdit }) => {
  const days    = calculateDaysRemaining(document.expiryDate);
  const press   = usePressScale(0.97);
  const urgColor = getUrgencyColor(days);
  const urgBg = getUrgencyBg(days);
  const isExpired = days < 0;
  const catColor = CATEGORY_COLORS[document.category] || colors.text3;

  return (
    <Animated.View style={{ transform: [{ scale: press.scale }], marginBottom: 10 }}>
    <TouchableOpacity style={styles.container} onPress={onEdit} activeOpacity={0.88}
      onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
      <View style={[styles.strip, { backgroundColor: urgColor }]} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.iconBox, { backgroundColor: urgBg, borderColor: urgColor + '20', borderWidth: 1 }]}>
            <Text style={styles.icon}>{document.icon}</Text>
          </View>
          <View style={styles.titleArea}>
            <Text style={styles.title} numberOfLines={1}>{document.label}</Text>
            <View style={styles.metaRow}>
              <View style={[styles.categoryPill, { backgroundColor: catColor + '15', borderColor: catColor + '25', borderWidth: 1 }]}>
                <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
                <Text style={[styles.category, { color: catColor }]}>
                  {document.category.charAt(0).toUpperCase() + document.category.slice(1)}
                </Text>
              </View>
              <Text style={styles.date}>{formatDate(document.expiryDate)}</Text>
            </View>
          </View>
          <View style={[styles.urgBadge, { backgroundColor: urgBg, borderColor: urgColor + '30', borderWidth: 1 }]}>
            <Text style={[styles.urgBadgeText, { color: urgColor }]}>{getUrgencyLabel(days)}</Text>
          </View>
        </View>

        <View style={styles.countdownRow}>
          <Text style={[styles.countdownNumber, { color: urgColor }]}>{Math.abs(days)}</Text>
          <Text style={styles.countdownLabel}>{isExpired ? 'days overdue' : 'days remaining'}</Text>
          {onDelete && (
            <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.deleteText}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>

        {document.alertDays.length > 0 && (
          <View style={styles.alertRow}>
            <Text style={styles.alertLabel}>🔔 Alerts: </Text>
            <Text style={styles.alertDays}>{document.alertDays.map((d) => `${d}d`).join(', ')}</Text>
          </View>
        )}

        {document.documentNumber ? (
          <View style={styles.docNumRow}>
            <Ionicons name="barcode-outline" size={12} color={colors.text3} />
            <Text style={styles.docNum} numberOfLines={1}># {document.documentNumber}</Text>
          </View>
        ) : null}
        {document.notes ? <Text style={styles.notes} numberOfLines={2}>{document.notes}</Text> : null}
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.card, borderRadius: radius.lg, marginBottom: spacing.md, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  strip: { width: 4 },
  content: { flex: 1, padding: spacing.lg },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  iconBox: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 22 },
  titleArea: { flex: 1 },
  title: { ...typography.bodySemibold, color: colors.text1, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  categoryDot: { width: 5, height: 5, borderRadius: 3 },
  category: { fontSize: 11, fontWeight: '600' },
  date: { ...typography.caption, color: colors.text3, fontSize: 12 },
  urgBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  urgBadgeText: { ...typography.micro, fontSize: 9 },
  countdownRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: spacing.sm },
  countdownNumber: { fontSize: 28, fontWeight: '900', lineHeight: 28 },
  countdownLabel: { ...typography.caption, color: colors.text3, flex: 1 },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.dangerLight },
  deleteText: { ...typography.caption, color: colors.danger, fontSize: 12, fontWeight: '600' },
  alertRow: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.borderLight },
  alertLabel: { fontSize: 12, color: colors.text3 },
  alertDays: { ...typography.caption, color: colors.text2, fontSize: 12, fontWeight: '600' },
  docNumRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  docNum: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text3, flex: 1 },
  notes: { ...typography.caption, color: colors.text3, marginTop: spacing.sm, fontStyle: 'italic' },
});
