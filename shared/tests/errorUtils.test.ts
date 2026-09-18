import { describe, expect, it } from '@jest/globals';

import { formatError } from '../src/utils/errorUtils';

describe('formatError', () => {
  it('keeps message and stack, which JSON.stringify drops', () => {
    const error = new Error('boom');
    expect(JSON.stringify(error)).toBe('{}'); // the behaviour this helper exists for
    const formatted = formatError(error);
    expect(formatted.name).toBe('Error');
    expect(formatted.message).toBe('boom');
    expect(formatted.stack).toEqual(expect.any(String));
  });

  it('keeps the status of an SDK-style ApiError', () => {
    class ApiError extends Error {
      public status = 400;
      public statusText = 'Bad Request';
      public type = 'response';
      constructor(message: string) {
        super(message);
        this.name = 'ApiError';
      }
    }
    const formatted = formatError(new ApiError('Did not find facility with tenantFacilityId "1000"'));
    expect(formatted).toEqual(
      expect.objectContaining({
        name: 'ApiError',
        message: 'Did not find facility with tenantFacilityId "1000"',
        status: 400,
        statusText: 'Bad Request',
        type: 'response',
      })
    );
  });

  it('keeps the statusCode of a CustomError', () => {
    const { CustomError } = jest.requireActual<typeof import('../src/errors')>('../src/errors');
    expect(formatError(new CustomError(423, 'locked')).statusCode).toBe(423);
  });

  it('unwraps a nested cause', () => {
    const error = new Error('outer');
    (error as unknown as Record<string, unknown>).cause = new Error('inner');
    expect(formatError(error).cause).toEqual(expect.objectContaining({ message: 'inner' }));
  });

  it('handles non-Error values', () => {
    expect(formatError('plain string')).toEqual({ message: 'plain string' });
    expect(formatError(undefined)).toEqual({ message: 'undefined' });
    expect(formatError({ some: 'object' })).toEqual({ some: 'object' });
  });
});
