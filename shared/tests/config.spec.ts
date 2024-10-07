import { describe, it, expect } from '@jest/globals';
import { readConfiguration } from '../src/utils/configUtils';

describe('Test Configuration', () => {
  it('should be read from .env.local', async () => {
    const envVars = readConfiguration();
    expect(envVars).toBeDefined();
  });
});
