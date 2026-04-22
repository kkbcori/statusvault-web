// ═══════════════════════════════════════════════════════════════
// AnimatedEmptyIcon — reusable animated Ionicons for empty states
// Subtle continuous float + pulsing glow halo behind the icon
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, Platform, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  /** Ionicons glyph name */
  name: keyof typeof Ionicons.glyphMap;
  /** Icon size (default 36) */
  size?: number;
  /** Accent color — used for both icon and the glow halo */
  color?: string;
  /** Halo container size (default 84) */
  haloSize?: number;
  /** Disable animations (e.g. when reduced-motion preferred) */
  static?: boolean;
  /** Extra style on the outer wrapper */
  style?: ViewStyle;
}

export const AnimatedEmptyIcon: React.FC<Props> = ({
  name,
  size = 36,
  color = '#6FAFF2',
  haloSize = 84,
  static: noAnim = false,
  style,
}) => {
  const float   = useRef(new Animated.Value(0)).current;  // -1..1
  const glow    = useRef(new Animated.Value(0)).current;  //  0..1

  useEffect(() => {
    if (noAnim) return;

    // ── Float: gentle vertical bob (3.5s loop, ease in/out) ──
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1,  duration: 1750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: -1, duration: 1750, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    floatLoop.start();

    // ── Glow: opacity pulse (2.5s loop, slower than float for dual rhythm) ──
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    return () => { floatLoop.stop(); glowLoop.stop(); };
  }, [noAnim]);

  // Float maps -1..1 → -3..3 px translation
  const translateY = float.interpolate({ inputRange: [-1, 1], outputRange: [-3, 3] });
  // Glow maps 0..1 → 0.35..0.85 opacity (and slight scale for "breathe")
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const glowScale   = glow.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1.08] });

  return (
    <View style={[{ width: haloSize, height: haloSize, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Outer glow halo — soft tint that pulses */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute' as any,
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize / 2,
          backgroundColor: color + '22',
          opacity: glowOpacity,
          transform: [{ scale: glowScale }],
        } as any}
      />
      {/* Inner solid circle — frame for the icon */}
      <View
        style={{
          width: haloSize * 0.62,
          height: haloSize * 0.62,
          borderRadius: (haloSize * 0.62) / 2,
          backgroundColor: color + '18',
          borderWidth: 1,
          borderColor: color + '38',
          alignItems: 'center',
          justifyContent: 'center',
          ...(Platform.OS === 'web' ? ({ boxShadow: `0 0 24px ${color}30` } as any) : {}),
        }}
      >
        {/* Animated icon — gentle float */}
        <Animated.View style={{ transform: [{ translateY }] }}>
          <Ionicons name={name} size={size} color={color} />
        </Animated.View>
      </View>
    </View>
  );
};
