# Flexo Plate Impression Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Vite + React + TypeScript app that visualizes how anilox volume and impression setting affect flexo print quality, via a side-profile press cross-section (SVG) and a per-feature print preview (Canvas).

**Architecture:** A single pure-function physics module (`src/domain/physics.ts`) computes per-feature ink coverage, contact state, and compression from two inputs (anilox volume, impression). Both visualization panels and the control strip render from the same physics outputs, so there is one source of truth for "what does this control setting mean."

**Tech Stack:** Vite, React 19, TypeScript, Vitest, @testing-library/react, vitest-canvas-mock.

---

## File Structure

| File | Purpose |
|---|---|
| `package.json`, `tsconfig*.json`, `vite.config.ts`, `vitest.config.ts`, `vitest.setup.ts`, `index.html`, `.gitignore` | Project scaffold |
| `src/main.tsx` | React entry point |
| `src/App.tsx` | Root component; owns `aniloxVolume`/`impression` state |
| `src/styles.css` | Minimal layout styling |
| `src/domain/features.ts` | `PLATE_FEATURES`: the 3 fixed test features (solid, line, dots) |
| `src/domain/physics.ts` | Pure functions: `inkFilmThickness`, `plateGapMils`, `computeFeatureState` |
| `src/domain/physics.test.ts` | Unit tests for the physics module |
| `src/components/ControlStrip.tsx` (+ `.test.tsx`) | Anilox slider + impression dial with numeric readouts |
| `src/components/PressCrossSection.tsx` (+ `.test.tsx`) | SVG side-profile scene |
| `src/components/PrintPreview.tsx` (+ `.test.tsx`) | Canvas print-result swatches |

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `index.html`
- Create: `.gitignore`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "flexo-plate-impression-viz",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "jsdom": "^25.0.1",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8",
    "vitest-canvas-mock": "^0.3.3"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

- [ ] **Step 3: Write `tsconfig.app.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write `tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 5: Write `vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 6: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

- [ ] **Step 7: Write `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import 'vitest-canvas-mock';
```

- [ ] **Step 8: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Flexo Plate Impression Visualizer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Write `.gitignore`**

```
node_modules
dist
*.local
.DS_Store
```

- [ ] **Step 10: Install dependencies**

Run: `npm install`
Expected: installs successfully, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts vitest.config.ts vitest.setup.ts index.html .gitignore
git commit -m "chore: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Plate Feature Data

**Files:**
- Create: `src/domain/features.ts`

- [ ] **Step 1: Write `src/domain/features.ts`**

```ts
export type FeatureId = 'solid' | 'line' | 'dots';

export interface PlateFeature {
  id: FeatureId;
  label: string;
  /** Nominal raised feature width in mils (thousandths of an inch) */
  widthMils: number;
  /** Relief height in mils - how far the feature rises above the plate floor */
  reliefMils: number;
  /** How efficiently this feature picks up ink from the anilox at low film thickness (0-1) */
  inkPickupEfficiency: number;
}

export const PLATE_FEATURES: PlateFeature[] = [
  { id: 'solid', label: 'Solid', widthMils: 60, reliefMils: 30, inkPickupEfficiency: 1.0 },
  { id: 'line', label: 'Fine Line', widthMils: 10, reliefMils: 30, inkPickupEfficiency: 0.75 },
  { id: 'dots', label: 'Highlight Dot', widthMils: 4, reliefMils: 30, inkPickupEfficiency: 0.5 },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/domain/features.ts
git commit -m "feat: add fixed plate test-feature data"
```

---

### Task 3: Physics Module (TDD)

**Files:**
- Create: `src/domain/physics.ts`
- Test: `src/domain/physics.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/domain/physics.test.ts
import { describe, expect, it } from 'vitest';
import { PLATE_FEATURES } from './features';
import { computeFeatureState, inkFilmThickness } from './physics';

describe('inkFilmThickness', () => {
  it('increases as anilox volume increases, up to a saturation ceiling', () => {
    const low = inkFilmThickness(1.2);
    const mid = inkFilmThickness(4);
    const high = inkFilmThickness(10);
    expect(low).toBeLessThan(mid);
    expect(mid).toBeLessThan(high);
    expect(high).toBeLessThan(8);
  });
});

describe('computeFeatureState - starvation ordering', () => {
  it('starves fine features before solids at low anilox volume', () => {
    const solid = PLATE_FEATURES.find((f) => f.id === 'solid')!;
    const line = PLATE_FEATURES.find((f) => f.id === 'line')!;
    const dots = PLATE_FEATURES.find((f) => f.id === 'dots')!;

    const solidState = computeFeatureState(solid, 1.2, 80);
    const lineState = computeFeatureState(line, 1.2, 80);
    const dotsState = computeFeatureState(dots, 1.2, 80);

    expect(dotsState.inkCoverage).toBeLessThan(lineState.inkCoverage);
    expect(lineState.inkCoverage).toBeLessThan(solidState.inkCoverage);
  });
});

describe('computeFeatureState - contact state transitions', () => {
  const solid = PLATE_FEATURES.find((f) => f.id === 'solid')!;

  it('reports no contact at low impression', () => {
    const state = computeFeatureState(solid, 5, 0);
    expect(state.contactState).toBe('none');
    expect(state.compressionDepthMils).toBe(0);
  });

  it('reports kiss contact at the kiss point', () => {
    const state = computeFeatureState(solid, 5, 60);
    expect(state.contactState).toBe('kiss');
    expect(state.compressionDepthMils).toBe(0);
  });

  it('reports overdrive at high impression', () => {
    const state = computeFeatureState(solid, 5, 100);
    expect(state.contactState).toBe('overdrive');
    expect(state.compressionDepthMils).toBeGreaterThan(0);
  });
});

describe('computeFeatureState - compression monotonicity', () => {
  it('increases compression and footprint width as impression increases past kiss', () => {
    const solid = PLATE_FEATURES.find((f) => f.id === 'solid')!;
    const atKiss = computeFeatureState(solid, 5, 60);
    const pastKiss = computeFeatureState(solid, 5, 80);
    const wayPast = computeFeatureState(solid, 5, 100);

    expect(pastKiss.compressionDepthMils).toBeGreaterThan(atKiss.compressionDepthMils);
    expect(wayPast.compressionDepthMils).toBeGreaterThan(pastKiss.compressionDepthMils);

    expect(pastKiss.footprintWidthMils).toBeGreaterThan(atKiss.footprintWidthMils);
    expect(wayPast.footprintWidthMils).toBeGreaterThan(pastKiss.footprintWidthMils);
  });

  it('every feature gains footprint width once past kiss, proportionally more for thinner features', () => {
    for (const feature of PLATE_FEATURES) {
      const atKiss = computeFeatureState(feature, 5, 60);
      const overdriven = computeFeatureState(feature, 5, 100);
      expect(overdriven.footprintWidthMils).toBeGreaterThan(atKiss.footprintWidthMils);
    }

    const dots = PLATE_FEATURES.find((f) => f.id === 'dots')!;
    const solid = PLATE_FEATURES.find((f) => f.id === 'solid')!;
    const dotsGainRatio = computeFeatureState(dots, 5, 100).footprintWidthMils / dots.widthMils;
    const solidGainRatio = computeFeatureState(solid, 5, 100).footprintWidthMils / solid.widthMils;
    expect(dotsGainRatio).toBeGreaterThan(solidGainRatio);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- physics`
Expected: FAIL — `src/domain/physics.ts` does not exist / exports not found.

- [ ] **Step 3: Write `src/domain/physics.ts`**

```ts
import type { PlateFeature } from './features';

const MAX_FILM_THICKNESS_MICRONS = 8;
const SATURATION_CONSTANT = 4;
const STARVATION_THRESHOLD_MICRONS = 4;
const KISS_BAND_MILS = 3;
const BULGE_MILS_PER_COMPRESSION = 0.6;
const GAP_AT_MIN_IMPRESSION_MILS = 60;
const GAP_AT_MAX_IMPRESSION_MILS = 10;

export type ContactState = 'none' | 'kiss' | 'overdrive';

export interface FeatureState {
  contactState: ContactState;
  inkCoverage: number;
  footprintWidthMils: number;
  compressionDepthMils: number;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/** Ink film thickness (microns) the anilox roller carries, saturating at high volume. */
export function inkFilmThickness(aniloxVolumeBcm: number): number {
  return MAX_FILM_THICKNESS_MICRONS * (1 - Math.exp(-aniloxVolumeBcm / SATURATION_CONSTANT));
}

/** Distance (mils) from the plate's raised-feature tips to the substrate surface. */
export function plateGapMils(impression: number): number {
  const t = impression / 100;
  return GAP_AT_MIN_IMPRESSION_MILS + t * (GAP_AT_MAX_IMPRESSION_MILS - GAP_AT_MIN_IMPRESSION_MILS);
}

export function computeFeatureState(
  feature: PlateFeature,
  aniloxVolumeBcm: number,
  impression: number
): FeatureState {
  const filmThickness = inkFilmThickness(aniloxVolumeBcm);
  const inkCoverage = clamp01((filmThickness * feature.inkPickupEfficiency) / STARVATION_THRESHOLD_MICRONS);

  const gapMils = plateGapMils(impression);
  const compressionDepthMils = Math.max(0, feature.reliefMils - gapMils);

  let contactState: ContactState;
  if (gapMils > feature.reliefMils) {
    contactState = 'none';
  } else if (compressionDepthMils < KISS_BAND_MILS) {
    contactState = 'kiss';
  } else {
    contactState = 'overdrive';
  }

  const footprintWidthMils = feature.widthMils + 2 * compressionDepthMils * BULGE_MILS_PER_COMPRESSION;

  return { contactState, inkCoverage, footprintWidthMils, compressionDepthMils };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- physics`
Expected: PASS — all 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/domain/physics.ts src/domain/physics.test.ts
git commit -m "feat: add plate impression physics model"
```

---

### Task 4: Control Strip Component

**Files:**
- Create: `src/components/ControlStrip.tsx`
- Test: `src/components/ControlStrip.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/ControlStrip.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlStrip } from './ControlStrip';

describe('ControlStrip', () => {
  it('renders both sliders and calls the change handlers', () => {
    const onAniloxVolumeChange = vi.fn();
    const onImpressionChange = vi.fn();

    render(
      <ControlStrip
        aniloxVolume={5}
        impression={50}
        onAniloxVolumeChange={onAniloxVolumeChange}
        onImpressionChange={onImpressionChange}
      />
    );

    fireEvent.change(screen.getByLabelText(/Anilox Volume/i), { target: { value: '7' } });
    expect(onAniloxVolumeChange).toHaveBeenCalledWith(7);

    fireEvent.change(screen.getByLabelText(/Impression/i), { target: { value: '80' } });
    expect(onImpressionChange).toHaveBeenCalledWith(80);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- ControlStrip`
Expected: FAIL — `src/components/ControlStrip.tsx` does not exist.

- [ ] **Step 3: Write `src/components/ControlStrip.tsx`**

```tsx
import { computeFeatureState, inkFilmThickness } from '../domain/physics';
import { PLATE_FEATURES } from '../domain/features';

interface ControlStripProps {
  aniloxVolume: number;
  impression: number;
  onAniloxVolumeChange: (value: number) => void;
  onImpressionChange: (value: number) => void;
}

export function ControlStrip({
  aniloxVolume,
  impression,
  onAniloxVolumeChange,
  onImpressionChange,
}: ControlStripProps) {
  const filmThickness = inkFilmThickness(aniloxVolume);
  const referenceState = computeFeatureState(PLATE_FEATURES[0], aniloxVolume, impression);
  const contactLabel =
    referenceState.contactState === 'none'
      ? 'No Contact'
      : referenceState.contactState === 'kiss'
        ? 'Kiss'
        : 'Overdrive';

  return (
    <div className="control-strip">
      <div className="control">
        <label htmlFor="anilox-volume">
          Anilox Volume: {aniloxVolume.toFixed(1)} BCM (film {filmThickness.toFixed(1)}μm)
        </label>
        <input
          id="anilox-volume"
          type="range"
          min={1.2}
          max={10}
          step={0.1}
          value={aniloxVolume}
          onChange={(e) => onAniloxVolumeChange(Number(e.target.value))}
        />
      </div>
      <div className="control">
        <label htmlFor="impression">
          Impression: {contactLabel}
          {referenceState.compressionDepthMils > 0
            ? ` (${referenceState.compressionDepthMils.toFixed(1)} mil compression)`
            : ''}
        </label>
        <input
          id="impression"
          type="range"
          min={0}
          max={100}
          step={1}
          value={impression}
          onChange={(e) => onImpressionChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- ControlStrip`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ControlStrip.tsx src/components/ControlStrip.test.tsx
git commit -m "feat: add anilox/impression control strip"
```

---

### Task 5: Press Cross-Section Component

**Files:**
- Create: `src/components/PressCrossSection.tsx`
- Test: `src/components/PressCrossSection.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/PressCrossSection.test.tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PressCrossSection } from './PressCrossSection';

describe('PressCrossSection', () => {
  it.each([
    [1.2, 0],
    [5, 50],
    [10, 100],
  ])('renders without crashing at anilox=%d impression=%d', (aniloxVolume, impression) => {
    const { container } = render(<PressCrossSection aniloxVolume={aniloxVolume} impression={impression} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- PressCrossSection`
Expected: FAIL — `src/components/PressCrossSection.tsx` does not exist.

- [ ] **Step 3: Write `src/components/PressCrossSection.tsx`**

```tsx
import { PLATE_FEATURES } from '../domain/features';
import { computeFeatureState, inkFilmThickness, plateGapMils } from '../domain/physics';

const MILS_TO_PX = 2;
const PLATE_BOTTOM_Y = 100;
const PLATE_LEFT_X = 200;
const PLATE_WIDTH_PX = 300;
const BUMP_CENTERS_X = [260, 350, 440];

interface PressCrossSectionProps {
  aniloxVolume: number;
  impression: number;
}

export function PressCrossSection({ aniloxVolume, impression }: PressCrossSectionProps) {
  const filmThickness = inkFilmThickness(aniloxVolume);
  const inkOpacity = Math.min(1, filmThickness / 8);
  const gapMils = plateGapMils(impression);
  const substrateY = PLATE_BOTTOM_Y + gapMils * MILS_TO_PX;

  return (
    <svg viewBox="0 0 600 320" role="img" aria-label="Press cross-section">
      <circle
        cx={90}
        cy={90}
        r={45}
        fill={`rgba(43, 108, 176, ${0.2 + inkOpacity * 0.8})`}
        stroke="#1a3a6b"
        strokeWidth={2}
      />
      <text x={90} y={155} textAnchor="middle" fontSize={12}>
        Anilox
      </text>

      <rect x={PLATE_LEFT_X} y={40} width={PLATE_WIDTH_PX} height={60} fill="#888888" />
      <text x={PLATE_LEFT_X + PLATE_WIDTH_PX / 2} y={30} textAnchor="middle" fontSize={12}>
        Plate
      </text>

      {PLATE_FEATURES.map((feature, index) => {
        const state = computeFeatureState(feature, aniloxVolume, impression);
        const bumpLengthMils = feature.reliefMils - state.compressionDepthMils;
        const bumpLengthPx = bumpLengthMils * MILS_TO_PX;
        const widthPx = state.footprintWidthMils * MILS_TO_PX;
        const centerX = BUMP_CENTERS_X[index];
        const inkFill = state.contactState === 'none' ? '#aaaaaa' : `rgba(20, 20, 20, ${state.inkCoverage})`;

        if (feature.id === 'dots') {
          return (
            <ellipse
              key={feature.id}
              cx={centerX}
              cy={PLATE_BOTTOM_Y + bumpLengthPx / 2}
              rx={widthPx / 2}
              ry={bumpLengthPx / 2}
              fill={inkFill}
            />
          );
        }

        return (
          <rect
            key={feature.id}
            x={centerX - widthPx / 2}
            y={PLATE_BOTTOM_Y}
            width={widthPx}
            height={bumpLengthPx}
            fill={inkFill}
          />
        );
      })}

      <line x1={0} y1={substrateY} x2={600} y2={substrateY} stroke="#4a3728" strokeWidth={6} />
      <text x={550} y={substrateY - 10} textAnchor="middle" fontSize={12}>
        Substrate
      </text>
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- PressCrossSection`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PressCrossSection.tsx src/components/PressCrossSection.test.tsx
git commit -m "feat: add SVG press cross-section visualization"
```

---

### Task 6: Print Preview Component

**Files:**
- Create: `src/components/PrintPreview.tsx`
- Test: `src/components/PrintPreview.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/PrintPreview.test.tsx
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PrintPreview } from './PrintPreview';

describe('PrintPreview', () => {
  it.each([
    [1.2, 0],
    [5, 50],
    [10, 100],
  ])('renders without crashing at anilox=%d impression=%d', (aniloxVolume, impression) => {
    const { container } = render(<PrintPreview aniloxVolume={aniloxVolume} impression={impression} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- PrintPreview`
Expected: FAIL — `src/components/PrintPreview.tsx` does not exist.

- [ ] **Step 3: Write `src/components/PrintPreview.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { PLATE_FEATURES, type PlateFeature } from '../domain/features';
import { computeFeatureState, type FeatureState } from '../domain/physics';

const CANVAS_WIDTH = 320;
const ROW_HEIGHT = 60;
const CANVAS_HEIGHT = ROW_HEIGHT * PLATE_FEATURES.length;
const PX_PER_MIL = 3;

function drawFeatureSwatch(
  ctx: CanvasRenderingContext2D,
  feature: PlateFeature,
  state: FeatureState,
  rowY: number
) {
  const centerX = CANVAS_WIDTH / 2;

  ctx.save();
  ctx.fillStyle = '#f5f5f0';
  ctx.fillRect(0, rowY, CANVAS_WIDTH, ROW_HEIGHT);

  if (state.contactState === 'none') {
    ctx.strokeStyle = '#cccccc';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(
      centerX - (feature.widthMils * PX_PER_MIL) / 2,
      rowY + ROW_HEIGHT / 2 - 10,
      feature.widthMils * PX_PER_MIL,
      20
    );
    ctx.restore();
    return;
  }

  const widthPx = state.footprintWidthMils * PX_PER_MIL;
  const halfHeight = ROW_HEIGHT * 0.3;
  const alpha = state.inkCoverage;

  if (state.contactState === 'overdrive') {
    ctx.fillStyle = `rgba(20, 20, 20, ${alpha * 0.25})`;
    ctx.fillRect(
      centerX - widthPx / 2 - 6,
      rowY + ROW_HEIGHT / 2 - halfHeight - 4,
      widthPx + 12,
      halfHeight * 2 + 8
    );
  }

  ctx.fillStyle = `rgba(20, 20, 20, ${alpha})`;
  ctx.fillRect(centerX - widthPx / 2, rowY + ROW_HEIGHT / 2 - halfHeight, widthPx, halfHeight * 2);

  if (alpha < 0.6) {
    ctx.globalCompositeOperation = 'destination-out';
    const speckleCount = Math.round((1 - alpha) * 40);
    for (let i = 0; i < speckleCount; i++) {
      const sx = centerX - widthPx / 2 + Math.random() * widthPx;
      const sy = rowY + ROW_HEIGHT / 2 - halfHeight + Math.random() * halfHeight * 2;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
}

interface PrintPreviewProps {
  aniloxVolume: number;
  impression: number;
}

export function PrintPreview({ aniloxVolume, impression }: PrintPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    PLATE_FEATURES.forEach((feature, index) => {
      const state = computeFeatureState(feature, aniloxVolume, impression);
      drawFeatureSwatch(ctx, feature, state, index * ROW_HEIGHT);
    });
  }, [aniloxVolume, impression]);

  return (
    <div className="print-preview">
      <div className="print-preview-labels">
        {PLATE_FEATURES.map((f) => (
          <span key={f.id}>{f.label}</span>
        ))}
      </div>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- PrintPreview`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/PrintPreview.tsx src/components/PrintPreview.test.tsx
git commit -m "feat: add canvas print preview visualization"
```

---

### Task 7: Wire Up the App

**Files:**
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles.css`

- [ ] **Step 1: Write `src/styles.css`**

```css
body {
  margin: 0;
  font-family: system-ui, sans-serif;
  background: #f0f0ec;
}

.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.panels {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.panels svg {
  width: 100%;
  max-width: 600px;
  border: 1px solid #ccc;
  background: white;
}

.print-preview {
  display: flex;
  gap: 8px;
}

.print-preview canvas {
  border: 1px solid #ccc;
}

.print-preview-labels {
  display: flex;
  flex-direction: column;
}

.print-preview-labels span {
  display: flex;
  align-items: center;
  height: 60px;
  font-size: 12px;
  width: 80px;
}

.control-strip {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
}

.control input[type='range'] {
  width: 100%;
}
```

- [ ] **Step 2: Write `src/App.tsx`**

```tsx
import { useState } from 'react';
import { PressCrossSection } from './components/PressCrossSection';
import { PrintPreview } from './components/PrintPreview';
import { ControlStrip } from './components/ControlStrip';
import './styles.css';

export function App() {
  const [aniloxVolume, setAniloxVolume] = useState(4);
  const [impression, setImpression] = useState(50);

  return (
    <div className="app">
      <h1>Flexo Plate Impression Visualizer</h1>
      <div className="panels">
        <PressCrossSection aniloxVolume={aniloxVolume} impression={impression} />
        <PrintPreview aniloxVolume={aniloxVolume} impression={impression} />
      </div>
      <ControlStrip
        aniloxVolume={aniloxVolume}
        impression={impression}
        onAniloxVolumeChange={setAniloxVolume}
        onImpressionChange={setImpression}
      />
    </div>
  );
}
```

- [ ] **Step 3: Write `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 4: Run the full test suite**

Run: `npm test`
Expected: PASS — all tests across all files green.

- [ ] **Step 5: Run the build/type-check**

Run: `npm run build`
Expected: succeeds with no TypeScript errors, produces `dist/`.

- [ ] **Step 6: Manually verify in the browser**

Run: `npm run dev`, open the printed local URL.
Expected: page shows the title, the press cross-section (anilox circle, plate block with 3 bumps, substrate line), the print preview (3 swatches), and two working controls. Dragging impression from 0 to 100 should visibly close the gap, then flatten/widen the bumps and correspondingly change the print preview swatches. Dragging anilox volume should change ink opacity/coverage.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/main.tsx src/styles.css
git commit -m "feat: wire up app shell and control state"
```

---

## Self-Review Notes

- **Spec coverage:** Layout (cross-section + print preview + control strip) — Task 7. SVG cross-section — Task 5. Canvas print preview — Task 6. Domain model / physics — Tasks 2–3. Numeric readouts — Task 4 (`ControlStrip` labels). All spec sections have a corresponding task.
- **Type consistency:** `FeatureState`, `ContactState`, `PlateFeature`, `computeFeatureState`, `inkFilmThickness`, `plateGapMils` are defined once in Task 2/3 and reused with identical names/signatures in Tasks 4–6.
- **Simplification from spec:** the spec describes "dots" as a cluster of 3 small dots; implemented here as a single representative dot per feature row for both the cross-section and print preview, since a 2D side-profile slice can only show one bump per feature meaningfully. The label "Highlight Dot" (singular) reflects this.
