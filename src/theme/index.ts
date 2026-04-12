// ═══════════════════════════════════════════════════════════════
// StatusVault — Premium Design System v8
// Midnight navy sidebar · Crisp white cards · Indigo accent
// Works identically on Web, iOS, Android
// ═══════════════════════════════════════════════════════════════
import { Platform } from 'react-native';

export const colors = {
  // ── Brand — Premium Indigo ──────────────────────────────────
  primary:      '#4F46E5',   // Indigo 600 — electric, trustworthy
  primaryLight: '#818CF8',   // Indigo 400
  primaryMid:   '#3730A3',   // Indigo 800
  primaryDark:  '#1E1B4B',   // Indigo 950
  primaryBg:    '#EEF2FF',   // Indigo 50

  accent:       '#4F46E5',
  accentDim:    'rgba(79,70,229,0.10)',
  accentLight:  '#EEF2FF',

  // ── Status Colors ───────────────────────────────────────────
  success:      '#059669',   // Emerald 600
  successLight: '#ECFDF5',
  successDark:  '#047857',
  warning:      '#D97706',   // Amber 600
  warningLight: '#FFFBEB',
  warningDark:  '#B45309',
  danger:       '#DC2626',   // Red 600
  dangerLight:  '#FEF2F2',
  dangerDark:   '#B91C1C',
  info:         '#0891B2',   // Cyan 600
  infoLight:    '#ECFEFF',

  // ── Page surfaces ───────────────────────────────────────────
  background:   '#F8FAFF',   // Near-white with cool blue tint
  card:         '#FFFFFF',
  cardHover:    '#FAFBFF',

  // ── Sidebar — Premium Midnight ──────────────────────────────
  sidebar:           '#0A0E1A',   // Very deep navy
  sidebarDeep:       '#060912',
  sidebarHover:      'rgba(255,255,255,0.04)',
  sidebarActive:     'rgba(79,70,229,0.18)',
  sidebarBorder:     'rgba(255,255,255,0.06)',
  sidebarText:       'rgba(203,213,225,0.50)',
  sidebarTextHover:  'rgba(248,250,252,0.90)',
  sidebarActiveText: '#818CF8',
  sidebarIcon:       'rgba(203,213,225,0.45)',
  sidebarIconActive: '#818CF8',

  // ── Text ────────────────────────────────────────────────────
  text1:       '#0F172A',   // Slate 900
  text2:       '#334155',   // Slate 700
  text3:       '#64748B',   // Slate 500
  text4:       '#94A3B8',   // Slate 400
  textInverse: '#FFFFFF',

  // ── Borders ─────────────────────────────────────────────────
  border:      '#E2E8F0',   // Slate 200
  borderLight: '#F1F5F9',   // Slate 100
  borderGold:  'rgba(79,70,229,0.20)',

  // ── Misc ────────────────────────────────────────────────────
  overlay:     'rgba(15,23,42,0.65)',
  shimmer:     '#EFF1F5',
  backgroundDark: '#1E293B',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  xxl: 24, xxxl: 32, huge: 40, screen: 20,
} as const;

export const radius = {
  sm: 6, md: 8, lg: 12, xl: 16, xxl: 20, full: 999,
} as const;

export const typography = {
  display:      { fontSize: 30, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.8, lineHeight: 36 },
  h1:           { fontSize: 22, fontFamily: 'Inter_700Bold',      letterSpacing: -0.4, lineHeight: 28 },
  h2:           { fontSize: 17, fontFamily: 'Inter_600SemiBold',  letterSpacing: -0.2, lineHeight: 24 },
  h3:           { fontSize: 15, fontFamily: 'Inter_600SemiBold',  lineHeight: 22 },
  body:         { fontSize: 14, fontFamily: 'Inter_400Regular',   lineHeight: 22 },
  bodyMedium:   { fontSize: 14, fontFamily: 'Inter_500Medium',    lineHeight: 22 },
  bodySemibold: { fontSize: 14, fontFamily: 'Inter_600SemiBold',  lineHeight: 22 },
  caption:      { fontSize: 12, fontFamily: 'Inter_400Regular',   lineHeight: 18 },
  captionBold:  { fontSize: 12, fontFamily: 'Inter_600SemiBold',  lineHeight: 18 },
  micro:        { fontSize: 10, fontFamily: 'Inter_600SemiBold',  letterSpacing: 0.6, lineHeight: 14 },
  label:        { fontSize: 11, fontFamily: 'Inter_500Medium',    letterSpacing: 0.3, lineHeight: 16 },
  number:       { fontSize: 28, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.8, lineHeight: 34 },
  numberLarge:  { fontSize: 40, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1.2, lineHeight: 48 },
  mono:         { fontSize: 12, fontFamily: 'Inter_500Medium',    lineHeight: 18 },
} as const;

export const shadows = {
  xs: Platform.select({
    web: { boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 0 0 1px rgba(15,23,42,0.03)' } as any,
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3 },
    android: { elevation: 1 },
  }),
  sm: Platform.select({
    web: { boxShadow: '0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03)' } as any,
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
    android: { elevation: 2 },
  }),
  md: Platform.select({
    web: { boxShadow: '0 4px 16px rgba(15,23,42,0.08), 0 0 0 1px rgba(15,23,42,0.04)' } as any,
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16 },
    android: { elevation: 4 },
  }),
  lg: Platform.select({
    web: { boxShadow: '0 8px 32px rgba(15,23,42,0.10), 0 0 0 1px rgba(15,23,42,0.04)' } as any,
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.10, shadowRadius: 32 },
    android: { elevation: 8 },
  }),
  xl: Platform.select({
    web: { boxShadow: '0 16px 48px rgba(15,23,42,0.14), 0 0 0 1px rgba(15,23,42,0.04)' } as any,
    ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.14, shadowRadius: 48 },
    android: { elevation: 12 },
  }),
  gold: Platform.select({
    web: { boxShadow: '0 4px 20px rgba(79,70,229,0.25), 0 0 0 1px rgba(79,70,229,0.15)' } as any,
    ios: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.20, shadowRadius: 16 },
    android: { elevation: 6 },
  }),
  glow: Platform.select({
    web: { boxShadow: '0 0 0 3px rgba(79,70,229,0.15), 0 4px 16px rgba(79,70,229,0.20)' } as any,
    ios: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.20, shadowRadius: 12 },
    android: { elevation: 4 },
  }),
} as const;

// ── Gradient presets (for LinearGradient) ───────────────────
export const gradients = {
  primary:   ['#4F46E5', '#7C3AED'] as const,       // Indigo → Violet
  primaryH:  ['#4F46E5', '#818CF8'] as const,       // Indigo light
  dark:      ['#0A0E1A', '#1E293B'] as const,       // Midnight
  success:   ['#059669', '#10B981'] as const,       // Emerald
  danger:    ['#DC2626', '#F43F5E'] as const,       // Red
  warning:   ['#D97706', '#F59E0B'] as const,       // Amber
  premium:   ['#7C3AED', '#4F46E5', '#0891B2'] as const, // Premium
  card:      ['#FFFFFF', '#F8FAFF'] as const,       // Card subtle
  header:    ['#0A0E1A', '#1A1F3A'] as const,       // Header dark
} as const;
