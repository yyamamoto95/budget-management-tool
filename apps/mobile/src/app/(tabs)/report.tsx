import { BarChart2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { colors } from '@/theme/tokens';

/** レポート画面（プレースホルダー。グラフ実装は次スプリント） */
export default function ReportScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />
      <View style={styles.center}>
        <BarChart2 size={40} color={colors.foreground} opacity={0.3} />
        <Text style={styles.title}>レポートは準備中です</Text>
        <Text style={styles.note}>支出の内訳グラフ・月次推移を順次追加します。</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
  },
  note: {
    fontSize: 13,
    color: colors.foreground,
    opacity: 0.55,
    textAlign: 'center',
  },
});
