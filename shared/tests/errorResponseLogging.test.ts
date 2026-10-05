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

  it('accepts a URL object as input', async () => {
    const errorLog = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    respondWith(new Response('{"detail":"nope"}', { status: 400, statusText: 'Bad Request' }));
    installFftErrorResponseLogging();
    await globalThis.fetch(new URL(FFT_URL), { method: 'POST' });
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('POST'), expect.anything());
  });

  it('takes the method from a Request object', async () => {
    const errorLog = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    respondWith(new Response('{"detail":"nope"}', { status: 400, statusText: 'Bad Request' }));
    installFftErrorResponseLogging();
    await globalThis.fetch(new Request(FFT_URL, { method: 'PATCH' }));
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining('PATCH'), expect.anything());
  });

  it('stays silent when the url cannot be parsed', async () => {
    const errorLog = jest.spyOn(logger, 'error').mockImplementation(() => logger);
    respondWith(new Response('nope', { status: 400 }));
    installFftErrorResponseLogging();
    await globalThis.fetch('not-a-url');
    expect(errorLog).not.toHaveBeenCalled();
  });

  it('never breaks the request when the body cannot be read', async () => {
    const warnLog = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    const unreadable = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      clone: () => {
        throw new Error('body already consumed');
      },
    } as unknown as Response;
    respondWith(unreadable);
    installFftErrorResponseLogging();

    await expect(globalThis.fetch(FFT_URL)).resolves.toBe(unreadable);
    expect(warnLog).toHaveBeenCalledWith(expect.stringContaining('Could not read body'), expect.anything());
  });

  it('does not install itself when there is no global fetch', () => {
    const warnLog = jest.spyOn(logger, 'warn').mockImplementation(() => logger);
    const original = globalThis.fetch;
    // @ts-expect-error deliberately removing fetch for this test
    delete globalThis.fetch;
    try {
      installFftErrorResponseLogging();
      expect(globalThis.fetch).toBeUndefined();
      expect(warnLog).toHaveBeenCalledWith(expect.stringContaining('Global fetch is not available'));
    } finally {
      globalThis.fetch = original;
    }
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
