import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import type { TriggerComponentProps } from '../screens/TriggerScreen';

const POP_SOURCES = [
  require('../../assets/sounds/bubble_pop_1.wav'),
  require('../../assets/sounds/bubble_pop_2.wav'),
  require('../../assets/sounds/bubble_pop_3.wav'),
];

const COLUMNS = 6;
const ROWS = 9;
const TOTAL = COLUMNS * ROWS;
const H_PADDING = 16;

interface BubbleProps {
  size: number;
  popped: boolean;
  onPop: () => void;
}

function Bubble({ size, popped, onPop }: BubbleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    if (popped) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.15, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPop();
  }

  return (
    <Pressable onPress={handlePress} style={{ width: size, height: size, padding: 4 }}>
      <Animated.View
        style={[
          styles.bubble,
          {
            transform: [{ scale }],
            backgroundColor: popped ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.28)',
            borderColor: popped ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)',
          },
        ]}
      >
        {popped ? <View style={styles.bubbleDimple} /> : <View style={styles.bubbleShine} />}
      </Animated.View>
    </Pressable>
  );
}

export default function BubbleWrap({ resetSignal }: TriggerComponentProps) {
  const [width, setWidth] = useState(0);
  const [popped, setPopped] = useState<boolean[]>(() => new Array(TOTAL).fill(false));
  const { playRandom } = useSoundPool(POP_SOURCES, 6);

  useEffect(() => {
    setPopped(new Array(TOTAL).fill(false));
  }, [resetSignal]);

  const poppedCount = popped.filter(Boolean).length;

  useEffect(() => {
    if (poppedCount === TOTAL) haptics.success();
  }, [poppedCount]);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  function popAt(index: number) {
    setPopped((prev) => {
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
    playRandom(0.9);
    haptics.medium();
  }

  const bubbleSize = width > 0 ? (width - H_PADDING * 2) / COLUMNS : 0;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={styles.headerRow}>
        <Text style={styles.counter}>
          {poppedCount} / {TOTAL} popped
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.grid, { paddingHorizontal: H_PADDING }]}
        showsVerticalScrollIndicator={false}
      >
        {width > 0 &&
          popped.map((isPopped, i) => (
            <Bubble key={i} size={bubbleSize} popped={isPopped} onPop={() => popAt(i)} />
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0d2b3a',
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  counter: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 24,
  },
  bubble: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleShine: {
    position: 'absolute',
    top: '20%',
    left: '25%',
    width: '30%',
    height: '30%',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  bubbleDimple: {
    width: '45%',
    height: '45%',
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
});
