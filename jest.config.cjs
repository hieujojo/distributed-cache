/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  reporters: [
    'default',
    [
      'jest-html-reporter',
      {
        pageTitle: 'Distributed Cache — Test Report',
        outputPath: 'test-report/index.html',
        includeFailureMsg: true,
        includeSuiteFailure: true,
        sortBy: 'status',
      },
    ],
  ],
};
