// ═══════════════════════════════════════════════════════════════
// StatusVault — LogoMark
// Uses the transparent shield logo — renders cleanly on any bg
// ═══════════════════════════════════════════════════════════════
import React from 'react';
import { View, Text, Image } from 'react-native';

interface Props {
  size?: number;
  variant?: 'full' | 'icon' | 'wordmark' | 'stacked';
  dark?: boolean;
  tagline?: boolean;
}

export const LogoMark: React.FC<Props> = ({
  size = 36,
  variant = 'full',
  dark = true,
  tagline = false,
}) => {
  // Default is dark theme (new v9 design)
  const wordColor   = dark ? '#F0F4FF' : '#0A1530';
  const accentColor = dark ? '#6FAFF2' : '#2D6ABF';
  const subColor    = dark ? 'rgba(240,244,255,0.50)' : '#64748B';
  const logoSource  = require('../../assets/logo-transparent.png');

  if (variant === 'icon') return (
    <Image source={logoSource} style={{ width: size, height: size }} resizeMode="contain" />
  );

  if (variant === 'wordmark') return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.55, color: wordColor, letterSpacing: -0.5 }}>Status</Text>
      <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.55, color: accentColor, letterSpacing: -0.5 }}>Vault</Text>
    </View>
  );

  if (variant === 'stacked') return (
    <View style={{ alignItems: 'center', gap: size * 0.20 }}>
      <Image source={logoSource} style={{ width: size, height: size }} resizeMode="contain" />
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.38, color: wordColor, letterSpacing: -0.4 }}>Status</Text>
        <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.38, color: accentColor, letterSpacing: -0.4 }}>Vault</Text>
      </View>
    </View>
  );

  // Full: horizontal lock-up
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.26 }}>
      <Image source={logoSource} style={{ width: size, height: size }} resizeMode="contain" />
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.48, color: wordColor, letterSpacing: -0.5, lineHeight: size * 0.54 }}>Status</Text>
          <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.48, color: accentColor, letterSpacing: -0.5, lineHeight: size * 0.54 }}>Vault</Text>
        </View>
        {tagline && (
          <Text style={{
            fontFamily: 'Inter_500Medium', fontSize: size * 0.22, color: subColor,
            marginTop: size * 0.04, letterSpacing: size * 0.04,
            textTransform: 'uppercase',
          }}>
            Immigration Tracker
          </Text>
        )}
      </View>
    </View>
  );
};
