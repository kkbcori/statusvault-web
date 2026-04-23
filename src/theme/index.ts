// ═══════════════════════════════════════════════════════════════
// StatusVault — Design System v9 · Midnight Glass
// Dark glassmorphic UI · StatusVault brand (blue/green/gold)
// Works identically on Web, iOS, Android
// ═══════════════════════════════════════════════════════════════
import { Platform } from 'react-native';

export const colors = {
  // ── Brand — StatusVault (from shield logo) ──────────────────
  primary:      '#3B8BE8',   // Shield blue — primary interactive
  primaryLight: '#6FAFF2',   // Lighter blue — hover / highlight
  primaryMid:   '#2D6ABF',   // Deeper blue — pressed / strong accent
  primaryDark:  '#123A72',   // Darkest blue — gradient stop
  primaryBg:    'rgba(59,139,232,0.12)',   // Soft tint for chips

  accent:       '#3B8BE8',
  accentDim:    'rgba(59,139,232,0.14)',
  accentLight:  'rgba(59,139,232,0.20)',

  // StatusVault gold (yellow sun from logo) — reserved for premium / warnings
  gold:         '#F5C053',
  goldDim:      'rgba(245,192,83,0.14)',
  goldDark:     '#E8970A',

  // ── Status ──────────────────────────────────────────────────
  success:      '#4CD98A',   // Logo green — valid / confirmed
  successLight: 'rgba(76,217,138,0.12)',
  successDark:  '#2FA866',
  warning:      '#F5C053',   // Gold — "soon"
  warningLight: 'rgba(245,192,83,0.14)',
  warningDark:  '#CC9628',
  danger:       '#FF6B6B',   // Coral — "critical"
  dangerLight:  'rgba(255,107,107,0.14)',
  dangerDark:   '#D84848',
  info:         '#5B9AF5',
  infoLight:    'rgba(91,154,245,0.14)',

  // ── Page surfaces — Midnight Navy ──────────────────────────
  background:     '#0A1530',   // Deep navy — primary app bg
  backgroundDeep: '#050B1C',   // Deeper — behind everything
  card:           'rgba(255,255,255,0.055)',   // Glass card
  cardHover:      'rgba(255,255,255,0.085)',
  cardSolid:      '#0C1A34',                   // For popovers/modals needing opacity

  // ── Sidebar — Deeper glass ─────────────────────────────────
  sidebar:           'rgba(5,11,28,0.92)',
  sidebarDeep:       '#030812',
  sidebarHover:      'rgba(255,255,255,0.05)',
  sidebarActive:     'rgba(59,139,232,0.18)',
  sidebarBorder:     'rgba(255,255,255,0.07)',
  sidebarText:       'rgba(240,244,255,0.55)',
  sidebarTextHover:  'rgba(240,244,255,0.92)',
  sidebarActiveText: '#6FAFF2',
  sidebarIcon:       'rgba(240,244,255,0.50)',
  sidebarIconActive: '#6FAFF2',

  // ── Text — High-contrast on dark ───────────────────────────
  text1:       '#F0F4FF',                   // Primary
  text2:       'rgba(240,244,255,0.80)',    // Secondary
  text3:       'rgba(240,244,255,0.55)',    // Muted
  text4:       'rgba(240,244,255,0.35)',    // Disabled
  textInverse: '#0A1530',                   // For light-backed buttons

  // ── Borders ─────────────────────────────────────────────────
  border:       'rgba(255,255,255,0.10)',
  borderLight:  'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.18)',
  borderGold:   'rgba(245,192,83,0.28)',

  // ── Misc ────────────────────────────────────────────────────
  overlay:     'rgba(3,8,18,0.80)',
  shimmer:     'rgba(255,255,255,0.08)',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20,
  xxl: 24, xxxl: 32, huge: 40, screen: 20,
} as const;

export const radius = {
  sm: 6, md: 10, lg: 14, xl: 18, xxl: 22, full: 999,
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

const glassWeb = (blur: number = 20) => ({
  backdropFilter: `blur(${blur}px)`,
  WebkitBackdropFilter: `blur(${blur}px)`,
} as any);

export const shadows = {
  xs: Platform.select({ web: { boxShadow: '0 1px 2px rgba(0,0,0,0.25)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.20, shadowRadius: 2 }, android: { elevation: 1 } }),
  sm: Platform.select({ web: { boxShadow: '0 4px 12px rgba(0,0,0,0.30)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 }, android: { elevation: 2 } }),
  md: Platform.select({ web: { boxShadow: '0 8px 28px rgba(0,0,0,0.35)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 16 }, android: { elevation: 4 } }),
  lg: Platform.select({ web: { boxShadow: '0 16px 48px rgba(0,0,0,0.45)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 32 }, android: { elevation: 8 } }),
  xl: Platform.select({ web: { boxShadow: '0 24px 64px rgba(0,0,0,0.55)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.45, shadowRadius: 48 }, android: { elevation: 12 } }),
  gold: Platform.select({ web: { boxShadow: '0 4px 24px rgba(59,139,232,0.40), 0 0 0 1px rgba(59,139,232,0.20)' } as any, ios: { shadowColor: '#3B8BE8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 18 }, android: { elevation: 6 } }),
  glow: Platform.select({ web: { boxShadow: '0 0 0 3px rgba(59,139,232,0.20), 0 6px 20px rgba(59,139,232,0.30)' } as any, ios: { shadowColor: '#3B8BE8', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.28, shadowRadius: 14 }, android: { elevation: 4 } }),
  premium: Platform.select({ web: { boxShadow: '0 4px 24px rgba(245,192,83,0.35), 0 0 0 1px rgba(245,192,83,0.25)' } as any, ios: { shadowColor: '#F5C053', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 16 }, android: { elevation: 6 } }),
  glass: Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)' } as any, ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.20, shadowRadius: 8 }, android: { elevation: 2 } }),
} as const;

export const glass = {
  blur12: Platform.select({ web: glassWeb(12), default: {} as any }),
  blur20: Platform.select({ web: glassWeb(20), default: {} as any }),
  blur30: Platform.select({ web: glassWeb(30), default: {} as any }),
} as const;

export const gradients = {
  primary:     ['#3B8BE8', '#2D6ABF'] as const,
  primaryH:    ['#6FAFF2', '#3B8BE8'] as const,
  dark:        ['#0A1530', '#050B1C'] as const,
  midnight:    ['#0A1530', '#050B1C', '#030812'] as const,
  success:     ['#4CD98A', '#2FA866'] as const,
  danger:      ['#FF6B6B', '#D84848'] as const,
  warning:     ['#F5C053', '#E8970A'] as const,
  premium:     ['#F5C053', '#E8970A', '#C97915'] as const,
  card:        ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'] as const,
  header:      ['#0A1530', '#0F1F44'] as const,
  brandTrio:   ['#3B8BE8', '#4CD98A', '#F5C053'] as const,
  ambient1:    ['rgba(59,139,232,0.22)', 'transparent'] as const,
  ambient2:    ['rgba(76,217,138,0.15)', 'transparent'] as const,
} as const;
