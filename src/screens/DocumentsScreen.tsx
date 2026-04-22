// ═══════════════════════════════════════════════════════════════
// DocumentsScreen v3 — Inter · Ionicons · full-screen paywall
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, FlatList, TextInput, Alert, Platform, KeyboardAvoidingView, Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore, FREE_LIMIT } from '../store';
import { IS_WEB, IS_TABLET } from '../utils/responsive';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useDialog } from '../components/ConfirmDialog';
import { generateDeadlines } from '../utils/dates';
import { ExpiryCard } from '../components';
import { DOCUMENT_TEMPLATES, CATEGORY_LABELS, getTemplatesByCategory, DocumentTemplate } from '../utils/templates';
import { UserDocument, DocumentCategory } from '../types';
import { useRoute } from '@react-navigation/native';
import { useEntrance, usePressScale } from '../hooks/useAnimations';
import { AnimatedEmptyIcon } from '../components/AnimatedEmptyIcon';

const PRICE_LABEL = '$0.49/mo or $4.99/yr';

export const DocumentsScreen: React.FC = () => {
  const route              = useRoute<any>();

  // ── Entrance animations ──────────────────────────────────────
  const listAnim    = useEntrance(100);
  const addBtnPress = usePressScale(0.95);
  const documents          = useStore((s) => s.documents);
  const addDocument        = useStore((s) => s.addDocument);
  const removeDocument     = useStore((s) => s.removeDocument);
  const updateDocument     = useStore((s) => s.updateDocument);
  const canAddDocument     = useStore((s) => s.canAddDocument);
  const isPremium          = useStore((s) => s.isPremium);
  const authUser           = useStore((s) => s.authUser);
  const setAnyModalOpen    = useStore((s) => s.setAnyModalOpen);
  const openPaywall        = useStore((s) => s.openPaywall);
  const getRemainingFreeSlots = useStore((s) => s.getRemainingFreeSlots);
  const dialog = useDialog();

  const [showAddModal,    setShowAddModal]    = useState(false);
  const [addStep,         setAddStep]         = useState<'type' | 'date'>('type');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [expiryDate,      setExpiryDate]      = useState(new Date());
  const [showDatePicker,  setShowDatePicker]  = useState(false);
  const [notes,           setNotes]           = useState('');
  const [docNumber,       setDocNumber]       = useState('');
  const [filterCategory,  setFilterCategory]  = useState<DocumentCategory | 'all'>('all');
  const [editingDoc,      setEditingDoc]      = useState<UserDocument | null>(null);

  const templatesByCategory = getTemplatesByCategory();
  const remaining = getRemainingFreeSlots();

  React.useEffect(() => {
    if (route.params?.openPaywall) { openPaywall(); }
  }, [route.params]);

  const filteredDocs = filterCategory === 'all' ? documents : documents.filter((d) => d.category === filterCategory);

  const resetAddFlow = () => {
    setAddStep('type'); setSelectedTemplate(null);
    setExpiryDate(new Date()); setNotes(''); setShowDatePicker(false);
    setEditingDoc(null);
  };

  const isGuestMode      = useStore((s) => s.isGuestMode);
  const openAdd = () => {
    if (!canAddDocument()) {
      // Guest/unauthed hit their 1-doc limit → prompt to create account
      if (!authUser || isGuestMode) {
        useStore.getState().openAuthModal('Create a free account to track up to 2 documents');
      } else {
        // Free account hit 2-doc limit → show paywall
        openPaywall();
      }
      return;
    }
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
      id: `${Date.now()}-${Math.random().toString(36).slice(2,7)}`, templateId: selectedTemplate.id, label: selectedTemplate.label,
      category: selectedTemplate.category, expiryDate: expiryDate.toISOString().split('T')[0],
      alertDays: selectedTemplate.alertDays, icon: selectedTemplate.icon,
      notes: notes.trim(), notificationIds: [], createdAt: new Date().toISOString(),
    };
    const success = await addDocument(doc);
    if (success) { setShowAddModal(false); setAnyModalOpen(false); resetAddFlow(); }
    else { setShowAddModal(false); setAnyModalOpen(false); resetAddFlow(); openPaywall(); }
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
    setDocNumber(doc.documentNumber || '');
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
        <LinearGradient colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)']} style={styles.headerGradient}>
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>DOCUMENTS</Text>
              <Text style={styles.title}>Your Documents</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <Text style={styles.subtitle}>
                  {documents.length} tracked{isPremium ? ' · Premium ⭐' : isGuestMode ? ' · 1 of 1 (guest)' : ` · ${remaining} of 2 free`}
                </Text>
                {!isPremium && (
                  <TouchableOpacity onPress={openPaywall} style={{ backgroundColor: 'rgba(59,139,232,0.18)', borderWidth: 1, borderColor: 'rgba(111,175,242,0.32)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#6FAFF2' }}>Upgrade</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Animated.View style={{ transform: [{ scale: addBtnPress.scale }] }}>
            <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={1}
              onPressIn={addBtnPress.onPressIn} onPressOut={addBtnPress.onPressOut}>
              <LinearGradient colors={['#6FAFF2', '#3B8BE8']} style={styles.addBtnGrad}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </LinearGradient>
            </TouchableOpacity>
            </Animated.View>
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
          <Animated.View style={listAnim}>
          {filteredDocs.length === 0 ? (
            <View style={styles.emptyCard}>
              <AnimatedEmptyIcon name="document-text-outline" size={36} color={colors.primaryLight} haloSize={100} style={{ marginBottom: spacing.md } as any} />
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptySubtitle}>Tap "+ Add" to track your first visa or document</Text>
            </View>
          ) : (
            [...filteredDocs]
              .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
              .map((doc) => <ExpiryCard key={doc.id} document={doc} onDelete={() => handleDelete(doc.id, doc.label)} onEdit={() => handleEdit(doc)} />)
          )}
          </Animated.View>
        </View>

        {/* Notification info */}
        {documents.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="notifications-outline" size={18} color={'#6FAFF2'} />
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
                showsVerticalScrollIndicator={true}
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
              <ScrollView style={styles.dateStep} showsVerticalScrollIndicator={true}>
                <View style={styles.selectedSummary}>
                  <Text style={styles.selectedIcon}>{selectedTemplate?.icon ?? editingDoc?.icon ?? '📄'}</Text>
                  <View>
                    <Text style={styles.selectedLabel}>{selectedTemplate?.label ?? editingDoc?.label ?? 'Document'}</Text>
                    <Text style={styles.selectedDesc}>
                      {selectedTemplate
                        ? `Alert windows: ${selectedTemplate.alertDays.map((d) => `${d}d`).join(', ')}`
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
                        fontFamily: 'Inter_400Regular', color: '#F0F4FF',
                        border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px',
                        backgroundColor: 'rgba(255,255,255,0.05)', outline: 'none', cursor: 'pointer',
                        boxSizing: 'border-box',
                        colorScheme: 'dark',
                      } as any}
                    />
                  </View>
                ) : (
                  <>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                      <Text style={styles.dateButtonText}>{expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                      <Ionicons name="calendar-outline" size={20} color={'#6FAFF2'} />
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
                <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>Document Number (optional)</Text>
                {IS_WEB ? (
                  <input
                    value={docNumber}
                    onChange={(e: any) => setDocNumber(e.target.value)}
                    placeholder="e.g., A123456789 · WAC2512345678"
                    maxLength={30}
                    style={{ width: '100%', padding: '12px 14px', fontSize: '14px', fontFamily: 'Inter', color: '#F0F4FF', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)', outline: 'none', boxSizing: 'border-box', marginBottom: '16px', colorScheme: 'dark' } as any}
                  />
                ) : (
                  <TextInput
                    style={[styles.notesInput, { minHeight: 42 }]} value={docNumber} onChangeText={setDocNumber}
                    placeholder="e.g., A123456789" placeholderTextColor={colors.text3} maxLength={30}
                  />
                )}
                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput} value={notes} onChangeText={setNotes}
                  placeholder="e.g., Filed at USCIS Nebraska center"
                  placeholderTextColor={colors.text3} multiline maxLength={200}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <LinearGradient colors={['#6FAFF2', '#3B8BE8']} style={styles.saveBtnGrad}>
                    <Text style={styles.saveBtnText}>{editingDoc ? 'Update Document' : 'Add to StatusVault'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ═══ PAYWALL — CENTERED DIALOG ═══ */}
      {/* Bug 82: duplicate paywall — always hidden, kept for potential future use */}
      <Modal visible={false} animationType="fade" transparent statusBarTranslucent>
        <View style={styles.paywallOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject as any} activeOpacity={1} onPress={() => { setAnyModalOpen(false); }} />
          <LinearGradient
            colors={['#060E1A', '#0A1628', '#0F2040']}
            style={styles.paywallCard}
          >
          {/* Gold top trim */}
          <View style={styles.paywallTopTrim} />

          <View style={styles.paywallScroll}>
            {/* Close */}
            <TouchableOpacity style={styles.paywallCloseBtn} onPress={() => { setAnyModalOpen(false); }}>
              <View style={styles.paywallCloseCircle}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>

            {/* Hero */}
            <View style={styles.paywallHero}>
              <View style={styles.paywallIconRing}>
                <View style={styles.paywallIconInner}>
                  <Ionicons name="shield-checkmark" size={40} color={'#6FAFF2'} />
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
                    <Ionicons name={icon} size={16} color={'#6FAFF2'} />
                  </View>
                  <Text style={styles.paywallFeatureText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* Price block */}
            <View style={styles.paywallPriceBlock}>
              <View style={styles.paywallPriceRow}>
                <Text style={styles.paywallPrice}>$0.49</Text>
                <View style={styles.paywallPriceSide}>
                  <Text style={styles.paywallPeriod}>/ month</Text>
                  <Text style={styles.paywallPriceNote}>or $4.99/year · Save 15%</Text>
                </View>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity
              style={styles.paywallCTA}
              onPress={() => dialog.confirm({ title: 'Coming Soon', message: 'In-app purchase will be available in the next update.',
                type: 'confirm', confirmLabel: 'Unlock for Testing', cancelLabel: 'Cancel',
                onConfirm: () => { useStore.getState().setPremium(true); setAnyModalOpen(false); } })}
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
  container:          { flex: 1, backgroundColor: 'transparent' },
  scrollContent:      { paddingBottom: 40 },
  headerGradient:     { paddingBottom: 8 },
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.screen, paddingTop: spacing.xxl + 12, paddingBottom: spacing.md },
  headerLabel:        { ...typography.micro, color: 'rgba(240,244,255,0.45)', letterSpacing: 1.5, marginBottom: 3, fontSize: 10 },
  title:              { ...typography.h1, color: '#F0F4FF', fontSize: 22, letterSpacing: -0.5 },
  subtitle:           { ...typography.caption, color: 'rgba(240,244,255,0.55)', marginTop: 2 },
  addBtn:             { borderRadius: radius.md, overflow: 'hidden', ...(Platform.OS === 'web' ? ({ boxShadow: '0 6px 20px rgba(59,139,232,0.35)' } as any) : {}) } as any,
  addBtnGrad:         { paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.md },
  addBtnText:         { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  filterRow:          { paddingHorizontal: spacing.screen, paddingBottom: spacing.lg, gap: spacing.sm },
  filterChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  filterChipActive:   { backgroundColor: 'rgba(59,139,232,0.22)', borderColor: 'rgba(111,175,242,0.45)' },
  filterChipText:     { ...typography.caption, color: 'rgba(240,244,255,0.70)', fontSize: 12 },
  filterChipTextActive:{ color: '#6FAFF2', fontFamily: 'Inter_700Bold' },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    padding: spacing.xxxl, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 4px 16px rgba(0,0,0,0.28)' } as any) : shadows.sm),
  } as any,
  emptyIconCircle:    { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(59,139,232,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: 'rgba(111,175,242,0.28)' },
  emptyTitle:         { ...typography.bodySemibold, color: '#F0F4FF' },
  emptySubtitle:      { ...typography.caption, color: 'rgba(240,244,255,0.55)', textAlign: 'center', marginTop: 4 },
  infoCard: {
    flexDirection: 'row', gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.lg, padding: spacing.lg,
    marginHorizontal: spacing.screen, marginTop: spacing.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' } as any) : {}),
  } as any,
  infoIconBox:        { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(59,139,232,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)' },
  infoContent:        { flex: 1 },
  infoTitle:          { ...typography.captionBold, color: '#F0F4FF' },
  infoDesc:           { ...typography.caption, color: 'rgba(240,244,255,0.60)', marginTop: 2, fontSize: 12, lineHeight: 18 },

  // Add modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(3,8,18,0.80)', justifyContent: IS_WEB ? 'center' : 'flex-end', alignItems: IS_WEB ? 'center' as any : 'stretch' as any },
  modalSheet: {
    backgroundColor: '#0C1A34',
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    maxHeight: IS_WEB ? '80%' as any : '85%',
    paddingBottom: 40,
    width: IS_WEB ? 480 : '100%' as any,
    borderRadius: IS_WEB ? radius.xl : undefined,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    display: IS_WEB ? 'flex' as any : undefined,
    flexDirection: 'column', overflow: 'hidden',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any) : {}),
  } as any,
  modalHeader:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalBack:          { ...typography.bodySemibold, color: '#6FAFF2', fontSize: 14 },
  modalTitle:         { ...typography.h3, color: '#F0F4FF', fontSize: 16 },

  templateSection:    { paddingTop: spacing.lg },
  templateSectionTitle:{ ...typography.micro, color: 'rgba(240,244,255,0.45)', letterSpacing: 1.2, paddingHorizontal: spacing.screen, marginBottom: spacing.sm },
  templateRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.screen, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', gap: spacing.md },
  templateRowDisabled:{ opacity: 0.45 },
  tIconBox:           { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(59,139,232,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(111,175,242,0.28)' },
  templateInfo:       { flex: 1 },
  templateLabel:      { ...typography.bodySemibold, color: '#F0F4FF', fontSize: 14 },
  templateDesc:       { ...typography.caption, color: 'rgba(240,244,255,0.55)', fontSize: 12, marginTop: 1 },
  addedBadge:         { ...typography.caption, color: '#4CD98A', fontFamily: 'Inter_600SemiBold', fontSize: 12 },

  dateStep:           { padding: spacing.screen },
  selectedSummary: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: 'rgba(59,139,232,0.12)',
    padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.xxl,
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.32)',
  },
  selectedIcon:       { fontSize: 32 },
  selectedLabel:      { ...typography.bodySemibold, color: '#6FAFF2' },
  selectedDesc:       { ...typography.caption, color: 'rgba(111,175,242,0.80)', fontSize: 12, marginTop: 2 },

  fieldLabel:         { ...typography.captionBold, color: 'rgba(240,244,255,0.65)', marginBottom: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase' as any } as any,
  dateButton: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: spacing.lg, borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  dateButtonText:     { ...typography.bodySemibold, color: '#F0F4FF' },
  datePicker:         { marginTop: spacing.sm },
  webDateWrap:        { marginTop: spacing.sm, marginBottom: spacing.sm },
  datePickerDone:     { alignSelf: 'flex-end', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  datePickerDoneText: { ...typography.bodySemibold, color: '#6FAFF2' },
  notesInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    padding: spacing.lg, ...typography.body, color: '#F0F4FF',
    minHeight: 80, textAlignVertical: 'top',
  },
  saveBtn:            { borderRadius: radius.md, overflow: 'hidden', marginTop: spacing.xxl, ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 24px rgba(59,139,232,0.40)' } as any) : {}) } as any,
  saveBtnGrad:        { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
  saveBtnText:        { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#fff' },

  // Paywall — centered card
  paywallOverlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  paywallCard:         { width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden', alignSelf: 'center', borderWidth: 1, borderColor: 'rgba(245,192,83,0.25)' } as any,
  paywallFull:         { flex: 1 },
  paywallTopTrim:      { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#F5C053', opacity: 0.85 },
  paywallCornerTL:     { position: 'absolute', top: 40, left: 24, width: 28, height: 28, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(245,192,83,0.28)', borderTopLeftRadius: 4 },
  paywallCornerBR:     { position: 'absolute', bottom: 60, right: 24, width: 28, height: 28, borderBottomWidth: 2, borderRightWidth: 2, borderColor: 'rgba(245,192,83,0.28)', borderBottomRightRadius: 4 },
  paywallScroll:       { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, alignItems: 'center' },
  paywallCloseBtn:     { alignSelf: 'flex-end', marginBottom: 16 },
  paywallCloseCircle:  { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  paywallHero:         { alignItems: 'center', marginBottom: 14 },
  paywallIconRing:     { width: 64, height: 64, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,192,83,0.30)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  paywallIconInner:    { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(245,192,83,0.15)', alignItems: 'center', justifyContent: 'center' },
  paywallEyebrow:      { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#F5C053', letterSpacing: 2, marginBottom: 5 },
  paywallTitle:        { fontSize: 22, fontFamily: 'Inter_900Black', color: '#fff', textAlign: 'center', letterSpacing: -0.3, lineHeight: 28, marginBottom: 8 },
  paywallGoldBar:      { width: 36, height: 3, backgroundColor: '#F5C053', borderRadius: 2, marginBottom: 8 },
  paywallSubtitle:     { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 18 },
  paywallFeatures:     { width: '100%', marginBottom: 14 },
  paywallFeatureRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  paywallFeatureIconBox:{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(245,192,83,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,192,83,0.25)' },
  paywallFeatureText:  { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.88)', flex: 1 },
  paywallPriceBlock:   { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(245,192,83,0.22)' },
  paywallPriceRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paywallPrice:        { fontSize: 36, fontFamily: 'Inter_900Black', color: '#F5C053', letterSpacing: -1 },
  paywallPriceSide:    { gap: 2 },
  paywallPeriod:       { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.55)' },
  paywallPriceNote:    { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#4CD98A' },
  paywallCTA:          { width: '100%', borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  paywallCTAGrad:      { paddingVertical: 13, alignItems: 'center', borderRadius: 10 },
  paywallCTAText:      { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.2 },
  paywallLegal:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.30)', textAlign: 'center' },
});
