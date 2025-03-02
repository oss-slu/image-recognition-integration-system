import { render, screen } from '@testing-library/react';
import React from 'react';

function SampleComponent() {
  return <h1>Hello from TSX!</h1>;
}

describe('SampleComponent', () => {
  it('renders a heading', () => {
    render(<SampleComponent />);
    const heading = screen.getByRole('heading', {
      name: /Hello from TSX!/i,
    });
    expect(heading).toBeInTheDocument();
  });
});
