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
