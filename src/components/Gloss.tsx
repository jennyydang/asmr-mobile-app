import { Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

interface SpecularHighlightProps {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** rotate the highlight to follow a non-circular object's long axis */
  rotation?: number;
}

/**
 * A soft, "blurred" specular highlight built from concentric ellipses of
 * falling opacity — react-native-svg's real blur filter isn't reliable
 * across Android/iOS/web, so this fake-blur stack is the portable
 * equivalent. Layering a few of these plus a tight bright core is what
 * reads as a rounded, glossy (rather than flat-painted) surface.
 */
export function SpecularHighlight({ cx, cy, rx, ry, rotation = 0 }: SpecularHighlightProps) {
  return (
    <>
      <Ellipse cx={cx} cy={cy} rx={rx * 2.1} ry={ry * 2.1} fill="#ffffff" opacity={0.08} transform={`rotate(${rotation} ${cx} ${cy})`} />
      <Ellipse cx={cx} cy={cy} rx={rx * 1.5} ry={ry * 1.5} fill="#ffffff" opacity={0.16} transform={`rotate(${rotation} ${cx} ${cy})`} />
      <Ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#ffffff" opacity={0.4} transform={`rotate(${rotation} ${cx} ${cy})`} />
      <Ellipse
        cx={cx - rx * 0.22}
        cy={cy - ry * 0.22}
        rx={rx * 0.4}
        ry={ry * 0.4}
        fill="#ffffff"
        opacity={0.9}
        transform={`rotate(${rotation} ${cx} ${cy})`}
      />
    </>
  );
}

/**
 * A thin bright arc traced along part of a shape's silhouette, simulating
 * light wrapping around a curved edge ("rim light") — the single biggest
 * cue that reads as "rendered sphere" rather than "flat gradient fill".
 */
export function RimLight({ d, opacity = 0.55, width = 2.5 }: { d: string; opacity?: number; width?: number }) {
  return <Path d={d} stroke="#ffffff" strokeWidth={width} strokeOpacity={opacity} strokeLinecap="round" fill="none" />;
}

/**
 * A diagonal gradient meant to be used as a shape's stroke (not fill) —
 * bright at the top-left, fading through transparent, darkening at the
 * bottom-right. Works on ANY silhouette (organic blobs, hearts, rounded
 * rects), not just circles, so it's the go-to rim-light trick for shapes
 * whose outline isn't a simple arc. Put it in a <Defs> once, then stroke
 * the same path used for the fill with `stroke="url(#{id})"`.
 */
export function RimStrokeGradient({ id }: { id: string }) {
  return (
    <LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
      <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.85} />
      <Stop offset="32%" stopColor="#ffffff" stopOpacity={0} />
      <Stop offset="68%" stopColor="#000000" stopOpacity={0} />
      <Stop offset="100%" stopColor="#000000" stopOpacity={0.4} />
    </LinearGradient>
  );
}

/** Dark arc on the opposite side of a rim light, for the shadowed edge. */
export function EdgeShade({ d, color, opacity = 0.3, width = 3 }: { d: string; color: string; opacity?: number; width?: number }) {
  return <Path d={d} stroke={color} strokeWidth={width} strokeOpacity={opacity} strokeLinecap="round" fill="none" />;
}

/**
 * Builds an open polyline tracing part of an ellipse's silhouette between
 * two angles (degrees, 0 = rightmost point, clockwise) — used to draw rim
 * light / edge-shade arcs that hug a rounded shape's curve.
 */
export function ellipseArcPath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startDeg: number,
  endDeg: number,
  segments = 20
): string {
  let d = '';
  for (let i = 0; i <= segments; i++) {
    const t = startDeg + ((endDeg - startDeg) * i) / segments;
    const rad = (t * Math.PI) / 180;
    const x = cx + rx * Math.cos(rad);
    const y = cy + ry * Math.sin(rad);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d;
}
