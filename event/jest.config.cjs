/* eslint-disable @typescript-eslint/no-var-requires */
const { join } = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: join(__dirname, '.env.local') });

module.exports = {
  displayName: 'Tests Typescript Application - Event',
  moduleDirectories: ['node_modules', 'src'],
  testMatch: ['**/tests/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  testPathIgnorePatterns: ['build'],
};
