import { Link, Tabs } from 'expo-router';
import { BarChart2, Home, Plus, Receipt, Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '@/theme/tokens';

/** タブバー中央のオレンジ「+」ボタン（Web BottomNav の中央 FAB 相当） */
function CenterRecordButton() {
  return (
    <View style={styles.centerSlot} pointerEvents="box-none">
      <Link href="/entry" asChild>
        <Pressable style={styles.centerButton} accessibilityRole="button" accessibilityLabel="記録する">
          <Plus size={26} color={colors.surface} strokeWidth={3} />
        </Pressable>
      </Link>
    </View>
  );
}

/**
 * ナビゲーション（Web navItems.ts と同一構成: ホーム / 明細 / [+] / レポート / 設定）
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: 'rgba(28,20,16,0.4)',
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: '明細',
          tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="record-action"
        options={{
          title: '',
          tabBarButton: () => <CenterRecordButton />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'レポート',
          tabBarIcon: ({ color, size }) => <BarChart2 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerSlot: {
    flex: 1,
    alignItems: 'center',
  },
  centerButton: {
    marginTop: -18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
