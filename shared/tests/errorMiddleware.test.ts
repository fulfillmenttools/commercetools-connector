import { describe, expect, it, jest } from '@jest/globals';

import { errorMiddleware } from '../src/middleware/errorMiddleware';
import { CustomError } from '../src/errors';

function makeRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

const req = {} as any;
const next = jest.fn() as any;

describe('errorMiddleware', () => {
  it('responds with CustomError statusCode and message', () => {
    const res = makeRes();
    const error = new CustomError(422, 'Unprocessable entity');
    errorMiddleware(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Unprocessable entity' })
    );
  });

  it('includes errors array in the response body', () => {
    const res = makeRes();
    const errors = [{ statusCode: 422, message: 'field invalid' }];
    const error = new CustomError(422, 'Validation failed', errors);
    errorMiddleware(error, req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ errors }));
  });

  it('responds with 500 for a generic Error', () => {
    const res = makeRes();
    const error = new Error('unexpected');
    errorMiddleware(error, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('includes stack trace in the response when debug mode is active (featOrdersyncActive=true)', () => {
    const res = makeRes();
    errorMiddleware(new CustomError(400, 'bad'), req, res, next);
    const body = ((res.json as jest.Mock).mock.calls[0] as any[])[0] as any;
    expect(body.stack).toBeDefined();
  });

  it('exposes error message for generic errors when debug mode is active', () => {
    const res = makeRes();
    errorMiddleware(new Error('detail'), req, res, next);
    const body = ((res.send as jest.Mock).mock.calls[0] as any[])[0] as any;
    expect(body.message).toBe('detail');
  });
});
