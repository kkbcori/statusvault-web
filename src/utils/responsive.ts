// ─── Responsive utilities ─────────────────────────────────────
import { Platform, useWindowDimensions, Dimensions } from 'react-native';

export const IS_WEB = Platform.OS === 'web';

const { width: INIT_W } = Dimensions.get('window');

/** Device class based on initial width */
export const IS_TABLET  = INIT_W >= 768 && INIT_W < 1024;
export const IS_PHONE   = INIT_W < 768;
export const IS_SMALL   = INIT_W < 390;   // Small phones (SE, 12 mini)

/** Returns true when screen width >= breakpoint */
export function useIsWide(breakpoint = 768): boolean {
  const { width } = useWindowDimensions();
  return IS_WEB && width >= breakpoint;
}

/** Reactive screen size hook */
export function useScreenSize() {
  const { width, height } = useWindowDimensions();
  return {
    width,
    height,
    isPhone:    width < 768,
    isTablet:   width >= 768 && width < 1024,
    isDesktop:  width >= 1024,
    isSmall:    width < 390,
    isLandscape: width > height,
  };
}

/** @deprecated — not currently used in web build */
export function rval<T>(phone: T, tablet?: T, desktop?: T): T {
  if (IS_WEB) return desktop ?? tablet ?? phone;
  if (IS_TABLET && tablet !== undefined) return tablet;
  return phone;
}

/** @deprecated — not currently used in web build */
export function webStyle<T extends object>(style: T): T | Record<string, never> {
  return IS_WEB ? style : {};
}

/** @deprecated — not currently used in web build */
export function nativeStyle<T extends object>(style: T): T | Record<string, never> {
  return !IS_WEB ? style : {};
}

/** Responsive horizontal padding */
export const screenPadding = IS_WEB ? 0 : IS_TABLET ? 24 : 16;

/** Responsive card border radius */
export const cardRadius = IS_TABLET ? 20 : 16;
