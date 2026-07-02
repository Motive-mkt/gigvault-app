import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import GaugeArc from '../components/GaugeArc';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { exportRangeCsv } from '../utils/csvExport';
import { startOfYear, endOfYear } from '../utils/dateRanges';
import { getSetting, getEntriesBetween, getMileageTotal } from '../db/database';

// IRS standard mileage rate for business use, tax year 2026 (Notice 2026-10,
// published Dec 29, 2025). Update this each January when the IRS announces
// the new rate — https://www.irs.gov/tax-professionals/standard-mileage-rates
const IRS_MILEAGE_RATE_2026 = 0.725;

// Federal estimated tax due dates are fixed by the IRS each year, shifting
// only for weekends/holidays. These are the standard 2026 dates.
const QUARTER_DUE_DATES = [
  { label: 'Q1', due: 'Apr 15' },
  { label: 'Q2', due: 'Jun 15' },
  { label: 'Q3', due: 'Sep 15' },
  { label: 'Q4', due: 'Jan 15' },
];

export default function TaxScreen() {
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [ytdIncome, setYtdIncome] = useState(0);
  const [taxRate, setTaxRate] = useState(0.153);
  const [mileageYtd, setMileageYtd] = useState(0);
  const [quarterAmounts, setQuarterAmounts] = useState([0, 0, 0, 0]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const [rate, entries, miles] = await Promise.all([
      getSetting('tax_rate', 0.153),
      getEntriesBetween(yearStart.toISOString(), yearEnd.toISOString()),
      getMileageTotal(yearStart.toISOString(), yearEnd.toISOString()),
    ]);

    const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    setYtdIncome(income);
    setTaxRate(rate ?? 0.153);
    setMileageYtd(miles || 0);

    // Split income into calendar quarters for the quarterly estimate breakdown.
    const quarterTotals = [0, 0, 0, 0];
    entries
      .filter((e) => e.type === 'income')
      .forEach((e) => {
        const month = new Date(e.created_at).getMonth();
        const q = Math.floor(month / 3);
        quarterTotals[q] += e.amount;
      });
    setQuarterAmounts(quarterTotals.map((t) => t * (rate ?? 0.153)));

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const year = new Date();
      await exportRangeCsv(
        startOfYear(year).toISOString(),
        endOfYear(year).toISOString(),
        `${year.getFullYear()}-annual`
      );
    } catch (err) {
      Alert.alert('Export failed', 'Could not create the CSV file. Try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.loadingText}>Loading tax data…</Text>
      </View>
    );
  }

  const setAside = ytdIncome * taxRate;
  const mileageDeduction = mileageYtd * IRS_MILEAGE_RATE_2026;
  const currentQuarter = Math.floor(new Date().getMonth() / 3);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Tax</Text>

      <View style={styles.card}>
        <GaugeArc
          value={setAside}
          max={Math.max(setAside, 1)}
          color={colors.warning}
          centerLabel={`$${setAside.toFixed(2)}`}
          subLabel="est. YTD set-aside"
        />
        <Text style={styles.rateNote}>
          Based on {(taxRate * 100).toFixed(1)}% of ${ytdIncome.toFixed(2)} YTD income
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quarterly estimated payments</Text>
        <View style={{ gap: 10 }}>
          {QUARTER_DUE_DATES.map((q, i) => {
            const isPast = i < currentQuarter;
            return (
              <View key={q.label} style={styles.quarterRow}>
                <View style={styles.quarterLeft}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isPast ? colors.success : colors.textMuted },
                    ]}
                  />
                  <View>
                    <Text style={styles.quarterLabel}>{q.label}</Text>
                    <Text style={styles.quarterDue}>Due {q.due}</Text>
                  </View>
                </View>
                <Text style={[styles.quarterAmount, { color: isPast ? colors.success : colors.textPrimary }]}>
                  ${quarterAmounts[i].toFixed(2)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.statBox}>
          <Icon name="map-pin" size={16} color={colors.accent} />
          <Text style={styles.statLabel}>Miles YTD</Text>
          <Text style={styles.statValue}>{mileageYtd.toLocaleString()}</Text>
        </View>
        <View style={{ width: spacing.md }} />
        <View style={styles.statBox}>
          <Icon name="file-minus" size={16} color={colors.success} />
          <Text style={styles.statLabel}>Deduction</Text>
          <Text style={styles.statValue}>${mileageDeduction.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.exportBtn}
        activeOpacity={0.85}
        onPress={handleExport}
        disabled={exporting}
      >
        <Icon name="download" size={16} color={colors.textPrimary} />
        <Text style={styles.exportText}>
          {exporting ? 'Preparing export…' : 'Export tax summary (CSV)'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Estimates only, using the 2026 IRS standard mileage rate of {(IRS_MILEAGE_RATE_2026 * 100).toFixed(1)}¢/mile.
        Verify your actual tax bracket and filing requirements with a tax professional before filing.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { fontFamily: fonts.display, color: colors.textPrimary, fontSize: 16, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.bgElevated, borderRadius: radius.card, borderWidth: 0.5,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, alignItems: 'center',
  },
  rateNote: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, marginTop: spacing.sm, textAlign: 'center' },
  cardTitle: { fontFamily: fonts.label, color: colors.textPrimary, fontSize: 13, marginBottom: spacing.md, alignSelf: 'flex-start' },
  quarterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  quarterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  quarterLabel: { fontFamily: fonts.label, color: colors.textPrimary, fontSize: 13 },
  quarterDue: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, marginTop: 1 },
  quarterAmount: { fontFamily: fonts.numeric, fontSize: 13 },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  statBox: {
    flex: 1, backgroundColor: colors.bgElevated, borderRadius: 14, padding: spacing.md,
    borderWidth: 0.5, borderColor: colors.border, gap: 4,
  },
  statLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11 },
  statValue: { fontFamily: fonts.numericBold, color: colors.textPrimary, fontSize: 15 },
  exportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.bgElevated, borderRadius: 14, padding: spacing.md,
    borderWidth: 0.5, borderColor: colors.border, marginBottom: spacing.lg,
  },
  exportText: { fontFamily: fonts.label, color: colors.textPrimary, fontSize: 13 },
  disclaimer: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
