import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

const ORDER_SUBSCRIPTION_KEY = 'fft-ctc-orders';
const CHANNEL_RESOURCE_SUBSCRIPTION_KEY = 'fft-ctc-channels';

export async function createOrderSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
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
        destination: {
          type: 'GoogleCloudPubSub',
          topic: topicName,
          projectId,
        },
        messages: [
          {
            resourceTypeId: 'order',
            types: ['OrderCreated', 'OrderStateChanged'],
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

export async function createChannelResourceSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
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
        destination: {
          type: 'GoogleCloudPubSub',
          topic: topicName,
          projectId,
        },
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
