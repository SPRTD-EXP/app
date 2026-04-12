import React, { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Text as SkText,
  matchFont,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// ── Grid constants — must match web page.tsx exactly ──────────────────────────
const CELL   = 120;
const HALF   = 60;  // CELL / 2
const V_STEP = 60;  // CELL / 2
const BUFFER = 6;   // cells of overdraw beyond viewport edge

// ── DIAMOND_OFFSETS — concentric rings around centre logo cell ─────────────
// (dr, dc) = row/col offset from centre. Identical to web source.
export const DIAMOND_OFFSETS: { dr: number; dc: number }[] = [
  // Ring 1 — 8 cells
  { dr: -2, dc:  0 }, { dr: -1, dc:  0 }, { dr:  0, dc:  1 }, { dr:  1, dc:  0 },
  { dr:  2, dc:  0 }, { dr:  1, dc: -1 }, { dr:  0, dc: -1 }, { dr: -1, dc: -1 },
  // Ring 2 — 16 cells
  { dr: -4, dc:  0 }, { dr: -3, dc:  0 }, { dr: -2, dc:  1 }, { dr: -1, dc:  1 },
  { dr:  0, dc:  2 }, { dr:  1, dc:  1 }, { dr:  2, dc:  1 }, { dr:  3, dc:  0 },
  { dr:  4, dc:  0 }, { dr:  3, dc: -1 }, { dr:  2, dc: -1 }, { dr:  1, dc: -2 },
  { dr:  0, dc: -2 }, { dr: -1, dc: -2 }, { dr: -2, dc: -1 }, { dr: -3, dc: -1 },
  // Ring 3 — 24 cells
  { dr: -6, dc:  0 }, { dr: -5, dc:  0 }, { dr: -4, dc:  1 }, { dr: -3, dc:  1 },
  { dr: -2, dc:  2 }, { dr: -1, dc:  2 }, { dr:  0, dc:  3 }, { dr:  1, dc:  2 },
  { dr:  2, dc:  2 }, { dr:  3, dc:  1 }, { dr:  4, dc:  1 }, { dr:  5, dc:  0 },
  { dr:  6, dc:  0 }, { dr:  5, dc: -1 }, { dr:  4, dc: -1 }, { dr:  3, dc: -2 },
  { dr:  2, dc: -2 }, { dr:  1, dc: -3 }, { dr:  0, dc: -3 }, { dr: -1, dc: -3 },
  { dr: -2, dc: -2 }, { dr: -3, dc: -2 }, { dr: -4, dc: -1 }, { dr: -5, dc: -1 },
];

// ── Geometry helpers ──────────────────────────────────────────────────────────

// Build a scaled diamond path centred at (cx, cy) with half-size = HALF * scale.
function makeScaledDiamond(cx: number, cy: number, scale: number) {
  const h = HALF * scale;
  const path = Skia.Path.Make();
  path.moveTo(cx,     cy - h); // top
  path.lineTo(cx + h, cy    ); // right
  path.lineTo(cx,     cy + h); // bottom
  path.lineTo(cx - h, cy    ); // left
  path.close();
  return path;
}

// Grid (dr, dc) → screen-space centre of that cell.
// Group origin is at (screenW/2 + panX, screenH/2 + panY).
// Cell centre in group-space: (dc*CELL + xOff, dr*V_STEP)
// where xOff = HALF when dr is odd, 0 when even.
function gridToScreen(
  dr: number,
  dc: number,
  panX: number,
  panY: number,
  scale: number,
  screenW: number,
  screenH: number,
): { x: number; y: number } {
  const xOff = (((dr % 2) + 2) % 2) * HALF;
  return {
    x: screenW / 2 + panX + (dc * CELL + xOff) * scale,
    y: screenH / 2 + panY +  dr * V_STEP        * scale,
  };
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface NicheLabel {
  dr: number;
  dc: number;
  label: string;
}

interface Props {
  panX: SharedValue<number>;
  panY: SharedValue<number>;
  scale: SharedValue<number>;
  selectedNiche: string | null;
  niches: { label: string; slug: string }[];
}

// ── Font for cell labels ──────────────────────────────────────────────────────
const FONT_SIZE = 7;
const labelFont = matchFont({
  fontFamily: 'HelveticaNeue-Light',
  fontWeight: '300',
  fontSize: FONT_SIZE,
});

// ── Colour constants ──────────────────────────────────────────────────────────
const C_SHELL    = 'rgba(255,243,175,0.08)';
const C_NICHE    = 'rgba(255,243,175,0.60)';
const C_SELECTED = 'rgba(255,243,175,1.00)';
const C_SEL_FILL = 'rgba(255,243,175,0.05)';
const C_LOGO     = 'rgba(255,243,175,1.00)';

// ── Component ─────────────────────────────────────────────────────────────────
export default function DiamondGrid({
  panX,
  panY,
  scale,
  selectedNiche,
  niches,
}: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();

  // Build niche ↔ grid position maps — recomputed when niches list changes
  const { nicheMap, shellSet } = useMemo(() => {
    const nicheMap = new Map<string, number>(); // "dr,dc" → niche array index
    DIAMOND_OFFSETS.slice(0, niches.length).forEach(({ dr, dc }, i) => {
      nicheMap.set(`${dr},${dc}`, i);
    });

    const activeRingEnd =
      niches.length === 0 ? 0 :
      niches.length <= 8  ? 8 :
      niches.length <= 24 ? 24 : 48;
    const shellSet = new Set<string>();
    DIAMOND_OFFSETS.slice(0, activeRingEnd).forEach(({ dr, dc }) => {
      shellSet.add(`${dr},${dc}`);
    });

    return { nicheMap, shellSet };
  }, [niches]);

  // Scale-dependent stroke width for animated cells
  const strokeWidth = useDerivedValue(() => Math.max(0.5, scale.value * 0.75));
  const selectedStrokeWidth = useDerivedValue(() => Math.max(0.8, scale.value));

  // ── Snapshot JS values to build static paths on React renders ────────────────
  // These update whenever React re-renders (niche tap, data load, etc.)
  // but NOT on every animation frame — that's intentional for performance.
  // The wave shader animates independently via Reanimated; the grid is
  // re-rasterised only when selection/data changes.
  const pxSnap = panX.value;
  const pySnap = panY.value;
  const scSnap = scale.value;

  // Compute visible cell range from current snapshot
  const viewport = useMemo(() => {
    const topY    = -(screenH / 2 + pySnap) / scSnap;
    const bottomY =  (screenH / 2 - pySnap) / scSnap;
    const leftX   = -(screenW / 2 + pxSnap) / scSnap;
    const rightX  =  (screenW / 2 - pxSnap) / scSnap;
    return {
      drMin: Math.floor((topY    - CELL) / V_STEP) - BUFFER,
      drMax: Math.ceil( (bottomY + CELL) / V_STEP) + BUFFER,
      dcMin: Math.floor((leftX   - CELL) / CELL  ) - BUFFER,
      dcMax: Math.ceil( (rightX  + CELL) / CELL  ) + BUFFER,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenW, screenH, pxSnap, pySnap, scSnap]);

  // Build merged Skia paths per visual category — efficient batched draw call
  const { dimPath, shellPath, nichePath, selectedPath, selectedFill, logoPath, nicheLabels } =
    useMemo(() => {
      const { drMin, drMax, dcMin, dcMax } = viewport;

      const dimPath      = Skia.Path.Make();
      const shellPath    = Skia.Path.Make();
      const nichePath    = Skia.Path.Make();
      const selectedPath = Skia.Path.Make();
      const selectedFill = Skia.Path.Make();
      const logoPath     = Skia.Path.Make();
      const nicheLabels: NicheLabel[] = [];

      for (let dr = drMin; dr <= drMax; dr++) {
        for (let dc = dcMin; dc <= dcMax; dc++) {
          const key = `${dr},${dc}`;
          const { x, y } = gridToScreen(dr, dc, pxSnap, pySnap, scSnap, screenW, screenH);
          const diamond = makeScaledDiamond(x, y, scSnap);

          const isLogo    = dr === 0 && dc === 0;
          const ni        = nicheMap.get(key) ?? -1;
          const niche     = ni >= 0 ? niches[ni] : null;
          const isSelected = niche !== null && niche.slug === selectedNiche;

          if (isLogo) {
            logoPath.addPath(diamond);
          } else if (niche) {
            if (isSelected) {
              selectedPath.addPath(diamond);
              selectedFill.addPath(diamond);
            } else {
              nichePath.addPath(diamond);
            }
            nicheLabels.push({ dr, dc, label: niche.label });
          } else if (shellSet.has(key)) {
            shellPath.addPath(diamond);
          } else {
            dimPath.addPath(diamond);
          }
        }
      }

      return { dimPath, shellPath, nichePath, selectedPath, selectedFill, logoPath, nicheLabels };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewport, niches, selectedNiche, nicheMap, shellSet, pxSnap, pySnap, scSnap, screenW, screenH]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Canvas
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      {/* Background cells — extremely dim, no explicit colour → near-transparent */}
      <Path
        path={dimPath}
        color="transparent"
        style="stroke"
        strokeWidth={strokeWidth}
      />

      {/* Shell ring cells — barely visible gold */}
      <Path
        path={shellPath}
        color={C_SHELL}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeJoin="round"
        strokeCap="round"
      />

      {/* Niche cells — mid-opacity gold stroke */}
      <Path
        path={nichePath}
        color={C_NICHE}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeJoin="round"
        strokeCap="round"
      />

      {/* Selected niche — fill then bright stroke on top */}
      <Path
        path={selectedFill}
        color={C_SEL_FILL}
        style="fill"
      />
      <Path
        path={selectedPath}
        color={C_SELECTED}
        style="stroke"
        strokeWidth={selectedStrokeWidth}
        strokeJoin="round"
        strokeCap="round"
      />

      {/* Logo / centre cell */}
      <Path
        path={logoPath}
        color={C_LOGO}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeJoin="round"
        strokeCap="round"
      />

      {/* Niche label text */}
      {labelFont &&
        nicheLabels.map(({ dr, dc, label }) => {
          const { x, y } = gridToScreen(dr, dc, pxSnap, pySnap, scSnap, screenW, screenH);
          const tw = labelFont.measureText(label).width;
          return (
            <SkText
              key={`label-${dr}-${dc}`}
              text={label}
              x={x - tw / 2}
              y={y + FONT_SIZE / 2}
              font={labelFont}
              color={C_NICHE}
            />
          );
        })}

      {/* SPRTD centre label */}
      {labelFont && (() => {
        const logoText = 'SPRTD';
        const { x, y } = gridToScreen(0, 0, pxSnap, pySnap, scSnap, screenW, screenH);
        const tw = labelFont.measureText(logoText).width;
        return (
          <SkText
            text={logoText}
            x={x - tw / 2}
            y={y + FONT_SIZE / 2}
            font={labelFont}
            color={C_LOGO}
          />
        );
      })()}
    </Canvas>
  );
}
