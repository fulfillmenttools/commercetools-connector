/* eslint-disable @typescript-eslint/no-require-imports */
const matchers = require('jest-extended');
const { resetAllWhenMocks } = require('jest-when');

expect.extend(matchers);

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
  resetAllWhenMocks();
});

afterAll(() => {
  jest.clearAllMocks();
});
