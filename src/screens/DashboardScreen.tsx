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
      <View style={shStyles.iconBox}>
        <Ionicons name={iconName} size={15} color={colors.accent} />
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
  title:   { ...typography.h2, color: colors.text1, fontSize: IS_WEB ? 17 : 16 },
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
    backgroundColor: colors.card,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
    ...shadows.md,
  },
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
  const navigation            = useNavigation<any>();
  const isWide                = useIsWide();

  const [showAddChecklist,  setShowAddChecklist]  = useState(false);
  const [showAddCounter,    setShowAddCounter]    = useState(false);
  const [showCustomCounter, setShowCustomCounter] = useState(false);
  const [customCounterName, setCustomCounterName] = useState('');
  const [customCounterDays, setCustomCounterDays] = useState('');
  const [customItemText,    setCustomItemText]    = useState('');
  const [customItemTarget,  setCustomItemTarget]  = useState<string | null>(null);

  React.useEffect(() => { autoIncrementCounters(); }, []);

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
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${label}"?`)) removeChecklist(tid);
      return;
    }
    Alert.alert('Remove Checklist', `Remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeChecklist(tid) },
    ]);
  };
  const handleRemoveCounter = (tid: string, label: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${label}"? Count will be lost.`)) removeCounter(tid);
      return;
    }
    Alert.alert('Remove Counter', `Remove "${label}"? Count will be lost.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeCounter(tid) },
    ]);
  };
  const handleAddCustomCounter = () => {
    const name = customCounterName.trim();
    const days = parseInt(customCounterDays, 10);
    if (!name) { Alert.alert('Name required'); return; }
    if (!days || days < 1 || days > 9999) { Alert.alert('Enter valid max days'); return; }
    addCustomCounter(name, days);
    setCustomCounterName(''); setCustomCounterDays('');
    setShowCustomCounter(false); setShowAddCounter(false);
  };
  const getCounterColor = (c: { daysUsed: number; warnAt: number; critAt: number }) =>
    c.daysUsed >= c.critAt ? colors.danger : c.daysUsed >= c.warnAt ? colors.warning : colors.success;

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

      {/* ─── Web page title ──────────────────────────────────── */}
      {IS_WEB && (
        <View style={styles.webPageTitle}>
          <Text style={styles.webPageTitleText}>Dashboard</Text>
          <Text style={styles.webPageSubtitle}>Your immigration status at a glance</Text>
        </View>
      )}

      <StatusCard deadline={mostCritical} totalDocs={documents.length} />
      <SeveritySummary deadlines={deadlines} />

      {/* Free tier bar */}
      {!isPremium && (
        <TouchableOpacity
          onPress={() => remaining > 0
            ? navigation.navigate('Documents')
            : navigation.navigate('Documents', { openPaywall: true })}
          activeOpacity={0.7}
        >
          <View style={[styles.freeBar, IS_WEB && styles.freeBarWeb]}>
            <View style={styles.freeBarInner}>
              <Ionicons name="document-text-outline" size={16} color={colors.text3} />
              <Text style={styles.freeText}>
                {remaining > 0
                  ? `${remaining} free slot${remaining !== 1 ? 's' : ''} left · Tap to add`
                  : 'Free limit reached · Tap to upgrade'}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.text3} />
            </View>
            <ProgressBar
              value={documents.length} max={FREE_LIMIT}
              color={remaining > 1 ? colors.accent : remaining > 0 ? colors.warning : colors.danger}
              height={3}
            />
          </View>
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
                      <TouchableOpacity onPress={() => Alert.alert('Reset?', `Reset "${c.label}" to 0?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Reset', style: 'destructive', onPress: () => resetCounter(c.templateId) },
                      ])}>
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
              <FlatList
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
            <FlatList
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
  contentWeb:      { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 40 },

  // Web page title
  webPageTitle:    { marginBottom: spacing.xl },
  webPageTitleText:{ fontSize: 28, fontFamily: 'Inter_900Black', color: colors.text1, letterSpacing: -0.5 },
  webPageSubtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.text3, marginTop: 4 },

  // Web 2-column grid
  webGrid:         { flexDirection: 'row' as any, flexWrap: 'wrap' as any, gap: spacing.xl, marginTop: spacing.md },

  // Mobile header
  headerGradient:  { paddingBottom: 8 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.screen, paddingTop: spacing.xxl + 20, paddingBottom: spacing.md },
  greeting:        { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: 3, fontSize: 10 },
  title:           { ...typography.h1, color: colors.text1, fontSize: 22 },
  privacyBadge:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,153,168,0.08)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,153,168,0.15)' },
  privacyText:     { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.accent, letterSpacing: 0.3 },
  privacySubtext:  { fontSize: 10, fontFamily: 'Inter_500Medium', color: 'rgba(201,163,81,0.6)', marginTop: 1 },

  // Free bar
  freeBar:         { marginHorizontal: spacing.screen, marginTop: spacing.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  freeBarWeb:      { marginHorizontal: 0, borderRadius: radius.xl, marginBottom: spacing.xl },
  freeBarInner:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freeText:        { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.text2, flex: 1 },

  // Sections
  section:         { marginTop: spacing.xxl, paddingHorizontal: spacing.screen },
  sectionWeb:      { marginTop: 0, paddingHorizontal: 0, flex: 1 as any, minWidth: 300 as any },
  seeAll:          { ...typography.captionBold, color: colors.accent },
  addBtnPill:      { backgroundColor: colors.accentDim, paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderGold },
  addBtnText:      { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.accent },

  // Empty state
  emptyCard:       { backgroundColor: IS_WEB ? 'transparent' : colors.card, borderRadius: radius.xl, padding: spacing.xxxl, alignItems: 'center', borderWidth: IS_WEB ? 0 : 1, borderColor: colors.borderLight },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderGold },
  emptyTitle:      { ...typography.bodySemibold, color: colors.text2 },
  emptySubtitle:   { ...typography.caption, color: colors.text3, textAlign: 'center', marginTop: 4, maxWidth: 260 },

  // Counter
  counterCard:     { backgroundColor: colors.card, borderRadius: radius.xl, marginBottom: spacing.md, overflow: 'hidden', flexDirection: 'row', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
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
  checklistCard:   { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
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

  // Modals
  modalOverlay:    { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalSheet:      { backgroundColor: colors.background, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, maxHeight: '80%', paddingBottom: 40 },
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
