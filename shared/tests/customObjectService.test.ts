import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';

jest.mock('../src/client', () => {
  const actual = jest.requireActual('../src/client') as { createApiRoot: () => unknown };
  return { createApiRoot: jest.fn(() => actual.createApiRoot()) };
});

import { getConfiguration } from '../src/commercetools/customObjectService';
import { ctApi, mockError, server } from '../src/mocks';
import { CustomError } from '../src/errors';
import * as clientModule from '../src/client';

beforeEach(() => {
  const actual = jest.requireActual('../src/client') as typeof clientModule;
  jest.mocked(clientModule.createApiRoot).mockImplementation(() => actual.createApiRoot());
});

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('CustomObjectService', () => {
  it('should return configuration', async () => {
    const config = await getConfiguration();
    expect(config).toBeDefined();
  });

  it('should handle errors', async () => {
    server.use(
      http.get(ctApi('/custom-objects/:container/:key'), () => {
        return HttpResponse.json(mockError(), { status: 500 });
      })
    );
    await expect(async () => {
      await getConfiguration();
    }).rejects.toThrow(CustomError);
  });

  it('should handle missing configuration', async () => {
    server.use(
      http.get(ctApi('/custom-objects/:container/:key'), () => {
        return HttpResponse.json(mockError({ statusCode: 404 }), { status: 404 });
      })
    );
    const config = await getConfiguration();
    expect(config).toBeUndefined();
  });

  describe('non-throwing SDK status branches', () => {
    it('throws on a non-200 result in the try block', async () => {
      jest.mocked(clientModule.createApiRoot).mockReturnValue({
        customObjects: () => ({
          withContainerAndKey: () => ({
            get: () => ({ execute: async () => ({ statusCode: 503 }) }),
          }),
        }),
      } as unknown as ReturnType<typeof clientModule.createApiRoot>);
      await expect(getConfiguration()).rejects.toThrow(CustomError);
    });
  });
});
