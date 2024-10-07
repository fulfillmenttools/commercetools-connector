import { describe, expect, it } from '@jest/globals';

import { statusCode } from '../src/commercetools/statusCode';

describe('Status Code', () => {
  it('should extract status', () => {
    const status = statusCode({ status: 404 });
    expect(status).toBe(404);
  });
  it('should extract statusCode', () => {
    const status = statusCode({ statusCode: 404 });
    expect(status).toBe(404);
  });
  it('should be 500 for null', () => {
    const status = statusCode(null);
    expect(status).toBe(500);
  });
  it('should be 500 for undefined', () => {
    const status = statusCode(undefined);
    expect(status).toBe(500);
  });
  it('should be 500 for random object', () => {
    const status = statusCode({});
    expect(status).toBe(500);
  });
  it('should work on number', () => {
    const status = statusCode(404);
    expect(status).toBe(404);
  });
  it('should work on string', () => {
    const status = statusCode('404');
    expect(status).toBe(404);
  });
  it('should be 500 for unsupported type', () => {
    const fn = () => {};
    const status = statusCode(fn);
    expect(status).toBe(500);
  });
});
