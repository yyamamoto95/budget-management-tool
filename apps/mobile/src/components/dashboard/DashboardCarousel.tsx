import { useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { colors } from '@/theme/tokens';

/** ホーム画面の左右パディング（(tabs)/index.tsx の container と一致させる） */
const SCREEN_PADDING = 20;

export type CarouselSlide = {
  key: string;
  /** ドットの accessibilityLabel に使う名称（common HOME_CAROUSEL_SLIDES 由来） */
  label: string;
  node: React.ReactNode;
};

/**
 * SP ホームのスワイプビュー（#576 / Web DashboardCarousel と同構成）。
 * 依存追加なしの ScrollView paging で実装し、ドットで現在位置と直接移動を提供する。
 */
export function DashboardCarousel({ slides }: { slides: CarouselSlide[] }) {
  const { width } = useWindowDimensions();
  const slideWidth = width - SCREEN_PADDING * 2;
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (slides.length === 0) return null;

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
    setIndex(Math.min(Math.max(next, 0), slides.length - 1));
  };

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * slideWidth, animated: true });
    setIndex(next);
  };

  return (
    <View testID="dashboard-carousel">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        // paging の 1 ページ幅 = スライド幅（コンテナがパディング済みのため width 指定で揃う）
        style={{ width: slideWidth }}
      >
        {slides.map((slide) => (
          <View key={slide.key} style={{ width: slideWidth }}>
            {slide.node}
          </View>
        ))}
      </ScrollView>

      {/* ドットインジケーター（タップで直接移動） */}
      <View style={styles.dotsRow}>
        {slides.map((slide, i) => (
          <Pressable
            key={slide.key}
            onPress={() => goTo(i)}
            accessibilityRole="button"
            accessibilityLabel={slide.label}
            accessibilityState={{ selected: i === index }}
            hitSlop={8}
          >
            <View
              style={[
                styles.dot,
                i === index && { width: 20, backgroundColor: colors.brandPrimary },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: 'rgba(28,20,16,0.18)',
  },
});
