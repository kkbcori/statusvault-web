import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

const EMAIL_GENERAL  = 'contact@kkbcori.com';
const EMAIL_SUPPORT  = 'statusvault@kkbcori.com';

const openEmail = (address: string) => {
  Linking.openURL(`mailto:${address}`).catch(() => {});
};

export const ContactScreen: React.FC = () => {
  return (
    <ScrollView style={s.container} contentContainerStyle={s.cc} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={s.headerWrap}>
        <View style={s.header}>
          <View style={s.headerIcon}>
            <Ionicons name="mail-outline" size={20} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Contact Us</Text>
            <Text style={s.headerSub}>We'd love to hear from you</Text>
          </View>
        </View>
      </LinearGradient>

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
        <View style={[s.emailIconBox, { backgroundColor: '#EEF2FF' }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#4F46E5" />
        </View>
        <View style={s.emailBody}>
          <Text style={s.emailLabel}>App Support & Bug Reports</Text>
          <Text style={s.emailAddress}>{EMAIL_SUPPORT}</Text>
          <Text style={s.emailHint}>For questions about the app, document tracking, account issues, or to report a bug.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </TouchableOpacity>

      <TouchableOpacity style={s.emailCard} onPress={() => openEmail(EMAIL_GENERAL)} activeOpacity={0.75}>
        <View style={[s.emailIconBox, { backgroundColor: '#F0FDF4' }]}>
          <Ionicons name="business-outline" size={22} color="#059669" />
        </View>
        <View style={s.emailBody}>
          <Text style={s.emailLabel}>General & Business Enquiries</Text>
          <Text style={s.emailAddress}>{EMAIL_GENERAL}</Text>
          <Text style={s.emailHint}>For partnerships, press, or general questions about KKB CoRi Technologies.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
      </TouchableOpacity>

      {/* Response time note */}
      <View style={s.noteCard}>
        <Ionicons name="time-outline" size={16} color="#64748B" style={{ marginTop: 1 }} />
        <Text style={s.noteText}>We typically respond within 1–2 business days. For urgent account issues, please include your registered email in the message.</Text>
      </View>

      {/* Legal links */}
      <Text style={s.sectionLabel}>LEGAL</Text>
      <View style={s.legalCard}>
        <TouchableOpacity
          style={s.legalRow}
          onPress={() => Linking.openURL('https://www.statusvault.org/privacy')}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={16} color="#64748B" />
          <Text style={s.legalText}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={14} color="#CBD5E1" style={{ marginLeft: 'auto' as any }} />
        </TouchableOpacity>
        <View style={s.div} />
        <TouchableOpacity
          style={s.legalRow}
          onPress={() => Linking.openURL('https://www.statusvault.org/terms')}
          activeOpacity={0.7}
        >
          <Ionicons name="document-text-outline" size={16} color="#64748B" />
          <Text style={s.legalText}>Terms of Service</Text>
          <Ionicons name="open-outline" size={14} color="#CBD5E1" style={{ marginLeft: 'auto' as any }} />
        </TouchableOpacity>
      </View>

      <Text style={s.footer}>StatusVault · KKB CoRi Technologies · statusvault.org</Text>

    </ScrollView>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F4F5FA' },
  cc:           { paddingBottom: 48 },
  headerWrap:   { paddingBottom: 8 },
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  headerIcon:   { width: 40, height: 40, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  headerTitle:  { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#0F172A' },
  headerSub:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 1 },

  introCard:    { marginHorizontal: spacing.screen, marginVertical: 12, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  introText:    { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#475569', lineHeight: 20 },

  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#94A3B8', letterSpacing: 1, marginHorizontal: spacing.screen, marginTop: 20, marginBottom: 8 },

  emailCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: spacing.screen, marginBottom: 10, backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(15,23,42,0.06)' } as any }) } as any,
  emailIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emailBody:    { flex: 1, gap: 2 } as any,
  emailLabel:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#0F172A' },
  emailAddress: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#4F46E5', marginTop: 2 },
  emailHint:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#94A3B8', lineHeight: 16, marginTop: 4 },

  noteCard:     { flexDirection: 'row', gap: 10, marginHorizontal: spacing.screen, marginTop: 4, backgroundColor: '#F8FAFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  noteText:     { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#64748B', lineHeight: 18 },

  legalCard:    { marginHorizontal: spacing.screen, marginBottom: 10, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  legalRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  legalText:    { fontSize: 13, fontFamily: 'Inter_500Medium', color: '#475569', flex: 1 },
  div:          { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 14 },

  footer:       { textAlign: 'center', fontSize: 11, fontFamily: 'Inter_400Regular', color: '#CBD5E1', marginTop: 24, marginBottom: 8 },
});
