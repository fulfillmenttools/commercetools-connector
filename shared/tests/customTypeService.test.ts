import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { rest } from 'msw';

import {
  createCustomOrderType,
  getCustomOrderType,
  updateCustomOrderType,
} from '../src/commercetools/customTypeService';
import { ctApi, mockError, server } from '../src/mocks';
import { CustomError } from '../src/errors';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CustomTypeService', () => {
  describe('read', () => {
    it('should return custom type id', async () => {
      const typeId = await getCustomOrderType();
      expect(typeId).toBeDefined();
    });

    it('should handle undefined custom type', async () => {
      server.use(
        rest.get(ctApi('/types/key=:key'), (_req, res, ctx) => {
          return res(ctx.status(404), ctx.json(mockError({ statusCode: 404 })));
        })
      );
      const typeId = await getCustomOrderType();
      expect(typeId).toBeUndefined();
    });

    it('should handle errors', async () => {
      server.use(
        rest.get(ctApi('/types/key=:key'), (_req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockError()));
        })
      );
      await expect(async () => {
        await getCustomOrderType();
      }).rejects.toThrow(CustomError);
    });
  });

  describe('create', () => {
    it('should create custom type', async () => {
      const typeId = await createCustomOrderType();
      expect(typeId).toBeDefined();
    });

    it('should handle errors', async () => {
      server.use(
        rest.post(ctApi('/types'), (_req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockError()));
        })
      );
      await expect(async () => {
        await createCustomOrderType();
      }).rejects.toThrow(CustomError);
    });
  });

  describe('update', () => {
    it('should add missing fields', async () => {
      const typeId = await getCustomOrderType();
      expect(typeId).toBeDefined();
      const updatedId = await updateCustomOrderType(typeId as string);
      expect(updatedId).toBe(typeId);
    });

    it('should handle errors', async () => {
      server.use(
        rest.post(ctApi('/types/:id'), (_req, res, ctx) => {
          return res(ctx.status(500), ctx.json(mockError()));
        })
      );
      const typeId = await getCustomOrderType();
      await expect(async () => {
        await updateCustomOrderType(typeId as string);
      }).rejects.toThrow(CustomError);
    });
  });
});
