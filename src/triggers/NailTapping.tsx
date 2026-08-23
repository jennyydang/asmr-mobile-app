import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import { glossyShadow, theme } from '../theme';
import { RimStrokeGradient, SpecularHighlight } from '../components/Gloss';
import type { TriggerComponentProps } from '../screens/TriggerScreen';

const NAIL_SOURCES = [
  require('../../assets/sounds/nail_tap_1.wav'),
  require('../../assets/sounds/nail_tap_2.wav'),
  require('../../assets/sounds/nail_tap_3.wav'),
];

const NAIL_COLORS = ['#f2a6c8', '#f4c98b', '#e6789c', '#c98bf4', '#f28ba2'];
const FINGER_W = 46;
const FINGER_H = 120;

interface NailProps {
  color: string;
  index: number;
  onTap: () => void;
}

function Nail({ color, index, onTap }: NailProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const skinId = `skin-${index}`;
  const nailId = `nail-${index}`;
  const rimId = `nailRim-${index}`;

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
      <Animated.View style={{ transform: [{ scale }] }}>
        <Svg width={FINGER_W} height={FINGER_H}>
          <Defs>
            <LinearGradient id={skinId} x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#d99f6c" />
              <Stop offset="20%" stopColor="#f6d3ac" />
              <Stop offset="55%" stopColor="#f3caa1" />
              <Stop offset="85%" stopColor="#e4ac79" />
              <Stop offset="100%" stopColor="#c98e5c" />
            </LinearGradient>
            <RadialGradient id={nailId} cx="35%" cy="25%" r="85%">
              <Stop offset="0%" stopColor="#ffffff" />
              <Stop offset="30%" stopColor={color} stopOpacity={0.55} />
              <Stop offset="70%" stopColor={color} />
              <Stop offset="100%" stopColor={color} />
            </RadialGradient>
            <RimStrokeGradient id={rimId} />
          </Defs>

          {/* fingertip, shaded like a cylinder catching light from the left */}
          <Rect x={0} y={0} width={FINGER_W} height={FINGER_H} rx={FINGER_W / 2} fill={`url(#${skinId})`} />

          {/* nail bed */}
          <Ellipse cx={FINGER_W / 2} cy={26} rx={14} ry={18} fill={`url(#${nailId})`} />
          <Ellipse cx={FINGER_W / 2} cy={26} rx={14} ry={18} fill="none" stroke={`url(#${rimId})`} strokeWidth={1.4} />
          <SpecularHighlight cx={FINGER_W / 2 - 4} cy={18} rx={4.5} ry={3} />
        </Svg>
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
            <Nail key={i} index={i} color={color} onTap={() => handleTap(i)} />
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
