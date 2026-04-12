import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import {
  useSharedValue,
  useDerivedValue,
  useFrameCallback,
} from 'react-native-reanimated';
import type { SharedValue, FrameInfo } from 'react-native-reanimated';

// ── Shader source ──────────────────────────────────────────────────────────────
// Ports the Three.js Gaussian ring pulse exactly:
//   - Manhattan distance per fragment (matching vertex dist computation in Three.js)
//   - period 3.5s, speed 480 px/s, sigma 55px Gaussian ring
//   - Background #111111, gold wave #fff3af at 35% mix
//   - Pan/scale transform matches SVG group transform
const SHADER_SRC = `
uniform float uTime;
uniform float uWidth;
uniform float uHeight;
uniform float uPanX;
uniform float uPanY;
uniform float uScale;

half4 main(float2 fragCoord) {
  // Screen-space centre adjusted by pan
  float cx = uWidth  * 0.5 + uPanX;
  float cy = uHeight * 0.5 + uPanY;

  // Inverse-transform into grid/group space
  float gx = (fragCoord.x - cx) / uScale;
  float gy = (fragCoord.y - cy) / uScale;

  // Manhattan distance from grid origin — matches Three.js vertex dist attr
  float dist = abs(gx) + abs(gy);

  // Gaussian ring pulse — exact Three.js shader constants
  float period     = 3.5;
  float speed      = 480.0;
  float sigma      = 55.0;
  float tCycle     = mod(uTime, period);
  float waveRadius = tCycle * speed;

  float diff      = dist - waveRadius;
  float intensity = exp(-(diff * diff) / (2.0 * sigma * sigma));
  intensity       = clamp(intensity * 1.4, 0.0, 1.0);

  // #111111 → vec3(0.06667), #fff3af → vec3(1.0, 0.95294, 0.68627)
  float3 bg   = float3(0.06667, 0.06667, 0.06667);
  float3 gold = float3(1.0, 0.95294, 0.68627);
  float3 col  = mix(bg, gold, intensity * 0.35);

  return half4(col, 1.0);
}
`;

// Build the effect once outside the component to avoid re-compilation per render
const waveEffect = Skia.RuntimeEffect.Make(SHADER_SRC);
if (!waveEffect) {
  console.error('[MovementSkiaCanvas] Failed to compile wave shader');
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface Props {
  panX: SharedValue<number>;
  panY: SharedValue<number>;
  scale: SharedValue<number>;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function MovementSkiaCanvas({ panX, panY, scale }: Props) {
  const { width, height } = useWindowDimensions();

  // Elapsed seconds for uTime — frameInfo.timeSinceFirstFrame is in ms
  const uTime = useSharedValue(0);

  useFrameCallback((frameInfo: FrameInfo) => {
    'worklet';
    uTime.value = frameInfo.timeSinceFirstFrame / 1000;
  });

  // Recompute uniforms object on the UI thread whenever any input changes.
  // Skia's Canvas reads SharedValue<Uniforms> automatically via AnimatedProp.
  const uniforms = useDerivedValue(() => ({
    uTime:   uTime.value,
    uWidth:  width,
    uHeight: height,
    uPanX:   panX.value,
    uPanY:   panY.value,
    uScale:  scale.value,
  }));

  if (!waveEffect) return null;

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <Shader source={waveEffect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}
