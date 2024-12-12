import { OrderProcessor } from '../src/order/orderProcessor';
import { ResourceLockedError, FftOrderServiceMock } from 'shared';
import { OrderMapper } from '../src/order/orderMapper';

import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';

import { server } from 'shared';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('OrderProcessor', () => {
  const orderMapperMock = {
    mapOrder: jest.fn(),
  };

  it('throws a ResourceLockedError if the order is currently being processed by another process', async () => {
    const orderService: FftOrderServiceMock = new FftOrderServiceMock();
    const orderProcessor: OrderProcessor = new OrderProcessor(orderService, orderMapperMock as unknown as OrderMapper);
    orderService.freeze();
    const firstPromise = orderProcessor.processOrder('123');
    const secondPromise = orderProcessor.processOrder('123');
    await expect(secondPromise).rejects.toThrow(ResourceLockedError);
    orderService.continue();
    await expect(firstPromise).resolves.not.toThrow();
  });
});
