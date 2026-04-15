import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore, FREE_LIMIT } from '../store';

const PLANS = [
  {
    id:       'monthly',
    label:    'Monthly',
    price:    '$0.49',
    period:   'per month',
    note:     'Billed monthly · Cancel anytime',
    badge:    null,
    popular:  false,
  },
  {
    id:       'yearly',
    label:    'Yearly',
    price:    '$4.99',
    period:   'per year',
    note:     'Just $0.42/month · Save 14%',
    badge:    'BEST VALUE',
    popular:  true,
  },
] as const;

type PlanId = 'monthly' | 'yearly';

const FEATURES = [
  { icon: 'documents-outline'      as const, text: 'Unlimited documents for you & family'  },
  { icon: 'people-outline'         as const, text: 'Unlimited family members & their docs'  },
  { icon: 'checkbox-outline'       as const, text: 'Unlimited checklists & immi timers'     },
  { icon: 'document-text-outline'  as const, text: 'PDF export — N-400, I-485 & all docs'  },
  { icon: 'cloud-outline'          as const, text: 'AES-256 encrypted cloud backup'         },
  { icon: 'notifications-outline'  as const, text: 'Smart alerts at 6mo · 3mo · 1mo · 7d'  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export const PaywallModal: React.FC<Props> = ({ visible, onClose, onUnlock }) => {
  const documents  = useStore(s => s.documents);
  const atLimit    = documents.length >= FREE_LIMIT;
  const [plan, setPlan] = useState<PlanId>('yearly');

  const selected = PLANS.find(p => p.id === plan)!;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject as any} activeOpacity={1} onPress={onClose} />

        <View style={s.card}>
          {/* Dark header */}
          <LinearGradient colors={['#030712', '#0F172A', '#1E1B4B']} style={s.header}>
            <View style={s.orb1} /><View style={s.orb2} />

            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.50)" />
            </TouchableOpacity>

            <View style={s.iconWrap}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={s.iconGrad}>
                <Ionicons name="shield-checkmark" size={26} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={s.eyebrow}>✦ STATUSVAULT PREMIUM</Text>
            <Text style={s.title}>Protect Your{'\n'}Immigration Status</Text>
            <View style={s.titleUnderline} />
            <Text style={s.subtitle}>
              {atLimit
                ? `You've used all ${FREE_LIMIT} free document slots`
                : 'Unlock the full power of StatusVault'}
            </Text>
          </LinearGradient>

          {/* White body */}
          <View style={s.body}>

            {/* Plan selector */}
            <View style={s.planRow}>
              {PLANS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.planCard, plan === p.id && s.planCardActive]}
                  onPress={() => setPlan(p.id)}
                  activeOpacity={0.85}
                >
                  {p.badge && (
                    <View style={s.planBadge}>
                      <Text style={s.planBadgeTxt}>{p.badge}</Text>
                    </View>
                  )}
                  <Text style={[s.planLabel, plan === p.id && s.planLabelActive]}>{p.label}</Text>
                  <Text style={[s.planPrice, plan === p.id && s.planPriceActive]}>{p.price}</Text>
                  <Text style={[s.planPeriod, plan === p.id && s.planPeriodActive]}>{p.period}</Text>
                  {plan === p.id && (
                    <View style={s.planCheck}>
                      <Ionicons name="checkmark-circle" size={16} color="#4F46E5" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.planNote}>{selected.note}</Text>

            {/* Feature list */}
            <View style={s.featureList}>
              {FEATURES.map(({ icon, text }, i) => (
                <View key={i} style={s.featureRow}>
                  <View style={s.featureCheck2}>
                    <Ionicons name="checkmark" size={12} color="#4F46E5" />
                  </View>
                  <Text style={s.featureText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity style={s.cta} onPress={onUnlock} activeOpacity={0.88}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={s.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="star" size={15} color="#FCD34D" />
                <Text style={s.ctaTxt}>
                  Unlock Premium — {selected.price}{plan === 'monthly' ? '/mo' : '/yr'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.legal}>Cancel anytime · Secure payment · AES-256 encrypted</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:       { width: '100%', maxWidth: 420, borderRadius: 24, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 24px 64px rgba(0,0,0,0.40)' } as any }) } as any,

  header:     { padding: 24, alignItems: 'center', overflow: 'hidden', position: 'relative' as any },
  orb1:       { position: 'absolute' as any, top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(79,70,229,0.15)' },
  orb2:       { position: 'absolute' as any, bottom: -20, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(124,58,237,0.10)' },
  closeBtn:   { position: 'absolute' as any, top: 14, right: 14, width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  iconWrap:   { marginBottom: 12 },
  iconGrad:   { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  eyebrow:    { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#A5B4FC', letterSpacing: 2, marginBottom: 8 },
  title:      { fontSize: 24, fontFamily: 'Inter_900Black', color: '#F8FAFF', textAlign: 'center', letterSpacing: -0.5, lineHeight: 30, marginBottom: 10 },
  titleUnderline: { width: 40, height: 3, backgroundColor: '#4F46E5', borderRadius: 2, marginBottom: 10 },
  subtitle:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(203,213,225,0.60)', textAlign: 'center' },

  body:       { backgroundColor: '#FFFFFF', padding: 20 },

  // Plan selector
  planRow:    { flexDirection: 'row', gap: 10, marginBottom: 8 } as any,
  planCard:   { flex: 1, borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, alignItems: 'center', position: 'relative' as any, backgroundColor: '#FAFBFF' } as any,
  planCardActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  planBadge:  { position: 'absolute' as any, top: -10, backgroundColor: '#4F46E5', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  planBadgeTxt:{ fontSize: 8, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.8 },
  planLabel:  { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#64748B', marginBottom: 4, marginTop: 4 },
  planLabelActive: { color: '#4F46E5' },
  planPrice:  { fontSize: 26, fontFamily: 'Inter_900Black', color: '#0F172A', letterSpacing: -1 },
  planPriceActive: { color: '#4F46E5' },
  planPeriod: { fontSize: 10, fontFamily: 'Inter_400Regular', color: '#94A3B8', marginTop: 2 },
  planPeriodActive: { color: '#6366F1' },
  planCheck:  { position: 'absolute' as any, top: 8, right: 8 },
  planNote:   { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#64748B', textAlign: 'center', marginBottom: 14 },

  // Features
  featureList:{ marginBottom: 14, gap: 2 } as any,
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  featureCheck2:{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  featureText:{ fontSize: 12, fontFamily: 'Inter_500Medium', color: '#0F172A', flex: 1 },

  // CTA
  cta:        { borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  ctaGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  ctaTxt:     { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.2 },
  legal:      { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#94A3B8', textAlign: 'center' },
});
