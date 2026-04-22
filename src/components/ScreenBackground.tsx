// ═══════════════════════════════════════════════════════════════
// ScreenBackground — atmospheric dark backdrop for all screens
// Layers: deep navy base → bg_001.png → ambient radial glow → content
// ═══════════════════════════════════════════════════════════════
import React from 'react';
import { View, ImageBackground, Platform, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface Props {
  children: React.ReactNode;
  /** Ambient glow variant: 'blue' (default) | 'gold' | 'green' | 'none' */
  ambient?: 'blue' | 'gold' | 'green' | 'none';
  /** Override imageOpacity (0-1). Default 0.35 */
  imageOpacity?: number;
  /** Extra style on the outer wrapper */
  style?: ViewStyle;
  /** Pointer-events pass-through scrim only. Default false */
  transparent?: boolean;
}

const AMBIENT: Record<'blue' | 'gold' | 'green', { a: string; b: string }> = {
  blue:  { a: 'rgba(59,139,232,0.22)',  b: 'rgba(45,106,191,0.10)' },
  gold:  { a: 'rgba(245,192,83,0.18)',  b: 'rgba(232,151,10,0.06)' },
  green: { a: 'rgba(76,217,138,0.18)',  b: 'rgba(47,168,102,0.06)' },
};

export const ScreenBackground: React.FC<Props> = ({
  children,
  ambient = 'blue',
  imageOpacity = 0.32,
  style,
  transparent = false,
}) => {
  const glow = ambient !== 'none' ? AMBIENT[ambient] : null;
  return (
    <View style={[styles.root, style]}>
      {/* Layer 1: Deep navy base */}
      <View style={styles.base} pointerEvents="none" />

      {/* Layer 2: The shield BG image (subtly dimmed) */}
      {!transparent && (
        <ImageBackground
          source={require('../../assets/bg-app.png')}
          style={styles.bgImage}
          imageStyle={{ opacity: imageOpacity, resizeMode: 'cover' }}
          pointerEvents="none"
        />
      )}

      {/* Layer 3: Ambient top-right glow */}
      {glow && (
        <View pointerEvents="none" style={[styles.glowTop, Platform.OS === 'web' ? ({
          background: `radial-gradient(ellipse 900px 600px at 85% -10%, ${glow.a} 0%, transparent 60%)`,
        } as any) : { backgroundColor: 'transparent' } ]} />
      )}

      {/* Layer 4: Ambient bottom-left glow */}
      {glow && (
        <View pointerEvents="none" style={[styles.glowBottom, Platform.OS === 'web' ? ({
          background: `radial-gradient(ellipse 700px 500px at 10% 110%, ${glow.b} 0%, transparent 55%)`,
        } as any) : { backgroundColor: 'transparent' } ]} />
      )}

      {/* Layer 5: Dark tint scrim on top of image so text stays readable */}
      <View style={styles.scrim} pointerEvents="none" />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: colors.backgroundDeep, position: 'relative' as any, overflow: 'hidden' as any } as any,
  base:       { ...(StyleSheet.absoluteFillObject as any), backgroundColor: colors.background } as any,
  bgImage:    { ...(StyleSheet.absoluteFillObject as any) } as any,
  glowTop:    { ...(StyleSheet.absoluteFillObject as any) } as any,
  glowBottom: { ...(StyleSheet.absoluteFillObject as any) } as any,
  scrim:      { ...(StyleSheet.absoluteFillObject as any), backgroundColor: 'rgba(5,11,28,0.35)' } as any,
  content:    { flex: 1, zIndex: 1 } as any,
});

// ─── Glass card helper — consistent dark glass surfaces ────────
interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Tone variant for tinted glass */
  tone?: 'default' | 'blue' | 'green' | 'gold' | 'red';
  /** Hover elevation */
  raised?: boolean;
}

const TONE_TINTS: Record<string, { bg: string; border: string }> = {
  default: { bg: 'rgba(255,255,255,0.055)', border: 'rgba(255,255,255,0.10)' },
  blue:    { bg: 'rgba(59,139,232,0.10)',   border: 'rgba(59,139,232,0.28)' },
  green:   { bg: 'rgba(76,217,138,0.10)',   border: 'rgba(76,217,138,0.28)' },
  gold:    { bg: 'rgba(245,192,83,0.10)',   border: 'rgba(245,192,83,0.28)' },
  red:     { bg: 'rgba(255,107,107,0.10)',  border: 'rgba(255,107,107,0.30)' },
};

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, tone = 'default', raised = false }) => {
  const tint = TONE_TINTS[tone];
  const webStyle = Platform.OS === 'web' ? ({
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    boxShadow: raised
      ? '0 12px 40px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 4px 16px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)',
  } as any) : {};
  return (
    <View style={[{
      backgroundColor: tint.bg,
      borderWidth: 1,
      borderColor: tint.border,
      borderRadius: 16,
      ...webStyle,
    } as any, style]}>
      {children}
    </View>
  );
};
