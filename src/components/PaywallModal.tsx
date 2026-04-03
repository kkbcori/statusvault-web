import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore, FREE_LIMIT } from '../store';

const PRICE = '$3.99';
const PRICE_LABEL = '$3.99/year';

const FEATURES = [
  { icon: 'documents-outline' as const,        text: 'Unlimited document tracking' },
  { icon: 'notifications-outline' as const,    text: 'Advanced smart alerts per document type' },
  { icon: 'cloud-download-outline' as const,   text: 'Data export & import for any device' },
  { icon: 'people-outline' as const,           text: 'Unlimited family members & documents' },
  { icon: 'checkmark-circle-outline' as const, text: 'Immigration checklists & counters' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onUnlock: () => void;
}

export const PaywallModal: React.FC<Props> = ({ visible, onClose, onUnlock }) => {
  const documents = useStore(s => s.documents);

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={s.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject as any} activeOpacity={1} onPress={onClose} />
        <LinearGradient colors={['#060E1A', '#0A1628', '#0F2040']} style={s.card}>
          <View style={s.topTrim} />
          <View style={s.body}>
            {/* Close */}
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <View style={s.closeCircle}><Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" /></View>
            </TouchableOpacity>

            {/* Hero */}
            <View style={s.hero}>
              <View style={s.iconRing}>
                <View style={s.iconInner}><Ionicons name="shield-checkmark" size={28} color="#7367F0" /></View>
              </View>
              <Text style={s.eyebrow}>STATUSVAULT PREMIUM</Text>
              <Text style={s.title}>Protect Your{'\n'}Immigration Status</Text>
              <View style={s.bar} />
              <Text style={s.subtitle}>
                {documents.length >= FREE_LIMIT
                  ? `You've used all ${FREE_LIMIT} free document slots.\nUpgrade to track unlimited documents.`
                  : 'Unlock unlimited documents, alerts, and family tracking.'}
              </Text>
            </View>

            {/* Features */}
            <View style={s.features}>
              {FEATURES.map(({ icon, text }, i) => (
                <View key={i} style={s.featureRow}>
                  <View style={s.featureIcon}><Ionicons name={icon} size={14} color="#7367F0" /></View>
                  <Text style={s.featureText}>{text}</Text>
                </View>
              ))}
            </View>

            {/* Price */}
            <View style={s.priceBlock}>
              <View style={s.priceRow}>
                <Text style={s.price}>{PRICE}</Text>
                <View style={{ gap: 1 }}>
                  <Text style={s.period}>/ year</Text>
                  <Text style={s.priceNote}>Less than $0.34/month</Text>
                </View>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity style={s.cta} onPress={onUnlock} activeOpacity={0.85}>
              <LinearGradient colors={['#7367F0', '#9E95F5', '#7367F0']} style={s.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={s.ctaText}>Subscribe — {PRICE_LABEL}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.legal}>Cancel anytime · Secure payment via App Store</Text>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const s = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.80)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:       { width: '100%', maxWidth: 420, borderRadius: 20, overflow: 'hidden' } as any,
  topTrim:    { position: 'absolute' as any, top: 0, left: 0, right: 0, height: 3, backgroundColor: '#7367F0' },
  body:       { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, alignItems: 'center' },
  closeBtn:   { alignSelf: 'flex-end', marginBottom: 8 },
  closeCircle:{ width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  hero:       { alignItems: 'center', marginBottom: 14 },
  iconRing:   { width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(115,103,240,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  iconInner:  { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(115,103,240,0.12)', alignItems: 'center', justifyContent: 'center' },
  eyebrow:    { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#7367F0', letterSpacing: 2, marginBottom: 5 },
  title:      { fontSize: 22, fontFamily: 'Inter_900Black', color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.3, lineHeight: 28, marginBottom: 8 },
  bar:        { width: 36, height: 3, backgroundColor: '#7367F0', borderRadius: 2, marginBottom: 8 },
  subtitle:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 18 },
  features:   { width: '100%', marginBottom: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  featureIcon:{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(115,103,240,0.12)', alignItems: 'center', justifyContent: 'center' },
  featureText:{ fontSize: 13, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.85)', flex: 1 },
  priceBlock: { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(115,103,240,0.2)' },
  priceRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  price:      { fontSize: 36, fontFamily: 'Inter_900Black', color: '#7367F0', letterSpacing: -1 },
  period:     { fontSize: 14, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.5)' },
  priceNote:  { fontSize: 11, fontFamily: 'Inter_500Medium', color: '#28C76F' },
  cta:        { width: '100%', borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  ctaGrad:    { paddingVertical: 13, alignItems: 'center', borderRadius: 10 },
  ctaText:    { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 0.2 },
  legal:      { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.25)', textAlign: 'center' },
});
