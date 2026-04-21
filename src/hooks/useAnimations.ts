// ═══════════════════════════════════════════════════════════════
// StatusVault — Shared Animation Hooks (Pass 1)
// useNativeDriver: Platform.OS !== 'web'
// On web the native module is absent — JS-based animation used
// On iOS/Android useNativeDriver runs on the UI thread (no jank)
// ═══════════════════════════════════════════════════════════════

import { useRef, useEffect } from 'react';
import { Animated, Easing, Platform } from 'react-native';

// On web, useNativeDriver causes a noisy warning and infinite loop.
// On native it's required for smooth performance.
const NATIVE = Platform.OS !== 'web';

/** Slide-up + fade-in entrance. Pass delay (ms) to stagger cards. */
export function useEntrance(delay = 0) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
      Animated.timing(translateY, { toValue: 0, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

/** Tactile scale feedback for buttons and cards. */
export function usePressScale(min = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.timing(scale, { toValue: min, duration: 85, easing: Easing.out(Easing.quad), useNativeDriver: NATIVE }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 5, tension: 300, useNativeDriver: NATIVE }).start();

  return { scale, onPressIn, onPressOut };
}

/** Pulsing attention animation for critical/expired items. */
export function usePulse(active = true) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) { scale.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.07, duration: 800, easing: Easing.inOut(Easing.sine), useNativeDriver: NATIVE }),
        Animated.timing(scale, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.sine), useNativeDriver: NATIVE }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [active]);

  return { transform: [{ scale }] };
}

/** Horizontal shake for wrong PIN / validation errors. */
export function useShake() {
  const x = useRef(new Animated.Value(0)).current;

  const shake = () => Animated.sequence([
    Animated.timing(x, { toValue: -10, duration: 50, useNativeDriver: NATIVE }),
    Animated.timing(x, { toValue:  10, duration: 50, useNativeDriver: NATIVE }),
    Animated.timing(x, { toValue:  -8, duration: 50, useNativeDriver: NATIVE }),
    Animated.timing(x, { toValue:   8, duration: 50, useNativeDriver: NATIVE }),
    Animated.timing(x, { toValue:   0, duration: 50, useNativeDriver: NATIVE }),
  ]).start();

  return { shake, transform: [{ translateX: x }] };
}

/** Checkmark pop for checklist completion. */
export function useCheckPop() {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const pop   = () => Animated.parallel([
    Animated.spring(scale,   { toValue: 1, friction: 4, tension: 400, useNativeDriver: NATIVE }),
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: NATIVE }),
  ]).start();

  const reset = () => { scale.setValue(0); opacity.setValue(0); };

  return { pop, reset, style: { opacity, transform: [{ scale }] } };
}

/** Counter number roll-up animation. */
export function useCounterRoll() {
  const y       = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const roll = (onSwap: () => void) => {
    Animated.parallel([
      Animated.timing(y,       { toValue: -18, duration: 130, useNativeDriver: NATIVE }),
      Animated.timing(opacity, { toValue: 0,   duration: 130, useNativeDriver: NATIVE }),
    ]).start(() => {
      y.setValue(18);
      onSwap();
      Animated.parallel([
        Animated.timing(y,       { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: NATIVE }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: NATIVE }),
      ]).start();
    });
  };

  return { roll, style: { opacity, transform: [{ translateY: y }] } };
}
