import { describe, expect, it, jest } from '@jest/globals';
import type { Request, Response } from 'express';

import { checkJwt } from '../src/middleware/checkJwt';
import { generateToken } from '../src/jwt/tokenUtils';
import { AUTHORIZATION } from '../src/common';

function makeReq(authHeader?: string): Request & { token?: unknown } {
  return {
    get: (name: string) => (name === AUTHORIZATION ? authHeader : undefined),
  } as unknown as Request & { token?: unknown };
}

function makeRes() {
  const res = {} as { status: jest.Mock; type: jest.Mock; send: jest.Mock };
  res.status = jest.fn().mockReturnValue(res);
  res.type = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as unknown as Response;
}

describe('checkJwt', () => {
  it('attaches the decoded payload to req.token and calls next for a valid JWT', () => {
    const token = generateToken(365) as string;
    const req = makeReq(`Bearer ${token}`);
    const res = makeRes();
    const next = jest.fn();

    checkJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.token).toBeDefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when no Authorization header is present', () => {
    const req = makeReq(undefined);
    const res = makeRes();
    const next = jest.fn();

    checkJwt(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', () => {
    const req = makeReq('Bearer invalid.token.value');
    const res = makeRes();
    const next = jest.fn();

    checkJwt(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Bearer prefix is missing', () => {
    const req = makeReq('some-token-without-bearer');
    const res = makeRes();
    const next = jest.fn();

    checkJwt(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
