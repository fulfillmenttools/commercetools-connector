import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ChannelProcessor } from '../src/channel/channelProcessor';
import { ChannelService } from '../src/services/channelService';
import { Message } from '@commercetools/platform-sdk';

const upsertFacilityMock = jest.fn();
const setFacilityOfflineMock = jest.fn();

const mockChannelService = {
  upsertFacility: upsertFacilityMock,
  setFacilityOffline: setFacilityOfflineMock,
} as unknown as ChannelService;

function makeChannelMessage(overrides = {}): Message & { notificationType?: string } {
  return {
    id: 'msg-001',
    version: 1,
    type: 'ResourceCreated',
    resource: { typeId: 'channel', id: 'channel-abc-123' },
    notificationType: 'ResourceCreated',
    resourceUserProvidedIdentifiers: { key: 'channel_key' },
    createdAt: '2023-01-01T00:00:00.000Z',
    lastModifiedAt: '2023-01-01T00:00:00.000Z',
    sequenceNumber: 1,
    resourceVersion: 1,
    ...overrides,
  } as unknown as Message & { notificationType?: string };
}

describe('ChannelProcessor', () => {
  let channelProcessor: ChannelProcessor;

  beforeEach(() => {
    channelProcessor = new ChannelProcessor(mockChannelService);
    upsertFacilityMock.mockReset();
    setFacilityOfflineMock.mockReset();
  });

  it('skips processing if resource typeId is not channel', async () => {
    const message = makeChannelMessage({ resource: { typeId: 'order', id: 'order-1' } });
    await channelProcessor.processChannel(message);
    expect(upsertFacilityMock).not.toHaveBeenCalled();
    expect(setFacilityOfflineMock).not.toHaveBeenCalled();
  });

  it('calls setFacilityOffline when notificationType is ResourceDeleted and key is present', async () => {
    setFacilityOfflineMock.mockImplementationOnce(() => Promise.resolve('fft-facility-id'));
    const message = makeChannelMessage({ notificationType: 'ResourceDeleted' });
    await channelProcessor.processChannel(message);
    expect(setFacilityOfflineMock).toHaveBeenCalledWith('channel_key');
  });

  it('skips setFacilityOffline when ResourceDeleted has no resource key', async () => {
    const message = makeChannelMessage({
      notificationType: 'ResourceDeleted',
      resourceUserProvidedIdentifiers: undefined,
    });
    await channelProcessor.processChannel(message);
    expect(setFacilityOfflineMock).not.toHaveBeenCalled();
  });

  it('calls upsertFacility when notificationType is ResourceCreated', async () => {
    upsertFacilityMock.mockImplementationOnce(() =>
      Promise.resolve({ id: 'fft-fac-1', tenantFacilityId: 'channel_key' })
    );
    const message = makeChannelMessage({ notificationType: 'ResourceCreated' });
    await channelProcessor.processChannel(message);
    expect(upsertFacilityMock).toHaveBeenCalledWith('channel-abc-123');
  });

  it('calls upsertFacility when notificationType is ResourceUpdated', async () => {
    upsertFacilityMock.mockImplementationOnce(() => Promise.resolve(undefined));
    const message = makeChannelMessage({ notificationType: 'ResourceUpdated' });
    await channelProcessor.processChannel(message);
    expect(upsertFacilityMock).toHaveBeenCalledWith('channel-abc-123');
  });

  it('does not throw when notificationType is unrecognised', async () => {
    const message = makeChannelMessage({ notificationType: 'SomeUnknownType' });
    await expect(channelProcessor.processChannel(message)).resolves.not.toThrow();
    expect(upsertFacilityMock).not.toHaveBeenCalled();
    expect(setFacilityOfflineMock).not.toHaveBeenCalled();
  });

  it('catches and absorbs errors thrown by upsertFacility', async () => {
    upsertFacilityMock.mockImplementationOnce(() => Promise.reject(new Error('FFT service unavailable')));
    const message = makeChannelMessage({ notificationType: 'ResourceCreated' });
    await expect(channelProcessor.processChannel(message)).resolves.not.toThrow();
  });

  it('catches and absorbs errors thrown by setFacilityOffline', async () => {
    setFacilityOfflineMock.mockImplementationOnce(() => Promise.reject(new Error('Facility not found')));
    const message = makeChannelMessage({ notificationType: 'ResourceDeleted' });
    await expect(channelProcessor.processChannel(message)).resolves.not.toThrow();
  });
});
