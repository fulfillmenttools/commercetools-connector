import { FftSubscriptionService } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { AUTHORIZATION, TOKEN_VALIDITY_DAYS, generateToken } from 'shared';
import { fftEvents } from '../routes/serviceRouter';

const CUSTOM_HEADER_NAME = 'x-ocff-subscriber';
const CUSTOM_HEADER_VALUE = 'ctc-app';

export async function createFftSubscriptions(
  fftSubscriptionService: FftSubscriptionService,
  applicationUrl: string
): Promise<void> {
  const token = generateToken(TOKEN_VALIDITY_DAYS);
  if (!token) {
    throw new Error('Could not generate JWT for FFT subscription');
  }
  // get existing subscriptions
  const subscriptions = await fftSubscriptionService.getSubscriptions();
  // find out what is missing
  const matchingSubscriptions = subscriptions.subscriptions?.filter((sub) =>
    Object.keys(fftEvents).includes(sub.event)
  );
  const correctSubscriptions = matchingSubscriptions
    ?.filter((sub) => sub.callbackUrl.startsWith(applicationUrl) && hasMatchingCustomHeader(sub.headers))
    .map((sub) => sub.event);
  const toBeDeletedSubscriptions = matchingSubscriptions
    ?.filter((sub) => !(sub.callbackUrl.startsWith(applicationUrl) && hasMatchingCustomHeader(sub.headers)))
    .map((sub) => sub.id);
  const requiredSubscriptions = Object.keys(fftEvents).filter((event) => !correctSubscriptions?.includes(event));
  // delete wrong/outdated subscriptions
  if (toBeDeletedSubscriptions && toBeDeletedSubscriptions.length > 0) {
    await Promise.all(
      toBeDeletedSubscriptions.map(async (id) => {
        process.stdout.write(`Deleting wrong FFT subscription ${id}\n`);
        await fftSubscriptionService.deleteSubscription(id);
      })
    );
  }
  // create subscriptions using token and applicationUrl
  if (requiredSubscriptions && requiredSubscriptions.length > 0) {
    await Promise.all(
      requiredSubscriptions.map(async (event) => {
        const subscriptionDraft = {
          callbackUrl: callbackUrl(applicationUrl, event),
          headers: [authorizationHeader(token), customHeader()],
          event,
          name: `CTC_${event}`,
        };
        process.stdout.write(`Creating FFT subscription for ${event}\n`);
        await fftSubscriptionService.createSubscription(subscriptionDraft);
      })
    );
    process.stdout.write(`All FFT subscriptions created, done.\n`);
  } else {
    process.stdout.write(`All FFT subscriptions are present, nothing to do.\n`);
  }
}

export async function deleteFftSubscriptions(fftSubscriptionService: FftSubscriptionService): Promise<void> {
  // get existing subscriptions
  const subscriptions = await fftSubscriptionService.getSubscriptions();
  // find out which are ours
  const toBeDeletedSubscriptions = subscriptions.subscriptions
    ?.filter((sub) => Object.keys(fftEvents).includes(sub.event))
    ?.filter((sub) =>
      Object.keys(fftEvents)
        .map((k) => `CTC_${k}`)
        .includes(sub.name)
    )
    ?.map((sub) => sub.id);
  // delete our subscriptions
  if (toBeDeletedSubscriptions && toBeDeletedSubscriptions.length > 0) {
    await Promise.all(
      toBeDeletedSubscriptions.map(async (id) => {
        process.stdout.write(`Deleting FFT subscription ${id}\n`);
        await fftSubscriptionService.deleteSubscription(id);
      })
    );
    process.stdout.write(`All FFT subscriptions deleted, done.\n`);
  } else {
    process.stdout.write(`No FFT subscriptions present, nothing to do.\n`);
  }
}

function callbackUrl(applicationUrl: string, event: string): string {
  const baseUrl = applicationUrl.endsWith('/')
    ? applicationUrl.substring(0, applicationUrl.length - 1)
    : applicationUrl;
  const endpoint = fftEvents[event];
  return `${baseUrl}${endpoint}`;
}

type KeyValue = {
  key: string;
  value: string;
};

function authorizationHeader(token: string): KeyValue {
  return { key: AUTHORIZATION, value: `Bearer ${token}` };
}

function customHeader(): KeyValue {
  return { key: CUSTOM_HEADER_NAME, value: CUSTOM_HEADER_VALUE };
}

function hasMatchingCustomHeader(headers: KeyValue[]) {
  return headers?.find((kv) => kv.key === CUSTOM_HEADER_NAME && kv.value === CUSTOM_HEADER_VALUE) !== undefined;
}
