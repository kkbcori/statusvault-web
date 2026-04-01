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
  const familyMembers    = useStore((s) => s.familyMembers);
  const addFamilyMember  = useStore((s) => s.addFamilyMember);
  const removeFamilyMember = useStore((s) => s.removeFamilyMember);
  const updateFamilyMember = useStore((s) => s.updateFamilyMember);
  const addDocument      = useStore((s) => s.addDocument);
  const removeDocument   = useStore((s) => s.removeDocument);
  const documents        = useStore((s) => s.documents);
  const dialog           = useDialog();

  const [showAddMember,    setShowAddMember]    = useState(false);
  const [showAddDoc,       setShowAddDoc]       = useState(false);
  const [selectedMember,   setSelectedMember]   = useState<FamilyMember | null>(null);
  const [expandedMember,   setExpandedMember]   = useState<string | null>(null);

  // Add member form
  const [name,      setName]      = useState('');
  const [relation,  setRelation]  = useState(RELATIONS[1].id);
  const [visaType,  setVisaType]  = useState(VISA_TYPES[0]);

  // Add doc for member
  const [docTemplateId, setDocTemplateId] = useState('');
  const [docExpiry,     setDocExpiry]     = useState('');
  const [docNotes,      setDocNotes]      = useState('');

  const handleAddMember = () => {
    if (!name.trim()) { dialog.alert('Name required', 'Please enter a name.'); return; }
    addFamilyMember({
      id: Date.now().toString(),
      name: name.trim(),
      relation,
      visaType,
      documentIds: [],
      createdAt: new Date().toISOString(),
    });
    setName(''); setRelation(RELATIONS[1].id); setVisaType(VISA_TYPES[0]);
    setShowAddMember(false);
  };

  const handleAddDoc = async () => {
    if (!selectedMember || !docTemplateId || !docExpiry) {
      dialog.alert('Missing info', 'Please select a document type and expiry date.');
      return;
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

    await addDocument(doc);
    updateFamilyMember(selectedMember.id, {
      documentIds: [...selectedMember.documentIds, doc.id],
    });
    setDocTemplateId(''); setDocExpiry(''); setDocNotes('');
    setShowAddDoc(false);
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
      showsVerticalScrollIndicator={false}
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
          <TouchableOpacity style={styles.addMemberBtn} onPress={() => setShowAddMember(true)} activeOpacity={0.85}>
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
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAddMember(true)} activeOpacity={0.85}>
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
            <TouchableOpacity style={styles.addBtnRow} onPress={() => setShowAddMember(true)}>
              <Ionicons name="person-add-outline" size={16} color={'#7367F0'} />
              <Text style={styles.addBtnRowText}>Add family member</Text>
            </TouchableOpacity>
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
                        memberDocs.map((doc) => {
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
                                onPress={() => dialog.confirm({
                                  title: 'Remove document?', message: `Remove "${doc.label}"?`,
                                  type: 'danger', confirmLabel: 'Remove',
                                  onConfirm: () => {
                                    removeDocument(doc.id);
                                    updateFamilyMember(member.id, {
                                      documentIds: member.documentIds.filter((id) => id !== doc.id),
                                    });
                                  },
                                })}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Ionicons name="close" size={16} color={colors.text3} />
                              </TouchableOpacity>
                            </View>
                          );
                        })
                      )}

                      {/* Add doc / Remove member actions */}
                      <View style={styles.memberActions}>
                        <TouchableOpacity
                          style={styles.addDocBtn}
                          onPress={() => { setSelectedMember(member); setShowAddDoc(true); }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add-circle-outline" size={15} color={'#7367F0'} />
                          <Text style={styles.addDocBtnText}>Add document</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleRemoveMember(member)}>
                          <Text style={styles.removeText}>Remove member</Text>
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

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.fieldInput} value={name} onChangeText={setName}
              placeholder="e.g., Sarah Johnson" placeholderTextColor={colors.text3}
              autoFocus
            />

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

            <Text style={styles.fieldLabel}>Visa / Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.lg }}>
              <View style={styles.chipRow}>
                {VISA_TYPES.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.visaChip, visaType === v && styles.relChipActive]}
                    onPress={() => setVisaType(v)}
                  >
                    <Text style={[styles.relChipText, visaType === v && styles.relChipTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleAddMember} activeOpacity={0.85}>
              <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                <Text style={styles.saveBtnText}>Add Member</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══ ADD DOC FOR MEMBER MODAL ═══ */}
      <Modal visible={showAddDoc} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Document for {selectedMember?.name}</Text>
              <TouchableOpacity onPress={() => setShowAddDoc(false)}>
                <Ionicons name="close" size={22} color={colors.text2} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Document Type</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: spacing.md }} showsVerticalScrollIndicator={false}>
              {DOCUMENT_TEMPLATES.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.templateRow, docTemplateId === t.id && styles.templateRowActive]}
                  onPress={() => setDocTemplateId(t.id)}
                >
                  <Text style={{ fontSize: 18, marginRight: 10 }}>{t.icon}</Text>
                  <Text style={[styles.templateLabel, docTemplateId === t.id && { color: '#7367F0' }]}>{t.label}</Text>
                  {docTemplateId === t.id && <Ionicons name="checkmark-circle" size={16} color={'#7367F0'} style={{ marginLeft: 'auto' as any }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Expiry Date</Text>
            {IS_WEB ? (
              <input
                type="date"
                value={docExpiry}
                onChange={(e: any) => setDocExpiry(e.target.value)}
                style={{ width: '100%', padding: '12px 14px', fontSize: '14px', border: '1.5px solid #E5E7EB', borderRadius: '10px', backgroundColor: '#fff', outline: 'none', marginBottom: '16px', boxSizing: 'border-box' } as any}
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
  emptyIcon:        { width: 80, height: 80, borderRadius: 20, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DBDADE'Gold },
  emptyTitle:       { ...typography.h2, color: colors.text1 },
  emptyDesc:        { ...typography.body, color: colors.text3, textAlign: 'center', maxWidth: 300, lineHeight: 22 },
  emptyBtn:         { width: '100%', maxWidth: 320, borderRadius: radius.lg, overflow: 'hidden' },
  emptyBtnGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  emptyBtnText:     { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  addBtnRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.screen, paddingVertical: spacing.md },
  addBtnRowText:    { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#7367F0' },
  memberGrid:       { paddingHorizontal: spacing.screen, gap: spacing.md },
  memberGridWeb:    { paddingHorizontal: 0 },
  memberCard:       { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 0, overflow: 'hidden', ...shadows.sm },
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
  overlay:          { flex: 1, backgroundColor: 'rgba(17,24,39,0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:            { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xl, width: '100%', maxWidth: 480, ...shadows.lg },
  modalHeader:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle:       { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.text1 },
  fieldLabel:       { ...typography.captionBold, color: colors.text2, marginBottom: 6, marginTop: 4 },
  fieldInput:       { backgroundColor: '#F4F5FA', borderRadius: radius.md, borderWidth: 1.5, borderColor: '#DBDADE', padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text1, marginBottom: spacing.md },
  chipRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  relChip:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE' },
  relChipActive:    { backgroundColor: '#F0EEFF', borderColor: '#7367F0' },
  relChipIcon:      { fontSize: 14 },
  relChipText:      { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text2 },
  relChipTextActive:{ color: '#7367F0', fontFamily: 'Inter_700Bold' },
  visaChip:         { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE' },
  templateRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  templateRowActive:{ backgroundColor: '#F0EEFF' },
  templateLabel:    { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text1, flex: 1 },
  saveBtn:          { borderRadius: radius.lg, overflow: 'hidden' },
  saveBtnGrad:      { paddingVertical: 14, alignItems: 'center' },
  saveBtnText:      { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
