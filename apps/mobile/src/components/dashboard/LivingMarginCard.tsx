import { calculateLivingMargin, type LivingMarginInputs } from '@budget/common';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

/** 増減トレンドの表示（Web LivingMarginCard と同じ判定） */
function trendOf(result: Extract<ReturnType<typeof calculateLivingMargin>, { status: 'ok' }>) {
  if (result.increasing) {
    return { label: '余力は増加中', color: colors.income };
  }
  const roundedDelta = Math.abs(result.monthlyDeltaMonths).toFixed(1);
  if (roundedDelta === '0.0') {
    return { label: 'ほぼ横ばい', color: colors.foreground };
  }
  return { label: `今のペースでは毎月約${roundedDelta}ヶ月分ずつ減少`, color: colors.foreground };
}

/** 生活余力カード（spec: core-spec.md ①②。Web LivingMarginCard と同一ロジック） */
export function LivingMarginCard({ livingMargin }: { livingMargin: LivingMarginInputs }) {
  const result = calculateLivingMargin(livingMargin);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>生活余力</Text>

      {result.status === 'no-assets' && (
        <Text style={styles.note}>
          総資産を設定すると、今の資産で生活費あと何ヶ月分をまかなえるかが表示されます。
        </Text>
      )}

      {(result.status === 'no-expense-data' || result.status === 'insufficient-data') && (
        <Text style={styles.note}>
          {result.status === 'no-expense-data'
            ? '支出の記録が溜まると表示されます。'
            : '記録が7日分溜まると表示されます。'}
        </Text>
      )}

      {result.status === 'ok' && (
        <>
          <View style={styles.valueRow}>
            <Text style={styles.value}>{result.reserveMonths.toFixed(1)}</Text>
            <Text style={styles.unit}>ヶ月分</Text>
          </View>
          <Text style={[styles.trend, { color: trendOf(result).color }]}>
            {trendOf(result).label}
          </Text>
        </>
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
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.foreground,
    opacity: 0.55,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    opacity: 0.6,
    marginBottom: 5,
  },
  trend: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.85,
  },
});
