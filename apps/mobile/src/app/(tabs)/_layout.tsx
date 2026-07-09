import { NAV_ITEM_DEFS } from '@budget/common';
import { Tabs, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NAV_ICON_MAP } from '@/lib/navIcons';
import { colors } from '@/theme/tokens';

/** タブラベル（SSOT は @budget/common の NAV_ITEM_DEFS。一致はテストで強制 #539） */
const NAV_LABELS = Object.fromEntries(NAV_ITEM_DEFS.map((d) => [d.key, d.label])) as Record<
  (typeof NAV_ITEM_DEFS)[number]['key'],
  string
>;

/**
 * ナビゲーション（Web navItems.ts と同一構成: ホーム / 明細 / [+] / レポート / 設定）
 * 中央の + はタブバーからはみ出すため、親（タブバー）にクリップされないよう
 * 画面ルートに絶対配置でオーバーレイする（はみ出し部分のタップ不能を防ぐ）。
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={styles.root}>
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
            title: NAV_LABELS.home,
            tabBarIcon: ({ color, size }) => <NAV_ICON_MAP.home color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: NAV_LABELS.records,
            tabBarIcon: ({ color, size }) => <NAV_ICON_MAP.records color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="record-action"
          options={{
            title: '',
            // 中央スロットの場所取り（実ボタンは下のオーバーレイ）
            tabBarButton: () => <View style={styles.centerSpacer} />,
          }}
        />
        <Tabs.Screen
          name="report"
          options={{
            title: NAV_LABELS.report,
            tabBarIcon: ({ color, size }) => <NAV_ICON_MAP.report color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: NAV_LABELS.settings,
            tabBarIcon: ({ color, size }) => <NAV_ICON_MAP.settings color={color} size={size} />,
          }}
        />
      </Tabs>

      <Pressable
        style={[styles.centerButton, { bottom: insets.bottom + 22 }]}
        // navigate は同一ルートの重複プッシュを抑止する（連打対策）
        onPress={() => router.navigate('/entry')}
        accessibilityRole="button"
        accessibilityLabel="記録する"
      >
        <Plus size={26} color={colors.surface} strokeWidth={3} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centerSpacer: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    // alignSelf: center は絶対配置との組み合わせで実機の挙動が不安定なため、
    // left 50% + 幅の半分のマージン補正で決定的にセンタリングする（#534）
    left: '50%',
    marginLeft: -28,
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
