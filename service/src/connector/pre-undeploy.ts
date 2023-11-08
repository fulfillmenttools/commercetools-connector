import dotenv from 'dotenv';
dotenv.config();

import { assertError, assertString } from 'shared';
// import { FftApiClient, FftSubscriptionService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

const FFT_API_KEY = 'FFT_API_KEY';
const FFT_API_PASSWORD = 'FFT_API_PASSWORD';
const FFT_API_USER = 'FFT_API_USER';
const FFT_PROJECT_ID = 'FFT_PROJECT_ID';

async function preUndeploy(properties: Map<string, unknown>): Promise<void> {
  const fftApiKey = properties.get(FFT_API_KEY);
  const fftApiPassword = properties.get(FFT_API_PASSWORD);
  const fftApiUser = properties.get(FFT_API_USER);
  const fftProjectId = properties.get(FFT_PROJECT_ID);

  assertString(fftApiKey, FFT_API_KEY);
  assertString(fftApiPassword, FFT_API_PASSWORD);
  assertString(fftApiUser, FFT_API_USER);
  assertString(fftProjectId, FFT_PROJECT_ID);

  // const fftApiClient = new FftApiClient(fftProjectId, fftApiUser, fftApiPassword, fftApiKey);
  // const fftSubscriptionService = new FftSubscriptionService(fftApiClient);

  process.stdout.write(`Nothing to do currently in the undeploy phase`);
}

async function run(): Promise<void> {
  try {
    const properties = new Map(Object.entries(process.env));
    await preUndeploy(properties);
  } catch (error) {
    assertError(error);
    process.stderr.write(`ERROR: Pre-undeploy failed: ${error.message}\n`);
    process.stderr.write(JSON.stringify(error));
    process.exitCode = 1;
  }
}

run();
