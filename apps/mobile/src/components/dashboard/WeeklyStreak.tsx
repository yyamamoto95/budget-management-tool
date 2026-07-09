import {
  countWeeklyAchievement,
  formatYen,
  weeklyStreakStateOf,
  type WeeklyStreakState,
} from '@budget/common';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spendStatusUi } from '@/theme/tokens';

type DayRecord = { date: string; dow: string; expense: number; recorded: boolean };

// 状態判定は @budget/common に共通化（Web WeeklyStreak と単一実装 #539）
type StreakState = WeeklyStreakState;

/** タップで Web のツールチップ相当の詳細（支出/日予算/節約 or 超過額）を表示する */
function showDayDetail(day: DayRecord, state: StreakState, dailyBudget: number | null) {
  if (state === 'future') return;
  const [, m, d] = day.date.split('-');
  const dateLabel = `${parseInt(m, 10)}/${parseInt(d, 10)}（${day.dow}）`;
  if (state === 'unrecorded') {
    Alert.alert(dateLabel, '記録なし');
    return;
  }
  const budget = dailyBudget ?? 0;
  const diff =
    state === 'achieved'
      ? `節約達成 +${formatYen(budget - day.expense)}`
      : `超過 +${formatYen(day.expense - budget)}`;
  Alert.alert(dateLabel, `支出 ${formatYen(day.expense)} / 日予算 ${formatYen(budget)}\n${diff}`);
}

const DOT_COLOR: Record<StreakState, { bg: string; border: string }> = {
  achieved: { bg: colors.income, border: colors.income },
  over: { bg: spendStatusUi.caution.color, border: spendStatusUi.caution.color },
  unrecorded: { bg: 'transparent', border: colors.borderDefault },
  // 未来日は薄く表示（Web と同一の4状態）
  future: { bg: 'transparent', border: 'rgba(28,20,16,0.08)' },
};

type Props = {
  weeklyRecord: DayRecord[];
  dailyBudget: number | null;
  streak: number;
};

/** 週間ストリークカード（直近7日の記録状況 + 連続記録日数） */
export function WeeklyStreak({ weeklyRecord, dailyBudget, streak }: Props) {
  // Web と同一基準（toISOString の UTC 日付）で未来日を判定する
  const todayStr = new Date().toISOString().slice(0, 10);
  const { achieved, recorded } = countWeeklyAchievement(weeklyRecord, dailyBudget);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>今週の記録</Text>
        {streak > 0 ? (
          <Text style={styles.streak}>🔥 {streak}日連続</Text>
        ) : (
          <Text style={styles.achievedCount}>
            {achieved} / {recorded}日 節約達成
          </Text>
        )}
      </View>

      <View style={styles.days}>
        {weeklyRecord.map((day) => {
          const state = weeklyStreakStateOf(day, dailyBudget, todayStr);
          const dot = DOT_COLOR[state];
          return (
            <Pressable
              key={day.date}
              style={styles.day}
              onPress={() => showDayDetail(day, state, dailyBudget)}
              accessibilityRole="button"
            >
              <Text style={styles.dow}>{day.dow}</Text>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: dot.bg, borderColor: dot.border },
                ]}
              />
            </Pressable>
          );
        })}
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
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  streak: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  achievedCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.foreground,
    opacity: 0.42,
    fontVariant: ['tabular-nums'],
  },
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 6,
  },
  dow: {
    fontSize: 11,
    color: colors.foreground,
    opacity: 0.5,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
  },
});
