import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { getConfiguration } from '../src/commercetools/customObjectService';
import { ctApi, mockError, server } from '../src/mocks';
import { CustomError } from '../src/errors';

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
});
