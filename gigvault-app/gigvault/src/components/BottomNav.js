// BottomNav — instrument-cluster style tab bar shared across all screens.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // swap for your icon set if different
import { colors, fonts, radius, spacing } from '../theme/theme';

const TABS = [
  { key: 'Dashboard', icon: 'activity', label: 'Dash' },
  { key: 'Log', icon: 'plus-circle', label: 'Log' },
  { key: 'Charts', icon: 'trending-up', label: 'Route' },
  { key: 'Tax', icon: 'percent', label: 'Tax' },
  { key: 'Settings', icon: 'settings', label: 'Settings' },
];

export default function BottomNav({ active, onSelect }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        const color = isActive ? colors.accent : colors.textMuted;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
          >
            <Icon name={tab.icon} size={18} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingVertical: 10,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tab: { alignItems: 'center', gap: 3 },
  label: { fontFamily: fonts.body, fontSize: 9 },
});
