import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import type { TriggerComponentProps } from '../screens/TriggerScreen';

const CRACK_SOURCES = [
  require('../../assets/sounds/crack_pop_1.wav'),
  require('../../assets/sounds/crack_pop_2.wav'),
  require('../../assets/sounds/crack_pop_3.wav'),
];

const MIN_SEGMENT = 14; // px between crack points — also rate-limits sound/haptics
const MAX_CRACKS = 40;

type Point = { x: number; y: number };
type Crack = { id: number; points: Point[] };

function jitterPoint(from: Point, to: Point, magnitude: number): Point {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.y - from.y;
  const dy = -(to.x - from.x);
  const len = Math.hypot(dx, dy) || 1;
  const offset = (Math.random() - 0.5) * 2 * magnitude;
  return { x: mx + (dx / len) * offset, y: my + (dy / len) * offset };
}

function pathFromPoints(points: Point[]): string {
  if (points.length === 0) return '';
  return points.reduce(
    (d, p, i) => d + `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)} `,
    ''
  );
}

export default function WaxCracking({ resetSignal }: TriggerComponentProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [shards, setShards] = useState<{ id: number; x: number; y: number; r: number }[]>([]);

  const crackIdRef = useRef(0);
  const currentCrackRef = useRef<Crack | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const { playRandom } = useSoundPool(CRACK_SOURCES, 4);

  useEffect(() => {
    setCracks([]);
    setShards([]);
  }, [resetSignal]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }

  function beginCrack(point: Point) {
    const crack: Crack = { id: crackIdRef.current++, points: [point] };
    currentCrackRef.current = crack;
    lastPointRef.current = point;
    setCracks((prev) => {
      const next = [...prev, crack];
      return next.length > MAX_CRACKS ? next.slice(next.length - MAX_CRACKS) : next;
    });
  }

  function extendCrack(point: Point, speed: number) {
    const crack = currentCrackRef.current;
    const last = lastPointRef.current;
    if (!crack || !last) return;

    const dist = Math.hypot(point.x - last.x, point.y - last.y);
    if (dist < MIN_SEGMENT) return;

    const mid = jitterPoint(last, point, Math.min(10, 3 + speed * 0.02));
    crack.points.push(mid, point);
    lastPointRef.current = point;

    setCracks((prev) => prev.map((c) => (c.id === crack.id ? { ...crack, points: [...crack.points] } : c)));

    // Occasionally spawn a small offshoot "shatter" branch for texture.
    if (Math.random() < 0.25 && crack.points.length > 2) {
      const angle = Math.random() * Math.PI * 2;
      const len = 10 + Math.random() * 18;
      const branch: Crack = {
        id: crackIdRef.current++,
        points: [point, { x: point.x + Math.cos(angle) * len, y: point.y + Math.sin(angle) * len }],
      };
      setCracks((prev) => {
        const next = [...prev, branch];
        return next.length > MAX_CRACKS ? next.slice(next.length - MAX_CRACKS) : next;
      });
    }

    playRandom(0.85);
    const intensity = Math.min(1, speed / 900);
    if (intensity > 0.6) haptics.heavy();
    else if (intensity > 0.25) haptics.medium();
    else haptics.light();
  }

  function endCrack(point: Point) {
    currentCrackRef.current = null;
    lastPointRef.current = null;
    setShards((prev) => {
      const next = [...prev, { id: crackIdRef.current++, x: point.x, y: point.y, r: 3 + Math.random() * 4 }];
      return next.length > MAX_CRACKS ? next.slice(next.length - MAX_CRACKS) : next;
    });
    haptics.rigid();
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          beginCrack({ x: locationX, y: locationY });
        },
        onPanResponderMove: (evt, gestureState) => {
          const { locationX, locationY } = evt.nativeEvent;
          const speed = Math.hypot(gestureState.vx, gestureState.vy) * 1000;
          extendCrack({ x: locationX, y: locationY }, speed);
        },
        onPanResponderRelease: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          endCrack({ x: locationX, y: locationY });
        },
        onPanResponderTerminate: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          endCrack({ x: locationX, y: locationY });
        },
      }),
    []
  );

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      {size.width > 0 && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="waxGrad" cx="50%" cy="35%" r="75%">
              <Stop offset="0%" stopColor="#ffcf6b" />
              <Stop offset="55%" stopColor="#f2a93b" />
              <Stop offset="100%" stopColor="#c97f1f" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.width} height={size.height} rx={28} fill="url(#waxGrad)" />

          {cracks.map((crack) => (
            <Path
              key={crack.id}
              d={pathFromPoints(crack.points)}
              stroke="#4a2a0a"
              strokeOpacity={0.65}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {shards.map((s) => (
            <Path
              key={s.id}
              d={`M${s.x - s.r},${s.y} L${s.x},${s.y - s.r} L${s.x + s.r},${s.y} L${s.x},${s.y + s.r} Z`}
              fill="#3a220a"
              fillOpacity={0.5}
            />
          ))}
        </Svg>
      )}

      {cracks.length === 0 && (
        <View pointerEvents="none" style={styles.hintWrap}>
          <Text style={styles.hint}>Press and drag across the wax to crack it</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 16,
    borderRadius: 28,
    overflow: 'hidden',
  },
  hintWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  hint: {
    color: 'rgba(58,34,10,0.7)',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
