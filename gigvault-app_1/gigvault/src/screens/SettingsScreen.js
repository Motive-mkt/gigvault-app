import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { exportAllDataCsv } from '../utils/csvExport';
import { getSetting, setSetting, getActivePlatforms } from '../db/database';
import { getStoredLicenseKey } from '../services/whopLicense';

function Row({ icon, label, value, onPress, right }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          <Icon name={icon} size={15} color={colors.accent} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {right ?? (value ? <Text style={styles.rowValue}>{value}</Text> : <Icon name="chevron-right" size={16} color={colors.textMuted} />)}
    </TouchableOpacity>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

// Simple bottom-sheet-style modal for editing a single numeric/text setting.
function EditModal({ visible, title, initialValue, keyboardType, onSave, onClose }) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextInput
            style={styles.modalInput}
            value={String(value)}
            onChangeText={setValue}
            keyboardType={keyboardType || 'default'}
            autoFocus
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={onClose}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => onSave(value)}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [name, setName] = useState('');
  const [platformNames, setPlatformNames] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState(1000);
  const [dailyCap, setDailyCap] = useState(50);
  const [taxRate, setTaxRate] = useState(0.153);
  const [licenseKey, setLicenseKey] = useState(null);
  const [editField, setEditField] = useState(null); // 'name' | 'weeklyGoal' | 'dailyCap' | 'taxRate' | null

  const loadSettings = useCallback(async () => {
    const [userName, platforms, goal, cap, rate, notifPref, license] = await Promise.all([
      getSetting('user_name', ''),
      getActivePlatforms(),
      getSetting('weekly_goal', 1000),
      getSetting('daily_cap', 50),
      getSetting('tax_rate', 0.153),
      getSetting('notifications_enabled', true),
      getStoredLicenseKey(),
    ]);
    setName(userName || '');
    setPlatformNames(platforms.map((p) => p.name).join(', ') || 'None selected');
    setWeeklyGoal(goal ?? 1000);
    setDailyCap(cap ?? 50);
    setTaxRate(rate ?? 0.153);
    setNotifications(notifPref !== false);
    setLicenseKey(license);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggleNotifications = async (val) => {
    setNotifications(val);
    await setSetting('notifications_enabled', val);
  };

  const handleSaveField = async (rawValue) => {
    if (editField === 'name') {
      await setSetting('user_name', rawValue.trim());
      setName(rawValue.trim());
    } else if (editField === 'weeklyGoal') {
      const num = parseFloat(rawValue);
      if (!isNaN(num) && num > 0) {
        await setSetting('weekly_goal', num);
        setWeeklyGoal(num);
      }
    } else if (editField === 'dailyCap') {
      const num = parseFloat(rawValue);
      if (!isNaN(num) && num > 0) {
        await setSetting('daily_cap', num);
        setDailyCap(num);
      }
    } else if (editField === 'taxRate') {
      const num = parseFloat(rawValue);
      if (!isNaN(num) && num >= 0) {
        await setSetting('tax_rate', num / 100);
        setTaxRate(num / 100);
      }
    }
    setEditField(null);
  };

  const fieldConfig = {
    name: { title: 'Your name', value: name, keyboardType: 'default' },
    weeklyGoal: { title: 'Weekly income goal ($)', value: weeklyGoal, keyboardType: 'decimal-pad' },
    dailyCap: { title: 'Daily spend cap ($)', value: dailyCap, keyboardType: 'decimal-pad' },
    taxRate: { title: 'Tax set-aside rate (%)', value: (taxRate * 100).toFixed(1), keyboardType: 'decimal-pad' },
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <Section title="Profile">
        <Row icon="user" label="Name" value={name || 'Not set'} onPress={() => setEditField('name')} />
        <Row icon="truck" label="Platforms" value={platformNames} onPress={() => {}} />
      </Section>

      <Section title="Budget & tax">
        <Row
          icon="target"
          label="Weekly income goal"
          value={`$${weeklyGoal.toFixed(0)}`}
          onPress={() => setEditField('weeklyGoal')}
        />
        <Row
          icon="calendar"
          label="Daily spend cap"
          value={`$${dailyCap.toFixed(0)}`}
          onPress={() => setEditField('dailyCap')}
        />
        <Row
          icon="percent"
          label="Tax set-aside rate"
          value={`${(taxRate * 100).toFixed(1)}%`}
          onPress={() => setEditField('taxRate')}
        />
      </Section>

      <Section title="Preferences">
        <Row
          icon="bell"
          label="Weekly summary notification"
          right={
            <Switch
              value={notifications}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(94,106,210,0.5)' }}
              thumbColor={notifications ? colors.accent : '#8A8F98'}
            />
          }
        />
        <Row icon="lock" label="Privacy — data stays on this device" />
      </Section>

      <Section title="About">
        <Row
          icon="download"
          label="Export all data (CSV)"
          onPress={async () => {
            try {
              await exportAllDataCsv();
            } catch {
              Alert.alert('Export failed', 'Could not create the CSV file. Try again.');
            }
          }}
        />
        <Row icon="key" label="License key" value={licenseKey ? 'Active' : 'Not verified'} />
        <Row
          icon="help-circle"
          label="Support"
          onPress={() => Alert.alert('Support', 'Reach out via your Whop purchase page for help.')}
        />
      </Section>

      <Text style={styles.version}>GigVault v1.0.0</Text>

      <EditModal
        visible={editField !== null}
        title={editField ? fieldConfig[editField].title : ''}
        initialValue={editField ? fieldConfig[editField].value : ''}
        keyboardType={editField ? fieldConfig[editField].keyboardType : 'default'}
        onSave={handleSaveField}
        onClose={() => setEditField(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontFamily: fonts.display, color: colors.textPrimary, fontSize: 16, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, marginBottom: spacing.sm, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.bgElevated, borderRadius: radius.card, borderWidth: 0.5,
    borderColor: colors.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  iconWrap: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(94,106,210,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontFamily: fonts.body, color: colors.textPrimary, fontSize: 13, flexShrink: 1 },
  rowValue: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12, flexShrink: 1, textAlign: 'right', marginLeft: spacing.sm },
  version: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, textAlign: 'center', marginTop: spacing.md },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.bgElevated, borderRadius: radius.card, borderWidth: 0.5,
    borderColor: colors.border, padding: spacing.lg,
  },
  modalTitle: { fontFamily: fonts.label, color: colors.textPrimary, fontSize: 14, marginBottom: spacing.md },
  modalInput: {
    backgroundColor: colors.bgDeep, borderRadius: 12, borderWidth: 0.5, borderColor: colors.border,
    padding: spacing.md, fontFamily: fonts.body, color: colors.textPrimary, fontSize: 15, marginBottom: spacing.lg,
  },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalCancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center',
    backgroundColor: colors.bgDeep, borderWidth: 0.5, borderColor: colors.border,
  },
  modalCancelText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13 },
  modalSaveBtn: { flex: 1, padding: spacing.md, borderRadius: 12, alignItems: 'center', backgroundColor: colors.accent },
  modalSaveText: { fontFamily: fonts.label, color: '#FFFFFF', fontSize: 13 },
});
