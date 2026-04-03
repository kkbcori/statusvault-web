import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '../store';
import { IS_WEB } from '../utils/responsive';

type Tab = 1 | 2 | 3;

const COUNTRIES  = ['🇮🇳 India','🇨🇳 China','🇵🇭 Philippines','🇲🇽 Mexico','🇰🇷 South Korea','🇧🇷 Brazil','🇳🇬 Nigeria','🌍 Other'];
const VISA_TYPES = ['H-1B','H-1B1','H-4','L-1A','L-1B','L-2','O-1','TN','F-1','F-2','J-1','B-1/B-2','Green Card','US Citizen','Other'];
const EXP_LEVELS = ['0–2 years','3–5 years','6–9 years','10+ years'];
const DEGREES    = ['High School','Associate',"Bachelor's","Master's",'MBA','PhD','Other'];
const GC_STAGES  = ['Not started','PERM filed','PERM approved','I-140 pending','I-140 approved','I-485 filed','I-485 approved'];
const EB_CATS    = ['EB-1 (India)','EB-1 (China)','EB-1 (Others)','EB-2 (India)','EB-2 (China)','EB-2 (Others)','EB-3 (India)','EB-3 (China)','EB-3 (Others)','N/A'];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      {children}
      {hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

function WInput({ value, onChange, placeholder, type, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean }) {
  if (IS_WEB) return (
    <input value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} type={type ?? 'text'}
      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontFamily: mono ? 'monospace' : 'Inter', letterSpacing: mono ? '1px' : 'normal', border: '1.5px solid #DBDADE', borderRadius: '8px', background: '#F4F5FA', outline: 'none', boxSizing: 'border-box' } as any} />
  );
  return <TextInput style={[s.input, mono && { letterSpacing: 1 }]} value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#ACAEC5" />;
}

function ChipSelect({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  if (IS_WEB) return (
    <select value={value} onChange={(e: any) => onChange(e.target.value)}
      style={{ width: '100%', padding: '10px 12px', fontSize: '13px', fontFamily: 'Inter', border: '1.5px solid #DBDADE', borderRadius: '8px', background: '#F4F5FA', outline: 'none', cursor: 'pointer' } as any}>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((o) => (
        <TouchableOpacity key={o} onPress={() => onChange(o)} style={[s.chip, value === o && s.chipOn]}>
          <Text style={[s.chipTxt, value === o && s.chipTxtOn]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export const ProfileScreen: React.FC = () => {
  const navigation          = useNavigation<any>();
  const authUser            = useStore((s) => s.authUser);
  const isPremium           = useStore((s) => s.isPremium);
  const signOut             = useStore((s) => s.signOut);
  const immigrationProfile  = useStore((s) => s.immigrationProfile);
  const setImmigrationProfile = useStore((s) => s.setImmigrationProfile);

  const [tab, setTab] = useState<Tab>(1);
  const [saved, setSaved] = useState(false);

  // ── Personal
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [phone,     setPhone]     = useState('');
  const [country,   setCountry]   = useState(COUNTRIES[0]);
  const [location,  setLocation]  = useState('');

  // ── Visa & Work
  const [visaType,    setVisaType]    = useState('H-1B');
  const [startYear,   setStartYear]   = useState('');
  const [statusExpiry,setStatusExpiry]= useState('');
  const [i94,         setI94]         = useState('');
  const [jobTitle,    setJobTitle]    = useState('');
  const [employer,    setEmployer]    = useState('');
  const [salary,      setSalary]      = useState('');
  const [experience,  setExperience]  = useState(EXP_LEVELS[1]);
  const [degree,      setDegree]      = useState(DEGREES[3]);

  // ── Green Card
  const [gcStage,     setGcStage]     = useState(GC_STAGES[0]);
  const [priorityDate,setPriorityDate]= useState('');
  const [ebCategory,  setEbCategory]  = useState(EB_CATS[3]);
  const [i140Status,  setI140Status]  = useState('Not filed');
  const [perm,        setPerm]        = useState('Not started');

  // ── Load saved profile on mount
  useEffect(() => {
    if (!immigrationProfile) return;
    const p = immigrationProfile;
    setFirstName(p.firstName ?? '');
    setLastName(p.lastName ?? '');
    setPhone(p.phone ?? '');
    setCountry(p.country ?? COUNTRIES[0]);
    setLocation(p.location ?? '');
    setVisaType(p.visaType ?? 'H-1B');
    setStartYear(p.startYear ?? '');
    setStatusExpiry(p.statusExpiry ?? '');
    setI94(p.i94 ?? '');
    setJobTitle(p.jobTitle ?? '');
    setEmployer(p.employer ?? '');
    setSalary(p.salary ?? '');
    setExperience(p.experience ?? EXP_LEVELS[1]);
    setDegree(p.degree ?? DEGREES[3]);
    setGcStage(p.gcStage ?? GC_STAGES[0]);
    setPriorityDate(p.priorityDate ?? '');
    setEbCategory(p.ebCategory ?? EB_CATS[3]);
    setI140Status(p.i140Status ?? 'Not filed');
    setPerm(p.perm ?? 'Not started');
  }, []);

  const handleSave = () => {
    setImmigrationProfile({
      firstName, lastName, phone, country, location,
      visaType, startYear, statusExpiry, i94,
      jobTitle, employer, salary, experience, degree,
      gcStage, priorityDate, ebCategory, i140Status, perm,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const progress = [
    !!(firstName),
    !!(visaType),
    gcStage !== GC_STAGES[0],
  ].filter(Boolean).length;

  const TABS = [
    { id: 1 as Tab, icon: '👤', label: 'Personal',    done: !!firstName },
    { id: 2 as Tab, icon: '🛂', label: 'Visa & Work', done: !!visaType },
    { id: 3 as Tab, icon: '🟢', label: 'Green Card',  done: gcStage !== GC_STAGES[0] },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.content, IS_WEB && s.contentWeb]} showsVerticalScrollIndicator={true}>

      {/* Banner */}
      <LinearGradient colors={['#EBF9FB','#EEF2FF']} style={s.banner}>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerTitle}>Immigration Profile</Text>
          <Text style={s.bannerSub}>Saved locally · used by Visa Tools to personalise results</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 5 }}>
          {[1,2,3].map((i) => (
            <View key={i} style={[s.pip, { backgroundColor: i <= progress ? '#0099A8' : '#E4E8F0', width: i <= progress ? 32 : 20 }]} />
          ))}
        </View>
      </LinearGradient>

      {/* Auth row */}
      {authUser ? (
        <View style={s.authRow}>
          <View style={s.avatar}><Text style={s.avatarTxt}>{authUser.email[0].toUpperCase()}</Text></View>
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
          <Text style={s.signInTxt}>Sign in to sync your profile</Text>
          <Ionicons name="arrow-forward" size={14} color="#7367F0" />
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity key={t.id} style={[s.tabBtn, tab === t.id && s.tabBtnOn]} onPress={() => setTab(t.id)}>
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabTxt, tab === t.id && s.tabTxtOn]}>{t.label}</Text>
            {t.done && <View style={s.tabCheck}><Ionicons name="checkmark" size={10} color="#fff" /></View>}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Tab 1: Personal ── */}
      {tab === 1 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Personal Information</Text>
          <View style={s.grid2}>
            <Field label="First Name"><WInput value={firstName} onChange={setFirstName} placeholder="e.g. Ravi" /></Field>
            <Field label="Last Name"><WInput value={lastName} onChange={setLastName} placeholder="e.g. Kumar" /></Field>
            <Field label="Phone"><WInput value={phone} onChange={setPhone} placeholder="+1 555 000 0000" /></Field>
            <Field label="Work Location" hint="City, State"><WInput value={location} onChange={setLocation} placeholder="e.g. Dallas, TX" /></Field>
          </View>
          <Field label="Country of Origin"><ChipSelect value={country} options={COUNTRIES} onChange={setCountry} /></Field>
          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={() => setTab(2)}>
              <Text style={s.btnTxt}>Next: Visa & Work →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Tab 2: Visa & Work ── */}
      {tab === 2 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Visa & Employment Details</Text>
          <Field label="Visa Type"><ChipSelect value={visaType} options={VISA_TYPES} onChange={setVisaType} /></Field>
          <View style={s.grid2}>
            <Field label="Status Expires">
              {IS_WEB
                ? <input type="date" value={statusExpiry} onChange={(e: any) => setStatusExpiry(e.target.value)}
                    style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
                : <TextInput style={s.input} value={statusExpiry} onChangeText={setStatusExpiry} placeholder="YYYY-MM-DD" placeholderTextColor="#ACAEC5" />
              }
            </Field>
            <Field label="H1B Start Year in USA"><WInput value={startYear} onChange={setStartYear} placeholder="e.g. 2019" /></Field>
            <Field label="Job Title"><WInput value={jobTitle} onChange={setJobTitle} placeholder="e.g. Software Engineer" /></Field>
            <Field label="Employer Name"><WInput value={employer} onChange={setEmployer} placeholder="e.g. Google LLC" /></Field>
            <Field label="Annual Salary (USD)"><WInput value={salary} onChange={setSalary} placeholder="e.g. 130000" type="number" /></Field>
            <Field label="I-94 Number" hint="11-digit record"><WInput value={i94} onChange={setI94} placeholder="12345678901" mono /></Field>
          </View>
          <View style={s.grid2}>
            <Field label="Experience"><ChipSelect value={experience} options={EXP_LEVELS} onChange={setExperience} /></Field>
            <Field label="Highest Degree"><ChipSelect value={degree} options={DEGREES} onChange={setDegree} /></Field>
          </View>
          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, s.btnGhost, { flex: 1 }]} onPress={() => setTab(1)}>
              <Text style={[s.btnTxt, { color: '#8588A5' }]}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={() => setTab(3)}>
              <Text style={s.btnTxt}>Next: Green Card →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Tab 3: Green Card ── */}
      {tab === 3 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Green Card Journey</Text>
          <Field label="Current Stage"><ChipSelect value={gcStage} options={GC_STAGES} onChange={setGcStage} /></Field>
          <View style={s.grid2}>
            <Field label="Priority Date" hint="From PERM or I-140 notice">
              {IS_WEB
                ? <input type="month" value={priorityDate} onChange={(e: any) => setPriorityDate(e.target.value)}
                    style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
                : <TextInput style={s.input} value={priorityDate} onChangeText={setPriorityDate} placeholder="YYYY-MM" placeholderTextColor="#ACAEC5" />
              }
            </Field>
            <Field label="EB Category"><ChipSelect value={ebCategory} options={EB_CATS} onChange={setEbCategory} /></Field>
            <Field label="I-140 Status"><ChipSelect value={i140Status} options={['Not filed','Pending','Approved','Denied']} onChange={setI140Status} /></Field>
            <Field label="PERM Status"><ChipSelect value={perm} options={['Not started','Filed','Audited','Approved','Denied']} onChange={setPerm} /></Field>
          </View>

          {i140Status === 'Approved' && (
            <View style={s.infoBox}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#0E7490" />
              <Text style={s.infoTxt}>
                <Text style={{ fontFamily: 'Inter_700Bold' }}>AC21 Portability Active — </Text>
                You can change employers if I-485 has been pending 180+ days, same or similar occupation.
              </Text>
            </View>
          )}

          <View style={s.btnRow}>
            <TouchableOpacity style={[s.btn, s.btnGhost, { flex: 1 }]} onPress={() => setTab(2)}>
              <Text style={[s.btnTxt, { color: '#8588A5' }]}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: saved ? '#28C76F' : '#7367F0' }]} onPress={handleSave}>
              <Text style={s.btnTxt}>{saved ? '✓ Saved!' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick save button on tabs 1 & 2 */}
      {tab !== 3 && (
        <TouchableOpacity style={[s.quickSave, { backgroundColor: saved ? '#28C76F' : '#F0EEFF', borderColor: saved ? '#28C76F' : '#7367F0' }]} onPress={handleSave}>
          <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={14} color={saved ? '#fff' : '#7367F0'} />
          <Text style={[s.quickSaveTxt, { color: saved ? '#fff' : '#7367F0' }]}>{saved ? 'Saved!' : 'Save progress'}</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F4F5FA' },
  content:    { paddingBottom: 40 },
  contentWeb: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48, maxWidth: 760 } as any,
  banner:     { borderRadius: 12, padding: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: 'rgba(0,153,168,0.2)' },
  bannerTitle:{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#0E7490', marginBottom: 4 },
  bannerSub:  { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#4B4C6A', lineHeight: 18 },
  pip:        { height: 6, borderRadius: 3 },
  authRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#DBDADE' },
  avatar:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#7367F0', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  authEmail:  { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2F3349' },
  authPlan:   { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#8588A5', marginTop: 2 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFEEEE', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 6 },
  signOutTxt: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#EA5455' },
  signInBanner:{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 16, borderWidth: 1, borderLeftWidth: 3, borderColor: '#7367F0' } as any,
  signInTxt:  { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: '#2F3349' },
  tabs:       { flexDirection: 'row', gap: 3, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#DBDADE' },
  tabBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 8, position: 'relative' } as any,
  tabBtnOn:   { backgroundColor: '#7367F0' },
  tabIcon:    { fontSize: 14 },
  tabTxt:     { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#8588A5' },
  tabTxtOn:   { color: '#fff' },
  tabCheck:   { position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: '#28C76F', alignItems: 'center', justifyContent: 'center' } as any,
  section:    { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#DBDADE' },
  sectionTitle:{ fontSize: 15, fontFamily: 'Inter_700Bold', color: '#2F3349', marginBottom: 18 },
  grid2:      { flexDirection: IS_WEB ? 'row' as any : 'column', flexWrap: IS_WEB ? 'wrap' as any : undefined, gap: 14, marginBottom: 14 },
  group:      { flex: IS_WEB ? '0 0 calc(50% - 7px)' as any : undefined, marginBottom: IS_WEB ? 0 : 12 } as any,
  label:      { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#8588A5', letterSpacing: 0.3, marginBottom: 5 },
  hint:       { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#ACAEC5', marginTop: 3 },
  input:      { backgroundColor: '#F4F5FA', borderWidth: 1.5, borderColor: '#DBDADE', borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#2F3349' },
  chip:       { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE', marginBottom: 4 },
  chipOn:     { backgroundColor: '#F0EEFF', borderColor: '#7367F0' },
  chipTxt:    { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#8588A5' },
  chipTxtOn:  { color: '#7367F0', fontFamily: 'Inter_700Bold' },
  btnRow:     { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn:        { backgroundColor: '#7367F0', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  btnGhost:   { backgroundColor: '#F4F5FA', borderWidth: 1, borderColor: '#DBDADE' },
  btnTxt:     { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  quickSave:  { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginTop: 12, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  quickSaveTxt:{ fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  infoBox:    { flexDirection: 'row', gap: 10, backgroundColor: '#EBF9FB', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(0,153,168,0.2)', marginVertical: 12 },
  infoTxt:    { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#0E7490', lineHeight: 18 },
});
