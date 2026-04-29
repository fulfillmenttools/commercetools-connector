import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';

jest.mock('../src/client', () => {
  const actual = jest.requireActual('../src/client') as { createApiRoot: () => unknown };
  return { createApiRoot: jest.fn(() => actual.createApiRoot()) };
});

import {
  getCommercetoolsOrderById,
  getCustomTypeOfOrder,
  updateCommercetoolsOrder,
} from '../src/commercetools/orderService';
import { ctApi, mockCtOrder, mockError, server } from '../src/mocks';
import { CustomError } from '../src/errors';
import * as clientModule from '../src/client';

beforeEach(() => {
  const actual = jest.requireActual('../src/client') as typeof clientModule;
  jest.mocked(clientModule.createApiRoot).mockImplementation(() => actual.createApiRoot());
});

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

  describe('non-throwing SDK status branches', () => {
    it('getCommercetoolsOrderById throws on a non-200 result in the try block', async () => {
      jest.mocked(clientModule.createApiRoot).mockReturnValue({
        orders: () => ({
          withId: () => ({
            get: () => ({ execute: async () => ({ statusCode: 503 }) }),
          }),
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      await expect(getCommercetoolsOrderById('any-id')).rejects.toThrow(CustomError);
    });

    it('updateCommercetoolsOrder throws on a non-200 result in the try block', async () => {
      jest.mocked(clientModule.createApiRoot).mockReturnValue({
        orders: () => ({
          withId: () => ({
            post: () => ({ execute: async () => ({ statusCode: 503 }) }),
          }),
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      await expect(updateCommercetoolsOrder('any-id', { version: 1, actions: [] })).rejects.toThrow(CustomError);
    });
  });
});
