// ═══════════════════════════════════════════════════════════════
// CounterScreen — Immigration Day Timers
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IS_WEB } from '../utils/responsive';
import { useStore } from '../store';
import { useDialog } from '../components/ConfirmDialog';
import { useNavigation } from '@react-navigation/native';
import { COUNTER_TEMPLATES } from '../utils/counters';

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

  // Auto-increment on mount so counters stay accurate even if Dashboard wasn't visited
  React.useEffect(() => { autoIncrementCounters(); }, []);

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
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Timer</Text>
          </TouchableOpacity>
        </View>
      )}

      {counters.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Ionicons name="timer-outline" size={40} color="#ACAEC5" /></View>
          <Text style={styles.emptyTitle}>No timers yet</Text>
          <Text style={styles.emptyDesc}>Track OPT unemployment days, 60-day grace period, and other immigration deadlines</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => {
              if (!canAddCounter()) {
                authUser && !isGuestMode ? useStore.getState().openPaywall() : useStore.getState().openAuthModal('Create a free account for up to 2 timers');
                return;
              }
              setShowAdd(true);
            }}>
            <Text style={styles.emptyBtnText}>Browse Timers</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {counters.map((ct) => {
            const pct      = ct.maxDays > 0 ? Math.min(100, (ct.daysUsed / ct.maxDays) * 100) : 0;
            const isCrit   = ct.daysUsed >= ct.critAt;
            const isWarn   = !isCrit && ct.daysUsed >= ct.warnAt;
            const barColor = isCrit ? '#EA5455' : isWarn ? '#FF9F43' : '#4F46E5';
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
                    <View style={[styles.daysBadge, { backgroundColor: barColor + '18' }]}>
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
                      <Ionicons name="remove" size={16} color="#4B4C6A" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.ctrlBtn} onPress={() => incrementCounter(ct.templateId)}>
                      <Ionicons name="add" size={16} color="#4B4C6A" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.trackBtn, ct.isTracking && styles.trackBtnActive]}
                      onPress={() => toggleCounterTracking(ct.templateId)}
                    >
                      <Ionicons name={ct.isTracking ? 'pause' : 'play'} size={13} color={ct.isTracking ? '#4F46E5' : '#64748B'} />
                      <Text style={[styles.trackBtnText, ct.isTracking && { color: '#4F46E5' }]}>
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
                      <Text style={[styles.removeText, { color: '#FF9F43' }]}>Reset</Text>
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
        <TouchableOpacity style={styles.fab} onPress={() => {
              if (!canAddCounter()) {
                authUser && !isGuestMode ? useStore.getState().openPaywall() : useStore.getState().openAuthModal('Create a free account for up to 2 timers');
                return;
              }
              setShowAdd(true);
            }}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Timer</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={22} color="#8588A5" />
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
                      : <Ionicons name="add-circle-outline" size={22} color="#7367F0" />
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

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F4F5FA' },
  content:       { paddingBottom: 40 },
  contentWeb:    { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  pageHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  pageTitle:     { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#0F172A', letterSpacing: -0.3 },
  pageSub:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 3 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 9 },
  addBtnText:    { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  emptyState:    { alignItems: 'center', padding: 48, gap: 12 },
  emptyIcon:     { width: 72, height: 72, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  emptyTitle:    { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#0F172A' },
  emptyDesc:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  emptyBtn:      { backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText:  { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  list:          { gap: 12, paddingHorizontal: 0 },
  card:          { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', overflow: 'hidden' } as any,
  cardAccent:    { width: 4 },
  cardBody:      { flex: 1, padding: 16 },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  cardIcon:      { fontSize: 24 },
  cardTitle:     { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#0F172A', marginBottom: 3 },
  cardSub:       { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#64748B' },
  daysBadge:     { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  daysNum:       { fontSize: 24, fontFamily: 'Inter_700Bold' },
  daysMax:       { fontSize: 12, fontFamily: 'Inter_500Medium' },
  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  progressTrack: { flex: 1, height: 6, backgroundColor: '#F4F5FA', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  remainText:    { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#64748B', width: 70, textAlign: 'right' },
  actions:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctrlBtn:       { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F4F5FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  trackBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#E2E8F0' },
  trackBtnActive:{ backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  trackBtnText:  { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#64748B' },
  removeText:    { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#EA5455', marginLeft: 'auto' as any },
  fab:           { position: 'absolute', bottom: 24, right: 24, width: 52, height: 52, borderRadius: 26, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' } as any,
  overlay:       { flex: 1, backgroundColor: 'rgba(47,51,73,0.60)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:         { backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '85%' as any, overflow: 'hidden', display: 'flex' as any, flexDirection: 'column' } as any,
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F4F5FA' },
  modalTitle:    { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#0F172A' },
  templateRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#F4F5FA' },
  templateRowAdded: { backgroundColor: '#FAFAFE' },
  templateLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#0F172A' },
  templateDesc:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 2 },
  templateCount: { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#4F46E5', marginTop: 3 },
  addedBadge:    { backgroundColor: '#EAFFF4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  addedText:     { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#28C76F' },
});
