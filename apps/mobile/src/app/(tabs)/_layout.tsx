import { Tabs } from 'expo-router';
import { Home, ReceiptText } from 'lucide-react-native';
import { colors } from '@/theme/tokens';

/** ホーム / 明細 のタブナビゲーション（Web の BottomNav 相当） */
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
          tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
