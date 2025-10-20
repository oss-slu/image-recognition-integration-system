declare module 'jest-axe' {
  import { AxeResults } from 'axe-core';

  export function axe(element: HTMLElement | Document): Promise<AxeResults>;

  // Jest matcher
  declare global {
    namespace jest {
      interface Matchers<R> {
        toHaveNoViolations(): R;
      }
    }
  }

  // Export a matcher map compatible with expect.extend
  export const toHaveNoViolations: jest.ExpectExtendMap;

  export default toHaveNoViolations;
}
