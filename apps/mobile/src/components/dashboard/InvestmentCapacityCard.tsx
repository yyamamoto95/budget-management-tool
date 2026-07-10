import {
  buildInvestmentDeepLinkQuery,
  calculateInvestmentCapacity,
  emergencyFundDisplay,
  formatCapacityHoldReason,
  formatYen,
  INVESTMENT_CAPACITY_TEXT,
  RISK_TOLERANCE_LABELS,
  type LivingMarginInputs,
} from '@budget/common';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

/** 検証ツール（investment-analysis-tool）のベース URL。未設定時は CTA を表示しない */
const INVESTMENT_TOOL_URL = process.env.EXPO_PUBLIC_INVESTMENT_TOOL_URL;

/**
 * 投資余力カード（Web InvestmentCapacityCard と同一ロジック・同一文言。SSOT は @budget/common）
 * 「今月は投資を控える月」も正しい結果として肯定形で表示する。
 * 算出不能のときは何も描画しない（生活余力カード側が案内する）。
 */
export function InvestmentCapacityCard({ livingMargin }: { livingMargin: LivingMarginInputs }) {
  const result = calculateInvestmentCapacity(livingMargin);
  if (result.status !== 'ok') {
    return null;
  }

  const fund = emergencyFundDisplay(result.emergencyFundRatio);
  const holdReason = formatCapacityHoldReason(result);
  const deepLinkQuery = buildInvestmentDeepLinkQuery(result);
  const ctaUrl =
    deepLinkQuery && INVESTMENT_TOOL_URL
      ? `${INVESTMENT_TOOL_URL.replace(/\/$/, '')}/?${deepLinkQuery}`
      : null;

  return (
    <View style={styles.card} testID="investment-capacity-card">
      <Text style={styles.title}>{INVESTMENT_CAPACITY_TEXT.title}</Text>

      {result.shouldHold ? (
        <>
          <Text style={styles.holdTitle}>{INVESTMENT_CAPACITY_TEXT.holdTitle}</Text>
          <Text style={styles.note}>{holdReason}</Text>
        </>
      ) : (
        <>
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>{INVESTMENT_CAPACITY_TEXT.limitLabel}</Text>
            <Text style={styles.value}>{formatYen(result.monthlyLimitJpy)}</Text>
          </View>
          <Text style={styles.tolerance}>
            リスク許容度: {RISK_TOLERANCE_LABELS[result.riskTolerance]}
          </Text>
        </>
      )}

      {/* 生活防衛資金の充足バー（事実のみ。良好=income / 未充足=caution） */}
      <View style={styles.fundSection}>
        <View style={styles.fundLabelRow}>
          <Text style={styles.fundLabel}>{INVESTMENT_CAPACITY_TEXT.fundLabel}</Text>
          <Text style={styles.fundPercent}>{fund.percent}%</Text>
        </View>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${fund.barPercent}%`,
                backgroundColor: result.emergencyFundRatio >= 1.0 ? colors.income : colors.caution,
              },
            ]}
          />
        </View>
      </View>

      {ctaUrl && (
        <Pressable
          style={styles.cta}
          accessibilityRole="link"
          onPress={() => {
            // 端末外ブラウザで検証ツールを開く（失敗しても静かに握りつぶさずログへ）
            Linking.openURL(ctaUrl).catch((error: unknown) => {
              console.warn('検証ツールのリンクを開けませんでした', error);
            });
          }}
        >
          <Text style={styles.ctaLabel}>{INVESTMENT_CAPACITY_TEXT.ctaLabel}</Text>
        </Pressable>
      )}

      <Text style={styles.disclaimer}>{INVESTMENT_CAPACITY_TEXT.disclaimer}</Text>
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
  holdTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    gap: 6,
  },
  valueLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    opacity: 0.6,
    marginBottom: 5,
  },
  value: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  tolerance: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.income,
  },
  fundSection: {
    marginTop: 6,
    gap: 4,
  },
  fundLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fundLabel: {
    fontSize: 11,
    color: colors.foreground,
    opacity: 0.5,
  },
  fundPercent: {
    fontSize: 11,
    color: colors.foreground,
    opacity: 0.5,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 6,
    borderRadius: 9999,
    backgroundColor: colors.borderDefault,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 9999,
  },
  cta: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.background,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
  },
  disclaimer: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: colors.foreground,
    opacity: 0.5,
  },
});
