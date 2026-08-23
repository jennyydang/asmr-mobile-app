import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import { glossyShadow, theme } from '../theme';
import type { TriggerComponentProps } from '../screens/TriggerScreen';

const NAIL_SOURCES = [
  require('../../assets/sounds/nail_tap_1.wav'),
  require('../../assets/sounds/nail_tap_2.wav'),
  require('../../assets/sounds/nail_tap_3.wav'),
];

const NAIL_COLORS = ['#f2a6c8', '#f4c98b', '#e6789c', '#c98bf4', '#f28ba2'];

interface NailProps {
  color: string;
  onTap: () => void;
}

function Nail({ color, onTap }: NailProps) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    scale.stopAnimation();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 55, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3.5, tension: 140, useNativeDriver: true }),
    ]).start();
    onTap();
  }

  return (
    <Pressable onPressIn={handlePressIn} style={styles.nailTouchArea}>
      <Animated.View style={[styles.finger, { transform: [{ scale }] }]}>
        <View style={[styles.nail, { backgroundColor: color }]}>
          <View style={styles.nailShine} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function NailTapping({ resetSignal }: TriggerComponentProps) {
  const [tapCount, setTapCount] = useState(0);
  const { playAt } = useSoundPool(NAIL_SOURCES, 4);

  useEffect(() => {
    setTapCount(0);
  }, [resetSignal]);

  function handleTap(index: number) {
    playAt(index % NAIL_SOURCES.length, 0.9);
    haptics.light();
    setTapCount((n) => n + 1);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.counter}>{tapCount} TAPS</Text>

      <View style={[styles.platform, glossyShadow]}>
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#ffe6f0" />
              <Stop offset="100%" stopColor="#f6c9dd" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" rx={26} fill="url(#deskGrad)" />
        </Svg>

        <View style={styles.row}>
          {NAIL_COLORS.map((color, i) => (
            <Nail key={i} color={color} onTap={() => handleTap(i)} />
          ))}
        </View>
      </View>

      <View style={styles.hintPill}>
        <Text style={styles.hint}>TAP TO THE BEAT</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  counter: {
    position: 'absolute',
    top: 8,
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  platform: {
    borderRadius: 26,
    overflow: 'hidden',
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  nailTouchArea: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  finger: {
    width: 46,
    height: 120,
    borderRadius: 23,
    backgroundColor: '#f3caa1',
    alignItems: 'center',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
  nail: {
    width: 30,
    height: 38,
    borderRadius: 15,
    overflow: 'hidden',
  },
  nailShine: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 10,
    height: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  hintPill: {
    backgroundColor: theme.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: 'rgba(20,20,30,0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  hint: {
    color: theme.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
