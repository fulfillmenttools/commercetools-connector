import { Channel, Store } from '@commercetools/platform-sdk';

export type ExpandedStore = Omit<Store, 'supplyChannels'> & {
  supplyChannels: { obj: Channel; typeId: string; id: string }[];
};
