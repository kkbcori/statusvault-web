// ═══════════════════════════════════════════════════════════════
// StatusVault — Design System v5
// Inter-only typography · clean, professional SaaS aesthetic
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';

export const colors = {
  primary:      '#0099A8',
  primaryLight: '#00B5C8',
  primaryMid:   '#007A88',
  accent:       '#0099A8',
  accentLight:  '#E6F7F8',
  accentDim:    'rgba(0,153,168,0.10)',
  accentBlue:   '#2563EB',

  success:      '#059669',
  successLight: '#D1FAE5',
  successDark:  '#047857',
  warning:      '#D97706',
  warningLight: '#FEF3C7',
  warningDark:  '#B45309',
  danger:       '#DC2626',
  dangerLight:  '#FEE2E2',
  dangerDark:   '#B91C1C',

  background:     '#F4F6FA',
  backgroundDark: '#1A202C',
  card:           '#FFFFFF',
  cardElevated:   '#FFFFFF',
  cardDark:       'rgba(0,0,0,0.04)',

  text1:       '#111827',
  text2:       '#374151',
  text3:       '#6B7280',
  text4:       '#9CA3AF',
  textInverse: '#FFFFFF',
  textGold:    '#0099A8',

  border:      'rgba(0,0,0,0.08)',
  borderLight: 'rgba(0,0,0,0.05)',
  borderGold:  'rgba(0,153,168,0.20)',

  sidebar:          '#FFFFFF',
  sidebarBorder:    'rgba(0,0,0,0.08)',
  sidebarActive:    '#E6F7F8',
  sidebarActiveText:'#0E7490',

  overlay: 'rgba(17,24,39,0.55)',
  shimmer: '#E4E8F0',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  xxl: 24, xxxl: 32, huge: 40, screen: 24,
} as const;

export const radius = {
  sm: 6, md: 10, lg: 12, xl: 16, xxl: 20, full: 999,
} as const;

// ── Typography — Inter only ───────────────────────────────────
// Weight scale: 400 body · 500 medium · 600 semibold ·
//               700 bold (headings) · 800 extrabold (display)
export const typography = {
  display:      { fontSize: 32, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.8, lineHeight: 38 },
  h1:           { fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.4, lineHeight: 28 },
  h2:           { fontSize: 17, fontFamily: 'Inter_700Bold',      letterSpacing: -0.2, lineHeight: 24 },
  h3:           { fontSize: 14, fontFamily: 'Inter_600SemiBold',  lineHeight: 20 },
  body:         { fontSize: 14, fontFamily: 'Inter_400Regular',   lineHeight: 22 },
  bodyMedium:   { fontSize: 14, fontFamily: 'Inter_500Medium',    lineHeight: 22 },
  bodySemibold: { fontSize: 14, fontFamily: 'Inter_600SemiBold',  lineHeight: 22 },
  caption:      { fontSize: 12, fontFamily: 'Inter_400Regular',   lineHeight: 18 },
  captionBold:  { fontSize: 12, fontFamily: 'Inter_600SemiBold',  lineHeight: 18 },
  micro:        { fontSize: 10, fontFamily: 'Inter_600SemiBold',  letterSpacing: 0.4, lineHeight: 14 },
  number:       { fontSize: 28, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1,  lineHeight: 32 },
  numberLarge:  { fontSize: 38, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1.5,lineHeight: 44 },
  mono:         { fontSize: 13, fontFamily: 'Inter_500Medium',    lineHeight: 20 },
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
