import {
  budgetTone,
  buildSavingsInsight,
  calcSavingsForecast,
  spendStatusOf,
  SPEND_STATUS_LABEL,
  type SavingsInsightKind,
} from '@budget/common';
import {
  AlertCircle,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { colors, insightUi, spendStatusUi, statusTone } from '@/theme/tokens';

/** インサイト種別 → アイコン（配色は theme/tokens の insightUi） */
const INSIGHT_ICON: Record<SavingsInsightKind, LucideIcon> = {
  'over-no-goal': AlertCircle,
  'within-no-goal': TrendingUp,
  excellent: Sparkles,
  'on-track': TrendingUp,
  almost: AlertTriangle,
  deficit: AlertCircle,
  behind: AlertCircle,
};

type Props = {
  dailyBudget: {
    amount: number;
    remaining: number;
    ratio: number;
    daysUntilPayday: number;
  } | null;
  todayExpense: number;
  monthSummary: { expense: number; income: number };
  savingsGoal: number;
  /** テストで決定論的にレンダリングするための注入口（既定: 現在日時） */
  today?: Date;
};

/** 「今日の状況」カード（Web DailyBudgetHero と同一ロジック・同一トークン） */
export function TodayStatusCard({
  dailyBudget,
  todayExpense,
  monthSummary,
  savingsGoal,
  today,
}: Props) {
  if (!dailyBudget) {
    return (
      <View style={styles.emptyCard}>
        <Wallet size={32} color={colors.foreground} opacity={0.4} />
        <Text style={styles.emptyText}>設定を完了すると1日予算が表示されます</Text>
      </View>
    );
  }

  const tone = statusTone[budgetTone(dailyBudget.ratio)];
  const spendPct = dailyBudget.amount > 0 ? todayExpense / dailyBudget.amount : 0;
  const spendStatus = spendStatusOf(spendPct);
  const statusUi = spendStatusUi[spendStatus];

  const now = today ?? new Date();
  const forecast = calcSavingsForecast({
    monthIncome: monthSummary.income,
    monthExpense: monthSummary.expense,
    todayExpense,
    savingsGoal,
    dayOfMonth: now.getDate(),
    daysInMonth: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
  });
  const insight = buildSavingsInsight({
    spendStatus,
    savingsGoal,
    achievementRate: forecast.achievementRate,
    projectedSavings: forecast.projectedSavings,
  });
  const insightColor = insightUi[insight.kind];
  const InsightIcon = INSIGHT_ICON[insight.kind];
  const barPct = Math.max(0, Math.min(100, Math.round(spendPct * 100)));

  return (
    <View style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={styles.headerRow}>
        <Text style={styles.caption}>今日使えるお金</Text>
        <View style={[styles.badge, { backgroundColor: statusUi.badgeBg }]}>
          <Text style={[styles.badgeLabel, { color: statusUi.color }]}>
            {SPEND_STATUS_LABEL[spendStatus]}
          </Text>
        </View>
      </View>

      <Text style={[styles.hero, { color: tone.hero }]}>
        ¥{dailyBudget.remaining.toLocaleString()}
      </Text>

      <View style={styles.progressLabelRow}>
        <Text style={styles.progressLabel}>今日の支出</Text>
        <Text style={styles.progressValue}>
          ¥{todayExpense.toLocaleString()} / ¥{dailyBudget.amount.toLocaleString()}
        </Text>
      </View>
      <View
        style={styles.progressTrack}
        accessibilityRole="image"
        accessibilityLabel={`日予算の消化率 ${barPct}%`}
      >
        <View
          style={[styles.progressFill, { width: `${barPct}%`, backgroundColor: statusUi.bar }]}
        />
      </View>

      <View style={[styles.insight, { backgroundColor: insightColor.bg }]}>
        <InsightIcon size={13} color={insightColor.color} />
        <Text style={[styles.insightMessage, { color: insightColor.color }]}>
          {insight.message}
        </Text>
      </View>

      <Text style={styles.payday}>給料日まであと {dailyBudget.daysUntilPayday} 日</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    overflow: 'hidden',
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderDefault,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  caption: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
    opacity: 0.5,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  hero: {
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  progressLabelRow: {
    marginTop: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
    color: colors.foreground,
    opacity: 0.55,
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.foreground,
    opacity: 0.55,
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(28,20,16,0.06)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  insight: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  insightMessage: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  payday: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '500',
    color: colors.foreground,
    opacity: 0.4,
  },
});
