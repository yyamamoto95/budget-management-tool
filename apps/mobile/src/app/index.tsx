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
import { LivingMarginCard } from '@/components/dashboard/LivingMarginCard';
import { MonthlySummaryCard } from '@/components/dashboard/MonthlySummaryCard';
import { TodayStatusCard } from '@/components/dashboard/TodayStatusCard';
import { WeeklyStreak } from '@/components/dashboard/WeeklyStreak';
import { colors } from '@/theme/tokens';

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
            <ActivityIndicator size="large" color={colors.income} />
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

        {data && <Dashboard data={data} today={new Date()} />}
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

/** today はテスト・VRT で決定論的にレンダリングするための注入口（Web の DailyBudgetHero と同パターン） */
function Dashboard({ data, today }: { data: DashboardData; today?: Date }) {
  return (
    <View style={styles.dashboard}>
      <TodayStatusCard
        dailyBudget={data.dailyBudget}
        todayExpense={data.todayExpense}
        monthSummary={data.monthSummary}
        savingsGoal={data.savingsGoal}
        today={today}
      />
      <LivingMarginCard livingMargin={data.livingMargin} />
      <WeeklyStreak
        weeklyRecord={data.weeklyRecord}
        dailyBudget={data.dailyBudget?.amount ?? null}
        streak={data.streak}
      />
      <MonthlySummaryCard
        monthSummary={data.monthSummary}
        lastMonthExpense={data.lastMonthExpense}
        today={today}
      />

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.foreground,
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
    backgroundColor: colors.income,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  dashboard: {
    gap: 12,
  },
  card: {
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  expenseDate: {
    fontSize: 12,
    color: colors.foreground,
    opacity: 0.5,
    fontVariant: ['tabular-nums'],
  },
  expenseContent: {
    fontSize: 13,
    color: colors.foreground,
    flexShrink: 1,
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  incomeAmount: {
    color: colors.income,
  },
  emptyList: {
    fontSize: 13,
    color: colors.foreground,
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    borderRadius: 999,
    backgroundColor: colors.income,
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
    color: colors.surface,
  },
});
