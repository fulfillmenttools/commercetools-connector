import { describe, expect, it } from '@jest/globals';

import { assert, assertError, assertString } from '../src/utils/assertUtils';

describe('assertUtils', () => {
  describe('assert', () => {
    it('does not throw when condition is truthy', () => {
      expect(() => assert(true, 'should not throw')).not.toThrow();
      expect(() => assert(1, 'should not throw')).not.toThrow();
      expect(() => assert('text', 'should not throw')).not.toThrow();
    });

    it('throws with the message when condition is falsy', () => {
      expect(() => assert(false, 'something went wrong')).toThrow('Assertion failed: something went wrong');
      expect(() => assert(0, 'zero is falsy')).toThrow('Assertion failed: zero is falsy');
      expect(() => assert(null, 'null is falsy')).toThrow('Assertion failed: null is falsy');
      expect(() => assert(undefined, 'undefined is falsy')).toThrow('Assertion failed: undefined is falsy');
    });
  });

  describe('assertError', () => {
    it('does not throw for an Error instance', () => {
      expect(() => assertError(new Error('oops'))).not.toThrow();
    });

    it('throws for a non-Error value', () => {
      expect(() => assertError('not an error')).toThrow('Invalid error value');
      expect(() => assertError(42)).toThrow('Invalid error value');
      expect(() => assertError(null)).toThrow('Invalid error value');
    });

    it('uses the custom message when provided', () => {
      expect(() => assertError('x', 'custom msg')).toThrow('custom msg');
    });
  });

  describe('assertString', () => {
    it('does not throw for a string', () => {
      expect(() => assertString('hello')).not.toThrow();
      expect(() => assertString('')).not.toThrow();
    });

    it('throws for non-string values', () => {
      expect(() => assertString(42)).toThrow('Invalid string value');
      expect(() => assertString(null)).toThrow('Invalid string value');
      expect(() => assertString({})).toThrow('Invalid string value');
    });

    it('uses the custom message when provided', () => {
      expect(() => assertString(42, 'need a string')).toThrow('need a string');
    });
  });
});
