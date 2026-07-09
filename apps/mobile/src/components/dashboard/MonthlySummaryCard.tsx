import { calcMonthPace, calcSavingsRate, formatYen } from '@budget/common';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

type Props = {
  monthSummary: { expense: number; income: number };
  lastMonthExpense: number;
  /** テストで決定論的にレンダリングするための注入口（既定: 現在日時） */
  today?: Date;
};

/** 月間サマリーカード（収入・支出 + 先月比。Web MonthlySummaryCard と同じ日割り比較） */
export function MonthlySummaryCard({ monthSummary, lastMonthExpense, today }: Props) {
  const now = today ?? new Date();
  // 計算式は @budget/common に共通化（Web MonthlySummaryCard と単一実装 #539）
  const pace = calcMonthPace(monthSummary.expense, now.getDate(), lastMonthExpense);
  const momPct = pace?.momPct ?? null;
  const savingsRate = calcSavingsRate(monthSummary.income, monthSummary.expense);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>今月の収支</Text>

      <View style={styles.rows}>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <ArrowUpRight size={14} color={colors.income} />
            <Text style={styles.label}>収入</Text>
          </View>
          <Text style={[styles.value, { color: colors.income }]}>
            {formatYen(monthSummary.income)}
          </Text>
        </View>
        <View style={styles.row}>
          <View style={styles.labelRow}>
            <ArrowDownRight size={14} color={colors.brandPrimary} />
            <Text style={styles.label}>支出</Text>
          </View>
          <Text style={[styles.value, { color: colors.brandPrimary }]}>
            {formatYen(monthSummary.expense)}
          </Text>
        </View>
      </View>

      {momPct !== null && (
        <Text style={styles.mom}>
          先月比（日割り平均） {momPct === 0 ? '±0' : momPct > 0 ? `+${momPct}` : momPct}%
        </Text>
      )}

      {/* 貯蓄率（Web と同一の計算・表現 #539） */}
      {savingsRate > 0 && (
        <Text style={styles.savingsRate}>収入の{savingsRate}%を貯蓄ペース</Text>
      )}
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
    gap: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: colors.foreground,
    opacity: 0.6,
  },
  value: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  savingsRate: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.income,
  },
  mom: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.foreground,
    opacity: 0.5,
  },
});
