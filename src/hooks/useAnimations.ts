// ═══════════════════════════════════════════════════════════════
// StatusVault — Shared Animation Hooks (Pass 1)
// Built-in Animated API — zero new dependencies
// useNativeDriver: true — runs on UI thread on iOS + Android
// ═══════════════════════════════════════════════════════════════

import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

/** Slide-up + fade-in entrance. Pass delay (ms) to stagger cards. */
export function useEntrance(delay = 0) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

/** Tactile scale feedback for buttons and cards. */
export function usePressScale(min = 0.96) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.timing(scale, { toValue: min, duration: 85, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, friction: 5, tension: 300, useNativeDriver: true }).start();

  return { scale, onPressIn, onPressOut };
}

/** Pulsing attention animation for critical/expired items. */
export function usePulse(active = true) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active) { scale.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.07, duration: 800, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.sine), useNativeDriver: true }),
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
    Animated.timing(x, { toValue: -10, duration: 50, useNativeDriver: true }),
    Animated.timing(x, { toValue:  10, duration: 50, useNativeDriver: true }),
    Animated.timing(x, { toValue:  -8, duration: 50, useNativeDriver: true }),
    Animated.timing(x, { toValue:   8, duration: 50, useNativeDriver: true }),
    Animated.timing(x, { toValue:   0, duration: 50, useNativeDriver: true }),
  ]).start();

  return { shake, transform: [{ translateX: x }] };
}

/** Checkmark pop for checklist completion. */
export function useCheckPop() {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const pop   = () => Animated.parallel([
    Animated.spring(scale,   { toValue: 1, friction: 4, tension: 400, useNativeDriver: true }),
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
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
      Animated.timing(y,       { toValue: -18, duration: 130, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0,   duration: 130, useNativeDriver: true }),
    ]).start(() => {
      y.setValue(18);
      onSwap();
      Animated.parallel([
        Animated.timing(y,       { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  return { roll, style: { opacity, transform: [{ translateY: y }] } };
}
