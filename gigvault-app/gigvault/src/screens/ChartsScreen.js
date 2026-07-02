import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { getEntriesBetween } from '../db/database';
import { rangeForPeriod, bucketByDay, startOfWeek } from '../utils/dateRanges';

const PERIODS = ['W', 'M', 'Y'];
const FALLBACK_COLORS = [colors.accent, colors.success, colors.warning, colors.danger];

function WeekBars({ values }) {
  const max = Math.max(...values, 1);
  const peakIndex = values.indexOf(Math.max(...values));
  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View style={styles.barsRow}>
      {values.map((v, i) => {
        const heightPct = (v / max) * 100;
        const isPeak = i === peakIndex && v > 0;
        return (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  { height: `${heightPct}%`, backgroundColor: isPeak ? colors.accent : '#26283a' },
                  isPeak && styles.barFillGlow,
                ]}
              />
            </View>
            <Text style={[styles.barLabel, isPeak && styles.barLabelActive]}>{dayLetters[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

export default function ChartsScreen() {
  const [period, setPeriod] = useState('W');
  const [loading, setLoading] = useState(true);
  const [net, setNet] = useState(0);
  const [weekValues, setWeekValues] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [bestDay, setBestDay] = useState({ label: '—', amount: 0 });
  const [avgPerHour, setAvgPerHour] = useState(0);
  const [breakdown, setBreakdown] = useState([]);

  const periodWord = period === 'W' ? 'week' : period === 'M' ? 'month' : 'year';

  const loadData = useCallback(async () => {
    setLoading(true);
    const { start, end } = rangeForPeriod(period);
    const entries = await getEntriesBetween(start.toISOString(), end.toISOString());

    const income = entries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    setNet(income - expense);

    // Weekly bar chart always shows the current week regardless of period toggle,
    // since day-level granularity doesn't make sense zoomed out to a year.
    const weekStart = startOfWeek();
    const thisWeekEntries = period === 'W' ? entries : await getEntriesBetween(
      weekStart.toISOString(),
      new Date().toISOString()
    );
    const buckets = bucketByDay(thisWeekEntries, weekStart);
    setWeekValues(buckets);

    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const peakIdx = buckets.indexOf(Math.max(...buckets));
    setBestDay({ label: dayLabels[peakIdx] ?? '—', amount: buckets[peakIdx] ?? 0 });

    const totalHours = entries.reduce((s, e) => s + (e.hours || 0), 0);
    setAvgPerHour(totalHours > 0 ? income / totalHours : 0);

    // Platform + expense breakdown
    const byPlatform = {};
    entries.forEach((e) => {
      const key = e.type === 'expense' ? 'Gas and expenses' : e.platform_name || 'Other';
      const signed = e.type === 'expense' ? -e.amount : e.amount;
      byPlatform[key] = (byPlatform[key] || 0) + signed;
    });
    const maxAbs = Math.max(...Object.values(byPlatform).map((v) => Math.abs(v)), 1);
    const breakdownList = Object.entries(byPlatform).map(([bname, amount], i) => ({
      name: bname,
      amount,
      pct: Math.round((Math.abs(amount) / maxAbs) * 100),
      color: bname === 'Gas and expenses' ? colors.danger : FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    }));
    setBreakdown(breakdownList);

    setLoading(false);
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.loadingText}>Loading charts…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Charts</Text>
        <View style={styles.periodToggle}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.subLabel}>Net this {periodWord}</Text>
        <Text style={styles.netAmount}>${net.toFixed(2)}</Text>
        <WeekBars values={weekValues} />
      </View>

      <View style={styles.row}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Best day</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {bestDay.label} · ${bestDay.amount.toFixed(0)}
          </Text>
        </View>
        <View style={{ width: spacing.md }} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Avg / hr</Text>
          <Text style={styles.statValue}>${avgPerHour.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Income vs expenses by platform</Text>
        {breakdown.length === 0 ? (
          <Text style={styles.emptyText}>No entries logged for this period yet.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {breakdown.map((b) => (
              <View key={b.name}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownName}>{b.name}</Text>
                  <Text style={[styles.breakdownAmount, b.amount < 0 && { color: colors.danger }]}>
                    {b.amount < 0 ? '-' : ''}${Math.abs(b.amount).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.breakdownTrack}>
                  <View style={[styles.breakdownFill, { width: `${b.pct}%`, backgroundColor: b.color }]} />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  title: { fontFamily: fonts.display, color: colors.textPrimary, fontSize: 16 },
  periodToggle: {
    flexDirection: 'row', backgroundColor: colors.bgElevated, borderRadius: 10, padding: 3,
    borderWidth: 0.5, borderColor: colors.border,
  },
  periodBtn: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 7 },
  periodBtnActive: { backgroundColor: 'rgba(94,106,210,0.18)' },
  periodText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11 },
  periodTextActive: { color: '#9CA5F0', fontFamily: fonts.label },
  card: {
    backgroundColor: colors.bgElevated, borderRadius: radius.card, borderWidth: 0.5,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md,
  },
  cardTitle: { fontFamily: fonts.label, color: colors.textPrimary, fontSize: 13, marginBottom: spacing.md },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12 },
  subLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12 },
  netAmount: { fontFamily: fonts.numericBold, color: colors.textPrimary, fontSize: 26, marginVertical: 4, marginBottom: spacing.md },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 8, paddingHorizontal: 2 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 6 },
  barTrack: { width: '100%', height: 68, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 5, minHeight: 4 },
  barFillGlow: { shadowColor: colors.accent, shadowOpacity: 0.5, shadowRadius: 6 },
  barLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 10 },
  barLabelActive: { color: '#9CA5F0', fontFamily: fonts.label },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  statBox: {
    flex: 1, backgroundColor: colors.bgElevated, borderRadius: 14, padding: spacing.md,
    borderWidth: 0.5, borderColor: colors.border,
  },
  statLabel: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 11, marginBottom: 4 },
  statValue: { fontFamily: fonts.numericBold, color: colors.textPrimary, fontSize: 15 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  breakdownName: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 12 },
  breakdownAmount: { fontFamily: fonts.numeric, color: colors.textPrimary, fontSize: 12 },
  breakdownTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)' },
  breakdownFill: { height: '100%', borderRadius: 3 },
});
