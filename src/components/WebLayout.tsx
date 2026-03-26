// ═══════════════════════════════════════════════════════════════
// WebLayout — Responsive container for web
// On web: centers content at max 480px with premium background
// On mobile: renders children directly — zero impact
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, Platform, StyleSheet, Dimensions } from 'react-native';
import { colors } from '../theme';

interface WebLayoutProps {
  children: React.ReactNode;
}

export const WebLayout: React.FC<WebLayoutProps> = ({ children }) => {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View style={styles.outer}>
      {/* Decorative passport lines on the outer background */}
      {[...Array(8)].map((_, i) => (
        <View key={i} style={[styles.bgLine, { top: 80 + i * 120 }]} />
      ))}
      {/* Watermark text */}
      <View style={styles.watermarkWrap}>
        {['STATUSVAULT', 'IMMIGRATION', 'TRACKER', 'SECURE'].map((w, i) => (
          <View key={i} style={[styles.watermarkRow, { top: 60 + i * 220, left: i % 2 === 0 ? -40 : undefined, right: i % 2 !== 0 ? -40 : undefined }]}>
            <View style={styles.watermarkDot} />
          </View>
        ))}
      </View>

      {/* Centered phone-frame container */}
      <View style={styles.frame}>
        {/* Gold top trim */}
        <View style={styles.frameTrim} />
        {children}
        {/* Gold bottom trim */}
        <View style={styles.frameBottomTrim} />
      </View>

      {/* Side branding */}
      <View style={styles.sideBrand}>
        <View style={styles.sideBrandInner}>
          <View style={styles.sideLogo}>
            <View style={styles.sideLogoInner} />
          </View>
          <View style={styles.sideDivider} />
          {[
            { icon: '🔒', label: 'AES-256 Encrypted' },
            { icon: '📱', label: 'Works Offline' },
            { icon: '☁️', label: 'Cross-device Sync' },
            { icon: '🌍', label: 'Immigration Ready' },
          ].map(({ icon, label }, i) => (
            <View key={i} style={styles.sideFeature}>
              <View style={styles.sideFeatureIcon}>
                <View style={styles.sideFeatureDot} />
              </View>
              <View style={styles.sideFeatureText}>
                <View style={[styles.sideTextLine, { width: 80 + (i % 2) * 30 }]} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#060E1A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: '100vh' as any,
  },
  bgLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.03,
  },
  watermarkWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  watermarkRow: {
    position: 'absolute',
  },
  watermarkDot: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.accent,
    opacity: 0.015,
  },
  frame: {
    width: 480,
    maxWidth: '100%' as any,
    height: '100vh' as any,
    maxHeight: 900,
    backgroundColor: colors.background,
    overflow: 'hidden',
    borderRadius: Platform.OS === 'web' ? 0 : 0,
    // Subtle gold border on web
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(201,163,81,0.15)',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 60,
  },
  frameTrim: {
    height: 3,
    backgroundColor: colors.accent,
    opacity: 0.8,
  },
  frameBottomTrim: {
    height: 2,
    backgroundColor: colors.accent,
    opacity: 0.4,
  },
  // Side branding panel — only visible on wide screens
  sideBrand: {
    width: 200,
    paddingLeft: 32,
    display: 'none' as any,
  },
  sideBrandInner: {
    gap: 16,
  },
  sideLogo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(201,163,81,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(201,163,81,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sideLogoInner: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.accent,
    opacity: 0.6,
  },
  sideDivider: {
    height: 1,
    backgroundColor: 'rgba(201,163,81,0.15)',
    marginBottom: 8,
  },
  sideFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sideFeatureIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(201,163,81,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideFeatureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    opacity: 0.6,
  },
  sideFeatureText: { gap: 4 },
  sideTextLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
