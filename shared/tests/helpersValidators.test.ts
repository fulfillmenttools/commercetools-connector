import { describe, expect, it } from '@jest/globals';

import {
  array,
  getValidateMessages,
  optional,
  region,
  standardEmail,
  standardKey,
  standardNaturalNumber,
  standardString,
  standardUrl,
} from '../src/validators/helpersValidators';

const errorMsg = { code: 'E', message: 'invalid', referencedBy: 'test' };

describe('standardString', () => {
  const validator = standardString(['value'], errorMsg, { min: 3, max: 10 });

  it('passes for a valid string within bounds', () => {
    expect(getValidateMessages([validator], { value: 'hello' })).toEqual([]);
  });

  it('fails for a string that is too short', () => {
    expect(getValidateMessages([validator], { value: 'ab' })).toEqual([errorMsg]);
  });

  it('fails for undefined', () => {
    expect(getValidateMessages([validator], { value: undefined })).toEqual([errorMsg]);
  });
});

describe('standardEmail', () => {
  const validator = standardEmail(['email'], errorMsg);

  it('passes for a valid email', () => {
    expect(getValidateMessages([validator], { email: 'user@example.com' })).toEqual([]);
  });

  it('fails for an invalid email', () => {
    expect(getValidateMessages([validator], { email: 'not-an-email' })).toEqual([errorMsg]);
  });

  it('fails for undefined', () => {
    expect(getValidateMessages([validator], { email: undefined })).toEqual([errorMsg]);
  });
});

describe('standardKey', () => {
  const validator = standardKey(['key'], errorMsg);

  it('passes for a valid key', () => {
    expect(getValidateMessages([validator], { key: 'my-key_01' })).toEqual([]);
  });

  it('fails for a key with special characters', () => {
    expect(getValidateMessages([validator], { key: 'invalid key!' })).toEqual([errorMsg]);
  });

  it('fails for a single character key', () => {
    expect(getValidateMessages([validator], { key: 'x' })).toEqual([errorMsg]);
  });
});

describe('standardNaturalNumber', () => {
  const validator = standardNaturalNumber(['num'], errorMsg);

  it('passes for a numeric string', () => {
    expect(getValidateMessages([validator], { num: '42' })).toEqual([]);
  });

  it('fails for a non-numeric string', () => {
    expect(getValidateMessages([validator], { num: 'abc' })).toEqual([errorMsg]);
  });

  it('fails for undefined', () => {
    expect(getValidateMessages([validator], { num: undefined })).toEqual([errorMsg]);
  });
});

describe('standardUrl', () => {
  const validator = standardUrl(['url'], errorMsg);

  it('passes for a valid https URL', () => {
    expect(getValidateMessages([validator], { url: 'https://example.com' })).toEqual([]);
  });

  it('fails for a URL without protocol', () => {
    expect(getValidateMessages([validator], { url: 'example.com' })).toEqual([errorMsg]);
  });

  it('fails for undefined', () => {
    expect(getValidateMessages([validator], { url: undefined })).toEqual([errorMsg]);
  });
});

describe('region', () => {
  const validator = region(['region'], errorMsg);

  it('passes for a valid region', () => {
    expect(getValidateMessages([validator], { region: 'europe-west1.gcp' })).toEqual([]);
    expect(getValidateMessages([validator], { region: 'us-central1.gcp' })).toEqual([]);
  });

  it('fails for an unknown region', () => {
    expect(getValidateMessages([validator], { region: 'unknown-region' })).toEqual([errorMsg]);
  });

  it('fails for undefined', () => {
    expect(getValidateMessages([validator], { region: undefined })).toEqual([errorMsg]);
  });
});

describe('optional', () => {
  const validator = optional(standardString)(['value'], errorMsg, { min: 3, max: 10 });

  it('passes when value is undefined', () => {
    expect(getValidateMessages([validator], { value: undefined })).toEqual([]);
  });

  it('still validates when value is present and valid', () => {
    expect(getValidateMessages([validator], { value: 'hello' })).toEqual([]);
  });

  it('still validates when value is present and invalid', () => {
    expect(getValidateMessages([validator], { value: 'ab' })).toEqual([errorMsg]);
  });
});

describe('array', () => {
  const validator = array(standardString)(['items'], errorMsg, { min: 2, max: 20 });

  it('passes for an array of valid strings', () => {
    expect(getValidateMessages([validator], { items: ['hello', 'world'] })).toEqual([]);
  });

  it('fails for an array containing an invalid string', () => {
    expect(getValidateMessages([validator], { items: ['hello', 'x'] })).toEqual([errorMsg]);
  });

  it('fails for a non-array value', () => {
    expect(getValidateMessages([validator], { items: 'not-an-array' })).toEqual([errorMsg]);
  });
});
