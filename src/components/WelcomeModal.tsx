import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
        <LinearGradient colors={['#0A0E1A', '#1E1B4B']} style={s.header}>
          {/* Decorative orbs */}
          <View style={s.orb1} />
          <View style={s.orb2} />
          <View style={s.logoBox}>
            <Ionicons name="shield-checkmark" size={28} color="#818CF8" />
          </View>
          <Text style={s.title}>StatusVault</Text>
          <Text style={s.subtitle}>Your immigration documents, protected</Text>
          <View style={s.privacyPill}>
            <Ionicons name="lock-closed" size={10} color="#A5B4FC" />
            <Text style={s.privacyTxt}>100% private · AES-256 · on your device</Text>
          </View>
        </LinearGradient>

        <View style={s.body}>
          <Text style={s.chooseLabel}>Choose how to start</Text>

          {/* Guest */}
          <TouchableOpacity style={s.guestCard} onPress={onGuest} activeOpacity={0.85}>
            <View style={s.guestIconBox}>
              <Ionicons name="phone-portrait-outline" size={20} color="#64748B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.guestTitle}>Continue as Guest</Text>
              <Text style={s.guestDesc}>No sign-up · explore with limited access</Text>
              <View style={s.chips}>
                {['1 document','1 checklist','1 timer','No family'].map(l => (
                  <View key={l} style={s.chip}><Text style={s.chipTxt}>{l}</Text></View>
                ))}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Create Account — premium CTA */}
          <TouchableOpacity style={s.accountCard} onPress={onCreateAccount} activeOpacity={0.88}>
            <LinearGradient colors={['#4F46E5', '#7C3AED']} style={s.accountGrad}>
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
                  {['2 documents','1 family + 1 doc','1 checklist','1 timer'].map(l => (
                    <View key={l} style={s.chipWhite}><Text style={s.chipWhiteTxt}>{l}</Text></View>
                  ))}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Premium teaser */}
          <LinearGradient colors={['#FFFBEB', '#FEF3C7']} style={s.premiumRow}>
            <Ionicons name="star" size={13} color="#D97706" />
            <Text style={s.premiumTxt}>
              <Text style={{ fontFamily: 'Inter_700Bold', color: '#92400E' }}>Premium $3.99/yr — </Text>
              Unlimited docs · family · PDF export · all checklists
            </Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  </Modal>
);

const s = StyleSheet.create({
  overlay:         { flex: 1, backgroundColor: 'rgba(15,23,42,0.80)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:            { width: '100%', maxWidth: 440, borderRadius: 24, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 24px 64px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.06)' } as any }) } as any,
  header:          { padding: 28, alignItems: 'center', overflow: 'hidden', position: 'relative' as any },
  orb1:            { position: 'absolute' as any, top: -40, right: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(79,70,229,0.15)' },
  orb2:            { position: 'absolute' as any, bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(124,58,237,0.10)' },
  logoBox:         { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(79,70,229,0.15)', borderWidth: 1, borderColor: 'rgba(129,140,248,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title:           { fontSize: 24, fontFamily: 'Inter_800ExtraBold', color: '#F8FAFF', letterSpacing: -0.5 },
  subtitle:        { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(203,213,225,0.60)', marginTop: 4, marginBottom: 14 },
  privacyPill:     { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(79,70,229,0.15)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(129,140,248,0.20)' },
  privacyTxt:      { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#A5B4FC' },
  body:            { backgroundColor: '#FFFFFF', padding: 20, gap: 10 } as any,
  chooseLabel:     { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#94A3B8', textAlign: 'center', letterSpacing: 0.5, textTransform: 'uppercase' as any, marginBottom: 4 },
  guestCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', padding: 14, backgroundColor: '#F8FAFF' },
  guestIconBox:    { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  guestTitle:      { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#334155', marginBottom: 2 },
  guestDesc:       { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#94A3B8', marginBottom: 8 },
  accountCard:     { borderRadius: 14, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 4px 20px rgba(79,70,229,0.30)' } as any }) } as any,
  accountGrad:     { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  accountIconBox:  { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  accountTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  accountTitle:    { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  recommendedBadge:{ backgroundColor: 'rgba(255,255,255,0.20)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  recommendedTxt:  { fontSize: 8, fontFamily: 'Inter_700Bold', color: '#fff', letterSpacing: 0.5 },
  accountDesc:     { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.70)', marginBottom: 8 },
  chips:           { flexDirection: 'row', flexWrap: 'wrap', gap: 4 } as any,
  chip:            { backgroundColor: '#EEF2FF', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  chipTxt:         { fontSize: 10, fontFamily: 'Inter_500Medium', color: '#4F46E5' },
  chipWhite:       { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  chipWhiteTxt:    { fontSize: 10, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.90)' },
  premiumRow:      { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 10, padding: 11, borderWidth: 1, borderColor: '#FDE68A' },
  premiumTxt:      { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#78350F', flex: 1, lineHeight: 16 },
});
