import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuth } from '@/lib/auth/auth-context';
import { useSettings, useSaveSettings } from '@/lib/api/use-settings';
import { colors } from '@/theme/tokens';

/** 給料日のクイック選択肢（Web 設定画面と同じ） */
const PAYDAY_PRESETS = [5, 20, 21, 25, 28, 31] as const;

/** 金額入力（数値のみ・カンマなし文字列で保持） */
function MoneyField({
  label,
  value,
  onChange,
  editable,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editable: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.moneyRow}>
        <Text style={styles.yen}>¥</Text>
        <TextInput
          style={styles.moneyInput}
          value={value}
          onChangeText={(t) => onChange(t.replace(/[^0-9]/g, ''))}
          placeholder="0"
          placeholderTextColor="rgba(28,20,16,0.3)"
          keyboardType="number-pad"
          maxLength={10}
          editable={editable}
        />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { userId, logout } = useAuth();
  const { data: settings, isPending } = useSettings();
  const saveSettings = useSaveSettings();

  const [totalAssets, setTotalAssets] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [fixedExpenses, setFixedExpenses] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [paydayDay, setPaydayDay] = useState<number>(25);

  // 取得済みの設定値でフォームを初期化する
  useEffect(() => {
    if (!settings) return;
    setTotalAssets(String(settings.totalAssets ?? 0));
    setMonthlyIncome(String(settings.monthlyIncome ?? 0));
    setFixedExpenses(String(settings.fixedExpenses ?? 0));
    setSavingsGoal(String(settings.savingsGoal ?? 0));
    setPaydayDay(settings.paydayDay ?? 25);
  }, [settings]);

  const canSave =
    totalAssets !== '' && monthlyIncome !== '' && fixedExpenses !== '' && !saveSettings.isPending;

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await saveSettings.mutateAsync({
        totalAssets: Number(totalAssets),
        monthlyIncome: Number(monthlyIncome),
        paydayDay,
        fixedExpenses: Number(fixedExpenses),
        savingsGoal: Number(savingsGoal || '0'),
        initialSetupCompleted: true,
      });
      Alert.alert('保存しました', 'ホームに1日予算が反映されます');
    } catch (e) {
      Alert.alert('保存に失敗しました', e instanceof Error ? e.message : undefined);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>設定</Text>

          {isPending ? (
            <ActivityIndicator size="large" color={colors.brandPrimary} />
          ) : (
            <>
              <MoneyField
                label="総資産（現在の残高）"
                value={totalAssets}
                onChange={setTotalAssets}
                editable={!saveSettings.isPending}
              />
              <MoneyField
                label="月収（手取り）"
                value={monthlyIncome}
                onChange={setMonthlyIncome}
                editable={!saveSettings.isPending}
              />

              <View style={styles.field}>
                <Text style={styles.label}>給料日</Text>
                <View style={styles.paydayChips}>
                  {PAYDAY_PRESETS.map((day) => {
                    const selected = paydayDay === day;
                    return (
                      <Pressable
                        key={day}
                        style={[styles.chip, selected && styles.chipSelected]}
                        onPress={() => setPaydayDay(day)}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                          {day}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {!PAYDAY_PRESETS.includes(paydayDay as (typeof PAYDAY_PRESETS)[number]) && (
                  <Text style={styles.paydayNote}>現在の設定: 毎月 {paydayDay} 日</Text>
                )}
              </View>

              <MoneyField
                label="固定費（家賃・光熱費などの合計）"
                value={fixedExpenses}
                onChange={setFixedExpenses}
                editable={!saveSettings.isPending}
              />
              <MoneyField
                label="月間貯蓄目標（任意）"
                value={savingsGoal}
                onChange={setSavingsGoal}
                editable={!saveSettings.isPending}
              />

              <Pressable
                style={[styles.save, !canSave && styles.saveDisabled]}
                onPress={handleSave}
                disabled={!canSave}
                accessibilityRole="button"
              >
                {saveSettings.isPending ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.saveLabel}>保存する</Text>
                )}
              </Pressable>
            </>
          )}

          <View style={styles.account}>
            <Text style={styles.accountLabel}>ログイン中: {userId ?? '未ログイン'}</Text>
            <Pressable onPress={logout} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.logout}>ログアウト</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 8,
    paddingBottom: 48,
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
  },
  moneyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  yen: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    opacity: 0.5,
  },
  moneyInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  paydayChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 44,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  chipLabelSelected: {
    color: colors.surface,
  },
  paydayNote: {
    fontSize: 12,
    color: colors.foreground,
    opacity: 0.55,
  },
  save: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.brandPrimary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveDisabled: {
    opacity: 0.4,
  },
  saveLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  account: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountLabel: {
    fontSize: 13,
    color: colors.foreground,
    opacity: 0.6,
  },
  logout: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c62828',
  },
});
