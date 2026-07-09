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
