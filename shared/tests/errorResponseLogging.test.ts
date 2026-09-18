import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
  installFftErrorResponseLogging,
  uninstallFftErrorResponseLogging,
} from '../src/fulfillmenttools/errorResponseLogging';
import { logger } from '../src/utils/loggerUtils';

const FFT_URL = 'https://acme-prd.api.fulfillmenttools.com/api/orders';

function respondWith(response: Response): jest.Mock {
  const fetchMock = jest.fn(async () => response) as unknown as jest.Mock;
  globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
  return fetchMock;
}

describe('installFftErrorResponseLogging', () => {
  afterEach(() => {
    uninstallFftErrorResponseLogging();
  });

  it('logs the body of a failed fulfillmenttools response', async () => {
    const errorLog = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    const body = JSON.stringify([{ summary: 'must not be empty', description: 'orderLineItems[0].article.title' }]);
    respondWith(new Response(body, { status: 400, statusText: 'Bad Request' }));
    installFftErrorResponseLogging();

    await globalThis.fetch(FFT_URL, { method: 'POST' });

    expect(errorLog).toHaveBeenCalledWith(
      `fulfillmenttools API POST ${FFT_URL} failed with 400`,
      expect.objectContaining({ status: 400, statusText: 'Bad Request', body })
    );
  });

  it('leaves the body readable for the caller', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => logger);
    respondWith(new Response('[{"summary":"nope"}]', { status: 400 }));
    installFftErrorResponseLogging();

    const response = await globalThis.fetch(FFT_URL, { method: 'POST' });

    expect(await response.text()).toBe('[{"summary":"nope"}]');
  });

  it('stays silent on successful responses', async () => {
    const errorLog = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    respondWith(new Response('{}', { status: 201 }));
    installFftErrorResponseLogging();

    await globalThis.fetch(FFT_URL, { method: 'POST' });

    expect(errorLog).not.toHaveBeenCalled();
  });

  it('ignores other hosts, so the authentication request is never logged', async () => {
    const errorLog = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    respondWith(new Response('{"error":"INVALID_PASSWORD"}', { status: 400 }));
    installFftErrorResponseLogging();

    await globalThis.fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword', {
      method: 'POST',
      body: JSON.stringify({ password: 'super-secret' }),
    });

    expect(errorLog).not.toHaveBeenCalled();
  });

  it('wraps fetch only once', () => {
    const fetchMock = respondWith(new Response('{}'));
    installFftErrorResponseLogging();
    const wrapped = globalThis.fetch;
    installFftErrorResponseLogging();

    expect(globalThis.fetch).toBe(wrapped);
    expect(globalThis.fetch).not.toBe(fetchMock);
  });
});
