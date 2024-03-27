import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { logger } from 'shared';

const ORDER_STATE_CHANGED_SUBSCRIPTION_KEY = 'fft-ctc-orders';
const CHANNEL_RESOURCE_SUBSCRIPTION_KEY = 'fft-ctc-channels';

export async function createOrderStateChangedSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
  logger.info(`Retrieving ${ORDER_STATE_CHANGED_SUBSCRIPTION_KEY} subscription`);
  const {
    body: { results: subscriptions },
  } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key = "${ORDER_STATE_CHANGED_SUBSCRIPTION_KEY}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    logger.info(`Deleting ${ORDER_STATE_CHANGED_SUBSCRIPTION_KEY} subscription`);
    const subscription = subscriptions[0];

    await apiRoot
      .subscriptions()
      .withKey({ key: ORDER_STATE_CHANGED_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription.version,
        },
      })
      .execute();
  }

  logger.info(`Creating ${ORDER_STATE_CHANGED_SUBSCRIPTION_KEY} subscription`);
  await apiRoot
    .subscriptions()
    .post({
      body: {
        key: ORDER_STATE_CHANGED_SUBSCRIPTION_KEY,
        destination: {
          type: 'GoogleCloudPubSub',
          topic: topicName,
          projectId,
        },
        messages: [
          {
            resourceTypeId: 'order',
            types: ['OrderStateChanged'],
          },
        ],
      },
    })
    .execute();
}

export async function deleteOrderStateChangedSubscription(apiRoot: ByProjectKeyRequestBuilder): Promise<void> {
  logger.info(`Retrieving ${ORDER_STATE_CHANGED_SUBSCRIPTION_KEY} subscription`);
  const {
    body: { results: subscriptions },
  } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key = "${ORDER_STATE_CHANGED_SUBSCRIPTION_KEY}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    logger.info(`Deleting ${ORDER_STATE_CHANGED_SUBSCRIPTION_KEY} subscription`);
    const subscription = subscriptions[0];

    await apiRoot
      .subscriptions()
      .withKey({ key: ORDER_STATE_CHANGED_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription.version,
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
  logger.info(`Retrieving ${CHANNEL_RESOURCE_SUBSCRIPTION_KEY} subscription`);
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
    logger.info(`Deleting ${CHANNEL_RESOURCE_SUBSCRIPTION_KEY} subscription`);
    const subscription = subscriptions[0];

    await apiRoot
      .subscriptions()
      .withKey({ key: CHANNEL_RESOURCE_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription.version,
        },
      })
      .execute();
  }

  logger.info(`Creating ${CHANNEL_RESOURCE_SUBSCRIPTION_KEY} subscription`);
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
  logger.info(`Retrieving ${CHANNEL_RESOURCE_SUBSCRIPTION_KEY} subscription`);
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
    logger.info(`Deleting ${CHANNEL_RESOURCE_SUBSCRIPTION_KEY} subscription`);
    const subscription = subscriptions[0];

    await apiRoot
      .subscriptions()
      .withKey({ key: CHANNEL_RESOURCE_SUBSCRIPTION_KEY })
      .delete({
        queryArgs: {
          version: subscription.version,
        },
      })
      .execute();
  }
}
