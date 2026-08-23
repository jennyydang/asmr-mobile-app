import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
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
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#7a5230" />
            <Stop offset="100%" stopColor="#4a3018" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" rx={28} fill="url(#deskGrad)" />
      </Svg>

      <Text style={styles.hint}>Tap each nail — fast, slow, or in rhythm</Text>

      <View style={styles.row}>
        {NAIL_COLORS.map((color, i) => (
          <Nail key={i} color={color} onTap={() => handleTap(i)} />
        ))}
      </View>

      <Text style={styles.counter}>{tapCount} taps</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    top: 24,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  nailTouchArea: {
    paddingHorizontal: 8,
    paddingVertical: 20,
  },
  finger: {
    width: 46,
    height: 120,
    borderRadius: 23,
    backgroundColor: '#e8b98e',
    alignItems: 'center',
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
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
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  counter: {
    position: 'absolute',
    bottom: 28,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '600',
  },
});
