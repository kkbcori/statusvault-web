// ═══════════════════════════════════════════════════════════════
// StatusVault — Design System v7 — Materio-inspired
// Dark sidebar · stat cards · #F4F5FA background · Inter
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';

export const colors = {
  // ── Brand — Materio purple-blue ──
  primary:      '#7367F0',
  primaryLight: '#9E95F5',
  primaryMid:   '#5B50E8',
  primaryDark:  '#4A3ECC',
  primaryBg:    '#F0EEFF',

  accent:       '#7367F0',
  accentDim:    'rgba(115,103,240,0.12)',
  accentLight:  '#F0EEFF',

  // ── Severity ──
  success:      '#28C76F',
  successLight: '#EAFFF4',
  successDark:  '#1E9954',
  warning:      '#FF9F43',
  warningLight: '#FFF4E6',
  warningDark:  '#CC7A28',
  danger:       '#EA5455',
  dangerLight:  '#FFEEEE',
  dangerDark:   '#C03E3F',
  info:         '#00CFE8',
  infoLight:    '#E0FAFD',

  // ── Page surfaces ──
  background:   '#F4F5FA',   // Materio page bg
  card:         '#FFFFFF',
  cardHover:    '#FAFBFF',

  // ── Sidebar — Materio dark ──
  sidebar:           '#2F3349',   // Materio sidebar dark
  sidebarDeep:       '#25293C',   // deeper sections
  sidebarHover:      'rgba(255,255,255,0.06)',
  sidebarActive:     'rgba(115,103,240,0.16)',
  sidebarBorder:     'rgba(255,255,255,0.06)',
  sidebarText:       'rgba(225,222,245,0.55)',
  sidebarTextHover:  'rgba(225,222,245,0.87)',
  sidebarActiveText: '#7367F0',
  sidebarIcon:       'rgba(225,222,245,0.55)',
  sidebarIconActive: '#7367F0',

  // ── Text ──
  text1:       '#2F3349',
  text2:       '#4B4C6A',
  text3:       '#8588A5',
  text4:       '#ACAEC5',
  textInverse: '#FFFFFF',

  // ── Borders ──
  border:      '#DBDADE',
  borderLight: '#EBEBEB',
  borderGold:  'rgba(115,103,240,0.25)',

  // ── Misc ──
  overlay: 'rgba(47,51,73,0.60)',
  shimmer: '#EEEEF5',
  backgroundDark: '#25293C',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  xxl: 24, xxxl: 32, huge: 40, screen: 20,
} as const;

export const radius = {
  sm: 6, md: 8, lg: 10, xl: 12, xxl: 16, full: 999,
} as const;

export const typography = {
  display:      { fontSize: 30, fontFamily: 'Inter_700Bold',      letterSpacing: -0.5, lineHeight: 36 },
  h1:           { fontSize: 22, fontFamily: 'Inter_600SemiBold',  letterSpacing: -0.3, lineHeight: 28 },
  h2:           { fontSize: 17, fontFamily: 'Inter_600SemiBold',  letterSpacing: -0.2, lineHeight: 24 },
  h3:           { fontSize: 15, fontFamily: 'Inter_500Medium',    lineHeight: 22 },
  body:         { fontSize: 14, fontFamily: 'Inter_400Regular',   lineHeight: 22 },
  bodyMedium:   { fontSize: 14, fontFamily: 'Inter_500Medium',    lineHeight: 22 },
  bodySemibold: { fontSize: 14, fontFamily: 'Inter_600SemiBold',  lineHeight: 22 },
  caption:      { fontSize: 12, fontFamily: 'Inter_400Regular',   lineHeight: 18 },
  captionBold:  { fontSize: 12, fontFamily: 'Inter_600SemiBold',  lineHeight: 18 },
  micro:        { fontSize: 10, fontFamily: 'Inter_500Medium',    letterSpacing: 0.5, lineHeight: 14 },
  label:        { fontSize: 11, fontFamily: 'Inter_500Medium',    letterSpacing: 0.3, lineHeight: 16 },
  number:       { fontSize: 26, fontFamily: 'Inter_700Bold',      letterSpacing: -0.5, lineHeight: 32 },
  numberLarge:  { fontSize: 36, fontFamily: 'Inter_700Bold',      letterSpacing: -1,   lineHeight: 42 },
  mono:         { fontSize: 12, fontFamily: 'Inter_500Medium',    lineHeight: 18 },
} as const;

export const shadows = {
  xs: Platform.select({
    web: { boxShadow: '0 2px 4px rgba(47,43,61,0.06)' } as any,
    ios: { shadowColor: '#2F3349', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 1 },
  }),
  sm: Platform.select({
    web: { boxShadow: '0 2px 6px rgba(47,43,61,0.08)' } as any,
    ios: { shadowColor: '#2F3349', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    web: { boxShadow: '0 4px 12px rgba(47,43,61,0.10)' } as any,
    ios: { shadowColor: '#2F3349', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.09, shadowRadius: 12 },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    web: { boxShadow: '0 8px 24px rgba(47,43,61,0.12)' } as any,
    ios: { shadowColor: '#2F3349', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24 },
    android: { elevation: 8 },
  }),
  xl: Platform.select({
    web: { boxShadow: '0 16px 40px rgba(47,43,61,0.14)' } as any,
    ios: { shadowColor: '#2F3349', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.14, shadowRadius: 40 },
    android: { elevation: 12 },
  }),
  gold: Platform.select({
    web: { boxShadow: '0 4px 16px rgba(115,103,240,0.30)' } as any,
    ios: { shadowColor: '#7367F0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12 },
    android: { elevation: 4 },
  }),
} as const;
