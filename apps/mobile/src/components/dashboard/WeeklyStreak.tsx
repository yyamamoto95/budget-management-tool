import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

type DayRecord = { date: string; dow: string; expense: number; recorded: boolean };

type StreakState = 'achieved' | 'over' | 'unrecorded';

/** Web WeeklyStreak と同じ判定: 記録あり×予算内=達成 / 記録あり×超過 / 未記録 */
function stateOf(day: DayRecord, dailyBudget: number | null): StreakState {
  if (!day.recorded) return 'unrecorded';
  if (dailyBudget !== null && day.expense > dailyBudget) return 'over';
  return 'achieved';
}

const DOT_COLOR: Record<StreakState, { bg: string; border: string }> = {
  achieved: { bg: colors.income, border: colors.income },
  over: { bg: '#e879a3', border: '#e879a3' },
  unrecorded: { bg: 'transparent', border: colors.borderDefault },
};

type Props = {
  weeklyRecord: DayRecord[];
  dailyBudget: number | null;
  streak: number;
};

/** 週間ストリークカード（直近7日の記録状況 + 連続記録日数） */
export function WeeklyStreak({ weeklyRecord, dailyBudget, streak }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>今週の記録</Text>
        {streak > 0 && <Text style={styles.streak}>🔥 {streak}日連続</Text>}
      </View>

      <View style={styles.days}>
        {weeklyRecord.map((day) => {
          const dot = DOT_COLOR[stateOf(day, dailyBudget)];
          return (
            <View key={day.date} style={styles.day}>
              <Text style={styles.dow}>{day.dow}</Text>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: dot.bg, borderColor: dot.border },
                ]}
              />
            </View>
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
