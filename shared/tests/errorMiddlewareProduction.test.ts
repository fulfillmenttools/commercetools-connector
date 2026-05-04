import { describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

jest.mock('../src/utils/configUtils', () => ({
  readConfiguration: jest.fn(),
}));

import { readConfiguration } from '../src/utils/configUtils';
import { errorMiddleware } from '../src/middleware/errorMiddleware';
import { CustomError } from '../src/errors';

function makeRes() {
  const res = {} as { status: jest.Mock; json: jest.Mock; send: jest.Mock };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as unknown as Response;
}

const req = {} as unknown as Request;
const next = jest.fn() as unknown as NextFunction;

describe('errorMiddleware (production mode)', () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.mocked(readConfiguration).mockReturnValue({ featOrdersyncActive: 'false' } as unknown as ReturnType<typeof readConfiguration>);
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('omits the stack trace from a CustomError response', () => {
    const res = makeRes();
    errorMiddleware(new CustomError(400, 'bad request'), req, res, next);
    const body = ((res.json as jest.Mock).mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(body.stack).toBeUndefined();
  });

  it('returns a generic "Internal server error" message for non-CustomError', () => {
    const res = makeRes();
    errorMiddleware(new Error('secret detail'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    const body = ((res.send as jest.Mock).mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(body.message).toBe('Internal server error');
  });
});
