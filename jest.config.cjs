// jest.config.js
const nextJest = require('next/jest');

// Provide the path to Next.js app to load next.config.js and .env files in test environment
const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Use jest-environment-jsdom for browser-like testing
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    // Handle module aliases
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
  },
  // Force development build of React for testing
  globals: {
    'process.env.NODE_ENV': 'development',
  },
};

// createJestConfig is exported to ensure that Next.js' Babel configuration is applied
module.exports = createJestConfig(customJestConfig);

