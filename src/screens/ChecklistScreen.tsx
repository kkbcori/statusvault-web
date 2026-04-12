// ═══════════════════════════════════════════════════════════════
// ChecklistScreen — Immigration Checklists
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, shadows } from '../theme';
import { IS_WEB } from '../utils/responsive';
import { useStore } from '../store';
import { useNavigation } from '@react-navigation/native';
import { CHECKLIST_TEMPLATES } from '../utils/checklists';

export const ChecklistScreen: React.FC = () => {
  const navigation         = useNavigation<any>();
  const authUser           = useStore((s) => s.authUser);
  const checklists         = useStore((s) => s.checklists);
  const addChecklist       = useStore((s) => s.addChecklist);
  const isPremium          = useStore((s) => s.isPremium);
  const isGuestMode        = useStore((s) => s.isGuestMode);
  const CHECKLIST_LIMIT    = (!authUser2 || isGuestMode) ? 1 : 1;  // same limit for both
  const removeChecklist    = useStore((s) => s.removeChecklist);
  const toggleChecklistItem= useStore((s) => s.toggleChecklistItem);

  const [showAdd,   setShowAdd]   = useState(false);
  const [expanded,  setExpanded]  = useState<string | null>(null);

  const activeIds = checklists.map((c) => c.templateId);

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
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addBtnText}>Add Checklist</Text>
          </TouchableOpacity>
        </View>
      )}

      {checklists.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Ionicons name="checkbox-outline" size={40} color="#ACAEC5" /></View>
          <Text style={styles.emptyTitle}>No checklists yet</Text>
          <Text style={styles.emptyDesc}>Add a checklist to track your OPT, H-1B, or green card application steps</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => { onPress={() => {
              if (!canAddChecklist()) {
                authUser && !isGuestMode ? useStore.getState().openPaywall() : useStore.getState().openAuthModal('Create a free account for up to 2 checklists');
                return;
              }
              setShowAdd(true);
            }}>
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
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardIcon}>{cl.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{cl.label}</Text>
                    <View style={styles.progressRow}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: pct === 100 ? '#28C76F' : '#4F46E5' }]} />
                      </View>
                      <Text style={styles.progressText}>{done}/{total}</Text>
                    </View>
                  </View>
                  <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#ACAEC5" />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.cardBody}>
                    {cl.items.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.itemRow}
                        onPress={() => toggleChecklistItem(cl.templateId, item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                          {item.done && <Ionicons name="checkmark" size={11} color="#fff" />}
                        </View>
                        <Text style={[styles.itemText, item.done && styles.itemTextDone]}>{item.text}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeChecklist(cl.templateId)}
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
        <TouchableOpacity style={styles.fab} onPress={() => { onPress={() => {
              if (!canAddChecklist()) {
                authUser && !isGuestMode ? useStore.getState().openPaywall() : useStore.getState().openAuthModal('Create a free account for up to 2 checklists');
                return;
              }
              setShowAdd(true);
            }}>
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
                <Ionicons name="close" size={22} color="#8588A5" />
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
  list:          { gap: 12, paddingHorizontal: IS_WEB ? 0 : 16 },
  card:          { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' } as any,
  cardHeader:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  cardIcon:      { fontSize: 24 },
  cardTitle:     { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#0F172A', marginBottom: 6 },
  progressRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressTrack: { flex: 1, height: 5, backgroundColor: '#F4F5FA', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressText:  { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#64748B', width: 36 },
  cardBody:      { borderTopWidth: 1, borderTopColor: '#F4F5FA', padding: 16 },
  itemRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F4F5FA' },
  checkbox:      { width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  checkboxDone:  { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  itemText:      { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#0F172A', lineHeight: 20 },
  itemTextDone:  { color: '#ACAEC5', textDecorationLine: 'line-through' },
  removeBtn:     { alignSelf: 'flex-end', marginTop: 12 },
  removeBtnText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#EA5455' },
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
