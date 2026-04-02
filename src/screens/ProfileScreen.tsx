// ═══════════════════════════════════════════════════════════════
// ProfileScreen v3 — VisaDash-style 3-tab profile
// Personal · Visa & Work · Green Card
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { IS_WEB } from '../utils/responsive';

type Tab = 1 | 2 | 3;

const COUNTRIES = ['🇮🇳 India','🇨🇳 China','🇵🇭 Philippines','🇲🇽 Mexico','🇰🇷 South Korea','🇧🇷 Brazil','🇳🇬 Nigeria','🌍 Other'];
const VISA_TYPES = ['H-1B','H-1B1','H-4','L-1A','L-1B','L-2','O-1','TN','F-1','F-2','J-1','B-1/B-2','Green Card','US Citizen','Other'];
const EXP_LEVELS = ['0–2 years','3–5 years','6–9 years','10+ years'];
const DEGREES = ['High School','Associate','Bachelor\'s','Master\'s','MBA','PhD','Other'];
const GC_STAGES = ['Not started','PERM filed','PERM approved','I-140 pending','I-140 approved','I-485 filed','I-485 approved'];
const EB_CATS = ['EB-1 (India)','EB-1 (China)','EB-1 (Others)','EB-2 (India)','EB-2 (China)','EB-2 (Others)','EB-3 (India)','EB-3 (China)','EB-3 (Others)','N/A'];

function WField({ label, required, children, hint }: { label:string; required?:boolean; children:React.ReactNode; hint?:string }) {
  return (
    <View style={s.group}>
      <Text style={s.label}>{label}{required && <Text style={s.req}> *</Text>}</Text>
      {children}
      {hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

function WInput(props: { value:string; onChangeText:(v:string)=>void; placeholder?:string; type?:string; mono?:boolean }) {
  if (IS_WEB) return (
    <input value={props.value} onChange={(e:any) => props.onChangeText(e.target.value)}
      placeholder={props.placeholder} type={props.type ?? 'text'}
      style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box', ...(props.mono ? { fontFamily:'monospace', letterSpacing:'1px' } : {}) } as any} />
  );
  return <TextInput style={[s.input, props.mono && { letterSpacing: 1, fontFamily: 'monospace' }]} value={props.value} onChangeText={props.onChangeText} placeholder={props.placeholder} />;
}

function WSelect({ value, options, onChange }: { value:string; options:string[]; onChange:(v:string)=>void }) {
  if (IS_WEB) return (
    <select value={value} onChange={(e:any) => onChange(e.target.value)}
      style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box', cursor:'pointer' } as any}>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <TouchableOpacity key={o} onPress={() => onChange(o)}
            style={[s.chip, value === o && s.chipActive]}>
            <Text style={[s.chipTxt, value === o && s.chipTxtActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authUser   = useStore((s) => s.authUser);
  const isPremium  = useStore((s) => s.isPremium);
  const signOut    = useStore((s) => s.signOut);

  const [tab, setTab] = useState<Tab>(1);

  // Tab 1 — Personal
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [country,   setCountry]   = useState(COUNTRIES[0]);
  const [location,  setLocation]  = useState('');

  // Tab 2 — Visa & Work
  const [visaType,    setVisaType]    = useState('H-1B');
  const [startYear,   setStartYear]   = useState('');
  const [statusExpiry,setStatusExpiry]= useState('');
  const [i94,         setI94]         = useState('');
  const [jobTitle,    setJobTitle]    = useState('');
  const [employer,    setEmployer]    = useState('');
  const [salary,      setSalary]      = useState('');
  const [experience,  setExperience]  = useState(EXP_LEVELS[1]);
  const [degree,      setDegree]      = useState(DEGREES[3]);

  // Tab 3 — Green Card
  const [gcStage,     setGcStage]     = useState(GC_STAGES[0]);
  const [priorityDate,setPriorityDate]= useState('');
  const [ebCategory,  setEbCategory]  = useState(EB_CATS[3]);
  const [i140Status,  setI140Status]  = useState('Not filed');
  const [perm,        setPerm]        = useState('Not started');

  // Progress calculation
  const tab1Done = !!(firstName && country);
  const tab2Done = !!(visaType && statusExpiry && jobTitle && employer);
  const tab3Done = gcStage !== GC_STAGES[0];
  const progress = [tab1Done, tab2Done, tab3Done].filter(Boolean).length;

  const tabLabels: { id: Tab; icon: string; label: string }[] = [
    { id: 1, icon: '👤', label: 'Personal' },
    { id: 2, icon: '🛂', label: 'Visa & Work' },
    { id: 3, icon: '🟢', label: 'Green Card' },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.content, IS_WEB && s.contentWeb]} showsVerticalScrollIndicator={true}>

      {/* Completion banner */}
      <LinearGradient colors={['#EBF9FB','#EEF2FF']} style={s.banner}>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>Your Immigration Profile</Text>
          <Text style={s.bannerSub}>Enter your details once — every tool personalises automatically.</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {[1,2,3].map((i) => (
            <View key={i} style={[s.progressPip, {
              backgroundColor: i <= progress ? '#0099A8' : '#E4E8F0',
              width: i <= progress ? 32 : 20,
            }]} />
          ))}
        </View>
      </LinearGradient>

      {/* Auth status */}
      {authUser ? (
        <View style={s.authRow}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{authUser.email[0].toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.authEmail}>{authUser.email}</Text>
            <Text style={s.authPlan}>{isPremium ? '⭐ Premium' : 'Free Plan'}</Text>
          </View>
          <TouchableOpacity style={s.signOutBtn} onPress={() => signOut?.()}>
            <Ionicons name="log-out-outline" size={14} color="#EA5455" />
            <Text style={s.signOutTxt}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={s.signInBanner} onPress={() => navigation.navigate('Auth')}>
          <Ionicons name="person-circle-outline" size={20} color="#7367F0" />
          <Text style={s.signInTxt}>Sign in to sync profile across devices</Text>
          <Ionicons name="arrow-forward" size={14} color="#7367F0" />
        </TouchableOpacity>
      )}

      {/* Tab switcher */}
      <View style={s.tabs}>
        {tabLabels.map((t) => (
          <TouchableOpacity key={t.id} style={[s.tabBtn, tab === t.id && s.tabBtnActive]} onPress={() => setTab(t.id)}>
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabTxt, tab === t.id && s.tabTxtActive]}>{t.label}</Text>
            {[tab1Done, tab2Done, tab3Done][t.id - 1] && <View style={s.tabCheck}><Ionicons name="checkmark" size={10} color="#fff" /></View>}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab 1: Personal */}
      {tab === 1 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Personal Information</Text>
          <View style={s.grid2}>
            <WField label="First Name" required><WInput value={firstName} onChangeText={setFirstName} placeholder="e.g. Ravi" /></WField>
            <WField label="Last Name"><WInput value={lastName} onChangeText={setLastName} placeholder="e.g. Kumar" /></WField>
            <WField label="Phone (for SMS alerts)"><WInput value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" /></WField>
            <WField label="Current Work Location" hint="City, State"><WInput value={location} onChangeText={setLocation} placeholder="e.g. Dallas, TX" /></WField>
          </View>
          <WField label="Country of Origin"><WSelect value={country} options={COUNTRIES} onChange={setCountry} /></WField>
          <TouchableOpacity style={s.nextBtn} onPress={() => setTab(2)}>
            <Text style={s.nextBtnTxt}>Next: Visa & Work →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab 2: Visa & Work */}
      {tab === 2 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Visa & Employment Details</Text>
          <WField label="Visa Type" required><WSelect value={visaType} options={VISA_TYPES} onChange={setVisaType} /></WField>
          <View style={s.grid2}>
            <WField label="Status Expires" required>
              {IS_WEB
                ? <input type="date" value={statusExpiry} onChange={(e:any) => setStatusExpiry(e.target.value)} style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
                : <TextInput style={s.input} value={statusExpiry} onChangeText={setStatusExpiry} placeholder="YYYY-MM-DD" />
              }
            </WField>
            <WField label="H1B Start Year in USA"><WInput value={startYear} onChangeText={setStartYear} placeholder="e.g. 2019" /></WField>
            <WField label="Job Title" required><WInput value={jobTitle} onChangeText={setJobTitle} placeholder="e.g. Software Engineer" /></WField>
            <WField label="Employer Name" required><WInput value={employer} onChangeText={setEmployer} placeholder="e.g. Google LLC" /></WField>
            <WField label="Annual Salary (USD)"><WInput value={salary} onChangeText={setSalary} placeholder="e.g. 130000" type="number" /></WField>
            <WField label="I-94 Number" hint="11-digit Arrival/Departure record"><WInput value={i94} onChangeText={setI94} placeholder="12345678901" mono /></WField>
          </View>
          <View style={s.grid2}>
            <WField label="Years of Experience"><WSelect value={experience} options={EXP_LEVELS} onChange={setExperience} /></WField>
            <WField label="Highest Degree"><WSelect value={degree} options={DEGREES} onChange={setDegree} /></WField>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <TouchableOpacity style={[s.nextBtn, { flex: 1, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE' }]} onPress={() => setTab(1)}>
              <Text style={[s.nextBtnTxt, { color: '#8588A5' }]}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.nextBtn, { flex: 1 }]} onPress={() => setTab(3)}>
              <Text style={s.nextBtnTxt}>Next: Green Card →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Tab 3: Green Card */}
      {tab === 3 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Green Card Journey</Text>
          <WField label="Current GC Stage"><WSelect value={gcStage} options={GC_STAGES} onChange={setGcStage} /></WField>
          <View style={s.grid2}>
            <WField label="Priority Date" hint="Date on PERM or I-140 approval notice">
              {IS_WEB
                ? <input type="month" value={priorityDate} onChange={(e:any) => setPriorityDate(e.target.value)} style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
                : <TextInput style={s.input} value={priorityDate} onChangeText={setPriorityDate} placeholder="YYYY-MM" />
              }
            </WField>
            <WField label="Preference Category"><WSelect value={ebCategory} options={EB_CATS} onChange={setEbCategory} /></WField>
            <WField label="I-140 Status"><WSelect value={i140Status} options={['Not filed','Pending','Approved','Denied']} onChange={setI140Status} /></WField>
            <WField label="PERM Status"><WSelect value={perm} options={['Not started','Filed','Audited','Approved','Denied']} onChange={setPerm} /></WField>
          </View>

          {/* AC21 note */}
          {i140Status === 'Approved' && (
            <View style={s.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#0E7490" />
              <Text style={s.infoTxt}>
                <Text style={{ fontFamily: 'Inter_700Bold' }}>AC21 Portability Active</Text>
                {'\n'}With an approved I-140, you can change employers if your I-485 has been pending 180+ days, as long as the new job is in the same or similar occupation.
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <TouchableOpacity style={[s.nextBtn, { flex: 1, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE' }]} onPress={() => setTab(2)}>
              <Text style={[s.nextBtnTxt, { color: '#8588A5' }]}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.nextBtn, { flex: 1, backgroundColor: '#28C76F' }]} onPress={() => navigation.goBack?.()}>
              <Text style={s.nextBtnTxt}>✓ Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F4F5FA' },
  content:      { paddingBottom: 40 },
  contentWeb:   { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48, maxWidth: 760 } as any,
  banner:       { borderRadius: 12, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: 'rgba(0,153,168,0.2)' },
  bannerTitle:  { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0E7490', marginBottom: 4 },
  bannerSub:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#4B4C6A', lineHeight: 18 },
  progressPip:  { height: 6, borderRadius: 3 },
  authRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#DBDADE' },
  avatar:       { width: 36, height: 36, borderRadius: 18, backgroundColor: '#7367F0', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  authEmail:    { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2F3349' },
  authPlan:     { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#8588A5', marginTop: 2 },
  signOutBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFEEEE', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  signOutTxt:   { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#EA5455' },
  signInBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#7367F0', borderLeftWidth: 3 } as any,
  signInTxt:    { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: '#2F3349' },
  tabs:         { flexDirection: 'row', gap: 3, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#DBDADE' },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 8, position: 'relative' } as any,
  tabBtnActive: { backgroundColor: '#7367F0' },
  tabIcon:      { fontSize: 14 },
  tabTxt:       { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#8588A5' },
  tabTxtActive: { color: '#fff' },
  tabCheck:     { position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#28C76F', alignItems: 'center', justifyContent: 'center' } as any,
  section:      { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#DBDADE' },
  sectionTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#2F3349', marginBottom: 18 },
  grid2:        { flexDirection: IS_WEB ? 'row' as any : 'column', flexWrap: IS_WEB ? 'wrap' as any : undefined, gap: 14, marginBottom: 14 },
  group:        { flex: IS_WEB ? '0 0 calc(50% - 7px)' as any : undefined, marginBottom: IS_WEB ? 0 : 12 } as any,
  label:        { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#8588A5', letterSpacing: 0.3, marginBottom: 5 },
  req:          { color: '#FF9F43' },
  hint:         { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#ACAEC5', marginTop: 3, lineHeight: 16 },
  input:        { backgroundColor: '#F4F5FA', borderWidth: 1.5, borderColor: '#DBDADE', borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#2F3349' },
  chip:         { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE', marginRight: 5, marginBottom: 6 },
  chipActive:   { backgroundColor: '#F0EEFF', borderColor: '#7367F0' },
  chipTxt:      { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#8588A5' },
  chipTxtActive:{ color: '#7367F0', fontFamily: 'Inter_700Bold' },
  nextBtn:      { backgroundColor: '#7367F0', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  nextBtnTxt:   { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  infoBox:      { flexDirection: 'row', gap: 10, backgroundColor: '#EBF9FB', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(0,153,168,0.2)', marginVertical: 12 },
  infoTxt:      { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#0E7490', lineHeight: 18 },
});
