import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenses, useDeleteExpense, type Expense } from '@/lib/api/use-expenses';
import { colors } from '@/theme/tokens';

export default function RecordsScreen() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const { data, isPending, isError, error, refetch, isRefetching } = useExpenses(search);
  const deleteExpense = useDeleteExpense();

  const confirmDelete = (expense: Expense) => {
    Alert.alert(
      '記録を削除',
      `${expense.date} ${expense.content || '（内容なし）'} ¥${expense.amount.toLocaleString()} を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            deleteExpense.mutate(expense.id, {
              onError: (e) =>
                Alert.alert('削除に失敗しました', e instanceof Error ? e.message : undefined),
            });
          },
        },
      ],
    );
  };

  return (
    // 下部セーフエリアはタブバーが処理するため除外（二重パディング防止）
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>明細</Text>
        <TextInput
          style={styles.search}
          value={searchInput}
          onChangeText={(t) => {
            setSearchInput(t);
            // 全消去（クリアボタン含む）で検索フィルターも解除する
            if (t === '') setSearch('');
          }}
          onSubmitEditing={() => setSearch(searchInput.trim())}
          returnKeyType="search"
          clearButtonMode="while-editing"
          placeholder="メモで検索"
          placeholderTextColor="rgba(28,20,16,0.35)"
          maxLength={100}
          autoCapitalize="none"
        />
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

      {data && (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {search ? `「${search}」に一致する記録はありません` : 'まだ記録がありません'}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onLongPress={() => confirmDelete(item)}
              delayLongPress={400}
              disabled={deleteExpense.isPending}
              accessibilityHint="長押しで削除"
            >
              <View style={styles.rowLeft}>
                <Text style={styles.date}>{item.date.slice(5).replace('-', '/')}</Text>
                <Text style={styles.content} numberOfLines={1}>
                  {item.content || '（内容なし）'}
                </Text>
              </View>
              <Text style={[styles.amount, item.balanceType === 1 && styles.incomeAmount]}>
                {item.balanceType === 1 ? '+' : '-'}¥{item.amount.toLocaleString()}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.foreground,
  },
  search: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.foreground,
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
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },
  empty: {
    fontSize: 13,
    color: colors.foreground,
    opacity: 0.5,
    textAlign: 'center',
    paddingVertical: 32,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: colors.foreground,
    opacity: 0.5,
    fontVariant: ['tabular-nums'],
  },
  content: {
    fontSize: 13,
    color: colors.foreground,
    flexShrink: 1,
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.foreground,
    fontVariant: ['tabular-nums'],
  },
  incomeAmount: {
    color: colors.income,
  },
});
