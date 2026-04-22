// ═══════════════════════════════════════════════════════════════
// StatusVault — LogoMark (real brand logo)
// ═══════════════════════════════════════════════════════════════
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface Props {
  size?: number;
  variant?: 'full' | 'icon' | 'wordmark';
  dark?: boolean;
}

export const LogoMark: React.FC<Props> = ({ size = 36, variant = 'full', dark = false }) => {
  const wordColor   = dark ? '#F8FAFF' : '#0F172A';
  const subColor    = dark ? 'rgba(165,180,252,0.85)' : '#6366F1';
  const logoSource  = require('../../assets/logo-transparent.png');

  if (variant === 'icon') return (
    <Image source={logoSource} style={{ width: size, height: size }} resizeMode="contain" />
  );

  if (variant === 'wordmark') return (
    <View style={{ flexDirection: 'row' }}>
      <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.52, color: wordColor }}>Status</Text>
      <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.52, color: subColor }}>Vault</Text>
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.28 }}>
      <Image source={logoSource} style={{ width: size, height: size }} resizeMode="contain" />
      <View>
        <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.47, color: wordColor, letterSpacing: -0.4 }}>Status</Text>
        <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.47, color: subColor, letterSpacing: -0.4, marginTop: -size * 0.08 }}>Vault</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: size * 0.24, color: dark ? 'rgba(165,180,252,0.55)' : '#94A3B8', marginTop: 2 }}>
          Immigration Tracker
        </Text>
      </View>
    </View>
  );
};
