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
