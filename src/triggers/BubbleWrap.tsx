import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import { glossyShadow, theme } from '../theme';
import { RimStrokeGradient, SpecularHighlight } from '../components/Gloss';
import type { TriggerComponentProps } from '../screens/TriggerScreen';

const POP_SOURCES = [
  require('../../assets/sounds/bubble_pop_1.wav'),
  require('../../assets/sounds/bubble_pop_2.wav'),
  require('../../assets/sounds/bubble_pop_3.wav'),
];

const COLUMNS = 3;
const ROWS = 5;
const TOTAL = COLUMNS * ROWS;
const SHEET_PADDING = 22;
const GAP = 10;

// A simple, centered heart silhouette (roughly -10..10 in both axes).
const HEART_D =
  'M0,7.5 C-6,2 -10,-2 -10,-6 C-10,-9.2 -7.2,-11.5 -4,-11.5 C-1.8,-11.5 0,-9.6 0,-7.4 ' +
  'C0,-9.6 1.8,-11.5 4,-11.5 C7.2,-11.5 10,-9.2 10,-6 C10,-2 6,2 0,7.5 Z';

interface HeartProps {
  size: number;
  popped: boolean;
  gradientId: string;
}

function Heart({ size, popped, gradientId }: HeartProps) {
  const rimId = `${gradientId}-rim`;
  return (
    <Svg width={size} height={size} viewBox="-13 -14 26 26">
      <Defs>
        <RadialGradient id={gradientId} cx="34%" cy="24%" r="85%">
          <Stop offset="0%" stopColor={popped ? '#d2bfe8' : '#fef9ff'} />
          <Stop offset="24%" stopColor={popped ? '#c2a9de' : '#e8cffa'} />
          <Stop offset="55%" stopColor={popped ? '#ab8ed1' : '#c99cf0'} />
          <Stop offset="82%" stopColor={popped ? '#8a6cb8' : '#9d68d9'} />
          <Stop offset="100%" stopColor={popped ? '#725aa0' : '#7d4bc4'} />
        </RadialGradient>
        <RimStrokeGradient id={rimId} />
      </Defs>
      <Path d={HEART_D} fill={`url(#${gradientId})`} opacity={popped ? 0.8 : 1} />
      <Path d={HEART_D} stroke={`url(#${rimId})`} strokeWidth={popped ? 0.5 : 1.1} fill="none" opacity={popped ? 0.6 : 1} />
      {!popped && <SpecularHighlight cx={-3.2} cy={-6.2} rx={2.6} ry={1.9} rotation={-25} />}
    </Svg>
  );
}

interface BubbleProps {
  size: number;
  popped: boolean;
  index: number;
  onPop: () => void;
}

function Bubble({ size, popped, index, onPop }: BubbleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    if (popped) return;
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.82, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
    onPop();
  }

  return (
    <Pressable onPress={handlePress} style={{ width: size, height: size }}>
      <Animated.View style={[styles.bubbleCell, { transform: [{ scale }] }]}>
        <Heart size={size} popped={popped} gradientId={`heart-${index}`} />
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

  const sheetWidth = width > 0 ? Math.min(width - 32, 340) : 0;
  const cellSize = sheetWidth > 0 ? (sheetWidth - SHEET_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS : 0;
  const sheetHeight = cellSize > 0 ? cellSize * ROWS + GAP * (ROWS - 1) + SHEET_PADDING * 2 : 0;

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Text style={styles.counter}>
        {poppedCount} / {TOTAL} POPPED
      </Text>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sheetWidth > 0 && (
          <View style={[styles.sheet, glossyShadow, { width: sheetWidth, height: sheetHeight }]}>
            <Svg width={sheetWidth} height={sheetHeight} style={StyleSheet.absoluteFill}>
              <Defs>
                <RadialGradient id="sheetGrad" cx="30%" cy="15%" r="90%">
                  <Stop offset="0%" stopColor="#f6ecff" />
                  <Stop offset="55%" stopColor="#e4cdfb" />
                  <Stop offset="100%" stopColor="#c9a3f0" />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width={sheetWidth} height={sheetHeight} rx={26} fill="url(#sheetGrad)" />
            </Svg>

            <View
              style={{
                padding: SHEET_PADDING,
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: GAP,
              }}
            >
              {popped.map((isPopped, i) => (
                <Bubble key={i} index={i} size={cellSize} popped={isPopped} onPop={() => popAt(i)} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  counter: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  sheet: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  bubbleCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
