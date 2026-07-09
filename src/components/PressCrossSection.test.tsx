import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PressCrossSection } from './PressCrossSection';

describe('PressCrossSection', () => {
  it.each([
    [1.2, 0],
    [5, 50],
    [10, 100],
  ])('renders without crashing at anilox=%d impression=%d', (aniloxVolume, impression) => {
    const { container } = render(<PressCrossSection aniloxVolume={aniloxVolume} impression={impression} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
