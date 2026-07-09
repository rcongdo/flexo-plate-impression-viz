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
