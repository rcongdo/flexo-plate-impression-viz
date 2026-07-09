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
