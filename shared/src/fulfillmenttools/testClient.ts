import { FftApiClient } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { readConfiguration } from '../utils';

const testFftClient = new FftApiClient(
  readConfiguration().fftProjectId,
  readConfiguration().fftApiUser,
  readConfiguration().fftApiPassword,
  readConfiguration().fftApiKey
);

export function getTestClient(): FftApiClient {
  return testFftClient;
}
