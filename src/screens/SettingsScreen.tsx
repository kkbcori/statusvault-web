// ═══════════════════════════════════════════════════════════════
// SettingsScreen v3 — Inter · Ionicons section labels
// Profile block removed · price $3.99
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
  Alert, Linking, Share, TextInput, Modal, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IS_WEB } from '../utils/responsive';
import { useDialog } from '../components/ConfirmDialog';
import { useStore } from '../store';
import { useNavigation } from '@react-navigation/native';
import { requestPermissions, cancelAllNotifications, sendTestNotification, getScheduledCount } from '../utils/notifications';
import { PinSetupModal } from '../components/PinSetupModal';

const PRICE      = '$3.99';
const PRICE_YEAR = '$3.99/year';

// ─── Section Label with Ionicon ──────────────────────────────
interface SectionLabelProps {
  iconName: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
}
const SectionLabel: React.FC<SectionLabelProps> = ({ iconName, label }) => (
  <View style={slStyles.row}>
    <Ionicons name={iconName} size={12} color={colors.text3} />
    <Text style={slStyles.text}>{label}</Text>
  </View>
);
const slStyles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.screen, marginTop: spacing.xxl, marginBottom: spacing.sm },
  text: { ...typography.micro, color: colors.text3, letterSpacing: 1.5 },
});

export const SettingsScreen: React.FC = () => {
  const navigation  = useNavigation<any>();
  const authUser    = useStore((s) => s.authUser);
  const isSyncing   = useStore((s) => s.isSyncing);
  const { 
    documents, counters, notificationsEnabled, isPremium,
    notificationEmail, whatsappPhone,
    setNotificationsEnabled, setNotificationEmail, setWhatsappPhone, resetAllData, setPremium,
    exportData, importData,
    pinEnabled, setPin, removePin, verifyPin,
  } = useStore();

  const [showImportModal,    setShowImportModal]    = useState(false);
  const [editingEmail,       setEditingEmail]       = useState(false);
  const [editingPhone,       setEditingPhone]       = useState(false);
  const [emailInput,         setEmailInput]         = useState('');
  const [phoneInput,         setPhoneInput]         = useState('');
  const dialog = useDialog();
  const [importText,      setImportText]      = useState('');
  const [showPinSetup,    setShowPinSetup]    = useState(false);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        dialog.alert('Permissions Required', 'Enable notifications in device settings. Open your device Settings → Apps → StatusVault → Notifications.');
        return;
      }
    } else { await cancelAllNotifications(); }
    setNotificationsEnabled(value);
  };

  const handleTestNotification = async () => {
    const granted = await requestPermissions();
    if (!granted) { dialog.alert('Enable Notifications', 'Please enable notifications in device settings first.'); return; }
    await sendTestNotification();
    dialog.alert('Test Sent!', 'You should see a notification banner in 3 seconds.');
  };

  const handleExport = async () => {
    try {
      const json = exportData();
      await Share.share({ message: json, title: 'StatusVault Backup' });
    } catch (e) { dialog.alert('Export Failed', 'Could not export data. Please try again.'); }
  };

  const handleImportPaste = () => {
    if (!importText.trim()) { dialog.alert('Nothing to import', 'Paste your backup JSON data first.'); return; }
    const success = importData(importText.trim());
    if (success) {
      dialog.alert('Import Successful', 'Documents and settings have been restored.');
      setShowImportModal(false); setImportText('');
    } else { dialog.alert('Import Failed', 'Not a valid StatusVault backup. Please check the file and try again.'); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.cc} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>SETTINGS</Text>
          <Text style={styles.title}>Settings</Text>
        </View>
      </LinearGradient>

      {/* Stats summary strip — replaces the hollow profile block */}
      <View style={styles.statsStrip}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{documents.length}</Text>
          <Text style={styles.statLabel}>Documents</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{counters.length}</Text>
          <Text style={styles.statLabel}>Counters</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: isPremium ? '#4F46E5' : colors.text3 }]}>
            {isPremium ? 'PRO' : 'FREE'}
          </Text>
          <Text style={styles.statLabel}>Plan</Text>
        </View>
      </View>

      {/* ── Notifications ── */}
      <SectionLabel iconName="notifications-outline" label="NOTIFICATIONS" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIconBox}>
            <Ionicons name="notifications-outline" size={16} color={'#4F46E5'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rTitle}>Push Notifications</Text>
            <Text style={styles.rDesc}>Banner alerts on lock screen</Text>
          </View>
          <Switch
            value={notificationsEnabled} onValueChange={handleNotificationToggle}
            trackColor={{ false: colors.border, true: '#4F46E5' + '55' }}
            thumbColor={notificationsEnabled ? '#4F46E5' : '#f4f4f4'}
          />
        </View>
        <View style={styles.div} />
        <TouchableOpacity style={styles.sRow} onPress={handleTestNotification}>
          <View style={styles.rowIconBox}><Ionicons name="phone-portrait-outline" size={16} color={'#4F46E5'} /></View>
          <Text style={styles.sText}>Send Test Notification</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </TouchableOpacity>
        <View style={styles.div} />
        <TouchableOpacity style={styles.sRow} onPress={async () => {
          const c = await getScheduledCount();
          dialog.alert('Scheduled Alerts', `${c} notification${c !== 1 ? 's' : ''} currently scheduled.`);
        }}>
          <View style={styles.rowIconBox}><Ionicons name="stats-chart-outline" size={16} color={'#4F46E5'} /></View>
          <Text style={styles.sText}>View Scheduled Alerts</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </TouchableOpacity>
      </View>

      {/* ── Cross-Device Sync via JSON ── */}
      <SectionLabel iconName="phone-portrait-outline" label="CROSS-DEVICE SYNC" />
      <View style={styles.card}>
        <View style={styles.infoBox2}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#7367F0" />
          <Text style={styles.infoBox2Text}>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }}>100% Private · On Your Device{'\n'}</Text>
            {'Your data never leaves your device. To use on another device, export a JSON file and import it there.'}
          </Text>
        </View>
        <View style={styles.div} />
        <TouchableOpacity style={styles.sRow} onPress={handleExport}>
          <View style={styles.rowIconBox}><Ionicons name="download-outline" size={16} color="#7367F0" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sText}>Export Data (JSON)</Text>
            <Text style={styles.rDesc}>Download all docs, checklists, timers to a file</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </TouchableOpacity>
        <View style={styles.div} />
        <TouchableOpacity style={styles.sRow} onPress={handleImport}>
          <View style={styles.rowIconBox}><Ionicons name="cloud-upload-outline" size={16} color="#7367F0" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sText}>Import Data (JSON)</Text>
            <Text style={styles.rDesc}>Restore from a previously exported file</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </TouchableOpacity>
      </View>

      {/* ── PDF Export (Premium only) ── */}
      <SectionLabel iconName="document-text-outline" label="PDF EXPORT — PREMIUM" />
      {!isPremium ? (
        <View style={styles.card}>
          <View style={styles.premiumAlertBanner}>
            <Ionicons name="lock-closed" size={18} color="#FF9F43" />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumAlertTitle}>Premium Feature</Text>
              <Text style={styles.premiumAlertDesc}>Export all your documents, checklists, and family member docs as a PDF. Available for Premium subscribers.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => useStore.getState().openPaywall()}>
            <Text style={styles.upgradeBtnText}>⭐ Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <TouchableOpacity style={styles.sRow} onPress={handleExportPDF}>
            <View style={styles.rowIconBox}><Ionicons name="document-text-outline" size={16} color="#7367F0" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sText}>Export All Documents as PDF</Text>
              <Text style={styles.rDesc}>Includes your docs + family member docs with expiry status</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text3} />
          </TouchableOpacity>
          <View style={styles.div} />
          <TouchableOpacity style={styles.sRow} onPress={handleExportChecklistPDF}>
            <View style={styles.rowIconBox}><Ionicons name="checkbox-outline" size={16} color="#7367F0" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sText}>Export Checklists as PDF</Text>
              <Text style={styles.rDesc}>All checklists with progress and completed steps</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text3} />
          </TouchableOpacity>
        </View>
      )}

            {/* ── App Lock ── */}
      <SectionLabel iconName="lock-closed-outline" label="APP LOCK" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIconBox}><Ionicons name="keypad-outline" size={16} color={'#4F46E5'} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rTitle}>PIN Lock</Text>
            <Text style={styles.rDesc}>{pinEnabled ? 'PIN is enabled — app is locked on launch' : 'Protect your data with a 4-digit PIN'}</Text>
          </View>
          <Switch
            value={pinEnabled} onValueChange={() => setShowPinSetup(true)}
            trackColor={{ false: colors.border, true: '#4F46E5' + '55' }}
            thumbColor={pinEnabled ? '#4F46E5' : '#f4f4f4'}
          />
        </View>
        {pinEnabled && (
          <>
            <View style={styles.div} />
            <TouchableOpacity style={styles.sRow} onPress={() => setShowPinSetup(true)}>
              <View style={styles.rowIconBox}><Ionicons name="refresh-outline" size={16} color={'#4F46E5'} /></View>
              <Text style={styles.sText}>Change PIN</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Immi Counters ── */}
      <SectionLabel iconName="timer-outline" label="IMMI COUNTERS" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIconBox}><Ionicons name="timer-outline" size={16} color={'#4F46E5'} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rTitle}>{counters.length} counter{counters.length !== 1 ? 's' : ''} active</Text>
            <Text style={styles.rDesc}>Manage counters from the Dashboard</Text>
          </View>
        </View>
      </View>

      {/* ── Data Backup ── */}
      <SectionLabel iconName="archive-outline" label="DATA BACKUP" />
      <View style={styles.card}>
        <TouchableOpacity style={styles.sRow} onPress={handleExport}>
          <View style={styles.rowIconBox}><Ionicons name="share-outline" size={16} color={'#4F46E5'} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sText}>Export Backup</Text>
            <Text style={styles.rDesc}>Share as JSON · portable to any device</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </TouchableOpacity>
        <View style={styles.div} />
        <TouchableOpacity style={styles.sRow} onPress={() => setShowImportModal(true)}>
          <View style={styles.rowIconBox}><Ionicons name="download-outline" size={16} color={'#4F46E5'} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sText}>Import Backup</Text>
            <Text style={styles.rDesc}>Paste JSON backup from another device</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </TouchableOpacity>
      </View>
      <Text style={styles.dataNote}>Backups are plain JSON — easy to read, transfer, and store.</Text>

      {/* ── Premium ── */}
      <SectionLabel iconName="star-outline" label="PREMIUM" />
      {isPremium ? (
        <View style={[styles.card, { borderWidth: 2, borderColor: '#4F46E5' }]}>
          <View style={styles.row}>
            <View style={[styles.rowIconBox, { backgroundColor: '#EEF2FF', borderColor: 'rgba(115,103,240,0.25)' }]}>
              <Ionicons name="star" size={16} color={'#4F46E5'} />
            </View>
            <Text style={[styles.rTitle, { color: '#4F46E5' }]}>Premium Active — Unlimited tracking</Text>
          </View>
        </View>
      ) : (
        <LinearGradient colors={[colors.primary, colors.primaryMid]} style={styles.premCard}>
          {[...Array(3)].map((_, i) => (
            <View key={i} style={{ position: 'absolute', top: 15 + i * 25, left: 0, right: 0, height: 1, backgroundColor: '#fff', opacity: 0.03 }} />
          ))}
          {/* Corner accent */}
          <View style={{ position: 'absolute', top: 14, right: 14, width: 20, height: 20, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(0,153,168,0.2)', borderTopRightRadius: 4 }} />

          <Ionicons name="shield-checkmark" size={32} color={'#4F46E5'} style={{ marginBottom: 10 }} />
          <Text style={styles.premTitle}>Upgrade to Premium</Text>
          <Text style={styles.premDesc}>Unlimited tracking, advanced alerts, data export, priority support.</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 20 }}>
            <Text style={styles.premPrice}>{PRICE}</Text>
            <Text style={styles.premPeriod}>/year</Text>
          </View>
          <TouchableOpacity style={styles.premBtn} onPress={() => dialog.confirm({ title: 'Coming Soon', message: 'In-app purchase available soon.', type: 'confirm',
            confirmLabel: 'Unlock for Testing', cancelLabel: 'Cancel', onConfirm: () => setPremium(true) })}>
            <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.premBtnGrad}>
              <Text style={styles.premBtnText}>Subscribe — {PRICE_YEAR}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* ── Danger Zone ── */}
      <SectionLabel iconName="warning-outline" label="DANGER ZONE" />
      <View style={[styles.card, { borderWidth: 1, borderColor: colors.dangerLight }]}>
        <TouchableOpacity style={styles.sRow} onPress={() => dialog.confirm({ title: 'Reset All Data?', message: 'This permanently deletes all your documents, counters, checklists, and trips. This cannot be undone.',
              type: 'danger', confirmLabel: 'Delete Everything', onConfirm: () => { cancelAllNotifications(); resetAllData(); } })}>
          <View style={[styles.rowIconBox, { backgroundColor: colors.dangerLight, borderColor: colors.danger + '25' }]}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </View>
          <Text style={[styles.sText, { color: colors.danger }]}>Reset All Data</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* ── Legal ── */}
      <SectionLabel iconName="document-text-outline" label="LEGAL" />
      <View style={styles.card}>
        <Text style={styles.legalText}>
          StatusVault is an informational tool only and does not provide legal advice. Always consult your DSO, immigration attorney, or USCIS for official guidance. Not affiliated with any government agency.
        </Text>
      </View>

      <Text style={styles.version}>StatusVault v1.0.0{'\n'}✈️ Built with care for immigrants</Text>
      <View style={{ height: 40 }} />

      {/* PIN Setup Modal */}
      <PinSetupModal
        visible={showPinSetup}
        onClose={() => setShowPinSetup(false)}
        onSetPin={setPin}
        onRemovePin={removePin}
        currentPinEnabled={pinEnabled}
        verifyPin={verifyPin}
      />

      {/* Import Modal */}
      <Modal visible={showImportModal} animationType="slide" transparent>
        <View style={styles.importOverlay}>
          <View style={styles.importSheet}>
            <View style={styles.importTrim} />
            <Text style={styles.importTitle}>Import Backup</Text>
            <Text style={styles.importDesc}>Paste the JSON backup from another device:</Text>
            <TextInput
              style={styles.importInput} value={importText} onChangeText={setImportText}
              placeholder='{"app":"StatusVault",...}' placeholderTextColor={colors.text3}
              multiline autoCapitalize="none" autoCorrect={false}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={[styles.importBtn, { backgroundColor: colors.border }]} onPress={() => { setShowImportModal(false); setImportText(''); }}>
                <Text style={[styles.importBtnText, { color: colors.text2 }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.importBtn} onPress={handleImportPaste}>
                <LinearGradient colors={[colors.primary, colors.primaryLight]} style={styles.importBtnGrad}>
                  <Text style={[styles.importBtnText, { color: '#4F46E5' }]}>Import</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F4F5FA' },
  cc:              { paddingBottom: 20 },
  headerGradient:  { paddingBottom: 8 },
  header:          { paddingHorizontal: spacing.screen, paddingTop: spacing.xxl + 20, paddingBottom: spacing.lg },
  headerLabel:     { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: 3, fontSize: 10 },
  title:           { ...typography.h1, color: colors.text1, fontSize: 22 },

  // Stats strip — replaces hollow profile block
  accountBanner:         { marginHorizontal: spacing.screen, marginTop: spacing.lg, borderRadius: radius.xl, overflow: 'hidden', ...shadows.lg },
  accountBannerGrad:     { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 14 },
  accountBannerIcon:     { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,153,168,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,153,168,0.25)' },
  accountBannerBadge:    { backgroundColor: '#4F46E5', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  accountBannerBadgeText:{ fontSize: 8, fontFamily: 'Inter_800ExtraBold', color: '#4F46E5', letterSpacing: 0.8 },
  accountBannerTitle:    { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.2 },
  accountBannerSub:      { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 16 },
  accountBannerArrow:    { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(0,153,168,0.1)', alignItems: 'center', justifyContent: 'center' },
  statsStrip:      { flexDirection: 'row', marginHorizontal: spacing.screen, marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.sm },
  statItem:        { flex: 1, alignItems: 'center' },
  statNumber:      { fontSize: 22, fontFamily: 'Inter_900Black', color: colors.text1, letterSpacing: -0.5 },
  statLabel:       { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text3, marginTop: 2 },
  statDivider:     { width: 1, backgroundColor: colors.borderLight, marginVertical: 4 },

  card:            { backgroundColor: colors.card, borderRadius: radius.xl, marginHorizontal: spacing.screen, padding: spacing.lg, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.sm },
  row:             { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIconBox:      { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  rTitle:          { ...typography.bodySemibold, color: colors.text1, fontSize: 14 },
  rDesc:           { ...typography.caption, color: colors.text3, fontSize: 12, marginTop: 1 },
  sRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: spacing.md },
  sText:           { ...typography.bodySemibold, color: colors.text1, fontSize: 14, flex: 1 },
  div:             { height: 1, backgroundColor: colors.borderLight },
  dataNote:        { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text3, paddingHorizontal: spacing.screen, marginTop: spacing.sm },
  premCard:        { borderRadius: radius.xl, marginHorizontal: spacing.screen, padding: spacing.xl, alignItems: 'center', overflow: 'hidden' },
  premTitle:       { ...typography.h2, color: colors.textInverse, marginBottom: spacing.sm },
  premDesc:        { ...typography.caption, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  premPrice:       { fontSize: 32, fontFamily: 'Inter_900Black', color: '#4F46E5' },
  premPeriod:      { fontSize: 16, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.4)', marginLeft: 4 },
  premBtn:         { width: '100%', borderRadius: radius.md, overflow: 'hidden' },
  premBtnGrad:     { paddingVertical: 14, alignItems: 'center', borderRadius: radius.md },
  premBtnText:     { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#4F46E5' },
  legalText:       { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text3, lineHeight: 20 },
  version:         { ...typography.caption, color: colors.text3, textAlign: 'center', marginTop: spacing.xxl, lineHeight: 20, fontSize: 12 },
  importOverlay:   { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  importSheet:     { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, overflow: 'hidden' },
  importTrim:      { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#4F46E5' },
  importTitle:     { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text1, marginBottom: 8, marginTop: 4 },
  importDesc:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text2, marginBottom: 16 },
  importInput:     { backgroundColor: '#F4F5FA', borderRadius: 12, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 14, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: colors.text1, minHeight: 120, textAlignVertical: 'top' },
  importBtn:       { flex: 1, borderRadius: 12, overflow: 'hidden' },
  importBtnGrad:   { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  importBtnText:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
