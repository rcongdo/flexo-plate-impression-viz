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
