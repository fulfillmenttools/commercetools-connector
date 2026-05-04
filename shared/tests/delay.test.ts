import { describe, expect, it, jest } from '@jest/globals';

import { delay } from '../src/utils/delay';

describe('delay', () => {
  it('resolves after the specified milliseconds', async () => {
    jest.useFakeTimers();
    const promise = delay(1000);
    jest.advanceTimersByTime(1000);
    await expect(promise).resolves.toBeUndefined();
  });

  it('does not resolve before the timeout elapses', async () => {
    jest.useFakeTimers();
    let resolved = false;
    delay(500).then(() => {
      resolved = true;
    });
    jest.advanceTimersByTime(499);
    // Allow microtask queue to flush
    await Promise.resolve();
    expect(resolved).toBe(false);
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(resolved).toBe(true);
  });
});
