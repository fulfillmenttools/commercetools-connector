import dotenv from 'dotenv';
dotenv.config();

import { createApiRoot, logger } from 'shared';
import { deleteChannelResourceSubscription, deleteOrderStateChangedSubscription } from './actions';

async function preUndeploy(): Promise<void> {
  const apiRoot = createApiRoot();
  const actions = [deleteOrderStateChangedSubscription, deleteChannelResourceSubscription];
  await Promise.all(actions.map(async (a) => await a(apiRoot)));
}

async function run(): Promise<void> {
  try {
    await preUndeploy();
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
