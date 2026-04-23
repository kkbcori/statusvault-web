// ═══════════════════════════════════════════════════════════════
// CloudBackupPrompt — shown after a user upgrades to Premium
// Privacy-first: cloud backup stays OFF by default. Modal explains
// AES-256 encryption and lets the user choose.
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { colors } from '../theme';

export const CloudBackupPrompt: React.FC = () => {
  const visible            = useStore((s) => s.showCloudBackupPrompt);
  const closePrompt        = useStore((s) => s.closeCloudBackupPrompt);
  const setCloudBackupEnabled = useStore((s) => s.setCloudBackupEnabled);

  const enableCloud = () => {
    setCloudBackupEnabled(true);
    closePrompt();
  };
  const keepDeviceOnly = () => {
    setCloudBackupEnabled(false);
    closePrompt();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject as any} onPress={closePrompt} />
        <View
          style={s.card}
          onStartShouldSetResponder={() => true}
          {...(Platform.OS === 'web' ? { onClick: (e: any) => e.stopPropagation() } : {})}
        >
          {/* Header — gold premium hero */}
          <LinearGradient colors={['#050B1C', '#0A1530']} style={s.header}>
            {/* Decorative orbs */}
            <View style={s.orb1} />
            <View style={s.orb2} />
            <View style={s.iconCircle}>
              <Ionicons name="cloud-outline" size={28} color={colors.gold} />
            </View>
            <Text style={s.eyebrow}>WELCOME TO PREMIUM ✨</Text>
            <Text style={s.title}>Enable Cloud Backup?</Text>
            <Text style={s.subtitle}>Your premium plan includes encrypted cloud backup — but it's off by default for maximum privacy.</Text>
          </LinearGradient>

          <View style={s.body}>
            {/* Encryption assurance */}
            <View style={s.encryptCard}>
              <View style={s.encryptIcon}>
                <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.encryptTitle}>End-to-end AES-256 encryption</Text>
                <Text style={s.encryptDesc}>Your documents are encrypted on this device before being sent to the cloud. We can never read them.</Text>
              </View>
            </View>

            {/* Benefits */}
            <Text style={s.benefitsLabel}>WITH CLOUD BACKUP</Text>
            {[
              { icon: 'phone-portrait-outline', text: 'Sync your data across all your devices' },
              { icon: 'refresh-outline',        text: 'Restore everything if you lose your device' },
              { icon: 'cloud-done-outline',     text: 'Auto-backup happens silently in the background' },
            ].map((b) => (
              <View key={b.text} style={s.benefitRow}>
                <View style={s.benefitIcon}>
                  <Ionicons name={b.icon as any} size={14} color={colors.primaryLight} />
                </View>
                <Text style={s.benefitText}>{b.text}</Text>
              </View>
            ))}

            {/* Privacy reminder */}
            <View style={s.privacyNote}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.text3} />
              <Text style={s.privacyNoteText}>
                Prefer total on-device privacy? Keep cloud backup off — your data stays only on this device. You can change this anytime in Settings.
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity onPress={enableCloud} activeOpacity={0.88}>
              <LinearGradient
                colors={[colors.primary, colors.primaryMid]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.primaryBtn}
              >
                <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                <Text style={s.primaryBtnTxt}>Enable Encrypted Cloud Backup</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={keepDeviceOnly} style={s.secondaryBtn} activeOpacity={0.85}>
              <Ionicons name="phone-portrait-outline" size={15} color={colors.text2} />
              <Text style={s.secondaryBtnTxt}>Keep On-Device Only</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(3,8,18,0.85)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%', maxWidth: 440,
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: '#0C1A34',
    ...Platform.select({ web: { boxShadow: '0 32px 80px rgba(0,0,0,0.65)' } as any, default: {} }),
  } as any,
  header: { padding: 24, alignItems: 'center', overflow: 'hidden', position: 'relative' as any } as any,
  orb1: { position: 'absolute' as any, top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(245,192,83,0.18)' },
  orb2: { position: 'absolute' as any, bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(59,139,232,0.12)' },
  iconCircle: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: 'rgba(245,192,83,0.14)',
    borderWidth: 1, borderColor: 'rgba(245,192,83,0.34)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  eyebrow:  { fontSize: 10, fontFamily: 'Inter_700Bold', color: colors.gold, letterSpacing: 1.6, marginBottom: 8 },
  title:    { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.65)', textAlign: 'center', lineHeight: 19, maxWidth: 360 },

  body: { padding: 22, gap: 14 } as any,

  encryptCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(76,217,138,0.10)',
    borderWidth: 1, borderColor: 'rgba(76,217,138,0.30)',
    borderRadius: 12, padding: 14,
  },
  encryptIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(76,217,138,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  encryptTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.success, marginBottom: 3 },
  encryptDesc:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(76,217,138,0.85)', lineHeight: 16 },

  benefitsLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(240,244,255,0.45)', letterSpacing: 1.4, marginTop: 4 } as any,

  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitIcon: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: 'rgba(59,139,232,0.14)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.28)',
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: { flex: 1, fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.80)', lineHeight: 17 },

  privacyNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10, padding: 12, marginTop: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  privacyNoteText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', lineHeight: 16 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12, marginTop: 4,
    ...Platform.select({ web: { boxShadow: '0 8px 24px rgba(59,139,232,0.40)' } as any, default: {} }),
  } as any,
  primaryBtnTxt: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, paddingVertical: 12,
  },
  secondaryBtnTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.85)' },
});
