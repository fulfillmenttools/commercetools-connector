import dotenv from 'dotenv';
dotenv.config();

import { assertString, logger } from 'shared';
import { FftApiClient, FftSubscriptionService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { deleteFftSubscriptions } from './actions';

const FFT_API_KEY = 'FFT_API_KEY';
const FFT_API_PASSWORD = 'FFT_API_PASSWORD';
const FFT_API_USER = 'FFT_API_USER';
const FFT_PROJECT_ID = 'FFT_PROJECT_ID';

async function preUndeploy(properties: Map<string, unknown>): Promise<void> {
  const fftApiKey = properties.get(FFT_API_KEY);
  const fftApiPassword = properties.get(FFT_API_PASSWORD);
  const fftApiUser = properties.get(FFT_API_USER);
  const fftProjectId = properties.get(FFT_PROJECT_ID);

  logger.info(`fftProjectId: ${FFT_PROJECT_ID} = ${fftProjectId}`);
  logger.info(`fftApiKey: ${FFT_API_KEY} = ${fftApiKey}`);
  logger.info(`fftApiUser: ${FFT_API_USER} = ${fftApiUser}`);
  logger.info(`fftApiPassword: ${FFT_API_PASSWORD} = ***`);

  assertString(fftApiKey, FFT_API_KEY);
  assertString(fftApiPassword, FFT_API_PASSWORD);
  assertString(fftApiUser, FFT_API_USER);
  assertString(fftProjectId, FFT_PROJECT_ID);

  const fftApiClient = new FftApiClient(fftProjectId, fftApiUser, fftApiPassword, fftApiKey);
  const fftSubscriptionService = new FftSubscriptionService(fftApiClient);

  await deleteFftSubscriptions(fftSubscriptionService);
}

async function run(): Promise<void> {
  try {
    const properties = new Map(Object.entries(process.env));
    await preUndeploy(properties);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Pre-undeploy failed: ${error.message}`, error);
    } else {
      logger.error(`Pre-undeploy failed: ${JSON.stringify(error)}`, error);
    }
    process.exitCode = 1;
  }
}

run();
