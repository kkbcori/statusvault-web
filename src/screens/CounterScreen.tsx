// ═══════════════════════════════════════════════════════════════
// CounterScreen v2 · Midnight Glass — Immigration Day Timers
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IS_WEB } from '../utils/responsive';
import { useStore } from '../store';
import { useDialog } from '../components/ConfirmDialog';
import { useNavigation } from '@react-navigation/native';
import { COUNTER_TEMPLATES } from '../utils/counters';
import { colors } from '../theme';
import { AnimatedEmptyIcon } from '../components/AnimatedEmptyIcon';

export const CounterScreen: React.FC = () => {
  const navigation     = useNavigation<any>();
  const authUser       = useStore((s) => s.authUser);
  const counters       = useStore((s) => s.counters);
  const addCounter     = useStore((s) => s.addCounter);
  const isPremium      = useStore((s) => s.isPremium);
  const isGuestMode    = useStore((s) => s.isGuestMode);
  const removeCounter    = useStore((s) => s.removeCounter);
  const resetCounter     = useStore((s) => s.resetCounter);
  const canAddCounter    = useStore((s) => s.canAddCounter);
  const incrementCounter = useStore((s) => s.incrementCounter);
  const decrementCounter = useStore((s) => s.decrementCounter);
  const toggleCounterTracking = useStore((s) => s.toggleCounterTracking);
  const autoIncrementCounters = useStore((s) => s.autoIncrementCounters);

  const dialog = useDialog();
  const [showAdd, setShowAdd] = useState(false);
  const activeIds = counters.map((c) => c.templateId);

  React.useEffect(() => { autoIncrementCounters(); }, []);

  const handleAddRequest = () => {
    if (!canAddCounter()) {
      authUser && !isGuestMode
        ? useStore.getState().openPaywall()
        : useStore.getState().openAuthModal('Create a free account for up to 2 timers');
      return;
    }
    setShowAdd(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, IS_WEB && styles.contentWeb]}
      showsVerticalScrollIndicator={true}
    >
      {IS_WEB && (
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageTitle}>Immi Timers</Text>
            <Text style={styles.pageSub}>Track unemployment days, grace periods, and deadlines</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddRequest}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Timer</Text>
          </TouchableOpacity>
        </View>
      )}

      {counters.length === 0 ? (
        <View style={styles.emptyState}>
          <AnimatedEmptyIcon name="hourglass-outline" size={36} color={colors.warning} haloSize={100} />
          <Text style={styles.emptyTitle}>No timers yet</Text>
          <Text style={styles.emptyDesc}>Track OPT unemployment days, 60-day grace period, and other immigration deadlines</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleAddRequest}>
            <Text style={styles.emptyBtnText}>Browse Timers</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {counters.map((ct) => {
            const pct      = ct.maxDays > 0 ? Math.min(100, (ct.daysUsed / ct.maxDays) * 100) : 0;
            const isCrit   = ct.daysUsed >= ct.critAt;
            const isWarn   = !isCrit && ct.daysUsed >= ct.warnAt;
            const barColor = isCrit ? colors.danger : isWarn ? colors.warning : colors.primaryLight;
            const remaining = ct.maxDays - ct.daysUsed;
            return (
              <View key={ct.templateId} style={styles.card}>
                <View style={[styles.cardAccent, { backgroundColor: barColor }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardIcon}>{ct.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>{ct.label}</Text>
                      <Text style={styles.cardSub}>
                        {ct.isTracking ? '● Auto-tracking daily' : ct.startDate ? '○ Paused — days while paused not counted' : '○ Manual tracking'}
                      </Text>
                    </View>
                    <View style={[styles.daysBadge, { backgroundColor: barColor + '22', borderColor: barColor + '44' }]}>
                      <Text style={[styles.daysNum, { color: barColor }]}>{ct.daysUsed}</Text>
                      <Text style={[styles.daysMax, { color: barColor }]}>/{ct.maxDays}d</Text>
                    </View>
                  </View>

                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                    </View>
                    <Text style={styles.remainText}>{remaining > 0 ? `${remaining}d left` : 'Limit reached'}</Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => decrementCounter(ct.templateId)}>
                      <Ionicons name="remove" size={16} color="rgba(240,244,255,0.80)" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => incrementCounter(ct.templateId)}>
                      <Ionicons name="add" size={16} color="rgba(240,244,255,0.80)" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.trackBtn, ct.isTracking && styles.trackBtnActive]}
                      onPress={() => toggleCounterTracking(ct.templateId)}
                    >
                      <Ionicons name={ct.isTracking ? 'pause' : 'play'} size={13} color={ct.isTracking ? colors.primaryLight : 'rgba(240,244,255,0.60)'} />
                      <Text style={[styles.trackBtnText, ct.isTracking && { color: colors.primaryLight }]}>
                        {ct.isTracking ? 'Pause' : ct.startDate ? 'Resume' : 'Start'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => dialog.confirm({
                      title: 'Reset Counter',
                      message: `Reset "${ct.label}" to 0 days? Tracking will stop and start date will be cleared.`,
                      type: 'danger',
                      confirmLabel: 'Reset',
                      cancelLabel: 'Cancel',
                      onConfirm: () => resetCounter(ct.templateId),
                    })}>
                      <Text style={[styles.removeText, { color: colors.warning }]}>Reset</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => dialog.confirm({
                      title: 'Remove Counter',
                      message: `Remove "${ct.label}"? All tracking data will be lost.`,
                      type: 'danger',
                      confirmLabel: 'Remove',
                      cancelLabel: 'Cancel',
                      onConfirm: () => removeCounter(ct.templateId),
                    })}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {!IS_WEB && (
        <TouchableOpacity style={styles.fab} onPress={handleAddRequest}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Timer</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={22} color="rgba(240,244,255,0.60)" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
              {COUNTER_TEMPLATES.map((t) => {
                const added = activeIds.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.templateRow, added && styles.templateRowAdded]}
                    onPress={() => {
                      if (added) return;
                      addCounter(t.id); setShowAdd(false);
                    }}
                    activeOpacity={added ? 1 : 0.75}
                  >
                    <Text style={{ fontSize: 22, marginRight: 12 }}>{t.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateLabel}>{t.label}</Text>
                      <Text style={styles.templateDesc}>{t.description}</Text>
                      <Text style={styles.templateCount}>Max {t.maxDays} days · Warn at {t.warnAt}d</Text>
                    </View>
                    {added
                      ? <View style={styles.addedBadge}><Text style={styles.addedText}>Added</Text></View>
                      : <Ionicons name="add-circle-outline" size={22} color={colors.primaryLight} />
                    }
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const glass = (blur = 16) => Platform.OS === 'web' ? ({ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` } as any) : {};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: 'transparent' },
  content:       { paddingBottom: 40 },
  contentWeb:    { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 },
  pageHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  pageTitle:     { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -0.5 },
  pageSub:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', marginTop: 3 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 9, ...(Platform.OS === 'web' ? ({ boxShadow: '0 4px 14px rgba(59,139,232,0.35)' } as any) : {}) } as any,
  addBtnText:    { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },

  emptyState:    { alignItems: 'center', padding: 48, gap: 12 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(59,139,232,0.12)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle:    { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },
  emptyDesc:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  emptyBtn:      { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText:  { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },

  list:          { gap: 12, paddingHorizontal: IS_WEB ? 0 : 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    flexDirection: 'row', overflow: 'hidden',
    ...glass(16),
  } as any,
  cardAccent:    { width: 4 },
  cardBody:      { flex: 1, padding: 16 },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardIcon:      { fontSize: 24 },
  cardTitle:     { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#F0F4FF', marginBottom: 3 },
  cardSub:       { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)' },
  daysBadge:     { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  daysNum:       { fontSize: 22, fontFamily: 'Inter_800ExtraBold' },
  daysMax:       { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  progressTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  remainText:    { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.60)', width: 80, textAlign: 'right' },
  actions:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrlBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  trackBtnActive: { backgroundColor: 'rgba(59,139,232,0.16)', borderColor: 'rgba(111,175,242,0.35)' },
  trackBtnText:   { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.70)' },
  removeText:     { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.danger, marginLeft: 'auto' as any } as any,

  fab: {
    position: 'absolute', bottom: 100, right: 20,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 24px rgba(59,139,232,0.45)' } as any) : {}),
  } as any,

  overlay: { flex: 1, backgroundColor: 'rgba(3,8,18,0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: {
    backgroundColor: '#0C1A34',
    borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '85%' as any,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    display: 'flex' as any, flexDirection: 'column',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any) : {}),
  } as any,
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalTitle:    { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },
  templateRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  templateRowAdded: { backgroundColor: 'rgba(76,217,138,0.06)' },
  templateLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF' },
  templateDesc:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', marginTop: 2 },
  templateCount: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.primaryLight, marginTop: 3 },
  addedBadge:    { backgroundColor: 'rgba(76,217,138,0.15)', borderWidth: 1, borderColor: 'rgba(76,217,138,0.35)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  addedText:     { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.success },
});
