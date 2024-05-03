import dotenv from 'dotenv';
dotenv.config();

import { assertError, createApiRoot } from 'shared';
import { deleteChannelResourceSubscription, deleteOrderSubscription } from './actions';

async function preUndeploy(): Promise<void> {
  const apiRoot = createApiRoot();
  const actions = [deleteOrderSubscription, deleteChannelResourceSubscription];
  await Promise.all(actions.map(async (a) => await a(apiRoot)));
}

async function run(): Promise<void> {
  try {
    await preUndeploy();
  } catch (error) {
    assertError(error);
    process.stderr.write(`ERROR: Post-undeploy failed: ${error.message}\n`);
    process.stderr.write(JSON.stringify(error));
    process.exitCode = 1;
  }
}

run();
