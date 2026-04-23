// ═══════════════════════════════════════════════════════════════
// ProfileScreen — Modal overlay, 3-tab immigration profile
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { IS_WEB } from '../utils/responsive';

type Tab = 1 | 2 | 3;

const COUNTRIES  = ['🇮🇳 India','🇨🇳 China','🇵🇭 Philippines','🇲🇽 Mexico','🇰🇷 South Korea','🇧🇷 Brazil','🇳🇬 Nigeria','🌍 Other'];
const VISA_TYPES = ['H-1B','H-1B1','H-4','L-1A','L-1B','O-1','TN','F-1','J-1','B-1/B-2','Green Card','US Citizen','Other'];
const EXP_LEVELS = ['0–2 yrs','3–5 yrs','6–9 yrs','10+ yrs'];
const DEGREES    = ['High School','Associate',"Bachelor's","Master's",'PhD','Other'];
const GC_STAGES  = ['Not started','PERM filed','PERM approved','I-140 pending','I-140 approved','I-485 filed','Approved'];
const EB_CATS    = ['EB-1 (India)','EB-1 (China)','EB-1 (Others)','EB-2 (India)','EB-2 (China)','EB-2 (Others)','EB-3 (India)','EB-3 (Others)','N/A'];

// ── Shared form components ────────────────────────────────────
const F = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <View style={s.field}>
    <Text style={s.flabel}>{label}</Text>
    {children}
    {hint ? <Text style={s.fhint}>{hint}</Text> : null}
  </View>
);

const Input = ({ value, onChange, placeholder, type, mono }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; mono?: boolean;
}) => IS_WEB ? (
  <input
    value={value} onChange={(e: any) => onChange(e.target.value)}
    placeholder={placeholder} type={type ?? 'text'}
    style={{
      width: '100%', padding: '9px 12px', fontSize: '13px',
      fontFamily: mono ? 'monospace' : 'Inter, sans-serif',
      border: '1px solid #DBDADE', borderRadius: '8px',
      background: 'rgba(76,217,138,0.06)', outline: 'none', boxSizing: 'border-box',
      color: '#F0F4FF',
    } as any}
  />
) : (
  <TextInput style={[s.input, mono && { letterSpacing: 1 }]}
    value={value} onChangeText={onChange} placeholder={placeholder}
    placeholderTextColor="#ACAEC5" />
);

const Select = ({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) =>
  IS_WEB ? (
    <select value={value} onChange={(e: any) => onChange(e.target.value)} style={{
      width: '100%', padding: '9px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif',
      border: '1px solid #DBDADE', borderRadius: '8px', background: 'rgba(76,217,138,0.06)',
      outline: 'none', cursor: 'pointer', color: '#F0F4FF',
    } as any}>
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  ) : (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 6, paddingBottom: 4 }}>
        {options.map(o => (
          <TouchableOpacity key={o} onPress={() => onChange(o)}
            style={[s.chip, value === o && s.chipOn]}>
            <Text style={[s.chipTxt, value === o && s.chipTxtOn]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

const DateInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) =>
  IS_WEB ? (
    <input type="date" value={value} onChange={(e: any) => onChange(e.target.value)} style={{
      width: '100%', padding: '12px 14px', fontSize: '15px', fontFamily: 'Inter_400Regular',
      border: '1px solid rgba(255,255,255,0.14)', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.05)',
      outline: 'none', cursor: 'pointer', boxSizing: 'border-box', color: '#F0F4FF',
    } as any} />
  ) : (
    <TextInput style={s.input} value={value} onChangeText={onChange}
      placeholder={placeholder ?? 'YYYY-MM-DD'} placeholderTextColor="#ACAEC5" />
  );

const MonthInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) =>
  IS_WEB ? (
    <input type="month" value={value} onChange={(e: any) => onChange(e.target.value)} style={{
      width: '100%', padding: '9px 12px', fontSize: '13px', fontFamily: 'Inter, sans-serif',
      border: '1px solid #DBDADE', borderRadius: '8px', background: 'rgba(76,217,138,0.06)',
      outline: 'none', boxSizing: 'border-box', color: '#F0F4FF',
    } as any} />
  ) : (
    <TextInput style={s.input} value={value} onChangeText={onChange}
      placeholder="YYYY-MM" placeholderTextColor="#ACAEC5" />
  );

// ── Main component ────────────────────────────────────────────
export const ProfileScreen: React.FC<{ visible?: boolean; onClose?: () => void }> = ({
  visible = true, onClose,
}) => {
  const authUser              = useStore(st => st.authUser);
  const isPremium             = useStore(st => st.isPremium);
  const signOut               = useStore(st => st.signOut);
  const immigrationProfile    = useStore(st => st.immigrationProfile);
  const setImmigrationProfile = useStore(st => st.setImmigrationProfile);

  const [tab,   setTab]   = useState<Tab>(1);
  const [saved, setSaved] = useState(false);

  const [firstName,   setFirstName]   = useState('');
  const [lastName,    setLastName]    = useState('');
  const [phone,       setPhone]       = useState('');
  const [country,     setCountry]     = useState(COUNTRIES[0]);
  const [location,    setLocation]    = useState('');
  const [visaType,    setVisaType]    = useState('H-1B');
  const [startYear,   setStartYear]   = useState('');
  const [statusExpiry,setStatusExpiry]= useState('');
  const [i94,         setI94]         = useState('');
  const [jobTitle,    setJobTitle]    = useState('');
  const [employer,    setEmployer]    = useState('');
  const [salary,      setSalary]      = useState('');
  const [experience,  setExperience]  = useState(EXP_LEVELS[1]);
  const [degree,      setDegree]      = useState(DEGREES[3]);
  const [gcStage,     setGcStage]     = useState(GC_STAGES[0]);
  const [priorityDate,setPriorityDate]= useState('');
  const [ebCategory,  setEbCategory]  = useState(EB_CATS[3]);
  const [i140Status,  setI140Status]  = useState('Not filed');
  const [perm,        setPerm]        = useState('Not started');

  useEffect(() => {
    if (!immigrationProfile) return;
    const p = immigrationProfile;
    setFirstName(p.firstName ?? '');   setLastName(p.lastName ?? '');
    setPhone(p.phone ?? '');           setCountry(p.country ?? COUNTRIES[0]);
    setLocation(p.location ?? '');     setVisaType(p.visaType ?? 'H-1B');
    setStartYear(p.startYear ?? '');   setStatusExpiry(p.statusExpiry ?? '');
    setI94(p.i94 ?? '');               setJobTitle(p.jobTitle ?? '');
    setEmployer(p.employer ?? '');     setSalary(p.salary ?? '');
    setExperience(p.experience ?? EXP_LEVELS[1]);
    setDegree(p.degree ?? DEGREES[3]);
    setGcStage(p.gcStage ?? GC_STAGES[0]);
    setPriorityDate(p.priorityDate ?? '');
    setEbCategory(p.ebCategory ?? EB_CATS[3]);
    setI140Status(p.i140Status ?? 'Not filed');
    setPerm(p.perm ?? 'Not started');
  }, [visible]); // reload each time modal opens

  const handleSave = () => {
    setImmigrationProfile({
      firstName, lastName, phone, country, location,
      visaType, startYear, statusExpiry, i94,
      jobTitle, employer, salary, experience, degree,
      gcStage, priorityDate, ebCategory, i140Status, perm,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); if (tab === 3) onClose?.(); }, 1500);
  };

  const progress = [!!firstName, !!visaType, gcStage !== GC_STAGES[0]].filter(Boolean).length;

  const TABS: { id: Tab; icon: string; label: string; done: boolean }[] = [
    { id: 1, icon: '👤', label: 'Personal',    done: !!firstName },
    { id: 2, icon: '🛂', label: 'Visa & Work', done: !!visaType },
    { id: 3, icon: '🟢', label: 'Green Card',  done: gcStage !== GC_STAGES[0] },
  ];

  const content = (
    <View style={s.sheet}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Immigration Profile</Text>
          <Text style={s.headerSub}>All fields optional · saved locally</Text>
        </View>
        {/* Progress pips */}
        <View style={s.pips}>
          {[1,2,3].map(i => (
            <View key={i} style={[s.pip, { backgroundColor: i <= progress ? '#6FAFF2' : 'rgba(255,255,255,0.10)', width: i <= progress ? 28 : 16 }]} />
          ))}
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color="#8588A5" />
          </TouchableOpacity>
        )}
      </View>

      {/* Auth row */}
      <View style={s.authRow}>
        {authUser ? (
          <>
            <View style={s.avatar}><Text style={s.avatarTxt}>{authUser.email[0].toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.authEmail} numberOfLines={1}>{authUser.email}</Text>
              <Text style={s.authPlan}>{isPremium ? '⭐ Premium' : 'Free Plan'}</Text>
            </View>
            <TouchableOpacity style={s.signOutBtn} onPress={() => { signOut?.(); onClose?.(); }}>
              <Ionicons name="log-out-outline" size={13} color="#FF6B6B" />
              <Text style={s.signOutTxt}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)' }}>
            Sign in to sync profile across devices
          </Text>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} style={[s.tabBtn, tab === t.id && s.tabBtnOn]} onPress={() => setTab(t.id)}>
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabTxt, tab === t.id && s.tabTxtOn]}>{t.label}</Text>
            {t.done && <View style={s.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={s.body}>

        {tab === 1 && (
          <>
            <View style={s.row2}>
              <F label="First Name"><Input value={firstName} onChange={setFirstName} placeholder="First name" /></F>
              <F label="Last Name"><Input value={lastName} onChange={setLastName} placeholder="Last name" /></F>
            </View>
            <View style={s.row2}>
              <F label="Phone"><Input value={phone} onChange={setPhone} placeholder="+1 555 000 0000" /></F>
              <F label="Work Location"><Input value={location} onChange={setLocation} placeholder="Dallas, TX" /></F>
            </View>
            <F label="Country of Origin"><Select value={country} options={COUNTRIES} onChange={setCountry} /></F>
          </>
        )}

        {tab === 2 && (
          <>
            <F label="Visa Type"><Select value={visaType} options={VISA_TYPES} onChange={setVisaType} /></F>
            <View style={s.row2}>
              <F label="Status Expires"><DateInput value={statusExpiry} onChange={setStatusExpiry} /></F>
              <F label="H1B Start Year"><Input value={startYear} onChange={setStartYear} placeholder="2019" /></F>
            </View>
            <View style={s.row2}>
              <F label="Job Title"><Input value={jobTitle} onChange={setJobTitle} placeholder="Software Engineer" /></F>
              <F label="Employer"><Input value={employer} onChange={setEmployer} placeholder="Google LLC" /></F>
            </View>
            <View style={s.row2}>
              <F label="Annual Salary (USD)"><Input value={salary} onChange={setSalary} placeholder="130000" type="number" /></F>
              <F label="I-94 Number" hint="11-digit record"><Input value={i94} onChange={setI94} placeholder="12345678901" mono /></F>
            </View>
            <View style={s.row2}>
              <F label="Experience"><Select value={experience} options={EXP_LEVELS} onChange={setExperience} /></F>
              <F label="Degree"><Select value={degree} options={DEGREES} onChange={setDegree} /></F>
            </View>
          </>
        )}

        {tab === 3 && (
          <>
            <F label="Current GC Stage"><Select value={gcStage} options={GC_STAGES} onChange={setGcStage} /></F>
            <View style={s.row2}>
              <F label="Priority Date" hint="From PERM or I-140"><MonthInput value={priorityDate} onChange={setPriorityDate} /></F>
              <F label="EB Category"><Select value={ebCategory} options={EB_CATS} onChange={setEbCategory} /></F>
            </View>
            <View style={s.row2}>
              <F label="I-140 Status"><Select value={i140Status} options={['Not filed','Pending','Approved','Denied']} onChange={setI140Status} /></F>
              <F label="PERM Status"><Select value={perm} options={['Not started','Filed','Audited','Approved','Denied']} onChange={setPerm} /></F>
            </View>
            {i140Status === 'Approved' && (
              <View style={s.infoBox}>
                <Ionicons name="shield-checkmark" size={15} color="#28C76F" />
                <Text style={s.infoTxt}>AC21 portability active — you can change employers after I-485 is pending 180+ days.</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* Footer nav */}
      <View style={s.footer}>
        {tab > 1 ? (
          <TouchableOpacity style={s.footerBack} onPress={() => setTab((tab - 1) as Tab)}>
            <Ionicons name="arrow-back" size={16} color="#8588A5" />
            <Text style={s.footerBackTxt}>Back</Text>
          </TouchableOpacity>
        ) : <View style={{ flex: 1 }} />}

        <TouchableOpacity
          style={[s.footerSave, { backgroundColor: saved ? '#4CD98A' : '#6FAFF2' }]}
          onPress={tab === 3 ? handleSave : () => { handleSave(); setTab((tab + 1) as Tab); }}
        >
          <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={16} color="#fff" />
          <Text style={s.footerSaveTxt}>
            {saved ? 'Saved!' : tab === 3 ? 'Save & Close' : 'Save & Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Web: render as a right-side panel overlay, not a full navigation screen
  if (IS_WEB) {
    if (!visible) return null;
    return (
      <View style={s.overlay} pointerEvents="box-none">
        <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={s.panel}>{content}</View>
      </View>
    );
  }

  // Mobile: use Modal
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={s.panel}>{content}</View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay:    { position: 'fixed' as any, inset: 0, zIndex: 2000, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,8,18,0.80)' } as any,
  backdrop:   { position: 'absolute' as any, inset: 0 } as any,
  panel:      { width: '100%', maxWidth: 520, maxHeight: '90%' as any, backgroundColor: '#0C1A34', borderRadius: 16, overflow: 'hidden', display: 'flex' as any, flexDirection: 'column', zIndex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...Platform.select({ web: { boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any }) } as any,
  sheet:      { flex: 1, display: 'flex' as any, flexDirection: 'column' },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  headerTitle:{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#F0F4FF' },
  headerSub:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.35)', marginTop: 2 },
  pips:       { flexDirection: 'row', gap: 4, alignItems: 'center' },
  pip:        { height: 5, borderRadius: 3 },
  closeBtn:   { width: 32, height: 32, borderRadius: 8, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  authRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(76,217,138,0.06)', borderBottomWidth: 1, borderBottomColor: 'transparent' },
  avatar:     { width: 30, height: 30, borderRadius: 15, backgroundColor: '#6FAFF2', alignItems: 'center', justifyContent: 'center' },
  avatarTxt:  { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  authEmail:  { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF' },
  authPlan:   { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', marginTop: 1 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,107,107,0.10)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  signOutTxt: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#FF6B6B' },
  tabs:       { flexDirection: 'row', padding: 10, gap: 6, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  tabBtn:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8, position: 'relative' as any },
  tabBtnOn:   { backgroundColor: '#6FAFF2' },
  tabIcon:    { fontSize: 13 },
  tabTxt:     { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)' },
  tabTxtOn:   { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  tabDot:     { position: 'absolute' as any, top: 5, right: 8, width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CD98A' },
  body:       { padding: 20, gap: 14 } as any,
  row2:       { flexDirection: 'row', gap: 12 } as any,
  field:      { flex: 1, gap: 5 } as any,
  flabel:     { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.55)', letterSpacing: 0.3 },
  fhint:      { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.35)' },
  input:      { height: 38, backgroundColor: 'rgba(76,217,138,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', borderRadius: 8, paddingHorizontal: 12, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#F0F4FF' },
  chip:       { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  chipOn:     { backgroundColor: 'rgba(59,139,232,0.14)', borderColor: '#6FAFF2' },
  chipTxt:    { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)' },
  chipTxtOn:  { color: '#6FAFF2', fontFamily: 'Inter_700Bold' },
  infoBox:    { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(76,217,138,0.10)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#D1FAE5' },
  infoTxt:    { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#4CD98A', lineHeight: 17 },
  footer:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: 'transparent' },
  footerBack: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  footerBackTxt:{ fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)' },
  footerSave: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: 8 },
  footerSaveTxt:{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
});
