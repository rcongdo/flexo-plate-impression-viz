import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PrintPreview } from './PrintPreview';

describe('PrintPreview', () => {
  it.each([
    [1.2, 0],
    [5, 50],
    [10, 100],
  ])('renders without crashing at anilox=%d impression=%d', (aniloxVolume, impression) => {
    const { container } = render(<PrintPreview aniloxVolume={aniloxVolume} impression={impression} />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
