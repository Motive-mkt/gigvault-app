// MiniGauge — compact gauge for the two-up stat row (tax set-aside, daily cap).
// Same dash-cluster language as GaugeArc, scaled down, no center sub-label.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme/theme';

export default function MiniGauge({ value, max, color, label }) {
  const r = 46;
  const cx = 58;
  const cy = 62;
  const circumferenceHalf = Math.PI * r;
  const pct = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const dashLength = circumferenceHalf * pct;
  const pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;

  return (
    <View style={styles.card}>
      <Svg viewBox="0 0 116 70" width="100%" height={70}>
        <Path d={pathD} stroke={colors.trackBg} strokeWidth={8} strokeLinecap="round" fill="none" />
        <Path
          d={pathD}
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dashLength} 1000`}
        />
        <SvgText
          x={cx}
          y={46}
          textAnchor="middle"
          fontFamily={fonts.numericBold}
          fontSize={14}
          fill={colors.textPrimary}
        >
          {label.value}
        </SvgText>
      </Svg>
      <Text style={styles.caption}>{label.caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  caption: {
    fontFamily: fonts.body,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
