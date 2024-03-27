import dotenv from 'dotenv';
dotenv.config();

import { assertString, logger } from 'shared';
import { FftApiClient, FftSubscriptionService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { createFftSubscriptions } from './actions';

const FFT_API_KEY = 'FFT_API_KEY';
const FFT_API_PASSWORD = 'FFT_API_PASSWORD';
const FFT_API_USER = 'FFT_API_USER';
const FFT_PROJECT_ID = 'FFT_PROJECT_ID';
const CONNECT_APPLICATION_URL_KEY = 'CONNECT_SERVICE_URL';

async function postDeploy(properties: Map<string, unknown>): Promise<void> {
  const fftApiKey = properties.get(FFT_API_KEY);
  const fftApiPassword = properties.get(FFT_API_PASSWORD);
  const fftApiUser = properties.get(FFT_API_USER);
  const fftProjectId = properties.get(FFT_PROJECT_ID);
  const applicationUrl = properties.get(CONNECT_APPLICATION_URL_KEY);

  logger.info(`fftProjectId: ${FFT_PROJECT_ID} = ${fftProjectId}`);
  logger.info(`fftApiKey: ${FFT_API_KEY} = ${fftApiKey}`);
  logger.info(`fftApiUser: ${FFT_API_USER} = ${fftApiUser}`);
  logger.info(`fftApiPassword: ${FFT_API_PASSWORD} = ***`);
  logger.info(`applicationUrl: ${CONNECT_APPLICATION_URL_KEY} = ${applicationUrl}`);

  assertString(fftApiKey, FFT_API_KEY);
  assertString(fftApiPassword, FFT_API_PASSWORD);
  assertString(fftApiUser, FFT_API_USER);
  assertString(fftProjectId, FFT_PROJECT_ID);
  assertString(applicationUrl, CONNECT_APPLICATION_URL_KEY);

  const fftApiClient = new FftApiClient(fftProjectId, fftApiUser, fftApiPassword, fftApiKey);
  const fftSubscriptionService = new FftSubscriptionService(fftApiClient);

  await createFftSubscriptions(fftSubscriptionService, applicationUrl);
}

async function run(): Promise<void> {
  try {
    const properties = new Map(Object.entries(process.env));
    await postDeploy(properties);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Post-deploy failed: ${error.message}`, error);
    } else {
      logger.error(`Post-deploy failed: ${JSON.stringify(error)}`, error);
    }
    process.exitCode = 1;
  }
}

run();
