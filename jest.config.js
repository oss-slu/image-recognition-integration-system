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
};

// createJestConfig is exported to ensure that Next.js' babel configuration is applied
module.exports = createJestConfig(customJestConfig);
