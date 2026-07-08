import { calcSavingsForecast } from '@budget/common';
import { Link } from 'expo-router';
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
import { useAuth } from '@/lib/auth/auth-context';
import { useDashboard, type DashboardData } from '@/lib/api/use-dashboard';

export default function HomeScreen() {
  const { userId, logout } = useAuth();
  const { data, isPending, isError, error, refetch, isRefetching } = useDashboard();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.userId}>{userId}</Text>
          <Pressable onPress={logout} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.logout}>ログアウト</Text>
          </Pressable>
        </View>

        {isPending && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2e7d32" />
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

        {data && <Dashboard data={data} />}
      </ScrollView>

      {/* クイック記録への導線（#496） */}
      <Link href="/entry" asChild>
        <Pressable style={styles.fab} accessibilityRole="button" accessibilityLabel="記録する">
          <Text style={styles.fabLabel}>＋ 記録</Text>
        </Pressable>
      </Link>
    </SafeAreaView>
  );
}

function Dashboard({ data }: { data: DashboardData }) {
  const now = new Date();
  const forecast = calcSavingsForecast({
    monthIncome: data.monthSummary.income,
    monthExpense: data.monthSummary.expense,
    todayExpense: data.todayExpense,
    savingsGoal: data.savingsGoal,
    dayOfMonth: now.getDate(),
    daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  });

  return (
    <View style={styles.dashboard}>
      <Text style={styles.caption}>今日使えるお金</Text>
      {data.dailyBudget ? (
        <>
          <Text style={styles.hero}>¥{data.dailyBudget.remaining.toLocaleString()}</Text>
          <Text style={styles.subInfo}>
            今日の支出 ¥{data.todayExpense.toLocaleString()} / 日予算 ¥
            {data.dailyBudget.amount.toLocaleString()}・給料日まで{data.dailyBudget.daysUntilPayday}日
          </Text>
        </>
      ) : (
        <Text style={styles.emptyBudget}>初回設定を完了すると1日予算が表示されます</Text>
      )}

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
        <Row
          label="今月の収支"
          value={`収入 ¥${data.monthSummary.income.toLocaleString()} / 支出 ¥${data.monthSummary.expense.toLocaleString()}`}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>最近の記録</Text>
        {data.recentExpenses.length === 0 && (
          <Text style={styles.emptyList}>まだ記録がありません</Text>
        )}
        {data.recentExpenses.map((expense) => (
          <View key={expense.id} style={styles.row}>
            <View style={styles.expenseLeft}>
              <Text style={styles.expenseDate}>{expense.date.slice(5).replace('-', '/')}</Text>
              <Text style={styles.expenseContent} numberOfLines={1}>
                {expense.content || '（内容なし）'}
              </Text>
            </View>
            <Text
              style={[
                styles.expenseAmount,
                expense.balanceType === 1 && styles.incomeAmount,
              ]}
            >
              {expense.balanceType === 1 ? '+' : '-'}¥{expense.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </View>
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
    padding: 20,
    // FAB（＋ 記録）と最終カードが重ならないよう下部に余白を確保する
    paddingBottom: 100,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1410',
    opacity: 0.7,
  },
  logout: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c62828',
  },
  center: {
    paddingVertical: 64,
    alignItems: 'center',
    gap: 12,
  },
  error: {
    fontSize: 13,
    color: '#c62828',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryButton: {
    borderRadius: 10,
    backgroundColor: '#2e7d32',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  dashboard: {
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
  subInfo: {
    fontSize: 12,
    color: '#1c1410',
    opacity: 0.55,
  },
  emptyBudget: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1410',
    opacity: 0.6,
    paddingVertical: 12,
  },
  card: {
    marginTop: 8,
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
    alignItems: 'center',
    gap: 12,
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
    flexShrink: 1,
    textAlign: 'right',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  expenseDate: {
    fontSize: 12,
    color: '#1c1410',
    opacity: 0.5,
    fontVariant: ['tabular-nums'],
  },
  expenseContent: {
    fontSize: 13,
    color: '#1c1410',
    flexShrink: 1,
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1410',
    fontVariant: ['tabular-nums'],
  },
  incomeAmount: {
    color: '#2e7d32',
  },
  emptyList: {
    fontSize: 13,
    color: '#1c1410',
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    borderRadius: 999,
    backgroundColor: '#2e7d32',
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
