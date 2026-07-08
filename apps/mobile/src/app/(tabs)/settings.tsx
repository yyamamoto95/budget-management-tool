import { Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/layout/AppHeader';
import { useAuth } from '@/lib/auth/auth-context';
import { colors } from '@/theme/tokens';

/** 設定画面（プレースホルダー。設定フォームの実装は #510） */
export default function SettingsScreen() {
  const { userId, logout } = useAuth();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader />
      <View style={styles.center}>
        <Settings size={40} color={colors.foreground} opacity={0.3} />
        <Text style={styles.title}>設定は準備中です</Text>
        <Text style={styles.note}>給与・給料日・固定費・貯蓄目標の設定を追加します。</Text>
      </View>
      <View style={styles.account}>
        <Text style={styles.accountLabel}>ログイン中: {userId}</Text>
        <Pressable onPress={logout} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.logout}>ログアウト</Text>
        </Pressable>
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
  account: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
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
