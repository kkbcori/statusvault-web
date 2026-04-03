// ═══════════════════════════════════════════════════════════════
// DocumentsScreen v3 — Inter · Ionicons · full-screen paywall
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, TextInput, Alert, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore, FREE_LIMIT } from '../store';
import { IS_WEB } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useDialog } from '../components/ConfirmDialog';
import { generateDeadlines } from '../utils/dates';
import { ExpiryCard } from '../components';
import { DOCUMENT_TEMPLATES, CATEGORY_LABELS, getTemplatesByCategory, DocumentTemplate } from '../utils/templates';
import { UserDocument, DocumentCategory } from '../types';
import { useRoute } from '@react-navigation/native';

const PRICE = '$3.99';
const PRICE_LABEL = '$3.99/year';

export const DocumentsScreen: React.FC = () => {
  const route              = useRoute<any>();
  const documents          = useStore((s) => s.documents);
  const addDocument        = useStore((s) => s.addDocument);
  const removeDocument     = useStore((s) => s.removeDocument);
  const updateDocument     = useStore((s) => s.updateDocument);
  const canAddDocument     = useStore((s) => s.canAddDocument);
  const isPremium          = useStore((s) => s.isPremium);
  const authUser           = useStore((s) => s.authUser);
  const setAnyModalOpen    = useStore((s) => s.setAnyModalOpen);
  const getRemainingFreeSlots = useStore((s) => s.getRemainingFreeSlots);
  const dialog = useDialog();

  const [showAddModal,    setShowAddModal]    = useState(false);
  const [showPaywall,     setShowPaywall]     = useState(false);
  const [addStep,         setAddStep]         = useState<'type' | 'date'>('type');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [expiryDate,      setExpiryDate]      = useState(new Date());
  const [showDatePicker,  setShowDatePicker]  = useState(false);
  const [notes,           setNotes]           = useState('');
  const [filterCategory,  setFilterCategory]  = useState<DocumentCategory | 'all'>('all');
  const [editingDoc,      setEditingDoc]      = useState<UserDocument | null>(null);

  const templatesByCategory = getTemplatesByCategory();
  const remaining = getRemainingFreeSlots();

  React.useEffect(() => {
    if (route.params?.openPaywall && !canAddDocument()) setShowPaywall(true); setAnyModalOpen(true);
  }, [route.params]);

  const filteredDocs = filterCategory === 'all' ? documents : documents.filter((d) => d.category === filterCategory);

  const resetAddFlow = () => {
    setAddStep('type'); setSelectedTemplate(null);
    setExpiryDate(new Date()); setNotes(''); setShowDatePicker(false);
    setEditingDoc(null);
  };

  const openAdd = () => {
    if (!authUser) { useStore.getState().openAuthModal('Sign in to add and track your documents'); return; }
    if (!canAddDocument()) { setShowPaywall(true); setAnyModalOpen(true); return; }
    resetAddFlow(); setShowAddModal(true); setAnyModalOpen(true);
  };

  const selectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template); setAddStep('date');
    if (Platform.OS !== 'web') setShowDatePicker(true);
    // On web, date input is always shown — no need to toggle
  };

  const handleSave = async () => {
    if (editingDoc) {
      // Editing — selectedTemplate not required
      await updateDocument(editingDoc.id, {
        expiryDate: expiryDate.toISOString().split('T')[0],
        notes: notes.trim(),
      });
      setShowAddModal(false); setAnyModalOpen(false); setEditingDoc(null); resetAddFlow();
      return;
    }
    if (!selectedTemplate) return;
    const doc: UserDocument = {
      id: Date.now().toString(), templateId: selectedTemplate.id, label: selectedTemplate.label,
      category: selectedTemplate.category, expiryDate: expiryDate.toISOString().split('T')[0],
      alertDays: selectedTemplate.alertDays, icon: selectedTemplate.icon,
      notes: notes.trim(), notificationIds: [], createdAt: new Date().toISOString(),
    };
    const success = await addDocument(doc);
    if (success) { setShowAddModal(false); setAnyModalOpen(false); resetAddFlow(); }
    else { setShowAddModal(false); setAnyModalOpen(false); resetAddFlow(); setShowPaywall(true); setAnyModalOpen(true); }
  };

  const handleDelete = (id: string, label: string) => {
    dialog.confirm({ title: 'Remove Document', message: `Remove "${label}"? Notifications will be cancelled.`,
      type: 'danger', confirmLabel: 'Remove', onConfirm: () => removeDocument(id) });
  };

  const handleEdit = (doc: UserDocument) => {
    if (!canAddDocument() && !doc) return;
    resetAddFlow();
    setEditingDoc(doc);
    setSelectedTemplate(
      DOCUMENT_TEMPLATES.find((t) => t.id === doc.templateId) || null
    );
    setExpiryDate(new Date(doc.expiryDate + 'T12:00:00'));
    setNotes(doc.notes || '');
    setAddStep('date');
    setShowAddModal(true); setAnyModalOpen(true);
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setExpiryDate(selectedDate);
  };

  const categories: (DocumentCategory | 'all')[] = ['all', 'visa', 'employment', 'travel', 'academic', 'immigration', 'other'];
  const categoryLabels: Record<string, string> = { all: 'All', ...CATEGORY_LABELS };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {/* Header */}
        <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={styles.headerGradient}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>DOCUMENTS</Text>
              <Text style={styles.title}>Your Documents</Text>
              <Text style={styles.subtitle}>
                {documents.length} tracked{!isPremium ? ` · ${remaining} free left` : ' · Premium ⭐'}
              </Text>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.8}>
              <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.addBtnGrad}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categories.map((cat) => {
            const count = cat === 'all' ? documents.length : documents.filter((d) => d.category === cat).length;
            if (cat !== 'all' && count === 0) return null;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.filterChip, filterCategory === cat && styles.filterChipActive]}
                onPress={() => setFilterCategory(cat)}
              >
                <Text style={[styles.filterChipText, filterCategory === cat && styles.filterChipTextActive]}>
                  {categoryLabels[cat]} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Document List */}
        <View style={{ paddingHorizontal: spacing.screen }}>
          {filteredDocs.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}><Text style={{ fontSize: 28 }}>📂</Text></View>
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptySubtitle}>Tap "+ Add" to track your first visa or document</Text>
            </View>
          ) : (
            filteredDocs
              .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
              .map((doc) => <ExpiryCard key={doc.id} document={doc} onDelete={() => handleDelete(doc.id, doc.label)} onEdit={() => handleEdit(doc)} />)
          )}
        </View>

        {/* Notification info */}
        {documents.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="notifications-outline" size={18} color={'#7367F0'} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Smart Alerts Active</Text>
              <Text style={styles.infoDesc}>Each document type has custom alert windows based on real-world renewal timelines.</Text>
            </View>
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ═══ ADD DOCUMENT MODAL ═══ */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { if (addStep === 'date') setAddStep('type'); else setShowAddModal(false); setAnyModalOpen(false); }}>
                <Text style={styles.modalBack}>{addStep === 'date' ? '← Back' : 'Cancel'}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{editingDoc ? 'Edit Document' : addStep === 'type' ? 'Select Document' : 'Set Expiry Date'}</Text>
              <View style={{ width: 60 }} />
            </View>

            {addStep === 'type' && (
              <FlatList style={{ flex: 1 }}
                data={Object.entries(templatesByCategory)}
                keyExtractor={([c]) => c}
                showsVerticalScrollIndicator={false}
                renderItem={({ item: [category, templates] }) => {
                  if (templates.length === 0) return null;
                  return (
                    <View style={styles.templateSection}>
                      <Text style={styles.templateSectionTitle}>{CATEGORY_LABELS[category as DocumentCategory]}</Text>
                      {templates.map((tmpl) => {
                        const alreadyAdded = documents.some((d) => d.templateId === tmpl.id);
                        return (
                          <TouchableOpacity
                            key={tmpl.id}
                            style={[styles.templateRow, alreadyAdded && styles.templateRowDisabled]}
                            onPress={() => !alreadyAdded && selectTemplate(tmpl)}
                            activeOpacity={alreadyAdded ? 1 : 0.6}
                          >
                            <View style={styles.tIconBox}><Text style={{ fontSize: 22 }}>{tmpl.icon}</Text></View>
                            <View style={styles.templateInfo}>
                              <Text style={styles.templateLabel}>{tmpl.label}</Text>
                              <Text style={styles.templateDesc}>{tmpl.description}</Text>
                            </View>
                            {alreadyAdded
                              ? <Text style={styles.addedBadge}>Added ✓</Text>
                              : <Ionicons name="chevron-forward" size={20} color={colors.text3} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                }}
              />
            )}

            {(addStep === 'date' && selectedTemplate) || (editingDoc && addStep === 'date') ? (
              <ScrollView style={styles.dateStep} showsVerticalScrollIndicator={false}>
                <View style={styles.selectedSummary}>
                  <Text style={styles.selectedIcon}>{selectedTemplate?.icon ?? editingDoc?.icon ?? '📄'}</Text>
                  <View>
                    <Text style={styles.selectedLabel}>{selectedTemplate?.label ?? editingDoc?.label ?? 'Document'}</Text>
                    <Text style={styles.selectedDesc}>
                      {selectedTemplate
                        ? `Alerts at: ${selectedTemplate.alertDays.map((d) => `${d}d`).join(', ')}`
                        : editingDoc ? `Expires ${editingDoc.expiryDate}` : ''}
                    </Text>
                  </View>
                </View>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                {IS_WEB ? (
                  <View style={styles.webDateWrap}>
                    <input
                      type="date"
                      value={expiryDate.toISOString().split('T')[0]}
                      min={editingDoc ? undefined : new Date().toISOString().split('T')[0]}
                      onChange={(e: any) => {
                        if (e.target.value) setExpiryDate(new Date(e.target.value + 'T12:00:00'));
                      }}
                      style={{
                        width: '100%', padding: '12px 14px', fontSize: '15px',
                        fontFamily: 'Inter_400Regular', color: '#111827',
                        border: '1.5px solid #E5E7EB', borderRadius: '10px',
                        backgroundColor: '#fff', outline: 'none', cursor: 'pointer',
                        boxSizing: 'border-box',
                      } as any}
                    />
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                      <Text style={styles.dateButtonText}>{expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                      <Ionicons name="calendar-outline" size={20} color={'#7367F0'} />
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={expiryDate} mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange} minimumDate={new Date()} style={styles.datePicker}
                      />
                    )}
                    {Platform.OS === 'ios' && showDatePicker && (
                      <TouchableOpacity style={styles.datePickerDone} onPress={() => setShowDatePicker(false)}>
                        <Text style={styles.datePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
                <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput} value={notes} onChangeText={setNotes}
                  placeholder="e.g., Filed at USCIS Nebraska center"
                  placeholderTextColor={colors.text3} multiline maxLength={200}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                    <Text style={styles.saveBtnText}>{editingDoc ? 'Update Document' : 'Add to StatusVault'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* ═══ PAYWALL — CENTERED DIALOG ═══ */}
      <Modal visible={showPaywall} animationType="fade" transparent>
        <View style={styles.paywallOverlay}>
          <LinearGradient
            colors={['#060E1A', '#0A1628', '#0F2040']}
            style={styles.paywallCard}
          >
          {/* Gold top trim */}
          <View style={styles.paywallTopTrim} />

          <View style={styles.paywallScroll}>
            {/* Close */}
            <TouchableOpacity style={styles.paywallCloseBtn} onPress={() => { setShowPaywall(false); setAnyModalOpen(false); }}>
              <View style={styles.paywallCloseCircle}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>

            {/* Hero */}
            <View style={styles.paywallHero}>
              <View style={styles.paywallIconRing}>
                <View style={styles.paywallIconInner}>
                  <Ionicons name="shield-checkmark" size={40} color={'#7367F0'} />
                </View>
              </View>
              <Text style={styles.paywallEyebrow}>STATUSVAULT PREMIUM</Text>
              <Text style={styles.paywallTitle}>Protect Your{'\n'}Immigration Status</Text>
              <View style={styles.paywallGoldBar} />
              <Text style={styles.paywallSubtitle}>
                You've used all {FREE_LIMIT} free document slots.{'\n'}Upgrade to track unlimited documents.
              </Text>
            </View>

            {/* Feature list */}
            <View style={styles.paywallFeatures}>
              {[
                { icon: 'documents-outline' as const,          text: 'Unlimited document tracking' },
                { icon: 'notifications-outline' as const,      text: 'Advanced smart alerts per document type' },
                { icon: 'cloud-download-outline' as const,     text: 'Data export & import for any device' },
{ icon: 'checkmark-circle-outline' as const,   text: 'Immigration checklists & counters' },
              ].map(({ icon, text }, i) => (
                <View key={i} style={styles.paywallFeatureRow}>
                  <View style={styles.paywallFeatureIconBox}>
                    <Ionicons name={icon} size={16} color={'#7367F0'} />
                  </View>
                  <Text style={styles.paywallFeatureText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* Price block */}
            <View style={styles.paywallPriceBlock}>
              <View style={styles.paywallPriceRow}>
                <Text style={styles.paywallPrice}>{PRICE}</Text>
                <View style={styles.paywallPriceSide}>
                  <Text style={styles.paywallPeriod}>/ year</Text>
                  <Text style={styles.paywallPriceNote}>Less than $0.34/month</Text>
                </View>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.paywallCTA}
              onPress={() => dialog.confirm({ title: 'Coming Soon', message: 'In-app purchase will be available in the next update.',
                type: 'confirm', confirmLabel: 'Unlock for Testing', cancelLabel: 'Cancel',
                onConfirm: () => { useStore.getState().setPremium(true); setShowPaywall(false); setAnyModalOpen(false); } })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[colors.primary, colors.primaryLight, colors.primary]} style={styles.paywallCTAGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.paywallCTAText}>Subscribe — {PRICE_LABEL}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.paywallLegal}>Cancel anytime · Secure payment via App Store</Text>
          </View>
        </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: '#F4F5FA' },
  scrollContent:      { paddingBottom: 20 },
  headerGradient:     { paddingBottom: 8 },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.xxl + 20, paddingBottom: spacing.md },
  headerLabel:        { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: 3, fontSize: 10 },
  title:              { ...typography.h1, color: colors.text1, fontSize: 22 },
  subtitle:           { ...typography.caption, color: colors.text3, marginTop: 2 },
  addBtn:             { borderRadius: radius.md, overflow: 'hidden' },
  addBtnGrad:         { paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.md },
  addBtnText:         { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  filterRow:          { paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.sm },
  filterChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: '#DBDADE' },
  filterChipActive:   { backgroundColor: '#7367F0', borderColor: '#7367F0' },
  filterChipText:     { ...typography.caption, color: colors.text2, fontSize: 12 },
  filterChipTextActive:{ color: '#fff', fontFamily: 'Inter_700Bold' },
  emptyCard:          { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xxxl, alignItems: 'center', borderWidth: 1, borderColor: '#DBDADE', ...shadows.sm },
  emptyIconCircle:    { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  emptyTitle:         { ...typography.bodySemibold, color: colors.text2 },
  emptySubtitle:      { ...typography.caption, color: colors.text3, textAlign: 'center', marginTop: 4 },
  infoCard:           { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.screen, marginTop: spacing.md, borderWidth: 1, borderColor: '#DBDADE', ...shadows.sm },
  infoIconBox:        { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  infoContent:        { flex: 1 },
  infoTitle:          { ...typography.captionBold, color: colors.text1 },
  infoDesc:           { ...typography.caption, color: colors.text3, marginTop: 2, fontSize: 12, lineHeight: 18 },

  // Add modal
  modalOverlay:       { flex: 1, backgroundColor: colors.overlay, justifyContent: IS_WEB ? 'center' : 'flex-end', alignItems: IS_WEB ? 'center' as any : 'stretch' as any },
  modalSheet:         { backgroundColor: '#F4F5FA', borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: IS_WEB ? '80%' as any : '85%', paddingBottom: 40, width: IS_WEB ? 480 : '100%' as any, borderRadius: IS_WEB ? radius.xl : undefined, display: IS_WEB ? 'flex' as any : undefined, flexDirection: 'column', overflow: 'hidden' } as any,
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalBack:          { ...typography.bodySemibold, color: '#7367F0', fontSize: 14 },
  modalTitle:         { ...typography.h3, color: colors.text1, fontSize: 16 },
  templateSection:    { paddingTop: spacing.lg },
  templateSectionTitle:{ ...typography.micro, color: colors.text3, letterSpacing: 1, paddingHorizontal: spacing.screen, marginBottom: spacing.sm },
  templateRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.screen, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md },
  templateRowDisabled:{ opacity: 0.4 },
  tIconBox:           { width: 42, height: 42, borderRadius: 12, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  templateInfo:       { flex: 1 },
  templateLabel:      { ...typography.bodySemibold, color: colors.text1, fontSize: 14 },
  templateDesc:       { ...typography.caption, color: colors.text3, fontSize: 12, marginTop: 1 },
  addedBadge:         { ...typography.caption, color: colors.success, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  dateStep:           { padding: spacing.screen },
  selectedSummary:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: '#F0EEFF', padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.xxl, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  selectedIcon:       { fontSize: 32 },
  selectedLabel:      { ...typography.bodySemibold, color: '#7367F0' },
  selectedDesc:       { ...typography.caption, color: '#7367F0', fontSize: 12, marginTop: 2 },
  fieldLabel:         { ...typography.captionBold, color: colors.text2, marginBottom: spacing.sm, letterSpacing: 0.3 },
  dateButton:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: '#DBDADE' },
  dateButtonText:     { ...typography.bodySemibold, color: colors.text1 },
  datePicker:         { marginTop: spacing.sm },
  webDateWrap:        { marginTop: spacing.sm, marginBottom: spacing.sm },
  datePickerDone:     { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  datePickerDoneText: { ...typography.bodySemibold, color: '#7367F0' },
  notesInput:         { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: '#DBDADE', padding: spacing.lg, ...typography.body, color: colors.text1, minHeight: 80, textAlignVertical: 'top' },
  saveBtn:            { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xxl },
  saveBtnGrad:        { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  saveBtnText:        { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#fff' },

  // ─── Paywall — centered card ────────────────────────────────
  paywallOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  paywallCard:         { width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden', alignSelf: 'center' } as any,
  paywallFull:         { flex: 1 },
  paywallTopTrim:      { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#7367F0', opacity: 0.8 },
  paywallCornerTL:     { position: 'absolute', top: 40, left: 24, width: 28, height: 28, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(0,153,168,0.2)', borderTopLeftRadius: 4 },
  paywallCornerBR:     { position: 'absolute', bottom: 60, right: 24, width: 28, height: 28, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(0,153,168,0.2)', borderBottomRightRadius: 4 },
  paywallScroll:       { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, alignItems: 'center' },
  paywallCloseBtn:     { alignSelf: 'flex-end', marginBottom: 16 },
  paywallCloseCircle:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  paywallHero:         { alignItems: 'center', marginBottom: 14 },
  paywallIconRing:     { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(115,103,240,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  paywallIconInner:    { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(115,103,240,0.12)', alignItems: 'center', justifyContent: 'center' },
  paywallEyebrow:      { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#7367F0', letterSpacing: 2, marginBottom: 5 },
  paywallTitle:        { fontSize: 22, fontFamily: 'Inter_900Black', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.3, lineHeight: 28, marginBottom: 8 },
  paywallGoldBar:      { width: 36, height: 3, backgroundColor: '#7367F0', borderRadius: 2, marginBottom: 8 },
  paywallSubtitle:     { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 18 },
  paywallFeatures:     { width: '100%', marginBottom: 14 },
  paywallFeatureRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  paywallFeatureIconBox:{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(115,103,240,0.12)', alignItems: 'center', justifyContent: 'center' },
  paywallFeatureText:  { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.85)', flex: 1 },
  paywallPriceBlock:   { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(115,103,240,0.2)' },
  paywallPriceRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paywallPrice:        { fontSize: 36, fontFamily: 'Inter_900Black', color: '#7367F0', letterSpacing: -1 },
  paywallPriceSide:    { gap: 2 },
  paywallPeriod:       { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.5)' },
  paywallPriceNote:    { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.success },
  paywallCTA:          { width: '100%', borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  paywallCTAGrad:      { paddingVertical: 13, alignItems: 'center', borderRadius: 10 },
  paywallCTAText:      { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.2 },
  paywallLegal:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
});
