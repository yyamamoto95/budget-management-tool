import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amount = Number(amountText);
  const canSubmit =
    Number.isInteger(amount) && amount > 0 && userId !== null && !createExpense.isPending;

  const handleSelectBalanceType = (next: 0 | 1) => {
    setBalanceType(next);
    // 収支タイプが変わるとカテゴリ体系も変わるため選択をリセットする
    setCategoryId(null);
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
    if (result.amount != null) setAmountText(String(result.amount));
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
            <Text style={styles.title}>記録する</Text>
            <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8}>
              <Text style={styles.close}>閉じる</Text>
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
                <Text style={styles.scanLabel}>レシートを解析中…（最大1分ほどかかります）</Text>
              </>
            ) : (
              <>
                <Camera size={16} color={colors.brandPrimary} />
                <Text style={styles.scanLabel}>レシートを読み取って自動入力</Text>
              </>
            )}
          </Pressable>

          {/* 支出 / 収入 切り替え */}
          <View style={styles.segment}>
            {(
              [
                { type: BALANCE_TYPE.expense, label: '支出' },
                { type: BALANCE_TYPE.income, label: '収入' },
              ] as const
            ).map(({ type, label }) => (
              <Pressable
                key={type}
                style={[styles.segmentItem, balanceType === type && styles.segmentItemActive]}
                onPress={() => handleSelectBalanceType(type)}
                accessibilityRole="button"
              >
                <Text
                  style={[styles.segmentLabel, balanceType === type && styles.segmentLabelActive]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* 金額 */}
          <Text style={styles.label}>金額</Text>
          <TextInput
            style={styles.amountInput}
            value={amountText}
            onChangeText={(t) => setAmountText(t.replace(/[^0-9]/g, ''))}
            placeholder="0"
            placeholderTextColor="rgba(28,20,16,0.3)"
            keyboardType="number-pad"
            maxLength={9}
            editable={!createExpense.isPending}
          />

          {/* カテゴリ */}
          <Text style={styles.label}>カテゴリ</Text>
          {categoriesLoading ? (
            <ActivityIndicator color="#2e7d32" />
          ) : isCategoriesError ? (
            <Text style={styles.error}>カテゴリの取得に失敗しました。通信環境を確認してください</Text>
          ) : (
            <View style={styles.chips}>
              {(categories ?? []).map((category) => {
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
                    accessibilityRole="button"
                  >
                    <Text style={[styles.chipLabel, { color: category.color }]}>
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* 日付（今日 / 昨日） */}
          <Text style={styles.label}>日付</Text>
          <View style={styles.segment}>
            {(
              [
                { offset: 0, label: '今日' },
                { offset: 1, label: '昨日' },
              ] as const
            ).map(({ offset, label }) => (
              <Pressable
                key={offset}
                style={[styles.segmentItem, dayOffset === offset && styles.segmentItemActive]}
                onPress={() => setDayOffset(offset)}
                accessibilityRole="button"
              >
                <Text
                  style={[styles.segmentLabel, dayOffset === offset && styles.segmentLabelActive]}
                >
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* メモ */}
          <Text style={styles.label}>メモ（任意）</Text>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="昼食代など"
            placeholderTextColor="rgba(28,20,16,0.3)"
            maxLength={255}
            editable={!createExpense.isPending}
          />

          {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

          <Pressable
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
          >
            {createExpense.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitLabel}>
                {balanceType === BALANCE_TYPE.expense ? '支出を記録' : '収入を記録'}
              </Text>
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
    backgroundColor: '#faf6f2',
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1c1410',
  },
  close: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1410',
    opacity: 0.6,
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
    paddingVertical: 12,
    marginBottom: 4,
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
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#ffffff',
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1410',
    opacity: 0.5,
  },
  segmentLabelActive: {
    opacity: 1,
  },
  label: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
    color: '#1c1410',
  },
  amountInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(28,20,16,0.15)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 28,
    fontWeight: '800',
    color: '#1c1410',
    textAlign: 'right',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(28,20,16,0.15)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1c1410',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    color: '#c62828',
  },
  submit: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
