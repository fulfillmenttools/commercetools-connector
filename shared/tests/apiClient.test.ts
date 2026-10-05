import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../src/utils/loggerUtils', () => ({
  logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() },
}));

import { FftApiClient } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { createFftApiClient } from '../src/fulfillmenttools/apiClient';
import { uninstallFftErrorResponseLogging } from '../src/fulfillmenttools/errorResponseLogging';
import { logger } from '../src/utils/loggerUtils';

describe('createFftApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    uninstallFftErrorResponseLogging();
  });

  it('gives the SDK a logger that reaches our application logger', () => {
    // This is the whole reason the factory exists: the SDK's default is a no-op
    // logger, so everything it reports - a missing facility, a failed request -
    // used to be discarded before it ever reached a log.
    const sdkLogger = createFftApiClient().getLogger();

    sdkLogger.error("Did not find facility with tenantFacilityId '1000'.");
    sdkLogger.warn('warned');
    sdkLogger.info('informed');
    sdkLogger.debug('debugged');
    sdkLogger.log('logged');

    expect(logger.error).toHaveBeenCalledWith("Did not find facility with tenantFacilityId '1000'.");
    expect(logger.warn).toHaveBeenCalledWith('warned');
    expect(logger.info).toHaveBeenCalledWith('informed');
    expect(logger.debug).toHaveBeenCalledWith('debugged');
    // the SDK's Logger interface has `log`, our application logger does not
    expect(logger.info).toHaveBeenCalledWith('logged');
  });

  it('forwards the additional arguments the SDK passes along', () => {
    const cause = new Error('boom');
    createFftApiClient().getLogger().error('Could not create order.', cause);
    expect(logger.error).toHaveBeenCalledWith('Could not create order.', cause);
  });

  it('documents why: a client built without the factory swallows everything', () => {
    // Guards against silently losing the logger again, e.g. after an SDK upgrade
    new FftApiClient('p', 'u', 'pw', 'k').getLogger().error('this disappears');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('installs the error response logging for fulfillmenttools calls', () => {
    const before = globalThis.fetch;
    createFftApiClient();
    expect(globalThis.fetch).not.toBe(before);
  });
});
