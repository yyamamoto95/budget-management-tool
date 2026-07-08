import { Link } from 'expo-router';
import { NotebookPen } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';

/** アプリ共通ヘッダー（Web Header 相当: アプリ名 + 記録するボタン） */
export function AppHeader() {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>家計かんり</Text>
      <Link href="/entry" asChild>
        <Pressable style={styles.recordButton} accessibilityRole="button">
          <NotebookPen size={14} color={colors.surface} />
          <Text style={styles.recordLabel}>記録する</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.foreground,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  recordLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.surface,
  },
});
