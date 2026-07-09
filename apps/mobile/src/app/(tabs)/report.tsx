import { useState } from 'react';
import {
  aggregateExpensesByCategory,
  calcVsLastMonthPct,
  PERIOD_LABELS,
  REPORT_PERIODS,
  summarizeReportTotals,
  vsLastMonthDisplay,
  type VsLastMonthTone,
} from '@budget/common';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { useCategories } from '@/lib/api/use-categories';
import { useDashboard } from '@/lib/api/use-dashboard';
import { useReportExpenses, type ReportPeriod } from '@/lib/api/use-report-expenses';
import { colors } from '@/theme/tokens';

// ラベルは @budget/common の PERIOD_LABELS に共通化（Web PeriodFilter と同一表記 #539）
const PERIODS: { value: ReportPeriod; label: string }[] = REPORT_PERIODS.map((value) => ({
  value,
  label: PERIOD_LABELS[value],
}));

/** 先月比のトーン別カラー（Web レポートのチップ配色と同一マッピング） */
const VS_LAST_COLOR: Record<VsLastMonthTone, string> = {
  saving: colors.income,
  even: colors.foreground,
  increase: '#e11d48',
};

/** レポート画面（Web /report と同一の集計 — ロジックは @budget/common で共有） */
export default function ReportScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('month');
  const { data: expenses, isPending, isError, error, refetch, isRefetching } = useReportExpenses(period);
  const { data: expenseCategories } = useCategories(0);
  const { data: dashboard } = useDashboard();

  const totals = expenses ? summarizeReportTotals(expenses) : null;
  const breakdown =
    expenses && expenseCategories ? aggregateExpensesByCategory(expenses, expenseCategories) : [];
  const vsLastPct =
    period === 'month' && totals
      ? calcVsLastMonthPct(totals.totalExpense, dashboard?.lastMonthExpense ?? null)
      : null;
  const maxAmount = breakdown[0]?.amount ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <Text style={styles.title}>レポート</Text>

        {/* 期間切替 */}
        <View style={styles.segment}>
          {PERIODS.map(({ value, label }) => {
            const selected = period === value;
            return (
              <Pressable
                key={value}
                style={[styles.segmentItem, selected && styles.segmentItemActive]}
                onPress={() => setPeriod(value)}
                accessibilityRole="button"
              >
                <Text style={[styles.segmentLabel, selected && styles.segmentLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isPending && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.brandPrimary} />
          </View>
        )}

        {isError && (
          <View style={styles.center}>
            <Text style={styles.error}>{error.message}</Text>
            <Pressable style={styles.retryButton} onPress={() => refetch()} accessibilityRole="button">
              <Text style={styles.retryLabel}>再試行</Text>
            </Pressable>
          </View>
        )}

        {totals && (
          <>
            {/* 支出合計ヒーロー */}
            <View style={styles.heroCard}>
              <Text style={styles.caption}>支出合計</Text>
              <Text style={styles.hero}>¥{totals.totalExpense.toLocaleString()}</Text>
              {vsLastPct !== null && (
                <Text style={[styles.vsLast, { color: VS_LAST_COLOR[vsLastMonthDisplay(vsLastPct).tone] }]}>
                  {vsLastMonthDisplay(vsLastPct).label}
                </Text>
              )}
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>収入</Text>
                <Text style={[styles.totalsValue, { color: colors.income }]}>
                  ¥{totals.totalIncome.toLocaleString()}
                </Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>収支</Text>
                <Text
                  style={[
                    styles.totalsValue,
                    { color: totals.balance >= 0 ? colors.income : '#f43f5e' },
                  ]}
                >
                  {totals.balance >= 0 ? '+' : ''}¥{totals.balance.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* カテゴリ別支出 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>カテゴリ別支出</Text>
              {breakdown.length === 0 && (
                <Text style={styles.empty}>この期間の支出はありません</Text>
              )}
              {breakdown.map((item) => (
                <View key={item.label} style={styles.breakdownRow}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={styles.breakdownAmount}>¥{item.amount.toLocaleString()}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${maxAmount > 0 ? Math.max(2, Math.round((item.amount / maxAmount) * 100)) : 0}%`,
                          backgroundColor: item.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: 'rgba(28,20,16,0.06)',
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: colors.surface,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    opacity: 0.5,
  },
  segmentLabelActive: {
    opacity: 1,
  },
  center: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  error: {
    fontSize: 13,
    color: '#c62828',
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 10,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  heroCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 16,
    gap: 6,
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
    opacity: 0.5,
  },
  hero: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.brandPrimary,
    fontVariant: ['tabular-nums'],
  },
  vsLast: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  totalsLabel: {
    fontSize: 13,
    color: colors.foreground,
    opacity: 0.6,
  },
  totalsValue: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  empty: {
    fontSize: 13,
    color: colors.foreground,
    opacity: 0.5,
  },
  breakdownRow: {
    gap: 6,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
  breakdownAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(28,20,16,0.06)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
  },
});
