/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.test.ts'],
  testTimeout: 30000, // Selenium tests require more time to load browsers
};
