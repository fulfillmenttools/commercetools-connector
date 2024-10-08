import dotenv from 'dotenv';
dotenv.config();

import { assertString, assertError, createApiRoot } from 'shared';
import {
  createAzureServiceBusChannelResourceSubscription,
  createAzureServiceBusOrderSubscription,
  createGcpPubSubChannelResourceSubscription,
  createGcpPubSubOrderSubscription,
} from './actions';

const CONNECT_GCP_TOPIC_NAME_KEY = 'CONNECT_GCP_TOPIC_NAME';
const CONNECT_GCP_PROJECT_ID_KEY = 'CONNECT_GCP_PROJECT_ID';
const CONNECT_AZURE_CONNECTION_STRING_KEY = 'CONNECT_AZURE_CONNECTION_STRING';
const CONNECT_PROVIDER_KEY = 'CONNECT_PROVIDER';

async function postDeploy(properties: Map<string, unknown>): Promise<void> {
  const connectProvider = properties.get(CONNECT_PROVIDER_KEY);
  assertString(connectProvider, CONNECT_PROVIDER_KEY);

  const apiRoot = createApiRoot();

  if (connectProvider === 'AZURE') {
    const connectionString = properties.get(CONNECT_AZURE_CONNECTION_STRING_KEY);
    assertString(connectionString, CONNECT_AZURE_CONNECTION_STRING_KEY);

    const actions = [createAzureServiceBusOrderSubscription, createAzureServiceBusChannelResourceSubscription];
    await Promise.all(actions.map(async (a) => await a(apiRoot, connectionString)));
  } else {
    const topicName = properties.get(CONNECT_GCP_TOPIC_NAME_KEY);
    const projectId = properties.get(CONNECT_GCP_PROJECT_ID_KEY);
    assertString(topicName, CONNECT_GCP_TOPIC_NAME_KEY);
    assertString(projectId, CONNECT_GCP_PROJECT_ID_KEY);

    const actions = [createGcpPubSubOrderSubscription, createGcpPubSubChannelResourceSubscription];
    await Promise.all(actions.map(async (a) => await a(apiRoot, topicName, projectId)));
  }
}

async function run(): Promise<void> {
  try {
    const properties = new Map(Object.entries(process.env));
    await postDeploy(properties);
  } catch (error) {
    assertError(error);
    process.stderr.write(`ERROR: Post-deploy failed: ${error.message}\n`);
    process.stderr.write(JSON.stringify(error));
    process.exitCode = 1;
  }
}

run();
