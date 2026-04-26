// ═══════════════════════════════════════════════════════════════
// SettingsScreen v3 — Inter · Ionicons section labels
// Profile block removed · price $3.99
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch,
  Alert, Linking, Share, TextInput, Modal, Platform, KeyboardAvoidingView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { calculateDaysRemaining } from '../utils/dates';
import { IS_WEB } from '../utils/responsive';
import { useDialog } from '../components/ConfirmDialog';
import { useStore } from '../store';
import { useNavigation } from '@react-navigation/native';
import { requestPermissions, cancelAllNotifications, sendTestNotification, getScheduledCount } from '../utils/notifications';
import { PinSetupModal } from '../components/PinSetupModal';
import { useEntrance, usePressScale } from '../hooks/useAnimations';

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
  // ── Entrance animations ──────────────────────────────────────
  const headerAnim  = useEntrance(0);
  const section1    = useEntrance(60);
  const section2    = useEntrance(120);
  const section3    = useEntrance(180);
  const section4    = useEntrance(240);
  const section5    = useEntrance(300);
  const navigation  = useNavigation<any>();
  const authUser    = useStore((s) => s.authUser);
  const isGuestMode = useStore((s) => s.isGuestMode);
  const signOut              = useStore((s) => s.signOut);
  const deleteAccount        = useStore((s) => s.deleteAccount);
  const isPremiumUser        = useStore((s) => s.isPremium);
  const cloudBackupEnabled   = useStore((s) => s.cloudBackupEnabled);
  const setCloudBackupEnabled = useStore((s) => s.setCloudBackupEnabled);
  const lastSyncedAt         = useStore((s) => s.lastSyncedAt);
  const lastAutoBackupAt     = useStore((s) => s.lastAutoBackupAt ?? null);
  const isSyncing            = useStore((s) => s.isSyncing);
  const syncError            = useStore((s) => s.syncError);
  const { 
    documents, counters, notificationsEnabled,
    notificationEmail, setNotificationEmail,
    setNotificationsEnabled, resetAllData, setPremium,
    exportData, importData,
    pinEnabled, setPin, removePin, verifyPin,
  } = useStore();
  const isPremium = isPremiumUser; // single source of truth

  const [showImportModal,    setShowImportModal]    = useState(false);
  // Email/WhatsApp alert state removed — email notifications disabled pending edge function setup
  const dialog = useDialog();
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput,   setEmailInput]   = useState(notificationEmail ?? '');

  // Keep emailInput in sync if store changes externally (cloud restore, import)
  React.useEffect(() => { setEmailInput(notificationEmail ?? ''); }, [notificationEmail]);
  const [importText,      setImportText]      = useState('');
  const [showPinSetup,       setShowPinSetup]       = useState(false);
  const [confirmAction,      setConfirmAction]      = useState<null|'signout'|'delete'|'reset'>(null);

  // Format "2 minutes ago", "1 hour ago" etc. for backup status
  const relativeTime = (iso: string | null): string => {
    if (!iso) return 'Never';
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 5)   return 'Just now';
    if (diff < 60)  return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(iso).toLocaleDateString();
  };

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
    try {
      const parsed = JSON.parse(importText.trim());
      if (parsed.app !== 'StatusVault' || !parsed.data) {
        dialog.alert('Import Failed', 'Not a valid StatusVault backup. Please check the data and try again.');
        return;
      }
      const d = parsed.data;
      const docCount    = (d.documents    ?? []).length;
      const memberCount = (d.familyMembers ?? []).length;
      const tripCount   = (d.trips         ?? []).length;
      const exportedAt  = parsed.exportedAt
        ? new Date(parsed.exportedAt).toLocaleString()
        : 'Unknown date';
      setShowImportModal(false);
      dialog.confirm({
        title: 'Restore from Backup?',
        message: `Backup from ${exportedAt}\n\n${docCount} document${docCount !== 1 ? 's' : ''} · ${memberCount} family member${memberCount !== 1 ? 's' : ''} · ${tripCount} trip${tripCount !== 1 ? 's' : ''}\n\nThis will merge with your current data.`,
        confirmLabel: 'Restore',
        cancelLabel:  'Cancel',
        type: 'danger',
        onConfirm: () => {
          const success = importData(importText.trim());
          setImportText('');
          if (success) dialog.alert('Restored', 'All data has been restored successfully.');
          else dialog.alert('Import Failed', 'Could not restore — file may be corrupted.');
        },
      });
    } catch {
      dialog.alert('Import Failed', 'Not a valid StatusVault backup. Please check the data and try again.');
    }
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
          // Parse metadata first so user can confirm before overwriting
          try {
            const parsed = JSON.parse(text.trim());
            if (parsed.app !== 'StatusVault' || !parsed.data) {
              dialog.alert('Import Failed', 'Not a valid StatusVault backup file.');
              return;
            }
            const d = parsed.data;
            const docCount    = (d.documents    ?? []).length;
            const memberCount = (d.familyMembers ?? []).length;
            const tripCount   = (d.trips         ?? []).length;
            const exportedAt  = parsed.exportedAt
              ? new Date(parsed.exportedAt).toLocaleString()
              : 'Unknown date';
            dialog.confirm({
              title: 'Restore from Backup?',
              message: `Backup from ${exportedAt}\n\n${docCount} document${docCount !== 1 ? 's' : ''} · ${memberCount} family member${memberCount !== 1 ? 's' : ''} · ${tripCount} trip${tripCount !== 1 ? 's' : ''}\n\nThis will merge with your current data.`,
              confirmLabel: 'Restore',
              cancelLabel:  'Cancel',
              type: 'danger',
              onConfirm: () => {
                const success = importData(text.trim());
                if (success) dialog.alert('Restored', 'All data has been restored successfully.');
                else dialog.alert('Import Failed', 'Could not restore — file may be corrupted.');
              },
            });
          } catch {
            dialog.alert('Import Failed', 'Not a valid StatusVault backup file.');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    } else {
      // Native: use expo-document-picker to let user pick their backup JSON from Files
      (async () => {
        try {
          const DocumentPicker = await import('expo-document-picker');
          const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true,
          });
          if (result.canceled || !result.assets?.[0]) return;
          const FileSystem = await import('expo-file-system');
          const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
          if (!text) return;
          try {
            const parsed = JSON.parse(text.trim());
            if (parsed.app !== 'StatusVault' || !parsed.data) {
              dialog.alert('Import Failed', 'Not a valid StatusVault backup file.');
              return;
            }
            const d = parsed.data;
            const docCount    = (d.documents    ?? []).length;
            const memberCount = (d.familyMembers ?? []).length;
            const tripCount   = (d.trips         ?? []).length;
            const exportedAt  = parsed.exportedAt
              ? new Date(parsed.exportedAt).toLocaleString()
              : 'Unknown date';
            dialog.confirm({
              title: 'Restore from Backup?',
              message: `Backup from ${exportedAt}\n\n${docCount} document${docCount !== 1 ? 's' : ''} · ${memberCount} family member${memberCount !== 1 ? 's' : ''} · ${tripCount} trip${tripCount !== 1 ? 's' : ''}\n\nThis will merge with your current data.`,
              confirmLabel: 'Restore',
              cancelLabel:  'Cancel',
              type: 'danger',
              onConfirm: () => {
                const success = importData(text.trim());
                if (success) dialog.alert('Restored', 'All data has been restored successfully.');
                else dialog.alert('Import Failed', 'Could not restore — file may be corrupted.');
              },
            });
          } catch {
            dialog.alert('Import Failed', 'Not a valid StatusVault backup file.');
          }
        } catch {
          // Fallback to paste modal if document picker unavailable
          setShowImportModal(true);
        }
      })();
    }
  };

  const handleExportPDF = () => {
    if (IS_WEB && typeof window !== 'undefined') {
      const { documents: docs, familyMembers } = useStore.getState();
      const rows = docs.map(d => {
        const days = calculateDaysRemaining(d.expiryDate);
        const status = days < 0 ? 'EXPIRED' : days < 30 ? 'CRITICAL' : days < 60 ? 'HIGH' : days < 180 ? 'MEDIUM' : 'LOW';
        const color  = days < 0 ? '#FF6B6B' : days < 30 ? '#FF6B6B' : days < 60 ? '#F5C053' : days < 180 ? '#6FAFF2' : '#4CD98A';
        return `<tr><td>${d.icon} ${d.label}</td><td>${d.expiryDate}</td><td>${d.documentNumber || '—'}</td><td style="color:${color};font-weight:700">${status} (${days}d)</td><td>${d.notes || ''}</td></tr>`;
      }).join('');
      const famRows = familyMembers.flatMap(m =>
        docs.filter(d => m.documentIds?.includes(d.id)).map(d => {
          const days = calculateDaysRemaining(d.expiryDate);
          const status = days < 0 ? 'EXPIRED' : days < 30 ? 'CRITICAL' : days < 60 ? 'HIGH' : 'OK';
          const color  = days < 0 ? '#FF6B6B' : days < 30 ? '#FF6B6B' : days < 60 ? '#F5C053' : '#4CD98A';
          return `<tr><td>${m.name}</td><td>${d.icon} ${d.label}</td><td>${d.expiryDate}</td><td style="color:${color};font-weight:700">${status} (${days}d)</td></tr>`;
        })
      ).join('');
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>StatusVault Documents</title>
        <style>@page{size:A4;margin:0}
        *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        body{font-family:Arial,sans-serif;padding:20mm 18mm;color:#0F172A}h1{color:#4F46E5;font-size:22px}h2{color:#0F172A;font-size:16px;margin-top:24px}
        table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#EEF2FF;color:#4F46E5;padding:8px 10px;text-align:left;font-size:12px}
        td{padding:7px 10px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#0F172A}.footer{margin-top:32px;font-size:10px;color:#0F172A}</style>
        </head><body>
        <h1>📋 StatusVault — Document Export</h1>
        <p style="color:#0F172A;font-size:13px">Generated: ${new Date().toLocaleString()}</p>
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
          `<li style="margin:4px 0;color:${i.done ? '#4CD98A' : 'rgba(240,244,255,0.80)'}">${i.done ? '✅' : '⬜'} ${i.text}</li>`
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
        <style>@page{size:A4;margin:0}
        *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        body{font-family:Arial,sans-serif;padding:20mm 18mm;color:#0F172A}h1{color:#4F46E5;font-size:22px}h2{color:#0F172A;font-size:15px}
        .footer{margin-top:32px;font-size:10px;color:#0F172A}</style>
        </head><body>
        <h1>✅ StatusVault — Checklist Export</h1>
        <p style="color:#0F172A;font-size:13px">Generated: ${new Date().toLocaleString()} · ${checklists.length} checklist(s)</p>
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

      {/* ── Settings Header ── */}
      <Animated.View style={headerAnim}>
      <View style={styles.headerGradient}>
        {/* Top accent stripe — brand blue */}
        <View style={{ position: 'absolute' as any, top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.primary } as any} />
        {/* Subtle ambient blue glow behind icon on web */}
        {Platform.OS === 'web' && (
          <View pointerEvents="none" style={{
            position: 'absolute' as any, top: -30, left: -30, width: 180, height: 180, borderRadius: 90,
            background: 'radial-gradient(circle, rgba(59,139,232,0.18) 0%, transparent 70%)',
          } as any} />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={styles.headerIconBox}>
            <Ionicons name="settings" size={22} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSub}>Account & preferences</Text>
          </View>
          {authUser && (
            <View style={[styles.badge, {
              backgroundColor: isPremium ? 'rgba(245,192,83,0.18)' : 'rgba(59,139,232,0.16)',
              borderWidth: 1,
              borderColor: isPremium ? 'rgba(245,192,83,0.40)' : 'rgba(111,175,242,0.32)',
            }]}>
              <Ionicons name={isPremium ? 'star' : 'person-outline'} size={11} color={isPremium ? colors.gold : colors.primaryLight} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeTxt, { color: isPremium ? colors.gold : colors.primaryLight }]}>
                {isPremium ? 'PRO' : 'FREE'}
              </Text>
            </View>
          )}
        </View>
      </View>
      </Animated.View>

      <Animated.View style={section1}>
      {/* ── Notifications ── */}
      <SectionLabel iconName="notifications-outline" label="NOTIFICATIONS" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIconBox}><Ionicons name="notifications-outline" size={16} color="#6FAFF2" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rTitle}>Push Notifications</Text>
            <Text style={styles.rDesc}>Alerts at 180 · 90 · 60 · 30 · 15 · 7 days before expiry</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: colors.border, true: '#6FAFF2' + '55' }}
            thumbColor={notificationsEnabled ? '#6FAFF2' : '#f4f4f4'}
          />
        </View>
        {notificationsEnabled && (
          <>
            <View style={styles.div} />
            <TouchableOpacity style={styles.sRow} onPress={handleTestNotification}>
              <View style={styles.rowIconBox}><Ionicons name="paper-plane-outline" size={16} color="#6FAFF2" /></View>
              <Text style={styles.sText}>Send Test Notification</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </TouchableOpacity>
            <View style={styles.div} />
            <TouchableOpacity style={styles.sRow} onPress={async () => {
              try {
                const count = await getScheduledCount();
                dialog.alert('Scheduled Alerts', `${count} notification${count !== 1 ? 's' : ''} currently scheduled.`);
              } catch { dialog.alert('Error', 'Could not retrieve scheduled alerts.'); }
            }}>
              <View style={styles.rowIconBox}><Ionicons name="stats-chart-outline" size={16} color="#6FAFF2" /></View>
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
            <Ionicons name="lock-closed" size={16} color="#F5C053" />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumAlertTitle}>Premium Feature</Text>
              <Text style={styles.premiumAlertDesc}>
                Automatic encrypted cloud backup restores your data on any device. Upgrade to Premium to enable.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => {
            if (!authUser || isGuestMode) {
              useStore.getState().openAuthModal('Create a free account, then upgrade to Premium');
            } else {
              useStore.getState().openPaywall();
            }
          }}>
            <Text style={styles.upgradeBtnText}>⭐ Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.rowIconBox, { backgroundColor: cloudBackupEnabled ? 'rgba(76,217,138,0.10)' : 'rgba(255,107,107,0.10)' }]}>
              <Ionicons name={cloudBackupEnabled ? 'cloud-done-outline' : 'cloud-offline-outline'} size={16} color={cloudBackupEnabled ? '#4CD98A' : '#FF6B6B'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rTitle}>Auto Cloud Backup</Text>
              <Text style={styles.rDesc}>
                {cloudBackupEnabled
                  ? isSyncing
                    ? 'Syncing to cloud...'
                    : syncError
                      ? `⚠️ Sync failed: ${syncError}`
                      : lastSyncedAt
                        ? `Last backed up: ${new Date(lastSyncedAt).toLocaleString()}`
                        : 'Enabled — backs up after every change'
                  : '⚠️ Off — your data will be lost if you switch devices'}
              </Text>
            </View>
            <Switch
              value={cloudBackupEnabled}
              onValueChange={handleCloudBackupToggle}
              trackColor={{ false: '#FEE2E2', true: '#6FAFF2' + '55' }}
              thumbColor={cloudBackupEnabled ? '#6FAFF2' : '#FF6B6B'}
            />
          </View>
          {!cloudBackupEnabled && (
            <View style={{ backgroundColor: 'rgba(255,107,107,0.10)', borderRadius: 8, padding: 12, margin: 4, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Ionicons name="warning-outline" size={16} color="#FF6B6B" />
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: '#FF6B6B', flex: 1, lineHeight: 18 }}>
                Cloud backup is off. If you lose this device or clear your browser data, all your documents, family members, and settings will be permanently lost.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Cross-Device Sync via JSON ── */}
      <SectionLabel iconName="phone-portrait-outline" label="CROSS-DEVICE SYNC" />
      <View style={styles.card}>
        {/* Auto-backup status pill */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: 'rgba(76,217,138,0.10)', borderRadius: 10, margin: 4 } as any}>
          <Ionicons name="checkmark-circle" size={18} color="#4CD98A" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF' }}>Auto-saved to this device</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(76,217,138,0.80)', marginTop: 1 }}>
              Last saved: {relativeTime(lastAutoBackupAt)} · Data stays on your device even without cloud backup
            </Text>
          </View>
        </View>
        <View style={styles.div} />
        <View style={styles.infoBox2}>
          <Ionicons name="phone-portrait-outline" size={16} color="#6FAFF2" />
          <Text style={styles.infoBox2Text}>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }}>Switching phones?{'\n'}</Text>
            {'Export your backup JSON, copy it to your new phone, then import it — all your data comes with you.'}
          </Text>
        </View>
        <View style={styles.div} />
        <TouchableOpacity style={styles.sRow} onPress={handleExport}>
          <View style={styles.rowIconBox}><Ionicons name="download-outline" size={16} color="#6FAFF2" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sText}>Export Backup (JSON)</Text>
            <Text style={styles.rDesc}>Save all your data to a file — use this when switching phones</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </TouchableOpacity>
        <View style={styles.div} />
        <TouchableOpacity style={styles.sRow} onPress={handleImport}>
          <View style={styles.rowIconBox}><Ionicons name="cloud-upload-outline" size={16} color="#6FAFF2" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sText}>Import Backup (JSON)</Text>
            <Text style={styles.rDesc}>Restore from your exported file — shows preview before overwriting</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.text3} />
        </TouchableOpacity>
      </View>

      {/* ── App Lock ── */}
      <SectionLabel iconName="lock-closed-outline" label="APP LOCK" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.rowIconBox}><Ionicons name="keypad-outline" size={16} color="#6FAFF2" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rTitle}>PIN Lock</Text>
            <Text style={styles.rDesc}>{pinEnabled ? 'PIN is enabled — app is locked on launch' : 'Protect your data with a 4-digit PIN'}</Text>
          </View>
          <Switch
            value={pinEnabled} onValueChange={() => setShowPinSetup(true)}
            trackColor={{ false: colors.border, true: '#6FAFF2' + '55' }}
            thumbColor={pinEnabled ? '#6FAFF2' : '#f4f4f4'}
          />
        </View>
        {pinEnabled && (
          <>
            <View style={styles.div} />
            <TouchableOpacity style={styles.sRow} onPress={() => setShowPinSetup(true)}>
              <View style={styles.rowIconBox}><Ionicons name="refresh-outline" size={16} color="#6FAFF2" /></View>
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
            <Ionicons name="lock-closed" size={18} color="#F5C053" />
            <View style={{ flex: 1 }}>
              <Text style={styles.premiumAlertTitle}>Premium Feature</Text>
              <Text style={styles.premiumAlertDesc}>Export all your documents, checklists, and family member docs as a PDF. Available for Premium subscribers.</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => {
            if (!authUser || isGuestMode) {
              useStore.getState().openAuthModal('Create a free account, then upgrade to Premium');
            } else {
              useStore.getState().openPaywall();
            }
          }}>
            <Text style={styles.upgradeBtnText}>⭐ Upgrade to Premium</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <TouchableOpacity style={styles.sRow} onPress={handleExportPDF}>
            <View style={styles.rowIconBox}><Ionicons name="document-text-outline" size={16} color="#6FAFF2" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sText}>Export All Documents as PDF</Text>
              <Text style={styles.rDesc}>Includes your docs + family member docs with expiry status</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text3} />
          </TouchableOpacity>
          <View style={styles.div} />
          <TouchableOpacity style={styles.sRow} onPress={handleExportChecklistPDF}>
            <View style={styles.rowIconBox}><Ionicons name="checkbox-outline" size={16} color="#6FAFF2" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sText}>Export Checklists as PDF</Text>
              <Text style={styles.rDesc}>All checklists with progress and completed steps</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.text3} />
          </TouchableOpacity>
        </View>
      )}

      </Animated.View>
      <Animated.View style={section4}>
      {/* ── Premium ── */}
      <SectionLabel iconName="star-outline" label="PREMIUM" />
      {isPremium ? (
        <View style={[styles.card, { borderWidth: 2, borderColor: '#6FAFF2' }]}>
          <View style={styles.row}>
            <View style={[styles.rowIconBox, { backgroundColor: 'rgba(59,139,232,0.14)' }]}>
              <Ionicons name="star" size={16} color="#6FAFF2" />
            </View>
            <Text style={[styles.rTitle, { color: '#6FAFF2' }]}>Premium Active — Unlimited tracking</Text>
          </View>
        </View>
      ) : (
        <LinearGradient colors={['#030712', 'transparent', '#0A1530']} style={styles.premCard}>
          <View style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(79,70,229,0.12)' }} />
          <View style={{ position: 'absolute', bottom: -10, left: -10, width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(124,58,237,0.08)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <LinearGradient colors={['#6FAFF2','#3B8BE8']} style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shield-checkmark" size={22} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={{ fontSize: 10, fontFamily: 'Inter_700Bold', color: '#6FAFF2', letterSpacing: 1.5 }}>✦ STATUSVAULT PREMIUM</Text>
              <Text style={styles.premTitle}>Upgrade to Premium</Text>
            </View>
          </View>
          {['Unlimited docs · checklists · timers · family', 'PDF & JSON export for all your data', 'Smart alerts at 6mo · 3mo · 2mo · 1mo · 15d · 7d'].map((f) => (
            <View key={f} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(76,217,138,0.20)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={11} color="#4CD98A" />
              </View>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.75)' }}>{f}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 14, marginBottom: 4, gap: 4 }}>
            <Text style={styles.premPrice}>$0.49</Text>
            <Text style={styles.premPeriod}>/month</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
            <Text style={{ fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)' }}>or $4.99/year</Text>
            <View style={{ backgroundColor: 'rgba(76,217,138,0.18)', borderWidth: 1, borderColor: 'rgba(76,217,138,0.35)', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#4CD98A', letterSpacing: 0.5 }}>SAVE 15%</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.premBtn} onPress={() => dialog.confirm({ title: 'Coming Soon', message: 'In-app purchase available soon.', type: 'confirm', confirmLabel: 'Unlock for Testing', cancelLabel: 'Cancel', onConfirm: () => setPremium(true) })}>
            <LinearGradient colors={['#6FAFF2', '#3B8BE8']} style={styles.premBtnGrad} start={{ x:0, y:0 }} end={{ x:1, y:0 }}>
              <Ionicons name="star" size={14} color="#F5C053" />
              <Text style={styles.premBtnText}>Unlock Premium — {PRICE_YEAR}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={{ fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.40)', textAlign: 'center', marginTop: 8 }}>Cancel anytime · Secure · AES-256 encrypted</Text>
        </LinearGradient>
      )}

      {/* ── Account Actions ── */}
      {authUser && (
        <>
          <SectionLabel iconName="person-circle-outline" label="ACCOUNT" />
          <View style={styles.card}>
            <TouchableOpacity style={styles.sRow} onPress={() => useStore.getState().openAuthModal('set your password')} activeOpacity={0.75}>
              <View style={styles.rowIconBox}>
                <Ionicons name="key-outline" size={16} color="#6FAFF2" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sText}>Set / Change Password</Text>
                <Text style={styles.rDesc}>Enable email + password sign-in alongside magic link</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.text3} />
            </TouchableOpacity>
            <View style={styles.div} />
            <TouchableOpacity style={styles.sRow} onPress={handleSignOut} activeOpacity={0.75}>
              <View style={[styles.rowIconBox, { backgroundColor: 'rgba(255,107,107,0.10)' }]}>
                <Ionicons name="log-out-outline" size={16} color="#FF6B6B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sText, { color: '#FF6B6B' }]}>Sign Out</Text>
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
              <View style={[styles.rowIconBox, { backgroundColor: 'rgba(255,107,107,0.10)' }]}>
                <Ionicons name="person-remove-outline" size={16} color="#FF6B6B" />
              </View>
              <Text style={[styles.sText, { color: '#FF6B6B' }]}>Delete Account</Text>
              <Ionicons name="chevron-forward" size={18} color="#FF6B6B" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Legal ── */}
      <SectionLabel iconName="document-text-outline" label="LEGAL" />
      <View style={styles.card}>
        <TouchableOpacity style={styles.sRow} onPress={() => Linking.openURL('https://www.statusvault.org/privacy').catch(() => {})} activeOpacity={0.7}>
          <View style={styles.rowIconBox}><Ionicons name="shield-checkmark-outline" size={16} color="#6FAFF2" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sText}>Privacy Policy</Text>
            <Text style={styles.rDesc}>How we handle and protect your data</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={colors.text3} />
        </TouchableOpacity>
        <View style={styles.div} />
        <TouchableOpacity style={styles.sRow} onPress={() => Linking.openURL('https://www.statusvault.org/terms').catch(() => {})} activeOpacity={0.7}>
          <View style={styles.rowIconBox}><Ionicons name="document-text-outline" size={16} color="#6FAFF2" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sText}>Terms of Service</Text>
            <Text style={styles.rDesc}>Usage terms and conditions</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={colors.text3} />
        </TouchableOpacity>
        <View style={styles.div} />
        <Text style={[styles.legalText, { marginTop: 12 }]}>
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
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
                  <Text style={[styles.importBtnText, { color: '#6FAFF2' }]}>Import</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      </Animated.View>
    </ScrollView>
    {/* ── Confirm Modals — rendered outside ScrollView so they're not clipped ── */}
    {(['signout','delete','reset'] as const).map(action => {
      const cfg = {
        signout: {
          title: 'Sign Out',
          msg: 'You will be signed out. Your data stays on this device.',
          btnLabel: 'Sign Out',
          btnColor: '#6FAFF2',
          onConfirm: () => { signOut(); },
        },
        delete: {
          title: 'Delete Account',
          msg: 'This permanently deletes your Supabase account and all cloud data. Local data is cleared. This cannot be undone.',
          btnLabel: 'Delete Account',
          btnColor: '#FF6B6B',
          onConfirm: async () => { const { error } = await deleteAccount(); if (error) alert(error); },
        },
        reset: {
          title: 'Reset All Data?',
          msg: 'Permanently deletes all your documents, checklists, timers, trips and family members from this device and cloud. You will stay signed in.',
          btnLabel: 'Reset Everything',
          btnColor: '#FF6B6B',
          onConfirm: async () => { await cancelAllNotifications(); await useStore.getState().resetAllData(); },
        },
      }[action];
      return (
        <Modal key={action} visible={confirmAction === action} transparent animationType="fade" statusBarTranslucent>
          {/* Backdrop click-to-dismiss layer — click anywhere outside the box dismisses */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setConfirmAction(null)}
            style={[styles.confirmOverlay, Platform.OS === 'web' ? ({ cursor: 'default' } as any) : null]}
          >
            {/* Inner box — onStartShouldSetResponder stops touches from bubbling to backdrop */}
            <View
              style={styles.confirmBox}
              onStartShouldSetResponder={() => true}
              {...(Platform.OS === 'web' ? { onClick: (e: any) => e.stopPropagation() } : {})}
            >
              <View style={styles.confirmIconRow}>
                <View style={[styles.confirmIconBg, { backgroundColor: action === 'signout' ? 'rgba(59,139,232,0.14)' : 'rgba(255,107,107,0.10)' }]}>
                  <Ionicons
                    name={action === 'signout' ? 'log-out-outline' : action === 'delete' ? 'person-remove-outline' : 'trash-outline'}
                    size={22}
                    color={action === 'signout' ? '#6FAFF2' : '#FF6B6B'}
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
                  onPress={async () => { setConfirmAction(null); try { await cfg.onConfirm(); } catch { dialog.alert('Error', 'Action failed. Please try again.'); } }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.confirmOkTxt}>{cfg.btnLabel}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      );
    })}
    </View>
  );
};


const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: 'transparent' },
  cc:              { paddingBottom: 20 },
  headerGradient: {
    marginHorizontal: spacing.screen,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 18,
    position: 'relative' as any,
    overflow: 'hidden' as any,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 4px 16px rgba(0,0,0,0.28)' } as any) : {}),
  } as any,
  headerIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(59,139,232,0.18)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.32)',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  headerTitle:     { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -0.4 },
  headerSub:       { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.60)', marginTop: 3 },
  badge:           { flexDirection: 'row', alignItems: 'center', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  badgeTxt:        { fontSize: 10, fontFamily: 'Inter_800ExtraBold', letterSpacing: 0.8 },
  headerLabel:     { ...typography.micro, color: colors.text3, letterSpacing: 1.5, marginBottom: 3, fontSize: 10 },
  title:           { ...typography.h1, color: colors.text1, fontSize: 22 },

  // Stats strip — replaces hollow profile block
  accountBanner:         { marginHorizontal: spacing.screen, marginTop: spacing.lg, borderRadius: radius.xl, overflow: 'hidden', ...shadows.lg },
  accountBannerGrad:     { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: 14 },
  accountBannerIcon:     { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,153,168,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,153,168,0.25)' },
  accountBannerBadge:    { backgroundColor: '#6FAFF2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  accountBannerBadgeText:{ fontSize: 8, fontFamily: 'Inter_800ExtraBold', color: '#6FAFF2', letterSpacing: 0.8 },
  accountBannerTitle:    { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: -0.2 },
  accountBannerSub:      { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 16 },
  accountBannerArrow:    { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(0,153,168,0.1)', alignItems: 'center', justifyContent: 'center' },
  statsStrip:      { flexDirection: 'row', marginHorizontal: spacing.screen, marginTop: spacing.lg, backgroundColor: colors.card, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', ...shadows.sm },
  statItem:        { flex: 1, alignItems: 'center' },
  statNumber:      { fontSize: 22, fontFamily: 'Inter_900Black', color: colors.text1, letterSpacing: -0.5 },
  statLabel:       { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.text3, marginTop: 2 },
  statDivider:     { width: 1, backgroundColor: colors.borderLight, marginVertical: 4 },

  card:            { backgroundColor: colors.card, borderRadius: radius.xl, marginHorizontal: spacing.screen, padding: spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', ...shadows.sm },
  row:             { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIconBox:      { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(59,139,232,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(115,103,240,0.25)' },
  rTitle:          { ...typography.bodySemibold, color: colors.text1, fontSize: 14 },
  rDesc:           { ...typography.caption, color: colors.text3, fontSize: 12, marginTop: 1 },
  sRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: spacing.md },
  sText:           { ...typography.bodySemibold, color: colors.text1, fontSize: 14, flex: 1 },
  div:             { height: 1, backgroundColor: colors.borderLight },
  dataNote:        { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.text3, paddingHorizontal: spacing.screen, marginTop: spacing.sm },
  premCard:        { borderRadius: radius.xl, marginHorizontal: spacing.screen, padding: spacing.xl, alignItems: 'flex-start', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(111,175,242,0.28)' },
  premTitle:       { ...typography.h2, color: '#F0F4FF', marginBottom: spacing.sm, letterSpacing: -0.3 },
  premDesc:        { ...typography.caption, color: 'rgba(240,244,255,0.60)', textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  premPrice:       { fontSize: 32, fontFamily: 'Inter_900Black', color: colors.gold },
  premPeriod:      { fontSize: 16, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.50)', marginLeft: 4 },
  premBtn:         { width: '100%', borderRadius: radius.md, overflow: 'hidden' },
  premBtnGrad:     { paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.md },
  premBtnText:     { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  legalText:       { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.text3, lineHeight: 20 },
  confirmIconRow:  { alignItems: 'center', marginBottom: 14 },
  confirmIconBg:   { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  confirmOverlay:  { flex: 1, backgroundColor: 'rgba(3,8,18,0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 } as any,
  confirmBox:      { backgroundColor: '#0C1A34', borderRadius: 16, padding: 24, width: '90%', maxWidth: 380, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...Platform.select({ web: { boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any }) } as any,
  confirmTitle:    { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#F0F4FF', marginBottom: 8 },
  confirmMsg:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', lineHeight: 20, marginBottom: 20 },
  confirmBtns:     { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' } as any,
  confirmCancel:   { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  confirmCancelTxt:{ fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.75)' },
  confirmOk:       { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  confirmOkTxt:    { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  premiumAlertBanner:  { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(245,192,83,0.12)', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(245,192,83,0.30)' },
  premiumAlertTitle:   { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.gold, marginBottom: 3 },
  premiumAlertDesc:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(245,192,83,0.80)', lineHeight: 17 },
  infoBox2:            { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: 'rgba(59,139,232,0.10)', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(111,175,242,0.28)' },
  infoBox2Text:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.78)', lineHeight: 18, flex: 1 },
  upgradeBtn:          { borderRadius: 10, overflow: 'hidden', backgroundColor: '#F5C053', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  upgradeBtnText:      { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  version:         { ...typography.caption, color: colors.text3, textAlign: 'center', marginTop: spacing.xxl, lineHeight: 20, fontSize: 12 },
  importOverlay:   { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 },
  importSheet:     { backgroundColor: '#0C1A34', borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...Platform.select({ web: { boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any }) } as any,
  importTrim:      { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#6FAFF2' },
  importTitle:     { fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.text1, marginBottom: 8, marginTop: 4 },
  importDesc:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.text2, marginBottom: 16 },
  importInput:     { backgroundColor: 'transparent', borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.10)', padding: 14, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: colors.text1, minHeight: 120, textAlignVertical: 'top' },
  importBtn:       { flex: 1, borderRadius: 12, overflow: 'hidden' },
  importBtnGrad:   { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  importBtnText:   { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
