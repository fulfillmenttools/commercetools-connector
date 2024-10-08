import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { rest } from 'msw';

import { getCommercetoolsOrderById } from '../src/commercetools/orderService';
import { ctApi, mockError, server } from '../src/mocks';
import { CustomError } from '../src/errors';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('OrderService', () => {
  it('should return order', async () => {
    const id = '9e539175-8dc0-4834-82ec-a44863f233b0';
    const order = await getCommercetoolsOrderById(id);
    expect(order).toBeDefined();
    expect(order.id).toBe(id);
  });

  it('should handle errors', async () => {
    server.use(
      rest.get(ctApi('/orders/:id'), (_req, res, ctx) => {
        return res(ctx.status(500), ctx.json(mockError()));
      })
    );
    await expect(async () => {
      await getCommercetoolsOrderById('errorId');
    }).rejects.toThrow(CustomError);
  });
});
