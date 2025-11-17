import React from 'react';
import { render } from '@testing-library/react';
import NavigationBar from '@/app/components/navigationBar';

describe('NavigationBar - mobile snapshot', () => {
  beforeAll(() => {
    // set a mobile viewport width
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    window.dispatchEvent(new Event('resize'));
  });

  test('renders correctly at mobile width', () => {
    const { container } = render(<NavigationBar />);
    expect(container).toMatchSnapshot();
  });
});
