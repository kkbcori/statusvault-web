// ═══════════════════════════════════════════════════════════════
// DashboardScreen v4 — Responsive web layout
// Web:    flat header hidden (AppNavigator top bar handles it),
//         2-col card grid, blended background, wider cards
// Mobile: unchanged — gradient header, single column
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  LayoutAnimation, Platform, UIManager, Modal, FlatList, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useStore, FREE_LIMIT } from '../store';
import { generateDeadlines, getMostCritical } from '../utils/dates';
import { CHECKLIST_TEMPLATES } from '../utils/checklists';
import { COUNTER_TEMPLATES } from '../utils/counters';
import { StatusCard, SeveritySummary, TimelineItem, ProgressBar } from '../components';
import { IS_WEB, useIsWide } from '../utils/responsive';
import { DOCUMENT_TEMPLATES } from '../utils/templates';
import { UserDocument } from '../types';
import { useDialog } from '../components/ConfirmDialog';
import { AppIcon } from '../utils/icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Mobile-only background decorations ──────────────────────
const BgDecorations = () => {
  if (IS_WEB) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {['✈️','🌍','🛂','📋','🗺️','🏛️'].map((emoji, i) => (
        <Text key={i} style={{
          position: 'absolute',
          top: 120 + i * 280 + (i % 2) * 60,
          left: i % 2 === 0 ? 12 : undefined,
          right: i % 2 !== 0 ? 12 : undefined,
          fontSize: 22 + (i % 3) * 4,
          opacity: 0.09,
          transform: [{ rotate: `${-20 + i * 15}deg` }],
        }}>{emoji}</Text>
      ))}
      {[200, 550, 900, 1300, 1700].map((top, i) => (
        <View key={`line-${i}`} style={{
          position: 'absolute', top, left: 30, right: 30,
          height: 1, backgroundColor: colors.accent, opacity: 0.05,
        }} />
      ))}
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────────
interface SectionHeaderProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  right?: React.ReactNode;
}
const SectionHeader: React.FC<SectionHeaderProps> = ({ iconName, title, right }) => (
  <View style={shStyles.row}>
    <View style={shStyles.left}>
      <View style={shStyles.iconPill}>
        <Ionicons name={iconName} size={13} color={colors.primary} />
      </View>
      <Text style={shStyles.title}>{title}</Text>
    </View>
    {right}
  </View>
);
const shStyles = StyleSheet.create({
  row:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  left:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  title:   { ...typography.h2, color: colors.text1, fontSize: 15 },
});

// ─── Web section card wrapper ─────────────────────────────────
// On web, each section sits in a white card with shadow, no border
const WebCard: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  IS_WEB
    ? <View style={[webCardStyle.card, style]}>{children}</View>
    : <>{children}</>
);
const webCardStyle = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? { boxShadow: '0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.03)' } : shadows.sm),
  } as any,
});

export const DashboardScreen: React.FC = () => {
  const documents             = useStore((s) => s.documents);
  const checklists            = useStore((s) => s.checklists);
  const counters              = useStore((s) => s.counters);
  const isPremium             = useStore((s) => s.isPremium);
  const toggleChecklistItem   = useStore((s) => s.toggleChecklistItem);
  const addChecklist          = useStore((s) => s.addChecklist);
  const removeChecklist       = useStore((s) => s.removeChecklist);
  const addCustomChecklistItem = useStore((s) => s.addCustomChecklistItem);
  const hasChecklist          = useStore((s) => s.hasChecklist);
  const addCounter            = useStore((s) => s.addCounter);
  const addCustomCounter      = useStore((s) => s.addCustomCounter);
  const removeCounter         = useStore((s) => s.removeCounter);
  const hasCounter            = useStore((s) => s.hasCounter);
  const incrementCounter      = useStore((s) => s.incrementCounter);
  const decrementCounter      = useStore((s) => s.decrementCounter);
  const resetCounter          = useStore((s) => s.resetCounter);
  const setCounterTracking    = useStore((s) => s.setCounterTracking);
  const autoIncrementCounters = useStore((s) => s.autoIncrementCounters);
  const getRemainingFreeSlots = useStore((s) => s.getRemainingFreeSlots);
  const authUser              = useStore((s) => s.authUser);
  const visaProfile           = useStore((s) => s.visaProfile);
  const setVisaProfile        = useStore((s) => s.setVisaProfile);
  const addDocument           = useStore((s) => s.addDocument);
  const navigation            = useNavigation<any>();
  const isWide                = useIsWide();
  const dialog                = useDialog();

  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showAuthPrompt,   setShowAuthPrompt]   = useState(false);
  const [profileStep,      setProfileStep]      = useState<'select' | 'docs'>('select');
  const [selectedVisa,     setSelectedVisa]     = useState('');
  const [selectedDocIds,   setSelectedDocIds]   = useState<string[]>([]);
  const [savingProfile,    setSavingProfile]    = useState(false);
  const [showAddChecklist,  setShowAddChecklist]  = useState(false);
  const [showAddCounter,    setShowAddCounter]    = useState(false);
  const [showCustomCounter, setShowCustomCounter] = useState(false);
  const [customCounterName, setCustomCounterName] = useState('');
  const [customCounterDays, setCustomCounterDays] = useState('');
  const [customItemText,    setCustomItemText]    = useState('');
  const [customItemTarget,  setCustomItemTarget]  = useState<string | null>(null);

  React.useEffect(() => { autoIncrementCounters(); }, []);

  // Show sign-in prompt after 3s if user has data but no account
  React.useEffect(() => {
    if (!authUser && documents.length > 0) {
      const t = setTimeout(() => setShowAuthPrompt(true), 3000);
      return () => clearTimeout(t);
    }
  }, [authUser, documents.length]);

  const deadlines    = generateDeadlines(documents);
  const mostCritical = getMostCritical(deadlines);
  const remaining    = getRemainingFreeSlots();

  const handleToggle = (tid: string, iid: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleChecklistItem(tid, iid);
  };
  const handleAddCustomItem = (tid: string) => {
    if (!customItemText.trim()) return;
    addCustomChecklistItem(tid, customItemText.trim());
    setCustomItemText(''); setCustomItemTarget(null);
  };
  const handleRemoveChecklist = (tid: string, label: string) => {
    dialog.confirm({ title: 'Remove Checklist', message: `Remove "${label}"?`, type: 'danger',
      confirmLabel: 'Remove', onConfirm: () => removeChecklist(tid) });
  };
  const handleRemoveCounter = (tid: string, label: string) => {
    dialog.confirm({ title: 'Remove Counter', message: `Remove "${label}"? Count will be lost.`, type: 'danger',
      confirmLabel: 'Remove', onConfirm: () => removeCounter(tid) });
  };
  const handleAddCustomCounter = () => {
    const name = customCounterName.trim();
    const days = parseInt(customCounterDays, 10);
    if (!name) { dialog.alert('Name required', 'Please enter a counter name.'); return; }
    if (!days || days < 1 || days > 9999) { dialog.alert('Invalid days', 'Enter a valid number between 1 and 9999.'); return; }
    addCustomCounter(name, days);
    setCustomCounterName(''); setCustomCounterDays('');
    setShowCustomCounter(false); setShowAddCounter(false);
  };
  const getCounterColor = (c: { daysUsed: number; warnAt: number; critAt: number }) =>
    c.daysUsed >= c.critAt ? colors.danger : c.daysUsed >= c.warnAt ? colors.warning : colors.success;

  const VISA_PROFILES = [
    { id: 'f1-opt',     icon: 'visa_approved', label: 'F-1 Student / OPT',   docs: ['f1-visa','i20','sevis','passport','opt-ead'] },
    { id: 'f1-stem',    icon: 'application', label: 'F-1 STEM OPT',        docs: ['f1-visa','i20','sevis','passport','stem-opt'] },
    { id: 'h1b',        icon: 'visa', label: 'H-1B Worker',          docs: ['h1b-visa','h1b-approval','passport','i94'] },
    { id: 'h4',         icon: 'visa2', label: 'H-4 Dependent',        docs: ['h4-visa','h4-ead','passport','i94'] },
    { id: 'green-card', icon: 'passport_card', label: 'Green Card Holder',    docs: ['green-card','passport','i94'] },
    { id: 'l1',         icon: 'travel_plane', label: 'L-1 / L-2',            docs: ['l1-visa','l2-ead','passport','i94'] },
    { id: 'j1',         icon: 'biometrics', label: 'J-1 Exchange Visitor', docs: ['j1-visa','ds2019','passport','i94'] },
    { id: 'b1b2',       icon: 'travel2', label: 'B-1/B-2 Visitor',      docs: ['b1b2-visa','passport','i94'] },
  ];

  const handleVisaSelect = (profileId: string, docs: string[]) => {
    setSelectedVisa(profileId);
    setSelectedDocIds(docs);
    setProfileStep('docs');
  };

  const handleSaveProfile = async () => {
    // Check free limit — if not premium and trying to add > FREE_LIMIT docs, show paywall
    const currentDocs = useStore.getState().documents;
    const newDocs = selectedDocIds.filter((id) => !currentDocs.some((d) => d.templateId === id));
    const totalAfter = currentDocs.length + newDocs.length;

    if (!isPremium && totalAfter > FREE_LIMIT) {
      // Show upgrade prompt
      setShowProfileSetup(false);
      setTimeout(() => {
        dialog.confirm({
          title: 'Free Plan Limit',
          message: `You selected ${selectedDocIds.length} documents but the free plan allows ${FREE_LIMIT} total. Upgrade to Premium to track unlimited documents, or select only ${FREE_LIMIT - currentDocs.length} document${FREE_LIMIT - currentDocs.length !== 1 ? 's' : ''}.`,
          type: 'confirm',
          confirmLabel: 'Upgrade to Premium',
          cancelLabel: 'Go Back',
          onConfirm: () => navigation.navigate('Main', { screen: 'Documents', params: { openPaywall: true } }),
          onCancel: () => setShowProfileSetup(true),
        });
      }, 300);
      return;
    }

    setSavingProfile(true);
    try {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      const defaultExpiry = oneYearFromNow.toISOString().split('T')[0];

      for (const docId of selectedDocIds) {
        const template = DOCUMENT_TEMPLATES.find((t) => t.id === docId);
        if (!template) continue;
        // Always read fresh from store — closure docs go stale mid-loop
        const freshDocs = useStore.getState().documents;
        if (freshDocs.some((d) => d.templateId === docId)) continue;
        const doc: UserDocument = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          templateId: template.id, label: template.label,
          category: template.category, expiryDate: defaultExpiry,
          alertDays: template.alertDays, icon: template.icon,
          notes: '⚠️ Update with real expiry date',
          notificationIds: [], createdAt: new Date().toISOString(),
        };
        useStore.getState().forceAddDocument(doc);
      }
      setVisaProfile(selectedVisa);
    } catch {}
    finally {
      setSavingProfile(false);
      setShowProfileSetup(false);
      setProfileStep('select');
      setSelectedVisa('');
    }
  };

  const toggleDocId = (id: string) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(id)) return prev.filter((d) => d !== id);
      // For free users, count how many NEW docs this would add
      const currentDocs = useStore.getState().documents;
      const alreadyTracked = currentDocs.filter((d) => prev.includes(d.templateId)).length;
      const newCount = prev.filter((id2) => !currentDocs.some((d) => d.templateId === id2)).length;
      if (!useStore.getState().isPremium && newCount >= FREE_LIMIT - currentDocs.length) {
        // Don't add — show inline message (handled in UI)
        return prev;
      }
      return [...prev, id];
    });
  };

  // Count new docs being added (not already tracked)
  const newDocCount = selectedDocIds.filter(
    (id) => !documents.some((d) => d.templateId === id)
  ).length;
  const slotsUsed = documents.length;
  const slotsLeft = Math.max(0, FREE_LIMIT - slotsUsed);
  const overLimit = !isPremium && newDocCount > slotsLeft;

    return (
    <ScrollView
      style={[styles.container, IS_WEB && styles.containerWeb]}
      contentContainerStyle={[styles.content, IS_WEB && styles.contentWeb]}
      showsVerticalScrollIndicator={false}
    >
      <BgDecorations />

      {/* ─── Header — mobile only ───────────────────────────── */}
      {!IS_WEB && (
        <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={styles.headerGradient}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>STATUSVAULT</Text>
              <Text style={styles.title}>Your Status</Text>
            </View>
            <View style={styles.privacyBadge}>
              <Ionicons name="lock-closed" size={13} color={colors.accent} />
              <View>
                <Text style={styles.privacyText}>100% Private</Text>
                <Text style={styles.privacySubtext}>On your device</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}

      <StatusCard deadline={mostCritical} totalDocs={documents.length} deadlines={deadlines} />
      <SeveritySummary deadlines={deadlines} />

      {/* ─── Free tier thin strip ────────────────────────────── */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.freeThinStrip}
          onPress={() => navigation.navigate('Documents', remaining > 0 ? {} : { openPaywall: true })}
          activeOpacity={0.75}
        >
          {/* Slot dots */}
          <View style={styles.freeSlotDots}>
            {Array.from({ length: FREE_LIMIT }).map((_, i) => (
              <View key={i} style={[styles.freeSlotDot, {
                backgroundColor: i < documents.length
                  ? (remaining === 0 ? colors.danger : colors.primary)
                  : '#E2E8F0'
              }]} />
            ))}
          </View>
          <Text style={styles.freeThinText}>
            {remaining > 0
              ? `Free plan · ${documents.length}/${FREE_LIMIT} docs used · ${remaining} slot${remaining !== 1 ? 's' : ''} left`
              : `Free limit reached · Upgrade for unlimited docs`}
          </Text>
          {remaining === 0
            ? <View style={styles.freeUpgradeChip}><Text style={styles.freeUpgradeText}>Upgrade ↗</Text></View>
            : <Ionicons name="chevron-forward" size={12} color={colors.text4} />
          }
        </TouchableOpacity>
      )}

      {/* ─── Profile Setup CTA ─────────────────────────────── */}
      {!visaProfile && (
        <TouchableOpacity
          style={styles.profileCTA}
          onPress={() => { setProfileStep('select'); setShowProfileSetup(true); }}
          activeOpacity={0.85}
        >
          <View style={styles.profileCTAInner}>
            {/* Radio step indicator */}
            <View style={styles.profileRadioWrap}>
              <View style={styles.profileRadioOuter}>
                <View style={styles.profileRadioInner} />
              </View>
              <View style={styles.profileRadioLine} />
            </View>
            <View style={styles.profileCTALeft}>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileCTAEye}>RECOMMENDED NEXT STEP</Text>
                <Text style={styles.profileCTATitle}>Set up your profile</Text>
                <Text style={styles.profileCTASub}>Select your visa type and we'll pre-load the right documents</Text>
              </View>
              <View style={styles.profileCTAArrow}>
                <Ionicons name="arrow-forward" size={16} color={colors.primary} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Profile badge when set */}
      {visaProfile && (
        <TouchableOpacity
          style={styles.profileBadge}
          onPress={() => { setProfileStep('select'); setShowProfileSetup(true); }}
          activeOpacity={0.8}
        >
          {(() => {
            const VISA_PROFILES_STATIC = [
              { id: 'f1-opt','icon':'visa_approved',label:'F-1 Student / OPT'},
              { id: 'f1-stem','icon':'application',label:'F-1 STEM OPT'},
              { id: 'h1b','icon':'visa',label:'H-1B Worker'},
              { id: 'h4','icon':'visa2',label:'H-4 Dependent'},
              { id: 'green-card','icon':'passport_card',label:'Green Card Holder'},
              { id: 'l1','icon':'travel_plane',label:'L-1 / L-2'},
              { id: 'j1','icon':'biometrics',label:'J-1 Exchange Visitor'},
              { id: 'b1b2','icon':'travel2',label:'B-1/B-2 Visitor'},
            ];
            const profile = VISA_PROFILES_STATIC.find((p) => p.id === visaProfile);
            return (
              <>
                {profile?.icon && profile.icon.length > 2
                  ? <AppIcon name={profile.icon as any} size={24} style={{ marginRight: 4 }} />
                  : <Text style={styles.profileBadgeIcon}>{profile?.icon ?? '👤'}</Text>
                }
                <Text style={styles.profileBadgeLabel}>{profile?.label ?? visaProfile}</Text>
                <Text style={styles.profileBadgeEdit}>Edit profile →</Text>
              </>
            );
          })()}
        </TouchableOpacity>
      )}



      {/* ─── Web: 2-column grid wrapper ──────────────────────── */}
      <View style={IS_WEB && isWide ? styles.webGrid : undefined}>

        {/* ─── Deadlines ──────────────────────────────────── */}
        <View style={[styles.section, IS_WEB && styles.sectionWeb]}>
          <WebCard>
            <SectionHeader
              iconName="calendar-outline"
              title="Upcoming Deadlines"
              right={deadlines.length > 0
                ? <TouchableOpacity onPress={() => navigation.navigate('Documents')}>
                    <Text style={styles.seeAll}>See all →</Text>
                  </TouchableOpacity>
                : null}
            />
            {deadlines.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}><Text style={{ fontSize: 28 }}>🌍</Text></View>
                <Text style={styles.emptyTitle}>No deadlines yet</Text>
                <Text style={styles.emptySubtitle}>Add your first visa or document to get started</Text>
              </View>
            ) : deadlines.slice(0, 5).map((dl) => <TimelineItem key={dl.documentId} deadline={dl} compact />)}
          </WebCard>
        </View>

        {/* ─── Immi Counter ─────────────────────────────────── */}
        <View style={[styles.section, IS_WEB && styles.sectionWeb]}>
          <WebCard>
            <SectionHeader
              iconName="timer-outline"
              title="Immi Counter"
              right={
                <TouchableOpacity onPress={() => setShowAddCounter(true)} style={styles.addBtnPill}>
                  <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              }
            />
            {counters.length === 0 && (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}><Text style={{ fontSize: 28 }}>⏱️</Text></View>
                <Text style={styles.emptyTitle}>No counters</Text>
                <Text style={styles.emptySubtitle}>Track OPT unemployment, H-1B grace period, and more</Text>
              </View>
            )}
            {counters.map((c) => {
              const col = getCounterColor(c);
              const pct = Math.round((c.daysUsed / c.maxDays) * 100);
              return (
                <View key={c.templateId} style={[styles.counterCard, IS_WEB && styles.counterCardWeb]}>
                  <View style={[styles.counterAccent, { backgroundColor: col }]} />
                  <View style={styles.counterContent}>
                    <View style={styles.counterHeader}>
                      <View style={[styles.counterIconBox, { backgroundColor: col + '15', borderColor: col + '25', borderWidth: 1 }]}>
                        <Text style={{ fontSize: 18 }}>{c.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.counterLabel}>{c.label}</Text>
                        <Text style={styles.counterPct}>{pct}% used</Text>
                      </View>
                      <TouchableOpacity onPress={() => handleRemoveCounter(c.templateId, c.label)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close" size={18} color={colors.text3} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.counterRow}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.counterNumbers}>
                          <Text style={[styles.counterBig, { color: col }]}>{c.daysUsed}</Text>
                          <Text style={styles.counterSlash}> / {c.maxDays} </Text>
                          <Text style={styles.counterDaysLabel}>days</Text>
                        </View>
                        <ProgressBar value={c.daysUsed} max={c.maxDays} color={col} height={5} />
                      </View>
                      <View style={styles.counterBtns}>
                        <TouchableOpacity style={styles.cBtn} onPress={() => decrementCounter(c.templateId)}>
                          <Text style={styles.cBtnText}>−</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.cBtn, { backgroundColor: col + '12', borderColor: col + '25' }]} onPress={() => incrementCounter(c.templateId)}>
                          <Text style={[styles.cBtnText, { color: col }]}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.counterFooter}>
                      <TouchableOpacity
                        onPress={() => setCounterTracking(c.templateId, !c.isTracking)}
                        style={[styles.autoChip, c.isTracking && { backgroundColor: col }]}
                      >
                        <Text style={[styles.autoChipText, c.isTracking && { color: '#fff' }]}>
                          Auto-track: {c.isTracking ? 'ON' : 'OFF'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => dialog.confirm({ title: 'Reset Counter', message: `Reset "${c.label}" to 0?`, type: 'danger', confirmLabel: 'Reset', onConfirm: () => resetCounter(c.templateId) })}>
                        <Text style={styles.resetText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </WebCard>
        </View>

        {/* ─── Checklists ───────────────────────────────────── */}
        <View style={[styles.section, IS_WEB && styles.sectionWeb]}>
          <WebCard>
            <SectionHeader
              iconName="checkmark-circle-outline"
              title="Checklists"
              right={
                <TouchableOpacity onPress={() => setShowAddChecklist(true)} style={styles.addBtnPill}>
                  <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
              }
            />
            {checklists.length === 0 && (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}><Text style={{ fontSize: 28 }}>📋</Text></View>
                <Text style={styles.emptyTitle}>No checklists</Text>
                <Text style={styles.emptySubtitle}>Add OPT, H-1B, Passport, or other immigration checklists</Text>
              </View>
            )}
            {checklists.map((cl) => {
              const done = cl.items.filter((i) => i.done).length;
              return (
                <View key={cl.templateId} style={[styles.checklistCard, IS_WEB && styles.checklistCardWeb]}>
                  <View style={styles.checklistHeader}>
                    <View style={styles.clIconBox}><Text style={{ fontSize: 20 }}>{cl.icon}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.clLabel}>{cl.label}</Text>
                      <Text style={styles.clProgress}>{done}/{cl.items.length} completed</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveChecklist(cl.templateId, cl.label)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="close" size={18} color={colors.text3} />
                    </TouchableOpacity>
                  </View>
                  <ProgressBar value={done} max={cl.items.length} color={colors.success} height={4} />
                  <View style={{ height: 10 }} />
                  {cl.items.map((item) => (
                    <TouchableOpacity key={item.id} style={styles.checkRow} onPress={() => handleToggle(cl.templateId, item.id)}>
                      <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                        {item.done && <Ionicons name="checkmark" size={13} color="#fff" />}
                      </View>
                      <Text style={[styles.checkText, item.done && styles.checkTextDone]} numberOfLines={2}>{item.text}</Text>
                    </TouchableOpacity>
                  ))}
                  {customItemTarget === cl.templateId ? (
                    <View style={styles.customRow}>
                      <TextInput
                        style={styles.customInput} value={customItemText} onChangeText={setCustomItemText}
                        placeholder="Custom step..." placeholderTextColor={colors.text3} autoFocus
                        onSubmitEditing={() => handleAddCustomItem(cl.templateId)}
                      />
                      <TouchableOpacity onPress={() => handleAddCustomItem(cl.templateId)} style={styles.customAddBtn}>
                        <Text style={{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' }}>Add</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => { setCustomItemTarget(null); setCustomItemText(''); }}>
                        <Ionicons name="close" size={18} color={colors.text3} style={{ paddingHorizontal: 4 }} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => setCustomItemTarget(cl.templateId)}>
                      <Text style={styles.addCustomText}>+ Add custom step</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.disclaimer}>⚠️ General guidance only. Consult your DSO or immigration attorney.</Text>
                </View>
              );
            })}
          </WebCard>
        </View>

      </View>{/* end webGrid */}

      <View style={{ height: 30 }} />

      {/* ═══ AUTH PROMPT MODAL ═══ */}
      <Modal visible={showAuthPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.authPromptCard]}>
            <TouchableOpacity style={styles.authPromptClose} onPress={() => setShowAuthPrompt(false)}>
              <Ionicons name="close" size={20} color={colors.text3} />
            </TouchableOpacity>
            <View style={styles.authPromptIcon}>
              <Ionicons name="shield-checkmark" size={32} color={colors.accent} />
            </View>
            <Text style={styles.authPromptTitle}>Sync Across Devices</Text>
            <Text style={styles.authPromptDesc}>
              Sign in to access your documents from any device and receive expiry alerts by email.
            </Text>
            <TouchableOpacity
              style={styles.authPromptBtn}
              onPress={() => { setShowAuthPrompt(false); navigation.navigate('Auth'); }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.authPromptBtnGrad}>
                <Ionicons name="log-in-outline" size={18} color="#fff" />
                <Text style={styles.authPromptBtnText}>Sign In or Create Account</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAuthPrompt(false)} style={{ paddingVertical: 10 }}>
              <Text style={styles.authPromptSkip}>Continue without account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══ PROFILE SETUP MODAL ═══ */}
      <Modal visible={showProfileSetup} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { maxHeight: IS_WEB ? '85%' as any : '90%', borderRadius: radius.xl, display: IS_WEB ? 'flex' as any : undefined, flexDirection: 'column', overflow: 'hidden' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                if (profileStep === 'docs') setProfileStep('select');
                else setShowProfileSetup(false);
              }}>
                <Text style={styles.modalBack}>{profileStep === 'docs' ? '← Back' : 'Cancel'}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {profileStep === 'select' ? 'Your Visa Status' : 'Confirm Documents'}
              </Text>
              <View style={{ width: 60 }} />
            </View>

            {profileStep === 'select' ? (
              <FlatList style={{ flex: 1 }}
                data={VISA_PROFILES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.templateRow, selectedVisa === item.id && { backgroundColor: colors.accentDim }]}
                    onPress={() => handleVisaSelect(item.id, item.docs)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.tIconBox, { backgroundColor: colors.accentDim }]}>
                      {item.icon.length > 2
                        ? <AppIcon name={item.icon as any} size={32} />
                        : <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tLabel}>{item.label}</Text>
                      <Text style={styles.tDesc}>{item.docs.length} standard documents</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.text3} />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <FlatList style={{ flex: 1 }}
                data={[
                  ...DOCUMENT_TEMPLATES.filter((t) => selectedDocIds.includes(t.id)),
                  { id: '__add__', label: '+ Add another document', icon: '➕', category: 'other', alertDays: [], description: '' } as any,
                ]}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                  <View style={{ padding: spacing.lg, backgroundColor: colors.warningLight, margin: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.warning + '30' }}>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: '#78350F', lineHeight: 18, marginBottom: 4 }}>
                      {'✅ Documents will be added with a 1-year placeholder date.'}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: '#78350F', lineHeight: 18 }}>
                      {'Go to Documents tab to set the real expiry dates.'}
                    </Text>
                    {!isPremium && (
                      <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.warning + '40' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: overLimit ? colors.danger : '#B45309' }}>
                            {overLimit
                              ? `⚠️ Limit reached — deselect ${newDocCount - slotsLeft} doc${newDocCount - slotsLeft !== 1 ? 's' : ''} or upgrade`
                              : `Free plan: ${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} remaining`}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 2 }}>
                            {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                              <View key={i} style={{ width: 10, height: 10, borderRadius: 5,
                                backgroundColor: i < slotsUsed + newDocCount
                                  ? i < slotsUsed ? colors.text3
                                  : overLimit ? colors.danger : colors.success
                                  : colors.borderLight }} />
                            ))}
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                }
                ListFooterComponent={
                  <View style={{ padding: spacing.screen }}>
                    {overLimit && !isPremium && (
                      <TouchableOpacity
                        style={[styles.saveBtn, { marginBottom: spacing.sm }]}
                        onPress={() => { setShowProfileSetup(false); setTimeout(() => navigation.navigate('Main', { screen: 'Documents', params: { openPaywall: true } }), 300); }}
                        activeOpacity={0.85}
                      >
                        <View style={{ backgroundColor: colors.warning, borderRadius: radius.lg, paddingVertical: 12, alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' }}>⭐ Upgrade to add all documents</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.saveBtn, (savingProfile || overLimit) && { opacity: 0.6 }]}
                      onPress={handleSaveProfile}
                      disabled={savingProfile || overLimit}
                    >
                      <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                        <Text style={{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' }}>
                          {savingProfile ? 'Setting up...' : 'Save Profile & Add Documents'}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                }
                renderItem={({ item }) => {
                  if (item.id === '__add__') {
                    return (
                      <TouchableOpacity
                        style={[styles.templateRow, { borderStyle: 'dashed' }]}
                        onPress={() => { setShowProfileSetup(false); navigation.navigate('Main', { screen: 'Documents' }); }}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.tIconBox, { backgroundColor: colors.background }]}>
                          <Ionicons name="add" size={22} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.tLabel, { color: colors.accent }]}>Add another document</Text>
                          <Text style={styles.tDesc}>Open Documents tab to add more</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  }
                  const isSelected = selectedDocIds.includes(item.id);
                  const alreadyAdded = documents.some((d) => d.templateId === item.id);
                  return (
                    <TouchableOpacity
                      style={[styles.templateRow, !isSelected && { opacity: 0.45 }]}
                      onPress={() => toggleDocId(item.id)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.tIconBox}>
                        <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tLabel}>{item.label}</Text>
                        <Text style={styles.tDesc}>{alreadyAdded ? '✓ Already tracked' : `Alerts: ${item.alertDays?.map((d: number) => d + 'd').join(', ')}`}</Text>
                      </View>
                      <View style={[styles.checkbox2, isSelected && styles.checkbox2Active]}>
                        {isSelected && <Ionicons name="checkmark" size={13} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ═══ ADD COUNTER MODAL ═══ */}
      <Modal visible={showAddCounter} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setShowAddCounter(false); setShowCustomCounter(false); }}>
                <Text style={styles.modalBack}>{showCustomCounter ? '← Back' : 'Cancel'}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{showCustomCounter ? 'Custom Counter' : 'Add Immi Counter'}</Text>
              <View style={{ width: 60 }} />
            </View>
            {showCustomCounter ? (
              <View style={{ padding: spacing.screen }}>
                <Text style={styles.fieldLabel}>Counter Name</Text>
                <TextInput style={styles.fieldInput} value={customCounterName} onChangeText={setCustomCounterName} placeholder="e.g., L-2 Grace Period" placeholderTextColor={colors.text3} />
                <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Max Days</Text>
                <TextInput style={styles.fieldInput} value={customCounterDays} onChangeText={setCustomCounterDays} placeholder="e.g., 60" placeholderTextColor={colors.text3} keyboardType="number-pad" />
                <TouchableOpacity style={styles.saveBtn} onPress={handleAddCustomCounter}>
                  <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.saveBtnGrad}>
                    <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' }}>Create Counter</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList style={{ flex: 1 }}
                data={[...COUNTER_TEMPLATES, { id: '__custom__', label: 'Custom Counter', icon: '🔢', maxDays: 0, description: 'Create your own counter', warnAt: 0, critAt: 0 }]}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  if (item.id === '__custom__') {
                    return (
                      <TouchableOpacity style={styles.templateRow} onPress={() => setShowCustomCounter(true)}>
                        <View style={styles.tIconBox}><Text style={{ fontSize: 22 }}>{item.icon}</Text></View>
                        <View style={{ flex: 1 }}><Text style={styles.tLabel}>{item.label}</Text><Text style={styles.tDesc}>{item.description}</Text></View>
                        <Ionicons name="chevron-forward" size={20} color={colors.text3} />
                      </TouchableOpacity>
                    );
                  }
                  const added = hasCounter(item.id);
                  return (
                    <TouchableOpacity style={[styles.templateRow, added && { opacity: 0.4 }]}
                      onPress={() => { if (!added) { addCounter(item.id); setShowAddCounter(false); } }} activeOpacity={added ? 1 : 0.6}>
                      <View style={styles.tIconBox}><Text style={{ fontSize: 22 }}>{item.icon}</Text></View>
                      <View style={{ flex: 1 }}><Text style={styles.tLabel}>{item.label}</Text><Text style={styles.tDesc}>{item.description} · {item.maxDays}d</Text></View>
                      {added ? <Text style={styles.addedBadge}>Added ✓</Text> : <Ionicons name="chevron-forward" size={20} color={colors.text3} />}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ═══ ADD CHECKLIST MODAL ═══ */}
      <Modal visible={showAddChecklist} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddChecklist(false)}>
                <Text style={styles.modalBack}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Add Checklist</Text>
              <View style={{ width: 60 }} />
            </View>
            <FlatList style={{ flex: 1 }}
              data={CHECKLIST_TEMPLATES} keyExtractor={(i) => i.id} showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const added = hasChecklist(item.id);
                return (
                  <TouchableOpacity style={[styles.templateRow, added && { opacity: 0.4 }]}
                    onPress={() => { if (!added) { addChecklist(item.id); setShowAddChecklist(false); } }} activeOpacity={added ? 1 : 0.6}>
                    <View style={styles.tIconBox}><Text style={{ fontSize: 22 }}>{item.icon}</Text></View>
                    <View style={{ flex: 1 }}><Text style={styles.tLabel}>{item.label}</Text><Text style={styles.tDesc}>{item.description} · {item.items.length} steps</Text></View>
                    {added ? <Text style={styles.addedBadge}>Added ✓</Text> : <Ionicons name="chevron-forward" size={20} color={colors.text3} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // ── Layout ──
  container:       { flex: 1, backgroundColor: colors.background },
  containerWeb: { backgroundColor: colors.background },
  content:         { paddingBottom: 20 },
  contentWeb:      { paddingHorizontal: 28, paddingTop: 24, paddingBottom: 48 },

  // Web page title
  webPageTitle:    { marginBottom: spacing.xl },
  webPageTitleText:{ fontSize: 28, fontFamily: 'Inter_900Black', color: colors.text1, letterSpacing: -0.5 },
  webPageSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text3, marginTop: 4 },

  // Web 2-column grid
  webGrid:         { flexDirection: 'row' as any, flexWrap: 'wrap' as any, gap: 16, marginTop: 20, alignItems: 'stretch' as any },

  // Mobile header
  headerGradient:  { paddingBottom: 8 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.screen, paddingTop: spacing.xxl + 20, paddingBottom: spacing.md },
  greeting:        { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: 3, fontSize: 10 },
  title:           { ...typography.h1, color: colors.text1, fontSize: 22 },
  privacyBadge:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,153,168,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,153,168,0.15)' },
  privacyText:     { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.accent, letterSpacing: 0.3 },
  privacySubtext:  { fontSize: 10, fontFamily: 'Inter_500Medium', color: 'rgba(201,163,81,0.6)', marginTop: 1 },

  // Free bar
  freeBar:         { marginHorizontal: IS_WEB ? 0 : spacing.screen, marginTop: spacing.md, backgroundColor: colors.card, borderRadius: 10, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.border } as any,
  freeBarWeb:      { marginHorizontal: 0, borderRadius: radius.xl, marginBottom: spacing.xl },
  freeBarInner:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freeText:        { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text2, flex: 1 },

  // Sections
  section:         { marginTop: spacing.xxl, paddingHorizontal: spacing.screen },
  sectionWeb:      { marginTop: 0, paddingHorizontal: 0, flex: 1 as any, minWidth: 280 as any, flexBasis: '30%' as any },
  seeAll:          { ...typography.captionBold, color: colors.accent },
  addBtnPill:      { backgroundColor: colors.accentDim, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderGold },
  addBtnText:      { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent },

  // Empty state
  emptyCard:       { backgroundColor: IS_WEB ? 'transparent' : colors.card, borderRadius: radius.xl, padding: spacing.xxxl, alignItems: 'center', borderWidth: IS_WEB ? 0 : 1, borderColor: colors.borderLight },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderGold },
  emptyTitle:      { ...typography.bodySemibold, color: colors.text2 },
  emptySubtitle:   { ...typography.caption, color: colors.text3, textAlign: 'center', marginTop: 4, maxWidth: 260 },

  // Counter
  counterCard:     { backgroundColor: '#FFFFFF', borderRadius: 10, marginBottom: 8, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: '#E2E8F0' },
  counterCardWeb:  { borderWidth: 0, borderRadius: radius.lg, backgroundColor: colors.background },
  counterAccent:   { width: 4 },
  counterContent:  { flex: 1, padding: spacing.lg },
  counterHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  counterIconBox:  { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  counterLabel:    { ...typography.h3, color: colors.text1, fontSize: 15 },
  counterPct:      { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text3 },
  counterRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterNumbers:  { flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 },
  counterBig:      { fontSize: 28, fontFamily: 'Inter_900Black', lineHeight: 28 },
  counterSlash:    { fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.text3 },
  counterDaysLabel:{ fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text3 },
  counterBtns:     { gap: 6 },
  cBtn:            { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cBtnText:        { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text2 },
  counterFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight },
  autoChip:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.borderLight },
  autoChipText:    { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.text2 },
  resetText:       { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text3 },

  // Checklist
  checklistCard:   { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  checklistCardWeb:{ backgroundColor: colors.background, borderWidth: 0, borderRadius: radius.lg, ...shadows.sm },
  checklistHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  clIconBox:       { width: 38, height: 38, borderRadius: 10, backgroundColor: colors.successLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.success + '25' },
  clLabel:         { ...typography.h3, color: colors.text1 },
  clProgress:      { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text3 },
  checkRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  checkbox:        { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxDone:    { backgroundColor: colors.success, borderColor: colors.success },
  checkText:       { ...typography.body, color: colors.text1, fontSize: 13, flex: 1 },
  checkTextDone:   { color: colors.text3, textDecorationLine: 'line-through' },
  customRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  customInput:     { flex: 1, backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text1 },
  customAddBtn:    { backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addCustomText:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.accent },
  disclaimer:      { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text3, marginTop: 10, fontStyle: 'italic', lineHeight: 16 },

  // Auth prompt
  authPromptCard:    { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.xxl, width: IS_WEB ? 380 : '88%', alignItems: 'center', ...shadows.lg, position: 'relative' },
  authPromptClose:   { position: 'absolute', top: spacing.md, right: spacing.md, padding: 4 },
  authPromptIcon:    { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.borderGold },
  authPromptTitle:   { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.text1, marginBottom: spacing.sm, textAlign: 'center' },
  authPromptDesc:    { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text3, textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl },
  authPromptBtn:     { width: '100%', borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing.sm },
  authPromptBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  authPromptBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  authPromptSkip:    { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text3 },

  // Free thin strip
  freeThinStrip:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: IS_WEB ? 0 : spacing.screen, marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border } as any,
  freeSlotDots:     { flexDirection: 'row', gap: 3, alignItems: 'center' },
  freeSlotDot:      { width: 8, height: 8, borderRadius: 4 },
  freeThinText:     { flex: 1, fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text3 },
  freeUpgradeChip:  { backgroundColor: '#FEF9C3', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: '#FDE047' },
  freeUpgradeText:  { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#854D0E' },

  // Profile setup
  profileCTA:       { marginHorizontal: IS_WEB ? 0 : spacing.screen, marginTop: 10, borderRadius: 10, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border } as any,
  profileCTAInner:  { flexDirection: 'row', alignItems: 'stretch' },
  profileRadioWrap: { alignItems: 'center', paddingTop: 16, paddingLeft: 14, paddingRight: 4 },
  profileRadioOuter:{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  profileRadioInner:{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  profileRadioLine: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: 3, borderRadius: 1 },
  profileCTALeft:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  profileCTAEye:    { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: colors.primary, letterSpacing: 0.8, marginBottom: 3 },
  profileCTATitle:  { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text1, marginBottom: 2 },
  profileCTASub:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text3, lineHeight: 17 },
  profileCTAArrow:  { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  profileBadge:    { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: IS_WEB ? 0 : spacing.screen, marginTop: spacing.sm, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
  profileBadgeIcon:{ fontSize: 18 },
  profileBadgeLabel:{ flex: 1, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.text1 },
  profileBadgeEdit: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.accent },
  checkbox2:       { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkbox2Active: { backgroundColor: colors.accent, borderColor: colors.accent },
  saveBtn:         { borderRadius: radius.lg, overflow: 'hidden' },
  saveBtnGrad:     { paddingVertical: 15, alignItems: 'center' },

  // Modals
  modalOverlay:    { flex: 1, backgroundColor: colors.overlay, justifyContent: IS_WEB ? 'center' : 'flex-end', alignItems: IS_WEB ? 'center' as any : 'stretch' as any },
  modalSheet:      { backgroundColor: colors.background, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: IS_WEB ? '80%' as any : '80%', paddingBottom: 40, width: IS_WEB ? 480 : '100%' as any, borderRadius: IS_WEB ? radius.xl : undefined, display: IS_WEB ? 'flex' as any : undefined, flexDirection: 'column', overflow: 'hidden' } as any,
  modalHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  modalBack:       { ...typography.bodySemibold, color: colors.accent, fontSize: 14 },
  modalTitle:      { ...typography.h3, color: colors.text1, fontSize: 16 },
  templateRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: spacing.screen, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: spacing.md },
  tIconBox:        { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  tLabel:          { ...typography.bodySemibold, color: colors.text1, fontSize: 14 },
  tDesc:           { ...typography.caption, color: colors.text3, fontSize: 12, marginTop: 1 },
  addedBadge:      { ...typography.caption, color: colors.success, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  fieldLabel:      { ...typography.captionBold, color: colors.text2, marginBottom: 6 },
  fieldInput:      { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text1 },
  saveBtn:         { borderRadius: radius.md, overflow: 'hidden', marginTop: 24 },
  saveBtnGrad:     { paddingVertical: 16, alignItems: 'center', borderRadius: radius.md },
});
