// ═══════════════════════════════════════════════════════════════
// SearchModal — Global search across all content in the app
// Searches: Documents · Checklists · Timers · Family · Links
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { useNavigation } from '@react-navigation/native';
import { calculateDaysRemaining } from '../utils/dates';
import { IS_WEB } from '../utils/responsive';

interface SearchResult {
  id: string;
  type: 'document' | 'checklist' | 'timer' | 'family' | 'link';
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  screen: string;
}

// Official links from VisaToolsScreen for searching
const GOV_LINKS = [
  { label: 'Check My Case Status', url: 'https://egov.uscis.gov/casestatus/landing.do', section: 'USCIS' },
  { label: 'Processing Times', url: 'https://egov.uscis.gov/processing-times/', section: 'USCIS' },
  { label: 'H-1B Employer Data Hub', url: 'https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub', section: 'H-1B' },
  { label: 'LCA Wage Search (DOL)', url: 'https://flag.dol.gov/wage-data/wage-search', section: 'H-1B' },
  { label: 'OPT / STEM OPT Info', url: 'https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students', section: 'F-1/OPT' },
  { label: 'I-94 Arrival Records', url: 'https://i94.cbp.dhs.gov/I94', section: 'Travel' },
  { label: 'Visa Bulletin', url: 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html', section: 'Green Card' },
  { label: 'I-485 Adjustment of Status', url: 'https://www.uscis.gov/i-485', section: 'Green Card' },
  { label: 'Global Entry / TSA PreCheck', url: 'https://ttp.cbp.dhs.gov', section: 'Travel' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<Props> = ({ visible, onClose }) => {
  const navigation   = useNavigation<any>();
  const documents    = useStore(s => s.documents);
  const checklists   = useStore(s => s.checklists);
  const counters     = useStore(s => s.counters);
  const familyMembers = useStore(s => s.familyMembers);

  const [query, setQuery] = useState('');

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const out: SearchResult[] = [];

    // Documents
    documents.forEach(d => {
      if (d.label.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) ||
          d.notes?.toLowerCase().includes(q) || d.documentNumber?.toLowerCase().includes(q)) {
        const days = calculateDaysRemaining(d.expiryDate);
        const expired = days < 0;
        const critical = !expired && days < 30;
        const badge = expired ? 'Expired' : critical ? `${days}d` : `${days}d`;
        const badgeColor = expired ? '#FF6B6B' : critical ? '#F5C053' : '#4CD98A';
        out.push({ id: d.id, type: 'document', icon: d.icon, title: d.label,
          subtitle: `Expires ${d.expiryDate}`, badge, badgeColor, screen: 'Documents' });
      }
    });

    // Checklists
    checklists.forEach(cl => {
      if (cl.label.toLowerCase().includes(q)) {
        const done = cl.items.filter((i: any) => i.done).length;
        out.push({ id: cl.templateId, type: 'checklist', icon: cl.icon || '✅',
          title: cl.label, subtitle: `${done}/${cl.items.length} steps done`,
          badge: cl.items.length > 0 ? `${Math.round((done / cl.items.length) * 100)}%` : '0%',
          badgeColor: done === cl.items.length ? '#4CD98A' : '#6FAFF2', screen: 'Checklist' });
      }
    });

    // Timers
    counters.forEach(ct => {
      if (ct.label.toLowerCase().includes(q)) {
        out.push({ id: ct.templateId, type: 'timer', icon: '⏱️',
          title: ct.label, subtitle: 'Immi Timer', screen: 'Timers' });
      }
    });

    // Family
    familyMembers.forEach(m => {
      if (m.name.toLowerCase().includes(q) || m.visaType?.toLowerCase().includes(q)) {
        out.push({ id: m.id, type: 'family', icon: '👨‍👩‍👧',
          title: m.name, subtitle: m.visaType || 'Family member', screen: 'Family' });
      }
    });

    // Government links
    GOV_LINKS.forEach((link, i) => {
      if (link.label.toLowerCase().includes(q) || link.section.toLowerCase().includes(q)) {
        out.push({ id: `link-${i}`, type: 'link', icon: '🔗',
          title: link.label, subtitle: link.section + ' · gov.link',
          badge: 'GOV', badgeColor: '#5B9AF5', screen: 'VisaTools' });
      }
    });

    return out.slice(0, 20);
  }, [query, documents, checklists, counters, familyMembers]);

  const typeLabel = (t: SearchResult['type']) => ({
    document: 'Document', checklist: 'Checklist', timer: 'Timer',
    family: 'Family', link: 'Link',
  }[t]);

  const handleResult = (r: SearchResult) => {
    onClose();
    setQuery('');
    setTimeout(() => navigation.navigate('Main', { screen: r.screen }), 100);
  };

  const content = (
    <View style={s.sheet}>
      {/* Search input */}
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={18} color="rgba(240,244,255,0.55)" style={{ marginRight: 8 }} />
        {IS_WEB ? (
          <input
            autoFocus
            value={query}
            onChange={(e: any) => setQuery(e.target.value)}
            placeholder="Search documents, checklists, family, links..."
            style={{
              flex: 1, border: 'none', outline: 'none', fontSize: '15px',
              fontFamily: 'Inter, sans-serif', color: '#F0F4FF', background: 'transparent',
              width: '100%',
            } as any}
          />
        ) : null}
        <TouchableOpacity onPress={() => { setQuery(''); onClose(); }} style={s.cancelBtn}>
          <Text style={s.cancelTxt}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView style={s.results} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {query.length >= 2 && results.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="search-outline" size={32} color="rgba(240,244,255,0.35)" />
            <Text style={s.emptyTxt}>No results for "{query}"</Text>
            <Text style={s.emptyHint}>Try searching for a document type, visa status, or checklist name</Text>
          </View>
        )}

        {query.length < 2 && (
          <View style={s.hint}>
            <Text style={s.hintTxt}>Search across your documents, checklists, timers, family members, and government links</Text>
            <View style={s.suggestions}>
              {['H-1B', 'Passport', 'OPT', 'I-94', 'Green Card', 'I-485'].map(t => (
                <TouchableOpacity key={t} style={s.chip} onPress={() => setQuery(t)}>
                  <Text style={s.chipTxt}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {results.length > 0 && (
          <>
            <Text style={s.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
            {results.map(r => (
              <TouchableOpacity key={r.id} style={s.resultRow} onPress={() => handleResult(r)} activeOpacity={0.7}>
                <View style={s.resultIcon}>
                  <Text style={{ fontSize: 18 }}>{r.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.resultTitle} numberOfLines={1}>{r.title}</Text>
                  <Text style={s.resultSub} numberOfLines={1}>{r.subtitle}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 } as any}>
                  {r.badge && (
                    <View style={[s.badge, { backgroundColor: r.badgeColor + '18' }]}>
                      <Text style={[s.badgeTxt, { color: r.badgeColor }]}>{r.badge}</Text>
                    </View>
                  )}
                  <Text style={s.typeLabel}>{typeLabel(r.type)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );

  if (IS_WEB) {
    if (!visible) return null;
    return (
      <View style={s.overlay} pointerEvents="box-none">
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => { setQuery(''); onClose(); }} />
        <View style={s.centered}>{content}</View>
      </View>
    );
  }
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => { setQuery(''); onClose(); }} />
        <View style={s.centered}>{content}</View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay:     { position: 'absolute' as any, inset: 0, zIndex: 5000, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 60 } as any,
  backdrop:    { position: 'absolute' as any, inset: 0, backgroundColor: 'rgba(3,8,18,0.80)' } as any,
  centered:    { width: '100%', maxWidth: 540, zIndex: 1, paddingHorizontal: 16 } as any,
  sheet:       { backgroundColor: '#0C1A34', borderRadius: 16, overflow: 'hidden', maxHeight: 520, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', ...Platform.select({ web: { boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any }) } as any,
  searchRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  cancelBtn:   { paddingLeft: 12 },
  cancelTxt:   { fontSize: 14, fontFamily: 'Inter_500Medium', color: '#6FAFF2' },
  results:     { maxHeight: 440 },
  empty:       { alignItems: 'center', paddingVertical: 40, gap: 8 } as any,
  emptyTxt:    { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.80)' },
  emptyHint:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.45)', textAlign: 'center', paddingHorizontal: 24 },
  hint:        { padding: 20 },
  hintTxt:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', lineHeight: 20, marginBottom: 14 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } as any,
  chip:        { backgroundColor: 'rgba(59,139,232,0.14)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)' },
  chipTxt:     { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#6FAFF2' },
  resultCount: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.45)', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, textTransform: 'uppercase' as any },
  resultRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'transparent' },
  resultIcon:  { width: 40, height: 40, borderRadius: 10, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#F0F4FF' },
  resultSub:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.55)', marginTop: 1 },
  badge:       { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  badgeTxt:    { fontSize: 10, fontFamily: 'Inter_700Bold' },
  typeLabel:   { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.45)' },
});
