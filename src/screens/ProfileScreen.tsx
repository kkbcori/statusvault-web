// ═══════════════════════════════════════════════════════════════
// ProfileScreen — Account & Sync Management
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useStore } from '../store';

export const ProfileScreen: React.FC = () => {
  const navigation   = useNavigation<any>();
  const authUser     = useStore((s) => s.authUser);
  const isSyncing    = useStore((s) => s.isSyncing);
  const lastSyncedAt = useStore((s) => s.lastSyncedAt);
  const syncError    = useStore((s) => s.syncError);
  const syncToCloud  = useStore((s) => s.syncToCloud);
  const syncFromCloud= useStore((s) => s.syncFromCloud);
  const signOut      = useStore((s) => s.signOut);
  const exportData   = useStore((s) => s.exportData);
  const documents    = useStore((s) => s.documents);
  const trips        = useStore((s) => s.trips);
  const counters     = useStore((s) => s.counters);

  const formatSync = (iso: string | null) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Your data will remain on this device. Sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await signOut();
        navigation.goBack();
      }},
    ]);
  };

  const handleExport = async () => {
    const json = exportData();
    if (typeof navigator !== 'undefined' && navigator.share) {
      // Web share API
      try {
        await navigator.share({ text: json, title: 'StatusVault Backup' });
      } catch {}
    } else {
      const { Share } = require('react-native');
      await Share.share({ message: json, title: 'StatusVault Backup' });
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

      <LinearGradient colors={[colors.primary, colors.primaryMid]} style={styles.header}>
        <View style={styles.headerTrim} />
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <View style={styles.avatarRing}>
          <Ionicons name="person" size={32} color={colors.accent} />
        </View>
        <Text style={styles.email}>{authUser?.email}</Text>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
          <Text style={styles.verifiedText}>Encrypted Sync Active</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{documents.length}</Text>
            <Text style={styles.statLbl}>Documents</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{trips.length}</Text>
            <Text style={styles.statLbl}>Trips</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{counters.length}</Text>
            <Text style={styles.statLbl}>Counters</Text>
          </View>
        </View>

        {/* Sync status */}
        <Text style={styles.sLabel}>SYNC STATUS</Text>
        <View style={styles.card}>
          <View style={styles.syncRow}>
            <View style={[styles.syncDot, { backgroundColor: syncError ? colors.danger : isSyncing ? colors.warning : colors.success }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.syncStatus}>
                {isSyncing ? 'Syncing…' : syncError ? 'Sync Error' : 'Up to Date'}
              </Text>
              <Text style={styles.syncTime}>Last synced: {formatSync(lastSyncedAt)}</Text>
              {syncError && <Text style={styles.syncErrorText}>{syncError}</Text>}
            </View>
            {isSyncing
              ? <ActivityIndicator color={colors.accent} size="small" />
              : <TouchableOpacity onPress={() => syncToCloud()} style={styles.syncBtn}>
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.accent} />
                </TouchableOpacity>
            }
          </View>
        </View>

        {/* Sync actions */}
        <Text style={styles.sLabel}>ACTIONS</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={() => syncToCloud()} disabled={isSyncing}>
            <View style={styles.rowIcon}><Ionicons name="cloud-upload-outline" size={17} color={colors.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Push to Cloud</Text>
              <Text style={styles.rowDesc}>Upload this device's data to your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text3} />
          </TouchableOpacity>
          <View style={styles.div} />
          <TouchableOpacity style={styles.row} onPress={() => syncFromCloud()} disabled={isSyncing}>
            <View style={styles.rowIcon}><Ionicons name="cloud-download-outline" size={17} color={colors.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Pull from Cloud</Text>
              <Text style={styles.rowDesc}>Download latest data from your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text3} />
          </TouchableOpacity>
          <View style={styles.div} />
          <TouchableOpacity style={styles.row} onPress={handleExport}>
            <View style={styles.rowIcon}><Ionicons name="share-outline" size={17} color={colors.accent} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Export as JSON</Text>
              <Text style={styles.rowDesc}>Download a local backup of all your data</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text3} />
          </TouchableOpacity>
        </View>

        {/* Security info */}
        <Text style={styles.sLabel}>SECURITY</Text>
        <View style={styles.card}>
          {[
            { icon: 'lock-closed-outline' as const,    text: 'AES-256 encrypted before upload — we cannot read your data' },
            { icon: 'phone-portrait-outline' as const, text: 'Key derived from your account — resets if you change password' },
            { icon: 'eye-off-outline' as const,        text: 'Zero-knowledge: Supabase stores only ciphertext blobs' },
          ].map(({ icon, text }, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.div} />}
              <View style={[styles.row, { paddingVertical: 12 }]}>
                <View style={styles.rowIcon}><Ionicons name={icon} size={15} color={colors.accent} /></View>
                <Text style={styles.rowDesc}>{text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.background },
  header:       { paddingTop: 56, paddingBottom: 28, paddingHorizontal: spacing.screen, alignItems: 'center' },
  headerTrim:   { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent },
  backBtn:      { position: 'absolute', top: 52, left: spacing.screen, padding: 8 },
  avatarRing:   { width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: 'rgba(201,163,81,0.3)', backgroundColor: 'rgba(201,163,81,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  email:        { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: '#fff', marginBottom: 8 },
  verifiedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(201,163,81,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(201,163,81,0.2)' },
  verifiedText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.accent },
  body:         { padding: spacing.screen },
  statsRow:     { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard:     { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  statNum:      { fontSize: 22, fontFamily: 'Inter_900Black', color: colors.text1 },
  statLbl:      { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.text3, marginTop: 2 },
  sLabel:       { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: spacing.sm, marginTop: spacing.xl },
  card:         { backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm },
  syncRow:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  syncDot:      { width: 10, height: 10, borderRadius: 5 },
  syncStatus:   { ...typography.bodySemibold, color: colors.text1, fontSize: 14 },
  syncTime:     { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.text3, marginTop: 2 },
  syncErrorText:{ fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.danger, marginTop: 2 },
  syncBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  row:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowIcon:      { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.accentDim, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderGold },
  rowTitle:     { ...typography.bodySemibold, color: colors.text1, fontSize: 14 },
  rowDesc:      { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text3, marginTop: 2, flex: 1, lineHeight: 17 },
  div:          { height: 1, backgroundColor: colors.borderLight },
  signOutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 28, paddingVertical: 14, borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.dangerLight, backgroundColor: '#FEF2F2' },
  signOutText:  { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.danger },
});
