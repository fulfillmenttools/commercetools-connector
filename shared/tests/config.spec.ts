import { describe, it, expect, jest } from '@jest/globals';
import { readConfiguration } from '../src/utils/configUtils';

describe('Test Configuration', () => {
  it('should be read from .env.local', async () => {
    const envVars = readConfiguration();
    expect(envVars).toBeDefined();
  });

  it('throws CustomError when a required env var is missing', () => {
    const saved = process.env.CTP_CLIENT_ID;
    delete process.env.CTP_CLIENT_ID;

    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { readConfiguration: freshRead } = require('../src/utils/configUtils');
      expect(() => freshRead()).toThrow('Invalid Environment Variables');
    });

    process.env.CTP_CLIENT_ID = saved;
  });
});
