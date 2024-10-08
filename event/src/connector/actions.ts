import { AzureServiceBusDestination, Destination, GoogleCloudPubSubDestination } from '@commercetools/platform-sdk';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

const ORDER_SUBSCRIPTION_KEY = 'fft-ctc-orders';
const CHANNEL_RESOURCE_SUBSCRIPTION_KEY = 'fft-ctc-channels';

export async function createGcpPubSubOrderSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
  const destination: GoogleCloudPubSubDestination = {
    type: 'GoogleCloudPubSub',
    topic: topicName,
    projectId,
  };
  await createOrderSubscription(apiRoot, destination);
}

export async function createAzureServiceBusOrderSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  connectionString: string
): Promise<void> {
  const destination: AzureServiceBusDestination = {
    type: 'AzureServiceBus',
    connectionString: connectionString,
  };
  await createOrderSubscription(apiRoot, destination);
}

async function createOrderSubscription(apiRoot: ByProjectKeyRequestBuilder, destination: Destination): Promise<void> {
  const {
    body: { results: subscriptions },
  } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key = "${ORDER_SUBSCRIPTION_KEY}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    const subscription = subscriptions[0];

    await apiRoot
      .subscriptions()
      .withKey({ key: ORDER_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription?.version || 0,
        },
      })
      .execute();
  }

  await apiRoot
    .subscriptions()
    .post({
      body: {
        key: ORDER_SUBSCRIPTION_KEY,
        destination,
        messages: [
          {
            resourceTypeId: 'order',
            types: ['OrderCreated', 'OrderDeleted', 'OrderStateChanged'],
          },
        ],
      },
    })
    .execute();
}

export async function deleteOrderSubscription(apiRoot: ByProjectKeyRequestBuilder): Promise<void> {
  const {
    body: { results: subscriptions },
  } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key = "${ORDER_SUBSCRIPTION_KEY}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    const subscription = subscriptions[0];

    await apiRoot
      .subscriptions()
      .withKey({ key: ORDER_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription?.version || 0,
        },
      })
      .execute();
  }
}

export async function createGcpPubSubChannelResourceSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
  const destination: GoogleCloudPubSubDestination = {
    type: 'GoogleCloudPubSub',
    topic: topicName,
    projectId,
  };
  await createChannelResourceSubscription(apiRoot, destination);
}

export async function createAzureServiceBusChannelResourceSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  connectionString: string
): Promise<void> {
  const destination: AzureServiceBusDestination = {
    type: 'AzureServiceBus',
    connectionString: connectionString,
  };
  await createChannelResourceSubscription(apiRoot, destination);
}

async function createChannelResourceSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  destination: Destination
): Promise<void> {
  const {
    body: { results: subscriptions },
  } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key = "${CHANNEL_RESOURCE_SUBSCRIPTION_KEY}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    const subscription = subscriptions[0];

    await apiRoot
      .subscriptions()
      .withKey({ key: CHANNEL_RESOURCE_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription?.version || 0,
        },
      })
      .execute();
  }

  await apiRoot
    .subscriptions()
    .post({
      body: {
        key: CHANNEL_RESOURCE_SUBSCRIPTION_KEY,
        destination,
        changes: [
          {
            resourceTypeId: 'channel',
          },
        ],
      },
    })
    .execute();
}

export async function deleteChannelResourceSubscription(apiRoot: ByProjectKeyRequestBuilder): Promise<void> {
  const {
    body: { results: subscriptions },
  } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key = "${CHANNEL_RESOURCE_SUBSCRIPTION_KEY}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    const subscription = subscriptions[0];

    await apiRoot
      .subscriptions()
      .withKey({ key: CHANNEL_RESOURCE_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription?.version || 0,
        },
      })
      .execute();
  }
}
