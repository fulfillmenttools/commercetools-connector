import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import {
  getCommercetoolsOrderById,
  getCustomTypeOfOrder,
  updateCommercetoolsOrder,
} from '../src/commercetools/orderService';
import { ctApi, mockCtOrder, mockError, server } from '../src/mocks';
import { CustomError } from '../src/errors';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('OrderService', () => {
  describe('getCommercetoolsOrderById', () => {
    it('should return order', async () => {
      const id = '9e539175-8dc0-4834-82ec-a44863f233b0';
      const order = await getCommercetoolsOrderById(id);
      expect(order).toBeDefined();
      expect(order.id).toBe(id);
    });

    it('should handle errors', async () => {
      server.use(
        http.get(ctApi('/orders/:id'), () => {
          return HttpResponse.json(mockError(), { status: 500 });
        })
      );
      await expect(getCommercetoolsOrderById('errorId')).rejects.toThrow(CustomError);
    });
  });

  describe('updateCommercetoolsOrder', () => {
    it('should return the updated order', async () => {
      const id = '9e539175-8dc0-4834-82ec-a44863f233b0';
      const order = await updateCommercetoolsOrder(id, { version: 1, actions: [] });
      expect(order).toBeDefined();
      expect(order.id).toBe(id);
    });

    it('should throw CustomError on failure', async () => {
      server.use(
        http.post(ctApi('/orders/:id'), () => {
          return HttpResponse.json(mockError(), { status: 500 });
        })
      );
      await expect(updateCommercetoolsOrder('errorId', { version: 1, actions: [] })).rejects.toThrow(CustomError);
    });
  });

  describe('getCustomTypeOfOrder', () => {
    it('returns the custom type key when present', () => {
      const order = mockCtOrder() as any;
      expect(getCustomTypeOfOrder(order)).toBe('fftOrderType');
    });

    it('returns undefined when no custom type is set', () => {
      const order = mockCtOrder({ custom: undefined }) as any;
      expect(getCustomTypeOfOrder(order)).toBeUndefined();
    });
  });
});
