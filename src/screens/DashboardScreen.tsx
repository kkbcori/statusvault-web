// ═══════════════════════════════════════════════════════════════
// DashboardScreen v7 — Materio-inspired admin layout
// Stat cards · grid layout · #F4F5FA bg · Inter typography
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, UIManager, Modal, FlatList, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useStore, FREE_LIMIT } from '../store';
import { generateDeadlines, getMostCritical, calculateDaysRemaining, formatDate } from '../utils/dates';
import { TimelineItem } from '../components';
import { IS_WEB, IS_TABLET, useScreenSize } from '../utils/responsive';
import { useWindowDimensions } from 'react-native';
import { DOCUMENT_TEMPLATES } from '../utils/templates';
import { UserDocument } from '../types';
import { useDialog } from '../components/ConfirmDialog';
import { AppIcon } from '../utils/icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Materio Stat Card ────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: string; // Ionicons name
  iconBg: string;
  iconColor: string;
  trend?: { value: string; up: boolean };
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtitle, icon, iconBg, iconColor, trend, onPress }) => (
  <TouchableOpacity style={statStyles.card} onPress={onPress} activeOpacity={onPress ? 0.85 : 1}>
    {/* Top accent line — colored per card */}
    <View style={[statStyles.accentLine, { backgroundColor: iconColor }]} />
    <View style={statStyles.inner}>
      <View style={statStyles.left}>
        <Text style={statStyles.label}>{label}</Text>
        <Text style={statStyles.value}>{value}</Text>
        {trend ? (
          <View style={statStyles.trendRow}>
            <Ionicons name={trend.up ? 'trending-up' : 'trending-down'} size={13}
              color={trend.up ? '#059669' : '#DC2626'} />
            <Text style={[statStyles.trendText, { color: trend.up ? '#059669' : '#DC2626' }]}>
              {trend.value}
            </Text>
          </View>
        ) : (
          <Text style={statStyles.subtitleText}>{subtitle}</Text>
        )}
      </View>
      {/* Icon with gradient-style box */}
      <LinearGradient
        colors={[iconBg, iconBg + 'CC']}
        style={statStyles.iconBox}
      >
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </LinearGradient>
    </View>
  </TouchableOpacity>
);

const statStyles = StyleSheet.create({
  card:        { flex: IS_TABLET ? undefined : 1, width: IS_TABLET ? '48%' : undefined, minWidth: IS_WEB ? 180 : undefined, backgroundColor: '#FFFFFF', borderRadius: IS_TABLET ? 20 : 16, padding: IS_TABLET ? 22 : 20, overflow: 'hidden', ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)' } : shadows.md) } as any,
  accentLine:  { position: 'absolute' as any, top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  inner:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 4 },
  left:        { flex: 1, gap: 4 },
  label:       { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#94A3B8', letterSpacing: 0.4, textTransform: 'uppercase' as any },
  value:       { fontSize: 32, fontFamily: 'Inter_800ExtraBold', color: '#0F172A', letterSpacing: -1, lineHeight: 38 },
  trendRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  trendText:   { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  subtitleText:{ fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 2 },
  iconBox:     { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

// ─── Section Card ─────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[cardStyles.card, style]}>{children}</View>
);

const CardHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
  <View style={cardStyles.header}>
    <View>
      <Text style={cardStyles.title}>{title}</Text>
      {subtitle && <Text style={cardStyles.subtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

const cardStyles = StyleSheet.create({
  card:     { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.04)' } : shadows.md) } as any,
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  title:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 2 },
});

// ─── Badge / Chip ─────────────────────────────────────────────
const StatusBadge: React.FC<{ label: string; color: string; bg: string }> = ({ label, color, bg }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
    <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color }}>{label}</Text>
  </View>
);

// ═════════════════════════════════════════════════════════════
// Main Screen
// ═════════════════════════════════════════════════════════════
export const DashboardScreen: React.FC = () => {
  const navigation   = useNavigation<any>();
  const dialog       = useDialog();
  const { width: screenWidth } = useWindowDimensions();
  // On web, only suppress padding when sidebar is visible (wide screen)
  const hasSidebar = IS_WEB && screenWidth >= 768;
  const hPad = hasSidebar ? 0 : IS_TABLET ? 24 : 16;

  // Store
  const documents            = useStore((s) => s.documents);
  const isPremium            = useStore((s) => s.isPremium);
  const authUser             = useStore((s) => s.authUser);
  const isGuestMode          = useStore((s) => s.isGuestMode);
  const emailVerified        = useStore((s) => s.emailVerified);
  const anyModalOpen         = useStore((s) => s.anyModalOpen);
  const setAnyModalOpen      = useStore((s) => s.setAnyModalOpen);
  const familyMembers        = useStore((s) => s.familyMembers);
  const checklists           = useStore((s) => s.checklists);
  const counters             = useStore((s) => s.counters);
  const visaProfile          = useStore((s) => s.visaProfile);
  const setVisaProfile       = useStore((s) => s.setVisaProfile);
  const getRemainingFreeSlots= useStore((s) => s.getRemainingFreeSlots);
  const autoIncrementCounters= useStore((s) => s.autoIncrementCounters);

  React.useEffect(() => { autoIncrementCounters(); }, []);

  // Show auth prompt after 5s — but only when no other modal is open

  // Profile setup modal
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileStep,      setProfileStep]      = useState<'select' | 'docs'>('select');
  const [selectedVisa,     setSelectedVisa]     = useState('');
  const [selectedDocIds,   setSelectedDocIds]   = useState<string[]>([]);
  const [savingProfile,    setSavingProfile]    = useState(false);

  // Computed
  const deadlines    = generateDeadlines(documents);
  const mostCritical = getMostCritical(deadlines);
  const remaining    = getRemainingFreeSlots();
  const expiringSoon = deadlines.filter((d) => d.daysRemaining >= 0 && d.daysRemaining <= 90);
  const expired      = deadlines.filter((d) => d.daysRemaining < 0);

  // Track profile setup open/close in anyModalOpen
  React.useEffect(() => {
    if (showProfileSetup) setAnyModalOpen(true);
    else setAnyModalOpen(false);
  }, [showProfileSetup]);

  const VISA_PROFILES = [
    { id: 'f1-opt',     icon: 'visa_approved', label: 'F-1 Student / OPT',   docs: ['f1-visa','i20','sevis','passport','opt-ead'] },
    { id: 'f1-stem',    icon: 'application',   label: 'F-1 STEM OPT',        docs: ['f1-visa','i20','sevis','passport','stem-opt'] },
    { id: 'h1b',        icon: 'visa',          label: 'H-1B Worker',          docs: ['h1b-visa','h1b-approval','passport','i94'] },
    { id: 'h4',         icon: 'visa2',         label: 'H-4 Dependent',        docs: ['h4-visa','h4-ead','passport','i94'] },
    { id: 'green-card', icon: 'passport_card', label: 'Green Card Holder',    docs: ['green-card','passport','i94'] },
    { id: 'l1',         icon: 'travel_plane',  label: 'L-1 / L-2',            docs: ['l1-visa','l2-ead','passport','i94'] },
    { id: 'j1',         icon: 'biometrics',    label: 'J-1 Exchange Visitor', docs: ['j1-visa','ds2019','passport','i94'] },
    { id: 'b1b2',       icon: 'travel2',       label: 'B-1/B-2 Visitor',      docs: ['b1b2-visa','passport','i94'] },
  ];

  const handleVisaSelect = (profileId: string, docs: string[]) => {
    setSelectedVisa(profileId);
    setSelectedDocIds(docs);
    setProfileStep('docs');
  };

  const newDocCount = selectedDocIds.filter((id) => !documents.some((d) => d.templateId === id)).length;
  const slotsLeft   = Math.max(0, FREE_LIMIT - documents.length);
  const overLimit   = !isPremium && newDocCount > slotsLeft;

  const toggleDocId = (id: string) => {
    setSelectedDocIds((prev) => {
      if (prev.includes(id)) return prev.filter((d) => d !== id);
      const newCount = prev.filter((id2) => !documents.some((d) => d.templateId === id2)).length;
      if (!isPremium && newCount >= slotsLeft) return prev;
      return [...prev, id];
    });
  };

  const handleSaveProfile = async () => {
    if (!isPremium && newDocCount > slotsLeft) {
      setShowProfileSetup(false);
      setTimeout(() => dialog.confirm({
        title: 'Free Plan Limit',
        message: `Free plan allows ${FREE_LIMIT} documents. You have ${documents.length} tracked. Upgrade for unlimited.`,
        type: 'confirm', confirmLabel: 'Upgrade', cancelLabel: 'Go Back',
        onConfirm: () => navigation.navigate('Main', { screen: 'Documents', params: { openPaywall: true } }),
        onCancel:  () => setShowProfileSetup(true),
      }), 300);
      return;
    }
    setSavingProfile(true);
    try {
      const defaultExpiry = new Date();
      defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
      const expiry = defaultExpiry.toISOString().split('T')[0];
      for (const docId of selectedDocIds) {
        const template = DOCUMENT_TEMPLATES.find((t) => t.id === docId);
        if (!template) continue;
        if (useStore.getState().documents.some((d) => d.templateId === docId)) continue;
        const doc: UserDocument = {
          id: Date.now().toString() + Math.random().toString(36).slice(2),
          templateId: template.id, label: template.label, category: template.category,
          expiryDate: expiry, alertDays: template.alertDays, icon: template.icon,
          notes: '⚠️ Update with real expiry date', notificationIds: [],
          createdAt: new Date().toISOString(),
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

  const profileLabel = VISA_PROFILES.find((p) => p.id === visaProfile)?.label;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, hasSidebar && styles.contentWeb, !hasSidebar && styles.contentMobile]}
      showsVerticalScrollIndicator={true}
    >
      {/* ── Mobile header ── */}
      {!IS_WEB && (
        <LinearGradient colors={['#0A0E1A', '#1E1B4B', '#312E81']} style={styles.mobileHeader}>
          <Text style={styles.mobileTitle}>StatusVault</Text>
          <Text style={styles.mobileSub}>Your Status Dashboard</Text>
        </LinearGradient>
      )}

      {/* ── Email verified success banner ── */}
      {IS_WEB && authUser && emailVerified && (
        <View style={styles.verifiedBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#28C76F" />
          <Text style={styles.verifiedBannerText}>
            <Text style={{ fontFamily: 'Inter_700Bold' }}>Email verified!</Text> You're now signed in to StatusVault.
          </Text>
          <TouchableOpacity onPress={() => useStore.setState({ emailVerified: false })}>
            <Ionicons name="close" size={14} color="#28C76F" />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Guest banner — always visible when not signed in ── */}
      {IS_WEB && (!authUser || isGuestMode) && (
        <TouchableOpacity
          style={styles.guestBanner}
          onPress={() => useStore.getState().openAuthModal('Sign in to sync your data and receive expiry alerts')}
          activeOpacity={0.85}
        >
          <Ionicons name="person-circle-outline" size={16} color="#7367F0" />
          <Text style={styles.guestBannerText}>
            {isGuestMode ? <><Text style={{ fontFamily: 'Inter_700Bold' }}>Guest mode</Text> — 1 doc · 1 checklist · 1 timer · no family members</> : <><Text style={{ fontFamily: 'Inter_700Bold' }}>Viewing as guest</Text> — Sign in for 2 free documents + family member tracking</>}
          </Text>
          <TouchableOpacity style={styles.guestBannerBtn} onPress={() => useStore.getState().openAuthModal('Create a free account to unlock more features')}><Text style={styles.guestBannerBtnTxt}>{isGuestMode ? 'Upgrade →' : 'Sign In →'}</Text></TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* ── Profile chip — only when logged in and profile set ── */}
      {IS_WEB && authUser && !isGuestMode && visaProfile && (
        <View style={styles.topBanner}>
          <View style={styles.topBannerProfile}>
            <Ionicons name="shield-checkmark" size={16} color="#059669" />
            <Text style={styles.topBannerProfileLabel}>{profileLabel}</Text>
            <TouchableOpacity
              onPress={() => { setProfileStep('select'); setShowProfileSetup(true); }}
              style={styles.topBannerEditBtn}
            >
              <Ionicons name="create-outline" size={13} color="#64748B" />
              <Text style={styles.topBannerEditText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ═══ STAT CARDS ═══ */}
      <View style={[styles.statRow, {
        flexDirection: (hasSidebar || IS_TABLET) ? 'row' as any : 'column',
        flexWrap: IS_TABLET ? 'wrap' as any : undefined,
        gap: IS_TABLET ? 12 : 16,
        marginHorizontal: hasSidebar ? 0 : IS_TABLET ? 24 : 16,
        marginTop: hasSidebar ? 0 : 16,
      }]}>
        <StatCard
          label="Documents Tracked"
          value={documents.length}
          subtitle={`of ${isPremium ? '∞' : FREE_LIMIT} total`}
          icon="document-text"
          iconBg="#EEF2FF"
          iconColor="#4F46E5"
          onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
        />
        <StatCard
          label="Next Expiry"
          value={mostCritical ? `${Math.abs(mostCritical.daysRemaining)}d` : '—'}
          subtitle={mostCritical
            ? (mostCritical.daysRemaining < 0 ? 'EXPIRED' : mostCritical.label)
            : 'All documents safe'}
          icon="time-outline"
          iconBg={mostCritical && mostCritical.daysRemaining <= 30 ? '#FEF2F2' : '#ECFDF5'}
          iconColor={mostCritical && mostCritical.daysRemaining <= 30 ? '#DC2626' : '#059669'}
          trend={mostCritical && mostCritical.daysRemaining < 0
            ? { value: 'Action needed', up: false }
            : undefined}
          onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
        />
        <StatCard
          label="Expiring Soon"
          value={expiringSoon.length}
          subtitle={expiringSoon.length > 0 ? 'within 90 days' : 'None in 90 days'}
          icon="alert-circle-outline"
          iconBg={expiringSoon.length > 0 ? '#FFFBEB' : '#ECFDF5'}
          iconColor={expiringSoon.length > 0 ? '#D97706' : '#059669'}
          onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
        />
        <StatCard
          label="Family Members"
          value={familyMembers.length}
          subtitle={familyMembers.length > 0 ? 'being tracked' : 'Add family members'}
          icon="people-outline"
          iconBg="#E0FAFD"
          iconColor="#00CFE8"
          onPress={() => navigation.navigate('Main', { screen: 'Family' })}
        />
      </View>



      {/* ═══ 4-CARD GRID ═══ */}
      <View style={[styles.cardGrid, IS_WEB && styles.cardGridWeb]}>

        {/* Card 1: Document Status */}
        <Card style={styles.gridCard}>
          <CardHeader
            title="Document Status"
            subtitle="Urgency breakdown"
            right={<StatusBadge label={`${documents.length} total`} color="#7367F0" bg="#F0EEFF" />}
          />
          {[
            { label: '🔴 Expired',     count: expired.length,                                                                   color: '#EA5455', bg: '#FFEEEE' },
            { label: 'Critical (<30d)',  count: deadlines.filter((d) => d.daysRemaining >= 0 && d.daysRemaining < 30).length,   color: '#EA5455', bg: '#FFEEEE' },
            { label: 'High (30–60d)',    count: deadlines.filter((d) => d.daysRemaining >= 30 && d.daysRemaining < 60).length,  color: '#FF9F43', bg: '#FFF4E6' },
            { label: 'Medium (60–180d)', count: deadlines.filter((d) => d.daysRemaining >= 60 && d.daysRemaining < 180).length, color: '#7367F0', bg: '#F0EEFF' },
            { label: 'Low (>180d)',      count: deadlines.filter((d) => d.daysRemaining >= 180).length,                          color: '#28C76F', bg: '#EAFFF4' },
          ].map((row) => (
            <View key={row.label} style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: row.color }]} />
              <Text style={styles.statusLabel}>{row.label}</Text>
              <View style={styles.statusBar}>
                <View style={[styles.statusBarFill, {
                  width: deadlines.length > 0 ? `${(row.count / deadlines.length) * 100}%` as any : '0%',
                  backgroundColor: row.color,
                }]} />
              </View>
              <View style={[styles.statusCount, { backgroundColor: row.bg }]}>
                <Text style={[styles.statusCountText, { color: row.color }]}>{row.count}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.cardFooterBtn} onPress={() => navigation.navigate('Main', { screen: 'Documents' })}>
            <Text style={styles.cardFooterText}>View Documents</Text>
            <Ionicons name="arrow-forward" size={13} color="#7367F0" />
          </TouchableOpacity>
        </Card>

        {/* Card 2: Upcoming Deadlines */}
        <Card style={styles.gridCard}>
          <CardHeader
            title="Upcoming Deadlines"
            subtitle={deadlines.length > 0 ? `${deadlines.length} doc${deadlines.length !== 1 ? 's' : ''} tracked` : 'No documents yet'}
            right={
              <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Main', { screen: 'Documents' })}>
                <Text style={styles.viewAllText}>All</Text>
                <Ionicons name="arrow-forward" size={12} color="#7367F0" />
              </TouchableOpacity>
            }
          />
          {deadlines.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={32} color="#ACAEC5" />
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Main', { screen: 'Documents' })}>
                <Text style={styles.emptyBtnText}>Add Document</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.deadlineList}>
              {deadlines.slice(0, 5).map((dl) => {
                const isExpired  = dl.daysRemaining < 0;
                const isCritical = !isExpired && dl.daysRemaining < 30;
                const isHigh     = !isExpired && dl.daysRemaining >= 30 && dl.daysRemaining < 60;
                const isMedium   = !isExpired && dl.daysRemaining >= 60 && dl.daysRemaining < 180;
                const badgeColor = isExpired ? '#EA5455' : isCritical ? '#EA5455' : isHigh ? '#FF9F43' : isMedium ? '#7367F0' : '#28C76F';
                const badgeBg    = isExpired ? '#FFEEEE' : isCritical ? '#FFEEEE' : isHigh ? '#FFF4E6' : isMedium ? '#F0EEFF' : '#EAFFF4';
                const severity   = isExpired ? 'Expired' : isCritical ? 'Critical' : isHigh ? 'High' : isMedium ? 'Medium' : 'Low';
                const badgeLabel = `${severity}${!isExpired ? ` · ${dl.daysRemaining}d` : ''}`;
                return (
                  <View key={dl.documentId} style={styles.deadlineRow}>
                    <View style={[styles.deadlineStrip, { backgroundColor: badgeColor }]} />
                    <Text style={styles.deadlineIcon}>{dl.icon}</Text>
                    <View style={styles.deadlineInfo}>
                      <Text style={styles.deadlineName} numberOfLines={1}>{dl.label}</Text>
                      <Text style={styles.deadlineDate}>{formatDate(dl.expiryDate)}</Text>
                    </View>
                    <StatusBadge label={badgeLabel} color={badgeColor} bg={badgeBg} />
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* Card 3: Immi Checklist */}
        <Card style={styles.gridCard}>
          <CardHeader
            title="Immi Checklist"
            subtitle={checklists.length > 0 ? `${checklists.length} active checklist${checklists.length !== 1 ? 's' : ''}` : 'Track your immigration steps'}
          />
          {checklists.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkbox-outline" size={32} color="#ACAEC5" />
              <Text style={styles.emptyTitle}>No checklists yet</Text>
              <Text style={styles.emptyDesc}>Add checklists to track OPT, H-1B, and green card steps</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Main', { screen: 'Checklist' })}>
                <Text style={styles.emptyBtnText}>Browse Checklists</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.checklistList}>
              {checklists.slice(0, 3).map((cl) => {
                const done  = cl.items.filter((it) => it.done).length;
                const total = cl.items.length;
                const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <View key={cl.templateId} style={styles.checklistRow}>
                    <Text style={styles.checklistIcon}>{cl.icon}</Text>
                    <View style={styles.checklistInfo}>
                      <Text style={styles.checklistLabel} numberOfLines={1}>{cl.label}</Text>
                      <View style={styles.checklistProgressWrap}>
                        <View style={styles.checklistProgressBar}>
                          <View style={[styles.checklistProgressFill, { width: `${pct}%` as any, backgroundColor: pct === 100 ? '#28C76F' : '#7367F0' }]} />
                        </View>
                        <Text style={styles.checklistPct}>{done}/{total}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
              {checklists.length > 3 && (
                <Text style={styles.moreText}>+{checklists.length - 3} more checklists</Text>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.cardFooterBtn} onPress={() => navigation.navigate('Main', { screen: 'Checklist' })}>
            <Text style={styles.cardFooterText}>Manage Checklists</Text>
            <Ionicons name="arrow-forward" size={13} color="#7367F0" />
          </TouchableOpacity>
        </Card>

        {/* Card 4: Immi Timers */}
        <Card style={styles.gridCard}>
          <CardHeader
            title="Immi Timers"
            subtitle={counters.length > 0 ? `${counters.length} timer${counters.length !== 1 ? 's' : ''} active` : 'Track unemployment & stay days'}
          />
          {counters.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="timer-outline" size={32} color="#ACAEC5" />
              <Text style={styles.emptyTitle}>No timers yet</Text>
              <Text style={styles.emptyDesc}>Track OPT unemployment days, 60-day grace period, and more</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Main', { screen: 'Timers' })}>
                <Text style={styles.emptyBtnText}>Add Timer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timerList}>
              {counters.slice(0, 3).map((ct) => {
                const pct = Math.min(100, Math.round((ct.daysUsed / ct.maxDays) * 100));
                const isCrit = ct.daysUsed >= ct.critAt;
                const isWarn = !isCrit && ct.daysUsed >= ct.warnAt;
                const barColor = isCrit ? '#EA5455' : isWarn ? '#FF9F43' : '#7367F0';
                return (
                  <View key={ct.templateId} style={styles.timerRow}>
                    <Text style={styles.timerIcon}>{ct.icon}</Text>
                    <View style={styles.timerInfo}>
                      <View style={styles.timerTopRow}>
                        <Text style={styles.timerLabel} numberOfLines={1}>{ct.label}</Text>
                        <Text style={[styles.timerCount, { color: barColor }]}>{ct.daysUsed}/{ct.maxDays}d</Text>
                      </View>
                      <View style={styles.timerBarWrap}>
                        <View style={[styles.timerBarFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
              {counters.length > 3 && (
                <Text style={styles.moreText}>+{counters.length - 3} more timers</Text>
              )}
            </View>
          )}
          <TouchableOpacity style={styles.cardFooterBtn} onPress={() => navigation.navigate('Main', { screen: 'Timers' })}>
            <Text style={styles.cardFooterText}>Manage Timers</Text>
            <Ionicons name="arrow-forward" size={13} color="#7367F0" />
          </TouchableOpacity>
        </Card>

      </View>

      {/* ═══ PROFILE SETUP MODAL ═══ */}
      <Modal visible={showProfileSetup} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalTopBar}>
              <TouchableOpacity onPress={() => profileStep === 'docs' ? setProfileStep('select') : setShowProfileSetup(false)}>
                <Text style={styles.modalBack}>{profileStep === 'docs' ? '← Back' : 'Cancel'}</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {profileStep === 'select' ? 'Select Visa Status' : 'Confirm Documents'}
              </Text>
              <View style={{ width: 60 }} />
            </View>

            {profileStep === 'select' ? (
              <FlatList
                style={{ flex: 1 }}
                data={VISA_PROFILES}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={true}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.visaRow, selectedVisa === item.id && styles.visaRowActive]}
                    onPress={() => handleVisaSelect(item.id, item.docs)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.visaIconBox, selectedVisa === item.id && { backgroundColor: '#F0EEFF' }]}>
                      <AppIcon name={item.icon as any} size={28} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.visaLabel}>{item.label}</Text>
                      <Text style={styles.visaCount}>{item.docs.length} standard documents</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#ACAEC5" />
                  </TouchableOpacity>
                )}
              />
            ) : (
              <FlatList
                style={{ flex: 1 }}
                data={[...DOCUMENT_TEMPLATES.filter((t) => selectedDocIds.includes(t.id)), { id: '__add__', label: '+ Add custom document', icon: '➕', category: 'other', alertDays: [], description: '' } as any]}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={true}
                ListHeaderComponent={
                  <View style={styles.docHint}>
                    <Ionicons name="information-circle-outline" size={14} color="#FF9F43" />
                    <Text style={styles.docHintText}>
                      Added with 1-year placeholder date. Update each with your real expiry date.
                      {!isPremium && `\nFree plan: ${slotsLeft} slot${slotsLeft !== 1 ? 's' : ''} remaining.`}
                    </Text>
                  </View>
                }
                ListFooterComponent={
                  <View style={{ padding: 16 }}>
                    {overLimit && (
                      <TouchableOpacity
                        style={styles.upgradeDocBtn}
                        onPress={() => { setShowProfileSetup(false); navigation.navigate('Main', { screen: 'Documents', params: { openPaywall: true } }); }}
                      >
                        <Text style={styles.upgradeDocBtnText}>⭐ Upgrade for unlimited documents</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.saveDocBtn, (savingProfile || overLimit) && { opacity: 0.5 }]}
                      onPress={handleSaveProfile}
                      disabled={savingProfile || overLimit}
                    >
                      <Text style={styles.saveDocBtnText}>
                        {savingProfile ? 'Setting up...' : `Save ${selectedDocIds.length} Document${selectedDocIds.length !== 1 ? 's' : ''}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                }
                renderItem={({ item }) => {
                  if (item.id === '__add__') return (
                    <TouchableOpacity style={styles.addDocRow} onPress={() => { setShowProfileSetup(false); navigation.navigate('Main', { screen: 'Documents' }); }}>
                      <Text style={styles.addDocText}>+ Add more documents manually</Text>
                    </TouchableOpacity>
                  );
                  const isSelected = selectedDocIds.includes(item.id);
                  const alreadyAdded = documents.some((d) => d.templateId === item.id);
                  const wouldExceed = !isPremium && !isSelected && !alreadyAdded && newDocCount >= slotsLeft;
                  return (
                    <TouchableOpacity
                      style={[styles.docRow, !isSelected && { opacity: 0.4 }, wouldExceed && { opacity: 0.25 }]}
                      onPress={() => !wouldExceed && toggleDocId(item.id)}
                      activeOpacity={wouldExceed ? 1 : 0.75}
                    >
                      <View style={[styles.docCheck, isSelected && styles.docCheckActive]}>
                        {isSelected && <Ionicons name="checkmark" size={12} color="#fff" />}
                      </View>
                      <Text style={{ fontSize: 20, marginRight: 10 }}>{item.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.docLabel}>{item.label}</Text>
                        <Text style={styles.docSub}>{alreadyAdded ? '✓ Already tracked' : `Alerts: ${item.alertDays?.map((d: number) => d + 'd').join(', ')}`}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>



      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F0F4FF' },
  content:       { paddingBottom: 32 },
  contentWeb:    { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  contentMobile: { paddingHorizontal: 16, paddingBottom: 100 },

  // Mobile header
  mobileHeader:  { padding: 24, paddingTop: 48 },
  mobileTitle:   { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#fff' },
  mobileSub:     { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  verifiedBanner:      { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EAFFF4', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12, borderWidth: 1, borderColor: '#A3F0C4' },
  verifiedBannerText:  { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#065F46' },
  guestBanner:         { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EEF2FF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, borderWidth: 1, borderColor: '#C7D2FE' },
  guestBannerText:     { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#3730A3', lineHeight: 17 },
  guestBannerBtn:      { backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  guestBannerBtnTxt:   { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  // Top banner (replaces page header)
  topBanner:           { marginBottom: 16 },
  topBannerSetup:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, borderLeftColor: '#4F46E5', ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(15,23,42,0.05)' } : {}) } as any,
  topBannerIcon:       { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  topBannerTitle:      { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  topBannerSub:        { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 1 },
  topBannerBtn:        { backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  topBannerBtnText:    { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  topBannerProfile:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0', borderLeftWidth: 4, borderLeftColor: '#059669', ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(15,23,42,0.05)' } : {}) } as any,
  topBannerProfileLabel:{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2F3349', flex: 1 },
  topBannerEditBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#F4F5FA' },
  topBannerEditText:   { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#8588A5' },

  // Stat cards
  statRow:       { flexDirection: 'column' as any, gap: 16, marginBottom: 20, marginTop: 16 },

  // Free strip
  freeStrip:     { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11, marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0', ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(15,23,42,0.04)' } : {}) } as any,
  freeStripDots: { flexDirection: 'row', gap: 4 },
  freeStripDot:  { width: 10, height: 10, borderRadius: 5 },
  freeStripText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', color: '#334155' },
  freeStripBadge:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  freeStripBadgeText:{ fontSize: 11, fontFamily: 'Inter_700Bold' },

  // Grid layout
  grid:          { gap: 16 },
  gridWeb:       { flexDirection: 'row' as any, alignItems: 'flex-start' as any },
  col:           { gap: 16 },
  colLeft:       { flex: 2 as any, minWidth: 0 as any },
  colRight:      { flex: 1 as any, minWidth: 240 as any },

  // View all button
  viewAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#4F46E5' },

  // Empty state
  emptyState:    { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4, borderWidth: 1, borderColor: '#C7D2FE' },
  emptyTitle:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  emptyDesc:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748B', textAlign: 'center', maxWidth: 280, lineHeight: 20 },
  emptyBtn:      { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  emptyBtnText:  { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  // Deadline list
  deadlineList:  { gap: 0 },
  deadlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  deadlineStrip: { width: 3, height: 36, borderRadius: 2 },
  deadlineIcon:  { fontSize: 20 },
  deadlineInfo:  { flex: 1 },
  deadlineName:  { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#2F3349' },
  deadlineDate:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#8588A5', marginTop: 2 },

  // Profile setup card
  profileSetupBody:   { alignItems: 'center', gap: 12, paddingBottom: 4 },
  profileSetupIconWrap:{ width: 64, height: 64, borderRadius: 18, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', alignItems: 'center', justifyContent: 'center' },
  profileSetupDesc:   { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#8588A5', textAlign: 'center', lineHeight: 20, maxWidth: 240 },
  profileSetupBtn:    { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12, width: '100%' as any },
  profileSetupBtnText:{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff', textAlign: 'center' },

  // Profile edit row
  profileEditRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F4F5FA', borderRadius: 10, padding: 14 },
  profileEditIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center' },
  profileEditLabel:{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#2F3349' },
  profileEditSub:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#8588A5', marginTop: 2 },

  // Status breakdown
  statusRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  statusDot:      { width: 8, height: 8, borderRadius: 4 },
  statusLabel:    { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#4B4C6A', width: 110 },
  statusBar:      { flex: 1, height: 6, backgroundColor: '#F4F5FA', borderRadius: 3, overflow: 'hidden' },
  statusBarFill:  { height: '100%', borderRadius: 3 },
  statusCount:    { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusCountText:{ fontSize: 11, fontFamily: 'Inter_700Bold' },

  // 4-card grid
  cardGrid:            { gap: 16 },
  cardGridWeb:         { flexDirection: 'row' as any, flexWrap: 'wrap' as any, alignItems: 'flex-start' as any },
  gridCard:            { flex: IS_WEB ? '0 0 calc(50% - 8px)' as any : 1, minWidth: IS_WEB ? 280 : undefined } as any,
  cardFooterBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F4F5FA' },
  cardFooterText:      { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#7367F0', flex: 1 },

  // Checklist
  checklistList:       { gap: 12 },
  checklistRow:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checklistIcon:       { fontSize: 20 },
  checklistInfo:       { flex: 1 },
  checklistLabel:      { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#2F3349', marginBottom: 5 },
  checklistProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checklistProgressBar:{ flex: 1, height: 5, backgroundColor: '#F4F5FA', borderRadius: 3, overflow: 'hidden' },
  checklistProgressFill:{ height: '100%', borderRadius: 3 },
  checklistPct:        { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#8588A5', width: 32, textAlign: 'right' },

  // Timer
  timerList:           { gap: 12 },
  timerRow:            { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timerIcon:           { fontSize: 20 },
  timerInfo:           { flex: 1 },
  timerTopRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  timerLabel:          { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#2F3349', flex: 1 },
  timerCount:          { fontSize: 12, fontFamily: 'Inter_700Bold' },
  timerBarWrap:        { height: 5, backgroundColor: '#F4F5FA', borderRadius: 3, overflow: 'hidden' },
  timerBarFill:        { height: '100%', borderRadius: 3 },
  moreText:            { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#8588A5', marginTop: 4, textAlign: 'center' },

  // Modal
  overlay:        { flex: 1, backgroundColor: 'rgba(47,51,73,0.60)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal:          { backgroundColor: '#FFFFFF', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '85%' as any, overflow: 'hidden', ...(Platform.OS === 'web' ? { boxShadow: '0 16px 40px rgba(47,43,61,0.20)' } : {}) } as any,
  modalTopBar:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalBack:      { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#7367F0' },
  modalTitle:     { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#2F3349' },

  // Visa select list
  visaRow:        { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  visaRowActive:  { backgroundColor: '#FAFAFE' },
  visaIconBox:    { width: 44, height: 44, borderRadius: 10, backgroundColor: '#F4F5FA', alignItems: 'center', justifyContent: 'center' },
  visaLabel:      { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#2F3349' },
  visaCount:      { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#8588A5', marginTop: 2 },

  // Doc confirm list
  docHint:        { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#FFF4E6', margin: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#FFD59E' },
  docHintText:    { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#92400E', lineHeight: 18 },
  docRow:         { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  docCheck:       { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#DBDADE', alignItems: 'center', justifyContent: 'center' },
  docCheckActive: { backgroundColor: '#7367F0', borderColor: '#7367F0' },
  docLabel:       { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#2F3349' },
  docSub:         { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#8588A5', marginTop: 2 },
  addDocRow:      { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F4F5FA' },
  addDocText:     { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#7367F0' },
  upgradeDocBtn:  { backgroundColor: '#FFF4E6', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#FFD59E' },
  upgradeDocBtnText:{ fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#CC7A28' },
  saveDocBtn:     { backgroundColor: '#7367F0', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveDocBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Auth card
  authCard:       { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, width: '100%', maxWidth: 380, alignItems: 'center', position: 'relative', ...(Platform.OS === 'web' ? { boxShadow: '0 16px 40px rgba(47,43,61,0.20)' } : {}) } as any,
  authClose:      { position: 'absolute', top: 16, right: 16 },
  authIconWrap:   { width: 72, height: 72, borderRadius: 20, backgroundColor: '#F0EEFF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  authTitle:      { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#2F3349', marginBottom: 8 },
  authDesc:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#8588A5', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  authBtn:        { backgroundColor: '#7367F0', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 12, width: '100%' as any, alignItems: 'center' },
  authBtnText:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  authSkip:       { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#8588A5' },
});
