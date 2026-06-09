import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { FftFacilityService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { ctApi, http, HttpResponse, mockError, server } from 'shared';
import { ChannelService } from '../src/services/channelService';

const getFacilityIdMock = jest.fn();
const createFacilityMock = jest.fn();
const updateFacilityMock = jest.fn();
const deleteFacilityMock = jest.fn();

const mockFacilityService = {
  getFacilityId: getFacilityIdMock,
  createFacility: createFacilityMock,
  updateFacility: updateFacilityMock,
  deleteFacility: deleteFacilityMock,
} as unknown as FftFacilityService;

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  getFacilityIdMock.mockReset();
  createFacilityMock.mockReset();
  updateFacilityMock.mockReset();
  deleteFacilityMock.mockReset();
});
afterAll(() => server.close());

describe('ChannelService (event)', () => {
  const channelService = new ChannelService(mockFacilityService);

  describe('upsertFacility', () => {
    it('returns undefined if the channel is not found', async () => {
      server.use(
        http.get(ctApi('/channels/:id'), () => {
          return HttpResponse.json(mockError({ statusCode: 404 }), { status: 404 });
        })
      );
      const result = await channelService.upsertFacility('non-existing-channel');
      expect(result).toBeUndefined();
      expect(createFacilityMock).not.toHaveBeenCalled();
    });

    it('returns undefined if the channel does not have the InventorySupply role', async () => {
      server.use(
        http.get(ctApi('/channels/:id'), () => {
          return HttpResponse.json({
            id: 'ch-no-inventory',
            version: 1,
            key: 'channel_no_supply',
            roles: ['ProductDistribution'],
            createdAt: '',
            lastModifiedAt: '',
          });
        })
      );
      const result = await channelService.upsertFacility('ch-no-inventory');
      expect(result).toBeUndefined();
      expect(createFacilityMock).not.toHaveBeenCalled();
      expect(updateFacilityMock).not.toHaveBeenCalled();
    });

    it('creates a new facility when no matching facility exists in FFT', async () => {
      const createdFacility = { id: 'fft-fac-new', tenantFacilityId: 'channel_01' };
      getFacilityIdMock.mockImplementationOnce(() => Promise.resolve(undefined));
      createFacilityMock.mockImplementationOnce(() => Promise.resolve(createdFacility));

      const result = await channelService.upsertFacility('f348e5c2-e2db-4cf3-b254-41220801d2c6');

      expect(getFacilityIdMock).toHaveBeenCalledWith('channel_01', true);
      expect(createFacilityMock).toHaveBeenCalled();
      expect(updateFacilityMock).not.toHaveBeenCalled();
      expect(result).toEqual(createdFacility);
    });

    it('uses channel key as name when channel has no name (mapName fallback)', async () => {
      server.use(
        http.get(ctApi('/channels/:id'), () =>
          HttpResponse.json({
            id: 'ch-no-name',
            version: 1,
            key: 'channel_no_name',
            roles: ['InventorySupply'],
            createdAt: '',
            lastModifiedAt: '',
          })
        )
      );
      const createdFacility = { id: 'fft-fac-no-name', tenantFacilityId: 'channel_no_name' };
      getFacilityIdMock.mockImplementationOnce(() => Promise.resolve(undefined));
      createFacilityMock.mockImplementationOnce(() => Promise.resolve(createdFacility));

      const result = await channelService.upsertFacility('ch-no-name');
      expect(result).toEqual(createdFacility);
      expect(createFacilityMock).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'channel_no_name' })
      );
    });

    it('uses default address values when channel has no address (mapAddress else-branch)', async () => {
      server.use(
        http.get(ctApi('/channels/:id'), () =>
          HttpResponse.json({
            id: 'ch-no-address',
            version: 1,
            key: 'channel_no_address',
            roles: ['InventorySupply'],
            createdAt: '',
            lastModifiedAt: '',
          })
        )
      );
      const createdFacility = { id: 'fft-fac-no-addr', tenantFacilityId: 'channel_no_address' };
      getFacilityIdMock.mockImplementationOnce(() => Promise.resolve(undefined));
      createFacilityMock.mockImplementationOnce(() => Promise.resolve(createdFacility));

      const result = await channelService.upsertFacility('ch-no-address');
      expect(result).toEqual(createdFacility);
      expect(createFacilityMock).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.objectContaining({ street: 'not set', houseNumber: '0' }),
        })
      );
    });

    it('updates the existing facility when one already exists in FFT', async () => {
      const updatedFacility = { id: 'existing-fac-id', tenantFacilityId: 'channel_01' };
      getFacilityIdMock.mockImplementationOnce(() => Promise.resolve('existing-fac-id'));
      updateFacilityMock.mockImplementationOnce(() => Promise.resolve(updatedFacility));

      const result = await channelService.upsertFacility('f348e5c2-e2db-4cf3-b254-41220801d2c6');

      expect(updateFacilityMock).toHaveBeenCalledWith('existing-fac-id', expect.objectContaining({
        tenantFacilityId: 'channel_01',
      }));
      expect(createFacilityMock).not.toHaveBeenCalled();
      expect(result).toEqual(updatedFacility);
    });

    it('uses fallback values when address fields are empty strings', async () => {
      server.use(
        http.get(ctApi('/channels/:id'), () =>
          HttpResponse.json({
            id: 'ch-empty-fields',
            version: 1,
            key: 'channel_empty_fields',
            roles: ['InventorySupply'],
            createdAt: '',
            lastModifiedAt: '',
            address: {
              streetName: '',
              streetNumber: '',
              postalCode: '',
              city: '',
              state: '',
              country: '',
            },
          })
        )
      );
      const createdFacility = { id: 'fft-fac-empty', tenantFacilityId: 'channel_empty_fields' };
      getFacilityIdMock.mockImplementationOnce(() => Promise.resolve(undefined));
      createFacilityMock.mockImplementationOnce(() => Promise.resolve(createdFacility));

      const result = await channelService.upsertFacility('ch-empty-fields');
      expect(result).toEqual(createdFacility);
      expect(createFacilityMock).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.objectContaining({
            street: 'not set',
            houseNumber: '0',
            postalCode: '00000',
            city: 'not set',
            country: 'DE',
          }),
        })
      );
    });

    it('uses DE as default country when project has no countries', async () => {
      server.use(
        http.get(ctApi(''), () =>
          HttpResponse.json({
            key: 'test-project',
            name: 'Test Project',
            countries: [],
            currencies: ['EUR'],
            languages: ['en-US'],
            version: 1,
          })
        )
      );
      const createdFacility = { id: 'fft-fac-de', tenantFacilityId: 'channel_01' };
      getFacilityIdMock.mockImplementationOnce(() => Promise.resolve(undefined));
      createFacilityMock.mockImplementationOnce(() => Promise.resolve(createdFacility));

      const result = await channelService.upsertFacility('f348e5c2-e2db-4cf3-b254-41220801d2c6');
      expect(result).toEqual(createdFacility);
      expect(createFacilityMock).toHaveBeenCalledWith(
        expect.objectContaining({
          address: expect.objectContaining({ country: 'DE' }),
        })
      );
    });
  });  // end upsertFacility

  describe('setFacilityOffline', () => {
    it('calls deleteFacility with the tenant facility id and soft-delete flag', async () => {
      deleteFacilityMock.mockImplementationOnce(() => Promise.resolve('fft-fac-id'));
      const result = await channelService.setFacilityOffline('my-facility-key');
      expect(deleteFacilityMock).toHaveBeenCalledWith('my-facility-key', false);
      expect(result).toEqual('fft-fac-id');
    });

    it('returns undefined when the facility does not exist in FFT', async () => {
      deleteFacilityMock.mockImplementationOnce(() => Promise.resolve(undefined));
      const result = await channelService.setFacilityOffline('unknown-facility');
      expect(result).toBeUndefined();
    });
  });
});
