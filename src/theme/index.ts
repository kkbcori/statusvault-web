// ═══════════════════════════════════════════════════════════════
// StatusVault — Premium Design System v3
// Deep navy + gold passport palette · Inter typeface
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';

export const colors = {
  // Core brand — passport navy + gold
  primary: '#0A1628',
  primaryLight: '#132847',
  primaryMid: '#1B3A65',
  accent: '#C9A351',
  accentLight: '#FBF5E6',
  accentDim: 'rgba(201,163,81,0.15)',
  accentBlue: '#3B82F6',

  // Severity system
  success: '#22C55E',
  successLight: '#DCFCE7',
  successDark: '#16A34A',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningDark: '#D97706',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerDark: '#DC2626',

  // Surfaces — warm parchment background replaces cold grey
  background: '#F8F7F2',
  backgroundDark: '#0A1628',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardDark: 'rgba(255,255,255,0.06)',

  // Text
  text1: '#0F172A',
  text2: '#475569',
  text3: '#94A3B8',
  textInverse: '#FFFFFF',
  textGold: '#C9A351',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderGold: 'rgba(201,163,81,0.25)',

  // Misc
  overlay: 'rgba(10, 22, 40, 0.65)',
  shimmer: '#F0F0F0',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  screen: 20,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

// ─── Typography — Inter via expo-google-fonts ─────────────────
const F = {
  regular:   'Inter_400Regular',
  medium:    'Inter_500Medium',
  semibold:  'Inter_600SemiBold',
  bold:      'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
  black:     'Inter_900Black',
};

export const typography = {
  display:      { fontSize: 48, fontFamily: F.black,     letterSpacing: -1.5, lineHeight: 52 },
  h1:           { fontSize: 26, fontFamily: F.extrabold,  letterSpacing: -0.5, lineHeight: 32 },
  h2:           { fontSize: 18, fontFamily: F.bold,       letterSpacing: -0.3, lineHeight: 24 },
  h3:           { fontSize: 15, fontFamily: F.bold,       lineHeight: 20 },
  body:         { fontSize: 15, fontFamily: F.regular,    lineHeight: 22 },
  bodyMedium:   { fontSize: 15, fontFamily: F.medium,     lineHeight: 22 },
  bodySemibold: { fontSize: 15, fontFamily: F.semibold,   lineHeight: 22 },
  caption:      { fontSize: 13, fontFamily: F.medium,     lineHeight: 18 },
  captionBold:  { fontSize: 13, fontFamily: F.bold,       lineHeight: 18 },
  micro:        { fontSize: 11, fontFamily: F.bold,       letterSpacing: 0.5, lineHeight: 14 },
  number:       { fontSize: 32, fontFamily: F.black,      letterSpacing: -1,  lineHeight: 36 },
  numberLarge:  { fontSize: 40, fontFamily: F.black,      letterSpacing: -1.5,lineHeight: 44 },
} as const;

export const shadows = {
  sm: Platform.select({
    ios:     { shadowColor: '#0A1628', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    ios:     { shadowColor: '#0A1628', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
    android: { elevation: 5 },
  }),
  lg: Platform.select({
    ios:     { shadowColor: '#0A1628', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
    android: { elevation: 10 },
  }),
  gold: Platform.select({
    ios:     { shadowColor: '#C9A351', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
    android: { elevation: 6 },
  }),
} as const;
