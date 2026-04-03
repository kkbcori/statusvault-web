// ═══════════════════════════════════════════════════════════════
// FamilyScreen — Track documents for all family members
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IS_WEB } from '../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { useDialog } from '../components/ConfirmDialog';
import { DOCUMENT_TEMPLATES } from '../utils/templates';
import { UserDocument, FamilyMember } from '../types';
import { calculateDaysRemaining, getUrgencyColor } from '../utils/dates';

const RELATIONS = [
  { id: 'self',    label: 'Myself',  icon: '👤' },
  { id: 'spouse',  label: 'Spouse',  icon: '💑' },
  { id: 'child',   label: 'Child',   icon: '👶' },
  { id: 'parent',  label: 'Parent',  icon: '👨‍👩‍👧' },
  { id: 'sibling', label: 'Sibling', icon: '🧑‍🤝‍🧑' },
  { id: 'other',   label: 'Other',   icon: '👥' },
];

const VISA_TYPES = [
  'F-1 Student', 'H-1B Worker', 'H-4 Dependent', 'L-1 Transfer',
  'L-2 Dependent', 'J-1 Exchange', 'O-1 Talent', 'B-1/B-2 Visitor',
  'Green Card', 'US Citizen', 'Other',
];

export const FamilyScreen: React.FC = () => {
  const navigation       = useNavigation<any>();
  const authUser         = useStore((s) => s.authUser);
  const familyMembers    = useStore((s) => s.familyMembers);
  const addFamilyMember  = useStore((s) => s.addFamilyMember);
  const removeFamilyMember = useStore((s) => s.removeFamilyMember);
  const updateFamilyMember = useStore((s) => s.updateFamilyMember);
  const addDocument      = useStore((s) => s.addDocument);
  const removeDocument   = useStore((s) => s.removeDocument);
  const documents        = useStore((s) => s.documents);
  const isPremium        = useStore((s) => s.isPremium);
  const dialog           = useDialog();
  const setAnyModalOpen  = useStore((s) => s.setAnyModalOpen);

  const FREE_FAMILY_LIMIT = 1;   // free: 1 member
  const FREE_DOC_LIMIT    = 2;   // free: 2 docs per member

  const [showAddMember,    setShowAddMember]    = useState(false);
  const [showAddDoc,       setShowAddDoc]       = useState(false);
  const [selectedMember,   setSelectedMember]   = useState<FamilyMember | null>(null);
  const [expandedMember,   setExpandedMember]   = useState<string | null>(null);
  const [editingMember,    setEditingMember]    = useState<FamilyMember | null>(null);
  const [editName,         setEditName]         = useState('');
  const [editRelation,     setEditRelation]     = useState('');
  const [editVisaType,     setEditVisaType]     = useState('');
  const [editNameError,    setEditNameError]    = useState(false);

  // Add member form
  const [name,      setName]      = useState('');
  const [nameError, setNameError] = useState(false);
  const [relation,  setRelation]  = useState(RELATIONS[1].id);
  const [visaType,  setVisaType]  = useState(VISA_TYPES[0]);

  // Add doc for member
  const [docTemplateId,    setDocTemplateId]    = useState('');
  const [docExpiry,        setDocExpiry]        = useState('');
  const [docNotes,         setDocNotes]         = useState('');
  const [docTemplateError, setDocTemplateError] = useState(false);
  const [docExpiryError,   setDocExpiryError]   = useState(false);
  const [docLimitError,    setDocLimitError]    = useState(false);

  const handleEditMember = () => {
    if (!editName.trim()) { setEditNameError(true); return; }
    setEditNameError(false);
    updateFamilyMember(editingMember!.id, {
      name: editName.trim(),
      relation: editRelation,
      visaType: editVisaType,
    });
    setEditingMember(null); setAnyModalOpen(false);
  };

  const handleAddMember = () => {
    if (!name.trim()) { setNameError(true); return; }
    if (!isPremium && familyMembers.length >= FREE_FAMILY_LIMIT) {
      setNameError(false);
      setShowAddMember(false);
      setAnyModalOpen(false);
      dialog.alert('Upgrade Required', 'Free plan allows 1 family member. Upgrade to Premium for unlimited family members.');
      return;
    }
    setNameError(false);
    addFamilyMember({
      id: Date.now().toString(),
      name: name.trim(),
      relation,
      visaType,
      documentIds: [],
      createdAt: new Date().toISOString(),
    });
    setName(''); setRelation(RELATIONS[1].id); setVisaType(VISA_TYPES[0]); setNameError(false);
setShowAddMember(false); setAnyModalOpen(false);
  };

  const handleAddDoc = async () => {
    // Reset errors
    setDocTemplateError(false);
    setDocExpiryError(false);
    setDocLimitError(false);

    // Inline validation — no dialog.alert (would appear behind modal)
    let hasError = false;
    if (!docTemplateId) { setDocTemplateError(true); hasError = true; }
    if (!docExpiry)      { setDocExpiryError(true);   hasError = true; }
    if (hasError) return;

    // Enforce free tier limit inside the handler too (not just on button)
    if (!isPremium && selectedMember) {
      const currentDocs = getMemberDocs(selectedMember);
      if (currentDocs.length >= FREE_DOC_LIMIT) {
        setDocLimitError(true);
        return;
      }
    }
    const template = DOCUMENT_TEMPLATES.find((t) => t.id === docTemplateId);
    if (!template) return;

    const doc: UserDocument = {
      id: Date.now().toString(),
      templateId: template.id,
      label: `${selectedMember.name} — ${template.label}`,
      category: template.category,
      expiryDate: docExpiry,
      alertDays: template.alertDays,
      icon: template.icon,
      notes: docNotes.trim(),
      notificationIds: [],
      createdAt: new Date().toISOString(),
    };

    useStore.getState().forceAddDocument(doc);
    updateFamilyMember(selectedMember!.id, {
      documentIds: [...selectedMember!.documentIds, doc.id],
    });
    setDocTemplateId(''); setDocExpiry(''); setDocNotes('');
    setShowAddDoc(false); setAnyModalOpen(false);
  };

  const handleRemoveMember = (member: FamilyMember) => {
    dialog.confirm({
      title: `Remove ${member.name}?`,
      message: 'This will also remove all their tracked documents.',
      type: 'danger',
      confirmLabel: 'Remove',
      onConfirm: () => {
        member.documentIds.forEach((id) => removeDocument(id));
        removeFamilyMember(member.id);
      },
    });
  };

  const getMemberDocs = (member: FamilyMember) =>
    documents.filter((d) => member.documentIds.includes(d.id));

  const getMemberStatus = (member: FamilyMember) => {
    const docs = getMemberDocs(member);
    if (docs.length === 0) return { color: colors.text3, label: 'No docs' };
    const urgent = docs.filter((d) => calculateDaysRemaining(d.expiryDate) <= 90);
    if (urgent.some((d) => calculateDaysRemaining(d.expiryDate) < 0)) return { color: colors.danger, label: 'Expired' };
    if (urgent.some((d) => calculateDaysRemaining(d.expiryDate) <= 30)) return { color: colors.danger, label: 'Critical' };
    if (urgent.length > 0) return { color: colors.warning, label: `${urgent.length} expiring` };
    return { color: colors.success, label: 'All good' };
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, IS_WEB && styles.contentWeb]}
      showsVerticalScrollIndicator={true}
    >
      {/* Header */}
      {!IS_WEB && (
        <View style={styles.header}>
          <Text style={styles.headerEye}>FAMILY</Text>
          <Text style={styles.headerTitle}>Family Mode</Text>
          <Text style={styles.headerSub}>Track documents for your whole family</Text>
        </View>
      )}
      {IS_WEB && (
        <View style={styles.webHero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.webTitle}>Family Mode</Text>
            <Text style={styles.webSub}>Track immigration documents for your spouse, children, and dependents in one place</Text>
          </View>
          <TouchableOpacity style={styles.addMemberBtn} onPress={() => {
              if (!authUser) { useStore.getState().openAuthModal('Sign in to add family members'); return; }
              if (!isPremium && familyMembers.length >= FREE_FAMILY_LIMIT) {
                dialog.alert('Upgrade Required', 'Free plan allows 1 family member. Upgrade to Premium for unlimited family members.');
                return;
              }
              setShowAddMember(true); setAnyModalOpen(true);
            }} activeOpacity={0.85}>
            <Ionicons name="person-add-outline" size={16} color="#fff" />
            <Text style={styles.addMemberBtnText}>Add Member</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {familyMembers.length === 0 && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><Text style={{ fontSize: 40 }}>👨‍👩‍👧</Text></View>
          <Text style={styles.emptyTitle}>Track your whole family</Text>
          <Text style={styles.emptyDesc}>
            Add family members to track their visas, work permits, and travel documents alongside yours.
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => {
              if (!authUser) { useStore.getState().openAuthModal('Sign in to add family members'); return; }
              if (!isPremium && familyMembers.length >= FREE_FAMILY_LIMIT) {
                dialog.alert('Upgrade Required', 'Free plan allows 1 family member. Upgrade to Premium for unlimited family members.');
                return;
              }
              setShowAddMember(true); setAnyModalOpen(true);
            }} activeOpacity={0.85}>
            <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.emptyBtnGrad}>
              <Ionicons name="person-add-outline" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>Add First Family Member</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Member cards */}
      {familyMembers.length > 0 && (
        <>
          {!IS_WEB && (
            <TouchableOpacity style={styles.addBtnRow} onPress={() => {
              if (!authUser) { useStore.getState().openAuthModal('Sign in to add family members'); return; }
              if (!isPremium && familyMembers.length >= FREE_FAMILY_LIMIT) {
                dialog.alert('Upgrade Required', 'Free plan allows 1 family member. Upgrade to Premium for unlimited family members.');
                return;
              }
              setShowAddMember(true); setAnyModalOpen(true);
            }}>
              <Ionicons name="person-add-outline" size={16} color={'#7367F0'} />
              <Text style={styles.addBtnRowText}>Add family member</Text>
            </TouchableOpacity>
          )}

          {!isPremium && (
            <View style={styles.freePlanBanner}>
              <Ionicons name="information-circle-outline" size={14} color="#7367F0" />
              <Text style={styles.freePlanBannerText}>
                Free plan: <Text style={{ fontFamily: 'Inter_700Bold' }}>1 family member</Text> · <Text style={{ fontFamily: 'Inter_700Bold' }}>2 docs</Text> per member
              </Text>
              <Text style={styles.freePlanUpgrade}>Upgrade →</Text>
            </View>
          )}
          <View style={[styles.memberGrid, IS_WEB && styles.memberGridWeb]}>
            {familyMembers.map((member) => {
              const memberDocs = getMemberDocs(member);
              const status     = getMemberStatus(member);
              const rel        = RELATIONS.find((r) => r.id === member.relation);
              const isExpanded = expandedMember === member.id;

              return (
                <View key={member.id} style={styles.memberCard}>
                  {/* Card header */}
                  <TouchableOpacity
                    style={styles.memberCardHeader}
                    onPress={() => setExpandedMember(isExpanded ? null : member.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.memberAvatar}>
                      <Text style={{ fontSize: 22 }}>{rel?.icon ?? '👤'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberMeta}>{rel?.label} · {member.visaType}</Text>
                    </View>
                    <View style={styles.memberRight}>
                      <View style={[styles.statusPill, { backgroundColor: status.color + '18' }]}>
                        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                      </View>
                      <Text style={styles.docCount}>{memberDocs.length} doc{memberDocs.length !== 1 ? 's' : ''}</Text>
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.text3} />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded docs */}
                  {isExpanded && (
                    <View style={styles.memberBody}>
                      {memberDocs.length === 0 ? (
                        <Text style={styles.noDocsText}>No documents yet — add one below</Text>
                      ) : (
                        <ScrollView
                          style={{ maxHeight: 240 }}
                          showsVerticalScrollIndicator={true}
                          nestedScrollEnabled={true}
                        >
                        {memberDocs.map((doc) => {
                          const days     = calculateDaysRemaining(doc.expiryDate);
                          const urgColor = getUrgencyColor(days);
                          return (
                            <View key={doc.id} style={styles.docRow}>
                              <View style={[styles.docStrip, { backgroundColor: urgColor }]} />
                              <Text style={styles.docIcon}>{doc.icon}</Text>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.docName} numberOfLines={1}>{doc.label.replace(`${member.name} — `, '')}</Text>
                                <Text style={styles.docExpiry}>{doc.expiryDate}</Text>
                              </View>
                              <View style={[styles.daysBadge, { backgroundColor: urgColor + '18' }]}>
                                <Text style={[styles.daysText, { color: urgColor }]}>
                                  {days < 0 ? `${Math.abs(days)}d over` : `${days}d left`}
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => {
                                  // Direct delete — dialog.confirm appears behind modal
                                  removeDocument(doc.id);
                                  updateFamilyMember(member.id, {
                                    documentIds: member.documentIds.filter((id) => id !== doc.id),
                                  });
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={{ padding: 4 }}
                              >
                                <Ionicons name="trash-outline" size={15} color="#EA5455" />
                              </TouchableOpacity>
                            </View>
                          );
                        })}
                        </ScrollView>
                      )}

                      {/* Add doc / Remove member actions */}
                      <View style={styles.memberActions}>
                        <TouchableOpacity
                          style={styles.addDocBtn}
                          onPress={() => {
                            const mDocs = getMemberDocs(member);
                            if (!isPremium && mDocs.length >= FREE_DOC_LIMIT) {
                              // Open paywall directly — don't open the doc card
                              navigation.navigate('Main', { screen: 'Documents', params: { openPaywall: true } });
                              return;
                            }
                            setSelectedMember(member); setShowAddDoc(true); setAnyModalOpen(true);
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add-circle-outline" size={15} color={'#7367F0'} />
                          <Text style={styles.addDocBtnText}>Add document</Text>
                          {!isPremium && getMemberDocs(member).length >= FREE_DOC_LIMIT && (
                            <View style={styles.lockBadge}>
                              <Ionicons name="lock-closed" size={10} color="#FF9F43" />
                              <Text style={styles.lockBadgeText}>Upgrade</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingMember(member); setAnyModalOpen(true);
                            setEditName(member.name);
                            setEditRelation(member.relation);
                            setEditVisaType(member.visaType);
                            setEditNameError(false);
                          }}
                          style={styles.editMemberBtn}
                        >
                          <Ionicons name="create-outline" size={13} color="#7367F0" />
                          <Text style={styles.editMemberText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoveMember(member)}>
                          <Text style={styles.removeText}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}

      <View style={{ height: 40 }} />

      {/* ═══ ADD MEMBER MODAL ═══ */}
      <Modal visible={showAddMember} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member</Text>
              <TouchableOpacity onPress={() => setShowAddMember(false)}>
                <Ionicons name="close" size={22} color={colors.text2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={{ padding: spacing.xl }}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Name</Text>
                <Text style={styles.fieldRequired}>*</Text>
              </View>
              <TextInput
                style={[styles.fieldInput, nameError && styles.fieldInputError]}
                value={name}
                onChangeText={(v) => { setName(v); if (v.trim()) setNameError(false); }}
                placeholder="e.g., Sarah Johnson"
                placeholderTextColor={colors.text3}
                autoFocus
              />
              {nameError && (
                <View style={styles.inlineError}>
                  <Ionicons name="alert-circle" size={13} color="#EA5455" />
                  <Text style={styles.inlineErrorText}>Name is required</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Relationship</Text>
              <View style={styles.chipRow}>
                {RELATIONS.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.relChip, relation === r.id && styles.relChipActive]}
                    onPress={() => setRelation(r.id)}
                  >
                    <Text style={styles.relChipIcon}>{r.icon}</Text>
                    <Text style={[styles.relChipText, relation === r.id && styles.relChipTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Visa / Immigration Status</Text>
              <View style={styles.visaGrid}>
                {VISA_TYPES.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.visaGridChip, visaType === v && styles.relChipActive]}
                    onPress={() => setVisaType(v)}
                  >
                    <Text style={[styles.relChipText, visaType === v && styles.relChipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.saveBtn, { marginTop: spacing.lg }]} onPress={handleAddMember} activeOpacity={0.85}>
                <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>Add Member</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══ ADD DOC FOR MEMBER MODAL ═══ */}
      <Modal visible={showAddDoc} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Document for {selectedMember?.name}</Text>
              <TouchableOpacity onPress={() => { setShowAddDoc(false); setAnyModalOpen(false); }}>
                <Ionicons name="close" size={22} color={colors.text2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={{ padding: spacing.xl }}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Document Type</Text>
                <Text style={styles.fieldRequired}>*</Text>
              </View>
              {docLimitError && (
                <View style={[styles.inlineError, { marginBottom: 8 }]}>
                  <Ionicons name="lock-closed" size={13} color="#FF9F43" />
                  <Text style={[styles.inlineErrorText, { color: '#FF9F43' }]}>Free plan: max {FREE_DOC_LIMIT} docs per member. Upgrade for more.</Text>
                </View>
              )}
              {docTemplateError && (
                <View style={[styles.inlineError, { marginBottom: 8 }]}>
                  <Ionicons name="alert-circle" size={13} color="#EA5455" />
                  <Text style={styles.inlineErrorText}>Please select a document type</Text>
                </View>
              )}
              <ScrollView
                style={[styles.docTypeList, docTemplateError && { borderColor: '#EA5455' }]}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {DOCUMENT_TEMPLATES.map((t) => {
                  const alreadyAdded = selectedMember
                    ? getMemberDocs(selectedMember).some((d) => d.templateId === t.id)
                    : false;
                  const isSelected = docTemplateId === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.templateRow, isSelected && styles.templateRowActive, alreadyAdded && styles.templateRowAdded]}
                      onPress={() => { if (!alreadyAdded) { setDocTemplateId(t.id); setDocTemplateError(false); } }}
                      activeOpacity={alreadyAdded ? 1 : 0.75}
                    >
                      <Text style={{ fontSize: 18, marginRight: 10, opacity: alreadyAdded ? 0.4 : 1 }}>{t.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.templateLabel, isSelected && { color: '#7367F0' }, alreadyAdded && { color: '#ACAEC5', textDecorationLine: 'line-through' as any }]}>{t.label}</Text>
                        {alreadyAdded && <Text style={styles.alreadyAddedText}>✓ Already added</Text>}
                      </View>
                      {isSelected && <Ionicons name="checkmark-circle" size={16} color={'#7367F0'} style={{ marginLeft: 'auto' as any }} />}
                      {alreadyAdded && !isSelected && <Ionicons name="checkmark-circle" size={16} color={'#ACAEC5'} style={{ marginLeft: 'auto' as any }} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Expiry Date</Text>
                <Text style={styles.fieldRequired}>*</Text>
              </View>
              {docExpiryError && (
                <View style={[styles.inlineError, { marginBottom: 6 }]}>
                  <Ionicons name="alert-circle" size={13} color="#EA5455" />
                  <Text style={styles.inlineErrorText}>Please select an expiry date</Text>
                </View>
              )}
              {IS_WEB ? (
                <input
                  type="date"
                  value={docExpiry}
                  onChange={(e: any) => { setDocExpiry(e.target.value); setDocExpiryError(false); }}
                  style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: `1.5px solid ${docExpiryError ? '#EA5455' : '#DBDADE'}`, borderRadius: '8px', backgroundColor: '#F4F5FA', outline: 'none', marginBottom: '16px', boxSizing: 'border-box', fontFamily: 'Inter' } as any}
                />
              ) : (
                <TextInput
                  style={[styles.fieldInput, { marginBottom: spacing.md }]}
                  value={docExpiry} onChangeText={setDocExpiry}
                  placeholder="YYYY-MM-DD" placeholderTextColor={colors.text3}
                />
              )}

              <Text style={styles.fieldLabel}>Notes (optional)</Text>
              <TextInput
                style={[styles.fieldInput, { marginBottom: spacing.xl }]}
                value={docNotes} onChangeText={setDocNotes}
                placeholder="e.g., Receipt #EAC-123" placeholderTextColor={colors.text3}
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddDoc} activeOpacity={0.85}>
                <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>Save Document</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    {/* ═══ EDIT MEMBER MODAL ═══ */}
      <Modal visible={!!editingMember} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {editingMember?.name}</Text>
              <TouchableOpacity onPress={() => { setEditingMember(null); setAnyModalOpen(false); }}>
                <Ionicons name="close" size={22} color={colors.text2} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={{ padding: spacing.xl }}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Name</Text>
                <Text style={styles.fieldRequired}>*</Text>
              </View>
              <TextInput
                style={[styles.fieldInput, editNameError && styles.fieldInputError]}
                value={editName}
                onChangeText={(v) => { setEditName(v); if (v.trim()) setEditNameError(false); }}
                placeholder="e.g., Sarah Johnson"
                placeholderTextColor={colors.text3}
                autoFocus
              />
              {editNameError && (
                <View style={styles.inlineError}>
                  <Ionicons name="alert-circle" size={13} color="#EA5455" />
                  <Text style={styles.inlineErrorText}>Name is required</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Relationship</Text>
              <View style={styles.chipRow}>
                {RELATIONS.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.relChip, editRelation === r.id && styles.relChipActive]}
                    onPress={() => setEditRelation(r.id)}
                  >
                    <Text style={styles.relChipIcon}>{r.icon}</Text>
                    <Text style={[styles.relChipText, editRelation === r.id && styles.relChipTextActive]}>{r.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.fieldLabel}>Visa / Immigration Status</Text>
              <View style={styles.visaGrid}>
                {VISA_TYPES.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.visaGridChip, editVisaType === v && styles.relChipActive]}
                    onPress={() => setEditVisaType(v)}
                  >
                    <Text style={[styles.relChipText, editVisaType === v && styles.relChipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.saveBtn, { marginTop: spacing.lg }]} onPress={handleEditMember} activeOpacity={0.85}>
                <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F4F5FA' },
  content:          { paddingBottom: 40 },
  contentWeb:       { paddingHorizontal: 28, paddingTop: 24 },
  header:           { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, padding: spacing.xl, paddingTop: spacing.xxl + 16 },
  headerEye:        { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: 3 },
  headerTitle:      { ...typography.h1, color: colors.text1, fontSize: 22 },
  headerSub:        { ...typography.caption, color: colors.text3, marginTop: 3 },
  webHero:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  webTitle:         { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#0F172A', letterSpacing: -0.5 },
  webSub:           { ...typography.caption, color: colors.text3, marginTop: 4, maxWidth: 500 },
  addMemberBtn:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7367F0', paddingHorizontal: 18, paddingVertical: 10, borderRadius: radius.lg },
  addMemberBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  emptyState:       { alignItems: 'center', padding: 40, gap: 14 },
  emptyIcon:        { width: 80, height: 80, borderRadius: 20, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  emptyTitle:       { ...typography.h2, color: colors.text1 },
  emptyDesc:        { ...typography.body, color: colors.text3, textAlign: 'center', maxWidth: 300, lineHeight: 22 },
  emptyBtn:         { width: '100%', maxWidth: 320, borderRadius: radius.lg, overflow: 'hidden' },
  emptyBtnGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  emptyBtnText:     { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  addBtnRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.screen, paddingVertical: spacing.md },
  addBtnRowText:    { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#7367F0' },
  freePlanBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0EEFF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: '#E0DBFF' },
  freePlanBannerText:{ flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#4B4C6A' },
  freePlanUpgrade:  { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#7367F0' },
  lockBadge:        { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF4E6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#FFD59E' },
  lockBadgeText:    { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#CC7A28' },
  memberGrid:       { paddingHorizontal: spacing.screen, gap: spacing.md },
  memberGridWeb:    { paddingHorizontal: 0 },
  memberCard:       { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#DBDADE' },
  memberCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg },
  memberAvatar:     { width: 46, height: 46, borderRadius: 12, backgroundColor: '#F4F5FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DBDADE' },
  memberName:       { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.text1 },
  memberMeta:       { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text3, marginTop: 2 },
  memberRight:      { alignItems: 'flex-end', gap: 4 },
  statusPill:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  statusDot:        { width: 5, height: 5, borderRadius: 3 },
  statusText:       { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  docCount:         { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text3 },
  memberBody:       { borderTopWidth: 1, borderTopColor: colors.borderLight, padding: spacing.lg },
  noDocsText:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text3, textAlign: 'center', paddingVertical: spacing.md },
  docRow:           { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  docStrip:         { width: 3, height: 32, borderRadius: 2 },
  docIcon:          { fontSize: 18 },
  docName:          { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text1 },
  docExpiry:        { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text3, marginTop: 2 },
  daysBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  daysText:         { fontSize: 11, fontFamily: 'Inter_700Bold' },
  memberActions:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.borderLight },
  addDocBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addDocBtnText:    { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#7367F0' },
  removeText:       { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.danger },
  editMemberBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editMemberText:   { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#7367F0' },
  overlay:          { flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:            { backgroundColor: colors.card, borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '88%' as any, overflow: 'hidden', display: 'flex' as any, flexDirection: 'column', ...shadows.lg } as any,
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.xl, paddingBottom: 0 },
  modalTitle:       { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text1 },
  fieldLabel:       { ...typography.captionBold, color: colors.text2, marginBottom: 6, marginTop: 4 },
  fieldLabelRow:    { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 6, marginTop: 4 },
  fieldRequired:    { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#EA5455' },
  fieldInputError:  { borderColor: '#EA5455', borderWidth: 1.5 },
  inlineError:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginBottom: 4 },
  inlineErrorText:  { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#EA5455' },
  fieldInput:       { backgroundColor: '#F4F5FA', borderRadius: radius.md, borderWidth: 1.5, borderColor: '#DBDADE', padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text1, marginBottom: spacing.md },
  chipRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  relChip:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE' },
  relChipActive:    { backgroundColor: '#F0EEFF', borderColor: '#7367F0' },
  relChipIcon:      { fontSize: 13 },
  relChipText:      { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text2 },
  relChipTextActive:{ color: '#7367F0', fontFamily: 'Inter_700Bold' },
  visaChip:         { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE' },
  visaGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.md } as any,
  visaGridChip:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE' },
  docTypeList:      { borderRadius: 8, borderWidth: 1, borderColor: '#DBDADE', height: 260, marginBottom: spacing.md },
  templateRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#F4F5FA' },
  templateRowActive:{ backgroundColor: '#F0EEFF' },
  templateRowAdded: { backgroundColor: '#F9FAFB', opacity: 0.7 },
  alreadyAddedText: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#28C76F', marginTop: 1 },
  templateLabel:    { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text1, flex: 1 },
  saveBtn:          { borderRadius: radius.lg, overflow: 'hidden' },
  saveBtnGrad:      { paddingVertical: 14, alignItems: 'center' },
  saveBtnText:      { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
