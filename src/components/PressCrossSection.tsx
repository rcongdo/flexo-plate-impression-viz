import { PLATE_FEATURES } from '../domain/features';
import { computeFeatureState, inkFilmThickness, plateGapMils } from '../domain/physics';

const MILS_TO_PX = 2;
const BACKING_TOP_Y = 30;
const BACKING_HEIGHT = 50;
const FLOOR_Y = BACKING_TOP_Y + BACKING_HEIGHT;
const PLATE_LEFT_X = 200;
const PLATE_WIDTH_PX = 300;
const BUMP_CENTERS_X = [260, 350, 440];
const SHOULDER_FLARE_PX = 16;

interface PressCrossSectionProps {
  aniloxVolume: number;
  impression: number;
}

export function PressCrossSection({ aniloxVolume, impression }: PressCrossSectionProps) {
  const filmThickness = inkFilmThickness(aniloxVolume);
  const inkOpacity = Math.min(1, filmThickness / 8);
  const gapMils = plateGapMils(impression);
  const substrateY = FLOOR_Y + gapMils * MILS_TO_PX;
  const solidTipY = FLOOR_Y + (PLATE_FEATURES[0].reliefMils - computeFeatureState(PLATE_FEATURES[0], aniloxVolume, impression).compressionDepthMils) * MILS_TO_PX;

  return (
    <svg viewBox="0 0 600 300" role="img" aria-label="Press cross-section">
      <circle
        cx={90}
        cy={55}
        r={40}
        fill={`rgba(43, 108, 176, ${0.2 + inkOpacity * 0.8})`}
        stroke="#1a3a6b"
        strokeWidth={2}
      />
      <text x={90} y={110} textAnchor="middle" fontSize={12}>
        Anilox
      </text>

      <rect x={PLATE_LEFT_X} y={BACKING_TOP_Y} width={PLATE_WIDTH_PX} height={BACKING_HEIGHT} fill="#8a8a8a" />
      <text x={PLATE_LEFT_X + PLATE_WIDTH_PX / 2} y={BACKING_TOP_Y - 10} textAnchor="middle" fontSize={12}>
        Plate Backing
      </text>

      {PLATE_FEATURES.map((feature, index) => {
        const state = computeFeatureState(feature, aniloxVolume, impression);
        const bumpLengthMils = feature.reliefMils - state.compressionDepthMils;
        const bumpLengthPx = bumpLengthMils * MILS_TO_PX;
        const shoulderWidthPx = feature.widthMils * MILS_TO_PX + SHOULDER_FLARE_PX;
        const tipWidthPx = state.footprintWidthMils * MILS_TO_PX;
        const centerX = BUMP_CENTERS_X[index];
        const tipY = FLOOR_Y + bumpLengthPx;
        const inkFill = state.contactState === 'none' ? '#aaaaaa' : `rgba(20, 20, 20, ${state.inkCoverage})`;

        const points = [
          [centerX - shoulderWidthPx / 2, FLOOR_Y],
          [centerX + shoulderWidthPx / 2, FLOOR_Y],
          [centerX + tipWidthPx / 2, tipY],
          [centerX - tipWidthPx / 2, tipY],
        ]
          .map(([x, y]) => `${x},${y}`)
          .join(' ');

        return <polygon key={feature.id} points={points} fill={inkFill} stroke="#666666" strokeWidth={0.5} />;
      })}

      <text x={470} y={FLOOR_Y + 14} textAnchor="middle" fontSize={11}>
        Floor
      </text>
      <text x={300} y={FLOOR_Y + 20} textAnchor="middle" fontSize={11}>
        Shoulder
      </text>
      <text x={260} y={solidTipY - 8} textAnchor="middle" fontSize={11}>
        Image Area
      </text>

      <line x1={0} y1={substrateY} x2={600} y2={substrateY} stroke="#4a3728" strokeWidth={6} />
      <text x={550} y={substrateY - 10} textAnchor="middle" fontSize={12}>
        Substrate
      </text>
    </svg>
  );
}
