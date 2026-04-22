// ═══════════════════════════════════════════════════════════════
// OnboardingScreen v2 · Midnight Glass landing page
// Get Started → new account  |  Sign In → existing account
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ImageBackground, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store';
import { IS_WEB } from '../utils/responsive';
import { colors } from '../theme';

const FEATURES = [
  { icon: 'list-outline',      title: 'Immi Checklist',    desc: 'Step-by-step checklists for OPT, H-1B, I-140, I-485, Indian Passport renewal and more', tint: colors.primaryLight },
  { icon: 'timer-outline',     title: 'Immi Timers',       desc: 'Track OPT unemployment days, 60-day grace period, STEM extension caps — auto or manual', tint: colors.gold },
  { icon: 'document-text-outline', title: '25+ Document Types', desc: 'Visa stamps, EAD, I-20, I-94, passports, green card — expiry alerts before it\'s too late', tint: colors.success },
  { icon: 'notifications-outline', title: 'Smart Alerts',      desc: 'App notifications at 180, 90, 30, 15 and 7 days before expiry', tint: colors.info },
  { icon: 'people-outline',    title: 'Family Mode',       desc: 'Track documents for spouse and dependents — H-4, L-2, F-2 and more', tint: '#a78bfa' },
  { icon: 'lock-closed-outline', title: 'AES-256 Encrypted',  desc: 'All data encrypted on device. Your documents are never visible to us', tint: colors.gold },
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
    <View style={s.root}>
      {/* BG */}
      <ImageBackground
        source={require('../../assets/bg-app.png')}
        style={StyleSheet.absoluteFillObject as any}
        imageStyle={{ opacity: 0.32, resizeMode: 'cover' }}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(5,11,28,0.55)' }] as any} />
      {Platform.OS === 'web' && (
        <View pointerEvents="none" style={{
          ...StyleSheet.absoluteFillObject,
          background: 'radial-gradient(ellipse 900px 600px at 50% -10%, rgba(59,139,232,0.28) 0%, transparent 60%)',
        } as any} />
      )}

      <ScrollView contentContainerStyle={[s.scroll, IS_WEB && s.scrollWeb]} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoBadge}>
            <Image source={require('../../assets/logo-transparent.png')} style={{ width: 76, height: 76 }} resizeMode="contain" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 16 }}>
            <Text style={s.logoTextStatus}>Status</Text>
            <Text style={s.logoTextVault}>Vault</Text>
          </View>
          <Text style={s.logoTag}>Immigration Document Tracker</Text>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <Text style={s.heroTitle}>Your documents,{'\n'}always on track.</Text>
          <View style={s.accent} />
          <Text style={s.heroSub}>
            Deadlines, checklists, timers and family — organized, tracked, and secure in one place.
          </Text>
        </View>

        {/* Feature cards */}
        <View style={s.featureGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={s.featureCard}>
              <View style={[s.featureIconBox, { backgroundColor: f.tint + '18', borderColor: f.tint + '38' }]}>
                <Ionicons name={f.icon as any} size={20} color={f.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.featureTitle}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={s.ctas}>
          <TouchableOpacity onPress={goRegister} activeOpacity={0.9}>
            <LinearGradient
              colors={[colors.primary, colors.primaryMid]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.primaryBtn}
            >
              <Ionicons name="person-add-outline" size={18} color="#fff" />
              <Text style={s.primaryBtnTxt}>Get Started — Create Account</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.secondaryBtn} onPress={goLogin} activeOpacity={0.85}>
            <Ionicons name="log-in-outline" size={18} color="rgba(240,244,255,0.85)" />
            <Text style={s.secondaryBtnTxt}>Sign in to existing account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const glass = (blur = 18) => Platform.OS === 'web' ? ({ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` } as any) : {};

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.backgroundDeep },
  scroll:       { flexGrow: 1, padding: 24, paddingTop: 48 },
  scrollWeb:    { maxWidth: 620, alignSelf: 'center', width: '100%', paddingHorizontal: 40 } as any,

  logoWrap:     { alignItems: 'center', marginBottom: 32 },
  logoBadge: {
    width: 108, height: 108, borderRadius: 28,
    backgroundColor: 'rgba(59,139,232,0.10)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.28)',
    alignItems: 'center', justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 48px rgba(59,139,232,0.25)' } as any) : {}),
  } as any,
  logoTextStatus: { fontSize: 30, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -1 },
  logoTextVault:  { fontSize: 30, fontFamily: 'Inter_800ExtraBold', color: colors.primaryLight, letterSpacing: -1 },
  logoTag:      { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.45)', letterSpacing: 1.6, marginTop: 8, textTransform: 'uppercase' as any } as any,

  hero:         { alignItems: 'center', marginBottom: 36 },
  heroTitle:    { fontSize: IS_WEB ? 38 : 30, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', textAlign: 'center', lineHeight: IS_WEB ? 46 : 38, letterSpacing: -1 },
  accent:       { width: 48, height: 4, borderRadius: 2, backgroundColor: colors.gold, marginVertical: 14, ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 12px rgba(245,192,83,0.55)' } as any) : {}) } as any,
  heroSub:      { fontSize: 15, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.65)', textAlign: 'center', lineHeight: 24, maxWidth: 420 },

  featureGrid:  { gap: 10, marginBottom: 36 },
  featureCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    ...glass(16),
  } as any,
  featureIconBox: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  featureTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#F0F4FF', marginBottom: 3 },
  featureDesc:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', lineHeight: 18 },

  ctas:         { gap: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, paddingVertical: 16,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 8px 24px rgba(59,139,232,0.40)' } as any) : {}),
  } as any,
  primaryBtnTxt:{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingVertical: 15,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  secondaryBtnTxt:{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.90)' },
});
