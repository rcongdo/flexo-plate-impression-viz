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
