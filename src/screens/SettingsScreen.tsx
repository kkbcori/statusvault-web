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
import { IS_WEB, IS_TABLET } from '../utils/responsive';
import { useDialog } from '../components/ConfirmDialog';
import { useStore } from '../store';
import { useNavigation } from '@react-navigation/native';
import { requestPermissions, cancelAllNotifications, sendTestNotification, getScheduledCount } from '../utils/notifications';
import { PinSetupModal } from '../components/PinSetupModal';

const PRICE      = 'from $0.49';
const PRICE_YEAR = '$0.49/mo or $4.99/yr';

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
  const signOut              = useStore((s) => s.signOut);
  const deleteAccount        = useStore((s) => s.deleteAccount);
  const isPremiumUser        = useStore((s) => s.isPremium);
  const cloudBackupEnabled   = useStore((s) => s.cloudBackupEnabled);
  const setCloudBackupEnabled = useStore((s) => s.setCloudBackupEnabled);
  const lastSyncedAt         = useStore((s) => s.lastSyncedAt);
  const isSyncing            = useStore((s) => s.isSyncing);
  const { 
    documents, counters, notificationsEnabled,
    notificationEmail,
    setNotificationsEnabled, setNotificationEmail, resetAllData, setPremium,
    exportData, importData,
    pinEnabled, setPin, removePin, verifyPin,
  } = useStore();
  const isPremium = isPremiumUser; // single source of truth

  const [showImportModal,    setShowImportModal]    = useState(false);
  const [editingEmail,       setEditingEmail]       = useState(false);
  const [editingPhone,       setEditingPhone]       = useState(false);
  const [emailInput,         setEmailInput]         = useState('');
  const [phoneInput,         setPhoneInput]         = useState('');
  const dialog = useDialog();
  const [importText,      setImportText]      = useState('');
  const [showPinSetup,       setShowPinSetup]       = useState(false);
  const [confirmAction,      setConfirmAction]      = useState<null|'signout'|'delete'|'reset'>(null);

  const handleCloudBackupToggle = () => {
    if (cloudBackupEnabled) {
      dialog.confirm({
        title: 'Turn Off Cloud Backup?',
        message: 'No backup — your data will be lost if you switch devices or clear your browser. Are you sure?',
        type: 'danger',
        confirmLabel: 'Turn Off',
        cancelLabel: 'Keep Enabled',
        onConfirm: () => setCloudBackupEnabled(false),
      });
    } else {
      setCloudBackupEnabled(true);
      useStore.getState().syncToCloud().catch(() => {});
    }
  };

  const handleSignOut = () => setConfirmAction('signout');

  const handleDeleteAccount = () => setConfirmAction('delete');

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

  const handleExport = () => {
    try {
      const json = exportData();
      if (IS_WEB && typeof document !== 'undefined') {
        const blob = new Blob([json], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `statusvault-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Share.share({ message: json, title: 'StatusVault Backup' });
      }
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

  // Open file picker to import JSON
  const handleImport = () => {
    if (IS_WEB && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          const text = ev.target?.result as string;
          if (!text) return;
          const success = importData(text.trim());
          if (success) {
            dialog.alert('Import Successful', 'Documents and settings have been restored.');
          } else {
            dialog.alert('Import Failed', 'Not a valid StatusVault backup file.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      setShowImportModal(true);
    }
  };

  const handleExportPDF = () => {
    if (IS_WEB && typeof window !== 'undefined') {
      const { documents: docs, familyMembers } = useStore.getState();
      const rows = docs.map(d => {
        const days = Math.floor((new Date(d.expiryDate).getTime() - Date.now()) / 86400000);
        const status = days < 0 ? 'EXPIRED' : days < 30 ? 'CRITICAL' : days < 60 ? 'HIGH' : days < 180 ? 'MEDIUM' : 'LOW';
        const color  = days < 0 ? '#DC2626' : days < 30 ? '#DC2626' : days < 60 ? '#D97706' : days < 180 ? '#4F46E5' : '#059669';
        return `<tr><td>${d.icon} ${d.label}</td><td>${d.expiryDate}</td><td>${d.documentNumber || '—'}</td><td style="color:${color};font-weight:700">${status} (${days}d)</td><td>${d.notes || ''}</td></tr>`;
      }).join('');
      const famRows = familyMembers.flatMap(m =>
        docs.filter(d => m.documentIds?.includes(d.id)).map(d => {
          const days = Math.floor((new Date(d.expiryDate).getTime() - Date.now()) / 86400000);
          const status = days < 0 ? 'EXPIRED' : days < 30 ? 'CRITICAL' : days < 60 ? 'HIGH' : 'OK';
          const color  = days < 0 ? '#DC2626' : days < 30 ? '#DC2626' : days < 60 ? '#D97706' : '#059669';
          return `<tr><td>${m.name}</td><td>${d.icon} ${d.label}</td><td>${d.expiryDate}</td><td style="color:${color};font-weight:700">${status} (${days}d)</td></tr>`;
        })
      ).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>StatusVault Documents</title>
        <style>body{font-family:Arial,sans-serif;padding:24px;color:#1e293b}h1{color:#4F46E5;font-size:22px}h2{color:#334155;font-size:16px;margin-top:24px}
        table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#EEF2FF;color:#4F46E5;padding:8px 10px;text-align:left;font-size:12px}
        td{padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px}.footer{margin-top:32px;font-size:10px;color:#94a3b8}</style>
        </head><body>
        <h1>📋 StatusVault — Document Export</h1>
        <p style="color:#64748b;font-size:13px">Generated: ${new Date().toLocaleString()}</p>
        <h2>Your Documents (${docs.length})</h2>
        <table><thead><tr><th>Document</th><th>Expiry</th><th>Doc #</th><th>Status</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>
        ${famRows ? `<h2>Family Member Documents</h2><table><thead><tr><th>Member</th><th>Document</th><th>Expiry</th><th>Status</th></tr></thead><tbody>${famRows}</tbody></table>` : ''}
        <div class="footer">StatusVault · All data stored locally · AES-256 encrypted</div>
        </body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
    } else {
      dialog.alert('PDF Export', 'PDF export is available on the web version.');
    }
  };

  const handleExportChecklistPDF = () => {
    if (IS_WEB && typeof window !== 'undefined') {
      const { checklists } = useStore.getState();
      const sections = checklists.map(cl => {
        const done  = cl.items.filter((i: any) => i.done).length;
        const pct   = cl.items.length > 0 ? Math.round((done / cl.items.length) * 100) : 0;
        const items = cl.items.map((i: any) =>
          `<li style="margin:4px 0;color:${i.done ? '#059669' : '#334155'}">${i.done ? '✅' : '⬜'} ${i.text}</li>`
        ).join('');
        return `<div style="margin-bottom:24px;break-inside:avoid">
          <h2 style="margin-bottom:4px">${cl.icon} ${cl.label}</h2>
          <div style="background:#EEF2FF;border-radius:6px;padding:6px 12px;display:inline-block;margin-bottom:8px;font-size:12px;color:#4F46E5">
            ${done}/${cl.items.length} complete · ${pct}%
          </div>
          <ul style="margin:0;padding-left:20px;list-style:none">${items}</ul>
        </div>`;
      }).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>StatusVault Checklists</title>
        <style>body{font-family:Arial,sans-serif;padding:24px;color:#1e293b}h1{color:#4F46E5;font-size:22px}h2{color:#334155;font-size:15px}
        .footer{margin-top:32px;font-size:10px;color:#94a3b8}</style>
        </head><body>
        <h1>✅ StatusVault — Checklist Export</h1>
        <p style="color:#64748b;font-size:13px">Generated: ${new Date().toLocaleString()} · ${checklists.length} checklist(s)</p>
        ${sections}
        <div class="footer">StatusVault · All data stored locally · AES-256 encrypted</div>
        </body></html>`;
      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); w.print(); }
    } else {
      dialog.alert('Export', 'Checklist export is available on the web version.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.cc} showsVerticalScrollIndicator={true}>

      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="settings-outline" size={20} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSub}>Manage your StatusVault preferences</Text>
          </View>
          {authUser && (
            <View style={[styles.badge, { backgroundColor: isPremium ? '#EEF2FF' : '#F8FAFF' }]}>
              <Text style={[styles.badgeTxt, { color: isPremium ? '#4F46E5' : '#64748B' }]}>
                {isPremium ? 'PRO' : 'FREE'}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* ── Notifications ── */}
      <SectionLabel iconName="notifications-outline" label="NOTIFICATIONS" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIconBox}><Ionicons name="notifications-outline" size={16} color="#4F46E5" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rTitle}>Push Notifications</Text>
            <Text style={styles.rDesc}>Alerts at 180 · 90 · 60 · 30 · 15 · 7 days before expiry</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: colors.border, true: '#4F46E5' + '55' }}
            thumbColor={notificationsEnabled ? '#4F46E5' : '#f4f4f4'}
          />
        </View>
        {notificationsEnabled && (
          <>
            <View style={styles.div} />
            <TouchableOpacity style={styles.sRow} onPress={handleTestNotification}>
              <View style={styles.rowIconBox}><Ionicons name="paper-plane-outline" size={16} color="#4F46E5" /></View>
              <Text style={styles.sText}>Send Test Notification</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </TouchableOpacity>
            <View style={styles.div} />
            <TouchableOpacity style={styles.sRow} onPress={async () => {
              const c = await getScheduledCount();
              dialog.alert('Scheduled Alerts', `${c} notification${c !== 1 ? 's' : ''} currently scheduled.`);
            }}>
              <View style={styles.rowIconBox}><Ionicons name="stats-chart-outline" size={16} color="#4F46E5" /></View>
              <Text style={styles.sText}>View Scheduled Alerts</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Cloud Backup (Premium only) ── */}
      <SectionLabel iconName="cloud-outline" label="CLOUD BACKUP" />
      {!isPremiumUser ? (
        <View style={styles.card}>
          <View style={styles.infoBox2}>
            <Ionicons name="lock-closed" size={16} color="#FF9F43" />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumAlertTitle}>Premium Feature</Text>
              <Text style={styles.premiumAlertDesc}>
                Automatic encrypted cloud backup restores your data on any device. Upgrade to Premium to enable.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => useStore.getState().openPaywall()}>
            <Text style={styles.upgradeBtnText}>⭐ Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIconBox, { backgroundColor: cloudBackupEnabled ? '#ECFDF5' : '#FEF2F2' }]}>
              <Ionicons name={cloudBackupEnabled ? 'cloud-done-outline' : 'cloud-offline-outline'} size={16} color={cloudBackupEnabled ? '#059669' : '#DC2626'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rTitle}>Auto Cloud Backup</Text>
              <Text style={styles.rDesc}>
                {cloudBackupEnabled
                  ? isSyncing
                    ? 'Syncing to cloud...'
                    : lastSyncedAt
                      ? `Last backed up: ${new Date(lastSyncedAt).toLocaleString()}`
                      : 'Enabled — backs up after every change'
                  : '⚠️ Off — your data will be lost if you switch devices'}
              </Text>
            </View>
            <Switch
              value={cloudBackupEnabled}
              onValueChange={handleCloudBackupToggle}
              trackColor={{ false: '#FEE2E2', true: '#4F46E5' + '55' }}
              thumbColor={cloudBackupEnabled ? '#4F46E5' : '#DC2626'}
            />
          </View>
          {!cloudBackupEnabled && (
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, margin: 4, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Ionicons name="warning-outline" size={16} color="#DC2626" />
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: '#DC2626', flex: 1, lineHeight: 18 }}>
                Cloud backup is off. If you lose this device or clear your browser data, all your documents, family members, and settings will be permanently lost.
              </Text>
            </View>
          )}
        </View>
      )}

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

      {/* ── App Lock ── */}
      <SectionLabel iconName="lock-closed-outline" label="APP LOCK" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIconBox}><Ionicons name="keypad-outline" size={16} color="#4F46E5" /></View>
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
              <View style={styles.rowIconBox}><Ionicons name="refresh-outline" size={16} color="#4F46E5" /></View>
              <Text style={styles.sText}>Change PIN</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </TouchableOpacity>
          </>
        )}
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

      {/* ── Premium ── */}
      <SectionLabel iconName="star-outline" label="PREMIUM" />
      {isPremium ? (
        <View style={[styles.card, { borderWidth: 2, borderColor: '#4F46E5' }]}>
          <View style={styles.row}>
            <View style={[styles.rowIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="star" size={16} color="#4F46E5" />
            </View>
            <Text style={[styles.rTitle, { color: '#4F46E5' }]}>Premium Active — Unlimited tracking</Text>
          </View>
        </View>
      ) : (
        <LinearGradient colors={['#030712', '#0F172A', '#1E1B4B']} style={styles.premCard}>
          <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(79,70,229,0.12)' }} />
          <View style={{ position: 'absolute', bottom: -10, left: -10, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(124,58,237,0.08)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <LinearGradient colors={['#4F46E5','#7C3AED']} style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shield-checkmark" size={22} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: '#A5B4FC', letterSpacing: 1.5 }}>✦ STATUSVAULT PREMIUM</Text>
              <Text style={styles.premTitle}>Upgrade to Premium</Text>
            </View>
          </View>
          {['Unlimited docs · checklists · timers · family', 'PDF & JSON export for all your data', 'Smart alerts at 6mo · 3mo · 1mo · 7d'].map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(79,70,229,0.25)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={11} color="#818CF8" />
              </View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(203,213,225,0.70)' }}>{f}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 14, marginBottom: 16, gap: 4 }}>
            <Text style={styles.premPrice}>{PRICE}</Text>
            <Text style={styles.premPeriod}>/year</Text>
            <View style={{ backgroundColor: '#4F46E5', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.5 }}>SAVE 85%</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.premBtn} onPress={() => dialog.confirm({ title: 'Coming Soon', message: 'In-app purchase available soon.', type: 'confirm', confirmLabel: 'Unlock for Testing', cancelLabel: 'Cancel', onConfirm: () => setPremium(true) })}>
            <LinearGradient colors={['#4F46E5', '#7C3AED']} style={styles.premBtnGrad} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
              <Ionicons name="star" size={14} color="#FCD34D" />
              <Text style={styles.premBtnText}>Unlock Premium — {PRICE_YEAR}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={{ fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(203,213,225,0.30)', textAlign: 'center', marginTop: 8 }}>Cancel anytime · Secure · AES-256 encrypted</Text>
        </LinearGradient>
      )}

      {/* ── Account Actions ── */}
      {authUser && (
        <>
          <SectionLabel iconName="person-circle-outline" label="ACCOUNT" />
          <View style={styles.card}>
            <TouchableOpacity style={styles.sRow} onPress={() => useStore.getState().openAuthModal('set your password')} activeOpacity={0.75}>
              <View style={styles.rowIconBox}>
                <Ionicons name="key-outline" size={16} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sText}>Set / Change Password</Text>
                <Text style={styles.rDesc}>Enable email + password sign-in alongside magic link</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </TouchableOpacity>
            <View style={styles.div} />
            <TouchableOpacity style={styles.sRow} onPress={handleSignOut} activeOpacity={0.75}>
              <View style={[styles.rowIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="log-out-outline" size={16} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sText, { color: '#DC2626' }]}>Sign Out</Text>
                <Text style={styles.rDesc}>Your data stays on this device</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Danger Zone ── */}
      <SectionLabel iconName="warning-outline" label="DANGER ZONE" />
      <View style={[styles.card, { borderWidth: 1, borderColor: colors.dangerLight }]}>
        <TouchableOpacity style={styles.sRow} onPress={() => setConfirmAction('reset')}>
          <View style={[styles.rowIconBox, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </View>
          <Text style={[styles.sText, { color: colors.danger }]}>Reset All Data</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.danger} />
        </TouchableOpacity>
        {authUser && (
          <>
            <View style={styles.div} />
            <TouchableOpacity style={styles.sRow} onPress={handleDeleteAccount} activeOpacity={0.75}>
              <View style={[styles.rowIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="person-remove-outline" size={16} color="#DC2626" />
              </View>
              <Text style={[styles.sText, { color: '#DC2626' }]}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={18} color="#DC2626" />
            </TouchableOpacity>
          </>
        )}
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
    {/* ── Confirm Modals — rendered outside ScrollView so they're not clipped ── */}
    {(['signout','delete','reset'] as const).map(action => {
      const cfg = {
        signout: {
          title: 'Sign Out',
          msg: 'You will be signed out. Your data stays on this device.',
          btnLabel: 'Sign Out',
          btnColor: '#4F46E5',
          onConfirm: () => { signOut(); },
        },
        delete: {
          title: 'Delete Account',
          msg: 'This permanently deletes your Supabase account and all cloud data. Local data is cleared. This cannot be undone.',
          btnLabel: 'Delete Account',
          btnColor: '#DC2626',
          onConfirm: async () => { const { error } = await deleteAccount(); if (error) alert(error); },
        },
        reset: {
          title: 'Reset All Data?',
          msg: 'Permanently deletes all your documents, checklists, timers, trips and family members from this device and cloud. You will stay signed in.',
          btnLabel: 'Reset Everything',
          btnColor: '#DC2626',
          onConfirm: async () => { await cancelAllNotifications(); await useStore.getState().resetAllData(); },
        },
      }[action];
      return (
        <Modal key={action} visible={confirmAction === action} transparent animationType="fade" statusBarTranslucent>
          <View style={styles.confirmOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject as any} activeOpacity={1} onPress={() => setConfirmAction(null)} />
            <View style={styles.confirmBox}>
              <View style={styles.confirmIconRow}>
                <View style={[styles.confirmIconBg, { backgroundColor: action === 'signout' ? '#EEF2FF' : '#FEF2F2' }]}>
                  <Ionicons
                    name={action === 'signout' ? 'log-out-outline' : action === 'delete' ? 'person-remove-outline' : 'trash-outline'}
                    size={22}
                    color={action === 'signout' ? '#4F46E5' : '#DC2626'}
                  />
                </View>
              </View>
              <Text style={styles.confirmTitle}>{cfg.title}</Text>
              <Text style={styles.confirmMsg}>{cfg.msg}</Text>
              <View style={styles.confirmBtns}>
                <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmAction(null)} activeOpacity={0.8}>
                  <Text style={styles.confirmCancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmOk, { backgroundColor: cfg.btnColor }]}
                  onPress={async () => { setConfirmAction(null); await cfg.onConfirm(); }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmOkTxt}>{cfg.btnLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    })}
    </View>
  );
};


const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F4F5FA' },
  cc:              { paddingBottom: 20 },
  headerGradient:  { paddingBottom: 8 },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  headerGradient:  { paddingBottom: 0 },
  headerIcon:      { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  headerTitle:     { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  headerSub:       { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 1 },
  badge:           { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#C7D2FE' },
  badgeTxt:        { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
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
  premBtnGrad:     { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md },
  premBtnText:     { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#FFFFFF' },
  legalText:       { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text3, lineHeight: 20 },
  confirmIconRow:  { alignItems: 'center', marginBottom: 14 },
  confirmIconBg:   { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmOverlay:  { position: 'absolute' as any, inset: 0, backgroundColor: 'rgba(15,23,42,0.65)', alignItems: 'center', justifyContent: 'center', zIndex: 9999 } as any,
  confirmBox:      { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '90%', maxWidth: 380, ...Platform.select({ web: { boxShadow: '0 8px 32px rgba(15,23,42,0.18)' } as any }) } as any,
  confirmTitle:    { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0F172A', marginBottom: 8 },
  confirmMsg:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#64748B', lineHeight: 20, marginBottom: 20 },
  confirmBtns:     { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' } as any,
  confirmCancel:   { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F1F5F9' },
  confirmCancelTxt:{ fontSize: 14, fontFamily: 'Inter_500Medium', color: '#475569' },
  confirmOk:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  confirmOkTxt:    { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  premiumAlertBanner:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#FFF7ED', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#FED7AA' },
  premiumAlertTitle:   { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#92400E', marginBottom: 3 },
  premiumAlertDesc:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#B45309', lineHeight: 17 },
  infoBox2:            { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#F5F3FF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#DDD6FE' },
  infoBox2Text:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#5B21B6', lineHeight: 18, flex: 1 },
  upgradeBtn:          { borderRadius: 10, overflow: 'hidden', backgroundColor: '#FF9F43', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  upgradeBtnText:      { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
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
