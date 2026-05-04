import { describe, expect, it } from '@jest/globals';

import { AmbiguousChannelError } from '../src/errors/ambiguousChannelError';
import { CustomError, isErrorItem } from '../src/errors/customError';
import { isHttpError } from '../src/errors/httpError';
import { ResourceLockedError } from '../src/errors/resourceLockedError';

describe('CustomError', () => {
  it('sets statusCode and message', () => {
    const err = new CustomError(404, 'Not found');
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Not found');
    expect(err.errors).toBeUndefined();
  });

  it('stores optional errors array', () => {
    const errors = [{ statusCode: 404, message: 'item missing' }];
    const err = new CustomError(400, 'Bad request', errors);
    expect(err.errors).toEqual(errors);
  });

  it('is an instance of Error', () => {
    const err = new CustomError(500, 'server error');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(CustomError);
  });
});

describe('isErrorItem', () => {
  it('returns true for a valid error item', () => {
    expect(isErrorItem({ statusCode: 400, message: 'bad' })).toBe(true);
    expect(isErrorItem({ statusCode: 'ERR', message: 'bad', referencedBy: 'x' })).toBe(true);
  });

  it('returns false for invalid values', () => {
    expect(isErrorItem(null)).toBe(false);
    expect(isErrorItem(undefined)).toBe(false);
    expect(isErrorItem('string')).toBe(false);
    expect(isErrorItem({ message: 'only message' })).toBe(false);
    expect(isErrorItem({ statusCode: 400 })).toBe(false);
  });
});

describe('AmbiguousChannelError', () => {
  it('sets statusCode to 400', () => {
    const err = new AmbiguousChannelError('ambiguous channel');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('ambiguous channel');
  });

  it('is an instance of CustomError', () => {
    const err = new AmbiguousChannelError('msg');
    expect(err).toBeInstanceOf(CustomError);
    expect(err).toBeInstanceOf(AmbiguousChannelError);
  });
});

describe('ResourceLockedError', () => {
  it('sets statusCode to 423', () => {
    const err = new ResourceLockedError('locked');
    expect(err.statusCode).toBe(423);
    expect(err.message).toBe('locked');
  });

  it('is an instance of CustomError', () => {
    const err = new ResourceLockedError('locked');
    expect(err).toBeInstanceOf(CustomError);
    expect(err).toBeInstanceOf(ResourceLockedError);
  });
});

describe('isHttpError', () => {
  it('returns true when object has message and status', () => {
    expect(isHttpError({ message: 'err', status: 404, name: 'NotFound' })).toBe(true);
  });

  it('returns false for missing fields', () => {
    expect(isHttpError(null)).toBe(false);
    expect(isHttpError(undefined)).toBe(false);
    expect(isHttpError({ message: 'err' })).toBe(false);
    expect(isHttpError({ status: 404 })).toBe(false);
    expect(isHttpError('string')).toBe(false);
  });
});
