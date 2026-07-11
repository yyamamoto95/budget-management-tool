import {
  calcSavingsForecast,
  formatYen,
  savingsForecastBadgeLabel,
} from '@budget/common';
import { StyleSheet, Text, View } from 'react-native';
import { colors, savingsForecastUi } from '@/theme/tokens';

type Props = {
  monthSummary: { expense: number; income: number };
  todayExpense: number;
  /** 月間貯蓄目標（円）。未設定は 0 */
  savingsGoal: number;
  /** 基準日。テストで決定論的にレンダリングするための注入口（既定: 現在日時） */
  today?: Date;
};

/**
 * 今月の貯蓄予測カード（Web SavingsForecastCard と同一ロジック・同一文言 #575）
 * 計算は common の calcSavingsForecast、バッジ文言は savingsForecastBadgeLabel が SSOT。
 */
export function SavingsForecastCard({ monthSummary, todayExpense, savingsGoal, today }: Props) {
  const now = today ?? new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const forecast = calcSavingsForecast({
    monthIncome: monthSummary.income,
    monthExpense: monthSummary.expense,
    todayExpense,
    savingsGoal,
    dayOfMonth,
    daysInMonth,
  });
  const ui = savingsForecastUi[forecast.state];
  const label = savingsForecastBadgeLabel(forecast, savingsGoal);

  const income = Math.max(1, monthSummary.income);
  const actualPct = Math.min(99, (monthSummary.expense / income) * 100);
  const projectedPct = Math.min(
    100 - actualPct,
    Math.max(0, (forecast.projectedMonthEndExpense / income) * 100 - actualPct)
  );
  const targetLinePct = Math.min(99, ((income - savingsGoal) / income) * 100);

  const stats = [
    {
      label: '残り予算',
      value: formatYen(forecast.remainingBudget),
      color: forecast.remainingBudget >= 0 ? colors.foreground : savingsForecastUi.danger.color,
    },
    { label: '残り日数', value: `あと${forecast.remainingDays}日`, color: colors.foreground },
    {
      label: '1日の目安',
      value: formatYen(Math.max(0, forecast.dailyRemainingBudget)),
      color:
        forecast.dailyRemainingBudget >= 0 ? colors.foreground : savingsForecastUi.danger.color,
    },
  ];

  return (
    <View style={styles.card} testID="savings-forecast-card">
      <View style={styles.headerRow}>
        <Text style={styles.title}>今月の貯蓄予測</Text>
        <View style={[styles.badge, { backgroundColor: ui.badgeBg }]}>
          <Text style={[styles.badgeLabel, { color: ui.color }]}>{label}</Text>
        </View>
      </View>

      <Text style={styles.subLabel}>月末予測残高</Text>
      <View style={styles.heroRow}>
        <Text
          style={[
            styles.heroValue,
            {
              color:
                forecast.projectedSavings >= 0 ? colors.income : savingsForecastUi.danger.color,
            },
          ]}
        >
          {forecast.projectedSavings >= 0 ? '+' : '−'}
          {formatYen(Math.abs(forecast.projectedSavings))}
        </Text>
        <Text style={styles.heroNote}>
          {forecast.projectedSavings >= 0 ? '貯まる見込み' : '不足見込み'}
        </Text>
      </View>

      <View style={styles.barLabelRow}>
        <Text style={styles.barLabel}>{formatYen(monthSummary.expense)} 使用</Text>
        <Text style={styles.barLabel}>目標貯蓄 {formatYen(savingsGoal)}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barActual, { width: `${actualPct}%`, backgroundColor: ui.bar }]} />
        <View
          style={[
            styles.barProjected,
            { left: `${actualPct}%`, width: `${projectedPct}%`, backgroundColor: ui.barLight },
          ]}
        />
        {savingsGoal > 0 && <View style={[styles.targetLine, { left: `${targetLinePct}%` }]} />}
      </View>
      <Text style={styles.elapsed}>
        {dayOfMonth}日経過 / {daysInMonth}日
      </Text>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  badge: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexShrink: 1,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.foreground,
    opacity: 0.42,
    marginBottom: 2,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 12,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  heroNote: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.foreground,
    opacity: 0.42,
    marginBottom: 4,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 10,
    color: colors.foreground,
    opacity: 0.42,
  },
  barTrack: {
    height: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(28,20,16,0.06)',
    overflow: 'hidden',
  },
  barActual: {
    position: 'absolute',
    height: '100%',
    borderTopLeftRadius: 9999,
    borderBottomLeftRadius: 9999,
  },
  barProjected: {
    position: 'absolute',
    height: '100%',
  },
  targetLine: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 2,
    backgroundColor: 'rgba(28,20,16,0.28)',
  },
  elapsed: {
    marginTop: 4,
    textAlign: 'right',
    fontSize: 10,
    color: colors.foreground,
    opacity: 0.42,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.foreground,
    opacity: 0.42,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
