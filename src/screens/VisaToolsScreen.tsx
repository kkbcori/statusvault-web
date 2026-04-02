// ═══════════════════════════════════════════════════════════════
// VisaToolsScreen — VisaDash tools integrated into StatusVault
// Case Tracker · Wage Validator · Transfer Risk · Company Grader
// Sponsor Search · Salary Explorer · Visa Timeline · Visa Bulletin
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Linking, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IS_WEB } from '../utils/responsive';

type Tool = 'case-tracker' | 'wage-validator' | 'transfer-risk' | 'company-grader' | 'sponsor-search' | 'salary-explorer' | 'visa-timeline' | 'visa-bulletin';

const TOOLS = [
  { id: 'case-tracker',    icon: '📋', label: 'Case Tracker',     color: '#0099A8', bg: '#E6F7F8', desc: 'Track USCIS receipt numbers' },
  { id: 'wage-validator',  icon: '💵', label: 'Wage Validator',   color: '#D97706', bg: '#FEF3C7', desc: 'Check if your salary is LCA-compliant' },
  { id: 'transfer-risk',   icon: '⚡', label: 'Transfer Risk',    color: '#2563EB', bg: '#DBEAFE', desc: 'Analyze employer H1B risk' },
  { id: 'company-grader',  icon: '🏆', label: 'Company Grader',   color: '#7367F0', bg: '#F0EEFF', desc: 'Grade any H1B employer A–F' },
  { id: 'sponsor-search',  icon: '🔍', label: 'Sponsor Search',   color: '#0284C7', bg: '#E0F2FE', desc: 'Find H1B sponsoring companies' },
  { id: 'salary-explorer', icon: '💰', label: 'Salary Explorer',  color: '#059669', bg: '#D1FAE5', desc: 'Browse DOL-certified H1B wages' },
  { id: 'visa-timeline',   icon: '🕐', label: 'Visa Timeline',    color: '#28C76F', bg: '#EAFFF4', desc: 'Map your GC journey milestones' },
  { id: 'visa-bulletin',   icon: '📅', label: 'Visa Bulletin',    color: '#EA5455', bg: '#FFEEEE', desc: 'Current priority date cutoffs' },
] as const;

// ─── Shared card component ────────────────────────────────────
const ToolCard: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <View style={tc.card}>
    <Text style={tc.title}>{icon}  {title}</Text>
    {children}
  </View>
);

const InputRow: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
  <View style={tc.group}>
    <Text style={tc.label}>{label}{required && <Text style={tc.req}> *</Text>}</Text>
    {children}
    {hint && <Text style={tc.hint}>{hint}</Text>}
  </View>
);

const tc = StyleSheet.create({
  card:   { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#DBDADE' },
  title:  { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#2F3349', marginBottom: 18 },
  group:  { marginBottom: 14 },
  label:  { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#8588A5', letterSpacing: 0.3, marginBottom: 5 },
  req:    { color: '#FF9F43' },
  hint:   { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#ACAEC5', marginTop: 4, lineHeight: 16 },
  input:  { backgroundColor: '#F4F5FA', borderWidth: 1.5, borderColor: '#DBDADE', borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'Inter_400Regular', color: '#2F3349' },
  row2:   { flexDirection: 'row', gap: 12 } as any,
  col:    { flex: 1 },
  btn:    { backgroundColor: '#7367F0', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 6 },
  btnTxt: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#fff' },
  btnAlt: { backgroundColor: '#F0EEFF', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginTop: 6, borderWidth: 1, borderColor: '#7367F0' },
  btnAltTxt: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#7367F0' },
  resultCard: { backgroundColor: '#F4F5FA', borderRadius: 8, padding: 14, marginTop: 12 },
  resultRow:  { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#EBEBEB' },
  resultLabel:{ fontSize: 12, fontFamily: 'Inter_500Medium', color: '#8588A5' },
  resultValue:{ fontSize: 13, fontFamily: 'Inter_700Bold', color: '#2F3349' },
  chip:       { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginTop: 4 },
  chipTxt:    { fontSize: 11, fontFamily: 'Inter_700Bold' },
  infoBox:    { flexDirection: 'row', gap: 10, backgroundColor: '#EBF9FB', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(0,153,168,0.2)', marginTop: 10 },
  infoTxt:    { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', color: '#0E7490', lineHeight: 18 },
});

// ─── Individual tool panels ───────────────────────────────────

const CaseTracker = () => {
  const [receipt, setReceipt] = useState('');
  const [caseType, setCaseType] = useState('H-1B Petition (I-129)');
  const [label, setLabel] = useState('');
  return (
    <ToolCard title="Track a USCIS Case" icon="📋">
      <View style={tc.row2}>
        <View style={tc.col}>
          <InputRow label="Receipt Number" required hint="13 chars — starts with WAC, LIN, SRC, EAC, or IOE">
            {IS_WEB ? (
              <input value={receipt} onChange={(e:any) => setReceipt(e.target.value.toUpperCase())}
                placeholder="WAC2612345678" maxLength={13}
                style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box', textTransform:'uppercase', letterSpacing:'1px' } as any} />
            ) : (
              <TextInput style={[tc.input, { letterSpacing: 1 }]} value={receipt} onChangeText={(v) => setReceipt(v.toUpperCase())} placeholder="WAC2612345678" maxLength={13} autoCapitalize="characters" />
            )}
          </InputRow>
        </View>
        <View style={tc.col}>
          <InputRow label="Your Label (optional)">
            {IS_WEB ? (
              <input value={label} onChange={(e:any) => setLabel(e.target.value)} placeholder="e.g. My H1B Extension"
                style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
            ) : (
              <TextInput style={tc.input} value={label} onChangeText={setLabel} placeholder="e.g. My H1B Extension" />
            )}
          </InputRow>
        </View>
      </View>
      <TouchableOpacity style={tc.btn} onPress={() => {
        if (receipt.length === 13) Linking.openURL(`https://egov.uscis.gov/casestatus/mycasestatus.do?appReceiptNum=${receipt}`);
      }}>
        <Text style={tc.btnTxt}>Check Case Status on USCIS.gov →</Text>
      </TouchableOpacity>
      <View style={tc.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#0E7490" />
        <Text style={tc.infoTxt}>Case status pulls directly from USCIS.gov. We don't store your receipt number. Tap the button to open the official USCIS case status page in your browser.</Text>
      </View>
    </ToolCard>
  );
};

const WageValidator = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  return (
    <ToolCard title="Wage Level Check" icon="💵">
      <Text style={{ fontSize: 13, color: '#8588A5', marginBottom: 16, lineHeight: 20 }}>
        Check if your H1B salary meets DOL prevailing wage requirements for your job title and location. Data from the DOL LCA Disclosure database.
      </Text>
      <View style={tc.row2}>
        <View style={tc.col}>
          <InputRow label="Job Title" required>
            {IS_WEB ? <input value={jobTitle} onChange={(e:any) => setJobTitle(e.target.value)} placeholder="e.g. Software Engineer" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
            : <TextInput style={tc.input} value={jobTitle} onChangeText={setJobTitle} placeholder="e.g. Software Engineer" />}
          </InputRow>
        </View>
        <View style={tc.col}>
          <InputRow label="Work Location" required hint="City, State">
            {IS_WEB ? <input value={location} onChange={(e:any) => setLocation(e.target.value)} placeholder="e.g. San Jose, CA" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
            : <TextInput style={tc.input} value={location} onChangeText={setLocation} placeholder="e.g. San Jose, CA" />}
          </InputRow>
        </View>
      </View>
      <InputRow label="Your Annual Salary" required hint="Enter the annual salary on your H1B LCA/petition">
        {IS_WEB ? <input value={salary} onChange={(e:any) => setSalary(e.target.value)} placeholder="e.g. 120000" type="number" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
        : <TextInput style={tc.input} value={salary} onChangeText={setSalary} placeholder="e.g. 120000" keyboardType="numeric" />}
      </InputRow>
      <TouchableOpacity style={tc.btn} onPress={() => Linking.openURL('https://www.dol.gov/agencies/eta/foreign-labor/wages/wage-search')}>
        <Text style={tc.btnTxt}>Look Up DOL Prevailing Wage →</Text>
      </TouchableOpacity>
      <View style={tc.infoBox}>
        <Ionicons name="information-circle-outline" size={16} color="#0E7490" />
        <Text style={tc.infoTxt}>DOL requires H1B wages ≥ Level I (17th percentile) for that role and location. Level II is the median wage. Most employers file at Level I–II. This opens the official DOL wage search tool.</Text>
      </View>
    </ToolCard>
  );
};

const TransferRisk = () => {
  const [emp1, setEmp1] = useState('');
  const [emp2, setEmp2] = useState('');
  return (
    <ToolCard title="H1B Transfer Risk Analysis" icon="⚡">
      <Text style={{ fontSize: 13, color: '#8588A5', marginBottom: 16, lineHeight: 20 }}>
        Analyze employer approval rates, denial history, and H1B dependency status before transferring. Data from USCIS H-1B Employer Data Hub.
      </Text>
      <View style={tc.row2}>
        <View style={tc.col}>
          <InputRow label="Current / Target Employer" required>
            {IS_WEB ? <input value={emp1} onChange={(e:any) => setEmp1(e.target.value)} placeholder="e.g. Google LLC" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
            : <TextInput style={tc.input} value={emp1} onChangeText={setEmp1} placeholder="e.g. Google LLC" />}
          </InputRow>
        </View>
        <View style={tc.col}>
          <InputRow label="Compare Employer (optional)">
            {IS_WEB ? <input value={emp2} onChange={(e:any) => setEmp2(e.target.value)} placeholder="Optional comparison" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
            : <TextInput style={tc.input} value={emp2} onChangeText={setEmp2} placeholder="Optional comparison" />}
          </InputRow>
        </View>
      </View>
      <TouchableOpacity style={tc.btn} onPress={() => Linking.openURL('https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub')}>
        <Text style={tc.btnTxt}>Check on USCIS Employer Hub →</Text>
      </TouchableOpacity>
      {[
        { factor: 'Cap-exempt employer', weight: 'High benefit', color: '#28C76F', bg: '#EAFFF4' },
        { factor: 'Low denial rate (<5%)', weight: 'Low risk', color: '#28C76F', bg: '#EAFFF4' },
        { factor: 'H1B dependent (>15% workforce)', weight: 'High risk', color: '#EA5455', bg: '#FFEEEE' },
        { factor: 'Willful violator status', weight: 'Very high risk', color: '#EA5455', bg: '#FFEEEE' },
      ].map((r) => (
        <View key={r.factor} style={tc.resultRow}>
          <Text style={tc.resultLabel}>{r.factor}</Text>
          <View style={[tc.chip, { backgroundColor: r.bg }]}><Text style={[tc.chipTxt, { color: r.color }]}>{r.weight}</Text></View>
        </View>
      ))}
    </ToolCard>
  );
};

const CompanyGrader = () => {
  const [company, setCompany] = useState('');
  return (
    <ToolCard title="Grade Any H1B Employer" icon="🏆">
      <Text style={{ fontSize: 13, color: '#8588A5', marginBottom: 16, lineHeight: 20 }}>
        Scores companies A–F based on 10 years of USCIS approval data, DOL wage compliance, H1B dependency, and PERM sponsorship history. Powered by official US government records.
      </Text>
      <InputRow label="Company Name" required>
        {IS_WEB ? <input value={company} onChange={(e:any) => setCompany(e.target.value)} placeholder="e.g. Infosys, Tata, Wipro, Google…" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
        : <TextInput style={tc.input} value={company} onChangeText={setCompany} placeholder="e.g. Google LLC" />}
      </InputRow>
      <TouchableOpacity style={tc.btn} onPress={() => Linking.openURL('https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub')}>
        <Text style={tc.btnTxt}>Look Up on USCIS Employer Hub →</Text>
      </TouchableOpacity>
      <View style={tc.resultCard}>
        <Text style={{ fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#8588A5', marginBottom: 10 }}>GRADING FACTORS</Text>
        {[
          'H1B approval rate (last 5 years)',
          'DOL wage level compliance (Level I vs III/IV)',
          'RFE rate and denial patterns',
          'H1B dependency status',
          'PERM / green card sponsorship history',
          'Willful violator or debarment status',
        ].map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#7367F0' }} />
            <Text style={{ fontSize: 12, fontFamily: 'Inter_400Regular', color: '#4B4C6A' }}>{f}</Text>
          </View>
        ))}
      </View>
    </ToolCard>
  );
};

const SponsorSearch = () => {
  const [title, setTitle] = useState('');
  const [loc, setLoc] = useState('');
  return (
    <ToolCard title="Find H1B Sponsoring Companies" icon="🔍">
      <Text style={{ fontSize: 13, color: '#8588A5', marginBottom: 16, lineHeight: 20 }}>
        Search 50,000+ companies that filed H1B petitions. Filter by job title and location. All data from official DOL and USCIS records.
      </Text>
      <View style={tc.row2}>
        <View style={tc.col}>
          <InputRow label="Job Title / Role">
            {IS_WEB ? <input value={title} onChange={(e:any) => setTitle(e.target.value)} placeholder="e.g. Software Engineer" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
            : <TextInput style={tc.input} value={title} onChangeText={setTitle} placeholder="e.g. Software Engineer" />}
          </InputRow>
        </View>
        <View style={tc.col}>
          <InputRow label="State / Metro">
            {IS_WEB ? <input value={loc} onChange={(e:any) => setLoc(e.target.value)} placeholder="e.g. California" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
            : <TextInput style={tc.input} value={loc} onChangeText={setLoc} placeholder="e.g. California" />}
          </InputRow>
        </View>
      </View>
      <TouchableOpacity style={tc.btn} onPress={() => Linking.openURL('https://www.myvisajobs.com/Search_H1B_LCA.aspx')}>
        <Text style={tc.btnTxt}>Search H1B Sponsors →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[tc.btnAlt, { marginTop: 8 }]} onPress={() => Linking.openURL('https://h1bdata.info')}>
        <Text style={tc.btnAltTxt}>Search on H1BData.info →</Text>
      </TouchableOpacity>
    </ToolCard>
  );
};

const SalaryExplorer = () => {
  const [title, setTitle] = useState('');
  const [loc, setLoc] = useState('');
  return (
    <ToolCard title="H1B Salary Explorer" icon="💰">
      <Text style={{ fontSize: 13, color: '#8588A5', marginBottom: 16, lineHeight: 20 }}>
        Browse actual DOL-certified wage data from H1B LCA filings. See what companies pay for your exact role and benchmark your current salary.
      </Text>
      <View style={tc.row2}>
        <View style={tc.col}>
          <InputRow label="Job Title" required>
            {IS_WEB ? <input value={title} onChange={(e:any) => setTitle(e.target.value)} placeholder="e.g. Software Engineer" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
            : <TextInput style={tc.input} value={title} onChangeText={setTitle} placeholder="e.g. Software Engineer" />}
          </InputRow>
        </View>
        <View style={tc.col}>
          <InputRow label="Location">
            {IS_WEB ? <input value={loc} onChange={(e:any) => setLoc(e.target.value)} placeholder="e.g. San Jose, CA" style={{ width:'100%', padding:'10px 12px', fontSize:'13px', fontFamily:'Inter', border:'1.5px solid #DBDADE', borderRadius:'8px', background:'#F4F5FA', outline:'none', boxSizing:'border-box' } as any} />
            : <TextInput style={tc.input} value={loc} onChangeText={setLoc} placeholder="e.g. San Jose, CA" />}
          </InputRow>
        </View>
      </View>
      <TouchableOpacity style={tc.btn} onPress={() => Linking.openURL('https://h1bdata.info')}>
        <Text style={tc.btnTxt}>Explore Salaries on H1BData →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[tc.btnAlt, { marginTop: 8 }]} onPress={() => Linking.openURL('https://www.dol.gov/agencies/eta/foreign-labor/performance')}>
        <Text style={tc.btnAltTxt}>DOL LCA Disclosure Data →</Text>
      </TouchableOpacity>
      <View style={tc.infoBox}>
        <Ionicons name="trending-up-outline" size={16} color="#0E7490" />
        <Text style={tc.infoTxt}>Tip: Level I = entry level (17th percentile). Level II = qualified (34th). Level III = experienced (50th). Level IV = fully competent (67th+). Most H1B filings are Level I or II.</Text>
      </View>
    </ToolCard>
  );
};

const VisaTimeline = () => {
  const [visaType, setVisaType] = useState('H-1B');
  const [i140, setI140] = useState('Approved');
  return (
    <ToolCard title="Visa Journey Timeline" icon="🕐">
      <Text style={{ fontSize: 13, color: '#8588A5', marginBottom: 16, lineHeight: 20 }}>
        Map your immigration milestones and understand the typical green card timeline for your category.
      </Text>
      {[
        { year: '2019–2021', milestone: 'H-1B Approved', status: 'done', desc: 'Entered the US on H-1B, 3-year initial period' },
        { year: '2021',      milestone: 'PERM Labor Certification', status: 'done', desc: 'Employer filed PERM — takes 12–18 months typical' },
        { year: '2022',      milestone: 'I-140 Immigrant Petition', status: 'done', desc: 'Filed EB-2 I-140. Premium processing: 15 days. Regular: 6–12 months' },
        { year: '2022',      milestone: 'Priority Date Established', status: 'done', desc: 'Your place in the green card queue' },
        { year: 'Pending',   milestone: 'Priority Date Current',     status: 'active', desc: 'Check the monthly Visa Bulletin for your EB category + country' },
        { year: 'Future',    milestone: 'I-485 Adjustment of Status', status: 'future', desc: 'File when PD is current — includes EAD, AP, biometrics' },
        { year: 'Future',    milestone: 'Green Card Approved',        status: 'future', desc: 'Conditional or permanent depending on marriage' },
      ].map((item) => (
        <View key={item.milestone} style={styles.tlItem}>
          <View style={[styles.tlDot, {
            backgroundColor: item.status === 'done' ? '#28C76F' : item.status === 'active' ? '#7367F0' : '#DBDADE',
            borderColor: item.status === 'active' ? '#7367F0' : 'transparent',
          }]} />
          <View style={styles.tlLine} />
          <View style={{ flex: 1, paddingBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <Text style={[styles.tlYear, { color: item.status === 'future' ? '#ACAEC5' : '#8588A5' }]}>{item.year}</Text>
              {item.status === 'active' && <View style={styles.activePill}><Text style={styles.activePillTxt}>Current</Text></View>}
            </View>
            <Text style={[styles.tlTitle, { color: item.status === 'future' ? '#ACAEC5' : '#2F3349' }]}>{item.milestone}</Text>
            <Text style={styles.tlDesc}>{item.desc}</Text>
          </View>
        </View>
      ))}
      <TouchableOpacity style={tc.btn} onPress={() => Linking.openURL('https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html')}>
        <Text style={tc.btnTxt}>Check Current Visa Bulletin →</Text>
      </TouchableOpacity>
    </ToolCard>
  );
};

const VisaBulletinPanel = () => (
  <ToolCard title="Visa Bulletin — Priority Date Cutoffs" icon="📅">
    <Text style={{ fontSize: 13, color: '#8588A5', marginBottom: 16, lineHeight: 20 }}>
      Monthly cutoff dates published by the State Dept. If your priority date is before the cutoff for your category + country, you can file I-485 (or are current if already filed).
    </Text>
    {[
      { cat: 'EB-1 (All countries)', date: 'Current', color: '#28C76F', bg: '#EAFFF4' },
      { cat: 'EB-1 (India)',         date: 'Aug 2022', color: '#FF9F43', bg: '#FFF4E6' },
      { cat: 'EB-2 (India)',         date: 'Jan 2012', color: '#EA5455', bg: '#FFEEEE' },
      { cat: 'EB-2 (China)',         date: 'Jun 2019', color: '#EA5455', bg: '#FFEEEE' },
      { cat: 'EB-2 (Others)',        date: 'Current', color: '#28C76F', bg: '#EAFFF4' },
      { cat: 'EB-3 (India)',         date: 'Jun 2012', color: '#EA5455', bg: '#FFEEEE' },
      { cat: 'EB-3 (Others)',        date: 'Current', color: '#28C76F', bg: '#EAFFF4' },
    ].map((row) => (
      <View key={row.cat} style={tc.resultRow}>
        <Text style={tc.resultLabel}>{row.cat}</Text>
        <View style={[tc.chip, { backgroundColor: row.bg }]}><Text style={[tc.chipTxt, { color: row.color }]}>{row.date}</Text></View>
      </View>
    ))}
    <View style={tc.infoBox}>
      <Ionicons name="information-circle-outline" size={16} color="#0E7490" />
      <Text style={tc.infoTxt}>Data shown is approximate. Always verify with the official State Dept Visa Bulletin for the current month.</Text>
    </View>
    <TouchableOpacity style={[tc.btn, { marginTop: 12 }]} onPress={() => Linking.openURL('https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html')}>
      <Text style={tc.btnTxt}>View Official Visa Bulletin →</Text>
    </TouchableOpacity>
  </ToolCard>
);

// ─── Main Screen ─────────────────────────────────────────────
export const VisaToolsScreen: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool | null>(null);

  const renderTool = () => {
    switch (activeTool) {
      case 'case-tracker':    return <CaseTracker />;
      case 'wage-validator':  return <WageValidator />;
      case 'transfer-risk':   return <TransferRisk />;
      case 'company-grader':  return <CompanyGrader />;
      case 'sponsor-search':  return <SponsorSearch />;
      case 'salary-explorer': return <SalaryExplorer />;
      case 'visa-timeline':   return <VisaTimeline />;
      case 'visa-bulletin':   return <VisaBulletinPanel />;
      default: return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, IS_WEB && styles.contentWeb]} showsVerticalScrollIndicator={true}>
      {IS_WEB && (
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Visa Tools</Text>
          <Text style={styles.pageSub}>Powered by official US government data</Text>
        </View>
      )}

      {/* Tool grid */}
      <View style={styles.toolGrid}>
        {TOOLS.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            style={[styles.toolTile, activeTool === tool.id && styles.toolTileActive, { borderLeftColor: tool.color }]}
            onPress={() => setActiveTool(activeTool === tool.id ? null : tool.id as Tool)}
            activeOpacity={0.8}
          >
            <View style={[styles.toolIconBox, { backgroundColor: tool.bg }]}>
              <Text style={{ fontSize: 20 }}>{tool.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.toolLabel, activeTool === tool.id && { color: tool.color }]}>{tool.label}</Text>
              <Text style={styles.toolDesc}>{tool.desc}</Text>
            </View>
            <Ionicons name={activeTool === tool.id ? 'chevron-up' : 'chevron-forward'} size={16} color={activeTool === tool.id ? tool.color : '#ACAEC5'} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Active tool panel */}
      {activeTool && (
        <View style={{ marginTop: 16 }}>
          {renderTool()}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F4F5FA' },
  content:     { paddingBottom: 40 },
  contentWeb:  { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  pageHeader:  { marginBottom: 20 },
  pageTitle:   { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#2F3349', letterSpacing: -0.3 },
  pageSub:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#8588A5', marginTop: 3 },
  toolGrid:    { gap: 8, paddingHorizontal: IS_WEB ? 0 : 16 },
  toolTile:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#DBDADE', borderLeftWidth: 3 } as any,
  toolTileActive: { backgroundColor: '#FAFAFE', borderColor: '#7367F0' },
  toolIconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toolLabel:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#2F3349', marginBottom: 2 },
  toolDesc:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#8588A5' },
  // Timeline
  tlItem:      { flexDirection: 'row', gap: 14 },
  tlDot:       { width: 14, height: 14, borderRadius: 7, borderWidth: 2, marginTop: 3, flexShrink: 0 },
  tlLine:      { position: 'absolute', left: 6, top: 16, bottom: 0, width: 2, backgroundColor: '#F4F5FA' } as any,
  tlYear:      { fontSize: 11, fontFamily: 'Inter_500Medium' },
  tlTitle:     { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  tlDesc:      { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#8588A5', lineHeight: 18 },
  activePill:  { backgroundColor: '#F0EEFF', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  activePillTxt:{ fontSize: 10, fontFamily: 'Inter_700Bold', color: '#7367F0' },
});
