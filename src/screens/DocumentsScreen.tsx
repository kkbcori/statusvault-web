// ═══════════════════════════════════════════════════════════════
// DocumentsScreen v3 — Inter · Ionicons · full-screen paywall
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, TextInput, Alert, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IS_WEB } from '../utils/responsive';
import { useDialog } from '../components/ConfirmDialog';
import { useStore, FREE_LIMIT } from '../store';
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
  const canAddDocument     = useStore((s) => s.canAddDocument);
  const isPremium          = useStore((s) => s.isPremium);
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

  const templatesByCategory = getTemplatesByCategory();
  const remaining = getRemainingFreeSlots();

  React.useEffect(() => {
    if (route.params?.openPaywall && !canAddDocument()) setShowPaywall(true);
  }, [route.params]);

  const filteredDocs = filterCategory === 'all' ? documents : documents.filter((d) => d.category === filterCategory);

  const resetAddFlow = () => {
    setAddStep('type'); setSelectedTemplate(null);
    setExpiryDate(new Date()); setNotes(''); setShowDatePicker(false);
  };

  const openAdd = () => {
    if (!canAddDocument()) { setShowPaywall(true); return; }
    resetAddFlow(); setShowAddModal(true);
  };

  const selectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template); setAddStep('date');
    if (Platform.OS !== 'web') setShowDatePicker(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    const doc: UserDocument = {
      id: Date.now().toString(), templateId: selectedTemplate.id, label: selectedTemplate.label,
      category: selectedTemplate.category, expiryDate: expiryDate.toISOString().split('T')[0],
      alertDays: selectedTemplate.alertDays, icon: selectedTemplate.icon,
      notes: notes.trim(), notificationIds: [], createdAt: new Date().toISOString(),
    };
    const success = await addDocument(doc);
    if (success) { setShowAddModal(false); resetAddFlow(); }
    else { setShowAddModal(false); resetAddFlow(); setShowPaywall(true); }
  };

  const handleDelete = (id: string, label: string) => {
    dialog.confirm({ title: 'Remove Document', message: `Remove "${label}"? Notifications will be cancelled.`,
      type: 'danger', confirmLabel: 'Remove', onConfirm: () => removeDocument(id) });
  };

  const handleDateChange = (_event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setExpiryDate(selectedDate);
  };

  const categories: (DocumentCategory | 'all')[] = ['all', 'visa', 'employment', 'travel', 'academic', 'immigration', 'other'];
  const categoryLabels: Record<string, string> = { all: 'All', ...CATEGORY_LABELS };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              .map((doc) => <ExpiryCard key={doc.id} document={doc} onDelete={() => handleDelete(doc.id, doc.label)} />)
          )}
        </View>

        {/* Notification info */}
        {documents.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="notifications-outline" size={18} color={colors.accent} />
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
              <TouchableOpacity onPress={() => { if (addStep === 'date') setAddStep('type'); else setShowAddModal(false); }}>
                <Text style={styles.modalBack}>{addStep === 'date' ? '← Back' : 'Cancel'}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{addStep === 'type' ? 'Select Document' : 'Set Expiry Date'}</Text>
              <View style={{ width: 60 }} />
            </View>

            {addStep === 'type' && (
              <FlatList
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

            {addStep === 'date' && selectedTemplate && (
              <ScrollView style={styles.dateStep} showsVerticalScrollIndicator={false}>
                <View style={styles.selectedSummary}>
                  <Text style={styles.selectedIcon}>{selectedTemplate.icon}</Text>
                  <View>
                    <Text style={styles.selectedLabel}>{selectedTemplate.label}</Text>
                    <Text style={styles.selectedDesc}>Alerts at: {selectedTemplate.alertDays.map((d) => `${d}d`).join(', ')}</Text>
                  </View>
                </View>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.dateButtonText}>{expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.accent} />
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
                <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput} value={notes} onChangeText={setNotes}
                  placeholder="e.g., Filed at USCIS Nebraska center"
                  placeholderTextColor={colors.text3} multiline maxLength={200}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                    <Text style={styles.saveBtnText}>Add to StatusVault</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══ PAYWALL — FULL-SCREEN DARK EXPERIENCE ═══ */}
      <Modal visible={showPaywall} animationType="fade" transparent>
        <LinearGradient
          colors={['#060E1A', '#0A1628', '#0F2040']}
          style={styles.paywallFull}
        >
          {/* Passport-style decorative lines */}
          {[...Array(6)].map((_, i) => (
            <View key={i} style={{
              position: 'absolute', top: 80 + i * 120, left: 0, right: 0,
              height: 1, backgroundColor: colors.accent, opacity: 0.04,
            }} />
          ))}
          {/* Corner stamp accents */}
          <View style={styles.paywallCornerTL} />
          <View style={styles.paywallCornerBR} />

          {/* Gold top trim */}
          <View style={styles.paywallTopTrim} />

          <ScrollView contentContainerStyle={styles.paywallScroll} showsVerticalScrollIndicator={false}>
            {/* Close */}
            <TouchableOpacity style={styles.paywallCloseBtn} onPress={() => setShowPaywall(false)}>
              <View style={styles.paywallCloseCircle}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>

            {/* Hero */}
            <View style={styles.paywallHero}>
              <View style={styles.paywallIconRing}>
                <View style={styles.paywallIconInner}>
                  <Ionicons name="shield-checkmark" size={40} color={colors.accent} />
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
                { icon: 'lock-closed-outline' as const,        text: 'PIN lock — 100% offline, private' },
                { icon: 'checkmark-circle-outline' as const,   text: 'Immigration checklists & counters' },
              ].map(({ icon, text }, i) => (
                <View key={i} style={styles.paywallFeatureRow}>
                  <View style={styles.paywallFeatureIconBox}>
                    <Ionicons name={icon} size={16} color={colors.accent} />
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
                onConfirm: () => { useStore.getState().setPremium(true); setShowPaywall(false); } })}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[colors.primary, colors.primaryLight, colors.primary]} style={styles.paywallCTAGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.paywallCTAText}>Subscribe — {PRICE_LABEL}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.paywallLegal}>Cancel anytime · Secure payment via App Store</Text>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
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
  filterChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive:   { backgroundColor: colors.accent, borderColor: colors.accent },
  filterChipText:     { ...typography.caption, color: colors.text2, fontSize: 12 },
  filterChipTextActive:{ color: colors.primary, fontFamily: 'Inter_700Bold' },
  emptyCard:          { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xxxl, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  emptyIconCircle:    { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderGold },
  emptyTitle:         { ...typography.bodySemibold, color: colors.text2 },
  emptySubtitle:      { ...typography.caption, color: colors.text3, textAlign: 'center', marginTop: 4 },
  infoCard:           { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, marginHorizontal: spacing.screen, marginTop: spacing.md, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  infoIconBox:        { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  infoContent:        { flex: 1 },
  infoTitle:          { ...typography.captionBold, color: colors.text1 },
  infoDesc:           { ...typography.caption, color: colors.text3, marginTop: 2, fontSize: 12, lineHeight: 18 },

  // Add modal
  modalOverlay:       { flex: 1, backgroundColor: colors.overlay, justifyContent: IS_WEB ? 'center' : 'flex-end', alignItems: IS_WEB ? 'center' as any : 'stretch' as any },
  modalSheet:         { backgroundColor: colors.background, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: IS_WEB ? '65%' as any : '85%', paddingBottom: 40, width: IS_WEB ? 480 : '100%' as any, borderRadius: IS_WEB ? radius.xl : undefined } as any,
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalBack:          { ...typography.bodySemibold, color: colors.accent, fontSize: 14 },
  modalTitle:         { ...typography.h3, color: colors.text1, fontSize: 16 },
  templateSection:    { paddingTop: spacing.lg },
  templateSectionTitle:{ ...typography.micro, color: colors.text3, letterSpacing: 1, paddingHorizontal: spacing.screen, marginBottom: spacing.sm },
  templateRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.screen, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md },
  templateRowDisabled:{ opacity: 0.4 },
  tIconBox:           { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  templateInfo:       { flex: 1 },
  templateLabel:      { ...typography.bodySemibold, color: colors.text1, fontSize: 14 },
  templateDesc:       { ...typography.caption, color: colors.text3, fontSize: 12, marginTop: 1 },
  addedBadge:         { ...typography.caption, color: colors.success, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  dateStep:           { padding: spacing.screen },
  selectedSummary:    { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.accentDim, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.xxl, borderWidth: 1, borderColor: colors.borderGold },
  selectedIcon:       { fontSize: 32 },
  selectedLabel:      { ...typography.bodySemibold, color: colors.primary },
  selectedDesc:       { ...typography.caption, color: colors.accent, fontSize: 12, marginTop: 2 },
  fieldLabel:         { ...typography.captionBold, color: colors.text2, marginBottom: spacing.sm, letterSpacing: 0.3 },
  dateButton:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  dateButtonText:     { ...typography.bodySemibold, color: colors.text1 },
  datePicker:         { marginTop: spacing.sm },
  datePickerDone:     { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  datePickerDoneText: { ...typography.bodySemibold, color: colors.accent },
  notesInput:         { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: spacing.lg, ...typography.body, color: colors.text1, minHeight: 80, textAlignVertical: 'top' },
  saveBtn:            { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xxl },
  saveBtnGrad:        { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  saveBtnText:        { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: colors.primary },

  // ─── Paywall — full-screen dark ─────────────────────────────
  paywallFull:         { flex: 1 },
  paywallTopTrim:      { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, opacity: 0.8 },
  paywallCornerTL:     { position: 'absolute', top: 40, left: 24, width: 28, height: 28, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(0,153,168,0.2)', borderTopLeftRadius: 4 },
  paywallCornerBR:     { position: 'absolute', bottom: 60, right: 24, width: 28, height: 28, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(0,153,168,0.2)', borderBottomRightRadius: 4 },
  paywallScroll:       { paddingHorizontal: 28, paddingTop: 52, paddingBottom: 48, alignItems: 'center' },
  paywallCloseBtn:     { alignSelf: 'flex-end', marginBottom: 16 },
  paywallCloseCircle:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  paywallHero:         { alignItems: 'center', marginBottom: 36 },
  paywallIconRing:     { width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderColor: 'rgba(0,153,168,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  paywallIconInner:    { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,153,168,0.1)', alignItems: 'center', justifyContent: 'center' },
  paywallEyebrow:      { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.accent, letterSpacing: 2.5, marginBottom: 10 },
  paywallTitle:        { fontSize: 30, fontFamily: 'Inter_900Black', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.5, lineHeight: 36, marginBottom: 14 },
  paywallGoldBar:      { width: 48, height: 3, backgroundColor: colors.accent, borderRadius: 2, marginBottom: 16, opacity: 0.8 },
  paywallSubtitle:     { fontSize: 15, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
  paywallFeatures:     { width: '100%', marginBottom: 32 },
  paywallFeatureRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  paywallFeatureIconBox:{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(0,153,168,0.1)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,153,168,0.15)' },
  paywallFeatureText:  { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.85)', flex: 1 },
  paywallPriceBlock:   { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,153,168,0.15)' },
  paywallPriceRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paywallPrice:        { fontSize: 48, fontFamily: 'Inter_900Black', color: colors.accent, letterSpacing: -1 },
  paywallPriceSide:    { gap: 2 },
  paywallPeriod:       { fontSize: 18, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.5)' },
  paywallPriceNote:    { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.success },
  paywallCTA:          { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  paywallCTAGrad:      { paddingVertical: 18, alignItems: 'center', borderRadius: 14 },
  paywallCTAText:      { fontSize: 17, fontFamily: 'Inter_800ExtraBold', color: colors.primary, letterSpacing: 0.2 },
  paywallLegal:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
});
