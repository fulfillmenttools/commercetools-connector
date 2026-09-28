import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextFunction, Request, Response } from 'express';

jest.mock('../src/utils/configUtils', () => ({
  readConfiguration: jest.fn(),
}));
jest.mock('../src/utils/loggerUtils', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { readConfiguration } from '../src/utils/configUtils';
import { logger } from '../src/utils/loggerUtils';
import { errorMiddleware } from '../src/middleware/errorMiddleware';
import { CustomError } from '../src/errors';

function makeRes() {
  const res = {} as { status: jest.Mock; json: jest.Mock; send: jest.Mock };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as unknown as Response;
}

const req = { method: 'POST', originalUrl: '/event' } as unknown as Request;
const next = jest.fn() as unknown as NextFunction;

describe('errorMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // debug mode is driven by DEBUG_MODE, not by the order sync feature flag
    jest
      .mocked(readConfiguration)
      .mockReturnValue({ debugmode: 'true' } as unknown as ReturnType<typeof readConfiguration>);
  });

  it('responds with CustomError statusCode and message', () => {
    const res = makeRes();
    errorMiddleware(new CustomError(422, 'Unprocessable entity'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Unprocessable entity' }));
  });

  it('includes errors array in the response body', () => {
    const res = makeRes();
    const errors = [{ statusCode: 422, message: 'field invalid' }];
    errorMiddleware(new CustomError(422, 'Validation failed', errors), req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors }));
  });

  it('responds with 500 for a generic Error', () => {
    const res = makeRes();
    errorMiddleware(new Error('unexpected'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes stack trace in the response when DEBUG_MODE is active', () => {
    const res = makeRes();
    errorMiddleware(new CustomError(400, 'bad'), req, res, next);
    const body = ((res.json as jest.Mock).mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(body.stack).toBeDefined();
  });

  it('exposes error message for generic errors when DEBUG_MODE is active', () => {
    const res = makeRes();
    errorMiddleware(new Error('detail'), req, res, next);
    const body = ((res.send as jest.Mock).mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(body.message).toBe('detail');
  });

  it('does not treat the order sync feature flag as debug mode', () => {
    jest
      .mocked(readConfiguration)
      .mockReturnValue({ featOrdersyncActive: 'true', debugmode: 'false' } as unknown as ReturnType<
        typeof readConfiguration
      >);
    const res = makeRes();
    errorMiddleware(new Error('secret detail'), req, res, next);
    const body = ((res.send as jest.Mock).mock.calls[0] as unknown[])[0] as Record<string, unknown>;
    expect(body.message).toBe('Internal server error');
  });

  it('logs unhandled errors with message, stack and request context', () => {
    errorMiddleware(new Error('boom'), req, makeRes(), next);
    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled error for POST /event',
      expect.objectContaining({
        method: 'POST',
        path: '/event',
        statusCode: 500,
        error: expect.objectContaining({ name: 'Error', message: 'boom', stack: expect.any(String) }),
      })
    );
  });

  it('logs client errors as warnings', () => {
    errorMiddleware(new CustomError(400, 'bad'), req, makeRes(), next);
    expect(logger.warn).toHaveBeenCalledWith(
      'Request failed for POST /event',
      expect.objectContaining({ statusCode: 400 })
    );
    expect(logger.error).not.toHaveBeenCalled();
  });
});
