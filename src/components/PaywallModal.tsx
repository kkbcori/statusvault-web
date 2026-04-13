import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore, FREE_LIMIT } from '../store';

const PRICE = '$3.99';
const PRICE_LABEL = '$3.99/year';

const FEATURES = [
  { icon: 'documents-outline' as const,      text: 'Unlimited documents for you & family',  check: true },
  { icon: 'people-outline' as const,         text: 'Unlimited family members & their docs',  check: true },
  { icon: 'checkbox-outline' as const,       text: 'Unlimited checklists & immi timers',     check: true },
  { icon: 'document-text-outline' as const,  text: 'PDF export for all docs & checklists',   check: true },
  { icon: 'phone-portrait-outline' as const, text: 'JSON export for cross-device use',        check: true },
  { icon: 'notifications-outline' as const,  text: 'Smart alerts at 6mo · 3mo · 1mo · 7d',  check: true },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export const PaywallModal: React.FC<Props> = ({ visible, onClose, onUnlock }) => {
  const documents = useStore(s => s.documents);
  const atLimit   = documents.length >= FREE_LIMIT;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject as any} activeOpacity={1} onPress={onClose} />

        <View style={s.card}>
          {/* Dark gradient header */}
          <LinearGradient colors={['#030712', '#0F172A', '#1E1B4B']} style={s.header}>
            {/* Decorative orbs */}
            <View style={s.orb1} />
            <View style={s.orb2} />

            {/* Close */}
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={16} color="rgba(255,255,255,0.50)" />
            </TouchableOpacity>

            {/* Icon */}
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
            {/* Feature list */}
            {FEATURES.map(({ icon, text }, i) => (
              <View key={i} style={s.featureRow}>
                <View style={s.featureCheck}>
                  <Ionicons name="checkmark" size={12} color="#4F46E5" />
                </View>
                <Text style={s.featureText}>{text}</Text>
              </View>
            ))}

            {/* Price block */}
            <LinearGradient colors={['#EEF2FF', '#F5F3FF']} style={s.priceBlock}>
              <View style={s.priceRow}>
                <View>
                  <Text style={s.price}>{PRICE}</Text>
                  <Text style={s.priceNote}>per year · less than $0.34/month</Text>
                </View>
                <View style={s.saveBadge}>
                  <Text style={s.saveTxt}>SAVE 85%</Text>
                </View>
              </View>
            </LinearGradient>

            {/* CTA */}
            <TouchableOpacity style={s.cta} onPress={onUnlock} activeOpacity={0.88}>
              <LinearGradient colors={['#4F46E5', '#7C3AED']} style={s.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="star" size={15} color="#FCD34D" />
                <Text style={s.ctaTxt}>Unlock Premium — {PRICE_LABEL}</Text>
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

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  featureCheck:{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C7D2FE' },
  featureText:{ fontSize: 13, fontFamily: 'Inter_500Medium', color: '#0F172A', flex: 1 },

  priceBlock: { borderRadius: 12, padding: 14, marginTop: 14, marginBottom: 12 },
  priceRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:      { fontSize: 32, fontFamily: 'Inter_900Black', color: '#4F46E5', letterSpacing: -1 },
  priceNote:  { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#64748B', marginTop: 2 },
  saveBadge:  { backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  saveTxt:    { fontSize: 10, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 1 },

  cta:        { borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  ctaGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  ctaTxt:     { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.2 },

  legal:      { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#94A3B8', textAlign: 'center' },
});
