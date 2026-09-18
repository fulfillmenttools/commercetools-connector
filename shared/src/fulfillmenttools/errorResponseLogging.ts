import { logger } from '../utils/loggerUtils';

/**
 * Makes the body of failed fulfillmenttools API responses visible in the logs.
 *
 * The SDK's HTTP client parses the response body, and then throws it away:
 * on a non-2xx response it raises `FetchError(status, statusText)` and the
 * parsed body is only passed to `log.debug` when `enableHttpLogging` is on.
 * That is why a rejected order surfaces as nothing but
 * `{"name":"ApiError","type":"response","status":400,"message":"Bad Request"}` -
 * the list of validation errors that fulfillmenttools actually returned never
 * reaches us.
 *
 * `enableHttpLogging` is not an option here: the SDK sends its authentication
 * request through the same HTTP client, so the logged request body would
 * contain FFT_API_PASSWORD in clear text.
 *
 * So we wrap `fetch` instead and log the body of *failed* responses only, and
 * only for the fulfillmenttools API host. Authentication goes to
 * identitytoolkit.googleapis.com / securetoken.googleapis.com and is therefore
 * never touched.
 */
type FetchInput = Parameters<typeof globalThis.fetch>[0];
type FetchInit = Parameters<typeof globalThis.fetch>[1];

const FFT_API_HOST_SUFFIX = '.api.fulfillmenttools.com';
const MAX_LOGGED_BODY_LENGTH = 4000;

let wrappedFetch: typeof globalThis.fetch | undefined = undefined;
let originalFetch: typeof globalThis.fetch | undefined = undefined;

function requestUrl(input: FetchInput): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

function isFftApiUrl(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(FFT_API_HOST_SUFFIX);
  } catch {
    return false;
  }
}

async function logErrorResponse(method: string, url: string, response: Response): Promise<void> {
  try {
    const body = await response.clone().text();
    logger.error(`fulfillmenttools API ${method} ${url} failed with ${response.status}`, {
      status: response.status,
      statusText: response.statusText,
      body: body.length > MAX_LOGGED_BODY_LENGTH ? `${body.slice(0, MAX_LOGGED_BODY_LENGTH)}...` : body,
    });
  } catch (error) {
    // Logging must never break the request it is observing
    logger.warn(`Could not read body of failed fulfillmenttools API response for ${method} ${url}`, error);
  }
}

export function installFftErrorResponseLogging(): void {
  if (wrappedFetch && globalThis.fetch === wrappedFetch) {
    return;
  }
  const original = globalThis.fetch;
  if (typeof original !== 'function') {
    logger.warn('Global fetch is not available, fulfillmenttools error responses will not be logged');
    return;
  }
  originalFetch = original;
  wrappedFetch = async (input: FetchInput, init?: FetchInit): Promise<Response> => {
    const response = await original(input, init);
    const url = requestUrl(input);
    if (!response.ok && isFftApiUrl(url)) {
      await logErrorResponse(init?.method ?? (input instanceof Request ? input.method : 'GET'), url, response);
    }
    return response;
  };
  globalThis.fetch = wrappedFetch;
}

/** Test seam: undo the wrapping done by {@link installFftErrorResponseLogging}. */
export function uninstallFftErrorResponseLogging(): void {
  if (originalFetch && globalThis.fetch === wrappedFetch) {
    globalThis.fetch = originalFetch;
  }
  wrappedFetch = undefined;
  originalFetch = undefined;
}
