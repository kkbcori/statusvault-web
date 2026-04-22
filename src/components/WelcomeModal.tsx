import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface Props {
  visible: boolean;
  onGuest: () => void;
  onCreateAccount: () => void;
}

export const WelcomeModal: React.FC<Props> = ({ visible, onGuest, onCreateAccount }) => (
  <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
    <View style={s.overlay}>
      <View style={s.card}>
        {/* Header */}
        <LinearGradient colors={['#050B1C', '#0A1530']} style={s.header}>
          {/* Decorative orbs */}
          <View style={s.orb1} />
          <View style={s.orb2} />
          <View style={s.logoBox}>
            <Image source={require('../../assets/logo-transparent.png')} style={{ width: 52, height: 52 }} resizeMode="contain" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={s.titleStatus}>Status</Text>
            <Text style={s.titleVault}>Vault</Text>
          </View>
          <Text style={s.subtitle}>Your immigration documents, protected</Text>
          <View style={s.privacyPill}>
            <Ionicons name="lock-closed" size={10} color={colors.primaryLight} />
            <Text style={s.privacyTxt}>100% private · AES-256 · on your device</Text>
          </View>
        </LinearGradient>

        <View style={s.body}>
          <Text style={s.chooseLabel}>Choose how to start</Text>

          {/* Guest */}
          <TouchableOpacity style={s.guestCard} onPress={onGuest} activeOpacity={0.85}>
            <View style={s.guestIconBox}>
              <Ionicons name="phone-portrait-outline" size={20} color="rgba(240,244,255,0.70)" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.guestTitle}>Continue as Guest</Text>
              <Text style={s.guestDesc}>No sign-up · explore with limited access</Text>
              <View style={s.chips}>
                {['1 document', '1 checklist', '1 timer', 'No family'].map((l) => (
                  <View key={l} style={s.chip}><Text style={s.chipTxt}>{l}</Text></View>
                ))}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(240,244,255,0.35)" />
          </TouchableOpacity>

          {/* Create Account — premium CTA */}
          <TouchableOpacity style={s.accountCard} onPress={onCreateAccount} activeOpacity={0.88}>
            <LinearGradient colors={[colors.primary, colors.primaryMid]} style={s.accountGrad}>
              <View style={s.accountIconBox}>
                <Ionicons name="person-add-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.accountTitleRow}>
                  <Text style={s.accountTitle}>Create Free Account</Text>
                  <View style={s.recommendedBadge}><Text style={s.recommendedTxt}>RECOMMENDED</Text></View>
                </View>
                <Text style={s.accountDesc}>Email login link · no password needed</Text>
                <View style={s.chips}>
                  {['2 documents', '1 family + 1 doc', '2 checklists', '2 timers'].map((l) => (
                    <View key={l} style={s.chipWhite}><Text style={s.chipWhiteTxt}>{l}</Text></View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Premium teaser */}
          <View style={s.premiumRow}>
            <Ionicons name="star" size={13} color={colors.gold} />
            <Text style={s.premiumTxt}>
              <Text style={{ fontFamily: 'Inter_700Bold', color: colors.gold }}>Premium from $0.49/mo — </Text>
              Unlimited docs · family · PDF export · AES-256 encrypted cloud backup
            </Text>
          </View>
        </View>
      </View>
    </View>
  </Modal>
);

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(3,8,18,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: '100%', maxWidth: 440, borderRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    ...Platform.select({ web: { boxShadow: '0 32px 80px rgba(0,0,0,0.65)' } as any, default: {} }),
  } as any,
  header: { padding: 28, alignItems: 'center', overflow: 'hidden', position: 'relative' as any } as any,
  orb1: { position: 'absolute' as any, top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(59,139,232,0.22)' },
  orb2: { position: 'absolute' as any, bottom: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(76,217,138,0.12)' },
  logoBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(59,139,232,0.12)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  titleStatus: { fontSize: 26, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -0.7 },
  titleVault:  { fontSize: 26, fontFamily: 'Inter_800ExtraBold', color: colors.primaryLight, letterSpacing: -0.7 },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.60)', marginTop: 6, marginBottom: 14 },
  privacyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(59,139,232,0.14)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)',
  },
  privacyTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.primaryLight },
  body: { backgroundColor: '#0C1A34', padding: 20, gap: 10 } as any,
  chooseLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(240,244,255,0.45)', textAlign: 'center', letterSpacing: 1.4, textTransform: 'uppercase' as any, marginBottom: 6 } as any,
  guestCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    padding: 14, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  guestIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  guestTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#F0F4FF', marginBottom: 2 },
  guestDesc:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', marginBottom: 8 },
  accountCard: {
    borderRadius: 14, overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 8px 28px rgba(59,139,232,0.40)' } as any, default: {} }),
  } as any,
  accountGrad: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  accountIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  accountTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  accountTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  recommendedBadge: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  recommendedTxt: { fontSize: 8, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.6 },
  accountDesc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.80)', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 } as any,
  chip: { backgroundColor: 'rgba(111,175,242,0.15)', borderWidth: 1, borderColor: 'rgba(111,175,242,0.25)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.primaryLight },
  chipWhite: { backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipWhiteTxt: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  premiumRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(245,192,83,0.10)',
    borderRadius: 10, padding: 11,
    borderWidth: 1, borderColor: 'rgba(245,192,83,0.28)',
  },
  premiumTxt: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(245,192,83,0.90)', flex: 1, lineHeight: 16 },
});
