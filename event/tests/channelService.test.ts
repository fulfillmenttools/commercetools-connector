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
  });

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
