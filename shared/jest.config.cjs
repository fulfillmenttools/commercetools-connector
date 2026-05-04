/* eslint-disable @typescript-eslint/no-require-imports */
const { join } = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: join(__dirname, '.env.local') });

module.exports = {
  displayName: 'Tests Typescript Application - Shared Components',
  moduleDirectories: ['node_modules', 'src'],
  testMatch: ['**/tests/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testPathIgnorePatterns: ['<rootDir>/lib'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/mocks/**',
    '!src/types/**',
    '!src/fulfillmenttools/**',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
