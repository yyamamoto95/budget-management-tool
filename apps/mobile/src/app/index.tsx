import { calcSavingsForecast } from '@budget/common';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase 1 のサンプルデータ。Phase 2 で @budget/api-client 経由の実データに置き換える
const SAMPLE = {
  monthIncome: 300000,
  monthExpense: 120000,
  todayExpense: 1800,
  savingsGoal: 50000,
};

export default function HomeScreen() {
  const now = new Date();
  const forecast = calcSavingsForecast({
    ...SAMPLE,
    dayOfMonth: now.getDate(),
    daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.caption}>今日使えるお金（サンプル）</Text>
        <Text style={styles.hero}>¥{forecast.dailyRemainingBudget.toLocaleString()}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>今月の貯蓄予測</Text>
          <Row label="月末の予測残高" value={`¥${forecast.projectedSavings.toLocaleString()}`} />
          <Row
            label="目標達成率"
            value={
              forecast.achievementRate === null
                ? '目標未設定'
                : `${Math.round(forecast.achievementRate * 100)}%`
            }
          />
          <Row label="残り日数" value={`${forecast.remainingDays}日`} />
        </View>

        <Text style={styles.note}>
          共有ロジック（@budget/common の calcSavingsForecast）で算出しています。API 接続は Phase
          2 で実装します。
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#faf6f2',
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  caption: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1410',
    opacity: 0.5,
  },
  hero: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2e7d32',
  },
  card: {
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(28,20,16,0.08)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1410',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    fontSize: 13,
    color: '#1c1410',
    opacity: 0.6,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1410',
    fontVariant: ['tabular-nums'],
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: '#1c1410',
    opacity: 0.45,
  },
});
