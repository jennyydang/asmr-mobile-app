import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

import { useSoundPool } from '../audio/useSoundPool';
import { haptics } from '../haptics/haptics';
import { theme } from '../theme';
import { EdgeShade, RimLight, SpecularHighlight, ellipseArcPath } from '../components/Gloss';
import type { TriggerComponentProps } from '../screens/TriggerScreen';

const CRACK_SOURCES = [
  require('../../assets/sounds/crack_pop_1.wav'),
  require('../../assets/sounds/crack_pop_2.wav'),
  require('../../assets/sounds/crack_pop_3.wav'),
];

const MIN_SEGMENT = 14; // px between crack points — also rate-limits sound/haptics
const MAX_CRACKS = 40;
const MAX_CHIPS = 18;

type Point = { x: number; y: number };
type Crack = { id: number; points: Point[] };
type Chip = { id: number; x: number; y: number; size: number; rotation: number };
type Ellipse2D = { cx: number; cy: number; rx: number; ry: number };

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

function insideEllipse(p: Point, e: Ellipse2D): boolean {
  const nx = (p.x - e.cx) / e.rx;
  const ny = (p.y - e.cy) / e.ry;
  return nx * nx + ny * ny <= 1;
}

function chipPath(size: number): string {
  // A small irregular quad so detached chips don't read as perfect diamonds.
  const r = size;
  return `M${-r},${r * 0.15} L${-r * 0.2},${-r} L${r},${-r * 0.1} L${r * 0.3},${r} Z`;
}

export default function WaxCracking({ resetSignal }: TriggerComponentProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [cracks, setCracks] = useState<Crack[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);

  const crackIdRef = useRef(0);
  const currentCrackRef = useRef<Crack | null>(null);
  const lastPointRef = useRef<Point | null>(null);

  const { playRandom } = useSoundPool(CRACK_SOURCES, 4);

  useEffect(() => {
    setCracks([]);
    setChips([]);
  }, [resetSignal]);

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  }

  // Popsicle geometry: a rounded "head" sitting above a wooden stick.
  const head: Ellipse2D = useMemo(() => {
    const cx = size.width / 2;
    const cy = size.height * 0.32;
    const rx = Math.min(size.width * 0.34, 125);
    const ry = rx * 1.1;
    return { cx, cy, rx, ry };
  }, [size]);

  // Stable "marbling" freckles for the wax texture, generated once per size.
  const freckles = useMemo(() => {
    if (size.width === 0) return [];
    const rng = (seed: number) => {
      const x = Math.sin(seed * 999.7) * 43758.5453;
      return x - Math.floor(x);
    };
    return Array.from({ length: 14 }, (_, i) => ({
      x: head.cx + (rng(i) - 0.5) * head.rx * 1.6,
      y: head.cy + (rng(i + 50) - 0.5) * head.ry * 1.6,
      r: 4 + rng(i + 100) * 10,
    }));
  }, [head]);

  function beginCrack(point: Point) {
    if (!insideEllipse(point, head)) return;
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
    if (!currentCrackRef.current) return;
    currentCrackRef.current = null;
    lastPointRef.current = null;
    setChips((prev) => {
      const next = [
        ...prev,
        {
          id: crackIdRef.current++,
          x: point.x + (Math.random() - 0.5) * 16,
          y: point.y + (Math.random() - 0.5) * 16,
          size: 7 + Math.random() * 7,
          rotation: Math.random() * 60 - 30,
        },
      ];
      return next.length > MAX_CHIPS ? next.slice(next.length - MAX_CHIPS) : next;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [head]
  );

  const stickWidth = Math.max(24, head.rx * 0.32);
  const stickTop = head.cy + head.ry * 0.55;
  const stickHeight = Math.min(size.height - stickTop - 24, head.ry * 2.3);

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      {size.width > 0 && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="waxGrad" cx="36%" cy="26%" r="85%">
              <Stop offset="0%" stopColor="#fff8e0" />
              <Stop offset="30%" stopColor="#fadb84" />
              <Stop offset="60%" stopColor="#eab34a" />
              <Stop offset="82%" stopColor="#c9852a" />
              <Stop offset="94%" stopColor="#a86a1e" />
              <Stop offset="100%" stopColor="#c9942f" />
            </RadialGradient>
            <LinearGradient id="stickGrad" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0%" stopColor="#c99a5e" />
              <Stop offset="18%" stopColor="#f6e2ba" />
              <Stop offset="45%" stopColor="#f3dcb0" />
              <Stop offset="80%" stopColor="#d3a568" />
              <Stop offset="100%" stopColor="#a97b40" />
            </LinearGradient>
            <RadialGradient id="dropShadow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#000" stopOpacity={0.16} />
              <Stop offset="100%" stopColor="#000" stopOpacity={0} />
            </RadialGradient>
            <ClipPath id="headClip">
              <Ellipse cx={head.cx} cy={head.cy} rx={head.rx} ry={head.ry} />
            </ClipPath>
          </Defs>

          {/* soft contact shadow */}
          <Ellipse
            cx={head.cx}
            cy={stickTop + stickHeight * 0.55}
            rx={head.rx * 0.9}
            ry={18}
            fill="url(#dropShadow)"
          />

          {/* wooden stick */}
          <Rect
            x={head.cx - stickWidth / 2}
            y={stickTop}
            width={stickWidth}
            height={stickHeight}
            rx={stickWidth * 0.3}
            fill="url(#stickGrad)"
          />
          <Rect x={head.cx - stickWidth * 0.28} y={stickTop + 4} width={2} height={stickHeight - 10} fill="#fff3d6" opacity={0.55} />
          <Rect x={head.cx + stickWidth * 0.2} y={stickTop + 6} width={1.4} height={stickHeight - 12} fill="#8a6432" opacity={0.4} />

          {/* pop head, clipped so cracks/chips never spill outside the shape */}
          <G clipPath="url(#headClip)">
            <Ellipse cx={head.cx} cy={head.cy} rx={head.rx} ry={head.ry} fill="url(#waxGrad)" />
            {freckles.map((f, i) => (
              <Ellipse key={i} cx={f.x} cy={f.y} rx={f.r} ry={f.r * 0.7} fill="#fff8e2" opacity={0.28} />
            ))}

            {/* rim light (light source) and edge shade (opposite side) trace the curve */}
            <RimLight d={ellipseArcPath(head.cx, head.cy, head.rx * 0.97, head.ry * 0.97, 200, 300)} opacity={0.5} width={3} />
            <EdgeShade
              d={ellipseArcPath(head.cx, head.cy, head.rx * 0.97, head.ry * 0.97, 20, 120)}
              color="#7a4d15"
              opacity={0.35}
              width={4}
            />

            <SpecularHighlight
              cx={head.cx - head.rx * 0.32}
              cy={head.cy - head.ry * 0.42}
              rx={head.rx * 0.28}
              ry={head.ry * 0.18}
            />

            {cracks.map((crack) => (
              <Path
                key={`${crack.id}-base`}
                d={pathFromPoints(crack.points)}
                stroke="#fff6dd"
                strokeOpacity={0.9}
                strokeWidth={5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {cracks.map((crack) => (
              <Path
                key={`${crack.id}-line`}
                d={pathFromPoints(crack.points)}
                stroke="#a9701f"
                strokeOpacity={0.85}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </G>

          {/* detached chips float slightly outside the clip, like real shards */}
          {chips.map((chip) => (
            <Path
              key={chip.id}
              d={chipPath(chip.size)}
              transform={`translate(${chip.x}, ${chip.y}) rotate(${chip.rotation})`}
              fill="url(#waxGrad)"
              stroke="#fff6dd"
              strokeWidth={1}
              strokeOpacity={0.7}
            />
          ))}
        </Svg>
      )}

      {cracks.length === 0 && chips.length === 0 && (
        <View pointerEvents="none" style={[styles.hintWrap, { top: head.cy + head.ry + 20 }]}>
          <View style={styles.hintPill}>
            <Text style={styles.hint}>DRAG TO CRACK</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hintWrap: {
    position: 'absolute',
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
