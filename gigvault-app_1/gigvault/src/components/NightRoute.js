// NightRoute — the week-at-a-glance chart, styled as a route on a dark
// road at night instead of a generic bar chart. Each day is a waypoint;
// the standout day lights up like a headlight.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme/theme';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * @param {number[]} values - 7 values, Mon..Sun, raw earnings per day
 */
export default function NightRoute({ values = [] }) {
  const xs = [20, 60, 100, 140, 180, 220, 260];
  const max = Math.max(...values, 1);
  const minY = 14;
  const maxY = 58;
  const ys = values.map((v) => maxY - (v / max) * (maxY - minY));
  const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  const peakIndex = values.indexOf(Math.max(...values));

  return (
    <View>
      <Text style={styles.title}>This week&apos;s route</Text>
      <Svg viewBox="0 0 300 100" width="100%" height={100}>
        <Rect x={0} y={62} width={300} height={20} rx={5} fill={colors.roadBg} />
        <Line x1={10} y1={72} x2={290} y2={72} stroke={colors.roadLine} strokeWidth={2} strokeDasharray="9 9" />
        <Polyline points={points} fill="none" stroke="rgba(94,106,210,0.45)" strokeWidth={2} />
        {xs.map((x, i) => (
          <React.Fragment key={i}>
            {i === peakIndex && (
              <Circle cx={x} cy={ys[i]} r={7} fill={colors.accent} opacity={0.18} />
            )}
            <Circle
              cx={x}
              cy={ys[i]}
              r={i === peakIndex ? 4.5 : 3.5}
              fill={i === peakIndex ? colors.accent : '#43434c'}
            />
            <SvgText
              x={x}
              y={96}
              textAnchor="middle"
              fontFamily={i === peakIndex ? fonts.numericBold : fonts.body}
              fontSize={9}
              fill={i === peakIndex ? '#9CA5F0' : colors.textMuted}
            >
              {DAY_LABELS[i]}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    fontFamily: fonts.label,
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 8,
  },
});
