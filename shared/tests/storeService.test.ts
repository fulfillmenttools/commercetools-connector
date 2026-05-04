import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { http, HttpResponse } from 'msw';

import { StoreService } from '../src/commercetools/storeService';
import { ctApi, mockError, mockStore, server } from '../src/mocks';
import { CustomError } from '../src/errors';
import { channelCologne, channelHamburg } from '../src/mocks/ctEntities';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('StoreService', () => {
  const service = new StoreService();

  describe('query', () => {
    it('returns a list of stores', async () => {
      server.use(
        http.get(ctApi('/stores'), () => {
          return HttpResponse.json({ results: [mockStore({ id: 'store-1' }), mockStore({ id: 'store-2' })] });
        })
      );
      const stores = await service.query();
      expect(stores).toHaveLength(2);
      expect(stores[0]?.id).toBe('store-1');
    });

    it('throws CustomError on failure', async () => {
      server.use(
        http.get(ctApi('/stores'), () => {
          return HttpResponse.json(mockError(), { status: 500 });
        })
      );
      await expect(service.query()).rejects.toThrow(CustomError);
    });
  });

  describe('getById', () => {
    it('returns a store by ID', async () => {
      const storeId = 'abc123';
      server.use(
        http.get(ctApi(`/stores/${storeId}`), () => {
          return HttpResponse.json(mockStore({ id: storeId }));
        })
      );
      const store = await service.getById(storeId);
      expect(store.id).toBe(storeId);
    });

    it('throws CustomError on failure', async () => {
      server.use(
        http.get(ctApi('/stores/:id'), () => {
          return HttpResponse.json(mockError(), { status: 500 });
        })
      );
      await expect(service.getById('bad-id')).rejects.toThrow(CustomError);
    });
  });

  describe('getByKeyWithChannels', () => {
    it('returns the store with expanded supply channels', async () => {
      const store = await service.getByKeyWithChannels('store_01');
      expect(store).toBeDefined();
      expect(store.supplyChannels).toHaveLength(2);
      expect(store.supplyChannels[0]?.obj).toEqual(channelCologne);
      expect(store.supplyChannels[1]?.obj).toEqual(channelHamburg);
    });

    it('throws CustomError on failure', async () => {
      server.use(
        http.get(ctApi('/stores/key=bad-key'), () => {
          return HttpResponse.json(mockError(), { status: 500 });
        })
      );
      await expect(service.getByKeyWithChannels('bad-key')).rejects.toThrow(CustomError);
    });
  });
});
