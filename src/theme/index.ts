// ═══════════════════════════════════════════════════════════════
// StatusVault — Design System v6 — Premium
// Dark sidebar · layered surfaces · tight typography
// Inspired by Linear, Stripe, Vercel
// ═══════════════════════════════════════════════════════════════

import { Platform } from 'react-native';

export const colors = {
  // ── Brand ──
  primary:      '#0EA5E9',   // sky-500 — sharper, more premium than teal
  primaryLight: '#38BDF8',
  primaryMid:   '#0284C7',
  primaryDark:  '#0369A1',
  accent:       '#0EA5E9',
  accentDim:    'rgba(14,165,233,0.10)',
  accentLight:  '#E0F2FE',

  // ── Severity ──
  success:      '#10B981',
  successLight: '#D1FAE5',
  warning:      '#F59E0B',
  warningLight: '#FEF3C7',
  danger:       '#EF4444',
  dangerLight:  '#FEE2E2',

  // ── Page surfaces ──
  background:   '#F8FAFC',   // nearly white — clean slate
  card:         '#FFFFFF',
  cardHover:    '#FAFAFA',

  // ── Sidebar — dark ──
  sidebar:         '#0F172A',   // slate-900
  sidebarHover:    'rgba(255,255,255,0.05)',
  sidebarActive:   'rgba(14,165,233,0.15)',
  sidebarBorder:   'rgba(255,255,255,0.06)',
  sidebarText:     'rgba(255,255,255,0.55)',
  sidebarTextActive: '#FFFFFF',
  sidebarActiveText: '#38BDF8',

  // ── Text ──
  text1:       '#0F172A',   // slate-900
  text2:       '#334155',   // slate-700
  text3:       '#64748B',   // slate-500
  text4:       '#94A3B8',   // slate-400
  textInverse: '#FFFFFF',

  // ── Borders ──
  border:      '#E2E8F0',   // slate-200 — visible but soft
  borderLight: '#F1F5F9',   // slate-100
  borderGold:  'rgba(14,165,233,0.25)',

  // ── Misc ──
  overlay: 'rgba(15,23,42,0.60)',
  shimmer: '#E2E8F0',
  backgroundDark: '#0F172A',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  xxl: 24, xxxl: 32, huge: 40, screen: 24,
} as const;

export const radius = {
  sm: 6, md: 8, lg: 10, xl: 14, xxl: 18, full: 999,
} as const;

export const typography = {
  display:      { fontSize: 32, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1,   lineHeight: 38 },
  h1:           { fontSize: 22, fontFamily: 'Inter_700Bold',      letterSpacing: -0.5, lineHeight: 28 },
  h2:           { fontSize: 16, fontFamily: 'Inter_600SemiBold',  letterSpacing: -0.2, lineHeight: 22 },
  h3:           { fontSize: 14, fontFamily: 'Inter_600SemiBold',  lineHeight: 20 },
  body:         { fontSize: 14, fontFamily: 'Inter_400Regular',   lineHeight: 22 },
  bodyMedium:   { fontSize: 14, fontFamily: 'Inter_500Medium',    lineHeight: 22 },
  bodySemibold: { fontSize: 14, fontFamily: 'Inter_600SemiBold',  lineHeight: 22 },
  caption:      { fontSize: 12, fontFamily: 'Inter_400Regular',   lineHeight: 18 },
  captionBold:  { fontSize: 12, fontFamily: 'Inter_600SemiBold',  lineHeight: 18 },
  micro:        { fontSize: 10, fontFamily: 'Inter_500Medium',    letterSpacing: 0.6, lineHeight: 14 },
  label:        { fontSize: 11, fontFamily: 'Inter_600SemiBold',  letterSpacing: 0.4, lineHeight: 16 },
  number:       { fontSize: 28, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1,   lineHeight: 32 },
  numberLarge:  { fontSize: 40, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1.5, lineHeight: 46 },
  mono:         { fontSize: 12, fontFamily: 'Inter_500Medium',    lineHeight: 18 },
} as const;

export const shadows = {
  xs: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 },
    android: { elevation: 1 },
    web:     { boxShadow: '0 1px 2px rgba(15,23,42,0.04)' } as any,
  }),
  sm: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
    android: { elevation: 2 },
    web:     { boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)' } as any,
  }),
  md: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12 },
    android: { elevation: 4 },
    web:     { boxShadow: '0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -1px rgba(15,23,42,0.04)' } as any,
  }),
  lg: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.10, shadowRadius: 24 },
    android: { elevation: 8 },
    web:     { boxShadow: '0 10px 15px -3px rgba(15,23,42,0.08), 0 4px 6px -2px rgba(15,23,42,0.04)' } as any,
  }),
  xl: Platform.select({
    ios:     { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 40 },
    android: { elevation: 12 },
    web:     { boxShadow: '0 20px 25px -5px rgba(15,23,42,0.10), 0 10px 10px -5px rgba(15,23,42,0.04)' } as any,
  }),
  gold: Platform.select({
    ios:     { shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 12 },
    android: { elevation: 4 },
    web:     { boxShadow: '0 4px 14px rgba(14,165,233,0.20)' } as any,
  }),
} as const;
