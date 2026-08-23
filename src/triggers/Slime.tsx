import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';

import { useLoopingSound } from '../audio/useLoopingSound';
import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import { theme } from '../theme';
import type { TriggerComponentProps } from '../screens/TriggerScreen';

const SQUISH_LOOP = require('../../assets/sounds/slime_squish_loop.wav');
const POP_SOURCES = [require('../../assets/sounds/slime_pop.wav')];

const BASE_RADIUS = 78;
const TIP_RADIUS = 26;

type Point = { x: number; y: number };

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function vector(from: Point, angle: number, length: number): Point {
  return { x: from.x + Math.cos(angle) * length, y: from.y + Math.sin(angle) * length };
}

/** Classic "metaball" connector: a smooth blob shape joining two circles. */
function metaballPath(c1: Point, r1: number, c2: Point, r2: number): string {
  const d = Math.max(dist(c1, c2), 0.0001);
  const spread = 1;

  const clampAcos = (v: number) => Math.acos(Math.max(-1, Math.min(1, v)));
  const u1 = clampAcos((r1 * r1 + d * d - r2 * r2) / (2 * r1 * d));
  const u2 = clampAcos((r2 * r2 + d * d - r1 * r1) / (2 * r2 * d));

  const angle = Math.atan2(c2.y - c1.y, c2.x - c1.x);
  const spreadAngle1 = u1 + spread * (Math.PI / 2 - u1);
  const spreadAngle2 = u2 + spread * (Math.PI / 2 - u2);

  const p1a = vector(c1, angle + spreadAngle1, r1);
  const p1b = vector(c1, angle - spreadAngle1, r1);
  const p2a = vector(c2, angle + Math.PI - spreadAngle2, r2);
  const p2b = vector(c2, angle - Math.PI + spreadAngle2, r2);

  const handleRatio = Math.min(2.4, dist(p1a, p2a) / (r1 + r2)) * Math.min(1, (d * 2) / (r1 + r2));
  const r1Handle = r1 * handleRatio;
  const r2Handle = r2 * handleRatio;

  const p1aH = vector(p1a, angle - Math.PI / 2, r1Handle);
  const p1bH = vector(p1b, angle + Math.PI / 2, r1Handle);
  const p2aH = vector(p2a, angle + Math.PI / 2, r2Handle);
  const p2bH = vector(p2b, angle - Math.PI / 2, r2Handle);

  return (
    `M${p1a.x},${p1a.y} ` +
    `C${p1aH.x},${p1aH.y} ${p2aH.x},${p2aH.y} ${p2a.x},${p2a.y} ` +
    `A${r2},${r2} 0 1 0 ${p2b.x},${p2b.y} ` +
    `C${p2bH.x},${p2bH.y} ${p1bH.x},${p1bH.y} ${p1b.x},${p1b.y} ` +
    `A${r1},${r1} 0 1 0 ${p1a.x},${p1a.y} Z`
  );
}

export default function Slime({ resetSignal }: TriggerComponentProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [touch, setTouch] = useState<Point | null>(null);
  const centerRef = useRef<Point>({ x: 0, y: 0 });
  const lastHapticPointRef = useRef<Point | null>(null);
  const snapAnimRef = useRef<number | null>(null);
  const breathe = useRef(new Animated.Value(0)).current;

  const squish = useLoopingSound(SQUISH_LOOP);
  const { playRandom } = useSoundPool(POP_SOURCES, 3);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  useEffect(() => {
    setTouch(null);
    squish.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
    centerRef.current = { x: width / 2, y: height / 2 };
  }

  function clampToReach(p: Point): Point {
    const center = centerRef.current;
    const maxReach = BASE_RADIUS + TIP_RADIUS - 6;
    const d = dist(center, p);
    if (d <= maxReach) return p;
    const angle = Math.atan2(p.y - center.y, p.x - center.x);
    return vector(center, angle, maxReach);
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          if (snapAnimRef.current) cancelAnimationFrame(snapAnimRef.current);
          const p = clampToReach({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });
          setTouch(p);
          lastHapticPointRef.current = p;
          squish.start(0.55);
          haptics.soft();
        },
        onPanResponderMove: (evt) => {
          const p = clampToReach({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });
          setTouch(p);

          const stretch = dist(centerRef.current, p) / (BASE_RADIUS + TIP_RADIUS);
          squish.setVolume(0.4 + stretch * 0.6);

          const last = lastHapticPointRef.current;
          if (!last || dist(last, p) > 14) {
            lastHapticPointRef.current = p;
            if (Math.random() < 0.5) haptics.light();
            else haptics.soft();
          }
        },
        onPanResponderRelease: () => {
          squish.stop();
          playRandom(0.9);
          haptics.medium();
          animateSnapBack();
        },
        onPanResponderTerminate: () => {
          squish.stop();
          animateSnapBack();
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  function animateSnapBack() {
    setTouch((current) => {
      if (!current) return null;
      const start = current;
      const center = centerRef.current;
      const startTime = Date.now();
      const duration = 260;

      const step = () => {
        const t = Math.min(1, (Date.now() - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const next = {
          x: start.x + (center.x - start.x) * eased,
          y: start.y + (center.y - start.y) * eased,
        };
        if (t >= 1) {
          setTouch(null);
        } else {
          setTouch(next);
          snapAnimRef.current = requestAnimationFrame(step);
        }
      };
      snapAnimRef.current = requestAnimationFrame(step);
      return current;
    });
  }

  const idleScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.03] });
  const center = centerRef.current;
  const path =
    touch && dist(center, touch) > 2
      ? metaballPath(center, BASE_RADIUS, touch, TIP_RADIUS)
      : circlePath(center, BASE_RADIUS);

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      {size.width > 0 && (
        <>
          <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="slimeShadow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#000" stopOpacity={0.16} />
                <Stop offset="100%" stopColor="#000" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Ellipse cx={center.x} cy={center.y + BASE_RADIUS * 0.75} rx={BASE_RADIUS * 0.9} ry={16} fill="url(#slimeShadow)" />
          </Svg>

          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: idleScale }] }]}>
            <Svg width={size.width} height={size.height}>
              <Defs>
                <RadialGradient id="slimeGrad" cx="38%" cy="28%" r="75%">
                  <Stop offset="0%" stopColor="#ccf9c9" />
                  <Stop offset="45%" stopColor="#7bdd8e" />
                  <Stop offset="85%" stopColor="#3fb862" />
                  <Stop offset="100%" stopColor="#278a4c" />
                </RadialGradient>
              </Defs>
              <Path d={path} fill="url(#slimeGrad)" />
              {!touch && (
                <Ellipse
                  cx={center.x - BASE_RADIUS * 0.32}
                  cy={center.y - BASE_RADIUS * 0.4}
                  rx={BASE_RADIUS * 0.28}
                  ry={BASE_RADIUS * 0.17}
                  fill="#ffffff"
                  opacity={0.6}
                />
              )}
            </Svg>
          </Animated.View>
        </>
      )}

      {!touch && (
        <View pointerEvents="none" style={styles.hintWrap}>
          <View style={styles.hintPill}>
            <Text style={styles.hint}>DRAG TO STRETCH</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function circlePath(c: Point, r: number): string {
  return `M${c.x - r},${c.y} a${r},${r} 0 1 0 ${r * 2},0 a${r},${r} 0 1 0 ${-r * 2},0 Z`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintWrap: {
    position: 'absolute',
    bottom: '18%',
    left: 0,
    right: 0,
    alignItems: 'center',
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
