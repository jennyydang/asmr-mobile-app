import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import { glossyShadow, theme } from '../theme';
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
  return (
    <Svg width={size} height={size} viewBox="-13 -14 26 26">
      <Defs>
        <RadialGradient id={gradientId} cx="35%" cy="25%" r="80%">
          <Stop offset="0%" stopColor={popped ? '#c9b3e6' : '#faf3ff'} />
          <Stop offset="45%" stopColor={popped ? '#b69bd9' : '#dcbdf7'} />
          <Stop offset="100%" stopColor={popped ? '#a68ad1' : '#b287e8'} />
        </RadialGradient>
      </Defs>
      <Path
        d={HEART_D}
        fill={`url(#${gradientId})`}
        stroke={popped ? 'rgba(90,60,130,0.35)' : 'rgba(255,255,255,0.6)'}
        strokeWidth={popped ? 0.6 : 1}
        opacity={popped ? 0.75 : 1}
      />
      {!popped && <Path d="M-6,-7 C-4,-9.5 -1.5,-9.5 -0.5,-8" stroke="#ffffff" strokeWidth={1.4} strokeOpacity={0.75} fill="none" strokeLinecap="round" />}
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
