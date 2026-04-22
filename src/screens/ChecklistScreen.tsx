// ═══════════════════════════════════════════════════════════════
// ChecklistScreen v2 · Midnight Glass
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { AnimatedEmptyIcon } from '../components/AnimatedEmptyIcon';
import { IS_WEB } from '../utils/responsive';
import { useStore } from '../store';
import { useDialog } from '../components/ConfirmDialog';
import { useNavigation } from '@react-navigation/native';
import { CHECKLIST_TEMPLATES } from '../utils/checklists';

export const ChecklistScreen: React.FC = () => {
  const navigation         = useNavigation<any>();
  const authUser           = useStore((s) => s.authUser);
  const checklists         = useStore((s) => s.checklists);
  const addChecklist       = useStore((s) => s.addChecklist);
  const isPremium          = useStore((s) => s.isPremium);
  const isGuestMode        = useStore((s) => s.isGuestMode);
  const removeChecklist    = useStore((s) => s.removeChecklist);
  const canAddChecklist    = useStore((s) => s.canAddChecklist);
  const toggleChecklistItem= useStore((s) => s.toggleChecklistItem);

  const dialog = useDialog();
  const [showAdd,   setShowAdd]   = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const activeIds = checklists.map((c) => c.templateId);

  const handleAddRequest = () => {
    if (!canAddChecklist()) {
      authUser && !isGuestMode
        ? useStore.getState().openPaywall()
        : useStore.getState().openAuthModal('Create a free account for up to 2 checklists');
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
            <Text style={styles.pageTitle}>Immi Checklist</Text>
            <Text style={styles.pageSub}>Track every step of your immigration process</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddRequest}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Checklist</Text>
          </TouchableOpacity>
        </View>
      )}

      {checklists.length === 0 ? (
        <View style={styles.emptyState}>
          <AnimatedEmptyIcon name="list" size={36} color={colors.primaryLight} haloSize={100} />
          <Text style={styles.emptyTitle}>No checklists yet</Text>
          <Text style={styles.emptyDesc}>Add a checklist to track your OPT, H-1B, or green card application steps</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={handleAddRequest}>
            <Text style={styles.emptyBtnText}>Browse Checklists</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {checklists.map((cl) => {
            const done  = cl.items.filter((i) => i.done).length;
            const total = cl.items.length;
            const pct   = total > 0 ? (done / total) * 100 : 0;
            const isOpen = expanded === cl.templateId;
            return (
              <View key={cl.templateId} style={styles.card}>
                <TouchableOpacity
                  style={styles.cardHeader}
                  onPress={() => setExpanded(isOpen ? null : cl.templateId)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.cardIcon}>{cl.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{cl.label}</Text>
                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: pct === 100 ? colors.success : colors.primaryLight }]} />
                      </View>
                      <Text style={styles.progressText}>{done}/{total}</Text>
                    </View>
                  </View>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(240,244,255,0.45)" />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.cardBody}>
                    {cl.items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.itemRow}
                        onPress={() => toggleChecklistItem(cl.templateId, item.id)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                          {item.done && <Ionicons name="checkmark" size={11} color="#fff" />}
                        </View>
                        <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.text}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => dialog.confirm({
                        title: 'Remove Checklist',
                        message: `Remove "${cl.label}"? All your progress (${done}/${total} steps) will be lost.`,
                        type: 'danger',
                        confirmLabel: 'Remove',
                        cancelLabel: 'Cancel',
                        onConfirm: () => removeChecklist(cl.templateId),
                      })}
                    >
                      <Text style={styles.removeBtnText}>Remove checklist</Text>
                    </TouchableOpacity>
                  </View>
                )}
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

      {/* Add checklist modal */}
      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Checklist</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={22} color="rgba(240,244,255,0.60)" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
              {CHECKLIST_TEMPLATES.map((t) => {
                const added = activeIds.includes(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.templateRow, added && styles.templateRowAdded]}
                    onPress={() => {
                      if (added) return;
                      addChecklist(t.id); setShowAdd(false);
                    }}
                    activeOpacity={added ? 1 : 0.75}
                  >
                    <Text style={{ fontSize: 22, marginRight: 12 }}>{t.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.templateLabel}>{t.label}</Text>
                      <Text style={styles.templateDesc}>{t.description}</Text>
                      <Text style={styles.templateCount}>{t.items.length} steps</Text>
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
    overflow: 'hidden',
    ...glass(16),
  } as any,
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  cardIcon:      { fontSize: 24 },
  cardTitle:     { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#F0F4FF', marginBottom: 6 },
  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressText:  { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.60)', width: 36 },

  cardBody:      { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', padding: 16 },
  itemRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  checkbox:      { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxDone:  { backgroundColor: colors.primary, borderColor: colors.primary },
  itemText:      { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#F0F4FF', lineHeight: 20 },
  itemTextDone:  { color: 'rgba(240,244,255,0.40)', textDecorationLine: 'line-through' },
  removeBtn:     { alignSelf: 'flex-end', marginTop: 12 },
  removeBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.danger },

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
