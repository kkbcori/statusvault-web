import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Image } from 'react-native';
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
    note:     'Just $0.42/month · Save 15%',
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
          <LinearGradient colors={['#050B1C', '#0A1530', '#123A72']} style={s.header}>
            <View style={s.orb1} /><View style={s.orb2} />

            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.50)" />
            </TouchableOpacity>

            <View style={s.iconWrap}>
              <View style={s.iconGrad}>
                <Image
                  source={require('../../assets/logo-transparent.png')}
                  style={{ width: 56, height: 56 }}
                  resizeMode="contain"
                />
              </View>
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
                      <Ionicons name="checkmark-circle" size={16} color="#6FAFF2" />
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
                    <Ionicons name="checkmark" size={12} color="#6FAFF2" />
                  </View>
                  <Text style={s.featureText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity style={s.cta} onPress={onUnlock} activeOpacity={0.88}>
              <LinearGradient colors={['#6FAFF2', '#3B8BE8']} style={s.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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
  orb1:       { position: 'absolute' as any, top: -30, right: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(59,139,232,0.18)' },
  orb2:       { position: 'absolute' as any, bottom: -20, left: -20, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(245,192,83,0.10)' },
  closeBtn:   { position: 'absolute' as any, top: 14, right: 14, width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  iconWrap:   { marginBottom: 12 },
  iconGrad:   {
    width: 76, height: 76, borderRadius: 18,
    backgroundColor: 'rgba(59,139,232,0.12)',
    borderWidth: 1, borderColor: 'rgba(111,175,242,0.32)',
    alignItems: 'center', justifyContent: 'center',
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 32px rgba(59,139,232,0.30)' } as any) : {}),
  } as any,
  eyebrow:    { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#6FAFF2', letterSpacing: 2, marginBottom: 8 },
  title:      { fontSize: 24, fontFamily: 'Inter_900Black', color: '#F0F4FF', textAlign: 'center', letterSpacing: -0.5, lineHeight: 30, marginBottom: 10 },
  titleUnderline: { width: 40, height: 3, backgroundColor: '#6FAFF2', borderRadius: 2, marginBottom: 10 },
  subtitle:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(203,213,225,0.60)', textAlign: 'center' },

  body:       { backgroundColor: '#0C1A34', padding: 20 },

  // Plan selector
  planRow:    { flexDirection: 'row', gap: 10, marginBottom: 8 } as any,
  planCard:   { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 12, alignItems: 'center', position: 'relative' as any, backgroundColor: 'rgba(255,255,255,0.04)' } as any,
  planCardActive: { borderColor: '#6FAFF2', backgroundColor: 'rgba(59,139,232,0.14)' },
  planBadge:  { position: 'absolute' as any, top: -10, backgroundColor: '#6FAFF2', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  planBadgeTxt:{ fontSize: 8, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.8 },
  planLabel:  { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(240,244,255,0.55)', marginBottom: 4, marginTop: 4 },
  planLabelActive: { color: '#6FAFF2' },
  planPrice:  { fontSize: 26, fontFamily: 'Inter_900Black', color: '#F0F4FF', letterSpacing: -1 },
  planPriceActive: { color: '#6FAFF2' },
  planPeriod: { fontSize: 10, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.45)', marginTop: 2 },
  planPeriodActive: { color: '#6FAFF2' },
  planCheck:  { position: 'absolute' as any, top: 8, right: 8 },
  planNote:   { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(240,244,255,0.55)', textAlign: 'center', marginBottom: 14 },

  // Features
  featureList:{ marginBottom: 14, gap: 2 } as any,
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  featureCheck2:{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(59,139,232,0.14)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(111,175,242,0.30)' },
  featureText:{ fontSize: 12, fontFamily: 'Inter_500Medium', color: '#F0F4FF', flex: 1 },

  // CTA
  cta:        { borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  ctaGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  ctaTxt:     { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.2 },
  legal:      { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(240,244,255,0.45)', textAlign: 'center' },
});
