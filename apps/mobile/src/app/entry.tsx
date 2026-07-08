import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronDown, Delete } from 'lucide-react-native';
import { applyKeypadKey, KEYPAD_KEYS, MAX_AMOUNT, type KeypadKey } from '@budget/common';
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
import { useAuth } from '@/lib/auth/auth-context';
import { useCategories } from '@/lib/api/use-categories';
import { useCreateExpense } from '@/lib/api/use-create-expense';
import { useReceiptScan } from '@/lib/api/use-receipt-scan';
import { colors } from '@/theme/tokens';

/** 収支区分（API スキーマ準拠: 0=支出, 1=収入） */
const BALANCE_TYPE = { expense: 0, income: 1 } as const;

/** カテゴリの初期表示件数（Web QuickEntryDrawer と同一） */
const VISIBLE_COUNT = 4;

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function EntryScreen() {
  const router = useRouter();
  const { userId } = useAuth();
  const [balanceType, setBalanceType] = useState<0 | 1>(BALANCE_TYPE.expense);
  const {
    data: categories,
    isPending: categoriesLoading,
    isError: isCategoriesError,
  } = useCategories(balanceType);
  const createExpense = useCreateExpense();

  const [amountText, setAmountText] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [dayOffset, setDayOffset] = useState<0 | 1>(0); // 0=今日, 1=昨日
  const [content, setContent] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amount = Number(amountText);
  const canSubmit =
    Number.isInteger(amount) && amount > 0 && userId !== null && !createExpense.isPending;

  const handleSelectBalanceType = (next: 0 | 1) => {
    setBalanceType(next);
    // 収支タイプが変わるとカテゴリ体系も変わるため選択をリセットする
    setCategoryId(null);
    setShowAll(false);
  };

  // テンキーの入力規則は @budget/common に共通化（Web QuickEntryDrawer と単一実装）
  const handleNumKey = (k: KeypadKey) => {
    setAmountText((prev) => applyKeypadKey(prev, k));
  };

  const receiptScan = useReceiptScan();

  /**
   * 撮影/選択した画像の解析結果をフォームへプリフィルし、
   * 読み取り内容のサマリーを返す（登録はしない）
   */
  const applyScanResult = (result: {
    amount: number | null;
    date: string | null;
    content: string | null;
  }): string => {
    // != null で null と undefined の両方を防ぐ（防衛的チェック）
    if (result.amount != null && Number.isInteger(result.amount) && result.amount > 0) {
      setAmountText(String(Math.min(result.amount, MAX_AMOUNT)));
    }
    if (result.content != null) setContent(result.content);

    let dateNote = '';
    // 記録フォームの日付は今日/昨日のみのため、それ以外の日付は反映せず通知する
    if (result.date != null) {
      // 日付境界のレースを避けるため now は1回だけ取得する
      const now = new Date();
      const today = toDateString(now);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (result.date === today) {
        setDayOffset(0);
      } else if (result.date === toDateString(yesterday)) {
        setDayOffset(1);
      } else {
        dateNote = '（今日/昨日以外のため日付は未反映）';
      }
    }

    return [
      result.amount != null ? `金額: ¥${result.amount.toLocaleString()}` : '金額: 読み取れず',
      result.date != null ? `日付: ${result.date}${dateNote}` : '日付: 読み取れず',
      result.content != null ? `店名: ${result.content}` : '店名: 読み取れず',
    ].join('\n');
  };

  const handleReceiptScan = async (useCamera: boolean) => {
    setErrorMessage(null);
    const picked = useCamera
      ? await (async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            setErrorMessage('カメラへのアクセスが許可されていません');
            return null;
          }
          return ImagePicker.launchCameraAsync({ base64: true, quality: 0.5 });
        })()
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          base64: true,
          quality: 0.5,
        });

    if (!picked || picked.canceled) return;
    const asset = picked.assets[0];
    if (!asset.base64) {
      setErrorMessage('画像の読み込みに失敗しました');
      return;
    }

    try {
      const result = await receiptScan.mutateAsync({
        imageBase64: asset.base64,
        mimeType: asset.mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
      });
      // 成功時は読み取り結果を必ずメッセージで明示する（全項目 null でも通知される）
      const summary = applyScanResult(result);
      Alert.alert('レシートを読み取りました', `${summary}\n\n内容を確認して登録してください。`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'レシートの解析に失敗しました';
      // 失敗時もメッセージで明示する（手入力はそのまま継続できる）
      setErrorMessage(message);
      Alert.alert('レシートを解析できませんでした', `${message}\n\n手入力で登録できます。`);
    }
  };

  const promptReceiptSource = () => {
    Alert.alert('レシート読取', '画像の取得方法を選んでください', [
      { text: 'カメラで撮影', onPress: () => void handleReceiptScan(true) },
      { text: 'ライブラリから選択', onPress: () => void handleReceiptScan(false) },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (!canSubmit || userId === null) return;
    setErrorMessage(null);
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    try {
      await createExpense.mutateAsync({
        amount,
        balanceType,
        userId,
        date: toDateString(date),
        ...(categoryId !== null ? { categoryId } : {}),
        ...(content ? { content } : {}),
      });
      // 二重登録防止のため入力をリセットしてから戻る（Web #478 と同じ方針）
      setAmountText('');
      setContent('');
      setCategoryId(null);
      router.back();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '記録の登録に失敗しました');
    }
  };

  const isExpense = balanceType === BALANCE_TYPE.expense;
  const brandColor = isExpense ? colors.brandPrimary : colors.income;
  const allCategories = categories ?? [];
  const visibleCategories = showAll ? allCategories : allCategories.slice(0, VISIBLE_COUNT);
  const restCount = Math.max(0, allCategories.length - VISIBLE_COUNT);

  return (
    <SafeAreaView
      style={styles.safeArea}
      // iOS のモーダルは OS が上部を自動調整するが Android はされないため top を含める
      edges={Platform.OS === 'ios' ? ['bottom'] : ['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>クイック記録</Text>
            <Pressable
              onPress={() => router.back()}
              disabled={createExpense.isPending}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={[styles.close, createExpense.isPending && styles.disabledText]}>
                閉じる
              </Text>
            </Pressable>
          </View>

          {/* レシート読取（#515）: 解析結果はプリフィルのみ。登録は必ずユーザーが確認する */}
          <Pressable
            style={[styles.scanButton, receiptScan.isPending && styles.scanButtonDisabled]}
            onPress={promptReceiptSource}
            disabled={receiptScan.isPending || createExpense.isPending}
            accessibilityRole="button"
          >
            {receiptScan.isPending ? (
              <>
                <ActivityIndicator size="small" color={colors.brandPrimary} />
                <Text style={styles.scanLabel}>レシートを解析中…（最大2分ほどかかります）</Text>
              </>
            ) : (
              <>
                <Camera size={16} color={colors.brandPrimary} />
                <Text style={styles.scanLabel}>レシートを読み取って自動入力</Text>
              </>
            )}
          </Pressable>

          {/* 支出 / 収入 セグメント（Web QuickEntryDrawer と同一トーン） */}
          <View style={styles.segment}>
            {(
              [
                { type: BALANCE_TYPE.expense, label: '支出', active: colors.brandPrimary },
                { type: BALANCE_TYPE.income, label: '収入', active: colors.income },
              ] as const
            ).map(({ type, label, active }) => {
              const selected = balanceType === type;
              return (
                <Pressable
                  key={type}
                  style={[styles.segmentItem, selected && { backgroundColor: active }]}
                  onPress={() => handleSelectBalanceType(type)}
                  disabled={createExpense.isPending}
                  accessibilityRole="button"
                >
                  <Text style={[styles.segmentLabel, selected && styles.segmentLabelActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 金額パネル（Web と同一: ラベル + 右寄せ大表示） */}
          <View style={styles.amountPanel}>
            <Text style={styles.amountCaption}>{isExpense ? '支出金額' : '収入金額'}</Text>
            <Text
              style={[styles.amountValue, { color: brandColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              ¥{amountText === '' ? '0' : Number(amountText).toLocaleString()}
            </Text>
          </View>

          {/* カテゴリ（表示順 4 件 + もっと見る — Web と同一） */}
          <View style={styles.categoryHeader}>
            <Text style={styles.label}>カテゴリ</Text>
            <Text style={styles.labelNote}>よく使う順</Text>
          </View>
          {categoriesLoading ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : isCategoriesError ? (
            <Text style={styles.error}>カテゴリの取得に失敗しました。通信環境を確認してください</Text>
          ) : (
            <>
              <View style={styles.chips}>
                {visibleCategories.map((category) => {
                  const selected = categoryId === category.id;
                  return (
                    <Pressable
                      key={category.id}
                      style={[
                        styles.chip,
                        { backgroundColor: category.bg },
                        selected && { borderColor: category.color, borderWidth: 2 },
                      ]}
                      onPress={() => setCategoryId(selected ? null : category.id)}
                      disabled={createExpense.isPending}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.chipLabel, { color: category.color }]}>
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {restCount > 0 && (
                <Pressable
                  style={styles.moreButton}
                  onPress={() => setShowAll((prev) => !prev)}
                  accessibilityRole="button"
                >
                  <ChevronDown
                    size={14}
                    color={colors.foreground}
                    style={showAll ? { transform: [{ rotate: '180deg' }] } : undefined}
                  />
                  <Text style={styles.moreLabel}>
                    {showAll ? '閉じる' : `もっと見る（${restCount}件）`}
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {/* テンキー（入力規則は @budget/common で Web と共有） */}
          <View style={styles.keypad}>
            {KEYPAD_KEYS.map((k) => (
              <Pressable
                key={k}
                style={[styles.key, k === '⌫' && styles.keyDelete]}
                onPress={() => handleNumKey(k)}
                disabled={createExpense.isPending}
                accessibilityRole="button"
                accessibilityLabel={k === '⌫' ? '1文字削除' : k}
              >
                {k === '⌫' ? (
                  <Delete size={20} color={brandColor} />
                ) : (
                  <Text style={styles.keyLabel}>{k}</Text>
                )}
              </Pressable>
            ))}
          </View>

          {/* 日付（今日 / 昨日 — モバイル固有の簡易切替） */}
          <View style={styles.dateRow}>
            {(
              [
                { offset: 0, label: '今日' },
                { offset: 1, label: '昨日' },
              ] as const
            ).map(({ offset, label }) => {
              const selected = dayOffset === offset;
              return (
                <Pressable
                  key={offset}
                  style={[styles.dateChip, selected && styles.dateChipActive]}
                  onPress={() => setDayOffset(offset)}
                  disabled={createExpense.isPending}
                  accessibilityRole="button"
                >
                  <Text style={[styles.dateChipLabel, selected && styles.dateChipLabelActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* メモ（Web と同一ラベル・プレースホルダー） */}
          <Text style={styles.label}>メモ（任意）</Text>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="店名・用途など"
            placeholderTextColor="rgba(28,20,16,0.3)"
            maxLength={255}
            editable={!createExpense.isPending}
          />

          {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

          <Pressable
            style={[styles.submit, { backgroundColor: brandColor }, !canSubmit && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
          >
            {createExpense.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitLabel}>記録する</Text>
            )}
          </Pressable>
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
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
  },
  close: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  disabledText: {
    opacity: 0.4,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandLight,
    paddingVertical: 10,
  },
  scanButtonDisabled: {
    opacity: 0.7,
  },
  scanLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandPrimary,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: 'rgba(28,20,16,0.06)',
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 9,
    alignItems: 'center',
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(28,20,16,0.45)',
  },
  segmentLabelActive: {
    color: '#ffffff',
  },
  amountPanel: {
    borderRadius: 12,
    backgroundColor: colors.brandLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  amountCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.foreground,
    opacity: 0.5,
  },
  amountValue: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
    opacity: 0.6,
    marginTop: 2,
  },
  labelNote: {
    fontSize: 10,
    color: colors.foreground,
    opacity: 0.4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  moreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
    opacity: 0.6,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  key: {
    // 3 列グリッド: (100% - gap 2 つ) / 3
    flexBasis: '31%',
    flexGrow: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyDelete: {
    backgroundColor: colors.brandLight,
    borderColor: 'transparent',
  },
  keyLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateChip: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(28,20,16,0.06)',
  },
  dateChipActive: {
    backgroundColor: colors.foreground,
  },
  dateChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
    opacity: 0.6,
  },
  dateChipLabelActive: {
    color: '#ffffff',
    opacity: 1,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
  },
  error: {
    fontSize: 12,
    color: '#c62828',
  },
  submit: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
