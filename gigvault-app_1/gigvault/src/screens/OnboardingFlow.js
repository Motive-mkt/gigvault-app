import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { setSetting, seedPlatforms, markOnboardingComplete } from '../db/database';

const PLATFORM_OPTIONS = [
  { id: 'uber', name: 'Uber', icon: 'truck', color: colors.accent },
  { id: 'doordash', name: 'DoorDash', icon: 'package', color: colors.success },
  { id: 'instacart', name: 'Instacart', icon: 'shopping-cart', color: colors.warning },
  { id: 'lyft', name: 'Lyft', icon: 'navigation', color: '#FF6FA5' },
  { id: 'sparkdriver', name: 'Spark Driver', icon: 'zap', color: '#60C2E8' },
  { id: 'other', name: 'Other', icon: 'more-horizontal', color: colors.textMuted },
];

const STEPS = ['Name', 'Platforms', 'Tax rate', 'Budget'];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [taxRate, setTaxRate] = useState('15.3');
  const [weeklyGoal, setWeeklyGoal] = useState('1000');
  const [dailyCap, setDailyCap] = useState('50');

  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const canAdvance = () => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return selectedPlatforms.length > 0;
    if (step === 2) return taxRate.trim().length > 0 && !isNaN(parseFloat(taxRate));
    if (step === 3) return weeklyGoal.trim().length > 0 && dailyCap.trim().length > 0;
    return false;
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    // Final step — persist everything and finish.
    await setSetting('user_name', name.trim());
    await setSetting('tax_rate', parseFloat(taxRate) / 100);
    await setSetting('weekly_goal', parseFloat(weeklyGoal));
    await setSetting('daily_cap', parseFloat(dailyCap));

    const chosen = PLATFORM_OPTIONS.filter((p) => selectedPlatforms.includes(p.id));
    await seedPlatforms(chosen);
    await markOnboardingComplete();

    onComplete();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.progressRow}>
        {STEPS.map((label, i) => (
          <View key={label} style={styles.progressItem}>
            <View
              style={[
                styles.progressDot,
                i <= step && styles.progressDotActive,
              ]}
            />
            <Text style={[styles.progressLabel, i === step && styles.progressLabelActive]}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {step === 0 && (
          <View>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.subtitle}>This shows up on your dashboard.</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={styles.title}>Which platforms do you drive for?</Text>
            <Text style={styles.subtitle}>Select all that apply — you can change this later.</Text>
            <View style={styles.platformGrid}>
              {PLATFORM_OPTIONS.map((p) => {
                const isActive = selectedPlatforms.includes(p.id);
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.platformCard, isActive && styles.platformCardActive]}
                    onPress={() => togglePlatform(p.id)}
                    activeOpacity={0.8}
                  >
                    <Icon name={p.icon} size={20} color={isActive ? '#9CA5F0' : colors.textMuted} />
                    <Text style={[styles.platformName, isActive && { color: '#9CA5F0' }]}>
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Text style={styles.title}>What&apos;s your estimated tax rate?</Text>
            <Text style={styles.subtitle}>
              15.3% covers federal self-employment tax as a starting point — adjust if you know
              your actual bracket. You can change this anytime in Settings.
            </Text>
            <View style={styles.percentBox}>
              <TextInput
                style={styles.percentInput}
                value={taxRate}
                onChangeText={setTaxRate}
                keyboardType="decimal-pad"
              />
              <Text style={styles.percentSign}>%</Text>
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <Text style={styles.title}>Set your budget targets</Text>
            <Text style={styles.subtitle}>These power your dashboard gauges — easy to adjust later.</Text>

            <Text style={styles.fieldLabel}>Weekly income goal</Text>
            <View style={styles.amountBox}>
              <Text style={styles.amountSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={weeklyGoal}
                onChangeText={setWeeklyGoal}
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.fieldLabel}>Daily spend cap</Text>
            <View style={styles.amountBox}>
              <Text style={styles.amountSign}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={dailyCap}
                onChangeText={setDailyCap}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Icon name="arrow-left" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canAdvance() && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canAdvance()}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>
            {step === STEPS.length - 1 ? 'Finish setup' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  progressRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl, paddingBottom: spacing.lg,
  },
  progressItem: { alignItems: 'center', gap: 6, flex: 1 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.12)' },
  progressDotActive: { backgroundColor: colors.accent },
  progressLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 10 },
  progressLabelActive: { color: '#9CA5F0', fontFamily: fonts.label },
  body: { flex: 1 },
  bodyContent: { padding: spacing.xl },
  title: { fontFamily: fonts.display, color: colors.textPrimary, fontSize: 20, marginBottom: spacing.sm },
  subtitle: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13, lineHeight: 19, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.bgElevated, borderRadius: radius.card, borderWidth: 0.5,
    borderColor: colors.border, padding: spacing.lg, fontFamily: fonts.body,
    color: colors.textPrimary, fontSize: 16,
  },
  platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  platformCard: {
    width: '47%', alignItems: 'center', gap: 8, paddingVertical: 18, borderRadius: 14,
    backgroundColor: colors.bgElevated, borderWidth: 0.5, borderColor: colors.border,
  },
  platformCardActive: { backgroundColor: 'rgba(94,106,210,0.14)', borderColor: colors.accent, borderWidth: 1 },
  platformName: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12 },
  percentBox: {
    flexDirection: 'row', alignItems: 'baseline', backgroundColor: colors.bgElevated,
    borderRadius: radius.card, borderWidth: 0.5, borderColor: colors.border, padding: spacing.lg,
  },
  percentInput: { fontFamily: fonts.numericBold, color: colors.textPrimary, fontSize: 30, flex: 1, padding: 0 },
  percentSign: { fontFamily: fonts.numericBold, color: colors.textMuted, fontSize: 22 },
  fieldLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, marginBottom: spacing.sm, marginLeft: 2 },
  amountBox: {
    flexDirection: 'row', alignItems: 'baseline', gap: 6, backgroundColor: colors.bgElevated,
    borderRadius: 14, padding: spacing.md, borderWidth: 0.5, borderColor: colors.border, marginBottom: spacing.lg,
  },
  amountSign: { fontFamily: fonts.numericBold, color: colors.textMuted, fontSize: 18 },
  amountInput: { fontFamily: fonts.numericBold, color: colors.textPrimary, fontSize: 22, flex: 1, padding: 0 },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.lg,
    borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 46, height: 46, borderRadius: 14, backgroundColor: colors.bgElevated,
    borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: { flex: 1, backgroundColor: colors.accent, borderRadius: 14, padding: spacing.md, alignItems: 'center' },
  nextBtnDisabled: { opacity: 0.4 },
  nextText: { fontFamily: fonts.label, color: '#FFFFFF', fontSize: 14 },
});
