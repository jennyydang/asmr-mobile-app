import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { useLoopingSound } from '../audio/useLoopingSound';
import { haptics } from '../haptics/haptics';
import type { TriggerComponentProps } from '../screens/TriggerScreen';

const CUT_LOOP = require('../../assets/sounds/soap_cut_loop.wav');

const MIN_SEGMENT = 10;
const HAPTIC_EVERY = 46;
const MAX_CUTS = 30;

type Point = { x: number; y: number };
type Cut = { id: number; points: Point[] };

function pathFromPoints(points: Point[]): string {
  if (points.length === 0) return '';
  return points.reduce(
    (d, p, i) => d + `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)} `,
    ''
  );
}

export default function SoapCutting({ resetSignal }: TriggerComponentProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [cuts, setCuts] = useState<Cut[]>([]);

  const cutIdRef = useRef(0);
  const currentCutRef = useRef<Cut | null>(null);
  const lastPointRef = useRef<Point | null>(null);
  const hapticAccumRef = useRef(0);

  const scrape = useLoopingSound(CUT_LOOP);

  useEffect(() => {
    setCuts([]);
  }, [resetSignal]);

  function onLayout(e: LayoutChangeEvent) {
    setSize(e.nativeEvent.layout);
  }

  function beginCut(point: Point) {
    const cut: Cut = { id: cutIdRef.current++, points: [point] };
    currentCutRef.current = cut;
    lastPointRef.current = point;
    hapticAccumRef.current = 0;
    setCuts((prev) => {
      const next = [...prev, cut];
      return next.length > MAX_CUTS ? next.slice(next.length - MAX_CUTS) : next;
    });
    scrape.start(0.5);
    haptics.soft();
  }

  function extendCut(point: Point) {
    const cut = currentCutRef.current;
    const last = lastPointRef.current;
    if (!cut || !last) return;

    const dist = Math.hypot(point.x - last.x, point.y - last.y);
    if (dist < MIN_SEGMENT) return;

    cut.points.push(point);
    lastPointRef.current = point;
    setCuts((prev) => prev.map((c) => (c.id === cut.id ? { ...cut, points: [...cut.points] } : c)));

    hapticAccumRef.current += dist;
    if (hapticAccumRef.current >= HAPTIC_EVERY) {
      hapticAccumRef.current = 0;
      haptics.light();
    }
  }

  function endCut() {
    currentCutRef.current = null;
    lastPointRef.current = null;
    scrape.stop();
    haptics.rigid();
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          beginCut({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });
        },
        onPanResponderMove: (evt) => {
          extendCut({ x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY });
        },
        onPanResponderRelease: endCut,
        onPanResponderTerminate: endCut,
      }),
    []
  );

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      {size.width > 0 && (
        <Svg width={size.width} height={size.height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="soapGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#f4ecff" />
              <Stop offset="55%" stopColor="#dcc4f7" />
              <Stop offset="100%" stopColor="#b98cf2" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={size.width} height={size.height} rx={28} fill="url(#soapGrad)" />

          {cuts.map((cut) => (
            <Path
              key={cut.id}
              d={pathFromPoints(cut.points)}
              stroke="#5c3d85"
              strokeOpacity={0.35}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
          {cuts.map((cut) => (
            <Path
              key={`${cut.id}-hi`}
              d={pathFromPoints(cut.points)}
              stroke="#ffffff"
              strokeOpacity={0.5}
              strokeWidth={1.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      )}

      {cuts.length === 0 && (
        <Text style={styles.hint} pointerEvents="none">
          Drag across the bar to slice off a sliver
        </Text>
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
  hint: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    color: 'rgba(92,61,133,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
});
