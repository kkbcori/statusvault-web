import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const EMAIL_GENERAL  = 'contact@kkbcori.com';
const EMAIL_SUPPORT  = 'statusvault@kkbcori.com';

const openEmail = (address: string) => {
  Linking.openURL(`mailto:${address}`).catch(() => {});
};

export const ContactScreen: React.FC = () => {
  return (
    <ScrollView style={s.container} contentContainerStyle={s.cc} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={s.headerWrap}>
        <View style={s.header}>
          <View style={s.headerIcon}>
            <Ionicons name="mail-outline" size={20} color={colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Contact Us</Text>
            <Text style={s.headerSub}>We'd love to hear from you</Text>
          </View>
        </View>
      </View>

      {/* Intro */}
      <View style={s.introCard}>
        <Text style={s.introText}>
          Have a question, feedback, or need help with your immigration document tracking?
          Reach out to us directly — we read every email.
        </Text>
      </View>

      {/* Email cards */}
      <Text style={s.sectionLabel}>GET IN TOUCH</Text>

      <TouchableOpacity style={s.emailCard} onPress={() => openEmail(EMAIL_SUPPORT)} activeOpacity={0.75}>
        <View style={[s.emailIconBox, { backgroundColor: 'rgba(59,139,232,0.15)', borderColor: 'rgba(111,175,242,0.30)' }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primaryLight} />
        </View>
        <View style={s.emailBody}>
          <Text style={s.emailLabel}>App Support & Bug Reports</Text>
          <Text style={s.emailAddress}>{EMAIL_SUPPORT}</Text>
          <Text style={s.emailHint}>For questions about the app, document tracking, account issues, or to report a bug.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(240,244,255,0.30)" />
      </TouchableOpacity>

      <TouchableOpacity style={s.emailCard} onPress={() => openEmail(EMAIL_GENERAL)} activeOpacity={0.75}>
        <View style={[s.emailIconBox, { backgroundColor: 'rgba(76,217,138,0.15)', borderColor: 'rgba(76,217,138,0.30)' }]}>
          <Ionicons name="business-outline" size={22} color={colors.success} />
        </View>
        <View style={s.emailBody}>
          <Text style={s.emailLabel}>General & Business Enquiries</Text>
          <Text style={[s.emailAddress, { color: colors.success }]}>{EMAIL_GENERAL}</Text>
          <Text style={s.emailHint}>For partnerships, press, or general questions about KKB CoRi Technologies.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="rgba(240,244,255,0.30)" />
      </TouchableOpacity>

      {/* Response time */}
      <View style={s.noteCard}>
        <Ionicons name="time-outline" size={16} color="rgba(240,244,255,0.55)" style={{ marginTop: 1 }} />
        <Text style={s.noteText}>We typically respond within 1–2 business days. For urgent account issues, please include your registered email in the message.</Text>
      </View>

      {/* Legal */}
      <Text style={s.sectionLabel}>LEGAL</Text>
      <View style={s.legalCard}>
        <TouchableOpacity
          style={s.legalRow}
          onPress={() => Linking.openURL('https://www.statusvault.org/privacy').catch(() => {})}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={16} color="rgba(240,244,255,0.65)" />
          <Text style={s.legalText}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={14} color="rgba(240,244,255,0.35)" style={{ marginLeft: 'auto' as any }} />
        </TouchableOpacity>
        <View style={s.div} />
        <TouchableOpacity
          style={s.legalRow}
          onPress={() => Linking.openURL('https://www.statusvault.org/terms').catch(() => {})}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={16} color="rgba(240,244,255,0.65)" />
          <Text style={s.legalText}>Terms of Service</Text>
          <Ionicons name="open-outline" size={14} color="rgba(240,244,255,0.35)" style={{ marginLeft: 'auto' as any }} />
        </TouchableOpacity>
      </View>

      <Text style={s.footer}>StatusVault · KKB CoRi Technologies · statusvault.org</Text>
    </ScrollView>
  );
};

const glass = (blur = 16) => Platform.OS === 'web' ? ({ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` } as any) : {};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: 'transparent' },
  cc:           { paddingBottom: 48 },
  headerWrap:   { paddingBottom: 4 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  headerIcon:   { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(59,139,232,0.14)', borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -0.4 },
  headerSub:    { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)', marginTop: 2 },

  introCard: {
    marginHorizontal: spacing.screen, marginVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', ...glass(16),
  } as any,
  introText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.75)', lineHeight: 20 },

  sectionLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: 'rgba(240,244,255,0.40)', letterSpacing: 1.4, marginHorizontal: spacing.screen, marginTop: 22, marginBottom: 10, textTransform: 'uppercase' as any } as any,

  emailCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.screen, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 16, padding: 16,
    ...glass(16),
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 2px 12px rgba(0,0,0,0.28)' } as any) : {}),
  } as any,
  emailIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 1 },
  emailBody:    { flex: 1, gap: 2 } as any,
  emailLabel:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF' },
  emailAddress: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.primaryLight, marginTop: 2 },
  emailHint:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.50)', lineHeight: 16, marginTop: 4 },

  noteCard: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: spacing.screen, marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  noteText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.60)', lineHeight: 18 },

  legalCard: {
    marginHorizontal: spacing.screen, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    ...glass(16),
  } as any,
  legalRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  legalText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.80)', flex: 1 },
  div:       { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginHorizontal: 14 },

  footer: { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.30)', marginTop: 24, marginBottom: 8 },
});
