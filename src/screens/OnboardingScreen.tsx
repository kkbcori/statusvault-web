// ═══════════════════════════════════════════════════════════════
// OnboardingScreen v3 — Sign In / Create Account on last slide
// ═══════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, ViewToken, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { useStore } from '../store';

const { width } = Dimensions.get('window');
const SLIDE_WIDTH = Platform.OS === 'web' ? Math.min(width, 480) : width;

interface Slide {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradientColors: string[];
  decoration: string[];
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: '🌍',
    title: 'Track Every\nDeadline',
    description: 'Visa expirations, OPT timelines, passport renewals, I-20s — organized and tracked. 100% offline, your data stays on your device.',
    gradientColors: ['#0A1628', '#132847', '#1B3A65'],
    decoration: ['✈️', '🛂', '🗺️', '🌐'],
  },
  {
    id: '2',
    icon: '🔔',
    title: 'Smart\nAlerts',
    description: 'Document-specific notification windows. H-1B alerts 6 months early. OPT at 90 days. Passports at 6 months before expiry.',
    gradientColors: ['#1B3A65', '#1E4D8C', '#2563EB'],
    decoration: ['⏰', '📅', '🔔', '📱'],
  },
  {
    id: '3',
    icon: '☁️',
    title: 'Sync Across\nDevices',
    description: 'Create a free account to sync your data across phone, tablet and web. AES-256 encrypted — even we cannot read your data.',
    gradientColors: ['#0A1628', '#0F2040', '#1B3A65'],
    decoration: ['🔒', '📱', '💻', '🌐'],
  },
];

export const OnboardingScreen: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef  = useRef<FlatList>(null);
  const navigation   = useNavigation<any>();
  const setOnboarded = useStore((s) => s.setOnboarded);
  const isLastSlide  = currentIndex === SLIDES.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const completeOnboarding = () => setOnboarded();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const handleSignIn = () => {
    setOnboarded();
    setTimeout(() => navigation.navigate('Auth'), 100);
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <LinearGradient colors={item.gradientColors as any} style={[styles.slide, { width: SLIDE_WIDTH }]}>
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
      <View style={styles.cornerTL}><View style={styles.cornerBorder} /></View>
      <View style={styles.cornerBR}><View style={styles.cornerBorder} /></View>
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
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({ length: SLIDE_WIDTH, offset: SLIDE_WIDTH * index, index })}
      />

      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
          ))}
        </View>

        {/* Last slide: show Sign In + Create Account + Skip */}
        {isLastSlide ? (
          <View style={styles.authButtons}>
            {/* Primary: Create Account */}
            <TouchableOpacity style={styles.createBtn} onPress={handleSignIn} activeOpacity={0.85}>
              <LinearGradient colors={[colors.accent, '#D4B56A']} style={styles.createBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="person-add-outline" size={18} color={colors.primary} />
                <Text style={styles.createBtnText}>Create Account / Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary: Continue without account */}
            <TouchableOpacity style={styles.skipAccountBtn} onPress={completeOnboarding} activeOpacity={0.7}>
              <Text style={styles.skipAccountText}>Continue without account</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.4)" />
            </TouchableOpacity>

            {/* Privacy note */}
            <View style={styles.privacyRow}>
              <Ionicons name="lock-closed" size={11} color="rgba(201,163,81,0.6)" />
              <Text style={styles.privacyNote}>AES-256 encrypted · We cannot read your data</Text>
            </View>
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

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.primary },
  slide:          { flex: 1, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  slideContent:   { alignItems: 'center', paddingHorizontal: 40, zIndex: 10 },
  floatingIcon:   { position: 'absolute', zIndex: 1 },
  goldLineTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, opacity: 0.3 },
  cornerTL:       { position: 'absolute', top: 50, left: 20 },
  cornerBR:       { position: 'absolute', bottom: 200, right: 20 },
  cornerBorder:   { width: 24, height: 24, borderTopWidth: 2, borderLeftWidth: 2, borderColor: 'rgba(201,163,81,0.15)', borderTopLeftRadius: 4 },
  iconRing:       { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: 'rgba(201,163,81,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  iconInner:      { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(201,163,81,0.1)', alignItems: 'center', justifyContent: 'center' },
  mainIcon:       { fontSize: 42 },
  slideTitle:     { fontSize: 32, fontFamily: 'Inter_900Black', color: '#fff', textAlign: 'center', letterSpacing: -0.5, lineHeight: 38, marginBottom: 12 },
  goldBar:        { width: 40, height: 3, backgroundColor: colors.accent, borderRadius: 2, marginBottom: 16, opacity: 0.7 },
  slideDescription:{ ...typography.body, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 24, maxWidth: 300 },
  watermark:      { position: 'absolute', bottom: 200, ...typography.micro, color: 'rgba(201,163,81,0.08)', letterSpacing: 6, fontSize: 10 },

  // Footer
  footer:         { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 44 : 32, alignItems: 'center' },
  dots:           { flexDirection: 'row', gap: 8, marginBottom: 20 },
  dot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive:      { width: 28, backgroundColor: colors.accent },

  // Nav buttons (slides 1-2)
  navButtons:     { width: '100%', alignItems: 'center' },
  button:         { width: '100%', borderRadius: radius.md, overflow: 'hidden', marginBottom: 4 },
  buttonGradient: { paddingVertical: 17, alignItems: 'center', borderRadius: radius.md },
  buttonText:     { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: colors.primary, letterSpacing: 0.3 },
  skipButton:     { paddingVertical: 14 },
  skipText:       { ...typography.bodySemibold, color: 'rgba(255,255,255,0.4)' },

  // Auth buttons (last slide)
  authButtons:    { width: '100%', alignItems: 'center', gap: 0 },
  createBtn:      { width: '100%', borderRadius: radius.md, overflow: 'hidden', marginBottom: 12 },
  createBtnGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: radius.md },
  createBtnText:  { fontSize: 16, fontFamily: 'Inter_800ExtraBold', color: colors.primary },
  skipAccountBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  skipAccountText:{ fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.45)' },
  privacyRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  privacyNote:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(201,163,81,0.5)' },
});
