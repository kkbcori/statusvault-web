// ═══════════════════════════════════════════════════════════════
// StatusVault — LogoMark
// Blue shield + passport stamp icon — pure React Native View
// No SVG library needed — works on web, iOS, Android
// ═══════════════════════════════════════════════════════════════
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  size?: number;
  /** 'full' = shield + wordmark, 'icon' = shield only, 'wordmark' = text only */
  variant?: 'full' | 'icon' | 'wordmark';
  dark?: boolean; // dark bg version (sidebar)
}

export const LogoMark: React.FC<Props> = ({ size = 36, variant = 'full', dark = false }) => {
  const s = size;
  const iconColor  = dark ? '#FFFFFF' : '#FFFFFF';
  const shieldBg   = '#4F46E5';
  const shieldAcc  = '#6366F1';
  const wordColor  = dark ? '#F8FAFF' : '#0F172A';
  const subColor   = dark ? 'rgba(165,180,252,0.7)' : '#6366F1';

  const Shield = () => (
    <View style={[ls.shield, { width: s, height: s * 1.15, borderRadius: s * 0.22, backgroundColor: shieldBg }]}>
      {/* Inner accent top strip */}
      <View style={[ls.shieldAccent, { backgroundColor: shieldAcc, borderRadius: s * 0.18, top: s * 0.06, left: s * 0.08, right: s * 0.08, height: s * 0.22 }]} />

      {/* Passport book icon (small rectangle with lines) */}
      <View style={[ls.passportBook, {
        width: s * 0.38, height: s * 0.28,
        borderRadius: s * 0.06,
        backgroundColor: 'rgba(255,255,255,0.92)',
        left: s * 0.12, top: s * 0.32,
      }]}>
        <View style={[ls.passportLine, { width: s * 0.22, top: s * 0.065, left: s * 0.04 }]} />
        <View style={[ls.passportLine, { width: s * 0.16, top: s * 0.12, left: s * 0.04 }]} />
      </View>

      {/* Visa stamp circle */}
      <View style={[ls.stamp, {
        width: s * 0.32, height: s * 0.32,
        borderRadius: s * 0.16,
        borderWidth: s * 0.04,
        borderColor: 'rgba(255,255,255,0.85)',
        right: s * 0.08, top: s * 0.30,
      }]}>
        <Text style={[ls.stampText, { fontSize: s * 0.12, color: 'rgba(255,255,255,0.85)' }]}>✓</Text>
      </View>

      {/* Shield bottom point taper — visual trick using border */}
      <View style={[ls.shieldPoint, {
        borderLeftWidth: s * 0.5,
        borderRightWidth: s * 0.5,
        borderTopWidth: s * 0.2,
        borderTopColor: shieldBg,
        bottom: -(s * 0.18),
      }]} />
    </View>
  );

  if (variant === 'icon') return <Shield />;

  if (variant === 'wordmark') return (
    <View style={ls.wordRow}>
      <Text style={[ls.word, { fontSize: s * 0.52, color: wordColor }]}>Status</Text>
      <Text style={[ls.wordAccent, { fontSize: s * 0.52, color: subColor }]}>Vault</Text>
    </View>
  );

  return (
    <View style={ls.row}>
      <Shield />
      <View style={[ls.wordRow, { marginLeft: s * 0.32 }]}>
        <Text style={[ls.word, { fontSize: s * 0.47, color: wordColor }]}>Status</Text>
        <Text style={[ls.wordAccent, { fontSize: s * 0.47, color: subColor }]}>Vault</Text>
        <Text style={[ls.sub, { fontSize: s * 0.24, color: dark ? 'rgba(165,180,252,0.55)' : '#94A3B8' }]}>
          Immigration Tracker
        </Text>
      </View>
    </View>
  );
};

const ls = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center' },
  shield:      { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  shieldAccent:{ position: 'absolute' },
  passportBook:{ position: 'absolute', alignItems: 'center' },
  passportLine:{ position: 'absolute', height: 2, backgroundColor: 'rgba(79,70,229,0.4)', borderRadius: 1 },
  stamp:       { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  stampText:   { fontWeight: '900' },
  shieldPoint: { position: 'absolute', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  wordRow:     { flexDirection: 'column' },
  word:        { fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5, lineHeight: undefined },
  wordAccent:  { fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5, marginTop: -4 },
  sub:         { fontFamily: 'Inter_400Regular', letterSpacing: 0.3, marginTop: 2 },
});
