import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App';

describe('App', () => {
  it('renders placeholder title', () => {
    render(<App />);

    expect(screen.getByText('Flow Builder')).toBeDefined();
  });
});
