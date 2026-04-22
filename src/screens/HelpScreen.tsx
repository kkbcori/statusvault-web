// ═══════════════════════════════════════════════════════════════
// HelpScreen — FAQ, Feature Guide & SEO Content
// Covers all features, document types, checklists, counters,
// notifications, sync, travel tracking, N-400 export, and more.
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { IS_WEB, IS_TABLET } from '../utils/responsive';

// ─── SEO meta injection (web only) ───────────────────────────
if (IS_WEB && typeof document !== 'undefined') {
  const setMeta = (name: string, content: string, prop = false) => {
    const sel = prop ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let el = document.querySelector(sel) as HTMLMetaElement;
    if (!el) { el = document.createElement('meta'); prop ? el.setAttribute('property', name) : el.setAttribute('name', name); document.head.appendChild(el); }
    el.setAttribute('content', content);
  };
  document.title = 'StatusVault Help & FAQ — Immigration Document Tracker';
  setMeta('description', 'Complete guide to StatusVault: track F-1, H-1B, OPT, green card, passport and all immigration documents. FAQs on visa deadlines, OPT unemployment counter, N-400 travel history, and cross-device sync.');
  setMeta('keywords', 'immigration document tracker, F-1 visa tracker, H-1B deadline, OPT unemployment counter, STEM OPT extension, green card expiry, N-400 travel history, I-94 tracker, passport expiry alert, immigration checklist, visa expiry notification');
  setMeta('og:title', 'StatusVault — Immigration Document Tracker Help', true);
  setMeta('og:description', 'Track all your immigration documents, deadlines, and travel history in one secure app. 100% private, AES-256 encrypted.', true);
  setMeta('robots', 'index, follow');
}

// ─── Data structures ──────────────────────────────────────────
interface FAQItem { q: string; a: string; }
interface Section {
  id: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  faqs: FAQItem[];
}

const SECTIONS: Section[] = [
  {
    id: 'getting-started',
    icon: 'rocket-outline',
    title: 'Getting Started',
    subtitle: 'Setup, onboarding, and first steps',
    faqs: [
      { q: 'What is StatusVault?', a: 'StatusVault is a privacy-first immigration document tracker for F-1, OPT, H-1B, green card holders, and anyone navigating the US immigration system. It tracks expiry dates, sends alerts before deadlines, and keeps all your immigration data organized in one place.' },
      { q: 'Is my data private and secure?', a: 'Yes. All data is stored locally on your device first. If you create an account and enable sync, your data is AES-256 encrypted on your device before it is uploaded — the server only receives ciphertext it cannot read. Not even StatusVault staff can access your immigration data.' },
      { q: 'Do I need to create an account?', a: 'No. StatusVault works completely offline without an account. Create a free account only if you want to sync data across multiple devices (phone + web browser). All core features work without signing in.' },
      { q: 'Does the app work without internet?', a: 'Yes — StatusVault is offline-first. All tracking, alerts, and document management work with no internet connection. Sync to the cloud happens when you are online, but the app never requires connectivity to function.' },
      { q: 'Is StatusVault free?', a: 'The free tier allows up to 3 documents. Premium ($0.49/month or $4.99/year) unlocks unlimited document tracking, advanced alert windows, data export, and priority support.' },
    ],
  },
  {
    id: 'documents',
    icon: 'document-text-outline',
    title: 'Document Tracking',
    subtitle: 'Visas, EADs, permits, and all immigration documents',
    faqs: [
      { q: 'Which documents can I track?', a: 'StatusVault supports 25+ document types across 6 categories:\n\n🛂 VISAS: F-1 Student Visa, H-1B Work Visa, H-4 Dependent, J-1 Exchange Visitor, L-1 Intracompany Transfer, O-1 Extraordinary Ability, B-1/B-2 Visitor\n\n💼 EMPLOYMENT: OPT EAD Card, STEM OPT Extension EAD, CPT Authorization, H-1B I-797 Approval Notice, H-4 EAD, L-2 EAD, General EAD\n\n✈️ TRAVEL: Passport, Advance Parole, I-20 Travel Signature\n\n🎓 ACADEMIC: I-20 Form (F-1), DS-2019 (J-1), Program End Date, SEVIS Record\n\n🏛️ IMMIGRATION: Green Card (I-551), Conditional Green Card, Combo Card (EAD+AP), I-94 Arrival Record, I-797 Receipt Notice\n\n📋 OTHER: Driver\'s License, Custom Document (any document you define)' },
      { q: 'How far in advance does StatusVault alert me?', a: 'Alert windows are tailored per document type based on real renewal timelines:\n• H-1B Visa — 180 days (6 months)\n• Passport — 180 days\n• Green Card — 180 days\n• OPT EAD — 90 days\n• STEM OPT — 120 days\n• F-1/J-1 Visa Stamp — 90 days\n• I-20 Form — 60 days\n• Driver\'s License — 60 days\n• General documents — 30 days' },
      { q: 'What is the 6-month passport rule?', a: 'Many countries require your passport to be valid for at least 6 months beyond your travel dates. The US Customs and Border Protection also enforces this. StatusVault alerts you 180 days before passport expiry to give you enough time to renew without disrupting travel plans.' },
      { q: 'Can I add notes to a document?', a: 'Yes. When adding any document, there is an optional Notes field. Use it to record useful details like the USCIS service center where your petition was filed, your attorney\'s reference number, or which passport your visa is in.' },
      { q: 'Can I track the same document type twice?', a: 'No — each document type can only be added once. If you have multiple EAD cards (for example, a current one and a renewal), track the one with the soonest expiry and update the date when the new card arrives.' },
      { q: 'What does "I-94 Arrival Record" track?', a: 'The I-94 is the electronic arrival/departure record maintained by US Customs and Border Protection (CBP). It specifies your "Admit Until" date — the last day you are authorized to stay in the US. You can look yours up at i94.cbp.dhs.gov. Track it in StatusVault so you never overstay.' },
      { q: 'What is Advance Parole and when do I need to track it?', a: 'Advance Parole (Form I-512) is a travel document for people with a pending Adjustment of Status (green card application). It allows you to leave and re-enter the US without abandoning your pending case. Track the expiry because travelling on an expired AP can be treated as abandonment of your I-485.' },
    ],
  },
  {
    id: 'counters',
    icon: 'timer-outline',
    title: 'Immi Counters',
    subtitle: 'Day-count trackers for critical immigration limits',
    faqs: [
      { q: 'What is an Immi Counter?', a: 'Immi Counters track specific day-limits that are critical to maintaining your immigration status. Unlike document expiry dates, these are running totals of days used — StatusVault auto-increments them daily when tracking is turned on.' },
      { q: 'What counters are available?', a: 'StatusVault includes 7 built-in counters:\n\n• OPT Unemployment (90 days max) — cumulative days without employment during post-completion OPT\n• STEM OPT Unemployment (150 days max) — cumulative unemployment during 24-month STEM extension\n• H-1B Grace Period (60 days) — time to find a new sponsor or change status after H-1B employment ends\n• F-1 Grace Period (60 days) — time to depart or change status after program completion or OPT end\n• B-1/B-2 Visitor Stay (180 days) — authorized stay on visitor visa\n• Days in US Tax Year (183 days) — Substantial Presence Test threshold for tax residency\n• J-1 Grace Period (30 days) — time to depart after J-1 program ends\n\nYou can also create Custom Counters for any limit not listed above (e.g., L-2 grace period, parole duration).' },
      { q: 'What happens if I exceed my OPT unemployment days?', a: 'Exceeding 90 cumulative days of unemployment during OPT (or 150 during STEM OPT) violates the terms of your F-1 status. This can result in SEVIS termination, affecting your ability to remain in the US. You must report your employment status to your DSO within 10 days of any job change.' },
      { q: 'What is the H-1B 60-day grace period?', a: 'When your H-1B employment ends (layoff, resignation, or termination), USCIS grants a 60-day grace period. During this time you can: find a new H-1B sponsor to transfer your petition, change to another visa status (e.g., B-2 or F-1), or prepare to leave the US. This period does not extend automatically.' },
      { q: 'What is the Substantial Presence Test?', a: 'If you are in the US for 183 or more days in a calendar year (counting all days this year + 1/3 of days last year + 1/6 of days two years ago), the IRS may classify you as a tax resident, requiring you to file as a resident alien (Form 1040 instead of 1040-NR). StatusVault\'s Tax Year counter helps you monitor this threshold. Always consult a tax professional.' },
      { q: 'What is Auto-track mode?', a: 'When Auto-track is ON, StatusVault automatically increments the counter by 1 each day. Use this when you are actively in the situation (e.g., currently unemployed on OPT, currently in the US on a B-2 visa). Turn it OFF when the situation ends. The counter still records the date it was last incremented so it catches up even if the app was closed.' },
    ],
  },
  {
    id: 'checklists',
    icon: 'checkmark-circle-outline',
    title: 'Immigration Checklists',
    subtitle: 'Step-by-step guides for common immigration processes',
    faqs: [
      { q: 'What checklists are included?', a: 'StatusVault includes 8 comprehensive checklists sourced from USCIS guidelines:\n\n• OPT Application — 18 steps for post-completion OPT (I-765)\n• STEM OPT Extension — 16 steps for 24-month extension (I-765 + I-983)\n• H-1B Petition — Steps for employer-sponsored H-1B filing\n• F-1 Visa Application — Steps for applying or renewing F-1 stamp\n• Passport Renewal — US and foreign passport renewal steps\n• Green Card (AOS) — I-485 Adjustment of Status filing steps\n• N-400 Naturalization — US citizenship application process\n• Change of Status — Steps to change from one visa category to another' },
      { q: 'Can I add custom steps to a checklist?', a: 'Yes. At the bottom of any checklist, tap "+ Add custom step" to add your own items. These might include attorney appointments, employer-specific requirements, or state-specific steps that are not covered by the general USCIS checklist.' },
      { q: 'Are the checklists legally authoritative?', a: 'No. The checklists are general guidance based on publicly available USCIS information. Immigration requirements change and vary by individual circumstances. Always verify requirements with your Designated School Official (DSO), immigration attorney, or directly at uscis.gov before filing. StatusVault is not a law firm and does not provide legal advice.' },
    ],
  },
  {
    id: 'travel',
    icon: 'airplane-outline',
    title: 'I-94 Travel History',
    subtitle: 'Track international trips for N-400 naturalization',
    faqs: [
      { q: 'What is the I-94 Travel History tracker?', a: 'The Travel tab lets you record every international trip — departure date, return date, destination country, purpose (vacation/business/family/medical), port of entry, and notes. This creates a complete record of your time outside the US, which is required for naturalization and useful for continuous residence tracking.' },
      { q: 'Why is travel history important for green card holders?', a: 'To naturalize as a US citizen, you must have been a Permanent Resident for at least 5 years (3 years if married to a US citizen) AND have been physically present in the US for at least 30 months of that 5-year period. N-400 Part 8 requires you to list every trip outside the US in the past 5 years.' },
      { q: 'What is a "long absence" warning?', a: 'Any single trip outside the US lasting 180 days or more may "break" your continuous residence period for naturalization purposes. StatusVault flags these trips in red and warns you in the PDF export. A trip of 365+ days almost certainly breaks continuous residence. Consult an immigration attorney before filing N-400 if you have had any long absences.' },
      { q: 'How do I export my travel history as a PDF?', a: 'From the Travel tab, tap "Export PDF — N-400 Ready". This generates a formatted PDF report with two tables: a 5-year history (aligned with N-400 Part 8 requirements) and a complete all-time history. The PDF includes total days abroad, estimated days in the US, and any long-absence warnings. On web, it opens a print dialog. On mobile, it uses the native share sheet.' },
      { q: 'How accurate is the "Days in US" estimate?', a: 'The estimate is calculated as (5 years × 365 days) minus your recorded days abroad. It is an estimate only — it does not account for trips you may not have recorded. Always verify your actual I-94 history at cbp.dhs.gov/i94 and cross-reference with your passport stamps before filing N-400.' },
      { q: 'What is the port of entry field for?', a: 'The port of entry (e.g., JFK, LAX, Chicago O\'Hare) is where you re-entered the US. This is useful for matching your travel records with your official I-94 history, which is also recorded by port of entry. CBP officers can ask about your travel history and ports of entry during naturalization interviews.' },
    ],
  },
  {
    id: 'notifications',
    icon: 'notifications-outline',
    title: 'Notifications & Alerts',
    subtitle: 'Smart deadline alerts and notification settings',
    faqs: [
      { q: 'How do deadline notifications work?', a: 'When you add a document, StatusVault automatically schedules push notifications at each alert window specific to that document type. For example, adding an H-1B visa schedules notifications at 180 days, 90 days, and 30 days before expiry. Notifications appear on your lock screen and as banners even when the app is closed.' },
      { q: 'Can I turn off notifications?', a: 'Yes. Go to Settings → Notifications → toggle "Push Notifications" off. This cancels all scheduled alerts. You can re-enable at any time and notifications will be rescheduled for all your active documents.' },
      { q: 'Why am I not receiving notifications?', a: 'Check these in order:\n1. Settings → Notifications → ensure Push Notifications is ON\n2. Your device Settings → Apps → StatusVault → Notifications — ensure notifications are allowed\n3. On Android, check that the notification channel is not blocked\n4. Try Settings → Send Test Notification to confirm the system is working\n5. Notifications do not appear on web browsers in the current version' },
      { q: 'What is "Send Test Notification"?', a: 'Tapping "Send Test Notification" in Settings schedules a notification 3 seconds in the future. If you see it appear, your notification system is working correctly. If you do not see it, your device notifications may be blocked at the system level.' },
      { q: 'What is "View Scheduled Alerts"?', a: 'This shows how many notifications are currently scheduled for your documents. If the count is 0 and you have documents with future expiry dates, try toggling notifications off and on again to reschedule them.' },
      { q: 'Do notifications work when the app is closed?', a: 'Yes. StatusVault uses scheduled local notifications which are registered with the operating system. They fire at the correct time regardless of whether the app is open, in background, or completely closed. Internet connection is not required.' },
    ],
  },
  {
    id: 'sync',
    icon: 'cloud-outline',
    title: 'Account & Sync',
    subtitle: 'Cross-device sync, Google login, and data security',
    faqs: [
      { q: 'How does cross-device sync work?', a: 'When you sign in on multiple devices, each device encrypts your data locally with AES-256 before uploading. The server stores only ciphertext. When you open the app on another device, it downloads and decrypts the data using your account credentials. Changes sync automatically within 1-2 seconds of any update.' },
      { q: 'Can I sign in with Google?', a: 'Yes. On the Sign In screen, tap "Continue with Google". This uses your existing Google account — no new password needed. Google sign-in follows the same encryption model: your data is encrypted locally before any sync.' },
      { q: 'What happens to my data if I sign out?', a: 'Your data remains on the device in local storage. Signing out only disconnects the sync — it does not delete local data. If you sign back in on the same device, sync resumes. If you sign in on a new device, the cloud copy (from your last sync) will be downloaded.' },
      { q: 'What if I lose my device?', a: 'If you had sync enabled, sign in to StatusVault on a new device or the web portal with the same account. Your latest synced data will be downloaded and decrypted automatically. If you used the app without an account, use the Export Backup feature regularly (Settings → Export Backup) to keep a JSON copy.' },
      { q: 'How do I transfer data to a new phone without an account?', a: 'Go to Settings → Export Backup on your old device. This creates a JSON file you can save to cloud storage, email to yourself, or copy via cable. On the new device, go to Settings → Import Backup and paste the JSON content. All your documents, trips, counters, and checklists will be restored.' },
      { q: 'Is my data safe in the cloud?', a: 'Yes. StatusVault uses zero-knowledge encryption — your data is encrypted using a key derived from your account credentials before it leaves your device. The cloud server stores encrypted blobs it cannot read. Even in the event of a server breach, your immigration data would be unreadable without your password.' },
    ],
  },
  {
    id: 'pin',
    icon: 'lock-closed-outline',
    title: 'PIN Lock & Privacy',
    subtitle: 'App lock, data protection, and privacy controls',
    faqs: [
      { q: 'What does PIN lock do?', a: 'When PIN lock is enabled, StatusVault requires a 4-digit PIN every time the app is opened. This prevents anyone who picks up your device from seeing your immigration documents. The PIN is stored securely on-device and is independent from your sync account password.' },
      { q: 'How do I enable or change my PIN?', a: 'Go to Settings → App Lock → toggle "PIN Lock" on. You will be prompted to set a 4-digit PIN. To change it, toggle the switch again and enter your old PIN before setting a new one.' },
      { q: 'What if I forget my PIN?', a: 'Currently, there is no PIN recovery. If you forget your PIN, you will need to clear the app data through your device\'s app settings, which will reset StatusVault. If you had sync enabled, your data can be recovered by signing back in. This is why enabling cloud sync before setting a PIN is strongly recommended.' },
      { q: 'Does PIN lock work on the web version?', a: 'PIN lock is a native mobile feature and is not applied on the web version. The web version relies on your Supabase account login as the access control layer.' },
    ],
  },
  {
    id: 'faq-immigration',
    icon: 'globe-outline',
    title: 'Immigration FAQs',
    subtitle: 'Common immigration questions answered',
    faqs: [
      { q: 'What is the difference between visa expiry and I-94 "Admit Until" date?', a: 'Your visa stamp expiry is the last date you can use that visa to enter the US. Your I-94 "Admit Until" date is how long you can stay during that entry — these are different. You can have an expired visa stamp and still be legally present if your I-94 date has not passed. Always check your I-94 at cbp.dhs.gov/i94.' },
      { q: 'What does "Duration of Status" (D/S) mean on my I-94?', a: 'D/S means you are authorized to stay as long as you maintain valid student or exchange visitor status — not until a specific date. F-1 and J-1 visa holders typically see D/S. You are authorized to stay until your program end date plus any authorized grace period, not indefinitely.' },
      { q: 'When should I renew my H-1B visa stamp?', a: 'Your H-1B visa stamp in your passport is only needed when entering the US from abroad. If you are already in the US, you do not need to renew it until your next international trip. USCIS recommends applying for a new visa stamp at least 3-6 months before travel due to appointment availability. StatusVault alerts you 180 days before expiry.' },
      { q: 'What happens if my EAD card expires before my renewal is approved?', a: 'If you filed for OPT or STEM OPT renewal at least 90 days (for STEM OPT: up to 90 days) before your EAD expiry, USCIS may grant a 180-day automatic extension of work authorization while your renewal is pending. Keep your receipt notice (I-797C) as proof. Consult your DSO immediately if your EAD expires.' },
      { q: 'What is the difference between OPT and STEM OPT?', a: 'OPT (Optional Practical Training) gives F-1 students 12 months of work authorization after graduation. STEM OPT is a 24-month extension available to students who graduated from a STEM-designated program and work for an E-Verify enrolled employer. The employer must file a Training Plan (I-983). Combined, you can have up to 36 months of work authorization on F-1.' },
      { q: 'Where can I find official immigration resources?', a: 'Key official resources:\n• USCIS: uscis.gov — petitions, forms, case status\n• CBP I-94: i94.cbp.dhs.gov — your arrival/departure record\n• SEVP/SEVIS: studyinthestates.dhs.gov — F-1/J-1 student records\n• State Dept Visa Info: travel.state.gov — visa appointments\n• IRS Tax: irs.gov/individuals/international-taxpayers — tax filing\n• EOIR (Immigration Court): justice.gov/eoir' },
    ],
  },
  {
    id: 'data',
    icon: 'server-outline',
    title: 'Data & Backup',
    subtitle: 'Export, import, and data management',
    faqs: [
      { q: 'How do I export my data?', a: 'Go to Settings → Data Backup → Export Backup. This creates a complete JSON file containing all your documents, trips, counters, checklists, and settings. The file is human-readable and can be opened in any text editor. Store it in a secure location like an encrypted cloud folder.' },
      { q: 'What format is the export file?', a: 'Exports are plain JSON files with a StatusVault version header, export timestamp, and all your data in structured arrays. The format is stable across app versions — a backup from v1.0 can be imported into v2.0 and later.' },
      { q: 'How do I reset all data?', a: 'Settings → Danger Zone → Reset All Data. This permanently deletes all documents, trips, counters, and checklists from the device. It also cancels all scheduled notifications. This cannot be undone — export a backup first if you may want to recover the data.' },
      { q: 'Can I view StatusVault data outside the app?', a: 'Yes. The JSON export file can be opened in any text editor. If you have cloud sync enabled, the encrypted blob is stored in your Supabase account but requires decryption (only possible through the app with your credentials). The JSON export is the only way to view data as plain text outside the app.' },
    ],
  },
];

// ─── Accordion Item ───────────────────────────────────────────
const FAQItem: React.FC<{ item: FAQItem; index: number }> = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={faqStyles.item}>
      <TouchableOpacity style={faqStyles.question} onPress={() => setOpen(!open)} activeOpacity={0.7}>
        <Text style={faqStyles.questionText}>{item.q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.text3} />
      </TouchableOpacity>
      {open && (
        <View style={faqStyles.answer}>
          <Text style={faqStyles.answerText}>{item.a}</Text>
        </View>
      )}
    </View>
  );
};

const faqStyles = StyleSheet.create({
  item:         { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  question:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 14, gap: 12 },
  questionText: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF', lineHeight: 20 },
  answer:       { paddingBottom: 16 },
  answerText:   { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.75)', lineHeight: 21 },
});

// ─── Section Card ─────────────────────────────────────────────
const SectionCard: React.FC<{ section: Section }> = ({ section }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={sectionStyles.card}>
      <TouchableOpacity style={sectionStyles.header} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={sectionStyles.iconBox}>
          <Ionicons name={section.icon} size={20} color={'#6FAFF2'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={sectionStyles.title}>{section.title}</Text>
          <Text style={sectionStyles.subtitle}>{section.subtitle}</Text>
        </View>
        <View style={[sectionStyles.countBadge]}>
          <Text style={sectionStyles.countText}>{section.faqs.length}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.text3} style={{ marginLeft: 6 }} />
      </TouchableOpacity>
      {expanded && (
        <View style={sectionStyles.faqs}>
          {section.faqs.map((faq, i) => <FAQItem key={faq.q.slice(0,40)} item={faq} index={i} />)}
        </View>
      )}
    </View>
  );
};

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: '0 4px 16px rgba(0,0,0,0.28)' } as any) : shadows.sm),
  } as any,
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg },
  iconBox:    { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(59,139,232,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)' },
  title:      { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },
  subtitle:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', marginTop: 2 },
  countBadge: { backgroundColor: 'rgba(59,139,232,0.16)', paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)' },
  countText:  { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#6FAFF2' },
  faqs:       { paddingHorizontal: spacing.lg, paddingBottom: 4 },
});

// ─── Main Screen ─────────────────────────────────────────────
export const HelpScreen: React.FC = () => {
  const [search, setSearch] = useState('');

  const totalFaqs = SECTIONS.reduce((sum, s) => sum + s.faqs.length, 0);

  const filtered = search.trim().length > 1
    ? SECTIONS.map((s) => ({
        ...s,
        faqs: s.faqs.filter(
          (f) => f.q.toLowerCase().includes(search.toLowerCase()) ||
                 f.a.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter((s) => s.faqs.length > 0)
    : SECTIONS;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, IS_WEB && styles.contentWeb]}
      showsVerticalScrollIndicator={true}
    >
      {/* Header */}
      {!IS_WEB && (
        <View style={styles.header}>
          {/* Top accent stripe — brand blue */}
          <View style={{ position: 'absolute' as any, top: 0, left: 0, right: 0, height: 3, backgroundColor: '#3B8BE8' } as any} />
          <Text style={styles.headerLabel}>HELP & FAQ</Text>
          <Text style={styles.headerTitle}>Help Center</Text>
          <Text style={styles.headerSub}>{totalFaqs} questions across {SECTIONS.length} topics</Text>
        </View>
      )}

      {IS_WEB && (
        <View style={styles.webHero}>
          {/* Top accent stripe — brand blue */}
          <View style={{ position: 'absolute' as any, top: 0, left: 0, right: 0, height: 3, backgroundColor: '#3B8BE8' } as any} />
          {/* Soft ambient blue glow */}
          {Platform.OS === 'web' && (
            <View pointerEvents="none" style={{
              position: 'absolute' as any, top: -50, right: -50, width: 320, height: 320, borderRadius: 160,
              background: 'radial-gradient(circle, rgba(59,139,232,0.18) 0%, transparent 70%)',
            } as any} />
          )}
          <Text style={styles.webHeroEye}>STATUSVAULT HELP CENTER</Text>
          <Text style={styles.webHeroTitle}>How can we help?</Text>
          <Text style={styles.webHeroSub}>
            Complete guide to immigration document tracking, visa deadlines, OPT counters, N-400 travel history, and more.
          </Text>
        </View>
      )}

      {/* Stats strip */}
      <View style={styles.statsRow}>
        {[
          { n: '25+', label: 'Document Types' },
          { n: '8',   label: 'Checklists' },
          { n: '7',   label: 'Immi Counters' },
          { n: totalFaqs.toString(), label: 'FAQs' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statNum}>{s.n}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Featured tips — quick visual guidance */}
      <View style={styles.tipsRow}>
        {[
          { icon: 'shield-checkmark' as const, color: '#6FAFF2', title: 'Renew Early',    text: 'Start passport renewal 6 months before expiry' },
          { icon: 'calendar'        as const,  color: '#F5C053', title: 'Mark Deadlines', text: 'Track every priority date and filing window' },
          { icon: 'people-circle'   as const,  color: '#4CD98A', title: 'Prepare Early',  text: 'Gather documents weeks before USCIS interviews' },
        ].map((t) => (
          <View key={t.icon} style={styles.tipCard}>
            <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: t.color + '18', borderWidth: 1, borderColor: t.color + '38', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <Ionicons name={t.icon} size={26} color={t.color} />
            </View>
            <Text style={styles.tipTitle}>{t.title}</Text>
            <Text style={styles.tipText}>{t.text}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.text3} style={styles.searchIcon} />
        <View style={styles.searchInput as any}>
          {/* Use TextInput on native, input on web */}
          {IS_WEB
            ? <input
                value={search}
                onChange={(e: any) => setSearch(e.target.value)}
                placeholder="Search FAQs..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.text1 } as any}
              />
            : (() => {
                const { TextInput } = require('react-native');
                return <TextInput
                  style={{ flex: 1, fontSize: 15, color: colors.text1 }}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search FAQs..."
                  placeholderTextColor={colors.text3}
                />;
              })()
          }
        </View>
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color={colors.text3} />
          </TouchableOpacity>
        )}
      </View>

      {/* No results */}
      {filtered.length === 0 && (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={32} color={colors.text3} />
          <Text style={styles.noResultsText}>No FAQs found for "{search}"</Text>
        </View>
      )}

      {/* Section cards */}
      <View style={[styles.sections, IS_WEB && styles.sectionsWeb]}>
        {filtered.map((section) => (
          <View key={section.id} style={IS_WEB && styles.sectionWebCol}>
            <SectionCard section={section} />
          </View>
        ))}
      </View>

      {/* Official links */}
      <View style={styles.linksCard}>
        <View style={styles.linksHeader}>
          <Ionicons name="link-outline" size={18} color={'#6FAFF2'} />
          <Text style={styles.linksTitle}>Official Government Resources</Text>
        </View>
        {[
          { label: 'USCIS — US Citizenship and Immigration Services', url: 'https://www.uscis.gov' },
          { label: 'CBP I-94 — Check your arrival record', url: 'https://i94.cbp.dhs.gov' },
          { label: 'Study in the States — F-1/J-1 SEVIS info', url: 'https://studyinthestates.dhs.gov' },
          { label: 'State Dept — Visa appointments & info', url: 'https://travel.state.gov' },
          { label: 'IRS — International taxpayer information', url: 'https://www.irs.gov/individuals/international-taxpayers' },
        ].map(({ label, url }, i) => (
          <TouchableOpacity
            key={i}
            style={styles.linkRow}
            onPress={() => Linking.openURL(url).catch(() => {})}
            activeOpacity={0.7}
          >
            <View style={styles.linkDot} />
            <Text style={styles.linkText}>{label}</Text>
            <Ionicons name="open-outline" size={14} color={'#6FAFF2'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Ionicons name="warning-outline" size={16} color={colors.warning} />
        <Text style={styles.disclaimerText}>
          StatusVault is an informational tool only and does not provide legal advice. Immigration rules change frequently and vary by individual circumstances. Always consult a licensed immigration attorney or your Designated School Official (DSO) before making immigration decisions. Not affiliated with USCIS, CBP, or any government agency.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: 'transparent' },
  content:       { paddingBottom: 40 },
  contentWeb:    { paddingHorizontal: 28, paddingTop: 24 },

  // Mobile header — dark glass panel, no loud gradient
  headerGradient:{ paddingBottom: 8 },
  header: {
    marginHorizontal: spacing.screen,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    position: 'relative' as any,
    overflow: 'hidden' as any,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 4px 16px rgba(0,0,0,0.28)' } as any) : {}),
  } as any,
  headerLabel:   { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#6FAFF2', letterSpacing: 2, marginBottom: 4 },
  headerTitle:   { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#F0F4FF', letterSpacing: -0.4 },
  headerSub:     { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)', marginTop: 3 },

  // Web hero — dark glass with brand accent stripe (NOT solid blue!)
  webHero: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.xxl,
    padding: 32,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    position: 'relative' as any,
    overflow: 'hidden' as any,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', boxShadow: '0 8px 28px rgba(0,0,0,0.35)' } as any) : shadows.md),
  } as any,
  webHeroEye:    { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#6FAFF2', letterSpacing: 2.5, marginBottom: 8 },
  webHeroTitle:  { fontSize: 32, fontFamily: 'Inter_900Black', color: '#F0F4FF', letterSpacing: -0.5, marginBottom: 8 },
  webHeroSub:    { fontSize: 15, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.65)', lineHeight: 24, maxWidth: 600 },

  // Stats — dark glass cards
  statsRow:      { flexDirection: 'row', paddingHorizontal: 0, gap: 10, marginVertical: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: radius.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as any) : {}),
  } as any,
  statNum:       { fontSize: 20, fontFamily: 'Inter_900Black', color: '#6FAFF2', letterSpacing: -0.5 },
  statLabel:     { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.55)', marginTop: 2, textAlign: 'center' },

  // Featured tips
  tipsRow:       { flexDirection: IS_WEB ? 'row' : 'column' as any, gap: 10, marginBottom: spacing.lg } as any,
  tipCard: {
    flex: IS_WEB ? 1 : undefined,
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: radius.lg,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as any) : {}),
  } as any,
  tipTitle:      { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#F0F4FF', marginBottom: 4, letterSpacing: -0.1 },
  tipText:       { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', textAlign: 'center', lineHeight: 15 },

  // Search — dark glass input
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 6,
    marginHorizontal: IS_WEB ? 0 : IS_TABLET ? 24 : spacing.screen,
    marginBottom: spacing.lg,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as any) : {}),
  } as any,
  searchIcon:    { marginRight: 10 },
  searchInput:   { flex: 1 },

  // Sections
  sections:      { paddingHorizontal: 0 },
  sectionsWeb:   { flexDirection: 'row' as any, flexWrap: 'wrap' as any, gap: spacing.md },
  sectionWebCol: { flex: 1 as any, minWidth: 360 as any },

  // No results
  noResults:     { alignItems: 'center', padding: 40, gap: 12 },
  noResultsText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)' },

  // Official links — dark glass
  linksCard: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderRadius: radius.xl,
    marginHorizontal: IS_WEB ? 0 : IS_TABLET ? 24 : spacing.screen,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: spacing.lg,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' } as any) : {}),
  } as any,
  linksHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  linksTitle:    { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },
  linkRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  linkDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6FAFF2' },
  linkText:      { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.80)' },

  // Disclaimer — gold glass tint (matches premium-alert pattern)
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(245,192,83,0.10)',
    borderRadius: radius.lg,
    marginHorizontal: IS_WEB ? 0 : IS_TABLET ? 24 : spacing.screen,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,192,83,0.28)',
  },
  disclaimerText:{ flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(245,192,83,0.90)', lineHeight: 19 },
});
