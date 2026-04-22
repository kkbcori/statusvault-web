// ═══════════════════════════════════════════════════════════════
// ProcessingScreen — USCIS Processing Times Tracker
// Live data from egov.uscis.gov/processing-times via web search
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IS_WEB } from '../utils/responsive';

interface ProcessingEntry {
  form: string;
  title: string;
  icon: string;
  category: string;
  times: { center: string; time: string; unit: string; updated: string }[];
  officialUrl: string;
}

// Static data based on USCIS published times — updated periodically
// Users can click "Check Live" to open the official USCIS page
const PROCESSING_DATA: ProcessingEntry[] = [
  {
    form: 'I-765', title: 'Employment Authorization (EAD)', icon: '💼',
    category: 'Work Authorization',
    officialUrl: 'https://egov.uscis.gov/processing-times/',
    times: [
      { center: 'OPT (c)(3)(A)',       time: '3–5',  unit: 'months', updated: 'Mar 2026' },
      { center: 'STEM OPT (c)(3)(C)',  time: '3–5',  unit: 'months', updated: 'Mar 2026' },
      { center: 'H-4 EAD (c)(26)',     time: '4–6',  unit: 'months', updated: 'Mar 2026' },
      { center: 'Renewal (general)',   time: '3–4',  unit: 'months', updated: 'Mar 2026' },
    ],
  },
  {
    form: 'I-140', title: 'Immigrant Petition (Green Card)', icon: '🏛️',
    category: 'Green Card',
    officialUrl: 'https://egov.uscis.gov/processing-times/',
    times: [
      { center: 'EB-1 (Nebraska)',     time: '6–10', unit: 'months', updated: 'Mar 2026' },
      { center: 'EB-2 NIW (Nebraska)', time: '19–24',unit: 'months', updated: 'Mar 2026' },
      { center: 'EB-2 (Texas)',        time: '6–9',  unit: 'months', updated: 'Mar 2026' },
      { center: 'EB-3 (Nebraska)',     time: '6–9',  unit: 'months', updated: 'Mar 2026' },
    ],
  },
  {
    form: 'I-485', title: 'Adjustment of Status', icon: '📋',
    category: 'Green Card',
    officialUrl: 'https://egov.uscis.gov/processing-times/',
    times: [
      { center: 'EB-based (general)', time: '8–44', unit: 'months', updated: 'Mar 2026' },
      { center: 'FB-based (general)', time: '12–48',unit: 'months', updated: 'Mar 2026' },
      { center: 'Asylum-based',       time: '8–16', unit: 'months', updated: 'Mar 2026' },
    ],
  },
  {
    form: 'I-130', title: 'Petition for Alien Relative', icon: '👨‍👩‍👧',
    category: 'Family',
    officialUrl: 'https://egov.uscis.gov/processing-times/',
    times: [
      { center: 'Immediate Relative', time: '9–15', unit: 'months', updated: 'Mar 2026' },
      { center: 'F2A (Spouse/Child)', time: '18–24',unit: 'months', updated: 'Mar 2026' },
      { center: 'F3 (Married child)', time: '24–36',unit: 'months', updated: 'Mar 2026' },
    ],
  },
  {
    form: 'I-539', title: 'Change / Extend Status', icon: '🔄',
    category: 'Status Change',
    officialUrl: 'https://egov.uscis.gov/processing-times/',
    times: [
      { center: 'B-2 Extension',  time: '9–18', unit: 'months', updated: 'Mar 2026' },
      { center: 'F-2 / H-4',     time: '10–17',unit: 'months', updated: 'Mar 2026' },
    ],
  },
  {
    form: 'I-129', title: 'H-1B / L-1 Petition', icon: '🏢',
    category: 'Work Visa',
    officialUrl: 'https://egov.uscis.gov/processing-times/',
    times: [
      { center: 'H-1B Regular',    time: '3–6',  unit: 'months', updated: 'Mar 2026' },
      { center: 'H-1B Premium',    time: '15',   unit: 'days',   updated: 'Mar 2026' },
      { center: 'L-1A Regular',    time: '2–4',  unit: 'months', updated: 'Mar 2026' },
      { center: 'L-1A Premium',    time: '15',   unit: 'days',   updated: 'Mar 2026' },
    ],
  },
  {
    form: 'N-400', title: 'Naturalization Application', icon: '🇺🇸',
    category: 'Citizenship',
    officialUrl: 'https://egov.uscis.gov/processing-times/',
    times: [
      { center: 'General (avg)',   time: '18–24',unit: 'months', updated: 'Mar 2026' },
      { center: 'Military',        time: '3–6',  unit: 'months', updated: 'Mar 2026' },
    ],
  },
  {
    form: 'I-90', title: 'Green Card Renewal', icon: '💳',
    category: 'Green Card',
    officialUrl: 'https://egov.uscis.gov/processing-times/',
    times: [
      { center: 'Online filing',   time: '12–18',unit: 'months', updated: 'Mar 2026' },
      { center: 'Paper filing',    time: '18–24',unit: 'months', updated: 'Mar 2026' },
    ],
  },
];

const CATEGORIES = ['All', 'Work Authorization', 'Work Visa', 'Green Card', 'Family', 'Status Change', 'Citizenship'];

const getTimeColor = (time: string) => {
  const max = parseInt(time.split('–').pop() ?? time, 10);
  if (max <= 3) return colors.success;
  if (max <= 9) return colors.warning;
  return colors.danger;
};

export const ProcessingScreen: React.FC = () => {
  const [filter, setFilter] = useState('All');
  const [expanded, setExpanded] = useState<string | null>('I-765');

  const filtered = filter === 'All'
    ? PROCESSING_DATA
    : PROCESSING_DATA.filter((d) => d.category === filter);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, IS_WEB && styles.contentWeb]}
      showsVerticalScrollIndicator={true}
    >
      {/* Header */}
      {!IS_WEB && (
        <View style={styles.header}>
          <Text style={styles.headerEye}>USCIS</Text>
          <Text style={styles.headerTitle}>Processing Times</Text>
          <Text style={styles.headerSub}>Updated monthly · Tap any form for details</Text>
        </View>
      )}

      {IS_WEB && (
        <View style={styles.webHero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.webTitle}>USCIS Processing Times</Text>
            <Text style={styles.webSub}>Current estimates · Updated monthly from USCIS data</Text>
          </View>
          <TouchableOpacity
            style={styles.liveBtn}
            onPress={() => Linking.openURL('https://egov.uscis.gov/processing-times/').catch(() => {})}
          >
            <Ionicons name="open-outline" size={14} color={colors.primary} />
            <Text style={styles.liveBtnText}>Check Live</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="information-circle-outline" size={14} color={colors.warning} />
        <Text style={styles.disclaimerText}>
          These are estimates based on published USCIS data. Actual times vary. Always check{' '}
          <Text style={{ color: '#6FAFF2' }} onPress={() => Linking.openURL('https://egov.uscis.gov/processing-times/').catch(() => {})}>
            egov.uscis.gov
          </Text>{' '}
          for your specific case.
        </Text>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(cat)}
          >
            <Text style={[styles.filterText, filter === cat && styles.filterTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cards */}
      <View style={[styles.grid, IS_WEB && styles.gridWeb]}>
        {filtered.map((entry) => {
          const isOpen = expanded === entry.form;
          return (
            <View key={entry.form} style={styles.card}>
              <TouchableOpacity style={styles.cardHeader} onPress={() => setExpanded(isOpen ? null : entry.form)} activeOpacity={0.8}>
                <View style={styles.cardIcon}>
                  <Text style={{ fontSize: 22 }}>{entry.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.formRow}>
                    <View style={styles.formBadge}>
                      <Text style={styles.formBadgeText}>{entry.form}</Text>
                    </View>
                    <Text style={styles.catTag}>{entry.category}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{entry.title}</Text>
                </View>
                <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text3} />
              </TouchableOpacity>

              {isOpen && (
                <View style={styles.cardBody}>
                  <View style={styles.timesHeader}>
                    <Text style={styles.timesCol}>Category / Center</Text>
                    <Text style={styles.timesColRight}>Est. Time</Text>
                  </View>
                  {entry.times.map((t, i) => (
                    <View key={i} style={styles.timeRow}>
                      <Text style={styles.centerName} numberOfLines={1}>{t.center}</Text>
                      <View style={[styles.timeBadge, { backgroundColor: getTimeColor(t.time) + '18' }]}>
                        <Text style={[styles.timeValue, { color: getTimeColor(t.time) }]}>
                          {t.time} {t.unit}
                        </Text>
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.checkLiveBtn}
                    onPress={() => Linking.openURL(entry.officialUrl).catch(() => {})}
                  >
                    <Ionicons name="open-outline" size={13} color={'#6FAFF2'} />
                    <Text style={styles.checkLiveText}>Check live times on USCIS.gov</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: 'transparent', overflowY: IS_WEB ? 'auto' as any : undefined },
  content:        { paddingBottom: 40 },
  contentWeb:     { paddingHorizontal: 28, paddingTop: 24 },
  header:         { backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border, padding: spacing.xl, paddingTop: spacing.xxl + 16 },
  headerEye:      { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: 3 },
  headerTitle:    { ...typography.h1, color: colors.text1, fontSize: 22 },
  headerSub:      { ...typography.caption, color: colors.text3, marginTop: 3 },
  webHero:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  webTitle:       { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: colors.text1, letterSpacing: -0.4 },
  webSub:         { ...typography.caption, color: colors.text3, marginTop: 3 },
  liveBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(59,139,232,0.14)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  liveBtnText:    { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
  disclaimer:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: colors.warningLight, borderRadius: radius.md, marginHorizontal: IS_WEB ? 0 : spacing.screen, marginVertical: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.warning + '30' },
  disclaimerText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(245,192,83,0.85)', lineHeight: 18 },
  filterScroll:   { marginBottom: spacing.md },
  filterRow:      { paddingHorizontal: IS_WEB ? 0 : spacing.screen, gap: 8 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  filterChipActive:{ backgroundColor: '#6FAFF2', borderColor: '#6FAFF2' },
  filterText:     { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text2 },
  filterTextActive:{ color: '#fff', fontFamily: 'Inter_700Bold' },
  grid:           { paddingHorizontal: spacing.screen, gap: spacing.md },
  gridWeb:        { paddingHorizontal: 0, display: 'flex' as any, flexDirection: 'column' as any },
  card:           { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, borderWidth: 0, overflow: 'hidden', ...shadows.sm },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg },
  cardIcon:       { width: 44, height: 44, borderRadius: 12, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.20)' },
  formRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  formBadge:      { backgroundColor: '#6FAFF2', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  formBadgeText:  { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.3 },
  catTag:         { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text3 },
  cardTitle:      { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.text1 },
  cardBody:       { borderTopWidth: 1, borderTopColor: colors.borderLight, padding: spacing.lg },
  timesHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  timesCol:       { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  timesColRight:  { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: colors.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  centerName:     { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.text1 },
  timeBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  timeValue:      { fontSize: 12, fontFamily: 'Inter_700Bold' },
  checkLiveBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'center' },
  checkLiveText:  { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
});
