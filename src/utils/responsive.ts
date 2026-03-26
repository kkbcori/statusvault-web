// ─── Responsive utilities ─────────────────────────────────────
import { Platform, useWindowDimensions } from 'react-native';

export const IS_WEB = Platform.OS === 'web';

/** Returns true when screen width >= breakpoint (web only) */
export function useIsWide(breakpoint = 768): boolean {
  const { width } = useWindowDimensions();
  return IS_WEB && width >= breakpoint;
}

/** Web-only style — returns style object on web, empty on native */
export function webStyle<T extends object>(style: T): T | Record<string, never> {
  return IS_WEB ? style : {};
}

/** Native-only style — returns style object on native, empty on web */
export function nativeStyle<T extends object>(style: T): T | Record<string, never> {
  return !IS_WEB ? style : {};
}
