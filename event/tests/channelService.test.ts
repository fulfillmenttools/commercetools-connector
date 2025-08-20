import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import { FftFacilityService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { server } from 'shared';
import { getTestClient } from 'shared';
import { ChannelService } from '../src/services/channelService';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('OrderMapper', () => {
  const facilityService: FftFacilityService = new FftFacilityService(getTestClient());

  const channelService = new ChannelService(facilityService);

  it('maps Correctly', async () => {
    const facility = await channelService.upsertFacility('123');

    expect(facility).toBeDefined();

    expect(facility?.address.city).toEqual('Köln');
    expect(facility?.address.country).toEqual('DE');
    expect(facility?.address.houseNumber).toEqual('20');
    expect(facility?.id).toEqual('store_cologne_fft_id');
    expect(facility?.address.postalCode).toEqual('51063');
    expect(facility?.status).toEqual('ONLINE');
    expect(facility?.address.street).toEqual('Schanzenstraße');
    expect(facility?.version).toEqual(1);
    expect(facility?.tenantFacilityId).toEqual('store_cologne');
  });
});
