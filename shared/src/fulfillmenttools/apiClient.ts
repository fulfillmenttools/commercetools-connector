import { FftApiClient, Logger } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

import { readConfiguration } from '../utils/configUtils';
import { logger } from '../utils/loggerUtils';
import { installFftErrorResponseLogging } from './errorResponseLogging';

/**
 * Adapts our application logger to the SDK's Logger interface.
 * Without this the SDK falls back to its default, which is a *no-op* logger -
 * every message the SDK emits (failed requests, missing facilities, ...) is
 * silently discarded.
 */
const fftLogger: Logger = {
  debug: (message?: unknown, ...args: unknown[]) => logger.debug(String(message), ...args),
  error: (message?: unknown, ...args: unknown[]) => logger.error(String(message), ...args),
  info: (message?: unknown, ...args: unknown[]) => logger.info(String(message), ...args),
  log: (message?: unknown, ...args: unknown[]) => logger.info(String(message), ...args),
  warn: (message?: unknown, ...args: unknown[]) => logger.warn(String(message), ...args),
};

/**
 * Creates the fulfillmenttools API client with logging wired up.
 *
 * Note on `enableHttpLogging`: the SDK option exists and would additionally log
 * request and response bodies, which is the only way to see the body of a failed
 * fulfillmenttools response - the SDK parses it and then throws it away, keeping
 * just the status code. We deliberately leave it off: the SDK routes its
 * authentication call through the same HTTP client, so the logged request body
 * would contain FFT_API_PASSWORD in clear text. Instead we wrap `fetch` (see
 * `installFftErrorResponseLogging`), which logs the body of *failed* responses
 * from the fulfillmenttools API only - the SDK's own error messages carry the
 * status code but never the validation details.
 */
export function createFftApiClient(): FftApiClient {
  installFftErrorResponseLogging();
  const config = readConfiguration();
  return new FftApiClient(
    config.fftProjectId || '',
    config.fftApiUser || '',
    config.fftApiPassword || '',
    config.fftApiKey || '',
    { getLogger: () => fftLogger }
  );
}
