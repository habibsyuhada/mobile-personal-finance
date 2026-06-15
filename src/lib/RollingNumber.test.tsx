import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { RollingNumber } from './RollingNumber';

describe('RollingNumber', () => {
  it('renders the formatted value', () => {
    const { container } = render(<RollingNumber value={42} />);
    expect(container.textContent).toMatch(/42/);
  });

  it('uses custom format when provided', () => {
    const { container } = render(
      <RollingNumber value={1500} format={(n) => `$${n.toFixed(0)}`} />
    );
    expect(container.textContent).toBe('$1500');
  });

  it('renders zero correctly', () => {
    const { container } = render(<RollingNumber value={0} />);
    expect(container.textContent).toBe('0');
  });
});
