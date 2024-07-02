import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

const ORDER_SUBSCRIPTION_KEY = 'fft-ctc-orders';
const CHANNEL_RESOURCE_SUBSCRIPTION_KEY = 'fft-ctc-channels';
const PRODUCT_SUBSCRIPTION_KEY = 'fft-ctc-products';

export async function createOrderSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
  await deleteOrderSubscription(apiRoot);

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
            types: ['OrderCreated', 'OrderDeleted', 'OrderStateChanged'],
          },
        ],
      },
    })
    .execute();
}

export async function deleteOrderSubscription(apiRoot: ByProjectKeyRequestBuilder): Promise<void> {
  await deleteSubscription(ORDER_SUBSCRIPTION_KEY, apiRoot);
}

export async function createChannelResourceSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
  await deleteChannelResourceSubscription(apiRoot);

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
  await deleteSubscription(CHANNEL_RESOURCE_SUBSCRIPTION_KEY, apiRoot);
}

export async function createProductSubscription(
  apiRoot: ByProjectKeyRequestBuilder,
  topicName: string,
  projectId: string
): Promise<void> {
  await deleteProductSubscription(apiRoot);

  await apiRoot
    .subscriptions()
    .post({
      body: {
        key: PRODUCT_SUBSCRIPTION_KEY,
        destination: {
          type: 'GoogleCloudPubSub',
          topic: topicName,
          projectId,
        },
        messages: [
          {
            resourceTypeId: 'product',
            types: ['ProductPublished'],
          },
        ],
      },
    })
    .execute();
}

export async function deleteProductSubscription(apiRoot: ByProjectKeyRequestBuilder): Promise<void> {
  await deleteSubscription(PRODUCT_SUBSCRIPTION_KEY, apiRoot);
}

async function deleteSubscription(key: string, apiRoot: ByProjectKeyRequestBuilder): Promise<void> {
  const {
    body: { results: subscriptions },
  } = await apiRoot
    .subscriptions()
    .get({
      queryArgs: {
        where: `key = "${key}"`,
      },
    })
    .execute();

  if (subscriptions.length > 0) {
    const subscription = subscriptions[0];

    await apiRoot
      .subscriptions()
      .withKey({ key })
      .delete({
        queryArgs: {
          version: subscription?.version || 0,
        },
      })
      .execute();
  }
}
