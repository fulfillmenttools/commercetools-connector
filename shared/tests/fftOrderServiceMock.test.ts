import { describe, expect, it, jest } from '@jest/globals';
import { OrderStatus } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

import { FftOrderServiceMock } from '../src/utils/fftOrderServiceMock';

describe('FftOrderServiceMock', () => {
  describe('findByTenantOrderId', () => {
    it('always returns undefined', async () => {
      const mock = new FftOrderServiceMock();
      const result = await mock.findByTenantOrderId('any-tenant-order-id');
      expect(result).toBeUndefined();
    });
  });

  describe('create', () => {
    it('returns a fixed mock order regardless of input', async () => {
      const mock = new FftOrderServiceMock();
      const order = await mock.create({} as any);
      expect(order.id).toBe('7c801788-eb1c-4afd-95d0-77e6ce377500');
      expect(order.status).toBe(OrderStatus.OPEN);
      expect(order.version).toBe(0);
      expect(order.processId).toBe('e2e199ac-f534-4fe1-a5b2-4fbb9bd679ce');
      expect(order.orderLineItems).toEqual([]);
      expect(order.consumer).toEqual({ addresses: [] });
    });
  });

  describe('freeze / continue', () => {
    it('blocks findByTenantOrderId while frozen and resolves after continue()', async () => {
      jest.useFakeTimers();
      const mock = new FftOrderServiceMock();
      mock.freeze();

      let resolved = false;
      const promise = mock.findByTenantOrderId('tenant-order').then(() => {
        resolved = true;
      });

      // Two delay iterations while still frozen — should not resolve
      await jest.advanceTimersByTimeAsync(100);
      await jest.advanceTimersByTimeAsync(100);
      expect(resolved).toBe(false);

      // Unfreeze; one more delay iteration exits the while loop
      mock.continue();
      await jest.advanceTimersByTimeAsync(100);
      await promise;

      expect(resolved).toBe(true);
    });
  });
});
