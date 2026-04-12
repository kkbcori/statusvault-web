// ═══════════════════════════════════════════════════════════════
// OnboardingScreen — Landing page
// Get Started → new account  |  Sign In → existing account
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { IS_WEB } from '../utils/responsive';

const FEATURES = [
  { icon: '📋', title: 'Immi Checklist',    desc: 'Step-by-step checklists for OPT, H-1B, I-140, I-485, Indian Passport renewal and more' },
  { icon: '⏱️', title: 'Immi Timers',        desc: 'Track OPT unemployment days, 60-day grace period, STEM extension caps — auto or manual' },
  { icon: '📄', title: '25+ Document Types', desc: 'Visa stamps, EAD, I-20, I-94, passports, green card — expiry alerts before it\'s too late' },
  { icon: '📅', title: 'Smart Alerts',       desc: 'Email & WhatsApp reminders at 180, 90, 30, 15 and 7 days before expiry' },
  { icon: '👨‍👩‍👧', title: 'Family Mode',       desc: 'Track documents for spouse and dependents — H-4, L-2, F-2 and more' },
  { icon: '🔒', title: 'AES-256 Encrypted',  desc: 'All data encrypted on device. Your documents are never visible to us' },
];

export const OnboardingScreen: React.FC = () => {
  const navigation   = useNavigation<any>();
  const setOnboarded = useStore((s) => s.setOnboarded);

  const goRegister = () => {
    setOnboarded();
    setTimeout(() => navigation.navigate('Auth', { mode: 'register' }), 50);
  };

  const goLogin = () => {
    setOnboarded();
    setTimeout(() => navigation.navigate('Auth', { mode: 'login' }), 50);
  };

  return (
    <LinearGradient colors={['#1A1F3C', '#2F3349', '#1A1F3C']} style={s.root}>
      <ScrollView contentContainerStyle={[s.scroll, IS_WEB && s.scrollWeb]} showsVerticalScrollIndicator={true}>

        {/* Logo */}
        <View style={s.logoWrap}>
          {/* Logo image if available */}
          <View style={s.logoMark}>
            <Text style={s.logoText}>StatusVault</Text>
          </View>
          <Text style={s.logoTag}>Immigration Document Tracker</Text>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>Welcome to{'\n'}StatusVault</Text>
          <View style={s.accent} />
          <Text style={s.heroSub}>
            Your immigration documents, deadlines, checklists and family — organized, tracked, and secure.
          </Text>
        </View>

        {/* Feature cards */}
        <View style={s.featureGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[s.featureCard, IS_WEB && s.featureCardWeb]}>
              <Text style={s.featureIcon}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.ctas}>
          <TouchableOpacity style={s.primaryBtn} onPress={goRegister} activeOpacity={0.87}>
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={s.primaryBtnTxt}>Get Started — Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={goLogin} activeOpacity={0.85}>
            <Ionicons name="log-in-outline" size={18} color="rgba(255,255,255,0.85)" />
            <Text style={s.secondaryBtnTxt}>Sign in to existing account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
};

const s = StyleSheet.create({
  root:         { flex: 1 },
  scroll:       { flexGrow: 1, padding: 24, paddingTop: 48 },
  scrollWeb:    { maxWidth: 600, alignSelf: 'center', width: '100%', paddingHorizontal: 40 } as any,
  logoWrap:     { alignItems: 'center', marginBottom: 32 },
  logoMark:     { marginBottom: 6 },
  logoText:     { fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: -1 },
  logoTag:      { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },
  hero:         { alignItems: 'center', marginBottom: 36 },
  heroTitle:    { fontSize: IS_WEB ? 38 : 30, fontFamily: 'Inter_800ExtraBold', color: '#fff', textAlign: 'center', lineHeight: IS_WEB ? 46 : 38, letterSpacing: -1 },
  accent:       { width: 48, height: 4, borderRadius: 2, backgroundColor: '#7367F0', marginVertical: 14 },
  heroSub:      { fontSize: 15, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 24, maxWidth: 400 },
  featureGrid:  { gap: 10, marginBottom: 36 },
  featureCard:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  featureCardWeb: {} as any,
  featureIcon:  { fontSize: 24, marginTop: 1 },
  featureTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 3 },
  featureDesc:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  ctas:         { gap: 12 },
  primaryBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#7367F0', borderRadius: 12, paddingVertical: 16 },
  primaryBtnTxt:{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 12, paddingVertical: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  secondaryBtnTxt:{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.85)' },
});
