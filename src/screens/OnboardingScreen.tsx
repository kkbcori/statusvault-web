// ═══════════════════════════════════════════════════════════════
// OnboardingScreen v5 — Smart onboarding with visa status setup
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, typography } from '../theme';
import { useStore } from '../store';
import { IS_WEB } from '../utils/responsive';
import { DOCUMENT_TEMPLATES } from '../utils/templates';
import { AppIcon } from '../utils/icons';
import { UserDocument } from '../types';

// ─── Visa profile options ─────────────────────────────────────
const VISA_PROFILES = [
  {
    id: 'f1-opt',
    icon: '🎓',
    label: 'F-1 Student / OPT',
    desc: 'Current student or recent graduate on OPT',
    docs: ['f1-visa', 'i20', 'sevis', 'passport', 'opt-ead'],
  },
  {
    id: 'f1-stem',
    icon: '🔬',
    label: 'F-1 STEM OPT',
    desc: 'STEM graduate on 24-month OPT extension',
    docs: ['f1-visa', 'i20', 'sevis', 'passport', 'stem-opt'],
  },
  {
    id: 'h1b',
    icon: '💼',
    label: 'H-1B Worker',
    desc: 'Employer-sponsored specialty occupation',
    docs: ['h1b-visa', 'h1b-approval', 'passport', 'i94'],
  },
  {
    id: 'h1b-family',
    icon: '👨‍👩‍👧',
    label: 'H-4 Dependent',
    desc: 'Spouse or child of H-1B holder',
    docs: ['h4-visa', 'h4-ead', 'passport', 'i94'],
  },
  {
    id: 'green-card',
    icon: '🏛️',
    label: 'Green Card Holder',
    desc: 'Lawful Permanent Resident',
    docs: ['green-card', 'passport', 'i94'],
  },
  {
    id: 'l1',
    icon: '🌐',
    label: 'L-1 / L-2',
    desc: 'Intracompany transfer or dependent',
    docs: ['l1-visa', 'l2-ead', 'passport', 'i94'],
  },
  {
    id: 'j1',
    icon: '🔄',
    label: 'J-1 Exchange Visitor',
    desc: 'Exchange visitor or trainee',
    docs: ['j1-visa', 'ds2019', 'passport', 'i94'],
  },
  {
    id: 'other',
    icon: '📋',
    label: 'Other / Skip',
    desc: "I'll set up my documents manually",
    docs: [],
  },
];

type Step = 'welcome' | 'visa-select' | 'confirm-docs' | 'done';

export const OnboardingScreen: React.FC = () => {
  const navigation   = useNavigation<any>();
  const setOnboarded = useStore((s) => s.setOnboarded);
  const addDocument  = useStore((s) => s.addDocument);

  const [step,           setStep]           = useState<Step>('welcome');
  const [selectedProfile, setSelectedProfile] = useState<typeof VISA_PROFILES[0] | null>(null);
  const [selectedDocs,   setSelectedDocs]   = useState<string[]>([]);
  const [adding,         setAdding]         = useState(false);

  const handleProfileSelect = (profile: typeof VISA_PROFILES[0]) => {
    setSelectedProfile(profile);
    setSelectedDocs(profile.docs);
    setStep('confirm-docs');
  };

  const toggleDoc = (id: string) => {
    setSelectedDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleFinish = async () => {
    setAdding(true);
    // Add selected documents with placeholder expiry date (1 year from now)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    const defaultExpiry = oneYearFromNow.toISOString().split('T')[0];

    for (const docId of selectedDocs) {
      const template = DOCUMENT_TEMPLATES.find((t) => t.id === docId);
      if (!template) continue;
      const doc: UserDocument = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        templateId: template.id,
        label: template.label,
        category: template.category,
        expiryDate: defaultExpiry,
        alertDays: template.alertDays,
        icon: template.icon,
        notes: '⚠️ Update expiry date',
        notificationIds: [],
        createdAt: new Date().toISOString(),
      };
      await addDocument(doc);
    }
    setOnboarded();
  };

  const handleSkip = () => setOnboarded();
  const handleSignIn = () => { setOnboarded(); setTimeout(() => navigation.navigate('Auth'), 100); };

  // ── WELCOME STEP ─────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <LinearGradient colors={['#0A1628', '#132847', '#1B3A65']} style={styles.container}>
        <View style={styles.logoWrap}>
          <Image source={require('../../assets/logo.jpg')} style={styles.logo as any} resizeMode="contain" />
        </View>
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <AppIcon name="travel" size={72} />
          </View>
          <Text style={styles.title}>Welcome to StatusVault</Text>
          <View style={styles.goldBar} />
          <Text style={styles.desc}>
            Your immigration documents, deadlines, and travel history — organized, tracked, and secure.
          </Text>
          <View style={styles.featureList}>
            {[
              { icon: 'visa_approved' as const, text: '25+ immigration document types' },
              { icon: 'timer'         as const, text: 'Smart deadline alerts' },
              { icon: 'travel_plane'  as const, text: 'I-94 travel history & N-400 export' },
              { icon: 'checklist'     as const, text: 'AES-256 encrypted, 100% private' },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <AppIcon name={f.icon} size={36} style={{ marginRight: 4 }} />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('visa-select')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleSignIn}>
            <Text style={styles.secondaryBtnText}>Sign in to existing account</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip} style={{ paddingVertical: 8 }}>
            <Text style={styles.skipText}>Skip setup</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.privacy}>
          <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.3)" />
          <Text style={styles.privacyText}>AES-256 encrypted · We cannot read your data</Text>
        </View>
      </LinearGradient>
    );
  }

  // ── VISA SELECT STEP ─────────────────────────────────────────
  if (step === 'visa-select') {
    return (
      <LinearGradient colors={['#0A1628', '#132847', '#1B3A65']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep('welcome')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepEye}>STEP 1 OF 2</Text>
              <Text style={styles.stepTitle}>What's your visa status?</Text>
              <Text style={styles.stepDesc}>We'll pre-load the right documents for you</Text>
            </View>
          </View>
          <View style={styles.profileGrid}>
            {VISA_PROFILES.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={styles.profileCard}
                onPress={() => handleProfileSelect(profile)}
                activeOpacity={0.8}
              >
                {typeof profile.icon === 'string' && profile.icon.length > 2
                  ? <AppIcon name={profile.icon as any} size={36} />
                  : <Text style={styles.profileIcon}>{profile.icon}</Text>
                }
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileLabel}>{profile.label}</Text>
                  <Text style={styles.profileDesc}>{profile.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── CONFIRM DOCS STEP ─────────────────────────────────────────
  if (step === 'confirm-docs' && selectedProfile) {
    const docsToShow = selectedProfile.docs.length > 0
      ? selectedProfile.docs.map((id) => DOCUMENT_TEMPLATES.find((t) => t.id === id)).filter(Boolean)
      : [];

    return (
      <LinearGradient colors={['#0A1628', '#132847', '#1B3A65']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.stepHeader}>
            <TouchableOpacity onPress={() => setStep('visa-select')} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepEye}>STEP 2 OF 2</Text>
              <Text style={styles.stepTitle}>Confirm your documents</Text>
              <Text style={styles.stepDesc}>
                {docsToShow.length > 0
                  ? `These will be added with a placeholder date — update each one with your real expiry date`
                  : 'You can add documents manually from the Documents tab'}
              </Text>
            </View>
          </View>

          {docsToShow.length > 0 && (
            <View style={styles.docList}>
              {docsToShow.map((template: any) => (
                <TouchableOpacity
                  key={template.id}
                  style={[styles.docRow, selectedDocs.includes(template.id) && styles.docRowSelected]}
                  onPress={() => toggleDoc(template.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, selectedDocs.includes(template.id) && styles.checkboxChecked]}>
                    {selectedDocs.includes(template.id) && (
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.docIcon}>{template.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docLabel}>{template.label}</Text>
                    <Text style={styles.docAlerts}>
                      Alerts at: {template.alertDays.map((d: number) => `${d}d`).join(', ')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color="rgba(201,163,81,0.7)" />
            <Text style={styles.noteText}>
              All documents will be added with a 1-year placeholder expiry. Go to Documents tab to set the real dates.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, adding && { opacity: 0.6 }]}
            onPress={handleFinish}
            disabled={adding}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {adding ? 'Setting up...' : `Add ${selectedDocs.length} document${selectedDocs.length !== 1 ? 's' : ''} & Continue →`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleSkip}>
            <Text style={styles.secondaryBtnText}>Skip — I'll add documents manually</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container:    { flex: 1 },
  scrollContent:{ paddingHorizontal: IS_WEB ? '10%' as any : 20, paddingTop: 60, paddingBottom: 40 },
  logoWrap:     { position: 'absolute', top: 20, left: 24, zIndex: 10 },
  logo:         { width: 130, height: 40, borderRadius: 8 },
  card:         { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: IS_WEB ? 40 : 28,
                  alignItems: 'center', maxWidth: IS_WEB ? 480 : undefined, width: IS_WEB ? '100%' : undefined,
                  alignSelf: IS_WEB ? 'center' : undefined, marginTop: IS_WEB ? 80 : 100,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  iconRing:     { width: 90, height: 90, borderRadius: 45, borderWidth: 2,
                  borderColor: 'rgba(201,163,81,0.3)', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, backgroundColor: 'rgba(201,163,81,0.08)' },
  title:        { fontSize: IS_WEB ? 26 : 22, fontFamily: 'Inter_800ExtraBold', color: '#fff',
                  textAlign: 'center', letterSpacing: -0.5, marginBottom: 10 },
  goldBar:      { width: 36, height: 3, backgroundColor: '#C9A351', borderRadius: 2, marginBottom: 14, opacity: 0.7 },
  desc:         { fontSize: 14, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.55)',
                  textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  featureList:  { width: '100%', gap: 10, marginBottom: 24 },
  featureRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon:  { fontSize: 18, width: 28 },
  featureText:  { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.7)' },
  primaryBtn:   { width: '100%', backgroundColor: '#C9A351', borderRadius: 12,
                  paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  primaryBtnText:{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0A1628' },
  secondaryBtn: { paddingVertical: 10 },
  secondaryBtnText:{ fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.4)' },
  skipText:     { fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter_400Regular' },
  privacy:      { position: 'absolute', bottom: 20, alignSelf: 'center',
                  flexDirection: 'row', alignItems: 'center', gap: 5 },
  privacyText:  { fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter_400Regular' },
  // Visa select
  stepHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 24 },
  backBtn:      { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)',
                  alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  stepEye:      { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: '#C9A351',
                  letterSpacing: 1.5, marginBottom: 4 },
  stepTitle:    { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginBottom: 4 },
  stepDesc:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.45)', lineHeight: 19 },
  profileGrid:  { gap: 10 },
  profileCard:  { flexDirection: 'row', alignItems: 'center', gap: 14,
                  backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  profileIcon:  { fontSize: 26 },
  profileLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 2 },
  profileDesc:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.45)' },
  // Doc confirm
  docList:      { gap: 8, marginBottom: 16 },
  docRow:       { flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 14,
                  borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  docRowSelected:{ backgroundColor: 'rgba(201,163,81,0.1)', borderColor: 'rgba(201,163,81,0.2)' },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                  borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked:{ backgroundColor: '#C9A351', borderColor: '#C9A351' },
  docIcon:      { fontSize: 20 },
  docLabel:     { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  docAlerts:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  noteCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                  backgroundColor: 'rgba(201,163,81,0.08)', borderRadius: 10, padding: 12,
                  borderWidth: 1, borderColor: 'rgba(201,163,81,0.15)', marginBottom: 20 },
  noteText:     { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular',
                  color: 'rgba(201,163,81,0.7)', lineHeight: 18 },
});
