import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { http, HttpResponse } from 'msw';

jest.mock('../src/client', () => {
  const actual = jest.requireActual('../src/client') as { createApiRoot: () => unknown };
  return { createApiRoot: jest.fn(() => actual.createApiRoot()) };
});

import { getChannelById } from '../src/commercetools/channelService';
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

describe('ChannelService', () => {
  it('should return channel', async () => {
    const channelId = '4060a3a4-3080-4432-b27c-aef354a6a159';
    const channel = await getChannelById(channelId);
    expect(channel).toBeDefined();
  });

  it('should handle errors', async () => {
    const channelId = 'aa9d035e-7206-4c74-8646-b8588a4c72a2';
    server.use(
      http.get(ctApi('/channels/:id'), () => {
        return HttpResponse.json(mockError(), { status: 500 });
      })
    );
    await expect(async () => {
      await getChannelById(channelId);
    }).rejects.toThrow(CustomError);
  });

  it('should handle missing channel', async () => {
    const channelId = 'feee62d0-f944-413c-9b27-4c3390a12120';
    server.use(
      http.get(ctApi('/channels/:id'), () => {
        return HttpResponse.json(mockError({ statusCode: 404 }), { status: 404 });
      })
    );
    const channel = await getChannelById(channelId);
    expect(channel).toBeUndefined();
  });

  describe('non-throwing SDK status branches', () => {
    it('throws on a non-200 result in the try block', async () => {
      jest.mocked(clientModule.createApiRoot).mockReturnValue({
        channels: () => ({
          withId: () => ({
            get: () => ({ execute: async () => ({ statusCode: 503 }) }),
          }),
        }),
      } as unknown as ReturnType<typeof clientModule.createApiRoot>);
      await expect(getChannelById('any-id')).rejects.toThrow(CustomError);
    });
  });
});
