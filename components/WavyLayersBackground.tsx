// WavyLayersBackground.tsx
import {
  Canvas,
  Group,
  Rect,
  Skia,
  vec,
} from "@shopify/react-native-skia";
import React, { useMemo } from "react";
import { Dimensions, StyleSheet, View } from "react-native";

type Props = {
  width?: number;
  height?: number;
  colors?: string[]; // back -> front
  seed?: number;     // change to remix the curves
  bands?: number;    // number of layers
};

const { width: W, height: H } = Dimensions.get("window");

// --------- helpers ----------
const rand = (s: number) => {
  // small seeded pseudo-random
  let t = s % 2147483647;
  return () => (t = (t * 48271) % 2147483647) / 2147483647;
};

function bandPath(
  width: number,
  height: number,
  yTop: number,
  yBottom: number,
  ampTop: number,
  ampBottom: number,
  freq: number,
  phaseTop: number,
  phaseBottom: number,
  steps = 24
) {
  // sample points
  const xs = Array.from({ length: steps }, (_, i) => (i / (steps - 1)) * width);
  const topPts = xs.map((x) => {
    const y = yTop + ampTop * Math.sin((x / width) * freq + phaseTop);
    return { x, y };
  });
  const botPts = xs.map((x) => {
    const y = yBottom + ampBottom * Math.sin((x / width) * freq + phaseBottom);
    return { x, y };
  });

  // Catmull–Rom → cubic Bezier
  const toCubic = (pts: { x: number; y: number }[]) => {
    const p = Skia.Path.Make();
    p.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      p.cubicTo(c1x, c1y, c2x, c2y, p2.x, p2.y);
    }
    return p;
  };

  const top = toCubic(topPts);
 // reverse to walk back

const band = Skia.Path.MakeFromSVGString(top.toSVGString())!;
band.lineTo(botPts[botPts.length - 1].x, botPts[botPts.length - 1].y);
const bottom = toCubic(botPts.slice().reverse());
const bottomSVG = bottom.toSVGString();
const idx = bottomSVG.indexOf("C");
const bottomPath = Skia.Path.MakeFromSVGString(`M0 0 ${bottomSVG.slice(idx)}`)!;
band.addPath(bottomPath); // <-- fixed
band.close();
  return band;
}

// --------- component ----------
export default function WavyLayersBackground({
  width = W,
  height = H,
  colors = ["#991f1c", "#c52a1d", "#e2481b", "#f76921", "#ff8a33", "#ffac52", "#ffbf6a"], // back->front
  seed = 42,
  bands = 6,
}: Props) {
  const paths = useMemo(() => {
    const r = rand(seed);
    const padding = height * 0.06;

    const bandHeight = (height + padding * 2) / bands;

    return Array.from({ length: bands }, (_, i) => {
      const yTop = i * bandHeight - padding;
      const yBottom = yTop + bandHeight + bandHeight * 0.25; // overlap bands a bit

      const freq = 6 + i * 0.6;           // more ripples as we go down
      const ampTop = bandHeight * (0.18 + r() * 0.15);
      const ampBottom = bandHeight * (0.18 + r() * 0.15);

      const phaseTop = r() * Math.PI * 2;
      const phaseBottom = r() * Math.PI * 2;

      return bandPath(
        width,
        height,
        yTop,
        yBottom,
        ampTop,
        ampBottom,
        freq,
        phaseTop,
        phaseBottom,
        28
      );
    });
  }, [width, height, bands, seed]);

  // extend gradient behind everything (subtle vertical warmth)
  const bgFrom = vec(0, 0);
  const bgTo = vec(0, height);

  return (
    <View style={{ width, height }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* background wash */}
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradientSkia from={bgFrom} to={bgTo} colors={["#ff6a2a", "#ffb559"]} />
        </Rect>

        {/* layered bands (back to front) */}
        {paths.map((p, i) => (
          <Group key={i} clip={p}>
            {/* fill each band with a solid (or try small two-stop gradient) */}
            <Rect x={0} y={0} width={width} height={height}>
              <LinearGradientSkia
                from={vec(0, 0)}
                to={vec(width, height)}
                colors={[
                  colors[i % colors.length],
                  lighten(colors[i % colors.length], 0.12),
                ]}
              />
            </Rect>
          </Group>
        ))}
      </Canvas>
    </View>
  );
}

/** ------- tiny utilities for gradients in Skia ------- */
const { LinearGradient: LinearGradientSkia } = require("@shopify/react-native-skia");

// simple lighten helper
function lighten(hex: string, amt = 0.1) {
  const n = parseInt(hex.slice(1), 16);
  let r = Math.min(255, ((n >> 16) & 255) + Math.round(255 * amt));
  let g = Math.min(255, ((n >> 8) & 255) + Math.round(255 * amt));
  let b = Math.min(255, (n & 255) + Math.round(255 * amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
