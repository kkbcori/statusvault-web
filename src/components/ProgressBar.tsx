// ═══════════════════════════════════════════════════════════════
// ProgressBar — Reusable animated progress bar
// ═══════════════════════════════════════════════════════════════

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
  trackColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  color = colors.accent,
  height = 8,
  trackColor = colors.borderLight,
}) => {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <View style={[styles.track, { height, backgroundColor: trackColor, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${pct}%`,
            height,
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {},
});
