// ═══════════════════════════════════════════════════════════════
// DashboardScreen v8 — Midnight Glass
// Dark glassmorphic cards · gold/green/red urgency · brand blue accents
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Platform, UIManager, Modal, FlatList, Animated, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { useStore, FREE_LIMIT } from '../store';
import { generateDeadlines, getMostCritical, formatDate, addDaysToDate, today } from '../utils/dates';
import { IS_WEB, IS_TABLET } from '../utils/responsive';
import { useWindowDimensions } from 'react-native';
import { DOCUMENT_TEMPLATES } from '../utils/templates';
import { UserDocument } from '../types';
import { useDialog } from '../components/ConfirmDialog';
import { AnimatedEmptyIcon } from '../components/AnimatedEmptyIcon';
import { useEntrance, usePressScale } from '../hooks/useAnimations';

// Fixed card height — all tall dashboard cards share this
const CARD_H = IS_WEB ? 360 : 320;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ═══ helpers ═══════════════════════════════════════════════════

const glassWeb = (blur = 18) => Platform.OS === 'web' ? ({
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
} as any) : {};

// ─── Stat Card ───────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: string;
  accent: string;       // accent color hex
  trend?: { value: string; up: boolean };
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, subtitle, icon, accent, trend, onPress }) => {
  const press = usePressScale(0.97);
  return (
    <Animated.View style={{ transform: [{ scale: press.scale }], flex: IS_TABLET ? undefined : 1, width: IS_TABLET ? '48%' : undefined }}>
      <TouchableOpacity
        style={statStyles.card}
        onPress={onPress}
        activeOpacity={onPress ? 0.85 : 1}
        onPressIn={onPress ? press.onPressIn : undefined}
        onPressOut={onPress ? press.onPressOut : undefined}
      >
        {/* Accent top line */}
        <View style={[statStyles.accentLine, { backgroundColor: accent }]} />
        <View style={statStyles.inner}>
          <View style={statStyles.left}>
            <Text style={statStyles.label}>{label}</Text>
            <Text style={statStyles.value}>{value}</Text>
            {trend ? (
              <View style={statStyles.trendRow}>
                <Ionicons name={trend.up ? 'trending-up' : 'trending-down'} size={13} color={trend.up ? colors.success : colors.danger} />
                <Text style={[statStyles.trendText, { color: trend.up ? colors.success : colors.danger }]}>
                  {trend.value}
                </Text>
              </View>
            ) : (
              <Text style={statStyles.subtitleText}>{subtitle}</Text>
            )}
          </View>
          <View style={[statStyles.iconBox, { backgroundColor: accent + '18', borderColor: accent + '30' }]}>
            <Ionicons name={icon as any} size={20} color={accent} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const statStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: IS_TABLET ? 20 : 18,
    overflow: 'hidden',
    minWidth: IS_WEB ? 180 : undefined,
    ...glassWeb(18),
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 4px 16px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)' } as any) : {}),
  } as any,
  accentLine:  { position: 'absolute' as any, top: 0, left: 0, right: 0, height: 2 } as any,
  inner:       { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 4 },
  left:        { flex: 1, gap: 4 },
  label:       { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(240,244,255,0.45)', letterSpacing: 1.2, textTransform: 'uppercase' as any } as any,
  value:       { fontSize: 30, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -1, lineHeight: 36 },
  trendRow:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  trendText:   { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  subtitleText:{ fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', marginTop: 2 },
  iconBox:     { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});

// ─── Section Card wrapper ────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => (
  <View style={[cardStyles.card, style]}>{children}</View>
);

const CardHeader: React.FC<{ title: string; subtitle?: string; right?: React.ReactNode }> = ({ title, subtitle, right }) => (
  <View style={cardStyles.header}>
    <View style={{ flex: 1 }}>
      <Text style={cardStyles.title}>{title}</Text>
      {subtitle && <Text style={cardStyles.subtitle}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'column',
    ...glassWeb(18),
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 4px 16px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)' } as any) : {}),
  } as any,
  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  title:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#F0F4FF', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.50)', marginTop: 2 },
});

// ─── Pill Badge ──────────────────────────────────────────────
const StatusBadge: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={{ backgroundColor: color + '22', borderWidth: 1, borderColor: color + '44', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 }}>
    <Text style={{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color, letterSpacing: 0.2 }}>{label}</Text>
  </View>
);

// Urgency helpers — map to theme colors
const urgencyColor = (daysRemaining: number): string => {
  if (daysRemaining < 0) return colors.danger;
  if (daysRemaining < 30) return colors.danger;
  if (daysRemaining < 60) return colors.warning;
  if (daysRemaining < 180) return colors.info;
  return colors.success;
};
const urgencyLabel = (daysRemaining: number): string => {
  if (daysRemaining < 0) return 'Expired';
  if (daysRemaining < 30) return 'Critical';
  if (daysRemaining < 60) return 'High';
  if (daysRemaining < 180) return 'Medium';
  return 'Low';
};

// ═════════════════════════════════════════════════════════════
// Main Screen
// ═════════════════════════════════════════════════════════════
export const DashboardScreen: React.FC = () => {
  const navigation   = useNavigation<any>();
  const dialog       = useDialog();
  const dismissEmailVerified = useStore((s) => s.dismissEmailVerified);
  const { width: screenWidth } = useWindowDimensions();
  const hasSidebar = IS_WEB && screenWidth >= 768;

  // Store
  const documents            = useStore((s) => s.documents);
  const isPremium            = useStore((s) => s.isPremium);
  const authUser             = useStore((s) => s.authUser);
  const isGuestMode          = useStore((s) => s.isGuestMode);
  const emailVerified        = useStore((s) => s.emailVerified);
  const setAnyModalOpen      = useStore((s) => s.setAnyModalOpen);
  const familyMembers        = useStore((s) => s.familyMembers);
  const checklists           = useStore((s) => s.checklists);
  const counters             = useStore((s) => s.counters);
  const visaProfile          = useStore((s) => s.visaProfile);
  const setVisaProfile       = useStore((s) => s.setVisaProfile);
  const getRemainingFreeSlots= useStore((s) => s.getRemainingFreeSlots);
  const autoIncrementCounters= useStore((s) => s.autoIncrementCounters);

  React.useEffect(() => { autoIncrementCounters(); }, []);

  // Entrance animations
  const stats1Anim = useEntrance(60);
  const stats2Anim = useEntrance(120);
  const stats3Anim = useEntrance(180);
  const stats4Anim = useEntrance(240);
  const grid1Anim  = useEntrance(80);
  const grid2Anim  = useEntrance(140);

  // Profile setup modal state
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileStep,      setProfileStep]      = useState<'select' | 'docs'>('select');
  const [selectedVisa,     setSelectedVisa]     = useState('');
  const [selectedDocIds,   setSelectedDocIds]   = useState<string[]>([]);
  const [savingProfile,    setSavingProfile]    = useState(false);

  const lastAutoBackupAt = useStore((s) => s.lastAutoBackupAt ?? null);

  const relativeTime = (iso: string | null) => {
    if (!iso) return null;
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 5)    return 'Just now';
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString();
  };

  // Computed
  const deadlines    = generateDeadlines(documents);
  const mostCritical = getMostCritical(deadlines);
  const expiringSoon = deadlines.filter((d) => d.daysRemaining >= 0 && d.daysRemaining <= 90);
  const expired      = deadlines.filter((d) => d.daysRemaining < 0);

  React.useEffect(() => {
    if (showProfileSetup) setAnyModalOpen(true);
    else setAnyModalOpen(false);
  }, [showProfileSetup]);

  const VISA_PROFILES: Array<{ id: string; icon: keyof typeof Ionicons.glyphMap; tint: string; label: string; docs: string[] }> = [
    { id: 'f1-opt',     icon: 'school',                tint: '#6FAFF2', label: 'F-1 Student / OPT',   docs: ['f1-visa','i20','sevis','passport','opt-ead'] },
    { id: 'f1-stem',    icon: 'flask',                 tint: '#4CD98A', label: 'F-1 STEM OPT',        docs: ['f1-visa','i20','sevis','passport','stem-opt'] },
    { id: 'h1b',        icon: 'briefcase',             tint: '#F5C053', label: 'H-1B Worker',          docs: ['h1b-visa','h1b-approval','passport','i94'] },
    { id: 'h4',         icon: 'people',                tint: '#a78bfa', label: 'H-4 Dependent',        docs: ['h4-visa','h4-ead','passport','i94'] },
    { id: 'green-card', icon: 'card',                  tint: '#4CD98A', label: 'Green Card Holder',    docs: ['green-card','passport','i94'] },
    { id: 'l1',         icon: 'business',              tint: '#5B9AF5', label: 'L-1 / L-2',            docs: ['l1-visa','l2-ead','passport','i94'] },
    { id: 'j1',         icon: 'globe',                 tint: '#FF6B6B', label: 'J-1 Exchange Visitor', docs: ['j1-visa','ds2019','passport','i94'] },
    { id: 'b1b2',       icon: 'airplane',              tint: '#6FAFF2', label: 'B-1/B-2 Visitor',      docs: ['b1b2-visa','passport','i94'] },
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
      const expiry = addDaysToDate(today(), 365);
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

  const renderDocItem = ({ item }: any) => {
    if (item.id === '__add__') return (
      <TouchableOpacity style={styles.addDocRow} onPress={() => { setShowProfileSetup(false); setAnyModalOpen(false); navigation.navigate('Main', { screen: 'Documents' }); }}>
        <Text style={styles.addDocText}>+ Add more documents manually</Text>
      </TouchableOpacity>
    );
    const isSelected   = selectedDocIds.includes(item.id);
    const alreadyAdded = documents.some((d: any) => d.templateId === item.id);
    const wouldExceed  = !isPremium && !isSelected && !alreadyAdded && newDocCount >= slotsLeft;
    return (
      <TouchableOpacity
        style={[styles.docRow, !isSelected && { opacity: 0.45 }, wouldExceed && { opacity: 0.25 }]}
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
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={[styles.content, hasSidebar && styles.contentWeb, !hasSidebar && styles.contentMobile]}
      showsVerticalScrollIndicator={true}
    >
      {/* ── Mobile glass hero header (no sidebar) ── */}
      {!hasSidebar && (
        <View style={styles.mobileHero}>
          <LinearGradient
            colors={['rgba(59,139,232,0.22)', 'rgba(76,217,138,0.10)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.mobileHeroGradient}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={styles.mobileHeroLogoWrap}>
                <Image source={require('../../assets/logo-transparent.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.mobileTitleStatus}>Status</Text>
                  <Text style={styles.mobileTitleVault}>Vault</Text>
                </View>
                <Text style={styles.mobileSub}>Immigration Tracker</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>DOCS</Text>
                <Text style={styles.miniStatValue}>{documents.length}</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={styles.miniStatLabel}>FAMILY</Text>
                <Text style={styles.miniStatValue}>{familyMembers.length}</Text>
              </View>
              <View style={styles.miniStat}>
                <Text style={[styles.miniStatLabel, expiringSoon.length > 0 && { color: colors.warning }]}>ALERTS</Text>
                <Text style={[styles.miniStatValue, expiringSoon.length > 0 && { color: colors.warning }]}>{expiringSoon.length}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* ── Email verified banner ── */}
      {authUser && emailVerified && (
        <View style={styles.verifiedBanner}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.verifiedBannerText}>
            <Text style={{ fontFamily: 'Inter_700Bold', color: colors.success }}>Email verified!</Text> You're now signed in to StatusVault.
          </Text>
          <TouchableOpacity onPress={dismissEmailVerified}>
            <Ionicons name="close" size={14} color={colors.success} />
          </TouchableOpacity>
        </View>
      )}

      {/* ── Guest banner ── */}
      {(!authUser || isGuestMode) && (
        <TouchableOpacity
          style={styles.guestBanner}
          onPress={() => useStore.getState().openAuthModal('Sign in to sync your data and receive expiry alerts')}
          activeOpacity={0.85}
        >
          <View style={styles.guestBannerIcon}>
            <Ionicons name="person-circle-outline" size={16} color={colors.primaryLight} />
          </View>
          <Text style={styles.guestBannerText}>
            {isGuestMode
              ? <><Text style={{ fontFamily: 'Inter_700Bold', color: colors.primaryLight }}>Guest mode</Text> — 1 doc · 1 checklist · 1 timer · no family</>
              : <><Text style={{ fontFamily: 'Inter_700Bold', color: colors.primaryLight }}>Viewing as guest</Text> — Sign in for 2 free docs + family tracking</>
            }
          </Text>
          <TouchableOpacity
            style={styles.guestBannerBtn}
            onPress={() => useStore.getState().openAuthModal('Create a free account to unlock more features')}
          >
            <Text style={styles.guestBannerBtnTxt}>{isGuestMode ? 'Upgrade →' : 'Sign In →'}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* ── Profile chip ── */}
      {authUser && !isGuestMode && visaProfile && (() => {
        const profile = VISA_PROFILES.find((p) => p.id === visaProfile);
        const profileIcon = profile?.icon;
        const profileTint = profile?.tint ?? colors.success;
        return (
          <View style={styles.topBanner}>
            <View style={styles.topBannerProfile}>
              <View style={[styles.topBannerProfileIcon, { backgroundColor: profileTint + '22', borderColor: profileTint + '40' }]}>
                <Ionicons name={profileIcon ?? 'shield-checkmark'} size={16} color={profileTint} />
              </View>
              <Text style={styles.topBannerProfileLabel}>{profileLabel}</Text>
              <TouchableOpacity
                onPress={() => { setProfileStep('select'); setShowProfileSetup(true); }}
                style={styles.topBannerEditBtn}
              >
                <Ionicons name="create-outline" size={12} color="rgba(240,244,255,0.60)" />
                <Text style={styles.topBannerEditText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })()}

      {hasSidebar ? (
        /* ── WEB: 2-column paired layout ── */
        <View style={{ flexDirection: 'row' as any, marginBottom: 16 }}>
          {/* LEFT COLUMN */}
          <View style={{ flex: 1, marginRight: 8, gap: 16 } as any}>
            <View style={{ flexDirection: 'row', gap: 16 } as any}>
              <Animated.View style={[stats1Anim, { flex: 1 }]}><StatCard
                label="Documents Tracked"
                value={documents.length}
                subtitle={`of ${isPremium ? '∞' : FREE_LIMIT} total`}
                icon="document-text"
                accent={colors.primary}
                onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
              /></Animated.View>
              <Animated.View style={[stats2Anim, { flex: 1 }]}><StatCard
                label="Next Expiry"
                value={mostCritical ? `${Math.abs(mostCritical.daysRemaining)}d` : '—'}
                subtitle={mostCritical ? (mostCritical.daysRemaining < 0 ? 'EXPIRED' : mostCritical.label) : 'All documents safe'}
                icon="time-outline"
                accent={mostCritical && mostCritical.daysRemaining <= 30 ? colors.danger : colors.success}
                trend={mostCritical && mostCritical.daysRemaining < 0 ? { value: 'Action needed', up: false } : undefined}
                onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
              /></Animated.View>
            </View>
            <Animated.View style={[grid1Anim, { flex: 1 }]}><Card style={[styles.gridCard, { height: CARD_H }]}>
              <CardHeader title="Document Status" subtitle="Urgency breakdown"
                right={<StatusBadge label={`${documents.length} total`} color={colors.primaryLight} />} />
              {[
                { label: 'Expired',          count: expired.length, color: colors.danger },
                { label: 'Critical (<30d)',  count: deadlines.filter((d) => d.daysRemaining >= 0 && d.daysRemaining < 30).length,   color: colors.danger },
                { label: 'High (30–60d)',    count: deadlines.filter((d) => d.daysRemaining >= 30 && d.daysRemaining < 60).length,  color: colors.warning },
                { label: 'Medium (60–180d)', count: deadlines.filter((d) => d.daysRemaining >= 60 && d.daysRemaining < 180).length, color: colors.info },
                { label: 'Low (>180d)',      count: deadlines.filter((d) => d.daysRemaining >= 180).length,                         color: colors.success },
              ].map((row) => (
                <View key={row.label} style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: row.color }]} />
                  <Text style={styles.statusLabel}>{row.label}</Text>
                  <View style={styles.statusBar}>
                    <View style={[styles.statusBarFill, { width: deadlines.length > 0 ? `${(row.count / deadlines.length) * 100}%` as any : '0%', backgroundColor: row.color }]} />
                  </View>
                  <View style={[styles.statusCount, { backgroundColor: row.color + '22', borderColor: row.color + '44' }]}>
                    <Text style={[styles.statusCountText, { color: row.color }]}>{row.count}</Text>
                  </View>
                </View>
              ))}
              <View style={{ flex: 1 }} />
              <TouchableOpacity style={styles.cardFooterBtn} onPress={() => navigation.navigate('Main', { screen: 'Documents' })}>
                <Text style={styles.cardFooterText}>View Documents</Text>
                <Ionicons name="arrow-forward" size={13} color={colors.primaryLight} />
              </TouchableOpacity>
            </Card></Animated.View>
          </View>

          {/* RIGHT COLUMN */}
          <View style={{ flex: 1, marginLeft: 8, gap: 16 } as any}>
            <View style={{ flexDirection: 'row', gap: 16 } as any}>
              <Animated.View style={[stats3Anim, { flex: 1 }]}><StatCard
                label="Expiring Soon"
                value={expiringSoon.length}
                subtitle={expiringSoon.length > 0 ? 'within 90 days' : 'None in 90 days'}
                icon="alert-circle-outline"
                accent={expiringSoon.length > 0 ? colors.warning : colors.success}
                onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
              /></Animated.View>
              <Animated.View style={[stats4Anim, { flex: 1 }]}><StatCard
                label="Family Members"
                value={familyMembers.length}
                subtitle={familyMembers.length > 0 ? 'being tracked' : 'Add family members'}
                icon="people-outline"
                accent={colors.info}
                onPress={() => navigation.navigate('Main', { screen: 'Family' })}
              /></Animated.View>
            </View>
            <Animated.View style={[grid2Anim, { flex: 1 }]}><Card style={[styles.gridCard, { height: CARD_H }]}>
              <CardHeader
                title="Upcoming Deadlines"
                subtitle={deadlines.length > 0 ? `${deadlines.length} doc${deadlines.length !== 1 ? 's' : ''} tracked` : 'No documents yet'}
                right={
                  <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Main', { screen: 'Documents' })}>
                    <Text style={styles.viewAllText}>All</Text>
                    <Ionicons name="arrow-forward" size={12} color={colors.primaryLight} />
                  </TouchableOpacity>
                }
              />
              {deadlines.length === 0 ? (
                <View style={styles.emptyState}>
                  <AnimatedEmptyIcon name="document-text-outline" size={32} color={colors.primaryLight} />
                  <Text style={styles.emptyTitle}>No documents yet</Text>
                  <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Main', { screen: 'Documents' })}>
                    <Text style={styles.emptyBtnText}>Add Document</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
                  <View style={styles.deadlineList}>
                    {deadlines.map((dl) => {
                      const color = urgencyColor(dl.daysRemaining);
                      const label = urgencyLabel(dl.daysRemaining);
                      const badgeLabel = `${label}${dl.daysRemaining >= 0 ? ` · ${dl.daysRemaining}d` : ''}`;
                      return (
                        <View key={dl.documentId} style={styles.deadlineRow}>
                          <View style={[styles.deadlineStrip, { backgroundColor: color }]} />
                          <Text style={styles.deadlineIcon}>{dl.icon}</Text>
                          <View style={styles.deadlineInfo}>
                            <Text style={styles.deadlineName} numberOfLines={1}>{dl.label}</Text>
                            <Text style={styles.deadlineDate}>{formatDate(dl.expiryDate)}</Text>
                          </View>
                          <StatusBadge label={badgeLabel} color={color} />
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </Card></Animated.View>
          </View>
        </View>
      ) : (
        /* ── MOBILE: stacked ── */
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12 } as any}>
            <Animated.View style={[stats1Anim, { flex: 1 }]}><StatCard
              label="Documents" value={documents.length}
              subtitle={`of ${isPremium ? '∞' : FREE_LIMIT}`}
              icon="document-text" accent={colors.primary}
              onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
            /></Animated.View>
            <Animated.View style={[stats2Anim, { flex: 1 }]}><StatCard
              label="Next Expiry"
              value={mostCritical ? `${Math.abs(mostCritical.daysRemaining)}d` : '—'}
              subtitle={mostCritical ? (mostCritical.daysRemaining < 0 ? 'EXPIRED' : mostCritical.label) : 'All safe'}
              icon="time-outline"
              accent={mostCritical && mostCritical.daysRemaining <= 30 ? colors.danger : colors.success}
              trend={mostCritical && mostCritical.daysRemaining < 0 ? { value: 'Action', up: false } : undefined}
              onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
            /></Animated.View>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 } as any}>
            <Animated.View style={[stats3Anim, { flex: 1 }]}><StatCard
              label="Expiring Soon" value={expiringSoon.length}
              subtitle={expiringSoon.length > 0 ? 'within 90d' : 'None in 90d'}
              icon="alert-circle-outline"
              accent={expiringSoon.length > 0 ? colors.warning : colors.success}
              onPress={() => navigation.navigate('Main', { screen: 'Documents' })}
            /></Animated.View>
            <Animated.View style={[stats4Anim, { flex: 1 }]}><StatCard
              label="Family" value={familyMembers.length}
              subtitle={familyMembers.length > 0 ? 'tracked' : 'Add family'}
              icon="people-outline" accent={colors.info}
              onPress={() => navigation.navigate('Main', { screen: 'Family' })}
            /></Animated.View>
          </View>

          <Animated.View style={[grid1Anim, { marginTop: 4 }]}><Card style={styles.gridCard}>
            <CardHeader title="Document Status" subtitle="Urgency breakdown"
              right={<StatusBadge label={`${documents.length} total`} color={colors.primaryLight} />} />
            {[
              { label: 'Expired',          count: expired.length, color: colors.danger },
              { label: 'Critical (<30d)',  count: deadlines.filter((d) => d.daysRemaining >= 0 && d.daysRemaining < 30).length,   color: colors.danger },
              { label: 'High (30–60d)',    count: deadlines.filter((d) => d.daysRemaining >= 30 && d.daysRemaining < 60).length,  color: colors.warning },
              { label: 'Medium (60–180d)', count: deadlines.filter((d) => d.daysRemaining >= 60 && d.daysRemaining < 180).length, color: colors.info },
              { label: 'Low (>180d)',      count: deadlines.filter((d) => d.daysRemaining >= 180).length,                         color: colors.success },
            ].map((row) => (
              <View key={row.label} style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: row.color }]} />
                <Text style={styles.statusLabel}>{row.label}</Text>
                <View style={styles.statusBar}>
                  <View style={[styles.statusBarFill, { width: deadlines.length > 0 ? `${(row.count / deadlines.length) * 100}%` as any : '0%', backgroundColor: row.color }]} />
                </View>
                <View style={[styles.statusCount, { backgroundColor: row.color + '22', borderColor: row.color + '44' }]}>
                  <Text style={[styles.statusCountText, { color: row.color }]}>{row.count}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.cardFooterBtn, { marginTop: 12 }]} onPress={() => navigation.navigate('Main', { screen: 'Documents' })}>
              <Text style={styles.cardFooterText}>View Documents</Text>
              <Ionicons name="arrow-forward" size={13} color={colors.primaryLight} />
            </TouchableOpacity>
          </Card></Animated.View>

          <Animated.View style={[grid2Anim]}><Card style={styles.gridCard}>
            <CardHeader
              title="Upcoming Deadlines"
              subtitle={deadlines.length > 0 ? `${deadlines.length} doc${deadlines.length !== 1 ? 's' : ''} tracked` : 'No documents yet'}
              right={
                <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Main', { screen: 'Documents' })}>
                  <Text style={styles.viewAllText}>All</Text>
                  <Ionicons name="arrow-forward" size={12} color={colors.primaryLight} />
                </TouchableOpacity>
              }
            />
            {deadlines.length === 0 ? (
              <View style={styles.emptyState}>
                <AnimatedEmptyIcon name="document-text-outline" size={32} color={colors.primaryLight} />
                <Text style={styles.emptyTitle}>No documents yet</Text>
                <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Main', { screen: 'Documents' })}>
                  <Text style={styles.emptyBtnText}>Add Document</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.deadlineList}>
                {deadlines.map((dl) => {
                  const color = urgencyColor(dl.daysRemaining);
                  const label = urgencyLabel(dl.daysRemaining);
                  const badgeLabel = `${label}${dl.daysRemaining >= 0 ? ` · ${dl.daysRemaining}d` : ''}`;
                  return (
                    <View key={dl.documentId} style={styles.deadlineRow}>
                      <View style={[styles.deadlineStrip, { backgroundColor: color }]} />
                      <Text style={styles.deadlineIcon}>{dl.icon}</Text>
                      <View style={styles.deadlineInfo}>
                        <Text style={styles.deadlineName} numberOfLines={1}>{dl.label}</Text>
                        <Text style={styles.deadlineDate}>{formatDate(dl.expiryDate)}</Text>
                      </View>
                      <StatusBadge label={badgeLabel} color={color} />
                    </View>
                  );
                })}
              </View>
            )}
          </Card></Animated.View>
        </View>
      )}

      {/* ── Row 2: Checklist + Timers ── */}
      <View style={[{ marginTop: 16 }, hasSidebar && { flexDirection: 'row' as any } as any]}>
        {/* Checklist card */}
        <Card style={[styles.gridCard, hasSidebar ? { flex: 1, marginRight: 8 } : { marginBottom: 16 }, { height: CARD_H }] as any}>
          <CardHeader
            title="Immi Checklist"
            subtitle={checklists.length > 0 ? `${checklists.length} active list${checklists.length !== 1 ? 's' : ''}` : 'Track your immigration steps'}
            right={
              <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Checklist' })} style={styles.headerLink}>
                <Text style={styles.headerLinkText}>Manage</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primaryLight} />
              </TouchableOpacity>
            }
          />
          {checklists.length === 0 ? (
            <View style={styles.emptyState}>
              <AnimatedEmptyIcon name="checkbox-outline" size={32} color={colors.success} />
              <Text style={styles.emptyTitle}>No checklists yet</Text>
              <Text style={styles.emptyDesc}>Track OPT, H-1B, and green card steps</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Main', { screen: 'Checklist' })}>
                <Text style={styles.emptyBtnText}>Browse Checklists</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              <View style={styles.checklistList}>
                {checklists.map((cl) => {
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
                            <View style={[styles.checklistProgressFill, { width: `${pct}%` as any, backgroundColor: pct === 100 ? colors.success : colors.primaryLight }]} />
                          </View>
                          <Text style={styles.checklistPct}>{done}/{total}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </Card>

        {/* Timers card */}
        <Card style={[styles.gridCard, hasSidebar && { flex: 1, marginLeft: 8 } as any, { height: CARD_H }]}>
          <CardHeader
            title="Immi Timers"
            subtitle={counters.length > 0 ? `${counters.length} timer${counters.length !== 1 ? 's' : ''} active` : 'Unemployment & stay days'}
            right={
              <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Timers' })} style={styles.headerLink}>
                <Text style={styles.headerLinkText}>Manage</Text>
                <Ionicons name="arrow-forward" size={12} color={colors.primaryLight} />
              </TouchableOpacity>
            }
          />
          {counters.length === 0 ? (
            <View style={styles.emptyState}>
              <AnimatedEmptyIcon name="timer-outline" size={32} color={colors.warning} />
              <Text style={styles.emptyTitle}>No timers yet</Text>
              <Text style={styles.emptyDesc}>OPT unemployment, 60-day grace, and more</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Main', { screen: 'Timers' })}>
                <Text style={styles.emptyBtnText}>Add Timer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} nestedScrollEnabled={true}>
              <View style={styles.timerList}>
                {counters.map((ct) => {
                  const pct = Math.min(100, Math.round((ct.daysUsed / ct.maxDays) * 100));
                  const isCrit = ct.daysUsed >= ct.critAt;
                  const isWarn = !isCrit && ct.daysUsed >= ct.warnAt;
                  const barColor = isCrit ? colors.danger : isWarn ? colors.warning : colors.primaryLight;
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
              </View>
            </ScrollView>
          )}
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
                    <View style={[styles.visaIconBox, { backgroundColor: item.tint + '18', borderColor: item.tint + '38' }, selectedVisa === item.id && { backgroundColor: item.tint + '28', borderColor: item.tint + '60' }]}>
                      <Ionicons name={item.icon} size={20} color={item.tint} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.visaLabel}>{item.label}</Text>
                      <Text style={styles.visaCount}>{item.docs.length} standard documents</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(240,244,255,0.35)" />
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
                    <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
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
                        onPress={() => { setShowProfileSetup(false); setAnyModalOpen(false); navigation.navigate('Main', { screen: 'Documents', params: { openPaywall: true } }); }}
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
                renderItem={renderDocItem}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Auto-backup footer */}
      <View style={styles.backupFooter}>
        <Ionicons name="shield-checkmark-outline" size={12} color="rgba(76,217,138,0.65)" />
        <Text style={styles.backupFooterText}>
          {lastAutoBackupAt ? `Saved to device ${relativeTime(lastAutoBackupAt)}` : 'Saving to device…'}
        </Text>
      </View>
      <View style={{ height: 16 }} />
    </ScrollView>
  );
};

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content:       { paddingBottom: 32 },
  contentWeb:    { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 48 },
  contentMobile: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 0 },

  // Mobile hero
  mobileHero: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(111,175,242,0.20)',
    backgroundColor: 'rgba(5,11,28,0.55)',
    ...glassWeb(18),
  } as any,
  mobileHeroGradient: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20 },
  mobileHeroLogoWrap: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(59,139,232,0.18)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  mobileTitleStatus: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -0.5 },
  mobileTitleVault:  { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: colors.primaryLight, letterSpacing: -0.5 },
  mobileSub:         { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)', marginTop: 2 },
  miniStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12,
  },
  miniStatLabel: { fontSize: 9, fontFamily: 'Inter_700Bold', color: 'rgba(240,244,255,0.45)', letterSpacing: 1.2 },
  miniStatValue: { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', marginTop: 2, letterSpacing: -0.6 },

  // Banners
  verifiedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(76,217,138,0.10)',
    borderWidth: 1, borderColor: 'rgba(76,217,138,0.30)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12,
  },
  verifiedBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.85)' },

  guestBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(59,139,232,0.10)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.28)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, marginBottom: 12,
  },
  guestBannerIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(59,139,232,0.18)', alignItems: 'center', justifyContent: 'center' },
  guestBannerText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.75)', lineHeight: 17 },
  guestBannerBtn:  { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  guestBannerBtnTxt:{ fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },

  // Profile chip
  topBanner: { marginBottom: 16 },
  topBannerProfile: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(76,217,138,0.08)',
    borderWidth: 1, borderColor: 'rgba(76,217,138,0.25)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  topBannerProfileIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(76,217,138,0.18)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' as any } as any,
  topBannerProfileLabel:{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF', flex: 1 },
  topBannerEditBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.05)' },
  topBannerEditText:    { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.65)' },

  // Section cards
  viewAllBtn:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.primaryLight },

  emptyState:    { alignItems: 'center', paddingVertical: 24, gap: 10, flex: 1, justifyContent: 'center' },
  emptyIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(59,139,232,0.10)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },
  emptyDesc:     { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', textAlign: 'center', maxWidth: 260, lineHeight: 18 },
  emptyBtn:      { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  emptyBtnText:  { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },

  // Deadline rows
  deadlineList:  { gap: 0 },
  deadlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  deadlineStrip: { width: 3, height: 36, borderRadius: 2 },
  deadlineIcon:  { fontSize: 20 },
  deadlineInfo:  { flex: 1 },
  deadlineName:  { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF' },
  deadlineDate:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.50)', marginTop: 2 },

  // Status breakdown
  statusRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  statusDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  statusLabel:     { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.75)', flex: 1, minWidth: 0 },
  statusBar:       { flex: 2, minWidth: 0, height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  statusBarFill:   { height: '100%', borderRadius: 3 },
  statusCount:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, flexShrink: 0, borderWidth: 1 },
  statusCountText: { fontSize: 11, fontFamily: 'Inter_700Bold' },

  // Grid card
  gridCard: { overflow: 'hidden', flexDirection: 'column' as any } as any,

  headerLink:      { flexDirection: 'row', alignItems: 'center', gap: 3 },
  headerLinkText:  { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.primaryLight },
  cardFooterBtn:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  cardFooterText:  { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.primaryLight, flex: 1 },

  // Checklist
  checklistList:        { gap: 14 },
  checklistRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checklistIcon:        { fontSize: 20 },
  checklistInfo:        { flex: 1 },
  checklistLabel:       { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#F0F4FF', marginBottom: 5 },
  checklistProgressWrap:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  checklistProgressBar: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  checklistProgressFill:{ height: '100%', borderRadius: 3 },
  checklistPct:         { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.60)', width: 32, textAlign: 'right' },

  // Timer
  timerList:    { gap: 14 },
  timerRow:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timerIcon:    { fontSize: 20 },
  timerInfo:    { flex: 1 },
  timerTopRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  timerLabel:   { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#F0F4FF', flex: 1 },
  timerCount:   { fontSize: 12, fontFamily: 'Inter_700Bold' },
  timerBarWrap: { height: 5, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' },
  timerBarFill: { height: '100%', borderRadius: 3 },

  // Backup footer
  backupFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 12, marginTop: 8, opacity: 0.7,
  } as any,
  backupFooterText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.60)' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(3,8,18,0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: {
    backgroundColor: '#0C1A34',
    borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '85%' as any,
    overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any) : {}),
  } as any,
  modalTopBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  modalBack:   { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.primaryLight },
  modalTitle:  { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },

  visaRow:       { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  visaRowActive: { backgroundColor: 'rgba(59,139,232,0.08)' },
  visaIconBox: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  visaLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF' },
  visaCount: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.50)', marginTop: 2 },

  docHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(245,192,83,0.10)', margin: 16, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(245,192,83,0.28)',
  },
  docHintText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(245,192,83,0.95)', lineHeight: 18 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  docCheck: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.20)', alignItems: 'center', justifyContent: 'center' },
  docCheckActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  docLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF' },
  docSub:   { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.50)', marginTop: 2 },
  addDocRow: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  addDocText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.primaryLight },
  upgradeDocBtn: {
    backgroundColor: 'rgba(245,192,83,0.10)', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: 'rgba(245,192,83,0.30)',
  },
  upgradeDocBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.gold },
  saveDocBtn:        { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveDocBtnText:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
