import dotenv from 'dotenv';
dotenv.config();

import { assertString, createApiRoot, logger } from 'shared';
import { createChannelResourceSubscription, createOrderStateChangedSubscription } from './actions';

const CONNECT_GCP_TOPIC_NAME_KEY = 'CONNECT_GCP_TOPIC_NAME';
const CONNECT_GCP_PROJECT_ID_KEY = 'CONNECT_GCP_PROJECT_ID';

async function postDeploy(properties: Map<string, unknown>): Promise<void> {
  const topicName = properties.get(CONNECT_GCP_TOPIC_NAME_KEY);
  const projectId = properties.get(CONNECT_GCP_PROJECT_ID_KEY);

  logger.info(`topicName: ${CONNECT_GCP_TOPIC_NAME_KEY} = ${topicName}`);
  logger.info(`projectId: ${CONNECT_GCP_PROJECT_ID_KEY} = ${projectId}`);

  assertString(topicName, CONNECT_GCP_TOPIC_NAME_KEY);
  assertString(projectId, CONNECT_GCP_PROJECT_ID_KEY);

  const apiRoot = createApiRoot();
  const actions = [createOrderStateChangedSubscription, createChannelResourceSubscription];
  await Promise.all(actions.map(async (a) => await a(apiRoot, topicName, projectId)));
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
