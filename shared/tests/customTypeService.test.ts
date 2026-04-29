import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';

// Hoisted by Jest before imports — makes createApiRoot a controllable jest.fn
jest.mock('../src/client', () => {
  const actual = jest.requireActual('../src/client') as { createApiRoot: () => unknown };
  return { createApiRoot: jest.fn(() => actual.createApiRoot()) };
});

import {
  createCustomOrderType,
  getCustomOrderType,
  updateCustomOrderType,
} from '../src/commercetools/customTypeService';
import { ctApi, mockCustomObject, mockCustomType, mockError, server } from '../src/mocks';
import { CUSTOM_OBJECT_CONTAINER, CUSTOM_OBJECT_KEY, CUSTOM_TYPE_NAME } from '../src/common';
import { CustomError } from '../src/errors';
import * as clientModule from '../src/client';

// jest.resetAllMocks() (run by jest.setup.cjs afterEach) clears the mock implementation
// after every test. Re-apply the real createApiRoot before each test so MSW-based tests
// continue to work without any changes.
beforeEach(() => {
  const actual = jest.requireActual('../src/client') as typeof clientModule;
  jest.mocked(clientModule.createApiRoot).mockImplementation(() => actual.createApiRoot());
});

// Builds a mock API root that returns status codes directly without throwing, allowing
// tests to exercise the defensive else/else-if branches inside the service's try blocks.
function makeMockApiRoot(overrides: {
  typesKeyGet?: Record<string, unknown>;
  typesPost?: Record<string, unknown>;
  typesIdGet?: Record<string, unknown>;
  typesIdPost?: Record<string, unknown>;
}) {
  const configBody = {
    id: 'config-id',
    version: 1,
    value: {
      orderCustomTypeKey: CUSTOM_TYPE_NAME,
      collectChannelReferenceFieldName: 'fft_supply_channel_for_click_and_collect',
    },
  };
  return {
    customObjects: () => ({
      withContainerAndKey: () => ({
        get: () => ({ execute: async () => ({ statusCode: 200, body: configBody }) }),
      }),
    }),
    types: () => ({
      withKey: () => ({
        get: () => ({
          execute: async () => overrides.typesKeyGet ?? { statusCode: 200, body: mockCustomType() },
        }),
      }),
      withId: ({ ID }: { ID: string }) => ({
        get: () => ({
          execute: async () => overrides.typesIdGet ?? { statusCode: 200, body: mockCustomType({ id: ID }) },
        }),
        post: () => ({
          execute: async () => overrides.typesIdPost ?? { statusCode: 200, body: mockCustomType({ id: ID }) },
        }),
      }),
      post: () => ({
        execute: async () => overrides.typesPost ?? { statusCode: 201, body: mockCustomType() },
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

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

    it('should return undefined when custom type by id is not found', async () => {
      server.use(
        http.get(ctApi('/types/:id'), () => {
          return HttpResponse.json(mockError({ statusCode: 404 }), { status: 404 });
        })
      );
      expect(await updateCustomOrderType('non-existent-id')).toBeUndefined();
    });

    it('should propagate errors from reading custom type by id', async () => {
      server.use(
        http.get(ctApi('/types/:id'), () => {
          return HttpResponse.json(mockError(), { status: 500 });
        })
      );
      await expect(updateCustomOrderType('some-id')).rejects.toThrow(CustomError);
    });
  });

  describe('non-throwing SDK status branches', () => {
    describe('getCustomOrderType', () => {
      it('returns undefined on a 404 result in the try block', async () => {
        jest.mocked(clientModule.createApiRoot).mockReturnValue(
          makeMockApiRoot({ typesKeyGet: { statusCode: 404 } })
        );
        expect(await getCustomOrderType()).toBeUndefined();
      });

      it('throws on a non-200/404 result in the try block', async () => {
        jest.mocked(clientModule.createApiRoot).mockReturnValue(
          makeMockApiRoot({ typesKeyGet: { statusCode: 503 } })
        );
        await expect(getCustomOrderType()).rejects.toThrow(CustomError);
      });
    });

    describe('getCustomTypeById (via updateCustomOrderType)', () => {
      it('returns undefined on a 404 result in the try block', async () => {
        jest.mocked(clientModule.createApiRoot).mockReturnValue(
          makeMockApiRoot({ typesIdGet: { statusCode: 404 } })
        );
        expect(await updateCustomOrderType('some-id')).toBeUndefined();
      });

      it('throws on a non-200/404 result in the try block', async () => {
        jest.mocked(clientModule.createApiRoot).mockReturnValue(
          makeMockApiRoot({ typesIdGet: { statusCode: 503 } })
        );
        await expect(updateCustomOrderType('some-id')).rejects.toThrow(CustomError);
      });
    });

    describe('createCustomOrderType', () => {
      it('throws on a non-201 result in the try block', async () => {
        jest.mocked(clientModule.createApiRoot).mockReturnValue(
          makeMockApiRoot({ typesPost: { statusCode: 503 } })
        );
        await expect(createCustomOrderType()).rejects.toThrow(CustomError);
      });
    });

    describe('updateCustomOrderType', () => {
      it('throws on a non-200 result from the update POST in the try block', async () => {
        jest.mocked(clientModule.createApiRoot).mockReturnValue(
          makeMockApiRoot({ typesIdPost: { statusCode: 503 } })
        );
        await expect(updateCustomOrderType('some-id')).rejects.toThrow(CustomError);
      });
    });
  });
});
