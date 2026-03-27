// ═══════════════════════════════════════════════════════════════
// StatusVault — Design System v4
// Light SaaS aesthetic · Teal + cool gray · Syne + Inter
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';

export const colors = {
  // ── Brand — teal primary ──
  primary:      '#0099A8',
  primaryLight: '#00B5C8',
  primaryMid:   '#007A88',
  accent:       '#0099A8',
  accentLight:  '#E6F7F8',
  accentDim:    'rgba(0,153,168,0.10)',
  accentBlue:   '#2563EB',

  // ── Severity ──
  success:      '#059669',
  successLight: '#D1FAE5',
  successDark:  '#047857',
  warning:      '#D97706',
  warningLight: '#FEF3C7',
  warningDark:  '#B45309',
  danger:       '#DC2626',
  dangerLight:  '#FEE2E2',
  dangerDark:   '#B91C1C',

  // ── Surfaces ──
  background:     '#F4F6FA',
  backgroundDark: '#1A202C',
  card:           '#FFFFFF',
  cardElevated:   '#FFFFFF',
  cardDark:       'rgba(0,0,0,0.04)',

  // ── Text ──
  text1:       '#1A202C',
  text2:       '#374151',
  text3:       '#6B7280',
  text4:       '#9CA3AF',
  textInverse: '#FFFFFF',
  textGold:    '#0099A8',

  // ── Borders ──
  border:      'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.05)',
  borderGold:  'rgba(0,153,168,0.20)',

  // ── Sidebar (light) ──
  sidebar:        '#FFFFFF',
  sidebarBorder:  'rgba(0,0,0,0.08)',
  sidebarActive:  '#E6F7F8',
  sidebarActiveText: '#0E7490',

  // ── Misc ──
  overlay: 'rgba(26,32,44,0.60)',
  shimmer: '#E4E8F0',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  xxl: 24, xxxl: 32, huge: 40, screen: 24,
} as const;

export const radius = {
  sm: 6, md: 10, lg: 12, xl: 16, xxl: 20, full: 999,
} as const;

// ── Typography ────────────────────────────────────────────────
// Syne for display/headings · Inter for body
const F = {
  // Syne — display
  display700: 'Syne_700Bold',
  display800: 'Syne_800ExtraBold',
  // Inter — body
  regular:    'Inter_400Regular',
  medium:     'Inter_500Medium',
  semibold:   'Inter_600SemiBold',
  bold:       'Inter_700Bold',
  extrabold:  'Inter_800ExtraBold',
  black:      'Inter_900Black',
};

export const typography = {
  display:      { fontSize: 36, fontFamily: F.display800, letterSpacing: -1,   lineHeight: 42 },
  h1:           { fontSize: 24, fontFamily: F.display800, letterSpacing: -0.5, lineHeight: 30 },
  h2:           { fontSize: 18, fontFamily: F.display700, letterSpacing: -0.3, lineHeight: 24 },
  h3:           { fontSize: 15, fontFamily: F.display700, lineHeight: 20 },
  body:         { fontSize: 14, fontFamily: F.regular,    lineHeight: 22 },
  bodyMedium:   { fontSize: 14, fontFamily: F.medium,     lineHeight: 22 },
  bodySemibold: { fontSize: 14, fontFamily: F.semibold,   lineHeight: 22 },
  caption:      { fontSize: 12, fontFamily: F.medium,     lineHeight: 18 },
  captionBold:  { fontSize: 12, fontFamily: F.bold,       lineHeight: 18 },
  micro:        { fontSize: 10, fontFamily: F.bold,       letterSpacing: 0.6, lineHeight: 14 },
  number:       { fontSize: 28, fontFamily: F.display800, letterSpacing: -1,  lineHeight: 32 },
  numberLarge:  { fontSize: 38, fontFamily: F.display800, letterSpacing: -1.5,lineHeight: 44 },
  mono:         { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 20 },
} as const;

export const shadows = {
  sm: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    android: { elevation: 1 },
  }),
  md: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12 },
    android: { elevation: 3 },
  }),
  lg: Platform.select({
    ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 32 },
    android: { elevation: 8 },
  }),
  gold: Platform.select({
    ios:     { shadowColor: '#0099A8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
    android: { elevation: 4 },
  }),
} as const;
