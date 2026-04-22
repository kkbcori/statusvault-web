// ═══════════════════════════════════════════════════════════════
// VisaToolsScreen v2 · Midnight Glass
// Clean link cards for official immigration resources
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IS_WEB } from '../utils/responsive';
import { colors } from '../theme';

interface LinkItem { label: string; url: string; desc: string; }
interface ToolSection { icon: string; title: string; color: string; links: LinkItem[]; }

const SECTIONS: ToolSection[] = [
  {
    icon: '📋', title: 'USCIS Case Status', color: colors.primaryLight,
    links: [
      { label: 'Check My Case Status',       url: 'https://egov.uscis.gov/casestatus/landing.do', desc: 'Track your receipt number on USCIS e-Gov' },
      { label: 'Processing Times',           url: 'https://egov.uscis.gov/processing-times/',     desc: 'Official USCIS processing time estimates by form' },
      { label: 'Case Inquiry (Emma)',        url: 'https://www.uscis.gov/about-us/contact-us',    desc: 'Contact USCIS or chat with Emma virtual assistant' },
    ],
  },
  {
    icon: '💼', title: 'H-1B Resources', color: colors.info,
    links: [
      { label: 'H-1B Employer Data Hub (USCIS)',   url: 'https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub', desc: 'Search H-1B petitions filed by any employer' },
      { label: 'H-1B Performance Data (DOL)',      url: 'https://www.dol.gov/agencies/eta/foreign-labor/performance',             desc: 'Official DOL H-1B disclosure data by employer and year' },
      { label: 'LCA Wage Search (DOL OFLC)',       url: 'https://flag.dol.gov/wage-data/wage-search',                             desc: 'Official DOL prevailing wage lookup for H-1B / LCA positions' },
      { label: 'H-1B Visa Bulletin',               url: 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html', desc: 'Monthly priority date cutoffs from State Dept' },
    ],
  },
  {
    icon: '🎓', title: 'F-1 / OPT / STEM', color: colors.success,
    links: [
      { label: 'SEVIS I-901 Fee Info (ICE)',       url: 'https://www.ice.gov/sevis/i901',                                          desc: 'Official ICE page for SEVIS fee requirements and payment' },
      { label: 'OPT / STEM OPT Info (USCIS)',      url: 'https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students', desc: 'Official OPT rules, timelines and filing tips' },
      { label: 'I-20 & DSO Lookup (ICE)',          url: 'https://studyinthestates.dhs.gov',                                        desc: 'Study in the States — DSO resources and F-1 info' },
      { label: 'STEM OPT Extension Guide',         url: 'https://www.ice.gov/sevis/practical-training',                            desc: 'ICE official STEM OPT extension requirements' },
    ],
  },
  {
    icon: '🏛️', title: 'Green Card / Immigrant Visa', color: colors.gold,
    links: [
      { label: 'Priority Dates — Visa Bulletin',        url: 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html', desc: 'Latest monthly visa bulletin from State Dept' },
      { label: 'PERM Labor Certification (DOL)',        url: 'https://www.dol.gov/agencies/eta/foreign-labor/programs/permanent', desc: 'DOL PERM application status and filing info' },
      { label: 'I-485 Adjustment of Status (USCIS)',    url: 'https://www.uscis.gov/i-485',                                      desc: 'File or check status of your AOS application' },
      { label: 'National Visa Center (NVC)',            url: 'https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/step-1-submit-a-petition/step-2-begin-nvc-processing.html', desc: 'NVC case status and document submission' },
      { label: 'Green Card Through Investment (EB-5)',  url: 'https://www.uscis.gov/working-in-the-united-states/permanent-workers/eb-5-immigrant-investor-program', desc: 'EB-5 investor program details and requirements' },
    ],
  },
  {
    icon: '✈️', title: 'Travel & Passport', color: colors.danger,
    links: [
      { label: 'I-94 Arrival / Departure Records',      url: 'https://i94.cbp.dhs.gov/I94', desc: 'Check or retrieve your official I-94 record' },
      { label: 'Passport Renewal (US Dept of State)',   url: 'https://travel.state.gov/content/travel/en/passports/need-passport/renew-adult-passport.html', desc: 'Renew your US passport online or by mail' },
      { label: 'Indian Passport (Embassy of India)',    url: 'https://www.cgisf.gov.in/page/passport-services/', desc: 'Official Indian consulate passport services in the US' },
      { label: 'Global Entry / TSA PreCheck',           url: 'https://ttp.cbp.dhs.gov', desc: 'Apply or renew Trusted Traveler Programs' },
      { label: 'ESTA (Visa Waiver)',                    url: 'https://esta.cbp.dhs.gov', desc: 'Apply for ESTA authorization for VWP countries' },
    ],
  },
  {
    icon: '📞', title: 'Official Contacts', color: '#a78bfa',
    links: [
      { label: 'USCIS Contact Center',                  url: 'https://www.uscis.gov/about-us/contact-us', desc: 'Call 1-800-375-5283 or chat with Emma' },
      { label: 'US Visa Appointment (State Dept)',      url: 'https://travel.state.gov/content/travel/en/us-visas/visa-information-resources/appointment-wait-times.html', desc: 'Official State Dept visa appointment wait times and scheduling info' },
      { label: 'EOIR Immigration Court',                url: 'https://www.justice.gov/eoir', desc: 'Find immigration court hearings and EOIR info' },
      { label: 'ICE SEVIS Info',                        url: 'https://www.ice.gov/sevis', desc: 'SEVIS program information for F, M, and J visa holders' },
    ],
  },
];

export const VisaToolsScreen: React.FC = () => (
  <ScrollView style={s.container} contentContainerStyle={[s.content, IS_WEB && s.contentWeb]} showsVerticalScrollIndicator={true}>
    {/* Header */}
    <View style={s.header}>
      <View style={s.headerIcon}>
        <Ionicons name="globe-outline" size={22} color={colors.primaryLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle}>Visa & Immigration Tools</Text>
        <Text style={s.headerSub}>Official .gov sources only — opens in your browser</Text>
      </View>
    </View>

    {SECTIONS.map((section) => (
      <View key={section.title} style={s.section}>
        <View style={s.sectionHeader}>
          <View style={[s.sectionIconBox, { backgroundColor: section.color + '18', borderColor: section.color + '35' }]}>
            <Text style={s.sectionIcon}>{section.icon}</Text>
          </View>
          <Text style={s.sectionTitle}>{section.title}</Text>
        </View>

        <View style={s.card}>
          {section.links.map((link, idx) => (
            <TouchableOpacity
              key={link.url}
              style={[s.linkRow, idx < section.links.length - 1 && s.linkRowBorder]}
              onPress={() => Linking.openURL(link.url).catch(() => {})}
              activeOpacity={0.75}
            >
              <View style={s.linkText}>
                <Text style={[s.linkLabel, { color: section.color }]}>{link.label}</Text>
                <Text style={s.linkDesc}>{link.desc}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={section.color} style={{ opacity: 0.8 }} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ))}

    <View style={s.footer}>
      <Ionicons name="information-circle-outline" size={14} color="rgba(240,244,255,0.40)" />
      <Text style={s.footerText}>All links open official government or trusted immigration websites.</Text>
    </View>
  </ScrollView>
);

const glass = (blur = 16) => Platform.OS === 'web' ? ({ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` } as any) : {};

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: 'transparent' },
  content:     { paddingBottom: 40, paddingHorizontal: 16, paddingTop: 16 },
  contentWeb:  { paddingHorizontal: 24, paddingTop: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 18, marginBottom: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    ...glass(16),
  } as any,
  headerIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(59,139,232,0.14)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -0.4 },
  headerSub:   { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)', marginTop: 3 },

  section:        { marginBottom: 22 },
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionIconBox: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionIcon:    { fontSize: 18 },
  sectionTitle:   { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#F0F4FF', letterSpacing: 0.3 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    ...glass(16),
  } as any,
  linkRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10 },
  linkRowBorder:  { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  linkText:       { flex: 1 },
  linkLabel:      { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 3, letterSpacing: -0.1 },
  linkDesc:       { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', lineHeight: 16 },
  footer:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4, marginTop: 4 },
  footerText:     { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.45)', flex: 1, lineHeight: 16 },
});
