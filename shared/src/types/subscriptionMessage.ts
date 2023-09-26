import { Message as PlatformMessage } from '@commercetools/platform-sdk';

export type SubscriptionMessage = PlatformMessage & {
  projectKey: string;
  notificationType: string;
};
