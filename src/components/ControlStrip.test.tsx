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
