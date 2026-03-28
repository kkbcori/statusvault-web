// ═══════════════════════════════════════════════════════════════
// OnboardingScreen v4 — Web: full-width step layout
// Mobile: horizontal FlatList swipe
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, ViewToken, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { useStore } from '../store';
import { IS_WEB } from '../utils/responsive';

const { width } = Dimensions.get('window');

interface Slide {
  id: string; icon: string; title: string;
  description: string; gradientColors: string[]; decoration: string[];
}

const SLIDES: Slide[] = [
  {
    id: '1', icon: '🌍', title: 'Track Every Deadline',
    description: 'Visa expirations, OPT timelines, passport renewals, I-20s — organized and tracked. 100% offline, your data stays on your device.',
    gradientColors: ['#0A1628', '#132847', '#1B3A65'], decoration: ['✈️', '🛂', '🗺️', '🌐'],
  },
  {
    id: '2', icon: '🔔', title: 'Smart Alerts',
    description: 'Document-specific notification windows. H-1B alerts 6 months early. OPT at 90 days. Passports at 6 months before expiry.',
    gradientColors: ['#1B3A65', '#1E4D8C', '#2563EB'], decoration: ['⏰', '📅', '🔔', '📱'],
  },
  {
    id: '3', icon: '☁️', title: 'Sync Across Devices',
    description: 'Create a free account to sync your data across phone, tablet and web. AES-256 encrypted — even we cannot read your data.',
    gradientColors: ['#0A1628', '#0F2040', '#1B3A65'], decoration: ['🔒', '📱', '💻', '🌐'],
  },
];

export const OnboardingScreen: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef  = useRef<FlatList>(null);
  const navigation   = useNavigation<any>();
  const setOnboarded = useStore((s) => s.setOnboarded);
  const isLastSlide  = currentIndex === SLIDES.length - 1;
  const slide        = SLIDES[currentIndex];

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null)
        setCurrentIndex(viewableItems[0].index);
    }
  ).current;

  const completeOnboarding = () => setOnboarded();
  const handleSignIn = () => { setOnboarded(); setTimeout(() => navigation.navigate('Auth'), 100); };
  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      if (IS_WEB) {
        setCurrentIndex(currentIndex + 1);
      } else {
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      }
    } else {
      completeOnboarding();
    }
  };

  // ── Web layout: single full-screen slide, step through with buttons ──
  if (IS_WEB) {
    return (
      <LinearGradient colors={slide.gradientColors as any} style={webStyles.container}>
        {/* Logo top-left */}
        <View style={webStyles.logoWrap}>
          <Image source={require('../../assets/logo.jpg')} style={webStyles.logo as any} resizeMode="contain" />
        </View>

        {/* Center card */}
        <View style={webStyles.card}>
          <View style={webStyles.iconRing}>
            <Text style={{ fontSize: 52 }}>{slide.icon}</Text>
          </View>
          <Text style={webStyles.title}>{slide.title}</Text>
          <View style={webStyles.goldBar} />
          <Text style={webStyles.desc}>{slide.description}</Text>

          {/* Dots */}
          <View style={webStyles.dots}>
            {SLIDES.map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setCurrentIndex(i)}>
                <View style={[webStyles.dot, i === currentIndex && webStyles.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Buttons */}
          {isLastSlide ? (
            <>
              <TouchableOpacity style={webStyles.primaryBtn} onPress={handleSignIn} activeOpacity={0.85}>
                <Text style={webStyles.primaryBtnText}>Create Account / Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.secondaryBtn} onPress={completeOnboarding}>
                <Text style={webStyles.secondaryBtnText}>Continue without account →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={webStyles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
                <Text style={webStyles.primaryBtnText}>Continue →</Text>
              </TouchableOpacity>
              <TouchableOpacity style={webStyles.secondaryBtn} onPress={completeOnboarding}>
                <Text style={webStyles.secondaryBtnText}>Skip</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Privacy badge */}
        <View style={webStyles.privacy}>
          <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.3)" />
          <Text style={webStyles.privacyText}>AES-256 encrypted · 100% private</Text>
        </View>
      </LinearGradient>
    );
  }

  // ── Mobile layout: swipeable FlatList ────────────────────────
  const renderSlide = ({ item }: { item: Slide }) => (
    <LinearGradient colors={item.gradientColors as any} style={[styles.slide, { width }]}>
      {item.decoration.map((emoji, i) => (
        <View key={i} style={[styles.floatingIcon, {
          top: 60 + (i % 2) * 80 + Math.sin(i * 1.5) * 40,
          left: i < 2 ? 20 + i * 30 : undefined,
          right: i >= 2 ? 20 + (i - 2) * 30 : undefined,
          opacity: 0.08 + i * 0.02,
          transform: [{ rotate: `${-15 + i * 12}deg` }],
        }]}>
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
        </View>
      ))}
      <View style={styles.goldLineTop} />
      <View style={styles.slideContent}>
        <View style={styles.iconRing}>
          <View style={styles.iconInner}>
            <Text style={styles.mainIcon}>{item.icon}</Text>
          </View>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <View style={styles.goldBar} />
        <Text style={styles.slideDescription}>{item.description}</Text>
      </View>
      <Text style={styles.watermark}>STATUSVAULT</Text>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES} renderItem={renderSlide} keyExtractor={(item) => item.id}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>
        {isLastSlide ? (
          <View style={styles.authButtons}>
            <TouchableOpacity style={styles.createBtn} onPress={handleSignIn} activeOpacity={0.85}>
              <LinearGradient colors={['#C9A351', '#D4B56A', '#C9A351']} style={styles.createBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="person-add-outline" size={18} color="#0A1628" />
                <Text style={styles.createBtnText}>Create Account / Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipAccountBtn} onPress={completeOnboarding} activeOpacity={0.7}>
              <Text style={styles.skipAccountText}>Continue without account</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.navButtons}>
            <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.8}>
              <LinearGradient colors={['#C9A351', '#D4B56A', '#C9A351']} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.buttonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={completeOnboarding}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ── Web styles ────────────────────────────────────────────────
const webStyles = StyleSheet.create({
  container:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap:    { position: 'absolute', top: 24, left: 28 },
  logo:        { width: 140, height: 44, borderRadius: 10 },
  card:        { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: 48, alignItems: 'center', maxWidth: 480, width: '90%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  iconRing:    { width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(201,163,81,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: 'rgba(201,163,81,0.08)' },
  title:       { fontSize: 28, fontFamily: 'Inter_800ExtraBold', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: 12 },
  goldBar:     { width: 40, height: 3, backgroundColor: '#C9A351', borderRadius: 2, marginBottom: 16, opacity: 0.7 },
  desc:        { fontSize: 15, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 24, maxWidth: 360, marginBottom: 28 },
  dots:        { flexDirection: 'row', gap: 8, marginBottom: 24 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive:   { width: 28, backgroundColor: '#C9A351', borderRadius: 4 },
  primaryBtn:  { width: '100%', backgroundColor: '#C9A351', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A1628' },
  secondaryBtn:{ paddingVertical: 12 },
  secondaryBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.45)' },
  privacy:     { position: 'absolute', bottom: 24, flexDirection: 'row', alignItems: 'center', gap: 6 },
  privacyText: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter_400Regular' },
});

// ── Mobile styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0A1628' },
  slide:            { flex: 1, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  slideContent:     { alignItems: 'center', paddingHorizontal: 40, zIndex: 10 },
  floatingIcon:     { position: 'absolute', zIndex: 1 },
  goldLineTop:      { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#C9A351', opacity: 0.3 },
  iconRing:         { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: 'rgba(201,163,81,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  iconInner:        { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(201,163,81,0.1)', alignItems: 'center', justifyContent: 'center' },
  mainIcon:         { fontSize: 42 },
  slideTitle:       { fontSize: 32, fontFamily: 'Inter_900Black', color: '#fff', textAlign: 'center', letterSpacing: -0.5, lineHeight: 38, marginBottom: 12 },
  goldBar:          { width: 40, height: 3, backgroundColor: '#C9A351', borderRadius: 2, marginBottom: 16, opacity: 0.7 },
  slideDescription: { ...typography.body, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 24, maxWidth: 300 },
  watermark:        { position: 'absolute', bottom: 200, ...typography.micro, color: 'rgba(201,163,81,0.08)', letterSpacing: 6, fontSize: 10 },
  footer:           { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 32, alignItems: 'center' },
  dots:             { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dot:              { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive:        { width: 28, backgroundColor: '#C9A351', borderRadius: 4 },
  navButtons:       { width: '100%', alignItems: 'center' },
  button:           { width: '100%', borderRadius: radius.md, overflow: 'hidden', marginBottom: 4 },
  buttonGradient:   { paddingVertical: 17, alignItems: 'center', borderRadius: radius.md },
  buttonText:       { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#0A1628', letterSpacing: 0.3 },
  skipButton:       { paddingVertical: 14 },
  skipText:         { ...typography.bodySemibold, color: 'rgba(255,255,255,0.4)' },
  authButtons:      { width: '100%', alignItems: 'center', gap: 0 },
  createBtn:        { width: '100%', borderRadius: radius.md, overflow: 'hidden', marginBottom: 12 },
  createBtnGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: radius.md },
  createBtnText:    { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: '#0A1628' },
  skipAccountBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  skipAccountText:  { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.45)' },
});
