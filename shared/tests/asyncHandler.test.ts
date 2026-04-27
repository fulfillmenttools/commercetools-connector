import { describe, expect, it, jest } from '@jest/globals';

import { asyncHandler } from '../src/middleware/asyncHandler';

function mockReqRes() {
  const req = {} as any;
  const res = {} as any;
  const next = jest.fn();
  return { req, res, next };
}

describe('asyncHandler', () => {
  it('calls the wrapped function and resolves normally', async () => {
    const { req, res, next } = mockReqRes();
    const handler = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
    await asyncHandler(handler)(req, res, next);
    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next with the error when the wrapped function rejects', async () => {
    const { req, res, next } = mockReqRes();
    const error = new Error('boom');
    const handler = jest.fn<() => Promise<void>>().mockRejectedValue(error);
    await asyncHandler(handler)(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

});
