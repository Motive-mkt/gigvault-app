import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import GaugeArc from '../components/GaugeArc';
import MiniGauge from '../components/MiniGauge';
import NightRoute from '../components/NightRoute';
import { colors, fonts, radius, spacing } from '../theme/theme';
import { getSetting, getEntriesBetween, getPlatformBreakdown } from '../db/database';
import { startOfWeek, endOfWeek, bucketByDay } from '../utils/dateRanges';

// This screen refreshes on mount and via pull-to-refresh. If you later add
// React Navigation with tab screens, swap the useEffect below for
// useFocusEffect so the dashboard refreshes whenever the user returns to it
// after logging an entry from another tab.

const FALLBACK_PLATFORM_COLORS = [colors.accent, colors.success, colors.warning, colors.danger];

export default function DashboardScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState('');
  const [weekTotal, setWeekTotal] = useState(0);
  const [weekGoal, setWeekGoal] = useState(1000);
  const [taxSetAside, setTaxSetAside] = useState(0);
  const [taxTarget, setTaxTarget] = useState(1);
  const [dailySpend, setDailySpend] = useState(0);
  const [dailyCap, setDailyCap] = useState(50);
  const [weekValues, setWeekValues] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [platforms, setPlatforms] = useState([]);
  const [tripLog, setTripLog] = useState([]);

  const loadData = useCallback(async () => {
    const weekStart = startOfWeek();
    const weekEnd = endOfWeek();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      userName,
      goal,
      cap,
      taxRate,
      weekEntries,
      todayEntries,
      breakdown,
    ] = await Promise.all([
      getSetting('user_name', ''),
      getSetting('weekly_goal', 1000),
      getSetting('daily_cap', 50),
      getSetting('tax_rate', 0.153),
      getEntriesBetween(weekStart.toISOString(), weekEnd.toISOString()),
      getEntriesBetween(todayStart.toISOString(), todayEnd.toISOString()),
      getPlatformBreakdown(weekStart.toISOString(), weekEnd.toISOString()),
    ]);

    const income = weekEntries.filter((e) => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const todaySpend = todayEntries.filter((e) => e.type === 'expense').reduce((s, e) => s + e.amount, 0);

    // Build platform mix from this week's income entries.
    const incomeByPlatform = {};
    breakdown
      .filter((r) => r.type === 'income')
      .forEach((r) => {
        incomeByPlatform[r.name || 'Other'] = (incomeByPlatform[r.name || 'Other'] || 0) + r.total;
      });
    const totalIncome = Object.values(incomeByPlatform).reduce((s, v) => s + v, 0) || 1;
    const platformList = Object.entries(incomeByPlatform).map(([pname, amount], i) => ({
      name: pname,
      amount,
      pct: Math.round((amount / totalIncome) * 100),
      color: FALLBACK_PLATFORM_COLORS[i % FALLBACK_PLATFORM_COLORS.length],
    }));

    setName(userName || '');
    setWeekTotal(income);
    setWeekGoal(goal || 1000);
    setTaxSetAside(income * (taxRate || 0.153));
    setTaxTarget((goal || 1000) * (taxRate || 0.153));
    setDailySpend(todaySpend);
    setDailyCap(cap || 50);
    setWeekValues(bucketByDay(weekEntries, weekStart));
    setPlatforms(platformList);
    setTripLog(
      weekEntries.slice(0, 5).map((e) => ({
        label: `${e.platform_name || e.type} · ${new Date(e.created_at).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        })}`,
        amount: e.amount,
        sign: e.type === 'income' ? 1 : -1,
        color: e.type === 'income' ? colors.success : colors.danger,
      }))
    );
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <Text style={styles.loadingText}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greetingForTime()}{name ? `, ${name}` : ''}</Text>
          <View style={styles.onlineRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>ONLINE</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <GaugeArc
          value={weekTotal}
          max={weekGoal}
          color={colors.accent}
          centerLabel={`$${weekTotal.toFixed(2)}`}
          subLabel={`of $${weekGoal.toFixed(0)} goal · ${Math.min(
            100,
            Math.round((weekTotal / (weekGoal || 1)) * 100)
          )}%`}
        />
      </View>

      <View style={styles.row}>
        <MiniGauge
          value={taxSetAside}
          max={taxTarget || 1}
          color={colors.warning}
          label={{ value: `$${taxSetAside.toFixed(2)}`, caption: 'Tax set-aside' }}
        />
        <View style={{ width: spacing.md }} />
        <MiniGauge
          value={dailySpend}
          max={dailyCap}
          color={colors.accent}
          label={{ value: `$${dailySpend.toFixed(0)}/$${dailyCap.toFixed(0)}`, caption: 'Daily cap' }}
        />
      </View>

      <View style={styles.card}>
        <NightRoute values={weekValues} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Platform mix</Text>
        {platforms.length === 0 ? (
          <Text style={styles.emptyText}>Log your first entry to see your platform mix.</Text>
        ) : (
          <>
            <View style={styles.mixBar}>
              {platforms.map((p) => (
                <View key={p.name} style={{ flex: p.pct || 1, backgroundColor: p.color }} />
              ))}
            </View>
            <View style={styles.mixLegendRow}>
              {platforms.map((p) => (
                <View key={p.name} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: p.color }]} />
                  <Text style={styles.legendText}>{p.name}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Trip log</Text>
        {tripLog.length === 0 ? (
          <Text style={styles.emptyText}>No entries yet this week.</Text>
        ) : (
          <View style={styles.logList}>
            {tripLog.map((t, i) => (
              <View key={i} style={styles.logRow}>
                <View style={[styles.logDot, { backgroundColor: t.color }]} />
                <Text style={styles.logLabel}>{t.label}</Text>
                <Text style={[styles.logAmount, { color: t.sign > 0 ? colors.success : colors.danger }]}>
                  {t.sign > 0 ? '+' : '-'}${t.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function greetingForTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgDeep },
  centered: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 13 },
  content: { padding: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  greeting: { fontFamily: fonts.display, color: colors.textPrimary, fontSize: 16 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  onlineText: { fontFamily: fonts.label, color: colors.success, fontSize: 11, letterSpacing: 0.5 },
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.card,
    borderWidth: 0.5,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: { fontFamily: fonts.label, color: colors.textPrimary, fontSize: 13, marginBottom: spacing.sm },
  emptyText: { fontFamily: fonts.body, color: colors.textMuted, fontSize: 12 },
  row: { flexDirection: 'row', marginBottom: spacing.md },
  mixBar: { flexDirection: 'row', height: 7, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm },
  mixLegendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontFamily: fonts.body, color: colors.textSecondary, fontSize: 11 },
  logList: { gap: 13 },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logDot: { width: 6, height: 6, borderRadius: 3 },
  logLabel: { flex: 1, fontFamily: fonts.body, color: colors.textSecondary, fontSize: 12 },
  logAmount: { fontFamily: fonts.numeric, fontSize: 12 },
});
