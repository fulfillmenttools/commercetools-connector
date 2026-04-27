import { describe, expect, it, jest } from '@jest/globals';

describe('authMiddlewareOptions', () => {
  it('includes the configured CTP_SCOPE in the scopes array', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { authMiddlewareOptions } = require('../src/middleware/authMiddleware');
    expect(authMiddlewareOptions.scopes[0]).toBe('dummy-scope');
  });

  it('falls back to "default" when CTP_SCOPE is not set', () => {
    const saved = process.env.CTP_SCOPE;
    delete process.env.CTP_SCOPE;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { authMiddlewareOptions } = require('../src/middleware/authMiddleware');
      expect(authMiddlewareOptions.scopes).toEqual(['default']);
    });

    process.env.CTP_SCOPE = saved;
  });
});
