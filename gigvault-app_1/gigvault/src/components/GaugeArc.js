// GaugeArc — reusable speedometer-style semicircle gauge.
// Used for earnings vs goal, tax set-aside, daily cap, and anywhere
// else GigVault needs to show "how full is this" as a dash dial
// instead of a generic progress bar.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme/theme';

/**
 * @param {number} value - current value
 * @param {number} max - value representing 100% of the arc
 * @param {string} color - accent color for the filled arc
 * @param {string} centerLabel - big text in the middle (e.g. "$842.50")
 * @param {string} subLabel - small muted text under the center label
 * @param {number} size - rendered width/height of the gauge in dp
 */
export default function GaugeArc({
  value,
  max,
  color = colors.accent,
  centerLabel,
  subLabel,
  size = 220,
}) {
  const r = 86;
  const cx = 110;
  const cy = 110;
  const circumferenceHalf = Math.PI * r; // length of a semicircle path
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const dashLength = circumferenceHalf * pct;

  const pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;

  return (
    <View style={[styles.wrap, { width: size, height: size * 0.6 }]}>
      <Svg viewBox="0 0 220 130" width="100%" height="100%">
        {/* background track */}
        <Path
          d={pathD}
          stroke={colors.trackBg}
          strokeWidth={13}
          strokeLinecap="round"
          fill="none"
        />
        {/* filled progress */}
        <Path
          d={pathD}
          stroke={color}
          strokeWidth={13}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dashLength} 1000`}
        />
        {/* goal end-cap tick */}
        <Circle cx={cx + r} cy={cy} r={3} fill={colors.roadLine} />

        {centerLabel ? (
          <SvgText
            x={cx}
            y={80}
            textAnchor="middle"
            fontFamily={fonts.numericBold}
            fontSize={27}
            fill={colors.textPrimary}
          >
            {centerLabel}
          </SvgText>
        ) : null}
        {subLabel ? (
          <SvgText
            x={cx}
            y={100}
            textAnchor="middle"
            fontFamily={fonts.body}
            fontSize={11}
            fill={colors.textMuted}
          >
            {subLabel}
          </SvgText>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
