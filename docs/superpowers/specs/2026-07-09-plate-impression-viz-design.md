# Flexo Plate Impression Visualizer — Design

## Purpose

A standalone, browser-based teaching tool that visualizes how anilox volume
and impression setting affect flexographic print quality. Users adjust an
anilox volume slider and an impression dial; a side-profile cross-section
shows the mechanical relationship (ink metering, plate-to-substrate contact,
plate compression), and a print preview panel shows the resulting printed
result. Qualitatively accurate (relationships behave correctly) rather than
engineering-precise (no requirement to match real BCM/durometer formulas
exactly).

This is a new, standalone project — not part of the existing
`stripe2-press-sim` educational simulator, though it may reuse ideas from it
later.

## Non-Goals (v1)

- No plate durometer/hardness control (fixed constant).
- No substrate type selector (fixed constant).
- No defect-label callouts (e.g. "bridging", "starving" text badges) — only
  the numeric readouts and the visuals themselves.
- No ink viscosity, tack, press speed, or registration controls (those exist
  in the other project; out of scope here).
- No e2e test suite in v1.

## Tech Stack

- Vite + React 19 + TypeScript (matches the existing simulator project for
  consistency, even though this is a separate codebase).
- Vitest + Testing Library for unit/component tests.
- SVG for the mechanical cross-section, Canvas for the print preview
  (rationale below).

## Layout

Single-page app, two-column layout with a control strip along the bottom:

- **Left panel — Press Cross-Section (SVG).** A static side-view diagram:
  - Anilox roller: a circle with a stippled/cell texture pattern, positioned
    touching the tips of the plate's raised features. Fill color intensity
    reflects ink film thickness (derived from anilox volume).
  - Plate body: a block with three raised bumps representing the mixed test
    target — a wide flat-top solid, a thin narrow line, and a cluster of 3
    small round dots (simulating halftone highlight dots).
  - Substrate: a horizontal line beneath the plate. Its distance from the
    plate's raised tips is driven by the impression dial.
  - As impression increases: gap closes → tips touch substrate ("kiss",
    crisp contact, zero compression) → tips visibly flatten and widen
    (compress) the further the dial goes past kiss.

- **Right panel — Print Preview (Canvas).** Three swatches stacked
  vertically, one per feature (solid / line / dots), each rendered top-down
  showing the actual printed result for that feature: width, edge softness,
  dot gain, halo rings, or starvation speckle — all driven by the same
  underlying state as the cross-section.

- **Bottom control strip:**
  - Anilox volume slider (continuous, e.g. 1.2–10 BCM) with a live numeric
    readout: BCM value and derived ink film thickness.
  - Impression dial (continuous, e.g. 0–100) with a live numeric readout:
    contact state (no contact / kiss / overdrive) and, once in overdrive,
    compression depth in mils.

## Rendering Approach

SVG for the cross-section, Canvas for the print preview:

- SVG is declarative — animating compression (squashing a bump, widening its
  footprint) as the dial moves is just recomputing path coordinates from
  React state. Easy to reason about and inspect.
- Canvas is used for the print preview because it needs raster-style ink
  effects (mottle/starvation speckle, soft dot-gain edges, halo rings) that
  SVG filters render poorly. This mirrors the canvas-based ink rendering
  approach already proven in the existing `stripe2-press-sim` project's
  `PrintPreview.tsx`.

## Domain Model

Qualitative, teaching-tool fidelity — directionally correct physics, not
exact real-world formulas.

**Fixed constants (v1, not user-adjustable):**
- Plate relief height
- Plate durometer (compression stiffness)
- Substrate compliance

**Inputs:**
- `aniloxVolume`: BCM, continuous range e.g. 1.2–10
- `impression`: dial value, continuous range e.g. 0–100

**Test features** (`src/domain/features.ts`), each with fixed width and
relief height:
- `solid` — wide flat-top raised block
- `line` — thin narrow raised strip
- `dots` — cluster of small round bumps (halftone highlight simulation)

**Physics (`src/domain/physics.ts`, pure functions):**

1. `inkFilmThickness(aniloxVolume)` — ink film thickness on the anilox
   roller, increasing with volume with a saturation curve at high BCM.
2. `computeFeatureState(feature, aniloxVolume, impression)` — for each
   feature, returns:
   - `contactState`: `'none' | 'kiss' | 'overdrive'`, derived from mapping
     `impression` to a gap distance and comparing to the feature's relief
     height.
   - `inkCoverage`: ink actually transferred to the feature's tip. Finer
     features (dots) transfer less efficiently at low ink film thickness
     than solids do, producing visible starvation on dots before solids at
     low anilox volume.
   - `footprintWidth`: contact width once `kiss` or `overdrive` is reached.
     At `kiss`, equals the feature's nominal width (no gain). In
     `overdrive`, widens based on compression amount — thinner features gain
     proportionally more than wide solids, consistent with real flexo
     dot-gain behavior.
   - `compressionDepth`: how far past kiss contact the feature has been
     pushed (0 at kiss, increasing into overdrive).

   These four outputs are what both the cross-section and the print preview
   render from — single source of truth per feature.

## Components

- `App.tsx` — owns `aniloxVolume` and `impression` state; passes derived
  per-feature state down to both visualization panels and the control strip.
- `src/domain/features.ts` — the 3 fixed test features and their geometry.
- `src/domain/physics.ts` — pure functions described above.
- `components/PressCrossSection.tsx` — SVG rendering of anilox roller, plate
  body + bumps, substrate line, driven by per-feature state.
- `components/PrintPreview.tsx` — Canvas rendering of the 3 top-down print
  swatches, driven by the same per-feature state.
- `components/ControlStrip.tsx` — anilox slider + impression dial, each with
  a live numeric readout.

## Testing

- Unit tests (Vitest) for `physics.ts`:
  - Monotonic behavior: increasing impression past kiss increases
    compression and footprint width for every feature.
  - Increasing anilox volume increases ink coverage up to a saturation
    point.
  - At low anilox volume, `dots` reach a starved `inkCoverage` before
    `solid` does (fine-feature starvation ordering).
  - `contactState` transitions in order `none → kiss → overdrive` as
    impression increases monotonically, for all three features.
- Component smoke tests (Testing Library): `PressCrossSection` and
  `PrintPreview` render without crashing across a spread of control value
  combinations (min/mid/max anilox × min/mid/max impression).
- No Playwright/e2e suite in v1.

## Open Questions / Future Extensions (explicitly out of scope now)

- Plate durometer and substrate type controls.
- Defect-label callouts tied to thresholds.
- Reusing/aligning domain concepts with `stripe2-press-sim` if the two
  projects should eventually share a model.
