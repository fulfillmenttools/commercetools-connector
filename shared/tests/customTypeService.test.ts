import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import {
  createCustomOrderType,
  getCustomOrderType,
  updateCustomOrderType,
} from '../src/commercetools/customTypeService';
import { ctApi, mockCustomObject, mockError, server } from '../src/mocks';
import { CUSTOM_OBJECT_CONTAINER, CUSTOM_OBJECT_KEY } from '../src/common';
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
        http.get(ctApi('/types/key=:key'), () => {
          return HttpResponse.json(mockError({ statusCode: 404 }), { status: 404 });
        })
      );
      const typeId = await getCustomOrderType();
      expect(typeId).toBeUndefined();
    });

    it('should handle errors', async () => {
      server.use(
        http.get(ctApi('/types/key=:key'), () => {
          return HttpResponse.json(mockError(), { status: 500 });
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
        http.post(ctApi('/types'), () => {
          return HttpResponse.json(mockError(), { status: 500 });
        })
      );
      await expect(async () => {
        await createCustomOrderType();
      }).rejects.toThrow(CustomError);
    });
  });

  describe('when orderCustomTypeKey is not configured', () => {
    beforeEach(() => {
      server.use(
        http.get(ctApi(`/custom-objects/${CUSTOM_OBJECT_CONTAINER}/${CUSTOM_OBJECT_KEY}`), () => {
          return HttpResponse.json(mockCustomObject({ value: {} }));
        })
      );
    });

    it('getCustomOrderType returns undefined', async () => {
      expect(await getCustomOrderType()).toBeUndefined();
    });

    it('createCustomOrderType returns undefined', async () => {
      expect(await createCustomOrderType()).toBeUndefined();
    });

    it('updateCustomOrderType returns undefined', async () => {
      expect(await updateCustomOrderType('some-id')).toBeUndefined();
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
        http.post(ctApi('/types/:id'), () => {
          return HttpResponse.json(mockError(), { status: 500 });
        })
      );
      const typeId = await getCustomOrderType();
      await expect(async () => {
        await updateCustomOrderType(typeId as string);
      }).rejects.toThrow(CustomError);
    });
  });
});
