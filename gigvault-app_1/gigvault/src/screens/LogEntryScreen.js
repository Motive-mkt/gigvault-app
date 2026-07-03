import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, fonts, spacing } from '../theme/theme';
import { getActivePlatforms, addEntry } from '../db/database';

// Fallback icon per platform id, used when a platform doesn't have a custom
// icon stored (icons are set during onboarding via seedPlatforms).
const ICON_FALLBACKS = {
  uber: 'truck',
  doordash: 'package',
  instacart: 'shopping-cart',
  lyft: 'navigation',
  sparkdriver: 'zap',
  other: 'more-horizontal',
};

export default function LogEntryScreen({ onSave, onClose }) {
  const [type, setType] = useState('income'); // 'income' | 'expense'
  const [platforms, setPlatforms] = useState([]);
  const [platform, setPlatform] = useState(null);
  const [amount, setAmount] = useState('');
  const [hours, setHours] = useState('');
  const [miles, setMiles] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingPlatforms, setLoadingPlatforms] = useState(true);

  useEffect(() => {
    (async () => {
      const rows = await getActivePlatforms();
      setPlatforms(rows);
      if (rows.length > 0) setPlatform(rows[0].id);
      setLoadingPlatforms(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    setSaving(true);
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      platformId: type === 'income' ? platform : null,
      amount: parseFloat(amount),
      hours: hours ? parseFloat(hours) : null,
      miles: miles ? parseFloat(miles) : null,
      note,
      createdAt: new Date().toISOString(),
    };
    try {
      await addEntry(entry);
      onSave?.(entry);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Log entry</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Icon name="x" size={15} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.segment}>
        <TouchableOpacity
          style={[styles.segmentBtn, type === 'income' && styles.segmentBtnActive]}
          onPress={() => setType('income')}
        >
          <Text style={[styles.segmentText, type === 'income' && styles.segmentTextActive]}>
            Income
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, type === 'expense' && styles.segmentBtnActive]}
          onPress={() => setType('expense')}
        >
          <Text style={[styles.segmentText, type === 'expense' && styles.segmentTextActive]}>
            Expense
          </Text>
        </TouchableOpacity>
      </View>

      {type === 'income' && (
        <>
          <Text style={styles.label}>Platform</Text>
          {loadingPlatforms ? (
            <ActivityIndicator color={colors.accent} style={{ marginBottom: spacing.lg }} />
          ) : platforms.length === 0 ? (
            <Text style={styles.emptyText}>
              No platforms set up yet — add one in Settings.
            </Text>
          ) : (
            <View style={styles.platformRow}>
              {platforms.map((p) => {
                const isActive = platform === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.platformChip, isActive && styles.platformChipActive]}
                    onPress={() => setPlatform(p.id)}
                  >
                    <Icon
                      name={p.icon || ICON_FALLBACKS[p.id] || 'circle'}
                      size={17}
                      color={isActive ? '#9CA5F0' : colors.textMuted}
                    />
                    <Text style={[styles.platformLabel, isActive && { color: '#9CA5F0' }]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </>
      )}

      <Text style={styles.label}>Amount</Text>
      <View style={styles.amountBox}>
        <Text style={styles.amountSign}>$</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.smallBox, { marginRight: spacing.md }]}>
          <Text style={styles.smallLabel}>Date</Text>
          <Text style={styles.smallValue}>Today</Text>
        </View>
        <View style={styles.smallBox}>
          <Text style={styles.smallLabel}>Hours</Text>
          <TextInput
            style={styles.smallInput}
            value={hours}
            onChangeText={setHours}
            placeholder="0.0"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <Text style={styles.label}>Miles (for tax deduction)</Text>
      <TextInput
        style={styles.noteBox}
        value={miles}
        onChangeText={setMiles}
        placeholder="0.0"
        placeholderTextColor={colors.textMuted}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.noteBox}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Evening airport run"
        placeholderTextColor={colors.textMuted}
      />

      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        activeOpacity={0.85}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveText}>Save entry</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontFamily: fonts.display, color: colors.textPrimary, fontSize: 16 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.bgElevated,
    borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row', backgroundColor: colors.bgElevated, borderRadius: 12, padding: 4,
    borderWidth: 0.5, borderColor: colors.border, marginBottom: spacing.lg,
  },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: 'rgba(94,106,210,0.18)' },
  segmentText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13 },
  segmentTextActive: { color: '#9CA5F0', fontFamily: fonts.label },
  label: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, marginBottom: spacing.sm, marginLeft: 2 },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12, marginBottom: spacing.lg },
  platformRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  platformChip: {
    flex: 1, alignItems: 'center', gap: 6, paddingVertical: 10, borderRadius: 12,
    backgroundColor: colors.bgElevated, borderWidth: 0.5, borderColor: colors.border,
  },
  platformChipActive: { backgroundColor: 'rgba(94,106,210,0.14)', borderColor: colors.accent, borderWidth: 1 },
  platformLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11 },
  amountBox: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6, backgroundColor: colors.bgElevated,
    borderRadius: 14, padding: spacing.lg, borderWidth: 0.5, borderColor: colors.border, marginBottom: spacing.lg,
  },
  amountSign: { fontFamily: fonts.numericBold, color: colors.textMuted, fontSize: 22 },
  amountInput: { fontFamily: fonts.numericBold, color: colors.textPrimary, fontSize: 30, flex: 1, padding: 0 },
  row: { flexDirection: 'row', marginBottom: spacing.lg },
  smallBox: {
    flex: 1, backgroundColor: colors.bgElevated, borderRadius: 12, padding: spacing.md,
    borderWidth: 0.5, borderColor: colors.border,
  },
  smallLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  smallValue: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13 },
  smallInput: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13, padding: 0 },
  noteBox: {
    backgroundColor: colors.bgElevated, borderRadius: 12, padding: spacing.md,
    borderWidth: 0.5, borderColor: colors.border, marginBottom: spacing.xl,
    fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13,
  },
  saveBtn: {
    backgroundColor: colors.accent, borderRadius: 14, padding: spacing.md, alignItems: 'center',
  },
  saveText: { fontFamily: fonts.label, color: '#FFFFFF', fontSize: 14 },
});
